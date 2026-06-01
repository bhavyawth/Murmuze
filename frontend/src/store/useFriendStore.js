import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';

export const useFriendStore = create((set, get) => ({
  friends: [],
  pendingRequests: [],
  sentRequests: [],
  searchResults: [],
  isSearching: false,

  loadFriendsData: async () => {
    try {
      const res = await axiosInstance.get('/auth/friends');
      set({
        friends:         res.data.friends        || [],
        pendingRequests: res.data.pendingRequests || [],
        sentRequests:    res.data.sentRequests    || [],
      });
    } catch (e) {
      // not logged in yet — silent fail
    }
  },

  searchUsers: async (query) => {
    if (query.trim().length < 2) { set({ searchResults: [] }); return; }
    set({ isSearching: true });
    try {
      const res = await axiosInstance.get(`/auth/search?q=${encodeURIComponent(query)}`);
      set({ searchResults: res.data });
    } catch (e) {
      console.error('searchUsers:', e);
    } finally {
      set({ isSearching: false });
    }
  },

  sendRequest: async (targetId) => {
    try {
      const res = await axiosInstance.post(`/auth/friends/request/${targetId}`);
      if (res.data.status === 'accepted') {
        toast.success('🎉 You are now friends!');
      } else {
        toast.success('✉️ Friend request sent!');
      }
      await get().loadFriendsData();
      // Update search results inline
      set(s => ({
        searchResults: s.searchResults.map(u =>
          u._id === targetId
            ? { ...u, requestSent: true, requestPending: false }
            : u
        ),
      }));
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to send request');
    }
  },

  acceptRequest: async (requesterId) => {
    try {
      await axiosInstance.post(`/auth/friends/accept/${requesterId}`);
      toast.success('🤝 Friend request accepted!');
      await get().loadFriendsData();
    } catch (e) {
      toast.error('Failed to accept request');
    }
  },

  declineRequest: async (requesterId) => {
    try {
      await axiosInstance.post(`/auth/friends/decline/${requesterId}`);
      await get().loadFriendsData();
    } catch (e) {
      toast.error('Failed to decline request');
    }
  },

  // Called from socket listener when a new request arrives
  handleIncomingRequest: ({ fromName }) => {
    toast(`👋 ${fromName} sent you a friend request!`, { icon: "🔔", duration: 5000 });
    get().loadFriendsData();
  },
}));
