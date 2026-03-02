// Vibe2Real — Module 1, Level 1.4
// Failure Archetype: SILENT EXECUTION PATH
// Scenario: Button click does nothing. Event handler exists but a conditional silently blocks.
// Reasoning Error: Assumed code runs without verifying execution path.

import type { ScenarioDefinition } from '../types';

const LEVEL_1_4: ScenarioDefinition = {
    id: '1-4',
    moduleId: 1,
    levelIndex: 3,
    moduleType: 'trace',
    title: 'Dead Code',
    failureArchetype: 'Silent Execution Path',
    twoLineDescription: 'Button exists. Click handler is attached. Nothing happens on click.\nNo errors. No network requests. Complete silence.',

    confusionPhaseEnd: 0.20,
    falseConfidencePhaseEnd: 0.45,
    failurePhaseEnd: 0.65,
    insightPhaseEnd: 0.75,
    dispatchMessage: "the publish button does nothing. client is trying to go live RIGHT NOW",
    narratorScript: {
        "opening": "Button exists. Handler attached. Click fires. Nothing happens. No error. The component is running — but it's checking something that's never true. Find the condition that's always failing.",
        "actions": {
            "inspect_console": "No errors on click. Handler fired. It checks isAdmin before acting — isAdmin is undefined. Undefined is falsy. Action never runs.",
            "inspect_network": "Network request fired. Check the payload.",
            "read_click_handler": "if (isAdmin) { doThing() }. isAdmin is a prop. Parent never passes it. Undefined. Condition never passes.",
            "check_props": "Props don't match expected types.",
            "check_parent_component": "Parent renders <Button onClick={handle} /> — no isAdmin prop passed. The component expects it. Never gets it."
        },
        "resolution": "isAdmin passed from parent. Button works. Silent failures from missing props are invisible without reading what the component actually needs to run."
    },
    momentumTease: "Next case: No import errors. No console output. The page is completely white. Something failed silently.",


    initialAppState: (surface) => `
// UI: Button renders correctly. Click = nothing.

// Component code:
function SubmitButton({ ${surface.variableName}, isAdmin }) {
  const handleClick = () => {
    if (isAdmin) {
      submitToAPI(${surface.variableName});
    }
    // else: silently does nothing
  };
  return <button onClick={handleClick}>Submit</button>;
}

// Parent component:
<SubmitButton ${surface.variableName}={data} />
// Note: isAdmin prop not passed → undefined → falsy

// Console: (empty)
// Network: (no requests)
// No errors anywhere.
  `.trim(),

    actions: [
        {
            id: 'inspect_console',
            label: 'Check Console',
            type: 'inspect_console',
            category: 'investigation',
            informationCostType: 'open_console',
            outcomeTemplate: 'No errors.\nNo logs from handleClick.\nClick handler was called — but produced no output and no network request.',
        },
        {
            id: 'inspect_network',
            label: 'Check Network Tab',
            type: 'inspect_network',
            category: 'investigation',
            informationCostType: 'open_network_tab',
            outcomeTemplate: 'No requests made after button click.\nNetwork tab is empty.\nClick is not resulting in any API call.',
            hypothesis: 'API call not being triggered',
        },
        {
            id: 'read_click_handler',
            label: 'Trace Click Handler Code',
            type: 'read_code',
            category: 'investigation',
            informationCostType: 'read_file',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `// SubmitButton component:\nconst handleClick = () => {\n  if (isAdmin) {\n    submitToAPI(${surface.variableName});\n  }\n  // No else branch — silent if not admin\n};\n\n// isAdmin is checked — what is its current value?`,
            hypothesis: 'Conditional might be blocking execution',
        },
        {
            id: 'check_props',
            label: 'Inspect Component Props',
            type: 'inspect_element',
            category: 'investigation',
            informationCostType: 'inspect_element',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `// SubmitButton props at runtime:\n{\n  "${surface.variableName}": { ...data },\n  "isAdmin": undefined   ← not passed by parent\n}\n\n// isAdmin is undefined → falsy → if(isAdmin) never executes\n// The handler exists. The code runs. The condition blocks it.`,
            hypothesis: 'isAdmin prop might not be set',
        },
        {
            id: 'check_parent_component',
            label: 'Check Parent Component Render',
            type: 'read_code',
            category: 'investigation',
            informationCostType: 'read_file',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `// Parent component:\n<SubmitButton\n  ${surface.variableName}={data}\n  // ← isAdmin never passed\n/>\n\n// isAdmin defaults to undefined in SubmitButton.\n// undefined is falsy. Condition never true. Handler silent.`,
        },
        {
            id: 'reload_page',
            label: 'Reload Page',
            type: 'reload_page',
            category: 'reflexive',
            informationCostType: 'page_reload',
            isBlind: true,
            outcomeTemplate: 'Reloaded. Same behavior. Click still does nothing.',
        },
        {
            id: 'fix_prop',
            label: 'Pass isAdmin Prop from Parent',
            type: 'modify_code',
            category: 'modification',
            informationCostType: 'edit_file',
            advancesResolution: true,
            outcomeTemplate: (surface) =>
                `// Parent updated:\n<SubmitButton\n  ${surface.variableName}={data}\n  isAdmin={currentUser.role === 'admin'}\n/>\n\nButton click now triggers submitToAPI.\nNetwork: POST ${surface.apiEndpoint} → 200 OK\n\n✓ Execution path restored.\n✓ SYSTEM STABILIZED`,
        },
    ],

    falseHypotheses: [
        {
            id: 'fh_event_binding',
            hypothesis: 'Event handler is not properly attached',
            description: 'Click does nothing — maybe onClick is broken or not reaching the handler.',
            associatedActions: ['inspect_console', 'inspect_network'],
            plausibilityReason: 'Silent click with no output = handler never called',
        },
        {
            id: 'fh_api_blocked',
            hypothesis: 'API call is being blocked (firewall/network)',
            description: 'Network tab shows nothing — maybe request is blocked before it starts.',
            associatedActions: ['inspect_network'],
            plausibilityReason: 'Empty network tab after user action = blocked request',
        },
        {
            id: 'fh_state_update',
            hypothesis: 'State update is preventing re-render before API can fire',
            description: 'React state batching might be swallowing the action.',
            associatedActions: ['read_click_handler', 'reload_page'],
            plausibilityReason: 'Silent failure in React often traces to state update ordering',
        },
    ],

    resolution: {
        requiredActionIds: ['check_props', 'fix_prop'],
        requiredStateFlags: ['condition_found', 'prop_fixed'],
        alternativePaths: [
            ['read_click_handler', 'check_parent_component', 'fix_prop'],
            ['inspect_console', 'check_props', 'fix_prop'],
        ],
    },

    blindActionThreshold: 5,
    entropyLevel: 2,
    conceptId: 'event-handlers',
};

export default LEVEL_1_4;
