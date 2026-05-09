const express = require('express')
const axios = require('axios')
const FormData = require('form-data')

const router = express.Router()
// ── NO auth middleware on AI routes ──────────────────────────────
// AI routes call external APIs and don't access user data

const GROQ_BASE = 'https://api.groq.com/openai/v1'

// ── Startup key check ─────────────────────────────────────────────
if (!process.env.GROQ_API_KEY) {
  console.warn('⚠️  GROQ_API_KEY is not set — AI features will use fallback mode')
}

// ─── Groq chat helper ──────────────────────────────────────────────
async function groqChat(systemPrompt, userMessage, model = 'llama-3.3-70b-versatile') {
  const resp = await axios.post(
    `${GROQ_BASE}/chat/completions`,
    {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 2048,
      temperature: 0.2,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  )
  return resp.data.choices[0].message.content
}

// ─── Clean JSON from LLM output ────────────────────────────────────
function extractJSON(raw) {
  let s = raw.trim()
  // Strip markdown code fences
  s = s.replace(/^```(?:json)?\s*/im, '').replace(/\s*```\s*$/im, '').trim()
  // Find the JSON array
  const start = s.indexOf('[')
  const end = s.lastIndexOf(']')
  if (start !== -1 && end !== -1) s = s.slice(start, end + 1)
  return JSON.parse(s)
}

// ─── Fallback diagram (no API key needed) ─────────────────────────
function buildFallbackDiagram(prompt) {
  const words = prompt.split(/\s+/).filter(w => w.length > 3).slice(0, 5)
  if (words.length === 0) words.push('Node', 'Step', 'Result')
  const colors = ['#7C3AED', '#3B82F6', '#22C55E', '#F59E0B', '#EF4444']
  const shapes = []

  words.forEach((word, i) => {
    const x = 80 + i * 190
    const y = 120
    shapes.push({
      id: `node_${i}`, type: 'rect',
      x, y, width: 150, height: 60,
      label: word[0].toUpperCase() + word.slice(1),
      fill: colors[i % colors.length],
    })
    if (i > 0) {
      shapes.push({
        id: `arrow_${i}`, type: 'arrow',
        x1: x - 40, y1: 150, x2: x, y2: 150,
        label: '', fill: '#9CA3AF',
      })
    }
  })

  shapes.unshift({
    id: 'title', type: 'text',
    x: 80, y: 60, width: 400, height: 40,
    label: prompt.slice(0, 50), fill: '#F8F8FF',
  })

  return shapes
}

// ─── POST /api/ai/diagram ──────────────────────────────────────────
router.post('/diagram', async (req, res) => {
  try {
    const { prompt } = req.body
    if (!prompt?.trim()) return res.status(400).json({ error: 'prompt is required' })

    console.log(`[AI/diagram] prompt: "${prompt.slice(0, 60)}"`)

    if (!process.env.GROQ_API_KEY) {
      console.log('[AI/diagram] No Groq key — using fallback')
      return res.json({ shapes: buildFallbackDiagram(prompt), source: 'fallback' })
    }

    const system = `You are a diagram generator. Return ONLY a raw JSON array with no markdown, no backticks, no explanation. Each object must have:
- id: unique string
- type: "rect" | "circle" | "text" | "arrow"  
- For rect/circle/text: x (100-700), y (100-450), width (100-180), height (50-90), label (string), fill (hex color)
- For arrow: x1, y1, x2, y2 (numbers), label (string), fill (hex color like #9CA3AF)
Use vivid colors. Place shapes logically. Arrows should connect related shapes. Return 4-8 shapes minimum.`

    const raw = await groqChat(system, `Generate a diagram for: ${prompt}`)
    console.log('[AI/diagram] raw (first 300 chars):', raw.slice(0, 300))

    let shapes
    try {
      shapes = extractJSON(raw)
    } catch (parseErr) {
      console.error('[AI/diagram] JSON parse failed:', parseErr.message)
      console.error('[AI/diagram] raw was:', raw)
      shapes = buildFallbackDiagram(prompt)
    }

    console.log(`[AI/diagram] returning ${shapes.length} shapes`)
    res.json({ shapes, source: 'groq' })

  } catch (err) {
    console.error('[AI/diagram] error:', err.response?.data || err.message)
    // Even on Groq error, return fallback shapes instead of 500
    const { prompt = 'diagram' } = req.body
    res.json({ shapes: buildFallbackDiagram(prompt), source: 'fallback', warning: err.message })
  }
})

// ─── POST /api/ai/summarize ────────────────────────────────────────
router.post('/summarize', async (req, res) => {
  try {
    const { texts } = req.body
    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ error: 'texts array required' })
    }

    const combined = texts.join('\n')

    if (!process.env.GROQ_API_KEY) {
      const preview = combined.slice(0, 100)
      return res.json({ summary: `Summary: ${preview}${combined.length > 100 ? '...' : ''}`, source: 'fallback' })
    }

    const system = 'Summarize the following notes in exactly 2 sentences. Return only the summary text, no preamble, no formatting.'
    const summary = await groqChat(system, combined)

    res.json({ summary: summary.trim(), source: 'groq' })
  } catch (err) {
    console.error('[AI/summarize] error:', err.response?.data || err.message)
    res.status(500).json({ error: err.message })
  }
})

// ─── POST /api/ai/ocr ─────────────────────────────────────────────
router.post('/ocr', async (req, res) => {
  try {
    const { imageBase64 } = req.body
    if (!imageBase64) return res.status(400).json({ error: 'imageBase64 required' })

    if (!process.env.GROQ_API_KEY) {
      return res.json({ text: '(OCR requires GROQ_API_KEY in server/.env)', source: 'fallback' })
    }

    // Use Groq vision model
    const resp = await axios.post(
      `${GROQ_BASE}/chat/completions`,
      {
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: 'Extract all text visible in this whiteboard image. Return only the extracted text. If nothing found say "(No text detected)".' },
            { type: 'image_url', image_url: { url: imageBase64 } },
          ],
        }],
        max_tokens: 500,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    )

    const text = resp.data.choices[0].message.content?.trim() || '(No text detected)'
    res.json({ text, source: 'groq' })

  } catch (err) {
    console.error('[AI/ocr] error:', err.response?.data || err.message)
    res.status(500).json({ error: 'OCR failed: ' + (err.response?.data?.error?.message || err.message) })
  }
})

// ─── POST /api/ai/voice ────────────────────────────────────────────
router.post('/voice', async (req, res) => {
  try {
    const { audioBase64, mimeType } = req.body
    if (!audioBase64) return res.status(400).json({ error: 'audioBase64 required' })

    if (!process.env.GROQ_API_KEY) {
      const shapes = buildFallbackDiagram('voice diagram process flow step')
      return res.json({ transcript: '(GROQ_API_KEY not set)', shapes, source: 'fallback' })
    }

    // 1. Transcribe with Groq Whisper
    const audioBuffer = Buffer.from(audioBase64, 'base64')
    const ext = mimeType?.includes('ogg') ? 'ogg' : mimeType?.includes('mp4') ? 'mp4' : 'webm'

    const form = new FormData()
    form.append('file', audioBuffer, { filename: `audio.${ext}`, contentType: mimeType || 'audio/webm' })
    form.append('model', 'whisper-large-v3')
    form.append('language', 'en')
    form.append('response_format', 'json')

    const whisperResp = await axios.post(
      `${GROQ_BASE}/audio/transcriptions`,
      form,
      {
        headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, ...form.getHeaders() },
        timeout: 60000,
      }
    )

    const transcript = whisperResp.data.text?.trim()
    if (!transcript) return res.status(500).json({ error: 'No transcript returned' })

    console.log('[AI/voice] transcript:', transcript)

    // 2. Generate diagram from transcript
    const system = `You are a diagram generator. Return ONLY a raw JSON array with no markdown, no backticks. Each object: id, type (rect|circle|text|arrow), x,y,width,height,label,fill. For arrow: x1,y1,x2,y2,label,fill.`
    let shapes
    try {
      const raw = await groqChat(system, `Create a diagram for: ${transcript}`)
      shapes = extractJSON(raw)
    } catch {
      shapes = buildFallbackDiagram(transcript)
    }

    res.json({ transcript, shapes, source: 'groq' })

  } catch (err) {
    console.error('[AI/voice] error:', err.response?.data || err.message)
    res.status(500).json({ error: 'Voice processing failed: ' + (err.response?.data?.error?.message || err.message) })
  }
})

module.exports = router
