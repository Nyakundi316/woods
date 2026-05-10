import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { StyleProfile } from '@/types/style-dna';

export const styleDNAKeys = {
  mine: ['style-dna', 'me'] as const,
};

export function useStyleProfile(userId: string | undefined) {
  return useQuery({
    queryKey: styleDNAKeys.mine,
    enabled: !!userId,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    queryFn: async () => {
      const { data, error } = await supabase
        .from('style_profiles')
        .select('*')
        .eq('user_id', userId!)
        .maybeSingle();
      if (error) throw error;
      return data as StyleProfile | null;
    },
  });
}
