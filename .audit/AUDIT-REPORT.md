# OpticWise Static Site — Brand Audit Report (Phase 1A)

> Scope: 25 top-level marketing/landing pages + homepage. **Insights/blog posts (126) NOT yet audited** — flagged as Phase 1B.
> Run against `.cursor/rules/opticwise-brand-guidelines.md` (synthesized canon).
> Generator: `.audit/check.mjs` against text extracted by `.audit/extract-text.mjs`.

---

## Headline summary


|                                                                                                               | Count                  |
| ------------------------------------------------------------------------------------------------------------- | ---------------------- |
| Pages with **at least one** brand violation                                                                   | 13                     |
| Pages **missing the reframing line** ("If you don't own your data & digital infrastructure, your vendors do") | 8 (+1 typo'd as "and") |
| Pages **missing the default closer**                                                                          | 0 — all good           |
| Bare/missing trademarks                                                                                       | 2 instances            |
| Banned-word hits (leverage / PropTech / ESG)                                                                  | 14 instances           |
| "Bare infrastructure" (missing "data & digital " prefix)                                                      | 23 instances           |


---

## Findings by severity

### 🔴 P1 — Required fixes (clear canon violation)

#### 1. Reframing line missing on 8 audience/SEO pages

Canon §5.4: required at least once on each piece. Missing on:

- `ai-ready-commercial-real-estate/`
- `for-asset-managers/`
- `for-it-executives/`
- `for-lps-and-financiers/`
- `for-property-managers-and-engineers/`
- `for-tenants/`
- `glossary/`
- `portfolio-brain/`

**Plus** `contact/` uses the wrong wording: *"If you don't own your data **and** digital infrastructure…"* — canon §5.1 mandates the **ampersand** form.

#### 2. Banned word "leverage" — used in our voice (8 instances)

Canon §5.3: never use. (Distinct from a trademark like "ElasticISP" — these are plain English.)


| Page                  | Line          | Phrase                                                 | Suggested swap                             |
| --------------------- | ------------- | ------------------------------------------------------ | ------------------------------------------ |
| `ppp-audit/`          | L22           | "the real leverage points"                             | "the real decision points"                 |
| `portfolio-brain/`    | L43           | "operating data leverage doesn't exist"                | "you have no operating-data advantage"     |
| `portfolio-brain/`    | L50           | "highest-leverage play across the portfolio"           | "highest-impact play across the portfolio" |
| `for-asset-managers/` | L40 (heading) | "Vendor Leverage You Didn't Have"                      | "Negotiating Power You Didn't Have"        |
| `for-asset-managers/` | L61           | "the play with the highest leverage"                   | "the highest-impact play"                  |
| `glossary/`           | L44           | "owners who control the backbone control the leverage" | "…control the upside / negotiating power"  |
| `glossary/`           | L79           | "three highest-leverage moves"                         | "three highest-impact moves"               |
| `contact/`            | L33           | "where the leverage is"                                | "where the recoverable NOI sits"           |


#### 3. Banned word "ESG" (1 instance)

Canon §5.1: use "operations / utilities optimization" instead.

- `glossary/` L70 — definition of *Digital infrastructure (CRE)*: "…operational intelligence, **ESG reporting**, AI applications…" → swap ESG for "**utilities and operations reporting**" (or drop, since it's covered by "operational intelligence" already).

#### 4. Banned word "PropTech" used in our voice (1 instance)

Canon §5.1 / §5.3: OpticWise is **NOT PropTech**.

- `faq/` L60: *"How does the 5C™ Plan compare to traditional CRE PropTech? + Traditional CRE PropTech adds vendor tools…"* — both uses are in our voice. Suggested rewrite:
  > *"How is the 5C™ Plan different from typical CRE building-tech vendors? + Typical building-tech vendors stack tools on top of a fragmented data foundation. The 5C™ Plan inverts the order: Clarify and Connect the owner-controlled foundation first, Collect and Coordinate the data, then Control any decision engine on top. The same vendor tools can still plug in — but on the owner's terms, not the vendor's."*

#### 5. Bare trademarks — missing mark

- `glossary/` L10 (CTA): **"Schedule a PPP Audit"** → "Schedule Your PPP Audit™" (or, more on-canon: "Schedule Your Review").
- `portfolio-brain/` L8: **"Twenty Property Brains, networked under one owner standard…"** → "Twenty Property Brain™ instances, networked under one owner standard…"

#### 6. "Bare infrastructure" — missing "data & digital " prefix

Canon §5.1: always "data & digital infrastructure" — never "infrastructure" alone. The most common offense is the **PPP 5C™ pillar label "Managed infrastructure"** which appears on 6+ landing pages and should read **"Managed data & digital infrastructure"** per canon §6.


| Pagenote:                              | Lines                                  | Phrase to fix                                                                                                                |
| -------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `index.html` (homepage)                | L72, L75                               | "Managed infrastructure" (×2)                                                                                                |
| `property-brain/`                      | L35, L41                               | "Managed infrastructure"                                                                                                     |
| `how-we-operate/`                      | L42, L45                               | "Managed infrastructure"                                                                                                     |
| `digital-infrastructure-noi-playbook/` | L23, L26                               | "Managed infrastructure" (note: "Managed infrastructure (BoT®)" → "Managed data & digital infrastructure (BoT®)")            |
| `digital-infrastructure-noi-strategy/` | L48, L51                               | "Managed infrastructure"                                                                                                     |
| `own-vs-lease-cre-building-data/`      | L55                                    | "Managed infrastructure"                                                                                                     |
| `digital-infrastructure-noi-strategy/` | L15                                    | "If that infrastructure is fragmented…" → "If that **data & digital** infrastructure…"                                       |
| `bot-building-of-things/`              | L17                                    | *"What the owner calls 'infrastructure'…"* — quoted/rhetorical; lower priority but recommend "data & digital infrastructure" |
| `faq/`                                 | L56, L59, L62                          | three bare uses                                                                                                              |
| `glossary/`                            | L25, L29, L38, L51, L54, L58, L60 (×2) | seven bare uses; mostly within definition bodies                                                                             |


---

### 🟡 P2 — Editorial judgment calls (recommend, but Bill should decide)

#### 7. "PropTech" in third-party publication / award names

These are proper nouns — actual award titles and a magazine. Canon's "never PropTech" rule was written for our voice, not third-party titles we won.

- `about/` L33: **"PropTech Outlook - 2025"** (publication name)
- `about/` L42: **"PropTech Visionary of the Year USA (2024)"** (award name)
- `about/` L46: **"Most Innovative PropTech Solutions Company (2023 and 2022)"** (award name)
- `contact/` L31: list of publications including **"PropTech Outlook"** (publication name)

**Recommendation:** keep as-is (they're locked third-party labels). Add a short prefatory line on `/about` once — *"OpticWise has been recognized by industry publications including the following — though we don't position ourselves as 'PropTech'; we operate the strategic / advisory layer above it."* — or leave the awards block to speak for itself. **Your call.**

#### 8. "Smart building" — appears in two places

Canon §2 swaps PM-coded "smart building" → AM-coded "owner-controlled operating intelligence."

- `glossary/` L60: defines the term and immediately reframes it ("'Smart' without owner-controlled infrastructure is a feature set the vendor controls"). **Keep** — the definition is doing the reframe work.
- `index.html` L111: **"the portfolio becomes a patchwork of 'smart buildings' that can't compound value"** — already in scare quotes inside the failure-state list. **Keep** — the quotes signal the reframe.

No action recommended.

#### 9. CTA hygiene — "review" vs. "audit"

Canon §5.1: in conversation/outbound, prefer "review" (PPP Audit™ trademark stays in marketing labels). Audit is generally OK when it's a formal trademark mention. The site is mostly compliant. The one CTA-style miss is glossary L10 (#5 above).

- The pillar pages prominently use **"Start with a complimentary PPP Audit™"** as CTA. Compliant per §5.1's exception, but if Bill wants to push harder toward conversational tone we could try **"Start with a complimentary review (PPP Audit™)."** Optional.

#### 10. `5s-user-experience-standard` — "5S® Standard" vs. "5S® user experience"

The directory slug and page title say **"5S® Standard"**. Canon §5.2: *5S® is always "5S® user experience" — a user experience, never a "framework."* Canon doesn't explicitly forbid "standard" — and the page itself frames 5S® as a non-negotiable bar/standard, which reads naturally — but it's technically off the canonical "user experience" wording. **Recommendation:** keep page slug (URL stability), but in body copy add at least one canonical phrasing: *"5S® is OpticWise's owner-grade user experience standard."* Already partially present.

---

### 🟢 P3 — Cleanup / structural

#### 11. Dupe folder ready to delete

- `contact-cowork-dupe-please-delete/` — also referenced in `_mirror-manifest.json` and `sitemap.xml`. Will need to remove the page **and** scrub both index files.

#### 12. Form fallback message

- README confirms: forms (`Schedule Your Review`, PPP Starter Kit, contact) load via `RemoteFormRenderer` from `https://ownet.opticwise.com/api/public/forms/<slug>` — CORS-blocked from any non-prod origin, so the live static site shows *"We couldn't load this form right now."*
- Fallback message string lives in JS chunks, not the HTML. Two paths:
  - **Server-side:** add the new origin to the CRM's CORS allowlist (preferred — fastest, no code change).
  - **Static-site side:** swap each form embed for a plain HTML `<form>` POSTing directly to the CRM endpoint. More work, but works without CORS changes and gives us full control over markup/styling.

---

## What's NOT yet audited

- `**insights/` — 126 blog posts.** Brand canon §11.1 has stricter rules for blogs (live hyperlinks on inline citations + References Cited footer). That's a separate, larger pass — likely 1–3 hours of read-through per post with fixes.
- `**sitemap.xml`** — needs to be regenerated/scrubbed after any page deletions.
- `**_mirror-manifest.json**` — debug log of crawl; same scrub when pages are removed.
- **JSON-LD / OG / canonical tags** in `<head>` of each page — not yet checked. Canon §12 implies we should validate.
- **Image alt text** — not yet audited.

