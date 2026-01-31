import { SavedProject } from './projectStorage';
import { BOMItem } from '../engine/types';

export const EmailUtil = {
    generateMailto: (project: SavedProject): string => {
        const p = project.project;
        const r = project.engineResult;

        const subject = `Desigo CC License Calculation Summary – ${p.name}`;

        // --- Generate Final Result Logic ---
        // Human-readable final decision derived from ExplanationEngine
        let finalDecision = "";
        const finalLog = r.explanations.find(l => l.startsWith('FINAL RESULT')) || "";

        if (r.featureSet.type === 'COMPACT') {
            finalDecision = "The project requirements are within Compact limits.\nDesigo CC Compact Building Automation is sufficient for this scope.";
        } else {
            finalDecision = "The project requirements exceed Compact limits.\nStandard feature set is selected.";
            if (finalLog.includes("Reason=")) {
                const reason = finalLog.split("Reason=")[1].replace('.', '');
                finalDecision += `\nReason: ${reason}`;
            }
        }

        // --- BOM Construction ---
        let bomSection = "";
        if (r.bom.length === 0) {
            bomSection = "- No additional licenses are required.";
        } else {
            bomSection = r.bom.map((item: BOMItem) => {
                return `- ${item.sku} × ${item.quantity}`;
            }).join('\n');
        }

        const body = `Hello,

Below is the Desigo CC license calculation summary for the project.

Project:
- Name: ${p.name}
- Customer: ${p.customer || 'N/A'}
- Date: ${new Date(p.createdAt).toLocaleDateString()}

Base License:
- ${r.featureSet.type} (${r.featureSet.sku} / ${r.featureSet.partNumber})

Additional Licenses Required:
${bomSection}

Final Decision:
${finalDecision}

The detailed Bill of Materials is provided in the Excel file.

Best regards,`;

        return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
};
