import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createId } from './utils/id.js'

const app = new Hono()

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use('/*', cors({
  origin: ['http://localhost:3000', 'https://vibe2real.com'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
}))

// ─── In-Memory Stores ────────────────────────────────────────────────────────

interface Session {
  anonymousId: string
  sessionId: string
  totalXP: number
  streak: number
  modulesCompleted: number
  lastSeen: number
  tier: string
  aiFlag: boolean
  fastestMinutes: number | null
}

interface ActionPayload {
  sessionId: string
  moduleId: number
  levelId: string
  actions: {
    category: string
    action: string
    informationCostMs: number
    timestamp: number
  }[]
}

interface CompletionPayload {
  sessionId: string
  moduleId: number
  levelId: string
  tier: string
  timeSeconds: number
  aiFlag: boolean
  xpAwarded: number
}

interface Certificate {
  id: string
  anonymousId: string
  issuedAt: number
  tier: string
  email?: string
}

const sessions = new Map<string, Session>()
const certificates = new Map<string, Certificate>()
const actionLogs: ActionPayload[] = []

// Seeded leaderboard entries
const SEED_ENTRIES: Session[] = [
  { anonymousId: 'USR_F2A3', sessionId: 'seed-1', totalXP: 4200, streak: 7, modulesCompleted: 3, lastSeen: Date.now(), tier: 'reliable', aiFlag: false, fastestMinutes: 107 },
  { anonymousId: 'USR_9E1B', sessionId: 'seed-2', totalXP: 3800, streak: 5, modulesCompleted: 3, lastSeen: Date.now(), tier: 'reliable', aiFlag: false, fastestMinutes: 132 },
  { anonymousId: 'USR_C711', sessionId: 'seed-3', totalXP: 3250, streak: 3, modulesCompleted: 3, lastSeen: Date.now(), tier: 'efficient', aiFlag: false, fastestMinutes: 158 },
  { anonymousId: 'USR_7D4A', sessionId: 'seed-4', totalXP: 2900, streak: 2, modulesCompleted: 3, lastSeen: Date.now(), tier: 'efficient', aiFlag: false, fastestMinutes: 185 },
  { anonymousId: 'USR_0B8C', sessionId: 'seed-5', totalXP: 2600, streak: 1, modulesCompleted: 3, lastSeen: Date.now(), tier: 'independent', aiFlag: false, fastestMinutes: 200 },
]

for (const s of SEED_ENTRIES) sessions.set(s.sessionId, s)

// ─── Root ─────────────────────────────────────────────────────────────────────
app.get('/', (c) => {
  return c.json({ status: 'ok', service: 'Vibe2Real Simulator API', version: '1.0.0' })
})

// ─── POST /api/sessions ───────────────────────────────────────────────────────
// Create or restore a session by anonymousId
app.post('/api/sessions', async (c) => {
  const body = await c.req.json()
  const { anonymousId, sessionId } = body

  if (!anonymousId) {
    return c.json({ error: 'anonymousId required' }, 400)
  }

  // Check for existing session by anonymousId
  let existing: Session | undefined
  for (const s of sessions.values()) {
    if (s.anonymousId === anonymousId) {
      existing = s
      break
    }
  }

  if (existing) {
    existing.lastSeen = Date.now()
    sessions.set(existing.sessionId, existing)
    return c.json({ session: existing, restored: true })
  }

  // Create new
  const newSession: Session = {
    anonymousId,
    sessionId: sessionId || createId(),
    totalXP: 0,
    streak: 0,
    modulesCompleted: 0,
    lastSeen: Date.now(),
    tier: 'guidance',
    aiFlag: false,
    fastestMinutes: null,
  }

  sessions.set(newSession.sessionId, newSession)
  return c.json({ session: newSession, restored: false }, 201)
})

// ─── POST /api/actions ────────────────────────────────────────────────────────
// Receive action logs (batched, silent)
app.post('/api/actions', async (c) => {
  const body: ActionPayload = await c.req.json()

  if (!body.sessionId || !body.actions?.length) {
    return c.json({ error: 'sessionId and actions required' }, 400)
  }

  actionLogs.push(body)

  // AI flag detection: >60% reflexive = flag session
  const total = body.actions.length
  const reflexive = body.actions.filter(a => a.category === 'reflexive').length
  if (total >= 5 && reflexive / total > 0.6) {
    const s = sessions.get(body.sessionId)
    if (s) { s.aiFlag = true; sessions.set(s.sessionId, s) }
  }

  return c.json({ received: body.actions.length }, 200)
})

// ─── POST /api/complete ───────────────────────────────────────────────────────
// Submit completion, update session XP and tier
app.post('/api/complete', async (c) => {
  const body: CompletionPayload = await c.req.json()
  const { sessionId, tier, timeSeconds, aiFlag, xpAwarded, moduleId } = body

  if (!sessionId) return c.json({ error: 'sessionId required' }, 400)

  const s = sessions.get(sessionId)
  if (!s) return c.json({ error: 'session not found' }, 404)

  s.totalXP += xpAwarded
  s.lastSeen = Date.now()

  // Track best tier
  const tierRank = { guidance: 0, independent: 1, efficient: 2, reliable: 3 }
  const current = tierRank[s.tier as keyof typeof tierRank] ?? 0
  const incoming = tierRank[tier as keyof typeof tierRank] ?? 0
  if (incoming > current) s.tier = tier

  if (aiFlag) s.aiFlag = true

  // Track fastest completion (in minutes)
  const minutes = Math.round(timeSeconds / 60)
  if (s.fastestMinutes === null || minutes < s.fastestMinutes) {
    s.fastestMinutes = minutes
  }

  sessions.set(sessionId, s)

  return c.json({
    totalXP: s.totalXP,
    tier: s.tier,
    aiFlag: s.aiFlag,
    certificateEligible: s.modulesCompleted >= 3 && !s.aiFlag && incoming >= 1,
  })
})

// ─── GET /api/leaderboard ─────────────────────────────────────────────────────
// Top 20 by XP
app.get('/api/leaderboard', (c) => {
  const all = Array.from(sessions.values())
    .filter(s => s.totalXP > 0)
    .sort((a, b) => b.totalXP - a.totalXP)
    .slice(0, 20)
    .map((s, i) => ({
      rank: i + 1,
      anonymousId: s.anonymousId,
      xp: s.totalXP,
      tier: s.tier,
      modules: s.modulesCompleted,
      fastestMinutes: s.fastestMinutes,
      aiFlag: s.aiFlag,
    }))

  const stats = {
    totalParticipants: sessions.size,
    reliableCount: Array.from(sessions.values()).filter(s => s.tier === 'reliable').length,
    topXP: all[0]?.xp ?? 0,
    fastestMinutes: Math.min(...Array.from(sessions.values()).filter(s => s.fastestMinutes).map(s => s.fastestMinutes!)),
  }

  return c.json({ entries: all, stats })
})

// ─── POST /api/certificate ────────────────────────────────────────────────────
// Issue a certificate by session
app.post('/api/certificate', async (c) => {
  const body = await c.req.json()
  const { sessionId, email } = body

  const s = sessions.get(sessionId)
  if (!s) return c.json({ error: 'session not found' }, 404)

  if (s.modulesCompleted < 3) {
    return c.json({ error: 'All 3 modules required for certificate' }, 403)
  }

  if (s.aiFlag) {
    return c.json({ error: 'AI dependency flag prevents certificate issuance' }, 403)
  }

  if (s.tier === 'guidance') {
    return c.json({ error: 'Minimum Independent tier required' }, 403)
  }

  const certId = `CERT-${createId().slice(0, 8).toUpperCase()}`
  const cert: Certificate = {
    id: certId,
    anonymousId: s.anonymousId,
    issuedAt: Date.now(),
    tier: s.tier,
    email: email || undefined,
  }

  certificates.set(certId, cert)

  return c.json({ certId, issuedAt: cert.issuedAt, tier: cert.tier }, 201)
})

// ─── GET /api/certificate/:id ─────────────────────────────────────────────────
// Verify a certificate publicly
app.get('/api/certificate/:id', (c) => {
  const id = c.req.param('id')
  const cert = certificates.get(id)

  if (!cert) return c.json({ error: 'Certificate not found' }, 404)

  return c.json({
    id: cert.id,
    anonymousId: cert.anonymousId,
    tier: cert.tier,
    issuedAt: cert.issuedAt,
    valid: true,
  })
})

// ─── GET /api/simulator/status ────────────────────────────────────────────────
// Live system stats for landing page
app.get('/api/simulator/status', (c) => {
  const allSessions = Array.from(sessions.values())
  return c.json({
    activeUsers: allSessions.filter(s => Date.now() - s.lastSeen < 3_600_000).length,
    globalFailureRate: 87.4,
    systemState: 'UNSTABLE',
    totalXPEarned: allSessions.reduce((sum, s) => sum + s.totalXP, 0),
  })
})

// ─── Server ───────────────────────────────────────────────────────────────────
serve({
  fetch: app.fetch,
  port: 3001,
}, (info) => {
  console.log(`Vibe2Real API running on http://localhost:${info.port}`)
})
