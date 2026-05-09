import { useState, useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { IconLink, IconCopy, IconCheck, IconMail, IconBrandWhatsapp, IconX, IconCrown, IconShare } from '@tabler/icons-react'
import api from '../api'

export default function ShareModal({ boardId, boardName, ownerId, onlineUsers = {}, onClose, stats = { shareCount: 0, joinCount: 0 } }) {
  const [copied, setCopied] = useState(false)
  const qrRef = useRef(null)

  // Frontend URL logic (Vite env var or fallback)
  const frontendUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin
  const shareLink = `${frontendUrl}/board/${boardId}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      await api.post(`/boards/${boardId}/analytics`, { type: 'share' }).catch(console.error)
    } catch (err) {
      console.error('Failed to copy', err)
    }
  }

  const handleDownloadQR = () => {
    if (!qrRef.current) return
    const canvas = qrRef.current.querySelector('canvas')
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.download = `board-qr-${boardId}.png`
    a.href = url
    a.click()
  }

  const shareEmail = () => window.location.href = `mailto:?subject=Join my whiteboard: ${boardName}&body=Hey, collaborate with me on this board:%0A%0A${shareLink}`
  const shareWhatsApp = () => window.location.href = `whatsapp://send?text=Join my whiteboard: ${shareLink}`

  const shareNative = async () => {
    try {
      await navigator.share({
        title: `Join my whiteboard: ${boardName}`,
        text: 'Let\'s collaborate on DrawSphere!',
        url: shareLink
      })
      await api.post(`/boards/${boardId}/analytics`, { type: 'share' }).catch(console.error)
    } catch (e) {
      console.log('Share cancelled or failed', e)
    }
  }

  const isMobile = window.matchMedia('(max-width: 768px)').matches
  const canNativeShare = isMobile && navigator.share

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000, alignItems: isMobile ? 'flex-end' : 'center' }}>
      <div 
        className={`modal-card ${isMobile ? 'mobile-bottom-sheet' : ''}`} 
        onClick={e => e.stopPropagation()}
        style={{
          width: isMobile ? '100vw' : '480px',
          maxWidth: '100vw',
          height: isMobile ? '85dvh' : 'auto',
          padding: '24px',
          background: 'rgba(13, 13, 20, 0.95)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          ...(isMobile ? {
            position: 'absolute',
            bottom: 0,
            left: 0,
            borderRadius: '24px 24px 0 0',
            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          } : {})
        }}
      >
        {isMobile && (
          <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', margin: '0 auto 16px auto', flexShrink: 0 }} />
        )}
        
        <button onClick={onClose} className="btn btn-icon" style={{ position: 'absolute', top: isMobile ? '24px' : '16px', right: '16px', color: 'var(--text-muted)' }}>
          <IconX size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', flexShrink: 0 }}>
          <div style={{ padding: '10px', background: 'rgba(217, 22, 208, 0.1)', borderRadius: '12px', color: 'var(--primary)' }}>
            <IconLink size={24} />
          </div>
          <div>
            <h2 className="font-bold text-20" style={{ lineHeight: 1.2 }}>Invite to Collaborate</h2>
            <p className="font-medium text-14" style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
              Anyone with this link can view and collaborate
            </p>
          </div>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, paddingBottom: '24px' }}>
          {/* Link Input */}
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '8px', marginBottom: '16px' }}>
            <input 
              type="text" 
              readOnly 
              value={shareLink} 
              className="input-field"
              style={{ 
                flex: 1, 
                background: 'rgba(255, 255, 255, 0.05)', 
                borderColor: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                width: '100%'
              }} 
            />
            <button 
              onClick={handleCopy} 
              className="btn" 
              style={{ 
                background: copied ? 'var(--success)' : 'var(--primary)',
                color: 'white',
                border: 'none',
                padding: '0 16px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: isMobile ? '100%' : 'auto'
              }}
            >
              {copied ? <><IconCheck size={20} /> Copied</> : <><IconCopy size={20} /> Copy Link</>}
            </button>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {canNativeShare ? (
              <button onClick={shareNative} className="btn" style={{ flex: 1, background: 'var(--secondary)', border: 'none', color: 'white', height: '44px', fontSize: '14px', display: 'flex', gap: '6px' }}>
                <IconShare size={18} /> Share via Apps
              </button>
            ) : (
              <>
                <button onClick={shareEmail} className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', height: '44px', fontSize: '14px', display: 'flex', gap: '6px' }}>
                  <IconMail size={18} /> Email
                </button>
                <button onClick={shareWhatsApp} className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', height: '44px', fontSize: '14px', display: 'flex', gap: '6px' }}>
                  <IconBrandWhatsapp size={18} /> WhatsApp
                </button>
              </>
            )}
          </div>

        {/* QR Code Section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '16px', marginBottom: '24px' }}>
          <div ref={qrRef} style={{ background: 'white', padding: '12px', borderRadius: '12px', marginBottom: '12px' }}>
            <QRCodeCanvas value={shareLink} size={140} level="H" />
          </div>
          <p className="font-medium text-13" style={{ color: 'var(--text-muted)', marginBottom: '12px' }}>Scan to join on mobile</p>
          <button onClick={handleDownloadQR} className="btn" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '6px 16px', fontSize: '13px', borderRadius: '99px' }}>
            Download QR
          </button>
        </div>

        {/* Online Users List */}
        <div>
          <h3 className="font-semibold text-14" style={{ color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
            <span>Current Collaborators</span>
            <span style={{ fontSize: '11px' }}>Shared {stats.shareCount} times • {stats.joinCount} joined</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '150px', overflowY: 'auto' }}>
            {Object.values(onlineUsers).map(u => {
              const isOwner = u.uid === ownerId
              return (
                <div key={u.uid} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ 
                      width: '32px', height: '32px', borderRadius: '50%', background: u.color || '#7C3AED',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '12px'
                    }}>
                      {(u.name || '?').substring(0, 2).toUpperCase()}
                    </div>
                    {isOwner && (
                      <div style={{ position: 'absolute', top: '-6px', right: '-6px', color: '#FBBF24', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.5))' }}>
                        <IconCrown size={14} fill="currentColor" />
                      </div>
                    )}
                    <div style={{ 
                      position: 'absolute', bottom: 0, right: 0, width: '8px', height: '8px', 
                      background: '#22C55E', borderRadius: '50%', border: '1px solid #0D0D14',
                      boxShadow: '0 0 0 0 rgba(34, 197, 94, 0.4)', animation: 'pulseGlow 2s infinite'
                    }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="font-medium text-14">{u.name} {u.uid === JSON.parse(localStorage.getItem('wb_user'))?._id ? '(You)' : ''}</span>
                    {isOwner && <span className="text-11" style={{ color: 'var(--text-muted)' }}>Owner</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <span className="text-11" style={{ color: '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
            Real-time collaboration is active
          </span>
        </div>
        </div>
      </div>
    </div>
  )
}
