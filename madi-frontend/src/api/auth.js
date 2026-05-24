import client from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function login(email, password) {
  const res = await client.post('/users/login', { email, password });
  await AsyncStorage.multiSet([
    ['token', res.data.token],
    ['refreshToken', res.data.refreshToken],
    ['nickname', res.data.nickname],
  ]);
  return res.data;
}

export async function register(email, password, nickname) {
  const res = await client.post('/users/register', { email, password, nickname });
  if (res.data.token) {
    await AsyncStorage.multiSet([
      ['token', res.data.token],
      ['refreshToken', res.data.refreshToken],
      ['nickname', res.data.nickname],
    ]);
  }
  return res.data;
}

export async function forgotPassword(email) {
  const res = await client.post('/users/forgot-password', { email });
  return res.data;
}

export async function logout() {
  const refreshToken = await AsyncStorage.getItem('refreshToken');
  try {
    await client.post('/users/logout', { refreshToken });
  } catch {}
  await AsyncStorage.multiRemove(['token', 'refreshToken', 'nickname']);
}
