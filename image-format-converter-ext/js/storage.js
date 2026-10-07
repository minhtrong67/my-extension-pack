// PixFlip — storage module
// Persists user settings and history via chrome.storage.local.
// Shared between popup.html (via <script>) and background.js (via importScripts).

const DEFAULT_SETTINGS = {
  language: "en",
  theme: "system",
  fontSize: "medium",

  showHistory: true,
  historyLimit: 10,

  defaultFormat: "png",
  defaultQuality: 90,

  askFilename: false,
  showNotification: true,

  menuOriginal: true,
  menuPng: true,
  menuJpeg: true,
  menuWebp: true
};

const STORAGE_KEY = "pixflip_settings";
const HISTORY_KEY = "pixflip_history";
const LEGACY_STORAGE_KEY = "saveimageas_settings";
const LEGACY_HISTORY_KEY = "saveimageas_history";

const hasChromeStorage = typeof chrome !== "undefined" && chrome.storage && chrome.storage.local;

function storageGet(keys) {
  return new Promise((resolve) => {
    if (hasChromeStorage) {
      chrome.storage.local.get(keys, (result) => resolve(result));
    } else {
      const result = {};
      const keyList = Array.isArray(keys) ? keys : [keys];
      keyList.forEach((k) => {
        const raw = localStorage.getItem(k);
        if (raw !== null) {
          try { result[k] = JSON.parse(raw); } catch (e) { result[k] = raw; }
        }
      });
      resolve(result);
    }
  });
}

function storageSet(obj) {
  return new Promise((resolve) => {
    if (hasChromeStorage) {
      chrome.storage.local.set(obj, () => resolve());
    } else {
      Object.keys(obj).forEach((k) => localStorage.setItem(k, JSON.stringify(obj[k])));
      resolve();
    }
  });
}

/**
 * One-time migration for people upgrading from SaveImageAs (this
 * extension's previous name): if the new "pixflip_*" keys are empty but
 * the old "saveimageas_*" keys still hold data, copy it over once so
 * nobody's saved settings or history silently vanish because of the rename.
 */
let _migrationChecked = false;
async function migrateLegacyKeys() {
  if (_migrationChecked) return;
  _migrationChecked = true;
  try {
    const [newData, oldData] = await Promise.all([
      storageGet([STORAGE_KEY, HISTORY_KEY]),
      storageGet([LEGACY_STORAGE_KEY, LEGACY_HISTORY_KEY])
    ]);
    const patch = {};
    if (!newData[STORAGE_KEY] && oldData[LEGACY_STORAGE_KEY]) {
      patch[STORAGE_KEY] = oldData[LEGACY_STORAGE_KEY];
    }
    if (!newData[HISTORY_KEY] && oldData[LEGACY_HISTORY_KEY]) {
      patch[HISTORY_KEY] = oldData[LEGACY_HISTORY_KEY];
    }
    if (Object.keys(patch).length > 0) await storageSet(patch);
  } catch (_) {
    // Best-effort only — a failed migration should never block the app.
  }
}

const store = {
  async loadSettings() {
    await migrateLegacyKeys();
    const result = await storageGet([STORAGE_KEY]);
    const saved = result[STORAGE_KEY] || {};
    return { ...DEFAULT_SETTINGS, ...saved };
  },

  async saveSettings(settings) {
    await storageSet({ [STORAGE_KEY]: settings });
  },

  async resetSettings() {
    await storageSet({ [STORAGE_KEY]: DEFAULT_SETTINGS });
    return { ...DEFAULT_SETTINGS };
  },

  async loadHistory() {
    await migrateLegacyKeys();
    const result = await storageGet([HISTORY_KEY]);
    return result[HISTORY_KEY] || [];
  },

  async saveHistory(history) {
    await storageSet({ [HISTORY_KEY]: history });
  },

  async addToHistory(entry, limit) {
    const history = await this.loadHistory();
    history.unshift({ ...entry, ts: Date.now() });
    const trimmed = history.slice(0, limit);
    await this.saveHistory(trimmed);
    return trimmed;
  },

  async clearHistory() {
    await this.saveHistory([]);
  },

  async exportAll() {
    const settings = await this.loadSettings();
    const history = await this.loadHistory();
    return {
      app: "PixFlip",
      version: "2.0.0",
      exportedAt: new Date().toISOString(),
      settings,
      history
    };
  },

  async importAll(data) {
    if (!data || typeof data !== "object" || !data.settings) {
      throw new Error("Invalid file");
    }
    const mergedSettings = { ...DEFAULT_SETTINGS, ...data.settings };
    await this.saveSettings(mergedSettings);
    if (Array.isArray(data.history)) {
      await this.saveHistory(data.history);
    }
    return mergedSettings;
  }
};
