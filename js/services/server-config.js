/**
 * NASR LIVE - Server Configuration Service
 *
 * Replaces the previous Firebase-based, multi-account authentication system.
 * This app is a personal, single-user IPTV client: there is no login/registration,
 * no cloud account, and no per-user server storage. The Xtream server
 * credentials (URL, username, password) are entered once on first launch,
 * validated against the server, then encrypted and stored ONLY on this
 * device (localStorage). Nothing is sent to, or stored on, any Anthropic-
 * unrelated third-party backend.
 *
 * Exposed globally as: window.ServerConfig
 *
 * @namespace ServerConfig
 */
(function () {
  'use strict';

  /** @constant {string} localStorage key for the encrypted server config */
  var STORAGE_KEY = 'nasr_server_config';

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

  var ServerConfig = {
    /**
     * Attempts to restore a previously saved server connection.
     * @returns {Promise<boolean>} true if a valid saved connection was restored.
     */
    async init() {
      _config = _load();
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
     * (encrypted) to this device only, replacing any previous config.
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

      document.dispatchEvent(new CustomEvent('server:connected'));
    },

    /**
     * Removes the saved server configuration from this device and forgets
     * the active client. Does not contact any server.
     */
    disconnect() {
      localStorage.removeItem(STORAGE_KEY);
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
        hasConfig: this.hasConfig()
      };
    }
  };

  window.ServerConfig = ServerConfig;
})();
