// Vibe2Real — Scenario Registry
// Central index for all 15 scenarios across 3 modules

import type { ScenarioDefinition } from './types';

// Module 1: Trace the Request
import level1_1 from './module1/level1-1';
import level1_2 from './module1/level1-2';
import level1_3 from './module1/level1-3';
import level1_4 from './module1/level1-4';
import level1_5 from './module1/level1-5';

// Module 2: Read the Failure
import level2_1 from './module2/level2-1';
import level2_2 from './module2/level2-2';
import level2_3 from './module2/level2-3';
import level2_4 from './module2/level2-4';
import level2_5 from './module2/level2-5';

// Module 3: Ship Without AI
import level3_1 from './module3/level3-1';
import level3_2 from './module3/level3-2';
import level3_3 from './module3/level3-3';
import level3_4 from './module3/level3-4';
import level3_5 from './module3/level3-5';

export interface ModuleDefinition {
    id: number;
    title: string;
    subtitle: string;
    failurePrimitive: string;
    mentalModel: string;
    description: string;
    levels: ScenarioDefinition[];
    estimatedMinutes: number;
}

export const MODULES: ModuleDefinition[] = [
    {
        id: 1,
        title: 'Trace the Request',
        subtitle: 'Execution Mental Model',
        failurePrimitive: 'Execution Flow Blindness',
        mentalModel: 'Where does execution actually go?',
        description: 'Frontend to backend. Request to response. No magic, only logic.',
        levels: [level1_1, level1_2, level1_3, level1_4, level1_5],
        estimatedMinutes: 60,
    },
    {
        id: 2,
        title: 'Read the Failure',
        subtitle: 'Signal Interpretation',
        failurePrimitive: 'Signal Interpretation Failure',
        mentalModel: 'What is the system telling me?',
        description: 'Dev tools. Network tab. Console errors. Locate the exact breakage point.',
        levels: [level2_1, level2_2, level2_3, level2_4, level2_5],
        estimatedMinutes: 60,
    },
    {
        id: 3,
        title: 'Ship Without AI',
        subtitle: 'Operational Control',
        failurePrimitive: 'Operational Control Fear',
        mentalModel: 'How do I act without AI?',
        description: 'Terminal basics. Git conflicts. Manual deployment. Survive the command line.',
        levels: [level3_1, level3_2, level3_3, level3_4, level3_5],
        estimatedMinutes: 60,
    },
];

export const SCENARIO_MAP: Record<string, ScenarioDefinition> = {};
for (const mod of MODULES) {
    for (const level of mod.levels) {
        SCENARIO_MAP[level.id] = level;
    }
}

export function getScenario(levelId: string): ScenarioDefinition | null {
    return SCENARIO_MAP[levelId] ?? null;
}

export function getModule(moduleId: number): ModuleDefinition | null {
    return MODULES.find(m => m.id === moduleId) ?? null;
}

export function getLevelId(moduleId: number, levelIndex: number): string {
    return `${moduleId}-${levelIndex + 1}`;
}

export function parseModuleAndLevel(levelId: string): { moduleId: number; levelIndex: number } {
    const [mod, lvl] = levelId.split('-').map(Number);
    return { moduleId: mod, levelIndex: lvl - 1 };
}
