/**
 * NASR LIVE - Main Application
 * Router, initialization, navigation, theme management, PWA install
 */
(function() {
  'use strict';

  const App = {
    currentPage: null,
    currentPageName: '',
    destroyCurrentPage: null,
    sidebarOpen: false,
    deferredInstallPrompt: null,

    async init() {
      // Init database
      if (window.AppDB) await window.AppDB.init();

      // Init i18n
      if (window.i18n) {
        await window.i18n.init();
      }

      // Init focus engine
      if (window.FocusEngine) window.FocusEngine.init();

      // Init auth
      if (window.AuthService) {
        await window.AuthService.init();
      }

      // Detect platform
      this._detectPlatform();

      // Setup router
      this._setupRouter();

      // Setup navigation
      this._setupNavigation();

      // Setup theme
      this._loadTheme();

      // Setup PWA install
      this._setupInstallPrompt();

      // Setup event listeners
      this._setupGlobalEvents();

      // Register service worker
      this._registerSW();

      // Show auth or app
      this._checkAuthState();
    },

    _detectPlatform() {
      const ua = navigator.userAgent.toLowerCase();
      document.body.classList.remove('tv-mode', 'tizen-platform', 'webos-platform', 'firetv-platform');

      const isTV = /tv|smarttv|tizen|webos|firetv|aftt|aftm|bravia|netcast|viera|philips/i.test(ua)
                   || (screen.width >= 1280 && !('ontouchstart' in window) && ua.includes('chrome'));

      if (isTV) {
        document.body.classList.add('tv-mode');
        if (ua.includes('tizen')) document.body.classList.add('tizen-platform');
        if (ua.includes('webos')) document.body.classList.add('webos-platform');
        if (ua.includes('firetv') || ua.includes('aftt')) document.body.classList.add('firetv-platform');
      }

      if (window.UIComponents && window.UIComponents.isTV()) {
        document.body.classList.add('tv-mode');
      }
    },

    _setupRouter() {
      window.addEventListener('hashchange', () => this._onRouteChange());
      // Handle initial route
      if (!window.location.hash) {
        window.location.hash = '#/';
      }
    },

    _onRouteChange() {
      const hash = window.location.hash || '#/';
      const route = hash.replace('#', '') || '/';
      this.navigateTo(route);
    },

    navigateTo(route) {
      // Normalize route
      route = route.startsWith('/') ? route : '/' + route;
      if (route === '/') route = '/home';

      // Destroy current page
      if (this.destroyCurrentPage) {
        this.destroyCurrentPage();
        this.destroyCurrentPage = null;
      }

      const container = document.getElementById('page-container');
      container.innerHTML = '';
      container.className = 'page-container page-enter';

      // Update navigation active states
      this._updateNavActive(route);

      // Close sidebar on mobile
      if (window.innerWidth <= 768) {
        this._closeSidebar();
      }

      // Route to page
      const pageName = route.replace('/', '');
      this.currentPageName = pageName;

      if (window.Pages && window.Pages[pageName]) {
        this.currentPage = window.Pages[pageName];
        this.destroyCurrentPage = this.currentPage.render(container);
      } else {
        container.innerHTML = `
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="64" height="64">
              <circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
            </svg>
            <h3>404</h3>
            <p>Page not found</p>
          </div>`;
      }

      // Remove animation class
      setTimeout(() => container.classList.remove('page-enter'), 300);

      // Scroll to top
      container.scrollTop = 0;
    },

    _setupNavigation() {
      // Menu toggle (mobile)
      const menuToggle = document.getElementById('menu-toggle');
      if (menuToggle) {
        menuToggle.addEventListener('click', () => this._toggleSidebar());
      }

      // Sidebar overlay click to close
      const sidebarOverlay = document.getElementById('sidebar-overlay');
      if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => this._closeSidebar());
      }

      // Sidebar nav items
      document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
          if (window.innerWidth <= 768) this._closeSidebar();
        });
      });

      // Bottom nav items
      document.querySelectorAll('.bottom-nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
          // handled by hash links
        });
      });

      // Profile button
      const profileBtn = document.getElementById('profile-btn');
      const profileMenu = document.getElementById('profile-menu');
      if (profileBtn && profileMenu) {
        profileBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          profileMenu.classList.toggle('hidden');
          this._updateProfileMenu();
        });
        document.addEventListener('click', () => profileMenu.classList.add('hidden'));
        profileMenu.addEventListener('click', (e) => e.stopPropagation());
      }

      // Profile menu actions
      const logoutBtn = document.getElementById('profile-logout');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => this._logout());
      }

      // Search button in top bar
      const searchBtn = document.getElementById('search-btn-top');
      if (searchBtn) {
        searchBtn.addEventListener('click', () => {
          window.location.hash = '#/search';
        });
      }

      // Auth form switching
      this._setupAuthForms();
    },

    _setupAuthForms() {
      const loginForm = document.getElementById('login-form');
      const registerForm = document.getElementById('register-form');
      const xtreamForm = document.getElementById('xtream-form');
      const serverConfigSection = document.getElementById('server-config-section');
      const serverConfigBtn = document.getElementById('show-server-config');

      function _showForm(show, hide1, hide2) {
        if (hide1) { hide1.style.display = 'none'; hide1.classList.remove('active'); }
        if (hide2) { hide2.style.display = 'none'; hide2.classList.remove('active'); }
        if (serverConfigSection) serverConfigSection.style.display = 'none';
        if (serverConfigBtn) serverConfigBtn.style.display = 'none';
        if (show) { show.style.display = 'flex'; show.classList.add('active'); }
      }

      // Initially: show login, hide register & xtream
      if (registerForm) { registerForm.style.display = 'none'; }
      if (xtreamForm) { xtreamForm.style.display = 'none'; }

      document.getElementById('show-register')?.addEventListener('click', (e) => {
        e.preventDefault();
        _showForm(registerForm, loginForm, xtreamForm);
        if (serverConfigSection) serverConfigSection.style.display = 'none';
        if (serverConfigBtn) serverConfigBtn.style.display = 'none';
      });

      document.getElementById('show-login')?.addEventListener('click', (e) => {
        e.preventDefault();
        _showForm(loginForm, registerForm, xtreamForm);
        if (serverConfigSection) serverConfigSection.style.display = 'flex';
        if (serverConfigBtn) serverConfigBtn.style.display = 'flex';
      });

      document.getElementById('show-server-config')?.addEventListener('click', () => {
        _showForm(xtreamForm, loginForm, registerForm);
      });

      document.getElementById('show-login-from-xtream')?.addEventListener('click', (e) => {
        e.preventDefault();
        _showForm(loginForm, registerForm, xtreamForm);
        if (serverConfigSection) serverConfigSection.style.display = 'flex';
        if (serverConfigBtn) serverConfigBtn.style.display = 'flex';
      });

      // Password toggles
      document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', () => {
          const input = btn.parentElement.querySelector('input');
          if (input.type === 'password') {
            input.type = 'text';
          } else {
            input.type = 'password';
          }
        });
      });

      // Login form submit
      loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        try {
          await window.AuthService.signInWithEmail(email, password);
        } catch (err) {
          this._showAuthError(this._getAuthErrorMessage(err.code));
        }
      });

      // Register form submit
      registerForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;
        const confirm = document.getElementById('reg-confirm').value;
        if (password !== confirm) {
          this._showAuthError('Passwords do not match');
          return;
        }
        try {
          await window.AuthService.createUser(email, password, name);
        } catch (err) {
          this._showAuthError(this._getAuthErrorMessage(err.code));
        }
      });

      // Xtream form submit
      xtreamForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = document.getElementById('xtream-url').value.trim().replace(/\/+$/, '');
        const user = document.getElementById('xtream-user').value.trim();
        const pass = document.getElementById('xtream-pass').value;
        try {
          await window.AuthService.signInWithXtream(url, user, pass);
        } catch (err) {
          this._showAuthError(err.message || 'Connection failed');
        }
      });
    },

    _showAuthError(msg) {
      const errEl = document.getElementById('auth-error');
      errEl.textContent = msg;
      errEl.classList.add('visible');
      setTimeout(() => errEl.classList.remove('visible'), 5000);
    },

    _getAuthErrorMessage(code) {
      const msgs = {
        'auth/invalid-email': 'Invalid email address',
        'auth/wrong-password': 'Wrong password',
        'auth/user-not-found': 'User not found',
        'auth/weak-password': 'Password is too weak (min 6 characters)',
        'auth/email-already-in-use': 'Email already registered',
        'auth/too-many-requests': 'Too many attempts, try again later',
        'auth/network-request-failed': 'Network error'
      };
      return msgs[code] || 'An error occurred';
    },

    _updateNavActive(route) {
      const page = route.replace('/', '') || 'home';

      document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
      });
      document.querySelectorAll('.bottom-nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
      });
    },

    _toggleSidebar() {
      const sidebar = document.getElementById('sidebar');
      const overlay = document.getElementById('sidebar-overlay');
      this.sidebarOpen = !this.sidebarOpen;
      sidebar.classList.toggle('open', this.sidebarOpen);
      if (overlay) {
        if (this.sidebarOpen) {
          overlay.style.display = 'block';
          requestAnimationFrame(() => overlay.classList.add('visible'));
        } else {
          overlay.classList.remove('visible');
          setTimeout(() => { overlay.style.display = 'none'; }, 300);
        }
      }
    },

    _closeSidebar() {
      const sidebar = document.getElementById('sidebar');
      const overlay = document.getElementById('sidebar-overlay');
      this.sidebarOpen = false;
      sidebar.classList.remove('open');
      if (overlay) {
        overlay.classList.remove('visible');
        setTimeout(() => { overlay.style.display = 'none'; }, 300);
      }
    },

    _updateProfileMenu() {
      const user = window.AuthService?.getCurrentUser();
      const nameEl = document.getElementById('profile-name');
      const emailEl = document.getElementById('profile-email');
      const avatarEl = document.getElementById('profile-avatar');

      if (user) {
        nameEl.textContent = user.displayName || user.email || 'User';
        emailEl.textContent = user.email || '';
        if (avatarEl && user.photoURL) {
          avatarEl.style.backgroundImage = `url(${user.photoURL})`;
        }
      }

      // Update Xtream status
      const statusBtn = document.getElementById('profile-xtream-status');
      if (statusBtn && window.AuthService?.getXtreamClient()?.isAuthenticated()) {
        statusBtn.querySelector('span').textContent = 'Connected';
      }
    },

    async _checkAuthState() {
      const splash = document.getElementById('splash-screen');
      const authScreen = document.getElementById('auth-screen');
      const appShell = document.getElementById('app-shell');

      // Listen for auth events
      document.addEventListener('auth:login', () => this._showApp());
      document.addEventListener('auth:xtream-connected', () => this._showApp());
      document.addEventListener('auth:logout', () => this._showAuth());

      // Check if already logged in
      if (window.AuthService?.getCurrentUser()) {
        // Check for Xtream config
        if (window.AuthService?.getXtreamClient()?.isAuthenticated()) {
          this._showApp();
        } else {
          // Try to load saved Xtream config
          const config = await window.AuthService?.loadXtreamConfig();
          if (config) {
            try {
              window.XtreamClient = new window.XtreamAPI(config.serverUrl, config.username, config.password);
              await window.XtreamClient.authenticate();
              this._showApp();
            } catch (err) {
              // Config failed, show auth
              this._showAuth();
            }
          } else {
            this._showApp(); // Show app even without Xtream (user logged in via email)
          }
        }
      } else {
        this._showAuth();
      }

      // Remove splash screen
      setTimeout(() => {
        splash.classList.add('fade-out');
        setTimeout(() => splash.remove(), 600);
      }, 1500);
    },

    _showApp() {
      document.getElementById('auth-screen').classList.add('hidden');
      document.getElementById('app-shell').classList.remove('hidden');
      // Navigate to current hash or home
      const hash = window.location.hash || '#/';
      this._onRouteChange();
    },

    _showAuth() {
      document.getElementById('auth-screen').classList.remove('hidden');
      document.getElementById('app-shell').classList.add('hidden');
    },

    async _logout() {
      if (window.UIComponents) {
        const confirmed = await window.UIComponents.showConfirm(
          'Are you sure you want to log out?'
        );
        if (!confirmed) return;
      }
      if (window.PlayerManager) window.PlayerManager.stop();
      if (window.AuthService) await window.AuthService.signOut();
      window.location.hash = '#/';
      this._showAuth();
    },

    _loadTheme() {
      const saved = localStorage.getItem('nasr_theme') || 'dark';
      this._applyTheme(saved);
    },

    _applyTheme(theme) {
      document.body.className = document.body.className
        .replace(/theme-\w+/g, '')
        .trim();
      document.body.classList.add('theme-' + theme);

      // Update meta theme-color
      const colors = {
        dark: '#0a0e17',
        light: '#f5f6fa',
        oled: '#000000',
        blue: '#0a1628'
      };
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.content = colors[theme] || colors.dark;

      localStorage.setItem('nasr_theme', theme);
    },

    _setupGlobalEvents() {
      // Online/Offline
      window.addEventListener('online', () => {
        if (window.UIComponents) window.UIComponents.showToast('Back online', 'success');
      });
      window.addEventListener('offline', () => {
        if (window.UIComponents) window.UIComponents.showToast('No internet connection', 'error');
      });

      // Handle back button on mobile
      window.addEventListener('popstate', () => {});

      // Language change
      document.addEventListener('languageChanged', (e) => {
        const lang = e.detail?.language || 'ar';
        // Re-render current page
        if (this.currentPageName) {
          this.navigateTo('/' + this.currentPageName);
        }
      });
    },

    _setupInstallPrompt() {
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        this.deferredInstallPrompt = e;
        // Show install banner after 5 seconds
        setTimeout(() => this._showInstallBanner(), 5000);
      });

      document.getElementById('install-btn')?.addEventListener('click', () => this._installApp());
      document.getElementById('install-dismiss')?.addEventListener('click', () => {
        document.getElementById('install-banner').classList.add('hidden');
      });
    },

    _showInstallBanner() {
      // Don't show if already installed
      if (window.matchMedia('(display-mode: standalone)').matches) return;
      if (!this.deferredInstallPrompt) return;
      // Don't show if on auth screen
      if (!document.getElementById('app-shell').classList.contains('hidden')) {
        document.getElementById('install-banner')?.classList.remove('hidden');
      }
    },

    async _installApp() {
      if (!this.deferredInstallPrompt) return;
      this.deferredInstallPrompt.prompt();
      const result = await this.deferredInstallPrompt.userChoice;
      if (result.outcome === 'accepted') {
        if (window.UIComponents) window.UIComponents.showToast('App installed!', 'success');
      }
      this.deferredInstallPrompt = null;
      document.getElementById('install-banner')?.classList.add('hidden');
    },

    _registerSW() {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
          .then(reg => {
            console.log('SW registered:', reg.scope);
            // Check for updates
            reg.addEventListener('updatefound', () => {
              const newWorker = reg.installing;
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'activated') {
                  if (window.UIComponents) {
                    window.UIComponents.showToast('App updated! Refresh for latest version.', 'info', 5000);
                  }
                }
              });
            });
          })
          .catch(err => console.warn('SW registration failed:', err));
      }
    }
  };

  // Start app when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
  } else {
    App.init();
  }

  window.App = App;
})();