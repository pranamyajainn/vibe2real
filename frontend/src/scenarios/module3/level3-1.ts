// Vibe2Real — Module 3, Level 3.1
// Failure Archetype: OPERATIONAL BLINDNESS
// Scenario: Server returns 500 after deployment. Logs exist — user must navigate and read them.
// Reasoning Error: Attempted fix without reading operational output.

import type { ScenarioDefinition } from '../types';

const LEVEL_3_1: ScenarioDefinition = {
    id: '3-1',
    moduleId: 3,
    levelIndex: 0,
    moduleType: 'ship',
    title: 'Read the Logs',
    failureArchetype: 'Operational Blindness',
    twoLineDescription: 'Deployment succeeded. Server returns 500 on every request.\nSystem logs already contain the answer — you must find them first.',

    confusionPhaseEnd: 0.15,
    falseConfidencePhaseEnd: 0.35,
    failurePhaseEnd: 0.55,
    insightPhaseEnd: 0.70,

    initialAppState: (surface) => `
$ curl https://yourdomain.com/api
HTTP 500 Internal Server Error
{"error": "Internal server error"}

$ # What do you do first?
  `.trim(),

    actions: [
        {
            id: 'redeploy',
            label: 'Redeploy Application',
            type: 'run_build',
            category: 'reflexive',
            informationCostType: 'deployment',
            isBlind: true,
            outcomeTemplate: 'Deploying... Done. Still 500. Redeployment did not resolve the issue.',
        },
        {
            id: 'list_log_dir',
            label: 'Navigate to Log Directory (ls /var/log)',
            type: 'run_command',
            category: 'investigation',
            informationCostType: 'run_command',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `$ ls /var/log/app/\naccess.log\nerror.log             ← this\n${surface.serviceName}.log\narchive/\n\n$ # error.log is the one to read.`,
            hypothesis: 'Logs might tell us what is actually failing',
        },
        {
            id: 'read_error_logs',
            label: 'Read Error Logs (tail -n 50 /var/log/app/error.log)',
            type: 'read_logs',
            category: 'investigation',
            informationCostType: 'read_file',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `$ tail -n 50 /var/log/app/error.log\n\n[${surface.timestamp}] ERROR: Cannot find module './${surface.serviceName}'\nRequire stack:\n- /app/server.js\n- /app/node_modules/...\n\n[${surface.timestamp}] ERROR: Module not found: ${surface.serviceName}\nNode exiting with code 1\n\n⚠ A required module is missing after deployment.`,
            hypothesis: 'Missing module after deployment',
        },
        {
            id: 'check_installed_deps',
            label: 'List Installed Dependencies',
            type: 'run_command',
            category: 'investigation',
            informationCostType: 'run_command',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `$ ls node_modules | grep ${surface.serviceName}\n(no output)\n\n$ # ${surface.serviceName} is not installed in production!\n$ # node_modules may not have been installed during deployment.`,
        },
        {
            id: 'install_dependencies',
            label: 'Install Dependencies (npm install)',
            type: 'run_command',
            category: 'modification',
            informationCostType: 'install_deps',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `$ npm install\n\nadded 847 packages in 8.4s\n\n$ curl https://yourdomain.com/api\nHTTP 200 OK\n{"status": "ok", "service": "${surface.serviceName}"}\n\n✓ Dependencies installed.\n✓ Server responding correctly.\n✓ SYSTEM STABILIZED`,
        },
        {
            id: 'check_package_json',
            label: 'Read package.json',
            type: 'read_file',
            category: 'investigation',
            informationCostType: 'read_file',
            outcomeTemplate: (surface) =>
                `{\n  "scripts": {\n    "start": "node server.js",\n    "deploy": "git pull && npm start"  ← no npm install step!\n  },\n  "dependencies": {\n    "${surface.serviceName}": "^2.1.0"\n  }\n}\n\n// Deploy script skips npm install — new dep never installed.`,
        },
    ],

    falseHypotheses: [
        {
            id: 'fh_code_bug',
            hypothesis: 'New code introduced a bug in server startup',
            description: '500 right after deployment = something in new code broke.',
            associatedActions: ['redeploy'],
            plausibilityReason: 'Immediate 500 after deploy is almost always a code regression',
        },
        {
            id: 'fh_env_missing',
            hypothesis: 'Production environment variable is missing',
            description: '500 can mean missing env variable causing startup crash.',
            associatedActions: ['check_package_json'],
            plausibilityReason: 'Deployment 500 often traces to missing production env config',
        },
        {
            id: 'fh_database',
            hypothesis: 'Database connection failing in production',
            description: '500 on all requests could be database unavailable.',
            associatedActions: ['redeploy', 'check_package_json'],
            plausibilityReason: 'Server 500 on all endpoints = shared resource failure like database',
        },
    ],

    resolution: {
        requiredActionIds: ['read_error_logs', 'install_dependencies'],
        requiredStateFlags: ['logs_read', 'deps_installed'],
        alternativePaths: [
            ['list_log_dir', 'read_error_logs', 'check_installed_deps', 'install_dependencies'],
        ],
    },

    blindActionThreshold: 5,
    entropyLevel: 3,
    conceptId: 'deployment-logs',
};

export default LEVEL_3_1;
