#!/usr/bin/env python3
"""Apply WEBSITE_NAV_CONSOLIDATION_v2_1.md — Why OpticWise dropdown + footer label."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# Three standalone top-level items before Insights (main site after Phase 1 v2).
NAV_THREE = re.compile(
    r'<li><a class="text-sm font-medium transition-colors text-white/85 hover:text-white" '
    r'href="(?P<h1>[^"]+)">How It Works</a></li>'
    r'<li><a class="text-sm font-medium transition-colors text-white/85 hover:text-white" '
    r'href="(?P<h2>[^"]+)">Customer Outcomes</a></li>'
    r'<li><a class="text-sm font-medium transition-colors text-white/85 hover:text-white" '
    r'href="(?P<h3>[^"]+)">Working With Us</a></li>'
    r'(?P<insights><li class="nav__dropdown" tabindex="0"><a class="nav__dropdown-trigger text-sm font-medium !text-white/85" href="[^"]*insights[^"]*">Insights</a>)'
)

# Single "How It Works" before Insights (insights posts, 404, insights/index).
NAV_ONE = re.compile(
    r'<li><a class="text-sm font-medium transition-colors text-white/85 hover:text-white" '
    r'href="(?P<h1>[^"]+)">How It Works</a></li>'
    r'(?P<insights><li class="nav__dropdown" tabindex="0"><a class="nav__dropdown-trigger text-sm font-medium !text-white/85" href="[^"]*insights[^"]*">Insights</a>)'
)

EXPLORE_PAIR = re.compile(
    r'(<h4 class="text-xs font-bold uppercase tracking-widest text-white/35 mb-4">Explore</h4>'
    r'<ul class="space-y-2\.5">)'
    r'<li><a class="text-sm hover:text-white transition-colors" href="[^"]+">Customer Outcomes</a></li>'
    r'<li><a class="text-sm hover:text-white transition-colors" href="[^"]+">Working With Us</a></li>'
)

FOOTER_HOW = re.compile(
    r'(<a class="text-sm hover:text-white transition-colors" href="[^"]*how-we-operate[^"]*">)'
    r'How We Operate'
    r'(</a>)'
)


def _why_block(h1: str, h2: str, h3: str) -> str:
    return (
        '<li class="nav__dropdown" tabindex="0">'
        '<span class="nav__dropdown-trigger text-sm font-medium !text-white/85">Why OpticWise</span>'
        '<div class="nav__dropdown-menu">'
        f'<a class="nav__link" href="{h1}">How It Works</a>'
        f'<a class="nav__link" href="{h2}">Customer Outcomes</a>'
        f'<a class="nav__link" href="{h3}">Working With Us</a>'
        '</div></li>'
    )


def _peers_from_how(h1: str) -> tuple[str, str, str]:
    return (
        h1,
        h1.replace('how-we-operate', 'customer-outcomes'),
        h1.replace('how-we-operate', 'working-with-us'),
    )


def patch_html(html: str, path: Path) -> tuple[str, bool]:
    changed = False
    consolidated = 'Why OpticWise</span>' in html

    if not consolidated:
        m = NAV_THREE.search(html)
        if m:
            block = _why_block(m.group('h1'), m.group('h2'), m.group('h3'))
            html = NAV_THREE.sub(block + m.group('insights'), html, count=1)
            consolidated = True
            changed = True
        else:
            m2 = NAV_ONE.search(html)
            if m2:
                h1, h2, h3 = _peers_from_how(m2.group('h1'))
                block = _why_block(h1, h2, h3)
                html = NAV_ONE.sub(block + m2.group('insights'), html, count=1)
                consolidated = True
                changed = True
            elif 'Customer Outcomes</a></li>' in html and 'nav__dropdown-menu' in html:
                print(f"WARN: unresolved nav pattern: {path}", file=sys.stderr)

    if EXPLORE_PAIR.search(html):
        html = EXPLORE_PAIR.sub(r'\1', html, count=1)
        changed = True

    new_html, n = FOOTER_HOW.subn(r'\1How It Works\2', html)
    if n:
        html = new_html
        changed = True

    return html, changed


def main() -> None:
    n_files = 0
    for path in sorted(ROOT.rglob('*.html')):
        text = path.read_text(encoding='utf-8')
        new_text, c = patch_html(text, path)
        if c:
            path.write_text(new_text, encoding='utf-8')
            n_files += 1
            print('updated', path.relative_to(ROOT))
    print(f'Done. {n_files} files changed.')


if __name__ == '__main__':
    main()
