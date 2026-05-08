# OpticWise Contact Page — Build & Maintenance Spec

**Page file:** `index.html` (sibling of this README)
**Live URL:** `https://www.opticwise.com/contact`

This is the canonical spec for the `/contact` page. The page exists in this directory with all 5 blocks already built. This file documents what the page contains, how the three ways in are wired, and what to fix if anything drifts. Brand copy is the source of truth — if the live page contradicts what's here, update the page.

---

## TL;DR

`/contact` gives visitors **three ways in**, exposed via Block 3 (CardGrid) and supported by the rest of the layout:

| Way | Where | How it's wired |
|---|---|---|
| Form | Block 2 Card 1 + Block 3 (embedded form) | `<a href="#contact-form">` → mounts via `data-form-embed="inbound-contact"` |
| Email | Block 2 Card 2 | `<a href="mailto:info@opticwise.com" target="_blank" rel="noopener noreferrer">` (opens in new tab so the visitor stays on the site) |
| Phone | Block 2 Card 3 | `<a href="tel:+18886784294">` (888-OPTICWISE) |

**Backend:** Form submissions POST to OWNet at `https://ownet.opticwise.com/api/public/forms/inbound-contact/submit`. New leads land in the OWNet "Landing Pages Leads" pipeline at the "OW website inbound" stage, with Bill as deal owner.

**Layout:** 5 blocks, in order — Hero (dark) → CardGrid (dark, 3 cards) → FormEmbed mount → TwoColumn (dark) → CallToAction (blue).

---

## How the form embed works

The static page mounts the OWNet form via the existing `forms-embed.js` widget at the repo root. The pattern:

```html
<section id="contact-form" class="bg-gray-50 py-16 md:py-20">
  <!-- section eyebrow + heading + sub (on-brand copy) -->
  <div data-form-embed="inbound-contact" class="ow-fe-mount rounded-2xl bg-white p-6 shadow-sm md:p-8"></div>
</section>
```

The **section** carries `id="contact-form"` so anchor links land on the heading, not the form fields. The **inner div** carries `data-form-embed="inbound-contact"` — that's what `forms-embed.js` looks for to mount the form.

`forms-embed.js` finds every element with `[data-form-embed]` on load (and via a MutationObserver), fetches the schema from `https://ownet.opticwise.com/api/public/forms/{slug}`, and renders the form in place. A localhost fallback schema for `inbound-contact` lives inside `forms-embed.js` under `FALLBACK_SCHEMAS` so previews work without OWNet (the production POST still fails from localhost due to CORS — preview-only).

The widget renders its own `.ow-fe-header` (eyebrow/heading/sub from the OWNet schema). On `/contact` the section already provides on-brand header copy, so a CSS rule in `site.css` hides `#contact-form .ow-fe-header` to avoid the double-heading.

**Form fields (managed in OWNet, mirrored in the local fallback):**
- `first_name` — required
- `last_name` — required
- `email` — required, type email
- `company`
- `field_6` — Title/Role
- `reason` — textarea

Do **not** modify form fields in this repo. Field schema is owned by OWNet admin.

---

## Block-by-block content (canonical copy)

### Block 1 — Hero (style: dark)

| Field | Value |
|---|---|
| Eyebrow | Get in Touch |
| Heading | One Real Person. One Business Day. |
| Lede | OpticWise works with CRE owners, asset managers, and operators who want to turn their data & digital infrastructure into an owner-controlled asset. Reach out by form, by email, or by phone. We respond personally within one business day — not with autoresponders, not with sales sequences. The person on the other end is a real member of the OpticWise team. |
| Reframe Line | If you don't own your data & digital infrastructure, your vendors do — let's talk about who owns what at your buildings. |
| Audience Line | For CRE owners, asset managers, IT executives, property managers, GPs, LPs, financiers, tenants, residents, and anyone evaluating OpticWise as a partner-operator. |
| Primary CTA | `<a href="#contact-form" class="btn btn-primary btn-arrow">Contact us</a>` |

### Block 2 — CardGrid (style: dark, 3 columns) — *the three ways in*

| Field | Value |
|---|---|
| Eyebrow | Three Ways |
| Heading | Reach Us How You Prefer. |

**Card 1 — Send a Message** → `href="#contact-form"`
> Use the form below to share your name, company, and what you're working on. Goes directly to our CRM. Real person responds within one business day.

**Card 2 — Email Us Directly** → `href="mailto:info@opticwise.com"`
> Prefer to use your own email client? Reach us at info@opticwise.com. Same response time, same person on the other end.

**Card 3 — Call Us at 888-OpticWise (888-678-4294)** → `href="tel:+18886784294"`
> Existing clients, tenants, and residents press 1 for live support. New conversations press 2 — our AI assistant Willow takes your information and the team responds within one business day. Available 24/7.

### Block 3 — FormEmbed mount

The wrapping section carries `id="contact-form"` (anchor target). The inner div carries `data-form-embed="inbound-contact"` (mount point).

| Field | Value |
|---|---|
| Section anchor | `<section id="contact-form" class="bg-gray-50 py-16 md:py-20">` |
| Eyebrow | Send a Message |
| Heading | Tell Us What You're Working On. |
| Subheading | We respond within one business day. Required fields: first name, last name, and email. Everything else is helpful context, not a gate. |
| Mount div | `<div data-form-embed="inbound-contact" class="ow-fe-mount rounded-2xl bg-white p-6 shadow-sm md:p-8"></div>` |

### Block 4 — TwoColumn (style: dark)

| Field | Value |
|---|---|
| Eyebrow | Who You're Reaching |
| Heading | OpticWise Is Not a Vendor. It's a Partner-Operator. |
| Lede | When you reach out, you're not entering a sales funnel. You're starting a conversation with the team that designs, implements, and operates owner-controlled data & digital infrastructure for CRE. |
| Authority Note | OpticWise is the firm behind Peak Property Performance® (Fast Company Press), the PPP 5C™ methodology, BoT® (Building of Things®), and Property Brain™ → Portfolio Brain™ — the owner-controlled intelligence layer that lets any LLM, vendor platform, or analytics tool act on your buildings under your governance. Twenty-plus years of CRE experience. Recognition from 13+ industry publications including The Silicon Review, PropTech Outlook, CIO Bulletin, and Global 100. Vendor-agnostic, LLM-agnostic, owner-controlled by design. |

### Block 5 — CallToAction (style: blue)

| Field | Value |
|---|---|
| Eyebrow | Your Next Step |
| Heading | Send a Message. |
| Subheading | Real person on the other end. One business day to respond. No drip campaigns, no sales sequences. We map what you own, where the data lives, and where the recoverable NOI sits — without a software pitch. |
| Button | `<a href="#contact-form" class="btn btn-light btn-arrow">Contact us</a>` |

Bullets:
1. What digital infrastructure you actually own — and what your vendors do
2. Where your data lives, and how portable it is
3. Where operational burden stacks up against your KPIs
4. The top three monthly plays you would actually use — not another dashboard

---

## Verify

After any edit to `index.html`, walk this checklist:

- [ ] All 5 blocks render in order: Hero, CardGrid (3 cards), FormEmbed mount, TwoColumn, CallToAction
- [ ] Hero "Send a Message" anchors to `#contact-form` and scrolls to the form (nav doesn't cover the form heading)
- [ ] Card 1 ("Send a Message") → scrolls to `#contact-form`
- [ ] Card 2 ("Email Us Directly") → opens email client with `info@opticwise.com` pre-filled
- [ ] Card 3 ("Call Us") → opens dial prompt with `+18886784294` on mobile
- [ ] The form mount renders all 6 fields: First name, Last name, Work email, Company, Title/Role, Reason
- [ ] Test submission completes → thank-you message shown → new record appears in OWNet "Landing Pages Leads" pipeline at the "OW website inbound" stage with Bill as deal owner *(production only — localhost will fail at the POST step due to CORS, that's expected)*
- [ ] Final CTA button anchors back to `#contact-form`
- [ ] Footer `/contact` link from any page reaches this page

If any item fails, fix in the repo and re-deploy.

---

## Constraints

- Do **not** modify the OWNet `inbound-contact` form schema from this repo — it's managed in OWNet admin separately. The local fallback in `forms-embed.js` is preview-only.
- Do **not** publish any other phone numbers — only 888-OPTICWISE / 888-678-4294. The Twilio internal number 888-623-6890 stays internal.
- Do **not** add other contact paths to this page (no chat widget, no calendar embed, no newsletter form). Three ways in. That's the whole point.
- Brand canon: *"data & digital infrastructure"* (with ampersand), reframe line as written, asset-manager lens, all trademarks intact (Peak Property Performance®, PPP 5C™, BoT® / Building of Things®, Property Brain™, Portfolio Brain™). Banned words: leverage, synergy, ecosystem, holistic, seamless, cutting-edge, ESG, PropTech.
