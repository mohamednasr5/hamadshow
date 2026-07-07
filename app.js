/* ═══════════════════════════════════════════════════════════════════════
   hammadshow v3 — Xtream Only + Firebase Config + Instant Play
   من برمجة وتطوير المهندس محمد حماد
   ═══════════════════════════════════════════════════════════════════════ */

// ── FIREBASE ───────────────────────────────────────────────────────
const FIREBASE_CONFIG={apiKey:"AIzaSyAfImJ7x3pe0GYSrl7hDz_sMb_GarcpJ9E",authDomain:"nasr-live.firebaseapp.com",databaseURL:"https://nasr-live-default-rtdb.firebaseio.com",projectId:"nasr-live",storageBucket:"nasr-live.firebasestorage.app",messagingSenderId:"215945991656",appId:"1:215945991656:web:41ea1faa18496ff86cc05d"};
firebase.initializeApp(FIREBASE_CONFIG);
const fbDb=firebase.database();
function getDeviceId(){let id=localStorage.getItem("hs-device-id");if(!id){id="d_"+Date.now()+"_"+Math.random().toString(36).substr(2,9);localStorage.setItem("hs-device-id",id)}return id}
function fbConfigRef(){return fbDb.ref("devices/"+getDeviceId()+"/config")}
async function fbSaveConfig(c){try{await fbConfigRef().set(c)}catch(e){console.warn("[FB] save err:",e)}}
async function fbLoadConfig(){try{const s=await fbConfigRef().once("value");return s.val()}catch(e){return null}}

// ── TRANSLATIONS ─────────────────────────────────────────────────────
const i18n={
ar:{
  live:"بث مباشر",movies:"أفلام",series:"مسلسلات",favorites:"المفضلة",
  history:"المشاهدات",recent:"مضاف حديث",search:"بحث...",
  noChannels:"لا توجد قنوات",noFavs:"لا توجد عناصر في المفضلة",
  noFavsSub:"أضف عناصرك المفضلة",noHistory:"لا يوجد سجل مشاهدات",
  noHistorySub:"ستظهر هنا القنوات والمقاطع التي تشاهدها",
  noRecent:"لا يوجد محتوى مضاف حديثاً",
  watchAll:"عرض الكل",channels:"قنوات",
  allChannels:"جميع القنوات",episode:"الحلقة",season:"الموسم",
  episodes:"حلقات",back:"رجوع",
  settings:"الإعدادات",arabic:"العربية",english:"English",
  noServer:"لا يوجد سيرفر متصل",noServerSub:"اضغط على الإعدادات لإدخال بيانات السيرفر",
  clearHistory:"مسح السجل",minsAgo:"منذ دقيقة",
  y:"أمس",daysAgo:"يوم",tapUnmute:"اضغط للصوت",
},
en:{
  live:"Live TV",movies:"Movies",series:"Series",favorites:"Favorites",
  history:"Watched",recent:"Recently Added",search:"Search...",
  noChannels:"No channels available",noFavs:"No favorites yet",
  noFavsSub:"Add your favorite items",noHistory:"No watch history",
  noHistorySub:"Channels and videos you watch will appear here",
  noRecent:"No recently added content",
  watchAll:"View All",channels:"channels",
  allChannels:"All Channels",episode:"Episode",season:"Season",
  episodes:"Episodes",back:"Back",
  settings:"Settings",arabic:"العربية",english:"English",
  noServer:"No server connected",noServerSub:"Tap settings to enter server details",
  clearHistory:"Clear History",minsAgo:"min ago",
  y:"Yesterday",daysAgo:"days ago",tapUnmute:"Tap to unmute",
}};

// ── SVG ICONS ───────────────────────────────────────────────────────
const I={
  tv:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="15" x="2" y="7" rx="2"/><polyline points="17 2 12 7 7 2"/></svg>`,
  film:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>`,
  clap:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z"/><path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/></svg>`,
  heart:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
  heartF:`<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
  clock:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  plus:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
  play:`<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
  pause:`<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>`,
  arrowL:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>`,
  arrowR:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 19 7-7-7-7"/><path d="M5 12h14"/></svg>`,
  star:`<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  search:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
  wifi:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>`,
  wifiOff:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>`,
  loader:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`,
  info:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
  trash:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`,
};

// ── STATE ───────────────────────────────────────────────────────────
const S={
  _ready:false,
  locale:"ar",activeTab:"live",selectedCat:null,searchQ:"",
  xtConfig:{url:"",user:"",pass:""},xtConnected:false,xtConnecting:false,
  xtInfo:null,xtServerInfo:null,
  xtCats:{live:[],vod:[],series:[]},xtStreams:{live:[],vod:[],series:[]},
  xtLoading:false,
  favs:new Set(),history:[],maxHistory:50,
  current:null,playerOpen:false,
  controlsTimer:null,controlsVisible:false,
  hlsInst:null,isMuted:false,
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
function addHistory(item){S.history=S.history.filter(h=>h.id!==item.id);S.history.unshift({id:item.id,name:item.name,logo:item.logo||"",type:item.type,url:item.url,urlTs:item.urlTs||"",ts:Date.now()});if(S.history.length>S.maxHistory)S.history=S.history.slice(0,S.maxHistory);saveHistory()}
function timeAgo(ts){const d=Date.now()-ts,m=Math.floor(d/60000),h=Math.floor(d/3600000),dy=Math.floor(d/86400000);if(m<1)return" ";if(m<60)return m+" "+t("minsAgo");if(h<24)return t("y");if(dy<7)return dy+" "+t("daysAgo");return new Date(ts).toLocaleDateString(isRTL()?"ar-EG":"en-US")}
function formatTime(s){if(isNaN(s)||!isFinite(s))return"0:00";const m=Math.floor(s/60),sec=Math.floor(s%60);return m+":"+(sec<10?"0":"")+sec}

// ── XTREAM API ──────────────────────────────────────────────────────
function xtBase(){let u=S.xtConfig.url.trim().replace(/\/+$/,"");if(!u.startsWith("http"))u="http://"+u;return u}
function proxied(url){
  const px=(S.xtConfig.proxy||"").trim().replace(/\/+$/,"");
  if(!px)return url;
  return `${px}?u=${encodeURIComponent(url)}`;
}
async function xtFetch(action){
  const b=xtBase(),u=encodeURIComponent(S.xtConfig.user),p=encodeURIComponent(S.xtConfig.pass);
  let ep=`${b}/player_api.php?username=${u}&password=${p}`;if(action)ep+=`&action=${action}`;
  const r=await fetch(ep);if(!r.ok)throw new Error(r.status);return r.json();
}
async function xtLogin(){
  if(!S.xtConfig.url||!S.xtConfig.user||!S.xtConfig.pass)return false;
  S.xtConnecting=true;S.xtConnected=false;renderAll();
  try{
    const data=await xtFetch();
    if(!data.user_info||data.user_info.auth!==1){S.xtConnecting=false;S.xtConnected=false;renderAll();return false}
    S.xtInfo=data.user_info;S.xtServerInfo=data.server_info||null;S.xtConnected=true;S.xtConnecting=false;
    const[lC,vC,sC]=await Promise.all([xtFetch("get_live_categories").catch(()=>[]),xtFetch("get_vod_categories").catch(()=>[]),xtFetch("get_series_categories").catch(()=>[])]);
    S.xtCats.live=(Array.isArray(lC)?lC:[]).map(c=>({...c,id:String(c.category_id),name:c.category_name}));
    S.xtCats.vod=(Array.isArray(vC)?vC:[]).map(c=>({...c,id:String(c.category_id),name:c.category_name}));
    S.xtCats.series=(Array.isArray(sC)?sC:[]).map(c=>({...c,id:String(c.category_id),name:c.category_name}));
    const[lS,vS,sS]=await Promise.all([xtFetch("get_live_streams").catch(()=>[]),xtFetch("get_vod_streams").catch(()=>[]),xtFetch("get_series").catch(()=>[])]);
    const b=xtBase(),u=encodeURIComponent(S.xtConfig.user),p=encodeURIComponent(S.xtConfig.pass);
    S.xtStreams.live=(Array.isArray(lS)?lS:[]).map(s=>({...s,id:"xl_"+s.stream_id,name:s.name||"",logo:s.stream_icon||"",category:String(s.category_id),type:"live",url:proxied(`${b}/live/${u}/${p}/${s.stream_id}.m3u8`),urlTs:proxied(`${b}/live/${u}/${p}/${s.stream_id}.ts`),description:""}));
    S.xtStreams.vod=(Array.isArray(vS)?vS:[]).map(s=>{const ext=s.container_extension||"mp4";const sid=s.stream_id;return{...s,id:"xv_"+sid,name:s.name||"",logo:s.stream_icon||"",category:String(s.category_id),type:"vod",url:proxied(`${b}/movie/${u}/${p}/${sid}.${ext}`),urlM3u8:proxied(`${b}/movie/${u}/${p}/${sid}.m3u8`),urlTs:proxied(`${b}/movie/${u}/${p}/${sid}.ts`),description:s.plot||"",rating:s.rating||"",year:s.year||"",genre:s.genre||"",added:s.added||""}});
    S.xtStreams.series=(Array.isArray(sS)?sS:[]).map(s=>({...s,id:"xs_"+s.series_id,name:s.name||"",logo:s.cover||"",category:String(s.category_id),type:"series",seriesId:s.series_id,description:s.plot||"",rating:s.rating||"",year:s.releaseDate||"",genre:s.genre||"",cast:s.cast||"",added:s.added||""}));
    S.xtLoading=false;renderAll();return true;
  }catch(e){console.error(e);S.xtLoading=false;S.xtConnecting=false;S.xtConnected=false;renderAll();return false}
}
async function xtSeriesInfo(sid){try{return await xtFetch("get_series_info&series_id="+sid)}catch(e){return null}}

// ── PLAYER ENGINE ───────────────────────────────────────────────────
function destroyHls(){if(S.hlsInst){S.hlsInst.destroy();S.hlsInst=null}}

// If our page is https but a stream url is plain http (or vice versa),
// try swapping scheme/port once before giving up — fixes many
// mixed-content / misconfigured-panel playback failures automatically.
function altScheme(u){
  try{
    const orig=new URL(u,location.href);
    const si=S.xtServerInfo;
    if(location.protocol==="https:"&&orig.protocol==="http:"){
      const alt=new URL(u);alt.protocol="https:";
      if(si&&si.https_port)alt.port=si.https_port;
      return alt.toString();
    }
  }catch(e){}
  return null;
}

function playStream(url,video,item,isRetry){
  destroyHls();
  hidePlayerError();
  video.removeAttribute('src');video.load();
  video.muted=false;S.isMuted=false;
  document.getElementById("mute-hint").style.display="none";

  const m3u8Url=(item&&item.urlM3u8)?item.urlM3u8:null;
  const tsUrl=(item&&item.urlTs)?item.urlTs:null;
  const isVod=(item&&item.type==="vod")||(item&&item.type==="series")||(item&&item.type==="direct");
  let primaryUrl=url;
  if(isVod&&m3u8Url)primaryUrl=m3u8Url;

  if(primaryUrl.includes('.m3u8')||primaryUrl.includes('m3u8')){
    if(typeof Hls!=="undefined"&&Hls.isSupported()){
      const h=new Hls({enableWorker:true,lowLatencyMode:false,maxBufferLength:30,maxMaxBufferLength:120,fragLoadingTimeOut:20000,manifestLoadingTimeOut:15000,levelLoadingTimeOut:15000});
      S.hlsInst=h;
      h.loadSource(primaryUrl);h.attachMedia(video);
      h.on(Hls.Events.MANIFEST_PARSED,()=>{autoplayVideo(video)});
      h.on(Hls.Events.ERROR,(ev,d)=>{
        if(d.fatal){
          console.warn('[H+] HLS fatal:',d.type,d.details);
          destroyHls();
          handlePlaybackFailure(url,video,item,isRetry);
        }
      });
    }else if(video.canPlayType('application/vnd.apple.mpegurl')){
      video.src=primaryUrl;
      video.addEventListener('loadeddata',()=>autoplayVideo(video),{once:true});
      video.addEventListener('error',()=>handlePlaybackFailure(url,video,item,isRetry),{once:true});
    }else{tryDirectPlay(url,video,tsUrl,item,isRetry)}
  }else{tryDirectPlay(url,video,tsUrl,item,isRetry)}
}

function handlePlaybackFailure(originalUrl,video,item,isRetry){
  // The video node gets replaced (cloneNode) right after each playStream()
  // call to strip old listeners, so always grab the *current* live element
  // rather than reusing a possibly-orphaned reference from a closure.
  const liveVideo=document.getElementById("player-video")||video;
  if(!isRetry){
    const alt=altScheme(originalUrl);
    if(alt&&alt!==originalUrl){
      console.warn('[H+] retrying with alternate scheme:',alt);
      const altItem=item?{...item,urlM3u8:item.urlM3u8?altScheme(item.urlM3u8)||item.urlM3u8:item.urlM3u8,urlTs:item.urlTs?altScheme(item.urlTs)||item.urlTs:item.urlTs}:item;
      playStream(alt,liveVideo,altItem,true);
      return;
    }
  }
  showPlayerError();
}

function autoplayVideo(video){
  video.play().then(()=>{
    // Played with sound - great!
  }).catch(()=>{
    // Autoplay blocked - mute and play
    video.muted=true;S.isMuted=true;
    video.play().then(()=>{
      document.getElementById("mute-hint").style.display="flex";
    }).catch(()=>{});
  });
}

function tryDirectPlay(url,video,tsUrl,item,isRetry){
  destroyHls();
  let triedTs=false;
  video.onerror=function(){
    if(tsUrl&&!triedTs){triedTs=true;video.onerror=null;video.src=tsUrl;autoplayVideo(video);
      video.addEventListener('error',()=>handlePlaybackFailure(url,video,item,isRetry),{once:true});
      return;
    }
    console.warn('[H+] Direct play failed');
    handlePlaybackFailure(url,video,item,isRetry);
  };
  video.src=url;autoplayVideo(video);
}

function showPlayerError(){
  const el=document.getElementById("player-error");if(!el)return;
  el.style.display="flex";
}
function hidePlayerError(){
  const el=document.getElementById("player-error");if(!el)return;
  el.style.display="none";
}
function retryPlayback(){
  if(!S.current)return;
  const video=document.getElementById("player-video");
  hidePlayerError();
  playStream(S.current.url,video,S.current,false);
}

// ── RENDERING ───────────────────────────────────────────────────────
function renderNavLabels(){document.querySelectorAll(".nav-label").forEach(el=>{const tb=el.dataset.tab;if(tb)el.textContent=t(tb)})}

function noServerHTML(){return`<div style="padding:40px 20px;text-align:center"><div style="width:60px;height:60px;border-radius:50%;background:var(--surface);display:flex;align-items:center;justify-content:center;margin:0 auto 16px">${I.wifiOff}</div><div style="font-size:16px;font-weight:700;margin-bottom:6px">${t("noServer")}</div><div style="font-size:13px;color:var(--sub);margin-bottom:20px">${t("noServerSub")}</div><button onclick="window.location.href='./setup.html'" style="padding:10px 24px;border-radius:12px;background:var(--grad);color:#fff;font-size:14px;font-weight:700;display:inline-flex;align-items:center;gap:8px">${I.wifi} ${t("settings")}</button></div>`}

function renderLiveTab(){
  const el=document.getElementById("tab-live");if(!el)return;
  if(!S.xtConnected){el.innerHTML=noServerHTML();return}
  let html=`<div style="padding:16px;max-width:1200px;margin:0 auto">
    <div class="hero-grid">
      <div class="hero-card hc-live" onclick="App.switchTab('live')"><div class="hero-icon">${I.tv}</div><div class="hero-label">${t("live")}</div><div class="hero-sub">${S.xtStreams.live.length} ${t("channels")}</div></div>
      <div class="hero-card hc-movies" onclick="App.switchTab('movies')"><div class="hero-icon">${I.film}</div><div class="hero-label">${t("movies")}</div><div class="hero-sub">${S.xtStreams.vod.length}</div></div>
      <div class="hero-card hc-series" onclick="App.switchTab('series')"><div class="hero-icon">${I.clap}</div><div class="hero-label">${t("series")}</div><div class="hero-sub">${S.xtStreams.series.length}</div></div>
      <div class="hero-card hc-recent" onclick="App.switchTab('recent')"><div class="hero-icon">${I.plus}</div><div class="hero-label">${t("recent")}</div></div>
    </div>
    <div class="search-wrap"><div class="search-wrap-inner" style="position:relative">${I.search}<input class="search-input" type="text" placeholder="${t("search")}" value="${esc(S.searchQ)}" oninput="App.onSearch(this.value)"></div></div>`;
  const cats=S.xtCats.live;
  if(cats.length>0&&!S.searchQ){
    html+=`<div style="display:flex;gap:7px;overflow-x:auto;padding-bottom:8px;margin-bottom:16px" class="no-scroll">`;
    html+=`<button class="cat-pill-quick ${!S.selectedCat?'cpq-active':''}" onclick="App.selectCat(null)" style="flex-shrink:0;padding:7px 14px;border-radius:20px;background:${!S.selectedCat?'var(--grad)':'rgba(255,255,255,.04)'};border:1px solid ${!S.selectedCat?'transparent':'rgba(255,255,255,.06)'};color:${!S.selectedCat?'#fff':'var(--sub)'};font-size:12px;font-weight:600;white-space:nowrap">${t("allChannels")}</button>`;
    cats.slice(0,20).forEach(c=>{html+=`<button class="cat-pill-quick ${S.selectedCat===c.id?'cpq-active':''}" onclick="App.selectCat('${c.id}')" style="flex-shrink:0;padding:7px 14px;border-radius:20px;background:${S.selectedCat===c.id?'var(--grad)':'rgba(255,255,255,.04)'};border:1px solid ${S.selectedCat===c.id?'transparent':'rgba(255,255,255,.06)'};color:${S.selectedCat===c.id?'#fff':'var(--sub)'};font-size:12px;font-weight:600;white-space:nowrap">${esc(c.name)}</button>`});
    html+=`</div>`;
  }
  let channels=S.xtStreams.live;
  if(S.selectedCat)channels=channels.filter(c=>c.category===S.selectedCat);
  if(S.searchQ){const q=S.searchQ.toLowerCase();channels=channels.filter(c=>(c.name||"").toLowerCase().includes(q))}
  if(S.xtLoading){html+=`<div class="skel-grid">${Array(6).fill('<div class="skel-card"><div class="skel-thumb"></div><div class="skel-text"></div></div>').join("")}</div>`}
  else if(channels.length===0){html+=`<div class="empty-state"><div class="empty-icon">${I.tv}</div><div class="empty-title">${t("noChannels")}</div></div>`}
  else{html+=`<div class="channel-grid">${channels.slice(0,80).map(c=>chCardHTML(c)).join("")}</div>`}
  html+=`</div>`;el.innerHTML=html;fixSearchIcon(el);
}

function renderMoviesTab(){
  const el=document.getElementById("tab-movies");if(!el)return;
  if(!S.xtConnected){el.innerHTML=noServerHTML();return}
  let html=`<div style="padding:16px 0;max-width:1200px;margin:0 auto">
    <h2 style="font-size:17px;font-weight:800;margin-bottom:14px;padding:0 16px">${t("movies")}</h2>
    <div style="padding:0 16px;margin-bottom:14px"><div class="search-wrap"><div class="search-wrap-inner" style="position:relative">${I.search}<input class="search-input" type="text" placeholder="${t("search")}" value="${esc(S.searchQ)}" oninput="App.onSearch(this.value)"></div></div></div>`;
  if(S.searchQ){
    const q=S.searchQ.toLowerCase();const filtered=S.xtStreams.vod.filter(c=>(c.name||"").toLowerCase().includes(q));
    if(filtered.length===0)html+=`<div class="empty-state"><div class="empty-icon">${I.film}</div><div class="empty-title">${t("noChannels")}</div></div>`;
    else html+=`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:0 16px">${filtered.slice(0,60).map(c=>posterCardHTML(c)).join("")}</div>`;
  }else{
    const cats=S.xtCats.vod;
    if(S.xtLoading)html+=Array(3).fill('<div class="folder-section"><div class="folder-header"><div style="width:60%;height:14px;border-radius:4px;background:var(--card2)"></div></div><div class="poster-scroll no-scroll">'+Array(4).fill('<div class="skel-poster"><div class="skel-poster-thumb"></div></div>').join("")+'</div></div>').join("");
    else if(cats.length===0)html+=`<div class="empty-state"><div class="empty-icon">${I.film}</div><div class="empty-title">${t("noChannels")}</div></div>`;
    else{
      cats.forEach(cat=>{
        const items=S.xtStreams.vod.filter(c=>c.category===cat.category_id);
        if(items.length===0)return;
        const arrow=isRTL()?I.arrowL:I.arrowR;
        html+=`<div class="folder-section"><div class="folder-header"><div class="section-bar"></div><h3>${esc(cat.category_name)}</h3><span class="section-count">(${items.length})</span>
          <button class="watch-all-btn" onclick="App.openFolder('vod','${cat.category_id}','${esc(cat.category_name)}')">${t("watchAll")} ${arrow}</button></div>
          <div class="poster-scroll no-scroll">${items.slice(0,20).map(c=>posterCardHTML(c)).join("")}</div></div>`;
      });
    }
  }
  html+=`</div>`;el.innerHTML=html;fixSearchIcon(el);
}

function renderSeriesTab(){
  const el=document.getElementById("tab-series");if(!el)return;
  if(!S.xtConnected){el.innerHTML=noServerHTML();return}
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
        html+=`<div class="folder-section"><div class="folder-header"><div class="section-bar" style="background:linear-gradient(to bottom,#D53F8C,#B83280)"></div><h3>${esc(cat.category_name)}</h3><span class="section-count">(${items.length})</span>
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
  let html=`<div style="padding:16px;max-width:1200px;margin:0 auto"><h2 style="font-size:17px;font-weight:800;margin-bottom:14px">${t("favorites")}</h2>`;
  if(favs.length===0)html+=`<div class="empty-state"><div class="empty-icon">${I.heart}</div><div class="empty-title">${t("noFavs")}</div><div class="empty-sub">${t("noFavsSub")}</div></div>`;
  else{html+=`<div class="channel-grid">${favs.map(c=>c.type==="live"?chCardHTML(c):posterCardHTML(c)).join("")}</div>`}
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
  if(!S.xtConnected){el.innerHTML=noServerHTML();return}
  const all=[...S.xtStreams.vod.map(c=>({...c,_type:"vod"})),...S.xtStreams.series.map(c=>({...c,_type:"series"}))];
  all.sort((a,b)=>(parseInt(b.added)||0)-(parseInt(a.added)||0));
  const recent=all.filter(c=>c.added).slice(0,60);
  let html=`<div style="padding:16px 0;max-width:1200px;margin:0 auto">
    <h2 style="font-size:17px;font-weight:800;margin-bottom:14px;padding:0 16px">${t("recent")}</h2>`;
  if(recent.length===0)html+=`<div class="empty-state"><div class="empty-icon">${I.plus}</div><div class="empty-title">${t("noRecent")}</div></div>`;
  else html+=`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:0 16px">${recent.map(c=>posterCardHTML(c)).join("")}</div>`;
  html+=`</div>`;el.innerHTML=html;
}

function renderFolderDetail(type,catId,catName){
  const el=document.getElementById("tab-"+(type==="vod"?"movies":"series"));if(!el)return;
  const streams=type==="vod"?S.xtStreams.vod:S.xtStreams.series;
  let items=streams.filter(c=>String(c.category)===String(catId));
  if(S.searchQ){const q=S.searchQ.toLowerCase();items=items.filter(c=>(c.name||"").toLowerCase().includes(q))}
  const arrow=isRTL()?I.arrowR:I.arrowL;
  let html=`<div style="padding:16px;max-width:1200px;margin:0 auto">
    <button class="back-btn" onclick="App.switchTab('${type==="vod"?"movies":"series"}')">${arrow} ${type==="vod"?t("movies"):t("series")}</button>
    <h2 style="font-size:17px;font-weight:800;margin-bottom:14px">${esc(catName)} <span style="color:var(--muted);font-size:13px">(${items.length})</span></h2>`;
  if(items.length>0)html+=`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">${items.map(c=>posterCardHTML(c)).join("")}</div>`;
  else html+=`<div class="empty-state"><div class="empty-icon">${I.tv}</div><div class="empty-title">${t("noChannels")}</div></div>`;
  html+=`</div>`;el.innerHTML=html;
}

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
        const epUrl=proxied(`${b}/series/${u}/${p}/${epId}.${epExt}`);
        const epM3u8=proxied(`${b}/series/${u}/${p}/${epId}.m3u8`);
        const epTs=proxied(`${b}/series/${u}/${p}/${epId}.ts`);
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

// ── CARD GENERATORS (entire card clickable for instant play) ────────
function chCardHTML(c){
  const isFav=S.favs.has(c.id);const favI=isFav?I.heartF:I.heart;const favC=isFav?"active":"";
  return`<div class="ch-card" onclick="App.play('${esc(c.id)}')" tabindex="0" role="button" aria-label="${esc(c.name)}">
    <div class="ch-thumb">
      ${c.logo?`<img src="${esc(c.logo)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="ch-thumb-icon" style="display:none">${I.tv}</div>`:`<div class="ch-thumb-icon">${I.tv}</div>`}
      <div class="ch-live-badge"><span class="ch-live-dot"></span>LIVE</div>
    </div>
    <div class="ch-info"><div class="ch-name">${esc(c.name)}</div>
    <button class="ch-fav-btn ${favC}" onclick="event.stopPropagation();App.toggleFav('${esc(c.id)}')">${favI}</button></div></div>`;
}

function posterCardHTML(c){
  const isFav=S.favs.has(c.id);const favI=isFav?I.heartF:I.heart;const favC=isFav?"active":"";
  const isSeries=c.type==="series";
  const action=isSeries?`App.openSeries(${c.seriesId})`:`App.play('${esc(c.id)}')`;
  return`<div class="poster-card" onclick="${action}" tabindex="0" role="button" aria-label="${esc(c.name)}">
    <div class="poster-thumb">
      ${c.logo?`<img src="${esc(c.logo)}" alt="" loading="lazy" onerror="this.style.display='none'">`:""}
      <div class="poster-fav ${favC}" onclick="event.stopPropagation();App.toggleFav('${esc(c.id)}')">${favI}</div></div>
    <div class="poster-info"><span class="poster-title">${esc(c.name)}</span>
    <div class="poster-meta">${c.rating?`<span class="poster-rating">${I.star} ${esc(c.rating)}</span>`:""}${c.year?`<span>${esc(c.year)}</span>`:""}</div></div></div>`;
}

// ── PLAYER ──────────────────────────────────────────────────────────
function showPlayer(ch){
  S.current=ch;S.playerOpen=true;
  const overlay=document.getElementById("player-overlay");
  const video=document.getElementById("player-video");
  document.getElementById("pc-title").textContent=ch.name||"";
  overlay.classList.add("show");
  // Hide mini player
  document.getElementById("mini-player").style.display="none";
  playStream(ch.url,video,ch);
  addHistory(ch);
  setupPlayerEvents(video);
  showControls();
}

function hidePlayer(){
  const v=document.getElementById("player-video");
  const miniV=document.getElementById("mini-video");
  destroyHls();
  hidePlayerError();
  if(v&&v.currentTime>0&&!v.paused&&v.src){
    miniV.src=v.src;miniV.play().catch(()=>{});
    document.getElementById("mini-title").textContent=S.current?S.current.name:"";
    document.getElementById("mini-player").style.display="flex";
  }else{
    if(miniV){miniV.pause();miniV.src=""}
    document.getElementById("mini-player").style.display="none";
  }
  v.pause();v.removeAttribute('src');v.load();S.playerOpen=false;S.current=null;
  document.getElementById("player-overlay").classList.remove("show");
  document.getElementById("mute-hint").style.display="none";
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
  const nv=video.cloneNode(true);video.parentNode.replaceChild(nv,video);
  const v=nv;
  v.addEventListener("timeupdate",updateSeekBar);
  v.addEventListener("progress",updateBuffer);
  v.addEventListener("play",()=>{document.getElementById("pc-play-toggle").innerHTML=I.pause;document.getElementById("pc-play-btn").innerHTML=I.pause});
  v.addEventListener("pause",()=>{document.getElementById("pc-play-toggle").innerHTML=I.play;document.getElementById("pc-play-btn").innerHTML=I.play});
  v.addEventListener("ended",hidePlayer);
  v.addEventListener("click",()=>{if(S.controlsVisible)hideControls();else showControls()});
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
  const ind=document.getElementById("seek-indicator");const txt=document.getElementById("seek-indicator-text");
  if(sec>0){ind.querySelector("svg").style.transform="scaleX(-1)";txt.textContent="+"+sec+"s"}
  else{ind.querySelector("svg").style.transform="";txt.textContent=sec+"s"}
  const isLeft=sec<0;
  ind.style.cssText=`position:absolute;top:50%;${isLeft?"left":"right"}:15%;transform:translateY(-50%);background:rgba(0,0,0,.6);backdrop-filter:blur(10px);border-radius:50%;width:56px;height:56px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;z-index:5;opacity:1;pointer-events:none`;
  ind.querySelector("svg").style.cssText="width:20px;height:20px;color:#fff";
  setTimeout(()=>{ind.style.opacity="0"},600);showControls();
}
function togglePlayPause(){
  const v=document.getElementById("player-video");if(!v)return;
  if(v.paused)v.play().catch(()=>{});else v.pause();showControls();
}
function takeScreenshot(){
  const v=document.getElementById("player-video");if(!v)return;
  const c=document.getElementById("screenshot-canvas");c.width=v.videoWidth||640;c.height=v.videoHeight||360;
  c.getContext("2d").drawImage(v,0,0,c.width,c.height);
  c.toBlob(blob=>{const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="hammadshot_"+Date.now()+".png";a.click();URL.revokeObjectURL(url)},"image/png");
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
function unmuteVideo(){
  const v=document.getElementById("player-video");if(!v)return;
  v.muted=false;S.isMuted=false;
  document.getElementById("mute-hint").style.display="none";
}

// ── UTILITIES ───────────────────────────────────────────────────────
function fixSearchIcon(el){const si=el.querySelector(".search-wrap-inner");if(!si)return;const svg=si.querySelector("svg");if(!svg)return;if(isRTL())svg.style.cssText="position:absolute;top:50%;transform:translateY(-50%);width:15px;height:15px;color:var(--muted);right:12px;pointer-events:none";else svg.style.cssText="position:absolute;top:50%;transform:translateY(-50%);width:15px;height:15px;color:var(--muted);left:12px;pointer-events:none"}

function renderAll(){renderNavLabels();renderLiveTab();renderMoviesTab();renderSeriesTab();renderFavoritesTab();renderHistoryTab();renderRecentTab()}

function switchTab(tab){
  S.activeTab=tab;S.selectedCat=null;S.searchQ="";
  document.querySelectorAll(".tab").forEach(el=>el.classList.remove("active"));
  const tabEl=document.getElementById("tab-"+tab);if(tabEl)tabEl.classList.add("active");
  document.querySelectorAll(".nav-item").forEach(el=>el.classList.toggle("active",el.dataset.tab===tab));
  document.getElementById("main-content").scrollTop=0;
  if(tab==="live")renderLiveTab();else if(tab==="movies")renderMoviesTab();else if(tab==="series")renderSeriesTab();
  else if(tab==="favorites")renderFavoritesTab();else if(tab==="history")renderHistoryTab();else if(tab==="recent")renderRecentTab();
}

// ── PWA INSTALL ────────────────────────────────────────────────────
let _deferredPrompt=null;
window.addEventListener("beforeinstallprompt",(e)=>{e.preventDefault();_deferredPrompt=e;const b=document.getElementById("install-banner");if(b) setTimeout(()=>{b.style.display="flex"},2000)});

// ── APP API ─────────────────────────────────────────────────────────
window.App={
  _ready:false,_lang:S.locale,
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
  togglePlayPause,seekTo,seekRelative:seekRel,takeScreenshot,togglePiP,toggleFullscreen,showControls,unmuteVideo,
  retryPlayback,
  clearHistory(){S.history=[];saveHistory();renderHistoryTab()},
  setLang(lang){
    S.locale=lang;this._lang=lang;localStorage.setItem("hs-locale",lang);
    document.documentElement.dir=isRTL()?"rtl":"ltr";document.documentElement.lang=lang;
    const ll=document.getElementById("lang-label");if(ll)ll.textContent=lang==="ar"?"EN":"عربي";
    renderAll();
  },
  installPWA(){
    if(_deferredPrompt){_deferredPrompt.prompt();_deferredPrompt.userChoice.then(()=>{_deferredPrompt=null;document.getElementById("install-banner").style.display="none"})}
  },
  dismissInstall(){document.getElementById("install-banner").style.display="none"},
};

// ── INIT ────────────────────────────────────────────────────────────
async function init(){
  S.locale=localStorage.getItem("hs-locale")||"ar";
  document.documentElement.dir=isRTL()?"rtl":"ltr";document.documentElement.lang=S.locale;
  loadFavs();loadHistory();

  // Load config: localStorage first, then Firebase
  let config=load("xtc",null);
  if(!config||!config.url||!config.user||!config.pass){
    config=await fbLoadConfig();
    if(config){save("xtc",config)}
  }

  if(!config||!config.url||!config.user||!config.pass){
    // No config anywhere — redirect to setup
    window.location.href="./setup.html";return;
  }

  S.xtConfig=config;
  renderAll();
  await xtLogin();

  if("serviceWorker"in navigator)try{await navigator.serviceWorker.register("./sw.js")}catch(e){}
  S._ready=true;App._ready=true;
}
init();