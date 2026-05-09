/**
 * Redis utility — provides a shared Redis client.
 * Falls back gracefully if REDIS_URL is not set (local dev).
 *
 * Usage:
 *   const redis = require('./utils/redis')
 *   await redis.set('key', 'value', 'EX', 3600)
 *   const val = await redis.get('key')
 */

let redis = null

if (process.env.REDIS_URL) {
  const { createClient } = require('redis')
  redis = createClient({ url: process.env.REDIS_URL })
  redis.connect()
    .then(() => console.log('✅ Redis connected'))
    .catch(err => console.warn('⚠️  Redis connection failed, falling back to in-memory:', err.message))
}

// Minimal in-memory fallback so callers never crash
const memStore = new Map()
const fallback = {
  get: async (k) => memStore.get(k) ?? null,
  set: async (k, v) => { memStore.set(k, v); return 'OK' },
  del: async (k) => memStore.delete(k),
  exists: async (k) => memStore.has(k) ? 1 : 0,
  expire: async () => {},
}

module.exports = redis || fallback
