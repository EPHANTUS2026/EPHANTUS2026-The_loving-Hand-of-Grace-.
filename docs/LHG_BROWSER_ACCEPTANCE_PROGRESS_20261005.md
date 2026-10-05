# LHG browser acceptance progress — 5 October 2026

Candidate: `a6dad3de360f2e559e98cb036e3aecd97af39ae8`.
Deployment: `dpl_DPUnJ6T4NQhq2eQ4W8kZN5xtWDX8`.
Browser access restored through authorised secure Vercel email verification.
Application remains signed out; Vercel authentication does not grant portal roles.
No deployment protection or application authority was weakened.

## Actual desktop checks

Chrome viewport: 1363 × 936. Direct browser navigation succeeds for all six
service routes and Daily Recovery with all five detail routes. Matching service
and meditation headings were observed on each page.

Home, About, Our Team, Treatment, Recovery Journey, Life at Grace, Knowledge
and Contact render directly. No horizontal document overflow was observed at
this desktop width on these categories. Family, My Space, Staff and Admin
redirect application-signed-out visitors to `/login` rather than showing care
records. This supplements, but does not replace, CI API/RLS isolation evidence.

Aftercare's first process accordion expands with Enter and exposes its panel;
refresh loads the route and resets the panel to collapsed. Beginning Again's
optional scripture expands with Enter and shows the supplied Lamentations
excerpt, without a translation claim. Visible focus is captured in its screenshot.

About banner measured 1348 × 2396.4375, consistent with the source 900 × 1600
portrait aspect ratio. Image loads successfully. Its deliberately pale upper
photograph fills the first viewport; the chairs appear farther down the tall
image. No image substitution, cropping or layout redesign was performed.
The single desktop overlay computes a smooth .70-to-.575 white gradient.

For opaque foreground colours over 70% white on worst-case black photography,
calculated contrast exceeds AA for heading, body and label colours. This is a
bounded colour calculation, not full page/pixel contrast certification.

Screenshots:
- `browser-evidence/about-desktop.jpg`
- `browser-evidence/meditation-desktop.jpg`

## Outstanding acceptance

- Mobile/tablet viewport and actual device journeys have not been verified;
  the available browser control surface does not expose viewport resizing.
- Full keyboard/screen-reader coverage, CTA/form errors/loading states,
  slow-network behaviour and measured performance remain outstanding.
- Authenticated portal visual journeys are not certified by signed-out checks.
- Live enhanced Grace and actual Azure speech/listening remain outstanding.
- Enterprise permission proposal remains unapproved and unenforced.

See `LHG_PROPOSED_ENTERPRISE_PERMISSIONS.md` for the concrete owner/Director
decision draft. No permissions granted, human acceptance fabricated, clinical
record changed or real notification sent. Overall production verdict: NO-GO.
