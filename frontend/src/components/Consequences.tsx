import styles from "./Consequences.module.css";

export default function Consequences() {
    return (
        <section className={`section ${styles.consequencesSection}`}>
            <div className="container">
                <div className={styles.wrapper}>
                    <div className={styles.causeEffect}>
                        <div className={styles.cause}>
                            <span className="system-voice">Detected: Incompetence</span>
                        </div>
                        <div className={styles.effect}>
                            <h3>Lost freelance contract.</h3>
                        </div>
                    </div>

                    <div className={styles.causeEffect}>
                        <div className={styles.cause}>
                            <span className="system-voice">Detected: AI Dependency</span>
                        </div>
                        <div className={styles.effect}>
                            <h3>PR rejected after technical questioning.</h3>
                        </div>
                    </div>

                    <div className={styles.causeEffect}>
                        <div className={styles.cause}>
                            <span className="system-voice">Detected: System Ignorance</span>
                        </div>
                        <div className={styles.effect}>
                            <h3>Startup demo collapse during live debugging.</h3>
                        </div>
                    </div>

                    <div className={styles.causeEffect}>
                        <div className={styles.cause}>
                            <span className="system-voice">Detected: Surface Knowledge</span>
                        </div>
                        <div className={styles.effect}>
                            <h3>Senior engineer asking "walk me through this request flow."</h3>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
