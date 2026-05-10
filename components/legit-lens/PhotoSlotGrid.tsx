import { View, Text, Image, TouchableOpacity, Dimensions } from 'react-native';
import { PHOTO_SLOTS } from '@/types/legit-lens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLOT_SIZE = (SCREEN_WIDTH - 48) / 2; // 2 columns, 16px side padding, 16px gap

type Props = {
  photos: (string | null)[];
  onSlotPress: (index: number) => void;
};

export function PhotoSlotGrid({ photos, onSlotPress }: Props) {
  return (
    <View className="flex-row flex-wrap gap-4 px-4">
      {PHOTO_SLOTS.map((slot, i) => {
        const uri = photos[i] ?? null;
        return (
          <TouchableOpacity
            key={i}
            onPress={() => onSlotPress(i)}
            style={{ width: SLOT_SIZE, height: SLOT_SIZE }}
            activeOpacity={0.75}
          >
            {uri ? (
              <View className="flex-1 rounded-sm overflow-hidden">
                <Image source={{ uri }} className="flex-1" resizeMode="cover" />
                <View className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                  <Text className="text-white text-xs">{slot.label}</Text>
                </View>
              </View>
            ) : (
              <View className="flex-1 rounded-sm border border-dashed border-woods-bark items-center justify-center">
                <Text className="text-woods-stone text-xl mb-1">+</Text>
                <Text className="text-woods-stone text-xs text-center px-2">{slot.label}</Text>
                <Text className="text-woods-bark text-xs text-center px-2 mt-0.5">{slot.hint}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
