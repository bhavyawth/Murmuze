import { useState, useEffect } from "react";
import { useFriendStore } from "../store/useFriendStore";
import { useAuthStore } from "../store/useAuthStore";
import { Search, UserPlus, Check, X, Users, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const TABS = ["friends", "requests", "find"];

function Avatar({ user, size = 9 }) {
  return (
    <img src={user.profilePic || "/avatar.png"} alt={user.fullName}
      className={`w-${size} h-${size} object-cover border border-base-content/10 shrink-0`} />
  );
}

export default function FriendsPanel({ onClose }) {
  const [tab, setTab] = useState("find");
  const [query, setQuery] = useState("");
  const { friends, pendingRequests, sentRequests, searchResults, isSearching,
    loadFriendsData, searchUsers, sendRequest, acceptRequest, declineRequest } = useFriendStore();
  const { onlineUsers } = useAuthStore();

  useEffect(() => { loadFriendsData(); }, []);
  useEffect(() => {
    const t = setTimeout(() => { if (query) searchUsers(query); }, 400);
    return () => clearTimeout(t);
  }, [query]);

  const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
  const item = { hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0, transition: { ease: [0.16, 1, 0.3, 1] } } };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.3 }}
        className="bg-base-100 border-2 border-base-content/10 w-full max-w-md relative flex flex-col"
        style={{ maxHeight: "80vh" }}
      >
        {/* Corner accents */}
        {["top-0 left-0 border-t-2 border-l-2","top-0 right-0 border-t-2 border-r-2",
          "bottom-0 left-0 border-b-2 border-l-2","bottom-0 right-0 border-b-2 border-r-2"].map((c, i) => (
          <span key={i} className={`absolute w-3 h-3 border-primary ${c}`} />
        ))}

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-base-content/10">
          <p className="text-[10px] font-mono tracking-widest opacity-50">// FRIENDS</p>
          <button onClick={onClose} className="btn btn-ghost btn-xs btn-square opacity-40 hover:opacity-80"><X size={14} /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-base-content/10">
          {[
            { id: "find", label: "FIND", icon: <Search size={11} /> },
            { id: "requests", label: `REQUESTS ${pendingRequests.length > 0 ? `(${pendingRequests.length})` : ""}`, icon: <Clock size={11} /> },
            { id: "friends", label: `MY FRIENDS (${friends.length})`, icon: <Users size={11} /> },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-[9px] font-mono tracking-widest transition-colors relative
                ${tab === t.id ? "text-primary" : "opacity-30 hover:opacity-60"}`}>
              {t.icon} {t.label}
              {tab === t.id && <motion.div layoutId="friends-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <AnimatePresence mode="wait">

            {/* FIND TAB */}
            {tab === "find" && (
              <motion.div key="find" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="relative mb-3">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
                  <input
                    autoFocus
                    className="input input-sm w-full pl-8 border-2 border-base-content/10 focus:border-primary bg-transparent"
                    placeholder="search by name..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}
                  />
                </div>
                {isSearching && <p className="text-[10px] font-mono opacity-30 text-center py-4">searching...</p>}
                {!isSearching && query.length >= 2 && searchResults.length === 0 && (
                  <p className="text-[10px] font-mono opacity-30 text-center py-4">// no users found</p>
                )}
                {!query && <p className="text-[10px] font-mono opacity-20 text-center py-4">// type to search for people</p>}
                <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-2">
                  {searchResults.map(user => (
                    <motion.div key={user._id} variants={item}
                      className="flex items-center gap-3 p-3 border border-base-content/10 hover:border-primary/30 transition-colors">
                      <Avatar user={user} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ fontFamily: "var(--font-display)" }}>{user.fullName}</p>
                        <p className="text-[9px] font-mono opacity-40">LV.{user.level || 1} · {user.xp || 0} XP</p>
                      </div>
                      {user.isFriend ? (
                        <span className="text-[9px] font-mono text-success border border-success/30 px-2 py-1">FRIENDS</span>
                      ) : user.requestSent ? (
                        <span className="text-[9px] font-mono opacity-40 border border-base-content/10 px-2 py-1">SENT</span>
                      ) : user.requestPending ? (
                        <button onClick={() => acceptRequest(user._id)} className="btn btn-success btn-xs gap-1">
                          <Check size={11} /> ACCEPT
                        </button>
                      ) : (
                        <button onClick={() => sendRequest(user._id)} className="btn btn-primary btn-xs gap-1">
                          <UserPlus size={11} /> ADD
                        </button>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            )}

            {/* REQUESTS TAB */}
            {tab === "requests" && (
              <motion.div key="requests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {pendingRequests.length === 0 && sentRequests.length === 0 ? (
                  <p className="text-[10px] font-mono opacity-30 text-center py-8">// no pending requests</p>
                ) : (
                  <>
                    {pendingRequests.length > 0 && (
                      <div className="mb-4">
                        <p className="text-[9px] font-mono opacity-40 mb-2 tracking-widest">INCOMING</p>
                        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-2">
                          {pendingRequests.map(user => (
                            <motion.div key={user._id} variants={item}
                              className="flex items-center gap-3 p-3 border border-base-content/10">
                              <Avatar user={user} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate" style={{ fontFamily: "var(--font-display)" }}>{user.fullName}</p>
                                <p className="text-[9px] font-mono opacity-40">LV.{user.level || 1}</p>
                              </div>
                              <div className="flex gap-1">
                                <button onClick={() => acceptRequest(user._id)} className="btn btn-success btn-xs btn-square"><Check size={12} /></button>
                                <button onClick={() => declineRequest(user._id)} className="btn btn-error btn-xs btn-square"><X size={12} /></button>
                              </div>
                            </motion.div>
                          ))}
                        </motion.div>
                      </div>
                    )}
                    {sentRequests.length > 0 && (
                      <div>
                        <p className="text-[9px] font-mono opacity-40 mb-2 tracking-widest">OUTGOING</p>
                        <div className="space-y-2">
                          {sentRequests.map(user => (
                            <div key={user._id} className="flex items-center gap-3 p-3 border border-base-content/10 opacity-60">
                              <Avatar user={user} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate" style={{ fontFamily: "var(--font-display)" }}>{user.fullName}</p>
                              </div>
                              <span className="text-[9px] font-mono opacity-50 border border-base-content/10 px-2 py-1">PENDING</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {/* FRIENDS TAB */}
            {tab === "friends" && (
              <motion.div key="friends" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {friends.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-[10px] font-mono opacity-30">// no friends yet</p>
                    <button onClick={() => setTab("find")} className="btn btn-primary btn-xs mt-3">FIND PEOPLE</button>
                  </div>
                ) : (
                  <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-2">
                    {friends.map(user => {
                      const isOnline = onlineUsers?.includes(user._id);
                      return (
                        <motion.div key={user._id} variants={item}
                          className="flex items-center gap-3 p-3 border border-base-content/10 hover:border-primary/20 transition-colors">
                          <div className="relative">
                            <Avatar user={user} />
                            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-base-100 ${isOnline ? "bg-success" : "bg-base-content/20"}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ fontFamily: "var(--font-display)" }}>{user.fullName}</p>
                            <p className={`text-[9px] font-mono ${isOnline ? "text-success" : "opacity-30"}`}>
                              {isOnline ? "● online" : "○ offline"} · LV.{user.level || 1}
                            </p>
                          </div>
                          {user.streak > 0 && <span className="text-[9px] font-mono opacity-40">🔥{user.streak}</span>}
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
