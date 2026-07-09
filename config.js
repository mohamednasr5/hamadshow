/*========================================
  NASR LIVE - IPTV WEB PLAYER
  Configuration File
  ========================================*/

/*----- Player name -----*/
window.playername = "Nasr Live";

/*----- DNS -----*/
// IPTV provider DNS URL (for example "https://tv.nv2.info")
// Leave empty to let users enter it at login
window.dns = "";

/*----- CORS -----*/
// False if IPTV provider has Access-Control-Allow-Origin set to "*" or allows your player domain.
// Change to "true" to use "proxy.php" for managing requests.
// If true, also change the $cors value in proxy.php
window.cors = false;

/*----- HTTPS -----*/
// If streams use SSL protocol, change this to true
window.https = false;

/*----- TMDB API [OPTIONAL] -----*/
// By default, the player uses movie info from the provider.
// If these are missing, TMDB will be used as an alternative.
// Get a TMDB API key: https://developers.themoviedb.org/3/getting-started/introduction
window.tmdb = "";

/*----- AUTO-SELECT NEXT EPISODE -----*/
// Automatically play the next episode when the current one ends
window.autoNextEpisode = true;

/*----- DEFAULT VIEW -----*/
// "grid" or "list"
window.defaultView = "grid";

/*----- LANGUAGE -----*/
// "ar" for Arabic (RTL), "en" for English (LTR)
window.defaultLang = "ar";

// Don't change this line
document.getElementsByTagName("title")[0].innerText = window.playername;