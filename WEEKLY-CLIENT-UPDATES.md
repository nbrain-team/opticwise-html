# Weekly Client Updates

### 2026-05-11 — Site-wide CRM-connected forms

- **What we did**: Replaced the static "Schedule a Complimentary Review",
  "Schedule Your Review", "Schedule a Working Session" and similar buttons
  in every page's bottom CTA section with the live OWNet **Schedule
  Review** form, so visitors can submit their request inline without
  jumping to another page or modal. The same form continues to open as a
  modal from any "Schedule Review" link in the navigation or hero.
- **What we did**: Replaced the home page's old single-email "Get the PPP
  Starter Kit" form with the full **PPP Starter Kit** OWNet form (Full
  Name, Work Email, Company, Portfolio Size) on a brand-aligned dark card
  alongside the book cover.
- **What we did**: Switched `/contact` over to the production-shape
  **Inbound Contact** form (First Name, Last Name, Email, Company, Phone,
  "What you're working on") — the message field is now required and
  helpful copy explains the one-business-day response.
- **What we did**: Added the **Insights Newsletter** signup to the global
  footer of every page (157 pages). Two-column footer row with on-brand
  copy on the left and a compact email-capture form on the right that
  posts directly to OWNet.
- **Why it matters**: Every form on the site now writes leads straight
  into the OpticWise CRM under the right pipeline and stage — no more
  email-only contact paths, no more lead drop-off between page click and
  form open. The PPP Starter Kit and Newsletter signups are first-class
  acquisition surfaces, not afterthoughts.
- **Under the hood**: Extended the existing `forms-embed.js` widget to
  support a per-mount config (`data-eyebrow`, `data-heading`,
  `data-description`, `data-theme="dark"`, `data-align="left"`,
  `data-show-header="false"`) so the same widget powers four different
  forms across four different surface designs (dark hero card, blue CTA
  panel, white contact card, dark footer column) without one-off CSS or
  per-page JS. Local fallback schemas mirror production exactly so
  previews are accurate.
