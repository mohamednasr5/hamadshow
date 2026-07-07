/**
 * Hamad Show — Notifications Module
 * ====================================
 * Manages in-app toast notifications, browser push notifications (where
 * supported), and a slide-in notification panel with read/unread tracking.
 *
 * Depends on:
 *   - HamadShow.Config         (NOTIFICATION_TYPES, DEFAULT_SETTINGS)
 *   - HamadShow.Utils          (sanitize, formatDate, generateId)
 *   - HamadShow.StorageManager (getJSON / setJSON for notification persistence)
 *
 * @namespace HamadShow.Notifications
 * @module notifications
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

  if (!Utils) {
    console.error('[HamadShow.Notifications] HamadShow.Utils is required but not found.');
    return;
  }
  if (!StorageManager) {
    console.error('[HamadShow.Notifications] HamadShow.StorageManager is required but not found.');
    return;
  }

  // ---------------------------------------------------------------------------
  // Constants
  // ---------------------------------------------------------------------------

  /** Storage key for the notifications array. */
  const STORAGE_KEY = 'notifications';

  /** Maximum number of notifications to keep (prevents unbounded growth). */
  const MAX_NOTIFICATIONS = 100;

  /** Default toast display duration (ms). */
  const DEFAULT_TOAST_DURATION = 4000;

  /** CSS class for the toast container. */
  const TOAST_CONTAINER_CLASS = 'toast-container';

  /** CSS class for the notification panel. */
  const PANEL_CLASS = 'notification-panel';

  /** CSS class for the panel overlay/backdrop. */
  const PANEL_OVERLAY_CLASS = 'notification-panel-overlay';

  /** Icon mapping for toast types. */
  const TOAST_ICONS = Object.freeze({
    success: 'check_circle',
    error:   'error',
    info:    'info',
    warning: 'warning',
  });

  // ---------------------------------------------------------------------------
  // NotificationManager
  // ---------------------------------------------------------------------------
  class NotificationManager {
    /**
     * Create a new NotificationManager instance.
     */
    constructor() {
      /** @private */ this._listeners = {};
      /** @private */ this._notifications = [];
      /** @private */ this._panelOpen = false;
      /** @private */ this._initialized = false;
      /** @private */ this._pushSubscription = null;
    }

    // -----------------------------------------------------------------------
    // Event emitter
    // -----------------------------------------------------------------------

    /**
     * Subscribe to a named event.
     *
     * @param {string}   event    Event name (e.g. 'new', 'read', 'panelOpened', 'panelClosed').
     * @param {Function} handler  Callback invoked with event data.
     * @returns {Function} Unsubscribe function.
     */
    on(event, handler) {
      if (typeof handler !== 'function') {
        throw new TypeError('NotificationManager.on: handler must be a function');
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
          console.error(`[NotificationManager] Error in "${event}" handler:`, err);
        }
      }
    }

    // -----------------------------------------------------------------------
    // Lifecycle
    // -----------------------------------------------------------------------

    /**
     * Initialise the notification system. Requests browser notification
     * permission and loads stored notifications.
     */
    init() {
      if (this._initialized) return;
      this._initialized = true;

      // Load persisted notifications.
      this._notifications = StorageManager.getJSON(STORAGE_KEY, []);

      // Request browser notification permission (non-blocking).
      this._requestPermission();

      // Ensure the toast container exists in the DOM.
      this._ensureToastContainer();
    }

    // -----------------------------------------------------------------------
    // Browser notification permission
    // -----------------------------------------------------------------------

    /**
     * Request Notification API permission from the user.
     * @private
     */
    async _requestPermission() {
      if (!('Notification' in global)) return;

      if (Notification.permission === 'default') {
        try {
          await Notification.requestPermission();
        } catch {
          // Permission denied or unavailable — continue without push.
        }
      }
    }

    // -----------------------------------------------------------------------
    // Show notifications
    // -----------------------------------------------------------------------

    /**
     * Show a browser notification (if permitted) and an in-app toast.
     *
     * @param {string} title   Notification title.
     * @param {string} body    Notification body text.
     * @param {string} [icon]  Icon URL for the browser notification.
     * @param {Object} [data]  Arbitrary data attached to the notification.
     */
    show(title, body, icon, data) {
      // 1. Browser notification (if permission granted).
      if ('Notification' in global && Notification.permission === 'granted') {
        try {
          const opts = { body: body || '', icon: icon || '', data: data || {} };
          const notification = new Notification(title, opts);

          // Clicking the notification focuses the window.
          notification.onclick = () => {
            global.focus?.();
            notification.close();
          };
        } catch {
          // Browser notifications can throw in some environments (e.g. iframes).
        }
      }

      // 2. In-app toast.
      this.showToast(body || title, 'info', DEFAULT_TOAST_DURATION);
    }

    /**
     * Show an in-app toast notification.  The toast auto-dismisses after
     * `duration` ms with a slide-out animation.
     *
     * @param {string} message   Toast message text.
     * @param {'success'|'error'|'info'|'warning'} [type='info']  Visual type.
     * @param {number} [duration=4000]  Display duration in ms.
     */
    showToast(message, type = 'info', duration = DEFAULT_TOAST_DURATION) {
      const container = document.querySelector(`.${TOAST_CONTAINER_CLASS}`);
      if (!container) return;

      const icon = TOAST_ICONS[type] || TOAST_ICONS.info;
      const id = Utils.generateId();

      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      toast.setAttribute('data-toast-id', id);
      toast.setAttribute('role', 'alert');
      toast.innerHTML = `
        <span class="material-icons-round toast-icon">${icon}</span>
        <span class="toast-message">${Utils.sanitize(message)}</span>
        <button class="toast-close" aria-label="Dismiss" type="button">
          <span class="material-icons-round">close</span>
        </button>`;

      // Bind close button.
      toast.querySelector('.toast-close').addEventListener('click', () => {
        this._dismissToast(toast);
      });

      container.appendChild(toast);

      // Trigger entrance animation (reflow → add class).
      requestAnimationFrame(() => {
        toast.classList.add('toast-visible');
      });

      // Auto-dismiss after duration.
      const timer = setTimeout(() => {
        this._dismissToast(toast);
      }, duration);

      // Store the timer so we can cancel it on manual dismiss.
      toast._autoDismissTimer = timer;
    }

    /**
     * Dismiss a toast element with an exit animation.
     *
     * @private
     * @param {HTMLElement} toast
     */
    _dismissToast(toast) {
      if (!toast || !toast.parentNode) return;

      // Clear the auto-dismiss timer to prevent double-dismiss.
      clearTimeout(toast._autoDismissTimer);

      toast.classList.remove('toast-visible');
      toast.classList.add('toast-exit');

      toast.addEventListener('animationend', () => {
        toast.remove();
      }, { once: true });

      // Fallback removal in case the animation doesn't fire.
      setTimeout(() => {
        if (toast.parentNode) toast.remove();
      }, 500);
    }

    // -----------------------------------------------------------------------
    // Notification list management
    // -----------------------------------------------------------------------

    /**
     * Add a notification to the stored notification list.
     *
     * @param {Object} notification
     * @param {string}        [notification.id]        Auto-generated if omitted.
     * @param {string}        notification.type         Category (e.g. 'new_movie').
     * @param {string}        notification.title
     * @param {string}        notification.body
     * @param {number}        [notification.timestamp]  Defaults to now.
     * @param {boolean}       [notification.read=false]
     * @param {Object}        [notification.data={}]
     */
    add(notification) {
      const entry = {
        id: notification.id || Utils.generateId(),
        type: String(notification.type || 'info'),
        title: String(notification.title || ''),
        body: String(notification.body || ''),
        timestamp: Number(notification.timestamp) || Date.now(),
        read: Boolean(notification.read),
        data: notification.data ?? {},
      };

      // Insert at the top (newest first).
      this._notifications.unshift(entry);

      // Prune old entries.
      if (this._notifications.length > MAX_NOTIFICATIONS) {
        this._notifications = this._notifications.slice(0, MAX_NOTIFICATIONS);
      }

      this._persist();
      this.emit('new', entry);
    }

    /**
     * Mark a single notification as read.
     *
     * @param {string} id  Notification ID.
     */
    markRead(id) {
      const entry = this._notifications.find((n) => n.id === id);
      if (!entry || entry.read) return;

      entry.read = true;
      this._persist();
      this.emit('read', { id });
    }

    /**
     * Mark all notifications as read.
     */
    markAllRead() {
      let changed = false;
      for (const n of this._notifications) {
        if (!n.read) {
          n.read = true;
          changed = true;
        }
      }
      if (changed) {
        this._persist();
        this.emit('read', { id: null, all: true });
      }
    }

    // -----------------------------------------------------------------------
    // Accessors
    // -----------------------------------------------------------------------

    /**
     * Return all stored notifications (newest first).
     *
     * @returns {Object[]}
     */
    getAll() {
      return [...this._notifications];
    }

    /**
     * Return only unread notifications.
     *
     * @returns {Object[]}
     */
    getUnread() {
      return this._notifications.filter((n) => !n.read);
    }

    /**
     * Return the count of unread notifications.
     *
     * @returns {number}
     */
    getCount() {
      return this._notifications.filter((n) => !n.read).length;
    }

    // -----------------------------------------------------------------------
    // Notification panel
    // -----------------------------------------------------------------------

    /**
     * Render the full notification panel content. Creates the panel element
     * if it doesn't already exist.
     */
    renderPanel() {
      let panel = document.querySelector(`.${PANEL_CLASS}`);
      let overlay = document.querySelector(`.${PANEL_OVERLAY_CLASS}`);

      if (!panel) {
        panel = document.createElement('aside');
        panel.className = PANEL_CLASS;
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-label', 'Notifications');
        document.body.appendChild(panel);
      }

      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = PANEL_OVERLAY_CLASS;
        document.body.appendChild(overlay);
      }

      const unreadCount = this.getCount();
      const notifications = this.getAll();

      panel.innerHTML = `
        <div class="notification-panel-header">
          <h2>Notifications</h2>
          <div class="notification-panel-actions">
            ${unreadCount > 0
              ? `<button class="notification-mark-all" type="button">Mark all read</button>`
              : ''}
            <button class="notification-panel-close" type="button" aria-label="Close notifications">
              <span class="material-icons-round">close</span>
            </button>
          </div>
        </div>
        <div class="notification-panel-body">
          ${notifications.length === 0
            ? `<div class="notification-panel-empty">
                 <span class="material-icons-round">notifications_none</span>
                 <p>No notifications yet</p>
               </div>`
            : `<ul class="notification-list">
                ${notifications.map((n) => this._renderPanelItem(n)).join('')}
               </ul>`
          }
        </div>`;

      // Bind events.
      const closeBtn = panel.querySelector('.notification-panel-close');
      if (closeBtn) closeBtn.addEventListener('click', () => this.closePanel());

      const markAllBtn = panel.querySelector('.notification-mark-all');
      if (markAllBtn) {
        markAllBtn.addEventListener('click', () => {
          this.markAllRead();
          this.renderPanel();
        });
      }

      // Bind individual notification click → mark as read.
      panel.querySelectorAll('.notification-item[data-id]').forEach((item) => {
        item.addEventListener('click', () => {
          const id = item.getAttribute('data-id');
          this.markRead(id);
          item.classList.remove('unread');
        });
      });

      // Update the badge count wherever it appears.
      this._updateBadge(unreadCount);
    }

    /**
     * Build a single notification item for the panel.
     *
     * @private
     * @param {Object} n
     * @returns {string}
     */
    _renderPanelItem(n) {
      const unreadClass = n.read ? '' : 'unread';
      const timeAgo = Utils.formatDate(n.timestamp);

      return `
        <li class="notification-item ${unreadClass}" data-id="${n.id}">
          <div class="notification-item-dot"></div>
          <div class="notification-item-content">
            <div class="notification-item-header">
              <span class="notification-item-type">${Utils.sanitize(n.type)}</span>
              <span class="notification-item-time">${timeAgo}</span>
            </div>
            <h4 class="notification-item-title">${Utils.sanitize(n.title)}</h4>
            <p class="notification-item-body">${Utils.truncate(Utils.sanitize(n.body), 120)}</p>
          </div>
        </li>`;
    }

    /**
     * Open (slide in) the notification panel.
     */
    openPanel() {
      this._panelOpen = true;
      this.renderPanel();

      const panel = document.querySelector(`.${PANEL_CLASS}`);
      const overlay = document.querySelector(`.${PANEL_OVERLAY_CLASS}`);

      if (panel) panel.classList.add('open');
      if (overlay) overlay.classList.add('visible');

      // Close on overlay click.
      if (overlay && !overlay._boundClose) {
        overlay._boundClose = true;
        overlay.addEventListener('click', () => this.closePanel());
      }

      // Close on Escape key.
      this._escHandler = (e) => {
        if (e.key === 'Escape') this.closePanel();
      };
      document.addEventListener('keydown', this._escHandler);

      this.emit('panelOpened', {});
    }

    /**
     * Close (slide out) the notification panel.
     */
    closePanel() {
      this._panelOpen = false;

      const panel = document.querySelector(`.${PANEL_CLASS}`);
      const overlay = document.querySelector(`.${PANEL_OVERLAY_CLASS}`);

      if (panel) panel.classList.remove('open');
      if (overlay) overlay.classList.remove('visible');

      // Clean up escape handler.
      if (this._escHandler) {
        document.removeEventListener('keydown', this._escHandler);
        this._escHandler = null;
      }

      this.emit('panelClosed', {});
    }

    // -----------------------------------------------------------------------
    // Push notifications
    // -----------------------------------------------------------------------

    /**
     * Attempt to register for push notifications via a service worker.
     * Only works in secure (HTTPS) contexts with a valid service worker.
     */
    async setupPushNotifications() {
      if (!('serviceWorker' in navigator)) {
        console.warn('[NotificationManager] Service workers not supported.');
        return;
      }

      try {
        const registration = await navigator.serviceWorker.ready;
        this._pushSubscription = await registration.pushManager.getSubscription();

        if (!this._pushSubscription) {
          console.info('[NotificationManager] No existing push subscription found.');
        }
      } catch (err) {
        console.error('[NotificationManager] Push setup failed:', err);
      }
    }

    // -----------------------------------------------------------------------
    // Update checker (simulated)
    // -----------------------------------------------------------------------

    /**
     * Simulate checking for new content updates. In a production app this
     * would poll the server periodically for new movies, series, or channels.
     *
     * For demonstration purposes, this is a no-op that can be extended.
     */
    checkForUpdates() {
      // In a real application, this would:
      // 1. Call the API to check for new content since last check.
      // 2. Compare with stored timestamps.
      // 3. Create notifications for new content.
      // 4. Optionally trigger push notifications.
      console.info('[NotificationManager] Checking for updates…');
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    /**
     * Persist the notifications array to encrypted storage.
     * @private
     */
    _persist() {
      StorageManager.setJSON(STORAGE_KEY, this._notifications);
    }

    /**
     * Ensure the `.toast-container` element exists in the DOM.
     * @private
     */
    _ensureToastContainer() {
      if (document.querySelector(`.${TOAST_CONTAINER_CLASS}`)) return;

      const container = document.createElement('div');
      container.className = TOAST_CONTAINER_CLASS;
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-atomic', 'false');
      document.body.appendChild(container);
    }

    /**
     * Update the unread-count badge in the UI. Looks for elements with
     * the `.notification-badge` class.
     *
     * @private
     * @param {number} count
     */
    _updateBadge(count) {
      const badges = document.querySelectorAll('.notification-badge');
      for (const badge of badges) {
        if (count > 0) {
          badge.textContent = count > 99 ? '99+' : String(count);
          badge.classList.remove('hidden');
        } else {
          badge.textContent = '';
          badge.classList.add('hidden');
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Register on the global namespace
  // ---------------------------------------------------------------------------
  global[NAMESPACE] = global[NAMESPACE] || {};
  global[NAMESPACE].Notifications = NotificationManager;
})(window);