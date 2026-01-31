import React from 'react';
import { BOMItem } from '../engine/types';
import CATALOG from '../engine/LICENSE_CATALOG.json';

interface BOMTableProps {
    bom: BOMItem[];
}

export const BOMTable: React.FC<BOMTableProps> = ({ bom }) => {
    return (
        <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">Bill of Materials</h2>
                <span className="text-xs text-gray-500 font-mono bg-white px-2 py-1 rounded border">
                    {new Date().toISOString().split('T')[0]}
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3">Part Number</th>
                            <th className="px-6 py-3">Order Code</th>
                            <th className="px-6 py-3 w-1/3">Description</th>
                            <th className="px-6 py-3 text-center">Qty</th>
                            <th className="px-6 py-3 text-right">Capacity</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bom.map((item, idx) => (
                            <tr key={idx} className="bg-white border-b hover:bg-blue-50/30 transition-colors">
                                <td className="px-6 py-4 font-mono text-gray-900">{item.partNumber}</td>
                                <td className="px-6 py-4 font-mono text-blue-700 font-bold">{item.sku}</td>
                                <td className="px-6 py-4 font-medium text-gray-600">
                                    {item.discipline} - {item.unitCapacity} {CATALOG.disciplines[item.discipline as keyof typeof CATALOG.disciplines].unit}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded border border-blue-200">
                                        {item.quantity}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right font-mono">
                                    {(item.quantity * item.unitCapacity).toLocaleString()}
                                </td>
                            </tr>
                        ))}

                        {bom.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-400 italic">
                                    No additional packages selected.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
