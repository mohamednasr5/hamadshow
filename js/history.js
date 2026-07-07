/**
 * Hamad Show — Watch History Module
 * ===================================
 * Tracks watched content, persists playback positions for resume
 * functionality, and provides "continue watching" and recent-history
 * sections for the UI.
 *
 * Depends on:
 *   - HamadShow.Utils         (sanitize, truncate, formatDate, formatTime, getGradientColor)
 *   - HamadShow.StorageManager (getHistory, saveHistory, getContinueWatching, saveContinueWatching)
 *
 * @namespace HamadShow.History
 * @module history
 */

(function (global) {
  'use strict';

  const NAMESPACE = 'HamadShow';

  // ---------------------------------------------------------------------------
  // Reference sibling modules — they must be loaded before this file.
  // ---------------------------------------------------------------------------
  const Utils = global[NAMESPACE]?.Utils;
  const StorageManager = global[NAMESPACE]?.StorageManager;

  if (!Utils) {
    console.error('[HamadShow.History] HamadShow.Utils is required but not found.');
    return;
  }
  if (!StorageManager) {
    console.error('[HamadShow.History] HamadShow.StorageManager is required but not found.');
    return;
  }

  // ---------------------------------------------------------------------------
  // Constants
  // ---------------------------------------------------------------------------

  /** Maximum number of history entries to keep. Oldest are pruned first. */
  const MAX_HISTORY_ENTRIES = 1000;

  /** Threshold (seconds) before the end to consider an item "finished". */
  const FINISH_THRESHOLD_SECONDS = 30;

  /** Default limit for {@link getRecent}. */
  const DEFAULT_RECENT_LIMIT = 20;

  // ---------------------------------------------------------------------------
  // HistoryManager
  // ---------------------------------------------------------------------------
  class HistoryManager {
    /**
     * Create a new HistoryManager instance.
     */
    constructor() {
      /** @private */ this._listeners = {};
      /** @private */ this._history = [];
      /** @private */ this._initialized = false;
    }

    // -----------------------------------------------------------------------
    // Event emitter
    // -----------------------------------------------------------------------

    /**
     * Subscribe to a named event.
     *
     * @param {string}   event    Event name (e.g. 'added', 'updated', 'cleared').
     * @param {Function} handler  Callback invoked with event data.
     * @returns {Function} Unsubscribe function.
     */
    on(event, handler) {
      if (typeof handler !== 'function') {
        throw new TypeError('HistoryManager.on: handler must be a function');
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
          console.error(`[HistoryManager] Error in "${event}" handler:`, err);
        }
      }
    }

    // -----------------------------------------------------------------------
    // Lifecycle
    // -----------------------------------------------------------------------

    /**
     * Initialise the manager by loading persisted history from storage.
     * Should be called once after DOMContentLoaded.
     */
    init() {
      if (this._initialized) return;
      this._initialized = true;
      this._history = StorageManager.getHistory() ?? [];
    }

    // -----------------------------------------------------------------------
    // CRUD operations
    // -----------------------------------------------------------------------

    /**
     * Add a watched item to history. If an entry with the same id + type
     * already exists, it is moved to the top with updated metadata.
     *
     * @param {Object} item
     * @param {string|number} item.id        Unique content identifier.
     * @param {string}        item.type      Content type — 'movie', 'series', or 'live'.
     * @param {string}        item.name      Display name.
     * @param {string}        [item.poster]  Poster / thumbnail URL.
     * @param {number}        [item.duration] Total duration in seconds.
     * @param {number}        [item.position] Current playback position in seconds.
     * @param {number}        [item.timestamp] Epoch ms when the item was watched.
     * @param {*}             [item...rest]  Any additional metadata to persist.
     */
    add(item) {
      if (!item || item.id == null || !item.type) {
        console.warn('[HistoryManager] Cannot add history without id and type.');
        return;
      }

      const key = String(item.id);
      const typeStr = String(item.type);

      // Remove any existing entry for the same content.
      this._history = this._history.filter(
        (h) => !(h.id === key && h.type === typeStr)
      );

      const entry = {
        id: key,
        type: typeStr,
        name: String(item.name ?? ''),
        poster: String(item.poster ?? ''),
        duration: Number(item.duration) || 0,
        position: Number(item.position) || 0,
        timestamp: Number(item.timestamp) || Date.now(),
        // Spread any extra fields.
        ...Object.fromEntries(
          Object.entries(item).filter(([k]) => !['id', 'type', 'name', 'poster', 'duration', 'position', 'timestamp'].includes(k))
        ),
      };

      // Insert at the top (most recent first).
      this._history.unshift(entry);

      // Prune if over the limit.
      if (this._history.length > MAX_HISTORY_ENTRIES) {
        this._history = this._history.slice(0, MAX_HISTORY_ENTRIES);
      }

      this._persist();
      this._syncContinueWatching();
      this.emit('added', entry);
    }

    /**
     * Update the playback position for a watched item.
     *
     * @param {string|number} id        Content identifier.
     * @param {string}        type      Content type.
     * @param {number}        position  Current position in seconds.
     * @param {number}        duration  Total duration in seconds.
     * @returns {boolean} Whether an entry was found and updated.
     */
    updatePosition(id, type, position, duration) {
      const key = String(id);
      const typeStr = String(type);
      const entry = this._history.find(
        (h) => h.id === key && h.type === typeStr
      );

      if (!entry) return false;

      entry.position = Number(position) || 0;
      entry.duration = Number(duration) || 0;
      entry.timestamp = Date.now();

      this._persist();
      this._syncContinueWatching();
      this.emit('updated', entry);
      return true;
    }

    /**
     * Get the saved playback position for a content item.
     *
     * @param {string|number} id    Content identifier.
     * @param {string}        type  Content type.
     * @returns {{position: number, duration: number}|null} Saved position data,
     *          or null if the item has no history.
     */
    getPosition(id, type) {
      const key = String(id);
      const typeStr = String(type);
      const entry = this._history.find(
        (h) => h.id === key && h.type === typeStr
      );

      if (!entry) return null;

      return {
        position: entry.position ?? 0,
        duration: entry.duration ?? 0,
      };
    }

    // -----------------------------------------------------------------------
    // Accessors
    // -----------------------------------------------------------------------

    /**
     * Return a shallow copy of all history entries (most recent first).
     *
     * @returns {Object[]}
     */
    getAll() {
      return [...this._history];
    }

    /**
     * Return the N most recently watched items.
     *
     * @param {number} [limit=20]  Number of items to return.
     * @returns {Object[]}
     */
    getRecent(limit = DEFAULT_RECENT_LIMIT) {
      return this._history.slice(0, limit);
    }

    /**
     * Return items suitable for the "Continue Watching" row — content that
     * has been partially watched but not yet finished.
     *
     * An item is considered "in progress" when:
     *   - `position > 0` (playback has started)
     *   - `position < duration - 30` (not within the last 30 seconds)
     *
     * Items are sorted by the most recently watched timestamp first.
     *
     * @returns {Object[]}
     */
    getContinueWatching() {
      return this._history.filter((h) => {
        const pos = h.position ?? 0;
        const dur = h.duration ?? 0;

        // Must have started playing and have a known duration.
        if (pos <= 0 || dur <= 0) return false;

        // Not finished (at least FINISH_THRESHOLD_SECONDS from the end).
        return pos < (dur - FINISH_THRESHOLD_SECONDS);
      });
    }

    /**
     * Clear all watch history.
     */
    clear() {
      this._history = [];
      this._persist();
      StorageManager.saveContinueWatching([]);
      this.emit('cleared', {});
    }

    // -----------------------------------------------------------------------
    // Rendering — History cards
    // -----------------------------------------------------------------------

    /**
     * Render recent history as content cards inside the given container.
     *
     * @param {HTMLElement|string} container  DOM element or CSS selector.
     * @param {number}            [limit=20]  Maximum items to display.
     */
    renderHistory(container, limit = DEFAULT_RECENT_LIMIT) {
      const el = typeof container === 'string' ? document.querySelector(container) : container;
      if (!el) return;

      const items = this.getRecent(limit);

      if (items.length === 0) {
        el.innerHTML = `
          <div class="history-empty">
            <span class="material-icons-round">history</span>
            <p>Nothing watched yet</p>
          </div>`;
        return;
      }

      el.innerHTML = `
        <div class="history-grid">
          ${items.map((item) => this._renderHistoryCard(item)).join('')}
        </div>`;
    }

    /**
     * Build a single history card HTML string.
     *
     * @private
     * @param {Object} item
     * @returns {string}
     */
    _renderHistoryCard(item) {
      const gradient = Utils.getGradientColor(item.type);
      const typeLabel = item.type.charAt(0).toUpperCase() + item.type.slice(1);
      const timeAgo = Utils.formatDate(item.timestamp);

      return `
        <div class="content-card history-card" data-id="${item.id}" data-type="${item.type}" role="button" tabindex="0">
          <div class="content-card-poster" style="background: ${gradient};">
            ${item.poster
              ? `<img src="${Utils.sanitize(item.poster)}" alt="${Utils.sanitize(item.name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                 <div class="content-card-placeholder" style="display:none;">
                   <span class="material-icons-round">${item.type === 'live' ? 'live_tv' : item.type === 'series' ? 'tv' : 'movie'}</span>
                 </div>`
              : `<div class="content-card-placeholder" style="display:flex;">
                   <span class="material-icons-round">${item.type === 'live' ? 'live_tv' : item.type === 'series' ? 'tv' : 'movie'}</span>
                 </div>`
            }
            <span class="content-card-type-badge">${typeLabel}</span>
          </div>
          <div class="content-card-info">
            <h3 class="content-card-title" title="${Utils.sanitize(item.name)}">${Utils.truncate(Utils.sanitize(item.name), 40)}</h3>
            <div class="content-card-meta">
              <span class="content-card-meta-time">${timeAgo}</span>
            </div>
          </div>
        </div>`;
    }

    // -----------------------------------------------------------------------
    // Rendering — Continue Watching with progress rings
    // -----------------------------------------------------------------------

    /**
     * Render a "Continue Watching" horizontal scroll row with progress rings.
     * Each card shows a circular SVG progress indicator overlaying the poster.
     *
     * @param {HTMLElement|string} container  DOM element or CSS selector.
     */
    renderContinueWatching(container) {
      const el = typeof container === 'string' ? document.querySelector(container) : container;
      if (!el) return;

      const items = this.getContinueWatching();

      if (items.length === 0) {
        el.innerHTML = '';
        return;
      }

      el.innerHTML = `
        <div class="continue-watching-row">
          <div class="continue-watching-scroll">
            ${items.map((item) => this._renderContinueCard(item)).join('')}
          </div>
        </div>`;
    }

    /**
     * Build a single continue-watching card with a circular progress ring.
     *
     * @private
     * @param {Object} item
     * @returns {string}
     */
    _renderContinueCard(item) {
      const gradient = Utils.getGradientColor(item.type);
      const pos = item.position ?? 0;
      const dur = item.duration ?? 0;
      const progress = dur > 0 ? Math.min(pos / dur, 1) : 0;
      const percent = Math.round(progress * 100);

      // SVG circle parameters.
      const radius = 18;
      const circumference = 2 * Math.PI * radius;
      const offset = circumference * (1 - progress);
      const timeAgo = Utils.formatDate(item.timestamp);

      return `
        <div class="continue-card" data-id="${item.id}" data-type="${item.type}" role="button" tabindex="0">
          <div class="continue-card-poster" style="background: ${gradient};">
            ${item.poster
              ? `<img src="${Utils.sanitize(item.poster)}" alt="${Utils.sanitize(item.name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                 <div class="content-card-placeholder" style="display:none;">
                   <span class="material-icons-round">${item.type === 'live' ? 'live_tv' : item.type === 'series' ? 'tv' : 'movie'}</span>
                 </div>`
              : `<div class="content-card-placeholder" style="display:flex;">
                   <span class="material-icons-round">${item.type === 'live' ? 'live_tv' : item.type === 'series' ? 'tv' : 'movie'}</span>
                 </div>`
            }
            <!-- Circular progress ring -->
            <svg class="progress-ring" viewBox="0 0 44 44" aria-label="${percent}% watched">
              <circle class="progress-ring-bg" cx="22" cy="22" r="${radius}"
                fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="3"/>
              <circle class="progress-ring-fill" cx="22" cy="22" r="${radius}"
                fill="none" stroke="var(--primary-color, #e50914)" stroke-width="3"
                stroke-linecap="round"
                stroke-dasharray="${circumference}"
                stroke-dashoffset="${offset}"
                transform="rotate(-90 22 22)"/>
              <text x="22" y="22" text-anchor="middle" dominant-baseline="central"
                fill="white" font-size="11" font-weight="600">${percent}%</text>
            </svg>
          </div>
          <div class="continue-card-info">
            <h4 class="continue-card-title" title="${Utils.sanitize(item.name)}">${Utils.truncate(Utils.sanitize(item.name), 30)}</h4>
            <div class="continue-card-meta">
              <span class="continue-card-progress-text">${Utils.formatTime(pos)} / ${Utils.formatTime(dur)}</span>
              <span class="continue-card-time">${timeAgo}</span>
            </div>
          </div>
        </div>`;
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    /**
     * Persist the current history array to encrypted storage.
     * @private
     */
    _persist() {
      StorageManager.saveHistory(this._history);
    }

    /**
     * Synchronise the dedicated "continue watching" storage key with the
     * in-progress subset of the history array. This allows other modules
     * (e.g. home page) to read continue-watching data without depending
     * on the HistoryManager instance.
     * @private
     */
    _syncContinueWatching() {
      const inProgress = this.getContinueWatching();
      StorageManager.saveContinueWatching(inProgress);
    }
  }

  // ---------------------------------------------------------------------------
  // Register on the global namespace
  // ---------------------------------------------------------------------------
  global[NAMESPACE] = global[NAMESPACE] || {};
  global[NAMESPACE].History = HistoryManager;
})(window);