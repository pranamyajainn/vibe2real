import styles from "./Credibility.module.css";

export default function Credibility() {
    return (
        <section className={`section ${styles.credibilitySection}`}>
            <div className="container">
                <h2 className={styles.heading}>Failure Visibility</h2>

                <div className={styles.rulesGrid}>
                    <div className={styles.ruleBox}>
                        <span className="system-voice">01. Manual Investigation</span>
                        <p>You will be forced to investigate failures manually. Real tools simulated: Network tab, logs, terminal.</p>
                    </div>

                    <div className={styles.ruleBox}>
                        <span className="system-voice">02. Restricted AI</span>
                        <p className="mono">AI assistance is strictly disabled within the simulation bounds.</p>
                    </div>

                    <div className={styles.ruleBox}>
                        <span className="system-voice">03. High Probability of Failure</span>
                        <p>You will fail scenarios. Time pressure and strict failure states are enforced.</p>
                    </div>

                    <div className={styles.ruleBox}>
                        <span className="system-voice">04. No Guarantees</span>
                        <p>Completion is not guaranteed. Most users retry multiple times before succeeding.</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
