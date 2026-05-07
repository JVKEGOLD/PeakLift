create extension if not exists pgcrypto;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  display_name text not null,
  photo_url text,
  bio text not null default '',
  goal text not null default 'Build strength consistently',
  following uuid[] not null default '{}',
  followers uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  weeks jsonb not null default '[]'::jsonb,
  item_count integer not null default 0 check (item_count >= 0),
  is_public boolean not null default false,
  source_routine_id uuid,
  author_name text,
  author_photo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.custom_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  muscle text not null,
  equipment text,
  video_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.nutrition_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  meal text not null,
  calories integer not null default 0 check (calories >= 0),
  protein integer not null default 0 check (protein >= 0),
  carbs integer not null default 0 check (carbs >= 0),
  fat integer not null default 0 check (fat >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  routine_id uuid,
  routine_name text,
  user_name text not null,
  user_photo text,
  duration integer not null default 1 check (duration >= 1),
  volume numeric not null default 0 check (volume >= 0),
  exercise_count integer not null default 0 check (exercise_count >= 0),
  notes text not null default '',
  is_private boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.workout_comments (
  id uuid primary key default gen_random_uuid(),
  workout_log_id uuid not null references public.workout_logs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  user_name text not null,
  text text not null check (length(trim(text)) > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.workout_likes (
  workout_log_id uuid not null references public.workout_logs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (workout_log_id, user_id)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('routine', 'workout_log', 'comment')),
  target_id uuid not null,
  target_owner_id uuid,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'open' check (status in ('open', 'reviewing', 'closed')),
  created_at timestamptz not null default now()
);

create index if not exists profiles_updated_at_idx on public.profiles(updated_at desc);
create index if not exists routines_user_updated_idx on public.routines(user_id, updated_at desc);
create index if not exists routines_public_updated_idx on public.routines(updated_at desc) where is_public = true;
create index if not exists custom_exercises_user_name_idx on public.custom_exercises(user_id, name);
create index if not exists nutrition_user_created_idx on public.nutrition_entries(user_id, created_at desc);
create index if not exists workout_logs_user_created_idx on public.workout_logs(user_id, created_at desc);
create index if not exists workout_logs_public_created_idx on public.workout_logs(created_at desc) where is_private = false;
create index if not exists workout_comments_log_created_idx on public.workout_comments(workout_log_id, created_at asc);
create index if not exists workout_comments_user_idx on public.workout_comments(user_id);
create index if not exists workout_likes_user_idx on public.workout_likes(user_id);
create index if not exists reports_reporter_created_idx on public.reports(reporter_id, created_at desc);

create or replace trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

create or replace trigger routines_touch_updated_at
before update on public.routines
for each row execute function public.touch_updated_at();

create or replace trigger custom_exercises_touch_updated_at
before update on public.custom_exercises
for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.routines enable row level security;
alter table public.custom_exercises enable row level security;
alter table public.nutrition_entries enable row level security;
alter table public.workout_logs enable row level security;
alter table public.workout_comments enable row level security;
alter table public.workout_likes enable row level security;
alter table public.reports enable row level security;

create policy "profiles_select_own" on public.profiles for select using ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles for insert with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "profiles_delete_own" on public.profiles for delete using ((select auth.uid()) = id);

create policy "routines_select_own_or_public" on public.routines for select using (is_public = true or (select auth.uid()) = user_id);
create policy "routines_insert_own" on public.routines for insert with check ((select auth.uid()) = user_id);
create policy "routines_update_own" on public.routines for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "routines_delete_own" on public.routines for delete using ((select auth.uid()) = user_id);

create policy "custom_exercises_select_own" on public.custom_exercises for select using ((select auth.uid()) = user_id);
create policy "custom_exercises_insert_own" on public.custom_exercises for insert with check ((select auth.uid()) = user_id);
create policy "custom_exercises_update_own" on public.custom_exercises for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "custom_exercises_delete_own" on public.custom_exercises for delete using ((select auth.uid()) = user_id);

create policy "nutrition_select_own" on public.nutrition_entries for select using ((select auth.uid()) = user_id);
create policy "nutrition_insert_own" on public.nutrition_entries for insert with check ((select auth.uid()) = user_id);
create policy "nutrition_delete_own" on public.nutrition_entries for delete using ((select auth.uid()) = user_id);

create policy "workout_logs_select_public_or_own" on public.workout_logs for select using (is_private = false or (select auth.uid()) = user_id);
create policy "workout_logs_insert_own" on public.workout_logs for insert with check ((select auth.uid()) = user_id);
create policy "workout_logs_update_own" on public.workout_logs for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "workout_logs_delete_own" on public.workout_logs for delete using ((select auth.uid()) = user_id);

create policy "workout_comments_select_visible" on public.workout_comments for select using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.workout_logs logs
    where logs.id = workout_log_id
      and (logs.is_private = false or logs.user_id = (select auth.uid()))
  )
);
create policy "workout_comments_insert_visible" on public.workout_comments for insert with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.workout_logs logs
    where logs.id = workout_log_id
      and (logs.is_private = false or logs.user_id = (select auth.uid()))
  )
);
create policy "workout_comments_update_own" on public.workout_comments for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "workout_comments_delete_own" on public.workout_comments for delete using (user_id = (select auth.uid()));

create policy "workout_likes_select_visible" on public.workout_likes for select using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.workout_logs logs
    where logs.id = workout_log_id
      and (logs.is_private = false or logs.user_id = (select auth.uid()))
  )
);
create policy "workout_likes_insert_visible" on public.workout_likes for insert with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.workout_logs logs
    where logs.id = workout_log_id
      and (logs.is_private = false or logs.user_id = (select auth.uid()))
  )
);
create policy "workout_likes_delete_own" on public.workout_likes for delete using (user_id = (select auth.uid()));

create policy "reports_insert_own" on public.reports for insert with check (reporter_id = (select auth.uid()));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  preferred_name text;
  avatar text;
begin
  preferred_name := coalesce(
    new.raw_user_meta_data ->> 'username',
    new.raw_user_meta_data ->> 'display_name',
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    split_part(new.email, '@', 1),
    'Peak Lifter'
  );
  avatar := coalesce(
    new.raw_user_meta_data ->> 'photo_url',
    new.raw_user_meta_data ->> 'avatar_url',
    new.raw_user_meta_data ->> 'picture'
  );

  insert into public.profiles (id, username, display_name, photo_url)
  values (new.id, preferred_name, preferred_name, avatar)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.delete_current_user()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid;
begin
  current_user_id := auth.uid();
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  delete from auth.users where id = current_user_id;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.delete_current_user() from public, anon;
grant execute on function public.delete_current_user() to authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'routines',
    'nutrition_entries',
    'workout_logs',
    'workout_comments',
    'workout_likes'
  ] loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end $$;
