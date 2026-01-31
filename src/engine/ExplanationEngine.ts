export class ExplanationEngine {
    private logs: string[] = [];

    public clear() {
        this.logs = [];
    }

    public add(message: string) {
        this.logs.push(message);
    }

    public getLogs(): string[] {
        return [...this.logs];
    }

    public logFeatureSetDecision(sku: string, reason: string) {
        this.add(`Selected Feature Set: [${sku}]. Reason: ${reason}`);
    }

    public logHardLimitFailure(limitConfig: string, actual: number, limit: number) {
        this.add(`Compact Validity Check Failed: ${limitConfig} (${actual}) exceeds limit (${limit}). Switching to Standard.`);
    }

    public logCompactGuardFailure(actual: number, limit: number) {
        this.add(`Compact BOM Invalid: Total Capacity ${actual} exceeds strict limit ${limit}. Switching to Standard.`);
    }

    public logEmbeddedDeduction(discipline: string, embedded: number, required: number) {
        const remaining = Math.max(0, required - embedded);
        this.add(`${discipline}: Deducted ${embedded} embedded points. Reqs: ${required} -> ${remaining}.`);
    }

    public logBOMItem(sku: string, qty: number, reason: string = 'Economic Optimization') {
        this.add(`  + Added ${qty} x ${sku} (${reason})`);
    }

    public logFinalSummary(featureSetSku: string, featureSetName: string, primaryReason: string) {
        this.add(`FINAL RESULT: FeatureSet=${featureSetName} (${featureSetSku}), Reason=${primaryReason}.`);
    }
}
