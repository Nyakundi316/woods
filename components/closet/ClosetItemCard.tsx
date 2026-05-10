import { TouchableOpacity, View, Text, Image } from 'react-native';
import type { ClosetItem } from '@/types/closet';
import { CATEGORY_LABELS } from '@/types/closet';

type Props = {
  item: ClosetItem;
  onPress: () => void;
};

export function ClosetItemCard({ item, onPress }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-1 m-1 bg-woods-bark rounded-sm overflow-hidden"
      style={{ aspectRatio: 0.8 }}
    >
      <Image
        source={{ uri: item.photo_url }}
        className="w-full flex-1"
        resizeMode="cover"
      />
      <View className="px-2 py-2">
        <Text className="text-white text-xs font-semibold" numberOfLines={1}>
          {item.brand} {item.model}
        </Text>
        {item.colorway ? (
          <Text className="text-woods-stone text-xs" numberOfLines={1}>
            {item.colorway}
          </Text>
        ) : null}
        <View className="mt-1">
          <Text className="text-woods-bark text-xs bg-woods-stone/20 self-start px-1.5 py-0.5 rounded-sm">
            {CATEGORY_LABELS[item.category]}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
