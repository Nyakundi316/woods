import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useSubmitScan, uploadScanPhoto } from '@/lib/queries/legit-lens';
import { PhotoSlotGrid } from '@/components/legit-lens/PhotoSlotGrid';
import { FlagCard } from '@/components/legit-lens/FlagCard';
import { VerdictBadge } from '@/components/legit-lens/VerdictBadge';
import { Button } from '@/components/ui/Button';
import { ErrorToast } from '@/components/ui/ErrorToast';
import { captureError } from '@/lib/errors';
import type { AuthScan } from '@/types/legit-lens';
import { PHOTO_SLOTS } from '@/types/legit-lens';

type Step = 'capture' | 'uploading' | 'analyzing' | 'result';

export default function LegitLensScreen() {
  const { session } = useAuthStore();
  const userId = session?.user.id;

  const [step, setStep] = useState<Step>('capture');
  const [photos, setPhotos] = useState<(string | null)[]>(Array(6).fill(null));
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<AuthScan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submitScan = useSubmitScan(userId);

  async function handleSlotPress(index: number) {
    Alert.alert('Add Photo', PHOTO_SLOTS[index].hint, [
      {
        text: 'Camera',
        onPress: () => pickPhoto(index, true),
      },
      {
        text: 'Library',
        onPress: () => pickPhoto(index, false),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function pickPhoto(index: number, fromCamera: boolean) {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (perm.status !== 'granted') {
      Alert.alert('Permission needed', fromCamera ? 'Camera access required.' : 'Photo library access required.');
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.85 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.85 });

    if (result.canceled || !result.assets[0]) return;
    const updated = [...photos];
    updated[index] = result.assets[0].uri;
    setPhotos(updated);
  }

  async function handleAnalyze() {
    if (!userId) return;

    const filledPhotos = photos.filter(Boolean) as string[];
    if (filledPhotos.length === 0) {
      setError('Add at least one photo to analyze');
      return;
    }

    setStep('uploading');
    setUploadProgress(0);

    try {
      // Upload all non-null slots
      const storagePaths: string[] = [];
      for (let i = 0; i < photos.length; i++) {
        if (!photos[i]) continue;
        const path = await uploadScanPhoto(photos[i]!, userId, i);
        storagePaths.push(path);
        setUploadProgress(Math.round(((storagePaths.length) / filledPhotos.length) * 100));
      }

      setStep('analyzing');
      const scan = await submitScan.mutateAsync(storagePaths);
      setResult(scan);
      setStep('result');
    } catch (e: unknown) {
      const message = (e as Error).message ?? 'Analysis failed';
      captureError({ kind: 'ai', message }, { screen: 'legit-lens' });
      setError(message);
      setStep('capture');
    }
  }

  const filledCount = photos.filter(Boolean).length;

  // ── Uploading ─────────────────────────────────────────────────────────────
  if (step === 'uploading' || step === 'analyzing') {
    return (
      <View className="flex-1 bg-black items-center justify-center px-8">
        <ActivityIndicator color="#FFFFFF" size="large" />
        <Text className="text-white text-base font-semibold mt-6">
          {step === 'uploading' ? `Uploading photos… ${uploadProgress}%` : 'Analyzing with AI…'}
        </Text>
        <Text className="text-woods-stone text-sm mt-2 text-center">
          {step === 'analyzing' ? 'GPT-4o is examining each detail.' : ''}
        </Text>
      </View>
    );
  }

  // ── Result ─────────────────────────────────────────────────────────────────
  if (step === 'result' && result) {
    const highFlags = result.flags.filter((f) => f.severity === 'high');
    const otherFlags = result.flags.filter((f) => f.severity !== 'high');
    const orderedFlags = [...highFlags, ...otherFlags];

    return (
      <View className="flex-1 bg-black">
        <View className="flex-row items-center px-4 pt-14 pb-3">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Text className="text-woods-stone text-base">←</Text>
          </TouchableOpacity>
          <Text className="text-white text-base font-bold tracking-widest">LEGIT LENS</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
          {/* Item identified */}
          {(result.brand_guess || result.model_guess) && (
            <View className="mb-4">
              <Text className="text-woods-stone text-xs tracking-widest uppercase mb-1">Identified as</Text>
              <Text className="text-white text-xl font-bold">
                {[result.brand_guess, result.model_guess].filter(Boolean).join(' ')}
              </Text>
            </View>
          )}

          {/* Verdict */}
          <VerdictBadge verdict={result.verdict} confidence={result.confidence} />

          {/* Flags */}
          {orderedFlags.length > 0 && (
            <View className="mt-6">
              <Text className="text-woods-stone text-xs tracking-widest uppercase mb-3">
                Flags ({orderedFlags.length})
              </Text>
              {orderedFlags.map((flag, i) => (
                <FlagCard key={i} flag={flag} />
              ))}
            </View>
          )}

          {orderedFlags.length === 0 && (
            <View className="mt-6">
              <Text className="text-woods-stone text-sm">No specific flags raised.</Text>
            </View>
          )}

          {/* Scan again */}
          <View className="mt-8">
            <Button
              label="Scan Another Pair"
              variant="secondary"
              onPress={() => {
                setPhotos(Array(6).fill(null));
                setResult(null);
                setStep('capture');
              }}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── Capture ────────────────────────────────────────────────────────────────
  return (
    <View className="flex-1 bg-black">
      <View className="flex-row items-center px-4 pt-14 pb-3">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-woods-stone text-base">←</Text>
        </TouchableOpacity>
        <Text className="text-white text-base font-bold tracking-widest">LEGIT LENS</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <Text className="text-woods-stone text-sm px-4 mb-6">
          Add up to 6 photos. More angles = better accuracy.
        </Text>

        <PhotoSlotGrid photos={photos} onSlotPress={handleSlotPress} />

        <View className="px-4 mt-8">
          <Button
            label={filledCount === 0 ? 'Add Photos to Analyze' : `Analyze ${filledCount} Photo${filledCount !== 1 ? 's' : ''}`}
            loading={submitScan.isPending}
            onPress={handleAnalyze}
          />
        </View>
      </ScrollView>

      <ErrorToast message={error} onDismiss={() => setError(null)} />
    </View>
  );
}
