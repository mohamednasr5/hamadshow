/**
 * NASR LIVE - EPG Component
 * Electronic Program Guide overlay and timeline renderer
 */
(function () {
  'use strict';

  var _overlay = null;
  var _visible = false;
  var _currentStreamId = null;

  function getOverlay() {
    if (!_overlay) {
      _overlay = document.getElementById('epg-overlay');
    }
    return _overlay;
  }

  function ensureOverlay() {
    var el = getOverlay();
    if (!el) {
      el = document.createElement('div');
      el.id = 'epg-overlay';
      el.style.cssText = 'position:fixed;inset:0;z-index:80000;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);display:none;flex-direction:column;overflow:hidden;';
      document.body.appendChild(el);
      _overlay = el;
    }
    return el;
  }

  function formatEPGTime(timestamp) {
    var d = new Date(timestamp * 1000);
    var now = new Date();
    var isToday = d.toDateString() === now.toDateString();
    var tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    var isTomorrow = d.toDateString() === tomorrow.toDateString();

    var hours = d.getHours();
    var minutes = d.getMinutes();
    var ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    var timeStr = hours + ':' + String(minutes).padStart(2, '0') + ' ' + ampm;

    if (isToday) return 'Today, ' + timeStr;
    if (isTomorrow) return 'Tomorrow, ' + timeStr;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ', ' + timeStr;
  }

  function renderEPGTimeline(programs) {
    if (!programs || !programs.length) {
      return '<div style="text-align:center;padding:60px 20px;color:#666;">No program data available</div>';
    }

    var now = Math.floor(Date.now() / 1000);
    var html = '<div class="epg-timeline" style="position:relative;padding:8px 0;">';

    var lastDateLabel = '';
    for (var i = 0; i < programs.length; i++) {
      var prog = programs[i];
      var startTs = parseInt(prog.start, 10) || 0;
      var endTs = parseInt(prog.end, 10) || 0;
      var title = prog.title || 'No Title';
      var desc = prog.description || '';
      var isCurrent = startTs <= now && endTs > now;
      var isPast = endTs <= now;

      var startDate = new Date(startTs * 1000);
      var dateLabel = startDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
      if (dateLabel !== lastDateLabel) {
        html += '<div class="epg-date-label" style="padding:8px 20px;margin-top:8px;color:#3b82f6;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">' + dateLabel + '</div>';
        lastDateLabel = dateLabel;
      }

      var opacity = isPast ? 'opacity:0.5;' : '';
      var bgStyle = isCurrent
        ? 'background:rgba(59,130,246,0.12);border-left:3px solid #3b82f6;'
        : 'background:rgba(255,255,255,0.04);border-left:3px solid transparent;';

      html += '<div class="epg-program-item' + (isCurrent ? ' epg-current' : '') + '" style="display:flex;gap:14px;padding:14px 16px 14px 20px;margin:4px 0;border-radius:0 10px 10px 0;cursor:default;' + bgStyle + opacity + 'transition:background 0.2s;">' +
        '<div style="flex-shrink:0;width:100px;">' +
        '<div style="color:' + (isCurrent ? '#3b82f6' : '#999') + ';font-size:12px;font-weight:600;">' + formatShortTime(startTs) + '</div>' +
        '<div style="color:#666;font-size:11px;margin-top:2px;">' + formatShortTime(endTs) + '</div>' +
        '</div>' +
        '<div style="flex:1;min-width:0;">' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
        '<p style="margin:0;color:' + (isCurrent ? '#fff' : '#ccc') + ';font-size:14px;font-weight:' + (isCurrent ? '600' : '400') + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(title) + '</p>' +
        (isCurrent ? '<span style="flex-shrink:0;background:#3b82f6;color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px;letter-spacing:0.5px;">NOW</span>' : '') +
        '</div>' +
        (desc ? '<p style="margin:4px 0 0;color:#777;font-size:12px;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">' + escapeHtml(desc) + '</p>' : '') +
        (isCurrent ? '<div class="epg-progress" style="margin-top:8px;height:3px;background:rgba(59,130,246,0.2);border-radius:2px;overflow:hidden;"><div style="height:100%;background:#3b82f6;border-radius:2px;width:' + getProgressPercent(startTs, endTs) + '%;transition:width 60s linear;"></div></div>' : '') +
        '</div>' +
        '</div>';
    }

    html += '</div>';
    return html;
  }

  function formatShortTime(timestamp) {
    var d = new Date(timestamp * 1000);
    var hours = d.getHours();
    var minutes = d.getMinutes();
    var ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return hours + ':' + String(minutes).padStart(2, '0') + ' ' + ampm;
  }

  function getProgressPercent(start, end) {
    var now = Math.floor(Date.now() / 1000);
    var total = end - start;
    if (total <= 0) return 0;
    var elapsed = now - start;
    if (elapsed < 0) return 0;
    if (elapsed > total) return 100;
    return Math.round((elapsed / total) * 100);
  }

  function showEPG(streamId, channelName) {
    var overlay = ensureOverlay();
    _currentStreamId = streamId;

    var now = Math.floor(Date.now() / 1000);
    var currentProgram = 'No Information';
    var programs = [];

    if (window.EPGData && streamId) {
      var epgChannelId = null;
      var chEl = document.querySelector('[data-stream-id="' + streamId + '"][data-epg-channel-id]');
      if (chEl) epgChannelId = chEl.getAttribute('data-epg-channel-id');

      if (epgChannelId) {
        programs = window.EPGData.getPrograms(epgChannelId) || [];
        var cur = window.EPGData.getCurrentProgram(epgChannelId);
        if (cur && cur.title) currentProgram = cur.title;
      }
    }

    overlay.innerHTML =
      '<div class="epg-header" style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.08);flex-shrink:0;">' +
        '<div style="display:flex;align-items:center;gap:12px;">' +
          '<button id="epg-close-btn" style="background:none;border:none;color:#888;cursor:pointer;padding:8px;border-radius:8px;display:flex;transition:background 0.2s;" onmouseover="this.style.background=\'rgba(255,255,255,0.1)\'" onmouseout="this.style.background=\'none\'">' +
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>' +
          '</button>' +
          '<div>' +
            '<h3 style="margin:0;color:#fff;font-size:16px;font-weight:600;">Program Guide</h3>' +
            '<p style="margin:2px 0 0;color:#888;font-size:12px;">' + escapeHtml(channelName || '') + '</p>' +
          '</div>' +
        '</div>' +
        '<div id="epg-now-badge" style="display:flex;align-items:center;gap:8px;padding:6px 14px;background:rgba(59,130,246,0.12);border-radius:8px;">' +
          '<span style="width:6px;height:6px;border-radius:50%;background:#3b82f6;display:inline-block;animation:epg-pulse-dot 2s infinite;"></span>' +
          '<span style="color:#3b82f6;font-size:12px;font-weight:600;">' + escapeHtml(currentProgram) + '</span>' +
        '</div>' +
      '</div>' +
      '<div id="epg-content" style="flex:1;overflow-y:auto;padding:12px 16px;">' +
        '<div style="text-align:center;padding:40px 20px;"><div class="skeleton-pulse" style="width:60%;height:16px;background:#2a2a3e;border-radius:4px;margin:0 auto 12px;"></div>' +
        '<div class="skeleton-pulse" style="width:80%;height:14px;background:#2a2a3e;border-radius:4px;margin:0 auto 12px;"></div>' +
        '<div class="skeleton-pulse" style="width:50%;height:14px;background:#2a2a3e;border-radius:4px;margin:0 auto;"></div></div>' +
      '</div>';

    if (!document.getElementById('epg-pulse-style')) {
      var style = document.createElement('style');
      style.id = 'epg-pulse-style';
      style.textContent = '@keyframes epg-pulse-dot{0%,100%{opacity:1}50%{opacity:0.3}}';
      document.head.appendChild(style);
    }

    overlay.style.display = 'flex';
    _visible = true;

    var closeBtn = document.getElementById('epg-close-btn');
    closeBtn.addEventListener('click', hideEPG);

    function onKey(e) {
      if (e.key === 'Escape' || e.key === 'Backspace') {
        e.preventDefault();
        hideEPG();
        document.removeEventListener('keydown', onKey);
      }
    }
    document.addEventListener('keydown', onKey);
    overlay._keyHandler = onKey;

    if (programs.length > 0) {
      var content = document.getElementById('epg-content');
      if (content) {
        setTimeout(function () {
          content.innerHTML = renderEPGTimeline(programs);
          scrollToCurrentProgram(content);
        }, 100);
      }
    }
  }

  function scrollToCurrentProgram(container) {
    var current = container.querySelector('.epg-current');
    if (current) {
      setTimeout(function () {
        current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    }
  }

  function hideEPG() {
    var overlay = getOverlay();
    if (!overlay) return;
    if (overlay._keyHandler) {
      document.removeEventListener('keydown', overlay._keyHandler);
      overlay._keyHandler = null;
    }
    overlay.style.display = 'none';
    _visible = false;
    _currentStreamId = null;
  }

  function isVisible() {
    return _visible;
  }

  function updateNowBadge() {
    if (!_visible || !_currentStreamId) return;
    var badge = document.getElementById('epg-now-badge');
    if (!badge || !window.EPGData) return;

    var epgChannelId = null;
    var chEl = document.querySelector('[data-stream-id="' + _currentStreamId + '"][data-epg-channel-id]');
    if (chEl) epgChannelId = chEl.getAttribute('data-epg-channel-id');
    if (!epgChannelId) return;

    var cur = window.EPGData.getCurrentProgram(epgChannelId);
    if (cur && cur.title) {
      badge.querySelector('span:last-child').textContent = cur.title;
    }
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  window.EPGComponent = {
    showEPG: showEPG,
    hideEPG: hideEPG,
    renderEPGTimeline: renderEPGTimeline,
    formatEPGTime: formatEPGTime,
    isVisible: isVisible,
    updateNowBadge: updateNowBadge
  };
})();