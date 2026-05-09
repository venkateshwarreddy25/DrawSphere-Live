import { useEffect, useState, useRef, useCallback } from 'react'
import { ref, onValue, set, onDisconnect, remove } from 'firebase/database'
import { db } from '../firebase'
import { getUserColor } from './usePresence'

export function useCursors(boardId, user) {
  const [cursors, setCursors] = useState({})
  const [userCount, setUserCount] = useState(0)
  const lastWriteRef = useRef(0)
  const myCursorRef = useRef(null)

  useEffect(() => {
    if (!boardId || !user || !user._id) return
    const isMobile = window.matchMedia("(max-width: 768px)").matches
    if (isMobile) return

    myCursorRef.current = ref(db, `boards/${boardId}/cursors/${user._id}`)
    const cursorsRef = ref(db, `boards/${boardId}/cursors`)

    onDisconnect(myCursorRef.current).remove()

    const unsubscribe = onValue(cursorsRef, (snapshot) => {
      const data = snapshot.val() || {}
      delete data[user._id]
      setUserCount(Object.keys(data).length + 1)
      setCursors(data)
    })

    return () => {
      unsubscribe()
      if (myCursorRef.current) remove(myCursorRef.current)
    }
  }, [boardId, user])

  const emitCursor = useCallback((x, y) => {
    if (!myCursorRef.current || !user) return
    const now = Date.now()
    const throttleMs = userCount > 10 ? 100 : 50
    if (now - lastWriteRef.current < throttleMs) return
    lastWriteRef.current = now

    set(myCursorRef.current, {
      x, y,
      uid: user._id,
      name: user.name || 'Anonymous',
      color: getUserColor(user._id),
      ts: now
    })
  }, [user])

  return { cursors, emitCursor }
}
