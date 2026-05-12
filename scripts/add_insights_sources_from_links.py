#!/usr/bin/env python3
"""
Append <div class="references"> blocks to Insight posts whose body already
hyperlinks outbound https sources — no invented URLs.

Skips HTML that already contains class="references".
Skips ghost bodies with zero outbound links after filtering (internal OW, fonts, GA).

Usage:
  python3 scripts/add_insights_sources_from_links.py [--dry-run]
"""

from __future__ import annotations

import argparse
import html as html_mod
import re
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

ROOT = Path(__file__).resolve().parents[1]
INSIGHTS = ROOT / "insights"
GO_MARKER = '<div class="ghost-content">'
SENTINEL = '</div></div></section><section class="relative overflow-hidden py-24"'
ANCHOR_RE = re.compile(
    r'<a\s[^>]*\bhref=(["\'])([^"\']+)\1[^>]*>(.*?)</a>',
    re.DOTALL | re.IGNORECASE,
)

TRACKING_HOST_FRAGMENTS = frozenset(
    {
        "googletagmanager.com",
        "google-analytics.com",
        "googleadservices.com",
        "doubleclick.net",
    }
)


def host_internal(host: str) -> bool:
    if not host:
        return True
    h = host.lower().removeprefix("www.")
    if h == "opticwise.com":
        return True
    if h.endswith(".opticwise.com"):
        return True
    if h == "ownet.opticwise.com":
        return True
    if "opticwise-html.onrender.com" in h:
        return True
    return False


def expand_google_redirect(url: str) -> str:
    low = url.lower()
    if "google.com/url" not in low and "/url?" not in low:
        return url
    try:
        q = parse_qs(urlparse(url).query).get("q", [None])[0]
        if q:
            return unquote(q)
    except Exception:
        pass
    return url


def strip_anchor_html(fragment: str) -> str:
    t = re.sub(r"<[^>]+>", "", fragment)
    for a, b in (
        ("&nbsp;", " "),
        ("&rsquo;", "'"),
        ("&lsquo;", "'"),
        ("&rdquo;", '"'),
        ("&ldquo;", '"'),
        ("&mdash;", "—"),
        ("&amp;", "&"),
        ("&#x27;", "'"),
        ("&quot;", '"'),
    ):
        t = t.replace(a, b)
    return re.sub(r"\s+", " ", t).strip()


def normalize_dedupe_key(url: str) -> str:
    p = urlparse(url)
    h = (p.hostname or "").lower().removeprefix("www.")
    path = (p.path or "").lower().rstrip("/")
    return f"{h}{path}?{p.query}".rstrip("?")


def harvest_links(fragment: str) -> list[tuple[str, str]]:
    seen: dict[str, tuple[str, str]] = {}
    for m in ANCHOR_RE.finditer(fragment):
        raw_href = m.group(2).strip()
        if not raw_href.startswith("http"):
            continue
        href = expand_google_redirect(raw_href)
        p = urlparse(href)
        host = (p.hostname or "").lower()
        hl = host.removeprefix("www.")
        if host_internal(host):
            continue
        if hl in TRACKING_HOST_FRAGMENTS or any(
            x in hl for x in TRACKING_HOST_FRAGMENTS
        ):
            continue
        if hl.endswith("fonts.googleapis.com") or hl.endswith("fonts.gstatic.com"):
            continue
        if hl == "fonts.google.com":
            continue
        label = strip_anchor_html(m.group(3))
        if not label:
            label = hl.replace("www.", "")
        key = normalize_dedupe_key(href)
        if key not in seen:
            seen[key] = (href.strip(), label)
    ordered = list(seen.values())
    ordered.sort(key=lambda x: urlparse(x[0]).netloc.lower() + urlparse(x[0]).path)
    return ordered


def build_references_html(pairs: list[tuple[str, str]]) -> str:
    lines = ["      <div class=\"references\">", "        <h3>References Cited</h3>", "        <ol>"]
    for href, label in pairs:
        href_attr = html_mod.escape(href, quote=True)
        hn = urlparse(href).hostname or "source"
        left = hn.replace("www.", "")
        anch = html_mod.escape(label[:220] + ("…" if len(label) > 220 else ""), quote=False)
        left_esc = html_mod.escape(left, quote=False)
        lines.append(
            f'          <li>{left_esc} — <a href="{href_attr}" target="_blank" rel="noopener noreferrer">'
            f"{anch}</a></li>"
        )
    lines.append("        </ol>")
    lines.append("      </div>")
    lines.append("")
    return "\n".join(lines)


def inject_simple(inner: str, refs_html: str) -> str:
    return inner.rstrip() + "\n" + refs_html.rstrip("\n")


def inject_article(inner: str, refs_html: str) -> str:
    token = '<p class="byline"'
    idx = inner.rfind(token)
    if idx >= 0:
        return inner[:idx].rstrip() + "\n" + refs_html + inner[idx:]
    idx = inner.rfind("</article>")
    if idx >= 0:
        return inner[:idx].rstrip() + "\n" + refs_html + inner[idx:]
    return inject_simple(inner, refs_html)


def process_one(path: Path, dry_run: bool) -> str:
    text = path.read_text(encoding="utf-8")
    if 'class="references"' in text or "class='references'" in text:
        return "skip_has_references"

    gs = text.find(GO_MARKER)
    si = text.find(SENTINEL, gs)
    if gs < 0 or si < 0:
        return "skip_no_sentinel"

    prefix = gs + len(GO_MARKER)
    inner = text[prefix:si]

    pairs = harvest_links(inner)
    if not pairs:
        return "skip_no_links"

    refs_html = build_references_html(pairs).rstrip() + "\n"
    # Nested branded article shells use <article> + byline near </article>.
    # Legacy insights are raw <p>/<h*> blocks without an <article>.
    inner_new = (
        inject_article(inner, refs_html)
        if "<article>" in inner.lower()
        else inject_simple(inner, refs_html)
    )

    new_text = text[:prefix] + inner_new + text[si:]
    if not dry_run:
        path.write_text(new_text, encoding="utf-8")
    return f"updated_{len(pairs)}"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    stats: dict[str, int] = {}
    no_links: list[str] = []

    for p in sorted(INSIGHTS.glob("*/index.html")):
        res = process_one(p, dry_run=args.dry_run)
        stats[res] = stats.get(res, 0) + 1
        if res == "skip_no_links":
            no_links.append(p.parent.name)

    print("--- add_insights_sources_from_links ---")
    for k in sorted(stats, key=lambda x: (-stats[x], x)):
        print(f"  {stats[k]:3d}  {k}")
    print("\nSkipping (zero outbound cited links after filters):", len(no_links))
    if len(no_links) <= 35:
        for s in no_links:
            print(f"  - {s}")
    else:
        for s in no_links[:25]:
            print(f"  - {s}")
        print(f"  ... and {len(no_links)-25} more (see skipped-no-outbound-links.txt)")

        (ROOT / "scripts" / "skipped-no-outbound-links.txt").write_text(
            "\n".join(no_links) + "\n", encoding="utf-8"
        )


if __name__ == "__main__":
    main()
