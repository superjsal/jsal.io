import { clean, detectSource, looksLikeHtml, words, boldOnlyLines, wpBlocks, PRIVATE_LINK, DEAD_LINK } from "./clean.js?v=2026-10-30z";
import { SAMPLE_HTML } from "./sample.js?v=2026-10-30z";

const $ = (id) => document.getElementById(id);
const app = document.querySelector(".app");
const editor = $("editor");
const htmlEdit = $("htmlEdit");

const ICONS = {
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
  external:  '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  wand:      '<path d="m15 4-1.5 1.5M20 9l-1.5 1.5M18 4l1 1M3 21l11-11M14 4l6 6"/><path d="M17.5 2.5v2M21.5 6.5h-2"/>',
};
const icon = (name, size = 14, stroke = 2.2) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
for (const el of document.querySelectorAll("[data-icon]")) el.innerHTML = icon(el.dataset.icon, +el.dataset.size || 14);
// On a Mac the shortcuts use ⌘: the paste hints, and the toolbar's tooltips (redo there is ⌘⇧Z, not Ctrl+Y)
const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
if (isMac) {
  for (const k of document.querySelectorAll(".mod-key")) k.textContent = "⌘";
  for (const b of document.querySelectorAll("[title*='Ctrl+']")) b.title = b.title.replace("Ctrl+Y", "⌘⇧Z").replace("Ctrl+", "⌘");
}

// Pasted content is never saved anywhere
let input = null;     // { html, text } as pasted
let result = null;    // latest clean() of the editor content
let fixes = [];       // what cleaning fixed on the first pass (shown until the next paste)
let source = "";      // "Word", "Google Docs"… for the pane title

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

// Phones and tablets have no Ctrl/⌘+V: the paste area takes a tap-and-hold Paste (it's editable there, but
// typing into it does nothing), and a button reads the clipboard where the browser allows it
const touch = matchMedia("(pointer: coarse)").matches;
const canReadClipboard = !!(navigator.clipboard && (navigator.clipboard.read || navigator.clipboard.readText));
if (touch) {
  const zone = $("pasteZone");
  zone.contentEditable = "true";
  zone.inputMode = "none";   // no on-screen keyboard: it's only there to receive a paste
  zone.addEventListener("beforeinput", (e) => { if (e.inputType !== "insertFromPaste") e.preventDefault(); });
  // A tablet with a keyboard is still a touch screen, so the keyboard paste is mentioned too
  const keys = `${isMac ? "⌘" : "Ctrl"} + V`;
  document.querySelector(".paste-sub").textContent = `Copy from Word, Google Docs, a web page or HTML code, then tap and hold here and choose Paste (or press ${keys}).`;
  // The About steps mention the Paste from clipboard button only where it's shown (the same test as below)
  $("howPaste").textContent = `. Then tap and hold the paste area and choose Paste${canReadClipboard ? ", or tap Paste from clipboard" : ""} (or press ${keys} with a keyboard)`;
}
if (canReadClipboard) {
  $("pasteBtn").hidden = $("pasteSep").hidden = false;
  $("pasteBtn").addEventListener("click", async () => {
    try {
      let html = "", text = "";
      if (navigator.clipboard.read) {
        for (const item of await navigator.clipboard.read()) {
          if (item.types.includes("text/html")) html = await (await item.getType("text/html")).text();
          if (item.types.includes("text/plain")) text = await (await item.getType("text/plain")).text();
        }
      } else text = await navigator.clipboard.readText();
      if (!html.trim() && !text.trim()) { $("pasteNote").textContent = "The clipboard is empty. Copy your content first."; return; }
      $("pasteNote").textContent = "";
      load({ html, text });
    } catch {
      $("pasteNote").textContent = touch ? "This browser didn't allow reading the clipboard. Tap and hold above, then choose Paste."
        : `This browser didn't allow reading the clipboard. Press ${isMac ? "⌘" : "Ctrl"} + V instead.`;
    }
  });
}
$("sampleBtn").addEventListener("click", () => load({ html: SAMPLE_HTML, text: "" }));
$("blankBtn").addEventListener("click", () => { load({ html: "", text: "" }, true); editor.focus(); });

function load(data, blank = false) {
  if (!blank && !(data.html || "").trim() && !(data.text || "").trim()) return;
  input = data;
  app.classList.add("has-content");
  source = blank ? "" : detectSource(input.html, input.text);
  result = clean(input);
  if (!blank && data.html !== SAMPLE_HTML) window.jsalAchieve?.("spotless");   // achievement (/nav.js); the sample doesn't count
  fixes = result.checks.filter((c) => c.fix);
  editor.innerHTML = result.html;
  htmlEdit.value = result.html;
  // Open the tab that matches what was pasted: HTML code → HTML, everything else → Text
  const code = !blank && !(data.html || "").trim() && looksLikeHtml(data.text);
  tabButton(code ? "code" : "page").click();
  showResult();
}

$("clearBtn").addEventListener("click", () => {
  input = result = null;
  fixes = [];
  hideLinkBox();
  editor.innerHTML = "";
  app.classList.remove("has-content");
  $("backToChecks").hidden = true;
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
  // Bold-only lines get a gold bar in the margin until they're made headings
  const bold = new Set(boldOnlyLines(editor));
  for (const p of editor.querySelectorAll(":scope > p")) {
    if (bold.has(p)) p.dataset.bold = "1";
    else delete p.dataset.bold;
  }
  for (const a of editor.querySelectorAll("a")) {
    const href = a.getAttribute("href") || "";
    a.title = href;
    a.classList.toggle("flag", PRIVATE_LINK.test(href) || DEAD_LINK.test(href) || /^http:\/\//i.test(href));   // same tests as the checks
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

  shownChecks = [...result.checks.filter((c) => !c.fix), ...fixes];
  if (n && !shownChecks.some((c) => c.level === "warn")) shownChecks.push({ level: "ok", text: "No problems found." });
  // Checks about particular lines are buttons that show them in the text
  $("checks").innerHTML = shownChecks.map((c, i) => {
    const body = `<span class="ico">${icon(c.level === "ok" ? "check" : c.level, 12, 2.6)}</span><span>${escapeHtml(c.text)}</span>`;
    return c.find
      ? `<li><button type="button" class="check ${c.level}" data-check="${i}" title="Show in the text">${body}<span class="check-show">Show</span></button></li>`
      : `<li class="check ${c.level}">${body}</li>`;
  }).join("");
  // Screen readers hear the summary when it changes (not on every keystroke)
  const warns = shownChecks.filter((c) => c.level === "warn").length;
  const say = !n ? "" : warns ? `${warns} thing${warns === 1 ? "" : "s"} to check, listed under Checks.` : "No problems found.";
  if (say !== $("checksSay").textContent) $("checksSay").textContent = say;
}

// ── Show a check's lines: scroll to it if needed, then flash it and put the cursor there.
// Clicking again moves on to the next one when a check covers several. ──
let shownChecks = [];
const located = new Map();   // check id → index of the line shown last
const REDUCED_MOTION = matchMedia("(prefers-reduced-motion: reduce)");
const ONE_COLUMN = matchMedia("(max-width: 899px)");
// Resolves once the page and the editor have stopped moving for a few frames (scrollend isn't in every
// Safari, and a long smooth scroll on a phone can outlast any fixed wait), or after 1.5s at most
const scrollSettled = (el) => new Promise((done) => {
  const pane = editor.closest(".pane-body"), start = performance.now();
  let last = "", still = 0;
  (function frame() {
    const now = `${scrollX},${scrollY},${pane.scrollTop},${Math.round(el.getBoundingClientRect().top)}`;
    still = now === last ? still + 1 : 0;
    last = now;
    if (still >= 4 || performance.now() - start > 1500) done();
    else requestAnimationFrame(frame);
  })();
});
// Whether the line sits where you can see it: inside the editor's scroll area and the screen, clear of the
// browser's own bars and, in one column, the Back to checks button floating at the bottom
function inView(el) {
  const box = el.getBoundingClientRect(), view = editor.closest(".pane-body").getBoundingClientRect();
  const screen = visualViewport?.height || innerHeight, clear = ONE_COLUMN.matches ? 96 : 8;
  return box.top >= Math.max(view.top, clear) && box.bottom <= Math.min(view.bottom, screen - clear);
}
let locating = 0, fadeTimer;
async function locate(check, from) {
  const run = ++locating;   // a newer Show press takes over from one still scrolling
  if (editor.hidden) tabButton("page").click();
  const lines = check.find(editor);
  if (!lines.length) return;
  const i = ((located.get(check.id) ?? -1) + 1) % lines.length;
  located.set(check.id, i);
  const el = lines[i];
  for (const x of editor.querySelectorAll(".locate")) x.classList.remove("locate");   // one highlight at a time
  // Scroll first if the line isn't fully in view, in the editor or (one column) on the page, and bring it to the
  // middle; the highlight starts once it's there, so it isn't over before you see it
  if (!inView(el)) {
    el.scrollIntoView({ block: "center", behavior: REDUCED_MOTION.matches ? "instant" : "smooth" });
    await scrollSettled(el);
    if (run !== locating) return;
  }
  editor.focus({ preventScroll: true });
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(true);
  getSelection().removeAllRanges();
  getSelection().addRange(range);
  // Placing the cursor can make a phone browser scroll on its own; if the line moved away, put it back
  if (!inView(el)) el.scrollIntoView({ block: "center", behavior: "instant" });
  void el.offsetWidth;   // restart the flash if it's already running
  el.classList.add("locate");
  // Fades out on its own; with reduced motion it stays (no fade) until the next Show or edit. A new Show
  // cancels the old timer, so it can't cut the new highlight short
  clearTimeout(fadeTimer);
  if (!REDUCED_MOTION.matches) fadeTimer = setTimeout(() => el.classList.remove("locate"), 2700);
  // Screen readers hear which line, as the cursor alone doesn't say it
  const text = el.textContent.trim().replace(/\s+/g, " ");
  $("checkSay").textContent = `${lines.length > 1 ? `${i + 1} of ${lines.length}: ` : ""}${text.length > 80 ? `${text.slice(0, 80)}…` : text}`;
  // One column: the checks are now off-screen above, so offer the way back to the check that was used
  if (ONE_COLUMN.matches) { backTo = from; $("backToChecks").hidden = false; }
}
let backTo = null;
$("backToChecks").addEventListener("click", () => {
  $("backToChecks").hidden = true;
  const target = (backTo && document.contains(backTo)) ? backTo : $("checks");
  target.scrollIntoView({ block: "center", behavior: REDUCED_MOTION.matches ? "instant" : "smooth" });
  (backTo && document.contains(backTo) ? backTo : $("checks").querySelector("button"))?.focus({ preventScroll: true });
});
// The button goes once the checks are back on screen, or when the content is cleared
new IntersectionObserver(([e]) => { if (e.isIntersecting) $("backToChecks").hidden = true; }).observe($("checks"));
editor.addEventListener("input", () => { for (const x of editor.querySelectorAll(".locate")) x.classList.remove("locate"); });
$("checks").addEventListener("click", (e) => {
  const b = e.target.closest("[data-check]");
  if (b) locate(shownChecks[+b.dataset.check], b);
});

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
const tabButton = (view) => document.querySelector(`[data-tab="out"][data-view="${view}"]`);
// Text / HTML are tabs: one tab stop, the arrow keys (and Home / End) move between them
document.querySelector('[role="tablist"]').addEventListener("keydown", (e) => {
  const tabs = [...e.currentTarget.querySelectorAll('[role="tab"]')], i = tabs.indexOf(document.activeElement);
  const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
  if (i < 0 || next === undefined) return;
  e.preventDefault();
  const t = tabs[(next + tabs.length) % tabs.length];
  t.click();
  t.focus();
});
for (const tab of document.querySelectorAll("[data-tab]")) {
  tab.addEventListener("click", () => {
    flush();
    hideLinkBox();
    const group = tab.dataset.tab;
    for (const t of document.querySelectorAll(`[data-tab="${group}"]`)) { t.setAttribute("aria-selected", t === tab); t.tabIndex = t === tab ? 0 : -1; }
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
    const a = linkAt();
    const sel = getSelection();
    if (a) showLinkBox(a, true);
    else if (sel.rangeCount && editor.contains(sel.anchorNode)) showLinkBox(sel.getRangeAt(0).cloneRange(), true);
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

// ── Link box ─────────────────────────────────────────────────────────────
// Put the cursor in a link and a small box under it shows the address to change, open or
// remove. Ctrl+K or the link button opens it for the selected text to add a new link.

const linkBox = $("linkBox"), linkUrl = $("linkUrl");
let linkTarget = null;   // the <a> being edited, or the selected Range for a new link
let dismissed = null;    // link closed with Esc: stays closed until the cursor leaves it

function linkAt() {
  const n = getSelection().anchorNode;
  if (!n || !editor.contains(n)) return null;
  return (n.nodeType === 1 ? n : n.parentElement).closest("a");
}

function showLinkBox(target, focus) {
  linkTarget = target;
  const a = target instanceof Element ? target : null;
  linkUrl.value = a ? a.getAttribute("href") || "" : "https://";
  $("linkOpen").hidden = $("linkRemove").hidden = !a;
  if (a) $("linkOpen").href = a.href;
  linkBox.hidden = false;
  placeLinkBox();
  if (focus) { linkUrl.focus(); linkUrl.select(); }
}

function hideLinkBox() { linkBox.hidden = true; linkTarget = null; }

// Under the link (above it near the bottom of the pane), kept inside the pane
function placeLinkBox() {
  if (linkBox.hidden || !linkTarget) return;
  const rect = linkTarget.getBoundingClientRect();
  const pane = linkBox.parentElement.getBoundingClientRect(), view = editor.closest(".pane-body").getBoundingClientRect();
  linkBox.style.visibility = rect.bottom < view.top || rect.top > view.bottom ? "hidden" : "";
  const left = Math.max(8, Math.min(rect.left - pane.left, pane.width - linkBox.offsetWidth - 8));
  let top = rect.bottom - pane.top + 6;
  if (top + linkBox.offsetHeight > pane.height - 8) top = rect.top - pane.top - linkBox.offsetHeight - 6;
  linkBox.style.left = `${left}px`;
  linkBox.style.top = `${top}px`;
}

// Runs through the browser's own link commands, so Ctrl+Z undoes it like any other edit
function selectTarget() {
  editor.focus({ preventScroll: true });
  let r = linkTarget;
  if (r instanceof Element) { const a = r; r = document.createRange(); r.selectNodeContents(a); }
  const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
}
function saveLink() {
  if (!linkTarget) return;
  let url = linkUrl.value.trim();
  if (/^www\./i.test(url)) url = "https://" + url;
  const isLink = linkTarget instanceof Element;
  selectTarget();
  if (url && url !== "https://") document.execCommand("createLink", false, url);
  else if (isLink) document.execCommand("unlink");
  getSelection().collapseToEnd();
  hideLinkBox();
}
function removeLink() {
  if (!(linkTarget instanceof Element)) return;
  selectTarget();
  document.execCommand("unlink");
  getSelection().collapseToEnd();
  hideLinkBox();
}

$("linkSave").addEventListener("click", saveLink);
$("linkRemove").addEventListener("click", removeLink);
linkUrl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); saveLink(); }
  if (e.key === "Escape") {
    e.preventDefault();
    const a = linkTarget instanceof Element ? linkTarget : null;
    dismissed = a;
    if (a || linkTarget) selectTarget();
    getSelection().collapseToEnd();
    hideLinkBox();
  }
});
// Clicking away from a new-link box closes it
linkBox.addEventListener("focusout", (e) => {
  if (!linkBox.contains(e.relatedTarget) && !(linkTarget instanceof Element)) hideLinkBox();
});
document.addEventListener("selectionchange", () => {
  if (linkBox.contains(document.activeElement)) return;
  const a = linkAt();
  if (!a) { dismissed = null; if (linkTarget instanceof Element) hideLinkBox(); return; }
  if (a !== dismissed && a !== linkTarget) showLinkBox(a, false);
});
editor.closest(".pane-body").addEventListener("scroll", placeLinkBox);
window.addEventListener("resize", placeLinkBox);
editor.addEventListener("input", () => requestAnimationFrame(placeLinkBox));

// ── Copy ─────────────────────────────────────────────────────────────────

let noteTimer;
function done(btn, msg) {
  btn.classList.add("done");
  $("copyNote").textContent = msg;
  clearTimeout(noteTimer);
  noteTimer = setTimeout(() => { btn.classList.remove("done"); $("copyNote").textContent = ""; }, 2200);
}
function failed() { $("copyNote").textContent = touch ? "Couldn't copy. Select the text, then tap Copy." : `Couldn't copy. Select the text and press ${isMac ? "⌘C" : "Ctrl+C"}.`; }

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
onCopy("copyWp", () => copyPlain(wpBlocks(result.root)), "Copied. Paste into the WordPress block editor.");

// Handy for testing: window.formatter.load({ html })
window.formatter = { load, flush, get result() { return result; } };
