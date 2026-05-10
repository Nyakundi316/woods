import { useState } from 'react';
import { View, Text, Image, ScrollView, KeyboardAvoidingView, Platform, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { ErrorToast } from '@/components/ui/ErrorToast';
import { ItemForm, type ItemFormState } from '@/components/closet/ItemForm';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useAddClosetItem } from '@/lib/queries/closet';
import { supabase } from '@/lib/supabase';
import { captureError } from '@/lib/errors';
import type { ClosetCategory } from '@/types/closet';

type Step = 'pick' | 'detecting' | 'confirm';

type Detection = ItemFormState & { embedding: number[] };

async function uploadPhoto(uri: string, userId: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  const path = `${userId}/${Date.now()}.jpg`;
  const { error } = await supabase.storage
    .from('closet')
    .upload(path, blob, { contentType: 'image/jpeg' });
  if (error) throw error;
  return path;
}

async function catalogItem(storagePath: string, accessToken: string): Promise<Detection> {
  const res = await fetch(
    `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/catalog-item`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ storage_path: storagePath }),
    },
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `Server error ${res.status}`);
  }
  return res.json() as Promise<Detection>;
}

export default function AddClosetItemScreen() {
  const { session } = useAuthStore();
  const addItem = useAddClosetItem();

  const [step, setStep] = useState<Step>('pick');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [storagePath, setStoragePath] = useState<string | null>(null);
  const [embedding, setEmbedding] = useState<number[] | null>(null);
  const [form, setForm] = useState<ItemFormState>({
    brand: '',
    model: '',
    colorway: '',
    category: 'sneaker',
  });
  const [error, setError] = useState<string | null>(null);

  function patchForm(patch: Partial<ItemFormState>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  async function launchPicker(fromCamera: boolean) {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert('Permission needed', fromCamera
        ? 'Camera access is required to photograph items.'
        : 'Photo library access is required.');
      return;
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;

    const uri = result.assets[0].uri;
    setPhotoUri(uri);
    await runDetection(uri);
  }

  async function runDetection(uri: string) {
    if (!session?.user.id) return;
    setStep('detecting');
    try {
      const path = await uploadPhoto(uri, session.user.id);
      setStoragePath(path);

      const { data: { session: s } } = await supabase.auth.getSession();
      const detected = await catalogItem(path, s!.access_token);

      setForm({
        brand: detected.brand,
        model: detected.model,
        colorway: detected.colorway,
        category: detected.category as ClosetCategory,
      });
      setEmbedding(detected.embedding);
      setStep('confirm');
    } catch (e: unknown) {
      const message = (e as { message?: string }).message ?? 'Detection failed';
      captureError({ kind: 'ai', message }, { screen: 'closet-add' });
      setError(message);
      setStep('pick');
    }
  }

  async function handleSave() {
    if (!session?.user.id || !storagePath) return;
    if (!form.brand || !form.model) {
      setError('Brand and model are required');
      return;
    }

    // Build the public-ish URL for the photo (used as photo_url for display)
    const { data: { publicUrl } } = supabase.storage.from('closet').getPublicUrl(storagePath);

    try {
      await addItem.mutateAsync({
        user_id: session.user.id,
        brand: form.brand,
        model: form.model,
        colorway: form.colorway || null,
        category: form.category,
        photo_url: publicUrl,
        embedding: embedding,
      });
      router.back();
    } catch (e: unknown) {
      setError((e as { message?: string }).message ?? 'Could not save item');
    }
  }

  // ── Step: pick ─────────────────────────────────────────────────────────────
  if (step === 'pick') {
    return (
      <View className="flex-1 bg-black">
        <View className="px-6 pt-14 pb-6 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Text className="text-woods-stone text-base">← Back</Text>
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold tracking-widest">ADD ITEM</Text>
        </View>

        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-white text-lg font-semibold text-center mb-2">
            Photograph an item
          </Text>
          <Text className="text-woods-stone text-sm text-center mb-10">
            Woods will identify the brand, model, and colorway automatically.
          </Text>

          <View className="w-full gap-3">
            <Button label="Use Camera" onPress={() => launchPicker(true)} />
            <Button label="Choose from Library" variant="secondary" onPress={() => launchPicker(false)} />
          </View>
        </View>

        <ErrorToast message={error} onDismiss={() => setError(null)} />
      </View>
    );
  }

  // ── Step: detecting ────────────────────────────────────────────────────────
  if (step === 'detecting') {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        {photoUri && (
          <Image
            source={{ uri: photoUri }}
            className="w-48 h-48 mb-8 rounded-sm opacity-50"
            resizeMode="cover"
          />
        )}
        <ActivityIndicator color="#FFFFFF" size="large" />
        <Text className="text-woods-stone text-sm mt-4">Identifying item…</Text>
      </View>
    );
  }

  // ── Step: confirm ──────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      className="flex-1 bg-black"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView keyboardShouldPersistTaps="handled">
        <View className="px-6 pt-14 pb-6 flex-row items-center">
          <TouchableOpacity onPress={() => setStep('pick')} className="mr-4">
            <Text className="text-woods-stone text-base">← Retake</Text>
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold tracking-widest">CONFIRM</Text>
        </View>

        {photoUri && (
          <Image
            source={{ uri: photoUri }}
            className="w-full"
            style={{ height: 240 }}
            resizeMode="cover"
          />
        )}

        <View className="px-6 pt-6">
          <Text className="text-woods-stone text-xs mb-4">
            Correct anything that looks wrong before saving.
          </Text>
          <ItemForm value={form} onChange={patchForm} />
          <Button
            label="Save to Closet"
            loading={addItem.isPending}
            onPress={handleSave}
            className="mb-4"
          />
        </View>
      </ScrollView>

      <ErrorToast message={error} onDismiss={() => setError(null)} />
    </KeyboardAvoidingView>
  );
}
