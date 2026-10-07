// TubeShot — storage module
// Persists user settings and capture history via chrome.storage.local.

const DEFAULT_SETTINGS = {
  language: "en",
  theme: "system",
  fontSize: "medium",

  showHistory: true,
  historyLimit: 10,

  format: "png",
  quality: 90,
  scale: 100,
  watermarkTimestamp: true,
  captionInfo: false
};

const SETTINGS_KEY = "tubeshot_settings";
const HISTORY_KEY = "tubeshot_history";

function storageGet(keys) {
  return new Promise((resolve) => chrome.storage.local.get(keys, (result) => resolve(result)));
}
function storageSet(obj) {
  return new Promise((resolve) => chrome.storage.local.set(obj, () => resolve()));
}

const store = {
  async loadSettings() {
    const result = await storageGet([SETTINGS_KEY]);
    return { ...DEFAULT_SETTINGS, ...(result[SETTINGS_KEY] || {}) };
  },
  async saveSettings(settings) {
    await storageSet({ [SETTINGS_KEY]: settings });
  },
  async resetSettings() {
    await storageSet({ [SETTINGS_KEY]: DEFAULT_SETTINGS });
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
      app: "TubeShot",
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
  }
};
