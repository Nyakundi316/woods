import { useState, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ChatMessage, OutfitPairing } from '@/types/cop-coach';

const BASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;

export function useCopCoach(dropId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (userText: string) => {
    setError(null);

    const userMsg: ChatMessage = { role: 'user', content: userText };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setStreaming(true);

    // Placeholder for streaming response
    const assistantMsg: ChatMessage = { role: 'assistant', content: '' };
    setMessages([...nextMessages, assistantMsg]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      abortRef.current = new AbortController();
      const res = await fetch(`${BASE_URL}/functions/v1/cop-coach`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ dropId, messages: nextMessages }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `cop-coach failed: ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') break;
          try {
            const parsed = JSON.parse(payload) as { text?: string; error?: string };
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.text) {
              accumulated += parsed.text;
              // Update the last message in-place
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: accumulated };
                return updated;
              });
            }
          } catch {
            // Partial JSON chunk — skip
          }
        }
      }
    } catch (e: unknown) {
      if ((e as Error).name === 'AbortError') return;
      const msg = (e as Error).message ?? 'Cop Coach unavailable';
      setError(msg);
      // Remove the empty placeholder on error
      setMessages((prev) => prev.filter((m) => !(m.role === 'assistant' && m.content === '')));
    } finally {
      setStreaming(false);
    }
  }, [dropId, messages]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setStreaming(false);
  }, []);

  return { messages, streaming, error, sendMessage, reset };
}

export function useOutfitPairings(dropId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['outfit-pairings', dropId],
    enabled: !!dropId && enabled,
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<OutfitPairing[]> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const res = await fetch(`${BASE_URL}/functions/v1/outfit-pair`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ dropId }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `outfit-pair failed: ${res.status}`);
      }

      const data = await res.json() as { pairings: OutfitPairing[] };
      return data.pairings;
    },
  });
}
