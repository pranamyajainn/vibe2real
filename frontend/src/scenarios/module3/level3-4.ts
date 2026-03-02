// Vibe2Real — Module 3, Level 3.4
// Failure Archetype: ENVIRONMENT MISMATCH
// Scenario: Build succeeds locally, deployment fails. Missing build step for production.
// Reasoning Error: Assumed build environment matches development.

import type { ScenarioDefinition } from '../types';

const LEVEL_3_4: ScenarioDefinition = {
    id: '3-4',
    moduleId: 3,
    levelIndex: 3,
    moduleType: 'ship',
    title: 'Works On My Machine',
    failureArchetype: 'Environment Mismatch',
    twoLineDescription: 'npm run build passes locally. Production deployment fails every time.\nThe build step differences between environments are invisible until you look.',

    confusionPhaseEnd: 0.20,
    falseConfidencePhaseEnd: 0.45,
    failurePhaseEnd: 0.65,
    insightPhaseEnd: 0.75,
    dispatchMessage: "build works on your machine but fails every time in CI. release is delayed",
    narratorScript: {
        "opening": "Builds locally. Fails in production. Every time. Same code. The difference is in how each environment resolves paths — and that lives in the config, not the code.",
        "actions": {
            "read_error_log": "Code imports from @components/Button. Alias works locally via webpack config. Production may not have that config.",
            "compare_configs": "No relevant env vars. Build configuration issue — the alias resolving @components doesn't exist in the production build.",
            "check_next_config": "next.config.js in production is missing the webpack alias block. It was never committed to the repo."
        },
        "resolution": "Webpack alias added to next.config.js. Path aliases that work locally but fail in CI always mean the config wasn't committed or wasn't applied to the production build."
    },
    momentumTease: "Next case: App is completely down. Multiple processes running. Redeploying won't fix this one.",


    initialAppState: (surface) => `
# Deployment log (CI/CD):
[10:14:22] Running npm run build...
[10:14:33] Error: Cannot find module '@/${surface.serviceName}/types'
[10:14:33] Build failed.

# Local machine:
$ npm run build  ← SUCCESS
$ # No errors locally. Works perfectly.

# CI/CD environment variables:
NODE_ENV=production
CI=true
# (no other variables set)

# Local environment:
NODE_ENV=development  
PATH_ALIASES=true     ← set locally only!
  `.trim(),

    actions: [
        {
            id: 'redeploy',
            label: 'Retry Deployment',
            type: 'run_build',
            category: 'reflexive',
            informationCostType: 'deployment',
            isBlind: true,
            outcomeTemplate: 'Redeploying... Same error: Cannot find module. Retry did not help.',
        },
        {
            id: 'read_error_log',
            label: 'Read Full Deployment Error Log',
            type: 'read_logs',
            category: 'investigation',
            informationCostType: 'read_file',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `[10:14:33] Error: Cannot find module '@/${surface.serviceName}/types'\n    at Function.Module._resolveFilename\n    at Object.<anonymous> (/app/src/utils.ts:3)\n\n// Module resolution failing for: @/${surface.serviceName}/types\n// This is a TypeScript path alias — may require explicit tsconfig resolution.`,
            hypothesis: 'Module resolution failing — path alias not configured in CI',
        },
        {
            id: 'compare_configs',
            label: 'Compare Local vs CI Build Configuration',
            type: 'read_file',
            category: 'investigation',
            informationCostType: 'read_file',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `// Local tsconfig.json:\n{\n  "compilerOptions": {\n    "paths": {\n      "@/${surface.serviceName}/*": ["./src/${surface.serviceName}/*"]  ← alias defined\n    }\n  }\n}\n\n// CI runs next build (not tsc)\n// Next.js does NOT respect tsconfig paths by default\n// Requires next.config.js experimental.modularizeImports or webpack alias`,
        },
        {
            id: 'check_next_config',
            label: 'Read next.config.js',
            type: 'read_file',
            category: 'investigation',
            informationCostType: 'read_file',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `// next.config.js:\nmodule.exports = {\n  // no webpack alias config\n};\n\n// Missing: webpack alias for @/${surface.serviceName} path\n// Local IDE resolves tsconfig paths — build tool does not.\n// CI build uses webpack, not tsc directly.`,
        },
        {
            id: 'fix_next_config',
            label: 'Add Webpack Alias to next.config.js',
            type: 'modify_code',
            category: 'modification',
            informationCostType: 'edit_file',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `// next.config.js updated:\nconst path = require('path');\nmodule.exports = {\n  webpack: (config) => {\n    config.resolve.alias['@/${surface.serviceName}'] =\n      path.resolve(__dirname, 'src/${surface.serviceName}');\n    return config;\n  }\n};\n\nDeploying...\n[10:21:44] Build succeeded.\n[10:21:58] Deployed to production.\n\n✓ Path resolution fixed in CI environment.\n✓ SYSTEM STABILIZED`,
        },
    ],

    falseHypotheses: [
        {
            id: 'fh_missing_dep',
            hypothesis: 'Dependency missing in production package.json',
            description: 'Cannot find module = package not installed in prod.',
            associatedActions: ['redeploy', 'read_error_log'],
            plausibilityReason: 'Module not found is the classic missing dependency error',
        },
        {
            id: 'fh_wrong_node',
            hypothesis: 'Node.js version mismatch between local and CI',
            description: 'Different Node versions resolve modules differently.',
            associatedActions: ['compare_configs', 'redeploy'],
            plausibilityReason: 'Works locally but not in CI = environment difference, often Node version',
        },
        {
            id: 'fh_import_path',
            hypothesis: 'Incorrect import path in source code',
            description: 'Developer typed the wrong path — needs to be corrected.',
            associatedActions: ['read_error_log'],
            plausibilityReason: 'Module resolution error means the import path has a typo',
        },
    ],

    resolution: {
        requiredActionIds: ['read_error_log', 'fix_next_config'],
        requiredStateFlags: ['env_diff_found', 'config_fixed'],
        alternativePaths: [
            ['read_error_log', 'compare_configs', 'fix_next_config'],
            ['read_error_log', 'check_next_config', 'fix_next_config'],
        ],
    },

    blindActionThreshold: 4,
    entropyLevel: 2,
    conceptId: 'build-config',
};

export default LEVEL_3_4;
