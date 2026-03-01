import styles from "./FailureMirror.module.css";

export default function FailureMirror() {
    return (
        <section className={`section ${styles.mirrorSection}`}>
            <div className="container">
                <div className={styles.grid}>
                    <div className={styles.scenario}>
                        <span className="system-voice">Event Log 01</span>
                        <h2>Client asks why API fails.</h2>
                    </div>
                    <div className={styles.scenario}>
                        <span className="system-voice">Event Log 02</span>
                        <h2>Deployment breaks at midnight.</h2>
                    </div>
                    <div className={styles.scenario}>
                        <span className="system-voice">Event Log 03</span>
                        <h2>Console shows red errors.</h2>
                    </div>
                    <div className={styles.scenario}>
                        <span className="system-voice">Event Log 04</span>
                        <h2>Git conflict appears.</h2>
                    </div>
                </div>
            </div>
        </section>
    );
}
