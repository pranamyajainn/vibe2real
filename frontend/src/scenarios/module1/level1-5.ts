// Vibe2Real — Module 1, Level 1.5
// Failure Archetype: DEPENDENCY MISMATCH
// Scenario: Page renders blank. Component imports succeed but a dependency version
//           mismatch produces silent failure.
// Reasoning Error: Trusted dependency chain without version inspection.

import type { ScenarioDefinition } from '../types';

const LEVEL_1_5: ScenarioDefinition = {
    id: '1-5',
    moduleId: 1,
    levelIndex: 4,
    moduleType: 'trace',
    title: 'Version Drift',
    failureArchetype: 'Dependency Mismatch',
    twoLineDescription: 'Component imports with no errors. Page renders blank white screen.\nAll code looks correct. The problem is invisible to the code.',

    confusionPhaseEnd: 0.20,
    falseConfidencePhaseEnd: 0.40,
    failurePhaseEnd: 0.65,
    insightPhaseEnd: 0.75,

    initialAppState: (surface) => `
// Blank white page. No errors in code.

// package.json:
{
  "dependencies": {
    "react": "^19.0.0",
    "${surface.serviceName}-ui": "^3.0.0"  ← requires React 18
  }
}

// node_modules/${surface.serviceName}-ui/package.json:
{
  "peerDependencies": {
    "react": ">=16.0.0 <19.0.0"  ← does NOT support React 19
  }
}

// Component.tsx:
import { DataTable } from '${surface.serviceName}-ui';
export default function Page() {
  return <DataTable data={records} />;
}

// Console: (empty, no errors)
// Network: (page loads, no API errors)
// Rendered DOM: <div id="root"></div> — empty
  `.trim(),

    actions: [
        {
            id: 'inspect_console',
            label: 'Check Console',
            type: 'inspect_console',
            category: 'investigation',
            informationCostType: 'open_console',
            outcomeTemplate: (surface) =>
                `Warning: React version mismatch detected in ${surface.serviceName}-ui\nExpected: >=16.0.0 <19.0.0\nReceived: 19.2.3\n\nComponent may not render correctly.\n\n⚠ This warning treats as non-fatal — page initialization continues.`,
            hypothesis: 'Dependency version incompatibility',
        },
        {
            id: 'inspect_element',
            label: 'Inspect DOM Structure',
            type: 'inspect_element',
            category: 'investigation',
            informationCostType: 'inspect_element',
            outcomeTemplate: '<div id="root">\n  <!-- empty -->\n</div>\n\nRoot mounted but nothing rendered inside.\nComponent returned null or crashed silently during render.',
        },
        {
            id: 'read_package_json',
            label: 'Read package.json Dependencies',
            type: 'read_code',
            category: 'investigation',
            informationCostType: 'read_file',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `// package.json:\n"react": "^19.0.0"\n"${surface.serviceName}-ui": "^3.0.0"\n\n// Check peer dependency requirements of ${surface.serviceName}-ui`,
            hypothesis: 'Dependency version might be incompatible',
        },
        {
            id: 'check_peer_deps',
            label: 'Inspect Dependency Peer Requirements',
            type: 'read_file',
            category: 'investigation',
            informationCostType: 'read_file',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `// node_modules/${surface.serviceName}-ui/package.json:\n"peerDependencies": {\n  "react": ">=16.0.0 <19.0.0"\n}\n\n// Installed React: 19.2.3\n// Required range: >=16.0.0 <19.0.0\n// React 19 is OUTSIDE the supported range.\n// Silent render failure caused by hooks API differences.`,
        },
        {
            id: 'reload_page',
            label: 'Reload Page',
            type: 'reload_page',
            category: 'reflexive',
            informationCostType: 'page_reload',
            isBlind: true,
            outcomeTemplate: 'Reloaded. Same blank page. Problem is not transient.',
        },
        {
            id: 'check_component_code',
            label: 'Read Component Source',
            type: 'read_code',
            category: 'investigation',
            informationCostType: 'read_file',
            outcomeTemplate: (surface) =>
                `// Page.tsx:\nimport { DataTable } from '${surface.serviceName}-ui';\nexport default function Page() {\n  return <DataTable data={records} />;\n}\n\n// Code is correct. DataTable import succeeds.\n// The rendering failure is inside the library, not your code.`,
        },
        {
            id: 'downgrade_react',
            label: 'Downgrade React to Compatible Version',
            type: 'modify_code',
            category: 'modification',
            informationCostType: 'edit_file',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `// package.json updated:\n"react": "^18.3.0"  ← within peer dep range\n\nRunning npm install...\nReact downgraded to 18.3.1\n\nApp reloaded.\nDataTable renders correctly.\nPage content visible.\n\n✓ Dependency mismatch resolved.\n✓ SYSTEM STABILIZED`,
        },
        {
            id: 'upgrade_library',
            label: 'Upgrade Library to React 19 Compatible Version',
            type: 'modify_code',
            category: 'modification',
            informationCostType: 'install_deps',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `Checking ${surface.serviceName}-ui latest version...\n${surface.serviceName}-ui@4.0.0 — supports React >=18.0.0 <20.0.0\n\nnpm install ${surface.serviceName}-ui@4.0.0\nInstalled. App reloaded.\nDataTable renders correctly.\n\n✓ Dependency resolved.\n✓ SYSTEM STABILIZED`,
        },
    ],

    falseHypotheses: [
        {
            id: 'fh_data_empty',
            hypothesis: 'Records array is empty or undefined — nothing to render',
            description: 'Blank page with DataTable often means no data is passed.',
            associatedActions: ['inspect_console', 'inspect_element'],
            plausibilityReason: 'Table component shows nothing when data prop is empty',
        },
        {
            id: 'fh_css_hidden',
            hypothesis: 'CSS is hiding the component (visibility/display issue)',
            description: 'Blank page could be a styling problem — component renders but is invisible.',
            associatedActions: ['inspect_element', 'reload_page'],
            plausibilityReason: 'White screen with no errors often indicates layout/CSS issue',
        },
        {
            id: 'fh_route_wrong',
            hypothesis: 'Wrong page is being rendered (routing issue)',
            description: 'Maybe navigation is pointing to a blank page component.',
            associatedActions: ['check_component_code', 'reload_page'],
            plausibilityReason: 'Blank page with successful load can mean wrong route match',
        },
    ],

    resolution: {
        requiredActionIds: ['check_peer_deps'],
        requiredStateFlags: ['version_mismatch_found'],
        alternativePaths: [
            ['read_package_json', 'check_peer_deps', 'downgrade_react'],
            ['inspect_console', 'check_peer_deps', 'upgrade_library'],
        ],
    },

    blindActionThreshold: 5,
    entropyLevel: 2,
    conceptId: 'package-versions',
};

export default LEVEL_1_5;
