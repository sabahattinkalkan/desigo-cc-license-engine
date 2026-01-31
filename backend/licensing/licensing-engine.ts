// --- Type Definitions ---

export type DisciplineKey = 'BA' | 'FIRE' | 'ELEC' | 'SCADA' | 'METER' | 'SEC' | 'VALID';
export type FeatureSetKey = 'COMPACT_BA' | 'COMPACT_DMS' | 'COMPACT_ELEC' | 'COMPACT_VM' | 'STANDARD';
export type UtilizationZone = 'GREEN' | 'YELLOW' | 'RED' | 'BLOCKING';

export interface LicenseInput {
  requirements: Record<DisciplineKey, number>;
  enabledFeatures: string[];
  currentSubscriptionActive: boolean;
  futureGrowthPercent?: number;
}

export interface PackageDef {
  size: number;
  code: string;
  partNumber: string;
}

export interface PackageRecommendation {
  discipline: DisciplineKey;
  packageSize: number;
  quantity: number;
  code: string;
  partNumber: string;
}

export interface DisciplineUtilization {
  requested: number;
  licensed: number;
  ratio: number;
  zone: UtilizationZone;
  message?: string;
}

export interface FeatureSetDetails {
  key: FeatureSetKey;
  name: string;
  code: string;
  partNumber: string;
}

export interface LicenseCalculationResult {
  recommendedFeatureSet: FeatureSetDetails;
  featureSetReason: string;
  packages: PackageRecommendation[];
  utilization: Record<DisciplineKey, DisciplineUtilization>;
  totalCapacity: Record<DisciplineKey, number>; 
  remainingCapacity: Record<DisciplineKey, number>;
  isCompliant: boolean;
  messages: string[];
}

export interface ConfigData {
  disciplines: Record<DisciplineKey, { 
    name: string; 
    unit: string; 
    packages: PackageDef[] 
  }>;
  featureSets: Record<FeatureSetKey, { 
    name: string;
    code: string;
    partNumber: string;
    embeddedPoints: Partial<Record<DisciplineKey, number>>; 
    maxDisciplines: number;
    allowAdvancedFeatures: boolean;
  }>;
}

export interface RulesData {
  rules: {
    multiDisciplineThreshold: number;
    maxTotalPointsForCompact?: number;
    forcedStandardFeatures: string[];
    compactMaxLimits: Partial<Record<DisciplineKey, number>>;
    compactBannedPackages?: Partial<Record<DisciplineKey, number[]>>;
    upgradeLogic?: {
      allowCompactToStandard: boolean;
      subscriptionGracePeriodDays: number;
    };
  };
  messages: {
    upgradeRequired: string;
    embeddedApplied: string;
    capacityExceeded?: string;
  };
}

// --- The Engine ---

export class LicenseEngine {
  private packagesConfig: ConfigData;
  private rulesConfig: RulesData;

  constructor(packagesConfig: ConfigData, rulesConfig: RulesData) {
    this.packagesConfig = packagesConfig;
    this.rulesConfig = rulesConfig;
  }

  public calculateLicense(input: LicenseInput): LicenseCalculationResult {
    const messages: string[] = [];
    
    // 1. Determine Recommended Feature Set
    let featureSetKey: FeatureSetKey = 'STANDARD';
    let reason = '';
    
    // Calculate global totals
    const totalPoints = Object.values(input.requirements).reduce((sum, qty) => sum + qty, 0);
    const globalCompactLimit = this.rulesConfig.rules.maxTotalPointsForCompact ?? 2000;

    // Check Advanced Features first (they force Standard)
    const hasAdvanced = input.enabledFeatures.some(f => 
      this.rulesConfig.rules.forcedStandardFeatures.includes(f)
    );

    if (hasAdvanced) {
      featureSetKey = 'STANDARD';
      reason = `Advanced features enabled: ${input.enabledFeatures.filter(f => this.rulesConfig.rules.forcedStandardFeatures.includes(f)).join(', ')}`;
    } else if (totalPoints > globalCompactLimit) {
      featureSetKey = 'STANDARD';
      reason = `Total system capacity (${totalPoints}) exceeds Compact limit (${globalCompactLimit}).`;
    } else {
      // Determine dominant discipline to pick correct Compact variant
      const req = input.requirements;
      const hasBA = req.BA > 0;
      const hasFire = req.FIRE > 0;
      const hasElec = req.ELEC > 0;
      const hasValid = req.VALID > 0;

      let candidate: FeatureSetKey = 'COMPACT_BA'; // Default fallback
      
      if (hasValid && !hasBA && !hasFire && !hasElec) {
        candidate = 'COMPACT_VM';
        reason = 'Validated Monitoring dominant.';
      } else if (hasFire && !hasBA) {
        candidate = 'COMPACT_DMS';
        reason = 'Fire Safety dominant (Danger Management).';
      } else if (hasElec && !hasBA && !hasFire) {
        candidate = 'COMPACT_ELEC';
        reason = 'Electrical dominant.';
      } else {
        candidate = 'COMPACT_BA';
        reason = 'Building Automation dominant or Mixed usage.';
      }

      // Check Limits for the Candidate (Individual discipline limits)
      const limits = this.rulesConfig.rules.compactMaxLimits;
      let limitViolation = '';
      
      for (const [key, qty] of Object.entries(input.requirements)) {
        const dKey = key as DisciplineKey;
        const limit = limits[dKey];
        if (limit !== undefined && qty > limit) {
          limitViolation = `${dKey} (${qty}) > Limit (${limit})`;
          break;
        }
      }

      if (limitViolation) {
        featureSetKey = 'STANDARD';
        reason = `${this.rulesConfig.messages.capacityExceeded}: ${limitViolation}`;
      } else {
        featureSetKey = candidate;
      }
    }

    // 2. Load Feature Set Config
    const fsDef = this.packagesConfig.featureSets[featureSetKey];
    const recommendedPackages: PackageRecommendation[] = [];
    const utilizationMap: Record<string, DisciplineUtilization> = {};
    const totalCapacity: Record<string, number> = {};
    const remainingCapacity: Record<string, number> = {};

    const allDisciplines = Object.keys(this.packagesConfig.disciplines) as DisciplineKey[];

    // 3. Process Disciplines & Calculate BOM
    for (const discipline of allDisciplines) {
      const reqAmount = input.requirements[discipline] || 0;
      const embedded = fsDef.embeddedPoints[discipline] || 0;
      
      if (embedded > 0 && reqAmount > 0) {
         messages.push(`[${discipline}] ${this.rulesConfig.messages.embeddedApplied}: ${embedded}`);
      }

      // Calculate Deficit
      const effectivePoints = Math.max(0, reqAmount - embedded);
      
      // Select Packages
      let packRecs: PackageRecommendation[] = [];
      if (effectivePoints > 0) {
        let availablePackages = this.packagesConfig.disciplines[discipline]?.packages || [];
        
        // Strict Filter: Remove banned packages for Compact
        if (featureSetKey !== 'STANDARD') {
           const banned = this.rulesConfig.rules.compactBannedPackages?.[discipline] || [];
           // availablePackages is PackageDef[], banned is number[]
           availablePackages = availablePackages.filter(p => !banned.includes(p.size));
           
           const limits = this.rulesConfig.rules.compactMaxLimits;
           const limit = limits[discipline] || 999999;
           availablePackages = availablePackages.filter(p => p.size <= limit);
        }

        if (availablePackages.length > 0) {
           const sizes = availablePackages.map(p => p.size);
           const selectedSizes = this.calculatePackagesEconomic(effectivePoints, sizes);
           
           const counts = new Map<number, number>();
           selectedSizes.forEach(size => counts.set(size, (counts.get(size) || 0) + 1));
           
           counts.forEach((qty, size) => {
             const pkgDef = availablePackages.find(p => p.size === size);
             if (pkgDef) {
               packRecs.push({ 
                 discipline, 
                 packageSize: size, 
                 quantity: qty,
                 code: pkgDef.code,
                 partNumber: pkgDef.partNumber
               });
             }
           });
        }
      }
      
      recommendedPackages.push(...packRecs);

      // 4. Utilization & Validation
      const purchasedCapacity = packRecs.reduce((sum, p) => sum + (p.packageSize * p.quantity), 0);
      const totalCap = embedded + purchasedCapacity;
      const ratio = totalCap > 0 ? reqAmount / totalCap : 0;
      
      let zone: UtilizationZone = 'GREEN';
      let zoneMsg = '';

      if (reqAmount > totalCap) {
         zone = 'BLOCKING'; 
         zoneMsg = 'Configuration invalid: Cannot meet requirement with available packages.';
      } else if (featureSetKey !== 'STANDARD') {
         const limits = this.rulesConfig.rules.compactMaxLimits;
         const max = limits[discipline];
         if (max && reqAmount > max) {
            zone = 'BLOCKING';
            zoneMsg = 'Exceeds Compact hard limit.';
         }
      }

      utilizationMap[discipline] = {
        requested: reqAmount,
        licensed: totalCap,
        ratio: ratio,
        zone: zone,
        message: zoneMsg
      };

      totalCapacity[discipline] = totalCap;
      remainingCapacity[discipline] = totalCap - reqAmount;
    }

    return {
      recommendedFeatureSet: {
        key: featureSetKey,
        name: fsDef.name,
        code: fsDef.code,
        partNumber: fsDef.partNumber
      },
      featureSetReason: reason,
      packages: recommendedPackages,
      utilization: utilizationMap as Record<DisciplineKey, DisciplineUtilization>,
      totalCapacity: totalCapacity as Record<DisciplineKey, number>,
      remainingCapacity: remainingCapacity as Record<DisciplineKey, number>,
      isCompliant: true,
      messages
    };
  }

  private calculatePackagesEconomic(target: number, availableSizes: number[]): number[] {
    if (target <= 0) return [];
    
    const sortedSizes = [...availableSizes].sort((a, b) => b - a);
    let bestCombination: number[] | null = null;
    let minWaste = Number.MAX_SAFE_INTEGER;
    
    const MAX_ITERATIONS = 5000;
    let iterations = 0;

    function solve(currentTarget: number, currentCombo: number[]) {
      iterations++;
      if (iterations > MAX_ITERATIONS) return;

      if (currentTarget <= 0) {
        const sum = currentCombo.reduce((a,b) => a+b, 0);
        const waste = sum - target;
        
        if (waste < minWaste) {
          minWaste = waste;
          bestCombination = [...currentCombo];
        } else if (waste === minWaste) {
          if (!bestCombination || currentCombo.length < bestCombination.length) {
             bestCombination = [...currentCombo];
          }
        }
        return;
      }

      for (const size of sortedSizes) {
         if ((size - currentTarget) >= minWaste) continue;
         if (size <= currentTarget) {
            solve(currentTarget - size, [...currentCombo, size]);
            if (minWaste === 0) return; 
         } else {
             const waste = (size - currentTarget);
             if (waste < minWaste) {
                 minWaste = waste;
                 bestCombination = [...currentCombo, size];
             }
         }
      }
    }

    const largest = sortedSizes[0];
    const safeChunk = Math.max(0, Math.floor(target / largest) - 1);
    const prefill = Array(safeChunk).fill(largest);
    const remainder = target - (safeChunk * largest);
    
    solve(remainder, []);

    return [...prefill, ...(bestCombination || [])];
  }
}