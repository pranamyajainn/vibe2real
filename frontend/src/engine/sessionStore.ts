// Vibe2Real — Session Store Engine
// localStorage-based anonymous session persistence

export type Tier = 'guidance' | 'independent' | 'efficient' | 'reliable';

export interface LevelProgress {
    levelId: string;          // e.g. "1-1", "2-3"
    completed: boolean;
    tier: Tier | null;
    attempts: number;
    timeSpent: number;        // seconds
    behaviorFlags: string[];  // AI dependency signals
    completedAt: number | null;
}

export interface ModuleProgress {
    moduleId: number;         // 1, 2, 3
    completed: boolean;
    overallTier: Tier | null;
    levels: Record<string, LevelProgress>;
    restartCount: number;     // for certificate ceiling check
}

export interface GameSession {
    sessionId: string;
    anonymousId: string;      // USR_XXXX format
    startedAt: number;
    lastActiveAt: number;
    modules: Record<number, ModuleProgress>;
    totalXP: number;
    streak: number;
    highestStreak: number;
    certificateEligible: boolean;
}

const SESSION_KEY = 'v2r_session';

function generateId(prefix: string, length: number): string {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = prefix + '_';
    for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
}

function createEmptyModuleProgress(moduleId: number): ModuleProgress {
    return {
        moduleId,
        completed: false,
        overallTier: null,
        levels: {},
        restartCount: 0,
    };
}

function createEmptyLevelProgress(levelId: string): LevelProgress {
    return {
        levelId,
        completed: false,
        tier: null,
        attempts: 0,
        timeSpent: 0,
        behaviorFlags: [],
        completedAt: null,
    };
}

export function createSession(): GameSession {
    const session: GameSession = {
        sessionId: generateId('SES', 12),
        anonymousId: generateId('USR', 4),
        startedAt: Date.now(),
        lastActiveAt: Date.now(),
        modules: {
            1: createEmptyModuleProgress(1),
            2: createEmptyModuleProgress(2),
            3: createEmptyModuleProgress(3),
        },
        totalXP: 0,
        streak: 0,
        highestStreak: 0,
        certificateEligible: false,
    };
    saveSession(session);
    return session;
}

export function getSession(): GameSession {
    if (typeof window === 'undefined') return createSession();
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return createSession();
    try {
        const parsed = JSON.parse(raw) as GameSession;
        parsed.lastActiveAt = Date.now();
        return parsed;
    } catch {
        return createSession();
    }
}

export function saveSession(session: GameSession): void {
    if (typeof window === 'undefined') return;
    session.lastActiveAt = Date.now();
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getLevelProgress(moduleId: number, levelId: string): LevelProgress {
    const session = getSession();
    const mod = session.modules[moduleId];
    if (!mod) return createEmptyLevelProgress(levelId);
    return mod.levels[levelId] || createEmptyLevelProgress(levelId);
}

export function saveLevelProgress(moduleId: number, progress: LevelProgress): void {
    const session = getSession();
    if (!session.modules[moduleId]) {
        session.modules[moduleId] = createEmptyModuleProgress(moduleId);
    }
    session.modules[moduleId].levels[progress.levelId] = progress;
    saveSession(session);
}

export function incrementStreak(session: GameSession): GameSession {
    session.streak += 1;
    if (session.streak > session.highestStreak) {
        session.highestStreak = session.streak;
    }
    saveSession(session);
    return session;
}

export function resetStreak(session: GameSession): GameSession {
    session.streak = 0;
    saveSession(session);
    return session;
}

export function addXP(session: GameSession, amount: number): GameSession {
    session.totalXP += amount;
    saveSession(session);
    return session;
}

export function isLevelUnlocked(moduleId: number, levelIndex: number): boolean {
    if (levelIndex === 0) return true; // First level always unlocked
    const session = getSession();
    const mod = session.modules[moduleId];
    if (!mod) return false;
    // Previous level must be completed
    const prevLevelId = `${moduleId}-${levelIndex}`;
    const prevLevel = mod.levels[prevLevelId];
    return prevLevel?.completed === true;
}

export function isModuleUnlocked(moduleId: number): boolean {
    if (moduleId === 1) return true;
    // For certification path: must complete previous module
    const session = getSession();
    const prevMod = session.modules[moduleId - 1];
    return prevMod?.completed === true;
}

export function checkCertificateEligibility(session: GameSession): boolean {
    const ELIGIBLE_TIERS: Tier[] = ['independent', 'efficient', 'reliable'];
    const MAX_RESTARTS = 3;

    for (let m = 1; m <= 3; m++) {
        const mod = session.modules[m];
        if (!mod || !mod.completed) return false;
        if (mod.restartCount > MAX_RESTARTS) return false;
        if (!mod.overallTier || !ELIGIBLE_TIERS.includes(mod.overallTier)) return false;
    }

    // Check no dependency flag
    for (let m = 1; m <= 3; m++) {
        const mod = session.modules[m];
        const levelIds = Object.keys(mod.levels);
        const flagged = levelIds.filter(lid => {
            const flags = mod.levels[lid].behaviorFlags;
            return flags.includes('externalized_reasoning_dependency');
        });
        if (flagged.length > 1) return false;
    }

    return true;
}
