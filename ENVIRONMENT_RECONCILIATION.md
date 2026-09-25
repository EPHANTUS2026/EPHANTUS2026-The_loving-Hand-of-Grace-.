# Loving Hand of Grace — Environment Authority

## Canonical identities
- GitHub: EPHANTUS2026/EPHANTUS2026-The_loving-Hand-of-Grace-.
- Staging Supabase: Loving Hand of Grace - Staging / rpszhpjmchirzzndasrb
- Application ID: the-loving-hand-of-grace
- Staging deployment: must be a dedicated Loving Hand of Grace Vercel project connected to the repository above.

## Release invariant
A staging certification is invalid unless PR HEAD = GITHUB_SHA = VERCEL_GIT_COMMIT_SHA and the deployment reports Supabase ref rpszhpjmchirzzndasrb. Production Assurance verifies this before any stateful staging test.

## Separation rule
Never point Loving Hand of Grace STAGING_BASE_URL, domains, Vercel project, Supabase credentials, deployment hooks, or Git integration at zedhomeskenya or any ZED project. Never reuse ZED database credentials in this application.

## Database sequencing
Staging may contain migrations from isolated feature branches for certification, but a release must inventory and reconcile those migrations into the Git commit being certified before production promotion. Do not infer production readiness from staging schema presence alone.
