// Vibe2Real — Information Cost System
// Simulates operational latency — forces deliberate investigation and planning

export interface ActionCost {
    actionId: string;
    delayMs: number;
    label: string;
    inProgress: boolean;
}

// Fixed information costs per action type (v1: static, not dynamic)
export const INFORMATION_COSTS: Record<string, number> = {
    restart_server: 4000,
    build_step: 8000,
    deployment: 12000,
    page_reload: 2000,
    run_tests: 6000,
    install_deps: 10000,
    git_pull: 3000,
    git_push: 5000,
    check_logs: 1500,
    open_network_tab: 500,
    open_console: 300,
    inspect_element: 400,
    run_command: 1000,
    read_file: 800,
    edit_file: 1200,
    env_var_check: 600,
};

export function getCost(actionType: string): number {
    return INFORMATION_COSTS[actionType] ?? 0;
}

// Returns a promise that resolves after the delay
export async function simulateDelay(actionType: string, onProgress?: (elapsed: number, total: number) => void): Promise<void> {
    const totalMs = getCost(actionType);
    if (totalMs === 0) return;

    return new Promise(resolve => {
        const startTime = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            if (onProgress) onProgress(elapsed, totalMs);
            if (elapsed >= totalMs) {
                clearInterval(interval);
                resolve();
            }
        }, 100);
    });
}

export function getDelayLabel(actionType: string): string {
    const ms = getCost(actionType);
    if (ms === 0) return '';
    if (ms < 1000) return `${ms}ms`;
    return `${ms / 1000}s`;
}
