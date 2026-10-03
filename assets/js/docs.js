/* Shared docs behaviour.
   Loaded by the hub and by every docs page so the header and sidebar behave
   identically everywhere. Two independent concerns:

   1. The collapsed sidebar toggle used on narrow screens.
   2. The header search field, which filters the sidebar live and, on the hub,
      the cards as well. Submitting from a page with no cards hands the query
      to the hub as ?q= so the reader lands on the results. */
(function () {
  'use strict';

  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  /* --- Collapsed sidebar ------------------------------------------------ */

  var side = document.querySelector('.docs-side');
  var navToggle = document.getElementById('docs-nav-toggle');
  var setOpen = null;

  if (side && navToggle) {
    setOpen = function (open) {
      side.setAttribute('data-open', open ? 'true' : 'false');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    };

    navToggle.addEventListener('click', function () {
      setOpen(navToggle.getAttribute('aria-expanded') !== 'true');
    });

    /* Following a link navigates away, so collapse rather than leaving the
       panel open behind the new page's article. */
    $$('a', side).forEach(function (link) {
      link.addEventListener('click', function () { setOpen(false); });
    });

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      if (navToggle.getAttribute('aria-expanded') !== 'true') return;
      setOpen(false);
      navToggle.focus();
    });

    /* Leaving the breakpoint restores the desktop sidebar, so drop the
       collapsed state to keep the markup honest when the width comes back. */
    if (window.matchMedia('(min-width: 961px)').addEventListener) {
      window.matchMedia('(min-width: 961px)').addEventListener('change', function (event) {
        if (event.matches) setOpen(false);
      });
    }

    setOpen(false);
  }

  /* --- Search ----------------------------------------------------------- */

  var input = document.getElementById('docs-search');
  if (!input) return;

  var hubLink = document.querySelector('.docs-nav-title a');
  var hubHref = hubLink ? hubLink.getAttribute('href') : '../docs/';
  var sideNav = document.querySelector('.docs-nav');
  var sideItems = $$('.docs-nav li');
  var sideGroups = $$('.docs-nav-group');
  var empty = document.getElementById('docs-empty');

  /* Cards exist only on the hub. Index them by href so the sidebar and the
     cards stay in step while filtering. */
  var cards = $$('.docs-card');
  var groups = [];
  var byHref = {};
  cards.forEach(function (card) {
    var group = card.parentElement;
    if (groups.indexOf(group) === -1) groups.push(group);
    var heading = group.previousElementSibling;
    var section = heading && heading.tagName === 'H2' ? heading.textContent : '';
    byHref[card.getAttribute('href')] = {
      card: card,
      text: (section + ' ' + card.textContent).toLowerCase()
    };
  });

  /* Every page gets feedback when nothing matches. The hub already has a
     message in its article; the rest get one at the end of the sidebar. */
  if (!empty && sideNav) {
    empty = document.createElement('p');
    empty.className = 'docs-empty';
    empty.id = 'docs-empty';
    empty.textContent = 'No pages match that search.';
    empty.hidden = true;
    sideNav.appendChild(empty);
  }

  function setGroupVisible(label, list, visible) {
    label.hidden = !visible;
    list.hidden = !visible;
  }

  function apply() {
    var q = input.value.trim().toLowerCase();
    var any = false;

    sideItems.forEach(function (item) {
      var link = item.querySelector('a');
      var href = link ? link.getAttribute('href') : '';
      var entry = byHref[href];
      var hay = ((entry ? entry.text : '') + ' ' + item.textContent).toLowerCase();
      var show = !q || hay.indexOf(q) !== -1;
      item.hidden = !show;
      if (entry) entry.card.hidden = !show;
      if (show) any = true;
    });

    groups.forEach(function (group) {
      var visible = false;
      Array.prototype.forEach.call(group.children, function (card) {
        if (!card.hidden) visible = true;
      });
      group.hidden = !visible;
      var heading = group.previousElementSibling;
      if (heading && heading.tagName === 'H2') heading.hidden = !visible;
    });

    sideGroups.forEach(function (label) {
      var list = label.nextElementSibling;
      if (!list || list.tagName !== 'UL') return;
      var visible = false;
      Array.prototype.forEach.call(list.children, function (item) {
        if (!item.hidden) visible = true;
      });
      setGroupVisible(label, list, visible);
    });

    if (empty) empty.hidden = !q || any;
  }

  input.addEventListener('input', function () {
    apply();
    /* Filtered results, and the "no pages match" note, live inside the
       collapsed panel. Without opening it the reader gets no answer at all
       on a phone. */
    if (setOpen && input.value.trim()) setOpen(true);
  });
  input.addEventListener('search', apply);
  input.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape' || !input.value) return;
    input.value = '';
    apply();
  });

  if (input.form) {
    input.form.addEventListener('submit', function (event) {
      var q = input.value.trim();
      /* The hub already shows the filtered result in place. Anywhere else,
         hand the query over so the reader lands on the results. */
      event.preventDefault();
      if (!q) return;
      if (cards.length) return;
      location.href = hubHref + '?q=' + encodeURIComponent(q);
    });
  }

  var initial = new URLSearchParams(location.search).get('q');
  if (initial) {
    input.value = initial;
    /* A query arriving from the hub has nothing to show unless the panel is
       open. */
    if (setOpen) setOpen(true);
  }
  apply();
})();