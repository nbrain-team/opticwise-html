/* OpticWise marketing site — minimal vanilla-JS runtime
 *
 * Replaces the legacy Next.js bundle for interactive behaviors:
 *   - Mobile nav: hamburger toggle, tap-to-expand dropdowns
 *   - ESC + outside-click to close the mobile menu
 *   - Wire data-form-trigger="schedule-review" buttons (forms-embed.js
 *     handles the rest via document-level click delegation)
 *   - Insights listing: category filter, search, "Load more" pagination
 *     (gated on /insights/ — no-ops everywhere else)
 *
 * Desktop nav dropdowns are pure CSS (:hover / :focus-within in styles.css).
 *
 * Footer copyright year, JSON-LD, OG meta — all server-rendered, no JS.
 *   - GA4 (gtag): loads when GA4_MEASUREMENT_ID is set (see below).
 */
(function () {
  'use strict';
  if (window.OWSite && window.OWSite.__init) { return; }

  /* Google Analytics 4 — OpticWise.
   *   Property ID (numeric, GA Admin):  378142813
   *   Web stream Measurement ID (tag):  G-XSB5M0FJC0
   * Web tagging uses the Measurement ID (Admin → Data streams → Web → Measurement ID),
   * NOT the numeric property ID. */
  var GA4_MEASUREMENT_ID = 'G-XSB5M0FJC0';

  var MOBILE_MAX = 1023; // matches Tailwind `lg:` breakpoint (1024px)

  function isMobileViewport() {
    return window.matchMedia('(max-width: ' + MOBILE_MAX + 'px)').matches;
  }

  /* ── WCAG 2.1 AA — Skip link + main landmark ───────────────────── */

  function setupA11yLandmarks() {
    var main = document.querySelector('main');
    if (main && !main.id) { main.id = 'main-content'; }

    var nav = document.querySelector('nav');
    var target = main || document.querySelector('.ow-v4') || document.body;
    if (!target.id) { target.id = 'main-content'; }

    if (!document.querySelector('.ow-skip-link')) {
      var skip = document.createElement('a');
      skip.href = '#' + target.id;
      skip.className = 'ow-skip-link';
      skip.textContent = 'Skip to main content';
      var first = nav || document.body.firstChild;
      document.body.insertBefore(skip, first);
    }
  }

  /* ── WCAG 2.1 AA — Reusable focus trap ────────────────────────── */

  function trapFocus(container) {
    var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    function getFocusable() {
      return Array.prototype.slice.call(container.querySelectorAll(FOCUSABLE)).filter(function (el) {
        return el.offsetParent !== null;
      });
    }
    function handler(ev) {
      if (ev.key !== 'Tab') { return; }
      var focusable = getFocusable();
      if (!focusable.length) { return; }
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (ev.shiftKey) {
        if (document.activeElement === first) { ev.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { ev.preventDefault(); first.focus(); }
      }
    }
    container.addEventListener('keydown', handler);
    return function release() { container.removeEventListener('keydown', handler); };
  }

  window.OWTrapFocus = trapFocus;

  function setupNav() {
    var nav = document.querySelector('nav');
    if (!nav) { return; }
    if (nav.dataset.owSite === '1') { return; }
    nav.dataset.owSite = '1';

    var hamburger = nav.querySelector('button[aria-label="Menu"]');
    var dropdowns = nav.querySelectorAll('.nav__dropdown');

    /* ── Phase 2: Nav ARIA — hamburger ───────────────────────────── */
    if (hamburger) {
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.setAttribute('aria-controls', 'ow-mobile-menu');
      var menuList = nav.querySelector('ul');
      if (menuList) { menuList.id = 'ow-mobile-menu'; }
    }

    /* ── Phase 2: Nav ARIA — dropdown triggers ───────────────────── */
    dropdowns.forEach(function (dd) {
      var trigger = dd.querySelector('.nav__dropdown-trigger');
      var menu = dd.querySelector('.nav__dropdown-menu');
      if (trigger) {
        if (trigger.tagName !== 'A') {
          trigger.setAttribute('role', 'button');
          trigger.setAttribute('tabindex', '0');
        }
        trigger.setAttribute('aria-haspopup', 'true');
        trigger.setAttribute('aria-expanded', 'false');
      }
      if (menu) {
        menu.setAttribute('role', 'menu');
        menu.querySelectorAll('a').forEach(function (a) {
          a.setAttribute('role', 'menuitem');
        });
      }
    });

    function syncDropdownAria(dd, expanded) {
      var trigger = dd.querySelector('.nav__dropdown-trigger');
      if (trigger) { trigger.setAttribute('aria-expanded', expanded ? 'true' : 'false'); }
    }

    function close() {
      nav.classList.remove('is-open');
      if (hamburger) { hamburger.setAttribute('aria-expanded', 'false'); }
      dropdowns.forEach(function (dd) {
        dd.classList.remove('is-expanded');
        syncDropdownAria(dd, false);
      });
    }

    if (hamburger) {
      hamburger.addEventListener('click', function (ev) {
        ev.stopPropagation();
        var opening = !nav.classList.contains('is-open');
        nav.classList.toggle('is-open');
        hamburger.setAttribute('aria-expanded', opening ? 'true' : 'false');
      });
    }

    dropdowns.forEach(function (dd) {
      var trigger = dd.querySelector('.nav__dropdown-trigger');
      if (!trigger) { return; }
      // On mobile only: tap-to-expand (desktop already opens on hover).
      // Anchor triggers with hrefs (e.g. Insights links to /insights) keep
      // their navigation on a second tap; the first tap just expands.
      trigger.addEventListener('click', function (ev) {
        if (!isMobileViewport()) { return; }
        var alreadyOpen = dd.classList.contains('is-expanded');
        // If trigger is an anchor and dropdown is already open, allow nav.
        if (trigger.tagName === 'A' && alreadyOpen) { return; }
        ev.preventDefault();
        dropdowns.forEach(function (other) {
          if (other !== dd) { other.classList.remove('is-expanded'); }
        });
        dd.classList.toggle('is-expanded');
      });
    });

    document.addEventListener('click', function (ev) {
      if (!nav.classList.contains('is-open')) { return; }
      if (nav.contains(ev.target)) { return; }
      close();
    });

    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') { close(); }
    });

    // Close mobile menu on resize back to desktop, otherwise the menu stays
    // visible in the wrong layout.
    var resizeTimer = null;
    window.addEventListener('resize', function () {
      if (resizeTimer) { clearTimeout(resizeTimer); }
      resizeTimer = setTimeout(function () {
        if (!isMobileViewport()) { close(); }
      }, 100);
    });

    // Close menu on link click (don't trap users in the mobile menu).
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        if (isMobileViewport()) { close(); }
      });
    });

    // Scroll-state: paint the nav with a dark translucent backdrop once
    // the page scrolls so body copy passing behind the bar stays readable.
    // Inline `transition-all duration-300` on the nav element animates it.
    var SCROLL_THRESHOLD = 8;
    var scrollTicking = false;
    function syncScrolled() {
      scrollTicking = false;
      if ((window.scrollY || window.pageYOffset || 0) > SCROLL_THRESHOLD) {
        nav.classList.add('is-scrolled');
      } else {
        nav.classList.remove('is-scrolled');
      }
    }
    window.addEventListener('scroll', function () {
      if (scrollTicking) { return; }
      scrollTicking = true;
      window.requestAnimationFrame(syncScrolled);
    }, { passive: true });
    syncScrolled();
  }

  function setupInsights() {
    var grid = document.querySelector('[data-ow-insights-grid]');
    if (!grid) { return; }
    var tabs = Array.prototype.slice.call(document.querySelectorAll('.role-tab'));
    if (!tabs.length) { return; }
    var cards = Array.prototype.slice.call(grid.querySelectorAll('a[data-ow-slug]'));
    var searchInput = document.querySelector('input[placeholder^="Search insights"]');
    var loadMoreBtn = document.querySelector('[data-ow-insights-loadmore]');
    var loadMoreWrap = document.querySelector('[data-ow-insights-loadmore-wrap]');
    var counter = document.querySelector('[data-ow-insights-count]');

    var INITIAL_BATCH = 30;
    var BATCH = 30;

    var activeCategory = 'All';
    var query = '';
    var pageSize = INITIAL_BATCH;
    var searchIndex = null;
    var searchIndexPromise = null;

    function normCat(s) {
      return (s || '').replace(/\s+/g, ' ').trim().toLowerCase();
    }

    function loadSearchIndex() {
      if (searchIndex) { return Promise.resolve(searchIndex); }
      if (searchIndexPromise) { return searchIndexPromise; }
      // Prefer a path relative to the listing page so the file can also be
      // opened directly via file:// without a server (matches the rest of
      // the static export's relative-link convention).
      var url = './search-index.json';
      searchIndexPromise = fetch(url, { credentials: 'same-origin' })
        .then(function (r) { return r.ok ? r.json() : []; })
        .then(function (data) {
          searchIndex = new Map();
          if (Array.isArray(data)) {
            data.forEach(function (e) {
              if (e && e.slug) { searchIndex.set(e.slug, e); }
            });
          }
          return searchIndex;
        })
        .catch(function () {
          searchIndex = new Map();
          return searchIndex;
        });
      return searchIndexPromise;
    }

    function cardMatches(card) {
      var cardCat = card.getAttribute('data-ow-cat') || '';
      if (activeCategory !== 'All' && normCat(cardCat) !== normCat(activeCategory)) {
        return false;
      }
      if (!query) { return true; }
      var slug = card.getAttribute('data-ow-slug') || '';
      var titleEl = card.querySelector('h3');
      var excEl = card.querySelector('p');
      var hayTitle = titleEl ? titleEl.textContent.toLowerCase() : '';
      var hayExc = excEl ? excEl.textContent.toLowerCase() : '';
      if (hayTitle.indexOf(query) !== -1) { return true; }
      if (hayExc.indexOf(query) !== -1) { return true; }
      if (cardCat.toLowerCase().indexOf(query) !== -1) { return true; }
      if (searchIndex && slug) {
        var entry = searchIndex.get(slug);
        if (entry) {
          if ((entry.body || '').toLowerCase().indexOf(query) !== -1) { return true; }
          if ((entry.title || '').toLowerCase().indexOf(query) !== -1) { return true; }
          if ((entry.excerpt || '').toLowerCase().indexOf(query) !== -1) { return true; }
        }
      }
      return false;
    }

    function applyFilters() {
      var matches = [];
      var nonMatch = [];
      for (var i = 0; i < cards.length; i++) {
        if (cardMatches(cards[i])) { matches.push(cards[i]); }
        else { nonMatch.push(cards[i]); }
      }
      // Search expands to all matches; otherwise paginate by pageSize.
      var showCount = query ? matches.length : Math.min(pageSize, matches.length);
      for (var j = 0; j < matches.length; j++) {
        if (j < showCount) { matches[j].removeAttribute('hidden'); }
        else { matches[j].setAttribute('hidden', ''); }
      }
      for (var k = 0; k < nonMatch.length; k++) {
        nonMatch[k].setAttribute('hidden', '');
      }
      if (counter) {
        counter.innerHTML =
          'Showing <!-- -->' + showCount + '<!-- --> of <!-- -->' + matches.length;
      }
      var remaining = matches.length - showCount;
      if (loadMoreWrap && loadMoreBtn) {
        if (remaining > 0 && !query) {
          loadMoreWrap.style.display = '';
          loadMoreBtn.textContent = 'Load more (' + remaining + ' remaining)';
        } else {
          loadMoreWrap.style.display = 'none';
        }
      }
    }

    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        tabs.forEach(function (o) { o.classList.remove('active'); });
        t.classList.add('active');
        activeCategory = (t.getAttribute('data-ow-cat') || t.textContent || 'All').trim();
        pageSize = INITIAL_BATCH;
        applyFilters();
      });
    });

    if (searchInput) {
      var debounceTimer = null;
      searchInput.addEventListener('focus', function () { loadSearchIndex(); });
      searchInput.addEventListener('input', function () {
        if (debounceTimer) { clearTimeout(debounceTimer); }
        debounceTimer = setTimeout(function () {
          var v = (searchInput.value || '').trim().toLowerCase();
          var run = function () {
            query = v;
            pageSize = INITIAL_BATCH;
            applyFilters();
          };
          if (v) { loadSearchIndex().then(run); }
          else { run(); }
        }, 150);
      });
    }

    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', function () {
        pageSize += BATCH;
        applyFilters();
      });
    }

    applyFilters();
  }

  /* Google Consent Mode v2 + GA4.
   *
   * GA4 loads immediately with consent defaults set to 'denied'. This sends
   * cookieless/modeled pings so Google can provide aggregate data even before
   * the visitor interacts with the consent banner.
   *
   * When the visitor grants analytics consent (via OWConsent), we update the
   * consent state to 'granted' so GA4 sets cookies and sends full measurement.
   *
   * For non-EU visitors (detected by cookie-consent.js geo-check), the
   * ow:consent-updated event fires immediately with analytics:true, so full
   * measurement starts right away without any visible banner. */

  var ga4Initialized = false;

  function initGa4WithConsentMode() {
    if (ga4Initialized) { return; }
    var mid = GA4_MEASUREMENT_ID;
    if (!mid || !/^G-[A-Z0-9]+$/i.test(mid)) { return; }
    ga4Initialized = true;

    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    window.gtag = gtag;

    // Consent Mode v2 defaults — deny everything until explicit consent
    gtag('consent', 'default', {
      'analytics_storage': 'denied',
      'ad_storage': 'denied',
      'ad_user_data': 'denied',
      'ad_personalization': 'denied',
      'wait_for_update': 500
    });

    gtag('js', new Date());
    gtag('config', mid);

    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(mid);
    if (document.head) {
      document.head.appendChild(script);
    }
  }

  function updateGa4Consent(granted) {
    if (typeof gtag !== 'function') { return; }
    gtag('consent', 'update', {
      'analytics_storage': granted ? 'granted' : 'denied'
    });
  }

  function setupGa4() {
    initGa4WithConsentMode();

    // If consent already exists (returning visitor), apply it immediately
    if (window.OWConsent && window.OWConsent.hasConsent('analytics')) {
      updateGa4Consent(true);
    }

    document.addEventListener('ow:consent-updated', function (e) {
      var granted = e.detail && e.detail.analytics;
      updateGa4Consent(!!granted);
    });
  }

  function setupGa4NavTracking() {
    if (typeof gtag !== 'function') { return; }
    var nav = document.querySelector('nav');
    if (!nav) { return; }
    nav.querySelectorAll('.nav__dropdown-menu a').forEach(function (a) {
      a.addEventListener('click', function () {
        var label = (a.textContent || '').trim();
        var href = a.getAttribute('href') || '';
        var dd = a.closest('.nav__dropdown');
        var section = '';
        if (dd) {
          var trig = dd.querySelector('.nav__dropdown-trigger');
          if (trig) { section = (trig.textContent || '').trim(); }
        }
        gtag('event', 'nav_dropdown_click', {
          nav_section: section,
          link_text: label,
          link_url: href,
        });
      });
    });
  }

  function start() {
    setupNav();
    setupGa4NavTracking();
    setupInsights();
  }

  setupGa4();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  window.OWSite = { __init: true };
})();
