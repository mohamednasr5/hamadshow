/**
 * NASR LIVE - Live TV Page
 * Category filtering, search, EPG display, favorites, sorting.
 */
(function () {
  'use strict';

  function getAPI() {
    return (window.AuthService && window.AuthService.getXtreamClient()) || null;
  }

  var _destroyed = false;
  var _epgCache = {};
  var _favCache = {};
  var _playingId = null;

  function channelCardHTML(ch, isPlaying, isFav) {
    var logo = ch.stream_icon || '';
    var name = ch.name || '';
    var cat = ch.category_name || '';
    var num = ch.num || '';
    var favClass = isFav ? ' active' : '';
    return '<div class="channel-card" data-id="' + ch.stream_id + '">' +
      '<div class="channel-card-inner">' +
        '<div class="channel-card-logo">' + (logo ? '<img src="' + logo + '" alt="' + name + '" loading="lazy">' : '') + '</div>' +
        '<div class="channel-card-info">' +
          '<div class="channel-card-name">' + (num ? '<span style="color:var(--text-muted);margin-right:4px">' + num + '</span>' : '') + name + '</div>' +
          '<div class="channel-card-category">' + cat + '</div>' +
          '<div class="channel-card-now" data-epg-id="' + ch.stream_id + '"></div>' +
        '</div>' +
        (isPlaying ? '<div class="channel-card-live"></div>' : '') +
        '<button class="channel-card-fav-btn content-card-favorite' + favClass + '" data-fav-id="' + ch.stream_id + '" data-fav-type="live">' +
          '<svg viewBox="0 0 24 24" fill="' + (isFav ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
        '</button>' +
      '</div></div>';
  }

  function skeletonChannels(count) {
    var s = '';
    for (var i = 0; i < count; i++) s += '<div class="skeleton-channel"></div>';
    return s;
  }

  function loadEPGForVisible(api, container) {
    var cards = container.querySelectorAll('.channel-card[data-id]');
    var rect = container.getBoundingClientRect();
    cards.forEach(function (card) {
      var id = card.dataset.id;
      if (_epgCache[id] || _destroyed) return;
      var cardRect = card.getBoundingClientRect();
      if (cardRect.bottom < rect.top - 100 || cardRect.top > rect.bottom + 100) return;
      _epgCache[id] = true;
      api.getEPG(id, 1).then(function (epg) {
        if (_destroyed) return;
        var el = container.querySelector('[data-epg-id="' + id + '"]');
        if (el && epg && epg.length > 0) {
          var now = epg[0];
          var title = now.title || now.name || '';
          var start = now.start || '';
          var end = now.end || '';
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
    var activeCat = 'all';
    var searchTerm = '';
    var sortBy = 'name';
    var scrollDebounce = null;

    container.innerHTML =
      '<div class="live-page" style="padding:8px 16px 24px">' +
        '<div class="search-bar" style="margin-bottom:12px">' +
          '<div class="search-bar-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg></div>' +
          '<input type="text" id="live-search" data-i18n-placeholder="live.searchPlaceholder" placeholder="Search for a channel...">' +
        '</div>' +
        '<div class="category-chips" id="live-cats"></div>' +
        '<div style="display:flex;gap:8px;margin-bottom:12px;align-items:center">' +
          '<select id="live-sort" style="height:36px;padding:0 12px;background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text-primary);font-size:0.8125rem">' +
            '<option value="name">' + (window.i18n ? window.i18n.t('live.sortName') : 'Name') + '</option>' +
            '<option value="number">' + (window.i18n ? window.i18n.t('live.sortNumber') : 'Number') + '</option>' +
          '</select>' +
        '</div>' +
        '<div id="live-channels" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px">' +
          skeletonChannels(12) +
        '</div>' +
        '<div id="live-empty" style="display:none" class="empty-state">' +
          '<div class="empty-state-title">' + (window.i18n ? window.i18n.t('live.noChannels') : 'No channels') + '</div>' +
        '</div>' +
      '</div>';

    var catsEl = container.querySelector('#live-cats');
    var channelsEl = container.querySelector('#live-channels');
    var emptyEl = container.querySelector('#live-empty');
    var searchInput = container.querySelector('#live-search');
    var sortSelect = container.querySelector('#live-sort');

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

    function renderChannels() {
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

    function renderCategories() {
      var html = '<button class="category-chip' + (activeCat === 'all' ? ' active' : '') + '" data-cat="all">' +
        (window.i18n ? window.i18n.t('live.allChannels') : 'All') + '</button>';
      categories.forEach(function (cat) {
        html += '<button class="category-chip' + (activeCat === cat.category_id ? ' active' : '') + '" data-cat="' + cat.category_id + '">' +
          cat.category_name + '</button>';
      });
      catsEl.innerHTML = html;
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
            favBtn.classList.remove('active');
            favBtn.querySelector('svg').setAttribute('fill', 'none');
          });
        } else if (window.AppDB) {
          var ch = allChannels.find(function (c) { return String(c.stream_id) === String(favId); });
          if (ch) {
            window.AppDB.addFavorite({ id: favId, type: 'live', name: ch.name, logo: ch.stream_icon, stream_id: ch.stream_id });
            _favCache[favId] = true;
            favBtn.classList.add('active');
            favBtn.querySelector('svg').setAttribute('fill', 'currentColor');
          }
        }
        return;
      }

      var chip = e.target.closest('.category-chip');
      if (chip) {
        activeCat = chip.dataset.cat;
        catsEl.querySelectorAll('.category-chip').forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        renderChannels();
        return;
      }

      var card = e.target.closest('.channel-card');
      if (card) {
        var id = card.dataset.id;
        var ch = allChannels.find(function (c) { return String(c.stream_id) === String(id); });
        if (ch && window.PlayerManager && api) {
          _playingId = id;
          var streamUrl = api.getStreamUrl(id, 'live');
          window.PlayerManager.play({
            id: id, name: ch.name, logo: ch.stream_icon, streamUrl: streamUrl, type: 'live', epg_channel_id: id
          });
          renderChannels();
        }
      }
    }

    function handleSearch() {
      searchTerm = searchInput.value.trim();
      renderChannels();
    }

    function handleSort() {
      sortBy = sortSelect.value;
      renderChannels();
    }

    function handleScroll() {
      clearTimeout(scrollDebounce);
      scrollDebounce = setTimeout(function () {
        loadEPGForVisible(api, channelsEl);
      }, 200);
    }

    container.addEventListener('click', handleClick);
    searchInput.addEventListener('input', handleSearch);
    sortSelect.addEventListener('change', handleSort);
    channelsEl.addEventListener('scroll', handleScroll, true);
    listeners.push(
      { el: container, fn: handleClick, ev: 'click' },
      { el: searchInput, fn: handleSearch, ev: 'input' },
      { el: sortSelect, fn: handleSort, ev: 'change' },
      { el: channelsEl, fn: handleScroll, ev: 'scroll' }
    );

    if (window.i18n && window.i18n.isReady()) window.i18n._applyTranslations();

    api.getLiveCategories().then(function (cats) {
      categories = cats || [];
      renderCategories();
    }).catch(function () {});

    api.getLiveStreams().then(function (streams) {
      allChannels = streams || [];
      renderChannels();
    }).catch(function () {
      channelsEl.innerHTML = '<div class="empty-state"><div class="empty-state-title">' + (window.i18n ? window.i18n.t('common.error') : 'Error') + '</div></div>';
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