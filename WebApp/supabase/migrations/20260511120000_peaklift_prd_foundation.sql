create extension if not exists pgcrypto;

alter table public.profiles
  add column if not exists name text,
  add column if not exists training_goal text not null default 'Build strength consistently',
  add column if not exists experience_level text not null default 'intermediate',
  add column if not exists privacy_status text not null default 'public';

alter table public.profiles
  drop constraint if exists profiles_experience_level_check,
  add constraint profiles_experience_level_check
    check (experience_level in ('beginner', 'intermediate', 'advanced', 'coach')),
  drop constraint if exists profiles_privacy_status_check,
  add constraint profiles_privacy_status_check
    check (privacy_status in ('public', 'friends_only', 'private'));

with duplicate_usernames as (
  select
    id,
    row_number() over (
      partition by lower(username)
      order by created_at nulls last, id
    ) as duplicate_rank
  from public.profiles
  where username is not null
)
update public.profiles profiles
set username = concat(profiles.username, '-', left(profiles.id::text, 6))
from duplicate_usernames
where profiles.id = duplicate_usernames.id
  and duplicate_usernames.duplicate_rank > 1;

create unique index if not exists profiles_username_unique_idx
  on public.profiles (lower(username));

update public.profiles
set
  name = coalesce(name, display_name, username),
  training_goal = coalesce(training_goal, goal, 'Build strength consistently')
where name is null or training_goal is null;

create table if not exists public.exercises (
  id text primary key,
  name text not null,
  category text not null default 'strength',
  muscle_group text not null default 'General',
  equipment text,
  is_custom boolean not null default false,
  created_by_user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exercises_custom_owner_check check (
    (is_custom = false and created_by_user_id is null)
    or (is_custom = true and created_by_user_id is not null)
  )
);

create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  visibility text not null default 'private' check (visibility in ('private', 'friends_only', 'public')),
  source_workout_id uuid references public.workouts(id) on delete set null,
  original_creator_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  exercise_id text not null references public.exercises(id) on delete restrict,
  exercise_order integer not null default 0 check (exercise_order >= 0),
  sets integer not null default 3 check (sets >= 0),
  reps text not null default '',
  target_weight numeric check (target_weight is null or target_weight >= 0),
  target_rpe numeric check (target_rpe is null or (target_rpe >= 0 and target_rpe <= 10)),
  rest_time_seconds integer check (rest_time_seconds is null or rest_time_seconds >= 0),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  goal text not null default '',
  duration_weeks integer not null default 4 check (duration_weeks > 0),
  visibility text not null default 'private' check (visibility in ('private', 'friends_only', 'public')),
  source_program_id uuid references public.programs(id) on delete set null,
  original_creator_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.program_days (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  week_number integer not null check (week_number > 0),
  day_number integer not null check (day_number between 1 and 7),
  workout_id uuid references public.workouts(id) on delete set null,
  is_rest_day boolean not null default false,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint program_days_workout_or_rest_check check (is_rest_day = true or workout_id is not null)
);

create unique index if not exists program_days_unique_day_idx
  on public.program_days(program_id, week_number, day_number);

create table if not exists public.active_programs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  program_id uuid not null references public.programs(id) on delete cascade,
  started_at date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workout_logs
  add column if not exists workout_id uuid references public.workouts(id) on delete set null,
  add column if not exists program_id uuid references public.programs(id) on delete set null,
  add column if not exists date_completed timestamptz not null default now(),
  add column if not exists perceived_difficulty numeric
    check (perceived_difficulty is null or (perceived_difficulty >= 0 and perceived_difficulty <= 10));

update public.workout_logs
set date_completed = coalesce(date_completed, created_at, now())
where date_completed is null;

create table if not exists public.set_logs (
  id uuid primary key default gen_random_uuid(),
  workout_log_id uuid not null references public.workout_logs(id) on delete cascade,
  exercise_id text not null references public.exercises(id) on delete restrict,
  set_number integer not null check (set_number > 0),
  reps integer not null default 0 check (reps >= 0),
  weight numeric not null default 0 check (weight >= 0),
  rpe numeric check (rpe is null or (rpe >= 0 and rpe <= 10)),
  is_warmup boolean not null default false,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.personal_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id text not null references public.exercises(id) on delete restrict,
  pr_type text not null check (pr_type in ('heaviest_weight', 'estimated_1rm', 'best_volume_set')),
  value numeric not null check (value >= 0),
  weight numeric not null default 0 check (weight >= 0),
  reps integer not null default 0 check (reps >= 0),
  estimated_1rm numeric not null default 0 check (estimated_1rm >= 0),
  workout_log_id uuid references public.workout_logs(id) on delete set null,
  achieved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists personal_records_best_idx
  on public.personal_records(user_id, exercise_id, pr_type);

create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_user_id uuid not null references auth.users(id) on delete cascade,
  following_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'accepted' check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint follows_no_self_check check (follower_user_id <> following_user_id)
);

create unique index if not exists follows_unique_pair_idx
  on public.follows(follower_user_id, following_user_id);

create table if not exists public.shared_content (
  id uuid primary key default gen_random_uuid(),
  sender_user_id uuid not null references auth.users(id) on delete cascade,
  recipient_user_id uuid references auth.users(id) on delete cascade,
  content_type text not null check (content_type in ('workout', 'program')),
  content_id uuid not null,
  share_token text not null default encode(gen_random_bytes(18), 'hex'),
  share_status text not null default 'pending' check (share_status in ('pending', 'accepted', 'declined', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists shared_content_token_idx
  on public.shared_content(share_token);

create index if not exists exercises_custom_owner_idx on public.exercises(created_by_user_id, name) where is_custom = true;
create index if not exists workouts_user_updated_idx on public.workouts(user_id, updated_at desc);
create index if not exists workouts_public_updated_idx on public.workouts(updated_at desc) where visibility = 'public';
create index if not exists workout_exercises_workout_order_idx on public.workout_exercises(workout_id, exercise_order);
create index if not exists programs_user_updated_idx on public.programs(user_id, updated_at desc);
create index if not exists programs_public_updated_idx on public.programs(updated_at desc) where visibility = 'public';
create index if not exists active_programs_program_idx on public.active_programs(program_id);
create index if not exists workout_logs_completed_idx on public.workout_logs(user_id, date_completed desc);
create index if not exists set_logs_log_set_idx on public.set_logs(workout_log_id, set_number);
create index if not exists set_logs_exercise_idx on public.set_logs(exercise_id);
create index if not exists personal_records_user_exercise_idx on public.personal_records(user_id, exercise_id);
create index if not exists shared_content_recipient_idx on public.shared_content(recipient_user_id, created_at desc);
create index if not exists shared_content_sender_idx on public.shared_content(sender_user_id, created_at desc);

insert into public.exercises (id, name, category, muscle_group, equipment, is_custom)
values
  ('bench-press', 'Bench Press', 'strength', 'Chest', 'Barbell', false),
  ('incline-dumbbell-press', 'Incline Dumbbell Press', 'strength', 'Chest', 'Dumbbells', false),
  ('squat', 'Back Squat', 'strength', 'Legs', 'Barbell', false),
  ('deadlift', 'Deadlift', 'strength', 'Posterior Chain', 'Barbell', false),
  ('romanian-deadlift', 'Romanian Deadlift', 'strength', 'Hamstrings', 'Barbell', false),
  ('lat-pulldown', 'Lat Pulldown', 'strength', 'Back', 'Cable', false),
  ('seated-row', 'Seated Cable Row', 'strength', 'Back', 'Cable', false),
  ('shoulder-press', 'Shoulder Press', 'strength', 'Shoulders', 'Dumbbells', false),
  ('overhead-press', 'Overhead Press', 'strength', 'Shoulders', 'Barbell', false),
  ('pull-up', 'Pull-Up', 'strength', 'Back', 'Bodyweight', false),
  ('barbell-row', 'Barbell Row', 'strength', 'Back', 'Barbell', false),
  ('lateral-raise', 'Lateral Raise', 'strength', 'Shoulders', 'Dumbbells', false),
  ('barbell-curl', 'Barbell Curl', 'strength', 'Biceps', 'Barbell', false),
  ('triceps-pushdown', 'Triceps Pushdown', 'strength', 'Triceps', 'Cable', false),
  ('leg-press', 'Leg Press', 'strength', 'Legs', 'Machine', false),
  ('leg-curl', 'Leg Curl', 'strength', 'Hamstrings', 'Machine', false),
  ('calf-raise', 'Standing Calf Raise', 'strength', 'Calves', 'Machine', false),
  ('plank', 'Plank', 'strength', 'Core', 'Bodyweight', false)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  muscle_group = excluded.muscle_group,
  equipment = excluded.equipment,
  is_custom = false,
  created_by_user_id = null,
  updated_at = now();

create or replace trigger exercises_touch_updated_at
before update on public.exercises
for each row execute function public.touch_updated_at();

create or replace trigger workouts_touch_updated_at
before update on public.workouts
for each row execute function public.touch_updated_at();

create or replace trigger workout_exercises_touch_updated_at
before update on public.workout_exercises
for each row execute function public.touch_updated_at();

create or replace trigger programs_touch_updated_at
before update on public.programs
for each row execute function public.touch_updated_at();

create or replace trigger program_days_touch_updated_at
before update on public.program_days
for each row execute function public.touch_updated_at();

create or replace trigger active_programs_touch_updated_at
before update on public.active_programs
for each row execute function public.touch_updated_at();

create or replace trigger personal_records_touch_updated_at
before update on public.personal_records
for each row execute function public.touch_updated_at();

create or replace trigger follows_touch_updated_at
before update on public.follows
for each row execute function public.touch_updated_at();

create or replace trigger shared_content_touch_updated_at
before update on public.shared_content
for each row execute function public.touch_updated_at();

alter table public.exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.programs enable row level security;
alter table public.program_days enable row level security;
alter table public.active_programs enable row level security;
alter table public.set_logs enable row level security;
alter table public.personal_records enable row level security;
alter table public.follows enable row level security;
alter table public.shared_content enable row level security;

grant select, insert, update, delete on
  public.exercises,
  public.workouts,
  public.workout_exercises,
  public.programs,
  public.program_days,
  public.active_programs,
  public.workout_logs,
  public.set_logs,
  public.personal_records,
  public.follows,
  public.shared_content
to authenticated;

create policy "profiles_select_discoverable" on public.profiles for select using (
  id = (select auth.uid())
  or privacy_status = 'public'
  or exists (
    select 1 from public.follows f
    where f.status = 'accepted'
      and f.follower_user_id = (select auth.uid())
      and f.following_user_id = profiles.id
  )
);

create policy "exercises_select_library" on public.exercises for select using (
  is_custom = false or created_by_user_id = (select auth.uid())
);
create policy "exercises_insert_custom_own" on public.exercises for insert with check (
  is_custom = true and created_by_user_id = (select auth.uid())
);
create policy "exercises_update_custom_own" on public.exercises for update using (
  is_custom = true and created_by_user_id = (select auth.uid())
) with check (
  is_custom = true and created_by_user_id = (select auth.uid())
);
create policy "exercises_delete_custom_own" on public.exercises for delete using (
  is_custom = true and created_by_user_id = (select auth.uid())
);

create policy "workouts_select_visible" on public.workouts for select using (
  user_id = (select auth.uid())
  or visibility = 'public'
  or (
    visibility = 'friends_only'
    and exists (
      select 1 from public.follows f
      where f.status = 'accepted'
        and f.follower_user_id = (select auth.uid())
        and f.following_user_id = workouts.user_id
    )
  )
);
create policy "workouts_insert_own" on public.workouts for insert with check (user_id = (select auth.uid()));
create policy "workouts_update_own" on public.workouts for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "workouts_delete_own" on public.workouts for delete using (user_id = (select auth.uid()));

create policy "workout_exercises_select_visible" on public.workout_exercises for select using (
  exists (select 1 from public.workouts w where w.id = workout_id)
);
create policy "workout_exercises_insert_own" on public.workout_exercises for insert with check (
  exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = (select auth.uid()))
);
create policy "workout_exercises_update_own" on public.workout_exercises for update using (
  exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = (select auth.uid()))
) with check (
  exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = (select auth.uid()))
);
create policy "workout_exercises_delete_own" on public.workout_exercises for delete using (
  exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = (select auth.uid()))
);

create policy "programs_select_visible" on public.programs for select using (
  user_id = (select auth.uid())
  or visibility = 'public'
  or (
    visibility = 'friends_only'
    and exists (
      select 1 from public.follows f
      where f.status = 'accepted'
        and f.follower_user_id = (select auth.uid())
        and f.following_user_id = programs.user_id
    )
  )
);
create policy "programs_insert_own" on public.programs for insert with check (user_id = (select auth.uid()));
create policy "programs_update_own" on public.programs for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "programs_delete_own" on public.programs for delete using (user_id = (select auth.uid()));

create policy "program_days_select_visible" on public.program_days for select using (
  exists (select 1 from public.programs p where p.id = program_id)
);
create policy "program_days_insert_own" on public.program_days for insert with check (
  exists (select 1 from public.programs p where p.id = program_id and p.user_id = (select auth.uid()))
);
create policy "program_days_update_own" on public.program_days for update using (
  exists (select 1 from public.programs p where p.id = program_id and p.user_id = (select auth.uid()))
) with check (
  exists (select 1 from public.programs p where p.id = program_id and p.user_id = (select auth.uid()))
);
create policy "program_days_delete_own" on public.program_days for delete using (
  exists (select 1 from public.programs p where p.id = program_id and p.user_id = (select auth.uid()))
);

create policy "active_programs_select_own" on public.active_programs for select using (user_id = (select auth.uid()));
create policy "active_programs_insert_own" on public.active_programs for insert with check (user_id = (select auth.uid()));
create policy "active_programs_update_own" on public.active_programs for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "active_programs_delete_own" on public.active_programs for delete using (user_id = (select auth.uid()));

create policy "set_logs_select_visible" on public.set_logs for select using (
  exists (
    select 1 from public.workout_logs logs
    where logs.id = workout_log_id
      and (logs.is_private = false or logs.user_id = (select auth.uid()))
  )
);
create policy "set_logs_insert_own" on public.set_logs for insert with check (
  exists (
    select 1 from public.workout_logs logs
    where logs.id = workout_log_id
      and logs.user_id = (select auth.uid())
  )
);
create policy "set_logs_update_own" on public.set_logs for update using (
  exists (
    select 1 from public.workout_logs logs
    where logs.id = workout_log_id
      and logs.user_id = (select auth.uid())
  )
) with check (
  exists (
    select 1 from public.workout_logs logs
    where logs.id = workout_log_id
      and logs.user_id = (select auth.uid())
  )
);
create policy "set_logs_delete_own" on public.set_logs for delete using (
  exists (
    select 1 from public.workout_logs logs
    where logs.id = workout_log_id
      and logs.user_id = (select auth.uid())
  )
);

create policy "personal_records_select_visible" on public.personal_records for select using (
  user_id = (select auth.uid())
  or exists (select 1 from public.profiles p where p.id = user_id and p.privacy_status = 'public')
  or exists (
    select 1 from public.follows f
    where f.status = 'accepted'
      and f.follower_user_id = (select auth.uid())
      and f.following_user_id = personal_records.user_id
  )
);
create policy "personal_records_insert_own" on public.personal_records for insert with check (user_id = (select auth.uid()));
create policy "personal_records_update_own" on public.personal_records for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "personal_records_delete_own" on public.personal_records for delete using (user_id = (select auth.uid()));

create policy "follows_select_involved" on public.follows for select using (
  follower_user_id = (select auth.uid()) or following_user_id = (select auth.uid())
);
create policy "follows_insert_own" on public.follows for insert with check (follower_user_id = (select auth.uid()));
create policy "follows_update_involved" on public.follows for update using (
  follower_user_id = (select auth.uid()) or following_user_id = (select auth.uid())
) with check (
  follower_user_id = (select auth.uid()) or following_user_id = (select auth.uid())
);
create policy "follows_delete_involved" on public.follows for delete using (
  follower_user_id = (select auth.uid()) or following_user_id = (select auth.uid())
);

create policy "shared_content_select_involved" on public.shared_content for select using (
  sender_user_id = (select auth.uid())
  or recipient_user_id = (select auth.uid())
);
create policy "shared_content_insert_sender" on public.shared_content for insert with check (
  sender_user_id = (select auth.uid())
);
create policy "shared_content_update_involved" on public.shared_content for update using (
  sender_user_id = (select auth.uid()) or recipient_user_id = (select auth.uid())
) with check (
  sender_user_id = (select auth.uid()) or recipient_user_id = (select auth.uid())
);
create policy "shared_content_delete_sender" on public.shared_content for delete using (
  sender_user_id = (select auth.uid())
);

create or replace function public.estimated_1rm(weight numeric, reps integer)
returns numeric
language sql
immutable
set search_path = public
as $$
  select case
    when weight is null or reps is null or reps <= 0 then 0
    when reps = 1 then weight
    else round((weight * (1 + (reps::numeric / 30))), 2)
  end;
$$;

create or replace function public.record_set_personal_records()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  owner_id uuid;
  completed_at timestamptz;
  e1rm numeric;
  volume numeric;
begin
  if new.is_warmup or new.weight <= 0 or new.reps <= 0 then
    return new;
  end if;

  select logs.user_id, coalesce(logs.date_completed, logs.created_at, now())
  into owner_id, completed_at
  from public.workout_logs logs
  where logs.id = new.workout_log_id;

  if owner_id is null then
    return new;
  end if;

  e1rm := public.estimated_1rm(new.weight, new.reps);
  volume := new.weight * new.reps;

  insert into public.personal_records (user_id, exercise_id, pr_type, value, weight, reps, estimated_1rm, workout_log_id, achieved_at)
  values
    (owner_id, new.exercise_id, 'heaviest_weight', new.weight, new.weight, new.reps, e1rm, new.workout_log_id, completed_at),
    (owner_id, new.exercise_id, 'estimated_1rm', e1rm, new.weight, new.reps, e1rm, new.workout_log_id, completed_at),
    (owner_id, new.exercise_id, 'best_volume_set', volume, new.weight, new.reps, e1rm, new.workout_log_id, completed_at)
  on conflict (user_id, exercise_id, pr_type) do update set
    value = excluded.value,
    weight = excluded.weight,
    reps = excluded.reps,
    estimated_1rm = excluded.estimated_1rm,
    workout_log_id = excluded.workout_log_id,
    achieved_at = excluded.achieved_at,
    updated_at = now()
  where excluded.value > public.personal_records.value;

  return new;
end;
$$;

drop trigger if exists set_logs_record_personal_records on public.set_logs;
create trigger set_logs_record_personal_records
after insert or update on public.set_logs
for each row execute function public.record_set_personal_records();

revoke all on function public.record_set_personal_records() from public, anon;
grant execute on function public.record_set_personal_records() to authenticated;
grant execute on function public.estimated_1rm(numeric, integer) to authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'exercises',
    'workouts',
    'workout_exercises',
    'programs',
    'program_days',
    'active_programs',
    'set_logs',
    'personal_records',
    'follows',
    'shared_content'
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
