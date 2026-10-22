# Service detail implementation

Six public service routes share the catalogue in lib/services.js, a reusable
accessible accordion and existing branded navigation/footer. Services and
Programs use the same linked service cards. Unknown slugs return not-found.
Operational details remain explicit contact-the-Centre fallbacks.

Contact now collects only the enquirer's name, phone, optional email, chosen
service and contact consent. No free-text medical message, role or case claim
is accepted. The API enforces same-origin JSON requests, a 4 KiB body limit,
field validation, a honeypot and generic non-sensitive responses.

The server-only submit_public_enquiry RPC creates the admission, workflow,
screening task, consent event, audit event and receipt in one transaction.
An advisory lock serializes idempotency and quota checks across instances.
Limits are three accepted enquiries per normalized contact per hour and 100
globally per hour. This is basic spam mitigation, not a CAPTCHA service.
Only keyed hashes are stored in duplicate/rate receipts; the admission retains
the contact information needed for follow-up under existing authority controls.
Identical retries return success without another workflow; changed retries
return conflict. Receipt retention preserves duplicate protection.

Migration 20260927115510_confidential_service_enquiry.sql was applied to LHG
staging rpszhpjmchirzzndasrb. Apply it before the API to other environments;
missing RPC/configuration fails closed with a generic unavailable response.

Verified locally: production build (86 routes), import checks, service catalogue,
contact handler/validation tests, existing operational health, notification and
deployment identity regression suites. Staging rollback SQL verified accepted
submission, duplicate protection, conflicting retry, contact quota and denied
anon/authenticated execution. No synthetic enquiries were retained.

Remaining release gates: deployed browser/mobile review, exact deployment SHA,
full staging client/family/staff authority and end-to-end checks. Local database
contract scripts require credentials available in CI, not this workspace.
Do not interpret local build success as production certification.
