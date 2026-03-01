// Vibe2Real — Module 1, Level 1.2
// Failure Archetype: REQUEST NEVER REACHES EXPECTED LAYER
// Scenario: Form submits but nothing saves. Frontend sends request;
//           it never arrives at the API (wrong URL, missing route prefix).
// Reasoning Error: Assumed request reaches destination without tracing.

import type { ScenarioDefinition } from '../types';

const LEVEL_1_2: ScenarioDefinition = {
    id: '1-2',
    moduleId: 1,
    levelIndex: 1,
    moduleType: 'trace',
    title: 'Lost in Transit',
    failureArchetype: 'Request Never Reaches Layer',
    twoLineDescription: 'Form submitted. Success toast appeared. Database shows nothing saved.\nThe request completed — where did it go?',

    confusionPhaseEnd: 0.20,
    falseConfidencePhaseEnd: 0.45,
    failurePhaseEnd: 0.65,
    insightPhaseEnd: 0.75,

    initialAppState: (surface) => `
// Frontend form submit handler:
async function handleSubmit(data) {
  const res = await fetch('/api${surface.apiEndpoint}', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (res.ok) showToast('Saved!');  // ← always runs
}

// Backend routes (server.ts):
app.post('${surface.apiEndpoint}', saveHandler);  // ← no /api prefix!

// Console:
POST /api${surface.apiEndpoint}  404 Not Found

// Network (Production):
POST /api${surface.apiEndpoint} → 404
Response: { "error": "Cannot POST /api${surface.apiEndpoint}" }

// Database:
SELECT * FROM records;  -- (0 rows)
  `.trim(),

    actions: [
        {
            id: 'inspect_console',
            label: 'Inspect Console',
            type: 'inspect_console',
            category: 'investigation',
            informationCostType: 'open_console',
            outcomeTemplate: (surface) =>
                `POST /api${surface.apiEndpoint} 404 (Not Found)\n\nNo JavaScript errors.\nToast message fired on res.ok check.\nres.ok was true for 404 response? No — check response handling logic.`,
        },
        {
            id: 'inspect_network',
            label: 'Check Network Tab',
            type: 'inspect_network',
            category: 'investigation',
            informationCostType: 'open_network_tab',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `POST /api${surface.apiEndpoint}\nStatus: 404 Not Found\n\nRequest Headers:\n  Content-Type: application/json\n\nRequest Payload:\n  {"name":"test","value":"example"}\n\nResponse:\n  {"error": "Cannot POST /api${surface.apiEndpoint}"}\n\n⚠ Notice: 404 returned but toast fired. Check res.ok behavior for 404.`,
            hypothesis: 'Network request is being sent but returning 404',
        },
        {
            id: 'read_frontend_code',
            label: 'Read Form Handler Code',
            type: 'read_code',
            category: 'investigation',
            informationCostType: 'read_file',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `// handleSubmit:\nconst res = await fetch('/api${surface.apiEndpoint}', {...});\nif (res.ok) showToast('Saved!');\n\n// ⚠ 'res.ok' is TRUE when status 200-299\n// 404 is NOT in this range, so toast should NOT fire.\n// But it IS firing — check the condition logic.`,
        },
        {
            id: 'read_backend_routes',
            label: 'Read Backend Route Definitions',
            type: 'read_code',
            category: 'investigation',
            informationCostType: 'read_file',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `// server.ts — registered routes:\napp.get('/', homeHandler);\napp.post('${surface.apiEndpoint}', saveHandler);  // ← NO /api prefix\napp.get('/health', healthHandler);\n\n// Frontend sends to: /api${surface.apiEndpoint}\n// Backend listens at: ${surface.apiEndpoint}\n// Mismatch: route prefix missing on backend`,
            hypothesis: 'Route prefix mismatch between frontend and backend',
        },
        {
            id: 'check_database',
            label: 'Inspect Database Records',
            type: 'read_file',
            category: 'investigation',
            informationCostType: 'read_file',
            outcomeTemplate: 'Database query:\nSELECT * FROM records ORDER BY created_at DESC LIMIT 10;\n\nResult: (0 rows)\n\nNo records exist. Submit did not persist anything.',
        },
        {
            id: 'reload_page',
            label: 'Reload Page',
            type: 'reload_page',
            category: 'reflexive',
            informationCostType: 'page_reload',
            isBlind: true,
            outcomeTemplate: 'Page reloaded. Form still submits. Database still shows no records.',
        },
        {
            id: 'fix_backend_route',
            label: 'Add /api Prefix to Backend Route',
            type: 'modify_code',
            category: 'modification',
            informationCostType: 'edit_file',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `// server.ts updated:\napp.post('/api${surface.apiEndpoint}', saveHandler);  // ← prefix added\n\nServer restarted.\nTesting form submit...\n\nPOST /api${surface.apiEndpoint} → 201 Created\nDatabase: 1 row inserted\n\n✓ Data saves correctly.\n✓ SYSTEM STABILIZED`,
        },
    ],

    falseHypotheses: [
        {
            id: 'fh_database_error',
            hypothesis: 'Database is rejecting writes',
            description: 'Nothing saves — maybe the database connection is failing silently.',
            associatedActions: ['check_database', 'reload_page'],
            plausibilityReason: 'Blank database with successful toast = write failure at storage layer',
        },
        {
            id: 'fh_cors',
            hypothesis: 'CORS is blocking the POST request',
            description: '"Cannot POST" could indicate a CORS preflight failure.',
            associatedActions: ['inspect_network'],
            plausibilityReason: 'POST from different origin often triggers CORS rejection',
        },
        {
            id: 'fh_form_validation',
            hypothesis: 'Form validation is preventing submission',
            description: 'Maybe the data never leaves the frontend.',
            associatedActions: ['read_frontend_code', 'inspect_console'],
            plausibilityReason: 'Null/empty data from frontend would cause backend to silently reject',
        },
    ],

    resolution: {
        requiredActionIds: ['read_backend_routes', 'fix_backend_route'],
        requiredStateFlags: ['route_mismatch_found', 'route_fixed'],
        alternativePaths: [
            ['inspect_network', 'read_backend_routes', 'fix_backend_route'],
        ],
    },

    blindActionThreshold: 5,
    entropyLevel: 1,
    conceptId: 'http-routing',
};

export default LEVEL_1_2;
