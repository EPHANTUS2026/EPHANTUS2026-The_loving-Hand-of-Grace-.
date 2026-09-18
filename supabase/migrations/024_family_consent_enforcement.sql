-- Family updates require both the authenticated relationship and current consent.
drop policy if exists "family approved updates" on public.family_updates;
create policy "family approved updates" on public.family_updates for select to authenticated using (
 family_member_id=(public.current_profile()).family_member_id
 and (expires_at is null or expires_at>now())
 and exists(select 1 from public.family_members fm where fm.id=family_updates.family_member_id and fm.client_id=family_updates.client_id and fm.consent_active=true)
 and exists(select 1 from public.consent_records cr where cr.client_id=family_updates.client_id and cr.recipient_type='family_member' and cr.recipient_id=family_updates.family_member_id and cr.status='active' and cr.revoked_at is null and (cr.effective_at is null or cr.effective_at<=now()) and (cr.expires_at is null or cr.expires_at>now()))
);
