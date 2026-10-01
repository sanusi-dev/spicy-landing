/* ==========================================================================
   Spicy landing page -- interactions
   Vanilla JS, no build step, no dependencies.

   Behaviours (visual parity with the original Next.js site):
     1. Sticky nav border on scroll
     2. Mobile nav menu (tablet and below)
     3. Scroll reveal (IntersectionObserver)
     4. Platform tabs
     5. Partner / waitlist modal (Netlify Forms ready)

   Config lives in CONFIG below. Everything is progressive: if JS is blocked,
   all content is still readable, tabs show the first panel, and forms submit
   natively if you give them an action attribute.
   ========================================================================== */
(function () {
  'use strict';

  var CONFIG = {
    /* Netlify form name -- must match the hidden <form name="..."> in index.html */
    waitlistFormName: 'waitlist',
    /* Where the form POSTs. Netlify intercepts POSTs to any path on the site. */
    waitlistEndpoint: '/',
    /* Local preview: show the success state instead of POSTing (no backend). */
    localPreview:
      location.protocol === 'file:' ||
      /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)
  };

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  /* ------------------------------------------------------------------------
     1. Sticky nav
     ---------------------------------------------------------------------- */
  var nav = $('.ury-nav');
  if (nav) {
    var syncNav = function () {
      var next = window.scrollY > 8 ? 'true' : 'false';
      if (nav.getAttribute('data-scrolled') !== next) nav.setAttribute('data-scrolled', next);
    };
    var navTick = false;
    syncNav();
    window.addEventListener('scroll', function () {
      if (navTick) return;
      navTick = true;
      window.requestAnimationFrame(function () { navTick = false; syncNav(); });
    }, { passive: true });
  }

  /* ------------------------------------------------------------------------
     2. Mobile nav menu (tablet and below)
     ---------------------------------------------------------------------- */
  var navToggle = $('#nav-toggle');
  var navMenu = $('#nav-menu');
  if (navToggle && navMenu) {
    var closeNavMenu = function () {
      if (navMenu.hidden) return;
      navMenu.hidden = true;
      navToggle.setAttribute('aria-expanded', 'false');
    };
    var openNavMenu = function () {
      navMenu.hidden = false;
      navToggle.setAttribute('aria-expanded', 'true');
    };

    navToggle.addEventListener('click', function () {
      navMenu.hidden ? openNavMenu() : closeNavMenu();
    });
    $$('a, button', navMenu).forEach(function (link) {
      link.addEventListener('click', closeNavMenu);
    });
    document.addEventListener('click', function (event) {
      if (navMenu.hidden) return;
      if (navToggle.contains(event.target) || navMenu.contains(event.target)) return;
      closeNavMenu();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !navMenu.hidden) {
        closeNavMenu();
        navToggle.focus();
      }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1023) closeNavMenu();
    });
  }

  /* ------------------------------------------------------------------------
     3. Scroll reveal
     ---------------------------------------------------------------------- */
  var reveals = $$('.ury-reveal');
  if (reveals.length) {
    if (!('IntersectionObserver' in window)) {
      reveals.forEach(function (el) { el.setAttribute('data-visible', 'true'); });
    } else {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.setAttribute('data-visible', 'true');
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      reveals.forEach(function (el) { observer.observe(el); });
    }
  }

  /* ------------------------------------------------------------------------
     4. Platform tabs
     ---------------------------------------------------------------------- */
  var tablist = $('.ury-tabs');
  if (tablist) {
    var tabs = $$('.ury-tab', tablist);

    var selectTab = function (index, moveFocus) {
      tabs.forEach(function (tab, i) {
        var selected = i === index;
        tab.setAttribute('aria-selected', selected ? 'true' : 'false');
        tab.tabIndex = selected ? 0 : -1;

        var panel = document.getElementById(tab.getAttribute('aria-controls'));
        if (!panel) return;
        panel.hidden = !selected;
        if (selected) {
          /* restart the entry animation */
          panel.style.animation = 'none';
          void panel.offsetWidth;
          panel.style.animation = '';
        }
      });
      if (moveFocus) tabs[index].focus();
    };

    tabs.forEach(function (tab, i) {
      tab.tabIndex = tab.getAttribute('aria-selected') === 'true' ? 0 : -1;
      tab.addEventListener('click', function () { selectTab(i); });
      tab.addEventListener('keydown', function (event) {
        var step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
        if (!step) return;
        event.preventDefault();
        selectTab((i + step + tabs.length) % tabs.length, true);
      });
    });
  }

  /* ------------------------------------------------------------------------
     5. Partner / waitlist modal
     ---------------------------------------------------------------------- */
  var waitlist = $('#waitlist-modal');
  if (waitlist) {
    var waitlistForm = $('#waitlist-form');
    var waitlistDone = $('#waitlist-done');
    var waitlistDoneEmail = $('#waitlist-done-email');
    var waitlistError = $('#waitlist-error');
    var waitlistSubmit = $('#waitlist-submit');
    var waitlistSubmitLabel = $('#waitlist-submit-label');
    var waitlistSpinner = $('#waitlist-submit-spinner');
    var lastFocused = null;
    var submitting = false;

    var FIELDS = [
      { key: 'applicantType', label: 'I am a', required: true },
      { key: 'name', label: 'Full name', required: true },
      { key: 'email', label: 'Work email', required: true, type: 'email' },
      { key: 'phone', label: 'Phone', required: true },
      { key: 'country', label: 'Country', required: true },
      { key: 'website', label: 'Website', required: false }
    ];
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    var fieldError = function (key, message) {
      var input = waitlistForm.elements[key];
      var error = $('#waitlist-' + key + '-error');
      if (!input || !error) return;
      if (message) {
        input.setAttribute('aria-invalid', 'true');
        input.setAttribute('aria-describedby', error.id);
        error.textContent = message;
        error.hidden = false;
      } else {
        input.removeAttribute('aria-invalid');
        input.removeAttribute('aria-describedby');
        error.textContent = '';
        error.hidden = true;
      }
    };

    var validate = function () {
      var firstInvalid = null;
      FIELDS.forEach(function (field) {
        var input = waitlistForm.elements[field.key];
        var value = (input && input.value || '').trim();
        var message = '';
        if (field.required && !value) message = field.label + ' is required';
        else if (field.type === 'email' && value && !EMAIL_RE.test(value)) {
          message = 'Enter a valid email address';
        }
        fieldError(field.key, message);
        if (message && !firstInvalid) firstInvalid = input;
      });
      return firstInvalid;
    };

    var setSubmitting = function (state) {
      submitting = state;
      waitlistForm.querySelectorAll('input, select, button').forEach(function (el) {
        el.disabled = state;
      });
      if (waitlistSubmitLabel) {
        waitlistSubmitLabel.textContent = state
          ? 'Submitting'
          : waitlistError && !waitlistError.hidden ? 'Try again' : 'Submit request';
      }
      if (waitlistSpinner) waitlistSpinner.hidden = !state;
    };

    var reset = function () {
      waitlistForm.reset();
      FIELDS.forEach(function (field) { fieldError(field.key, ''); });
      if (waitlistError) waitlistError.hidden = true;
      setSubmitting(false);
    };

    var openWaitlist = function () {
      lastFocused = document.activeElement;
      reset();
      if (waitlistDone) waitlistDone.hidden = true;
      var formWrap = $('#waitlist-form-wrap');
      if (formWrap) formWrap.hidden = false;
      waitlist.hidden = false;
      document.body.style.overflow = 'hidden';
      var first = waitlistForm.elements['applicantType'];
      if (first) requestAnimationFrame(function () { first.focus(); });
    };

    var closeWaitlist = function () {
      waitlist.hidden = true;
      document.body.style.overflow = '';
      if (lastFocused && typeof lastFocused.focus === 'function') {
        requestAnimationFrame(function () { lastFocused.focus(); });
      }
      lastFocused = null;
    };

    var showSuccess = function (email) {
      setSubmitting(false);
      if (waitlistDoneEmail) waitlistDoneEmail.textContent = email;
      var formWrap = $('#waitlist-form-wrap');
      if (formWrap) formWrap.hidden = true;
      if (waitlistDone) waitlistDone.hidden = false;
    };

    var collect = function () {
      var data = {};
      FIELDS.forEach(function (field) {
        var input = waitlistForm.elements[field.key];
        data[field.key] = (input && input.value ? input.value : '').trim();
      });
      return data;
    };

    var submitWaitlist = function (event) {
      event.preventDefault();
      if (submitting) return;

      var invalid = validate();
      if (invalid) { invalid.focus(); return; }

      var data = collect();
      if (waitlistError) waitlistError.hidden = true;
      setSubmitting(true);

      var finishOk = function () { showSuccess(data.email); };

      if (CONFIG.localPreview) {
        /* No backend in local preview -- show the success state. */
        window.setTimeout(function () {
          console.info('[spicy] local preview: waitlist submission not sent.');
          finishOk();
        }, 450);
        return;
      }

      var body = new URLSearchParams();
      body.set('form-name', CONFIG.waitlistFormName);
      Object.keys(data).forEach(function (key) { body.set(key, data[key]); });

      fetch(CONFIG.waitlistEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString()
      }).then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        finishOk();
      }).catch(function (error) {
        console.error('[spicy] waitlist submit failed:', error);
        if (waitlistError) waitlistError.hidden = false;
        setSubmitting(false);
      });
    };

    $$('[data-waitlist-open]').forEach(function (button) {
      button.addEventListener('click', openWaitlist);
    });
    $$('[data-waitlist-close]').forEach(function (button) {
      button.addEventListener('click', closeWaitlist);
    });
    waitlist.addEventListener('mousedown', function (event) {
      if (event.target === waitlist) closeWaitlist();
    });

    /* Escape closes; Tab is trapped inside the dialog. */
    waitlist.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeWaitlist();
        return;
      }
      if (event.key !== 'Tab') return;
      var focusable = $$('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled])', waitlist)
        .filter(function (el) { return el.offsetParent !== null; });
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    waitlistForm.addEventListener('submit', submitWaitlist);
  }

  /* ------------------------------------------------------------------------
     6. Footer year
     ---------------------------------------------------------------------- */
  $$('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
