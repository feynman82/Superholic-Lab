-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (extends auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  name text,
  role text check (role in ('student', 'parent', 'admin')) default 'student',
  level int check (level between 1 and 6) default 1,
  avatar_url text,
  streak_days int default 0,
  last_active timestamp with time zone,
  parent_id uuid references profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Subscriptions
create table subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  plan text check (plan in ('individual', 'family')) default 'individual',
  status text check (status in ('active', 'trial', 'cancelled')) default 'trial',
  current_period_end timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Progress tracking
create table progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  subject text check (subject in ('math', 'english', 'science')),
  xp int default 0,
  accuracy_rate decimal(5,2) default 0,
  questions_attempted int default 0,
  questions_correct int default 0,
  current_streak int default 0,
  longest_streak int default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Mistake Bank with Spaced Repetition
create table mistake_bank (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  question_data jsonb not null,
  wrong_answer text,
  correct_answer text,
  attempts int default 1,
  mastered boolean default false,
  next_review_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Activity Log
create table activity_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  activity_type text check (activity_type in ('daily_sprint', 'top_speed', 'topic_quest', 'exam_mode', 'mistake_review')),
  subject text,
  score int,
  max_score int,
  duration_seconds int,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Leaderboard
create table leaderboard (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  user_name text,
  score int,
  subject text,
  level int,
  game_mode text,
  date date default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Question Cache (API cost optimization)
create table questions_cache (
  id uuid default gen_random_uuid() primary key,
  cache_key text unique not null,
  level int,
  subject text,
  topic text,
  difficulty text,
  question_data jsonb,
  usage_count int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  expires_at timestamp with time zone default (timezone('utc'::text, now()) + interval '7 days')
);

-- API Usage Tracking
create table api_usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  date date default current_date,
  request_count int default 0,
  tokens_used int default 0,
  unique(user_id, date)
);

-- RLS Policies
alter table profiles enable row level security;
alter table progress enable row level security;
alter table mistake_bank enable row level security;
alter table activity_log enable row level security;
alter table subscriptions enable row level security;

-- Students can only read/write own data
create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);
create policy "Users can view own progress"
  on progress for select using (auth.uid() = user_id);
create policy "Users can insert own progress"
  on progress for insert with check (auth.uid() = user_id);
create policy "Users can update own progress"
  on progress for update using (auth.uid() = user_id);
create policy "Users can view own mistakes"
  on mistake_bank for select using (auth.uid() = user_id);
create policy "Users can manage own mistakes"
  on mistake_bank for all using (auth.uid() = user_id);

-- Realtime
alter publication supabase_realtime add table leaderboard;
