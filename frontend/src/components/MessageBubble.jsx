import { useState } from "react";
import { formatMessageTime } from "../lib/util";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { Trash2, Check, CheckCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const QUICK_EMOJIS = ["❤️","😂","👍","😮","😢","🔥","👏","🎉"];

const PollMessage = ({ message }) => {
  const { voteOnPoll } = useChatStore();
  const { authUser } = useAuthStore();
  const { poll } = message;
  if (!poll?.question) return null;
  const total = poll.options.reduce((s, o) => s + (o.votes?.length || 0), 0);
  return (
    <div className="min-w-[200px]">
      <p className="font-bold text-xs mb-3 tracking-wide" style={{ fontFamily: "var(--font-mono)" }}>
        ▸ {poll.question}
      </p>
      {poll.options.map((opt, i) => {
        const votes = opt.votes?.length || 0;
        const pct = total > 0 ? Math.round((votes / total) * 100) : 0;
        const voted = opt.votes?.some(v => (v?._id || v?.toString?.() || v) === authUser._id);
        return (
          <button key={i} onClick={() => voteOnPoll(message._id, i)} className="w-full mb-2 text-left group">
            <div className="flex justify-between text-[10px] mb-1 font-mono">
              <span className={voted ? "text-primary font-bold" : "opacity-70"}>{opt.text}</span>
              <span className="opacity-50">{pct}%</span>
            </div>
            <div className="w-full bg-base-content/10 h-1.5">
              <motion.div
                className={`h-1.5 ${voted ? "bg-primary" : "bg-base-content/30"}`}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </button>
        );
      })}
      <p className="text-[9px] font-mono opacity-30 mt-1">{total} vote{total !== 1 ? "s" : ""}</p>
    </div>
  );
};

export default function MessageBubble({ message }) {
  const { authUser } = useAuthStore();
  const { deleteMessage, reactToMessage } = useChatStore();
  const [showActions, setShowActions] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const isMine = (message.senderId?._id || message.senderId) === authUser._id;

  if (message.isDeleted) {
    return (
      <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-2`}>
        <span className="text-[11px] font-mono opacity-30 italic border border-base-content/10 px-3 py-1">
          ⌫ deleted
        </span>
      </div>
    );
  }

  const reactionMap = {};
  (message.reactions || []).forEach(r => { reactionMap[r.emoji] = (reactionMap[r.emoji] || 0) + 1; });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={`flex ${isMine ? "justify-end" : "justify-start"} mb-3 group relative`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowEmoji(false); }}
    >
      <div className={`flex items-end gap-2 max-w-[75%] ${isMine ? "flex-row-reverse" : "flex-row"}`}>
        {/* Avatar */}
        <img
          src={isMine ? (authUser.profilePic || "/avatar.png") : "/avatar.png"}
          className="w-6 h-6 object-cover border border-base-content/10 shrink-0 mb-1"
          alt=""
        />

        <div className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
          {/* Reply quote */}
          {message.replyTo && (
            <div className="border-l-2 border-primary/50 pl-2 mb-1 opacity-60 text-[10px] font-mono max-w-xs truncate">
              ↩ {message.replyTo.text || (message.replyTo.image ? "📷 photo" : "🎤 voice")}
            </div>
          )}

          {/* Bubble */}
          <div className={`relative px-3 py-2 text-sm border-2
            ${isMine
              ? "bg-primary text-primary-content border-primary"
              : "bg-base-200 border-base-content/10"
            }`}
            style={{ borderRadius: "2px" }}
          >
            {message.messageType === "poll" ? <PollMessage message={message} /> : (
              <>
                {message.image && <img src={message.image} className="max-w-[200px] mb-2 border border-base-content/10" alt="" />}
                {message.gif   && <img src={message.gif}   className="max-w-[200px] mb-2" alt="gif" />}
                {message.audio && <audio controls src={message.audio} className="max-w-[200px] h-8" />}
                {message.text  && <p className="break-words leading-relaxed">{message.text}</p>}
              </>
            )}
            {message.expiresAt && (
              <p className="text-[9px] font-mono opacity-40 mt-1">⏱ disappears soon</p>
            )}
          </div>

          {/* Time + read receipt */}
          <div className={`flex items-center gap-1 mt-0.5 ${isMine ? "flex-row-reverse" : ""}`}>
            <span className="text-[9px] font-mono opacity-30">{formatMessageTime(message.createdAt)}</span>
            {isMine && (
              message.isRead
                ? <CheckCheck size={10} className="text-primary" />
                : <Check size={10} className="opacity-30" />
            )}
          </div>

          {/* Reactions */}
          {Object.keys(reactionMap).length > 0 && (
            <div className={`flex gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}>
              {Object.entries(reactionMap).map(([emoji, count]) => (
                <button
                  key={emoji}
                  onClick={() => reactToMessage(message._id, emoji)}
                  className="border border-base-content/10 bg-base-100 hover:border-primary/40 text-xs px-1.5 py-0.5 transition-colors"
                >
                  {emoji}{count > 1 ? <span className="text-[9px] opacity-50 ml-0.5">{count}</span> : ""}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action bar */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              className={`absolute ${isMine ? "right-full mr-2" : "left-full ml-2"} top-0 flex items-center gap-1 bg-base-100 border-2 border-base-content/10 p-1 z-10`}
            >
              {showEmoji ? (
                <div className="flex gap-1">
                  {QUICK_EMOJIS.map(e => (
                    <button key={e} onClick={() => { reactToMessage(message._id, e); setShowEmoji(false); setShowActions(false); }}
                      className="text-sm hover:scale-125 transition-transform">
                      {e}
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  <button onClick={() => setShowEmoji(true)} className="btn btn-ghost btn-xs btn-square text-base-content/40 hover:text-primary text-xs">😊</button>
                  {isMine && (
                    <button onClick={() => deleteMessage(message._id)} className="btn btn-ghost btn-xs btn-square text-error/60 hover:text-error">
                      <Trash2 size={12} />
                    </button>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
