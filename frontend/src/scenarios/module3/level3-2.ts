// Vibe2Real — Module 3, Level 3.2
// Failure Archetype: STATE CONFLICT
// Scenario: Merge conflict blocks deployment. Multiple valid resolution paths exist.
// Reasoning Error: Applied resolution without understanding conflicting changes.

import type { ScenarioDefinition } from '../types';

const LEVEL_3_2: ScenarioDefinition = {
    id: '3-2',
    moduleId: 3,
    levelIndex: 1,
    moduleType: 'ship',
    title: 'Conflict Resolution',
    failureArchetype: 'State Conflict',
    twoLineDescription: 'Merge failed. Both branches changed the same file. Deploy is blocked.\nYou must understand what both sides intended before resolving.',

    confusionPhaseEnd: 0.20,
    falseConfidencePhaseEnd: 0.45,
    failurePhaseEnd: 0.65,
    insightPhaseEnd: 0.75,
    dispatchMessage: "merge is failing and the release is blocked. i don't know which version to keep",
    narratorScript: {
        "opening": "Two branches changed the same file. Git doesn't know which version is correct. You have to read both, understand why each change was made, and decide what the right final state is. No tool does this for you.",
        "actions": {
            "git_log_both": "Conflict markers: HEAD has timeout: 5000, incoming has timeout: 30000. Both changed the same config line for different reasons.",
            "read_diff": "Main set a global 5s timeout. Feature branch set a per-route 30s for uploads. These serve different purposes — both should exist."
        },
        "resolution": "Per-route timeouts configured. Merge conflicts require understanding why each change was made — not just picking one side."
    },
    momentumTease: "Next case: A bad commit is live. Users are affected right now. The fix has to be surgical — undo one thing without breaking what came after.",


    initialAppState: (surface) => `
$ git merge feature/${surface.serviceName}
Auto-merging ${surface.variableName}.js
CONFLICT (content): Merge conflict in ${surface.variableName}.js
Automatic merge failed; fix conflicts and then commit the result.

$ cat ${surface.variableName}.js
<<<<<<< HEAD
const timeout = 5000;  // main: 5s timeout
=======
const timeout = 30000; // feature: extended for large payloads
>>>>>>> feature/${surface.serviceName}

app.use('/', router({ timeout }));

$ # Two different timeout values. Which is correct?
  `.trim(),

    actions: [
        {
            id: 'accept_current',
            label: 'Accept Current (Keep HEAD: 5000)',
            type: 'run_command',
            category: 'reflexive',
            informationCostType: 'run_command',
            isBlind: true,
            outcomeTemplate: 'Merge resolved with timeout=5000. Large upload requests start timing out in production. Users report file upload failures.',
        },
        {
            id: 'accept_incoming',
            label: 'Accept Incoming (Use feature: 30000)',
            type: 'run_command',
            category: 'reflexive',
            informationCostType: 'run_command',
            isBlind: true,
            outcomeTemplate: 'Merge resolved with timeout=30000. File uploads work but API health checks flag slow responses. Monitor for idle connection issues.',
        },
        {
            id: 'git_log_both',
            label: 'Read Commit History of Both Branches',
            type: 'git_log',
            category: 'investigation',
            informationCostType: 'run_command',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `$ git log --oneline HEAD...feature/${surface.serviceName}\n\na1b2c3d (HEAD) fix: reduce timeout to prevent idle connections\nf4e5d6c (feature) feat: support large file uploads (require 30s timeout)\n\n⚠ Both changes are intentional. The correct value depends on use case.`,
            hypothesis: 'Need to understand intent of both changes',
        },
        {
            id: 'read_diff',
            label: 'Read Full Diff Between Branches',
            type: 'git_diff',
            category: 'investigation',
            informationCostType: 'run_command',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `$ git diff HEAD feature/${surface.serviceName}\n\n// main branch reason: idle connections causing 5s leak\n// feature branch reason: large file uploads need 30s\n\n// Both are valid. Need per-route timeout config:\n// - file upload route: 30000\n// - default: 5000`,
        },
        {
            id: 'implement_per_route',
            label: 'Configure Per-Route Timeouts',
            type: 'modify_code',
            category: 'modification',
            informationCostType: 'edit_file',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `// ${surface.variableName}.js resolved:\nconst defaultTimeout = 5000;\nconst uploadTimeout = 30000;\n\napp.use('/upload', router({ timeout: uploadTimeout }));\napp.use('/', router({ timeout: defaultTimeout }));\n\n$ git add ${surface.variableName}.js && git commit -m "fix: per-route timeout config"\nMerge committed successfully.\n\n✓ Both requirements satisfied.\n✓ SYSTEM STABILIZED`,
        },
    ],

    falseHypotheses: [
        {
            id: 'fh_take_larger',
            hypothesis: 'Always use the larger timeout — safer option',
            description: 'Larger timeout accommodates more scenarios without breaking anything.',
            associatedActions: ['accept_incoming'],
            plausibilityReason: 'More permissive = fewer failures = correct choice',
        },
        {
            id: 'fh_take_smaller',
            hypothesis: 'Keep the main branch value — feature branches often add bugs',
            description: 'Merge conflicts should favor production (HEAD) changes.',
            associatedActions: ['accept_current'],
            plausibilityReason: 'HEAD is the stable production code, feature branch is experimental',
        },
        {
            id: 'fh_revert',
            hypothesis: 'Revert the feature branch entirely to unblock deployment',
            description: 'Conflict means the feature is not ready — abandon it.',
            associatedActions: ['git_log_both'],
            plausibilityReason: 'When merges conflict, safest path is to defer the feature',
        },
    ],

    resolution: {
        requiredActionIds: ['git_log_both', 'implement_per_route'],
        requiredStateFlags: ['both_intentions_understood', 'conflict_reasoned'],
        alternativePaths: [
            ['read_diff', 'implement_per_route'],
            ['git_log_both', 'read_diff', 'implement_per_route'],
        ],
    },

    blindActionThreshold: 4,
    entropyLevel: 2,
    conceptId: 'git-conflicts',
};

export default LEVEL_3_2;
