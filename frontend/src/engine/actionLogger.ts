// Vibe2Real — Action Logger
// Every user action is silently recorded and categorized

export type ActionCategory = 'investigation' | 'modification' | 'reflexive' | 'sequencing';

export interface ActionRecord {
    id: string;
    timestamp: number;
    elapsed: number;          // seconds since scenario start
    category: ActionCategory;
    action: string;           // human-readable action name
    target: string;           // what was acted upon
    outcome: string;          // observable result
    informationCostMs: number; // simulated delay incurred
    hypothesis?: string;      // what the user was testing (if detectable)
}

export interface ActionLog {
    sessionId: string;
    moduleId: number;
    levelId: string;
    startTime: number;
    actions: ActionRecord[];
    hypothesisCount: number;
    falsificationCount: number;
}

let currentLog: ActionLog | null = null;

export function startActionLog(sessionId: string, moduleId: number, levelId: string): ActionLog {
    currentLog = {
        sessionId,
        moduleId,
        levelId,
        startTime: Date.now(),
        actions: [],
        hypothesisCount: 0,
        falsificationCount: 0,
    };
    // Persist to localStorage
    const key = `v2r_log_${moduleId}_${levelId}`;
    localStorage.setItem(key, JSON.stringify(currentLog));
    return currentLog;
}

export function getActionLog(moduleId: number, levelId: string): ActionLog | null {
    if (currentLog && currentLog.moduleId === moduleId && currentLog.levelId === levelId) {
        return currentLog;
    }
    const key = `v2r_log_${moduleId}_${levelId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
        currentLog = JSON.parse(raw) as ActionLog;
        return currentLog;
    } catch {
        return null;
    }
}

export function logAction(params: {
    category: ActionCategory;
    action: string;
    target: string;
    outcome: string;
    informationCostMs?: number;
    hypothesis?: string;
}): ActionRecord | null {
    if (!currentLog) return null;

    const now = Date.now();
    const record: ActionRecord = {
        id: `act_${now}_${Math.random().toString(36).slice(2, 6)}`,
        timestamp: now,
        elapsed: Math.round((now - currentLog.startTime) / 1000),
        category: params.category,
        action: params.action,
        target: params.target,
        outcome: params.outcome,
        informationCostMs: params.informationCostMs || 0,
        hypothesis: params.hypothesis,
    };

    currentLog.actions.push(record);

    // Persist
    const key = `v2r_log_${currentLog.moduleId}_${currentLog.levelId}`;
    localStorage.setItem(key, JSON.stringify(currentLog));

    return record;
}

export function logHypothesis(hypothesis: string): void {
    if (!currentLog) return;
    currentLog.hypothesisCount += 1;
    logAction({
        category: 'investigation',
        action: 'hypothesis_formed',
        target: hypothesis,
        outcome: 'pending_falsification',
        hypothesis,
    });
}

export function logFalsification(hypothesis: string): void {
    if (!currentLog) return;
    currentLog.falsificationCount += 1;
    logAction({
        category: 'investigation',
        action: 'hypothesis_falsified',
        target: hypothesis,
        outcome: 'eliminated',
        hypothesis,
    });
}

// Detect AI dependency pattern from action log
export function detectAIDependency(log: ActionLog): {
    flagged: boolean;
    signals: string[];
    signalToActionRatio: number;
    readingToModifyRatio: number;
    hypothesisStabilityAvg: number;
    uniqueSourcesConsulted: number;
} {
    const total = log.actions.length;
    if (total === 0) {
        return { flagged: false, signals: [], signalToActionRatio: 0, readingToModifyRatio: 0, hypothesisStabilityAvg: 0, uniqueSourcesConsulted: 0 };
    }

    const investigative = log.actions.filter(a => a.category === 'investigation').length;
    const reflexive = log.actions.filter(a => a.category === 'reflexive').length;
    const modifications = log.actions.filter(a => a.category === 'modification').length;

    const signalToActionRatio = investigative / total;
    const readingToModifyRatio = modifications > 0 ? investigative / modifications : investigative;

    const signals: string[] = [];

    // Rapid modifications before investigation
    if (modifications > 0 && investigative < 2 && modifications > 3) {
        signals.push('Modified code before identifying failure source');
    }

    // High reflexive action rate
    if (reflexive / total > 0.4) {
        signals.push('High rate of blind/reflexive actions');
    }

    // Low unique sources = scanning, not investigating
    const uniqueSources = new Set(log.actions.map(a => a.target)).size;
    if (uniqueSources < 3 && total > 8) {
        signals.push('Investigated fewer than 3 distinct sources');
    }

    // Modifications before any investigation
    const firstInvestigationIdx = log.actions.findIndex(a => a.category === 'investigation');
    const firstModificationIdx = log.actions.findIndex(a => a.category === 'modification');
    if (firstModificationIdx !== -1 && (firstInvestigationIdx === -1 || firstModificationIdx < firstInvestigationIdx)) {
        signals.push('Made modifications before any investigation');
    }

    // Rapid retries (same action repeated fast)
    const actionNames = log.actions.map(a => a.action);
    for (let i = 0; i < actionNames.length - 2; i++) {
        if (actionNames[i] === actionNames[i + 1] && actionNames[i] === actionNames[i + 2]) {
            signals.push('Repeated same action without hypothesis change (guess-based retry)');
            break;
        }
    }

    const flagged = signals.length >= 2 || (signals.length >= 1 && signalToActionRatio < 0.25);

    return {
        flagged,
        signals,
        signalToActionRatio: Math.round(signalToActionRatio * 100) / 100,
        readingToModifyRatio: Math.round(readingToModifyRatio * 100) / 100,
        hypothesisStabilityAvg: log.hypothesisCount > 0 ? Math.round(total / log.hypothesisCount) : 0,
        uniqueSourcesConsulted: uniqueSources,
    };
}
