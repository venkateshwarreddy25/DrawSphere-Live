import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../firebase'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { IconPencil, IconArrowLeft } from '@tabler/icons-react'
import api from '../api'

export default function Login() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      let userCredential;
      if (mode === 'signup') {
        userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password)
        await updateProfile(userCredential.user, { displayName: form.name })
      } else {
        userCredential = await signInWithEmailAndPassword(auth, form.email, form.password)
      }

      const user = userCredential.user;
      const token = await user.getIdToken();

      const { data: mongoUser } = await api.post('/auth/sync', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      localStorage.setItem('wb_token', token)
      localStorage.setItem('wb_user', JSON.stringify(mongoUser))

      const redirect = localStorage.getItem('redirectAfterLogin') || '/'
      localStorage.removeItem('redirectAfterLogin')
      navigate(redirect)
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div style={{ position: 'absolute', top: '24px', left: '24px', zIndex: 100 }}>
        <button onClick={() => navigate('/')} className="btn" style={{ background: 'white', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '99px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-subtle)' }}>
          <IconArrowLeft size={16} />
          <span style={{ fontWeight: '600' }}>Back to home</span>
        </button>
      </div>
      <div className="glass-card" style={{ width: '100%', maxWidth: '440px', padding: '48px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: '32px' }}>
          <span className="font-extrabold text-20" style={{ fontSize: '36px', letterSpacing: '-1px' }}>DrawSphere</span>
          <p className="font-medium text-16" style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '8px' }}>
            {mode === 'login' ? 'Welcome back to your workspace' : 'Create an account to get started'}
          </p>
        </div>

        {error && (
          <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '2px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', color: 'var(--danger)', fontSize: '15px', fontWeight: '600', marginBottom: '24px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {mode === 'signup' && (
            <div>
              <label className="text-14 font-bold" style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>Full Name</label>
              <input type="text" className="input-field" placeholder="Enter a name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
          )}
          <div>
            <label className="text-14 font-bold" style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>Email Address</label>
            <input type="email" className="input-field" placeholder="Enter a email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
          <div>
            <label className="text-14 font-bold" style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>Password</label>
            <input type="password" className="input-field" placeholder="Enter a password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '16px', marginTop: '12px', fontSize: '18px' }}>
            {loading ? <IconPencil size={20} className="spin" /> : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="font-medium text-16" style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '32px' }}>
          {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
          <span
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
            style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: '700' }}
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </span>
        </p>
      </div>
    </div>
  )
}
