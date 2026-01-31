import React, { useState, useMemo } from 'react';
import { SavedProject } from '../utils/projectStorage';

interface ProjectListModalProps {
    isOpen: boolean;
    onClose: () => void;
    projects: SavedProject[];
    onLoad: (project: SavedProject) => void;
    onDelete: (id: string) => void;
}

export const ProjectListModal: React.FC<ProjectListModalProps> = ({ isOpen, onClose, projects, onLoad, onDelete }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProjects = useMemo(() => {
        if (!searchTerm) return projects;
        const lower = searchTerm.toLowerCase();
        return projects.filter(p =>
            p.project.name.toLowerCase().includes(lower) ||
            p.project.customer.toLowerCase().includes(lower)
        );
    }, [projects, searchTerm]);

    // Format date helper
    const formatDate = (isoString: string) => {
        try {
            return new Date(isoString).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return isoString;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-800">Saved Projects (Local)</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                    >
                        &times;
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                    <input
                        type="text"
                        placeholder="Search by Project Name or Customer..."
                        className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                    />
                </div>

                {/* List */}
                <div className="flex-grow overflow-y-auto p-0">
                    {filteredProjects.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 text-sm">
                            {projects.length === 0 ? "No saved projects found." : "No matches found."}
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider border-b">Project</th>
                                    <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider border-b">Customer</th>
                                    <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider border-b text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredProjects.map(p => (
                                    <tr key={p.project.id} className="hover:bg-blue-50 transition-colors group">
                                        <td className="p-3">
                                            <div className="font-semibold text-gray-800">{p.project.name}</div>
                                            <div className="text-xs text-gray-400 mt-0.5">{formatDate(p.project.createdAt)}</div>
                                        </td>
                                        <td className="p-3 text-sm text-gray-600">
                                            {p.project.customer || <span className="text-gray-300 italic">None</span>}
                                        </td>
                                        <td className="p-3 text-right space-x-2">
                                            <button
                                                onClick={() => { onLoad(p); onClose(); }}
                                                className="bg-white border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-3 py-1 rounded text-xs font-bold transition-colors shadow-sm"
                                            >
                                                LOAD
                                            </button>
                                            <button
                                                onClick={() => onDelete(p.project.id)}
                                                className="text-red-400 hover:text-red-700 font-bold px-2 py-1 rounded text-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Delete Project"
                                            >
                                                &times;
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-gray-200 bg-gray-50 text-right">
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-800 text-sm font-semibold px-4 py-2"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
