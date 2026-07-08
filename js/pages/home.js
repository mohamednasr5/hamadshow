/**
 * Home Page - hamadshow
 * =====================
 * Shows featured/recent content + live channels section
 * Live channel cards include Play + Favorites overlay buttons
 * 
 * Dependencies:
 *   - xtream-api.js (window.xtreamAPI)
 *   - player.js (window.VideoPlayer)
 */

const HomePage = {
    featuredMovies: [],
    featuredSeries: [],
    liveChannels: [],
    isLoading: false,

    /**
     * Initialize Home page
     */
    async init() {
        console.log('HomePage: Initializing...');
        this._bindEvents();
        await this._loadData();
    },

    /**
     * Bind events
     */
    _bindEvents() {
        // Delegate clicks for live channel cards on home page
        const liveSection = document.getElementById('home-live-grid') || 
                           document.getElementById('home-live-channels');
        if (liveSection) {
            liveSection.addEventListener('click', (e) => {
                const playBtn = e.target.closest('.btn-play');
                const favBtn = e.target.closest('.btn-fav');
                const card = e.target.closest('.live-card');

                if (playBtn) {
                    e.stopPropagation();
                    const streamId = card?.dataset?.streamId;
                    if (streamId) this._playLiveChannel(streamId, card);
                } else if (favBtn) {
                    e.stopPropagation();
                    const streamId = card?.dataset?.streamId;
                    if (streamId) this._toggleFavorite(streamId, favBtn, card);
                } else if (card) {
                    const streamId = card.dataset.streamId;
                    if (streamId) this._playLiveChannel(streamId, card);
                }
            });
        }

        // "See All" buttons
        document.querySelectorAll('[data-navigate-to]').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.dataset.navigateTo;
                if (window.app && window.app.navigate) {
                    window.app.navigate(page);
                } else if (window.location) {
                    window.location.hash = '#/' + page;
                }
            });
        });
    },

    /**
     * Load all home page data
     */
    async _loadData() {
        this.isLoading = true;

        try {
            // Load in parallel
            const [movies, series, live] = await Promise.allSettled([
                xtreamAPI.getMovies(),
                xtreamAPI.getSeries(),
                xtreamAPI.getLiveStreams()
            ]);

            if (movies.status === 'fulfilled') {
                this.featuredMovies = (movies.value || []).slice(0, 12);
                this._renderMovies(this.featuredMovies);
            }

            if (series.status === 'fulfilled') {
                this.featuredSeries = (series.value || []).slice(0, 12);
                this._renderSeries(this.featuredSeries);
            }

            if (live.status === 'fulfilled') {
                this.liveChannels = (live.value || []).slice(0, 12);
                this._renderLiveChannels(this.liveChannels);
            }

        } catch (err) {
            console.error('HomePage: Load error:', err.message);
        } finally {
            this.isLoading = false;
        }
    },

    /**
     * Render live channel cards on home page (horizontal scroll section)
     * Each card has Play + Favorites overlay
     */
    _renderLiveChannels(channels) {
        const container = document.getElementById('home-live-grid') || 
                         document.getElementById('home-live-channels');
        if (!container) return;

        if (!channels || channels.length === 0) {
            container.closest('.section')?.style.setProperty('display', 'none');
            return;
        }

        container.innerHTML = '';
        const fragment = document.createDocumentFragment();
        const favorites = this._getFavorites();

        channels.forEach(channel => {
            const card = this._createLiveCard(channel, favorites);
            fragment.appendChild(card);
        });

        container.appendChild(fragment);
    },

    /**
     * Create a live channel card for home page
     * Same style as movies/series cards: overlay with play + fav buttons
     */
    _createLiveCard(channel, favorites) {
        const streamId = channel.stream_id;
        const channelName = channel.name || 'قناة';
        const isFav = favorites.has(String(streamId));
        const imgUrl = channel.stream_icon || '';

        const card = document.createElement('div');
        card.className = 'live-card';
        card.dataset.streamId = streamId;
        card._channelData = channel;

        card.innerHTML = `
            <div class="card-image">
                <img src="${imgUrl}" alt="${this._escapeHtml(channelName)}" loading="lazy"
                     onerror="this.style.display='none'">
                <div class="live-badge">مباشر</div>
                <div class="card-overlay">
                    <button class="btn-play" title="تشغيل" aria-label="تشغيل القناة">
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    </button>
                    <button class="btn-fav ${isFav ? 'is-fav' : ''}" title="${isFav ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}" aria-label="إضافة للمفضلة">
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="${this._heartPath}"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="card-info">
                <img class="channel-logo" src="${imgUrl}" alt="" loading="lazy"
                     onerror="this.style.display='none'">
                <span class="channel-name" title="${this._escapeHtml(channelName)}">${this._escapeHtml(channelName)}</span>
            </div>
        `;

        return card;
    },

    /**
     * Render movie cards on home page
     */
    _renderMovies(movies) {
        const container = document.getElementById('home-movies-grid') || 
                         document.getElementById('home-movies');
        if (!container) return;

        if (!movies || movies.length === 0) {
            container.closest('.section')?.style.setProperty('display', 'none');
            return;
        }

        container.innerHTML = '';
        const fragment = document.createDocumentFragment();

        movies.forEach(movie => {
            const card = this._createMovieCard(movie);
            fragment.appendChild(card);
        });

        container.appendChild(fragment);
    },

    /**
     * Create a movie card
     */
    _createMovieCard(movie) {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.dataset.streamId = movie.stream_id;
        card._movieData = movie;

        const posterUrl = movie.stream_icon || movie.cover || '';
        const movieName = movie.name || 'فيلم';

        card.innerHTML = `
            <div class="card-image">
                <img src="${posterUrl}" alt="${this._escapeHtml(movieName)}" loading="lazy">
                <div class="card-overlay">
                    <button class="btn-play" title="تشغيل" aria-label="تشغيل الفيلم">
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    </button>
                    <button class="btn-fav" title="إضافة للمفضلة" aria-label="إضافة للمفضلة">
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="${this._heartPath}"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="card-info">
                <span class="movie-name">${this._escapeHtml(movieName)}</span>
            </div>
        `;

        // Click handler
        card.addEventListener('click', (e) => {
            const playBtn = e.target.closest('.btn-play');
            if (playBtn) {
                e.stopPropagation();
                this._playMovie(movie);
            } else if (!e.target.closest('.btn-fav')) {
                this._playMovie(movie);
            }
        });

        return card;
    },

    /**
     * Render series cards on home page
     */
    _renderSeries(seriesList) {
        const container = document.getElementById('home-series-grid') || 
                         document.getElementById('home-series');
        if (!container) return;

        if (!seriesList || seriesList.length === 0) {
            container.closest('.section')?.style.setProperty('display', 'none');
            return;
        }

        container.innerHTML = '';
        const fragment = document.createDocumentFragment();

        seriesList.forEach(series => {
            const card = this._createSeriesCard(series);
            fragment.appendChild(card);
        });

        container.appendChild(fragment);
    },

    /**
     * Create a series card
     */
    _createSeriesCard(series) {
        const card = document.createElement('div');
        card.className = 'series-card';
        card.dataset.seriesId = series.series_id;
        card._seriesData = series;

        const posterUrl = series.cover || series.stream_icon || '';
        const seriesName = series.name || 'مسلسل';

        card.innerHTML = `
            <div class="card-image">
                <img src="${posterUrl}" alt="${this._escapeHtml(seriesName)}" loading="lazy">
                <div class="card-overlay">
                    <button class="btn-play" title="تشغيل" aria-label="عرض المسلسل">
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    </button>
                    <button class="btn-fav" title="إضافة للمفضلة" aria-label="إضافة للمفضلة">
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="${this._heartPath}"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="card-info">
                <span class="series-name">${this._escapeHtml(seriesName)}</span>
            </div>
        `;

        card.addEventListener('click', (e) => {
            const playBtn = e.target.closest('.btn-play');
            if (playBtn) {
                e.stopPropagation();
                this._openSeries(series);
            } else if (!e.target.closest('.btn-fav')) {
                this._openSeries(series);
            }
        });

        return card;
    },

    /**
     * Play a live channel
     */
    _playLiveChannel(streamId, cardElement) {
        const channel = cardElement?._channelData;
        if (!channel) {
            const found = this.liveChannels.find(ch => String(ch.stream_id) === String(streamId));
            if (!found) return;
            this._doPlayLive(found);
        } else {
            this._doPlayLive(channel);
        }
    },

    _doPlayLive(channel) {
        const fallbackUrls = xtreamAPI.getStreamUrlFallbacks(channel.stream_id, 'live', channel);
        const primaryUrl = fallbackUrls[0];

        console.log('Home: Playing live channel:', channel.name, primaryUrl);

        if (window.app && window.app.player) {
            window.app.player.play(primaryUrl, 'live', fallbackUrls, {
                title: channel.name,
                poster: channel.stream_icon
            });
        } else if (window.player) {
            window.player.play(primaryUrl, 'live', fallbackUrls, {
                title: channel.name,
                poster: channel.stream_icon
            });
        }
    },

    /**
     * Play a movie
     */
    _playMovie(movie) {
        const fallbackUrls = xtreamAPI.getStreamUrlFallbacks(movie.stream_id, 'movie', movie);
        const primaryUrl = fallbackUrls[0];

        console.log('Home: Playing movie:', movie.name, primaryUrl);

        if (window.app && window.app.player) {
            window.app.player.play(primaryUrl, 'movie', fallbackUrls, {
                title: movie.name,
                poster: movie.stream_icon || movie.cover
            });
        } else if (window.player) {
            window.player.play(primaryUrl, 'movie', fallbackUrls, {
                title: movie.name,
                poster: movie.stream_icon || movie.cover
            });
        }
    },

    /**
     * Open series detail
     */
    _openSeries(series) {
        if (window.app && window.app.navigate) {
            window.app.navigate('series/' + series.series_id);
        } else {
            window.location.hash = '#/series/' + series.series_id;
        }
    },

    /**
     * Toggle favorite (for live channels on home page)
     */
    _toggleFavorite(streamId, favBtn, card) {
        const favorites = this._getFavorites();
        const id = String(streamId);
        const channel = card._channelData;

        if (favorites.has(id)) {
            favorites.delete(id);
            favBtn.classList.remove('is-fav');
            favBtn.title = 'إضافة للمفضلة';
            favBtn.querySelector('svg path').setAttribute('d', this._heartPath);
        } else {
            favorites.set(id, {
                stream_id: streamId,
                name: channel?.name || '',
                type: 'live',
                stream_icon: channel?.stream_icon || '',
                added_at: Date.now()
            });
            favBtn.classList.add('is-fav');
            favBtn.title = 'إزالة من المفضلة';
            favBtn.querySelector('svg path').setAttribute('d', this._heartFullPath);
            favBtn.classList.add('fav-anim');
            setTimeout(() => favBtn.classList.remove('fav-anim'), 400);
        }

        this._saveFavorites(favorites);
    },

    // ─── Favorites Helpers ───

    _getFavorites() {
        try {
            const data = JSON.parse(localStorage.getItem('hamadshow_favorites') || '{}');
            return new Map(Object.entries(data));
        } catch {
            return new Map();
        }
    },

    _saveFavorites(favorites) {
        const obj = Object.fromEntries(favorites);
        localStorage.setItem('hamadshow_favorites', JSON.stringify(obj));
    },

    // ─── Heart SVG Paths ───

    get _heartPath() {
        return 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z';
    },

    get _heartFullPath() {
        return 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z';
    },

    _escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
};

// Export
window.HomePage = HomePage;