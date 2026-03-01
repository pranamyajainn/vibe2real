// Vibe2Real — Module 3, Level 3.5
// Failure Archetype: PROCESS CONFUSION
// Scenario: App is down. Multiple processes running — must identify which is the actual server.
// Reasoning Error: Restarted wrong process / restarted blindly without diagnosis.

import type { ScenarioDefinition } from '../types';

const LEVEL_3_5: ScenarioDefinition = {
    id: '3-5',
    moduleId: 3,
    levelIndex: 4,
    moduleType: 'ship',
    title: 'Ghost Processes',
    failureArchetype: 'Process Confusion',
    twoLineDescription: 'App is down. Multiple Node processes are running on the server.\nRestarting one of them had no effect. You restarted the wrong one.',

    confusionPhaseEnd: 0.20,
    falseConfidencePhaseEnd: 0.40,
    failurePhaseEnd: 0.60,
    insightPhaseEnd: 0.72,

    initialAppState: (surface) => `
$ curl http://server:${surface.portNumber}/health
curl: (7) Failed to connect: Connection refused

$ # App is down. Port ${surface.portNumber} is not accepting connections.
$ # What's running? What should be?
  `.trim(),

    actions: [
        {
            id: 'blind_restart',
            label: 'Restart First Process You See',
            type: 'run_command',
            category: 'reflexive',
            informationCostType: 'restart_server',
            isBlind: true,
            outcomeTemplate: (surface) =>
                `$ pkill -f worker.js\nProcess 14823 killed.\n\n$ curl http://server:${surface.portNumber}/health\ncurl: (7) Failed to connect.\n\nStill down. You restarted the background worker, not the API server.`,
        },
        {
            id: 'list_processes',
            label: 'List All Running Processes (ps aux | grep node)',
            type: 'run_command',
            category: 'investigation',
            informationCostType: 'run_command',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `$ ps aux | grep node\nUSER       PID  %CPU  CMD\nroot     ${surface.processId + 1}  0.0  node worker.js         ← background worker\nroot     ${surface.processId + 2}  0.0  node cron.js           ← cron jobs\nroot     ${surface.processId + 3}  0.0  node server.js         ← API server (maybe?)\nroot     ${surface.processId + 4}  0.0  node ${surface.serviceName}.js  ← ???\n\n$ # 4 node processes. Which one is the API server?`,
            hypothesis: 'Multiple processes — need to identify which is the API',
        },
        {
            id: 'check_process_ports',
            label: 'Check Which Process Owns Which Port (lsof -i)',
            type: 'run_command',
            category: 'investigation',
            informationCostType: 'run_command',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `$ lsof -i :${surface.portNumber}\n(no output — port not in use)\n\n$ lsof -i -P -n | grep LISTEN\nnode    ${surface.processId + 3}  root  ${surface.portNumber - 1}->LISTEN   ← server.js on WRONG port\nnode    ${surface.processId + 4}  root  8080->LISTEN   ← service on different port\n\n$ # server.js is bound to port ${surface.portNumber - 1}, not ${surface.portNumber}!\n$ # Config was changed but server not restarted with new config.`,
            hypothesis: 'Server might be running on wrong port after config change',
        },
        {
            id: 'read_process_config',
            label: 'Read Server Config File',
            type: 'read_file',
            category: 'investigation',
            informationCostType: 'read_file',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `// server.config.js:\nmodule.exports = {\n  port: ${surface.portNumber},  ← config says ${surface.portNumber}\n};\n\n// But process is running on ${surface.portNumber - 1}.\n// Server was started before config was updated.\n// Must restart server.js to pick up new port.`,
        },
        {
            id: 'restart_correct_process',
            label: 'Kill and Restart Correct Server Process',
            type: 'run_command',
            category: 'modification',
            informationCostType: 'restart_server',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `$ kill -9 ${surface.processId + 3}\nProcess ${surface.processId + 3} terminated.\n\n$ node server.js &\n[1] ${surface.processId + 100}\nServer listening on port ${surface.portNumber}\n\n$ curl http://server:${surface.portNumber}/health\n{"status": "ok", "uptime": 2}\n\n✓ Correct process restarted on correct port.\n✓ SYSTEM STABILIZED`,
        },
        {
            id: 'check_logs_per_process',
            label: 'Read Logs for Individual Process',
            type: 'read_logs',
            category: 'investigation',
            informationCostType: 'read_file',
            outcomeTemplate: (surface) =>
                `// server.js logs:\n[${surface.timestamp}] Server starting...\n[${surface.timestamp}] Listening on port ${surface.portNumber - 1}  ← started with old config\n\n// config was updated AFTER server started.\n// Server did not reload config — still using old port.`,
        },
    ],

    falseHypotheses: [
        {
            id: 'fh_app_crashed',
            hypothesis: 'Application crashed and needs restart',
            description: 'Connection refused = process crashed or stopped.',
            associatedActions: ['blind_restart'],
            plausibilityReason: 'Port not accepting connections = process not running',
        },
        {
            id: 'fh_firewall',
            hypothesis: 'Firewall blocking port',
            description: 'Server might be running but port is blocked by firewall.',
            associatedActions: ['list_processes'],
            plausibilityReason: 'Connection refused can come from network-level firewall rules',
        },
        {
            id: 'fh_wrong_port_config',
            hypothesis: 'Config file has wrong port number',
            description: 'If port changed recently, config file might have typo.',
            associatedActions: ['read_process_config'],
            plausibilityReason: 'Port mismatches often trace to config file errors',
        },
    ],

    resolution: {
        requiredActionIds: ['list_processes', 'check_process_ports', 'restart_correct_process'],
        requiredStateFlags: ['processes_identified', 'correct_process_found', 'server_restarted'],
        alternativePaths: [
            ['list_processes', 'check_logs_per_process', 'restart_correct_process'],
        ],
    },

    blindActionThreshold: 3,
    entropyLevel: 3,
    conceptId: 'processes',
};

export default LEVEL_3_5;
