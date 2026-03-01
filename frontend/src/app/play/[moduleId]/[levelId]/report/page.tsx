'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getLevelProgress, getSession, type Tier } from '@/engine/sessionStore';
import { getActionLog } from '@/engine/actionLogger';
import { detectAIDependency } from '@/engine/actionLogger';
import { assignTier } from '@/engine/tierEngine';
import { generateTransferReflection } from '@/engine/transferReflection';
import { getScenario, getModule } from '@/scenarios/index';
import styles from './Report.module.css';

// Sequential reveal: each section appears after the previous with a delay
const REVEAL_PHASES = ['stabilizing', 'tier', 'behavior', 'ai', 'reflection', 'next'] as const;
type Phase = typeof REVEAL_PHASES[number];

export default function ReportPage() {
    const params = useParams();
    const moduleId = Number(params.moduleId);
    const levelIndex = Number(params.levelId) - 1;
    const levelId = `${moduleId}-${levelIndex + 1}`;

    const scenario = getScenario(levelId);
    const mod = getModule(moduleId);
    const [phase, setPhase] = useState<number>(0); // index into REVEAL_PHASES
    const [tierResult, setTierResult] = useState<ReturnType<typeof assignTier> | null>(null);
    const [aiResult, setAiResult] = useState<ReturnType<typeof detectAIDependency> | null>(null);
    const [reflections, setReflections] = useState<ReturnType<typeof generateTransferReflection>>([]);
    const [progress, setProgress] = useState<ReturnType<typeof getLevelProgress> | null>(null);
    const [currentStreak, setCurrentStreak] = useState(0);

    const nextLevelExists = levelIndex < 4; // 5 levels per module (0-4)
    const nextLevelPath = nextLevelExists
        ? `/play/${moduleId}/${levelIndex + 2}`
        : moduleId < 3
            ? `/play/${moduleId + 1}`
            : '/play';

    const nextLevelLabel = nextLevelExists
        ? `Level ${moduleId}.${levelIndex + 2} →`
        : moduleId < 3
            ? `Module ${moduleId + 1}: ${getModule(moduleId + 1)?.title} →`
            : 'Simulation Complete →';

    useEffect(() => {
        const session = getSession();
        const prog = getLevelProgress(moduleId, levelId);
        setProgress(prog);
        setCurrentStreak(session.streak);

        const log = getActionLog(moduleId, levelId);
        if (log) {
            const tier = assignTier(log, prog.timeSpent, prog.attempts > 1, false);
            setTierResult(tier);

            const ai = detectAIDependency(log);
            setAiResult(ai);

            const refs = generateTransferReflection(moduleId, log, tier.tier);
            setReflections(refs);
        }

        // Sequential phase reveal
        const delays = [1500, 2000, 1500, 1200, 1500];
        let currentPhase = 0;

        function advance() {
            currentPhase += 1;
            setPhase(currentPhase);
            if (currentPhase < REVEAL_PHASES.length - 1) {
                setTimeout(advance, delays[currentPhase] || 1500);
            }
        }

        const initialDelay = setTimeout(advance, 1800);
        return () => clearTimeout(initialDelay);
    }, [moduleId, levelId]);

    if (!scenario || !mod) return null;

    const currentPhaseName = REVEAL_PHASES[phase];
    const show = (p: Phase) => REVEAL_PHASES.indexOf(p) <= phase;

    const tierColors: Record<Tier, string> = {
        guidance: '#555',
        independent: '#00ff88',
        efficient: '#00aaff',
        reliable: '#ffff00',
    };

    return (
        <div className={styles.reportPage}>
            <div className={styles.breadcrumb}>
                <Link href="/play">Simulation</Link>
                {' → '}
                <Link href={`/play/${moduleId}`}>Module {moduleId}</Link>
                {' → '} Level {moduleId}.{levelIndex + 1} — Report
            </div>

            {/* Phase 0: Stabilizing */}
            {phase === 0 && (
                <div className={styles.stabilizing}>
                    <div className={styles.stabilizingText}>System Stabilizing...</div>
                    <div className={styles.stabilizingBar}>
                        <div className={styles.stabilizingFill} />
                    </div>
                </div>
            )}

            {/* Phase 1+: Tier Reveal */}
            {show('tier') && tierResult && (
                <div className={styles.reportSection}>
                    {currentStreak > 1 && (
                        <div className={styles.streakBanner}>
                            🔥 Streak: {currentStreak} consecutive resolved incidents
                        </div>
                    )}
                    <div
                        className={styles.tierReveal}
                        style={{ color: tierColors[tierResult.tier] || '#fff' }}
                    >
                        <div className={styles.tierLabel}>Recovery Assessment</div>
                        <div className={`${styles.tierTitle} ${styles[tierResult.tier]}`}>
                            {tierResult.tierLabel}
                        </div>
                        <div className={styles.tierDesc}>{tierResult.tierDescription}</div>
                        <div className={styles.xpGain}>+{tierResult.xpAwarded} XP</div>
                    </div>
                </div>
            )}

            {/* Phase 2: Behavioral Analysis */}
            {show('behavior') && tierResult && aiResult && (
                <div className={styles.reportSection}>
                    <div className={styles.sectionTitle}>Behavioral Pattern Analysis</div>
                    <div className={styles.behavioralGrid}>
                        <div className={styles.behaviorStat}>
                            <div className={styles.behaviorStatLabel}>Signal-to-Action Ratio</div>
                            <div className={styles.behaviorStatValue}>
                                {(aiResult.signalToActionRatio * 100).toFixed(0)}%
                            </div>
                            <div className={styles.behaviorStatSub}>
                                {aiResult.signalToActionRatio >= 0.5 ? 'Investigation-led approach' : 'Low investigation rate'}
                            </div>
                        </div>
                        <div className={styles.behaviorStat}>
                            <div className={styles.behaviorStatLabel}>Sources Consulted</div>
                            <div className={styles.behaviorStatValue}>{aiResult.uniqueSourcesConsulted}</div>
                            <div className={styles.behaviorStatSub}>distinct information sources</div>
                        </div>
                        <div className={styles.behaviorStat}>
                            <div className={styles.behaviorStatLabel}>Read-to-Modify Ratio</div>
                            <div className={styles.behaviorStatValue}>
                                {aiResult.readingToModifyRatio.toFixed(1)}x
                            </div>
                            <div className={styles.behaviorStatSub}>
                                {aiResult.readingToModifyRatio >= 2 ? 'Read before acting' : 'Acted quickly after reading'}
                            </div>
                        </div>
                        <div className={styles.behaviorStat}>
                            <div className={styles.behaviorStatLabel}>Investigation Time</div>
                            <div className={styles.behaviorStatValue}>
                                {progress ? Math.floor(progress.timeSpent / 60) : 0}m {progress ? progress.timeSpent % 60 : 0}s
                            </div>
                            <div className={styles.behaviorStatSub}>total scenario duration</div>
                        </div>
                    </div>

                    {tierResult.behavioralSummary.length > 0 && (
                        <div className={styles.behavioralFlags}>
                            {tierResult.behavioralSummary.map((flag, i) => (
                                <div
                                    key={i}
                                    className={`${styles.flagItem} ${flag.startsWith('⚠') ? styles.warning : ''}`}
                                >
                                    {flag}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Phase 3: AI Dependency */}
            {show('ai') && aiResult && (
                <div className={styles.reportSection}>
                    <div className={styles.sectionTitle}>Reasoning Pattern</div>
                    <div className={`${styles.aiDependencyBlock} ${aiResult.flagged ? styles.aiDependencyFlagged : ''}`}>
                        <div className={`${styles.aiDependencyLabel} ${aiResult.flagged ? styles.flagged : styles.clean}`}>
                            {aiResult.flagged
                                ? '⚠ Externalized Reasoning Dependency Detected'
                                : '✓ Independent Reasoning Pattern'}
                        </div>
                        <div className={styles.aiDependencyDesc}>
                            {aiResult.flagged
                                ? `Behavioral signals indicate possible dependency on external reasoning patterns. Observed: ${aiResult.signals.slice(0, 2).join('. ')}. This pattern is common and improvable through deliberate hypothesis-first investigation.`
                                : 'Investigation pattern is consistent with independent reasoning. Hypothesis formation and systematic source consultation observed.'}
                        </div>
                    </div>
                </div>
            )}

            {/* Phase 4: Transfer Reflection */}
            {show('reflection') && reflections.length > 0 && (
                <div className={styles.reportSection}>
                    <div className={styles.sectionTitle}>Real-World Transfer</div>
                    <div className={styles.reflectionList}>
                        {reflections.map((r, i) => (
                            <div key={i} className={styles.reflectionItem}>
                                <div className={styles.reflectionObserved}>
                                    &ldquo;{r.behaviorObserved}&rdquo;
                                </div>
                                <div className={styles.reflectionArrow}>↓ real-world application</div>
                                <div className={styles.reflectionRealWorld}>{r.realWorldMapping}</div>
                                {r.timeSaved && (
                                    <div className={styles.reflectionTimeSaved}>Average time saved: {r.timeSaved}</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Phase 5: Next Level CTA */}
            {show('next') && (
                <div className={styles.reportSection}>
                    <div className={styles.ctaRow}>
                        <Link href={nextLevelPath} className={styles.nextBtn}>
                            {nextLevelLabel}
                        </Link>
                        <Link href={`/play/${moduleId}/${levelIndex + 1}`} className={styles.replayBtn}>
                            ↺ Replay Level
                        </Link>
                        <Link href="/play" className={styles.replayBtn}>
                            ← All Modules
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
