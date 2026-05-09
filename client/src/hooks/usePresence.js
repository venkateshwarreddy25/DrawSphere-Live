import { useEffect, useState } from 'react'
import { ref, onValue, set, onDisconnect, remove } from 'firebase/database'
import { db } from '../firebase'

const COLORS = [
  '#8B5CF6', '#3B82F6', '#06B6D4', '#10B981', '#F59E0B', 
  '#EF4444', '#EC4899', '#7C3AED', '#14B8A6', '#F97316'
]

export function getUserColor(uid) {
  if (!uid) return COLORS[0]
  let hash = 0
  for (let i = 0; i < uid.length; i++) {
    hash = uid.charCodeAt(i) + ((hash << 5) - hash)
  }
  return COLORS[Math.abs(hash) % COLORS.length]
}

export function usePresence(boardId, user) {
  const [onlineUsers, setOnlineUsers] = useState({})
  const [joinedUser, setJoinedUser] = useState(null)
  const [leftUser, setLeftUser] = useState(null)

  useEffect(() => {
    if (!boardId || !user || !user._id) return

    const presenceRef = ref(db, `boards/${boardId}/presence`)
    const myPresenceRef = ref(db, `boards/${boardId}/presence/${user._id}`)

    const color = getUserColor(user._id)
    const myData = {
      uid: user._id,
      name: user.name || 'Anonymous',
      email: user.email || '',
      color,
      joinedAt: Date.now()
    }

    try {
      onDisconnect(myPresenceRef).remove().then(() => {
        set(myPresenceRef, myData)
      })
    } catch (e) {
      console.warn('[usePresence] Firebase RTDB not available:', e.message)
    }

    const unsubscribe = onValue(presenceRef, (snapshot) => {
      const data = snapshot.val() || {}
      
      setOnlineUsers((prev) => {
        const prevUids = Object.keys(prev)
        const currUids = Object.keys(data)
        
        currUids.forEach(uid => {
          if (!prevUids.includes(uid) && uid !== user._id) {
            setJoinedUser({ ...data[uid], ts: Date.now() })
          }
        })
        
        prevUids.forEach(uid => {
          if (!currUids.includes(uid) && uid !== user._id) {
            setLeftUser({ ...prev[uid], ts: Date.now() })
          }
        })

        return data
      })
    })

    return () => {
      unsubscribe()
      remove(myPresenceRef)
    }
  }, [boardId, user])

  return { onlineUsers, joinedUser, leftUser }
}
