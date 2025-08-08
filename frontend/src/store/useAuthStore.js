//zustand store for auth
import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';

export const useAuthStore = create((set) => ({
  authUser: null,
  isCheckingAuth: true,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get('/auth/check');
      set({authUser: res.data.user});
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
      set({ authUser: response.data.user });

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
      set({ authUser: response.data.user });

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

  logout: async () => {
    try {
      const response = await axiosInstance.post('/auth/logout');
      set({ authUser: null });

      toast.success('Logged Out!', {
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
      console.error('Logout failed:', error);
      toast.error(error?.response?.data?.message || 'Logout failed!');
    }
  },

  updateProfile: async (data) => {
    try {
      const response = await axiosInstance.put('/auth/profile', data);
      set({ authUser: response.data.user });
      toast.success('Profile updated successfully!', {
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
    } catch (error) {
      console.error('Profile update failed:', error);
      toast.error(error?.response?.data?.message || 'Profile update failed!');
    }
  },

}));