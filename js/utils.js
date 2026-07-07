/**
 * Hamad Show — Utility Functions Module
 * =======================================
 * A collection of pure-ish helper functions used across the application:
 * DOM helpers, string sanitisation, formatting, detection, and visual
 * utilities.
 *
 * @namespace HamadShow.Utils
 * @module utils
 */

(function (global) {
  'use strict';

  const NAMESPACE = 'HamadShow';

  // ---------------------------------------------------------------------------
  // HTML-entity map for XSS sanitisation
  // ---------------------------------------------------------------------------
  const ENTITY_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };

  // ---------------------------------------------------------------------------
  // Content-type → gradient map
  // ---------------------------------------------------------------------------
  const GRADIENT_MAP = {
    movie:       'linear-gradient(135deg, #e50914 0%, #b20710 100%)',
    series:      'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    live:        'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    sports:      'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    kids:        'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    documentary: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
  };

  // ---------------------------------------------------------------------------
  // Utils — public API
  // ---------------------------------------------------------------------------
  const Utils = Object.freeze({
    /* -----------------------------------------------------------------------
     * Functional helpers
     * --------------------------------------------------------------------- */

    /**
     * Debounce — delay execution until `delay` ms have elapsed since the
     * last invocation.
     *
     * @param {Function} fn    Function to debounce.
     * @param {number}   delay Delay in milliseconds.
     * @returns {Function} Debounced wrapper.
     */
    debounce(fn, delay) {
      if (typeof fn !== 'function') throw new TypeError('fn must be a function');
      let timer = null;
      return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
      };
    },

    /**
     * Throttle — execute at most once every `limit` ms.
     *
     * @param {Function} fn    Function to throttle.
     * @param {number}   limit Minimum interval in milliseconds.
     * @returns {Function} Throttled wrapper.
     */
    throttle(fn, limit) {
      if (typeof fn !== 'function') throw new TypeError('fn must be a function');
      let waiting = false;
      let lastArgs = null;
      return function (...args) {
        lastArgs = args;
        if (!waiting) {
          fn.apply(this, lastArgs);
          waiting = true;
          setTimeout(() => {
            waiting = false;
            // Flush the most-recent call that was queued while waiting.
            if (lastArgs) fn.apply(this, lastArgs);
          }, limit);
        }
      };
    },

    /* -----------------------------------------------------------------------
     * Sanitisation / validation
     * --------------------------------------------------------------------- */

    /**
     * Encode HTML special characters to prevent XSS injection.
     *
     * @param {string} str Raw string.
     * @returns {string} Sanitised string.
     */
    sanitize(str) {
      if (typeof str !== 'string') return String(str ?? '');
      return str.replace(/[&<>"'`=\/]/g, (ch) => ENTITY_MAP[ch] || ch);
    },

    /**
     * Recursively sanitise every string value in a plain object or array.
     *
     * @param {*} obj Any serialisable value.
     * @returns {*} Deep-cloned, sanitised value.
     */
    sanitizeObject(obj) {
      if (obj === null || typeof obj !== 'object') {
        return typeof obj === 'string' ? Utils.sanitize(obj) : obj;
      }
      if (Array.isArray(obj)) return obj.map((v) => Utils.sanitizeObject(v));
      const out = {};
      for (const [k, v] of Object.entries(obj)) {
        out[k] = Utils.sanitizeObject(v);
      }
      return out;
    },

    /**
     * Validate that an API response contains all required fields.
     *
     * @param {*}      data           Response payload to validate.
     * @param {string[]} requiredFields  Dot-notation fields (e.g. ['user_info.auth']).
     * @returns {{valid: boolean, missing: string[]}}
     */
    validateApiResponse(data, requiredFields) {
      const missing = [];

      for (const field of requiredFields) {
        let value = data;
        for (const segment of field.split('.')) {
          if (value == null || typeof value !== 'object') {
            value = undefined;
            break;
          }
          value = value[segment];
        }
        if (value === undefined || value === null) {
          missing.push(field);
        }
      }

      return { valid: missing.length === 0, missing };
    },

    /* -----------------------------------------------------------------------
     * Formatting
     * --------------------------------------------------------------------- */

    /**
     * Format a number of seconds as HH:MM:SS.
     *
     * @param {number} seconds
     * @returns {string}
     */
    formatTime(seconds) {
      if (!Number.isFinite(seconds) || seconds < 0) return '00:00:00';
      const totalSec = Math.floor(seconds);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
    },

    /**
     * Format a date string or timestamp into a human-readable relative time.
     *
     * @param {string|number|Date} dateStr Parseable date value.
     * @returns {string} e.g. "just now", "2m ago", "1h ago", "yesterday"
     */
    formatDate(dateStr) {
      const date = new Date(dateStr);
      if (Number.isNaN(date.getTime())) return '';

      const now = Date.now();
      const diffMs = now - date.getTime();
      const absDiff = Math.abs(diffMs);
      const isFuture = diffMs < 0;

      const seconds = Math.floor(absDiff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours   = Math.floor(minutes / 60);
      const days    = Math.floor(hours / 24);
      const weeks   = Math.floor(days / 7);
      const months  = Math.floor(days / 30);

      let label;
      if (seconds < 60) {
        label = 'just now';
      } else if (minutes < 60) {
        label = `${minutes}m ago`;
      } else if (hours < 24) {
        label = `${hours}h ago`;
      } else if (days < 2) {
        label = 'yesterday';
      } else if (days < 7) {
        label = `${days}d ago`;
      } else if (weeks < 5) {
        label = `${weeks}w ago`;
      } else {
        label = `${months}mo ago`;
      }

      return isFuture ? `in ${label.replace(' ago', '')}` : label;
    },

    /**
     * Format a duration in minutes as "Xh Ym".
     *
     * @param {number} minutes
     * @returns {string}
     */
    formatDuration(minutes) {
      if (!Number.isFinite(minutes) || minutes < 0) return '0m';
      const h = Math.floor(minutes / 60);
      const m = Math.round(minutes % 60);
      if (h === 0) return `${m}m`;
      if (m === 0) return `${h}h`;
      return `${h}h ${m}m`;
    },

    /* -----------------------------------------------------------------------
     * String / ID helpers
     * --------------------------------------------------------------------- */

    /**
     * Generate a UUID-v4-like unique identifier (crypto.randomUUID when
     * available, otherwise a Math.random fallback).
     *
     * @returns {string}
     */
    generateId() {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
      }
      // Fallback — good enough for non-security purposes.
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    },

    /**
     * Convert a string into a URL-friendly slug.
     *
     * @param {string} str
     * @returns {string}
     */
    slugify(str) {
      if (typeof str !== 'string') return '';
      return str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/--+/g, '-')
        .replace(/^-+|-+$/g, '');
    },

    /**
     * Truncate a string to `maxLen` characters, appending "..." if truncated.
     *
     * @param {string} str
     * @param {number} maxLen
     * @returns {string}
     */
    truncate(str, maxLen) {
      if (typeof str !== 'string') return '';
      if (str.length <= maxLen) return str;
      return str.slice(0, maxLen - 3) + '...';
    },

    /* -----------------------------------------------------------------------
     * Media / display helpers
     * --------------------------------------------------------------------- */

    /**
     * Determine the common aspect-ratio label for the given dimensions.
     *
     * @param {number} width
     * @param {number} height
     * @returns {string} e.g. "16:9", "4:3", "21:9", or the raw ratio.
     */
    getAspectRatio(width, height) {
      if (!width || !height) return '16:9';
      const ratio = width / height;
      const KNOWN = [
        [1.333, '4:3'],
        [1.778, '16:9'],
        [1.600, '16:10'],
        [2.333, '21:9'],
        [2.390, '2.39:1'],
        [0.5625, '9:16'],  // portrait video
      ];
      for (const [target, label] of KNOWN) {
        if (Math.abs(ratio - target) < 0.05) return label;
      }
      // Approximate as simplified fraction
      const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
      const d = gcd(Math.round(width), Math.round(height));
      return `${Math.round(width / d)}:${Math.round(height / d)}`;
    },

    /**
     * Return a CSS gradient string suitable for the given content type.
     *
     * @param {string} type  One of: movie, series, live, sports, kids, documentary.
     * @returns {string} CSS linear-gradient value.
     */
    getGradientColor(type) {
      return GRADIENT_MAP[type] || GRADIENT_MAP.movie;
    },

    /* -----------------------------------------------------------------------
     * Device / viewport detection
     * --------------------------------------------------------------------- */

    /**
     * Detect whether the current device is likely mobile.
     *
     * @returns {boolean}
     */
    isMobile() {
      if (typeof navigator === 'undefined') return false;
      const ua = navigator.userAgent || '';
      const hasTouchPoints = navigator.maxTouchPoints > 1;
      const mobileUA = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(ua);
      const smallScreen = window.innerWidth <= 768;
      return mobileUA || (hasTouchPoints && smallScreen);
    },

    /**
     * Detect whether the viewport is currently in landscape orientation.
     *
     * @returns {boolean}
     */
    isLandscape() {
      if (typeof screen === 'undefined') return false;
      // Prefer the orientation API; fall back to dimension comparison.
      if (screen.orientation && typeof screen.orientation.type === 'string') {
        return screen.orientation.type.includes('landscape');
      }
      return window.innerWidth > window.innerHeight;
    },

    /* -----------------------------------------------------------------------
     * Math helpers
     * --------------------------------------------------------------------- */

    /**
     * Linear interpolation between `start` and `end` by factor `t` (0-1).
     *
     * @param {number} start
     * @param {number} end
     * @param {number} t
     * @returns {number}
     */
    lerp(start, end, t) {
      return start + (end - start) * t;
    },

    /**
     * Clamp a number between `min` and `max` (inclusive).
     *
     * @param {number} val
     * @param {number} min
     * @param {number} max
     * @returns {number}
     */
    clamp(val, min, max) {
      return Math.min(Math.max(val, min), max);
    },

    /* -----------------------------------------------------------------------
     * DOM / interaction helpers
     * --------------------------------------------------------------------- */

    /**
     * Lazy-load a collection of elements using IntersectionObserver.
     * Calls `callback(element, observer)` for each element as it enters the
     * viewport.
     *
     * @param {NodeList|Array<Element>} elements
     * @param {Function}                callback  (element, observer) => void
     * @param {Object}                  [options] Passed to IntersectionObserver.
     * @returns {IntersectionObserver|null} The observer instance, or null when
     *          the API is unavailable.
     */
    lazyLoad(elements, callback, options) {
      if (typeof IntersectionObserver === 'undefined') {
        // Fallback: load everything immediately.
        for (const el of elements) callback(el, null);
        return null;
      }

      const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            callback(entry.target, observer);
            observer.unobserve(entry.target);
          }
        }
      }, { rootMargin: '200px', ...options });

      for (const el of elements) {
        observer.observe(el);
      }

      return observer;
    },

    /**
     * Create a Material Design–style ripple effect originating from the
     * pointer position inside the target element.
     *
     * @param {MouseEvent|TouchEvent} event
     */
    createRipple(event) {
      const target = event.currentTarget;
      if (!target || typeof target.getBoundingClientRect !== 'function') return;

      const rect = target.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      const x = (event.clientX ?? event.touches?.[0]?.clientX ?? rect.left + rect.width / 2) - rect.left - size / 2;
      const y = (event.clientY ?? event.touches?.[0]?.clientY ?? rect.top + rect.height / 2) - rect.top - size / 2;

      const ripple = document.createElement('span');
      ripple.className = 'ripple-effect';
      Object.assign(ripple.style, {
        position: 'absolute',
        width: `${size}px`,
        height: `${size}px`,
        left: `${x}px`,
        top: `${y}px`,
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.35)',
        transform: 'scale(0)',
        animation: 'ripple-anim 0.6s ease-out forwards',
        pointerEvents: 'none',
      });

      // Ensure the target is a positioning context.
      const pos = getComputedStyle(target).position;
      if (pos === 'static') target.style.position = 'relative';
      target.style.overflow = 'hidden';

      target.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    },

    /**
     * Copy text to the system clipboard. Falls back to a temporary
     * textarea + execCommand when the Clipboard API is unavailable.
     *
     * @param {string} text
     * @returns {Promise<boolean>} Whether the copy succeeded.
     */
    async copyToClipboard(text) {
      // Modern Clipboard API
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        try {
          await navigator.clipboard.writeText(text);
          return true;
        } catch {
          // Fall through to fallback.
        }
      }

      // Fallback: hidden textarea + execCommand
      return new Promise((resolve) => {
        try {
          const textarea = document.createElement('textarea');
          textarea.value = text;
          Object.assign(textarea.style, {
            position: 'fixed',
            left: '-9999px',
            top: '-9999px',
            opacity: '0',
          });
          document.body.appendChild(textarea);
          textarea.select();
          const ok = document.execCommand('copy');
          document.body.removeChild(textarea);
          resolve(ok);
        } catch {
          resolve(false);
        }
      });
    },
  });

  // ---------------------------------------------------------------------------
  // Register on the global namespace
  // ---------------------------------------------------------------------------
  global[NAMESPACE] = global[NAMESPACE] || {};
  global[NAMESPACE].Utils = Utils;
})(window);