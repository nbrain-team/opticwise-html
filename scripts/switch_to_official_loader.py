#!/usr/bin/env python3
"""Switch every HTML page in the static mirror over to the OFFICIAL OpticWise
form loader hosted at https://ownet.opticwise.com/forms/embed.js.

What it does (idempotent — safe to re-run):

1.  Removes the local <link rel="stylesheet" href="/forms-embed.css"> tag.
    The official loader injects its own scoped CSS (.ow-form-embed namespace).

2.  Replaces the local <script src="/forms-embed.js" defer></script> with the
    official loader <script src="https://ownet.opticwise.com/forms/embed.js"
    defer></script>. This guarantees every embed always shows whatever the
    OWNet Form Builder currently has configured — no stale local fallbacks.

3.  Adds data-theme="dark" to the footer Insights Newsletter embed so it
    styles correctly on the dark navy footer surface (the loader's default
    is a light/white card, which would clash on a dark background).

Run from the repo root:

    python3 scripts/switch_to_official_loader.py
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Old (homegrown) tags — exact strings produced by the static-mirror builder.
OLD_CSS_LINK = '<link rel="stylesheet" href="/forms-embed.css"/>\n'

# We KEEP /forms-embed.js (it's now a tiny scroll-to-#cta shim that catches
# hero/nav "Schedule X" buttons). We ADD the official loader script which
# does the actual form rendering. Order matters: official loader first so
# OpticWiseForms.* is defined when the shim runs.
OLD_LOCAL_JS = '<script src="/forms-embed.js" defer></script>'
NEW_DUAL_TAGS = (
    '<script src="https://ownet.opticwise.com/forms/embed.js" defer></script>'
    '\n<script src="/forms-embed.js" defer></script>'
)
OFFICIAL_LOADER_MARKER = (
    'src="https://ownet.opticwise.com/forms/embed.js"'
)

# Footer newsletter embed — add data-theme="dark" if missing so the loader's
# dark theme is used on the dark navy footer.
NEWSLETTER_OLD = (
    '<div data-opticwise-form="insights-newsletter"'
    ' data-align="left" data-show-header="false"></div>'
)
NEWSLETTER_NEW = (
    '<div data-opticwise-form="insights-newsletter"'
    ' data-theme="dark" data-align="left" data-show-header="false"></div>'
)


def patch_file(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    original = text

    counts = {"css_removed": 0, "loader_added": 0, "shim_added": 0, "newsletter_dark": 0}

    if OLD_CSS_LINK in text:
        text = text.replace(OLD_CSS_LINK, "")
        counts["css_removed"] = 1

    has_official = OFFICIAL_LOADER_MARKER in text
    has_local = OLD_LOCAL_JS in text

    if not has_official and has_local:
        # Page still has the homegrown tag — replace with both.
        text = text.replace(OLD_LOCAL_JS, NEW_DUAL_TAGS, 1)
        counts["loader_added"] = 1
        counts["shim_added"] = 1
    elif has_official and not has_local:
        # Page already has the official loader (from a previous run) but is
        # missing the local scroll-to-CTA shim — add it right after.
        text = text.replace(
            '<script src="https://ownet.opticwise.com/forms/embed.js" defer></script>',
            NEW_DUAL_TAGS,
            1,
        )
        counts["shim_added"] = 1
    elif not has_official and not has_local:
        # Neither present — inject both right before </head>.
        if "</head>" in text:
            text = text.replace("</head>", NEW_DUAL_TAGS + "\n</head>", 1)
            counts["loader_added"] = 1
            counts["shim_added"] = 1

    if NEWSLETTER_OLD in text:
        text = text.replace(NEWSLETTER_OLD, NEWSLETTER_NEW)
        counts["newsletter_dark"] = text.count(NEWSLETTER_NEW) - original.count(
            NEWSLETTER_NEW
        )

    if text != original:
        path.write_text(text, encoding="utf-8")
    return counts


def main() -> int:
    files = []
    for p in ROOT.rglob("*.html"):
        rel = p.relative_to(ROOT)
        if rel.parts[0].startswith(".") or rel.parts[0] in {"node_modules", "scripts"}:
            continue
        files.append(p)

    totals = {
        "files_touched": 0,
        "css_removed": 0,
        "loader_added": 0,
        "shim_added": 0,
        "newsletter_dark": 0,
    }
    for f in sorted(files):
        c = patch_file(f)
        if any(c.values()):
            totals["files_touched"] += 1
            for k, v in c.items():
                totals[k] += v
            print(
                f"  patched {f.relative_to(ROOT)}  "
                f"(css={c['css_removed']}, loader={c['loader_added']}, "
                f"shim={c['shim_added']}, newsletter-dark={c['newsletter_dark']})"
            )

    print()
    print("Summary:")
    print(f"  HTML files scanned:                       {len(files)}")
    print(f"  Files modified:                           {totals['files_touched']}")
    print(f"  /forms-embed.css <link> tags removed:     {totals['css_removed']}")
    print(f"  Official OWNet loader added:              {totals['loader_added']}")
    print(f"  Local scroll-shim re-added:               {totals['shim_added']}")
    print(f"  Newsletter embeds set to data-theme=dark: {totals['newsletter_dark']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
