// Vibe2Real — Module 2, Level 2.5
// Failure Archetype: STALE STATE
// Scenario: UI shows outdated data. App looks functional but caching layer serves stale responses.
// Reasoning Error: Assumed fresh data without verifying freshness.

import type { ScenarioDefinition } from '../types';

const LEVEL_2_5: ScenarioDefinition = {
    id: '2-5',
    moduleId: 2,
    levelIndex: 4,
    moduleType: 'read',
    title: 'Yesterday\'s Data',
    failureArchetype: 'Stale State',
    twoLineDescription: 'App is functional. UI loads. Data shown is 24 hours old.\nEverything appears to be working.',

    confusionPhaseEnd: 0.20,
    falseConfidencePhaseEnd: 0.45,
    failurePhaseEnd: 0.65,
    insightPhaseEnd: 0.75,
    dispatchMessage: "user is seeing yesterday's data. they made a payment and it's not showing",
    narratorScript: {
        "opening": "Everything looks fine. Data is 24 hours old. No errors. The UI is rendering exactly what it received — check what the server actually sent back, beyond just the status code.",
        "actions": {
            "inspect_network_response": "GET /api/feed — 200. Check the response headers on this specific request. Something there controls how long the browser holds onto this response.",
            "check_cache_storage": "Cache-Control: max-age=86400. Server told the browser to cache this for exactly 24 hours. Browser never re-fetched it.",
            "check_service_worker": "No errors. Component rendered correctly with what it received. The data is stale — that's a caching issue, not a code issue.",
            "hard_reload": "Hard reload bypasses cache. That proves it's a caching problem."
        },
        "resolution": "Cache-Control header found. Stale data with no errors is almost always a cache directive. Invisible until you look at headers specifically."
    },
    momentumTease: "Module 3 begins. No more reading output. You're in the terminal now.",


    initialAppState: (surface) => `
// UI shows: "Last updated: 24 hours ago"
// User submitted new data — still not visible.

// Network response:
GET ${surface.apiEndpoint}
Status: 200 OK
Response: { items: [...24h old data...] }

// Response Headers:
Cache-Control: max-age=86400   ← 24 hours!
ETag: "abc123stale"
Age: 86234                     ← been cached 23.95 hours

// Browser DevTools > Application > Cache Storage:
${surface.apiEndpoint}: Cached, expires in 166 seconds

// No errors. No failed requests. Stale data served silently.
  `.trim(),

    actions: [
        {
            id: 'reload_page',
            label: 'Reload Page',
            type: 'reload_page',
            category: 'reflexive',
            informationCostType: 'page_reload',
            isBlind: true,
            outcomeTemplate: 'Same old data. Normal reload uses browser cache. Data still 24h old.',
        },
        {
            id: 'inspect_network_response',
            label: 'Inspect Network Response Headers',
            type: 'inspect_network',
            category: 'investigation',
            informationCostType: 'open_network_tab',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `GET ${surface.apiEndpoint}\nStatus: 200 OK (from disk cache)\n\nResponse Headers:\n  Cache-Control: max-age=86400    ← 24-hour cache\n  Age: 86234                       ← cached 23.95 hours ago\n  ETag: "abc123stale"\n\n⚠ Response served from cache, not from server.\n  The 'Age' header shows how old the cached response is.`,
            hypothesis: 'Response might be cached — not fresh from server',
        },
        {
            id: 'check_cache_storage',
            label: 'Check Application Cache Storage',
            type: 'inspect_element',
            category: 'investigation',
            informationCostType: 'inspect_element',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `Application > Cache Storage:\n\nCached entry: GET ${surface.apiEndpoint}\n  Stored: 23h 57m ago\n  Expires: in 3 minutes\n  Status: 200 (stale)\n\nService Worker: active (caching all GET requests)`,
        },
        {
            id: 'hard_reload',
            label: 'Hard Reload (Bypass Cache)',
            type: 'reload_page',
            category: 'investigation',
            informationCostType: 'page_reload',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `Hard reload (Ctrl+Shift+R) executed.\nCache bypassed.\n\nGET ${surface.apiEndpoint} → fetched from server\nStatus: 200 OK (fresh)\nNew data visible in UI.\n\n✓ Confirmed: stale cache was serving old data.`,
            hypothesis: 'Hard reload might bypass cache and show fresh data',
        },
        {
            id: 'check_service_worker',
            label: 'Check Service Worker Config',
            type: 'read_code',
            category: 'investigation',
            informationCostType: 'read_file',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `// service-worker.js:\nself.addEventListener('fetch', (event) => {\n  event.respondWith(\n    caches.match(event.request)  // ← returns cached without freshness check\n      .then(response => response || fetch(event.request))\n  );\n});\n\n// Problem: caches.match() returns cache without checking max-age.\n// Should use network-first or stale-while-revalidate strategy.`,
        },
        {
            id: 'fix_cache_headers',
            label: 'Set Shorter Cache TTL on API Route',
            type: 'modify_code',
            category: 'modification',
            informationCostType: 'edit_file',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `// Backend updated:\nres.set('Cache-Control', 'no-store');  // or max-age=60\n\nCache cleared.\nGET ${surface.apiEndpoint} → fresh data\nUI shows current data.\n\n✓ Cache strategy updated.\n✓ SYSTEM STABILIZED`,
        },
    ],

    falseHypotheses: [
        {
            id: 'fh_database_not_updated',
            hypothesis: 'Database write failed — new data not saved',
            description: 'Data not showing after submit = database write failure.',
            associatedActions: ['reload_page'],
            plausibilityReason: 'UI showing old data after submission = write failed silently',
        },
        {
            id: 'fh_mutation_not_called',
            hypothesis: 'Frontend mutation function not triggering after form submit',
            description: 'Maybe the POST request to save data was never sent.',
            associatedActions: ['reload_page', 'inspect_network_response'],
            plausibilityReason: 'Data not updating after submit = event handler not firing',
        },
        {
            id: 'fh_server_returning_wrong',
            hypothesis: 'Server is returning wrong user\'s data',
            description: 'Stale-looking data might be another user\'s data.',
            associatedActions: ['inspect_network_response'],
            plausibilityReason: 'Authentication issue = wrong session data served',
        },
    ],

    resolution: {
        requiredActionIds: ['inspect_network_response'],
        requiredStateFlags: ['cache_found'],
        alternativePaths: [
            ['inspect_network_response', 'fix_cache_headers'],
            ['check_cache_storage', 'fix_cache_headers'],
            ['inspect_network_response', 'check_service_worker', 'fix_cache_headers'],
        ],
    },

    blindActionThreshold: 4,
    entropyLevel: 2,
    conceptId: 'http-caching',
};

export default LEVEL_2_5;
