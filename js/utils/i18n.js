/**
 * NASR LIVE - Internationalization (i18n) Module
 * Vanilla JS global class for multi-language support
 */
(function () {
  'use strict';

  var SUPPORTED_LANGUAGES = ['ar', 'en'];
  var DEFAULT_LANGUAGE = 'ar';
  var STORAGE_KEY = 'nasr_language';
  var BASE_PATH = 'lang/';

  /**
   * Recursively resolve a dot-notation key against a nested object.
   * e.g. resolveKey({ auth: { title: 'X' } }, 'auth.title') → 'X'
   */
  function resolveKey(obj, key) {
    if (!key || !obj) return undefined;
    var parts = key.split('.');
    var current = obj;
    for (var i = 0; i < parts.length; i++) {
      if (current === null || current === undefined) return undefined;
      current = current[parts[i]];
    }
    return current;
  }

  /**
   * I18n Constructor
   */
  function I18n() {
    this._translations = {};   // { lang: { ... } }
    this._currentLang = DEFAULT_LANGUAGE;
    this._fallbackLang = DEFAULT_LANGUAGE;
    this._ready = false;
    this._pendingCallbacks = [];
  }

  /**
   * Detect the best language from the browser.
   * Returns a language code that exists in SUPPORTED_LANGUAGES,
   * or falls back to DEFAULT_LANGUAGE.
   */
  I18n.prototype._detectLanguage = function () {
    // 1. Check localStorage
    var stored = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch (e) { /* ignore */ }
    if (stored && SUPPORTED_LANGUAGES.indexOf(stored) !== -1) {
      return stored;
    }

    // 2. Check browser language
    var browserLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
    if (browserLang) {
      // e.g. "ar-SA" → try "ar-SA" then "ar"
      if (SUPPORTED_LANGUAGES.indexOf(browserLang) !== -1) {
        return browserLang;
      }
      var short = browserLang.split('-')[0];
      if (SUPPORTED_LANGUAGES.indexOf(short) !== -1) {
        return short;
      }
    }

    // 3. Fallback
    return DEFAULT_LANGUAGE;
  };

  /**
   * Fetch and cache a translation file.
   * @param {string} lang
   * @returns {Promise<object>}
   */
  I18n.prototype._loadTranslation = function (lang) {
    // Return from cache if already loaded
    if (this._translations[lang]) {
      return Promise.resolve(this._translations[lang]);
    }

    var self = this;
    return fetch(BASE_PATH + lang + '.json')
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Failed to load translation file: ' + lang + '.json (' + response.status + ')');
        }
        return response.json();
      })
      .then(function (data) {
        self._translations[lang] = data;
        return data;
      });
  };

  /**
   * Apply translations to all elements with data-i18n or data-i18n-placeholder.
   */
  I18n.prototype._applyTranslations = function () {
    var self = this;

    // Translate text content
    var elements = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      var key = el.getAttribute('data-i18n');
      var translation = self.t(key);
      if (translation !== undefined && translation !== null) {
        el.textContent = translation;
      }
    }

    // Translate placeholders
    var placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
    for (var j = 0; j < placeholderElements.length; j++) {
      var pEl = placeholderElements[j];
      var pKey = pEl.getAttribute('data-i18n-placeholder');
      var pTranslation = self.t(pKey);
      if (pTranslation !== undefined && pTranslation !== null) {
        pEl.setAttribute('placeholder', pTranslation);
      }
    }
  };

  /**
   * Update document-level lang and dir attributes.
   */
  I18n.prototype._updateDocumentAttributes = function () {
    document.documentElement.lang = this._currentLang;
    document.documentElement.dir = this._isRTL(this._currentLang) ? 'rtl' : 'ltr';
  };

  /**
   * Check if a language is RTL.
   * @param {string} lang
   * @returns {boolean}
   */
  I18n.prototype._isRTL = function (lang) {
    return lang === 'ar';
  };

  /**
   * Dispatch the 'languageChanged' custom event.
   */
  I18n.prototype._dispatchEvent = function () {
    try {
      var event = new CustomEvent('languageChanged', {
        detail: {
          language: this._currentLang,
          isRTL: this.isRTL()
        },
        bubbles: true,
        cancelable: true
      });
      document.dispatchEvent(event);
    } catch (e) {
      // Fallback for older browsers
      var eventFallback = document.createEvent('CustomEvent');
      eventFallback.initCustomEvent('languageChanged', true, true, {
        language: this._currentLang,
        isRTL: this.isRTL()
      });
      document.dispatchEvent(eventFallback);
    }
  };

  /**
   * Initialize the i18n system.
   * Detects language, loads translations, applies them to the DOM.
   * @returns {Promise<void>}
   */
  I18n.prototype.init = function () {
    var self = this;

    // Detect and set language
    var detectedLang = this._detectLanguage();
    this._currentLang = detectedLang;

    return this._loadTranslation(detectedLang)
      .then(function () {
        // Also preload fallback language
        return self._loadTranslation(self._fallbackLang);
      })
      .then(function () {
        self._updateDocumentAttributes();
        self._applyTranslations();
        self._ready = true;

        // Execute any pending callbacks
        for (var i = 0; i < self._pendingCallbacks.length; i++) {
          self._pendingCallbacks[i]();
        }
        self._pendingCallbacks = [];

        self._dispatchEvent();
      })
      .catch(function (err) {
        console.error('[I18n] Initialization failed:', err);
        // Still mark as ready with fallback
        self._ready = true;
        self._updateDocumentAttributes();
      });
  };

  /**
   * Set the active language, load its translations, and update the DOM.
   * @param {string} lang - Language code (e.g. 'ar', 'en')
   * @returns {Promise<void>}
   */
  I18n.prototype.setLanguage = function (lang) {
    if (!lang || typeof lang !== 'string') {
      return Promise.reject(new Error('Invalid language code'));
    }

    lang = lang.toLowerCase().trim();

    if (SUPPORTED_LANGUAGES.indexOf(lang) === -1) {
      console.warn('[I18n] Unsupported language: ' + lang + '. Supported: ' + SUPPORTED_LANGUAGES.join(', '));
      return Promise.reject(new Error('Unsupported language: ' + lang));
    }

    var self = this;
    var previousLang = this._currentLang;

    return this._loadTranslation(lang)
      .then(function () {
        self._currentLang = lang;

        // Persist preference
        try {
          localStorage.setItem(STORAGE_KEY, lang);
        } catch (e) { /* ignore */ }

        self._updateDocumentAttributes();
        self._applyTranslations();
        self._dispatchEvent();
      })
      .catch(function (err) {
        console.error('[I18n] Failed to set language to ' + lang + ':', err);
        // Revert to previous language
        self._currentLang = previousLang;
        throw err;
      });
  };

  /**
   * Translate a key using dot-notation.
   * Falls back to the default language if key not found in current language.
   * @param {string} key - Dot-notation key, e.g. 'auth.title'
   * @param {object} [params] - Optional key-value pairs for interpolation (e.g. { name: 'John' })
   * @returns {string} The translated string, or the key itself if not found
   */
  I18n.prototype.t = function (key, params) {
    if (!key || typeof key !== 'string') return key || '';

    // Try current language first
    var translation = resolveKey(this._translations[this._currentLang], key);

    // Fall back to default language
    if (translation === undefined || translation === null) {
      translation = resolveKey(this._translations[this._fallbackLang], key);
    }

    // Return key if nothing found
    if (translation === undefined || translation === null) {
      return key;
    }

    // Interpolation: replace {{param}} with values
    if (params && typeof params === 'object') {
      var keys = Object.keys(params);
      for (var i = 0; i < keys.length; i++) {
        var placeholder = '{{' + keys[i] + '}}';
        translation = translation.split(placeholder).join(String(params[keys[i]]));
      }
    }

    return translation;
  };

  /**
   * Get the current active language code.
   * @returns {string}
   */
  I18n.prototype.getCurrentLang = function () {
    return this._currentLang;
  };

  /**
   * Check if the current language is RTL.
   * @returns {boolean}
   */
  I18n.prototype.isRTL = function () {
    return this._isRTL(this._currentLang);
  };

  /**
   * Check if the i18n system is ready (initialization complete).
   * @returns {boolean}
   */
  I18n.prototype.isReady = function () {
    return this._ready;
  };

  /**
   * Register a callback to run once i18n is ready.
   * If already ready, runs immediately.
   * @param {function} callback
   */
  I18n.prototype.onReady = function (callback) {
    if (this._ready) {
      callback();
    } else {
      this._pendingCallbacks.push(callback);
    }
  };

  /**
   * Get list of supported language codes.
   * @returns {string[]}
   */
  I18n.prototype.getSupportedLanguages = function () {
    return SUPPORTED_LANGUAGES.slice();
  };

  /**
   * Add a translation object for a given language (useful for dynamic/inline translations).
   * @param {string} lang
   * @param {object} translations
   */
  I18n.prototype.addTranslations = function (lang, translations) {
    if (!lang || !translations) return;
    if (!this._translations[lang]) {
      this._translations[lang] = {};
    }
    // Deep merge
    deepMerge(this._translations[lang], translations);
  };

  /**
   * Deep merge source into target.
   */
  function deepMerge(target, source) {
    for (var key in source) {
      if (source.hasOwnProperty(key)) {
        if (
          source[key] &&
          typeof source[key] === 'object' &&
          !Array.isArray(source[key]) &&
          target[key] &&
          typeof target[key] === 'object' &&
          !Array.isArray(target[key])
        ) {
          deepMerge(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
    }
    return target;
  }

  // Expose as global
  window.I18n = I18n;

  // Auto-instantiate a singleton for convenience
  window.i18n = new I18n();

})();