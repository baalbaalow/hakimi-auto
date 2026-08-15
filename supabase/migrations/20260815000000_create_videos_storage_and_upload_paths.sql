insert into storage.buckets (id, name, public)
values ('videos', 'videos', false)
on conflict (id) do update
set
  name = excluded.name,
  public = false;

alter table public.uploads
  add column if not exists storage_path text;

create index if not exists uploads_storage_path_idx
  on public.uploads(storage_path);

drop policy if exists "videos_objects_insert_own_folder" on storage.objects;
create policy "videos_objects_insert_own_folder"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'videos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "videos_objects_select_own_folder" on storage.objects;
create policy "videos_objects_select_own_folder"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'videos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "videos_objects_delete_own_folder" on storage.objects;
create policy "videos_objects_delete_own_folder"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'videos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
