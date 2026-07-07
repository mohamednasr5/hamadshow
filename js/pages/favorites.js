/**
 * NASR LIVE - Favorites Page
 * Tabbed favorites view (All/Live/Movies/Series) with remove and remove-all.
 */
(function () {
  'use strict';

  var TABS = [
    { key: 'all', labelKey: 'favorites.title' },
    { key: 'live', labelKey: 'favorites.channels' },
    { key: 'movie', labelKey: 'favorites.movies' },
    { key: 'series', labelKey: 'favorites.series' }
  ];

  function getAPI() {
    return window.XtreamAPI || (window.AuthService && window.AuthService.getXtreamClient());
  }

  function cardHTML(item) {
    var type = item.type || 'movie';
    var logo = item.logo || item.stream_icon || item.cover || '';
    var title = item.name || '';
    var id = item.id || item.stream_id || item.series_id || '';

    if (type === 'live') {
      return '<div class="channel-card" data-type="live" data-id="' + id + '" style="position:relative">' +
        '<div class="channel-card-inner">' +
          '<div class="channel-card-logo">' + (logo ? '<img src="' + logo + '" alt="' + title + '" loading="lazy">' : '') + '</div>' +
          '<div class="channel-card-info">' +
            '<div class="channel-card-name">' + title + '</div>' +
            '<div class="channel-card-category">Live TV</div>' +
          '</div>' +
        '</div>' +
        '<button class="fav-remove-btn" data-rem-id="' + id + '" data-rem-type="live" style="position:absolute;top:8px;right:8px;width:28px;height:28px;border-radius:var(--radius-full);background:var(--bg-surface);border:none;color:var(--danger);cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:2">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
        '</button>' +
      '</div>';
    }

    var badges = '';
    if (item.year) badges += '<span class="content-card-badge">' + item.year + '</span>';
    return '<div class="content-card" data-type="' + type + '" data-id="' + id + '">' +
      '<div class="content-card-poster">' +
        (logo ? '<img src="' + logo + '" alt="' + title + '" loading="lazy">' : '') +
        badges +
        '<div class="content-card-overlay"></div>' +
        '<div class="content-card-info"><div class="content-card-title">' + title + '</div></div>' +
      '</div>' +
      '<button class="fav-remove-btn content-card-favorite active" data-rem-id="' + id + '" data-rem-type="' + type + '" style="top:8px;left:8px;right:auto">' +
        '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
      '</button>' +
    '</div>';
  }

  function render(container) {
    var listeners = [];
    var activeTab = 'all';
    var allFavorites = [];

    container.innerHTML =
      '<div class="favorites-page" style="padding:8px 16px 24px">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">' +
          '<h1 style="font-size:1.25rem;font-weight:700;color:var(--text-primary)">' +
            (window.i18n ? window.i18n.t('favorites.title') : 'Favorites') +
          '</h1>' +
          '<button class="btn btn-ghost btn-sm" id="fav-remove-all" style="color:var(--danger)">' +
            (window.i18n ? window.i18n.t('favorites.removeAll') : 'Remove All') +
          '</button>' +
        '</div>' +
        '<div class="tabs" id="fav-tabs">' +
          TABS.map(function (t) {
            return '<div class="tab-item' + (t.key === activeTab ? ' active' : '') + '" data-tab="' + t.key + '" data-i18n="' + t.labelKey + '">' +
              (window.i18n ? window.i18n.t(t.labelKey) : t.key.charAt(0).toUpperCase() + t.key.slice(1)) +
            '</div>';
          }).join('') +
        '</div>' +
        '<div id="fav-loading" style="padding:20px;text-align:center"><div class="skeleton-text w-50"></div></div>' +
        '<div id="fav-grid" style="display:none"></div>' +
        '<div id="fav-empty" style="display:none" class="empty-state">' +
          '<div class="empty-state-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div>' +
          '<div class="empty-state-title">' + (window.i18n ? window.i18n.t('favorites.noFavorites') : 'No items in favorites') + '</div>' +
        '</div>' +
        '<div id="fav-confirm-modal" class="modal-overlay">' +
          '<div class="modal-panel">' +
            '<div class="modal-title">' + (window.i18n ? window.i18n.t('favorites.confirmRemoveAll') : 'Remove all favorites?') + '</div>' +
            '<div class="modal-actions">' +
              '<button class="btn btn-secondary" id="fav-confirm-cancel">' + (window.i18n ? window.i18n.t('common.cancel') : 'Cancel') + '</button>' +
              '<button class="btn btn-danger" id="fav-confirm-ok">' + (window.i18n ? window.i18n.t('common.confirm') : 'Confirm') + '</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    var tabsEl = container.querySelector('#fav-tabs');
    var gridEl = container.querySelector('#fav-grid');
    var emptyEl = container.querySelector('#fav-empty');
    var loadingEl = container.querySelector('#fav-loading');
    var confirmModal = container.querySelector('#fav-confirm-modal');

    function renderFavorites() {
      var filtered = allFavorites;
      if (activeTab !== 'all') {
        filtered = allFavorites.filter(function (f) { return f.type === activeTab; });
      }

      loadingEl.style.display = 'none';

      if (filtered.length === 0) {
        gridEl.style.display = 'none';
        emptyEl.style.display = 'flex';
        return;
      }

      gridEl.style.display = 'grid';
      emptyEl.style.display = 'none';

      var hasLive = filtered.some(function (f) { return f.type === 'live'; });
      if (hasLive && filtered.length <= 20) {
        gridEl.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
        gridEl.style.gap = '10px';
        gridEl.innerHTML = filtered.map(cardHTML).join('');
      } else {
        gridEl.style.gridTemplateColumns = 'repeat(auto-fill, minmax(140px, 1fr))';
        gridEl.style.gap = '12px';
        gridEl.innerHTML = filtered.map(cardHTML).join('');
      }
    }

    function handleTabClick(e) {
      var tab = e.target.closest('.tab-item');
      if (!tab) return;
      activeTab = tab.dataset.tab;
      tabsEl.querySelectorAll('.tab-item').forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      renderFavorites();
    }

    function handleGridClick(e) {
      var removeBtn = e.target.closest('.fav-remove-btn');
      if (removeBtn) {
        e.stopPropagation();
        var remId = removeBtn.dataset.remId;
        var remType = removeBtn.dataset.remType;
        if (window.AppDB) {
          window.AppDB.removeFavorite(remId, remType).then(function () {
            allFavorites = allFavorites.filter(function (f) { return !(String(f.id) === String(remId) && f.type === remType); });
            var card = removeBtn.closest('.content-card, .channel-card');
            if (card) card.remove();
            if (allFavorites.length === 0) renderFavorites();
          });
        }
        return;
      }

      var card = e.target.closest('.content-card, .channel-card');
      if (!card) return;
      var type = card.dataset.type;
      var id = card.dataset.id;
      var api = getAPI();

      if (type === 'live' && api && window.PlayerManager) {
        var streamUrl = api.getStreamUrl(id, 'live');
        window.PlayerManager.play({ id: id, name: card.querySelector('.channel-card-name, .content-card-title').textContent, streamUrl: streamUrl, type: 'live' });
      } else if (type === 'movie' && api && window.PlayerManager) {
        var url = api.getStreamUrl(id, 'movie');
        var item = allFavorites.find(function (f) { return String(f.id) === String(id) && f.type === 'movie'; });
        window.PlayerManager.play({ id: id, name: (item && item.name) || '', logo: (item && item.logo) || '', streamUrl: url, type: 'movie' });
      } else if (type === 'series') {
        if (window.AppRouter) window.AppRouter.navigate('series', { action: 'detail', id: id });
      }
    }

    function showConfirm() {
      if (allFavorites.length === 0) return;
      confirmModal.classList.add('active');
    }

    function hideConfirm() {
      confirmModal.classList.remove('active');
    }

    function confirmRemoveAll() {
      hideConfirm();
      if (!window.AppDB) return;
      var promises = allFavorites.map(function (f) {
        return window.AppDB.removeFavorite(f.id, f.type).catch(function () {});
      });
      Promise.all(promises).then(function () {
        allFavorites = [];
        renderFavorites();
      });
    }

    tabsEl.addEventListener('click', handleTabClick);
    gridEl.addEventListener('click', handleGridClick);
    container.querySelector('#fav-remove-all').addEventListener('click', showConfirm);
    container.querySelector('#fav-confirm-cancel').addEventListener('click', hideConfirm);
    container.querySelector('#fav-confirm-ok').addEventListener('click', confirmRemoveAll);
    confirmModal.addEventListener('click', function (e) { if (e.target === confirmModal) hideConfirm(); });
    listeners.push(
      { el: tabsEl, fn: handleTabClick, ev: 'click' },
      { el: gridEl, fn: handleGridClick, ev: 'click' },
      { el: container.querySelector('#fav-remove-all'), fn: showConfirm, ev: 'click' },
      { el: container.querySelector('#fav-confirm-cancel'), fn: hideConfirm, ev: 'click' },
      { el: container.querySelector('#fav-confirm-ok'), fn: confirmRemoveAll, ev: 'click' },
      { el: confirmModal, fn: null, ev: 'click' }
    );

    if (window.i18n && window.i18n.isReady()) window.i18n._applyTranslations();

    if (window.AppDB) {
      window.AppDB.getFavorites().then(function (favs) {
        allFavorites = favs || [];
        renderFavorites();
      }).catch(function () {
        loadingEl.style.display = 'none';
      });
    }

    return function destroy() {
      listeners.forEach(function (l) { if (l.fn) l.el.removeEventListener(l.ev, l.fn); });
    };
  }

  window.Pages = window.Pages || {};
  window.Pages.favorites = { render: render };
})();