//zustand store for auth
import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';

export const useAuthStore = create((set) => ({
  authUser: null,
  isCheckingAuth: true,

  isUpdatingProfile: false,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get('/auth/check');
      set({authUser: res.data});
    } catch (error) {
      console.error('Error checking auth:', error);
      set({authUser: null});
    } finally {
      set({isCheckingAuth: false});
    }
  },

  signup: async (data) => {
    try {
      const response = await axiosInstance.post('/auth/signup', data);
      set({ authUser: response.data });

      toast.success('Glad to have you here!', {
        style: {
          border: '1px solid #28a745',
          padding: '16px',
          color: '#155724',
          background: '#d4edda',
          fontWeight: '500',
          borderRadius: '8px',
        },
        iconTheme: {
          primary: '#28a745',
          secondary: '#f0fdf4',
        },
      });
      setTimeout(() => {
        navigate('/');
      }, 1200);
    } catch (error) {
      console.error('Signup failed:', error);
      toast.error(error?.response?.data?.message || 'Signup failed!');
    }
  },

  login: async (data) => {
    try {
      const response = await axiosInstance.post('/auth/login', data);
      set({ authUser: response.data });

      toast.success('Happy to have you back!', {
        style: {
          border: '1px solid #28a745',
          padding: '16px',
          color: '#155724',
          background: '#d4edda',
          fontWeight: '500',
          borderRadius: '8px',
        },
        iconTheme: {
          primary: '#28a745',
          secondary: '#f0fdf4',
        },
      });
      setTimeout(() => {
        navigate('/');
      }, 1200);
    } catch (error) {
      console.error('Login failed:', error);
      toast.error(error?.response?.data?.message || 'Login failed!');
    }
  },


}));