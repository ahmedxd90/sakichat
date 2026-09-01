-- Saki Chat: complete profile setup atomically for the authenticated user.
-- The server owns saki_id generation so the identifier cannot be lost between
-- the client-side uniqueness check and the profile upsert.

create or replace function public.complete_current_profile(
  p_name text,
  p_country text,
  p_gender text,
  p_avatar_url text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id text;
  v_saki_id text;
  v_profile public.profiles;
  v_attempt integer;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if nullif(trim(p_name), '') is null then
    raise exception 'اسم المستخدم مطلوب';
  end if;

  if nullif(trim(p_country), '') is null then
    raise exception 'الدولة مطلوبة';
  end if;

  if p_gender not in ('male', 'female') then
    raise exception 'الجنس غير صالح';
  end if;

  v_user_id := auth.uid()::text;

  insert into public.users (id, email)
  values (v_user_id, nullif(auth.jwt() ->> 'email', ''))
  on conflict (id) do update
    set email = coalesce(excluded.email, public.users.email);

  -- Reuse an existing identifier when the user is retrying profile setup.
  select nullif(trim(existing_profile.saki_id), '')
    into v_saki_id
    from public.profiles as existing_profile
   where existing_profile.user_id = v_user_id
   limit 1;

  for v_attempt in 1..25 loop
    if v_saki_id is null then
      -- Generate a 9-digit Saki ID starting from 964353154
      -- Logic: Start with 964353154 and add a random offset to ensure uniqueness and 9-digit length
      -- Range: 964,353,154 to 999,999,999 (roughly 35 million possible IDs)
      v_saki_id := (964353154 + floor(random() * (999999999 - 964353154 + 1)))::bigint::text;
    end if;

    begin
      insert into public.profiles (user_id, name, saki_id, country, gender, avatar_url)
      values (
        v_user_id,
        trim(p_name),
        v_saki_id,
        trim(p_country),
        p_gender,
        nullif(trim(coalesce(p_avatar_url, '')), '')
      )
      on conflict (user_id) do update
        set name = excluded.name,
            country = excluded.country,
            gender = excluded.gender,
            avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
            saki_id = coalesce(nullif(public.profiles.saki_id, ''), excluded.saki_id)
      returning * into v_profile;

      return v_profile;
    exception when unique_violation then
      -- A different user may have received the same six-digit value. Generate
      -- a new value and retry without exposing database details to the client.
      v_saki_id := null;
    end;
  end loop;

  raise exception 'تعذر إنشاء معرف Saki فريد، حاول مرة أخرى';
end;
$$;

revoke all on function public.complete_current_profile(text, text, text, text) from public;
grant execute on function public.complete_current_profile(text, text, text, text) to authenticated;
