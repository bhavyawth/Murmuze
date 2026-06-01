import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import UserProfilePage from "./pages/UserProfilePage";
import { MessageSquare } from "lucide-react";

export default function App() {
  const { authUser, isCheckingAuth, checkAuth } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => { checkAuth(); }, []);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-base-100 grid-bg" data-theme={theme}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.5 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-14 h-14 border-2 border-primary flex items-center justify-center relative">
            <MessageSquare className="text-primary" size={24} />
            <motion.span
              className="absolute inset-0 border-2 border-primary"
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          </div>
          <p className="text-[10px] font-mono tracking-widest opacity-40">LOADING MURMUZE...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" data-theme={theme}>
      <Navbar />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: "0px",
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            letterSpacing: "0.02em",
            border: "2px solid",
          },
        }}
      />
      <Routes>
        <Route path="/"           element={authUser ? <HomePage />       : <Navigate to="/login" />} />
        <Route path="/signup"     element={!authUser ? <SignUpPage />    : <Navigate to="/" />} />
        <Route path="/login"      element={!authUser ? <LoginPage />     : <Navigate to="/" />} />
        <Route path="/profile"    element={authUser ? <ProfilePage />    : <Navigate to="/login" />} />
        <Route path="/profile/:id" element={authUser ? <UserProfilePage /> : <Navigate to="/login" />} />
        <Route path="/settings"   element={<SettingsPage />} />
      </Routes>
    </div>
  );
}
