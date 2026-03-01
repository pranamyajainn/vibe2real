# Vibe2Real — Product Requirements Document

# CONTENTS

- [Abstract](#-abstract)
- [Business Objectives](#-business-objectives)
- [KPI](#-kpi)
- [Success Criteria](#-success-criteria)
- [Core Engine Architecture](#-core-engine-architecture)
- [User Journeys](#-user-journeys)
- [Scenarios](#-scenarios)
- [User Flow](#-user-flow)
- [Functional Requirements](#-functional-requirements)
- [Model Requirements](#-model-requirements)
- [Data Requirements](#-data-requirements)
- [Prompt Requirements](#-prompt-requirements)
- [Testing & Measurement](#-testing--measurement)
- [Risks & Mitigations](#-risks--mitigations)
- [Costs](#-costs)
- [Assumptions & Dependencies](#-assumptions--dependencies)
- [Compliance/Privacy/Legal](#-complianceprivacylegal)
- [GTM/Rollout Plan](#-gtmrollout-plan)

---


## 📝 Abstract

**Vibe2Real** is an open-source, gamified debugging simulation that places AI-native developers inside realistic production failure scenarios. It is **not** a course — it installs debugging instinct under pressure.

The product targets fresher developers who can generate software with AI tools but cannot reason about, debug, or independently fix real system behavior. Three playable modules (~3 hours total) cover request tracing, dev tools inspection, and terminal/Git fundamentals — the critical 20% of concepts behind 80% of real-world failures.

**Core differentiator**: Vibe2Real simulates *uncertainty*, not content. Scenarios feature unclear causality, multiple plausible wrong paths, misleading signals, and delayed feedback — mirroring the psychological properties of real production debugging. The system diagnoses *thinking process*, not just correctness.

Free to play. Certificate of completion available for ₹1,499 to signal verified technical competence.

---

## 🎯 Business Objectives

- **Close the competence gap** — give AI-assisted developers the foundational debugging instinct they currently lack
- **Build a credibility credential** — the certificate becomes a trusted signal that "this developer understands what they built"
- **Grow an open-source community** — attract contributors who improve and extend the simulation scenarios
- **Validate demand** — prove that developers will engage with pressure-based debugging training over traditional courses

---

## 📊 KPI

| GOAL                        | METRIC                       | TARGET (8–12 weeks) | QUESTION                                              |
| --------------------------- | ---------------------------- | -------------------- | ----------------------------------------------------- |
| User Engagement             | Users completing ≥1 module   | **10**               | Are users finding value and finishing at least 1 game? |
| Monetization Validation     | Certificates purchased       | **2**                | Will users pay for the credential?                    |
| Community Growth            | GitHub stars/forks/contribs  | **7**                | Is the open-source positioning attracting builders?   |

---

## 🏆 Success Criteria

- ≥10 users complete at least one full module within 12 weeks of launch
- ≥2 certificate purchases, validating willingness to pay
- ≥7 GitHub engagement signals (stars, forks, or contributors)
- Qualitative: at least 3 users report increased confidence in debugging without AI *(survey or feedback form)*
- Zero critical bugs blocking the gameplay happy path at launch
- ≥60% of completers reach "Recovered Independently" tier or above
- Action logs show measurable shift from guess-based retries → hypothesis-driven investigation across sub-levels

---

## 🧠 Core Engine Architecture

These 6 systems (plus two additions below) define what makes Vibe2Real a simulation, not a tutorial. They are the product.

### 80/20 Design Invariant

The 80/20 principle here is **not** about reducing topics. It is about isolating **failure primitives** — the small set of cognitive mistakes that cause 80% of production debugging failures:

1. Not knowing where execution actually flows
2. Not reading system output before acting
3. Acting before forming a hypothesis
4. Confusing symptom with cause
5. Fear of terminal / deployment surface

The three modules map directly to these primitives:

| Module | Primitive | Mental Model Installed |
|--------|-----------|-----------------------|
| **Trace** | Execution flow blindness | Where does execution actually go? |
| **Read** | Signal interpretation failure | What is the system telling me? |
| **Ship** | Operational control fear | How do I act without AI? |

**Guard rule**: If a scenario teaches a tool rather than exposes a reasoning error, it violates 80/20. Scenarios must represent **recurring failure archetypes**, not tool features.

> ❌ "Learn the Network Tab"
> ✅ "You trusted success status without verifying payload"

The tool becomes incidental. The reasoning error is the lesson.

### System 1: Failure Engine

Most products simulate content. Vibe2Real simulates **uncertainty**.

Every scenario must produce the psychological properties of real debugging:

| Property | Description |
|----------|-------------|
| **Unclear causality** | The observed symptom does not directly reveal the root cause |
| **Multiple plausible hypotheses** | ≥3 believable wrong paths exist before the correct resolution becomes obvious |
| **Misleading signals** | Some observable data actively points away from the true cause |
| **Partial observability** | Not all system state is visible at once — users must actively seek information |
| **Delayed feedback** | The system responds to actions with realistic latency, not instant validation |

**Design rule**: Every sub-level must allow at least **3 believable wrong paths** before the correct resolution becomes obvious.

**Validation model**: Check **state convergence**, not action sequence. Resolution condition = system stabilized. Multiple valid paths must be accepted.

> ❌ Incorrect: User must run `npm run build`
> ✅ Correct: System state becomes "deployment artifact generated" — via any valid method

**Example — Level 2.2 (Network Failure):**

> **Observed symptom**: Frontend shows loading spinner forever.
>
> **Possible investigations**:
> 1. API endpoint broken
> 2. CORS misconfiguration
> 3. Environment variable missing
> 4. Incorrect base URL
> 5. Backend timeout
>
> Only one is true. System allows users to pursue wrong hypotheses without immediate correction. **No red ✗ feedback. No hint escalation.** Only observable system response changes.

Debugging instinct forms only when **hypothesis → test → falsification** loops occur.

#### 1a: Failure Randomization Layer

After ~5 scenarios, users detect structure if failures follow predictable surface patterns. Human brains compress patterns aggressively.

**Randomize per session** (root cause identical, surface appearance different):
- Variable names
- Endpoint paths
- Port numbers
- Log ordering
- Timing delays
- Error wording variants

Prevents memorization across retries or shared answers. Without this, GitHub discussions will publish solutions within days.

#### 1b: Information Cost (Operational Latency Simulation)

Real debugging has friction. Currently investigation actions are free. Add soft cost model — not punishment, but simulation of real operational latency:

| Action | Simulated Delay |
|--------|----------------|
| Restart server | 4s |
| Build step | 8s |
| Deployment | 12s |
| Page reload | 2s |

Users begin **planning before acting**. Planning = debugging instinct.

#### 1c: Irrecoverable Session State

If everyone eventually resolves scenarios, certification credibility collapses. Some users must fail completely.

After excessive blind actions, **environment degrades**:
- Logs overwritten
- Service crashes
- Rate limits triggered
- State corruption

User must **restart the scenario**. First genuine failure experience produces the strongest learning signal.

#### 1d: Scenario Entropy

After ~10–15 levels, users may unconsciously learn: *"Every problem is solvable inside this sandbox."* Real production contains unsolvable ambiguity.

Inject occasionally:
- **Noisy logs** unrelated to the actual issue
- **Irrelevant warnings** that look alarming but are harmless
- **Dead investigative paths** that lead nowhere
- **Red herring error messages** from unrelated processes

Not tricks. **Entropy.** Debugging competence includes tolerating irrelevant information.

---

### System 2: Action → Consequence Logging

Every user action is silently recorded:

| Action Category | Examples |
|-----------------|----------|
| Investigation | Opened Network tab, inspected request headers, read console output |
| Modification | Changed code, edited config file, modified environment variable |
| Reflexive | Reloaded blindly, changed unrelated file, rapid retries |
| Sequencing | Order of actions, time between actions, what was skipped |

**Post-module report** shows **behavioral pattern**, not score:

> *"You inspected console after 6 failed retries."*
> *"You modified code before identifying failure source."*
> *"You ignored network response status."*

The simulator diagnoses **thinking process**, not correctness. This is the real product.

---

### System 3: AI Dependency Detection

Critical for philosophical integrity. Detect behaviors indicating AI reflex:

| Behavior | Signal |
|----------|--------|
| Rapid tab switching without reading content | Scanning, not investigating |
| Guess-based retries (same action repeated) | No hypothesis formation |
| Skipping logs / error messages | Avoiding raw signal |
| Random configuration edits | Brute-force instead of reasoning |
| Copy-paste patterns in terminal | Muscle memory, not understanding |

Flagged internally as: **"Pattern: Externalized Reasoning Dependency"**

**Do not punish.** Surface after completion. User realizes the dependency themselves.

#### Normalized Derived Metrics

Raw behavioral signals alone create false positives (fast users appear careless, slow users appear thoughtful). Dependency must emerge **statistically, not heuristically**:

| Metric | Definition |
|--------|------------|
| **Signal-to-action ratio** | % of actions that are investigative vs. reflexive |
| **Time reading vs. modifying** | Ratio of passive observation to active changes |
| **Hypothesis stability duration** | How long user pursues one theory before switching |
| **Unique investigation depth** | Number of distinct information sources consulted |

False labeling destroys trust. These metrics normalize across speed and style.

---

### System 4: Non-Binary Completion

Avoid pass/fail. Real engineers do not "pass" debugging — they converge toward resolution efficiency.

**Output tiers:**

| Tier | Description | Certificate Eligible? |
|------|-------------|----------------------|
| **Recovered Under Guidance** | Needed all hints, many wrong paths, slow convergence | ❌ |
| **Recovered Independently** | Found resolution without hints, some inefficiency | ✅ |
| **Recovered Efficiently** | Systematic investigation, minimal wasted effort | ✅ |
| **Operationally Reliable** | Fast, methodical, zero false paths | ✅ |

#### Hard Certificate Boundary

Credential inflation risk appears within months if eligibility is too wide. Scarcity preserves signaling power. Certificates function like trust markets — once diluted, recovery is impossible.

**Certificate eligibility requires ALL of:**
- ≥ **Recovered Independently** tier in **all 3 modules** (not just one)
- No **Externalized Reasoning Dependency** flag above threshold
- Maximum **retry ceiling per module** (e.g., ≤3 restarts)
- Modules completed in **sequential certification path**: Trace → Read → Ship

---

### System 5: Emotional Curve Control

Modules must follow a deliberate tension waveform:

```
Confusion → False Confidence → Failure → Insight → Resolution
```

| Phase | Timing | Purpose |
|-------|--------|---------|
| **Confusion** | 0–20% | User realizes the symptom doesn't match their assumption |
| **False Confidence** | 20–40% | User finds a plausible-looking cause and starts fixing |
| **Failure** | 40–65% | The "fix" doesn't work. Second hypothesis also fails. |
| **Insight** | 65–75% | User discovers the actual root cause through investigation |
| **Resolution** | 75–100% | User applies the correct fix with understanding |

If insight appears too early → learning collapses.
If confusion persists too long → abandonment occurs.

**Target insight moment ≈ 65–75% into module runtime.** This must be intentionally engineered per sub-level.

---

### System 6: First Five Minutes Rule

Within the first five minutes of Module 1, the user must experience:

> **"I thought I knew this. I don't."**

- Without humiliation
- Without explanation
- Through direct confrontation with their own gap

That moment determines whether Vibe2Real becomes **infrastructure** or **novelty**.

**Implementation precision**: Do not make 1.1 *tricky*. Make it **familiar but subtly wrong**.

Best pattern: Everything looks correct. Failure caused by an invisible assumption.

> **Example**: Correct API, correct frontend, missing `.env` variable loaded only in production mode. User checks obvious layers first. Confidence collapses naturally.

No trickery. Only incomplete mental model exposure.

---

### System 7: Transfer Reflection

Confidence comes from surviving confusion repeatedly. But learning remains contextual unless the brain links simulation behavior → future reality.

After each module, system generates a **Transfer Reflection** — not motivational text, but pure behavioral mapping:

> *"You traced request flow before modifying code. This pattern applies when APIs fail in real projects."*
> *"You read the error message before restarting. This saves ~15 minutes in real incident response."*
> *"You checked environment variables after exhausting code-level causes. This is the correct escalation pattern."*

Without this bridge, skill remains locked inside the simulation context. With it, the user carries the debugging instinct into their next real project.

---

## 🚶‍♀️ User Journeys

### Journey 1: The Curious Vibe Coder
> Arjun shipped a freelance project with Cursor + ChatGPT. A client asks "why does the API timeout?" — he has no idea. He finds Vibe2Real, starts Module 1, traces a request from frontend to backend for the first time, and has an "oh, THAT'S what happens" moment. He finishes all 3 modules over a weekend, buys the certificate, and links it on his freelance profile.

### Journey 2: The Job-Seeking Fresher
> Priya has built 4 portfolio projects with AI but freezes in technical interviews when asked to debug. She plays Module 2 (dev tools), fails twice, then passes. She can now confidently open the Network tab and trace an error. She adds the certificate to her resume.

### Journey 3: The Open-Source Contributor
> Rahul is an experienced developer who discovers Vibe2Real on GitHub. He plays through all modules in 2 hours, then contributes a new scenario for Module 3 involving a Docker deployment failure.

---

## 📖 Scenarios

Each scenario is designed around a **recurring failure archetype** — a reasoning error that reappears across 80% of real production incidents. Root causes must **generalize across stacks** (not framework-specific).

### Module 1: Trace the Request — *Execution Mental Model*

| Sub-Level | Failure Archetype | Scenario | Reasoning Error Exposed |
|-----------|------------------|----------|------------------------|
| 1.1 | **Invisible assumption** | Everything looks correct — app works locally, fails in deployed state. Missing `.env` variable loaded only in production. | Trusted environment parity without verification |
| 1.2 | **Request never reaches expected layer** | Form submits but nothing saves. Frontend sends request; it never arrives at the API. | Assumed request reaches destination without tracing |
| 1.3 | **Symptom ≠ cause** | API returns 200 but UI shows wrong data. Response is valid — transformation logic is wrong. | Confused success status with correct behavior |
| 1.4 | **Silent execution path** | Button click does nothing. Event handler exists but a conditional silently blocks execution. | Assumed code runs without verifying execution path |
| 1.5 | **Dependency mismatch** | Page renders blank. Component imports succeed but a dependency version mismatch produces silent failure. | Trusted dependency chain without version inspection |

### Module 2: Read the Failure — *Signal Interpretation*

| Sub-Level | Failure Archetype | Scenario | Reasoning Error Exposed |
|-----------|------------------|----------|------------------------|
| 2.1 | **Signal ignored** | App crashes on load. Error is visible in console — user must read before acting. | Modified code before reading the error message |
| 2.2 | **Silent failure** | API call fails but UI shows no error. Network tab reveals 4xx response silently swallowed. | Trusted UI state without inspecting network layer |
| 2.3 | **Wrong boundary assumption** | App is slow. User assumes frontend issue — actual bottleneck is a 3rd-party API timeout visible in network waterfall. | Assumed failure lives in the layer closest to symptom |
| 2.4 | **Misleading signal** | CORS error appears. Obvious fix attempted — but real cause is a malformed header from the backend, not a missing CORS policy. | Trusted the error message label without investigating the actual payload |
| 2.5 | **Stale state** | UI shows outdated data. App looks functional but a caching layer serves stale responses. DevTools reveals cache headers. | Assumed fresh data without verifying freshness |

### Module 3: Ship Without AI — *Operational Control*

| Sub-Level | Failure Archetype | Scenario | Reasoning Error Exposed |
|-----------|------------------|----------|------------------------|
| 3.1 | **Operational blindness** | Server returns 500 after deployment. Logs exist — user must navigate filesystem and read them before acting. | Attempted fix without reading operational output |
| 3.2 | **State conflict** | Merge conflict blocks deployment. Multiple valid resolution paths exist — user must understand both branches. | Applied resolution without understanding conflicting changes |
| 3.3 | **Irreversible action fear** | A bad commit is live. User must identify it in git log and revert — but revert vs. reset have different consequences. | Fear of terminal commands prevented action |
| 3.4 | **Environment mismatch** | Build succeeds locally, deployment fails. Missing build step for production — env config differs from dev. | Assumed build environment matches development |
| 3.5 | **Process confusion** | App is down. Multiple processes running — user must identify which one is the actual server, read its logs, and restart correctly. | Restarted wrong process / restarted blindly without diagnosis |

> **Design note**: These scenarios are archetype-based, not tool-based. The tool used (console, network tab, terminal) is incidental — the reasoning error is the lesson. Each scenario includes entropy (noisy logs, irrelevant warnings) at varying levels.

---

## 🕹️ User Flow

### Happy Path
```
Landing Page
  └─→ "Enter Simulation" CTA
       └─→ Module Selection (all visible, certification path: 1→2→3)
            └─→ Sub-Level List (basics → advanced)
                 └─→ Scenario Screen (randomized surface per session)
                      ├─ 1–2 line scenario description
                      ├─ Broken app / simulated environment appears
                      ├─ User investigates (actions silently logged)
                      ├─ User pursues hypotheses (no instant feedback)
                      ├─ Actions incur operational latency (info cost)
                      ├─ System responds with observable state changes only
                      ├─ Excessive blind actions → environment degrades
                      ├─ User converges on resolution (state convergence, not command match)
                      └─→ Completion Report
                           ├─ Tier assigned (Guidance → Independent → Efficient → Reliable)
                           ├─ Behavioral pattern analysis shown
                           ├─ AI dependency signals surfaced (normalized metrics)
                           ├─ Transfer Reflection (behavioral mapping → real-world application)
                           └─ Next Level unlocked
                                └─→ Module Complete → Leaderboard
                                     └─→ All 3 Modules Done (sequential path)
                                          └─→ Certificate Purchase (₹1,499)
                                               (requires: all modules ≥Independent,
                                                no dependency flag, ≤retry ceiling)
```

### Key Alternatives
- **Wrong hypothesis**: System does not correct. Observable state changes are the only feedback. User must falsify and try again.
- **Environment degraded**: After excessive blind actions, environment becomes irrecoverable. User must restart scenario.
- **Quit mid-module**: Progress saved, user can resume later *(Assumption)*
- **Module exploration**: All modules visible. Certification requires sequential completion: Trace → Read → Ship.
- **Below certificate threshold**: User can replay modules to improve tier (within retry ceiling)

---

## 🧰 Functional Requirements

### Core Gameplay

| SECTION | SUB-SECTION | USER STORY & EXPECTED BEHAVIORS | SCREENS |
|---------|-------------|--------------------------------|---------|
| Module Selection | Dashboard | As a user, I see 3 modules with progress indicators and my current tier per module. | Module select screen |
| Sub-Level Selection | Level List | As a user, I see sub-levels from basics→advanced. Completed levels show my tier. Locked levels show 🔒. | Level list screen |
| Gameplay | Scenario View | As a user, I see a 1–2 line scenario description, then a simulated broken environment with ≥3 plausible investigation paths. I interact freely; the system responds only with observable state changes. | Scenario screen |
| Gameplay | Investigation | As a user, I pursue hypotheses. The system does not tell me if I'm right or wrong — it shows me what happens when I act. I must falsify wrong hypotheses myself. | Scenario screen |
| Completion | Report | As a user, after resolving a scenario, I see: my tier (Guidance/Independent/Efficient/Reliable), a behavioral pattern analysis of my actions, and any AI dependency signals detected. | Completion report |
| Progress | Leaderboard | As a user, I see my tier and efficiency across levels, and my position on a public leaderboard. | Leaderboard screen |
| Certificate | Purchase | As a user, after completing all 3 modules at ≥"Recovered Independently" tier, I can purchase a certificate (₹1,499) with a unique verification link. | Certificate purchase screen |

### Auth & Identity

| SECTION | SUB-SECTION | USER STORY & EXPECTED BEHAVIORS | SCREENS |
|---------|-------------|--------------------------------|---------|
| Play | Anonymous | As a user, I can play without signing up or logging in. | — |
| Leaderboard | Anonymous ID | As a user, my leaderboard entry uses an anonymous ID (e.g., USR_0921). | Leaderboard |
| Certificate | Auth Required | As a user, I must provide my name and email to purchase a certificate. | Certificate form |

> **Assumption**: No full auth system for v1. Anonymous play with email collection only at certificate purchase.

### Simulated Environments

| MODULE | SIMULATION TYPE | DESCRIPTION |
|--------|----------------|-------------|
| Module 1 | Simulated App + Code View | A broken mini-app with visible source code. User traces execution flow. |
| Module 2 | Simulated Browser Dev Tools | Mock console, network tab, and DOM inspector. User reads errors and identifies failures. |
| Module 3 | Simulated Terminal | In-browser terminal emulator. User runs real-ish commands (cd, ls, git, npm, etc). |

---

## 📐 Model Requirements

| SPECIFICATION | REQUIREMENT | RATIONALE |
|---------------|-------------|-----------|
| AI/LLM Usage | **None in v1** | The simulation is rule-based with state-convergence validation. No LLM needed for gameplay. |
| Validation Engine | **State-convergence** (not action-sequence) | Multiple valid resolution paths accepted. Resolution = system stabilized, not specific command matched. |
| Failure Randomization | **Per-session surface variation** | Same root cause, different variable names/ports/paths/timing. Prevents memorization and solution-sharing. |
| Information Cost System | **Operational latency for actions** | Forces deliberate investigation and planning, penalizes blind actions. |
| Irrecoverable State | **Environment degrades after excessive blind actions** | Creates genuine failure experience, reinforces consequence of poor debugging. |
| Simulator Integrity | **Private scenario seeds, open-source engine** | Preserves assessment integrity while maintaining transparency of the simulation logic. |
| Future Consideration | LLM-generated scenarios | v2 could use an LLM to generate novel failure scenarios. Not in scope for v1. |

> **Assumption**: v1 uses handcrafted scenarios with state-convergence validation and per-session surface randomization. No AI model dependency.

---

## 🧮 Data Requirements

- **Scenario Seed Data**: Each sub-level defined as structured config — scenario template, randomizable surface variables, initial broken state, ≥3 false hypothesis paths, state-convergence resolution conditions, emotional curve timing targets, environment degradation thresholds
- **Scenario Seeds** (private/server-side): Compiled from templates server-side. Engine is open-source; live scenario seeds are **not** in the public repo. Community contributes templates, not live exam states.
- **Action Log Data**: Every user action timestamped and categorized (investigation, modification, reflexive, sequencing) — stored per session. Includes information-cost delays incurred.
- **Behavioral Analysis Data**: Derived from action logs — hypothesis count, falsification rate, signal-to-action ratio, time reading vs. modifying, hypothesis stability duration, unique investigation depth, AI dependency signals
- **Progress Data**: Per-user tiers, completion status, behavioral patterns, retry count per module — stored in local storage for anonymous users *(Assumption)*
- **Leaderboard Data**: Anonymous tiers and efficiency metrics stored server-side
- **Certificate Data**: Name, email, completion proof (all modules ≥ Recovered Independently + no dependency flag + within retry ceiling), unique verification link, **certificate metadata** (completion timestamp, simulator version, scenario difficulty index) — stored server-side
- **No PII collected** during gameplay. Email only at certificate purchase.

---

## 💬 Prompt Requirements

Not applicable for v1 (no LLM usage). If LLM-generated hints are added in v2:

- Hints must never reveal the full answer
- Tone: terse, system-like (matching brutalist brand voice)
- Output: plain text, max 2 sentences
- No encouragement or praise — the system is a neutral diagnostic tool

---

## 🧪 Testing & Measurement

### Offline Testing
- Each sub-level tested with all ≥3 false hypothesis paths to verify they are believable and falsifiable
- Emotional curve validation: insight moment must land at 65–75% of expected runtime
- First Five Minutes test: Module 1.1 must produce "I thought I knew this" moment without humiliation
- All 15 sub-levels (5 × 3 modules) must pass validation testing before launch

### Online Measurement
- **Completion funnel**: Track drop-off per sub-level — flag levels where abandonment > 40%
- **Insight timing**: Measure when users discover root cause vs. target (65–75% of runtime)
- **Hypothesis quality**: Track number of wrong paths explored before resolution — if users solve in <2 hypotheses, scenario is too easy
- **AI dependency prevalence**: % of users flagged with externalized reasoning dependency patterns
- **Tier distribution**: Are users clustering at "Recovered Under Guidance" (too hard) or "Operationally Reliable" (too easy)?
- **Behavioral shift**: Do action patterns improve across sub-levels? (e.g., less blind reloading, more log reading)

### Feedback Collection
- Post-module behavioral report (automatic — no survey needed, the action log IS the feedback)
- Exit analysis if user quits: what sub-level, at what phase of emotional curve, after how many hypotheses
- Optional 1-question: *"Do you feel more confident debugging without AI? (Yes/Somewhat/No)"*

---

## ⚠️ Risks & Mitigations

| RISK | IMPACT | MITIGATION |
|------|--------|------------|
| **Users get bored and quit** | No learning happens, KPIs missed | Emotional Curve Control ensures tension waveform keeps engagement. First Five Minutes Rule (familiar-but-subtly-wrong, not tricky) creates immediate hook. Information cost forces planning. Each sub-level targets <15 min. |
| **Users don't gain real confidence** | Product fails its core promise | Failure Engine forces real hypothesis→test→falsification loops. Irrecoverable sessions create genuine failure experience. Action logging provides objective behavioral evidence. Non-binary tiers give honest signal. |
| **Content feels scripted/artificial** | Competence filter dies. Users pattern-match instead of debug. | Failure Randomization Layer changes surface variables per session. ≥3 believable wrong paths. No red ✗ feedback. Observable state changes only. |
| **Solution sharing / memorization** | GitHub discussions publish answers within days | Per-session randomization (variable names, ports, paths, timing). Open-source engine, private scenario seeds. Community contributes templates, not live exam states. |
| **Certificate credential inflation** | Credential loses signaling power within months | Hard boundary: all modules ≥Independent + no dependency flag + retry ceiling. Sequential certification path. Certificate metadata includes version + difficulty index for future credibility. |
| **AI dependency detection feels judgmental** | Users feel attacked instead of self-aware | Normalized derived metrics (not heuristic). Never punish. Surface post-completion only. Neutral, descriptive language. |
| **Scenarios are too hard, cause abandonment** | Users leave before insight moment | Emotional curve targets insight at 65–75%. Monitor abandonment per phase. Irrecoverable state triggers restart, not permanent block. |
| No distribution / discovery | Nobody plays it | Open-source engine on GitHub, share in dev communities (Twitter/X, Reddit r/webdev, Discord servers). The brutalist landing page itself is shareable. |

---

## 💰 Costs

### Development
- **₹0** — built by the founding team
- Scenario content: created in-house

### Operational (Monthly)
| Item | Cost | Notes |
|------|------|-------|
| Frontend hosting (Vercel free) | ₹0 | Free tier covers early traffic |
| Backend hosting (Railway/Render free) | ₹0 | Free tier for API + leaderboard |
| Domain | ~₹800/year | If custom domain needed |
| Payment gateway (Razorpay) | 2% per txn | Only on certificate purchases |

> **Total estimated monthly cost: ₹0** (free tiers) + marginal per-certificate transaction fees.

---

## 🔗 Assumptions & Dependencies

### Assumptions
1. ~5 sub-levels per module (15 total) is sufficient for v1
2. No user authentication for gameplay — anonymous play, email only at certificate
3. Progress stored in local storage (no server-side accounts for v1)
4. Scenarios use state-convergence validation with per-session surface randomization (no LLM)
5. Certification path is sequential (Trace → Read → Ship); modules are visually explorable in any order
6. Leaderboard uses anonymous IDs
7. Certificate verification via unique URL with metadata (timestamp, version, difficulty index)
8. Payment via Razorpay or similar Indian payment gateway
9. Retry ceiling per module for certificate eligibility (e.g., ≤3 restarts)
10. Engine is open-source; scenario seeds are private/server-compiled
11. Information cost delays are fixed values (not dynamically adjusted in v1)
12. Environment degradation thresholds defined per sub-level

### Dependencies
- Next.js 16 (frontend — already set up)
- Hono.js (backend — already set up)
- A terminal emulator library (e.g., xterm.js) for Module 3
- A payment gateway SDK for certificate purchase
- Vercel / Render free tier for hosting
- Server-side scenario seed compilation (private repo or server-side generation)

---

## 🔒 Compliance/Privacy/Legal

- **No PII collected during gameplay** — fully anonymous
- **Email + name collected at certificate purchase only** — stored securely, used only for certificate generation
- **Payment processing** via PCI-compliant gateway (Razorpay)
- **Open-source license**: MIT or Apache 2.0 for engine *(Assumption — to be decided)*
- **Scenario seeds**: Private/server-compiled. Not included in open-source repository. This preserves assessment integrity while maintaining engine transparency.
- **No cookies or tracking** beyond basic analytics *(Assumption)*
- **Indian IT Act compliance**: no sensitive personal data processed
- **Certificate metadata**: Stores completion timestamp, simulator version, and scenario difficulty index. Enables future version-based credential verification.

---

## 📣 GTM/Rollout Plan

### Phase 1: Full Launch (Ship ASAP)
- **All 3 modules fully playable** (15 sub-levels total) — no staggered content rollout
- All 6 core engine systems operational (Failure Engine, Action Logging, AI Dependency Detection, Non-Binary Completion, Emotional Curve Control, First Five Minutes)
- Leaderboard live
- Certificate purchase flow integrated (Razorpay)
- Landing page live with "Enter Simulation" CTA working
- Deploy on Vercel (frontend) + Render/Railway (backend)
- Open-source the repo on GitHub

### Phase 2: Community & Growth (Week 2–12)
- Share on Twitter/X, Reddit (r/webdev, r/learnprogramming), dev Discords
- Encourage contributions: "Add your own failure scenario" contributor guide
- Collect feedback, iterate on hardest/most-dropped levels using action log data
- Tune emotional curves based on real insight-timing and abandonment data
- First 10 completions → 2 certificate purchases target

### Distribution Channels
| Channel | Action |
|---------|--------|
| GitHub | Open-source repo with strong README + demo GIF |
| Twitter/X | Launch thread: "We built a debugging game for vibe coders" |
| Reddit | Posts in r/webdev, r/learnprogramming, r/SideProject |
| Dev Discord servers | Share in communities like Theo's, Fireship, etc. |
| Product Hunt | Launch once live with all 3 modules |
