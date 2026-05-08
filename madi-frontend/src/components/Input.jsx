import { View, TextInput, StyleSheet } from 'react-native';
import Text from './Text';
import { colors, spacing, typography, radius, fontFamily } from '@/src/theme';

export default function Input({ label, error, ...props }) {
  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error && styles.inputError]}
        placeholderTextColor={colors.textSub}
        fontFamily={fontFamily.regular}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 4,
  },
  label: {
    fontSize: typography.sm,
    color: colors.textSub,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.md,
    color: colors.textMain,
    fontFamily: fontFamily.regular,
  },
  inputError: {
    borderColor: colors.error,
  },
  error: {
    fontSize: typography.xs,
    color: colors.error,
  },
});
