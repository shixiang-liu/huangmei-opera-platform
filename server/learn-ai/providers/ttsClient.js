/**
 * Qwen TTS provider stub for Learn-AI — Voice Narration Pool.
 *
 * Uses DashScope TTS endpoint with instruct-capable models.
 * Configured only when DASHSCOPE_API_KEY (or aliases) is present.
 *
 * P2 stub — returns a structured placeholder so callers can integrate
 * the "听老师讲一遍" button without waiting for full TTS implementation.
 */

const TTS_POOL_MODELS = new Set([
  'qwen3-tts-instruct-flash',
  'qwen3-tts-instruct-flash-realtime'
])

const TTS_FALLBACK_ORDER = [
  'qwen3-tts-instruct-flash',
  'qwen3-tts-instruct-flash-realtime'
]

const DEFAULT_TTS_MODEL = 'qwen3-tts-instruct-flash'

function safeText(value, fallback = '') {
  const text = String(value ?? '').trim()
  return text || fallback
}

function resolveApiKey(env = process.env) {
  return (
    safeText(env.DASHSCOPE_API_KEY)
    || safeText(env.QWEN_API_KEY)
    || safeText(env.LEARN_QWEN_API_KEY)
  )
}

export function resolveTtsModel(model) {
  const normalized = safeText(model, DEFAULT_TTS_MODEL).toLowerCase()
  if (TTS_POOL_MODELS.has(normalized)) return normalized
  return DEFAULT_TTS_MODEL
}

export function isQwenTtsConfigured() {
  return Boolean(resolveApiKey())
}

/**
 * Stub: synthesize speech from finalAdvice text.
 *
 * Full implementation would POST to DashScope TTS endpoint and return
 * an audio URL or stream. For now returns a structured unavailable result.
 */
export async function requestTtsSynthesize(options = {}) {
  const apiKey = resolveApiKey()
  const text = safeText(options.text || options.finalAdvice)

  if (!apiKey || !text) {
    return {
      ok: false,
      available: false,
      model: DEFAULT_TTS_MODEL,
      reason: !apiKey ? 'missing-api-key' : 'missing-text',
      audioUrl: null
    }
  }

  const model = resolveTtsModel(
    safeText(options.preferredModel || process.env.QWEN_TTS_MODEL)
  )

  // P2 stub — capability registered but not yet implemented
  return {
    ok: false,
    available: false,
    model,
    reason: 'stub-not-implemented',
    audioUrl: null
  }
}

export function buildTtsHealthModels(primary) {
  const selected = resolveTtsModel(primary)
  return {
    requested: safeText(primary) || null,
    selected,
    ttsPoolModels: Array.from(TTS_POOL_MODELS),
    fallbackOrder: TTS_FALLBACK_ORDER.slice()
  }
}

export { DEFAULT_TTS_MODEL, TTS_POOL_MODELS, TTS_FALLBACK_ORDER }
