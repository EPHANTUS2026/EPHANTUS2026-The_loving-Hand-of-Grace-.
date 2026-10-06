# Public accounts and staff sign-in separation

6 October 2026, Africa/Nairobi.

## Navigation and routes
- Header: remove Families; replace My Space navigation with Staff portal → `/staff-login`; add a separate My account → `/login`.
- Footer: remove Families navigation; add My account. Existing consent-controlled `/family` remains accessible to authorised family identities through their sign-in routing.
- `/login`: public email sign-in, self-registration, password recovery; Google/phone options advertise setup state from canonical Auth settings.
- `/staff-login`: staff-only sign-in. Server verifies active trusted role before setting cookies. Member/client/family cannot enter using this form.
- `/account`: signed-in public member profile name, private check-ins, recent entries, sign-out and account recovery.
- Existing linked clients retain `/portal`, Passport and clinical check-in contracts; family consent and staff relationships remain unchanged.

## Independent registration
Email + password registration uses existing Supabase Auth. Verification is required. Confirmation link returns to `/auth/confirm`, removes the fragment token from the URL, and continues only after explicit user action. A verified identity receives role `member` in existing profiles through a server-only bootstrap; no clinical client, family delegate or staff record is created. Existing trusted roles and inactive status are never overwritten. User metadata/role/client identifiers are not used as authority.
Phone registration/sign-in verifies an SMS OTP. Google uses PKCE and a short-lived HttpOnly verifier cookie. Both are implemented but remain unavailable while canonical Auth settings disable them. No Google secret or SMS credentials were fabricated or provider enabled.
Email recovery requests use neutral responses. The user opens `/reset-password`, sets a new password through provider-authoritative validation and signs in again. Existing staff can recover their own password but still must use staff sign-in. No automatic privilege changes.

## Canonical observed provider settings
Email: enabled. Signup: enabled. Email auto-confirm: false (verification required).
Google: disabled. Phone: disabled. SMTP/inbox delivery and Auth redirect allowlist not certified. No real signup email, reset email or SMS was sent during implementation.
Setup needed: approve and allowlist exact LHG `/auth/confirm`, `/reset-password` and `/api/auth/callback` URLs; verify email sending through an approved sender/test recipient. Configure Google OAuth application and approved SMS gateway before enabling their Auth providers. Do not weaken staff authority or clinical boundaries to enable registration.

## Personal check-ins
`personal_checkins` is separate from client `grace_checkins`. It is owner-only and append-only through RLS; general records are not enrolled into clinical GraceFlow or claimed as monitored care. Save returns an actual durable receipt. Safe idempotent retries return the same receipt; changed retries conflict. A public user cannot select/insert another user's entries, edit roles, read client/family/staff/clinical data or call server-only bootstrap functions.
Auth proxy applies same-origin protection, bounded payloads, provider validation, generic errors and a durable HMAC-based IP quota (20 attempts/15 minutes); provider rate limits remain authoritative. Quota contains hashes, no raw email/phone/password. Tokens held in memory only and HttpOnly session cookies. Conversations/audio are not added to permanent auth logs.

## Verification
Passed local personal-account PostgreSQL, Auth API mocks, existing static security/navigation/check-in/inventory suites, Grace evaluations and production build. Live canonical rollback-only tests passed bootstrap, receipt/replay, A/B isolation, direct bootstrap denial and clinical/family/staff data denial. No fixtures retained.
Remote deployed-candidate CI and browser observations must be recorded separately from source tests. Real email confirmation/reset, Google completion and SMS delivery are not certified by mocks/build/database tests.
