/**
 * NASR LIVE - Settings Page
 * General, Player, Cache, Server, and About sections with persistence.
 */
(function () {
  'use strict';

  var APP_VERSION = '1.0.0';
  var THEMES = [
    { value: 'dark', label: 'settings.dark' },
    { value: 'light', label: 'settings.light' },
    { value: 'oled', label: 'settings.oled' },
    { value: 'blue', label: 'settings.blue' }
  ];
  var LANGUAGES = [
    { value: 'ar', label: 'العربية' },
    { value: 'en', label: 'English' }
  ];
  var QUALITIES = [
    { value: 'auto', label: 'player.auto' },
    { value: '1080p', label: '1080p' },
    { value: '720p', label: '720p' },
    { value: '480p', label: '480p' }
  ];

  function icon(name) {
    var icons = {
      language: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/></svg>',
      theme: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
      quality: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
      autoplay: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
      hardware: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="2" x2="9" y2="4"/><line x1="15" y1="2" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="22"/><line x1="15" y1="20" x2="15" y2="22"/></svg>',
      cache: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>',
      history: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
      server: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>',
      info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
      backup: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
      restore: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
      logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>'
    };
    return icons[name] || icons.info;
  }

  function settingItemHTML(iconName, label, desc, actionHTML) {
    return '<div class="setting-item">' +
      '<div class="setting-item-icon">' + icon(iconName) + '</div>' +
      '<div class="setting-item-content">' +
        '<div class="setting-item-label">' + label + '</div>' +
        (desc ? '<div class="setting-item-desc">' + desc + '</div>' : '') +
      '</div>' +
      '<div class="setting-item-action">' + actionHTML + '</div>' +
    '</div>';
  }

  function toggleHTML(id, checked) {
    return '<label class="toggle-switch">' +
      '<input type="checkbox" id="' + id + '"' + (checked ? ' checked' : '') + '>' +
      '<span class="toggle-switch-track"></span>' +
      '<span class="toggle-switch-thumb"></span>' +
    '</label>';
  }

  function selectHTML(id, options, selected) {
    var html = '<div class="setting-select"><select id="' + id + '">';
    options.forEach(function (opt) {
      var optLabel = opt.label.indexOf('.') !== -1 && window.i18n ? window.i18n.t(opt.label) : opt.label;
      html += '<option value="' + opt.value + '"' + (opt.value === selected ? ' selected' : '') + '>' + optLabel + '</option>';
    });
    html += '</select></div>';
    return html;
  }

  function render(container) {
    var listeners = [];

    container.innerHTML =
      '<div class="settings-container" style="padding:8px 16px 24px">' +
        '<h1 style="font-size:1.25rem;font-weight:700;color:var(--text-primary);margin-bottom:20px" data-i18n="settings.title">' +
          (window.i18n ? window.i18n.t('settings.title') : 'Settings') +
        '</h1>' +

        '<!-- General -->' +
        '<div class="settings-group">' +
          '<div class="settings-group-title" data-i18n="settings.general">' + (window.i18n ? window.i18n.t('settings.general') : 'General') + '</div>' +
          '<div class="settings-group-card">' +
            '<div id="setting-language-item"></div>' +
            '<div id="setting-theme-item"></div>' +
          '</div>' +
        '</div>' +

        '<!-- Player -->' +
        '<div class="settings-group">' +
          '<div class="settings-group-title" data-i18n="settings.player">' + (window.i18n ? window.i18n.t('settings.player') : 'Player') + '</div>' +
          '<div class="settings-group-card">' +
            '<div id="setting-quality-item"></div>' +
            '<div id="setting-autoplay-item"></div>' +
            '<div id="setting-hwaccel-item"></div>' +
          '</div>' +
        '</div>' +

        '<!-- Cache & Storage -->' +
        '<div class="settings-group">' +
          '<div class="settings-group-title" data-i18n="settings.cache">' + (window.i18n ? window.i18n.t('settings.cache') : 'Cache & Storage') + '</div>' +
          '<div class="settings-group-card">' +
            '<div id="setting-cache-item"></div>' +
            '<div id="setting-clearcache-item"></div>' +
            '<div id="setting-clearhistory-item"></div>' +
          '</div>' +
        '</div>' +

        '<!-- Server -->' +
        '<div class="settings-group">' +
          '<div class="settings-group-title" data-i18n="settings.server">' + (window.i18n ? window.i18n.t('settings.server') : 'Server') + '</div>' +
          '<div class="settings-group-card" id="server-info-card"></div>' +
        '</div>' +

        '<!-- About -->' +
        '<div class="settings-group">' +
          '<div class="settings-group-title" data-i18n="settings.about">' + (window.i18n ? window.i18n.t('settings.about') : 'About') + '</div>' +
          '<div class="settings-group-card">' +
            '<div id="setting-version-item"></div>' +
            '<div id="setting-backup-item"></div>' +
            '<div id="setting-restore-item"></div>' +
            '<div id="setting-logout-item"></div>' +
          '</div>' +
        '</div>' +

        '<!-- Logout Confirm Modal -->' +
        '<div class="modal-overlay" id="logout-modal">' +
          '<div class="modal-panel">' +
            '<div class="modal-title">' + (window.i18n ? window.i18n.t('settings.confirmLogout') : 'Do you want to logout?') + '</div>' +
            '<div class="modal-actions">' +
              '<button class="btn btn-secondary" id="logout-cancel">' + (window.i18n ? window.i18n.t('common.cancel') : 'Cancel') + '</button>' +
              '<button class="btn btn-danger" id="logout-confirm">' + (window.i18n ? window.i18n.t('settings.logout') : 'Logout') + '</button>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<input type="file" id="restore-file-input" accept=".json" style="display:none">' +
      '</div>';

    var logoutModal = container.querySelector('#logout-modal');
    var restoreInput = container.querySelector('#restore-file-input');

    function initSettings() {
      var db = window.AppDB;
      if (!db) return;

      Promise.all([
        db.getSetting('language', (window.i18n ? window.i18n.getCurrentLang() : 'ar')),
        db.getSetting('theme', 'dark'),
        db.getSetting('quality', 'auto'),
        db.getSetting('autoplay', true),
        db.getSetting('hwaccel', true)
      ]).then(function (vals) {
        var lang = vals[0];
        var theme = vals[1];
        var quality = vals[2];
        var autoplay = vals[3];
        var hwaccel = vals[4];

        container.querySelector('#setting-language-item').innerHTML = settingItemHTML(
          'language',
          window.i18n ? window.i18n.t('settings.language') : 'Language',
          '',
          selectHTML('setting-language', LANGUAGES, lang)
        );

        container.querySelector('#setting-theme-item').innerHTML = settingItemHTML(
          'theme',
          window.i18n ? window.i18n.t('settings.theme') : 'Theme',
          '',
          selectHTML('setting-theme', THEMES, theme)
        );

        container.querySelector('#setting-quality-item').innerHTML = settingItemHTML(
          'quality',
          window.i18n ? window.i18n.t('settings.defaultQuality') : 'Default Quality',
          '',
          selectHTML('setting-quality', QUALITIES, quality)
        );

        container.querySelector('#setting-autoplay-item').innerHTML = settingItemHTML(
          'autoplay',
          window.i18n ? window.i18n.t('settings.autoplay') : 'Autoplay Next',
          '',
          toggleHTML('setting-autoplay', autoplay)
        );

        container.querySelector('#setting-hwaccel-item').innerHTML = settingItemHTML(
          'hardware',
          window.i18n ? window.i18n.t('settings.hardwareAccel') : 'Hardware Acceleration',
          '',
          toggleHTML('setting-hwaccel', hwaccel)
        );

        container.querySelector('#setting-cache-item').innerHTML = settingItemHTML(
          'cache',
          window.i18n ? window.i18n.t('settings.storageUsed') : 'Cache Size',
          '<span id="cache-size-label">...</span>',
          ''
        );

        container.querySelector('#setting-clearcache-item').innerHTML = settingItemHTML(
          'cache',
          window.i18n ? window.i18n.t('settings.clearCache') : 'Clear Cache',
          '',
          '<button class="btn btn-secondary btn-sm" id="btn-clear-cache">' + (window.i18n ? window.i18n.t('settings.clearCache') : 'Clear Cache') + '</button>'
        );

        container.querySelector('#setting-clearhistory-item').innerHTML = settingItemHTML(
          'history',
          window.i18n ? window.i18n.t('settings.cache') : 'Watch History',
          (window.i18n ? window.i18n.t('settings.cache') : 'Cache') + ' & ' + (window.i18n ? window.i18n.t('settings.player') : 'History'),
          '<button class="btn btn-secondary btn-sm" id="btn-clear-history">' + (window.i18n ? window.i18n.t('home.seeAll') : 'Clear History') + '</button>'
        );

        container.querySelector('#setting-version-item').innerHTML = settingItemHTML(
          'info',
          window.i18n ? window.i18n.t('settings.version') : 'Version',
          APP_VERSION,
          ''
        );

        container.querySelector('#setting-backup-item').innerHTML = settingItemHTML(
          'backup',
          window.i18n ? window.i18n.t('settings.backup') : 'Backup',
          '',
          '<button class="btn btn-secondary btn-sm" id="btn-backup">' + (window.i18n ? window.i18n.t('settings.backup') : 'Backup') + '</button>'
        );

        container.querySelector('#setting-restore-item').innerHTML = settingItemHTML(
          'restore',
          window.i18n ? window.i18n.t('settings.restore') : 'Restore',
          '',
          '<button class="btn btn-secondary btn-sm" id="btn-restore">' + (window.i18n ? window.i18n.t('settings.restore') : 'Restore') + '</button>'
        );

        container.querySelector('#setting-logout-item').innerHTML = settingItemHTML(
          'logout',
          window.i18n ? window.i18n.t('settings.logout') : 'Logout',
          '',
          '<button class="btn btn-danger btn-sm" id="btn-logout">' + (window.i18n ? window.i18n.t('settings.logout') : 'Logout') + '</button>'
        );

        bindEvents(lang, theme, quality, autoplay, hwaccel);
        loadCacheSize();
        loadServerInfo();
      });
    }

    function bindEvents(lang, theme, quality, autoplay, hwaccel) {
      function onSettingChange(id, key) {
        var el = container.querySelector('#' + id);
        if (!el) return;
        el.addEventListener('change', function () {
          window.AppDB.setSetting(key, el.value || el.checked);
          if (key === 'language' && window.i18n) {
            window.i18n.setLanguage(el.value);
          }
          if (key === 'theme') {
            document.body.classList.remove('theme-dark', 'theme-light', 'theme-oled', 'theme-blue');
            document.body.classList.add('theme-' + el.value);
          }
        });
      }

      onSettingChange('setting-language', 'language');
      onSettingChange('setting-theme', 'theme');
      onSettingChange('setting-quality', 'quality');
      onSettingChange('setting-autoplay', 'autoplay');
      onSettingChange('setting-hwaccel', 'hwaccel');

      var clearCacheBtn = container.querySelector('#btn-clear-cache');
      if (clearCacheBtn) {
        clearCacheBtn.addEventListener('click', function () {
          if (window.AppDB) {
            window.AppDB.clearCache().then(function () {
              loadCacheSize();
            });
          }
        });
      }

      var clearHistBtn = container.querySelector('#btn-clear-history');
      if (clearHistBtn) {
        clearHistBtn.addEventListener('click', function () {
          if (window.AppDB) {
            window.AppDB.clearHistory().then(function () {});
          }
        });
      }

      var backupBtn = container.querySelector('#btn-backup');
      if (backupBtn) {
        backupBtn.addEventListener('click', function () {
          window.AppDB.getSetting('language', 'ar').then(function (l) {
            window.AppDB.getSetting('theme', 'dark').then(function (t) {
              window.AppDB.getSetting('quality', 'auto').then(function (q) {
                window.AppDB.getSetting('autoplay', true).then(function (a) {
                  window.AppDB.getSetting('hwaccel', true).then(function (h) {
                    var data = { language: l, theme: t, quality: q, autoplay: a, hwaccel: h, version: APP_VERSION };
                    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    var url = URL.createObjectURL(blob);
                    var a = document.createElement('a');
                    a.href = url;
                    a.download = 'nasr-live-backup.json';
                    a.click();
                    URL.revokeObjectURL(url);
                  });
                });
              });
            });
          });
        });
      }

      var restoreBtn = container.querySelector('#btn-restore');
      if (restoreBtn) {
        restoreBtn.addEventListener('click', function () {
          restoreInput.click();
        });
        restoreInput.addEventListener('change', function (e) {
          var file = e.target.files[0];
          if (!file) return;
          var reader = new FileReader();
          reader.onload = function (ev) {
            try {
              var data = JSON.parse(ev.target.result);
              if (data.language) window.AppDB.setSetting('language', data.language);
              if (data.theme) window.AppDB.setSetting('theme', data.theme);
              if (data.quality) window.AppDB.setSetting('quality', data.quality);
              if (data.autoplay !== undefined) window.AppDB.setSetting('autoplay', data.autoplay);
              if (data.hwaccel !== undefined) window.AppDB.setSetting('hwaccel', data.hwaccel);
              if (data.language && window.i18n) window.i18n.setLanguage(data.language);
              if (data.theme) {
                document.body.classList.remove('theme-dark', 'theme-light', 'theme-oled', 'theme-blue');
                document.body.classList.add('theme-' + data.theme);
              }
            } catch (err) {}
          };
          reader.readAsText(file);
          restoreInput.value = '';
        });
      }

      var logoutBtn = container.querySelector('#btn-logout');
      var logoutCancel = container.querySelector('#logout-cancel');
      var logoutConfirm = container.querySelector('#logout-confirm');

      if (logoutBtn) logoutBtn.addEventListener('click', function () { logoutModal.classList.add('active'); });
      if (logoutCancel) logoutCancel.addEventListener('click', function () { logoutModal.classList.remove('active'); });
      if (logoutConfirm) {
        logoutConfirm.addEventListener('click', function () {
          logoutModal.classList.remove('active');
          if (window.AuthService) window.AuthService.signOut();
          if (window.AppRouter) window.AppRouter.navigate('login');
        });
      }
      logoutModal.addEventListener('click', function (e) { if (e.target === logoutModal) logoutModal.classList.remove('active'); });
    }

    function loadCacheSize() {
      if (!window.indexedDB) {
        var label = container.querySelector('#cache-size-label');
        if (label) label.textContent = 'N/A';
        return;
      }
      var req = indexedDB.open('nasr-live-db');
      req.onsuccess = function (e) {
        var db = e.target.result;
        var stores = ['cache', 'favorites', 'watchHistory', 'settings'];
        var total = 0;
        var counted = 0;
        stores.forEach(function (storeName) {
          if (!db.objectStoreNames.contains(storeName)) { counted++; if (counted === stores.length) showSize(total); return; }
          var tx = db.transaction(storeName, 'readonly');
          var store = tx.objectStore(storeName);
          var countReq = store.count();
          countReq.onsuccess = function () { total += countReq.result; counted++; if (counted === stores.length) showSize(total); };
          countReq.onerror = function () { counted++; if (counted === stores.length) showSize(total); };
        });
      };
      function showSize(count) {
        var label = container.querySelector('#cache-size-label');
        if (label) label.textContent = count + ' entries';
      }
    }

    function loadServerInfo() {
      var api = (window.AuthService && window.AuthService.getXtreamClient()) || null;
      var card = container.querySelector('#server-info-card');
      if (!api || !api.isAuthenticated()) {
        card.innerHTML = settingItemHTML('server',
          window.i18n ? window.i18n.t('settings.serverStatus') : 'Server Status',
          '<span style="color:var(--danger)">' + (window.i18n ? window.i18n.t('settings.disconnected') : 'Disconnected') + '</span>',
          ''
        );
        return;
      }

      var info = api.getUserInfo() || {};
      var statusText = info.status === 'Active'
        ? '<span style="color:var(--success)">' + (window.i18n ? window.i18n.t('settings.connected') : 'Connected') + '</span>'
        : '<span style="color:var(--danger)">' + (info.status || 'Unknown') + '</span>';

      var expDate = info.exp_date ? new Date(info.exp_date * 1000).toLocaleDateString() : 'N/A';
      var activeConn = info.active_cons || 0;
      var maxConn = info.max_connections || '?';
      var username = info.username || '';

      card.innerHTML =
        settingItemHTML('server',
          window.i18n ? window.i18n.t('settings.serverStatus') : 'Server Status',
          statusText, ''
        ) +
        settingItemHTML('server',
          window.i18n ? window.i18n.t('auth.username') : 'Username',
          username, ''
        ) +
        settingItemHTML('info',
          window.i18n ? window.i18n.t('profile.expDate') : 'Account Expiry',
          expDate, ''
        ) +
        settingItemHTML('info',
          (window.i18n ? window.i18n.t('profile.activeConnections') : 'Active') + ' / ' + (window.i18n ? window.i18n.t('profile.maxConnections') : 'Max'),
          activeConn + ' / ' + maxConn, ''
        );
    }

    if (window.i18n && window.i18n.isReady()) window.i18n._applyTranslations();

    if (window.AppDB) {
      initSettings();
    }

    return function destroy() {
      listeners.forEach(function (l) { if (l.fn) l.el.removeEventListener(l.ev, l.fn); });
    };
  }

  window.Pages = window.Pages || {};
  window.Pages.settings = { render: render };
})();