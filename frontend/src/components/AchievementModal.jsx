import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export const ACHIEVEMENTS_META = {
  first_message:    { e: "💬", label: "First Message",   desc: "Send your very first message to anyone.", how: "Just send a message!" },
  hundred_messages: { e: "💯", label: "Centurion",       desc: "Send 100 messages total across all chats.", how: "Keep chatting — 100 messages total." },
  night_owl:        { e: "🦉", label: "Night Owl",       desc: "Send a message between midnight and 5 AM.", how: "Stay up late and send a message 🌙" },
  chatterbox:       { e: "🗣️", label: "Chatterbox",      desc: "You never stop talking — prolific sender.", how: "Keep up a high message volume." },
  streak_7:         { e: "🔥", label: "Week Warrior",    desc: "Maintain a 7-day consecutive chat streak.", how: "Chat every day for 7 days in a row." },
  streak_30:        { e: "⚡", label: "Monthly Legend",  desc: "30 days straight without missing a day.", how: "Chat every day for a full month." },
  image_sender:     { e: "📸", label: "Picture Perfect", desc: "Send your first photo or image in a chat.", how: "Use the 📷 button to send an image." },
  voice_sender:     { e: "🎤", label: "Voice Actor",     desc: "Record and send your first voice message.", how: "Hit 🎤 in the chat input, record, send." },
  poll_creator:     { e: "📊", label: "Decision Maker",  desc: "Create and send a poll to settle a debate.", how: "Use + → Poll in the message input." },
};

export default function AchievementModal({ achievement, unlocked, onClose }) {
  const meta = ACHIEVEMENTS_META[achievement];
  if (!meta) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.4 }}
          className={`bg-base-100 border-2 w-72 p-6 relative text-center
            ${unlocked ? "border-primary" : "border-base-content/10"}`}
        >
          {/* Corner accents */}
          {["top-0 left-0 border-t-2 border-l-2","top-0 right-0 border-t-2 border-r-2",
            "bottom-0 left-0 border-b-2 border-l-2","bottom-0 right-0 border-b-2 border-r-2"].map((c, i) => (
            <span key={i} className={`absolute w-3 h-3 ${unlocked ? "border-primary" : "border-base-content/20"} ${c}`} />
          ))}

          <button onClick={onClose} className="absolute top-3 right-3 btn btn-ghost btn-xs btn-square opacity-30 hover:opacity-80">
            <X size={12} />
          </button>

          {/* Emoji with animation */}
          <motion.div
            animate={unlocked ? { scale: [1, 1.2, 1], rotate: [0, -5, 5, 0] } : {}}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className={`text-5xl mb-4 inline-block ${!unlocked ? "grayscale opacity-30" : ""}`}
          >
            {meta.e}
          </motion.div>

          {unlocked && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[9px] font-mono text-primary tracking-widest mb-2"
            >
              ✓ UNLOCKED
            </motion.div>
          )}
          {!unlocked && (
            <div className="text-[9px] font-mono opacity-30 tracking-widest mb-2">LOCKED</div>
          )}

          <h3 className="text-lg font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
            {meta.label}
          </h3>

          <p className="text-xs opacity-60 mb-4 leading-relaxed">{meta.desc}</p>

          {!unlocked && (
            <div className="border border-dashed border-primary/30 p-3">
              <p className="text-[9px] font-mono opacity-40 mb-1 tracking-widest">HOW TO UNLOCK</p>
              <p className="text-xs text-primary/70 font-mono">{meta.how}</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
