import { View, FlatList, TouchableOpacity, StyleSheet, Dimensions, Image } from 'react-native';
import { useRef, useState, forwardRef, useImperativeHandle } from 'react';
import Text from './Text';
import { colors, spacing, typography, radius, fontFamily } from '@/src/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const ITEM_WIDTH = SCREEN_WIDTH / 7;
const TOTAL_DAYS = 365;
const TODAY_INDEX = 182;

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function getDateByIndex(index) {
  const d = new Date();
  d.setDate(d.getDate() + index - TODAY_INDEX);
  return d;
}

const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];
const DATA = Array.from({ length: TOTAL_DAYS }, (_, i) => i);

const CalendarStrip = forwardRef(function CalendarStrip({ practiceDates = [], onDateChange, onMetronomePress, onTunerPress, copyMode = false, onCopyDate }, ref) {
  const TODAY = new Date();
  const listRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(TODAY_INDEX);

  const selectedDate = getDateByIndex(selectedIndex);
  const isViewingToday = isSameDay(selectedDate, TODAY);

  function getTextColor(hasPractice) {
    return hasPractice ? colors.sageDark : colors.textSub;
  }

  function scrollToIndex(index) {
    listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
  }

  function goLeft() {
    const newIndex = Math.max(0, selectedIndex - 1);
    setSelectedIndex(newIndex);
    onDateChange?.(getDateByIndex(newIndex));
    scrollToIndex(newIndex);
  }

  function goRight() {
    const newIndex = Math.min(TOTAL_DAYS - 1, selectedIndex + 1);
    setSelectedIndex(newIndex);
    onDateChange?.(getDateByIndex(newIndex));
    scrollToIndex(newIndex);
  }

  useImperativeHandle(ref, () => ({ goLeft, goRight }));

  function goToday() {
    setSelectedIndex(TODAY_INDEX);
    onDateChange?.(new Date());
    scrollToIndex(TODAY_INDEX);
  }

  function handlePress(index) {
    if (copyMode) {
      onCopyDate?.(getDateByIndex(index));
      return;
    }
    setSelectedIndex(index);
    onDateChange?.(getDateByIndex(index));
    scrollToIndex(index);
  }

  function renderItem({ item: index }) {
    const d = getDateByIndex(index);
    const isToday = isSameDay(d, TODAY);
    const isSelected = index === selectedIndex;
    const hasPractice = practiceDates.some(pd => isSameDay(new Date(pd), d));
    const textColor = getTextColor(hasPractice);
    const isFirstOfMonth = d.getDate() === 1;
    const dateLabel = isFirstOfMonth ? `${d.getMonth() + 1}/1` : `${d.getDate()}`;

    return (
      <TouchableOpacity
        style={styles.dayItem}
        onPress={() => handlePress(index)}
        activeOpacity={0.7}
      >
        <View style={[
          styles.dayInner,
          isSelected && styles.dayItemSelected,
          isToday && styles.dayItemToday,
          copyMode && styles.dayItemCopyTarget,
        ]}>
          <Text style={[styles.dayDate, { color: textColor }, isToday && styles.dayDateToday]}>
            {dayLabels[d.getDay()]}
          </Text>
          <Text style={[styles.dayDate, { color: textColor }, isToday && styles.dayDateToday]}>
            {dateLabel}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.calendarWrapper}>
      <View style={styles.header}>
        {/* 왼쪽 */}
        <TouchableOpacity onPress={goLeft} style={styles.arrowButton}>
          <Text style={styles.arrow}>{'‹'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onTunerPress} style={styles.iconButton}>
          <Image source={require('../../assets/icons/tuning_fork.png')} style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onMetronomePress} style={styles.iconButton}>
          <Image source={require('../../assets/icons/metronome.png')} style={styles.icon} />
        </TouchableOpacity>

        {/* 중앙 - 절대 위치로 항상 가운데 */}
        <View style={styles.monthLabelWrapper} pointerEvents="none">
          <Text bold style={styles.monthLabel}>
            {`${selectedDate.getFullYear()}년 ${selectedDate.getMonth() + 1}월`}
          </Text>
        </View>

        <View style={{ flex: 1 }} />

        {/* 오른쪽 */}
        <TouchableOpacity
          style={[styles.todayButton, isViewingToday && { opacity: 0 }]}
          onPress={goToday}
          disabled={isViewingToday}
        >
          <Text style={styles.todayText}>오늘</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goRight} style={styles.arrowButton}>
          <Text style={styles.arrow}>{'›'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={listRef}
        data={DATA}
        keyExtractor={(item) => String(item)}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ height: 52 }}
        getItemLayout={(_, index) => ({ length: ITEM_WIDTH, offset: ITEM_WIDTH * index, index })}
        initialScrollIndex={TODAY_INDEX - 3}
        onScrollToIndexFailed={() => {}}
      />
    </View>
  );
});

export default CalendarStrip;

const styles = StyleSheet.create({
  calendarWrapper: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  arrowButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrow: {
    fontSize: 22,
    color: colors.textSub,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  iconButton: {
    padding: spacing.xs,
  },
  icon: {
    width: 30,
    height: 30,
  },
  monthLabelWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  monthLabel: {
    fontSize: typography.lg,
    color: colors.textMain,
  },
  todayButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: colors.butterLight,
    borderWidth: 1,
    borderColor: colors.butter,
  },
  todayText: {
    fontSize: typography.xs,
    color: colors.sageDark,
  },
  dayItem: {
    width: ITEM_WIDTH,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayInner: {
    width: ITEM_WIDTH - 4,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dayItemSelected: {
    borderWidth: 2,
    borderColor: colors.butter,
  },
  dayItemToday: {
    backgroundColor: colors.butterLight,
    borderColor: colors.butter,
  },
  dayItemCopyTarget: {
    borderColor: colors.sage,
    borderWidth: 1,
  },
  dayDate: {
    fontSize: typography.sm,
    lineHeight: 18,
  },
  dayDateToday: {
    fontFamily: fontFamily.bold,
    fontSize: typography.sm,
    lineHeight: 18,
  },
});
