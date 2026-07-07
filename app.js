/* ═══════════════════════════════════════════════════════════════════════
   hammadshow — App JavaScript
   من برمجة وتطوير المهندس محمد حماد
   ═══════════════════════════════════════════════════════════════════════ */

// ── FIREBASE CONFIG ─────────────────────────────────────────────────
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAfImJ7x3pe0GYSrl7hDz_sMb_GarcpJ9E",
  authDomain: "nasr-live.firebaseapp.com",
  databaseURL: "https://nasr-live-default-rtdb.firebaseio.com",
  projectId: "nasr-live",
  storageBucket: "nasr-live.firebasestorage.app",
  messagingSenderId: "215945991656",
  appId: "1:215945991656:web:41ea1faa18496ff86cc05d",
};

// ── TRANSLATIONS ─────────────────────────────────────────────────────
const i18n = {
  ar: {
    appName: "hammadshow",
    developer: "من برمجة وتطوير المهندس محمد حماد",
    home: "الرئيسية",
    categories: "التصنيفات",
    favorites: "المفضلة",
    settings: "الإعدادات",
    search: "بحث...",
    liveTV: "بث مباشر",
    allChannels: "جميع القنوات",
    noChannels: "لا توجد قنوات متاحة",
    noChannelsSub: "سيتم عرض القنوات عند إضافتها من لوحة التحكم",
    noFavorites: "لا توجد عناصر في المفضلة",
    noFavoritesSub: "أضف قنواك المفضلة للوصول السريع",
    welcome: "مرحباً بك في hammadshow",
    welcomeSub: "استمتع بأفضل تجربة بث مباشر",
    featured: "مميز",
    viewAll: "عرض الكل",
    channelCount: "قناة",
    channels: "قنوات",
    language: "اللغة",
    arabic: "العربية",
    english: "English",
    version: "الإصدار",
    availableChannels: "القنوات المتاحة",
    categoriesCount: "التصنيفات",
    appSettings: "إعدادات التطبيق",
    developerInfo: "معلومات المطور",
    followUs: "تابعنا",
    about: "حول التطبيق",
    aboutText: "hammadshow هو تطبيق بث مباشر متكامل يوفر لك تجربة مشاهدة مميزة مع دعم كامل للغة العربية والإنجليزية. يتم التحكم في جميع محتويات التطبيق عبر قاعدة بيانات Firebase Realtime Database.",
    aboutTextEn: "hammadshow is a comprehensive live streaming app that provides a premium viewing experience with full Arabic and English language support. All app content is controlled via Firebase Realtime Database.",
    allRightsReserved: "جميع الحقوق محفوظة",
    installApp: "تثبيت التطبيق",
    installSub: "أضف hammadshow إلى شاشتك الرئيسية",
    installBtn: "تثبيت",
    developerName: "المهندس محمد حماد",
    developerRole: "مبرمج ومطور تطبيقات",
    back: "رجوع",
    close: "إغلاق",
    nowPlaying: "يعمل الآن",
  },
  en: {
    appName: "hammadshow",
    developer: "Developed by Engineer Mohamed Hammad",
    home: "Home",
    categories: "Categories",
    favorites: "Favorites",
    settings: "Settings",
    search: "Search...",
    liveTV: "Live TV",
    allChannels: "All Channels",
    noChannels: "No channels available",
    noChannelsSub: "Channels will appear once added from the control panel",
    noFavorites: "No favorites yet",
    noFavoritesSub: "Add your favorite channels for quick access",
    welcome: "Welcome to hammadshow",
    welcomeSub: "Enjoy the best live streaming experience",
    featured: "Featured",
    viewAll: "View All",
    channelCount: "Channels",
    channels: "Channels",
    language: "Language",
    arabic: "العربية",
    english: "English",
    version: "Version",
    availableChannels: "Available Channels",
    categoriesCount: "Categories",
    appSettings: "App Settings",
    developerInfo: "Developer Info",
    followUs: "Follow Us",
    about: "About",
    aboutText: "hammadshow هو تطبيق بث مباشر متكامل يوفر لك تجربة مشاهدة مميزة مع دعم كامل للغة العربية والإنجليزية. يتم التحكم في جميع محتويات التطبيق عبر قاعدة بيانات Firebase Realtime Database.",
    aboutTextEn: "hammadshow is a comprehensive live streaming app that provides a premium viewing experience with full Arabic and English language support. All app content is controlled via Firebase Realtime Database.",
    allRightsReserved: "All rights reserved",
    installApp: "Install App",
    installSub: "Add hammadshow to your home screen",
    installBtn: "Install",
    developerName: "Engineer Mohamed Hammad",
    developerRole: "App Developer",
    back: "Back",
    close: "Close",
    nowPlaying: "Now Playing",
  },
};

// ── SVG ICONS ───────────────────────────────────────────────────────
const ICONS = {
  home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  grid: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>`,
  heart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
  heartFilled: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
  play: `<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
  x: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
  arrowLeft: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>`,
  arrowRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19 7-7-7-7"/><path d="M5 12h14"/></svg>`,
  globe: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`,
  tv: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="15" x="2" y="7" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>`,
  heartEmpty: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
  info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
  star: `<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  facebook: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
  download: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
};

// ── APP STATE ───────────────────────────────────────────────────────
const state = {
  locale: "ar",
  activeTab: "home",
  selectedCategory: null,
  searchQuery: "",
  settings: {},
  categories: [],
  allChannels: [],
  banners: [],
  favorites: new Set(),
  currentChannel: null,
  playerOpen: false,
  loading: true,
  unsubs: [],
  deferredPrompt: null,
};

// ── HELPERS ─────────────────────────────────────────────────────────
function t(key) { return i18n[state.locale][key] || key; }
function isRTL() { return state.locale === "ar"; }

function getChannelName(ch) {
  return isRTL() && ch.nameAr ? ch.nameAr : ch.name;
}
function getCategoryName(cat) {
  return isRTL() ? (cat.nameAr || cat.name) : (cat.nameEn || cat.name);
}
function getChannelDesc(ch) {
  return isRTL() && ch.descriptionAr ? ch.descriptionAr : (ch.description || "");
}

function saveFavorites() {
  localStorage.setItem("hs-favs", JSON.stringify([...state.favorites]));
}
function loadFavorites() {
  try {
    const s = localStorage.getItem("hs-favs");
    if (s) state.favorites = new Set(JSON.parse(s));
  } catch(e) {}
}
function saveLocale() {
  localStorage.setItem("hs-locale", state.locale);
}
function loadLocale() {
  const s = localStorage.getItem("hs-locale");
  if (s === "en" || s === "ar") state.locale = s;
}

function toggleFav(id) {
  if (state.favorites.has(id)) state.favorites.delete(id);
  else state.favorites.add(id);
  saveFavorites();
  renderAll();
}

// ── FIREBASE ────────────────────────────────────────────────────────
let db = null;
let firebaseLoaded = false;

async function loadFirebase() {
  if (firebaseLoaded) return true;
  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js");
    const { getDatabase, ref, onValue, off } = await import("https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js");
    const app = initializeApp(FIREBASE_CONFIG);
    db = getDatabase(app);
    firebaseLoaded = true;
    return true;
  } catch(e) {
    console.warn("Firebase load error:", e);
    return false;
  }
}

function subscribeSettings(cb) {
  if (!db) return;
  const { ref, onValue } = firebase.database;
  const r = ref(db, "settings");
  const unsub = onValue(r, snap => cb(snap.val() || {}));
  state.unsubs.push(() => off(r));
}
function subscribeCategories(cb) {
  if (!db) return;
  const { ref, onValue, off } = firebase.database;
  const r = ref(db, "categories");
  const unsub = onValue(r, snap => {
    const d = snap.val();
    if (!d) { cb([]); return; }
    const list = Object.entries(d).map(([k,v]) => ({
      id: k, name: v.name||"", nameAr: v.nameAr||v.name||"", nameEn: v.nameEn||v.name||"",
      icon: v.icon||"", order: v.order??0, visible: v.visible!==false
    }));
    list.sort((a,b) => a.order - b.order);
    cb(list);
  });
  state.unsubs.push(() => off(r));
}
function subscribeChannels(cb) {
  if (!db) return;
  const { ref, onValue, off } = firebase.database;
  const r = ref(db, "channels");
  const unsub = onValue(r, snap => {
    const d = snap.val();
    if (!d) { cb([]); return; }
    const channels = [];
    Object.entries(d).forEach(([catId, catData]) => {
      if (catData && typeof catData === "object") {
        Object.entries(catData).forEach(([k,v]) => {
          channels.push({
            id: k, name: v.name||"", nameAr: v.nameAr||v.name||"",
            url: v.url||v.streamUrl||"", logo: v.logo||v.icon||"",
            category: catId, type: v.type||"live",
            description: v.description||"", descriptionAr: v.descriptionAr||""
          });
        });
      }
    });
    cb(channels);
  });
  state.unsubs.push(() => off(r));
}
function subscribeBanners(cb) {
  if (!db) return;
  const { ref, onValue, off } = firebase.database;
  const r = ref(db, "banners");
  const unsub = onValue(r, snap => {
    const d = snap.val();
    if (!d) { cb([]); return; }
    const list = Object.entries(d).map(([k,v]) => ({
      id: k, title: v.title||"", titleAr: v.titleAr||v.title||"", titleEn: v.titleEn||v.title||"",
      imageUrl: v.imageUrl||v.image||"", order: v.order??0, active: v.active!==false
    }));
    list.sort((a,b) => a.order - b.order);
    cb(list.filter(b => b.active));
  });
  state.unsubs.push(() => off(r));
}

// ── RENDERING ───────────────────────────────────────────────────────

function renderHeader() {
  const el = document.getElementById("header-info");
  if (!el) return;
  el.innerHTML = `
    <h1>${state.settings.appName || t("appName")}</h1>
    <p>${t("developer")}</p>
  `;
}

function renderNavLabels() {
  document.querySelectorAll(".nav-label").forEach(el => {
    const tab = el.dataset.tab;
    if (tab) el.textContent = t(tab);
  });
  // Fav badge
  const badge = document.getElementById("fav-badge");
  if (badge) {
    const count = state.allChannels.filter(c => state.favorites.has(c.id)).length;
    badge.textContent = count > 99 ? "99+" : count;
    badge.style.display = count > 0 ? "flex" : "none";
  }
}

function renderSearch() {
  const el = document.getElementById("search-input");
  if (el) {
    el.placeholder = t("search");
    el.value = state.searchQuery;
  }
}

function renderWelcome() {
  const el = document.getElementById("welcome-section");
  if (!el) return;
  const msg = state.settings[`welcomeMessage${isRTL() ? "Ar" : "En"}`] || t("welcome");
  el.innerHTML = `
    <div class="welcome">
      <h2>${msg}</h2>
      <p>${t("welcomeSub")}</p>
    </div>
  `;
}

function renderBanners() {
  const el = document.getElementById("banners-section");
  if (!el) return;
  if (state.banners.length === 0) { el.classList.add("hidden"); return; }
  el.classList.remove("hidden");
  el.innerHTML = `
    <div class="banners-track no-scroll">
      ${state.banners.map(b => `
        <div class="banner-card">
          ${b.imageUrl ? `<img src="${b.imageUrl}" alt="" loading="lazy">` : ''}
          <div class="banner-overlay">
            <div class="banner-badge">${t("featured")}</div>
            <div class="banner-title">${isRTL() ? b.titleAr : (b.titleEn || b.title)}</div>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderCategoryPills() {
  const el = document.getElementById("cat-pills");
  if (!el) return;
  const cats = state.categories.filter(c => c.visible);
  if (cats.length === 0) { el.classList.add("hidden"); return; }
  el.classList.remove("hidden");
  el.innerHTML = `
    <div class="cat-pills no-scroll">
      ${cats.map(c => `
        <button class="cat-pill" onclick="App.openCategory('${c.id}')">${getCategoryName(c)}</button>
      `).join("")}
    </div>
  `;
}

function channelCardHTML(ch, horizontal = false) {
  const name = getChannelName(ch);
  const isFav = state.favorites.has(ch.id);
  const favIcon = isFav ? ICONS.heartFilled : ICONS.heart;
  const favClass = isFav ? "active" : "";

  if (horizontal) {
    return `
      <div class="ch-card-h">
        <div class="ch-thumb" onclick="App.play('${ch.id}')">
          ${ch.logo ? `<img src="${ch.logo}" alt="${name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="ch-thumb-icon" style="display:none">${ICONS.tv}</div>` : `<div class="ch-thumb-icon">${ICONS.tv}</div>`}
          <div class="ch-play-overlay" onclick="App.play('${ch.id}')">
            <div class="ch-play-btn">${ICONS.play}</div>
          </div>
        </div>
        <div class="ch-info">
          <div class="ch-name">${name}</div>
          <div class="ch-meta">
            <span class="ch-live-badge"><span class="ch-live-dot"></span>LIVE</span>
            <button class="ch-fav-btn ${favClass}" onclick="event.stopPropagation();App.toggleFav('${ch.id}')">
              ${favIcon}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="ch-card">
      <div class="ch-thumb" onclick="App.play('${ch.id}')">
        ${ch.logo ? `<img src="${ch.logo}" alt="${name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="ch-thumb-icon" style="display:none">${ICONS.tv}</div>` : `<div class="ch-thumb-icon">${ICONS.tv}</div>`}
        <div class="ch-live-badge"><span class="ch-live-dot"></span>LIVE</div>
        <div class="ch-play-overlay" onclick="App.play('${ch.id}')">
          <div class="ch-play-btn">${ICONS.play}</div>
        </div>
      </div>
      <div class="ch-info">
        <div class="ch-name">${name}</div>
        <button class="ch-fav-btn ${favClass}" onclick="App.toggleFav('${ch.id}')">
          ${favIcon}
        </button>
      </div>
    </div>
  `;
}

function renderHomeChannels() {
  const el = document.getElementById("home-channels");
  if (!el) return;
  let channels = state.allChannels;
  if (state.searchQuery.trim()) {
    const q = state.searchQuery.toLowerCase();
    channels = channels.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.nameAr && c.nameAr.includes(q)) ||
      (c.category && c.category.toLowerCase().includes(q))
    );
  } else {
    channels = channels.slice(0, 24);
  }

  if (state.loading) {
    el.innerHTML = `<div class="skeleton-grid">${Array(6).fill('<div class="skel-card"><div class="skel-thumb"></div><div class="skel-text"></div></div>').join("")}</div>`;
    return;
  }

  if (channels.length === 0) {
    el.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${ICONS.tv}</div>
        <div class="empty-title">${t("noChannels")}</div>
        <div class="empty-sub">${t("noChannelsSub")}</div>
      </div>
    `;
    return;
  }

  el.innerHTML = `<div class="channel-grid">${channels.map(c => channelCardHTML(c)).join("")}</div>`;
}

function renderCategorySections() {
  const el = document.getElementById("cat-sections");
  if (!el) return;
  const cats = state.categories.filter(c => c.visible).slice(0, 8);
  let html = "";
  cats.forEach(cat => {
    const channels = state.allChannels.filter(c => c.category === cat.id);
    if (channels.length === 0) return;
    const arrow = isRTL() ? ICONS.arrowLeft : ICONS.arrowRight;
    html += `
      <div style="margin-bottom:24px">
        <div class="section-header">
          <div class="section-bar" style="background:linear-gradient(to bottom,#3D8EFF,#00B4D8)"></div>
          <h3>${getCategoryName(cat)}</h3>
          <span style="font-size:11px;color:var(--muted);margin-inline-start:4px">(${channels.length})</span>
          <div class="section-actions">
            <button class="btn-view-all" onclick="App.openCategory('${cat.id}')">
              ${t("viewAll")} ${arrow}
            </button>
          </div>
        </div>
        <div class="ch-scroll no-scroll">
          ${channels.slice(0, 12).map(c => channelCardHTML(c, true)).join("")}
        </div>
      </div>
    `;
  });
  el.innerHTML = html;
}

function renderCategoriesTab() {
  const el = document.getElementById("tab-categories");
  if (!el) return;

  if (state.selectedCategory) {
    const cat = state.categories.find(c => c.id === state.selectedCategory);
    const catName = cat ? getCategoryName(cat) : "";
    const arrow = isRTL() ? ICONS.arrowRight : ICONS.arrowLeft;
    let channels = state.allChannels.filter(c => c.category === state.selectedCategory);
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase();
      channels = channels.filter(c => c.name.toLowerCase().includes(q) || (c.nameAr && c.nameAr.includes(q)));
    }
    el.innerHTML = `
      <div style="padding:16px;max-width:1200px;margin:0 auto">
        <button class="back-btn" onclick="App.closeCategory()">${arrow} ${t("categories")}</button>
        <h2 style="font-size:18px;font-weight:700;margin-bottom:16px">${catName}</h2>
        <div class="search-wrap">
          <div class="search-wrap-inner" style="position:relative">
            ${ICONS.search}
            <input id="search-input-cat" class="search-input" type="text" placeholder="${t("search")}" value="${state.searchQuery}" oninput="App.onSearch(this.value)">
          </div>
        </div>
        ${channels.length > 0 ? `<div class="channel-grid">${channels.map(c => channelCardHTML(c)).join("")}</div>` : `
          <div class="empty-state">
            <div class="empty-icon">${ICONS.tv}</div>
            <div class="empty-title">${t("noChannels")}</div>
          </div>
        `}
      </div>
    `;
    // Style search icon in RTL for cat search
    const searchInner = el.querySelector(".search-wrap-inner");
    if (searchInner) {
      const svg = searchInner.querySelector("svg");
      if (svg) {
        if (isRTL()) { svg.style.cssText = "position:absolute;top:50%;transform:translateY(-50%);width:16px;height:16px;color:var(--muted);right:12px;pointer-events:none"; }
        else { svg.style.cssText = "position:absolute;top:50%;transform:translateY(-50%);width:16px;height:16px;color:var(--muted);left:12px;pointer-events:none"; }
      }
    }
    return;
  }

  let cats = state.categories.filter(c => c.visible);
  if (state.searchQuery.trim()) {
    const q = state.searchQuery.toLowerCase();
    cats = cats.filter(c => getCategoryName(c).toLowerCase().includes(q));
  }
  const arrow = isRTL() ? ICONS.arrowLeft : ICONS.arrowRight;

  el.innerHTML = `
    <div style="padding:16px;max-width:1200px;margin:0 auto">
      <h2 style="font-size:18px;font-weight:700;margin-bottom:16px">${t("categories")}</h2>
      <div class="search-wrap">
        <div class="search-wrap-inner" style="position:relative">
          ${ICONS.search}
          <input class="search-input" type="text" placeholder="${t("search")}" value="${state.searchQuery}" oninput="App.onSearch(this.value)">
        </div>
      </div>
      ${state.loading ? Array(8).fill('<div class="skel-cat"></div>').join("") : cats.length > 0 ? `
        <div class="cat-grid">
          ${cats.map(c => {
            const count = state.allChannels.filter(ch => ch.category === c.id).length;
            return `
              <button class="cat-card" onclick="App.openCategory('${c.id}')">
                <div class="cat-icon">${c.icon || "📡"}</div>
                <div class="cat-details">
                  <div class="cat-name">${getCategoryName(c)}</div>
                  <div class="cat-count">${count} ${t("channelCount")}</div>
                </div>
                <div class="cat-arrow">${arrow}</div>
              </button>
            `;
          }).join("")}
        </div>
      ` : `
        <div class="empty-state">
          <div class="empty-icon">${ICONS.grid}</div>
          <div class="empty-title">${t("noChannels")}</div>
        </div>
      `}
    </div>
  `;
  // Fix search icon position
  const searchInner = el.querySelector(".search-wrap-inner");
  if (searchInner) {
    const svg = searchInner.querySelector("svg");
    if (svg) {
      if (isRTL()) { svg.style.cssText = "position:absolute;top:50%;transform:translateY(-50%);width:16px;height:16px;color:var(--muted);right:12px;pointer-events:none"; }
      else { svg.style.cssText = "position:absolute;top:50%;transform:translateY(-50%);width:16px;height:16px;color:var(--muted);left:12px;pointer-events:none"; }
    }
  }
}

function renderFavoritesTab() {
  const el = document.getElementById("tab-favorites");
  if (!el) return;
  const favChannels = state.allChannels.filter(c => state.favorites.has(c.id));
  el.innerHTML = `
    <div style="padding:16px;max-width:1200px;margin:0 auto">
      <div class="fav-header">
        ${ICONS.heart}
        <h2>${t("favorites")}</h2>
        <span class="fav-count">${favChannels.length}</span>
      </div>
      ${favChannels.length > 0 ? `
        <div class="channel-grid">${favChannels.map(c => channelCardHTML(c)).join("")}</div>
      ` : `
        <div class="empty-state">
          <div class="empty-icon">${ICONS.heartEmpty}</div>
          <div class="empty-title">${t("noFavorites")}</div>
          <div class="empty-sub">${t("noFavoritesSub")}</div>
        </div>
      `}
    </div>
  `;
}

function renderSettingsTab() {
  const el = document.getElementById("tab-settings");
  if (!el) return;
  const infoIcon = `<span style="color:#3D8EFF">${ICONS.info}</span>`;
  const starIcon = `<span style="color:#F59E0B">${ICONS.star}</span>`;
  const greenInfo = `<span style="color:#22C55E">${ICONS.info}</span>`;

  el.innerHTML = `
    <div style="padding:16px;max-width:600px;margin:0 auto">
      <h2 style="font-size:18px;font-weight:700;margin-bottom:18px">${t("settings")}</h2>

      <!-- Language -->
      <div class="settings-section">
        <div class="settings-title">
          <span style="color:#3D8EFF">${ICONS.globe}</span> ${t("language")}
        </div>
        <div class="lang-switcher">
          <button class="lang-opt ${state.locale === "ar" ? "active" : ""}" onclick="App.setLang('ar')">${t("arabic")}</button>
          <button class="lang-opt ${state.locale === "en" ? "active" : ""}" onclick="App.setLang('en')">${t("english")}</button>
        </div>
      </div>

      <!-- App Settings -->
      <div class="settings-section">
        <div class="settings-title">${infoIcon} ${t("appSettings")}</div>
        <div class="settings-row">
          <span class="settings-label">${t("appName")}</span>
          <span class="settings-value">${state.settings.appName || "hammadshow"}</span>
        </div>
        <div class="settings-row">
          <span class="settings-label">${t("version")}</span>
          <span class="settings-value">1.0.0</span>
        </div>
        <div class="settings-row">
          <span class="settings-label">${t("availableChannels")}</span>
          <span class="settings-value">${state.allChannels.length}</span>
        </div>
        <div class="settings-row">
          <span class="settings-label">${t("categoriesCount")}</span>
          <span class="settings-value">${state.categories.length}</span>
        </div>
      </div>

      <!-- Developer -->
      <div class="settings-section">
        <div class="settings-title">${starIcon} ${t("developerInfo")}</div>
        <div class="dev-card">
          <div class="dev-avatar">م</div>
          <div>
            <div class="dev-name">${t("developerName")}</div>
            <div class="dev-role">${t("developerRole")}</div>
            <a href="https://www.facebook.com/en.mohamed.nasr" target="_blank" rel="noopener noreferrer" class="dev-link">
              ${ICONS.facebook} ${t("followUs")}
            </a>
          </div>
        </div>
      </div>

      <!-- About -->
      <div class="settings-section">
        <div class="settings-title">${greenInfo} ${t("about")}</div>
        <p class="about-text">${isRTL() ? t("aboutText") : t("aboutTextEn")}</p>
      </div>

      <!-- Footer -->
      <div class="app-footer">
        <p>${t("developer")}</p>
        <p style="margin-top:4px">© 2024 hammadshow — ${t("allRightsReserved")}</p>
      </div>
    </div>
  `;
}

function renderPlayer() {
  const overlay = document.getElementById("player-overlay");
  if (!overlay) return;
  if (!state.playerOpen || !state.currentChannel) {
    overlay.classList.remove("show");
    return;
  }
  const ch = state.currentChannel;
  const name = getChannelName(ch);
  const desc = getChannelDesc(ch);
  const isFav = state.favorites.has(ch.id);

  document.getElementById("player-video").src = ch.url;
  document.getElementById("player-ch-name").textContent = name;
  document.getElementById("player-ch-desc").textContent = desc;
  const logoEl = document.getElementById("player-logo");
  if (ch.logo) {
    logoEl.innerHTML = `<img src="${ch.logo}" alt="" onerror="this.parentElement.innerHTML='${ICONS.tv}'">`;
    logoEl.style.display = "flex";
  } else {
    logoEl.innerHTML = ICONS.tv;
    logoEl.style.display = "flex";
  }
  const favBtn = document.getElementById("player-fav");
  favBtn.innerHTML = isFav ? ICONS.heartFilled : ICONS.heart;
  favBtn.className = `player-fav-btn ${isFav ? "active" : ""}`;
  favBtn.onclick = () => { toggleFav(ch.id); renderPlayer(); };
  overlay.classList.add("show");
  try { document.getElementById("player-video").play().catch(()=>{}); } catch(e) {}
}

function renderInstallBanner() {
  const el = document.getElementById("install-banner");
  if (!el) return;
  if (!state.deferredPrompt) { el.classList.add("hidden"); return; }
  el.classList.remove("hidden");
  el.innerHTML = `
    <div class="install-banner">
      <div class="install-icon">${ICONS.download}</div>
      <div class="install-text">
        <h4>${t("installApp")}</h4>
        <p>${t("installSub")}</p>
      </div>
      <button class="install-btn" onclick="App.install()">${t("installBtn")}</button>
    </div>
  `;
}

function renderAll() {
  renderHeader();
  renderNavLabels();
  renderSearch();
  renderWelcome();
  renderBanners();
  renderCategoryPills();
  renderHomeChannels();
  renderCategorySections();
  renderCategoriesTab();
  renderFavoritesTab();
  renderSettingsTab();
  renderPlayer();
  renderInstallBanner();
}

// ── TAB SWITCHING ───────────────────────────────────────────────────
function switchTab(tab) {
  state.activeTab = tab;
  state.selectedCategory = null;
  state.searchQuery = "";
  document.querySelectorAll(".tab").forEach(el => el.classList.remove("active"));
  const tabEl = document.getElementById("tab-" + tab);
  if (tabEl) tabEl.classList.add("active");
  document.querySelectorAll(".nav-item").forEach(el => {
    el.classList.toggle("active", el.dataset.tab === tab);
  });
  if (tab === "favorites") renderFavoritesTab();
  if (tab === "categories") renderCategoriesTab();
  if (tab === "settings") renderSettingsTab();
  if (tab === "home") {
    renderHomeChannels();
    renderCategorySections();
  }
}

// ── APP API (global) ────────────────────────────────────────────────
window.App = {
  switchTab,
  openCategory(id) {
    state.selectedCategory = id;
    state.searchQuery = "";
    switchTab("categories");
  },
  closeCategory() {
    state.selectedCategory = null;
    state.searchQuery = "";
    renderCategoriesTab();
  },
  play(id) {
    const ch = state.allChannels.find(c => c.id === id);
    if (ch) { state.currentChannel = ch; state.playerOpen = true; renderPlayer(); }
  },
  closePlayer() {
    const v = document.getElementById("player-video");
    if (v) { v.pause(); v.src = ""; }
    state.playerOpen = false;
    state.currentChannel = null;
    renderPlayer();
  },
  toggleFav(id) { toggleFav(id); },
  setLang(lang) {
    state.locale = lang;
    saveLocale();
    document.documentElement.dir = isRTL() ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    renderAll();
  },
  onSearch(q) {
    state.searchQuery = q;
    if (state.activeTab === "home") { renderHomeChannels(); }
    else if (state.activeTab === "categories") { renderCategoriesTab(); }
  },
  install() {
    if (state.deferredPrompt) {
      state.deferredPrompt.prompt();
      state.deferredPrompt.userChoice.then(() => {
        state.deferredPrompt = null;
        renderInstallBanner();
      });
    }
  },
};

// ── SEARCH EVENT (home tab) ─────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      state.searchQuery = e.target.value;
      renderHomeChannels();
    });
  }
});

// ── PWA INSTALL PROMPT ──────────────────────────────────────────────
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  state.deferredPrompt = e;
  renderInstallBanner();
});

// ── INIT ────────────────────────────────────────────────────────────
async function init() {
  loadLocale();
  loadFavorites();
  document.documentElement.dir = isRTL() ? "rtl" : "ltr";
  document.documentElement.lang = state.locale;

  // Initial render
  renderAll();

  // Connect to Firebase
  const ok = await loadFirebase();
  if (ok) {
    subscribeSettings(s => { state.settings = s; state.loading = false; renderAll(); });
    subscribeCategories(c => { state.categories = c; renderCategoryPills(); renderCategorySections(); renderCategoriesTab(); });
    subscribeChannels(c => { state.allChannels = c; renderHomeChannels(); renderCategorySections(); renderCategoriesTab(); renderFavoritesTab(); renderSettingsTab(); renderNavLabels(); });
    subscribeBanners(b => { state.banners = b; renderBanners(); });
  } else {
    state.loading = false;
    renderAll();
  }

  // Register Service Worker
  if ("serviceWorker" in navigator) {
    try { await navigator.serviceWorker.register("./sw.js"); } catch(e) {}
  }
}

init();