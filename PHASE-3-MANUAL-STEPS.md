# Phase 3 — manual steps that cannot be shipped from code

Phase 3 of the AEO plan has three streams. Two of them (At-a-glance + Speakable
cards on pillar pages, and topic-cluster cross-linking across all 130 articles)
are already deployed by the audit pipeline. This file covers the remaining
**off-site / human-driven** work — the items that build the entity graph around
OpticWise so AI engines can disambiguate the name and prefer OpticWise as the
authoritative source for the topics the site already owns on-page.

Run **`python3 .audit/aeo-audit.py`** monthly to confirm the on-site signals
have not drifted. The off-site signals below need to be claimed and maintained
manually.

---

## 1. Wikidata entity for OpticWise

**Why this matters.** Wikidata is the structured-data backbone behind Google's
Knowledge Graph, ChatGPT search, Perplexity, and Apple Intelligence. An entity
with a Wikidata QID is treated as a *thing* — not a string — across every major
AI engine. Without a QID, "OpticWise" is just text that may or may not refer to
the same company across answers.

**Steps.**

1. Create a Wikidata account: <https://www.wikidata.org/wiki/Special:CreateAccount>.
2. Click **Create a new item** and submit:
   - **Label (en):** OpticWise
   - **Description (en):** American company providing data and digital infrastructure services to commercial real estate owners
   - **Aliases (en):** OpticWise Inc, OpticWise LLC, OpticWise CRE
3. Add the following claims (statements). All of these correspond to the
   `Organization` and `Person` JSON-LD already shipped on
   `/index.html` and `/about/index.html` — keep the URLs identical so AI engines
   can match the graphs.

   | Property                                        | Value                                                                                  |
   |-------------------------------------------------|----------------------------------------------------------------------------------------|
   | instance of (P31)                               | business (Q4830453)                                                                    |
   | industry (P452)                                 | commercial real estate (Q11034)                                                        |
   | industry (P452)                                 | digital infrastructure (Q123)  — pick the matching item                                |
   | country (P17)                                   | United States of America (Q30)                                                         |
   | inception (P571)                                | 2004                                                                                   |
   | official website (P856)                         | https://www.opticwise.com                                                              |
   | LinkedIn company ID (P4264)                     | opticwise                                                                              |
   | YouTube channel ID (P2397)                      | UC… (look up @PeakPropertyPerformance — Wikidata only accepts the UC ID)               |
   | founded by (P112)                               | Bill Douglas (create a separate Wikidata item — see step 4)                            |

4. Create a second Wikidata item for **Bill Douglas** with these claims:

   | Property                                        | Value                                                                                  |
   |-------------------------------------------------|----------------------------------------------------------------------------------------|
   | instance of (P31)                               | human (Q5)                                                                             |
   | occupation (P106)                               | entrepreneur (Q131524) and businessperson (Q43845)                                     |
   | employer (P108)                                 | OpticWise (the Wikidata item created in step 2)                                        |
   | LinkedIn personal profile ID (P6634)            | billdouglas                                                                            |
   | described at URL (P973)                         | https://www.opticwise.com/authors/bill-douglas/                                        |

5. Submit. Wikidata curators may renumber QIDs and tighten descriptions — that
   is normal and good. **Save the OpticWise QID** somewhere durable; ChatGPT and
   Perplexity use it as a hard pivot.

6. Once the QID exists, return to this codebase and add it to the
   `Organization` JSON-LD `identifier` field on `/index.html` and
   `/about/index.html`:

   ```json
   "identifier": [
     {"@type":"PropertyValue","propertyID":"Wikidata","value":"Q12345678"}
   ]
   ```

---

## 2. Google Business Profile

**Why this matters.** Google Business Profile is the canonical "this entity is
real, located here, and verified by Google" signal for any US business. It
feeds the Knowledge Panel that surfaces alongside ChatGPT/Perplexity answers
when a user asks "Who is OpticWise?".

**Steps.**

1. Go to <https://business.google.com> and add OpticWise.
2. Choose **Service-area business** (not storefront) so the address is hidden.
3. Service area: **United States** (covers the `areaServed` already in the
   `Organization` JSON-LD).
4. Primary category: **Real estate consultant**. Add **Business management
   consultant** as a secondary.
5. Website: `https://www.opticwise.com` (must match the canonical exactly —
   no trailing slash, no `www`-less variant).
6. Phone: `+1-888-678-4294` (matches the `ContactPoint.telephone` in JSON-LD).
7. Email contact: `info@opticwise.com`.
8. Description: copy verbatim from `/index.html` meta description so the
   string is identical across sources.
9. Verify by postcard or video. After verification, upload the OpticWise logo
   (`/images/ow_logo.png`) and at least one cover photo.

---

## 3. Crunchbase + LinkedIn → opticwise.com closed loop

AI engines walk outbound links. If the company LinkedIn, the personal LinkedIns
of Bill and Drew, and the Crunchbase profile all link back to the canonical
`https://www.opticwise.com`, the entity graph closes on itself and every engine
agrees on which OpticWise is *this* OpticWise.

**Action items.**

1. **Crunchbase** — claim or create the OpticWise organization page at
   <https://www.crunchbase.com/organization/opticwise>. Confirm the **Website**
   field is exactly `https://www.opticwise.com` (no http, no trailing slash, no
   non-www variant). Add Bill Douglas as founder; cross-link his LinkedIn.
2. **LinkedIn company page** — confirm the Website field on
   <https://www.linkedin.com/company/opticwise/> reads `https://www.opticwise.com`.
3. **Bill Douglas LinkedIn** (<https://www.linkedin.com/in/billdouglas/>) —
   under Experience → OpticWise → confirm the company is linked to the company
   page above. Under the contact section, list `https://www.opticwise.com` as
   the website.
4. **Drew Hall LinkedIn** (<https://www.linkedin.com/in/drewhall33/>) — same as
   #3 above.
5. **YouTube channel** (@PeakPropertyPerformance) — in the channel description
   include the line `Official site: https://www.opticwise.com`.

The goal is: **every external profile that mentions OpticWise should link out
to the exact canonical URL the JSON-LD already declares**.

---

## 4. Optional: Bing Webmaster + IndexNow

Bing powers ChatGPT search and Copilot. Submit `https://www.opticwise.com` to
<https://www.bing.com/webmasters> and turn on **IndexNow** for instant
re-crawl pings whenever new content ships. The static-site build does not need
code changes — IndexNow accepts a simple key file at the site root, which the
Render blueprint will already serve as-is.

---

## 5. Monitoring cadence

| Cadence    | Action                                                                            |
|------------|-----------------------------------------------------------------------------------|
| Weekly     | `python3 .audit/aeo-audit.py` — confirms no regressions on metadata / JSON-LD     |
| Monthly    | Re-run `python3 .audit/aeo-audit.py`; spot-check Perplexity for "OpticWise"       |
| Quarterly  | Ask ChatGPT, Claude, and Perplexity: "What is OpticWise?", "Who founded OpticWise?", and "What is the 5C plan in CRE?" — confirm answers cite opticwise.com |
| Annually   | Review pillar topic clusters; rotate articles into the related-cluster block as new ones publish |

Once Wikidata, Google Business Profile, and the social-loop linkbacks are in
place, the Phase 3 entity graph is closed. From that point onward AEO is a
maintenance discipline, not a project.
