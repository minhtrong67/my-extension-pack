// SmartShot — theme module

const themeManager = {
  current: "system",
  mql: window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null,

  apply(mode) {
    this.current = mode;
    const resolved = mode === "system" ? (this.mql && this.mql.matches ? "dark" : "light") : mode;
    document.documentElement.setAttribute("data-theme", resolved);

    const icon = document.getElementById("themeIcon");
    if (icon) {
      // swap icon path lightly based on resolved theme (sun vs moon feel via same glyph is fine,
      // but we tweak stroke intensity through currentColor + class for clarity)
      icon.parentElement.classList.toggle("is-dark", resolved === "dark");
    }
  },

  applyFontSize(size) {
    document.body.setAttribute("data-fontsize", size);
  },

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
    const order = ["light", "dark", "system"];
    const idx = order.indexOf(this.current);
    const next = order[(idx + 1) % order.length];
    this.apply(next);
    return next;
  }
};
