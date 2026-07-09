/*======================================== 
  NASR LIVE - Main Application Controller
  ========================================*/

const NasrApp = (() => {
    'use strict';

    // State
    let state = {
        currentScreen: 'login-screen',
        currentMode: null,       // 'live', 'movies', 'series'
        currentCategory: null,
        categories: [],
        streams: [],
        filteredStreams: [],
        currentView: window.defaultView || 'grid',
        searchQuery: '',
        isSearching: false,
        seriesInfo: null,
        currentSeason: null,
        currentEpisodeList: [],
        currentEpisodeIndex: -1,
        sidebarOpen: true
    };

    // ===== INITIALIZATION =====
    function init() {
        // Initialize all modules
        NasrAuth.init();
        NasrPlayer.init();
        NasrFavorites.init();
        NasrEPG.init();
        NasrRouter.init();

        // Bind main UI events
        bindMainMenuEvents();
        bindNavEvents();
        bindSearchEvents();
        bindSidebarEvents();
        bindViewToggle();
        bindAccountModal();
        bindMobileNav();
        bindSeriesPanel();

        // Set initial screen
        if (!NasrAPI.isAuthenticated()) {
            showScreen('login-screen');
        }

        // Load continue watching
        renderContinueWatching();

        // Handle HTTPS redirect
        if (window.location.protocol !== 'https:' && window.https === true) {
            window.location = window.location.href.replace('http', 'https');
        } else if (window.location.protocol === 'https:' && window.https === false) {
            window.location = window.location.href.replace('https', 'http');
        }

        // Timer for EPG progress update
        setInterval(() => {
            // Periodic tasks can go here
        }, 60000);

        console.log('%c Nasr Live IPTV Player Loaded ', 'background: #F5A623; color: #1A1A2E; font-weight: bold; padding: 4px 8px; border-radius: 4px;');
    }

    // ===== SCREEN MANAGEMENT =====
    function showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const screen = document.getElementById(screenId);
        if (screen) screen.classList.add('active');
        state.currentScreen = screenId;

        // Update mobile nav
        document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.screen === screenId) btn.classList.add('active');
        });

        // Show/hide mobile nav
        const mobileNav = document.getElementById('mobile-nav');
        if (mobileNav) {
            mobileNav.style.display = ['main-menu-screen', 'login-screen'].includes(screenId) ? 
                (window.innerWidth <= 900 ? 'flex' : 'none') : 
                (window.innerWidth <= 900 ? 'flex' : 'none');
        }
    }

    // ===== MAIN MENU EVENTS =====
    function bindMainMenuEvents() {
        document.querySelectorAll('.menu-card').forEach(card => {
            card.addEventListener('click', () => {
                const mode = card.dataset.mode;
                enterMode(mode);
            });
        });
    }

    function enterMode(mode) {
        state.currentMode = mode;
        state.currentCategory = null;
        state.searchQuery = '';
        state.isSearching = false;
        state.streams = [];
        state.filteredStreams = [];

        // Update nav title
        const titles = { live: 'البث المباشر', movies: 'الأفلام', series: 'المسلسلات' };
        const navTitle = document.getElementById('nav-title');
        if (navTitle) navTitle.textContent = titles[mode] || '';

        // Update sidebar title
        const sidebarTitle = document.getElementById('sidebar-title');
        if (sidebarTitle) sidebarTitle.textContent = 'التصنيفات';

        // Show player screen
        showScreen('player-screen');

        // Reset content
        showContentLoading();

        // Close panels
        closeAllPanels();

        // Update mobile nav
        document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.screen === mode) btn.classList.add('active');
        });

        // Load categories
        loadCategories(mode);
    }

    // ===== NAVIGATION EVENTS =====
    function bindNavEvents() {
        const btnBack = document.getElementById('btn-back');
        if (btnBack) {
            btnBack.addEventListener('click', () => {
                if (state.isSearching) {
                    closeSearch();
                } else if (state.currentCategory) {
                    state.currentCategory = null;
                    loadCategories(state.currentMode);
                    filterByCategory(null);
                } else {
                    showScreen('main-menu-screen');
                }
            });
        }

        const btnBackMain = document.getElementById('btn-back-main');
        if (btnBackMain) {
            btnBackMain.addEventListener('click', () => {
                destroyPlayer();
                showScreen('main-menu-screen');
            });
        }

        const btnSearchToggle = document.getElementById('btn-search-toggle');
        if (btnSearchToggle) {
            btnSearchToggle.addEventListener('click', toggleSearch);
        }

        const btnAccount = document.getElementById('btn-account');
        if (btnAccount) {
            btnAccount.addEventListener('click', openAccountModal);
        }
    }

    // ===== SEARCH =====
    function bindSearchEvents() {
        const searchInput = document.getElementById('search-input');
        const searchClear = document.getElementById('search-clear');

        if (searchInput) {
            searchInput.addEventListener('input', NasrUtils.debounce((e) => {
                const query = e.target.value.trim();
                if (query.length >= 2) {
                    performSearch(query);
                } else if (query.length === 0) {
                    closeSearch();
                }
                // Toggle clear button
                if (searchClear) {
                    searchClear.classList.toggle('hidden', !query);
                }
            }, 400));

            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') closeSearch();
            });
        }

        if (searchClear) {
            searchClear.addEventListener('click', () => {
                if (searchInput) searchInput.value = '';
                if (searchClear) searchClear.classList.add('hidden');
                closeSearch();
            });
        }
    }

    function toggleSearch() {
        const searchBar = document.getElementById('search-bar');
        if (!searchBar) return;

        if (searchBar.classList.contains('hidden')) {
            searchBar.classList.remove('hidden');
            const searchInput = document.getElementById('search-input');
            if (searchInput) searchInput.focus();
        } else {
            closeSearch();
        }
    }

    function closeSearch() {
        const searchBar = document.getElementById('search-bar');
        if (searchBar) searchBar.classList.add('hidden');
        
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.value = '';
        
        const searchClear = document.getElementById('search-clear');
        if (searchClear) searchClear.classList.add('hidden');

        state.isSearching = false;
        state.searchQuery = '';

        // Reload current view
        if (state.currentMode && state.currentCategory) {
            filterByCategory(state.currentCategory);
        } else if (state.streams.length > 0) {
            renderContent(state.streams);
        }
    }

    async function performSearch(query) {
        state.isSearching = true;
        state.searchQuery = query;
        showContentLoading();

        const navTitle = document.getElementById('nav-title');
        if (navTitle) navTitle.textContent = `بحث: ${query}`;

        try {
            const results = await NasrAPI.searchAll(query);
            const all = [
                ...(results.live || []).map(s => ({ ...s, _type: 'live' })),
                ...(results.vod || []).map(s => ({ ...s, _type: 'movies' })),
                ...(results.series || []).map(s => ({ ...s, _type: 'series' }))
            ];
            renderContent(all);
            
            if (all.length === 0) {
                const contentBody = document.getElementById('content-body');
                if (contentBody) {
                    contentBody.innerHTML = `<div class="no-results">
                        <i class="fas fa-search"></i>
                        <p>لا توجد نتائج لـ "${NasrUtils.sanitize(query)}"</p>
                    </div>`;
                }
            }
        } catch (err) {
            NasrUtils.showToast('فشل البحث', 'error');
            clearContentLoading();
        }
    }

    // ===== SIDEBAR / CATEGORIES =====
    function bindSidebarEvents() {
        const sidebarClose = document.getElementById('sidebar-close');
        if (sidebarClose) {
            sidebarClose.addEventListener('click', () => {
                const sidebar = document.getElementById('sidebar');
                if (sidebar) sidebar.classList.remove('open');
            });
        }

        const categorySearch = document.getElementById('category-search');
        if (categorySearch) {
            categorySearch.addEventListener('input', NasrUtils.debounce((e) => {
                filterCategories(e.target.value.trim());
            }, 200));
        }

        // Category click delegation
        const categoryList = document.getElementById('category-list');
        if (categoryList) {
            categoryList.addEventListener('click', (e) => {
                const item = e.target.closest('.category-item');
                if (!item) return;
                
                const catId = item.dataset.categoryId;
                document.querySelectorAll('.category-item').forEach(c => c.classList.remove('active'));
                item.classList.add('active');

                if (catId === 'all') {
                    state.currentCategory = null;
                    filterByCategory(null);
                } else {
                    state.currentCategory = catId;
                    filterByCategory(catId);
                }

                // Close sidebar on mobile
                if (window.innerWidth <= 900) {
                    const sidebar = document.getElementById('sidebar');
                    if (sidebar) sidebar.classList.remove('open');
                }
            });
        }
    }

    async function loadCategories(mode) {
        const categoryList = document.getElementById('category-list');
        if (!categoryList) return;

        // Reset to loading
        categoryList.innerHTML = `
            <li class="category-item active" data-category-id="all">
                <i class="fas fa-globe"></i>
                <span>الكل</span>
            </li>`;

        try {
            let categories = [];
            let streams = [];

            if (mode === 'live') {
                [categories, streams] = await Promise.all([
                    NasrAPI.getLiveCategories(),
                    NasrAPI.getLiveStreams()
                ]);
            } else if (mode === 'movies') {
                [categories, streams] = await Promise.all([
                    NasrAPI.getVodCategories(),
                    NasrAPI.getVodStreams()
                ]);
            } else if (mode === 'series') {
                [categories, streams] = await Promise.all([
                    NasrAPI.getSeriesCategories(),
                    NasrAPI.getSeries()
                ]);
            }

            state.categories = categories;
            state.streams = streams;
            state.filteredStreams = streams;

            // Render categories
            renderCategories(categories, streams);

            // Render content
            renderContent(streams);

            // Render continue watching
            renderContinueWatching();

        } catch (err) {
            NasrUtils.showToast('فشل تحميل البيانات', 'error');
            clearContentLoading();
        }
    }

    function renderCategories(categories, streams) {
        const categoryList = document.getElementById('category-list');
        if (!categoryList) return;

        let html = `
            <li class="category-item active" data-category-id="all">
                <i class="fas fa-globe"></i>
                <span>الكل</span>
                <span class="cat-count">${streams ? streams.length : 0}</span>
            </li>`;

        if (categories && categories.length > 0) {
            categories.forEach(cat => {
                const count = streams ? streams.filter(s => s.category_id == cat.category_id).length : 0;
                html += `
                    <li class="category-item" data-category-id="${cat.category_id}">
                        <i class="fas fa-folder"></i>
                        <span>${NasrUtils.sanitize(cat.category_name)}</span>
                        <span class="cat-count">${count}</span>
                    </li>`;
            });
        }

        categoryList.innerHTML = html;
    }

    function filterCategories(query) {
        const items = document.querySelectorAll('.category-item');
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(query.toLowerCase()) ? '' : 'none';
        });
    }

    function filterByCategory(categoryId) {
        let filtered;
        const contentTitle = document.getElementById('content-title');

        if (categoryId) {
            filtered = state.streams.filter(s => s.category_id == categoryId);
            const cat = state.categories.find(c => c.category_id == categoryId);
            if (contentTitle) contentTitle.textContent = cat ? cat.category_name : '';
        } else {
            filtered = state.streams;
            const titles = { live: 'جميع القنوات', movies: 'جميع الأفلام', series: 'جميع المسلسلات' };
            if (contentTitle) contentTitle.textContent = titles[state.currentMode] || '';
        }

        state.filteredStreams = filtered;
        renderContent(filtered);
    }

    // ===== VIEW TOGGLE =====
    function bindViewToggle() {
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.currentView = btn.dataset.view;
                
                const grid = document.querySelector('.items-grid');
                if (grid) {
                    grid.classList.toggle('list-view', state.currentView === 'list');
                }
            });
        });
    }

    // ===== CONTENT RENDERING =====
    function showContentLoading() {
        const body = document.getElementById('content-body');
        if (body) {
            body.innerHTML = `<div class="loading-spinner" id="content-loading">
                <div class="spinner-large"></div>
                <p>جاري التحميل...</p>
            </div>`;
        }
    }

    function clearContentLoading() {
        const loader = document.getElementById('content-loading');
        if (loader) loader.remove();
    }

    function renderContent(items) {
        const body = document.getElementById('content-body');
        if (!body) return;

        if (!items || items.length === 0) {
            body.innerHTML = `<div class="no-results">
                <i class="fas fa-inbox"></i>
                <p>لا توجد عناصر</p>
            </div>`;
            return;
        }

        const isLive = state.currentMode === 'live' || (items[0] && items[0]._type === 'live');
        const isSeries = state.currentMode === 'series' || (items[0] && items[0]._type === 'series');

        let html = `<div class="items-grid ${state.currentView === 'list' ? 'list-view' : ''}">`;

        items.forEach((item, index) => {
            const id = item.stream_id || item.series_id;
            const name = NasrUtils.improveName(item.name) || 'بدون اسم';
            const cover = NasrUtils.getImageUrl(
                NasrAPI.getUserInfo()?.server_url || '', 
                item.stream_icon || item.cover || ''
            );
            const rating = item.rating || item.rating_5based;
            const type = item._type || state.currentMode;
            const isCurrentlyPlaying = NasrPlayer.getCurrentItem() && 
                (NasrPlayer.getCurrentItem().stream_id === id || NasrPlayer.getCurrentItem().series_id === id || NasrPlayer.getCurrentItem().id === id);

            html += `
                <div class="item-card ${isCurrentlyPlaying ? 'playing' : ''}" 
                     data-id="${id}" 
                     data-type="${type}"
                     data-index="${index}"
                     style="animation-delay: ${Math.min(index * 0.03, 0.5)}s"
                     onclick="NasrApp.handleItemClick(${JSON.stringify({id, type, name: name.replace(/'/g, "\\'")}).replace(/"/g, '&quot;')})">
                    <div class="card-poster">
                        <img src="${NasrUtils.sanitize(cover)}" alt="${NasrUtils.sanitize(name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
                        <div class="no-image" style="display:none"><i class="fas ${isLive ? 'fa-broadcast-tower' : isSeries ? 'fa-tv' : 'fa-film'}"></i></div>
                        ${isLive ? '<div class="card-live-badge">مباشر</div>' : ''}
                        <div class="card-play-overlay"><i class="fas fa-play"></i></div>
                    </div>
                    <div class="card-info">
                        <div class="card-title">${NasrUtils.sanitize(name)}</div>
                        <div class="card-meta">
                            ${rating ? `<span class="card-rating"><i class="fas fa-star"></i> ${parseFloat(rating).toFixed(1)}</span>` : ''}
                            ${item.year ? `<span> ${item.year}</span>` : ''}
                        </div>
                    </div>
                </div>`;
        });

        html += '</div>';
        body.innerHTML = html;
    }

    // ===== ITEM CLICK HANDLER =====
    function handleItemClick(data) {
        const { id, type } = typeof data === 'string' ? JSON.parse(data) : data;
        
        if (type === 'live' || (state.currentMode === 'live' && !type)) {
            playLiveChannel(id);
        } else if (type === 'series' || state.currentMode === 'series') {
            openSeriesInfo(id);
        } else {
            playMovie(id);
        }
    }

    function playLiveChannel(streamId) {
        const channel = state.streams.find(s => s.stream_id == streamId);
        if (!channel) return;
        NasrPlayer.playLive(channel);
    }

    function playMovie(streamId) {
        const movie = state.streams.find(s => s.stream_id == streamId) || 
                     state.filteredStreams.find(s => s.stream_id == streamId);
        if (!movie) return;
        NasrPlayer.playVod(movie);
    }

    async function openSeriesInfo(seriesId) {
        const series = state.streams.find(s => s.series_id == seriesId) || 
                       state.filteredStreams.find(s => s.series_id == seriesId);
        if (!series) return;

        // Show series panel
        const panel = document.getElementById('series-panel');
        const title = document.getElementById('series-panel-title');
        if (panel) panel.classList.remove('hidden');
        if (title) title.textContent = NasrUtils.improveName(series.name) || 'مسلسل';

        // Load series info
        const episodesList = document.getElementById('episodes-list');
        const seasonTabs = document.getElementById('season-tabs');
        if (episodesList) {
            episodesList.innerHTML = `<div class="epg-loading">
                <div class="spinner-small"></div>
                <span>جاري التحميل...</span>
            </div>`;
        }

        try {
            const info = await NasrAPI.getSeriesInfo(seriesId);
            state.seriesInfo = info;
            state.currentSeason = null;

            if (info.episodes) {
                const seasons = Object.keys(info.episodes).sort((a, b) => parseInt(a) - parseInt(b));
                
                // Render season tabs
                if (seasonTabs) {
                    seasonTabs.innerHTML = seasons.map((s, i) => 
                        `<button class="season-tab ${i === 0 ? 'active' : ''}" data-season="${s}">الموسم ${s}</button>`
                    ).join('');

                    // Bind season tab clicks
                    seasonTabs.querySelectorAll('.season-tab').forEach(tab => {
                        tab.addEventListener('click', () => {
                            seasonTabs.querySelectorAll('.season-tab').forEach(t => t.classList.remove('active'));
                            tab.classList.add('active');
                            const season = tab.dataset.season;
                            renderEpisodes(info.episodes[season], season);
                        });
                    });
                }

                // Render first season
                if (seasons.length > 0) {
                    renderEpisodes(info.episodes[seasons[0]], seasons[0]);
                }
            }
        } catch (err) {
            NasrUtils.showToast('فشل تحميل بيانات المسلسل', 'error');
        }
    }

    function renderEpisodes(episodes, seasonNum) {
        const episodesList = document.getElementById('episodes-list');
        if (!episodesList) return;

        state.currentSeason = seasonNum;
        state.currentEpisodeList = episodes || [];
        state.currentEpisodeIndex = -1;

        if (!episodes || episodes.length === 0) {
            episodesList.innerHTML = `<div class="empty-state">
                <i class="fas fa-film"></i>
                <p>لا توجد حلقات في هذا الموسم</p>
            </div>`;
            return;
        }

        let html = '';
        episodes.forEach((ep, index) => {
            const epTitle = ep.title || `الحلقة ${ep.episode_num || (index + 1)}`;
            const isPlaying = NasrPlayer.getCurrentItem() && NasrPlayer.getCurrentItem().id === ep.id;
            
            html += `
                <div class="episode-item ${isPlaying ? 'playing' : ''}" onclick="NasrApp.playEpisodeById(${ep.id})">
                    <div class="ep-number">${ep.episode_num || (index + 1)}</div>
                    <div class="ep-info">
                        <div class="ep-title">${NasrUtils.sanitize(ep.title || `الحلقة ${ep.episode_num || (index + 1)}`)}</div>
                        <div class="ep-duration">${ep.info?.duration || ''}</div>
                    </div>
                    <div class="ep-play-btn"><i class="fas fa-play"></i></div>
                </div>`;
        });

        episodesList.innerHTML = html;

        // Find and play the last watched episode
        const continueList = NasrFavorites.getContinueWatching();
        const lastWatched = continueList.find(c => c.type === 'series');
        if (lastWatched && episodes.find(e => e.id == lastWatched.id)) {
            const idx = episodes.findIndex(e => e.id == lastWatched.id);
            state.currentEpisodeIndex = idx;
        }
    }

    function playEpisodeById(episodeId) {
        const episode = state.currentEpisodeList.find(e => e.id == episodeId);
        if (!episode) return;

        // Update current episode index
        state.currentEpisodeIndex = state.currentEpisodeList.findIndex(e => e.id == episodeId);

        const seriesData = state.streams.find(s => s.series_id == (state.seriesInfo?.series_id)) || {};
        NasrPlayer.playEpisode(episode, { ...seriesData, ...state.seriesInfo });

        // Update episode item playing state
        document.querySelectorAll('.episode-item').forEach(el => el.classList.remove('playing'));
        const epEl = document.querySelector(`.episode-item[onclick*="${episodeId}"]`);
        if (epEl) {
            epEl.classList.add('playing');
            epEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    function playNextEpisode() {
        if (!state.currentEpisodeList || state.currentEpisodeIndex < 0) return;
        
        const nextIndex = state.currentEpisodeIndex + 1;
        if (nextIndex < state.currentEpisodeList.length) {
            const nextEp = state.currentEpisodeList[nextIndex];
            playEpisodeById(nextEp.id);
            NasrUtils.showToast(`جاري تشغيل الحلقة التالية`, 'info');
        } else {
            NasrUtils.showToast('انتهت جميع الحلقات', 'info');
        }
    }

    // Play favorite item
    function playFavorite(type, id) {
        NasrFavorites.closeFavoritesModal();
        
        if (type === 'live') {
            playLiveChannel(id);
        } else if (type === 'movies') {
            playMovie(id);
        }
        // Series need to be opened from the main list
    }

    // ===== SERIES PANEL =====
    function bindSeriesPanel() {
        const seriesClose = document.getElementById('series-close');
        if (seriesClose) {
            seriesClose.addEventListener('click', () => {
                document.getElementById('series-panel')?.classList.add('hidden');
            });
        }
    }

    // ===== ACCOUNT MODAL =====
    function bindAccountModal() {
        const accountClose = document.getElementById('account-modal-close');
        if (accountClose) {
            accountClose.addEventListener('click', closeAccountModal);
        }

        const modal = document.getElementById('account-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeAccountModal();
            });
        }
    }

    function openAccountModal() {
        const modal = document.getElementById('account-modal');
        const body = document.getElementById('account-modal-body');
        if (!modal || !body) return;

        const info = NasrAPI.getUserInfo();
        if (!info) return;

        const now = Math.floor(Date.now() / 1000);
        const isActive = !info.exp_date || info.exp_date > now;
        const expiry = info.exp_date ? new Date(info.exp_date * 1000).toLocaleString('ar-EG') : 'غير محدد';
        const created = info.created_at ? new Date(info.created_at * 1000).toLocaleString('ar-EG') : 'غير محدد';

        body.innerHTML = `
            <div class="account-detail">
                <span class="detail-label">اسم المستخدم</span>
                <span class="detail-value">${NasrUtils.sanitize(info.username || '')}</span>
            </div>
            <div class="account-detail">
                <span class="detail-label">الحالة</span>
                <span class="detail-value ${isActive ? 'active' : 'expired'}">${isActive ? 'نشط' : 'منتهي الصلاحية'}</span>
            </div>
            <div class="account-detail">
                <span class="detail-label">تاريخ الانتهاء</span>
                <span class="detail-value">${expiry}</span>
            </div>
            <div class="account-detail">
                <span class="detail-label">تاريخ التسجيل</span>
                <span class="detail-value">${created}</span>
            </div>
            <div class="account-detail">
                <span class="detail-label">الحد الأقصى للاتصالات</span>
                <span class="detail-value">${info.max_connections || 'غير محدد'}</span>
            </div>
            <div class="account-detail">
                <span class="detail-label">الاتصالات النشطة</span>
                <span class="detail-value">${info.active_cons || 0}</span>
            </div>
            <div class="account-detail">
                <span class="detail-label">حالة الاختبار</span>
                <span class="detail-value">${info.is_trial === '1' ? 'فترة تجريبية' : 'حساب كامل'}</span>
            </div>
        `;

        modal.classList.remove('hidden');
    }

    function closeAccountModal() {
        document.getElementById('account-modal')?.classList.add('hidden');
    }

    // ===== CONTINUE WATCHING =====
    function renderContinueWatching() {
        const section = document.getElementById('continue-watching-section');
        const list = document.getElementById('continue-watching-list');
        if (!section || !list) return;

        const items = NasrFavorites.getContinueWatching();
        if (items.length === 0) {
            section.classList.add('hidden');
            return;
        }

        section.classList.remove('hidden');

        let html = '';
        items.forEach(item => {
            const imgSrc = item.cover || 'img/no_cover.jpg';
            const typeName = item.type === 'live' ? 'قناة' : item.type === 'movies' ? 'فيلم' : 'مسلسل';
            
            html += `
                <div class="continue-card" onclick="NasrApp.resumeFromContinue('${item.type}', ${item.id}, ${item.currentTime || 0})">
                    <div class="cc-poster">
                        <img src="${NasrUtils.sanitize(imgSrc)}" alt="" onerror="this.src='img/no_cover.jpg'" loading="lazy" />
                        <div class="cc-progress">
                            <div class="cc-progress-bar" style="width: ${(item.progress || 0) * 100}%"></div>
                        </div>
                    </div>
                    <div class="cc-info">
                        <div class="cc-title">${NasrUtils.sanitize(item.name)}</div>
                        <div class="cc-type">${typeName}</div>
                    </div>
                </div>`;
        });

        list.innerHTML = html;
    }

    async function resumeFromContinue(type, id, seekTime) {
        if (type === 'live') {
            playLiveChannel(id);
        } else if (type === 'movies') {
            const movie = state.streams.find(s => s.stream_id == id);
            if (movie) {
                NasrPlayer.playVod(movie);
                // Seek after loaded
                const video = document.getElementById('video-player');
                if (video && seekTime > 0) {
                    const onLoaded = () => {
                        video.currentTime = seekTime;
                        video.removeEventListener('loadedmetadata', onLoaded);
                    };
                    video.addEventListener('loadedmetadata', onLoaded);
                }
            }
        }
    }

    // ===== MOBILE NAV =====
    function bindMobileNav() {
        document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                const screen = btn.dataset.screen;

                if (action === 'account') {
                    openAccountModal();
                    return;
                }

                if (screen === 'main-menu-screen') {
                    destroyPlayer();
                    showScreen('main-menu-screen');
                } else if (screen) {
                    enterMode(screen);
                }
            });
        });
    }

    // ===== HELPERS =====
    function closeAllPanels() {
        document.getElementById('epg-panel')?.classList.add('hidden');
        document.getElementById('series-panel')?.classList.add('hidden');
        document.getElementById('favorites-modal')?.classList.add('hidden');
        document.getElementById('account-modal')?.classList.add('hidden');
        document.getElementById('search-bar')?.classList.add('hidden');
        document.getElementById('sidebar')?.classList.remove('open');
    }

    function destroyPlayer() {
        if (typeof NasrPlayer !== 'undefined') {
            NasrPlayer.destroy();
        }
    }

    // ===== INIT ON DOM READY =====
    document.addEventListener('DOMContentLoaded', init);

    return {
        showScreen,
        enterMode,
        handleItemClick,
        playFavorite,
        playEpisodeById,
        playNextEpisode,
        resumeFromContinue,
        destroyPlayer,
        renderContinueWatching,
        openSeriesInfo
    };
})();
