/**
 * NASR LIVE - Playlist Page
 * Browses and plays channels loaded from an M3U/M3U8/XSPF/PLS/ASX/WPL
 * playlist URL added in Settings. Supports live streams as well as
 * direct VOD files (.mp4/.mkv/.avi/.mov/.flv/.webm/.ts/.mpd/.ism/.ismv —
 * actual playback support depends on the browser's/hls.js's/dash.js's
 * codec support, see player.js).
 */
(function () {
  'use strict';

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function emptyStateHTML() {
    return '<div class="empty-state">' +
      '<div class="empty-state-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="12" y2="16"/></svg></div>' +
      '<div class="empty-state-title">لا توجد قائمة تشغيل مضافة</div>' +
      '<div class="empty-state-desc">أضف رابط M3U / M3U8 / XSPF / PLS / ASX / WPL من الإعدادات</div>' +
      '<button class="btn btn-primary" id="playlist-goto-settings" style="margin-top:16px">الذهاب إلى الإعدادات</button>' +
      '</div>';
  }

  function channelCardHTML(item) {
    return '<div class="card channel-card" data-id="' + escapeHtml(item.id) + '" data-focusable tabindex="0" role="button" aria-label="' + escapeHtml(item.name) + '" style="flex-shrink:0;">' +
      '<div style="text-align:center;padding:14px 8px;background:rgba(255,255,255,0.04);border-radius:12px;cursor:pointer;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;">' +
      '<div style="width:64px;height:64px;border-radius:50%;overflow:hidden;background:#1a1a2e;display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
      (item.logo ?
        '<img src="' + escapeHtml(item.logo) + '" alt="" style="width:100%;height:100%;object-fit:contain;padding:4px;" loading="lazy" onerror="this.style.display=\'none\'">' :
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28"><polygon points="5 3 19 12 5 21 5 3"/></svg>') +
      '</div>' +
      '<p class="card-title" style="margin:0;color:#ddd;font-size:12px;font-weight:500;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">' + escapeHtml(item.name) + '</p>' +
      '</div></div>';
  }

  function render(container) {
    var listeners = [];
    var allItems = [];
    var activeGroup = 'all';
    var searchTerm = '';

    function buildGroups() {
      var set = {};
      allItems.forEach(function (it) { if (it.group) set[it.group] = true; });
      return Object.keys(set);
    }

    function getFiltered() {
      var list = allItems;
      if (activeGroup !== 'all') list = list.filter(function (it) { return it.group === activeGroup; });
      if (searchTerm) {
        var q = searchTerm.toLowerCase();
        list = list.filter(function (it) { return (it.name || '').toLowerCase().indexOf(q) !== -1; });
      }
      return list;
    }

    function renderGrid() {
      var gridEl = container.querySelector('#playlist-grid');
      if (!gridEl) return;
      var filtered = getFiltered();
      if (!filtered.length) {
        gridEl.innerHTML = '<div class="empty-state"><div class="empty-state-title">لا توجد نتائج</div></div>';
        return;
      }
      gridEl.innerHTML = filtered.map(channelCardHTML).join('');
    }

    function renderGroups() {
      var groupsEl = container.querySelector('#playlist-groups');
      if (!groupsEl) return;
      var groups = buildGroups();
      if (!groups.length) { groupsEl.innerHTML = ''; return; }
      var html = '<button class="category-chip active" data-group="all">الكل</button>';
      groups.forEach(function (g) {
        html += '<button class="category-chip" data-group="' + escapeHtml(g) + '">' + escapeHtml(g) + '</button>';
      });
      groupsEl.innerHTML = html;
    }

    function handleClick(e) {
      var gotoSettings = e.target.closest('#playlist-goto-settings');
      if (gotoSettings) {
        window.location.hash = '#/settings';
        return;
      }
      var chip = e.target.closest('.category-chip');
      if (chip) {
        activeGroup = chip.dataset.group;
        container.querySelectorAll('.category-chip').forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        renderGrid();
        return;
      }
      var card = e.target.closest('.channel-card');
      if (card && card.dataset.id) {
        var item = allItems.find(function (it) { return it.id === card.dataset.id; });
        if (item && window.PlayerManager) {
          window.PlayerManager.play({ id: item.id, name: item.name, streamUrl: item.url, type: 'live', logo: item.logo });
        }
      }
    }

    function handleSearch(e) {
      searchTerm = e.target.value.trim();
      renderGrid();
    }

    if (!window.PlaylistConfig || !window.PlaylistConfig.hasConfig()) {
      container.innerHTML = '<div class="playlist-page" style="padding:24px 16px">' + emptyStateHTML() + '</div>';
      container.addEventListener('click', handleClick);
      listeners.push({ el: container, fn: handleClick, ev: 'click' });
      return function destroy() {
        listeners.forEach(function (l) { l.el.removeEventListener(l.ev, l.fn); });
      };
    }

    allItems = window.PlaylistConfig.getItems();
    var status = window.PlaylistConfig.getStatus();

    container.innerHTML =
      '<div class="playlist-page" style="padding:8px 16px 24px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">' +
          '<h1 style="font-size:1.25rem;font-weight:700;color:var(--text-primary);margin:0">قائمة التشغيل</h1>' +
          '<span style="color:var(--text-secondary);font-size:12px">' + status.count + ' عنصر · ' + (status.format || '').toUpperCase() + '</span>' +
        '</div>' +
        '<div class="search-bar" style="margin-bottom:12px">' +
          '<div class="search-bar-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg></div>' +
          '<input type="text" id="playlist-search" placeholder="بحث...">' +
        '</div>' +
        '<div class="category-chips" id="playlist-groups"></div>' +
        '<div id="playlist-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;margin-top:12px"></div>' +
      '</div>';

    var searchInput = container.querySelector('#playlist-search');

    renderGroups();
    renderGrid();

    container.addEventListener('click', handleClick);
    searchInput.addEventListener('input', handleSearch);
    listeners.push(
      { el: container, fn: handleClick, ev: 'click' },
      { el: searchInput, fn: handleSearch, ev: 'input' }
    );

    return function destroy() {
      listeners.forEach(function (l) { l.el.removeEventListener(l.ev, l.fn); });
    };
  }

  window.Pages = window.Pages || {};
  window.Pages.playlist = { render: render };
})();
