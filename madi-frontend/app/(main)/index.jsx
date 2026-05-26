import { View, TouchableOpacity, StyleSheet, TextInput, Image, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useCallback, useRef } from 'react';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { colors, spacing, typography, radius } from '@/src/theme';
import Text from '@/src/components/Text';
import { STICKER_PACKS, DEFAULT_PACK } from '@/src/constants/stickers';
import CalendarStrip from '@/src/components/CalendarStrip';
import AddPracticeModal from '@/src/components/AddPracticeModal';
import EmptyState from '@/src/components/EmptyState';
import ConfirmModal from '@/src/components/ConfirmModal';
import MetronomeModal from '@/src/components/MetronomeModal';
import useMetronome from '@/src/hooks/useMetronome';
import { getPractices, createPractice, updatePractice, deletePractice, copyPractice, reorderPractices } from '@/src/api/practices';
import { incrementSticker, decrementSticker } from '@/src/api/logs';
import { getActivePack } from '@/src/api/packs';
import BannerAdView from '@/src/components/BannerAdView';

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function StickerGrid({ count, practiceId, onCountChange, packId = DEFAULT_PACK, itemIndex = 0 }) {
  const [disabled, setDisabled] = useState(false);
  const pack = STICKER_PACKS[packId] ?? STICKER_PACKS[DEFAULT_PACK];
  const stickerSource = pack[itemIndex % pack.length];
  const scaleAnims = useRef(Array.from({ length: 10 }, () => new Animated.Value(1))).current;
  const prevCountRef = useRef(count);

  useEffect(() => {
    const prev = prevCountRef.current;
    if (count > prev) {
      const idx = count - 1;
      scaleAnims[idx].setValue(1.1);
      Animated.spring(scaleAnims[idx], {
        toValue: 1,
        useNativeDriver: true,
        damping: 8,
        stiffness: 300,
        mass: 0.6,
      }).start();
    }
    prevCountRef.current = count;
  }, [count]);

  async function handleTap(i) {
    if (disabled) return;
    if (i !== count && i !== count - 1) return;

    setDisabled(true);
    const isIncrement = i === count;
    onCountChange(isIncrement ? count + 1 : count - 1);

    try {
      const res = isIncrement
        ? await incrementSticker(practiceId)
        : await decrementSticker(practiceId);
      onCountChange(res.count);
    } catch {
      onCountChange(count);
    } finally {
      setTimeout(() => setDisabled(false), 200);
    }
  }

  return (
    <View style={styles.stickerGrid}>
      {Array.from({ length: 10 }, (_, i) => (
        <TouchableOpacity
          key={i}
          style={styles.stickerSlot}
          onPress={() => handleTap(i)}
          activeOpacity={0.7}
        >
          <Animated.Image
            source={stickerSource}
            style={[styles.stickerImage, i >= count && styles.stickerImageInactive, { transform: [{ scale: scaleAnims[i] }] }]}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

function PracticeItem({ item, itemIndex, packId, onDelete, onStickerChange, onEdit, onCopy, drag }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(item.content);

  function handleEditConfirm() {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== item.content) onEdit(item.id, trimmed);
    setEditing(false);
    setExpanded(false);
  }

  function handleEditCancel() {
    setEditText(item.content);
    setEditing(false);
    setExpanded(false);
  }

  return (
    <View style={styles.practiceItem}>
      <View style={styles.practiceHeader}>
        <TouchableOpacity onLongPress={drag} delayLongPress={150} hitSlop={8}>
          <Ionicons name="menu" size={18} color={colors.textSub} />
        </TouchableOpacity>

        {editing ? (
          <TextInput
            style={styles.editInput}
            value={editText}
            onChangeText={t => setEditText(t.slice(0, 20))}
            autoFocus
            maxLength={20}
            onSubmitEditing={handleEditConfirm}
            returnKeyType="done"
          />
        ) : (
          <Text style={styles.practiceContent} numberOfLines={1}>{item.content}</Text>
        )}

        {editing ? (
          <>
            <TouchableOpacity onPress={handleEditCancel} hitSlop={8}>
              <Ionicons name="close" size={18} color={colors.textSub} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleEditConfirm} hitSlop={8}>
              <Ionicons name="checkmark" size={18} color={colors.sageDark} />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity onPress={() => setExpanded(e => !e)} hitSlop={8}>
              <Ionicons name="ellipsis-horizontal" size={18} color={expanded ? colors.textMain : colors.textSub} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onCopy(item)} hitSlop={8}>
              <Ionicons name="copy-outline" size={16} color={colors.textSub} />
            </TouchableOpacity>
          </>
        )}
      </View>

      {expanded && !editing && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setEditing(true)}>
            <Ionicons name="pencil-outline" size={14} color={colors.textMain} />
            <Text style={styles.actionText}>수정</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => { setExpanded(false); onDelete(item.id); }}
          >
            <Ionicons name="trash-outline" size={14} color={colors.error} />
            <Text style={[styles.actionText, { color: colors.error }]}>삭제</Text>
          </TouchableOpacity>
        </View>
      )}

      <StickerGrid
        count={item.sticker_count}
        practiceId={item.id}
        onCountChange={(count) => onStickerChange(item.id, count)}
        itemIndex={itemIndex}
        packId={packId}
      />
    </View>
  );
}

export default function HomeScreen() {
  const [practices, setPractices] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activePack, setActivePack] = useState(DEFAULT_PACK);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [metronomeVisible, setMetronomeVisible] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ visible: false, id: null });
  const [copyItem, setCopyItem] = useState(null);
  const [dupConfirm, setDupConfirm] = useState({ visible: false, dateStr: null });
  const [toast, setToast] = useState(null);
  const metronome = useMetronome();

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
    getActivePack(selectedDate).then(res => {
      if (res?.packId) setActivePack(res.packId);
    }).catch(() => {});
  }, [selectedDate]);

  async function handleSave(content) {
    try {
      await createPractice(selectedDate, content);
      loadPractices(selectedDate);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleEdit(id, content) {
    try {
      await updatePractice(id, content);
      setPractices(prev => prev.map(p => p.id === id ? { ...p, content } : p));
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

  async function handleDragEnd({ data }) {
    if (!data || data.length !== practices.length) return;
    setPractices(data);
    try {
      await reorderPractices(data.map((p, i) => ({ id: p.id, order_index: i })));
    } catch {
      loadPractices(selectedDate);
    }
  }

  function handleCopyPress(item) {
    setCopyItem(item);
  }

  async function handleCopyDate(date) {
    if (!copyItem) return;
    const dateStr = formatDate(date);
    try {
      const targetPractices = await getPractices(date);
      const isDup = targetPractices.some(p => p.content === copyItem.content);
      if (isDup) {
        setDupConfirm({ visible: true, dateStr });
      } else {
        await performCopy(dateStr);
      }
    } catch (e) {
      console.error(e);
      setCopyItem(null);
    }
  }

  function showToast(msg, success = true) {
    setToast({ msg, success });
    setTimeout(() => setToast(null), 1500);
  }

  async function performCopy(dateStr) {
    try {
      await copyPractice(copyItem.id, dateStr);
      if (dateStr === formatDate(selectedDate)) loadPractices(selectedDate);
      showToast('복사 완료!', true);
    } catch (e) {
      console.error(e);
      showToast('복사 실패', false);
    } finally {
      setCopyItem(null);
      setDupConfirm({ visible: false, dateStr: null });
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <CalendarStrip
        practiceDates={practices.map(p => p.date)}
        onDateChange={(date) => setSelectedDate(date)}
        onMetronomePress={() => setMetronomeVisible(true)}
        onTunerPress={() => {}}
        copyMode={!!copyItem}
        onCopyDate={handleCopyDate}
      />

      <View style={styles.list}>
        {!!toast && (
          <View style={[styles.toast, !toast.success && styles.toastFail]}>
            <Text style={styles.toastText}>{toast.msg}</Text>
          </View>
        )}
        {copyItem && (
          <View style={styles.copyBanner}>
            <Text style={styles.copyBannerText} numberOfLines={1}>📋 {copyItem.content} — 붙여넣을 날짜를 선택하세요</Text>
            <TouchableOpacity onPress={() => setCopyItem(null)} hitSlop={8}>
              <Ionicons name="close" size={16} color={colors.white} />
            </TouchableOpacity>
          </View>
        )}
      <DraggableFlatList
        data={practices}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item, drag, isActive, getIndex }) => (
          <ScaleDecorator>
            <PracticeItem
              item={item}
              itemIndex={getIndex()}
              packId={activePack}
              onDelete={handleDeletePress}
              onStickerChange={handleStickerChange}
              onEdit={handleEdit}
              onCopy={handleCopyPress}
              drag={drag}
            />
          </ScaleDecorator>
        )}
        onDragEnd={handleDragEnd}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <EmptyState
            image={require('@/assets/icons/madi-icon.png')}
            message="아직 연습이 없어요"
            sub="첫 연습을 추가해볼까요?"
          />
        }
      />
      </View>

      <TouchableOpacity style={styles.addButton} onPress={() => setAddModalVisible(true)}>
        <Ionicons name="add" size={20} color={colors.textMain} />
        <Text style={styles.addButtonText}>연습 추가</Text>
      </TouchableOpacity>

      <AddPracticeModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
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

      <ConfirmModal
        visible={dupConfirm.visible}
        title="중복 연습"
        message={`이미 같은 연습이 있어요.\n그래도 추가할까요?`}
        confirmText="추가"
        cancelText="취소"
        onConfirm={() => performCopy(dupConfirm.dateStr)}
        onCancel={() => { setDupConfirm({ visible: false, dateStr: null }); setCopyItem(null); }}
      />

      <MetronomeModal
        visible={metronomeVisible}
        onClose={() => setMetronomeVisible(false)}
        {...metronome}
      />

      <BannerAdView />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    flex: 1,
    position: 'relative',
  },
  listContent: {
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
  editInput: {
    flex: 1,
    fontSize: typography.md,
    color: colors.textMain,
    borderBottomWidth: 1,
    borderBottomColor: colors.butter,
    paddingVertical: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deleteBtn: {
    borderColor: colors.error,
    backgroundColor: colors.background,
  },
  actionText: {
    fontSize: typography.sm,
    color: colors.textMain,
  },
  stickerGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stickerSlot: {
    flex: 1,
    aspectRatio: 1,
    marginHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  stickerImageInactive: {
    opacity: 0.15,
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
  toast: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    top: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.sageDark,
    borderRadius: radius.md,
    zIndex: 200,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  toastFail: {
    backgroundColor: colors.textSub,
  },
  toastText: {
    fontSize: typography.xs,
    color: colors.white,
  },
  copyBanner: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    top: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.sageDark,
    borderRadius: radius.md,
    zIndex: 100,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  copyBannerText: {
    flex: 1,
    fontSize: typography.xs,
    color: colors.white,
  },
});
