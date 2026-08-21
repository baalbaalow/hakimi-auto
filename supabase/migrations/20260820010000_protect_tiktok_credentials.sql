revoke select, insert, update, delete
  on table public.tiktok_accounts
  from authenticated;

grant select (
  id,
  user_id,
  tiktok_open_id,
  display_name,
  avatar_url,
  access_token_expires_at,
  refresh_token_expires_at,
  authorized_scopes,
  created_at,
  updated_at
)
  on table public.tiktok_accounts
  to authenticated;
