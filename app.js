/* ═══════════════════════════════════════════════════════════════════════
   hammadshow v2 — App JS (Xtream Only + PiP Player + Screenshot)
   من برمجة وتطوير المهندس محمد حماد
   ═══════════════════════════════════════════════════════════════════════ */

// ── TRANSLATIONS ─────────────────────────────────────────────────────
const i18n={
ar:{
  live:"بث مباشر",movies:"أفلام",series:"مسلسلات",favorites:"المفضلة",
  history:"المشاهدات",recent:"مضاف حديث",search:"بحث...",
  noChannels:"لا توجد قنوات",noFavs:"لا توجد عناصر في المفضلة",
  noFavsSub:"أضف عناصرك المفضلة",noHistory:"لا يوجد سجل مشاهدات",
  noHistorySub:"ستظهر هنا القنوات والمقاطع التي تشاهدها",
  noRecent:"لا يوجد محتوى مضاف حديثاً",
  watchAll:"عرض الكل",channel:"قناة",channels:"قنوات",
  allChannels:"جميع القنوات",episode:"الحلقة",season:"الموسم",
  episodes:"حلقات",seasons:"مواسم",back:"رجوع",close:"إغلاق",
  settings:"الإعدادات",language:"اللغة",arabic:"العربية",english:"English",
  xtreamCodes:"Xtream Codes",xtreamUrl:"رابط السيرفر",
  xtreamUrlPh:"http://example.com:8080",xtreamUser:"اسم المستخدم",
  xtreamUserPh:"username",xtreamPass:"كلمة المرور",xtreamPassPh:"password",
  connect:"اتصال",disconnect:"قطع الاتصال",connecting:"جاري الاتصال...",
  connected:"متصل",error:"فشل الاتصال",status:"الحالة",
  active:"نشط",expired:"منتهي",expiry:"انتهاء في",maxConn:"أقصى اتصال",
  activeConn:"اتصال نشط",about:"حول",developer:"من برمجة وتطوير المهندس محمد حماد",
  devName:"المهندس محمد حماد",devRole:"مبرمج ومطور تطبيقات",
  followUs:"تابعنا",version:"الإصدار",clearHistory:"مسح السجل",
  today:"اليوم",yesterday:"أمس",daysAgo:"منذ يوم",minsAgo:"منذ دقيقة",
},
en:{
  live:"Live TV",movies:"Movies",series:"Series",favorites:"Favorites",
  history:"Watched",recent:"Recently Added",search:"Search...",
  noChannels:"No channels available",noFavs:"No favorites yet",
  noFavsSub:"Add your favorite items",noHistory:"No watch history",
  noHistorySub:"Channels and videos you watch will appear here",
  noRecent:"No recently added content",
  watchAll:"View All",channel:"channel",channels:"channels",
  allChannels:"All Channels",episode:"Episode",season:"Season",
  episodes:"Episodes",seasons:"Seasons",back:"Back",close:"Close",
  settings:"Settings",language:"Language",arabic:"العربية",english:"English",
  xtreamCodes:"Xtream Codes",xtreamUrl:"Server URL",
  xtreamUrlPh:"http://example.com:8080",xtreamUser:"Username",
  xtreamUserPh:"username",xtreamPass:"Password",xtreamPassPh:"password",
  connect:"Connect",disconnect:"Disconnect",connecting:"Connecting...",
  connected:"Connected",error:"Connection failed",status:"Status",
  active:"Active",expired:"Expired",expiry:"Expires",maxConn:"Max Conn.",
  activeConn:"Active Conn.",about:"About",developer:"Developed by Engineer Mohamed Hammad",
  devName:"Engineer Mohamed Hammad",devRole:"App Developer",
  followUs:"Follow Us",version:"Version",clearHistory:"Clear History",
  today:"Today",yesterday:"Yesterday",daysAgo:"days ago",minsAgo:"min ago",
}};

// ── SVG ICONS ───────────────────────────────────────────────────────
const I={
  tv:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="15" x="2" y="7" rx="2"/><polyline points="17 2 12 7 7 2"/></svg>`,
  film:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>`,
  clap:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z"/><path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/></svg>`,
  heart:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
  heartF:`<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
  clock:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  plus:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
  play:`<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
  pause:`<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>`,
  x:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
  arrowL:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>`,
  arrowR:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19 7-7-7-7"/><path d="M5 12h14"/></svg>`,
  star:`<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  search:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
  wifi:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>`,
  wifiOff:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>`,
  loader:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`,
  check:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
  globe:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`,
  info:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
  facebook:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
  trash:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`,
};

// ── STATE ───────────────────────────────────────────────────────────
const S={
  locale:"ar",activeTab:"live",selectedCat:null,searchQ:"",
  xtConfig:{url:"",user:"",pass:""},xtConnected:false,xtConnecting:false,
  xtInfo:null,xtServerInfo:null,
  xtCats:{live:[],vod:[],series:[]},xtStreams:{live:[],vod:[],series:[]},
  xtLoading:false,
  favs:new Set(),history:[],maxHistory:50,
  current:null,playerOpen:false,settingsOpen:false,
  controlsTimer:null,controlsVisible:false,
  hlsInst:null,
};

// ── HELPERS ─────────────────────────────────────────────────────────
const t=k=>i18n[S.locale][k]||k;
const isRTL=()=>S.locale==="ar";
const esc=s=>{if(!s)return"";const d=document.createElement("div");d.textContent=s;return d.innerHTML};
function save(k,v){localStorage.setItem("hs-"+k,JSON.stringify(v))}
function load(k,d){try{const v=localStorage.getItem("hs-"+k);return v?JSON.parse(v):d}catch(e){return d}}
function saveFavs(){save("favs",[...S.favs])}
function loadFavs(){S.favs=new Set(load("favs",[]))}
function saveHistory(){save("hist",S.history)}
function loadHistory(){S.history=load("hist",[])}
function addHistory(item){
  S.history=S.history.filter(h=>h.id!==item.id);
  S.history.unshift({id:item.id,name:item.name,logo:item.logo||"",type:item.type,url:item.url,urlTs:item.urlTs||"",ts:Date.now()});
  if(S.history.length>S.maxHistory)S.history=S.history.slice(0,S.maxHistory);
  saveHistory();
}
function timeAgo(ts){const d=Date.now()-ts,m=Math.floor(d/60000),h=Math.floor(d/3600000),dy=Math.floor(d/86400000);if(m<1)return" ";if(m<60)return m+" "+t("minsAgo");if(h<24)return t("yesterday");if(dy<7)return dy+" "+t("daysAgo");return new Date(ts).toLocaleDateString(isRTL()?"ar-EG":"en-US")}
function formatTime(s){if(isNaN(s)||!isFinite(s))return"0:00";const m=Math.floor(s/60),sec=Math.floor(s%60);return m+":"+(sec<10?"0":"")+sec}

// ── XTREAM API ──────────────────────────────────────────────────────
function xtBase(){let u=S.xtConfig.url.trim().replace(/\/+$/,"");if(!u.startsWith("http"))u="http://"+u;return u}
async function xtFetch(action){
  const b=xtBase(),u=encodeURIComponent(S.xtConfig.user),p=encodeURIComponent(S.xtConfig.pass);
  let ep=`${b}/player_api.php?username=${u}&password=${p}`;if(action)ep+=`&action=${action}`;
  const r=await fetch(ep);if(!r.ok)throw new Error(r.status);return r.json();
}
async function xtLogin(){
  if(!S.xtConfig.url||!S.xtConfig.user||!S.xtConfig.pass)return false;
  S.xtConnecting=true;S.xtConnected=false;renderSettings();
  try{
    const d=await xtFetch(null);
    if(d.user_info&&d.user_info.auth===1){
      S.xtInfo=d.user_info;S.xtServerInfo=d.server_info;S.xtConnected=true;S.xtConnecting=false;
      save("xtc",S.xtConfig);renderSettings();await xtLoadAll();return true;
    }
    S.xtConnecting=false;renderSettings();return false;
  }catch(e){console.error(e);S.xtConnecting=false;S.xtConnected=false;renderSettings();return false}
}
async function xtDisconnect(){
  S.xtConnected=false;S.xtInfo=null;S.xtServerInfo=null;
  S.xtCats={live:[],vod:[],series:[]};S.xtStreams={live:[],vod:[],series:[]};
  S.xtLoading=false;renderAll();
}
async function xtLoadAll(){
  S.xtLoading=true;renderAll();
  try{
    const[lC,vC,sC]=await Promise.all([xtFetch("get_live_categories").catch(()=>[]),xtFetch("get_vod_categories").catch(()=>[]),xtFetch("get_series_categories").catch(()=>[])]);
    S.xtCats.live=(Array.isArray(lC)?lC:[]).map(c=>({...c,_xt:1,id:String(c.category_id),name:c.category_name}));
    S.xtCats.vod=(Array.isArray(vC)?vC:[]).map(c=>({...c,_xt:1,id:String(c.category_id),name:c.category_name}));
    S.xtCats.series=(Array.isArray(sC)?sC:[]).map(c=>({...c,_xt:1,id:String(c.category_id),name:c.category_name}));
    const[lS,vS,sS]=await Promise.all([xtFetch("get_live_streams").catch(()=>[]),xtFetch("get_vod_streams").catch(()=>[]),xtFetch("get_series").catch(()=>[])]);
    const b=xtBase(),u=encodeURIComponent(S.xtConfig.user),p=encodeURIComponent(S.xtConfig.pass);
    S.xtStreams.live=(Array.isArray(lS)?lS:[]).map(s=>({...s,_xt:1,id:"xl_"+s.stream_id,name:s.name||"",logo:s.stream_icon||"",category:String(s.category_id),type:"live",url:`${b}/live/${u}/${p}/${s.stream_id}.m3u8`,urlTs:`${b}/live/${u}/${p}/${s.stream_id}.ts`,description:""}));
    S.xtStreams.vod=(Array.isArray(vS)?vS:[]).map(s=>{const ext=s.container_extension||"mp4";const sid=s.stream_id;return{...s,_xt:1,id:"xv_"+sid,name:s.name||"",logo:s.stream_icon||"",category:String(s.category_id),type:"vod",url:`${b}/movie/${u}/${p}/${sid}.${ext}`,urlM3u8:`${b}/movie/${u}/${p}/${sid}.m3u8`,urlTs:`${b}/movie/${u}/${p}/${sid}.ts`,description:s.plot||"",rating:s.rating||"",year:s.year||"",genre:s.genre||"",added:s.added||""}});
    S.xtStreams.series=(Array.isArray(sS)?sS:[]).map(s=>({...s,_xt:1,id:"xs_"+s.series_id,name:s.name||"",logo:s.cover||"",category:String(s.category_id),type:"series",seriesId:s.series_id,description:s.plot||"",rating:s.rating||"",year:s.releaseDate||"",genre:s.genre||"",cast:s.cast||"",added:s.added||""}));
    S.xtLoading=false;renderAll();
  }catch(e){console.error(e);S.xtLoading=false;renderAll()}
}
async function xtSeriesInfo(sid){try{return await xtFetch("get_series_info&series_id="+sid)}catch(e){return null}}

// ── HLS PLAYER ──────────────────────────────────────────────────────
function destroyHls(){if(S.hlsInst){S.hlsInst.destroy();S.hlsInst=null}}
function playStream(url,video,item){
  destroyHls();video.removeAttribute('src');video.load();
  const m3u8Url=(item&&item.urlM3u8)?item.urlM3u8:null;
  const tsUrl=(item&&item.urlTs)?item.urlTs:null;
  const isVod=(item&&item.type==="vod")||(item&&item.type==="series");
  // For VOD: try m3u8 first (most Xtream servers serve VOD as HLS)
  // For Live: URL is already m3u8
  // For direct play (episodes etc): use as-is
  let primaryUrl=url;
  if(isVod&&m3u8Url)primaryUrl=m3u8Url;
  if(primaryUrl.includes('.m3u8')||primaryUrl.includes('m3u8')){
    if(typeof Hls!=="undefined"&&Hls.isSupported()){
      const h=new Hls({enableWorker:true,lowLatencyMode:false,maxBufferLength:30,maxMaxBufferLength:120,fragLoadingTimeOut:20000,manifestLoadingTimeOut:15000,levelLoadingTimeOut:15000});
      S.hlsInst=h;
      h.loadSource(primaryUrl);h.attachMedia(video);
      h.on(Hls.Events.MANIFEST_PARSED,()=>{video.play().catch(()=>{})});
      h.on(Hls.Events.ERROR,(ev,d)=>{
        if(d.fatal){console.warn('[H+] HLS fatal:',d.type,d.details);
          destroyHls();
          if(d.type===Hls.ErrorTypes.MEDIA_ERROR){
            // Try direct URL as fallback
            tryDirectPlay(url,video,tsUrl);
          }else{
            tryDirectPlay(url,video,tsUrl);
          }
        }
      });
    }else if(video.canPlayType('application/vnd.apple.mpegurl')){
      video.src=primaryUrl;video.play().catch(()=>{tryDirectPlay(url,video,tsUrl)});
    }else{tryDirectPlay(url,video,tsUrl)}
  }else{
    tryDirectPlay(url,video,tsUrl);
  }
}
function tryDirectPlay(url,video,tsUrl){
  destroyHls();
  video.onerror=function(){
    console.warn('[H+] Direct play failed, trying .ts fallback');
    if(tsUrl&&video.src!==tsUrl){video.onerror=null;video.src=tsUrl;video.play().catch(()=>{})}
  };
  video.src=url;video.play().catch(()=>{console.warn('[H+] Autoplay blocked or failed')});
}

// ── RENDERING ───────────────────────────────────────────────────────
function renderNavLabels(){document.querySelectorAll(".nav-label").forEach(el=>{const tb=el.dataset.tab;if(tb)el.textContent=t(tb)})}

function renderLiveTab(){
  const el=document.getElementById("tab-live");if(!el)return;
  if(!S.xtConnected){el.innerHTML=`<div style="padding:16px;max-width:500px;margin:0 auto">
    <div class="hero-grid">
      <div class="hero-card hc-live" onclick="App.switchTab('live')"><div class="hero-icon">${I.tv}</div><div class="hero-label">${t("live")}</div></div>
      <div class="hero-card hc-movies" onclick="App.switchTab('movies')"><div class="hero-icon">${I.film}</div><div class="hero-label">${t("movies")}</div></div>
      <div class="hero-card hc-series" onclick="App.switchTab('series')"><div class="hero-icon">${I.clap}</div><div class="hero-label">${t("series")}</div></div>
      <div class="hero-card hc-recent" onclick="App.switchTab('recent')"><div class="hero-icon">${I.plus}</div><div class="hero-label">${t("recent")}</div></div>
    </div>
    <div class="empty-state"><div class="empty-icon">${I.wifiOff}</div><div class="empty-title">${t("noChannels")}</div><div class="empty-sub">${t("noHistorySub")}</div></div>
  </div>`;return}
  // 4 hero cards
  let html=`<div style="padding:16px;max-width:1200px;margin:0 auto">
    <div class="hero-grid">
      <div class="hero-card hc-live" onclick="App.switchTab('live')"><div class="hero-icon">${I.tv}</div><div class="hero-label">${t("live")}</div><div class="hero-sub">${S.xtStreams.live.length} ${t("channels")}</div></div>
      <div class="hero-card hc-movies" onclick="App.switchTab('movies')"><div class="hero-icon">${I.film}</div><div class="hero-label">${t("movies")}</div><div class="hero-sub">${S.xtStreams.vod.length}</div></div>
      <div class="hero-card hc-series" onclick="App.switchTab('series')"><div class="hero-icon">${I.clap}</div><div class="hero-label">${t("series")}</div><div class="hero-sub">${S.xtStreams.series.length}</div></div>
      <div class="hero-card hc-recent" onclick="App.switchTab('recent')"><div class="hero-icon">${I.plus}</div><div class="hero-label">${t("recent")}</div></div>
    </div>
    <div class="search-wrap"><div class="search-wrap-inner" style="position:relative">${I.search}<input class="search-input" type="text" placeholder="${t("search")}" value="${esc(S.searchQ)}" oninput="App.onSearch(this.value)"></div></div>`;
  // Cat pills
  const cats=S.xtCats.live;
  if(cats.length>0&&!S.searchQ){
    html+=`<div style="display:flex;gap:7px;overflow-x:auto;padding-bottom:8px;margin-bottom:16px" class="no-scroll">`;
    html+=`<button class="cat-pill-quick ${!S.selectedCat?'cpq-active':''}" onclick="App.selectCat(null)" style="flex-shrink:0;padding:7px 14px;border-radius:20px;background:${!S.selectedCat?'var(--grad)':'rgba(255,255,255,.04)'};border:1px solid ${!S.selectedCat?'transparent':'rgba(255,255,255,.06)'};color:${!S.selectedCat?'#fff':'var(--sub)'};font-size:12px;font-weight:600;white-space:nowrap">${t("allChannels")}</button>`;
    cats.slice(0,15).forEach(c=>{html+=`<button class="cat-pill-quick ${S.selectedCat===c.id?'cpq-active':''}" onclick="App.selectCat('${c.id}')" style="flex-shrink:0;padding:7px 14px;border-radius:20px;background:${S.selectedCat===c.id?'var(--grad)':'rgba(255,255,255,.04)'};border:1px solid ${S.selectedCat===c.id?'transparent':'rgba(255,255,255,.06)'};color:${S.selectedCat===c.id?'#fff':'var(--sub)'};font-size:12px;font-weight:600;white-space:nowrap">${esc(c.name)}</button>`});
    html+=`</div>`;
  }
  // Channels
  let channels=S.xtStreams.live;
  if(S.selectedCat)channels=channels.filter(c=>c.category===S.selectedCat);
  if(S.searchQ){const q=S.searchQ.toLowerCase();channels=channels.filter(c=>(c.name||"").toLowerCase().includes(q))}
  if(S.xtLoading){html+=`<div class="skel-grid">${Array(6).fill('<div class="skel-card"><div class="skel-thumb"></div><div class="skel-text"></div></div>').join("")}</div>`}
  else if(channels.length===0){html+=`<div class="empty-state"><div class="empty-icon">${I.tv}</div><div class="empty-title">${t("noChannels")}</div></div>`}
  else{html+=`<div class="channel-grid">${channels.slice(0,60).map(c=>chCardHTML(c)).join("")}</div>`}
  html+=`</div>`;el.innerHTML=html;
  fixSearchIcon(el);
}

function renderMoviesTab(){
  const el=document.getElementById("tab-movies");if(!el)return;
  if(!S.xtConnected){el.innerHTML=emptyNoXtream();return}
  let html=`<div style="padding:16px 0;max-width:1200px;margin:0 auto">
    <h2 style="font-size:17px;font-weight:800;margin-bottom:14px;padding:0 16px">${t("movies")}</h2>
    <div style="padding:0 16px;margin-bottom:14px"><div class="search-wrap"><div class="search-wrap-inner" style="position:relative">${I.search}<input class="search-input" type="text" placeholder="${t("search")}" value="${esc(S.searchQ)}" oninput="App.onSearch(this.value)"></div></div></div>`;
  if(S.searchQ){
    const q=S.searchQ.toLowerCase();
    const filtered=S.xtStreams.vod.filter(c=>(c.name||"").toLowerCase().includes(q));
    if(filtered.length===0)html+=`<div class="empty-state"><div class="empty-icon">${I.film}</div><div class="empty-title">${t("noChannels")}</div></div>`;
    else html+=`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:0 16px">${filtered.slice(0,60).map(c=>posterCardHTML(c)).join("")}</div>`;
  }else{
    const cats=S.xtCats.vod;
    if(S.xtLoading){html+=Array(3).fill('<div class="folder-section"><div class="folder-header"><div class="section-bar" style="width:60%;height:14px;border-radius:4px;background:var(--card2)"></div></div><div class="poster-scroll no-scroll">'+Array(4).fill('<div class="skel-poster"><div class="skel-poster-thumb"></div></div>').join("")+'</div></div>').join("")}
    else if(cats.length===0)html+=`<div class="empty-state"><div class="empty-icon">${I.film}</div><div class="empty-title">${t("noChannels")}</div></div>`;
    else{
      cats.forEach(cat=>{
        const items=S.xtStreams.vod.filter(c=>c.category===cat.category_id);
        if(items.length===0)return;
        const arrow=isRTL()?I.arrowL:I.arrowR;
        html+=`<div class="folder-section">
          <div class="folder-header"><div class="section-bar"></div><h3>${esc(cat.category_name)}</h3><span class="section-count">(${items.length})</span>
          <button class="watch-all-btn" onclick="App.openFolder('vod','${cat.category_id}','${esc(cat.category_name)}')">${t("watchAll")} ${arrow}</button></div>
          <div class="poster-scroll no-scroll">${items.slice(0,20).map(c=>posterCardHTML(c)).join("")}</div></div>`;
      });
    }
  }
  html+=`</div>`;el.innerHTML=html;fixSearchIcon(el);
}

function renderSeriesTab(){
  const el=document.getElementById("tab-series");if(!el)return;
  if(!S.xtConnected){el.innerHTML=emptyNoXtream();return}
  let html=`<div style="padding:16px 0;max-width:1200px;margin:0 auto">
    <h2 style="font-size:17px;font-weight:800;margin-bottom:14px;padding:0 16px">${t("series")}</h2>
    <div style="padding:0 16px;margin-bottom:14px"><div class="search-wrap"><div class="search-wrap-inner" style="position:relative">${I.search}<input class="search-input" type="text" placeholder="${t("search")}" value="${esc(S.searchQ)}" oninput="App.onSearch(this.value)"></div></div></div>`;
  if(S.searchQ){
    const q=S.searchQ.toLowerCase();const filtered=S.xtStreams.series.filter(c=>(c.name||"").toLowerCase().includes(q));
    if(filtered.length===0)html+=`<div class="empty-state"><div class="empty-icon">${I.clap}</div><div class="empty-title">${t("noChannels")}</div></div>`;
    else html+=`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:0 16px">${filtered.slice(0,60).map(c=>posterCardHTML(c)).join("")}</div>`;
  }else{
    const cats=S.xtCats.series;
    if(S.xtLoading)html+=Array(3).fill('<div class="folder-section"><div class="folder-header"><div style="width:60%;height:14px;border-radius:4px;background:var(--card2)"></div></div><div class="poster-scroll no-scroll">'+Array(4).fill('<div class="skel-poster"><div class="skel-poster-thumb"></div></div>').join("")+'</div></div>').join("");
    else if(cats.length===0)html+=`<div class="empty-state"><div class="empty-icon">${I.clap}</div><div class="empty-title">${t("noChannels")}</div></div>`;
    else{
      cats.forEach(cat=>{
        const items=S.xtStreams.series.filter(c=>c.category===cat.category_id);
        if(items.length===0)return;
        const arrow=isRTL()?I.arrowL:I.arrowR;
        html+=`<div class="folder-section">
          <div class="folder-header"><div class="section-bar" style="background:linear-gradient(to bottom,#D53F8C,#B83280)"></div><h3>${esc(cat.category_name)}</h3><span class="section-count">(${items.length})</span>
          <button class="watch-all-btn" onclick="App.openFolder('series','${cat.category_id}','${esc(cat.category_name)}')">${t("watchAll")} ${arrow}</button></div>
          <div class="poster-scroll no-scroll">${items.slice(0,20).map(c=>posterCardHTML(c)).join("")}</div></div>`;
      });
    }
  }
  html+=`</div>`;el.innerHTML=html;fixSearchIcon(el);
}

function renderFavoritesTab(){
  const el=document.getElementById("tab-favorites");if(!el)return;
  const all=[...S.xtStreams.live,...S.xtStreams.vod,...S.xtStreams.series];
  const favs=all.filter(c=>S.favs.has(c.id));
  let html=`<div style="padding:16px;max-width:1200px;margin:0 auto">
    <h2 style="font-size:17px;font-weight:800;margin-bottom:14px">${t("favorites")}</h2>`;
  if(favs.length===0)html+=`<div class="empty-state"><div class="empty-icon">${I.heart}</div><div class="empty-title">${t("noFavs")}</div><div class="empty-sub">${t("noFavsSub")}</div></div>`;
  else{
    const isVod=favs[0]&&favs[0].type==="vod";
    html+=`<div class="${isVod?'poster-grid':'channel-grid'}" ${isVod?'style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px"':''}>${favs.map(c=>isVod?posterCardHTML(c):chCardHTML(c)).join("")}</div>`;
  }
  html+=`</div>`;el.innerHTML=html;
}

function renderHistoryTab(){
  const el=document.getElementById("tab-history");if(!el)return;
  let html=`<div style="padding:16px;max-width:800px;margin:0 auto">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <h2 style="font-size:17px;font-weight:800">${t("history")}</h2>
      ${S.history.length>0?`<button style="font-size:11px;color:var(--r);font-weight:600;display:flex;align-items:center;gap:4px" onclick="App.clearHistory()">${I.trash} ${t("clearHistory")}</button>`:""}
    </div>`;
  if(S.history.length===0)html+=`<div class="empty-state"><div class="empty-icon">${I.clock}</div><div class="empty-title">${t("noHistory")}</div><div class="empty-sub">${t("noHistorySub")}</div></div>`;
  else S.history.forEach(h=>{
    html+=`<div class="history-item" onclick="App.playById('${esc(h.id)}')">
      <div class="history-thumb">${h.logo?`<img src="${esc(h.logo)}" alt="" loading="lazy" onerror="this.parentElement.innerHTML='${I.tv}'">`:(h.type==="vod"||h.type==="series"?I.film:I.tv)}</div>
      <div class="history-info"><div class="history-name">${esc(h.name)}</div><div class="history-time">${timeAgo(h.ts)}</div></div>
      <div class="history-play">${I.play}</div></div>`;
  });
  html+=`</div>`;el.innerHTML=html;
}

function renderRecentTab(){
  const el=document.getElementById("tab-recent");if(!el)return;
  if(!S.xtConnected){el.innerHTML=emptyNoXtream();return}
  const all=[...S.xtStreams.vod.map(c=>({...c,_type:"vod"})),...S.xtStreams.series.map(c=>({...c,_type:"series"}))];
  all.sort((a,b)=>(parseInt(b.added)||0)-(parseInt(a.added)||0));
  const recent=all.filter(c=>c.added).slice(0,60);
  let html=`<div style="padding:16px 0;max-width:1200px;margin:0 auto">
    <h2 style="font-size:17px;font-weight:800;margin-bottom:14px;padding:0 16px">${t("recent")}</h2>`;
  if(recent.length===0)html+=`<div class="empty-state"><div class="empty-icon">${I.plus}</div><div class="empty-title">${t("noRecent")}</div></div>`;
  else html+=`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:0 16px">${recent.map(c=>posterCardHTML(c)).join("")}</div>`;
  html+=`</div>`;el.innerHTML=html;
}

// Folder detail (all items in a category)
function renderFolderDetail(type,catId,catName){
  const el=document.getElementById("tab-"+(type==="vod"?"movies":"series"));if(!el)return;
  const streams=type==="vod"?S.xtStreams.vod:S.xtStreams.series;
  let items=streams.filter(c=>String(c.category)===String(catId));
  if(S.searchQ){const q=S.searchQ.toLowerCase();items=items.filter(c=>(c.name||"").toLowerCase().includes(q))}
  const arrow=isRTL()?I.arrowR:I.arrowL;
  let html=`<div style="padding:16px;max-width:1200px;margin:0 auto">
    <button class="back-btn" onclick="App.switchTab('${type==="vod"?"movies":"series"}')">${arrow} ${type==="vod"?t("movies"):t("series")}</button>
    <h2 style="font-size:17px;font-weight:800;margin-bottom:14px">${esc(catName)} <span style="color:var(--muted);font-size:13px">(${items.length})</span></h2>
    <div style="margin-bottom:14px"><div class="search-wrap"><div class="search-wrap-inner" style="position:relative">${I.search}<input class="search-input" type="text" placeholder="${t("search")}" value="${esc(S.searchQ)}" oninput="App.onSearch(this.value)"></div></div></div>`;
  if(items.length>0)html+=`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">${items.map(c=>posterCardHTML(c)).join("")}</div>`;
  else html+=`<div class="empty-state"><div class="empty-icon">${I.tv}</div><div class="empty-title">${t("noChannels")}</div></div>`;
  html+=`</div>`;el.innerHTML=html;fixSearchIcon(el);
}

// Series detail (seasons/episodes)
async function renderSeriesDetail(seriesId){
  const el=document.getElementById("tab-series");
  const s=S.xtStreams.series.find(x=>x.seriesId==seriesId);if(!s||!el)return;
  const arrow=isRTL()?I.arrowR:I.arrowL;
  el.innerHTML=`<div style="padding:16px;max-width:800px;margin:0 auto">
    <button class="back-btn" onclick="App.switchTab('series')">${arrow} ${t("series")}</button>
    <div class="series-hero">
      <div class="series-cover">${s.logo?`<img src="${esc(s.logo)}" alt="" onerror="this.parentElement.innerHTML='${I.clap}'">`:I.clap}</div>
      <div class="series-info">
        <div class="series-title">${esc(s.name)}</div>
        <div class="series-meta-row">
          ${s.rating?`<span class="series-tag"><span style="color:#F59E0B;display:inline-flex">${I.star} ${esc(s.rating)}</span></span>`:""}
          ${s.year?`<span class="series-tag">${esc(s.year)}</span>`:""}
          ${s.genre?`<span class="series-tag">${esc(s.genre)}</span>`:""}
        </div>
        ${s.description?`<p class="series-desc">${esc(s.description)}</p>`:""}
      </div>
    </div>
    <div id="series-episodes"><div class="empty-state"><div class="empty-icon">${I.loader}</div></div></div>
  </div>`;
  const data=await xtSeriesInfo(seriesId);
  const epEl=document.getElementById("series-episodes");if(!epEl)return;
  if(!data||!data.episodes){epEl.innerHTML=`<div class="empty-state"><div class="empty-icon">${I.clap}</div><div class="empty-title">${t("noChannels")}</div></div>`;return}
  const b=xtBase(),u=encodeURIComponent(S.xtConfig.user),p=encodeURIComponent(S.xtConfig.pass);
  const seasons=data.episodes;let html="";
  if(typeof seasons==="object"){
    Object.keys(seasons).sort((a,b2)=>parseInt(a)-parseInt(b2)).forEach(sn=>{
      const eps=seasons[sn];if(!Array.isArray(eps))return;
      html+=`<div style="margin-bottom:20px"><div class="section-header"><div class="section-bar" style="background:linear-gradient(to bottom,#D53F8C,#B83280)"></div><h3>${t("season")} ${esc(sn)}</h3><span class="section-count">(${eps.length} ${t("episodes")})</span></div><div class="episode-list">`;
      eps.forEach(ep=>{
        const epId=ep.id;const epExt=ep.container_extension||"mp4";
        const epUrl=`${b}/series/${u}/${p}/${epId}.${epExt}`;
        const epM3u8=`${b}/series/${u}/${p}/${epId}.m3u8`;
        const epTs=`${b}/series/${u}/${p}/${epId}.ts`;
        const epName=ep.title||`${t("episode")} ${ep.episode_num||""}`;
        html+=`<div class="episode-card" onclick="App.playDirect('${esc(epUrl)}','${esc(epName)}','${esc(s.logo||"")}','series','${esc(epM3u8)}','${esc(epTs)}')">
          <div class="episode-play">${I.play}</div>
          <div class="episode-details"><div class="episode-name">${esc(epName)}</div>
          <div class="episode-meta">${ep.info&&ep.info.duration?`<span>${esc(ep.info.duration)} min</span>`:""}${ep.info&&ep.info.container_extension?`<span>${esc(ep.info.container_extension).toUpperCase()}</span>`:""}</div></div></div>`;
      });
      html+=`</div></div>`;
    });
  }
  if(!html)html=`<div class="empty-state"><div class="empty-icon">${I.clap}</div><div class="empty-title">${t("noChannels")}</div></div>`;
  epEl.innerHTML=html;
}

// ── CARD HTML GENERATORS ────────────────────────────────────────────
function chCardHTML(c){
  const isFav=S.favs.has(c.id);const favI=isFav?I.heartF:I.heart;const favC=isFav?"active":"";
  return`<div class="ch-card"><div class="ch-thumb" onclick="App.play('${esc(c.id)}')">
    ${c.logo?`<img src="${esc(c.logo)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="ch-thumb-icon" style="display:none">${I.tv}</div>`:`<div class="ch-thumb-icon">${I.tv}</div>`}
    <div class="ch-live-badge"><span class="ch-live-dot"></span>LIVE</div>
    <div class="ch-play-overlay" onclick="App.play('${esc(c.id)}')"><div class="ch-play-btn">${I.play}</div></div></div>
    <div class="ch-info"><div class="ch-name">${esc(c.name)}</div>
    <button class="ch-fav-btn ${favC}" onclick="event.stopPropagation();App.toggleFav('${esc(c.id)}')">${favI}</button></div></div>`;
}

function posterCardHTML(c){
  const isFav=S.favs.has(c.id);const favI=isFav?I.heartF:I.heart;const favC=isFav?"active":"";
  const isSeries=c.type==="series";
  const action=isSeries?`App.openSeries(${c.seriesId})`:`App.play('${esc(c.id)}')`;
  return`<div class="poster-card" onclick="${action}">
    <div class="poster-thumb">
      ${c.logo?`<img src="${esc(c.logo)}" alt="" loading="lazy" onerror="this.style.display='none'">`:""}
      <div class="poster-overlay"><div class="poster-play-btn">${isSeries?I.info:I.play}</div></div>
      <button class="poster-fav ${favC}" onclick="event.stopPropagation();App.toggleFav('${esc(c.id)}')">${favI}</button></div>
    <div class="poster-info"><span class="poster-title">${esc(c.name)}</span>
    <div class="poster-meta">${c.rating?`<span class="poster-rating">${I.star} ${esc(c.rating)}</span>`:""}${c.year?`<span>${esc(c.year)}</span>`:""}</div></div></div>`;
}

// ── SETTINGS ────────────────────────────────────────────────────────
function renderSettings(){
  const el=document.getElementById("settings-panel");if(!el)return;
  const xc=S.xtConfig;
  let statusHTML="";
  if(S.xtConnected&&S.xtInfo){
    const info=S.xtInfo;const sc=info.status==="Active"?"var(--g)":"var(--r)";
    const st=info.status==="Active"?t("active"):t("expired");
    const exp=info.exp_date?new Date(parseInt(info.exp_date)*1000).toLocaleDateString(isRTL()?"ar-EG":"en-US"):"—";
    statusHTML=`<div class="xt-status connected">${I.wifi}<span>${t("connected")}</span></div>
    <div class="xt-server-info">
      <div class="sp-row"><span class="sp-label">${t("status")}</span><span class="sp-value" style="color:${sc}">${esc(st)}</span></div>
      <div class="sp-row"><span class="sp-label">${t("expiry")}</span><span class="sp-value">${exp}</span></div>
      ${info.max_connections?`<div class="sp-row"><span class="sp-label">${t("maxConn")}</span><span class="sp-value">${info.max_connections}</span></div>`:""}
    </div>
    <button class="xt-disconnect-btn" onclick="App.xtDisconnect()">${I.wifiOff} ${t("disconnect")}</button>`;
  }else if(S.xtConnecting){
    statusHTML=`<div class="xt-status loading">${I.loader}<span>${t("connecting")}</span></div>`;
  }
  el.innerHTML=`
    <div class="sp-header"><h2>${t("settings")}</h2><button class="sp-close" onclick="App.closeSettings()">${I.x}</button></div>
    <div class="sp-section">
      <div class="sp-title"><span style="color:#7B2FFF">${I.wifi}</span> ${t("xtreamCodes")}</div>
      ${statusHTML}
      <div style="${S.xtConnected?'display:none':''}">
        <div class="xt-input-group"><label class="xt-label">${t("xtreamUrl")}</label><input id="xt-url" class="xt-input" type="url" placeholder="${t("xtreamUrlPh")}" value="${esc(xc.url)}"></div>
        <div class="xt-input-group"><label class="xt-label">${t("xtreamUser")}</label><input id="xt-user" class="xt-input" type="text" placeholder="${t("xtreamUserPh")}" value="${esc(xc.user)}" autocomplete="username"></div>
        <div class="xt-input-group"><label class="xt-label">${t("xtreamPass")}</label><input id="xt-pass" class="xt-input" type="password" placeholder="${t("xtreamPassPh")}" value="${esc(xc.pass)}" autocomplete="current-password"></div>
        <button class="xt-connect-btn" onclick="App.xtLogin()">${I.wifi} ${t("connect")}</button>
      </div>
    </div>
    <div class="sp-section">
      <div class="sp-title"><span style="color:#3D8EFF">${I.globe}</span> ${t("language")}</div>
      <div class="lang-switcher">
        <button class="lang-opt ${S.locale==="ar"?"active":""}" onclick="App.setLang('ar')">${t("arabic")}</button>
        <button class="lang-opt ${S.locale==="en"?"active":""}" onclick="App.setLang('en')">${t("english")}</button>
      </div>
    </div>
    <div class="sp-section">
      <div class="sp-title"><span style="color:#F59E0B">${I.star}</span> ${t("about")}</div>
      <div class="dev-card"><div class="dev-avatar">م</div><div>
        <div class="dev-name">${t("devName")}</div><div class="dev-role">${t("devRole")}</div>
        <a href="https://www.facebook.com/en.mohamed.nasr" target="_blank" rel="noopener" class="dev-link">${I.facebook} ${t("followUs")}</a>
      </div></div>
    </div>
    <div class="sp-footer"><p>${t("developer")}</p><p>v2.0.0 — © 2025 hammadshow</p></div>`;
}

// ── PLAYER ──────────────────────────────────────────────────────────
function showPlayer(ch){
  S.current=ch;S.playerOpen=true;
  const overlay=document.getElementById("player-overlay");
  const video=document.getElementById("player-video");
  document.getElementById("pc-title").textContent=ch.name||"";
  overlay.classList.add("show");
  playStream(ch.url,video,ch);
  addHistory(ch);
  setupPlayerEvents(video);
  showControls();
}

function hidePlayer(){
  const v=document.getElementById("player-video");
  const miniV=document.getElementById("mini-video");
  destroyHls();
  // If video was playing, switch to mini player
  if(v&&v.currentTime>0&&!v.paused&&v.src){
    miniV.src=v.src;miniV.play().catch(()=>{});
    document.getElementById("mini-title").textContent=S.current?S.current.name:"";
    document.getElementById("mini-player").style.display="flex";
  }else{
    if(miniV){miniV.pause();miniV.src=""}
    document.getElementById("mini-player").style.display="none";
  }
  v.pause();v.src="";S.playerOpen=false;S.current=null;
  document.getElementById("player-overlay").classList.remove("show");
  clearTimeout(S.controlsTimer);
}

function expandPlayer(){
  if(!S.current)return;
  const miniV=document.getElementById("mini-video");
  document.getElementById("mini-player").style.display="none";
  miniV.pause();miniV.src="";
  showPlayer(S.current);
}

function setupPlayerEvents(video){
  // Remove old listeners by replacing
  const nv=video.cloneNode(true);video.parentNode.replaceChild(nv,video);
  const v=nv;
  v.addEventListener("timeupdate",updateSeekBar);
  v.addEventListener("progress",updateBuffer);
  v.addEventListener("play",()=>{document.getElementById("pc-play-toggle").innerHTML=I.pause;document.getElementById("pc-play-btn").innerHTML=I.pause});
  v.addEventListener("pause",()=>{document.getElementById("pc-play-toggle").innerHTML=I.play;document.getElementById("pc-play-btn").innerHTML=I.play});
  v.addEventListener("ended",hidePlayer);
  // Tap to show/hide controls
  v.addEventListener("click",()=>{if(S.controlsVisible)hideControls();else showControls()});
  // Double tap to seek
  let lastTap=0;
  v.addEventListener("touchend",(e)=>{
    const now=Date.now();if(now-lastTap<300){
      const rect=v.getBoundingClientRect();const x=e.changedTouches[0].clientX-rect.left;
      if(x<rect.width/3)seekRel(-10);else if(x>rect.width*2/3)seekRel(10);
    }lastTap=now;
  });
  showControls();
}

function showControls(){
  S.controlsVisible=true;
  document.getElementById("player-controls").classList.add("visible");
  clearTimeout(S.controlsTimer);
  S.controlsTimer=setTimeout(hideControls,3500);
}
function hideControls(){S.controlsVisible=false;document.getElementById("player-controls").classList.remove("visible");clearTimeout(S.controlsTimer)}
function updateSeekBar(){
  const v=document.getElementById("player-video");if(!v||!v.duration)return;
  const pct=(v.currentTime/v.duration)*100;
  document.getElementById("pc-progress").style.width=pct+"%";
  document.getElementById("pc-thumb").style.insetInlineStart=`calc(${pct}% - 7px)`;
  document.getElementById("pc-current").textContent=formatTime(v.currentTime);
  document.getElementById("pc-duration").textContent=formatTime(v.duration);
}
function updateBuffer(){
  const v=document.getElementById("player-video");if(!v||!v.buffered.length)return;
  const end=v.buffered.end(v.buffered.length-1);const pct=(end/v.duration)*100;
  document.getElementById("pc-buffered").style.width=pct+"%";
}
function seekTo(e){
  const bar=document.getElementById("pc-seek-bar");const v=document.getElementById("player-video");if(!v||!v.duration)return;
  const rect=bar.getBoundingClientRect();const x=(isRTL()?rect.right-e.clientX:e.clientX-rect.left)/rect.width;
  v.currentTime=Math.max(0,Math.min(x*v.duration,v.duration));showControls();
}
function seekRel(sec){
  const v=document.getElementById("player-video");if(!v)return;
  v.currentTime=Math.max(0,Math.min(v.currentTime+sec,v.duration||0));
  const ind=document.getElementById("seek-indicator");
  const txt=document.getElementById("seek-indicator-text");
  if(sec>0){ind.querySelector("svg").style.transform="scaleX(-1)";txt.textContent="+"+sec+"s"}
  else{ind.querySelector("svg").style.transform="";txt.textContent=sec+"s"}
  // Position
  const isLeft=sec<0;
  ind.style.cssText=`position:absolute;top:50%;${isLeft?"left":"right"}:15%;transform:translateY(-50%);background:rgba(0,0,0,.6);backdrop-filter:blur(10px);border-radius:50%;width:56px;height:56px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;z-index:5;opacity:1;pointer-events:none`;
  ind.querySelector("svg").style.cssText=`width:20px;height:20px;color:#fff`;
  setTimeout(()=>{ind.style.opacity="0"},600);
  showControls();
}
function togglePlayPause(){
  const v=document.getElementById("player-video");if(!v)return;
  if(v.paused)v.play().catch(()=>{});else v.pause();showControls();
}
function takeScreenshot(){
  const v=document.getElementById("player-video");if(!v)return;
  const c=document.getElementById("screenshot-canvas");c.width=v.videoWidth||640;c.height=v.videoHeight||360;
  c.getContext("2d").drawImage(v,0,0,c.width,c.height);
  c.toBlob(blob=>{const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="hammadshot_"+Date.now()+".png";a.click();URL.revokeObjectURL(url)},  "image/png");
}
function togglePiP(){
  const v=document.getElementById("player-video");if(!v)return;
  if(document.pictureInPictureElement){document.exitPictureInPicture().catch(()=>{})}
  else if(v.requestPictureInPicture){v.requestPictureInPicture().catch(()=>{})}
}
function toggleFullscreen(){
  const el=document.getElementById("player-container");
  if(!document.fullscreenElement)el.requestFullscreen().catch(()=>{});
  else document.exitFullscreen().catch(()=>{});
}

// ── UTILITIES ───────────────────────────────────────────────────────
function emptyNoXtream(){return`<div style="padding:16px"><div class="empty-state"><div class="empty-icon">${I.wifiOff}</div><div class="empty-title">${t("noChannels")}</div><div class="empty-sub">${t("noHistorySub")}</div></div></div>`}
function fixSearchIcon(el){const si=el.querySelector(".search-wrap-inner");if(!si)return;const svg=si.querySelector("svg");if(!svg)return;if(isRTL())svg.style.cssText="position:absolute;top:50%;transform:translateY(-50%);width:15px;height:15px;color:var(--muted);right:12px;pointer-events:none";else svg.style.cssText="position:absolute;top:50%;transform:translateY(-50%);width:15px;height:15px;color:var(--muted);left:12px;pointer-events:none"}

function renderAll(){renderNavLabels();renderLiveTab();renderMoviesTab();renderSeriesTab();renderFavoritesTab();renderHistoryTab();renderRecentTab();renderSettings()}

function switchTab(tab){
  S.activeTab=tab;S.selectedCat=null;S.searchQ="";
  document.querySelectorAll(".tab").forEach(el=>el.classList.remove("active"));
  const tabEl=document.getElementById("tab-"+tab);if(tabEl)tabEl.classList.add("active");
  document.querySelectorAll(".nav-item").forEach(el=>el.classList.toggle("active",el.dataset.tab===tab));
  document.getElementById("main-content").scrollTop=0;
  if(tab==="live")renderLiveTab();
  else if(tab==="movies")renderMoviesTab();
  else if(tab==="series")renderSeriesTab();
  else if(tab==="favorites")renderFavoritesTab();
  else if(tab==="history")renderHistoryTab();
  else if(tab==="recent")renderRecentTab();
}

// ── APP API ─────────────────────────────────────────────────────────
window.App={
  _lang:S.locale,
  switchTab,
  onSearch(q){S.searchQ=q;const tab=S.activeTab;if(tab==="live")renderLiveTab();else if(tab==="movies")renderMoviesTab();else if(tab==="series")renderSeriesTab()},
  selectCat(id){S.selectedCat=id;renderLiveTab()},
  play(id){
    let ch=[...S.xtStreams.live,...S.xtStreams.vod,...S.xtStreams.series].find(c=>c.id===id);
    if(ch)showPlayer(ch);
  },
  playById(id){
    let ch=[...S.xtStreams.live,...S.xtStreams.vod,...S.xtStreams.series].find(c=>c.id===id);
    if(ch)showPlayer(ch);
  },
  playDirect(url,name,logo,type,m3u8Url,tsUrl){
    showPlayer({id:"direct_"+Date.now(),name,logo:logo||"",url,type:type||"direct",urlM3u8:m3u8Url||null,urlTs:tsUrl||null,description:""});
  },
  openSeries(sid){renderSeriesDetail(sid)},
  openFolder(type,catId,catName){renderFolderDetail(type,catId,catName)},
  toggleFav(id){if(S.favs.has(id))S.favs.delete(id);else S.favs.add(id);saveFavs();renderAll()},
  closePlayer(){hidePlayer()},
  expandPlayer,
  togglePlayPause,seekTo,seekRelative:seekRel,takeScreenshot,togglePiP,toggleFullscreen,showControls,
  clearHistory(){S.history=[];saveHistory();renderHistoryTab()},
  setLang(lang){
    S.locale=lang;this._lang=lang;
    localStorage.setItem("hs-locale",lang);
    document.documentElement.dir=isRTL()?"rtl":"ltr";document.documentElement.lang=lang;
    const ll=document.getElementById("lang-label");if(ll)ll.textContent=lang==="ar"?"EN":"عربي";
    renderAll();
  },
  openSettings(){S.settingsOpen=true;document.getElementById("settings-overlay").classList.add("show")},
  closeSettings(){S.settingsOpen=false;document.getElementById("settings-overlay").classList.remove("show")},
  async xtLogin(){
    const url=document.getElementById("xt-url").value.trim();
    const user=document.getElementById("xt-user").value.trim();
    const pass=document.getElementById("xt-pass").value.trim();
    S.xtConfig={url,user,pass};
    const ok=await xtLogin();
    if(!ok){
      const btn=document.querySelector(".xt-connect-btn");
      if(btn){btn.style.background="var(--r)";btn.innerHTML=I.x+" "+t("error");setTimeout(()=>{btn.style.background="";btn.innerHTML=I.wifi+" "+t("connect")},3000)}
    }
  },
  xtDisconnect(){xtDisconnect();renderSettings()},
};

// ── INIT ────────────────────────────────────────────────────────────
async function init(){
  S.locale=localStorage.getItem("hs-locale")||"ar";
  document.documentElement.dir=isRTL()?"rtl":"ltr";document.documentElement.lang=S.locale;
  loadFavs();loadHistory();
  S.xtConfig=load("xtc",{url:"",user:"",pass:""});
  renderAll();
  if(S.xtConfig.url&&S.xtConfig.user&&S.xtConfig.pass)await xtLogin();
  if("serviceWorker"in navigator)try{await navigator.serviceWorker.register("./sw.js")}catch(e){}
}
init();