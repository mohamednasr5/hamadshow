/*========================================
  NASR LIVE - EPG (Electronic Program Guide) Module
  ========================================*/

const NasrEPG = (() => {
    'use strict';

    let currentDate = new Date();
    let currentChannelId = null;
    let currentEpgId = null;
    let epgCache = {};

    function init() {
        bindEvents();
    }

    function bindEvents() {
        const epgToggle = document.getElementById('btn-epg-toggle');
        if (epgToggle) {
            epgToggle.addEventListener('click', toggleEpgPanel);
        }

        const epgClose = document.getElementById('epg-close');
        if (epgClose) {
            epgClose.addEventListener('click', closePanel);
        }

        const prevDay = document.getElementById('epg-prev-day');
        const nextDay = document.getElementById('epg-next-day');
        if (prevDay) prevDay.addEventListener('click', () => changeDate(-1));
        if (nextDay) nextDay.addEventListener('click', () => changeDate(1));
    }

    function toggleEpgPanel() {
        const panel = document.getElementById('epg-panel');
        if (!panel) return;
        
        if (panel.classList.contains('hidden')) {
            panel.classList.remove('hidden');
            if (currentEpgId) {
                loadEpg();
            }
        } else {
            panel.classList.add('hidden');
        }
    }

    function closePanel() {
        const panel = document.getElementById('epg-panel');
        if (panel) panel.classList.add('hidden');
    }

    function setChannel(channel) {
        currentChannelId = channel.stream_id;
        currentEpgId = channel.epg_channel_id;
        currentDate = new Date();
        loadEpg();
    }

    function changeDate(delta) {
        currentDate.setDate(currentDate.getDate() + delta);
        updateDateLabel();
        loadEpg();
    }

    function updateDateLabel() {
        const label = document.getElementById('epg-date-label');
        if (!label) return;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(currentDate);
        target.setHours(0, 0, 0, 0);
        
        const diff = (target - today) / (1000 * 60 * 60 * 24);
        
        if (diff === 0) {
            label.textContent = 'اليوم';
        } else if (diff === 1) {
            label.textContent = 'غداً';
        } else if (diff === -1) {
            label.textContent = 'أمس';
        } else {
            label.textContent = NasrUtils.formatDate(currentDate.getTime() / 1000, 'ar');
        }
    }

    async function loadEpg() {
        if (!currentEpgId) return;

        updateDateLabel();
        
        const list = document.getElementById('epg-list');
        if (!list) return;
        
        list.innerHTML = `<div class="epg-loading">
            <div class="spinner-small"></div>
            <span>جاري تحميل البرامج...</span>
        </div>`;

        const dayStart = new Date(currentDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(23, 59, 59, 999);

        const start = Math.floor(dayStart.getTime() / 1000);
        const stop = Math.floor(dayEnd.getTime() / 1000);

        // Check cache
        const cacheKey = `${currentEpgId}_${start}_${stop}`;
        if (epgCache[cacheKey]) {
            renderEpg(epgCache[cacheKey]);
            return;
        }

        try {
            const epgList = await NasrAPI.getEpg(currentEpgId, start, stop);
            epgCache[cacheKey] = epgList;
            renderEpg(epgList);
        } catch (err) {
            list.innerHTML = `<div class="empty-state">
                <i class="fas fa-satellite-dish"></i>
                <p>لا توجد بيانات EPG متاحة</p>
            </div>`;
        }
    }

    function renderEpg(listings) {
        const list = document.getElementById('epg-list');
        if (!list) return;

        if (!listings || listings.length === 0) {
            list.innerHTML = `<div class="empty-state">
                <i class="fas fa-satellite-dish"></i>
                <p>لا توجد برامج لهذا اليوم</p>
            </div>`;
            return;
        }

        const now = Math.floor(Date.now() / 1000);
        let html = '';

        listings.forEach(item => {
            const isCurrent = now >= item.start_timestamp && now < item.stop_timestamp;
            const progress = isCurrent ? ((now - item.start_timestamp) / (item.stop_timestamp - item.start_timestamp)) * 100 : 0;

            html += `
                <div class="epg-item ${isCurrent ? 'current' : ''}">
                    <span class="epg-time">${NasrUtils.formatEpgTime(item.start_timestamp)}</span>
                    <div class="epg-title">${NasrUtils.sanitize(item.title)}</div>
                    ${item.description ? `<div class="epg-desc">${NasrUtils.sanitize(item.description)}</div>` : ''}
                    ${isCurrent ? `
                        <div class="epg-progress">
                            <div class="epg-progress-bar" style="width: ${progress}%"></div>
                        </div>
                    ` : ''}
                </div>`;
        });

        list.innerHTML = html;

        // Auto-scroll to current program
        const currentEl = list.querySelector('.epg-item.current');
        if (currentEl) {
            currentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // Update progress bars every minute
        if (listings.some(i => now >= i.start_timestamp && now < i.stop_timestamp)) {
            setTimeout(() => {
                renderEpg(listings);
            }, 60000);
        }
    }

    return { init, setChannel, toggleEpgPanel, closePanel };
})();