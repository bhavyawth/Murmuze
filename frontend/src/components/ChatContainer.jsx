import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageBubble from "./MessageBubble";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { motion } from "framer-motion";

const TypingIndicator = ({ name }) => (
  <div className="flex items-center gap-2 mb-3">
    <div className="flex gap-1 items-center border border-base-content/10 bg-base-200 px-3 py-2">
      <span className="w-1.5 h-1.5 bg-primary typing-dot-1" />
      <span className="w-1.5 h-1.5 bg-primary typing-dot-2" />
      <span className="w-1.5 h-1.5 bg-primary typing-dot-3" />
      <span className="text-[9px] font-mono opacity-40 ml-1">{name} is typing</span>
    </div>
  </div>
);

export default function ChatContainer() {
  const { messages, getMessages, isMessagesLoading, selectedUser,
    subscribeToMessages, unsubscribeFromMessages, typingUsers, chatWallpapers } = useChatStore();
  const { authUser } = useAuthStore();
  const bottomRef = useRef(null);

  useEffect(() => {
    getMessages(selectedUser._id);
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [selectedUser._id]);

  // Client-side cleanup of expired ghost messages (fallback)
  useEffect(() => {
    const expirationTimer = setInterval(() => {
      const now = Date.now();
      const expiredMessageIds = [];

      messages.forEach(msg => {
        if (msg.expiresAt) {
          const expiresTime = new Date(msg.expiresAt).getTime();
          if (now >= expiresTime) {
            expiredMessageIds.push(msg._id);
          }
        }
      });

      // Remove all expired messages from UI
      if (expiredMessageIds.length > 0) {
        useChatStore.setState(state => ({
          messages: state.messages.filter(m => !expiredMessageIds.includes(m._id))
        }));
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(expirationTimer);
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  const wallpaper = chatWallpapers[selectedUser._id];
  const isTyping = typingUsers[selectedUser._id];

  const bgStyle = wallpaper
    ? wallpaper.startsWith("linear") ? { background: wallpaper } : { backgroundColor: wallpaper }
    : {};

  if (isMessagesLoading) return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ChatHeader />
      <MessageSkeleton />
      <MessageInput />
    </div>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ChatHeader />
      <div className="flex-1 overflow-y-auto p-4 grid-bg" style={bgStyle}>
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full gap-2 opacity-30"
          >
            <span className="text-4xl">💬</span>
            <p className="text-xs font-mono">// start the conversation</p>
          </motion.div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg._id} message={msg} />
        ))}

        {isTyping && <TypingIndicator name={selectedUser.fullName} />}
        <div ref={bottomRef} />
      </div>
      <MessageInput />
    </div>
  );
}
