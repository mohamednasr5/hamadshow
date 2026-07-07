/**
 * Hamad Show — Favorites Module
 * ===============================
 * Manages the user's favourite (bookmarked) content. Supports adding,
 * removing, toggling, and rendering favourites as grids or lists.
 * All data is persisted through the encrypted StorageManager.
 *
 * Depends on:
 *   - HamadShow.Utils         (sanitize, truncate, generateId, getGradientColor)
 *   - HamadShow.StorageManager (getFavorites / saveFavorites)
 *
 * @namespace HamadShow.Favorites
 * @module favorites
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
    console.error('[HamadShow.Favorites] HamadShow.Utils is required but not found.');
    return;
  }
  if (!StorageManager) {
    console.error('[HamadShow.Favorites] HamadShow.StorageManager is required but not found.');
    return;
  }

  // ---------------------------------------------------------------------------
  // Constants
  // ---------------------------------------------------------------------------

  /** Maximum number of favourites allowed (prevents unbounded storage growth). */
  const MAX_FAVORITES = 500;

  // ---------------------------------------------------------------------------
  // FavoritesManager
  // ---------------------------------------------------------------------------
  class FavoritesManager {
    /**
     * Create a new FavoritesManager instance.
     */
    constructor() {
      /** @private */ this._listeners = {};
      /** @private */ this._favorites = [];
      /** @private */ this._initialized = false;
    }

    // -----------------------------------------------------------------------
    // Event emitter
    // -----------------------------------------------------------------------

    /**
     * Subscribe to a named event.
     *
     * @param {string}   event    Event name (e.g. 'added', 'removed', 'changed').
     * @param {Function} handler  Callback invoked with the affected item.
     * @returns {Function} Unsubscribe function.
     */
    on(event, handler) {
      if (typeof handler !== 'function') {
        throw new TypeError('FavoritesManager.on: handler must be a function');
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
          console.error(`[FavoritesManager] Error in "${event}" handler:`, err);
        }
      }
    }

    // -----------------------------------------------------------------------
    // Lifecycle
    // -----------------------------------------------------------------------

    /**
     * Initialise the manager by loading persisted favourites from storage.
     * Should be called once after DOMContentLoaded.
     */
    init() {
      if (this._initialized) return;
      this._initialized = true;
      this._favorites = StorageManager.getFavorites() ?? [];
    }

    // -----------------------------------------------------------------------
    // CRUD operations
    // -----------------------------------------------------------------------

    /**
     * Add an item to favourites.
     *
     * @param {Object} item
     * @param {string|number} item.id       Unique content identifier.
     * @param {string}        item.type     Content type — 'movie', 'series', or 'live'.
     * @param {string}        item.name     Display name.
     * @param {string}        [item.poster] Poster / thumbnail URL.
     * @param {*}             [item...rest] Any additional metadata to persist.
     */
    add(item) {
      if (!item || item.id == null || !item.type) {
        console.warn('[FavoritesManager] Cannot add favourite without id and type.');
        return;
      }

      // Prevent duplicates.
      if (this.isFavorite(item.id, item.type)) return;

      // Enforce the maximum limit.
      if (this._favorites.length >= MAX_FAVORITES) {
        console.warn(`[FavoritesManager] Maximum favourites limit (${MAX_FAVORITES}) reached.`);
        return;
      }

      const entry = {
        id: String(item.id),
        type: String(item.type),
        name: String(item.name ?? ''),
        poster: String(item.poster ?? ''),
        addedAt: Date.now(),
        // Spread any extra fields the caller provided.
        ...Object.fromEntries(
          Object.entries(item).filter(([k]) => !['id', 'type', 'name', 'poster'].includes(k))
        ),
      };

      this._favorites.push(entry);
      this._persist();
      this.emit('added', entry);
      this.emit('changed', this._favorites);
    }

    /**
     * Remove an item from favourites by its id and type.
     *
     * @param {string|number} id    Content identifier.
     * @param {string}        type  Content type.
     * @returns {boolean} Whether an item was actually removed.
     */
    remove(id, type) {
      const key = String(id);
      const typeStr = String(type);
      const before = this._favorites.length;

      this._favorites = this._favorites.filter(
        (f) => !(f.id === key && f.type === typeStr)
      );

      if (this._favorites.length < before) {
        this._persist();
        this.emit('removed', { id: key, type: typeStr });
        this.emit('changed', this._favorites);
        return true;
      }

      return false;
    }

    /**
     * Toggle an item: add if not a favourite, remove if it is.
     *
     * @param {Object} item  Same shape as {@link FavoritesManager#add}.
     * @returns {boolean} `true` if the item is now a favourite, `false` otherwise.
     */
    toggle(item) {
      if (this.isFavorite(item.id, item.type)) {
        this.remove(item.id, item.type);
        return false;
      }
      this.add(item);
      return true;
    }

    /**
     * Check whether a given content item is in the favourites list.
     *
     * @param {string|number} id    Content identifier.
     * @param {string}        type  Content type.
     * @returns {boolean}
     */
    isFavorite(id, type) {
      return this._favorites.some(
        (f) => f.id === String(id) && f.type === String(type)
      );
    }

    // -----------------------------------------------------------------------
    // Accessors
    // -----------------------------------------------------------------------

    /**
     * Return a shallow copy of all favourites.
     *
     * @returns {Object[]}
     */
    getAll() {
      return [...this._favorites];
    }

    /**
     * Return favourites filtered by content type.
     *
     * @param {string} type  'movie', 'series', or 'live'.
     * @returns {Object[]}
     */
    getByType(type) {
      const typeStr = String(type);
      return this._favorites.filter((f) => f.type === typeStr);
    }

    // -----------------------------------------------------------------------
    // Rendering — Grid
    // -----------------------------------------------------------------------

    /**
     * Render favourites as a content-card grid inside the given container.
     * Optionally filtered by type.
     *
     * @param {HTMLElement|string} container  DOM element or CSS selector.
     * @param {string}            [type]     Optional type filter.
     */
    renderFavoritesGrid(container, type) {
      const el = typeof container === 'string' ? document.querySelector(container) : container;
      if (!el) return;

      const items = type ? this.getByType(type) : this.getAll();

      if (items.length === 0) {
        el.innerHTML = `
          <div class="favorites-empty">
            <span class="material-icons-round">favorite_border</span>
            <p>${type ? `No favourite ${type}s yet` : 'No favourites yet'}</p>
            <p class="favorites-empty-hint">Tap the heart icon on any content to add it here.</p>
          </div>`;
        return;
      }

      // Sort by most recently added.
      const sorted = [...items].sort((a, b) => (b.addedAt ?? 0) - (a.addedAt ?? 0));

      el.innerHTML = `
        <div class="favorites-grid">
          ${sorted.map((item) => this._renderGridCard(item)).join('')}
        </div>`;
    }

    /**
     * Build a single grid-card HTML string for a favourite item.
     *
     * @private
     * @param {Object} item
     * @returns {string}
     */
    _renderGridCard(item) {
      const gradient = Utils.getGradientColor(item.type);
      const typeLabel = item.type.charAt(0).toUpperCase() + item.type.slice(1);
      const isFav = true; // By definition, since this is from the favourites list.

      return `
        <div class="content-card favorite-card" data-id="${item.id}" data-type="${item.type}" role="button" tabindex="0">
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
            <button class="content-card-fav-btn ${isFav ? 'active' : ''}" data-fav-id="${item.id}" data-fav-type="${item.type}" aria-label="Remove from favourites">
              <span class="material-icons-round">${isFav ? 'favorite' : 'favorite_border'}</span>
            </button>
          </div>
          <div class="content-card-info">
            <h3 class="content-card-title" title="${Utils.sanitize(item.name)}">${Utils.truncate(Utils.sanitize(item.name), 40)}</h3>
          </div>
        </div>`;
    }

    // -----------------------------------------------------------------------
    // Rendering — List
    // -----------------------------------------------------------------------

    /**
     * Render favourites as a vertical list with remove buttons inside the
     * given container.
     *
     * @param {HTMLElement|string} container  DOM element or CSS selector.
     */
    renderFavoritesList(container) {
      const el = typeof container === 'string' ? document.querySelector(container) : container;
      if (!el) return;

      const items = this.getAll();

      if (items.length === 0) {
        el.innerHTML = `
          <div class="favorites-empty">
            <span class="material-icons-round">favorite_border</span>
            <p>No favourites yet</p>
          </div>`;
        return;
      }

      // Sort by most recently added.
      const sorted = [...items].sort((a, b) => (b.addedAt ?? 0) - (a.addedAt ?? 0));

      el.innerHTML = `
        <div class="favorites-list">
          ${sorted.map((item) => this._renderListItem(item)).join('')}
        </div>`;

      // Bind remove buttons.
      el.querySelectorAll('.favorites-list-remove').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-fav-id');
          const type = btn.getAttribute('data-fav-type');
          this.remove(id, type);

          // Animate out, then re-render.
          const row = btn.closest('.favorites-list-item');
          if (row) {
            row.classList.add('removing');
            row.addEventListener('transitionend', () => {
              this.renderFavoritesList(el);
            }, { once: true });
            // Fallback if transition doesn't fire.
            setTimeout(() => this.renderFavoritesList(el), 350);
          } else {
            this.renderFavoritesList(el);
          }
        });
      });
    }

    /**
     * Build a single list-item HTML string for a favourite item.
     *
     * @private
     * @param {Object} item
     * @returns {string}
     */
    _renderListItem(item) {
      const gradient = Utils.getGradientColor(item.type);
      const typeLabel = item.type.charAt(0).toUpperCase() + item.type.slice(1);

      return `
        <div class="favorites-list-item" data-id="${item.id}" data-type="${item.type}">
          <div class="favorites-list-poster" style="background: ${gradient};">
            ${item.poster
              ? `<img src="${Utils.sanitize(item.poster)}" alt="${Utils.sanitize(item.name)}" loading="lazy" onerror="this.style.display='none';">`
              : `<span class="material-icons-round">${item.type === 'live' ? 'live_tv' : item.type === 'series' ? 'tv' : 'movie'}</span>`
            }
          </div>
          <div class="favorites-list-info">
            <h4 class="favorites-list-name">${Utils.sanitize(item.name)}</h4>
            <span class="favorites-list-type">${typeLabel}</span>
          </div>
          <button class="favorites-list-remove" data-fav-id="${item.id}" data-fav-type="${item.type}" aria-label="Remove from favourites" type="button">
            <span class="material-icons-round">delete_outline</span>
          </button>
        </div>`;
    }

    // -----------------------------------------------------------------------
    // Persistence (private)
    // -----------------------------------------------------------------------

    /**
     * Persist the current favourites array to encrypted storage.
     * @private
     */
    _persist() {
      StorageManager.saveFavorites(this._favorites);
    }
  }

  // ---------------------------------------------------------------------------
  // Register on the global namespace
  // ---------------------------------------------------------------------------
  global[NAMESPACE] = global[NAMESPACE] || {};
  global[NAMESPACE].Favorites = FavoritesManager;
})(window);