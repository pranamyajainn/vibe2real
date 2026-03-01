import styles from "./FAQ.module.css";

export default function FAQ() {
    return (
        <section className={`section ${styles.faqSection}`}>
            <div className="container">
                <h2 className={styles.heading}>Frequently Asked Questions</h2>

                <div className={styles.faqList}>
                    <div className={styles.faqItem}>
                        <span className="system-voice">Q: Why not a course?</span>
                        <p className="mono">Courses teach knowledge. They do not install debugging instinct under pressure. This is a simulation.</p>
                    </div>

                    <div className={styles.faqItem}>
                        <span className="system-voice">Q: Who should NOT take this?</span>
                        <p className="mono">If you prefer step-by-step tutorials and want someone to give you the answer, do not enter. This is a competence filter, not an onboarding tool.</p>
                    </div>

                    <div className={styles.faqItem}>
                        <span className="system-voice">Q: What happens if you rely on AI inside the simulation?</span>
                        <p className="mono">The system enforces bounds where AI cannot see the true terminal state or the nuanced request flow. You will fail.</p>
                    </div>

                    <div className={styles.faqItem}>
                        <span className="system-voice">Q: Is prior coding knowledge required?</span>
                        <p className="mono">You must have shipped at least one application, even if heavily assisted by AI. If you don't know what a terminal is, this will be impossible.</p>
                    </div>

                    <div className={styles.faqItem}>
                        <span className="system-voice">Q: Why does completion take ~3 hours?</span>
                        <p className="mono">Real incident response takes time. Tracing through unfamiliar code, identifying network bottlenecks, and reading raw logs cannot be rushed.</p>
                    </div>

                    <div className={styles.faqItem}>
                        <span className="system-voice">Q: Why do most users fail Level 2?</span>
                        <p className="mono">Level 2 requires deep inspection of network requests and console errors without syntax highlighting or friendly hints. Most lack the foundational patience.</p>
                    </div>

                    <div className={styles.faqItem}>
                        <span className="system-voice">Q: What happens if I quit?</span>
                        <p className="mono">The system logs an incomplete run. Your dependency on AI remains unbroken.</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
