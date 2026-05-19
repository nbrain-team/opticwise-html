#!/usr/bin/env python3
"""One-time sweep: append Privacy Policy + Terms of Use links to the copyright
row in every site-wide footer.

Inserted markup:

    OpticWise. All rights reserved. · <a href="/privacy/">Privacy Policy</a>
    · <a href="/terms/">Terms of Use</a>

Root-relative hrefs work from any page depth (root, /faq/, /insights/<slug>/).

The script is idempotent — if the row already contains a link to /privacy/
it is left alone. Safe to re-run.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Two minified variants exist:
#   1) Next.js-export footers carry HTML comment fragments around the year
#      ("© <!-- -->2026<!-- --> OpticWise. All rights reserved.")
#   2) Hand-written or post-processed footers collapse those comments.
# We treat them with a single regex that tolerates the optional comments.

COPYRIGHT_RE = re.compile(
    r'(<p class="text-xs text-white/30">©[^<]*'
    r'(?:<!--\s*-->)?\s*2026\s*(?:<!--\s*-->)?\s*'
    r'OpticWise\. All rights reserved\.)(</p>)'
)

LINK_SUFFIX = (
    ' · <a class="hover:text-white transition-colors" href="/privacy/">'
    'Privacy Policy</a>'
    ' · <a class="hover:text-white transition-colors" href="/terms/">'
    'Terms of Use</a>'
)

# Marker that signals the suffix has already been added (idempotency guard).
ALREADY_PATCHED = 'href="/privacy/">Privacy Policy</a>'


def patch(path: Path) -> str:
    text = path.read_text(encoding="utf-8")
    if ALREADY_PATCHED in text:
        return "skip"
    new = COPYRIGHT_RE.sub(r"\1" + LINK_SUFFIX + r"\2", text, count=1)
    if new == text:
        return "no-match"
    path.write_text(new, encoding="utf-8")
    return "patched"


def main() -> int:
    skipped = patched = no_match = 0
    misses: list[str] = []
    for html in sorted(ROOT.rglob("*.html")):
        # Don't recurse into node_modules / build outputs.
        if any(part in {"node_modules", ".git"} for part in html.parts):
            continue
        outcome = patch(html)
        if outcome == "skip":
            skipped += 1
        elif outcome == "patched":
            patched += 1
        else:
            no_match += 1
            misses.append(str(html.relative_to(ROOT)))

    print(f"patched: {patched}")
    print(f"already had links (skipped): {skipped}")
    print(f"no copyright row found: {no_match}")
    if misses:
        print("\nFiles without the expected footer pattern:")
        for m in misses:
            print(f"  - {m}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
