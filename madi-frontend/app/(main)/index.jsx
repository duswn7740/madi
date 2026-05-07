import { View, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import Text from '@/src/components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { colors, spacing, fontSize, radius } from '@/src/theme';
import AddPracticeModal from '@/src/components/AddPracticeModal';

const DUMMY_PRACTICES = [
  { id: 1, content: '하농 39번', sticker_count: 7 },
  { id: 2, content: '쇼팽 10-4 우손', sticker_count: 3 },
  { id: 3, content: '체르니 30번', sticker_count: 10 },
];

// 임시 더미 - 연습 있는 날짜
const DUMMY_HAS_PRACTICE = [1, 3, 5];

function CalendarStrip() {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - 3 + i);
    return d;
  });

  const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];

  function getDayColor(index, hasPractice) {
    if (index === 3) return colors.sageDark;
    if (index < 3) return hasPractice ? colors.sageDark : colors.textSub;
    return hasPractice ? colors.butterDark : colors.textSub;
  }

  return (
    <View style={styles.calendarWrapper}>
      <View style={styles.calendarStrip}>
        <TouchableOpacity style={styles.calendarArrow}>
          <Ionicons name="chevron-back" size={16} color={colors.textSub} />
        </TouchableOpacity>

        {days.map((d, i) => {
          const isToday = i === 3;
          const hasPractice = DUMMY_HAS_PRACTICE.includes(i);
          const textColor = getDayColor(i, hasPractice);

          return (
            <TouchableOpacity
              key={i}
              style={[styles.dayItem, isToday && styles.dayItemToday]}
            >
              <Text style={[styles.dayDate, { color: textColor }, isToday && styles.dayDateToday]}>
                {dayLabels[d.getDay()]}
              </Text>
              <Text style={[styles.dayDate, { color: textColor }, isToday && styles.dayDateToday]}>
                {`${d.getMonth() + 1}/${d.getDate()}`}
              </Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity style={styles.calendarArrow}>
          <Ionicons name="chevron-forward" size={16} color={colors.textSub} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function StickerGrid({ count }) {
  return (
    <View style={styles.stickerGrid}>
      {Array.from({ length: 10 }, (_, i) => (
        <View
          key={i}
          style={[styles.stickerSlot, i < count ? styles.stickerActive : styles.stickerInactive]}
        />
      ))}
    </View>
  );
}

function PracticeItem({ item }) {
  return (
    <View style={styles.practiceItem}>
      <View style={styles.practiceHeader}>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={18} color={colors.textSub} />
        </TouchableOpacity>
        <Text style={styles.practiceContent} numberOfLines={1}>{item.content}</Text>
        <TouchableOpacity>
          <Ionicons name="copy-outline" size={16} color={colors.textSub} />
        </TouchableOpacity>
      </View>
      <StickerGrid count={item.sticker_count} />
    </View>
  );
}

export default function HomeScreen() {
  const [modalVisible, setModalVisible] = useState(false);

  function handleSave(content) {
    console.log('추가:', content);
    // 나중에 API 연결
  }

  return (
    <SafeAreaView style={styles.container}>
      <CalendarStrip />

      <FlatList
        data={DUMMY_PRACTICES}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <PracticeItem item={item} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={20} color={colors.textMain} />
        <Text style={styles.addButtonText}>연습 추가</Text>
      </TouchableOpacity>

      <AddPracticeModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
      />

      <View style={styles.bannerAd}>
        <Text style={styles.bannerAdText}>광고 영역</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // 달력
  calendarWrapper: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: spacing.xs,
  },
  monthLabel: {
    fontSize: fontSize.xs,
    color: colors.textSub,
    textAlign: 'center',
    marginBottom: 2,
  },
  calendarStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  calendarArrow: {
    paddingHorizontal: spacing.sm,
  },
  dayItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  dayItemToday: {
    backgroundColor: colors.butterLight,
    borderWidth: 1,
    borderColor: colors.butter,
  },
  dayDate: {
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  dayDateToday: {
    fontWeight: '700',
  },

  // 연습 목록
  list: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  separator: {
    height: spacing.sm,
  },
  practiceItem: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  practiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  practiceContent: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.textMain,
    fontWeight: '500',
  },

  // 스티커
  stickerGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stickerSlot: {
    flex: 1,
    aspectRatio: 1,
    marginHorizontal: 2,
    borderRadius: 4,
  },
  stickerActive: {
    backgroundColor: colors.sage,
  },
  stickerInactive: {
    backgroundColor: colors.inactive,
  },

  // 연습 추가 버튼
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    margin: spacing.md,
    marginTop: 0,
    paddingVertical: spacing.sm,
    backgroundColor: colors.butter,
    borderRadius: radius.md,
  },
  addButtonText: {
    fontSize: fontSize.sm,
    color: colors.textMain,
    fontWeight: '600',
  },

  // 배너 광고
  bannerAd: {
    height: 46,
    backgroundColor: colors.inactive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerAdText: {
    fontSize: fontSize.xs,
    color: colors.textSub,
  },
});
