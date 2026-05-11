#!/usr/bin/env python3
"""Apply WEBSITE_v2_2_POLISH.md deltas to static HTML. Run from repo root."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# Production origin — canonical / og:url MUST point here, never to a
# Render staging host. (Earlier revisions of this script hardcoded
# "opticwise-html.onrender.com" and shipped staging URLs to production HTML,
# blocking Google from indexing the right origin.)
PROD = "https://www.opticwise.com"
PPP_HUB = "https://www.peakpropertyperformance.com/"

FOOTER_LI = (
    '<li><a class="text-sm hover:text-white transition-colors" '
    f'href="{PPP_HUB}" target="_blank" rel="noopener">PPP Book &amp; Podcast</a></li>'
)

TRACK_HTML = """<div class="ow-track-detail" style="max-width:70ch;margin-top:1rem">
<p><strong>Track A — accuracy / ops.</strong> Line items, dates, scope: did the invoice match the SOW, was the field tech on site the date we said, did the cabling run cover the units we listed. These are operational and they close fast — within a business day or two — because they're verifiable against documentation and field reports.</p>
<p><em>Example of a Track A issue:</em> &quot;Invoice line 7 shows 14 access points; the deployment plan called for 12.&quot; &rarr; Pull the as-built, confirm count, adjust the invoice. Done in hours.</p>
<p><strong>Track B — commercial model.</strong> Owner-level decisions on pricing, minimums, CapEx ownership, revenue share, exit terms. These are not invoice questions — they're investment-thesis questions, and they belong on a scheduled owner call with the people authorized to change the deal.</p>
<p><em>Example of a Track B issue:</em> &quot;Why is the ancillary revenue share 60/40 instead of 50/50?&quot; &rarr; That's a model question, not an accuracy question. It doesn't get answered by the field team or by an invoice adjustment; it gets answered by the owner and OpticWise principals on a scheduled call with the contract open.</p>
<p>The two tracks get confused most often when a Track B question lands in a Track A inbox (the AP team, the building engineer). Our job is to route it before the wrong people start litigating the wrong thing.</p>
</div>"""

TRANSITION = """<p style="margin-top:1.25rem;max-width:70ch">The multifamily case above is a full-stack deployment — income stack and expense stack both running. The next case is the inverse: a single-asset office property where only the income stack has been activated, and what that alone is worth at exit.</p>"""


def patch_footer(html: str) -> str:
    pat_html = re.compile(
        r'(<li><a class="text-sm hover:text-white transition-colors" href="[^"]*glossary/index\.html">Glossary</a></li>)'
        r'(<li><a class="text-sm hover:text-white transition-colors" href="[^"]*how-we-operate/index\.html">How It Works</a></li>)'
    )
    html2, n = pat_html.subn(rf"\1{FOOTER_LI}\2", html, count=1)
    if n:
        return html2
    pat_root = re.compile(
        r'(<li><a class="text-sm hover:text-white transition-colors" href="/glossary/">Glossary</a></li>)'
        r'(<li><a class="text-sm hover:text-white transition-colors" href="/how-we-operate/">How It Works</a></li>)'
    )
    html2, n = pat_root.subn(rf"\1{FOOTER_LI}\2", html, count=1)
    if n:
        return html2
    return html


# One insights article shipped with a minimal footer (no Resources column). v2.2 Task 14.
INSIGHTS_FOOTER_FULL = r"""<footer class="bg-ow-navy text-white/60"><div class="ow-container py-16"><div class="grid grid-cols-1 gap-10 pb-12 border-b border-white/10 md:grid-cols-5"><div><img alt="OpticWise" loading="lazy" width="120" height="32" decoding="async" data-nimg="1" class="h-8 w-auto mb-4" style="color:transparent" srcSet="../../images/ow_logo.png 1x, ../../images/ow_logo.png 2x" src="../../images/ow_logo.png"/><p class="text-sm text-white/50 leading-relaxed">Owner-controlled data &amp; digital infrastructure for commercial real estate.</p></div><div><h4 class="text-xs font-bold uppercase tracking-widest text-white/35 mb-4">Explore</h4><ul class="space-y-2.5"><li><a class="text-sm hover:text-white transition-colors" href="../../digital-infrastructure-noi-strategy/index.html">NOI Strategy</a></li><li><a class="text-sm hover:text-white transition-colors" href="../../digital-infrastructure-noi-playbook/index.html">NOI Playbook</a></li><li><a class="text-sm hover:text-white transition-colors" href="../../ai-ready-commercial-real-estate/index.html">AI-Ready CRE</a></li><li><a class="text-sm hover:text-white transition-colors" href="../../own-vs-lease-cre-building-data/index.html">Own vs Lease Data</a></li><li><a class="text-sm hover:text-white transition-colors" href="../../control-cre-digital-visibility/index.html">Digital Visibility</a></li></ul></div><div><h4 class="text-xs font-bold uppercase tracking-widest text-white/35 mb-4">Solutions</h4><ul class="space-y-2.5"><li><a class="text-sm hover:text-white transition-colors" href="../../property-brain/index.html">Property Brain™</a></li><li><a class="text-sm hover:text-white transition-colors" href="../../portfolio-brain/index.html">Portfolio Brain™</a></li><li><a class="text-sm hover:text-white transition-colors" href="../../ppp-audit/index.html">PPP Audit™</a></li><li><a class="text-sm hover:text-white transition-colors" href="../../bot-building-of-things/index.html">BoT® — Building of Things®</a></li><li><a class="text-sm hover:text-white transition-colors" href="../../5s-user-experience-standard/index.html">5S® Standard</a></li><li><a class="text-sm hover:text-white transition-colors" href="../../advisory-services/index.html">Advisory Services</a></li></ul></div><div><h4 class="text-xs font-bold uppercase tracking-widest text-white/35 mb-4">By Audience</h4><ul class="space-y-2.5"><li><a class="text-sm hover:text-white transition-colors" href="../../for-lps-and-financiers/index.html">For LPs &amp; Financiers</a></li><li><a class="text-sm hover:text-white transition-colors" href="../../for-asset-managers/index.html">For Asset Managers</a></li><li><a class="text-sm hover:text-white transition-colors" href="../../for-it-executives/index.html">For IT Executives</a></li><li><a class="text-sm hover:text-white transition-colors" href="../../for-property-managers-and-engineers/index.html">For PMs &amp; Engineers</a></li><li><a class="text-sm hover:text-white transition-colors" href="../../for-tenants/index.html">For Tenants</a></li></ul></div><div><h4 class="text-xs font-bold uppercase tracking-widest text-white/35 mb-4">Resources</h4><ul class="space-y-2.5"><li><a class="text-sm hover:text-white transition-colors" href="../../insights/index.html">Insights (Blog)</a></li><li><a class="text-sm hover:text-white transition-colors" href="../../faq/index.html">FAQ</a></li><li><a class="text-sm hover:text-white transition-colors" href="../../glossary/index.html">Glossary</a></li><li><a class="text-sm hover:text-white transition-colors" href="https://www.peakpropertyperformance.com/" target="_blank" rel="noopener">PPP Book &amp; Podcast</a></li><li><a class="text-sm hover:text-white transition-colors" href="../../how-we-operate/index.html">How It Works</a></li><li><a class="text-sm hover:text-white transition-colors" href="../../about/index.html">About</a></li><li><a class="text-sm hover:text-white transition-colors" href="../../contact/index.html">Contact</a></li></ul></div></div><div class="pt-6 flex flex-col md:flex-row items-center justify-between gap-4"><p class="text-xs text-white/30">© <!-- -->2026<!-- --> OpticWise. All rights reserved.</p><p class="text-xs text-white/25 max-w-sm text-center md:text-right">Own your data &amp; digital infrastructure. Operate with strategic foresight. Build for the long game.</p></div></div></footer>"""


def fix_minimal_insights_footer() -> None:
    p = ROOT / "insights/ai-wont-fix-your-propertybut-this-will/index.html"
    if not p.exists():
        return
    t = p.read_text(encoding="utf-8")
    foot = t.split("</main>", 1)[-1]
    if "Explore</h4>" in foot and "PPP Book &amp; Podcast" in foot:
        return
    t2, n = re.subn(r'<footer class="bg-ow-navy[\s\S]*?</footer>', INSIGHTS_FOOTER_FULL, t, count=1)
    if n != 1:
        raise ValueError("fix_minimal_insights_footer: footer replace failed")
    p.write_text(t2, encoding="utf-8")
    print("fixed minimal footer: insights/ai-wont-fix-your-propertybut-this-will/index.html")


def patch_index() -> None:
    p = ROOT / "index.html"
    t = p.read_text(encoding="utf-8")

    ob = "</div></div></section><section class=\"fiveplan\">"
    ib = (
        "</div></div></section><section class=\"ow-mid-cta twocol twocol--nearwhite\">"
        "<div class=\"container\"><div class=\"ow-mid-cta__inner\">"
        "<h2 class=\"h2 ow-mid-cta__heading\">What&#x27;s your data &amp; digital infrastructure actually earning?</h2>"
        "<button type=\"button\" class=\"btn btn-primary btn-arrow\">Schedule a Complimentary Review</button>"
        "</div></div></section><section class=\"fiveplan\">"
    )
    if ob not in t:
        raise ValueError("index: brain→fiveplan boundary not found")
    t = t.replace(ob, ib, 1)

    t = t.replace(
        "<h2 class=\"h2\">5S® — Non-Negotiable</h2>",
        "<h2 class=\"h2\"><a class=\"ow-five-s-heading-link\" href=\"./5s-user-experience-standard/index.html\">5S® — Non-Negotiable</a></h2>",
        1,
    )

    t = t.replace("<section class=\"quote quote--dark\">", "<section class=\"quote quote--dark quote--compact\">", 1)
    t = t.replace("<section class=\"quote quote--light\">", "<section class=\"quote quote--light quote--compact\">", 1)

    cards = [
        (
            "./property-brain/index.html",
            '<div class="cards__card"><h3 class="cards__card-title">Portable Intelligence Assets</h3><p class="cards__card-desc">Properties stop being one-offs. Data moves with the owner, not the vendor.</p></div>',
        ),
        (
            "./own-vs-lease-cre-building-data/index.html",
            '<div class="cards__card"><h3 class="cards__card-title">Vendor Portability</h3><p class="cards__card-desc">Swap vendors without losing history, intelligence, or operational continuity.</p></div>',
        ),
        (
            "./own-vs-lease-cre-building-data/index.html",
            '<div class="cards__card"><h3 class="cards__card-title">Platform Portability</h3><p class="cards__card-desc">Swap decision engines without rewiring buildings.</p></div>',
        ),
        (
            "./digital-infrastructure-noi-strategy/index.html",
            '<div class="cards__card"><h3 class="cards__card-title">NOI That Grows</h3><p class="cards__card-desc">Owner-controlled connectivity, fewer leaks, and revenue you couldn&#x27;t see before.</p></div>',
        ),
        (
            "./control-cre-digital-visibility/index.html",
            '<div class="cards__card"><h3 class="cards__card-title">Lower Risk</h3><p class="cards__card-desc">Privacy, security, compliance, auditability — owned, not rented.</p></div>',
        ),
        (
            "./5s-user-experience-standard/index.html",
            '<div class="cards__card"><h3 class="cards__card-title">Tenant Experience That Holds Up</h3><p class="cards__card-desc">Consistent, measurable, 5S®-grade — property to property.</p></div>',
        ),
        (
            "./ai-ready-commercial-real-estate/index.html",
            '<div class="cards__card"><h3 class="cards__card-title">AI Readiness That&#x27;s Real</h3><p class="cards__card-desc">Grounded in governance, not theoretical.</p></div>',
        ),
        (
            "./portfolio-brain/index.html",
            '<div class="cards__card"><h3 class="cards__card-title">Compounding Portfolio Performance</h3><p class="cards__card-desc">Built on client-owned data &amp; digital infrastructure. Not rented software.</p></div>',
        ),
    ]
    for href, old in cards:
        new = old.replace('<div class="cards__card">', f'<a class="cards__card cards__card--link" href="{href}">', 1)
        new = new.replace("</div>", "</a>", 1)
        if old not in t:
            raise ValueError(f"index: card block not found: {old[:50]}...")
        t = t.replace(old, new, 1)

    old_book = (
        '<div class="starter__book"><img src="./api/media/file/ppp-book-cover.png" '
        'alt="Peak Property Performance — Bill Douglas, Drew Hall, Ryan R. Goble. Fast Company Press."/></div>'
    )
    new_book = (
        '<div class="starter__book"><a href="https://www.peakpropertyperformance.com/" target="_blank" rel="noopener noreferrer">'
        '<img src="./images/ppp-book-bestseller.png" '
        'alt="Peak Property Performance by Bill Douglas, Drew Hall, and Ryan R. Goble — Amazon Best Seller, Fast Company Press"/>'
        "</a></div>"
    )
    if old_book not in t:
        raise ValueError("index: starter book block not found")
    t = t.replace(old_book, new_book, 1)

    t = patch_footer(t)
    p.write_text(t, encoding="utf-8")
    print("patched index.html")


def patch_customer_outcomes() -> None:
    p = ROOT / "customer-outcomes/index.html"
    t = p.read_text(encoding="utf-8")

    # Canonical / og:url are already correct in the source HTML
    # (production origin). Earlier revisions of this script rewrote them to
    # a staging host — that has been removed. Do not re-introduce.
    t = t.replace(
        '<meta property="og:image" content="https://www.opticwise.com/images/og-default.png"/>',
        f'<meta property="og:image" content="{PROD}/images/og-customer-outcomes.png"/>',
        1,
    )
    t = t.replace(
        '<meta name="twitter:image" content="https://www.opticwise.com/images/og-default.png"/>',
        f'<meta name="twitter:image" content="{PROD}/images/og-customer-outcomes.png"/>',
        1,
    )

    foot = (
        "lower optimization headroom than older inventory.</p></div></div></div></section>"
        '<section class="twocol twocol--light">'
    )
    if foot not in t:
        raise ValueError("customer-outcomes: multifamily footnote boundary not found")
    t = t.replace(
        foot,
        "lower optimization headroom than older inventory.</p>"
        + TRANSITION
        + "</div></div></div></section><section class=\"twocol twocol--light\">",
        1,
    )

    bot_open = "</section><section class=\"bot\">"
    if bot_open not in t:
        raise ValueError("before bot section not found")
    insert = (
        "</section><section class=\"twocol twocol--nearwhite\"><div class=\"container\">"
        '<div class="twocol__wrap ow-ppp-book-callout">'
        f'<a href="{PPP_HUB}" target="_blank" rel="noopener noreferrer">'
        '<img src="../images/ppp-book-bestseller.png" '
        'alt="Peak Property Performance — Amazon Best Seller, Fast Company Press"/>'
        "</a>"
        '<p class="lede ow-ppp-book-callout__text">The framework behind these outcomes is documented in '
        "<em>Peak Property Performance: Game-Changing AI and Digital Strategies for Commercial Real Estate</em> "
        "— Amazon Best Seller, Fast Company Press.</p>"
        "</div></div></section><section class=\"bot\">"
    )
    t = t.replace(bot_open, insert, 1)

    t = patch_footer(t)
    p.write_text(t, encoding="utf-8")
    print("patched customer-outcomes/index.html")


def patch_working_with_us() -> None:
    p = ROOT / "working-with-us/index.html"
    t = p.read_text(encoding="utf-8")

    # Canonical / og:url are already correct in the source HTML
    # (production origin). Earlier revisions of this script rewrote them to
    # a staging host — that has been removed. Do not re-introduce.
    t = t.replace(
        '<meta property="og:image" content="https://www.opticwise.com/images/og-default.png"/>',
        f'<meta property="og:image" content="{PROD}/images/og-working-with-us.png"/>',
        1,
    )
    t = t.replace(
        '<meta name="twitter:image" content="https://www.opticwise.com/images/og-default.png"/>',
        f'<meta name="twitter:image" content="{PROD}/images/og-working-with-us.png"/>',
        1,
    )

    old_ul = (
        '<ul class="avoid__list"><li class="avoid__item"><strong>Track A — accuracy / ops:</strong> '
        "line items, dates, scope. Close those fast.</li>"
        '<li class="avoid__item"><strong>Track B — commercial model:</strong> '
        "owner-level decisions on pricing, minimums, CapEx ownership, rev share. "
        "Scheduled owner calls, not invoice ping-pong.</li></ul>"
    )
    if old_ul not in t:
        raise ValueError("working-with-us: Track A/B ul not found")
    t = t.replace(old_ul, TRACK_HTML, 1)

    t = patch_footer(t)
    p.write_text(t, encoding="utf-8")
    print("patched working-with-us/index.html")


def patch_about() -> None:
    p = ROOT / "about/index.html"
    t = p.read_text(encoding="utf-8")

    book_para = (
        "</section><section class=\"twocol twocol--light\"><div class=\"container\"><div class=\"twocol__wrap\">"
        "<p class=\"lede\" style=\"margin-top:0;max-width:65ch\">OpticWise&#x27;s leadership co-authored "
        "<em>Peak Property Performance: Game-Changing AI and Digital Strategies for Commercial Real Estate</em>, "
        "published by Fast Company Press and an Amazon Best Seller. The book is the foundation for the "
        "<em>Peak Property Performance</em> podcast, where the same operating principles get tested against "
        "real-world CRE practitioners. Find both at "
        f'<a href="{PPP_HUB}" target="_blank" rel="noopener noreferrer">peakpropertyperformance.com</a>.</p>'
        "</div></div></section><section class=\"cards cards--nearwhite cards--cols-4\">"
    )
    needle = "</section><section class=\"cards cards--nearwhite cards--cols-4\">"
    if needle not in t:
        raise ValueError("about: awards section boundary not found")
    # Insert only before Industry Recognition grid (first cols-4 nearwhite after quote)
    t = t.replace(needle, book_para, 1)

    awards_anchor = (
        '<a class="cards__card" href="https://thesiliconreview.com/magazine/profile/digital-infrastructure-leadership-in-cre-value-creation-2026-listing">'
    )
    book_card = (
        '<a class="cards__card" href="https://www.peakpropertyperformance.com/" target="_blank" rel="noopener noreferrer">'
        '<div class="mb-4 px-4 flex justify-center items-center min-h-0">'
        '<img src="../images/ppp-book-bestseller.png" alt="Peak Property Performance — Amazon Best Seller, Fast Company Press" '
        'class="max-h-[60px] w-auto object-contain object-center"/></div>'
        '<h3 class="cards__card-title">Peak Property Performance® — Amazon Best Seller</h3>'
        "<p class=\"cards__card-desc\">Fast Company Press — book &amp; podcast hub</p></a>"
    )
    if awards_anchor not in t:
        raise ValueError("about: first award card not found")
    t = t.replace(awards_anchor, book_card + awards_anchor, 1)

    t = patch_footer(t)
    p.write_text(t, encoding="utf-8")
    print("patched about/index.html")


def patch_all_other_footers() -> None:
    n = 0
    for path in sorted(ROOT.rglob("*.html")):
        rel = path.relative_to(ROOT)
        if str(rel) in ("index.html", "customer-outcomes/index.html", "working-with-us/index.html", "about/index.html"):
            continue
        if ".audit" in str(rel):
            continue
        t = path.read_text(encoding="utf-8")
        if "PPP Book &amp; Podcast" in t:
            continue
        t2 = patch_footer(t)
        if t2 == t:
            continue
        path.write_text(t2, encoding="utf-8")
        n += 1
    print(f"patched footers on {n} additional pages")


def apply_content_changes() -> None:
    patch_index()
    patch_customer_outcomes()
    patch_working_with_us()
    patch_about()


def apply_footer_changes() -> None:
    fix_minimal_insights_footer()
    patch_all_other_footers()


def main() -> None:
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "--footers-only":
        apply_footer_changes()
        return
    apply_content_changes()
    apply_footer_changes()


if __name__ == "__main__":
    main()
