/*========================================
  NASR LIVE - Xtream API Module
  ========================================*/

const NasrAPI = (() => {
    'use strict';

    let baseUrl = '';
    let username = '';
    let password = '';
    let userInfo = null;

    // Build the API base URL
    function buildBaseUrl(dns, user, pass) {
        const protocol = window.https ? 'https' : 'http';
        // Remove trailing slash from dns
        dns = dns.replace(/\/+$/, '');
        // Ensure protocol is included
        if (!dns.startsWith('http')) {
            dns = protocol + '://' + dns;
        }
        return `${dns}/player_api.php?username=${encodeURIComponent(user)}&password=${encodeURIComponent(pass)}`;
    }

    // Make HTTP request
    async function request(url, method = 'GET', body = null) {
        const proxyUrl = NasrUtils.getProxyUrl(url);
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (body) {
            options.body = JSON.stringify(body);
            options.method = 'POST';
        }
        try {
            const response = await fetch(proxyUrl, options);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.json();
        } catch (err) {
            console.error('API request failed:', err);
            throw err;
        }
    }

    // Login / Authenticate
    async function login(dns, user, pass) {
        baseUrl = buildBaseUrl(dns, user, pass);
        username = user;
        password = pass;

        try {
            const data = await request(baseUrl);
            if (data && data.user_info && data.user_info.auth === 1) {
                userInfo = data.user_info;
                // Store session
                NasrUtils.storageSet('nasr_session', {
                    dns, username: user, password: pass,
                    userInfo: data.user_info,
                    serverInfo: data.server_info
                });
                return { success: true, data };
            } else {
                return { success: false, error: 'بيانات الدخول غير صحيحة' };
            }
        } catch (err) {
            return {
                success: false,
                error: 'فشل الاتصال بالخادم. تأكد من صحة الرابط وبيانات الدخول.'
            };
        }
    }

    // Restore session from storage
    function restoreSession() {
        const session = NasrUtils.storageGet('nasr_session');
        if (session) {
            baseUrl = buildBaseUrl(session.dns, session.username, session.password);
            username = session.username;
            password = session.password;
            userInfo = session.userInfo;
            return session;
        }
        return null;
    }

    // Logout
    function logout() {
        baseUrl = '';
        username = '';
        password = '';
        userInfo = null;
        NasrUtils.storageRemove('nasr_session');
    }

    // Get user info
    function getUserInfo() {
        return userInfo;
    }

    // Get Live TV categories
    async function getLiveCategories() {
        const data = await request(baseUrl + '&action=get_live_categories');
        return data || [];
    }

    // Get Live TV streams
    async function getLiveStreams(categoryId = null) {
        let url = baseUrl + '&action=get_live_streams';
        if (categoryId) url += '&category_id=' + categoryId;
        const data = await request(url);
        return data || [];
    }

    // Get VOD categories
    async function getVodCategories() {
        const data = await request(baseUrl + '&action=get_vod_categories');
        return data || [];
    }

    // Get VOD streams
    async function getVodStreams(categoryId = null) {
        let url = baseUrl + '&action=get_vod_streams';
        if (categoryId) url += '&category_id=' + categoryId;
        const data = await request(url);
        return data || [];
    }

    // Get Series categories
    async function getSeriesCategories() {
        const data = await request(baseUrl + '&action=get_series_categories');
        return data || [];
    }

    // Get Series list
    async function getSeries(categoryId = null) {
        let url = baseUrl + '&action=get_series';
        if (categoryId) url += '&category_id=' + categoryId;
        const data = await request(url);
        return data || [];
    }

    // Get Series info (seasons + episodes)
    async function getSeriesInfo(seriesId) {
        const url = baseUrl + '&action=get_series_info&series_id=' + seriesId;
        const data = await request(url);
        return data || {};
    }

    // Get stream URL for live channel
    function getLiveStreamUrl(streamId, ext = 'ts') {
        const protocol = window.https ? 'https' : 'http';
        const dns = userInfo && userInfo.server_url ? userInfo.server_url.replace(/\/+$/, '') : '';
        return `${protocol}://${dns}/live/${username}/${password}/${streamId}.${ext}`;
    }

    // Get stream URL for VOD
    function getVodStreamUrl(streamId, ext = 'mp4') {
        const protocol = window.https ? 'https' : 'http';
        const dns = userInfo && userInfo.server_url ? userInfo.server_url.replace(/\/+$/, '') : '';
        return `${protocol}://${dns}/movie/${username}/${password}/${streamId}.${ext}`;
    }

    // Get stream URL for series episode
    function getEpisodeStreamUrl(episodeId, ext = 'mp4') {
        const protocol = window.https ? 'https' : 'http';
        const dns = userInfo && userInfo.server_url ? userInfo.server_url.replace(/\/+$/, '') : '';
        return `${protocol}://${dns}/series/${username}/${password}/${episodeId}.${ext}`;
    }

    // Search across all content types
    async function searchAll(query) {
        try {
            const [live, vod, series] = await Promise.all([
                getLiveStreams(),
                getVodStreams(),
                getSeries()
            ]);
            const q = query.toLowerCase();
            return {
                live: live.filter(s => (s.name || '').toLowerCase().includes(q)),
                vod: vod.filter(s => (s.name || '').toLowerCase().includes(q)),
                series: series.filter(s => (s.name || '').toLowerCase().includes(q))
            };
        } catch (err) {
            console.error('Search failed:', err);
            return { live: [], vod: [], series: [] };
        }
    }

    // Check if authenticated
    function isAuthenticated() {
        return !!userInfo;
    }

    // Get EPG data (if PHP backend is available)
    async function getEpg(epgId, start, stop) {
        try {
            const formData = new FormData();
            formData.append('epg_id', epgId);
            formData.append('start', start);
            formData.append('stop', stop);
            const response = await fetch('epg.php', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            return data.epg_listings || [];
        } catch (err) {
            console.warn('EPG fetch failed:', err);
            return [];
        }
    }

    return {
        login,
        restoreSession,
        logout,
        getUserInfo,
        isAuthenticated,
        getLiveCategories,
        getLiveStreams,
        getVodCategories,
        getVodStreams,
        getSeriesCategories,
        getSeries,
        getSeriesInfo,
        getLiveStreamUrl,
        getVodStreamUrl,
        getEpisodeStreamUrl,
        searchAll,
        getEpg
    };
})();