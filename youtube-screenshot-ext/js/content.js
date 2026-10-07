// TubeShot — content script (runs only on youtube.com / m.youtube.com)
// Author: gnort67

(() => {
  if (window.__tubeshotLoaded) return;
  window.__tubeshotLoaded = true;

  function findVideo() {
    return (
      document.querySelector("video.html5-main-video") ||
      document.querySelector("#movie_player video") ||
      document.querySelector("video")
    );
  }

  function getVideoTitle() {
    const candidates = [
      "h1.ytd-watch-metadata yt-formatted-string",
      "h1.title yt-formatted-string",
      "#title h1 yt-formatted-string",
      "#title h1"
    ];
    for (const sel of candidates) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) return el.textContent.trim();
    }
    return document.title.replace(/\s*-\s*YouTube\s*$/i, "").trim() || "YouTube video";
  }

  function getChannelName() {
    const candidates = ["#channel-name #text", "ytd-channel-name #text", "#upload-info #channel-name"];
    for (const sel of candidates) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) return el.textContent.trim();
    }
    return "";
  }

  function getVideoId() {
    try {
      const u = new URL(window.location.href);
      if (u.searchParams.get("v")) return u.searchParams.get("v");
      const parts = u.pathname.split("/").filter(Boolean);
      const shortsIdx = parts.indexOf("shorts");
      if (shortsIdx !== -1 && parts[shortsIdx + 1]) return parts[shortsIdx + 1];
      return "video";
    } catch (e) {
      return "video";
    }
  }

  function formatTime(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds || 0));
    const hh = Math.floor(s / 3600);
    const mm = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return hh > 0 ? `${hh}:${pad(mm)}:${pad(ss)}` : `${mm}:${pad(ss)}`;
  }

  function truncateText(ctx, text, maxWidth) {
    if (ctx.measureText(text).width <= maxWidth) return text;
    let t = text;
    while (t.length > 1 && ctx.measureText(t + "\u2026").width > maxWidth) {
      t = t.slice(0, -1);
    }
    return t + "\u2026";
  }

  function drawTimestampBadge(ctx, w, h, label) {
    const fontSize = Math.max(14, Math.round(h * 0.032));
    ctx.font = `600 ${fontSize}px 'Be Vietnam Pro', Arial, sans-serif`;
    const paddingX = Math.round(h * 0.012) + 8;
    const paddingY = Math.round(h * 0.01) + 5;
    const textW = ctx.measureText(label).width;
    const boxW = textW + paddingX * 2;
    const boxH = fontSize + paddingY * 2;
    const margin = Math.round(h * 0.02) + 6;
    const x = w - boxW - margin;
    const y = h - boxH - margin;

    ctx.fillStyle = "rgba(15, 15, 15, 0.78)";
    ctx.beginPath();
    const r = 6;
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + boxW, y, x + boxW, y + boxH, r);
    ctx.arcTo(x + boxW, y + boxH, x, y + boxH, r);
    ctx.arcTo(x, y + boxH, x, y, r);
    ctx.arcTo(x, y, x + boxW, y, r);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + paddingX, y + boxH / 2 + 1);
  }

  function drawCaption(ctx, w, videoH, captionH, title, channel, timeLabel) {
    ctx.fillStyle = "#0f0f0f";
    ctx.fillRect(0, videoH, w, captionH);

    const pad = Math.round(captionH * 0.18);
    const titleSize = Math.max(13, Math.round(captionH * 0.34));
    const metaSize = Math.max(11, Math.round(captionH * 0.24));

    ctx.fillStyle = "#ffffff";
    ctx.font = `700 ${titleSize}px 'Be Vietnam Pro', Arial, sans-serif`;
    ctx.textBaseline = "top";
    const titleY = videoH + pad * 0.7;
    ctx.fillText(truncateText(ctx, title, w - pad * 2), pad, titleY);

    ctx.fillStyle = "#aaaaaa";
    ctx.font = `500 ${metaSize}px 'Be Vietnam Pro', Arial, sans-serif`;
    const metaText = channel ? `${channel} \u00B7 ${timeLabel}` : timeLabel;
    const metaY = titleY + titleSize + pad * 0.35;
    ctx.fillText(truncateText(ctx, metaText, w - pad * 2), pad, metaY);
  }

  function buildThumbnail(sourceCanvas) {
    const maxSide = 160;
    const scale = Math.min(1, maxSide / Math.max(sourceCanvas.width, sourceCanvas.height));
    const tw = Math.max(1, Math.round(sourceCanvas.width * scale));
    const th = Math.max(1, Math.round(sourceCanvas.height * scale));
    const tmp = document.createElement("canvas");
    tmp.width = tw;
    tmp.height = th;
    tmp.getContext("2d").drawImage(sourceCanvas, 0, 0, tw, th);
    return tmp.toDataURL("image/jpeg", 0.7);
  }

  function captureFrame(options) {
    const video = findVideo();
    if (!video || !video.videoWidth) {
      return { ok: false, error: "no-video" };
    }

    const scaleFactor = (options.scale || 100) / 100;
    const w = Math.max(1, Math.round(video.videoWidth * scaleFactor));
    const h = Math.max(1, Math.round(video.videoHeight * scaleFactor));

    const title = getVideoTitle();
    const channel = getChannelName();
    const timeLabel = formatTime(video.currentTime);

    let captionH = 0;
    if (options.captionInfo) {
      captionH = Math.max(46, Math.round(h * 0.16));
    }

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h + captionH;
    const ctx = canvas.getContext("2d");

    try {
      ctx.drawImage(video, 0, 0, w, h);
    } catch (e) {
      return { ok: false, error: "draw-failed" };
    }

    if (options.watermarkTimestamp) {
      drawTimestampBadge(ctx, w, h, timeLabel);
    }
    if (options.captionInfo) {
      drawCaption(ctx, w, h, captionH, title, channel, timeLabel);
    }

    const mime = options.format === "jpeg" ? "image/jpeg" : "image/png";
    const quality = options.format === "jpeg" ? Math.min(Math.max((options.quality || 90) / 100, 0.1), 1) : undefined;

    let dataUrl;
    try {
      dataUrl = canvas.toDataURL(mime, quality);
    } catch (e) {
      return { ok: false, error: "encode-failed" };
    }

    const thumbnail = buildThumbnail(canvas);
    const videoId = getVideoId();
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(video.currentTime)}s`;

    return {
      ok: true,
      dataUrl,
      thumbnail,
      title,
      channel,
      timeLabel,
      videoId,
      videoUrl,
      width: canvas.width,
      height: canvas.height
    };
  }

  function getStatus() {
    const video = findVideo();
    if (!video) return { ok: true, hasVideo: false };
    return {
      ok: true,
      hasVideo: true,
      title: getVideoTitle(),
      channel: getChannelName(),
      currentTime: video.currentTime || 0,
      duration: video.duration || 0,
      paused: video.paused
    };
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || message.target !== "tubeshot-content") return false;

    if (message.type === "get-status") {
      sendResponse(getStatus());
      return true;
    }

    if (message.type === "seek") {
      const video = findVideo();
      if (video && video.duration) {
        video.currentTime = Math.min(Math.max(video.currentTime + message.delta, 0), video.duration);
      }
      sendResponse(getStatus());
      return true;
    }

    if (message.type === "seek-to") {
      const video = findVideo();
      if (video && video.duration) {
        video.currentTime = Math.min(Math.max(message.seconds, 0), video.duration);
      }
      sendResponse(getStatus());
      return true;
    }

    if (message.type === "toggle-play") {
      const video = findVideo();
      if (video) {
        if (video.paused) video.play();
        else video.pause();
      }
      sendResponse(getStatus());
      return true;
    }

    if (message.type === "capture-frame") {
      sendResponse(captureFrame(message.options || {}));
      return true;
    }

    return false;
  });
})();
