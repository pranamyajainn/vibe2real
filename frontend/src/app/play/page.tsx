'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSession, isModuleUnlocked, type ModuleProgress, type Tier } from '@/engine/sessionStore';
import { MODULES, type ModuleDefinition } from '@/scenarios/index';
import styles from './Dashboard.module.css';

function TierBadge({ tier }: { tier: Tier | null }) {
    if (!tier) return null;
    const labels: Record<Tier, string> = {
        guidance: 'RECOVERED — GUIDANCE',
        independent: 'RECOVERED — INDEPENDENT',
        efficient: 'RECOVERED — EFFICIENT',
        reliable: 'OPERATIONALLY RELIABLE',
    };
    return <span className={`${styles.tierBadge} ${styles[tier]}`}>{labels[tier]}</span>;
}

function LevelDots({ moduleId, levels, progress }: {
    moduleId: number;
    levels: { levelIndex: number }[];
    progress: ModuleProgress | null;
}) {
    return (
        <div className={styles.levelDots}>
            {levels.map((_, i) => {
                const levelId = `${moduleId}-${i + 1}`;
                const lvlProgress = progress?.levels[levelId];
                let dotClass = styles.levelDot;
                if (lvlProgress?.completed) {
                    dotClass += ` ${styles.completed}`;
                } else {
                    // Check if previous is completed
                    const prevLevelId = `${moduleId}-${i}`;
                    const prevCompleted = i === 0 || progress?.levels[prevLevelId]?.completed;
                    if (prevCompleted && !lvlProgress?.completed) {
                        dotClass += ` ${styles.current}`;
                    } else {
                        dotClass += ` ${styles.locked}`;
                    }
                }
                return <div key={i} className={dotClass} title={`Level ${moduleId}.${i + 1}`} />;
            })}
        </div>
    );
}

function ModuleCard({ mod, progress, unlocked }: {
    mod: ModuleDefinition;
    progress: ModuleProgress | null;
    unlocked: boolean;
}) {
    const completedCount = Object.values(progress?.levels || {}).filter(l => l.completed).length;

    const cardContent = (
        <>
            <div className={styles.moduleNumber}>Module {mod.id} — {mod.estimatedMinutes}min</div>
            <div className={styles.moduleTitleRow}>
                <h2 className={styles.moduleTitle}>{mod.title}</h2>
                {!unlocked && <span className={styles.lockIcon}>🔒</span>}
            </div>
            <div className={styles.moduleSubtitle}>{mod.subtitle}</div>
            <p className={styles.moduleDesc}>{mod.description}</p>
            <div className={styles.modulePrimitive}>Failure primitive: {mod.failurePrimitive}</div>
            <LevelDots moduleId={mod.id} levels={mod.levels} progress={progress} />
            {progress?.overallTier && <TierBadge tier={progress.overallTier} />}
            {unlocked && completedCount === 0 && (
                <div style={{ fontSize: '0.65rem', color: '#ff3333', marginTop: '0.75rem', letterSpacing: '0.1em' }}>
                    READY TO INVESTIGATE →
                </div>
            )}
            {unlocked && completedCount > 0 && completedCount < 5 && (
                <div style={{ fontSize: '0.65rem', color: '#ffff00', marginTop: '0.75rem', letterSpacing: '0.1em' }}>
                    {completedCount}/5 LEVELS COMPLETED
                </div>
            )}
            {progress?.completed && (
                <div style={{ fontSize: '0.65rem', color: '#00ff88', marginTop: '0.75rem', letterSpacing: '0.1em' }}>
                    ✓ MODULE COMPLETE
                </div>
            )}
        </>
    );

    if (!unlocked) {
        return (
            <div className={`${styles.moduleCard} ${styles.locked}`} aria-disabled="true">
                {cardContent}
            </div>
        );
    }

    return (
        <Link href={`/play/${mod.id}`} className={styles.moduleCard}>
            {cardContent}
        </Link>
    );
}

export default function PlayDashboard() {
    const [moduleProgressMap, setModuleProgressMap] = useState<Record<number, ModuleProgress | null>>({});
    const [unlockedMap, setUnlockedMap] = useState<Record<number, boolean>>({});

    useEffect(() => {
        const session = getSession();
        const progressMap: Record<number, ModuleProgress | null> = {};
        const unlockMap: Record<number, boolean> = {};

        for (const mod of MODULES) {
            progressMap[mod.id] = session.modules[mod.id] ?? null;
            unlockMap[mod.id] = isModuleUnlocked(mod.id);
        }

        setModuleProgressMap(progressMap);
        setUnlockedMap(unlockMap);
    }, []);

    return (
        <div className={styles.dashboard}>
            <div className={styles.statusBar}>
                <div className={styles.statusDot} />
                <span className={styles.statusText}>Simulation Environment — Active</span>
            </div>

            <h1 className={styles.mainTitle}>
                Choose Your <em>Incident.</em>
            </h1>
            <p className={styles.subtitle}>
                3 modules. 15 failure scenarios. No hints. No tutorials. Only system feedback.
            </p>

            <div className={styles.modulesGrid}>
                {MODULES.map(mod => (
                    <ModuleCard
                        key={mod.id}
                        mod={mod}
                        progress={moduleProgressMap[mod.id] ?? null}
                        unlocked={unlockedMap[mod.id] ?? (mod.id === 1)}
                    />
                ))}
            </div>

            <div className={styles.ctaBanner}>
                <span className={styles.ctaText}>
                    Certification requires all 3 modules at ≥ Recovered Independently tier. No AI dependency flags.
                </span>
                <Link href="/play/1" className={styles.ctaBtn}>
                    Start Module 1 →
                </Link>
            </div>
        </div>
    );
}
