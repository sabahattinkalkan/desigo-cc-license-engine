import { v4 as uuidv4 } from 'uuid';
import { DisciplineType, CalculationResult } from '../engine/types';

export interface SavedProject {
    project: {
        id: string;
        name: string;
        customer: string;
        description: string;
        createdAt: string;
    };
    input: Record<DisciplineType, number>;
    engineResult: CalculationResult;
}

const STORAGE_KEY = 'desigo_cc_projects_v1';

export const ProjectStorage = {
    save: (
        name: string,
        customer: string,
        description: string,
        input: Record<DisciplineType, number>,
        result: CalculationResult
    ): SavedProject => {
        const newProject: SavedProject = {
            project: {
                id: uuidv4(),
                name,
                customer,
                description,
                createdAt: new Date().toISOString()
            },
            input,
            engineResult: result
        };

        const existing = ProjectStorage.getAll();
        // Overwrite logic? Prompt says "Multiple projects must be supported".
        // We append.
        existing.push(newProject);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));

        return newProject;
    },

    getAll: (): SavedProject[] => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error('Failed to load projects', e);
            return [];
        }
    },

    delete: (id: string) => {
        const existing = ProjectStorage.getAll().filter(p => p.project.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    },

    clearAll: () => {
        localStorage.removeItem(STORAGE_KEY);
    }
};
