import styles from "./SocialProof.module.css";

export default function SocialProof() {
    return (
        <section className={`section ${styles.socialSection}`}>
            <div className="container">
                <h2 className={styles.heading}>System Metrics</h2>

                <div className={styles.metricsGrid}>
                    <div className={styles.metricBox}>
                        <span className={styles.metricValue}>87%</span>
                        <span className="system-voice">Global Failure Rate</span>
                    </div>

                    <div className={styles.metricBox}>
                        <span className={styles.metricValue}>4.2</span>
                        <span className="system-voice">Average Attempts</span>
                    </div>

                    <div className={styles.metricBox}>
                        <span className={styles.metricValue}>13%</span>
                        <span className="system-voice">Global Completion Rate</span>
                    </div>
                </div>

                <div className={styles.leaderboard}>
                    <div className={styles.leaderboardHeader}>
                        <span className="system-voice">Authorized Personnel (Top Survivors)</span>
                    </div>
                    <ul className={styles.survivorList}>
                        <li><span className="mono">USR_0921</span> <span className={styles.score}>01h 47m</span></li>
                        <li><span className="mono">USR_1044</span> <span className={styles.score}>01h 55m</span></li>
                        <li><span className="mono">USR_0032</span> <span className={styles.score}>02h 11m</span></li>
                        <li><span className="mono">USR_4991</span> <span className={styles.score}>02h 19m</span></li>
                        <li><span className="mono">USR_8820</span> <span className={styles.score}>02h 24m</span></li>
                    </ul>
                </div>
            </div>
        </section>
    );
}
