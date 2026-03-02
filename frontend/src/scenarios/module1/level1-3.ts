// Vibe2Real — Module 1, Level 1.3
// Failure Archetype: SYMPTOM ≠ CAUSE
// Scenario: API returns 200 but UI shows wrong data.
//           Response is valid — transformation logic is wrong.
// Reasoning Error: Confused success status with correct behavior.

import type { ScenarioDefinition } from '../types';

const LEVEL_1_3: ScenarioDefinition = {
    id: '1-3',
    moduleId: 1,
    levelIndex: 2,
    moduleType: 'trace',
    title: 'False Positive',
    failureArchetype: 'Symptom ≠ Cause',
    twoLineDescription: 'API returns 200. Network tab shows success. UI displays wrong data.\nThe system says it worked. It didn\'t.',

    confusionPhaseEnd: 0.20,
    falseConfidencePhaseEnd: 0.50,
    failurePhaseEnd: 0.65,
    insightPhaseEnd: 0.75,
    dispatchMessage: "the dashboard is showing the wrong user's name. two clients noticed. this is bad",
    narratorScript: {
        "opening": "200 from the API. Network tab shows success. UI shows wrong data. The request worked — the reading didn't. Check what the response actually contains versus what the code thinks it contains.",
        "actions": {
            "inspect_network": "Response: { user: { name: 'Alex' } }. The data is correct. Something broke between receiving it and displaying it.",
            "inspect_console": "No errors. Component rendered. But check what it's actually pulling from the response — the structure matters.",
            "read_transform_code": "Code reads response.name. Structure is { user: { name } }. Should be response.user.name. One level off.",
            "check_api_structure": "The structure is different from what frontend expects.",
            "check_backend_route": "Backend sends { user: { name, role } }. Shape is correct. The bug is on the frontend reading it."
        },
        "resolution": "Accessor fixed to response.user.name. The API was always sending the right data. The code was reading from the wrong level of the object."
    },
    momentumTease: "Next case: A button exists. The click handler is attached. Nothing happens on click. The component has everything — except one thing it never received.",


    initialAppState: (surface) => `
// UI displays: "Welcome, undefined"
// Expected: "Welcome, Arjun"

// API Response (200 OK):
GET ${surface.apiEndpoint}/me
{
  "user": {
    "name": "Arjun",
    "email": "arjun@example.com",
    "role": "developer"
  }
}

// Frontend transform:
const ${surface.variableName} = await fetchUser();
setDisplayName(${surface.variableName}.name);  // ← shows undefined

// No errors in console. No network failures.
// 200 status. Valid JSON. Wrong UI.
  `.trim(),

    actions: [
        {
            id: 'inspect_network',
            label: 'Check Network Response',
            type: 'inspect_network',
            category: 'investigation',
            informationCostType: 'open_network_tab',
            outcomeTemplate: (surface) =>
                `GET ${surface.apiEndpoint}/me\nStatus: 200 OK\n\nResponse Body:\n{\n  "user": {\n    "name": "Arjun",\n    "email": "arjun@example.com"\n  }\n}\n\n✓ Response is valid JSON.\n✓ Name field present in response.\nThe API is working correctly.`,
            hypothesis: 'API might be returning incorrect data',
        },
        {
            id: 'inspect_console',
            label: 'Check Console Output',
            type: 'inspect_console',
            category: 'investigation',
            informationCostType: 'open_console',
            outcomeTemplate: 'No errors.\nNo warnings.\nApp initialized successfully.\n\nValue logged: undefined\n\n⚠ A value in your code is resolving to undefined.',
        },
        {
            id: 'read_transform_code',
            label: 'Read Data Transform Code',
            type: 'read_code',
            category: 'investigation',
            informationCostType: 'read_file',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `// userService.ts:\nasync function fetchUser() {\n  const res = await fetch('${surface.apiEndpoint}/me');\n  const data = await res.json();\n  return data;  // ← returns { user: { name: ... } }\n}\n\n// Component:\nconst ${surface.variableName} = await fetchUser();\nsetDisplayName(${surface.variableName}.name);\n// ⚠ ${surface.variableName} is { user: { name: 'Arjun' } }\n// Accessing .name gives undefined — should be .user.name`,
            hypothesis: 'Data structure mismatch in transform code',
        },
        {
            id: 'check_api_structure',
            label: 'Compare API Shape vs Frontend Expectation',
            type: 'read_code',
            category: 'investigation',
            informationCostType: 'read_file',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `// API returns: { user: { name, email } }  ← nested\n// Frontend reads: ${surface.variableName}.name  ← reads top-level\n\n// ${surface.variableName} = { user: { name: 'Arjun' } }\n// ${surface.variableName}.name = undefined\n// ${surface.variableName}.user.name = 'Arjun'\n\n// Fix: access .user.name instead of .name`,
        },
        {
            id: 'check_backend_route',
            label: 'Inspect Backend Route Logic',
            type: 'read_code',
            category: 'investigation',
            informationCostType: 'read_file',
            outcomeTemplate: (surface) =>
                `// Backend (server.ts):\napp.get('${surface.apiEndpoint}/me', (req, res) => {\n  const user = db.findUser(req.userId);\n  res.json({ user });  // ← wraps in { user } object\n});\n\n// Backend is correct. It intentionally nests data.`,
        },
        {
            id: 'reload_page',
            label: 'Reload Page',
            type: 'reload_page',
            category: 'reflexive',
            informationCostType: 'page_reload',
            isBlind: true,
            outcomeTemplate: 'Reloaded. Still shows "Welcome, undefined". Issue is not a state/timing problem.',
        },
        {
            id: 'fix_accessor',
            label: 'Fix Data Accessor (.user.name)',
            type: 'modify_code',
            category: 'modification',
            informationCostType: 'edit_file',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `// Updated:\nconst ${surface.variableName} = await fetchUser();\nsetDisplayName(${surface.variableName}.user.name);  // ← fixed\n\nApp refreshed.\nUI displays: "Welcome, Arjun"\n\n✓ Data transformation corrected.\n✓ SYSTEM STABILIZED`,
        },
    ],

    falseHypotheses: [
        {
            id: 'fh_api_wrong',
            hypothesis: 'API is returning wrong data',
            description: 'The name is undefined — API must be returning null/empty user.',
            associatedActions: ['inspect_network', 'check_backend_route'],
            plausibilityReason: 'Undefined display usually means missing data from server',
        },
        {
            id: 'fh_auth_session',
            hypothesis: 'Authentication token is expired — returning wrong user',
            description: 'Wrong user could mean the session is stale or invalid.',
            associatedActions: ['inspect_network', 'inspect_console'],
            plausibilityReason: '200 with wrong data = serving stale session',
        },
        {
            id: 'fh_cache',
            hypothesis: 'Cached response showing old/empty user data',
            description: 'Browser cache might be serving a previous empty response.',
            associatedActions: ['reload_page', 'inspect_network'],
            plausibilityReason: '200 with stale data is a cache pattern',
        },
    ],

    resolution: {
        requiredActionIds: ['read_transform_code', 'fix_accessor'],
        requiredStateFlags: ['accessor_bug_found', 'accessor_fixed'],
        alternativePaths: [
            ['inspect_network', 'check_api_structure', 'fix_accessor'],
        ],
    },

    blindActionThreshold: 5,
    entropyLevel: 1,
    conceptId: 'api-response',
};

export default LEVEL_1_3;
