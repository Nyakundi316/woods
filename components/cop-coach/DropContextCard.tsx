import { View, Text, Image } from 'react-native';
import type { DropWithScore } from '@/types/drops';

type Props = {
  drop: DropWithScore;
};

export function DropContextCard({ drop }: Props) {
  const pct = drop.score !== null ? Math.round(drop.score * 100) : null;

  return (
    <View className="flex-row items-center gap-3 px-4 py-3 bg-woods-bark border-b border-woods-bark">
      <Image
        source={{ uri: drop.photo_url }}
        className="w-14 h-14 rounded-sm"
        resizeMode="cover"
      />
      <View className="flex-1">
        <Text className="text-woods-stone text-xs">{drop.brands?.name ?? ''}</Text>
        <Text className="text-white text-sm font-semibold leading-tight" numberOfLines={1}>
          {drop.name}
        </Text>
        <Text className="text-woods-stone text-xs" numberOfLines={1}>{drop.colorway}</Text>
      </View>
      {pct !== null && (
        <View className="items-center">
          <Text className="text-white text-lg font-bold">{pct}%</Text>
          <Text className="text-woods-stone text-xs">match</Text>
        </View>
      )}
    </View>
  );
}
