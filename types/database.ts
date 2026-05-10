// Auto-generate this file in Phase 4 via:
//   supabase gen types typescript --project-id <ref> > types/database.ts
// For now, a minimal stub to satisfy the Supabase client generic.
export type Database = {
  public: {
    Tables: Record<string, { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
