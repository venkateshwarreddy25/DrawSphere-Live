const express = require('express')
const Board = require('../models/Board')
const auth = require('../middleware/auth')

const router = express.Router()
router.use(auth)

// GET /api/boards — list user's boards
router.get('/', async (req, res) => {
  const boards = await Board.find({ owner: req.user._id })
    .sort({ updatedAt: -1 })
    .select('-canvasState')
  res.json(boards)
})

// POST /api/boards — create board
router.post('/', async (req, res) => {
  const { name, canvasState } = req.body
  const board = await Board.create({ name: name || 'Untitled Board', owner: req.user._id, canvasState })
  res.status(201).json(board)
})

// GET /api/boards/:id — get single board, auto-add as collaborator
router.get('/:id', async (req, res) => {
  let board = await Board.findById(req.params.id)
  if (!board) return res.status(404).json({ message: 'Board not found' })

  const uid = req.user._id
  const isOwner = board.owner.equals(uid)
  const isCollab = board.collaborators.some(c => c.equals(uid))

  // Auto-join: add as collaborator if not already owner/collaborator
  if (!isOwner && !isCollab) {
    board.collaborators.push(uid)
    board.joinCount = (board.joinCount || 0) + 1
    await board.save()
  }

  res.json(board)
})

// POST /api/boards/:id/analytics — increment share count
router.post('/:id/analytics', async (req, res) => {
  const { type } = req.body
  if (type === 'share') {
    await Board.findByIdAndUpdate(req.params.id, { $inc: { shareCount: 1 } })
  }
  res.json({ success: true })
})

// PATCH /api/boards/:id — update canvas state
router.patch('/:id', async (req, res) => {
  const { canvasState, name, thumbnail } = req.body
  const board = await Board.findOneAndUpdate(
    { _id: req.params.id, $or: [{ owner: req.user._id }, { collaborators: req.user._id }] },
    { ...(canvasState !== undefined && { canvasState }), ...(name && { name }), ...(thumbnail && { thumbnail }) },
    { new: true }
  )
  if (!board) return res.status(404).json({ message: 'Board not found' })
  res.json({ success: true })
})

// DELETE /api/boards/:id
router.delete('/:id', async (req, res) => {
  const board = await Board.findOneAndDelete({ _id: req.params.id, owner: req.user._id })
  if (!board) return res.status(404).json({ message: 'Board not found or not authorized' })
  res.json({ success: true })
})

// GET /api/boards/share/:shareId — join via share link
router.get('/share/:shareId', async (req, res) => {
  const board = await Board.findOne({ shareId: req.params.shareId }).select('-canvasState')
  if (!board) return res.status(404).json({ message: 'Board not found' })

  // Add as collaborator if not already
  if (!board.collaborators.includes(req.user._id) && !board.owner.equals(req.user._id)) {
    board.collaborators.push(req.user._id)
    await board.save()
  }

  res.json({ boardId: board._id })
})

module.exports = router
