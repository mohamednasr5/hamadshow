/**
 * Hamad Show — Encrypted Local Storage Module
 * =============================================
 * Thin wrapper around localStorage that applies XOR-based obfuscation to
 * every stored value, preventing trivial inspection of persisted data.
 *
 * **Security note:** This is *not* cryptographic encryption — it is a
 * simple obfuscation layer suitable for discouraging casual snooping of
 * user preferences, tokens, and history.  Sensitive credentials should
 * never be stored client-side without proper transport-level security.
 *
 * @namespace HamadShow.StorageManager
 * @module storage
 */

(function (global) {
  'use strict';

  const NAMESPACE = 'HamadShow';

  // ---------------------------------------------------------------------------
  // Derive a numeric key from the app name (deterministic, same every run).
  // The key is a 32-bit integer derived by XOR-folding the char codes.
  // ---------------------------------------------------------------------------
  const APP_NAME = 'Hamad Show';

  function _deriveKey() {
    let key = 0x5A; // arbitrary seed
    for (let i = 0; i < APP_NAME.length; i++) {
      key = ((key << 5) - key + APP_NAME.charCodeAt(i)) | 0;
    }
    return key;
  }

  const ENCRYPTION_KEY = _deriveKey();

  // ---------------------------------------------------------------------------
  // Storage key prefix — isolates our keys from other apps sharing the origin.
  // ---------------------------------------------------------------------------
  const PREFIX = `${NAMESPACE}_`;

  // ---------------------------------------------------------------------------
  // StorageManager
  // ---------------------------------------------------------------------------
  class StorageManager {
    // -----------------------------------------------------------------------
    // Encryption / decryption
    // -----------------------------------------------------------------------

    /**
     * XOR-encode a UTF-8 string, then base64-encode the result.
     *
     * @param  {string} plainText
     * @returns {string} Base64-encoded ciphertext.
     */
    static encrypt(plainText) {
      if (typeof plainText !== 'string') return '';
      // Encode to UTF-8 bytes via TextEncoder.
      const encoder = new TextEncoder();
      const bytes = encoder.encode(plainText);

      const encrypted = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) {
        // Rotate the key byte per position to avoid a simple repeating pattern.
        const keyByte = (ENCRYPTION_KEY >>> (i % 32)) & 0xFF;
        encrypted[i] = bytes[i] ^ keyByte;
      }

      // Convert to base64 for safe localStorage storage.
      let binary = '';
      for (let i = 0; i < encrypted.length; i++) {
        binary += String.fromCharCode(encrypted[i]);
      }
      return btoa(binary);
    }

    /**
     * Base64-decode then XOR-decode back to the original UTF-8 string.
     *
     * @param  {string} cipherText  Base64-encoded ciphertext.
     * @returns {string} Original plaintext, or empty string on failure.
     */
    static decrypt(cipherText) {
      if (typeof cipherText !== 'string') return '';
      try {
        const binary = atob(cipherText);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          const keyByte = (ENCRYPTION_KEY >>> (i % 32)) & 0xFF;
          bytes[i] = binary.charCodeAt(i) ^ keyByte;
        }
        const decoder = new TextDecoder();
        return decoder.decode(bytes);
      } catch {
        return '';
      }
    }

    // -----------------------------------------------------------------------
    // Primitive get / set / remove / clear / has
    // -----------------------------------------------------------------------

    /**
     * Encrypt and store a value.
     *
     * @param {string} key
     * @param {string} value
     */
    static set(key, value) {
      try {
        localStorage.setItem(PREFIX + key, StorageManager.encrypt(String(value)));
      } catch {
        // Storage full or unavailable — silently degrade.
      }
    }

    /**
     * Retrieve and decrypt a stored value.
     *
     * @param  {string} key
     * @param  {string} [defaultValue='']
     * @returns {string}
     */
    static get(key, defaultValue = '') {
      try {
        const raw = localStorage.getItem(PREFIX + key);
        if (raw === null) return defaultValue;
        const decrypted = StorageManager.decrypt(raw);
        return decrypted || defaultValue;
      } catch {
        return defaultValue;
      }
    }

    /**
     * Remove a single key.
     *
     * @param {string} key
     */
    static remove(key) {
      try {
        localStorage.removeItem(PREFIX + key);
      } catch {
        // no-op
      }
    }

    /**
     * Remove all keys that belong to this application.
     */
    static clear() {
      try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(PREFIX)) keysToRemove.push(k);
        }
        for (const k of keysToRemove) {
          localStorage.removeItem(k);
        }
      } catch {
        // no-op
      }
    }

    /**
     * Check whether a key exists in storage.
     *
     * @param  {string} key
     * @returns {boolean}
     */
    static has(key) {
      try {
        return localStorage.getItem(PREFIX + key) !== null;
      } catch {
        return false;
      }
    }

    // -----------------------------------------------------------------------
    // JSON convenience wrappers
    // -----------------------------------------------------------------------

    /**
     * Retrieve a value, parse it as JSON.
     *
     * @param  {string} key
     * @param  {*}      [defaultValue=null]
     * @returns {*} Parsed value or defaultValue.
     */
    static getJSON(key, defaultValue = null) {
      const raw = StorageManager.get(key, '');
      if (!raw) return defaultValue;
      try {
        return JSON.parse(raw);
      } catch {
        return defaultValue;
      }
    }

    /**
     * Stringify a value and store it encrypted.
     *
     * @param {string} key
     * @param {*}      value  Any JSON-serialisable value.
     */
    static setJSON(key, value) {
      try {
        StorageManager.set(key, JSON.stringify(value));
      } catch {
        // no-op
      }
    }

    // -----------------------------------------------------------------------
    // Domain-specific typed accessors
    // -----------------------------------------------------------------------
    // Each accessor wraps getJSON / setJSON with a well-known key so that
    // callers never have to remember storage key strings.

    /* -- Settings --------------------------------------------------------- */

    /**
     * Retrieve the persisted application settings.
     *
     * @returns {Object}
     */
    static getSettings() {
      return StorageManager.getJSON('settings', {});
    }

    /**
     * Persist application settings.
     *
     * @param {Object} settings
     */
    static saveSettings(settings) {
      StorageManager.setJSON('settings', settings);
    }

    /* -- User ------------------------------------------------------------- */

    /**
     * Retrieve the logged-in user record (from the Xtream Codes login
     * response).
     *
     * @returns {Object|null}
     */
    static getUser() {
      return StorageManager.getJSON('user', null);
    }

    /**
     * Persist the user record.
     *
     * @param {Object} user
     */
    static saveUser(user) {
      StorageManager.setJSON('user', user);
    }

    /* -- Favorites -------------------------------------------------------- */

    /**
     * Retrieve the user's favourites list (array of stream / series IDs).
     *
     * @returns {Array}
     */
    static getFavorites() {
      return StorageManager.getJSON('favorites', []);
    }

    /**
     * Persist the favourites list.
     *
     * @param {Array} list
     */
    static saveFavorites(list) {
      StorageManager.setJSON('favorites', list);
    }

    /* -- Watch history ---------------------------------------------------- */

    /**
     * Retrieve the watch-history list (array of history entries).
     *
     * @returns {Array}
     */
    static getHistory() {
      return StorageManager.getJSON('history', []);
    }

    /**
     * Persist the watch-history list.
     *
     * @param {Array} list
     */
    static saveHistory(list) {
      StorageManager.setJSON('history', list);
    }

    /* -- Continue watching ------------------------------------------------ */

    /**
     * Retrieve the "continue watching" list (recently in-progress items).
     *
     * @returns {Array}
     */
    static getContinueWatching() {
      return StorageManager.getJSON('continue_watching', []);
    }

    /**
     * Persist the "continue watching" list.
     *
     * @param {Array} list
     */
    static saveContinueWatching(list) {
      StorageManager.setJSON('continue_watching', list);
    }

    /* -- Search history --------------------------------------------------- */

    /**
     * Retrieve the full search-history list.
     *
     * @returns {Array<string>}
     */
    static getSearchHistory() {
      return StorageManager.getJSON('search_history', []);
    }

    /**
     * Persist the full search-history list.
     *
     * @param {Array<string>} list
     */
    static saveSearchHistory(list) {
      StorageManager.setJSON('search_history', list);
    }

    /**
     * Return the most recent search terms (newest first), limited to the
     * last `limit` entries.
     *
     * @param  {number} [limit=10]
     * @returns {string[]}
     */
    static getRecentSearches(limit = 10) {
      const history = StorageManager.getSearchHistory();
      return history.slice(0, limit);
    }

    /**
     * Append a search term to the history, de-duplicating so it moves to
     * the front.  Caps the total at 50 entries to avoid unbounded growth.
     *
     * @param {string} term
     */
    static addRecentSearch(term) {
      if (typeof term !== 'string' || !term.trim()) return;
      const trimmed = term.trim();
      const history = StorageManager.getSearchHistory();

      // Remove existing occurrences so the term appears only once, at index 0.
      const filtered = history.filter((t) => t !== trimmed);
      filtered.unshift(trimmed);

      // Cap at 50 entries.
      StorageManager.saveSearchHistory(filtered.slice(0, 50));
    }

    /* -- Pinned channels -------------------------------------------------- */

    /**
     * Retrieve the pinned-live-channels list.
     *
     * @returns {Array}
     */
    static getPinnedChannels() {
      return StorageManager.getJSON('pinned_channels', []);
    }

    /**
     * Persist the pinned-live-channels list.
     *
     * @param {Array} list
     */
    static savePinnedChannels(list) {
      StorageManager.setJSON('pinned_channels', list);
    }
  }

  // ---------------------------------------------------------------------------
  // Register on the global namespace
  // ---------------------------------------------------------------------------
  global[NAMESPACE] = global[NAMESPACE] || {};
  global[NAMESPACE].StorageManager = StorageManager;
})(window);