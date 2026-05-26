import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, fontFamily, spacing } from '@/src/theme';

export default function Header({ title, onBack, right }) {
  return (
    <View style={styles.container}>
      <View style={styles.side}>
        {onBack && (
          <TouchableOpacity onPress={onBack} activeOpacity={0.6} style={styles.backButton}>
            <Text style={styles.backText}>{'<'}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.titleWrapper} pointerEvents="none">
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.side}>
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
  },
  side: {
    minWidth: 40,
    alignItems: 'center',
  },
  titleWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  title: {
    fontSize: typography.lg,
    fontFamily: fontFamily.bold,
    color: colors.textMain,
  },
  backButton: {
    padding: spacing.xs,
  },
  backText: {
    fontSize: typography.lg,
    fontFamily: fontFamily.bold,
    color: colors.butterDark,
  },
});
