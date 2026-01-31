import CATALOG from './LICENSE_CATALOG.json';
import { BOMItem, DisciplineType, FeatureSetDef, LicensePackageDef, LicenseInput } from './types';

export class BOMOptimizer {

    // Solves the optimal package set for a given Net Requirement
    private solveKnapsack(target: number, packages: LicensePackageDef[], discipline: DisciplineType): BOMItem[] {
        if (target <= 0) return [];

        // Sort packages by SKU Ascending for Deterministic Tie-Break (Priority 4)
        // Priorities 1-3 are handled by the algorithm logic.
        const avail = [...packages].sort((a, b) => a.sku.localeCompare(b.sku));

        // Determine largest package for search limit calculation
        const largestPkg = avail.reduce((max, p) => Math.max(max, p.capacity), 0);
        const searchLimit = target + largestPkg;

        // Optimization: GCD for Unit Scaling
        const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
        const unit = avail.reduce((acc, p) => gcd(acc, p.capacity), avail[0].capacity);

        const targetU = Math.ceil(target / unit);
        const limitU = Math.ceil(searchLimit / unit);

        // DP State
        // dp[i] = min items to make EXACTLY capacity i*unit
        const dp = new Array(limitU + 1).fill(Infinity);
        const parent = new Array(limitU + 1).fill(-1); // Stores index in 'avail'

        dp[0] = 0;

        // Run DP (Change Making Problem)
        // Since we want lexicographically first combinations for ties in Count, 
        // and we iterate 'avail' (sorted by SKU asc), we accept updates only on STRICT inequality (<).
        // This preserves the first-found (best SKU) path for equal counts.
        for (let idx = 0; idx < avail.length; idx++) {
            const pkg = avail[idx];
            const w = pkg.capacity / unit;
            for (let i = w; i <= limitU; i++) {
                if (dp[i - w] + 1 < dp[i]) {
                    dp[i] = dp[i - w] + 1;
                    parent[i] = idx;
                }
            }
        }

        // Find Best Total Capacity (Priorities 1 & 3)
        // We iterate from target upwards. The first valid T we find minimizes Overshoot & Total Capacity.
        // For that fixed T, 'dp[T]' guarantees Min Count (Priority 2).
        // The sorting + strict DP checks guarantee SKU order (Priority 4).
        let bestTotalU = -1;
        for (let i = targetU; i <= limitU; i++) {
            if (dp[i] < Infinity) {
                bestTotalU = i;
                break;
            }
        }

        if (bestTotalU === -1) return [];

        // Reconstruct Solution
        const resultItems: BOMItem[] = [];
        let curr = bestTotalU;

        // Map of PkgIndex -> Count
        const counts = new Map<number, number>();

        while (curr > 0) {
            const pIdx = parent[curr];
            if (pIdx === -1) break;
            counts.set(pIdx, (counts.get(pIdx) || 0) + 1);
            const w = avail[pIdx].capacity / unit;
            curr -= w;
        }

        counts.forEach((qty, idx) => {
            const p = avail[idx];
            resultItems.push({
                sku: p.sku,
                partNumber: p.partNumber,
                discipline: discipline,
                unitCapacity: p.capacity,
                quantity: qty,
                totalCapacity: qty * p.capacity
            });
        });

        // Final Sort of BOM Items for display consistency (SKU Asc)
        return resultItems.sort((a, b) => a.sku.localeCompare(b.sku));
    }

    public calculateBOM(
        input: LicenseInput,
        featureSet: FeatureSetDef,
        policyValidatorStub: (sku: string) => boolean
    ): { bom: BOMItem[], totalCapacity: Record<DisciplineType, number>, isPatternValid: boolean } {

        const bom: BOMItem[] = [];
        const totalCapacity: Record<DisciplineType, number> = {
            BA: 0, FIRE: 0, ELECTRICAL: 0, SCADA: 0, METER: 0, CLIENTS: 0
        };

        // Initialize with embedded
        const embedded = (CATALOG.embeddedCapacity[featureSet.sku as keyof typeof CATALOG.embeddedCapacity] || {}) as Record<string, number>;
        (Object.keys(CATALOG.disciplines) as DisciplineType[]).forEach(disc => {
            const embeddedVal = embedded[disc] || 0;
            totalCapacity[disc] = embeddedVal;
        });

        let isPatternValid = true;

        (Object.keys(CATALOG.disciplines) as DisciplineType[]).forEach(disc => {
            const req = input.requirements[disc];
            const emb = totalCapacity[disc];
            const netReq = Math.max(0, req - emb);

            if (netReq > 0) {
                let validPackages = CATALOG.packages[disc as keyof typeof CATALOG.packages] || [];

                if (featureSet.type === 'COMPACT') {
                    validPackages = validPackages.filter(p => policyValidatorStub(p.sku));
                }

                if (validPackages.length === 0) {
                    // No packages available logic (omitted for brevity as it implies impossibility)
                } else {
                    const items = this.solveKnapsack(netReq, validPackages, disc);
                    items.forEach(item => {
                        bom.push(item);
                        totalCapacity[disc] += item.totalCapacity;
                    });
                }
            }
        });

        // Compact Guard
        if (featureSet.sku === 'CCA-CMPT-BA') {
            const additionalBA = totalCapacity['BA'] - (embedded['BA'] || 0);
            if (additionalBA > 1500) isPatternValid = false;
            if (totalCapacity['BA'] > 2000) isPatternValid = false;
        }

        return { bom, totalCapacity, isPatternValid };
    }
}
