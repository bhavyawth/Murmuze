import { create } from 'zustand';
import toast from 'react-hot-toast';
import { axiosInstance } from '../lib/axios';
import { useAuthStore } from './useAuthStore';

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isMessagesLoading: false,
  isUsersLoading: false,
  typingUsers: {},         // { userId: true/false }
  unreadCounts: {},        // { userId: count }
  chatWallpapers: JSON.parse(localStorage.getItem('chatWallpapers') || '{}'),
  achievements: [],
  callLogs: [],

  setSelectedUser: (selectedUser) => {
    set({ selectedUser });
    if (selectedUser) {
      // Clear unread for this user
      set(state => ({
        unreadCounts: { ...state.unreadCounts, [selectedUser._id]: 0 }
      }));
    }
  },

  setChatWallpaper: (userId, wallpaper) => {
    set(state => {
      const updated = { ...state.chatWallpapers, [userId]: wallpaper };
      localStorage.setItem('chatWallpapers', JSON.stringify(updated));
      return { chatWallpapers: updated };
    });
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
      const isFromSelected = newMessage.senderId._id === selectedUser._id;
      if (isFromSelected) {
        set(state => ({ messages: [...state.messages, newMessage] }));
        // Mark as read immediately since chat is open
        socket.emit("markRead", { from: selectedUser._id });
      } else {
        // Increment unread for other user
        set(state => ({
          unreadCounts: {
            ...state.unreadCounts,
            [newMessage.senderId._id]: (state.unreadCounts[newMessage.senderId._id] || 0) + 1,
          }
        }));
      }
      // Play notification sound if enabled
      const settings = JSON.parse(localStorage.getItem('murmuze_settings') || '{}');
      if (!isFromSelected && settings.soundEnabled !== false) {
        playNotificationSound();
      }
    });

    socket.on("messageDeleted", ({ messageId }) => {
      set(state => ({
        messages: state.messages.map(m =>
          m._id === messageId ? { ...m, isDeleted: true, text: null, image: null, audio: null, gif: null } : m
        )
      }));
    });

    socket.on("messageExpired", ({ messageId }) => {
      set(state => ({
        messages: state.messages.filter(m => m._id !== messageId)
      }));
    });

    socket.on("reactionUpdate", ({ messageId, reactions }) => {
      set(state => ({
        messages: state.messages.map(m =>
          m._id === messageId ? { ...m, reactions } : m
        )
      }));
    });

    socket.on("pollUpdate", ({ messageId, poll }) => {
      set(state => ({
        messages: state.messages.map(m =>
          m._id === messageId ? { ...m, poll } : m
        )
      }));
    });

    socket.on("messagesRead", ({ by }) => {
      if (by === selectedUser._id) {
        set(state => ({
          messages: state.messages.map(m =>
            m.senderId === useAuthStore.getState().authUser._id ? { ...m, isRead: true } : m
          )
        }));
      }
    });

    socket.on("userTyping", ({ from }) => {
      if (from === selectedUser._id) {
        set(state => ({ typingUsers: { ...state.typingUsers, [from]: true } }));
      }
    });

    socket.on("userStoppedTyping", ({ from }) => {
      if (from === selectedUser._id) {
        set(state => ({ typingUsers: { ...state.typingUsers, [from]: false } }));
      }
    });

    socket.on("achievementUnlocked", ({ achievements, xp, level }) => {
      set({ achievements });
      set(state => ({
        ...state,
        // Update authUser XP/level
      }));
      achievements.forEach(a => {
        toast.success(`🏆 Achievement unlocked: ${formatAchievementName(a)}!`, { duration: 4000 });
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("newMessage");
    socket.off("messageDeleted");
    socket.off("messageExpired");
    socket.off("reactionUpdate");
    socket.off("pollUpdate");
    socket.off("messagesRead");
    socket.off("userTyping");
    socket.off("userStoppedTyping");
    socket.off("achievementUnlocked");
  },

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const response = await axiosInstance.get('/messages/users');
      set({ users: response.data, isUsersLoading: false });
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const response = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: response.data, isMessagesLoading: false });
    } catch (error) {
      toast.error('Failed to load messages');
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (content) => {
    try {
      const userToSend = get().selectedUser;
      const userId = userToSend?._id;
      if (!userId) { toast.error('No user selected'); return; }
      const response = await axiosInstance.post(`/messages/send/${userId}`, content);
      set(state => ({ messages: [...state.messages, response.data] }));
      return response.data;
    } catch (error) {
      toast.error('Failed to send message');
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await axiosInstance.delete(`/messages/${messageId}`);
      set(state => ({
        messages: state.messages.map(m =>
          m._id === messageId ? { ...m, isDeleted: true, text: null, image: null, audio: null, gif: null } : m
        )
      }));
    } catch (error) {
      toast.error('Failed to delete message');
    }
  },

  reactToMessage: async (messageId, emoji) => {
    try {
      const response = await axiosInstance.post(`/messages/react/${messageId}`, { emoji });
      set(state => ({
        messages: state.messages.map(m =>
          m._id === messageId ? { ...m, reactions: response.data.reactions } : m
        )
      }));
    } catch (error) {
      toast.error('Failed to react');
    }
  },

  voteOnPoll: async (messageId, optionIndex) => {
    try {
      const response = await axiosInstance.post(`/messages/poll/${messageId}/vote`, { optionIndex });
      set(state => ({
        messages: state.messages.map(m =>
          m._id === messageId ? { ...m, poll: response.data.poll } : m
        )
      }));
    } catch (error) {
      toast.error('Failed to vote');
    }
  },

  getCallLogs: async () => {
    try {
      const response = await axiosInstance.get('/messages/calls');
      set({ callLogs: response.data });
    } catch (error) {
      console.error('Failed to load call logs');
    }
  },

  getChatStats: async (userId) => {
    try {
      const response = await axiosInstance.get(`/messages/stats/${userId}`);
      return response.data;
    } catch (error) {
      toast.error('Failed to load stats');
      return null;
    }
  },

  searchMessages: async (userId, query) => {
    try {
      const response = await axiosInstance.get(`/messages/search/${userId}?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      return [];
    }
  },
}));

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.frequency.setValueAtTime(800, ctx.currentTime);
    oscillator.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  } catch (e) { /* silent fail */ }
}

function formatAchievementName(key) {
  const names = {
    first_message: "First Message Sent",
    hundred_messages: "Centurion (100 Messages)",
    night_owl: "Night Owl (3 AM club)",
    chatterbox: "Chatterbox",
    streak_7: "Week Warrior (7 day streak)",
    streak_30: "Monthly Legend (30 day streak)",
    image_sender: "Picture Perfect",
    voice_sender: "Voice Actor",
    poll_creator: "Decision Maker",
  };
  return names[key] || key;
}
