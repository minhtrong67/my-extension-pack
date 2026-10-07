// PixFlip — popup main script
// Author: gnort67

let settings = { ...DEFAULT_SETTINGS };
let currentHistoryCache = [];

// The queue of images loaded into the manual converter tool. Each entry:
// { id, blob, objectUrl, name, width, height, size, aspect }
// A single queued image behaves exactly like the old single-image tool
// (direct download, custom filename, optional resize); two or more queued
// images switch to batch mode (shared format/quality, original names,
// bundled into one .zip download — see convertAndDownload()).
let imageQueue = [];
let queueIdSeq = 0;

const el = (id) => document.getElementById(id);

const refs = {
  viewConverter: el("view-converter"),
  viewSettings: el("view-settings"),
  settingsBtn: el("settingsBtn"),
  backBtn: el("backBtn"),
  langToggleBtn: el("langToggleBtn"),
  themeToggleBtn: el("themeToggleBtn"),

  dropZone: el("dropZone"),
  fileInput: el("fileInput"),
  urlInput: el("urlInput"),
  loadUrlBtn: el("loadUrlBtn"),

  queueCard: el("queueCard"),
  queueList: el("queueList"),
  queueCount: el("queueCount"),
  clearQueueBtn: el("clearQueueBtn"),

  optionsCard: el("optionsCard"),
  formatSelect: el("formatSelect"),
  qualityRow: el("qualityRow"),
  qualitySlider: el("qualitySlider"),
  qualityValue: el("qualityValue"),
  resizeToggleRow: el("resizeToggleRow"),
  optResize: el("optResize"),
  resizeUnavailableHint: el("resizeUnavailableHint"),
  resizeRow: el("resizeRow"),
  widthInput: el("widthInput"),
  heightInput: el("heightInput"),
  optLockRatio: el("optLockRatio"),
  filenameRow: el("filenameRow"),
  filenameInput: el("filenameInput"),
  convertBtn: el("convertBtn"),

  historyCard: el("historyCard"),
  historyList: el("historyList"),
  exportHistoryBtn: el("exportHistoryBtn"),
  clearHistoryBtn: el("clearHistoryBtn"),

  themeSelect: el("themeSelect"),
  fontSizeSelect: el("fontSizeSelect"),
  languageSelect: el("languageSelect"),
  optShowHistory: el("optShowHistory"),
  historyLimitSelect: el("historyLimitSelect"),
  defaultFormatSelect: el("defaultFormatSelect"),
  defaultQualitySlider: el("defaultQualitySlider"),
  defaultQualityValue: el("defaultQualityValue"),
  menuOriginal: el("menuOriginal"),
  menuPng: el("menuPng"),
  menuJpeg: el("menuJpeg"),
  menuWebp: el("menuWebp"),
  optAskFilename: el("optAskFilename"),
  optShowNotification: el("optShowNotification"),

  exportSettingsBtn: el("exportSettingsBtn"),
  importSettingsBtn: el("importSettingsBtn"),
  importSettingsFile: el("importSettingsFile"),
  resetBtn: el("resetBtn"),

  toast: el("toast")
};

let toastTimer = null;
function showToast(key, ...args) {
  refs.toast.textContent = i18n.t(key, ...args);
  refs.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => refs.toast.classList.remove("show"), 2200);
}

function persistSettings() {
  store.saveSettings(settings);
}

function requestMenuRebuild() {
  chrome.runtime.sendMessage({ type: "rebuild-context-menus" }, () => {
    void chrome.runtime.lastError; // ignore — worker may have just woken up
  });
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const MODE_LABEL_KEY = {
  original: "menuOriginal",
  png: "menuPng",
  jpeg: "menuJpeg",
  webp: "menuWebp"
};
const EXT_BY_FORMAT = { png: "png", jpeg: "jpg", webp: "webp" };
const MIME_BY_FORMAT = { png: "image/png", jpeg: "image/jpeg", webp: "image/webp" };

/**
 * Chrome extension popups are lightweight, auto-closing overlay windows —
 * window.confirm()/prompt() are unreliable there (some Chrome versions
 * silently no-op them, and a popup can lose focus and close the instant a
 * native modal would try to render). So destructive actions use a two-step
 * "arm, then confirm" pattern entirely within the page: the first click
 * turns the button into a "Click again to confirm" warning state for a few
 * seconds; a second click within that window runs the action, and letting
 * it time out safely cancels.
 */
function armDestructiveAction(btn, normalKey, confirmKey, onConfirm) {
  let armed = false;
  let armTimer = null;
  function disarm() {
    armed = false;
    clearTimeout(armTimer);
    btn.classList.remove("is-armed");
    btn.textContent = i18n.t(normalKey);
  }
  return () => {
    if (!armed) {
      armed = true;
      btn.classList.add("is-armed");
      btn.textContent = i18n.t(confirmKey);
      armTimer = setTimeout(disarm, 3000);
    } else {
      disarm();
      onConfirm();
    }
  };
}

/* ============ Image queue ============ */

function baseNameNoExt(name) {
  return name.replace(/\.[a-zA-Z0-9]+$/, "");
}

function resetQueueState() {
  imageQueue.forEach((img) => URL.revokeObjectURL(img.objectUrl));
  imageQueue = [];
  refs.urlInput.value = "";
  renderQueue();
}

async function addImageBlob(blob, suggestedName) {
  if (!blob.type || !blob.type.startsWith("image/")) {
    showToast("toastInvalidFile");
    return false;
  }
  const objectUrl = URL.createObjectURL(blob);
  const dims = await new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = objectUrl;
  });
  if (!dims) {
    URL.revokeObjectURL(objectUrl);
    showToast("toastLoadFailed");
    return false;
  }
  imageQueue.push({
    id: ++queueIdSeq,
    blob,
    objectUrl,
    name: suggestedName,
    width: dims.w,
    height: dims.h,
    size: blob.size,
    aspect: dims.w / dims.h
  });
  return true;
}

async function loadImagesFromFiles(files) {
  const list = Array.from(files || []);
  if (list.length === 0) return;
  let loaded = 0;
  for (const file of list) {
    const ok = await addImageBlob(file, file.name || "image");
    if (ok) loaded++;
  }
  renderQueue();
  if (loaded > 1) showToast("toastImagesLoaded", loaded);
  else if (loaded === 1) showToast("toastLoaded");
}

async function loadImageFromUrl(url) {
  if (!url) return;
  try {
    const resp = await fetch(url, { credentials: "omit" });
    if (!resp.ok) throw new Error("fetch failed");
    const blob = await resp.blob();
    let name = "image";
    try {
      const u = new URL(url);
      name = decodeURIComponent(u.pathname.split("/").filter(Boolean).pop() || "image");
    } catch (e) { /* keep default name */ }
    const ok = await addImageBlob(blob, name);
    renderQueue();
    if (ok) { showToast("toastLoaded"); refs.urlInput.value = ""; }
  } catch (e) {
    showToast("toastLoadFailed");
  }
}

function removeFromQueue(id) {
  const idx = imageQueue.findIndex((img) => img.id === id);
  if (idx === -1) return;
  URL.revokeObjectURL(imageQueue[idx].objectUrl);
  imageQueue.splice(idx, 1);
  renderQueue();
}

function updateQualityVisibility() {
  refs.qualityRow.classList.toggle("hidden", refs.formatSelect.value === "png");
}

function updateConvertButtonLabel() {
  const n = imageQueue.length;
  refs.convertBtn.textContent = n > 1 ? i18n.t("convertAll", n) : i18n.t("convertDownload");
  refs.convertBtn.disabled = n === 0;
}

function renderQueue() {
  const n = imageQueue.length;
  refs.queueCard.classList.toggle("hidden", n === 0);
  refs.optionsCard.classList.toggle("hidden", n === 0);
  refs.queueCount.textContent = i18n.t("queueCount", n);

  refs.queueList.innerHTML = "";
  imageQueue.forEach((img) => {
    const li = document.createElement("li");
    li.className = "queue-item";
    li.innerHTML = `
      <img class="queue-item-thumb" src="${img.objectUrl}" alt="">
      <div class="queue-item-info">
        <span class="queue-item-name">${escapeHtml(img.name)}</span>
        <span class="queue-item-meta">${img.width}\u00D7${img.height} \u00B7 ${formatBytes(img.size)}</span>
      </div>
      <button class="queue-item-remove" data-id="${img.id}" data-i18n-title="removeImage" title="Remove">
        <svg viewBox="0 0 24 24" width="15" height="15"><path fill="currentColor" d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
      </button>`;
    li.querySelector(".queue-item-remove").addEventListener("click", () => removeFromQueue(img.id));
    refs.queueList.appendChild(li);
  });

  // Resize only makes sense with exactly one image (a shared W/H target
  // across differently-sized images would distort most of them), and a
  // custom filename only makes sense for one output file — batch mode
  // keeps every image's own original name.
  const single = n === 1;
  refs.resizeToggleRow.classList.toggle("hidden", !single);
  refs.resizeUnavailableHint.classList.toggle("hidden", single);
  if (!single) { refs.optResize.checked = false; refs.resizeRow.classList.add("hidden"); el("lockRatioRow").classList.add("hidden"); }
  refs.filenameRow.classList.toggle("hidden", !single);

  if (single) {
    const img = imageQueue[0];
    refs.formatSelect.value = settings.defaultFormat;
    refs.qualitySlider.value = settings.defaultQuality;
    refs.qualityValue.textContent = `${settings.defaultQuality}%`;
    updateQualityVisibility();
    refs.widthInput.value = img.width;
    refs.heightInput.value = img.height;
    refs.filenameInput.value = baseNameNoExt(img.name);
  } else if (n > 1) {
    refs.formatSelect.value = settings.defaultFormat;
    refs.qualitySlider.value = settings.defaultQuality;
    refs.qualityValue.textContent = `${settings.defaultQuality}%`;
    updateQualityVisibility();
  }

  updateConvertButtonLabel();
}

function escapeHtml(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/* ============ Conversion (single canvas encode, shared by single + batch) ============ */

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function encodeImage(imgEl, format, quality, targetW, targetH) {
  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(imgEl, 0, 0, targetW, targetH);
  const mime = MIME_BY_FORMAT[format] || "image/png";
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), mime, mime === "image/png" ? undefined : quality);
  });
  const thumbCanvas = document.createElement("canvas");
  const maxSide = 96;
  const scale = Math.min(1, maxSide / Math.max(targetW, targetH));
  thumbCanvas.width = Math.max(1, Math.round(targetW * scale));
  thumbCanvas.height = Math.max(1, Math.round(targetH * scale));
  thumbCanvas.getContext("2d").drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
  const thumbnail = thumbCanvas.toDataURL("image/jpeg", 0.7);
  return { blob, thumbnail };
}

/** De-duplicates filenames within one batch (e.g. two different source
 *  images both happening to be named "photo.png") so a zip never silently
 *  overwrites one entry with another. */
function uniqueFilename(base, ext, used) {
  let candidate = `${base}.${ext}`;
  let n = 2;
  while (used.has(candidate)) {
    candidate = `${base} (${n}).${ext}`;
    n++;
  }
  used.add(candidate);
  return candidate;
}

function downloadBlobAs(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

async function convertAndDownload() {
  if (imageQueue.length === 0) {
    showToast("toastNoImage");
    return;
  }

  refs.convertBtn.disabled = true;
  refs.convertBtn.classList.add("is-busy");

  try {
    const format = refs.formatSelect.value;
    const quality = parseInt(refs.qualitySlider.value, 10) / 100;
    const ext = EXT_BY_FORMAT[format] || "png";

    if (imageQueue.length === 1) {
      // Single-image path: preserves the original 1.0 behavior exactly —
      // optional resize, custom filename, direct (non-zipped) download.
      const source = imageQueue[0];
      let targetW = source.width;
      let targetH = source.height;
      if (refs.optResize.checked) {
        targetW = Math.max(1, parseInt(refs.widthInput.value, 10) || source.width);
        targetH = Math.max(1, parseInt(refs.heightInput.value, 10) || source.height);
      }
      const imgEl = await loadImageElement(source.objectUrl);
      const { blob, thumbnail } = await encodeImage(imgEl, format, quality, targetW, targetH);
      const baseName = baseNameNoExt(refs.filenameInput.value.trim() || source.name || "image");
      const filename = `${baseName}.${ext}`;

      downloadBlobAs(blob, filename);

      const history = await store.addToHistory(
        { source: "popup", originalName: source.name, filename, format, thumbnail },
        settings.historyLimit
      );
      currentHistoryCache = history;
      renderHistory(history);
      showToast("toastConverted");
    } else {
      // Batch path: same format/quality applied to every queued image, no
      // resize, each keeps its own name — bundled into a single .zip so
      // Chrome doesn't throw up its "multiple downloads" friction for N
      // near-simultaneous files.
      const usedNames = new Set();
      const zipEntries = [];
      let lastThumbnail = null;

      for (const source of imageQueue) {
        const imgEl = await loadImageElement(source.objectUrl);
        const { blob, thumbnail } = await encodeImage(imgEl, format, quality, source.width, source.height);
        const filename = uniqueFilename(baseNameNoExt(source.name), ext, usedNames);
        const bytes = new Uint8Array(await blob.arrayBuffer());
        zipEntries.push({ name: filename, bytes });
        lastThumbnail = thumbnail;

        await store.addToHistory(
          { source: "popup", originalName: source.name, filename, format, thumbnail },
          settings.historyLimit
        );
      }

      const zipBlob = createZip(zipEntries);
      downloadBlobAs(zipBlob, `pixflip-converted-${new Date().toISOString().slice(0, 10)}.zip`);

      const history = await store.loadHistory();
      currentHistoryCache = history;
      renderHistory(history);
      showToast("toastConvertedZip", zipEntries.length);
    }
  } catch (e) {
    showToast("toastConvertFailed");
  } finally {
    refs.convertBtn.disabled = imageQueue.length === 0;
    refs.convertBtn.classList.remove("is-busy");
  }
}

/* ============ Resize aspect-ratio sync ============ */

refs.widthInput.addEventListener("input", () => {
  if (imageQueue.length !== 1 || !refs.optLockRatio.checked) return;
  const w = parseInt(refs.widthInput.value, 10);
  if (w > 0) refs.heightInput.value = Math.round(w / imageQueue[0].aspect);
});
refs.heightInput.addEventListener("input", () => {
  if (imageQueue.length !== 1 || !refs.optLockRatio.checked) return;
  const h = parseInt(refs.heightInput.value, 10);
  if (h > 0) refs.widthInput.value = Math.round(h * imageQueue[0].aspect);
});

/* ============ History rendering ============ */

function renderHistory(history) {
  refs.historyList.innerHTML = "";
  if (!history || history.length === 0) {
    const li = document.createElement("li");
    li.className = "history-empty";
    li.textContent = i18n.t("historyEmpty");
    refs.historyList.appendChild(li);
    return;
  }
  history.forEach((item) => {
    const li = document.createElement("li");
    const canRedo = item.source === "context-menu" && item.originalUrl;
    if (canRedo) li.classList.add("is-clickable");

    const thumb = document.createElement("img");
    thumb.className = "history-thumb";
    thumb.src = item.thumbnail || "";
    thumb.alt = "";

    const info = document.createElement("div");
    info.className = "history-item-info";
    const nameEl = document.createElement("span");
    nameEl.className = "history-item-name";
    nameEl.textContent = item.filename || item.originalName || "image";
    const metaEl = document.createElement("span");
    metaEl.className = "history-item-meta";
    const sourceLabel = i18n.t(item.source === "context-menu" ? "sourceContextMenu" : "sourcePopup");
    const formatLabel = i18n.t(MODE_LABEL_KEY[item.format] || "menuPng");
    metaEl.textContent = `${sourceLabel} \u00B7 ${formatLabel}`;
    info.appendChild(nameEl);
    info.appendChild(metaEl);

    li.appendChild(thumb);
    li.appendChild(info);

    if (canRedo) {
      const redoBtn = document.createElement("button");
      redoBtn.className = "history-item-redo";
      redoBtn.title = i18n.t("redoAction");
      redoBtn.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15"><path fill="currentColor" d="M17.65 6.35A7.95 7.95 0 0 0 12 4a8 8 0 1 0 7.73 10h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>';
      redoBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        redoHistoryItem(item);
      });
      li.appendChild(redoBtn);
      li.addEventListener("click", () => redoHistoryItem(item));
    }

    refs.historyList.appendChild(li);
  });
}

/** Re-runs a past context-menu conversion from its original source URL —
 *  the only history items this works for, since that's the only case where
 *  we still have a stable, re-fetchable source (a popup-loaded local file's
 *  blob is gone once the popup closes, so those entries can't be redone). */
async function redoHistoryItem(item) {
  if (item.source !== "context-menu" || !item.originalUrl) {
    showToast("toastRedoUnavailable");
    return;
  }
  showToast("toastRedoing");
  chrome.runtime.sendMessage(
    { type: "redo-save", payload: { url: item.originalUrl, format: item.format } },
    () => void chrome.runtime.lastError
  );
}

/* ============ Settings <-> UI ============ */

function applySettingsToUI() {
  refs.themeSelect.value = settings.theme;
  refs.fontSizeSelect.value = settings.fontSize;
  refs.languageSelect.value = settings.language;
  refs.optShowHistory.checked = settings.showHistory;
  refs.historyLimitSelect.value = String(settings.historyLimit);

  refs.defaultFormatSelect.value = settings.defaultFormat;
  refs.defaultQualitySlider.value = settings.defaultQuality;
  refs.defaultQualityValue.textContent = `${settings.defaultQuality}%`;

  refs.menuOriginal.checked = settings.menuOriginal;
  refs.menuPng.checked = settings.menuPng;
  refs.menuJpeg.checked = settings.menuJpeg;
  refs.menuWebp.checked = settings.menuWebp;

  refs.optAskFilename.checked = settings.askFilename;
  refs.optShowNotification.checked = settings.showNotification;

  refs.historyCard.classList.toggle("hidden", !settings.showHistory);
}

/* ============ Event wiring ============ */

refs.settingsBtn.addEventListener("click", () => {
  refs.viewConverter.classList.add("hidden");
  refs.viewSettings.classList.remove("hidden");
});
refs.backBtn.addEventListener("click", () => {
  refs.viewSettings.classList.add("hidden");
  refs.viewConverter.classList.remove("hidden");
});

refs.langToggleBtn.addEventListener("click", () => {
  const next = settings.language === "en" ? "vi" : "en";
  settings.language = next;
  i18n.setLang(next);
  renderHistory(currentHistoryCache);
  updateConvertButtonLabel();
  persistSettings();
});

refs.themeToggleBtn.addEventListener("click", () => {
  const next = themeManager.cycle();
  settings.theme = next;
  refs.themeSelect.value = next;
  persistSettings();
});

/* Drop zone — supports multiple files at once */
refs.dropZone.addEventListener("click", () => refs.fileInput.click());
refs.dropZone.addEventListener("dragover", (e) => { e.preventDefault(); refs.dropZone.classList.add("drag-over"); });
refs.dropZone.addEventListener("dragleave", () => refs.dropZone.classList.remove("drag-over"));
refs.dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  refs.dropZone.classList.remove("drag-over");
  if (e.dataTransfer.files && e.dataTransfer.files.length) loadImagesFromFiles(e.dataTransfer.files);
});
refs.fileInput.addEventListener("change", (e) => {
  if (e.target.files.length) loadImagesFromFiles(e.target.files);
  refs.fileInput.value = "";
});

// Paste an image (e.g. a screenshot) directly from the clipboard — no
// special permission needed, this is a plain DOM paste event.
document.addEventListener("paste", (e) => {
  const items = e.clipboardData && e.clipboardData.items;
  if (!items) return;
  for (const item of items) {
    if (item.type && item.type.startsWith("image/")) {
      const blob = item.getAsFile();
      if (blob) {
        addImageBlob(blob, `pasted-${Date.now()}.png`).then((ok) => {
          renderQueue();
          if (ok) showToast("toastPasted");
        });
      }
      e.preventDefault();
      break;
    }
  }
});

refs.loadUrlBtn.addEventListener("click", () => loadImageFromUrl(refs.urlInput.value.trim()));
refs.urlInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") loadImageFromUrl(refs.urlInput.value.trim());
});

refs.clearQueueBtn.addEventListener("click", resetQueueState);

refs.formatSelect.addEventListener("change", updateQualityVisibility);
refs.qualitySlider.addEventListener("input", () => {
  refs.qualityValue.textContent = `${refs.qualitySlider.value}%`;
});

refs.optResize.addEventListener("change", () => {
  const on = refs.optResize.checked;
  refs.resizeRow.classList.toggle("hidden", !on);
  el("lockRatioRow").classList.toggle("hidden", !on);
});

refs.convertBtn.addEventListener("click", convertAndDownload);

refs.exportHistoryBtn.addEventListener("click", async () => {
  const history = await store.loadHistory();
  if (!history || history.length === 0) {
    showToast("toastHistoryEmpty");
    return;
  }
  const lines = history.map((item) => {
    const date = new Date(item.ts).toLocaleString();
    const sourceLabel = i18n.t(item.source === "context-menu" ? "sourceContextMenu" : "sourcePopup");
    const formatLabel = i18n.t(MODE_LABEL_KEY[item.format] || "menuPng");
    return `[${date}] ${item.filename || item.originalName || "image"} — ${formatLabel} (${sourceLabel})`;
  });
  downloadBlobAs(new Blob([lines.join("\n") + "\n"], { type: "text/plain" }), `pixflip-history-${new Date().toISOString().slice(0, 10)}.txt`);
  showToast("toastHistoryExported");
});

refs.clearHistoryBtn.addEventListener("click", armDestructiveAction(refs.clearHistoryBtn, "clear", "confirmClickAgain", async () => {
  await store.clearHistory();
  currentHistoryCache = [];
  renderHistory([]);
  showToast("toastCleared");
}));

refs.themeSelect.addEventListener("change", () => {
  settings.theme = refs.themeSelect.value;
  themeManager.apply(settings.theme);
  persistSettings();
});
refs.fontSizeSelect.addEventListener("change", () => {
  settings.fontSize = refs.fontSizeSelect.value;
  themeManager.applyFontSize(settings.fontSize);
  persistSettings();
});
refs.languageSelect.addEventListener("change", () => {
  settings.language = refs.languageSelect.value;
  i18n.setLang(settings.language);
  renderHistory(currentHistoryCache);
  updateConvertButtonLabel();
  persistSettings();
  requestMenuRebuild();
});
refs.optShowHistory.addEventListener("change", () => {
  settings.showHistory = refs.optShowHistory.checked;
  refs.historyCard.classList.toggle("hidden", !settings.showHistory);
  persistSettings();
});
refs.historyLimitSelect.addEventListener("change", async () => {
  settings.historyLimit = parseInt(refs.historyLimitSelect.value, 10);
  persistSettings();
  const history = await store.loadHistory();
  const trimmed = history.slice(0, settings.historyLimit);
  await store.saveHistory(trimmed);
  currentHistoryCache = trimmed;
  renderHistory(trimmed);
});

refs.defaultFormatSelect.addEventListener("change", () => {
  settings.defaultFormat = refs.defaultFormatSelect.value;
  persistSettings();
});
refs.defaultQualitySlider.addEventListener("input", () => {
  refs.defaultQualityValue.textContent = `${refs.defaultQualitySlider.value}%`;
});
refs.defaultQualitySlider.addEventListener("change", () => {
  settings.defaultQuality = parseInt(refs.defaultQualitySlider.value, 10);
  persistSettings();
});

[
  ["menuOriginal", "menuOriginal"], ["menuPng", "menuPng"], ["menuJpeg", "menuJpeg"], ["menuWebp", "menuWebp"]
].forEach(([refKey, settingKey]) => {
  refs[refKey].addEventListener("change", () => {
    settings[settingKey] = refs[refKey].checked;
    persistSettings();
    requestMenuRebuild();
  });
});

refs.optAskFilename.addEventListener("change", () => {
  settings.askFilename = refs.optAskFilename.checked;
  persistSettings();
});
refs.optShowNotification.addEventListener("change", () => {
  settings.showNotification = refs.optShowNotification.checked;
  persistSettings();
});

refs.exportSettingsBtn.addEventListener("click", async () => {
  const data = await store.exportAll();
  downloadBlobAs(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    `pixflip-settings-${new Date().toISOString().slice(0, 10)}.json`
  );
  showToast("toastExported");
});

refs.importSettingsBtn.addEventListener("click", () => refs.importSettingsFile.click());
refs.importSettingsFile.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    settings = await store.importAll(data);
    i18n.setLang(settings.language);
    themeManager.apply(settings.theme);
    themeManager.applyFontSize(settings.fontSize);
    applySettingsToUI();
    const history = await store.loadHistory();
    currentHistoryCache = history;
    renderHistory(history);
    requestMenuRebuild();
    showToast("toastImported");
  } catch (err) {
    showToast("toastImportFailed");
  } finally {
    refs.importSettingsFile.value = "";
  }
});

refs.resetBtn.addEventListener("click", armDestructiveAction(refs.resetBtn, "resetDefault", "confirmClickAgain", async () => {
  settings = await store.resetSettings();
  await store.clearHistory();
  i18n.setLang(settings.language);
  themeManager.apply(settings.theme);
  themeManager.applyFontSize(settings.fontSize);
  applySettingsToUI();
  currentHistoryCache = [];
  renderHistory([]);
  resetQueueState();
  requestMenuRebuild();
  showToast("toastReset");
}));

/* ============ Init ============ */
(async function init() {
  settings = await store.loadSettings();
  i18n.setLang(settings.language);
  themeManager.apply(settings.theme);
  themeManager.applyFontSize(settings.fontSize);
  themeManager.watchSystemChanges();

  applySettingsToUI();
  i18n.apply();

  const history = await store.loadHistory();
  currentHistoryCache = history;
  renderHistory(history);

  // Keep history live even when it changes from outside this popup view —
  // e.g. background.js finishing a "redo" or a right-click save while this
  // popup happens to already be open.
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes[HISTORY_KEY]) {
      currentHistoryCache = changes[HISTORY_KEY].newValue || [];
      renderHistory(currentHistoryCache);
    }
  });
})();
