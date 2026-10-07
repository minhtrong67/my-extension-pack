/**
 * popup.js — quick-access controls shown in the toolbar popup.
 * The full settings experience lives in options.html; this view only
 * exposes what people change most often (master switch, columns, toggles).
 */

let settings = { ...DEFAULT_SETTINGS };

const el = (id) => document.getElementById(id);

const refs = {
  app: el("app"),
  langToggleBtn: el("langToggleBtn"),
  themeToggleBtn: el("themeToggleBtn"),

  optEnabled: el("optEnabled"),
  masterOffHint: el("masterOffHint"),
  columnsCard: el("columnsCard"),

  optUseCustom: el("optUseCustom"),
  columnsControl: el("columnsControl"),
  columnsValue: el("columnsValue"),
  columnsSlider: el("columnsSlider"),
  previewGrid: el("previewGrid"),
  defaultNote: el("defaultNote"),

  optHideShorts: el("optHideShorts"),
  optCompactCards: el("optCompactCards"),
  optHideComments: el("optHideComments"),
  optHideEndCards: el("optHideEndCards"),
  optFocusMode: el("optFocusMode"),

  openSettingsBtn: el("openSettingsBtn"),
  viewLandingBtn: el("viewLandingBtn"),

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

/* ============ Preview grid ============ */

function renderPreviewGrid(count) {
  refs.previewGrid.style.gridTemplateColumns = `repeat(${count}, minmax(0, 1fr))`;
  refs.previewGrid.innerHTML = "";
  const cellCount = count * 2; // two preview rows
  for (let i = 0; i < cellCount; i++) {
    const cell = document.createElement("div");
    cell.className = "preview-cell";
    cell.style.animationDelay = `${i * 15}ms`;
    refs.previewGrid.appendChild(cell);
  }
}

/* ============ UI <-> settings ============ */

function updateColumnsUI() {
  refs.columnsControl.classList.toggle("hidden", !settings.useCustomColumns);
  refs.defaultNote.classList.toggle("hidden", settings.useCustomColumns);
  refs.previewGrid.classList.toggle("hidden", !settings.showPreview);
}

function updateEnabledUI() {
  refs.app.classList.toggle("is-disabled", !settings.enabled);
  refs.masterOffHint.classList.toggle("hidden", settings.enabled);
}

function applySettingsToUI() {
  refs.optEnabled.checked = settings.enabled;
  updateEnabledUI();

  refs.optUseCustom.checked = settings.useCustomColumns;
  const displayedColumns = settings.perPageColumns ? settings.columnsHome : settings.columns;
  refs.columnsSlider.value = displayedColumns;
  refs.columnsValue.textContent = displayedColumns;
  renderPreviewGrid(displayedColumns);
  updateColumnsUI();

  refs.optHideShorts.checked = settings.hideShorts;
  refs.optCompactCards.checked = settings.compactCards;
  refs.optHideComments.checked = settings.hideComments;
  refs.optHideEndCards.checked = settings.hideEndCards;
  refs.optFocusMode.checked = settings.focusMode;
}

/* ============ Event wiring ============ */

refs.langToggleBtn.addEventListener("click", () => {
  const next = settings.language === "en" ? "vi" : "en";
  settings.language = next;
  i18n.setLang(next);
  persistSettings();
});
refs.themeToggleBtn.addEventListener("click", () => {
  const next = themeManager.cycle();
  settings.theme = next;
  persistSettings();
});

refs.optEnabled.addEventListener("change", () => {
  settings.enabled = refs.optEnabled.checked;
  updateEnabledUI();
  persistSettings();
  showToast(settings.enabled ? "toastEnabled" : "toastDisabled");
});

refs.optUseCustom.addEventListener("change", () => {
  settings.useCustomColumns = refs.optUseCustom.checked;
  updateColumnsUI();
  persistSettings();
});

refs.columnsSlider.addEventListener("input", () => {
  const n = parseInt(refs.columnsSlider.value, 10);
  refs.columnsValue.textContent = n;
  renderPreviewGrid(n);
});
refs.columnsSlider.addEventListener("change", () => {
  const n = parseInt(refs.columnsSlider.value, 10);
  // The popup's single slider always writes the "simple" (non-per-page)
  // value; per-page fine-tuning happens in the full Settings → Layout tab.
  settings.columns = n;
  if (settings.perPageColumns) settings.columnsHome = n;
  persistSettings();
});

refs.optHideShorts.addEventListener("change", () => {
  settings.hideShorts = refs.optHideShorts.checked;
  persistSettings();
});
refs.optCompactCards.addEventListener("change", () => {
  settings.compactCards = refs.optCompactCards.checked;
  persistSettings();
});
refs.optHideComments.addEventListener("change", () => {
  settings.hideComments = refs.optHideComments.checked;
  persistSettings();
});
refs.optHideEndCards.addEventListener("change", () => {
  settings.hideEndCards = refs.optHideEndCards.checked;
  persistSettings();
});
refs.optFocusMode.addEventListener("change", () => {
  settings.focusMode = refs.optFocusMode.checked;
  persistSettings();
});

refs.openSettingsBtn.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});
refs.viewLandingBtn.addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("landing.html") });
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
  window.__ycaWireRipples();

  // Keep the popup in sync if settings change elsewhere (e.g. the options
  // page is open in another tab at the same time).
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.yca_settings) {
      settings = { ...DEFAULT_SETTINGS, ...changes.yca_settings.newValue };
      i18n.setLang(settings.language);
      themeManager.apply(settings.theme);
      themeManager.applyFontSize(settings.fontSize);
      applySettingsToUI();
      i18n.apply();
    }
  });
})();
