# Administration → Staff Accounts

Implementation date: 6 October 2026 (Africa/Nairobi).

## Current setup requirement
The invitation screen is implemented. Sending is intentionally disabled until an operator verifies Supabase Auth email sending and allowlists the exact approved LHG URL ending `/accept-invitation`. Set server-only `STAFF_INVITE_ORIGIN` to that verified HTTPS origin and `STAFF_INVITES_ENABLED=true` only after verification. Redeploy the same candidate with that configuration. Never use a foreign project/domain, public service key, shared password or guessed staff address. Supabase built-in email restrictions/limits may require configured SMTP. Provider acceptance is not confirmed inbox delivery.

## Owner walkthrough
1. Open LHG's approved website and choose Secure workspace / Sign in.
2. Enter your individual owner account email and password; choose Continue securely.
3. Open Administration / Management overview. In the administration navigation, choose Staff Accounts. Direct route: `/admin/staff-accounts`.
4. Under Invite staff member, enter Full name, Individual email address, Job title and optional Department.
5. Confirm the person is authorised and controls that address. Do not supply their password.
6. Choose Send invitation. If disabled, read the setup message; invitation delivery is not configured yet.
7. Read the receipt. Email-service acceptance means the send was accepted, not proven delivered. The invitation register shows Awaiting acceptance.
8. Ask the person to check inbox and spam. Their email link opens Welcome to the staff portal.
9. They choose their own 12–128 character password, confirm it and choose Set password and activate account.
10. They enter the staff portal. Refresh Staff Accounts to see Account activated.
11. Arrange separate approved duties: role, modules/actions and client relationships. This screen intentionally grants basic `staff` access only; it does not grant clinical, inventory, approval or administrator authority.

## Failure handling
- Review required / Sending awaiting result: stop. A technical operator must reconcile the Auth user, invitation ledger and mail status. No blind resend.
- Existing email: do not overwrite/link an existing client/family/staff account. Resolve the intended existing identity separately.
- Expired email link: contact the operator; do not share someone else's activation link. Resend/recovery is not provided by this first screen.
- Invitation register lists invitations created here, not a complete pre-existing staff directory. Limit: latest 200.
- Account suspension, role editing, resend and module/client assignment controls are not part of this screen. Existing authorised workflows remain unchanged.

## Authority and verification
Only active administrator/super_admin profiles may use page/API. Manager/director/client/family/ordinary staff are denied even if a navigation link is visible. Role is resolved from trusted profiles, never browser/user metadata. Invitation transactions are service-only, public/anonymous/authenticated direct database execution is denied. A private Auth predicate checks identity without granting broad Auth-table privileges. Reservation is unique per normalised email; trusted actor row lock enforces 10 reservations/hour. No sensitive tokens or passwords are logged or stored by this feature; activation token is held only in memory, removed from the URL fragment, and set as an HttpOnly cookie after server validation.

Passed: local invitation policy/PostgreSQL tests; API origin/size/error-redaction and mocked provider flow; existing static/security regression suite and build (see candidate CI for remote results). Canonical live DB rollback-only reservation/duplicate/pending/verified activation passed; zero retained fixtures. No real invitation email was sent. Auth SMTP, redirect and delivered-email acceptance remain unverified. Authenticated browser click-through remains pending until verified access is available.
