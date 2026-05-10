import { createContext, useState, useEffect, useContext } from 'react'
import { auth } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}>
        <div className="spin" style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid #E5E7EB', borderTopColor: '#7C3AED', marginBottom: '16px' }} />
        <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: '700', color: '#1F2937' }}>Loading DrawSphere...</h2>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
