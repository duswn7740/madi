import React, { useRef } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { colors, typography, fontFamily, radius } from '@/src/theme';

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 3;

export default function WheelPicker({ items, selectedIndex, onSelect, width = 80 }) {
  const listRef = useRef(null);

  const handleMomentumEnd = (e) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(index, items.length - 1));
    onSelect(clamped);
  };

  const getItemLayout = (_, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  });

  const renderItem = ({ item, index }) => (
    <View style={styles.item}>
      <Text style={[
        styles.itemText,
        index === selectedIndex && styles.itemTextSelected,
      ]}>
        {item}
      </Text>
    </View>
  );

  function scrollToSelected() {
    listRef.current?.scrollToOffset({
      offset: selectedIndex * ITEM_HEIGHT,
      animated: false,
    });
  }

  return (
    <View style={[styles.container, { width }]}>
      <View style={styles.highlight} pointerEvents="none" />
      <FlatList
        ref={listRef}
        data={items}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleMomentumEnd}
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
        onLayout={scrollToSelected}
        nestedScrollEnabled
        scrollEventThrottle={16}
      />
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
