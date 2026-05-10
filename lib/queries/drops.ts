import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Drop, DropMatchScore, WatchlistItem, DropWithScore } from '@/types/drops';

export const dropKeys = {
  feed: (userId: string) => ['drops', 'feed', userId] as const,
  scores: (userId: string) => ['drops', 'scores', userId] as const,
  watchlist: (userId: string) => ['drops', 'watchlist', userId] as const,
  detail: (dropId: string) => ['drops', 'detail', dropId] as const,
};

export function useDropFeed(userId: string | undefined) {
  return useQuery({
    queryKey: dropKeys.feed(userId ?? ''),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<DropWithScore[]> => {
      const [dropsRes, scoresRes, watchlistRes] = await Promise.all([
        supabase
          .from('drops')
          .select('*, brands(name, slug)')
          .eq('pending_review', false)
          .order('release_date', { ascending: true }),
        supabase
          .from('drop_match_scores')
          .select('drop_id, score, reasoning')
          .eq('user_id', userId!),
        supabase
          .from('watchlist')
          .select('drop_id')
          .eq('user_id', userId!),
      ]);

      if (dropsRes.error) throw dropsRes.error;
      if (scoresRes.error) throw scoresRes.error;
      if (watchlistRes.error) throw watchlistRes.error;

      type ScoreRow = { drop_id: string; score: number; reasoning: string | null };
      type WatchRow = { drop_id: string };
      const scoreMap = new Map(
        ((scoresRes.data ?? []) as ScoreRow[]).map((s) => [s.drop_id, { score: s.score, reasoning: s.reasoning }]),
      );
      const watchedSet = new Set(((watchlistRes.data ?? []) as WatchRow[]).map((w) => w.drop_id));

      const drops = (dropsRes.data ?? []) as Drop[];
      const merged: DropWithScore[] = drops.map((drop) => {
        const scoreRow = scoreMap.get(drop.id);
        return {
          ...drop,
          score: scoreRow?.score ?? null,
          reasoning: scoreRow?.reasoning ?? null,
          isWatched: watchedSet.has(drop.id),
        };
      });

      // Sort: scored drops by descending score, unscored appended by release date
      const scored = merged.filter((d) => d.score !== null).sort((a, b) => b.score! - a.score!);
      const unscored = merged.filter((d) => d.score === null);
      return [...scored, ...unscored];
    },
  });
}

export function useDropDetail(dropId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: dropKeys.detail(dropId ?? ''),
    enabled: !!dropId && !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<DropWithScore | null> => {
      const [dropRes, scoreRes, watchRes] = await Promise.all([
        supabase
          .from('drops')
          .select('*, brands(name, slug)')
          .eq('id', dropId!)
          .single(),
        supabase
          .from('drop_match_scores')
          .select('score, reasoning')
          .eq('user_id', userId!)
          .eq('drop_id', dropId!)
          .maybeSingle(),
        supabase
          .from('watchlist')
          .select('id')
          .eq('user_id', userId!)
          .eq('drop_id', dropId!)
          .maybeSingle(),
      ]);

      if (dropRes.error) throw dropRes.error;
      type ScoreDetailRow = { score: number; reasoning: string | null } | null;
      const drop = dropRes.data as Drop;
      const scoreData = scoreRes.data as ScoreDetailRow;
      return {
        ...drop,
        score: scoreData?.score ?? null,
        reasoning: scoreData?.reasoning ?? null,
        isWatched: !!watchRes.data,
      };
    },
  });
}

export function useScoreDrops(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (accessToken: string) => {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/score-drop`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: '{}',
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `score-drop failed: ${res.status}`);
      }
      return res.json() as Promise<{ scored: number }>;
    },
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: dropKeys.feed(userId) });
      }
    },
  });
}

export function useToggleWatchlist(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ dropId, isWatched }: { dropId: string; isWatched: boolean }) => {
      if (isWatched) {
        const { error } = await supabase
          .from('watchlist')
          .delete()
          .eq('user_id', userId!)
          .eq('drop_id', dropId);
        if (error) throw error;
        return { dropId, isWatched: false };
      } else {
        // any: stub Database type — replaced by supabase gen types in Phase 4 completion
        const { error } = await (supabase as any)
          .from('watchlist')
          .insert({ user_id: userId!, drop_id: dropId });
        if (error) throw error;
        return { dropId, isWatched: true };
      }
    },
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: dropKeys.feed(userId) });
        queryClient.invalidateQueries({ queryKey: dropKeys.watchlist(userId) });
      }
    },
    onMutate: async ({ dropId, isWatched }) => {
      // Optimistic update on the feed
      if (!userId) return;
      await queryClient.cancelQueries({ queryKey: dropKeys.feed(userId) });
      const prev = queryClient.getQueryData<DropWithScore[]>(dropKeys.feed(userId));
      queryClient.setQueryData<DropWithScore[]>(dropKeys.feed(userId), (old) =>
        old?.map((d) => d.id === dropId ? { ...d, isWatched: !isWatched } : d),
      );
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (userId && context?.prev) {
        queryClient.setQueryData(dropKeys.feed(userId), context.prev);
      }
    },
  });
}
