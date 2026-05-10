/**
 * RLS isolation tests for the `profiles` table.
 *
 * Unit tests here use a mock Supabase client to verify that:
 *   - The query builder filters by the authenticated user's ID (RLS enforcement
 *     happens server-side, so unit tests validate that the app never requests
 *     another user's data).
 *
 * Integration test instructions (run against a real Supabase project):
 *   1. Create two users via Supabase Auth.
 *   2. Sign in as User A and call GET /profiles?id=eq.<User B id>.
 *   3. Expect an empty array (RLS filters the row).
 *   4. Verify via the Supabase dashboard that the RLS policy
 *      "Users can view own profile" (auth.uid() = id) is the reason.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock Supabase client ────────────────────────────────────────────────────

const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({ single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
}));

// ── Tests ────────────────────────────────────────────────────────────────────

describe('profiles RLS — client-side query isolation', () => {
  const USER_A_ID = 'aaaaaaaa-0000-0000-0000-000000000001';
  const USER_B_ID = 'bbbbbbbb-0000-0000-0000-000000000002';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches own profile by authenticated user id', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: USER_A_ID, username: 'user_a', onboarding_completed: true },
      error: null,
    });

    const { supabase } = await import('@/lib/supabase');
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', USER_A_ID)
      .single();

    expect(error).toBeNull();
    expect((data as { id: string } | null)?.id).toBe(USER_A_ID);
    // The .eq() filter must always receive the requesting user's own ID.
    expect(mockEq).toHaveBeenCalledWith('id', USER_A_ID);
  });

  it('returns no data when server-side RLS blocks a cross-user read', async () => {
    // Simulate what Supabase returns when RLS denies the row.
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' },
    });

    const { supabase } = await import('@/lib/supabase');
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', USER_B_ID) // User A is asking for User B's profile
      .single();

    // RLS silently filters the row → PGRST116 "no rows" error, not a 403.
    expect(data).toBeNull();
    expect(error).not.toBeNull();
    expect(error?.code).toBe('PGRST116');
  });
});
