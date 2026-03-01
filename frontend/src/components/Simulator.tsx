import styles from "./Simulator.module.css";

export default function Simulator() {
    return (
        <section className={`section ${styles.simulatorSection}`}>
            <div className="container">
                <h2 className={styles.heading}>The Simulator</h2>

                <div className={styles.modules}>
                    <div className={styles.module}>
                        <div className={styles.moduleHeader}>
                            <span className="system-voice">Level 1</span>
                            <h3>Trace the Request</h3>
                        </div>
                        <p className={styles.moduleDesc}>Frontend to backend. Request to response. No magic, only logic.</p>
                    </div>

                    <div className={styles.module}>
                        <div className={styles.moduleHeader}>
                            <span className="system-voice">Level 2</span>
                            <h3>Read the Failure</h3>
                        </div>
                        <p className={styles.moduleDesc}>Dev tools. Network tab. Console errors. Locate the exact breakage point.</p>
                    </div>

                    <div className={styles.module}>
                        <div className={styles.moduleHeader}>
                            <span className="system-voice">Level 3</span>
                            <h3>Ship Without AI</h3>
                        </div>
                        <p className={styles.moduleDesc}>Terminal basics. Git conflicts. Manual deployment. Survive the command line.</p>
                    </div>
                </div>

                <div className={styles.timeReality}>
                    <div className={styles.timeBox}>
                        <span className="system-voice">Estimated Investigation Time</span>
                        <span className={styles.timeValue}>3h</span>
                    </div>
                    <div className={styles.timeBox}>
                        <span className="system-voice">Average Completion Time</span>
                        <span className={styles.timeValue}>4h 12m</span>
                    </div>
                    <div className={styles.timeBox}>
                        <span className="system-voice">Fastest Recorded Recovery</span>
                        <span className={styles.timeValue}>1h 47m</span>
                    </div>
                </div>

                <div className={styles.antiTutorial}>
                    <span className="system-voice">Anti-Tutorial Guarantee:</span>
                    <p className="mono">No guided walkthroughs. No step-by-step hints. Only system feedback.</p>
                </div>
            </div>
        </section>
    );
}
