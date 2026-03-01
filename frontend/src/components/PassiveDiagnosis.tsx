"use client";

import { useState, useEffect } from "react";
import styles from "./PassiveDiagnosis.module.css";

const snippets = [
    "Build Status: Unknown",
    "Last Deployment: Failed",
    "502 Bad Gateway",
    "Unhandled Promise Rejection",
    "Merge Conflict Detected",
    "Port Already In Use",
    "Ownership Transfer Pending",
];

export default function PassiveDiagnosis() {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % snippets.length);
        }, 2800);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className={styles.container}>
            <span className="system-voice blink">{snippets[currentIndex]}</span>
        </div>
    );
}
