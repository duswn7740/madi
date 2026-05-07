import { View, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import Text from '@/src/components/Text';
import { colors, spacing, fontSize, radius, fonts } from '@/src/theme';
import { login } from '@/src/api/auth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('알림', '이메일과 비밀번호를 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/(main)');
    } catch (e) {
      Alert.alert('로그인 실패', e.response?.data?.error || '다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text bold style={styles.title}>마디</Text>
        <Text style={styles.subtitle}>연습 노트, 메트로놈</Text>

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

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={colors.textMain} />
              : <Text bold style={styles.loginButtonText}>로그인</Text>
            }
          </TouchableOpacity>
        </View>

        <View style={styles.links}>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.link}>회원가입</Text>
          </TouchableOpacity>
          <Text style={styles.linkDivider}>|</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
            <Text style={styles.link}>비밀번호 찾기</Text>
          </TouchableOpacity>
        </View>
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
    fontSize: fontSize.xxl,
    color: colors.textMain,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSub,
    marginBottom: spacing.sm,
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
  loginButton: {
    backgroundColor: colors.butter,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  buttonDisabled: {
    backgroundColor: colors.inactive,
  },
  loginButtonText: {
    fontSize: fontSize.md,
    color: colors.textMain,
  },
  links: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  link: {
    fontSize: fontSize.sm,
    color: colors.textSub,
  },
  linkDivider: {
    fontSize: fontSize.sm,
    color: colors.inactive,
  },
});
