/**
 * NASR LIVE - IndexedDB Database Wrapper
 *
 * Provides a Promise-based wrapper around IndexedDB for local data persistence.
 * Manages four object stores: favorites, watchHistory, cache, and settings.
 *
 * Exposed globally as: window.AppDB
 *
 * @namespace AppDB
 */
(function () {
  'use strict';

  /** @constant {string} Database name */
  var DB_NAME = 'nasr-live-db';

  /** @constant {number} Database schema version */
  var DB_VERSION = 1;

  /** @type {IDBDatabase|null} Reference to the opened database instance */
  var _db = null;

  /**
   * Promisifies a single IDBRequest into a Promise.
   *
   * @private
   * @param {IDBRequest} request - The IndexedDB request to wrap.
   * @returns {Promise<*>} Resolves with the request result, rejects on error.
   */
  function _request(request) {
    return new Promise(function (resolve, reject) {
      request.onsuccess = function () {
        resolve(request.result);
      };
      request.onerror = function () {
        reject(request.error);
      };
    });
  }

  /**
   * Promisifies an IDBTransaction by waiting for its completion.
   *
   * @private
   * @param {IDBTransaction} transaction - The transaction to monitor.
   * @returns {Promise<void>} Resolves on complete, rejects on abort/error.
   */
  function _transaction(transaction) {
    return new Promise(function (resolve, reject) {
      transaction.oncomplete = function () { resolve(); };
      transaction.onabort = function () { reject(transaction.error); };
      transaction.onerror = function () { reject(transaction.error); };
    });
  }

  /**
   * Opens (or creates) the IndexedDB database and stores the instance.
   * Creates object stores on first run or version upgrade.
   *
   * @example
   * await AppDB.init();
   * console.log('Database ready');
   *
   * @returns {Promise<void>} Resolves when the database is open and ready.
   */
  function init() {
    if (_db) {
      return Promise.resolve();
    }

    return new Promise(function (resolve, reject) {
      var request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = function (event) {
        var db = event.target.result;

        // ── favorites store ──────────────────────────────────────────
        // Indexed by composite [type, id] so a live channel and a movie
        // with the same numeric id can coexist.
        if (!db.objectStoreNames.contains('favorites')) {
          var favStore = db.createObjectStore('favorites', { keyPath: 'id' });
          favStore.createIndex('type', 'type', { unique: false });
          favStore.createIndex('type_id', ['type', 'id'], { unique: true });
          favStore.createIndex('name', 'name', { unique: false });
        }

        // ── watchHistory store ───────────────────────────────────────
        // Records last playback position and timestamp for resume support.
        if (!db.objectStoreNames.contains('watchHistory')) {
          var histStore = db.createObjectStore('watchHistory', { keyPath: 'id' });
          histStore.createIndex('type', 'type', { unique: false });
          histStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // ── cache store ──────────────────────────────────────────────
        // Generic key-value cache with optional TTL expiry.
        if (!db.objectStoreNames.contains('cache')) {
          var cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
          cacheStore.createIndex('expiry', 'expiry', { unique: false });
        }

        // ── settings store ───────────────────────────────────────────
        // Simple key-value pairs for app settings.
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = function (event) {
        _db = event.target.result;

        // Handle unexpected connection closes (e.g. browser cleaning up)
        _db.onclose = function () {
          _db = null;
        };
        _db.onversionchange = function () {
          _db.close();
          _db = null;
        };

        resolve();
      };

      request.onerror = function (event) {
        reject(new Error('AppDB.init: failed to open database - ' + event.target.error));
      };

      request.onblocked = function () {
        console.warn('AppDB.init: database upgrade blocked by another tab');
      };
    });
  }

  /**
   * Returns the active IDBDatabase instance, ensuring init() has been called.
   *
   * @private
   * @returns {Promise<IDBDatabase>}
   * @throws {Error} If the database has not been initialized.
   */
  function _getDB() {
    if (_db) {
      return Promise.resolve(_db);
    }
    return init().then(function () {
      if (!_db) {
        throw new Error('AppDB: database is not available');
      }
      return _db;
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  FAVORITES
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Adds an item to the user's favorites list.
   * If an item with the same id already exists, it is updated (upsert).
   *
   * @example
   * await AppDB.addFavorite({
   *   id: '1234',
   *   type: 'live',
   *   name: 'Al Jazeera',
   *   logo: 'https://example.com/logo.png',
   *   stream_id: 1234
   * });
   *
   * @param {Object} item - The favorite item to store.
   * @param {string|number} item.id - Unique identifier for the item.
   * @param {string} item.type - Content type: 'live', 'movie', or 'series'.
   * @param {string} [item.name] - Display name of the item.
   * @param {string} [item.logo] - URL to the item's logo/thumbnail.
   * @param {number} [item.stream_id] - The stream ID from the IPTV server.
   * @param {Object} [item.extra] - Any additional metadata to persist.
   * @returns {Promise<void>} Resolves when the item has been stored.
   */
  function addFavorite(item) {
    var entry = Object.assign({}, item, {
      id: String(item.id),
      type: item.type || 'live',
      addedAt: Date.now()
    });

    return _getDB().then(function (db) {
      var tx = db.transaction('favorites', 'readwrite');
      var store = tx.objectStore('favorites');
      store.put(entry);
      return _transaction(tx);
    });
  }

  /**
   * Removes an item from favorites by its id and type.
   *
   * @example
   * await AppDB.removeFavorite('1234', 'live');
   *
   * @param {string|number} id - The item's unique identifier.
   * @param {string} type - Content type: 'live', 'movie', or 'series'.
   * @returns {Promise<boolean>} Resolves with true if removed, false if not found.
   */
  function removeFavorite(id, type) {
    var key = String(id);

    return _getDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction('favorites', 'readwrite');
        var store = tx.objectStore('favorites');
        var getRequest = store.get(key);

        getRequest.onsuccess = function () {
          var record = getRequest.result;
          if (record && record.type === type) {
            store.delete(key);
            tx.oncomplete = function () { resolve(true); };
            tx.onerror = function () { reject(tx.error); };
          } else {
            // Not found or type mismatch — no-op
            tx.oncomplete = function () { resolve(false); };
            tx.onerror = function () { reject(tx.error); };
          }
        };

        getRequest.onerror = function () { reject(getRequest.error); };
      });
    });
  }

  /**
   * Retrieves all favorite items, optionally filtered by content type.
   *
   * @example
   * var allFavs = await AppDB.getFavorites();
   * var liveFavs = await AppDB.getFavorites('live');
   *
   * @param {string} [type] - If provided, only return favorites of this type.
   * @returns {Promise<Object[]>} Array of favorite item objects.
   */
  function getFavorites(type) {
    return _getDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction('favorites', 'readonly');
        var store = tx.objectStore('favorites');
        var request;

        if (type) {
          var index = store.index('type');
          request = index.getAll(type);
        } else {
          request = store.getAll();
        }

        request.onsuccess = function () {
          resolve(request.result || []);
        };
        request.onerror = function () {
          reject(request.error);
        };
      });
    });
  }

  /**
   * Checks whether a specific item is in the user's favorites.
   *
   * @example
   * if (await AppDB.isFavorite('1234', 'live')) {
   *   // highlight the heart icon
   * }
   *
   * @param {string|number} id - The item's unique identifier.
   * @param {string} type - Content type: 'live', 'movie', or 'series'.
   * @returns {Promise<boolean>} True if the item is a favorite, false otherwise.
   */
  function isFavorite(id, type) {
    var key = String(id);

    return _getDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction('favorites', 'readonly');
        var store = tx.objectStore('favorites');
        var request = store.get(key);

        request.onsuccess = function () {
          var record = request.result;
          resolve(!!record && record.type === type);
        };
        request.onerror = function () {
          reject(request.error);
        };
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  WATCH HISTORY
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Adds or updates a watch history entry. Used to track what the user
   * has been watching and to enable resume playback.
   *
   * @example
   * await AppDB.addToHistory({
   *   id: '5678',
   *   type: 'movie',
   *   name: 'The Matrix',
   *   position: 3240,
   *   duration: 8160,
   *   timestamp: Date.now()
   * });
   *
   * @param {Object} item - The watch history entry.
   * @param {string|number} item.id - Unique identifier for the content.
   * @param {string} item.type - Content type: 'live', 'movie', or 'series'.
   * @param {string} [item.name] - Display name of the content.
   * @param {number} [item.position] - Last known playback position in seconds.
   * @param {number} [item.duration] - Total duration of the content in seconds.
   * @param {number} [item.timestamp] - Epoch ms when this entry was last played.
   * @param {Object} [item.extra] - Any additional metadata to persist.
   * @returns {Promise<void>} Resolves when the history entry has been stored.
   */
  function addToHistory(item) {
    var entry = Object.assign({}, item, {
      id: String(item.id),
      type: item.type || 'movie',
      timestamp: item.timestamp || Date.now()
    });

    return _getDB().then(function (db) {
      var tx = db.transaction('watchHistory', 'readwrite');
      var store = tx.objectStore('watchHistory');
      store.put(entry);
      return _transaction(tx);
    });
  }

  /**
   * Retrieves watch history entries, optionally filtered by type,
   * ordered by most recently watched (timestamp descending).
   *
   * @example
   * var recentMovies = await AppDB.getHistory('movie');
   *
   * @param {string} [type] - If provided, only return history of this type.
   * @returns {Promise<Object[]>} Array of history entries sorted by timestamp desc.
   */
  function getHistory(type) {
    return _getDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction('watchHistory', 'readonly');
        var store = tx.objectStore('watchHistory');
        var index = store.index('timestamp');
        // Open cursor in reverse to get newest first
        var request = index.openCursor(null, 'prev');
        var results = [];

        request.onsuccess = function (event) {
          var cursor = event.target.result;
          if (cursor) {
            if (!type || cursor.value.type === type) {
              results.push(cursor.value);
            }
            cursor.continue();
          } else {
            resolve(results);
          }
        };

        request.onerror = function () {
          reject(request.error);
        };
      });
    });
  }

  /**
   * Updates the playback position and duration for an existing history entry.
   * Creates the entry if it does not yet exist.
   *
   * @example
   * // Save position every 10 seconds during playback
   * await AppDB.updateHistoryPosition('5678', 5400, 8160);
   *
   * @param {string|number} id - The content identifier.
   * @param {number} position - Current playback position in seconds.
   * @param {number} duration - Total content duration in seconds.
   * @returns {Promise<void>}
   */
  function updateHistoryPosition(id, position, duration) {
    var key = String(id);

    return _getDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction('watchHistory', 'readwrite');
        var store = tx.objectStore('watchHistory');
        var getRequest = store.get(key);

        getRequest.onsuccess = function () {
          var entry = getRequest.result;
          if (entry) {
            entry.position = position;
            entry.duration = duration;
            entry.timestamp = Date.now();
            store.put(entry);
          }
          tx.oncomplete = function () { resolve(); };
          tx.onerror = function () { reject(tx.error); };
        };

        getRequest.onerror = function () { reject(getRequest.error); };
      });
    });
  }

  /**
   * Deletes all watch history entries from the database.
   *
   * @example
   * await AppDB.clearHistory();
   *
   * @returns {Promise<void>}
   */
  function clearHistory() {
    return _getDB().then(function (db) {
      var tx = db.transaction('watchHistory', 'readwrite');
      var store = tx.objectStore('watchHistory');
      store.clear();
      return _transaction(tx);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  CACHE
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Stores a value in the cache with an optional time-to-live.
   * Data is serialized to JSON before storing.
   *
   * @example
   * // Cache for 5 minutes
   * await AppDB.cacheData('live_categories', categories, 5 * 60 * 1000);
   *
   * // Cache indefinitely
   * await AppDB.cacheData('user_prefs', prefs);
   *
   * @param {string} key - The cache key. Must be unique per cached dataset.
   * @param {*} data - The data to cache. Will be JSON-serialized.
   * @param {number} [ttl] - Time-to-live in milliseconds. Omit for no expiry.
   * @returns {Promise<void>}
   */
  function cacheData(key, data, ttl) {
    var entry = {
      key: key,
      data: data,
      createdAt: Date.now()
    };

    if (typeof ttl === 'number' && ttl > 0) {
      entry.expiry = Date.now() + ttl;
    } else {
      entry.expiry = null; // No expiry
    }

    return _getDB().then(function (db) {
      var tx = db.transaction('cache', 'readwrite');
      var store = tx.objectStore('cache');
      store.put(entry);
      return _transaction(tx);
    });
  }

  /**
   * Retrieves a cached value by key. Returns null if the entry does
   * not exist or if it has expired (TTL elapsed).
   *
   * @example
   * var categories = await AppDB.getCached('live_categories');
   * if (categories) {
   *   // Use cached data
   * } else {
   *   // Fetch fresh data
   * }
   *
   * @param {string} key - The cache key to look up.
   * @returns {Promise<*|null>} The cached data, or null if not found / expired.
   */
  function getCached(key) {
    return _getDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction('cache', 'readonly');
        var store = tx.objectStore('cache');
        var request = store.get(key);

        request.onsuccess = function () {
          var entry = request.result;
          if (!entry) {
            resolve(null);
            return;
          }

          // Check TTL expiry
          if (entry.expiry !== null && entry.expiry !== undefined && Date.now() > entry.expiry) {
            // Remove expired entry asynchronously (fire-and-forget)
            var delTx = db.transaction('cache', 'readwrite');
            delTx.objectStore('cache').delete(key);
            delTx.oncomplete = function () {};
            resolve(null);
            return;
          }

          resolve(entry.data);
        };

        request.onerror = function () {
          reject(request.error);
        };
      });
    });
  }

  /**
   * Removes all entries from the cache store.
   *
   * @example
   * await AppDB.clearCache();
   *
   * @returns {Promise<void>}
   */
  function clearCache() {
    return _getDB().then(function (db) {
      var tx = db.transaction('cache', 'readwrite');
      var store = tx.objectStore('cache');
      store.clear();
      return _transaction(tx);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  SETTINGS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Retrieves a setting value by key. Returns the default value if
   * the setting is not found in the database.
   *
   * @example
   * var theme = await AppDB.getSetting('theme', 'dark');
   * var volume = await AppDB.getSetting('volume', 0.8);
   *
   * @param {string} key - The setting key.
   * @param {*} [defaultVal] - Value to return if the key does not exist. Defaults to null.
   * @returns {Promise<*>} The stored value, or defaultVal if not found.
   */
  function getSetting(key, defaultVal) {
    return _getDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction('settings', 'readonly');
        var store = tx.objectStore('settings');
        var request = store.get(key);

        request.onsuccess = function () {
          var entry = request.result;
          if (entry) {
            resolve(entry.value);
          } else {
            resolve(typeof defaultVal !== 'undefined' ? defaultVal : null);
          }
        };

        request.onerror = function () {
          reject(request.error);
        };
      });
    });
  }

  /**
   * Stores a setting value in the database. Overwrites any existing value
   * for the same key.
   *
   * @example
   * await AppDB.setSetting('theme', 'dark');
   * await AppDB.setSetting('lastPlayedChannel', 1050);
   *
   * @param {string} key - The setting key.
   * @param {*} value - The value to store. Will be JSON-serialized.
   * @returns {Promise<void>}
   */
  function setSetting(key, value) {
    var entry = {
      key: key,
      value: value
    };

    return _getDB().then(function (db) {
      var tx = db.transaction('settings', 'readwrite');
      var store = tx.objectStore('settings');
      store.put(entry);
      return _transaction(tx);
    });
  }

  // ── Public API ──────────────────────────────────────────────────────────
  window.AppDB = {
    /** Database name constant */
    DB_NAME: DB_NAME,
    /** Database version constant */
    DB_VERSION: DB_VERSION,

    /** @type {function(): Promise<void>} */
    init: init,

    // Favorites
    /** @type {function(Object): Promise<void>} */
    addFavorite: addFavorite,
    /** @type {function(string|number, string): Promise<boolean>} */
    removeFavorite: removeFavorite,
    /** @type {function(string=): Promise<Object[]>} */
    getFavorites: getFavorites,
    /** @type {function(string|number, string): Promise<boolean>} */
    isFavorite: isFavorite,

    // Watch History
    /** @type {function(Object): Promise<void>} */
    addToHistory: addToHistory,
    /** @type {function(string=): Promise<Object[]>} */
    getHistory: getHistory,
    /** @type {function(string|number, number, number): Promise<void>} */
    updateHistoryPosition: updateHistoryPosition,
    /** @type {function(): Promise<void>} */
    clearHistory: clearHistory,

    // Cache
    /** @type {function(string, *, number=): Promise<void>} */
    cacheData: cacheData,
    /** @type {function(string): Promise<*|null>} */
    getCached: getCached,
    /** @type {function(): Promise<void>} */
    clearCache: clearCache,

    // Settings
    /** @type {function(string, *=): Promise<*>} */
    getSetting: getSetting,
    /** @type {function(string, *): Promise<void>} */
    setSetting: setSetting
  };
})();