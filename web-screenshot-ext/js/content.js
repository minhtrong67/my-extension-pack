// SmartShot — content script
// Injected on demand via chrome.scripting.executeScript (not declared statically),
// so it only ever runs on the tab the user actively triggers a capture from.

(() => {
  if (window.__smartshotContentLoaded) return;
  window.__smartshotContentLoaded = true;

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || message.target !== "content") return false;

    if (message.type === "get-page-metrics") {
      const de = document.documentElement;
      sendResponse({
        totalHeight: Math.max(de.scrollHeight, document.body ? document.body.scrollHeight : 0),
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
        dpr: window.devicePixelRatio || 1,
        originalScrollY: window.scrollY,
        originalScrollX: window.scrollX
      });
      return true;
    }

    if (message.type === "scroll-to") {
      window.scrollTo(message.x || 0, message.y || 0);
      // Wait one animation frame so layout/paint settles before we report back.
      requestAnimationFrame(() => requestAnimationFrame(() => sendResponse({ ok: true })));
      return true;
    }

    if (message.type === "restore-scroll") {
      window.scrollTo(message.x || 0, message.y || 0);
      sendResponse({ ok: true });
      return true;
    }

    if (message.type === "start-area-selection") {
      startAreaSelection(sendResponse);
      return true;
    }

    return false;
  });

  function startAreaSelection(sendResponse) {
    const stale = document.getElementById("__smartshot_overlay");
    if (stale) {
      stale.remove();
      const staleHint = document.getElementById("__smartshot_hint");
      const staleBox = document.getElementById("__smartshot_box");
      if (staleHint) staleHint.remove();
      if (staleBox) staleBox.remove();
    }

    const overlay = document.createElement("div");
    overlay.id = "__smartshot_overlay";
    Object.assign(overlay.style, {
      position: "fixed",
      inset: "0",
      background: "rgba(20, 24, 33, 0.35)",
      zIndex: "2147483647",
      cursor: "crosshair"
    });

    const hint = document.createElement("div");
    hint.id = "__smartshot_hint";
    Object.assign(hint.style, {
      position: "fixed",
      top: "16px",
      left: "50%",
      transform: "translateX(-50%)",
      background: "#1f2430",
      color: "#fff",
      padding: "8px 16px",
      borderRadius: "8px",
      fontFamily: "'Be Vietnam Pro', -apple-system, sans-serif",
      fontSize: "13px",
      fontWeight: "600",
      boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
      pointerEvents: "none",
      userSelect: "none"
    });
    hint.textContent = document.documentElement.lang === "vi"
      ? "Kéo để chọn vùng chụp — nhấn Esc để huỷ"
      : "Drag to select an area — press Esc to cancel";

    const selectionBox = document.createElement("div");
    selectionBox.id = "__smartshot_box";
    Object.assign(selectionBox.style, {
      position: "fixed",
      border: "2px solid #4285F4",
      background: "rgba(66, 133, 244, 0.15)",
      display: "none",
      zIndex: "2147483647",
      pointerEvents: "none",
      userSelect: "none"
    });

    overlay.style.userSelect = "none";

    document.documentElement.appendChild(overlay);
    document.documentElement.appendChild(hint);
    document.documentElement.appendChild(selectionBox);

    let startX = 0;
    let startY = 0;
    let dragging = false;

    function cleanup() {
      overlay.remove();
      hint.remove();
      selectionBox.remove();
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("mousemove", onMouseMove, true);
      document.removeEventListener("mouseup", onMouseUp, true);
    }

    function onKeyDown(e) {
      if (e.key === "Escape") {
        cleanup();
        sendResponse({ ok: false, cancelled: true });
      }
    }

    function onMouseMove(e) {
      if (!dragging) return;
      const x = Math.min(e.clientX, startX);
      const y = Math.min(e.clientY, startY);
      const w = Math.abs(e.clientX - startX);
      const h = Math.abs(e.clientY - startY);
      selectionBox.style.left = `${x}px`;
      selectionBox.style.top = `${y}px`;
      selectionBox.style.width = `${w}px`;
      selectionBox.style.height = `${h}px`;
    }

    function onMouseUp(e) {
      if (!dragging) return;
      dragging = false;
      const x = Math.min(e.clientX, startX);
      const y = Math.min(e.clientY, startY);
      const w = Math.abs(e.clientX - startX);
      const h = Math.abs(e.clientY - startY);
      cleanup();
      if (w < 4 || h < 4) {
        sendResponse({ ok: false, cancelled: true });
        return;
      }
      sendResponse({
        ok: true,
        rect: { x, y, width: w, height: h },
        dpr: window.devicePixelRatio || 1
      });
    }

    overlay.addEventListener("mousedown", (e) => {
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      selectionBox.style.display = "block";
      selectionBox.style.left = `${startX}px`;
      selectionBox.style.top = `${startY}px`;
      selectionBox.style.width = "0px";
      selectionBox.style.height = "0px";
    });

    document.addEventListener("mousemove", onMouseMove, true);
    document.addEventListener("mouseup", onMouseUp, true);
    document.addEventListener("keydown", onKeyDown, true);
  }
})();
