#!/usr/bin/env python3
"""
OpticWise AEO audit — reusable monthly health-check.

Run:
    python3 .audit/aeo-audit.py

Reports:
  - HTML page count & canonical-URL coverage
  - Title / description / OG / Twitter / canonical coverage
  - Title & description length distribution (decoded)
  - H1 coverage
  - JSON-LD parse health & schema-type coverage
  - Per-pillar Speakable / at-a-glance / related-cluster presence
  - Article visible-byline & Person-author coverage
  - Empty alt count, split decorative vs other
  - llms.txt / llms-full.txt / robots.txt / sitemap.xml sanity

This script does not modify files.
"""
from __future__ import annotations
from pathlib import Path
from collections import Counter, defaultdict
import re, json, html, sys

ROOT = Path(__file__).resolve().parent.parent
DECORATIVE_IMAGE_NAMES = {'testimonial-bg.jpg'}
PILLARS = [
    "digital-infrastructure-noi-strategy",
    "digital-infrastructure-noi-playbook",
    "digital-infrastructure-noi-ai",
    "ai-ready-commercial-real-estate",
    "own-vs-lease-cre-building-data",
    "control-cre-digital-visibility",
]

def collect_html(root: Path):
    files = []
    for f in root.rglob('*.html'):
        s = str(f)
        if '/node_modules/' in s or '/.git/' in s: continue
        files.append(f)
    return files

def get_head(text: str) -> str:
    end = text.find('</head>')
    return text[:end+7] if end != -1 else text[:8000]

def extract_jsonld(text: str):
    blocks = []
    for m in re.finditer(r'<script[^>]+application/ld\+json[^>]*>(.*?)</script>', text, re.DOTALL):
        raw = m.group(1).strip()
        try:
            blocks.append(json.loads(raw))
        except Exception as e:
            blocks.append({'__parse_error__': str(e)[:160]})
    return blocks

def main():
    files = collect_html(ROOT)
    print(f'Scanning {len(files)} HTML files under {ROOT}')

    title_ok = desc_ok = canon_ok = og_ok = tw_ok = h1_ok = 0
    title_lens = []
    desc_lens = []
    long_titles = []
    long_descs = []
    parse_errors = 0
    schema_types = Counter()
    empty_alt_deco = empty_alt_other = 0
    articles_with_byline = articles_with_person_author = 0
    article_count = 0
    canonicals_www = canonicals_other = 0

    for f in files:
        t = f.read_text(errors='ignore')
        head = get_head(t)

        m = re.search(r'<title[^>]*>([^<]+)</title>', head)
        if m:
            title_ok += 1
            tl = html.unescape(m.group(1)).strip()
            title_lens.append(len(tl))
            if len(tl) > 70: long_titles.append((f.relative_to(ROOT).as_posix(), len(tl), tl[:80]))

        m = re.search(r'name=["\']description["\'][^>]*content=["\']([^"\']+)', head)
        if m:
            desc_ok += 1
            dl = html.unescape(m.group(1)).strip()
            desc_lens.append(len(dl))
            if len(dl) > 165: long_descs.append((f.relative_to(ROOT).as_posix(), len(dl)))

        m = re.search(r'rel=["\']canonical["\'][^>]*href=["\']([^"\']+)', head)
        if m:
            canon_ok += 1
            if m.group(1).startswith('https://www.opticwise.com'): canonicals_www += 1
            else: canonicals_other += 1

        if re.search(r'property=["\']og:title["\']', head): og_ok += 1
        if re.search(r'name=["\']twitter:card["\']', head): tw_ok += 1
        if re.search(r'<h1\b', t): h1_ok += 1

        for b in extract_jsonld(t):
            if isinstance(b, dict) and b.get('__parse_error__'):
                parse_errors += 1
                continue
            def collect_types(o):
                if isinstance(o, dict):
                    if '@type' in o:
                        v = o['@type']
                        if isinstance(v, list):
                            for it in v: schema_types[it] += 1
                        else:
                            schema_types[v] += 1
                    for vv in o.values(): collect_types(vv)
                elif isinstance(o, list):
                    for it in o: collect_types(it)
            collect_types(b)

        for m in re.finditer(r'<img\b[^>]*\salt=""[^>]*>', t):
            sm = re.search(r'src="([^"]+)"', m.group(0))
            name = sm.group(1).rsplit('/',1)[-1] if sm else ''
            if name in DECORATIVE_IMAGE_NAMES: empty_alt_deco += 1
            else: empty_alt_other += 1

        if '/insights/' in f.as_posix() and not f.as_posix().endswith('/insights/index.html'):
            article_count += 1
            # Visible byline: a <p>...</p> in the hero that mentions "By", then links
            # to both author profile pages. Two formats coexist:
            #   "April 3, 2025 · 4 min read · By <a Bill> & <a Drew>"   (125 articles)
            #   "By <a Bill> & <a Drew>"                                ( 5 articles)
            for pm in re.finditer(r'<p\b[^>]*>(.*?)</p>', t, re.DOTALL):
                inner = pm.group(1)
                if ('authors/bill-douglas' in inner
                    and 'authors/drew-hall' in inner
                    and re.search(r'(?:·\s*)?By\s*<a', inner)):
                    articles_with_byline += 1
                    break
            if '"@id":"https://www.opticwise.com/authors/bill-douglas/#person"' in t:
                articles_with_person_author += 1

    print('\n== Metadata coverage ==')
    n = len(files)
    print(f'  title         : {title_ok}/{n}')
    print(f'  description   : {desc_ok}/{n}')
    print(f'  canonical     : {canon_ok}/{n}   (www.opticwise.com: {canonicals_www}, other host: {canonicals_other})')
    print(f'  og:title      : {og_ok}/{n}')
    print(f'  twitter:card  : {tw_ok}/{n}')
    print(f'  H1            : {h1_ok}/{n}')

    print('\n== Length sanity ==')
    if title_lens:
        print(f'  title length  : min={min(title_lens)} median={sorted(title_lens)[len(title_lens)//2]} max={max(title_lens)}')
    if desc_lens:
        print(f'  desc length   : min={min(desc_lens)} median={sorted(desc_lens)[len(desc_lens)//2]} max={max(desc_lens)}')
    print(f'  titles > 70   : {len(long_titles)}')
    print(f'  descs  > 165  : {len(long_descs)}')
    if long_titles:
        for p,l,t in long_titles[:5]: print(f'    [{l}] {p}: {t}')
    if long_descs:
        for p,l in long_descs[:5]: print(f'    [{l}] {p}')

    print('\n== JSON-LD ==')
    print(f'  parse errors  : {parse_errors}')
    for ty in ['Organization','WebSite','WebPage','Article','BreadcrumbList','FAQPage','Service','HowTo','Person','DefinedTermSet','DefinedTerm','SpeakableSpecification']:
        print(f'  {ty:<22}: {schema_types.get(ty,0)}')

    print('\n== Pillar pages ==')
    for pid in PILLARS:
        p = ROOT/pid/'index.html'
        ok = p.exists()
        if not ok:
            print(f'  {pid}: MISSING')
            continue
        t = p.read_text(errors='ignore')
        aag = 'id="at-a-glance"' in t
        spk = '"SpeakableSpecification"' in t or 'speakable' in t
        rel = 'id="related-insights"' in t
        print(f'  {pid}: at-a-glance={aag}  speakable={spk}  related={rel}')

    print('\n== Articles ==')
    print(f'  total articles                : {article_count}')
    print(f'  with visible Bill & Drew byline: {articles_with_byline}')
    print(f'  with Bill Douglas Person @id  : {articles_with_person_author}')

    print('\n== Images ==')
    print(f'  empty alt (decorative)        : {empty_alt_deco}')
    print(f'  empty alt (other)             : {empty_alt_other}')

    print('\n== AI-engine surfaces ==')
    for name in ['robots.txt','sitemap.xml','llms.txt','llms-full.txt']:
        p = ROOT/name
        if p.exists():
            sz = p.stat().st_size
            print(f'  {name:<14}: present ({sz:,} bytes)')
        else:
            print(f'  {name:<14}: MISSING')

    rt = (ROOT/'robots.txt').read_text() if (ROOT/'robots.txt').exists() else ''
    for bot in ['GPTBot','ClaudeBot','PerplexityBot','Google-Extended','Applebot-Extended']:
        print(f'  robots.txt allows {bot}: {bot in rt}')

if __name__ == '__main__':
    main()
