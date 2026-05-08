import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, typography, fontFamily, spacing } from '@/src/theme';
import Input from '@/src/components/Input';
import Button from '@/src/components/Button';
import Header from '@/src/components/Header';
import client from '@/src/api/client';
import ConfirmModal from '@/src/components/ConfirmModal';

export default function SignupScreen() {
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const validate = () => {
    const newErrors = {};

    if (!nickname.trim()) {
      newErrors.nickname = '닉네임을 입력해줘요.';
    }
    if (!email.trim()) {
      newErrors.email = '이메일을 입력해줘요.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = '올바른 이메일 형식이 아니에요.';
    }
    if (!password) {
      newErrors.password = '비밀번호를 입력해줘요.';
    } else if (password.length < 8) {
      newErrors.password = '비밀번호는 8자 이상이어야 해요.';
    }
    if (password !== passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호가 일치하지 않아요.';
    }

    return newErrors;
  };

  const handleSignup = async () => {
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setServerError('');
    setLoading(true);

    try {
      const { data } = await client.post('/users/register', {
        nickname: nickname.trim(),
        email: email.trim(),
        password,
      });
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('nickname', data.nickname);
      router.replace('/(main)');
    } catch (err) {
      setServerError(err.response?.data?.error ?? '회원가입에 실패했어요. 다시 시도해줘요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="회원가입"
        onBack={() => {
          if (nickname || email || password) {
            setModalVisible(true);
          } else {
            router.back();
          }
        }}
      />

      <ConfirmModal
        visible={modalVisible}
        title="회원가입 중"
        message="뒤로가면 입력한 내용이 사라져요!"
        confirmText="나가기"
        cancelText="취소"
        onConfirm={() => router.back()}
        onCancel={() => setModalVisible(false)}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.form}>
            <Input
              label="닉네임"
              value={nickname}
              onChangeText={setNickname}
              placeholder="닉네임을 입력해줘요"
              maxLength={20}
              error={errors.nickname}
            />
            <Input
              label="이메일"
              value={email}
              onChangeText={setEmail}
              placeholder="madi@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
            />
            <Input
              label="비밀번호"
              value={password}
              onChangeText={setPassword}
              placeholder="8자 이상 입력해줘요"
              secureTextEntry
              error={errors.password}
            />
            <Input
              label="비밀번호 확인"
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
              placeholder="비밀번호를 한 번 더 입력해줘요"
              secureTextEntry
              error={errors.passwordConfirm}
            />

            {serverError ? <Text style={styles.errorText}>{serverError}</Text> : null}

            <Button
              label="시작하기"
              onPress={handleSignup}
              loading={loading}
              style={styles.signupButton}
            />
          </View>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>이미 계정이 있어요?</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.loginLink}>로그인</Text>
            </TouchableOpacity>
          </View>
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
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.xl,
  },
  form: {
    gap: spacing.md,
  },
  signupButton: {
    marginTop: spacing.sm,
  },
  errorText: {
    fontSize: typography.sm,
    fontFamily: fontFamily.regular,
    color: colors.error,
    textAlign: 'center',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  loginText: {
    fontSize: typography.sm,
    fontFamily: fontFamily.regular,
    color: colors.textSub,
  },
  loginLink: {
    fontSize: typography.sm,
    fontFamily: fontFamily.bold,
    color: colors.butterDark,
  },
});
