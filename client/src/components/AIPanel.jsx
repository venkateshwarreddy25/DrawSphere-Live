import { useState, useRef, useCallback } from 'react'
import { fabric } from 'fabric'

import { apiPost } from '../utils/api'

// ── Backend URL check ─────────────────────
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || ''

// ── Toast ──────────────────────────────────────────────────────────
function Toast({ message, type }) {
  if (!message) return null
  return (
    <div style={{
      position: 'fixed', bottom: '28px', left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, display: 'flex', alignItems: 'center', gap: '8px',
      background: type === 'success' ? '#22C55E' : '#EF4444',
      color: 'white', padding: '12px 24px', borderRadius: '9999px',
      fontWeight: '700', fontSize: '14px', fontFamily: 'Outfit, sans-serif',
      boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
      animation: 'slideInUp 0.3s ease',
      whiteSpace: 'nowrap', maxWidth: '90vw', overflow: 'hidden', textOverflow: 'ellipsis',
    }}>
      {message}
    </div>
  )
}

// ── Accordion Section ──────────────────────────────────────────────
function Section({ id, title, open, onToggle, children }) {
  const handleTouch = (e) => {
    if (e.cancelable) e.preventDefault();
    onToggle(id);
  }
  return (
    <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '2px solid #E5E7EB', overflow: 'hidden', marginBottom: '10px' }}>
      <button
        onClick={() => onToggle(id)}
        onTouchEnd={handleTouch}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
          padding: '14px 18px', background: 'transparent', border: 'none',
          cursor: 'pointer', color: '#111827', fontFamily: 'Outfit, sans-serif',
        }}
        onMouseOver={e => (e.currentTarget.style.background = '#F9FAFB')}
        onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
      >
        <span style={{ flex: 1, textAlign: 'left', fontWeight: '700', fontSize: '15px' }}>{title}</span>
        <span style={{ transition: 'transform 0.25s', transform: open ? 'rotate(180deg)' : 'rotate(0)', fontSize: '12px', color: '#9CA3AF' }}>{open ? '▲' : '▼'}</span>
      </button>
      <div style={{ maxHeight: open ? '500px' : '0', overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
        <div style={{ padding: '4px 18px 18px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

// ── Spinner ────────────────────────────────────────────────────────
function Spinner() {
  return <span className="spin" style={{ display: 'inline-block', width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white' }} />
}

import { IconX } from '@tabler/icons-react'

// ── Main AIPanel ───────────────────────────────────────────────────
export default function AIPanel({ fabricRef, onShapesGenerated, onClose }) {
  const [openSection, setOpenSection] = useState('diagram')
  const [toast, setToast] = useState({ message: '', type: 'success' })
  const isMobile = window.matchMedia('(max-width: 768px)').matches

  // Diagram
  const [diagramPrompt, setDiagramPrompt] = useState('')
  const [diagramLoading, setDiagramLoading] = useState(false)

  // OCR
  const [ocrLoading, setOcrLoading] = useState(false)

  // Summarizer
  const [summaryInput, setSummaryInput] = useState('')
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryResult, setSummaryResult] = useState('')

  // Voice
  const [recording, setRecording] = useState(false)
  const [voiceLoading, setVoiceLoading] = useState(false)
  const [transcript, setTranscript] = useState('')
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])

  // ── Toast helper ────────────────────────────────────────────────
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast({ message: '', type: 'success' }), 3500)
  }, [])

  // ── Get canvas instance (Board.jsx stores the actual Fabric.Canvas here) ──
  const canvas = () => fabricRef?.current

  // ── Place AI shapes on canvas ───────────────────────────────────
  const renderShapes = useCallback((shapes) => {
    const c = canvas()
    if (!c || !Array.isArray(shapes)) return

    const cw = c.getWidth() || 800
    const ch = c.getHeight() || 600
    const offsetX = cw / 2 - 350
    const offsetY = ch / 2 - 200

    shapes.forEach((s) => {
      const x = (s.x || 0) + offsetX
      const y = (s.y || 0) + offsetY
      const col = s.fill || s.color || '#7C3AED'
      const label = s.label || ''

      if (s.type === 'rect') {
        const rect = new fabric.Rect({
          left: x, top: y,
          width: s.width || 140, height: s.height || 60,
          fill: 'transparent', stroke: col, strokeWidth: 2, rx: 8, ry: 8,
        })
        const text = new fabric.IText(label, {
          left: x + (s.width || 140) / 2, top: y + (s.height || 60) / 2,
          fontSize: 13, fill: col, fontFamily: 'Outfit, sans-serif',
          originX: 'center', originY: 'center',
        })
        c.add(rect, text)

      } else if (s.type === 'circle') {
        const r = (s.width || 80) / 2
        const circ = new fabric.Circle({
          left: x, top: y, radius: r,
          fill: 'transparent', stroke: col, strokeWidth: 2,
        })
        const text = new fabric.IText(label, {
          left: x + r, top: y + r,
          fontSize: 13, fill: col, fontFamily: 'Outfit, sans-serif',
          originX: 'center', originY: 'center',
        })
        c.add(circ, text)

      } else if (s.type === 'text') {
        c.add(new fabric.IText(label, {
          left: x, top: y,
          fontSize: s.height || 18, fill: col, fontFamily: 'Outfit, sans-serif', fontWeight: '600',
        }))

      } else if (s.type === 'arrow') {
        const x1 = (s.x1 ?? s.fromX ?? s.x ?? 0) + offsetX
        const y1 = (s.y1 ?? s.fromY ?? s.y ?? 0) + offsetY
        const x2 = (s.x2 ?? s.toX ?? (s.x ?? 0) + 120) + offsetX
        const y2 = (s.y2 ?? s.toY ?? s.y ?? 0) + offsetY
        const angle = Math.atan2(y2 - y1, x2 - x1)

        c.add(new fabric.Line([x1, y1, x2, y2], {
          stroke: col, strokeWidth: 2, strokeLineCap: 'round',
        }))
        c.add(new fabric.Triangle({
          left: x2, top: y2,
          angle: (angle * 180) / Math.PI + 90,
          width: 12, height: 14,
          fill: col, originX: 'center', originY: 'center',
        }))
      }
    })
    c.renderAll()
    onShapesGenerated?.()
  }, [fabricRef, onShapesGenerated])

  // ── DIAGRAM ─────────────────────────────────────────────────────
  const handleGenerateDiagram = async () => {
    if (!BACKEND_URL) {
      showToast('AI features are not configured. Contact the admin.', 'error')
      return
    }
    if (!diagramPrompt.trim()) { showToast('Please enter a prompt', 'error'); return }
    setDiagramLoading(true)
    try {
      const data = await apiPost('/ai/diagram', { prompt: diagramPrompt })
      if (!Array.isArray(data.shapes)) throw new Error('No shapes in response')
      renderShapes(data.shapes)
      setDiagramPrompt('')
      showToast(`✨ Diagram generated (${data.shapes.length} shapes)`, 'success')
    } catch (e) {
      console.error('[diagram]', e)
      showToast('Failed: ' + e.message, 'error')
    } finally {
      setDiagramLoading(false)
    }
  }

  // ── OCR ─────────────────────────────────────────────────────────
  const handleOCR = async () => {
    if (!BACKEND_URL) {
      showToast('AI features are not configured. Contact the admin.', 'error')
      return
    }
    const c = canvas()
    if (!c) { showToast('Canvas not ready', 'error'); return }
    setOcrLoading(true)
    try {
      const imageBase64 = c.toDataURL({ format: 'png', quality: 0.85 })
      const data = await apiPost('/ai/ocr', { imageBase64 })
      // Place extracted text on canvas
      c.add(new fabric.IText(data.text || '(No text found)', {
        left: c.getWidth() / 2 - 160, top: c.getHeight() / 2,
        fontSize: 16, fill: '#F8F8FF', fontFamily: 'Outfit, sans-serif', width: 320,
      }))
      c.renderAll()
      onShapesGenerated?.()
      showToast('Text extracted!', 'success')
    } catch (e) {
      console.error('[ocr]', e)
      showToast('OCR failed: ' + e.message, 'error')
    } finally {
      setOcrLoading(false)
    }
  }

  // ── SUMMARIZE ────────────────────────────────────────────────────
  const handleSummarize = async () => {
    if (!BACKEND_URL) {
      showToast('AI features are not configured. Contact the admin.', 'error')
      return
    }
    if (!summaryInput.trim()) { showToast('Enter text to summarize', 'error'); return }
    setSummaryLoading(true)
    setSummaryResult('')
    try {
      const data = await apiPost('/ai/summarize', { texts: [summaryInput] })
      setSummaryResult(data.summary)

      // Add sticky note to canvas
      const c = canvas()
      if (c) {
        const cx = c.getWidth() / 2
        const cy = c.getHeight() / 2
        c.add(new fabric.Rect({ left: cx - 140, top: cy - 60, width: 280, height: 120, fill: '#FEF08A', stroke: '#D97706', strokeWidth: 1.5, rx: 8 }))
        c.add(new fabric.IText(data.summary, { left: cx - 128, top: cy - 48, fontSize: 13, fill: '#1A1A1A', fontFamily: 'Outfit, sans-serif', width: 256 }))
        c.renderAll()
        onShapesGenerated?.()
      }
      showToast('Summary created!', 'success')
    } catch (e) {
      console.error('[summarize]', e)
      showToast('Summarize failed: ' + e.message, 'error')
    } finally {
      setSummaryLoading(false)
    }
  }

  const handleUseSelected = () => {
    const c = canvas()
    if (!c) return
    const texts = c.getActiveObjects()
      .filter(o => o.type === 'i-text' || o.type === 'text')
      .map(o => o.text).filter(Boolean)
    if (!texts.length) { showToast('Select text objects first', 'error'); return }
    setSummaryInput(prev => (prev ? prev + '\n' : '') + texts.join('\n'))
    setOpenSection('summary')
  }

  // ── VOICE ────────────────────────────────────────────────────────
  const handleToggleRecording = async () => {
    if (recording) {
      mediaRecorderRef.current?.stop()
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []

      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        setRecording(false)
        setVoiceLoading(true)
        try {
          const mimeType = recorder.mimeType || 'audio/webm'
          const blob = new Blob(chunksRef.current, { type: mimeType })
          const reader = new FileReader()
          reader.readAsDataURL(blob)
          reader.onloadend = async () => {
            if (!BACKEND_URL) {
              setVoiceLoading(false)
              showToast('AI features are not configured. Contact the admin.', 'error')
              return
            }
            const audioBase64 = reader.result.split(',')[1]
            const data = await apiPost('/ai/voice', { audioBase64, mimeType })
            setTranscript(data.transcript || '')
            if (Array.isArray(data.shapes)) {
              renderShapes(data.shapes)
              showToast(`Heard: "${(data.transcript || '').slice(0, 40)}"`, 'success')
            }
            setVoiceLoading(false)
          }
          reader.onerror = () => { showToast('Could not read audio', 'error'); setVoiceLoading(false) }
        } catch (e) {
          console.error('[voice]', e)
          showToast('Voice failed: ' + e.message, 'error')
          setVoiceLoading(false)
        }
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setRecording(true)
    } catch {
      showToast('Microphone access denied', 'error')
    }
  }

  // ── Shared button style ─────────────────────────────────────────
  const btnPrimary = (loading) => ({
    width: '100%', padding: '12px', borderRadius: '9999px',
    background: loading ? '#9D4EDD' : 'linear-gradient(135deg, #D916D0, #7C3AED)',
    color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
    fontFamily: 'Outfit, sans-serif', fontWeight: '700', fontSize: '14px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    opacity: loading ? 0.7 : 1, transition: 'all 0.2s',
  })
  const btnSecondary = {
    padding: '10px 16px', borderRadius: '9999px',
    background: 'transparent', border: '2px solid #E5E7EB',
    color: '#374151', cursor: 'pointer',
    fontFamily: 'Outfit, sans-serif', fontWeight: '600', fontSize: '13px',
    transition: 'all 0.2s',
  }
  const textarea = {
    width: '100%', padding: '12px 14px', borderRadius: '12px',
    background: '#F9FAFB', border: '2px solid #E5E7EB',
    color: '#111827', fontFamily: 'Outfit, sans-serif', fontSize: '14px',
    resize: 'vertical', outline: 'none', minHeight: '90px',
    boxSizing: 'border-box',
  }

  const panelContent = (
    <>
      <Toast message={toast.message} type={toast.type} />
      <div 
        className={isMobile ? 'mobile-bottom-sheet' : ''}
        style={{
        width: isMobile ? '100vw' : '320px', flexShrink: 0, height: isMobile ? '70dvh' : '100%',
        background: '#F9FAFB', borderLeft: isMobile ? 'none' : '1px solid #E5E7EB',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        ...(isMobile ? { zIndex: 900, borderTopLeftRadius: '24px', borderTopRightRadius: '24px' } : {})
      }}>
        {isMobile && (
          <div style={{ width: '100%', background: 'white', paddingTop: '16px', display: 'flex', justifyContent: 'center', borderTopLeftRadius: '24px', borderTopRightRadius: '24px' }}>
            <div style={{ width: '40px', height: '4px', background: '#D1D5DB', borderRadius: '2px' }} />
          </div>
        )}
        {/* Header */}
        <div style={{ padding: '20px 24px', background: 'white', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.5px' }}>AI Assistant</h2>
            <p style={{ margin: 0, fontSize: '12px', color: '#6B7280', fontFamily: 'Outfit, sans-serif', marginTop: '2px' }}>Powered by Groq Llama 3.3</p>
          </div>
          {isMobile && (
            <button onClick={onClose} className="btn btn-icon" style={{ padding: '4px' }}>
              <IconX size={20} />
            </button>
          )}
        </div>

        {/* Sections */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>

          {/* DIAGRAM GENERATOR */}
          <Section id="diagram" title="Diagram Generator" open={openSection === 'diagram'} onToggle={setOpenSection}>
            <textarea
              style={textarea}
              placeholder='e.g. "A login flow with registration, login, and dashboard steps"'
              value={diagramPrompt}
              onChange={e => setDiagramPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleGenerateDiagram() }}
            />
            <button style={btnPrimary(diagramLoading)} onClick={handleGenerateDiagram} disabled={diagramLoading}>
              {diagramLoading ? <><Spinner /> Generating...</> : 'Generate Diagram'}
            </button>
          </Section>

          {/* HANDWRITING TO TEXT */}
          <Section id="ocr" title="Handwriting to Text" open={openSection === 'ocr'} onToggle={setOpenSection}>
            <p style={{ margin: 0, fontSize: '13px', color: '#6B7280', fontFamily: 'Outfit, sans-serif', lineHeight: 1.5 }}>
              Captures the canvas and extracts all visible text using Groq vision AI.
            </p>
            <button style={btnPrimary(ocrLoading)} onClick={handleOCR} disabled={ocrLoading}>
              {ocrLoading ? <><Spinner /> Reading...</> : 'Read Handwriting'}
            </button>
          </Section>

          {/* SUMMARIZER */}
          <Section id="summary" title="Summarizer" open={openSection === 'summary'} onToggle={setOpenSection}>
            <button style={btnSecondary} onClick={handleUseSelected}>
              Use Selected Text
            </button>
            <textarea
              style={textarea}
              placeholder='Paste notes here or select text objects on canvas above...'
              value={summaryInput}
              onChange={e => setSummaryInput(e.target.value)}
            />
            <button style={btnPrimary(summaryLoading)} onClick={handleSummarize} disabled={summaryLoading}>
              {summaryLoading ? <><Spinner /> Summarizing...</> : 'Summarize'}
            </button>
            {summaryResult && (
              <div style={{
                background: '#FEF9C3', border: '1px solid #D97706', borderRadius: '10px',
                padding: '12px', fontSize: '13px', color: '#1A1A1A',
                fontFamily: 'Outfit, sans-serif', lineHeight: 1.5,
              }}>
                <strong style={{ color: '#D97706', display: 'block', marginBottom: '4px' }}>Summary:</strong>
                {summaryResult}
              </div>
            )}
          </Section>

          {/* VOICE TO DIAGRAM */}
          <Section id="voice" title="Voice to Diagram" open={openSection === 'voice'} onToggle={setOpenSection}>
            <p style={{ margin: 0, fontSize: '13px', color: '#6B7280', fontFamily: 'Outfit, sans-serif', lineHeight: 1.5 }}>
              Describe your diagram out loud. Click the button to start recording.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', padding: '8px 0' }}>
              <button
                onClick={handleToggleRecording}
                disabled={voiceLoading}
                style={{
                  width: '72px', height: '72px', borderRadius: '50%',
                  border: '3px solid', borderColor: recording ? '#EF4444' : '#E5E7EB',
                  cursor: voiceLoading ? 'not-allowed' : 'pointer',
                  background: recording ? '#EF4444' : 'white',
                  color: recording ? 'white' : '#374151',
                  fontWeight: '700', fontSize: '13px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: recording
                    ? '0 0 0 6px rgba(239,68,68,0.15)'
                    : '0 2px 8px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s',
                  animation: recording ? 'pulse 1.5s infinite' : 'none',
                }}
              >
                {voiceLoading ? <Spinner /> : recording ? 'Stop' : 'Rec'}
              </button>
              <p style={{
                margin: 0, fontSize: '13px', fontWeight: '700', fontFamily: 'Outfit, sans-serif',
                color: recording ? '#EF4444' : voiceLoading ? '#D916D0' : '#6B7280',
              }}>
                {voiceLoading ? 'Processing...' : recording ? 'Recording — click to stop' : 'Click to start recording'}
              </p>
              {transcript && (
                <div style={{
                  background: 'white', border: '1px solid #E5E7EB', borderRadius: '10px',
                  padding: '10px', fontSize: '12px', color: '#374151',
                  fontFamily: 'Outfit, sans-serif', lineHeight: 1.5, width: '100%',
                }}>
                  <strong>Heard:</strong> {transcript}
                </div>
              )}
            </div>
          </Section>
        </div>
      </div>
    </>
  )

  if (isMobile) {
    return (
      <div className="modal-overlay" onClick={onClose} style={{ zIndex: 999, alignItems: 'flex-end' }}>
        <div onClick={e => e.stopPropagation()} style={{ width: '100%', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          {panelContent}
        </div>
      </div>
    )
  }

  return panelContent
}
