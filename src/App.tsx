import React, { useState, useMemo, useEffect } from 'react';
import { LicenseEngine } from './engine/LicenseEngine';
import { DisciplineType, CalculationResult } from './engine/types';
import { CapacityBar } from './components/CapacityBar';
import { BOMTable } from './components/BOMTable';
import { Footer } from './components/Footer';
import { ProjectListModal } from './components/ProjectListModal';
import { ProjectStorage, SavedProject } from './utils/projectStorage';
import { ExcelExport } from './utils/excelExport';
import { EmailUtil } from './utils/emailUtil';
import CATALOG from './engine/LICENSE_CATALOG.json';

const engine = new LicenseEngine();

const App = () => {
    // Core License State
    const [requirements, setRequirements] = useState<Record<DisciplineType, number>>({
        BA: 0,
        FIRE: 0,
        ELECTRICAL: 0,
        SCADA: 0,
        METER: 0,
        CLIENTS: 0
    });

    // Project Info State
    const [projectName, setProjectName] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [description, setDescription] = useState('');

    // Saved Projects State
    const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
    const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

    // UI State
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

    // Initial Load
    useEffect(() => {
        const loaded = ProjectStorage.getAll();
        setSavedProjects(loaded);
    }, []);

    // Live Calculation
    const result: CalculationResult = useMemo(() => {
        return engine.calculate({ requirements });
    }, [requirements]);

    const handleRequirementChange = (key: DisciplineType, val: string) => {
        const num = Math.max(0, parseInt(val) || 0);
        setRequirements(prev => ({ ...prev, [key]: num }));
    };

    // Project Actions
    const handleSave = () => {
        if (!projectName) {
            alert('Project Name is required.');
            return;
        }
        const saved = ProjectStorage.save(projectName, customerName, description, requirements, result);
        setSavedProjects(ProjectStorage.getAll());
        setCurrentProjectId(saved.project.id);
        alert('Project Saved Locally!');
    };

    const handleLoad = (project: SavedProject) => {
        setRequirements(project.input);
        setProjectName(project.project.name);
        setCustomerName(project.project.customer);
        setDescription(project.project.description);
        setCurrentProjectId(project.project.id);
        setIsProjectModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this project?')) {
            ProjectStorage.delete(id);
            setSavedProjects(ProjectStorage.getAll());
            if (currentProjectId === id) setCurrentProjectId(null);
        }
    };

    const handleExport = () => {
        if (!currentProjectId) {
            alert('Please save the project before exporting.');
            return;
        }
        const currentProject = savedProjects.find(p => p.project.id === currentProjectId);
        if (currentProject) {
            ExcelExport.exportProject(currentProject);
        } else {
            alert('Error: Project not found in storage. Please save again.');
        }
    };

    const handleEmail = () => {
        if (!currentProjectId) {
            alert('Please save the project before preparing email.');
            return;
        }
        const currentProject = savedProjects.find(p => p.project.id === currentProjectId);
        if (currentProject) {
            const mailto = EmailUtil.generateMailto(currentProject);
            window.location.href = mailto;
        } else {
            alert('Error: Project not found in storage. Please save again.');
        }
    };

    // Derived: Recent Projects (Top 3 by Date Desc)
    const recentProjects = useMemo(() => {
        return [...savedProjects]
            .sort((a, b) => new Date(b.project.createdAt).getTime() - new Date(a.project.createdAt).getTime())
            .slice(0, 3);
    }, [savedProjects]);

    return (
        <div className="min-h-screen bg-slate-100 text-slate-800 font-sans p-8 flex flex-col">
            <header className="mb-8 max-w-7xl mx-auto w-full">
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Siemens Desigo CC License Engine</h1>
                        <p className="text-slate-500">Vendor-Grade Calculation System</p>
                    </div>
                </div>

                {/* Project Management Section */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h2 className="text-sm font-bold uppercase text-slate-500 tracking-wider">Project Management (Local)</h2>
                        <div className="space-x-2">
                            <button
                                onClick={() => setIsProjectModalOpen(true)}
                                className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-1 rounded text-sm font-bold transition-colors shadow-sm"
                            >
                                Load Project
                            </button>
                            <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-bold transition-colors shadow-sm">Save Project</button>
                            <button onClick={handleExport} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-bold transition-colors shadow-sm">Export to Excel</button>
                            <button onClick={handleEmail} className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-1 rounded text-sm font-bold transition-colors shadow-sm">Prepare Email</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Project Name *</label>
                            <input
                                type="text"
                                className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                placeholder="e.g. Campus Building A"
                            />
                            {/* Recent Projects Compact List */}
                            {recentProjects.length > 0 && (
                                <div className="mt-2 text-xs text-slate-400">
                                    <span className="font-semibold text-slate-500 mr-2">Recent:</span>
                                    {recentProjects.map((p, i) => (
                                        <React.Fragment key={p.project.id}>
                                            <button
                                                onClick={() => setIsProjectModalOpen(true)} // Per prompt: "Clicking a recent project opens the Load Project modal."
                                                className="hover:text-blue-600 hover:underline transition-colors"
                                            >
                                                {p.project.name}
                                            </button>
                                            {i < recentProjects.length - 1 && <span className="mx-1">•</span>}
                                        </React.Fragment>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Customer Name</label>
                            <input
                                type="text"
                                className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                placeholder="e.g. Siemens Real Estate"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Description</label>
                            <input
                                type="text"
                                className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Brief notes..."
                            />
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 w-full flex-grow">

                {/* INPUTS */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                        <h2 className="text-sm font-bold uppercase text-slate-500 tracking-wider mb-4 border-b pb-2">Data Point Requirements</h2>
                        <div className="space-y-4">
                            {(Object.keys(CATALOG.disciplines) as DisciplineType[]).map(disc => {
                                const def = CATALOG.disciplines[disc as keyof typeof CATALOG.disciplines];
                                let compactLimit = null;
                                if (disc === 'BA') compactLimit = 2000;
                                if (disc === 'SCADA' || disc === 'FIRE' || disc === 'ELECTRICAL') compactLimit = 500;
                                if (disc === 'METER') compactLimit = 30;
                                if (disc === 'CLIENTS') compactLimit = 3;

                                return (
                                    <div key={disc}>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-sm font-bold text-slate-700">{disc}</label>
                                            {compactLimit && <span className="text-xs text-slate-400">Compact Limit: {compactLimit}</span>}
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-right pr-12"
                                                placeholder="0"
                                                value={requirements[disc] || ''}
                                                onChange={(e) => handleRequirementChange(disc, e.target.value)}
                                            />
                                            <span className="absolute right-3 top-2 text-sm text-slate-400">{def.unit}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Logs Panel (Layer 3) */}
                    <div className="bg-slate-800 text-slate-200 p-4 rounded-lg shadow-sm h-96 overflow-y-auto font-mono text-xs">
                        <h3 className="font-bold text-slate-400 mb-2 sticky top-0 bg-slate-800 pb-2 border-b border-slate-700">Engine Decision Log (Layer 3)</h3>
                        <ul className="space-y-1">
                            {result.explanations.map((log, i) => (
                                <li key={i} className="break-words">
                                    <span className="text-slate-500 mr-2">[{i + 1}]</span>
                                    {log}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* RESULTS */}
                <div className="lg:col-span-8 space-y-6">

                    {/* Feature Set Banner */}
                    <div className={`p-6 rounded-lg shadow-md border-l-8 transition-colors ${result.featureSet.type === 'STANDARD' ? 'bg-blue-50 border-blue-600' : 'bg-green-50 border-green-500'
                        }`}>
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-xs font-bold uppercase tracking-wide opacity-60">Selected Feature Set</span>
                                <div className="text-2xl font-bold mt-1">{result.featureSet.sku}</div>
                                <div className="font-mono text-sm opacity-80">{result.featureSet.partNumber}</div>
                                <div className={`inline-block mt-2 px-2 py-1 rounded text-xs font-bold text-white ${result.featureSet.type === 'STANDARD' ? 'bg-blue-600' : 'bg-green-600'
                                    }`}>
                                    {result.featureSet.type}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Validation Errors */}
                    {result.validations.errors.length > 0 && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded text-sm">
                            <strong>Validation Errors:</strong>
                            <ul className="list-disc ml-5 mt-1">
                                {result.validations.errors.map((e, i) => <li key={i}>{e.message}</li>)}
                            </ul>
                        </div>
                    )}

                    {/* Capacity Visuals */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                        <h3 className="font-bold text-slate-700 mb-4">Capacity Utilization</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                            {(Object.keys(requirements) as DisciplineType[]).map(disc => {
                                let compactLimit = undefined;
                                if (disc === 'BA') compactLimit = 2000;
                                if (disc === 'SCADA' || disc === 'FIRE' || disc === 'ELECTRICAL') compactLimit = 500;
                                if (disc === 'METER') compactLimit = 30;
                                if (disc === 'CLIENTS') compactLimit = 3;

                                return (
                                    <CapacityBar
                                        key={disc}
                                        discipline={disc}
                                        used={result.capacity.used[disc]}
                                        licensed={result.capacity.licensed[disc]}
                                        max={result.capacity.max === 'UNLIMITED' ? 'UNLIMITED' : result.capacity.max[disc]}
                                        compactLimit={result.featureSet.type === 'COMPACT' ? undefined : compactLimit}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    {/* BOM */}
                    <BOMTable bom={result.bom} />
                </div>
            </div>

            <Footer />

            <ProjectListModal
                isOpen={isProjectModalOpen}
                onClose={() => setIsProjectModalOpen(false)}
                projects={savedProjects}
                onLoad={handleLoad}
                onDelete={handleDelete}
            />
        </div>
    );
};

export default App;
