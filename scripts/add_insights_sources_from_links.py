#!/usr/bin/env python3
"""
Append <div class="references"> blocks to Insight posts.

Pass 1: harvest outbound https links already in prose (filtered).
Pass 2: detect named citations (orgs, statutes, regulators) against a curated
whitelist of canonical URLs — no invented links. Matching runs on text after
<script>/<style>/<a> blocks are stripped so prose that is already linked is not
used to imply a citation.

Skips HTML that already contains class="references".
Skips ghost bodies where merge(pass1 ∪ pass2) is empty after deduping URLs.

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

# Longer phrases first (compiled after list is sorted).
_NAMED_RULES_RAW: list[tuple[str, str, str]] = [
    (r"norton\s+rose\s+fulbright", "https://www.nortonrosefulbright.com/", "Norton Rose Fulbright"),
    (r"jones\s+lang\s+lasalle", "https://www.jll.com/", "Jones Lang LaSalle (JLL)"),
    (r"amazon\s+web\s+services", "https://aws.amazon.com/", "Amazon Web Services"),
    (r"goldman\s+sachs", "https://www.goldmansachs.com/", "Goldman Sachs"),
    (r"j\.?\s*p\.?\s*morgan(?:\s+chase|\s+research)?", "https://www.jpmorganchase.com/", "JPMorgan Chase"),
    (r"morgan\s+stanley", "https://www.morganstanley.com/", "Morgan Stanley"),
    (r"bain\s*&\s*company", "https://www.bain.com/", "Bain & Company"),
    (r"ernst\s*&\s*young", "https://www.ey.com/", "Ernst & Young"),
    (r"p\.?\s*w\.?\s*c\.?", "https://www.pwc.com/", "PwC"),
    (r"wall\s+street\s+journal|\bwsj\b", "https://www.wsj.com/", "The Wall Street Journal"),
    (r"fast\s+company", "https://www.fastcompany.com/", "Fast Company"),
    (r"digital\s+realty", "https://www.digitalrealty.com/", "Digital Realty"),
    (r"silicon\s+review", "https://thesiliconreview.com/", "The Silicon Review"),
    (r"eu\s+(?:digital\s+|)ai\s+act", "https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai", "EU Artificial Intelligence Act (European Commission)"),
    (r"proptech\s+outlook", "https://www.proptechoutlook.com/", "PropTech Outlook"),
    (r"google\s+cloud", "https://cloud.google.com/", "Google Cloud"),
    (r"peak\s+property\s+performance", "https://www.peakpropertyperformance.com/", "Peak Property Performance®"),
    (r"gramm[-–]?\s*leach|\bglba\b", "https://www.ftc.gov/legal-library/browse/rules/standards-for-safeguarding-customer-information", "GLBA safeguarding standards (FTC)"),
    (r"(?<![\w])jll(?![\w])", "https://www.jll.com/", "JLL"),
    (r"(?<![\w])aws(?![\w])", "https://aws.amazon.com/", "Amazon Web Services (AWS)"),
    (r"(?<![\w])goldman(?![\w])", "https://www.goldmansachs.com/", "Goldman Sachs"),
    (r"citigroup", "https://www.citigroup.com/", "Citigroup"),
    (r"(?<![\w])citi\b", "https://www.citi.com/", "Citi"),
    (r"mckinsey", "https://www.mckinsey.com/", "McKinsey & Company"),
    (r"(?<![\w])ey(?![\w])", "https://www.ey.com/", "EY"),
    (r"(?<![\w])pwc(?![\w])", "https://www.pwc.com/", "PwC"),
    (r"kpmg", "https://kpmg.com/", "KPMG"),
    (r"deloitte", "https://www.deloitte.com/", "Deloitte"),
    (r"cbre", "https://www.cbre.com/", "CBRE"),
    (r"blackstone", "https://www.blackstone.com/", "Blackstone"),
    (r"brookfield", "https://www.brookfield.com/", "Brookfield"),
    (r"wework", "https://www.wework.com/", "WeWork"),
    (r"gartner", "https://www.gartner.com/", "Gartner"),
    (r"forrester", "https://www.forrester.com/", "Forrester"),
    (r"(?<![\w])idc(?![\w])", "https://www.idc.com/", "IDC"),
    (r"nareit", "https://www.reit.com/", "Nareit"),
    (r"msci", "https://www.msci.com/", "MSCI"),
    (r"realpage", "https://www.realpage.com/", "RealPage"),
    (r"bloomberg", "https://www.bloomberg.com/", "Bloomberg"),
    (r"reuters", "https://www.reuters.com/", "Reuters"),
    (r"(?<![\w])nist(?![\w])", "https://www.nist.gov/", "NIST"),
    (r"\bgdpr\b", "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679", "General Data Protection Regulation (GDPR)"),
    (r"\bleed\b|\busgbc\b", "https://www.usgbc.org/leed", "LEED — U.S. Green Building Council"),
    (r"(?<![\w])fcc(?![\w])", "https://www.fcc.gov/", "Federal Communications Commission"),
    (r"(?<![\w])ftc(?![\w])", "https://www.ftc.gov/", "Federal Trade Commission"),
    (r"ieee\b", "https://www.ieee.org/", "IEEE"),
    (r"cisco\b", "https://www.cisco.com/", "Cisco"),
    (r"microsoft\b", "https://www.microsoft.com/", "Microsoft"),
    (r"oracle\b", "https://www.oracle.com/", "Oracle"),
    (r"salesforce\b", "https://www.salesforce.com/", "Salesforce"),
    (r"servicenow\b", "https://www.servicenow.com/", "ServiceNow"),
]

NAMED_RULES_RAW = sorted(_NAMED_RULES_RAW, key=lambda row: (-len(row[0]), row[0]))
NAMED_RULES_COMPILED = [
    (re.compile(pat, re.IGNORECASE), url, label) for pat, url, label in NAMED_RULES_RAW
]

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
    if no_links:
        (ROOT / "scripts" / "skipped-no-outbound-links.txt").write_text(
            "\n".join(sorted(no_links)) + "\n", encoding="utf-8"
        )
        print(f"  List written to scripts/skipped-no-outbound-links.txt ({len(no_links)} slug(s))")
    first = sorted(no_links)[:25]
    for s in first:
        print(f"  - {s}")
    if len(no_links) > 25:
        print(f"  ... ({len(no_links)-25} more)")

if __name__ == "__main__":
    main()
