# Client Welfare Architecture Audit

Baseline: 569a643906dd71757ebc1433ab28b41fc7cb944b

## KEEP
- Canonical clients/profiles identity model and current_client_id server authority.
- Private Recovery Passport and client-safe projection service.
- recovery_journeys, recovery_milestones, care_goals.
- reintegration_plans and aftercare_plans.
- client_team_assignments for relationship-scoped staff authority.
- consent_records plus existing family relationship records.
- Grace, GraceFlow, ZIWOS separation.

## HARDEN
- Family access must require current consent and non-expired relationship evidence on every protected read.
- Staff access must combine role + active client_team_assignment, not role alone.
- Recovery Passport must remain self-only and never accept browser clientId as authority.
- Welfare/relationship mutations require server-authoritative services and audit provenance.

## BUILD
- Canonical welfare domain vocabulary and relationship projection.
- Client-centred My Journey experience.
- Accountable client request/welfare action workflow.
- Explicit Circle of Care projection.
- Welfare outcome framework that keeps observed, reported, professional, system-derived and AI-suggested facts distinct.

## DEPENDENCIES
Identity -> server authorization -> Recovery Passport -> Welfare Graph -> My Journey -> Requests -> Circle of Care/Consent -> Grace -> Reintegration/Aftercare -> Outcomes.

No destructive rewrite. Existing domain tables are reused as authoritative nodes where possible.
