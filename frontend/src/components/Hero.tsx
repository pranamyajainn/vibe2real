import styles from "./Hero.module.css";
import Link from 'next/link';

export default function Hero() {
    return (
        <section className={styles.heroSection}>
            <div className="container">
                <h1 className={styles.headline}>
                    <span className={styles.line1}>AI shipped your app.</span>
                    <span className={styles.line2}>Production just broke.</span>
                    <span className={styles.line3}>You are now responsible.</span>
                </h1>

                <div className={styles.actionArea}>
                    <Link href="/play" className="btn btn-accent">
                        Enter Simulation
                    </Link>
                </div>
            </div>
        </section>
    );
}
