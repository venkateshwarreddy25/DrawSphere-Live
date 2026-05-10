import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { 
  IconMenu2, IconX, IconPlus, IconBell, IconChevronDown, 
  IconListDetails, IconSparkles, IconBrain, IconUsers, IconGridPattern, IconPencil
} from '@tabler/icons-react'
import api from '../api'
import { useAuthModal } from '../App'
import { useAuth } from '../contexts/AuthContext'

const NAV_LINKS = [
  {
    title: 'How it Works',
    href: '/#howItWorks',
    icon: IconListDetails,
    subtitle: 'Learn the basics',
    desc: 'See how to create boards and start drawing in seconds.'
  },
  {
    title: 'Features',
    href: '/#features',
    icon: IconSparkles,
    subtitle: 'Everything you need',
    desc: 'Pen, shapes, text, sticky notes, and infinite canvas.'
  },
  {
    title: 'AI Tools',
    href: '/#aitools',
    icon: IconBrain,
    subtitle: 'Powered by AI',
    desc: 'Generate diagrams from text, convert handwriting, summarize notes, and draw from voice.'
  },
  {
    title: 'Collaborate',
    href: '/#collaborate',
    icon: IconUsers,
    subtitle: 'Real time together',
    desc: 'Share a link and draw with anyone anywhere in the world instantly.'
  },
  {
    title: 'Templates',
    href: '/templates',
    icon: IconGridPattern,
    subtitle: 'Start faster',
    desc: 'Choose from pre-made diagram templates for flowcharts, mind maps, and more.'
  }
]

export default function Navbar({ onCreateBoard }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [joinModalOpen, setJoinModalOpen] = useState(false)
  const [joinId, setJoinId] = useState('')
  const [activeSection, setActiveSection] = useState('')
  const { showSignupModal } = useAuthModal()

  useEffect(() => {
    if (window.location.pathname !== '/') return
    const sections = ['howItWorks', 'features', 'aitools', 'collaborate']
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id)
        }
      })
    }, { rootMargin: '-64px 0px -60% 0px', threshold: 0.1 })
    
    sections.forEach(id => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    
    return () => observer.disconnect()
  }, [])

  const handleNavClick = (e, href) => {
    if (href.startsWith('/#')) {
      const id = href.replace('/#', '')
      if (window.location.pathname === '/') {
        e.preventDefault()
        const el = document.getElementById(id)
        if (el) {
          const y = el.getBoundingClientRect().top + window.scrollY - 64 // 64px offset for navbar
          window.scrollTo({ top: y, behavior: 'smooth' })
        }
      }
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

  const handleJoin = (e) => {
    e.preventDefault()
    let id = joinId.trim()
    if (id.includes('/board/')) {
      id = id.split('/board/')[1]
    }
    if (!id || id.length < 5) {
      alert('Invalid board ID or URL')
      return
    }
    setJoinModalOpen(false)
    if (!user?._id) {
      localStorage.setItem('redirectAfterLogin', `/board/${id}`)
      showSignupModal()
    } else {
      navigate(`/board/${id}`)
    }
  }

  return (
    <>
      <nav style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: '0 24px', height: '72px', borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 50, width: '100vw', maxWidth: '100vw'
      }}>
        {/* Left: Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div style={{ 
            width: '32px', height: '32px', borderRadius: '8px', 
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: '900', fontSize: '18px'
          }}>
            D
          </div>
          <span className="font-extrabold text-20" style={{ letterSpacing: '-0.5px' }}>DrawSphere</span>
        </div>

        {/* Center: Desktop Links */}
        <div className="desktop-only nav-center-links" style={{ display: 'flex', gap: '8px' }}>
          {NAV_LINKS.map(link => (
            <div key={link.title} className="nav-dropdown-trigger" style={{ position: 'relative' }}>
              <a 
                href={link.href || '#'} 
                onClick={(e) => handleNavClick(e, link.href)}
                className="nav-link font-semibold text-14" 
                style={{ 
                  color: activeSection === link.href.replace('/#', '') ? 'var(--primary)' : 'var(--text-secondary)', 
                  padding: '8px 16px', borderRadius: '8px',
                  textDecoration: 'none', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '4px',
                  borderBottom: activeSection === link.href.replace('/#', '') ? '2px solid var(--primary)' : '2px solid transparent'
                }}>
                {link.title}
              </a>
              {/* Dropdown Card */}
              <div className="nav-dropdown-card glass-card">
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ padding: '12px', background: 'rgba(217,22,208,0.1)', color: 'var(--primary)', borderRadius: '12px' }}>
                    <link.icon size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-16" style={{ marginBottom: '4px' }}>{link.subtitle}</h4>
                    <p className="text-14 font-medium" style={{ color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>{link.desc}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <button onClick={() => setJoinModalOpen(true)} className="nav-link font-semibold text-14" style={{ 
            color: 'var(--text-secondary)', padding: '8px 16px', borderRadius: '8px', background: 'transparent', border: 'none', cursor: 'pointer'
          }}>
            Join Board
          </button>
        </div>

        {/* Right: Actions */}
        <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {!user ? (
            <>
              <button onClick={() => navigate('/login')} className="btn" style={{ background: 'transparent', border: '2px solid var(--border-subtle)', color: 'var(--text-primary)', fontWeight: 'bold' }}>Sign In</button>
              <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', border: 'none' }}>Get Started</button>
            </>
          ) : (
            <>
              <button onClick={() => user ? onCreateBoard() : showSignupModal()} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '14px', display: 'flex', gap: '6px' }}>
                <IconPlus size={16} /> New Board
              </button>
              <button className="btn btn-icon" style={{ position: 'relative' }}>
                <IconBell size={20} />
                <span style={{ position: 'absolute', top: '4px', right: '4px', width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%' }} />
              </button>
              <div style={{ position: 'relative' }}>
                <div onClick={() => setUserMenuOpen(!userMenuOpen)} style={{ 
                  width: '36px', height: '36px', borderRadius: '50%', background: 'var(--secondary)', 
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', border: '2px solid white', boxShadow: 'var(--shadow-sm)'
                }}>
                  {(user.name || '?').substring(0,2).toUpperCase()}
                </div>
                {userMenuOpen && (
                  <div className="glass-card" style={{ 
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0, padding: '8px', minWidth: '200px', 
                    display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 100 
                  }}>
                    <button onClick={() => navigate('/')} className="menu-item">My Boards</button>
                    <button className="menu-item">Settings</button>
                    <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '4px 0' }} />
                    <button onClick={handleLogout} className="menu-item" style={{ color: 'var(--danger)' }}>Sign Out</button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button className="mobile-only btn btn-icon" onClick={() => setMobileMenuOpen(true)}>
          <IconMenu2 size={24} />
        </button>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="modal-overlay" style={{ zIndex: 999 }} onClick={() => setMobileMenuOpen(false)}>
          <div style={{ 
            position: 'absolute', top: 0, right: 0, bottom: 0, width: '85%', maxWidth: '320px', 
            background: 'rgba(10, 10, 15, 0.85)', backdropFilter: 'blur(16px)', padding: '24px', 
            animation: 'slideInRight 0.3s ease-out', display: 'flex', flexDirection: 'column', color: 'white'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '900' }}>D</div>
                <span className="font-bold">DrawSphere</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="btn btn-icon" style={{ color: 'white' }}><IconX size={24} /></button>
            </div>

            {user?._id && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '24px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--secondary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' }}>
                  {(user.name || '?').substring(0,2).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-16">{user.name}</div>
                  <div className="text-14" style={{ color: 'rgba(255,255,255,0.6)' }}>{user.email}</div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
              {NAV_LINKS.map(link => (
                <a key={link.title} href={link.href || '#'} onClick={(e) => { handleNavClick(e, link.href); setMobileMenuOpen(false) }} className="font-bold text-16" style={{ height: '48px', textDecoration: 'none', color: activeSection === link.href.replace('/#', '') ? 'var(--primary)' : 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: '12px', padding: '0 8px', borderRadius: '8px', background: activeSection === link.href.replace('/#', '') ? 'rgba(217, 22, 208, 0.1)' : 'transparent' }}>
                  <link.icon size={20} color={activeSection === link.href.replace('/#', '') ? 'var(--primary)' : 'rgba(255,255,255,0.6)'} /> {link.title}
                </a>
              ))}
              <button onClick={() => { setMobileMenuOpen(false); setJoinModalOpen(true) }} className="font-bold text-16" style={{ height: '48px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: '12px', padding: '0 8px', cursor: 'pointer', textAlign: 'left' }}>
                <IconUsers size={20} color="rgba(255,255,255,0.6)" /> Join Board
              </button>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {!user?._id ? (
                <>
                  <button onClick={() => { navigate('/login'); setMobileMenuOpen(false) }} className="btn" style={{ background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.2)', width: '100%', height: '48px' }}>Sign In</button>
                  <button onClick={() => { navigate('/login'); setMobileMenuOpen(false) }} className="btn btn-primary" style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', border: 'none', width: '100%', height: '48px' }}>Get Started</button>
                </>
              ) : (
                <>
                  <button onClick={() => { user ? onCreateBoard() : showSignupModal(); setMobileMenuOpen(false) }} className="btn btn-primary" style={{ width: '100%', height: '48px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                    <IconPlus size={20} /> New Board
                  </button>
                  <button onClick={() => { handleLogout(); setMobileMenuOpen(false) }} className="btn" style={{ width: '100%', height: '48px', color: '#EF4444', background: 'rgba(239, 68, 68, 0.1)', border: 'none', display: 'flex', justifyContent: 'center' }}>
                    Sign Out
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Join Modal */}
      {joinModalOpen && (
        <div className="modal-overlay" onClick={() => setJoinModalOpen(false)} style={{ zIndex: 1000 }}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <button onClick={() => setJoinModalOpen(false)} className="btn btn-icon" style={{ position: 'absolute', top: '16px', right: '16px' }}><IconX size={20} /></button>
            <h2 className="font-bold text-20" style={{ marginBottom: '8px' }}>Join a Board</h2>
            <p className="text-14" style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Paste a board link or enter the board ID.</p>
            <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input 
                autoFocus 
                className="input-field" 
                placeholder="https://.../board/abc-123 or abc-123" 
                value={joinId} 
                onChange={e => setJoinId(e.target.value)} 
              />
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Join Board</button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
