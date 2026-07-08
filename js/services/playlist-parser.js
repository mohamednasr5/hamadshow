/**
 * NASR LIVE - Playlist Parser
 *
 * Parses text-based playlist formats into a unified channel list:
 *   [{ name, url, logo, group }]
 *
 * Supported formats:
 *   - M3U / M3U8 / M3U Plus (#EXTM3U, #EXTINF with tvg-logo/group-title)
 *   - XSPF (XML Shareable Playlist Format)
 *   - PLS
 *   - ASX (Windows Media / Advanced Stream Redirector)
 *   - WPL (Windows Media Player Playlist, SMIL-based)
 *
 * Note: Xtream Codes API, Stalker/Ministra Portal, MAG Portal, and
 * Enigma2/Dreambox bouquets are NOT playlist files — they are separate
 * server protocols with their own authentication, and are implemented
 * as their own services (see xtream-api.js; others are separate phases).
 *
 * Exposed globally as: window.PlaylistParser
 */
(function () {
  'use strict';

  /** Detects the playlist format from its raw text content. */
  function detectFormat(text) {
    var head = text.slice(0, 2000);
    if (/^\s*#EXTM3U/i.test(text)) return 'm3u';
    if (/<\?xml[\s\S]*<playlist[\s\S]*xspf/i.test(head) || /<playlist[^>]*xmlns="http:\/\/xspf/i.test(head)) return 'xspf';
    if (/^\s*\[playlist\]/im.test(text)) return 'pls';
    if (/<asx[\s>]/i.test(head)) return 'asx';
    if (/<smil[\s>]/i.test(head) || /<\?wpl/i.test(head)) return 'wpl';
    return null;
  }

  /** M3U / M3U8 / M3U Plus */
  function parseM3U(text) {
    var lines = text.split(/\r?\n/);
    var items = [];
    var cur = null;
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) continue;
      if (line.indexOf('#EXTINF') === 0) {
        var namePart = line.substring(line.indexOf(',') + 1).trim();
        var logoMatch = line.match(/tvg-logo="([^"]*)"/i);
        var groupMatch = line.match(/group-title="([^"]*)"/i);
        var idMatch = line.match(/tvg-id="([^"]*)"/i);
        cur = {
          name: namePart || 'Untitled',
          logo: logoMatch ? logoMatch[1] : '',
          group: groupMatch ? groupMatch[1] : '',
          tvgId: idMatch ? idMatch[1] : ''
        };
      } else if (line.indexOf('#') === 0) {
        // Other directives (#EXTVLCOPT, #EXTGRP, #EXTM3U) - ignored
        continue;
      } else {
        // URL line
        if (!cur) cur = { name: 'Untitled', logo: '', group: '' };
        cur.url = line;
        items.push(cur);
        cur = null;
      }
    }
    return items;
  }

  /** XSPF (XML) */
  function parseXSPF(text) {
    var doc = new DOMParser().parseFromString(text, 'application/xml');
    var tracks = doc.getElementsByTagName('track');
    var items = [];
    for (var i = 0; i < tracks.length; i++) {
      var t = tracks[i];
      var loc = t.getElementsByTagName('location')[0];
      var title = t.getElementsByTagName('title')[0];
      var image = t.getElementsByTagName('image')[0];
      if (!loc || !loc.textContent) continue;
      items.push({
        name: title ? title.textContent.trim() : 'Untitled',
        url: loc.textContent.trim(),
        logo: image ? image.textContent.trim() : '',
        group: ''
      });
    }
    return items;
  }

  /** PLS (INI-style) */
  function parsePLS(text) {
    var lines = text.split(/\r?\n/);
    var files = {};
    var titles = {};
    lines.forEach(function (line) {
      var m = line.match(/^File(\d+)\s*=\s*(.+)$/i);
      if (m) { files[m[1]] = m[2].trim(); return; }
      var t = line.match(/^Title(\d+)\s*=\s*(.+)$/i);
      if (t) { titles[t[1]] = t[2].trim(); }
    });
    return Object.keys(files).map(function (idx) {
      return { name: titles[idx] || 'Untitled', url: files[idx], logo: '', group: '' };
    });
  }

  /** ASX (XML) */
  function parseASX(text) {
    var doc = new DOMParser().parseFromString(text, 'application/xml');
    var entries = doc.getElementsByTagName('entry');
    var items = [];
    for (var i = 0; i < entries.length; i++) {
      var e = entries[i];
      var ref = e.getElementsByTagName('ref')[0];
      var title = e.getElementsByTagName('title')[0];
      var url = ref ? (ref.getAttribute('href') || '') : '';
      if (!url) continue;
      items.push({ name: title ? title.textContent.trim() : 'Untitled', url: url, logo: '', group: '' });
    }
    return items;
  }

  /** WPL (SMIL-based XML) */
  function parseWPL(text) {
    var doc = new DOMParser().parseFromString(text, 'application/xml');
    var medias = doc.getElementsByTagName('media');
    var items = [];
    for (var i = 0; i < medias.length; i++) {
      var m = medias[i];
      var src = m.getAttribute('src');
      if (!src) continue;
      items.push({ name: src.split('/').pop(), url: src, logo: '', group: '' });
    }
    return items;
  }

  var PlaylistParser = {
    /** @returns {string|null} one of 'm3u'|'xspf'|'pls'|'asx'|'wpl' or null if unrecognized */
    detectFormat: detectFormat,

    /**
     * Parses playlist text into a unified item list.
     * @param {string} text - raw playlist content
     * @param {string} [format] - force a format instead of auto-detecting
     * @returns {{format:string, items:Array}}
     */
    parse(text, format) {
      var fmt = format || detectFormat(text);
      if (!fmt) {
        throw new Error('صيغة قائمة التشغيل غير معروفة أو غير مدعومة');
      }
      var items;
      switch (fmt) {
        case 'm3u': items = parseM3U(text); break;
        case 'xspf': items = parseXSPF(text); break;
        case 'pls': items = parsePLS(text); break;
        case 'asx': items = parseASX(text); break;
        case 'wpl': items = parseWPL(text); break;
        default: throw new Error('صيغة قائمة التشغيل غير مدعومة: ' + fmt);
      }
      if (!items.length) {
        throw new Error('لم يتم العثور على أي قنوات/روابط صالحة في هذه القائمة');
      }
      // Assign stable ids
      items.forEach(function (it, idx) { it.id = 'pl_' + idx; });
      return { format: fmt, items: items };
    }
  };

  window.PlaylistParser = PlaylistParser;
})();
