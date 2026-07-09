/*========================================
  NASR LIVE - Video Player Module (HLS.js)
  ========================================*/

const NasrPlayer = (() => {
    'use strict';

    let hls = null;
    let videoEl = null;
    let currentItem = null;
    let currentType = null;
    let isPlaying = false;
    let progressSaveInterval = null;
    let controlsTimeout = null;
    let volume = 80;

    function init() {
        videoEl = document.getElementById('video-player');
        if (!videoEl) return;

        volume = NasrUtils.storageGet('nasr_volume', 80);
        videoEl.volume = volume / 100;

        bindEvents();
        setupKeyboardShortcuts();
    }

    function bindEvents() {
        // Play/Pause
        const btnPlayPause = document.getElementById('btn-play-pause');
        if (btnPlayPause) btnPlayPause.addEventListener('click', togglePlayPause);

        // Video overlay click
        const overlay = document.getElementById('video-overlay');
        if (overlay) overlay.addEventListener('click', togglePlayPause);

        // Center play button
        const centerPlay = document.getElementById('video-center-play');
        if (centerPlay) centerPlay.addEventListener('click', (e) => {
            e.stopPropagation();
            togglePlayPause();
        });

        // Volume
        const volumeBar = document.getElementById('volume-bar');
        if (volumeBar) {
            volumeBar.value = volume;
            volumeBar.addEventListener('input', (e) => {
                setVolume(e.target.value);
            });
        }

        const btnMute = document.getElementById('btn-mute');
        if (btnMute) btnMute.addEventListener('click', toggleMute);

        // Progress bar
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            progressBar.addEventListener('input', (e) => {
                if (videoEl.duration) {
                    videoEl.currentTime = (e.target.value / 100) * videoEl.duration;
                }
            });
        }

        // Fullscreen
        const btnFullscreen = document.getElementById('btn-fullscreen');
        if (btnFullscreen) btnFullscreen.addEventListener('click', toggleFullscreen);

        // PiP
        const btnPip = document.getElementById('btn-pip');
        if (btnPip) btnPip.addEventListener('click', togglePiP);

        // Close player
        const btnClose = document.getElementById('btn-close-player');
        if (btnClose) btnClose.addEventListener('click', destroy);

        // Next button
        const btnNext = document.getElementById('btn-next');
        if (btnNext) btnNext.addEventListener('click', playNext);

        // Fav current
        const btnFavCurrent = document.getElementById('btn-fav-current');
        if (btnFavCurrent) btnFavCurrent.addEventListener('click', toggleCurrentFav);

        // Video events
        videoEl.addEventListener('play', onPlay);
        videoEl.addEventListener('pause', onPause);
        videoEl.addEventListener('timeupdate', onTimeUpdate);
        videoEl.addEventListener('ended', onEnded);
        videoEl.addEventListener('error', onError);
        videoEl.addEventListener('loadedmetadata', onMetadata);
        videoEl.addEventListener('waiting', () => showBuffering(true));
        videoEl.addEventListener('canplay', () => showBuffering(false));

        // Video container hover for controls visibility
        const container = document.getElementById('video-container');
        if (container) {
            container.addEventListener('mousemove', showControls);
            container.addEventListener('mouseleave', hideControlsDelayed);
        }

        // Double click for fullscreen
        if (videoEl) {
            videoEl.addEventListener('dblclick', toggleFullscreen);
        }
    }

    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            const panel = document.getElementById('player-panel');
            if (panel && panel.classList.contains('hidden')) return;

            switch (e.key) {
                case ' ':
                case 'k':
                    e.preventDefault();
                    togglePlayPause();
                    break;
                case 'f':
                    e.preventDefault();
                    toggleFullscreen();
                    break;
                case 'm':
                    e.preventDefault();
                    toggleMute();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    if (videoEl.duration) videoEl.currentTime = Math.min(videoEl.duration, videoEl.currentTime + 10);
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    videoEl.currentTime = Math.max(0, videoEl.currentTime - 10);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setVolume(Math.min(100, volume + 10));
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    setVolume(Math.max(0, volume - 10));
                    break;
                case 'Escape':
                    if (document.fullscreenElement) {
                        document.exitFullscreen();
                    } else {
                        destroy();
                    }
                    break;
            }
        });
    }

    // Play a live channel
    function playLive(channel) {
        currentType = 'live';
        currentItem = channel;

        const streamUrl = NasrAPI.getLiveStreamUrl(channel.stream_id, channel.container_extension || 'ts');
        loadStream(streamUrl, channel);

        // Show EPG button
        const epgBtn = document.getElementById('btn-epg-toggle');
        if (epgBtn) epgBtn.style.display = '';

        // Hide progress bar and next button for live
        const progressWrap = document.querySelector('.controls-progress');
        if (progressWrap) progressWrap.style.display = 'none';
        const timeDisplay = document.getElementById('time-display');
        if (timeDisplay) timeDisplay.style.display = 'none';
        const btnNext = document.getElementById('btn-next');
        if (btnNext) btnNext.style.display = 'none';

        // Set EPG
        if (channel.epg_channel_id) {
            NasrEPG.setChannel(channel);
        }
    }

    // Play a VOD movie
    function playVod(movie) {
        currentType = 'movies';
        currentItem = movie;

        const streamUrl = NasrAPI.getVodStreamUrl(movie.stream_id, movie.container_extension || 'mp4');
        loadStream(streamUrl, movie);

        // Hide EPG button
        const epgBtn = document.getElementById('btn-epg-toggle');
        if (epgBtn) epgBtn.style.display = 'none';

        // Show progress bar, hide next for movies
        const progressWrap = document.querySelector('.controls-progress');
        if (progressWrap) progressWrap.style.display = '';
        const timeDisplay = document.getElementById('time-display');
        if (timeDisplay) timeDisplay.style.display = '';
        const btnNext = document.getElementById('btn-next');
        if (btnNext) btnNext.style.display = 'none';
    }

    // Play a series episode
    function playEpisode(episode, seriesInfo) {
        currentType = 'series';
        currentItem = { ...episode, seriesInfo };

        const streamUrl = NasrAPI.getEpisodeStreamUrl(
            episode.id, 
            episode.container_extension || 'mp4'
        );
        loadStream(streamUrl, episode);

        // Hide EPG button
        const epgBtn = document.getElementById('btn-epg-toggle');
        if (epgBtn) epgBtn.style.display = 'none';

        // Show progress bar and next button
        const progressWrap = document.querySelector('.controls-progress');
        if (progressWrap) progressWrap.style.display = '';
        const timeDisplay = document.getElementById('time-display');
        if (timeDisplay) timeDisplay.style.display = '';
        const btnNext = document.getElementById('btn-next');
        if (btnNext) btnNext.style.display = window.autoNextEpisode !== false ? '' : 'none';
    }

    // Load stream with HLS.js or native
    function loadStream(url, item) {
        // Show player panel
        const panel = document.getElementById('player-panel');
        if (panel) panel.classList.remove('hidden');

        // Update now playing info
        const title = document.getElementById('now-playing-title');
        const subtitle = document.getElementById('now-playing-subtitle');
        if (title) title.textContent = NasrUtils.improveName(item.name) || item.title || 'بدون اسم';
        if (subtitle) {
            subtitle.textContent = currentType === 'live' ? 'قناة مباشرة' :
                                  currentType === 'movies' ? 'فيلم' : 'مسلسل';
            if (item.episode_num) {
                subtitle.textContent += ` - الحلقة ${item.episode_num}`;
            }
        }

        // Destroy previous HLS instance
        if (hls) {
            hls.destroy();
            hls = null;
        }

        // Update fav button
        updateFavButtonState();

        // Highlight playing card in content
        document.querySelectorAll('.item-card.playing').forEach(el => el.classList.remove('playing'));
        const cardId = item.stream_id || item.series_id || item.id;
        if (cardId) {
            const card = document.querySelector(`.item-card[data-id="${cardId}"]`);
            if (card) {
                card.classList.add('playing');
                card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }

        // Determine if HLS
        const isHls = url.includes('.m3u8');

        if (isHls && Hls.isSupported()) {
            hls = new Hls({
                enableWorker: true,
                lowLatencyMode: currentType === 'live',
                maxBufferLength: currentType === 'live' ? 10 : 30,
                maxMaxBufferLength: currentType === 'live' ? 30 : 60
            });
            hls.loadSource(url);
            hls.attachMedia(videoEl);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                videoEl.play().catch(() => {});
            });
            hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            NasrUtils.showToast('خطأ في الشبكة، جاري إعادة المحاولة...', 'warning');
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            hls.recoverMediaError();
                            break;
                        default:
                            NasrUtils.showToast('فشل تشغيل هذا المحتوى', 'error');
                            break;
                    }
                }
            });
        } else if (isHls && videoEl.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS support (Safari)
            videoEl.src = url;
            videoEl.play().catch(() => {});
        } else {
            // Direct play
            videoEl.src = url;
            videoEl.play().catch(() => {});
        }
    }

    function togglePlayPause() {
        if (!videoEl) return;
        if (videoEl.paused) {
            videoEl.play().catch(() => {});
        } else {
            videoEl.pause();
        }
    }

    function onPlay() {
        isPlaying = true;
        updatePlayPauseButton();
        showCenterPlay(false);
        
        // Start saving progress for VOD/Series
        if (currentType !== 'live') {
            startProgressSave();
        }
    }

    function onPause() {
        isPlaying = false;
        updatePlayPauseButton();
        showCenterPlay(true);
        
        if (currentType !== 'live') {
            saveCurrentProgress();
        }
    }

    function onTimeUpdate() {
        if (!videoEl || !videoEl.duration || currentType === 'live') return;
        
        const progress = (videoEl.currentTime / videoEl.duration) * 100;
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) progressBar.value = progress;

        const timeDisplay = document.getElementById('time-display');
        if (timeDisplay) {
            timeDisplay.textContent = `${NasrUtils.formatTime(videoEl.currentTime)} / ${NasrUtils.formatTime(videoEl.duration)}`;
        }
    }

    function onEnded() {
        if (currentType === 'series' && window.autoNextEpisode !== false) {
            playNext();
        } else if (currentType !== 'live') {
            // Save completed
            saveCurrentProgress();
            showCenterPlay(true);
        }
    }

    function onError() {
        NasrUtils.showToast('حدث خطأ أثناء التشغيل', 'error');
    }

    function onMetadata() {
        // Metadata loaded
    }

    function showBuffering(show) {
        const overlay = document.getElementById('video-overlay');
        if (overlay && isPlaying) {
            overlay.style.cursor = show ? 'wait' : 'pointer';
        }
    }

    function updatePlayPauseButton() {
        const btn = document.getElementById('btn-play-pause');
        if (btn) {
            btn.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
        }
    }

    function showCenterPlay(show) {
        const el = document.getElementById('video-center-play');
        if (el) {
            el.classList.toggle('visible', show);
            el.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
        }
    }

    function setVolume(val) {
        volume = parseInt(val);
        if (videoEl) videoEl.volume = volume / 100;
        
        const volumeBar = document.getElementById('volume-bar');
        if (volumeBar) volumeBar.value = volume;

        const btnMute = document.getElementById('btn-mute');
        if (btnMute) {
            btnMute.innerHTML = volume === 0 ? '<i class="fas fa-volume-mute"></i>' :
                                volume < 50 ? '<i class="fas fa-volume-down"></i>' :
                                '<i class="fas fa-volume-up"></i>';
        }
        
        NasrUtils.storageSet('nasr_volume', volume);
    }

    function toggleMute() {
        if (!videoEl) return;
        if (videoEl.volume > 0) {
            videoEl._prevVolume = videoEl.volume;
            setVolume(0);
        } else {
            setVolume((videoEl._prevVolume || 80) * 100);
        }
    }

    function toggleFullscreen() {
        const container = document.getElementById('video-container');
        if (!container) return;

        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            container.requestFullscreen().catch(() => {
                NasrUtils.showToast('لا يمكن تفعيل ملء الشاشة', 'warning');
            });
        }
    }

    // Handle fullscreen change
    document.addEventListener('fullscreenchange', () => {
        const container = document.getElementById('video-container');
        const btn = document.getElementById('btn-fullscreen');
        if (container) {
            container.classList.toggle('fullscreen', !!document.fullscreenElement);
        }
        if (btn) {
            btn.innerHTML = document.fullscreenElement ? 
                '<i class="fas fa-compress"></i>' : '<i class="fas fa-expand"></i>';
        }
    });

    function togglePiP() {
        if (!videoEl) return;
        if (document.pictureInPictureElement) {
            document.exitPictureInPicture();
        } else if (videoEl.requestPictureInPicture) {
            videoEl.requestPictureInPicture().catch(() => {
                NasrUtils.showToast('PiP غير مدعوم في هذا المتصفح', 'warning');
            });
        }
    }

    function showControls() {
        const controls = document.getElementById('video-controls');
        if (controls) controls.classList.add('visible');
        clearTimeout(controlsTimeout);
        if (isPlaying) {
            controlsTimeout = setTimeout(hideControls, 3000);
        }
    }

    function hideControls() {
        if (!isPlaying) return;
        const controls = document.getElementById('video-controls');
        if (controls) controls.classList.remove('visible');
    }

    function hideControlsDelayed() {
        controlsTimeout = setTimeout(hideControls, 1000);
    }

    function playNext() {
        // Trigger next episode via app
        if (typeof NasrApp !== 'undefined' && NasrApp.playNextEpisode) {
            NasrApp.playNextEpisode();
        }
    }

    function toggleCurrentFav() {
        if (!currentItem) return;
        
        const type = currentType === 'live' ? 'live' : 
                     currentType === 'movies' ? 'movies' : 'series';
        const id = currentItem.stream_id || currentItem.series_id || currentItem.id;

        if (NasrFavorites.isFavorite(type, id)) {
            NasrFavorites.remove(type, id);
        } else {
            NasrFavorites.add(type, currentItem);
        }
        updateFavButtonState();
    }

    function updateFavButtonState() {
        const btn = document.getElementById('btn-fav-current');
        if (!btn || !currentItem) return;

        const type = currentType === 'live' ? 'live' : 
                     currentType === 'movies' ? 'movies' : 'series';
        const id = currentItem.stream_id || currentItem.series_id || currentItem.id;

        if (NasrFavorites.isFavorite(type, id)) {
            btn.innerHTML = '<i class="fas fa-heart" style="color: var(--danger)"></i>';
        } else {
            btn.innerHTML = '<i class="far fa-heart"></i>';
        }
    }

    function startProgressSave() {
        clearInterval(progressSaveInterval);
        progressSaveInterval = setInterval(() => {
            saveCurrentProgress();
        }, 10000); // Save every 10 seconds
    }

    function saveCurrentProgress() {
        if (!currentItem || !videoEl || !videoEl.duration) return;
        NasrFavorites.saveProgress(
            currentType,
            currentItem,
            videoEl.currentTime,
            videoEl.duration
        );
    }

    function destroy() {
        // Save progress before destroying
        if (currentType !== 'live') {
            saveCurrentProgress();
        }

        if (hls) {
            hls.destroy();
            hls = null;
        }
        if (videoEl) {
            videoEl.pause();
            videoEl.src = '';
            videoEl.load();
        }

        isPlaying = false;
        currentItem = null;
        currentType = null;
        clearInterval(progressSaveInterval);

        // Hide player panel
        const panel = document.getElementById('player-panel');
        if (panel) panel.classList.add('hidden');

        // Exit fullscreen
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
        }

        // Exit PiP
        if (document.pictureInPictureElement) {
            document.exitPictureInPicture().catch(() => {});
        }

        // Remove playing state from cards
        document.querySelectorAll('.item-card.playing').forEach(el => el.classList.remove('playing'));
    }

    function getCurrentItem() {
        return currentItem;
    }

    function getCurrentType() {
        return currentType;
    }

    function isCurrentlyPlaying() {
        return isPlaying;
    }

    return {
        init,
        playLive,
        playVod,
        playEpisode,
        togglePlayPause,
        toggleFullscreen,
        togglePiP,
        setVolume,
        destroy,
        getCurrentItem,
        getCurrentType,
        isCurrentlyPlaying
    };
})();