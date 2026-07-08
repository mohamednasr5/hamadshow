/**
 * NASR LIVE - Server Configuration Service
 *
 * This app is a personal, single-user IPTV client: there is no login or
 * registration screen — just one "Setup" page where the Xtream server
 * credentials (URL, username, password) are entered once. They are
 * validated against the server, then:
 *
 *   1. Encrypted and stored on THIS device (localStorage) so the app can
 *      reconnect instantly next time, going straight to the viewing screens.
 *   2. If Firebase is configured (see js/services/firebase-config.js), the
 *      same encrypted config is also backed up to Firebase Realtime
 *      Database under an anonymous account, so reinstalling the app or
 *      opening it on a new device can restore the connection automatically.
 *      This step is best-effort and never blocks or breaks local usage if
 *      Firebase is unavailable, unconfigured, or offline.
 *
 * Exposed globally as: window.ServerConfig
 *
 * @namespace ServerConfig
 */
(function () {
  'use strict';

  /** @constant {string} localStorage key for the encrypted server config */
  var STORAGE_KEY = 'nasr_server_config';

  /** @constant {string} localStorage key caching the anonymous Firebase uid */
  var FB_UID_KEY = 'nasr_fb_uid';

  /** @type {XtreamAPI|null} */
  var _client = null;

  /** @type {{serverUrl:string,username:string,password:string}|null} */
  var _config = null;

  function _save(cfg) {
    var payload = JSON.stringify(cfg);
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
      console.warn('ServerConfig: failed to read saved config, clearing.', e);
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }

  // ── Firebase backup/restore (best-effort, optional) ──────────────────────

  function _firebaseReady() {
    return !!(window.FIREBASE_ENABLED && typeof firebase !== 'undefined' && firebase.auth && firebase.database);
  }

  /** Signs in anonymously (or reuses the current session) and resolves the uid. */
  function _fbEnsureUser() {
    if (!_firebaseReady()) return Promise.reject(new Error('Firebase not configured'));
    var auth = firebase.auth();
    if (auth.currentUser) return Promise.resolve(auth.currentUser.uid);
    return auth.signInAnonymously().then(function (cred) {
      var uid = cred.user.uid;
      try { localStorage.setItem(FB_UID_KEY, uid); } catch (e) {}
      return uid;
    });
  }

  /** Best-effort: pushes the given config to Firebase RTDB. Never throws. */
  function _fbBackup(cfg) {
    if (!_firebaseReady()) return;
    _fbEnsureUser().then(function (uid) {
      var payload = JSON.stringify(cfg);
      var enc = window.Crypto ? window.Crypto.encrypt(payload) : payload;
      return firebase.database().ref('users/' + uid + '/serverConfig').set({
        data: enc,
        updatedAt: firebase.database.ServerValue.TIMESTAMP
      });
    }).catch(function (err) {
      console.warn('ServerConfig: Firebase backup failed (ignored).', err);
    });
  }

  /** Best-effort: tries to restore a config previously backed up to Firebase. */
  function _fbRestore() {
    if (!_firebaseReady()) return Promise.resolve(null);
    return _fbEnsureUser().then(function (uid) {
      return firebase.database().ref('users/' + uid + '/serverConfig').once('value');
    }).then(function (snapshot) {
      var data = snapshot.val();
      if (!data || !data.data) return null;
      var dec = window.Crypto ? window.Crypto.decrypt(data.data) : data.data;
      return JSON.parse(dec);
    }).catch(function (err) {
      console.warn('ServerConfig: Firebase restore failed (ignored).', err);
      return null;
    });
  }

  /** Best-effort: removes the backed-up config from Firebase. */
  function _fbClear() {
    if (!_firebaseReady()) return;
    _fbEnsureUser().then(function (uid) {
      return firebase.database().ref('users/' + uid + '/serverConfig').remove();
    }).catch(function () {});
  }

  var ServerConfig = {
    /**
     * Attempts to restore a previously saved server connection: checks this
     * device first (fast path, works offline), and if nothing is saved
     * locally, falls back to any Firebase backup so the app can still go
     * straight to the viewing screens after a reinstall or on a new device.
     * @returns {Promise<boolean>} true if a valid saved connection was restored.
     */
    async init() {
      _config = _load();

      if (!_config) {
        _config = await _fbRestore();
        if (_config) _save(_config); // cache locally for instant future launches
      }

      if (!_config) return false;

      try {
        _client = new window.XtreamAPI(_config.serverUrl, _config.username, _config.password);
        await _client.authenticate();
        window.XtreamClient = _client;
        return true;
      } catch (err) {
        console.warn('ServerConfig: saved server is unreachable/invalid.', err);
        _client = null;
        return false;
      }
    },

    /** @returns {boolean} whether a server config is currently saved on this device */
    hasConfig() {
      return !!_config || !!localStorage.getItem(STORAGE_KEY);
    },

    /** @returns {XtreamAPI|null} */
    getXtreamClient() {
      return _client;
    },

    /**
     * Validates the given server credentials, and if successful, saves them
     * (encrypted) to this device, replacing any previous config, and backs
     * them up to Firebase (if configured) so future installs/devices can
     * restore the connection automatically.
     * @param {string} serverUrl
     * @param {string} username
     * @param {string} password
     * @returns {Promise<void>}
     */
    async connect(serverUrl, username, password) {
      serverUrl = (serverUrl || '').trim().replace(/\/+$/, '');
      username = (username || '').trim();
      if (!/^https?:\/\//i.test(serverUrl)) {
        throw new Error('serverUrl must start with http:// or https://');
      }
      var client = new window.XtreamAPI(serverUrl, username, password);
      await client.authenticate(); // throws on bad credentials / unreachable server

      _config = { serverUrl: serverUrl, username: username, password: password };
      _client = client;
      window.XtreamClient = client;
      _save(_config);
      _fbBackup(_config); // best-effort, does not block or fail the connect flow

      document.dispatchEvent(new CustomEvent('server:connected'));
    },

    /**
     * Removes the saved server configuration from this device (and, best
     * effort, from Firebase) and forgets the active client.
     */
    disconnect() {
      localStorage.removeItem(STORAGE_KEY);
      _fbClear();
      _config = null;
      _client = null;
      window.XtreamClient = null;
      document.dispatchEvent(new CustomEvent('server:disconnected'));
    },

    /**
     * Returns only the connection status - never the raw credentials - so
     * UI code can display "Connected" without ever surfacing server details.
     */
    getStatus() {
      return {
        connected: !!(_client && _client.isAuthenticated()),
        hasConfig: this.hasConfig(),
        firebaseSyncEnabled: _firebaseReady()
      };
    }
  };

  window.ServerConfig = ServerConfig;
})();
