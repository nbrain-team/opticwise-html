// Source of truth for the OpticWise FAQ page.
// Edit here, then run: node .audit/rewrite-faq.mjs
//
// Brand canon enforced:
// - "data & digital infrastructure" (never "infrastructure" alone in product context)
// - No "PropTech" / "leverage" / "ecosystem" / "ESG" / "synergy" in answers
// - All trademarks every mention: BoT®, 5S®, SIC®, ElasticISP®, PPP 5C™, PPP Audit™,
//   Property Brain™, Portfolio Brain™, Peak Property Performance®
// - Asset-manager / owner lens (not PM/IT)
// - Dollar specifics from §9.2 are GATED to discovery calls — answers describe
//   structure ("4–6% of ISP billing for bulk revenue share") but do not quote the
//   proprietary $40–$50/door numbers without approved client proof.

export const FAQ_HERO = {
  eyebrow: "FAQ",
  heading: "Frequently Asked Questions",
  lede: "Direct answers for CRE owners, operators, and asset managers evaluating OpticWise. These are the questions owners actually ask us — on discovery calls, in due diligence, and during board-level reviews.",
  reframeLine: "If yours isn't here, schedule a complimentary review and ask it directly.",
  primaryCtaLabel: "Schedule Your Review",
};

export const FAQ_CTA = {
  eyebrow: "Still Have Questions?",
  heading: "Ask Them Directly",
  subheading: "The fastest path is a complimentary PPP Audit™. One building, one working session, no pitch.",
  buttonLabel: "Schedule Your Review",
};

export const FAQ_SECTIONS = [
  // ─────────────────────────────────────────────────────────────
  {
    eyebrow: "Getting Started",
    heading: "The Basics",
    questions: [
      {
        question: "What is OpticWise, in one sentence?",
        answer: "OpticWise helps CRE owners turn data & digital infrastructure into owner-controlled digital assets — so Property Intelligence becomes Portfolio Intelligence.",
      },
      {
        question: "Who is OpticWise for?",
        answer: "CRE owners, asset managers, IT executives, property managers, LPs, and developers who want predictable NOI, AI-ready operations, vendor-agnostic data & digital infrastructure, and portfolios that compound value over time.",
      },
      {
        question: "Who is OpticWise not for?",
        answer: "Owners who only care about the cheapest internet. Owners who won't run governance after install. Owners looking for a single point solution without an owner standard. We're candid about fit so nobody wastes time.",
      },
      {
        question: "What is the first step?",
        answer: "A complimentary PPP Audit™. One building, one working session, clear deliverables, no sales pitch.",
      },
      {
        question: "Do I need to switch vendors to work with OpticWise?",
        answer: "No. OpticWise is vendor-agnostic and LLM-agnostic by design. You can keep vendors who perform, replace vendors who don't, and swap both in the future without rewiring the building.",
      },
      {
        question: "When was OpticWise founded?",
        answer: "OpticWise was founded in 2004 (originally as Summit Networks) and re-incorporated as OpticWise, Inc. in 2016. We've been operating owner-controlled data & digital infrastructure for CRE for two decades.",
      },
      {
        question: "Where is OpticWise headquartered, and what markets do you serve?",
        answer: "OpticWise is headquartered in Golden, Colorado, and operates properties across the United States and select international markets. Our managed data & digital infrastructure model is portable across asset classes — multifamily, office, mixed-use, industrial, and life-sciences.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    eyebrow: "About the Model",
    heading: "The Two-Layer Model & Frameworks",
    questions: [
      {
        question: "What's the difference between Layer 1 and Layer 2?",
        answer: "Layer 1 is Managed Data & Digital Infrastructure — the foundation you own, delivered through BoT®. Layer 2 is the Owner-Controlled Intelligence Layer — Property Brain™ → Portfolio Brain™, which is a vendor-agnostic data plane + trust plane. Neither layer works alone. Both are designed to compound across the portfolio.",
      },
      {
        question: "What is BoT® (Building of Things®)?",
        answer: "BoT® is OpticWise's owner-controlled approach to data & digital infrastructure. It consolidates and governs building connectivity so every device and system runs on a single, secure, segmented foundation.",
      },
      {
        question: "What is Property Brain™?",
        answer: "Property Brain™ is a vendor- and LLM-agnostic Property Intelligence Layer — a governed data plane + trust plane that makes each property capable of autonomous activities and intelligence.",
      },
      {
        question: "What is Portfolio Brain™?",
        answer: "Portfolio Brain™ is what you get when you standardize Property Brain™ across multiple properties. Intelligence compounds across the portfolio instead of restarting at every address.",
      },
      {
        question: "What is the PPP 5C™ plan?",
        answer: "Peak Property Performance® 5C™ is the repeatable five-step plan: Clarify → Connect → Collect → Coordinate → Control. Every OpticWise engagement runs on it.",
      },
      {
        question: "What is 5S®?",
        answer: "5S® is the user experience standard every OpticWise deployment is measured against: Seamless Mobility · Security · Stability · Speed · Service. Non-negotiable.",
      },
      {
        question: "What is SIC® (Security, Infrastructure, and Connectivity)?",
        answer: "SIC® is OpticWise's core network design philosophy and the engineering standard behind Layer 1. It governs how every property is designed, deployed, hardened, monitored, and operated so the data & digital infrastructure performs as an owner-controlled asset, not a vendor-controlled liability.",
      },
      {
        question: "What is ElasticISP®?",
        answer: "ElasticISP® is OpticWise's ISP-agnostic connectivity model. The data & digital infrastructure runs on whichever circuits make sense for the property — diverse providers, diverse paths, redundancy by design — without locking the owner into a single carrier or a bulk revenue-share contract.",
      },
      {
        question: "What does \"owner-controlled\" actually mean in practice?",
        answer: "Owner-controlled means the owner holds admin credentials, holds the data, holds the documentation, and holds portability rights. Vendors plug in under your rules. If OpticWise (or any vendor) goes away tomorrow, the operating standard, configurations, and history stay with you.",
      },
      {
        question: "Why does Layer 1 have to come before Layer 2 (and before AI)?",
        answer: "Industry research is consistent: fragmented building data is the #1 barrier to AI in CRE. You cannot run AI, predictive operations, or portfolio analytics on data trapped inside vendor dashboards. Layer 1 (BoT® + SIC®) delivers the unified, governed, owner-controlled data foundation that any decision engine — vendor, internal, or LLM — can act on safely.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    eyebrow: "Working Together",
    heading: "Engagement Questions",
    questions: [
      {
        question: "Is the PPP Audit™ really free?",
        answer: "Yes. Complimentary, no strings. It is how we determine fit for both sides before anyone commits to anything larger.",
      },
      {
        question: "How long does a PPP Audit™ take?",
        answer: "One building. Typically 45–90 minutes of live time with your team, plus our analysis and deliverable prep. You'll get a Property Data Map, a Control Gap Analysis, and a prioritized Roadmap.",
      },
      {
        question: "Do you require a long-term contract?",
        answer: "No. We scope to deliverables. Advisory engagements are typically project-based. Managed services are structured around ongoing operations — but without lock-in clauses that trap the owner's data.",
      },
      {
        question: "Will this disrupt our current operations?",
        answer: "No rip-and-replace. We phase around turnover, CapEx timing, and lease-up milestones. The Clarify step happens alongside normal operations.",
      },
      {
        question: "We don't have bandwidth on our on-site team. Is that a problem?",
        answer: "That's actually the point. OpticWise operates the owner standard without taxing your on-site engineers or property managers. Different skill set. Different lane. Different team. Same owner standard.",
      },
      {
        question: "What happens if we want to leave?",
        answer: "Your data is yours. Your documentation is yours. Your governance standard is yours. No hostage data. Portability is the design philosophy — not a departure penalty.",
      },
      {
        question: "Who installs the equipment and physical network?",
        answer: "Your low-voltage contractor installs wiring and equipment per our detailed specifications. OpticWise takes responsibility for designing, configuring, and operating the in-building network — and for bringing it live in coordination with your go-live schedule.",
      },
      {
        question: "How fast can a retrofit go live?",
        answer: "Retrofit deployments typically complete in less than one quarter. New-construction deployments stay synchronized with the GC schedule.",
      },
      {
        question: "Do you provide contract templates and SLAs we can give to tenants?",
        answer: "Yes. Every engagement includes a battery of proven, deployed contract templates — tenant-facing SLAs for each service plus an over-arching Master Terms & Conditions covering limitation of liability, definitions of exposure, remedy, and indemnification. These are not legal advice, but they materially shorten your counsel's review cycle.",
      },
      {
        question: "What about phone, security, IoT, and other network services?",
        answer: "Standard network services are included in the master agreement. We also support voice services, SaaS-platform onboarding for IoT devices and streaming services, security and access-control integrations, and any system that needs to ride the owner-controlled foundation under your rules.",
      },
      {
        question: "What budget cycles should we plan for after install?",
        answer: "Years 1–5 are covered by factory support warranties. At the end of year 5, plan for a refresh of support and software contracts (typically ~30% of original equipment cost). At the end of year 10, plan for a full refresh of core equipment and access points. We document this in the Roadmap up front.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    eyebrow: "Data, Privacy & AI",
    heading: "About Data and AI",
    questions: [
      {
        question: "Who owns the data?",
        answer: "You do. The entire model is built around owner-controlled data & digital infrastructure. If OpticWise goes away tomorrow, your data, your documentation, and your operating standard stay with you.",
      },
      {
        question: "Do you monetize tenant data?",
        answer: "No. OpticWise never monetizes tenant browsing behavior or sells user data. We adhere to the Ultimate Privacy Policy to protect any/all user data. Owner control and tenant trust are non-negotiable.",
      },
      {
        question: "What about privacy compliance?",
        answer: "Privacy, security, compliance, and auditability are baked into the governance layer (Coordinate step of PPP 5C™). Every access event, data flow, and system integration is documented and owner-controlled. We adhere to the Ultimate Privacy Policy to protect any/all user data.",
      },
      {
        question: "Is OpticWise an AI company?",
        answer: "We're a data & digital infrastructure company. We can perform AI functions for clients and we enable clients to be AI-driven. AI is a capability that runs on top of the foundation we build — which is why we're LLM-agnostic. You can plug in any AI platform, swap it, or run multiple in parallel — all under owner permissions.",
      },
      {
        question: "Can we use our own AI tools?",
        answer: "Yes. That's the point of LLM-agnostic design. Property Brain™ governs the data plane and trust plane. Any decision engine — internal analytics, vendor platform, any LLM — plugs in and acts under owner permissions.",
      },
      {
        question: "What happens when a better AI model comes out in six months?",
        answer: "That's exactly what Property Brain™ is built for. Swap the model. Keep your data, your workflows, your governance, and your portfolio intelligence intact. The model is the commodity. The layer above it is the asset. OpticWise designs and operates that layer for you.",
      },
      {
        question: "Do you have a published privacy policy for tenants and users?",
        answer: "Yes. The 5S® Ultimate Privacy Policy governs how OpticWise collects, uses, retains, and discloses personal and usage data on any 5S®-branded service. It is plain-language, narrow in scope, and reviewed regularly.",
      },
      {
        question: "What tenant data do you collect, and how is it used?",
        answer: "Personally identifiable information is limited to email address, first and last name, and phone number — only what's needed to provide the service and contact users about it. Device usage data (IP, time of session, device identifiers, basic diagnostics) is collected only for connectivity support and is not retained.",
      },
      {
        question: "Do you ever share, sell, or rent tenant or owner data?",
        answer: "No. We do not share personal information with service providers, affiliates, business partners, or other users. The only disclosure paths are (a) a legal obligation, (b) a merger or asset sale (with notice), or (c) a documented good-faith request from law enforcement under valid process.",
      },
      {
        question: "How does OpticWise handle law-enforcement requests?",
        answer: "We disclose Personal Data only when required by law or in response to valid requests by public authorities (court order, government agency). Every request is logged, scoped to the minimum necessary, and routed through the Coordinate layer of PPP 5C™ so the owner has visibility into what was disclosed and why.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    eyebrow: "Objection Handling",
    heading: "What If We Already…",
    questions: [
      {
        question: "\"We already have dashboards.\"",
        answer: "Dashboards aren't durable capability. The PPP 5C™ plan turns installed tech into a governed, portable owner standard — so you can actually act, not just look.",
      },
      {
        question: "\"Our vendors already handle all this.\"",
        answer: "If you don't own your data & digital infrastructure, your vendors do. Portability changes the power dynamic. Vendors compete to serve you, instead of competing to trap you.",
      },
      {
        question: "\"ROI isn't clear.\"",
        answer: "ROI ties to preventable failure modes plus specific monthly plays: utilities variance, ticket velocity, after-hours emergency spend, water risk visibility, renewals. The PPP Audit™ maps what is actually operable in your portfolio.",
      },
      {
        question: "\"This sounds disruptive.\"",
        answer: "No rip-and-replace. Start with Clarify, then phase implementation around turnover, CapEx timing, and lease-up milestones.",
      },
      {
        question: "\"We're too small for this.\"",
        answer: "If you have two or more buildings, standardization compounds. If you have one, the PPP Audit™ still maps what you own vs. what you're leasing from vendors — often the single most valuable conversation you'll have before your next CapEx cycle.",
      },
      {
        question: "\"How are you different from other vendors?\"",
        answer: "OpticWise is not a bolt-on vendor. We're a partner-operator. Most vendors want to own a layer of your stack. We want you to own the whole foundation, and we operate it for you under your rules. Vendor-agnostic, LLM-agnostic, owner-controlled by design.",
      },
      {
        question: "\"We already have a bulk ISP agreement.\"",
        answer: "Bulk ISP revenue share is typically 4–6% of ISP billing — and the carrier owns the network in your building. Owner-operated managed connectivity moves you off that ceiling, returns admin control, and ends the practice of your tenants being the ISP's customer instead of yours. Most owners migrate at lease-renewal or CapEx-cycle boundaries.",
      },
      {
        question: "\"Our IT team already handles this.\"",
        answer: "Enterprise IT was never chartered to operate building OT — segmented OT networks, BMS, access, elevators, IoT, metering. That's a different skill set in a different lane. OpticWise operates the property OT layer to your governance standard and integrates with your enterprise IT where it makes sense — without asking your IT team to staff up overnight.",
      },
      {
        question: "\"We're focused on AI, not infrastructure.\"",
        answer: "Industry research is unanimous: 98% of CRE leaders rank improving data systems as a top 24-month priority, and fragmented data is the #1 reason AI pilots stall. AI in CRE doesn't fail at the model — it fails at the data foundation. Layer 1 is the prerequisite for the AI you want to run on Layer 2.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // NEW SECTION — Managed Wi-Fi
  {
    eyebrow: "Connectivity Product Line",
    heading: "Managed Wi-Fi",
    questions: [
      {
        question: "What is OpticWise Managed Wi-Fi?",
        answer: "Managed Wi-Fi is the connectivity product line inside Layer 1 — owner-controlled, property-wide wireless built on the BoT® foundation, engineered to the SIC® standard, and held to the 5S® user-experience bar. The owner holds admin credentials, the network is segmented and documented, and the Wi-Fi works the same in every space your tenants actually use.",
      },
      {
        question: "Is the Wi-Fi truly property-wide — pool deck, parking, rooftop, basement?",
        answer: "Yes. Every deployment includes a comprehensive radio frequency (RF) design that covers all owner-specified areas — interior units, common spaces, amenity decks, parking, rooftops, basements, and outdoor work areas. Tenants stay connected as they move across the property without re-authenticating.",
      },
      {
        question: "Does it support Wi-Fi calling, so tenants don't need a separate cellular DAS?",
        answer: "Yes. The data & digital infrastructure supports Wi-Fi calling for all users, which mitigates poor in-building 5G performance and often eliminates the need for a separate cellular distributed antenna system (DAS). For most asset types, Wi-Fi calling on a properly engineered network is the simpler, cheaper, and more durable answer.",
      },
      {
        question: "Do I have to use a specific ISP or bandwidth provider?",
        answer: "No. The SIC® / ElasticISP® platform is ISP-agnostic. It runs on any Internet circuits — the ones already on-site, ones we coordinate, or ones a tenant brings in. You're never locked to a single carrier.",
      },
      {
        question: "What's the redundancy strategy for Internet circuits and power?",
        answer: "Diversity by design. Selected ISP circuits use diverse providers and diverse physical paths — when one fails, the network fails over to the other. Where the owner's strategy supports it, we coordinate two DataCenter-Direct (DIA) circuits, each with carrier-grade uptime, and add UPS coverage so 5S® users stay connected through a power event.",
      },
      {
        question: "What brands of equipment do you use?",
        answer: "Only first-tier manufacturers — for example HP, Cisco, Schneider, Fortinet — selected per property after design and evaluation. We do not deploy white-labeled or off-brand equipment.",
      },
      {
        question: "What happens if a piece of equipment fails?",
        answer: "Core equipment is covered by factory warranties; replacement options are selected by the owner during design. Robust support tiers add manufacturer 5-year next-business-day or 24×7×4 on-site support contracts on core switching, wireless controllers, and security/UTM. OpticWise coordinates all repair and restoration work end-to-end.",
      },
      {
        question: "How many users and devices can the system support?",
        answer: "Capacity is engineered to the property — every user, every operational system, every device, plus growth headroom for future devices and throughput. There is no artificial cap; the design accounts for the worst-hour load you actually expect to see.",
      },
      {
        question: "Who supports tenants when there's a connectivity issue?",
        answer: "OpticWise supports any/all end-user tenant support related to internet and connectivity — direct via phone, email, or text. Your on-site team stops fielding tickets for a service they don't bill or own.",
      },
      {
        question: "How long does a Managed Wi-Fi deployment take?",
        answer: "Retrofit deployments typically complete in less than one quarter. New-construction deployments stay synchronized with the GC schedule. The PPP Audit™ produces the property-specific timeline up front.",
      },
      {
        question: "How is Managed Wi-Fi priced — and does it pay for itself?",
        answer: "OpticWise bills you a fixed monthly fee for design, operations, and tenant support. Owners typically bill tenants directly (often as an amenity fee) so the service is a net positive to your P&L: services cost a fraction of the revenue they drive, with material NOI lift over a status-quo bulk ISP arrangement. Specific economics for your asset class come out of the discovery call.",
      },
      {
        question: "Can owners earn revenue from connectivity instead of giving it to a bulk ISP?",
        answer: "Yes. Bulk ISP revenue share is typically 4–6% of ISP billing — the carrier keeps the rest, and owns the network in your building. Owner-operated Managed Wi-Fi inverts that structure: you bill the tenant, OpticWise operates the service to the 5S® standard, and you stop giving away one of your most valuable amenities.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    eyebrow: "Quick Answers",
    heading: "Common Questions About Owner-Controlled CRE",
    questions: [
      {
        question: "What is owner-controlled data in commercial real estate?",
        answer: "Owner-controlled data means the building owner holds admin credentials, owns the data, has portability rights, and can swap vendors without losing history. It's the prerequisite for AI readiness, governance, and durable NOI growth across CRE portfolios.",
      },
      {
        question: "How do CRE owners prepare for AI?",
        answer: "AI readiness in commercial real estate starts with owner-controlled data & digital infrastructure — not the AI tool. The OpticWise 5C™ Plan sequences this: Clarify what data matters and who owns it, Connect systems on a unified backbone, Collect normalized data, Coordinate governance, then Control any AI or decision engine that plugs in.",
      },
      {
        question: "What is the difference between Property Brain™ and Portfolio Brain™?",
        answer: "Property Brain™ is the OpticWise intelligence layer at a single property — a vendor- and LLM-agnostic data plane plus trust plane that supports any decision engine. Portfolio Brain™ is the same intelligence layer scaled across every property in a portfolio, so benchmarking, pattern detection, and centralized decisioning compound across buildings.",
      },
      {
        question: "Should CRE owners build or buy digital infrastructure?",
        answer: "CRE owners shouldn't build data & digital infrastructure from scratch — it's not a real estate competency. The right move is to engage a managed-services partner (like OpticWise) that designs, implements, and operates owner-controlled infrastructure, leaving the owner with admin credentials, data ownership, and portability rights, but without the operational burden.",
      },
      {
        question: "What does AI-ready CRE actually mean?",
        answer: "AI-ready commercial real estate is a property or portfolio where AI can deliver measurable operational value. It requires three things: clean, normalized, owner-controlled data; integrated building systems on a unified network; and governance that defines who and what can act on the data. Most buildings are not AI-ready today because the data layer belongs to vendors.",
      },
      {
        question: "Why is CRE data ownership a valuation issue now?",
        answer: "CRE data ownership has become a valuation issue because operational data — energy patterns, tenant behavior, maintenance history — is now what AI, predictive operations, and portfolio analytics run on. Buildings with portable, owner-controlled data can be operated, refinanced, and sold without losing intelligence. Buildings with vendor-trapped data trade at a discount.",
      },
      {
        question: "What is shadow AI in commercial real estate?",
        answer: "Shadow AI in CRE isn't your corporate team using ChatGPT. It's every vendor inside your building running AI on your operational data — leasing platforms, energy systems, access control — under their governance, not yours. The fix is owner-controlled data & digital infrastructure that lets owners audit and control vendor AI, not ban it.",
      },
      {
        question: "How does the 5C™ Plan compare to traditional CRE technology?",
        answer: "Traditional CRE technology stacks vendor tools on top of a fragmented data foundation. The 5C™ Plan inverts the order: Clarify and Connect the owner-controlled foundation first, Collect and Coordinate the data, then Control any decision engine on top. The same vendor tools can still plug in — but on the owner's terms, not the vendor's.",
      },
      {
        question: "What does it cost to make a building AI-ready?",
        answer: "Cost varies by property size and complexity, but typical Peak Property Performance® engagements cost a fraction of comparable hyperscale or enterprise IT projects — measured in tens of thousands of dollars per building, not millions. The real return is portfolio-wide: NOI lift, faster lease-up, lower OpEx, and the ability to swap decision engines without rewiring buildings.",
      },
      {
        question: "Why is fragmented building data a barrier to AI in CRE?",
        answer: "Industry research is consistent: 100% of CRE leaders surveyed report that fragmented data across multiple platforms slows AI readiness. The data arrives late, varies in quality from one vendor to the next, and lives in dashboards the owner can't export. AI cannot reason across data it can't reach. Layer 1 (BoT® + SIC®) eliminates the fragmentation; Layer 2 (Property Brain™ → Portfolio Brain™) governs how decision engines act on it.",
      },
      {
        question: "What is the IT/OT gap in commercial real estate?",
        answer: "Most CRE-owning organizations were never architected for OT — operational technology like building automation, HVAC controls, access, elevators, IoT, metering, tenant connectivity. Enterprise IT covers the corporate network. Building tech is \"facilities\" or \"vendor-managed.\" When the breach, the review, or the AI initiative arrives, the gap lands on the IT executive's desk. OpticWise operates the OT layer to the owner's governance standard.",
      },
      {
        question: "How does Wi-Fi affect NOI in commercial real estate?",
        answer: "Wi-Fi is no longer a utility — it's an investment signal. Owner-operated Managed Wi-Fi materially outperforms bulk ISP revenue share (typically 4–6% of ISP billing) because the owner bills the tenant directly and the service is a property-wide amenity, not a vendor's product. The NOI lift compounds across the hold period and shows up in cap-rate-equivalent value at exit.",
      },
      {
        question: "What are shadow networks in a commercial building?",
        answer: "Shadow networks are vendor-installed, undocumented, or duplicate networks running inside your building — often 15+ separate ones in a single asset. They surface as cybersecurity exposure, audit findings, and \"never turned on\" systems billed for years after a property-manager change. The fix is owner-controlled consolidation under one governed foundation, then vendors plug in under owner rules.",
      },
      {
        question: "How do AI agents change CRE operations?",
        answer: "AI agents are decision engines — they read building data, propose actions, and (with permission) act. The market value isn't which model you use; it's whether the agent can reach trustworthy data and act under enforceable rules. Property Brain™ is the data plane plus trust plane that makes agentic behavior auditable. The model is the commodity. The governance layer above it is the asset.",
      },
      {
        question: "Why does CRE data ownership matter for refinancing and exit?",
        answer: "Lenders, LPs, and acquirers are starting to underwrite the data behind the asset. Buildings with owner-controlled, portable data — energy, tenant patterns, maintenance history, governance — can be diligenced cleanly and continue operating without vendor permission. Buildings with vendor-trapped data lose intelligence at the closing table and trade at a diligence discount.",
      },
    ],
  },
];
