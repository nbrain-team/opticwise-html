#!/usr/bin/env python3
"""Stamp a cache-bust query string onto the local /forms-embed.js script tag
across every HTML page. Run this whenever the shim's behaviour changes so
visitors who already have the previous version cached get the new copy on
their next page load instead of waiting for Render's 1-hour TTL on
/forms-embed.js to expire.

Usage:

    python3 scripts/cache_bust_shim.py 3

This rewrites every

    <script src="/forms-embed.js" defer></script>
    <script src="/forms-embed.js?v=2" defer></script>

to

    <script src="/forms-embed.js?v=3" defer></script>

(idempotent — safe to re-run with the same or a higher version).
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

SHIM_TAG_RE = re.compile(
    r'<script\s+src="/forms-embed\.js(?:\?v=\d+)?"\s+defer></script>'
)


def patch_file(path: Path, version: int) -> int:
    text = path.read_text(encoding="utf-8")
    new_tag = f'<script src="/forms-embed.js?v={version}" defer></script>'
    new_text, count = SHIM_TAG_RE.subn(new_tag, text)
    if new_text != text:
        path.write_text(new_text, encoding="utf-8")
    return count


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print("Usage: python3 scripts/cache_bust_shim.py <version-int>")
        return 1
    try:
        version = int(argv[1])
    except ValueError:
        print(f"Version must be an integer (got {argv[1]!r}).")
        return 1

    files = []
    for p in ROOT.rglob("*.html"):
        rel = p.relative_to(ROOT)
        if rel.parts[0].startswith(".") or rel.parts[0] in {"node_modules", "scripts"}:
            continue
        files.append(p)

    touched = 0
    total_tags = 0
    for f in sorted(files):
        c = patch_file(f, version)
        if c:
            touched += 1
            total_tags += c
    print(f"Bumped /forms-embed.js to ?v={version} in {touched} files ({total_tags} script tags).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
