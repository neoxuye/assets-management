(function () {
  'use strict';

  const SNAPSHOT_PATH = 'data/quarterly_snapshots.json';
  const SCRIPT_SNAPSHOT_SOURCE = 'data/quarterly_snapshots_latest.js';

  function fnv1a32(text) {
    let hash = 0x811c9dc5;
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return hash.toString(16).padStart(8, '0');
  }

  function normalizeSnapshots(raw) {
    const normalized = {};
    Object.entries(raw || {}).forEach(([key, snap]) => {
      if (!snap || typeof snap !== 'object') return;
      const period = snap.period || key;
      const yearMatch = String(period).match(/(\d{4})/);
      const inferredYear = yearMatch ? parseInt(yearMatch[1], 10) : 0;
      normalized[key] = {
        ...snap,
        period,
        year: Number(snap.year) || inferredYear,
        macroData: snap.macroData || snap.macro || {},
        macro: snap.macro || snap.macroData || {},
        actualReturns: snap.actualReturns || {},
      };
    });
    return normalized;
  }

  function applyCustomSnapshots() {
    try {
      if (typeof localStorage === 'undefined') return;
      const raw = localStorage.getItem('historicalSnapshots_custom');
      if (!raw || typeof window.loadCustomHistoricalSnapshots !== 'function') return;
      window.loadCustomHistoricalSnapshots(JSON.parse(raw));
    } catch (err) {
      console.warn('[SnapshotBridge] custom snapshots load failed:', err.message);
    }
  }

  function applyScriptSnapshots() {
    if (!window.DALLIO_LATEST_QUARTERLY_SNAPSHOTS) return null;
    const text = JSON.stringify(window.DALLIO_LATEST_QUARTERLY_SNAPSHOTS);
    const normalized = normalizeSnapshots(window.DALLIO_LATEST_QUARTERLY_SNAPSHOTS);
    window.historicalSnapshots = {
      ...(window.historicalSnapshots || {}),
      ...normalized,
    };
    window.__HISTORICAL_SNAPSHOT_SOURCE__ = SCRIPT_SNAPSHOT_SOURCE;
    window.__HISTORICAL_SNAPSHOT_CHECKSUM__ = fnv1a32(text);
    applyCustomSnapshots();
    window.dispatchEvent(new CustomEvent('historicalSnapshotsUpdated', {
      detail: {
        source: SCRIPT_SNAPSHOT_SOURCE,
        checksum: window.__HISTORICAL_SNAPSHOT_CHECKSUM__,
        count: Object.keys(window.historicalSnapshots || {}).length,
      },
    }));
    return normalized;
  }

  async function loadHistoricalSnapshotsFromJson() {
    const scriptSnapshots = applyScriptSnapshots();
    if (scriptSnapshots) return scriptSnapshots;
    try {
      const response = await fetch(SNAPSHOT_PATH);
      if (!response.ok) return null;
      const text = await response.text();
      const parsed = JSON.parse(text);
      const normalized = normalizeSnapshots(parsed);
      window.historicalSnapshots = normalized;
      window.__HISTORICAL_SNAPSHOT_SOURCE__ = SNAPSHOT_PATH;
      window.__HISTORICAL_SNAPSHOT_CHECKSUM__ = fnv1a32(text);
      applyCustomSnapshots();
      window.dispatchEvent(new CustomEvent('historicalSnapshotsUpdated', {
        detail: {
          source: SNAPSHOT_PATH,
          checksum: window.__HISTORICAL_SNAPSHOT_CHECKSUM__,
          count: Object.keys(normalized).length,
        },
      }));
      return normalized;
    } catch (err) {
      console.warn('[SnapshotBridge] failed to load quarterly snapshots:', err.message);
      return null;
    }
  }

  window.loadHistoricalSnapshotsFromJson = loadHistoricalSnapshotsFromJson;
  window.__historicalSnapshotsReady = loadHistoricalSnapshotsFromJson();
})();
