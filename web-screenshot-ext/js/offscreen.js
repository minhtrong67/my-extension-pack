// SmartShot — offscreen document script
// Runs inside a hidden extension page (full DOM/canvas access), invoked by
// background.js because MV3 service workers cannot reliably do canvas work
// or clipboard writes on their own.

function dataUrlToImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

function canvasToDataUrl(canvas, format, quality) {
  const mime = format === "jpeg" ? "image/jpeg" : "image/png";
  return canvas.toDataURL(mime, mime === "image/jpeg" ? quality : undefined);
}

async function makeThumbnail(canvas) {
  const thumbCanvas = document.getElementById("thumbCanvas");
  const maxSide = 120;
  const scale = Math.min(1, maxSide / Math.max(canvas.width, canvas.height));
  thumbCanvas.width = Math.max(1, Math.round(canvas.width * scale));
  thumbCanvas.height = Math.max(1, Math.round(canvas.height * scale));
  thumbCanvas.getContext("2d").drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
  return thumbCanvas.toDataURL("image/jpeg", 0.7);
}

/* ---- Crop a captured screenshot to a CSS-pixel rect ---- */
async function cropImage({ dataUrl, rect, dpr, format, quality }) {
  const img = await dataUrlToImage(dataUrl);
  const canvas = document.getElementById("workCanvas");
  const sx = Math.round(rect.x * dpr);
  const sy = Math.round(rect.y * dpr);
  const sw = Math.round(rect.width * dpr);
  const sh = Math.round(rect.height * dpr);
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

  const thumbnail = await makeThumbnail(canvas);
  const outUrl = canvasToDataUrl(canvas, format, quality);
  return { dataUrl: outUrl, thumbnail, width: sw, height: sh };
}

/* ---- Stitch multiple viewport captures into one tall image ---- */
async function stitchImages({ pieces, totalWidth, totalHeight, dpr, format, quality }) {
  const canvas = document.getElementById("workCanvas");
  canvas.width = Math.round(totalWidth * dpr);
  canvas.height = Math.round(totalHeight * dpr);
  const ctx = canvas.getContext("2d");

  for (const piece of pieces) {
    const img = await dataUrlToImage(piece.dataUrl);
    ctx.drawImage(img, 0, Math.round(piece.y * dpr));
  }

  const thumbnail = await makeThumbnail(canvas);
  const outUrl = canvasToDataUrl(canvas, format, quality);
  return { dataUrl: outUrl, thumbnail, width: canvas.width, height: canvas.height };
}

/* ---- Re-encode a plain screenshot (visible-area capture, no crop) ---- */
async function encodeImage({ dataUrl, format, quality }) {
  const img = await dataUrlToImage(dataUrl);
  const canvas = document.getElementById("workCanvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  canvas.getContext("2d").drawImage(img, 0, 0);

  const thumbnail = await makeThumbnail(canvas);
  const outUrl = canvasToDataUrl(canvas, format, quality);
  return { dataUrl: outUrl, thumbnail, width: canvas.width, height: canvas.height };
}

/* ---- Copy a data URL image to the system clipboard ---- */
async function copyToClipboard({ dataUrl }) {
  const img = await dataUrlToImage(dataUrl);
  const canvas = document.getElementById("workCanvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  canvas.getContext("2d").drawImage(img, 0, 0);

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), "image/png");
  });

  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
  return {};
}

const HANDLERS = {
  "crop-image": cropImage,
  "stitch-images": stitchImages,
  "encode-image": encodeImage,
  "copy-to-clipboard": copyToClipboard
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.target !== "offscreen") return false;
  const handler = HANDLERS[message.type];
  if (!handler) return false;

  handler(message.payload)
    .then((result) => sendResponse({ ok: true, ...result }))
    .catch((err) => sendResponse({ ok: false, error: err && err.message ? err.message : String(err) }));
  return true;
});
