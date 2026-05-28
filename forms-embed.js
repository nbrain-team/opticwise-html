/* OpticWise Forms — site-side companion shim (modal launcher)
 * ===========================================================================
 * The actual form widget lives at:
 *   https://ownet.opticwise.com/forms/embed.js
 * (loaded via <script src=...> on every page).
 *
 * That official loader auto-mounts every <div data-opticwise-form="..."> the
 * page already contains (PPP Starter Kit on the home page, Inbound Contact
 * on /contact, Insights Newsletter footer, and embedded forms elsewhere). Bottom
 * of every page only carries a Schedule Review trigger — the opener below injects a
 * single schedule-review embed into the modal the first time it opens. Schemas come
 * from the CRM — no local fallbacks, no stale field lists.
 *
 * What this small companion script does:
 *
 *   1. Catches clicks on any "Schedule X" CTA button (nav, hero, mid-page),
 *      then opens a modal containing the official
 *      <div data-opticwise-form="schedule-review"> embed and asks the
 *      official loader to mount it via window.OpticWiseForms.mount(node).
 *
 *   2. Closes the modal on backdrop click, [data-ow-modal-close] click, or
 *      the Escape key. Restores focus to the trigger element.
 *
 *   3. Bails out cleanly on Cmd/Ctrl/Shift-click of <a> triggers so power
 *      users keep "open in new tab" behaviour.
 *
 * Idempotent. Zero deps. Safe under React hydration. The modal markup and
 * its scoped CSS are only injected the first time it's needed.
 * ---------------------------------------------------------------------------
 */
(function () {
  'use strict';
  if (window.__OWFormsModalShim) { return; }
  window.__OWFormsModalShim = true;

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

  var MODAL_ID = 'ow-schedule-modal';
  var STYLE_ID = 'ow-schedule-modal-styles';

  function normalize(s) {
    return (s || '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function isTrigger(node) {
    if (!node || node.nodeType !== 1) { return false; }
    if (!(node.tagName === 'BUTTON' || node.tagName === 'A')) { return false; }
    // Don't treat the modal's own close button or anything inside the modal
    // as a re-open trigger.
    if (node.closest && node.closest('#' + MODAL_ID)) { return false; }
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

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) { return; }
    var css =
      '#' + MODAL_ID + '{position:fixed;inset:0;z-index:9999;display:none;' +
        'align-items:flex-start;justify-content:center;padding:32px 16px;' +
        'overflow-y:auto;-webkit-overflow-scrolling:touch;}' +
      '#' + MODAL_ID + '.is-open{display:flex;}' +
      '#' + MODAL_ID + ' .ow-schedule-modal__backdrop{position:fixed;inset:0;' +
        'background:rgba(10,22,40,.72);}' +
      '#' + MODAL_ID + ' .ow-schedule-modal__panel{position:relative;background:#fff;' +
        'border-radius:16px;box-shadow:0 30px 60px rgba(0,0,0,.4);max-width:640px;' +
        'width:100%;padding:32px 28px 28px;margin:auto;}' +
      '#' + MODAL_ID + ' .ow-schedule-modal__close{position:absolute;top:10px;right:10px;' +
        'background:transparent;border:0;width:38px;height:38px;border-radius:19px;' +
        'font-size:26px;line-height:1;color:#6b7280;cursor:pointer;display:flex;' +
        'align-items:center;justify-content:center;padding:0;}' +
      '#' + MODAL_ID + ' .ow-schedule-modal__close:hover{background:#f3f4f6;color:#1f2937;}' +
      '#' + MODAL_ID + ' .ow-schedule-modal__close:focus-visible{outline:2px solid #2B6CB0;' +
        'outline-offset:2px;}' +
      // Tighten the embed when it lives inside the modal panel — the panel
      // already supplies padding and a max-width, so the embed shouldn't add
      // a second layer of either.
      '#' + MODAL_ID + ' .ow-form-embed{padding:0;max-width:none;margin:0;}' +
      'body.ow-schedule-modal-open{overflow:hidden;}';
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }

  var modalEl = null;
  var formEl = null;
  var formMounted = false;
  var lastFocus = null;
  var mountAttempts = 0;
  var releaseTrap = null;

  function buildModal() {
    if (modalEl) { return; }
    injectStyles();

    modalEl = document.createElement('div');
    modalEl.id = MODAL_ID;
    modalEl.setAttribute('role', 'dialog');
    modalEl.setAttribute('aria-modal', 'true');
    modalEl.setAttribute('aria-label', 'Schedule a Complimentary Review');

    var backdrop = document.createElement('div');
    backdrop.className = 'ow-schedule-modal__backdrop';
    backdrop.setAttribute('data-ow-modal-close', '');

    var panel = document.createElement('div');
    panel.className = 'ow-schedule-modal__panel';

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'ow-schedule-modal__close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.setAttribute('data-ow-modal-close', '');
    closeBtn.innerHTML = '&times;';

    // The embed div — exactly the markup the official loader expects. We
    // intentionally don't pass data-show-header="false" here because the
    // modal is a standalone surface and benefits from the form's own
    // heading/eyebrow/description rendered by the loader from the live CRM
    // schema.
    formEl = document.createElement('div');
    formEl.setAttribute('data-opticwise-form', 'schedule-review');

    panel.appendChild(closeBtn);
    panel.appendChild(formEl);
    modalEl.appendChild(backdrop);
    modalEl.appendChild(panel);
    document.body.appendChild(modalEl);
  }

  function mountFormIfNeeded() {
    if (formMounted) { return; }
    var api = window.OpticWiseForms;
    if (api && typeof api.mount === 'function') {
      try {
        api.mount(formEl);
        formMounted = true;
        return;
      } catch (_) {
        /* fall through and retry */
      }
    }
    // Loader hasn't finished evaluating yet (script src is `defer` and
    // network may still be in flight). Poll a few times before giving up
    // so the user sees a form, not an empty modal panel.
    if (mountAttempts < 50) {
      mountAttempts++;
      setTimeout(mountFormIfNeeded, 100);
    }
  }

  function openModal(triggerEl) {
    buildModal();
    mountFormIfNeeded();
    lastFocus = triggerEl || document.activeElement;
    modalEl.classList.add('is-open');
    document.body.classList.add('ow-schedule-modal-open');
    // Defer focus until after layout so iOS Safari doesn't fight us.
    setTimeout(function () {
      var firstField = formEl.querySelector('input,textarea,select');
      if (firstField) {
        try { firstField.focus({ preventScroll: true }); } catch (_) {}
      } else {
        // Form not mounted yet — focus the close button so keyboard users
        // can still escape the modal.
        var closeBtn = modalEl.querySelector('.ow-schedule-modal__close');
        if (closeBtn) { try { closeBtn.focus({ preventScroll: true }); } catch (_) {} }
      }
    }, 80);
  }

  function closeModal() {
    if (!modalEl) { return; }
    modalEl.classList.remove('is-open');
    document.body.classList.remove('ow-schedule-modal-open');
    if (lastFocus && typeof lastFocus.focus === 'function') {
      try { lastFocus.focus({ preventScroll: true }); } catch (_) {}
    }
  }

  document.addEventListener('click', function (ev) {
    // Modal close interactions take priority — backdrop and × both carry
    // the data-ow-modal-close marker.
    var closeNode = ev.target.closest && ev.target.closest('[data-ow-modal-close]');
    if (closeNode) {
      ev.preventDefault();
      closeModal();
      return;
    }
    var trig = findTriggerAncestor(ev.target);
    if (!trig) { return; }
    // Don't intercept modifier-clicks on real anchors — let them open in a
    // new tab/window the way the user expects.
    if (trig.tagName === 'A' && (ev.metaKey || ev.ctrlKey || ev.shiftKey)) {
      return;
    }
    ev.preventDefault();
    openModal(trig);
  }, true);

  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && modalEl && modalEl.classList.contains('is-open')) {
      closeModal();
    }
  });
})();
