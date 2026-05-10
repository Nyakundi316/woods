import { useState, useRef, useEffect } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useDropDetail } from '@/lib/queries/drops';
import { useCopCoach, useOutfitPairings } from '@/lib/queries/cop-coach';
import { DropContextCard } from '@/components/cop-coach/DropContextCard';
import { MessageBubble } from '@/components/cop-coach/MessageBubble';
import { OutfitPairingCard } from '@/components/cop-coach/OutfitPairingCard';
import { ErrorToast } from '@/components/ui/ErrorToast';
import type { ChatMessage } from '@/types/cop-coach';

const STARTER_PROMPTS = [
  'Should I cop this?',
  'Does this fit my style?',
  'Show me outfit pairings',
];

export default function CopCoachScreen() {
  const { dropId } = useLocalSearchParams<{ dropId: string }>();
  const { session } = useAuthStore();
  const userId = session?.user.id;

  const { data: drop, isLoading: dropLoading } = useDropDetail(dropId, userId);
  const { messages, streaming, error, sendMessage } = useCopCoach(dropId);

  const [input, setInput] = useState('');
  const [showPairings, setShowPairings] = useState(false);
  const [toastError, setToastError] = useState<string | null>(null);
  type ListItem = ChatMessage | { type: 'pairings' } | { type: 'starters' };
  const listRef = useRef<FlatList<ListItem>>(null);

  // Trigger outfit pairings when user asks for them
  const wantsPairings =
    showPairings ||
    messages.some((m) => m.role === 'user' && /outfit|pair/i.test(m.content));

  const {
    data: pairings,
    isLoading: pairingsLoading,
  } = useOutfitPairings(dropId, wantsPairings);

  // Show streaming error in toast
  useEffect(() => {
    if (error) setToastError(error);
  }, [error]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || streaming) return;
    if (/outfit|pair/i.test(text)) setShowPairings(true);
    setInput('');
    sendMessage(text);
  };

  const handleStarter = (prompt: string) => {
    if (/outfit|pair/i.test(prompt)) setShowPairings(true);
    sendMessage(prompt);
  };

  if (dropLoading || !drop) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator color="#FFFFFF" />
      </View>
    );
  }

  const allItems: (ChatMessage | { type: 'pairings' } | { type: 'starters' })[] = [];

  if (messages.length === 0) {
    allItems.push({ type: 'starters' });
  } else {
    messages.forEach((m) => allItems.push(m));
    if (wantsPairings) allItems.push({ type: 'pairings' });
  }

  return (
    <View className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-14 pb-3">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-woods-stone text-base">←</Text>
        </TouchableOpacity>
        <Text className="text-white text-base font-bold tracking-widest">COP COACH</Text>
      </View>

      {/* Drop context strip */}
      <DropContextCard drop={drop} />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={allItems}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            if ('type' in item && item.type === 'starters') {
              return (
                <View>
                  <Text className="text-woods-stone text-xs text-center mb-6 mt-4">
                    Ask anything about this drop.
                  </Text>
                  <View className="gap-2">
                    {STARTER_PROMPTS.map((p) => (
                      <TouchableOpacity
                        key={p}
                        onPress={() => handleStarter(p)}
                        className="border border-woods-bark px-4 py-3 rounded-sm"
                      >
                        <Text className="text-woods-stone text-sm">{p}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              );
            }

            if ('type' in item && item.type === 'pairings') {
              return (
                <View className="mt-4">
                  <Text className="text-woods-stone text-xs tracking-widest uppercase mb-3">
                    Outfit Pairings
                  </Text>
                  {pairingsLoading ? (
                    <View className="items-center py-6">
                      <ActivityIndicator color="#8C8680" />
                      <Text className="text-woods-stone text-xs mt-2">Building outfits…</Text>
                    </View>
                  ) : pairings && pairings.length > 0 ? (
                    pairings.map((p, i) => <OutfitPairingCard key={i} pairing={p} index={i} />)
                  ) : (
                    <Text className="text-woods-stone text-sm">
                      No outfit pairings available. Add more items to your closet.
                    </Text>
                  )}
                </View>
              );
            }

            const msg = item as ChatMessage;
            const isLast = index === allItems.length - 1;
            return (
              <MessageBubble
                message={msg}
                isStreaming={streaming && isLast && msg.role === 'assistant'}
              />
            );
          }}
        />

        {/* Input bar */}
        <View className="flex-row items-end px-4 py-3 border-t border-woods-bark gap-3">
          <TextInput
            className="flex-1 bg-woods-bark text-white text-sm px-4 py-3 rounded-sm"
            placeholder="Ask Cop Coach…"
            placeholderTextColor="#8C8680"
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            blurOnSubmit
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!input.trim() || streaming}
            className={`px-4 py-3 rounded-sm ${
              !input.trim() || streaming ? 'bg-woods-bark' : 'bg-white'
            }`}
          >
            {streaming ? (
              <ActivityIndicator color="#8C8680" size="small" />
            ) : (
              <Text className={`text-sm font-semibold ${!input.trim() ? 'text-woods-stone' : 'text-black'}`}>
                Send
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <ErrorToast message={toastError} onDismiss={() => setToastError(null)} />
    </View>
  );
}
