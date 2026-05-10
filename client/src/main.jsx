import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

if (import.meta.env.DEV) {
  console.log('--- ENV VARIABLES ---')
  console.log('VITE_BACKEND_URL:', import.meta.env.VITE_BACKEND_URL)
  console.log('VITE_SOCKET_URL:', import.meta.env.VITE_SOCKET_URL)
  console.log('---------------------')
}

if (!import.meta.env.VITE_BACKEND_URL) {
  console.warn('VITE_BACKEND_URL is not set. AI features will not work.')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
