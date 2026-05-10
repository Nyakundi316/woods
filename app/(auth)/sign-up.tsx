import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ErrorToast } from '@/components/ui/ErrorToast';
import { signUpWithEmail, signInWithGoogle, signInWithApple } from '@/lib/auth';
import { captureError } from '@/lib/errors';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleEmailSignUp() {
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    const result = await signUpWithEmail(email.trim().toLowerCase(), password);
    setLoading(false);
    if (!result.ok) {
      setError(result.error.message);
      captureError(result.error, { screen: 'sign-up' });
      return;
    }
    // Supabase may send a confirmation email; the auth state listener handles the rest.
    router.replace('/');
  }

  async function handleGoogle() {
    setOauthLoading('google');
    const result = await signInWithGoogle();
    setOauthLoading(null);
    if (!result.ok && result.error.message !== 'Google sign-in cancelled') {
      setError(result.error.message);
      captureError(result.error, { screen: 'sign-up', provider: 'google' });
    }
  }

  async function handleApple() {
    setOauthLoading('apple');
    const result = await signInWithApple();
    setOauthLoading(null);
    if (!result.ok && result.error.message !== 'Apple sign-in cancelled') {
      setError(result.error.message);
      captureError(result.error, { screen: 'sign-up', provider: 'apple' });
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-black"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6 py-12">
          <Text className="text-white text-4xl font-bold tracking-widest mb-2">
            WOODS
          </Text>
          <Text className="text-woods-stone text-sm mb-10">
            Create your account
          </Text>

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Min. 8 characters"
            secureTextEntry
            autoComplete="new-password"
          />

          <Button
            label="Create Account"
            loading={loading}
            onPress={handleEmailSignUp}
            className="mb-6"
          />

          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-px bg-woods-bark" />
            <Text className="text-woods-stone text-xs mx-3">or continue with</Text>
            <View className="flex-1 h-px bg-woods-bark" />
          </View>

          <View className="gap-3">
            <Button
              label={oauthLoading === 'google' ? 'Opening Google…' : 'Continue with Google'}
              variant="secondary"
              loading={oauthLoading === 'google'}
              onPress={handleGoogle}
            />
            {Platform.OS === 'ios' && (
              <Button
                label={oauthLoading === 'apple' ? 'Opening Apple…' : 'Continue with Apple'}
                variant="secondary"
                loading={oauthLoading === 'apple'}
                onPress={handleApple}
              />
            )}
          </View>

          <View className="flex-row justify-center mt-10">
            <Text className="text-woods-stone text-sm">Already have an account? </Text>
            <Link href="/(auth)/sign-in">
              <Text className="text-white text-sm font-semibold">Sign In</Text>
            </Link>
          </View>
        </View>
      </ScrollView>

      <ErrorToast message={error} onDismiss={() => setError(null)} />
    </KeyboardAvoidingView>
  );
}
