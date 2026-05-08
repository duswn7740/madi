import { View, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { colors, spacing, typography, radius } from '@/src/theme';
import Text from '@/src/components/Text';
import CalendarStrip from '@/src/components/CalendarStrip';
import AddPracticeModal from '@/src/components/AddPracticeModal';
import EmptyState from '@/src/components/EmptyState';

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
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [metronomeVisible, setMetronomeVisible] = useState(false);
  const [tunerVisible, setTunerVisible] = useState(false);

  function handleSave(content) {
    console.log('추가:', content);
    // 나중에 API 연결
  }

  return (
    <SafeAreaView style={styles.container}>
      <CalendarStrip
        onDateChange={setSelectedDate}
        onMetronomePress={() => setMetronomeVisible(true)}
        onTunerPress={() => setTunerVisible(true)}
      />

      <FlatList
        data={[]}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <PracticeItem item={item} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<EmptyState image={require('@/assets/icons/madi-icon.png')} message="아직 연습이 없어요" sub="첫 연습을 추가해볼까요?" />}
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
    fontSize: typography.md,
    color: colors.textMain,
    fontWeight: '500',
  },
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
    fontSize: typography.sm,
    color: colors.textMain,
    fontWeight: '600',
  },
  bannerAd: {
    height: 46,
    backgroundColor: colors.inactive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerAdText: {
    fontSize: typography.xs,
    color: colors.textSub,
  },
});
