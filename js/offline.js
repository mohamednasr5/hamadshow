/**
 * Hamad Show — Offline & PWA Module
 * ====================================
 * Handles online/offline detection, service worker registration and update
 * checking, and the PWA install prompt flow (beforeinstallprompt).
 *
 * Depends on:
 *   - HamadShow.Config  (PWA_CONFIG)
 *
 * @namespace HamadShow.Offline
 * @module offline
 */

(function (global) {
  'use strict';

  const NAMESPACE = 'HamadShow';

  // ---------------------------------------------------------------------------
  // Reference sibling modules
  // ---------------------------------------------------------------------------
  const Config = global[NAMESPACE]?.Config;

  // ---------------------------------------------------------------------------
  // Constants
  // ---------------------------------------------------------------------------

  /** Path to the service worker file (relative to the app root). */
  const SW_PATH = 'service-worker.js';

  /** CSS class for the offline overlay page. */
  const OFFLINE_PAGE_CLASS = 'offline-page';

  /** CSS class for the PWA install prompt bar. */
  const INSTALL_PROMPT_CLASS = 'install-prompt';

  /** Check interval for SW updates (ms). */
  const UPDATE_CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutes

  // ---------------------------------------------------------------------------
  // OfflineManager
  // ---------------------------------------------------------------------------
  class OfflineManager {
    /**
     * Create a new OfflineManager instance.
     */
    constructor() {
      /** @private */ this._listeners = {};
      /** @private */ this._deferredPrompt = null;
      /** @private */ this._swRegistration = null;
      /** @private */ this._updateCheckTimer = null;
      /** @private */ this._initialized = false;
    }

    // -----------------------------------------------------------------------
    // Event emitter
    // -----------------------------------------------------------------------

    /**
     * Subscribe to a named event.
     *
     * @param {string}   event    Event name (e.g. 'online', 'offline', 'installed', 'updateAvailable').
     * @param {Function} handler  Callback invoked with event data.
     * @returns {Function} Unsubscribe function.
     */
    on(event, handler) {
      if (typeof handler !== 'function') {
        throw new TypeError('OfflineManager.on: handler must be a function');
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
          console.error(`[OfflineManager] Error in "${event}" handler:`, err);
        }
      }
    }

    // -----------------------------------------------------------------------
    // Lifecycle
    // -----------------------------------------------------------------------

    /**
     * Initialise the offline manager. Sets up online/offline listeners,
     * registers the service worker, and captures the deferred install prompt.
     */
    init() {
      if (this._initialized) return;
      this._initialized = true;

      // --- Online / Offline listeners ---
      global.addEventListener('online', () => {
        this.hideOfflinePage();
        this.emit('online', {});
      });

      global.addEventListener('offline', () => {
        this.showOfflinePage();
        this.emit('offline', {});
      });

      // Show the offline page immediately if we're already offline.
      if (!this.isOnline()) {
        this.showOfflinePage();
      }

      // --- PWA install prompt ---
      global.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the default mini-infobar.
        e.preventDefault();
        this._deferredPrompt = e;

        // Show the custom install prompt bar.
        this.showInstallPrompt();
      });

      global.addEventListener('appinstalled', () => {
        this._deferredPrompt = null;
        this.hideInstallPrompt();
        this.emit('installed', {});
      });

      // --- Service Worker (skip if index.html already registered one) ---
      if (navigator.serviceWorker.controller) {
        console.info('[OfflineManager] SW already active, skipping registration.');
      } else {
        this.registerServiceWorker();
      }

      // --- Periodic SW update check ---
      this._updateCheckTimer = setInterval(() => {
        this.checkForUpdates();
      }, UPDATE_CHECK_INTERVAL);
    }

    // -----------------------------------------------------------------------
    // Connectivity
    // -----------------------------------------------------------------------

    /**
     * Check whether the browser currently reports an online status.
     *
     * @returns {boolean}
     */
    isOnline() {
      return typeof navigator !== 'undefined' ? navigator.onLine : true;
    }

    /**
     * Register a callback to be invoked when the browser comes back online.
     *
     * @param {Function} callback
     * @returns {Function} Unsubscribe function.
     */
    onOnline(callback) {
      return this.on('online', callback);
    }

    /**
     * Register a callback to be invoked when the browser goes offline.
     *
     * @param {Function} callback
     * @returns {Function} Unsubscribe function.
     */
    onOffline(callback) {
      return this.on('offline', callback);
    }

    // -----------------------------------------------------------------------
    // Offline page
    // -----------------------------------------------------------------------

    /**
     * Show the offline overlay page. Creates the element if it doesn't exist.
     */
    showOfflinePage() {
      let page = document.querySelector(`.${OFFLINE_PAGE_CLASS}`);

      if (!page) {
        page = document.createElement('div');
        page.className = OFFLINE_PAGE_CLASS;
        page.innerHTML = `
          <div class="offline-content">
            <span class="material-icons-round offline-icon">wifi_off</span>
            <h2>You're Offline</h2>
            <p>Check your internet connection and try again.</p>
          </div>`;
        document.body.appendChild(page);
      }

      // Small delay to allow the DOM to settle, then add visible class.
      requestAnimationFrame(() => {
        page.classList.add('visible');
      });
    }

    /**
     * Hide the offline overlay page.
     */
    hideOfflinePage() {
      const page = document.querySelector(`.${OFFLINE_PAGE_CLASS}`);
      if (!page) return;

      page.classList.remove('visible');

      // Remove from DOM after the transition completes.
      page.addEventListener('transitionend', () => {
        page.remove();
      }, { once: true });

      // Fallback removal if transition doesn't fire.
      setTimeout(() => {
        if (page.parentNode) page.remove();
      }, 600);
    }

    // -----------------------------------------------------------------------
    // Service Worker
    // -----------------------------------------------------------------------

    /**
     * Register the service worker and handle the update flow.
     */
    async registerServiceWorker() {
      if (!('serviceWorker' in navigator)) {
        console.info('[OfflineManager] Service workers not supported in this browser.');
        return;
      }

      try {
        const registration = await navigator.serviceWorker.register(SW_PATH);

        this._swRegistration = registration;

        console.info('[OfflineManager] Service worker registered (scope:', registration.scope + ')');

        // Listen for updates.
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;

          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                // A new version is available — the old SW is still active.
                this.emit('updateAvailable', { registration });
              }
            });
          }
        });
      } catch (err) {
        console.error('[OfflineManager] Service worker registration failed:', err);
      }
    }

    /**
     * Check for service worker updates. If an updated SW is waiting,
     * it is skippedWaiting so it takes control on the next navigation.
     *
     * @returns {Promise<boolean>} Whether an update was found and activated.
     */
    async checkForUpdates() {
      if (!this._swRegistration) return false;

      try {
        await this._swRegistration.update();

        if (this._swRegistration.waiting) {
          // Tell the waiting SW to skip waiting and become active.
          this._swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
          this.emit('updateAvailable', { registration: this._swRegistration });
          return true;
        }

        return false;
      } catch (err) {
        console.error('[OfflineManager] SW update check failed:', err);
        return false;
      }
    }

    // -----------------------------------------------------------------------
    // PWA Install Prompt
    // -----------------------------------------------------------------------

    /**
     * Show the custom PWA install prompt bar. Creates the element if it
     * doesn't already exist in the DOM.
     */
    showInstallPrompt() {
      // Don't show if no deferred prompt is stored.
      if (!this._deferredPrompt) return;

      let bar = document.querySelector(`.${INSTALL_PROMPT_CLASS}`);

      if (!bar) {
        bar = document.createElement('div');
        bar.className = INSTALL_PROMPT_CLASS;
        bar.innerHTML = `
          <div class="install-prompt-content">
            <span class="material-icons-round install-prompt-icon">get_app</span>
            <div class="install-prompt-text">
              <strong>Install Hamad Show</strong>
              <p>Add to your home screen for a better experience.</p>
            </div>
            <div class="install-prompt-actions">
              <button class="install-prompt-install" type="button">Install</button>
              <button class="install-prompt-dismiss" type="button" aria-label="Dismiss install prompt">
                <span class="material-icons-round">close</span>
              </button>
            </div>
          </div>`;
        document.body.appendChild(bar);

        // Bind install button.
        bar.querySelector('.install-prompt-install').addEventListener('click', () => {
          this.installPWA();
        });

        // Bind dismiss button.
        bar.querySelector('.install-prompt-dismiss').addEventListener('click', () => {
          this.hideInstallPrompt();
        });
      }

      // Animate in.
      requestAnimationFrame(() => {
        bar.classList.add('visible');
      });
    }

    /**
     * Hide the install prompt bar.
     */
    hideInstallPrompt() {
      const bar = document.querySelector(`.${INSTALL_PROMPT_CLASS}`);
      if (!bar) return;

      bar.classList.remove('visible');

      bar.addEventListener('transitionend', () => {
        bar.remove();
      }, { once: true });

      // Fallback removal.
      setTimeout(() => {
        if (bar.parentNode) bar.remove();
      }, 600);
    }

    /**
     * Trigger the deferred PWA install prompt. Calls `prompt()` on the
     * stored `BeforeInstallPromptEvent` and handles the user's choice.
     *
     * @returns {Promise<'accepted'|'dismissed'|null>} The user's outcome,
     *          or null if no prompt is available.
     */
    async installPWA() {
      if (!this._deferredPrompt) {
        console.warn('[OfflineManager] No deferred install prompt available.');
        return null;
      }

      try {
        // Show the native install prompt.
        const result = await this._deferredPrompt.prompt();

        // Wait for the user's response.
        const { outcome } = result;

        // Clear the deferred prompt — it can only be used once.
        this._deferredPrompt = null;

        // Hide the custom bar regardless of outcome.
        this.hideInstallPrompt();

        return outcome; // 'accepted' or 'dismissed'
      } catch (err) {
        console.error('[OfflineManager] Install prompt failed:', err);
        return null;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Register on the global namespace
  // ---------------------------------------------------------------------------
  global[NAMESPACE] = global[NAMESPACE] || {};
  global[NAMESPACE].Offline = OfflineManager;
})(window);