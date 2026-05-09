const express = require('express')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const User = require('../models/User')

const router = express.Router()

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' })

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password)
      return res.status(400).json({ message: 'All fields required' })

    const exists = await User.findOne({ email })
    if (exists) return res.status(409).json({ message: 'Email already in use' })

    const hashedPassword = await bcrypt.hash(password, 12)
    const user = await User.create({ name, email, password: hashedPassword })
    const token = signToken(user._id)

    res.status(201).json({
      token,
      user: { _id: user._id, name: user.name, email: user.email },
    })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password required' })

    const user = await User.findOne({ email }).select('+password')
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid credentials' })

    const token = signToken(user._id)
    res.json({
      token,
      user: { _id: user._id, name: user.name, email: user.email },
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

// GET /api/auth/me
router.get('/me', require('../middleware/auth'), (req, res) => {
  res.json({ user: req.user })
})

// POST /api/auth/sync (for Firebase users — creates/updates MongoDB user)
router.post('/sync', async (req, res) => {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer '))
      return res.status(401).json({ message: 'No token' })

    const token = header.split(' ')[1]
    const decoded = jwt.decode(token)
    if (!decoded || !decoded.user_id)
      return res.status(401).json({ message: 'Not a valid Firebase token' })

    let user = await User.findOne({ firebaseUid: decoded.user_id })

    if (!user) {
      user = await User.findOne({ email: decoded.email })
      if (user) {
        user.firebaseUid = decoded.user_id
        await user.save()
      } else {
        const safeName = (decoded.name || decoded.email.split('@')[0]).slice(0, 60)
        user = await User.create({
          name: safeName.length >= 2 ? safeName : 'User',
          email: decoded.email,
          firebaseUid: decoded.user_id,
        })
      }
    }

    res.json({ _id: user._id, name: user.name, email: user.email })
  } catch (err) {
    console.error('Sync error:', err)
    res.status(500).json({ message: err.message || 'Server error' })
  }
})

module.exports = router
