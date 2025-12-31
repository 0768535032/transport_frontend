import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('access_token', access);

          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (username, password) => {
    const response = await api.post('/auth/login/', { username, password });
    return response.data;
  },
  register: async (userData) => {
    const response = await api.post('/auth/register/', userData);
    return response.data;
  },
  refresh: async (refreshToken) => {
    const response = await api.post('/auth/refresh/', { refresh: refreshToken });
    return response.data;
  },
};

// Logs API
export const logsAPI = {
  list: async () => {
    const response = await api.get('/logs/');
    return response.data;
  },
  get: async (id) => {
    const response = await api.get(`/logs/${id}/`);
    return response.data;
  },
  create: async (logData) => {
    const response = await api.post('/logs/', logData);
    return response.data;
  },
  update: async (id, logData) => {
    const response = await api.put(`/logs/${id}/`, logData);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/logs/${id}/`);
    return response.data;
  },
  submit: async (id) => {
    const response = await api.post(`/logs/${id}/submit/`);
    return response.data;
  },
};

export default api;


