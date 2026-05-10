import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ClosetItem, ClosetItemInsert } from '@/types/closet';

export const closetKeys = {
  all: (userId: string) => ['closet', userId] as const,
  item: (id: string) => ['closet', 'item', id] as const,
};

export function useClosetItems(userId: string | undefined) {
  return useQuery({
    queryKey: closetKeys.all(userId ?? ''),
    enabled: !!userId,
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('closet_items')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ClosetItem[];
    },
  });
}

export function useAddClosetItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: ClosetItemInsert) => {
      const { data, error } = await supabase
        .from('closet_items')
        // any: stub Database type — replaced by supabase gen types in Phase 4
        .insert(item as any)
        .select()
        .single();
      if (error) throw error;
      return data as ClosetItem;
    },
    onSuccess: (item) => {
      queryClient.invalidateQueries({ queryKey: closetKeys.all(item.user_id) });
    },
  });
}

export function useUpdateClosetItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<ClosetItem> }) => {
      const { data, error } = await (supabase as any)
        .from('closet_items')
        .update(patch)
        .eq('id', id) // any: stub Database type — replaced by supabase gen types in Phase 4
        .select()
        .single();
      if (error) throw error;
      return data as ClosetItem;
    },
    onSuccess: (item) => {
      queryClient.invalidateQueries({ queryKey: closetKeys.all(item.user_id) });
    },
  });
}

export function useDeleteClosetItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const { error } = await supabase.from('closet_items').delete().eq('id', id);
      if (error) throw error;
      return { id, userId };
    },
    onSuccess: ({ userId }) => {
      queryClient.invalidateQueries({ queryKey: closetKeys.all(userId) });
    },
  });
}
