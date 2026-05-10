import { View, Text, ScrollView } from 'react-native';
import type { StyleDNATags } from '@/types/style-dna';
import { confidenceTier } from '@/types/style-dna';

// Rough palette label → hex mapping for colour swatches
const PALETTE_COLOURS: Record<string, string> = {
  black: '#000000', white: '#FFFFFF', cream: '#F5F2EE', beige: '#D4C5A9',
  brown: '#8B6343', tan: '#C19A6B', olive: '#6B7C3A', green: '#2D5016',
  navy: '#1B2A4A', blue: '#2563EB', grey: '#6B7280', gray: '#6B7280',
  red: '#DC2626', orange: '#EA580C', yellow: '#CA8A04', pink: '#DB2777',
  purple: '#7C3AED', 'earth tones': '#8B6343', 'off-white': '#F5F2EE',
};

function colourForLabel(label: string): string {
  const key = label.toLowerCase();
  for (const [k, v] of Object.entries(PALETTE_COLOURS)) {
    if (key.includes(k)) return v;
  }
  return '#8C8680'; // woods-stone fallback
}

function Tag({ label }: { label: string }) {
  return (
    <View className="border border-woods-stone px-3 py-1 rounded-sm mr-2 mb-2">
      <Text className="text-white text-xs tracking-wide">{label}</Text>
    </View>
  );
}

type Props = {
  tags: StyleDNATags;
  confidence: number;
  photoCount: number;
};

export function StyleDNACard({ tags, confidence, photoCount }: Props) {
  const tier = confidenceTier(confidence);

  return (
    <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
      <View className="px-6 pb-8">
        {/* Confidence banner */}
        {tier === 'low' && (
          <View className="bg-yellow-900 border border-yellow-600 px-4 py-3 rounded-sm mb-6">
            <Text className="text-yellow-200 text-sm">
              Based on {photoCount} photo{photoCount !== 1 ? 's' : ''} — add more for sharper matching.
              Your DNA will strengthen as you upload more fits.
            </Text>
          </View>
        )}

        {/* Dominant aesthetic */}
        <Text className="text-woods-stone text-xs tracking-widest uppercase mb-1">
          Your Aesthetic
        </Text>
        <Text className="text-white text-3xl font-bold mb-6 leading-tight">
          {tags.dominant_aesthetic}
        </Text>

        {/* Palette swatches */}
        {tags.palette.length > 0 && (
          <View className="mb-6">
            <Text className="text-woods-stone text-xs tracking-widest uppercase mb-3">
              Your Palette
            </Text>
            <View className="flex-row flex-wrap">
              {tags.palette.map((colour) => (
                <View key={colour} className="mr-3 mb-2 items-center">
                  <View
                    style={{ backgroundColor: colourForLabel(colour), width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#3D3530' }}
                  />
                  <Text className="text-woods-stone text-xs mt-1">{colour}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Silhouettes */}
        {tags.silhouettes.length > 0 && (
          <View className="mb-6">
            <Text className="text-woods-stone text-xs tracking-widest uppercase mb-3">
              Silhouettes
            </Text>
            <View className="flex-row flex-wrap">
              {tags.silhouettes.map((s) => <Tag key={s} label={s} />)}
            </View>
          </View>
        )}

        {/* Eras */}
        {tags.eras.length > 0 && (
          <View className="mb-6">
            <Text className="text-woods-stone text-xs tracking-widest uppercase mb-3">
              Eras
            </Text>
            <View className="flex-row flex-wrap">
              {tags.eras.map((e) => <Tag key={e} label={e} />)}
            </View>
          </View>
        )}

        {/* Formality + brands row */}
        <View className="flex-row gap-8 mb-6">
          <View>
            <Text className="text-woods-stone text-xs tracking-widest uppercase mb-3">
              Formality
            </Text>
            <Tag label={tags.formality} />
          </View>
          {tags.brands_visible.length > 0 && (
            <View>
              <Text className="text-woods-stone text-xs tracking-widest uppercase mb-3">
                Brands
              </Text>
              <View className="flex-row flex-wrap">
                {tags.brands_visible.map((b) => <Tag key={b} label={b} />)}
              </View>
            </View>
          )}
        </View>

        {/* Confidence score */}
        <View className="border-t border-woods-bark pt-4">
          <Text className="text-woods-stone text-xs">
            Style DNA confidence: {Math.round(confidence * 100)}%
            {tier === 'high' ? ' · Strong match data' : tier === 'medium' ? ' · Good match data' : ' · Add more photos to improve'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
