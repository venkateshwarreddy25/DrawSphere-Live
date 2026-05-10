import { useEffect, useState } from 'react'
import { ref, onValue, set, onDisconnect, remove, serverTimestamp } from 'firebase/database'
import { db } from '../firebase'

export function getUserColor(uid) {
  if (!uid) return '#7C3AED'
  let hash = 0
  for (let i = 0; i < uid.length; i++) {
    hash = uid.charCodeAt(i) + ((hash << 5) - hash)
  }
  const COLORS = ['#7C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#8B5CF6']
  return COLORS[Math.abs(hash) % COLORS.length]
}

export function usePresence(boardId, user) {
  const [onlineUsers, setOnlineUsers] = useState([])
  const [joinedUser, setJoinedUser] = useState(null)
  const [leftUser, setLeftUser] = useState(null)

  useEffect(() => {
    if (!boardId || !user || !user.uid) return

    const userUid = user.uid
    const presenceRef = ref(db, `boards/${boardId}/presence/${userUid}`)
    const allPresenceRef = ref(db, `boards/${boardId}/presence`)

    let listenerUnsubscribe = null
    let listenerSetupTimeout = null

    const setupPresence = async () => {
      try {
        const name = user.displayName || (user.email ? user.email.split('@')[0] : 'Anonymous')
        
        // Setup onDisconnect first
        await onDisconnect(presenceRef).remove()
        
        // Write presence
        await set(presenceRef, {
          uid: userUid,
          name: name,
          email: user.email || '',
          color: getUserColor(userUid),
          joinedAt: Date.now(),
          online: true
        })

        // Delay listener to ensure write propagates
        listenerSetupTimeout = setTimeout(() => {
          listenerUnsubscribe = onValue(allPresenceRef, (snapshot) => {
            if (!snapshot.exists()) {
              setOnlineUsers([])
              return
            }
            
            const data = snapshot.val()
            const usersArray = Object.values(data)
            
            setOnlineUsers(prevArray => {
              const prevUids = prevArray.map(u => u.uid)
              const currUids = usersArray.map(u => u.uid)
              
              usersArray.forEach(u => {
                if (!prevUids.includes(u.uid) && u.uid !== userUid) {
                  setJoinedUser({ ...u, ts: Date.now() })
                }
              })
              
              prevArray.forEach(u => {
                if (!currUids.includes(u.uid) && u.uid !== userUid) {
                  setLeftUser({ ...u, ts: Date.now() })
                }
              })
              
              return usersArray
            })
          })
        }, 500)

      } catch (err) {
        console.warn('Presence setup failed:', err)
      }
    }

    setupPresence()

    return () => {
      if (listenerSetupTimeout) clearTimeout(listenerSetupTimeout)
      if (listenerUnsubscribe) listenerUnsubscribe()
      remove(presenceRef).catch(() => {})
    }
  }, [boardId, user])

  return { onlineUsers, joinedUser, leftUser }
}
