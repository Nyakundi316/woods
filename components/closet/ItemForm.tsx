import { View, Text, TouchableOpacity } from 'react-native';
import { Input } from '@/components/ui/Input';
import type { ClosetCategory } from '@/types/closet';
import { CATEGORY_LABELS } from '@/types/closet';

const CATEGORIES: ClosetCategory[] = ['sneaker', 'apparel', 'accessory'];

export type ItemFormState = {
  brand: string;
  model: string;
  colorway: string;
  category: ClosetCategory;
};

type Props = {
  value: ItemFormState;
  onChange: (patch: Partial<ItemFormState>) => void;
};

export function ItemForm({ value, onChange }: Props) {
  return (
    <View>
      <Input
        label="Brand"
        value={value.brand}
        onChangeText={(brand) => onChange({ brand })}
        placeholder="New Balance"
        autoCorrect={false}
      />
      <Input
        label="Model"
        value={value.model}
        onChangeText={(model) => onChange({ model })}
        placeholder="574"
        autoCorrect={false}
      />
      <Input
        label="Colorway"
        value={value.colorway}
        onChangeText={(colorway) => onChange({ colorway })}
        placeholder="Grey/Navy"
        autoCorrect={false}
      />

      <Text className="text-woods-stone text-xs tracking-widest uppercase mb-2">
        Category
      </Text>
      <View className="flex-row gap-2 mb-4">
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => onChange({ category: cat })}
            className={`flex-1 py-3 rounded-sm items-center border ${
              value.category === cat
                ? 'border-white bg-woods-bark'
                : 'border-woods-bark'
            }`}
          >
            <Text className={`text-xs ${value.category === cat ? 'text-white font-semibold' : 'text-woods-stone'}`}>
              {CATEGORY_LABELS[cat]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
