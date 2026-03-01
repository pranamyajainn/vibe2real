// Vibe2Real — Module 2, Level 2.3
// Failure Archetype: WRONG BOUNDARY ASSUMPTION
// Scenario: App is slow. User assumes frontend issue — actual bottleneck is 3rd-party API timeout.
// Reasoning Error: Assumed failure lives in the layer closest to symptom.

import type { ScenarioDefinition } from '../types';

const LEVEL_2_3: ScenarioDefinition = {
    id: '2-3',
    moduleId: 2,
    levelIndex: 2,
    moduleType: 'read',
    title: 'The Wrong Layer',
    failureArchetype: 'Wrong Boundary Assumption',
    twoLineDescription: 'Page load takes 8+ seconds. Symptom is in the frontend. Slowdown is not.\nThe bottleneck lives one layer deeper than where you are looking.',

    confusionPhaseEnd: 0.20,
    falseConfidencePhaseEnd: 0.45,
    failurePhaseEnd: 0.65,
    insightPhaseEnd: 0.75,

    initialAppState: (surface) => `
// Page load time: 8.4 seconds
// Feels sluggish throughout render

// Network Waterfall (DevTools):
GET /                         12ms
GET /static/bundle.js         180ms
GET ${surface.apiEndpoint}    7,840ms  ← ??? 
GET /static/styles.css        22ms

// ${surface.apiEndpoint} backend code:
app.get('${surface.apiEndpoint}', async (req, res) => {
  const internal = await db.query('SELECT * FROM items');
  const external = await fetch('https://analytics.${surface.serviceName}.io/track');
  res.json({ items: internal, tracked: external.ok });
});

// analytics.${surface.serviceName}.io is a 3rd-party analytics API
// App is slow. Console has no errors. Frontend code is fine.
  `.trim(),

    actions: [
        {
            id: 'check_bundle_size',
            label: 'Inspect Frontend Bundle Size',
            type: 'read_file',
            category: 'investigation',
            informationCostType: 'read_file',
            outcomeTemplate: 'bundle.js: 180ms load time, 420KB\nWithin acceptable range for a production app.\nFrontend bundle is not the cause of slowness.',
        },
        {
            id: 'check_network_waterfall',
            label: 'Analyze Network Waterfall',
            type: 'inspect_network',
            category: 'investigation',
            informationCostType: 'open_network_tab',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `Network waterfall timings:\n\nGET /                  12ms\nGET bundle.js          180ms\nGET ${surface.apiEndpoint}  7,840ms  ← OUTLIER\nGET styles.css         22ms\n\n⚠ ${surface.apiEndpoint} takes 7.8 seconds.\n  Other requests are fast.\n  The slow request is YOUR API endpoint, not the frontend.`,
            hypothesis: 'API endpoint is extremely slow',
        },
        {
            id: 'check_api_internals',
            label: 'Read Backend Route Implementation',
            type: 'read_code',
            category: 'investigation',
            informationCostType: 'read_file',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `// Backend route:\napp.get('${surface.apiEndpoint}', async (req, res) => {\n  const internal = await db.query('SELECT * FROM items');  // fast: 12ms\n  const external = await fetch('https://analytics.${surface.serviceName}.io/track');  // ← BLOCKING\n  res.json({ items: internal, tracked: external.ok });\n});\n\n// Response waits for BOTH promises sequentially.\n// analytics call blocks the entire response.`,
            hypothesis: '3rd-party call is blocking the API response',
        },
        {
            id: 'check_third_party',
            label: 'Identify 3rd Party API Response Time',
            type: 'inspect_network',
            category: 'investigation',
            informationCostType: 'open_network_tab',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `Outbound call from backend (server logs):\nPOST https://analytics.${surface.serviceName}.io/track\n  → Response time: 7,620ms\n  → Status: 200 (eventually)\n\n3rd-party API is slow but not down.\nYour backend awaits it synchronously, blocking your response.`,
        },
        {
            id: 'optimize_frontend',
            label: 'Optimize Frontend Rendering',
            type: 'modify_code',
            category: 'reflexive',
            informationCostType: 'edit_file',
            isBlind: true,
            outcomeTemplate: 'Added React.memo and useMemo optimizations. Page load still 8.4 seconds. The bottleneck is not in the frontend.',
        },
        {
            id: 'fix_fire_and_forget',
            label: 'Make Analytics Call Non-Blocking (Fire & Forget)',
            type: 'modify_code',
            category: 'modification',
            informationCostType: 'edit_file',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `// Backend updated:\napp.get('${surface.apiEndpoint}', async (req, res) => {\n  const internal = await db.query('SELECT * FROM items');\n  fetch('https://analytics.${surface.serviceName}.io/track').catch(() => {});  // fire & forget\n  res.json({ items: internal });  // don't wait for analytics\n});\n\nAPI response time: 14ms\nPage load: 210ms\n\n✓ 3rd-party blocking resolved.\n✓ SYSTEM STABILIZED`,
        },
    ],

    falseHypotheses: [
        {
            id: 'fh_bundle',
            hypothesis: 'Frontend JS bundle is too large — blocking parse',
            description: 'Slow page load usually means too much JavaScript to parse.',
            associatedActions: ['check_bundle_size', 'optimize_frontend'],
            plausibilityReason: 'Perceived slowness after first interaction = large bundle',
        },
        {
            id: 'fh_database',
            hypothesis: 'Database query is slow (missing index)',
            description: 'Backend endpoint is slow — database is likely unindexed.',
            associatedActions: ['check_api_internals'],
            plausibilityReason: 'Slow API = slow database query (most common cause)',
        },
        {
            id: 'fh_css_blocking',
            hypothesis: 'CSS render-blocking stylesheet causing visual delay',
            description: '8 second white screen could be render-blocking CSS.',
            associatedActions: ['check_network_waterfall'],
            plausibilityReason: 'First render delay with no JS errors is classic CSS blocking signal',
        },
    ],

    resolution: {
        requiredActionIds: ['check_network_waterfall', 'check_api_internals'],
        requiredStateFlags: ['bottleneck_identified', 'third_party_found'],
        alternativePaths: [
            ['check_network_waterfall', 'check_third_party', 'fix_fire_and_forget'],
        ],
    },

    blindActionThreshold: 5,
    entropyLevel: 2,
    conceptId: 'network-waterfall',
};

export default LEVEL_2_3;
