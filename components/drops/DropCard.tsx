import { View, Text, Image, TouchableOpacity, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { DropWithScore } from '@/types/drops';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 32;

function ScoreBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 75 ? 'bg-white' :
    pct >= 50 ? 'bg-woods-bark' :
    'bg-transparent border border-woods-stone';
  const textColor =
    pct >= 75 ? 'text-black' :
    pct >= 50 ? 'text-white' :
    'text-woods-stone';

  return (
    <View className={`px-2 py-1 rounded-sm ${color}`}>
      <Text className={`text-xs font-semibold ${textColor}`}>{pct}%</Text>
    </View>
  );
}

function Countdown({ releaseDate }: { releaseDate: string }) {
  const now = new Date();
  const release = new Date(releaseDate);
  const diffMs = release.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return <Text className="text-woods-stone text-xs">Released</Text>;
  if (diffDays === 0) return <Text className="text-white text-xs font-semibold">Today</Text>;
  if (diffDays === 1) return <Text className="text-white text-xs">Tomorrow</Text>;
  if (diffDays <= 7) return <Text className="text-white text-xs">{diffDays}d away</Text>;
  return <Text className="text-woods-stone text-xs">{release.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>;
}

type Props = {
  drop: DropWithScore;
  onPress: () => void;
  onWatchToggle: () => void;
};

export function DropCard({ drop, onPress, onWatchToggle }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{ width: CARD_WIDTH }}
      className="mb-4 self-center"
    >
      <View className="bg-woods-bark rounded-sm overflow-hidden">
        {/* Hero image */}
        <Image
          source={{ uri: drop.photo_url }}
          style={{ width: CARD_WIDTH, height: CARD_WIDTH * 0.6 }}
          resizeMode="cover"
        />

        {/* Watch button — top right overlay */}
        <TouchableOpacity
          onPress={(e) => { e.stopPropagation(); Haptics.selectionAsync().catch(() => undefined); onWatchToggle(); }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className="absolute top-3 right-3 bg-black/60 px-3 py-1.5 rounded-full"
        >
          <Text className="text-white text-xs">
            {drop.isWatched ? '★ Watching' : '☆ Watch'}
          </Text>
        </TouchableOpacity>

        {/* Content */}
        <View className="px-4 py-3">
          <View className="flex-row items-start justify-between mb-1">
            <View className="flex-1 mr-3">
              <Text className="text-woods-stone text-xs mb-0.5">
                {drop.brands?.name ?? ''}
              </Text>
              <Text className="text-white text-base font-semibold leading-tight" numberOfLines={2}>
                {drop.name}
              </Text>
              <Text className="text-woods-stone text-xs mt-0.5" numberOfLines={1}>
                {drop.colorway}
              </Text>
            </View>

            <View className="items-end gap-1">
              {drop.score !== null && <ScoreBadge score={drop.score} />}
              <Countdown releaseDate={drop.release_date} />
            </View>
          </View>

          {drop.retail_price_usd !== null && (
            <Text className="text-woods-stone text-xs mt-1">
              ${drop.retail_price_usd}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
