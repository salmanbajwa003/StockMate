import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const API_URL = API_BASE_URL;

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
axiosInstance.interceptors.request.use(
  (config: any) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  },
);

export const authService = {
  login: async (email: string, password: string) => {
    // Note: Backend expects username, but we're sending email as username
    const response = await axiosInstance.post('api/auth/login', {
      username: email,
      password,
    });
    return response.data;
  },

  // register: async (name: string, username: string, email: string, password: string) => {
  //   const response = await axiosInstance.post('/auth/register', {
  //     name,
  //     username,
  //     email,
  //     password,
  //   });
  //   return response.data;
  // },

  getProfile: async () => {
    const response = await axiosInstance.get('api/auth/profile');
    return response.data;
  },
};

export default axiosInstance;
