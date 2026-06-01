import { useState } from "react";
import { THEMES } from "../constants/index.js";
import { useThemeStore } from "../store/useThemeStore";
import { useChatStore } from "../store/useChatStore";
import { motion } from "framer-motion";

const WALLPAPERS = [
  { label: "None",   value: "" },
  { label: "Ocean",  value: "linear-gradient(135deg,#e0f7fa,#b2ebf2)" },
  { label: "Sunset", value: "linear-gradient(135deg,#ffe0b2,#ffccbc)" },
  { label: "Forest", value: "linear-gradient(135deg,#c8e6c9,#a5d6a7)" },
  { label: "Galaxy", value: "linear-gradient(135deg,#e8eaf6,#c5cae9)" },
  { label: "Rose",   value: "linear-gradient(135deg,#fce4ec,#f8bbd9)" },
  { label: "Mint",   value: "linear-gradient(135deg,#e0f2f1,#b2dfdb)" },
  { label: "Sand",   value: "linear-gradient(135deg,#fff8e1,#ffecb3)" },
];

const Section = ({ label, children }) => (
  <div className="border-2 border-base-content/10 p-5 hover:border-base-content/20 transition-colors">
    <p className="text-[10px] font-mono tracking-widest opacity-40 mb-4">// {label}</p>
    {children}
  </div>
);

export default function SettingsPage() {
  const { theme, setTheme } = useThemeStore();
  const { selectedUser, setChatWallpaper, chatWallpapers } = useChatStore();
  const [settings, setSettings] = useState(() => JSON.parse(localStorage.getItem("murmuze_settings") || '{"soundEnabled":true}'));

  const updateSetting = (key, val) => {
    const u = { ...settings, [key]: val };
    setSettings(u);
    localStorage.setItem("murmuze_settings", JSON.stringify(u));
  };

  return (
    <div className="min-h-screen pt-14 grid-bg">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: [0.16, 1, 0.3, 1] }}>
          <p className="text-[10px] font-mono tracking-widest opacity-40 mb-1">// PREFERENCES</p>
          <h1 className="text-3xl font-black mb-8" style={{ fontFamily: "var(--font-display)" }}>SETTINGS</h1>

          <div className="space-y-4">
            {/* Theme picker */}
            <Section label="THEME — CHOOSE FROM 32 OPTIONS">
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {THEMES.map(t => (
                  <button key={t} onClick={() => setTheme(t)}
                    className={`flex flex-col items-center gap-1.5 p-2 border-2 transition-all hover:border-primary/60
                      ${theme === t ? "border-primary bg-primary/5" : "border-base-content/10"}`}>
                    <div className="h-6 w-full relative overflow-hidden" data-theme={t}>
                      <div className="absolute inset-0 grid grid-cols-4 gap-px">
                        <div className="bg-primary" />
                        <div className="bg-secondary" />
                        <div className="bg-accent" />
                        <div className="bg-neutral" />
                      </div>
                    </div>
                    <span className="text-[9px] font-mono truncate w-full text-center opacity-60">
                      {t.toUpperCase()}
                    </span>
                  </button>
                ))}
              </div>
            </Section>

            {/* Notifications */}
            <Section label="NOTIFICATIONS">
              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>Sound Alerts</p>
                    <p className="text-[10px] font-mono opacity-40">ping on new messages</p>
                  </div>
                  <input type="checkbox" className="toggle toggle-primary toggle-sm"
                    checked={settings.soundEnabled !== false}
                    onChange={e => updateSetting("soundEnabled", e.target.checked)} />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>Browser Notifications</p>
                    <p className="text-[10px] font-mono opacity-40">background tab alerts</p>
                  </div>
                  <button onClick={() => Notification.requestPermission().then(p => p === "granted" && updateSetting("notifEnabled", true))}
                    className={`btn btn-xs ${settings.notifEnabled ? "btn-success" : "btn-outline"}`}>
                    {settings.notifEnabled ? "ENABLED" : "ENABLE"}
                  </button>
                </label>
              </div>
            </Section>

            {/* Wallpapers */}
            {selectedUser && (
              <Section label={`CHAT WALLPAPER — ${selectedUser.fullName.toUpperCase()}`}>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {WALLPAPERS.map(w => (
                    <button key={w.label} onClick={() => setChatWallpaper(selectedUser._id, w.value)}
                      title={w.label}
                      className={`h-10 border-2 transition-all text-[9px] font-mono
                        ${chatWallpapers[selectedUser._id] === w.value ? "border-primary scale-105" : "border-base-content/10 hover:border-primary/40"}`}
                      style={w.value ? { background: w.value } : {}}>
                      {!w.value && <span className="opacity-30">NONE</span>}
                    </button>
                  ))}
                </div>
              </Section>
            )}

            {/* Preview */}
            <Section label="THEME PREVIEW">
              <div className="border border-base-content/10 overflow-hidden max-w-sm">
                <div className="px-4 py-2 border-b border-base-content/10 flex items-center gap-2">
                  <div className="w-6 h-6 border border-primary/40 bg-primary/10" />
                  <div>
                    <p className="text-xs font-bold" style={{ fontFamily: "var(--font-display)" }}>JAMIE</p>
                    <p className="text-[9px] font-mono text-success">● online</p>
                  </div>
                </div>
                <div className="p-4 space-y-2 bg-base-100">
                  {[
                    { text: "hey! how's it going?", mine: false },
                    { text: "great, using Murmuze 🚀", mine: true },
                    { text: "this UI is so clean!", mine: false },
                  ].map((m, i) => (
                    <div key={i} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
                      <div className={`px-3 py-1.5 text-xs border-2 max-w-[75%]
                        ${m.mine ? "bg-primary text-primary-content border-primary" : "bg-base-200 border-base-content/10"}`}
                        style={{ borderRadius: "2px" }}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
