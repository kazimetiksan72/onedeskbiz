import axios from 'axios';
import { useAuthStore } from '../features/auth/auth.store';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL
});

let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async () => {
  const { refreshToken, clearAuth, setAuth, user } = useAuthStore.getState();

  if (!refreshToken) return null;

  try {
    const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });

    if (!data.accessToken) {
      clearAuth();
      return null;
    }

    setAuth({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: user!
    });

    return data.accessToken as string;
  } catch {
    clearAuth();
    return null;
  }
};

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (status !== 401 || originalRequest?._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    const newAccessToken = await refreshPromise;

    if (!newAccessToken) {
      return Promise.reject(error);
    }

    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
    return api(originalRequest);
  }
);
