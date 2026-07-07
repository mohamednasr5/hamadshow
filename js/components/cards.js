/**
 * NASR LIVE - Card Components
 * Movie, series, channel, episode card generators and skeleton loaders
 */
(function () {
  'use strict';

  function escapeAttr(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function ratingBadge(rating) {
    if (!rating || rating <= 0) return '';
    var color = rating >= 7 ? '#10b981' : rating >= 5 ? '#f59e0b' : '#ef4444';
    return '<span style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,0.7);color:' + color + ';font-size:11px;font-weight:700;padding:3px 7px;border-radius:6px;backdrop-filter:blur(4px);display:flex;align-items:center;gap:3px;">' +
      '<svg width="10" height="10" viewBox="0 0 24 24" fill="' + color + '" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/></svg>' +
      parseFloat(rating).toFixed(1) + '</span>';
  }

  function yearBadge(year) {
    if (!year) return '';
    return '<span style="position:absolute;top:8px;left:8px;background:rgba(0,0,0,0.7);color:#ccc;font-size:11px;font-weight:600;padding:3px 8px;border-radius:6px;backdrop-filter:blur(4px);">' + escapeHtml(String(year)) + '</span>';
  }

  function createMovieCard(movie) {
    var icon = movie.stream_icon || '';
    var name = movie.name || 'Untitled';
    var rating = movie.rating || 0;
    var year = movie.year || '';

    return '<div class="card movie-card" data-stream-id="' + escapeAttr(String(movie.stream_id || '')) + '" data-type="movie" data-focusable tabindex="0" role="button" aria-label="' + escapeAttr(name) + '">' +
      '<div class="card-poster" style="position:relative;aspect-ratio:2/3;border-radius:12px;overflow:hidden;background:#1a1a2e;cursor:pointer;">' +
      '<img data-src="' + escapeAttr(icon) + '" alt="' + escapeAttr(name) + '" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" onerror="this.style.display=\'none\'">' +
      '<div style="position:absolute;inset:0;background:linear-gradient(0deg,rgba(0,0,0,0.85) 0%,rgba(0,0,0,0.2) 40%,transparent 60%);pointer-events:none;"></div>' +
      ratingBadge(rating) +
      yearBadge(year) +
      '<div style="position:absolute;bottom:0;left:0;right:0;padding:12px;">' +
      '<p class="card-title" style="margin:0;color:#fff;font-size:13px;font-weight:600;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;text-shadow:0 1px 4px rgba(0,0,0,0.6);">' + escapeHtml(name) + '</p>' +
      '</div>' +
      '</div>' +
      '</div>';
  }

  function createSeriesCard(series) {
    var icon = series.cover || series.stream_icon || '';
    var name = series.name || 'Untitled';
    var rating = series.rating || 0;

    return '<div class="card series-card" data-series-id="' + escapeAttr(String(series.series_id || '')) + '" data-type="series" data-focusable tabindex="0" role="button" aria-label="' + escapeAttr(name) + '">' +
      '<div class="card-poster" style="position:relative;aspect-ratio:2/3;border-radius:12px;overflow:hidden;background:#1a1a2e;cursor:pointer;">' +
      '<img data-src="' + escapeAttr(icon) + '" alt="' + escapeAttr(name) + '" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" onerror="this.style.display=\'none\'">' +
      '<div style="position:absolute;inset:0;background:linear-gradient(0deg,rgba(0,0,0,0.85) 0%,rgba(0,0,0,0.2) 40%,transparent 60%);pointer-events:none;"></div>' +
      ratingBadge(rating) +
      '<div style="position:absolute;bottom:0;left:0;right:0;padding:12px;">' +
      '<p class="card-title" style="margin:0;color:#fff;font-size:13px;font-weight:600;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;text-shadow:0 1px 4px rgba(0,0,0,0.6);">' + escapeHtml(name) + '</p>' +
      '</div>' +
      '</div>' +
      '</div>';
  }

  function createChannelCard(channel) {
    var icon = channel.stream_icon || '';
    var name = channel.name || 'Unknown Channel';
    var epgName = '';
    if (window.EPGData && channel.epg_channel_id) {
      var epg = window.EPGData.getCurrentProgram(channel.epg_channel_id);
      if (epg) epgName = epg.title || '';
    }

    return '<div class="card channel-card" data-stream-id="' + escapeAttr(String(channel.stream_id || '')) + '" data-type="channel" data-epg-channel-id="' + escapeAttr(String(channel.epg_channel_id || '')) + '" data-focusable tabindex="0" role="button" aria-label="' + escapeAttr(name) + '" style="flex-shrink:0;width:140px;">' +
      '<div style="text-align:center;padding:14px 8px;background:rgba(255,255,255,0.04);border-radius:12px;cursor:pointer;transition:background 0.2s;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;">' +
      '<div style="width:64px;height:64px;border-radius:50%;overflow:hidden;background:#1a1a2e;display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
      '<img data-src="' + escapeAttr(icon) + '" alt="' + escapeAttr(name) + '" style="width:100%;height:100%;object-fit:contain;padding:4px;" loading="lazy" onerror="this.style.display=\'none\';this.parentNode.insertAdjacentHTML(\'beforeend\',\'<span style=\'color:#555;font-size:24px;font-weight:700\'>\'+this.getAttribute(\'alt\').charAt(0).toUpperCase()+\'</span>\')">' +
      '</div>' +
      '<p class="card-title" style="margin:0;color:#ddd;font-size:12px;font-weight:500;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">' + escapeHtml(name) + '</p>' +
      (epgName ? '<p style="margin:0;color:#888;font-size:10px;line-height:1.2;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden;">' + escapeHtml(epgName) + '</p>' : '') +
      '</div>' +
      '</div>';
  }

  function createChannelCardWide(channel) {
    var icon = channel.stream_icon || '';
    var name = channel.name || 'Unknown Channel';
    var epgName = '';
    if (window.EPGData && channel.epg_channel_id) {
      var epg = window.EPGData.getCurrentProgram(channel.epg_channel_id);
      if (epg) epgName = epg.title || '';
    }

    return '<div class="card channel-card-wide" data-stream-id="' + escapeAttr(String(channel.stream_id || '')) + '" data-type="channel" data-epg-channel-id="' + escapeAttr(String(channel.epg_channel_id || '')) + '" data-focusable tabindex="0" role="button" aria-label="' + escapeAttr(name) + '" style="flex-shrink:0;width:240px;">' +
      '<div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:rgba(255,255,255,0.04);border-radius:12px;cursor:pointer;transition:background 0.2s;">' +
      '<div style="width:48px;height:48px;border-radius:10px;overflow:hidden;background:#1a1a2e;display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
      '<img data-src="' + escapeAttr(icon) + '" alt="' + escapeAttr(name) + '" style="width:100%;height:100%;object-fit:contain;padding:3px;" loading="lazy" onerror="this.style.display=\'none\'">' +
      '</div>' +
      '<div style="flex:1;min-width:0;">' +
      '<p class="card-title" style="margin:0;color:#ddd;font-size:13px;font-weight:600;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(name) + '</p>' +
      (epgName ? '<p style="margin:2px 0 0;color:#888;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(epgName) + '</p>' : '') +
      '</div>' +
      '</div>' +
      '</div>';
  }

  function createEpisodeCard(episode) {
    var num = episode.episode_num || '';
    var title = episode.title || 'Episode ' + num;
    var duration = episode.duration_secs || 0;
    var ext = (episode.container_extension || '').toLowerCase();
    var isPlayable = ['mp4', 'mkv', 'm4v', 'avi', 'mov'].indexOf(ext) > -1;

    var durationStr = '';
    if (duration > 0) {
      var m = Math.floor(duration / 60);
      var s = Math.floor(duration % 60);
      durationStr = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    }

    return '<div class="card episode-card" data-episode-id="' + escapeAttr(String(episode.episode_id || '')) + '" data-type="episode" data-focusable tabindex="0" role="button" aria-label="' + escapeAttr(title) + '">' +
      '<div style="display:flex;align-items:center;gap:14px;padding:14px 16px;background:rgba(255,255,255,0.03);border-radius:12px;cursor:pointer;transition:background 0.2s;">' +
      '<div style="width:40px;height:40px;border-radius:10px;background:rgba(59,130,246,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#3b82f6;font-size:14px;font-weight:700;">' +
      (num ? escapeHtml(String(num)) : '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21"/></svg>') +
      '</div>' +
      '<div style="flex:1;min-width:0;">' +
      '<p class="card-title" style="margin:0;color:#eee;font-size:14px;font-weight:500;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(title) + '</p>' +
      (episode.info ? '<p style="margin:3px 0 0;color:#777;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(episode.info) + '</p>' : '') +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:12px;flex-shrink:0;">' +
      (durationStr ? '<span style="color:#666;font-size:12px;">' + durationStr + '</span>' : '') +
      '<div style="width:34px;height:34px;border-radius:50%;background:rgba(59,130,246,0.15);display:flex;align-items:center;justify-content:center;">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="#3b82f6"><polygon points="5 3 19 12 5 21"/></svg>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</div>';
  }

  function createSkeletonCard(type) {
    if (type === 'channel') {
      return '<div class="skeleton-card" style="flex-shrink:0;width:140px;"><div style="text-align:center;padding:14px 8px;background:rgba(255,255,255,0.04);border-radius:12px;">' +
        '<div class="skeleton-pulse" style="width:64px;height:64px;border-radius:50%;background:#2a2a3e;margin:0 auto 10px;"></div>' +
        '<div class="skeleton-pulse" style="width:80px;height:14px;border-radius:4px;background:#2a2a3e;margin:0 auto;"></div></div></div>';
    }
    if (type === 'episode') {
      return '<div class="skeleton-card"><div style="display:flex;align-items:center;gap:14px;padding:14px 16px;background:rgba(255,255,255,0.03);border-radius:12px;">' +
        '<div class="skeleton-pulse" style="width:40px;height:40px;border-radius:10px;background:#2a2a3e;flex-shrink:0;"></div>' +
        '<div style="flex:1;"><div class="skeleton-pulse" style="width:60%;height:14px;border-radius:4px;background:#2a2a3e;margin-bottom:8px;"></div>' +
        '<div class="skeleton-pulse" style="width:40%;height:12px;border-radius:4px;background:#2a2a3e;"></div></div></div></div>';
    }
    return '<div class="skeleton-card" style="width:150px;flex-shrink:0;"><div class="skeleton-pulse" style="aspect-ratio:2/3;border-radius:12px;background:#2a2a3e;"></div></div>';
  }

  function createSkeletonRow(count, type) {
    if (typeof type === 'undefined') type = 'movie';
    if (typeof count === 'undefined') count = 6;
    var html = '';
    for (var i = 0; i < count; i++) {
      html += createSkeletonCard(type);
    }
    return html;
  }

  function createContentRow(title, items, cardType, seeAllHref) {
    var cardHtml = '';
    var itemsArray = Array.isArray(items) ? items : [];

    if (cardType === 'channel') {
      cardHtml = itemsArray.map(function (ch) { return createChannelCard(ch); }).join('');
    } else if (cardType === 'channel-wide') {
      cardHtml = itemsArray.map(function (ch) { return createChannelCardWide(ch); }).join('');
    } else if (cardType === 'episode') {
      cardHtml = itemsArray.map(function (ep) { return createEpisodeCard(ep); }).join('');
    } else if (cardType === 'series') {
      cardHtml = itemsArray.map(function (s) { return createSeriesCard(s); }).join('');
    } else {
      cardHtml = itemsArray.map(function (m) { return createMovieCard(m); }).join('');
    }

    var seeAll = seeAllHref
      ? '<a href="' + escapeAttr(seeAllHref) + '" class="see-all-link" style="color:#3b82f6;font-size:13px;font-weight:500;text-decoration:none;white-space:nowrap;transition:color 0.2s;">See All</a>'
      : '';

    var isVertical = (cardType === 'episode');
    var scrollStyle = isVertical
      ? 'display:flex;flex-direction:column;gap:8px;max-height:400px;overflow-y:auto;padding-right:4px;'
      : 'display:flex;gap:12px;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;padding-bottom:8px;-webkit-overflow-scrolling:touch;scrollbar-width:none;';

    return '<section class="content-row" style="margin-bottom:32px;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;padding:0 4px;">' +
      '<h2 style="margin:0;font-size:18px;font-weight:700;color:#fff;">' + escapeHtml(title) + '</h2>' +
      seeAll +
      '</div>' +
      '<div class="content-row-scroll" style="' + scrollStyle + '">' +
      cardHtml +
      '</div>' +
      '</section>';
  }

  window.CardComponents = {
    createMovieCard: createMovieCard,
    createSeriesCard: createSeriesCard,
    createChannelCard: createChannelCard,
    createChannelCardWide: createChannelCardWide,
    createEpisodeCard: createEpisodeCard,
    createSkeletonCard: createSkeletonCard,
    createSkeletonRow: createSkeletonRow,
    createContentRow: createContentRow
  };
})();