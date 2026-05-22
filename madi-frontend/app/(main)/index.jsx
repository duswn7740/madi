import { View, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useCallback } from 'react';
import { colors, spacing, typography, radius } from '@/src/theme';
import Text from '@/src/components/Text';
import CalendarStrip from '@/src/components/CalendarStrip';
import AddPracticeModal from '@/src/components/AddPracticeModal';
import EmptyState from '@/src/components/EmptyState';
import ConfirmModal from '@/src/components/ConfirmModal';
import { getPractices, createPractice, deletePractice } from '@/src/api/practices';
import { incrementSticker, decrementSticker } from '@/src/api/logs';

function StickerGrid({ count, practiceId, onCountChange }) {
  const [disabled, setDisabled] = useState(false);

  async function handleTap(i) {
    if (disabled) return;
    if (i !== count && i !== count - 1) return;

    setDisabled(true);
    const isIncrement = i === count;
    onCountChange(isIncrement ? count + 1 : count - 1); // 낙관적 업데이트

    try {
      const res = isIncrement
        ? await incrementSticker(practiceId)
        : await decrementSticker(practiceId);
      onCountChange(res.count); // 서버 응답으로 보정
    } catch {
      onCountChange(count); // 실패 시 롤백
    } finally {
      setTimeout(() => setDisabled(false), 200);
    }
  }

  return (
    <View style={styles.stickerGrid}>
      {Array.from({ length: 10 }, (_, i) => (
        <TouchableOpacity
          key={i}
          style={[styles.stickerSlot, i < count ? styles.stickerActive : styles.stickerInactive]}
          onPress={() => handleTap(i)}
          activeOpacity={0.7}
        />
      ))}
    </View>
  );
}

function PracticeItem({ item, onDelete, onStickerChange }) {
  return (
    <View style={styles.practiceItem}>
      <View style={styles.practiceHeader}>
        <TouchableOpacity onPress={() => onDelete(item.id)}>
          <Ionicons name="ellipsis-horizontal" size={18} color={colors.textSub} />
        </TouchableOpacity>
        <Text style={styles.practiceContent} numberOfLines={1}>{item.content}</Text>
        <TouchableOpacity>
          <Ionicons name="copy-outline" size={16} color={colors.textSub} />
        </TouchableOpacity>
      </View>
      <StickerGrid
        count={item.sticker_count}
        practiceId={item.id}
        onCountChange={(count) => onStickerChange(item.id, count)}
      />
    </View>
  );
}

export default function HomeScreen() {
  const [practices, setPractices] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [metronomeVisible, setMetronomeVisible] = useState(false);
  const [tunerVisible, setTunerVisible] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ visible: false, id: null });

  const loadPractices = useCallback(async (date) => {
    try {
      const data = await getPractices(date);
      setPractices(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadPractices(selectedDate);
  }, [selectedDate]);

  async function handleSave(content) {
    try {
      await createPractice(selectedDate, content);
      loadPractices(selectedDate);
    } catch (e) {
      console.error(e);
    }
  }

  function handleDeletePress(id) {
    setDeleteConfirm({ visible: true, id });
  }

  async function handleDeleteConfirm() {
    try {
      await deletePractice(deleteConfirm.id);
      setPractices(prev => prev.filter(p => p.id !== deleteConfirm.id));
    } catch (e) {
      console.error(e);
    } finally {
      setDeleteConfirm({ visible: false, id: null });
    }
  }

  function handleStickerChange(practiceId, count) {
    setPractices(prev =>
      prev.map(p => p.id === practiceId ? { ...p, sticker_count: count } : p)
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CalendarStrip
        onDateChange={(date) => setSelectedDate(date)}
        onMetronomePress={() => setMetronomeVisible(true)}
        onTunerPress={() => setTunerVisible(true)}
      />

      <FlatList
        data={practices}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <PracticeItem
            item={item}
            onDelete={handleDeletePress}
            onStickerChange={handleStickerChange}
          />
        )}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <EmptyState
            image={require('@/assets/icons/madi-icon.png')}
            message="아직 연습이 없어요"
            sub="첫 연습을 추가해볼까요?"
          />
        }
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

      <ConfirmModal
        visible={deleteConfirm.visible}
        title="연습 삭제"
        message="이 연습을 삭제할까요?"
        confirmText="삭제"
        cancelText="취소"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm({ visible: false, id: null })}
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
    flexGrow: 1,
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
