/**
 * Live TV Page - hamadshow
 * =========================
 * Renders live channel cards with Play + Favorites overlay buttons
 * (matching movie/series card style)
 * 
 * Dependencies:
 *   - xtream-api.js (window.xtreamAPI)
 *   - player.js (window.VideoPlayer)
 *   - favorites system (localStorage or firebase)
 */

const LiveTVPage = {
    channels: [],
    categories: [],
    selectedCategory: null,
    currentPage: 1,
    isLoading: false,

    /**
     * Initialize the Live TV page
     */
    async init() {
        console.log('LiveTVPage: Initializing...');
        this._bindEvents();
        await this._loadCategories();
        await this._loadChannels();
    },

    /**
     * Bind page events
     */
    _bindEvents() {
        // Category filter change
        const catSelect = document.getElementById('live-category-filter');
        if (catSelect) {
            catSelect.addEventListener('change', (e) => {
                this.selectedCategory = e.target.value || null;
                this.currentPage = 1;
                this._loadChannels();
            });
        }

        // Search input
        const searchInput = document.getElementById('live-search-input');
        if (searchInput) {
            let debounceTimer;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    this._filterChannels(e.target.value.trim());
                }, 300);
            });
        }

        // Delegate click events on the channels grid
        const grid = document.getElementById('live-channels-grid') || document.getElementById('live-channels-container');
        if (grid) {
            grid.addEventListener('click', (e) => {
                const playBtn = e.target.closest('.btn-play');
                const favBtn = e.target.closest('.btn-fav');
                const card = e.target.closest('.live-card');

                if (playBtn) {
                    e.stopPropagation();
                    const streamId = card?.dataset?.streamId;
                    if (streamId) this._playChannel(streamId, card);
                } else if (favBtn) {
                    e.stopPropagation();
                    const streamId = card?.dataset?.streamId;
                    if (streamId) this._toggleFavorite(streamId, favBtn, card);
                } else if (card) {
                    // Clicking the card itself also plays
                    const streamId = card.dataset.streamId;
                    if (streamId) this._playChannel(streamId, card);
                }
            });
        }
    },

    /**
     * Load live categories
     */
    async _loadCategories() {
        try {
            this.categories = await xtreamAPI.getLiveCategories();
            this._renderCategories();
        } catch (err) {
            console.error('LiveTVPage: Failed to load categories:', err.message);
        }
    },

    /**
     * Render category filter dropdown
     */
    _renderCategories() {
        const select = document.getElementById('live-category-filter');
        if (!select) return;

        select.innerHTML = '<option value="">جميع القنوات</option>';
        this.categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.category_id;
            option.textContent = cat.category_name;
            select.appendChild(option);
        });
    },

    /**
     * Load live channels from API
     */
    async _loadChannels() {
        if (this.isLoading) return;
        this.isLoading = true;
        this._showLoading();

        try {
            const catId = this.selectedCategory;
            this.channels = await xtreamAPI.getLiveStreams(catId);
            console.log('LiveTVPage: Loaded', this.channels.length, 'channels');
            this._renderChannels(this.channels);
        } catch (err) {
            console.error('LiveTVPage: Failed to load channels:', err.message);
            this._renderError(err.message);
        } finally {
            this.isLoading = false;
        }
    },

    /**
     * Filter channels by search text
     */
    _filterChannels(query) {
        if (!query) {
            this._renderChannels(this.channels);
            return;
        }

        const q = query.toLowerCase();
        const filtered = this.channels.filter(ch =>
            (ch.name || '').toLowerCase().includes(q) ||
            (ch.epg_channel_id || '').toString().includes(q)
        );
        this._renderChannels(filtered);
    },

    /**
     * Render channel cards into the grid
     * Each card has: image, overlay (play + fav buttons), channel info
     */
    _renderChannels(channels) {
        const grid = document.getElementById('live-channels-grid') || document.getElementById('live-channels-container');
        if (!grid) return;

        if (!channels || channels.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #888;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 16px; opacity: 0.4;">
                        <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                    <p style="font-size: 16px;">لا توجد قنوات</p>
                    <p style="font-size: 13px; margin-top: 4px;">جرب تغيير التصنيف أو البحث</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = '';
        grid.className = 'live-channels-grid';

        const fragment = document.createDocumentFragment();
        const favorites = this._getFavorites();

        channels.forEach(channel => {
            const card = this._createChannelCard(channel, favorites);
            fragment.appendChild(card);
        });

        grid.appendChild(fragment);
    },

    /**
     * Create a single live channel card element
     * Structure:
     *   .live-card [data-stream-id]
     *     .card-image
     *       img (channel logo/stream icon)
     *       .live-badge (LIVE indicator)
     *       .card-overlay
     *         .btn-play (play triangle)
     *         .btn-fav (heart icon)
     *     .card-info
     *       img.channel-logo (small)
     *       .channel-name
     */
    _createChannelCard(channel, favorites) {
        const streamId = channel.stream_id;
        const channelName = channel.name || 'قناة غير معروفة';
        const channelId = channel.epg_channel_id || '';
        const isFav = favorites.has(String(streamId));

        const card = document.createElement('div');
        card.className = 'live-card';
        card.dataset.streamId = streamId;

        // Get image - prefer stream_icon, fallback to epg_channel_id based logo
        const imgUrl = channel.stream_icon || 
                       (channelId ? `https://epg-guide.com/channels/${channelId}.png` : '');

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
                            <path d="${isFav ? this._heartFullPath : this._heartPath}"/>
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

        // Store channel data on the card element for easy access
        card._channelData = channel;

        return card;
    },

    /**
     * Play a live channel
     */
    _playChannel(streamId, cardElement) {
        const channel = cardElement?._channelData;
        if (!channel) {
            // Find channel from array
            const found = this.channels.find(ch => String(ch.stream_id) === String(streamId));
            if (!found) {
                console.error('Channel not found:', streamId);
                return;
            }
            this._doPlay(found);
        } else {
            this._doPlay(channel);
        }
    },

    /**
     * Execute playback using fallback URLs
     */
    _doPlay(channel) {
        const streamId = channel.stream_id;
        const fallbackUrls = xtreamAPI.getStreamUrlFallbacks(streamId, 'live', channel);
        const primaryUrl = fallbackUrls[0];

        console.log('Playing live channel:', channel.name, primaryUrl);

        // Trigger player (depends on your app architecture)
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
     * Toggle favorite status for a channel
     */
    _toggleFavorite(streamId, favBtn, card) {
        const favorites = this._getFavorites();
        const id = String(streamId);
        const channel = card._channelData;

        if (favorites.has(id)) {
            // Remove from favorites
            favorites.delete(id);
            favBtn.classList.remove('is-fav');
            favBtn.title = 'إضافة للمفضلة';
            // Update heart icon to outline
            favBtn.querySelector('svg path').setAttribute('d', this._heartPath);
            console.log('Removed from favorites:', channel?.name);
        } else {
            // Add to favorites
            favorites.set(id, {
                stream_id: streamId,
                name: channel?.name || '',
                type: 'live',
                stream_icon: channel?.stream_icon || '',
                added_at: Date.now()
            });
            favBtn.classList.add('is-fav');
            favBtn.title = 'إزالة من المفضلة';
            // Update heart icon to filled
            favBtn.querySelector('svg path').setAttribute('d', this._heartFullPath);
            // Bounce animation
            favBtn.classList.add('fav-anim');
            setTimeout(() => favBtn.classList.remove('fav-anim'), 400);
            console.log('Added to favorites:', channel?.name);
        }

        this._saveFavorites(favorites);
    },

    /**
     * Get favorites from localStorage
     */
    _getFavorites() {
        try {
            const data = JSON.parse(localStorage.getItem('hamadshow_favorites') || '{}');
            return new Map(Object.entries(data));
        } catch {
            return new Map();
        }
    },

    /**
     * Save favorites to localStorage
     */
    _saveFavorites(favorites) {
        const obj = Object.fromEntries(favorites);
        localStorage.setItem('hamadshow_favorites', JSON.stringify(obj));
    },

    /**
     * Show loading skeleton
     */
    _showLoading() {
        const grid = document.getElementById('live-channels-grid') || document.getElementById('live-channels-container');
        if (!grid) return;

        let html = '';
        for (let i = 0; i < 12; i++) {
            html += `
                <div class="live-card skeleton">
                    <div class="card-image"></div>
                    <div class="card-info">
                        <div style="width:32px;height:32px;border-radius:6px;background:#16213e;flex-shrink:0;"></div>
                        <div style="flex:1;height:14px;border-radius:4px;background:#16213e;"></div>
                    </div>
                </div>
            `;
        }
        grid.innerHTML = html;
        grid.className = 'live-channels-grid';
    },

    /**
     * Show error state
     */
    _renderError(message) {
        const grid = document.getElementById('live-channels-grid') || document.getElementById('live-channels-container');
        if (!grid) return;

        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #e94560;">
                <p style="font-size: 16px; font-weight: 600;">خطأ في تحميل القنوات</p>
                <p style="font-size: 13px; margin-top: 8px; color: #888;">${this._escapeHtml(message)}</p>
                <button onclick="LiveTVPage._loadChannels()" 
                        style="margin-top: 16px; padding: 10px 24px; background: #e94560; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                    إعادة المحاولة
                </button>
            </div>
        `;
    },

    // ─── Heart SVG Paths ───
    get _heartPath() {
        return 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z';
    },

    get _heartFullPath() {
        return 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z';
    },

    /**
     * Escape HTML to prevent XSS
     */
    _escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
};

// Export
window.LiveTVPage = LiveTVPage;