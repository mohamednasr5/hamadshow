/**
 * Hamad Show — Firebase Realtime Database Module
 * =================================================
 * Manages reading/writing IPTV credentials and app settings
 * to Firebase Realtime Database.
 *
 * Uses Firebase Compat SDK (loaded via CDN in index.html).
 *
 * @namespace HamadShow.FirebaseDB
 * @module firebase-db
 */

(function (global) {
  'use strict';

  var NAMESPACE = 'HamadShow';

  // ---------------------------------------------------------------------------
  // Firebase Configuration
  // ---------------------------------------------------------------------------

  var FIREBASE_CONFIG = {
    apiKey: "AIzaSyAfImJ7x3pe0GYSrl7hDz_sMb_GarcpJ9E",
    authDomain: "nasr-live.firebaseapp.com",
    databaseURL: "https://nasr-live-default-rtdb.firebaseio.com",
    projectId: "nasr-live",
    storageBucket: "nasr-live.firebasestorage.app",
    messagingSenderId: "215945991656",
    appId: "1:215945991656:web:41ea1faa18496ff86cc05d",
    measurementId: "G-L8YQYDL52E"
  };

  // Database paths
  var DB_PATHS = {
    credentials: '/iptv/credentials',       // Server URL, username, password
    settings:    '/iptv/settings',          // App settings (theme, name, etc.)
    users:       '/iptv/users',             // User-specific data
    categories:  '/iptv/categories',        // Custom category order/filters
  };

  // ---------------------------------------------------------------------------
  // FirebaseDB Constructor
  // ---------------------------------------------------------------------------

  /**
   * @constructor
   */
  function FirebaseDB() {
    this._db = null;
    this._initialized = false;
    this._listeners = [];
  }

  // ---------------------------------------------------------------------------
  // Event Target Mixin (simple)
  // ---------------------------------------------------------------------------

  var _evtHandlers = {};

  FirebaseDB.prototype.on = function (event, fn) {
    if (!_evtHandlers[event]) _evtHandlers[event] = [];
    _evtHandlers[event].push(fn);
  };

  FirebaseDB.prototype.off = function (event, fn) {
    if (!_evtHandlers[event]) return;
    _evtHandlers[event] = _evtHandlers[event].filter(function (f) { return f !== fn; });
  };

  FirebaseDB.prototype.emit = function (event, data) {
    var handlers = _evtHandlers[event] || [];
    handlers.forEach(function (fn) {
      try { fn(data); } catch (e) { console.error('[FirebaseDB] Event handler error:', e); }
    });
  };

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------

  /**
   * Initialize Firebase and get database reference.
   * @returns {Promise<boolean>}
   */
  FirebaseDB.prototype.init = function () {
    var self = this;

    // Check if Firebase SDK is loaded
    if (typeof firebase === 'undefined' || !firebase.database) {
      console.warn('[FirebaseDB] Firebase SDK not loaded. Falling back to local storage only.');
      return Promise.resolve(false);
    }

    try {
      // Initialize Firebase if not already done
      if (!firebase.apps || firebase.apps.length === 0) {
        firebase.initializeApp(FIREBASE_CONFIG);
      }

      self._db = firebase.database();
      self._initialized = true;
      console.info('[FirebaseDB] Firebase initialized successfully.');

      // Listen for real-time credential changes
      self._listenForChanges();

      return Promise.resolve(true);
    } catch (err) {
      console.error('[FirebaseDB] Firebase initialization failed:', err);
      return Promise.resolve(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Credentials (Server URL, Username, Password)
  // ---------------------------------------------------------------------------

  /**
   * Save IPTV credentials to Firebase.
   * @param {Object} creds - { serverUrl, username, password }
   * @returns {Promise<void>}
   */
  FirebaseDB.prototype.saveCredentials = function (creds) {
    if (!this._initialized || !this._db) {
      return Promise.reject(new Error('Firebase not initialized'));
    }

    var self = this;
    var data = {
      serverUrl: creds.serverUrl || '',
      username:  creds.username || '',
      password:  creds.password || '',
      updatedAt: firebase.database.ServerValue.TIMESTAMP
    };

    return this._db.ref(DB_PATHS.credentials).set(data)
      .then(function () {
        console.info('[FirebaseDB] Credentials saved to Firebase.');
        self.emit('credentialsUpdated', data);
      })
      .catch(function (err) {
        console.error('[FirebaseDB] Failed to save credentials:', err);
        throw err;
      });
  };

  /**
   * Read IPTV credentials from Firebase.
   * @returns {Promise<Object|null>} Credentials object or null.
   */
  FirebaseDB.prototype.getCredentials = function () {
    if (!this._initialized || !this._db) {
      return Promise.resolve(null);
    }

    return this._db.ref(DB_PATHS.credentials).once('value')
      .then(function (snapshot) {
        var data = snapshot.val();
        if (data && data.serverUrl && data.username && data.password) {
          console.info('[FirebaseDB] Credentials loaded from Firebase.');
          return {
            serverUrl: data.serverUrl,
            username:  data.username,
            password:  data.password
          };
        }
        return null;
      })
      .catch(function (err) {
        console.warn('[FirebaseDB] Failed to read credentials:', err);
        return null;
      });
  };

  /**
   * Listen for real-time changes to credentials.
   * @private
   */
  FirebaseDB.prototype._listenForChanges = function () {
    if (!this._initialized || !this._db) return;

    var self = this;
    var ref = this._db.ref(DB_PATHS.credentials);

    ref.on('value', function (snapshot) {
      var data = snapshot.val();
      if (data && data.serverUrl) {
        self.emit('credentialsChanged', {
          serverUrl: data.serverUrl,
          username:  data.username,
          password:  data.password
        });
      }
    });

    this._listeners.push({ ref: ref, event: 'value' });
  };

  // ---------------------------------------------------------------------------
  // App Settings
  // ---------------------------------------------------------------------------

  /**
   * Save app settings to Firebase.
   * @param {Object} settings
   * @returns {Promise<void>}
   */
  FirebaseDB.prototype.saveSettings = function (settings) {
    if (!this._initialized || !this._db) {
      return Promise.resolve(); // Silent fail
    }

    var data = Object.assign({}, settings, {
      updatedAt: firebase.database.ServerValue.TIMESTAMP
    });

    // Remove sensitive data before saving
    delete data.username;
    delete data.password;

    return this._db.ref(DB_PATHS.settings).set(data)
      .then(function () {
        console.info('[FirebaseDB] Settings saved to Firebase.');
      })
      .catch(function (err) {
        console.warn('[FirebaseDB] Failed to save settings:', err);
      });
  };

  /**
   * Read app settings from Firebase.
   * @returns {Promise<Object|null>}
   */
  FirebaseDB.prototype.getSettings = function () {
    if (!this._initialized || !this._db) {
      return Promise.resolve(null);
    }

    return this._db.ref(DB_PATHS.settings).once('value')
      .then(function (snapshot) {
        var data = snapshot.val();
        if (data) {
          console.info('[FirebaseDB] Settings loaded from Firebase.');
          delete data.updatedAt;
          return data;
        }
        return null;
      })
      .catch(function (err) {
        console.warn('[FirebaseDB] Failed to read settings:', err);
        return null;
      });
  };

  // ---------------------------------------------------------------------------
  // User Data
  // ---------------------------------------------------------------------------

  /**
   * Save user-specific data (watch history, favorites count, etc.)
   * @param {string} userId
   * @param {Object} data
   * @returns {Promise<void>}
   */
  FirebaseDB.prototype.saveUserData = function (userId, data) {
    if (!this._initialized || !this._db || !userId) {
      return Promise.resolve();
    }

    return this._db.ref(DB_PATHS.users + '/' + encodeURIComponent(userId)).update(data)
      .catch(function (err) {
        console.warn('[FirebaseDB] Failed to save user data:', err);
      });
  };

  /**
   * Read user-specific data.
   * @param {string} userId
   * @returns {Promise<Object|null>}
   */
  FirebaseDB.prototype.getUserData = function (userId) {
    if (!this._initialized || !this._db || !userId) {
      return Promise.resolve(null);
    }

    return this._db.ref(DB_PATHS.users + '/' + encodeURIComponent(userId)).once('value')
      .then(function (snapshot) {
        return snapshot.val();
      })
      .catch(function () {
        return null;
      });
  };

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  /**
   * Remove all real-time listeners.
   */
  FirebaseDB.prototype.destroy = function () {
    if (this._listeners) {
      this._listeners.forEach(function (l) {
        l.ref.off(l.event);
      });
      this._listeners = [];
    }
    this._initialized = false;
  };

  /**
   * Check if Firebase is initialized and available.
   * @returns {boolean}
   */
  FirebaseDB.prototype.isReady = function () {
    return this._initialized === true && this._db !== null;
  };

  // ---------------------------------------------------------------------------
  // Register
  // ---------------------------------------------------------------------------

  global[NAMESPACE] = global[NAMESPACE] || {};
  global[NAMESPACE].FirebaseDB = FirebaseDB;

})(window);