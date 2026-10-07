/**
 * main.js — TagMark's application logic.
 *
 * TagMark is a thin, richer layer on top of Chrome's own bookmarks:
 *   - The bookmark itself (title, url, folder) lives in chrome.bookmarks —
 *     the single source of truth, shared with chrome://bookmarks.
 *   - Tags and notes are TagMark's own addition, stored in chrome.storage
 *     (see storage.js) and keyed by the bookmark's id.
 *
 * Every mutating action (create/update/move/remove) always goes through the
 * real chrome.bookmarks API first; the in-memory `bookmarks` array is then
 * refreshed from Chrome rather than optimistically patched, so TagMark can
 * never drift out of sync with what chrome://bookmarks shows.
 */

let t = I18N.en;
let settings = {};
let metaMap = {};          // { [bookmarkId]: {tags:[], note:""} }
let bookmarks = [];        // flattened, url-bearing nodes only
let folderTree = [];       // raw chrome.bookmarks tree (for folder pickers)
let duplicateUrls = new Set(); // URLs that appear on 2+ bookmarks

// UI state (not persisted, except where it mirrors a setting)
let currentView = "list";
let currentSort = "dateAdded";
let currentFolderId = "";  // "" = all folders
let currentTagFilter = "";
let showDuplicatesOnly = false;
let searchQuery = "";
let selectMode = false;
let selectedIds = new Set();
let editingId = null;      // bookmark id currently open in the edit view, or null when adding

const el = (id) => document.getElementById(id);

async function init() {
  applyTheme("system");
  settings = await store.loadSettings();
  const lang = resolveLang(settings);
  t = I18N[lang];
  themeManager.apply(settings.theme);
  themeManager.applyFontSize(settings.fontSize);
  themeManager.watchSystemChanges();
  i18n.setLang(lang);

  currentView = settings.defaultView;
  currentSort = settings.defaultSort;
  updateViewToggleUI();

  await loadEverything();
  bindEvents();
}

function applyTheme(mode) { themeManager.apply(mode); }

/** Reloads bookmarks + metadata from scratch and re-renders the list. */
async function loadEverything() {
  const [tree, meta] = await Promise.all([
    chrome.bookmarks.getTree(),
    store.loadAllMeta()
  ]);
  folderTree = tree;
  metaMap = meta;
  bookmarks = flattenTree(tree);
  computeDuplicates();
  populateFolderSelects();
  renderTagRow();
  renderList();
}

/** Walk the bookmarks tree into a flat array of url-bearing nodes, each
 *  carrying its folder path (array of ancestor folder titles) and id. */
function flattenTree(tree) {
  const out = [];
  function walk(node, path) {
    if (node.url) {
      out.push({
        id: node.id,
        title: node.title || node.url,
        url: node.url,
        dateAdded: node.dateAdded || 0,
        parentId: node.parentId,
        path
      });
    } else if (node.children) {
      // Skip the invisible synthetic root (id "0") from the path itself,
      // but still recurse into its children (Bookmarks Bar, Other, Mobile).
      const nextPath = node.id === "0" ? path : [...path, node.title];
      node.children.forEach((child) => walk(child, nextPath));
    }
  }
  tree.forEach((root) => walk(root, []));
  return out;
}

function computeDuplicates() {
  const counts = new Map();
  bookmarks.forEach((b) => counts.set(b.url, (counts.get(b.url) || 0) + 1));
  duplicateUrls = new Set([...counts.entries()].filter(([, n]) => n > 1).map(([u]) => u));
}

/** All folder nodes (no url) as a flat, depth-indented list for <select>s. */
function flattenFolders(tree) {
  const out = [];
  function walk(node, depth) {
    if (!node.url) {
      if (node.id !== "0") out.push({ id: node.id, title: node.title, depth });
      (node.children || []).forEach((c) => walk(c, node.id === "0" ? depth : depth + 1));
    }
  }
  tree.forEach((root) => walk(root, 0));
  return out;
}

function populateFolderSelects() {
  const folders = flattenFolders(folderTree);
  const indent = (d) => "\u2003".repeat(Math.max(0, d - 1)); // em-space indent

  // 1) List view filter — includes an "All folders" option
  const filterSel = el("folderFilterSelect");
  const prevFilter = filterSel.value;
  filterSel.innerHTML = `<option value="">${t.allFolders}</option>` +
    folders.map(f => `<option value="${f.id}">${indent(f.depth)}${esc(f.title)}</option>`).join("");
  filterSel.value = folders.some(f => f.id === prevFilter) ? prevFilter : "";
  currentFolderId = filterSel.value;

  // 2) Edit-view folder picker — no "All" option, must pick a real folder
  const editSel = el("editFolderSelect");
  const prevEdit = editSel.value;
  editSel.innerHTML = folders.map(f => `<option value="${f.id}">${indent(f.depth)}${esc(f.title)}</option>`).join("");
  if (folders.some(f => f.id === prevEdit)) editSel.value = prevEdit;

  // 3) Settings → default folder for Quick Add
  const defSel = el("defaultFolderSelect");
  const prevDef = defSel.value || settings.defaultFolderId;
  defSel.innerHTML = folders.map(f => `<option value="${f.id}">${indent(f.depth)}${esc(f.title)}</option>`).join("");
  if (folders.some(f => f.id === prevDef)) defSel.value = prevDef;
}

function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ── Tag filter row ─────────────────────────────────────────

function allDistinctTags() {
  const counts = new Map();
  Object.values(metaMap).forEach((m) => (m.tags || []).forEach((tag) => {
    counts.set(tag, (counts.get(tag) || 0) + 1);
  }));
  return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

function renderTagRow() {
  const row = el("tagRow");
  row.innerHTML = "";

  if (duplicateUrls.size > 0) {
    const dupChip = document.createElement("button");
    dupChip.className = "chip dup-chip" + (showDuplicatesOnly ? " active" : "");
    dupChip.innerHTML = `${esc(t.duplicates)} <span class="chip-count">${duplicateUrls.size}</span>`;
    dupChip.addEventListener("click", () => {
      showDuplicatesOnly = !showDuplicatesOnly;
      renderTagRow();
      renderList();
    });
    row.appendChild(dupChip);
  }

  allDistinctTags().forEach(([tag, count]) => {
    const chip = document.createElement("button");
    chip.className = "chip" + (currentTagFilter === tag ? " active" : "");
    chip.innerHTML = `${esc(tag)} <span class="chip-count">${count}</span>`;
    chip.addEventListener("click", () => {
      currentTagFilter = currentTagFilter === tag ? "" : tag;
      renderTagRow();
      renderList();
    });
    row.appendChild(chip);
  });
}

// ── Filter + sort ─────────────────────────────────────────

/** True if `folderId` is `ancestorId` itself or nested somewhere under it. */
function isFolderOrDescendant(folderId, ancestorId) {
  if (folderId === ancestorId) return true;
  let node = findFolderNode(folderTree, folderId);
  while (node && node.parentId) {
    if (node.parentId === ancestorId) return true;
    node = findFolderNode(folderTree, node.parentId);
  }
  return false;
}
function findFolderNode(tree, id) {
  for (const root of tree) {
    if (root.id === id) return root;
    if (root.children) {
      const found = findFolderNode(root.children, id);
      if (found) return found;
    }
  }
  return null;
}

function getFilteredSorted() {
  const q = searchQuery.trim().toLowerCase();
  let list = bookmarks.filter((b) => {
    const meta = metaMap[b.id] || { tags: [], note: "" };
    if (currentFolderId && !isFolderOrDescendant(b.parentId, currentFolderId)) return false;
    if (showDuplicatesOnly && !duplicateUrls.has(b.url)) return false;
    if (currentTagFilter && !(meta.tags || []).includes(currentTagFilter)) return false;
    if (q) {
      const hay = `${b.title} ${b.url} ${(meta.tags || []).join(" ")}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  list.sort((a, b) => {
    if (currentSort === "titleAsc") return a.title.localeCompare(b.title);
    if (currentSort === "titleDesc") return b.title.localeCompare(a.title);
    return b.dateAdded - a.dateAdded; // newest first
  });

  return list;
}

// ── List rendering ─────────────────────────────────────────

function faviconUrl(pageUrl) {
  const u = new URL(chrome.runtime.getURL("/_favicon/"));
  u.searchParams.set("pageUrl", pageUrl);
  u.searchParams.set("size", "32");
  return u.toString();
}

function renderList() {
  const list = el("bookmarkList");
  const filtered = getFilteredSorted();

  list.classList.toggle("grid-view", currentView === "grid");
  el("resultsLabel").textContent = t.resultsCount(filtered.length);

  if (filtered.length === 0) {
    list.innerHTML = "";
    list.appendChild(buildEmptyState());
    updateBulkBar();
    return;
  }

  list.innerHTML = "";
  filtered.forEach((b, idx) => list.appendChild(buildBookmarkItem(b, idx)));
  updateBulkBar();
}

function buildEmptyState() {
  const div = document.createElement("div");
  div.className = "empty-state";
  const hasActiveFilter = searchQuery || currentFolderId || currentTagFilter || showDuplicatesOnly;
  div.innerHTML = `
    <svg viewBox="0 0 24 24" width="40" height="40"><path fill="currentColor" d="M17 3H7a2 2 0 0 0-2 2v16l7-3 7 3V5a2 2 0 0 0-2-2z"/></svg>
    <span class="empty-title">${esc(t.emptyTitle)}</span>
    <span class="empty-hint">${esc(hasActiveFilter ? t.emptyHintSearch : t.emptyHintEmpty)}</span>
  `;
  return div;
}

function buildBookmarkItem(b, idx) {
  const meta = metaMap[b.id] || { tags: [], note: "" };
  const div = document.createElement("div");
  div.className = "bookmark-item";
  div.style.animationDelay = `${Math.min(idx * 20, 200)}ms`;
  if (selectMode && selectedIds.has(b.id)) div.classList.add("is-selected");

  const faviconHtml = settings.showFavicons
    ? `<img class="bm-favicon" src="${faviconUrl(b.url)}" alt="" data-fallback>`
    : "";

  const tagsHtml = settings.showTags && meta.tags && meta.tags.length
    ? `<div class="bm-tags">${meta.tags.map(tag => `<span class="bm-tag">${esc(tag)}</span>`).join("")}${duplicateUrls.has(b.url) ? `<span class="bm-dup-badge">${esc(t.duplicates)}</span>` : ""}</div>`
    : (duplicateUrls.has(b.url) ? `<div class="bm-tags"><span class="bm-dup-badge">${esc(t.duplicates)}</span></div>` : "");

  const folderPathHtml = settings.showFolderPath && b.path.length
    ? `<div class="bm-folder-path">${esc(b.path.join(" / "))}</div>`
    : "";

  const noteIconHtml = meta.note && meta.note.trim()
    ? `<span class="bm-note-badge" title="${esc(meta.note)}"><svg viewBox="0 0 24 24" width="13" height="13"><path fill="currentColor" d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg></span>`
    : "";

  div.innerHTML = `
    ${selectMode ? `<div class="bm-checkbox"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg></div>` : ""}
    ${faviconHtml}
    <div class="bm-body">
      <div class="bm-title">${esc(b.title)}</div>
      <div class="bm-url">${esc(prettyUrl(b.url))}</div>
      ${folderPathHtml}
      ${tagsHtml}
    </div>
    <div class="bm-actions">
      ${noteIconHtml}
      ${selectMode ? "" : `
        <button class="icon-btn" data-action="edit" data-id="${b.id}" title="${esc(t.editAction)}"><svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M3 17.46v3.04c0 .28.22.5.5.5h3.04c.13 0 .26-.05.35-.15L17.81 9.94l-3.75-3.75L3.15 17.1c-.1.1-.15.22-.15.36zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg></button>
        <button class="icon-btn" data-action="copy" data-id="${b.id}" title="${esc(t.copyUrl)}"><svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg></button>
      `}
    </div>
  `;

  const favImg = div.querySelector("[data-fallback]");
  if (favImg) {
    favImg.addEventListener("error", () => {
      const fallback = document.createElement("div");
      fallback.className = "bm-favicon-fallback";
      fallback.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg></div>`;
      favImg.replaceWith(fallback);
    });
  }

  div.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const action = btn.dataset.action;
      if (action === "edit") openEditView(b.id);
      if (action === "copy") copyUrl(b.url);
    });
  });

  div.addEventListener("click", () => {
    if (selectMode) {
      toggleSelect(b.id, div);
    } else {
      chrome.tabs.create({ url: b.url });
    }
  });

  return div;
}

function prettyUrl(url) {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "") + (u.pathname !== "/" ? u.pathname : "");
  } catch (_) {
    return url;
  }
}

async function copyUrl(url) {
  try {
    await navigator.clipboard.writeText(url);
    showToast(t.toastUrlCopied);
  } catch (_) {
    showToast(t.toastError, true);
  }
}

// ── Bulk selection ────────────────────────────────────────

function toggleSelect(id, itemEl) {
  if (selectedIds.has(id)) { selectedIds.delete(id); itemEl.classList.remove("is-selected"); }
  else { selectedIds.add(id); itemEl.classList.add("is-selected"); }
  updateBulkBar();
}

function updateBulkBar() {
  const bar = el("bulkBar");
  bar.classList.toggle("hidden", !selectMode);
  if (!selectMode) return;
  el("bulkCount").textContent = t.bulkCount(selectedIds.size);
  el("bulkTagBtn").disabled = selectedIds.size === 0;
  el("bulkDeleteBtn").disabled = selectedIds.size === 0;
  const visible = getFilteredSorted();
  const allSelected = visible.length > 0 && visible.every(b => selectedIds.has(b.id));
  el("bulkSelectAllBtn").textContent = allSelected ? t.deselectAll : t.selectAll;
}

function setSelectMode(on) {
  selectMode = on;
  el("selectModeBtn").classList.toggle("is-active", on);
  if (!on) selectedIds.clear();
  renderList();
}

async function bulkAddTag() {
  const tag = (prompt(t.bulkTagPrompt) || "").trim();
  if (!tag) return;
  for (const id of selectedIds) {
    const meta = metaMap[id] || { tags: [], note: "" };
    const tags = meta.tags || [];
    if (!tags.some(x => x.toLowerCase() === tag.toLowerCase())) tags.push(tag);
    await store.setMeta(id, { tags, note: meta.note || "" });
  }
  showToast(t.toastTagAdded(selectedIds.size));
  setSelectMode(false);
  await loadEverything();
}

async function bulkDelete() {
  const n = selectedIds.size;
  if (!confirm(t.bulkDeleteConfirm(n))) return;
  const ids = [...selectedIds];
  for (const id of ids) {
    try { await chrome.bookmarks.remove(id); } catch (_) {}
  }
  await store.deleteMetaMany(ids);
  showToast(t.toastBulkDeleted(n));
  setSelectMode(false);
  await loadEverything();
}

// ── Edit view ─────────────────────────────────────────────

function openEditView(id) {
  editingId = id;
  const b = bookmarks.find(x => x.id === id);
  const meta = metaMap[id] || { tags: [], note: "" };
  el("editTitle").textContent = t.editBookmark;
  el("editTitleInput").value = b.title;
  el("editUrlInput").value = b.url;
  el("editFolderSelect").value = b.parentId;
  el("noteInput").value = meta.note || "";
  el("deleteBookmarkBtn").classList.remove("hidden");
  renderTagPills(meta.tags || []);
  showView("edit");
}

function openNewBookmarkView(defaults) {
  editingId = null;
  el("editTitle").textContent = t.addBookmark;
  el("editTitleInput").value = defaults.title || "";
  el("editUrlInput").value = defaults.url || "";
  el("editFolderSelect").value = defaults.folderId || settings.defaultFolderId || el("editFolderSelect").value;
  el("noteInput").value = "";
  el("deleteBookmarkBtn").classList.add("hidden");
  renderTagPills([]);
  showView("edit");
}

let pendingTags = [];
function renderTagPills(tags) {
  pendingTags = [...tags];
  const wrap = el("tagPills");
  wrap.innerHTML = pendingTags.map((tag, i) => `
    <span class="tag-pill">${esc(tag)}<button type="button" data-i="${i}" aria-label="Remove"><svg viewBox="0 0 24 24" width="11" height="11"><path fill="currentColor" d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button></span>
  `).join("");
  wrap.querySelectorAll("button[data-i]").forEach(btn => {
    btn.addEventListener("click", () => {
      pendingTags.splice(Number(btn.dataset.i), 1);
      renderTagPills(pendingTags);
    });
  });
}

function addPendingTag(raw) {
  const tag = raw.trim();
  if (!tag) return;
  if (!pendingTags.some(x => x.toLowerCase() === tag.toLowerCase())) {
    pendingTags.push(tag);
    renderTagPills(pendingTags);
  }
}

function isValidUrl(str) {
  try {
    const u = new URL(str);
    return ["http:", "https:", "ftp:", "file:"].includes(u.protocol);
  } catch (_) { return false; }
}

async function saveEditForm() {
  const title = el("editTitleInput").value.trim() || t.addBookmark;
  const url = el("editUrlInput").value.trim();
  const folderId = el("editFolderSelect").value;
  const note = el("noteInput").value;

  if (!isValidUrl(url)) { showToast(t.toastInvalidUrl, true); return; }

  try {
    if (editingId) {
      const current = bookmarks.find(x => x.id === editingId);
      await chrome.bookmarks.update(editingId, { title, url });
      if (current && current.parentId !== folderId) {
        await chrome.bookmarks.move(editingId, { parentId: folderId });
      }
      await store.setMeta(editingId, { tags: pendingTags, note });
      showToast(t.toastUpdated);
    } else {
      const created = await chrome.bookmarks.create({ parentId: folderId || undefined, title, url });
      await store.setMeta(created.id, { tags: pendingTags, note });
      showToast(t.toastSaved);
    }
  } catch (_) {
    showToast(t.toastError, true);
    return;
  }
  showView("list");
  await loadEverything();
}

async function deleteCurrentBookmark() {
  if (!editingId) return;
  if (!confirm(t.deleteConfirm)) return;
  try {
    await chrome.bookmarks.remove(editingId);
    await store.deleteMeta(editingId);
    showToast(t.toastDeleted);
  } catch (_) {
    showToast(t.toastError, true);
  }
  showView("list");
  await loadEverything();
}

async function createFolderInline() {
  const name = el("newFolderInput").value.trim();
  if (!name) return;
  const parentId = el("editFolderSelect").value || undefined;
  try {
    const folder = await chrome.bookmarks.create({ parentId, title: name });
    const { tree } = { tree: await chrome.bookmarks.getTree() };
    folderTree = tree;
    populateFolderSelects();
    el("editFolderSelect").value = folder.id;
    el("newFolderInput").value = "";
    el("newFolderRow").classList.add("hidden");
    showToast(t.toastFolderCreated);
  } catch (_) {
    showToast(t.toastError, true);
  }
}

// ── Quick add: "Bookmark This Page" ─────────────────────────

async function bookmarkCurrentPage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url || !isValidUrl(tab.url)) { showToast(t.toastInvalidUrl, true); return; }

  const existing = bookmarks.find(b => b.url === tab.url);
  if (existing) {
    openEditView(existing.id);
    return;
  }

  try {
    const created = await chrome.bookmarks.create({
      parentId: settings.defaultFolderId || undefined,
      title: tab.title || tab.url,
      url: tab.url
    });
    showToast(t.toastQuickSaved);
    await loadEverything();
    openEditView(created.id);
  } catch (_) {
    showToast(t.toastError, true);
  }
}

// ── View switching ────────────────────────────────────────

function showView(name) {
  ["list", "edit", "settings"].forEach(v => el(`view-${v}`).classList.toggle("hidden", v !== name));
  if (name === "list") { setSelectMode(false); renderList(); }
}

function openSettingsView() {
  el("themeSelect").value = settings.theme;
  el("fontSizeSelect").value = settings.fontSize;
  el("languageSelect").value = settings.language === "system" ? "en" : settings.language;
  // Language select only ever shows a concrete language (no "system" option
  // in the markup) — but we still store "system" until the user explicitly
  // picks one from this dropdown, matching "System" being the true default.
  el("defaultViewSelect").value = settings.defaultView;
  el("defaultSortSelect").value = settings.defaultSort;
  el("optShowFavicons").checked = settings.showFavicons;
  el("optShowTags").checked = settings.showTags;
  el("optShowFolderPath").checked = settings.showFolderPath;
  populateFolderSelects();
  if (settings.defaultFolderId) el("defaultFolderSelect").value = settings.defaultFolderId;
  showView("settings");
}

// ── Export / Import / Reset ─────────────────────────────────

function dateStamp() {
  const d = new Date(), p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}

function downloadBlob(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

function buildJsonExport() {
  return {
    app: "TagMark",
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    settings,
    bookmarks: bookmarks.map((b) => ({
      url: b.url,
      title: b.title,
      path: b.path,
      tags: (metaMap[b.id] || {}).tags || [],
      note: (metaMap[b.id] || {}).note || ""
    }))
  };
}

function exportJson() {
  downloadBlob(JSON.stringify(buildJsonExport(), null, 2), `tagmark-backup-${dateStamp()}.json`, "application/json");
  showToast(t.toastExported);
}

/** Standard Netscape bookmark file, with real nested folders (unlike a
 *  flattened export, every browser that can import bookmarks — Chrome,
 *  Firefox, Edge, Safari — understands this nested <DL> structure). */
function buildNetscapeHtml() {
  let out = `<!DOCTYPE NETSCAPE-Bookmark-file-1>\n<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n<TITLE>Bookmarks</TITLE>\n<H1>Bookmarks</H1>\n<DL><p>\n`;
  function walk(node, depth) {
    const pad = "    ".repeat(depth);
    (node.children || []).forEach((child) => {
      const addDate = Math.round((child.dateAdded || 0) / 1000);
      if (child.url) {
        out += `${pad}<DT><A HREF="${esc(child.url)}" ADD_DATE="${addDate}">${esc(child.title || child.url)}</A>\n`;
      } else {
        out += `${pad}<DT><H3 ADD_DATE="${addDate}">${esc(child.title)}</H3>\n${pad}<DL><p>\n`;
        walk(child, depth + 1);
        out += `${pad}</DL><p>\n`;
      }
    });
  }
  folderTree.forEach((root) => walk(root, 1));
  out += `</DL><p>\n`;
  return out;
}

function exportHtml() {
  downloadBlob(buildNetscapeHtml(), `tagmark-bookmarks-${dateStamp()}.html`, "text/html");
  showToast(t.toastExported);
}

/** Finds (or lazily creates) the "TagMark Import" folder used to hold
 *  bookmarks from an imported file that don't already exist locally. */
async function ensureImportFolder() {
  const existing = flattenFolders(folderTree).find((f) => f.title === "TagMark Import");
  if (existing) return existing.id;
  const barId = folderTree[0]?.children?.[0]?.id;
  const folder = await chrome.bookmarks.create({ parentId: barId, title: "TagMark Import" });
  return folder.id;
}

async function importJsonFile(file) {
  try {
    const data = JSON.parse(await file.text());
    if (!data || !Array.isArray(data.bookmarks)) throw new Error("bad format");

    let created = 0, merged = 0, importFolderId = null;
    for (const item of data.bookmarks) {
      if (!item.url || !isValidUrl(item.url)) continue;
      const existing = bookmarks.find((b) => b.url === item.url);
      if (existing) {
        const meta = metaMap[existing.id] || { tags: [], note: "" };
        const unionTags = [...new Set([...(meta.tags || []), ...(item.tags || [])])];
        const note = meta.note && meta.note.trim() ? meta.note : (item.note || "");
        await store.setMeta(existing.id, { tags: unionTags, note });
        merged++;
      } else {
        if (!importFolderId) importFolderId = await ensureImportFolder();
        const createdBm = await chrome.bookmarks.create({ parentId: importFolderId, title: item.title || item.url, url: item.url });
        await store.setMeta(createdBm.id, { tags: item.tags || [], note: item.note || "" });
        created++;
      }
    }
    showToast(t.toastImported(created, merged));
    await loadEverything();
  } catch (_) {
    showToast(t.toastImportFailed, true);
  }
}

async function resetData() {
  if (!confirm(t.resetConfirm)) return;
  await store.resetSettings();
  await store.saveAllMeta({});
  settings = await store.loadSettings();
  const lang = resolveLang(settings);
  t = I18N[lang];
  i18n.setLang(lang);
  themeManager.apply(settings.theme);
  themeManager.applyFontSize(settings.fontSize);
  currentView = settings.defaultView;
  currentSort = settings.defaultSort;
  updateViewToggleUI();
  showToast(t.toastReset);
  showView("list");
  await loadEverything();
}

// ── Toast ────────────────────────────────────────────────

let _toastTimer;
function showToast(msg, isError) {
  const toast = el("toast");
  toast.textContent = msg;
  toast.classList.toggle("error", !!isError);
  toast.classList.add("show");
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function updateViewToggleUI() {
  el("viewListBtn").classList.toggle("active", currentView === "list");
  el("viewGridBtn").classList.toggle("active", currentView === "grid");
}

// ── Event wiring ─────────────────────────────────────────

function bindEvents() {
  el("addPageBtn").addEventListener("click", bookmarkCurrentPage);

  let searchDebounce;
  el("searchInput").addEventListener("input", (e) => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => { searchQuery = e.target.value; renderList(); }, 120);
  });

  el("folderFilterSelect").addEventListener("change", (e) => { currentFolderId = e.target.value; renderList(); });
  el("sortSelect").addEventListener("change", (e) => { currentSort = e.target.value; renderList(); });

  el("viewListBtn").addEventListener("click", () => setView("list"));
  el("viewGridBtn").addEventListener("click", () => setView("grid"));
  function setView(v) {
    currentView = v;
    settings.defaultView = v;
    store.patchSettings({ defaultView: v });
    updateViewToggleUI();
    renderList();
  }

  el("selectModeBtn").addEventListener("click", () => setSelectMode(!selectMode));
  el("bulkSelectAllBtn").addEventListener("click", () => {
    const visible = getFilteredSorted();
    const allSelected = visible.length > 0 && visible.every(b => selectedIds.has(b.id));
    visible.forEach(b => allSelected ? selectedIds.delete(b.id) : selectedIds.add(b.id));
    renderList();
  });
  el("bulkTagBtn").addEventListener("click", bulkAddTag);
  el("bulkDeleteBtn").addEventListener("click", bulkDelete);

  el("langToggleBtn").addEventListener("click", async () => {
    const next = i18n.current === "en" ? "vi" : "en";
    settings.language = next;
    await store.patchSettings({ language: next });
    i18n.setLang(next);
    t = I18N[next];
    renderTagRow();
    renderList();
  });

  el("themeToggleBtn").addEventListener("click", async () => {
    const resolved = document.documentElement.getAttribute("data-theme");
    const next = resolved === "dark" ? "light" : "dark";
    settings.theme = next;
    await store.patchSettings({ theme: next });
    themeManager.apply(next);
  });

  el("settingsBtn").addEventListener("click", openSettingsView);
  el("backBtn").addEventListener("click", () => showView("list"));
  el("editBackBtn").addEventListener("click", () => showView("list"));
  el("cancelEditBtn").addEventListener("click", () => showView("list"));
  el("saveBookmarkBtn").addEventListener("click", saveEditForm);
  el("deleteBookmarkBtn").addEventListener("click", deleteCurrentBookmark);

  el("newFolderToggleBtn").addEventListener("click", () => el("newFolderRow").classList.toggle("hidden"));
  el("createFolderBtn").addEventListener("click", createFolderInline);

  el("tagInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addPendingTag(e.target.value);
      e.target.value = "";
    }
  });

  // Settings view controls
  el("themeSelect").addEventListener("change", async (e) => {
    settings.theme = e.target.value;
    await store.patchSettings({ theme: settings.theme });
    themeManager.apply(settings.theme);
  });
  el("fontSizeSelect").addEventListener("change", async (e) => {
    settings.fontSize = e.target.value;
    await store.patchSettings({ fontSize: settings.fontSize });
    themeManager.applyFontSize(settings.fontSize);
  });
  el("languageSelect").addEventListener("change", async (e) => {
    settings.language = e.target.value;
    await store.patchSettings({ language: settings.language });
    i18n.setLang(settings.language);
    t = I18N[settings.language];
    renderTagRow();
  });
  el("defaultViewSelect").addEventListener("change", async (e) => {
    settings.defaultView = e.target.value;
    await store.patchSettings({ defaultView: settings.defaultView });
  });
  el("defaultSortSelect").addEventListener("change", async (e) => {
    settings.defaultSort = e.target.value;
    await store.patchSettings({ defaultSort: settings.defaultSort });
  });
  el("optShowFavicons").addEventListener("change", async (e) => {
    settings.showFavicons = e.target.checked;
    await store.patchSettings({ showFavicons: settings.showFavicons });
  });
  el("optShowTags").addEventListener("change", async (e) => {
    settings.showTags = e.target.checked;
    await store.patchSettings({ showTags: settings.showTags });
  });
  el("optShowFolderPath").addEventListener("change", async (e) => {
    settings.showFolderPath = e.target.checked;
    await store.patchSettings({ showFolderPath: settings.showFolderPath });
  });
  el("defaultFolderSelect").addEventListener("change", async (e) => {
    settings.defaultFolderId = e.target.value;
    await store.patchSettings({ defaultFolderId: settings.defaultFolderId });
  });

  el("exportJsonBtn").addEventListener("click", exportJson);
  el("exportHtmlBtn").addEventListener("click", exportHtml);
  el("importJsonBtn").addEventListener("click", () => el("importJsonFile").click());
  el("importJsonFile").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) importJsonFile(file);
    e.target.value = "";
  });
  el("resetBtn").addEventListener("click", resetData);
  el("manageShortcutsBtn").addEventListener("click", () => chrome.tabs.create({ url: "chrome://extensions/shortcuts" }));
}

init();
