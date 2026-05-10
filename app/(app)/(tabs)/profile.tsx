import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useClosetItems } from '@/lib/queries/closet';
import { useAuthScans } from '@/lib/queries/legit-lens';
import { useStyleProfile } from '@/lib/queries/style-dna';
import { supabase } from '@/lib/supabase';
import { SUPPORTED_COUNTRIES } from '@/types/profile';

function StatBox({ value, label }: { value: number | string; label: string }) {
  return (
    <View className="flex-1 items-center py-4 border border-woods-bark rounded-sm">
      <Text className="text-white text-2xl font-bold">{value}</Text>
      <Text className="text-woods-stone text-xs mt-1">{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { session, profile, reset } = useAuthStore();
  const userId = session?.user.id;

  const { data: closetItems } = useClosetItems(userId);
  const { data: scans } = useAuthScans(userId);
  const { data: styleProfile } = useStyleProfile(userId);

  const country = SUPPORTED_COUNTRIES.find((c) => c.code === profile?.country_code);

  async function handleSignOut() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          reset();
        },
      },
    ]);
  }

  if (!profile) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator color="#FFFFFF" />
      </View>
    );
  }

  const confidencePct = styleProfile ? Math.round(styleProfile.confidence_score * 100) : null;

  return (
    <View className="flex-1 bg-black">
      <View className="px-4 pt-14 pb-4">
        <Text className="text-white text-2xl font-bold tracking-widest">PROFILE</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Identity */}
        <View className="px-4 pb-6 border-b border-woods-bark">
          <Text className="text-white text-xl font-semibold">
            {profile.display_name ?? profile.username}
          </Text>
          <Text className="text-woods-stone text-sm">@{profile.username}</Text>
          {country && (
            <Text className="text-woods-stone text-xs mt-1">{country.name}</Text>
          )}
          {profile.shoe_size_us && (
            <Text className="text-woods-stone text-xs mt-0.5">
              US {profile.shoe_size_us} · EU {profile.shoe_size_eu ?? '—'}
            </Text>
          )}
        </View>

        {/* Stats */}
        <View className="flex-row gap-3 px-4 py-6 border-b border-woods-bark">
          <StatBox value={closetItems?.length ?? 0} label="Closet" />
          <StatBox value={scans?.length ?? 0} label="Scans" />
          <StatBox value={confidencePct !== null ? `${confidencePct}%` : '—'} label="DNA Conf." />
        </View>

        {/* Style DNA */}
        {styleProfile && (
          <View className="px-4 py-6 border-b border-woods-bark">
            <Text className="text-woods-stone text-xs tracking-widest uppercase mb-2">Style DNA</Text>
            <Text className="text-white text-sm font-semibold mb-1">
              {styleProfile.tags.dominant_aesthetic}
            </Text>
            {styleProfile.tags && styleProfile.tags.silhouettes.length > 0 && (
              <View className="flex-row flex-wrap gap-1.5 mt-2">
                {[...styleProfile.tags.silhouettes, ...styleProfile.tags.eras].slice(0, 8).map((tag) => (
                  <View key={tag} className="border border-woods-bark px-2 py-0.5 rounded-full">
                    <Text className="text-woods-stone text-xs">{tag}</Text>
                  </View>
                ))}
              </View>
            )}
            <TouchableOpacity
              className="mt-4 border border-woods-stone px-4 py-2 rounded-sm self-start"
              onPress={() => router.push('/(auth)/style-dna')}
            >
              <Text className="text-woods-stone text-xs">Reshoot Style DNA</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick links */}
        <View className="px-4 py-4 border-b border-woods-bark">
          <TouchableOpacity
            className="py-3 flex-row items-center justify-between"
            onPress={() => router.push('/legit-lens')}
          >
            <Text className="text-white text-sm">Legit Lens</Text>
            <Text className="text-woods-stone text-sm">→</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="py-3 flex-row items-center justify-between border-t border-woods-bark"
            onPress={() => router.push('/closet/add')}
          >
            <Text className="text-white text-sm">Add to Closet</Text>
            <Text className="text-woods-stone text-sm">→</Text>
          </TouchableOpacity>
        </View>

        {/* Sign out */}
        <View className="px-4 pt-8">
          <TouchableOpacity
            onPress={handleSignOut}
            className="py-3 items-center"
          >
            <Text className="text-woods-stone text-sm">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
