import { View, Image, StyleSheet } from 'react-native';
import Text from './Text';
import { colors, typography, fontFamily, spacing } from '@/src/theme';

export default function EmptyState({ image, message, sub, children }) {
  return (
    <View style={styles.container}>
      {image && <Image source={image} style={styles.image} resizeMode="contain" />}
      {message && <Text style={styles.message}>{message}</Text>}
      {sub && <Text style={styles.sub}>{sub}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
  },
  image: {
    width: 80,
    height: 80,
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: typography.lg,
    fontFamily: fontFamily.bold,
    color: colors.textMain,
    textAlign: 'center',
  },
  sub: {
    fontSize: typography.sm,
    fontFamily: fontFamily.regular,
    color: colors.textSub,
    textAlign: 'center',
  },
});
