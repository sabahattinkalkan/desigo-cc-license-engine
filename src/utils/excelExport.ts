import * as XLSX from 'xlsx';
import { SavedProject } from './projectStorage';
import { BOMItem } from '../engine/types';

export const ExcelExport = {
    exportProject: (project: SavedProject) => {
        const wb = XLSX.utils.book_new();

        // --- Sheet 1: Project Summary (Key-Value) ---
        // Final Decision text
        let finalDecision = "";
        const finalLog = project.engineResult.explanations.find(l => l.startsWith('FINAL RESULT')) || "";

        if (project.engineResult.featureSet.type === 'COMPACT') {
            finalDecision = "The project requirements are within Compact limits. Desigo CC Compact Building Automation is sufficient.";
        } else {
            finalDecision = "The project requirements exceed Compact limits. Standard feature set is selected.";
        }

        const summaryData = [
            ['Field', 'Value'],
            ['Project Name', project.project.name],
            ['Customer', project.project.customer],
            ['Date', new Date(project.project.createdAt).toLocaleDateString()],
            ['Base License', `${project.engineResult.featureSet.sku} (${project.engineResult.featureSet.type})`],
            ['Part Number', project.engineResult.featureSet.partNumber],
            ['Final Decision', finalDecision]
        ];
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

        // --- Sheet 2: Requirements (Input) ---
        const inputData = [
            ['Discipline', 'Required Points/Qty'],
            ['Building Automation', project.input.BA],
            ['Fire', project.input.FIRE],
            ['Electrical', project.input.ELECTRICAL],
            ['SCADA', project.input.SCADA],
            ['Meters', project.input.METER],
            ['Clients', project.input.CLIENTS]
        ];
        const wsInput = XLSX.utils.aoa_to_sheet(inputData);
        XLSX.utils.book_append_sheet(wb, wsInput, 'Requirements');

        // --- Sheet 3: Bill of Materials ---
        const bomHeaders = ['SKU', 'Part Number', 'Description', 'Quantity'];
        let bomData: (string | number)[][];

        if (project.engineResult.bom.length === 0) {
            bomData = [['No additional licenses required', '', '', '']];
        } else {
            bomData = project.engineResult.bom.map((item: BOMItem) => [
                item.sku,
                item.partNumber,
                `${item.discipline} License Package`,
                item.quantity
            ]);
        }

        const wsBOM = XLSX.utils.aoa_to_sheet([bomHeaders, ...bomData]);
        XLSX.utils.book_append_sheet(wb, wsBOM, 'Bill of Materials');

        // --- Sheet 4: Decision Log (Optional) ---
        const logData = [
            ['Log Message'],
            ...project.engineResult.explanations.map(l => [l])
        ];
        const wsLogs = XLSX.utils.aoa_to_sheet(logData);
        XLSX.utils.book_append_sheet(wb, wsLogs, 'Decision Log');

        // --- Save File ---
        const filename = `DesigoCC_Calc_${project.project.name.replace(/[^a-z0-9]/gi, '_')}.xlsx`;
        XLSX.writeFile(wb, filename);
    }
};
