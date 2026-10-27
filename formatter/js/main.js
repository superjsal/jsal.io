import { clean, detectSource, looksLikeHtml, words } from "./clean.js";
import { SAMPLE_HTML } from "./sample.js";

const $ = (id) => document.getElementById(id);
const app = document.querySelector(".app");
const editor = $("editor");
const htmlEdit = $("htmlEdit");

const ICONS = {
  moon:      '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
  sun:       '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  droplet:   '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
  copy:      '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  code:      '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
  text:      '<path d="M17 6.1H3M21 12.1H3M15.1 18H3"/>',
  trash:     '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  clipboard: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
  check:     '<path d="M20 6 9 17l-5-5"/>',
  warn:      '<path d="M12 8v5M12 16.5v.01"/>',
  info:      '<path d="M12 11v5M12 7.5v.01"/>',
  ul:        '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
  ol:        '<path d="M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>',
  link:      '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  unlink:    '<path d="m18.84 12.25 1.72-1.71a5 5 0 0 0-7.07-7.07l-1.72 1.71M5.17 11.75l-1.71 1.71a5 5 0 0 0 7.07 7.07l1.71-1.71M8 2v3M2 8h3M16 22v-3M22 16h-3"/>',
  eraser:    '<path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21M22 21H7M5 11l9 9"/>',
  undo:      '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>',
  redo:      '<path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/>',
  wand:      '<path d="m15 4-1.5 1.5M20 9l-1.5 1.5M18 4l1 1M3 21l11-11M14 4l6 6"/><path d="M17.5 2.5v2M21.5 6.5h-2"/>',
};
const icon = (name, size = 14, stroke = 2.2) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
for (const el of document.querySelectorAll("[data-icon]")) el.innerHTML = icon(el.dataset.icon, +el.dataset.size || 14);
if (/Mac|iPhone|iPad/.test(navigator.platform)) for (const k of document.querySelectorAll(".mod-key")) k.textContent = "⌘";

const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, v); } catch {} };

// Pasted content is never saved anywhere
let input = null;     // { html, text } as pasted
let result = null;    // latest clean() of the editor content
let fixes = [];       // what cleaning fixed on the first pass (shown until the next paste)
let source = "";      // "Word", "Google Docs"… for the pane title

// ── Theme: dark → light → teal, same as the resizer ──────────────────────

const THEMES = ["dark", "light", "teal"];
const THEME_INFO = {
  dark:  { icon: "moon",    label: "Dark",  next: "Light", fav: ["#e09840", "#c07828", "#1a1208"] },
  light: { icon: "sun",     label: "Light", next: "Teal",  fav: ["#9a5e0e", "#7f4c0c", "#ffffff"] },
  teal:  { icon: "droplet", label: "Teal",  next: "Dark",  fav: ["#97d3d2", "#74c1c0", "#16181d"] },
};
function faviconFor([a1, a2, ink]) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a1}"/><stop offset="1" stop-color="${a2}"/></linearGradient></defs><rect width="32" height="32" rx="8" fill="url(#g)"/><path d="M18 7v12a5 5 0 0 1-10 0" fill="none" stroke="${ink}" stroke-width="4" stroke-linecap="round"/><circle cx="24" cy="23.5" r="2.5" fill="${ink}"/></svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
}
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const info = THEME_INFO[theme];
  const btn = $("themeToggle");
  btn.innerHTML = icon(info.icon, 14, 2);
  btn.title = `${info.label} theme — click for ${info.next}`;
  btn.setAttribute("aria-label", `Theme: ${info.label}. Switch to ${info.next}`);
  document.querySelector('link[rel="icon"]').href = faviconFor(info.fav);
}
$("themeToggle").addEventListener("click", () => {
  const next = THEMES[(THEMES.indexOf(document.documentElement.dataset.theme) + 1) % THEMES.length];
  applyTheme(next);
  write("formatter-theme", next);
});
applyTheme(THEMES.includes(document.documentElement.dataset.theme) ? document.documentElement.dataset.theme : "dark");

// ── Paste ────────────────────────────────────────────────────────────────

// Pasting into the editor inserts cleaned content at the cursor; pasting into the HTML
// box is normal text; pasting anywhere else replaces everything with the new content.
document.addEventListener("paste", (e) => {
  const cd = e.clipboardData;
  if (!cd || e.target === htmlEdit) return;
  e.preventDefault();
  const data = { html: cd.getData("text/html"), text: cd.getData("text/plain") };
  if (editor.contains(e.target) && input) insertCleaned(data);
  else load(data);
});

function insertCleaned(data) {
  const r = clean(data);
  if (!r.html) return;
  // A single paragraph goes in as inline text, so it doesn't split the line you're on
  const one = r.root.children.length === 1 && r.root.firstElementChild.localName === "p";
  document.execCommand("insertHTML", false, one ? r.root.firstElementChild.innerHTML : r.html);
}

$("pasteZone").addEventListener("click", (e) => { if (e.target === $("pasteZone")) $("pasteZone").focus(); });
$("sampleBtn").addEventListener("click", () => load({ html: SAMPLE_HTML, text: "" }));
$("blankBtn").addEventListener("click", () => { load({ html: "", text: "" }, true); editor.focus(); });

function load(data, blank = false) {
  if (!blank && !(data.html || "").trim() && !(data.text || "").trim()) return;
  input = data;
  app.classList.add("has-content");
  source = blank ? "" : detectSource(input.html, input.text);
  result = clean(input);
  fixes = result.checks.filter((c) => c.fix);
  editor.innerHTML = result.html;
  htmlEdit.value = result.html;
  showResult();
}

$("clearBtn").addEventListener("click", () => {
  input = result = null;
  fixes = [];
  editor.innerHTML = "";
  app.classList.remove("has-content");
  $("pasteZone").focus();
});

const kb = (n) => (n < 1024 ? `${n} B` : `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} KB`);
const bytes = (s) => new Blob([s]).size;
const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const sourceHtml = () => ((input.html || "").trim() ? input.html : looksLikeHtml(input.text) ? input.text : "");

// ── Clean output: editor, HTML, text, checks ─────────────────────────────

// Visual hints in the editor only (cleaning strips these attributes again)
function decorate() {
  for (const p of editor.querySelectorAll("p")) {
    if (/^\[Image(:|\])/.test(p.textContent.trim())) p.dataset.image = "1";
    else delete p.dataset.image;
  }
  for (const a of editor.querySelectorAll("a")) {
    const href = a.getAttribute("href") || "";
    a.title = href;
    a.classList.toggle("flag", /^(file:|#_)|docs\.google\.com|drive\.google\.com|sharepoint\.com|1drv\.ms|onedrive\.live\.com/i.test(href));
  }
}

function showResult() {
  decorate();
  if (document.activeElement !== htmlEdit) htmlEdit.value = result.html;
  $("outMeta").textContent = [source && `from ${source}`, result.html && kb(bytes(result.html))].filter(Boolean).map((t) => `· ${t}`).join(" ");

  const n = words(result.text);
  const src = input && sourceHtml();
  const before = src ? bytes(src) : 0, after = bytes(result.html);
  const saved = before > after ? Math.round((1 - after / before) * 100) : 0;
  $("stats").innerHTML =
    `<span class="stat"><b>${n.toLocaleString()}</b> words</span>` +
    `<span class="stat"><b>${Math.max(n ? 1 : 0, Math.round(n / 230))}</b> min read</span>` +
    (saved > 0 ? `<span class="stat good" title="${kb(before)} of code → ${kb(after)}"><b>${saved}%</b> less code</span>` : "");

  const checks = [...result.checks.filter((c) => !c.fix), ...fixes];
  if (n && !checks.some((c) => c.level === "warn")) checks.push({ level: "ok", text: "No problems found." });
  $("checks").innerHTML = checks.map((c) =>
    `<li class="check ${c.level}"><span class="ico">${icon(c.level === "ok" ? "check" : c.level, 12, 2.6)}</span><span>${escapeHtml(c.text)}</span></li>`).join("");
}

// Edits are re-cleaned shortly after typing stops, so the HTML stays tidy
let timer = null, pending = null;
function schedule(fn) { pending = fn; clearTimeout(timer); timer = setTimeout(flush, 250); }
function flush() { clearTimeout(timer); if (pending) { const fn = pending; pending = null; fn(); } }

editor.addEventListener("input", () => schedule(() => { result = clean({ html: editor.innerHTML }); showResult(); }));
htmlEdit.addEventListener("input", () => schedule(() => {
  result = clean({ html: htmlEdit.value });
  editor.innerHTML = result.html;
  showResult();
}));

// Like Prettier: rewrite the HTML box with clean indentation. The cleaner already prints
// tidy HTML, so formatting is just "show the cleaned version", keeping the cursor near
// the same spot in the text.
function formatHtml() {
  flush();
  if (!result || htmlEdit.value === result.html) return;
  const ratio = htmlEdit.value.length ? htmlEdit.selectionStart / htmlEdit.value.length : 0;
  const scroll = htmlEdit.scrollTop;
  htmlEdit.value = result.html;
  const pos = Math.round(ratio * result.html.length);
  htmlEdit.setSelectionRange(pos, pos);
  htmlEdit.scrollTop = scroll;
}
htmlEdit.addEventListener("blur", formatHtml);
document.querySelector("[data-format]").addEventListener("mousedown", (e) => e.preventDefault());
document.querySelector("[data-format]").addEventListener("click", () => { formatHtml(); htmlEdit.focus(); });
htmlEdit.addEventListener("keydown", (e) => {
  if (e.shiftKey && e.altKey && e.key.toLowerCase() === "f") { e.preventDefault(); formatHtml(); return; }
  // Tab indents (two spaces) instead of leaving the box; Shift+Tab un-indents
  if (e.key === "Tab" && !e.ctrlKey && !e.altKey && !e.metaKey) {
    e.preventDefault();
    const { selectionStart: s, selectionEnd: end, value } = htmlEdit;
    if (e.shiftKey) {
      const lineStart = value.lastIndexOf("\n", s - 1) + 1;
      const n = value.slice(lineStart, lineStart + 2) === "  " ? 2 : value[lineStart] === " " ? 1 : 0;
      if (n) { htmlEdit.setRangeText("", lineStart, lineStart + n, "preserve"); htmlEdit.setSelectionRange(s - n, end - n); }
    } else {
      htmlEdit.setRangeText("  ", s, end, "end");
    }
    htmlEdit.dispatchEvent(new Event("input"));
  }
});

// ── Tabs ─────────────────────────────────────────────────────────────────

const VIEWS = { out: { page: "editor", code: "htmlEdit" } };
for (const tab of document.querySelectorAll("[data-tab]")) {
  tab.addEventListener("click", () => {
    flush();
    const group = tab.dataset.tab;
    for (const t of document.querySelectorAll(`[data-tab="${group}"]`)) t.setAttribute("aria-selected", t === tab);
    for (const [view, id] of Object.entries(VIEWS[group])) $(id).hidden = view !== tab.dataset.view;
    if (group === "out") {
      $("toolbar").hidden = tab.dataset.view !== "page";
      $("htmlBar").hidden = tab.dataset.view !== "code";
      if (tab.dataset.view === "code" && result) htmlEdit.value = result.html;
    }
  });
}

// ── Toolbar ──────────────────────────────────────────────────────────────

document.execCommand("defaultParagraphSeparator", false, "p");

// Bold on a select-all works like Word: headings don't count, so the first press bolds
// all the text and the second removes it all. Smaller selections use the browser's bold.
const HEADING = "h1, h2, h3, h4, h5, h6";
function selectsEverything() {
  const sel = getSelection();
  if (!sel.rangeCount || sel.isCollapsed) return false;
  const r = sel.getRangeAt(0);
  const all = document.createRange();
  all.selectNodeContents(editor);
  return r.compareBoundaryPoints(Range.START_TO_START, all) <= 0 && r.compareBoundaryPoints(Range.END_TO_END, all) >= 0 ||
    sel.toString().replace(/\s+/g, "") === editor.textContent.replace(/\s+/g, "");
}
function bodyTextAllBold() {
  const w = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
  for (let t = w.nextNode(); t; t = w.nextNode()) {
    if (!t.data.trim() || t.parentElement.closest(HEADING + ", [data-image]")) continue;
    if (!t.parentElement.closest("strong, b")) return false;
  }
  return true;
}
function selectAll() {
  const r = document.createRange();
  r.selectNodeContents(editor);
  const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
}
function toggleBold() {
  if (!selectsEverything()) return document.execCommand("bold");
  if (bodyTextAllBold()) { COMMANDS.unboldAll(); return selectAll(); }
  const before = editor.innerHTML;
  for (const block of editor.querySelectorAll("p, li, td, th, caption")) {
    if (block.dataset.image) continue;
    const s = document.createElement("strong");
    // Nested lists stay outside the bold wrapper
    const kids = [...block.childNodes].filter((c) => !(c.nodeType === 1 && /^(UL|OL)$/.test(c.tagName)));
    if (!kids.length) continue;
    kids[0].before(s);
    s.append(...kids);
  }
  ownUndo = { before, after: editor.innerHTML };
  editor.dispatchEvent(new Event("input"));
  selectAll();   // keep everything selected so the next Ctrl+B unbolds it
}

const COMMANDS = {
  bold: () => toggleBold(),
  italic: () => document.execCommand("italic"),
  h2: () => document.execCommand("formatBlock", false, "h2"),
  h3: () => document.execCommand("formatBlock", false, "h3"),
  h4: () => document.execCommand("formatBlock", false, "h4"),
  p: () => document.execCommand("formatBlock", false, "p"),
  ul: () => document.execCommand("insertUnorderedList"),
  ol: () => document.execCommand("insertOrderedList"),
  link: () => {
    const current = getSelection().anchorNode?.parentElement?.closest("a")?.getAttribute("href") || "https://";
    const url = prompt("Link address", current);
    if (url && url.trim() && url.trim() !== "https://") document.execCommand("createLink", false, url.trim());
  },
  unlink: () => document.execCommand("unlink"),
  clear: () => document.execCommand("removeFormat"),
  // Whole post at once. Done on the page directly (the browser's own commands mangle lists
  // when run on everything), with its own one-step undo below.
  unboldAll: () => {
    const before = editor.innerHTML;
    for (const b of editor.querySelectorAll("strong, b")) b.replaceWith(...b.childNodes);
    for (const s of editor.querySelectorAll('span[style*="font-weight"]')) s.replaceWith(...s.childNodes);
    editor.normalize();
    if (editor.innerHTML === before) return;
    ownUndo = { before, after: editor.innerHTML };
    editor.dispatchEvent(new Event("input"));
  },
  undo: () => { if (!undoOwn()) document.execCommand("undo"); },
  redo: () => document.execCommand("redo"),
};

// Undo for "Remove all bold": only while nothing else has changed since
let ownUndo = null;
function undoOwn() {
  if (!ownUndo || editor.innerHTML !== ownUndo.after) { ownUndo = null; return false; }
  editor.innerHTML = ownUndo.before;
  ownUndo = null;
  editor.dispatchEvent(new Event("input"));
  return true;
}

// Keep the text selection when clicking toolbar buttons
$("toolbar").addEventListener("mousedown", (e) => { if (e.target.closest("button")) e.preventDefault(); });
$("toolbar").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-cmd]");
  if (!b) return;
  if (!editor.contains(getSelection().anchorNode)) editor.focus();
  COMMANDS[b.dataset.cmd]();
  updateToolbar();
});
editor.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); COMMANDS.link(); }
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "b") { e.preventDefault(); toggleBold(); updateToolbar(); }
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "z" && undoOwn()) e.preventDefault();
});

// Highlight Bold / Italic / heading buttons for where the cursor is
function updateToolbar() {
  const inside = editor.contains(getSelection().anchorNode);
  const block = inside ? (document.queryCommandValue("formatBlock") || "").toLowerCase() : "";
  for (const b of $("toolbar").querySelectorAll("[data-cmd]")) {
    const c = b.dataset.cmd;
    let on = false;
    if (inside && (c === "bold" || c === "italic")) on = document.queryCommandState(c);
    else if (inside && /^(h[2-4]|p)$/.test(c)) on = block === c;
    else if (inside && (c === "ul" || c === "ol")) on = document.queryCommandState(c === "ul" ? "insertUnorderedList" : "insertOrderedList");
    b.classList.toggle("on", on);
  }
}
document.addEventListener("selectionchange", updateToolbar);

// ── Copy ─────────────────────────────────────────────────────────────────

let noteTimer;
function done(btn, msg) {
  btn.classList.add("done");
  $("copyNote").textContent = msg;
  clearTimeout(noteTimer);
  noteTimer = setTimeout(() => { btn.classList.remove("done"); $("copyNote").textContent = ""; }, 2200);
}
function failed() { $("copyNote").textContent = "Couldn't copy. Select the text and press Ctrl+C."; }

async function copyPlain(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch {
    const ta = Object.assign(document.createElement("textarea"), { value: text });
    ta.style.cssText = "position:fixed;opacity:0";
    document.body.append(ta); ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

// HTML and plain text go on the clipboard together, so visual editors (Squarespace,
// Wix…) paste formatted text and plain fields still get clean text
async function copyRich() {
  try {
    await navigator.clipboard.write([new ClipboardItem({
      "text/html": new Blob([result.html], { type: "text/html" }),
      "text/plain": new Blob([result.text], { type: "text/plain" }),
    })]);
    return true;
  } catch {
    const holder = document.createElement("div");
    holder.innerHTML = result.html;
    holder.style.cssText = "position:fixed;left:-9999px;top:0";
    document.body.append(holder);
    const range = document.createRange();
    range.selectNodeContents(holder);
    const sel = getSelection(); sel.removeAllRanges(); sel.addRange(range);
    const ok = document.execCommand("copy");
    sel.removeAllRanges(); holder.remove();
    return ok;
  }
}

const onCopy = (id, copy, msg) => {
  const btn = $(id);
  btn.addEventListener("click", async () => {
    flush();   // include the latest edits
    if (result && result.html && await copy()) done(btn, msg); else failed();
  });
};
onCopy("copyRich", copyRich, "Copied. Paste into the CMS editor.");
onCopy("copyHtml", () => copyPlain(result.html), "HTML copied.");
onCopy("copyText", () => copyPlain(result.text), "Plain text copied.");

// Handy for testing: window.formatter.load({ html })
window.formatter = { load, flush, get result() { return result; } };
