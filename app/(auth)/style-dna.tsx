import { useState, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, Alert, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { ErrorToast } from '@/components/ui/ErrorToast';
import { ProgressStages, type Stage } from '@/components/style-dna/ProgressStages';
import { StyleDNACard } from '@/components/style-dna/StyleDNACard';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useUpsertProfile } from '@/lib/queries/profile';
import { supabase } from '@/lib/supabase';
import { captureError } from '@/lib/errors';
import type { ExtractStyleDNAResponse, StyleDNATags } from '@/types/style-dna';

const MIN_PHOTOS = 3; // minimum to proceed
const WARN_PHOTOS = 5; // below this, show confidence warning
const MAX_PHOTOS = 10;

type ScreenState = 'picker' | 'loading' | 'summary';

const INITIAL_STAGES: Stage[] = [
  { label: 'Uploading your fits', detail: 'Sending photos to secure storage', state: 'pending' },
  { label: 'Reading your style signals', detail: 'Analysing colours, silhouettes, and eras', state: 'pending' },
  { label: 'Weaving your Style DNA', detail: 'Building your personal taste vector', state: 'pending' },
];

export default function StyleDNAScreen() {
  const { session, setProfile } = useAuthStore();
  const upsert = useUpsertProfile();

  const [photos, setPhotos] = useState<string[]>([]);
  const [screenState, setScreenState] = useState<ScreenState>('picker');
  const [stages, setStages] = useState<Stage[]>(INITIAL_STAGES);
  const [result, setResult] = useState<ExtractStyleDNAResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  function setStageState(index: number, state: Stage['state']) {
    setStages((prev) =>
      prev.map((s, i) => (i === index ? { ...s, state } : s)),
    );
  }

  const pickPhotos = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Woods needs access to your photo library to read your style.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
      selectionLimit: MAX_PHOTOS - photos.length,
    });
    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      setPhotos((prev) => [...prev, ...uris].slice(0, MAX_PHOTOS));
    }
  }, [photos.length]);

  function removePhoto(uri: string) {
    setPhotos((prev) => prev.filter((p) => p !== uri));
  }

  async function uploadPhoto(uri: string, userId: string, index: number): Promise<string> {
    const response = await fetch(uri);
    const blob = await response.blob();
    const path = `${userId}/${Date.now()}-${index}.jpg`;
    const { error } = await supabase.storage.from('style-dna').upload(path, blob, {
      contentType: 'image/jpeg',
      upsert: false,
    });
    if (error) throw error;
    return path;
  }

  async function handleAnalyse() {
    if (!session?.user.id) return;
    const userId = session.user.id;

    setScreenState('loading');
    setStages(INITIAL_STAGES.map((s) => ({ ...s, state: 'pending' as const })));

    try {
      // Stage 1: Upload photos one by one so progress is real
      setStageState(0, 'active');
      const storagePaths: string[] = [];
      for (let i = 0; i < photos.length; i++) {
        const path = await uploadPhoto(photos[i], userId, i);
        storagePaths.push(path);
      }
      setStageState(0, 'done');

      // Stage 2 + 3 run inside the Edge Function — start both stages
      setStageState(1, 'active');

      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/extract-style-dna`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentSession?.access_token}`,
          },
          body: JSON.stringify({ photo_paths: storagePaths }),
        },
      );

      setStageState(1, 'done');
      setStageState(2, 'active');

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `Server error ${response.status}`);
      }

      const data = (await response.json()) as ExtractStyleDNAResponse;
      setStageState(2, 'done');
      setResult(data);
      setScreenState('summary');
    } catch (e: unknown) {
      const message = (e as { message?: string }).message ?? 'Analysis failed';
      captureError({ kind: 'ai', message }, { screen: 'style-dna' });
      setError(message);
      setScreenState('picker');
    }
  }

  async function handleConfirm() {
    if (!session?.user.id || !result) return;
    try {
      const profile = await upsert.mutateAsync({
        id: session.user.id,
        onboarding_completed: true,
      });
      setProfile(profile);
      router.replace('/(app)/(tabs)');
    } catch (e: unknown) {
      setError((e as { message?: string }).message ?? 'Could not save');
    }
  }

  function handleReshoot() {
    setPhotos([]);
    setResult(null);
    setScreenState('picker');
  }

  // ── Picker view ────────────────────────────────────────────────────────────
  if (screenState === 'picker') {
    const canAnalyse = photos.length >= MIN_PHOTOS;
    const showWarning = photos.length > 0 && photos.length < WARN_PHOTOS;

    return (
      <View className="flex-1 bg-black">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6 pt-12">
          <Text className="text-white text-4xl font-bold tracking-widest mb-2">
            WOODS
          </Text>
          <Text className="text-woods-stone text-sm mb-2">
            Share 5–10 photos of outfits you love — your own fits, saves, inspo.
          </Text>
          {showWarning && (
            <Text className="text-yellow-400 text-xs mb-4">
              Add {WARN_PHOTOS - photos.length} more photo{WARN_PHOTOS - photos.length !== 1 ? 's' : ''} for stronger match results.
            </Text>
          )}
          {!showWarning && photos.length > 0 && (
            <Text className="text-woods-stone text-xs mb-4">
              {photos.length}/{MAX_PHOTOS} photos selected
            </Text>
          )}

          {/* Photo grid */}
          {photos.length > 0 && (
            <FlatList
              data={photos}
              keyExtractor={(uri) => uri}
              numColumns={3}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => removePhoto(item)}
                  className="flex-1 aspect-square m-0.5 relative"
                >
                  <Image source={{ uri: item }} className="w-full h-full" />
                  <View className="absolute top-1 right-1 bg-black/70 rounded-full w-5 h-5 items-center justify-center">
                    <Text className="text-white text-xs">✕</Text>
                  </View>
                </TouchableOpacity>
              )}
              className="mb-4"
            />
          )}

          {/* Add photos button */}
          {photos.length < MAX_PHOTOS && (
            <TouchableOpacity
              onPress={pickPhotos}
              className="border border-dashed border-woods-stone rounded-sm py-8 items-center mb-6"
            >
              <Text className="text-woods-stone text-3xl mb-2">+</Text>
              <Text className="text-woods-stone text-sm">
                {photos.length === 0 ? 'Add your fits' : 'Add more photos'}
              </Text>
            </TouchableOpacity>
          )}

          <Button
            label={canAnalyse ? 'Build my Style DNA' : `Add ${MIN_PHOTOS - photos.length} more to continue`}
            disabled={!canAnalyse}
            onPress={handleAnalyse}
            className="mb-4"
          />
          <Button
            label="Skip for now"
            variant="ghost"
            onPress={() => router.replace('/(app)/(tabs)')}
          />
        </ScrollView>

        <ErrorToast message={error} onDismiss={() => setError(null)} />
      </View>
    );
  }

  // ── Loading view ───────────────────────────────────────────────────────────
  if (screenState === 'loading') {
    return (
      <View className="flex-1 bg-black justify-center">
        <View className="px-6 mb-8">
          <Text className="text-white text-4xl font-bold tracking-widest mb-2">
            WOODS
          </Text>
          <Text className="text-woods-stone text-sm">
            Building your Style DNA…
          </Text>
        </View>
        <ProgressStages stages={stages} />
      </View>
    );
  }

  // ── Summary view ───────────────────────────────────────────────────────────
  return (
    <View className="flex-1 bg-black">
      <View className="px-6 pt-12 pb-4">
        <Text className="text-white text-4xl font-bold tracking-widest mb-1">
          Your Style DNA
        </Text>
        <Text className="text-woods-stone text-sm">
          This is how Woods reads your taste.
        </Text>
      </View>

      {result && (
        <StyleDNACard
          tags={result.tags}
          confidence={result.confidence_score}
          photoCount={result.source_photo_count}
        />
      )}

      <View className="px-6 pb-8 gap-3">
        <Button
          label="This is me — let's go"
          loading={upsert.isPending}
          onPress={handleConfirm}
        />
        <Button
          label="Re-shoot with different photos"
          variant="secondary"
          onPress={handleReshoot}
        />
      </View>

      <ErrorToast message={error} onDismiss={() => setError(null)} />
    </View>
  );
}
