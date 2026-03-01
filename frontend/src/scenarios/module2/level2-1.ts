// Vibe2Real — Module 2, Level 2.1
// Failure Archetype: SIGNAL IGNORED
// Scenario: App crashes on load. Error is visible in console — user must read before acting.
// Reasoning Error: Modified code before reading the error message.

import type { ScenarioDefinition } from '../types';

const LEVEL_2_1: ScenarioDefinition = {
    id: '2-1',
    moduleId: 2,
    levelIndex: 0,
    moduleType: 'read',
    title: 'Read Before You Run',
    failureArchetype: 'Signal Ignored',
    twoLineDescription: 'App crashes immediately on page load. Error message exists.\nThe system already told you exactly what is wrong.',

    confusionPhaseEnd: 0.15,
    falseConfidencePhaseEnd: 0.35,
    failurePhaseEnd: 0.55,
    insightPhaseEnd: 0.70,

    initialAppState: (surface) => `
// Console (PRODUCTION):
Uncaught TypeError: Cannot read properties of undefined (reading 'map')
    at ${surface.variableName}.map (DataList.tsx:12)
    at DataList (DataList.tsx:10)

// DataList.tsx:
export function DataList({ items }) {
  return (
    <ul>
      {items.map(item => <li key={item.id}>{item.name}</li>)}
    </ul>
  );
}

// Usage in parent:
<DataList />  ← items prop not passed

// App crashes on load. Refresh also crashes.
// Network: no failed requests.
  `.trim(),

    actions: [
        {
            id: 'read_console_error',
            label: 'Read Console Error',
            type: 'inspect_console',
            category: 'investigation',
            informationCostType: 'open_console',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `Uncaught TypeError: Cannot read properties of undefined (reading 'map')\n    at ${surface.variableName}.map (DataList.tsx:12)\n\n▶ Line 12: {items.map(item => ...)}\n▶ items is undefined at time of render\n▶ Cannot call .map() on undefined`,
            hypothesis: 'items prop is undefined when component renders',
        },
        {
            id: 'inspect_network',
            label: 'Check Network Tab',
            type: 'inspect_network',
            category: 'investigation',
            informationCostType: 'open_network_tab',
            outcomeTemplate: 'No failed requests.\nNo API errors.\nFrontend crash before any network activity.',
        },
        {
            id: 'read_component_code',
            label: 'Read DataList Component',
            type: 'read_code',
            category: 'investigation',
            informationCostType: 'read_file',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `// DataList.tsx:\nexport function DataList({ items }) {\n  return (\n    <ul>\n      {items.map(item => <li key={item.id}>{item.name}</li>)}\n    </ul>\n  );\n}\n\n// items has no default value.\n// If parent doesn't pass items, it is undefined.\n// .map() on undefined → TypeError`,
        },
        {
            id: 'read_parent_usage',
            label: 'Check Parent Component Usage',
            type: 'read_code',
            category: 'investigation',
            informationCostType: 'read_file',
            advancesResolution: true,
            outcomeTemplate: `// Parent component:\n<DataList />\n// ← items prop not passed at all\n\n// Component receives: { items: undefined }\n// First render: crash.`,
        },
        {
            id: 'reload_page',
            label: 'Reload Page',
            type: 'reload_page',
            category: 'reflexive',
            informationCostType: 'page_reload',
            isBlind: true,
            outcomeTemplate: 'Same crash on reload. TypeError: Cannot read properties of undefined. Same stack trace.',
        },
        {
            id: 'modify_random',
            label: 'Modify CSS (Centering Fix)',
            type: 'modify_code',
            category: 'reflexive',
            informationCostType: 'edit_file',
            isBlind: true,
            outcomeTemplate: 'CSS updated. App still crashes. Crash is not visual/layout related.',
        },
        {
            id: 'fix_default_prop',
            label: 'Add Default Value for items Prop',
            type: 'modify_code',
            category: 'modification',
            informationCostType: 'edit_file',
            advancesResolution: true,
            outcomeTemplate: `// DataList.tsx updated:\nexport function DataList({ items = [] }) {\n  return (\n    <ul>\n      {items.map(item => <li key={item.id}>{item.name}</li>)}\n    </ul>\n  );\n}\n\nPage loads correctly.\nEmpty list renders — no crash.\n\n✓ Component defensive coding applied.\n✓ SYSTEM STABILIZED`,
        },
        {
            id: 'pass_items_prop',
            label: 'Pass items Prop from Parent',
            type: 'modify_code',
            category: 'modification',
            informationCostType: 'edit_file',
            advancesResolution: true,
            outcomeTemplate: `// Parent updated:\n<DataList items={fetchedItems} />\n\nPage loads correctly.\nList renders with data.\n\n✓ Missing prop provided.\n✓ SYSTEM STABILIZED`,
        },
    ],

    falseHypotheses: [
        {
            id: 'fh_api_failed',
            hypothesis: 'API failed to load data — component received empty response',
            description: 'Crash on load often means data fetch failed midway.',
            associatedActions: ['inspect_network', 'reload_page'],
            plausibilityReason: 'Undefined data at render = async fetch failed',
        },
        {
            id: 'fh_import_broken',
            hypothesis: 'Component import is broken — module not found',
            description: 'App crash could mean the component file failed to import.',
            associatedActions: ['read_component_code'],
            plausibilityReason: 'Crash on app load sometimes traces to import errors',
        },
        {
            id: 'fh_rendering_bug',
            hypothesis: 'Rendering cycle infinite loop causing crash',
            description: 'Crash without network error = rendering logic problem.',
            associatedActions: ['reload_page', 'inspect_network'],
            plausibilityReason: 'React can crash from useEffect infinite loops',
        },
    ],

    resolution: {
        requiredActionIds: ['read_console_error'],
        requiredStateFlags: ['error_read'],
        alternativePaths: [
            ['read_console_error', 'read_component_code', 'fix_default_prop'],
            ['read_console_error', 'read_parent_usage', 'pass_items_prop'],
        ],
    },

    blindActionThreshold: 4,
    entropyLevel: 1,
    conceptId: 'console-errors',
};

export default LEVEL_2_1;
