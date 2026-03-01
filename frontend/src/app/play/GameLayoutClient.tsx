'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSession } from '@/engine/sessionStore';
import styles from './GameLayout.module.css';

export default function GameLayoutClient({ children }: { children: React.ReactNode }) {
    const [xp, setXP] = useState(0);
    const [streak, setStreak] = useState(0);
    const [anonId, setAnonId] = useState('USR_????');

    useEffect(() => {
        const session = getSession();
        setXP(session.totalXP);
        setStreak(session.streak);
        setAnonId(session.anonymousId);

        const interval = setInterval(() => {
            const s = getSession();
            setXP(s.totalXP);
            setStreak(s.streak);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className={styles.gameLayout}>
            <header className={styles.gameHeader}>
                <Link href="/play" className={styles.logoMark}>
                    Vibe<em>2</em>Real
                </Link>
                <div className={styles.headerMeta}>
                    {xp > 0 && (
                        <span className={styles.xpDisplay}>XP: <span>{xp.toLocaleString()}</span></span>
                    )}
                    {streak > 1 && (
                        <span className={styles.streakDisplay}>
                            🔥 <span>{streak}</span>
                        </span>
                    )}
                    <Link
                        href="/play/leaderboard"
                        className={styles.anonId}
                        style={{ textDecoration: 'none', cursor: 'pointer' }}
                    >
                        {anonId}
                    </Link>
                </div>
            </header>
            <main className={styles.gameContent}>
                {children}
            </main>
        </div>
    );
}
