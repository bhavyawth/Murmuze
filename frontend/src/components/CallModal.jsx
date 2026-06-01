import { useEffect, useRef } from "react";
import { useCallStore } from "../store/useCallStore";
import { useChatStore } from "../store/useChatStore";
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function fmt(s) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function IncomingCallModal() {
  const { incomingCall, acceptCall, rejectCall } = useCallStore();
  const { users } = useChatStore();
  if (!incomingCall) return null;
  const caller = users.find(u => u._id === incomingCall.from);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.4 }}
          className="bg-base-100 border-2 border-base-content/10 p-8 flex flex-col items-center gap-6 w-80 relative"
        >
          {/* Corner accents */}
          <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-primary" />
          <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-primary" />
          <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-primary" />
          <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-primary" />

          {/* Pulsing avatar */}
          <div className="relative">
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
              className="absolute inset-0 border-2 border-primary/30"
            />
            <img src={caller?.profilePic || "/avatar.png"} className="w-20 h-20 object-cover border-2 border-primary relative z-10" alt="" />
          </div>

          <div className="text-center">
            <p className="text-[9px] font-mono text-primary tracking-widest mb-1">
              INCOMING {incomingCall.type?.toUpperCase()} CALL
            </p>
            <h3 className="text-xl font-bold tracking-wide" style={{ fontFamily: "var(--font-display)" }}>
              {caller?.fullName || "Unknown"}
            </h3>
          </div>

          <div className="flex gap-4 w-full">
            <button onClick={() => rejectCall(incomingCall)}
              className="btn btn-error flex-1 gap-2">
              <PhoneOff size={16} /> DECLINE
            </button>
            <button onClick={() => acceptCall(incomingCall)}
              className="btn btn-success flex-1 gap-2">
              <Phone size={16} /> ACCEPT
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function ActiveCallModal() {
  const { activeCall, localStream, remoteStream, isMuted, isCameraOff, callDuration, toggleMute, toggleCamera, hangUp } = useCallStore();
  const { users } = useChatStore();
  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => { if (localRef.current && localStream) localRef.current.srcObject = localStream; }, [localStream]);
  useEffect(() => {
    if (remoteRef.current && remoteStream) remoteRef.current.srcObject = remoteStream;
    if (audioRef.current && remoteStream) audioRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  if (!activeCall) return null;
  const other = users.find(u => u._id === activeCall.userId);
  const isVideo = activeCall.type === "video";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Audio element for voice calls (hidden but plays audio) */}
      {!isVideo && <audio ref={audioRef} autoPlay playsInline />}

      {/* Remote */}
      {isVideo ? (
        <video ref={remoteRef} autoPlay playsInline className="w-full h-full object-cover" />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-base-300 grid-bg">
          <motion.img
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            src={other?.profilePic || "/avatar.png"}
            className="w-28 h-28 object-cover border-2 border-primary mb-4"
            alt=""
          />
          <h2 className="text-2xl font-bold text-base-content" style={{ fontFamily: "var(--font-display)" }}>
            {other?.fullName}
          </h2>
          <p className="text-sm font-mono text-base-content/40 mt-1">
            {activeCall.startedAt ? fmt(callDuration) : "connecting..."}
          </p>
        </div>
      )}

      {/* Local PiP */}
      {isVideo && (
        <div className="absolute top-4 right-4 w-28 h-20 border-2 border-white/30 overflow-hidden shadow-2xl">
          <video ref={localRef} autoPlay muted playsInline className={`w-full h-full object-cover ${isCameraOff ? "opacity-0" : ""}`} />
          {isCameraOff && (
            <div className="absolute inset-0 bg-base-300 flex items-center justify-center">
              <VideoOff size={18} className="opacity-30" />
            </div>
          )}
        </div>
      )}

      {/* Video overlay info */}
      {isVideo && (
        <div className="absolute top-4 left-4 text-white">
          <p className="font-bold text-base drop-shadow" style={{ fontFamily: "var(--font-display)" }}>{other?.fullName}</p>
          <p className="text-xs font-mono text-white/50 drop-shadow">{activeCall.startedAt ? fmt(callDuration) : "connecting..."}</p>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-10 left-0 right-0 flex items-center justify-center gap-4">
        <button onClick={toggleMute}
          className={`btn btn-square btn-lg border-2 ${isMuted ? "btn-warning border-warning" : "bg-white/10 border-white/30 text-white hover:bg-white/20"}`}>
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        <button onClick={() => hangUp(activeCall.userId)}
          className="btn btn-error btn-square border-2 border-error"
          style={{ width: 64, height: 64 }}>
          <PhoneOff size={24} />
        </button>

        {isVideo && (
          <button onClick={toggleCamera}
            className={`btn btn-square btn-lg border-2 ${isCameraOff ? "btn-warning border-warning" : "bg-white/10 border-white/30 text-white hover:bg-white/20"}`}>
            {isCameraOff ? <VideoOff size={20} /> : <Video size={20} />}
          </button>
        )}
      </div>
    </motion.div>
  );
}
