import { View, Text } from 'react-native';
import { Link } from 'expo-router';
import { Button } from '@/components/ui/Button';

export default function WelcomeScreen() {
  return (
    <View className="flex-1 bg-black items-center justify-center px-6">
      <Text className="text-white text-6xl font-bold tracking-widest mb-2">
        WOODS
      </Text>
      <Text className="text-woods-stone text-sm tracking-widest uppercase mb-20">
        Your sneaker brain
      </Text>

      <View className="w-full gap-3">
        <Link href="/(auth)/sign-up" asChild>
          <Button label="Create Account" variant="primary" />
        </Link>
        <Link href="/(auth)/sign-in" asChild>
          <Button label="Sign In" variant="secondary" />
        </Link>
        <Link href="/(auth)/verify-otp" asChild>
          <Button label="Continue with Phone" variant="ghost" />
        </Link>
      </View>
    </View>
  );
}
