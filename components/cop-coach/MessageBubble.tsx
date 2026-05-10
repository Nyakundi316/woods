import { View, Text } from 'react-native';
import type { ChatMessage } from '@/types/cop-coach';

type Props = {
  message: ChatMessage;
  isStreaming?: boolean;
};

export function MessageBubble({ message, isStreaming }: Props) {
  const isUser = message.role === 'user';

  return (
    <View className={`mb-3 ${isUser ? 'items-end' : 'items-start'}`}>
      {!isUser && (
        <Text className="text-woods-stone text-xs mb-1 ml-1">Cop Coach</Text>
      )}
      <View
        className={`max-w-[85%] px-4 py-3 rounded-sm ${
          isUser ? 'bg-white' : 'bg-woods-bark'
        }`}
      >
        <Text className={`text-sm leading-relaxed ${isUser ? 'text-black' : 'text-white'}`}>
          {message.content}
          {isStreaming && !isUser && (
            <Text className="text-woods-stone"> ▍</Text>
          )}
        </Text>
      </View>
    </View>
  );
}
