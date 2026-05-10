# Phase 0 Summary — Bootstrap

## What was built

### Mobile app scaffold
- Expo SDK 54 + TypeScript strict mode, initialized with `create-expo-app --template blank-typescript`
- Expo Router 4 configured as the root navigator via `index.ts → expo-router/entry`
- Route groups created: `(auth)/` (welcome, sign-in, sign-up) and `(app)/(tabs)/` (drops feed, closet, decisions, profile)
- Placeholder screens for every Phase 1–6 route: `drop/[id].tsx`, `cop-coach/[dropId].tsx`, `legit-lens/index.tsx`
- Root index redirects to `/(auth)/welcome` — this will become an auth-state redirect in Phase 1

### Styling
- NativeWind v4 with `babel-preset-expo` + `jsxImportSource: 'nativewind'`
- `global.css` with `@tailwind` directives wired through `metro.config.js → withNativeWind`
- Custom color tokens: `woods-black`, `woods-white`, `woods-cream`, `woods-stone`, `woods-bark`
- Dark UI default — `userInterfaceStyle: dark`, splash/background `#000000`

### Backend wiring
- `lib/supabase.ts` — Supabase client with `ExpoSecureStoreAdapter` (session tokens stored in device Secure Store, never in AsyncStorage)
- `lib/analytics.ts` — PostHog client, disabled gracefully when key is absent
- `lib/sentry.ts` — Sentry init + `sendSentryTestEvent()` called on first render from root `_layout.tsx`
- `lib/errors.ts` — `Result<T, AppError>` type + `captureError()` helper; all 6 error kinds defined

### Database
- `supabase/migrations/0001_initial_schema.sql` — full schema from CLAUDE.md §4:
  - Extensions: `vector`, `uuid-ossp`, `pg_cron`
  - Tables: `profiles`, `style_profiles`, `closet_items`, `brands`, `drops`, `drop_match_scores`, `watchlist`, `cop_decisions`, `auth_scans`
  - RLS enabled on every table, policies written for all CRUD patterns
  - `ivfflat` indexes on both `style_profiles.embedding` and `drops.style_embedding`
  - Auto-create profile trigger on `auth.users` insert
- `supabase/config.toml` with local dev port config and per-function JWT settings

### Edge Functions (stubs)
All six functions created returning `501 Not implemented`:
- `extract-style-dna` (Phase 2)
- `score-drop` (Phase 4)
- `cop-coach` (Phase 5)
- `outfit-pair` (Phase 5)
- `legit-lens` (Phase 6)
- `ingest-drops` (Phase 4)

`_shared/prompts.ts` — all five AI prompts from CLAUDE.md §6 locked as constants.  
`_shared/anthropic.ts` — Anthropic client singleton, model ID constants (`SONNET`, `HAIKU`).  
`_shared/openai.ts` — OpenAI client singleton, model ID constants.

### Env structure
- `.env.example` documents all required vars with explanatory comments
- `.env.local` (gitignored) is the local fill-in-the-blanks file
- `types/database.ts` is a minimal stub; will be replaced by `supabase gen types` in Phase 4

## What was stubbed / deferred
- Auth logic (sign-in, sign-up, OTP, OAuth) — Phase 1
- Style DNA capture flow — Phase 2
- Closet grid — Phase 3
- Drop feed + match scoring + seeded drops — Phase 4
- Cop Coach conversation UI — Phase 5
- Legit Lens camera flow — Phase 6
- M-Pesa / Stripe payments, push notifications — Phase 7
- `types/database.ts` fully typed — Phase 4 (after `supabase gen types`)

## What I'd do differently
- The `ivfflat` index `lists` parameter is set to 100 — this should be tuned to `sqrt(row_count)` once we know approximate data size. For <10k drops, 100 is fine.
- `pg_cron` is enabled as an extension; the scheduled job itself is wired in Phase 4 when `ingest-drops` is implemented.
- Sentry's `@sentry/react-native/expo` plugin requires a `sentry.properties` file with auth token for source maps in production builds. This is a Phase 7 concern but worth noting now.

## Phase 0 Definition of Done — status
- [ ] App boots on iOS Simulator and Android Emulator — **ready to verify** (requires device/simulator)
- [x] Shows black screen with "Woods" wordmark — welcome screen at `/(auth)/welcome`
- [ ] Sentry receives a test event — **fires on first boot** via `sendSentryTestEvent()` in `_layout.tsx`; requires DSN in `.env.local`
- [ ] Schema migration applied and visible in Supabase dashboard — **requires `supabase db push`** with project credentials
