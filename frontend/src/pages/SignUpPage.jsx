import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, Mail, User, MessageSquare } from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";
import { motion } from "framer-motion";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { ease: [0.16, 1, 0.3, 1], duration: 0.45 } } };

export default function SignUpPage() {
  const [showPw, setShowPw] = useState(false);
  const navigate = useNavigate();
  const { signup } = useAuthStore();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => { await signup(data); setTimeout(() => navigate("/"), 1000); };
  const onError = (errs) => { const f = Object.values(errs)[0]; if (f?.message) toast.error(f.message); };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-base-100">
      {/* Right branding (on desktop, left panel is form) */}
      <div className="hidden lg:flex flex-col items-center justify-center bg-base-200 border-r-2 border-base-content/10 p-12 relative overflow-hidden order-last">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="absolute text-[18rem] font-black text-primary/5 select-none" style={{ fontFamily: "var(--font-display)" }}>✦</div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 text-center"
        >
          <p className="text-[10px] font-mono tracking-widest opacity-40 mb-4">// JOIN THE NETWORK</p>
          <h2 className="text-4xl font-black mb-4" style={{ fontFamily: "var(--font-display)" }}>
            LEVEL UP<br />YOUR CHATS
          </h2>
          <p className="text-xs font-mono opacity-40 max-w-xs mx-auto leading-loose">
            earn XP · unlock achievements<br />
            call friends · send voice msgs<br />
            polls · time capsules · reactions
          </p>
          {/* XP preview */}
          <div className="mt-8 border border-primary/20 p-4 text-left">
            <p className="text-[9px] font-mono opacity-40 mb-2">// YOUR PROGRESS AFTER 100 MESSAGES</p>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-primary font-bold">LV.2</span>
              <div className="flex-1 h-1.5 bg-base-300">
                <motion.div className="h-1.5 bg-primary" initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ delay: 0.8, duration: 1.2, ease: [0.16, 1, 0.3, 1] }} />
              </div>
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              {["💬 first_message","🔥 streak_7","📸 image_sender"].map(a => (
                <span key={a} className="text-[9px] font-mono border border-primary/20 px-2 py-0.5 text-primary/70">{a}</span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-8 relative">
        <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
        <motion.div className="w-full max-w-sm relative z-10" variants={container} initial="hidden" animate="show">
          <motion.div variants={item} className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 border-2 border-primary flex items-center justify-center">
              <MessageSquare size={18} className="text-primary" />
            </div>
            <span className="font-bold tracking-widest text-sm" style={{ fontFamily: "var(--font-mono)" }}>MURMUZE</span>
          </motion.div>

          <motion.div variants={item}>
            <h1 className="text-4xl font-bold mb-1" style={{ fontFamily: "var(--font-display)" }}>
              CREATE<br />ACCOUNT
            </h1>
            <p className="text-xs font-mono opacity-40 mb-8">// join for free, no phone needed</p>
          </motion.div>

          <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-4">
            {[
              { label: "FULL NAME", name: "fullName", type: "text", icon: <User size={14} />, placeholder: "Your name", rules: { required: "Name required" } },
              { label: "EMAIL", name: "email", type: "email", icon: <Mail size={14} />, placeholder: "name@domain.com", rules: { required: "Email required", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email" } } },
            ].map(field => (
              <motion.div key={field.name} variants={item}>
                <label className="text-[10px] font-mono tracking-widest opacity-50 block mb-1">{field.label}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30">{field.icon}</span>
                  <input type={field.type} {...register(field.name, field.rules)}
                    className="input input-sm w-full pl-9 border-2 border-base-content/15 focus:border-primary bg-transparent"
                    placeholder={field.placeholder}
                    style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }} />
                </div>
              </motion.div>
            ))}

            <motion.div variants={item}>
              <label className="text-[10px] font-mono tracking-widest opacity-50 block mb-1">PASSWORD</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
                <input type={showPw ? "text" : "password"}
                  {...register("password", { required: "Password required", minLength: { value: 6, message: "Min 6 chars" } })}
                  className="input input-sm w-full pl-9 pr-10 border-2 border-base-content/15 focus:border-primary bg-transparent"
                  placeholder="••••••••"
                  style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }} />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30 hover:opacity-60">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </motion.div>

            <motion.div variants={item} className="pt-2">
              <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-sm w-full gap-2">
                {isSubmitting ? <><Loader2 size={14} className="animate-spin" /> CREATING...</> : "CREATE ACCOUNT →"}
              </button>
            </motion.div>
          </form>

          <motion.p variants={item} className="text-[11px] font-mono opacity-40 mt-6 text-center">
            already have one?{" "}
            <Link to="/login" className="text-primary opacity-100 underline underline-offset-2">log in</Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
