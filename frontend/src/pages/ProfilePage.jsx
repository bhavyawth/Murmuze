import { useState, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Edit2, Check, X, Zap, Flame, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ACHIEVEMENTS_META } from "../components/AchievementModal";
import AchievementModal from "../components/AchievementModal";
import ActivityHeatmap, { getLeague, LEAGUES } from "../components/ActivityHeatmap";

const XP_PER_LEVEL = 100;

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { ease: [0.16, 1, 0.3, 1], duration: 0.45 } } };

export default function ProfilePage() {
  const { authUser, updateProfile } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editName, setEditName] = useState(false);
  const [editBio, setEditBio] = useState(false);
  const [newName, setNewName] = useState(authUser?.fullName || "");
  const [newBio, setNewBio] = useState(authUser?.bio || "");
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const fileRef = useRef(null);

  const xpInLevel = (authUser?.xp || 0) % XP_PER_LEVEL;
  const xpPct = (xpInLevel / XP_PER_LEVEL) * 100;
  const league = getLeague(authUser?.level || 1);

  const handleImage = async (e) => {
    const file = e.target.files[0];
    if (!file?.type.startsWith("image/")) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      setSelectedImg(reader.result);
      await updateProfile({ profilePic: reader.result });
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen pt-14 bg-base-100 grid-bg">
      <div className="max-w-2xl mx-auto p-6">
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">

          {/* Header card */}
          <motion.div variants={fadeUp} className="border-2 border-base-content/10 bg-base-100 relative">
            {["top-0 left-0 border-t-2 border-l-2","top-0 right-0 border-t-2 border-r-2",
              "bottom-0 left-0 border-b-2 border-l-2","bottom-0 right-0 border-b-2 border-r-2"].map((cls, i) => (
              <span key={i} className={`absolute w-3 h-3 border-primary ${cls}`} />
            ))}

            <div className="p-6 flex items-start gap-5">
              <div className="relative shrink-0">
                <img src={selectedImg || authUser?.profilePic || "/avatar.png"} alt=""
                  className={`w-20 h-20 object-cover border-2 border-base-content/10 ${uploading ? "opacity-50" : ""}`} />
                <button onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary flex items-center justify-center hover:bg-primary/80 transition-colors">
                  <Camera size={13} className="text-primary-content" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
              </div>

              <div className="flex-1 min-w-0">
                {editName ? (
                  <div className="flex gap-2 mb-1">
                    <input autoFocus className="input input-sm flex-1 border-2 border-primary text-sm font-bold"
                      value={newName} maxLength={50} onChange={e => setNewName(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { updateProfile({ fullName: newName.trim() }); setEditName(false); } if (e.key === "Escape") setEditName(false); }}
                      style={{ fontFamily: "var(--font-display)" }} />
                    <button onClick={() => { updateProfile({ fullName: newName.trim() }); setEditName(false); }} className="btn btn-success btn-xs btn-square"><Check size={12} /></button>
                    <button onClick={() => setEditName(false)} className="btn btn-ghost btn-xs btn-square"><X size={12} /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-bold tracking-wide truncate" style={{ fontFamily: "var(--font-display)" }}>{authUser?.fullName}</h2>
                    <button onClick={() => { setNewName(authUser?.fullName || ""); setEditName(true); }} className="btn btn-ghost btn-xs btn-square opacity-30 hover:opacity-80"><Edit2 size={11} /></button>
                  </div>
                )}

                <p className="text-[10px] font-mono opacity-30 mb-2">{authUser?.email}</p>

                {/* League badge */}
                <div className={`inline-flex items-center gap-1.5 border px-2 py-1 mb-3 ${league.border} ${league.bg}`}>
                  <span>{league.emoji}</span>
                  <span className="text-[10px] font-mono font-bold tracking-widest" style={{ color: league.color }}>{league.name}</span>
                  <span className="text-[9px] font-mono opacity-40">LEAGUE</span>
                </div>

                {editBio ? (
                  <div>
                    <textarea autoFocus className="textarea textarea-bordered w-full text-xs resize-none h-16 border-2 border-primary/50"
                      maxLength={150} value={newBio} onChange={e => setNewBio(e.target.value)}
                      style={{ fontFamily: "var(--font-mono)" }} />
                    <div className="flex gap-2 mt-1">
                      <button onClick={() => { updateProfile({ bio: newBio }); setEditBio(false); }} className="btn btn-primary btn-xs">SAVE</button>
                      <button onClick={() => setEditBio(false)} className="btn btn-ghost btn-xs">CANCEL</button>
                      <span className="text-[9px] font-mono opacity-30 self-center ml-auto">{newBio.length}/150</span>
                    </div>
                  </div>
                ) : (
                  <div onClick={() => { setNewBio(authUser?.bio || ""); setEditBio(true); }}
                    className="text-xs font-mono opacity-50 cursor-pointer hover:opacity-80 italic border-b border-dashed border-base-content/10 pb-1">
                    {authUser?.bio || "// click to add bio"}
                  </div>
                )}
              </div>
            </div>

            {/* XP bar */}
            <div className="border-t border-base-content/10 px-6 py-3">
              <div className="flex justify-between text-[10px] font-mono mb-1.5">
                <span className="text-primary font-bold">LV.{authUser?.level || 1}</span>
                <span className="opacity-40">{xpInLevel}/{XP_PER_LEVEL} to next level</span>
              </div>
              <div className="w-full h-1.5 bg-base-300 relative overflow-hidden">
                <motion.div className="h-1.5 bg-primary absolute left-0 top-0"
                  initial={{ width: 0 }} animate={{ width: `${xpPct}%` }}
                  transition={{ delay: 0.3, duration: 1, ease: [0.16, 1, 0.3, 1] }} />
              </div>
              <p className="text-[9px] font-mono opacity-30 mt-1">{authUser?.xp || 0} XP total</p>
            </div>
          </motion.div>

          {/* Stats row */}
          <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
            {[
              { icon: <Flame size={14} className="text-orange-400" />, label: "STREAK",   value: `${authUser?.streak || 0}d` },
              { icon: <Zap size={14} className="text-yellow-400" />,   label: "MESSAGES", value: authUser?.totalMessages || 0 },
              { icon: <Trophy size={14} className="text-amber-400" />, label: "BADGES",   value: (authUser?.achievements || []).length + "/" + Object.keys(ACHIEVEMENTS_META).length },
            ].map(s => (
              <div key={s.label} className="border-2 border-base-content/10 p-4 text-center hover:border-primary/30 transition-colors">
                <div className="flex justify-center mb-2">{s.icon}</div>
                <p className="font-bold text-lg" style={{ fontFamily: "var(--font-display)" }}>{s.value}</p>
                <p className="text-[9px] font-mono opacity-40 mt-0.5">{s.label}</p>
              </div>
            ))}
          </motion.div>

          {/* League progression */}
          <motion.div variants={fadeUp} className="border-2 border-base-content/10 p-5">
            <p className="text-[10px] font-mono tracking-widest opacity-40 mb-4">// LEAGUE PROGRESSION</p>
            <div className="flex items-center gap-0">
              {LEAGUES.map((l, i) => {
                const isCurrent = l.name === league.name;
                const isPast = (authUser?.level || 1) > l.maxLevel;
                return (
                  <div key={l.name} className="flex-1 flex flex-col items-center gap-1">
                    <motion.div
                      whileHover={{ scale: 1.2 }}
                      title={`${l.name} (Lv.${l.minLevel}+)`}
                      className={`text-lg cursor-default transition-all ${!isPast && !isCurrent ? "opacity-20 grayscale" : ""}`}
                    >
                      {l.emoji}
                    </motion.div>
                    {isCurrent && (
                      <motion.div layoutId="league-indicator" className="w-1 h-1 bg-primary rounded-full" />
                    )}
                    <span className="text-[7px] font-mono hidden sm:block" style={{ color: isCurrent ? l.color : undefined, opacity: isCurrent ? 1 : 0.2 }}>
                      {l.name.slice(0, 4)}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-[9px] font-mono opacity-30 mt-3 text-center">
              {league.maxLevel === Infinity
                ? "You've reached the highest league! 👑"
                : `Next league at level ${league.maxLevel + 1}`}
            </p>
          </motion.div>

          {/* Activity heatmap */}
          <motion.div variants={fadeUp} className="border-2 border-base-content/10 p-5">
            <p className="text-[10px] font-mono tracking-widest opacity-40 mb-4">// ACTIVITY — LAST 365 DAYS</p>
            <ActivityHeatmap />
          </motion.div>

          {/* Achievements — clickable */}
          <motion.div variants={fadeUp} className="border-2 border-base-content/10 p-5">
            <p className="text-[10px] font-mono tracking-widest opacity-40 mb-4">
              // ACHIEVEMENTS — <span className="text-primary">click to inspect</span>
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {Object.entries(ACHIEVEMENTS_META).map(([key, meta]) => {
                const unlocked = (authUser?.achievements || []).includes(key);
                return (
                  <motion.button
                    key={key}
                    onClick={() => setSelectedAchievement(key)}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex flex-col items-center gap-1 p-3 border transition-colors cursor-pointer
                      ${unlocked ? "border-primary/40 bg-primary/5 hover:border-primary" : "border-base-content/5 opacity-25 hover:opacity-40"}`}
                  >
                    <span className="text-2xl">{meta.e}</span>
                    <span className="text-[9px] font-mono text-center leading-tight opacity-60">{meta.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="text-[9px] font-mono opacity-20 text-center">
            member since {authUser?.createdAt?.split("T")[0]}
          </motion.div>
        </motion.div>
      </div>

      {/* Achievement detail modal */}
      <AnimatePresence>
        {selectedAchievement && (
          <AchievementModal
            achievement={selectedAchievement}
            unlocked={(authUser?.achievements || []).includes(selectedAchievement)}
            onClose={() => setSelectedAchievement(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
