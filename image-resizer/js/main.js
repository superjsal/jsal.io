// Entry point: wires the controls to state, loading, preview and export.

import {
  state, FORMATS, QUALITY_HINTS, CAN_WEBP, savePrefs, loadPrefs,
  loadRecents, addRecent, removeRecent,
} from "./state.js?v=2026-10-31a";
import { DEFAULT_ANCHOR, isImageFile, isHeicFile, loadImage } from "./imaging.js?v=2026-10-31a";
import { ensureBlob, freeItem, schedulePrewarm, cancelPrewarm } from "./export.js?v=2026-10-31a";
import { initEditor, drawEditor, clearEditor, setBadge } from "./editor.js?v=2026-10-31a";
import { initGrid, renderGrid, drawThumb, markSelected, updateCardMeta, setSaveState, getFilename } from "./grid.js?v=2026-10-31a";
import { plural, clamp, setStatus, setPressed, triggerDownload } from "./ui.js?v=2026-10-31a";
import { makeZip, uniqueNames } from "./zip.js?v=2026-10-31a";
import { folderSupported, savedFolder, pickFolder, ensureWritable, writeToFolder } from "./folder.js?v=2026-10-31a";

const $ = id => document.getElementById(id);

const fileInput     = $("file");
const dropZone      = $("drop");
const canvasWrap    = document.querySelector(".canvas-wrap");
const app           = document.querySelector(".app");
const downloadBtn   = $("download");
const downloadLabel = $("downloadLabel");
const widthInput    = $("cw");
const heightInput   = $("ch");
const loadChoice    = $("loadChoice");
const recentSizes   = $("recentSizes");

const sizeButtons    = [...document.querySelectorAll(".seg-btn")];
const qualityButtons = [...document.querySelectorAll(".quality-btn")];
const formatButtons  = [...document.querySelectorAll(".format-btn")];
const destButtons    = [...document.querySelectorAll(".dest-btn")];
const folderRow      = $("folderRow");
const folderName     = $("folderName");

const DOWNLOAD_GAP_MS = 300;   // browsers drop rapid-fire downloads; space them out

let pendingFiles   = null;
let loadGeneration = 0;
let loadQueue      = [];   // files waiting to be decoded by the running load
let loadingGen     = 0;    // generation of the running load, 0 when none is running

const prewarm = (delay) => schedulePrewarm(updateCardMeta, delay);

// --- Preview ---

function sizeSummary() {
  return state.keepOriginal
    ? `Original sizes  ·  ${plural(state.images.length)}  ·  converting to ${state.format.ext.toUpperCase()}`
    : `${state.size.w} × ${state.size.h}  ·  ${plural(state.images.length)}`;
}
// The summary in the status bar. Images smaller than the output size (enlarged, so they may look blurry) are
// flagged on their own cards and under the preview; a third warning here only competed with those.
function showSummary() {
  setStatus(sizeSummary(), "active");
}

// Full refresh after images or output size change.
function refreshAll() {
  if (!state.images.length) return;
  state.selectedIndex = clamp(state.selectedIndex, 0, state.images.length - 1);
  drawEditor();
  renderGrid();
  prewarm(150);
  downloadBtn.disabled = false;
  app.classList.add("has-images");
  showSummary();
}

// Stops a running load; it frees what it had decoded so far.
function cancelLoad() {
  loadGeneration++;
  loadQueue = [];
}

function resetUI() {
  cancelLoad();
  cancelPrewarm();
  state.images.forEach(freeItem);
  state.images = [];
  renderGrid();
  loadChoice.hidden = true;
  clearEditor();
  downloadBtn.disabled = true;
  app.classList.remove("has-images");
}

// --- Loading files ---

function handleFiles(fileList) {
  const files = [...fileList].filter(isImageFile);
  if (!files.length) { setStatus("No valid images found.", "error"); return; }

  if (state.images.length) {
    pendingFiles = files;
    $("loadChoiceMsg").textContent = `You already have ${plural(state.images.length)} loaded. Replace or add?`;
    loadChoice.hidden = false;
    $("choiceAdd").focus();
    return;
  }
  loadFiles(files);
}

function makeItem(file, loaded) {
  return { ...loaded, name: file.name, customName: "", cropAnchor: { ...DEFAULT_ANCHOR }, cache: null };
}

// Decodes one file at a time so memory stays bounded with large batches. Files dropped while a load
// is running join it, rather than starting a second load that would replace the first.
async function loadFiles(files) {
  loadQueue.push(...files);
  if (loadingGen && loadingGen === loadGeneration) return;
  const gen = loadingGen = ++loadGeneration;
  const loaded = [];
  const skipped = [];
  let n = 0;

  try {
    while (loadQueue.length) {
      const file = loadQueue.shift();
      const heicNote = isHeicFile(file) ? " (converting HEIC)" : "";
      setStatus(`Loading ${++n} of ${n + loadQueue.length}${heicNote}…`, "busy");
      try {
        const result = await loadImage(file);
        if (gen !== loadGeneration) { result.preview.close(); return; }
        loaded.push(makeItem(file, result));
      } catch (err) {
        if (gen !== loadGeneration) return;
        console.warn("Skipped unreadable file:", file.name, err);
        // Say why where it's likely: a HEIC the converter couldn't read, or a file too big for this browser's memory
        skipped.push(isHeicFile(file) ? `${file.name} (HEIC couldn't be converted)` : file.size > 40e6 ? `${file.name} (too large to open here)` : file.name);
      }
    }
  } finally {
    if (loadingGen === gen) loadingGen = 0;
    if (gen !== loadGeneration) loaded.forEach(freeItem);   // cancelled: nothing it decoded is kept
  }

  state.images.push(...loaded);
  if (!state.images.length) {
    resetUI();
    setStatus(`Couldn't read ${skipped.length === 1 ? skipped[0] : plural(skipped.length, "file")} — unsupported or damaged.`, "error");
    return;
  }
  refreshAll();
  window.jsalUsed?.();   // "First steps" / "Explorer" (/nav.js): images loaded
  if (skipped.length) {
    setStatus(`${sizeSummary()}  ·  skipped ${plural(skipped.length, "file")} it couldn't read: ${skipped.join(", ")}`, "error");
  }
}

function acceptPending(add) {
  if (!pendingFiles) return;
  const files = pendingFiles;
  pendingFiles = null;
  loadChoice.hidden = true;
  if (!add) {
    cancelLoad();
    cancelPrewarm();
    state.images.forEach(freeItem);
    state.images = [];
    state.selectedIndex = 0;
  }
  loadFiles(files);
}

// --- Card actions ---

function selectImage(i) {
  state.selectedIndex = i;
  markSelected();
  drawEditor();
}

function removeImage(i) {
  freeItem(state.images[i]);
  state.images.splice(i, 1);
  if (!state.images.length) {
    resetUI();
    setStatus("All images removed. Load more to continue.");
    return;
  }
  if (state.selectedIndex > i) state.selectedIndex--;
  refreshAll();
}

// --- Where exports go: Downloads, one ZIP, or a chosen folder ---

const DEST_LABELS = { files: "Download All", zip: "Download ZIP", folder: "Save All to Folder" };

let folder = null;   // FileSystemDirectoryHandle, remembered across visits

function renderDest() {
  setPressed(destButtons, destButtons.find(b => b.dataset.dest === state.dest));
  folderRow.hidden = state.dest !== "folder";
  folderName.textContent = folder ? folder.name : "No folder chosen";
  folderName.classList.toggle("empty", !folder);
  $("folderChange").textContent = folder ? "Change…" : "Choose…";
  if (!state.isExporting) downloadLabel.textContent = DEST_LABELS[state.dest];
}

async function chooseFolder() {
  try {
    folder = await pickFolder();
    renderDest();
    setStatus(`Exports will be saved to "${folder.name}".`, "active");
    return true;
  } catch (err) {
    if (err.name !== "AbortError") setStatus(`Couldn't use that folder: ${err.message}`, "error");
    return false;
  }
}

// Returns a writable folder, asking for one or for permission if needed.
// Call before any slow work so the browser still treats it as a click.
async function readyFolder() {
  if (!folder && !(await chooseFolder())) return null;
  if (await ensureWritable(folder).catch(() => false)) return folder;
  setStatus("No permission to save in that folder. Click Change… to pick it again.", "error");
  return null;
}

function zipName() {
  const d = new Date();
  const pad = n => String(n).padStart(2, "0");
  return `images-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.zip`;
}

const saveTimers = new WeakMap();

// Single image from its card. ZIP mode saves the plain file — a one-image ZIP is no help.
async function saveImage(i) {
  const item = state.images[i];
  if (!item || item.saving) return;
  item.saving = true;
  setSaveState(i, "busy");
  try {
    const dir = state.dest === "folder" ? await readyFolder() : null;
    if (state.dest === "folder" && !dir) { setSaveState(state.images.indexOf(item), "idle"); return; }
    const entry = await ensureBlob(item);
    if (!entry) return;
    const name = getFilename(item);
    if (dir) {
      const saved = await writeToFolder(dir, name, entry.blob);
      setStatus(`Saved ${saved} to "${dir.name}"${saved !== name ? ` (${name} was already there)` : ""}`, "active");
    } else {
      triggerDownload(entry.url, name);
    }
    setSaveState(state.images.indexOf(item), "saved");
    window.jsalAchieve?.("pixel");   // achievement (/nav.js)
    clearTimeout(saveTimers.get(item));
    saveTimers.set(item, setTimeout(() => setSaveState(state.images.indexOf(item), "idle"), 3000));
  } catch (err) {
    setSaveState(state.images.indexOf(item), "idle");
    setStatus(`Couldn't save ${getFilename(item)}: ${err.message}`, "error");
  } finally {
    item.saving = false;
    updateCardMeta();
  }
}

async function downloadAll() {
  if (!state.images.length || state.isExporting) return;
  state.isExporting = true;
  downloadBtn.disabled = true;
  const dest = state.dest;

  const finish = (msg, kind) => {
    state.isExporting = false;
    downloadBtn.disabled = !state.images.length;
    downloadLabel.textContent = DEST_LABELS[state.dest];
    if (msg) setStatus(msg, kind);
  };

  const dir = dest === "folder" ? await readyFolder() : null;
  if (dest === "folder" && !dir) { finish(); return; }

  const files = [];
  const failed = [];
  let renamed = 0;   // folder saves that got a number because the name was taken
  for (const [n, item] of [...state.images].entries()) {
    downloadLabel.textContent = `Preparing ${n + 1}/${state.images.length}…`;
    try {
      const entry = await ensureBlob(item);
      if (entry) files.push({ name: getFilename(item), blob: entry.blob, url: entry.url });
    } catch {
      failed.push(getFilename(item));
    }
  }
  updateCardMeta();
  uniqueNames(files.map(f => f.name)).forEach((name, i) => { files[i].name = name; });

  try {
    if (dest === "zip") {
      downloadLabel.textContent = "Zipping…";
      const url = URL.createObjectURL(await makeZip(files));
      triggerDownload(url, zipName());
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } else if (dest === "folder") {
      for (const [n, f] of files.entries()) {
        downloadLabel.textContent = `Saving ${n + 1}/${files.length}…`;
        if (await writeToFolder(dir, f.name, f.blob) !== f.name) renamed++;
      }
    } else {
      downloadLabel.textContent = "Downloading…";
      for (const f of files) {
        triggerDownload(f.url, f.name);
        await new Promise(r => setTimeout(r, DOWNLOAD_GAP_MS));
      }
    }
  } catch (err) {
    finish(`Export stopped: ${err.message}`, "error");
    return;
  }

  if (files.length) window.jsalAchieve?.("pixel");   // achievement (/nav.js)
  const where = dest === "zip" ? " as a ZIP"
    : dest === "folder" ? ` to "${dir.name}"${renamed ? ` (${plural(renamed, "name")} already there got a number added)` : ""}`
    : "";
  if (failed.length) {
    finish(`Exported ${plural(files.length)}${where} · ${failed.length} failed (too large for this browser): ${failed.join(", ")}`, "error");
  } else {
    finish(`Done · ${plural(files.length)} exported${where}`, "active");
  }
}

// --- Output settings ---

// The empty width and height boxes hint at the size in use, so they never suggest a different one
// In Original mode each image keeps its own size, so the boxes say "Auto"
function hintSize() {
  widthInput.placeholder = state.keepOriginal ? "Auto" : state.size.w;
  heightInput.placeholder = state.keepOriginal ? "Auto" : state.size.h;
}

function applySize(w, h) {
  state.keepOriginal = false;
  state.size = { w, h };
  hintSize();
  savePrefs();
  setBadge(`${w} × ${h}`);
  if (state.images.length) refreshAll();
  else { setStatus(`Size set to ${w} × ${h}. Now load your images.`); }
}

function applyOriginalMode() {
  state.keepOriginal = true;
  hintSize();
  savePrefs();
  setBadge("Original sizes");
  if (state.images.length) refreshAll();
  else { setStatus("Original mode — images keep their sizes. Now load your images."); }
}

// Settings that change the encoded file but not the crop.
function encodingChanged() {
  savePrefs();
  updateCardMeta();
  prewarm();
  if (state.images.length && !state.isExporting) showSummary();
}

function setInputError(el, on) {
  el.closest(".input-group").classList.toggle("error", on);
  el.setAttribute("aria-invalid", String(on));
}

function clearInputErrors() {
  setInputError(widthInput, false);
  setInputError(heightInput, false);
}

function applyCustomSize() {
  const w = parseInt(widthInput.value);
  const h = parseInt(heightInput.value);
  setInputError(widthInput, !w);
  setInputError(heightInput, !h);
  if (!w || !h) { setStatus("Enter a value in the highlighted field.", "error"); return; }

  const cw = clamp(w, 32, 20000);
  const ch = clamp(h, 32, 20000);
  widthInput.value = cw;
  heightInput.value = ch;
  setPressed(sizeButtons, null);
  addRecent(cw, ch);
  renderRecents();
  applySize(cw, ch);
}

function renderRecents() {
  const recents = loadRecents();
  recentSizes.hidden = !recents.length;
  recentSizes.replaceChildren(...recents.map(({ w, h }) => {
    const pill = document.createElement("span");
    pill.className = "recent-pill";

    const apply = document.createElement("button");
    apply.className = "recent-pill-apply";
    apply.textContent = `${w} × ${h}`;
    apply.title = `Apply ${w} × ${h}`;
    apply.addEventListener("click", () => {
      widthInput.value = w;
      heightInput.value = h;
      clearInputErrors();
      setPressed(sizeButtons, null);
      applySize(w, h);
    });

    const del = document.createElement("button");
    del.className = "recent-pill-del";
    del.textContent = "×";
    del.title = "Remove from recent sizes";
    del.setAttribute("aria-label", `Remove ${w} × ${h} from recent sizes`);
    del.addEventListener("click", () => { removeRecent(w, h); renderRecents(); });

    pill.append(apply, del);
    return pill;
  }));
}

// Light/dark is shared by all the jsal.io apps (/nav.js): redraw the crop box in the new colors
addEventListener("jsal-theme", drawEditor);

// --- Event wiring ---

sizeButtons.forEach(btn => btn.addEventListener("click", () => {
  setPressed(sizeButtons, btn);
  clearInputErrors();
  if (btn.dataset.size) {
    const [w, h] = btn.dataset.size.split("x").map(Number);
    applySize(w, h);
  } else {
    applyOriginalMode();
  }
}));

$("customResize").addEventListener("click", applyCustomSize);
[widthInput, heightInput].forEach(el => {
  el.addEventListener("keydown", e => { if (e.key === "Enter") applyCustomSize(); });
  el.addEventListener("input", () => setInputError(el, false));
});

qualityButtons.forEach(btn => btn.addEventListener("click", () => {
  setPressed(qualityButtons, btn);
  state.quality = parseFloat(btn.dataset.quality);
  $("qualityHint").textContent = QUALITY_HINTS[btn.dataset.quality];
  encodingChanged();
}));

formatButtons.forEach(btn => btn.addEventListener("click", () => {
  setPressed(formatButtons, btn);
  state.format = FORMATS[btn.dataset.format];
  $("formatHint").textContent = state.format.hint;
  syncQuality();
  encodingChanged();
}));

// PNG is lossless, so the Quality buttons do nothing for it: greyed out while it's chosen
function syncQuality() {
  const png = state.format === FORMATS.png;
  qualityButtons.forEach(b => { b.disabled = png; });
  $("qualityHint").textContent = png ? "PNG is lossless, so quality doesn't apply" : QUALITY_HINTS[String(state.quality)];
}

destButtons.forEach(btn => btn.addEventListener("click", async () => {
  const dest = btn.dataset.dest;
  if (dest === "folder" && !folderSupported) {
    setStatus("This browser can't save to a folder. Use Chrome or Edge — in Brave, turn on brave://flags/#file-system-access-api.", "error");
    return;
  }
  state.dest = dest;
  savePrefs();
  renderDest();
  if (dest === "folder" && !folder) await chooseFolder();
}));
$("folderChange").addEventListener("click", chooseFolder);

$("choiceReplace").addEventListener("click", () => acceptPending(false));
$("choiceAdd").addEventListener("click", () => acceptPending(true));
$("choiceCancel").addEventListener("click", () => {
  pendingFiles = null;
  loadChoice.hidden = true;
});

$("clear").addEventListener("click", () => {
  resetUI();
  setStatus("Cleared. Load new images when ready.");
});

downloadBtn.addEventListener("click", downloadAll);
dropZone.addEventListener("click", () => fileInput.click());
$("canvasEmpty").addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => {
  if (fileInput.files.length) handleFiles(fileInput.files);
  fileInput.value = "";
});

// Drop anywhere on the page; the drop zone highlights while files are dragged over.
let dragDepth = 0;
const dragHasFiles = e => e.dataTransfer?.types.includes("Files");

document.addEventListener("dragenter", e => {
  if (!dragHasFiles(e)) return;
  e.preventDefault();
  dragDepth++;
  dropZone.classList.add("drag");
  canvasWrap.classList.add("drag");
});
document.addEventListener("dragover", e => {
  if (dragHasFiles(e)) e.preventDefault();
});
document.addEventListener("dragleave", e => {
  if (--dragDepth <= 0 || !e.relatedTarget) {
    dragDepth = 0;
    dropZone.classList.remove("drag");
    canvasWrap.classList.remove("drag");
  }
});
document.addEventListener("drop", e => {
  if (!dragHasFiles(e)) return;
  e.preventDefault();
  dragDepth = 0;
  dropZone.classList.remove("drag");
    canvasWrap.classList.remove("drag");
  if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
});

const isMac = /mac/i.test(navigator.userAgentData?.platform ?? navigator.platform ?? "");
$("kbdHint").textContent = isMac ? "⌘⇧D" : "Ctrl+Shift+D";
$("kbdHint").hidden = matchMedia("(pointer: coarse)").matches;   // no keyboard shortcut on phones and tablets
if (isMac) for (const k of document.querySelectorAll(".mod-key")) k.textContent = "⌘";   // the About section's shortcut
document.addEventListener("keydown", e => {
  if ((isMac ? e.metaKey : e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "d") {
    e.preventDefault();
    downloadAll();
  }
});

initEditor({
  onLive: drawThumb,
  onCommit: () => { updateCardMeta(); prewarm(600); },
});
initGrid({ onSelect: selectImage, onRemove: removeImage, onSave: saveImage });

// --- Init: restore saved settings ---

loadPrefs();

const q = qualityButtons.find(b => parseFloat(b.dataset.quality) === state.quality);
setPressed(qualityButtons, q);
$("qualityHint").textContent = QUALITY_HINTS[q.dataset.quality];

setPressed(formatButtons, formatButtons.find(b => FORMATS[b.dataset.format] === state.format));
$("formatHint").textContent = state.format.hint;
syncQuality();

if (!CAN_WEBP) {
  const webp = formatButtons.find(b => b.dataset.format === "webp");
  webp.disabled = true;
  webp.title = "This browser can't save WebP. Use Chrome, Edge or Firefox for WebP.";
  FORMATS.jpeg.hint = "WebP isn't available in this browser (Safari), so images save as JPG";
  $("formatHint").textContent = state.format.hint;
  // JPG is the default (not every CMS takes WebP), so this only needs saying to someone who had chosen WebP before
  let hadWebp = false;
  try { hadWebp = (localStorage.getItem("resizer-format") || "").includes("webp"); } catch {}
  if (hadWebp) setStatus("This browser can't save WebP, so your images will save as JPG.", "idle");
}

if (state.keepOriginal) {
  setPressed(sizeButtons, $("originalBtn"));
  setBadge("Original sizes");
} else {
  const preset = sizeButtons.find(b => b.dataset.size === `${state.size.w}x${state.size.h}`);
  setPressed(sizeButtons, preset ?? null);
  if (!preset) {
    widthInput.value = state.size.w;
    heightInput.value = state.size.h;
  }
  setBadge(`${state.size.w} × ${state.size.h}`);
}
hintSize();

if (state.dest === "folder" && !folderSupported) state.dest = "files";
// Only offer saving to a folder where the browser can (Chrome and Edge; Brave behind a flag)
if (!folderSupported) destButtons.find(b => b.dataset.dest === "folder").hidden = true;
renderDest();
savedFolder().then(f => { folder = f; renderDest(); });

renderRecents();
