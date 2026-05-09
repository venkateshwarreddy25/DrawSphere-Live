import { useMemo } from 'react'

export default function CursorOverlay({ cursors = {} }) {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 30, overflow: 'hidden' }}>
      {Object.entries(cursors).map(([uid, c]) => {
        const isMoving = Date.now() - c.ts < 2000
        const opacity = isMoving ? 1 : 0.5 // Fade slightly if idle, but don't hide

        return (
          <div
            key={uid}
            style={{ 
              position: 'absolute', left: c.x, top: c.y, transform: 'translate(-2px, -2px)',
              transition: 'left 80ms linear, top 80ms linear, opacity 0.3s ease',
              opacity: opacity, display: 'flex', flexDirection: 'column', alignItems: 'flex-start'
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.3))` }}>
              <path d="M4 2L18 10L11 12L9 20L4 2Z" fill={c.color || '#3b82f6'} stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
            <div style={{ 
                background: c.color || '#3b82f6', color: 'white', padding: '4px 8px', borderRadius: '12px',
                fontSize: '10px', fontWeight: 'bold', whiteSpace: 'nowrap', marginTop: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontFamily: 'Outfit, sans-serif'
              }}
            >
              {c.name || 'User'}
            </div>
          </div>
        )
      })}
    </div>
  )
}
