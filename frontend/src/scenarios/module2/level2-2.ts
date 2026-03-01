// Vibe2Real — Module 2, Level 2.2
// Failure Archetype: SILENT FAILURE
// Scenario: API call fails but UI shows no error. Network tab reveals 4xx response silently swallowed.
// Reasoning Error: Trusted UI state without inspecting network layer.

import type { ScenarioDefinition } from '../types';

const LEVEL_2_2: ScenarioDefinition = {
    id: '2-2',
    moduleId: 2,
    levelIndex: 1,
    moduleType: 'read',
    title: 'The Swallowed Error',
    failureArchetype: 'Silent Failure',
    twoLineDescription: 'UI shows loading spinner forever. No error displayed. Looks like it\'s working.\nThe API already responded — with a failure nobody caught.',

    confusionPhaseEnd: 0.20,
    falseConfidencePhaseEnd: 0.50,
    failurePhaseEnd: 0.65,
    insightPhaseEnd: 0.75,

    initialAppState: (surface) => `
// UI: Loading spinner spinning indefinitely.
// No error message shown.

// Frontend fetch code:
async function ${surface.variableName}() {
  try {
    const res = await fetch('${surface.apiEndpoint}');
    const data = await res.json();
    setItems(data.items);
  } catch (e) {
    // error silently swallowed
    console.log('done');
  }
}

// Network (visible via DevTools):
GET ${surface.apiEndpoint}
Status: 401 Unauthorized
Response: {"error": "Token expired"}

// Console: (only) "done"
// No error displayed in UI. Spinner never stops.
  `.trim(),

    actions: [
        {
            id: 'inspect_network',
            label: 'Check Network Tab',
            type: 'inspect_network',
            category: 'investigation',
            informationCostType: 'open_network_tab',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `GET ${surface.apiEndpoint}\nStatus: 401 Unauthorized\n\nRequest Headers:\n  Authorization: Bearer <expired-token>\n\nResponse:\n  {"error": "Token expired"}\n\n⚠ Request completed. Server responded. Client received 401 — but UI shows no error.`,
            hypothesis: 'API might be returning an error that the UI is not showing',
        },
        {
            id: 'inspect_console',
            label: 'Check Console',
            type: 'inspect_console',
            category: 'investigation',
            informationCostType: 'open_console',
            outcomeTemplate: 'Console output:\n"done"\n\nNo stack trace. No error log.\nThe catch block ran but swallowed the rejection.',
        },
        {
            id: 'read_fetch_code',
            label: 'Read Fetch Handler Code',
            type: 'read_code',
            category: 'investigation',
            informationCostType: 'read_file',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `// The fetch function:\ntry {\n  const res = await fetch('${surface.apiEndpoint}');\n  const data = await res.json();\n  setItems(data.items);\n} catch (e) {\n  console.log('done');  // ← error swallowed here\n}\n\n// 401 responses do not throw — they must be checked manually:\n// if (!res.ok) throw new Error(res.statusText);\n// Without this, 4xx responses appear as successful to try/catch`,
            hypothesis: 'Error handling might be swallowing the 4xx response',
        },
        {
            id: 'reload_page',
            label: 'Reload Page',
            type: 'reload_page',
            category: 'reflexive',
            informationCostType: 'page_reload',
            isBlind: true,
            outcomeTemplate: 'Reloaded. Same spinner. Same behavior. 401 still returned.',
        },
        {
            id: 'fix_error_handling',
            label: 'Add res.ok Check in Fetch Handler',
            type: 'modify_code',
            category: 'modification',
            informationCostType: 'edit_file',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `// Updated:\ntry {\n  const res = await fetch('${surface.apiEndpoint}');\n  if (!res.ok) throw new Error(\`HTTP \${res.status}: \${res.statusText}\`);\n  const data = await res.json();\n  setItems(data.items);\n} catch (e) {\n  setError(e.message);\n}\n\nUI now shows: "Session expired. Please log in again."\n\n✓ Error surfaced to user.\n✓ SYSTEM STABILIZED`,
        },
        {
            id: 'check_auth_token',
            label: 'Inspect Auth Token',
            type: 'inspect_element',
            category: 'investigation',
            informationCostType: 'inspect_element',
            outcomeTemplate: 'Application > Storage > Cookies:\nauth_token: eyJ... (expired 2 hours ago)\n\nToken present but expired. Server correctly returns 401.',
        },
    ],

    falseHypotheses: [
        {
            id: 'fh_server_down',
            hypothesis: 'Server is down — request never completes',
            description: 'Infinite spinner usually means no response received from server.',
            associatedActions: ['reload_page', 'inspect_console'],
            plausibilityReason: 'Loading forever = CORS block or timeout',
        },
        {
            id: 'fh_cors',
            hypothesis: 'CORS is blocking the request',
            description: 'Spinner with no errors in console = CORS preflight blocked',
            associatedActions: ['inspect_console', 'reload_page'],
            plausibilityReason: 'Silent failure on API call is classic CORS symptom',
        },
        {
            id: 'fh_infinite_loading',
            hypothesis: 'Loading state set to true but never set to false (UI bug)',
            description: 'Maybe the setLoading(false) call never executes.',
            associatedActions: ['read_fetch_code', 'inspect_console'],
            plausibilityReason: 'Spinner never stopping = loading state management bug',
        },
    ],

    resolution: {
        requiredActionIds: ['inspect_network', 'fix_error_handling'],
        requiredStateFlags: ['silent_error_found', 'error_handling_fixed'],
        alternativePaths: [
            ['inspect_network', 'read_fetch_code', 'fix_error_handling'],
        ],
    },

    blindActionThreshold: 4,
    entropyLevel: 2,
    conceptId: 'http-status',
};

export default LEVEL_2_2;
