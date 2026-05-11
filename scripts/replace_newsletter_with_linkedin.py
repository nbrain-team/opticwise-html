#!/usr/bin/env python3
"""One-time sweep: replace the in-house Insights Newsletter signup mount
in the static-mirror footer with two LinkedIn newsletter buttons.

We don't operate a newsletter outside LinkedIn; the two destinations are
"The Owner's Standard" and "The Foundation". Left-column copy in the
footer is unchanged — only the right-column form mount is replaced.

Idempotent: skip files that already have the LinkedIn block.

Run from the repo root:

    python3 scripts/replace_newsletter_with_linkedin.py
"""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Exact string the static mirror emits today (post switch_to_official_loader).
FORM_MOUNT = (
    '<div data-opticwise-form="insights-newsletter"'
    ' data-theme="dark" data-align="left" data-show-header="false"></div>'
)

# Variant without data-theme="dark" — in case any page predates the loader
# switch. Kept for completeness; current mirror should not have this.
FORM_MOUNT_LEGACY = (
    '<div data-opticwise-form="insights-newsletter"'
    ' data-align="left" data-show-header="false"></div>'
)

LINKEDIN_BLOCK = (
    '<div class="ow-footer-linkedin-newsletters">'
    '<a class="btn btn-white"'
    ' href="https://www.linkedin.com/newsletters/'
    'the-owner-s-standard-7453186296837156864/"'
    ' target="_blank" rel="noopener">'
    "The Owner&#x27;s Standard on LinkedIn →</a>"
    '<a class="btn btn-white"'
    ' href="https://www.linkedin.com/newsletters/'
    'the-foundation-7453442579339124736/"'
    ' target="_blank" rel="noopener">'
    "The Foundation on LinkedIn →</a>"
    "</div>"
)

LINKEDIN_MARKER = 'class="ow-footer-linkedin-newsletters"'


def patch_file(path: Path) -> int:
    text = path.read_text(encoding="utf-8")
    if LINKEDIN_MARKER in text:
        return 0
    original = text
    if FORM_MOUNT in text:
        text = text.replace(FORM_MOUNT, LINKEDIN_BLOCK)
    elif FORM_MOUNT_LEGACY in text:
        text = text.replace(FORM_MOUNT_LEGACY, LINKEDIN_BLOCK)
    if text != original:
        path.write_text(text, encoding="utf-8")
        return 1
    return 0


def main() -> int:
    files = []
    for p in ROOT.rglob("*.html"):
        rel = p.relative_to(ROOT)
        if rel.parts[0].startswith(".") or rel.parts[0] in {"node_modules", "scripts"}:
            continue
        files.append(p)

    touched = 0
    for f in sorted(files):
        if patch_file(f):
            touched += 1
            print(f"  patched {f.relative_to(ROOT)}")
    print()
    print("Summary:")
    print(f"  HTML files scanned:  {len(files)}")
    print(f"  Files modified:      {touched}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
