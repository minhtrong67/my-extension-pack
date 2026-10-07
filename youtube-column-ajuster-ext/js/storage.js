/**
 * storage.js — single source of truth for persisted settings.
 *
 * Shared (via plain <script> includes, no bundler needed) by:
 *   - content.js   (reads settings to build the injected <style> tag)
 *   - popup.js     (quick-access controls)
 *   - options.js   (full settings page)
 *   - background.js (keyboard shortcut + action badge)
 *
 * All settings live under a single chrome.storage.local key so import/export
 * and chrome.storage.onChanged stay trivial (one blob in, one blob out).
 */

/** @type {Record<string, any>} */
const DEFAULT_SETTINGS = {
  // Master switch — lets the user disable every effect instantly without
  // uninstalling or losing their configured values.
  enabled: true,

  // UI preferences
  language: "en",
  theme: "system", // "system" | "light" | "dark"
  fontSize: "medium", // "small" | "medium" | "large"
  showPreview: true,

  // Grid column control
  useCustomColumns: false,
  columns: 5, // used when perPageColumns === false (applies everywhere)
  perPageColumns: false, // advanced mode: independent value per surface
  columnsHome: 5,
  columnsSubscriptions: 4,
  columnsChannel: 4,

  // Quick decluttering toggles
  hideShorts: false,
  compactCards: false,
  hideComments: false,
  hideEndCards: false,
  focusMode: false // hides the related-videos sidebar on watch pages
};

const SETTINGS_KEY = "yca_settings";
const SCHEMA_VERSION = 2;

function storageGet(keys) {
  return new Promise((resolve) => chrome.storage.local.get(keys, (result) => resolve(result)));
}
function storageSet(obj) {
  return new Promise((resolve) => chrome.storage.local.set(obj, () => resolve()));
}

const store = {
  /** Merge saved settings on top of defaults so new fields always exist. */
  async loadSettings() {
    const result = await storageGet([SETTINGS_KEY]);
    return { ...DEFAULT_SETTINGS, ...(result[SETTINGS_KEY] || {}) };
  },

  async saveSettings(settings) {
    await storageSet({ [SETTINGS_KEY]: settings });
    return settings;
  },

  async patchSettings(partial) {
    const current = await this.loadSettings();
    const next = { ...current, ...partial };
    await this.saveSettings(next);
    return next;
  },

  async resetSettings() {
    const next = { ...DEFAULT_SETTINGS };
    await this.saveSettings(next);
    return next;
  },

  /** Produce a portable JSON document a user can back up or share. */
  async exportAll() {
    const settings = await this.loadSettings();
    return {
      app: "YouTube Column Ajuster",
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      settings
    };
  },

  /** Validate + merge an imported document, tolerating older schema versions. */
  async importAll(data) {
    if (!data || typeof data !== "object" || typeof data.settings !== "object") {
      throw new Error("Invalid settings file");
    }
    const merged = { ...DEFAULT_SETTINGS, ...data.settings };
    await this.saveSettings(merged);
    return merged;
  }
};

// Expose the storage key so background.js can listen for the same event
// without duplicating the string literal everywhere.
if (typeof self !== "undefined") {
  self.YCA_SETTINGS_KEY = SETTINGS_KEY;
}
