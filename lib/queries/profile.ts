import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/profile';

export const profileKeys = {
  mine: ['profile', 'me'] as const,
};

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: profileKeys.mine,
    enabled: !!userId,
    staleTime: 60 * 60 * 1000, // 1 hour
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId!)
        .single();
      if (error) throw error;
      return data as Profile;
    },
  });
}

export function useUpsertProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Profile> & { id: string }) => {
      const { data, error } = await supabase
        .from('profiles')
        .upsert(patch as any, { onConflict: 'id' }) // any: stub Database type has no table shapes yet; fixed in Phase 4 after supabase gen types
        .select()
        .single();
      if (error) throw error;
      return data as Profile;
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(profileKeys.mine, profile);
    },
  });
}
