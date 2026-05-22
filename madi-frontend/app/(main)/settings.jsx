import { useState, useEffect } from 'react';
import {
  View, TouchableOpacity, SafeAreaView,
  StyleSheet, Modal, KeyboardAvoidingView, Platform, ScrollView, Linking,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ConfirmModal from '@/src/components/ConfirmModal';
import { colors, typography, fontFamily, spacing, radius } from '@/src/theme';
import Header from '@/src/components/Header';
import Input from '@/src/components/Input';
import Button from '@/src/components/Button';
import Text from '@/src/components/Text';
import PolicyModal from '@/src/components/PolicyModal';
import client from '@/src/api/client';

function SettingRow({ label, onPress, danger = false }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
      <Text style={styles.rowArrow}>{'>'}</Text>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const [nickname, setNickname] = useState('');
  const [nicknameInput, setNicknameInput] = useState('');
  const [nicknameModal, setNicknameModal] = useState(false);
  const [nicknameError, setNicknameError] = useState('');
  const [loading, setLoading] = useState(false);
  const [policyType, setPolicyType] = useState(null);
  const [pwModal, setPwModal] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ visible: false, title: '', message: '', confirmText: '', onConfirm: null });
  const [alertModal, setAlertModal] = useState({ visible: false, title: '', message: '' });

  useEffect(() => {
    AsyncStorage.getItem('nickname').then(n => { if (n) setNickname(n); });
  }, []);

  const showConfirm = (title, message, confirmText, onConfirm) =>
    setConfirmModal({ visible: true, title, message, confirmText, onConfirm });
  const showAlert = (title, message) => setAlertModal({ visible: true, title, message });

  const handleLogout = () => {
    showConfirm('로그아웃', '정말 로그아웃할까요?', '로그아웃', async () => {
      setConfirmModal(m => ({ ...m, visible: false }));
      await AsyncStorage.multiRemove(['token', 'nickname']);
      router.replace('/(auth)/login');
    });
  };

  const openNicknameModal = () => {
    setNicknameInput(nickname);
    setNicknameError('');
    setNicknameModal(true);
  };

  const openPwModal = () => {
    setCurrentPw(''); setNewPw(''); setPwError('');
    setPwModal(true);
  };

  const handlePwSubmit = async () => {
    if (!currentPw || !newPw) { setPwError('모두 입력해주세요.'); return; }
    if (newPw.length < 8) { setPwError('새 비밀번호는 8자 이상이어야 해요.'); return; }
    setPwLoading(true);
    try {
      await client.patch('/api/users/password', { currentPassword: currentPw, newPassword: newPw });
      setPwModal(false);
      showAlert('완료', '비밀번호가 변경되었어요.');
    } catch (err) {
      setPwError(err.response?.data?.error ?? '변경에 실패했어요.');
    } finally {
      setPwLoading(false);
    }
  };

  const handleNicknameSubmit = async () => {
    if (!nicknameInput.trim()) { setNicknameError('닉네임을 입력해줘요.'); return; }
    setLoading(true);
    try {
      await client.patch('/api/users/me', { nickname: nicknameInput.trim() });
      await AsyncStorage.setItem('nickname', nicknameInput.trim());
      setNickname(nicknameInput.trim());
      setNicknameModal(false);
    } catch (err) {
      setNicknameError(err.response?.data?.error ?? '변경에 실패했어요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="설정" />
      <ScrollView>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>계정</Text>
          <View style={styles.card}>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>닉네임</Text>
              <Text style={styles.profileValue}>{nickname}</Text>
            </View>
            <View style={styles.divider} />
            <SettingRow label="닉네임 변경" onPress={openNicknameModal} />
            <View style={styles.divider} />
            <SettingRow label="비밀번호 변경" onPress={openPwModal} />
            <View style={styles.divider} />
            <SettingRow label="로그아웃" onPress={handleLogout} danger />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>정보</Text>
          <View style={styles.card}>
            <SettingRow label="이용약관" onPress={() => setPolicyType('terms')} />
            <View style={styles.divider} />
            <SettingRow label="개인정보처리방침" onPress={() => setPolicyType('privacy')} />
            <View style={styles.divider} />
            <SettingRow label="문의하기" onPress={() => Linking.openURL('mailto:hellorollinpebbles@gmail.com?subject=마디 문의')} />
          </View>
        </View>

        <Text style={styles.version}>마디 v1.0.0</Text>

        <TouchableOpacity
          style={styles.withdrawBtn}
          onPress={() => {
            showConfirm('회원탈퇴', '정말 탈퇴할까요?\n모든 기록이 삭제됩니다.', '탈퇴', async () => {
              setConfirmModal(m => ({ ...m, visible: false }));
              try {
                await client.delete('/api/users/me');
                await AsyncStorage.multiRemove(['token', 'nickname']);
                router.replace('/(auth)/login');
              } catch {
                showAlert('오류', '탈퇴에 실패했어요. 다시 시도해줘요.');
              }
            });
          }}
        >
          <Text style={styles.withdrawText}>회원탈퇴</Text>
        </TouchableOpacity>
      </ScrollView>

      <PolicyModal visible={policyType !== null} type={policyType} onClose={() => setPolicyType(null)} />
      <ConfirmModal
        visible={confirmModal.visible}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText="취소"
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(m => ({ ...m, visible: false }))}
      />
      <ConfirmModal
        visible={alertModal.visible}
        title={alertModal.title}
        message={alertModal.message}
        confirmText="확인"
        onConfirm={() => setAlertModal(m => ({ ...m, visible: false }))}
      />

      <Modal visible={pwModal} transparent animationType="fade" onRequestClose={() => setPwModal(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>비밀번호 변경</Text>
            <Input value={currentPw} onChangeText={setCurrentPw} placeholder="현재 비밀번호" secureTextEntry autoFocus />
            <Input value={newPw} onChangeText={setNewPw} placeholder="새 비밀번호 (8자 이상)" secureTextEntry />
            {pwError ? <Text style={styles.modalError}>{pwError}</Text> : null}
            <View style={styles.modalButtons}>
              <Button label="취소" variant="ghost" onPress={() => setPwModal(false)} style={styles.modalBtn} />
              <Button label="변경" onPress={handlePwSubmit} loading={pwLoading} style={styles.modalBtn} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={nicknameModal} transparent animationType="fade" onRequestClose={() => setNicknameModal(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>닉네임 변경</Text>
            <Input
              value={nicknameInput}
              onChangeText={setNicknameInput}
              placeholder="새 닉네임을 입력해줘요"
              maxLength={20}
              error={nicknameError}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <Button label="취소" variant="ghost" onPress={() => setNicknameModal(false)} style={styles.modalBtn} />
              <Button label="변경" onPress={handleNicknameSubmit} loading={loading} style={styles.modalBtn} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // 섹션
  section: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.xs,
    fontFamily: fontFamily.bold,
    color: colors.textSub,
    paddingHorizontal: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
  },

  // 프로필
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  profileLabel: {
    fontSize: typography.md,
    fontFamily: fontFamily.regular,
    color: colors.textSub,
  },
  profileValue: {
    fontSize: typography.md,
    fontFamily: fontFamily.bold,
    color: colors.textMain,
  },

  // 설정 행
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  rowLabel: {
    fontSize: typography.md,
    fontFamily: fontFamily.regular,
    color: colors.textMain,
  },
  rowLabelDanger: {
    color: colors.error,
  },
  rowArrow: {
    fontSize: typography.sm,
    fontFamily: fontFamily.regular,
    color: colors.textSub,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },

  // 버전 / 탈퇴
  version: {
    textAlign: 'center',
    fontSize: typography.xs,
    fontFamily: fontFamily.regular,
    color: colors.textSub,
    marginTop: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  withdrawBtn: {
    alignItems: 'center',
    paddingBottom: spacing.xl,
    marginBottom: 10,
  },
  withdrawText: {
    fontSize: typography.sm,
    fontFamily: fontFamily.regular,
    color: colors.textSub,
    opacity: 0.5,
  },

  // 모달
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalTitle: {
    fontSize: typography.lg,
    fontFamily: fontFamily.bold,
    color: colors.textMain,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modalBtn: {
    flex: 1,
  },
  modalError: {
    fontSize: typography.sm,
    fontFamily: fontFamily.regular,
    color: colors.error,
    textAlign: 'center',
  },
});
