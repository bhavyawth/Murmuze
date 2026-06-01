import { useRef, useState, useCallback } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { Image, Send, X, Mic, StopCircle, Smile, BarChart2, Clock, Ghost, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const EMOJIS = ["😀","😂","😍","🥺","😎","🤔","😭","🔥","❤️","👍","🎉","🙏","😊","🥳","😤","🤣","😴","🤯","💯","🎵","🌟","⚡","🎮","🍕","👀","💀","🤩","😅","🙄","🥰","😇","🤦"];

let typingTimeout = null;

export default function MessageInput() {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showExtras, setShowExtras] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [showPoll, setShowPoll] = useState(false);
  const [showCapsule, setShowCapsule] = useState(false);
  const [ghostMode, setGhostMode] = useState(false);
  const [pollData, setPollData] = useState({ question: "", options: ["", ""] });
  const [capsuleDate, setCapsuleDate] = useState("");

  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const { sendMessage, selectedUser } = useChatStore();
  const { socket } = useAuthStore();

  const emitTyping = useCallback(() => {
    if (!socket || !selectedUser) return;
    socket.emit("typing", { to: selectedUser._id });
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => socket.emit("stopTyping", { to: selectedUser._id }), 2000);
  }, [socket, selectedUser]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => {
        setAudioBlob(new Blob(chunksRef.current, { type: "audio/webm" }));
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecording(true);
    } catch { toast.error("Microphone access denied"); }
  };

  const stopRecording = () => { mediaRecorderRef.current?.stop(); setIsRecording(false); };

  const sendAudio = async () => {
    if (!audioBlob) return;
    const reader = new FileReader();
    reader.onloadend = async () => { await sendMessage({ audio: reader.result }); setAudioBlob(null); };
    reader.readAsDataURL(audioBlob);
  };

  const handleSendPoll = async () => {
    if (!pollData.question.trim()) return toast.error("Add a question");
    const opts = pollData.options.filter(o => o.trim());
    if (opts.length < 2) return toast.error("Need 2+ options");
    await sendMessage({ poll: { question: pollData.question, options: opts } });
    setPollData({ question: "", options: ["", ""] });
    setShowPoll(false); setShowExtras(false);
  };

  const handleSendCapsule = async () => {
    if (!text.trim()) return toast.error("Write a message first");
    if (!capsuleDate) return toast.error("Pick a delivery date");
    await sendMessage({ text, scheduledFor: capsuleDate });
    setText(""); setCapsuleDate("");
    setShowCapsule(false); setShowExtras(false);
    toast.success("⏳ Time capsule scheduled!");
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (audioBlob) return sendAudio();
    if (!text.trim() && !imagePreview) return;
    await sendMessage({ text: text.trim() || undefined, image: imagePreview || undefined, disappearAfter: ghostMode ? 60 : undefined });
    setText(""); setImagePreview(null); setGhostMode(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    socket?.emit("stopTyping", { to: selectedUser._id });
  };

  const panelVariants = {
    hidden: { opacity: 0, y: 8, height: 0 },
    show:   { opacity: 1, y: 0, height: "auto", transition: { ease: [0.16, 1, 0.3, 1], duration: 0.3 } },
    exit:   { opacity: 0, y: 4, height: 0,      transition: { duration: 0.2 } },
  };

  return (
    <div className="border-t-2 border-base-content/10 bg-base-100 p-3" onDrop={handleDrop} onDragOver={e => e.preventDefault()}>

      <AnimatePresence>
        {/* Poll */}
        {showPoll && (
          <motion.div variants={panelVariants} initial="hidden" animate="show" exit="exit"
            className="mb-3 border-2 border-primary/20 bg-primary/5 p-3 overflow-hidden">
            <p className="text-[10px] font-mono text-primary mb-2 font-bold tracking-widest">// CREATE POLL</p>
            <input className="input input-sm w-full mb-2 text-xs border-base-content/20" placeholder="Question..."
              value={pollData.question} onChange={e => setPollData(p => ({ ...p, question: e.target.value }))} />
            {pollData.options.map((opt, i) => (
              <div key={i} className="flex gap-1 mb-1">
                <input className="input input-sm flex-1 text-xs border-base-content/20" placeholder={`Option ${i + 1}`}
                  value={opt} onChange={e => { const o = [...pollData.options]; o[i] = e.target.value; setPollData(p => ({ ...p, options: o })); }} />
                {pollData.options.length > 2 && <button onClick={() => setPollData(p => ({ ...p, options: p.options.filter((_, j) => j !== i) }))} className="btn btn-ghost btn-xs text-error">✕</button>}
              </div>
            ))}
            {pollData.options.length < 5 && (
              <button onClick={() => setPollData(p => ({ ...p, options: [...p.options, ""] }))} className="btn btn-ghost btn-xs text-xs font-mono mb-2">+ option</button>
            )}
            <div className="flex gap-2">
              <button onClick={handleSendPoll} className="btn btn-primary btn-xs">SEND</button>
              <button onClick={() => setShowPoll(false)} className="btn btn-ghost btn-xs">CANCEL</button>
            </div>
          </motion.div>
        )}

        {/* Time capsule */}
        {showCapsule && (
          <motion.div variants={panelVariants} initial="hidden" animate="show" exit="exit"
            className="mb-3 border-2 border-warning/20 bg-warning/5 p-3 overflow-hidden">
            <p className="text-[10px] font-mono text-warning mb-2 font-bold tracking-widest">// TIME CAPSULE</p>
            <input className="input input-sm w-full mb-2 text-xs border-base-content/20" placeholder="Your message to the future..."
              value={text} onChange={e => setText(e.target.value)} />
            <input type="datetime-local" className="input input-sm w-full mb-2 text-xs border-base-content/20"
              value={capsuleDate} min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
              onChange={e => setCapsuleDate(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={handleSendCapsule} className="btn btn-warning btn-xs">SCHEDULE</button>
              <button onClick={() => setShowCapsule(false)} className="btn btn-ghost btn-xs">CANCEL</button>
            </div>
          </motion.div>
        )}

        {/* Image preview */}
        {imagePreview && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="mb-3 inline-flex relative">
            <img src={imagePreview} className="h-20 border-2 border-base-content/10 object-cover" alt="" />
            <button onClick={() => { setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-error text-error-content flex items-center justify-center text-xs">
              ✕
            </button>
          </motion.div>
        )}

        {/* Audio preview */}
        {audioBlob && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="mb-3 flex items-center gap-2 border border-base-content/10 bg-base-200 p-2">
            <audio controls src={URL.createObjectURL(audioBlob)} className="h-8 flex-1" />
            <button onClick={() => setAudioBlob(null)} className="btn btn-ghost btn-xs text-error">✕</button>
            <button onClick={sendAudio} className="btn btn-primary btn-xs"><Send size={12} /></button>
          </motion.div>
        )}

        {/* Emoji picker */}
        {showEmoji && (
          <motion.div variants={panelVariants} initial="hidden" animate="show" exit="exit"
            className="mb-3 grid grid-cols-8 gap-1 border border-base-content/10 bg-base-200 p-2 overflow-hidden">
            {EMOJIS.map(e => (
              <button key={e} onClick={() => { setText(t => t + e); setShowEmoji(false); }}
                className="text-lg hover:scale-125 transition-transform p-0.5">
                {e}
              </button>
            ))}
          </motion.div>
        )}

        {/* Extras menu */}
        {showExtras && (
          <motion.div variants={panelVariants} initial="hidden" animate="show" exit="exit"
            className="mb-3 flex gap-2 overflow-hidden">
            {[
              { label: "POLL",         icon: <BarChart2 size={12} />, onClick: () => { setShowPoll(true); setShowExtras(false); }, cls: "btn-outline" },
              { label: "TIME CAPSULE", icon: <Clock size={12} />,      onClick: () => { setShowCapsule(true); setShowExtras(false); }, cls: "btn-outline" },
              { label: ghostMode ? "GHOST ON" : "GHOST",
                icon: <Ghost size={12} />,
                onClick: () => { setGhostMode(g => !g); setShowExtras(false); },
                cls: ghostMode ? "btn-warning" : "btn-outline" },
            ].map(item => (
              <button key={item.label} onClick={item.onClick} className={`btn btn-xs gap-1 ${item.cls}`}>
                {item.icon} {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {ghostMode && (
        <p className="text-[9px] font-mono text-warning mb-2">👻 ghost mode on — messages vanish in 60s</p>
      )}

      <form onSubmit={handleSend} className="flex items-center gap-2">
        <button type="button" onClick={() => { setShowExtras(e => !e); setShowEmoji(false); }}
          className="btn btn-ghost btn-sm btn-square hover:text-primary">
          <Plus size={16} />
        </button>

        <div className="flex-1 relative">
          <input
            type="text"
            className={`input input-sm w-full border-2 pr-8 ${ghostMode ? "border-warning/50 placeholder:text-warning/40" : "border-base-content/10"}`}
            placeholder={isRecording ? "● recording..." : ghostMode ? "👻 ghost message..." : "// type a message"}
            value={text}
            onChange={e => { setText(e.target.value); emitTyping(); }}
            disabled={isRecording || !!audioBlob || showCapsule}
            style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}
          />
          <button type="button" onClick={() => { setShowEmoji(e => !e); setShowExtras(false); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100 transition-opacity">
            <Smile size={14} />
          </button>
        </div>

        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
        <button type="button" onClick={() => fileInputRef.current?.click()}
          className={`btn btn-ghost btn-sm btn-square ${imagePreview ? "text-primary" : ""}`}>
          <Image size={16} />
        </button>

        {!isRecording
          ? <button type="button" onClick={startRecording} className="btn btn-ghost btn-sm btn-square"><Mic size={16} /></button>
          : <button type="button" onClick={stopRecording} className="btn btn-error btn-sm btn-square animate-pulse"><StopCircle size={16} /></button>
        }

        <button type="submit" disabled={!text.trim() && !imagePreview && !audioBlob}
          className="btn btn-primary btn-sm btn-square disabled:opacity-30">
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
