// Vibe2Real — Scenario Type Definitions
// Shared type system for all 15 sub-level scenarios

import type { RandomizedSurface } from '@/engine/scenarioSeed';

export type ModuleType = 'trace' | 'read' | 'ship';

export type InvestigationActionType =
    | 'inspect_console'
    | 'inspect_network'
    | 'inspect_element'
    | 'read_code'
    | 'check_env'
    | 'run_command'
    | 'read_file'
    | 'restart_server'
    | 'reload_page'
    | 'modify_code'
    | 'modify_env'
    | 'modify_config'
    | 'git_log'
    | 'git_diff'
    | 'git_revert'
    | 'read_logs'
    | 'check_process'
    | 'run_build';

export interface ScenarioAction {
    id: string;
    label: string;
    type: InvestigationActionType;
    category: 'investigation' | 'modification' | 'reflexive';
    informationCostType?: string;
    // What the system shows after this action
    outcomeTemplate: string | ((surface: RandomizedSurface, state: GameState) => string);
    // Does this action advance toward resolution?
    advancesResolution?: boolean;
    // Does this action count as a blind/reflexive action?
    isBlind?: boolean;
    // Optional: what hypothesis this tests
    hypothesis?: string;
}

export interface FalseHypothesis {
    id: string;
    hypothesis: string;
    description: string;
    // Actions that lead down this path
    associatedActions: string[];
    // What makes this plausible
    plausibilityReason: string;
}

export interface ResolutionCondition {
    // The system state that must be true for resolution
    requiredActionIds: string[]; // These actions must have been taken
    requiredStateFlags: string[]; // State flags that must be set
    // OR conditions — any of these action sets count as resolution
    alternativePaths?: string[][];
}

export interface GameState {
    flags: Record<string, boolean | string | number>;
    resolvedFlags: string[];
    environmentDegraded: boolean;
}

export interface ScenarioDefinition {
    id: string;                   // e.g. "1-1"
    moduleId: number;
    levelIndex: number;           // 0-based
    moduleType: ModuleType;
    title: string;
    failureArchetype: string;
    twoLineDescription: string;

    // Emotional curve targets (% of expected runtime)
    confusionPhaseEnd: number;    // 0.0-1.0
    falseConfidencePhaseEnd: number;
    failurePhaseEnd: number;
    insightPhaseEnd: number;

    // Detective Layer (Narrator) additions
    dispatchMessage: string;
    narratorScript: {
        opening: string;
        actions: Record<string, string>;
        resolution: string;
    };
    momentumTease: string;
    patternBreak?: 'time_pressure' | 'red_herring' | 'silent_senior';

    // Initial environment state
    initialAppState: (surface: RandomizedSurface) => string;

    // Available investigation actions
    actions: ScenarioAction[];

    // False hypothesis paths (≥3 required)
    falseHypotheses: FalseHypothesis[];

    // Resolution conditions (state convergence)
    resolution: ResolutionCondition;

    // Environment degradation thresholds
    blindActionThreshold: number;

    // Entropy config
    entropyLevel: number; // 0=none, 1=low, 2=medium, 3=high

    // Primer concept reference — maps to primerConcepts.ts
    conceptId?: string;
}
