// Vibe2Real — Transfer Reflection Engine
// After module completion, generates behavioral mapping to real-world debugging scenarios

import type { ActionLog } from './actionLogger';
import type { TierResult } from './tierEngine';

interface TransferReflection {
    moduleId: number;
    behaviorObserved: string;
    realWorldMapping: string;
    timeSaved?: string;
}

// Module 1: Trace the Request
const MODULE_1_REFLECTIONS: TransferReflection[] = [
    {
        moduleId: 1,
        behaviorObserved: 'You traced request flow before modifying code.',
        realWorldMapping: 'This pattern applies when APIs fail in real projects. Most debugging sessions save 20+ minutes by tracing first.',
        timeSaved: '~20 min avg',
    },
    {
        moduleId: 1,
        behaviorObserved: 'You checked environment variables after exhausting code-level causes.',
        realWorldMapping: 'This is the correct escalation pattern. Env configs cause ~30% of production failures in deployed apps.',
    },
    {
        moduleId: 1,
        behaviorObserved: 'You differentiated between HTTP status and response payload.',
        realWorldMapping: '200 with corrupted data is the most common API debugging trap. You now recognize it.',
    },
    {
        moduleId: 1,
        behaviorObserved: 'You located where execution actually stops instead of assuming.',
        realWorldMapping: 'Silent conditionals blocking execution is one of the 5 most common production failure patterns.',
    },
];

// Module 2: Read the Failure
const MODULE_2_REFLECTIONS: TransferReflection[] = [
    {
        moduleId: 2,
        behaviorObserved: 'You read the error message before restarting.',
        realWorldMapping: 'This saves ~15 minutes in real incident response. Most engineers restart without reading first.',
        timeSaved: '~15 min avg',
    },
    {
        moduleId: 2,
        behaviorObserved: 'You inspected the Network tab before modifying backend code.',
        realWorldMapping: 'Network inspection narrows failure boundaries. 4xx errors and CORS issues are invisible without it.',
    },
    {
        moduleId: 2,
        behaviorObserved: 'You investigated the payload, not just the status code.',
        realWorldMapping: 'Status codes describe HTTP layer. Payloads describe application state. Debugging happens at application layer.',
    },
    {
        moduleId: 2,
        behaviorObserved: 'You checked cache headers when data appeared stale.',
        realWorldMapping: 'Caching issues account for ~25% of "why does it work for me but not them" incidents.',
    },
];

// Module 3: Ship Without AI
const MODULE_3_REFLECTIONS: TransferReflection[] = [
    {
        moduleId: 3,
        behaviorObserved: 'You read server logs before attempting any fix.',
        realWorldMapping: 'Operational logs are the first-line diagnostic in every real incident. Reading before acting is a senior pattern.',
        timeSaved: '~30 min avg',
    },
    {
        moduleId: 3,
        behaviorObserved: 'You understood both sides of a merge conflict before resolving.',
        realWorldMapping: 'Unreviewed conflict resolutions cause regressions. Understanding intent of both branches is the correct approach.',
    },
    {
        moduleId: 3,
        behaviorObserved: 'You chose revert over reset after reviewing consequences.',
        realWorldMapping: 'Revert preserves history. Reset rewrites it. In team environments, history preservation is mandatory.',
    },
    {
        moduleId: 3,
        behaviorObserved: 'You identified production-specific build differences.',
        realWorldMapping: '"Works on my machine" is always an environment difference. Production environments differ from dev in at least 3 variables.',
    },
];

const ALL_REFLECTIONS: Record<number, TransferReflection[]> = {
    1: MODULE_1_REFLECTIONS,
    2: MODULE_2_REFLECTIONS,
    3: MODULE_3_REFLECTIONS,
};

export function generateTransferReflection(
    moduleId: number,
    log: ActionLog,
    _tier: string,
): TransferReflection[] {
    const reflections = ALL_REFLECTIONS[moduleId] || [];
    const selected: TransferReflection[] = [];

    // Select reflections based on behavioral patterns observed
    const actions = log.actions;
    const investigatedNetworkTab = actions.some(a => a.target?.toLowerCase().includes('network'));
    const readLogsFirst = actions.findIndex(a => a.category === 'investigation') < actions.findIndex(a => a.category === 'modification');
    const formedHypotheses = log.hypothesisCount > 0;
    const falsified = log.falsificationCount > 0;

    // Always give 2-3 most relevant reflections
    if (moduleId === 1) {
        if (readLogsFirst) selected.push(reflections[0]);
        selected.push(reflections[2]); // env var pattern always relevant
        if (formedHypotheses) selected.push(reflections[1]);
    } else if (moduleId === 2) {
        if (readLogsFirst) selected.push(reflections[0]);
        if (investigatedNetworkTab) selected.push(reflections[1]);
        selected.push(reflections[2]);
    } else if (moduleId === 3) {
        selected.push(reflections[0]);
        if (falsified) selected.push(reflections[2]);
        selected.push(reflections[3]);
    }

    // Ensure at least 2 reflections
    while (selected.length < 2 && reflections.length > selected.length) {
        const next = reflections.find(r => !selected.includes(r));
        if (next) selected.push(next);
        else break;
    }

    return selected.slice(0, 3);
}

// Re-export TierResult for external use (so we have the interface available)
export type { TransferReflection };
