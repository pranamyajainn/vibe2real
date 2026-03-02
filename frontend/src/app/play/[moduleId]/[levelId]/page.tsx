'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSession, getLevelProgress, saveSession, saveLevelProgress } from '@/engine/sessionStore';
import { getScenario } from '@/scenarios/index';
import { generateSurface, type RandomizedSurface } from '@/engine/scenarioSeed';
import { startActionLog, logAction, detectAIDependency, type ActionLog } from '@/engine/actionLogger';
import { createDegradationState, recordBlindAction, isIrrecoverable, type DegradationState } from '@/engine/degradationEngine';
import { getCost, simulateDelay } from '@/engine/infoCosting';
import { assignTier } from '@/engine/tierEngine';
import type { ScenarioAction, GameState } from '@/scenarios/types';
import styles from './Scenario.module.css';

interface OutcomeEntry {
    actionLabel: string;
    text: string;
    timestamp: number;
    isTyping: boolean;
}

const TOOLTIPS: Record<string, string> = {
    'inspect_console': "Check what the browser is complaining about",
    'inspect_network': "See what requests left the browser and what came back",
    'check_env': "Check what the app knows about its own environment",
    'read_code': "Read the actual code that's running",
    'check_backend_routes': "See what endpoints the server is listening on",
    'read_backend_route': "Read what the backend actually does when hit",
    'read_backend_route_code': "Read what the backend actually does when hit",
    'read_parent_component': "Read the parent component's source",
    'inspect_network_headers': "Read the explicit network headers",
    'inspect_dependency_requirements': "Read package requirements",
    'git_diff': "See exactly what changed between versions",
    'run_build': "Try to compile and see what breaks",
    'reload_page': "Restart from the current state",
    'restart_server': "Full restart of the dev environment"
};

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function useTypewriter(text: string, active: boolean, speed = 18) {
    const [displayed, setDisplayed] = useState('');
    const [done, setDone] = useState(false);

    useEffect(() => {
        if (!active || !text) { setDisplayed(text || ''); setDone(true); return; }
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
    if (!displayed) return null;
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
    const [usedRestarts, setUsedRestarts] = useState(false);
    const [modifyUnlocked, setModifyUnlocked] = useState(false);
    const [typingIndex, setTypingIndex] = useState(-1);
    const [mounted, setMounted] = useState(false);
    const startTimeRef = useRef(Date.now());
    const outcomeEndRef = useRef<HTMLDivElement>(null);

    // Detective Theme State
    const [investigationCount, setInvestigationCount] = useState(0);
    const [foundClueIds, setFoundClueIds] = useState<Set<string>>(new Set());
    const [narratorMsgs, setNarratorMsgs] = useState<string[]>([]);
    const [articulationOpen, setArticulationOpen] = useState(false);
    const [articulationInput, setArticulationInput] = useState('');
    const [articulationConfirmed, setArticulationConfirmed] = useState(false);
    const [hasFirstActionFired, setHasFirstActionFired] = useState(false);

    // UI Flash Overlays
    const [caseClosedFlash, setCaseClosedFlash] = useState(false);
    const [momentumVisible, setMomentumVisible] = useState(false);
    const [clueTriggeredFlash, setClueTriggeredFlash] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (!scenario) return;
        const session = getSession();
        const surf = generateSurface(session.sessionId, moduleId, levelId);
        setSurface(surf);

        const log = startActionLog(session.sessionId, moduleId, levelId);
        setActionLog(log);

        const progress = getLevelProgress(moduleId, levelId);
        if (progress.completed) setResolved(true);

        if (scenario.narratorScript?.opening) {
            setNarratorMsgs([scenario.narratorScript.opening]);
        }

        const timer = setInterval(() => setElapsedSeconds(prev => prev + 1), 1000);
        return () => clearInterval(timer);
    }, [scenario, moduleId, levelId]);

    useEffect(() => {
        outcomeEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [outcomes]);

    useEffect(() => {
        if (outcomes.length > 0) setTypingIndex(outcomes.length - 1);
    }, [outcomes.length]);

    // Pattern Breaks
    const isTimePressure = scenario?.patternBreak === 'time_pressure';
    const isSilentSenior = scenario?.patternBreak === 'silent_senior';
    const isRedHerring = scenario?.patternBreak === 'red_herring';

    const countdownTime = Math.max(0, 240 - elapsedSeconds);
    const timePressureZero = isTimePressure && countdownTime === 0;

    // Derived Detective State
    const actionClueMap = scenario?.narratorScript?.actions || {};
    const totalClues = Object.keys(actionClueMap).length;

    // Check if we hit the deduction moment manually
    useEffect(() => {
        if (!scenario || resolved) return;
        // The gate naturally opens if we've found all clues
        if (investigationCount >= totalClues && totalClues > 0 && !articulationConfirmed && !articulationOpen) {
            setArticulationOpen(true);
            setNarratorMsgs(["You've seen the evidence. What's the verdict? Name the culprit."]);
        }
        // Time pressure forces the gate open at 00:00
        if (timePressureZero && !articulationConfirmed && !articulationOpen) {
            setArticulationOpen(true);
            setNarratorMsgs(["They're on the line. What did you find?"]);
        }
    }, [investigationCount, totalClues, articulationConfirmed, articulationOpen, scenario, resolved, timePressureZero]);

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

    const pushNarrator = (msg: string) => {
        if (isSilentSenior) return; // Silent partner
        setNarratorMsgs([msg]); // replaces completely as requested (max 2 sentences, no accumulation)
    };

    const handleAction = useCallback(async (action: ScenarioAction) => {
        if (!scenario || !surface || !actionLog || pendingAction || resolved) return;
        if (isIrrecoverable(degradation)) return;

        if (!hasFirstActionFired) setHasFirstActionFired(true);

        // Pattern break: Red Herring trap
        if (isRedHerring && action.id === 'add_cors_header' && investigationCount === 0) {
            // Found the trap
            setPendingAction(action.id);
            await simulateDelay('edit_file', (elapsed, total) => {
                setPendingProgress((elapsed / total) * 100);
            });
            setPendingAction(null);

            setOutcomes(prev => [...prev, {
                actionLabel: action.label,
                text: "// CORS header added.\n// OPTIONS request still returning 404.\n// Nothing changed.",
                timestamp: Date.now(),
                isTyping: true,
            }]);
            pushNarrator("The obvious move was wrong. That's the case. Now read why adding the header didn't fix it.");
            return;
        }

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

        // Evaluate Detective Rules
        let newDegradation = degradation;
        if ((action.category === 'modification' && investigationCount < totalClues) || action.category === 'reflexive') {
            newDegradation = recordBlindAction(degradation);
            setDegradation(newDegradation);
            if (isIrrecoverable(newDegradation)) {
                setGameState(prev => ({ ...prev, environmentDegraded: true }));
            }
            // Degradation Voice Warnings
            if (newDegradation.blindActionCount === 5) {
                pushNarrator("Hey. You're touching things before reading the scene. That's how detectives miss evidence. Read first.");
            } else if (newDegradation.blindActionCount === 9) {
                pushNarrator("We're losing the scene. Every blind move corrupts the evidence. Stop. Read what's in front of you.");
            } else if (newDegradation.blindActionCount === 13) {
                pushNarrator("Scene's gone. We have to start over. Next time — read the scene before you touch anything. Every time.");
            }
        }

        console.log(`Action ID completed: ${action.id}`);
        const narratorResponse = actionClueMap[action.id];
        if (narratorResponse) {
            pushNarrator(narratorResponse);

            if (action.category === 'investigation' && !foundClueIds.has(action.id)) {
                setFoundClueIds(prev => {
                    const next = new Set(prev);
                    next.add(action.id);
                    return next;
                });
                setInvestigationCount(prev => prev + 1);
                setClueTriggeredFlash(true);
                setTimeout(() => setClueTriggeredFlash(false), 1000);
            }
        }

        const newState = { ...gameState };
        if (action.advancesResolution) {
            newState.resolvedFlags = [...newState.resolvedFlags, action.id];
        }
        setGameState(newState);

        const isResolved = checkResolution(newState);
        if (isResolved) setCanResolve(true);

    }, [scenario, surface, actionLog, pendingAction, resolved, degradation, gameState, checkResolution, isRedHerring, investigationCount, actionClueMap, foundClueIds]);

    const handleRestart = useCallback(() => {
        setUsedRestarts(true);
        setOutcomes([]);
        setDegradation(createDegradationState({ warningThreshold: scenario?.blindActionThreshold ?? 5 }));
        setGameState({ flags: {}, resolvedFlags: [], environmentDegraded: false });
        setCanResolve(false);
        setInvestigationCount(0);
        setFoundClueIds(new Set());
        setModifyUnlocked(false);
        setArticulationOpen(false);
        setArticulationConfirmed(false);
        setArticulationInput('');
        startTimeRef.current = Date.now();
        setElapsedSeconds(0);
        if (scenario?.narratorScript?.opening) {
            pushNarrator(scenario.narratorScript.opening);
        }

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

        if (articulationInput) {
            logAction({
                category: 'reflexive',
                action: 'articulation_attempt',
                target: articulationInput,
                outcome: 'Deduction Submitted',
                informationCostMs: 0
            });
        }

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

        // Sequence: Resolve Message -> Case Closed Flash -> Momentum Screen -> Router Push
        if (isSilentSenior) {
            setNarratorMsgs(["You didn't need me on that one. That's the whole point of this."]);
        } else if (scenario.narratorScript?.resolution) {
            setNarratorMsgs([scenario.narratorScript.resolution]);
        }

        setTimeout(() => {
            setCaseClosedFlash(true);
            setTimeout(() => {
                setCaseClosedFlash(false);
                setMomentumVisible(true);
                setTimeout(() => {
                    router.push(`/play/${moduleId}/${moduleId}-${levelIndex + 1}/report`);
                }, 4000);
            }, 3000);
        }, 1500);

    }, [actionLog, scenario, elapsedSeconds, usedRestarts, moduleId, levelId, levelIndex, router, articulationInput, isSilentSenior]);

    const handleDeductionSubmit = () => {
        const words = articulationInput.trim().split(/\s+/);
        if (words.length >= 4 || timePressureZero) {
            setArticulationConfirmed(true);
            setModifyUnlocked(true);

            if (moduleId === 1) pushNarrator("Case cracked. Make the fix.");
            else if (moduleId === 2) pushNarrator("That's it. You read it correctly. Close it out.");
            else pushNarrator("Right call. Finish it.");
        }
    };

    if (!scenario || !surface) {
        return <div style={{ padding: '3rem', color: '#ff3333', fontFamily: 'monospace' }}>Loading incident...</div>;
    }

    const initialState = scenario.initialAppState(surface);
    const irrecoverable = isIrrecoverable(degradation);
    const sessionForStreak = getSession();

    const investigationActions = scenario.actions.filter(a => a.category === 'investigation');
    const modificationActions = scenario.actions.filter(a => a.category === 'modification');
    const reflexiveActions = scenario.actions.filter(a => a.category === 'reflexive');

    const blindPct = Math.min(100, (degradation.blindActionCount / degradation.irrecoverableThreshold) * 100);

    // Narrator Box classes
    let narratorClass = styles.narratorBox;
    if (degradation.blindActionCount >= 13) narratorClass += ` ${styles.critical}`;
    else if (degradation.blindActionCount >= 5) narratorClass += ` ${styles.warning}`;
    if (isSilentSenior && !resolved) narratorClass += ` ${styles.silent}`;



    return (
        <>
            {/* Resolution Sequence 1: CASE CLOSEDOverlay */}
            {caseClosedFlash && (
                <div className={styles.caseClosedOverlay}>
                    <div className={styles.caseTitle}>CASE CLOSED</div>
                    <div className={styles.caseSummary}>{scenario.narratorScript?.resolution || "System stability verified."}</div>
                    <div className={styles.xpAward}>+{(getCost('open_console') > 0 ? 50 : 0) + 100} XP</div>  {/* Example raw calc */}
                </div>
            )}

            {/* Resolution Sequence 2: MOMENTUM SCREENOverlay */}
            {momentumVisible && (
                <div className={styles.momentumScreenOverlay}>
                    {degradation.blindActionCount === 0 ? (
                        <div className={styles.momentumStreak}>CLEAN SOLVE: {sessionForStreak.streak}</div>
                    ) : (
                        <div className={`${styles.momentumStreak} ${styles.broken}`}>CASE CLOSED</div>
                    )}
                    <div className={styles.momentumTease}>{scenario.momentumTease}</div>
                    <div className={styles.momentumProgressBarContainer}>
                        <div className={styles.momentumProgressBarFill} style={{ width: `${Math.floor(((levelIndex + 1 + (moduleId - 1) * 5) / 15) * 100)}%` }} />
                    </div>
                    <div className={styles.momentumProgressLabel}>CASE {(levelIndex + 1) + (moduleId - 1) * 5} OF 15</div>
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
                        <span className={styles.topBarClueCount}>CLUE {investigationCount} OF {totalClues} FOUND</span>
                    </div>
                </div>

                <div className={styles.main}>
                    {/* Environment Panel */}
                    <div className={styles.environmentPanel}>

                        <div className={styles.scenarioDescTitle}>// CASE FILE</div>

                        <div className={styles.dispatchMessage}>
                            <div className={styles.dispatchHeader}>SLACK — #incidents — just now</div>
                            <div className={styles.dispatchText}>{scenario.dispatchMessage || scenario.twoLineDescription}</div>
                        </div>

                        {/* SENIOR Narrator Box */}
                        <div className={narratorClass}>
                            {investigationCount === 0 && !hasFirstActionFired && (
                                <div className={styles.seniorIntroBlock}>
                                    <div className={styles.seniorIntroTitle}>// WHO IS SENIOR?</div>
                                    <div className={styles.seniorIntroText}>
                                        &quot;Your partner on this case. Been debugging production for 15 years. Won&apos;t give you the answer. Will tell you what the evidence means.&quot;
                                    </div>
                                </div>
                            )}

                            <span className={`${styles.narratorLabel} ${isSilentSenior && !resolved ? styles.silent : ''}`}>
                                // {isSilentSenior && !resolved ? 'SENIOR — STANDING BY' : 'SENIOR'}
                            </span>

                            {isTimePressure && !articulationOpen && (
                                <span className={styles.timePressureText}>CLIENT CALL IN: {formatTime(countdownTime)}</span>
                            )}

                            {clueTriggeredFlash && <span className={styles.clueFlash}>// CLUE FOUND</span>}

                            <div className={styles.narratorText}>
                                <TerminalLine text={narratorMsgs[narratorMsgs.length - 1] || ''} active={true} />
                            </div>

                            {/* Deduction Moment Gate */}
                            {articulationOpen && !articulationConfirmed && (
                                <div className={styles.deductionContainer}>
                                    <input
                                        type="text"
                                        className={styles.deductionInput}
                                        placeholder="e.g. the env variable is missing in production"
                                        value={articulationInput}
                                        onChange={e => setArticulationInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleDeductionSubmit()}
                                    />
                                    <button
                                        className={styles.deductionBtn}
                                        onClick={handleDeductionSubmit}
                                        disabled={articulationInput.trim().split(/\s+/).filter(w => w.length > 0).length < 4 && !timePressureZero}
                                        style={{
                                            opacity: (articulationInput.trim().split(/\s+/).filter(w => w.length > 0).length >= 4 || timePressureZero) ? 1 : 0.4,
                                            cursor: (articulationInput.trim().split(/\s+/).filter(w => w.length > 0).length >= 4 || timePressureZero) ? 'pointer' : 'not-allowed'
                                        }}
                                    >MAKE THE CALL →</button>
                                </div>
                            )}
                        </div>

                        <div className={styles.envTitle}>
                            <div className={`${styles.envStatusDot} ${resolved ? styles.stable : ''}`} />
                            System Environment
                        </div>

                        <div className={styles.codeBlock}>
                            <TerminalLine text={initialState} active={mounted && !caseClosedFlash} />
                        </div>

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
                                <span className={styles.actionCategoryLabel}>↓ EXAMINE SCENE</span>
                                {investigationActions.map((action, idx) => (
                                    <div key={action.id} className={styles.actionBtnWrapper}>
                                        <button
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
                                        {TOOLTIPS[action.id] && <div className={styles.actionTooltip}>{TOOLTIPS[action.id]}</div>}
                                    </div>
                                ))}
                            </div>
                        )}

                        {modificationActions.length > 0 && (
                            <div className={styles.actionCategory}>
                                <span className={styles.actionCategoryLabel}>⚡ MAKE YOUR MOVE</span>
                                {modificationActions.map((action, idx) => {
                                    // Make Your Move unlocks ONLY when the deduction is made
                                    // The exception is the red herring button which is open unconditionally until clicked
                                    const isRedHerringBtn = isRedHerring && action.id === 'add_cors_header';
                                    const isLocked = !modifyUnlocked && !resolved && !isRedHerringBtn;
                                    return (
                                        <div key={action.id} className={styles.actionBtnWrapper}>
                                            <button
                                                className={`${styles.actionBtn} ${isRedHerringBtn ? styles.redHerringBtn : ''} ${(!!pendingAction || irrecoverable || resolved || isLocked) ? styles.disabled : ''}`}
                                                onClick={() => !isLocked && handleAction(action)}
                                                disabled={!!pendingAction || irrecoverable || resolved || isLocked}
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
                                            {/* If a red herring, no tooltip unless specified, but we'll fall back to default if not.*/}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {reflexiveActions.length > 0 && (
                            <div className={styles.actionCategory}>
                                <span className={styles.actionCategoryLabel}>↺ TOOLS</span>
                                {reflexiveActions.map((action, idx) => (
                                    <div key={action.id} className={styles.actionBtnWrapper}>
                                        <button
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
                                        {TOOLTIPS[action.id] && <div className={styles.actionTooltip}>{TOOLTIPS[action.id]}</div>}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className={styles.blindActionCounter}>
                            <span style={{ color: blindPct > 60 ? '#ff3333' : blindPct > 30 ? '#ff6600' : '#888' }}>
                                Scene Integrity
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

                        <div className={styles.resolveBtn}>
                            <button
                                className={`${styles.resolveBtnInner} ${canResolve && !resolved ? styles.resolveBtnReady : ''}`}
                                onClick={handleResolve}
                                disabled={!canResolve || resolved}
                            >
                                {resolved ? '✓ RESOLVED' : canResolve ? 'CLOSE THE CASE →' : 'VERDICT PENDING'}
                            </button>
                            <div className={styles.resolveBtnHint}>
                                {canResolve
                                    ? 'System state has converged. Confirm to process the paperwork.'
                                    : `Read the scene. Find the signals. Make the call.`}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
