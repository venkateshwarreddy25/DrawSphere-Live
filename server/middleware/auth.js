const jwt = require('jsonwebtoken')
const User = require('../models/User')

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret'
// Support both current and legacy secret so old tokens still work
const LEGACY_SECRET = 'dev_secret'

module.exports = async function auth(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' })
  }

  const token = header.split(' ')[1]

  try {
    // First: try to decode without verification to check token type
    const decoded = jwt.decode(token)
    if (!decoded) return res.status(401).json({ message: 'Invalid token format' })

    // Firebase token (has user_id field)
    if (decoded.user_id) {
      const user = await User.findOne({ firebaseUid: decoded.user_id })
        || await User.findOne({ email: decoded.email })
      if (!user) return res.status(401).json({ message: 'User not found in DB' })
      req.user = user
      return next()
    }

    // Local JWT — try current secret first, then legacy fallback
    let localDecoded = null
    try {
      localDecoded = jwt.verify(token, JWT_SECRET)
    } catch {
      // Token may have been signed with legacy default secret
      try {
        localDecoded = jwt.verify(token, LEGACY_SECRET)
      } catch {
        return res.status(401).json({ message: 'Token expired or invalid. Please log in again.' })
      }
    }

    const user = await User.findById(localDecoded.id).select('-password')
    if (!user) return res.status(401).json({ message: 'User not found' })
    req.user = user
    next()

  } catch (err) {
    console.error('[auth middleware]', err.message)
    res.status(401).json({ message: 'Authentication failed' })
  }
}
