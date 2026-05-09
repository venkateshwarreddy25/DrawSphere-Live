import { useEffect, useRef, useCallback, useState } from 'react'
import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

export function useSocket({ boardId, user, onRemoteEvent, onPresenceUpdate }) {
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState([])

  useEffect(() => {
    if (!boardId || !user) return

    const socket = io(SOCKET_URL, {
      auth: { token: localStorage.getItem('wb_token') },
      transports: ['websocket'],
    })
    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      socket.emit('join-board', { boardId, user })
    })

    socket.on('disconnect', () => setConnected(false))

    socket.on('presence-update', (users) => {
      setOnlineUsers(users)
      onPresenceUpdate?.(users)
    })

    socket.on('canvas-event', (event) => {
      onRemoteEvent?.(event)
    })

    socket.on('cursor-move', (data) => {
      // forwarded to Canvas via context / callback
      window.dispatchEvent(new CustomEvent('remote-cursor', { detail: data }))
    })

    return () => {
      socket.emit('leave-board', { boardId, userId: user._id })
      socket.disconnect()
    }
  }, [boardId, user])

  const emitCanvasEvent = useCallback((event) => {
    socketRef.current?.emit('canvas-event', { boardId, event })
  }, [boardId])

  const emitCursor = useCallback((x, y) => {
    socketRef.current?.emit('cursor-move', {
      boardId,
      userId: user?._id,
      name: user?.name,
      x,
      y,
    })
  }, [boardId, user])

  return { connected, onlineUsers, emitCanvasEvent, emitCursor }
}
