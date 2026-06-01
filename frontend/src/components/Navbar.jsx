import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import { useFriendStore } from "../store/useFriendStore";
import { LogOut, Settings, User, MessageSquare, Sun, Moon, Zap, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import FriendsPanel from "./FriendsPanel";
import { getLeague } from "./ActivityHeatmap";

export default function Navbar() {
  const { logout, authUser, socket } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const { pendingRequests, loadFriendsData } = useFriendStore();
  const navigate = useNavigate();
  const [showFriends, setShowFriends] = useState(false);
  const isDark = ["dark","night","dracula","black","luxury","halloween","forest","coffee","dim","sunset","synthwave","cyberpunk"].includes(theme);

  useEffect(() => { if (authUser) loadFriendsData(); }, [authUser]);

  // Listen for real-time friend request notifications
  useEffect(() => {
    if (!socket) return;
    const handleNewRequest = ({ fromName }) => {
      loadFriendsData();
      // toast is handled in store
    };
    socket.on("newFriendRequest", handleNewRequest);
    socket.on("friendRequestAccepted", loadFriendsData);
    return () => {
      socket.off("newFriendRequest", handleNewRequest);
      socket.off("friendRequestAccepted", loadFriendsData);
    };
  }, [socket]);

  const league = getLeague(authUser?.level || 1);

  return (
    <>
      <motion.header
        initial={{ y: -64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="bg-base-100 border-b-2 border-base-content/10 fixed w-full top-0 z-40"
      >
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 border-2 border-primary flex items-center justify-center group-hover:bg-primary transition-colors duration-200">
              <MessageSquare className="w-4 h-4 text-primary group-hover:text-primary-content transition-colors duration-200" />
            </div>
            <span className="font-bold tracking-widest text-sm" style={{ fontFamily: "var(--font-mono)" }}>MURMUZE</span>
          </Link>

          <div className="flex items-center gap-1">
            {authUser && (
              <div className="hidden sm:flex items-center gap-1 border px-3 py-1 mr-1"
                style={{ borderColor: league.color + "40", backgroundColor: league.color + "10", fontFamily: "var(--font-mono)", fontSize: "0.65rem" }}>
                <span>{league.emoji}</span>
                <span style={{ color: league.color }} className="font-bold">{league.name}</span>
                <span className="opacity-40 mx-1">·</span>
                <Zap size={10} className="text-primary" />
                <span className="text-primary font-bold">LV.{authUser.level || 1}</span>
              </div>
            )}

            <button onClick={() => setTheme(isDark ? "light" : "dark")} className="btn btn-ghost btn-sm btn-square">
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {authUser && (
              <button onClick={() => setShowFriends(true)} className="btn btn-ghost btn-sm btn-square relative">
                <Users size={15} />
                {pendingRequests.length > 0 && (
                  <motion.span
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-error text-error-content text-[8px] font-bold flex items-center justify-center"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {pendingRequests.length}
                  </motion.span>
                )}
              </button>
            )}

            <Link to="/settings" className="btn btn-ghost btn-sm gap-1">
              <Settings size={14} /><span className="hidden sm:inline">Settings</span>
            </Link>

            {authUser && (
              <>
                <Link to="/profile" className="btn btn-ghost btn-sm gap-1">
                  <User size={14} /><span className="hidden sm:inline">Profile</span>
                </Link>
                <button className="btn btn-ghost btn-sm gap-1" onClick={async () => { await logout(); navigate("/login"); }}>
                  <LogOut size={14} /><span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {showFriends && <FriendsPanel onClose={() => setShowFriends(false)} />}
      </AnimatePresence>
    </>
  );
}
