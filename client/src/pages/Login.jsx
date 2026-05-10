import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { IconArrowLeft, IconLoader } from '@tabler/icons-react'

// Google G logo SVG
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const { user, loading, signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth()

  const [isSignUp, setIsSignUp] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      const redirect = localStorage.getItem('redirectAfterLogin') || '/home'
      localStorage.removeItem('redirectAfterLogin')
      navigate(redirect, { replace: true })
    }
  }, [user, loading, navigate])

  if (loading) return null

  const friendlyError = (err) => {
    switch (err.code) {
      case 'auth/user-not-found': return 'No account found with this email address'
      case 'auth/wrong-password': return 'Incorrect password. Please try again'
      case 'auth/invalid-email': return 'Please enter a valid email address'
      case 'auth/too-many-requests': return 'Too many failed attempts. Please try again later'
      case 'auth/user-disabled': return 'This account has been disabled'
      case 'auth/unauthorized-domain': return 'Login is not authorized from this domain. Please contact support'
      case 'auth/network-request-failed': return 'Network error. Please check your connection'
      case 'auth/invalid-credential': return 'Invalid email or password.'
      case 'auth/email-already-in-use': return 'An account with this email already exists.'
      case 'auth/weak-password': return 'Password must be at least 6 characters.'
      case 'auth/popup-closed-by-user': return 'Google sign-in was cancelled.'
      case 'auth/popup-blocked': return 'Popup blocked by browser. Please allow popups and try again.'
      default: return err.message || 'Something went wrong. Please try again.'
    }
  }

  const handleEmailSignIn = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    console.log('attempting sign in with email')
    try {
      const { user } = await signInWithEmail(email, password)
      console.log('sign in successful, user uid is', user?.uid)
      const redirect = localStorage.getItem('redirectAfterLogin') || '/home'
      localStorage.removeItem('redirectAfterLogin')
      navigate(redirect, { replace: true })
    } catch (err) {
      console.log('sign in error code', err.code, err.message)
      setError(friendlyError(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleEmailSignUp = async (e) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('Please enter your full name.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setSubmitting(true)
    console.log('attempting sign up with email')
    try {
      const { user } = await signUpWithEmail(name.trim(), email, password)
      console.log('sign up successful, user uid is', user?.uid)
      navigate('/home', { replace: true })
    } catch (err) {
      console.log('sign in error code', err.code, err.message)
      setError(friendlyError(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setGoogleLoading(true)
    console.log('attempting sign in with google')
    try {
      const { user } = await signInWithGoogle()
      console.log('sign in successful, user uid is', user?.uid)
      const redirect = localStorage.getItem('redirectAfterLogin') || '/home'
      localStorage.removeItem('redirectAfterLogin')
      navigate(redirect, { replace: true })
    } catch (err) {
      console.log('sign in error code', err.code, err.message)
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(friendlyError(err))
      }
    } finally {
      setGoogleLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '12px 16px', border: '2px solid #E5E7EB',
    borderRadius: '10px', fontSize: '15px', fontFamily: 'Outfit, sans-serif',
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
    background: '#FAFAFA', color: '#111827'
  }

  const labelStyle = {
    display: 'block', marginBottom: '6px',
    fontSize: '13px', fontWeight: '700', color: '#374151', fontFamily: 'Outfit, sans-serif'
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #F9FAFB 0%, #EEF2FF 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: 'Outfit, sans-serif', position: 'relative'
    }}>
      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        style={{
          position: 'absolute', top: '24px', left: '24px',
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'white', border: '1.5px solid #E5E7EB',
          borderRadius: '99px', padding: '8px 16px', cursor: 'pointer',
          fontSize: '14px', fontWeight: '600', color: '#374151',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)', fontFamily: 'Outfit, sans-serif'
        }}
      >
        <IconArrowLeft size={16} /> Back to home
      </button>

      {/* Card */}
      <div style={{
        background: 'white', borderRadius: '20px', padding: '48px 44px',
        width: '100%', maxWidth: '440px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.08)'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #7C3AED, #DB2777)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px', fontSize: '24px', fontWeight: '900', color: 'white'
          }}>D</div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#111827', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
            DrawSphere
          </h1>
          <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>
            {isSignUp ? 'Create your free account' : 'Welcome back to your workspace'}
          </p>
        </div>

        {/* Toggle tabs */}
        <div style={{
          display: 'flex', background: '#F3F4F6', borderRadius: '10px',
          padding: '4px', marginBottom: '28px'
        }}>
          {['Sign In', 'Sign Up'].map((tab, i) => (
            <button
              key={tab}
              onClick={() => { setIsSignUp(i === 1); setError('') }}
              style={{
                flex: 1, padding: '9px', border: 'none', borderRadius: '8px',
                cursor: 'pointer', fontSize: '14px', fontWeight: '600',
                fontFamily: 'Outfit, sans-serif', transition: 'all 0.2s',
                background: isSignUp === (i === 1) ? 'white' : 'transparent',
                color: isSignUp === (i === 1) ? '#111827' : '#6B7280',
                boxShadow: isSignUp === (i === 1) ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
              }}
            >{tab}</button>
          ))}
        </div>

        {/* Error */}
        {error && !submitting && (
          <div style={{
            padding: '12px 16px', background: '#FEF2F2', border: '1.5px solid #FECACA',
            borderRadius: '10px', color: '#DC2626', fontSize: '14px',
            fontWeight: '500', marginBottom: '20px', textAlign: 'center'
          }}>{error}</div>
        )}

        {/* Form */}
        <form onSubmit={isSignUp ? handleEmailSignUp : handleEmailSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isSignUp && (
            <div>
              <label style={labelStyle}>Full Name</label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Your full name" required style={inputStyle}
              />
            </div>
          )}
          <div>
            <label style={labelStyle}>Email Address</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" required style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder={isSignUp ? 'At least 6 characters' : 'Your password'} required style={inputStyle}
            />
          </div>
          {isSignUp && (
            <div>
              <label style={labelStyle}>Confirm Password</label>
              <input
                type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password" required style={inputStyle}
              />
            </div>
          )}

          <button
            type="submit" disabled={submitting || googleLoading}
            style={{
              width: '100%', padding: '14px', border: 'none', borderRadius: '10px',
              background: 'linear-gradient(135deg, #7C3AED, #DB2777)',
              color: 'white', fontSize: '16px', fontWeight: '700',
              cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'Outfit, sans-serif',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              opacity: submitting ? 0.8 : 1, marginTop: '4px',
              transition: 'opacity 0.2s'
            }}
          >
            {submitting
              ? <><IconLoader size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> {isSignUp ? 'Creating account...' : 'Signing in...'}</>
              : isSignUp ? 'Create Account' : 'Sign In'
            }
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
          <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
          <span style={{ color: '#9CA3AF', fontSize: '13px', fontWeight: '500' }}>or</span>
          <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
        </div>

        {/* Google button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={submitting || googleLoading}
          style={{
            width: '100%', padding: '13px', border: '1.5px solid #E5E7EB',
            borderRadius: '10px', background: 'white', cursor: googleLoading ? 'not-allowed' : 'pointer',
            fontSize: '15px', fontWeight: '600', color: '#374151',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            fontFamily: 'Outfit, sans-serif', opacity: googleLoading ? 0.7 : 1,
            transition: 'all 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
          }}
        >
          {googleLoading
            ? <IconLoader size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
            : <GoogleIcon />
          }
          Continue with Google
        </button>

        <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '12px', marginTop: '20px', marginBottom: 0 }}>
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus { border-color: #7C3AED !important; background: white !important; }
      `}</style>
    </div>
  )
}
