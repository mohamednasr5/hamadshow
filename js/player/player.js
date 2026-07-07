/**
 * NASR LIVE - Video Player Manager
 * HLS, MP4, Live Stream support with full controls
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

      this._on(v, 'play', () => this._dispatch('play'));
      this._on(v, 'pause', () => this._dispatch('pause'));
      this._on(v, 'ended', () => {
        this._dispatch('end');
        if (this.currentItem && this.currentItem.onEnded) this.currentItem.onEnded();
      });
      this._on(v, 'timeupdate', () => this._onTimeUpdate());
      this._on(v, 'progress', () => this._onProgress());
      this._on(v, 'waiting', () => this._showLoading());
      this._on(v, 'canplay', () => this._hideLoading());
      this._on(v, 'playing', () => this._hideLoading());
      this._on(v, 'error', () => this._onError());
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

    _loadStream(url) {
      // Destroy previous HLS instance
      if (this.hls) {
        this.hls.destroy();
        this.hls = null;
      }

      const isHLS = url && (url.includes('.m3u8') || url.includes('m3u8'));

      if (isHLS) {
        if (window.Hls && window.Hls.isSupported()) {
          this.hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: this.isLive,
            maxBufferLength: 30,
            maxMaxBufferLength: 60,
            startFragPrefetch: true,
            testBandwidth: true
          });
          this.hls.loadSource(url);
          this.hls.attachMedia(this.video);
          this.hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
            this.video.play().catch(() => {});
          });
          this.hls.on(window.Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
              switch (data.type) {
                case window.Hls.ErrorTypes.NETWORK_ERROR:
                  this._handleNetworkError(url);
                  break;
                case window.Hls.ErrorTypes.MEDIA_ERROR:
                  this.hls.recoverMediaError();
                  break;
                default:
                  this._showError();
                  break;
              }
            }
          });
        } else if (this.video.canPlayType('application/vnd.apple.mpegurl')) {
          // Native HLS (Safari)
          this.video.src = url;
          this.video.play().catch(() => {});
        } else {
          this._showError();
        }
      } else {
        this.video.src = url;
        this.video.play().catch(() => {});
      }
    }

    _handleNetworkError(url) {
      this.retryCount++;
      if (this.retryCount <= this.maxRetries) {
        setTimeout(() => {
          if (this.hls) this.hls.loadSource(url);
        }, 2000 * this.retryCount);
      } else {
        this._showError();
      }
    }

    pause() { this.video.pause(); }
    resume() { this.video.play().catch(() => {}); }
    stop() {
      this.video.pause();
      this.video.src = '';
      if (this.hls) { this.hls.destroy(); this.hls = null; }
      this.overlay.classList.add('hidden');
      this.miniPlayer.classList.add('hidden');
      this.currentItem = null;
      document.title = 'NASR LIVE';
      this._dispatch('stop');
    }

    seek(time) { if (!this.isLive) this.video.currentTime = time; }
    setSpeed(speed) { this.video.playbackRate = speed; }

    isPlaying() { return !this.video.paused; }

    _togglePlay() {
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

      // Save position for VOD
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
      const now = Date.now();
      const rect = this.els.tapZone.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const w = rect.width;

      if (now - this.lastTapTime < 300) {
        // Double tap
        clearTimeout(this.doubleTapTimer);
        if (!this.isLive) {
          if (x < w / 3) {
            this._seekRelative(-10);
            this._showGesture('seek', '← 10s');
          } else if (x > (w * 2 / 3)) {
            this._seekRelative(10);
            this._showGesture('seek', '10s →');
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
          // Single tap - toggle controls
          if (this.controlsVisible) {
            this._hideControls();
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
      if (type === 'volume') icon.textContent = '🔊';
      else if (type === 'brightness') icon.textContent = '☀️';
      else if (type === 'seek') icon.textContent = '⏩';
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
        // Show mini player
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

    _showError() {
      this.loading.classList.add('hidden');
      this.errorEl.classList.remove('hidden');
    }

    _retry() {
      this.retryCount = 0;
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
      // Remove all listeners
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