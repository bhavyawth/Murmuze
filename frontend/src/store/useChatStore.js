import {create} from 'zustand';
import toast from 'react-hot-toast';
import {axiosInstance} from '../lib/axios';
import {useAuthStore} from './useAuthStore';

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  onlineUsers: [],
  selectedUser: null,
  isMessagesLoading: false,
  isUsersLoading: false,

  setSelectedUser: (selectedUser) => set({selectedUser}),

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      set({
        messages: [...get().messages, newMessage],
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  getUsers: async () => {
    set({isUsersLoading: true});
    try {
      const response = await axiosInstance.get('/messages/users');
      set({users: response.data, isUsersLoading: false});
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      set({isUsersLoading: false});
    }
  },

  getMessages: async (userId) => {
    set({isMessagesLoading: true});
    try {
      const response = await axiosInstance.get(`/messages/${userId}`);
      set({messages: response.data, isMessagesLoading: false});
      console.log("Messages loaded:", response.data);
    } catch (error) {
      toast.error('Failed to load messages');
    } finally {
      set({isMessagesLoading: false});
    }
  },

  sendMessage: async (content) => {
    try {
      const userToSend = get().selectedUser;
      const userId = userToSend?._id;
      console.log("Sending message to user:", userId);
      if (!userId) {
        toast.error('No user selected');
        return;
      }
      const response = await axiosInstance.post(`/messages/send/${userId}`, {
        text: content.text.trim(),
        image: content.image,
      });
      set((state) => ({
        messages: [...state.messages, response.data],
      }));
    } catch (error) {
      toast.error('Failed to send message');
    }
  },
}));