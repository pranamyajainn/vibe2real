// Vibe2Real — Module 3, Level 3.3
// Failure Archetype: IRREVERSIBLE ACTION FEAR
// Scenario: Bad commit is live. Must identify it in git log and revert.
//           But revert vs reset have different consequences.
// Reasoning Error: Fear of terminal commands prevented action.

import type { ScenarioDefinition } from '../types';

const LEVEL_3_3: ScenarioDefinition = {
    id: '3-3',
    moduleId: 3,
    levelIndex: 2,
    moduleType: 'ship',
    title: 'The Point of No Return',
    failureArchetype: 'Irreversible Action Fear',
    twoLineDescription: 'Bad commit is live. Users are affected. You have to undo it.\nTerminal commands that change history feel dangerous — but inaction is worse.',

    confusionPhaseEnd: 0.15,
    falseConfidencePhaseEnd: 0.40,
    failurePhaseEnd: 0.60,
    insightPhaseEnd: 0.72,
    dispatchMessage: "that last commit broke auth for every user. we need to undo it NOW",
    narratorScript: {
        "opening": "A bad commit is live right now. Users are hitting it. You need to undo it without breaking the commits that came after. Read the git log before you touch anything — order matters here.",
        "actions": {
            "git_show_commit": "Git log: commit a7f3c2e introduced the broken change. Two commits came after. Undo a7f3c2e specifically without removing the later work.",
            "understand_revert": "a7f3c2e changed auth middleware to skip token validation. Every request unauthorized since. This is the exact commit.",
            "check_git_log_after": "Server logs: 401s on every authenticated route since the bad commit timestamp. Confirmed."
        },
        "resolution": "git revert undoes the commit safely. Creates a new commit reversing the change — doesn't rewrite history, doesn't break what came after."
    },
    momentumTease: "Next case: Build passes locally. Fails in production every time. Same code. Different outcome. The difference is in the config.",


    initialAppState: (surface) => `
$ # Production error rate spiked 4 minutes ago.
$ # Something in the last deploy broke authentication.

$ git log --oneline -5
a7f3c2e (HEAD, origin/main) feat: update ${surface.variableName} config   ← bad commit
b4d1e8f fix: improve error messages
c2a9f1d refactor: clean up auth middleware
e5b3c4a feat: add user profile page
f1d2e3c fix: typo in landing page

$ # The bad commit is a7f3c2e.
$ # Team is waiting. Users are failing to log in.
  `.trim(),

    actions: [
        {
            id: 'git_show_commit',
            label: 'Inspect the Bad Commit (git show a7f3c2e)',
            type: 'git_log',
            category: 'investigation',
            informationCostType: 'run_command',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `$ git show a7f3c2e\ncommit a7f3c2e\nAuthor: You\nDate:   ${surface.timestamp}\n\n    feat: update ${surface.variableName} config\n\ndiff --git a/${surface.variableName}.js b/${surface.variableName}.js\n-  secret: process.env.JWT_SECRET\n+  secret: undefined  ← accidentally removed env var reference\n\n// JWT secret set to undefined → all tokens invalid.`,
            hypothesis: 'Commit changed auth config incorrectly',
        },
        {
            id: 'git_reset_hard',
            label: 'Hard Reset to Previous Commit (DANGEROUS)',
            type: 'run_command',
            category: 'reflexive',
            informationCostType: 'run_command',
            outcomeTemplate: `$ git reset --hard b4d1e8f\n\n⚠ LOCAL history rewritten. You are now behind origin/main.\n$ git push --force  ← required, rewrites remote history\n\nThis approach rewrites shared history. Teammates working on the same branch will have diverged histories. Force push may cause data loss.`,
        },
        {
            id: 'understand_revert',
            label: 'Check Difference: git revert vs git reset',
            type: 'read_file',
            category: 'investigation',
            informationCostType: 'read_file',
            advancesResolution: true,
            outcomeTemplate: `git revert <hash>:\n  → Creates a NEW commit that reverses the changes\n  → History is preserved\n  → Safe for shared/public branches\n  → No --force push needed\n\ngit reset --hard <hash>:\n  → Deletes commits from history\n  → Rewrites history (destructive)\n  → Requires force push\n  → Dangerous for shared branches`,
            hypothesis: 'Revert is safer than reset for shared branches',
        },
        {
            id: 'git_revert',
            label: 'Revert the Bad Commit (git revert a7f3c2e)',
            type: 'git_revert',
            category: 'modification',
            informationCostType: 'run_command',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `$ git revert a7f3c2e\n\nCreated new commit:\n  b8c4d1e (HEAD) Revert "feat: update ${surface.variableName} config"\n\n$ git push\nTo github.com:you/repo.git\n  a7f3c2e..b8c4d1e  main -> main\n\nHistory preserved. No force push. Auth restored.\nError rate dropping to baseline.\n\n✓ Safe revert completed.\n✓ SYSTEM STABILIZED`,
        },
        {
            id: 'check_git_log_after',
            label: 'Verify git log After Revert',
            type: 'git_log',
            category: 'investigation',
            informationCostType: 'run_command',
            outcomeTemplate: (surface) =>
                `$ git log --oneline -6\nb8c4d1e (HEAD) Revert "feat: update ${surface.variableName} config"\na7f3c2e feat: update ${surface.variableName} config\nb4d1e8f fix: improve error messages\n...\n\n✓ Bad commit still in history (traceable)\n✓ Revert commit clearly explains the rollback\n✓ No history rewrite`,
        },
    ],

    falseHypotheses: [
        {
            id: 'fh_delete_files',
            hypothesis: 'Manually delete changed files and recommit',
            description: 'Just undo the code changes manually — safer than git commands.',
            associatedActions: ['git_show_commit'],
            plausibilityReason: 'Manual undo avoids git complexity and potential mistakes',
        },
        {
            id: 'fh_reset',
            hypothesis: 'Hard reset is faster — just need to fix production now',
            description: 'git reset --hard immediately restores the previous state.',
            associatedActions: ['git_reset_hard'],
            plausibilityReason: 'Reset is direct — get previous version instantly',
        },
        {
            id: 'fh_new_fix',
            hypothesis: 'Push a new fix commit on top instead of reverting',
            description: 'Easier to fix forward than revert — just correct the config manually.',
            associatedActions: ['git_show_commit'],
            plausibilityReason: 'Fix-forward is less risky than running revert commands',
        },
    ],

    resolution: {
        requiredActionIds: ['git_revert'],
        requiredStateFlags: ['commit_identified', 'safely_reverted'],
        alternativePaths: [
            ['git_show_commit', 'understand_revert', 'git_revert'],
            ['git_show_commit', 'git_revert'],
        ],
    },

    blindActionThreshold: 5,
    entropyLevel: 2,
    conceptId: 'git-history',
};

export default LEVEL_3_3;
