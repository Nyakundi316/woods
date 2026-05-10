import { useState } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  ActivityIndicator, Linking, Dimensions,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useDropDetail, useToggleWatchlist } from '@/lib/queries/drops';
import { Button } from '@/components/ui/Button';
import { ErrorToast } from '@/components/ui/ErrorToast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const barColor = pct >= 75 ? 'bg-white' : pct >= 50 ? 'bg-woods-bark' : 'bg-woods-stone';
  return (
    <View>
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-woods-stone text-xs tracking-widest uppercase">Match Score</Text>
        <Text className="text-white text-lg font-bold">{pct}%</Text>
      </View>
      <View className="h-1 bg-woods-bark rounded-full overflow-hidden">
        <View className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </View>
    </View>
  );
}

export default function DropDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuthStore();
  const userId = session?.user.id;

  const { data: drop, isLoading } = useDropDetail(id, userId);
  const toggleWatchlist = useToggleWatchlist(userId);
  const [error, setError] = useState<string | null>(null);

  const handleWatchToggle = () => {
    if (!drop) return;
    toggleWatchlist.mutate(
      { dropId: drop.id, isWatched: drop.isWatched, dropName: drop.name, releaseDate: drop.release_date },
      { onError: (e) => setError((e as Error).message) },
    );
  };

  if (isLoading || !drop) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator color="#FFFFFF" />
      </View>
    );
  }

  const releaseDate = new Date(drop.release_date);
  const now = new Date();
  const daysUntil = Math.ceil((releaseDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isReleased = daysUntil < 0;

  return (
    <View className="flex-1 bg-black">
      {/* Back button */}
      <View className="absolute top-14 left-4 z-10">
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-black/60 px-4 py-2 rounded-full"
        >
          <Text className="text-white text-sm">← Drops</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero image */}
        <Image
          source={{ uri: drop.photo_url }}
          style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.65 }}
          resizeMode="cover"
        />

        <View className="px-6 pt-6 pb-20">
          {/* Brand + name */}
          <Text className="text-woods-stone text-xs tracking-widest uppercase mb-1">
            {drop.brands?.name ?? ''}
          </Text>
          <Text className="text-white text-2xl font-bold leading-tight mb-1">
            {drop.name}
          </Text>
          <Text className="text-woods-stone text-base mb-1">{drop.colorway}</Text>

          {drop.sku && (
            <Text className="text-woods-bark text-xs mb-1">SKU: {drop.sku}</Text>
          )}

          {/* Release + price row */}
          <View className="flex-row items-center gap-4 mt-2 mb-6">
            <View>
              <Text className="text-woods-stone text-xs">Release</Text>
              <Text className="text-white text-sm font-semibold">
                {isReleased
                  ? 'Released'
                  : daysUntil === 0
                  ? 'Today'
                  : releaseDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
            {drop.retail_price_usd !== null && (
              <View>
                <Text className="text-woods-stone text-xs">Retail</Text>
                <Text className="text-white text-sm font-semibold">${drop.retail_price_usd}</Text>
              </View>
            )}
          </View>

          {/* Match score */}
          {drop.score !== null && (
            <View className="mb-6">
              <ScoreBar score={drop.score} />
              {drop.reasoning && (
                <Text className="text-woods-stone text-sm mt-3 leading-relaxed">
                  {drop.reasoning}
                </Text>
              )}
            </View>
          )}

          {/* Description */}
          <Text className="text-woods-stone text-xs tracking-widest uppercase mb-2">About</Text>
          <Text className="text-white text-sm leading-relaxed mb-8">{drop.description}</Text>

          {/* Actions */}
          <View className="gap-3">
            {/* Watch toggle */}
            <Button
              label={drop.isWatched ? '★  Watching' : '☆  Watch This Drop'}
              variant={drop.isWatched ? 'secondary' : 'primary'}
              loading={toggleWatchlist.isPending}
              onPress={handleWatchToggle}
            />

            {/* Ask Cop Coach CTA */}
            <Button
              label="Ask Cop Coach"
              variant="secondary"
              onPress={() => router.push(`/cop-coach/${drop.id}`)}
            />

            {/* Buy link */}
            {drop.buy_url ? (
              <Button
                label={isReleased ? 'Buy Now' : 'Set Reminder / RSVP'}
                variant="ghost"
                onPress={() => Linking.openURL(drop.buy_url)}
              />
            ) : null}
          </View>
        </View>
      </ScrollView>

      <ErrorToast message={error} onDismiss={() => setError(null)} />
    </View>
  );
}
