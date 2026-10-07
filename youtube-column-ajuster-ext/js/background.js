/**
 * background.js — Manifest V3 service worker.
 * Responsibilities:
 *   1. Keep the toolbar badge in sync with the current column count.
 *   2. Handle the "Alt+Shift+Y" keyboard shortcut (toggle custom columns).
 *   3. Open a friendly landing page tab the first time the extension is
 *      installed (never on plain updates, to avoid annoying returning users).
 *
 * Runs on the same DEFAULT_SETTINGS / SETTINGS_KEY contract as storage.js;
 * we re-declare a minimal local copy here because MV3 service workers can't
 * `import` classic scripts without an ES-module manifest entry, and pulling
 * in the whole storage.js file for two constants isn't worth the coupling.
 */

const SETTINGS_KEY = "yca_settings";
const DEFAULTS = { enabled: true, useCustomColumns: false, columns: 5 };

function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get([SETTINGS_KEY], (result) => {
      resolve({ ...DEFAULTS, ...(result[SETTINGS_KEY] || {}) });
    });
  });
}
function setSettings(next) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [SETTINGS_KEY]: next }, resolve);
  });
}

/** Show the active column count on the toolbar icon, or clear it. */
async function refreshBadge() {
  const s = await getSettings();
  const showBadge = s.enabled && s.useCustomColumns;
  await chrome.action.setBadgeText({ text: showBadge ? String(s.columns) : "" });
  await chrome.action.setBadgeBackgroundColor({ color: "#47519C" });
}

chrome.runtime.onInstalled.addListener((details) => {
  refreshBadge();
  if (details.reason === "install") {
    chrome.tabs.create({ url: chrome.runtime.getURL("landing.html") });
  }
});
chrome.runtime.onStartup.addListener(refreshBadge);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes[SETTINGS_KEY]) refreshBadge();
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle-custom-columns") return;
  const s = await getSettings();
  await setSettings({ ...s, useCustomColumns: !s.useCustomColumns });
});
