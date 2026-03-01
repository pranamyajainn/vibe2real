'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import styles from './landing.module.css';

export default function Home() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add(styles.revealed);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    const elements = document.querySelectorAll(`.${styles.reveal}`);
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const tickerText = "FREELANCE CONTRACT LOST /// PR REJECTED UNDER QUESTIONING /// DEMO COLLAPSED DURING LIVE DEBUG /// API FAILURE UNEXPLAINED /// GIT CONFLICT UNRESOLVED /// SENIOR ENGINEER WATCHING /// ";

  return (
    <main className={styles.landingRoot}>
      <div className={styles.scanline}></div>

      {/* NAV */}
      <nav className={styles.nav}>
        <div className={styles.logo}>
          <span style={{ color: '#fff' }}>VIBE</span>
          <span style={{ color: '#E8000D' }}>2</span>
          <span style={{ color: '#fff' }}>REAL</span>
        </div>
        <div className={styles.navStatus}>
          <span className={styles.statusDot}>●</span> INCIDENT ACTIVE
        </div>
        <a href="#pricing" className={styles.navBtn}>ACQUIRE CLEARANCE</a>
      </nav>

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroLeft}>
            <div className={styles.heroTag}>// INCIDENT SIMULATOR — CLASSIFIED</div>
            <h1 className={styles.heroHeading}>
              <span className={styles.glitchWrapper} data-text="AI SHIPPED">AI SHIPPED</span><br />
              YOUR APP.<br />
              <span className={styles.textRed}>PRODUCTION</span><br />
              JUST BROKE.
            </h1>
            <p className={styles.heroSub}>
              You used AI to build it. Now something's broken, a senior is watching,
              and the terminal is open. You are responsible. No hints. No regeneration.
            </p>
            <div className={styles.heroActions}>
              {/* Kept existing href="/play" from old Hero component while assigning #levels design spec intent */}
              <Link href="/play" className={styles.btnPrimary}>ENTER SIMULATION</Link>
              <a href="#collapse" className={styles.btnGhost}>SEE THE GAP</a>
            </div>
            <div className={styles.heroStats}>
              <div className={styles.statItem}>
                <span className={styles.statVal}>87%</span>
                <span className={styles.statLabel}>Global Failure Rate</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statVal}>4.2×</span>
                <span className={styles.statLabel}>Avg. Retry Count</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statVal}>13%</span>
                <span className={styles.statLabel}>Completion Rate</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statVal}>1H47</span>
                <span className={styles.statLabel}>Fastest Recorded</span>
              </div>
            </div>
          </div>
          <div className={styles.heroRight}>
            <img src="/177237402778bf.png" alt="Simulation Preview" className={styles.heroImage} />
          </div>
        </div>
      </section>

      {/* TICKER */}
      <div className={styles.ticker}>
        <div className={styles.tickerTrack}>
          <span className={styles.tickerText}>{tickerText}</span>
          <span className={styles.tickerText}>{tickerText}</span>
        </div>
      </div>

      {/* COLLAPSE */}
      <section id="collapse" className={`${styles.secPad} ${styles.secBg0} ${styles.bTop} ${styles.bBot}`}>
        <div className={`${styles.reveal}`}>
          <div className={styles.secLabel}>// SYSTEM ANALYSIS</div>
          <h2 className={styles.secTitle}>THE EXACT <br /><span className={styles.textRed}>COLLAPSE MOMENT</span></h2>
        </div>
        <div className={`${styles.collapseGrid} ${styles.reveal}`}>
          <div className={styles.terminalBox}>
            <div className={styles.terminalBar}>
              <span className={`${styles.tDot} ${styles.tRed}`}></span>
              <span className={`${styles.tDot} ${styles.tYel}`}></span>
              <span className={`${styles.tDot} ${styles.tGrn}`}></span>
              <span className={styles.terminalTitle}>SENIOR ENGINEER — LIVE REVIEW</span>
            </div>
            <div className={styles.terminalBody}>
              <div className={`${styles.tLine} ${styles.tLine1}`}><span className={styles.textRed}>senior@review:~$ </span><span>Open DevTools</span></div>
              <div className={`${styles.tLine} ${styles.tLine2} ${styles.textMuted}`}>&gt; ...</div>
              <div className={`${styles.tLine} ${styles.tLine3}`}><span className={styles.textRed}>senior@review:~$ </span><span>Check Network tab</span></div>
              <div className={`${styles.tLine} ${styles.tLine4}`} style={{ color: '#ff6b6b' }}>ERROR: Cannot locate failed request</div>
              <div className={`${styles.tLine} ${styles.tLine5}`}><span className={styles.textRed}>senior@review:~$ </span><span>Why is this API failing?</span></div>
              <div className={`${styles.tLine} ${styles.tLine6}`} style={{ color: '#ff6b6b' }}>ERROR: No response</div>
              <div className={`${styles.tLine} ${styles.tLine7}`}><span className={styles.textRed}>senior@review:~$ </span><span>Show request payload</span></div>
              <div className={`${styles.tLine} ${styles.tLine8}`} style={{ color: '#ff6b6b' }}>ERROR: Developer cannot identify payload</div>
              <div className={`${styles.tLine} ${styles.tLine9}`}><span className={styles.textRed}>senior@review:~$ </span><span>Where is this coming from?</span></div>
              <div className={`${styles.tLine} ${styles.tLine10}`} style={{ color: '#ff6b6b' }}>ERROR: No trace available</div>
              <div className={`${styles.tLine} ${styles.tLine11}`} style={{ color: '#f5a623' }}>DETECTED: DEPENDENCY_EXCEEDS_COMPETENCE</div>
              <div className={`${styles.tLine} ${styles.tLine12}`} style={{ color: '#f5a623' }}>STATUS: CREDIBILITY_COLLAPSE <span style={{ animation: 'blink 1s step-end infinite' }}>█</span></div>
            </div>
          </div>
          <div className={styles.collapseList}>
            {[
              { n: '01', t: 'Does not understand the request lifecycle', s: 'Cannot trace frontend → backend → response' },
              { n: '02', t: 'Cannot distinguish client error from server error', s: '4xx vs 5xx is invisible without a mental model' },
              { n: '03', t: 'Cannot map written code to runtime behavior', s: 'The code exists. What it does at execution is unknown.' },
              { n: '04', t: 'Cannot debug without regenerating via AI', s: 'Prompting is the only tool. It fails under real conditions.' },
              { n: '05', t: 'Cannot explain failures with any precision', s: 'The system breaks. The developer watches.' },
            ].map((item, i) => (
              <div key={i} className={styles.collapseItem}>
                <div className={styles.collapseNum}>{item.n}</div>
                <div className={styles.collapseContent}>
                  <div className={styles.collapseItemTitle}>{item.t}</div>
                  <div className={styles.collapseItemSub}>{item.s}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LEVELS */}
      <section id="levels" className={`${styles.secPad} ${styles.secBg1}`}>
        <div className={`${styles.reveal}`}>
          <div className={styles.secLabel}>// SIMULATION PROTOCOL</div>
          <h2 className={styles.secTitle}>THREE LEVELS. <br /><span className={styles.textRed}>NO ASSISTANCE.</span></h2>
        </div>
        <div className={`${styles.levelsGrid} ${styles.reveal}`}>
          {[
            { n: '01', tg: 'LEVEL ONE', t: 'TRACE THE REQUEST', d: 'Frontend to backend. Request to response. No magic, only logic. You will follow a live request through a broken system and identify where it fails without regeneration.' },
            { n: '02', tg: 'LEVEL TWO', t: 'READ THE FAILURE', d: 'DevTools. Network tab. Console errors. You will locate the exact breakage point without syntax highlighting, friendly hints, or step-by-step guidance.' },
            { n: '03', tg: 'LEVEL THREE', t: 'SHIP WITHOUT AI', d: 'Terminal basics. Git conflicts. Manual deployment. You will survive the command line with no AI co-pilot and no safety net.' }
          ].map((lvl, i) => (
            <div key={i} className={styles.levelCard}>
              <div className={styles.levelBGNum}>{lvl.n}</div>
              <div className={styles.levelContent}>
                <span className={styles.levelTag}>{lvl.tg}</span>
                <h3 className={styles.levelTitle}>{lvl.t}</h3>
                <p className={styles.levelDesc}>{lvl.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* EVIDENCE */}
      <section id="evidence" className={`${styles.secPad} ${styles.secBg0} ${styles.bTop}`}>
        <div className={`${styles.reveal}`}>
          <div className={styles.secLabel}>// FAILURE EVIDENCE</div>
          <h2 className={styles.secTitle}>THE NUMBERS<br /><span className={styles.textRed}>DON'T LIE.</span></h2>
        </div>
        <div className={`${styles.evidenceGrid} ${styles.reveal}`}>
          {[
            { v: '87%', l: 'Global Failure Rate' },
            { v: '4.2', l: 'Average Attempts to Pass' },
            { v: '3H', l: 'Estimated Investigation Time' },
            { v: '13%', l: 'Global Completion Rate' }
          ].map((st, i) => (
            <div key={i} className={styles.evItem}>
              <div className={styles.evVal}>{st.v}</div>
              <div className={styles.evLabel}>{st.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* LEADERBOARD */}
      <section id="board" className={`${styles.secPad} ${styles.secBg1}`}>
        <div className={`${styles.reveal}`}>
          <div className={styles.secLabel}>// AUTHORIZED PERSONNEL</div>
          <h2 className={styles.secTitle}>TOP <br /><span className={styles.textRed}>SURVIVORS.</span></h2>
        </div>
        <div className={`${styles.reveal}`}>
          <table className={styles.boardTable}>
            <thead>
              <tr>
                <th>RANK</th>
                <th>USER ID</th>
                <th>COMPLETION TIME</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {[
                { r: '01', u: 'USR_0921', t: '01H 47M', s: 'AUTHORIZED', c: true },
                { r: '02', u: 'USR_1044', t: '01H 55M', s: 'AUTHORIZED', c: false },
                { r: '03', u: 'USR_0032', t: '02H 11M', s: 'AUTHORIZED', c: false },
                { r: '04', u: 'USR_4991', t: '02H 19M', s: 'AUTHORIZED', c: false },
                { r: '05', u: 'USR_8820', t: '02H 24M', s: 'AUTHORIZED', c: false }
              ].map((row, i) => (
                <tr key={i}>
                  <td><span className={`${styles.rankBadge} ${row.c ? styles.isTop : ''}`}>{row.r}</span></td>
                  <td>{row.u}</td>
                  <td>{row.t}</td>
                  <td style={{ color: row.c ? '#E8000D' : '#666' }}>{row.s}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className={`${styles.secPad} ${styles.secBg0} ${styles.bTop}`}>
        <div className={`${styles.reveal}`}>
          <div className={styles.secLabel}>// SYSTEM AUTHORIZATION TOKEN</div>
          <h2 className={styles.secTitle}>ONE PRICE. <br /><span className={styles.textRed}>NO REFUNDS.</span></h2>
        </div>
        <div className={`${styles.reveal}`}>
          <div className={styles.pricingBox}>
            <div className={styles.priceWrap}>
              <span className={styles.currency}>₹</span>
              <span className={styles.amount}>1,499</span>
            </div>
            <span className={styles.priceSub}>ONE-TIME ACCESS — NON-REFUNDABLE</span>
            <ul className={styles.priceList}>
              <li><span>—</span> All three simulation levels — no expiry</li>
              <li><span>—</span> Manual investigation enforced — no walkthroughs</li>
              <li><span>—</span> AI assistance restricted within simulation bounds</li>
              <li><span>—</span> Failure states active — incomplete runs logged</li>
              <li><span>—</span> Completion badge for freelance and GitHub profiles</li>
              <li><span>—</span> Operational signal for job applications and portfolio</li>
            </ul>
            <button className={`${styles.btnPrimary} ${styles.btnPricing}`}>ACKNOWLEDGE & PROCEED</button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className={`${styles.secPad} ${styles.secBg1}`}>
        <div className={`${styles.reveal}`}>
          <div className={styles.secLabel}>// FREQUENTLY ASKED QUESTIONS</div>
          <h2 className={styles.secTitle}>BEFORE YOU <br /><span className={styles.textRed}>ENTER.</span></h2>
        </div>
        <div className={`${styles.faqGrid} ${styles.reveal}`}>
          {[
            { q: 'Why not a course?', a: 'Courses teach knowledge. They do not install debugging instinct under pressure. This is a simulation, not an onboarding tool.' },
            { q: 'Who should NOT enter?', a: 'Anyone who prefers step-by-step guidance and expects answers. This is a competence filter. It is not here to make you comfortable.' },
            { q: 'What if I rely on AI inside the simulation?', a: 'The system enforces bounds where AI cannot see the true terminal state or nuanced request flow. You will fail. The run will be logged.' },
            { q: 'Is prior coding knowledge required?', a: 'You must have shipped at least one application — even if AI-assisted. If you do not know what a terminal is, this will be impossible.' },
            { q: 'Why does completion take ~3 hours?', a: 'Real incident response takes time. Tracing unfamiliar code, identifying network bottlenecks, and reading raw logs cannot be rushed.' },
            { q: 'Why do most users fail Level 2?', a: 'Level 2 requires deep inspection of network requests and console errors without syntax highlighting or friendly hints. Most lack foundational patience.' }
          ].map((faq, i) => (
            <div key={i} className={styles.faqItem}>
              <div className={styles.faqQ}>Q: {faq.q}</div>
              <div className={styles.faqA}>{faq.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div>
          VIBE2REAL — SYSTEM INCIDENT RESOLUTION FRAMEWORK<br />
          SAHAJTA AI SOLUTION PVT LTD.
        </div>
        <div>
          SUPPORT: <a href="mailto:jain@pranamya.tech" className={styles.textRed}>jain@pranamya.tech</a>
        </div>
      </footer>
    </main>
  );
}
