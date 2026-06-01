import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const HOUR_LABELS = ["12a","1a","2a","3a","4a","5a","6a","7a","8a","9a","10a","11a",
                     "12p","1p","2p","3p","4p","5p","6p","7p","8p","9p","10p","11p"];

function RadialClock({ hourly }) {
  const max = Math.max(...hourly, 1);
  const cx = 90, cy = 90, r = 65, innerR = 28;
  const bars = hourly.map((val, i) => {
    const angle = (i / 24) * 2 * Math.PI - Math.PI / 2;
    const pct = val / max;
    const barLen = (r - innerR - 4) * pct;
    const startR = innerR + 2;
    const endR   = startR + barLen;
    const x1 = cx + startR * Math.cos(angle);
    const y1 = cy + startR * Math.sin(angle);
    const x2 = cx + endR   * Math.cos(angle);
    const y2 = cy + endR   * Math.sin(angle);
    const isActive = val > 0;
    const isPeak = val === max && val > 0;
    return { x1, y1, x2, y2, isActive, isPeak, val, hour: i };
  });
  // Hour label positions at outer ring
  const labelHours = [0, 6, 12, 18];

  return (
    <svg viewBox="0 0 180 180" className="w-full max-w-[180px] mx-auto">
      {/* Rings */}
      <circle cx={cx} cy={cy} r={r}       fill="none" stroke="currentColor" strokeOpacity="0.07" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={innerR}  fill="none" stroke="currentColor" strokeOpacity="0.07" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={(r + innerR) / 2} fill="none" stroke="currentColor" strokeOpacity="0.04" strokeWidth="0.5" strokeDasharray="2 4" />

      {/* Bars */}
      {bars.map((bar, i) => (
        <motion.line
          key={i}
          x1={bar.x1} y1={bar.y1} x2={bar.x1} y2={bar.y1}
          animate={{ x2: bar.x2, y2: bar.y2 }}
          transition={{ delay: 0.05 + i * 0.02, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          stroke={bar.isPeak ? "oklch(var(--p))" : bar.isActive ? "oklch(var(--p)/0.5)" : "oklch(var(--bc)/0.1)"}
          strokeWidth={bar.isPeak ? 3 : 2}
          strokeLinecap="round"
        />
      ))}

      {/* Hour labels */}
      {labelHours.map(h => {
        const angle = (h / 24) * 2 * Math.PI - Math.PI / 2;
        const labelR = r + 10;
        const lx = cx + labelR * Math.cos(angle);
        const ly = cy + labelR * Math.sin(angle);
        return (
          <text key={h} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
            fontSize="7" fill="currentColor" fillOpacity="0.3" fontFamily="var(--font-mono)">
            {HOUR_LABELS[h]}
          </text>
        );
      })}

      {/* Center text */}
      <text x={cx} y={cy - 7} textAnchor="middle" fontSize="9" fill="currentColor" fillOpacity="0.3" fontFamily="var(--font-mono)">PEAK</text>
      <text x={cx} y={cy + 6} textAnchor="middle" fontSize="11" fill="currentColor" fillOpacity="0.7" fontFamily="var(--font-mono)" fontWeight="bold">
        {HOUR_LABELS[bars.findIndex(b => b.isPeak) === -1 ? 0 : bars.findIndex(b => b.isPeak)]}
      </text>
    </svg>
  );
}

export default function ChatStatsModal({ onClose }) {
  const { selectedUser, getChatStats } = useChatStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getChatStats(selectedUser._id).then(d => { setStats(d); setLoading(false); });
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.3 }}
        className="bg-base-100 border-2 border-base-content/10 w-full max-w-lg p-5 max-h-[88vh] overflow-y-auto relative"
      >
        {["top-0 left-0 border-t-2 border-l-2","top-0 right-0 border-t-2 border-r-2",
          "bottom-0 left-0 border-b-2 border-l-2","bottom-0 right-0 border-b-2 border-r-2"].map((cls, i) => (
          <span key={i} className={`absolute w-3 h-3 border-primary ${cls}`} />
        ))}

        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] font-mono tracking-widest opacity-40">// CHAT ANALYTICS</p>
            <p className="text-xs font-mono opacity-30">with {selectedUser.fullName}</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-xs btn-square opacity-40 hover:opacity-80"><X size={14} /></button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-[10px] font-mono opacity-30">crunching numbers...</div>
        ) : stats ? (
          <motion.div initial="hidden" animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
            className="space-y-5"
          >
            {/* Summary cards */}
            <motion.div variants={{ hidden: { opacity:0, y:10 }, show: { opacity:1, y:0 } }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: "TOTAL", value: stats.totalMessages },
                { label: "YOU SENT", value: stats.myMessages },
                { label: "PHOTOS", value: stats.imagesCount },
                { label: "VOICE", value: stats.audioCount },
              ].map(c => (
                <div key={c.label} className="border border-base-content/10 p-3 text-center hover:border-primary/30 transition-colors">
                  <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>{c.value}</p>
                  <p className="text-[9px] font-mono opacity-40 mt-1">{c.label}</p>
                </div>
              ))}
            </motion.div>

            {/* Radial clock chart */}
            <motion.div variants={{ hidden: { opacity:0, y:10 }, show: { opacity:1, y:0 } }}>
              <p className="text-[10px] font-mono opacity-40 mb-3">// ACTIVITY CLOCK (24H)</p>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <RadialClock hourly={stats.hourly} />
                </div>
                <div className="text-right space-y-2">
                  {[...stats.hourly]
                    .map((v, i) => ({ v, i }))
                    .sort((a, b) => b.v - a.v)
                    .slice(0, 5)
                    .filter(x => x.v > 0)
                    .map(({ v, i }) => (
                      <div key={i} className="flex items-center gap-2 justify-end">
                        <span className="text-[9px] font-mono opacity-40">{v} msgs</span>
                        <div className="border border-primary/30 px-2 py-0.5 text-[9px] font-mono text-primary min-w-[36px] text-center">
                          {HOUR_LABELS[i]}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </motion.div>

            {/* Conversation split bar */}
            <motion.div variants={{ hidden: { opacity:0, y:10 }, show: { opacity:1, y:0 } }}>
              <p className="text-[10px] font-mono opacity-40 mb-2">// WHO TALKS MORE</p>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono opacity-50 w-12 text-right">You</span>
                <div className="flex-1 h-3 bg-base-300 overflow-hidden flex">
                  <motion.div className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.totalMessages > 0 ? (stats.myMessages / stats.totalMessages) * 100 : 50}%` }}
                    transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <span className="text-[9px] font-mono opacity-50 w-12">{selectedUser.fullName.split(" ")[0]}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[9px] font-mono text-primary">{stats.myMessages} msgs</span>
                <span className="text-[9px] font-mono opacity-40">{stats.theirMessages} msgs</span>
              </div>
            </motion.div>

            {/* Top words */}
            {stats.topWords?.length > 0 && (
              <motion.div variants={{ hidden: { opacity:0, y:10 }, show: { opacity:1, y:0 } }}>
                <p className="text-[10px] font-mono opacity-40 mb-3">// TOP WORDS</p>
                <div className="flex flex-wrap gap-2">
                  {stats.topWords.map(({ word, count }) => (
                    <span key={word} className="border border-primary/20 text-primary text-[10px] font-mono px-2 py-1">
                      {word} <span className="opacity-40">×{count}</span>
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {stats.firstMessage && (
              <p className="text-[9px] font-mono opacity-20 text-center">
                first message: {new Date(stats.firstMessage).toLocaleDateString()}
              </p>
            )}
          </motion.div>
        ) : <p className="text-center text-[10px] font-mono opacity-30 py-8">no data</p>}
      </motion.div>
    </motion.div>
  );
}
