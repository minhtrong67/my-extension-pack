// SmartShot — editor script
// Author: gnort67

let settings = { ...DEFAULT_SETTINGS };
let pending = null; // { dataUrl, thumbnail, captureType, width, height }

let originalDataUrl = null; // the very first loaded capture, used by "Clear all"
let currentTool = "move";
let currentColor = "#E0522E";
let currentSize = 4;

let undoStack = [];
let redoStack = [];
const MAX_UNDO = 15;

let isDragging = false;
let startX = 0;
let startY = 0;
let lastX = 0;
let lastY = 0;
let preDragImageData = null;
let textClickPoint = null;

const el = (id) => document.getElementById(id);

const refs = {
  editorDims: el("editorDims"),
  closeEditorBtn: el("closeEditorBtn"),
  toolGroup: el("toolGroup"),
  colorGroup: el("colorGroup"),
  customColor: el("customColor"),
  sizeSlider: el("sizeSlider"),
  undoBtn: el("undoBtn"),
  redoBtn: el("redoBtn"),
  clearAllBtn: el("clearAllBtn"),
  canvasScroll: el("canvasScroll"),
  canvasWrap: el("canvasWrap"),
  canvas: el("editorCanvas"),
  textInputOverlay: el("textInputOverlay"),
  formatSelect: el("formatSelect"),
  qualityInline: el("qualityInline"),
  qualitySlider: el("qualitySlider"),
  qualityValue: el("qualityValue"),
  filenameInput: el("filenameInput"),
  copyClipboardBtn: el("copyClipboardBtn"),
  downloadBtn: el("downloadBtn"),
  toast: el("toast")
};

const ctx = refs.canvas.getContext("2d");

let toastTimer = null;
function showToast(key) {
  refs.toast.textContent = i18n.t(key);
  refs.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => refs.toast.classList.remove("show"), 1900);
}

function updateDims() {
  refs.editorDims.textContent = `${refs.canvas.width} \u00D7 ${refs.canvas.height}`;
}

/* ============ Loading the captured image ============ */

function loadImageToCanvas(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      refs.canvas.width = img.naturalWidth;
      refs.canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      updateDims();
      resolve();
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/* ============ Undo / redo ============ */

function pushUndo(dataUrl) {
  undoStack.push(dataUrl);
  if (undoStack.length > MAX_UNDO) undoStack.shift();
  redoStack = [];
}

async function restoreFromDataUrl(dataUrl) {
  await loadImageToCanvas(dataUrl);
}

async function undo() {
  if (undoStack.length === 0) {
    showToast("toastNothingToUndo");
    return;
  }
  const current = refs.canvas.toDataURL("image/png");
  redoStack.push(current);
  const prev = undoStack.pop();
  await restoreFromDataUrl(prev);
}

async function redo() {
  if (redoStack.length === 0) {
    showToast("toastNothingToRedo");
    return;
  }
  const current = refs.canvas.toDataURL("image/png");
  undoStack.push(current);
  const next = redoStack.pop();
  await restoreFromDataUrl(next);
}

async function clearAllAnnotations() {
  const current = refs.canvas.toDataURL("image/png");
  pushUndo(current);
  await restoreFromDataUrl(originalDataUrl);
}

/* ============ Drawing primitives ============ */

function drawArrow(x1, y1, x2, y2, color, size) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = size;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLen = 8 + size * 2.4;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

function drawRect(x, y, w, h, color, size) {
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.strokeRect(x, y, w, h);
}

function drawEllipse(x, y, w, h, color, size) {
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h / 2, Math.abs(w) / 2, Math.abs(h) / 2, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawHighlight(x1, y1, x2, y2, color, size) {
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(size * 3, 12);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function pixelateRegion(x, y, w, h) {
  x = Math.max(0, Math.round(x));
  y = Math.max(0, Math.round(y));
  w = Math.min(Math.round(w), refs.canvas.width - x);
  h = Math.min(Math.round(h), refs.canvas.height - y);
  if (w <= 0 || h <= 0) return;

  const blockSize = Math.max(6, Math.round(Math.min(w, h) / 12));
  const imgData = ctx.getImageData(x, y, w, h);
  const data = imgData.data;

  for (let by = 0; by < h; by += blockSize) {
    for (let bx = 0; bx < w; bx += blockSize) {
      const bw = Math.min(blockSize, w - bx);
      const bh = Math.min(blockSize, h - by);
      let r = 0, g = 0, b = 0, a = 0, count = 0;
      for (let yy = 0; yy < bh; yy++) {
        for (let xx = 0; xx < bw; xx++) {
          const idx = ((by + yy) * w + (bx + xx)) * 4;
          r += data[idx]; g += data[idx + 1]; b += data[idx + 2]; a += data[idx + 3];
          count++;
        }
      }
      r = Math.round(r / count); g = Math.round(g / count); b = Math.round(b / count); a = Math.round(a / count);
      for (let yy = 0; yy < bh; yy++) {
        for (let xx = 0; xx < bw; xx++) {
          const idx = ((by + yy) * w + (bx + xx)) * 4;
          data[idx] = r; data[idx + 1] = g; data[idx + 2] = b; data[idx + 3] = a;
        }
      }
    }
  }
  ctx.putImageData(imgData, x, y);
}

function cropCanvas(x, y, w, h) {
  x = Math.max(0, Math.round(x));
  y = Math.max(0, Math.round(y));
  w = Math.min(Math.round(w), refs.canvas.width - x);
  h = Math.min(Math.round(h), refs.canvas.height - y);
  if (w <= 0 || h <= 0) return;

  const extracted = ctx.getImageData(x, y, w, h);
  refs.canvas.width = w;
  refs.canvas.height = h;
  ctx.putImageData(extracted, 0, 0);
  updateDims();
}

function sizeToFontPx(size) {
  return 12 + size * 3;
}

/* ============ Tool selection ============ */

refs.toolGroup.querySelectorAll(".tool-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    refs.toolGroup.querySelectorAll(".tool-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentTool = btn.dataset.tool;
    refs.canvas.style.cursor = currentTool === "move" ? "default" : "crosshair";
  });
});

refs.colorGroup.querySelectorAll(".color-swatch").forEach((swatch) => {
  swatch.addEventListener("click", () => {
    refs.colorGroup.querySelectorAll(".color-swatch").forEach((s) => s.classList.remove("active"));
    swatch.classList.add("active");
    currentColor = swatch.dataset.color;
    refs.customColor.value = currentColor;
  });
});
refs.customColor.addEventListener("input", () => {
  currentColor = refs.customColor.value;
  refs.colorGroup.querySelectorAll(".color-swatch").forEach((s) => s.classList.remove("active"));
});

refs.sizeSlider.addEventListener("input", () => {
  currentSize = parseInt(refs.sizeSlider.value, 10);
});

refs.undoBtn.addEventListener("click", undo);
refs.redoBtn.addEventListener("click", redo);
refs.clearAllBtn.addEventListener("click", clearAllAnnotations);

/* ============ Canvas pointer interactions ============ */

function canvasPoint(e) {
  return { x: e.offsetX, y: e.offsetY };
}

function canvasDataUrlFromImageData(imageData) {
  const tmp = document.createElement("canvas");
  tmp.width = imageData.width;
  tmp.height = imageData.height;
  tmp.getContext("2d").putImageData(imageData, 0, 0);
  return tmp.toDataURL("image/png");
}

refs.canvas.addEventListener("mousedown", (e) => {
  if (currentTool === "move") return;

  if (currentTool === "text") {
    const p = canvasPoint(e);
    textClickPoint = p;
    const overlay = refs.textInputOverlay;
    overlay.style.left = `${p.x}px`;
    overlay.style.top = `${p.y - sizeToFontPx(currentSize) * 0.75}px`;
    overlay.style.fontSize = `${sizeToFontPx(currentSize)}px`;
    overlay.style.color = currentColor;
    overlay.value = "";
    overlay.classList.remove("hidden");
    overlay.focus();
    return;
  }

  const p = canvasPoint(e);
  isDragging = true;
  startX = p.x;
  startY = p.y;
  lastX = p.x;
  lastY = p.y;
  preDragImageData = ctx.getImageData(0, 0, refs.canvas.width, refs.canvas.height);

  if (currentTool === "pen") {
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + 0.01, p.y + 0.01);
    ctx.stroke();
  }
});

refs.canvas.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  const p = canvasPoint(e);

  if (currentTool === "pen") {
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastX = p.x;
    lastY = p.y;
    return;
  }

  ctx.putImageData(preDragImageData, 0, 0);
  const x = Math.min(startX, p.x);
  const y = Math.min(startY, p.y);
  const w = Math.abs(p.x - startX);
  const h = Math.abs(p.y - startY);

  if (currentTool === "arrow") drawArrow(startX, startY, p.x, p.y, currentColor, currentSize);
  else if (currentTool === "rect") drawRect(x, y, w, h, currentColor, currentSize);
  else if (currentTool === "ellipse") drawEllipse(x, y, w, h, currentColor, currentSize);
  else if (currentTool === "highlight") drawHighlight(startX, startY, p.x, p.y, currentColor, currentSize);
  else if (currentTool === "blur" || currentTool === "crop") {
    ctx.strokeStyle = currentTool === "crop" ? "#3568D4" : "#8B92A3";
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);
  }
});

refs.canvas.addEventListener("mouseup", (e) => {
  if (!isDragging) return;
  isDragging = false;
  const p = canvasPoint(e);

  if (currentTool === "pen") {
    if (preDragImageData) pushUndo(canvasDataUrlFromImageData(preDragImageData));
    preDragImageData = null;
    return;
  }

  const x = Math.min(startX, p.x);
  const y = Math.min(startY, p.y);
  const w = Math.abs(p.x - startX);
  const h = Math.abs(p.y - startY);

  ctx.putImageData(preDragImageData, 0, 0);

  if (w < 3 && h < 3) {
    preDragImageData = null;
    return; // too small to be an intentional shape
  }

  const beforeUrl = refs.canvas.toDataURL("image/png");

  if (currentTool === "arrow") drawArrow(startX, startY, p.x, p.y, currentColor, currentSize);
  else if (currentTool === "rect") drawRect(x, y, w, h, currentColor, currentSize);
  else if (currentTool === "ellipse") drawEllipse(x, y, w, h, currentColor, currentSize);
  else if (currentTool === "highlight") drawHighlight(startX, startY, p.x, p.y, currentColor, currentSize);
  else if (currentTool === "blur") pixelateRegion(x, y, w, h);
  else if (currentTool === "crop") {
    cropCanvas(x, y, w, h);
    showToast("toastCropApplied");
  }

  pushUndo(beforeUrl);
  preDragImageData = null;
});

/* Text input overlay */
function commitText() {
  const overlay = refs.textInputOverlay;
  const value = overlay.value.trim();
  overlay.classList.add("hidden");
  if (!value || !textClickPoint) {
    textClickPoint = null;
    return;
  }
  const beforeUrl = refs.canvas.toDataURL("image/png");
  ctx.font = `600 ${sizeToFontPx(currentSize)}px 'Be Vietnam Pro', sans-serif`;
  ctx.fillStyle = currentColor;
  ctx.textBaseline = "top";
  ctx.fillText(value, textClickPoint.x, textClickPoint.y - sizeToFontPx(currentSize) * 0.75);
  pushUndo(beforeUrl);
  textClickPoint = null;
}
refs.textInputOverlay.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    commitText();
  } else if (e.key === "Escape") {
    refs.textInputOverlay.classList.add("hidden");
    textClickPoint = null;
  }
});
refs.textInputOverlay.addEventListener("blur", commitText);

/* ============ Format / quality / filename ============ */

function updateQualityVisibility() {
  refs.qualityInline.classList.toggle("hidden", refs.formatSelect.value === "png");
}
refs.formatSelect.addEventListener("change", updateQualityVisibility);
refs.qualitySlider.addEventListener("input", () => {
  refs.qualityValue.textContent = `${refs.qualitySlider.value}%`;
});

function currentMimeAndQuality() {
  const format = refs.formatSelect.value;
  const mime = format === "jpeg" ? "image/jpeg" : "image/png";
  const quality = parseInt(refs.qualitySlider.value, 10) / 100;
  return { format, mime, quality };
}

function canvasThumbnail() {
  const tmp = document.createElement("canvas");
  const maxSide = 120;
  const scale = Math.min(1, maxSide / Math.max(refs.canvas.width, refs.canvas.height));
  tmp.width = Math.max(1, Math.round(refs.canvas.width * scale));
  tmp.height = Math.max(1, Math.round(refs.canvas.height * scale));
  tmp.getContext("2d").drawImage(refs.canvas, 0, 0, tmp.width, tmp.height);
  return tmp.toDataURL("image/jpeg", 0.7);
}

/* ============ Save actions ============ */

refs.downloadBtn.addEventListener("click", () => {
  const { format, mime, quality } = currentMimeAndQuality();
  refs.canvas.toBlob(
    async (blob) => {
      if (!blob) return;
      const ext = format === "jpeg" ? "jpg" : "png";
      const baseName = (refs.filenameInput.value.trim() || "smartshot").replace(/\.[a-zA-Z0-9]+$/, "");
      const filename = `${baseName}.${ext}`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);

      await store.addToHistory(
        {
          captureType: pending ? pending.captureType : "visible",
          filename,
          format,
          action: "download",
          thumbnail: canvasThumbnail()
        },
        settings.historyLimit
      );
      showToast("toastDownloaded");
    },
    mime,
    format === "jpeg" ? quality : undefined
  );
});

refs.copyClipboardBtn.addEventListener("click", () => {
  refs.canvas.toBlob(async (blob) => {
    if (!blob) return;
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      await store.addToHistory(
        {
          captureType: pending ? pending.captureType : "visible",
          filename: null,
          format: "png",
          action: "clipboard",
          thumbnail: canvasThumbnail()
        },
        settings.historyLimit
      );
      showToast("toastCopied");
    } catch (e) {
      const dataUrl = refs.canvas.toDataURL("image/png");
      chrome.runtime.sendMessage({ type: "copy-to-clipboard-request", dataUrl }, async (res) => {
        if (res && res.ok) {
          await store.addToHistory(
            {
              captureType: pending ? pending.captureType : "visible",
              filename: null,
              format: "png",
              action: "clipboard",
              thumbnail: canvasThumbnail()
            },
            settings.historyLimit
          );
          showToast("toastCopied");
        } else {
          showToast("toastCopyFailed");
        }
      });
    }
  }, "image/png");
});

refs.closeEditorBtn.addEventListener("click", () => {
  if (undoStack.length > 0) {
    const msg = i18n.current === "vi"
      ? "Bạn có thay đổi chưa lưu. Đóng mà không lưu?"
      : "You have unsaved changes. Close without saving?";
    if (!window.confirm(msg)) return;
  }
  window.close();
});

/* ============ Init ============ */
(async function init() {
  settings = await store.loadSettings();
  i18n.setLang(settings.language);
  themeManager.apply(settings.theme);
  themeManager.applyFontSize(settings.fontSize);
  i18n.apply();

  refs.formatSelect.value = settings.format;
  refs.qualitySlider.value = settings.quality;
  refs.qualityValue.textContent = `${settings.quality}%`;
  updateQualityVisibility();
  refs.sizeSlider.value = currentSize;

  pending = await store.takePendingCapture();
  if (!pending || !pending.dataUrl) {
    showToast("toastLoadFailed");
    return;
  }

  originalDataUrl = pending.dataUrl;
  await loadImageToCanvas(pending.dataUrl);

  const now = new Date();
  const stamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  refs.filenameInput.value = `smartshot-${pending.captureType || "visible"}-${stamp}`;
})();
