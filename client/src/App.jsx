import { createContext, useState, useContext } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import Login from './pages/Login'
import Home from './pages/Home'
import Board from './pages/Board'
import Templates from './pages/Templates'
import SignupPromptModal from './components/SignupPromptModal'
import { AuthProvider, useAuth } from './contexts/AuthContext'

export const AuthModalContext = createContext({ showSignupModal: () => {} })

export function useAuthModal() {
  return useContext(AuthModalContext)
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  
  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0A0A0F' }}>
        <div className="spin" style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid #374151', borderTopColor: '#7C3AED', marginBottom: '16px' }} />
        <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: '700', color: '#F3F4F6' }}>Loading board...</h2>
      </div>
    )
  }
  
  if (!user) {
    localStorage.setItem('redirectAfterLogin', location.pathname)
    return <Navigate to="/login" replace />
  }
  return children
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) {
    return <Navigate to="/home" replace />
  }
  return children
}

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <AuthProvider>
      <AppContent isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} />
    </AuthProvider>
  )
}

function AppContent({ isModalOpen, setIsModalOpen }) {
  const { user, loading } = useAuth()

  const showSignupModal = () => {
    if (loading) return
    if (!user) setIsModalOpen(true)
  }

  return (
    <AuthModalContext.Provider value={{ showSignupModal }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/board/:boardId" element={<ProtectedRoute><Board /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <SignupPromptModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </BrowserRouter>
    </AuthModalContext.Provider>
  )
}
