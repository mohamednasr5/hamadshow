/**
 * Hamad Show — API Layer Module
 * ===============================
 * Abstraction over the Xtream Codes API. Handles authentication, content
 * fetching, caching, retries, timeouts, and response sanitisation.
 *
 * Depends on:
 *   - HamadShow.Config  (endpoint templates, cache TTLs, settings)
 *   - HamadShow.Utils   (sanitisation, validation helpers)
 *
 * @namespace HamadShow.API
 * @module api
 */

(function (global) {
  'use strict';

  var NAMESPACE = 'HamadShow';

  // Reference sibling modules — they must be loaded before this file.
  var Config = global[NAMESPACE] && global[NAMESPACE].Config;
  var Utils  = global[NAMESPACE] && global[NAMESPACE].Utils;

  if (!Config) {
    console.error('[HamadShow.API] HamadShow.Config is required but not found.');
    return;
  }
  if (!Utils) {
    console.error('[HamadShow.API] HamadShow.Utils is required but not found.');
    return;
  }

  // ---------------------------------------------------------------------------
  // Constants
  // ---------------------------------------------------------------------------

  /** Default request timeout in milliseconds. */
  var DEFAULT_TIMEOUT = 15000;

  /** Maximum number of automatic retries on network failure. */
  var MAX_RETRIES = 2;

  /** Exponential back-off delays between retries (ms). */
  var RETRY_DELAYS = [1000, 3000];

  /** Default EPG limit when none is provided. */
  var DEFAULT_EPG_LIMIT = 5;

  // ---------------------------------------------------------------------------
  // Simple EventEmitter mixin
  // ---------------------------------------------------------------------------

  /**
   * Create a lightweight event emitter attached to the given target object.
   * Provides `on`, `off`, and `emit` methods.
   *
   * @param {Object} target
   */
  function applyEvents(target) {
    /** @type {Object<string, Function[]>} */
    target._listeners = {};

    /**
     * Subscribe to an event.
     * @param {string}   event    Event name.
     * @param {Function} handler  Callback.
     * @returns {Function} Unsubscribe function.
     */
    target.on = function (event, handler) {
      if (typeof handler !== 'function') {
        throw new TypeError('Event handler must be a function');
      }
      (target._listeners[event] = target._listeners[event] || []).push(handler);
      return function () { target.off(event, handler); };
    };

    /**
     * Unsubscribe from an event.
     * @param {string}   event
     * @param {Function} handler
     */
    target.off = function (event, handler) {
      var list = target._listeners[event];
      if (!list) return;
      target._listeners[event] = list.filter(function (fn) { return fn !== handler; });
    };

    /**
     * Emit an event, invoking all registered handlers.
     * @param {string} event
     * @param {...*}   args  Arguments forwarded to handlers.
     */
    target.emit = function (event) {
      var list = target._listeners[event];
      if (!list || list.length === 0) return;
      var args = Array.prototype.slice.call(arguments, 1);
      // Clone the list to allow unsubscription inside a handler.
      list.slice().forEach(function (fn) {
        try { fn.apply(null, args); } catch (err) {
          console.error('[HamadShow.API] Error in event handler for "' + event + '":', err);
        }
      });
    };
  }

  // ---------------------------------------------------------------------------
  // API — class definition
  // ---------------------------------------------------------------------------

  /**
   * @classdesc
   * Xtream Codes API client with caching, retries, and automatic sanitisation.
   *
   * @constructor
   * @param {Object} [configOverride]  Optional config object; defaults to
   *                                   HamadShow.Config.
   */
  function API(configOverride) {
    /** @type {Object} Reference to the Config module (or override). */
    this._config = configOverride || Config;

    /** @type {string|null} Stored server URL. */
    this._serverUrl = null;

    /** @type {string|null} Stored username. */
    this._username = null;

    /** @type {string|null} Stored password. */
    this._password = null;

    /** @type {Object|null} Cached user_info from the login response. */
    this._userInfo = null;

    /** @type {Object|null} Cached server_info from the login response. */
    this._serverInfo = null;

    /** @type {boolean} Whether the client is currently authenticated. */
    this._authenticated = false;

    /** @type {Object<string, {data: *, expires: number}>} In-memory cache store. */
    this._cache = {};

    /** @type {AbortController[]} Active requests that can be cancelled. */
    this._activeControllers = [];

    /** @type {Object} Default headers sent with every request. */
    this._headers = {
      'Accept': 'application/json',
    };

    // Set up the event system on this instance.
    applyEvents(this);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Build a fully-qualified API URL.
   *
   * Resolves the endpoint template from Config.API_ENDPOINTS, replaces
   * `{username}` / `{password}` / any extra params, and prepends the base
   * server URL.
   *
   * @param  {string} endpointKey  Key in Config.API_ENDPOINTS.
   * @param  {Object} [extraParams={}]  Additional template replacements.
   * @returns {string} Absolute URL.
   * @throws {Error} If credentials or server URL are missing.
   */
  API.prototype._buildUrl = function (endpointKey, extraParams) {
    var base = (this._serverUrl || this._config.getApiBaseUrl()).replace(/\/+$/, '');
    if (!base) {
      throw new Error('Server URL is not configured. Please log in first.');
    }

    var template = this._config.API_ENDPOINTS[endpointKey];
    if (!template) {
      throw new Error('Unknown API endpoint: ' + endpointKey);
    }

    // Merge default credentials with any extra params.
    var params = {
      username: this._username || '',
      password: this._password || '',
    };
    if (extraParams && typeof extraParams === 'object') {
      for (var k in extraParams) {
        if (Object.prototype.hasOwnProperty.call(extraParams, k)) {
          params[k] = extraParams[k];
        }
      }
    }

    // Replace all {key} tokens in the template.
    var path = template.replace(/\{(\w+)\}/g, function (match, key) {
      return encodeURIComponent(params[key] !== undefined ? params[key] : match);
    });

    return base + path;
  };

  /**
   * Core fetch wrapper with timeout, retry, validation, and sanitisation.
   *
   * @param  {string} url             Fully-qualified URL to fetch.
   * @param  {Object} [options={}]    Fetch options (method, body, etc.).
   * @param  {number} [timeout=15000] Request timeout in ms.
   * @param  {string[]} [requiredFields] Fields to validate via Utils.validateApiResponse.
   * @returns {Promise<*>} Parsed, sanitised response data.
   */
  API.prototype._request = function (url, options, timeout, requiredFields) {
    var self = this;

    // Merge caller options with defaults.
    var opts = Object.assign({}, {
      method: 'GET',
      headers: Object.assign({}, self._headers),
    }, options || {});

    var timeoutMs = (typeof timeout === 'number') ? timeout : DEFAULT_TIMEOUT;

    self.emit('requestStart', url);

    /**
     * Attempt a single fetch attempt.
     * @param {number} attempt  Current attempt index (0-based).
     * @returns {Promise<*>}
     */
    function attempt(attempt) {
      var controller = new AbortController();
      self._activeControllers.push(controller);

      // Attach signal to the request.
      opts.signal = controller.signal;

      // Set up the timeout race.
      var timeoutId = setTimeout(function () {
        controller.abort();
      }, timeoutMs);

      return fetch(url, opts)
        .then(function (response) {
          clearTimeout(timeoutId);
          self._removeController(controller);

          // Non-OK HTTP status.
          if (!response.ok) {
            var statusText = response.statusText || 'Unknown error';
            throw new Error('HTTP ' + response.status + ': ' + statusText);
          }

          // Parse JSON automatically.
          return response.json();
        })
        .then(function (data) {
          // Validate required fields when specified.
          if (requiredFields && requiredFields.length > 0) {
            var result = Utils.validateApiResponse(data, requiredFields);
            if (!result.valid) {
              throw new Error(
                'Invalid API response — missing required field(s): ' +
                result.missing.join(', ')
              );
            }
          }

          // Sanitise all response data before returning.
          return Utils.sanitizeObject(data);
        })
        .catch(function (err) {
          clearTimeout(timeoutId);
          self._removeController(controller);

          // If the request was explicitly aborted (by us or the caller),
          // do NOT retry — propagate immediately.
          if (err.name === 'AbortError') {
            throw err;
          }

          // Retry on network errors only (not on validation/HTTP errors).
          var isNetworkError = !err.message || (
            err.name !== 'TypeError' &&
            !err.message.startsWith('HTTP ')
          );

          if (isNetworkError && attempt < MAX_RETRIES) {
            var delay = RETRY_DELAYS[attempt] || (attempt + 1) * 1000;
            console.warn(
              '[HamadShow.API] Request failed (attempt ' + (attempt + 1) + '/' +
              (MAX_RETRIES + 1) + '). Retrying in ' + delay + 'ms…',
              err.message
            );
            return new Promise(function (resolve) {
              setTimeout(resolve, delay);
            }).then(function () {
              return attempt(attempt + 1);
            });
          }

          // Final failure — wrap with a cleaner message and re-throw.
          var msg = err.message || 'Unknown error';
          if (err.name === 'AbortError' || msg.includes('abort')) {
            throw new Error('Request timed out after ' + timeoutMs + 'ms');
          }
          throw new Error(msg);
        });
    }

    return attempt(0)
      .then(function (data) {
        self.emit('requestEnd', url);
        return data;
      })
      .catch(function (err) {
        self.emit('requestEnd', url);
        self.emit('error', { url: url, error: err });
        throw err;
      });
  };

  /**
   * Remove an AbortController from the active list.
   * @param {AbortController} controller
   */
  API.prototype._removeController = function (controller) {
    var idx = this._activeControllers.indexOf(controller);
    if (idx !== -1) {
      this._activeControllers.splice(idx, 1);
    }
  };

  /**
   * Retrieve a value from the in-memory cache.
   *
   * @param  {string} key  Cache key.
   * @returns {*|null} Cached data, or null if expired / not found.
   */
  API.prototype._cacheGet = function (key) {
    var entry = this._cache[key];
    if (!entry) return null;
    if (Date.now() > entry.expires) {
      delete this._cache[key];
      return null;
    }
    return entry.data;
  };

  /**
   * Store a value in the in-memory cache with a time-to-live.
   *
   * @param {string} key   Cache key.
   * @param {*}      data  Data to cache.
   * @param {number} ttl   Time-to-live in milliseconds.
   */
  API.prototype._cacheSet = function (key, data, ttl) {
    this._cache[key] = {
      data: data,
      expires: Date.now() + (ttl || 60000),
    };
  };

  /**
   * Try to serve data from cache; fall back to a fresh fetch, cache the
   * result, and return it.  Optionally run a validator function on the
   * fetched data before caching.
   *
   * @param  {string}          key       Cache key.
   * @param  {string}          url       URL to fetch on cache miss.
   * @param  {number}          ttl       Cache TTL in ms.
   * @param  {Function|null}   validator Optional (data) => boolean.
   * @param  {Object}          [fetchOpts]  Options forwarded to _request.
   * @param  {string[]}        [requiredFields]  Fields for response validation.
   * @returns {Promise<*>} Cached or freshly-fetched data.
   */
  API.prototype._getCachedOrFetch = function (key, url, ttl, validator, fetchOpts, requiredFields) {
    var cached = this._cacheGet(key);
    if (cached !== null) {
      return Promise.resolve(cached);
    }

    var self = this;
    return this._request(url, fetchOpts, undefined, requiredFields)
      .then(function (data) {
        // Run optional custom validator.
        if (typeof validator === 'function' && !validator(data)) {
          throw new Error('Fetched data failed custom validation for key: ' + key);
        }
        self._cacheSet(key, data, ttl);
        return data;
      });
  };

  // ---------------------------------------------------------------------------
  // Auth methods
  // ---------------------------------------------------------------------------

  /**
   * Authenticate against the Xtream Codes server.
   *
   * @param  {string} serverUrl  Base URL of the IPTV server.
   * @param  {string} username   Account username.
   * @param  {string} password   Account password.
   * @returns {Promise<Object>} Sanitised user_info object.
   */
  API.prototype.login = function (serverUrl, username, password) {
    if (!serverUrl || !username || !password) {
      return Promise.reject(new Error('Server URL, username, and password are required.'));
    }

    // Store credentials for subsequent requests.
    this._serverUrl = serverUrl.replace(/\/+$/, '');
    this._username  = username;
    this._password  = password;

    var self = this;
    var loginUrl = this._buildUrl('login');

    return this._request(loginUrl, {}, undefined, ['user_info', 'server_info'])
      .then(function (data) {
        self._userInfo     = data.user_info;
        self._serverInfo   = data.server_info;
        self._authenticated = true;

        // Persist credentials into Config for other modules to access.
        var settings = Config.loadSettings();
        settings.serverUrl = self._serverUrl;
        settings.username  = self._username;
        settings.password  = self._password;
        Config.saveSettings(settings);

        self.emit('authenticated', { userInfo: self._userInfo, serverInfo: self._serverInfo });
        return Utils.sanitizeObject(self._userInfo);
      })
      .catch(function (err) {
        // Wipe auth state on failure.
        self._authenticated = false;
        self._userInfo   = null;
        self._serverInfo = null;
        throw err;
      });
  };

  /**
   * Attempt to auto-login using stored credentials from Config.
   *
   * @returns {Promise<boolean>} `true` if re-authentication succeeded.
   */
  API.prototype.authenticate = function () {
    var settings = Config.loadSettings();

    if (!settings.serverUrl || !settings.username || !settings.password) {
      return Promise.resolve(false);
    }

    var self = this;
    return this.login(settings.serverUrl, settings.username, settings.password)
      .then(function () { return true; })
      .catch(function () { return false; });
  };

  /**
   * Log out — clear all auth state and cached data.
   */
  API.prototype.logout = function () {
    this._serverUrl    = null;
    this._username     = null;
    this._password     = null;
    this._userInfo     = null;
    this._serverInfo   = null;
    this._authenticated = false;
    this._cache        = {};

    // Remove credentials from persisted settings.
    var settings = Config.loadSettings();
    settings.username = '';
    settings.password = '';
    Config.saveSettings(settings);

    this.emit('unauthenticated');
  };

  /**
   * Check whether the client currently has valid authentication.
   *
   * @returns {boolean}
   */
  API.prototype.isAuthenticated = function () {
    return this._authenticated === true &&
           this._username !== null &&
           this._password !== null &&
           this._serverUrl !== null;
  };

  // ---------------------------------------------------------------------------
  // Content methods — categories
  // ---------------------------------------------------------------------------

  /**
   * Fetch the list of live TV categories.
   *
   * @returns {Promise<Object[]>} Sanitised array of category objects.
   */
  API.prototype.getLiveCategories = function () {
    var key = 'live_categories';
    var url = this._buildUrl('liveCategories');
    var ttl = this._config.CACHE_CONFIG.categories;
    return this._getCachedOrFetch(key, url, ttl);
  };

  /**
   * Fetch the list of VOD (movie) categories.
   *
   * @returns {Promise<Object[]>} Sanitised array of category objects.
   */
  API.prototype.getMovieCategories = function () {
    var key = 'movie_categories';
    var url = this._buildUrl('vodCategories');
    var ttl = this._config.CACHE_CONFIG.categories;
    return this._getCachedOrFetch(key, url, ttl);
  };

  /**
   * Fetch the list of series categories.
   *
   * @returns {Promise<Object[]>} Sanitised array of category objects.
   */
  API.prototype.getSeriesCategories = function () {
    var key = 'series_categories';
    var url = this._buildUrl('seriesCategories');
    var ttl = this._config.CACHE_CONFIG.categories;
    return this._getCachedOrFetch(key, url, ttl);
  };

  // ---------------------------------------------------------------------------
  // Content methods — streams
  // ---------------------------------------------------------------------------

  /**
   * Fetch live streams, optionally filtered by category.
   *
   * @param  {number|string} [categoryId]  Filter by category ID.
   * @returns {Promise<Object[]>} Sanitised array of stream objects.
   */
  API.prototype.getLiveStreams = function (categoryId) {
    var key = 'live_streams' + (categoryId ? '_' + categoryId : '_all');
    var url  = this._buildUrl('liveStreams');
    var ttl  = this._config.CACHE_CONFIG.streams;

    // If a categoryId is specified, filter after fetching.
    if (categoryId) {
      return this._getCachedOrFetch(key, url, ttl).then(function (streams) {
        return Array.isArray(streams)
          ? streams.filter(function (s) { return String(s.category_id) === String(categoryId); })
          : streams;
      });
    }

    return this._getCachedOrFetch(key, url, ttl);
  };

  /**
   * Fetch VOD (movie) streams with optional category filter and pagination.
   *
   * @param  {number|string} [categoryId]  Filter by category ID.
   * @param  {number}        [page=1]      Page number (1-based).
   * @returns {Promise<Object[]>} Sanitised array of movie objects.
   */
  API.prototype.getMovies = function (categoryId, page) {
    var pageNum  = Math.max(1, parseInt(page, 10) || 1);
    var pageSize = 20; // Client-side pagination chunk size.
    var key = 'movies_' + (categoryId || 'all') + '_p' + pageNum;
    var url = this._buildUrl('vodStreams');
    var ttl = this._config.CACHE_CONFIG.streams;

    var self = this;
    return this._getCachedOrFetch(key, url, ttl).then(function (movies) {
      if (!Array.isArray(movies)) return [];

      // Filter by category if requested.
      var filtered = categoryId
        ? movies.filter(function (m) { return String(m.category_id) === String(categoryId); })
        : movies;

      // Client-side pagination.
      var start = (pageNum - 1) * pageSize;
      return filtered.slice(start, start + pageSize);
    });
  };

  /**
   * Fetch series list with optional category filter and pagination.
   *
   * @param  {number|string} [categoryId]  Filter by category ID.
   * @param  {number}        [page=1]      Page number (1-based).
   * @returns {Promise<Object[]>} Sanitised array of series objects.
   */
  API.prototype.getSeries = function (categoryId, page) {
    var pageNum  = Math.max(1, parseInt(page, 10) || 1);
    var pageSize = 20;
    var key = 'series_' + (categoryId || 'all') + '_p' + pageNum;
    var url = this._buildUrl('seriesList');
    var ttl = this._config.CACHE_CONFIG.streams;

    var self = this;
    return this._getCachedOrFetch(key, url, ttl).then(function (items) {
      if (!Array.isArray(items)) return [];

      var filtered = categoryId
        ? items.filter(function (s) { return String(s.category_id) === String(categoryId); })
        : items;

      var start = (pageNum - 1) * pageSize;
      return filtered.slice(start, start + pageSize);
    });
  };

  // ---------------------------------------------------------------------------
  // Content methods — detail info
  // ---------------------------------------------------------------------------

  /**
   * Fetch detailed information for a single VOD (movie).
   *
   * @param  {number|string} streamId  The VOD stream ID.
   * @returns {Promise<Object>} Sanitised VOD info object.
   */
  API.prototype.getMovieInfo = function (streamId) {
    if (!streamId) {
      return Promise.reject(new Error('streamId is required.'));
    }

    var key = 'movie_info_' + streamId;
    var url = this._buildUrl('vodInfo', { vod_id: streamId });
    var ttl = this._config.CACHE_CONFIG.streams;
    return this._getCachedOrFetch(key, url, ttl);
  };

  /**
   * Fetch detailed information for a series (includes seasons/episodes overview).
   *
   * @param  {number|string} seriesId  The series ID.
   * @returns {Promise<Object>} Sanitised series info object.
   */
  API.prototype.getSeriesInfo = function (seriesId) {
    if (!seriesId) {
      return Promise.reject(new Error('seriesId is required.'));
    }

    var key = 'series_info_' + seriesId;
    var url = this._buildUrl('seriesInfo', { series_id: seriesId });
    var ttl = this._config.CACHE_CONFIG.streams;
    return this._getCachedOrFetch(key, url, ttl);
  };

  /**
   * Fetch episodes for a specific season of a series.
   *
   * @param  {number|string} seriesId  The series ID.
   * @param  {number|string} season    Season number.
   * @returns {Promise<Object>} Sanitised episode data object.
   */
  API.prototype.getEpisodes = function (seriesId, season) {
    if (!seriesId || !season) {
      return Promise.reject(new Error('seriesId and season are required.'));
    }

    var key = 'episodes_' + seriesId + '_s' + season;
    var url = this._buildUrl('episodes', {
      series_id: seriesId,
      season: season,
    });
    var ttl = this._config.CACHE_CONFIG.streams;
    return this._getCachedOrFetch(key, url, ttl);
  };

  /**
   * Fetch EPG (Electronic Programme Guide) data for a live channel.
   *
   * @param  {number|string} streamId  The live stream ID.
   * @param  {number}        [limit=5] Maximum number of EPG entries.
   * @returns {Promise<Object>} Sanitised EPG data.
   */
  API.prototype.getEPG = function (streamId, limit) {
    if (!streamId) {
      return Promise.reject(new Error('streamId is required.'));
    }

    var limitVal = Math.max(1, parseInt(limit, 10) || DEFAULT_EPG_LIMIT);
    var key = 'epg_' + streamId + '_l' + limitVal;
    var url = this._buildUrl('epg', {
      streamId: streamId,
      limit: limitVal,
    });
    var ttl = this._config.CACHE_CONFIG.epg;
    return this._getCachedOrFetch(key, url, ttl);
  };

  // ---------------------------------------------------------------------------
  // Search
  // ---------------------------------------------------------------------------

  /**
   * Search across movies, series, and (where possible) live streams.
   *
   * The Xtream Codes API only provides a server-side search for VOD.  To
   * provide a unified experience we also perform a lightweight client-side
   * filter on the already-cached series list.
   *
   * @param  {string} query  Search term.
   * @returns {Promise<Object>} Object with `movies`, `series`, and `live` arrays.
   */
  API.prototype.search = function (query) {
    if (!query || typeof query !== 'string') {
      return Promise.resolve({ movies: [], series: [], live: [] });
    }

    var trimmed = query.trim().toLowerCase();
    var self = this;

    // 1. Server-side VOD search.
    var searchUrl = this._buildUrl('search', { query: trimmed });
    var moviesPromise = this._request(searchUrl)
      .then(function (data) {
        // The API may return the results directly or nested under a key.
        var list = Array.isArray(data) ? data : (data.results || data.movies || []);
        return list;
      })
      .catch(function () { return []; }); // Graceful degradation.

    // 2. Client-side series search (from cache if available).
    var seriesPromise = this._getCachedOrFetch(
      'series_all_p1',
      this._buildUrl('seriesList'),
      this._config.CACHE_CONFIG.streams
    )
      .then(function (series) {
        if (!Array.isArray(series)) return [];
        return series.filter(function (s) {
          var name = (s.name || '').toLowerCase();
          return name.indexOf(trimmed) !== -1;
        });
      })
      .catch(function () { return []; });

    // 3. Client-side live search (from cache if available).
    var livePromise = this._getCachedOrFetch(
      'live_streams_all',
      this._buildUrl('liveStreams'),
      this._config.CACHE_CONFIG.streams
    )
      .then(function (streams) {
        if (!Array.isArray(streams)) return [];
        return streams.filter(function (s) {
          var name = (s.name || '').toLowerCase();
          return name.indexOf(trimmed) !== -1;
        });
      })
      .catch(function () { return []; });

    return Promise.all([moviesPromise, seriesPromise, livePromise])
      .then(function (results) {
        return {
          movies: Utils.sanitizeObject(results[0]),
          series: Utils.sanitizeObject(results[1]),
          live:   Utils.sanitizeObject(results[2]),
        };
      });
  };

  // ---------------------------------------------------------------------------
  // Utility methods
  // ---------------------------------------------------------------------------

  /**
   * Construct a direct streaming URL for the given stream.
   *
   * Xtream Codes URL formats:
   *   - Live:  {server}/live/{username}/{password}/{streamId}.{ext}
   *   - Movie: {server}/movie/{username}/{password}/{streamId}.{ext}
   *   - Series:{server}/series/{username}/{password}/{streamId}.{ext}
   *
   * @param  {number|string} streamId   Stream identifier.
   * @param  {string}        type       One of: 'live', 'movie', 'series'.
   * @param  {string}        [extension='m3u8'] File extension (e.g. 'm3u8', 'mp4').
   * @returns {string} Direct stream URL.
   * @throws {Error} If not authenticated or parameters are invalid.
   */
  API.prototype.getStreamUrl = function (streamId, type, extension) {
    if (!this.isAuthenticated()) {
      throw new Error('Cannot build stream URL: not authenticated.');
    }
    if (!streamId) {
      throw new Error('streamId is required.');
    }

    var validTypes = ['live', 'movie', 'series'];
    if (validTypes.indexOf(type) === -1) {
      throw new Error('Invalid stream type "' + type + '". Expected: ' + validTypes.join(', '));
    }

    var ext = (extension || 'm3u8').replace(/^\./, '');
    var base = this._serverUrl.replace(/\/+$/, '');

    return (
      base + '/' + type + '/' +
      encodeURIComponent(this._username) + '/' +
      encodeURIComponent(this._password) + '/' +
      encodeURIComponent(streamId) + '.' + ext
    );
  };

  /**
   * Abort all currently pending fetch requests.
   * Useful for navigation changes or logout.
   */
  API.prototype.cancelPendingRequests = function () {
    while (this._activeControllers.length > 0) {
      var controller = this._activeControllers.pop();
      try { controller.abort(); } catch (e) { /* already aborted */ }
    }
  };

  // ---------------------------------------------------------------------------
  // Public getters
  // ---------------------------------------------------------------------------

  /**
   * Return the stored user_info (or null if not authenticated).
   * @returns {Object|null}
   */
  API.prototype.getUserInfo = function () {
    return this._userInfo;
  };

  /**
   * Return the stored server_info (or null if not authenticated).
   * @returns {Object|null}
   */
  API.prototype.getServerInfo = function () {
    return this._serverInfo;
  };

  /**
   * Clear the in-memory cache.  Useful for forcing a refresh.
   */
  API.prototype.clearCache = function () {
    this._cache = {};
  };

  // ---------------------------------------------------------------------------
  // Register on the global namespace
  // ---------------------------------------------------------------------------
  global[NAMESPACE] = global[NAMESPACE] || {};
  global[NAMESPACE].API = API;

})(window);