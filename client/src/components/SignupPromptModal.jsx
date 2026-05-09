import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconX } from '@tabler/icons-react'

export default function SignupPromptModal({ isOpen, onClose }) {
  const navigate = useNavigate()

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const handleSignup = () => {
    onClose()
    navigate('/login')
  }

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose} 
      style={{ 
        position: 'fixed', inset: 0, zIndex: 10000, 
        background: 'rgba(10, 10, 15, 0.85)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}
    >
      <div 
        className="modal-card" 
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: '16px', padding: '32px',
          maxWidth: '400px', width: '90%', position: 'relative',
          animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}
        >
          <IconX size={24} />
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ 
            width: '40px', height: '40px', borderRadius: '10px', 
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: '900', fontSize: '20px', marginBottom: '16px'
          }}>
            D
          </div>
          
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#111827', marginBottom: '12px', letterSpacing: '-0.5px' }}>
            Join DrawSphere to start creating
          </h2>
          
          <p style={{ color: '#6B7280', fontSize: '15px', marginBottom: '24px', lineHeight: 1.5 }}>
            Create boards, collaborate in real time, and use AI tools for free
          </p>

          <button 
            onClick={handleSignup} 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '14px', fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}
          >
            Sign up free
          </button>

          <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '32px' }}>
            Already have an account?{' '}
            <span onClick={handleSignup} style={{ color: 'var(--primary)', fontWeight: '600', cursor: 'pointer' }}>Sign in</span>
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            {['Free forever', 'Real time collaboration', 'AI powered'].map(badge => (
              <span key={badge} style={{ 
                background: '#F3F4F6', color: '#4B5563', padding: '6px 12px', 
                borderRadius: '99px', fontSize: '12px', fontWeight: '500' 
              }}>
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
