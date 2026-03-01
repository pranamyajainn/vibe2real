// Vibe2Real — Scenario Seed & Surface Randomization Engine
// Per-session randomization: same root cause, different surface appearance

export interface RandomizedSurface {
    portNumber: number;
    apiEndpoint: string;
    envVarName: string;
    serviceName: string;
    errorCode: string;
    variableName: string;
    timestamp: string;
    processId: number;
}

// Generate a deterministic-but-varied surface for a session
export function generateSurface(sessionId: string, moduleId: number, levelId: string): RandomizedSurface {
    // Simple seeded pseudo-random from sessionId
    const seed = hashCode(`${sessionId}-${moduleId}-${levelId}`);
    const rng = seededRng(seed);

    const ports = [3000, 3001, 4000, 4001, 5000, 8000, 8080, 9000];
    const apiPaths = ['/api/data', '/api/users', '/api/products', '/api/records', '/api/items'];
    const envVars = ['NEXT_PUBLIC_API_URL', 'REACT_APP_API_URL', 'VITE_API_BASE', 'API_ENDPOINT', 'SERVICE_URL'];
    const services = ['data-service', 'api-gateway', 'user-service', 'record-handler', 'core-api'];
    const errorCodes = ['ERR_CONNECTION_REFUSED', 'ECONNREFUSED', 'ERR_NETWORK', 'ENOTFOUND', 'ERR_BAD_RESPONSE'];
    const varNames = ['userData', 'responseData', 'apiResult', 'fetchedItems', 'records'];

    return {
        portNumber: ports[Math.floor(rng() * ports.length)],
        apiEndpoint: apiPaths[Math.floor(rng() * apiPaths.length)],
        envVarName: envVars[Math.floor(rng() * envVars.length)],
        serviceName: services[Math.floor(rng() * services.length)],
        errorCode: errorCodes[Math.floor(rng() * errorCodes.length)],
        variableName: varNames[Math.floor(rng() * varNames.length)],
        timestamp: generateTimestamp(rng),
        processId: 10000 + Math.floor(rng() * 50000),
    };
}

function hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

function seededRng(seed: number): () => number {
    let s = seed;
    return () => {
        s = (s * 1664525 + 1013904223) & 0xffffffff;
        return (s >>> 0) / 0xffffffff;
    };
}

function generateTimestamp(rng: () => number): string {
    const hours = Math.floor(rng() * 24);
    const mins = Math.floor(rng() * 60);
    const secs = Math.floor(rng() * 60);
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Entropy injection — noisy log generator
const NOISE_TEMPLATES = [
    '⚠ [deprecated] crypto.createCipher is deprecated.',
    'info  - Loaded env from .env.local',
    '  WARN  Session store using MemoryStore — not suitable for production',
    'GET /favicon.ico 404 in 2ms',
    'Module Warning: Critical dependency: the request of a dependency is an expression',
    '⚙ [VERBOSE] Webpack HMR hot update applied in 312ms',
    'ExperimentalWarning: The Fetch API is an experimental feature.',
    '  warn  - Fast Refresh had to perform a full reload due to a runtime error.',
    'DEPRECATION: @import rules are deprecated and will be removed in Dart Sass 3.0.0.',
];

export function injectEntropy(logs: string[], count: number = 2): string[] {
    const shuffled = [...logs];
    const noiseCount = Math.min(count, NOISE_TEMPLATES.length);
    const selected = [...NOISE_TEMPLATES].sort(() => Math.random() - 0.5).slice(0, noiseCount);

    // Inject at random positions
    for (const noise of selected) {
        const pos = Math.floor(Math.random() * (shuffled.length + 1));
        shuffled.splice(pos, 0, noise);
    }

    return shuffled;
}
