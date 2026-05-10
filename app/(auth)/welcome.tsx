import { View, Text } from 'react-native';
import { Link } from 'expo-router';

export default function WelcomeScreen() {
  return (
    <View className="flex-1 bg-black items-center justify-center px-6">
      <Text className="text-white text-6xl font-bold tracking-widest mb-2">
        WOODS
      </Text>
      <Text className="text-woods-stone text-sm tracking-widest uppercase mb-16">
        Your sneaker brain
      </Text>

      <Link
        href="/(auth)/sign-in"
        className="w-full bg-white py-4 rounded-sm items-center mb-4"
      >
        <Text className="text-black font-semibold text-base tracking-wide text-center">
          Sign In
        </Text>
      </Link>

      <Link
        href="/(auth)/sign-up"
        className="w-full border border-woods-stone py-4 rounded-sm items-center"
      >
        <Text className="text-white font-semibold text-base tracking-wide text-center">
          Create Account
        </Text>
      </Link>
    </View>
  );
}
