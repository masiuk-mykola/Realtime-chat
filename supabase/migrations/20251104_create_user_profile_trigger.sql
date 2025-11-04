-- Migration: create trigger to insert a profile row when a new auth user is created
-- Notes / assumptions:
-- 1) The repository's generated types show a table named `public.user_pofile` (note the typo).
--    The user asked for `public.user_profiles`. This migration will prefer the existing
--    `public.user_pofile` if present, otherwise it will try `public.user_profiles`.
-- 2) Supabase's auth table is `auth.users` (plural). The user mentioned `auth.user`;
--    this migration attaches to `auth.users` which is the standard Supabase table.
-- 3) The function is SECURITY INVOKER and sets search_path = '' and uses fully qualified names.
-- 3) The function originally used SECURITY INVOKER. It has been changed to
--    SECURITY DEFINER because the trigger runs as the auth system role (which
--    may not have write access to `public.user_profiles`/`public.user_pofile`).
--    SECURITY DEFINER allows the function to run with the privileges of its
--    owner so it can reliably insert a profile row. Keep this minimal and
--    ensure the function owner is a privileged, trusted role (for example the
--    project DB owner or admin role). Review this if you prefer explicit RLS
--    policies instead of definer privileges.

create or replace function public.create_user_profile_on_auth_user_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  user_name text;
  avatar text;
begin
  -- Try to extract a friendly name and avatar from standard auth user metadata
  -- Supabase auth.users commonly exposes `raw_user_meta_data` or `user_metadata` as json
  if new.raw_user_meta_data is not null then
    user_name := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email);
    avatar := new.raw_user_meta_data->>'avatar_url';
  else
    user_name := coalesce(new.user_metadata->>'full_name', new.user_metadata->>'name', new.email);
    avatar := new.user_metadata->>'avatar_url';
  end if;

  -- If the project's `public.user_pofile` (generated types) exists insert into it
  if to_regclass('public.user_pofile') is not null then
    begin
      insert into public.user_pofile (id, name, image_url, created_at)
      values (new.id, user_name, avatar, now())
      on conflict (id) do nothing;
    exception when others then
      -- Avoid breaking auth operation; log a notice for debugging
      raise notice 'create_user_profile_on_auth_user_insert: insert into public.user_pofile failed: %', SQLERRM;
    end;

  -- Otherwise, if the user asked for `public.user_profiles`, try inserting into that table
  elsif to_regclass('public.user_profiles') is not null then
    begin
      -- Insert common columns often found on profile tables. If your real table differs,
      -- adapt the column list to match (for example: user_id vs id, avatar_url vs image_url).
      insert into public.user_profiles (user_id, email, full_name, avatar_url, created_at)
      values (new.id, new.email, user_name, avatar, now())
      on conflict (user_id) do nothing;
    exception when others then
      raise notice 'create_user_profile_on_auth_user_insert: insert into public.user_profiles failed: %', SQLERRM;
    end;
  end if;

  return new;
end;
$$;

-- Attach trigger to auth.users (standard Supabase table for users)
drop trigger if exists create_user_profile_on_auth_user_insert_trigger on auth.users;
create trigger create_user_profile_on_auth_user_insert_trigger
after insert on auth.users
for each row
execute function public.create_user_profile_on_auth_user_insert();
