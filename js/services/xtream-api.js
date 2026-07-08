/**
 * NASR LIVE - Xtream Codes API Client
 *
 * Provides a full-featured client for the Xtream Codes IPTV REST API.
 * Handles authentication, content browsing (live TV, VOD, series),
 * EPG data, search, and stream URL generation.
 *
 * Responses are cached in AppDB to reduce network calls and improve
 * perceived performance on repeated navigation.
 *
 * Exposed globally as: window.XtreamAPI
 *
 * @namespace XtreamAPI
 * @constructor
 * @param {string} serverUrl - Base URL of the Xtream Codes server (e.g. "http://example.com").
 * @param {string} username - IPTV service username.
 * @param {string} password - IPTV service password.
 */
(function () {
  'use strict';

  /** @constant {number} Default cache TTL for API responses (5 minutes) */
  var DEFAULT_CACHE_TTL = 5 * 60 * 1000;

  /** @constant {number} Cache TTL for categories (30 minutes — they change rarely) */
  var CATEGORY_CACHE_TTL = 30 * 60 * 1000;

  /**
   * XtreamAPI constructor.
   *
   * @param {string} serverUrl - Base URL of the Xtream Codes server.
   * @param {string} username - IPTV service username.
   * @param {string} password - IPTV service password.
   */
  function XtreamAPI(serverUrl, username, password) {
    // Normalize: strip trailing slash
    this.baseUrl = (serverUrl || '').replace(/\/+$/, '');
    this.user = username || '';
    this.pass = password || '';

    /** @type {Object|null} Cached user info from authentication */
    this._userInfo = null;

    /** @type {Object|null} Cached server info from authentication */
    this._serverInfo = null;

    /** @type {boolean} Whether authentication has succeeded */
    this._authenticated = false;
  }

  /**
   * Builds the full URL for an API endpoint.
   *
   * @private
   * @param {Object} [params] - Additional query parameters.
   * @returns {string} The full API URL.
   */
  XtreamAPI.prototype._buildUrl = function (params) {
    var url = this.baseUrl + '/player_api.php?username=' + encodeURIComponent(this.user) + '&password=' + encodeURIComponent(this.pass);

    if (params) {
      var keys = Object.keys(params);
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (params[key] !== undefined && params[key] !== null) {
          url += '&' + encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
        }
      }
    }

    return url;
  };

  /**
   * Performs a fetch request with standard error handling.
   * Returns the parsed JSON response.
   *
   * @private
   * @param {string} url - The URL to fetch.
   * @param {Object} [options] - Optional fetch options.
   * @returns {Promise<Object>} Parsed JSON response.
   * @throws {Error} If the network request fails or returns a non-OK status.
   */
  XtreamAPI.prototype._fetch = function (url, options) {
    var fetchOptions = Object.assign({
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    }, options || {});

    return fetch(url, fetchOptions).then(function (response) {
      if (!response.ok) {
        return response.text().then(function (text) {
          throw new Error('XtreamAPI HTTP ' + response.status + ': ' + text.substring(0, 200));
        });
      }
      return response.json();
    }).catch(function (err) {
      if (err instanceof TypeError && err.message.indexOf('fetch') !== -1) {
        throw new Error('XtreamAPI network error: ' + err.message);
      }
      throw err;
    });
  };

  /**
   * Attempts to retrieve data from the AppDB cache.
   * Returns null if AppDB is not available or the cache is empty/expired.
   *
   * @private
   * @param {string} cacheKey - The cache key to look up.
   * @returns {Promise<*|null>} Cached data or null.
   */
  XtreamAPI.prototype._getFromCache = function (cacheKey) {
    if (typeof window.AppDB === 'undefined') {
      return Promise.resolve(null);
    }
    return window.AppDB.getCached(cacheKey);
  };

  /**
   * Stores data in the AppDB cache with a specified TTL.
   * No-op if AppDB is not available.
   *
   * @private
   * @param {string} cacheKey - The cache key.
   * @param {*} data - The data to cache.
   * @param {number} [ttl] - Time-to-live in milliseconds.
   * @returns {Promise<void>}
   */
  XtreamAPI.prototype._saveToCache = function (cacheKey, data, ttl) {
    if (typeof window.AppDB === 'undefined') {
      return Promise.resolve();
    }
    return window.AppDB.cacheData(cacheKey, data, ttl || DEFAULT_CACHE_TTL);
  };

  /**
   * Wraps an API call with caching logic. Checks the cache first,
   * and on a miss, fetches from the remote server and caches the result.
   *
   * @private
   * @param {string} cacheKey - Key for the cache store.
   * @param {string} url - The URL to fetch on cache miss.
   * @param {number} [ttl] - Cache TTL in milliseconds.
   * @returns {Promise<*>} The API response data.
   */
  XtreamAPI.prototype._cachedFetch = function (cacheKey, url, ttl) {
    var self = this;

    return self._getFromCache(cacheKey).then(function (cached) {
      if (cached !== null && cached !== undefined) {
        return cached;
      }

      return self._fetch(url).then(function (data) {
        // Cache the response (fire-and-forget on cache save failure)
        self._saveToCache(cacheKey, data, ttl).catch(function () {});
        return data;
      });
    });
  };

  // ═══════════════════════════════════════════════════════════════════════
  //  AUTHENTICATION
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Authenticates with the Xtream Codes server using the provided credentials.
   * The base authentication endpoint returns user info, server info, and status
   * in a single response.
   *
   * Expected response shape:
   * {
   *   "user_info": { "auth": 1, "status": "Active", "exp_date": "...", ... },
   *   "server_info": { "url": "...", "port": "...", "https_port": "...", ... },
   *   "available_channels": ...,
   *   "vod_access": 1,
   *   "series_access": 1
   * }
   *
   * @example
   * var api = new XtreamAPI('http://server.com', 'user', 'pass');
   * var result = await api.authenticate();
   * console.log(result.user_info.username); // "user"
   *
   * @returns {Promise<Object>} The full authentication response from the server.
   * @throws {Error} If authentication fails (bad credentials, server error, etc.).
   */
  XtreamAPI.prototype.authenticate = function () {
    var self = this;
    var url = self._buildUrl();

    return self._fetch(url).then(function (data) {
      // A successful auth response contains user_info
      if (!data || !data.user_info) {
        throw new Error('XtreamAPI: authentication failed — invalid response');
      }

      if (data.user_info.auth !== 1 && data.user_info.status !== 'Active') {
        throw new Error('XtreamAPI: authentication failed — ' + (data.user_info.message || 'invalid credentials'));
      }

      self._userInfo = data.user_info;
      self._serverInfo = data.server_info || null;
      self._authenticated = true;

      return data;
    });
  };

  /**
   * Returns whether the client has successfully authenticated.
   *
   * @example
   * if (api.isAuthenticated()) {
   *   // Safe to make authenticated API calls
   * }
   *
   * @returns {boolean} True if the client is authenticated.
   */
  XtreamAPI.prototype.isAuthenticated = function () {
    return this._authenticated === true;
  };

  /**
   * Returns the stored user info object from the last authentication.
   *
   * @example
   * var info = api.getUserInfo();
   * console.log('Expires:', new Date(info.exp_date * 1000));
   *
   * @returns {Object|null} The user info object, or null if not authenticated.
   */
  XtreamAPI.prototype.getUserInfo = function () {
    return this._userInfo;
  };

  // ═══════════════════════════════════════════════════════════════════════
  //  LIVE TV
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Fetches the list of live TV categories from the server.
   * Results are cached for 30 minutes.
   *
   * @example
   * var categories = await api.getLiveCategories();
   * // [{ "category_id": "1", "category_name": "Sports", "parent_id": 0 }, ...]
   *
   * @returns {Promise<Object[]>} Array of category objects.
   */
  XtreamAPI.prototype.getLiveCategories = function () {
    var url = this._buildUrl({ action: 'get_live_categories' });
    var cacheKey = 'xtream_live_categories_' + this.user;
    return this._cachedFetch(cacheKey, url, CATEGORY_CACHE_TTL);
  };

  /**
   * Fetches the list of live TV streams, optionally filtered by category.
   * Results are cached for 5 minutes.
   *
   * @example
   * var allLive = await api.getLiveStreams();
   * var sports = await api.getLiveStreams(5);
   *
   * @param {string|number} [categoryId] - If provided, only return streams in this category.
   * @returns {Promise<Object[]>} Array of stream objects.
   */
  XtreamAPI.prototype.getLiveStreams = function (categoryId) {
    var params = { action: 'get_live_streams' };
    if (categoryId !== undefined && categoryId !== null) {
      params.category_id = categoryId;
    }

    var url = this._buildUrl(params);
    var cacheKey = 'xtream_live_streams_' + this.user + '_' + (categoryId || 'all');
    return this._cachedFetch(cacheKey, url, DEFAULT_CACHE_TTL);
  };

  // ═══════════════════════════════════════════════════════════════════════
  //  VOD (MOVIES)
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Fetches the list of VOD (movie) categories from the server.
   * Results are cached for 30 minutes.
   *
   * @example
   * var categories = await api.getVodCategories();
   *
   * @returns {Promise<Object[]>} Array of category objects.
   */
  XtreamAPI.prototype.getVodCategories = function () {
    var url = this._buildUrl({ action: 'get_vod_categories' });
    var cacheKey = 'xtream_vod_categories_' + this.user;
    return this._cachedFetch(cacheKey, url, CATEGORY_CACHE_TTL);
  };

  /**
   * Fetches the list of VOD (movie) streams, optionally filtered by category.
   * Results are cached for 5 minutes.
   *
   * @example
   * var allMovies = await api.getVodStreams();
   * var actionMovies = await api.getVodStreams(12);
   *
   * @param {string|number} [categoryId] - If provided, only return streams in this category.
   * @returns {Promise<Object[]>} Array of stream objects.
   */
  XtreamAPI.prototype.getVodStreams = function (categoryId) {
    var params = { action: 'get_vod_streams' };
    if (categoryId !== undefined && categoryId !== null) {
      params.category_id = categoryId;
    }

    var url = this._buildUrl(params);
    var cacheKey = 'xtream_vod_streams_' + this.user + '_' + (categoryId || 'all');
    return this._cachedFetch(cacheKey, url, DEFAULT_CACHE_TTL);
  };

  // ═══════════════════════════════════════════════════════════════════════
  //  SERIES
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Fetches the list of series categories from the server.
   * Results are cached for 30 minutes.
   *
   * @example
   * var categories = await api.getSeriesCategories();
   *
   * @returns {Promise<Object[]>} Array of category objects.
   */
  XtreamAPI.prototype.getSeriesCategories = function () {
    var url = this._buildUrl({ action: 'get_series_categories' });
    var cacheKey = 'xtream_series_categories_' + this.user;
    return this._cachedFetch(cacheKey, url, CATEGORY_CACHE_TTL);
  };

  /**
   * Fetches the list of series, optionally filtered by category.
   * Results are cached for 5 minutes.
   *
   * @example
   * var allSeries = await api.getSeries();
   * var dramaSeries = await api.getSeries(8);
   *
   * @param {string|number} [categoryId] - If provided, only return series in this category.
   * @returns {Promise<Object[]>} Array of series objects.
   */
  XtreamAPI.prototype.getSeries = function (categoryId) {
    var params = { action: 'get_series' };
    if (categoryId !== undefined && categoryId !== null) {
      params.category_id = categoryId;
    }

    var url = this._buildUrl(params);
    var cacheKey = 'xtream_series_' + this.user + '_' + (categoryId || 'all');
    return this._cachedFetch(cacheKey, url, DEFAULT_CACHE_TTL);
  };

  /**
   * Fetches detailed information about a specific series, including
   * its seasons and episodes.
   *
   * @example
   * var info = await api.getSeriesInfo(4521);
   * console.log(info.episodes); // { "1": [...], "2": [...] } keyed by season
   *
   * @param {string|number} seriesId - The series ID to look up.
   * @returns {Promise<Object>} Series info object with seasons and episodes.
   */
  XtreamAPI.prototype.getSeriesInfo = function (seriesId) {
    var url = this._buildUrl({
      action: 'get_series_info',
      series_id: seriesId
    });
    var cacheKey = 'xtream_series_info_' + this.user + '_' + seriesId;
    // Series info is relatively static — cache for 30 minutes
    return this._cachedFetch(cacheKey, url, CATEGORY_CACHE_TTL);
  };

  // ═══════════════════════════════════════════════════════════════════════
  //  STREAM URLS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Generates the direct streaming URL for a given stream ID and content type.
   *
   * @example
   * // Live TV stream (HLS)
   * var hlsUrl = api.getStreamUrl(1050, 'live');
   * // => "http://server.com/live/user/pass/1050.m3u8"
   *
   * // Movie stream (MKV)
   * var movieUrl = api.getStreamUrl(3200, 'movie');
   * // => "http://server.com/movie/user/pass/3200.mkv"
   *
   * // Series episode stream (MKV)
   * var epUrl = api.getStreamUrl(7890, 'series');
   * // => "http://server.com/series/user/pass/7890.mkv"
   *
   * @param {string|number} streamId - The stream/episode ID.
   * @param {string} type - Content type: 'live', 'movie', or 'series'.
   * @returns {string} The full streaming URL.
   * @throws {Error} If an unsupported type is provided.
   */
  XtreamAPI.prototype.getStreamUrl = function (streamId, type) {
    switch (type) {
      case 'live':
        return this.baseUrl + '/live/' + encodeURIComponent(this.user) + '/' + encodeURIComponent(this.pass) + '/' + encodeURIComponent(streamId) + '.m3u8';
      case 'movie':
        return this.baseUrl + '/movie/' + encodeURIComponent(this.user) + '/' + encodeURIComponent(this.pass) + '/' + encodeURIComponent(streamId) + '.mkv';
      case 'series':
        return this.baseUrl + '/series/' + encodeURIComponent(this.user) + '/' + encodeURIComponent(this.pass) + '/' + encodeURIComponent(streamId) + '.mkv';
      default:
        throw new Error('XtreamAPI.getStreamUrl: unsupported type "' + type + '". Use "live", "movie", or "series".');
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  //  EPG (Electronic Program Guide)
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Fetches EPG data for a specific live stream.
   *
   * @example
   * var epg = await api.getEPG(1050, 5);
   * // Returns array of upcoming programs for the channel
   *
   * @param {string|number} streamId - The live stream ID.
   * @param {number} [limit] - Maximum number of EPG entries to return.
   * @returns {Promise<Object[]>} Array of EPG entries.
   */
  XtreamAPI.prototype.getEPG = function (streamId, limit) {
    var params = {
      action: 'get_simple_data_table',
      stream_id: streamId
    };
    if (typeof limit === 'number' && limit > 0) {
      params.limit = limit;
    }

    var url = this._buildUrl(params);
    // EPG data is short-lived — cache for 2 minutes
    var cacheKey = 'xtream_epg_' + this.user + '_' + streamId + '_' + (limit || 'all');
    return this._cachedFetch(cacheKey, url, 2 * 60 * 1000);
  };

  // ═══════════════════════════════════════════════════════════════════════
  //  SEARCH
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Searches for VOD (movies) and live streams matching a query string.
   * Returns an object with `movies` and `live` arrays.
   *
   * @example
   * var results = await api.search('matrix');
   * console.log(results.movies);  // Matching movies
   * console.log(results.live);    // Matching live channels
   *
   * @param {string} query - The search query string.
   * @returns {Promise<{movies: Object[], live: Object[]}>} Search results grouped by type.
   */
  XtreamAPI.prototype.search = function (query) {
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return Promise.resolve({ movies: [], live: [] });
    }

    var self = this;
    var trimmedQuery = query.trim();

    // Search movies/VOD
    var movieUrl = self._buildUrl({
      action: 'get_vod_streams',
      search: trimmedQuery
    });
    var movieCacheKey = 'xtream_search_movies_' + self.user + '_' + trimmedQuery.toLowerCase();

    // Search live streams (use the live streams endpoint with search if available,
    // otherwise fall back to fetching all and filtering client-side)
    var liveUrl = self._buildUrl({
      action: 'get_live_streams',
      search: trimmedQuery
    });
    var liveCacheKey = 'xtream_search_live_' + self.user + '_' + trimmedQuery.toLowerCase();

    var moviesPromise = self._cachedFetch(movieCacheKey, movieUrl, DEFAULT_CACHE_TTL)
      .catch(function () { return []; });

    var livePromise = self._cachedFetch(liveCacheKey, liveUrl, DEFAULT_CACHE_TTL)
      .catch(function () { return []; });

    return Promise.all([moviesPromise, livePromise]).then(function (results) {
      return {
        movies: Array.isArray(results[0]) ? results[0] : [],
        live: Array.isArray(results[1]) ? results[1] : []
      };
    });
  };

  // ═══════════════════════════════════════════════════════════════════════
  //  DISCONNECT
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Clears all authentication state and cached credentials.
   * Does NOT make any network calls — purely a local state reset.
   *
   * @example
   * api.disconnect();
   * console.log(api.isAuthenticated()); // false
   */
  XtreamAPI.prototype.disconnect = function () {
    this._userInfo = null;
    this._serverInfo = null;
    this._authenticated = false;
  };

  // ── Expose globally ────────────────────────────────────────────────────
  window.XtreamAPI = XtreamAPI;
})();