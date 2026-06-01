import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, Mail, MessageSquare } from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";
import { motion } from "framer-motion";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { ease: [0.16, 1, 0.3, 1], duration: 0.5 } },
};

export default function LoginPage() {
  const [showPw, setShowPw] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    await login(data);
    setTimeout(() => navigate("/"), 1000);
  };
  const onError = (errs) => {
    const first = Object.values(errs)[0];
    if (first?.message) toast.error(first.message);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-base-100">
      {/* Left — form */}
      <div className="flex items-center justify-center p-8 relative">
        {/* Background grid */}
        <div className="absolute inset-0 grid-bg opacity-50 pointer-events-none" />

        <motion.div
          className="w-full max-w-sm relative z-10"
          variants={container} initial="hidden" animate="show"
        >
          {/* Logo */}
          <motion.div variants={item} className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 border-2 border-primary flex items-center justify-center">
              <MessageSquare size={18} className="text-primary" />
            </div>
            <span className="font-bold tracking-widest text-sm" style={{ fontFamily: "var(--font-mono)" }}>
              MURMUZE
            </span>
          </motion.div>

          <motion.div variants={item}>
            <h1 className="text-4xl font-bold mb-1 leading-tight" style={{ fontFamily: "var(--font-display)" }}>
              WELCOME<br />BACK
            </h1>
            <p className="text-xs font-mono opacity-40 mb-8">// log in to continue</p>
          </motion.div>

          <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-4">
            <motion.div variants={item}>
              <label className="text-[10px] font-mono tracking-widest opacity-50 block mb-1">EMAIL</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
                <input
                  type="email"
                  {...register("email", { required: "Email required", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email" } })}
                  className="input input-sm w-full pl-9 border-2 border-base-content/15 focus:border-primary bg-transparent"
                  placeholder="name@domain.com"
                  style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}
                />
              </div>
            </motion.div>

            <motion.div variants={item}>
              <label className="text-[10px] font-mono tracking-widest opacity-50 block mb-1">PASSWORD</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
                <input
                  type={showPw ? "text" : "password"}
                  {...register("password", { required: "Password required", minLength: { value: 6, message: "Min 6 chars" } })}
                  className="input input-sm w-full pl-9 pr-10 border-2 border-base-content/15 focus:border-primary bg-transparent"
                  placeholder="••••••••"
                  style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}
                />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30 hover:opacity-60">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </motion.div>

            <motion.div variants={item} className="pt-2">
              <button type="submit" disabled={isSubmitting}
                className="btn btn-primary btn-sm w-full gap-2">
                {isSubmitting ? <><Loader2 size={14} className="animate-spin" /> LOGGING IN...</> : "LOG IN →"}
              </button>
            </motion.div>
          </form>

          <motion.p variants={item} className="text-[11px] font-mono opacity-40 mt-6 text-center">
            no account?{" "}
            <Link to="/signup" className="text-primary opacity-100 underline underline-offset-2">sign up</Link>
          </motion.p>
        </motion.div>
      </div>

      {/* Right — branding panel */}
      <div className="hidden lg:flex flex-col items-center justify-center bg-primary/5 border-l-2 border-primary/10 p-12 relative overflow-hidden">
        {/* Animated grid lines */}
        <div className="absolute inset-0 grid-bg opacity-60" />
        {/* Decorative large letter */}
        <div className="absolute text-[20rem] font-black text-primary/5 select-none leading-none"
          style={{ fontFamily: "var(--font-display)" }}>M</div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 text-center"
        >
          <div className="w-16 h-16 border-2 border-primary mx-auto mb-6 flex items-center justify-center relative">
            <MessageSquare size={28} className="text-primary" />
            <span className="absolute -top-1 -left-1 w-2 h-2 bg-primary" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary" />
            <span className="absolute -bottom-1 -left-1 w-2 h-2 bg-primary" />
            <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-primary" />
          </div>
          <h2 className="text-3xl font-black mb-3 tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            CHAT. CALL.<br />CONNECT.
          </h2>
          <p className="text-sm font-mono opacity-40 max-w-xs mx-auto leading-relaxed">
            // video calls · voice messages · polls<br />
            // xp system · achievements · stats
          </p>
        </motion.div>

        {/* Feature blips */}
        <motion.div
          className="absolute bottom-8 left-8 right-8 flex flex-wrap gap-2 justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {["VIDEO CALLS","XP SYSTEM","REACTIONS","POLLS","GHOST MODE","TIME CAPSULE"].map(f => (
            <span key={f} className="border border-primary/20 text-[9px] font-mono px-2 py-1 text-primary/60">{f}</span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
