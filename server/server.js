import express from 'express'
import { createServer } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Server } from 'socket.io'

import { createLearnAiService } from './learn-ai/adviceService.js'
import {
  buildAudioAnalysisResponse,
  buildAudioAnalysisUnavailable,
  canBuildAudioAnalysis,
  getAudioAnalysisContext,
  hasAudioInsightInput
} from './learn-ai/audioAnalysisService.js'
import { loadLocalEnvFiles, resolveLearnAiEnv } from './learn-ai/envResolver.js'

/* -------------------------------------------------------
   Utils
------------------------------------------------------- */

function safeText(value, fallback = '') {
  const text = String(value ?? '').trim()
  return text || fallback
}

function normalizePayload(body = {}) {
  return body.payload &&
    typeof body.payload === 'object' &&
    !Array.isArray(body.payload)
    ? body.payload
    : body
}

/* -------------------------------------------------------
   ✅ Production-Grade CORS
------------------------------------------------------- */

function getAllowedOrigins() {
  const raw = safeText(process.env.ALLOWED_ORIGINS)
  if (!raw) return []
  return raw
    .split(',')
    .map(o => o.trim())
    .filter(Boolean)
}

function isAllowedOrigin(origin) {
  const value = safeText(origin)

  // ✅ Allow no-origin (Postman / curl / mobile app)
  if (!value) return true

  // ✅ Dev mode: allow everything
  if (process.env.NODE_ENV !== 'production') {
    return true
  }

  const whitelist = getAllowedOrigins()

  // ✅ If no whitelist configured → allow (fail-open)
  if (!whitelist.length) return true

  return whitelist.includes(value)
}

function applyCors(req, res) {
  const origin = req.headers.origin

  if (isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*')
    res.setHeader('Vary', 'Origin')
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'content-type, authorization'
  )
  res.setHeader('Access-Control-Max-Age', '86400')
}

/* -------------------------------------------------------
   AI Service Factory
------------------------------------------------------- */

function buildLearnAiServiceFromEnv() {
  const loadedEnvFiles = loadLocalEnvFiles()
  const aiEnv = resolveLearnAiEnv()
  const cacheDir = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    'cache'
  )

  return createLearnAiService({
    apiKey: aiEnv.apiKey,
    requestedModel: aiEnv.requestedModel,
    keySource: aiEnv.keySource || aiEnv.qwenKeySource,
    modelSource: aiEnv.modelSource,
    loadedEnvFiles,
    cacheDir,
    cooldownMs: Number(process.env.AI_BUSY_COOLDOWN_MS || 20_000),
    defaultCacheTtlMs: Number(process.env.AI_CACHE_TTL_MS || 12 * 60_000),
    cacheTtlByMode: {
      publish: Number(process.env.AI_CACHE_TTL_PUBLISH_MS || 45 * 60_000),
      'work-detail': Number(
        process.env.AI_CACHE_TTL_WORK_DETAIL_MS || 45 * 60_000
      ),
      'practice-encourage': Number(
        process.env.AI_CACHE_TTL_PRACTICE_MS || 15 * 60_000
      )
    }
  })
}

/* -------------------------------------------------------
   App Factory
------------------------------------------------------- */

export function createApp(options = {}) {
  const app = express()
  const learnAi = options.learnAi || buildLearnAiServiceFromEnv()

  app.use(express.json({ limit: '512kb' }))

  // ✅ Global CORS middleware
  app.use((req, res, next) => {
    applyCors(req, res)

    if (req.method === 'OPTIONS') {
      res.status(204).end()
      return
    }

    next()
  })

  /* ---------------- Health ---------------- */

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      env: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 3000,
      ai: learnAi.getHealth()
    })
  })

  /* ---------------- Audio Analysis ---------------- */

  app.post('/api/learn/audio-analysis', async (req, res) => {
    const payload = normalizePayload(req.body || {})
    const context = getAudioAnalysisContext(payload)

    try {
      if (!canBuildAudioAnalysis(payload, context)) {
        return res.status(422).json(
          buildAudioAnalysisUnavailable(
            '当前练习记录缺少完整评分数据，请重新完成一次练唱。',
            {
              context,
              errorCode: 'INSUFFICIENT_ANALYSIS',
              status: 422
            }
          )
        )
      }

      const result = await learnAi.getAdvice({
        mode: context,
        payload,
        stream: false
      })

      if (!result?.meta || result.meta.status >= 400) {
        return res.status(result?.meta?.status || 503).json(
          buildAudioAnalysisUnavailable(
            '分析服务暂时不可用，请稍后再试。',
            {
              context,
              errorCode: safeText(result?.meta?.errorCode, 'REQUEST_FAILED'),
              status: result?.meta?.status || 503
            }
          )
        )
      }

      res.json(
        buildAudioAnalysisResponse(payload, result.data, { context })
      )
    } catch (error) {
      res.status(500).json(
        buildAudioAnalysisUnavailable(
          safeText(error?.message, 'Audio analysis failed.'),
          { context, errorCode: 'SERVER_ERROR', status: 500 }
        )
      )
    }
  })

  return app
}

/* -------------------------------------------------------
   Server + Socket.io
------------------------------------------------------- */

export function startServer(options = {}) {
  const app = createApp(options)
  const server = createServer(app)

  const io = new Server(server, {
    connectionStateRecovery: {},
    cors: {
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
          callback(null, true)
        } else {
          callback(new Error('CORS origin not allowed'))
        }
      },
      methods: ['GET', 'POST'],
      credentials: true
    }
  })

  io.on('connection', (socket) => {
    console.log('✅ socket connected:', socket.id)

    socket.on('sendMessage', (data) => {
      socket.broadcast.emit('chatMessage', data)
    })

    socket.on('operaMessage', (data) => {
      socket.broadcast.emit('responseMessage', data)
    })
  })

  const port = Number(options.port || process.env.PORT || 3000)

  server.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server running at http://localhost:${port}`)
  })

  return { app, server, io }
}

/* -------------------------------------------------------
   CLI Boot
------------------------------------------------------- */

const currentFile = fileURLToPath(import.meta.url)
const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === currentFile

if (isMain) {
  startServer()
}




