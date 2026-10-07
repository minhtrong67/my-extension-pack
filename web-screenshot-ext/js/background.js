// SmartShot — background service worker
// Author: gnort67

importScripts("storage.js");

const OFFSCREEN_URL = "offscreen.html";
const CAPTURE_MIN_DELAY = 550; // stay comfortably under chrome.tabs.captureVisibleTab's rate limit

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
      reasons: ["BLOBS", "CLIPBOARD"],
      justification: "Crop/stitch/encode captured screenshots and copy them to the clipboard."
    })
    .catch((err) => {
      if (!String(err).includes("single offscreen")) throw err;
    })
    .finally(() => {
      creatingOffscreen = null;
    });
  await creatingOffscreen;
}

async function sendToOffscreen(type, payload) {
  await ensureOffscreenDocument();
  return chrome.runtime.sendMessage({ target: "offscreen", type, payload });
}

/* ============ Content script helpers ============ */

async function ensureContentScript(tabId) {
  await chrome.scripting.executeScript({ target: { tabId }, files: ["js/content.js"] });
}

function sendToContent(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });
}

/* ============ Capture flows ============ */

async function captureVisible(tab, settings) {
  const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" });
  return sendToOffscreen("encode-image", {
    dataUrl,
    format: settings.format,
    quality: settings.quality / 100
  });
}

async function captureArea(tab, settings) {
  await ensureContentScript(tab.id);
  const selection = await sendToContent(tab.id, { target: "content", type: "start-area-selection" });
  if (!selection || !selection.ok) return { cancelled: true };

  const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" });
  return sendToOffscreen("crop-image", {
    dataUrl,
    rect: selection.rect,
    dpr: selection.dpr,
    format: settings.format,
    quality: settings.quality / 100
  });
}

async function captureFullPage(tab, settings) {
  await ensureContentScript(tab.id);
  const metrics = await sendToContent(tab.id, { target: "content", type: "get-page-metrics" });
  const { totalHeight, viewportHeight, viewportWidth, dpr, originalScrollY, originalScrollX } = metrics;

  const steps = [];
  let y = 0;
  while (true) {
    steps.push(Math.max(0, Math.min(y, totalHeight - viewportHeight)));
    if (y + viewportHeight >= totalHeight) break;
    y += viewportHeight;
  }
  const uniqueSteps = steps.filter((v, i) => i === 0 || v !== steps[i - 1]);

  const delay = Math.max(settings.fullPageDelay, CAPTURE_MIN_DELAY);
  const pieces = [];

  for (let i = 0; i < uniqueSteps.length; i++) {
    const targetY = uniqueSteps[i];
    await sendToContent(tab.id, { target: "content", type: "scroll-to", x: 0, y: targetY });
    await sleep(delay);
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" });
    pieces.push({ dataUrl, y: targetY });
  }

  await sendToContent(tab.id, {
    target: "content",
    type: "restore-scroll",
    x: originalScrollX,
    y: originalScrollY
  });

  return sendToOffscreen("stitch-images", {
    pieces,
    totalWidth: viewportWidth,
    totalHeight,
    dpr,
    format: settings.format,
    quality: settings.quality / 100
  });
}

/* ============ Filename & badge helpers ============ */

function extFor(format) {
  return format === "jpeg" ? "jpg" : "png";
}

function generateFilename(type, format) {
  const now = new Date();
  const stamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return `smartshot-${type}-${stamp}.${extFor(format)}`;
}

function flashBadge(text, color) {
  chrome.action.setBadgeBackgroundColor({ color: color || "#2E9E5B" });
  chrome.action.setBadgeText({ text });
  setTimeout(() => chrome.action.setBadgeText({ text: "" }), 2200);
}

/* ============ Main entry point ============ */

async function performCapture(captureType) {
  const settings = await store.loadSettings();
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;

  try {
    let result;
    if (captureType === "visible") result = await captureVisible(tab, settings);
    else if (captureType === "area") result = await captureArea(tab, settings);
    else if (captureType === "fullpage") result = await captureFullPage(tab, settings);
    else return;

    if (result && result.cancelled) return;
    if (!result || !result.ok) {
      throw new Error((result && result.error) || "Capture failed");
    }

    if (settings.openEditorAfterCapture) {
      await store.setPendingCapture({
        dataUrl: result.dataUrl,
        thumbnail: result.thumbnail,
        captureType,
        width: result.width,
        height: result.height
      });
      await chrome.tabs.create({ url: chrome.runtime.getURL("editor.html") });
      flashBadge("\u2713", "#2E9E5B");
      return;
    }

    const filename = generateFilename(captureType, settings.format);

    if (settings.afterCapture === "clipboard") {
      await sendToOffscreen("copy-to-clipboard", { dataUrl: result.dataUrl });
    } else {
      // No directory prefix and saveAs left unset (false) — Chrome saves this
      // straight into the user's default Downloads folder.
      await chrome.downloads.download({ url: result.dataUrl, filename, saveAs: false });
    }

    await store.addToHistory(
      {
        captureType,
        filename: settings.afterCapture === "clipboard" ? null : filename,
        format: settings.format,
        action: settings.afterCapture,
        thumbnail: result.thumbnail
      },
      settings.historyLimit
    );

    flashBadge("\u2713", "#2E9E5B");
  } catch (err) {
    flashBadge("!", "#E0522E");
  }
}

/* ============ Messages from popup / editor ============ */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === "capture" && message.captureType) {
    performCapture(message.captureType);
    sendResponse({ ok: true });
    return true;
  }

  if (message && message.type === "copy-to-clipboard-request") {
    sendToOffscreen("copy-to-clipboard", { dataUrl: message.dataUrl })
      .then((res) => sendResponse(res))
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true;
  }

  return false;
});
