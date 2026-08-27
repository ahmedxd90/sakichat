-- Saki Chat: avatar storage required by Google OAuth profile completion.
-- Applied to the production Supabase project through the connected Supabase integration.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists avatars_public_read on storage.objects;
create policy avatars_public_read
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');

drop policy if exists avatars_authenticated_upload on storage.objects;
create policy avatars_authenticated_upload
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars');

drop policy if exists avatars_authenticated_update on storage.objects;
create policy avatars_authenticated_update
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars')
  with check (bucket_id = 'avatars');
