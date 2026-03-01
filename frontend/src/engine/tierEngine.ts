// Vibe2Real — Tier Engine
// Non-binary completion scoring based on behavioral data

import type { ActionLog } from './actionLogger';
import { detectAIDependency } from './actionLogger';
import type { Tier } from './sessionStore';

export interface TierResult {
    tier: Tier;
    tierLabel: string;
    tierDescription: string;
    xpAwarded: number;
    certificateEligible: boolean;
    explanation: string;
    behavioralSummary: string[];
}


export function assignTier(
    log: ActionLog,
    totalTimeSeconds: number,
    usedRestarts: boolean,
    usedHints: boolean,
): TierResult {
    const ai = detectAIDependency(log);
    const investigative = log.actions.filter(a => a.category === 'investigation').length;
    const total = log.actions.length;
    const signalRatio = total > 0 ? investigative / total : 0;

    let tier: Tier;
    let explanation: string;

    if (usedHints || ai.flagged || log.actions.filter(a => a.category === 'reflexive').length / (total || 1) > 0.5) {
        tier = 'guidance';
        explanation = 'Resolution required external guidance or showed heavy reflexive action patterns.';
    } else if (signalRatio < 0.35 || log.hypothesisCount < 1) {
        tier = 'guidance';
        explanation = 'Limited investigation before resolution. Low hypothesis formation rate.';
    } else if (signalRatio >= 0.35 && signalRatio < 0.6 && !usedRestarts) {
        tier = 'independent';
        explanation = 'Found resolution without hints. Some investigation inefficiency present.';
    } else if (signalRatio >= 0.6 && log.falsificationCount >= 1 && !usedRestarts) {
        tier = 'efficient';
        explanation = 'Systematic hypothesis-driven investigation. Falsified wrong paths before convergence.';
    } else if (signalRatio >= 0.7 && log.falsificationCount >= 2 && totalTimeSeconds < 600 && !usedRestarts) {
        tier = 'reliable';
        explanation = 'Fast, methodical, minimal wasted investigation. Operationally reliable pattern.';
    } else if (!usedRestarts && signalRatio >= 0.5) {
        tier = 'independent';
        explanation = 'Resolved independently with a methodical approach.';
    } else {
        tier = 'guidance';
        explanation = 'Required significant trial and error to reach resolution.';
    }

    const tierMeta: Record<Tier, { label: string; description: string; xp: number; eligible: boolean }> = {
        guidance: {
            label: 'Recovered Under Guidance',
            description: 'Resolution required hints, heavy retries, or pattern-matched without understanding.',
            xp: 100,
            eligible: false,
        },
        independent: {
            label: 'Recovered Independently',
            description: 'Found the resolution without hints. Some investigation overhead present.',
            xp: 250,
            eligible: true,
        },
        efficient: {
            label: 'Recovered Efficiently',
            description: 'Systematic investigation with minimal wasted effort. Clear hypothesis-driven approach.',
            xp: 400,
            eligible: true,
        },
        reliable: {
            label: 'Operationally Reliable',
            description: 'Fast, methodical, zero false paths. Pattern consistent with senior incident response.',
            xp: 600,
            eligible: true,
        },
    };

    const meta = tierMeta[tier];

    const behavioralSummary: string[] = [];
    if (ai.signals.length > 0) {
        behavioralSummary.push(...ai.signals.map(s => `⚠ ${s}`));
    }
    if (log.hypothesisCount > 0) {
        behavioralSummary.push(`Formed ${log.hypothesisCount} hypotheses during investigation.`);
    }
    if (log.falsificationCount > 0) {
        behavioralSummary.push(`Falsified ${log.falsificationCount} wrong paths before resolution.`);
    }
    if (ai.signalToActionRatio < 0.3 && total > 5) {
        behavioralSummary.push('Investigation-to-action ratio was low. Consider reading before acting.');
    }
    if (ai.signalToActionRatio >= 0.6) {
        behavioralSummary.push('High investigation rate — methodical approach observed.');
    }
    if (totalTimeSeconds > 900) {
        behavioralSummary.push('Extended time spent — consider whether you were stuck on a false hypothesis.');
    }

    return {
        tier,
        tierLabel: meta.label,
        tierDescription: meta.description,
        xpAwarded: meta.xp,
        certificateEligible: meta.eligible,
        explanation,
        behavioralSummary,
    };
}

export function getModuleOverallTier(levelTiers: Tier[]): Tier {
    const tierRank: Record<Tier, number> = {
        guidance: 0,
        independent: 1,
        efficient: 2,
        reliable: 3,
    };
    // Module tier = minimum tier across all levels
    const minRank = Math.min(...levelTiers.map(t => tierRank[t]));
    const tiers: Tier[] = ['guidance', 'independent', 'efficient', 'reliable'];
    return tiers[minRank];
}
