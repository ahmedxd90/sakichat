-- Saki Chat: profiles.user_id references public.users.id.
-- Create the parent public.users row from the authenticated Supabase user
-- before the client inserts or updates the profile row.

create or replace function public.ensure_current_user_record()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.users (id, email)
  values (auth.uid()::text, nullif(auth.jwt() ->> 'email', ''))
  on conflict (id) do update
    set email = coalesce(excluded.email, public.users.email);
end;
$$;

revoke all on function public.ensure_current_user_record() from public;
grant execute on function public.ensure_current_user_record() to authenticated;
