// PixFlip — offscreen document script
// Runs inside a hidden extension page (has full DOM/canvas access), invoked by
// background.js via chrome.runtime.sendMessage because MV3 service workers
// cannot reliably use FileReader / long-lived blob URLs for this purpose.

const MIME_BY_FORMAT = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp"
};

const EXT_BY_FORMAT = {
  png: "png",
  jpeg: "jpg",
  webp: "webp"
};

function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error("FileReader failed"));
    reader.readAsDataURL(blob);
  });
}

function extFromMime(mime) {
  if (!mime) return "img";
  if (mime.includes("png")) return "png";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  if (mime.includes("svg")) return "svg";
  if (mime.includes("bmp")) return "bmp";
  return "img";
}

function drawToCanvas(canvasEl, bitmap, maxSide) {
  let w = bitmap.width;
  let h = bitmap.height;
  if (maxSide && Math.max(w, h) > maxSide) {
    const scale = maxSide / Math.max(w, h);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }
  canvasEl.width = w;
  canvasEl.height = h;
  const ctx = canvasEl.getContext("2d");
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  return ctx;
}

async function makeThumbnail(bitmap) {
  const thumbCanvas = document.getElementById("thumbCanvas");
  drawToCanvas(thumbCanvas, bitmap, 96);
  return thumbCanvas.toDataURL("image/jpeg", 0.7);
}

async function convertImage({ url, format, quality }) {
  const resp = await fetch(url, { credentials: "omit" });
  if (!resp.ok) throw new Error(`Fetch failed (${resp.status})`);
  const originalBlob = await resp.blob();

  // "original": no re-encoding at all — download the exact bytes we fetched.
  if (format === "original") {
    const bitmap = await createImageBitmap(originalBlob).catch(() => null);
    const thumbnail = bitmap ? await makeThumbnail(bitmap) : null;
    const dataUrl = await blobToDataURL(originalBlob);
    const ext = extFromMime(originalBlob.type) || "img";
    return { dataUrl, thumbnail, ext, mime: originalBlob.type || "application/octet-stream" };
  }

  const bitmap = await createImageBitmap(originalBlob);
  const workCanvas = document.getElementById("workCanvas");
  drawToCanvas(workCanvas, bitmap, null);

  const mime = MIME_BY_FORMAT[format] || "image/png";
  const q = typeof quality === "number" ? Math.min(Math.max(quality, 1), 100) / 100 : 0.92;

  const outBlob = await new Promise((resolve, reject) => {
    workCanvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Canvas encoding failed"))),
      mime,
      mime === "image/png" ? undefined : q
    );
  });

  const thumbnail = await makeThumbnail(bitmap);
  const dataUrl = await blobToDataURL(outBlob);
  const ext = EXT_BY_FORMAT[format] || "img";
  return { dataUrl, thumbnail, ext, mime };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.target !== "offscreen" || message.type !== "convert-image") {
    return false;
  }
  convertImage(message.payload)
    .then((result) => sendResponse({ ok: true, ...result }))
    .catch((err) => sendResponse({ ok: false, error: err && err.message ? err.message : String(err) }));
  return true; // keep the message channel open for the async response
});
