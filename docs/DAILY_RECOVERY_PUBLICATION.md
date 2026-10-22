# Daily Recovery publication — owner exception

On 5 October 2026 the verified project owner explicitly requested a temporary bypass of clinical and spiritual review for the five supplied meditations. All five are published with real timestamps; Beginning Again is featured. Clinical and spiritual reviews remain pending. No reviewer or approval is fabricated.

The exception applies only to the five named slugs and their current content. The public SELECT policy requires published status, both reviews pending and an exact content fingerprint. Editing content, returning an entry to draft, marking changes requested, or clearing the exception hash removes public visibility. Other entries still require dual approval. The existing publish RPC and all care-data permissions remain unchanged. The protected meditation_review_events table records the owner instruction, authenticated owner identity and content fingerprint. No new RPC or client role claim is introduced.

To revoke: authorised management clears owner_publication_exception_hash or unpublishes the entry. To finish normal review: record real clinical/spiritual approval through the existing authorised process; dual approval then satisfies the standard rule. The exception is for this publication, with no automatic expiry specified by the owner.

Public detail paths:
- /knowledge/daily-recovery/beginning-again
- /knowledge/daily-recovery/loving-without-losing-yourself
- /knowledge/daily-recovery/a-wave-not-a-wall
- /knowledge/daily-recovery/you-are-more-than-your-worst-day
- /knowledge/daily-recovery/small-roots-strong-tree

Verification: exact content renderer and production build passed. Anonymous RLS exposes five entries; rollback-only mutations of content, draft status and changes_requested reduce visibility to two as expected. These mutations were rolled back. Source importer remains idempotent and unchanged entries do not reset publication. Read Aloud, Reflect with Grace and private reflection saving remain unavailable in this increment; no placeholder controls are added.
