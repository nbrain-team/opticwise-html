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
 */
(function () {
  'use strict';
  if (window.OWSite && window.OWSite.__init) { return; }

  var MOBILE_MAX = 1023; // matches Tailwind `lg:` breakpoint (1024px)

  function isMobileViewport() {
    return window.matchMedia('(max-width: ' + MOBILE_MAX + 'px)').matches;
  }

  function setupNav() {
    var nav = document.querySelector('nav');
    if (!nav) { return; }
    if (nav.dataset.owSite === '1') { return; }
    nav.dataset.owSite = '1';

    var hamburger = nav.querySelector('button[aria-label="Menu"]');
    var dropdowns = nav.querySelectorAll('.nav__dropdown');

    function close() {
      nav.classList.remove('is-open');
      dropdowns.forEach(function (dd) { dd.classList.remove('is-expanded'); });
    }

    if (hamburger) {
      hamburger.addEventListener('click', function (ev) {
        ev.stopPropagation();
        nav.classList.toggle('is-open');
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
  }

  function setupInsights() {
    var grid = document.querySelector('[data-ow-insights-grid]');
    console.log('[OW-DEBUG] setupInsights: grid =', grid);
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

  function start() {
    setupNav();
    setupInsights();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  window.OWSite = { __init: true };
})();
