(function () {
  'use strict';

  /* ---------- Theme toggle (no localStorage — sandboxed iframe safe) ---------- */
  (function initTheme() {
    var toggle = document.querySelector('[data-theme-toggle]');
    var root = document.documentElement;
    var mode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    root.setAttribute('data-theme', mode);
    updateIcon();

    toggle.addEventListener('click', function () {
      mode = mode === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', mode);
      updateIcon();
    });

    function updateIcon() {
      toggle.setAttribute('aria-label', 'Switch to ' + (mode === 'dark' ? 'light' : 'dark') + ' mode');
      toggle.innerHTML = mode === 'dark'
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    }
  })();

  /* ---------- Constants ---------- */
  var CATEGORIES = ['Daily Trainer', 'Tempo', 'Race', 'Trail'];
  var CAT_CLASS = { 'Daily Trainer': 'daily', 'Tempo': 'tempo', 'Race': 'race', 'Trail': 'trail' };

  var DROP_MIN = Math.min.apply(null, SHOES.map(function (s) { return s.drop; }));
  var DROP_MAX = Math.max.apply(null, SHOES.map(function (s) { return s.drop; }));

  // Globally lowest-drop 3 models (stable by original list order on ties)
  var lowestThreeIds = SHOES
    .map(function (s, i) { return { id: s.id, drop: s.drop, i: i }; })
    .sort(function (a, b) { return a.drop - b.drop || a.i - b.i; })
    .slice(0, 3)
    .map(function (x) { return x.id; });

  /* ---------- State ---------- */
  var state = {
    search: '',
    activeCategories: new Set(CATEGORIES),
    maxDrop: 10,
    sortKey: 'drop',
    sortDir: 'asc'
  };

  /* ---------- Elements ---------- */
  var el = {
    spotlightGrid: document.getElementById('spotlightGrid'),
    categoryChips: document.getElementById('categoryChips'),
    searchInput: document.getElementById('searchInput'),
    dropRange: document.getElementById('dropRange'),
    dropValueLabel: document.getElementById('dropValueLabel'),
    resetBtn: document.getElementById('resetBtn'),
    resultCount: document.getElementById('resultCount'),
    tableBody: document.getElementById('tableBody'),
    table: document.getElementById('shoeTable')
  };

  /* ---------- Helpers ---------- */
  function toOz(g) { return (g / 28.3495).toFixed(1); }
  function fmtStack(v) { return (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)) + ' mm'; }
  function fmtDrop(v) { return (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)) + ' mm'; }

  function catBadge(cat) {
    return '<span class="cat-badge ' + CAT_CLASS[cat] + '">' + cat + '</span>';
  }

  function thumbCell(s) {
    if (!s.thumbnail) {
      return (
        '<td class="thumb-cell">' +
          '<div class="thumb-placeholder" role="img" aria-label="No photo available for ' + s.model + '">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 16l4.5-6 3.5 4 3-3L20 16"/><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="1.4"/></svg>' +
          '</div>' +
        '</td>'
      );
    }
    var title = s.model + (s.thumbColorway ? ' — ' + s.thumbColorway + ' colorway' : '');
    return (
      '<td class="thumb-cell">' +
        '<img class="thumb-img" src="' + s.thumbnail + '" alt="' + s.model + ' product photo' + (s.thumbColorway ? ' (' + s.thumbColorway + ')' : '') + '" title="' + title + '" loading="lazy" onerror="this.closest(\'.thumb-cell\').innerHTML=\'<div class=&quot;thumb-placeholder&quot;><svg viewBox=&quot;0 0 24 24&quot; fill=&quot;none&quot; stroke=&quot;currentColor&quot; stroke-width=&quot;1.5&quot;><path d=&quot;M4 16l4.5-6 3.5 4 3-3L20 16&quot;/><rect x=&quot;3&quot; y=&quot;4&quot; width=&quot;18&quot; height=&quot;16&quot; rx=&quot;2&quot;/><circle cx=&quot;8&quot; cy=&quot;9&quot; r=&quot;1.4&quot;/></svg></div>\'" />' +
      '</td>'
    );
  }

  function dropBar(drop) {
    var pct = Math.round(((drop - DROP_MIN) / (DROP_MAX - DROP_MIN || 1)) * 100);
    pct = Math.max(8, pct); // keep a sliver visible even at the minimum
    return '<div class="drop-bar-track"><div class="drop-bar-fill" style="width:' + pct + '%"></div></div>';
  }

  /* ---------- Spotlight (top 3 lowest drop) ---------- */
  function renderSpotlight() {
    var top3 = lowestThreeIds.map(function (id) { return SHOES.find(function (s) { return s.id === id; }); });
    el.spotlightGrid.innerHTML = top3.map(function (s, idx) {
      return (
        '<div class="spot-card">' +
          '<div class="spot-top-row">' +
            '<div class="spot-rank">#' + (idx + 1) + '</div>' +
            catBadge(s.category).replace('cat-badge', 'cat-badge spot-cat') +
          '</div>' +
          '<h3>' + s.model + '</h3>' +
          '<div class="spot-drop"><span class="spot-drop-num">' + fmtDrop(s.drop).replace(' mm', '') + '</span><span class="spot-drop-unit">mm drop</span></div>' +
          '<div class="spot-specs">' +
            '<span>Heel<strong>' + fmtStack(s.heel) + '</strong></span>' +
            '<span>Forefoot<strong>' + fmtStack(s.forefoot) + '</strong></span>' +
            '<span>Weight<strong>' + s.weight + ' g</strong></span>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  /* ---------- Category chips ---------- */
  function renderChips() {
    var allActive = state.activeCategories.size === CATEGORIES.length;
    var chips = ['All'].concat(CATEGORIES);
    el.categoryChips.innerHTML = chips.map(function (c) {
      var isActive = c === 'All' ? allActive : state.activeCategories.has(c);
      return '<button type="button" class="chip" data-cat="' + c + '" data-active="' + isActive + '">' + c + '</button>';
    }).join('');

    el.categoryChips.querySelectorAll('.chip').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cat = btn.getAttribute('data-cat');
        if (cat === 'All') {
          state.activeCategories = new Set(CATEGORIES);
        } else {
          if (state.activeCategories.has(cat)) {
            state.activeCategories.delete(cat);
          } else {
            state.activeCategories.add(cat);
          }
        }
        renderChips();
        renderTable();
      });
    });
  }

  /* ---------- Filtering + sorting ---------- */
  function getFiltered() {
    var q = state.search.trim().toLowerCase();
    return SHOES.filter(function (s) {
      if (state.activeCategories.size && !state.activeCategories.has(s.category)) return false;
      if (s.drop > state.maxDrop + 0.001) return false;
      if (q && s.model.toLowerCase().indexOf(q) === -1 && s.family.toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
  }

  function getSorted(list) {
    var key = state.sortKey;
    var dir = state.sortDir === 'asc' ? 1 : -1;
    return list.slice().sort(function (a, b) {
      var av = a[key], bv = b[key];
      if (typeof av === 'string') return av.localeCompare(bv) * dir;
      return (av - bv) * dir;
    });
  }

  /* ---------- Table render ---------- */
  function renderTable() {
    var filtered = getSorted(getFiltered());

    el.resultCount.innerHTML = filtered.length
      ? 'Showing <strong>' + filtered.length + '</strong> of <strong>' + SHOES.length + '</strong> models'
      : '';

    if (!filtered.length) {
      el.tableBody.innerHTML = '';
      el.tableBody.parentElement.parentElement.insertAdjacentHTML; // no-op guard
      renderEmptyState();
      return;
    }
    removeEmptyState();

    el.tableBody.innerHTML = filtered.map(function (s) {
      var isLowest = lowestThreeIds.indexOf(s.id) !== -1;
      var rank = isLowest ? lowestThreeIds.indexOf(s.id) + 1 : null;
      return (
        '<tr data-lowest="' + isLowest + '">' +
          thumbCell(s) +
          '<td><div class="model-cell">' +
            (isLowest ? '<span class="lowest-badge" title="Lowest-drop rank #' + rank + '">' + rank + '</span>' : '') +
            '<span><span class="model-name">' + s.model + '</span><span class="model-family">' + s.family + ' family</span></span>' +
          '</div></td>' +
          '<td>' + catBadge(s.category) + '</td>' +
          '<td class="num">' + fmtStack(s.heel) + '</td>' +
          '<td class="num">' + fmtStack(s.forefoot) + '</td>' +
          '<td><div class="drop-cell"><span class="num">' + fmtDrop(s.drop) + '</span>' + dropBar(s.drop) + '</div></td>' +
          '<td class="num">' + s.weight + ' g<br/><span style="font-size:var(--text-xs);color:var(--color-text-faint);font-weight:400">' + toOz(s.weight) + ' oz</span></td>' +
          '<td class="num">$' + s.price + '</td>' +
          '<td><a class="src-link" href="' + s.source.url + '" target="_blank" rel="noopener">' + s.source.name + ' ↗</a></td>' +
        '</tr>'
      );
    }).join('');
  }

  function renderEmptyState() {
    if (document.getElementById('emptyState')) return;
    var wrap = document.createElement('div');
    wrap.id = 'emptyState';
    wrap.className = 'empty-state';
    wrap.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>' +
      '<p>No models match these filters.</p>';
    el.table.parentElement.appendChild(wrap);
    el.table.style.display = 'none';
  }
  function removeEmptyState() {
    var e = document.getElementById('emptyState');
    if (e) e.remove();
    el.table.style.display = '';
  }

  /* ---------- Sort header wiring ---------- */
  function initSortHeaders() {
    var ths = el.table.querySelectorAll('thead th[data-key]');
    function paint() {
      ths.forEach(function (th) {
        var key = th.getAttribute('data-key');
        var active = key === state.sortKey;
        th.setAttribute('data-sorted', active);
        var arrow = th.querySelector('.sort-arrow');
        arrow.textContent = active ? (state.sortDir === 'asc' ? '▲' : '▼') : '▲';
      });
    }
    ths.forEach(function (th) {
      th.addEventListener('click', function () {
        var key = th.getAttribute('data-key');
        if (state.sortKey === key) {
          state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          state.sortKey = key;
          state.sortDir = 'asc';
        }
        paint();
        renderTable();
      });
    });
    paint();
  }

  /* ---------- Search + drop range + reset ---------- */
  el.searchInput.addEventListener('input', function (e) {
    state.search = e.target.value;
    renderTable();
  });

  el.dropRange.addEventListener('input', function (e) {
    state.maxDrop = parseFloat(e.target.value);
    el.dropValueLabel.textContent = (state.maxDrop % 1 === 0 ? state.maxDrop.toFixed(0) : state.maxDrop.toFixed(1)) + ' mm';
    renderTable();
  });

  el.resetBtn.addEventListener('click', function () {
    state.search = '';
    state.activeCategories = new Set(CATEGORIES);
    state.maxDrop = 10;
    state.sortKey = 'drop';
    state.sortDir = 'asc';
    el.searchInput.value = '';
    el.dropRange.value = 10;
    el.dropValueLabel.textContent = '10 mm';
    renderChips();
    initSortHeadersRepaint();
    renderTable();
  });

  function initSortHeadersRepaint() {
    var ths = el.table.querySelectorAll('thead th[data-key]');
    ths.forEach(function (th) {
      var key = th.getAttribute('data-key');
      var active = key === state.sortKey;
      th.setAttribute('data-sorted', active);
      th.querySelector('.sort-arrow').textContent = active ? '▲' : '▲';
    });
  }

  /* ---------- Init ---------- */
  renderSpotlight();
  renderChips();
  initSortHeaders();
  renderTable();
})();
