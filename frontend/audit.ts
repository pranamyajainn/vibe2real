import * as fs from 'fs';
import * as path from 'path';

async function audit() {
    let output = "";
    const log = (msg: string) => { output += msg + '\n'; };

    const scenarioDir = path.join(process.cwd(), 'src', 'scenarios');

    log("=== AUDIT REPORT ===\n");

    const category1: any[] = [];
    const category2: any[] = [];
    const category4: any[] = [];
    const category6: any[] = [];

    for (let m = 1; m <= 3; m++) {
        for (let l = 1; l <= 5; l++) {
            const levelId = `${m}-${l}`;
            const filePath = path.join(scenarioDir, `module${m}`, `level${m}-${l}.ts`);

            if (!fs.existsSync(filePath)) {
                log(`[!] Level ${levelId} file not found.`);
                continue;
            }

            try {
                const mod = await import(filePath);
                // Assume the export is named level1_1, level1_2, etc or default. We'll find it by guessing the first exported ScenarioDefinition.
                const exportKey = Object.keys(mod).find(k => k.startsWith('level') || k === 'default');
                const scenario = mod[exportKey as string] || mod.default;

                if (!scenario) {
                    log(`[!] Level ${levelId} exports no valid scenario`);
                    continue;
                }

                // 1. Clue Counting & 2. Narrator action mapping
                const narratorActions = scenario.narratorScript?.actions || {};
                const narratorActionKeys = Object.keys(narratorActions);
                const investigateActions = scenario.actions.filter((a: any) => a.category === 'investigation');

                const investigateActionIds = investigateActions.map((a: any) => a.id);

                let mismatches = [];
                let unmetClueCount = false;

                // Check for keys in narratorActions that are NOT in investigateActionIds
                const orphanedNarratorKeys = narratorActionKeys.filter(k => !investigateActionIds.includes(k));
                if (orphanedNarratorKeys.length > 0) {
                    mismatches.push(`Narrator script has keys not present in EXAMINE actions: ${orphanedNarratorKeys.join(', ')}`);
                }

                // Check for investigate actions that don't have narrator responses
                const missingNarratorKeys = investigateActionIds.filter((id: string) => !narratorActionKeys.includes(id));
                if (missingNarratorKeys.length > 0) {
                    mismatches.push(`EXAMINE actions missing from narrator script explicitly (will fallback to "nothing"): ${missingNarratorKeys.join(', ')}`);
                }

                if (investigateActions.length < narratorActionKeys.length) {
                    unmetClueCount = true;
                }

                // Note: The UI gate unblocks when foundClues >= Object.keys(narratorActions).length.
                // If there's an orphaned narrator key, the player can NEVER click an action to satisfy it!
                if (orphanedNarratorKeys.length > 0) {
                    category1.push(`Level ${levelId}: EXPECTED CLUES TO UNLOCK = ${narratorActionKeys.length}. POSSIBLE VALID CLUE CLICKS = ${narratorActionKeys.length - orphanedNarratorKeys.length}. Gate is UNREACHABLE.`);
                } else {
                    category1.push(`Level ${levelId}: Expected clues: ${narratorActionKeys.length}. Actual available: ${investigateActions.length} actions, ${narratorActionKeys.length} matches.`);
                }

                if (mismatches.length > 0) {
                    category2.push(`Level ${levelId}:\n  - ${mismatches.join('\n  - ')}`);
                } else {
                    category2.push(`Level ${levelId}: Perfect match.`);
                }

                // 4. MAKE YOUR MOVE unlock
                const resolutionActionIds = new Set(scenario.resolution.requiredActionIds);
                if (scenario.resolution.alternativePaths) {
                    scenario.resolution.alternativePaths.forEach((path: string[]) => {
                        path.forEach(id => resolutionActionIds.add(id));
                    });
                }

                const modActions = scenario.actions.filter((a: any) => a.category === 'modification').map((a: any) => a.id);
                const missingMods = Array.from(resolutionActionIds).filter(id => !modActions.includes(id as string));

                if (missingMods.length > 0) {
                    category4.push(`Level ${levelId}: Resolution requires ${missingMods.join(', ')} but they do not exist in modification actions!`);
                } else {
                    category4.push(`Level ${levelId}: Resolution actions correctly mapped.`);
                }

                // 6. Pattern breaks
                if (scenario.patternBreak) {
                    let pbStatus = `Level ${levelId}: Expected pattern break '${scenario.patternBreak}'`;
                    if (scenario.patternBreak === 'time_pressure') {
                        category6.push(pbStatus + ` -> Verified config presence.`);
                    } else if (scenario.patternBreak === 'red_herring') {
                        const hasCors = scenario.actions.some((a: any) => a.id === 'add_cors_header');
                        if (!hasCors) pbStatus += ` -> MISSING 'add_cors_header' action!`;
                        else pbStatus += ` -> Verified trap action 'add_cors_header' exists.`;
                        category6.push(pbStatus);
                    } else if (scenario.patternBreak === 'silent_senior') {
                        category6.push(pbStatus + ` -> Verified config presence.`);
                    } else {
                        category6.push(pbStatus + ` -> Unknown pattern break!`);
                    }
                }

            } catch (err: any) {
                log(`[!] Error processing Level ${levelId}: ${err.message}`);
            }
        }
    }

    log("\n**1. Clue counting**");
    log(category1.join('\n'));
    log("\n**2. Narrator action mapping**");
    log(category2.join('\n'));
    log("\n**4. MAKE YOUR MOVE unlock**");
    log(category4.join('\n'));
    log("\n**6. Pattern breaks**");
    log(category6.join('\n'));

    fs.writeFileSync('/tmp/audit_report.txt', output);
    console.log("Audit complete, check /tmp/audit_report.txt");
}

audit();
