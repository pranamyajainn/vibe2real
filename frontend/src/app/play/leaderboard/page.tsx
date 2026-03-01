'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSession, type Tier } from '@/engine/sessionStore';
import styles from './Leaderboard.module.css';

// Seeded mock entries to fill leaderboard with realistic anonymous data
const MOCK_ENTRIES = [
    { anonymousId: 'USR_F2A3', xp: 4200, tier: 'reliable' as Tier, time: '1h 47m', modules: 3, aiFlag: false },
    { anonymousId: 'USR_9E1B', xp: 3800, tier: 'reliable' as Tier, time: '2h 12m', modules: 3, aiFlag: false },
    { anonymousId: 'USR_C711', xp: 3250, tier: 'efficient' as Tier, time: '2h 38m', modules: 3, aiFlag: false },
    { anonymousId: 'USR_7D4A', xp: 2900, tier: 'efficient' as Tier, time: '3h 05m', modules: 3, aiFlag: false },
    { anonymousId: 'USR_0B8C', xp: 2600, tier: 'independent' as Tier, time: '3h 20m', modules: 3, aiFlag: false },
    { anonymousId: 'USR_3F6E', xp: 2200, tier: 'independent' as Tier, time: '3h 55m', modules: 3, aiFlag: true },
    { anonymousId: 'USR_A22D', xp: 1800, tier: 'independent' as Tier, time: '4h 12m', modules: 2, aiFlag: false },
    { anonymousId: 'USR_E55F', xp: 1500, tier: 'independent' as Tier, time: '—', modules: 2, aiFlag: false },
    { anonymousId: 'USR_8B3C', xp: 1100, tier: 'guidance' as Tier, time: '—', modules: 2, aiFlag: true },
    { anonymousId: 'USR_2A9B', xp: 750, tier: 'guidance' as Tier, time: '—', modules: 1, aiFlag: false },
];

interface LeaderboardEntry {
    anonymousId: string;
    xp: number;
    tier: Tier;
    time: string;
    modules: number;
    aiFlag: boolean;
}

function TierCell({ tier }: { tier: Tier }) {
    const labels: Record<Tier, string> = {
        guidance: 'GUIDANCE',
        independent: 'INDEPENDENT',
        efficient: 'EFFICIENT',
        reliable: 'RELIABLE',
    };
    return <span className={`${styles.tierCell} ${styles[tier]}`}>{labels[tier]}</span>;
}

export default function LeaderboardPage() {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [myAnon, setMyAnon] = useState('');
    const [myXP, setMyXP] = useState(0);

    useEffect(() => {
        const session = getSession();
        setMyAnon(session.anonymousId);
        setMyXP(session.totalXP);

        // Merge real session with mock entries, sort by XP
        const myEntry: LeaderboardEntry = {
            anonymousId: session.anonymousId,
            xp: session.totalXP,
            tier: 'guidance',
            time: '—',
            modules: Object.values(session.modules).filter(m => m.completed).length,
            aiFlag: false,
        };

        const all = session.totalXP > 0
            ? [...MOCK_ENTRIES, myEntry].sort((a, b) => b.xp - a.xp)
            : MOCK_ENTRIES;

        setEntries(all);
    }, []);

    const totalPlayers = entries.length;
    const topXP = entries[0]?.xp ?? 0;
    const reliableCount = entries.filter(e => e.tier === 'reliable').length;

    return (
        <div className={styles.container}>
            <div className={styles.pageHeader}>
                <span className={styles.pageTag}>Public Leaderboard — Live</span>
                <h1 className={styles.pageTitle}>Recovery Rankings</h1>
                <p className={styles.pageSubtitle}>
                    Anonymous. Ranked by XP. All 3 modules required for certification eligibility.
                </p>
            </div>

            {/* Stats grid — Simulator timeReality style */}
            <div className={styles.statsRow}>
                <div className={styles.statBox}>
                    <span className={styles.statLabel}>Total Participants</span>
                    <span className={styles.statValue}>{totalPlayers}</span>
                </div>
                <div className={styles.statBox}>
                    <span className={styles.statLabel}>Highest XP</span>
                    <span className={styles.statValue}>{topXP.toLocaleString()}</span>
                </div>
                <div className={styles.statBox}>
                    <span className={styles.statLabel}>Operationally Reliable</span>
                    <span className={styles.statValue}>{reliableCount}</span>
                </div>
                <div className={styles.statBox}>
                    <span className={styles.statLabel}>Fastest Completion</span>
                    <span className={styles.statValue}>1h 47m</span>
                </div>
            </div>

            {/* Rankings table */}
            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Identifier</th>
                            <th>XP</th>
                            <th>Best Tier</th>
                            <th>Modules</th>
                            <th>Fastest</th>
                            <th>AI Flag</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map((entry, i) => {
                            const isMe = entry.anonymousId === myAnon;
                            const rankClass =
                                i === 0 ? styles.gold : i === 1 ? styles.silver : i === 2 ? styles.bronze : '';
                            return (
                                <tr
                                    key={entry.anonymousId}
                                    className={styles.tableRow}
                                    style={isMe ? { background: '#0d0800' } : undefined}
                                >
                                    <td className={`${styles.rankCell} ${rankClass}`}>
                                        {i === 0 ? '▲ 1' : i + 1}
                                    </td>
                                    <td className={styles.anonCell}>
                                        {entry.anonymousId}
                                        {isMe && (
                                            <span style={{ color: '#ff3333', marginLeft: '0.5rem', fontSize: '0.7rem' }}>
                                                ← YOU
                                            </span>
                                        )}
                                    </td>
                                    <td className={styles.xpCell}>{entry.xp.toLocaleString()}</td>
                                    <td><TierCell tier={entry.tier} /></td>
                                    <td style={{ color: entry.modules === 3 ? '#00ff88' : '#555' }}>
                                        {entry.modules}/3
                                    </td>
                                    <td className={styles.timeCell}>{entry.time}</td>
                                    <td style={{ color: entry.aiFlag ? '#ff3333' : '#333', fontSize: '0.8rem' }}>
                                        {entry.aiFlag ? '⚠ FLAGGED' : '—'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {entries.length === 0 && (
                    <div className={styles.emptyState}>No entries yet. Be first.</div>
                )}
            </div>

            <div className={styles.ctaRow}>
                <Link href="/play" className={styles.startBtn}>
                    {myXP > 0 ? 'Continue Simulation →' : 'Start Simulation →'}
                </Link>
                <Link href="/play" style={{
                    fontFamily: 'var(--font-mono), monospace',
                    fontSize: '0.85rem',
                    color: '#444',
                    textDecoration: 'none',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                }}>
                    ← All Modules
                </Link>
            </div>
        </div>
    );
}
