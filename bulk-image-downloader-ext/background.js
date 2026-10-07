// background.js — Service Worker
//
// Classic (non-module) service worker, so it can importScripts() the exact
// same shared.js used by popup.js/options.js — this is what guarantees the
// right-click menu and the popup's bulk-save always agree on "does this
// image get converted to JPG, or downloaded as-is?" (see shouldConvertExt
// in shared.js). Previously this file carried its own duplicated copy of
// the filename/folder helpers, which is exactly how the convert-toggle bug
// slipped in: the popup and the context menu quietly drifted apart.
importScripts("shared.js");

chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  await chrome.storage.sync.set({ ...DEFAULT_SETTINGS, ...stored });
  createContextMenu();
});

chrome.runtime.onStartup.addListener(() => {
  createContextMenu();
});

function createContextMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "saveWithPixGrab",
      title: "Save Image with PixGrab",
      contexts: ["image"]
    });
  });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "saveWithPixGrab" && info.srcUrl) {
    await processImage(info.srcUrl, tab);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SAVE_IMAGE") {
    processImage(message.url, null, message.saveAs).then(result => {
      sendResponse({ success: true, result });
    }).catch(err => {
      sendResponse({ success: false, error: err.message });
    });
    return true;
  }
});

async function processImage(srcUrl, tab, forceSaveAs) {
  const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);

  const tabId = tab ? tab.id : (await getActiveTab())?.id;
  if (!tabId) return;

  // Right-click works on ANY image on the page, not just the pre-filtered
  // popup list, so the format gate has to be enforced here too. Checked
  // before the (network) dimension check since it's free — just a URL
  // extension look-up.
  const ext = getExtFromUrl(srcUrl);
  if (!isAllowedExt(ext)) {
    chrome.notifications?.create({
      type: "basic",
      iconUrl: "icons/icon48.png",
      title: "PixGrab",
      message: "Skipped — only PNG, JPG, or WebP images are supported"
    });
    return { skipped: true, reason: "FORMAT_NOT_ALLOWED" };
  }

  // Read the image's real decoded pixels — never trust the DOM/CSS box
  // size — so we know whether it already meets the 512x512-min /
  // 3:1-max-ratio requirement or needs auto-cropping/upscaling to get there.
  let dims = { w: 0, h: 0 };
  try {
    const dimResult = await chrome.scripting.executeScript({
      target: { tabId },
      func: checkImageDimensions,
      args: [srcUrl]
    });
    dims = dimResult?.[0]?.result || { w: 0, h: 0 };
  } catch (_) {}

  const crop = computeCropAndScale(dims.w, dims.h);
  if (!crop) {
    chrome.notifications?.create({
      type: "basic",
      iconUrl: "icons/icon48.png",
      title: "PixGrab",
      message: "Skipped — couldn't read image dimensions"
    });
    return { skipped: true, reason: "PROCESSING_FAILED", w: dims.w, h: dims.h };
  }
  const needsFix = !meetsImageRequirements(dims.w, dims.h);

  // saveAs dialog: always open when mode is "ask", or when explicitly forced
  const openSaveAs = forceSaveAs || settings.saveMode === "ask";

  const convert = shouldConvertExt(ext, settings);
  const finalExt = convert ? "jpg" : ext;

  // Only fire up the canvas when we actually need to change bytes: either
  // the user wants this format converted to JPG, or the image doesn't meet
  // the size/ratio requirement and has to be auto-cropped/scaled to fit.
  // Otherwise the plain file downloads untouched — fastest path, and
  // avoids a needless re-encode.
  let dataUrl = null;
  if (convert || needsFix) {
    const outMime = convert ? "image/jpeg" : MIME_FOR_EXT[ext];
    try {
      const result = await chrome.scripting.executeScript({
        target: { tabId },
        func: processImageForDownload,
        args: [srcUrl, crop, outMime, settings.quality]
      });
      dataUrl = result?.[0]?.result || null;
    } catch (_) {}

    if (!dataUrl && needsFix) {
      // Couldn't crop/scale (most likely a cross-origin canvas taint) and
      // the original doesn't meet the size/ratio requirement on its own —
      // downloading it unmodified would violate that requirement, so skip
      // instead of silently delivering a non-conforming file.
      chrome.notifications?.create({
        type: "basic",
        iconUrl: "icons/icon48.png",
        title: "PixGrab",
        message: "Skipped — couldn't auto-fix this image (cross-origin restriction)"
      });
      return { skipped: true, reason: "PROCESSING_FAILED", w: dims.w, h: dims.h };
    }
    // convert was requested but failed and the original already meets the
    // requirement on its own — fall back to the original file below.
  }

  const filename = buildDownloadPath(srcUrl, settings, finalExt);

  try {
    await chrome.downloads.download({
      url: dataUrl || srcUrl,
      filename: dataUrl ? filename : undefined,
      conflictAction: openSaveAs ? undefined : settings.conflictAction,
      saveAs: openSaveAs
    });

    if (!openSaveAs && settings.showNotification) {
      chrome.notifications?.create({
        type: "basic",
        iconUrl: "icons/icon48.png",
        title: "PixGrab",
        message: `Saved: ${filename.split("/").pop()}`
      });
    }
  } catch (err) {
    console.error("download error:", err);
    // Fallback without filename
    chrome.downloads.download({ url: srcUrl, saveAs: openSaveAs });
  }
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}
