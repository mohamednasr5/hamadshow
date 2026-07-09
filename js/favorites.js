/*========================================
  NASR LIVE - Favorites Module
  ========================================*/

const NasrFavorites = (() => {
    'use strict';

    const STORAGE_KEY = 'nasr_favorites';
    let favorites = { live: [], movies: [], series: [] };
    let currentTab = 'live';

    function init() {
        loadFavorites();
        bindEvents();
    }

    function loadFavorites() {
        favorites = NasrUtils.storageGet(STORAGE_KEY, { live: [], movies: [], series: [] });
    }

    function saveFavorites() {
        NasrUtils.storageSet(STORAGE_KEY, favorites);
    }

    function bindEvents() {
        // Favorites modal toggle
        const favToggle = document.getElementById('btn-favorites-toggle');
        if (favToggle) {
            favToggle.addEventListener('click', openFavoritesModal);
        }

        // Close favorites modal
        const favClose = document.getElementById('favorites-modal-close');
        if (favClose) {
            favClose.addEventListener('click', closeFavoritesModal);
        }

        // Tab switching
        const tabs = document.querySelectorAll('#fav-tabs .tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentTab = tab.dataset.favTab;
                renderFavorites();
            });
        });

        // Close on overlay click
        const modal = document.getElementById('favorites-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeFavoritesModal();
            });
        }
    }

    // Add item to favorites
    function add(type, item) {
        loadFavorites();
        if (!favorites[type]) favorites[type] = [];
        
        const exists = favorites[type].find(f => f.stream_id === item.stream_id || f.series_id === item.series_id);
        if (exists) {
            NasrUtils.showToast('موجود بالفعل في المفضلة', 'warning');
            return;
        }

        favorites[type].push({
            stream_id: item.stream_id || null,
            series_id: item.series_id || null,
            name: item.name || 'بدون اسم',
            cover: item.stream_icon || item.cover || '',
            category_id: item.category_id || '',
            epg_channel_id: item.epg_channel_id || '',
            container_extension: item.container_extension || 'mp4'
        });
        saveFavorites();
        NasrUtils.showToast('تمت الإضافة للمفضلة', 'success');
        updateFavButton();
    }

    // Remove item from favorites
    function remove(type, id) {
        loadFavorites();
        if (!favorites[type]) return;
        favorites[type] = favorites[type].filter(f => 
            (f.stream_id && f.stream_id !== id) || 
            (f.series_id && f.series_id !== id)
        );
        saveFavorites();
        renderFavorites();
        updateFavButton();
        NasrUtils.showToast('تمت الإزالة من المفضلة', 'info');
    }

    // Check if item is in favorites
    function isFavorite(type, id) {
        loadFavorites();
        if (!favorites[type]) return false;
        return favorites[type].some(f => 
            (f.stream_id && f.stream_id == id) || 
            (f.series_id && f.series_id == id)
        );
    }

    // Get favorites by type
    function getFavorites(type) {
        loadFavorites();
        return favorites[type] || [];
    }

    // Open favorites modal
    function openFavoritesModal() {
        const modal = document.getElementById('favorites-modal');
        if (modal) {
            modal.classList.remove('hidden');
            renderFavorites();
        }
    }

    // Close favorites modal
    function closeFavoritesModal() {
        const modal = document.getElementById('favorites-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    // Render favorites in modal
    function renderFavorites() {
        const body = document.getElementById('favorites-modal-body');
        const empty = document.getElementById('fav-empty');
        if (!body) return;

        const items = getFavorites(currentTab);
        
        if (items.length === 0) {
            body.innerHTML = `<div class="empty-state" id="fav-empty">
                <i class="far fa-heart"></i>
                <p>لا توجد عناصر في المفضلة</p>
            </div>`;
            return;
        }

        let html = '';
        items.forEach(item => {
            const imgSrc = item.cover || 'img/no_cover.jpg';
            const id = item.stream_id || item.series_id;
            html += `
                <div class="fav-item" data-type="${currentTab}" data-id="${id}">
                    <div class="fav-poster">
                        <img src="${NasrUtils.sanitize(imgSrc)}" alt="" onerror="this.src='img/no_cover.jpg'" loading="lazy" />
                    </div>
                    <div class="fav-info" onclick="NasrApp.playFavorite('${currentTab}', ${id})">
                        <div class="fav-name">${NasrUtils.sanitize(item.name)}</div>
                        <div class="fav-cat">${currentTab === 'live' ? 'قناة مباشرة' : currentTab === 'movies' ? 'فيلم' : 'مسلسل'}</div>
                    </div>
                    <button class="fav-remove" onclick="NasrFavorites.remove('${currentTab}', ${id})" title="إزالة">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>`;
        });
        body.innerHTML = html;
    }

    // Update the heart button state
    function updateFavButton() {
        // This is called by the player module when a new item plays
    }

    // Save continue watching progress
    function saveProgress(type, item, currentTime, duration) {
        if (!item || !duration || currentTime < 10) return;
        
        const key = 'nasr_continue';
        let list = NasrUtils.storageGet(key, []);
        
        const id = item.stream_id || item.series_id;
        const entry = {
            type,
            id,
            name: item.name || 'بدون اسم',
            cover: item.stream_icon || item.cover || '',
            progress: currentTime / duration,
            currentTime,
            duration,
            timestamp: Date.now(),
            container_extension: item.container_extension || 'mp4'
        };

        // Remove existing entry for same item
        list = list.filter(e => !(e.type === type && e.id === id));
        list.unshift(entry);
        
        // Keep max 20 items
        list = list.slice(0, 20);
        NasrUtils.storageSet(key, list);
    }

    // Get continue watching list
    function getContinueWatching() {
        return NasrUtils.storageGet('nasr_continue', []);
    }

    // Remove from continue watching
    function removeFromContinue(type, id) {
        const key = 'nasr_continue';
        let list = NasrUtils.storageGet(key, []);
        list = list.filter(e => !(e.type === type && e.id === id));
        NasrUtils.storageSet(key, list);
    }

    return {
        init,
        add,
        remove,
        isFavorite,
        getFavorites,
        openFavoritesModal,
        closeFavoritesModal,
        renderFavorites,
        saveProgress,
        getContinueWatching,
        removeFromContinue,
        updateFavButton
    };
})();