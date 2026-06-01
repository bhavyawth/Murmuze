import { useEffect, useState } from "react";
import { axiosInstance } from "../lib/axios";
import { motion } from "framer-motion";

// Leagues by level
export const LEAGUES = [
  { name: "BRONZE",    minLevel: 1,  maxLevel: 4,  color: "#cd7f32", emoji: "🥉", bg: "bg-amber-900/20", border: "border-amber-700/40" },
  { name: "SILVER",    minLevel: 5,  maxLevel: 9,  color: "#c0c0c0", emoji: "🥈", bg: "bg-gray-400/10",  border: "border-gray-400/30" },
  { name: "GOLD",      minLevel: 10, maxLevel: 19, color: "#ffd700", emoji: "🏆", bg: "bg-yellow-400/10",border: "border-yellow-400/40" },
  { name: "PLATINUM",  minLevel: 20, maxLevel: 29, color: "#00d4ff", emoji: "💎", bg: "bg-cyan-400/10",  border: "border-cyan-400/30" },
  { name: "DIAMOND",   minLevel: 30, maxLevel: 49, color: "#b9f2ff", emoji: "💠", bg: "bg-blue-300/10",  border: "border-blue-300/30" },
  { name: "MASTER",    minLevel: 50, maxLevel: 74, color: "#ff6b6b", emoji: "🔮", bg: "bg-red-400/10",   border: "border-red-400/30" },
  { name: "GRANDMASTER",minLevel:75, maxLevel:99,  color: "#ff0080", emoji: "⚡", bg: "bg-pink-500/10",  border: "border-pink-500/30" },
  { name: "LEGENDARY", minLevel: 100,maxLevel: Infinity, color: "#ffd700", emoji: "👑", bg: "bg-yellow-300/10", border: "border-yellow-300/50" },
];

export function getLeague(level) {
  return LEAGUES.find(l => level >= l.minLevel && level <= l.maxLevel) || LEAGUES[0];
}

function getColor(count, max) {
  if (count === 0) return "bg-base-300/50";
  const intensity = Math.min(count / Math.max(max * 0.6, 1), 1);
  if (intensity < 0.25) return "bg-primary/20";
  if (intensity < 0.5)  return "bg-primary/45";
  if (intensity < 0.75) return "bg-primary/70";
  return "bg-primary";
}

function getLast365Days() {
  const days = [];
  const today = new Date();
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS   = ["","M","","W","","F",""];

export default function ActivityHeatmap({ userId }) {
  const [activityLog, setActivityLog] = useState({});
  const [loading, setLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState(null);

  useEffect(() => {
    const url = userId ? `/auth/activity/${userId}` : "/auth/activity";
    axiosInstance.get(url)
      .then(r => setActivityLog(r.data.activityLog || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const days = getLast365Days();
  const maxCount = Math.max(...Object.values(activityLog).map(Number), 1);
  const totalMsgs = Object.values(activityLog).reduce((s, v) => s + Number(v), 0);
  const activeDays = Object.values(activityLog).filter(v => Number(v) > 0).length;

  // Group into weeks (columns of 7)
  const weeks = [];
  // Pad start so first day aligns to correct day-of-week
  const firstDay = new Date(days[0]);
  const startPad = firstDay.getDay(); // 0=Sun
  const paddedDays = Array(startPad).fill(null).concat(days);
  for (let i = 0; i < paddedDays.length; i += 7) {
    weeks.push(paddedDays.slice(i, i + 7));
  }

  // Month labels
  const monthLabels = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const firstValid = week.find(d => d);
    if (firstValid) {
      const m = new Date(firstValid).getMonth();
      if (m !== lastMonth) { monthLabels.push({ wi, label: MONTHS[m] }); lastMonth = m; }
    }
  });

  if (loading) return <div className="h-24 flex items-center justify-center"><p className="text-[10px] font-mono opacity-30">loading activity...</p></div>;

  return (
    <div>
      {/* Stats row */}
      <div className="flex gap-4 mb-3 flex-wrap">
        {[
          { label: "TOTAL MESSAGES", value: totalMsgs },
          { label: "ACTIVE DAYS", value: activeDays },
          { label: "THIS YEAR", value: `${Math.round((activeDays / 365) * 100)}%` },
        ].map(s => (
          <div key={s.label} className="border border-base-content/10 px-3 py-1.5">
            <p className="text-base font-bold" style={{ fontFamily: "var(--font-display)" }}>{s.value}</p>
            <p className="text-[8px] font-mono opacity-30 tracking-widest">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Heatmap grid */}
      <div className="overflow-x-auto pb-1">
        <div className="inline-flex gap-0.5 relative">
          {/* Day labels on the left */}
          <div className="flex flex-col gap-0.5 mr-1 justify-between pt-5">
            {DAYS.map((d, i) => (
              <div key={i} className="h-2.5 text-[7px] font-mono opacity-20 w-3 text-right">{d}</div>
            ))}
          </div>

          <div>
            {/* Month labels */}
            <div className="flex gap-0.5 mb-0.5 h-4 relative">
              {weeks.map((_, wi) => {
                const ml = monthLabels.find(m => m.wi === wi);
                return (
                  <div key={wi} className="w-2.5 shrink-0 relative">
                    {ml && <span className="absolute text-[7px] font-mono opacity-30 whitespace-nowrap">{ml.label}</span>}
                  </div>
                );
              })}
            </div>

            {/* Grid */}
            <div className="flex gap-0.5">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-0.5">
                  {week.map((day, di) => {
                    if (!day) return <div key={di} className="w-2.5 h-2.5" />;
                    const count = Number(activityLog[day] || 0);
                    return (
                      <motion.div
                        key={di}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: wi * 0.003, duration: 0.2 }}
                        onMouseEnter={() => setHoveredDay({ day, count })}
                        onMouseLeave={() => setHoveredDay(null)}
                        className={`w-2.5 h-2.5 cursor-default transition-all hover:ring-1 hover:ring-primary/50 ${getColor(count, maxCount)}`}
                        title={`${day}: ${count} message${count !== 1 ? "s" : ""}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredDay && (
        <div className="mt-1 text-[9px] font-mono opacity-50">
          {hoveredDay.day} — {hoveredDay.count} message{hoveredDay.count !== 1 ? "s" : ""}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-1 mt-2">
        <span className="text-[8px] font-mono opacity-30">less</span>
        {["bg-base-300/50","bg-primary/20","bg-primary/45","bg-primary/70","bg-primary"].map((c, i) => (
          <div key={i} className={`w-2.5 h-2.5 ${c}`} />
        ))}
        <span className="text-[8px] font-mono opacity-30">more</span>
      </div>
    </div>
  );
}
