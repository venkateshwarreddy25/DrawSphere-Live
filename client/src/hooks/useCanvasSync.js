import { useEffect, useRef, useCallback } from 'react'
import { ref, onChildAdded, push, set, query, limitToLast } from 'firebase/database'
import { db } from '../firebase'
import { fabric } from 'fabric'

export function useCanvasSync(boardId, fabricRef) {
  const isRemoteRef = useRef(false)
  const ownKeysRef = useRef(new Set())      // keys we pushed → skip when onChildAdded fires
  const pathsDbRef = useRef(null)
  const batchQueueRef = useRef([])
  const flushTimeoutRef = useRef(null)

  // ── Listen for remote paths ────────────────────────────────────
  useEffect(() => {
    if (!boardId) return

    pathsDbRef.current = ref(db, `boards/${boardId}/paths`)
    const recentPathsQuery = query(pathsDbRef.current, limitToLast(500))

    const unsubPaths = onChildAdded(recentPathsQuery, (snapshot) => {
      const key = snapshot.key

      // Skip our own broadcasts
      if (ownKeysRef.current.has(key)) return

      const data = snapshot.val()
      const pathsToEnliven = data?.paths ? data.paths : (data?.path ? [data.path] : [])
      if (pathsToEnliven.length === 0) return

      // Wait until fabricRef has the canvas
      const tryApply = () => {
        const canvas = fabricRef.current
        if (!canvas) { setTimeout(tryApply, 200); return }

        isRemoteRef.current = true
        fabric.util.enlivenObjects(pathsToEnliven, (objects) => {
          objects.forEach(obj => {
            // Free-draw paths must have fill=null — Fabric defaults to black which overwrites the canvas
            if (obj.type === 'path') obj.set({ fill: null })
            obj.selectable = true
            canvas.add(obj)
          })
          canvas.renderAll()
          setTimeout(() => { isRemoteRef.current = false }, 50)
        })
      }
      tryApply()
    })

    return () => {
      unsubPaths()
      ownKeysRef.current.clear()
    }
  }, [boardId])

  // ── Emit a locally drawn path to Firebase (Batched) ───────────
  const emitPath = useCallback((pathJSON) => {
    if (!pathsDbRef.current || isRemoteRef.current) return
    const cleanPath = { ...pathJSON, fill: null }
    batchQueueRef.current.push(cleanPath)

    if (!flushTimeoutRef.current) {
      flushTimeoutRef.current = setTimeout(() => {
        if (batchQueueRef.current.length > 0) {
          const newRef = push(pathsDbRef.current)
          ownKeysRef.current.add(newRef.key)
          set(newRef, { paths: [...batchQueueRef.current], ts: Date.now() })
          batchQueueRef.current = []
        }
        flushTimeoutRef.current = null
      }, 200)
    }
  }, [])

  return { emitPath, isRemoteRef }
}
