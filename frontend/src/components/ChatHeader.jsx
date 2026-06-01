import { X, Phone, Video, Search, BarChart2 } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useCallStore } from "../store/useCallStore";
import { Link } from "react-router-dom";
import { useState } from "react";
import ChatSearchModal from "./ChatSearchModal";
import ChatStatsModal from "./ChatStatsModal";
import { motion } from "framer-motion";

export default function ChatHeader() {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const { initiateCall, activeCall } = useCallStore();
  const [showSearch, setShowSearch] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const isOnline = onlineUsers?.includes(selectedUser._id);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="px-4 py-3 border-b-2 border-base-content/10 bg-base-100 flex items-center justify-between"
      >
        <Link to={`/profile/${selectedUser._id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity group">
          <div className="relative">
            <img src={selectedUser.profilePic || "/avatar.png"} alt="" className="w-9 h-9 object-cover border-2 border-base-content/10 group-hover:border-primary/40 transition-colors" />
            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-base-100 ${isOnline ? "bg-success" : "bg-base-content/20"}`} />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-wide" style={{ fontFamily: "var(--font-display)" }}>
              {selectedUser.fullName.toUpperCase()}
            </h3>
            <p className={`text-[10px] font-mono ${isOnline ? "text-success" : "opacity-30"}`}>
              {isOnline ? "● online now" : "○ offline"}
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-0.5">
          {[
            { icon: <BarChart2 size={15} />, label: "Stats",   onClick: () => setShowStats(true) },
            { icon: <Search size={15} />,    label: "Search",  onClick: () => setShowSearch(true) },
            { icon: <Phone size={15} />,     label: "Voice",   onClick: () => !activeCall && initiateCall(selectedUser, "audio"), disabled: !!activeCall },
            { icon: <Video size={15} />,     label: "Video",   onClick: () => !activeCall && initiateCall(selectedUser, "video"), disabled: !!activeCall },
            { icon: <X size={15} />,         label: "Close",   onClick: () => setSelectedUser(null) },
          ].map(({ icon, label, onClick, disabled }) => (
            <button
              key={label}
              onClick={onClick}
              disabled={disabled}
              title={label}
              className="btn btn-ghost btn-sm btn-square hover:bg-primary/10 hover:text-primary disabled:opacity-20"
            >
              {icon}
            </button>
          ))}
        </div>
      </motion.div>

      {showSearch && <ChatSearchModal onClose={() => setShowSearch(false)} />}
      {showStats  && <ChatStatsModal  onClose={() => setShowStats(false)} />}
    </>
  );
}
