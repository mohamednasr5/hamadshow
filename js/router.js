/**
 * Hamad Show — SPA Router Module
 * ===============================
 * Lightweight hash-based single-page-application router.
 *
 * Features
 * --------
 *  - Named route definitions with title, icon, and auth guard.
 *  - Browser back/forward integration via the History API and hashchange.
 *  - Simple event emitter for navigation lifecycle hooks.
 *  - Scroll-to-top and document-title updates on every transition.
 *
 * @namespace HamadShow.Router
 * @module router
 */

(function (global) {
  'use strict';

  const NAMESPACE = 'HamadShow';

  // ---------------------------------------------------------------------------
  // Default route table
  // ---------------------------------------------------------------------------
  const DEFAULT_ROUTES = [
    { path: '/',          title: 'Home',      icon: 'home',      requiresAuth: false },
    { path: '/movies',    title: 'Movies',    icon: 'movie',     requiresAuth: true  },
    { path: '/series',    title: 'Series',    icon: 'tv',        requiresAuth: true  },
    { path: '/livetv',    title: 'Live TV',   icon: 'live_tv',   requiresAuth: true  },
    { path: '/search',    title: 'Search',    icon: 'search',    requiresAuth: false },
    { path: '/favorites', title: 'Favorites', icon: 'favorite',  requiresAuth: true  },
    { path: '/settings',  title: 'Settings',  icon: 'settings',  requiresAuth: false },
    { path: '/profile',   title: 'Profile',   icon: 'person',    requiresAuth: true  },
  ];

  // ---------------------------------------------------------------------------
  // Router
  // ---------------------------------------------------------------------------
  class Router {
    /**
     * @param {Object[]}  [routes]       Array of route definitions.
     * @param {string}    routes[].path         URL path (used as hash fragment).
     * @param {string}    routes[].title        Human-readable page title.
     * @param {string}    routes[].icon         Icon identifier for navigation.
     * @param {boolean}   routes[].requiresAuth Whether auth is required.
     */
    constructor(routes) {
      /** @private */ this._routes = (routes || DEFAULT_ROUTES).map((r) => ({ ...r }));
      /** @private */ this._listeners = {};
      /** @private */ this._currentPath = '';
      /** @private */ this._currentParams = {};
      /** @private */ this._started = false;
    }

    // -----------------------------------------------------------------------
    // Event emitter
    // -----------------------------------------------------------------------

    /**
     * Subscribe to a named event.
     *
     * @param {string}   event    Event name (e.g. 'navigate').
     * @param {Function} handler  Callback invoked with event data.
     * @returns {Function} Unsubscribe function.
     */
    on(event, handler) {
      if (typeof handler !== 'function') {
        throw new TypeError('Router.on: handler must be a function');
      }
      (this._listeners[event] ||= []).push(handler);

      // Return an unsubscribe handle for convenience.
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
     * @param {*}      data   Data forwarded to each handler.
     */
    emit(event, data) {
      const list = this._listeners[event];
      if (!list) return;
      for (const handler of [...list]) {
        try {
          handler(data);
        } catch (err) {
          console.error(`[Router] Error in "${event}" handler:`, err);
        }
      }
    }

    // -----------------------------------------------------------------------
    // Navigation
    // -----------------------------------------------------------------------

    /**
     * Navigate to the given path, optionally passing query-string–style params.
     *
     * @param {string} path   Hash path (e.g. '/movies' or '/series/123').
     * @param {Object} [params={}] Arbitrary data attached to this navigation.
     * @param {boolean} [replace=false] When true, replace the current history
     *                                 entry instead of pushing a new one.
     */
    navigate(path, params = {}, replace = false) {
      // Normalise — ensure leading slash.
      const normalised = path.startsWith('/') ? path : `/${path}`;
      this._currentPath = normalised;
      this._currentParams = params;

      // Update the URL hash and History API entry.
      const hash = `#${normalised}`;
      if (window.location.hash !== hash) {
        if (replace) {
          window.history.replaceState({ path: normalised, params }, '', hash);
        } else {
          window.history.pushState({ path: normalised, params }, '', hash);
        }
      }

      // Side-effects
      this._updateDocumentTitle();
      this._scrollToTop();
      this._updateActiveNav();
      this.emit('navigate', { path: normalised, params, route: this.getCurrentRoute() });
    }

    /**
     * Go back one step in the browser history stack.
     * If there is no previous entry, navigate to home.
     */
    back() {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        this.navigate('/');
      }
    }

    // -----------------------------------------------------------------------
    // Route accessors
    // -----------------------------------------------------------------------

    /**
     * Return the matched route definition for the current path, or null.
     *
     * @returns {Object|null}
     */
    getCurrentRoute() {
      return this._matchRoute(this._currentPath);
    }

    /**
     * Return the current path string.
     *
     * @returns {string}
     */
    getPath() {
      return this._currentPath;
    }

    /**
     * Return params associated with the most-recent navigation.
     *
     * @returns {Object}
     */
    getParams() {
      return { ...this._currentParams };
    }

    /**
     * Return the full route table.
     *
     * @returns {Object[]}
     */
    getRoutes() {
      return [...this._routes];
    }

    // -----------------------------------------------------------------------
    // Lifecycle
    // -----------------------------------------------------------------------

    /**
     * Initialise the router: read the current hash, start listening for
     * hashchange and popstate, and fire the initial navigation event.
     * Should be called once after DOMContentLoaded.
     */
    init() {
      if (this._started) return;
      this._started = true;

      // Read the initial hash (or default to home).
      const hash = window.location.hash.slice(1) || '/';
      this._currentPath = hash;

      // Restore params from History state if available.
      if (window.history.state && window.history.state.params) {
        this._currentParams = window.history.state.params;
      }

      // Listen for browser back/forward.
      window.addEventListener('popstate', (event) => {
        const state = event.state || {};
        const path = state.path || window.location.hash.slice(1) || '/';
        this._currentPath = path;
        this._currentParams = state.params || {};
        this._updateDocumentTitle();
        this._scrollToTop();
        this._updateActiveNav();
        this.emit('navigate', { path, params: this._currentParams, route: this.getCurrentRoute() });
      });

      // Also listen for hashchange as a safety net (e.g. manual hash edits).
      window.addEventListener('hashchange', () => {
        const path = window.location.hash.slice(1) || '/';
        if (path !== this._currentPath) {
          this._currentPath = path;
          this._updateDocumentTitle();
          this._scrollToTop();
          this._updateActiveNav();
          this.emit('navigate', { path, params: this._currentParams, route: this.getCurrentRoute() });
        }
      });

      // Fire initial navigation.
      this._updateDocumentTitle();
      this._updateActiveNav();
      this.emit('navigate', { path: this._currentPath, params: this._currentParams, route: this.getCurrentRoute() });
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    /**
     * Attempt to match a path against the route table.
     * Supports exact match and prefix match for parameterised routes.
     *
     * @private
     * @param {string} path
     * @returns {Object|null}
     */
    _matchRoute(path) {
      // Exact match first.
      const exact = this._routes.find((r) => r.path === path);
      if (exact) return { ...exact };

      // Prefix match — the first segment must match.
      const segments = path.split('/').filter(Boolean);
      for (const route of this._routes) {
        const routeSegments = route.path.split('/').filter(Boolean);
        if (routeSegments.length === 0 && segments.length === 0) return { ...route };
        if (routeSegments.length === 1 && segments.length >= 1 && segments[0] === routeSegments[0]) {
          return { ...route };
        }
      }

      return null;
    }

    /**
     * Update document.title to reflect the current route.
     *
     * @private
     */
    _updateDocumentTitle() {
      const route = this.getCurrentRoute();
      const appName = (window.HamadShow && window.HamadShow.Config)
        ? window.HamadShow.Config.DEFAULT_SETTINGS.appName
        : 'Hamad Show';
      document.title = route ? `${route.title} — ${appName}` : appName;
    }

    /**
     * Scroll the viewport back to the top.
     *
     * @private
     */
    _scrollToTop() {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      } catch {
        window.scrollTo(0, 0);
      }
    }

    /**
     * Highlight the active navigation item in the bottom/side nav bar.
     * Looks for elements with `data-route` attributes and toggles the
     * "active" CSS class.
     *
     * @private
     */
    _updateActiveNav() {
      const activePath = this._currentPath.split('/').filter(Boolean)[0] || '/';
      const navItems = document.querySelectorAll('[data-route]');

      for (const item of navItems) {
        const routePath = item.getAttribute('data-route') || '';
        const routeBase = routePath.split('/').filter(Boolean)[0] || '/';

        if (routeBase === activePath || `/${routeBase}` === this._currentPath) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Register on the global namespace
  // ---------------------------------------------------------------------------
  global[NAMESPACE] = global[NAMESPACE] || {};
  global[NAMESPACE].Router = Router;
})(window);