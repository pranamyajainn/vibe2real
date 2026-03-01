'use client';

import React from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { getScenario } from '@/scenarios/index';
import { getConcept } from '@/scenarios/primerConcepts';
import EmmaChat from '@/components/EmmaChat';
import styles from './Primer.module.css';

export default function PrimerPage() {
    const params = useParams();
    const moduleId = Number(params.moduleId);
    const levelIndex = Number(params.levelId) - 1;
    const levelId = `${moduleId}-${levelIndex + 1}`;

    const scenario = getScenario(levelId);
    if (!scenario) return notFound();

    // If the scenario has no concept mapped, skip straight to the game
    if (!scenario.conceptId) {
        if (typeof window !== 'undefined') {
            window.location.href = `/play/${moduleId}/${levelIndex + 1}`;
        }
        return null;
    }

    const concept = getConcept(scenario.conceptId);
    if (!concept) return notFound();

    return (
        <div className={styles.page}>
            <div className={styles.breadcrumb}>
                <Link href="/play">Simulation</Link>
                {' → '}
                <Link href={`/play/${moduleId}`}>Module {moduleId}</Link>
                {' → '} Concept Primer
            </div>

            <div className={styles.topRow}>
                <div>
                    <span className={styles.preTitle}>First Principles</span>
                    <h1 className={styles.title}>{concept.title}</h1>
                </div>
            </div>

            <div className={styles.oneLiner}>
                {concept.oneLiner}
            </div>

            <div className={styles.split}>
                {/* Left: Terminal ASCII Diagram */}
                <div className={styles.diagramPanel}>
                    <span className={styles.boxLabel}>System Mental Model</span>
                    <div className={styles.diagramBox}>
                        <div className={styles.ascii}>{concept.diagram}</div>
                    </div>
                </div>

                {/* Right: Context & Facts */}
                <div className={styles.contextPanel}>
                    <div className={styles.whyBlock}>
                        <span className={styles.boxLabel}>Why Vibe Coders Need This</span>
                        <p>{concept.whyItMatters}</p>
                    </div>

                    <div className={styles.factsBlock}>
                        <span className={styles.boxLabel}>Key Immutable Facts</span>
                        <ul className={styles.factsList}>
                            {concept.keyFacts.map((fact, i) => (
                                <li key={i} className={styles.factItem}>{fact}</li>
                            ))}
                        </ul>
                    </div>

                    <div className={styles.analogy}>
                        <span style={{ color: '#ff6600', fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>
                            Real World Analogy
                        </span>
                        {concept.realWorldAnalogy}
                    </div>

                    {/* Vibe Coder Support Chat */}
                    <EmmaChat
                        conceptTitle={concept.title}
                        conceptOneLiner={concept.oneLiner}
                    />
                </div>
            </div>

            <div className={styles.actions}>
                <Link href={`/play/${moduleId}/${levelIndex + 1}`} className={styles.startBtn}>
                    Begin Incident Simulation →
                </Link>
                <Link href={`/play/${moduleId}/${levelIndex + 1}`} className={styles.skipBtn}>
                    Skip Primer
                </Link>
            </div>
        </div>
    );
}
