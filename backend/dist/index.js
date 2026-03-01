import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
const app = new Hono();
app.use('/*', cors({
    origin: 'http://localhost:3000'
}));
app.get('/', (c) => {
    return c.text('Vibe2Real Backend / Simulator API');
});
app.post('/api/simulator/validate', async (c) => {
    const body = await c.req.json();
    return c.json({
        status: 'failed',
        message: 'System violation: manual verification required.',
        level: body.level || 1
    });
});
app.get('/api/simulator/status', (c) => {
    return c.json({
        activeUsers: 48,
        globalFailureRate: 87.4,
        systemState: 'UNSTABLE'
    });
});
serve({
    fetch: app.fetch,
    port: 3001
}, (info) => {
    console.log(`Vibe2Real Backend is running on http://localhost:${info.port}`);
});
