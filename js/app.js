/**
 * NASR LIVE - Main Application
 * Router, navigation, theme management, PWA install
 * Enhanced with smooth page transitions and micro-interactions
 */
(function() {
  'use strict';

  const App = {
    currentPage: null,
    currentPageName: '',
    destroyCurrentPage: null,
    sidebarOpen: false,
    deferredInstallPrompt: null,
    _pageTransitionTimer: null,
    _isNavigating: false,

    async init() {
      if (window.AppDB) await window.AppDB.init();
      if (window.i18n) await window.i18n.init();
      if (window.FocusEngine) window.FocusEngine.init();
      if (window.ServerConfig) await window.ServerConfig.init();
      this._detectPlatform();
      this._setupRouter();
      this._setupNavigation();
      this._loadTheme();
      this._setupInstallPrompt();
      this._setupGlobalEvents();
      this._registerSW();
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
      if (!window.location.hash) window.location.hash = '#/';
    },

    _onRouteChange() {
      const hash = window.location.hash || '#/';
      const route = hash.replace('#', '') || '/';
      this.navigateTo(route);
    },

    navigateTo(route) {
      route = route.startsWith('/') ? route : '/' + route;
      if (route === '/') route = '/home';

      // Destroy current page
      if (this.destroyCurrentPage) {
        this.destroyCurrentPage();
        this.destroyCurrentPage = null;
      }

      const container = document.getElementById('page-container');
      // Trigger page exit animation
      container.classList.add('page-exit');
      container.classList.remove('page-enter');

      // Wait for exit animation, then enter new page
      clearTimeout(this._pageTransitionTimer);
      this._isNavigating = true;

      this._pageTransitionTimer = setTimeout(() => {
        if (!this._isNavigating) return;
        container.classList.remove('page-exit');
        container.innerHTML = '';
        container.classList.add('page-enter');
        this._updateNavActive(route);
        if (window.innerWidth <= 768) this._closeSidebar();

        const pageName = route.replace('/', '');
        this.currentPageName = pageName;

        if (window.Pages && window.Pages[pageName]) {
          this.currentPage = window.Pages[pageName];
          this.destroyCurrentPage = this.currentPage.render(container);
        } else {
          container.innerHTML =
            '<div class="empty-state">' +
            '<div class="empty-state-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2M16 8s-1.5-2-4-2"/></svg></div>' +
            '<div class="empty-state-title">404</div>' +
            '<div class="empty-state-desc">Page not found</div>' +
            '</div>';
        }

        // Remove enter animation after it completes
        clearTimeout(this._pageTransitionTimer);
        this._pageTransitionTimer = setTimeout(() => {
          container.classList.remove('page-enter');
          this._isNavigating = false;
        }, 450);

        container.scrollTop = 0;
      }, 80);
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
      const status = window.ServerConfig?.getStatus() || { connected: false };
      const emailEl = document.getElementById('profile-email');
      const dotEl = document.getElementById('profile-status-dot');
      if (emailEl) {
        emailEl.textContent = status.connected ? 'متصل بالسيرفر' : 'غير متصل';
      }
      if (dotEl) {
        dotEl.classList.toggle('online', !!status.connected);
      }
    },

    async _checkAuthState() {
      const splash = document.getElementById('splash-screen');
      document.addEventListener('server:connected', () => this._showApp());
      document.addEventListener('server:disconnected', () => this._showSetup());

      const status = window.ServerConfig?.getStatus() || { connected: false };
      if (status.connected) {
        this._showApp();
      } else {
        this._showSetup();
      }

      setTimeout(() => {
        splash.classList.add('fade-out');
        setTimeout(() => splash.remove(), 600);
      }, 1500);
    },

    _showApp() {
      document.getElementById('setup-screen').classList.add('hidden');
      document.getElementById('app-shell').classList.remove('hidden');
      this._onRouteChange();
    },

    _showSetup() {
      document.getElementById('setup-screen').classList.remove('hidden');
      document.getElementById('app-shell').classList.add('hidden');
    },

    async _logout() {
      if (window.UIComponents) {
        const confirmed = await window.UIComponents.showConfirm(
          'هل تريد قطع الاتصال بالسيرفر؟ يمكنك إدخال بيانات جديدة في أي وقت.'
        );
        if (!confirmed) return;
      }
      if (window.PlayerManager) window.PlayerManager.stop();
      if (window.ServerConfig) window.ServerConfig.disconnect();
      window.location.hash = '#/';
      this._showSetup();
    },

    _loadTheme() {
      const saved = localStorage.getItem('nasr_theme') || 'dark';
      this._applyTheme(saved);
    },

    _applyTheme(theme) {
      document.body.className = document.body.className.replace(/theme-\w+/g, '').trim();
      document.body.classList.add('theme-' + theme);
      const colors = { dark: '#0a0e17', light: '#f5f6fa', oled: '#000000', blue: '#0a1628' };
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.content = colors[theme] || colors.dark;
      localStorage.setItem('nasr_theme', theme);
    },

    _setupGlobalEvents() {
      window.addEventListener('online', () => {
        if (window.UIComponents) window.UIComponents.showToast('Back online', 'success');
      });
      window.addEventListener('offline', () => {
        if (window.UIComponents) window.UIComponents.showToast('No internet connection', 'error');
      });
      window.addEventListener('popstate', () => {});

      document.addEventListener('languageChanged', (e) => {
        const lang = e.detail?.language || 'ar';
        if (this.currentPageName) this.navigateTo('/' + this.currentPageName);
      });
    },

    _setupInstallPrompt() {
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        this.deferredInstallPrompt = e;
        setTimeout(() => this._showInstallBanner(), 5000);
      });

      document.getElementById('install-btn')?.addEventListener('click', () => this._installApp());
      document.getElementById('install-dismiss')?.addEventListener('click', () => {
        document.getElementById('install-banner').classList.add('hidden');
      });
    },

    _showInstallBanner() {
      if (window.matchMedia('(display-mode: standalone)').matches) return;
      if (!this.deferredInstallPrompt) return;
      if (!document.getElementById('app-shell').classList.contains('hidden')) {
        document.getElementById('install-banner')?.classList.remove('hidden');
      }
    },

    async _installApp() {
      if (!this.deferredInstallPrompt) return;
      this.deferredInstallPrompt.prompt();
      const result = await this.deferredInstallPrompt.userChoice;
      if (result.outcome === 'accepted') {
        if (window.UIComponents) window.UIComponents.showToast('تم تثبيت التطبيق بنجاح!', 'success');
      }
      this.deferredInstallPrompt = null;
      document.getElementById('install-banner')?.classList.add('hidden');
    },

    _registerSW() {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
          .then(reg => {
            console.log('SW registered:', reg.scope);
            reg.addEventListener('updatefound', () => {
              const newWorker = reg.installing;
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'activated') {
                  if (window.UIComponents) {
                    window.UIComponents.showToast('تم تحديث التطبيق!', 'info', 5000);
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