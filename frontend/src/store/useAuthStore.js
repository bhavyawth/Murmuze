import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

const BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_API_URL;

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get('/auth/check');
      set({ authUser: res.data.user });
      get().connectSocket();
    } catch {
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    try {
      const res = await axiosInstance.post('/auth/signup', data);
      set({ authUser: res.data.user });
      toast.success('Welcome to Murmuze!');
      get().connectSocket();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Signup failed');
    }
  },

  login: async (data) => {
    try {
      const res = await axiosInstance.post('/auth/login', data);
      set({ authUser: res.data.user });
      toast.success('Welcome back!');
      get().connectSocket();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Login failed');
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post('/auth/logout');
      set({ authUser: null });
      toast.success('Logged out!');
      get().disconnectSocket();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Logout failed');
    }
  },

  updateProfile: async (data) => {
    try {
      const res = await axiosInstance.put('/auth/profile', data);
      set({ authUser: res.data.user });
      toast.success('Profile updated!');
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Update failed');
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, { query: { userId: authUser._id } });
    socket.connect();
    set({ socket });

    socket.on('getOnlineUsers', (onlineUsers) => set({ onlineUsers }));

    // Global friend-request notifications (fires on any page)
    socket.on('newFriendRequest', ({ fromName, from }) => {
      toast(`👋 ${fromName} sent you a friend request!`, { icon: '🔔', duration: 5000 });
      // Dynamically import to avoid circular dep
      import('./useFriendStore').then(({ useFriendStore }) => {
        useFriendStore.getState().loadFriendsData();
      });
    });

    socket.on('friendRequestAccepted', ({ byName }) => {
      if (byName) toast.success(`🎉 ${byName} accepted your friend request!`);
      import('./useFriendStore').then(({ useFriendStore }) => {
        useFriendStore.getState().loadFriendsData();
      });
    });

    // Update authUser XP/level from achievement events
    socket.on('achievementUnlocked', ({ xp, level }) => {
      set(s => ({
        authUser: s.authUser ? { ...s.authUser, xp, level } : s.authUser,
      }));
    });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket?.connected) {
      socket.disconnect();
      set({ socket: null });
    }
  },
}));
