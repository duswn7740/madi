import { View, Modal, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import Text from '@/src/components/Text';
import { useState } from 'react';
import { colors, spacing, typography, radius } from '@/src/theme';

const MAX_LENGTH = 20;

// 임시 더미 템플릿
const DUMMY_TEMPLATES = ['하농 39번', '쇼팽 10-4 우손', '체르니 30번', '바이엘 상권'];

export default function AddPracticeModal({ visible, onClose, onSave }) {
  const [content, setContent] = useState('');

  function handleSave() {
    if (!content.trim()) return;
    onSave(content.trim());
    setContent('');
    onClose();
  }

  function handleClose() {
    setContent('');
    onClose();
  }

  function handleChip(template) {
    setContent(template);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={styles.sheet}>
              <Text style={styles.title}>연습 추가</Text>

              {/* 입력창 */}
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={content}
                  onChangeText={(t) => setContent(t.slice(0, MAX_LENGTH))}
                  placeholder="연습 내용을 입력하세요"
                  placeholderTextColor={colors.textSub}
                  autoFocus
                  maxLength={MAX_LENGTH}
                />
                <Text style={[styles.counter, content.length >= MAX_LENGTH && styles.counterMax]}>
                  {content.length}/{MAX_LENGTH}
                </Text>
              </View>

              {/* 최근 연습 칩 */}
              {DUMMY_TEMPLATES.length > 0 && (
                <View style={styles.chipBox}>
                  <Text style={styles.chipTitle}>최근 연습</Text>
                  <ScrollView showsVerticalScrollIndicator={false} style={styles.chipScroll}>
                    {DUMMY_TEMPLATES.map((t, i) => (
                      <TouchableOpacity key={i} style={styles.chip} onPress={() => handleChip(t)}>
                        <Text style={styles.chipText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* 버튼 */}
              <View style={styles.buttons}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                  <Text style={styles.cancelText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, !content.trim() && styles.saveButtonDisabled]}
                  onPress={handleSave}
                  disabled={!content.trim()}
                >
                  <Text style={styles.saveText}>추가</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    width: 320,
    gap: spacing.md,
  },
  title: {
    typography: typography.lg,
    fontWeight: '700',
    color: colors.textMain,
    textAlign: 'center',
  },
  inputWrapper: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    typography: typography.md,
    color: colors.textMain,
  },
  counter: {
    typography: typography.xs,
    color: colors.textSub,
  },
  counterMax: {
    color: colors.error,
  },
  chipBox: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  chipTitle: {
    typography: typography.xs,
    color: colors.textSub,
    marginBottom: spacing.xs,
  },
  chipScroll: {
    maxHeight: 140,
  },
  chip: {
    backgroundColor: colors.butterLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.butter,
  },
  chipText: {
    typography: typography.sm,
    color: colors.textMain,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelText: {
    typography: typography.sm,
    color: colors.textSub,
  },
  saveButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.butter,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: colors.inactive,
  },
  saveText: {
    typography: typography.sm,
    fontWeight: '700',
    color: colors.textMain,
  },
});
