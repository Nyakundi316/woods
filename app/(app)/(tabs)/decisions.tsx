import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useAuthScans } from '@/lib/queries/legit-lens';
import { VerdictBadge } from '@/components/legit-lens/VerdictBadge';
import type { AuthScan } from '@/types/legit-lens';
import { VERDICT_LABELS } from '@/types/legit-lens';

const VERDICT_DOT: Record<AuthScan['verdict'], string> = {
  likely_authentic: 'bg-white',
  inconclusive: 'bg-woods-stone',
  likely_replica: 'bg-white',
};

function ScanRow({ scan }: { scan: AuthScan }) {
  const date = new Date(scan.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
  const highCount = scan.flags.filter((f) => f.severity === 'high').length;

  return (
    <View className="px-4 py-4 border-b border-woods-bark">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 mr-4">
          {(scan.brand_guess || scan.model_guess) ? (
            <Text className="text-white text-sm font-semibold mb-0.5">
              {[scan.brand_guess, scan.model_guess].filter(Boolean).join(' ')}
            </Text>
          ) : (
            <Text className="text-woods-stone text-sm italic mb-0.5">Unknown item</Text>
          )}
          <Text className="text-woods-stone text-xs">{date}</Text>
          {highCount > 0 && (
            <Text className="text-woods-stone text-xs mt-1">
              {highCount} high-severity flag{highCount !== 1 ? 's' : ''}
            </Text>
          )}
        </View>

        <View className="items-end gap-1">
          <View className="flex-row items-center gap-1.5">
            <View className={`w-1.5 h-1.5 rounded-full ${VERDICT_DOT[scan.verdict]}`} />
            <Text className="text-woods-stone text-xs">{VERDICT_LABELS[scan.verdict]}</Text>
          </View>
          <Text className="text-woods-bark text-xs">{Math.round(scan.confidence * 100)}% conf.</Text>
        </View>
      </View>
    </View>
  );
}

function EmptyScans() {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <Text className="text-white text-lg font-semibold text-center mb-3">
        No scans yet
      </Text>
      <Text className="text-woods-stone text-sm text-center mb-8">
        Use Legit Lens to authenticate sneakers before you buy.
      </Text>
      <TouchableOpacity
        onPress={() => router.push('/legit-lens')}
        className="border border-woods-stone px-6 py-3 rounded-sm"
      >
        <Text className="text-white text-sm">Open Legit Lens</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function DecisionsScreen() {
  const { session } = useAuthStore();
  const { data: scans, isLoading } = useAuthScans(session?.user.id);

  if (isLoading) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator color="#FFFFFF" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <View className="px-4 pt-14 pb-4 flex-row items-center justify-between">
        <Text className="text-white text-2xl font-bold tracking-widest">SCANS</Text>
        <Text className="text-woods-stone text-sm">
          {scans?.length ?? 0} scan{scans?.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={scans}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ flexGrow: 1 }}
        ListEmptyComponent={<EmptyScans />}
        renderItem={({ item }) => <ScanRow scan={item} />}
      />

      {/* FAB */}
      <TouchableOpacity
        onPress={() => router.push('/legit-lens')}
        className="absolute bottom-8 right-6 bg-white w-14 h-14 rounded-full items-center justify-center shadow-lg"
      >
        <Text className="text-black text-xl font-bold">🔍</Text>
      </TouchableOpacity>
    </View>
  );
}
