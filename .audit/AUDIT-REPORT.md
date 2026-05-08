# OpticWise Site — SEO + SB7 BrandScript Audit (May 2026)

> **Scope of this pass:** every `index.html` in the static site (152 pages including 404; one new insights post landed mid-run and was picked up automatically).
>
> **Per scope update from Bill (May 2026):** *blogs/insights are allowed exceptions to the SB7 brandscript.* All `/insights/...` pages are audited for **SEO only** — not for banned words, bare trademarks, bare-infra, or missing reframing line / default closer. SEO mechanical fixes (Article JSON-LD, title dedup, H1 demotion, etc.) still apply to insights.
>
> Top-level marketing pages (homepage, /about, /contact, /faq, /glossary, /property-brain, /portfolio-brain, /ppp-audit, /bot-building-of-things, /5s-user-experience-standard, /advisory-services, /how-we-operate, /digital-infrastructure-noi-*, /ai-ready-commercial-real-estate, /own-vs-lease-cre-building-data, /control-cre-digital-visibility, /for-* audience pages, 404.html) — **full SB7 + SEO compliance applied.**
>
> Tooling: `.audit/audit-all.mjs` (audit), `.audit/fix-seo.mjs` (mechanical SEO sweep), `.audit/fix-meta-descriptions.mjs` (top-level description rewrites), `.audit/regenerate-sitemap.mjs` (sitemap).

---

## Headline delta

| Issue kind | Before | After | Notes |
|---|---|---|---|
| `BANNED` (leverage/PropTech/ESG/etc.) | 223 | **0** | Insights skipped per scope. Top-level cleaned. PropTech in 3rd-party publication/award names allowlisted. |
| `BARE_TM` (bare Property Brain, PPP Audit, etc.) | 111 | **0** | Insights skipped per scope. Top-level previously cleaned. |
| `BARE_INFRA` (`infrastructure` without `data & digital ` prefix) | 223 | **0** | Insights skipped per scope. Glossary, faq, for-it-executives, bot-building-of-things — all surgical fixes applied. |
| `MISSING_REFRAMING` (long-form lacking the reframe line) | 122 | **0** | Insights skipped per scope. All top-level pages already include it. |
| `MISSING_CLOSER` (no default closer) | 1 | **0** | Insights skipped per scope. |
| `SEO_ARTICLE_NULL_DESC` | 31 | **0** | All 126 Article JSON-LD blocks now have a description (mirrored from `<meta name="description">`). |
| `SEO_ARTICLE_NO_AUTHOR` | 126 | **0** | All Article JSON-LD now carry `author: { "@type":"Organization", "name":"OpticWise", "url":"https://www.opticwise.com" }`. |
| `SEO_ARTICLE_NO_MEOP` | 126 | **0** | All Article JSON-LD now carry `mainEntityOfPage: { "@type":"WebPage", "@id": <canonical> }`. |
| `SEO_TITLE_DUP_BRAND` (`X | OpticWise | OpticWise`) | 9 | **0** | Trailing duplicate `| OpticWise` suffix stripped. |
| `SEO_MULTIPLE_H1` (`<h1>Final Thoughts</h1>` etc.) | 7 | **0** | Stray secondary H1s demoted to H2 across 8 blog posts. |
| `SEO_TITLE_LONG` (>70 chars) | 13 | **6** | All top-level fixed. 6 remain on insights — kept for Bill's manual editorial pass (per scope: don't auto-rewrite blog titles). |
| `SEO_DESC_LONG` (>170 chars) | 20 | **9** | All top-level fixed (12 unique descriptions written). 9 remain on insights — flagged for Bill's manual editorial pass (per scope: don't auto-rewrite blog descriptions). |
| `SEO_DESC_SHORT` | 1 | **0** | 404.html expanded. |
| `SEO_NO_OG_IMAGE` / `SEO_NO_TW_*` / `SEO_NO_JSONLD` (404) | 5 | **0** | 404.html now has full OG + Twitter + WebPage JSON-LD. |

**Net result:** 0 issues across all 25 top-level marketing pages and the 404. 15 issues remain on 13 insights posts — all editorial-only (long titles + long/duplicate meta descriptions) and explicitly out of automated scope per Bill's directive. Insights body copy was **not** touched.

---

## What changed (by file)

### Top-level — SB7 brandscript surgical fixes

| File | Change |
|---|---|
| `glossary/index.html` | 6 `BARE_INFRA` instances in dictionary definitions (ElasticISP, ISP, NOI, ROI, Smart building x2, Connect-step body) replaced with `data & digital infrastructure`. Both visible `<details>` body and the FAQPage JSON-LD `acceptedAnswer.text` updated in lockstep. |
| `faq/index.html` | 2 `BARE_INFRA` fixed: the `"We're focused on AI, not infrastructure."` objection rewritten to `"We're focused on AI, not data & digital infrastructure."` (visible + FAQPage JSON-LD); `operates owner-controlled infrastructure` → `operates owner-controlled data & digital infrastructure`. |
| `for-it-executives/index.html` | `EV infrastructure` → `EV charging` (more precise; "EV" is electrical, not data/digital — prefix swap doesn't fit canon §6.1). |
| `bot-building-of-things/index.html` | The rhetorical scare-quote list `"comms" or "networks" or "proptech" or "Internet"` had `"proptech"` swapped to `"the IT closet"` to remove the banned word from our voice (canon §6.3) without losing the joke. |
| `contact/index.html` | Title rewritten from `Contact OpticWise` (18 chars, too short) to `Contact OpticWise — Schedule a CRE Data & Digital Review`; OG/Twitter titles mirrored. |
| `about/index.html` | **No change.** PropTech mentions are inside third-party publication / award names (PropTech Outlook, PropTech Visionary of the Year, PropTech Solutions Company). Per Phase 1A audit P2 these are locked third-party trademarks. The audit script now allowlists `PropTech (Outlook|Visionary|Solutions Company|Magazine|Awards|Today)` so they no longer flag. |

### Top-level — Mechanical SEO

| File | Change |
|---|---|
| `index.html` (homepage) | Title: `OpticWise — CRE Data & Digital Infrastructure | OpticWise` → `OpticWise — CRE Data & Digital Infrastructure`. |
| `5s-user-experience-standard/` | Title: stripped duplicate `| OpticWise | OpticWise`. New unique meta description (was 172 → 153 chars). |
| `about/` | Title: stripped duplicate `| OpticWise`. |
| `contact/` | Title rewritten (above). New unique meta description. |
| `faq/` | Title: stripped duplicate `| OpticWise`. |
| `for-asset-managers/` | Title: stripped duplicate `| OpticWise`. |
| `glossary/` | Title: stripped duplicate `| OpticWise`. |
| `portfolio-brain/` | Title: stripped duplicate `| OpticWise | OpticWise`. New unique meta description (was 175 → 162 chars). |
| `advisory-services/` | New unique meta description (was 175-char shared boilerplate → 158 chars). |
| `bot-building-of-things/` | New unique meta description (was 175-char shared boilerplate → 149 chars). |
| `digital-infrastructure-noi-ai/` | New unique meta description (was 175-char shared boilerplate → 152 chars). |
| `digital-infrastructure-noi-strategy/` | New unique meta description (was 175-char shared boilerplate → 149 chars). |
| `how-we-operate/` | New unique meta description (was 175-char shared boilerplate → 164 chars). |
| `own-vs-lease-cre-building-data/` | New unique meta description (was 175-char shared boilerplate → 158 chars). |
| `property-brain/` | New unique meta description (was 175-char shared boilerplate → 164 chars). |
| `for-property-managers-and-engineers/` | New unique meta description (was 218 → 158 chars). |
| `for-tenants/` | New unique meta description (was 206 → 168 chars after a small trim from 173). |

### Top-level — JSON-LD enrichment (and insights)

| Change | Pages affected |
|---|---|
| Filled `Article.description: null` with the page's meta description | 31 insights posts |
| Added `Article.author = { "@type":"Organization", "name":"OpticWise" }` | All 126 insights posts |
| Added `Article.mainEntityOfPage = { "@type":"WebPage", "@id": <canonical> }` | All 126 insights posts |

### Top-level — 404.html

- Added `og:site_name`, `og:image`, `og:image:width/height`.
- Added full `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`.
- Expanded meta description from 48 chars to a properly branded line.
- Added `WebPage` JSON-LD with `isPartOf: WebSite` (light-touch, since `noindex`).

### Insights — mechanical SEO only

- 8 stray `<h1>Final Thoughts</h1>` (and similar second `<h1>`s) demoted to `<h2>`.
- 5 insights titles that contained `| OpticWise | OpticWise` duplicates deduped.
- 5 insights titles >70 chars after dedup were further shortened by stripping the trailing ` | OpticWise` suffix; 6 still exceed 70 chars and are flagged below.
- 31 `Article` JSON-LD `description: null` filled.
- 126 `Article` JSON-LD given `author` + `mainEntityOfPage`.

### Sitemap + robots

- `sitemap.xml` regenerated via `.audit/regenerate-sitemap.mjs` — 150 URLs.
- No references to `contact-cowork-dupe-please-delete` anywhere (folder already removed; `_mirror-manifest.json` and `sitemap.xml` clean).
- `robots.txt` reviewed — already correct (`Allow: /`, `Disallow: /admin/ /api/`, sitemap URL pointed at production).

---

## Remaining items — flagged for Bill, not auto-touched

Per scope, the items below are explicitly **out of automated rewrite scope** because they touch insights body copy or risk SEO impact from algorithmic title rewrites. They are listed here for Bill's editorial pass, in priority order.

### A. Insights with the shared 175-char boilerplate meta description (8 posts)

These all share the **same** generic description, which is a duplicate-content SEO problem. Worth a one-time editorial pass to write unique meta descriptions per post. Current shared text:

> `OpticWise helps commercial real estate owners own and control their data & digital infrastructure to drive NOI, AI readiness, tenant experience…`

Affected:

- `insights/built-to-last-why-smart-infrastructure-is-the-backbone-of-future-proof/`
- `insights/monetize-like-amazon-analyze-like-google-and-avoid-tesla-s-data-missteps/`
- `insights/not-just-smart-strategic-buildings-built-for-better-tenancy/`
- `insights/operational-efficiency-is-the-new-alpha-in-commercial-real-estate/`
- `insights/own-the-digital-infrastructure-own-the-leverage/`
- `insights/the-ai-model-is-commoditizing-your-owner-data-is-the-real-moat/`
- `insights/what-starbucks-taught-us-about-smart-property-ops/`
- `insights/owners-are-overwhelmednot-under-informed/` (also has long title)
- `insights/ai-agents-permissions-cre-orchestration/` (post added after the initial sweep; same pattern)

### B. Insights with unique but too-long meta descriptions (2 posts)

- `insights/Data-Is-the-New-Real-Estate-Utility/` — 183 chars
- `insights/The-LLM-Model-Just-Became-a-Commodity/` — 206 chars

### C. Insights with titles >70 chars (6 posts)

Trim 4–10 chars each (or accept; Google may truncate but indexing is unaffected).

| Title | Length | File |
|---|---|---|
| `Why Owning Your Building's Digital Infrastructure = Owning Your Data` | 73 | `insights/Data-Is-the-New-Real-Estate-Utility/` |
| `The LLM Model Just Became a Commodity. Here's What Actually Compounds in Commercial Real Estate.` | 101 | `insights/The-LLM-Model-Just-Became-a-Commodity/` |
| `Digital-First Strategy: CRE's Lasting Competitive Edge | OpticWise` | 71 | `insights/digital-first-strategy-the-only-competitive-edge-that-lasts/` |
| `Own Your Building's Digital Infrastructure — or Be Owned | OpticWise` | 73 | `insights/own-your-buildings-digital-infrastructure-or-be-owned-by-it/` |
| `CRE Owners Aren't Under-Informed — They're Overwhelmed | OpticWise` | 76 | `insights/owners-are-overwhelmednot-under-informed/` |
| `Wi-Fi Isn't a Utility — It's an Investment Signal | OpticWise` | 71 | `insights/wi-fi-is-not-a-utility-it-s-an-investment-signal/` |

### D. Insights body copy — explicitly exempt

Per Bill's scope update, banned words / bare TMs / bare-infra / missing reframing line / missing default closer in `/insights/...` body copy are **not** in scope. The audit tool now skips these checks for `/insights/`. If Bill ever wants to bring insights back into canon, the original audit script (`.audit/check.mjs`) and the broader `.audit/audit-all.mjs` (with `skipBrandAll = false` for insights) can produce a fresh body-copy report.

---

## Verification

```
$ node .audit/audit-all.mjs
Audited 151 HTML files.
=== ISSUE COUNTS BY KIND ===
  SEO_DESC_LONG                    9   ← all on insights (per A + B above)
  SEO_TITLE_LONG                   6   ← all on insights (per C above)

Top-level page issues: 0
Insights brandscript issues: not audited (per scope)
```

All 25 top-level pages + 404.html: **CLEAN**. SB7 brandscript canon and SEO mechanical hygiene both pass.
