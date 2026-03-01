// Vibe2Real — Module 2, Level 2.4
// Failure Archetype: MISLEADING SIGNAL
// Scenario: CORS error appears. Obvious fix attempted — real cause is malformed header from backend.
// Reasoning Error: Trusted the error message label without investigating the actual payload.

import type { ScenarioDefinition } from '../types';

const LEVEL_2_4: ScenarioDefinition = {
    id: '2-4',
    moduleId: 2,
    levelIndex: 3,
    moduleType: 'read',
    title: 'The Decoy',
    failureArchetype: 'Misleading Signal',
    twoLineDescription: 'Console shows CORS error. Adding CORS header doesn\'t fix it.\nThe error label is real. The cause it implies is not.',

    confusionPhaseEnd: 0.20,
    falseConfidencePhaseEnd: 0.50,
    failurePhaseEnd: 0.65,
    insightPhaseEnd: 0.75,

    initialAppState: (surface) => `
// Console:
Access to fetch at '${surface.apiEndpoint}' from origin 'http://localhost:3000'
has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present.

// At first glance: missing CORS header on backend.
// You add cors() middleware. Restart. Same error.

// Backend (after CORS fix attempt):
app.use(cors({ origin: '*' }));  ← already added

// Network Response Headers (check carefully):
HTTP/1.1 500 Internal Server Error
Access-Control-Allow-Origin: *  ← header IS present
Content-Type: text/html          ← not JSON

// Response Body:
<html><body>Internal Server Error: Cannot set headers after they are sent</body></html>

// The CORS error is real. The cause is not CORS.
  `.trim(),

    actions: [
        {
            id: 'read_console_error',
            label: 'Read the CORS Error',
            type: 'inspect_console',
            category: 'investigation',
            informationCostType: 'open_console',
            outcomeTemplate: (surface) =>
                `CORS error: No 'Access-Control-Allow-Origin' header present.\n\nBut wait — you already added CORS middleware.\nIf the header is missing despite middleware, something is preventing the response from being sent normally.`,
            hypothesis: 'CORS policy blocking request',
        },
        {
            id: 'add_cors_header',
            label: 'Add CORS Middleware',
            type: 'modify_code',
            category: 'reflexive',
            informationCostType: 'edit_file',
            isBlind: true,
            outcomeTemplate: 'CORS middleware added. Restarted. Same CORS error. The problem is not a missing CORS policy.',
        },
        {
            id: 'inspect_actual_response',
            label: 'Inspect Full Network Response',
            type: 'inspect_network',
            category: 'investigation',
            informationCostType: 'open_network_tab',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `GET ${surface.apiEndpoint}\nStatus: 500 Internal Server Error\n\nResponse Headers:\n  Access-Control-Allow-Origin: *  ← CORS header IS set\n  Content-Type: text/html          ← NOT json\n\nResponse Body (preview):\n  <html>Internal Server Error: Cannot set headers after they are sent</html>\n\n⚠ The CORS header is present. The 500 error is hiding the CORS header in the browser!\n   Firefox/Chrome only show CORS errors when the header is MISSING due to a crash.`,
            hypothesis: 'Server is crashing BEFORE sending headers — CORS error is a side effect',
        },
        {
            id: 'read_backend_route',
            label: 'Read Backend Route Code',
            type: 'read_code',
            category: 'investigation',
            informationCostType: 'read_file',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `// Backend route:\napp.get('${surface.apiEndpoint}', async (req, res) => {\n  const data = await db.query('SELECT * FROM items');\n  res.json(data);\n  res.status(200);  // ← ERROR: headers already sent by res.json()\n});\n\n// res.json() sends the response AND headers.\n// Calling res.status() afterward throws an error.\n// That error crashes the handler mid-response.\n// CORS middleware cannot apply its header to the crashed response.`,
        },
        {
            id: 'fix_header_order',
            label: 'Fix Header Order in Route Handler',
            type: 'modify_code',
            category: 'modification',
            informationCostType: 'edit_file',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `// Updated:\napp.get('${surface.apiEndpoint}', async (req, res) => {\n  const data = await db.query('SELECT * FROM items');\n  res.status(200).json(data);  // chain: status before json\n});\n\nRequest succeeds:\nGET ${surface.apiEndpoint} → 200 OK\nCORS error gone.\nData received correctly.\n\n✓ Response headers sent correctly.\n✓ SYSTEM STABILIZED`,
        },
    ],

    falseHypotheses: [
        {
            id: 'fh_cors_missing',
            hypothesis: 'CORS header is missing from backend response',
            description: 'Error clearly says no Access-Control-Allow-Origin header.',
            associatedActions: ['add_cors_header', 'read_console_error'],
            plausibilityReason: 'CORS error message directly names the missing header',
        },
        {
            id: 'fh_origin_mismatch',
            hypothesis: 'CORS origin whitelist does not include localhost',
            description: 'Maybe only production domain is allowed.',
            associatedActions: ['add_cors_header'],
            plausibilityReason: 'CORS often fails due to specific origin mismatch, not general policy',
        },
        {
            id: 'fh_preflight',
            hypothesis: 'OPTIONS preflight request failing',
            description: 'CORS preflight check might not be handled on backend.',
            associatedActions: ['inspect_actual_response'],
            plausibilityReason: 'POST and PUT requests trigger CORS preflight which often fails separately',
        },
    ],

    resolution: {
        requiredActionIds: ['inspect_actual_response', 'read_backend_route'],
        requiredStateFlags: ['real_cause_found'],
        alternativePaths: [
            ['inspect_actual_response', 'fix_header_order'],
            ['inspect_actual_response', 'read_backend_route', 'fix_header_order'],
        ],
    },

    blindActionThreshold: 4,
    entropyLevel: 2,
    conceptId: 'cors',
};

export default LEVEL_2_4;
