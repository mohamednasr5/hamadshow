/**
 * NASR LIVE - Authentication Service
 *
 * Manages both Firebase Authentication and Xtream Codes IPTV authentication.
 * Supports two sign-in flows:
 *
 *   1. Email/Password — Standard Firebase auth for registered users.
 *   2. Xtream Login — Signs in anonymously to Firebase, then authenticates
 *      with the IPTV server and stores encrypted credentials in RTDB.
 *
 * Dispatches custom DOM events for auth state changes that other parts
 * of the application can listen to.
 *
 * Exposed globally as: window.AuthService
 *
 * @namespace AuthService
 */
(function () {
  'use strict';

  /**
   * @constant {Object} Firebase RTDB path constants
   * @private
   */
  var RTDB_PATHS = {
    XSTREAM_CONFIG: 'xtreamConfig'   // Stored at users/{uid}/xtreamConfig
  };

  /**
   * @type {firebase.auth.Auth|null} Cached Firebase Auth instance.
   * @private
   */
  var _auth = null;

  /**
   * @type {firebase.database.Database|null} Cached Firebase RTDB instance.
   * @private
   */
  var _database = null;

  /**
   * @type {XtreamAPI|null} Active Xtream API client instance.
   * @private
   */
  var _xtreamClient = null;

  /**
   * @type {firebase.User|null} Currently signed-in Firebase user.
   * @private
   */
  var _currentUser = null;

  /**
   * @type {Function[]} Registered auth state change callbacks.
   * @private
   */
  var _authListeners = [];

  /**
   * Returns the Firebase Auth instance, initializing it on first call.
   *
   * @private
   * @returns {firebase.auth.Auth} The Firebase Auth compat instance.
   * @throws {Error} If the Firebase SDK is not loaded.
   */
  function _getAuth() {
    if (_auth) return _auth;
    if (typeof firebase === 'undefined' || !firebase.auth) {
      throw new Error('AuthService: Firebase Auth SDK is not loaded');
    }
    _auth = firebase.auth();
    return _auth;
  }

  /**
   * Returns the Firebase Realtime Database instance.
   *
   * @private
   * @returns {firebase.database.Database} The Firebase RTDB compat instance.
   * @throws {Error} If the Firebase SDK is not loaded.
   */
  function _getDatabase() {
    if (_database) return _database;
    if (typeof firebase === 'undefined' || !firebase.database) {
      throw new Error('AuthService: Firebase Database SDK is not loaded');
    }
    _database = firebase.database();
    return _database;
  }

  /**
   * Dispatches a custom event on the document with the given name and detail.
   *
   * @private
   * @param {string} eventName - Name of the custom event (e.g. 'auth:login').
   * @param {Object} [detail] - Data to attach to the event.
   */
  function _dispatchEvent(eventName, detail) {
    try {
      var event = new CustomEvent(eventName, {
        detail: detail || {},
        bubbles: true,
        cancelable: true
      });
      document.dispatchEvent(event);
    } catch (e) {
      // Fallback for very old browsers
      var fallbackEvent = document.createEvent('CustomEvent');
      fallbackEvent.initCustomEvent(eventName, true, true, detail || {});
      document.dispatchEvent(fallbackEvent);
    }
  }

  /**
   * Updates the cached current user and notifies all registered listeners.
   *
   * @private
   * @param {firebase.User|null} user - The new user state.
   */
  function _setUser(user) {
    _currentUser = user;
    for (var i = 0; i < _authListeners.length; i++) {
      try {
        _authListeners[i](user);
      } catch (e) {
        console.error('AuthService: listener error', e);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Initializes the auth service. Sets up the Firebase auth state listener
   * and automatically attempts to reconnect to Xtream if a stored config
   * is found for the current user.
   *
   * Should be called once during app startup, after all scripts are loaded.
   *
   * @example
   * // In your app bootstrap:
   * await AppDB.init();
   * await AuthService.init();
   *
   * @returns {Promise<void>} Resolves once the initial auth state is determined.
   */
  function init() {
    var auth = _getAuth();

    return new Promise(function (resolve) {
      auth.onAuthStateChanged(function (user) {
        _setUser(user);

        if (user) {
          _dispatchEvent('auth:login', { user: user });

          // Auto-connect Xtream if config exists
          loadXtreamConfig().then(function (config) {
            if (config) {
              _xtreamClient = new XtreamAPI(config.serverUrl, config.username, config.password);
              _xtreamClient.authenticate().then(function () {
                _dispatchEvent('auth:xtream-connected', {
                  user: user,
                  xtreamConfig: config,
                  userInfo: _xtreamClient.getUserInfo()
                });
              }).catch(function (err) {
                console.warn('AuthService: auto Xtream connect failed', err);
              });
            }
            resolve();
          }).catch(function () {
            resolve();
          });
        } else {
          _xtreamClient = null;
          _dispatchEvent('auth:logout', {});
          resolve();
        }
      });
    });
  }

  /**
   * Signs in a user with email and password via Firebase Authentication.
   *
   * @example
   * try {
   *   var result = await AuthService.signInWithEmail('user@example.com', 'password123');
   *   console.log('Signed in as', result.user.email);
   * } catch (err) {
   *   console.error('Sign in failed:', err.message);
   * }
   *
   * @param {string} email - The user's email address.
   * @param {string} password - The user's password.
   * @returns {Promise<firebase.auth.UserCredential>} The Firebase auth credential.
   * @throws {Error} If sign-in fails (invalid credentials, user not found, etc.).
   */
  function signInWithEmail(email, password) {
    var auth = _getAuth();
    return auth.signInWithEmailAndPassword(email, password);
  }

  /**
   * Creates a new Firebase user account with email, password, and display name.
   *
   * @example
   * var credential = await AuthService.createUser('new@example.com', 'pass123', 'Ahmed');
   * console.log('Created user:', credential.user.uid);
   *
   * @param {string} email - The desired email address.
   * @param {string} password - The desired password (min 6 characters).
   * @param {string} displayName - The display name for the user profile.
   * @returns {Promise<firebase.auth.UserCredential>} The Firebase auth credential.
   * @throws {Error} If account creation fails (email in use, weak password, etc.).
   */
  function createUser(email, password, displayName) {
    var auth = _getAuth();
    return auth.createUserWithEmailAndPassword(email, password).then(function (credential) {
      // Update the user's display name
      if (displayName && credential.user) {
        return credential.user.updateProfile({
          displayName: displayName
        }).then(function () {
          return credential;
        });
      }
      return credential;
    });
  }

  /**
   * Signs in using Xtream Codes credentials. Creates an anonymous Firebase
   * user (or reuses the existing one) and stores the encrypted Xtream
   * configuration in Firebase Realtime Database.
   *
   * The flow:
   *   1. Sign in anonymously to Firebase (or reuse existing session).
   *   2. Create an XtreamAPI instance and authenticate with the IPTV server.
   *   3. On success, encrypt and store the credentials in RTDB.
   *   4. Dispatch 'auth:xtream-connected' event.
   *
   * @example
   * try {
   *   await AuthService.signInWithXtream('http://my-iptv.com', 'user1', 'pass1');
   *   // Xtream is now connected and config is saved
   * } catch (err) {
   *   console.error('Xtream login failed:', err.message);
   * }
   *
   * @param {string} serverUrl - The Xtream Codes server base URL.
   * @param {string} username - The IPTV service username.
   * @param {string} password - The IPTV service password.
   * @returns {Promise<Object>} The authentication result from the Xtream server.
   * @throws {Error} If anonymous Firebase sign-in or Xtream authentication fails.
   */
  function signInWithXtream(serverUrl, username, password) {
    var auth = _getAuth();

    // Step 1: Ensure we have a Firebase user (anonymous or existing)
    var userPromise = (auth.currentUser)
      ? Promise.resolve(auth.currentUser)
      : auth.signInAnonymously().then(function (cred) { return cred.user; });

    return userPromise.then(function (user) {
      // Step 2: Authenticate with the Xtream server
      var client = new XtreamAPI(serverUrl, username, password);
      return client.authenticate().then(function (authResult) {
        // Step 3: Save encrypted config to RTDB
        return saveXtreamConfig({
          serverUrl: serverUrl,
          username: username,
          password: password
        }).then(function () {
          // Step 4: Store the client and dispatch event
          _xtreamClient = client;
          _currentUser = user;

          _dispatchEvent('auth:xtream-connected', {
            user: user,
            xtreamConfig: { serverUrl: serverUrl, username: username, password: password },
            userInfo: client.getUserInfo()
          });

          return authResult;
        });
      });
    });
  }

  /**
   * Signs the user out of Firebase and clears all local auth state.
   * Does NOT delete the Firebase account — just ends the session.
   *
   * @example
   * await AuthService.signOut();
   * // User is now signed out
   *
   * @returns {Promise<void>}
   */
  function signOut() {
    var auth = _getAuth();

    // Disconnect Xtream client
    if (_xtreamClient) {
      _xtreamClient.disconnect();
      _xtreamClient = null;
    }

    _currentUser = null;
    _dispatchEvent('auth:logout', {});

    return auth.signOut();
  }

  /**
   * Returns the currently signed-in Firebase user, or null if not signed in.
   *
   * @example
   * var user = AuthService.getCurrentUser();
   * if (user) {
   *   console.log('UID:', user.uid);
   *   console.log('Anonymous:', user.isAnonymous);
   * }
   *
   * @returns {firebase.User|null} The current Firebase user, or null.
   */
  function getCurrentUser() {
    // Prefer cached value, fall back to Firebase SDK
    if (_currentUser) return _currentUser;
    try {
      var auth = _getAuth();
      return auth.currentUser;
    } catch (e) {
      return null;
    }
  }

  /**
   * Registers a callback to be invoked whenever the Firebase auth state changes.
   * The callback receives a `firebase.User` (or null on sign-out).
   *
   * This is a lightweight wrapper that maintains our own listener list in addition
   * to the Firebase SDK's own listener, ensuring callbacks fire even for
   * programmatic state changes.
   *
   * @example
   * AuthService.onAuthStateChanged(function (user) {
   *   if (user) {
   *     console.log('User signed in:', user.uid);
   *   } else {
   *     console.log('User signed out');
   *   }
   * });
   *
   * @param {function(firebase.User|null): void} callback - The auth state change handler.
   * @returns {void}
   */
  function onAuthStateChanged(callback) {
    if (typeof callback === 'function') {
      _authListeners.push(callback);

      // Immediately invoke with the current state
      try {
        callback(_currentUser || _getAuth().currentUser);
      } catch (e) {
        // Ignore errors in the initial callback
      }
    }
  }

  /**
   * Encrypts and saves the Xtream Codes configuration to Firebase RTDB
   * at the path `users/{uid}/xtreamConfig`.
   *
   * Only the serverUrl and username are stored in plain alongside the
   * encrypted payload; the password is always encrypted.
   *
   * @example
   * await AuthService.saveXtreamConfig({
   *   serverUrl: 'http://my-iptv.com',
   *   username: 'user1',
   *   password: 'pass1'
   * });
   *
   * @param {Object} config - The Xtream configuration to save.
   * @param {string} config.serverUrl - The server base URL.
   * @param {string} config.username - The IPTV username.
   * @param {string} config.password - The IPTV password (will be encrypted).
   * @returns {Promise<void>} Resolves when the config has been saved.
   * @throws {Error} If no user is signed in or the Crypto module is not loaded.
   */
  function saveXtreamConfig(config) {
    var user = getCurrentUser();
    if (!user) {
      return Promise.reject(new Error('AuthService.saveXtreamConfig: no user is currently signed in'));
    }

    if (typeof window.Crypto === 'undefined') {
      return Promise.reject(new Error('AuthService.saveXtreamConfig: Crypto module is not loaded'));
    }

    // Encrypt the entire config as a JSON string for simplicity
    var plaintext = JSON.stringify({
      serverUrl: config.serverUrl,
      username: config.username,
      password: config.password
    });

    var encrypted = window.Crypto.encrypt(plaintext);

    var db = _getDatabase();
    var ref = db.ref('users/' + user.uid + '/' + RTDB_PATHS.XSTREAM_CONFIG);

    return ref.set({
      data: encrypted,
      updatedAt: firebase.database.ServerValue.TIMESTAMP
    });
  }

  /**
   * Loads and decrypts the Xtream Codes configuration from Firebase RTDB.
   *
   * @example
   * var config = await AuthService.loadXtreamConfig();
   * if (config) {
   *   console.log('Server:', config.serverUrl);
   *   console.log('User:', config.username);
   *   // password is available as config.password (decrypted)
   * }
   *
   * @returns {Promise<Object|null>} The decrypted config {serverUrl, username, password},
   *                                  or null if no config is stored or decryption fails.
   */
  function loadXtreamConfig() {
    var user = getCurrentUser();
    if (!user) {
      return Promise.resolve(null);
    }

    if (typeof window.Crypto === 'undefined') {
      console.warn('AuthService.loadXtreamConfig: Crypto module is not loaded');
      return Promise.resolve(null);
    }

    var db = _getDatabase();
    var ref = db.ref('users/' + user.uid + '/' + RTDB_PATHS.XSTREAM_CONFIG);

    return ref.once('value').then(function (snapshot) {
      var data = snapshot.val();
      if (!data || !data.data) {
        return null;
      }

      try {
        var plaintext = window.Crypto.decrypt(data.data);
        var config = JSON.parse(plaintext);
        return {
          serverUrl: config.serverUrl || '',
          username: config.username || '',
          password: config.password || ''
        };
      } catch (e) {
        console.error('AuthService.loadXtreamConfig: failed to decrypt config', e);
        return null;
      }
    }).catch(function (err) {
      console.error('AuthService.loadXtreamConfig: failed to load config', err);
      return null;
    });
  }

  /**
   * Deletes the currently signed-in Firebase user's account and all
   * associated RTDB data (including the stored Xtream config).
   *
   * The user must have signed in recently — Firebase requires re-authentication
   * for sensitive operations. If the user is anonymous, their data is simply
   * removed from RTDB before deletion.
   *
   * @example
   * try {
   *   await AuthService.deleteAccount();
   *   console.log('Account deleted');
   * } catch (err) {
   *   console.error('Delete failed:', err.message);
   * }
   *
   * @returns {Promise<void>} Resolves when the account and data have been deleted.
   * @throws {Error} If no user is signed in, deletion fails, or re-auth is required.
   */
  function deleteAccount() {
    var user = getCurrentUser();
    if (!user) {
      return Promise.reject(new Error('AuthService.deleteAccount: no user is currently signed in'));
    }

    // Disconnect Xtream client
    if (_xtreamClient) {
      _xtreamClient.disconnect();
      _xtreamClient = null;
    }

    // Remove user data from RTDB
    var db = _getDatabase();
    var userRef = db.ref('users/' + user.uid);

    return userRef.remove().then(function () {
      // Delete the Firebase auth user
      return user.delete();
    }).then(function () {
      _currentUser = null;
      _dispatchEvent('auth:logout', { deleted: true });
    }).catch(function (err) {
      // Re-throw with a more helpful message for common errors
      if (err && err.code === 'auth/requires-recent-login') {
        throw new Error('Please sign out and sign in again before deleting your account.');
      }
      throw err;
    });
  }

  /**
   * Returns the currently active XtreamAPI client instance.
   * This is the authenticated client created during Xtream sign-in
   * or auto-reconnection on app load.
   *
   * @example
   * var client = AuthService.getXtreamClient();
   * if (client && client.isAuthenticated()) {
   *   var categories = await client.getLiveCategories();
   * }
   *
   * @returns {XtreamAPI|null} The active XtreamAPI instance, or null.
   */
  function getXtreamClient() {
    return _xtreamClient;
  }

  // ── Public API ──────────────────────────────────────────────────────────
  window.AuthService = {
    /**
     * Initializes the auth service. Must be called once on app startup.
     * @type {function(): Promise<void>}
     */
    init: init,

    /**
     * Signs in with Firebase email and password.
     * @type {function(string, string): Promise<firebase.auth.UserCredential>}
     */
    signInWithEmail: signInWithEmail,

    /**
     * Creates a new Firebase user with email, password, and display name.
     * @type {function(string, string, string): Promise<firebase.auth.UserCredential>}
     */
    createUser: createUser,

    /**
     * Signs in using Xtream Codes credentials (anonymous Firebase + encrypted RTDB storage).
     * @type {function(string, string, string): Promise<Object>}
     */
    signInWithXtream: signInWithXtream,

    /**
     * Signs out of Firebase and clears local auth state.
     * @type {function(): Promise<void>}
     */
    signOut: signOut,

    /**
     * Returns the currently signed-in Firebase user, or null.
     * @type {function(): firebase.User|null}
     */
    getCurrentUser: getCurrentUser,

    /**
     * Registers a callback for auth state changes.
     * @type {function(function(firebase.User|null)): void}
     */
    onAuthStateChanged: onAuthStateChanged,

    /**
     * Encrypts and saves Xtream config to Firebase RTDB.
     * @type {function(Object): Promise<void>}
     */
    saveXtreamConfig: saveXtreamConfig,

    /**
     * Loads and decrypts Xtream config from Firebase RTDB.
     * @type {function(): Promise<Object|null>}
     */
    loadXtreamConfig: loadXtreamConfig,

    /**
     * Deletes the Firebase user account and all associated RTDB data.
     * @type {function(): Promise<void>}
     */
    deleteAccount: deleteAccount,

    /**
     * Returns the active XtreamAPI client instance, or null.
     * @type {function(): XtreamAPI|null}
     */
    getXtreamClient: getXtreamClient
  };
})();