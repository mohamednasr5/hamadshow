/**
 * NASR LIVE - Search Page
 * Full-text search with voice input, history, and grouped results.
 */
(function () {
  'use strict';

  var HISTORY_KEY = 'nasr_search_history';
  var DEBOUNCE_MS = 300;
  var _destroyed = false;
  var _debounceTimer = null;
  var _recognition = null;

  function getAPI() {
    return (window.ServerConfig && window.ServerConfig.getXtreamClient()) || null;
  }

  function getHistory() {
    try {
      var raw = localStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function saveHistory(items) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 20)));
    } catch (e) {}
  }

  function addToHistory(query) {
    var items = getHistory();
    var q = query.trim();
    if (!q) return;
    items = items.filter(function (i) { return i !== q; });
    items.unshift(q);
    saveHistory(items);
  }

  function clearHistory() {
    saveHistory([]);
  }

  function liveCardHTML(ch) {
    return '<div class="channel-card" data-type="live" data-id="' + ch.stream_id + '">' +
      '<div class="channel-card-inner">' +
        '<div class="channel-card-logo">' + (ch.stream_icon ? '<img src="' + ch.stream_icon + '" alt="' + (ch.name || '') + '" loading="lazy">' : '') + '</div>' +
        '<div class="channel-card-info">' +
          '<div class="channel-card-name">' + (ch.name || '') + '</div>' +
          '<div class="channel-card-category">' + (ch.category_name || '') + '</div>' +
        '</div>' +
      '</div></div>';
  }

  function movieCardHTML(m) {
    var poster = m.stream_icon || m.cover || '';
    var title = m.name || '';
    var year = m.year || m.release_date || '';
    var rating = m.rating || '';
    var badges = '';
    if (year) badges += '<span class="content-card-badge">' + year + '</span>';
    if (rating) {
      badges += '<span class="content-card-rating" style="position:absolute;top:8px;right:8px;background:var(--bg-surface);padding:2px 6px;border-radius:var(--radius-sm);font-size:0.6875rem;display:flex;align-items:center;gap:3px;z-index:2">' +
        '<svg viewBox="0 0 20 20" fill="var(--warning)" width="10" height="10"><path d="M10 1l2.39 4.84 5.34.78-3.87 3.77.91 5.32L10 13.27l-4.77 2.51.91-5.32L2.27 6.62l5.34-.78z"/></svg>' +
        rating + '</span>';
    }
    return '<div class="content-card" data-type="movie" data-id="' + m.stream_id + '">' +
      '<div class="content-card-poster">' +
        (poster ? '<img src="' + poster + '" alt="' + title + '" loading="lazy">' : '') +
        badges +
        '<div class="content-card-overlay"></div>' +
        '<div class="content-card-info"><div class="content-card-title">' + title + '</div></div>' +
      '</div></div>';
  }

  function seriesCardHTML(s) {
    var poster = s.cover || s.stream_icon || '';
    var title = s.name || '';
    return '<div class="content-card" data-type="series" data-id="' + (s.series_id || s.stream_id) + '">' +
      '<div class="content-card-poster">' +
        (poster ? '<img src="' + poster + '" alt="' + title + '" loading="lazy">' : '') +
        '<div class="content-card-overlay"></div>' +
        '<div class="content-card-info"><div class="content-card-title">' + title + '</div></div>' +
      '</div></div>';
  }

  function render(container) {
    _destroyed = false;
    var api = getAPI();
    var listeners = [];
    var searchHistory = getHistory();

    container.innerHTML =
      '<div class="search-container" style="padding:8px 16px 24px">' +
        '<div class="search-bar" style="margin-bottom:16px">' +
          '<div class="search-bar-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg></div>' +
          '<input type="text" id="search-input" data-i18n-placeholder="search.placeholder" placeholder="Search for movies, series, channels..." autocomplete="off">' +
          '<div class="search-bar-actions">' +
            '<button class="search-voice-btn" id="search-voice" title="' + (window.i18n ? window.i18n.t('search.voiceSearch') : 'Voice Search') + '">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>' +
            '</button>' +
            '<button class="search-clear-btn" id="search-clear" style="display:none">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
            '</button>' +
          '</div>' +
        '</div>' +
        '<div id="search-history-section">' +
          '<div class="search-history-header">' +
            '<span class="search-history-title">' + (window.i18n ? window.i18n.t('search.recentSearches') : 'Recent Searches') + '</span>' +
            '<button class="search-history-clear" id="search-clear-history">' + (window.i18n ? window.i18n.t('search.clearHistory') : 'Clear History') + '</button>' +
          '</div>' +
          '<div class="search-history-list" id="search-history-list"></div>' +
        '</div>' +
        '<div id="search-results-section" style="display:none">' +
          '<div id="search-results-loading" style="text-align:center;padding:24px"><div class="skeleton-text w-50"></div></div>' +
          '<div id="search-results-content"></div>' +
        '</div>' +
        '<div id="search-empty-state" style="display:none" class="search-empty">' +
          '<div class="search-empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg></div>' +
          '<div class="search-empty-title">' + (window.i18n ? window.i18n.t('search.noResults') : 'No results found') + '</div>' +
        '</div>' +
        '<div id="search-initial-state" class="search-empty">' +
          '<div class="search-empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg></div>' +
          '<div class="search-empty-title">' + (window.i18n ? window.i18n.t('search.title') : 'Search') + '</div>' +
          '<div class="search-empty-desc">' + (window.i18n ? window.i18n.t('search.placeholder') : 'Search for movies, series, channels...') + '</div>' +
        '</div>' +
      '</div>';

    var input = container.querySelector('#search-input');
    var clearBtn = container.querySelector('#search-clear');
    var voiceBtn = container.querySelector('#search-voice');
    var historySection = container.querySelector('#search-history-section');
    var historyList = container.querySelector('#search-history-list');
    var resultsSection = container.querySelector('#search-results-section');
    var resultsLoading = container.querySelector('#search-results-loading');
    var resultsContent = container.querySelector('#search-results-content');
    var emptyState = container.querySelector('#search-empty-state');
    var initialState = container.querySelector('#search-initial-state');
    var clearHistBtn = container.querySelector('#search-clear-history');

    function renderHistory() {
      searchHistory = getHistory();
      if (searchHistory.length === 0) {
        historySection.style.display = 'none';
        return;
      }
      historySection.style.display = 'block';
      historyList.innerHTML = searchHistory.map(function (q) {
        return '<div class="search-history-item" data-query="' + q.replace(/"/g, '&quot;') + '">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>' +
          '<span>' + q + '</span>' +
        '</div>';
      }).join('');
    }

    function showView(view) {
      historySection.style.display = view === 'history' ? 'block' : 'none';
      resultsSection.style.display = view === 'results' ? 'block' : 'none';
      emptyState.style.display = view === 'empty' ? 'flex' : 'none';
      initialState.style.display = view === 'initial' ? 'flex' : 'none';
    }

    function doSearch(query) {
      if (!query || !api || !api.isAuthenticated()) {
        showView('initial');
        return;
      }

      addToHistory(query);
      renderHistory();
      clearBtn.style.display = 'flex';
      showView('results');
      resultsLoading.style.display = 'block';
      resultsContent.innerHTML = '';

      api.search(query).then(function (results) {
        if (_destroyed) return;
        resultsLoading.style.display = 'none';
        var movies = results.movies || [];
        var live = results.live || [];

        if (movies.length === 0 && live.length === 0) {
          showView('empty');
          return;
        }

        var html = '';

        if (live.length > 0) {
          html += '<div class="content-row"><div class="content-row-header"><h2 class="content-row-title">' +
            (window.i18n ? window.i18n.t('search.channels') : 'Channels') + ' (' + live.length + ')</h2></div>' +
            '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px">' +
            live.map(liveCardHTML).join('') + '</div></div>';
        }

        if (movies.length > 0) {
          html += '<div class="content-row"><div class="content-row-header"><h2 class="content-row-title">' +
            (window.i18n ? window.i18n.t('search.movies') : 'Movies') + ' (' + movies.length + ')</h2></div>' +
            '<div class="search-results-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px">' +
            movies.map(movieCardHTML).join('') + '</div></div>';
        }

        resultsContent.innerHTML = html;
        showView('results');
        resultsSection.style.display = 'block';
      }).catch(function () {
        resultsLoading.style.display = 'none';
        showView('empty');
      });
    }

    function handleInput() {
      var q = input.value.trim();
      clearBtn.style.display = q ? 'flex' : 'none';
      if (!q) {
        showView(searchHistory.length > 0 ? 'history' : 'initial');
        return;
      }
      clearTimeout(_debounceTimer);
      _debounceTimer = setTimeout(function () { doSearch(q); }, DEBOUNCE_MS);
    }

    function handleClear() {
      input.value = '';
      clearBtn.style.display = 'none';
      showView(searchHistory.length > 0 ? 'history' : 'initial');
      input.focus();
    }

    function handleHistoryClick(e) {
      var item = e.target.closest('.search-history-item');
      if (!item) return;
      var q = item.dataset.query;
      input.value = q;
      clearBtn.style.display = 'flex';
      doSearch(q);
    }

    function handleClearHistory() {
      clearHistory();
      renderHistory();
    }

    function handleResultsClick(e) {
      var card = e.target.closest('.channel-card, .content-card');
      if (!card) return;
      var type = card.dataset.type;
      var id = card.dataset.id;

      if (type === 'live' && api && window.PlayerManager) {
        var urls = api.getStreamUrlFallbacks(id, 'live');
        var name = card.querySelector('.channel-card-name, .content-card-title');
        window.PlayerManager.play({ id: id, name: name ? name.textContent : '', streamUrl: urls[0], streamUrlFallbacks: urls.slice(1), type: 'live' });
      } else if (type === 'movie' && api && window.PlayerManager) {
        var mUrl = api.getStreamUrl(id, 'movie');
        var mName = card.querySelector('.content-card-title');
        var mLogo = card.querySelector('.content-card-poster img');
        window.PlayerManager.play({ id: id, name: mName ? mName.textContent : '', logo: mLogo ? mLogo.src : '', streamUrl: mUrl, type: 'movie' });
      } else if (type === 'series' && window.AppRouter) {
        window.AppRouter.navigate('series', { action: 'detail', id: id });
      }
    }

    function startVoiceSearch() {
      var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) return;

      if (_recognition) {
        _recognition.abort();
        _recognition = null;
        voiceBtn.classList.remove('recording');
        return;
      }

      _recognition = new SpeechRecognition();
      _recognition.lang = (window.i18n && window.i18n.getCurrentLang() === 'ar') ? 'ar-SA' : 'en-US';
      _recognition.continuous = false;
      _recognition.interimResults = false;

      voiceBtn.classList.add('recording');

      _recognition.onresult = function (event) {
        var transcript = event.results[0][0].transcript;
        input.value = transcript;
        voiceBtn.classList.remove('recording');
        _recognition = null;
        doSearch(transcript);
      };

      _recognition.onerror = function () {
        voiceBtn.classList.remove('recording');
        _recognition = null;
      };

      _recognition.onend = function () {
        voiceBtn.classList.remove('recording');
        _recognition = null;
      };

      _recognition.start();
    }

    input.addEventListener('input', handleInput);
    clearBtn.addEventListener('click', handleClear);
    voiceBtn.addEventListener('click', startVoiceSearch);
    historyList.addEventListener('click', handleHistoryClick);
    clearHistBtn.addEventListener('click', handleClearHistory);
    resultsContent.addEventListener('click', handleResultsClick);
    listeners.push(
      { el: input, fn: handleInput, ev: 'input' },
      { el: clearBtn, fn: handleClear, ev: 'click' },
      { el: voiceBtn, fn: startVoiceSearch, ev: 'click' },
      { el: historyList, fn: handleHistoryClick, ev: 'click' },
      { el: clearHistBtn, fn: handleClearHistory, ev: 'click' },
      { el: resultsContent, fn: handleResultsClick, ev: 'click' }
    );

    renderHistory();
    showView(searchHistory.length > 0 ? 'history' : 'initial');
    if (window.i18n && window.i18n.isReady()) window.i18n._applyTranslations();

    return function destroy() {
      _destroyed = true;
      clearTimeout(_debounceTimer);
      if (_recognition) { _recognition.abort(); _recognition = null; }
      listeners.forEach(function (l) { l.el.removeEventListener(l.ev, l.fn); });
    };
  }

  window.Pages = window.Pages || {};
  window.Pages.search = { render: render };
})();