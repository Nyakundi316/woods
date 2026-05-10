import { View, Text } from 'react-native';
import type { ScanFlag } from '@/types/legit-lens';

const SEVERITY_STYLES: Record<ScanFlag['severity'], { badge: string; text: string }> = {
  low:    { badge: 'bg-woods-bark',  text: 'text-woods-stone' },
  medium: { badge: 'bg-woods-bark border border-woods-stone', text: 'text-woods-stone' },
  high:   { badge: 'bg-white',       text: 'text-black' },
};

type Props = {
  flag: ScanFlag;
};

export function FlagCard({ flag }: Props) {
  const styles = SEVERITY_STYLES[flag.severity];
  return (
    <View className="bg-woods-bark rounded-sm p-4 mb-2">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-white text-sm font-semibold">{flag.area}</Text>
        <View className={`px-2 py-0.5 rounded-sm ${styles.badge}`}>
          <Text className={`text-xs font-semibold ${styles.text}`}>
            {flag.severity.toUpperCase()}
          </Text>
        </View>
      </View>
      <Text className="text-woods-stone text-xs leading-relaxed">{flag.concern}</Text>
    </View>
  );
}
