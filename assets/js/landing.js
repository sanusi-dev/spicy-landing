/* Spicy landing page, v2. Nav, reveals, station tabs, partner form. */
(function () {
  'use strict';

  var CONFIG = {
    waitlistFormName: 'waitlist',
    waitlistEndpoint: '/',
    localPreview:
      location.protocol === 'file:' ||
      /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)
  };

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  var root = document.documentElement;
  var themeBtn = $('#theme-toggle');
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  var applyTheme = function (theme) {
    var dark = theme === 'dark';
    root.setAttribute('data-theme', dark ? 'dark' : 'light');
    if (themeBtn) {
      themeBtn.setAttribute('aria-pressed', dark ? 'true' : 'false');
      themeBtn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    }
    if (themeMeta) themeMeta.setAttribute('content', dark ? '#1a2420' : '#f3f6f3');
  };
  applyTheme(root.getAttribute('data-theme') || 'light');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('spicy-theme', next); } catch (e) {}
      applyTheme(next);
    });
  }

  var nav = $('.site-nav');
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

  var navToggle = $('#nav-toggle');
  var navMenu = $('#nav-menu');
  if (navToggle && navMenu) {
    var closeNavMenu = function () {
      if (navMenu.hidden) return;
      navMenu.hidden = true;
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Open menu');
    };
    var openNavMenu = function () {
      navMenu.hidden = false;
      navToggle.setAttribute('aria-expanded', 'true');
      navToggle.setAttribute('aria-label', 'Close menu');
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
      if (window.innerWidth > 960) closeNavMenu();
    });
  }

  var reveals = $$('.reveal');
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

  var tablist = $('.stations');
  if (tablist) {
    var tabs = $$('.station', tablist);
    var selectTab = function (index, moveFocus) {
      tabs.forEach(function (tab, i) {
        var selected = i === index;
        tab.setAttribute('aria-selected', selected ? 'true' : 'false');
        tab.tabIndex = selected ? 0 : -1;
        var panel = document.getElementById(tab.getAttribute('aria-controls'));
        if (!panel) return;
        panel.hidden = !selected;
        if (selected) {
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
        var step = 0;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') step = 1;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') step = -1;
        if (event.key === 'Home') { event.preventDefault(); selectTab(0, true); return; }
        if (event.key === 'End') { event.preventDefault(); selectTab(tabs.length - 1, true); return; }
        if (!step) return;
        event.preventDefault();
        selectTab((i + step + tabs.length) % tabs.length, true);
      });
    });
  }

  var waitlist = $('#waitlist-modal');
  if (waitlist) {
    var waitlistForm = $('#waitlist-form');
    var waitlistDone = $('#waitlist-done');
    var waitlistDoneEmail = $('#waitlist-done-email');
    var waitlistError = $('#waitlist-error');
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
      var first = waitlistForm.elements.applicantType;
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

  $$('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
