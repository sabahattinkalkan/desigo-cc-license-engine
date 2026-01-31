export type DisciplineType = 'BA' | 'FIRE' | 'ELECTRICAL' | 'SCADA' | 'METER' | 'CLIENTS';

export interface LicenseCatalog {
  meta: {
    vendor: string;
    product: string;
  };
  featureSets: Record<string, FeatureSetDef>;
  disciplines: Record<string, { unit: string }>;
  embeddedCapacity: Record<string, Record<Partial<DisciplineType>, number>>;
  packages: Record<string, LicensePackageDef[]>;
}

export interface FeatureSetDef {
  sku: string;
  partNumber: string;
  type: 'STANDARD' | 'COMPACT';
}

export interface LicensePackageDef {
  sku: string;
  partNumber: string;
  capacity: number;
}

export interface LicenseInput {
  requirements: Record<DisciplineType, number>;
  forceCompact?: boolean; // For testing purposes, usually inferred
}

export interface ValidationError {
  code: string;
  discipline?: string;
  limit?: number;
  actual?: number;
  message: string;
}

export interface CalculationResult {
  featureSet: FeatureSetDef;
  validations: {
    errors: ValidationError[];
    warnings: ValidationError[];
  };
  bom: BOMItem[];
  capacity: {
    used: Record<DisciplineType, number>;
    licensed: Record<DisciplineType, number>;
    max: Record<DisciplineType, number | 'UNLIMITED'> | 'UNLIMITED';
  };
  explanations: string[];
}

export interface BOMItem {
  sku: string;
  partNumber: string;
  discipline: DisciplineType;
  unitCapacity: number;
  quantity: number;
  totalCapacity: number;
}
