const mongoose = require('mongoose')
const { v4: uuidv4 } = require('uuid')

const BoardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    default: 'Untitled Board',
  },
  shareId: {
    type: String,
    unique: true,
    default: () => uuidv4(),
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  collaborators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  canvasState: {
    type: String, // Fabric.js JSON string
    default: null,
  },
  thumbnail: {
    type: String, // base64 data URL
    default: null,
  },
  shareCount: {
    type: Number,
    default: 0,
  },
  joinCount: {
    type: Number,
    default: 0,
  },
}, { timestamps: true })

// Index for quick lookup
BoardSchema.index({ owner: 1, updatedAt: -1 })
BoardSchema.index({ shareId: 1 })

module.exports = mongoose.model('Board', BoardSchema)
