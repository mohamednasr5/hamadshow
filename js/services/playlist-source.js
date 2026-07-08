/**
 * NASR LIVE - Playlist Source Manager
 *
 * Manages an OPTIONAL, additional content source loaded from a playlist
 * URL (M3U/M3U8/M3U Plus/XSPF/PLS/ASX/WPL), separate from the main
 * Xtream Codes connection. Stored (encrypted, like ServerConfig) only
 * on this device.
 *
 * Exposed globally as: window.PlaylistConfig
 *
 * @namespace PlaylistConfig
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'nasr_playlist_config';
  var _config = null; // { url, format, items, fetchedAt }

  function _save() {
    var payload = JSON.stringify(_config);
    var enc = window.Crypto ? window.Crypto.encrypt(payload) : payload;
    localStorage.setItem(STORAGE_KEY, enc);
  }

  function _load() {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      var dec = window.Crypto ? window.Crypto.decrypt(raw) : raw;
      return JSON.parse(dec);
    } catch (e) {
      console.warn('PlaylistConfig: failed to read saved playlist, clearing.', e);
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }

  async function _fetchAndParse(url) {
    var res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('تعذر تحميل رابط قائمة التشغيل (HTTP ' + res.status + ')');
    var text = await res.text();
    if (!window.PlaylistParser) throw new Error('محلل قوائم التشغيل غير متوفر');
    return window.PlaylistParser.parse(text);
  }

  var PlaylistConfig = {
    /** Restores a previously saved playlist (uses cached items; does not re-fetch). */
    init() {
      _config = _load();
      return !!_config;
    },

    hasConfig() {
      return !!_config;
    },

    /**
     * Fetches, parses, and saves a playlist URL, replacing any existing one.
     * @param {string} url
     * @returns {Promise<number>} number of items loaded
     */
    async connect(url) {
      url = (url || '').trim();
      if (!/^https?:\/\//i.test(url)) {
        throw new Error('يجب أن يبدأ الرابط بـ http:// أو https://');
      }
      var parsed = await _fetchAndParse(url);
      _config = { url: url, format: parsed.format, items: parsed.items, fetchedAt: Date.now() };
      _save();
      document.dispatchEvent(new CustomEvent('playlist:connected', { detail: { count: parsed.items.length, format: parsed.format } }));
      return parsed.items.length;
    },

    /** Re-fetches the currently saved playlist URL to refresh its channel list. */
    async refresh() {
      if (!_config || !_config.url) throw new Error('لا توجد قائمة تشغيل محفوظة');
      return this.connect(_config.url);
    },

    disconnect() {
      localStorage.removeItem(STORAGE_KEY);
      _config = null;
      document.dispatchEvent(new CustomEvent('playlist:disconnected'));
    },

    getItems() {
      return (_config && _config.items) || [];
    },

    getStatus() {
      return {
        hasConfig: !!_config,
        url: _config ? _config.url : null,
        format: _config ? _config.format : null,
        count: _config ? _config.items.length : 0,
        fetchedAt: _config ? _config.fetchedAt : null
      };
    }
  };

  window.PlaylistConfig = PlaylistConfig;
})();
