import { useState, useEffect } from 'react'

export default function OnlineUsers({ users = {}, currentUserId }) {
  const [showBanner, setShowBanner] = useState(false)
  const isMobile = window.matchMedia("(max-width: 768px)").matches

  const userList = Object.values(users)
  const uniqueUsersMap = new Map()
  userList.forEach(u => { if (u.uid) uniqueUsersMap.set(u.uid, u) })
  const uniqueUsers = Array.from(uniqueUsersMap.values())
  
  const others = uniqueUsers.filter(u => u.uid !== currentUserId)
  const me = uniqueUsers.find(u => u.uid === currentUserId) || userList.find(u => u.uid === currentUserId)
  const displayUsers = [me, ...others].filter(Boolean)
  const visibleUsers = isMobile ? [me].filter(Boolean) : displayUsers.slice(0, 4)
  const extraCount = isMobile ? others.length : displayUsers.length - visibleUsers.length

  // Show collaboration banner when a second user joins (once per session)
  useEffect(() => {
    if (others.length === 1 && !sessionStorage.getItem('wb_collab_banner')) {
      setShowBanner(true)
      sessionStorage.setItem('wb_collab_banner', '1')
    }
  }, [others.length])

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>

      {/* Collaboration Banner */}
      {showBanner && (
        <div style={{
          position: 'absolute', top: '48px', left: '50%', transform: 'translateX(-50%)',
          background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '10px',
          padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)', zIndex: 100,
          fontFamily: 'Outfit, sans-serif', whiteSpace: 'nowrap',
        }}>
          <span style={{ fontSize: '12px', color: '#166534', fontWeight: '600' }}>
            You are now collaborating in real time!
          </span>
          <button
            onClick={() => setShowBanner(false)}
            style={{ background: 'transparent', border: 'none', color: '#166534', cursor: 'pointer', fontSize: '14px', lineHeight: 1, padding: '0 2px' }}
          >✕</button>
        </div>
      )}

      {/* Overlapping Avatars */}
      <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
        {visibleUsers.map((u, i) => (
          <div key={u.uid} title={u.uid === currentUserId ? `${u.name} (You)` : u.name} style={{
            position: 'relative', zIndex: 10 - i, marginLeft: i > 0 ? '-8px' : '0',
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: u.color || '#7C3AED', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: '700', fontFamily: 'Outfit, sans-serif',
              border: '2px solid var(--bg-primary, #0D0D14)',
              boxShadow: u.uid === currentUserId ? `0 0 0 2px ${u.color || '#7C3AED'}` : 'none',
            }}>
              {(u.name || '?').substring(0, 2).toUpperCase()}
            </div>
            {/* Green online dot */}
            <div style={{
              position: 'absolute', bottom: '1px', right: '1px',
              width: '8px', height: '8px', borderRadius: '50%',
              background: '#22C55E', border: '1.5px solid #0D0D14',
            }} />
            {/* YOU label (only on desktop or tablet, to save space on mobile) */}
            {!isMobile && u.uid === currentUserId && (
              <div style={{
                position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
                background: '#374151', color: 'white', padding: '2px 6px', borderRadius: '10px',
                fontSize: '9px', fontWeight: '700', whiteSpace: 'nowrap', fontFamily: 'Outfit, sans-serif',
              }}>YOU</div>
            )}
          </div>
        ))}

        {/* Extra count badge */}
        {extraCount > 0 && (
          <div style={{
            position: isMobile ? 'absolute' : 'relative',
            bottom: isMobile ? '-4px' : 'auto',
            right: isMobile ? '-8px' : 'auto',
            width: isMobile ? '20px' : '32px', 
            height: isMobile ? '20px' : '32px', 
            borderRadius: '50%',
            background: isMobile ? 'var(--primary)' : '#374151', 
            color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: isMobile ? '10px' : '11px', fontWeight: '700', fontFamily: 'Outfit, sans-serif',
            border: isMobile ? '2px solid var(--bg-primary, #0D0D14)' : '2px solid #0D0D14', 
            marginLeft: isMobile ? '0' : '-8px', zIndex: 11,
          }}>+{extraCount}</div>
        )}
      </div>

      {/* Online count label & Live Pill */}
      {!isMobile && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignSelf: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: '600', fontFamily: 'Outfit, sans-serif', cursor: 'default' }}>
              {displayUsers.length} online
            </span>
            
            {others.length > 0 && (
              <div style={{
                background: 'rgba(34, 197, 94, 0.15)',
                color: '#22C55E',
                padding: '2px 8px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: '#22C55E', animation: 'pulseGlow 1.5s infinite'
                }} />
                Live
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tooltip dropdown on hover */}
      {!isMobile && (
        <div className="users-tooltip" style={{
          position: 'absolute', top: '100%', right: 0, marginTop: '8px',
          background: '#0D0D14', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px', padding: '12px', minWidth: '180px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)', zIndex: 100,
          display: 'none', flexDirection: 'column', gap: '10px'
        }}>
          <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: '600', paddingBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            CURRENTLY ONLINE
          </div>
          {displayUsers.map(u => (
            <div key={u.uid} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: u.color || '#7C3AED' }} />
              <span style={{ fontSize: '13px', color: 'white', fontWeight: '500' }}>
                {u.name} {u.uid === currentUserId ? '(You)' : ''}
              </span>
            </div>
          ))}
        </div>
      )}
      <style>{`
        div:hover > .users-tooltip { display: flex !important; }
      `}</style>
    </div>
  )
}
