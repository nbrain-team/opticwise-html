#!/usr/bin/env python3
"""One-shot extractor for the Greg audit pass.

Pulls hero/CTA-relevant copy from each non-blog page so we can run the five-pass
checklist without re-reading multi-thousand-line minified HTML files.
"""
from __future__ import annotations

import re
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

SKIP_DIRS = {"insights", "blog", "api", "images", "scripts", ".audit", ".cursor", ".git"}

PAGE_PATHS: list[Path] = []
PAGE_PATHS.append(ROOT / "index.html")
for d in sorted(ROOT.iterdir()):
    if d.is_dir() and d.name not in SKIP_DIRS:
        idx = d / "index.html"
        if idx.exists():
            PAGE_PATHS.append(idx)

CLASS_PATTERNS = [
    ("hero__eyebrow", r'class="eyebrow hero__eyebrow"[^>]*>(.*?)</span>'),
    ("hero__heading", r'class="h-display hero__heading"[^>]*>(.*?)</h1>'),
    ("hero__lede", r'class="lede hero__lede"[^>]*>(.*?)</p>'),
    ("hero__reframe", r'class="hero__reframe"[^>]*>(.*?)</p>'),
    ("hero__audience", r'class="hero__audience"[^>]*>(.*?)</p>'),
    ("cta__heading", r'class="h2 cta__heading"[^>]*>(.*?)</h2>'),
    ("cta__sub", r'class="cta__sub"[^>]*>(.*?)</p>'),
    ("cta__bullet_block", r'<ul class="cta__bullets">(.*?)</ul>'),
    ("h2_block", r'<h2 class="h2"[^>]*>(.*?)</h2>'),
    ("avoid__punch", r'class="avoid__punch"[^>]*>(.*?)</p>'),
    ("fiveplan__punch", r'class="fiveplan__punch"[^>]*>(.*?)</p>'),
    ("twocol__authority", r'class="twocol__authority"[^>]*>(.*?)</p>'),
    ("quote__text", r'class="quote__text"[^>]*>(.*?)</blockquote>'),
    ("title", r'<title>(.*?)</title>'),
    ("meta_desc", r'<meta name="description" content="([^"]*)"'),
]


def clean(text: str) -> str:
    text = re.sub(r"<!--.*?-->", "", text, flags=re.DOTALL)
    text = re.sub(r"<[^>]+>", " ", text)
    text = unescape(text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def extract(html: str) -> dict[str, list[str]]:
    out: dict[str, list[str]] = {}
    for label, pattern in CLASS_PATTERNS:
        matches = re.findall(pattern, html, flags=re.DOTALL)
        cleaned = [clean(m) for m in matches if m.strip()]
        cleaned = [c for c in cleaned if c]
        if cleaned:
            out[label] = cleaned
    return out


def main() -> None:
    for path in PAGE_PATHS:
        rel = path.relative_to(ROOT)
        html = path.read_text(encoding="utf-8")
        data = extract(html)
        print("=" * 80)
        print(f"PAGE: {rel}")
        print("=" * 80)
        for label in [
            "title",
            "meta_desc",
            "hero__eyebrow",
            "hero__heading",
            "hero__lede",
            "hero__reframe",
            "hero__audience",
            "h2_block",
            "twocol__authority",
            "fiveplan__punch",
            "avoid__punch",
            "quote__text",
            "cta__heading",
            "cta__sub",
            "cta__bullet_block",
        ]:
            vals = data.get(label, [])
            if not vals:
                continue
            for v in vals:
                print(f"[{label}] {v}")
        print()


if __name__ == "__main__":
    main()
