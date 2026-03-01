// Vibe2Real — Environment Degradation Engine
// Irrecoverable state tracking — real failure experience when blind actions accumulate

export interface DegradationState {
    level: number;          // 0=clean, 1=degraded, 2=critical, 3=irrecoverable
    blindActionCount: number;
    warningThreshold: number;   // actions before first warning
    criticalThreshold: number;  // actions before critical
    irrecoverableThreshold: number; // actions before forced restart
    events: DegradationEvent[];
}

export interface DegradationEvent {
    timestamp: number;
    message: string;
    severity: 'warning' | 'critical' | 'irrecoverable';
}

export function createDegradationState(config?: Partial<DegradationState>): DegradationState {
    return {
        level: 0,
        blindActionCount: 0,
        warningThreshold: config?.warningThreshold ?? 5,
        criticalThreshold: config?.criticalThreshold ?? 9,
        irrecoverableThreshold: config?.irrecoverableThreshold ?? 13,
        events: [],
    };
}

export function recordBlindAction(state: DegradationState): DegradationState {
    const updated = { ...state, blindActionCount: state.blindActionCount + 1, events: [...state.events] };

    if (updated.blindActionCount >= updated.irrecoverableThreshold) {
        updated.level = 3;
        updated.events.push({
            timestamp: Date.now(),
            message: 'SYSTEM UNRECOVERABLE — environment state corrupted. Scenario restart required.',
            severity: 'irrecoverable',
        });
    } else if (updated.blindActionCount >= updated.criticalThreshold) {
        updated.level = 2;
        updated.events.push({
            timestamp: Date.now(),
            message: 'CRITICAL — Multiple services destabilized. Rate limits triggered. Logs partially overwritten.',
            severity: 'critical',
        });
    } else if (updated.blindActionCount >= updated.warningThreshold) {
        updated.level = 1;
        updated.events.push({
            timestamp: Date.now(),
            message: 'WARNING — Excessive blind actions detected. Environment showing instability.',
            severity: 'warning',
        });
    }

    return updated;
}

export function isIrrecoverable(state: DegradationState): boolean {
    return state.level >= 3;
}

export function getDegradationMessage(state: DegradationState): string | null {
    if (state.events.length === 0) return null;
    return state.events[state.events.length - 1].message;
}

export function getDegradationColor(level: number): string {
    switch (level) {
        case 1: return '#ffff00';  // warning yellow
        case 2: return '#ff6600';  // critical orange
        case 3: return '#ff3333';  // irrecoverable red
        default: return 'transparent';
    }
}
