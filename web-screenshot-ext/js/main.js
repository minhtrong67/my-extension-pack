// SmartShot — popup main script
// Author: gnort67

let settings = { ...DEFAULT_SETTINGS };
let currentHistoryCache = [];

const el = (id) => document.getElementById(id);

const refs = {
  viewCapture: el("view-capture"),
  viewSettings: el("view-settings"),
  settingsBtn: el("settingsBtn"),
  backBtn: el("backBtn"),
  langToggleBtn: el("langToggleBtn"),
  themeToggleBtn: el("themeToggleBtn"),

  captureVisibleBtn: el("captureVisibleBtn"),
  captureFullPageBtn: el("captureFullPageBtn"),
  captureAreaBtn: el("captureAreaBtn"),

  historyCard: el("historyCard"),
  historyList: el("historyList"),
  clearHistoryBtn: el("clearHistoryBtn"),

  themeSelect: el("themeSelect"),
  fontSizeSelect: el("fontSizeSelect"),
  languageSelect: el("languageSelect"),
  optShowHistory: el("optShowHistory"),
  historyLimitSelect: el("historyLimitSelect"),

  formatSelect: el("formatSelect"),
  qualityRow: el("qualityRow"),
  qualitySlider: el("qualitySlider"),
  qualityValue: el("qualityValue"),
  delaySlider: el("delaySlider"),
  delayValue: el("delayValue"),
  optOpenEditor: el("optOpenEditor"),
  quickActionRow: el("quickActionRow"),
  afterCaptureSelect: el("afterCaptureSelect"),

  exportSettingsBtn: el("exportSettingsBtn"),
  importSettingsBtn: el("importSettingsBtn"),
  importSettingsFile: el("importSettingsFile"),
  resetBtn: el("resetBtn"),

  toast: el("toast")
};

let toastTimer = null;
function showToast(key) {
  refs.toast.textContent = i18n.t(key);
  refs.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => refs.toast.classList.remove("show"), 1900);
}

function persistSettings() {
  store.saveSettings(settings);
}

const TYPE_LABEL_KEY = { visible: "typeVisible", fullpage: "typeFullPage", area: "typeArea" };
const ACTION_LABEL_KEY = { editor: "afterEditor", download: "afterDownload", clipboard: "afterClipboard" };

/* ============ Capture triggers ============ */
// Each button fires the capture in the background service worker, then closes
// the popup immediately so it doesn't get in the way of area-selection
// overlays or the full-page scrolling animation.

function triggerCapture(captureType) {
  chrome.runtime.sendMessage({ type: "capture", captureType }, () => {
    void chrome.runtime.lastError;
    window.close();
  });
}

refs.captureVisibleBtn.addEventListener("click", () => triggerCapture("visible"));
refs.captureFullPageBtn.addEventListener("click", () => triggerCapture("fullpage"));
refs.captureAreaBtn.addEventListener("click", () => triggerCapture("area"));

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

    const thumb = document.createElement("img");
    thumb.className = "history-thumb";
    thumb.src = item.thumbnail || "";
    thumb.alt = "";

    const info = document.createElement("div");
    info.className = "history-item-info";

    const nameEl = document.createElement("span");
    nameEl.className = "history-item-name";
    nameEl.textContent = item.filename || i18n.t(TYPE_LABEL_KEY[item.captureType] || "typeVisible");

    const metaEl = document.createElement("span");
    metaEl.className = "history-item-meta";
    const typeLabel = i18n.t(TYPE_LABEL_KEY[item.captureType] || "typeVisible");
    const actionLabel = i18n.t(ACTION_LABEL_KEY[item.action] || "afterDownload");
    metaEl.textContent = `${typeLabel} \u00B7 ${actionLabel}`;

    info.appendChild(nameEl);
    info.appendChild(metaEl);
    li.appendChild(thumb);
    li.appendChild(info);
    refs.historyList.appendChild(li);
  });
}

/* ============ Settings <-> UI ============ */

function updateQualityVisibility() {
  refs.qualityRow.classList.toggle("hidden", refs.formatSelect.value === "png");
}

function applySettingsToUI() {
  refs.themeSelect.value = settings.theme;
  refs.fontSizeSelect.value = settings.fontSize;
  refs.languageSelect.value = settings.language;
  refs.optShowHistory.checked = settings.showHistory;
  refs.historyLimitSelect.value = String(settings.historyLimit);

  refs.formatSelect.value = settings.format;
  refs.qualitySlider.value = settings.quality;
  refs.qualityValue.textContent = `${settings.quality}%`;
  updateQualityVisibility();

  refs.delaySlider.value = settings.fullPageDelay;
  refs.delayValue.textContent = `${settings.fullPageDelay} ms`;

  refs.optOpenEditor.checked = settings.openEditorAfterCapture;
  refs.afterCaptureSelect.value = settings.afterCapture;
  refs.quickActionRow.classList.toggle("hidden", settings.openEditorAfterCapture);

  refs.historyCard.classList.toggle("hidden", !settings.showHistory);
}

/* ============ Event wiring ============ */

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

refs.clearHistoryBtn.addEventListener("click", async () => {
  await store.clearHistory();
  currentHistoryCache = [];
  renderHistory([]);
  showToast("toastCleared");
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

refs.formatSelect.addEventListener("change", () => {
  settings.format = refs.formatSelect.value;
  updateQualityVisibility();
  persistSettings();
});
refs.qualitySlider.addEventListener("input", () => {
  refs.qualityValue.textContent = `${refs.qualitySlider.value}%`;
});
refs.qualitySlider.addEventListener("change", () => {
  settings.quality = parseInt(refs.qualitySlider.value, 10);
  persistSettings();
});
refs.delaySlider.addEventListener("input", () => {
  refs.delayValue.textContent = `${refs.delaySlider.value} ms`;
});
refs.delaySlider.addEventListener("change", () => {
  settings.fullPageDelay = parseInt(refs.delaySlider.value, 10);
  persistSettings();
});
refs.optOpenEditor.addEventListener("change", () => {
  settings.openEditorAfterCapture = refs.optOpenEditor.checked;
  refs.quickActionRow.classList.toggle("hidden", settings.openEditorAfterCapture);
  persistSettings();
});
refs.afterCaptureSelect.addEventListener("change", () => {
  settings.afterCapture = refs.afterCaptureSelect.value;
  persistSettings();
});

refs.exportSettingsBtn.addEventListener("click", async () => {
  const data = await store.exportAll();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `smartshot-settings-${new Date().toISOString().slice(0, 10)}.json`;
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
    const history = await store.loadHistory();
    currentHistoryCache = history;
    renderHistory(history);
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

  const history = await store.loadHistory();
  currentHistoryCache = history;
  renderHistory(history);
})();
