create extension if not exists pgcrypto with schema extensions;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.tiktok_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tiktok_open_id text,
  display_name text,
  avatar_url text,
  access_token text,
  refresh_token text,
  access_token_expires_at timestamptz,
  refresh_token_expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tiktok_account_id uuid references public.tiktok_accounts(id) on delete set null,
  title text,
  caption text,
  file_url text,
  status text not null default 'draft',
  publish_id text,
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint uploads_status_check
    check (status in ('draft', 'queued', 'processing', 'published', 'failed'))
);

create table if not exists public.automation_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  upload_id uuid references public.uploads(id) on delete cascade,
  workflow_name text,
  external_job_id text,
  status text not null default 'pending',
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint automation_jobs_status_check
    check (status in ('pending', 'running', 'completed', 'failed'))
);

create index if not exists tiktok_accounts_user_id_idx
  on public.tiktok_accounts(user_id);

create index if not exists uploads_user_id_idx
  on public.uploads(user_id);

create index if not exists uploads_tiktok_account_id_idx
  on public.uploads(tiktok_account_id);

create index if not exists automation_jobs_user_id_idx
  on public.automation_jobs(user_id);

create index if not exists automation_jobs_upload_id_idx
  on public.automation_jobs(upload_id);

alter table public.profiles enable row level security;
alter table public.tiktok_accounts enable row level security;
alter table public.uploads enable row level security;
alter table public.automation_jobs enable row level security;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.tiktok_accounts to authenticated;
grant select, insert, update, delete on public.uploads to authenticated;
grant select, insert, update, delete on public.automation_jobs to authenticated;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own"
  on public.profiles
  for delete
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "tiktok_accounts_select_own" on public.tiktok_accounts;
create policy "tiktok_accounts_select_own"
  on public.tiktok_accounts
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "tiktok_accounts_insert_own" on public.tiktok_accounts;
create policy "tiktok_accounts_insert_own"
  on public.tiktok_accounts
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "tiktok_accounts_update_own" on public.tiktok_accounts;
create policy "tiktok_accounts_update_own"
  on public.tiktok_accounts
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "tiktok_accounts_delete_own" on public.tiktok_accounts;
create policy "tiktok_accounts_delete_own"
  on public.tiktok_accounts
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "uploads_select_own" on public.uploads;
create policy "uploads_select_own"
  on public.uploads
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "uploads_insert_own" on public.uploads;
create policy "uploads_insert_own"
  on public.uploads
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "uploads_update_own" on public.uploads;
create policy "uploads_update_own"
  on public.uploads
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "uploads_delete_own" on public.uploads;
create policy "uploads_delete_own"
  on public.uploads
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "automation_jobs_select_own" on public.automation_jobs;
create policy "automation_jobs_select_own"
  on public.automation_jobs
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "automation_jobs_insert_own" on public.automation_jobs;
create policy "automation_jobs_insert_own"
  on public.automation_jobs
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "automation_jobs_update_own" on public.automation_jobs;
create policy "automation_jobs_update_own"
  on public.automation_jobs
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "automation_jobs_delete_own" on public.automation_jobs;
create policy "automation_jobs_delete_own"
  on public.automation_jobs
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_tiktok_accounts_updated_at on public.tiktok_accounts;
create trigger set_tiktok_accounts_updated_at
  before update on public.tiktok_accounts
  for each row execute function public.set_updated_at();

drop trigger if exists set_uploads_updated_at on public.uploads;
create trigger set_uploads_updated_at
  before update on public.uploads
  for each row execute function public.set_updated_at();

drop trigger if exists set_automation_jobs_updated_at on public.automation_jobs;
create trigger set_automation_jobs_updated_at
  before update on public.automation_jobs
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
