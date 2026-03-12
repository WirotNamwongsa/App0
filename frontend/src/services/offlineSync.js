// src/services/offlineSync.js
const QUEUE_KEY = 'scan_queue';
const CACHE_KEY = 'scout_cache';
const SCHEDULE_CACHE_KEY = 'schedule_cache';

export const offlineSync = {
  // Queue a scan for later sync
  queueScan(scan) {
    const queue = this.getQueue();
    queue.push({ ...scan, scannedAt: new Date().toISOString(), id: Date.now() });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  },

  getQueue() {
    try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); }
    catch { return []; }
  },

  clearQueue() {
    localStorage.removeItem(QUEUE_KEY);
  },

  // Cache scout data for offline lookups
  cacheScouts(scouts) {
    const map = {};
    scouts.forEach(s => { map[s.qrToken] = s; });
    localStorage.setItem(CACHE_KEY, JSON.stringify(map));
  },

  lookupScout(qrToken) {
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      return cache[qrToken] || null;
    } catch { return null; }
  },

  // Cache schedule's expected attendees
  cacheSchedule(scheduleId, scoutIds) {
    try {
      const cache = JSON.parse(localStorage.getItem(SCHEDULE_CACHE_KEY) || '{}');
      cache[scheduleId] = scoutIds;
      localStorage.setItem(SCHEDULE_CACHE_KEY, JSON.stringify(cache));
    } catch {}
  },

  isScoutInSchedule(scheduleId, scoutId) {
    try {
      const cache = JSON.parse(localStorage.getItem(SCHEDULE_CACHE_KEY) || '{}');
      return (cache[scheduleId] || []).includes(scoutId);
    } catch { return false; }
  },

  // Track scanned IDs offline to prevent duplicate
  SCANNED_KEY: 'scanned_offline',

  markScanned(scheduleId, scoutId) {
    try {
      const scanned = JSON.parse(localStorage.getItem(this.SCANNED_KEY) || '{}');
      if (!scanned[scheduleId]) scanned[scheduleId] = [];
      scanned[scheduleId].push(scoutId);
      localStorage.setItem(this.SCANNED_KEY, JSON.stringify(scanned));
    } catch {}
  },

  isAlreadyScanned(scheduleId, scoutId) {
    try {
      const scanned = JSON.parse(localStorage.getItem(this.SCANNED_KEY) || '{}');
      return (scanned[scheduleId] || []).includes(scoutId);
    } catch { return false; }
  },

  clearScannedCache() {
    localStorage.removeItem(this.SCANNED_KEY);
  },
};

export const useOnlineStatus = () => {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
};
