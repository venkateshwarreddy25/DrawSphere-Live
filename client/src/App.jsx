import { createContext, useState, useContext } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import Login from './pages/Login'
import Home from './pages/Home'
import Board from './pages/Board'
import Templates from './pages/Templates'
import SignupPromptModal from './components/SignupPromptModal'

export const AuthModalContext = createContext({ showSignupModal: () => {} })

export function useAuthModal() {
  return useContext(AuthModalContext)
}

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('wb_token')
  const location = useLocation()
  
  if (!token) {
    localStorage.setItem('redirectAfterLogin', location.pathname)
    return <Navigate to="/" replace />
  }
  return children
}

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const showSignupModal = () => {
    setIsModalOpen(true)
  }

  return (
    <AuthModalContext.Provider value={{ showSignupModal }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Home />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/board/:boardId" element={<ProtectedRoute><Board /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <SignupPromptModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </BrowserRouter>
    </AuthModalContext.Provider>
  )
}
