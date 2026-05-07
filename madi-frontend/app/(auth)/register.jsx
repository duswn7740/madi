import { View, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import Text from '@/src/components/Text';
import { colors, spacing, fontSize, radius, fonts } from '@/src/theme';
import { register } from '@/src/api/auth';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!email.trim() || !password.trim() || !nickname.trim()) {
      Alert.alert('알림', '모든 항목을 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      await register(email.trim(), password, nickname.trim());
      Alert.alert('가입 완료', '로그인해주세요.', [
        { text: '확인', onPress: () => router.replace('/(auth)/login') }
      ]);
    } catch (e) {
      Alert.alert('가입 실패', e.response?.data?.error || '다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text bold style={styles.title}>회원가입</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="이메일"
            placeholderTextColor={colors.textSub}
            keyboardType="email-address"
            autoCapitalize="none"
            fontFamily={fonts.regular}
          />
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="비밀번호"
            placeholderTextColor={colors.textSub}
            secureTextEntry
            fontFamily={fonts.regular}
          />
          <TextInput
            style={styles.input}
            value={nickname}
            onChangeText={setNickname}
            placeholder="닉네임"
            placeholderTextColor={colors.textSub}
            fontFamily={fonts.regular}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={colors.textMain} />
              : <Text bold style={styles.buttonText}>가입하기</Text>
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
    fontSize: fontSize.xl,
    color: colors.textMain,
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
    fontSize: fontSize.md,
    color: colors.textMain,
    fontFamily: fonts.regular,
  },
  button: {
    backgroundColor: colors.butter,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  buttonDisabled: {
    backgroundColor: colors.inactive,
  },
  buttonText: {
    fontSize: fontSize.md,
    color: colors.textMain,
  },
  link: {
    fontSize: fontSize.sm,
    color: colors.textSub,
    marginTop: spacing.xs,
  },
});
