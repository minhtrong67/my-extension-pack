// TubeShot — popup main script
// Author: gnort67

let settings = { ...DEFAULT_SETTINGS };
let currentHistoryCache = [];
let activeTab = null;
let statusPollTimer = null;

const el = (id) => document.getElementById(id);

const refs = {
  emptyVideoState: el("emptyVideoState"),
  videoPresentWrap: el("videoPresentWrap"),
  openYoutubeBtn: el("openYoutubeBtn"),

  videoTitleLabel: el("videoTitleLabel"),
  videoChannelLabel: el("videoChannelLabel"),
  currentTimeLabel: el("currentTimeLabel"),
  durationLabel: el("durationLabel"),
  timeBarFill: el("timeBarFill"),

  seekBack10Btn: el("seekBack10Btn"),
  seekBack1Btn: el("seekBack1Btn"),
  playPauseBtn: el("playPauseBtn"),
  playIcon: el("playIcon"),
  seekFwd1Btn: el("seekFwd1Btn"),
  seekFwd10Btn: el("seekFwd10Btn"),
  seekInput: el("seekInput"),
  seekGoBtn: el("seekGoBtn"),

  formatSelect: el("formatSelect"),
  scaleSelect: el("scaleSelect"),
  optWatermark: el("optWatermark"),
  optCaption: el("optCaption"),
  captureBtn: el("captureBtn"),
  captureCopyBtn: el("captureCopyBtn"),

  historyCard: el("historyCard"),
  historyList: el("historyList"),
  exportHistoryBtn: el("exportHistoryBtn"),
  clearHistoryBtn: el("clearHistoryBtn"),

  settingsBtn: el("settingsBtn"),
  backBtn: el("backBtn"),
  langToggleBtn: el("langToggleBtn"),
  themeToggleBtn: el("themeToggleBtn"),
  viewCapture: el("view-capture"),
  viewSettings: el("view-settings"),

  themeSelect: el("themeSelect"),
  fontSizeSelect: el("fontSizeSelect"),
  languageSelect: el("languageSelect"),
  optShowHistory: el("optShowHistory"),
  historyLimitSelect: el("historyLimitSelect"),
  qualitySlider: el("qualitySlider"),
  qualityValue: el("qualityValue"),

  exportSettingsBtn: el("exportSettingsBtn"),
  importSettingsBtn: el("importSettingsBtn"),
  importSettingsFile: el("importSettingsFile"),
  resetBtn: el("resetBtn"),

  toast: el("toast")
};

let toastTimer = null;
function showToast(key, vars) {
  refs.toast.textContent = i18n.t(key, vars);
  refs.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => refs.toast.classList.remove("show"), 2000);
}

function persistSettings() {
  store.saveSettings(settings);
}

function formatTime(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return hh > 0 ? `${hh}:${pad(mm)}:${pad(ss)}` : `${mm}:${pad(ss)}`;
}

function parseTimeInput(str) {
  const parts = str.trim().split(":").map((p) => p.trim());
  if (parts.length === 0 || parts.some((p) => p === "" || isNaN(Number(p)))) return null;
  let seconds = 0;
  if (parts.length === 1) seconds = Number(parts[0]);
  else if (parts.length === 2) seconds = Number(parts[0]) * 60 + Number(parts[1]);
  else if (parts.length === 3) seconds = Number(parts[0]) * 3600 + Number(parts[1]) * 60 + Number(parts[2]);
  else return null;
  return seconds >= 0 ? seconds : null;
}

function isYoutubeUrl(url) {
  try {
    const u = new URL(url);
    return /(^|\.)youtube\.com$/.test(u.hostname) || /(^|\.)m\.youtube\.com$/.test(u.hostname);
  } catch (e) {
    return false;
  }
}

function sendToContent(tabId, message) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ ok: false, error: "no-connection" });
        return;
      }
      resolve(response || { ok: false });
    });
  });
}

/* ============ Status polling ============ */

async function refreshStatus() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  activeTab = tab && isYoutubeUrl(tab.url || "") ? tab : null;

  if (!activeTab) {
    refs.emptyVideoState.classList.remove("hidden");
    refs.videoPresentWrap.classList.add("hidden");
    return;
  }

  const status = await sendToContent(activeTab.id, { target: "tubeshot-content", type: "get-status" });
  if (!status || !status.ok || !status.hasVideo) {
    refs.emptyVideoState.classList.remove("hidden");
    refs.videoPresentWrap.classList.add("hidden");
    return;
  }

  refs.emptyVideoState.classList.add("hidden");
  refs.videoPresentWrap.classList.remove("hidden");
  applyStatus(status);
}

function applyStatus(status) {
  refs.videoTitleLabel.textContent = status.title || "\u2014";
  refs.videoChannelLabel.textContent = status.channel || "";
  refs.currentTimeLabel.textContent = formatTime(status.currentTime);
  refs.durationLabel.textContent = formatTime(status.duration);
  const pct = status.duration ? Math.min(100, (status.currentTime / status.duration) * 100) : 0;
  refs.timeBarFill.style.width = `${pct}%`;
  refs.playIcon.innerHTML = status.paused
    ? '<path fill="currentColor" d="M8 5v14l11-7z"/>'
    : '<path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
}

refs.openYoutubeBtn.addEventListener("click", () => {
  chrome.tabs.create({ url: "https://www.youtube.com" });
  window.close();
});

/* ============ Playback controls ============ */

async function doSeek(delta) {
  if (!activeTab) return;
  const status = await sendToContent(activeTab.id, { target: "tubeshot-content", type: "seek", delta });
  if (status && status.ok) applyStatus(status);
}
refs.seekBack10Btn.addEventListener("click", () => doSeek(-10));
refs.seekBack1Btn.addEventListener("click", () => doSeek(-1));
refs.seekFwd1Btn.addEventListener("click", () => doSeek(1));
refs.seekFwd10Btn.addEventListener("click", () => doSeek(10));

refs.playPauseBtn.addEventListener("click", async () => {
  if (!activeTab) return;
  const status = await sendToContent(activeTab.id, { target: "tubeshot-content", type: "toggle-play" });
  if (status && status.ok) applyStatus(status);
});

refs.seekGoBtn.addEventListener("click", async () => {
  if (!activeTab) return;
  const seconds = parseTimeInput(refs.seekInput.value);
  if (seconds === null) {
    showToast("toastInvalidTime");
    return;
  }
  const status = await sendToContent(activeTab.id, { target: "tubeshot-content", type: "seek-to", seconds });
  if (status && status.ok) applyStatus(status);
});
refs.seekInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") refs.seekGoBtn.click();
});

/* ============ Capture ============ */

function sanitizeFilename(name) {
  return (name || "tubeshot").replace(/[\\/:*?"<>|]+/g, "_").trim().slice(0, 60) || "tubeshot";
}

async function renderHistoryFromStore() {
  const history = await store.loadHistory();
  currentHistoryCache = history;
  renderHistory(history);
}

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
    const thumb = document.createElement("img");
    thumb.className = "history-thumb";
    thumb.src = item.thumbnail || "";
    thumb.alt = "";

    const info = document.createElement("div");
    info.className = "history-item-info";
    const nameEl = document.createElement("span");
    nameEl.className = "history-item-name";
    nameEl.textContent = item.title || "TubeShot capture";
    const metaEl = document.createElement("span");
    metaEl.className = "history-item-meta";
    metaEl.textContent = `${item.channel ? item.channel + " \u00B7 " : ""}${item.timeLabel || ""}`;

    info.appendChild(nameEl);
    info.appendChild(metaEl);
    li.appendChild(thumb);
    li.appendChild(info);
    refs.historyList.appendChild(li);
  });
}

async function doCapture(action) {
  if (!activeTab) {
    showToast("toastNoVideo");
    return;
  }

  const forcedFormat = action === "clipboard" ? "png" : settings.format;
  const result = await sendToContent(activeTab.id, {
    target: "tubeshot-content",
    type: "capture-frame",
    options: {
      format: forcedFormat,
      quality: settings.quality,
      scale: settings.scale,
      watermarkTimestamp: settings.watermarkTimestamp,
      captionInfo: settings.captionInfo
    }
  });

  if (!result || !result.ok) {
    showToast(result && result.error === "no-video" ? "toastNoVideo" : "toastCaptureFailed");
    return;
  }

  if (action === "download") {
    const ext = forcedFormat === "jpeg" ? "jpg" : "png";
    const filename = `tubeshot-${sanitizeFilename(result.title)}-${result.timeLabel.replace(/:/g, "-")}.${ext}`;
    chrome.downloads.download({ url: result.dataUrl, filename });
    showToast("toastCaptured");
  } else {
    try {
      const blob = await (await fetch(result.dataUrl)).blob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      showToast("toastCopied");
    } catch (e) {
      showToast("toastCopyFailed");
      return;
    }
  }

  const history = await store.addToHistory(
    {
      title: result.title,
      channel: result.channel,
      timeLabel: result.timeLabel,
      videoUrl: result.videoUrl,
      format: forcedFormat,
      thumbnail: result.thumbnail
    },
    settings.historyLimit
  );
  currentHistoryCache = history;
  renderHistory(history);
}

refs.captureBtn.addEventListener("click", () => doCapture("download"));
refs.captureCopyBtn.addEventListener("click", () => doCapture("clipboard"));

refs.exportHistoryBtn.addEventListener("click", async () => {
  const history = await store.loadHistory();
  if (!history || history.length === 0) {
    showToast("toastHistoryEmpty");
    return;
  }
  const lines = history.map((item) => {
    const date = new Date(item.ts).toLocaleString();
    return `[${date}] ${item.title || "TubeShot capture"} (${item.channel || "?"}) @ ${item.timeLabel} - ${item.videoUrl}`;
  });
  const blob = new Blob([lines.join("\n") + "\n"], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tubeshot-history-${new Date().toISOString().slice(0, 10)}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast("toastHistoryExported");
});

refs.clearHistoryBtn.addEventListener("click", async () => {
  await store.clearHistory();
  currentHistoryCache = [];
  renderHistory([]);
  showToast("toastCleared");
});

/* ============ Settings <-> UI ============ */

function applySettingsToUI() {
  refs.themeSelect.value = settings.theme;
  refs.fontSizeSelect.value = settings.fontSize;
  refs.languageSelect.value = settings.language;
  refs.optShowHistory.checked = settings.showHistory;
  refs.historyLimitSelect.value = String(settings.historyLimit);
  refs.qualitySlider.value = settings.quality;
  refs.qualityValue.textContent = `${settings.quality}%`;

  refs.formatSelect.value = settings.format;
  refs.scaleSelect.value = String(settings.scale);
  refs.optWatermark.checked = settings.watermarkTimestamp;
  refs.optCaption.checked = settings.captionInfo;

  refs.historyCard.classList.toggle("hidden", !settings.showHistory);
}

refs.settingsBtn.addEventListener("click", () => {
  refs.viewCapture.classList.add("hidden");
  refs.viewSettings.classList.remove("hidden");
});
refs.backBtn.addEventListener("click", () => {
  refs.viewSettings.classList.add("hidden");
  refs.viewCapture.classList.remove("hidden");
});

refs.langToggleBtn.addEventListener("click", () => {
  const next = settings.language === "en" ? "vi" : "en";
  settings.language = next;
  i18n.setLang(next);
  renderHistory(currentHistoryCache);
  persistSettings();
});
refs.themeToggleBtn.addEventListener("click", () => {
  const next = themeManager.cycle();
  settings.theme = next;
  refs.themeSelect.value = next;
  persistSettings();
});

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
  persistSettings();
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
refs.qualitySlider.addEventListener("input", () => {
  refs.qualityValue.textContent = `${refs.qualitySlider.value}%`;
});
refs.qualitySlider.addEventListener("change", () => {
  settings.quality = parseInt(refs.qualitySlider.value, 10);
  persistSettings();
});

refs.formatSelect.addEventListener("change", () => {
  settings.format = refs.formatSelect.value;
  persistSettings();
});
refs.scaleSelect.addEventListener("change", () => {
  settings.scale = parseInt(refs.scaleSelect.value, 10);
  persistSettings();
});
refs.optWatermark.addEventListener("change", () => {
  settings.watermarkTimestamp = refs.optWatermark.checked;
  persistSettings();
});
refs.optCaption.addEventListener("change", () => {
  settings.captionInfo = refs.optCaption.checked;
  persistSettings();
});

/* ============ Export / Import / Reset ============ */

refs.exportSettingsBtn.addEventListener("click", async () => {
  const data = await store.exportAll();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tubeshot-settings-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
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
    await renderHistoryFromStore();
    showToast("toastImported");
  } catch (err) {
    showToast("toastImportFailed");
  } finally {
    refs.importSettingsFile.value = "";
  }
});

refs.resetBtn.addEventListener("click", async () => {
  settings = await store.resetSettings();
  await store.clearHistory();
  i18n.setLang(settings.language);
  themeManager.apply(settings.theme);
  themeManager.applyFontSize(settings.fontSize);
  applySettingsToUI();
  currentHistoryCache = [];
  renderHistory([]);
  showToast("toastReset");
});

/* ============ Init ============ */
(async function init() {
  settings = await store.loadSettings();
  i18n.setLang(settings.language);
  themeManager.apply(settings.theme);
  themeManager.applyFontSize(settings.fontSize);
  themeManager.watchSystemChanges();

  applySettingsToUI();
  i18n.apply();

  await renderHistoryFromStore();
  await refreshStatus();
  statusPollTimer = setInterval(refreshStatus, 800);
})();
