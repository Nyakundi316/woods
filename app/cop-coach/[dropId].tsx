import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

// Cop Coach conversation — built out in Phase 5
export default function CopCoachScreen() {
  const { dropId } = useLocalSearchParams<{ dropId: string }>();
  return (
    <View className="flex-1 bg-black items-center justify-center">
      <Text className="text-woods-stone">Cop Coach — Phase 5 ({dropId})</Text>
    </View>
  );
}
