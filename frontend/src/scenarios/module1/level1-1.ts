// Vibe2Real — Module 1, Level 1.1
// Failure Archetype: INVISIBLE ASSUMPTION
// Scenario: Everything looks correct — app works locally, fails in deployed state.
//           Missing .env variable loaded only in production.
// Reasoning Error: Trusted environment parity without verification.

import type { ScenarioDefinition } from '../types';
import { injectEntropy } from '@/engine/scenarioSeed';

const LEVEL_1_1: ScenarioDefinition = {
    id: '1-1',
    moduleId: 1,
    levelIndex: 0,
    moduleType: 'trace',
    title: 'The Invisible Assumption',
    failureArchetype: 'Environment Parity Failure',
    twoLineDescription: 'App runs perfectly locally. Production deployment returns blank page.\nEverything you can see looks correct.',

    confusionPhaseEnd: 0.20,
    falseConfidencePhaseEnd: 0.40,
    failurePhaseEnd: 0.65,
    insightPhaseEnd: 0.75,
    dispatchMessage: "hey why is the site completely blank on my end?? client demo is in 20 mins",
    narratorScript: {
        "opening": "Blank page in production, works perfectly local. Classic. The browser saw something it didn't like the moment it loaded — start by asking it what.",
        "actions": {
            "inspect_console": "TypeError: Failed to fetch. The app tried to call an API URL that came back as undefined. That URL was never set in this environment.",
            "inspect_network": "GET undefined/api/users. The request went to the literal word 'undefined'. The variable holding the API URL is missing in production.",
            "check_env": "Local has VITE_API_BASE. Production has nothing. The app works locally because your .env file is there. Production never got it.",
            "read_code": "Code reads from process.env.VITE_API_BASE. That variable doesn't exist in production. URL becomes undefined. You know what's missing.",
            "check_backend_code": "Backend is running correctly. The problem is not in the backend code."
        },
        "resolution": "Environment variable set. The app knows where its API lives now. This is the most common production mystery — because nobody checks the environment."
    },
    momentumTease: "Next case: A form submitted successfully. A success message appeared. The database is empty. Something swallowed the data between the browser and the server.",


    initialAppState: (surface) => `
// App running at http://localhost:${surface.portNumber}/
// Status: LOCAL ✓  PRODUCTION ✗

// Frontend code (App.tsx):
const API_BASE = process.env.${surface.envVarName};

async function fetchData() {
  const res = await fetch(\`\${API_BASE}${surface.apiEndpoint}\`);
  return res.json();
}

// Console output (PRODUCTION):
TypeError: Failed to fetch
    at fetchData (App.tsx:8)
    at useEffect (App.tsx:14)

// Network Panel (PRODUCTION):
GET undefined${surface.apiEndpoint}  →  ERR_NAME_NOT_RESOLVED

// Local .env:
${surface.envVarName}=http://localhost:3001

// Production environment:
(no variables loaded)
  `.trim(),

    actions: [
        {
            id: 'inspect_console',
            label: 'Inspect Console',
            type: 'inspect_console',
            category: 'investigation',
            informationCostType: 'open_console',
            outcomeTemplate: (surface) =>
                `TypeError: Failed to fetch\n    at fetchData (App.tsx:8)\n\nAPI_BASE resolves to: undefined\nFetch URL: undefined${surface.apiEndpoint}`,
            hypothesis: 'API call is failing at network level',
        },
        {
            id: 'inspect_network',
            label: 'Check Network Tab',
            type: 'inspect_network',
            category: 'investigation',
            informationCostType: 'open_network_tab',
            outcomeTemplate: (surface) =>
                `GET undefined${surface.apiEndpoint}\nStatus: (failed)\nType: fetch\nError: ERR_NAME_NOT_RESOLVED\n\nRequest URL: undefined${surface.apiEndpoint}\nNo request headers sent.`,
            hypothesis: 'API endpoint might be wrong',
        },
        {
            id: 'check_env',
            label: 'Check Environment Variables',
            type: 'check_env',
            category: 'investigation',
            informationCostType: 'env_var_check',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `LOCAL .env:\n${surface.envVarName}=http://localhost:3001\n\nPRODUCTION environment:\n(no variables found)\n\n⚠ ${surface.envVarName} is not set in the production environment.`,
            hypothesis: 'Environment variables might differ between environments',
        },
        {
            id: 'read_code',
            label: 'Read App Source Code',
            type: 'read_code',
            category: 'investigation',
            informationCostType: 'read_file',
            outcomeTemplate: (surface) =>
                `// App.tsx\nconst API_BASE = process.env.${surface.envVarName};\n\nasync function fetchData() {\n  const res = await fetch(\`\${API_BASE}${surface.apiEndpoint}\`);\n  return res.json();\n}\n\n// Note: process.env.${surface.envVarName} will be undefined\n// if the variable is not set in the runtime environment.`,
        },
        {
            id: 'reload_page',
            label: 'Reload Page',
            type: 'reload_page',
            category: 'reflexive',
            informationCostType: 'page_reload',
            isBlind: true,
            outcomeTemplate: 'Page reloaded. Same blank screen. Error unchanged.',
        },
        {
            id: 'check_backend_code',
            label: 'Check Backend Routes',
            type: 'read_code',
            category: 'investigation',
            informationCostType: 'read_file',
            outcomeTemplate: (surface) =>
                `// Backend route: ${surface.apiEndpoint}\napp.get('${surface.apiEndpoint}', (req, res) => {\n  res.json({ data: records });\n});\n\n// Backend is running correctly.\n// Requests to the correct URL succeed.\n// The problem is not in the backend code.`,
        },
        {
            id: 'restart_server',
            label: 'Restart Dev Server',
            type: 'restart_server',
            category: 'reflexive',
            informationCostType: 'restart_server',
            isBlind: true,
            outcomeTemplate: 'Server restarted. Frontend still shows blank page in production. Error unchanged.',
        },
        {
            id: 'set_env_production',
            label: 'Set ENV Variable in Production',
            type: 'modify_env',
            category: 'modification',
            informationCostType: 'edit_file',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `Production environment updated:\n${surface.envVarName}=https://api.yourdomain.com\n\nDeploying with new environment configuration...\nBuild complete. Production redeployed.\n\n✓ App loads correctly in production.\n✓ Data fetched from ${surface.apiEndpoint}\n✓ SYSTEM STABILIZED`,
        },
    ],

    falseHypotheses: [
        {
            id: 'fh_backend_down',
            hypothesis: 'Backend server is down in production',
            description: 'The console shows "Failed to fetch" which commonly signals the server is unreachable.',
            associatedActions: ['restart_server', 'check_backend_code'],
            plausibilityReason: 'ERR_NAME_NOT_RESOLVED looks like a DNS/connectivity issue',
        },
        {
            id: 'fh_cors',
            hypothesis: 'CORS is blocking the request',
            description: '"Failed to fetch" can also indicate a CORS rejection.',
            associatedActions: ['inspect_network', 'check_backend_code'],
            plausibilityReason: 'Production origin differs from localhost, so CORS seems plausible',
        },
        {
            id: 'fh_wrong_endpoint',
            hypothesis: 'API endpoint path is incorrect',
            description: 'The network tab shows an unusual URL — maybe the path is wrong.',
            associatedActions: ['inspect_network', 'read_code'],
            plausibilityReason: 'The URL in the network tab contains "undefined" which looks like a path error',
        },
    ],

    resolution: {
        requiredActionIds: ['check_env', 'set_env_production'],
        requiredStateFlags: ['env_var_found_missing', 'env_var_set'],
        alternativePaths: [
            ['inspect_console', 'check_env', 'set_env_production'],
            ['inspect_network', 'check_env', 'set_env_production'],
        ],
    },

    blindActionThreshold: 5,
    entropyLevel: 1,
    conceptId: 'env-vars',
};

export function getLevel11(surface: { portNumber: number; apiEndpoint: string; envVarName: string; serviceName: string; errorCode: string; variableName: string; timestamp: string; processId: number }): ScenarioDefinition & { renderedInitialState: string } {
    const logs = LEVEL_1_1.initialAppState(surface).split('\n');
    const entropyLogs = injectEntropy(logs, LEVEL_1_1.entropyLevel);
    return {
        ...LEVEL_1_1,
        renderedInitialState: entropyLogs.join('\n'),
    };
}

export default LEVEL_1_1;
