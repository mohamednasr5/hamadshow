/**
 * NASR LIVE - Focus Engine
 * TV Remote / Keyboard spatial navigation for [data-focusable] elements
 */
(function () {
  'use strict';

  var _enabled = false;
  var _currentFocused = null;
  var _mutationObserver = null;
  var _scrollContainer = null;
  var _rowMap = [];
  var _saveTimeout = null;

  var DIRECTION = {
    UP: 'up',
    DOWN: 'down',
    LEFT: 'left',
    RIGHT: 'right'
  };

  function shouldActivate() {
    if (_enabled) return true;
    if (typeof window.UIComponents !== 'undefined' && window.UIComponents.isTV()) return true;
    return false;
  }

  function init() {
    if (shouldActivate()) _enabled = true;
    if (!_enabled) return;

    document.addEventListener('keydown', handleKeyDown);

    if (typeof MutationObserver !== 'undefined') {
      _mutationObserver = new MutationObserver(function () {
        buildRowMap();
      });
      _mutationObserver.observe(document.body, { childList: true, subtree: true });
    }

    buildRowMap();
    document.addEventListener('click', handleGlobalClick);
  }

  function handleGlobalClick(e) {
    if (!_enabled) return;
    var focusable = e.target.closest('[data-focusable]');
    if (focusable) {
      focusElement(focusable);
    }
  }

  function handleKeyDown(e) {
    if (!_enabled) return;
    if (EPGVisible()) return;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        navigate(DIRECTION.UP);
        break;
      case 'ArrowDown':
        e.preventDefault();
        navigate(DIRECTION.DOWN);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        navigate(DIRECTION.LEFT);
        break;
      case 'ArrowRight':
        e.preventDefault();
        navigate(DIRECTION.RIGHT);
        break;
      case 'Enter':
        e.preventDefault();
        activateFocused();
        break;
      case 'Backspace':
      case 'Escape':
        e.preventDefault();
        handleBack();
        break;
    }
  }

  function EPGVisible() {
    return typeof window.EPGComponent !== 'undefined' && window.EPGComponent.isVisible();
  }

  function buildRowMap() {
    var focusables = document.querySelectorAll('[data-focusable]');
    if (!focusables.length) { _rowMap = []; return; }

    var rect;
    var rows = [];
    var currentRow = null;
    var ROW_THRESHOLD = 10;

    var sorted = Array.prototype.slice.call(focusables).filter(function (el) {
      rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && !el.disabled;
    });

    sorted.sort(function (a, b) {
      var ar = a.getBoundingClientRect();
      var br = b.getBoundingClientRect();
      var yDiff = ar.top - br.top;
      if (Math.abs(yDiff) < ROW_THRESHOLD) return ar.left - br.left;
      return yDiff;
    });

    for (var i = 0; i < sorted.length; i++) {
      var el = sorted[i];
      var elRect = el.getBoundingClientRect();
      var centerY = elRect.top + elRect.height / 2;

      if (!currentRow || Math.abs(centerY - currentRow.centerY) > ROW_THRESHOLD) {
        currentRow = { centerY: centerY, elements: [] };
        rows.push(currentRow);
      }
      currentRow.elements.push(el);
    }

    _rowMap = rows;
  }

  function findCurrentRow() {
    if (!_currentFocused) return -1;
    for (var i = 0; i < _rowMap.length; i++) {
      if (_rowMap[i].elements.indexOf(_currentFocused) > -1) return i;
    }
    return -1;
  }

  function findCurrentCol() {
    if (!_currentFocused) return -1;
    var rowIdx = findCurrentRow();
    if (rowIdx < 0) return -1;
    return _rowMap[rowIdx].elements.indexOf(_currentFocused);
  }

  function navigate(direction) {
    buildRowMap();
    if (!_rowMap.length) return;

    var rowIdx = findCurrentRow();
    var colIdx = findCurrentCol();

    if (rowIdx < 0 && _rowMap.length > 0) {
      focusElement(_rowMap[0].elements[0]);
      return;
    }

    var target = null;

    if (direction === DIRECTION.LEFT) {
      if (colIdx > 0) {
        target = _rowMap[rowIdx].elements[colIdx - 1];
      } else {
        for (var r = rowIdx - 1; r >= 0; r--) {
          var row = _rowMap[r];
          var best = findNearestInRow(row, _currentFocused, 'left');
          if (best) { target = best; break; }
        }
      }
    } else if (direction === DIRECTION.RIGHT) {
      if (colIdx < _rowMap[rowIdx].elements.length - 1) {
        target = _rowMap[rowIdx].elements[colIdx + 1];
      } else {
        for (var r2 = rowIdx + 1; r2 < _rowMap.length; r2++) {
          var row2 = _rowMap[r2];
          var best2 = findNearestInRow(row2, _currentFocused, 'right');
          if (best2) { target = best2; break; }
        }
      }
    } else if (direction === DIRECTION.UP) {
      for (var r3 = rowIdx - 1; r3 >= 0; r3--) {
        var bestUp = findBestInDirection(_rowMap[r3], _currentFocused, DIRECTION.UP);
        if (bestUp) { target = bestUp; break; }
      }
      if (!target && rowIdx > 0) {
        target = _rowMap[rowIdx - 1].elements[0];
      }
    } else if (direction === DIRECTION.DOWN) {
      for (var r4 = rowIdx + 1; r4 < _rowMap.length; r4++) {
        var bestDown = findBestInDirection(_rowMap[r4], _currentFocused, DIRECTION.DOWN);
        if (bestDown) { target = bestDown; break; }
      }
      if (!target && rowIdx < _rowMap.length - 1) {
        target = _rowMap[rowIdx + 1].elements[0];
      }
    }

    if (target) {
      focusElement(target);
    }
  }

  function findNearestInRow(row, currentEl, side) {
    var currentRect = currentEl.getBoundingClientRect();
    var currentCenterX = currentRect.left + currentRect.width / 2;
    var best = null;
    var bestDist = Infinity;

    for (var i = 0; i < row.elements.length; i++) {
      var el = row.elements[i];
      var rect = el.getBoundingClientRect();
      var centerX = rect.left + rect.width / 2;
      var dist = Math.abs(centerX - currentCenterX);

      if (dist < bestDist) {
        bestDist = dist;
        best = el;
      }
    }
    return best;
  }

  function findBestInDirection(row, currentEl, direction) {
    var currentRect = currentEl.getBoundingClientRect();
    var currentCX = currentRect.left + currentRect.width / 2;
    var best = null;
    var bestScore = Infinity;

    for (var i = 0; i < row.elements.length; i++) {
      var el = row.elements[i];
      var rect = el.getBoundingClientRect();
      var cx = rect.left + rect.width / 2;
      var dx = cx - currentCX;
      var absDx = Math.abs(dx);

      var dirMatch = true;
      if (direction === DIRECTION.UP || direction === DIRECTION.DOWN) {
        dirMatch = absDx < rect.width * 1.5;
      }
      if (direction === DIRECTION.LEFT && dx > 0) dirMatch = false;
      if (direction === DIRECTION.RIGHT && dx < 0) dirMatch = false;

      if (dirMatch) {
        var score = absDx;
        if (score < bestScore) {
          bestScore = score;
          best = el;
        }
      }
    }
    return best;
  }

  function focusElement(el) {
    if (!el) return;
    if (_currentFocused && _currentFocused !== el) {
      blurElement(_currentFocused);
    }
    _currentFocused = el;
    el.classList.add('focused');

    if (!el.getAttribute('tabindex') || el.getAttribute('tabindex') === '-1') {
      el.setAttribute('tabindex', '0');
    }

    el.focus({ preventScroll: true });
    scrollIntoViewSmart(el);
  }

  function blurElement(el) {
    if (!el) return;
    el.classList.remove('focused');
    el.blur();
    if (el === _currentFocused) _currentFocused = null;
  }

  function scrollIntoViewSmart(el) {
    var rect = el.getBoundingClientRect();
    var scrollParent = getScrollParent(el);
    if (!scrollParent) return;

    var parentRect = scrollParent.getBoundingClientRect();
    var padding = 40;

    if (rect.left < parentRect.left + padding) {
      scrollParent.scrollLeft -= (parentRect.left + padding - rect.left);
    } else if (rect.right > parentRect.right - padding) {
      scrollParent.scrollLeft += (rect.right - parentRect.right + padding);
    }

    if (rect.top < parentRect.top + padding) {
      scrollParent.scrollTop -= (parentRect.top + padding - rect.top);
    } else if (rect.bottom > parentRect.bottom - padding) {
      scrollParent.scrollTop += (rect.bottom - parentRect.bottom + padding);
    }
  }

  function getScrollParent(el) {
    var parent = el.parentElement;
    while (parent) {
      var style = window.getComputedStyle(parent);
      var overflow = style.overflow + style.overflowX + style.overflowY;
      if (overflow.indexOf('scroll') > -1 || overflow.indexOf('auto') > -1) {
        return parent;
      }
      if (parent === document.body) break;
      parent = parent.parentElement;
    }
    return window;
  }

  function activateFocused() {
    if (!_currentFocused) return;
    var event = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
    _currentFocused.dispatchEvent(event);
  }

  function handleBack() {
    var event = new CustomEvent('focus:back', { bubbles: true, cancelable: true, detail: { element: _currentFocused } });
    document.dispatchEvent(event);
  }

  function getCurrentFocused() {
    return _currentFocused;
  }

  function setEnabled(bool) {
    _enabled = !!bool;
  }

  function destroy() {
    _enabled = false;
    if (_mutationObserver) {
      _mutationObserver.disconnect();
      _mutationObserver = null;
    }
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('click', handleGlobalClick);
    if (_currentFocused) blurElement(_currentFocused);
    _rowMap = [];
  }

  if (!document.getElementById('focus-engine-styles')) {
    var style = document.createElement('style');
    style.id = 'focus-engine-styles';
    style.textContent =
      '[data-focusable]{outline:none;}' +
      '[data-focusable].focused{' +
        'box-shadow:0 0 0 3px rgba(59,130,246,0.6);' +
        'transform:scale(1.04);' +
        'transition:transform 0.2s cubic-bezier(0.22,1,0.36,1), box-shadow 0.2s;' +
        'z-index:10;position:relative;' +
      '}' +
      '[data-focusable]:not(.focused){' +
        'transition:transform 0.2s cubic-bezier(0.22,1,0.36,1), box-shadow 0.2s;' +
      '}' +
      '.channel-card[data-focusable].focused,' +
      '.series-card[data-focusable].focused,' +
      '.movie-card[data-focusable].focused{' +
        'transform:scale(1.06);' +
      '}' +
      '.channel-card-wide[data-focusable].focused{' +
        'transform:scale(1.03);' +
      '}' +
      '.episode-card[data-focusable].focused{' +
        'transform:scale(1.01);' +
      '}';
    document.head.appendChild(style);
  }

  window.FocusEngine = {
    init: init,
    navigate: navigate,
    focusElement: focusElement,
    blurElement: blurElement,
    getCurrentFocused: getCurrentFocused,
    setEnabled: setEnabled,
    buildRowMap: buildRowMap,
    destroy: destroy
  };
})();