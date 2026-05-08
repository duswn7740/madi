import { View, SafeAreaView, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import Text from '@/src/components/Text';
import Input from '@/src/components/Input';
import Button from '@/src/components/Button';
import { colors, spacing, typography, fontFamily } from '@/src/theme';
import { login } from '@/src/api/auth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError('이메일과 비밀번호를 입력해줘요.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/(main)');
    } catch (e) {
      setError(e.response?.data?.error || '로그인에 실패했어요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoArea}>
            <Text bold style={styles.appName}>마디</Text>
            <Text style={styles.appSub}>연습 노트, 메트로놈</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="이메일"
              value={email}
              onChangeText={setEmail}
              placeholder="madi@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Input
              label="비밀번호"
              value={password}
              onChangeText={setPassword}
              placeholder="비밀번호를 입력해줘요"
              secureTextEntry
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Button label="로그인" onPress={handleLogin} loading={loading} style={styles.loginButton} />
          </View>

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>아직 계정이 없어요?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
              <Text bold style={styles.signupLink}>회원가입</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} style={styles.forgotRow}>
            <Text style={styles.forgotText}>비밀번호를 잊으셨나요?</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    gap: spacing.xl,
  },
  logoArea: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  appName: {
    fontSize: 32,
    color: colors.textMain,
  },
  appSub: {
    fontSize: typography.sm,
    color: colors.textSub,
  },
  form: {
    gap: spacing.md,
  },
  loginButton: {
    marginTop: spacing.sm,
  },
  errorText: {
    fontSize: typography.sm,
    color: colors.error,
    textAlign: 'center',
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  signupText: {
    fontSize: typography.sm,
    color: colors.textSub,
  },
  signupLink: {
    fontSize: typography.sm,
    color: colors.sageDark,
  },
  forgotRow: {
    alignItems: 'center',
  },
  forgotText: {
    fontSize: typography.sm,
    color: colors.textSub,
    textDecorationLine: 'underline',
  },
});
