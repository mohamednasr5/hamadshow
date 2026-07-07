/**
 * Hamad Show — Application Configuration Module
 * ==============================================
 * Centralised configuration for the IPTV streaming application.
 * All tunables, API endpoint maps, cache TTLs, player defaults,
 * notification types and PWA metadata live here.
 *
 * @namespace HamadShow.Config
 * @module config
 */

(function (global) {
  'use strict';

  const NAMESPACE = 'HamadShow';

  // ---------------------------------------------------------------------------
  // Default application settings
  // ---------------------------------------------------------------------------
  const DEFAULT_SETTINGS = Object.freeze({
    serverUrl: '',
    username: '',
    password: '',
    appName: 'Hamad Show',
    primaryColor: '#e50914',
    secondaryColor: '#8b5cf6',
    language: 'ar',
    theme: 'dark',
  });

  // ---------------------------------------------------------------------------
  // Xtream Codes API endpoint paths (appended to user's server URL)
  // ---------------------------------------------------------------------------
  const API_ENDPOINTS = Object.freeze({
    login:          '/player_api.php?username={username}&password={password}',
    liveCategories: '/player_api.php?username={username}&password={password}&action=get_live_categories',
    vodCategories:  '/player_api.php?username={username}&password={password}&action=get_vod_categories',
    seriesCategories: '/player_api.php?username={username}&password={password}&action=get_series_categories',
    liveStreams:    '/player_api.php?username={username}&password={password}&action=get_live_streams',
    vodStreams:     '/player_api.php?username={username}&password={password}&action=get_vod_streams',
    seriesList:     '/player_api.php?username={username}&password={password}&action=get_series',
    vodInfo:        '/player_api.php?username={username}&password={password}&action=get_vod_info',
    seriesInfo:     '/player_api.php?username={username}&password={password}&action=get_series_info',
    episodes:       '/player_api.php?username={username}&password={password}&action=get_episode_info',
    epg:            '/player_api.php?username={username}&password={password}&action=get_simple_data_table&stream_id={streamId}',
    search:         '/player_api.php?username={username}&password={password}&action=search&query={query}',
  });

  // ---------------------------------------------------------------------------
  // Cache time-to-live values (milliseconds)
  // ---------------------------------------------------------------------------
  const CACHE_CONFIG = Object.freeze({
    categories: 30 * 60 * 1000,   // 30 minutes
    streams:    10 * 60 * 1000,   // 10 minutes
    epg:         5 * 60 * 1000,   // 5 minutes
  });

  // ---------------------------------------------------------------------------
  // Video player defaults
  // ---------------------------------------------------------------------------
  const PLAYER_CONFIG = Object.freeze({
    defaultPlaybackSpeed: 1,
    skipDuration:         10,       // seconds to skip forward / backward
    doubleTapDelay:       300,      // ms window for double-tap detection
    controlsTimeout:      3000,     // ms before auto-hiding controls
    minBufferLength:      5,        // minimum seconds to buffer ahead
  });

  // ---------------------------------------------------------------------------
  // Notification categories used throughout the UI
  // ---------------------------------------------------------------------------
  const NOTIFICATION_TYPES = Object.freeze({
    newMovie:     'new_movie',
    newSeries:    'new_series',
    newChannel:   'new_channel',
    maintenance:  'maintenance',
  });

  // ---------------------------------------------------------------------------
  // Progressive Web App metadata
  // ---------------------------------------------------------------------------
  const PWA_CONFIG = Object.freeze({
    shortName:    'HamadShow',
    name:         'Hamad Show IPTV',
    description:  'Stream live TV, movies, and series with Hamad Show.',
    themeColor:   '#e50914',
    backgroundColor: '#0a0a0a',
    display:      'standalone',
    orientation:  'any',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  });

  // ---------------------------------------------------------------------------
  // Storage key used to persist user settings
  // ---------------------------------------------------------------------------
  const SETTINGS_STORAGE_KEY = `${NAMESPACE}_settings`;

  // ---------------------------------------------------------------------------
  // Config — public API
  // ---------------------------------------------------------------------------
  class Config {
    /** @type {typeof DEFAULT_SETTINGS} */
    static DEFAULT_SETTINGS = DEFAULT_SETTINGS;

    /** @type {typeof API_ENDPOINTS} */
    static API_ENDPOINTS = API_ENDPOINTS;

    /** @type {typeof CACHE_CONFIG} */
    static CACHE_CONFIG = CACHE_CONFIG;

    /** @type {typeof PLAYER_CONFIG} */
    static PLAYER_CONFIG = PLAYER_CONFIG;

    /** @type {typeof NOTIFICATION_TYPES} */
    static NOTIFICATION_TYPES = NOTIFICATION_TYPES;

    /** @type {typeof PWA_CONFIG} */
    static PWA_CONFIG = PWA_CONFIG;

    /**
     * Load persisted settings from localStorage and merge them over the
     * built-in defaults so every key always has a sane value.
     *
     * @returns {Object} Merged settings object.
     */
    static loadSettings() {
      try {
        const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (!raw) return { ...DEFAULT_SETTINGS };

        const stored = JSON.parse(raw);
        // Only merge keys that exist in DEFAULT_SETTINGS — ignore stale keys.
        const merged = { ...DEFAULT_SETTINGS };
        for (const key of Object.keys(DEFAULT_SETTINGS)) {
          if (key in stored && stored[key] !== undefined) {
            merged[key] = stored[key];
          }
        }
        return merged;
      } catch {
        // Corrupted or unavailable storage — fall back silently.
        return { ...DEFAULT_SETTINGS };
      }
    }

    /**
     * Persist the given settings object to localStorage.
     * Only keys recognised by DEFAULT_SETTINGS are stored.
     *
     * @param {Object} settings
     */
    static saveSettings(settings) {
      try {
        const safe = {};
        for (const key of Object.keys(DEFAULT_SETTINGS)) {
          if (key in settings && settings[key] !== undefined) {
            safe[key] = settings[key];
          }
        }
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(safe));
      } catch {
        // Storage full or unavailable — silently degrade.
      }
    }

    /**
     * Build the fully-qualified API base URL from the stored settings.
     * Trailing slashes are normalised and the path is guaranteed to be
     * returned without a trailing slash.
     *
     * @param {Object}  [settings]  Optional settings override; defaults to
     *                              the merged result of loadSettings().
     * @returns {string} The base URL (protocol + host) without a trailing slash.
     */
    static getApiBaseUrl(settings) {
      const s = settings || Config.loadSettings();
      if (!s.serverUrl) return '';

      // Strip trailing slash(es) for consistent concatenation.
      return s.serverUrl.replace(/\/+$/, '');
    }
  }

  // ---------------------------------------------------------------------------
  // Register on the global namespace
  // ---------------------------------------------------------------------------
  global[NAMESPACE] = global[NAMESPACE] || {};
  global[NAMESPACE].Config = Config;
})(window);