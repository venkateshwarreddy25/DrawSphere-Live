import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'
import { usePresence } from '../hooks/usePresence'
import { useCursors } from '../hooks/useCursors'
import Canvas from '../components/Canvas'
import Toolbar from '../components/Toolbar'
import AIPanel from '../components/AIPanel'
import CursorOverlay from '../components/CursorOverlay'
import OnlineUsers from '../components/OnlineUsers'
import ShareModal from '../components/ShareModal'
import MobileToolbar from '../components/MobileToolbar'
import { useOffline } from '../hooks/useOffline'
import { IconLogout, IconShare2 as TablerShare, IconRobot, IconCheck, IconLoader, IconDownload, IconDotsVertical, IconWifiOff } from '@tabler/icons-react'
import { Share2, Sparkles } from 'lucide-react'
import { ref, onValue } from 'firebase/database'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

function debounce(fn, ms) {
  let timer
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms) }
}

// ── Join/Leave Toast ─────────────────────────────────────────────
function CollabToast({ user, action }) {
  if (!user) return null
  return (
    <div style={{
      position: 'fixed', bottom: '28px', left: '24px', zIndex: 9998,
      display: 'flex', alignItems: 'center', gap: '10px',
      background: 'white', border: '1px solid #E5E7EB',
      borderLeft: `4px solid ${user.color || '#7C3AED'}`,
      padding: '10px 16px', borderRadius: '10px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      fontFamily: 'Outfit, sans-serif', animation: 'slideInLeft 0.3s ease',
    }}>
      <div style={{
        width: '28px', height: '28px', borderRadius: '50%',
        background: user.color || '#7C3AED', color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '12px', fontWeight: '700', flexShrink: 0,
      }}>
        {(user.name || '?').substring(0, 2).toUpperCase()}
      </div>
      <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}>
        <strong style={{ color: user.color || '#7C3AED' }}>{user.name}</strong>
        {action === 'join' ? ' joined the board' : ' left the board'}
      </span>
    </div>
  )
}

export default function Board() {
  const { boardId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [tool, setTool] = useState('pen')
  const [color, setColor] = useState('#FFFFFF')
  const [strokeWidth, setStrokeWidth] = useState(4)
  const [aiOpen, setAiOpen] = useState(false)
  const [boardName, setBoard] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [shareMsg, setShareMsg] = useState('')
  const [showShareModal, setShowShareModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [collabToast, setCollabToast] = useState(null)
  const [showMenu, setShowMenu] = useState(false)
  const [isFirstVisit, setIsFirstVisit] = useState(false)
  
  const isOffline = useOffline()
  const [dbConnected, setDbConnected] = useState(false)

  useEffect(() => {
    const connectedRef = ref(db, '.info/connected')
    return onValue(connectedRef, (snap) => setDbConnected(snap.val() === true))
  }, [])

  const canvasAPI = useRef(null)
  const fabricRef = useRef(null)

  // ── Presence & Cursors via Firebase RTDB ─────────────────────────
  const { onlineUsers, joinedUser, leftUser } = usePresence(boardId, user)
  const { cursors, emitCursor } = useCursors(boardId, user)

  // ── Show join/leave toast ─────────────────────────────────────────
  useEffect(() => {
    if (!joinedUser) return
    setCollabToast({ user: joinedUser, action: 'join' })
    const t = setTimeout(() => setCollabToast(null), 3000)
    return () => clearTimeout(t)
  }, [joinedUser])

  useEffect(() => {
    if (!leftUser) return
    setCollabToast({ user: leftUser, action: 'leave' })
    const t = setTimeout(() => setCollabToast(null), 3000)
    return () => clearTimeout(t)
  }, [leftUser])

  // ── Load board ────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/boards/${boardId}`)
        setBoard(data.name)
        if (data.canvasState && canvasAPI.current?.loadFromJSON) {
          canvasAPI.current.loadFromJSON(data.canvasState)
        }
        
        // Welcome toast for new visitors joining via share link
        if (!data.owner.includes(user._id) && !sessionStorage.getItem(`visited_${boardId}`)) {
          setIsFirstVisit(true)
          sessionStorage.setItem(`visited_${boardId}`, '1')
          setTimeout(() => setIsFirstVisit(false), 5000)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [boardId])

  // ── Save board (debounced) ────────────────────────────────────────
  const saveBoard = useMemo(() =>
    debounce(async (state) => {
      setSaving(true)
      try {
        const thumbnail = canvasAPI.current?.exportPNG?.({ multiplier: 0.2, quality: 0.5 }) // Small thumbnail
        await api.patch(`/boards/${boardId}`, { canvasState: state, thumbnail })
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } catch (e) {
        console.error(e)
      } finally {
        setSaving(false)
      }
    }, 1500),
    [boardId]
  )

  const handleCanvasChange = useCallback((state) => {
    saveBoard(state)
  }, [saveBoard])

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    setShareMsg('Copied!')
    setTimeout(() => setShareMsg(''), 2500)
  }

  const handleExport = () => {
    const dataUrl = canvasAPI.current?.exportPNG()
    if (!dataUrl) return
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `${boardName || 'board'}.png`
    a.click()
  }

  const handleClear = () => {
    if (!confirm('Clear the entire canvas?')) return
    canvasAPI.current?.clearCanvas()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', width: '100vw', maxWidth: '100vw', overflow: 'hidden', background: '#0A0A0F' }}>

      {/* ── Offline Banner ── */}
      {isOffline && (
        <div style={{ background: '#F59E0B', color: '#fff', padding: '8px', textAlign: 'center', fontWeight: '500', fontSize: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', zIndex: 9999 }}>
          <IconWifiOff size={16} /> You are offline. Changes will sync when you reconnect.
        </div>
      )}

      {/* ── Join/Leave Collab Toast ── */}
      {collabToast && <CollabToast user={collabToast.user} action={collabToast.action} />}
      
      {/* ── Welcome Toast ── */}
      {isFirstVisit && (
        <div style={{ position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)', background: '#2563EB', color: 'white', padding: '12px 24px', borderRadius: '12px', boxShadow: 'var(--shadow-lg)', zIndex: 9999, fontWeight: 'bold', animation: 'fadeIn 0.3s ease-out' }}>
          Welcome to the shared board: {boardName}
        </div>
      )}

      {/* ── Share Modal ── */}
      {showShareModal && (
        <ShareModal 
          boardId={boardId} 
          boardName={boardName} 
          ownerId={user._id} // Assume creator might be owner, backend enforces it anyway
          onlineUsers={onlineUsers} 
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* ── Top Bar ── */}
      {window.innerWidth < 768 ? (
        <header style={{
          display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          height: '56px', padding: '0 12px', background: 'rgba(15, 15, 26, 0.97)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)', position: 'fixed',
          top: 0, left: 0, right: 0, zIndex: 50
        }}>
          {/* Left section */}
          <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'center' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '800', fontSize: '18px', color: 'white'
            }}>D</div>
            <div style={{
              color: 'white', fontSize: '14px', fontWeight: '500',
              maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
            }}>
              {boardName.length > 12 ? boardName.substring(0, 12) + '...' : boardName}
            </div>
          </div>

          {/* Right section */}
          <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'center' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '50%',
              background: user.color || '#7C3AED', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: '600'
            }}>
              {(user.name || '?').substring(0, 2).toUpperCase()}
            </div>
            
            <button
              onClick={(e) => { e.preventDefault(); setShowShareModal(true); }}
              onTouchEnd={(e) => { if (e.cancelable) e.preventDefault(); setShowShareModal(true); }}
              style={{
                width: '40px', height: '40px', borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.08)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', cursor: 'pointer', padding: 0
              }}
            >
              <Share2 size={18} color="white" />
            </button>

            <button
              onClick={(e) => { e.preventDefault(); setAiOpen(o => !o); }}
              onTouchEnd={(e) => { if (e.cancelable) e.preventDefault(); setAiOpen(o => !o); }}
              style={{
                width: '40px', height: '40px', borderRadius: '8px',
                background: 'rgba(124, 58, 237, 0.2)', color: 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', cursor: 'pointer', padding: 0
              }}
            >
              <Sparkles size={18} color="#A855F7" />
            </button>
          </div>
        </header>
      ) : (
        <header className="top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <div
              onClick={() => navigate('/')}
              style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'var(--primary)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontWeight: '800', fontSize: '18px',
                color: 'white', cursor: 'pointer', flexShrink: 0,
              }}
            >D</div>

            <span
              className="font-extrabold"
              style={{ cursor: 'pointer', letterSpacing: '-0.5px', fontSize: '18px', flexShrink: 0 }}
              onClick={() => navigate('/')}
            >DrawSphere</span>

            <div style={{ width: '1px', height: '20px', background: 'var(--border-subtle)', flexShrink: 0 }} />

            <input
              value={boardName}
              onChange={(e) => setBoard(e.target.value)}
              onBlur={() => saveBoard(canvasAPI.current?.serialize?.() || {})}
              style={{
                background: 'transparent', border: 'none', borderBottom: '1px solid transparent',
                color: 'var(--text-primary)', maxWidth: '180px', fontSize: '14px',
                fontWeight: '500', outline: 'none', transition: 'border-color 0.2s',
              }}
              onFocus={e => (e.target.style.borderBottomColor = 'var(--primary)')}
              placeholder="Board name…"
            />

            <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {saving && <><IconLoader size={13} className="spin" /> Saving</>}
              {saved && !saving && <><IconCheck size={13} color="var(--success)" /> Saved</>}
            </div>
            
            {/* Connection Indicator */}
            <div style={{ marginLeft: '12px', display: 'flex', alignItems: 'center', position: 'relative' }} title={dbConnected ? 'Connected to live collaboration' : 'Connection lost, trying to reconnect...'}>
              {dbConnected ? (
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 8px #22C55E' }} />
              ) : (
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', animation: 'pulseGlow 1.5s infinite' }} />
              )}
            </div>
          </div>

          <div className="desktop-only" style={{ display: 'flex', alignItems: 'center' }}>
            <OnlineUsers users={onlineUsers} currentUserId={user._id} />

            <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)', margin: '0 16px' }} />

            <button onClick={() => setShowShareModal(true)} className="btn btn-secondary" style={{ fontSize: '14px', marginRight: '8px' }}>
              <TablerShare size={16} /> Share
            </button>

            <button
              onClick={() => setAiOpen(o => !o)}
              className={aiOpen ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ fontSize: '14px', marginRight: '16px' }}
            >
              <IconRobot size={16} /> AI
            </button>

            <button onClick={handleExport} className="btn btn-icon" title="Export PNG" style={{ marginRight: '8px' }}>
              <IconDownload size={18} />
            </button>

            <button
              onClick={() => { localStorage.clear(); navigate('/login') }}
              className="btn btn-icon"
              title="Sign out"
            >
              <IconLogout size={18} />
            </button>
          </div>
        </header>
      )}

      {/* ── Mobile Menu Bottom Sheet ── */}
      {showMenu && (
        <div className="modal-overlay" onClick={() => setShowMenu(false)} style={{ zIndex: 1000 }}>
          <div className="mobile-bottom-sheet" style={{ background: 'white', padding: '16px 0' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '0 16px', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
              <OnlineUsers users={onlineUsers} currentUserId={user._id} />
            </div>
            <button onClick={() => { handleExport(); setShowMenu(false) }} className="btn btn-secondary" style={{ width: '100%', borderRadius: 0, justifyContent: 'flex-start', padding: '16px 24px', background: 'transparent', border: 'none' }}>
              <IconDownload size={20} /> Export as PNG
            </button>
            <button onClick={() => { handleShare(); setShowMenu(false) }} className="btn btn-secondary" style={{ width: '100%', borderRadius: 0, justifyContent: 'flex-start', padding: '16px 24px', background: 'transparent', border: 'none' }}>
              <IconShare2 size={20} /> Copy Share Link
            </button>
            <button onClick={() => { localStorage.clear(); navigate('/login') }} className="btn btn-secondary" style={{ width: '100%', borderRadius: 0, justifyContent: 'flex-start', padding: '16px 24px', background: 'transparent', border: 'none', color: 'var(--danger)' }}>
              <IconLogout size={20} /> Leave Board
            </button>
          </div>
        </div>
      )}

      {/* ── Board Body ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {window.innerWidth < 768 ? (
          <MobileToolbar
            tool={tool} setTool={setTool}
            color={color} setColor={setColor}
            strokeWidth={strokeWidth} setStrokeWidth={setStrokeWidth}
          />
        ) : (
          <Toolbar
            tool={tool} setTool={setTool}
            color={color} setColor={setColor}
            strokeWidth={strokeWidth} setStrokeWidth={setStrokeWidth}
            onUndo={() => canvasAPI.current?.undo()}
            onRedo={() => canvasAPI.current?.redo()}
            onClear={handleClear}
            canUndo={!!canvasAPI.current?.canUndo}
            canRedo={!!canvasAPI.current?.canRedo}
          />
        )}

        {/* Canvas area */}
        <div 
          className="canvas-container-main" 
          style={window.innerWidth < 768 ? { height: 'calc(100dvh - 56px - 112px)' } : {}}
        >
          {loading && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center', zIndex: 50,
              background: 'rgba(13,13,20,0.6)',
            }}>
              <IconLoader size={40} className="spin" color="var(--primary)" />
            </div>
          )}
          <Canvas
            boardId={boardId}
            tool={tool}
            color={color}
            strokeWidth={strokeWidth}
            onCanvasReady={(api, fRef) => {
              canvasAPI.current = api
              fabricRef.current = fRef.current
            }}
            onCanvasChange={handleCanvasChange}
            emitCursor={emitCursor}
          />
          <CursorOverlay cursors={cursors} />
        </div>

        {/* AI Panel */}
        {aiOpen && (
          <AIPanel
            fabricRef={fabricRef}
            onClose={() => setAiOpen(false)}
            onShapesGenerated={() => {
              handleCanvasChange(canvasAPI.current?.serialize?.() || '{}')
            }}
          />
        )}
      </div>

      <style>{`
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
