/**
 * Hamad Show — Premium HTML5 Video Player Module
 * =================================================
 * A full-featured, gesture-aware, HLS-capable video player with:
 *   • Dynamic UI generation (all elements created in JS)
 *   • Touch gestures (tap, double-tap, swipe for brightness/volume)
 *   • Keyboard shortcuts (desktop)
 *   • Settings panel (speed, quality, subtitles, audio tracks)
 *   • Lock mode, PiP, fullscreen
 *   • Progress saving & resume playback
 *   • Auto-next-episode support
 *
 * @namespace HamadShow.Player
 * @module player
 * @requires HamadShow.Utils
 * @requires HamadShow.Config
 */

(function (global) {
  'use strict';

  const NAMESPACE = 'HamadShow';
  const Utils = (global[NAMESPACE] && global[NAMESPACE].Utils) || null;
  const PLAYER_CONFIG = (global[NAMESPACE] && global[NAMESPACE].Config && global[NAMESPACE].Config.PLAYER_CONFIG) || {
    defaultPlaybackSpeed: 1,
    skipDuration: 10,
    doubleTapDelay: 300,
    controlsTimeout: 3000,
    minBufferLength: 5,
  };

  // ---------------------------------------------------------------------------
  // SVG Icon helpers — simple, inline path-based icons
  // ---------------------------------------------------------------------------

  /**
   * Create an SVG element string from viewBox + path data.
   * @param {string} viewBox
   * @param {string} d        SVG path `d` attribute.
   * @param {number} [size]   Optional explicit width/height (uses CSS otherwise).
   * @returns {SVGElement}
   */
  function svgIcon(viewBox, d, size) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', viewBox);
    svg.setAttribute('fill', 'currentColor');
    if (size) {
      svg.setAttribute('width', size);
      svg.setAttribute('height', size);
    }
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    svg.appendChild(path);
    return svg;
  }

  // Icon path data (24×24 viewBox unless noted)
  const ICONS = {
    play:        'M8 5v14l11-7z',
    pause:       'M6 19h4V5H6v14zm8-14v14h4V5h-4z',
    // Backward / forward double-arrows (seek 10s)
    backward:    'M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z',
    forward:     'M12.01 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z',
    // Volume icons
    volumeHigh:  'M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z',
    volumeLow:   'M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z',
    volumeMute:  'M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z',
    // Fullscreen
    fullscreen:  'M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z',
    // Exit fullscreen
    exitFull:    'M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z',
    // Settings gear
    settings:    'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z',
    // Lock / Unlock
    lock:        'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM15.1 8H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z',
    unlock:      'M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h1.9c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z',
    // PiP
    pip:         'M19 11h-8v6h8v-6zm4 8V4.98C23 3.88 22.1 3 21 3H3c-1.1 0-2 .88-2 1.98V19c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zm-2 .02H3V4.97h18v14.05z',
    // Back arrow
    back:        'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z',
    // Check mark (for settings active option)
    check:       'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
    // Brightness sun
    brightness:  'M20 8.69V4h-4.69L12 .69 8.69 4H4v4.69L.69 12 4 15.31V20h4.69L12 23.31 15.31 20H20v-4.69L23.31 12 20 8.69zM12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z',
    // Subtitles (CC)
    subtitles:   'M19 4H5c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 7H9.5v-.5h-2v3h2V13H11v1c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1zm7 0h-1.5v-.5h-2v3h2V13H18v1c0 .55-.45 1-1 1h-3c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1z',
    // Audio track
    audioTrack:  'M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z',
    // Speed
    speed:       'M20.38 8.57l-1.23 1.85a8 8 0 01-.22 7.58H5.07A8 8 0 0115.58 6.85l1.85-1.23A10 10 0 003.35 19a2 2 0 001.72 1h13.85a2 2 0 001.74-1 10 10 0 00-.27-10.44zm-9.79 6.84a2 2 0 002.83 0l5.66-8.49-8.49 5.66a2 2 0 000 2.83z',
  };

  /**
   * Shortcut to create an SVG icon from our icon set.
   * @param {string} name  Key from ICONS.
   * @returns {SVGElement}
   */
  function icon(name) {
    return svgIcon('0 0 24 24', ICONS[name] || '');
  }

  // ---------------------------------------------------------------------------
  // Helper: format time (prefer Utils if available)
  // ---------------------------------------------------------------------------
  function formatTime(seconds) {
    if (Utils && typeof Utils.formatTime === 'function') {
      return Utils.formatTime(seconds);
    }
    if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
    const totalSec = Math.floor(seconds);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) {
      return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
    }
    return [m, s].map((v) => String(v).padStart(2, '0')).join(':');
  }

  // ---------------------------------------------------------------------------
  // Helper: clamp (prefer Utils if available)
  // ---------------------------------------------------------------------------
  function clamp(val, min, max) {
    if (Utils && typeof Utils.clamp === 'function') return Utils.clamp(val, min, max);
    return Math.min(Math.max(val, min), max);
  }

  // ---------------------------------------------------------------------------
  // Helper: detect mobile
  // ---------------------------------------------------------------------------
  function isMobile() {
    if (Utils && typeof Utils.isMobile === 'function') return Utils.isMobile();
    if (typeof navigator === 'undefined') return false;
    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent || '') ||
           (navigator.maxTouchPoints > 1 && window.innerWidth <= 768);
  }

  // ---------------------------------------------------------------------------
  // Helper: is landscape
  // ---------------------------------------------------------------------------
  function isLandscape() {
    if (Utils && typeof Utils.isLandscape === 'function') return Utils.isLandscape();
    if (typeof screen === 'undefined') return false;
    if (screen.orientation && typeof screen.orientation.type === 'string') {
      return screen.orientation.type.includes('landscape');
    }
    return window.innerWidth > window.innerHeight;
  }

  // ---------------------------------------------------------------------------
  // EventTarget mixin — simple pub/sub
  // ---------------------------------------------------------------------------
  function EventTargetMixin(obj) {
    const listeners = {};
    obj.on = function (event, fn) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(fn);
      return obj;
    };
    obj.off = function (event, fn) {
      if (!listeners[event]) return obj;
      listeners[event] = listeners[event].filter((f) => f !== fn);
      return obj;
    };
    obj.emit = function (event, data) {
      if (!listeners[event]) return obj;
      listeners[event].forEach((fn) => {
        try { fn(data); } catch (e) { console.error(`[Player] Event "${event}" handler error:`, e); }
      });
      return obj;
    };
    return obj;
  }

  // ===========================================================================
  // Player Class
  // ===========================================================================
  class Player {
    /**
     * Create a new Player instance bound to the given container element.
     *
     * @param {HTMLElement} container  The `.player-container` div.
     */
    constructor(container) {
      if (!container || !(container instanceof HTMLElement)) {
        throw new Error('Player: a valid container element is required.');
      }

      // Mix in event target capabilities
      EventTargetMixin(this);

      /** @type {HTMLElement} */
      this.container = container;

      // ── State ──
      this._hls = null;               // HLS.js instance (if loaded)
      this._hlsLoaded = false;        // Whether HLS.js script has been loaded
      this._locked = false;           // Lock mode state
      this._controlsVisible = true;   // Controls visibility
      this._controlsTimer = null;     // Auto-hide timer
      this._settingsOpen = false;     // Settings panel visibility
      this._isSeeking = false;        // User is dragging progress bar
      this._isFullscreen = false;     // Fullscreen state
      this._isPiP = false;            // Picture-in-Picture state
      this._metadata = null;          // Current stream metadata
      this._streamUrl = null;         // Current stream URL
      this._landscapeSuggested = false; // One-time landscape suggestion
      this._progressTimer = null;     // Progress save interval
      this._brightness = 1;           // Brightness filter (0-1)
      this._doubleTapTimer = null;    // Double-tap detection timer
      this._lastTapTime = 0;         // Last tap timestamp
      this._lastTapZone = null;       // Zone of last tap ('left', 'right', 'center')
      this._gestureStartY = 0;       // Swipe start Y coordinate
      this._gestureStartX = 0;       // Swipe start X coordinate
      this._gestureStartTime = 0;    // Swipe start timestamp
      this._gestureSide = null;      // 'left' or 'right' for brightness/volume swipe
      this._swipeActive = false;     // Whether a swipe gesture is in progress
      this._resumeShown = false;     // Whether resume dialog has been shown
      this._seekIndicatorTimer = null;

      // ── Build the entire UI dynamically ──
      this._buildUI();
      this._bindEvents();

      // ── Set default playback speed ──
      this._currentSpeed = PLAYER_CONFIG.defaultPlaybackSpeed;
      this._currentQuality = -1;     // -1 = auto

      // Expose video element for advanced consumers
      this.video = this._video;
    }

    // =======================================================================
    // UI Construction
    // =======================================================================

    /**
     * Build all player UI elements and append them to the container.
     * All elements are created via document.createElement — no innerHTML.
     */
    _buildUI() {
      const c = this.container;

      // ── Video Element ──
      this._video = document.createElement('video');
      this._video.setAttribute('playsinline', '');
      this._video.setAttribute('webkit-playsinline', '');
      this._video.setAttribute('preload', 'metadata');
      this._video.style.cssText = 'width:100%;height:100%;object-fit:contain;background:#000;';
      c.appendChild(this._video);

      // ── Brightness Overlay ──
      this._brightnessOverlay = document.createElement('div');
      this._brightnessOverlay.className = 'player-brightness-overlay';
      c.appendChild(this._brightnessOverlay);

      // ── Buffering / Loading Spinner ──
      this._loading = document.createElement('div');
      this._loading.className = 'player-loading';
      const spinner = document.createElement('div');
      spinner.className = 'spinner';
      this._loading.appendChild(spinner);
      c.appendChild(this._loading);

      // ── Tap Zones (for gesture detection on touch devices) ──
      this._tapZoneLeft = document.createElement('div');
      this._tapZoneLeft.className = 'player-tap-zone left';

      this._tapZoneCenter = document.createElement('div');
      this._tapZoneCenter.className = 'player-tap-zone center';

      this._tapZoneRight = document.createElement('div');
      this._tapZoneRight.className = 'player-tap-zone right';

      c.appendChild(this._tapZoneLeft);
      c.appendChild(this._tapZoneCenter);
      c.appendChild(this._tapZoneRight);

      // ── Gesture Feedback (brightness/volume) ──
      this._gestureFeedbackLeft = this._createGestureFeedback('left');
      this._gestureFeedbackRight = this._createGestureFeedback('right');
      c.appendChild(this._gestureFeedbackLeft);
      c.appendChild(this._gestureFeedbackRight);

      // ── Seek Indicator (double-tap seek) ──
      this._seekIndicator = document.createElement('div');
      this._seekIndicator.className = 'player-seek-indicator';
      this._seekIconWrap = document.createElement('div');
      this._seekIconWrap.className = 'seek-icon';
      this._seekIconWrap.appendChild(icon('backward'));
      this._seekTime = document.createElement('span');
      this._seekTime.className = 'seek-time';
      this._seekTime.textContent = '-10s';
      this._seekIndicator.appendChild(this._seekIconWrap);
      this._seekIndicator.appendChild(this._seekTime);
      c.appendChild(this._seekIndicator);

      // ── Center Play Button (large, shown when paused) ──
      this._centerPlay = document.createElement('div');
      this._centerPlay.className = 'player-center-play';
      this._centerPlaySvg = icon('play');
      this._centerPlay.appendChild(this._centerPlaySvg);
      c.appendChild(this._centerPlay);

      // ── Top Bar ──
      this._topBar = document.createElement('div');
      this._topBar.className = 'player-top-bar';

      // Back button
      this._backBtn = document.createElement('button');
      this._backBtn.className = 'player-back-btn';
      this._backBtn.type = 'button';
      this._backBtn.setAttribute('aria-label', 'Go back');
      this._backBtn.appendChild(icon('back'));
      this._topBar.appendChild(this._backBtn);

      // Title area
      this._titleArea = document.createElement('div');
      this._titleArea.className = 'player-title-area';
      this._titleEl = document.createElement('div');
      this._titleEl.className = 'player-title';
      this._subtitleEl = document.createElement('div');
      this._subtitleEl.className = 'player-subtitle';
      this._titleArea.appendChild(this._titleEl);
      this._titleArea.appendChild(this._subtitleEl);
      this._topBar.appendChild(this._titleArea);

      // Spacer to balance the back button (or could add action buttons)
      const topSpacer = document.createElement('div');
      topSpacer.style.width = '40px';
      this._topBar.appendChild(topSpacer);

      c.appendChild(this._topBar);

      // ── Bottom Bar ──
      this._bottomBar = document.createElement('div');
      this._bottomBar.className = 'player-bottom-bar';

      // Progress bar
      this._progressBar = this._buildProgressBar();
      this._bottomBar.appendChild(this._progressBar);

      // Controls row
      this._controlsRow = this._buildControlsRow();
      this._bottomBar.appendChild(this._controlsRow);

      c.appendChild(this._bottomBar);

      // ── Settings Panel ──
      this._settingsPanel = this._buildSettingsPanel();
      c.appendChild(this._settingsPanel);

      // ── Lock Button (shown only in locked mode) ──
      this._lockContainer = document.createElement('div');
      this._lockContainer.className = 'player-lock';
      this._lockBtn = document.createElement('button');
      this._lockBtn.className = 'lock-btn';
      this._lockBtn.type = 'button';
      this._lockBtn.setAttribute('aria-label', 'Unlock player');
      this._lockBtnSvg = icon('unlock');
      this._lockBtn.appendChild(this._lockBtnSvg);
      this._lockContainer.appendChild(this._lockBtn);
      c.appendChild(this._lockContainer);
    }

    /**
     * Build the progress bar element tree.
     * @returns {HTMLElement}
     */
    _buildProgressBar() {
      const bar = document.createElement('div');
      bar.className = 'player-progress';

      this._progressBuffered = document.createElement('div');
      this._progressBuffered.className = 'progress-buffered';

      this._progressPlayed = document.createElement('div');
      this._progressPlayed.className = 'progress-played';

      this._progressThumb = document.createElement('div');
      this._progressThumb.className = 'progress-thumb';

      this._progressTooltip = document.createElement('div');
      this._progressTooltip.className = 'progress-tooltip';
      this._progressTooltip.textContent = '00:00';

      bar.appendChild(this._progressBuffered);
      bar.appendChild(this._progressPlayed);
      bar.appendChild(this._progressThumb);
      bar.appendChild(this._progressTooltip);

      return bar;
    }

    /**
     * Build the controls row (left + right groups).
     * @returns {HTMLElement}
     */
    _buildControlsRow() {
      const row = document.createElement('div');
      row.className = 'player-controls';

      // ── Left group ──
      const left = document.createElement('div');
      left.className = 'player-controls-left';

      // Play / Pause
      this._playPauseBtn = document.createElement('button');
      this._playPauseBtn.className = 'ctrl-btn play-pause-btn';
      this._playPauseBtn.type = 'button';
      this._playPauseBtn.setAttribute('aria-label', 'Play');
      this._playPauseSvg = icon('play');
      this._playPauseBtn.appendChild(this._playPauseSvg);
      left.appendChild(this._playPauseBtn);

      // Time display
      this._timeDisplay = document.createElement('span');
      this._timeDisplay.className = 'time-display';
      this._timeDisplay.textContent = '00:00 / 00:00';
      left.appendChild(this._timeDisplay);

      // ── Right group ──
      const right = document.createElement('div');
      right.className = 'player-controls-right';

      // Lock
      this._lockCtrlBtn = document.createElement('button');
      this._lockCtrlBtn.className = 'ctrl-btn';
      this._lockCtrlBtn.type = 'button';
      this._lockCtrlBtn.setAttribute('aria-label', 'Lock controls');
      this._lockCtrlBtnSvg = icon('lock');
      this._lockCtrlBtn.appendChild(this._lockCtrlBtnSvg);
      right.appendChild(this._lockCtrlBtn);

      // Settings
      this._settingsBtn = document.createElement('button');
      this._settingsBtn.className = 'ctrl-btn';
      this._settingsBtn.type = 'button';
      this._settingsBtn.setAttribute('aria-label', 'Settings');
      this._settingsBtnSvg = icon('settings');
      this._settingsBtn.appendChild(this._settingsBtnSvg);
      right.appendChild(this._settingsBtn);

      // Volume (mute toggle + slider)
      this._volumeContainer = document.createElement('div');
      this._volumeContainer.style.cssText = 'display:flex;align-items:center;gap:6px;position:relative;';

      this._volumeBtn = document.createElement('button');
      this._volumeBtn.className = 'ctrl-btn';
      this._volumeBtn.type = 'button';
      this._volumeBtn.setAttribute('aria-label', 'Mute');
      this._volumeSvg = icon('volumeHigh');
      this._volumeBtn.appendChild(this._volumeSvg);

      this._volumeSlider = document.createElement('input');
      this._volumeSlider.type = 'range';
      this._volumeSlider.min = '0';
      this._volumeSlider.max = '1';
      this._volumeSlider.step = '0.05';
      this._volumeSlider.value = '1';
      this._volumeSlider.style.cssText =
        'width:70px;height:4px;accent-color:var(--color-primary);cursor:pointer;';

      this._volumeContainer.appendChild(this._volumeBtn);
      this._volumeContainer.appendChild(this._volumeSlider);
      right.appendChild(this._volumeContainer);

      // PiP
      this._pipBtn = document.createElement('button');
      this._pipBtn.className = 'ctrl-btn';
      this._pipBtn.type = 'button';
      this._pipBtn.setAttribute('aria-label', 'Picture in Picture');
      this._pipBtnSvg = icon('pip');
      this._pipBtn.appendChild(this._pipBtnSvg);
      right.appendChild(this._pipBtn);

      // Fullscreen
      this._fullscreenBtn = document.createElement('button');
      this._fullscreenBtn.className = 'ctrl-btn';
      this._fullscreenBtn.type = 'button';
      this._fullscreenBtn.setAttribute('aria-label', 'Fullscreen');
      this._fullscreenSvg = icon('fullscreen');
      this._fullscreenBtn.appendChild(this._fullscreenSvg);
      right.appendChild(this._fullscreenBtn);

      row.appendChild(left);
      row.appendChild(right);

      return row;
    }

    /**
     * Build the settings dropdown panel.
     * @returns {HTMLElement}
     */
    _buildSettingsPanel() {
      const panel = document.createElement('div');
      panel.className = 'player-settings-panel';

      // Playback Speed group
      this._speedGroup = this._buildSettingGroup('Playback Speed', [
        { label: '0.25x', value: 0.25 },
        { label: '0.5x',  value: 0.5 },
        { label: '0.75x', value: 0.75 },
        { label: 'Normal', value: 1 },
        { label: '1.25x', value: 1.25 },
        { label: '1.5x',  value: 1.5 },
        { label: '2x',    value: 2 },
      ], this._currentSpeed, (val) => {
        this._currentSpeed = val;
        this._video.playbackRate = val;
        this._refreshSettingsActive('speed', val);
      });
      panel.appendChild(this._speedGroup);

      // Quality group (populated dynamically when HLS levels are available)
      this._qualityGroup = this._buildSettingGroup('Quality', [
        { label: 'Auto', value: -1 },
      ], -1, (val) => {
        this._currentQuality = val;
        this._applyHLSQuality(val);
        this._refreshSettingsActive('quality', val);
      });
      panel.appendChild(this._qualityGroup);

      // Subtitles group (populated dynamically from text tracks)
      this._subtitleGroup = this._buildSettingGroup('Subtitles', [
        { label: 'Off', value: -1 },
      ], -1, (val) => {
        this._applySubtitleTrack(val);
        this._refreshSettingsActive('subtitle', val);
      });
      panel.appendChild(this._subtitleGroup);

      // Audio Track group (populated dynamically from audio tracks)
      this._audioTrackGroup = this._buildSettingGroup('Audio Track', [], -1, (val) => {
        this._applyAudioTrack(val);
        this._refreshSettingsActive('audioTrack', val);
      });
      panel.appendChild(this._audioTrackGroup);

      return panel;
    }

    /**
     * Build a single setting group (label + list of options).
     * @param {string}   label
     * @param {Array}    options   [{label, value}]
     * @param {*}        activeValue
     * @param {Function} onChange  Called with the selected value.
     * @returns {HTMLElement}
     */
    _buildSettingGroup(label, options, activeValue, onChange) {
      const group = document.createElement('div');
      group.className = 'setting-group';
      group.dataset.settingType = '';

      const labelEl = document.createElement('div');
      labelEl.className = 'setting-label';
      labelEl.textContent = label;
      group.appendChild(labelEl);

      // Store references for dynamic updates
      group._options = [];
      group._onChange = onChange;
      group._activeValue = activeValue;

      for (const opt of options) {
        const optEl = document.createElement('div');
        optEl.className = 'setting-option' + (opt.value === activeValue ? ' active' : '');
        optEl.dataset.value = opt.value;

        const labelSpan = document.createElement('span');
        labelSpan.textContent = opt.label;
        optEl.appendChild(labelSpan);

        const checkSvg = icon('check');
        checkSvg.classList.add('check-icon');
        optEl.appendChild(checkSvg);

        // Click handler (closure to capture value)
        optEl.addEventListener('click', () => {
          onChange(opt.value);
        });

        group._options.push(optEl);
        group.appendChild(optEl);
      }

      return group;
    }

    /**
     * Create a gesture feedback element (left or right side).
     * @param {string} side  'left' or 'right'
     * @returns {HTMLElement}
     */
    _createGestureFeedback(side) {
      const fb = document.createElement('div');
      fb.className = `player-gesture-feedback ${side}`;

      const iconWrap = document.createElement('div');
      iconWrap.className = 'gesture-icon';
      // Will dynamically set icon (brightness or volume)
      iconWrap.appendChild(icon(side === 'left' ? 'brightness' : 'volumeHigh'));
      fb.appendChild(iconWrap);

      const val = document.createElement('div');
      val.className = 'gesture-value';
      val.textContent = side === 'left' ? '100%' : '100%';
      fb.appendChild(val);

      // Store references
      fb._iconWrap = iconWrap;
      fb._valueEl = val;

      return fb;
    }

    // =======================================================================
    // Event Binding
    // =======================================================================

    /**
     * Bind all DOM events for the player.
     */
    _bindEvents() {
      const v = this._video;

      // ── Video native events ──
      v.addEventListener('play',       () => this._onPlay());
      v.addEventListener('pause',      () => this._onPause());
      v.addEventListener('ended',      () => this._onEnded());
      v.addEventListener('timeupdate', () => this._onTimeUpdate());
      v.addEventListener('loadedmetadata', () => this._onLoadedMetadata());
      v.addEventListener('durationchange', () => this._onTimeUpdate());
      v.addEventListener('progress',   () => this._updateBuffered());
      v.addEventListener('waiting',    () => this._showLoading(true));
      v.addEventListener('canplay',    () => this._showLoading(false));
      v.addEventListener('playing',    () => this._showLoading(false));
      v.addEventListener('error',      (e) => this._onError(e));
      v.addEventListener('volumechange', () => this._updateVolumeIcon());

      // ── Control buttons ──
      this._playPauseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._togglePlayPause();
      });
      this._centerPlay.addEventListener('click', (e) => {
        e.stopPropagation();
        this._togglePlayPause();
      });
      this._backBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.stop();
        this.emit('destroyed', {});
      });
      this._lockCtrlBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._toggleLock();
      });
      this._lockBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._toggleLock();
      });
      this._settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._toggleSettings();
      });
      this._fullscreenBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._toggleFullscreen();
      });
      this._pipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._togglePiP();
      });
      this._volumeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._toggleMute();
      });
      this._volumeSlider.addEventListener('input', () => {
        this._video.volume = parseFloat(this._volumeSlider.value);
        this._video.muted = false;
      });

      // ── Progress bar interactions ──
      this._progressBar.addEventListener('click', (e) => this._onProgressClick(e));
      this._progressBar.addEventListener('mousemove', (e) => this._onProgressHover(e));
      this._progressBar.addEventListener('touchstart', (e) => this._onProgressTouchStart(e), { passive: false });
      this._progressBar.addEventListener('touchmove',  (e) => this._onProgressTouchMove(e), { passive: false });
      this._progressBar.addEventListener('touchend',   (e) => this._onProgressTouchEnd(e));

      // ── Mouse move → show controls & restart auto-hide ──
      this.container.addEventListener('mousemove', () => this._showControls());
      this.container.addEventListener('mouseleave', () => this._scheduleHideControls());

      // ── Click on container → toggle controls (for mouse, non-mobile) ──
      this.container.addEventListener('click', (e) => {
        // Ignore clicks on controls / UI elements
        if (e.target.closest('.player-top-bar') ||
            e.target.closest('.player-bottom-bar') ||
            e.target.closest('.player-settings-panel') ||
            e.target.closest('.player-lock') ||
            e.target.closest('.player-center-play')) {
          return;
        }
        if (!isMobile()) {
          this._toggleControlsVisibility();
        }
      });

      // ── Touch gesture handling (mobile) ──
      this._bindGestures();

      // ── Keyboard shortcuts ──
      this._keydownHandler = (e) => this._onKeyDown(e);
      document.addEventListener('keydown', this._keydownHandler);

      // ── Fullscreen change ──
      this._fullscreenChangeHandler = () => this._onFullscreenChange();
      document.addEventListener('fullscreenchange', this._fullscreenChangeHandler);
      document.addEventListener('webkitfullscreenchange', this._fullscreenChangeHandler);

      // ── PiP events ──
      v.addEventListener('enterpictureinpicture', () => {
        this._isPiP = true;
        this._pipBtnSvg.replaceWith(icon('pip'));
      });
      v.addEventListener('leavepictureinpicture', () => {
        this._isPiP = false;
      });

      // ── Orientation change (for landscape suggestion) ──
      if (screen.orientation) {
        screen.orientation.addEventListener('change', () => {
          if (isLandscape()) this._landscapeSuggested = true;
        });
      }
    }

    // =======================================================================
    // Gesture Handling
    // =======================================================================

    /**
     * Bind touch gesture events to the tap zones and container.
     */
    _bindGestures() {
      const doubleTapDelay = PLAYER_CONFIG.doubleTapDelay;

      // ── Tap zone handlers for single/double tap ──
      const zones = [
        { el: this._tapZoneLeft,   zone: 'left' },
        { el: this._tapZoneCenter, zone: 'center' },
        { el: this._tapZoneRight,  zone: 'right' },
      ];

      for (const { el, zone } of zones) {
        el.addEventListener('touchend', (e) => {
          e.preventDefault();
          if (this._locked) return;
          const now = Date.now();

          if (this._lastTapZone === zone && (now - this._lastTapTime) < doubleTapDelay) {
            // Double tap detected — cancel single-tap timer
            clearTimeout(this._doubleTapTimer);
            this._lastTapTime = 0;
            this._lastTapZone = null;
            this._handleDoubleTap(zone);
          } else {
            // Potential single tap — wait to see if double tap follows
            this._lastTapTime = now;
            this._lastTapZone = zone;
            const savedZone = zone;
            this._doubleTapTimer = setTimeout(() => {
              // Confirmed single tap
              this._lastTapTime = 0;
              this._lastTapZone = null;
              this._handleSingleTap(savedZone);
            }, doubleTapDelay);
          }
        });
      }

      // ── Swipe detection for brightness (left) and volume (right) ──
      const container = this.container;

      container.addEventListener('touchstart', (e) => {
        if (this._locked) return;
        if (e.target.closest('.player-bottom-bar') ||
            e.target.closest('.player-top-bar') ||
            e.target.closest('.player-settings-panel') ||
            e.target.closest('.player-lock') ||
            e.target.closest('.player-center-play')) {
          return;
        }

        const touch = e.touches[0];
        this._gestureStartY = touch.clientY;
        this._gestureStartX = touch.clientX;
        this._gestureStartTime = Date.now();
        this._swipeActive = false;

        // Determine side: left 35% = brightness, right 35% = volume
        const rect = container.getBoundingClientRect();
        const relX = (touch.clientX - rect.left) / rect.width;
        if (relX < 0.35) {
          this._gestureSide = 'left';
        } else if (relX > 0.65) {
          this._gestureSide = 'right';
        } else {
          this._gestureSide = null; // Center swipes do nothing special
        }
      }, { passive: true });

      container.addEventListener('touchmove', (e) => {
        if (this._locked || !this._gestureSide) return;
        if (e.target.closest('.player-bottom-bar') ||
            e.target.closest('.player-top-bar') ||
            e.target.closest('.player-settings-panel') ||
            e.target.closest('.player-lock')) {
          return;
        }

        const touch = e.touches[0];
        const deltaY = this._gestureStartY - touch.clientY;
        const absDeltaY = Math.abs(deltaY);

        // Require minimum vertical distance to start swipe
        if (absDeltaY > 20) {
          this._swipeActive = true;
          e.preventDefault(); // Prevent scroll
        }

        if (!this._swipeActive) return;

        // Calculate the change factor (roughly 0-1 range based on screen height)
        const screenHeight = window.innerHeight;
        const deltaFactor = clamp(deltaY / screenHeight, -1, 1);

        if (this._gestureSide === 'left') {
          // Brightness
          this._brightness = clamp(this._brightness + deltaFactor * 0.05, 0, 1);
          this._updateBrightness();
          this._showGestureFeedback('left', Math.round(this._brightness * 100) + '%', 'brightness');
        } else if (this._gestureSide === 'right') {
          // Volume
          const newVol = clamp(this._video.volume + deltaFactor * 0.05, 0, 1);
          this._video.volume = newVol;
          this._video.muted = (newVol === 0);
          this._volumeSlider.value = newVol;
          this._showGestureFeedback('right', Math.round(newVol * 100) + '%', 'volume');
        }

        // Update start position for incremental tracking
        this._gestureStartY = touch.clientY;
      }, { passive: false });

      container.addEventListener('touchend', () => {
        if (this._swipeActive) {
          this._hideGestureFeedback();
        }
        this._swipeActive = false;
        this._gestureSide = null;
      });
    }

    /**
     * Handle a confirmed single tap on a zone.
     * @param {string} zone  'left' | 'center' | 'right'
     */
    _handleSingleTap(zone) {
      // Single tap anywhere toggles controls visibility
      this._toggleControlsVisibility();
    }

    /**
     * Handle a double tap on a zone.
     * @param {string} zone  'left' | 'center' | 'right'
     */
    _handleDoubleTap(zone) {
      const skip = PLAYER_CONFIG.skipDuration;

      if (zone === 'left') {
        this._seekRelative(-skip);
        this._showSeekIndicator(-skip);
      } else if (zone === 'right') {
        this._seekRelative(skip);
        this._showSeekIndicator(skip);
      } else if (zone === 'center') {
        this._togglePlayPause();
      }
    }

    // =======================================================================
    // Gesture Feedback
    // =======================================================================

    /**
     * Show the seek indicator with an animation.
     * @param {number} seconds  Positive = forward, negative = backward.
     */
    _showSeekIndicator(seconds) {
      clearTimeout(this._seekIndicatorTimer);

      // Update icon and text
      const isForward = seconds > 0;
      this._seekIconWrap.innerHTML = '';
      this._seekIconWrap.appendChild(icon(isForward ? 'forward' : 'backward'));
      this._seekTime.textContent = (isForward ? '+' : '') + seconds + 's';

      // Show with animation
      this._seekIndicator.classList.remove('show');
      // Force reflow to restart animation
      void this._seekIndicator.offsetWidth;
      this._seekIndicator.classList.add('show');

      // Hide after delay
      this._seekIndicatorTimer = setTimeout(() => {
        this._seekIndicator.classList.remove('show');
      }, 800);
    }

    /**
     * Show gesture feedback on one side.
     * @param {string} side    'left' | 'right'
     * @param {string} text    Display text (e.g. "75%")
     * @param {string} type    'brightness' | 'volume'
     */
    _showGestureFeedback(side, text, type) {
      const fb = side === 'left' ? this._gestureFeedbackLeft : this._gestureFeedbackRight;
      fb._iconWrap.innerHTML = '';
      fb._iconWrap.appendChild(icon(type === 'brightness' ? 'brightness' : 'volumeHigh'));
      fb._valueEl.textContent = text;
      fb.classList.add('show');
    }

    /**
     * Hide all gesture feedback.
     */
    _hideGestureFeedback() {
      this._gestureFeedbackLeft.classList.remove('show');
      this._gestureFeedbackRight.classList.remove('show');
    }

    // =======================================================================
    // Brightness
    // =======================================================================

    /**
     * Update the brightness overlay opacity.
     */
    _updateBrightness() {
      // Brightness of 1 = fully visible (no overlay), 0 = completely dark
      // We invert: overlay opacity = 1 - brightness
      this._brightnessOverlay.style.opacity = String(1 - this._brightness);
    }

    // =======================================================================
    // Controls Visibility
    // =======================================================================

    /**
     * Toggle controls visibility (for mouse click / single tap).
     */
    _toggleControlsVisibility() {
      if (this._controlsVisible) {
        this._hideControls();
      } else {
        this._showControls();
      }
    }

    /**
     * Show controls and restart auto-hide timer.
     */
    _showControls() {
      this._controlsVisible = true;
      this.container.classList.remove('controls-hidden');
      this._scheduleHideControls();
    }

    /**
     * Hide controls.
     */
    _hideControls() {
      this._controlsVisible = false;
      this.container.classList.add('controls-hidden');
      this._closeSettings();
    }

    /**
     * Schedule auto-hide of controls.
     */
    _scheduleHideControls() {
      clearTimeout(this._controlsTimer);
      // Don't auto-hide if video is paused or controls are locked
      if (this._video.paused || this._locked) return;
      this._controlsTimer = setTimeout(() => {
        this._hideControls();
      }, PLAYER_CONFIG.controlsTimeout);
    }

    // =======================================================================
    // Lock Mode
    // =======================================================================

    /**
     * Toggle lock mode.
     */
    _toggleLock() {
      this._locked = !this._locked;
      this.container.classList.toggle('locked', this._locked);
      // Update the lock button icons
      this._lockCtrlBtnSvg.replaceWith(icon(this._locked ? 'unlock' : 'lock'));
      this._lockCtrlBtnSvg = this._lockCtrlBtn.querySelector('svg') || this._lockCtrlBtn.firstChild;
      this._lockBtnSvg.replaceWith(icon(this._locked ? 'unlock' : 'lock'));
      this._lockBtnSvg = this._lockBtn.querySelector('svg') || this._lockBtn.firstChild;

      if (this._locked) {
        // In locked mode, show lock container and hide everything else
        this._hideControls();
        this.container.classList.remove('controls-hidden'); // Don't use controls-hidden for lock
      } else {
        this._showControls();
      }
    }

    // =======================================================================
    // Settings Panel
    // =======================================================================

    /**
     * Toggle the settings panel.
     */
    _toggleSettings() {
      if (this._settingsOpen) {
        this._closeSettings();
      } else {
        this._openSettings();
      }
    }

    /**
     * Open the settings panel.
     */
    _openSettings() {
      this._settingsOpen = true;
      this._settingsPanel.classList.add('active');
      this._refreshAllSettings();
    }

    /**
     * Close the settings panel.
     */
    _closeSettings() {
      this._settingsOpen = false;
      this._settingsPanel.classList.remove('active');
    }

    /**
     * Refresh all settings groups to reflect current state.
     */
    _refreshAllSettings() {
      this._refreshSettingsActive('speed', this._currentSpeed);
      this._refreshSettingsActive('quality', this._currentQuality);
      this._refreshSubtitleOptions();
      this._refreshAudioTrackOptions();
      this._refreshQualityOptions();
    }

    /**
     * Mark the active option in a settings group.
     * @param {string} type   'speed' | 'quality' | 'subtitle' | 'audioTrack'
     * @param {*}      value
     */
    _refreshSettingsActive(type, value) {
      let group;
      if (type === 'speed') group = this._speedGroup;
      else if (type === 'quality') group = this._qualityGroup;
      else if (type === 'subtitle') group = this._subtitleGroup;
      else if (type === 'audioTrack') group = this._audioTrackGroup;
      else return;

      for (const optEl of group._options) {
        const isActive = String(optEl.dataset.value) === String(value);
        optEl.classList.toggle('active', isActive);
      }
      group._activeValue = value;
    }

    /**
     * Dynamically rebuild quality options from HLS levels.
     */
    _refreshQualityOptions() {
      const group = this._qualityGroup;

      // Clear existing options
      for (const opt of group._options) {
        opt.remove();
      }
      group._options = [];

      // Auto option
      const autoOpt = this._createSettingOption('Auto', -1, this._currentQuality === -1, (val) => {
        this._currentQuality = val;
        this._applyHLSQuality(val);
        this._refreshSettingsActive('quality', val);
      });
      group._options.push(autoOpt);
      group.appendChild(autoOpt);

      // If HLS is active and has levels, add them
      if (this._hls && this._hls.levels && this._hls.levels.length > 0) {
        for (let i = 0; i < this._hls.levels.length; i++) {
          const level = this._hls.levels[i];
          const height = level.height;
          let label = height + 'p';
          if (level.bitrate) {
            const mbps = (level.bitrate / 1000000).toFixed(1);
            label += ` (${mbps} Mbps)`;
          }
          const opt = this._createSettingOption(label, i, this._currentQuality === i, (val) => {
            this._currentQuality = val;
            this._applyHLSQuality(val);
            this._refreshSettingsActive('quality', val);
          });
          group._options.push(opt);
          group.appendChild(opt);
        }
      }
    }

    /**
     * Dynamically rebuild subtitle options from text tracks.
     */
    _refreshSubtitleOptions() {
      const group = this._subtitleGroup;

      // Clear existing options
      for (const opt of group._options) {
        opt.remove();
      }
      group._options = [];

      const activeTrackIdx = this._getActiveSubtitleIndex();

      // Off option
      const offOpt = this._createSettingOption('Off', -1, activeTrackIdx === -1, (val) => {
        this._applySubtitleTrack(val);
        this._refreshSettingsActive('subtitle', val);
      });
      group._options.push(offOpt);
      group.appendChild(offOpt);

      // Text tracks
      const tracks = this._video.textTracks;
      if (tracks && tracks.length > 0) {
        for (let i = 0; i < tracks.length; i++) {
          const track = tracks[i];
          const label = track.label || track.language || `Track ${i + 1}`;
          const opt = this._createSettingOption(label, i, activeTrackIdx === i, (val) => {
            this._applySubtitleTrack(val);
            this._refreshSettingsActive('subtitle', val);
          });
          group._options.push(opt);
          group.appendChild(opt);
        }
      }
    }

    /**
     * Dynamically rebuild audio track options.
     */
    _refreshAudioTrackOptions() {
      const group = this._audioTrackGroup;

      // Clear existing options
      for (const opt of group._options) {
        opt.remove();
      }
      group._options = [];

      // Get audio tracks from HLS if available
      const audioTracks = this._hls && this._hls.audioTracks ? this._hls.audioTracks : [];
      const activeIdx = this._getActiveAudioTrackIndex();

      if (audioTracks.length === 0) {
        // No audio tracks available — hide the group
        group.style.display = 'none';
        return;
      }

      group.style.display = '';

      for (let i = 0; i < audioTracks.length; i++) {
        const track = audioTracks[i];
        const label = track.name || track.lang || `Audio ${i + 1}`;
        const opt = this._createSettingOption(label, i, activeIdx === i, (val) => {
          this._applyAudioTrack(val);
          this._refreshSettingsActive('audioTrack', val);
        });
        group._options.push(opt);
        group.appendChild(opt);
      }
    }

    /**
     * Get the currently active subtitle track index, or -1 if none.
     * @returns {number}
     */
    _getActiveSubtitleIndex() {
      const tracks = this._video.textTracks;
      if (!tracks) return -1;
      for (let i = 0; i < tracks.length; i++) {
        if (tracks[i].mode === 'showing') return i;
      }
      return -1;
    }

    /**
     * Get the currently active HLS audio track index, or -1.
     * @returns {number}
     */
    _getActiveAudioTrackIndex() {
      if (this._hls && this._hls.audioTrack !== undefined) {
        return this._hls.audioTrack;
      }
      return -1;
    }

    /**
     * Create a single settings option element.
     * @param {string}   label
     * @param {*}        value
     * @param {boolean}  isActive
     * @param {Function} onClick
     * @returns {HTMLElement}
     */
    _createSettingOption(label, value, isActive, onClick) {
      const optEl = document.createElement('div');
      optEl.className = 'setting-option' + (isActive ? ' active' : '');
      optEl.dataset.value = value;

      const labelSpan = document.createElement('span');
      labelSpan.textContent = label;
      optEl.appendChild(labelSpan);

      const checkSvg = icon('check');
      checkSvg.classList.add('check-icon');
      optEl.appendChild(checkSvg);

      optEl.addEventListener('click', (e) => {
        e.stopPropagation();
        onClick(value);
      });

      return optEl;
    }

    // =======================================================================
    // HLS Support
    // =======================================================================

    /**
     * Check if a URL is an HLS stream.
     * @param {string} url
     * @returns {boolean}
     */
    _isHLS(url) {
      return typeof url === 'string' && /\.m3u8(\?.*)?$/i.test(url);
    }

    /**
     * Load HLS.js dynamically from CDN if not already loaded.
     * @returns {Promise<boolean>}  Whether HLS.js was loaded successfully.
     */
    async _loadHlsJs() {
      // Already loaded?
      if (this._hlsLoaded || typeof Hls !== 'undefined') {
        this._hlsLoaded = true;
        return true;
      }

      return new Promise((resolve) => {
        // Check if native HLS is supported (Safari)
        if (this._video.canPlayType('application/vnd.apple.mpegurl')) {
          this._hlsLoaded = false; // We don't need HLS.js
          resolve(false);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
        script.async = true;
        script.onload = () => {
          if (typeof Hls !== 'undefined' && Hls.isSupported()) {
            this._hlsLoaded = true;
            resolve(true);
          } else {
            resolve(false);
          }
        };
        script.onerror = () => {
          console.warn('[Player] Failed to load HLS.js from CDN.');
          resolve(false);
        };
        document.head.appendChild(script);
      });
    }

    /**
     * Initialize HLS.js for the given URL.
     * @param {string} url
     */
    _initHLS(url) {
      // Destroy previous instance if any
      this._destroyHLS();

      if (this._hlsLoaded && typeof Hls !== 'undefined') {
        this._hls = new Hls({
          // Let the browser buffer as configured
          maxBufferLength: PLAYER_CONFIG.minBufferLength,
          maxMaxBufferLength: 30,
        });

        this._hls.loadSource(url);
        this._hls.attachMedia(this._video);

        this._hls.on(Hls.Events.MANIFEST_PARSED, () => {
          // Refresh quality options now that we have levels
          this._refreshQualityOptions();
          this._refreshAudioTrackOptions();
          // Auto-play
          this._video.play().catch(() => {
            // Autoplay may be blocked; user needs to interact
          });
        });

        this._hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.error('[Player] HLS fatal network error, trying to recover...');
                this._hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.error('[Player] HLS fatal media error, trying to recover...');
                this._hls.recoverMediaError();
                break;
              default:
                console.error('[Player] HLS fatal error, cannot recover.');
                this._onError({ type: 'hls', detail: data });
                this._destroyHLS();
                break;
            }
          }
        });

        this._hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, () => {
          this._refreshAudioTrackOptions();
        });

      } else if (this._video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS (Safari)
        this._video.src = url;
        this._video.play().catch(() => {});
      } else {
        // Fallback — try native
        this._video.src = url;
        this._video.play().catch(() => {});
      }
    }

    /**
     * Destroy the current HLS.js instance.
     */
    _destroyHLS() {
      if (this._hls) {
        this._hls.destroy();
        this._hls = null;
      }
    }

    /**
     * Apply a quality level for HLS.
     * @param {number} levelIndex  -1 for auto, or 0-based index.
     */
    _applyHLSQuality(levelIndex) {
      if (!this._hls) return;
      if (levelIndex === -1) {
        this._hls.currentLevel = -1; // Auto
      } else {
        this._hls.currentLevel = levelIndex;
      }
    }

    /**
     * Apply a subtitle track.
     * @param {number} trackIndex  -1 for off, or 0-based index.
     */
    _applySubtitleTrack(trackIndex) {
      const tracks = this._video.textTracks;
      if (!tracks) return;

      for (let i = 0; i < tracks.length; i++) {
        tracks[i].mode = (i === trackIndex) ? 'showing' : 'hidden';
      }
    }

    /**
     * Apply an audio track (HLS).
     * @param {number} trackIndex  0-based index.
     */
    _applyAudioTrack(trackIndex) {
      if (this._hls && this._hls.audioTrack !== undefined) {
        this._hls.audioTrack = trackIndex;
      }
    }

    // =======================================================================
    // Fullscreen
    // =======================================================================

    /**
     * Toggle fullscreen mode.
     */
    _toggleFullscreen() {
      if (this._isFullscreen) {
        this._exitFullscreen();
      } else {
        this._enterFullscreen();
      }
    }

    /**
     * Enter fullscreen.
     */
    _enterFullscreen() {
      const el = this.container;
      if (el.requestFullscreen) {
        el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      } else if (el.webkitEnterFullscreen) {
        // iOS Safari fallback
        el.webkitEnterFullscreen();
      } else if (this._video.webkitEnterFullscreen) {
        this._video.webkitEnterFullscreen();
      }
    }

    /**
     * Exit fullscreen.
     */
    _exitFullscreen() {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }

    /**
     * Handle fullscreen change event.
     */
    _onFullscreenChange() {
      const fsElement = document.fullscreenElement || document.webkitFullscreenElement;
      this._isFullscreen = !!fsElement;

      // Update the button icon
      this._fullscreenBtnSvg.replaceWith(icon(this._isFullscreen ? 'exitFull' : 'fullscreen'));
      // Re-reference since replaceWith removes the old node
      this._fullscreenBtnSvg = this._fullscreenBtn.querySelector('svg') || this._fullscreenBtn.firstChild;

      this.emit('fullscreenChange', { isFullscreen: this._isFullscreen });
    }

    // =======================================================================
    // Picture-in-Picture
    // =======================================================================

    /**
     * Toggle Picture-in-Picture mode.
     */
    async _togglePiP() {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else if (document.pictureInPictureEnabled) {
          await this._video.requestPictureInPicture();
        }
      } catch (err) {
        console.warn('[Player] PiP not available:', err.message);
      }
    }

    // =======================================================================
    // Volume
    // =======================================================================

    /**
     * Toggle mute.
     */
    _toggleMute() {
      this._video.muted = !this._video.muted;
    }

    /**
     * Update the volume icon based on current volume/mute state.
     */
    _updateVolumeIcon() {
      const vol = this._video.volume;
      const muted = this._video.muted;

      let iconName;
      if (muted || vol === 0) {
        iconName = 'volumeMute';
      } else if (vol < 0.5) {
        iconName = 'volumeLow';
      } else {
        iconName = 'volumeHigh';
      }

      this._volumeSvg.replaceWith(icon(iconName));
      this._volumeSvg = this._volumeBtn.querySelector('svg') || this._volumeBtn.firstChild;

      // Keep slider in sync
      this._volumeSlider.value = muted ? 0 : vol;
    }

    // =======================================================================
    // Progress Bar
    // =======================================================================

    /**
     * Handle click on the progress bar to seek.
     * @param {MouseEvent} e
     */
    _onProgressClick(e) {
      if (this._locked) return;
      const rect = this._progressBar.getBoundingClientRect();
      const ratio = clamp((e.clientX - rect.left) / rect.width, 0, 1);
      const time = ratio * this._video.duration;
      this.seek(time);
    }

    /**
     * Handle hover on the progress bar to update tooltip.
     * @param {MouseEvent} e
     */
    _onProgressHover(e) {
      const rect = this._progressBar.getBoundingClientRect();
      const ratio = clamp((e.clientX - rect.left) / rect.width, 0, 1);
      const time = ratio * (this._video.duration || 0);
      this._progressTooltip.textContent = formatTime(time);
      this._progressTooltip.style.left = (ratio * 100) + '%';
    }

    /**
     * Handle touch start on progress bar (begin seeking).
     * @param {TouchEvent} e
     */
    _onProgressTouchStart(e) {
      if (this._locked) return;
      e.preventDefault();
      this._isSeeking = true;
      this._updateSeekFromTouch(e);
    }

    /**
     * Handle touch move on progress bar.
     * @param {TouchEvent} e
     */
    _onProgressTouchMove(e) {
      if (!this._isSeeking) return;
      e.preventDefault();
      this._updateSeekFromTouch(e);
    }

    /**
     * Handle touch end on progress bar (finish seeking).
     */
    _onProgressTouchEnd() {
      if (!this._isSeeking) return;
      this._isSeeking = false;
    }

    /**
     * Update seek position from touch coordinates.
     * @param {TouchEvent} e
     */
    _updateSeekFromTouch(e) {
      const touch = e.touches[0];
      const rect = this._progressBar.getBoundingClientRect();
      const ratio = clamp((touch.clientX - rect.left) / rect.width, 0, 1);
      const time = ratio * (this._video.duration || 0);
      this._video.currentTime = time;
      this._updateProgressUI(time, this._video.duration);
    }

    /**
     * Update the progress bar UI elements.
     * @param {number} current
     * @param {number} duration
     */
    _updateProgressUI(current, duration) {
      if (!duration || !Number.isFinite(duration)) return;
      const ratio = (current / duration) * 100;
      this._progressPlayed.style.width = ratio + '%';
      this._progressThumb.style.left = ratio + '%';
      this._timeDisplay.textContent = formatTime(current) + ' / ' + formatTime(duration);
    }

    /**
     * Update the buffered indicator.
     */
    _updateBuffered() {
      const v = this._video;
      if (v.buffered.length > 0 && Number.isFinite(v.duration) && v.duration > 0) {
        const buffEnd = v.buffered.end(v.buffered.length - 1);
        this._progressBuffered.style.width = (buffEnd / v.duration * 100) + '%';
      }
    }

    // =======================================================================
    // Video Event Handlers
    // =======================================================================

    /**
     * Called when video starts playing.
     */
    _onPlay() {
      // Update icon to pause
      this._playPauseSvg.replaceWith(icon('pause'));
      this._playPauseSvg = this._playPauseBtn.querySelector('svg') || this._playPauseBtn.firstChild;

      // Hide center play button
      this._centerPlay.classList.remove('show');

      // Show controls briefly, then auto-hide
      this._showControls();

      // Start progress saving interval
      this._startProgressSaving();

      // Suggest landscape on mobile (one-time)
      this._suggestLandscape();

      this.emit('play', { url: this._streamUrl, metadata: this._metadata });
    }

    /**
     * Called when video is paused.
     */
    _onPause() {
      // Update icon to play
      this._playPauseSvg.replaceWith(icon('play'));
      this._playPauseSvg = this._playPauseBtn.querySelector('svg') || this._playPauseBtn.firstChild;

      // Show center play button
      this._centerPlay.classList.add('show');

      // Show controls (don't auto-hide when paused)
      this._showControls();
      clearTimeout(this._controlsTimer);

      // Stop progress saving
      this._stopProgressSaving();

      this.emit('pause', { currentTime: this._video.currentTime, duration: this._video.duration });
    }

    /**
     * Called when video ends.
     */
    _onEnded() {
      this._stopProgressSaving();
      this._centerPlay.classList.add('show');

      // Auto next episode
      if (this._metadata && this._metadata.hasNextEpisode) {
        this.emit('play', { autoNext: true, metadata: this._metadata });
      }

      this.emit('ended', { url: this._streamUrl, metadata: this._metadata });
    }

    /**
     * Called on timeupdate.
     */
    _onTimeUpdate() {
      if (this._isSeeking) return; // Don't update while user is dragging
      const v = this._video;
      this._updateProgressUI(v.currentTime, v.duration);
      this._updateBuffered();

      this.emit('timeUpdate', {
        currentTime: v.currentTime,
        duration: v.duration,
        buffered: v.buffered,
      });
    }

    /**
     * Called when metadata is loaded.
     */
    _onLoadedMetadata() {
      this._updateProgressUI(0, this._video.duration);
      this._updateBuffered();
    }

    /**
     * Handle video errors.
     * @param {Event} e
     */
    _onError(e) {
      let errorMessage = 'An error occurred while playing the video.';
      const v = this._video;

      if (v.error) {
        switch (v.error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = 'Playback was aborted.';
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = 'A network error occurred. Please check your connection.';
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = 'The video could not be decoded. The format may be unsupported.';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'The video format is not supported or the stream is unavailable.';
            break;
          default:
            errorMessage = `Playback error (code ${v.error.code}).`;
        }
      }

      console.error('[Player] Error:', errorMessage, e);
      this._showLoading(false);
      this.emit('error', { message: errorMessage, event: e });
    }

    // =======================================================================
    // Loading / Buffering
    // =======================================================================

    /**
     * Show or hide the loading spinner.
     * @param {boolean} show
     */
    _showLoading(show) {
      this._loading.classList.toggle('active', show);
    }

    // =======================================================================
    // Keyboard Shortcuts
    // =======================================================================

    /**
     * Handle keyboard events.
     * @param {KeyboardEvent} e
     */
    _onKeyDown(e) {
      // Only handle shortcuts when player is active (visible)
      if (!this.container.classList.contains('active')) return;

      // Don't intercept if focus is in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      let handled = true;

      switch (e.key) {
        case ' ':
        case 'k':
          this._togglePlayPause();
          break;
        case 'ArrowLeft':
          this._seekRelative(-PLAYER_CONFIG.skipDuration);
          this._showSeekIndicator(-PLAYER_CONFIG.skipDuration);
          break;
        case 'ArrowRight':
          this._seekRelative(PLAYER_CONFIG.skipDuration);
          this._showSeekIndicator(PLAYER_CONFIG.skipDuration);
          break;
        case 'ArrowUp':
          e.preventDefault();
          this._video.volume = clamp(this._video.volume + 0.1, 0, 1);
          this._video.muted = false;
          this._volumeSlider.value = this._video.volume;
          break;
        case 'ArrowDown':
          e.preventDefault();
          this._video.volume = clamp(this._video.volume - 0.1, 0, 1);
          this._volumeSlider.value = this._video.volume;
          break;
        case 'f':
        case 'F':
          this._toggleFullscreen();
          break;
        case 'm':
        case 'M':
          this._toggleMute();
          break;
        case 'p':
        case 'P':
          this._togglePiP();
          break;
        case 'l':
        case 'L':
          this._toggleLock();
          break;
        case 'Escape':
          if (this._isFullscreen) {
            this._exitFullscreen();
          } else {
            this.stop();
            this.emit('destroyed', {});
          }
          break;
        default:
          handled = false;
      }

      if (handled) {
        e.preventDefault();
        e.stopPropagation();
        // Show controls on keyboard interaction
        this._showControls();
      }
    }

    // =======================================================================
    // Internal Helpers
    // =======================================================================

    /**
     * Toggle play/pause state.
     */
    _togglePlayPause() {
      if (this._video.paused || this._video.ended) {
        this.resume();
      } else {
        this.pause();
      }
    }

    /**
     * Seek by a relative number of seconds.
     * @param {number} delta  Positive = forward, negative = backward.
     */
    _seekRelative(delta) {
      if (!Number.isFinite(this._video.duration)) return;
      const newTime = clamp(this._video.currentTime + delta, 0, this._video.duration);
      this.seek(newTime);
      this.emit('seek', { currentTime: newTime, delta });
    }

    /**
     * Suggest landscape mode on mobile (one-time).
     */
    _suggestLandscape() {
      if (!isMobile() || this._landscapeSuggested || isLandscape()) return;
      this._landscapeSuggested = true;
      // Emit event — the app layer can show a toast
      this.emit('landscapeSuggested', {});
    }

    // =======================================================================
    // Progress Saving
    // =======================================================================

    /**
     * Start the periodic progress saving interval (every 5 seconds).
     */
    _startProgressSaving() {
      this._stopProgressSaving();
      this._progressTimer = setInterval(() => {
        if (this._video && !this._video.paused && Number.isFinite(this._video.duration) && this._video.duration > 0) {
          const progress = {
            streamId: this._metadata ? this._metadata.streamId : null,
            url: this._streamUrl,
            currentTime: this._video.currentTime,
            duration: this._video.duration,
            percentage: (this._video.currentTime / this._video.duration) * 100,
            timestamp: Date.now(),
          };
          this.emit('progress', progress);
        }
      }, 5000);
    }

    /**
     * Stop the progress saving interval.
     */
    _stopProgressSaving() {
      if (this._progressTimer) {
        clearInterval(this._progressTimer);
        this._progressTimer = null;
      }
      // Save final position
      if (this._video && Number.isFinite(this._video.duration) && this._video.duration > 0) {
        const progress = {
          streamId: this._metadata ? this._metadata.streamId : null,
          url: this._streamUrl,
          currentTime: this._video.currentTime,
          duration: this._video.duration,
          percentage: (this._video.currentTime / this._video.duration) * 100,
          timestamp: Date.now(),
        };
        this.emit('progress', progress);
      }
    }

    // =======================================================================
    // Public API
    // =======================================================================

    /**
     * Play a stream with fallback URLs — tries each URL in order until one works.
     * @param {string[]} urls      Array of stream URLs to try.
     * @param {Object}   metadata  Playback metadata.
     */
    async playWithFallback(urls, metadata) {
      if (!Array.isArray(urls) || urls.length === 0) {
        console.error('[Player] playWithFallback() requires a non-empty URLs array.');
        this.emit('error', { message: 'No stream URLs provided.' });
        return;
      }

      const self = this;
      const tryNext = async (index) => {
        if (index >= urls.length) {
          console.error('[Player] All stream URLs failed.');
          self._showLoading(false);
          self.emit('error', { message: 'All stream URLs failed.' });
          return;
        }

        const url = urls[index];
        console.info('[Player] Trying URL ' + (index + 1) + '/' + urls.length + ':', url.substring(0, 80) + '...');

        // Timeout — if no data loads in 15s, try next URL
        let timedOut = false;
        const timeout = setTimeout(() => {
          timedOut = true;
          console.warn('[Player] URL ' + (index + 1) + ' timed out, trying next...');
          self._destroyHLS();
          self._video.removeAttribute('src');
          self._video.load();
          tryNext(index + 1);
        }, 15000);

        // Clear timeout when data starts loading
        const onData = () => {
          if (timedOut) return;
          clearTimeout(timeout);
          console.info('[Player] URL ' + (index + 1) + ' — data loading successfully.');
        };
        self._video.addEventListener('loadeddata', onData, { once: true });

        // For HLS, clear timeout on manifest parse
        const originalPlay = self.play.bind(self);
        try {
          await originalPlay(url, metadata);
          // If HLS, listen for manifest parsed
          if (self._isHLS(url) && self._hls) {
            self._hls.on(Hls.Events.MANIFEST_PARSED, () => {
              if (timedOut) return;
              clearTimeout(timeout);
              console.info('[Player] HLS manifest parsed successfully.');
            });
          }
        } catch (e) {
          if (timedOut) return;
          clearTimeout(timeout);
          console.warn('[Player] Exception for URL ' + (index + 1) + ':', e);
          self._destroyHLS();
          self._video.removeAttribute('src');
          self._video.load();
          tryNext(index + 1);
        }
      };

      tryNext(0);
    }

    /**
     * Load and play a stream URL.
     *
     * @param {string}      url       Stream URL (can be .m3u8, .mp4, etc.)
     * @param {Object}      [metadata]  Optional metadata:
     *   @param {string}    metadata.title          Stream title
     *   @param {string}    metadata.subtitle       Stream subtitle / episode info
     *   @param {string}    metadata.type           Content type (movie, series, live, etc.)
     *   @param {string|number} metadata.streamId  Stream ID
     *   @param {string}    metadata.poster         Poster image URL
     *   @param {boolean}   metadata.hasNextEpisode Whether there's a next episode
     *   @param {Function}  metadata.getNextEpisode  Function to call for next episode
     * @param {number}     [metadata.resumePosition]  Saved position to resume from (seconds)
     */
    async play(url, metadata) {
      if (!url || typeof url !== 'string') {
        console.error('[Player] play() requires a valid URL.');
        this.emit('error', { message: 'No stream URL provided.' });
        return;
      }

      // Clean up previous stream
      this._destroyHLS();
      this._video.removeAttribute('src');
      this._video.load();

      // Store metadata
      this._streamUrl = url;
      this._metadata = metadata || {};
      this._resumeShown = false;

      // Reset brightness
      this._brightness = 1;
      this._updateBrightness();

      // Update UI with metadata
      this._titleEl.textContent = this._metadata.title || '';
      this._subtitleEl.textContent = this._metadata.subtitle || '';

      // Set poster if provided
      if (this._metadata.poster) {
        this._video.poster = this._metadata.poster;
      } else {
        this._video.removeAttribute('poster');
      }

      // Show container
      this.container.classList.add('active');

      // Show loading
      this._showLoading(true);

      // Reset progress bar
      this._updateProgressUI(0, 0);
      this._progressBuffered.style.width = '0%';

      // Check for resume position
      const resumePosition = this._metadata.resumePosition || null;
      if (resumePosition && resumePosition > 5) {
        // Show resume toast via event
        this.emit('resume', {
          position: resumePosition,
          formattedTime: formatTime(resumePosition),
          resume: () => {
            // Will seek after playback starts
            this._video.addEventListener('loadedmetadata', function onMeta() {
              this._video.currentTime = resumePosition;
              this._video.removeEventListener('loadedmetadata', onMeta);
            }.bind(this), { once: true });
          },
        });
        this._resumeShown = true;
      }

      // Determine playback method
      if (this._isHLS(url)) {
        const hlsJsAvailable = await this._loadHlsJs();
        this._initHLS(url);
      } else {
        // Direct video source
        this._video.src = url;
        this._video.addEventListener('loadeddata', () => {
          console.info('[Player] Video data loaded successfully.');
          this._showLoading(false);
        }, { once: true });
        this._video.play().catch(() => {
          // Autoplay may be blocked
          console.warn('[Player] Autoplay blocked or video error.');
          this._showLoading(false);
        });
      }

      // Set playback speed
      this._video.playbackRate = this._currentSpeed;
    }

    /**
     * Pause playback.
     */
    pause() {
      if (this._video) {
        this._video.pause();
      }
    }

    /**
     * Resume playback.
     */
    resume() {
      if (this._video) {
        this._video.play().catch(() => {
          // Autoplay blocked
          console.warn('[Player] Autoplay blocked. User interaction required.');
        });
      }
    }

    /**
     * Stop playback and hide the player.
     */
    stop() {
      this._stopProgressSaving();
      this._video.pause();
      this._destroyHLS();
      this._video.removeAttribute('src');
      this._video.load(); // Reset the video element
      this.container.classList.remove('active');
      this._showLoading(false);
      this._closeSettings();
      this._isFullscreen = false;

      // Remove fullscreen if active
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }

    /**
     * Seek to a specific time.
     * @param {number} time  Time in seconds.
     */
    seek(time) {
      if (!Number.isFinite(time) || time < 0) return;
      this._video.currentTime = time;
      this._updateProgressUI(time, this._video.duration);
    }

    /**
     * Get the current playback time.
     * @returns {number}
     */
    getCurrentTime() {
      return this._video ? this._video.currentTime : 0;
    }

    /**
     * Get the duration of the current stream.
     * @returns {number}
     */
    getDuration() {
      return this._video ? this._video.duration : 0;
    }

    /**
     * Check if the player is currently playing.
     * @returns {boolean}
     */
    isPlaying() {
      return this._video && !this._video.paused && !this._video.ended;
    }

    /**
     * Completely destroy the player — remove all event listeners, clean up.
     * Call this when the player is no longer needed.
     */
    destroy() {
      // Stop playback
      this.stop();
      this._destroyHLS();

      // Remove keyboard listener
      if (this._keydownHandler) {
        document.removeEventListener('keydown', this._keydownHandler);
        this._keydownHandler = null;
      }

      // Remove fullscreen listener
      if (this._fullscreenChangeHandler) {
        document.removeEventListener('fullscreenchange', this._fullscreenChangeHandler);
        document.removeEventListener('webkitfullscreenchange', this._fullscreenChangeHandler);
        this._fullscreenChangeHandler = null;
      }

      // Clear timers
      clearTimeout(this._controlsTimer);
      clearTimeout(this._doubleTapTimer);
      clearTimeout(this._seekIndicatorTimer);
      this._stopProgressSaving();

      // Remove all children from container
      while (this.container.firstChild) {
        this.container.removeChild(this.container.firstChild);
      }

      // Remove active class
      this.container.classList.remove('active', 'controls-hidden', 'locked');

      this.emit('destroyed', {});
    }
  }

  // ---------------------------------------------------------------------------
  // Register on the global namespace
  // ---------------------------------------------------------------------------
  global[NAMESPACE] = global[NAMESPACE] || {};
  global[NAMESPACE].Player = Player;

})(window);