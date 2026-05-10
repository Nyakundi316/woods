import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

// Drop detail — built out in Phase 4
export default function DropDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View className="flex-1 bg-black items-center justify-center">
      <Text className="text-woods-stone">{id}</Text>
    </View>
  );
}
