/**
 * NASR LIVE - Home Page
 * Displays welcome banner, continue watching, live TV, movies, series, and recommended rows.
 */
(function () {
  'use strict';

  var PAGE_SIZE = 15;

  function getAPI() {
    return (window.ServerConfig && window.ServerConfig.getXtreamClient()) || null;
  }

  function skeletonRow() {
    return '<div class="content-row skeleton-row">' +
      '<div class="content-row-header"><div class="skeleton-row-header"></div></div>' +
      '<div class="content-row-scroll">' +
        '<div class="skeleton-card"></div><div class="skeleton-card"></div><div class="skeleton-card"></div>' +
        '<div class="skeleton-card"></div><div class="skeleton-card"></div>' +
      '</div></div>';
  }

  function contentCardHTML(item, type) {
    var poster = item.stream_icon || item.cover || item.logo || '';
    var title = item.name || item.title || '';
    var rating = item.rating || '';
    var year = item.year || item.release_date || '';
    var badge = '';
    if (type === 'live') badge = '<span class="content-card-badge live">LIVE</span>';
    else if (year) badge = '<span class="content-card-badge">' + year + '</span>';

    var overlayButtons = '';
    if (type === 'live') {
      overlayButtons = '<div class="content-card-actions">' +
        '<button class="content-card-play-btn" aria-label="Play"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></button>' +
        '<button class="content-card-fav-btn content-card-favorite" data-fav-id="' + (item.stream_id || '') + '" data-fav-type="live" aria-label="Favorite"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></button>' +
        '</div>';
    }

    return '<div class="content-card" data-type="' + type + '" data-id="' + (item.stream_id || item.series_id || item.id) + '">' +
      '<div class="content-card-poster">' +
        (poster ? '<img src="' + poster + '" alt="' + title + '" loading="lazy">' : '') +
        badge +
        '<div class="content-card-overlay"></div>' +
        overlayButtons +
        '<div class="content-card-info">' +
          '<div class="content-card-title">' + title + '</div>' +
          (rating ? '<div class="content-card-meta"><span class="content-card-rating"><svg viewBox="0 0 20 20"><path d="M10 1l2.39 4.84 5.34.78-3.87 3.77.91 5.32L10 13.27l-4.77 2.51.91-5.32L2.27 6.62l5.34-.78z"/></svg>' + rating + '</span></div>' : '') +
        '</div>' +
      '</div></div>';
  }

  function wideCardHTML(item) {
    var poster = item.stream_icon || item.cover || item.logo || '';
    var title = item.name || item.title || '';
    var desc = item.plot || item.epg_title || '';
    return '<div class="wide-card" data-type="' + (item.type || 'movie') + '" data-id="' + (item.stream_id || item.series_id || item.id) + '">' +
      '<div class="wide-card-poster">' +
        (poster ? '<img src="' + poster + '" alt="' + title + '" loading="lazy">' : '') +
        '<div class="wide-card-overlay"></div>' +
      '</div>' +
      '<div class="wide-card-info">' +
        '<div class="wide-card-title">' + title + '</div>' +
        (desc ? '<div class="wide-card-desc">' + desc + '</div>' : '') +
        '<div class="wide-card-actions"><button class="wide-card-play-btn btn btn-primary btn-sm">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> Play' +
        '</button></div>' +
      '</div></div>';
  }

  function rowHTML(titleKey, items, type, seeAllPage) {
    if (!items || items.length === 0) return '';
    var cards = items.map(function (it) { return contentCardHTML(it, type); }).join('');
    return '<div class="content-row">' +
      '<div class="content-row-header">' +
        '<h2 class="content-row-title">' + (window.i18n ? window.i18n.t(titleKey) : titleKey) + '</h2>' +
        (seeAllPage ? '<span class="content-row-more" data-navigate="' + seeAllPage + '">' +
          (window.i18n ? window.i18n.t('home.seeAll') : 'See All') +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>' +
        '</span>' : '') +
      '</div>' +
      '<div class="content-row-scroll">' + cards + '</div></div>';
  }

  function continueWatchingRow(items) {
    if (!items || items.length === 0) return '';
    var cards = items.slice(0, PAGE_SIZE).map(function (it) {
      var poster = it.logo || it.stream_icon || it.cover || '';
      var title = it.name || '';
      var progress = (it.position && it.duration) ? Math.min(100, Math.round((it.position / it.duration) * 100)) : 0;
      var type = it.type || 'movie';
      return '<div class="content-card" data-type="' + type + '" data-id="' + it.id + '">' +
        '<div class="content-card-poster">' +
          (poster ? '<img src="' + poster + '" alt="' + title + '" loading="lazy">' : '') +
          '<div class="content-card-overlay"></div>' +
          '<div class="content-card-info">' +
            '<div class="content-card-title">' + title + '</div>' +
            (progress > 0 ? '<div class="progress-bar" style="margin-top:6px"><div class="progress-bar-fill" style="width:' + progress + '%"></div></div>' : '') +
          '</div>' +
        '</div></div>';
    }).join('');
    return '<div class="content-row">' +
      '<div class="content-row-header">' +
        '<h2 class="content-row-title">' + (window.i18n ? window.i18n.t('home.continueWatching') : 'Continue Watching') + '</h2>' +
      '</div>' +
      '<div class="content-row-scroll">' + cards + '</div></div>';
  }

  function render(container) {
    var api = getAPI();
    var listeners = [];

    if (!api || !api.isAuthenticated()) {
      container.innerHTML = '<div class="empty-state">' +
        '<div class="empty-state-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></div>' +
        '<div class="empty-state-title">' + (window.i18n ? window.i18n.t('common.noInternet') : 'Not Connected') + '</div>' +
        '<div class="empty-state-desc">' + (window.i18n ? window.i18n.t('common.offline') : 'Please connect to your IPTV server') + '</div>' +
      '</div>';
      return function destroy() {};
    }

    container.innerHTML =
      '<div class="home-page" style="padding:8px 16px 24px">' +
        '<div style="margin-bottom:24px"><h1 style="font-size:1.5rem;font-weight:800;color:var(--text-primary)">' +
          (window.i18n ? window.i18n.t('home.welcome') : 'مرحباً بالمهندس') +
        '</h1></div>' +
        '<div id="home-skeletons">' + skeletonRow() + skeletonRow() + skeletonRow() + skeletonRow() + skeletonRow() + '</div>' +
        '<div id="home-content"></div>' +
      '</div>';

    function handleClick(e) {
      // Handle favorite button on live cards
      var favBtn = e.target.closest('.content-card-fav-btn');
      if (favBtn) {
        e.stopPropagation();
        var favId = favBtn.dataset.favId;
        if (favId && window.AppDB) {
          var isNowFav = favBtn.classList.contains('active');
          if (isNowFav) {
            window.AppDB.removeFavorite(favId, 'live').then(function () {
              favBtn.classList.remove('active');
              favBtn.querySelector('svg').setAttribute('fill', 'none');
            });
          } else {
            var favCard = favBtn.closest('.content-card');
            var favName = favCard ? favCard.querySelector('.content-card-title').textContent : '';
            var favImg = favCard ? favCard.querySelector('img') : null;
            window.AppDB.addFavorite({ id: favId, type: 'live', name: favName, logo: favImg ? favImg.src : '', stream_id: favId });
            favBtn.classList.add('active');
            favBtn.querySelector('svg').setAttribute('fill', 'currentColor');
          }
        }
        return;
      }

      // Handle play button on live cards
      var playBtn = e.target.closest('.content-card-play-btn');
      if (playBtn) {
        e.stopPropagation();
        var card = playBtn.closest('.content-card');
        if (card && card.dataset.type === 'live' && window.PlayerManager && api) {
          var id = card.dataset.id;
          var streamUrls = api.getStreamUrlFallbacks(id, 'live');
          window.PlayerManager.play({ id: id, name: card.querySelector('.content-card-title').textContent, streamUrl: streamUrls[0], streamUrlFallbacks: streamUrls.slice(1), type: 'live' });
        }
        return;
      }

      var card = e.target.closest('.content-card, .wide-card');
      if (!card) {
        var seeAll = e.target.closest('.content-row-more');
        if (seeAll && seeAll.dataset.navigate && window.AppRouter) {
          window.AppRouter.navigate(seeAll.dataset.navigate);
        }
        return;
      }
      var type = card.dataset.type;
      var id = card.dataset.id;
      if (!type || !id) return;

      if (type === 'live') {
        if (window.PlayerManager && api) {
          var streamUrls = api.getStreamUrlFallbacks(id, 'live');
          window.PlayerManager.play({ id: id, name: card.querySelector('.content-card-title').textContent, streamUrl: streamUrls[0], streamUrlFallbacks: streamUrls.slice(1), type: 'live' });
        }
      } else if (type === 'movie') {
        if (window.AppRouter) window.AppRouter.navigate('movies', { action: 'detail', id: id });
      } else if (type === 'series') {
        if (window.AppRouter) window.AppRouter.navigate('series', { action: 'detail', id: id });
      }
    }

    container.addEventListener('click', handleClick);
    listeners.push({ el: container, fn: handleClick, ev: 'click' });

    var contentEl = container.querySelector('#home-content');
    var skeletonsEl = container.querySelector('#home-skeletons');

    Promise.all([
      window.AppDB ? window.AppDB.getHistory() : Promise.resolve([]),
      api.getLiveStreams().catch(function () { return []; }),
      api.getVodStreams().catch(function () { return []; }),
      api.getSeries().catch(function () { return []; })
    ]).then(function (results) {
      var history = results[0] || [];
      var liveStreams = results[1] || [];
      var movies = results[2] || [];
      var series = results[3] || [];

      var recommended = []
        .concat(liveStreams.slice(0, 3).map(function (s) { s.type = 'live'; return s; }))
        .concat(movies.slice(0, 6).map(function (s) { s.type = 'movie'; return s; }))
        .concat(series.slice(0, 6).map(function (s) { s.type = 'series'; return s; }))
        .sort(function () { return Math.random() - 0.5; })
        .slice(0, PAGE_SIZE);

      var html = '';
      html += continueWatchingRow(history);
      html += rowHTML('home.liveTV', liveStreams.slice(0, PAGE_SIZE), 'live', 'live-tv');
      html += rowHTML('home.trending', movies.slice(0, PAGE_SIZE), 'movie', 'movies');
      html += rowHTML('home.series', series.slice(0, PAGE_SIZE), 'series', 'series');
      html += rowHTML('home.recommended', recommended, recommended.length > 0 ? recommended[0].type : 'movie', '');

      contentEl.innerHTML = html;
      if (skeletonsEl) skeletonsEl.remove();
    }).catch(function () {
      if (skeletonsEl) skeletonsEl.remove();
      contentEl.innerHTML = '<div class="empty-state"><div class="empty-state-title">' + (window.i18n ? window.i18n.t('common.error') : 'Error') + '</div></div>';
    });

    return function destroy() {
      listeners.forEach(function (l) { l.el.removeEventListener(l.ev, l.fn); });
    };
  }

  window.Pages = window.Pages || {};
  window.Pages.home = { render: render };
})();