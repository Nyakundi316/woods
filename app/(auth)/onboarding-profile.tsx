import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, FlatList } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ErrorToast } from '@/components/ui/ErrorToast';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useUpsertProfile } from '@/lib/queries/profile';
import { SUPPORTED_COUNTRIES, type CountryOption } from '@/types/profile';
import { captureError } from '@/lib/errors';

export default function OnboardingProfileScreen() {
  const { session, setProfile } = useAuthStore();
  const upsert = useUpsertProfile();

  const [username, setUsername] = useState('');
  const [country, setCountry] = useState<CountryOption>(SUPPORTED_COUNTRIES[0]);
  const [sizeUS, setSizeUS] = useState('');
  const [sizeEU, setSizeEU] = useState('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (!session?.user.id) {
      setError('Session expired — please sign in again');
      return;
    }

    try {
      const profile = await upsert.mutateAsync({
        id: session.user.id,
        username: username.trim().toLowerCase(),
        country_code: country.code,
        preferred_currency: country.currency,
        shoe_size_us: sizeUS ? parseFloat(sizeUS) : null,
        shoe_size_eu: sizeEU ? parseFloat(sizeEU) : null,
        onboarding_completed: false, // set to true after Style DNA (Phase 2)
      });
      setProfile(profile);
      router.replace('/(auth)/style-dna');
    } catch (e: unknown) {
      const message = (e as { message?: string }).message ?? 'Could not save profile';
      setError(message.includes('duplicate') ? 'That username is taken' : message);
      captureError({ kind: 'unknown', message, raw: e }, { screen: 'onboarding-profile' });
    }
  }

  return (
    <View className="flex-1 bg-black">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6 py-16">
          <Text className="text-white text-4xl font-bold tracking-widest mb-2">
            WOODS
          </Text>
          <Text className="text-woods-stone text-sm mb-10">
            Step 1 of 2 — tell us about yourself.
          </Text>

          <Input
            label="Username"
            value={username}
            onChangeText={setUsername}
            placeholder="yourhandle"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={30}
          />

          {/* Country picker */}
          <View className="w-full mb-4">
            <Text className="text-woods-stone text-xs tracking-widest uppercase mb-2">
              Country
            </Text>
            <TouchableOpacity
              onPress={() => setShowCountryPicker(true)}
              className="bg-woods-bark px-4 py-4 rounded-sm flex-row justify-between items-center"
            >
              <Text className="text-white text-base">{country.name}</Text>
              <Text className="text-woods-stone text-xs">{country.code} ▾</Text>
            </TouchableOpacity>
          </View>

          {/* Shoe sizes (optional) */}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Input
                label="US Size"
                value={sizeUS}
                onChangeText={setSizeUS}
                placeholder="10.5"
                keyboardType="decimal-pad"
              />
            </View>
            <View className="flex-1">
              <Input
                label="EU Size"
                value={sizeEU}
                onChangeText={setSizeEU}
                placeholder="44"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <Text className="text-woods-stone text-xs mb-8">
            Shoe size is optional but helps us personalise drop pricing. You can change it later.
          </Text>

          <Button
            label="Let's go"
            loading={upsert.isPending}
            onPress={handleContinue}
          />
        </View>
      </ScrollView>

      {/* Country picker modal */}
      <Modal
        visible={showCountryPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <View className="flex-1 justify-end">
          <View className="bg-woods-bark rounded-t-2xl pb-8">
            <View className="px-6 py-4 border-b border-black">
              <Text className="text-white font-semibold text-base">Select Country</Text>
            </View>
            <FlatList
              data={SUPPORTED_COUNTRIES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="px-6 py-4 flex-row justify-between items-center"
                  onPress={() => {
                    setCountry(item);
                    setShowCountryPicker(false);
                  }}
                >
                  <Text className="text-white text-base">{item.name}</Text>
                  <Text className="text-woods-stone text-sm">{item.currency}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      <ErrorToast message={error} onDismiss={() => setError(null)} />
    </View>
  );
}
