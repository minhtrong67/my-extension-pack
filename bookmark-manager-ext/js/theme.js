/**
 * theme.js — resolves "system|light|dark" into a concrete data-theme
 * attribute, applies font-size, and resolves the display language.
 */

const themeManager = {
  current: "system",
  mql: window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null,

  apply(mode) {
    this.current = mode;
    const resolved = mode === "system" ? (this.mql && this.mql.matches ? "dark" : "light") : mode;
    document.documentElement.setAttribute("data-theme", resolved);
  },

  applyFontSize(size) {
    document.documentElement.setAttribute("data-fontsize", size);
  },

  watchSystemChanges(onChange) {
    if (!this.mql) return;
    this.mql.addEventListener("change", () => {
      if (this.current === "system") {
        this.apply("system");
        if (onChange) onChange();
      }
    });
  }
};

/** Resolve the settings' "system|en|vi" language preference to "en"|"vi". */
function resolveLang(settings) {
  const lang = settings.language;
  if (lang === "vi" || lang === "en") return lang;
  const nav = navigator.language || "en";
  return nav.startsWith("vi") ? "vi" : "en";
}
