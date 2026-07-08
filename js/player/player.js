/**
 * Video Player Module - hamadshow (Universal Format Support)
 * ===========================================================
 * Supported formats:
 *   HLS:     .m3u8          → hls.js
 *   MPEG-TS: .ts            → mpegts.js
 *   FLV:     .flv           → mpegts.js
 *   Native:  .mp4 .m4v .webm .ogg .ogv .3gp .mov  → <video> element
 *   Fallback: any URL without recognized ext → tries all methods in order
 *
 * Fallback chain for live streams: .m3u8 (HLS.js) → .ts (mpegts.js)
 */

class VideoPlayer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('Player container not found:', containerId);
            return;
        }

        this.video = null;
        this.hls = null;
        this.mpegtsPlayer = null;
        this.currentUrl = '';
        this.currentType = '';
        this._fallbackUrls = [];
        this._fallbackIndex = 0;
        this._isDestroyed = false;
        this._retryCount = 0;
        this._maxRetries = 2;
        this._eventListeners = {};
        this._mpegtsTimeout = null;

        // Format routing table
        this._formatHandlers = {
            'm3u8':  (url) => this._loadHLS(url),
            'ts':    (url) => this._loadMpegTS(url),
            'flv':   (url) => this._loadMpegTS(url),
            'mp4':   (url) => this._loadNative(url),
            'm4v':   (url) => this._loadNative(url),
            'webm':  (url) => this._loadNative(url),
            'ogg':   (url) => this._loadNative(url),
            'ogv':   (url) => this._loadNative(url),
            '3gp':   (url) => this._loadNative(url),
            'mov':   (url) => this._loadNative(url),
            'mkv':   (url) => this._loadNative(url),
            'avi':   (url) => this._loadNative(url),
            'wmv':   (url) => this._loadNative(url),
        };

        this._init();
    }

    _init() {
        // Create video element
        this.video = document.createElement('video');
        this.video.id = 'main-video-player';
        this.video.playsInline = true;
        this.video.preload = 'auto';
        this.video.style.width = '100%';
        this.video.style.height = '100%';
        this.video.style.objectFit = 'contain';
        this.video.style.backgroundColor = '#000';
        this.container.appendChild(this.video);

        // Native video error handler (for non-HLS / non-mpegts sources)
        this.video.addEventListener('error', (e) => {
            if (this._isDestroyed) return;
            console.warn('Native video error:', this.video.error);
            if (this.video.error) {
                const errorCode = this.video.error.code;
                const msgs = {
                    [MediaError.MEDIA_ERR_ABORTED]:       'Playback aborted',
                    [MediaError.MEDIA_ERR_NETWORK]:       'Network error while loading',
                    [MediaError.MEDIA_ERR_DECODE]:        'Decode error',
                    [MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED]: 'Format not supported by browser'
                };
                const msg = msgs[errorCode] || ('Error code: ' + errorCode);
                console.warn('Native video error detail:', msg);
                this._handleNativeError(msg);
            }
        });

        // Video event listeners
        this.video.addEventListener('loadedmetadata', () => this._emit('loadedmetadata'));
        this.video.addEventListener('loadeddata',   () => this._emit('loadeddata'));
        this.video.addEventListener('canplay',       () => this._emit('canplay'));
        this.video.addEventListener('play',          () => this._emit('play'));
        this.video.addEventListener('playing',       () => this._emit('playing'));
        this.video.addEventListener('pause',         () => this._emit('pause'));
        this.video.addEventListener('ended',         () => this._emit('ended'));
        this.video.addEventListener('waiting',       () => this._emit('buffering'));
        this.video.addEventListener('timeupdate', () => this._emit('timeupdate', {
            currentTime: this.video.currentTime,
            duration: this.video.duration
        }));
        this.video.addEventListener('volumechange', () => this._emit('volumechange', {
            volume: this.video.volume,
            muted: this.video.muted
        }));
        this.video.addEventListener('durationchange', () => this._emit('durationchange', {
            duration: this.video.duration
        }));
    }

    /* ═══════════════════════════════════════════
     *  PUBLIC API
     * ═══════════════════════════════════════════ */

    /**
     * Play a stream
     * @param {string} url         - Primary stream URL
     * @param {string} type        - 'live' | 'movie' | 'series' | 'episode'
     * @param {string[]} fallbacks - Fallback URLs (tried in order)
     * @param {Object}  meta       - { title, poster }
     */
    async play(url, type = 'movie', fallbacks = [], meta = {}) {
        if (this._isDestroyed) return;
        console.log('▶ play:', url, '| type:', type, '| fallbacks:', fallbacks.length);

        this._cleanup();

        this.currentUrl      = url;
        this.currentType     = type;
        this._fallbackUrls   = [...fallbacks];
        this._fallbackIndex  = 0;
        this._retryCount     = 0;
        this._isDestroyed    = false;

        if (meta.title)  this.video.title  = meta.title;
        if (meta.poster) this.video.poster = meta.poster;

        await this._loadStream(url);
    }

    /* ═══════════════════════════════════════════
     *  FORMAT ROUTER
     * ═══════════════════════════════════════════ */

    /**
     * Detects the format and routes to the correct loader
     */
    _loadStream(url) {
        if (this._isDestroyed) return;

        const ext = this._getExtension(url);
        console.log('_loadStream | ext:', ext, '| url:', url);

        if (ext && this._formatHandlers[ext]) {
            // Known extension → use specific handler
            this._formatHandlers[ext](url);
        } else if (!ext) {
            // No extension (e.g. /live/user/pass/12345)
            // Try auto-detect based on content type or default to HLS → mpegts → native
            console.log('No extension detected, trying auto-detect sequence');
            this._loadAutoDetect(url);
        } else {
            // Unknown extension → try native first, then mpegts
            console.log('Unknown extension:', ext, '— trying native then mpegts');
            this._loadWithBackup(url);
        }
    }

    /**
     * Auto-detect for URLs without extension:
     * Try HLS first (most common for live), then mpegts, then native
     */
    _loadAutoDetect(url) {
        // Store the original URL as an implicit first fallback
        // and try it with HLS first
        const tryHLS = () => {
            return new Promise((resolve) => {
                if (typeof Hls === 'undefined' || !Hls.isSupported()) {
                    resolve(false);
                    return;
                }
                console.log('Auto-detect: trying as HLS...');
                const testHls = new Hls({ enableWorker: false, maxBufferLength: 1 });
                let resolved = false;
                
                testHls.on(Hls.Events.MANIFEST_PARSED, () => {
                    if (resolved) return;
                    resolved = true;
                    console.log('Auto-detect: HLS manifest parsed ✓');
                    // Clean up test instance
                    testHls.destroy();
                    // Now load properly with the real HLS loader
                    this._loadHLS(url);
                    resolve(true);
                });

                testHls.on(Hls.Events.ERROR, (event, data) => {
                    if (resolved) return;
                    if (data.fatal) {
                        resolved = true;
                        console.log('Auto-detect: HLS failed ✗');
                        testHls.destroy();
                        resolve(false);
                    }
                });

                testHls.loadSource(url);

                // Timeout after 5s
                setTimeout(() => {
                    if (!resolved) {
                        resolved = true;
                        testHls.destroy();
                        console.log('Auto-detect: HLS timed out');
                        resolve(false);
                    }
                }, 5000);
            });
        };

        tryHLS().then((hlsWorked) => {
            if (hlsWorked || this._isDestroyed) return;

            // HLS failed → try mpegts
            if (typeof mpegts !== 'undefined' && mpegts.isSupported()) {
                console.log('Auto-detect: trying as MPEG-TS/FLV...');
                this._loadMpegTS(url);
            } else {
                // Last resort: native
                console.log('Auto-detect: falling back to native video');
                this._loadNative(url);
            }
        });
    }

    /**
     * Try native first, if it fails try mpegts as backup
     */
    _loadWithBackup(url) {
        // Set a flag so the native error handler knows to try mpegts next
        this._tryMpegtsOnNativeFail = true;
        this._loadNative(url);
    }

    /* ═══════════════════════════════════════════
     *  HLS LOADER  (.m3u8)
     * ═══════════════════════════════════════════ */

    _loadHLS(url) {
        // Safari supports HLS natively
        if (typeof Hls === 'undefined' || !Hls.isSupported()) {
            console.log('HLS.js not available, using native HLS (Safari)');
            this._loadNative(url);
            return;
        }

        this.hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            maxBufferLength: 30,
            maxMaxBufferLength: 60,
            maxBufferHole: 0.5,
            startLevel: -1,
            xhrSetup: (xhr) => { xhr.timeout = 15000; }
        });

        this.hls.loadSource(url);
        this.hls.attachMedia(this.video);

        this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
            console.log('HLS ✓ manifest parsed');
            this._attemptPlay();
        });

        this.hls.on(Hls.Events.ERROR, (_event, data) => {
            if (data.fatal) {
                switch (data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                        console.error('HLS fatal network error:', data.details);
                        this._handleNetworkError('HLS network error: ' + data.details);
                        break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                        console.warn('HLS media error, attempting recovery');
                        if (this._retryCount < this._maxRetries) {
                            this._retryCount++;
                            this.hls.recoverMediaError();
                        } else {
                            this._handleNetworkError('HLS media error after retries');
                        }
                        break;
                    default:
                        this._handleNetworkError('HLS error: ' + data.details);
                }
            }
        });
    }

    /* ═══════════════════════════════════════════
     *  MPEG-TS / FLV LOADER  (.ts, .flv)
     * ═══════════════════════════════════════════ */

    _loadMpegTS(url) {
        if (typeof mpegts === 'undefined' || !mpegts.isSupported()) {
            console.warn('mpegts.js not available, trying native');
            this._loadNative(url);
            return;
        }

        console.log('mpegts.js loading:', url);

        this.mpegtsPlayer = mpegts.createPlayer({
            type: 'mpegts',   // auto-detects MPEG-TS or FLV internally
            isLive: true,
            url: url
        }, {
            enableWorker: true,
            enableStashBuffer: false,
            stashInitialSize: 128,
            lazyLoad: false,
            liveBufferLatencyChasing: true,
            liveBufferLatencyChasingOnPaused: true,
            autoCleanupSourceBuffer: true
        });

        this.mpegtsPlayer.attachMediaElement(this.video);
        this.mpegtsPlayer.load();

        // ── Events ──
        this.mpegtsPlayer.on(mpegts.Events.ERROR, (errorType, detail, info) => {
            console.error('mpegts.js error:', errorType, detail);

            if (errorType === mpegts.ErrorTypes.NETWORK_ERROR) {
                this._handleNetworkError('MPEG-TS network error');
            } else if (errorType === mpegts.ErrorTypes.MEDIA_ERROR) {
                if (this._retryCount < this._maxRetries) {
                    this._retryCount++;
                    try { this.mpegtsPlayer.reload(); } 
                    catch (_) { this._handleNetworkError('MPEG-TS reload failed'); }
                } else {
                    this._handleNetworkError('MPEG-TS media error after retries');
                }
            } else {
                this._handleNetworkError('MPEG-TS error: ' + errorType);
            }
        });

        // Auto-play once data arrives
        this.video.addEventListener('loadeddata', () => {
            console.log('mpegts.js ✓ data loaded');
            this._attemptPlay();
        }, { once: true });

        // Timeout: if no video frames in 12 seconds, try next fallback
        this._mpegtsTimeout = setTimeout(() => {
            if (this.video.readyState < 2 && !this._isDestroyed) {
                console.warn('mpegts.js timeout (12s)');
                this._handleNetworkError('MPEG-TS timeout');
            }
        }, 12000);
    }

    /* ═══════════════════════════════════════════
     *  NATIVE VIDEO LOADER  (.mp4, .webm, .ogg, .mov, .mkv, etc.)
     * ═══════════════════════════════════════════ */

    _loadNative(url) {
        console.log('Native video loading:', url);

        // Build <source> elements for better browser format detection
        // Some browsers need the type hint to decide if they can play the file
        const ext = this._getExtension(url);
        const mimeType = this._getMimeType(ext);

        if (mimeType) {
            this.video.innerHTML = ''; // clear any old <source> tags
            const source = document.createElement('source');
            source.src = url;
            source.type = mimeType;
            this.video.appendChild(source);
        } else {
            this.video.removeAttribute('src');
            this.video.src = url;
        }

        this.video.load();
        this._attemptPlay();
    }

    /* ═══════════════════════════════════════════
     *  ERROR & FALLBACK HANDLING
     * ═══════════════════════════════════════════ */

    /**
     * Called when HLS.js or mpegts.js reports a fatal error
     */
    _handleNetworkError(reason) {
        if (this._isDestroyed) return;
        console.warn('⨯ Stream error:', reason);

        this._fallbackIndex++;
        if (this._fallbackIndex < this._fallbackUrls.length) {
            const next = this._fallbackUrls[this._fallbackIndex];
            console.log('↻ Trying fallback [' + this._fallbackIndex + '/' + (this._fallbackUrls.length - 1) + ']:', next);
            this._cleanup();
            this._isDestroyed  = false;
            this._retryCount   = 0;
            this._loadStream(next);
        } else {
            console.error('All fallback URLs exhausted');
            this._showError(reason || 'تعذر تشغيل البث. جرب قناة أخرى.');
        }
    }

    /**
     * Called when the native <video> element fires an error
     */
    _handleNativeError(reason) {
        if (this._isDestroyed) return;

        // If we set the backup flag, try mpegts before falling back
        if (this._tryMpegtsOnNativeFail) {
            this._tryMpegtsOnNativeFail = false;
            if (typeof mpegts !== 'undefined' && mpegts.isSupported()) {
                console.log('Native failed, trying mpegts.js as backup...');
                this._cleanup();
                this._isDestroyed = false;
                this._loadMpegTS(this.currentUrl);
                return;
            }
        }

        console.warn('⨯ Native video error:', reason);
        this._fallbackIndex++;
        if (this._fallbackIndex < this._fallbackUrls.length) {
            const next = this._fallbackUrls[this._fallbackIndex];
            console.log('↻ Trying fallback [' + this._fallbackIndex + '/' + (this._fallbackUrls.length - 1) + ']:', next);
            this._cleanup();
            this._isDestroyed  = false;
            this._retryCount   = 0;
            this._loadStream(next);
        } else {
            this._showError(reason || 'تعذر تشغيل هذا المحتوى. الصيغة غير مدعومة.');
        }
    }

    /* ═══════════════════════════════════════════
     *  PLAYBACK HELPERS
     * ═══════════════════════════════════════════ */

    async _attemptPlay() {
        try {
            await this.video.play();
            this._emit('playing');
        } catch (err) {
            console.warn('Autoplay blocked, trying muted:', err.message);
            try {
                this.video.muted = true;
                await this.video.play();
                this._emit('playing', { muted: true });
                this._emit('mutedAutoplay');
            } catch (_) {
                this._emit('error', { message: 'يرجى النقر على زر التشغيل' });
            }
        }
    }

    _showError(message) {
        console.error('Player error:', message);
        this._emit('error', { message: message || 'تعذر تشغيل هذا المحتوى' });
    }

    /* ═══════════════════════════════════════════
     *  CLEANUP
     * ═══════════════════════════════════════════ */

    _cleanup() {
        this._isDestroyed = true;

        if (this._mpegtsTimeout) {
            clearTimeout(this._mpegtsTimeout);
            this._mpegtsTimeout = null;
        }

        // Destroy HLS.js
        if (this.hls) {
            try { this.hls.destroy(); } catch (_) {}
            this.hls = null;
        }

        // Destroy mpegts.js
        if (this.mpegtsPlayer) {
            try {
                this.mpegtsPlayer.pause();
                this.mpegtsPlayer.unload();
                this.mpegtsPlayer.detachMediaElement();
                this.mpegtsPlayer.destroy();
            } catch (_) {}
            this.mpegtsPlayer = null;
        }

        // Reset native video
        if (this.video) {
            this.video.pause();
            this.video.removeAttribute('src');
            this.video.innerHTML = ''; // remove <source> elements
            this.video.load();
        }
    }

    destroy() {
        this._cleanup();
        this._isDestroyed    = true;
        this._fallbackUrls   = [];
        this._fallbackIndex  = 0;
        Object.keys(this._eventListeners).forEach(evt => {
            this._eventListeners[evt].forEach(fn => {
                this.video?.removeEventListener(evt, fn);
            });
        });
        this._eventListeners = {};
    }

    /* ═══════════════════════════════════════════
     *  PUBLIC CONTROLS
     * ═══════════════════════════════════════════ */

    pause()  { this.video?.pause(); }
    resume() { this._attemptPlay(); }
    seek(t)  { if (this.video) this.video.currentTime = t; }

    setVolume(v) {
        if (this.video) {
            this.video.volume = Math.max(0, Math.min(1, v));
            if (v > 0) this.video.muted = false;
        }
    }

    toggleMute() {
        if (this.video) { this.video.muted = !this.video.muted; return this.video.muted; }
    }

    toggleFullscreen() {
        if (!this.container) return;
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            (this.container.requestFullscreen || this.container.webkitRequestFullscreen || this.container.msRequestFullscreen)?.call(this.container);
        }
    }

    get currentTime() { return this.video?.currentTime || 0; }
    get duration()    { return (this.video?.duration && isFinite(this.video.duration)) ? this.video.duration : 0; }
    get volume()      { return this.video?.volume || 0; }
    get muted()       { return this.video?.muted || false; }
    get paused()      { return this.video?.paused || true; }
    get playing()     { return !this.paused; }
    isLive()          { return this.currentType === 'live'; }

    /* ═══════════════════════════════════════════
     *  EVENT SYSTEM
     * ═══════════════════════════════════════════ */

    on(event, callback) {
        if (!this._eventListeners[event]) this._eventListeners[event] = [];
        const fn = callback.bind(this);
        this._eventListeners[event].push(fn);
        this.video?.addEventListener(event, fn);
        return () => {
            this.video?.removeEventListener(event, fn);
            this._eventListeners[event] = this._eventListeners[event].filter(f => f !== fn);
        };
    }

    _emit(event, data) {
        (this._eventListeners[event] || []).forEach(fn => fn(data));
    }

    /* ═══════════════════════════════════════════
     *  UTILITIES
     * ═══════════════════════════════════════════ */

    _getExtension(url) {
        if (!url) return '';
        try {
            const pathname = new URL(url).pathname;
            const dot = pathname.lastIndexOf('.');
            if (dot !== -1) {
                return pathname.substring(dot + 1).split(/[?#]/)[0].toLowerCase();
            }
        } catch (_) {
            const m = url.match(/\.([a-z0-9]+)(?:[?#]|$)/i);
            if (m) return m[1].toLowerCase();
        }
        return '';
    }

    _getMimeType(ext) {
        const types = {
            'mp4':  'video/mp4',
            'm4v':  'video/mp4',
            'webm': 'video/webm',
            'ogg':  'video/ogg',
            'ogv':  'video/ogg',
            '3gp':  'video/3gpp',
            'mov':  'video/quicktime',
            'mkv':  'video/x-matroska',
            'avi':  'video/x-msvideo',
            'wmv':  'video/x-ms-wmv',
            'ts':   'video/mp2t',
            'm3u8': 'application/vnd.apple.mpegurl',
            'flv':  'video/x-flv'
        };
        return types[ext] || null;
    }
}

// Export
window.VideoPlayer = VideoPlayer;