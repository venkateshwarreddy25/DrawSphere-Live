import { useRef, useEffect, useCallback } from 'react'
import { useCanvas } from '../hooks/useCanvas'
import { useCanvasSync } from '../hooks/useCanvasSync'

export default function Canvas({
  tool, color, strokeWidth,
  onCanvasReady, onCanvasChange,
  emitCursor, boardId,
}) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)

  const {
    fabricRef, undo, redo, clearCanvas,
    loadFromJSON, exportPNG, getImageData,
    applyRemoteEvent, addShapesFromAI,
    canUndo, canRedo, serialize,
  } = useCanvas({ canvasRef, tool, color, strokeWidth, onCanvasChange })

  // ── Real-time canvas sync via Firebase RTDB ───────────────────
  const { emitPath, isRemoteRef } = useCanvasSync(boardId, fabricRef)

  // ── Listen for locally drawn paths and emit to Firebase ───────
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return

    const handlePathCreated = (e) => {
      if (isRemoteRef.current) return   // don't re-broadcast remote paths
      const pathJSON = e.path?.toJSON?.()
      if (pathJSON) emitPath(pathJSON)
    }

    canvas.on('path:created', handlePathCreated)
    return () => canvas.off('path:created', handlePathCreated)
  }, [fabricRef.current, emitPath, isRemoteRef])

  // ── Expose API methods + fabricRef to Board.jsx ───────────────
  useEffect(() => {
    onCanvasReady?.(
      { loadFromJSON, applyRemoteEvent, addShapesFromAI, getImageData, exportPNG, undo, redo, clearCanvas, canUndo, canRedo, serialize },
      fabricRef
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [undo, redo, canUndo, canRedo])

  // ── Keyboard shortcuts ────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault(); undo()
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault(); redo()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [undo, redo])

  // ── Cursor tracking ───────────────────────────────────────────
  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    emitCursor?.(e.clientX - rect.left, e.clientY - rect.top)
  }, [emitCursor])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute', inset: 0,
        cursor:
          tool === 'eraser' ? 'cell' :
          tool === 'text'   ? 'text' :
          tool === 'select' ? 'default' : 'crosshair',
      }}
      onMouseMove={handleMouseMove}
    >
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  )
}
