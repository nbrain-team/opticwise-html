# OpticWise — Platform Buildout (Static HTML Mirror)

> Source of truth for project context across chat sessions. Read first,
> update as new architecture decisions or integration details emerge.

---

## What This Repo Is

`opticwise-html` is the **static HTML mirror of opticwise.com**, generated
from the live Next.js + Payload site by
`scripts/static-export/build-html-mirror.mjs`. It captures every URL in the
live sitemap (26 top-level pages + 126 insights/blog posts + assets) into
plain HTML/CSS/JS so the marketing site can be hosted with no Node runtime.

| Type | Count |
| --- | ---: |
| Top-level pages | 26 |
| Insights / blog posts | 126 |
| CSS / JS / image / font assets | 161 |

### Folder map

```
opticwise-html/
├── index.html                    homepage  (was /)
├── about/, contact/, faq/, ...   one folder per top-level URL
├── insights/<slug>/index.html    every blog post
├── images/, api/media/file/      static assets, brand artwork, OG images
├── styles.css                    Tailwind-based base styles
├── site.css                      OpticWise-specific component styles
├── site.js                       lightweight site behaviour (nav, etc.)
├── forms-embed.css               OWNet form widget styles
├── forms-embed.js                Schedule-Review modal launcher shim
│                                 (composes with the official OWNet
│                                 embed loader at
│                                 ownet.opticwise.com/forms/embed.js)
├── render.yaml                   Render hosting config
├── scripts/                      mirror builder + maintenance scripts
└── _mirror-manifest.json         crawler debug log
```

---

## Hosting

- Deployed on **Render** as a static site (`render.yaml` is committed).
- All asset URLs are relative paths (`./about/index.html` etc.) so the
  same files work from `file://`, `http://localhost:4321`, and the
  production domain.

### Local preview

From the repo root:

```bash
python3 -m http.server 4321
# then open http://localhost:4321/
```

Forms POST to `https://ownet.opticwise.com/api/public/forms/{slug}/submit`,
which only accepts CORS from `www.opticwise.com`. From localhost the schema
fetch falls back to a local copy in `forms-embed.js` and submissions show a
clear "couldn't reach the form server" error — that's expected, preview-only.

---

## CRM Integration — OWNet

All site forms post to OWNet, the OpticWise CRM. Schema source:

```
GET  https://ownet.opticwise.com/api/public/forms/{slug}
POST https://ownet.opticwise.com/api/public/forms/{slug}/submit
```

Schema response shape:

```json
{ "form": { "id", "slug", "name", "description",
            "submitButtonLabel", "successMessage",
            "honeypotFieldName",
            "fields": [{ "fieldKey", "fieldType", "label",
                         "required", "placeholder", "helpText", "options" }] } }
```

Submission body is flat: `{ [fieldKey]: value, [honeypotFieldName]: "" }`.

### Active form slugs

| Slug | Where it mounts | OWNet CRM destination |
| --- | --- | --- |
| `schedule-review` | Bottom CTA on every page (and modal trigger from any "Schedule Review"-style button) | New "Schedule Review" leads |
| `inbound-contact` | `/contact` Block 3 (Send a Message) | Landing Pages Leads → "OW website inbound" stage, deal owner Bill |
| `ppp-starter-kit` | Home page lead-magnet section (dark card) | PPP Starter Kit downloaders |
| `insights-newsletter` | Footer row (every page) | Newsletter subscribers |

Schemas are fetched live from OWNet by the **official** loader at
`https://ownet.opticwise.com/forms/embed.js`. There are no local
fallback schemas — every form on the site reflects whatever the OWNet
Form Builder currently has live. **Field schemas are owned by OWNet
admin — do not duplicate them in this repo.**

---

## Form Embed Stack

Two scripts cooperate on every page:

1. **Official OWNet loader** —
   `<script src="https://ownet.opticwise.com/forms/embed.js" defer>`.
   Auto-mounts every `<div data-opticwise-form="<slug>">` it finds on
   `DOMContentLoaded`, fetching the live schema and injecting its own
   scoped CSS under `.ow-form-embed`. Exposes
   `window.OpticWiseForms.mount(node)` for late-injected divs.

2. **Local launcher shim** —
   `<script src="/forms-embed.js?v=N" defer>`. Tiny script (~7 KB) that
   intercepts clicks on any "Schedule X" CTA button (nav, hero,
   mid-page) and opens a modal containing
   `<div data-opticwise-form="schedule-review">`, then asks the official
   loader to mount it via `window.OpticWiseForms.mount(...)`. Bump the
   `?v=` query string with `scripts/cache_bust_shim.py <N>` after any
   behaviour change so visitors get the new copy on next page load
   instead of waiting for Render's cache TTL to expire.

### Markup contract for inline embeds

```html
<div data-opticwise-form="<slug>"
     data-eyebrow="EYEBROW COPY"
     data-heading="Heading copy"
     data-description="Sub copy."
     data-theme="dark"            <!-- optional, dark-surface variant -->
     data-align="left"            <!-- optional, left-aligned in container -->
     data-show-header="false">    <!-- optional, hide eyebrow/heading/sub -->
</div>
```

### Schedule Review modal trigger (zero-config — text-based)

Any `<button>` or `<a>` whose visible text matches one of:

- "Schedule Review"
- "Schedule Your Review"
- "Schedule a Complimentary Review"
- "Schedule a Working Session"
- "Schedule a Conversation"
- "Schedule a PPP Audit™"

opens the Schedule Review modal automatically. The modal is lazy-built
on first click, mounted via `window.OpticWiseForms.mount`, and dismissed
on backdrop click, the close button, or the Escape key. Cmd/Ctrl/Shift
clicks on `<a>` triggers fall through so power users can still
"open in new tab".

### Where each form is placed

- **Home (`/index.html`)**
  - PPP Starter Kit dark card in the `.starter` section (replaces the
    old inline `<form>` with a single email field).
  - Schedule Review embed inside the bottom `.cta--blue` section (replaces
    the "Schedule a Complimentary Review" button).
  - Insights Newsletter in the footer (top of `<footer>`, two-column row
    above the existing 5-column links grid).

- **`/contact`**
  - `data-opticwise-form="inbound-contact"` inline mount inside
    `<section id="contact-form">`.
  - Schedule Review in the bottom CTA, Newsletter in the footer.

- **`/ppp-audit`, `/about`, all pillar pages, every insight detail page**
  - Schedule Review embed in the bottom CTA section.
  - Newsletter in the footer.

- **Every other top-level page (faq, glossary, customer outcomes, audience
  pages, NOI pages, BoT, 5S, advisory, etc.)**
  - Schedule Review embed in the bottom CTA section.
  - Newsletter in the footer.

The bulk placement is handled by `scripts/inject_form_embeds.py` (idempotent;
safe to re-run after regenerating the static mirror).

---

## Brand & UX Constraints

- "data & digital infrastructure" — keep the ampersand.
- Trademarks intact: **Peak Property Performance®**, **PPP 5C™**, **PPP Audit™**,
  **BoT®** / **Building of Things®**, **Property Brain™**, **Portfolio Brain™**,
  **5S®**.
- One phone number only: 888-OpticWise / 888-678-4294. Internal Twilio number
  (888-623-6890) stays internal.
- Banned words: leverage, synergy, ecosystem, holistic, seamless, cutting-edge,
  ESG, PropTech.
- Use external/global CSS (`styles.css`, `site.css`, `forms-embed.css`).
  Avoid inline styles unless absolutely necessary.

---

## Maintenance Scripts

| Script | What it does |
| --- | --- |
| `scripts/static-export/build-html-mirror.mjs` | Wipe + regenerate the entire `opticwise-html/` mirror from the live `www.opticwise.com` sitemap. Run after marketing changes ship to the live site. |
| `scripts/build-insights-index.mjs` | Refresh `/insights/index.html` + `/insights/search-index.json` after adding/editing a blog post. |
| `scripts/inject_form_embeds.py` | Inject Insights Newsletter into every footer + replace bottom-CTA buttons with Schedule Review embeds. Idempotent. Re-run after a fresh mirror build. |

---

## Known Behaviour from Localhost

- Schema fetch from OWNet is **CORS-blocked** from any origin other than
  `www.opticwise.com`. The widget falls back to local schemas so the UI
  renders correctly. Submissions still POST to the real endpoint and will
  surface a network error on localhost — that's expected, preview-only.
- Forms work end-to-end on production.
