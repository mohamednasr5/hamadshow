/**
 * NASR LIVE - Video Player Manager
 * HLS, MP4, Live Stream support with full controls
 * Enhanced: multi-strategy live stream playback with smart fallbacks
 */
(function() {
  'use strict';

  class PlayerManager {
    constructor() {
      this.overlay = document.getElementById('player-overlay');
      this.container = document.getElementById('player-container');
      this.video = document.getElementById('video-player');
      this.controls = document.getElementById('player-controls');
      this.miniPlayer = document.getElementById('mini-player');
      this.loading = document.getElementById('player-loading');
      this.errorEl = document.getElementById('player-error');
      this.gestureFeedback = document.getElementById('player-gesture-feedback');

      this.hls = null;
      this.dash = null;
      this.controlsTimeout = null;
      this.isLive = false;
      this.currentItem = null;
      this.retryCount = 0;
      this.maxRetries = 3;
      this.controlsVisible = true;
      this.isDragging = false;
      this.gestureStartY = 0;
      this.gestureStartX = 0;
      this.gestureType = null;
      this.savedVolume = 1;
      this.speedOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
      this.currentSpeedIndex = 3;
      this.listeners = {};
      this.doubleTapTimer = null;
      this.lastTapTime = 0;

      // Multi-strategy fallback for live streams
      this._fallbackUrls = [];
      this._fallbackIndex = 0;
      this._triedStrategies = new Set();

      this._bindElements();
      this._bindEvents();
    }

    _bindElements() {
      this.els = {
        back: document.getElementById('player-back'),
        title: document.getElementById('player-title'),
        playBtn: document.getElementById('player-play'),
        prev: document.getElementById('player-prev'),
        next: document.getElementById('player-next'),
        pip: document.getElementById('player-pip'),
        cast: document.getElementById('player-cast'),
        currentTime: document.getElementById('player-current-time'),
        duration: document.getElementById('player-duration'),
        progress: document.getElementById('player-progress'),
        buffer: document.getElementById('player-buffer'),
        progressFill: document.getElementById('player-progress-fill'),
        progressThumb: document.getElementById('player-progress-thumb'),
        subtitles: document.getElementById('player-subtitles'),
        audio: document.getElementById('player-audio'),
        speed: document.getElementById('player-speed'),
        fullscreen: document.getElementById('player-fullscreen'),
        tapZone: document.getElementById('player-tap-zone'),
        retry: document.getElementById('player-retry'),
        miniThumb: document.getElementById('mini-player-thumbnail'),
        miniTitle: document.getElementById('mini-player-title'),
        miniChannel: document.getElementById('mini-player-channel'),
        miniPlay: document.getElementById('mini-play'),
        miniClose: document.getElementById('mini-close')
      };
    }

    _bindEvents() {
      const v = this.video;

      this._on(v, 'play', () => { this._updatePlayButton(); this._dispatch('play'); });
      this._on(v, 'pause', () => { this._updatePlayButton(); this._dispatch('pause'); });
      this._on(v, 'ended', () => {
        this._dispatch('end');
        if (this.currentItem && this.currentItem.onEnded) this.currentItem.onEnded();
      });
      this._on(v, 'timeupdate', () => this._onTimeUpdate());
      this._on(v, 'progress', () => this._onProgress());
      this._on(v, 'waiting', () => this._showLoading());
      this._on(v, 'canplay', () => this._hideLoading());
      this._on(v, 'playing', () => this._hideLoading());
      this._on(v, 'error', () => this._onVideoError());
      this._on(v, 'volumechange', () => this._updateVolumeIcon());

      this._on(this.els.playBtn, 'click', () => this._togglePlay());
      this._on(this.els.back, 'click', () => this._goBack());
      this._on(this.els.fullscreen, 'click', () => this._toggleFullscreen());
      this._on(this.els.pip, 'click', () => this._togglePiP());
      this._on(this.els.speed, 'click', () => this._cycleSpeed());
      this._on(this.els.prev, 'click', () => this._dispatch('prev'));
      this._on(this.els.next, 'click', () => this._dispatch('next'));
      this._on(this.els.retry, 'click', () => this._retry());
      this._on(this.els.miniPlay, 'click', () => this._togglePlay());
      this._on(this.els.miniClose, 'click', () => this.stop());
      this._on(this.els.miniPlayer, 'click', (e) => {
        if (e.target === this.els.miniPlay || e.target.closest('#mini-play') ||
            e.target === this.els.miniClose || e.target.closest('#mini-close')) return;
        this._expandFromMini();
      });

      // Progress bar
      this._on(this.els.progress, 'click', (e) => this._seekTo(e));
      this._on(this.els.progress, 'mousedown', () => this.isDragging = true);
      this._on(this.els.progress, 'touchstart', () => this.isDragging = true, {passive: true});
      this._on(document, 'mouseup', () => this.isDragging = false);
      this._on(document, 'touchend', () => this.isDragging = false);

      // Tap zone for double-tap seek and gesture
      this._on(this.els.tapZone, 'touchstart', (e) => this._onGestureStart(e), {passive: true});
      this._on(this.els.tapZone, 'touchmove', (e) => this._onGestureMove(e), {passive: true});
      this._on(this.els.tapZone, 'touchend', (e) => this._onGestureEnd(e));
      this._on(this.els.tapZone, 'click', (e) => this._onTap(e));

      // Mouse move to show controls
      this._on(this.container, 'mousemove', () => this._showControls());
      this._on(this.container, 'mouseleave', () => this._startHideTimer());

      // Keyboard
      this._onKey('keydown', (e) => this._onKeyDown(e));

      // Fullscreen change
      document.addEventListener('fullscreenchange', () => this._onFullscreenChange());
      document.addEventListener('webkitfullscreenchange', () => this._onFullscreenChange());
    }

    _on(el, event, handler, opts) {
      if (!el) return;
      el.addEventListener(event, handler, opts);
      if (!this.listeners[event]) this.listeners[event] = [];
      this.listeners[event].push({el, handler});
    }

    _onKey(event, handler) {
      document.addEventListener(event, handler);
      this.listeners._keyHandler = handler;
    }

    play(options) {
      this.currentItem = options;
      this.isLive = options.type === 'live';
      this.retryCount = 0;

      // Update UI
      this.els.title.textContent = options.name || '';
      document.title = (options.name || 'NASR LIVE') + ' - NASR LIVE';

      // Mini player thumbnail
      if (options.logo) {
        this.els.miniThumb.style.backgroundImage = `url(${options.logo})`;
      }
      this.els.miniTitle.textContent = options.name || '';
      this.els.miniChannel.textContent = options.episodeInfo || options.type || '';

      // Show overlay
      this.overlay.classList.remove('hidden');
      this.errorEl.classList.add('hidden');
      this._showLoading();

      // Hide progress bar for live
      const bottomBar = this.els.progress.closest('.controls-bottom');
      if (this.isLive) {
        this.els.currentTime.textContent = 'LIVE';
        this.els.duration.textContent = '';
        this.els.progress.style.display = 'none';
      } else {
        this.els.progress.style.display = '';
      }

      // Show/hide prev/next
      this.els.prev.style.display = options.type === 'series' ? '' : 'none';
      this.els.next.style.display = options.type === 'series' ? '' : 'none';

      // PiP support check
      if (document.pictureInPictureEnabled) {
        this.els.pip.classList.remove('hidden');
      }

      // Store fallback URLs for live streams
      this._fallbackUrls = options.streamUrlFallbacks || [];
      this._fallbackIndex = 0;
      this._triedStrategies = new Set();

      // Load stream
      this._loadStream(options.streamUrl);

      // Resume position for VOD
      if (!this.isLive && options.id && window.AppDB) {
        window.AppDB.getHistory(options.type).then(history => {
          const item = history.find(h => h.id == options.id);
          if (item && item.position > 5) {
            this.video.currentTime = item.position;
          }
        });
      }

      this._showControls();
      this._dispatch('play');
    }

    /**
     * Cleans up the video element and any active HLS/DASH instances.
     */
    _cleanup() {
      if (this.hls) {
        try { this.hls.destroy(); } catch(e) {}
        this.hls = null;
      }
      if (this.dash) {
        try { this.dash.destroy(); } catch(e) {}
        this.dash = null;
      }
      // Remove any <source> elements we may have added
      var sources = this.video.querySelectorAll('source');
      for (var i = 0; i < sources.length; i++) sources[i].remove();
      this.video.removeAttribute('src');
      this.video.load(); // Reset the video element
    }

    /**
     * Helper to attempt playback with unmute fallback for autoplay restrictions.
     */
    _attemptPlay() {
      var self = this;
      var playPromise = this.video.play();
      if (playPromise !== undefined) {
        playPromise.then(function() {
          self.video.muted = false;
        }).catch(function(err) {
          console.warn('Autoplay blocked, trying muted:', err.message);
          self.video.muted = true;
          self.video.play().then(function() {
            self._showGesture('volume', 'Muted - tap to unmute');
          }).catch(function() {
            // If even muted autoplay fails, try next fallback
            self._tryNextFallback();
          });
        });
      }
    }

    /**
     * Detects the URL type: 'hls', 'ts', 'dash', or 'other'.
     */
    _detectUrlType(url) {
      var cleanUrl = (url || '').split('?')[0].split('#')[0];
      if (/\.(m3u8)($|\?)/i.test(url) || cleanUrl.indexOf('m3u8') !== -1) return 'hls';
      if (/\.(ts)($|\?)/i.test(url) || cleanUrl.endsWith('.ts')) return 'ts';
      if (/\.(mpd|ism|ismv)($|\?)/i.test(url)) return 'dash';
      return 'other';
    }

    /**
     * Main stream loading method with multi-strategy support for live streams.
     * 
     * For live streams, it tries these strategies in order:
     * 1. HLS.js (for .m3u8 URLs)
     * 2. Native <video> with explicit MIME type
     * 3. Native <video> with <source> element
     * 
     * If any strategy fails, it automatically tries the next one,
     * and when all strategies for a URL are exhausted, moves to the next fallback URL.
     */
    _loadStream(url, strategy) {
      this._cleanup();
      this._showLoading();

      var urlType = this._detectUrlType(url);
      strategy = strategy || this._pickBestStrategy(urlType);

      var strategyKey = url + '::' + strategy;
      if (this._triedStrategies.has(strategyKey)) {
        // Already tried this combination, move to next
        this._tryNextFallback();
        return;
      }
      this._triedStrategies.add(strategyKey);

      console.log('[Player] Loading:', urlType, 'strategy:', strategy);

      var isDASH = urlType === 'dash';

      if (isDASH) {
        if (window.dashjs) {
          this.dash = window.dashjs.MediaPlayer().create();
          this.dash.initialize(this.video, url, false);
          this.dash.on(window.dashjs.MediaPlayer.events.CAN_PLAY, () => this._attemptPlay());
          this.dash.on(window.dashjs.MediaPlayer.events.ERROR, () => this._tryNextFallback());
        } else {
          this._tryNextFallback();
        }
        return;
      }

      // ─── HLS Strategy (HLS.js) ───
      if (strategy === 'hlsjs' && urlType === 'hls') {
        this._playWithHlsJs(url);
        return;
      }

      // ─── HLS.js with generated manifest for .ts streams ───
      if (strategy === 'hlsjs-manifest' && urlType === 'ts') {
        this._playWithHlsJsManifest(url);
        return;
      }

      // ─── Native video with src attribute ───
      if (strategy === 'native-src') {
        this._playNativeSrc(url);
        return;
      }

      // ─── Native video with <source> element (better MIME detection) ───
      if (strategy === 'native-source') {
        this._playNativeSource(url, urlType);
        return;
      }

      // ─── Native HLS (Safari / iOS) ───
      if (strategy === 'native-hls') {
        this.video.src = url;
        this._attemptPlay();
        return;
      }

      // Fallback: try native src
      this._playNativeSrc(url);
    }

    /**
     * Picks the best playback strategy for the given URL type.
     */
    _pickBestStrategy(urlType) {
      if (urlType === 'hls') {
        if (window.Hls && window.Hls.isSupported()) return 'hlsjs';
        if (this.video.canPlayType('application/vnd.apple.mpegurl')) return 'native-hls';
        return 'native-src';
      }

      if (urlType === 'ts') {
        // For .ts live streams: native-src is the most compatible first try
        return 'native-src';
      }

      // For other types (mkv, mp4, etc.)
      return 'native-src';
    }

    /**
     * Strategy: Play .m3u8 using HLS.js with robust settings for IPTV servers.
     */
    _playWithHlsJs(url) {
      var self = this;

      this.hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: this.isLive,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        startFragPrefetch: true,
        // Robustness settings for IPTV servers
        testBandwidth: false,
        manifestLoadingTimeOut: 15000,
        manifestLoadingMaxRetry: 2,
        levelLoadingTimeOut: 15000,
        levelLoadingMaxRetry: 3,
        fragLoadingTimeOut: 20000,
        fragLoadingMaxRetry: 5,
        // Try to recover from network errors automatically
        abrEwmaDefaultEstimate: 500000,
        // Don't be strict about HLS spec compliance
        strictMode: false
      });

      this.hls.loadSource(url);
      this.hls.attachMedia(this.video);

      this.hls.on(window.Hls.Events.MANIFEST_PARSED, function() {
        console.log('[Player] HLS manifest parsed successfully');
        self._attemptPlay();
      });

      this.hls.on(window.Hls.Events.ERROR, function(event, data) {
        console.warn('[Player] HLS error:', data.type, data.details, data.fatal);

        if (data.fatal) {
          switch (data.type) {
            case window.Hls.ErrorTypes.NETWORK_ERROR:
              // For live streams, try next fallback instead of just retrying
              if (self.isLive) {
                self._tryNextFallback();
              } else {
                // For VOD, retry the same URL a few times
                self.retryCount++;
                if (self.retryCount <= self.maxRetries) {
                  setTimeout(function() {
                    if (self.hls) self.hls.loadSource(url);
                  }, 2000 * self.retryCount);
                } else {
                  self._tryNextFallback();
                }
              }
              break;
            case window.Hls.ErrorTypes.MEDIA_ERROR:
              console.warn('[Player] HLS media error, trying recovery...');
              if (self.hls) self.hls.recoverMediaError();
              else self._tryNextFallback();
              break;
            default:
              self._tryNextFallback();
              break;
          }
        }
      });
    }

    /**
     * Strategy: For .ts live streams, create a fake HLS manifest and load
     * through HLS.js. This allows HLS.js to handle the TS demuxing
     * (using its built-in mux.js) which browsers can't do natively.
     */
    _playWithHlsJsManifest(url) {
      if (!window.Hls || !window.Hls.isSupported()) {
        console.warn('[Player] HLS.js not available, skipping manifest strategy');
        this._tryNextFallback();
        return;
      }

      var self = this;

      // Create a minimal live HLS manifest pointing to the TS URL
      var manifestContent = '#EXTM3U\n' +
        '#EXT-X-VERSION:3\n' +
        '#EXT-X-TARGETDURATION:10\n' +
        '#EXTINF:10.0,\n' +
        url + '\n';

      var blob = new Blob([manifestContent], { type: 'application/vnd.apple.mpegurl' });
      var manifestUrl = URL.createObjectURL(blob);

      console.log('[Player] Trying .ts via HLS.js with generated manifest');

      this.hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        startFragPrefetch: true,
        testBandwidth: false,
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 0,
        levelLoadingTimeOut: 15000,
        levelLoadingMaxRetry: 3,
        fragLoadingTimeOut: 30000,
        fragLoadingMaxRetry: 5,
        strictMode: false
      });

      this.hls.loadSource(manifestUrl);
      this.hls.attachMedia(this.video);

      this.hls.on(window.Hls.Events.MANIFEST_PARSED, function() {
        console.log('[Player] Generated HLS manifest parsed, playing .ts via HLS.js');
        self._attemptPlay();
      });

      this.hls.on(window.Hls.Events.ERROR, function(event, data) {
        console.warn('[Player] HLS manifest strategy error:', data.type, data.details);
        URL.revokeObjectURL(manifestUrl);
        if (data.fatal) {
          self._tryNextFallback();
        }
      });

      // Clean up blob URL when done
      this.video.addEventListener('error', function() {
        URL.revokeObjectURL(manifestUrl);
      }, { once: true });
    }

    /**
     * Strategy: Play URL using native video.src (works for mp4, webm, and some servers' .ts)
     */
    _playNativeSrc(url) {
      var self = this;
      console.log('[Player] Trying native video.src:', url);
      this.video.src = url;
      this._attemptPlay();
      // The 'error' event on video will trigger _onVideoError → _tryNextFallback
    }

    /**
     * Strategy: Play URL using <source> element with explicit MIME type.
     * Better for format detection on mobile browsers.
     */
    _playNativeSource(url, urlType) {
      var self = this;
      console.log('[Player] Trying native <source> element:', url, 'type:', urlType);

      // Remove any existing source elements
      var existingSources = this.video.querySelectorAll('source');
      for (var i = 0; i < existingSources.length; i++) existingSources[i].remove();

      var sourceEl = document.createElement('source');
      sourceEl.src = url;

      // Set MIME type based on URL extension
      if (urlType === 'ts') {
        sourceEl.type = 'video/mp2t';  // MPEG-TS
      } else if (urlType === 'hls') {
        sourceEl.type = 'application/vnd.apple.mpegurl';
      } else {
        // Try to infer from extension
        if (/\.mp4/i.test(url)) sourceEl.type = 'video/mp4';
        else if (/\.webm/i.test(url)) sourceEl.type = 'video/webm';
        else if (/\.mkv/i.test(url)) sourceEl.type = 'video/x-matroska';
      }

      this.video.appendChild(sourceEl);
      this.video.load(); // Important: must call load() after adding <source>

      this._attemptPlay();
    }

    /**
     * Called when the native <video> element fires an 'error' event.
     * Tries the next fallback strategy or URL.
     */
    _onVideoError() {
      var error = this.video.error;
      if (error) {
        console.warn('[Player] Video error:', error.code, error.message);
      }

      // Don't try fallback if HLS.js or DASH is handling playback
      // (they have their own error handlers)
      if (this.hls || this.dash) return;

      this._tryNextFallback();
    }

    /**
     * Tries the next available fallback strategy or URL.
     * For live streams, it cycles through all strategies for each URL
     * before moving to the next URL.
     */
    _tryNextFallback() {
      if (!this.currentItem) return;

      // Clean up current playback
      this._cleanup();

      // Get all possible strategies for each URL
      var allUrls = [this.currentItem.streamUrl].concat(this._fallbackUrls);
      var strategies = {
        'hls': ['hlsjs', 'native-src', 'native-hls'],
        'ts': ['native-src', 'native-source', 'hlsjs-manifest'],
        'other': ['native-src', 'native-source']
      };

      // Try each URL with each strategy
      for (var i = 0; i < allUrls.length; i++) {
        var url = allUrls[i];
        var urlType = this._detectUrlType(url);
        var urlStrategies = strategies[urlType] || strategies['other'];

        for (var j = 0; j < urlStrategies.length; j++) {
          var strategy = urlStrategies[j];
          var key = url + '::' + strategy;

          // Skip if we already tried this combination
          if (this._triedStrategies.has(key)) continue;

          // Skip native-hls on browsers that don't support it
          if (strategy === 'native-hls' && !this.video.canPlayType('application/vnd.apple.mpegurl')) continue;

          // Skip hlsjs on browsers that don't support it
          if ((strategy === 'hlsjs' || strategy === 'hlsjs-manifest') && !(window.Hls && window.Hls.isSupported())) continue;

          console.log('[Player] Trying fallback:', strategy, 'URL:', url);
          this._loadStream(url, strategy);
          return; // Return after starting the first untried combination
        }
      }

      // All strategies exhausted — show error
      console.error('[Player] All playback strategies exhausted');
      this._showErrorFinal();
    }

    /**
     * Shows the final error after all fallback strategies are exhausted.
     */
    _showErrorFinal() {
      this.loading.classList.add('hidden');
      this.errorEl.classList.remove('hidden');

      // On mobile, offer to open in external player
      if (this.isLive && this.currentItem && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
        var errorDesc = this.errorEl.querySelector('p');
        if (errorDesc) {
          var externalLink = document.createElement('a');
          externalLink.href = this.currentItem.streamUrl;
          externalLink.target = '_blank';
          externalLink.rel = 'noopener';
          externalLink.textContent = '\n\n\u0627\u0641\u062A\u062D \u0641\u064A \u0645\u0634\u063A\u0644 \u062E\u0627\u0631\u062C\u064A';
          externalLink.style.color = 'var(--accent)';
          externalLink.style.display = 'block';
          externalLink.style.marginTop = '12px';
          externalLink.style.textDecoration = 'underline';
          errorDesc.appendChild(document.createElement('br'));
          errorDesc.appendChild(externalLink);
        }
      }
    }

    // Alias for compatibility
    _showError() {
      this.loading.classList.add('hidden');
      this.errorEl.classList.remove('hidden');
    }

    pause() { this.video.pause(); }
    resume() { this.video.play().catch(() => {}); }
    stop() {
      this._cleanup();
      this.overlay.classList.add('hidden');
      this.miniPlayer.classList.add('hidden');
      this.currentItem = null;
      this._fallbackUrls = [];
      this._triedStrategies = new Set();
      document.title = 'NASR LIVE';
      this._dispatch('stop');
    }

    seek(time) { if (!this.isLive) this.video.currentTime = time; }
    setSpeed(speed) { this.video.playbackRate = speed; }

    isPlaying() { return !this.video.paused; }

    _togglePlay() {
      if (this.video.muted && this.video.src) {
        this.video.muted = false;
      }
      if (this.video.paused) {
        this.video.play().catch(() => {});
      } else {
        this.video.pause();
      }
      this._updatePlayButton();
    }

    _updatePlayButton() {
      const icon = this.els.playBtn.querySelector('svg');
      if (this.video.paused) {
        icon.innerHTML = '<polygon points="5 3 19 12 5 21" fill="currentColor"/>';
      } else {
        icon.innerHTML = '<rect x="6" y="4" width="4" height="16" fill="currentColor"/><rect x="14" y="4" width="4" height="16" fill="currentColor"/>';
      }
    }

    _showControls() {
      this.controlsVisible = true;
      this.controls.classList.add('visible');
      this.container.style.cursor = '';
      this._startHideTimer();
    }

    _hideControls() {
      if (this.video.paused) return;
      this.controlsVisible = false;
      this.controls.classList.remove('visible');
      this.container.style.cursor = 'none';
    }

    _startHideTimer() {
      clearTimeout(this.controlsTimeout);
      this.controlsTimeout = setTimeout(() => this._hideControls(), 3000);
    }

    _onTimeUpdate() {
      if (this.isDragging) return;
      const cur = this.video.currentTime;
      const dur = this.video.duration || 0;
      if (!this.isLive && isFinite(dur)) {
        this.els.currentTime.textContent = this._formatTime(cur);
        this.els.duration.textContent = this._formatTime(dur);
        const pct = (cur / dur) * 100;
        this.els.progressFill.style.width = pct + '%';
        this.els.progressThumb.style.left = pct + '%';
      }
      this._dispatch('timeupdate', {currentTime: cur, duration: dur});

      if (!this.isLive && this.currentItem && this.currentItem.id && window.AppDB) {
        window.AppDB.updateHistoryPosition(this.currentItem.id, cur, dur);
      }
    }

    _onProgress() {
      if (this.video.buffered.length > 0 && !this.isLive) {
        const buf = this.video.buffered.end(this.video.buffered.length - 1);
        const dur = this.video.duration || 1;
        this.els.buffer.style.width = ((buf / dur) * 100) + '%';
      }
    }

    _seekTo(e) {
      if (this.isLive) return;
      const rect = this.els.progress.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      this.video.currentTime = pct * (this.video.duration || 0);
    }

    _onTap(e) {
      if (e.target.closest('.controls-top') || e.target.closest('.controls-center') || e.target.closest('.controls-bottom')) {
        return;
      }

      const now = Date.now();
      const rect = this.els.tapZone.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const w = rect.width;

      if (now - this.lastTapTime < 300) {
        clearTimeout(this.doubleTapTimer);
        if (!this.isLive) {
          if (x < w / 3) {
            this._seekRelative(-10);
            this._showGesture('seek', '\u2190 10s');
          } else if (x > (w * 2 / 3)) {
            this._seekRelative(10);
            this._showGesture('seek', '10s \u2192');
          } else {
            this._toggleFullscreen();
          }
        } else {
          if (x > w / 2) {
            this._toggleFullscreen();
          }
        }
        this.lastTapTime = 0;
      } else {
        this.lastTapTime = now;
        this.doubleTapTimer = setTimeout(() => {
          if (this.controlsVisible) {
            this._togglePlay();
          } else {
            this._showControls();
          }
        }, 300);
      }
    }

    _onGestureStart(e) {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      const rect = this.els.tapZone.getBoundingClientRect();
      this.gestureStartX = touch.clientX;
      this.gestureStartY = touch.clientY;
      this.gestureStartVol = this.video.volume;
      this.gestureStartBrightness = 1;
      this.gestureType = null;

      if (touch.clientX - rect.left < rect.width / 2) {
        this.gestureType = 'brightness';
      } else {
        this.gestureType = 'volume';
      }
    }

    _onGestureMove(e) {
      if (!this.gestureType || e.touches.length !== 1) return;
      e.preventDefault();
      const touch = e.touches[0];
      const dy = this.gestureStartY - touch.clientY;
      const delta = dy / 200;

      if (this.gestureType === 'volume') {
        const vol = Math.max(0, Math.min(1, this.gestureStartVol + delta));
        this.video.volume = vol;
        this._showGesture('volume', Math.round(vol * 100) + '%');
      } else if (this.gestureType === 'brightness') {
        const bright = Math.max(0.2, Math.min(1, this.gestureStartBrightness + delta));
        this.container.style.filter = `brightness(${bright})`;
        this._showGesture('brightness', Math.round(bright * 100) + '%');
      }
    }

    _onGestureEnd() {
      this.gestureType = null;
      this._hideGesture();
    }

    _showGesture(type, value) {
      this.gestureFeedback.classList.remove('hidden');
      this.gestureFeedback.querySelector('.gesture-value').textContent = value;
      const icon = this.gestureFeedback.querySelector('.gesture-icon');
      if (type === 'volume') icon.textContent = '\uD83D\uDD0A';
      else if (type === 'brightness') icon.textContent = '\u2600\uFE0F';
      else if (type === 'seek') icon.textContent = '\u23E9';
    }

    _hideGesture() {
      this.gestureFeedback.classList.add('hidden');
    }

    _seekRelative(seconds) {
      if (this.isLive) return;
      const t = Math.max(0, this.video.currentTime + seconds);
      this.video.currentTime = t;
    }

    _toggleFullscreen() {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      } else {
        const el = this.container;
        (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
      }
    }

    _onFullscreenChange() {
      const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
      const svg = this.els.fullscreen.querySelector('svg');
      if (isFs) {
        svg.innerHTML = '<polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/>';
      } else {
        svg.innerHTML = '<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>';
      }
    }

    async _togglePiP() {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await this.video.requestPictureInPicture();
        }
      } catch (err) {
        console.warn('PiP not supported');
      }
    }

    _cycleSpeed() {
      this.currentSpeedIndex = (this.currentSpeedIndex + 1) % this.speedOptions.length;
      const spd = this.speedOptions[this.currentSpeedIndex];
      this.video.playbackRate = spd;
      this.els.speed.textContent = spd === 1 ? '1x' : spd + 'x';
      this._showGesture('speed', spd + 'x');
    }

    _goBack() {
      if (document.fullscreenElement) {
        this._toggleFullscreen();
        return;
      }
      if (this.video.src && !this.video.paused) {
        this.overlay.classList.add('hidden');
        this.miniPlayer.classList.remove('hidden');
      } else {
        this.stop();
      }
    }

    _expandFromMini() {
      this.miniPlayer.classList.add('hidden');
      this.overlay.classList.remove('hidden');
    }

    _onKeyDown(e) {
      if (this.overlay.classList.contains('hidden') && this.miniPlayer.classList.contains('hidden')) return;
      if (this.miniPlayer && !this.miniPlayer.classList.contains('hidden') && e.key !== 'Backspace') return;

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          this._togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (!this.isLive) this._seekRelative(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (!this.isLive) this._seekRelative(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.video.volume = Math.min(1, this.video.volume + 0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          this.video.volume = Math.max(0, this.video.volume - 0.1);
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          this._toggleFullscreen();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          this.video.muted = !this.video.muted;
          break;
        case 'Escape':
        case 'Backspace':
          e.preventDefault();
          this._goBack();
          break;
        case 'n':
        case 'N':
          this._dispatch('next');
          break;
        case 'p':
        case 'P':
          this._dispatch('prev');
          break;
      }
    }

    _updateVolumeIcon() {
      // Volume icon update could be added here
    }

    _showLoading() {
      this.loading.classList.remove('hidden');
      this.errorEl.classList.add('hidden');
    }

    _hideLoading() {
      this.loading.classList.add('hidden');
    }

    _retry() {
      // Reset all tracking and try from scratch
      this.retryCount = 0;
      this._fallbackIndex = 0;
      this._triedStrategies = new Set();
      this.errorEl.classList.add('hidden');
      if (this.currentItem) {
        this._loadStream(this.currentItem.streamUrl);
      }
    }

    _formatTime(s) {
      if (!isFinite(s)) return '0:00';
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      const sec = Math.floor(s % 60);
      if (h > 0) return `${h}:${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
      return `${m}:${sec.toString().padStart(2,'0')}`;
    }

    _dispatch(event, data) {
      const evt = new CustomEvent('player:' + event, {detail: data || {}});
      document.dispatchEvent(evt);
    }

    destroy() {
      this.stop();
      clearTimeout(this.controlsTimeout);
      clearTimeout(this.doubleTapTimer);
      Object.values(this.listeners).flat().forEach(({el, handler}) => {
        try { el.removeEventListener('click', handler); } catch(e) {}
      });
      if (this.listeners._keyHandler) {
        document.removeEventListener('keydown', this.listeners._keyHandler);
      }
      this.listeners = {};
    }
  }

  window.PlayerManager = new PlayerManager();
})();