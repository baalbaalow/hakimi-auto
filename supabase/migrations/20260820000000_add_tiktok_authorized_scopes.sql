alter table public.tiktok_accounts
  add column if not exists authorized_scopes text;
