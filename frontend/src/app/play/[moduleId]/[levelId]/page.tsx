'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSession, getLevelProgress, saveSession, saveLevelProgress } from '@/engine/sessionStore';
import { getScenario } from '@/scenarios/index';
import { generateSurface, type RandomizedSurface } from '@/engine/scenarioSeed';
import { startActionLog, logAction, detectAIDependency, type ActionLog } from '@/engine/actionLogger';
import { createDegradationState, recordBlindAction, isIrrecoverable, getDegradationMessage, getDegradationColor, type DegradationState } from '@/engine/degradationEngine';
import { getCost, simulateDelay } from '@/engine/infoCosting';
import { assignTier } from '@/engine/tierEngine';
import type { ScenarioAction, GameState } from '@/scenarios/types';
import styles from './Scenario.module.css';

// How many investigation actions before modify buttons unlock
const INVESTIGATION_GATE = 2;

interface OutcomeEntry {
    actionLabel: string;
    text: string;
    timestamp: number;
    isTyping: boolean;
}

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Typewriter hook — types text character by character
function useTypewriter(text: string, active: boolean, speed = 18) {
    const [displayed, setDisplayed] = useState('');
    const [done, setDone] = useState(false);

    useEffect(() => {
        if (!active) { setDisplayed(text); setDone(true); return; }
        setDisplayed('');
        setDone(false);
        let i = 0;
        const interval = setInterval(() => {
            i++;
            setDisplayed(text.slice(0, i));
            if (i >= text.length) { clearInterval(interval); setDone(true); }
        }, speed);
        return () => clearInterval(interval);
    }, [text, active, speed]);

    return { displayed, done };
}

function TerminalLine({ text, active }: { text: string; active: boolean }) {
    const { displayed } = useTypewriter(text, active, 14);
    const lines = displayed.split('\n');

    return (
        <>
            {lines.map((line, i) => {
                let className = styles.termLine;
                if (line.includes('✓') || line.includes('SUCCESS') || line.includes('200 OK') || line.includes('STABILIZED')) className += ' ' + styles.success;
                else if (line.includes('ERROR') || line.includes('UNCAUGHT') || line.includes('CRITICAL') || line.includes('←') || line.includes('⚠')) className += ' ' + styles.error;
                else if (line.includes('WARNING') || line.includes('WARN') || line.includes('404') || line.includes('401') || line.includes('500')) className += ' ' + styles.warning;
                else if (line.startsWith('//') || line.startsWith('#') || line.startsWith('>')) className += ' ' + styles.comment;
                return <span key={i} className={className}>{line}{'\n'}</span>;
            })}
            {active && displayed.length < text.length && <span className={styles.cursor}>▌</span>}
        </>
    );
}

export default function ScenarioScreen() {
    const params = useParams();
    const router = useRouter();
    const moduleId = Number(params.moduleId);
    const levelIndex = Number(params.levelId) - 1;
    const levelId = `${moduleId}-${levelIndex + 1}`;

    const scenario = getScenario(levelId);
    const [surface, setSurface] = useState<RandomizedSurface | null>(null);
    const [actionLog, setActionLog] = useState<ActionLog | null>(null);
    const [outcomes, setOutcomes] = useState<OutcomeEntry[]>([]);
    const [degradation, setDegradation] = useState<DegradationState>(createDegradationState({ warningThreshold: scenario?.blindActionThreshold ?? 5 }));
    const [gameState, setGameState] = useState<GameState>({ flags: {}, resolvedFlags: [], environmentDegraded: false });
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [pendingAction, setPendingAction] = useState<string | null>(null);
    const [pendingProgress, setPendingProgress] = useState(0);
    const [canResolve, setCanResolve] = useState(false);
    const [resolved, setResolved] = useState(false);
    const [resolvedFlash, setResolvedFlash] = useState(false);
    const [usedRestarts, setUsedRestarts] = useState(false);
    const [investigationCount, setInvestigationCount] = useState(0);
    const [modifyUnlocked, setModifyUnlocked] = useState(false);
    const [typingIndex, setTypingIndex] = useState(-1); // which outcome is currently typing
    const [mounted, setMounted] = useState(false);
    const startTimeRef = useRef(Date.now());
    const outcomeEndRef = useRef<HTMLDivElement>(null);

    // Initialize
    useEffect(() => {
        setMounted(true);
        if (!scenario) return;
        const session = getSession();
        const surf = generateSurface(session.sessionId, moduleId, levelId);
        setSurface(surf);

        const log = startActionLog(session.sessionId, moduleId, levelId);
        setActionLog(log);

        const existing = getLevelProgress(moduleId, levelId);
        if (existing.completed) setResolved(true);

        const timer = setInterval(() => setElapsedSeconds(prev => prev + 1), 1000);
        return () => clearInterval(timer);
    }, [scenario, moduleId, levelId]);

    // Auto-scroll outcomes
    useEffect(() => {
        outcomeEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [outcomes]);

    // When a new outcome is added, mark it as typing
    useEffect(() => {
        if (outcomes.length > 0) {
            setTypingIndex(outcomes.length - 1);
        }
    }, [outcomes.length]);

    // Check resolution conditions
    const checkResolution = useCallback((state: GameState) => {
        if (!scenario) return false;
        const actionIds = new Set(state.resolvedFlags);
        const allPaths = [
            scenario.resolution.requiredActionIds,
            ...(scenario.resolution.alternativePaths || []),
        ];
        for (const path of allPaths) {
            if (path.every(id => actionIds.has(id))) return true;
        }
        return false;
    }, [scenario]);

    const handleAction = useCallback(async (action: ScenarioAction) => {
        if (!scenario || !surface || !actionLog || pendingAction || resolved) return;
        if (isIrrecoverable(degradation)) return;

        const costType = action.informationCostType;
        const delayMs = costType ? getCost(costType) : 0;

        setPendingAction(action.id);
        setPendingProgress(0);

        if (delayMs > 0) {
            await simulateDelay(costType!, (elapsed, total) => {
                setPendingProgress((elapsed / total) * 100);
            });
        }

        setPendingAction(null);
        setPendingProgress(0);

        const outcomeText = typeof action.outcomeTemplate === 'function'
            ? action.outcomeTemplate(surface, gameState)
            : action.outcomeTemplate;

        setOutcomes(prev => [...prev, {
            actionLabel: action.label,
            text: outcomeText,
            timestamp: Date.now(),
            isTyping: true,
        }]);

        logAction({
            category: action.category,
            action: action.id,
            target: action.label,
            outcome: outcomeText.slice(0, 100),
            informationCostMs: delayMs,
        });

        // Investigation gate: track how many investigate actions taken
        if (action.category === 'investigation') {
            setInvestigationCount(prev => {
                const next = prev + 1;
                if (next >= INVESTIGATION_GATE) setModifyUnlocked(true);
                return next;
            });
        }

        // Degradation for blind actions
        let newDegradation = degradation;
        if (action.isBlind || action.category === 'reflexive') {
            newDegradation = recordBlindAction(degradation);
            setDegradation(newDegradation);
            if (isIrrecoverable(newDegradation)) {
                setGameState(prev => ({ ...prev, environmentDegraded: true }));
            }
        }

        const newState = { ...gameState };
        if (action.advancesResolution) {
            newState.resolvedFlags = [...newState.resolvedFlags, action.id];
        }
        setGameState(newState);

        const isResolved = checkResolution(newState);
        if (isResolved) setCanResolve(true);

    }, [scenario, surface, actionLog, pendingAction, resolved, degradation, gameState, checkResolution]);

    const handleRestart = useCallback(() => {
        setUsedRestarts(true);
        setOutcomes([]);
        setDegradation(createDegradationState({ warningThreshold: scenario?.blindActionThreshold ?? 5 }));
        setGameState({ flags: {}, resolvedFlags: [], environmentDegraded: false });
        setCanResolve(false);
        setInvestigationCount(0);
        setModifyUnlocked(false);
        startTimeRef.current = Date.now();
        setElapsedSeconds(0);

        const session = getSession();
        const progress = getLevelProgress(moduleId, levelId);
        progress.attempts = (progress.attempts || 0) + 1;
        saveLevelProgress(moduleId, progress);

        const modProgress = session.modules[moduleId];
        if (modProgress) {
            modProgress.restartCount = (modProgress.restartCount || 0) + 1;
            saveSession(session);
        }
    }, [scenario, moduleId, levelId]);

    const handleResolve = useCallback(() => {
        if (!actionLog || !scenario) return;
        const totalTime = elapsedSeconds;
        const tierResult = assignTier(actionLog, totalTime, usedRestarts, false);

        const session = getSession();
        const progress = getLevelProgress(moduleId, levelId);
        progress.completed = true;
        progress.tier = tierResult.tier;
        progress.attempts = (progress.attempts || 0) + 1;
        progress.timeSpent = totalTime;

        const aiDetection = detectAIDependency(actionLog);
        if (aiDetection.flagged) {
            progress.behaviorFlags = [...(progress.behaviorFlags || []), 'externalized_reasoning_dependency'];
        }
        progress.completedAt = Date.now();
        saveLevelProgress(moduleId, progress);

        const mod = session.modules[moduleId];
        if (mod) {
            const allCompleted = Object.values(mod.levels).filter(l => l.completed).length;
            if (allCompleted >= 5) {
                mod.completed = true;
                const tiers = Object.values(mod.levels).filter(l => l.tier).map(l => l.tier!);
                const tierRank = { guidance: 0, independent: 1, efficient: 2, reliable: 3 };
                const minRank = Math.min(...tiers.map(t => tierRank[t]));
                const tierNames: Array<typeof mod.overallTier> = ['guidance', 'independent', 'efficient', 'reliable'];
                mod.overallTier = tierNames[minRank];
            }
        }

        session.totalXP = (session.totalXP || 0) + tierResult.xpAwarded;
        if (tierResult.tier !== 'guidance') {
            session.streak = (session.streak || 0) + 1;
            if (session.streak > (session.highestStreak || 0)) session.highestStreak = session.streak;
        } else {
            session.streak = 0;
        }
        saveSession(session);

        // Resolution flash before redirect
        setResolvedFlash(true);
        setTimeout(() => router.push(`/play/${moduleId}/${levelIndex + 1}/report`), 2200);
    }, [actionLog, scenario, elapsedSeconds, usedRestarts, moduleId, levelId, levelIndex, router]);

    if (!scenario || !surface) {
        return <div style={{ padding: '3rem', color: '#ff3333', fontFamily: 'monospace' }}>Loading incident...</div>;
    }

    const initialState = scenario.initialAppState(surface);
    const timerClass = elapsedSeconds > 900 ? styles.timerCritical : elapsedSeconds > 600 ? styles.timerWarning : '';
    const degradationColor = getDegradationColor(degradation.level);
    const degradationMsg = getDegradationMessage(degradation);
    const irrecoverable = isIrrecoverable(degradation);

    const investigationActions = scenario.actions.filter(a => a.category === 'investigation');
    const modificationActions = scenario.actions.filter(a => a.category === 'modification');
    const reflexiveActions = scenario.actions.filter(a => a.category === 'reflexive');

    const blindPct = Math.min(100, (degradation.blindActionCount / degradation.irrecoverableThreshold) * 100);
    const modifyLockedMsg = !modifyUnlocked
        ? `Investigate first. ${INVESTIGATION_GATE - investigationCount} more read${INVESTIGATION_GATE - investigationCount === 1 ? '' : 's'} required.`
        : null;

    return (
        <>
            {/* Full-screen resolution flash */}
            {resolvedFlash && (
                <div className={styles.resolvedOverlay}>
                    <div className={styles.resolvedOverlayInner}>
                        <div className={styles.resolvedOverlayText}>SYSTEM RESTORED</div>
                        <div className={styles.resolvedOverlaySub}>Generating behavioral report...</div>
                    </div>
                </div>
            )}

            <div className={styles.scenarioPage}>
                <div className={styles.topBar}>
                    <div className={styles.breadcrumb}>
                        <Link href="/play">Simulation</Link>
                        {' → '}
                        <Link href={`/play/${moduleId}`}>Module {moduleId}</Link>
                        {' → '} Level {moduleId}.{levelIndex + 1} — {scenario.title}
                    </div>
                    <div className={styles.levelMeta}>
                        <span className={`${styles.timer} ${timerClass}`}>{formatTime(elapsedSeconds)}</span>
                    </div>
                </div>

                <div className={styles.main}>
                    {/* Environment Panel */}
                    <div className={styles.environmentPanel}>
                        <div className={styles.scenarioDesc}>
                            <span className={styles.scenarioDescTitle}>Incident Brief</span>
                            <div className={styles.scenarioDescText}>{scenario.twoLineDescription}</div>
                        </div>

                        <div className={styles.envTitle}>
                            <div className={`${styles.envStatusDot} ${resolved ? styles.stable : ''}`} />
                            System Environment
                        </div>

                        <div className={styles.codeBlock}>
                            <TerminalLine text={initialState} active={mounted} />
                        </div>

                        {degradationMsg && (
                            <div className={styles.degradationBanner} style={{ borderColor: degradationColor, color: degradationColor }}>
                                {degradationMsg}
                            </div>
                        )}

                        {irrecoverable && (
                            <div style={{ marginTop: '1rem' }}>
                                <button onClick={handleRestart} className={styles.restartBtn}>
                                    ↺ Restart Scenario
                                </button>
                                <div className={styles.restartHint}>
                                    Environment unrecoverable. Restart required. Attempt count recorded.
                                </div>
                            </div>
                        )}

                        {outcomes.length > 0 && (
                            <div className={styles.outcomePane}>
                                <div className={styles.outcomePaneHeader}>Investigation Output</div>
                                {outcomes.map((o, i) => (
                                    <div key={i} className={styles.outcomeEntry}>
                                        <div className={styles.outcomeEntryAction}>
                                            {new Date(o.timestamp).toLocaleTimeString()} › {o.actionLabel}
                                        </div>
                                        <div className={styles.outcomeEntryText}>
                                            <TerminalLine text={o.text} active={i === typingIndex} />
                                        </div>
                                    </div>
                                ))}
                                <div ref={outcomeEndRef} />
                            </div>
                        )}
                    </div>

                    {/* Action Panel */}
                    <div className={styles.actionPanel}>
                        <span className={styles.actionPanelTitle}>Available Actions</span>

                        {investigationActions.length > 0 && (
                            <div className={styles.actionCategory}>
                                <span className={styles.actionCategoryLabel}>↓ Investigate</span>
                                {investigationActions.map((action, idx) => (
                                    <button
                                        key={action.id}
                                        className={`${styles.actionBtn} ${(!!pendingAction || irrecoverable || resolved) ? styles.disabled : ''}`}
                                        onClick={() => handleAction(action)}
                                        disabled={!!pendingAction || irrecoverable || resolved}
                                        style={{ animationDelay: `${idx * 60}ms` }}
                                    >
                                        <span>{action.label}</span>
                                        {action.informationCostType && getCost(action.informationCostType) > 0 && (
                                            <span className={styles.actionBtnCost}>
                                                {getCost(action.informationCostType) / 1000}s
                                            </span>
                                        )}
                                        {pendingAction === action.id && (
                                            <div className={styles.actionProgress} style={{ width: `${pendingProgress}%` }} />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}

                        {modificationActions.length > 0 && (
                            <div className={styles.actionCategory}>
                                <span className={styles.actionCategoryLabel}>⚡ Modify</span>
                                {/* Gate lock hint */}
                                {modifyLockedMsg && (
                                    <div className={styles.gateHint}>{modifyLockedMsg}</div>
                                )}
                                {modificationActions.map((action, idx) => {
                                    const isLocked = !modifyUnlocked && !resolved;
                                    return (
                                        <button
                                            key={action.id}
                                            className={`${styles.actionBtn} ${(!!pendingAction || irrecoverable || resolved || isLocked) ? styles.disabled : ''}`}
                                            onClick={() => !isLocked && handleAction(action)}
                                            disabled={!!pendingAction || irrecoverable || resolved || isLocked}
                                            title={isLocked ? modifyLockedMsg ?? '' : ''}
                                            style={{ animationDelay: `${(investigationActions.length + idx) * 60}ms` }}
                                        >
                                            <span>{action.label}</span>
                                            {action.informationCostType && getCost(action.informationCostType) > 0 && (
                                                <span className={styles.actionBtnCost}>
                                                    {getCost(action.informationCostType) / 1000}s
                                                </span>
                                            )}
                                            {isLocked && <span className={styles.lockIcon}>🔒</span>}
                                            {pendingAction === action.id && (
                                                <div className={styles.actionProgress} style={{ width: `${pendingProgress}%` }} />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {reflexiveActions.length > 0 && (
                            <div className={styles.actionCategory}>
                                <span className={styles.actionCategoryLabel}>↺ Other</span>
                                {reflexiveActions.map((action, idx) => (
                                    <button
                                        key={action.id}
                                        className={`${styles.actionBtn} ${(!!pendingAction || irrecoverable || resolved) ? styles.disabled : ''}`}
                                        onClick={() => handleAction(action)}
                                        disabled={!!pendingAction || irrecoverable || resolved}
                                        style={{ animationDelay: `${(investigationActions.length + modificationActions.length + idx) * 60}ms` }}
                                    >
                                        <span>{action.label}</span>
                                        {action.informationCostType && getCost(action.informationCostType) > 0 && (
                                            <span className={styles.actionBtnCost}>
                                                {getCost(action.informationCostType) / 1000}s
                                            </span>
                                        )}
                                        {pendingAction === action.id && (
                                            <div className={styles.actionProgress} style={{ width: `${pendingProgress}%` }} />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Blind Action Meter */}
                        <div className={styles.blindActionCounter}>
                            <span style={{ color: degradationColor || '#ff3333' }}>
                                Environment Stability
                            </span>
                            <div className={styles.blindActionBar}>
                                <div
                                    className={styles.blindActionFill}
                                    style={{
                                        width: `${blindPct}%`,
                                        background: blindPct > 60 ? '#ff3333' : blindPct > 30 ? '#ff6600' : '#1a1a1a'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Resolve Button */}
                        <div className={styles.resolveBtn}>
                            <button
                                className={`${styles.resolveBtnInner} ${canResolve && !resolved ? styles.resolveBtnReady : ''}`}
                                onClick={handleResolve}
                                disabled={!canResolve || resolved}
                            >
                                {resolved ? '✓ RESOLVED' : canResolve ? 'CONFIRM RESOLUTION →' : 'SYSTEM UNSTABLE'}
                            </button>
                            <div className={styles.resolveBtnHint}>
                                {canResolve
                                    ? 'System state has converged. Confirm to receive behavioral report.'
                                    : `Investigate the incident. ${modifyUnlocked ? 'Apply the fix.' : `Read ${INVESTIGATION_GATE - investigationCount} more signal${INVESTIGATION_GATE - investigationCount === 1 ? '' : 's'} first.`}`}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
