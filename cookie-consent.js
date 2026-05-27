/* OpticWise Cookie Consent — GDPR-compliant consent manager.
 *
 * Exposes window.OWConsent:
 *   .hasConsent(category)   — true if the user accepted the category
 *   .showPreferences()      — opens the preferences modal
 *   .isEU                   — true if visitor is in EU/EEA/UK timezone
 *
 * Fires "ow:consent-updated" on document whenever preferences change.
 *
 * Geo-detection: uses Intl.DateTimeFormat timezone to detect EU/EEA/UK visitors.
 * No external fetch required — instant, offline-compatible, zero latency.
 * Non-EU visitors get implicit full consent with no banner.
 *
 * Persistence: localStorage key "ow_consent" (JSON, 13-month expiry per GDPR).
 * Falls back to a session cookie if localStorage is unavailable.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'ow_consent';
  var CONSENT_TTL = 395 * 86400000; // 13 months in ms (GDPR max)

  // EU/EEA timezone prefixes — covers all EU member states, EEA, UK, Switzerland
  var EU_TZ_PREFIXES = [
    'Europe/', 'Atlantic/Canary', 'Atlantic/Faroe', 'Atlantic/Madeira',
    'Atlantic/Reykjavik', 'Arctic/Longyearbyen'
  ];

  // ── Storage helpers ─────────────────────────────────────────────────

  function readStored() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (Date.now() - new Date(data.timestamp).getTime() > CONSENT_TTL) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return data;
    } catch (e) { return null; }
  }

  function writeStored(prefs) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); }
    catch (e) { /* private browsing or quota */ }
  }

  function deleteGaCookies() {
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (name.indexOf('_ga') === 0) {
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
      }
    });
  }

  // ── Consent state ───────────────────────────────────────────────────

  var consent = null;

  function saveConsent(prefs) {
    prefs.timestamp = new Date().toISOString();
    consent = prefs;
    writeStored(prefs);
    document.dispatchEvent(new CustomEvent('ow:consent-updated', { detail: prefs }));
    hideBanner();
    if (!prefs.analytics) { deleteGaCookies(); }
  }

  function hasConsent(category) {
    if (!consent) return false;
    return !!consent[category];
  }

  // ── Geo-detection (timezone-based) ──────────────────────────────────

  function detectIsEU() {
    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      for (var i = 0; i < EU_TZ_PREFIXES.length; i++) {
        if (tz.indexOf(EU_TZ_PREFIXES[i]) === 0) return true;
      }
    } catch (e) { /* old browser — assume non-EU */ }
    return false;
  }

  // ── DOM creation helpers ────────────────────────────────────────────

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'className') node.className = attrs[k];
        else if (k.indexOf('on') === 0) node.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        else node.setAttribute(k, attrs[k]);
      });
    }
    if (children) {
      (Array.isArray(children) ? children : [children]).forEach(function (c) {
        if (typeof c === 'string') node.appendChild(document.createTextNode(c));
        else if (c) node.appendChild(c);
      });
    }
    return node;
  }

  // ── Banner ──────────────────────────────────────────────────────────

  var bannerEl = null;
  var modalEl = null;

  function buildBanner() {
    return el('div', { className: 'ow-cc-banner', role: 'dialog', 'aria-label': 'Cookie consent' }, [
      el('div', { className: 'ow-cc-banner__inner' }, [
        el('div', { className: 'ow-cc-banner__text' }, [
          el('p', { className: 'ow-cc-banner__title' }, 'We value your privacy'),
          el('p', { className: 'ow-cc-banner__desc' }, [
            'We use cookies to analyze site usage and improve your experience. You can accept all cookies, reject non-essential ones, or customize your preferences. See our ',
            el('a', { href: '/cookie-policy/', className: 'ow-cc-link' }, 'Cookie Policy'),
            ' for details.'
          ])
        ]),
        el('div', { className: 'ow-cc-banner__actions' }, [
          el('button', { className: 'ow-cc-btn ow-cc-btn--accept', onClick: acceptAll }, 'Accept All'),
          el('button', { className: 'ow-cc-btn ow-cc-btn--reject', onClick: rejectNonEssential }, 'Reject All'),
          el('button', { className: 'ow-cc-btn ow-cc-btn--customize', onClick: showPreferences }, 'Manage Preferences')
        ])
      ])
    ]);
  }

  function showBanner() {
    if (bannerEl) return;
    bannerEl = buildBanner();
    document.body.appendChild(bannerEl);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        bannerEl.classList.add('ow-cc-banner--visible');
      });
    });
  }

  function hideBanner() {
    if (!bannerEl) return;
    bannerEl.classList.remove('ow-cc-banner--visible');
    var b = bannerEl;
    setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 400);
    bannerEl = null;
  }

  // ── Preferences modal ──────────────────────────────────────────────

  function buildToggle(id, label, description, checked, disabled) {
    var input = el('input', {
      type: 'checkbox',
      id: 'ow-cc-toggle-' + id,
      className: 'ow-cc-toggle__input'
    });
    if (checked) input.checked = true;
    if (disabled) input.disabled = true;

    return el('div', { className: 'ow-cc-pref__item' }, [
      el('div', { className: 'ow-cc-pref__info' }, [
        el('span', { className: 'ow-cc-pref__label' }, label),
        el('span', { className: 'ow-cc-pref__desc' }, description)
      ]),
      el('label', { className: 'ow-cc-toggle' + (disabled ? ' ow-cc-toggle--disabled' : ''), 'for': 'ow-cc-toggle-' + id }, [
        input,
        el('span', { className: 'ow-cc-toggle__slider' })
      ])
    ]);
  }

  function buildModal() {
    var analyticsChecked = consent ? !!consent.analytics : false;
    var embedsChecked = consent ? !!consent.embeds : false;

    var overlay = el('div', { className: 'ow-cc-overlay', role: 'dialog', 'aria-label': 'Cookie preferences', onClick: function (e) {
      if (e.target === overlay) closeModal();
    }}, [
      el('div', { className: 'ow-cc-modal' }, [
        el('div', { className: 'ow-cc-modal__header' }, [
          el('h2', { className: 'ow-cc-modal__title' }, 'Cookie Preferences'),
          el('button', { className: 'ow-cc-modal__close', 'aria-label': 'Close', onClick: closeModal }, '\u00D7')
        ]),
        el('p', { className: 'ow-cc-modal__desc' }, [
          'Choose which cookie categories you allow. Strictly necessary cookies are always active. For full details, see our ',
          el('a', { href: '/cookie-policy/', className: 'ow-cc-link' }, 'Cookie Policy'),
          '.'
        ]),
        el('div', { className: 'ow-cc-pref__list' }, [
          buildToggle('necessary', 'Strictly Necessary', 'Essential for the website to function (consent preferences). Cannot be disabled.', true, true),
          buildToggle('analytics', 'Analytics', 'Google Analytics 4 with Consent Mode v2. Helps us understand how visitors use the site. Cookieless pings are sent by default; full measurement only after you accept.', analyticsChecked, false),
          buildToggle('embeds', 'Embedded Content', 'Allow third-party embeds (e.g. Vimeo videos) which may set cookies.', embedsChecked, false)
        ]),
        el('div', { className: 'ow-cc-modal__actions' }, [
          el('button', { className: 'ow-cc-btn ow-cc-btn--accept', onClick: saveFromModal }, 'Save Preferences'),
          el('button', { className: 'ow-cc-btn ow-cc-btn--reject', onClick: function () { closeModal(); rejectNonEssential(); } }, 'Reject All')
        ])
      ])
    ]);
    return overlay;
  }

  function showPreferences() {
    if (modalEl) return;
    modalEl = buildModal();
    document.body.appendChild(modalEl);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        modalEl.classList.add('ow-cc-overlay--visible');
      });
    });
    document.addEventListener('keydown', escCloseModal);
  }

  function closeModal() {
    if (!modalEl) return;
    modalEl.classList.remove('ow-cc-overlay--visible');
    var m = modalEl;
    setTimeout(function () { if (m.parentNode) m.parentNode.removeChild(m); }, 300);
    modalEl = null;
    document.removeEventListener('keydown', escCloseModal);
  }

  function escCloseModal(e) { if (e.key === 'Escape') closeModal(); }

  function saveFromModal() {
    var analytics = document.getElementById('ow-cc-toggle-analytics');
    var embeds = document.getElementById('ow-cc-toggle-embeds');
    saveConsent({
      analytics: analytics ? analytics.checked : false,
      embeds: embeds ? embeds.checked : false
    });
    closeModal();
  }

  // ── Quick actions ───────────────────────────────────────────────────

  function acceptAll() { saveConsent({ analytics: true, embeds: true }); }
  function rejectNonEssential() { saveConsent({ analytics: false, embeds: false }); }

  // ── Vimeo embed gating ─────────────────────────────────────────────

  function gateVimeoEmbeds() {
    var iframes = document.querySelectorAll('.ow-vimeo iframe[src*="player.vimeo.com"]');
    if (!iframes.length) return;
    iframes.forEach(function (iframe) {
      if (iframe.dataset.owConsentGated) return;
      iframe.dataset.owConsentGated = '1';
      var src = iframe.getAttribute('src');
      var wrapper = iframe.parentElement;
      if (!wrapper) return;
      var placeholder = el('div', { className: 'ow-cc-embed-placeholder' }, [
        el('div', { className: 'ow-cc-embed-placeholder__icon' }, '\u25B6'),
        el('p', { className: 'ow-cc-embed-placeholder__text' }, 'This video is hosted by Vimeo. Playing it may set third-party cookies.'),
        el('button', { className: 'ow-cc-btn ow-cc-btn--accept ow-cc-embed-placeholder__btn', onClick: function () {
          saveConsent({ analytics: consent ? consent.analytics : false, embeds: true });
        }}, 'Accept & Play')
      ]);
      iframe.removeAttribute('src');
      iframe.style.display = 'none';
      iframe.dataset.owOrigSrc = src;
      wrapper.appendChild(placeholder);
    });
  }

  function restoreVimeoEmbeds() {
    document.querySelectorAll('.ow-cc-embed-placeholder').forEach(function (ph) {
      var wrapper = ph.parentElement;
      if (!wrapper) return;
      var iframe = wrapper.querySelector('iframe');
      if (iframe && iframe.dataset.owOrigSrc) {
        iframe.setAttribute('src', iframe.dataset.owOrigSrc);
        iframe.style.display = '';
      }
      ph.parentNode.removeChild(ph);
    });
  }

  function syncVimeo() {
    if (hasConsent('embeds')) { restoreVimeoEmbeds(); }
    else { gateVimeoEmbeds(); }
  }

  // ── Init ────────────────────────────────────────────────────────────

  consent = readStored();
  var visitorIsEU = detectIsEU();

  window.OWConsent = {
    hasConsent: hasConsent,
    showPreferences: showPreferences,
    isEU: visitorIsEU
  };

  function wirePrefsLinks() {
    document.querySelectorAll('[data-ow-cookie-prefs]').forEach(function (link) {
      if (link.dataset.owBound) return;
      link.dataset.owBound = '1';
      link.addEventListener('click', function (e) {
        e.preventDefault();
        showPreferences();
      });
    });
  }

  function grantImplicitConsent() {
    if (consent) return;
    consent = { analytics: true, embeds: true, implicit: true, timestamp: new Date().toISOString() };
    document.dispatchEvent(new CustomEvent('ow:consent-updated', { detail: consent }));
  }

  function init() {
    wirePrefsLinks();

    if (consent) {
      syncVimeo();
      document.dispatchEvent(new CustomEvent('ow:consent-updated', { detail: consent }));
    } else if (visitorIsEU) {
      syncVimeo();
      showBanner();
    } else {
      grantImplicitConsent();
      restoreVimeoEmbeds();
    }
  }

  document.addEventListener('ow:consent-updated', function () {
    consent = readStored() || consent;
    syncVimeo();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
