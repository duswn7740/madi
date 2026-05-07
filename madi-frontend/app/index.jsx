import { useEffect } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '@/src/theme';

export default function Index() {
  useEffect(() => {
    async function check() {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        router.replace('/(main)');
      } else {
        router.replace('/(auth)/login');
      }
    }
    check();
  }, []);

  return <View style={{ flex: 1, backgroundColor: colors.background }} />;
}
