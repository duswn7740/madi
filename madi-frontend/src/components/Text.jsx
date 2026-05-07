import { Text as RNText, StyleSheet } from 'react-native';
import { fonts, colors } from '@/src/theme';

export default function Text({ style, bold, ...props }) {
  return (
    <RNText
      style={[styles.base, bold && styles.bold, style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: fonts.regular,
    color: colors.textMain,
  },
  bold: {
    fontFamily: fonts.bold,
  },
});
