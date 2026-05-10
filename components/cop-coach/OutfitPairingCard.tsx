import { View, Text } from 'react-native';
import type { OutfitPairing } from '@/types/cop-coach';

type Props = {
  pairing: OutfitPairing;
  index: number;
};

export function OutfitPairingCard({ pairing, index }: Props) {
  return (
    <View className="bg-woods-bark rounded-sm p-4 mb-3">
      <View className="flex-row items-center gap-2 mb-2">
        <Text className="text-woods-stone text-xs">{index + 1}</Text>
        <Text className="text-white text-sm font-semibold">{pairing.name}</Text>
      </View>

      <Text className="text-woods-stone text-xs tracking-widest uppercase mb-1">Pieces</Text>
      {pairing.itemDetails.filter(Boolean).map((item, i) => (
        <Text key={i} className="text-white text-xs mb-0.5">
          · {item!.brand} {item!.model}
          {item!.colorway ? ` — ${item!.colorway}` : ''}
        </Text>
      ))}

      <Text className="text-woods-stone text-xs tracking-widest uppercase mt-3 mb-1">Occasion</Text>
      <Text className="text-white text-xs">{pairing.occasion}</Text>

      <Text className="text-woods-stone text-xs tracking-widest uppercase mt-3 mb-1">Why it works</Text>
      <Text className="text-woods-stone text-xs leading-relaxed">{pairing.palette_logic}</Text>
    </View>
  );
}
