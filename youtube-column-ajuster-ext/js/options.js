/**
 * options.js — the full Settings page (opened as its own browser tab via
 * chrome.runtime.openOptionsPage()). Mirrors popup.js's structure but adds
 * the tab navigation and the advanced per-page column controls.
 */

let settings = { ...DEFAULT_SETTINGS };

const el = (id) => document.getElementById(id);

const refs = {
  langToggleBtn: el("langToggleBtn"),
  themeToggleBtn: el("themeToggleBtn"),
  viewLandingBtn: el("viewLandingBtn"),

  optEnabled: el("optEnabled"),
  masterOffHint: el("masterOffHint"),

  optHideShorts: el("optHideShorts"),
  optCompactCards: el("optCompactCards"),
  optHideComments: el("optHideComments"),
  optHideEndCards: el("optHideEndCards"),
  optFocusMode: el("optFocusMode"),

  optUseCustom: el("optUseCustom"),
  columnsControl: el("columnsControl"),
  optPerPage: el("optPerPage"),
  simpleColumnsBlock: el("simpleColumnsBlock"),
  perPageColumnsBlock: el("perPageColumnsBlock"),
  columnsValue: el("columnsValue"),
  columnsSlider: el("columnsSlider"),
  previewGrid: el("previewGrid"),
  defaultNote: el("defaultNote"),

  sliderHome: el("sliderHome"),
  sliderSubs: el("sliderSubs"),
  sliderChannel: el("sliderChannel"),
  valueHome: el("valueHome"),
  valueSubs: el("valueSubs"),
  valueChannel: el("valueChannel"),

  optShowPreview: el("optShowPreview"),

  themeSelect: el("themeSelect"),
  fontSizeSelect: el("fontSizeSelect"),
  languageSelect: el("languageSelect"),

  exportSettingsBtn: el("exportSettingsBtn"),
  importSettingsBtn: el("importSettingsBtn"),
  importSettingsFile: el("importSettingsFile"),
  resetBtn: el("resetBtn"),
  manageShortcutsBtn: el("manageShortcutsBtn"),

  toast: el("toast")
};

let toastTimer = null;
function showToast(key) {
  refs.toast.textContent = i18n.t(key);
  refs.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => refs.toast.classList.remove("show"), 2200);
}

function persistSettings() {
  store.saveSettings(settings);
}

/* ============ Tab navigation ============ */

document.querySelectorAll(".nav-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((p) => p.classList.add("hidden"));
    btn.classList.add("active");
    const panel = document.querySelector(`.panel[data-panel="${btn.dataset.tab}"]`);
    panel.classList.remove("hidden");
    panel.classList.remove("m3-anim-in");
    // Force reflow so the entrance animation can replay every time the tab
    // is revisited (re-adding the same class name is a no-op otherwise).
    void panel.offsetWidth;
    panel.classList.add("m3-anim-in");
  });
});

/* ============ Preview grid ============ */

function renderPreviewGrid(count) {
  refs.previewGrid.style.gridTemplateColumns = `repeat(${count}, minmax(0, 1fr))`;
  refs.previewGrid.innerHTML = "";
  const cellCount = count * 2;
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
  refs.simpleColumnsBlock.classList.toggle("hidden", settings.perPageColumns);
  refs.perPageColumnsBlock.classList.toggle("hidden", !settings.perPageColumns);
  refs.previewGrid.classList.toggle("hidden", !settings.showPreview);
}

function updateEnabledUI() {
  refs.masterOffHint.classList.toggle("hidden", settings.enabled);
}

function applySettingsToUI() {
  refs.optEnabled.checked = settings.enabled;
  updateEnabledUI();

  refs.optHideShorts.checked = settings.hideShorts;
  refs.optCompactCards.checked = settings.compactCards;
  refs.optHideComments.checked = settings.hideComments;
  refs.optHideEndCards.checked = settings.hideEndCards;
  refs.optFocusMode.checked = settings.focusMode;

  refs.optUseCustom.checked = settings.useCustomColumns;
  refs.optPerPage.checked = settings.perPageColumns;
  refs.columnsSlider.value = settings.columns;
  refs.columnsValue.textContent = settings.columns;
  renderPreviewGrid(settings.columns);

  refs.sliderHome.value = settings.columnsHome;
  refs.sliderSubs.value = settings.columnsSubscriptions;
  refs.sliderChannel.value = settings.columnsChannel;
  refs.valueHome.textContent = settings.columnsHome;
  refs.valueSubs.textContent = settings.columnsSubscriptions;
  refs.valueChannel.textContent = settings.columnsChannel;

  refs.optShowPreview.checked = settings.showPreview;
  updateColumnsUI();

  refs.themeSelect.value = settings.theme;
  refs.fontSizeSelect.value = settings.fontSize;
  refs.languageSelect.value = settings.language;
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
  refs.themeSelect.value = next;
  persistSettings();
});
refs.viewLandingBtn.addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("landing.html") });
});

refs.optEnabled.addEventListener("change", () => {
  settings.enabled = refs.optEnabled.checked;
  updateEnabledUI();
  persistSettings();
  showToast(settings.enabled ? "toastEnabled" : "toastDisabled");
});

[
  ["optHideShorts", "hideShorts"],
  ["optCompactCards", "compactCards"],
  ["optHideComments", "hideComments"],
  ["optHideEndCards", "hideEndCards"],
  ["optFocusMode", "focusMode"]
].forEach(([refId, key]) => {
  refs[refId].addEventListener("change", () => {
    settings[key] = refs[refId].checked;
    persistSettings();
  });
});

refs.optUseCustom.addEventListener("change", () => {
  settings.useCustomColumns = refs.optUseCustom.checked;
  updateColumnsUI();
  persistSettings();
});
refs.optPerPage.addEventListener("change", () => {
  settings.perPageColumns = refs.optPerPage.checked;
  updateColumnsUI();
  persistSettings();
});

refs.columnsSlider.addEventListener("input", () => {
  const n = parseInt(refs.columnsSlider.value, 10);
  refs.columnsValue.textContent = n;
  renderPreviewGrid(n);
});
refs.columnsSlider.addEventListener("change", () => {
  settings.columns = parseInt(refs.columnsSlider.value, 10);
  persistSettings();
});

function wirePerPageSlider(sliderRef, valueRef, key) {
  sliderRef.addEventListener("input", () => {
    valueRef.textContent = sliderRef.value;
  });
  sliderRef.addEventListener("change", () => {
    settings[key] = parseInt(sliderRef.value, 10);
    persistSettings();
  });
}
wirePerPageSlider(refs.sliderHome, refs.valueHome, "columnsHome");
wirePerPageSlider(refs.sliderSubs, refs.valueSubs, "columnsSubscriptions");
wirePerPageSlider(refs.sliderChannel, refs.valueChannel, "columnsChannel");

refs.optShowPreview.addEventListener("change", () => {
  settings.showPreview = refs.optShowPreview.checked;
  updateColumnsUI();
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
  persistSettings();
});

/* ============ Export / Import / Reset ============ */

refs.exportSettingsBtn.addEventListener("click", async () => {
  const data = await store.exportAll();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `youtube-column-ajuster-settings-${new Date().toISOString().slice(0, 10)}.json`;
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
    i18n.apply();
    showToast("toastImported");
  } catch (err) {
    showToast("toastImportFailed");
  } finally {
    refs.importSettingsFile.value = "";
  }
});

refs.resetBtn.addEventListener("click", async () => {
  if (!window.confirm(i18n.t("resetConfirm"))) return;
  settings = await store.resetSettings();
  i18n.setLang(settings.language);
  themeManager.apply(settings.theme);
  themeManager.applyFontSize(settings.fontSize);
  applySettingsToUI();
  i18n.apply();
  showToast("toastReset");
});

refs.manageShortcutsBtn.addEventListener("click", () => {
  chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
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
})();
