-- A public account is not an admitted client, family delegate or staff identity.
alter type public.user_role add value if not exists 'member';
