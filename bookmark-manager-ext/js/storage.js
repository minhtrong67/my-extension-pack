/**
 * storage.js — everything TagMark itself persists in chrome.storage.local.
 *
 * Two separate keys:
 *  - SETTINGS_KEY  → user preferences (theme, language, default view, etc.)
 *  - META_KEY       → { [bookmarkId]: { tags: string[], note: string } }
 *
 * Metadata is keyed by the bookmark's own chrome.bookmarks id (not its URL),
 * so two different bookmarks that happen to point at the same URL (a
 * duplicate) can carry independent tags/notes — and background.js cleans up
 * the matching entry whenever chrome.bookmarks.onRemoved fires, so this
 * object never accumulates orphaned entries for bookmarks that no longer
 * exist.
 */

const DEFAULT_SETTINGS = {
  theme: "system",       // "system" | "light" | "dark"
  language: "system",    // "system" | "en" | "vi"
  fontSize: "medium",    // "small" | "medium" | "large"
  defaultView: "list",   // "list" | "grid"
  defaultSort: "dateAdded", // "dateAdded" | "titleAsc" | "titleDesc"
  showFavicons: true,
  showTags: true,
  showFolderPath: true,
  defaultFolderId: ""    // "" = let Chrome pick (Bookmarks Bar)
};

const SETTINGS_KEY = "tagmark_settings";
const META_KEY = "tagmark_meta";

function storageGet(keys) {
  return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
}
function storageSet(obj) {
  return new Promise((resolve) => chrome.storage.local.set(obj, resolve));
}

const store = {
  async loadSettings() {
    const res = await storageGet([SETTINGS_KEY]);
    return { ...DEFAULT_SETTINGS, ...(res[SETTINGS_KEY] || {}) };
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

  /** The full { [bookmarkId]: {tags, note} } map. */
  async loadAllMeta() {
    const res = await storageGet([META_KEY]);
    return res[META_KEY] || {};
  },
  async saveAllMeta(meta) {
    await storageSet({ [META_KEY]: meta });
    return meta;
  },
  async getMeta(bookmarkId) {
    const all = await this.loadAllMeta();
    return all[bookmarkId] || { tags: [], note: "" };
  },
  async setMeta(bookmarkId, meta) {
    const all = await this.loadAllMeta();
    const hasContent = (meta.tags && meta.tags.length) || (meta.note && meta.note.trim());
    if (hasContent) {
      all[bookmarkId] = { tags: meta.tags || [], note: meta.note || "" };
    } else {
      // No tags and no note — drop the entry entirely rather than keeping
      // an empty {tags:[], note:""} record around forever.
      delete all[bookmarkId];
    }
    await this.saveAllMeta(all);
    return all;
  },
  async deleteMeta(bookmarkId) {
    const all = await this.loadAllMeta();
    if (all[bookmarkId]) {
      delete all[bookmarkId];
      await this.saveAllMeta(all);
    }
    return all;
  },
  /** Bulk-delete metadata for several bookmark ids at once (bulk delete UX). */
  async deleteMetaMany(bookmarkIds) {
    const all = await this.loadAllMeta();
    let changed = false;
    for (const id of bookmarkIds) {
      if (all[id]) { delete all[id]; changed = true; }
    }
    if (changed) await this.saveAllMeta(all);
    return all;
  },

  /** Portable backup: settings + every tag/note entry. */
  async exportAll() {
    const [settings, meta] = await Promise.all([this.loadSettings(), this.loadAllMeta()]);
    return {
      app: "TagMark",
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      settings,
      meta
    };
  },

  /** Merge an imported settings+meta document on top of what's here now. */
  async importSettingsAndMeta(data) {
    if (!data || typeof data !== "object") throw new Error("Invalid file");
    if (data.settings) await this.saveSettings({ ...DEFAULT_SETTINGS, ...data.settings });
    if (data.meta) {
      const current = await this.loadAllMeta();
      await this.saveAllMeta({ ...current, ...data.meta });
    }
  }
};

if (typeof self !== "undefined") {
  self.TAGMARK_SETTINGS_KEY = SETTINGS_KEY;
  self.TAGMARK_META_KEY = META_KEY;
}
