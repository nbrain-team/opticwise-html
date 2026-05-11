/* OpticWise FormEmbed — schema-driven form widget
 *
 * Drives every "Schedule Review" / "Schedule Your Review" button on the site
 * (modal) and every inline form on opticwise.com (PPP Starter Kit on home,
 * Inbound Contact on /contact, Schedule Review on /ppp-audit, /about, every
 * pillar page, every insight detail page, and the Insights Newsletter in
 * the global footer).
 *
 * Source of truth lives in OWNet:
 *   GET  https://ownet.opticwise.com/api/public/forms/{slug}
 *   POST https://ownet.opticwise.com/api/public/forms/{slug}/submit
 *
 * Submission body is flat: { [fieldKey]: value, [honeypotFieldName]: "" }.
 * Schema response shape:
 *   { form: { id, slug, name, description, submitButtonLabel, successMessage,
 *             honeypotFieldName, fields: [{ fieldKey, fieldType, label,
 *             required, placeholder, helpText, options }] } }
 *
 * Triggers / mounts:
 *   - Any <button> or <a> with text exactly "Schedule Review",
 *     "Schedule Your Review", or "Schedule a Complimentary Review"
 *     (case-insensitive, trimmed) opens the modal.
 *   - Any element with data-opticwise-form="<slug>" or the legacy
 *     data-form-embed="<slug>" gets an inline mount.
 *
 *     Per-mount overrides (read off the host element):
 *       data-eyebrow         override eyebrow copy (else schema name)
 *       data-heading         override heading copy (else schema name)
 *       data-description     override description copy (else schema description)
 *       data-theme="dark"    render the inline card on a dark surface
 *       data-align="left"    left-align the embed inside its container
 *                            (default: centered, max-width 620px)
 *       data-show-header     "false" hides the embed's own eyebrow/heading/desc
 *                            (use when the surrounding section already provides
 *                            the header copy)
 *
 *   - Window-level API:
 *       window.OWFormEmbed.openModal(slug?)
 *       window.OWFormEmbed.mountInline(targetEl, slug?, opts?)
 *
 * No external deps. Idempotent. Safe under React hydration (event delegation
 * on document; inline mount uses a stable wrapper that React doesn't manage).
 */
(function () {
  'use strict';
  if (window.OWFormEmbed && window.OWFormEmbed.__init) { return; }

  var API_ORIGIN = 'https://ownet.opticwise.com';
  var DEFAULT_SLUG = 'schedule-review';
  // Any <button>/<a> whose visible text matches one of these (case-insensitive,
  // whitespace-collapsed) opens the schedule-review modal. Includes every hero
  // CTA label currently used across opticwise.com so a single widget covers
  // them all without page-specific wiring.
  var TRIGGER_LABELS = [
    'schedule review',
    'schedule your review',
    'schedule a complimentary review',
    'schedule a working session',
    'schedule a conversation',
    'schedule a ppp audit',
    'schedule a ppp audit™',
    'schedule a ppp audit\u2122',
  ];

  // Modal copy is OW-canon-aligned. The form's `name`/`description` from the
  // schema are intentionally generic ("Schedule Review" / "Standard Schedule
  // Review Form") — we override on the marketing site so the modal opens with
  // PPP Audit™ framing. Field labels still come from the schema.
  var MODAL_COPY = {
    'schedule-review': {
      eyebrow: 'PPP Audit™',
      heading: 'Schedule Your Complimentary Review',
      sub: 'One building. 45–90 minutes. No sales pitch. Clarify first.',
    },
  };

  // Schema cache keyed by slug.
  var schemaCache = {};

  // Local fallback schemas — used only if the production GET endpoint can't
  // be reached (e.g. when previewing the static export from localhost where
  // CORS is restricted to www.opticwise.com). Submissions still POST to the
  // real endpoint; if that also fails (it will, on localhost), the user gets
  // a clear error. Mirror the production schema exactly so UI previews are
  // accurate.
  var FALLBACK_SCHEMAS = {
    'schedule-review': {
      id: 'fallback',
      slug: 'schedule-review',
      name: 'Schedule Your Review',
      description: "Complimentary CRE Data & Digital Review Session.",
      submitButtonLabel: 'Request Your Review',
      successMessage: "Thanks! We've received your request. Our team will reach out within one business day to schedule your review.",
      honeypotFieldName: 'website_url_extra',
      fields: [
        { fieldKey: 'first_name',    fieldType: 'text',     label: 'First Name', required: true },
        { fieldKey: 'last_name',     fieldType: 'text',     label: 'Last Name',  required: true },
        { fieldKey: 'email',         fieldType: 'email',    label: 'Email',      required: true },
        { fieldKey: 'company',       fieldType: 'text',     label: 'Company',    required: false },
        { fieldKey: 'phone',         fieldType: 'tel',      label: 'Phone',      required: false },
        { fieldKey: 'property_type', fieldType: 'select',   label: 'Property Type', required: false, placeholder: 'Select…',
          options: [
            { label: 'Multifamily',     value: 'multifamily' },
            { label: 'Office',          value: 'office' },
            { label: 'Mixed-Use',       value: 'mixed_use' },
            { label: 'Industrial',      value: 'industrial' },
            { label: 'Retail',          value: 'retail' },
            { label: 'Hospitality',     value: 'hospitality' },
            { label: 'Student Housing', value: 'student_housing' },
            { label: 'Senior Living',   value: 'senior_living' },
            { label: 'Other',           value: 'other' },
          ] },
        { fieldKey: 'message',       fieldType: 'textarea', label: 'Tell us about your property', required: false, placeholder: 'Number of units, current challenges, what brought you here.' },
      ],
    },
    // Inbound contact form mounted on /contact via <div data-opticwise-form="inbound-contact">.
    // Field keys mirror the production OWNet schema so localhost previews
    // submit a payload with the correct keys (CORS will block the POST from
    // localhost, that's expected — preview-only).
    'inbound-contact': {
      id: 'fallback',
      slug: 'inbound-contact',
      name: 'Send a Message',
      description: 'Goes directly to the OpticWise CRM. Real person responds within one business day.',
      submitButtonLabel: 'Send Message',
      successMessage: 'Thanks for reaching out. A real member of the OpticWise team will respond within one business day.',
      honeypotFieldName: 'website_url_extra',
      fields: [
        { fieldKey: 'first_name', fieldType: 'text',     label: 'First Name', required: true },
        { fieldKey: 'last_name',  fieldType: 'text',     label: 'Last Name',  required: true },
        { fieldKey: 'email',      fieldType: 'email',    label: 'Email',      required: true },
        { fieldKey: 'company',    fieldType: 'text',     label: 'Company',    required: false },
        { fieldKey: 'phone',      fieldType: 'tel',      label: 'Phone',      required: false },
        { fieldKey: 'message',    fieldType: 'textarea', label: "What you're working on", required: true,
          placeholder: "Current challenges, portfolio details, or what you'd like to discuss…",
          helpText: 'Helpful context, not a gate. We respond personally within one business day.' },
      ],
    },
    // Lead-magnet form mounted on the home page via <div data-opticwise-form="ppp-starter-kit">.
    'ppp-starter-kit': {
      id: 'fallback',
      slug: 'ppp-starter-kit',
      name: 'PPP Starter Kit Download',
      description: 'Free download — Chapter 1 of Peak Property Performance® plus the 5C™ framework diagram and PPP Review teaser worksheet.',
      submitButtonLabel: 'Get the PPP Starter Kit',
      successMessage: 'Check your inbox! Your PPP Starter Kit is on its way.',
      honeypotFieldName: 'website_url_extra',
      fields: [
        { fieldKey: 'name',           fieldType: 'text',   label: 'Full Name',  required: true,  placeholder: 'Full Name' },
        { fieldKey: 'email',          fieldType: 'email',  label: 'Work Email', required: true,  placeholder: 'Work Email' },
        { fieldKey: 'company',        fieldType: 'text',   label: 'Company',    required: true,  placeholder: 'Company' },
        { fieldKey: 'portfolio_size', fieldType: 'select', label: 'Portfolio Size', required: false, placeholder: 'Portfolio Size (optional)',
          options: [
            { label: 'Single Property', value: 'single' },
            { label: '2–5 Properties',  value: '2_5' },
            { label: '6–20 Properties', value: '6_20' },
            { label: '20+ Properties',  value: '20_plus' },
          ] },
      ],
    },
    // Footer newsletter form mounted via <div data-opticwise-form="insights-newsletter">.
    'insights-newsletter': {
      id: 'fallback',
      slug: 'insights-newsletter',
      name: 'Insights Newsletter',
      description: 'Owner-controlled CRE insights, delivered. Subscribe to the OpticWise dispatch.',
      submitButtonLabel: 'Subscribe',
      successMessage: "You're in. Look for the next OpticWise dispatch in your inbox.",
      honeypotFieldName: 'website_url_extra',
      fields: [
        { fieldKey: 'first_name', fieldType: 'text',  label: 'First Name', required: false, placeholder: 'Your name' },
        { fieldKey: 'email',      fieldType: 'email', label: 'Email',      required: true,  placeholder: 'you@company.com' },
        { fieldKey: 'company',    fieldType: 'text',  label: 'Company',    required: false, placeholder: 'Company (optional)' },
      ],
    },
  };

  /* ── Schema fetch ────────────────────────────────────────────────────── */

  function fetchSchema(slug) {
    if (schemaCache[slug]) { return schemaCache[slug]; }
    var url = API_ORIGIN + '/api/public/forms/' + encodeURIComponent(slug);
    schemaCache[slug] = fetch(url, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      headers: { 'Accept': 'application/json' },
    }).then(function (res) {
      if (!res.ok) { throw new Error('Form schema HTTP ' + res.status); }
      return res.json();
    }).then(function (json) {
      if (!json || !json.form) { throw new Error('Form schema missing'); }
      return json.form;
    }).catch(function (err) {
      // On network/CORS failure (e.g. localhost preview), fall back to a
      // hardcoded copy of the schema so the UI still renders. The submit
      // call will still hit the real endpoint and surface its own error if
      // that fails too.
      var fb = FALLBACK_SCHEMAS[slug];
      if (fb) {
        if (window.console && window.console.info) {
          window.console.info('[OWFormEmbed] schema fetch failed, using local fallback', err);
        }
        return fb;
      }
      delete schemaCache[slug];
      throw err;
    });
    return schemaCache[slug];
  }

  /* ── DOM helpers ────────────────────────────────────────────────────── */

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (!Object.prototype.hasOwnProperty.call(attrs, k)) { continue; }
        var v = attrs[k];
        if (v == null || v === false) { continue; }
        if (k === 'class') { node.className = v; }
        else if (k === 'text') { node.textContent = v; }
        else if (k === 'html') { node.innerHTML = v; }
        else if (k.indexOf('on') === 0 && typeof v === 'function') {
          node.addEventListener(k.slice(2), v);
        } else if (v === true) {
          node.setAttribute(k, '');
        } else {
          node.setAttribute(k, String(v));
        }
      }
    }
    if (children) {
      for (var i = 0; i < children.length; i++) {
        var c = children[i];
        if (c == null) { continue; }
        node.appendChild(typeof c === 'string'
          ? document.createTextNode(c)
          : c);
      }
    }
    return node;
  }

  function htmlInputType(fieldType) {
    switch (fieldType) {
      case 'email':    return 'email';
      case 'tel':      return 'tel';
      case 'url':      return 'url';
      case 'number':   return 'number';
      case 'date':     return 'date';
      default:         return 'text';
    }
  }

  /* ── Field renderers ────────────────────────────────────────────────── */

  function renderField(field) {
    var wrap = el('div', { class: 'ow-fe-field', 'data-field-key': field.fieldKey });
    var inputId = 'ow-fe-' + field.fieldKey + '-' + Math.random().toString(36).slice(2, 8);

    var labelChildren = [field.label];
    if (field.required) {
      labelChildren.push(el('span', { class: 'ow-fe-required', 'aria-hidden': 'true', text: '*' }));
    }
    wrap.appendChild(el('label', {
      class: 'ow-fe-field__label',
      for: inputId,
    }, labelChildren));

    var control;
    var commonAttrs = {
      id: inputId,
      name: field.fieldKey,
      placeholder: field.placeholder || '',
      'aria-required': field.required ? 'true' : 'false',
      required: !!field.required,
    };

    if (field.fieldType === 'textarea') {
      control = el('textarea', Object.assign({}, commonAttrs, {
        class: 'ow-fe-textarea',
        rows: '4',
      }));
    } else if (field.fieldType === 'select') {
      var opts = [el('option', { value: '', text: field.placeholder || 'Select…' })];
      var options = field.options || [];
      for (var i = 0; i < options.length; i++) {
        var opt = options[i];
        var label = typeof opt === 'string' ? opt : (opt.label || opt.value);
        var value = typeof opt === 'string' ? opt : (opt.value != null ? opt.value : opt.label);
        opts.push(el('option', { value: value, text: label }));
      }
      control = el('select', Object.assign({}, commonAttrs, {
        class: 'ow-fe-select',
      }), opts);
    } else if (field.fieldType === 'checkbox') {
      control = el('input', Object.assign({}, commonAttrs, {
        class: 'ow-fe-input',
        type: 'checkbox',
        value: '1',
      }));
    } else {
      control = el('input', Object.assign({}, commonAttrs, {
        class: 'ow-fe-input',
        type: htmlInputType(field.fieldType),
        autocomplete: pickAutocomplete(field),
      }));
    }
    wrap.appendChild(control);

    if (field.helpText) {
      wrap.appendChild(el('p', { class: 'ow-fe-field__help', text: field.helpText }));
    }
    wrap.appendChild(el('p', {
      class: 'ow-fe-field__error',
      'aria-live': 'polite',
      'data-error-for': field.fieldKey,
    }));
    return wrap;
  }

  function pickAutocomplete(field) {
    var key = (field.fieldKey || '').toLowerCase();
    if (key === 'first_name' || key === 'firstname') { return 'given-name'; }
    if (key === 'last_name'  || key === 'lastname')  { return 'family-name'; }
    if (key === 'email')                              { return 'email'; }
    if (key === 'company')                            { return 'organization'; }
    if (key === 'phone' || key === 'tel')             { return 'tel'; }
    return 'on';
  }

  /* ── Form orchestration (used by both modal + inline) ──────────────── */

  function buildFormView(form, opts) {
    opts = opts || {};
    var defaults = MODAL_COPY[form.slug] || {
      eyebrow: form.name || 'Form',
      heading: form.name || 'Get in touch',
      sub: form.description || '',
    };
    // Per-mount overrides (data-eyebrow/data-heading/data-description) win
    // over MODAL_COPY defaults so a single embed can be re-skinned in HTML
    // without changes here. Empty string also wins (caller wanted blank).
    var copy = {
      eyebrow: opts.eyebrow != null ? opts.eyebrow : defaults.eyebrow,
      heading: opts.heading != null ? opts.heading : defaults.heading,
      sub:     opts.description != null ? opts.description : defaults.sub,
    };
    var showHeader = opts.showHeader !== false;

    // Pair first/last name fields side-by-side when both exist (visual nicety).
    var firstNameIdx = -1, lastNameIdx = -1;
    var fields = form.fields || [];
    for (var i = 0; i < fields.length; i++) {
      if (fields[i].fieldKey === 'first_name') { firstNameIdx = i; }
      if (fields[i].fieldKey === 'last_name')  { lastNameIdx = i; }
    }

    var formNode = el('form', {
      class: 'ow-fe-form',
      novalidate: true,
      'data-slug': form.slug,
    });
    var errorBox = el('p', {
      class: 'ow-fe-error',
      role: 'alert',
      hidden: true,
    });
    formNode.appendChild(errorBox);

    var rendered = new Array(fields.length);
    for (var j = 0; j < fields.length; j++) { rendered[j] = renderField(fields[j]); }

    if (firstNameIdx !== -1 && lastNameIdx !== -1
        && Math.abs(firstNameIdx - lastNameIdx) === 1) {
      var first = Math.min(firstNameIdx, lastNameIdx);
      var second = first + 1;
      var row = el('div', { class: 'ow-fe-row' }, [rendered[first], rendered[second]]);
      formNode.appendChild(row);
      for (var k = 0; k < fields.length; k++) {
        if (k === first || k === second) { continue; }
        formNode.appendChild(rendered[k]);
      }
    } else {
      for (var m = 0; m < fields.length; m++) { formNode.appendChild(rendered[m]); }
    }

    if (form.honeypotFieldName) {
      formNode.appendChild(el('input', {
        class: 'ow-fe-honeypot',
        type: 'text',
        name: form.honeypotFieldName,
        tabindex: '-1',
        autocomplete: 'off',
        'aria-hidden': 'true',
      }));
    }

    var submitLabel = form.submitButtonLabel || 'Submit';
    var submit = el('button', {
      type: 'submit',
      class: 'ow-fe-submit',
    }, [
      el('span', { class: 'ow-fe-spinner', 'aria-hidden': 'true' }),
      el('span', { class: 'ow-fe-submit-label', text: submitLabel }),
    ]);
    formNode.appendChild(el('div', { class: 'ow-fe-actions' }, [submit]));

    formNode.addEventListener('submit', function (ev) {
      ev.preventDefault();
      handleSubmit(form, formNode, errorBox, submit, opts);
    });

    var children = [];
    if (showHeader) {
      var header = el('div', { class: 'ow-fe-header' }, [
        copy.eyebrow ? el('p', { class: 'ow-fe-header__eyebrow', text: copy.eyebrow }) : null,
        copy.heading ? el('h2', { class: 'ow-fe-header__heading', text: copy.heading }) : null,
        copy.sub ? el('p', { class: 'ow-fe-header__sub', text: copy.sub }) : null,
      ]);
      children.push(header);
    }
    children.push(formNode);

    var container = el('div', { class: 'ow-fe-form-view' }, children);
    return container;
  }

  function handleSubmit(form, formNode, errorBox, submit, opts) {
    errorBox.hidden = true;
    errorBox.textContent = '';

    // Clear per-field errors.
    var errs = formNode.querySelectorAll('.ow-fe-field__error');
    for (var e = 0; e < errs.length; e++) { errs[e].textContent = ''; }
    var inputs = formNode.querySelectorAll('[aria-invalid="true"]');
    for (var ii = 0; ii < inputs.length; ii++) { inputs[ii].removeAttribute('aria-invalid'); }

    // Collect values.
    var fields = form.fields || [];
    var body = {};
    var firstInvalid = null;
    for (var i = 0; i < fields.length; i++) {
      var f = fields[i];
      var node = formNode.querySelector('[name="' + cssEscape(f.fieldKey) + '"]');
      if (!node) { continue; }
      var value;
      if (f.fieldType === 'checkbox') {
        value = node.checked ? '1' : '';
      } else {
        value = (node.value || '').trim();
      }
      body[f.fieldKey] = value;
      if (f.required && !value) {
        setFieldError(formNode, f.fieldKey, f.label + ' is required.');
        if (!firstInvalid) { firstInvalid = node; }
        continue;
      }
      if (f.fieldType === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        setFieldError(formNode, f.fieldKey, 'Enter a valid email.');
        if (!firstInvalid) { firstInvalid = node; }
      }
    }

    // Honeypot.
    if (form.honeypotFieldName) {
      var hp = formNode.querySelector('[name="' + cssEscape(form.honeypotFieldName) + '"]');
      body[form.honeypotFieldName] = hp ? (hp.value || '') : '';
    }

    if (firstInvalid) {
      try { firstInvalid.focus(); } catch (_) {}
      return;
    }

    submit.setAttribute('aria-busy', 'true');
    submit.disabled = true;

    var url = API_ORIGIN + '/api/public/forms/' + encodeURIComponent(form.slug) + '/submit';
    fetch(url, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(body),
    }).then(function (res) {
      return res.json().then(function (json) {
        return { ok: res.ok, status: res.status, body: json };
      }, function () {
        return { ok: res.ok, status: res.status, body: {} };
      });
    }).then(function (result) {
      submit.removeAttribute('aria-busy');
      submit.disabled = false;
      if (result.ok && result.body && result.body.ok !== false) {
        var msg = (result.body && result.body.message) || form.successMessage
          || "Thanks — we'll be in touch shortly.";
        showSuccess(formNode, msg, opts);
      } else {
        var serverMsg = (result.body && (result.body.error || result.body.message))
          || 'Submission failed. Please try again or email hello@opticwise.com.';
        errorBox.textContent = serverMsg;
        errorBox.hidden = false;
      }
    }).catch(function (err) {
      submit.removeAttribute('aria-busy');
      submit.disabled = false;
      errorBox.textContent =
        "We couldn't reach the form server. Please try again or email hello@opticwise.com.";
      errorBox.hidden = false;
      if (window.console && window.console.warn) { window.console.warn('FormEmbed submit failed:', err); }
    });
  }

  function setFieldError(formNode, fieldKey, message) {
    var errNode = formNode.querySelector('[data-error-for="' + cssEscape(fieldKey) + '"]');
    if (errNode) { errNode.textContent = message; }
    var input = formNode.querySelector('[name="' + cssEscape(fieldKey) + '"]');
    if (input) { input.setAttribute('aria-invalid', 'true'); }
  }

  function cssEscape(s) {
    return String(s).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  }

  function showSuccess(formNode, message, opts) {
    var view = formNode.parentNode; // .ow-fe-form-view
    var success = el('div', { class: 'ow-fe-success', role: 'status' }, [
      el('div', { class: 'ow-fe-success__icon' }, [
        el('span', {
          html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
        }),
      ]),
      el('h3', { class: 'ow-fe-success__heading', text: 'Thanks — message sent.' }),
      el('p', { class: 'ow-fe-success__msg', text: message }),
      el('button', {
        type: 'button',
        class: 'ow-fe-success__close',
        text: opts && opts.mode === 'inline' ? 'Send another' : 'Close',
        onclick: function () {
          if (opts && opts.mode === 'inline' && opts.onReset) {
            opts.onReset();
          } else if (opts && opts.onClose) {
            opts.onClose();
          }
        },
      }),
    ]);
    view.innerHTML = '';
    view.appendChild(success);
  }

  /* ── Modal ──────────────────────────────────────────────────────────── */

  var modal = null;
  var lastFocused = null;

  function ensureModal() {
    if (modal) { return modal; }
    modal = el('div', {
      class: 'ow-fe-modal',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': 'ow-fe-modal-title',
      hidden: true,
    });
    var card = el('div', { class: 'ow-fe-modal__card' });
    var close = el('button', {
      type: 'button',
      class: 'ow-fe-modal__close',
      'aria-label': 'Close',
      html: '&times;',
      onclick: closeModal,
    });
    card.appendChild(close);
    var body = el('div', { class: 'ow-fe-modal__body' });
    card.appendChild(body);
    modal.appendChild(card);

    modal.addEventListener('click', function (ev) {
      if (ev.target === modal) { closeModal(); }
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && modal && !modal.hidden) { closeModal(); }
    });

    document.body.appendChild(modal);
    return modal;
  }

  function openModal(slug) {
    slug = slug || DEFAULT_SLUG;
    var m = ensureModal();
    var body = m.querySelector('.ow-fe-modal__body');
    body.innerHTML = '';

    // Loading skeleton while schema arrives.
    var skeleton = el('div', { class: 'ow-fe-skeleton' }, [
      el('div', { class: 'ow-fe-skeleton__row' }),
      el('div', { class: 'ow-fe-skeleton__row' }),
      el('div', { class: 'ow-fe-skeleton__row' }),
      el('div', { class: 'ow-fe-skeleton__row ow-fe-skeleton__row--tall' }),
      el('div', { class: 'ow-fe-skeleton__row', style: 'width:40%;margin-left:auto' }),
    ]);
    body.appendChild(skeleton);

    lastFocused = document.activeElement;
    m.hidden = false;
    requestAnimationFrame(function () { m.setAttribute('data-open', 'true'); });
    document.documentElement.style.overflow = 'hidden';

    // Add the title node now (used by aria-labelledby).
    var titleEl = el('h2', {
      id: 'ow-fe-modal-title',
      style: 'position:absolute;width:1px;height:1px;clip:rect(0,0,0,0);overflow:hidden',
      text: 'Schedule Your Review',
    });
    body.appendChild(titleEl);

    fetchSchema(slug).then(function (form) {
      body.innerHTML = '';
      body.appendChild(titleEl);
      var view = buildFormView(form, {
        mode: 'modal',
        onClose: closeModal,
      });
      body.appendChild(view);
      var firstInput = view.querySelector('input,textarea,select');
      if (firstInput) { try { firstInput.focus(); } catch (_) {} }
    }).catch(function (err) {
      body.innerHTML = '';
      body.appendChild(titleEl);
      body.appendChild(renderSchemaError(slug, err));
    });
  }

  function closeModal() {
    if (!modal) { return; }
    modal.removeAttribute('data-open');
    setTimeout(function () {
      if (modal) { modal.hidden = true; }
      document.documentElement.style.overflow = '';
      if (lastFocused && typeof lastFocused.focus === 'function') {
        try { lastFocused.focus(); } catch (_) {}
      }
    }, 160);
  }

  function renderSchemaError(slug, err) {
    var msg = "We couldn't load the form right now. " +
              'Please email hello@opticwise.com or try again in a moment.';
    return el('div', { class: 'ow-fe-form' }, [
      el('p', { class: 'ow-fe-error', text: msg, style: 'display:block' }),
    ]);
  }

  /* ── Inline mount (used wherever a [data-opticwise-form] or legacy
   *    [data-form-embed] element appears) ─────────────────────────────── */

  function mountInline(target, slug, opts) {
    if (!target) { return; }
    if (target.dataset && target.dataset.owFeMounted === '1') { return; }
    target.dataset.owFeMounted = '1';

    slug = slug
      || target.getAttribute('data-opticwise-form')
      || target.getAttribute('data-form-embed')
      || DEFAULT_SLUG;
    target.classList.add('ow-fe-inline');

    // Surface theme/align/show-header on the host so CSS can react.
    var theme    = target.getAttribute('data-theme')       || '';
    var align    = target.getAttribute('data-align')       || '';
    var showHdr  = target.getAttribute('data-show-header');
    if (theme)   { target.setAttribute('data-theme', theme); }
    if (align)   { target.setAttribute('data-align', align); }

    var perMount = opts || {};
    if (perMount.eyebrow == null)     { perMount.eyebrow     = target.getAttribute('data-eyebrow'); }
    if (perMount.heading == null)     { perMount.heading     = target.getAttribute('data-heading'); }
    if (perMount.description == null) { perMount.description = target.getAttribute('data-description'); }
    if (perMount.showHeader == null && showHdr != null) {
      perMount.showHeader = !(String(showHdr).toLowerCase() === 'false' || showHdr === '0');
    }
    perMount.mode = 'inline';

    var skeleton = el('div', { class: 'ow-fe-skeleton' }, [
      el('div', { class: 'ow-fe-skeleton__row' }),
      el('div', { class: 'ow-fe-skeleton__row' }),
      el('div', { class: 'ow-fe-skeleton__row' }),
      el('div', { class: 'ow-fe-skeleton__row ow-fe-skeleton__row--tall' }),
      el('div', { class: 'ow-fe-skeleton__row', style: 'width:40%;margin-left:auto' }),
    ]);
    target.innerHTML = '';
    target.appendChild(skeleton);

    function render(form) {
      var renderOpts = Object.assign({}, perMount, {
        onReset: function () { mountInlineFresh(target, slug, perMount); },
      });
      var view = buildFormView(form, renderOpts);
      target.innerHTML = '';
      target.appendChild(view);
    }

    fetchSchema(slug).then(render).catch(function (err) {
      target.innerHTML = '';
      target.appendChild(renderSchemaError(slug, err));
    });
  }

  function mountInlineFresh(target, slug, opts) {
    delete target.dataset.owFeMounted;
    mountInline(target, slug, opts);
  }

  /* ── Trigger detection (event delegation) ──────────────────────────── */

  function isTrigger(node) {
    if (!node || node.nodeType !== 1) { return false; }
    if (node.dataset && node.dataset.formTrigger === 'schedule-review') { return true; }
    if (!(node.tagName === 'BUTTON' || node.tagName === 'A')) { return false; }
    var t = (node.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
    return TRIGGER_LABELS.indexOf(t) !== -1;
  }

  function findTriggerAncestor(node) {
    while (node && node !== document.body) {
      if (isTrigger(node)) { return node; }
      node = node.parentNode;
    }
    return null;
  }

  document.addEventListener('click', function (ev) {
    var trig = findTriggerAncestor(ev.target);
    if (!trig) { return; }
    // Don't intercept modifier-clicks on real anchors (e.g. cmd+click to open).
    if (trig.tagName === 'A' && (ev.metaKey || ev.ctrlKey || ev.shiftKey)) { return; }
    ev.preventDefault();
    openModal(trig.getAttribute('data-form-slug') || DEFAULT_SLUG);
  }, true);

  /* ── Auto-mount inline embeds on load + re-mount under React ──────── */

  // Picks up both the new attribute (data-opticwise-form) and the legacy
  // (data-form-embed). Idempotent under the MutationObserver below.
  function scanInlineMounts() {
    var nodes = document.querySelectorAll(
      '[data-opticwise-form], [data-form-embed]'
    );
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.dataset.owFeMounted === '1') { continue; }
      var slug = n.getAttribute('data-opticwise-form')
        || n.getAttribute('data-form-embed');
      mountInline(n, slug);
    }
  }

  function setupObserver() {
    if (!window.MutationObserver) { return; }
    var obs = new MutationObserver(function () {
      scanInlineMounts();
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  function start() {
    scanInlineMounts();
    setupObserver();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  /* ── Public API ─────────────────────────────────────────────────────── */

  window.OWFormEmbed = {
    __init: true,
    openModal: openModal,
    closeModal: closeModal,
    mountInline: mountInline,
    fetchSchema: fetchSchema,
  };
})();
