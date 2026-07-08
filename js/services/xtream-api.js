/**
 * Xtream Codes API Service - hamadshow
 * Handles authentication, EPG, and stream URL generation
 */

class XtreamAPI {
    constructor() {
        this.baseUrl = '';
        this.username = '';
        this.password = '';
        this.serverInfo = null;
        this.categories = { live: [], movie: [], series: [] };
        this._listeners = {};
    }

    /**
     * Initialize with credentials
     */
    init(baseUrl, username, password) {
        this.baseUrl = baseUrl.replace(/\/+$/, '');
        this.username = username;
        this.password = password;
        console.log('XtreamAPI initialized:', this.baseUrl);
    }

    /**
     * Build API URL
     */
    _apiUrl(action, params = {}) {
        const url = new URL(`${this.baseUrl}/player_api.php`);
        url.searchParams.set('username', this.username);
        url.searchParams.set('password', this.password);
        Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
        if (action) url.searchParams.set('action', action);
        return url.toString();
    }

    /**
     * Fetch with error handling
     */
    async _fetch(url, options = {}) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    ...options.headers
                }
            });
            clearTimeout(timeout);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (err) {
            clearTimeout(timeout);
            if (err.name === 'AbortError') {
                throw new Error('Connection timeout - server unreachable');
            }
            throw err;
        }
    }

    /**
     * Authenticate and get server info
     */
    async authenticate() {
        try {
            const data = await this._fetch(this._apiUrl(''));
            
            if (data.user_info?.auth === 0) {
                throw new Error('Invalid credentials');
            }

            this.serverInfo = data.server_info || {};
            this.userinfo = data.user_info || {};
            console.log('Authenticated:', this.userinfo?.username, '- Status:', this.user_info?.status);
            
            this._emit('authenticated', { userinfo: this.userinfo, serverInfo: this.serverInfo });
            return data;
        } catch (err) {
            console.error('Authentication failed:', err.message);
            this._emit('authError', { message: err.message });
            throw err;
        }
    }

    /**
     * Load all categories
     */
    async loadCategories() {
        try {
            const [live, movie, series] = await Promise.all([
                this._fetch(this._apiUrl('get_live_categories')),
                this._fetch(this._apiUrl('get_vod_categories')),
                this._fetch(this._apiUrl('get_series_categories'))
            ]);

            this.categories.live = live || [];
            this.categories.movie = movie || [];
            this.categories.series = series || [];

            console.log('Categories loaded:', {
                live: this.categories.live.length,
                movie: this.categories.movie.length,
                series: this.categories.series.length
            });

            this._emit('categoriesLoaded', this.categories);
            return this.categories;
        } catch (err) {
            console.error('Failed to load categories:', err.message);
            throw err;
        }
    }

    /**
     * Get live streams
     */
    async getLiveStreams(categoryId = null) {
        const params = {};
        if (categoryId) params.category_id = categoryId;
        return this._fetch(this._apiUrl('get_live_streams', params));
    }

    /**
     * Get VOD/movies
     */
    async getMovies(categoryId = null) {
        const params = {};
        if (categoryId) params.category_id = categoryId;
        return this._fetch(this._apiUrl('get_vod_streams', params));
    }

    /**
     * Get series
     */
    async getSeries(categoryId = null) {
        const params = {};
        if (categoryId) params.category_id = categoryId;
        return this._fetch(this._apiUrl('get_series', params));
    }

    /**
     * Get series info (seasons and episodes)
     */
    async getSeriesInfo(seriesId) {
        return this._fetch(this._apiUrl('get_series_info', { series_id: seriesId }));
    }

    /**
     * Get EPG for a channel
     */
    async getEPG(streamId, limit = 5) {
        return this._fetch(this._apiUrl('get_simple_data_table', {
            stream_id: streamId,
            limit: limit
        }));
    }

    /**
     * Get stream URL for a specific stream
     * @param {string|number} streamId
     * @param {string} type - 'live', 'movie', 'series'
     * @param {Object} [streamObj] - The full stream object (for container_extension)
     * @returns {string} The stream URL
     */
    getStreamUrl(streamId, type, streamObj) {
        const ext = (streamObj && streamObj.container_extension) 
            ? streamObj.container_extension 
            : this._getDefaultExtension(type);
        
        const url = `${this.baseUrl}/${type}/${this.username}/${this.password}/${streamId}.${ext}`;
        return url;
    }

    /**
     * Get multiple fallback URLs for a stream
     * Returns array of URLs to try in order
     * @param {string|number} streamId
     * @param {string} type - 'live', 'movie', 'series'
     * @param {Object} [streamObj] - The full stream object
     * @returns {string[]} Array of fallback URLs
     */
    getStreamUrlFallbacks(streamId, type, streamObj) {
        const urls = [];
        
        if (type === 'live') {
            // For live streams, try multiple formats in order of preference
            
            // 1. Try the container_extension from API (usually .ts)
            const apiExt = (streamObj && streamObj.container_extension) 
                ? streamObj.container_extension 
                : null;
            
            if (apiExt && apiExt !== 'm3u8') {
                // If API says .ts or other, try m3u8 first (best for web), then the API extension
                urls.push(`${this.baseUrl}/live/${this.username}/${this.password}/${streamId}.m3u8`);
                urls.push(`${this.baseUrl}/live/${this.username}/${this.password}/${streamId}.${apiExt}`);
            } else {
                // Default: try m3u8 first, then ts
                urls.push(`${this.baseUrl}/live/${this.username}/${this.password}/${streamId}.m3u8`);
                urls.push(`${this.baseUrl}/live/${this.username}/${this.password}/${streamId}.ts`);
            }
            
            // 3. Try without extension (some servers handle this)
            // urls.push(`${this.baseUrl}/live/${this.username}/${this.password}/${streamId}`);
            
        } else if (type === 'movie') {
            const ext = (streamObj && streamObj.container_extension) 
                ? streamObj.container_extension 
                : 'mp4';
            urls.push(`${this.baseUrl}/movie/${this.username}/${this.password}/${streamId}.${ext}`);
            
            // Fallback to mp4 if different extension
            if (ext !== 'mp4') {
                urls.push(`${this.baseUrl}/movie/${this.username}/${this.password}/${streamId}.mp4`);
            }
            if (ext !== 'mkv') {
                urls.push(`${this.baseUrl}/movie/${this.username}/${this.password}/${streamId}.mkv`);
            }
            
        } else if (type === 'series') {
            const ext = (streamObj && streamObj.container_extension) 
                ? streamObj.container_extension 
                : 'mp4';
            urls.push(`${this.baseUrl}/series/${this.username}/${this.password}/${streamId}.${ext}`);
            
            if (ext !== 'mp4') {
                urls.push(`${this.baseUrl}/series/${this.username}/${this.password}/${streamId}.mp4`);
            }
            if (ext !== 'mkv') {
                urls.push(`${this.baseUrl}/series/${this.username}/${this.password}/${streamId}.mkv`);
            }
        }
        
        console.log(`Stream fallbacks for ${type}/${streamId}:`, urls);
        return urls;
    }

    /**
     * Get default file extension for stream type
     */
    _getDefaultExtension(type) {
        switch (type) {
            case 'live': return 'ts';
            case 'movie': return 'mp4';
            case 'series': return 'mp4';
            default: return 'mp4';
        }
    }

    /**
     * Search across all content types
     */
    async search(query) {
        const [live, movies, series] = await Promise.allSettled([
            this.getLiveStreams(),
            this.getMovies(),
            this.getSeries()
        ]);

        const results = { live: [], movies: [], series: [] };
        const q = query.toLowerCase();

        if (live.status === 'fulfilled') {
            results.live = live.value.filter(item => 
                (item.name || '').toLowerCase().includes(q)
            );
        }
        if (movies.status === 'fulfilled') {
            results.movies = movies.value.filter(item => 
                (item.name || '').toLowerCase().includes(q)
            );
        }
        if (series.status === 'fulfilled') {
            results.series = series.value.filter(item => 
                (item.name || '').toLowerCase().includes(q)
            );
        }

        return results;
    }

    // ─── Event System ───

    on(event, callback) {
        if (!this._listeners[event]) this._listeners[event] = [];
        this._listeners[event].push(callback);
        return () => {
            this._listeners[event] = this._listeners[event].filter(fn => fn !== callback);
        };
    }

    _emit(event, data) {
        (this._listeners[event] || []).forEach(fn => fn(data));
    }

    // ─── Getters ───

    get isAuthenticated() {
        return !!this.userinfo;
    }

    get serverUrl() {
        return this.baseUrl;
    }
}

// Export as singleton
window.xtreamAPI = new XtreamAPI();
window.XtreamAPI = XtreamAPI;