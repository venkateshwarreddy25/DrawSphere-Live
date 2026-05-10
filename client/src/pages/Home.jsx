import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import Navbar from '../components/Navbar'
import {
  IconPencil, IconPlus, IconShare, IconTrash, IconUsers,
  IconClock, IconSearch, IconLoader, IconBrain, IconMicrophone, IconShare2, IconDownload,
  IconLink, IconPointer, IconMessageChatbot, IconWriting, IconFileCode, IconRobot, IconLayoutKanban, IconArrowRight
} from '@tabler/icons-react'
import { Phone, Mail } from 'lucide-react'

import { useAuth } from '../contexts/AuthContext'
import { useAuthModal } from '../App'
import { db, firestore } from '../firebase'
import { collection, doc, setDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore'

export default function Home() {
  const { showSignupModal } = useAuthModal()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [boards, setBoards] = useState([])
  const [boardsLoading, setBoardsLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newBoardName, setNewBoardName] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        if (!user?.uid) return
        const q = query(collection(firestore, 'boards'), where('ownerId', '==', user.uid))
        const snapshot = await getDocs(q)
        const userBoards = snapshot.docs.map(d => d.data())
        setBoards(userBoards)
      } catch (e) {
        console.error(e)
      } finally {
        setBoardsLoading(false)
      }
    }
    if (user) {
      fetchBoards()
    } else {
      setBoardsLoading(false)
    }
  }, [user])

  const createBoard = async (e) => {
    if (e) e.preventDefault()
    if (!user) {
      showSignupModal()
      return
    }
    
    setCreating(true)
    try {
      const boardId = crypto.randomUUID()
      const name = newBoardName.trim() || 'Untitled Board'
      const ownerName = user.displayName || user.email?.split('@')[0] || 'Unknown'
      
      await setDoc(doc(firestore, 'boards', boardId), {
        id: boardId,
        name: name,
        ownerId: user.uid,
        ownerName: ownerName,
        ownerEmail: user.email || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        elements: [],
        collaborators: [],
        isPublic: true
      })
      
      navigate(`/board/${boardId}`)
    } catch (e) {
      console.error(e)
      alert('Failed to create board. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  const deleteBoard = async (id, e) => {
    e.stopPropagation()
    if (!window.confirm('Delete this board?')) return
    try {
      const { deleteDoc, doc: fsDoc } = await import('firebase/firestore')
      await deleteDoc(fsDoc(firestore, 'boards', id))
      setBoards(bs => bs.filter(b => b.id !== id))
    } catch (e) {
      console.error(e)
    }
  }

  const copyLink = (id, e) => {
    e.stopPropagation()
    const domain = import.meta.env.VITE_FRONTEND_URL || window.location.origin
    navigator.clipboard.writeText(`${domain}/board/${id}`).then(() => alert('Link copied!'))
  }

  const filtered = boards.filter(b => b.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', width: '100vw', maxWidth: '100vw', overflowX: 'hidden', background: '#FFFFFF' }}>
      <Navbar onCreateBoard={() => setShowCreate(true)} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>

        {/* ── Hero Section ── */}
        <section style={{
          background: '#FAFAFB',
          color: '#111827', padding: '120px 24px 80px', textAlign: 'center',
          display: 'flex', flexDirection: 'column', alignItems: 'center'
        }}>
          <div className="hero-badges">
            <span className="badge"><span className="dot dot-red"></span>Live collaboration</span>
            <span className="badge"><span className="dot dot-purple"></span>AI powered</span>
            <span className="badge"><span className="dot dot-green"></span>Works anywhere</span>
          </div>

          <h1 className="font-extrabold hero-headline">
            Draw, think, and collaborate in real time.
          </h1>

          <p className="hero-subheading">
            DrawSphere is an AI-powered collaborative whiteboard where teams and students can draw diagrams, brainstorm ideas, and work together from anywhere.
          </p>

          <div className="hero-cta-group">
            <button 
              onClick={() => user ? createBoard() : showSignupModal()} 
              className="btn btn-primary cta-btn primary-cta"
            >
              Get Started for Free
            </button>
            <button className="btn cta-btn secondary-cta" onClick={() => {
              document.getElementById('howItWorks').scrollIntoView({ behavior: 'smooth' })
            }}>
              How it works
            </button>
          </div>

          {/* Animated Mockup Preview */}
          <div className="mockup-container">
            <div className="mockup-toolbar">
              <div className="mockup-tool active"></div>
              <div className="mockup-tool"></div>
              <div className="mockup-tool"></div>
            </div>

            <svg className="mockup-drawing" viewBox="0 0 800 400">
              <path className="stroke stroke-1" d="M 200 150 Q 300 50, 400 150 T 600 150" />
              <path className="stroke stroke-2" d="M 250 250 L 550 250" />
              <rect className="stroke stroke-3" x="350" y="80" width="100" height="60" rx="8" />
            </svg>

            <div className="mockup-cursor cursor-1">
              <IconPointer size={24} color="#d946ef" className="cursor-icon" />
              <div className="cursor-name" style={{ background: '#d946ef' }}>Alex</div>
            </div>
            <div className="mockup-cursor cursor-2">
              <IconPointer size={24} color="#3b82f6" className="cursor-icon" />
              <div className="cursor-name" style={{ background: '#3b82f6' }}>Sam</div>
            </div>
          </div>
        </section>

        {/* ── Features Section ── */}
        <section id="features" className="home-section">
          <div className="section-container">
            <h2 className="section-title">Everything you need to create and collaborate.</h2>
            <div className="features-grid">
              {[
                { icon: IconUsers, color: '#3b82f6', title: 'Real-time Collaboration', desc: 'Multiple people can draw on the same board simultaneously and see each other live.' },
                { icon: IconBrain, color: '#d946ef', title: 'AI Diagram Generator', desc: 'Describe what you want and AI instantly draws the diagram for you.' },
                { icon: IconPencil, color: '#f59e0b', title: 'Handwriting to Text', desc: 'Draw or write on the canvas and AI converts it to clean typed text.' },
                { icon: IconMicrophone, color: '#10b981', title: 'Voice to Diagram', desc: 'Speak your idea aloud and watch AI turn your words into a diagram.' },
                { icon: IconShare2, color: '#8b5cf6', title: 'Instant Share Link', desc: 'Share one link and anyone can join your board no account required for viewers.' },
                { icon: IconDownload, color: '#ec4899', title: 'Export and Save', desc: 'Export your board as PNG or PDF and all changes save automatically.' }
              ].map((f, i) => (
                <div key={i} className="feature-card" style={{ '--hover-color': f.color }}>
                  <div className="feature-icon-wrapper" style={{ background: `${f.color}15`, color: f.color }}>
                    <f.icon size={28} />
                  </div>
                  <h3 className="feature-title">{f.title}</h3>
                  <p className="feature-desc">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── AI Tools Section ── */}
        <section id="aitools" className="home-section dark-section">
          <div className="section-container">
            <h2 className="section-title dark-title">Powered by artificial intelligence.</h2>
            <div className="ai-tools-grid">
              <div className="ai-tool-card">
                <div className="ai-tool-preview">
                  <div className="fake-input">Create a flow chart for login</div>
                  <IconLayoutKanban size={48} color="#d946ef" style={{ marginTop: '16px' }} />
                </div>
                <h3>Diagram Generator</h3>
                <p>Describe your idea in text and instantly get a fully editable flowchart or mind map.</p>
                <button className="btn btn-primary" onClick={() => user ? setShowCreate(true) : showSignupModal()}>Try it</button>
              </div>
              <div className="ai-tool-card">
                <div className="ai-tool-preview">
                  <div style={{ fontFamily: 'cursive', fontSize: '24px', opacity: 0.6 }}>Hello world</div>
                  <IconArrowRight size={24} color="#9ca3af" style={{ margin: '12px 0' }} />
                  <div className="fake-text">Hello world</div>
                </div>
                <h3>Handwriting OCR</h3>
                <p>Scribble notes naturally with your mouse or stylus, and AI converts it into clean, typed text.</p>
                <button className="btn btn-primary" onClick={() => user ? setShowCreate(true) : showSignupModal()}>Try it</button>
              </div>
              <div className="ai-tool-card">
                <div className="ai-tool-preview">
                  <IconMicrophone size={32} color="#10b981" />
                  <div className="waveform">
                    <div className="bar"></div><div className="bar"></div><div className="bar"></div><div className="bar"></div>
                  </div>
                </div>
                <h3>Voice to Diagram</h3>
                <p>Brainstorm out loud. Our voice AI listens and automatically creates the corresponding diagrams.</p>
                <button className="btn btn-primary" onClick={() => user ? setShowCreate(true) : showSignupModal()}>Try it</button>
              </div>
            </div>
          </div>
        </section>

        {/* ── How it Works Section ── */}
        <section id="howItWorks" className="home-section">
          <div className="section-container text-center">
            <h2 className="section-title">Get started in 3 simple steps.</h2>
            <div className="steps-container">
              <div className="step">
                <div className="step-icon-circle step-purple">
                  <IconPlus size={40} color="white" />
                </div>
                <div className="step-number">1</div>
                <h4 className="step-title">Create your board</h4>
              </div>
              <div className="step-connector"></div>
              <div className="step">
                <div className="step-icon-circle step-blue">
                  <IconLink size={40} color="white" />
                </div>
                <div className="step-number">2</div>
                <h4 className="step-title">Share the link</h4>
              </div>
              <div className="step-connector"></div>
              <div className="step">
                <div className="step-icon-circle step-cyan">
                  <IconUsers size={40} color="white" />
                </div>
                <div className="step-number">3</div>
                <h4 className="step-title">Collaborate live</h4>
              </div>
            </div>
          </div>
        </section>

        {/* ── Collaborate Section ── */}
        <section id="collaborate" className="home-section gradient-section">
          <div className="section-container text-center">
            <h2 className="section-title text-white" style={{ color: 'white' }}>Real time collaboration for everyone.</h2>
            <p className="hero-subheading text-white" style={{ opacity: 0.9 }}>
              No installs, no plugins, just share a link and start drawing together instantly.
            </p>
            <button 
              onClick={() => user ? setShowCreate(true) : showSignupModal()} 
              className="btn btn-primary cta-btn large-cta" 
              style={{ background: 'white', color: '#1e1b4b', border: 'none', marginBottom: '48px' }}
            >
              Start collaborating free
            </button>

            <div className="social-proof">
              <div className="avatars-row">
                {['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#d946ef'].map((c, i) => (
                  <div key={i} className="mock-avatar" style={{ background: c, zIndex: 5 - i }}>
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <p className="text-white font-medium">Join 10,000 creators and teams already collaborating.</p>
            </div>

            <div className="testimonials-grid">
              <div className="testimonial-card">
                <p className="quote">"This app completely changed how our remote team brainstorms. The AI diagramming saves us hours every week."</p>
                <div className="author">
                  <div className="author-avatar" style={{ background: '#3b82f6' }}>S</div>
                  <div className="author-info">
                    <strong>Sarah Jenkins</strong>
                    <span>Product Manager</span>
                  </div>
                </div>
              </div>
              <div className="testimonial-card">
                <p className="quote">"I use it for all my tutoring sessions. The real-time drawing is completely lag-free and my students love it."</p>
                <div className="author">
                  <div className="author-avatar" style={{ background: '#10b981' }}>M</div>
                  <div className="author-info">
                    <strong>Mark Davis</strong>
                    <span>Math Tutor</span>
                  </div>
                </div>
              </div>
              <div className="testimonial-card">
                <p className="quote">"The voice-to-diagram feature feels like magic. I can just talk through a system architecture and it appears."</p>
                <div className="author">
                  <div className="author-avatar" style={{ background: '#f59e0b' }}>E</div>
                  <div className="author-info">
                    <strong>Elena Rodriguez</strong>
                    <span>Software Engineer</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Dashboard Section ── */}
        {!user ? (
          <section className="home-section" style={{ background: 'white', textAlign: 'center', padding: '80px 24px' }}>
            <div className="section-container">
              <h2 className="font-bold text-24 mb-4" style={{ marginBottom: '16px' }}>Sign up to save and access your boards</h2>
              <button onClick={showSignupModal} className="btn btn-primary cta-btn">
                Sign up free
              </button>
            </div>
          </section>
        ) : (
          <section id="recent-boards" className="home-section" style={{ background: 'white' }}>
            <div className="section-container">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                <h2 className="font-bold text-24">Your recent boards</h2>
                <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
                  <IconSearch size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input className="input-field" placeholder="Search boards..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '48px', borderRadius: '9999px', width: '100%' }} />
                </div>
              </div>

              {boardsLoading ? (
                <div className="board-grid">
                  {[1, 2, 3].map(i => <div key={i} className="board-card-premium skeleton" style={{ minHeight: '240px' }} />)}
                </div>
              ) : (
                <div className="board-grid">
                  <div onClick={() => setShowCreate(true)} className="glass-card board-card-premium desktop-only" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-canvas)', borderStyle: 'dashed' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--primary)' }}>
                      <IconPlus size={48} style={{ marginBottom: '16px' }} />
                      <span className="font-bold text-20">New Board</span>
                    </div>
                  </div>

                  {filtered.map((board) => (
                    <div key={board.id} onClick={() => navigate(`/board/${board.id}`)} className="glass-card board-card-premium" style={{ padding: 0, overflow: 'hidden' }}>
                      <div style={{ height: '140px', background: board.thumbnail ? `url(${board.thumbnail}) center/cover` : 'linear-gradient(135deg, var(--primary), var(--secondary))', position: 'relative' }}>
                        {!board.thumbnail && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}><IconPencil size={48} color="white" /></div>}
                      </div>
                      <div style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                          <h3 className="font-bold text-20" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{board.name}</h3>
                          <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
                            <button onClick={(e) => copyLink(board.id, e)} className="btn btn-icon" style={{ padding: '6px' }}><IconShare size={18} /></button>
                            <button onClick={(e) => deleteBoard(board.id, e)} className="btn btn-icon" style={{ padding: '6px', color: 'var(--danger)' }}><IconTrash size={18} /></button>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '500' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><IconClock size={16} /> {board.createdAt ? new Date(board.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><IconUsers size={16} /> {board.collaborators?.length || 1}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="home-footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-col">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '900', fontSize: '18px' }}>
                  D
                </div>
                <span className="font-extrabold text-20 text-white">DrawSphere</span>
              </div>
              <p className="footer-tagline">Draw, think, and collaborate with AI.</p>
              <div className="footer-socials">
                <a href="#"><IconUsers size={20} /></a>
                <a href="#"><IconFileCode size={20} /></a>
                <a href="#"><IconBrain size={20} /></a>
              </div>
            </div>

            <div className="footer-col">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#aitools">AI Tools</a>
              <a href="/templates">Templates</a>
              <a href="#">Changelog</a>
              <a href="#">Roadmap</a>
            </div>

            <div className="footer-col">
              <h4>Resources</h4>
              <a href="#">Documentation</a>
              <a href="#">API Reference</a>
              <a href="#">Community</a>
              <a href="#">Blog</a>
              <a href="#">Status</a>
            </div>

            <div className="footer-col">
              <h4>Contact</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                <a href="tel:8317527369" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--primary)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                  <Phone size={16} />
                  <span>83175 27369</span>
                </a>
                <a href="mailto:mvreddy052005@gmail.com" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s', overflow: 'hidden', textOverflow: 'ellipsis' }} onMouseOver={e => e.currentTarget.style.color = 'var(--primary)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                  <Mail size={16} style={{ flexShrink: 0 }} />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>mvreddy052005@gmail.com</span>
                </a>
                <a href="https://www.linkedin.com/in/muduganti-venkateshwar-reddy/" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--primary)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  <span>LinkedIn</span>
                </a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; 2026 DrawSphere. Built by Venkateshwar Reddy.</p>
            <p>Made with love for creators and teams.</p>
          </div>
        </div>
      </footer>

      {/* Mobile FAB */}
      {user && (
        <button onClick={() => createBoard()} className="mobile-only mobile-fab">
          <IconPlus size={28} />
        </button>
      )}

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)} style={{ zIndex: 1000 }}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h2 className="font-extrabold" style={{ fontSize: '32px', marginBottom: '8px', letterSpacing: '-0.5px' }}>New Board</h2>
            <p className="font-medium text-16" style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Give your collaborative board a name</p>
            <form onSubmit={createBoard}>
              <input
                autoFocus
                className="input-field"
                style={{ marginBottom: '24px' }}
                placeholder="e.g. Project Brainstorm"
                value={newBoardName}
                onChange={e => setNewBoardName(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" className="btn" style={{ flex: 1 }} onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" disabled={creating} className="btn btn-primary" style={{ flex: 1 }}>
                  {creating ? <IconLoader className="spin" size={20} /> : 'Create Board'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
