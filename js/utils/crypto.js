/**
 * NASR LIVE - Crypto Utility
 * 
 * Simple encryption/decryption module using XOR cipher + Base64 encoding.
 * Uses a fixed application key for all operations. Not intended for
 * top-secret data, but provides a basic layer of obfuscation for
 * sensitive configuration values stored in Firebase RTDB.
 *
 * Exposed globally as: window.Crypto
 *
 * @namespace Crypto
 */
(function () {
  'use strict';

  /** @constant {string} Fixed application encryption key */
  var APP_KEY = 'nasr-live-2024-secure-key';

  /**
   * Converts a UTF-8 string into an array of character codes.
   * Uses encodeURIComponent to safely handle multi-byte Unicode characters.
   *
   * @private
   * @param {string} str - The UTF-8 string to convert.
   * @returns {number[]} Array of byte values representing the string.
   */
  function _stringToBytes(str) {
    var encoded = encodeURIComponent(str);
    var bytes = [];
    for (var i = 0; i < encoded.length; i++) {
      var ch = encoded.charCodeAt(i);
      if (ch === 37) { // '%' character from percent-encoding
        var hex = encoded.substring(i + 1, i + 3);
        bytes.push(parseInt(hex, 16));
        i += 2;
      } else {
        bytes.push(ch);
      }
    }
    return bytes;
  }

  /**
   * Converts an array of byte values back into a UTF-8 string.
   * Reverses the percent-encoding performed by _stringToBytes.
   *
   * @private
   * @param {number[]} bytes - Array of byte values.
   * @returns {string} The decoded UTF-8 string.
   */
  function _bytesToString(bytes) {
    var encoded = '';
    for (var i = 0; i < bytes.length; i++) {
      var byte = bytes[i];
      if (byte < 128) {
        encoded += String.fromCharCode(byte);
      } else {
        encoded += '%' + ('0' + byte.toString(16)).slice(-2);
      }
    }
    return decodeURIComponent(encoded);
  }

  /**
   * XORs each byte in the data array with the corresponding byte of the key.
   * The key repeats cyclically if it is shorter than the data.
   *
   * @private
   * @param {number[]} data - Input byte array.
   * @param {string} key - The XOR key string.
   * @returns {number[]} XORed byte array.
   */
  function _xorBytes(data, key) {
    var result = [];
    for (var i = 0; i < data.length; i++) {
      result.push(data[i] ^ key.charCodeAt(i % key.length));
    }
    return result;
  }

  /**
   * Converts a byte array to a Base64 encoded string.
   * Groups bytes into 6-bit chunks and maps them to the Base64 alphabet.
   *
   * @private
   * @param {number[]} bytes - The byte array to encode.
   * @returns {string} Base64 encoded string.
   */
  function _bytesToBase64(bytes) {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    var result = '';
    var len = bytes.length;

    for (var i = 0; i < len; i += 3) {
      var b1 = bytes[i];
      var b2 = (i + 1 < len) ? bytes[i + 1] : 0;
      var b3 = (i + 2 < len) ? bytes[i + 2] : 0;

      var triplet = (b1 << 16) | (b2 << 8) | b3;

      result += chars[(triplet >> 18) & 0x3F];
      result += chars[(triplet >> 12) & 0x3F];
      result += (i + 1 < len) ? chars[(triplet >> 6) & 0x3F] : '=';
      result += (i + 2 < len) ? chars[triplet & 0x3F] : '=';
    }

    return result;
  }

  /**
   * Decodes a Base64 encoded string back into a byte array.
   *
   * @private
   * @param {string} base64 - The Base64 string to decode.
   * @returns {number[]} The decoded byte array.
   */
  function _base64ToBytes(base64) {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    var lookup = {};
    for (var c = 0; c < chars.length; c++) {
      lookup[chars[c]] = c;
    }

    // Remove whitespace and padding
    var str = base64.replace(/\s/g, '');
    var len = str.length;
    var bytes = [];

    for (var i = 0; i < len; i += 4) {
      var c1 = lookup[str[i]] || 0;
      var c2 = lookup[str[i + 1]] || 0;
      var c3 = (str[i + 2] === '=') ? 0 : (lookup[str[i + 2]] || 0);
      var c4 = (str[i + 3] === '=') ? 0 : (lookup[str[i + 3]] || 0);

      var triplet = (c1 << 18) | (c2 << 12) | (c3 << 6) | c4;

      if (i + 1 < len) bytes.push((triplet >> 16) & 0xFF);
      if (i + 2 < len && str[i + 2] !== '=') bytes.push((triplet >> 8) & 0xFF);
      if (i + 3 < len && str[i + 3] !== '=') bytes.push(triplet & 0xFF);
    }

    return bytes;
  }

  /**
   * Encrypts a plain text string using XOR cipher with the application key,
   * then encodes the result as Base64.
   *
   * @example
   * var encrypted = Crypto.encrypt('my-secret-value');
   * // => "cGFzdzEy..."
   *
   * @param {string} text - The plain text to encrypt. Must be a valid UTF-8 string.
   * @param {string} [key=APP_KEY] - Optional custom key. Defaults to the fixed app key.
   * @returns {string} Base64 encoded ciphertext.
   * @throws {Error} If text is not a non-empty string.
   */
  function encrypt(text, key) {
    if (typeof text !== 'string' || text.length === 0) {
      throw new Error('Crypto.encrypt: text must be a non-empty string');
    }

    var encryptionKey = (typeof key === 'string' && key.length > 0) ? key : APP_KEY;
    var bytes = _stringToBytes(text);
    var xored = _xorBytes(bytes, encryptionKey);
    return _bytesToBase64(xored);
  }

  /**
   * Decrypts a Base64 encoded ciphertext back to the original plain text
   * by reversing the Base64 encoding and then applying XOR with the key.
   *
   * @example
   * var decrypted = Crypto.decrypt('cGFzdzEy...');
   * // => "my-secret-value"
   *
   * @param {string} ciphertext - The Base64 encoded ciphertext to decrypt.
   * @param {string} [key=APP_KEY] - Optional custom key. Must match the key used for encryption.
   * @returns {string} The original decrypted plain text string.
   * @throws {Error} If ciphertext is not a non-empty string or if decryption fails.
   */
  function decrypt(ciphertext, key) {
    if (typeof ciphertext !== 'string' || ciphertext.length === 0) {
      throw new Error('Crypto.decrypt: ciphertext must be a non-empty string');
    }

    try {
      var encryptionKey = (typeof key === 'string' && key.length > 0) ? key : APP_KEY;
      var bytes = _base64ToBytes(ciphertext);
      var xored = _xorBytes(bytes, encryptionKey);
      return _bytesToString(xored);
    } catch (e) {
      throw new Error('Crypto.decrypt: failed to decrypt - ' + e.message);
    }
  }

  // ── Public API ──────────────────────────────────────────────────────────
  window.Crypto = {
    /** Application-level encryption key constant */
    APP_KEY: APP_KEY,

    /**
     * Encrypt a plain text string to Base64 ciphertext.
     * @type {function(string, string=): string}
     */
    encrypt: encrypt,

    /**
     * Decrypt a Base64 ciphertext back to plain text.
     * @type {function(string, string=): string}
     */
    decrypt: decrypt
  };
})();