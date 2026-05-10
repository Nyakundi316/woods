-- Extensions
create extension if not exists "vector" with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists "pg_cron" with schema extensions;

-- ── Profiles (extends auth.users) ───────────────────────────────────────────

create table profiles (
  id               uuid        primary key references auth.users on delete cascade,
  username         text        unique not null,
  display_name     text,
  country_code     text        not null default 'KE',
  shoe_size_us     numeric(3,1),
  shoe_size_eu     numeric(4,1),
  preferred_currency text      not null default 'KES',
  onboarding_completed boolean not null default false,
  created_at       timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- ── Style DNA ───────────────────────────────────────────────────────────────

create table style_profiles (
  user_id          uuid        primary key references profiles on delete cascade,
  embedding        extensions.vector(3072) not null,
  tags             jsonb       not null,
  source_photo_count int       not null,
  confidence_score numeric(3,2) not null,
  generated_at     timestamptz not null default now()
);

create index style_profiles_embedding_idx
  on style_profiles
  using ivfflat (embedding extensions.vector_cosine_ops)
  with (lists = 100);

alter table style_profiles enable row level security;

create policy "Users can view own style profile"
  on style_profiles for select
  using (auth.uid() = user_id);

create policy "Users can upsert own style profile"
  on style_profiles for all
  using (auth.uid() = user_id);

-- ── Closet ──────────────────────────────────────────────────────────────────

create table closet_items (
  id         uuid        primary key default uuid_generate_v4(),
  user_id    uuid        not null references profiles on delete cascade,
  brand      text        not null,
  model      text        not null,
  colorway   text,
  category   text        not null check (category in ('sneaker', 'apparel', 'accessory')),
  photo_url  text        not null,
  embedding  extensions.vector(3072),
  acquired_at date,
  created_at timestamptz not null default now()
);

alter table closet_items enable row level security;

create policy "Users can manage own closet"
  on closet_items for all
  using (auth.uid() = user_id);

-- ── Brands & Drops ──────────────────────────────────────────────────────────

create table brands (
  id   uuid primary key default uuid_generate_v4(),
  name text unique not null,
  slug text unique not null
);

alter table brands enable row level security;

create policy "Authenticated users can read brands"
  on brands for select
  to authenticated
  using (true);

create table drops (
  id                      uuid        primary key default uuid_generate_v4(),
  brand_id                uuid        not null references brands,
  model                   text        not null,
  colorway                text        not null,
  release_date            timestamptz not null,
  retail_price_usd        numeric(10,2),
  retail_price_kes        numeric(10,2),
  estimated_resale_premium numeric(5,2),
  hero_image_url          text        not null,
  description             text,
  raffle_method           text,
  source_url              text,
  style_embedding         extensions.vector(3072),
  pending_review          boolean     not null default false,
  created_at              timestamptz not null default now(),
  unique (brand_id, model, colorway, release_date)
);

create index drops_release_date_idx on drops (release_date);

create index drops_style_embedding_idx
  on drops
  using ivfflat (style_embedding extensions.vector_cosine_ops)
  with (lists = 100);

alter table drops enable row level security;

create policy "Authenticated users can read approved drops"
  on drops for select
  to authenticated
  using (pending_review = false);

-- ── Drop Match Scores ────────────────────────────────────────────────────────

create table drop_match_scores (
  user_id     uuid        not null references profiles on delete cascade,
  drop_id     uuid        not null references drops on delete cascade,
  score       numeric(4,3) not null,
  reasoning   text,
  computed_at timestamptz not null default now(),
  primary key (user_id, drop_id)
);

alter table drop_match_scores enable row level security;

create policy "Users can read own match scores"
  on drop_match_scores for select
  using (auth.uid() = user_id);

create policy "Users can upsert own match scores"
  on drop_match_scores for all
  using (auth.uid() = user_id);

-- ── Watchlist ────────────────────────────────────────────────────────────────

create table watchlist (
  user_id               uuid not null references profiles on delete cascade,
  drop_id               uuid not null references drops on delete cascade,
  notify_minutes_before int  not null default 60,
  added_at              timestamptz not null default now(),
  primary key (user_id, drop_id)
);

alter table watchlist enable row level security;

create policy "Users can manage own watchlist"
  on watchlist for all
  using (auth.uid() = user_id);

-- ── Cop Decisions ────────────────────────────────────────────────────────────

create table cop_decisions (
  id             uuid        primary key default uuid_generate_v4(),
  user_id        uuid        not null references profiles on delete cascade,
  drop_id        uuid        references drops,
  messages       jsonb       not null,
  recommendation text        check (recommendation in ('chase', 'skip', 'wait')),
  created_at     timestamptz not null default now()
);

alter table cop_decisions enable row level security;

create policy "Users can manage own cop decisions"
  on cop_decisions for all
  using (auth.uid() = user_id);

-- ── Auth Scans (Legit Lens) ───────────────────────────────────────────────────

create table auth_scans (
  id          uuid        primary key default uuid_generate_v4(),
  user_id     uuid        not null references profiles on delete cascade,
  photos      jsonb       not null,
  brand_guess text,
  model_guess text,
  confidence  numeric(3,2) not null,
  flags       jsonb       not null,
  verdict     text        not null check (verdict in ('likely_authentic', 'inconclusive', 'likely_replica')),
  created_at  timestamptz not null default now()
);

alter table auth_scans enable row level security;

create policy "Users can manage own auth scans"
  on auth_scans for all
  using (auth.uid() = user_id);

-- ── Helper: auto-create profile on signup ────────────────────────────────────

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
