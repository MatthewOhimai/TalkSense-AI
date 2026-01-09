import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'
import { AuthProvider } from './context/AuthContext'

import { GoogleOAuthProvider } from '@react-oauth/google'

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "your_google_client_id_here"

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
        <BrowserRouter>
            <AuthProvider>
                <ErrorBoundary>
                  <App />
                </ErrorBoundary>
                <Toaster 
                    position="top-right"
                    toastOptions={{
                        style: {
                            background: '#1E293B',
                            color: '#fff',
                            border: '1px solid #334155',
                        },
                        success: {
                            iconTheme: {
                                primary: '#22C55E',
                                secondary: '#fff',
                            },
                        },
                        error: {
                            iconTheme: {
                                primary: '#EF4444',
                                secondary: '#fff',
                            },
                        },
                    }}
                />
            </AuthProvider>
        </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>,
)
