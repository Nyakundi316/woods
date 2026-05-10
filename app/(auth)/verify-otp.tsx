import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ErrorToast } from '@/components/ui/ErrorToast';
import { sendPhoneOtp, verifyPhoneOtp } from '@/lib/auth';
import { captureError } from '@/lib/errors';

type Step = 'phone' | 'otp';

export default function VerifyOTPScreen() {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('+254');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSendOtp() {
    if (phone.length < 10) {
      setError('Enter a valid phone number');
      return;
    }
    setLoading(true);
    const result = await sendPhoneOtp(phone.trim());
    setLoading(false);
    if (!result.ok) {
      setError(result.error.message);
      captureError(result.error, { screen: 'verify-otp', step: 'send' });
      return;
    }
    setStep('otp');
  }

  async function handleVerifyOtp() {
    if (otp.length !== 6) {
      setError('Enter the 6-digit code');
      return;
    }
    setLoading(true);
    const result = await verifyPhoneOtp(phone.trim(), otp.trim());
    setLoading(false);
    if (!result.ok) {
      setError(result.error.message);
      captureError(result.error, { screen: 'verify-otp', step: 'verify' });
      return;
    }
    router.replace('/');
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

          {step === 'phone' ? (
            <>
              <Text className="text-woods-stone text-sm mb-10">
                Enter your phone number to receive a one-time code.
              </Text>
              <Input
                label="Phone Number"
                value={phone}
                onChangeText={setPhone}
                placeholder="+254 700 000 000"
                keyboardType="phone-pad"
                autoComplete="tel"
              />
              <Button
                label="Send Code"
                loading={loading}
                onPress={handleSendOtp}
              />
            </>
          ) : (
            <>
              <Text className="text-woods-stone text-sm mb-10">
                Enter the 6-digit code sent to {phone}.
              </Text>
              <Input
                label="Code"
                value={otp}
                onChangeText={setOtp}
                placeholder="000000"
                keyboardType="number-pad"
                maxLength={6}
                autoComplete="one-time-code"
              />
              <Button
                label="Verify"
                loading={loading}
                onPress={handleVerifyOtp}
                className="mb-4"
              />
              <Button
                label="Resend code"
                variant="ghost"
                onPress={() => { setStep('phone'); setOtp(''); }}
              />
            </>
          )}
        </View>
      </ScrollView>

      <ErrorToast message={error} onDismiss={() => setError(null)} />
    </KeyboardAvoidingView>
  );
}
