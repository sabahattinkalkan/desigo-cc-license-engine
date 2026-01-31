import CATALOG from './LICENSE_CATALOG.json';
import { PolicyValidator } from './PolicyValidator';
import { BOMOptimizer } from './BOMOptimizer';
import { ExplanationEngine } from './ExplanationEngine';
import { LicenseInput, CalculationResult, FeatureSetDef, DisciplineType } from './types';

export class LicenseEngine {
    private validator: PolicyValidator;
    private optimizer: BOMOptimizer;
    private explainer: ExplanationEngine;

    constructor() {
        this.validator = new PolicyValidator();
        this.optimizer = new BOMOptimizer();
        this.explainer = new ExplanationEngine();
    }

    public calculate(input: LicenseInput): CalculationResult {
        this.explainer.clear();

        // 1. Determine Recommended Feature Set
        let recommendedFeatureSet: FeatureSetDef = CATALOG.featureSets['CCA-CMPT-BA'] as FeatureSetDef;
        let finalReason = '';

        // Check Hard Limits (Layer 1)
        const validation = this.validator.validate(input);

        if (!validation.isCompactValid) {
            recommendedFeatureSet = CATALOG.featureSets['CCA-STD-FSET'] as FeatureSetDef;
            finalReason = `Compact Rejection: ${validation.errors.map(e => e.code).join(',')}`;

            // Log specific failures
            validation.errors.forEach(err => {
                // We use the structured error to log a readable message
                // The logHardLimitFailure method expects strings/numbers, but we have strict codes now.
                // We can just log the message directly via the explainer's add method or adapter
                this.explainer.add(`Compact Check Internal: Code=${err.code} Limit=${err.limit} Actual=${err.actual}`);
            });
            this.explainer.add(`Switching to Standard due to ${validation.errors.length} limit violations.`);
        } else {
            finalReason = 'Requirements within Compact limits';
            this.explainer.logFeatureSetDecision(recommendedFeatureSet.sku, finalReason);
        }

        // 2. Calculate BOM (Layer 2)
        const validatorShim = (sku: string) => this.validator.validateCompactPackage(sku);

        let bomResult = this.optimizer.calculateBOM(input, recommendedFeatureSet, validatorShim);

        // 3. Compact Guard (Layer 2 Rule C)
        if (!bomResult.isPatternValid && recommendedFeatureSet.type === 'COMPACT') {
            const currentBA = bomResult.totalCapacity['BA'];

            // Log failure
            this.explainer.logCompactGuardFailure(currentBA, 2000);

            // Switch
            recommendedFeatureSet = CATALOG.featureSets['CCA-STD-FSET'] as FeatureSetDef;
            finalReason = `Compact BOM Invalid (BA Total > 2000 or Added > 1500)`;

            // Recalculate
            bomResult = this.optimizer.calculateBOM(input, recommendedFeatureSet, validatorShim);
        }

        // 4. Log Decisions
        const embedded = (CATALOG.embeddedCapacity[recommendedFeatureSet.sku as keyof typeof CATALOG.embeddedCapacity] || {}) as Record<string, number>;
        (Object.keys(input.requirements) as DisciplineType[]).forEach(disc => {
            const emb = embedded[disc] || 0;
            if (emb > 0) {
                this.explainer.logEmbeddedDeduction(disc, emb, input.requirements[disc]);
            }
        });

        bomResult.bom.forEach(item => {
            this.explainer.logBOMItem(item.sku, item.quantity);
        });

        // Final Summary (Improvement 3)
        this.explainer.logFinalSummary(recommendedFeatureSet.sku, recommendedFeatureSet.type, finalReason);

        // 5. Construct Result
        return {
            featureSet: recommendedFeatureSet,
            validations: {
                errors: validation.errors,
                warnings: validation.warnings
            },
            bom: bomResult.bom,
            capacity: {
                used: input.requirements,
                licensed: bomResult.totalCapacity,
                max: recommendedFeatureSet.type === 'COMPACT' ?
                    {
                        'BA': 2000, 'SCADA': 500, 'FIRE': 500, 'ELECTRICAL': 500, 'METER': 30, 'CLIENTS': 3
                    } as any : 'UNLIMITED'
            },
            explanations: this.explainer.getLogs()
        };
    }
}
