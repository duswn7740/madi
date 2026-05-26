import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Galmuri11': require('../assets/fonts/Galmuri11.ttf'),
    'Galmuri11-Bold': require('../assets/fonts/Galmuri11-Bold.ttf'),
    'Galmuri11-Condensed': require('../assets/fonts/Galmuri11-Condensed.ttf'),
    'Galmuri14': require('../assets/fonts/Galmuri14.ttf'),
  });

  if (!fontsLoaded) return <View />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(main)" />
      </Stack>
      <StatusBar style="auto" />
    </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
