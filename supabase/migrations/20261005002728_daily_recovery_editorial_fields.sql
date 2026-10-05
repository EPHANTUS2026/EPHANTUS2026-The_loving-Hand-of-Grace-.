alter table public.meditations alter column meditation_date drop not null;
alter table public.meditations add column if not exists main_quotation text,
add column if not exists supporting_text text,
add column if not exists audience text,
add column if not exists optional_scripture text,
add column if not exists safety_note text,
add column if not exists reflection_label text not null default 'Reflection',
add column if not exists display_order integer not null default 1000,
add column if not exists featured boolean not null default false;
comment on column public.meditations.meditation_date is 'Optional editorial date; null for evergreen reflections. Never use to invent publication dates.';
-- Existing approval checks, RLS, unique slugs and date uniqueness for dated entries remain intact.
