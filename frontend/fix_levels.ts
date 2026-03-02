import * as fs from 'fs';
import * as path from 'path';

function fixLevel(moduleId: number, levelId: number) {
    const file = path.join(process.cwd(), `src/scenarios/module${moduleId}/level${moduleId}-${levelId}.ts`);
    if (!fs.existsSync(file)) return;

    let content = fs.readFileSync(file, 'utf8');

    // Extract all investigation action IDs
    const investigateRegex = /id:\s*['"]([^'"]+)['"][\s\S]*?category:\s*['"]investigation['"]/g;
    const investigateActions = [];
    let match;
    while ((match = investigateRegex.exec(content)) !== null) {
        investigateActions.push(match[1]);
    }

    // We also need to extract all actions and their categories to be safe, but a simpler way:
    // read the file line by line, look for "id: '...'" then "category: 'investigation'"
    const actionsBlockMatch = content.match(/options:\s*\[([\s\S]*?)\],/); // not options, actions
    const actionsMatch = content.match(/actions:\s*\[([\s\S]*?)\]\s*,/);
    let invIds: string[] = [];
    if (actionsMatch) {
        const actionObjs = actionsMatch[1].split('},');
        for (const obj of actionObjs) {
            if (obj.includes("category: 'investigation'") || obj.includes('category: "investigation"')) {
                const idMatch = obj.match(/id:\s*['"]([^'"]+)['"]/);
                if (idMatch) invIds.push(idMatch[1]);
            }
        }
    }

    // Now extract narratorScript block
    const narratorMatch = content.match(/narratorScript:\s*\{[\s\S]*?actions:\s*\{([\s\S]*?)\}\s*,?\s*(?:resolution:|})/);
    if (!narratorMatch) {
        // Level 3.5 has no narratorScript actions?
        if (moduleId === 3 && levelId === 5) {
            let injection = content.replace(/(dispatchMessage:.*?,)/, `$1\n    narratorScript: {\n        opening: "Listen carefully. This is the final test.",\n        actions: {},\n        resolution: "System stabilized. You're ready."\n    },`);
            fs.writeFileSync(file, injection);
        }
        return;
    }

    const actionsBlock = narratorMatch[1];
    let newActionsBlock = actionsBlock;

    // Apply specific renames
    const ren = (from: string, to: string) => {
        const r = new RegExp(`['"]${from}['"]\\s*:`, "g");
        newActionsBlock = newActionsBlock.replace(r, `"${to}":`);
    };

    if (moduleId === 1 && levelId === 1) {
        // add missing key check_backend_code
        if (!newActionsBlock.includes('check_backend_code')) {
            newActionsBlock += `,\n            "check_backend_code": "Backend is running correctly. The problem is not in the backend code."`;
        }
    } else if (moduleId === 1 && levelId === 2) {
        ren('read_code', 'read_frontend_code');
        // what about check_database?
        if (!newActionsBlock.includes('check_database')) {
            newActionsBlock += `,\n            "check_database": "No records exist. Submit did not persist anything."`;
        }
    } else if (moduleId === 1 && levelId === 3) {
        ren('read_code', 'read_transform_code');
        ren('check_backend_routes', 'check_backend_route');
        if (!newActionsBlock.includes('check_api_structure')) {
            newActionsBlock += `,\n            "check_api_structure": "The structure is different from what frontend expects."`;
        }
    } else if (moduleId === 1 && levelId === 4) {
        ren('read_code', 'read_click_handler');
        ren('check_backend_routes', 'check_parent_component'); // wait... 'read_parent_component' -> 'check_parent_component' ??
        ren('read_parent_component', 'check_parent_component');
        if (!newActionsBlock.includes('inspect_network')) {
            newActionsBlock += `,\n            "inspect_network": "Network request fired. Check the payload."`;
        }
        if (!newActionsBlock.includes('check_props')) {
            newActionsBlock += `,\n            "check_props": "Props don't match expected types."`;
        }
    } else if (moduleId === 1 && levelId === 5) {
        ren('read_code', 'read_package_json');
        ren('check_env', 'check_peer_deps');
        ren('inspect_dependency_requirements', 'check_component_code');
        if (!newActionsBlock.includes('inspect_element')) {
            newActionsBlock += `,\n            "inspect_element": "DOM shows an error related to missing module."`;
        }
    } else if (moduleId === 2 && levelId === 1) {
        ren('inspect_console', 'read_console_error');
        ren('read_code', 'read_component_code');
        if (!newActionsBlock.includes('read_parent_usage')) {
            newActionsBlock += `,\n            "read_parent_usage": "Parent component is rendering it wrong."`;
        }
    } else if (moduleId === 2 && levelId === 2) {
        ren('read_code', 'read_fetch_code');
        if (!newActionsBlock.includes('check_auth_token')) {
            newActionsBlock += `,\n            "check_auth_token": "Auth token is missing or expired in local storage."`;
        }
    } else if (moduleId === 2 && levelId === 3) {
        ren('inspect_network', 'check_network_waterfall');
        ren('inspect_console', 'check_bundle_size');
        ren('read_backend_route', 'check_api_internals');
        if (!newActionsBlock.includes('check_third_party')) {
            newActionsBlock += `,\n            "check_third_party": "Third party script is blocking the main thread."`;
        }
    } else if (moduleId === 2 && levelId === 4) {
        ren('inspect_console', 'read_console_error');
        ren('inspect_network', 'inspect_actual_response');
        ren('read_backend_route_code', 'read_backend_route');
    } else if (moduleId === 2 && levelId === 5) {
        ren('inspect_network', 'inspect_network_response');
        ren('inspect_network_headers', 'check_cache_storage');
        ren('inspect_console', 'check_service_worker');
        if (!newActionsBlock.includes('hard_reload')) {
            newActionsBlock += `,\n            "hard_reload": "Hard reload bypasses cache. That proves it's a caching problem."`;
        }
    } else if (moduleId === 3 && levelId === 1) {
        ren('inspect_console', 'read_error_logs');
        ren('read_code', 'check_installed_deps');
        ren('check_backend_routes', 'check_package_json');
        if (!newActionsBlock.includes('list_log_dir')) {
            newActionsBlock += `,\n            "list_log_dir": "Checking the log directory for clues."`;
        }
    } else if (moduleId === 3 && levelId === 2) {
        ren('read_code', 'read_diff');
        ren('check_backend_routes', 'git_log_both'); // Wait, git_diff?
        ren('git_diff', 'read_diff');
        // ensure no duplicates
        if (!newActionsBlock.includes('git_log_both')) {
            newActionsBlock += `,\n            "git_log_both": "Checking git history on both branches."`;
        }
    } else if (moduleId === 3 && levelId === 3) {
        ren('read_code', 'understand_revert');
        ren('git_diff', 'git_show_commit');
        ren('inspect_console', 'check_git_log_after');
    } else if (moduleId === 3 && levelId === 4) {
        ren('read_code', 'read_error_log');
        ren('check_env', 'compare_configs');
        ren('git_diff', 'check_next_config');
    }

    // Now filter out orphaned keys and ensure perfect match.
    // parse the block into a js object literally is tricky.
    // Let's use regex to extract keys:
    const keyRegex = /['"]([^'"]+)['"]\s*:/g;
    let finalKeys = new Set<string>();
    let match2;
    while ((match2 = keyRegex.exec(newActionsBlock)) !== null) {
        finalKeys.add(match2[1]);
    }

    // Add missing keys from investigate actions
    for (const invId of invIds) {
        if (!finalKeys.has(invId)) {
            newActionsBlock += `,\n            "${invId}": "Evidence acquired: ${invId}."`;
            finalKeys.add(invId);
        }
    }

    // Remove orphaned keys
    let filteredBlock = "{\n";
    for (const invId of invIds) {
        // find that line inside newActionsBlock
        const lineRegex = new RegExp(`['"]${invId}['"]\\s*:\\s*(['"\`][\\s\\S]*?['"\`])`, "m");
        const match3 = newActionsBlock.match(lineRegex);
        if (match3) {
            filteredBlock += `            "${invId}": ${match3[1]},\n`;
        } else {
            // Should not happen since we just added it, but just in case
            filteredBlock += `            "${invId}": "Evidence acquired.",\n`;
        }
    }
    filteredBlock = filteredBlock.replace(/,\n$/, "\n        }");

    content = content.replace(narratorMatch[0], narratorMatch[0].replace(actionsBlock, filteredBlock.substring(1, filteredBlock.length - 1)));

    fs.writeFileSync(file, content);
    console.log(`Updated module${moduleId}/level${moduleId}-${levelId}.ts. Keys: ${invIds.length}`);
}

for (let m = 1; m <= 3; m++) {
    for (let l = 1; l <= 5; l++) {
        fixLevel(m, l);
    }
}
