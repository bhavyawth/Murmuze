import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";

const features = [
  { icon: "🎥", title: "VIDEO CALLS",     desc: "WebRTC peer-to-peer" },
  { icon: "🏆", title: "XP & LEVELS",     desc: "Level up as you chat" },
  { icon: "📊", title: "POLLS",           desc: "Live-voting messages" },
  { icon: "🎤", title: "VOICE MSGS",      desc: "Record & send audio" },
  { icon: "👻", title: "GHOST MODE",      desc: "Self-destructing msgs" },
  { icon: "📈", title: "CHAT STATS",      desc: "Deep insights" },
  { icon: "⏳", title: "TIME CAPSULE",    desc: "Schedule future msgs" },
  { icon: "😄", title: "REACTIONS",       desc: "Express instantly" },
];

export default function NoChatSelected() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 grid-bg overflow-hidden">
      {/* Big logo mark */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="mb-8 relative"
      >
        <div className="w-20 h-20 border-2 border-primary flex items-center justify-center relative">
          <MessageSquare className="w-9 h-9 text-primary" />
          {/* corner dots */}
          <span className="absolute -top-1 -left-1 w-2 h-2 bg-primary" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary" />
          <span className="absolute -bottom-1 -left-1 w-2 h-2 bg-primary" />
          <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-primary" />
        </div>
        {/* blinking cursor */}
        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-px h-4 bg-primary animate-blink" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-10"
      >
        <h2 className="text-3xl font-bold tracking-tight mb-1" style={{ fontFamily: "var(--font-display)" }}>
          WELCOME TO MURMUZE
        </h2>
        <p className="text-base-content/40 text-sm" style={{ fontFamily: "var(--font-mono)" }}>
          // select a contact to begin
        </p>
      </motion.div>

      <motion.div
        className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full max-w-xl"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.05 } },
        }}
      >
        {features.map((f) => (
          <motion.div
            key={f.title}
            variants={{
              hidden: { opacity: 0, y: 16 },
              show: { opacity: 1, y: 0, transition: { ease: [0.16, 1, 0.3, 1], duration: 0.45 } },
            }}
            whileHover={{ scale: 1.03, transition: { duration: 0.15 } }}
            className="border border-base-content/10 p-3 hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-default"
          >
            <div className="text-xl mb-1">{f.icon}</div>
            <p className="text-[10px] font-bold tracking-widest" style={{ fontFamily: "var(--font-mono)" }}>{f.title}</p>
            <p className="text-[10px] opacity-40 mt-0.5">{f.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
