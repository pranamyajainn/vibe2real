import styles from "./Verification.module.css";

export default function Verification() {
    return (
        <section className={`section ${styles.verificationSection}`}>
            <div className="container">
                <div className={styles.grid}>
                    <div className={styles.info}>
                        <h2>System Authorization Token</h2>
                        <p className={styles.desc}>
                            The product does not transform identity. It verifies reality already present.
                        </p>
                        <p className={styles.price}>₹1,499</p>
                        <button className="btn btn-primary">Acquire Clearance</button>
                    </div>

                    <div className={styles.signals}>
                        <span className="system-voice">Operational Signals</span>
                        <ul className={styles.signalList}>
                            <li>Freelance Profiles</li>
                            <li>Job Applications</li>
                            <li>GitHub README</li>
                            <li>Portfolio Verification Link</li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}
