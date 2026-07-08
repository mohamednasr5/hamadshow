/**
 * NASR LIVE - Live TV Page
 * Netflix-style layout: each category ("folder") is shown as its own titled
 * row of channel cards with a "See All" link. Selecting "See All" (or
 * searching / sorting) switches to a full channel list for that scope,
 * with EPG, favorites, and a back button to return to the category rows.
 */
(function () {
  'use strict';

  function getAPI() {
    return (window.ServerConfig && window.ServerConfig.getXtreamClient()) || null;
  }

  var _destroyed = false;
  var _epgCache = {};
  var _favCache = {};
  var _playingId = null;

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function channelCardHTML(ch, isPlaying, isFav) {
    var logo = ch.stream_icon || '';
    var name = ch.name || '';
    var cat = ch.category_name || '';
    var num = ch.num || '';
    var favClass = isFav ? ' active' : '';
    return '<div class="channel-card" data-id="' + ch.stream_id + '">' +
      '<div class="channel-card-inner">' +
        '<div class="channel-card-logo">' + (logo ? '<img src="' + esc(logo) + '" alt="' + esc(name) + '" loading="lazy" onerror="window._cardImgError(this)">' : '<span class="card-img-fallback" style="color:#555;font-size:20px;font-weight:700;display:flex;align-items:center;justify-content:center;width:100%;height:100%;">' + esc(name.charAt(0).toUpperCase()) + '</span>') + '</div>' +
        '<div class="channel-card-info">' +
          '<div class="channel-card-name">' + (num ? '<span style="color:var(--text-muted);margin-right:4px">' + esc(num) + '</span>' : '') + esc(name) + '</div>' +
          '<div class="channel-card-category">' + esc(cat) + '</div>' +
          '<div class="channel-card-now" data-epg-id="' + ch.stream_id + '"></div>' +
        '</div>' +
        (isPlaying ? '<div class="channel-card-live"></div>' : '') +
        '<button class="channel-card-fav-btn content-card-favorite' + favClass + '" data-fav-id="' + ch.stream_id + '" data-fav-type="live">' +
          '<svg viewBox="0 0 24 24" fill="' + (isFav ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
        '</button>' +
      '</div></div>';
  }

  function channelCardRowHTML(ch, isPlaying, isFav) {
    return '<div style="width:270px;flex-shrink:0;scroll-snap-align:start">' + channelCardHTML(ch, isPlaying, isFav) + '</div>';
  }

  function skeletonChannels(count) {
    var s = '';
    for (var i = 0; i < count; i++) s += '<div class="skeleton-channel"></div>';
    return s;
  }

  function skeletonRow() {
    return '<div class="content-row skeleton-row">' +
      '<div class="content-row-header"><div class="skeleton-row-header"></div></div>' +
      '<div class="content-row-scroll">' +
        '<div class="skeleton-channel" style="width:270px;flex-shrink:0"></div>' +
        '<div class="skeleton-channel" style="width:270px;flex-shrink:0"></div>' +
        '<div class="skeleton-channel" style="width:270px;flex-shrink:0"></div>' +
      '</div></div>';
  }

  function loadEPGForVisible(api, scopeEl) {
    var cards = scopeEl.querySelectorAll('.channel-card[data-id]');
    var rect = scopeEl.getBoundingClientRect();
    cards.forEach(function (card) {
      var id = card.dataset.id;
      if (_epgCache[id] || _destroyed) return;
      var cardRect = card.getBoundingClientRect();
      if (cardRect.bottom < rect.top - 100 || cardRect.top > rect.bottom + 100) return;
      _epgCache[id] = true;
      api.getEPG(id, 1).then(function (epg) {
        if (_destroyed) return;
        var el = scopeEl.querySelector('[data-epg-id="' + id + '"]');
        if (el && epg && epg.length > 0) {
          var now = epg[0];
          var title = now.title || now.name || '';
          var start = now.start || '';
          el.textContent = (start ? start + ' - ' : '') + title;
        }
      }).catch(function () {});
    });
  }

  function render(container) {
    _destroyed = false;
    _epgCache = {};
    var api = getAPI();
    var listeners = [];
    var allChannels = [];
    var categories = [];
    var viewMode = 'rows'; // 'rows' | 'list'
    var activeCat = 'all';
    var activeCatName = '';
    var searchTerm = '';
    var sortBy = 'name';
    var scrollDebounce = null;

    var seeAllLabel = window.i18n ? window.i18n.t('home.seeAll') : 'See All';
    var backLabel = window.i18n ? window.i18n.t('common.back') : 'Back';
    var allLabel = window.i18n ? window.i18n.t('live.allChannels') : 'All';

    container.innerHTML =
      '<div class="live-page" style="padding:8px 16px 24px">' +
        '<div class="search-bar" style="margin-bottom:12px">' +
          '<div class="search-bar-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg></div>' +
          '<input type="text" id="live-search" data-i18n-placeholder="live.searchPlaceholder" placeholder="Search for a channel...">' +
        '</div>' +
        '<div id="live-back-bar" style="display:none;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap">' +
          '<button class="btn btn-ghost btn-sm" id="live-back-btn">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="transform:scaleX(-1)"><polyline points="9 18 15 12 9 6"/></svg> ' + backLabel +
          '</button>' +
          '<h2 id="live-cat-title" style="font-size:1.1rem;font-weight:700;color:var(--text-primary);flex:1">' + '</h2>' +
          '<select id="live-sort" style="height:36px;padding:0 12px;background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text-primary);font-size:0.8125rem">' +
            '<option value="name">' + (window.i18n ? window.i18n.t('live.sortName') : 'Name') + '</option>' +
            '<option value="number">' + (window.i18n ? window.i18n.t('live.sortNumber') : 'Number') + '</option>' +
          '</select>' +
        '</div>' +
        '<div id="live-rows"><div id="live-rows-skeletons">' + skeletonRow() + skeletonRow() + skeletonRow() + '</div></div>' +
        '<div id="live-list-wrap" style="display:none">' +
          '<div id="live-channels" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px">' +
            skeletonChannels(12) +
          '</div>' +
          '<div id="live-empty" style="display:none" class="empty-state">' +
            '<div class="empty-state-title">' + (window.i18n ? window.i18n.t('live.noChannels') : 'No channels') + '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    var rowsEl = container.querySelector('#live-rows');
    var listWrapEl = container.querySelector('#live-list-wrap');
    var channelsEl = container.querySelector('#live-channels');
    var emptyEl = container.querySelector('#live-empty');
    var searchInput = container.querySelector('#live-search');
    var sortSelect = container.querySelector('#live-sort');
    var backBar = container.querySelector('#live-back-bar');
    var backBtn = container.querySelector('#live-back-btn');
    var catTitleEl = container.querySelector('#live-cat-title');

    function getFilteredChannels() {
      var list = allChannels;
      if (activeCat !== 'all') {
        var catId = String(activeCat);
        list = list.filter(function (c) { return String(c.category_id) === catId; });
      }
      if (searchTerm) {
        var q = searchTerm.toLowerCase();
        list = list.filter(function (c) { return (c.name || '').toLowerCase().indexOf(q) !== -1; });
      }
      if (sortBy === 'number') {
        list = list.slice().sort(function (a, b) { return (parseInt(a.num) || 0) - (parseInt(b.num) || 0); });
      } else {
        list = list.slice().sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); });
      }
      return list;
    }

    function renderChannelList() {
      var filtered = getFilteredChannels();
      if (filtered.length === 0) {
        channelsEl.style.display = 'none';
        emptyEl.style.display = 'flex';
        return;
      }
      channelsEl.style.display = 'grid';
      emptyEl.style.display = 'none';

      var html = filtered.map(function (ch) {
        var isPlaying = String(ch.stream_id) === String(_playingId);
        var isFav = !!_favCache[ch.stream_id];
        return channelCardHTML(ch, isPlaying, isFav);
      }).join('');
      channelsEl.innerHTML = html;
      _epgCache = {};
      loadEPGForVisible(api, channelsEl);
    }

    function categoryRowHTML(cat, items) {
      var ROW_SIZE = 10;
      var shown = items.slice(0, ROW_SIZE);
      var cards = shown.map(function (ch) {
        var isPlaying = String(ch.stream_id) === String(_playingId);
        var isFav = !!_favCache[ch.stream_id];
        return channelCardRowHTML(ch, isPlaying, isFav);
      }).join('');
      return '<div class="content-row">' +
        '<div class="content-row-header">' +
          '<h2 class="content-row-title">' + esc(cat.category_name) + '</h2>' +
          '<span class="content-row-more" data-cat="' + esc(cat.category_id) + '" data-catname="' + esc(cat.category_name) + '">' +
            seeAllLabel +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>' +
          '</span>' +
        '</div>' +
        '<div class="content-row-scroll">' + cards + '</div></div>';
    }

    function renderRows() {
      var html = '';
      categories.forEach(function (cat) {
        var items = allChannels.filter(function (c) { return String(c.category_id) === String(cat.category_id); });
        if (items.length === 0) return;
        html += categoryRowHTML(cat, items);
      });
      if (!html) {
        html = '<div class="empty-state"><div class="empty-state-title">' + (window.i18n ? window.i18n.t('live.noChannels') : 'No channels') + '</div></div>';
      }
      rowsEl.innerHTML = html;
      _epgCache = {};
      loadEPGForVisible(api, rowsEl);
    }

    function showRowsView() {
      viewMode = 'rows';
      activeCat = 'all';
      activeCatName = '';
      searchTerm = '';
      searchInput.value = '';
      backBar.style.display = 'none';
      listWrapEl.style.display = 'none';
      rowsEl.style.display = 'block';
    }

    function showListView(catId, catName) {
      viewMode = 'list';
      activeCat = catId || 'all';
      activeCatName = catName || (activeCat === 'all' ? allLabel : '');
      rowsEl.style.display = 'none';
      listWrapEl.style.display = 'block';
      backBar.style.display = 'flex';
      catTitleEl.textContent = searchTerm ? '' : activeCatName;
      renderChannelList();
    }

    function handleClick(e) {
      var favBtn = e.target.closest('.channel-card-fav-btn');
      if (favBtn) {
        e.stopPropagation();
        var favId = favBtn.dataset.favId;
        var isNowFav = favBtn.classList.contains('active');
        if (isNowFav && window.AppDB) {
          window.AppDB.removeFavorite(favId, 'live').then(function () {
            delete _favCache[favId];
            container.querySelectorAll('.channel-card-fav-btn[data-fav-id="' + favId + '"]').forEach(function (btn) {
              btn.classList.remove('active');
              btn.querySelector('svg').setAttribute('fill', 'none');
            });
          });
        } else if (window.AppDB) {
          var ch = allChannels.find(function (c) { return String(c.stream_id) === String(favId); });
          if (ch) {
            window.AppDB.addFavorite({ id: favId, type: 'live', name: ch.name, logo: ch.stream_icon, stream_id: ch.stream_id });
            _favCache[favId] = true;
            container.querySelectorAll('.channel-card-fav-btn[data-fav-id="' + favId + '"]').forEach(function (btn) {
              btn.classList.add('active');
              btn.querySelector('svg').setAttribute('fill', 'currentColor');
            });
          }
        }
        return;
      }

      var seeAll = e.target.closest('.content-row-more');
      if (seeAll) {
        showListView(seeAll.dataset.cat, seeAll.dataset.catname);
        return;
      }

      var card = e.target.closest('.channel-card');
      if (card) {
        var id = card.dataset.id;
        var ch = allChannels.find(function (c) { return String(c.stream_id) === String(id); });
        if (ch && window.PlayerManager && api) {
          _playingId = id;
          // Pass the full channel object so getStreamUrl can use container_extension
          var streamUrls = api.getStreamUrlFallbacks(id, 'live', ch);
          window.PlayerManager.play({
            id: id, name: ch.name, logo: ch.stream_icon, streamUrl: streamUrls[0], streamUrlFallbacks: streamUrls.slice(1), type: 'live', epg_channel_id: id
          });
          if (viewMode === 'list') renderChannelList(); else renderRows();
        }
      }
    }

    function handleSearch() {
      searchTerm = searchInput.value.trim();
      if (searchTerm) {
        activeCat = 'all';
        showListView('all', '');
      } else if (viewMode === 'list' && activeCat === 'all' && !activeCatName) {
        showRowsView();
      } else {
        renderChannelList();
      }
    }

    function handleSort() {
      sortBy = sortSelect.value;
      if (viewMode === 'rows') showListView('all', allLabel);
      else renderChannelList();
    }

    function handleBack() {
      showRowsView();
    }

    function handleScroll() {
      clearTimeout(scrollDebounce);
      scrollDebounce = setTimeout(function () {
        loadEPGForVisible(api, viewMode === 'list' ? channelsEl : rowsEl);
      }, 200);
    }

    container.addEventListener('click', handleClick);
    searchInput.addEventListener('input', handleSearch);
    sortSelect.addEventListener('change', handleSort);
    channelsEl.addEventListener('scroll', handleScroll, true);
    backBtn.addEventListener('click', handleBack);
    listeners.push(
      { el: container, fn: handleClick, ev: 'click' },
      { el: searchInput, fn: handleSearch, ev: 'input' },
      { el: sortSelect, fn: handleSort, ev: 'change' },
      { el: channelsEl, fn: handleScroll, ev: 'scroll' },
      { el: backBtn, fn: handleBack, ev: 'click' }
    );

    if (window.i18n && window.i18n.isReady()) window.i18n._applyTranslations();

    api.getLiveCategories().then(function (cats) {
      categories = cats || [];
    }).catch(function () {});

    api.getLiveStreams().then(function (streams) {
      allChannels = streams || [];
      var rowsSkeletons = container.querySelector('#live-rows-skeletons');
      if (rowsSkeletons) rowsSkeletons.remove();
      renderRows();
    }).catch(function () {
      rowsEl.innerHTML = '<div class="empty-state"><div class="empty-state-title">' + (window.i18n ? window.i18n.t('common.error') : 'Error') + '</div></div>';
    });

    if (window.AppDB) {
      window.AppDB.getFavorites('live').then(function (favs) {
        (favs || []).forEach(function (f) { _favCache[f.id] = true; });
      });
    }

    return function destroy() {
      _destroyed = true;
      listeners.forEach(function (l) { l.el.removeEventListener(l.ev, l.fn); });
    };
  }

  window.Pages = window.Pages || {};
  window.Pages['live-tv'] = { render: render };
})();
