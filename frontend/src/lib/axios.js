import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_API_URL}/api`;

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});
