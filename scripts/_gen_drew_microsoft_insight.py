#!/usr/bin/env python3
"""One-off generator for Drew Hall / Microsoft autonomous buildings insight — run from repo root."""
from __future__ import annotations

import json
import os
from html import escape

slug = "microsoft-autonomous-building-pitch-safety-layer-gap"
iso = "2026-05-13T14:45:00.000Z"
hero_img = "../../api/media/file/microsoft-autonomous-building-pitch-safety-layer-gap.png"
abs_og = "https://www.opticwise.com/api/media/file/microsoft-autonomous-building-pitch-safety-layer-gap-og.png"
title_txt = (
    "Microsoft Just Pitched Autonomous Buildings. The Layer That Makes Them Safe Does Not Exist Yet."
)
dek = (
    '"Autonomy" on the expo stage assumes a data plane, a trust plane, and OT segmentation that most '
    "portfolios do not have yet. Stage demos are downstream — the architecture decides whether agents "
    "compound value or vaporize NOI."
)
meta_desc = (
    "Microsoft joins IBcon 2026 to talk autonomous CRE operations — but most buildings lack the "
    "owner-controlled data plane, trust plane, and OT segmentation that make agentic control safe."
)

paragraphs = [
    """Microsoft is taking the IBcon 2026 main stage in San Diego next month for a fireside on "the long-term path from connected and smart buildings toward autonomous real estate operations." That is the headline. The architecture story underneath it is the one nobody is naming. The "autonomy" being sold requires a data plane, a trust plane, and an operational technology segmentation model that 99% of commercial buildings do not have. Without those, "autonomous" means "automated by someone else's vendor." Let's demystify what that actually means for an owner.""",
    """I've been on properties this quarter where the Building Management System, the access control panel, the metering platform, the camera system, and the tenant Wi-Fi all sit on the same flat network behind a vendor-managed firewall the owner has never logged into. That's normal. It's also what most "smart building" pitches assume away. When Microsoft, or anyone else, walks in and says we'll add an AI agent that "senses, decides, and securely acts," the agent has to act on those systems. The systems were never architected for autonomous control. They were architected for a human technician with a laptop and a USB stick.""",
    """What's the real problem we're solving? Not the AI. The AI is the easy part. The problem is the layer that has to exist underneath the AI before the AI can act safely. Three pieces.""",
    """First, a data plane the owner controls. The agent has to read from a normalized model of building state — occupancy, environmental conditions, equipment status, tenant signals, cost data — that does not live inside a single vendor's proprietary database. Today, in most properties, the equivalent data lives in five to twelve vendor silos with five to twelve different schemas. Yardi shipped an MCP connector for Claude. AppFolio launched a marketplace. Entrata overhauled its API program. Useful moves, all of them. None of them, on their own, deliver the unified data model an autonomous agent needs. A recent Thesis Driven survey of major property management systems showed no platform scoring above 6.5 out of 10 on openness, with the lowest just above 3. Open enough to talk. Not open enough to govern.""",
    """Second, a trust plane the owner controls. Identity, access, lineage, retention, and rules of agent action. If you cannot answer in one sentence which agent is allowed to take which action against which system under which conditions, you do not have a trust plane. You have a hope plane. The Realcomm-featured FBI Winter SHIELD piece this week made the timing argument painfully clear: AI has compressed the attacker timeline from weeks to minutes. The cybersecurity clock starts when a weakness becomes visible to an attacker, not when the company realizes it has been breached. The same speed flips when you install an unbounded agent inside a building. A misconfigured agent acting at machine speed against an HVAC system, an access control panel, or a metering interface can run a property into a recoverable mess inside an afternoon. Or an unrecoverable one inside a week.""",
    """Third, OT segmentation. Operational technology — BMS, access control, metering, lighting, video — needs network and identity boundaries that are different from corporate IT, different from tenant Wi-Fi, and different from each other. Most CRE properties run a flat network because flat networks are cheap and "they work." They work right up until the moment an agent or an attacker uses one system as a bridge into another. The operational cost of postponing segmentation looks like zero. The actual cost shows up as a six-figure incident and a refi conversation that doesn't go the way the asset manager wanted.""",
    """Why does this matter to an owner now? Because the vendor universe that will sell autonomous building agents is consolidating fast. Memoori's research, surfaced in Realcomm Weekly this week, tracked roughly $22 billion of disclosed M&A across approximately 35 smart-building AI transactions in the 27 months ending April 2026. Only 34 new vendors entered all 12 use-case domains since 2022. Memoori calls the independent specialist "an endangered species." This week alone, Stone-Goff Partners invested in 5Q Partners and supported the add-on acquisition of One11 Advisors — an IT/OT services consolidation play in CRE. The agents that will operate buildings two years from now are being acquired and consolidated this year. Owners who haven't built the data plane, the trust plane, and the segmentation model by then will inherit whichever vendor's autonomy stack their PMS or BMS happens to plug into.""",
    """There is a physical-layer story underneath the architectural one, and it is moving fast. RTInsights this week called network architecture the real constraint on real-time AI: "Without a corresponding investment in the interconnected fabric that moves tokens from the GPU to the user, your AI strategy will be left waiting for a connection that never arrives." Nvidia put $500 million into Corning this week to build out fiber-optics manufacturing — a deal that may grow to $3.2 billion. Hyperscalers are spending real money on the physical fabric for AI because they understand that the model is useless without the network underneath. The same logic applies one floor down, inside buildings. The autonomous agent Microsoft demos in San Diego will be useless inside a property that cannot route, segment, and govern its own building data fast and reliably.""",
    """Data is king; digital infrastructure is the means to get to it. That order matters. The AI agent is downstream. The architecture is what determines whether the agent is an asset or a liability.""",
    "Mapping the trend to PPP 5C™",
    """In the Peak Property Performance® plan, this is a Coordinate-and-Control conversation, sitting on top of a Connect-and-Collect foundation. Connect (PPP 5C™ Connect) is the in-building network — segmented, owner-controlled, repeatable property to property. BoT® (Building of Things®) is the consolidated, governed approach to that. ElasticISP® is the managed connectivity offering that makes it operational at scale. Collect normalizes the data into a model the owner controls. Coordinate writes down the rules of agent action — identity, access, lineage, retention. Control plugs in the decision engines and AI agents under those rules.""",
    """Most properties today are partway through Connect, partway through Collect, and have not started Coordinate. That is the gap an "autonomous building" pitch is glossing over. The 5S® user experience — Seamless Mobility, Security, Stability (resilience), Speed, Service — is the operating standard the agents have to honor. If the agent cannot act inside that standard, the agent does not get to act. That is the rule. It applies whether the agent is from Microsoft, from Yardi, from a startup, or from an internal data-science team.""",
    """What moves the needle fastest? Three things, in order. Run a data & digital infrastructure review at one property to map where the agents are going to want to act and what is or isn't governed. Segment the OT network and put identity and access controls in front of every system an agent could touch — that is the floor, not the ceiling. Then plug in two decision engines from two different vendors against the same governed data, and confirm both can be swapped without rewiring the building. That last test is what proves the architecture is portable. Vendor- and LLM-agnostic by design is not a phrase. It is a tested capability.""",
    """Here is what this is really worth. On a typical asset, every dollar of recoverable NOI is worth roughly fifteen to twenty-five dollars of capitalized value at exit. An autonomous agent that runs unsegmented on a flat network is a one-incident path to losing that NOI plus an insurance premium hike plus a refi cap-rate haircut plus a DSCR conversation the asset manager did not want to have. An autonomous agent that runs inside an owner-controlled data plane and trust plane, on a properly segmented OT network, is the path to compounding NOI quietly, every quarter, across a whole portfolio.""",
    """If you don't own your data & digital infrastructure, your vendors do — and the autonomy in your building belongs to them. Microsoft's main-stage moment is not the warning. It's the gun going off. The owners who built the architecture before the agents arrived will compound. The owners who didn't will spend the next two years explaining to underwriters why their buildings can't switch vendors without a quarter of downtime.""",
    """Find a better way. Start a data & digital infrastructure review at one property this quarter. Get the trust plane on paper before the next agent ships. Test portability with two vendors. That's the work.""",
    """Own your data & digital infrastructure. Operate with strategic foresight. Build for the long game.""",
]

body_chunks: list[str] = []
for blk in paragraphs:
    if blk == "Mapping the trend to PPP 5C™":
        body_chunks.append(f"<h2>{escape(blk)}</h2>")
    elif blk.startswith("First,"):
        body_chunks.append(f"<h3>{escape(blk.split('.')[0] + '.')}</h3>")
        body_chunks.append("<p>" + escape(blk[len(blk.split('.')[0]) + 1 :].strip()) + "</p>")
    elif blk.startswith("Second,"):
        body_chunks.append("<h3>Second.</h3>")
        body_chunks.append("<p>" + escape(blk[len("Second, ") :]) + "</p>")
    elif blk.startswith("Third,"):
        body_chunks.append("<h3>Third.</h3>")
        body_chunks.append("<p>" + escape(blk[len("Third, ") :]) + "</p>")
    else:
        body_chunks.append("<p>" + escape(blk) + "</p>")

inner_article = "\n".join(body_chunks)

refs_html = '''<div class="references">
        <h3>References cited</h3>
        <ol>
          <li>Realcomm IBcon 2026 — &ldquo;Microsoft Takes the Main Stage: Frontier Transformation Toward Autonomous Building Operations,&rdquo; May 12, 2026 — <a href="https://www.realcomm.com/realcomm-2026/home/" target="_blank" rel="noopener noreferrer">https://www.realcomm.com/realcomm-2026/home/</a></li>
          <li>Memoori — &ldquo;Smart Building AI Consolidation: The Acquisition Wave!,&rdquo; May 2026 — <a href="https://memoori.com/smart-building-ai-consolidation-the-acquisition-wave/" target="_blank" rel="noopener noreferrer">https://memoori.com/smart-building-ai-consolidation-the-acquisition-wave/</a></li>
          <li>Realcomm — &ldquo;When Minutes Matter: Using FBI Winter SHIELD to Defend Your Business in an AI-Driven Threat Environment,&rdquo; May 13, 2026 — <a href="https://realcomm.com/webinars/1001/cyberfrontiers-navigating-the-surge-in-cyber-threats-ai-based-menaces-and-the-legal-fallout-of-executive-negligence" target="_blank" rel="noopener noreferrer">Realcomm cybersecurity briefing archive</a></li>
          <li>RTInsights — &ldquo;Why Network Architecture is the Real Constraint on Real-Time AI,&rdquo; May 2026 — <a href="https://www.rtinsights.com/why-network-architecture-is-the-real-constraint-on-real-time-ai/" target="_blank" rel="noopener noreferrer">https://www.rtinsights.com/why-network-architecture-is-the-real-constraint-on-real-time-ai/</a></li>
          <li>Pulse 2.0 — &ldquo;Stone-Goff Partners Invests in 5Q Partners and Supports Add-On Acquisition of One11 Advisors,&rdquo; May 13, 2026 — <a href="https://www.businesswire.com/news/home/20260513122663/en/Stone-Goff-Partners-Announces-Investment-in-5Q-Partners-and-Add-On-Acquisition-of-One11-Advisors" target="_blank" rel="noopener noreferrer">Stone-Goff Partners / Business Wire</a></li>
          <li>Yahoo Finance — &ldquo;Copper Is Dead, Glass Is King: Inside Nvidia&apos;s $500M Bet On Fiber Optics,&rdquo; May 13, 2026 — <a href="https://finance.yahoo.com/markets/stocks/articles/nvidia-backs-corning-build-optical-003501472.html" target="_blank" rel="noopener noreferrer">Yahoo Finance</a></li>
          <li>Thesis Driven — Remen Okoruwa — &ldquo;Your PMS Integrations Are Working. Your Data Strategy Isn&apos;t.,&rdquo; April 28, 2026 — <a href="https://www.thesisdriven.com/letters/your-pms-integrations-are-working-your-data-strategy-isnt/" target="_blank" rel="noopener noreferrer">https://www.thesisdriven.com/letters/your-pms-integrations-are-working-your-data-strategy-isnt/</a></li>
        </ol>
      </div>'''

tldr = (
    '<p class="tldr"><strong>TL;DR:</strong> IBcon narratives about &ldquo;autonomous&rdquo; operations assume '
    "three prerequisites most portfolios still lack: an owner-controlled data plane, a documented "
    "trust plane, and segmented OT. Vendor consolidation is tightening. Architecture first &mdash; not "
    "the agent rollout &mdash; is what separates compounding NOI from preventable incidents.</p>"
)

ghost_inner = """<!DOCTYPE html><html lang="en"><head>
  <meta charset="utf-8"/><style>
    :root { --text:#172033; --muted:#5b6475; --border:#d9deea; --surface:#f6f8fc; --accent:#123b6d; --accent-soft:#eaf2fb; }
    body{margin:0;font-family:Arial,Helvetica,sans-serif;line-height:1.65;color:var(--text);background:#fff;}
    main{max-width:860px;margin:0 auto;padding:48px 24px 72px;}
    article{width:100%}
    .eyebrow{margin:0 0 12px;color:var(--accent);font-size:0.82rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;}
    h2{margin:44px 0 16px;font-size:clamp(1.38rem,3vw,1.85rem);line-height:1.18;color:var(--text);letter-spacing:-0.02em;}
    h3{margin:26px 0 10px;font-size:1.12rem;line-height:1.25;color:var(--text);}
    p{margin:0 0 18px;font-size:1.05rem;}
    .dek{margin-bottom:28px;color:var(--muted);font-size:1.22rem;line-height:1.5;}
    .tldr{margin:0 0 28px;padding:18px 22px;background:var(--surface);border:1px solid var(--border);border-left:4px solid var(--accent);border-radius:10px;font-size:1.02rem;line-height:1.55;}
    .tldr strong:first-child{color:var(--accent);letter-spacing:0.04em;}
    .references{margin-top:36px;padding-top:22px;border-top:1px solid var(--border);}
    .references h3{margin-top:0;color:var(--accent);font-size:1.05rem;letter-spacing:0.02em;text-transform:uppercase;}
    .references ol{margin-left:1.2rem;}
    .references li{font-size:0.98rem;color:var(--muted);margin-bottom:10px;}
    a{color:#057bb2;text-decoration:underline;}
    a:hover{color:#0493d5;}
    .byline{margin-top:36px;color:var(--muted);font-weight:700;}
  </style>
</head><body>
  <main>
    <article>
      <p class="eyebrow">AI Readiness · OT Security · Data Governance</p>
      <h2 style="margin-top:8px;margin-bottom:12px;font-size:clamp(1.45rem,3vw,2rem);line-height:1.15;">"""
ghost_inner += escape(title_txt)
ghost_inner += """</h2>
      <p class="dek">""" + escape(dek) + """</p>
""" + tlr

# typo tlr vs tldr
ghost_inner = ghost_inner.replace(tlr + "\n", tldr + "\n")

opening = paragraphs[0]
hero_sub = escape(opening[:320]) + "\u2026"

breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.opticwise.com"},
        {"@type": "ListItem", "position": 2, "name": "Insights", "item": "https://www.opticwise.com/insights"},
        {
            "@type": "ListItem",
            "position": 3,
            "name": title_txt[:64],
            "item": "https://www.opticwise.com/insights/" + slug,
        },
    ],
}

article_ld = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title_txt,
    "description": meta_desc,
    "image": abs_og,
    "datePublished": iso,
    "dateModified": iso,
    "articleSection": "AI Readiness",
    "keywords": [
        "Autonomous Operations",
        "Data Plane",
        "Trust Plane",
        "OT segmentation",
        "Vendor consolidation",
        "Microsoft IBcon",
        "PPP 5C™",
    ],
    "publisher": {
        "@type": "Organization",
        "name": "OpticWise",
        "logo": {"@type": "ImageObject", "url": "https://www.opticwise.com/images/ow_logo.png"},
    },
    "author": {
        "@type": "Person",
        "@id": "https://www.opticwise.com/authors/drew-hall/#person",
        "name": "Drew Hall",
        "url": "https://www.opticwise.com/authors/drew-hall/",
    },
    "mainEntityOfPage": {"@type": "WebPage", "id": f"https://www.opticwise.com/insights/{slug}/"},
}

ghost_inner_article = ghost_inner.replace(
    '""" + escape(dek) + """</p>',
    "<p class=\"dek\">" + escape(dek) + "</p>",
)


def head_block() -> str:
    esc_t = escape(title_txt)
    esc_d = escape(meta_desc)
    return f"""<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<link rel="preload" as="image" imageSrcSet="../../images/ow_logo.png 1x, ../../images/ow_logo.png 2x"/>
<link rel="preload" as="image" href="{hero_img}"/>
<link rel="preload" as="image" href="../../images/testimonial-bg.jpg"/>
<link rel="preconnect" href="https://fonts.googleapis.com/"/>
<link rel="preconnect" href="https://fonts.gstatic.com/" crossOrigin="anonymous"/>
<title>{esc_t}</title>
<meta name="description" content="{esc_d}"/>
<link rel="canonical" href="https://www.opticwise.com/insights/{slug}/"/>
<meta property="og:title" content="{esc_t}"/>
<meta property="og:description" content="{esc_d}"/>
<meta property="og:url" content="https://www.opticwise.com/insights/{slug}/"/>
<meta property="og:site_name" content="OpticWise"/>
<meta property="og:image" content="{abs_og}"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta property="og:type" content="article"/>
<meta property="article:published_time" content="{iso}"/>
<meta property="article:modified_time" content="{iso}"/>
<meta property="article:author" content="Drew Hall"/>
<meta property="article:section" content="AI Readiness"/>
<meta property="article:tag" content="Autonomous Operations"/>
<meta property="article:tag" content="OT Security"/>
<meta property="article:tag" content="Vendor Independence"/>
<meta property="article:tag" content="Property Brain™"/>
<meta property="article:tag" content="Portfolio Brain™"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="{esc_t}"/>
<meta name="twitter:description" content="{esc_d}"/>
<meta name="twitter:image" content="{abs_og}"/>
<meta name="keywords" content="autonomous buildings, IBcon 2026, Microsoft, owner-controlled data plane, trust plane, OT segmentation, PPP 5C™, BoT®, Building of Things®, Peak Property Performance®"/>
<meta name="robots" content="index,follow,max-image-preview:large"/>
<meta name="author" content="Drew Hall"/>
<link rel="icon" href="/favicon-48.png" type="image/png" sizes="48x48"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>

<!-- ow:strip-nextjs:assets -->
<link rel="stylesheet" href="/styles.css"/>
<link rel="stylesheet" href="/site.css"/>
<script src="/site.js" defer></script>
<script src="https://ownet.opticwise.com/forms/embed.js" defer></script>
<script src="/forms-embed.js?v=2" defer></script>
</head><body><div hidden></div>"""


# Re-build ghost_inner cleanly — previous edit was messy

ghost_inner_clean = '''<!DOCTYPE html><html lang="en"><head>
  <meta charset="utf-8"/><style>
    :root { --text:#172033; --muted:#5b6475; --border:#d9deea; --surface:#f6f8fc; --accent:#123b6d; --accent-soft:#eaf2fb; }
    body{margin:0;font-family:Arial,Helvetica,sans-serif;line-height:1.65;color:var(--text);background:#fff;}
    main{max-width:860px;margin:0 auto;padding:48px 24px 72px;}
    article{width:100%}
    .eyebrow{margin:0 0 12px;color:var(--accent);font-size:0.82rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;}
    h2{margin:44px 0 16px;font-size:clamp(1.38rem,3vw,1.85rem);line-height:1.18;color:var(--text);letter-spacing:-0.02em;}
    h3{margin:26px 0 10px;font-size:1.12rem;line-height:1.25;color:var(--text);}
    p{margin:0 0 18px;font-size:1.05rem;}
    .dek{margin-bottom:28px;color:var(--muted);font-size:1.22rem;line-height:1.5;}
    .tldr{margin:0 0 28px;padding:18px 22px;background:var(--surface);border:1px solid var(--border);border-left:4px solid var(--accent);border-radius:10px;font-size:1.02rem;line-height:1.55;}
    .tldr strong:first-child{color:var(--accent);letter-spacing:0.04em;}
    .references{margin-top:36px;padding-top:22px;border-top:1px solid var(--border);}
    .references h3{margin-top:0;color:var(--accent);font-size:1.05rem;letter-spacing:0.02em;text-transform:uppercase;}
    .references ol{margin-left:1.2rem;}
    .references li{font-size:0.98rem;color:var(--muted);margin-bottom:10px;}
    a{color:#057bb2;text-decoration:underline;}
    a:hover{color:#0493d5;}
    .byline{margin-top:36px;color:var(--muted);font-weight:700;}
  </style>
</head><body>
  <main>
    <article>
      <p class="eyebrow">AI Readiness · OT Security · Data Governance</p>
      TITLE_H2_PLACEHOLDER
      DEK_P_PLACEHOLDER
      TLDR_PLACEHOLDER
      BODY_PLACEHOLDER
      REFERENCES_PLACEHOLDER
      <p class="byline">&mdash; Drew</p>
    </article>
  </main>
</body></html>'''

ghost_inner_clean = ghost_inner_clean.replace("TITLE_H2_PLACEHOLDER", f'<h2 style="margin-top:8px;margin-bottom:12px;font-size:clamp(1.45rem,3vw,2rem);line-height:1.15;">{escape(title_txt)}</h2>')
ghost_inner_clean = ghost_inner_clean.replace("DEK_P_PLACEHOLDER", f'<p class="dek">{escape(dek)}</p>')
ghost_inner_clean = ghost_inner_clean.replace("TLDR_PLACEHOLDER", tldr)
ghost_inner_clean = ghost_inner_clean.replace("BODY_PLACEHOLDER", inner_article)
ghost_inner_clean = ghost_inner_clean.replace("REFERENCES_PLACEHOLDER", refs_html)


def nav_block() -> str:
    return """<nav class="fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-4"><div class="ow-container flex items-center justify-between"><a href="../../index.html"><img alt="OpticWise" width="150" height="36" decoding="async" class="h-9 w-auto" style="color:transparent" srcSet="../../images/ow_logo.png 1x, ../../images/ow_logo.png 2x" src="../../images/ow_logo.png"/></a><ul class="hidden lg:flex items-center gap-8"><li class="nav__dropdown" tabindex="0"><span class="nav__dropdown-trigger text-sm font-medium !text-white/85">Solutions</span><div class="nav__dropdown-menu"><a class="nav__link" href="../../property-brain/index.html">Property Brain™</a><a class="nav__link" href="../../portfolio-brain/index.html">Portfolio Brain™</a><a class="nav__link" href="../../ppp-audit/index.html">PPP Audit™</a><a class="nav__link" href="../../bot-building-of-things/index.html">BoT® — Building of Things®</a><a class="nav__link" href="../../5s-user-experience-standard/index.html">5S® Standard</a><a class="nav__link" href="../../advisory-services/index.html">Advisory Services</a></div></li><li class="nav__dropdown" tabindex="0"><span class="nav__dropdown-trigger text-sm font-medium !text-white/85">Audiences</span><div class="nav__dropdown-menu"><a class="nav__link" href="../../for-lps-and-financiers/index.html">For LPs &amp; Financiers</a><a class="nav__link" href="../../for-asset-managers/index.html">For Asset Managers</a><a class="nav__link" href="../../for-it-executives/index.html">For IT Executives</a><a class="nav__link" href="../../for-property-managers-and-engineers/index.html">For PMs &amp; Engineers</a><a class="nav__link" href="../../for-tenants/index.html">For Tenants</a></div></li><li class="nav__dropdown" tabindex="0"><span class="nav__dropdown-trigger text-sm font-medium !text-white/85">Why OpticWise</span><div class="nav__dropdown-menu"><a class="nav__link" href="../../how-we-operate/index.html">How It Works</a><a class="nav__link" href="../../customer-outcomes/index.html">Customer Outcomes</a><a class="nav__link" href="../../working-with-us/index.html">Working With Us</a></div></li><li class="nav__dropdown" tabindex="0"><a class="nav__dropdown-trigger text-sm font-medium !text-white/85" href="../../insights/index.html">Insights</a><div class="nav__dropdown-menu"><a class="nav__link" href="../../insights/index.html">Blog Articles</a><a class="nav__link" href="../../faq/index.html">FAQ</a><a class="nav__link" href="../../glossary/index.html">Glossary</a></div></li><li class="nav__dropdown" tabindex="0"><span class="nav__dropdown-trigger text-sm font-medium !text-white/85">About</span><div class="nav__dropdown-menu"><a class="nav__link" href="../../about/index.html">Company</a><a class="nav__link" href="../../contact/index.html">Contact</a></div></li><li><button type="button" class="btn btn-nav">Schedule Review</button></li></ul><button class="lg:hidden p-2" aria-label="Menu"><span class="block w-5 h-0.5 rounded bg-white mb-1.5"></span><span class="block w-5 h-0.5 rounded bg-white mb-1.5"></span><span class="block w-5 h-0.5 rounded bg-white "></span></button></div></nav><main>"""


def hero_section() -> str:
    ht = escape(title_txt)
    return f"""<section class="relative overflow-hidden pt-36 pb-16"><div class="absolute inset-0 z-0"><img src="{hero_img}" alt="" class="w-full h-full object-cover"/></div><div class="hero-overlay"></div><div class="hero-grid-lines"></div><div class="relative z-10 ow-container max-w-3xl"><a class="inline-flex items-center gap-1 text-sm text-white/50 hover:text-white/80 mb-6 transition-colors" href="../../insights/index.html">← Back to Insights</a><span class="block text-xs font-bold text-blue-300 bg-blue-400/10 px-4 py-1.5 rounded-full w-fit mb-4">AI Readiness</span><span hidden data-ow-secondary-cats="Operational Control, Data Ownership"></span><h1 class="text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-4">{ht}</h1><p class="text-lg text-white/70">{hero_sub}</p><p class="text-sm text-white/40 mt-4">May 13, 2026<span class="mx-2">·</span>By <a class="underline decoration-white/30 hover:decoration-white/70 text-white/50 hover:text-white/80" href="../../authors/drew-hall/index.html">Drew Hall</a></p></div></section>"""


def cta_footer() -> str:
    read_path = "/Users/billdouglas/My Drive/Cursor/opticwise-html/insights/oem-owns-the-brain-cre-vendor-independence/index.html"
    with open(read_path, encoding="utf-8") as f:
        tail_src = f.read()
    ix = tail_src.find('<section class="relative overflow-hidden py-24"><div class="absolute inset-0 z-0"><img src="../../images/testimonial-bg.jpg"')
    if ix == -1:
        raise RuntimeError("CTA anchor not found in OEM insight")
    jx = tail_src.find("</footer></body></html>", ix)
    return tail_src[ix : jx + len("</footer></body></html>")]


def main() -> None:
    proj = "/Users/billdouglas/My Drive/Cursor/opticwise-html"
    outdir = os.path.join(proj, "insights", slug)
    os.makedirs(outdir, exist_ok=True)
    parts = [
        head_block(),
        nav_block(),
        f'<script type="application/ld+json">{json.dumps(breadcrumb)}</script>',
        f'<script type="application/ld+json">{json.dumps(article_ld)}</script>',
        hero_section(),
        '<section class="ow-section bg-white"><div class="ow-container max-w-3xl mx-auto"><div class="ghost-content">',
        ghost_inner_clean,
        "</div></div></section>",
        "</main>",
    ]
    # CTA/footer after </main> — OEM has main closed before topic clusters; use OEM tail from </main>? 
    # OEM: ...cta... topic-clusters INSIDE main? check
    tail_bits = cta_footer()
    # OEM structure: closing </main> then footer - our parts end with erroneous </main> early
    page = "".join(parts[: -1])
    page += '</div></div></section>'  # accidental duplicate?

    raise SystemExit("fix assembly")
