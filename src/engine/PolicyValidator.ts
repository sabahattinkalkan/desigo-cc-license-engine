import CATALOG from './LICENSE_CATALOG.json';
import { LicenseInput, CalculationResult, DisciplineType, ValidationError } from './types';

export class PolicyValidator {

    public validate(input: LicenseInput): { isCompactValid: boolean; errors: ValidationError[]; warnings: ValidationError[] } {
        const errors: ValidationError[] = [];
        const warnings: ValidationError[] = [];
        let isCompactValid = true;

        // --- Compact Hard Limits (Layer 1) ---
        // If any limit is exceeded, Compact is INVALID.

        // Shared helper for limit checking
        const checkLimit = (discipline: DisciplineType, code: string, limit: number) => {
            const val = input.requirements[discipline];
            if (val > limit) {
                isCompactValid = false;
                errors.push({
                    code: code,
                    discipline: discipline,
                    limit: limit,
                    actual: val,
                    message: `Compact ${discipline} Limit Exceeded: ${val} > ${limit}`
                });
            }
        };

        checkLimit('BA', 'COMPACT_LIMIT_BA', 2000);
        checkLimit('SCADA', 'COMPACT_LIMIT_SCADA', 500);
        checkLimit('FIRE', 'COMPACT_LIMIT_FIRE', 500);
        checkLimit('ELECTRICAL', 'COMPACT_LIMIT_ELECTRICAL', 500);
        checkLimit('METER', 'COMPACT_LIMIT_METER', 30);
        checkLimit('CLIENTS', 'COMPACT_LIMIT_CLIENTS', 3);

        return { isCompactValid, errors, warnings };
    }

    public validateCompactPackage(sku: string): boolean {
        const forbidden = [
            'CCA-5000-BA',
            'CCA-10000-BA',
            'CCA-30000-BA',
            'CCA-100000-BA'
        ];
        return !forbidden.includes(sku);
    }
}
