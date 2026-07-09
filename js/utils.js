/*========================================
  NASR LIVE - Utility Functions
  ========================================*/

const NasrUtils = (() => {
    'use strict';

    // Format seconds to HH:MM:SS or MM:SS
    function formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '00:00';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        if (h > 0) {
            return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
        }
        return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    }

    // Format date to readable string (Arabic or English)
    function formatDate(timestamp, lang = 'ar') {
        if (!timestamp) return '';
        const date = new Date(timestamp * 1000);
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', options);
    }

    // Format time for EPG
    function formatEpgTime(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp * 1000);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }

    // Debounce function
    function debounce(fn, delay = 300) {
        let timer;
        return function(...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    // Show toast notification
    function showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<i class="${icons[type] || icons.info}"></i><span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // Sanitize HTML to prevent XSS
    function sanitize(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Generate a unique ID
    function uid() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    // LocalStorage helpers
    function storageGet(key, defaultValue = null) {
        try {
            const val = localStorage.getItem(key);
            return val ? JSON.parse(val) : defaultValue;
        } catch (e) {
            return defaultValue;
        }
    }

    function storageSet(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.warn('LocalStorage write failed:', e);
        }
    }

    function storageRemove(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {}
    }

    // Improve VOD name (remove quality, codec info etc.)
    function improveName(name) {
        if (!name) return '';
        return name
            .replace(/\b(480p|720p|1080p|2160p|4K|UHD|HDR|HEVC|x264|x265|h264|h265|AAC|AC3|DTS|WEB-DL|WEBRip|BluRay|BDRip|DVDRip|HDTV|HDTC|CAMRip|CAM|TS|PDTV|WORKPRINT)\b/gi, '')
            .replace(/[\[\(]([^)\]]*)[\]\)]/g, '')
            .replace(/\./g, ' ')
            .replace(/_/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    // Get image URL, fallback to placeholder
    function getImageUrl(streamUrl, coverUrl) {
        if (coverUrl) {
            return coverUrl.startsWith('http') ? coverUrl : streamUrl + '/' + coverUrl;
        }
        return 'img/no_cover.jpg';
    }

    // Check if element is in viewport
    function isInViewport(el) {
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    // Create skeleton loading elements
    function createSkeletons(count = 12) {
        let html = '';
        for (let i = 0; i < count; i++) {
            html += `
                <div class="skeleton-card" style="animation-delay: ${i * 0.05}s">
                    <div class="skeleton skeleton-poster"></div>
                    <div style="padding: 10px">
                        <div class="skeleton skeleton-title"></div>
                        <div class="skeleton skeleton-meta"></div>
                    </div>
                </div>`;
        }
        return html;
    }

    // Get proxy URL if CORS is enabled
    function getProxyUrl(url) {
        if (window.cors === true && window.dns) {
            return 'proxy.php?url=' + encodeURIComponent(url);
        }
        return url;
    }

    // Capitalize first letter
    function capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    return {
        formatTime,
        formatDate,
        formatEpgTime,
        debounce,
        showToast,
        sanitize,
        uid,
        storageGet,
        storageSet,
        storageRemove,
        improveName,
        getImageUrl,
        isInViewport,
        createSkeletons,
        getProxyUrl,
        capitalize
    };
})();