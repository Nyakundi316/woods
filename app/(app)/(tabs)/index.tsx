import { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useDropFeed, useScoreDrops, useToggleWatchlist } from '@/lib/queries/drops';
import { DropCard } from '@/components/drops/DropCard';
import { FilterChips } from '@/components/drops/FilterChips';
import { ErrorToast } from '@/components/ui/ErrorToast';
import { supabase } from '@/lib/supabase';
import type { DropFilter, DropWithScore } from '@/types/drops';

export default function DropsScreen() {
  const { session } = useAuthStore();
  const userId = session?.user.id;

  const { data: drops, isLoading, refetch, isRefetching } = useDropFeed(userId);
  const scoreDrops = useScoreDrops(userId);
  const toggleWatchlist = useToggleWatchlist(userId);

  const [filter, setFilter] = useState<DropFilter>('all');
  const [error, setError] = useState<string | null>(null);
  const [scored, setScored] = useState(false);

  // Trigger scoring once per session after data loads
  useEffect(() => {
    if (!scored && drops && drops.every((d) => d.score === null) && userId) {
      setScored(true);
      supabase.auth.getSession().then(({ data: { session: s } }) => {
        if (s?.access_token) {
          scoreDrops.mutate(s.access_token, {
            onError: (e) => setError((e as Error).message),
          });
        }
      });
    }
  }, [drops, scored, userId]);

  const filtered = useMemo<DropWithScore[]>(() => {
    if (!drops) return [];
    switch (filter) {
      case 'watched': return drops.filter((d) => d.isWatched);
      default: return drops;
    }
  }, [drops, filter]);

  const handleWatchToggle = (drop: DropWithScore) => {
    toggleWatchlist.mutate(
      { dropId: drop.id, isWatched: drop.isWatched },
      { onError: (e) => setError((e as Error).message) },
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator color="#FFFFFF" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {/* Header */}
      <View className="px-4 pt-14 pb-2 flex-row items-center justify-between">
        <Text className="text-white text-2xl font-bold tracking-widest">DROPS</Text>
        {scoreDrops.isPending && (
          <View className="flex-row items-center gap-2">
            <ActivityIndicator color="#8C8680" size="small" />
            <Text className="text-woods-stone text-xs">Scoring…</Text>
          </View>
        )}
      </View>

      <FilterChips active={filter} onSelect={setFilter} />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 120, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#FFFFFF"
          />
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center px-8 py-20">
            <Text className="text-white text-lg font-semibold text-center mb-2">
              {filter === 'watched' ? 'Nothing on your watchlist' : 'No drops right now'}
            </Text>
            <Text className="text-woods-stone text-sm text-center">
              {filter === 'watched'
                ? 'Tap ☆ Watch on any drop to track it.'
                : 'Pull to refresh or check back soon.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <DropCard
            drop={item}
            onPress={() => router.push(`/drop/${item.id}`)}
            onWatchToggle={() => handleWatchToggle(item)}
          />
        )}
      />

      <ErrorToast message={error} onDismiss={() => setError(null)} />
    </View>
  );
}
