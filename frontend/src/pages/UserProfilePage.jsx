import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { axiosInstance } from "../lib/axios";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useCallStore } from "../store/useCallStore";
import { useFriendStore } from "../store/useFriendStore";
import { MessageCircle, Phone, Video, Zap, Flame, Trophy, ArrowLeft, UserPlus, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ACHIEVEMENTS_META } from "../components/AchievementModal";
import AchievementModal from "../components/AchievementModal";
import ActivityHeatmap, { getLeague } from "../components/ActivityHeatmap";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { ease: [0.16, 1, 0.3, 1], duration: 0.45 } } };

export default function UserProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { users, setSelectedUser } = useChatStore();
  const { onlineUsers, authUser } = useAuthStore();
  const { initiateCall } = useCallStore();
  const { friends, sentRequests, pendingRequests, sendRequest, acceptRequest, loadFriendsData } = useFriendStore();
  const [user, setUser] = useState(null);
  const [selectedAchievement, setSelectedAchievement] = useState(null);

  useEffect(() => {
    loadFriendsData();
    const found = users.find(u => u._id === id);
    if (found) { setUser(found); return; }
    axiosInstance.get("/messages/users").then(r => {
      const u = r.data.find(x => x._id === id);
      if (u) { setUser(u); return; }
      // Also search all users
      axiosInstance.get(`/auth/search?q=a`).then(() => {}).catch(() => {});
    }).catch(() => {
      // fallback: search
      axiosInstance.get(`/auth/search?q=${id}`).then(r => {
        if (r.data[0]) setUser(r.data[0]);
      }).catch(() => {});
    });
  }, [id]);

  if (!user) return (
    <div className="min-h-screen pt-14 flex items-center justify-center">
      <p className="text-[10px] font-mono opacity-30">loading profile...</p>
    </div>
  );

  const isOnline    = onlineUsers?.includes(user._id);
  const isFriend    = friends.some(f => (f._id || f) === user._id);
  const requestSent = sentRequests.some(s => (s._id || s) === user._id);
  const requestIn   = pendingRequests.some(p => (p._id || p) === user._id);
  const isMe        = user._id === authUser?._id;
  const league      = getLeague(user.level || 1);

  return (
    <div className="min-h-screen pt-14 bg-base-100 grid-bg">
      <div className="max-w-lg mx-auto p-6">
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">

          <motion.div variants={fadeUp}>
            <button onClick={() => navigate(-1)} className="btn btn-ghost btn-xs gap-1 opacity-40 hover:opacity-80 -ml-2">
              <ArrowLeft size={13} /> BACK
            </button>
          </motion.div>

          {/* Profile card */}
          <motion.div variants={fadeUp} className="border-2 border-base-content/10 bg-base-100 relative">
            {["top-0 left-0 border-t-2 border-l-2","top-0 right-0 border-t-2 border-r-2",
              "bottom-0 left-0 border-b-2 border-l-2","bottom-0 right-0 border-b-2 border-r-2"].map((cls, i) => (
              <span key={i} className={`absolute w-3 h-3 border-primary ${cls}`} />
            ))}

            <div className="p-6 flex items-start gap-5">
              <div className="relative shrink-0">
                <img src={user.profilePic || "/avatar.png"} alt={user.fullName}
                  className="w-20 h-20 object-cover border-2 border-base-content/10" />
                <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-base-100 ${isOnline ? "bg-success" : "bg-base-content/20"}`} />
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold tracking-wide truncate" style={{ fontFamily: "var(--font-display)" }}>
                  {user.fullName.toUpperCase()}
                </h2>
                <p className={`text-[10px] font-mono mt-0.5 mb-2 ${isOnline ? "text-success" : "opacity-30"}`}>
                  {isOnline ? "● online now" : "○ offline"}
                </p>

                {/* League badge */}
                <div className="inline-flex items-center gap-1 border px-2 py-0.5 mb-2"
                  style={{ borderColor: league.color + "40", backgroundColor: league.color + "10" }}>
                  <span className="text-sm">{league.emoji}</span>
                  <span className="text-[9px] font-mono font-bold" style={{ color: league.color }}>{league.name}</span>
                </div>

                {user.bio && (
                  <p className="text-xs font-mono opacity-50 italic border-l-2 border-primary/30 pl-2 mt-1">
                    {user.bio}
                  </p>
                )}
              </div>
            </div>

            {/* Action buttons */}
            {!isMe && (
              <div className="border-t border-base-content/10 p-4 flex gap-2">
                {isFriend ? (
                  <button onClick={() => { setSelectedUser(user); navigate("/"); }}
                    className="btn btn-primary btn-sm flex-1 gap-2">
                    <MessageCircle size={14} /> MESSAGE
                  </button>
                ) : requestSent ? (
                  <button disabled className="btn btn-outline btn-sm flex-1 opacity-40 gap-2">
                    <Check size={14} /> REQUEST SENT
                  </button>
                ) : requestIn ? (
                  <button onClick={() => acceptRequest(user._id)}
                    className="btn btn-success btn-sm flex-1 gap-2">
                    <Check size={14} /> ACCEPT REQUEST
                  </button>
                ) : (
                  <button onClick={() => sendRequest(user._id)}
                    className="btn btn-primary btn-sm flex-1 gap-2">
                    <UserPlus size={14} /> ADD FRIEND
                  </button>
                )}
                {isFriend && (
                  <>
                    <button onClick={() => initiateCall(user, "audio")} className="btn btn-outline btn-sm btn-square" title="Voice call">
                      <Phone size={14} />
                    </button>
                    <button onClick={() => initiateCall(user, "video")} className="btn btn-outline btn-sm btn-square" title="Video call">
                      <Video size={14} />
                    </button>
                  </>
                )}
              </div>
            )}
          </motion.div>

          {/* Stats */}
          <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
            {[
              { icon: <Zap size={14} className="text-yellow-400" />,   label: "LEVEL",   value: user.level || 1 },
              { icon: <Flame size={14} className="text-orange-400" />, label: "STREAK",  value: `${user.streak || 0}d` },
              { icon: <Trophy size={14} className="text-amber-400" />, label: "XP",      value: user.xp || 0 },
            ].map(s => (
              <div key={s.label} className="border-2 border-base-content/10 p-4 text-center hover:border-primary/30 transition-colors">
                <div className="flex justify-center mb-2">{s.icon}</div>
                <p className="font-bold text-lg" style={{ fontFamily: "var(--font-display)" }}>{s.value}</p>
                <p className="text-[9px] font-mono opacity-40 mt-0.5">{s.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Activity heatmap */}
          <motion.div variants={fadeUp} className="border-2 border-base-content/10 p-5">
            <p className="text-[10px] font-mono tracking-widest opacity-40 mb-4">// ACTIVITY — LAST 365 DAYS</p>
            <ActivityHeatmap userId={user._id} />
          </motion.div>

          {/* Achievements — clickable */}
          {(user.achievements || []).length > 0 && (
            <motion.div variants={fadeUp} className="border-2 border-base-content/10 p-5">
              <p className="text-[10px] font-mono tracking-widest opacity-40 mb-3">
                // ACHIEVEMENTS — <span className="text-primary">click to inspect</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {(user.achievements || []).map(key => {
                  const meta = ACHIEVEMENTS_META[key];
                  if (!meta) return null;
                  return (
                    <motion.button key={key} onClick={() => setSelectedAchievement(key)}
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                      className="border border-primary/30 bg-primary/5 hover:border-primary px-2 py-1 flex items-center gap-1 transition-colors">
                      <span className="text-base">{meta.e}</span>
                      <span className="text-[9px] font-mono opacity-60">{meta.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          <motion.div variants={fadeUp} className="text-[9px] font-mono opacity-20 text-center">
            member since {user.createdAt?.split("T")[0]}
          </motion.div>

        </motion.div>
      </div>

      <AnimatePresence>
        {selectedAchievement && (
          <AchievementModal
            achievement={selectedAchievement}
            unlocked={(user.achievements || []).includes(selectedAchievement)}
            onClose={() => setSelectedAchievement(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
