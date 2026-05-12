#!/usr/bin/env python3
"""Inject OpticWise OWNet form embeds across the static-mirror HTML site.

Run from the repo root:

    python3 scripts/inject_form_embeds.py

What it does (idempotent — safe to re-run):

1.  Adds the Footer newsletter block to every site footer, immediately above
    the existing 5-column grid. The block is two LinkedIn newsletter CTA
    buttons ("The Owner's Standard" and "The Foundation"); we don't operate
    a newsletter outside LinkedIn. The surrounding column already provides
    the eyebrow/heading/description copy.

2.  Replaces the bottom CTA "Schedule a Complimentary Review" button on every
    top-level page (cta cta--blue section pattern) with a Schedule Review modal
    trigger (matches the nav button — opens popup via forms-embed.js shim).

3.  Same for insight detail pages / blue-gradient footer CTA: swap the legacy
    "Schedule …" button for the Schedule Review modal trigger.

Pages this script does NOT touch (already manually wired):
    - index.html (home)
    - contact/index.html

The embed widget itself lives in /forms-embed.js and /forms-embed.css and is
already <script>-included on every page in the static mirror.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# ── Embed snippets (kept inline so they match the exact strings in the HTML) ──
NEWSLETTER_BLOCK = (
    '<div class="grid grid-cols-1 gap-8 mb-12 pb-12 border-b border-white/10'
    ' md:grid-cols-2 md:gap-12 ow-footer-newsletter">'
    '<div>'
    '<p class="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">'
    'Insights Newsletter</p>'
    '<h4 class="text-base font-bold text-white mb-2">'
    'Owner-controlled CRE insights, delivered.</h4>'
    '<p class="text-sm text-white/55 leading-relaxed">'
    "A short dispatch from the OpticWise team — what&#x27;s actually working in CRE"
    " data &amp; digital infrastructure, the plays we&#x27;re running this month, and"
    ' the moves smart owners are making. No fluff, no cadence padding.</p>'
    '</div>'
    '<div class="ow-footer-linkedin-newsletters">'
    '<a class="btn btn-primary"'
    ' href="https://www.linkedin.com/newsletters/'
    'the-owner-s-standard-7453186296837156864/"'
    ' target="_blank" rel="noopener">'
    "The Owner&#x27;s Standard on LinkedIn →</a>"
    '<a class="btn btn-primary"'
    ' href="https://www.linkedin.com/newsletters/'
    'the-foundation-7453442579339124736/"'
    ' target="_blank" rel="noopener">'
    "The Foundation on LinkedIn →</a>"
    '</div>'
    '</div>'
)

SCHEDULE_REVIEW_MODAL_TRIGGER = (
    '<div class="ow-fe-cta-mount">'
    '<button type="button" class="btn btn-nav">Schedule Review</button>'
    '</div>'
)

# Bottom CTA on top-level pages (.cta cta--blue, btn-light/btn-arrow).
#
# Matches any text inside the button so we catch every variant:
# "Schedule a Complimentary Review" (home, ppp-audit, about, contact,
# property-brain, advisory-services, ...), "Schedule a Working Session"
# (portfolio-brain, for-asset-managers), "Schedule a Conversation"
# (for-tenants, for-property-managers-and-engineers), etc.
TOP_LEVEL_CTA_BUTTON_RE = re.compile(
    r'<button type="button" class="btn btn-light btn-arrow"[^>]*>'
    r'[^<]+</button>'
)
TOP_LEVEL_CTA_BUTTON_REPLACEMENT = SCHEDULE_REVIEW_MODAL_TRIGGER

# Bottom CTA on insight detail pages and a couple of utility pages
# (faq, glossary, 404). Different markup: blue-gradient background,
# white-on-blue button, text-center layout. The whole surrounding section
# already says "Complimentary CRE Data & Digital Review Session" / "YOUR
# NEXT STEP" so we only need to swap the button itself with show-header
# off; the section's own text remains visible above the form.
INSIGHT_CTA_BUTTON_RE = re.compile(
    r'<button type="button" class="btn btn-white btn-lg"[^>]*>'
    r'[^<]+</button>'
)
INSIGHT_CTA_BUTTON_REPLACEMENT = SCHEDULE_REVIEW_MODAL_TRIGGER

# Footer marker — same on every page in the mirror. We insert the newsletter
# block immediately after `<div class="ow-container py-16">` and BEFORE the
# 5-column grid that follows. Idempotent: skip if the marker is already
# preceded by the newsletter block.
FOOTER_GRID_MARKER = (
    '<div class="ow-container py-16">'
    '<div class="grid grid-cols-1 gap-10 pb-12 border-b border-white/10 md:grid-cols-5">'
)
FOOTER_REPLACEMENT = (
    '<div class="ow-container py-16">'
    + NEWSLETTER_BLOCK
    + '<div class="grid grid-cols-1 gap-10 pb-12 border-b border-white/10 md:grid-cols-5">'
)

NEWSLETTER_ALREADY_PRESENT_MARKER = 'class="ow-footer-linkedin-newsletters"'


def patch_file(path: Path) -> dict:
    """Apply the three patches to one HTML file. Returns counts per change."""
    text = path.read_text(encoding="utf-8")
    original = text

    counts = {
        "newsletter_added": 0,
        "top_level_cta_swapped": 0,
        "insight_cta_swapped": 0,
    }

    # 1. Footer newsletter — insert above the 5-col grid, only if missing.
    if NEWSLETTER_ALREADY_PRESENT_MARKER not in text:
        new_text = text.replace(FOOTER_GRID_MARKER, FOOTER_REPLACEMENT, 1)
        if new_text != text:
            counts["newsletter_added"] = 1
            text = new_text

    # 2. Top-level page bottom CTA button.
    text, n = TOP_LEVEL_CTA_BUTTON_RE.subn(TOP_LEVEL_CTA_BUTTON_REPLACEMENT, text)
    counts["top_level_cta_swapped"] = n

    # 3. Insight detail page bottom CTA button.
    text, n = INSIGHT_CTA_BUTTON_RE.subn(INSIGHT_CTA_BUTTON_REPLACEMENT, text)
    counts["insight_cta_swapped"] = n

    if text != original:
        path.write_text(text, encoding="utf-8")

    return counts


def main() -> int:
    html_files = []
    for p in ROOT.rglob("*.html"):
        # Skip .audit/, scripts/, .git/, node_modules, etc.
        rel = p.relative_to(ROOT)
        first = rel.parts[0]
        if first.startswith(".") or first in {"node_modules", "scripts"}:
            continue
        html_files.append(p)

    totals = {
        "files_touched": 0,
        "newsletter_added": 0,
        "top_level_cta_swapped": 0,
        "insight_cta_swapped": 0,
    }

    for f in sorted(html_files):
        counts = patch_file(f)
        if any(counts.values()):
            totals["files_touched"] += 1
            for k, v in counts.items():
                totals[k] += v
            print(
                f"  patched {f.relative_to(ROOT)}  "
                f"(newsletter={counts['newsletter_added']}, "
                f"top-cta={counts['top_level_cta_swapped']}, "
                f"insight-cta={counts['insight_cta_swapped']})"
            )

    print("")
    print("Summary:")
    print(f"  HTML files scanned:           {len(html_files)}")
    print(f"  Files modified:               {totals['files_touched']}")
    print(f"  Footer newsletter inserted:   {totals['newsletter_added']}")
    print(f"  Top-level CTA buttons swapped:{totals['top_level_cta_swapped']}")
    print(f"  Insight CTA buttons swapped:  {totals['insight_cta_swapped']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
