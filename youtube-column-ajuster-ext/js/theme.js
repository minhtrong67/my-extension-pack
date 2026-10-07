/**
 * theme.js — resolves the "system | light | dark" preference into a concrete
 * `data-theme` attribute on <html>, and applies the font-size preference.
 * Shared by popup.js and options.js.
 */

const themeManager = {
  current: "system",
  mql: window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null,

  /** @param {"system"|"light"|"dark"} mode */
  apply(mode) {
    this.current = mode;
    const resolved = mode === "system" ? (this.mql && this.mql.matches ? "dark" : "light") : mode;
    document.documentElement.setAttribute("data-theme", resolved);

    const icon = document.getElementById("themeToggleBtn");
    if (icon) icon.classList.toggle("is-active", resolved === "dark");
  },

  /** @param {"small"|"medium"|"large"} size */
  applyFontSize(size) {
    document.documentElement.setAttribute("data-fontsize", size);
  },

  /** Re-resolve automatically when the OS theme changes while mode==="system". */
  watchSystemChanges(onChange) {
    if (!this.mql) return;
    this.mql.addEventListener("change", () => {
      if (this.current === "system") {
        this.apply("system");
        if (onChange) onChange();
      }
    });
  },

  cycle() {
    // Explicit mapping (rather than array-index rotation) so the very first
    // click from "system" always produces a visible change: if the system
    // theme currently resolves to light, jumping to "light" would look like
    // a no-op, so we always go system -> dark -> light -> system.
    const next = { system: "dark", dark: "light", light: "system" }[this.current] || "system";
    this.apply(next);
    return next;
  }
};
