import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api'

const TEMPLATES = [
  {
    id: 'flowchart', name: 'Basic Flowchart',
    desc: 'Simple boxes and arrows for processes.',
    color: '#3b82f6',
    state: {"version":"5.3.0","objects":[{"type":"rect","left":200,"top":100,"width":160,"height":80,"fill":"#eff6ff","stroke":"#3b82f6","strokeWidth":2,"rx":8,"ry":8},{"type":"i-text","text":"Start","left":250,"top":130,"fontSize":20,"fill":"#1e3a8a","fontFamily":"Outfit"},{"type":"rect","left":200,"top":280,"width":160,"height":80,"fill":"#eff6ff","stroke":"#3b82f6","strokeWidth":2,"rx":8,"ry":8},{"type":"i-text","text":"Process","left":240,"top":310,"fontSize":20,"fill":"#1e3a8a","fontFamily":"Outfit"},{"type":"path","path":[["M",280,180],["L",280,280]],"fill":null,"stroke":"#94a3b8","strokeWidth":2},{"type":"polygon","points":[{"x":280,"y":280},{"x":275,"y":270},{"x":285,"y":270}],"fill":"#94a3b8"}]}
  },
  {
    id: 'mindmap', name: 'Mind Map',
    desc: 'Central idea branching outwards.',
    color: '#d946ef',
    state: {"version":"5.3.0","objects":[{"type":"circle","left":400,"top":300,"radius":60,"fill":"#fae8ff","stroke":"#d946ef","strokeWidth":2},{"type":"i-text","text":"Core","left":440,"top":350,"fontSize":20,"fill":"#701a75","fontFamily":"Outfit"},{"type":"circle","left":200,"top":150,"radius":40,"fill":"#f3f4f6","stroke":"#9ca3af","strokeWidth":2},{"type":"circle","left":600,"top":150,"radius":40,"fill":"#f3f4f6","stroke":"#9ca3af","strokeWidth":2},{"type":"path","path":[["M",460,300],["L",240,190]],"stroke":"#cbd5e1","strokeWidth":2,"fill":null},{"type":"path","path":[["M",460,300],["L",640,190]],"stroke":"#cbd5e1","strokeWidth":2,"fill":null}]}
  },
  {
    id: 'kanban', name: 'Kanban Board',
    desc: 'To Do, Doing, Done columns.',
    color: '#f59e0b',
    state: {"version":"5.3.0","objects":[{"type":"rect","left":100,"top":100,"width":250,"height":600,"fill":"#f8fafc","stroke":"#e2e8f0","strokeWidth":1,"rx":8,"ry":8},{"type":"i-text","text":"To Do","left":190,"top":120,"fontSize":24,"fill":"#334155","fontFamily":"Outfit"},{"type":"rect","left":400,"top":100,"width":250,"height":600,"fill":"#f8fafc","stroke":"#e2e8f0","strokeWidth":1,"rx":8,"ry":8},{"type":"i-text","text":"Doing","left":490,"top":120,"fontSize":24,"fill":"#334155","fontFamily":"Outfit"},{"type":"rect","left":700,"top":100,"width":250,"height":600,"fill":"#f8fafc","stroke":"#e2e8f0","strokeWidth":1,"rx":8,"ry":8},{"type":"i-text","text":"Done","left":790,"top":120,"fontSize":24,"fill":"#334155","fontFamily":"Outfit"}]}
  },
  {
    id: 'brainstorm', name: 'Brainstorming Canvas',
    desc: 'Sticky notes spread everywhere.',
    color: '#10b981',
    state: {"version":"5.3.0","objects":[{"type":"rect","left":200,"top":200,"width":160,"height":160,"fill":"#fef08a","rx":4,"ry":4,"shadow":{"color":"rgba(0,0,0,0.1)","blur":8,"offsetX":2,"offsetY":4}},{"type":"rect","left":400,"top":300,"width":160,"height":160,"fill":"#bbf7d0","rx":4,"ry":4,"shadow":{"color":"rgba(0,0,0,0.1)","blur":8,"offsetX":2,"offsetY":4}},{"type":"rect","left":600,"top":150,"width":160,"height":160,"fill":"#bfdbfe","rx":4,"ry":4,"shadow":{"color":"rgba(0,0,0,0.1)","blur":8,"offsetX":2,"offsetY":4}}]}
  }
]

import { IconArrowLeft } from '@tabler/icons-react'

export default function Templates() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('wb_user') || '{}')
  const [creating, setCreating] = useState(null)

  const handleUseTemplate = async (template) => {
    if (!user._id) {
      navigate('/login')
      return
    }
    setCreating(template.id)
    try {
      const { data } = await api.post('/boards', { 
        name: `${template.name} - New`,
        canvasState: JSON.stringify(template.state)
      })
      navigate(`/board/${data._id}`)
    } catch (e) {
      console.error(e)
      setCreating(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', width: '100vw', maxWidth: '100vw', overflowX: 'hidden' }}>
      <Navbar user={user} onCreateBoard={() => navigate('/')} />
      
      <main style={{ flex: 1, padding: '80px 24px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ maxWidth: '1200px', width: '100%' }}>
          <button 
            onClick={() => navigate('/')} 
            className="btn glass-card" 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', marginBottom: '32px', borderRadius: '99px', border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.5)' }}
          >
            <IconArrowLeft size={18} /> <span className="font-semibold text-14">Back to Home</span>
          </button>
          
          <h1 className="font-extrabold text-32" style={{ marginBottom: '16px' }}>Templates</h1>
          <p className="text-16" style={{ color: 'var(--text-secondary)', marginBottom: '48px', maxWidth: '600px' }}>
            Jumpstart your ideas with pre-made templates. Click a template to create a new board with its structure instantly.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {TEMPLATES.map(t => (
              <div key={t.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
                {/* Thumbnail Preview Area */}
                <div style={{ height: '160px', background: `${t.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <div style={{ width: '100px', height: '60px', background: 'white', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', border: `2px solid ${t.color}`, position: 'absolute', transform: 'rotate(-5deg)' }} />
                  <div style={{ width: '80px', height: '80px', background: 'white', borderRadius: '50%', boxShadow: 'var(--shadow-sm)', border: `2px dashed ${t.color}`, position: 'absolute', transform: 'translate(40px, 10px)' }} />
                </div>
                
                <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 className="font-bold text-20" style={{ marginBottom: '8px' }}>{t.name}</h3>
                  <p className="text-14" style={{ color: 'var(--text-secondary)', marginBottom: '24px', flex: 1 }}>{t.desc}</p>
                  
                  <button 
                    onClick={() => handleUseTemplate(t)}
                    disabled={creating === t.id}
                    className="btn btn-primary" 
                    style={{ width: '100%' }}
                  >
                    {creating === t.id ? 'Creating...' : 'Use Template'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
