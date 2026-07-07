/**
 * Hamad Show — Search Module
 * ============================
 * Manages search functionality including debounced queries, recent search
 * history, voice search via the Web Speech API, and result filtering by
 * genre, year, and language.
 *
 * Depends on:
 *   - HamadShow.Config       (API endpoints, settings)
 *   - HamadShow.Utils        (debounce, sanitize, truncate, generateId)
 *   - HamadShow.StorageManager (search history persistence)
 *
 * @namespace HamadShow.Search
 * @module search
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
    console.error('[HamadShow.Search] HamadShow.Config is required but not found.');
    return;
  }
  if (!Utils) {
    console.error('[HamadShow.Search] HamadShow.Utils is required but not found.');
    return;
  }
  if (!StorageManager) {
    console.error('[HamadShow.Search] HamadShow.StorageManager is required but not found.');
    return;
  }

  // ---------------------------------------------------------------------------
  // Constants
  // ---------------------------------------------------------------------------

  /** Debounce delay for search-as-you-type (ms). */
  const DEBOUNCE_MS = 300;

  /** Maximum number of recent searches to display as chips. */
  const MAX_RECENT_CHIPS = 10;

  /** Maximum recent searches stored in storage. */
  const MAX_STORED_SEARCHES = 50;

  /** Selector for the search input field. */
  const SEARCH_INPUT_SELECTOR = '#search-input, .search-input';

  /** Selector for the search results container. */
  const RESULTS_CONTAINER_SELECTOR = '#search-results, .search-results';

  /** Selector for the recent searches container. */
  const RECENT_CONTAINER_SELECTOR = '#recent-searches, .recent-searches';

  /** Selector for the search clear button. */
  const CLEAR_BTN_SELECTOR = '#search-clear, .search-clear-btn';

  /** Selector for the voice search button. */
  const VOICE_BTN_SELECTOR = '#voice-search-btn, .voice-search-btn';

  // ---------------------------------------------------------------------------
  // SearchManager
  // ---------------------------------------------------------------------------
  class SearchManager {
    /**
     * Create a new SearchManager instance.
     *
     * @param {Object} [api]  Optional API instance for performing searches.
     *                        Falls back to `global.HamadShow.API`.
     */
    constructor(api) {
      /** @private */ this._api = api || global[NAMESPACE]?.API || null;
      /** @private */ this._listeners = {};
      /** @private */ this._debouncedSearch = Utils.debounce(this._executeSearch.bind(this), DEBOUNCE_MS);
      /** @private */ this._currentQuery = '';
      /** @private */ this._currentFilters = { genre: null, year: null, language: null };
      /** @private */ this._isSearching = false;
      /** @private */ this._recognition = null;
      /** @private */ this._initialized = false;
    }

    // -----------------------------------------------------------------------
    // Event emitter
    // -----------------------------------------------------------------------

    /**
     * Subscribe to a named event.
     *
     * @param {string}   event    Event name (e.g. 'results', 'cleared').
     * @param {Function} handler  Callback invoked with event data.
     * @returns {Function} Unsubscribe function.
     */
    on(event, handler) {
      if (typeof handler !== 'function') {
        throw new TypeError('SearchManager.on: handler must be a function');
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
          console.error(`[SearchManager] Error in "${event}" handler:`, err);
        }
      }
    }

    // -----------------------------------------------------------------------
    // Lifecycle
    // -----------------------------------------------------------------------

    /**
     * Initialise the search manager: bind DOM event listeners and render
     * the recent search chips. Should be called once after DOMContentLoaded.
     */
    init() {
      if (this._initialized) return;
      this._initialized = true;

      // Bind the search input.
      const searchInput = document.querySelector(SEARCH_INPUT_SELECTOR);
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          const query = e.target.value?.trim() || '';
          this.search(query);
        });

        // Allow pressing Enter to force an immediate search.
        searchInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            this._debouncedSearch.cancel?.();
            this.search(searchInput.value?.trim() || '');
          }
        });
      }

      // Bind the clear button.
      const clearBtn = document.querySelector(CLEAR_BTN_SELECTOR);
      if (clearBtn) {
        clearBtn.addEventListener('click', () => this.clearResults());
      }

      // Bind the voice search button.
      const voiceBtn = document.querySelector(VOICE_BTN_SELECTOR);
      if (voiceBtn) {
        voiceBtn.addEventListener('click', () => this.voiceSearch());
      }

      // Render recent searches on load.
      this.renderRecentSearches();
    }

    // -----------------------------------------------------------------------
    // Search
    // -----------------------------------------------------------------------

    /**
     * Perform a debounced search. If the query is empty the results are
     * cleared and recent searches are shown instead.
     *
     * @param {string} query  Search term.
     */
    search(query) {
      this._currentQuery = (typeof query === 'string' ? query : '').trim();

      // Empty query → show recent searches, hide results.
      if (!this._currentQuery) {
        this.clearResults();
        this.renderRecentSearches();
        return;
      }

      // Delegate to the debounced version.
      this._debouncedSearch(this._currentQuery);
    }

    /**
     * Execute the actual search. Called by the debounced wrapper.
     *
     * @private
     * @param {string} query
     */
    async _executeSearch(query) {
      if (this._isSearching) return;

      // If an API instance is available, use the server-side search.
      if (this._api && typeof this._api.search === 'function') {
        this._isSearching = true;

        // Hide recent searches while results load.
        this._hideRecentSearches();

        // Show a loading state in the results container.
        this._showLoading();

        try {
          const results = await this._api.search(query);

          // Apply any active client-side filters.
          const filtered = this._applyFilters(results);

          // Save to recent searches.
          this.addRecentSearch(query);

          // Render and emit.
          this.renderResults(filtered);
          this.emit('results', filtered);
        } catch (err) {
          console.error('[SearchManager] Search failed:', err);
          this._showError('Search failed. Please try again.');
        } finally {
          this._isSearching = false;
        }
      } else {
        // No API available — show recent searches only.
        console.warn('[SearchManager] No API instance available for search.');
        this.renderRecentSearches();
      }
    }

    // -----------------------------------------------------------------------
    // Rendering
    // -----------------------------------------------------------------------

    /**
     * Render search results as a grid of content cards.
     * Merges movies, series, and live results into a single grid.
     *
     * @param {Object} results  Object with `movies`, `series`, `live` arrays.
     */
    renderResults(results) {
      const container = document.querySelector(RESULTS_CONTAINER_SELECTOR);
      if (!container) return;

      // Build a flat list of normalised items from all categories.
      const items = [];

      for (const movie of results?.movies ?? []) {
        items.push({
          id: movie.stream_id ?? movie.id,
          type: 'movie',
          name: Utils.sanitize(movie.name || movie.title || 'Untitled'),
          poster: movie.stream_icon || movie.cover || '',
          rating: movie.rating || movie.rating_5based || null,
          year: movie.year || null,
          genre: movie.category_id || null,
        });
      }

      for (const series of results?.series ?? []) {
        items.push({
          id: series.series_id ?? series.id,
          type: 'series',
          name: Utils.sanitize(series.name || series.title || 'Untitled'),
          poster: series.cover || '',
          rating: series.rating || null,
          year: series.year || null,
          genre: series.category_id || null,
        });
      }

      for (const live of results?.live ?? []) {
        items.push({
          id: live.stream_id ?? live.id,
          type: 'live',
          name: Utils.sanitize(live.name || live.title || 'Untitled'),
          poster: live.stream_icon || '',
          rating: null,
          year: null,
          genre: live.category_id || null,
        });
      }

      // No results.
      if (items.length === 0) {
        container.innerHTML = `
          <div class="search-empty">
            <span class="material-icons-round search-empty-icon">search_off</span>
            <p>No results found for "<strong>${Utils.sanitize(this._currentQuery)}</strong>"</p>
          </div>`;
        return;
      }

      // Render cards grid.
      container.innerHTML = `
        <div class="search-results-grid">
          ${items.map((item) => this._renderCard(item)).join('')}
        </div>`;
    }

    /**
     * Build a single content-card HTML string.
     *
     * @private
     * @param {Object} item  Normalised content item.
     * @returns {string} HTML string.
     */
    _renderCard(item) {
      const gradient = Utils.getGradientColor(item.type);
      const typeLabel = item.type.charAt(0).toUpperCase() + item.type.slice(1);

      return `
        <div class="content-card" data-id="${item.id}" data-type="${item.type}" role="button" tabindex="0">
          <div class="content-card-poster" style="background: ${gradient};">
            ${item.poster
              ? `<img src="${Utils.sanitize(item.poster)}" alt="${item.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
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
            <h3 class="content-card-title" title="${item.name}">${Utils.truncate(item.name, 40)}</h3>
            <div class="content-card-meta">
              ${item.year ? `<span>${item.year}</span>` : ''}
              ${item.rating ? `<span>★ ${Number(item.rating).toFixed(1)}</span>` : ''}
            </div>
          </div>
        </div>`;
    }

    /**
     * Clear the search input and results container, then show recent searches.
     */
    clearResults() {
      const input = document.querySelector(SEARCH_INPUT_SELECTOR);
      const container = document.querySelector(RESULTS_CONTAINER_SELECTOR);

      if (input) input.value = '';
      if (container) container.innerHTML = '';

      this._currentQuery = '';
      this._currentFilters = { genre: null, year: null, language: null };
      this.renderRecentSearches();

      this.emit('cleared', {});
    }

    /**
     * Render recent search chips in the recent-searches container.
     */
    renderRecentSearches() {
      const container = document.querySelector(RECENT_CONTAINER_SELECTOR);
      if (!container) return;

      const recent = this.getRecentSearches();

      if (recent.length === 0) {
        container.innerHTML = '';
        return;
      }

      container.innerHTML = `
        <div class="recent-searches">
          <p class="recent-searches-label">Recent Searches</p>
          <div class="recent-searches-chips">
            ${recent.map((term) => `
              <button class="chip recent-search-chip" data-term="${Utils.sanitize(term)}" type="button">
                <span class="material-icons-round chip-icon">history</span>
                <span class="chip-text">${Utils.truncate(Utils.sanitize(term), 30)}</span>
                <span class="material-icons-round chip-remove" data-clear-term="${Utils.sanitize(term)}">close</span>
              </button>`).join('')}
          </div>
          <button class="recent-searches-clear" type="button">Clear All</button>
        </div>`;

      // Bind chip clicks → populate search input and search.
      container.querySelectorAll('.recent-search-chip').forEach((chip) => {
        chip.addEventListener('click', (e) => {
          // Skip if the remove button was clicked.
          if (e.target.closest('.chip-remove')) return;

          const term = chip.getAttribute('data-term');
          const input = document.querySelector(SEARCH_INPUT_SELECTOR);
          if (input) input.value = term;
          this.search(term);
        });
      });

      // Bind individual chip remove buttons.
      container.querySelectorAll('.chip-remove').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const term = btn.getAttribute('data-clear-term');
          this._removeRecentSearch(term);
          this.renderRecentSearches();
        });
      });

      // Bind "Clear All" button.
      const clearAllBtn = container.querySelector('.recent-searches-clear');
      if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
          this.clearRecentSearches();
          this.renderRecentSearches();
        });
      }
    }

    // -----------------------------------------------------------------------
    // Recent searches
    // -----------------------------------------------------------------------

    /**
     * Add a term to the recent-search history (de-duplicated, newest first).
     *
     * @param {string} term
     */
    addRecentSearch(term) {
      if (typeof term !== 'string' || !term.trim()) return;
      const trimmed = term.trim();

      // Use StorageManager's built-in method which handles de-dup and cap.
      if (typeof StorageManager.addRecentSearch === 'function') {
        StorageManager.addRecentSearch(trimmed);
      } else {
        // Fallback implementation.
        const history = this.getRecentSearches();
        const filtered = history.filter((t) => t !== trimmed);
        filtered.unshift(trimmed);
        StorageManager.saveSearchHistory(filtered.slice(0, MAX_STORED_SEARCHES));
      }
    }

    /**
     * Retrieve the list of recent search terms (newest first).
     *
     * @param {number} [limit=10]
     * @returns {string[]}
     */
    getRecentSearches(limit = MAX_RECENT_CHIPS) {
      if (typeof StorageManager.getRecentSearches === 'function') {
        return StorageManager.getRecentSearches(limit);
      }
      // Fallback.
      const all = StorageManager.getSearchHistory() || [];
      return all.slice(0, limit);
    }

    /**
     * Remove all recent searches from storage.
     */
    clearRecentSearches() {
      StorageManager.saveSearchHistory([]);
    }

    /**
     * Remove a single term from recent searches.
     *
     * @private
     * @param {string} term
     */
    _removeRecentSearch(term) {
      const history = this.getRecentSearches(MAX_STORED_SEARCHES);
      const filtered = history.filter((t) => t !== term);
      StorageManager.saveSearchHistory(filtered);
    }

    // -----------------------------------------------------------------------
    // Voice search
    // -----------------------------------------------------------------------

    /**
     * Start voice recognition via the Web Speech API.
     * Falls back gracefully when the API is unavailable.
     */
    voiceSearch() {
      const SpeechRecognition = global.SpeechRecognition || global.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        console.warn('[SearchManager] Web Speech API not supported in this browser.');
        this._showError('Voice search is not supported in this browser.');
        return;
      }

      // Stop any existing recognition.
      if (this._recognition) {
        try { this._recognition.abort(); } catch { /* no-op */ }
      }

      this._recognition = new SpeechRecognition();
      this._recognition.lang = 'en-US';
      this._recognition.interimResults = true;
      this._recognition.continuous = false;
      this._recognition.maxAlternatives = 1;

      const input = document.querySelector(SEARCH_INPUT_SELECTOR);

      this._recognition.onstart = () => {
        const btn = document.querySelector(VOICE_BTN_SELECTOR);
        if (btn) btn.classList.add('listening');
      };

      this._recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript || '';
        if (input) input.value = transcript;
        if (event.results[0].isFinal) {
          this.search(transcript);
        }
      };

      this._recognition.onerror = (event) => {
        console.warn('[SearchManager] Voice recognition error:', event.error);
        const btn = document.querySelector(VOICE_BTN_SELECTOR);
        if (btn) btn.classList.remove('listening');

        if (event.error === 'not-allowed') {
          this._showError('Microphone access denied. Please allow microphone permissions.');
        } else if (event.error === 'no-speech') {
          this._showError('No speech detected. Please try again.');
        }
      };

      this._recognition.onend = () => {
        const btn = document.querySelector(VOICE_BTN_SELECTOR);
        if (btn) btn.classList.remove('listening');
        this._recognition = null;
      };

      try {
        this._recognition.start();
      } catch (err) {
        console.error('[SearchManager] Failed to start voice recognition:', err);
      }
    }

    // -----------------------------------------------------------------------
    // Filtering
    // -----------------------------------------------------------------------

    /**
     * Filter results by genre ID.
     *
     * @param {string|number|null} genre  Category / genre ID, or null to clear.
     */
    filterByGenre(genre) {
      this._currentFilters.genre = genre ?? null;
      this._reFilter();
    }

    /**
     * Filter results by release year.
     *
     * @param {number|null} year  Four-digit year, or null to clear.
     */
    filterByYear(year) {
      this._currentFilters.year = (typeof year === 'number' && year > 0) ? year : null;
      this._reFilter();
    }

    /**
     * Filter results by language.
     *
     * @param {string|null} lang  Language code or name, or null to clear.
     */
    filterByLanguage(lang) {
      this._currentFilters.language = lang ?? null;
      this._reFilter();
    }

    /**
     * Re-apply the current filters to the last-fetched raw results and
     * re-render.  Stores the last raw results on the instance.
     *
     * @private
     */
    _reFilter() {
      // If we have no stored raw results, there's nothing to filter.
      if (!this._lastRawResults) return;
      const filtered = this._applyFilters(this._lastRawResults);
      this.renderResults(filtered);
      this.emit('results', filtered);
    }

    /**
     * Apply the active genre / year / language filters to a results object.
     *
     * @private
     * @param {Object} results  Raw results with `movies`, `series`, `live`.
     * @returns {Object} Filtered results.
     */
    _applyFilters(results) {
      // Store a copy so we can re-filter later.
      this._lastRawResults = results;

      const { genre, year, language } = this._currentFilters;
      const noFilters = genre === null && year === null && language === null;

      if (noFilters) return results;

      const filterFn = (item) => {
        // Genre filter.
        if (genre !== null) {
          const itemGenre = String(item.category_id ?? item.genre ?? '');
          if (itemGenre !== String(genre)) return false;
        }

        // Year filter.
        if (year !== null) {
          const itemYear = String(item.year ?? '');
          if (itemYear !== String(year)) return false;
        }

        // Language filter — check common language fields.
        if (language !== null) {
          const lang = String(item.language ?? item.lang ?? '').toLowerCase();
          if (lang && lang !== String(language).toLowerCase()) return false;
        }

        return true;
      };

      return {
        movies: (results?.movies ?? []).filter(filterFn),
        series: (results?.series ?? []).filter(filterFn),
        live:   (results?.live ?? []).filter(filterFn),
      };
    }

    // -----------------------------------------------------------------------
    // UI helpers (private)
    // -----------------------------------------------------------------------

    /**
     * Show a loading spinner inside the results container.
     * @private
     */
    _showLoading() {
      const container = document.querySelector(RESULTS_CONTAINER_SELECTOR);
      if (!container) return;
      container.innerHTML = `
        <div class="search-loading">
          <div class="spinner"></div>
          <p>Searching…</p>
        </div>`;
    }

    /**
     * Show an error message inside the results container.
     * @private
     * @param {string} message
     */
    _showError(message) {
      const container = document.querySelector(RESULTS_CONTAINER_SELECTOR);
      if (!container) return;
      container.innerHTML = `
        <div class="search-error">
          <span class="material-icons-round">error_outline</span>
          <p>${Utils.sanitize(message)}</p>
        </div>`;
    }

    /**
     * Hide the recent searches container.
     * @private
     */
    _hideRecentSearches() {
      const container = document.querySelector(RECENT_CONTAINER_SELECTOR);
      if (container) container.innerHTML = '';
    }
  }

  // ---------------------------------------------------------------------------
  // Register on the global namespace
  // ---------------------------------------------------------------------------
  global[NAMESPACE] = global[NAMESPACE] || {};
  global[NAMESPACE].Search = SearchManager;
})(window);