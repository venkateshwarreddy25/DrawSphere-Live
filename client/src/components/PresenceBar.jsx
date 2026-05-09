const GRADIENTS = [
  'linear-gradient(135deg, #7C3AED, #3B82F6)',
  'linear-gradient(135deg, #3B82F6, #06B6D4)',
  'linear-gradient(135deg, #EC4899, #8B5CF6)',
  'linear-gradient(135deg, #10B981, #06B6D4)',
  'linear-gradient(135deg, #F59E0B, #EF4444)',
]

export const getUserGradient = (userId) => {
  if (!userId) return GRADIENTS[0]
  let hash = 0
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length]
}

// BUG 5: connected prop accepted; green dot placed on bottom-right of each avatar
export default function PresenceBar({ users, currentUserId, connected }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {users.slice(0, 6).map((u, i) => {
        const isMe = u._id === currentUserId || u.userId === currentUserId
        const gradient = getUserGradient(u._id || u.userId)
        return (
          <div
            key={u._id || u.userId || i}
            title={`${u.name}${isMe ? ' (you)' : ''}`}
            style={{
              position: 'relative',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: gradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '13px',
              fontWeight: '600',
              boxShadow: `0 0 0 2px var(--bg-base)`,
              marginLeft: i === 0 ? 0 : '-8px',
              cursor: 'default',
              transition: 'all var(--transition)',
              zIndex: 10 - i,
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.zIndex = 20 }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.zIndex = 10 - i }}
          >
            {u.name?.[0]?.toUpperCase() || '?'}

            {/* BUG 5: connected status dot — bottom-right of avatar, white ring, no pulse */}
            {isMe && (
              <div style={{
                position: 'absolute',
                bottom: '0px',
                right: '0px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: connected ? '#22C55E' : '#9CA3AF',
                border: '2px solid white',
                zIndex: 1,
              }} />
            )}
          </div>
        )
      })}

      {users.length > 6 && (
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'var(--bg-hover)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          color: 'var(--text-secondary)',
          fontWeight: 'bold',
          boxShadow: '0 0 0 2px var(--bg-base)',
          marginLeft: '-8px',
          zIndex: 0,
        }}>
          +{users.length - 6}
        </div>
      )}
    </div>
  )
}
