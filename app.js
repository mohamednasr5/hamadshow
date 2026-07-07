/* ═══════════════════════════════════════════════════════════════════════
   hammadshow — App JavaScript (with Xtream Codes Support)
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
    aboutText: "hammadshow هو تطبيق بث مباشر متكامل يدعم ربط سيرفرات Xtream Codes مع دعم كامل للغة العربية والإنجليزية.",
    aboutTextEn: "hammadshow is a comprehensive streaming app that supports Xtream Codes servers with full Arabic and English language support.",
    allRightsReserved: "جميع الحقوق محفوظة",
    installApp: "تثبيت التطبيق",
    installSub: "أضف hammadshow إلى شاشتك الرئيسية",
    installBtn: "تثبيت",
    developerName: "المهندس محمد حماد",
    developerRole: "مبرمج ومطور تطبيقات",
    back: "رجوع",
    close: "إغلاق",
    nowPlaying: "يعمل الآن",
    // Xtream Codes translations
    xtreamCodes: "Xtream Codes",
    xtreamLogin: "تسجيل دخول Xtream Codes",
    xtreamUrl: "رابط السيرفر",
    xtreamUrlPlaceholder: "http://example.com:8080",
    xtreamUser: "اسم المستخدم",
    xtreamUserPlaceholder: "username",
    xtreamPass: "كلمة المرور",
    xtreamPassPlaceholder: "password",
    xtreamConnect: "اتصال",
    xtreamDisconnect: "قطع الاتصال",
    xtreamConnecting: "جاري الاتصال...",
    xtreamConnected: "متصل بالسيرفر",
    xtreamDisconnected: "غير متصل",
    xtreamError: "فشل الاتصال — تحقق من البيانات",
    xtreamServerInfo: "معلومات السيرفر",
    xtreamStatus: "الحالة",
    xtreamActive: "نشط",
    xtreamExpired: "منتهي الصلاحية",
    xtreamExpiry: "تاريخ الانتهاء",
    xtreamMaxConn: "الحد الأقصى للاتصالات",
    xtreamActiveConn: "الاتصالات النشطة",
    dataSource: "مصدر البيانات",
    dataSourceFirebase: "Firebase",
    dataSourceXtream: "Xtream Codes",
    live: "مباشر",
    movies: "أفلام",
    series: "مسلسلات",
    noXtream: "لم يتم الاتصال بسيرفر Xtream",
    noXtreamSub: "اذهب إلى الإعدادات لتسجيل الدخول",
    xtreamLoading: "جاري تحميل المحتوى...",
    episode: "الحلقة",
    season: "الموسم",
    episodes: "الحلقات",
    seasons: "المواسم",
    play: "تشغيل",
    year: "السنة",
    rating: "التقييم",
    genre: "النوع",
    added: "أُضيف",
    noEpisodes: "لا توجد حلقات متاحة",
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
    welcomeSub: "Enjoy the best streaming experience",
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
    aboutText: "hammadshow هو تطبيق بث مباشر متكامل يدعم ربط سيرفرات Xtream Codes مع دعم كامل للغة العربية والإنجليزية.",
    aboutTextEn: "hammadshow is a comprehensive streaming app that supports Xtream Codes servers with full Arabic and English language support.",
    allRightsReserved: "All rights reserved",
    installApp: "Install App",
    installSub: "Add hammadshow to your home screen",
    installBtn: "Install",
    developerName: "Engineer Mohamed Hammad",
    developerRole: "App Developer",
    back: "Back",
    close: "Close",
    nowPlaying: "Now Playing",
    // Xtream Codes translations
    xtreamCodes: "Xtream Codes",
    xtreamLogin: "Xtream Codes Login",
    xtreamUrl: "Server URL",
    xtreamUrlPlaceholder: "http://example.com:8080",
    xtreamUser: "Username",
    xtreamUserPlaceholder: "username",
    xtreamPass: "Password",
    xtreamPassPlaceholder: "password",
    xtreamConnect: "Connect",
    xtreamDisconnect: "Disconnect",
    xtreamConnecting: "Connecting...",
    xtreamConnected: "Connected to server",
    xtreamDisconnected: "Disconnected",
    xtreamError: "Connection failed — check your credentials",
    xtreamServerInfo: "Server Info",
    xtreamStatus: "Status",
    xtreamActive: "Active",
    xtreamExpired: "Expired",
    xtreamExpiry: "Expiry Date",
    xtreamMaxConn: "Max Connections",
    xtreamActiveConn: "Active Connections",
    dataSource: "Data Source",
    dataSourceFirebase: "Firebase",
    dataSourceXtream: "Xtream Codes",
    live: "Live",
    movies: "Movies",
    series: "Series",
    noXtream: "Not connected to Xtream server",
    noXtreamSub: "Go to Settings to login",
    xtreamLoading: "Loading content...",
    episode: "Episode",
    season: "Season",
    episodes: "Episodes",
    seasons: "Seasons",
    play: "Play",
    year: "Year",
    rating: "Rating",
    genre: "Genre",
    added: "Added",
    noEpisodes: "No episodes available",
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
  link: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
  film: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>`,
  clapperboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z"/><path d="m6.2 5.3 3.1 3.9"/><path d="m12.4 3.4 3.1 4"/><path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/></svg>`,
  wifi: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>`,
  wifiOff: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
  loader: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation:spin 1s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`,
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
  // Xtream Codes state
  dataSource: "firebase",
  xtreamConfig: { url: "", user: "", pass: "" },
  xtreamConnected: false,
  xtreamConnecting: false,
  xtreamInfo: null,
  xtreamCategories: { live: [], vod: [], series: [] },
  xtreamStreams: { live: [], vod: [], series: [] },
  xtreamContentType: "live",
  xtreamLoading: false,
};

// ── HELPERS ─────────────────────────────────────────────────────────
function t(key) { return i18n[state.locale][key] || key; }
function isRTL() { return state.locale === "ar"; }
function escHtml(str) {
  if (!str) return "";
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}
function getChannelName(ch) {
  if (ch._xtream) return ch.name || "";
  return isRTL() && ch.nameAr ? ch.nameAr : ch.name;
}
function getCategoryName(cat) {
  if (cat._xtream) return cat.category_name || cat.name || "";
  return isRTL() ? (cat.nameAr || cat.name) : (cat.nameEn || cat.name);
}
function getChannelDesc(ch) {
  if (ch._xtream) return ch.plot || ch.name || "";
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
function saveXtreamConfig() {
  localStorage.setItem("hs-xtream", JSON.stringify(state.xtreamConfig));
}
function loadXtreamConfig() {
  try {
    const s = localStorage.getItem("hs-xtream");
    if (s) state.xtreamConfig = JSON.parse(s);
  } catch(e) {}
}
function saveDataSource() {
  localStorage.setItem("hs-datasource", state.dataSource);
}
function loadDataSource() {
  const s = localStorage.getItem("hs-datasource");
  if (s === "firebase" || s === "xtream") state.dataSource = s;
}

function toggleFav(id) {
  if (state.favorites.has(id)) state.favorites.delete(id);
  else state.favorites.add(id);
  saveFavorites();
  renderAll();
}

// Get active channels based on data source
function getActiveChannels() {
  if (state.dataSource === "xtream" && state.xtreamConnected) {
    return state.xtreamStreams[state.xtreamContentType] || [];
  }
  return state.allChannels;
}
function getActiveCategories() {
  if (state.dataSource === "xtream" && state.xtreamConnected) {
    return state.xtreamCategories[state.xtreamContentType] || [];
  }
  return state.categories;
}

// ── FIREBASE ────────────────────────────────────────────────────────
let db = null;
let firebaseLoaded = false;
const firebase = { database: {} };

async function loadFirebase() {
  if (firebaseLoaded) return true;
  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js");
    const { getDatabase, ref, onValue, off } = await import("https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js");
    const app = initializeApp(FIREBASE_CONFIG);
    db = getDatabase(app);
    firebase.database = { ref, onValue, off };
    firebaseLoaded = true;
    return true;
  } catch(e) {
    console.warn("Firebase load error:", e);
    return false;
  }
}

function subscribeSettings(cb) {
  if (!db) return;
  const { ref, onValue, off } = firebase.database;
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

// ── XTREAM CODES API ────────────────────────────────────────────────
function xtreamBaseUrl() {
  let url = state.xtreamConfig.url.trim().replace(/\/+$/, "");
  if (!url.startsWith("http")) url = "http://" + url;
  return url;
}

async function xtreamFetch(action) {
  const base = xtreamBaseUrl();
  const u = encodeURIComponent(state.xtreamConfig.user);
  const p = encodeURIComponent(state.xtreamConfig.pass);
  let endpoint = `${base}/player_api.php?username=${u}&password=${p}`;
  if (action) endpoint += `&action=${action}`;
  const resp = await fetch(endpoint, { timeout: 15000 });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const data = await resp.json();
  return data;
}

async function xtreamLogin() {
  const { url, user, pass } = state.xtreamConfig;
  if (!url || !user || !pass) return false;

  state.xtreamConnecting = true;
  state.xtreamConnected = false;
  renderSettingsTab();

  try {
    const data = await xtreamFetch(null);

    if (data.user_info && data.user_info.auth === 1) {
      state.xtreamInfo = data.user_info;
      state.xtreamServerInfo = data.server_info;
      state.xtreamConnected = true;
      state.xtreamConnecting = false;
      saveXtreamConfig();
      renderSettingsTab();

      // Load categories first, then streams
      await xtreamLoadAllContent();
      return true;
    } else {
      state.xtreamConnecting = false;
      renderSettingsTab();
      return false;
    }
  } catch(e) {
    console.error("Xtream login error:", e);
    state.xtreamConnecting = false;
    state.xtreamConnected = false;
    renderSettingsTab();
    return false;
  }
}

async function xtreamDisconnect() {
  state.xtreamConnected = false;
  state.xtreamInfo = null;
  state.xtreamServerInfo = null;
  state.xtreamCategories = { live: [], vod: [], series: [] };
  state.xtreamStreams = { live: [], vod: [], series: [] };
  if (state.dataSource === "xtream") {
    state.dataSource = "firebase";
    saveDataSource();
  }
  renderAll();
}

async function xtreamLoadAllContent() {
  state.xtreamLoading = true;
  renderAll();
  try {
    // Load all categories in parallel
    const [liveCats, vodCats, seriesCats] = await Promise.all([
      xtreamFetch("get_live_categories").catch(() => []),
      xtreamFetch("get_vod_categories").catch(() => []),
      xtreamFetch("get_series_categories").catch(() => []),
    ]);

    state.xtreamCategories.live = (Array.isArray(liveCats) ? liveCats : []).map(c => ({
      ...c, _xtream: true, id: String(c.category_id), name: c.category_name
    }));
    state.xtreamCategories.vod = (Array.isArray(vodCats) ? vodCats : []).map(c => ({
      ...c, _xtream: true, id: String(c.category_id), name: c.category_name
    }));
    state.xtreamCategories.series = (Array.isArray(seriesCats) ? seriesCats : []).map(c => ({
      ...c, _xtream: true, id: String(c.category_id), name: c.category_name
    }));

    // Load streams in parallel
    const [liveStreams, vodStreams, seriesStreams] = await Promise.all([
      xtreamFetch("get_live_streams").catch(() => []),
      xtreamFetch("get_vod_streams").catch(() => []),
      xtreamFetch("get_series").catch(() => []),
    ]);

    const base = xtreamBaseUrl();
    const user = encodeURIComponent(state.xtreamConfig.user);
    const pass = encodeURIComponent(state.xtreamConfig.pass);

    state.xtreamStreams.live = (Array.isArray(liveStreams) ? liveStreams : []).map(s => ({
      ...s, _xtream: true,
      id: "xt_live_" + s.stream_id,
      name: s.name || "",
      logo: s.stream_icon || "",
      category: String(s.category_id),
      type: "live",
      url: `${base}/live/${user}/${pass}/${s.stream_id}.m3u8`,
      urlTs: `${base}/live/${user}/${pass}/${s.stream_id}.ts`,
      description: s.epg_channel_id || "",
    }));

    state.xtreamStreams.vod = (Array.isArray(vodStreams) ? vodStreams : []).map(s => ({
      ...s, _xtream: true,
      id: "xt_vod_" + s.stream_id,
      name: s.name || "",
      logo: s.stream_icon || "",
      category: String(s.category_id),
      type: "vod",
      url: `${base}/movie/${user}/${pass}/${s.stream_id}.${s.container_extension || "mp4"}`,
      description: s.plot || "",
      rating: s.rating || "",
      year: s.year || "",
      genre: s.genre || "",
      added: s.added || "",
    }));

    state.xtreamStreams.series = (Array.isArray(seriesStreams) ? seriesStreams : []).map(s => ({
      ...s, _xtream: true,
      id: "xt_series_" + s.series_id,
      name: s.name || "",
      logo: s.cover || "",
      category: String(s.category_id),
      type: "series",
      seriesId: s.series_id,
      description: s.plot || "",
      rating: s.rating || "",
      year: s.releaseDate || "",
      genre: s.genre || "",
      cast: s.cast || "",
    }));

    state.xtreamLoading = false;
    renderAll();
  } catch(e) {
    console.error("Xtream load content error:", e);
    state.xtreamLoading = false;
    renderAll();
  }
}

async function xtreamGetSeriesInfo(seriesId) {
  try {
    const data = await xtreamFetch("get_series_info&series_id=" + seriesId);
    return data;
  } catch(e) {
    console.error("Error getting series info:", e);
    return null;
  }
}

function xtreamStreamUrl(ch) {
  if (!ch._xtream) return ch.url;
  return ch.url;
}

// ── HLS PLAYER ──────────────────────────────────────────────────────
let hlsInstance = null;

function playStream(url, videoEl) {
  // Destroy previous HLS instance
  if (hlsInstance) {
    hlsInstance.destroy();
    hlsInstance = null;
  }

  if (url.includes(".m3u8")) {
    if (typeof Hls !== "undefined" && Hls.isSupported()) {
      hlsInstance = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hlsInstance.loadSource(url);
      hlsInstance.attachMedia(videoEl);
      hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
        videoEl.play().catch(() => {});
      });
      hlsInstance.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            // Try .ts fallback for Xtream live streams
            const ch = state.currentChannel;
            if (ch && ch.urlTs) {
              hlsInstance.destroy();
              hlsInstance = null;
              videoEl.src = ch.urlTs;
              videoEl.play().catch(() => {});
            }
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hlsInstance.recoverMediaError();
          } else {
            hlsInstance.destroy();
            hlsInstance = null;
          }
        }
      });
    } else if (videoEl.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS (Safari)
      videoEl.src = url;
      videoEl.play().catch(() => {});
    } else {
      // Fallback to .ts
      const ch = state.currentChannel;
      if (ch && ch.urlTs) {
        videoEl.src = ch.urlTs;
        videoEl.play().catch(() => {});
      }
    }
  } else {
    // Direct URL (mp4, mkv, ts, etc.)
    videoEl.src = url;
    videoEl.play().catch(() => {});
  }
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
    const allCh = getActiveChannels();
    const count = allCh.filter(c => state.favorites.has(c.id)).length;
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
  if (state.dataSource === "xtream" && state.xtreamConnected) return;
  const msg = state.settings["welcomeMessage" + (isRTL() ? "Ar" : "En")] || t("welcome");
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
  if (state.dataSource === "xtream" || state.banners.length === 0) { el.classList.add("hidden"); return; }
  el.classList.remove("hidden");
  el.innerHTML = `
    <div class="banners-track no-scroll">
      ${state.banners.map(b => `
        <div class="banner-card">
          ${b.imageUrl ? `<img src="${escHtml(b.imageUrl)}" alt="" loading="lazy">` : ""}
          <div class="banner-overlay">
            <div class="banner-badge">${t("featured")}</div>
            <div class="banner-title">${escHtml(isRTL() ? b.titleAr : (b.titleEn || b.title))}</div>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderCategoryPills() {
  const el = document.getElementById("cat-pills");
  if (!el) return;
  if (state.dataSource === "xtream" && state.xtreamConnected) {
    // Show content type tabs for Xtream
    const cats = getActiveCategories();
    if (cats.length === 0) { el.classList.add("hidden"); return; }
    el.classList.remove("hidden");
    el.innerHTML = `
      <div class="cat-pills no-scroll">
        <button class="cat-pill ${state.selectedCategory === null ? "cat-pill-active" : ""}" onclick="App.selectCategory(null)">${t("allChannels")}</button>
        ${cats.slice(0, 20).map(c => `
          <button class="cat-pill ${state.selectedCategory === c.id ? "cat-pill-active" : ""}" onclick="App.selectCategory('${c.id}')">${escHtml(getCategoryName(c))}</button>
        `).join("")}
      </div>
    `;
    return;
  }
  const cats = state.categories.filter(c => c.visible);
  if (cats.length === 0) { el.classList.add("hidden"); return; }
  el.classList.remove("hidden");
  el.innerHTML = `
    <div class="cat-pills no-scroll">
      ${cats.map(c => `
        <button class="cat-pill" onclick="App.openCategory('${c.id}')">${escHtml(getCategoryName(c))}</button>
      `).join("")}
    </div>
  `;
}

function renderContentTypeTabs() {
  const el = document.getElementById("content-type-tabs");
  if (!el) return;
  if (state.dataSource !== "xtream" || !state.xtreamConnected) {
    el.innerHTML = "";
    el.classList.add("hidden");
    return;
  }
  el.classList.remove("hidden");
  const types = [
    { key: "live", icon: ICONS.tv, label: t("live") },
    { key: "vod", icon: ICONS.film, label: t("movies") },
    { key: "series", icon: ICONS.clapperboard, label: t("series") },
  ];
  el.innerHTML = `
    <div class="content-type-tabs">
      ${types.map(tp => `
        <button class="content-type-tab ${state.xtreamContentType === tp.key ? "ctt-active" : ""}" onclick="App.setContentType('${tp.key}')">
          <span class="ctt-icon">${tp.icon}</span>
          <span>${tp.label}</span>
        </button>
      `).join("")}
    </div>
  `;
}

function renderSourceIndicator() {
  const el = document.getElementById("source-indicator");
  if (!el) return;
  if (!state.xtreamConnected) { el.innerHTML = ""; el.classList.add("hidden"); return; }
  el.classList.remove("hidden");
  const isFB = state.dataSource === "firebase";
  el.innerHTML = `
    <div class="source-switcher">
      <button class="source-btn ${isFB ? "source-active" : ""}" onclick="App.setDataSource('firebase')">
        ${ICONS.info} ${t("dataSourceFirebase")}
      </button>
      <button class="source-btn ${!isFB ? "source-active" : ""}" onclick="App.setDataSource('xtream')">
        ${ICONS.wifi} ${t("dataSourceXtream")}
      </button>
    </div>
  `;
}

function channelCardHTML(ch, horizontal = false) {
  const name = getChannelName(ch);
  const isFav = state.favorites.has(ch.id);
  const favIcon = isFav ? ICONS.heartFilled : ICONS.heart;
  const favClass = isFav ? "active" : "";
  const isSeries = ch._xtream && ch.type === "series";
  const safeId = escHtml(ch.id);
  const logoImg = ch.logo ? `<img src="${escHtml(ch.logo)}" alt="${escHtml(name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="ch-thumb-icon" style="display:none">${isSeries ? ICONS.clapperboard : ICONS.tv}</div>` : `<div class="ch-thumb-icon">${isSeries ? ICONS.clapperboard : ICONS.tv}</div>`;
  const playAction = isSeries ? `App.openSeries(${ch.seriesId})` : `App.play('${safeId}')`;

  if (horizontal) {
    return `
      <div class="ch-card-h">
        <div class="ch-thumb" onclick="${playAction}">
          ${logoImg}
          <div class="ch-play-overlay" onclick="${playAction}">
            <div class="ch-play-btn">${isSeries ? ICONS.info : ICONS.play}</div>
          </div>
        </div>
        <div class="ch-info">
          <div class="ch-name">${escHtml(name)}</div>
          <div class="ch-meta">
            ${ch._xtream && ch.type === "live" ? `<span class="ch-live-badge"><span class="ch-live-dot"></span>LIVE</span>` : ""}
            <button class="ch-fav-btn ${favClass}" onclick="event.stopPropagation();App.toggleFav('${safeId}')">
              ${favIcon}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="ch-card">
      <div class="ch-thumb" onclick="${playAction}">
        ${logoImg}
        ${ch._xtream && ch.type === "live" ? `<div class="ch-live-badge"><span class="ch-live-dot"></span>LIVE</div>` : ""}
        <div class="ch-play-overlay" onclick="${playAction}">
          <div class="ch-play-btn">${isSeries ? ICONS.info : ICONS.play}</div>
        </div>
      </div>
      <div class="ch-info">
        <div class="ch-name">${escHtml(name)}</div>
        <button class="ch-fav-btn ${favClass}" onclick="event.stopPropagation();App.toggleFav('${safeId}')">
          ${favIcon}
        </button>
      </div>
    </div>
  `;
}

function renderHomeChannels() {
  const el = document.getElementById("home-channels");
  if (!el) return;

  // Xtream mode
  if (state.dataSource === "xtream" && state.xtreamConnected) {
    if (state.xtreamLoading) {
      el.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${ICONS.loader}</div>
          <div class="empty-title">${t("xtreamLoading")}</div>
        </div>
      `;
      return;
    }

    let channels = getActiveChannels();
    if (state.selectedCategory) {
      channels = channels.filter(c => String(c.category) === String(state.selectedCategory));
    }
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase();
      channels = channels.filter(c => (c.name || "").toLowerCase().includes(q));
    }

    if (channels.length === 0) {
      el.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${ICONS.tv}</div>
          <div class="empty-title">${t("noChannels")}</div>
        </div>
      `;
      return;
    }

    if (state.xtreamContentType === "series") {
      el.innerHTML = `<div class="channel-grid">${channels.slice(0, 60).map(c => channelCardHTML(c)).join("")}</div>`;
    } else {
      el.innerHTML = `<div class="channel-grid">${channels.slice(0, 60).map(c => channelCardHTML(c)).join("")}</div>`;
    }
    return;
  }

  // Firebase mode
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
  if (state.dataSource === "xtream" || state.categories.length === 0) { el.innerHTML = ""; return; }
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
          <h3>${escHtml(getCategoryName(cat))}</h3>
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

  // Xtream mode
  if (state.dataSource === "xtream" && state.xtreamConnected) {
    const cats = getActiveCategories();
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase();
      const filtered = cats.filter(c => getCategoryName(c).toLowerCase().includes(q));
      renderXtreamCategoriesList(el, filtered, cats);
      return;
    }
    renderXtreamCategoriesList(el, cats, cats);
    return;
  }

  // Firebase mode - selected category
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
        <h2 style="font-size:18px;font-weight:700;margin-bottom:16px">${escHtml(catName)}</h2>
        <div class="search-wrap">
          <div class="search-wrap-inner" style="position:relative">
            ${ICONS.search}
            <input id="search-input-cat" class="search-input" type="text" placeholder="${t("search")}" value="${escHtml(state.searchQuery)}" oninput="App.onSearch(this.value)">
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

  // Firebase - category list
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
          <input class="search-input" type="text" placeholder="${t("search")}" value="${escHtml(state.searchQuery)}" oninput="App.onSearch(this.value)">
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
                  <div class="cat-name">${escHtml(getCategoryName(c))}</div>
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
  const searchInner = el.querySelector(".search-wrap-inner");
  if (searchInner) {
    const svg = searchInner.querySelector("svg");
    if (svg) {
      if (isRTL()) { svg.style.cssText = "position:absolute;top:50%;transform:translateY(-50%);width:16px;height:16px;color:var(--muted);right:12px;pointer-events:none"; }
      else { svg.style.cssText = "position:absolute;top:50%;transform:translateY(-50%);width:16px;height:16px;color:var(--muted);left:12px;pointer-events:none"; }
    }
  }
}

function renderXtreamCategoriesList(container, cats, allCats) {
  const arrow = isRTL() ? ICONS.arrowLeft : ICONS.arrowRight;
  const streams = getActiveChannels();
  const typeLabel = state.xtreamContentType === "live" ? t("channelCount") : (state.xtreamContentType === "vod" ? t("movies") : t("series"));
  const isSeries = state.xtreamContentType === "series";

  if (state.selectedCategory) {
    const cat = allCats.find(c => String(c.category_id) === String(state.selectedCategory) || c.id === state.selectedCategory);
    const catName = cat ? getCategoryName(cat) : "";
    let items = streams.filter(c => String(c.category) === String(state.selectedCategory));
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase();
      items = items.filter(c => (c.name || "").toLowerCase().includes(q));
    }
    container.innerHTML = `
      <div style="padding:16px;max-width:1200px;margin:0 auto">
        <button class="back-btn" onclick="App.closeCategory()">${arrow} ${t("categories")}</button>
        <h2 style="font-size:18px;font-weight:700;margin-bottom:16px">${escHtml(catName)}</h2>
        ${items.length > 0 ? `<div class="channel-grid">${items.map(c => channelCardHTML(c)).join("")}</div>` : `
          <div class="empty-state">
            <div class="empty-icon">${ICONS.tv}</div>
            <div class="empty-title">${t("noChannels")}</div>
          </div>
        `}
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="padding:16px;max-width:1200px;margin:0 auto">
      <h2 style="font-size:18px;font-weight:700;margin-bottom:16px">${t("categories")}</h2>
      <div class="search-wrap">
        <div class="search-wrap-inner" style="position:relative">
          ${ICONS.search}
          <input class="search-input" type="text" placeholder="${t("search")}" value="${escHtml(state.searchQuery)}" oninput="App.onSearch(this.value)">
        </div>
      </div>
      ${cats.length > 0 ? `
        <div class="cat-grid">
          ${cats.map(c => {
            const count = streams.filter(s => String(s.category) === String(c.category_id || c.id)).length;
            return `
              <button class="cat-card" onclick="App.openCategory('${c.category_id || c.id}')">
                <div class="cat-icon">${isSeries ? "🎬" : "📡"}</div>
                <div class="cat-details">
                  <div class="cat-name">${escHtml(getCategoryName(c))}</div>
                  <div class="cat-count">${count} ${typeLabel}</div>
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
  const searchInner = container.querySelector(".search-wrap-inner");
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

  // Collect favorites from both sources
  let favChannels = [];
  // Firebase favorites
  favChannels.push(...state.allChannels.filter(c => state.favorites.has(c.id)));
  // Xtream favorites
  if (state.xtreamConnected) {
    Object.values(state.xtreamStreams).forEach(streams => {
      favChannels.push(...streams.filter(c => state.favorites.has(c.id)));
    });
  }

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

  const xc = state.xtreamConfig;

  // Build Xtream server info section
  let xtreamInfoHTML = "";
  if (state.xtreamConnected && state.xtreamInfo) {
    const info = state.xtreamInfo;
    const si = state.xtreamServerInfo;
    const statusColor = info.status === "Active" ? "var(--g)" : "var(--r)";
    const statusText = info.status === "Active" ? t("xtreamActive") : t("xtreamExpired");
    const expiryDate = info.exp_date ? new Date(parseInt(info.exp_date) * 1000).toLocaleDateString(isRTL() ? "ar-EG" : "en-US") : "—";
    xtreamInfoHTML = `
      <div class="xtream-status connected">
        <div class="xtream-status-header">
          <span style="color:var(--g)">${ICONS.wifi}</span>
          <span style="font-weight:600;color:var(--g)">${t("xtreamConnected")}</span>
        </div>
        <div class="settings-row">
          <span class="settings-label">${t("xtreamStatus")}</span>
          <span class="settings-value" style="color:${statusColor}">${escHtml(statusText)}</span>
        </div>
        <div class="settings-row">
          <span class="settings-label">${t("xtreamExpiry")}</span>
          <span class="settings-value">${expiryDate}</span>
        </div>
        ${info.max_connections ? `
        <div class="settings-row">
          <span class="settings-label">${t("xtreamMaxConn")}</span>
          <span class="settings-value">${info.max_connections}</span>
        </div>
        ` : ""}
        ${info.active_cons !== undefined ? `
        <div class="settings-row">
          <span class="settings-label">${t("xtreamActiveConn")}</span>
          <span class="settings-value">${info.active_cons}</span>
        </div>
        ` : ""}
        ${si && si.url ? `
        <div class="settings-row">
          <span class="settings-label">${t("xtreamUrl")}</span>
          <span class="settings-value" style="font-size:11px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(si.url)}</span>
        </div>
        ` : ""}
        <div style="margin-top:12px">
          <button class="xtream-disconnect-btn" onclick="App.xtreamDisconnect()">
            ${ICONS.wifiOff} ${t("xtreamDisconnect")}
          </button>
        </div>
      </div>
    `;
  } else if (state.xtreamConnecting) {
    xtreamInfoHTML = `
      <div class="xtream-status connecting">
        <div class="xtream-status-header">
          <span style="color:var(--y)">${ICONS.loader}</span>
          <span style="font-weight:600;color:var(--y)">${t("xtreamConnecting")}</span>
        </div>
      </div>
    `;
  }

  el.innerHTML = `
    <div style="padding:16px;max-width:600px;margin:0 auto">
      <h2 style="font-size:18px;font-weight:700;margin-bottom:18px">${t("settings")}</h2>

      <!-- Xtream Codes -->
      <div class="settings-section">
        <div class="settings-title">
          <span style="color:#7B2FFF">${ICONS.link}</span> ${t("xtreamCodes")}
        </div>

        ${xtreamInfoHTML}

        <div class="xtream-login-form" style="${state.xtreamConnected ? "display:none" : ""}">
          <div class="xtream-input-group">
            <label class="xtream-label">${t("xtreamUrl")}</label>
            <input id="xtream-url" class="xtream-input" type="url" placeholder="${t("xtreamUrlPlaceholder")}" value="${escHtml(xc.url)}">
          </div>
          <div class="xtream-input-group">
            <label class="xtream-label">${t("xtreamUser")}</label>
            <input id="xtream-user" class="xtream-input" type="text" placeholder="${t("xtreamUserPlaceholder")}" value="${escHtml(xc.user)}" autocomplete="username">
          </div>
          <div class="xtream-input-group">
            <label class="xtream-label">${t("xtreamPass")}</label>
            <input id="xtream-pass" class="xtream-input" type="password" placeholder="${t("xtreamPassPlaceholder")}" value="${escHtml(xc.pass)}" autocomplete="current-password">
          </div>
          <button id="xtream-connect-btn" class="xtream-connect-btn" onclick="App.xtreamLogin()">
            ${ICONS.wifi} ${t("xtreamConnect")}
          </button>
        </div>
      </div>

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
          <span class="settings-value">${escHtml(state.settings.appName || "hammadshow")}</span>
        </div>
        <div class="settings-row">
          <span class="settings-label">${t("version")}</span>
          <span class="settings-value">2.0.0</span>
        </div>
        <div class="settings-row">
          <span class="settings-label">${t("availableChannels")}</span>
          <span class="settings-value">${getActiveChannels().length}</span>
        </div>
        <div class="settings-row">
          <span class="settings-label">${t("categoriesCount")}</span>
          <span class="settings-value">${getActiveCategories().length}</span>
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
        <p style="margin-top:4px">&copy; 2024 hammadshow — ${t("allRightsReserved")}</p>
      </div>
    </div>
  `;
}

function renderSeriesDetail(seriesId) {
  const el = document.getElementById("tab-home");
  if (!el) return;
  const series = (state.xtreamStreams.series || []).find(s => s.seriesId == seriesId);
  if (!series) return;

  const name = series.name || "";
  const desc = series.plot || "";
  const cover = series.cover || "";
  const rating = series.rating || "";
  const year = series.releaseDate || "";
  const genre = series.genre || "";
  const cast = series.cast || "";

  el.innerHTML = `
    <div style="padding:16px;max-width:800px;margin:0 auto">
      <button class="back-btn" onclick="App.switchTab('home')">
        ${isRTL() ? ICONS.arrowRight : ICONS.arrowLeft} ${t("back")}
      </button>

      <div class="series-detail">
        <div class="series-cover">
          ${cover ? `<img src="${escHtml(cover)}" alt="${escHtml(name)}" loading="lazy" onerror="this.parentElement.innerHTML='${ICONS.clapperboard}'">` : ICONS.clapperboard}
        </div>
        <div class="series-info">
          <h2 class="series-title">${escHtml(name)}</h2>
          ${rating ? `<span class="series-meta"><span style="color:#F59E0B">${ICONS.star}</span> ${escHtml(rating)}</span>` : ""}
          ${year ? `<span class="series-meta">${escHtml(year)}</span>` : ""}
          ${genre ? `<span class="series-meta">${escHtml(genre)}</span>` : ""}
          ${cast ? `<p class="series-cast">${escHtml(cast)}</p>` : ""}
          ${desc ? `<p class="series-desc">${escHtml(desc)}</p>` : ""}
        </div>
      </div>

      <div id="series-episodes">
        <div class="empty-state">
          <div class="empty-icon">${ICONS.loader}</div>
          <div class="empty-title">${t("xtreamLoading")}</div>
        </div>
      </div>
    </div>
  `;

  // Load series episodes
  xtreamGetSeriesInfo(seriesId).then(data => {
    const epEl = document.getElementById("series-episodes");
    if (!epEl) return;
    if (!data || !data.episodes) {
      epEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${ICONS.clapperboard}</div>
          <div class="empty-title">${t("noEpisodes")}</div>
        </div>
      `;
      return;
    }

    const base = xtreamBaseUrl();
    const user = encodeURIComponent(state.xtreamConfig.user);
    const pass = encodeURIComponent(state.xtreamConfig.pass);
    const seasons = data.episodes;
    let html = "";

    if (typeof seasons === "object") {
      // Sort seasons
      const seasonKeys = Object.keys(seasons).sort((a, b) => parseInt(a) - parseInt(b));
      seasonKeys.forEach(seasonNum => {
        const eps = seasons[seasonNum];
        if (!Array.isArray(eps)) return;
        html += `
          <div style="margin-bottom:24px">
            <div class="section-header">
              <div class="section-bar" style="background:linear-gradient(to bottom,#7B2FFF,#FF2D55)"></div>
              <h3>${t("season")} ${escHtml(seasonNum)}</h3>
              <span style="font-size:11px;color:var(--muted);margin-inline-start:4px">(${eps.length} ${t("episodes")})</span>
            </div>
            <div class="episode-list">
              ${eps.map(ep => {
                const epUrl = `${base}/series/${user}/${pass}/${ep.id}.${ep.container_extension || "mp4"}`;
                const epId = "xt_ep_" + ep.id;
                const epName = ep.title || `${t("episode")} ${ep.episode_num || ""}`;
                const epInfo = ep.info ? ep.info : {};
                const epDuration = epInfo.duration || "";
                return `
                  <div class="episode-card" onclick="App.playXtreamEpisode('${escHtml(epUrl)}', '${escHtml(epName)}', '${escHtml(cover || "")}')">
                    <div class="episode-play">${ICONS.play}</div>
                    <div class="episode-details">
                      <div class="episode-name">${escHtml(epName)}</div>
                      <div class="episode-meta">
                        ${epDuration ? `<span>${escHtml(epDuration)} mins</span>` : ""}
                        ${epInfo.container_extension ? `<span>${escHtml(epInfo.container_extension).toUpperCase()}</span>` : ""}
                      </div>
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          </div>
        `;
      });
    }

    if (!html) {
      html = `
        <div class="empty-state">
          <div class="empty-icon">${ICONS.clapperboard}</div>
          <div class="empty-title">${t("noEpisodes")}</div>
        </div>
      `;
    }

    epEl.innerHTML = html;
  });
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
  const url = xtreamStreamUrl(ch);

  const videoEl = document.getElementById("player-video");
  videoEl.src = "";
  playStream(url, videoEl);

  document.getElementById("player-ch-name").textContent = name;
  document.getElementById("player-ch-desc").textContent = desc;
  const logoEl = document.getElementById("player-logo");
  if (ch.logo) {
    logoEl.innerHTML = `<img src="${escHtml(ch.logo)}" alt="" onerror="this.parentElement.innerHTML='${ICONS.tv}'">`;
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
  renderSourceIndicator();
  renderContentTypeTabs();
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
    renderSourceIndicator();
    renderContentTypeTabs();
    renderCategoryPills();
    renderHomeChannels();
    renderCategorySections();
  }
}

// ── APP API (global) ────────────────────────────────────────────────
window.App = {
  switchTab,
  _lang: state.locale,
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
  selectCategory(id) {
    state.selectedCategory = id;
    renderCategoryPills();
    renderHomeChannels();
  },
  play(id) {
    // Find in all sources
    let ch = state.allChannels.find(c => c.id === id);
    if (!ch && state.xtreamConnected) {
      Object.values(state.xtreamStreams).forEach(streams => {
        if (!ch) ch = streams.find(c => c.id === id);
      });
    }
    if (ch) {
      state.currentChannel = ch;
      state.playerOpen = true;
      renderPlayer();
    }
  },
  playXtreamEpisode(url, name, logo) {
    state.currentChannel = {
      id: "xt_ep_" + Date.now(),
      name: name,
      logo: logo || "",
      url: url,
      type: "episode",
      description: "",
      _xtream: true,
    };
    state.playerOpen = true;
    renderPlayer();
  },
  openSeries(seriesId) {
    renderSeriesDetail(seriesId);
  },
  closePlayer() {
    const v = document.getElementById("player-video");
    if (v) { v.pause(); v.src = ""; }
    if (hlsInstance) { hlsInstance.destroy(); hlsInstance = null; }
    state.playerOpen = false;
    state.currentChannel = null;
    renderPlayer();
  },
  toggleFav(id) { toggleFav(id); },
  setLang(lang) {
    state.locale = lang;
    this._lang = lang;
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
  // Xtream methods
  async xtreamLogin() {
    const url = document.getElementById("xtream-url").value.trim();
    const user = document.getElementById("xtream-user").value.trim();
    const pass = document.getElementById("xtream-pass").value.trim();
    state.xtreamConfig = { url, user, pass };
    const ok = await xtreamLogin();
    if (ok) {
      state.dataSource = "xtream";
      saveDataSource();
      renderAll();
    } else {
      // Show error
      const btn = document.getElementById("xtream-connect-btn");
      if (btn) {
        btn.style.background = "var(--r)";
        btn.innerHTML = `${ICONS.x} ${t("xtreamError")}`;
        setTimeout(() => {
          btn.style.background = "";
          btn.innerHTML = `${ICONS.wifi} ${t("xtreamConnect")}`;
        }, 3000);
      }
    }
  },
  xtreamDisconnect() {
    xtreamDisconnect();
  },
  setDataSource(source) {
    state.dataSource = source;
    state.selectedCategory = null;
    saveDataSource();
    renderAll();
  },
  setContentType(type) {
    state.xtreamContentType = type;
    state.selectedCategory = null;
    state.searchQuery = "";
    renderAll();
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
  loadXtreamConfig();
  loadDataSource();
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

  // Auto-reconnect to Xtream if credentials saved
  if (state.xtreamConfig.url && state.xtreamConfig.user && state.xtreamConfig.pass && state.dataSource === "xtream") {
    await xtreamLogin();
  }

  // Register Service Worker
  if ("serviceWorker" in navigator) {
    try { await navigator.serviceWorker.register("./sw.js"); } catch(e) {}
  }
}

init();