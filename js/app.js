/**
 * Hamad Show — Main Application Module
 * =======================================
 * The primary orchestrator that bootstraps every sub-module, manages the
 * splash screen, login flow, navigation, page rendering, and high-level
 * application state.
 *
 * Depends on ALL sibling modules:
 *   - HamadShow.Config
 *   - HamadShow.Utils
 *   - HamadShow.StorageManager
 *   - HamadShow.Router
 *   - HamadShow.API
 *   - HamadShow.Player
 *   - HamadShow.Search
 *   - HamadShow.Favorites
 *   - HamadShow.History
 *   - HamadShow.Notifications
 *   - HamadShow.Offline
 *   - HamadShow.Admin
 *
 * @namespace HamadShow.App
 * @module app
 */

(function (global) {
  'use strict';

  var NAMESPACE = 'HamadShow';

  // ---------------------------------------------------------------------------
  // Reference sibling modules
  // ---------------------------------------------------------------------------
  var Config         = global[NAMESPACE] && global[NAMESPACE].Config;
  var Utils          = global[NAMESPACE] && global[NAMESPACE].Utils;
  var StorageManager = global[NAMESPACE] && global[NAMESPACE].StorageManager;
  var Router         = global[NAMESPACE] && global[NAMESPACE].Router;
  var API            = global[NAMESPACE] && global[NAMESPACE].API;
  var Player         = global[NAMESPACE] && global[NAMESPACE].Player;
  var SearchManager  = global[NAMESPACE] && global[NAMESPACE].Search;
  var Favorites      = global[NAMESPACE] && global[NAMESPACE].Favorites;
  var History        = global[NAMESPACE] && global[NAMESPACE].History;
  var Notifications  = global[NAMESPACE] && global[NAMESPACE].Notifications;
  var Offline        = global[NAMESPACE] && global[NAMESPACE].Offline;
  var Admin          = global[NAMESPACE] && global[NAMESPACE].Admin;

  // ---------------------------------------------------------------------------
  // SVG Icon paths (inline SVG innerHTML for 24×24 viewBox)
  // ---------------------------------------------------------------------------
  var ICONS = {
    play:         '<polygon points="5,3 19,12 5,21"/>',
    pause:        '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>',
    home:         '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    movie:        '<rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/>',
    tv:           '<rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/>',
    search:       '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    heart:        '<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>',
    star:         '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    settings:     '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>',
    user:         '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    back:         '<polyline points="15 18 9 12 15 6"/>',
    bell:         '<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>',
    plus:         '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    close:        '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    check:        '<polyline points="20 6 9 17 4 12"/>',
    info:         '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    arrowUp:      '<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>',
    skipForward:  '<polygon points="5,4 15,12 5,20"/><line x1="19" y1="5" x2="19" y2="19"/>',
    skipBack:     '<polygon points="19,20 9,12 19,4"/><line x1="5" y1="19" x2="5" y2="5"/>',
    chevronRight: '<polyline points="9 18 15 12 9 6"/>',
  };

  /** Helper: build an inline SVG element string. */
  function svg(name, cls) {
    var size = (cls && cls.indexOf('sm') !== -1) ? ' width="16" height="16"' : ' width="24" height="24"';
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"' + size + (cls ? ' class="' + cls + '"' : '') + '>' + (ICONS[name] || '') + '</svg>';
  }

  // ---------------------------------------------------------------------------
  // App — class definition
  // ---------------------------------------------------------------------------

  /**
   * @classdesc
   * Main application orchestrator. Handles boot sequence, page routing,
   * rendering, login, and coordinates all sub-modules.
   *
   * @constructor
   */
  function App() {
    /** @private */ this._settings = {};
    /** @private */ this._isAuthenticated = false;
    /** @private */ this._demoMode = false;
    /** @private */ this._splashStartTime = 0;
    /** @private */ this._heroInterval = null;
    /** @private */ this._heroIndex = 0;
    /** @private */ this._routerInstance = null;
    /** @private */ this._apiInstance = null;
    /** @private */ this._playerInstance = null;
    /** @private */ this._searchInstance = null;
    /** @private */ this._favoritesInstance = null;
    /** @private */ this._historyInstance = null;
    /** @private */ this._notificationsInstance = null;
    /** @private */ this._offlineInstance = null;
    /** @private */ this._adminInstance = null;
    /** @private */ this._currentPage = '';
    /** @private */ this._currentCategory = null;
    /** @private */ this._favTabFilter = 'all';
    /** @private */ this._deferredInstallPrompt = null;
    /** @private */ this._moviesCache = [];
    /** @private */ this._seriesCache = [];
    /** @private */ this._channelsCache = [];
    /** @private */ this._firebaseInstance = null;
    /** @private */ this._loginBound = false;
  }

  // ===========================================================================
  //  SECTION 1 — INITIALIZATION
  // ===========================================================================

  /**
   * Master boot sequence. Called once on DOMContentLoaded.
   */
  App.prototype.init = function () {
    var self = this;
    self._splashStartTime = Date.now();

    // 1. Load config
    self._settings = Config.loadSettings();
    self._applyTheme(self._settings);
    // Apply language (default Arabic)
    var startLang = self._settings.language || 'ar';
    var isAr = startLang === 'ar';
    document.documentElement.setAttribute('dir', isAr ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', startLang);
    document.documentElement.style.setProperty('--font-primary', isAr
      ? "'Noto Sans Arabic', 'Inter', 'Segoe UI', system-ui, sans-serif"
      : "'Inter', 'Segoe UI', system-ui, sans-serif");
    document.documentElement.style.setProperty('--font-heading', isAr
      ? "'Noto Sans Arabic', 'Inter', 'Segoe UI', system-ui, sans-serif"
      : "'Inter', 'Segoe UI', system-ui, sans-serif");
    var headerApp = document.getElementById('header-app-name');
    if (headerApp) headerApp.textContent = isAr ? 'حمد شو' : 'Hamad Show';

    // 2. Show splash
    self._showSplash();
    self._updateSplashProgress(10);

    // 3. Initialise modules in order
    //    Storage
    if (StorageManager && typeof StorageManager.init === 'function') {
      // StorageManager has no explicit init, but we ensure it's available
    }
    self._updateSplashProgress(20);

    //    Router
    self._routerInstance = new Router();
    self._routerInstance.init();
    self._updateSplashProgress(30);

    //    Notifications
    self._notificationsInstance = new Notifications();
    self._notificationsInstance.init();

    //    Offline
    self._offlineInstance = new Offline();
    self._offlineInstance.init();

    //    History
    self._historyInstance = new History();
    self._historyInstance.init();

    //    Favorites
    self._favoritesInstance = new Favorites();
    self._favoritesInstance.init();

    //    Search
    self._searchInstance = new SearchManager();
    self._searchInstance.init();

    //    Player (container must be resolved BEFORE construction)
    var playerContainer = document.getElementById('player-container') || document.querySelector('.player-container');
    if (playerContainer) {
      self._playerInstance = new Player(playerContainer);
    } else {
      console.warn('[HamadShow] Player container not found — player disabled.');
      self._playerInstance = null;
    }

    //    Admin
    self._adminInstance = new Admin();
    self._adminInstance.init();

    //    Firebase
    var FirebaseDB = (global[NAMESPACE] && global[NAMESPACE].FirebaseDB) || null;
    if (FirebaseDB) {
      self._firebaseInstance = new FirebaseDB();
      self._firebaseInstance.init().then(function (ready) {
        if (ready) {
          console.info('[App] Firebase is ready.');

          // Listen for remote credential changes (admin updated them)
          self._firebaseInstance.on('credentialsChanged', function (creds) {
            if (creds && creds.serverUrl && creds.username && creds.password) {
              console.info('[App] Credentials updated from Firebase — reconnecting...');
              self._tryFirebaseLogin(creds);
            }
          });
        }
      });
    }

    self._updateSplashProgress(40);

    // 4. Listen for router navigation
    self._routerInstance.on('navigate', function (data) {
      self._handleNavigation(data.path, data.params);
    });

    // 5. Setup UI
    self._setupNavigation();
    self._setupScrollTop();
    self._setupNotificationPanel();
    self._setupPWAInstall();
    self._setupEventListeners();
    self._setupRippleEffects();

    self._updateSplashProgress(60);

    // 6. Check authentication
    self._checkAuth().then(function () {
      self._updateSplashProgress(100);

      // Enforce minimum 2s splash display
      var elapsed = Date.now() - self._splashStartTime;
      var remaining = Math.max(0, 2000 - elapsed);

      setTimeout(function () {
        self._hideSplash();

        // Navigate to initial route
        var initialPath = self._routerInstance.getPath() || '/';
        if (initialPath === '/' && self._isAuthenticated) {
          self._renderHomePage();
        } else if (!self._isAuthenticated && initialPath !== '/settings' && initialPath !== '/admin') {
          self._showLogin();
        } else {
          self._handleNavigation(initialPath, self._routerInstance.getParams());
        }

        // Re-apply ripple after DOM content settles
        setTimeout(function () { self._setupRippleEffects(); }, 300);
      }, remaining);
    }).catch(function () {
      self._updateSplashProgress(100);
      var elapsed = Date.now() - self._splashStartTime;
      var remaining = Math.max(0, 2000 - elapsed);
      setTimeout(function () {
        self._hideSplash();
        self._showLogin();
      }, remaining);
    });
  };

  /**
   * Check stored credentials and attempt silent authentication.
   * @private
   * @returns {Promise<boolean>}
   */
  App.prototype._checkAuth = function () {
    var self = this;
    return new Promise(function (resolve, reject) {

      // ── Priority 1: Try Firebase credentials ──
      if (self._firebaseInstance && self._firebaseInstance.isReady()) {
        self._firebaseInstance.getCredentials().then(function (fbCreds) {
          if (fbCreds && fbCreds.serverUrl && fbCreds.username && fbCreds.password) {
            console.info('[App] Found credentials in Firebase, attempting login...');
            self._tryFirebaseLogin(fbCreds).then(resolve).catch(function () {
              // Firebase creds failed, try local
              self._checkLocalAuth(resolve);
            });
          } else {
            // No Firebase creds, try local
            self._checkLocalAuth(resolve);
          }
        }).catch(function () {
          self._checkLocalAuth(resolve);
        });
        return;
      }

      // ── Priority 2: Try local storage credentials ──
      self._checkLocalAuth(resolve);
    });
  };

  /**
   * Try login using local stored credentials.
   * @private
   */
  App.prototype._checkLocalAuth = function (resolve) {
    var self = this;
    var settings = Config.loadSettings();
    var serverUrl = settings.serverUrl || '';
    var username  = settings.username || '';
    var password  = settings.password || '';

    if (!serverUrl || !username || !password) {
      self._isAuthenticated = false;
      self._demoMode = true;
      resolve(false);
      return;
    }

    var api = new API();
    self._apiInstance = api;

    api.login(serverUrl, username, password)
      .then(function (userInfo) {
        if (userInfo && (userInfo.auth === 1 || userInfo.username || userInfo.status === 'Active')) {
          self._isAuthenticated = true;
          self._demoMode = false;
          StorageManager.saveUser(userInfo);
          resolve(true);
        } else {
          self._isAuthenticated = false;
          self._demoMode = true;
          resolve(false);
        }
      })
      .catch(function () {
        console.warn('[App] Local auth failed; entering demo mode.');
        self._isAuthenticated = false;
        self._demoMode = true;
        resolve(false);
      });
  };

  /**
   * Try login using Firebase credentials (also saves locally as backup).
   * @private
   * @param {Object} creds - { serverUrl, username, password }
   * @returns {Promise<boolean>}
   */
  App.prototype._tryFirebaseLogin = function (creds) {
    var self = this;
    var api = self._apiInstance || new API();
    self._apiInstance = api;

    return api.login(creds.serverUrl, creds.username, creds.password)
      .then(function (userInfo) {
        if (userInfo && (userInfo.auth === 1 || userInfo.username || userInfo.status === 'Active')) {
          self._isAuthenticated = true;
          self._demoMode = false;
          StorageManager.saveUser(userInfo);

          // Also save locally as backup
          var settings = Config.loadSettings();
          settings.serverUrl = creds.serverUrl;
          settings.username  = creds.username;
          settings.password  = creds.password;
          Config.saveSettings(settings);
          self._settings = settings;

          // Show the app if login screen is visible
          document.getElementById('app').style.display = '';
          self._hideLogin();
          self._renderHomePage();
          self._showToast('Connected via Firebase!', 'success');

          return true;
        }
        return false;
      })
      .catch(function (err) {
        console.warn('[App] Firebase login failed:', err && err.message);
        return false;
      });
  };

  // ===========================================================================
  //  SECTION 2 — SPLASH SCREEN
  // ===========================================================================

  /**
   * Show the splash screen overlay with animated progress bar.
   * @private
   */
  App.prototype._showSplash = function () {
    var splash = document.getElementById('splash-screen');
    if (!splash) {
      splash = document.createElement('div');
      splash.id = 'splash-screen';
      splash.className = 'splash-screen';
      splash.innerHTML =
        '<div class="splash-logo">' + svg('movie') + '</div>' +
        '<div class="splash-app-name">' + Utils.sanitize(self._settings.appName || Config.DEFAULT_SETTINGS.appName) + '</div>' +
        '<div class="splash-loader"><div class="splash-loader-fill" id="splash-progress"></div></div>';
      document.body.prepend(splash);
    }
    splash.classList.remove('hiding');
    var progress = document.getElementById('splash-progress') || splash.querySelector('.splash-loader-fill');
    if (progress) progress.style.width = '0%';
  };

  /**
   * Hide the splash screen with a fade-out transition.
   * @private
   */
  App.prototype._hideSplash = function () {
    var splash = document.getElementById('splash-screen');
    if (!splash) return;
    splash.classList.add('hiding');
    setTimeout(function () {
      splash.style.display = 'none';
    }, 600);
  };

  /**
   * Update the splash progress bar to the given percentage.
   * @private
   * @param {number} percent  0–100
   */
  App.prototype._updateSplashProgress = function (percent) {
    var bar = document.getElementById('splash-progress');
    if (bar) bar.style.width = Math.min(percent, 100) + '%';
  };

  // ===========================================================================
  //  SECTION 3 — LOGIN SCREEN
  // ===========================================================================

  /**
   * Show the login overlay.
   * @private
   */
  App.prototype._showLogin = function () {
    var self = this;
    var existing = document.getElementById('login-screen');
    if (existing) { existing.classList.add('active'); }

    // ALWAYS bind the form submit handler (even if login screen already exists in HTML)
    if (!self._loginBound) {
      self._loginBound = true;
      setTimeout(function () {
        var form = document.getElementById('login-form');
        if (form) {
          form.addEventListener('submit', function (e) {
            e.preventDefault();
            self._handleLogin(e);
          });
          console.info('[App] Login form submit handler bound.');
        }
      }, 50);
    }

    if (existing) {
      // Prefill from local settings or Firebase cache
      var settings = Config.loadSettings();
      var serverInput = document.getElementById('login-server');
      var userInput   = document.getElementById('login-username');
      var passInput   = document.getElementById('login-password');
      if (serverInput && settings.serverUrl && !serverInput.value) serverInput.value = settings.serverUrl;
      if (userInput && settings.username && !userInput.value) userInput.value = settings.username;
      if (passInput && settings.password && !passInput.value) passInput.value = settings.password;
      return;
    }

    var el = document.createElement('div');
    el.id = 'login-screen';
    el.className = 'login-screen active';
    el.innerHTML =
      '<div class="login-bg"></div>' +
      '<div class="login-card">' +
        '<div class="login-logo">' +
          '<div class="logo-icon">' + svg('movie') + '</div>' +
          '<h2>' + Utils.sanitize(self._settings.appName || Config.DEFAULT_SETTINGS.appName) + '</h2>' +
          '<p>' + (self._t ? self._t('login_subtitle') : 'Sign in to start streaming') + '</p>' +
        '</div>' +
        '<form class="login-form" id="login-form" novalidate>' +
          '<div class="login-error" id="login-error">' + svg('close', 'sm') + '<span id="login-error-text"></span></div>' +
          '<div class="input-group">' +
            '<span class="input-icon">' + svg('tv', 'sm') + '</span>' +
            '<input type="url" class="input-field" id="login-server" placeholder="Server URL (e.g. http://example.com)" autocomplete="url" required>' +
          '</div>' +
          '<div class="input-group">' +
            '<span class="input-icon">' + svg('user', 'sm') + '</span>' +
            '<input type="text" class="input-field" id="login-username" placeholder="Username" autocomplete="username" required>' +
          '</div>' +
          '<div class="input-group">' +
            '<span class="input-icon">' + svg('search', 'sm') + '</span>' +
            '<input type="password" class="input-field" id="login-password" placeholder="Password" autocomplete="current-password" required>' +
          '</div>' +
          '<label class="login-remember">' +
            '<input type="checkbox" id="login-remember" checked>' +
            '<span>Remember me</span>' +
          '</label>' +
          '<button type="submit" class="btn btn-primary login-btn" id="login-btn">' +
            '<span class="btn-text">Sign In</span>' +
          '</button>' +
        '</form>' +
        '<div class="login-footer">Hamad Show IPTV &copy; ' + new Date().getFullYear() + '</div>' +
      '</div>';

    document.body.appendChild(el);

    // Prefill saved credentials
    var settings = Config.loadSettings();
    if (settings.serverUrl) document.getElementById('login-server').value = settings.serverUrl;
    if (settings.username)  document.getElementById('login-username').value = settings.username;
    if (settings.password)  document.getElementById('login-password').value = settings.password;

    // Allow demo mode bypass
    var footer = el.querySelector('.login-footer');
    var demoLink = document.createElement('button');
    demoLink.type = 'button';
    demoLink.className = 'btn btn-sm btn-glass';
    demoLink.style.cssText = 'margin-top:12px;width:100%;';
    demoLink.textContent = 'Continue in Demo Mode';
    demoLink.addEventListener('click', function () {
      self._demoMode = true;
      self._hideLogin();
      self._renderHomePage();
      self._showToast('Welcome to Demo Mode — explore the app with sample content!', 'info');
    });
    footer.parentNode.insertBefore(demoLink, footer.nextSibling);

    self._setupRippleEffects();
  };

  /**
   * Hide the login overlay.
   * @private
   */
  App.prototype._hideLogin = function () {
    var el = document.getElementById('login-screen');
    if (el) el.classList.remove('active');
  };

  /**
   * Handle login form submission.
   * @private
   * @param {Event} e
   */
  App.prototype._handleLogin = function (e) {
    e.preventDefault();
    var self = this;

    var server   = document.getElementById('login-server').value.trim();
    var username = document.getElementById('login-username').value.trim();
    var password = document.getElementById('login-password').value.trim();
    var remember = document.getElementById('login-remember').checked;
    var btn      = document.getElementById('login-btn');

    // Validate
    if (!server || !username || !password) {
      self._handleLoginError('Please fill in all fields.');
      return;
    }

    // Show loading state
    btn.classList.add('loading');
    btn.disabled = true;

    // Attempt authentication — use login() which takes server/user/pass directly
    var api = self._apiInstance || new API();
    self._apiInstance = api;

    api.login(server, username, password)
      .then(function (userInfo) {
        btn.classList.remove('loading');
        btn.disabled = false;

        // login() returns the sanitized user_info object directly
        if (userInfo && (userInfo.auth === 1 || userInfo.username)) {
          // Success
          self._isAuthenticated = true;
          self._demoMode = false;

          // Save credentials to local settings
          var settings = Config.loadSettings();
          settings.serverUrl = server;
          settings.username  = remember ? username : '';
          settings.password  = remember ? password : '';
          Config.saveSettings(settings);
          self._settings = settings;

          StorageManager.saveUser(userInfo);

          // Save credentials to Firebase (so all devices auto-connect)
          if (self._firebaseInstance && self._firebaseInstance.isReady()) {
            self._firebaseInstance.saveCredentials({
              serverUrl: server,
              username:  username,
              password:  password
            }).catch(function (err) {
              console.warn('[App] Firebase save failed (non-critical):', err && err.message);
            });
          }

          // Show the app
          document.getElementById('app').style.display = '';
          self._hideLogin();
          self._renderHomePage();
          self._showToast('Welcome back, ' + Utils.sanitize(userInfo.username || username) + '!', 'success');
        } else {
          self._handleLoginError('Invalid credentials. Please check your details and try again.');
        }
      })
      .catch(function (err) {
        btn.classList.remove('loading');
        btn.disabled = false;
        var msg = (err && err.message) ? err.message : 'Connection failed. Check your server URL.';
        self._handleLoginError(msg);
      });
  };

  /**
   * Display an error message in the login form.
   * @private
   * @param {string} message
   */
  App.prototype._handleLoginError = function (message) {
    var errBox  = document.getElementById('login-error');
    var errText = document.getElementById('login-error-text');
    if (errBox && errText) {
      errText.textContent = message;
      errBox.classList.add('visible');
      // Re-trigger animation
      errBox.style.animation = 'none';
      void errBox.offsetWidth; // force reflow
      errBox.style.animation = '';
      setTimeout(function () { errBox.classList.remove('visible'); }, 5000);
    }
  };

  // ===========================================================================
  //  SECTION 4 — NAVIGATION
  // ===========================================================================

  /**
   * Bind bottom-nav click handlers.
   * @private
   */
  App.prototype._setupNavigation = function () {
    var self = this;
    var navItems = document.querySelectorAll('.bottom-nav .nav-item');
    navItems.forEach(function (item) {
      item.addEventListener('click', function (e) {
        e.preventDefault();
        var page = item.getAttribute('data-page') || item.getAttribute('data-route') || 'home';
        self._routerInstance.navigate('/' + page);
      });
    });
  };

  /**
   * Handle navigation events from the router.
   * @private
   * @param {string} path
   * @param {Object} params
   */
  App.prototype._handleNavigation = function (path, params) {
    var self = this;
    self._stopHeroRotation();

    // Parse the page from the path
    var segments = path.replace(/^\/+|\/+$/g, '').split('/');
    var page = segments[0] || 'home';

    // Show/hide login guard for auth-required pages
    var authPages = ['movies', 'series', 'livetv', 'favorites', 'profile'];
    if (authPages.indexOf(page) !== -1 && !self._isAuthenticated && !self._demoMode) {
      self._showLogin();
      return;
    }

    // Show main UI
    self._hideLogin();

    // Update active nav
    self._updateActiveNav(page);

    // Render the appropriate page
    switch (page) {
      case 'home':
        self._renderHomePage();
        break;
      case 'movies':
        self._renderMoviesPage(params && params.categoryId);
        break;
      case 'series':
        self._renderSeriesPage();
        break;
      case 'livetv':
        self._renderLiveTVPage();
        break;
      case 'search':
        self._renderSearchPage();
        break;
      case 'favorites':
        self._renderFavoritesPage();
        break;
      case 'settings':
        self._renderSettingsPage();
        break;
      case 'profile':
        self._renderProfilePage();
        break;
      case 'movie':
        self._renderMovieDetail(segments[1]);
        break;
      case 'series-detail':
        self._renderSeriesDetail(segments[1]);
        break;
      case 'channel':
        self._renderChannelDetail(segments[1]);
        break;
      case 'admin':
        if (self._adminInstance && typeof self._adminInstance.show === 'function') {
          self._adminInstance.show();
        }
        break;
      default:
        self._renderHomePage();
    }

    self._currentPage = page;

    // Re-apply ripple effects to newly added elements
    setTimeout(function () { self._setupRippleEffects(); }, 100);
  };

  /**
   * Highlight the active navigation item.
   * @private
   * @param {string} page
   */
  App.prototype._updateActiveNav = function (page) {
    var navItems = document.querySelectorAll('.bottom-nav .nav-item');
    navItems.forEach(function (item) {
      var navPage = item.getAttribute('data-page') || item.getAttribute('data-route') || '';
      var navBase = navPage.replace(/^\/+|\/+$/g, '').split('/')[0] || 'home';
      if (navBase === page || (page === 'home' && navBase === '')) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  };

  // ===========================================================================
  //  SECTION 5 — PAGE RENDERING: HOME
  // ===========================================================================

  /**
   * Render the home page with hero banner and content sections.
   * @private
   */
  App.prototype._renderHomePage = function () {
    var self = this;
    var container = document.getElementById('main-content') || document.querySelector('.main-content');
    if (!container) return;

    container.innerHTML =
      '<div class="home-page page active" id="page-home">' +
        '<div id="hero-section" class="hero-section"></div>' +
        '<div id="home-sections"></div>' +
      '</div>';

    // Render hero + sections
    if (self._demoMode) {
      self._renderHeroBanner(self._getDemoHeroItems());
      self._renderHomeSectionsDemo();
    } else {
      self._loadAndRenderHome();
    }

    self._setupRippleEffects();
    self._lazyLoadImages();
  };

  /**
   * Load API data and render home page content.
   * @private
   */
  App.prototype._loadAndRenderHome = function () {
    var self = this;
    var sectionsEl = document.getElementById('home-sections');
    if (!sectionsEl) return;

    // Show skeletons initially
    sectionsEl.innerHTML =
      self._buildSectionSkeleton(self._t('trending_now')) +
      self._buildSectionSkeleton(self._t('recently_added')) +
      self._buildSectionSkeleton(self._t('popular_series')) +
      self._buildSectionSkeleton(self._t('live_channels'));

    // Fetch data in parallel
    var heroPromise = self._fetchHeroItems();
    var moviesPromise = self._fetchMovies();
    var seriesPromise = self._fetchSeries();
    var channelsPromise = self._fetchChannels();

    Promise.all([heroPromise, moviesPromise, seriesPromise, channelsPromise])
      .then(function (results) {
        var heroItems = results[0];
        var movies    = results[1];
        var series    = results[2];
        var channels  = results[3];

        self._moviesCache    = movies || [];
        self._seriesCache    = series || [];
        self._channelsCache  = channels || [];

        self._renderHeroBanner(heroItems || self._getDemoHeroItems());
        self._buildHomeSections(movies, series, channels);
      })
      .catch(function () {
        // Fallback to demo data
        self._renderHeroBanner(self._getDemoHeroItems());
        self._renderHomeSectionsDemo();
      });
  };

  /**
   * Fetch hero items from the API.
   * @private
   * @returns {Promise<Array>}
   */
  App.prototype._fetchHeroItems = function () {
    var self = this;
    if (!self._apiInstance) return Promise.resolve([]);
    return self._apiInstance.getMovies()
      .then(function (streams) {
        // Pick 5 high-rated items
        var sorted = (streams || []).sort(function (a, b) { return (b.rating || 0) - (a.rating || 0); });
        return sorted.slice(0, 5).map(function (s) {
          return {
            id: s.stream_id,
            name: s.name || 'Untitled',
            poster: self._getImageUrl(s.stream_icon),
            backdrop: self._getImageUrl(s.stream_icon),
            rating: s.rating || null,
            year: s.year || '',
            genre: s.category_id || '',
            duration: s.container_extension || '',
            description: s.plot || s.name || '',
            type: 'movie',
          };
        });
      })
      .catch(function () { return []; });
  };

  /**
   * Fetch movies from the API.
   * @private
   * @returns {Promise<Array>}
   */
  App.prototype._fetchMovies = function () {
    var self = this;
    if (!self._apiInstance) return Promise.resolve([]);
    return self._apiInstance.getMovies()
      .then(function (streams) {
        self._moviesRawCache = streams || [];
        return self._moviesRawCache.map(function (s) {
          return {
            id: s.stream_id,
            name: s.name || 'Untitled',
            poster: self._getImageUrl(s.stream_icon),
            backdrop: self._getImageUrl(s.stream_icon),
            rating: s.rating || null,
            year: s.year || '',
            genre: s.category_id || '',
            duration: s.duration || '',
            description: s.plot || '',
            type: 'movie',
            containerExtension: s.container_extension || 'mp4',
            streamType: s.container_extension || 'mp4',
          };
        });
      })
      .catch(function () { return []; });
  };

  /**
   * Fetch series from the API.
   * @private
   * @returns {Promise<Array>}
   */
  App.prototype._fetchSeries = function () {
    var self = this;
    if (!self._apiInstance) return Promise.resolve([]);
    return self._apiInstance.getSeries()
      .then(function (items) {
        self._seriesRawCache = items || [];
        return self._seriesRawCache.map(function (s) {
          return {
            id: s.series_id || s.stream_id,
            name: s.name || 'Untitled',
            poster: self._getImageUrl(s.cover),
            rating: s.rating || null,
            year: s.year || '',
            genre: s.category_id || '',
            description: s.plot || '',
            type: 'series',
          };
        });
      })
      .catch(function () { return []; });
  };

  /**
   * Fetch live channels from the API.
   * @private
   * @returns {Promise<Array>}
   */
  App.prototype._fetchChannels = function () {
    var self = this;
    if (!self._apiInstance) return Promise.resolve([]);
    return self._apiInstance.getLiveStreams()
      .then(function (streams) {
        self._channelsRawCache = streams || [];
        return self._channelsRawCache.map(function (s) {
          return {
            id: s.stream_id,
            name: s.name || 'Untitled',
            poster: self._getImageUrl(s.stream_icon),
            rating: null,
            year: '',
            genre: s.category_id || '',
            type: 'live',
            epgChannelId: s.epg_channel_id || '',
          };
        });
      })
      .catch(function () { return []; });
  };

  /**
   * Build the full home page sections from API data.
   * @private
   * @param {Array} movies
   * @param {Array} series
   * @param {Array} channels
   */
  App.prototype._buildHomeSections = function (movies, series, channels) {
    var self = this;
    var el = document.getElementById('home-sections');
    if (!el) return;
    var html = '';

    // Continue Watching
    var continueItems = self._historyInstance ? self._historyInstance.getContinueWatching() : [];
    if (continueItems.length > 0) {
      html += self._buildScrollSection(self._t('continue_watching'), '/profile', continueItems, 'wide');
    }

    // Trending
    var trending = movies.slice(0, 15);
    if (trending.length > 0) {
      html += self._buildScrollSection(self._t('trending_now'), '/movies', trending, 'poster');
    }

    // Recently Added Movies
    var recentMovies = movies.slice().reverse().slice(0, 15);
    if (recentMovies.length > 0) {
      html += self._buildScrollSection(self._t('recently_added'), '/movies', recentMovies, 'poster');
    }

    // Popular Series
    if (series.length > 0) {
      html += self._buildScrollSection(self._t('popular_series'), '/series', series.slice(0, 15), 'poster');
    }

    // Live Channels
    if (channels.length > 0) {
      html += self._buildChannelSection(self._t('live_channels'), '/livetv', channels.slice(0, 20));
    }

    // Sports channels (try to filter)
    var sports = channels.filter(function (c) {
      var name = (c.name || '').toLowerCase();
      return name.indexOf('sport') !== -1;
    });
    if (sports.length > 0) {
      html += self._buildChannelSection(self._t('sports'), '/livetv', sports.slice(0, 15));
    }

    // Kids content (filter by name)
    var kids = movies.concat(series).filter(function (c) {
      var name = (c.name || '').toLowerCase();
      return name.indexOf('kid') !== -1 || name.indexOf('cartoon') !== -1 || name.indexOf('animation') !== -1;
    });
    if (kids.length > 0) {
      html += self._buildScrollSection(self._t('kids'), '/movies', kids.slice(0, 15), 'poster');
    }

    // Arabic content
    var arabic = movies.concat(series).filter(function (c) {
      var name = (c.name || '').toLowerCase();
      return name.indexOf('arab') !== -1 || name.indexOf('埃及') !== -1 || name.indexOf('ال') !== -1;
    });
    if (arabic.length > 0) {
      html += self._buildScrollSection(self._t('arabic_content'), '/movies', arabic.slice(0, 15), 'poster');
    }

    // English content
    var english = movies.concat(series).filter(function (c) {
      var name = (c.name || '').toLowerCase();
      return /^[a-z]/.test(name);
    });
    if (english.length > 0) {
      html += self._buildScrollSection(self._t('english_content'), '/movies', english.slice(0, 15), 'poster');
    }

    // Recommended (random selection)
    var all = movies.concat(series);
    var recommended = all.sort(function () { return 0.5 - Math.random(); }).slice(0, 15);
    if (recommended.length > 0) {
      html += self._buildScrollSection(self._t('recommended'), '/movies', recommended, 'poster');
    }

    el.innerHTML = html || '<div class="empty-state" style="padding-top:60px;">' + svg('movie') + '<p class="empty-title" style="margin-top:16px;">No content available</p></div>';
    self._lazyLoadImages();
    self._setupRippleEffects();
  };

  /**
   * Build home sections using demo data.
   * @private
   */
  App.prototype._renderHomeSectionsDemo = function () {
    var self = this;
    var el = document.getElementById('home-sections');
    if (!el) return;

    var movies   = self._getDemoMovies();
    var series   = self._getDemoSeries();
    var channels = self._getDemoChannels();

    self._buildHomeSections(movies, series, channels);
  };

  /**
   * Build a skeleton placeholder for a section.
   * @private
   * @param {string} title
   * @returns {string} HTML
   */
  App.prototype._buildSectionSkeleton = function (title) {
    return '<div class="section">' +
      '<div class="section-header"><h2 class="section-title">' + Utils.sanitize(title) + '</h2></div>' +
      '<div class="scroll-row">' +
        '<div class="skeleton-card" style="flex:0 0 140px;">' +
          '<div class="skeleton-poster skeleton-shimmer"></div>' +
          '<div class="skeleton-text skeleton-shimmer"></div>' +
          '<div class="skeleton-text short skeleton-shimmer"></div>' +
        '</div>'.repeat(6) +
      '</div>' +
    '</div>';
  };

  /**
   * Build a horizontal scroll section with content cards.
   * @private
   * @param {string} title
   * @param {string} seeAllRoute
   * @param {Array} items
   * @param {string} cardType  'poster' or 'wide'
   * @returns {string} HTML
   */
  App.prototype._buildScrollSection = function (title, seeAllRoute, items, cardType) {
    var self = this;
    var wideClass = cardType === 'wide' ? ' wide' : '';
    var cardsHtml = items.map(function (item) {
      return self._createContentCard(item, item.type || 'movie', cardType === 'wide');
    }).join('');

    return '<div class="section">' +
      '<div class="section-header">' +
        '<h2 class="section-title">' + Utils.sanitize(title) + '</h2>' +
        '<a class="section-link" href="#' + seeAllRoute + '">' + self._t('see_all') + ' ' + svg('chevronRight', 'sm') + '</a>' +
      '</div>' +
      '<div class="scroll-row' + wideClass + '">' + cardsHtml + '</div>' +
    '</div>';
  };

  /**
   * Build a horizontal scroll section with channel cards.
   * @private
   * @param {string} title
   * @param {string} seeAllRoute
   * @param {Array} channels
   * @returns {string} HTML
   */
  App.prototype._buildChannelSection = function (title, seeAllRoute, channels) {
    var self = this;
    var cardsHtml = channels.map(function (ch) {
      return self._createChannelCard(ch);
    }).join('');

    return '<div class="section">' +
      '<div class="section-header">' +
        '<h2 class="section-title">' + Utils.sanitize(title) + '</h2>' +
        '<a class="section-link" href="#' + seeAllRoute + '">See All ' + svg('chevronRight', 'sm') + '</a>' +
      '</div>' +
      '<div class="scroll-row">' + cardsHtml + '</div>' +
    '</div>';
  };

  // ===========================================================================
  //  SECTION 6 — HERO BANNER
  // ===========================================================================

  /**
   * Render the hero banner with auto-rotation.
   * @private
   * @param {Array} items
   */
  App.prototype._renderHeroBanner = function (items) {
    var self = this;
    var container = document.getElementById('hero-section');
    if (!container || !items || items.length === 0) {
      if (container) container.innerHTML = '';
      return;
    }

    self._heroIndex = 0;
    self._heroItems = items;

    self._renderHeroSlide(0);

    // Auto-rotate every 8 seconds
    self._heroInterval = setInterval(function () {
      self._heroIndex = (self._heroIndex + 1) % items.length;
      self._renderHeroSlide(self._heroIndex);
    }, 8000);
  };

  /**
   * Stop the hero banner auto-rotation.
   * @private
   */
  App.prototype._stopHeroRotation = function () {
    if (this._heroInterval) {
      clearInterval(this._heroInterval);
      this._heroInterval = null;
    }
  };

  /**
   * Render a single hero slide.
   * @private
   * @param {number} index
   */
  App.prototype._renderHeroSlide = function (index) {
    var self = this;
    var items = self._heroItems || [];
    var item = items[index];
    if (!item) return;

    var container = document.getElementById('hero-section');
    if (!container) return;

    var isFav = self._favoritesInstance && self._favoritesInstance.isFavorite(item.id, item.type || 'movie');
    var gradient = Utils.getGradientColor(item.type || 'movie');
    var badgeText = index === 0 ? 'TRENDING' : 'FEATURED';
    var rating = item.rating ? Number(item.rating).toFixed(1) : 'N/A';
    var year = item.year || '2024';
    var duration = item.duration ? Utils.formatDuration(Number(item.duration)) : '';

    // Build indicator dots
    var dotsHtml = items.map(function (_, i) {
      return '<span class="dot' + (i === index ? ' active' : '') + '" data-hero-index="' + i + '"></span>';
    }).join('');

    var bgImage = item.backdrop || item.poster || '';
    var bgStyle = bgImage
      ? 'background-image: url(' + Utils.sanitize(bgImage) + ');'
      : 'background: ' + gradient + ';';

    container.innerHTML =
      '<div class="hero-banner">' +
        '<div class="hero-bg" style="' + bgStyle + '"></div>' +
        '<div class="hero-gradient"></div>' +
        '<div class="hero-content">' +
          '<span class="hero-badge">' + badgeText + '</span>' +
          '<h1 class="hero-title">' + Utils.sanitize(item.name) + '</h1>' +
          '<p class="hero-desc">' + Utils.truncate(Utils.sanitize(item.description || ''), 150) + '</p>' +
          '<div class="hero-meta">' +
            '<span class="rating">' + svg('star', 'sm') + ' ' + rating + '</span>' +
            '<span>' + year + '</span>' +
            (duration ? '<span>' + duration + '</span>' : '') +
          '</div>' +
          '<div class="hero-actions">' +
            '<button class="btn btn-primary btn-lg hero-play-btn" data-id="' + item.id + '" data-type="' + (item.type || 'movie') + '">' + svg('play') + ' ' + (self._t('play_now') || 'شاهد الآن') + '</button>' +
            '<button class="btn btn-secondary hero-fav-btn' + (isFav ? ' active' : '') + '" data-fav-id="' + item.id + '" data-fav-type="' + (item.type || 'movie') + '" data-fav-name="' + Utils.sanitize(item.name) + '" data-fav-poster="' + Utils.sanitize(item.poster || '') + '">' +
              (isFav ? svg('heart') : svg('heart')) + '</button>' +
            '<button class="btn btn-glass hero-info-btn" data-info-id="' + item.id + '" data-info-type="' + (item.type || 'movie') + '">' + svg('info') + '</button>' +
          '</div>' +
        '</div>' +
        '<div class="hero-indicators">' + dotsHtml + '</div>' +
      '</div>';

    // Bind dot clicks
    container.querySelectorAll('.hero-indicators .dot').forEach(function (dot) {
      dot.addEventListener('click', function () {
        var idx = parseInt(dot.getAttribute('data-hero-index'), 10);
        if (!isNaN(idx)) {
          self._heroIndex = idx;
          self._renderHeroSlide(idx);
          // Reset interval
          clearInterval(self._heroInterval);
          self._heroInterval = setInterval(function () {
            self._heroIndex = (self._heroIndex + 1) % items.length;
            self._renderHeroSlide(self._heroIndex);
          }, 8000);
        }
      });
    });

    // Bind play button
    var playBtn = container.querySelector('.hero-play-btn');
    if (playBtn) {
      playBtn.addEventListener('click', function () {
        var id = playBtn.getAttribute('data-id');
        var type = playBtn.getAttribute('data-type');
        if (type === 'live') {
          self._openPlayerForChannel(id);
        } else if (type === 'series') {
          self._routerInstance.navigate('/series-detail/' + id);
        } else {
          self._routerInstance.navigate('/movie/' + id);
        }
      });
    }

    // Bind favorite button
    var favBtn = container.querySelector('.hero-fav-btn');
    if (favBtn) {
      favBtn.addEventListener('click', function () {
        var id = favBtn.getAttribute('data-fav-id');
        var type = favBtn.getAttribute('data-fav-type');
        var name = favBtn.getAttribute('data-fav-name');
        var poster = favBtn.getAttribute('data-fav-poster');
        if (self._favoritesInstance) {
          var nowFav = self._favoritesInstance.toggle({ id: id, type: type, name: name, poster: poster });
          favBtn.classList.toggle('active', nowFav);
          self._showToast(nowFav ? (self._t('added_favorites') || 'تمت الإضافة للمفضلة') : (self._t('removed_favorites') || 'تمت الإزالة من المفضلة'), nowFav ? 'success' : 'info');
        }
      });
    }

    // Bind info button
    var infoBtn = container.querySelector('.hero-info-btn');
    if (infoBtn) {
      infoBtn.addEventListener('click', function () {
        var id = infoBtn.getAttribute('data-info-id');
        var type = infoBtn.getAttribute('data-info-type');
        if (type === 'series') {
          self._routerInstance.navigate('/series-detail/' + id);
        } else {
          self._routerInstance.navigate('/movie/' + id);
        }
      });
    }

    self._setupRippleEffects();
  };

  // ===========================================================================
  //  SECTION 7 — PAGE RENDERING: MOVIES
  // ===========================================================================

  /**
   * Render the movies page with category filters and grid.
   * @private
   * @param {string} [categoryId]
   */
  App.prototype._renderMoviesPage = function (categoryId) {
    var self = this;
    var container = document.getElementById('main-content') || document.querySelector('.main-content');
    if (!container) return;

    self._currentCategory = categoryId || null;

    var movies = self._demoMode ? self._getDemoMovies() : self._moviesCache;

    // Generate unique categories from items
    var categoryMap = {};
    movies.forEach(function (m) {
      var catId = m.genre || m.category_id || 'all';
      if (!categoryMap[catId]) categoryMap[catId] = { id: catId, name: catId, count: 0 };
      categoryMap[catId].count++;
    });
    var categories = Object.values(categoryMap);

    var chipsHtml = '<button class="chip active" data-cat="all">All</button>' +
      categories.map(function (c) {
        return '<button class="chip' + (self._currentCategory === c.id ? ' active' : '') + '" data-cat="' + Utils.sanitize(c.id) + '">' + Utils.sanitize(c.name) + '</button>';
      }).join('');

    var sorted = self._sortItems(movies, 'az');
    var gridHtml = sorted.map(function (m) {
      return self._createContentCard(m, 'movie', false);
    }).join('');

    container.innerHTML =
      '<div class="movies-page page active" id="page-movies">' +
        '<div class="page-header">' +
          '<h1>' + self._t('movies') + '</h1>' +
          '<select class="chip sort-select" id="movies-sort" style="appearance:auto;padding-right:12px;">' +
            '<option value="az">A — Z</option>' +
            '<option value="za">Z — A</option>' +
            '<option value="rating">Rating</option>' +
            '<option value="year">Year</option>' +
            '<option value="recent">Recently Added</option>' +
          '</select>' +
        '</div>' +
        '<div class="filters-row" id="movies-filters">' + chipsHtml + '</div>' +
        '<div class="content-grid" id="movies-grid">' + gridHtml + '</div>' +
        '<div id="movies-load-more" style="text-align:center;padding:20px;">' +
          '<button class="btn btn-secondary btn-sm" id="movies-more-btn">Load More</button>' +
        '</div>' +
      '</div>';

    // Bind filter chips
    container.querySelectorAll('#movies-filters .chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        container.querySelectorAll('#movies-filters .chip').forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        self._currentCategory = chip.getAttribute('data-cat');
        self._filterAndRenderMovies();
      });
    });

    // Bind sort
    var sortSelect = document.getElementById('movies-sort');
    if (sortSelect) {
      sortSelect.addEventListener('change', function () {
        self._filterAndRenderMovies();
      });
    }

    self._setupRippleEffects();
    self._lazyLoadImages();
  };

  /**
   * Filter and re-render the movies grid.
   * @private
   */
  App.prototype._filterAndRenderMovies = function () {
    var self = this;
    var movies = self._demoMode ? self._getDemoMovies() : self._moviesCache;
    var sortVal = (document.getElementById('movies-sort') || {}).value || 'az';

    if (self._currentCategory && self._currentCategory !== 'all') {
      movies = movies.filter(function (m) { return String(m.genre || m.category_id) === String(self._currentCategory); });
    }

    movies = self._sortItems(movies, sortVal);

    var grid = document.getElementById('movies-grid');
    if (grid) {
      grid.innerHTML = movies.map(function (m) {
        return self._createContentCard(m, 'movie', false);
      }).join('');
      self._lazyLoadImages();
      self._setupRippleEffects();
    }
  };

  // ===========================================================================
  //  SECTION 8 — PAGE RENDERING: SERIES
  // ===========================================================================

  /**
   * Render the series page.
   * @private
   */
  App.prototype._renderSeriesPage = function () {
    var self = this;
    var container = document.getElementById('main-content') || document.querySelector('.main-content');
    if (!container) return;

    var series = self._demoMode ? self._getDemoSeries() : self._seriesCache;

    var categoryMap = {};
    series.forEach(function (s) {
      var catId = s.genre || s.category_id || 'all';
      if (!categoryMap[catId]) categoryMap[catId] = { id: catId, name: catId, count: 0 };
      categoryMap[catId].count++;
    });
    var categories = Object.values(categoryMap);

    var chipsHtml = '<button class="chip active" data-cat="all">All</button>' +
      categories.map(function (c) {
        return '<button class="chip" data-cat="' + Utils.sanitize(c.id) + '">' + Utils.sanitize(c.name) + '</button>';
      }).join('');

    var sorted = self._sortItems(series, 'az');
    var gridHtml = sorted.map(function (s) {
      return self._createContentCard(s, 'series', false);
    }).join('');

    container.innerHTML =
      '<div class="series-page page active" id="page-series">' +
        '<div class="page-header">' +
          '<h1>' + self._t('series') + '</h1>' +
          '<select class="chip sort-select" id="series-sort" style="appearance:auto;padding-right:12px;">' +
            '<option value="az">A — Z</option>' +
            '<option value="za">Z — A</option>' +
            '<option value="rating">Rating</option>' +
            '<option value="year">Year</option>' +
          '</select>' +
        '</div>' +
        '<div class="filters-row" id="series-filters">' + chipsHtml + '</div>' +
        '<div class="content-grid" id="series-grid">' + gridHtml + '</div>' +
      '</div>';

    // Bind filter chips
    container.querySelectorAll('#series-filters .chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        container.querySelectorAll('#series-filters .chip').forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        var catId = chip.getAttribute('data-cat');
        var filtered = catId === 'all' ? series : series.filter(function (s) { return String(s.genre || s.category_id) === catId; });
        var sortVal = (document.getElementById('series-sort') || {}).value || 'az';
        filtered = self._sortItems(filtered, sortVal);
        var grid = document.getElementById('series-grid');
        if (grid) grid.innerHTML = filtered.map(function (s) { return self._createContentCard(s, 'series', false); }).join('');
        self._lazyLoadImages();
        self._setupRippleEffects();
      });
    });

    var sortSelect = document.getElementById('series-sort');
    if (sortSelect) {
      sortSelect.addEventListener('change', function () {
        sortVal = sortSelect.value;
        var sorted2 = self._sortItems(series, sortVal);
        var grid = document.getElementById('series-grid');
        if (grid) grid.innerHTML = sorted2.map(function (s) { return self._createContentCard(s, 'series', false); }).join('');
        self._lazyLoadImages();
        self._setupRippleEffects();
      });
    }

    self._setupRippleEffects();
    self._lazyLoadImages();
  };

  // ===========================================================================
  //  SECTION 9 — PAGE RENDERING: LIVE TV
  // ===========================================================================

  /**
   * Render the live TV page.
   * @private
   */
  App.prototype._renderLiveTVPage = function () {
    var self = this;
    var container = document.getElementById('main-content') || document.querySelector('.main-content');
    if (!container) return;

    var channels = self._demoMode ? self._getDemoChannels() : self._channelsCache;

    var categoryMap = {};
    channels.forEach(function (ch) {
      var catId = ch.genre || ch.category_id || 'all';
      if (!categoryMap[catId]) categoryMap[catId] = { id: catId, name: catId, count: 0 };
      categoryMap[catId].count++;
    });
    var categories = Object.values(categoryMap);

    var chipsHtml = '<button class="chip active" data-cat="all">All</button>' +
      categories.map(function (c) {
        return '<button class="chip" data-cat="' + Utils.sanitize(c.id) + '">' + Utils.sanitize(c.name) + '</button>';
      }).join('');

    var gridHtml = channels.map(function (ch) {
      return self._createChannelCard(ch);
    }).join('');

    container.innerHTML =
      '<div class="livetv-page page active" id="page-livetv">' +
        '<div class="page-header">' +
          '<h1>' + self._t('live_tv') + '</h1>' +
        '</div>' +
        '<div class="filters-row" id="livetv-filters">' + chipsHtml + '</div>' +
        '<div class="content-grid" id="livetv-grid" style="grid-template-columns:repeat(auto-fill,minmax(100px,1fr));">' + gridHtml + '</div>' +
      '</div>';

    // Bind filter chips
    container.querySelectorAll('#livetv-filters .chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        container.querySelectorAll('#livetv-filters .chip').forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        var catId = chip.getAttribute('data-cat');
        var filtered = catId === 'all' ? channels : channels.filter(function (ch) { return String(ch.genre || ch.category_id) === catId; });
        var grid = document.getElementById('livetv-grid');
        if (grid) grid.innerHTML = filtered.map(function (ch) { return self._createChannelCard(ch); }).join('');
        self._lazyLoadImages();
        self._setupRippleEffects();
      });
    });

    self._setupRippleEffects();
    self._lazyLoadImages();
  };

  // ===========================================================================
  //  SECTION 10 — PAGE RENDERING: SEARCH
  // ===========================================================================

  /**
   * Render the search page.
   * @private
   */
  App.prototype._renderSearchPage = function () {
    var self = this;
    var container = document.getElementById('main-content') || document.querySelector('.main-content');
    if (!container) return;

    var recentSearches = StorageManager.getRecentSearches(8) || [];
    var recentChipsHtml = recentSearches.map(function (term) {
      return '<button class="chip recent-search-chip" data-term="' + Utils.sanitize(term) + '">' +
        Utils.sanitize(term) +
        '<span class="chip-remove" data-clear-term="' + Utils.sanitize(term) + '">' + svg('close', 'sm') + '</span>' +
      '</button>';
    }).join('');

    container.innerHTML =
      '<div class="search-page page active" id="page-search">' +
        '<div class="search-bar">' +
          '<div class="search-input-wrapper">' +
            '<span class="search-icon-left">' + svg('search') + '</span>' +
            '<input type="text" class="search-input search-input" id="search-input" placeholder="Search movies, series, channels..." autocomplete="off">' +
            '<button class="voice-search-btn voice-search-btn" id="voice-search-btn" type="button">' + svg('settings', 'sm') + '</button>' +
            '<button class="search-clear-btn" id="search-clear" type="button">' + svg('close', 'sm') + '</button>' +
          '</div>' +
        '</div>' +
        '<div class="search-filter-row">' +
          '<select class="chip" id="search-filter-genre"><option value="">Genre</option><option value="action">Action</option><option value="comedy">Comedy</option><option value="drama">Drama</option><option value="horror">Horror</option><option value="scifi">Sci-Fi</option></select>' +
          '<select class="chip" id="search-filter-year"><option value="">Year</option>' +
            (function () { var y = new Date().getFullYear(); var opts = ''; for (var i = y; i >= y - 20; i--) opts += '<option value="' + i + '">' + i + '</option>'; return opts; })() +
          '</select>' +
          '<select class="chip" id="search-filter-lang"><option value="">Language</option><option value="en">English</option><option value="ar">Arabic</option><option value="fr">French</option><option value="es">Spanish</option></select>' +
        '</div>' +
        '<div id="recent-searches" class="recent-searches" style="padding:8px 16px;">' +
          (recentChipsHtml ? '<p class="recent-searches-label" style="font-size:var(--fs-sm);color:var(--text-tertiary);margin-bottom:8px;">Recent Searches</p><div style="display:flex;flex-wrap:wrap;gap:8px;">' + recentChipsHtml + '</div>' : '') +
        '</div>' +
        '<div id="search-results" class="search-results-grid"></div>' +
      '</div>';

    // Bind search input
    var searchInput = document.getElementById('search-input');
    var clearBtn = document.getElementById('search-clear');
    var resultsContainer = document.getElementById('search-results');

    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce(function () {
        var query = searchInput.value.trim();
        if (clearBtn) clearBtn.classList.toggle('visible', query.length > 0);
        if (!query) {
          resultsContainer.innerHTML = '';
          return;
        }
        self._performSearch(query);
      }, 300));

      searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          var query = searchInput.value.trim();
          if (query) {
            StorageManager.addRecentSearch(query);
            self._performSearch(query);
          }
        }
      });

      // Focus input after render
      setTimeout(function () { searchInput.focus(); }, 100);
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        if (searchInput) searchInput.value = '';
        clearBtn.classList.remove('visible');
        if (resultsContainer) resultsContainer.innerHTML = '';
      });
    }

    // Bind voice search
    var voiceBtn = document.getElementById('voice-search-btn');
    if (voiceBtn) {
      voiceBtn.addEventListener('click', function () {
        if (self._searchInstance) self._searchInstance.voiceSearch();
      });
    }

    // Bind recent search chips
    container.querySelectorAll('.recent-search-chip').forEach(function (chip) {
      chip.addEventListener('click', function (e) {
        if (e.target.closest('.chip-remove')) {
          var term = e.target.closest('.chip-remove').getAttribute('data-clear-term');
          var all = StorageManager.getSearchHistory().filter(function (t) { return t !== term; });
          StorageManager.saveSearchHistory(all);
          chip.remove();
          return;
        }
        var term = chip.getAttribute('data-term');
        if (searchInput) searchInput.value = term;
        self._performSearch(term);
      });
    });

    self._setupRippleEffects();
  };

  /**
   * Perform a search (demo mode or API).
   * @private
   * @param {string} query
   */
  App.prototype._performSearch = function (query) {
    var self = this;
    var resultsContainer = document.getElementById('search-results');
    if (!resultsContainer) return;

    resultsContainer.innerHTML = '<div style="text-align:center;padding:40px;"><div class="spinner"></div></div>';

    if (self._apiInstance && !self._demoMode) {
      self._apiInstance.search(query)
        .then(function (results) {
          self._renderSearchResults(results || {});
        })
        .catch(function () {
          self._renderSearchResultsDemo(query);
        });
    } else {
      setTimeout(function () {
        self._renderSearchResultsDemo(query);
      }, 400);
    }
  };

  /**
   * Render search results from API.
   * @private
   * @param {Object} results
   */
  App.prototype._renderSearchResults = function (results) {
    var self = this;
    var el = document.getElementById('search-results');
    if (!el) return;

    var items = [];
    (results.movies || []).forEach(function (m) {
      items.push({ id: m.stream_id, type: 'movie', name: m.name, poster: m.stream_icon, rating: m.rating, year: m.year, genre: m.category_id });
    });
    (results.series || []).forEach(function (s) {
      items.push({ id: s.series_id || s.stream_id, type: 'series', name: s.name, poster: s.cover, rating: s.rating, year: s.year, genre: s.category_id });
    });
    (results.live || []).forEach(function (l) {
      items.push({ id: l.stream_id, type: 'live', name: l.name, poster: l.stream_icon, genre: l.category_id });
    });

    if (items.length === 0) {
      el.innerHTML = '<div class="empty-state">' + svg('search') + '<p class="empty-title" style="margin-top:16px;">No results found</p><p class="empty-desc">Try a different search term.</p></div>';
      return;
    }

    el.innerHTML = '<div class="content-grid">' + items.map(function (item) {
      return self._createContentCard(item, item.type, false);
    }).join('') + '</div>';
    self._lazyLoadImages();
    self._setupRippleEffects();
  };

  /**
   * Render demo search results.
   * @private
   * @param {string} query
   */
  App.prototype._renderSearchResultsDemo = function (query) {
    var self = this;
    var el = document.getElementById('search-results');
    if (!el) return;

    var all = self._getDemoMovies().concat(self._getDemoSeries()).concat(self._getDemoChannels());
    var q = query.toLowerCase();
    var filtered = all.filter(function (item) {
      return (item.name || '').toLowerCase().indexOf(q) !== -1 ||
             (item.genre || '').toLowerCase().indexOf(q) !== -1 ||
             (item.description || '').toLowerCase().indexOf(q) !== -1;
    });

    if (filtered.length === 0) {
      el.innerHTML = '<div class="empty-state">' + svg('search') + '<p class="empty-title" style="margin-top:16px;">No results for "' + Utils.sanitize(query) + '"</p></div>';
      return;
    }

    el.innerHTML = '<div class="content-grid">' + filtered.map(function (item) {
      return self._createContentCard(item, item.type, false);
    }).join('') + '</div>';
    self._lazyLoadImages();
    self._setupRippleEffects();
  };

  // ===========================================================================
  //  SECTION 11 — PAGE RENDERING: FAVORITES
  // ===========================================================================

  /**
   * Render the favorites page.
   * @private
   */
  App.prototype._renderFavoritesPage = function () {
    var self = this;
    var container = document.getElementById('main-content') || document.querySelector('.main-content');
    if (!container) return;

    self._favTabFilter = 'all';

    container.innerHTML =
      '<div class="favorites-page page active" id="page-favorites">' +
        '<div class="page-header">' +
          '<h1>' + self._t('favorites') + '</h1>' +
        '</div>' +
        '<div class="fav-tabs" id="fav-tabs">' +
          '<button class="chip active" data-fav-filter="all">All</button>' +
          '<button class="chip" data-fav-filter="movie">Movies</button>' +
          '<button class="chip" data-fav-filter="series">Series</button>' +
          '<button class="chip" data-fav-filter="live">Channels</button>' +
        '</div>' +
        '<div id="fav-content"></div>' +
      '</div>';

    self._renderFavoritesContent();

    // Bind tab clicks
    container.querySelectorAll('#fav-tabs .chip').forEach(function (tab) {
      tab.addEventListener('click', function () {
        container.querySelectorAll('#fav-tabs .chip').forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        self._favTabFilter = tab.getAttribute('data-fav-filter');
        self._renderFavoritesContent();
      });
    });

    self._setupRippleEffects();
  };

  /**
   * Render favorites content based on current filter.
   * @private
   */
  App.prototype._renderFavoritesContent = function () {
    var self = this;
    var el = document.getElementById('fav-content');
    if (!el) return;

    var items = self._favoritesInstance ? self._favoritesInstance.getAll() : [];

    if (self._favTabFilter !== 'all') {
      items = items.filter(function (f) { return f.type === self._favTabFilter; });
    }

    if (items.length === 0) {
      el.innerHTML =
        '<div class="empty-state">' +
          svg('heart') +
          '<p class="empty-title" style="margin-top:16px;">No favorites yet</p>' +
          '<p class="empty-desc">Tap the heart icon on any content to add it here.</p>' +
        '</div>';
      return;
    }

    el.innerHTML = '<div class="content-grid">' + items.map(function (item) {
      return self._createContentCard(item, item.type, false, true);
    }).join('') + '</div>';
    self._lazyLoadImages();
    self._setupRippleEffects();
  };

  // ===========================================================================
  //  SECTION 12 — PAGE RENDERING: SETTINGS
  // ===========================================================================

  /**
   * Render the settings page.
   * @private
   */
  App.prototype._renderSettingsPage = function () {
    var self = this;
    var container = document.getElementById('main-content') || document.querySelector('.main-content');
    if (!container) return;

    var settings = Config.loadSettings();
    var isDark = (settings.theme || 'dark') === 'dark';
    var autoPlay = StorageManager.getJSON('autoplay_next', true);

    container.innerHTML =
      '<div class="settings-page page active" id="page-settings">' +
        '<div class="page-header"><h1>' + self._t('settings') + '</h1></div>' +

        // Account group
        '<div class="settings-group">' +
          '<div class="settings-group-title">Account</div>' +
          '<div class="settings-item" id="setting-logout">' +
            '<div><div class="settings-label">Logout</div><div class="settings-desc">Sign out of your account</div></div>' +
            '<span style="color:var(--color-primary);">' + svg('back') + '</span>' +
          '</div>' +
        '</div>' +

        // Player group
        '<div class="settings-group">' +
          '<div class="settings-group-title">Player</div>' +
          '<div class="settings-item" id="setting-autoplay">' +
            '<div><div class="settings-label">Auto-play Next Episode</div><div class="settings-desc">Automatically play the next episode</div></div>' +
            '<div class="toggle' + (autoPlay ? ' active' : '') + '" id="toggle-autoplay"><div class="toggle-knob"></div></div>' +
          '</div>' +
          '<div class="settings-item">' +
            '<div><div class="settings-label">Streaming Quality</div><div class="settings-desc">Choose your preferred quality</div></div>' +
            '<select class="chip" id="setting-quality" style="appearance:auto;">' +
              '<option value="auto">Auto</option><option value="1080">1080p</option><option value="720">720p</option><option value="480">480p</option>' +
            '</select>' +
          '</div>' +
        '</div>' +

        // Appearance group
        '<div class="settings-group">' +
          '<div class="settings-group-title">Appearance</div>' +
          '<div class="settings-item" id="setting-theme">' +
            '<div><div class="settings-label">Dark Theme</div><div class="settings-desc">Toggle between dark and light mode</div></div>' +
            '<div class="toggle' + (isDark ? ' active' : '') + '" id="toggle-theme"><div class="toggle-knob"></div></div>' +
          '</div>' +
          '<div class="settings-item" id="setting-language">' +
            '<div><div class="settings-label">' + (self._t('language') || 'Language') + '</div></div>' +
            '<select class="chip" id="lang-select" style="appearance:auto;">' +
              '<option value="ar"' + ((self._settings.language || 'ar') === 'ar' ? ' selected' : '') + '>العربية</option>' +
              '<option value="en"' + ((self._settings.language) === 'en' ? ' selected' : '') + '>English</option>' +
            '</select>' +
          '</div>' +
        '</div>' +

        // Notifications group
        '<div class="settings-group">' +
          '<div class="settings-group-title">Notifications</div>' +
          '<div class="settings-item" id="setting-notifications">' +
            '<div><div class="settings-label">Push Notifications</div><div class="settings-desc">Receive updates about new content</div></div>' +
            '<div class="toggle active" id="toggle-notifications"><div class="toggle-knob"></div></div>' +
          '</div>' +
        '</div>' +

        // Storage group
        '<div class="settings-group">' +
          '<div class="settings-group-title">Storage</div>' +
          '<div class="settings-item" id="setting-clear-cache">' +
            '<div><div class="settings-label">Clear Cache</div><div class="settings-desc">Free up storage space</div></div>' +
            '<span style="color:var(--text-tertiary);">' + svg('chevronRight', 'sm') + '</span>' +
          '</div>' +
        '</div>' +

        // About group
        '<div class="settings-group">' +
          '<div class="settings-group-title">About</div>' +
          '<div class="settings-item" id="setting-admin">' +
            '<div><div class="settings-label">Admin Dashboard</div><div class="settings-desc">Configure server, appearance, and categories</div></div>' +
            '<span style="color:var(--text-tertiary);">' + svg('chevronRight', 'sm') + '</span>' +
          '</div>' +
          '<div class="settings-item">' +
            '<div><div class="settings-label">Privacy Policy</div></div>' +
            '<span style="color:var(--text-tertiary);">' + svg('chevronRight', 'sm') + '</span>' +
          '</div>' +
          '<div class="settings-item">' +
            '<div><div class="settings-label">Terms of Service</div></div>' +
            '<span style="color:var(--text-tertiary);">' + svg('chevronRight', 'sm') + '</span>' +
          '</div>' +
          '<div class="settings-item">' +
            '<div><div class="settings-label">About</div><div class="settings-desc">Hamad Show IPTV v1.0.0</div></div>' +
            '<span style="color:var(--text-tertiary);">' + svg('info', 'sm') + '</span>' +
          '</div>' +
        '</div>' +
      '</div>';

    // Bind theme toggle
    var themeToggle = document.getElementById('toggle-theme');
    if (themeToggle) {
      themeToggle.parentElement.addEventListener('click', function () {
        var s = Config.loadSettings();
        s.theme = s.theme === 'dark' ? 'light' : 'dark';
        Config.saveSettings(s);
        document.documentElement.setAttribute('data-theme', s.theme);
        themeToggle.classList.toggle('active', s.theme === 'dark');
      });
    }

    // Bind language select
    var langSelect = document.getElementById('lang-select');
    if (langSelect) {
      langSelect.addEventListener('change', function () {
        self._setLanguage(langSelect.value);
        self._showToast(self._t(langSelect.value === 'ar' ? 'language_changed_ar' : 'language_changed_en'), 'success');
      });
    }

    // Bind auto-play toggle
    var autoPlayToggle = document.getElementById('toggle-autoplay');
    if (autoPlayToggle) {
      autoPlayToggle.parentElement.addEventListener('click', function () {
        var current = StorageManager.getJSON('autoplay_next', true);
        StorageManager.setJSON('autoplay_next', !current);
        autoPlayToggle.classList.toggle('active', !current);
      });
    }

    // Bind notifications toggle
    var notifToggle = document.getElementById('toggle-notifications');
    if (notifToggle) {
      notifToggle.parentElement.addEventListener('click', function () {
        notifToggle.classList.toggle('active');
      });
    }

    // Bind logout
    var logoutItem = document.getElementById('setting-logout');
    if (logoutItem) {
      logoutItem.addEventListener('click', function () {
        if (confirm('Are you sure you want to log out?')) {
          self._isAuthenticated = false;
          var s = Config.loadSettings();
          s.username = '';
          s.password = '';
          Config.saveSettings(s);
          StorageManager.remove('user');
          self._showLogin();
          self._showToast('Logged out successfully.', 'info');
        }
      });
    }

    // Bind clear cache
    var clearCache = document.getElementById('setting-clear-cache');
    if (clearCache) {
      clearCache.addEventListener('click', function () {
        StorageManager.clear();
        if (self._apiInstance && typeof self._apiInstance.clearCache === 'function') self._apiInstance.clearCache();
        self._showToast('Cache cleared successfully.', 'success');
      });
    }

    // Bind admin
    var adminItem = document.getElementById('setting-admin');
    if (adminItem) {
      adminItem.addEventListener('click', function () {
        self._routerInstance.navigate('/admin');
      });
    }

    self._setupRippleEffects();
  };

  // ===========================================================================
  //  SECTION 13 — PAGE RENDERING: PROFILE
  // ===========================================================================

  /**
   * Render the profile page.
   * @private
   */
  App.prototype._renderProfilePage = function () {
    var self = this;
    var container = document.getElementById('main-content') || document.querySelector('.main-content');
    if (!container) return;

    var user = StorageManager.getUser() || {};
    var username = user.username || user.auth || 'Demo User';
    var email = user.email || (self._demoMode ? 'demo@hamadshow.com' : 'user@example.com');
    var initials = username.substring(0, 2).toUpperCase();

    var historyCount = self._historyInstance ? self._historyInstance.getAll().length : 0;
    var favCount = self._favoritesInstance ? self._favoritesInstance.getAll().length : 0;
    var continueCount = self._historyInstance ? self._historyInstance.getContinueWatching().length : 0;

    var recentHistory = self._historyInstance ? self._historyInstance.getRecent(10) : [];

    var historyHtml = recentHistory.length > 0
      ? recentHistory.map(function (h) {
          var gradient = Utils.getGradientColor(h.type || 'movie');
          return '<div class="episode-item" data-id="' + h.id + '" data-type="' + (h.type || 'movie') + '">' +
            '<div style="width:80px;height:50px;border-radius:var(--radius-sm);background:' + gradient + ';flex-shrink:0;display:flex;align-items:center;justify-content:center;">' +
              (h.poster ? '<img src="' + Utils.sanitize(h.poster) + '" style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius-sm);" referrerpolicy="no-referrer" onerror="this.style.display=\'none\'">' : svg('movie', 'sm')) +
            '</div>' +
            '<div class="ep-info">' +
              '<div class="ep-title">' + Utils.truncate(Utils.sanitize(h.name || ''), 50) + '</div>' +
              '<div class="ep-meta">' + Utils.formatDate(h.timestamp) + '</div>' +
            '</div>' +
          '</div>';
        }).join('')
      : '<p style="text-align:center;color:var(--text-tertiary);padding:20px;">No watch history yet.</p>';

    container.innerHTML =
      '<div class="profile-page page active" id="page-profile">' +
        '<div class="profile-header">' +
          '<div class="avatar" style="width:80px;height:80px;font-size:var(--fs-2xl);">' + initials + '</div>' +
          '<h2 class="profile-name">' + Utils.sanitize(username) + '</h2>' +
          '<p class="profile-email">' + Utils.sanitize(email) + '</p>' +
          '<div class="profile-stats">' +
            '<div class="stat-item"><div class="stat-value">' + historyCount + '</div><div class="stat-label">Watched</div></div>' +
            '<div class="stat-item"><div class="stat-value">' + favCount + '</div><div class="stat-label">Favorites</div></div>' +
            '<div class="stat-item"><div class="stat-value">' + continueCount + '</div><div class="stat-label">Continue</div></div>' +
          '</div>' +
        '</div>' +
        '<div class="divider"></div>' +
        '<h3 style="padding:0 16px;margin-bottom:12px;font-size:var(--fs-base);font-weight:var(--fw-semibold);">Watch History</h3>' +
        '<div class="episode-list" style="padding-bottom:100px;">' + historyHtml + '</div>' +
        '<div style="padding:0 16px 100px;">' +
          '<button class="btn btn-secondary" id="profile-logout-btn" style="width:100%;">Logout</button>' +
        '</div>' +
      '</div>';

    // Bind history item clicks
    container.querySelectorAll('.episode-item[data-id]').forEach(function (item) {
      item.addEventListener('click', function () {
        var id = item.getAttribute('data-id');
        var type = item.getAttribute('data-type');
        if (type === 'series') {
          self._routerInstance.navigate('/series-detail/' + id);
        } else if (type === 'live') {
          self._openPlayerForChannel(id);
        } else {
          self._routerInstance.navigate('/movie/' + id);
        }
      });
    });

    // Bind logout
    var logoutBtn = document.getElementById('profile-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        if (confirm('Are you sure you want to log out?')) {
          self._isAuthenticated = false;
          var s = Config.loadSettings();
          s.username = '';
          s.password = '';
          Config.saveSettings(s);
          StorageManager.remove('user');
          self._showLogin();
          self._showToast('Logged out successfully.', 'info');
        }
      });
    }

    self._lazyLoadImages();
    self._setupRippleEffects();
  };

  // ===========================================================================
  //  SECTION 14 — DETAIL PAGES
  // ===========================================================================

  /**
   * Render movie detail page.
   * @private
   * @param {string|number} movieId
   */
  App.prototype._renderMovieDetail = function (movieId) {
    var self = this;
    var container = document.getElementById('main-content') || document.querySelector('.main-content');
    if (!container) return;

    // Find movie in cache
    var movie = null;
    var allMovies = self._demoMode ? self._getDemoMovies() : self._moviesCache;
    movie = allMovies.find(function (m) { return String(m.id) === String(movieId); });

    if (!movie) {
      container.innerHTML = '<div class="empty-state" style="padding-top:60px;">' + svg('movie') + '<p class="empty-title" style="margin-top:16px;">Movie not found</p></div>';
      return;
    }

    var isFav = self._favoritesInstance && self._favoritesInstance.isFavorite(movie.id, 'movie');
    var rating = movie.rating ? Number(movie.rating).toFixed(1) : 'N/A';
    var backdrop = movie.backdrop || movie.poster || '';

    container.innerHTML =
      '<div class="page active" id="page-movie-detail">' +
        '<div class="detail-header">' +
          (backdrop ? '<img class="detail-backdrop" src="' + Utils.sanitize(backdrop) + '" alt="" referrerpolicy="no-referrer" onerror="this.style.display=\'none\'">' : '<div class="detail-backdrop" style="background:' + Utils.getGradientColor('movie') + ';"></div>') +
          '<div class="detail-gradient"></div>' +
          '<div class="detail-nav">' +
            '<button class="btn btn-glass btn-icon" id="detail-back">' + svg('back') + '</button>' +
            '<button class="btn btn-glass btn-icon fav-detail-btn' + (isFav ? ' active' : '') + '" data-fav-id="' + movie.id + '" data-fav-type="movie" data-fav-name="' + Utils.sanitize(movie.name) + '" data-fav-poster="' + Utils.sanitize(movie.poster || '') + '">' + (isFav ? svg('heart') : svg('heart')) + '</button>' +
          '</div>' +
          '<div class="detail-info">' +
            '<div class="detail-poster-row">' +
              '<img class="detail-poster" src="' + Utils.sanitize(movie.poster || '') + '" alt="' + Utils.sanitize(movie.name) + '" referrerpolicy="no-referrer" onerror="this.style.display=\'none\'">' +
              '<div style="flex:1;min-width:0;">' +
                '<h1 class="detail-title">' + Utils.sanitize(movie.name) + '</h1>' +
                '<div class="detail-meta">' +
                  '<span>' + svg('star', 'sm') + ' ' + rating + '</span>' +
                  (movie.year ? '<span>' + movie.year + '</span>' : '') +
                  (movie.duration ? '<span>' + Utils.formatDuration(Number(movie.duration)) + '</span>' : '') +
                  '<span class="badge badge-primary">Movie</span>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="detail-actions">' +
            '<button class="btn btn-primary btn-lg detail-play-btn">' + svg('play') + ' ' + (self._t('play_now') || 'شاهد الآن') + '</button>' +
          '</div>' +
          (movie.description ? '<div style="padding:16px;"><p style="font-size:var(--fs-sm);color:var(--text-secondary);line-height:1.7;">' + Utils.sanitize(movie.description) + '</p></div>' : '') +
          '<div style="padding:0 16px 40px;"><h3 style="margin-bottom:12px;">' + (self._t('similar_movies') || 'أفلام مشابهة') + '</h3>'<div class="content-grid" id="similar-movies-grid"></div></div>' +
        '</div>' +
      '</div>';

    // Bind back
    var backBtn = document.getElementById('detail-back');
    if (backBtn) backBtn.addEventListener('click', function () { self._routerInstance.back(); });

    // Bind play
    var playBtn = container.querySelector('.detail-play-btn');
    if (playBtn) {
      playBtn.addEventListener('click', function () {
        self._openPlayerForMovie(movie);
      });
    }

    // Bind favorite
    var favBtn = container.querySelector('.fav-detail-btn');
    if (favBtn) {
      favBtn.addEventListener('click', function () {
        var nowFav = self._favoritesInstance.toggle({ id: movie.id, type: 'movie', name: movie.name, poster: movie.poster });
        favBtn.classList.toggle('active', nowFav);
        self._showToast(nowFav ? (self._t('added_favorites') || 'تمت الإضافة للمفضلة') : (self._t('removed_favorites') || 'تمت الإزالة من المفضلة'), nowFav ? 'success' : 'info');
      });
    }

    // Similar movies
    var similarGrid = document.getElementById('similar-movies-grid');
    if (similarGrid) {
      var others = allMovies.filter(function (m) { return String(m.id) !== String(movie.id); }).slice(0, 10);
      similarGrid.innerHTML = others.map(function (m) { return self._createContentCard(m, 'movie', false); }).join('');
      self._lazyLoadImages();
    }

    self._setupRippleEffects();
  };

  /**
   * Render series detail page.
   * @private
   * @param {string|number} seriesId
   */
  App.prototype._renderSeriesDetail = function (seriesId) {
    var self = this;
    var container = document.getElementById('main-content') || document.querySelector('.main-content');
    if (!container) return;

    var allSeries = self._demoMode ? self._getDemoSeries() : self._seriesCache;
    var series = allSeries.find(function (s) { return String(s.id) === String(seriesId); });

    if (!series) {
      container.innerHTML = '<div class="empty-state" style="padding-top:60px;">' + svg('tv') + '<p class="empty-title" style="margin-top:16px;">Series not found</p></div>';
      return;
    }

    var isFav = self._favoritesInstance && self._favoritesInstance.isFavorite(series.id, 'series');
    var rating = series.rating ? Number(series.rating).toFixed(1) : 'N/A';

    // Generate fake seasons for demo
    var seasons = series.seasons || [
      { season_number: 1, name: 'Season 1', episodes: self._generateDemoEpisodes(8) },
      { season_number: 2, name: 'Season 2', episodes: self._generateDemoEpisodes(10) },
    ];

    var seasonTabsHtml = seasons.map(function (s, i) {
      return '<button class="chip' + (i === 0 ? ' active' : '') + '" data-season="' + s.season_number + '">' + (self._t('season') || 'الموسم') + ' ' + s.season_number + '</button>';
    }).join('');

    var episodesHtml = seasons.length > 0
      ? seasons[0].episodes.map(function (ep, i) {
          return '<div class="episode-item" data-ep="' + (i + 1) + '">' +
            '<div class="ep-thumb" style="background:' + Utils.getGradientColor('series') + ';display:flex;align-items:center;justify-content:center;">' + svg('play', 'sm') + '</div>' +
            '<div class="ep-info">' +
              '<div class="ep-title">' + (self._t('episode') || 'الحلقة') + ' ' + (i + 1) + (ep.title ? ': ' + Utils.sanitize(ep.title) : '') + '</div>' +
              '<div class="ep-meta">' + (ep.duration || '45m') + '</div>' +
              (ep.description ? '<div class="ep-desc">' + Utils.truncate(Utils.sanitize(ep.description), 100) + '</div>' : '') +
            '</div>' +
          '</div>';
        }).join('')
      : '<p style="padding:16px;color:var(--text-tertiary);">' + (self._t('no_content') || 'لا يوجد محتوى متاح') + '</p>';

    container.innerHTML =
      '<div class="page active" id="page-series-detail">' +
        '<div class="detail-header">' +
          '<img class="detail-backdrop" src="' + Utils.sanitize(series.poster || '') + '" alt="" referrerpolicy="no-referrer" onerror="this.style.display=\'none\'">' +
          '<div class="detail-gradient"></div>' +
          '<div class="detail-nav">' +
            '<button class="btn btn-glass btn-icon" id="detail-back">' + svg('back') + '</button>' +
            '<button class="btn btn-glass btn-icon fav-detail-btn' + (isFav ? ' active' : '') + '" data-fav-id="' + series.id + '" data-fav-type="series" data-fav-name="' + Utils.sanitize(series.name) + '" data-fav-poster="' + Utils.sanitize(series.poster || '') + '">' + svg('heart') + '</button>' +
          '</div>' +
          '<div class="detail-info">' +
            '<div class="detail-poster-row">' +
              '<img class="detail-poster" src="' + Utils.sanitize(series.poster || '') + '" alt="' + Utils.sanitize(series.name) + '" referrerpolicy="no-referrer" onerror="this.style.display=\'none\'">' +
              '<div style="flex:1;min-width:0;">' +
                '<h1 class="detail-title">' + Utils.sanitize(series.name) + '</h1>' +
                '<div class="detail-meta">' +
                  '<span>' + svg('star', 'sm') + ' ' + rating + '</span>' +
                  (series.year ? '<span>' + series.year + '</span>' : '') +
                  '<span class="badge badge-secondary">Series</span>' +
                  '<span>' + seasons.length + ' ' + (self._t('season') || 'موسم') + '</span>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          (series.description ? '<div style="padding:16px;"><p style="font-size:var(--fs-sm);color:var(--text-secondary);line-height:1.7;">' + Utils.sanitize(series.description) + '</p></div>' : '') +
          '<div class="season-tabs" id="season-tabs">' + seasonTabsHtml + '</div>' +
          '<div class="episode-list" id="episode-list" style="padding-bottom:100px;">' + episodesHtml + '</div>' +
        '</div>' +
      '</div>';

    // Bind back
    var backBtn = document.getElementById('detail-back');
    if (backBtn) backBtn.addEventListener('click', function () { self._routerInstance.back(); });

    // Bind favorite
    var favBtn = container.querySelector('.fav-detail-btn');
    if (favBtn) {
      favBtn.addEventListener('click', function () {
        var nowFav = self._favoritesInstance.toggle({ id: series.id, type: 'series', name: series.name, poster: series.poster });
        favBtn.classList.toggle('active', nowFav);
        self._showToast(nowFav ? (self._t('added_favorites') || 'تمت الإضافة للمفضلة') : (self._t('removed_favorites') || 'تمت الإزالة من المفضلة'), nowFav ? 'success' : 'info');
      });
    }

    // Bind season tabs
    container.querySelectorAll('#season-tabs .chip').forEach(function (tab) {
      tab.addEventListener('click', function () {
        container.querySelectorAll('#season-tabs .chip').forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        var seasonNum = parseInt(tab.getAttribute('data-season'), 10);
        var season = seasons.find(function (s) { return s.season_number === seasonNum; });
        var epList = document.getElementById('episode-list');
        if (season && epList) {
          epList.innerHTML = season.episodes.map(function (ep, i) {
            return '<div class="episode-item" data-ep="' + (i + 1) + '">' +
              '<div class="ep-thumb" style="background:' + Utils.getGradientColor('series') + ';display:flex;align-items:center;justify-content:center;">' + svg('play', 'sm') + '</div>' +
              '<div class="ep-info">' +
                '<div class="ep-title">' + (self._t('episode') || 'الحلقة') + ' ' + (i + 1) + (ep.title ? ': ' + Utils.sanitize(ep.title) : '') + '</div>' +
                '<div class="ep-meta">' + (ep.duration || '45m') + '</div>' +
              '</div>' +
            '</div>';
          }).join('');
        }
      });
    });

    // Bind episode clicks — play episode
    container.addEventListener('click', function (e) {
      var epItem = e.target.closest('.episode-item[data-ep-id]');
      if (epItem) {
        var epId = epItem.getAttribute('data-ep-id');
        var epExt = epItem.getAttribute('data-ep-ext') || 'mp4';
        var epTitle = epItem.querySelector('.ep-title');
        var epNum = epItem.getAttribute('data-ep');
        if (epId) {
          self._openPlayerForEpisode(series.id, epId, epExt, {
            title: (epTitle ? epTitle.textContent : (self._t('episode') || 'الحلقة') + ' ' + epNum)
          });
        }
      }
    });

    // If not demo mode, try to fetch real episodes from API
    if (!self._demoMode && self._apiInstance && typeof self._apiInstance.getSeriesInfo === 'function') {
      self._apiInstance.getSeriesInfo(series.id).then(function (info) {
        if (!info || !info.episodes) return;
        var realSeasons = [];
        var seasonKeys = Object.keys(info.episodes).sort(function (a, b) { return Number(a) - Number(b); });
        seasonKeys.forEach(function (seasonNum) {
          var epList = info.episodes[seasonNum];
          if (Array.isArray(epList)) {
            realSeasons.push({
              season_number: Number(seasonNum),
              name: (self._t('season') || 'الموسم') + ' ' + seasonNum,
              episodes: epList.map(function (ep, i) {
                return {
                  id: ep.id || ep.episode_id,
                  title: ep.title || (''),
                  container_extension: ep.container_extension || ep.extension || 'mp4',
                  duration: ep.info && ep.info.duration ? ep.info.duration + 'm' : '',
                  description: ep.info && ep.info.plot ? ep.info.plot : '',
                };
              })
            });
          }
        });
        if (realSeasons.length > 0) {
          // Re-render with real data
          var tabsEl = document.getElementById('season-tabs');
          var epListEl = document.getElementById('episode-list');
          if (tabsEl) {
            tabsEl.innerHTML = realSeasons.map(function (s, i) {
              return '<button class="chip' + (i === 0 ? ' active' : '') + '" data-season="' + s.season_number + '">' + (self._t('season') || 'الموسم') + ' ' + s.season_number + '</button>';
            }).join('');
            tabsEl.querySelectorAll('.chip').forEach(function (tab) {
              tab.addEventListener('click', function () {
                tabsEl.querySelectorAll('.chip').forEach(function (t) { t.classList.remove('active'); });
                tab.classList.add('active');
                var sn = parseInt(tab.getAttribute('data-season'), 10);
                var season = realSeasons.find(function (s) { return s.season_number === sn; });
                if (season && epListEl) {
                  epListEl.innerHTML = season.episodes.map(function (ep, i) {
                    var eid = ep.id || '';
                    var eext = ep.container_extension || 'mp4';
                    return '<div class="episode-item" data-ep="' + (i + 1) + '" data-ep-id="' + Utils.sanitize(eid) + '" data-ep-ext="' + Utils.sanitize(eext) + '">' +
                      '<div class="ep-thumb" style="background:' + Utils.getGradientColor('series') + ';display:flex;align-items:center;justify-content:center;">' + svg('play', 'sm') + '</div>' +
                      '<div class="ep-info">' +
                        '<div class="ep-title">' + (self._t('episode') || 'الحلقة') + ' ' + (i + 1) + (ep.title ? ': ' + Utils.sanitize(ep.title) : '') + '</div>' +
                        '<div class="ep-meta">' + (ep.duration || '45m') + '</div>' +
                        (ep.description ? '<div class="ep-desc">' + Utils.truncate(Utils.sanitize(ep.description), 100) + '</div>' : '') +
                      '</div>' +
                    '</div>';
                  }).join('');
                }
              });
            });
          }
          if (epListEl && realSeasons.length > 0 && realSeasons[0].episodes) {
            epListEl.innerHTML = realSeasons[0].episodes.map(function (ep, i) {
              var eid = ep.id || '';
              var eext = ep.container_extension || 'mp4';
              return '<div class="episode-item" data-ep="' + (i + 1) + '" data-ep-id="' + Utils.sanitize(eid) + '" data-ep-ext="' + Utils.sanitize(eext) + '">' +
                '<div class="ep-thumb" style="background:' + Utils.getGradientColor('series') + ';display:flex;align-items:center;justify-content:center;">' + svg('play', 'sm') + '</div>' +
                '<div class="ep-info">' +
                  '<div class="ep-title">' + (self._t('episode') || 'الحلقة') + ' ' + (i + 1) + (ep.title ? ': ' + Utils.sanitize(ep.title) : '') + '</div>' +
                  '<div class="ep-meta">' + (ep.duration || '45m') + '</div>' +
                  (ep.description ? '<div class="ep-desc">' + Utils.truncate(Utils.sanitize(ep.description), 100) + '</div>' : '') +
                '</div>' +
              '</div>';
            }).join('');
          }
        }
      }).catch(function (err) {
        console.warn('[App] Could not fetch series info:', err);
      });
    }

    self._setupRippleEffects();
  };

  /**
   * Render channel detail page.
   * @private
   * @param {string|number} channelId
   */
  App.prototype._renderChannelDetail = function (channelId) {
    var self = this;
    var container = document.getElementById('main-content') || document.querySelector('.main-content');
    if (!container) return;

    var allChannels = self._demoMode ? self._getDemoChannels() : self._channelsCache;
    var channel = allChannels.find(function (ch) { return String(ch.id) === String(channelId); });

    if (!channel) {
      container.innerHTML = '<div class="empty-state" style="padding-top:60px;">' + svg('tv') + '<p class="empty-title" style="margin-top:16px;">Channel not found</p></div>';
      return;
    }

    // Generate demo EPG
    var epgItems = self._generateDemoEPG();

    container.innerHTML =
      '<div class="page active" id="page-channel-detail">' +
        '<div class="detail-header">' +
          '<div class="detail-backdrop" style="background:' + Utils.getGradientColor('live') + ';display:flex;align-items:center;justify-content:center;">' +
            (channel.poster ? '<img src="' + Utils.sanitize(channel.poster) + '" style="width:80px;height:80px;border-radius:var(--radius-md);object-fit:cover;" referrerpolicy="no-referrer" onerror="this.style.display=\'none\'">' : '') +
          '</div>' +
          '<div class="detail-gradient"></div>' +
          '<div class="detail-nav">' +
            '<button class="btn btn-glass btn-icon" id="detail-back">' + svg('back') + '</button>' +
          '</div>' +
          '<div class="detail-info">' +
            '<h1 class="detail-title">' + Utils.sanitize(channel.name) + '</h1>' +
            '<div class="detail-meta">' +
              '<span class="live-badge">LIVE</span>' +
              '<span class="badge badge-accent">Channel</span>' +
            '</div>' +
          '</div>' +
          '<div class="detail-actions">' +
            '<button class="btn btn-primary btn-lg detail-play-btn">' + svg('play') + ' ' + (self._t('play_now') || 'شاهد الآن') + '</button>' +
          '</div>' +
          '<div class="epg-bar" id="epg-timeline" style="padding-bottom:100px;">' +
            '<h3 style="margin-bottom:12px;">' + (self._t('live_channels') || 'دليل البرامج') + '</h3>' +
            epgItems.map(function (epg) {
              return '<div class="epg-item">' +
                '<div class="epg-time' + (epg.now ? ' epg-now' : '') + '">' + epg.time + '</div>' +
                '<div class="epg-info">' +
                  '<div class="epg-title">' + Utils.sanitize(epg.title) + '</div>' +
                  '<div class="epg-desc">' + Utils.sanitize(epg.desc) + '</div>' +
                  (epg.now ? '<div class="epg-progress"><div class="epg-progress-fill" style="width:' + epg.progress + '%;"></div></div>' : '') +
                '</div>' +
              '</div>';
            }).join('') +
          '</div>' +
        '</div>' +
      '</div>';

    // Bind back
    var backBtn = document.getElementById('detail-back');
    if (backBtn) backBtn.addEventListener('click', function () { self._routerInstance.back(); });

    // Bind play
    var playBtn = container.querySelector('.detail-play-btn');
    if (playBtn) {
      playBtn.addEventListener('click', function () {
        self._openPlayerForChannel(channel.id);
      });
    }

    self._setupRippleEffects();
  };

  // ===========================================================================
  //  SECTION 15 — CONTENT CARD RENDERING
  // ===========================================================================

  /**
   * Create a content card DOM string.
   * @private
   * @param {Object} item
   * @param {string} type  'movie', 'series', or 'live'
   * @param {boolean} isWide
   * @param {boolean} isFavPage
   * @returns {string} HTML
   */
  App.prototype._createContentCard = function (item, type, isWide, isFavPage) {
    var self = this;
    type = type || 'movie';
    var gradient = Utils.getGradientColor(type);
    var rating = item.rating ? Number(item.rating).toFixed(1) : '';
    var year = item.year || '';
    var isFav = self._favoritesInstance ? self._favoritesInstance.isFavorite(item.id, type) : false;

    // Progress ring for continue watching
    var progressRing = '';
    if (item.position !== undefined && item.duration && item.duration > 0) {
      var progress = Math.min(item.position / item.duration, 1);
      var percent = Math.round(progress * 100);
      var radius = 18;
      var circumference = 2 * Math.PI * radius;
      var offset = circumference * (1 - progress);
      progressRing = '<svg class="progress-ring" viewBox="0 0 44 44" style="position:absolute;bottom:8px;right:8px;">' +
        '<circle cx="22" cy="22" r="' + radius + '" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="3"/>' +
        '<circle cx="22" cy="22" r="' + radius + '" fill="none" stroke="var(--color-primary)" stroke-width="3" stroke-linecap="round" stroke-dasharray="' + circumference + '" stroke-dashoffset="' + offset + '" transform="rotate(-90 22 22)"/>' +
        '<text x="22" y="22" text-anchor="middle" dominant-baseline="central" fill="white" font-size="11" font-weight="600">' + percent + '%</text>' +
      '</svg>';
    }

    var posterImg = item.poster
      ? '<img class="poster" data-src="' + Utils.sanitize(item.poster) + '" alt="' + Utils.sanitize(item.name || '') + '" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';">' +
        '<div class="card-overlay" style="display:none;align-items:center;justify-content:center;">' + svg(type === 'live' ? 'tv' : type === 'series' ? 'tv' : 'movie') + '</div>'
      : '<div class="poster" style="display:flex;align-items:center;justify-content:center;background:' + gradient + ';">' + svg(type === 'live' ? 'tv' : type === 'series' ? 'tv' : 'movie') + '</div>';

    var favBtnHtml = '<button class="fav-btn' + (isFav ? ' active' : '') + '" data-fav-id="' + item.id + '" data-fav-type="' + type + '" data-fav-name="' + Utils.sanitize(item.name || '') + '" data-fav-poster="' + Utils.sanitize(item.poster || '') + '">' + (isFav ? svg('heart') : svg('heart')) + '</button>';

    var playOverlay = type !== 'live'
      ? '<div class="play-btn-overlay">' + svg('play') + '</div>'
      : '';

    return '<div class="content-card" data-id="' + item.id + '" data-type="' + type + '" style="position:relative;">' +
      posterImg +
      progressRing +
      '<span class="badge ' + (type === 'series' ? 'badge-secondary' : type === 'live' ? 'badge-accent' : 'badge-primary') + '" style="position:absolute;top:8px;left:8px;z-index:2;">' + type + '</span>' +
      favBtnHtml +
      playOverlay +
      '<div class="card-info">' +
        '<div class="card-title">' + Utils.truncate(Utils.sanitize(item.name || 'Untitled'), 35) + '</div>' +
        '<div class="card-meta">' +
          (year ? '<span>' + year + '</span>' : '') +
          (rating ? '<span class="card-rating">' + svg('star', 'sm') + ' ' + rating + '</span>' : '') +
        '</div>' +
      '</div>' +
    '</div>';
  };

  /**
   * Create a channel card DOM string.
   * @private
   * @param {Object} channel
   * @returns {string} HTML
   */
  App.prototype._createChannelCard = function (channel) {
    var self = this;
    var logoHtml = channel.poster
      ? '<img class="channel-logo" data-src="' + Utils.sanitize(channel.poster) + '" alt="' + Utils.sanitize(channel.name || '') + '" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';">' +
        '<div style="display:none;width:56px;height:56px;border-radius:var(--radius-md);background:var(--bg-tertiary);align-items:center;justify-content:center;">' + svg('tv', 'sm') + '</div>'
      : '<div style="width:56px;height:56px;border-radius:var(--radius-md);background:var(--bg-tertiary);display:flex;align-items:center;justify-content:center;">' + svg('tv', 'sm') + '</div>';

    return '<div class="channel-card" data-id="' + channel.id + '" data-type="live">' +
      logoHtml +
      '<span class="channel-name">' + Utils.truncate(Utils.sanitize(channel.name || 'Channel'), 20) + '</span>' +
      '<span class="channel-live">LIVE</span>' +
    '</div>';
  };

  /**
   * Create skeleton loading cards.
   * @private
   * @param {number} count
   * @param {string} type
   * @returns {string} HTML
   */
  App.prototype._createSkeletonCards = function (count, type) {
    var html = '';
    for (var i = 0; i < count; i++) {
      if (type === 'channel') {
        html += '<div class="channel-card" style="pointer-events:none;">' +
          '<div class="skeleton-shimmer" style="width:56px;height:56px;border-radius:var(--radius-md);"></div>' +
          '<div class="skeleton-shimmer" style="width:60px;height:10px;border-radius:4px;margin-top:6px;"></div>' +
        '</div>';
      } else {
        html += '<div class="skeleton-card" style="flex:0 0 140px;">' +
          '<div class="skeleton-poster skeleton-shimmer"></div>' +
          '<div class="skeleton-text skeleton-shimmer"></div>' +
          '<div class="skeleton-text short skeleton-shimmer"></div>' +
        '</div>';
      }
    }
    return html;
  };

  // ===========================================================================
  //  SECTION 16 — DEMO DATA
  // ===========================================================================

  /**
   * Generate demo movies.
   * @private
   * @returns {Array}
   */
  App.prototype._getDemoMovies = function () {
    return [
      { id: 'm1',  name: 'The Last Horizon', poster: 'https://picsum.photos/seed/horizon/300/450', backdrop: 'https://picsum.photos/seed/horizon-bg/800/450', rating: 8.5, year: 2024, genre: 'Action', duration: 142, description: 'An epic journey across uncharted territories where a lone explorer discovers the edge of the known world.', type: 'movie' },
      { id: 'm2',  name: 'Midnight Echo', poster: 'https://picsum.photos/seed/echo/300/450', backdrop: 'https://picsum.photos/seed/echo-bg/800/450', rating: 7.8, year: 2024, genre: 'Thriller', duration: 118, description: 'A detective uncovers a conspiracy that echoes through time, threatening to unravel reality itself.', type: 'movie' },
      { id: 'm3',  name: 'Desert Storm', poster: 'https://picsum.photos/seed/desert/300/450', backdrop: 'https://picsum.photos/seed/desert-bg/800/450', rating: 8.1, year: 2023, genre: 'Action', duration: 156, description: 'In the scorching sands of the Arabian desert, a band of warriors fights for survival against impossible odds.', type: 'movie' },
      { id: 'm4',  name: 'Crimson Tide Rising', poster: 'https://picsum.photos/seed/crimson/300/450', backdrop: 'https://picsum.photos/seed/crimson-bg/800/450', rating: 7.2, year: 2024, genre: 'Drama', duration: 130, description: 'Two families torn apart by war find unexpected connections that transcend the battlefield.', type: 'movie' },
      { id: 'm5',  name: 'Neon Dreams', poster: 'https://picsum.photos/seed/neon/300/450', backdrop: 'https://picsum.photos/seed/neon-bg/800/450', rating: 8.9, year: 2024, genre: 'Sci-Fi', duration: 125, description: 'In a cyberpunk metropolis, a hacker discovers that the digital world is bleeding into reality.', type: 'movie' },
      { id: 'm6',  name: 'The Silent Garden', poster: 'https://picsum.photos/seed/garden/300/450', backdrop: 'https://picsum.photos/seed/garden-bg/800/450', rating: 7.5, year: 2023, genre: 'Drama', duration: 110, description: 'A reclusive botanist tends a mysterious garden that holds the memories of everyone who visits.', type: 'movie' },
      { id: 'm7',  name: 'Arabian Nights', poster: 'https://picsum.photos/seed/arabian/300/450', backdrop: 'https://picsum.photos/seed/arabian-bg/800/450', rating: 8.3, year: 2024, genre: 'Fantasy', duration: 148, description: 'Ancient tales come to life as a storyteller weaves magic through the streets of old Baghdad.', type: 'movie' },
      { id: 'm8',  name: 'Velocity', poster: 'https://picsum.photos/seed/velocity/300/450', backdrop: 'https://picsum.photos/seed/velocity-bg/800/450', rating: 7.0, year: 2023, genre: 'Action', duration: 135, description: 'The fastest driver alive must outrun more than just the competition to protect those he loves.', type: 'movie' },
      { id: 'm9',  name: 'Whispers in the Dark', poster: 'https://picsum.photos/seed/whisper/300/450', backdrop: 'https://picsum.photos/seed/whisper-bg/800/450', rating: 8.7, year: 2024, genre: 'Horror', duration: 102, description: 'A family moves into a historic mansion only to discover the walls have been listening for centuries.', type: 'movie' },
      { id: 'm10', name: 'The Golden Compass', poster: 'https://picsum.photos/seed/compass/300/450', backdrop: 'https://picsum.photos/seed/compass-bg/800/450', rating: 7.9, year: 2023, genre: 'Adventure', duration: 140, description: 'An ancient artifact points the way to a lost civilization hidden beneath the Sahara.', type: 'movie' },
      { id: 'm11', name: 'Frozen Light', poster: 'https://picsum.photos/seed/frozen/300/450', backdrop: 'https://picsum.photos/seed/frozen-bg/800/450', rating: 8.0, year: 2024, genre: 'Sci-Fi', duration: 120, description: 'Scientists at a polar research station discover light that freezes everything it touches.', type: 'movie' },
      { id: 'm12', name: 'City of Stars', poster: 'https://picsum.photos/seed/citystars/300/450', backdrop: 'https://picsum.photos/seed/citystars-bg/800/450', rating: 7.6, year: 2023, genre: 'Romance', duration: 115, description: 'Two musicians from different worlds find harmony in the bustling streets of a modern city.', type: 'movie' },
      { id: 'm13', name: 'The Iron Sultan', poster: 'https://picsum.photos/seed/sultan/300/450', backdrop: 'https://picsum.photos/seed/sultan-bg/800/450', rating: 8.4, year: 2024, genre: 'History', duration: 165, description: 'The epic tale of a legendary ruler who forged an empire across three continents.', type: 'movie' },
      { id: 'm14', name: 'Quantum Break', poster: 'https://picsum.photos/seed/quantum/300/450', backdrop: 'https://picsum.photos/seed/quantum-bg/800/450', rating: 7.3, year: 2024, genre: 'Sci-Fi', duration: 128, description: 'A physics experiment goes wrong, fracturing time and forcing a team to fix the timeline.', type: 'movie' },
      { id: 'm15', name: 'Desert Rose', poster: 'https://picsum.photos/seed/desertrose/300/450', backdrop: 'https://picsum.photos/seed/desertrose-bg/800/450', rating: 8.6, year: 2023, genre: 'Drama', duration: 138, description: 'A woman returns to her ancestral village in the desert to uncover secrets that could change everything.', type: 'movie' },
      { id: 'm16', name: 'Shadow Protocol', poster: 'https://picsum.photos/seed/shadow/300/450', backdrop: 'https://picsum.photos/seed/shadow-bg/800/450', rating: 7.7, year: 2024, genre: 'Thriller', duration: 122, description: 'A covert agent must go rogue when a mole is discovered at the highest levels of intelligence.', type: 'movie' },
      { id: 'm17', name: 'The Last Ember', poster: 'https://picsum.photos/seed/ember/300/450', backdrop: 'https://picsum.photos/seed/ember-bg/800/450', rating: 8.2, year: 2023, genre: 'Fantasy', duration: 145, description: 'The final fire mage must reignite the Eternal Flame before darkness consumes the realm.', type: 'movie' },
      { id: 'm18', name: 'Ocean\'s Depth', poster: 'https://picsum.photos/seed/ocean/300/450', backdrop: 'https://picsum.photos/seed/ocean-bg/800/450', rating: 7.4, year: 2024, genre: 'Adventure', duration: 132, description: 'Deep-sea explorers discover an ancient underwater city with technology far beyond our own.', type: 'movie' },
      { id: 'm19', name: 'Code Black', poster: 'https://picsum.photos/seed/codeblack/300/450', backdrop: 'https://picsum.photos/seed/codeblack-bg/800/450', rating: 7.1, year: 2023, genre: 'Thriller', duration: 108, description: 'When the entire internet goes dark, a ragtag team of hackers must find out who pulled the plug.', type: 'movie' },
      { id: 'm20', name: 'The Silk Road', poster: 'https://picsum.photos/seed/silk/300/450', backdrop: 'https://picsum.photos/seed/silk-bg/800/450', rating: 8.8, year: 2024, genre: 'History', duration: 155, description: 'Follow the legendary trade route from China to Constantinople through danger, wonder, and discovery.', type: 'movie' },
    ];
  };

  /**
   * Generate demo series.
   * @private
   * @returns {Array}
   */
  App.prototype._getDemoSeries = function () {
    return [
      { id: 's1',  name: 'Kingdom of Sands', poster: 'https://picsum.photos/seed/kingdom/300/450', rating: 9.1, year: 2024, genre: 'Drama', description: 'A sprawling epic about the rise and fall of a desert dynasty across five generations.', type: 'series', seasons: [{ season_number: 1, name: 'Season 1', episodes: this._generateDemoEpisodes(10) }, { season_number: 2, name: 'Season 2', episodes: this._generateDemoEpisodes(12) }, { season_number: 3, name: 'Season 3', episodes: this._generateDemoEpisodes(8) }] },
      { id: 's2',  name: 'Digital Void', poster: 'https://picsum.photos/seed/void/300/450', rating: 8.4, year: 2024, genre: 'Sci-Fi', description: 'In 2087, humanity uploads consciousness to the cloud, but something waits in the void between servers.', type: 'series' },
      { id: 's3',  name: 'The Watcher', poster: 'https://picsum.photos/seed/watcher/300/450', rating: 8.7, year: 2023, genre: 'Thriller', description: 'A retired spy is pulled back into action when every agent she trained starts disappearing.', type: 'series' },
      { id: 's4',  name: 'Cairo Nights', poster: 'https://picsum.photos/seed/cairo/300/450', rating: 8.2, year: 2024, genre: 'Drama', description: 'Interconnected stories of five families living in the vibrant heart of modern Cairo.', type: 'series' },
      { id: 's5',  name: 'Echoes of Tomorrow', poster: 'https://picsum.photos/seed/tomorrow/300/450', rating: 7.9, year: 2023, genre: 'Sci-Fi', description: 'A teenager discovers she can receive messages from her future self, but the warnings grow increasingly desperate.', type: 'series' },
      { id: 's6',  name: 'The Healer', poster: 'https://picsum.photos/seed/healer/300/450', rating: 8.5, year: 2024, genre: 'Drama', description: 'A gifted doctor in a war-torn region must choose between saving patients and protecting her family.', type: 'series' },
      { id: 's7',  name: 'Starbound', poster: 'https://picsum.photos/seed/starbound/300/450', rating: 8.0, year: 2023, genre: 'Adventure', description: 'The crew of the first interstellar colony ship discovers that space is not as empty as they thought.', type: 'series' },
      { id: 's8',  name: 'The Recipe', poster: 'https://picsum.photos/seed/recipe/300/450', rating: 8.6, year: 2024, genre: 'Comedy', description: 'A street food vendor competes on the world stage while keeping her family restaurant alive.', type: 'series' },
      { id: 's9',  name: 'Iron Gates', poster: 'https://picsum.photos/seed/irongates/300/450', rating: 7.8, year: 2023, genre: 'Action', description: 'An elite security team protects the most valuable artifacts in a museum that is always under siege.', type: 'series' },
      { id: 's10', name: 'Midnight Garden', poster: 'https://picsum.photos/seed/midgarden/300/450', rating: 8.3, year: 2024, genre: 'Fantasy', description: 'A botanical researcher discovers plants that bloom only at midnight, each with supernatural properties.', type: 'series' },
      { id: 's11', name: 'Code Zero', poster: 'https://picsum.photos/seed/codezero/300/450', rating: 7.7, year: 2023, genre: 'Thriller', description: 'A cybersecurity team races against time to stop a virus that could cripple global infrastructure.', type: 'series' },
      { id: 's12', name: 'The Merchant', poster: 'https://picsum.photos/seed/merchant/300/450', rating: 8.1, year: 2024, genre: 'History', description: 'Following a medieval merchant family whose trade routes connect empires and spark revolutions.', type: 'series' },
      { id: 's13', name: 'Lost Signal', poster: 'https://picsum.photos/seed/signal/300/450', rating: 7.5, year: 2023, genre: 'Sci-Fi', description: 'A radio astronomer picks up a signal from a star system that should not exist.', type: 'series' },
      { id: 's14', name: 'The Poet', poster: 'https://picsum.photos/seed/poet/300/450', rating: 8.8, year: 2024, genre: 'Drama', description: 'A poet in exile writes verses that become anthems for a revolution sweeping across the Arab world.', type: 'series' },
      { id: 's15', name: 'Wild Hearts', poster: 'https://picsum.photos/seed/wildhearts/300/450', rating: 7.6, year: 2023, genre: 'Comedy', description: 'A wildlife veterinarian and a city lawyer must work together to save an endangered animal sanctuary.', type: 'series' },
    ];
  };

  /**
   * Generate demo channels.
   * @private
   * @returns {Array}
   */
  App.prototype._getDemoChannels = function () {
    return [
      { id: 'c1',  name: 'Al Jazeera HD',     poster: 'https://picsum.photos/seed/aljazeera/100/100',  genre: 'News',   type: 'live' },
      { id: 'c2',  name: 'MBC 1',             poster: 'https://picsum.photos/seed/mbc1/100/100',       genre: 'General', type: 'live' },
      { id: 'c3',  name: 'Dubai One',         poster: 'https://picsum.photos/seed/dubai/100/100',      genre: 'General', type: 'live' },
      { id: 'c4',  name: 'Al Arabiya',         poster: 'https://picsum.photos/seed/arabiya/100/100',    genre: 'News',   type: 'live' },
      { id: 'c5',  name: 'beIN Sports 1',      poster: 'https://picsum.photos/seed/bein1/100/100',      genre: 'Sports', type: 'live' },
      { id: 'c6',  name: 'beIN Sports 2',      poster: 'https://picsum.photos/seed/bein2/100/100',      genre: 'Sports', type: 'live' },
      { id: 'c7',  name: 'OSN Movies',         poster: 'https://picsum.photos/seed/osn/100/100',        genre: 'Movies', type: 'live' },
      { id: 'c8',  name: 'Nat Geo Abu Dhabi',  poster: 'https://picsum.photos/seed/natgeo/100/100',    genre: 'Docs',   type: 'live' },
      { id: 'c9',  name: 'Cartoon Network',    poster: 'https://picsum.photos/seed/cartoon/100/100',    genre: 'Kids',   type: 'live' },
      { id: 'c10', name: 'BBC Arabic',         poster: 'https://picsum.photos/seed/bbcarabic/100/100',  genre: 'News',   type: 'live' },
      { id: 'c11', name: 'Rotana Cinema',      poster: 'https://picsum.photos/seed/rotana/100/100',     genre: 'Movies', type: 'live' },
      { id: 'c12', name: 'Saudi TV 1',         poster: 'https://picsum.photos/seed/sauditv/100/100',    genre: 'General', type: 'live' },
      { id: 'c13', name: 'Sky News Arabia',    poster: 'https://picsum.photos/seed/skyarabia/100/100',  genre: 'News',   type: 'live' },
      { id: 'c14', name: 'ESPN HD',            poster: 'https://picsum.photos/seed/espn/100/100',       genre: 'Sports', type: 'live' },
      { id: 'c15', name: 'Discovery Channel',  poster: 'https://picsum.photos/seed/discovery/100/100',  genre: 'Docs',   type: 'live' },
      { id: 'c16', name: 'Nickelodeon',        poster: 'https://picsum.photos/seed/nick/100/100',       genre: 'Kids',   type: 'live' },
      { id: 'c17', name: 'Fox Sports',         poster: 'https://picsum.photos/seed/foxsports/100/100',  genre: 'Sports', type: 'live' },
      { id: 'c18', name: 'LBCI',               poster: 'https://picsum.photos/seed/lbci/100/100',       genre: 'General', type: 'live' },
      { id: 'c19', name: 'Al Mayadeen',        poster: 'https://picsum.photos/seed/mayadeen/100/100',   genre: 'News',   type: 'live' },
      { id: 'c20', name: 'History Channel',    poster: 'https://picsum.photos/seed/historych/100/100',   genre: 'Docs',   type: 'live' },
    ];
  };

  /**
   * Generate demo hero items.
   * @private
   * @returns {Array}
   */
  App.prototype._getDemoHeroItems = function () {
    var movies = this._getDemoMovies();
    var series = this._getDemoSeries();
    var all = movies.concat(series);
    // Pick 5 top-rated
    return all.sort(function (a, b) { return (b.rating || 0) - (a.rating || 0); }).slice(0, 5);
  };

  /**
   * Generate demo episodes for a season.
   * @private
   * @param {number} count
   * @returns {Array}
   */
  App.prototype._generateDemoEpisodes = function (count) {
    var titles = ['Pilot', 'The Awakening', 'Crossroads', 'Into the Unknown', 'Betrayal', 'The Reckoning', 'Shattered Glass', 'New Dawn', 'The Exchange', 'Endgame', 'Resurgence', 'Point of No Return'];
    var episodes = [];
    for (var i = 0; i < count; i++) {
      episodes.push({
        title: titles[i] || 'Episode ' + (i + 1),
        duration: (40 + Math.floor(Math.random() * 25)) + 'm',
        description: 'An intense episode that pushes the characters to their limits.',
      });
    }
    return episodes;
  };

  /**
   * Generate demo EPG data.
   * @private
   * @returns {Array}
   */
  App.prototype._generateDemoEPG = function () {
    var now = new Date();
    var items = [];
    var programs = [
      { title: 'Morning Show', desc: 'Start your day with the latest news and entertainment.' },
      { title: 'Documentary Hour', desc: 'Exploring the wonders of nature and science.' },
      { title: 'Movie Premiere', desc: 'Exclusive first screening of this week\'s blockbuster.' },
      { title: 'Sports Center', desc: 'Live coverage of today\'s biggest matches.' },
      { title: 'Evening News', desc: 'Comprehensive coverage of today\'s top stories.' },
      { title: 'Late Night Talk', desc: 'Celebrity interviews and comedy segments.' },
    ];

    for (var i = 0; i < programs.length; i++) {
      var hour = new Date(now.getTime() + (i - 1) * 3600000);
      var h = hour.getHours();
      var m = hour.getMinutes();
      var timeStr = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
      items.push({
        time: timeStr,
        title: programs[i].title,
        desc: programs[i].desc,
        now: i === 1,
        progress: i === 1 ? 45 : 0,
      });
    }
    return items;
  };

  // ===========================================================================
  //  SECTION 17 — HELPER METHODS
  // ===========================================================================

  /**
   * Show a toast notification (delegates to Notifications module).
   * @private
   * @param {string} message
   * @param {string} type
   */
  App.prototype._showToast = function (message, type) {
    if (this._notificationsInstance && typeof this._notificationsInstance.showToast === 'function') {
      this._notificationsInstance.showToast(message, type || 'info');
    }
  };

  /**
   * Open the player for a movie.
   * @private
   * @param {Object} movie
   */

  /**
   * Open the player for a series episode.
   * @private
   * @param {string|number} seriesId
   * @param {string|number} episodeId
   * @param {string} extension
   * @param {Object} episodeInfo  { title, containerExtension }
   */
  App.prototype._openPlayerForEpisode = function (seriesId, episodeId, extension, episodeInfo) {
    var self = this;
    if (!self._playerInstance || typeof self._playerInstance.play !== 'function') return;

    var urls = [];
    try {
      if (self._apiInstance && self._apiInstance.isAuthenticated && self._apiInstance.isAuthenticated()) {
        var ext = extension || 'mp4';
        urls = self._apiInstance.getStreamUrls(episodeId, 'series', ext);
      }
    } catch (e) {
      console.warn('[App] Error building episode stream URL:', e);
    }

    if (!urls.length && self._demoMode) {
      urls = ['https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'];
    }

    if (urls.length > 0) {
      var title = (episodeInfo && episodeInfo.title) || (self._t('episode') || 'الحلقة');
      console.info('[App] Playing episode:', title, 'URLs:', urls.map(function(u){return u.substring(0,60)+'...';}));
      self._playerInstance.playWithFallback(urls, { title: title, id: episodeId, type: 'series', seriesId: seriesId });
    } else {
      self._showToast(self._t ? self._t('no_stream_url') : 'لا يوجد رابط بث متاح', 'warning');
    }
  };

  App.prototype._openPlayerForMovie = function (movie) {
    var self = this;
    if (!self._playerInstance || typeof self._playerInstance.play !== 'function') return;

    var urls = [];
    try {
      if (self._apiInstance && self._apiInstance.isAuthenticated && self._apiInstance.isAuthenticated()) {
        var ext = movie.containerExtension || movie.streamType || 'mp4';
        urls = self._apiInstance.getStreamUrls(movie.id, 'movie', ext);
      }
    } catch (e) {
      console.warn('[App] Error building stream URL:', e);
    }

    if (!urls.length && self._demoMode) {
      urls = ['https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'];
    }

    if (urls.length > 0) {
      console.info('[App] Playing movie:', movie.name, 'URLs:', urls.map(function(u){return u.substring(0,60)+'...';}));
      // Play with fallback URLs
      self._playerInstance.playWithFallback(urls, { title: movie.name, poster: movie.poster, id: movie.id, type: 'movie' });
    } else {
      self._showToast(self._t ? self._t('no_stream_url') : 'لا يوجد رابط بث متاح', 'warning');
    }
  };

  /**
   * Open the player for a live channel.
   * @private
   * @param {string|number} channelId
   */
  App.prototype._openPlayerForChannel = function (channelId) {
    var self = this;
    if (!self._playerInstance || typeof self._playerInstance.play !== 'function') return;

    var urls = [];
    try {
      if (self._apiInstance && typeof self._apiInstance.getStreamUrls === 'function') {
        urls = self._apiInstance.getStreamUrls(channelId, 'live');
      } else if (self._apiInstance && typeof self._apiInstance.getStreamUrl === 'function') {
        urls = [self._apiInstance.getStreamUrl(channelId, 'live')];
      }
    } catch (e) {
      console.warn('[App] Error building live stream URL:', e);
    }

    if (!urls.length && self._demoMode) {
      urls = ['https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'];
    }

    if (urls.length > 0) {
      var channels = self._demoMode ? self._getDemoChannels() : self._channelsCache;
      var ch = channels.find(function (c) { return String(c.id) === String(channelId); });
      console.info('[App] Playing channel:', (ch && ch.name), 'URLs:', urls.map(function(u){return u.substring(0,60)+'...';}));
      self._playerInstance.playWithFallback(urls, { title: (ch && ch.name) || (self._t('live_tv') || 'قناة مباشرة'), poster: (ch && ch.poster) || '', id: channelId, type: 'live' });
    } else {
      self._showToast(self._t ? self._t('no_stream_url') : 'لا يوجد رابط بث متاح', 'warning');
    }
  };

  /**
   * Setup IntersectionObserver for lazy loading images.
   * @private
   */
  App.prototype._lazyLoadImages = function () {
    var images = document.querySelectorAll('img[data-src]');
    if (images.length === 0) return;

    if (typeof IntersectionObserver !== 'undefined') {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var img = entry.target;
            img.src = img.getAttribute('data-src');
            img.removeAttribute('data-src');
            observer.unobserve(img);
          }
        });
      }, { rootMargin: '300px' });

      images.forEach(function (img) { observer.observe(img); });
    } else {
      // Fallback: load all immediately
      images.forEach(function (img) {
        img.src = img.getAttribute('data-src');
        img.removeAttribute('data-src');
      });
    }
  };

  /**
   * Setup scroll-to-top button visibility.
   * @private
   */
  App.prototype._setupScrollTop = function () {
    var self = this;
    var btn = document.getElementById('scroll-top-btn');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'scroll-top-btn';
      btn.className = 'scroll-top-btn';
      btn.setAttribute('aria-label', 'Scroll to top');
      btn.innerHTML = svg('arrowUp');
      document.body.appendChild(btn);
      btn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    window.addEventListener('scroll', Utils.throttle(function () {
      btn.classList.toggle('visible', window.scrollY > 500);
    }, 200));
  };

  /**
   * Setup the notification panel toggle.
   * @private
   */
  App.prototype._setupNotificationPanel = function () {
    var self = this;
    var notifBtn = document.getElementById('notif-btn');
    if (notifBtn) {
      notifBtn.addEventListener('click', function () {
        if (self._notificationsInstance) {
          if (self._notificationsInstance._panelOpen) {
            self._notificationsInstance.closePanel();
          } else {
            self._notificationsInstance.openPanel();
          }
        }
      });
    }
  };

  /**
   * Setup PWA install prompt listener.
   * @private
   */
  App.prototype._setupPWAInstall = function () {
    var self = this;
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      self._deferredInstallPrompt = e;
    });
  };

  /**
   * Setup global event listeners.
   * @private
   */
  App.prototype._setupEventListeners = function () {
    var self = this;

    // Delegate clicks on content cards
    document.addEventListener('click', function (e) {
      // Content card clicks
      var card = e.target.closest('.content-card[data-id]');
      if (card && !e.target.closest('.fav-btn') && !e.target.closest('.play-btn-overlay')) {
        var id = card.getAttribute('data-id');
        var type = card.getAttribute('data-type');
        if (type === 'series') {
          self._routerInstance.navigate('/series-detail/' + id);
        } else if (type === 'live') {
          self._openPlayerForChannel(id);
        } else {
          self._routerInstance.navigate('/movie/' + id);
        }
        return;
      }

      // Channel card clicks
      var channelCard = e.target.closest('.channel-card[data-id]');
      if (channelCard) {
        var chId = channelCard.getAttribute('data-id');
        self._openPlayerForChannel(chId);
        return;
      }

      // Favorite button clicks (delegated)
      var favBtn = e.target.closest('.fav-btn');
      if (favBtn && self._favoritesInstance) {
        e.stopPropagation();
        var favId = favBtn.getAttribute('data-fav-id');
        var favType = favBtn.getAttribute('data-fav-type');
        var favName = favBtn.getAttribute('data-fav-name');
        var favPoster = favBtn.getAttribute('data-fav-poster');
        var nowFav = self._favoritesInstance.toggle({ id: favId, type: favType, name: favName, poster: favPoster });
        favBtn.classList.toggle('active', nowFav);
        self._showToast(nowFav ? (self._t('added_favorites') || 'تمت الإضافة للمفضلة') : (self._t('removed_favorites') || 'تمت الإزالة من المفضلة'), nowFav ? 'success' : 'info');
        return;
      }

      // See All section links
      var seeAll = e.target.closest('.section-link');
      if (seeAll) {
        e.preventDefault();
        var href = seeAll.getAttribute('href') || seeAll.getAttribute('data-href');
        if (href && href.charAt(0) === '#') {
          self._routerInstance.navigate(href.slice(1));
        }
        return;
      }

      // History episode items
      var epItem = e.target.closest('.episode-item[data-id]');
      if (epItem) {
        var epId = epItem.getAttribute('data-id');
        var epType = epItem.getAttribute('data-type');
        if (epType === 'series') {
          self._routerInstance.navigate('/series-detail/' + epId);
        } else if (epType === 'live') {
          self._openPlayerForChannel(epId);
        } else {
          self._routerInstance.navigate('/movie/' + epId);
        }
        return;
      }
    });
  };

  /**
   * Setup ripple effects on all .btn elements.
   * @private
   */
  App.prototype._setupRippleEffects = function () {
    var buttons = document.querySelectorAll('.btn:not([data-ripple])');
    buttons.forEach(function (btn) {
      btn.setAttribute('data-ripple', 'true');
      btn.addEventListener('click', function (e) {
        Utils.createRipple(e);
      });
    });
  };

  /**
   * Convert an API image path to a full URL.
   * @private
   * @param {string} path
   * @returns {string}
   */
  App.prototype._getImageUrl = function (imgPath) {
    if (!imgPath) return '';
    var p = String(imgPath).trim();
    if (!p) return '';
    // Already a full URL — upgrade http to https to avoid mixed-content blocking
    if (/^https?:\/\//i.test(p)) {
      return p.replace(/^http:\/\//i, 'https://');
    }
    if (/^\/\//i.test(p)) {
      return 'https:' + p;
    }
    // Use API instance server URL first, then Config fallback
    var base = (this._apiInstance && this._apiInstance._serverUrl) || Config.getApiBaseUrl();
    if (!base) return p;
    base = base.replace(/\/+$/, '').replace(/^http:\/\//i, 'https://');
    if (p.charAt(0) !== '/') p = '/' + p;
    return base + p;
  };

  /**
   * Apply theme CSS variables.
   * @private
   * @param {Object} settings
   */
  App.prototype._applyTheme = function (settings) {
    var root = document.documentElement;

    // Apply data-theme attribute
    var theme = (settings && settings.theme) || 'dark';
    root.setAttribute('data-theme', theme);

    // Apply custom colors
    if (settings && settings.primaryColor) {
      root.style.setProperty('--color-primary', settings.primaryColor);
      // Generate glow variant
      root.style.setProperty('--color-primary-glow', settings.primaryColor + '40');
      root.style.setProperty('--color-primary-light', settings.primaryColor + 'cc');
    }

    if (settings && settings.secondaryColor) {
      root.style.setProperty('--color-secondary', settings.secondaryColor);
    }
  };

  /**
   * Sort items by a given criteria.
   * @private
   * @param {Array} items
   * @param {string} sortBy  'az', 'za', 'rating', 'year', 'recent'
   * @returns {Array}
   */
  App.prototype._sortItems = function (items, sortBy) {
    var sorted = items.slice();
    switch (sortBy) {
      case 'az':
        sorted.sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); });
        break;
      case 'za':
        sorted.sort(function (a, b) { return (b.name || '').localeCompare(a.name || ''); });
        break;
      case 'rating':
        sorted.sort(function (a, b) { return (Number(b.rating) || 0) - (Number(a.rating) || 0); });
        break;
      case 'year':
        sorted.sort(function (a, b) { return (Number(b.year) || 0) - (Number(a.year) || 0); });
        break;
      case 'recent':
        sorted.reverse();
        break;
    }
    return sorted;
  };


  // ===========================================================================
  //  SECTION 20 — INTERNATIONALIZATION (Arabic / English)
  // ===========================================================================

  App.prototype._i18n = {
    ar: {
      app_name: 'حمد شو',
      home: 'الرئيسية',
      movies: 'أفلام',
      series: 'مسلسلات',
      live_tv: 'القنوات المباشرة',
      search: 'البحث',
      favorites: 'المفضلة',
      settings: 'الإعدادات',
      profile: 'حسابي',
      sign_in: 'تسجيل الدخول',
      sign_in_to_start: 'سجّل دخولك لبدء المشاهدة',
      server_url: 'رابط السيرفر',
      username: 'اسم المستخدم',
      password: 'كلمة المرور',
      remember_me: 'تذكرني',
      invalid_credentials: 'بيانات الدخول غير صحيحة',
      connection_failed: 'فشل الاتصال. تحقق من رابط السيرفر.',
      fill_all_fields: 'يرجى ملء جميع الحقول',
      trending_now: 'الأكثر رواجاً',
      recently_added: 'أضيف مؤخراً',
      popular_series: 'مسلسلات شهيرة',
      live_channels: 'القنوات المباشرة',
      sports: 'رياضة',
      kids: 'أطفال',
      arabic_content: 'محتوى عربي',
      english_content: 'محتوى إنجليزي',
      recommended: 'مقترح لك',
      continue_watching: 'متابعة المشاهدة',
      see_all: 'عرض الكل',
      play_now: 'شاهد الآن',
      no_content: 'لا يوجد محتوى متاح',
      no_results: 'لا توجد نتائج',
      try_different: 'جرب كلمة بحث مختلفة',
      search_placeholder: 'ابحث عن أفلام، مسلسلات، قنوات...',
      no_favorites: 'لا توجد مفضلات بعد',
      tap_heart: 'اضغط على أيقونة القلب لإضافة المحتوى هنا',
      watch_history: 'سجل المشاهدة',
      no_history: 'لا يوجد سجل مشاهدة بعد',
      watched: 'تمت مشاهدته',
      logout: 'تسجيل الخروج',
      logout_confirm: 'هل أنت متأكد من تسجيل الخروج؟',
      logged_out: 'تم تسجيل الخروج بنجاح',
      account: 'الحساب',
      player: 'المشغل',
      appearance: 'المظهر',
      notifications: 'الإشعارات',
      storage: 'التخزين',
      about: 'حول التطبيق',
      dark_theme: 'الوضع الداكن',
      toggle_dark_light: 'التبديل بين الوضع الداكن والفاتح',
      auto_play_next: 'تشغيل الحلقة التالية تلقائياً',
      auto_play_desc: 'تشغيل الحلقة التالية تلقائياً',
      streaming_quality: 'جودة البث',
      push_notifications: 'الإشعارات',
      receive_updates: 'تلقي تحديثات عن المحتوى الجديد',
      clear_cache: 'مسح التخزين المؤقت',
      free_storage: 'تحرير مساحة التخزين',
      cache_cleared: 'تم مسح التخزين المؤقت',
      admin_dashboard: 'لوحة الإدارة',
      admin_desc: 'إعدادات السيرفر والمظهر والتصنيفات',
      demo_mode: 'وضع تجريبي',
      demo_welcome: 'مرحباً بك في الوضع التجريبي — استكشف التطبيق بمحتوى نموذجي!',
      continue_demo: 'المتابعة في الوضع التجريبي',
      welcome_back: 'مرحباً بعودتك',
      connected_firebase: 'تم الاتصال عبر فايربيز!',
      added_favorites: 'تمت الإضافة للمفضلة',
      removed_favorites: 'تمت الإزالة من المفضلة',
      no_stream_url: 'لا يوجد رابط بث متاح',
      all: 'الكل',
      language: 'اللغة',
      season: 'الموسم',
      episode: 'الحلقة',
      live: 'مباشر',
      similar_movies: 'أفلام مشابهة',
      movie_not_found: 'الفيلم غير موجود',
      series_not_found: 'المسلسل غير موجود',
      channel_not_found: 'القناة غير موجودة',
      offline_title: 'أنت غير متصل بالإنترنت',
      offline_desc: 'تحقق من اتصال الإنترنت وحاول مرة أخرى',
      try_again: 'حاول مرة أخرى',
      install_app: 'تثبيت حمد شو',
      install_desc: 'أضف التطبيق للشاشة الرئيسية لأفضل تجربة',
      language_changed_ar: 'تم تغيير اللغة إلى العربية',
      language_changed_en: 'Language changed to English',
    },
    en: {
      app_name: 'Hamad Show',
      home: 'Home',
      movies: 'Movies',
      series: 'Series',
      live_tv: 'Live TV',
      search: 'Search',
      favorites: 'Favorites',
      settings: 'Settings',
      profile: 'Profile',
      sign_in: 'Sign In',
      sign_in_to_start: 'Sign in to start streaming',
      server_url: 'Server URL',
      username: 'Username',
      password: 'Password',
      remember_me: 'Remember me',
      invalid_credentials: 'Invalid credentials. Please check your details.',
      connection_failed: 'Connection failed. Check your server URL.',
      fill_all_fields: 'Please fill in all fields.',
      trending_now: 'Trending Now',
      recently_added: 'Recently Added',
      popular_series: 'Popular Series',
      live_channels: 'Live Channels',
      sports: 'Sports',
      kids: 'Kids',
      arabic_content: 'Arabic Content',
      english_content: 'English Content',
      recommended: 'Recommended For You',
      continue_watching: 'Continue Watching',
      see_all: 'See All',
      play_now: 'Play Now',
      no_content: 'No content available',
      no_results: 'No results found',
      try_different: 'Try a different search term.',
      search_placeholder: 'Search movies, series, channels...',
      no_favorites: 'No favorites yet',
      tap_heart: 'Tap the heart icon on any content to add it here.',
      watch_history: 'Watch History',
      no_history: 'No watch history yet.',
      watched: 'Watched',
      logout: 'Logout',
      logout_confirm: 'Are you sure you want to log out?',
      logged_out: 'Logged out successfully.',
      account: 'Account',
      player: 'Player',
      appearance: 'Appearance',
      notifications: 'Notifications',
      storage: 'Storage',
      about: 'About',
      dark_theme: 'Dark Theme',
      toggle_dark_light: 'Toggle between dark and light mode',
      auto_play_next: 'Auto-play Next Episode',
      auto_play_desc: 'Automatically play the next episode',
      streaming_quality: 'Streaming Quality',
      push_notifications: 'Push Notifications',
      receive_updates: 'Receive updates about new content',
      clear_cache: 'Clear Cache',
      free_storage: 'Free up storage space',
      cache_cleared: 'Cache cleared successfully.',
      admin_dashboard: 'Admin Dashboard',
      admin_desc: 'Configure server, appearance, and categories',
      demo_mode: 'Demo Mode',
      demo_welcome: 'Welcome to Demo Mode — explore with sample content!',
      continue_demo: 'Continue in Demo Mode',
      welcome_back: 'Welcome back',
      connected_firebase: 'Connected via Firebase!',
      added_favorites: 'Added to favorites',
      removed_favorites: 'Removed from favorites',
      no_stream_url: 'No stream URL available.',
      all: 'All',
      language: 'Language',
      season: 'Season',
      episode: 'Episode',
      live: 'LIVE',
      similar_movies: 'Similar Movies',
      movie_not_found: 'Movie not found',
      series_not_found: 'Series not found',
      channel_not_found: 'Channel not found',
      offline_title: "You're Offline",
      offline_desc: 'Check your internet connection and try again.',
      try_again: 'Try Again',
      install_app: 'Install Hamad Show',
      install_desc: 'Add to home screen for the best experience',
      language_changed_ar: 'Language changed to Arabic',
      language_changed_en: 'Language changed to English',
      program_guide: 'دليل البرامج',
      watch_now: 'شاهد الآن',
      episode_play_error: 'تعذر تشغيل الحلقة',
    }
  };

  App.prototype._t = function (key) {
    var lang = (this._settings && this._settings.language) || 'ar';
    var dict = this._i18n && this._i18n[lang];
    if (!dict) dict = this._i18n && this._i18n['ar'];
    return (dict && dict[key]) || key;
  };

  App.prototype._setLanguage = function (lang) {
    var self = this;
    self._settings.language = lang;
    Config.saveSettings(self._settings);
    var isArabic = lang === 'ar';
    document.documentElement.setAttribute('dir', isArabic ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.style.setProperty('--font-primary', isArabic
      ? "'Noto Sans Arabic', 'Inter', 'Segoe UI', system-ui, sans-serif"
      : "'Inter', 'Segoe UI', system-ui, sans-serif");
    document.documentElement.style.setProperty('--font-heading', isArabic
      ? "'Noto Sans Arabic', 'Inter', 'Segoe UI', system-ui, sans-serif"
      : "'Inter', 'Segoe UI', system-ui, sans-serif");
    var headerName = document.getElementById('header-app-name');
    if (headerName) headerName.textContent = self._t('app_name');
    self._renderHomePage();
  };

  // ===========================================================================
  //  SECTION 18 — BOOT
  // ===========================================================================

  // Auto-initialise on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', function () {
    var app = new App();
    global[NAMESPACE] = global[NAMESPACE] || {};
    global[NAMESPACE].App = app;
    app.init();
  });

})(window);