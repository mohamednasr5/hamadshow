/**
 * NASR LIVE - Series Page
 * Category filtering, search, poster grid, detail with seasons/episodes, watched tracking.
 */
(function () {
  'use strict';

  var PAGE_SIZE = 30;
  var _destroyed = false;
  var _watchedEps = {};

  function getAPI() {
    return (window.ServerConfig && window.ServerConfig.getXtreamClient()) || null;
  }

  function seriesCardHTML(s) {
    var poster = s.cover || s.stream_icon || '';
    var title = s.name || '';
    var rating = s.rating || '';
    var badges = '';
    if (rating) {
      badges += '<span class="content-card-rating" style="position:absolute;top:8px;right:8px;background:var(--bg-surface);padding:2px 6px;border-radius:var(--radius-sm);font-size:0.6875rem;display:flex;align-items:center;gap:3px;z-index:2">' +
        '<svg viewBox="0 0 20 20" fill="var(--warning)" width="10" height="10"><path d="M10 1l2.39 4.84 5.34.78-3.87 3.77.91 5.32L10 13.27l-4.77 2.51.91-5.32L2.27 6.62l5.34-.78z"/></svg>' +
        rating + '</span>';
    }
    return '<div class="content-card" data-id="' + s.series_id + '">' +
      '<div class="content-card-poster">' +
        (poster ? '<img src="' + poster + '" alt="' + title + '" loading="lazy">' : '') +
        badges +
        '<div class="content-card-overlay"></div>' +
        '<div class="content-card-info"><div class="content-card-title">' + title + '</div></div>' +
      '</div></div>';
  }

  function skeletonGrid(count) {
    var s = '';
    for (var i = 0; i < count; i++) s += '<div class="skeleton-card"></div>';
    return s;
  }

  function episodeItemHTML(ep, epNum, isWatched) {
    var thumb = ep.container_extension || ep.info && ep.info.movie_image || '';
    var title = ep.title || (window.i18n ? window.i18n.t('series.episode') + ' ' + epNum : 'Episode ' + epNum);
    var duration = ep.info && ep.info.duration || '';
    var check = isWatched
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="var(--success)" stroke="none"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>'
      : '<span style="font-size:0.875rem;font-weight:600;color:var(--text-muted);width:24px;text-align:center;flex-shrink:0">' + epNum + '</span>';

    return '<div class="playlist-item" data-ep-id="' + ep.id + '" data-ep-container="' + (ep.container_extension || '') + '">' +
      '<div class="playlist-item-number" style="width:24px">' + check + '</div>' +
      '<div class="playlist-item-info" style="flex:1;overflow:hidden">' +
        '<div class="playlist-item-title" style="font-size:0.875rem;font-weight:500;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + title + '</div>' +
        (duration ? '<div style="font-size:0.75rem;color:var(--text-tertiary)">' + duration + '</div>' : '') +
      '</div>' +
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="var(--primary)" style="flex-shrink:0"><path d="M8 5v14l11-7z"/></svg>' +
    '</div>';
  }

  function seriesDetailHTML(series, seasons, activeSeason, isFav, episodes) {
    var poster = series.cover || '';
    var title = series.name || '';
    var genre = series.genre || series.category_name || '';
    var rating = series.rating || '';
    var cast = series.cast || '';
    var plot = series.plot || series.description || '';
    var favText = isFav
      ? (window.i18n ? window.i18n.t('series.removeFavorite') : 'Remove from Favorites')
      : (window.i18n ? window.i18n.t('series.addFavorite') : 'Add to Favorites');
    var favFill = isFav ? 'currentColor' : 'none';

    var seasonTabs = '<div class="tabs" id="season-tabs">';
    var seasonKeys = Object.keys(seasons).sort(function (a, b) { return parseInt(a) - parseInt(b); });
    seasonKeys.forEach(function (s) {
      seasonTabs += '<div class="tab-item' + (String(s) === String(activeSeason) ? ' active' : '') + '" data-season="' + s + '">' +
        (window.i18n ? window.i18n.t('series.season') : 'Season') + ' ' + s + '</div>';
    });
    seasonTabs += '</div>';

    var eps = episodes || [];
    var epList = eps.map(function (ep, idx) {
      return episodeItemHTML(ep, idx + 1, !!_watchedEps[ep.id]);
    }).join('');

    return '<div class="modal-overlay" id="series-detail-overlay">' +
      '<div class="modal-panel" style="max-width:600px;max-height:92vh;overflow-y:auto">' +
        '<div style="position:relative;margin:-24px -24px 16px;height:220px;overflow:hidden;border-radius:var(--radius-xl) var(--radius-xl) 0 0">' +
          (poster ? '<img src="' + poster + '" style="width:100%;height:100%;object-fit:cover" alt="' + title + '">' : '') +
          '<div style="position:absolute;inset:0;background:linear-gradient(to top,var(--bg-card) 15%,transparent 85%)"></div>' +
          '<button class="btn btn-ghost" id="series-detail-close" style="position:absolute;top:12px;right:12px;background:var(--bg-surface);border-radius:var(--radius-full);width:36px;height:36px;padding:0;display:flex;align-items:center;justify-content:center">' +
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
          '</button>' +
        '</div>' +
        '<h2 style="font-size:1.25rem;font-weight:700;color:var(--text-primary);margin-bottom:8px">' + title + '</h2>' +
        '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;font-size:0.8125rem;color:var(--text-secondary)">' +
          (rating ? '<span style="color:var(--warning)"><svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14" style="vertical-align:middle"><path d="M10 1l2.39 4.84 5.34.78-3.87 3.77.91 5.32L10 13.27l-4.77 2.51.91-5.32L2.27 6.62l5.34-.78z"/></svg> ' + rating + '</span>' : '') +
          (genre ? '<span>' + genre + '</span>' : '') +
        '</div>' +
        (plot ? '<p style="font-size:0.875rem;color:var(--text-secondary);line-height:1.7;margin-bottom:8px">' + plot + '</p>' : '') +
        (cast ? '<p style="font-size:0.8125rem;color:var(--text-tertiary);margin-bottom:16px"><strong>' + (window.i18n ? window.i18n.t('movies.cast') : 'Cast') + ':</strong> ' + cast + '</p>' : '') +
        '<button class="btn btn-secondary btn-sm" id="series-fav-btn" style="margin-bottom:16px;width:100%">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="' + favFill + '" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> ' +
          favText +
        '</button>' +
        seasonTabs +
        '<div id="episodes-list" style="margin-top:12px">' + epList + '</div>' +
      '</div></div>';
  }

  function render(container) {
    _destroyed = false;
    var api = getAPI();
    var listeners = [];
    var allSeries = [];
    var categories = [];
    var activeCat = 'all';
    var searchTerm = '';
    var displayedCount = 0;
    var currentSeriesInfo = null;

    container.innerHTML =
      '<div class="series-page" style="padding:8px 16px 24px">' +
        '<div class="search-bar" style="margin-bottom:12px">' +
          '<div class="search-bar-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg></div>' +
          '<input type="text" id="series-search" data-i18n-placeholder="series.searchPlaceholder" placeholder="Search for a series...">' +
        '</div>' +
        '<div class="category-chips" id="series-cats"></div>' +
        '<div id="series-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;margin-top:12px">' +
          skeletonGrid(18) +
        '</div>' +
        '<div id="series-empty" style="display:none" class="empty-state">' +
          '<div class="empty-state-title">' + (window.i18n ? window.i18n.t('series.noSeries') : 'No series found') + '</div>' +
        '</div>' +
        '<div id="series-loadmore" style="display:none;text-align:center;padding:20px">' +
          '<button class="btn btn-secondary" id="series-loadmore-btn">' + (window.i18n ? window.i18n.t('home.seeAll') : 'Load More') + '</button>' +
        '</div>' +
      '</div>';

    var gridEl = container.querySelector('#series-grid');
    var emptyEl = container.querySelector('#series-empty');
    var loadMoreWrap = container.querySelector('#series-loadmore');
    var loadMoreBtn = container.querySelector('#series-loadmore-btn');
    var searchInput = container.querySelector('#series-search');
    var catsEl = container.querySelector('#series-cats');

    function getFiltered() {
      var list = allSeries;
      if (activeCat !== 'all') {
        var catId = String(activeCat);
        list = list.filter(function (s) { return String(s.category_id) === catId; });
      }
      if (searchTerm) {
        var q = searchTerm.toLowerCase();
        list = list.filter(function (s) { return (s.name || '').toLowerCase().indexOf(q) !== -1; });
      }
      return list;
    }

    function renderGrid(reset) {
      if (reset) displayedCount = 0;
      var filtered = getFiltered();
      var batch = filtered.slice(displayedCount, displayedCount + PAGE_SIZE);
      displayedCount += batch.length;

      if (filtered.length === 0) {
        gridEl.style.display = 'none';
        emptyEl.style.display = 'flex';
        loadMoreWrap.style.display = 'none';
        return;
      }

      gridEl.style.display = 'grid';
      emptyEl.style.display = 'none';

      if (reset) {
        gridEl.innerHTML = batch.map(seriesCardHTML).join('');
      } else {
        gridEl.insertAdjacentHTML('beforeend', batch.map(seriesCardHTML).join(''));
      }
      loadMoreWrap.style.display = displayedCount < filtered.length ? 'block' : 'none';
    }

    function renderCategories() {
      var html = '<button class="category-chip' + (activeCat === 'all' ? ' active' : '') + '" data-cat="all">' +
        (window.i18n ? window.i18n.t('series.all') : 'All') + '</button>';
      categories.forEach(function (cat) {
        html += '<button class="category-chip' + (activeCat === cat.category_id ? ' active' : '') + '" data-cat="' + cat.category_id + '">' +
          cat.category_name + '</button>';
      });
      catsEl.innerHTML = html;
    }

    function showDetail(series) {
      var loadingEl = container.querySelector('#series-detail-overlay');
      if (!loadingEl) {
        container.insertAdjacentHTML('beforeend', '<div class="modal-overlay active" id="series-detail-overlay"><div class="modal-panel" style="text-align:center;padding:40px"><div class="skeleton-text w-50"></div><div class="skeleton-text w-75" style="margin-top:12px"></div></div></div>');
      }

      var infoPromise = api.getSeriesInfo(series.series_id);
      var favPromise = window.AppDB ? window.AppDB.isFavorite(series.series_id, 'series') : Promise.resolve(false);

      Promise.all([infoPromise, favPromise]).then(function (results) {
        if (_destroyed) return;
        var info = results[0] || {};
        var isFav = results[1];
        currentSeriesInfo = info;
        var seasons = info.episodes || {};
        var seasonKeys = Object.keys(seasons).sort(function (a, b) { return parseInt(a) - parseInt(b); });
        var firstSeason = seasonKeys[0] || '1';
        var overlay = container.querySelector('#series-detail-overlay');
        if (!overlay) return;
        overlay.outerHTML = seriesDetailHTML(series, seasons, firstSeason, isFav, seasons[firstSeason] || []);
        var newOverlay = container.querySelector('#series-detail-overlay');
        requestAnimationFrame(function () { if (newOverlay) newOverlay.classList.add('active'); });
        bindDetailEvents(series, newOverlay, seasons, firstSeason, isFav);
      }).catch(function () {
        var overlay = container.querySelector('#series-detail-overlay');
        if (overlay) overlay.remove();
      });
    }

    function bindDetailEvents(series, overlay, seasons, activeSeason, isFav) {
      overlay.querySelector('#series-detail-close').addEventListener('click', closeDetail);
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeDetail();
      });

      overlay.querySelector('#series-fav-btn').addEventListener('click', function () {
        if (!window.AppDB) return;
        var sid = String(series.series_id);
        if (isFav) {
          window.AppDB.removeFavorite(sid, 'series').then(function () {
            isFav = false;
            closeDetail();
            showDetail(series);
          });
        } else {
          window.AppDB.addFavorite({ id: sid, type: 'series', name: series.name, logo: series.cover, series_id: series.series_id });
          isFav = true;
          closeDetail();
          showDetail(series);
        }
      });

      var seasonTabs = overlay.querySelector('#season-tabs');
      if (seasonTabs) {
        seasonTabs.addEventListener('click', function (e) {
          var tab = e.target.closest('.tab-item');
          if (!tab) return;
          var sNum = tab.dataset.season;
          seasonTabs.querySelectorAll('.tab-item').forEach(function (t) { t.classList.remove('active'); });
          tab.classList.add('active');
          var eps = (seasons[sNum] || []).map(function (ep, idx) {
            return episodeItemHTML(ep, idx + 1, !!_watchedEps[ep.id]);
          }).join('');
          overlay.querySelector('#episodes-list').innerHTML = eps;
        });
      }

      var epList = overlay.querySelector('#episodes-list');
      if (epList) {
        epList.addEventListener('click', function (e) {
          var item = e.target.closest('.playlist-item');
          if (!item) return;
          var epId = item.dataset.epId;
          var ep = (seasons[activeSeason] || []).find(function (ep) { return String(ep.id) === String(epId); });
          if (!ep || !window.PlayerManager || !api) return;

          var streamUrl = api.getStreamUrl(epId, 'series');
          _watchedEps[epId] = true;
          item.querySelector('.playlist-item-number').innerHTML =
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="var(--success)" stroke="none"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';

          if (window.AppDB) {
            window.AppDB.addToHistory({
              id: epId, type: 'series', name: series.name + ' S' + activeSeason + 'E' + epId,
              logo: series.cover, position: 0, duration: 0
            });
          }

          window.PlayerManager.play({
            id: epId, name: series.name, logo: series.cover, streamUrl: streamUrl, type: 'series',
            seriesId: series.series_id, season: activeSeason, episode: epId
          });
        });
      }
    }

    function closeDetail() {
      var overlay = container.querySelector('#series-detail-overlay');
      if (overlay) overlay.remove();
    }

    function handleClick(e) {
      var chip = e.target.closest('.category-chip');
      if (chip) {
        activeCat = chip.dataset.cat;
        catsEl.querySelectorAll('.category-chip').forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        renderGrid(true);
        return;
      }
      var card = e.target.closest('.content-card');
      if (card && card.dataset.id) {
        var series = allSeries.find(function (s) { return String(s.series_id) === card.dataset.id; });
        if (series) showDetail(series);
      }
    }

    container.addEventListener('click', handleClick);
    searchInput.addEventListener('input', function () {
      searchTerm = searchInput.value.trim();
      renderGrid(true);
    });
    loadMoreBtn.addEventListener('click', function () { renderGrid(false); });
    listeners.push(
      { el: container, fn: handleClick, ev: 'click' },
      { el: searchInput, fn: searchInput.oninput, ev: 'input' },
      { el: loadMoreBtn, fn: null, ev: 'click' }
    );

    if (window.AppDB) {
      window.AppDB.getHistory('series').then(function (hist) {
        (hist || []).forEach(function (h) { if (h.id) _watchedEps[h.id] = true; });
      });
    }

    if (window.i18n && window.i18n.isReady()) window.i18n._applyTranslations();

    api.getSeriesCategories().then(function (cats) {
      categories = cats || [];
      renderCategories();
    }).catch(function () {});

    api.getSeries().then(function (list) {
      allSeries = list || [];
      renderGrid(true);
    }).catch(function () {
      gridEl.innerHTML = '<div class="empty-state"><div class="empty-state-title">' + (window.i18n ? window.i18n.t('common.error') : 'Error') + '</div></div>';
    });

    return function destroy() {
      _destroyed = true;
      listeners.forEach(function (l) { if (l.fn) l.el.removeEventListener(l.ev, l.fn); });
      closeDetail();
    };
  }

  window.Pages = window.Pages || {};
  window.Pages.series = { render: render };
})();