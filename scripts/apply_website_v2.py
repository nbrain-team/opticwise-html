#!/usr/bin/env python3
"""Apply v2 SLIM website changes per WEBSITE_CHANGE_APPROVAL_CHECKLIST_v2_slim.md."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
_SCRIPTS_DIR = Path(__file__).resolve().parent
if str(_SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(_SCRIPTS_DIR))
import apply_nav_consolidation_v2_1 as nav_v21  # noqa: E402

NEW_CTA_INNER = (
    '<span class="eyebrow cta__eyebrow">Your Next Step</span>'
    '<h2 class="h2 cta__heading">What&#x27;s your data &amp; digital infrastructure actually earning?</h2>'
    '<p class="cta__sub">One building. 45–90 minutes. No software pitch. No rip-and-replace.</p>'
    '<ul class="cta__bullets">'
    '<li class="cta__bullet"><strong>What data &amp; digital infrastructure you actually own</strong> — and what your vendors do</li>'
    '<li class="cta__bullet">Where recoverable NOI is sitting in your buildings — and what it&#x27;s worth at refi or exit</li>'
    '<li class="cta__bullet">Where operational burden stacks up against your KPIs, and which plays close the gap</li>'
    '<li class="cta__bullet">The top 3 monthly plays you&#x27;d actually run — utilities, insurance, occupancy</li>'
    '</ul>'
    '<button type="button" class="btn btn-light btn-arrow">Schedule a Complimentary Review</button>'
)

# Pages that receive the standard §1e CTA inner replacement.
CTA_APPROVED = {
    ROOT / "index.html",
    ROOT / "ppp-audit" / "index.html",
    ROOT / "how-we-operate" / "index.html",
    ROOT / "contact" / "index.html",
    ROOT / "digital-infrastructure-noi-ai" / "index.html",
    ROOT / "digital-infrastructure-noi-playbook" / "index.html",
    ROOT / "digital-infrastructure-noi-strategy" / "index.html",
    ROOT / "5s-user-experience-standard" / "index.html",
    ROOT / "bot-building-of-things" / "index.html",
    ROOT / "property-brain" / "index.html",
    ROOT / "ai-ready-commercial-real-estate" / "index.html",
    ROOT / "own-vs-lease-cre-building-data" / "index.html",
    ROOT / "control-cre-digital-visibility" / "index.html",
    ROOT / "advisory-services" / "index.html",
    ROOT / "for-lps-and-financiers" / "index.html",
    ROOT / "for-it-executives" / "index.html",
    ROOT / "about" / "index.html",
    ROOT / "customer-outcomes" / "index.html",
    ROOT / "working-with-us" / "index.html",
}


def patch_cta_inner(html: str) -> str:
    def repl(m: re.Match) -> str:
        return m.group(1) + NEW_CTA_INNER + m.group(3)

    return re.sub(
        r'(<div class="cta__inner">)([\s\S]*?)(</div></div></section>)',
        repl,
        html,
        count=1,
    )


def process_file(path: Path) -> bool:
    if "insights" in path.parts or path.suffix != ".html":
        return False
    html = path.read_text(encoding="utf-8")
    orig = html
    html, _ = nav_v21.patch_html(html, path)
    if path in CTA_APPROVED and '<div class="cta__inner">' in html:
        before = html
        html = patch_cta_inner(html)
        if html == before:
            print(f"WARN: CTA not patched: {path.relative_to(ROOT)}", file=sys.stderr)
    if html != orig:
        path.write_text(html, encoding="utf-8")
        return True
    return False


def main() -> None:
    changed = 0
    for path in sorted(ROOT.rglob("*.html")):
        if "insights" in path.parts:
            continue
        if process_file(path):
            changed += 1
            print("updated", path.relative_to(ROOT))
    print(f"Done. {changed} files changed.")


if __name__ == "__main__":
    main()
