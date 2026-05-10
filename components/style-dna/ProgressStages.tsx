import { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';

export type Stage = {
  label: string;
  detail: string;
  state: 'pending' | 'active' | 'done';
};

type Props = {
  stages: Stage[];
};

function StageRow({ stage, index }: { stage: Stage; index: number }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (stage.state !== 'active') {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [stage.state]);

  const isDone = stage.state === 'done';
  const isActive = stage.state === 'active';

  return (
    <View className="flex-row items-start mb-6">
      {/* Step indicator */}
      <View className={`w-6 h-6 rounded-full items-center justify-center mr-4 mt-0.5 ${
        isDone ? 'bg-white' : isActive ? 'border border-white' : 'border border-woods-bark'
      }`}>
        {isDone
          ? <Text className="text-black text-xs font-bold">✓</Text>
          : <Text className={`text-xs ${isActive ? 'text-white' : 'text-woods-bark'}`}>
              {index + 1}
            </Text>
        }
      </View>

      <View className="flex-1">
        <Animated.Text
          style={{ opacity: isActive ? pulse : 1 }}
          className={`text-base font-semibold mb-0.5 ${
            isDone ? 'text-white' : isActive ? 'text-white' : 'text-woods-bark'
          }`}
        >
          {stage.label}
        </Animated.Text>
        <Text className={`text-sm ${
          isDone || isActive ? 'text-woods-stone' : 'text-woods-bark'
        }`}>
          {stage.detail}
        </Text>
      </View>
    </View>
  );
}

export function ProgressStages({ stages }: Props) {
  return (
    <View className="w-full px-6 py-8">
      {stages.map((stage, i) => (
        <StageRow key={stage.label} stage={stage} index={i} />
      ))}
    </View>
  );
}
