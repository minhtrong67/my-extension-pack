// PixFlip — background service worker
// Author: gnort67

importScripts("storage.js");

const MENU_PARENT_ID = "save-image-as-parent";
const OFFSCREEN_URL = "offscreen.html";

/* ============ Offscreen document lifecycle ============ */

let creatingOffscreen = null;

async function hasOffscreenDocument() {
  if (chrome.runtime.getContexts) {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ["OFFSCREEN_DOCUMENT"],
      documentUrls: [chrome.runtime.getURL(OFFSCREEN_URL)]
    });
    return contexts.length > 0;
  }
  // Fallback for older Chrome without getContexts: best-effort.
  return false;
}

async function ensureOffscreenDocument() {
  if (await hasOffscreenDocument()) return;

  if (creatingOffscreen) {
    await creatingOffscreen;
    return;
  }

  creatingOffscreen = chrome.offscreen
    .createDocument({
      url: OFFSCREEN_URL,
      reasons: ["BLOBS"],
      justification: "Decode and re-encode images (fetch + canvas) to save them in another format."
    })
    .catch((err) => {
      // Chrome throws if a document already exists (race condition) — safe to ignore.
      if (!String(err).includes("single offscreen")) throw err;
    })
    .finally(() => {
      creatingOffscreen = null;
    });

  await creatingOffscreen;
}

async function convertViaOffscreen(payload) {
  await ensureOffscreenDocument();
  return chrome.runtime.sendMessage({ target: "offscreen", type: "convert-image", payload });
}

/* ============ Context menus ============ */

function buildMenuChildren(settings) {
  const children = [];
  if (settings.menuOriginal) children.push({ id: "save-original", format: "original", labelKey: "menuOriginal" });
  if (settings.menuPng) children.push({ id: "save-png", format: "png", labelKey: "menuPng" });
  if (settings.menuJpeg) children.push({ id: "save-jpeg", format: "jpeg", labelKey: "menuJpeg" });
  if (settings.menuWebp) children.push({ id: "save-webp", format: "webp", labelKey: "menuWebp" });
  return children;
}

const MENU_LABELS = {
  en: {
    parent: "Save Image As",
    menuOriginal: "Original format",
    menuPng: "PNG",
    menuJpeg: "JPEG",
    menuWebp: "WEBP"
  },
  vi: {
    parent: "Lưu Ảnh Dưới Dạng",
    menuOriginal: "Định dạng gốc",
    menuPng: "PNG",
    menuJpeg: "JPEG",
    menuWebp: "WEBP"
  }
};

async function rebuildContextMenus() {
  const settings = await store.loadSettings();
  const labels = MENU_LABELS[settings.language] || MENU_LABELS.en;

  await new Promise((resolve) => chrome.contextMenus.removeAll(resolve));

  chrome.contextMenus.create({
    id: MENU_PARENT_ID,
    title: labels.parent,
    contexts: ["image"]
  });

  const children = buildMenuChildren(settings);
  children.forEach((child) => {
    chrome.contextMenus.create({
      id: child.id,
      parentId: MENU_PARENT_ID,
      title: labels[child.labelKey],
      contexts: ["image"]
    });
  });
}

/* ============ Filename helpers ============ */

function sanitizeFilename(name) {
  return (
    name
      .replace(/[\\/:*?"<>|]+/g, "_")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120) || "image"
  );
}

function baseNameFromUrl(url) {
  try {
    const u = new URL(url);
    const last = u.pathname.split("/").filter(Boolean).pop() || "image";
    const decoded = decodeURIComponent(last);
    const withoutExt = decoded.replace(/\.[a-zA-Z0-9]+$/, "");
    return sanitizeFilename(withoutExt || "image");
  } catch (e) {
    return "image";
  }
}

/* ============ Notifications & badge feedback ============ */

// Tracks the pending "clear the badge" timer so that two saves firing in
// quick succession can't race each other — without this, an earlier save's
// timeout could fire *after* a later save's badge was set, clearing it
// prematurely and leaving the user without feedback for the second save.
let badgeClearTimer = null;

function flashBadge(text, color) {
  chrome.action.setBadgeBackgroundColor({ color: color || "#2E9E5B" });
  chrome.action.setBadgeText({ text });
  clearTimeout(badgeClearTimer);
  badgeClearTimer = setTimeout(() => chrome.action.setBadgeText({ text: "" }), 2200);
}

function notify(titleKey, messageKey, lang) {
  const titles = {
    en: { done: "Image saved", failed: "Save failed" },
    vi: { done: "Đã lưu ảnh", failed: "Lưu ảnh thất bại" }
  };
  const messages = {
    en: { done: "Your image was converted and downloaded.", failed: "Could not convert or download this image." },
    vi: { done: "Ảnh đã được chuyển đổi và tải xuống.", failed: "Không thể chuyển đổi hoặc tải ảnh này." }
  };
  const set = titles[lang] || titles.en;
  const msgSet = messages[lang] || messages.en;
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icons/icon128.png",
    title: set[titleKey],
    message: msgSet[messageKey]
  });
}

/* ============ Core save flow (shared by context menu) ============ */

async function saveImageFromUrl(imageUrl, format, source) {
  const settings = await store.loadSettings();
  try {
    const result = await convertViaOffscreen({
      url: imageUrl,
      format,
      quality: settings.defaultQuality
    });

    if (!result || !result.ok) {
      throw new Error((result && result.error) || "Unknown conversion error");
    }

    const filename = `${baseNameFromUrl(imageUrl)}.${result.ext}`;

    await chrome.downloads.download({
      url: result.dataUrl,
      filename,
      saveAs: settings.askFilename
    });

    await store.addToHistory(
      {
        source,
        originalUrl: imageUrl,
        filename,
        format,
        thumbnail: result.thumbnail
      },
      settings.historyLimit
    );

    flashBadge("✓", "#2E9E5B");
    if (settings.showNotification) notify("done", "done", settings.language);
  } catch (err) {
    flashBadge("!", "#E0522E");
    if (settings.showNotification) notify("failed", "failed", settings.language);
  }
}

/* ============ Event wiring ============ */

chrome.runtime.onInstalled.addListener(() => {
  rebuildContextMenus();
});

chrome.runtime.onStartup.addListener(() => {
  rebuildContextMenus();
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (!info.srcUrl) return;
  const map = {
    "save-original": "original",
    "save-png": "png",
    "save-jpeg": "jpeg",
    "save-webp": "webp"
  };
  const format = map[info.menuItemId];
  if (!format) return;
  saveImageFromUrl(info.srcUrl, format, "context-menu");
});

// Messages from the popup (settings changes that affect the menu, a request
// to re-run a past context-menu conversion, or manual history writes).
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === "rebuild-context-menus") {
    rebuildContextMenus().then(() => sendResponse({ ok: true }));
    return true;
  }
  if (message && message.type === "redo-save" && message.payload) {
    saveImageFromUrl(message.payload.url, message.payload.format, "context-menu")
      .then(() => sendResponse({ ok: true }));
    return true;
  }
  return false;
});
