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

  function start() {
    setupNav();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  window.OWSite = { __init: true };
})();
