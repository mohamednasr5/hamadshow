/**
 * Hamad Show — Admin / Settings Module
 * =======================================
 * Provides the admin dashboard for configuring server connections,
 * appearance, splash screen, categories, notifications, cache, and more.
 * All settings are persisted through the encrypted StorageManager.
 *
 * Depends on:
 *   - HamadShow.Config         (DEFAULT_SETTINGS, API_ENDPOINTS)
 *   - HamadShow.Utils          (sanitize, generateId)
 *   - HamadShow.StorageManager (getSettings, saveSettings, getJSON, setJSON)
 *
 * @namespace HamadShow.Admin
 * @module admin
 */

(function (global) {
  'use strict';

  const NAMESPACE = 'HamadShow';

  // ---------------------------------------------------------------------------
  // Reference sibling modules — they must be loaded before this file.
  // ---------------------------------------------------------------------------
  const Config = global[NAMESPACE]?.Config;
  const Utils  = global[NAMESPACE]?.Utils;
  const StorageManager = global[NAMESPACE]?.StorageManager;

  if (!Config) {
    console.error('[HamadShow.Admin] HamadShow.Config is required but not found.');
    return;
  }
  if (!Utils) {
    console.error('[HamadShow.Admin] HamadShow.Utils is required but not found.');
    return;
  }
  if (!StorageManager) {
    console.error('[HamadShow.Admin] HamadShow.StorageManager is required but not found.');
    return;
  }

  // ---------------------------------------------------------------------------
  // Constants
  // ---------------------------------------------------------------------------

  /** Storage key for the full admin-settings object. */
  const ADMIN_SETTINGS_KEY = 'admin_settings';

  /** Storage key for the splash-screen configuration. */
  const SPLASH_SETTINGS_KEY = 'splash_settings';

  /** Storage key for category enable/disable map. */
  const CATEGORIES_KEY = 'categories_enabled';

  /** Default splash-screen settings. */
  const DEFAULT_SPLASH = Object.freeze({
    enabled: true,
    duration: 3000,        // ms
    showLogo: true,
    logoUrl: '',
    backgroundColor: '#0a0a0a',
    textColor: '#ffffff',
  });

  /** Default category settings. */
  const DEFAULT_CATEGORY_SETTINGS = Object.freeze({
    enabled: {},  // { categoryId: boolean }
  });

  /** Default admin settings (merged with Config.DEFAULT_SETTINGS). */
  const DEFAULT_ADMIN = Object.freeze({
    ...Config.DEFAULT_SETTINGS,
    // Admin-specific fields that extend the base config:
    logoUrl: '',
    splash: { ...DEFAULT_SPLASH },
    categories: { ...DEFAULT_CATEGORY_SETTINGS },
    notificationsEnabled: true,
    autoUpdateCheck: true,
  });

  // ---------------------------------------------------------------------------
  // AdminManager
  // ---------------------------------------------------------------------------
  class AdminManager {
    /**
     * Create a new AdminManager instance.
     */
    constructor() {
      /** @private */ this._listeners = {};
      /** @private */ this._settings = {};
      /** @private */ this._initialized = false;
    }

    // -----------------------------------------------------------------------
    // Event emitter
    // -----------------------------------------------------------------------

    /**
     * Subscribe to a named event.
     *
     * @param {string}   event    Event name (e.g. 'settingsChanged', 'themeChanged', 'connectionTested').
     * @param {Function} handler  Callback invoked with event data.
     * @returns {Function} Unsubscribe function.
     */
    on(event, handler) {
      if (typeof handler !== 'function') {
        throw new TypeError('AdminManager.on: handler must be a function');
      }
      (this._listeners[event] ||= []).push(handler);
      return () => this.off(event, handler);
    }

    /**
     * Remove an event listener.
     *
     * @param {string}   event
     * @param {Function} handler
     */
    off(event, handler) {
      const list = this._listeners[event];
      if (!list) return;
      this._listeners[event] = list.filter((fn) => fn !== handler);
    }

    /**
     * Emit an event, invoking all registered handlers.
     *
     * @param {string} event
     * @param {*}      data  Data forwarded to each handler.
     */
    emit(event, data) {
      const list = this._listeners[event];
      if (!list) return;
      for (const handler of [...list]) {
        try {
          handler(data);
        } catch (err) {
          console.error(`[AdminManager] Error in "${event}" handler:`, err);
        }
      }
    }

    // -----------------------------------------------------------------------
    // Lifecycle
    // -----------------------------------------------------------------------

    /**
     * Initialise the admin manager by loading persisted settings and
     * setting up any required form handlers. Should be called once after
     * DOMContentLoaded.
     */
    init() {
      if (this._initialized) return;
      this._initialized = true;

      // Load persisted settings, falling back to defaults.
      this._settings = this.getSettings();
    }

    // -----------------------------------------------------------------------
    // Settings CRUD
    // -----------------------------------------------------------------------

    /**
     * Get all admin settings (loaded from encrypted storage, merged over
     * the built-in defaults).
     *
     * @returns {Object} Full settings object.
     */
    getSettings() {
      const stored = StorageManager.getJSON(ADMIN_SETTINGS_KEY, {});

      // Deep-merge stored values over defaults for top-level keys.
      const merged = { ...DEFAULT_ADMIN };

      for (const key of Object.keys(DEFAULT_ADMIN)) {
        if (key in stored && stored[key] !== undefined) {
          if (
            typeof stored[key] === 'object' &&
            stored[key] !== null &&
            !Array.isArray(stored[key]) &&
            typeof DEFAULT_ADMIN[key] === 'object' &&
            DEFAULT_ADMIN[key] !== null
          ) {
            // Deep-merge plain objects (e.g. splash, categories).
            merged[key] = { ...DEFAULT_ADMIN[key], ...stored[key] };
          } else {
            merged[key] = stored[key];
          }
        }
      }

      return merged;
    }

    /**
     * Save all admin settings to encrypted storage. Only keys recognised
     * by DEFAULT_ADMIN are stored; unknown keys are silently ignored.
     *
     * @param {Object} settings
     */
    saveSettings(settings) {
      const safe = {};
      for (const key of Object.keys(DEFAULT_ADMIN)) {
        if (key in settings && settings[key] !== undefined) {
          safe[key] = settings[key];
        }
      }

      this._settings = { ...this._settings, ...safe };
      StorageManager.setJSON(ADMIN_SETTINGS_KEY, safe);

      // Also sync the base Config settings so other modules pick them up.
      const baseSettings = {};
      for (const key of Object.keys(Config.DEFAULT_SETTINGS)) {
        if (key in safe) baseSettings[key] = safe[key];
      }
      if (Object.keys(baseSettings).length > 0) {
        Config.saveSettings(baseSettings);
      }

      this.emit('settingsChanged', this._settings);
    }

    /**
     * Reset all settings back to the built-in defaults from Config and
     * clear any admin-specific overrides.
     */
    resetToDefaults() {
      this._settings = { ...DEFAULT_ADMIN };
      StorageManager.setJSON(ADMIN_SETTINGS_KEY, {});
      Config.saveSettings({});

      // Re-apply default theme.
      this.updateTheme(Config.DEFAULT_SETTINGS.primaryColor, Config.DEFAULT_SETTINGS.secondaryColor);

      this.emit('settingsChanged', this._settings);
    }

    // -----------------------------------------------------------------------
    // Appearance
    // -----------------------------------------------------------------------

    /**
     * Apply custom primary and secondary colours to CSS custom properties
     * on the `:root` element.
     *
     * @param {string} primaryColor   Hex colour string (e.g. '#e50914').
     * @param {string} secondaryColor Hex colour string (e.g. '#8b5cf6').
     */
    updateTheme(primaryColor, secondaryColor) {
      const root = document.documentElement;

      if (primaryColor && /^#[0-9a-fA-F]{6}$/.test(primaryColor)) {
        root.style.setProperty('--primary-color', primaryColor);

        // Derive a lighter variant for hover/active states.
        root.style.setProperty('--primary-color-light', this._lightenColor(primaryColor, 20));
        root.style.setProperty('--primary-color-dark', this._darkenColor(primaryColor, 20));
      }

      if (secondaryColor && /^#[0-9a-fA-F]{6}$/.test(secondaryColor)) {
        root.style.setProperty('--secondary-color', secondaryColor);
        root.style.setProperty('--secondary-color-light', this._lightenColor(secondaryColor, 20));
        root.style.setProperty('--secondary-color-dark', this._darkenColor(secondaryColor, 20));
      }

      // Persist.
      this.saveSettings({
        ...this._settings,
        primaryColor: primaryColor || this._settings.primaryColor,
        secondaryColor: secondaryColor || this._settings.secondaryColor,
      });

      this.emit('themeChanged', { primaryColor, secondaryColor });
    }

    /**
     * Update the application name everywhere it appears in the DOM and
     * document title.
     *
     * @param {string} name  New application name.
     */
    updateAppName(name) {
      if (!name || typeof name !== 'string') return;
      const sanitised = name.trim();

      // Update document title.
      document.title = document.title.replace(
        /^(.*?)\s*[—–-]\s*/,
        `${sanitised} — `
      );

      // Update elements marked with [data-app-name].
      document.querySelectorAll('[data-app-name]').forEach((el) => {
        el.textContent = sanitised;
      });

      // Persist.
      this.saveSettings({ ...this._settings, appName: sanitised });
    }

    // -----------------------------------------------------------------------
    // Connection test
    // -----------------------------------------------------------------------

    /**
     * Test the API connection with the given credentials.
     *
     * @param {string} serverUrl  Xtream Codes server URL.
     * @param {string} username   API username.
     * @param {string} password   API password.
     * @returns {Promise<{success: boolean, message: string, userInfo?: Object, serverInfo?: Object}>}
     */
    async testConnection(serverUrl, username, password) {
      const result = { success: false, message: '' };

      // Validate inputs.
      if (!serverUrl || typeof serverUrl !== 'string' || !serverUrl.trim()) {
        result.message = 'Server URL is required.';
        this.emit('connectionTested', result);
        return result;
      }

      try {
        new URL(serverUrl.trim()); // throws on invalid URL
      } catch {
        result.message = 'Please enter a valid server URL (e.g. https://example.com).';
        this.emit('connectionTested', result);
        return result;
      }

      if (!username || !username.trim()) {
        result.message = 'Username is required.';
        this.emit('connectionTested', result);
        return result;
      }

      if (!password || !password.trim()) {
        result.message = 'Password is required.';
        this.emit('connectionTested', result);
        return result;
      }

      // Build the login URL.
      const base = serverUrl.trim().replace(/\/+$/, '');
      const url = `${base}/player_api.php?username=${encodeURIComponent(username.trim())}&password=${encodeURIComponent(password.trim())}`;

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          headers: { 'Accept': 'application/json' },
        });

        clearTimeout(timeout);

        if (!response.ok) {
          result.message = `Server returned HTTP ${response.status}.`;
          this.emit('connectionTested', result);
          return result;
        }

        const data = await response.json();

        // Xtream Codes returns user_info on success.
        if (data?.user_info?.auth === 1) {
          result.success = true;
          result.message = 'Connection successful!';
          result.userInfo = data.user_info;
          result.serverInfo = data.server_info || null;
        } else if (data?.user_info?.status === 'Active') {
          result.success = true;
          result.message = 'Connection successful!';
          result.userInfo = data.user_info;
          result.serverInfo = data.server_info || null;
        } else {
          result.message = data?.user_info?.message || 'Authentication failed. Check your credentials.';
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          result.message = 'Connection timed out. Please check the server URL.';
        } else {
          result.message = `Connection error: ${err.message}`;
        }
      }

      this.emit('connectionTested', result);
      return result;
    }

    // -----------------------------------------------------------------------
    // Export / Import
    // -----------------------------------------------------------------------

    /**
     * Export all admin settings as a JSON string (for backup).
     *
     * @returns {string} JSON string of the current settings.
     */
    exportSettings() {
      const settings = this.getSettings();
      // Strip sensitive credentials for safety — include them but flag them.
      return JSON.stringify({
        _exportedAt: new Date().toISOString(),
        _app: 'HamadShow',
        _version: '1.0.0',
        settings,
      }, null, 2);
    }

    /**
     * Import settings from a JSON string (restore from backup).
     * Validates the structure before applying.
     *
     * @param {string} json  JSON string from {@link exportSettings}.
     * @returns {{success: boolean, message: string}}
     */
    importSettings(json) {
      const result = { success: false, message: '' };

      if (typeof json !== 'string' || !json.trim()) {
        result.message = 'No data to import.';
        return result;
      }

      let parsed;
      try {
        parsed = JSON.parse(json);
      } catch {
        result.message = 'Invalid JSON. Please check the file and try again.';
        return result;
      }

      // Basic structural validation.
      if (!parsed || typeof parsed !== 'object' || !parsed.settings) {
        result.message = 'Invalid settings file format.';
        return result;
      }

      if (parsed._app !== 'HamadShow') {
        result.message = 'This settings file is not from Hamad Show.';
        return result;
      }

      // Apply the imported settings.
      this.saveSettings(parsed.settings);

      // Apply theme if colours are present.
      if (parsed.settings.primaryColor || parsed.settings.secondaryColor) {
        this.updateTheme(parsed.settings.primaryColor, parsed.settings.secondaryColor);
      }

      // Apply app name if present.
      if (parsed.settings.appName) {
        this.updateAppName(parsed.settings.appName);
      }

      result.success = true;
      result.message = 'Settings imported successfully.';
      return result;
    }

    // -----------------------------------------------------------------------
    // Admin Panel Rendering
    // -----------------------------------------------------------------------

    /**
     * Render the full admin dashboard UI into the given container element.
     *
     * @param {HTMLElement|string} container  DOM element or CSS selector.
     */
    renderAdminPanel(container) {
      const el = typeof container === 'string' ? document.querySelector(container) : container;
      if (!el) return;

      const s = this._settings;

      el.innerHTML = `
        <div class="admin-panel">
          <!-- Header -->
          <div class="admin-header">
            <h1 class="admin-title">
              <span class="material-icons-round">admin_panel_settings</span>
              Admin Dashboard
            </h1>
          </div>

          <!-- Tabs / Navigation -->
          <nav class="admin-nav">
            <button class="admin-nav-btn active" data-section="server" type="button">
              <span class="material-icons-round">dns</span> Server
            </button>
            <button class="admin-nav-btn" data-section="appearance" type="button">
              <span class="material-icons-round">palette</span> Appearance
            </button>
            <button class="admin-nav-btn" data-section="splash" type="button">
              <span class="material-icons-round">splash</span> Splash
            </button>
            <button class="admin-nav-btn" data-section="categories" type="button">
              <span class="material-icons-round">category</span> Categories
            </button>
            <button class="admin-nav-btn" data-section="notifications" type="button">
              <span class="material-icons-round">notifications</span> Notifications
            </button>
            <button class="admin-nav-btn" data-section="cache" type="button">
              <span class="material-icons-round">cached</span> Cache
            </button>
            <button class="admin-nav-btn" data-section="about" type="button">
              <span class="material-icons-round">info</span> About
            </button>
          </nav>

          <!-- Sections -->
          <div class="admin-sections">

            <!-- Server Configuration -->
            <section class="admin-section" id="admin-server">
              <h2>Server Configuration</h2>
              <form class="admin-form" data-form="server" novalidate>
                <div class="form-group">
                  <label for="admin-server-url">Server URL <span class="required">*</span></label>
                  <input type="url" id="admin-server-url" name="serverUrl"
                    value="${Utils.sanitize(s.serverUrl || '')}"
                    placeholder="https://example.com" required>
                  <span class="form-error" data-error="serverUrl"></span>
                </div>
                <div class="form-group">
                  <label for="admin-username">Username <span class="required">*</span></label>
                  <input type="text" id="admin-username" name="username"
                    value="${Utils.sanitize(s.username || '')}"
                    placeholder="Your username" required autocomplete="username">
                  <span class="form-error" data-error="username"></span>
                </div>
                <div class="form-group">
                  <label for="admin-password">Password <span class="required">*</span></label>
                  <input type="password" id="admin-password" name="password"
                    value="${Utils.sanitize(s.password || '')}"
                    placeholder="Your password" required autocomplete="current-password">
                  <span class="form-error" data-error="password"></span>
                </div>
                <div class="form-actions">
                  <button type="submit" class="btn btn-primary">Save & Connect</button>
                  <button type="button" class="btn btn-secondary" id="admin-test-connection">Test Connection</button>
                </div>
              </form>
            </section>

            <!-- Appearance -->
            <section class="admin-section hidden" id="admin-appearance">
              <h2>Appearance</h2>
              <form class="admin-form" data-form="appearance" novalidate>
                <div class="form-group">
                  <label for="admin-app-name">Application Name</label>
                  <input type="text" id="admin-app-name" name="appName"
                    value="${Utils.sanitize(s.appName || '')}"
                    placeholder="Hamad Show">
                  <span class="form-error" data-error="appName"></span>
                </div>
                <div class="form-group">
                  <label for="admin-primary-color">Primary Color</label>
                  <div class="color-input-wrapper">
                    <input type="color" id="admin-primary-color" name="primaryColor"
                      value="${s.primaryColor || '#e50914'}">
                    <input type="text" id="admin-primary-color-text" name="primaryColorText"
                      value="${s.primaryColor || '#e50914'}" maxlength="7" placeholder="#e50914">
                  </div>
                  <span class="form-error" data-error="primaryColor"></span>
                </div>
                <div class="form-group">
                  <label for="admin-secondary-color">Secondary Color</label>
                  <div class="color-input-wrapper">
                    <input type="color" id="admin-secondary-color" name="secondaryColor"
                      value="${s.secondaryColor || '#8b5cf6'}">
                    <input type="text" id="admin-secondary-color-text" name="secondaryColorText"
                      value="${s.secondaryColor || '#8b5cf6'}" maxlength="7" placeholder="#8b5cf6">
                  </div>
                  <span class="form-error" data-error="secondaryColor"></span>
                </div>
                <div class="form-group">
                  <label for="admin-logo-upload">Logo</label>
                  <input type="file" id="admin-logo-upload" name="logo" accept="image/*">
                  ${s.logoUrl ? `<img src="${Utils.sanitize(s.logoUrl)}" class="admin-logo-preview" alt="Logo preview">` : ''}
                  <span class="form-error" data-error="logo"></span>
                </div>
                <div class="form-actions">
                  <button type="submit" class="btn btn-primary">Save Appearance</button>
                </div>
              </form>
            </section>

            <!-- Splash Screen -->
            <section class="admin-section hidden" id="admin-splash">
              <h2>Splash Screen</h2>
              <form class="admin-form" data-form="splash" novalidate>
                <div class="form-group">
                  <label class="toggle-label">
                    <input type="checkbox" id="admin-splash-enabled" name="splashEnabled"
                      ${s.splash?.enabled !== false ? 'checked' : ''}>
                    <span>Enable Splash Screen</span>
                  </label>
                </div>
                <div class="form-group">
                  <label for="admin-splash-duration">Duration (ms)</label>
                  <input type="number" id="admin-splash-duration" name="splashDuration"
                    value="${s.splash?.duration ?? 3000}" min="500" max="10000" step="100">
                  <span class="form-error" data-error="splashDuration"></span>
                </div>
                <div class="form-group">
                  <label for="admin-splash-bg">Background Color</label>
                  <input type="color" id="admin-splash-bg" name="splashBgColor"
                    value="${s.splash?.backgroundColor || '#0a0a0a'}">
                </div>
                <div class="form-group">
                  <label for="admin-splash-text-color">Text Color</label>
                  <input type="color" id="admin-splash-text-color" name="splashTextColor"
                    value="${s.splash?.textColor || '#ffffff'}">
                </div>
                <div class="form-actions">
                  <button type="submit" class="btn btn-primary">Save Splash Settings</button>
                </div>
              </form>
            </section>

            <!-- Categories Management -->
            <section class="admin-section hidden" id="admin-categories">
              <h2>Categories</h2>
              <p class="admin-section-desc">Enable or disable content categories. Disabled categories will be hidden from the UI.</p>
              <div id="admin-categories-list" class="admin-categories-list">
                <!-- Populated dynamically. -->
              </div>
            </section>

            <!-- Notification Settings -->
            <section class="admin-section hidden" id="admin-notifications">
              <h2>Notifications</h2>
              <form class="admin-form" data-form="notifications" novalidate>
                <div class="form-group">
                  <label class="toggle-label">
                    <input type="checkbox" id="admin-notifications-enabled" name="notificationsEnabled"
                      ${s.notificationsEnabled !== false ? 'checked' : ''}>
                    <span>Enable Notifications</span>
                  </label>
                </div>
                <div class="form-group">
                  <label class="toggle-label">
                    <input type="checkbox" id="admin-auto-update" name="autoUpdateCheck"
                      ${s.autoUpdateCheck !== false ? 'checked' : ''}>
                    <span>Automatically Check for Updates</span>
                  </label>
                </div>
                <div class="form-actions">
                  <button type="submit" class="btn btn-primary">Save Notification Settings</button>
                </div>
              </form>
            </section>

            <!-- Cache Management -->
            <section class="admin-section hidden" id="admin-cache">
              <h2>Cache Management</h2>
              <div class="admin-cache-info">
                <div class="admin-cache-stat">
                  <span class="material-icons-round">storage</span>
                  <div>
                    <strong id="admin-cache-size">Calculating…</strong>
                    <p>Estimated cache size</p>
                  </div>
                </div>
              </div>
              <div class="form-actions">
                <button type="button" class="btn btn-danger" id="admin-clear-cache">Clear All Cache</button>
              </div>
            </section>

            <!-- About -->
            <section class="admin-section hidden" id="admin-about">
              <h2>About</h2>
              <div class="admin-about-content">
                <div class="admin-about-logo">
                  <span class="material-icons-round">live_tv</span>
                </div>
                <h3>Hamad Show IPTV</h3>
                <p class="admin-about-version">Version 1.0.0</p>
                <p class="admin-about-desc">
                  Stream live TV, movies, and series with Hamad Show. A modern IPTV
                  application built with web technologies.
                </p>
                <div class="admin-about-actions">
                  <button type="button" class="btn btn-secondary" id="admin-export-settings">
                    <span class="material-icons-round">download</span> Export Settings
                  </button>
                  <label class="btn btn-secondary" for="admin-import-settings">
                    <span class="material-icons-round">upload</span> Import Settings
                  </label>
                  <input type="file" id="admin-import-settings" accept=".json" style="display:none;">
                  <button type="button" class="btn btn-danger" id="admin-reset-settings">
                    <span class="material-icons-round">restart_alt</span> Reset to Defaults
                  </button>
                </div>
              </div>
            </section>

          </div>
        </div>`;

      // --- Bind all event handlers ---
      this._bindAdminEvents(el);
    }

    // -----------------------------------------------------------------------
    // Event binding (private)
    // -----------------------------------------------------------------------

    /**
     * Bind all interactive elements within the admin panel.
     *
     * @private
     * @param {HTMLElement} el  The admin panel root element.
     */
    _bindAdminEvents(el) {
      // --- Tab navigation ---
      el.querySelectorAll('.admin-nav-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const section = btn.getAttribute('data-section');

          // Toggle active tab.
          el.querySelectorAll('.admin-nav-btn').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');

          // Toggle visible section.
          el.querySelectorAll('.admin-section').forEach((s) => s.classList.add('hidden'));
          const target = el.querySelector(`#admin-${section}`);
          if (target) target.classList.remove('hidden');
        });
      });

      // --- Server form ---
      this._bindForm(el, 'server', (formData) => {
        const errors = this._validateServer(formData);
        if (Object.keys(errors).length > 0) {
          this._showFormErrors(el, errors);
          return false;
        }
        this.saveSettings(formData);
        return true;
      });

      // --- Test connection button ---
      const testBtn = el.querySelector('#admin-test-connection');
      if (testBtn) {
        testBtn.addEventListener('click', async () => {
          const url = el.querySelector('#admin-server-url')?.value?.trim() || '';
          const user = el.querySelector('#admin-username')?.value?.trim() || '';
          const pass = el.querySelector('#admin-password')?.value?.trim() || '';

          testBtn.disabled = true;
          testBtn.textContent = 'Testing…';

          const result = await this.testConnection(url, user, pass);

          testBtn.disabled = false;
          testBtn.textContent = 'Test Connection';

          if (result.success) {
            this._showFormMessage(el, 'server', 'Connection successful!', 'success');
          } else {
            this._showFormMessage(el, 'server', result.message, 'error');
          }
        });
      }

      // --- Appearance form ---
      this._bindForm(el, 'appearance', (formData) => {
        const errors = this._validateAppearance(formData);
        if (Object.keys(errors).length > 0) {
          this._showFormErrors(el, errors);
          return false;
        }

        // Apply theme.
        this.updateTheme(formData.primaryColor, formData.secondaryColor);

        // Apply app name.
        if (formData.appName) {
          this.updateAppName(formData.appName);
        }

        // Handle logo upload.
        const logoInput = el.querySelector('#admin-logo-upload');
        if (logoInput?.files?.length > 0) {
          this._handleLogoUpload(logoInput.files[0]).then((logoUrl) => {
            this.saveSettings({ ...this._settings, logoUrl });
            this.renderAdminPanel(el);
          });
          return true; // Will save again after upload.
        }

        this.saveSettings(formData);
        return true;
      });

      // Sync colour pickers ↔ text inputs.
      this._syncColorInputs(el, 'admin-primary-color', 'admin-primary-color-text');
      this._syncColorInputs(el, 'admin-secondary-color', 'admin-secondary-color-text');

      // --- Splash form ---
      this._bindForm(el, 'splash', (formData) => {
        const errors = this._validateSplash(formData);
        if (Object.keys(errors).length > 0) {
          this._showFormErrors(el, errors);
          return false;
        }

        const splash = {
          ...this._settings.splash,
          enabled: formData.splashEnabled,
          duration: Number(formData.splashDuration) || 3000,
          backgroundColor: formData.splashBgColor,
          textColor: formData.splashTextColor,
        };

        this.saveSettings({ ...this._settings, splash });
        return true;
      });

      // --- Notifications form ---
      this._bindForm(el, 'notifications', (formData) => {
        this.saveSettings({
          ...this._settings,
          notificationsEnabled: formData.notificationsEnabled,
          autoUpdateCheck: formData.autoUpdateCheck,
        });
        return true;
      });

      // --- Cache management ---
      const clearCacheBtn = el.querySelector('#admin-clear-cache');
      if (clearCacheBtn) {
        clearCacheBtn.addEventListener('click', () => {
          if ('caches' in global) {
            caches.keys().then((names) => {
              for (const name of names) caches.delete(name);
            });
          }
          StorageManager.clear();
          this._settings = { ...DEFAULT_ADMIN };
          this.emit('settingsChanged', this._settings);
        });
      }

      // Calculate and display cache size.
      this._updateCacheSize(el);

      // --- About section actions ---
      const exportBtn = el.querySelector('#admin-export-settings');
      if (exportBtn) {
        exportBtn.addEventListener('click', () => {
          const json = this.exportSettings();
          const blob = new Blob([json], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `hamadshow-settings-${Date.now()}.json`;
          a.click();
          URL.revokeObjectURL(url);
        });
      }

      const importInput = el.querySelector('#admin-import-settings');
      if (importInput) {
        importInput.addEventListener('change', () => {
          const file = importInput.files?.[0];
          if (!file) return;

          const reader = new FileReader();
          reader.onload = () => {
            const result = this.importSettings(reader.result);
            if (result.success) {
              this.renderAdminPanel(el);
            } else {
              alert(result.message);
            }
          };
          reader.readAsText(file);
        });
      }

      const resetBtn = el.querySelector('#admin-reset-settings');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
            this.resetToDefaults();
            this.renderAdminPanel(el);
          }
        });
      }

      // --- Populate categories list ---
      this._populateCategories(el);
    }

    /**
     * Bind a form's submit event with validation and save logic.
     *
     * @private
     * @param {HTMLElement} panelEl  The admin panel root element.
     * @param {string}      formName  The data-form attribute value.
     * @param {Function}    onSubmit  Callback receiving the form data object.
     *                                 Return false to prevent save.
     */
    _bindForm(panelEl, formName, onSubmit) {
      const form = panelEl.querySelector(`[data-form="${formName}"]`);
      if (!form) return;

      form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Clear previous errors.
        form.querySelectorAll('.form-error').forEach((err) => err.textContent = '');

        const formData = {};
        for (const el of form.elements) {
          if (!el.name) continue;
          if (el.type === 'checkbox') {
            formData[el.name] = el.checked;
          } else if (el.type !== 'file') {
            formData[el.name] = el.value;
          }
        }

        const success = onSubmit(formData);
        if (success !== false) {
          this._showFormMessage(panelEl, formName, 'Settings saved successfully!', 'success');
        }
      });
    }

    // -----------------------------------------------------------------------
    // Validation helpers (private)
    // -----------------------------------------------------------------------

    /**
     * Validate server configuration form data.
     *
     * @private
     * @param {Object} data
     * @returns {Object} Map of field name → error message.
     */
    _validateServer(data) {
      const errors = {};

      if (!data.serverUrl || !data.serverUrl.trim()) {
        errors.serverUrl = 'Server URL is required.';
      } else {
        try {
          new URL(data.serverUrl.trim());
        } catch {
          errors.serverUrl = 'Please enter a valid URL (e.g. https://example.com).';
        }
      }

      if (!data.username || !data.username.trim()) {
        errors.username = 'Username is required.';
      }

      if (!data.password || !data.password.trim()) {
        errors.password = 'Password is required.';
      }

      return errors;
    }

    /**
     * Validate appearance form data.
     *
     * @private
     * @param {Object} data
     * @returns {Object}
     */
    _validateAppearance(data) {
      const errors = {};
      const hexRegex = /^#[0-9a-fA-F]{6}$/;

      if (data.primaryColor && !hexRegex.test(data.primaryColor)) {
        errors.primaryColor = 'Must be a valid hex colour (e.g. #e50914).';
      }

      if (data.secondaryColor && !hexRegex.test(data.secondaryColor)) {
        errors.secondaryColor = 'Must be a valid hex colour (e.g. #8b5cf6).';
      }

      return errors;
    }

    /**
     * Validate splash screen form data.
     *
     * @private
     * @param {Object} data
     * @returns {Object}
     */
    _validateSplash(data) {
      const errors = {};

      const duration = Number(data.splashDuration);
      if (isNaN(duration) || duration < 500 || duration > 10000) {
        errors.splashDuration = 'Duration must be between 500 and 10000 ms.';
      }

      return errors;
    }

    // -----------------------------------------------------------------------
    // UI helpers (private)
    // -----------------------------------------------------------------------

    /**
     * Display validation errors on the form.
     *
     * @private
     * @param {HTMLElement} panelEl  The admin panel root.
     * @param {Object}      errors   Map of field name → error message.
     */
    _showFormErrors(panelEl, errors) {
      for (const [field, message] of Object.entries(errors)) {
        const errEl = panelEl.querySelector(`[data-error="${field}"]`);
        if (errEl) errEl.textContent = message;

        // Also highlight the input.
        const input = panelEl.querySelector(`[name="${field}"]`);
        if (input) input.classList.add('input-error');
      }
    }

    /**
     * Show a temporary success/error message below a form.
     *
     * @private
     * @param {HTMLElement} panelEl
     * @param {string}      formName
     * @param {string}      message
     * @param {'success'|'error'} type
     */
    _showFormMessage(panelEl, formName, message, type) {
      const section = panelEl.querySelector(`#admin-${formName}`);
      if (!section) return;

      // Remove any existing message.
      const existing = section.querySelector('.form-message');
      if (existing) existing.remove();

      const msg = document.createElement('div');
      msg.className = `form-message form-message-${type}`;
      msg.textContent = message;

      // Insert after the form.
      const form = section.querySelector('form');
      if (form) {
        form.insertAdjacentElement('afterend', msg);
      } else {
        section.appendChild(msg);
      }

      // Auto-dismiss after 4 seconds.
      setTimeout(() => {
        msg.classList.add('form-message-exit');
        msg.addEventListener('animationend', () => msg.remove(), { once: true });
        setTimeout(() => { if (msg.parentNode) msg.remove(); }, 500);
      }, 4000);
    }

    /**
     * Sync a colour picker input with a text input and vice versa.
     *
     * @private
     * @param {HTMLElement} root
     * @param {string}      pickerId
     * @param {string}      textId
     */
    _syncColorInputs(root, pickerId, textId) {
      const picker = root.querySelector(`#${pickerId}`);
      const text = root.querySelector(`#${textId}`);
      if (!picker || !text) return;

      picker.addEventListener('input', () => {
        text.value = picker.value;
      });

      text.addEventListener('input', () => {
        if (/^#[0-9a-fA-F]{6}$/.test(text.value)) {
          picker.value = text.value;
        }
      });
    }

    /**
     * Handle logo file upload — reads the file as a data URL.
     *
     * @private
     * @param {File} file
     * @returns {Promise<string>} Data URL of the uploaded image.
     */
    async _handleLogoUpload(file) {
      return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
          reject(new Error('Please select a valid image file.'));
          return;
        }

        if (file.size > 5 * 1024 * 1024) {
          reject(new Error('Logo must be smaller than 5 MB.'));
          return;
        }

        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read the file.'));
        reader.readAsDataURL(file);
      });
    }

    /**
     * Estimate and display the current cache size.
     *
     * @private
     * @param {HTMLElement} panelEl
     */
    async _updateCacheSize(panelEl) {
      const sizeEl = panelEl.querySelector('#admin-cache-size');
      if (!sizeEl) return;

      try {
        // Estimate from localStorage.
        let totalBytes = 0;
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            totalBytes += (localStorage.getItem(key) || '').length * 2; // UTF-16 chars ≈ 2 bytes each
          }
        }

        // Add Cache API estimate if available.
        if ('caches' in global) {
          const names = await caches.keys();
          for (const name of names) {
            const cache = await caches.open(name);
            const keys = await cache.keys();
            for (const request of keys) {
              const response = await cache.match(request);
              if (response) {
                const blob = await response.blob();
                totalBytes += blob.size;
              }
            }
          }
        }

        sizeEl.textContent = this._formatBytes(totalBytes);
      } catch {
        sizeEl.textContent = 'Unable to calculate';
      }
    }

    /**
     * Populate the categories management list with toggle switches.
     *
     * @private
     * @param {HTMLElement} panelEl
     */
    _populateCategories(panelEl) {
      const listEl = panelEl.querySelector('#admin-categories-list');
      if (!listEl) return;

      // Load categories from storage (would be populated by the API module).
      const categories = StorageManager.getJSON('categories_loaded', []);
      const enabledMap = this._settings.categories?.enabled || {};

      if (categories.length === 0) {
        listEl.innerHTML = `
          <div class="admin-categories-empty">
            <span class="material-icons-round">category</span>
            <p>No categories loaded yet. Connect to a server first.</p>
          </div>`;
        return;
      }

      listEl.innerHTML = categories.map((cat) => {
        const catId = String(cat.category_id ?? cat.id ?? '');
        const catName = Utils.sanitize(cat.category_name ?? cat.name ?? 'Unknown');
        const isEnabled = catId in enabledMap ? enabledMap[catId] : true;

        return `
          <div class="admin-category-item">
            <span class="admin-category-name">${catName}</span>
            <label class="toggle-switch">
              <input type="checkbox" data-category-id="${catId}" ${isEnabled ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>`;
      }).join('');

      // Bind toggle changes.
      listEl.querySelectorAll('input[data-category-id]').forEach((input) => {
        input.addEventListener('change', () => {
          const catId = input.getAttribute('data-category-id');
          const categories = { ...this._settings.categories, enabled: { ...this._settings.categories.enabled } };
          categories.enabled[catId] = input.checked;
          this.saveSettings({ ...this._settings, categories });
        });
      });
    }

    // -----------------------------------------------------------------------
    // Colour utility helpers (private)
    // -----------------------------------------------------------------------

    /**
     * Lighten a hex colour by a percentage.
     *
     * @private
     * @param {string} hex  Hex colour (e.g. '#e50914').
     * @param {number} percent  Percentage to lighten (0-100).
     * @returns {string} Lightened hex colour.
     */
    _lightenColor(hex, percent) {
      const num = parseInt(hex.replace('#', ''), 16);
      const r = Math.min(255, (num >> 16) + Math.round(2.55 * percent));
      const g = Math.min(255, ((num >> 8) & 0x00FF) + Math.round(2.55 * percent));
      const b = Math.min(255, (num & 0x0000FF) + Math.round(2.55 * percent));
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }

    /**
     * Darken a hex colour by a percentage.
     *
     * @private
     * @param {string} hex  Hex colour (e.g. '#e50914').
     * @param {number} percent  Percentage to darken (0-100).
     * @returns {string} Darkened hex colour.
     */
    _darkenColor(hex, percent) {
      const num = parseInt(hex.replace('#', ''), 16);
      const r = Math.max(0, (num >> 16) - Math.round(2.55 * percent));
      const g = Math.max(0, ((num >> 8) & 0x00FF) - Math.round(2.55 * percent));
      const b = Math.max(0, (num & 0x0000FF) - Math.round(2.55 * percent));
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }

    /**
     * Format a byte count as a human-readable string.
     *
     * @private
     * @param {number} bytes
     * @returns {string} e.g. "1.5 MB"
     */
    _formatBytes(bytes) {
      if (bytes === 0) return '0 B';
      const units = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      const value = bytes / Math.pow(1024, i);
      return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
    }
  }

  // ---------------------------------------------------------------------------
  // Register on the global namespace
  // ---------------------------------------------------------------------------
  global[NAMESPACE] = global[NAMESPACE] || {};
  global[NAMESPACE].Admin = AdminManager;
})(window);