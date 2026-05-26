import React, { useRef } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, typography, fontFamily, radius } from '@/src/theme';

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 3;

export default function WheelPicker({ items, selectedIndex, onSelect, width = 80 }) {
  const scrollRef = useRef(null);
  const hasInitialized = useRef(false);
  const lastIndexRef = useRef(selectedIndex);
  const isMomentumRef = useRef(false);

  const snapToIndex = (y) => {
    const index = Math.round(y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(index, items.length - 1));
    scrollRef.current?.scrollTo({ y: clamped * ITEM_HEIGHT, animated: true });
    if (lastIndexRef.current !== clamped) {
      lastIndexRef.current = clamped;
      onSelect(clamped);
    }
  };

  const handleLayout = () => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    scrollRef.current?.scrollTo({ y: selectedIndex * ITEM_HEIGHT, animated: false });
    lastIndexRef.current = selectedIndex;
  };

  const handleMomentumBegin = () => {
    isMomentumRef.current = true;
  };

  const handleMomentumEnd = (e) => {
    isMomentumRef.current = false;
    snapToIndex(e.nativeEvent.contentOffset.y);
  };

  const handleDragEnd = (e) => {
    const y = e.nativeEvent.contentOffset.y;
    setTimeout(() => {
      if (!isMomentumRef.current) {
        snapToIndex(y);
      }
    }, 50);
  };

  return (
    <View style={[styles.container, { width }]}>
      <View style={styles.highlight} pointerEvents="none" />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        decelerationRate="normal"
        onMomentumScrollBegin={handleMomentumBegin}
        onMomentumScrollEnd={handleMomentumEnd}
        onScrollEndDrag={handleDragEnd}
        onLayout={handleLayout}
        nestedScrollEnabled
        scrollEventThrottle={16}
      >
        <View style={{ height: ITEM_HEIGHT }} />
        {items.map((item, index) => (
          <View key={index} style={styles.item}>
            <Text style={[
              styles.itemText,
              index === selectedIndex && styles.itemTextSelected,
            ]}>
              {item}
            </Text>
          </View>
        ))}
        <View style={{ height: ITEM_HEIGHT }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    overflow: 'hidden',
  },
  highlight: {
    position: 'absolute',
    top: ITEM_HEIGHT,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    backgroundColor: colors.butterLight,
    borderRadius: radius.sm,
    zIndex: 0,
  },
  item: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontSize: typography.md,
    lineHeight: typography.md + 2,
    fontFamily: fontFamily.regular,
    color: colors.textSub,
    includeFontPadding: false,
  },
  itemTextSelected: {
    fontSize: typography.lg,
    lineHeight: typography.lg + 2,
    fontFamily: fontFamily.bold,
    color: colors.textMain,
    includeFontPadding: false,
  },
});
