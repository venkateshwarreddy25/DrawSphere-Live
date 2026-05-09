const jwt = require('jsonwebtoken')

// In-memory presence store (swap with Redis for production)
// Structure: { boardId: Map<socketId, { userId, name, socketId }> }
const boardPresence = new Map()

function getOrCreateRoom(boardId) {
  if (!boardPresence.has(boardId)) boardPresence.set(boardId, new Map())
  return boardPresence.get(boardId)
}

function getRoomUsers(boardId) {
  const room = boardPresence.get(boardId)
  if (!room) return []
  return Array.from(room.values())
}

function initSocket(io) {
  // Optional: verify JWT on connection
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret')
        socket.userId = decoded.id
      }
    } catch {
      // Allow anonymous connections for now
    }
    next()
  })

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`)

    // ── Join a board room ───────────────────────────────────────
    socket.on('join-board', ({ boardId, user }) => {
      socket.join(boardId)
      socket.currentBoard = boardId
      socket.userInfo = user

      const room = getOrCreateRoom(boardId)
      room.set(socket.id, { userId: user._id, name: user.name, socketId: socket.id })

      // Broadcast updated presence list to the room
      io.to(boardId).emit('presence-update', getRoomUsers(boardId))
      console.log(`👤 ${user.name} joined board ${boardId}`)
    })

    // ── Leave board ─────────────────────────────────────────────
    socket.on('leave-board', ({ boardId, userId }) => {
      socket.leave(boardId)
      const room = boardPresence.get(boardId)
      if (room) {
        room.delete(socket.id)
        if (room.size === 0) boardPresence.delete(boardId)
        else io.to(boardId).emit('presence-update', getRoomUsers(boardId))
      }
    })

    // ── Canvas events (draw, erase, move, clear, state) ─────────
    socket.on('canvas-event', ({ boardId, event }) => {
      // Broadcast to everyone else in the room
      socket.to(boardId).emit('canvas-event', event)
    })

    // ── Cursor movement ─────────────────────────────────────────
    socket.on('cursor-move', ({ boardId, userId, name, x, y }) => {
      socket.to(boardId).emit('cursor-move', { userId, name, x, y })
    })

    // ── Disconnect cleanup ──────────────────────────────────────
    socket.on('disconnect', () => {
      const boardId = socket.currentBoard
      if (boardId) {
        const room = boardPresence.get(boardId)
        if (room) {
          room.delete(socket.id)
          if (room.size === 0) boardPresence.delete(boardId)
          else io.to(boardId).emit('presence-update', getRoomUsers(boardId))
        }
      }
      console.log(`❌ Socket disconnected: ${socket.id}`)
    })
  })
}

module.exports = { initSocket }
