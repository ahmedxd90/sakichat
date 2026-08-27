-- Saki Chat: allow authenticated users to create and maintain their profile.
-- RLS is enabled on public.profiles in the production Supabase project.

alter table public.profiles enable row level security;

drop policy if exists profiles_authenticated_select on public.profiles;
create policy profiles_authenticated_select
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists profiles_self_insert on public.profiles;
create policy profiles_self_insert
  on public.profiles for insert
  to authenticated
  with check (user_id = auth.uid()::text);

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update
  on public.profiles for update
  to authenticated
  using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);
