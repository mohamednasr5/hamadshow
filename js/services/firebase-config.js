/**
 * NASR LIVE - Firebase Configuration
 *
 * This app can back up your server (Xtream) login on Firebase so that if
 * you reinstall the app or open it on a new device, it can restore your
 * connection automatically instead of asking you to re-type the server
 * details. This is OPTIONAL: if you don't fill in your Firebase project
 * details below, the app keeps working exactly as before, storing the
 * server login only on this device.
 *
 * HOW TO ENABLE FIREBASE SYNC (one-time setup):
 *   1. Go to https://console.firebase.google.com and create a free project.
 *   2. Add a "Web App" to the project (</> icon) and copy the config object
 *      it gives you.
 *   3. Enable "Anonymous" sign-in under Authentication > Sign-in method.
 *   4. Enable "Realtime Database" (any region) and set rules so an
 *      authenticated user can only read/write their own data, e.g.:
 *        {
 *          "rules": {
 *            "users": {
 *              "$uid": {
 *                ".read": "$uid === auth.uid",
 *                ".write": "$uid === auth.uid"
 *              }
 *            }
 *          }
 *        }
 *   5. Paste your config values below, replacing the empty strings.
 *
 * Exposed globally as: window.FIREBASE_CONFIG
 */
window.FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  databaseURL: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

(function () {
  'use strict';
  // Only initialize if the developer has actually filled in a project.
  var cfg = window.FIREBASE_CONFIG;
  var isConfigured = !!(cfg && cfg.apiKey && cfg.databaseURL);

  window.FIREBASE_ENABLED = false;

  if (!isConfigured) {
    console.info('NASR LIVE: Firebase sync is not configured (see js/services/firebase-config.js). Server login will be saved on this device only.');
    return;
  }

  if (typeof firebase === 'undefined' || !firebase.initializeApp) {
    console.warn('NASR LIVE: Firebase SDK not loaded, sync disabled.');
    return;
  }

  try {
    firebase.initializeApp(cfg);
    window.FIREBASE_ENABLED = true;
  } catch (e) {
    console.warn('NASR LIVE: Firebase initialization failed, sync disabled.', e);
    window.FIREBASE_ENABLED = false;
  }
})();
