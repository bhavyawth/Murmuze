import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import SignUpPage from './pages/SignUpPage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import SettingsPage from './pages/SettingsPage'
import { useAuthStore } from './store/useAuthStore'
import { Loader } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { useThemeStore } from './store/useThemeStore'

const App = () => {
  const { authUser, isCheckingAuth, checkAuth } = useAuthStore();
  const { theme } = useThemeStore();
  
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth && !authUser) {
    return (
      <div>
        <Loader className="animate-spin h-8 w-8 text-orange-100 mx-auto mt-20" />
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${authUser ? 'bg-base-100' : 'bg-base-200'}`}
    data-theme={theme}>

    <Navbar />
    <Toaster />
      <Routes>
        <Route path="/" element={ authUser ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/signup" element={ !authUser ? <SignUpPage /> : <Navigate to="/" /> } />
        <Route path="/login" element={ !authUser ? <LoginPage /> : <Navigate to="/" /> } />
        <Route path="/profile" element={ authUser ? <ProfilePage /> : <Navigate to="/login" /> } />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>

    </div>
  )
}

export default App