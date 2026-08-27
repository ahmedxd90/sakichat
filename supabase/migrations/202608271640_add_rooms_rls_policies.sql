-- سياسات الغرف: القراءة للمستخدمين المصادق عليهم، والكتابة لمالك الغرفة فقط.
alter table public.rooms enable row level security;

drop policy if exists rooms_authenticated_select on public.rooms;
create policy rooms_authenticated_select
  on public.rooms for select
  to authenticated
  using (true);

drop policy if exists rooms_authenticated_insert on public.rooms;
create policy rooms_authenticated_insert
  on public.rooms for insert
  to authenticated
  with check (owner_id = auth.uid()::text);

drop policy if exists rooms_owner_update on public.rooms;
create policy rooms_owner_update
  on public.rooms for update
  to authenticated
  using (owner_id = auth.uid()::text)
  with check (owner_id = auth.uid()::text);

drop policy if exists rooms_owner_delete on public.rooms;
create policy rooms_owner_delete
  on public.rooms for delete
  to authenticated
  using (owner_id = auth.uid()::text);
