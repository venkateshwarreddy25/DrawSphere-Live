import { useEffect, useRef, useCallback, useReducer } from 'react'
import { fabric } from 'fabric'

// ─── History reducer ───────────────────────────────────────────────
function historyReducer(state, action) {
  switch (action.type) {
    case 'PUSH':
      return { past: [...state.past, action.snapshot], future: [] }
    case 'UNDO': {
      if (state.past.length === 0) return state
      const newPast = state.past.slice(0, -1)
      return { past: newPast, future: [action.current, ...state.future] }
    }
    case 'REDO': {
      if (state.future.length === 0) return state
      return { past: [...state.past, action.current], future: state.future.slice(1) }
    }
    default: return state
  }
}

export function useCanvas({ canvasRef, tool, color, strokeWidth, onCanvasChange }) {
  const fabricRef = useRef(null)
  const isDrawingRef = useRef(false)
  const shapeRef = useRef(null)
  const startPointRef = useRef(null)
  const endPointRef = useRef(null)   // BUG 7: track real end point
  const skipHistoryRef = useRef(false)
  const textCreatingRef = useRef(false) // BUG 6: prevent double IText creation

  const [history, dispatchHistory] = useReducer(historyReducer, { past: [], future: [] })

  const getCanvas = () => fabricRef.current

  // ── Serialize ─────────────────────────────────────────────────
  const serialize = useCallback(() => {
    const canvas = getCanvas()
    if (!canvas) return null
    return JSON.stringify(canvas.toJSON())
  }, [])

  // ── Push history ──────────────────────────────────────────────
  const pushHistory = useCallback(() => {
    if (skipHistoryRef.current) return
    dispatchHistory({ type: 'PUSH', snapshot: serialize() })
  }, [serialize])

  // ── Init canvas ───────────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current) return
    const container = canvasRef.current.parentElement
    const isMobile = window.innerWidth < 768

    if (isMobile) {
      canvasRef.current.style.touchAction = 'none'
    }

    const canvas = new fabric.Canvas(canvasRef.current, {
      selection: true,
      preserveObjectStacking: true,
      ...(isMobile && { enablePointerEvents: true, allowTouchScrolling: false })
    })
    canvas.setBackgroundColor('#0D0D14', canvas.renderAll.bind(canvas))
    fabricRef.current = canvas

    // Resize observer — BUG 1: canvas fills its container exactly
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        canvas.setDimensions({ width, height })
        canvas.calcOffset()
        canvas.renderAll()
      }
    })

    if (container) {
      resizeObserver.observe(container)
      canvas.setDimensions({ width: container.offsetWidth, height: container.offsetHeight })
    }

    // Scroll listener for mobile offset recalc
    const handleScroll = () => { canvas.calcOffset() }
    window.addEventListener('scroll', handleScroll, { passive: true })

    // BUG 10: calcOffset after DOM settles — cancelled if effect cleans up first
    let mounted = true
    const initTid = setTimeout(() => {
      if (mounted) { 
        if (container) canvas.setDimensions({ width: container.offsetWidth, height: container.offsetHeight })
        canvas.calcOffset(); 
        canvas.renderAll(); 
      }
    }, 100)

    // History listeners
    canvas.on('object:added', () => {
      if (!skipHistoryRef.current) pushHistory()
      onCanvasChange?.(JSON.stringify(canvas.toJSON()))
    })
    canvas.on('object:modified', () => {
      pushHistory()
      onCanvasChange?.(JSON.stringify(canvas.toJSON()))
    })
    canvas.on('object:removed', () => {
      if (!skipHistoryRef.current) pushHistory()
      onCanvasChange?.(JSON.stringify(canvas.toJSON()))
    })

    return () => {
      mounted = false          // cancel pending setTimeout
      clearTimeout(initTid)
      window.removeEventListener('scroll', handleScroll)
      if (container) resizeObserver.unobserve(container)
      resizeObserver.disconnect()
      canvas.dispose()
      fabricRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRef])

  // ── Tool mode effect ──────────────────────────────────────────
  useEffect(() => {
    const canvas = getCanvas()
    if (!canvas) return

    // Remove all previous interaction listeners
    canvas.off('mouse:down')
    canvas.off('mouse:move')
    canvas.off('mouse:up')

    canvas.isDrawingMode = false
    canvas.selection = tool === 'select'
    canvas.allowTouchScrolling = tool === 'select'
    canvas.defaultCursor = 'default'
    canvas.hoverCursor = 'move'

    if (tool === 'pen') {
      canvas.isDrawingMode = true
      canvas.freeDrawingBrush.color = color
      canvas.freeDrawingBrush.width = strokeWidth
      canvas.freeDrawingBrush.shadow = new fabric.Shadow({ color: color + '44', blur: 2, offsetX: 0, offsetY: 0 })

    } else if (tool === 'eraser') {
      canvas.isDrawingMode = false
      canvas.selection = false
      canvas.defaultCursor = 'cell'
      canvas.on('mouse:down', (opt) => {
        const obj = canvas.findTarget(opt.e)
        if (obj && obj !== canvas.backgroundImage) {
          canvas.remove(obj)
          canvas.renderAll()
        }
      })

    } else if (tool === 'select') {
      canvas.selection = true
      canvas.defaultCursor = 'default'

    } else if (tool === 'text') {
      // BUG 6: Only create ONE IText per explicit click, never on re-render
      canvas.selection = false
      canvas.defaultCursor = 'text'
      canvas.hoverCursor = 'text'

      canvas.on('mouse:down', (opt) => {
        // BUG 6: Guard against double-fire
        if (textCreatingRef.current) return
        // Don't create text if clicking on an existing object
        if (opt.target) return
        textCreatingRef.current = true

        const pointer = canvas.getPointer(opt.e)
        // BUG 6: Empty string, not 'Type here...'
        const text = new fabric.IText('', {
          left: pointer.x,
          top: pointer.y,
          fill: color,
          fontSize: 18,
          fontFamily: 'Outfit, sans-serif',
          fontWeight: '500',
          padding: 4,
          editingBorderColor: 'var(--primary)',
        })
        canvas.add(text)
        canvas.setActiveObject(text)
        text.enterEditing()
        canvas.renderAll()

        // Reset guard after short delay
        setTimeout(() => { textCreatingRef.current = false }, 300)
      })

    } else if (['rect', 'circle', 'line', 'arrow'].includes(tool)) {
      canvas.selection = false
      canvas.defaultCursor = 'crosshair'
      canvas.hoverCursor = 'crosshair'

      canvas.on('mouse:down', (opt) => {
        isDrawingRef.current = true
        const pointer = canvas.getPointer(opt.e)
        startPointRef.current = { x: pointer.x, y: pointer.y }
        endPointRef.current = { x: pointer.x, y: pointer.y } // BUG 7

        const commonProps = {
          left: pointer.x, top: pointer.y,
          stroke: color, strokeWidth,
          fill: 'transparent',
          selectable: false, evented: false,
          strokeUniform: true,
        }

        let shape
        if (tool === 'rect') {
          shape = new fabric.Rect({ ...commonProps, width: 0, height: 0, rx: 4, ry: 4 })
        } else if (tool === 'circle') {
          shape = new fabric.Ellipse({ ...commonProps, rx: 0, ry: 0, originX: 'center', originY: 'center' })
        } else if (tool === 'line' || tool === 'arrow') {
          shape = new fabric.Line(
            [pointer.x, pointer.y, pointer.x, pointer.y],
            { ...commonProps, strokeLineCap: 'round' }
          )
        }

        if (shape) {
          shapeRef.current = shape
          canvas.add(shape)
          canvas.renderAll()
        }
      })

      canvas.on('mouse:move', (opt) => {
        if (!isDrawingRef.current || !shapeRef.current) return
        const pointer = canvas.getPointer(opt.e)
        const start = startPointRef.current
        const shape = shapeRef.current

        endPointRef.current = { x: pointer.x, y: pointer.y } // BUG 7: always track real end

        if (tool === 'rect') {
          const w = pointer.x - start.x
          const h = pointer.y - start.y
          shape.set({
            left: w < 0 ? pointer.x : start.x,
            top: h < 0 ? pointer.y : start.y,
            width: Math.abs(w),
            height: Math.abs(h),
          })
        } else if (tool === 'circle') {
          const rx = Math.abs(pointer.x - start.x) / 2
          const ry = Math.abs(pointer.y - start.y) / 2
          shape.set({
            left: Math.min(pointer.x, start.x) + rx,
            top: Math.min(pointer.y, start.y) + ry,
            rx, ry,
          })
        } else if (tool === 'line' || tool === 'arrow') {
          shape.set({ x2: pointer.x, y2: pointer.y })
        }

        canvas.renderAll()
      })

      canvas.on('mouse:up', (opt) => {
        if (!isDrawingRef.current) return
        isDrawingRef.current = false

        const shape = shapeRef.current
        if (!shape) return

        shape.set({ selectable: true, evented: true })

        // BUG 7: Use real tracked end point, not line.x2/line.y2
        if (tool === 'arrow') {
          const start = startPointRef.current
          const end = endPointRef.current   // real canvas coordinates

          const angle = Math.atan2(end.y - start.y, end.x - start.x)
          const arrowSize = Math.max(strokeWidth * 3, 12)

          const arrowHead = new fabric.Triangle({
            left: end.x,
            top: end.y,
            angle: (angle * 180) / Math.PI + 90,
            width: arrowSize,
            height: arrowSize * 1.2,
            fill: color,
            stroke: color,
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false,
          })
          canvas.add(arrowHead)
        }

        canvas.renderAll()
        shapeRef.current = null
        startPointRef.current = null
        endPointRef.current = null
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool, color, strokeWidth])

  // Update pen brush live without recreating listeners
  useEffect(() => {
    const canvas = getCanvas()
    if (!canvas || tool !== 'pen') return
    canvas.freeDrawingBrush.color = color
    canvas.freeDrawingBrush.width = strokeWidth
  }, [color, strokeWidth, tool])

  // ── Undo ─────────────────────────────────────────────────────
  const undo = useCallback(() => {
    const canvas = getCanvas()
    if (!canvas || history.past.length === 0) return
    const current = serialize()
    const prev = history.past[history.past.length - 1]
    dispatchHistory({ type: 'UNDO', current })
    skipHistoryRef.current = true
    canvas.loadFromJSON(prev || '{}', () => {
      canvas.renderAll()
      skipHistoryRef.current = false
      onCanvasChange?.(prev)
    })
  }, [history, serialize, onCanvasChange])

  // ── Redo ─────────────────────────────────────────────────────
  const redo = useCallback(() => {
    const canvas = getCanvas()
    if (!canvas || history.future.length === 0) return
    const current = serialize()
    const next = history.future[0]
    dispatchHistory({ type: 'REDO', current })
    skipHistoryRef.current = true
    canvas.loadFromJSON(next, () => {
      canvas.renderAll()
      skipHistoryRef.current = false
      onCanvasChange?.(next)
    })
  }, [history, serialize, onCanvasChange])

  // ── Clear canvas ──────────────────────────────────────────────
  const clearCanvas = useCallback(() => {
    const canvas = getCanvas()
    if (!canvas) return
    canvas.clear()
    canvas.setBackgroundColor('#0D0D14', canvas.renderAll.bind(canvas))
    onCanvasChange?.(JSON.stringify(canvas.toJSON()))
  }, [onCanvasChange])

  // ── Load from JSON ────────────────────────────────────────────
  const loadFromJSON = useCallback((json) => {
    const canvas = getCanvas()
    if (!canvas || !json) return
    skipHistoryRef.current = true
    canvas.loadFromJSON(json, () => {
      canvas.renderAll()
      skipHistoryRef.current = false
    })
  }, [])

  // ── Export PNG ────────────────────────────────────────────────
  const exportPNG = useCallback((options = {}) => {
    const canvas = getCanvas()
    if (!canvas) return null
    return canvas.toDataURL({ format: 'png', quality: 1, multiplier: 2, ...options })
  }, [])

  // ── Get image data (for AI OCR) ───────────────────────────────
  const getImageData = useCallback(() => {
    const canvas = getCanvas()
    if (!canvas) return null
    return canvas.toDataURL({ format: 'jpeg', quality: 0.85 })
  }, [])

  // ── Apply remote socket event ─────────────────────────────────
  const applyRemoteEvent = useCallback((event) => {
    const canvas = getCanvas()
    if (!canvas) return
    skipHistoryRef.current = true
    if (event.type === 'clear') {
      canvas.clear()
      canvas.setBackgroundColor('#0D0D14', canvas.renderAll.bind(canvas))
    } else if (event.type === 'state') {
      canvas.loadFromJSON(event.data, () => canvas.renderAll())
    }
    skipHistoryRef.current = false
  }, [])

  // ── Add AI shapes ─────────────────────────────────────────────
  const addShapesFromAI = useCallback((shapes) => {
    const canvas = getCanvas()
    if (!canvas) return

    shapes.forEach((s) => {
      let obj
      if (s.type === 'rect') {
        obj = new fabric.Rect({
          left: s.x, top: s.y, width: s.width || 120, height: s.height || 60,
          fill: s.fill || 'transparent', stroke: s.stroke || '#7289fa',
          strokeWidth: 2, rx: s.rx || 6, ry: s.rx || 6,
        })
      } else if (s.type === 'circle') {
        obj = new fabric.Circle({
          left: s.x, top: s.y, radius: s.radius || 40,
          fill: s.fill || 'transparent', stroke: s.stroke || '#7289fa', strokeWidth: 2,
        })
      } else if (s.type === 'text') {
        obj = new fabric.IText(s.text || s.label || '', {
          left: s.x, top: s.y,
          fill: s.color || '#F8F8FF', fontSize: s.fontSize || 16,
          fontFamily: 'Outfit, sans-serif', fontWeight: s.bold ? 'bold' : 'normal',
        })
      } else if (s.type === 'line') {
        obj = new fabric.Line([s.x1 ?? s.x, s.y1 ?? s.y, s.x2 ?? (s.x + 100), s.y2 ?? s.y], {
          stroke: s.stroke || '#7289fa', strokeWidth: 2, strokeLineCap: 'round',
        })
      } else if (s.type === 'arrow') {
        const x1 = s.fromX ?? s.x1 ?? s.x
        const y1 = s.fromY ?? s.y1 ?? s.y
        const x2 = s.toX ?? s.x2 ?? (s.x + 120)
        const y2 = s.toY ?? s.y2 ?? s.y
        const line = new fabric.Line([x1, y1, x2, y2], {
          stroke: s.stroke || '#7289fa', strokeWidth: 2, strokeLineCap: 'round',
        })
        const angle = Math.atan2(y2 - y1, x2 - x1)
        const arrowHead = new fabric.Triangle({
          left: x2, top: y2, angle: (angle * 180) / Math.PI + 90,
          width: 12, height: 14, fill: s.stroke || '#7289fa',
          originX: 'center', originY: 'center',
        })
        canvas.add(line)
        canvas.add(arrowHead)
        return
      } else if (s.type === 'sticky') {
        const rect = new fabric.Rect({
          left: s.x, top: s.y, width: s.width || 160, height: s.height || 80,
          fill: s.fill || '#fef08a', stroke: '#d97706', strokeWidth: 1, rx: 8, ry: 8,
        })
        const text = new fabric.IText(s.text || '', {
          left: s.x + 10, top: s.y + 10,
          fill: '#1a1a1a', fontSize: 13, fontFamily: 'Outfit, sans-serif',
          width: (s.width || 160) - 20,
        })
        const group = new fabric.Group([rect, text], { left: s.x, top: s.y })
        canvas.add(group)
        return
      }

      if (obj) canvas.add(obj)
    })
    canvas.renderAll()
  }, [])

  return {
    fabricRef,
    undo, redo,
    clearCanvas, loadFromJSON,
    exportPNG, getImageData,
    applyRemoteEvent, addShapesFromAI,
    serialize,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  }
}
