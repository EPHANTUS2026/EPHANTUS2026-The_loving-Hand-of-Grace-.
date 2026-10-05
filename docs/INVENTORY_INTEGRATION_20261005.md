# Inventory website integration — 5 October 2026

Implemented in the existing protected `/staff/graceflow/inventory` workspace. No public inventory, new accounts, assignment grants, notifications or scheduled jobs were created.

## Workflow

1. An assigned creator registers item ID, name, unit, configured KES unit cost and reorder level. Quantity starts at zero; opening stock is an IN movement.
2. The creator logs a movement or uploads CSV using the downloadable template. All rows validate and save atomically as pending approval. Stock does not change yet.
3. An independently assigned approver with both approve and execute authority verifies the Centre’s retained signed voucher and posts the movement. Approval evidence is trusted profile ID, signature/voucher reference and database time. References are not electronic signatures, and files are not uploaded or electronically signed by this feature.
4. Stock is calculated from posted IN minus OUT only. Posting locks the item, blocks negative stock and preserves balance after. Replay of original references is safe; altered duplicates are rejected. Direct quantity/ledger edits are denied.
5. Staff count physical stock every Friday. A saved count captures the current posted balance, physical quantity and variance without adjusting stock. Explain off-Friday counts. Resolve discrepancies through independently reviewed movements.

## Dashboard and formulas

- Item balance = sum(posted IN) − sum(posted OUT).
- Item value = balance × configured unit cost; total value is the sum of assigned item values. This is an operational estimate, not FIFO or a certified accounting valuation.
- Low stock: positive balance at or below reorder level. Out of stock: zero balance.
- Latest five: ordered by actual posting time and ID, not spreadsheet row position.
- Count variance: physical quantity minus system balance captured at save time.

## Security and activation

Trusted active profiles and existing explicit assignments control access. Existing enterprise ownership/record assignment rules remain enforced. The dedicated stock adapter requires independent approver, read, approve AND execute assignments; the generic enterprise execution prohibition remains unchanged. No grants are seeded. Authorised operators must approve named assignees and scope before use; the owner is not automatically given stock authority.

The canonical database is `rpszhpjmchirzzndasrb`. Source migration: `20261005161616_inventory_ledger.sql`; applied database history version: `20261005162646`, name `inventory_ledger`.

## Evidence

- Full local static verification and production build passed.
- Inventory validation, CSV and API tests passed: bounded upload, required evidence, precision/dates, forged fields, wrong origin/inactive account denial, user-token RPC and redacted errors.
- Isolated real PostgreSQL tests passed: assigned reads, independent approve+execute, replay, atomic rollback, negative stock denial, count snapshot, dashboard thresholds/latest-five and denial for revoked/inactive/client/anonymous/service-role identities.
- Live canonical database synthetic transaction passed: item receipt, pending movement, duplicate replay, immutable item, independent posting, KES value/latest movement, count snapshot and failed-batch rollback. Final rollback left zero test items and zero inventory assignments.
- Browser and exact-SHA CI acceptance recorded below after deployment.

## Limitations

CSV import supports the supplied movement template, 1–200 rows and 128 KB; direct XLSX upload is not supported. Item registration is through the form. Movement/count screens show the latest 200/100 records respectively; dashboard totals include all authorised items. Retain signed vouchers through the Centre’s approved records process. No automatic Friday reminders, valuation accounting, electronic signature certification or stock-transfer automation is claimed. Mobile/tablet hands-on acceptance and real multi-session concurrency measurement remain pending.

Rollback: revert the website source candidate through the protected staging workflow. Retain the additive ledger tables and history; do not drop tables after real use. Production promotion remains unapproved.
