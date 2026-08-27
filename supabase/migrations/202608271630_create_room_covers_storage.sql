-- صور أغلفة الغرف التي يرفعها مالك الغرفة.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'room-covers',
  'room-covers',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists room_covers_public_read on storage.objects;
create policy room_covers_public_read
  on storage.objects for select
  to public
  using (bucket_id = 'room-covers');

drop policy if exists room_covers_authenticated_upload on storage.objects;
create policy room_covers_authenticated_upload
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'room-covers');

drop policy if exists room_covers_authenticated_update on storage.objects;
create policy room_covers_authenticated_update
  on storage.objects for update
  to authenticated
  using (bucket_id = 'room-covers')
  with check (bucket_id = 'room-covers');
