import { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Text from '@/src/components/Text';
import Header from '@/src/components/Header';
import { colors, typography, fontFamily, spacing, radius } from '@/src/theme';
import { getPracticeDates } from '@/src/api/practices';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CELL_WIDTH = SCREEN_WIDTH / 7;
const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function buildMonthGrid(year, month) {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: firstWeekday }, () => null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  return cells;
}

export default function CalendarScreen() {
  const [viewDate, setViewDate] = useState(new Date());
  const [practiceDates, setPracticeDates] = useState([]);
  const today = new Date();

  useEffect(() => {
    getPracticeDates().then(setPracticeDates).catch(() => {});
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const cells = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const isViewingCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  function goPrevMonth() {
    setViewDate(new Date(year, month - 1, 1));
  }
  function goNextMonth() {
    setViewDate(new Date(year, month + 1, 1));
  }
  function goToday() {
    setViewDate(new Date());
  }

  function hasPractice(d) {
    return practiceDates.some(pd => isSameDay(new Date(pd), d));
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="달력" />

      <View style={styles.header}>
        <TouchableOpacity onPress={goPrevMonth} style={styles.arrowButton} hitSlop={8}>
          <Text style={styles.arrow}>{'‹'}</Text>
        </TouchableOpacity>

        <View style={styles.monthLabelWrapper} pointerEvents="none">
          <Text bold style={styles.monthLabel}>{`${year}년 ${month + 1}월`}</Text>
        </View>

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          style={[styles.todayButton, isViewingCurrentMonth && { opacity: 0 }]}
          onPress={goToday}
          disabled={isViewingCurrentMonth}
        >
          <Text style={styles.todayText}>오늘</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={goNextMonth} style={styles.arrowButton} hitSlop={8}>
          <Text style={styles.arrow}>{'›'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.weekRow}>
        {dayLabels.map(label => (
          <View key={label} style={styles.weekCell}>
            <Text style={styles.weekLabel}>{label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((d, i) => {
          if (!d) return <View key={i} style={styles.dayCell} />;
          const isToday = isSameDay(d, today);
          const practiced = hasPractice(d);
          return (
            <View key={i} style={styles.dayCell}>
              <View style={[
                styles.dayCircle,
                practiced && styles.dayCirclePracticed,
                isToday && styles.dayCircleToday,
              ]}>
                <Text style={[styles.dayNumber, practiced && styles.dayNumberPracticed]}>
                  {d.getDate()}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  weekRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  weekCell: {
    width: CELL_WIDTH,
    alignItems: 'center',
    paddingBottom: spacing.xs,
  },
  weekLabel: {
    fontSize: typography.md,
    fontFamily: fontFamily.bold,
    color: colors.textSub,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: CELL_WIDTH,
    height: CELL_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: CELL_WIDTH - 16,
    height: CELL_WIDTH - 16,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dayCirclePracticed: {
    backgroundColor: colors.sage,
  },
  dayCircleToday: {
    borderColor: colors.butter,
  },
  dayNumber: {
    fontSize: typography.sm,
    color: colors.textMain,
  },
  dayNumberPracticed: {
    fontFamily: fontFamily.bold,
    color: colors.textOnPoint,
  },
});
