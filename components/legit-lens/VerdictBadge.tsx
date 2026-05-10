import { View, Text } from 'react-native';
import type { ScanVerdict } from '@/types/legit-lens';
import { VERDICT_LABELS } from '@/types/legit-lens';

const VERDICT_STYLES: Record<ScanVerdict, { container: string; text: string; dot: string }> = {
  likely_authentic: {
    container: 'border border-woods-stone bg-black',
    text: 'text-white',
    dot: 'bg-white',
  },
  inconclusive: {
    container: 'border border-woods-stone bg-black',
    text: 'text-woods-stone',
    dot: 'bg-woods-stone',
  },
  likely_replica: {
    container: 'border border-white bg-white',
    text: 'text-black',
    dot: 'bg-black',
  },
};

type Props = {
  verdict: ScanVerdict;
  confidence: number;
};

export function VerdictBadge({ verdict, confidence }: Props) {
  const styles = VERDICT_STYLES[verdict];
  const pct = Math.round(confidence * 100);

  return (
    <View className={`rounded-sm px-5 py-4 ${styles.container}`}>
      <View className="flex-row items-center gap-2 mb-1">
        <View className={`w-2 h-2 rounded-full ${styles.dot}`} />
        <Text className={`text-base font-bold ${styles.text}`}>
          {VERDICT_LABELS[verdict]}
        </Text>
      </View>
      <Text className="text-woods-stone text-xs">
        Confidence: {pct}%
      </Text>
      <Text className="text-woods-bark text-xs mt-2 leading-relaxed">
        This is a software-aided opinion, not a guarantee. Consult a professional authenticator for high-value purchases.
      </Text>
    </View>
  );
}
