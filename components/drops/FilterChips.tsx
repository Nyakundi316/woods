import { ScrollView, TouchableOpacity, Text, View } from 'react-native';
import type { DropFilter } from '@/types/drops';

const FILTERS: { key: DropFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'watched', label: 'Watching' },
  { key: 'sneaker', label: 'Sneakers' },
  { key: 'apparel', label: 'Apparel' },
  { key: 'accessory', label: 'Accessories' },
];

type Props = {
  active: DropFilter;
  onSelect: (filter: DropFilter) => void;
};

export function FilterChips({ active, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 8 }}
    >
      {FILTERS.map(({ key, label }) => (
        <TouchableOpacity
          key={key}
          onPress={() => onSelect(key)}
          className={`px-4 py-1.5 rounded-full border ${
            active === key
              ? 'bg-white border-white'
              : 'border-woods-bark bg-transparent'
          }`}
        >
          <Text className={`text-xs font-medium ${active === key ? 'text-black' : 'text-woods-stone'}`}>
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
