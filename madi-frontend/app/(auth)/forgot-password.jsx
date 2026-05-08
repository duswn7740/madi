import { View, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import Text from '@/src/components/Text';
import { colors, spacing, typography, radius, fontFamily } from '@/src/theme';
import { forgotPassword } from '@/src/api/auth';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!email.trim()) {
      Alert.alert('알림', '이메일을 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      Alert.alert('전송 완료', '비밀번호 재설정 링크를 이메일로 보냈어요.', [
        { text: '확인', onPress: () => router.back() }
      ]);
    } catch (e) {
      Alert.alert('실패', e.response?.data?.error || '다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text bold style={styles.title}>비밀번호 찾기</Text>
        <Text style={styles.desc}>가입한 이메일로 재설정 링크를 보내드려요.</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="이메일"
            placeholderTextColor={colors.textSub}
            keyboardType="email-address"
            autoCapitalize="none"
            fontFamily={fontFamily.regular}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSend}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={colors.textMain} />
              : <Text bold style={styles.buttonText}>링크 전송</Text>
            }
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>로그인으로 돌아가기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xxl,
    width: '85%',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: typography.xl,
    color: colors.textMain,
  },
  desc: {
    fontSize: typography.sm,
    color: colors.textSub,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  form: {
    width: '100%',
    gap: spacing.sm,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.md,
    color: colors.textMain,
    fontFamily: fontFamily.regular,
  },
  button: {
    backgroundColor: colors.butter,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: colors.inactive,
  },
  buttonText: {
    fontSize: typography.md,
    color: colors.textMain,
  },
  link: {
    fontSize: typography.sm,
    color: colors.textSub,
    marginTop: spacing.xs,
  },
});
