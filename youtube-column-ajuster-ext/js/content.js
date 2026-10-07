/**
 * content.js — injected into youtube.com, runs at document_start.
 *
 * Strategy: build one <style> tag and keep its textContent in sync with the
 * saved settings, instead of walking the DOM with a MutationObserver.
 * YouTube is a single-page app that constantly re-renders grid elements, but
 * a stylesheet rule keeps applying to every newly rendered node for free —
 * far more robust (and far cheaper, CPU-wise) than re-applying inline styles
 * on every mutation.
 *
 * Depends on storage.js being loaded first (see manifest.json content_scripts
 * order), which provides `DEFAULT_SETTINGS` and the `store` helper.
 */

(() => {
  // Guard against double-injection (YouTube's SPA navigation can sometimes
  // re-run content scripts on soft navigations in some Chromium versions).
  if (window.__ycaLoaded) return;
  window.__ycaLoaded = true;

  const STYLE_ID = "yca-style";

  /** Get (or lazily create) the single <style> tag we own. */
  function ensureStyleTag() {
    let tag = document.getElementById(STYLE_ID);
    if (tag) return tag;
    tag = document.createElement("style");
    tag.id = STYLE_ID;
    (document.head || document.documentElement).appendChild(tag);
    return tag;
  }

  /** Build the grid-column override rules for one page context. */
  function columnRule(scopeSelector, n) {
    return `
      ${scopeSelector} {
        --ytd-rich-grid-items-per-row: ${n} !important;
        --ytd-rich-grid-posts-per-row: ${n} !important;
      }
      ${scopeSelector} #contents.ytd-rich-grid-renderer,
      ${scopeSelector} > #contents {
        grid-template-columns: repeat(${n}, minmax(0, 1fr)) !important;
      }
      ${scopeSelector} #contents > ytd-rich-grid-row,
      ${scopeSelector} #contents > ytd-rich-grid-row > #contents {
        display: contents !important;
      }
    `;
  }

  /** Translate the settings object into the full CSS payload. */
  function buildCss(settings) {
    if (!settings.enabled) return "";

    let css = "";

    if (settings.useCustomColumns) {
      if (settings.perPageColumns) {
        css += columnRule(
          'ytd-browse[page-subtype="home"] ytd-rich-grid-renderer',
          Math.round(settings.columnsHome)
        );
        css += columnRule(
          'ytd-browse[page-subtype="subscriptions"] ytd-rich-grid-renderer',
          Math.round(settings.columnsSubscriptions)
        );
        css += columnRule(
          'ytd-browse[page-subtype="channel"] ytd-rich-grid-renderer',
          Math.round(settings.columnsChannel)
        );
      } else if (settings.columns > 0) {
        css += columnRule("ytd-rich-grid-renderer", Math.round(settings.columns));
      }
    }

    if (settings.hideShorts) {
      css += `
        ytd-rich-shelf-renderer[is-shorts],
        ytd-reel-shelf-renderer,
        ytd-guide-entry-renderer a[title="Shorts"],
        ytd-mini-guide-entry-renderer[aria-label="Shorts"] {
          display: none !important;
        }
      `;
    }

    if (settings.compactCards) {
      css += `
        ytd-rich-grid-media #metadata-line,
        ytd-rich-grid-media #description-text,
        ytd-rich-grid-media #avatar-link,
        ytd-rich-grid-media ytd-channel-name {
          display: none !important;
        }
        ytd-rich-grid-media #details {
          margin-top: 4px !important;
        }
      `;
    }

    if (settings.hideComments) {
      css += `
        ytd-comments#comments {
          display: none !important;
        }
      `;
    }

    if (settings.hideEndCards) {
      css += `
        .ytp-ce-element,
        .ytp-endscreen-content,
        .ytp-ce-covering-overlay {
          display: none !important;
        }
      `;
    }

    if (settings.focusMode) {
      css += `
        #secondary.ytd-watch-flexy {
          display: none !important;
        }
        #primary.ytd-watch-flexy {
          max-width: 100% !important;
          margin: 0 auto !important;
        }
      `;
    }

    return css;
  }

  function applySettings(settings) {
    ensureStyleTag().textContent = buildCss(settings);
  }

  function loadAndApply() {
    chrome.storage.local.get(["yca_settings"], (result) => {
      const settings = { ...DEFAULT_SETTINGS, ...(result.yca_settings || {}) };
      applySettings(settings);
    });
  }

  // Apply as early as possible. If document.head doesn't exist yet (we run at
  // document_start), ensureStyleTag() falls back to documentElement, and we
  // re-apply once DOMContentLoaded fires just to be safe on older engines.
  loadAndApply();
  if (!document.head) {
    document.addEventListener("DOMContentLoaded", loadAndApply, { once: true });
  }

  // Live-update: any change made in the popup/options page (or on another
  // synced device) is reflected on every open YouTube tab immediately.
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.yca_settings) {
      const settings = { ...DEFAULT_SETTINGS, ...changes.yca_settings.newValue };
      applySettings(settings);
    }
  });
})();
