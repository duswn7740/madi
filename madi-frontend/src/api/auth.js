import client from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function login(email, password) {
  const res = await client.post('/users/login', { email, password });
  await AsyncStorage.setItem('token', res.data.token);
  await AsyncStorage.setItem('nickname', res.data.nickname);
  return res.data;
}

export async function register(email, password, nickname) {
  const res = await client.post('/users/register', { email, password, nickname });
  return res.data;
}

export async function forgotPassword(email) {
  const res = await client.post('/users/forgot-password', { email });
  return res.data;
}

export async function logout() {
  await AsyncStorage.removeItem('token');
  await AsyncStorage.removeItem('nickname');
}
