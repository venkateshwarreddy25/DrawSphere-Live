require('dotenv').config()
require('express-async-errors')

const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const mongoose = require('mongoose')

const authRoutes = require('./routes/auth')
const boardRoutes = require('./routes/boards')
const aiRoutes = require('./routes/ai')
const { initSocket } = require('./socket/socketHandlers')

const app = express()
const server = http.createServer(app)

// ─── CORS helper — allows any localhost port + Vercel + CLIENT_URL ──
const isAllowedOrigin = (origin) => {
  if (!origin) return true
  if (origin.startsWith('http://localhost:')) return true
  if (origin.startsWith('http://127.0.0.1:')) return true
  if (origin.includes('.vercel.app')) return true
  if (process.env.CLIENT_URL && origin.startsWith(process.env.CLIENT_URL)) return true
  if (process.env.FRONTEND_URL && origin.startsWith(process.env.FRONTEND_URL)) return true
  if (process.env.ALLOWED_ORIGIN && origin.startsWith(process.env.ALLOWED_ORIGIN)) return true
  return false
}

const corsOptions = {
  origin: (origin, callback) => {
    isAllowedOrigin(origin) ? callback(null, true) : callback(new Error(`CORS blocked: ${origin}`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}

// ─── Socket.io ───────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
initSocket(io)

// ─── Middleware ──────────────────────────────────────────────────────
app.use(cors({ origin: true, credentials: true }))
app.options('*', cors({ origin: true, credentials: true }))
app.use(helmet({ contentSecurityPolicy: false }))
app.use(morgan('dev'))
app.use(express.json({ limit: '20mb' }))
app.use(express.urlencoded({ extended: true, limit: '20mb' }))

// ─── Routes ──────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', app: 'DrawSphere' }))
app.use('/api/auth', authRoutes)
app.use('/api/boards', boardRoutes)
app.use('/api/ai', aiRoutes)

app.get('/api/health', (req, res) => res.json({ status: 'ok', ts: Date.now() }))

// ─── Global error handler ────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[ERROR]', err.stack || err.message)
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' })
})

// ─── DB + Server start ───────────────────────────────────────────────
const PORT = process.env.PORT || 3001
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/whiteboard'

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully to', MONGO_URI.replace(/:([^:@]+)@/, ':***@'))
    server.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server listening on 0.0.0.0:${PORT}`))
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message)
    console.error(err)
    process.exit(1)
  })
