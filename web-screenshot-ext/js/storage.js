// SmartShot — storage module
// Persists user settings and history via chrome.storage.local.
// Shared between popup.html, editor.html (via <script>) and background.js (via importScripts).

const DEFAULT_SETTINGS = {
  language: "en",
  theme: "system",
  fontSize: "medium",

  showHistory: true,
  historyLimit: 10,

  format: "png",
  quality: 90,
  fullPageDelay: 350,
  openEditorAfterCapture: false,
  afterCapture: "download" // "download" | "clipboard" (only used when the editor is off)
};

const STORAGE_KEY = "smartshot_settings";
const HISTORY_KEY = "smartshot_history";
const PENDING_KEY = "smartshot_pending_capture";

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

const store = {
  async loadSettings() {
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
      app: "SmartShot",
      version: "1.0.0",
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
  },

  // "Pending capture" is the hand-off channel between background (which just
  // captured/stitched an image) and editor.html (which opens to annotate it).
  // Uses chrome.storage.session when available so large image data URLs never
  // touch disk and are cleared automatically when the browser session ends.
  async setPendingCapture(payload) {
    const area = chrome.storage.session || chrome.storage.local;
    await new Promise((resolve) => area.set({ [PENDING_KEY]: payload }, resolve));
  },

  async takePendingCapture() {
    const area = chrome.storage.session || chrome.storage.local;
    const result = await new Promise((resolve) => area.get([PENDING_KEY], resolve));
    await new Promise((resolve) => area.remove([PENDING_KEY], resolve));
    return result[PENDING_KEY] || null;
  }
};
