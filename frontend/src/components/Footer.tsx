import styles from "./Footer.module.css";

export default function Footer() {
    return (
        <footer className={styles.systemFooter}>
            <div className="container">
                <div className={styles.footerContent}>
                    <div className={styles.companyInfo}>
                        <span className={styles.companyName}>Sahajta AI Solution Pvt Ltd.</span>
                        <p className="mono">System Incident Resolution Framework</p>
                    </div>

                    <div className={styles.supportInfo}>
                        <span className="system-voice">System Admin / Incident Support</span>
                        <a href="mailto:jain@pranamya.tech" className={styles.email}>jain@pranamya.tech</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
