import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useFriendStore } from "../store/useFriendStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Phone, Trophy, MessageSquare } from "lucide-react";
import { formatMessageTime } from "../lib/util";
import { motion, AnimatePresence } from "framer-motion";

const CallLogItem = ({ log, myId }) => {
  const isOut = log.callerId?._id === myId;
  const other = isOut ? log.receiverId : log.callerId;
  const color = log.status === "missed" ? "text-error" : "text-success";
  return (
    <div className="flex items-center gap-3 p-3 border-b border-base-content/5 hover:bg-base-200/60 transition-colors">
      <img src={other?.profilePic || "/avatar.png"} className="w-9 h-9 object-cover border border-base-content/10" alt="" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-xs truncate" style={{ fontFamily: "var(--font-display)" }}>{other?.fullName}</p>
        <p className={`text-[10px] font-mono ${color}`}>
          {isOut ? "↗" : "↙"} {log.type} · {log.status}
          {log.duration > 0 && ` · ${Math.floor(log.duration / 60)}m${log.duration % 60}s`}
        </p>
      </div>
      <span className="text-[10px] opacity-30 font-mono shrink-0">{formatMessageTime(log.createdAt)}</span>
    </div>
  );
};

const medals = ["🥇","🥈","🥉"];
const LeaderboardItem = ({ user, rank }) => (
  <div className="flex items-center gap-3 p-3 border-b border-base-content/5 hover:bg-base-200/60 transition-colors">
    <span className="text-base w-6 text-center">{medals[rank] || `#${rank+1}`}</span>
    <img src={user.profilePic || "/avatar.png"} className="w-9 h-9 object-cover border border-base-content/10" alt="" />
    <div className="flex-1 min-w-0">
      <p className="font-semibold text-xs truncate" style={{ fontFamily: "var(--font-display)" }}>{user.fullName}</p>
      <p className="text-[10px] font-mono opacity-40">LV.{user.level} · {user.xp} XP · 🔥{user.streak}</p>
    </div>
  </div>
);

const TABS = [
  { id: "chats", icon: <MessageSquare size={13} />, label: "CHATS" },
  { id: "calls", icon: <Phone size={13} />,         label: "CALLS" },
  { id: "top",   icon: <Trophy size={13} />,         label: "TOP"   },
];

export default function Sidebar() {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading, unreadCounts, getCallLogs, callLogs } = useChatStore();
  const { onlineUsers, authUser, socket } = useAuthStore();
  const { loadFriendsData } = useFriendStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("chats");
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    getUsers();
    getCallLogs();
  }, []);

  // Re-fetch users when a friend request is accepted (new friend appears)
  useEffect(() => {
    if (!socket) return;
    const refresh = () => { getUsers(); loadFriendsData(); };
    socket.on("friendRequestAccepted", refresh);
    socket.on("newFriendRequest", () => loadFriendsData());
    return () => {
      socket.off("friendRequestAccepted", refresh);
      socket.off("newFriendRequest");
    };
  }, [socket]);

  useEffect(() => {
    if (activeTab === "top") {
      import("../lib/axios").then(({ axiosInstance }) => {
        axiosInstance.get("/auth/leaderboard").then(r => setLeaderboard(r.data)).catch(() => {});
      });
    }
  }, [activeTab]);

  const filtered = users.filter(u => {
    if (showOnlineOnly && !onlineUsers?.includes(u._id)) return false;
    if (search.trim()) return u.fullName.toLowerCase().includes(search.toLowerCase());
    return true;
  });

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-16 lg:w-72 border-r-2 border-base-content/10 flex flex-col bg-base-100">
      {/* Tab bar */}
      <div className="border-b-2 border-base-content/10 flex">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 text-[9px] font-bold tracking-widest transition-colors relative
              ${activeTab === tab.id ? "text-primary bg-primary/5" : "opacity-40 hover:opacity-70"}`}
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {tab.icon}
            <span className="hidden lg:block">{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Search + filter for chats */}
      {activeTab === "chats" && (
        <div className="hidden lg:block p-2 border-b border-base-content/10">
          <input
            type="text"
            className="input input-sm w-full bg-base-200 border-base-content/10 text-xs"
            placeholder="// search friends"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ fontFamily: "var(--font-mono)" }}
          />
          <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
            <input type="checkbox" className="checkbox checkbox-xs checkbox-primary"
              checked={showOnlineOnly} onChange={e => setShowOnlineOnly(e.target.checked)} />
            <span className="text-[10px] opacity-50 font-mono">
              online only ({(onlineUsers?.filter(id => users.some(u => u._id === id))?.length) || 0})
            </span>
          </label>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">

          {activeTab === "chats" && (
            <motion.div key="chats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {filtered.length === 0 && (
                <div className="p-6 text-center">
                  <p className="text-[10px] font-mono opacity-30 mb-2">no friends yet</p>
                  <p className="text-[9px] font-mono opacity-20">use the 👥 button in navbar to add friends</p>
                </div>
              )}
              {filtered.map((user, i) => {
                const unread = unreadCounts[user._id] || 0;
                const isOnline = onlineUsers?.includes(user._id);
                const isSelected = selectedUser?._id === user._id;
                return (
                  <motion.button
                    key={user._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
                    onClick={() => setSelectedUser(user)}
                    className={`w-full flex items-center gap-3 p-3 border-b border-base-content/5 hover:bg-base-200/60 transition-colors text-left relative
                      ${isSelected ? "bg-primary/8 border-l-2 border-l-primary" : ""}`}
                  >
                    <div className="relative mx-auto lg:mx-0 shrink-0">
                      <img src={user.profilePic || "/avatar.png"} className="w-9 h-9 object-cover border border-base-content/10" alt="" />
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-base-100 ${isOnline ? "bg-success" : "bg-base-content/20"}`} />
                      {unread > 0 && (
                        <span className="absolute -top-1 -right-1 bg-primary text-primary-content text-[9px] font-bold min-w-[16px] h-4 flex items-center justify-center px-1"
                          style={{ fontFamily: "var(--font-mono)" }}>
                          {unread > 9 ? "9+" : unread}
                        </span>
                      )}
                    </div>
                    <div className="hidden lg:flex flex-col min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs truncate" style={{ fontFamily: "var(--font-display)" }}>{user.fullName}</span>
                        <span className="text-[9px] opacity-30 font-mono shrink-0 ml-1">LV.{user.level||1}</span>
                      </div>
                      <span className={`text-[10px] font-mono ${isOnline ? "text-success" : "opacity-30"}`}>
                        {isOnline ? "● online" : "○ offline"}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          )}

          {activeTab === "calls" && (
            <motion.div key="calls" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {callLogs.length === 0
                ? <div className="p-6 text-center text-[10px] font-mono opacity-30">no call history</div>
                : callLogs.map(log => <CallLogItem key={log._id} log={log} myId={authUser._id} />)
              }
            </motion.div>
          )}

          {activeTab === "top" && (
            <motion.div key="top" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="p-2 border-b border-base-content/10">
                <p className="text-[9px] font-mono opacity-30 hidden lg:block">// top chatters by xp</p>
              </div>
              {leaderboard.map((u, i) => <LeaderboardItem key={u._id} user={u} rank={i} />)}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </aside>
  );
}
