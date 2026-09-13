-- Production connector integrations: truthful health state, delivery safety and observability.
alter table public.integration_connectors add column if not exists environment text not null default 'staging';
alter table public.integration_connectors add column if not exists failure_count integer not null default 0;
alter table public.integration_connectors add column if not exists last_success_at timestamptz;
create index if not exists idx_notification_outbox_dispatch on public.notification_outbox(status,next_attempt_at,created_at);
create index if not exists idx_notification_deliveries_channel_created on public.notification_deliveries(channel,created_at desc);
create index if not exists idx_integration_health_connector_checked on public.integration_health_checks(connector_key,checked_at desc);
update public.integration_connectors set enabled=false,last_health_status='disabled' where last_health_at is null;
-- Connector metadata never stores provider secrets. Runtime secrets belong in server environment/secret storage.
