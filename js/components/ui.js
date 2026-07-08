/**
 * NASR LIVE - UI Components
 * Toast notifications, modals, loading states, formatting utilities
 */
(function () {
  'use strict';

  const TOAST_ICONS = {
    success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
    error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
  };

  const TOAST_COLORS = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6'
  };

  function showToast(message, type, duration) {
    if (typeof type === 'undefined') type = 'info';
    if (typeof duration === 'undefined') duration = 3000;

    var container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:100000;display:flex;flex-direction:column;gap:10px;pointer-events:none;max-width:380px;width:calc(100% - 40px);';
      document.body.appendChild(container);
    }

    var toast = document.createElement('div');
    toast.style.cssText = 'pointer-events:auto;display:flex;align-items:center;gap:10px;padding:14px 16px;border-radius:10px;background:#1e1e2e;color:#fff;font-size:14px;font-family:inherit;box-shadow:0 8px 30px rgba(0,0,0,0.4);transform:translateX(120%);transition:transform 0.35s cubic-bezier(0.22,1,0.36,1);overflow:hidden;position:relative;';
    toast.innerHTML = '<span style="color:' + TOAST_COLORS[type] + ';flex-shrink:0;display:flex;">' + TOAST_ICONS[type] + '</span><span style="flex:1;line-height:1.4;">' + escapeHtml(message) + '</span>';

    var progress = document.createElement('div');
    progress.style.cssText = 'position:absolute;bottom:0;left:0;height:3px;background:' + TOAST_COLORS[type] + ';border-radius:0 0 10px 10px;animation:toast-progress ' + duration + 'ms linear forwards;';
    if (!document.getElementById('toast-progress-style')) {
      var style = document.createElement('style');
      style.id = 'toast-progress-style';
      style.textContent = '@keyframes toast-progress{from{width:100%}to{width:0%}}';
      document.head.appendChild(style);
    }
    toast.appendChild(progress);

    toast.addEventListener('click', function () {
      dismissToast(toast);
    });

    container.appendChild(toast);
    requestAnimationFrame(function () {
      toast.style.transform = 'translateX(0)';
    });

    var timer = setTimeout(function () {
      dismissToast(toast);
    }, duration);

    toast._dismiss = function () {
      clearTimeout(timer);
    };
  }

  function dismissToast(toast) {
    if (toast._dismissed) return;
    toast._dismissed = true;
    if (toast._dismiss) toast._dismiss();
    toast.style.transform = 'translateX(120%)';
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 350);
  }

  function showLoading(container) {
    var el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!el) return;
    el.innerHTML = '<div style="display:flex;flex-direction:column;gap:12px;padding:20px;align-items:center;justify-content:center;min-height:200px;">' +
      '<div class="skeleton-pulse" style="width:80%;height:20px;border-radius:6px;background:#2a2a3e;"></div>' +
      '<div class="skeleton-pulse" style="width:60%;height:20px;border-radius:6px;background:#2a2a3e;"></div>' +
      '<div class="skeleton-pulse" style="width:70%;height:20px;border-radius:6px;background:#2a2a3e;"></div>' +
      '<div class="skeleton-pulse" style="width:50%;height:20px;border-radius:6px;background:#2a2a3e;"></div>' +
      '</div>';
    if (!document.getElementById('skeleton-pulse-style')) {
      var style = document.createElement('style');
      style.id = 'skeleton-pulse-style';
      style.textContent = '@keyframes skeleton-pulse-anim{0%,100%{opacity:0.4}50%{opacity:1}}.skeleton-pulse{animation:skeleton-pulse-anim 1.5s ease-in-out infinite;}';
      document.head.appendChild(style);
    }
  }

  function showEmpty(container, message, icon) {
    var el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!el) return;
    if (!icon) icon = '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>';
    el.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;color:#888;text-align:center;gap:12px;">' +
      icon +
      '<p style="margin:0;font-size:15px;color:#aaa;">' + escapeHtml(message) + '</p></div>';
  }

  function showError(container, message, retryCallback) {
    var el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!el) return;
    var retryBtn = retryCallback ? '<button class="retry-btn" style="margin-top:16px;padding:10px 28px;border:none;border-radius:8px;background:#3b82f6;color:#fff;font-size:14px;cursor:pointer;font-family:inherit;transition:background 0.2s;">Retry</button>' : '';
    el.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;color:#888;text-align:center;gap:8px;">' +
      '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>' +
      '<p style="margin:0;font-size:15px;color:#ccc;">' + escapeHtml(message) + '</p>' +
      retryBtn +
      '</div>';
    if (retryCallback) {
      var btn = el.querySelector('.retry-btn');
      if (btn) btn.addEventListener('click', retryCallback);
    }
  }

  var _currentModal = null;

  function createModal(options) {
    closeModal();
    var overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:90000;display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;transition:opacity 0.25s;backdrop-filter:blur(4px);';

    var modal = document.createElement('div');
    modal.style.cssText = 'background:#1a1a2e;border-radius:16px;max-width:480px;width:100%;max-height:85vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.5);transform:scale(0.92);transition:transform 0.3s cubic-bezier(0.22,1,0.36,1);';

    var header = '<div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px 0;">' +
      '<h3 style="margin:0;font-size:18px;font-weight:600;color:#fff;">' + escapeHtml(options.title || '') + '</h3>' +
      '<button id="modal-close-btn" style="background:none;border:none;color:#888;cursor:pointer;padding:4px;display:flex;align-items:center;justify-content:center;border-radius:50%;width:32px;height:32px;transition:background 0.2s;" onmouseover="this.style.background=\'rgba(255,255,255,0.1)\'" onmouseout="this.style.background=\'none\'">' +
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>';

    var body = '<div style="padding:16px 24px 20px;overflow-y:auto;color:#ccc;font-size:14px;line-height:1.6;">' + (options.content || '') + '</div>';

    var footer = '';
    if (options.buttons && options.buttons.length) {
      footer = '<div style="padding:0 24px 20px;display:flex;gap:10px;justify-content:flex-end;">';
      options.buttons.forEach(function (btn) {
        var cls = btn.class || 'btn-default';
        footer += '<button class="modal-action-btn" style="padding:10px 22px;border:none;border-radius:8px;font-size:14px;cursor:pointer;font-family:inherit;font-weight:500;transition:all 0.2s;' +
          (cls === 'btn-primary' ? 'background:#3b82f6;color:#fff;' : cls === 'btn-danger' ? 'background:#ef4444;color:#fff;' : 'background:rgba(255,255,255,0.1);color:#ccc;') +
          '" data-btn-class="' + cls + '">' + escapeHtml(btn.text) + '</button>';
      });
      footer += '</div>';
    }

    modal.innerHTML = header + body + footer;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    requestAnimationFrame(function () {
      overlay.style.opacity = '1';
      modal.style.transform = 'scale(1)';
    });

    var closeBtn = modal.querySelector('#modal-close-btn');
    closeBtn.addEventListener('click', function () { closeModal(); });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal();
    });

    var actionBtns = modal.querySelectorAll('.modal-action-btn');
    actionBtns.forEach(function (btn, i) {
      btn.addEventListener('click', function () {
        if (options.buttons[i] && typeof options.buttons[i].onClick === 'function') {
          options.buttons[i].onClick();
        }
      });
    });

    function onKey(e) {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', onKey);
      }
    }
    document.addEventListener('keydown', onKey);

    _currentModal = { overlay: overlay, modal: modal, onKey: onKey, onClose: options.onClose };
  }

  function closeModal() {
    if (!_currentModal) return;
    var data = _currentModal;
    document.removeEventListener('keydown', data.onKey);
    data.overlay.style.opacity = '0';
    data.modal.style.transform = 'scale(0.92)';
    setTimeout(function () {
      if (data.overlay.parentNode) data.overlay.parentNode.removeChild(data.overlay);
    }, 260);
    if (typeof data.onClose === 'function') data.onClose();
    _currentModal = null;
  }

  function showConfirm(message, onConfirm, onCancel) {
    createModal({
      title: 'Confirm',
      content: '<p style="margin:0;">' + escapeHtml(message) + '</p>',
      buttons: [
        { text: 'Cancel', class: 'btn-default', onClick: function () { closeModal(); if (onCancel) onCancel(); } },
        { text: 'Confirm', class: 'btn-primary', onClick: function () { closeModal(); if (onConfirm) onConfirm(); } }
      ]
    });
  }

  function formatTime(totalSeconds) {
    if (typeof totalSeconds !== 'number' || isNaN(totalSeconds)) return '0:00';
    totalSeconds = Math.floor(totalSeconds);
    var hours = Math.floor(totalSeconds / 3600);
    var minutes = Math.floor((totalSeconds % 3600) / 60);
    var seconds = totalSeconds % 60;
    var mm = String(minutes).padStart(2, '0');
    var ss = String(seconds).padStart(2, '0');
    return hours > 0 ? hours + ':' + mm + ':' + ss : mm + ':' + ss;
  }

  function formatDuration(minutes) {
    if (typeof minutes !== 'number' || isNaN(minutes)) return '';
    var h = Math.floor(minutes / 60);
    var m = Math.round(minutes % 60);
    if (h > 0 && m > 0) return h + 'h ' + m + 'm';
    if (h > 0) return h + 'h';
    return m + 'm';
  }

  function formatDate(timestamp) {
    var d = new Date(timestamp * 1000);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function debounce(fn, delay) {
    var timer = null;
    return function () {
      var ctx = this, args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, delay);
    };
  }

  function throttle(fn, limit) {
    var lastCall = 0;
    var timer = null;
    return function () {
      var ctx = this, args = arguments;
      var now = Date.now();
      var remaining = limit - (now - lastCall);
      if (remaining <= 0) {
        if (timer) { clearTimeout(timer); timer = null; }
        lastCall = now;
        fn.apply(ctx, args);
      } else if (!timer) {
        timer = setTimeout(function () {
          lastCall = Date.now();
          timer = null;
          fn.apply(ctx, args);
        }, remaining);
      }
    };
  }

  function lazyLoadImages(container) {
    var el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!el) return;
    var images = el.querySelectorAll('img[data-src]');
    if (!images.length) return;

    if (!('IntersectionObserver' in window)) {
      images.forEach(function (img) {
        img.src = img.getAttribute('data-src');
        img.removeAttribute('data-src');
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var img = entry.target;
          img.src = img.getAttribute('data-src');
          img.removeAttribute('data-src');
          img.addEventListener('load', function () {
            img.style.opacity = '1';
          }, { once: true });
          img.addEventListener('error', function () {
            img.style.opacity = '1';
            img.alt = '';
          }, { once: true });
          observer.unobserve(img);
        }
      });
    }, { rootMargin: '200px 0px' });

    images.forEach(function (img) {
      img.style.opacity = '0';
      img.style.transition = 'opacity 0.3s';
      observer.observe(img);
    });
  }

  function detectPlatform() {
    var ua = navigator.userAgent || '';
    var w = window.screen.width;
    var h = window.screen.height;
    if (/tv|smarttv|tizen|webos|netcast|googletv|crkey/i.test(ua)) return 'tv';
    if (Math.min(w, h) >= 768 && Math.max(w, h) >= 1024) {
      var isMobileUA = /mobile|android|iphone|ipod/i.test(ua);
      if (isMobileUA) return 'tablet';
      if (w >= 1280) return 'desktop';
      return 'tablet';
    }
    if (/mobile|android(?!.*tablet)|iphone|ipod|iemobile|blackberry/i.test(ua)) return 'mobile';
    return 'desktop';
  }

  function isTV() {
    var ua = navigator.userAgent || '';
    if (/tv|smarttv|tizen|webos|netcast|googletv|crkey|viera|nettv|pov_tv|hbbtv/i.test(ua)) return true;
    if (navigator.userAgentData && navigator.userAgentData.platform === 'tv') return true;
    var w = window.screen.width;
    var h = window.screen.height;
    if (w >= 1920 && h >= 1080 && !/mobile|android|iphone|ipad/i.test(ua)) return true;
    return false;
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') return String(str);
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  window.UIComponents = {
    showToast: showToast,
    showLoading: showLoading,
    showEmpty: showEmpty,
    showError: showError,
    createModal: createModal,
    closeModal: closeModal,
    showConfirm: showConfirm,
    formatTime: formatTime,
    formatDuration: formatDuration,
    formatDate: formatDate,
    debounce: debounce,
    throttle: throttle,
    lazyLoadImages: lazyLoadImages,
    detectPlatform: detectPlatform,
    isTV: isTV
  };
})();