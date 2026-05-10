import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { captureError } from '@/lib/errors';
import type { AuthScan } from '@/types/legit-lens';

const BASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;

export const scanKeys = {
  all: (userId: string) => ['auth-scans', userId] as const,
};

export function useAuthScans(userId: string | undefined) {
  return useQuery({
    queryKey: scanKeys.all(userId ?? ''),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<AuthScan[]> => {
      const { data, error } = await supabase
        .from('auth_scans')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as AuthScan[];
    },
  });
}

export function useSubmitScan(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (storagePaths: string[]): Promise<AuthScan> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const res = await fetch(`${BASE_URL}/functions/v1/legit-lens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ storage_paths: storagePaths }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        const message = body.error ?? `Legit Lens failed: ${res.status}`;
        captureError({ kind: 'ai', message }, { screen: 'legit-lens' });
        throw new Error(message);
      }

      return res.json() as Promise<AuthScan>;
    },
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: scanKeys.all(userId) });
      }
    },
  });
}

export async function uploadScanPhoto(uri: string, userId: string, slot: number): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  const path = `${userId}/${Date.now()}_slot${slot}.jpg`;
  const { error } = await supabase.storage
    .from('auth-scans')
    .upload(path, blob, { contentType: 'image/jpeg' });
  if (error) throw error;
  return path;
}
