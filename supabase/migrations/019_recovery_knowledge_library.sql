-- Rights-aware Recovery Knowledge Library. Existing knowledge_articles remains the institutional CMS.
create table if not exists public.recovery_sources (
 id uuid primary key default gen_random_uuid(), organization text not null, display_name text not null,
 canonical_domain text not null unique, rights_status text not null check (rights_status in ('PUBLIC_DOMAIN','AUTHORIZED_FOR_REPUBLICATION','LICENSED','OFFICIAL_EXTERNAL_RESOURCE','INTERNAL_ORIGINAL_CONTENT','RIGHTS_UNKNOWN')),
 verification_status text not null default 'PENDING' check (verification_status in ('PENDING','VERIFIED','REJECTED')),
 verified_at timestamptz, provenance jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.recovery_resources (
 id uuid primary key default gen_random_uuid(), source_id uuid not null references public.recovery_sources(id),
 title text not null, slug text not null unique, description text not null, category text not null, topic text[] not null default '{}',
 resource_type text not null check (resource_type in ('BOOK','BOOKLET','PAMPHLET','ARTICLE','DAILY_READING','WORKSHEET','AUDIO','VIDEO','EXTERNAL_RESOURCE')),
 audience text[] not null default '{public}', language text not null default 'en', reading_level text,
 rights_status text not null check (rights_status in ('PUBLIC_DOMAIN','AUTHORIZED_FOR_REPUBLICATION','LICENSED','OFFICIAL_EXTERNAL_RESOURCE','INTERNAL_ORIGINAL_CONTENT','RIGHTS_UNKNOWN')),
 official_url text, local_content_reference text, publication_metadata jsonb not null default '{}'::jsonb,
 featured boolean not null default false, status text not null default 'DRAFT' check(status in ('DRAFT','REVIEW','PUBLISHED','ARCHIVED')),
 reviewed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 constraint recovery_resource_rights_guard check (local_content_reference is null or rights_status in ('PUBLIC_DOMAIN','AUTHORIZED_FOR_REPUBLICATION','LICENSED','INTERNAL_ORIGINAL_CONTENT'))
);
create table if not exists public.client_recovery_library (
 id uuid primary key default gen_random_uuid(), client_id uuid not null references public.clients(id) on delete cascade,
 resource_id uuid not null references public.recovery_resources(id) on delete cascade, status text not null default 'SAVED' check(status in ('SAVED','READING','COMPLETED')),
 saved_at timestamptz not null default now(), completed_at timestamptz, unique(client_id,resource_id)
);
alter table public.recovery_sources enable row level security;
alter table public.recovery_resources enable row level security;
alter table public.client_recovery_library enable row level security;
create policy "public verified recovery sources" on public.recovery_sources for select to anon,authenticated using (verification_status='VERIFIED');
create policy "public published recovery resources" on public.recovery_resources for select to anon,authenticated using (status='PUBLISHED' and rights_status<>'RIGHTS_UNKNOWN');
create policy "client own recovery library select" on public.client_recovery_library for select to authenticated using (client_id=public.current_client_id());
create policy "client own recovery library insert" on public.client_recovery_library for insert to authenticated with check (client_id=public.current_client_id());
create policy "client own recovery library update" on public.client_recovery_library for update to authenticated using (client_id=public.current_client_id()) with check (client_id=public.current_client_id());
create policy "client own recovery library delete" on public.client_recovery_library for delete to authenticated using (client_id=public.current_client_id());
