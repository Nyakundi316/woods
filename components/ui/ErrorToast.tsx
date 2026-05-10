import { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';

type Props = {
  message: string | null;
  onDismiss?: () => void;
};

export function ErrorToast({ message, onDismiss }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!message) return;

    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(3000),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => onDismiss?.());
  }, [message]);

  if (!message) return null;

  return (
    <Animated.View
      style={{ opacity }}
      className="absolute bottom-8 left-4 right-4 bg-red-900 border border-red-500 px-4 py-3 rounded-sm"
    >
      <Text className="text-white text-sm">{message}</Text>
    </Animated.View>
  );
}
