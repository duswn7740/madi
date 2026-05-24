import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const BASE_URL = 'https://madi-api.duckdns.org/api';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach(p => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
}

async function clearSession() {
  await AsyncStorage.multiRemove(['token', 'refreshToken', 'nickname']);
  setTimeout(() => router.replace('/(auth)/login'), 0);
}

client.interceptors.response.use(
  response => response,
  async error => {
    const original = error.config;
    const isAuthEndpoint = original.url?.includes('/users/login') ||
      original.url?.includes('/users/register') ||
      original.url?.includes('/users/refresh');
    if (error.response?.status !== 401 || original._retry || isAuthEndpoint) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => failedQueue.push({ resolve, reject }))
        .then(token => {
          original.headers.Authorization = `Bearer ${token}`;
          return client(original);
        });
    }

    original._retry = true;
    isRefreshing = true;

    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (!refreshToken) {
      processQueue(error, null);
      isRefreshing = false;
      await clearSession();
      return Promise.reject(error);
    }

    try {
      const { data } = await axios.post(`${BASE_URL}/users/refresh`, { refreshToken });
      await AsyncStorage.multiSet([
        ['token', data.token],
        ['refreshToken', data.refreshToken],
      ]);
      processQueue(null, data.token);
      original.headers.Authorization = `Bearer ${data.token}`;
      return client(original);
    } catch (err) {
      processQueue(err, null);
      await clearSession();
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);

export default client;
