/**
 * NASR LIVE - Movies Page
 * Genre filtering, search, poster grid, detail overlay, infinite load more.
 */
(function () {
  'use strict';

  var PAGE_SIZE = 30;
  var _destroyed = false;

  function getAPI() {
    return window.XtreamAPI || (window.AuthService && window.AuthService.getXtreamClient());
  }

  function movieCardHTML(m) {
    var poster = m.stream_icon || m.cover || '';
    var title = m.name || '';
    var rating = m.rating || '';
    var year = m.year || m.release_date || '';
    var badges = '';
    if (year) badges += '<span class="content-card-badge">' + year + '</span>';
    if (rating) {
      badges += '<span class="content-card-rating" style="position:absolute;top:8px;right:8px;background:var(--bg-surface);padding:2px 6px;border-radius:var(--radius-sm);font-size:0.6875rem;display:flex;align-items:center;gap:3px;z-index:2">' +
        '<svg viewBox="0 0 20 20" fill="var(--warning)" width="10" height="10"><path d="M10 1l2.39 4.84 5.34.78-3.87 3.77.91 5.32L10 13.27l-4.77 2.51.91-5.32L2.27 6.62l5.34-.78z"/></svg>' +
        rating + '</span>';
    }
    return '<div class="content-card" data-id="' + m.stream_id + '">' +
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

  function detailOverlayHTML(m, isFav) {
    var poster = m.stream_icon || m.cover || '';
    var title = m.name || '';
    var genre = m.genre || m.category_name || '';
    var year = m.year || m.release_date || '';
    var rating = m.rating || '';
    var duration = m.container_extension || '';
    var director = m.director || '';
    var cast = m.cast || '';
    var plot = m.plot || m.description || '';
    var favText = isFav
      ? (window.i18n ? window.i18n.t('movies.removeFavorite') : 'Remove from Favorites')
      : (window.i18n ? window.i18n.t('movies.addFavorite') : 'Add to Favorites');
    var favIconFill = isFav ? 'currentColor' : 'none';

    return '<div class="modal-overlay" id="movie-detail-overlay">' +
      '<div class="modal-panel" style="max-width:560px;max-height:90vh;overflow-y:auto">' +
        '<div style="position:relative;margin:-24px -24px 16px;height:200px;overflow:hidden;border-radius:var(--radius-xl) var(--radius-xl) 0 0">' +
          (poster ? '<img src="' + poster + '" style="width:100%;height:100%;object-fit:cover" alt="' + title + '">' : '') +
          '<div style="position:absolute;inset:0;background:linear-gradient(to top,var(--bg-card) 10%,transparent 80%)"></div>' +
          '<button class="btn btn-ghost" id="movie-detail-close" style="position:absolute;top:12px;right:12px;background:var(--bg-surface);border-radius:var(--radius-full);width:36px;height:36px;padding:0;display:flex;align-items:center;justify-content:center">' +
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
          '</button>' +
        '</div>' +
        '<h2 style="font-size:1.25rem;font-weight:700;color:var(--text-primary);margin-bottom:8px">' + title + '</h2>' +
        '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;font-size:0.8125rem;color:var(--text-secondary)">' +
          (rating ? '<span style="color:var(--warning)"><svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14" style="vertical-align:middle"><path d="M10 1l2.39 4.84 5.34.78-3.87 3.77.91 5.32L10 13.27l-4.77 2.51.91-5.32L2.27 6.62l5.34-.78z"/></svg> ' + rating + '</span>' : '') +
          (year ? '<span>' + year + '</span>' : '') +
          (genre ? '<span>' + genre + '</span>' : '') +
          (duration ? '<span>' + (window.i18n ? window.i18n.t('movies.duration') : 'Duration') + ': ' + duration + '</span>' : '') +
        '</div>' +
        (plot ? '<p style="font-size:0.875rem;color:var(--text-secondary);line-height:1.7;margin-bottom:16px">' + plot + '</p>' : '') +
        (director ? '<p style="font-size:0.8125rem;color:var(--text-tertiary);margin-bottom:4px"><strong>' + (window.i18n ? window.i18n.t('movies.director') : 'Director') + ':</strong> ' + director + '</p>' : '') +
        (cast ? '<p style="font-size:0.8125rem;color:var(--text-tertiary);margin-bottom:16px"><strong>' + (window.i18n ? window.i18n.t('movies.cast') : 'Cast') + ':</strong> ' + cast + '</p>' : '') +
        '<div style="display:flex;gap:10px">' +
          '<button class="btn btn-primary" id="movie-play-btn" style="flex:1">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> ' +
            (window.i18n ? window.i18n.t('movies.play') : 'Play') +
          '</button>' +
          '<button class="btn btn-secondary" id="movie-fav-btn" data-fav-id="' + m.stream_id + '" style="flex:1">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="' + favIconFill + '" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> ' +
            favText +
          '</button>' +
        '</div>' +
      '</div></div>';
  }

  function render(container) {
    _destroyed = false;
    var api = getAPI();
    var listeners = [];
    var allMovies = [];
    var categories = [];
    var activeCat = 'all';
    var searchTerm = '';
    var displayedCount = 0;

    container.innerHTML =
      '<div class="movies-page" style="padding:8px 16px 24px">' +
        '<div class="search-bar" style="margin-bottom:12px">' +
          '<div class="search-bar-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg></div>' +
          '<input type="text" id="movies-search" data-i18n-placeholder="movies.searchPlaceholder" placeholder="Search for a movie...">' +
        '</div>' +
        '<div class="category-chips" id="movies-cats"></div>' +
        '<div id="movies-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;margin-top:12px">' +
          skeletonGrid(18) +
        '</div>' +
        '<div id="movies-empty" style="display:none" class="empty-state">' +
          '<div class="empty-state-title">' + (window.i18n ? window.i18n.t('movies.noMovies') : 'No movies found') + '</div>' +
        '</div>' +
        '<div id="movies-loadmore" style="display:none;text-align:center;padding:20px">' +
          '<button class="btn btn-secondary" id="movies-loadmore-btn">' + (window.i18n ? window.i18n.t('home.seeAll') : 'Load More') + '</button>' +
        '</div>' +
      '</div>';

    var gridEl = container.querySelector('#movies-grid');
    var emptyEl = container.querySelector('#movies-empty');
    var loadMoreWrap = container.querySelector('#movies-loadmore');
    var loadMoreBtn = container.querySelector('#movies-loadmore-btn');
    var searchInput = container.querySelector('#movies-search');
    var catsEl = container.querySelector('#movies-cats');

    function getFiltered() {
      var list = allMovies;
      if (activeCat !== 'all') {
        var catId = String(activeCat);
        list = list.filter(function (m) { return String(m.category_id) === catId; });
      }
      if (searchTerm) {
        var q = searchTerm.toLowerCase();
        list = list.filter(function (m) { return (m.name || '').toLowerCase().indexOf(q) !== -1; });
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
        gridEl.innerHTML = batch.map(movieCardHTML).join('');
      } else {
        gridEl.insertAdjacentHTML('beforeend', batch.map(movieCardHTML).join(''));
      }

      loadMoreWrap.style.display = displayedCount < filtered.length ? 'block' : 'none';
    }

    function renderCategories() {
      var html = '<button class="category-chip' + (activeCat === 'all' ? ' active' : '') + '" data-cat="all">' +
        (window.i18n ? window.i18n.t('movies.all') : 'All') + '</button>';
      categories.forEach(function (cat) {
        html += '<button class="category-chip' + (activeCat === cat.category_id ? ' active' : '') + '" data-cat="' + cat.category_id + '">' +
          cat.category_name + '</button>';
      });
      catsEl.innerHTML = html;
    }

    function showDetail(movie) {
      if (!window.AppDB) {
        openDetail(movie, false);
        return;
      }
      window.AppDB.isFavorite(movie.stream_id, 'movie').then(function (isFav) {
        if (_destroyed) return;
        openDetail(movie, isFav);
      });
    }

    function openDetail(movie, isFav) {
      var existing = container.querySelector('#movie-detail-overlay');
      if (existing) existing.remove();
      container.insertAdjacentHTML('beforeend', detailOverlayHTML(movie, isFav));
      var overlay = container.querySelector('#movie-detail-overlay');
      requestAnimationFrame(function () { overlay.classList.add('active'); });

      overlay.querySelector('#movie-detail-close').addEventListener('click', closeDetail);
      overlay.querySelector('#movie-play-btn').addEventListener('click', function () {
        if (window.PlayerManager && api) {
          var url = api.getStreamUrl(movie.stream_id, 'movie');
          window.PlayerManager.play({ id: movie.stream_id, name: movie.name, logo: movie.stream_icon, streamUrl: url, type: 'movie' });
        }
        closeDetail();
      });
      overlay.querySelector('#movie-fav-btn').addEventListener('click', function () {
        if (!window.AppDB) return;
        var favId = String(movie.stream_id);
        if (isFav) {
          window.AppDB.removeFavorite(favId, 'movie').then(function () {
            isFav = false;
            closeDetail();
            showDetail(movie);
          });
        } else {
          window.AppDB.addFavorite({ id: favId, type: 'movie', name: movie.name, logo: movie.stream_icon, stream_id: movie.stream_id, cover: movie.cover });
          isFav = true;
          closeDetail();
          showDetail(movie);
        }
      });
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeDetail();
      });
    }

    function closeDetail() {
      var overlay = container.querySelector('#movie-detail-overlay');
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
        var movie = allMovies.find(function (m) { return String(m.stream_id) === card.dataset.id; });
        if (movie) showDetail(movie);
      }
    }

    function handleSearch() {
      searchTerm = searchInput.value.trim();
      renderGrid(true);
    }

    function handleLoadMore() {
      renderGrid(false);
    }

    container.addEventListener('click', handleClick);
    searchInput.addEventListener('input', handleSearch);
    loadMoreBtn.addEventListener('click', handleLoadMore);
    listeners.push(
      { el: container, fn: handleClick, ev: 'click' },
      { el: searchInput, fn: handleSearch, ev: 'input' },
      { el: loadMoreBtn, fn: handleLoadMore, ev: 'click' }
    );

    if (window.i18n && window.i18n.isReady()) window.i18n._applyTranslations();

    api.getVodCategories().then(function (cats) {
      categories = cats || [];
      renderCategories();
    }).catch(function () {});

    api.getVodStreams().then(function (streams) {
      allMovies = streams || [];
      renderGrid(true);
    }).catch(function () {
      gridEl.innerHTML = '<div class="empty-state"><div class="empty-state-title">' + (window.i18n ? window.i18n.t('common.error') : 'Error') + '</div></div>';
    });

    return function destroy() {
      _destroyed = true;
      listeners.forEach(function (l) { l.el.removeEventListener(l.ev, l.fn); });
      closeDetail();
    };
  }

  window.Pages = window.Pages || {};
  window.Pages.movies = { render: render };
})();