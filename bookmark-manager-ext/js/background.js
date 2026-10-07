/**
 * background.js — Service Worker.
 *
 * Three jobs:
 *  1. Keep TagMark's tags/notes storage clean: whenever a bookmark is
 *     removed through ANY path (TagMark's own UI, chrome://bookmarks, or
 *     another extension), delete its now-orphaned metadata entry so it
 *     never silently accumulates forever.
 *  2. Keep the toolbar badge showing the total bookmark count.
 *  3. Handle the "Alt+Shift+M" keyboard shortcut: bookmark the active tab
 *     instantly without opening the popup, with a native notification.
 */

importScripts("storage.js");

chrome.runtime.onInstalled.addListener(async () => {
  const settings = await chrome.storage.local.get(DEFAULT_SETTINGS);
  await chrome.storage.local.set({ ...DEFAULT_SETTINGS, ...settings });
  refreshBadge();
});
chrome.runtime.onStartup.addListener(refreshBadge);

// ── 1. Orphaned metadata cleanup ────────────────────────────

chrome.bookmarks.onRemoved.addListener(async (id) => {
  await store.deleteMeta(id);
  refreshBadge();
});
chrome.bookmarks.onCreated.addListener(refreshBadge);
chrome.bookmarks.onImportEnded?.addListener(refreshBadge);

// ── 2. Toolbar badge ─────────────────────────────────────────

async function countBookmarks() {
  const tree = await chrome.bookmarks.getTree();
  let count = 0;
  (function walk(nodes) {
    for (const node of nodes) {
      if (node.url) count++;
      else if (node.children) walk(node.children);
    }
  })(tree);
  return count;
}

async function refreshBadge() {
  try {
    const count = await countBookmarks();
    await chrome.action.setBadgeText({ text: count > 0 ? String(count) : "" });
    await chrome.action.setBadgeBackgroundColor({ color: "#00695C" });
  } catch (_) {}
}

// ── 3. Keyboard shortcut: instant bookmark ──────────────────

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "quick-bookmark") return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url || !/^https?:|^ftp:|^file:/.test(tab.url)) return;

  // Avoid creating a duplicate if the active tab is already bookmarked —
  // just let the user know instead.
  const existing = await chrome.bookmarks.search({ url: tab.url });
  if (existing && existing.length > 0) {
    notify("TagMark", `${tab.title || tab.url} — already bookmarked`);
    return;
  }

  try {
    const settings = await chrome.storage.local.get(DEFAULT_SETTINGS);
    await chrome.bookmarks.create({
      parentId: settings.defaultFolderId || undefined,
      title: tab.title || tab.url,
      url: tab.url
    });
    notify("TagMark", `Bookmarked: ${tab.title || tab.url}`);
  } catch (_) {
    notify("TagMark", "Could not bookmark this page");
  }
});

function notify(title, message) {
  chrome.notifications?.create({
    type: "basic",
    iconUrl: "icons/icon48.png",
    title,
    message
  });
}
