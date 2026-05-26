import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Text from '@/src/components/Text';
import Header from '@/src/components/Header';
import { colors, typography, fontFamily } from '@/src/theme';

export default function CalendarScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Header title="달력" />
      <View style={styles.center}>
        <Text style={styles.emoji}>🗓️</Text>
        <Text style={styles.title}>준비중</Text>
        <Text style={styles.sub}>곧 만나요!</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emoji: { fontSize: 40 },
  title: { fontSize: typography.xl, fontFamily: fontFamily.bold, color: colors.textMain },
  sub: { fontSize: typography.sm, fontFamily: fontFamily.regular, color: colors.textSub },
});
