import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useCallStore } from "../store/useCallStore";
import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
import { IncomingCallModal, ActiveCallModal } from "../components/CallModal";
import { motion } from "framer-motion";

export default function HomePage() {
  const { selectedUser } = useChatStore();
  const { socket } = useAuthStore();
  const { setIncomingCall, incomingCall, activeCall } = useCallStore();

  useEffect(() => {
    if (!socket) return;
    socket.on("incomingCall", setIncomingCall);
    return () => socket.off("incomingCall", setIncomingCall);
  }, [socket]);

  return (
    <div className="h-screen bg-base-200 flex items-center justify-center grid-bg">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="bg-base-100 border-2 border-base-content/10 w-full max-w-7xl h-full md:h-[92vh] overflow-hidden flex flex-col"
      >
        <div className="flex flex-1 overflow-hidden pt-14">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
          </div>
        </div>
      </motion.div>

      {incomingCall && !activeCall && <IncomingCallModal />}
      {activeCall && <ActiveCallModal />}
    </div>
  );
}
