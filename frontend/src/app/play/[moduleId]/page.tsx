'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getSession, type LevelProgress, type Tier } from '@/engine/sessionStore';
import { getModule } from '@/scenarios/index';
import styles from './SubLevelList.module.css';

function TierSmall({ tier }: { tier: Tier }) {
    const labels: Record<Tier, string> = {
        guidance: 'GUIDANCE',
        independent: 'INDEPENDENT',
        efficient: 'EFFICIENT',
        reliable: 'RELIABLE',
    };
    return <span className={`${styles.tierSmall} ${styles[tier]}`}>{labels[tier]}</span>;
}

export default function ModulePage() {
    const params = useParams();
    const moduleId = Number(params.moduleId);
    const mod = getModule(moduleId);

    const [levelProgressMap, setLevelProgressMap] = useState<Record<string, LevelProgress>>({});
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const session = getSession();
        const modProgress = session.modules[moduleId];
        if (modProgress) {
            setLevelProgressMap(modProgress.levels);
        }
    }, [moduleId]);

    if (!mod) {
        return (
            <div className={styles.container}>
                <p style={{ color: '#ff3333' }}>Module not found.</p>
                <Link href="/play">← Back</Link>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.breadcrumb}>
                <Link href="/play">Simulation</Link>
                <span>→</span>
                Module {moduleId}
            </div>

            <div className={styles.moduleHeader}>
                <span className={styles.moduleTag}>Module {moduleId} — {mod.estimatedMinutes}min estimate</span>
                <h1 className={styles.moduleTitle}>{mod.title}</h1>
                <p className={styles.moduleSubtitle}>{mod.subtitle}</p>
                <p className={styles.mentalModel}>{mod.mentalModel}</p>
            </div>

            <div className={styles.levelList}>
                {mod.levels.map((level, index) => {
                    const levelId = `${moduleId}-${index + 1}`;
                    const progress = levelProgressMap[levelId];
                    const prevLevelId = `${moduleId}-${index}`;
                    const prevCompleted = index === 0 || levelProgressMap[prevLevelId]?.completed;
                    const isUnlocked = mounted ? (prevCompleted || !!progress?.completed) : index === 0;
                    const isNext = mounted && !progress?.completed && isUnlocked;

                    if (!isUnlocked) {
                        return (
                            <div key={levelId} className={`${styles.levelCard} ${styles.locked}`}>
                                <span className={styles.levelIndex}>{moduleId}.{index + 1}</span>
                                <div className={styles.levelInfo}>
                                    <div className={styles.levelTitle}>{level.title}</div>
                                    <div className={styles.levelArchetype}>{level.failureArchetype}</div>
                                </div>
                                <div className={styles.levelStatus}>
                                    <span className={styles.statusLocked}>🔒 LOCKED</span>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <Link key={levelId} href={`/play/${moduleId}/${index + 1}/primer`} className={styles.levelCard}>
                            <span className={styles.levelIndex}>{moduleId}.{index + 1}</span>
                            <div className={styles.levelInfo}>
                                <div className={styles.levelTitle}>{level.title}</div>
                                <div className={styles.levelArchetype}>{level.failureArchetype}</div>
                            </div>
                            <div className={styles.levelStatus}>
                                {progress?.completed ? (
                                    <>
                                        <div className={styles.statusComplete}>✓ RESOLVED</div>
                                        {progress.tier && <TierSmall tier={progress.tier} />}
                                        {progress.attempts > 1 && (
                                            <div className={styles.attempts}>{progress.attempts} attempts</div>
                                        )}
                                    </>
                                ) : isNext ? (
                                    <div className={styles.statusNext}>→ INVESTIGATE</div>
                                ) : (
                                    <div className={styles.statusNext}>→ REPLAY</div>
                                )}
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
