/* OpticWise Forms — site-side companion shim
 * ===========================================================================
 * The actual form widget lives at:
 *   https://ownet.opticwise.com/forms/embed.js
 * (loaded via <script src=...> on every page).
 *
 * That official loader auto-mounts every <div data-opticwise-form="..."> on
 * the page with the live OWNet schema. So the home page PPP Starter Kit, the
 * /contact Inbound Contact form, the bottom-CTA Schedule Review embed on
 * every page, and the global footer Insights Newsletter all render straight
 * from the CRM — no local fallback, no stale field lists.
 *
 * What this small companion script does:
 *
 *   1. Catches clicks on any "Schedule X" CTA button (nav, hero, mid-page)
 *      and smooth-scrolls the user to the inline schedule-review embed at
 *      the bottom of the same page (#cta). Every page in the static mirror
 *      now has that embed, so no modal is needed.
 *
 *   2. Bails out cleanly on Cmd/Ctrl/Shift-click of <a> triggers so power
 *      users keep "open in new tab" behaviour.
 *
 * Idempotent. Zero deps. Safe under React hydration.
 * ---------------------------------------------------------------------------
 */
(function () {
  'use strict';
  if (window.__OWFormsScrollShim) { return; }
  window.__OWFormsScrollShim = true;

  // Visible-text labels (case-insensitive, whitespace-collapsed) of every
  // "talk to us" CTA across opticwise.com. Add new variants here only.
  var TRIGGER_LABELS = [
    'schedule review',
    'schedule your review',
    'schedule a complimentary review',
    'schedule a working session',
    'schedule a conversation',
    'schedule a ppp audit',
    'schedule a ppp audit\u2122',
  ];

  function normalize(s) {
    return (s || '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function isTrigger(node) {
    if (!node || node.nodeType !== 1) { return false; }
    if (!(node.tagName === 'BUTTON' || node.tagName === 'A')) { return false; }
    var t = normalize(node.textContent);
    return TRIGGER_LABELS.indexOf(t) !== -1;
  }

  function findTriggerAncestor(node) {
    while (node && node !== document.body) {
      if (isTrigger(node)) { return node; }
      node = node.parentNode;
    }
    return null;
  }

  function findTarget() {
    // Prefer the bottom CTA section (every page in the static mirror has it).
    return document.getElementById('cta')
      || document.querySelector('[data-opticwise-form="schedule-review"]')
      || document.querySelector('[data-opticwise-form]');
  }

  document.addEventListener('click', function (ev) {
    var trig = findTriggerAncestor(ev.target);
    if (!trig) { return; }
    // Don't intercept modifier-clicks on real anchors — let them open in a
    // new tab/window the way the user expects.
    if (trig.tagName === 'A' && (ev.metaKey || ev.ctrlKey || ev.shiftKey)) {
      return;
    }
    var target = findTarget();
    if (!target) { return; }
    ev.preventDefault();
    try {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (_) {
      target.scrollIntoView();
    }
    // After the scroll, focus the first input inside the embed so keyboard
    // users can start typing without hunting for the field.
    setTimeout(function () {
      var input = target.querySelector('input,textarea,select');
      if (input) { try { input.focus({ preventScroll: true }); } catch (_) {} }
    }, 600);
  }, true);
})();
