import styles from "./CommitmentGradient.module.css";
// import Link from 'next/link';

export default function CommitmentGradient() {
    return (
        <section id="commitment" className={`section ${styles.commitmentSection}`}>
            <div className="container">
                <div className={styles.terminalBox}>
                    <div className={styles.terminalHeader}>
                        <span className={styles.dot}></span>
                        <span className={styles.dot}></span>
                        <span className={styles.dot}></span>
                        <span className="system-voice" style={{ marginLeft: 'auto' }}>System Check</span>
                    </div>
                    <div className={styles.terminalBody}>
                        <p className="mono">&gt; Initializing Failure Sequences...</p>
                        <p className="mono">&gt; You will investigate failures manually.</p>
                        <p className="mono">&gt; AI assistance may be restricted.</p>
                        <p className="mono">&gt; Completion is not guaranteed.</p>
                        <p className="mono" style={{ marginTop: '1rem' }}>&gt; Proceed?</p>
                        <div className={styles.actions}>
                            <button className="btn btn-accent">Acknowledge & Proceed</button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
