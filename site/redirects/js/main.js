// Redirect Import: the sheet, the file beside it and its Settings. The checks themselves are in core.js.
import { analyse, writeFile, parseDelimited, pickColumns, colLetter, tidy } from "./core.js?v=1734c6ef";
import { FORMATS, byId } from "./formats.js?v=a43b7548";

const $ = (id) => document.getElementById(id);
const app = $("app"), work = $("work"), tbody = $("rows");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const store = { get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };

let table = null;        // what was loaded: { raw, name, pick }
let rows = [];           // { id, n, old, new, old0, new0, added, deleted, skip }
// n is the row's number in the visitor's spreadsheet (headings are row 1), kept when rows are deleted; rows added
// here number on from the last
let nextId = 1, lastN = 0, filter = "all", part = 0, result = null, cleared = null, used = false, missing = 0;
// Rows worked on since a filter was picked stay on screen, as in a spreadsheet, so a row being fixed under
// "Needs you" doesn't vanish mid-word; picking a filter again applies it afresh
const stay = new Set();
// No platform is chosen for the visitor: until they pick one the file is a plain CSV, said so, with only the checks
// every platform shares. Once picked, it's remembered
const saved = store.get("jsal-redirects-platform");
let picked = FORMATS.some((f) => f.id === saved);
let fmt = byId(picked ? saved : "plain"), opts = defaults(fmt);

function defaults(f) {
  return { code: "301", newAddr: "path", newSite: "", headerOn: f.kind === "csv" && !f.headerOff, sep: ",", header: null, statusCol: f.codes === "required", name: null };
}
const sepName = (s) => ({ ",": "Comma", ";": "Semicolon", "\t": "Tab", "|": "Pipe" })[s] || `“${s}”`;
const sepShown = (s) => s.replace(/\t/g, "\\t");
const sepWord = (s) => ({ ";": "semicolons", "\t": "tabs", "|": "pipes" })[s] || `“${sepShown(s)}”`;
const unquote = (s) => s.replace(/^"(.*)"$/, "$1");
// Anything in the file that strays from the platform's help page. Where its importer has been read (seps, heads) the
// caution says what will happen; elsewhere, that it may not import. One about the header row is said under it
function offDocs(f, head, docHead) {
  const out = { file: [], head: "", noHead: "" };
  if (f.kind !== "csv" || !f.doc) return out;
  const sep = opts.sep, names = head === null ? [] : head.split(sep).map(unquote), doc = docHead.split(sep).map(unquote).join(sep);
  if (f.seps) {
    if (!f.seps.includes(sep)) out.file.push(`${f.name} reads only commas, semicolons or pipes between columns, so with ${sepWord(sep)} it imports nothing. Change the separator under Settings.`);
  } else if (sep !== ",") out.file.push(`${f.name}’s help asks for commas between columns, so with ${sepWord(sep)} it may not import. Change the separator under Settings.`);
  if (f.heads) {
    if (head !== null && !f.heads.every((ok, i) => ok.includes(names[i]?.trim().toLowerCase()))) {
      out.head = `${f.name} skips a header row only when it starts ${f.heads.map((ok) => ok[0]).join(sep)} or ${f.heads.map((ok) => ok[1]).join(sep)}, so this one would go in as a redirect. Change it, or remove it.`;
    }
  } else if (f.headerOff) {
    if (head !== null) out.head = `${f.name}’s help doesn’t mention a header row, so this one may go in as a redirect. Remove it with ×.`;
  } else if (head === null) {
    out.noHead = `No header row. ${f.name}’s help shows one first, so the first redirect may be skipped.`;
  } else if (!f.anyHead && names.join(sep) !== doc) {
    out.head = `${f.name}’s help shows the header row as ${doc.split(sep).join(",")}, so this one may not import. Change it back.`;
  }
  return out;
}

// ── Platforms ──────────────────────────────────────────────────────────────

const groups = [...new Set(FORMATS.map((f) => f.group))];
$("platform").innerHTML = `<option value="" disabled>Pick a platform</option>` + groups.map((g) => `<optgroup label="${esc(g)}">${FORMATS.filter((f) => f.group === g)
  .map((f) => `<option value="${f.id}">${esc(f.label || f.name)}</option>`).join("")}</optgroup>`).join("");
$("platform").value = picked ? fmt.id : "";
$("platform").addEventListener("change", (e) => {
  fmt = byId(e.target.value); opts = defaults(fmt); part = 0; picked = true;
  store.set("jsal-redirects-platform", fmt.id);
  showWhere();
  update();
});

// ── Loading a sheet ────────────────────────────────────────────────────────

function load(raw, name) {
  if (!raw.length) return showError("Nothing to read there. Copy two columns: old addresses and new ones.");
  table = { raw, name, pick: pickColumns(raw) };
  build();
}
function build() {
  const { raw, pick } = table;
  lastN = 0;
  rows = raw.slice(pick.header ? 1 : 0).map((r, i) => row(r[pick.o], r[pick.n], false, (r.at ?? i + (pick.header ? 1 : 0)) + 1));
  part = 0;
  const label = (i) => `${colLetter(i)}${pick.names[i] ? ": " + pick.names[i] : ""}`;
  $("cols").hidden = pick.width < 3;
  for (const [sel, at] of [[$("colOld"), pick.o], [$("colNew"), pick.n]]) {
    sel.innerHTML = Array.from({ length: pick.width }, (_, i) => `<option value="${i}">${esc(label(i))}</option>`).join("");
    sel.value = at;
  }
  show();
}
function row(o = "", n = "", added = false, num = lastN + 1) {
  o = tidy(o); n = tidy(n);
  lastN = Math.max(lastN, num);
  const r = { id: nextId++, n: num, old: o, new: n, old0: o, new0: n, added };
  if (added) stay.add(r.id);
  return r;
}
for (const [sel, k] of [[$("colOld"), "o"], [$("colNew"), "n"]]) {
  sel.addEventListener("change", () => { table.pick[k] = +sel.value; build(); });
}

function show() {
  $("dropError").hidden = true;
  app.classList.add("has-content");
  tbody.innerHTML = "";
  const all = document.createDocumentFragment();
  rows.forEach((r) => { if (!r.deleted) all.append(rowEl(r)); });
  tbody.append(all);
  if (!used) { used = true; window.jsalUsed?.(); }
  place();
  update();
  growAll();
}
function showError(text) { const e = $("dropError"); e.textContent = text; e.hidden = false; }

async function readFile(file) {
  const name = file.name || "";
  if (/\.(xls|numbers|ods)$/i.test(name)) return showError(`${name} can’t be read here. Save it as .xlsx or CSV and try again.`);
  try {
    if (/\.xlsx$/i.test(name)) {
      const { readXlsx } = await import("./xlsx.js?v=8b577352");
      const book = await readXlsx(await file.arrayBuffer());
      book.rows.forEach((r, i) => (r.at = i));   // each row's place in the sheet, for its number
      return load(book.rows.filter((r) => r.some((c) => tidy(c))), name + (book.name ? ` · sheet ${book.name}` : ""));
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    let text;
    try { text = new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
    catch (e) { text = new TextDecoder("windows-1252").decode(bytes); }   // older Excel saves CSV this way
    load(parseDelimited(text), name);
  } catch (e) {
    showError(`${name} couldn’t be read. If it’s from Excel, save it as .xlsx or CSV and try again.`);
  }
}

// Phones have no Ctrl+V, and nothing on the empty page to hold for a Paste menu, so they get a Paste button that
// reads what was copied (the browser may ask first); where it can't, a cell of an empty sheet takes the paste instead
if (matchMedia("(pointer: coarse)").matches) $("pasteBtn").hidden = $("pasteSep").hidden = $("dropDesk").hidden = false;
$("pasteBtn").addEventListener("click", async () => {
  let text = "";
  try { text = await navigator.clipboard.readText(); }
  catch (e) { return showError("This browser didn’t let the page read what you copied. Tap Start with an empty sheet, then hold the first box and choose Paste."); }
  if (!text.trim()) return showError("Nothing copied yet. Copy the two columns, then tap Paste.");
  load(parseDelimited(text), "Pasted");
});
// The tool is easiest on a computer, so a phone can send the page there: its share sheet, or the link copied
$("shareBtn").addEventListener("click", async (e) => {
  const btn = e.currentTarget, url = document.querySelector('link[rel="canonical"]')?.href || location.href.split("#")[0];
  if (navigator.share) { try { await navigator.share({ title: "Redirect Import", url }); } catch (x) {} return; }   // closing the share sheet isn't an error
  try { await navigator.clipboard.writeText(url); window.jsalDone?.(btn, "Link copied"); }
  catch (x) { showError(`This browser didn’t allow copying. The page is ${url}`); }
});
$("pickFile").addEventListener("click", () => $("fileInput").click());
$("otherFile").addEventListener("click", () => $("fileInput").click());
$("fileInput").addEventListener("change", (e) => { const f = e.target.files[0]; e.target.value = ""; if (f) readFile(f); });
$("blankSheet").addEventListener("click", () => {
  table = { raw: [], name: "", pick: { o: 0, n: 1, header: false, width: 2, names: [] } };
  lastN = 0;
  rows = [row(), row(), row()];
  $("cols").hidden = true;
  show();
  tbody.querySelector(".cell")?.focus();
});
$("exampleBtn").addEventListener("click", () => load(parseDelimited(EXAMPLE), "Example"));
$("undoClear")?.addEventListener("click", undoClear);

// Dropping a file anywhere on the page loads it
document.addEventListener("dragover", (e) => { if ([...e.dataTransfer.types].includes("Files")) { e.preventDefault(); $("drop").classList.add("over"); } });
document.addEventListener("dragleave", (e) => { if (!e.relatedTarget) $("drop").classList.remove("over"); });
document.addEventListener("drop", (e) => {
  $("drop").classList.remove("over");
  const f = e.dataTransfer.files[0];
  if (f) { e.preventDefault(); readFile(f); }
});

// Pasting: on the empty page it starts the sheet; into a cell, several rows or columns fill the cells from there down,
// as a spreadsheet does; anywhere else on a loaded sheet it adds the rows at the end
document.addEventListener("paste", (e) => {
  const text = e.clipboardData?.getData("text/plain") || "";
  const cell = e.target.closest?.(".cell");
  if (cell) {
    // Several rows or columns spread down and across; so does an old and new address copied together with a space
    // between them (from an email, a doc or a phone), which would otherwise land in one cell
    const raw = parseDelimited(text);
    if (!/[\t\n]/.test(text.trim()) && !(/\s/.test(text.trim()) && raw.length === 1 && raw[0].length === 2)) return;
    e.preventDefault();
    return spread(cell, raw);
  }
  if (e.target.closest?.("input, textarea, select")) return;
  if (!text.trim()) return;
  e.preventDefault();
  if (!app.classList.contains("has-content")) return load(parseDelimited(text), "Pasted");
  const raw = parseDelimited(text), pick = pickColumns(raw);
  const added = raw.slice(pick.header ? 1 : 0).map((r) => row(r[pick.o], r[pick.n], true));
  rows.push(...added);
  added.forEach((r) => tbody.append(rowEl(r)));
  update();
  rowOf(added[0])?.scrollIntoView({ block: "nearest" });
});
function spread(cell, raw) {
  const live = rows.filter((r) => !r.deleted);
  let at = live.findIndex((r) => r.id === +cell.closest("tr").dataset.id);
  const startCol = cell.dataset.cell;
  for (const vals of raw) {
    let r = live[at];
    if (!r) { r = row("", "", true); rows.push(r); live.push(r); tbody.append(rowEl(r)); }
    // A pair pasted into the new-address cell of a row with no old address fills the whole row
    if (startCol === "old" || (vals.length > 1 && !tidy(r.old))) { r.old = tidy(vals[0]); if (vals.length > 1) r.new = tidy(vals[1]); }
    else r.new = tidy(vals[0]);
    stay.add(r.id);
    setCell(r, "old", r.old);
    setCell(r, "new", r.new);
    at++;
  }
  update();
}

// ── The sheet ──────────────────────────────────────────────────────────────

const rowOf = (r) => r.el;
const byRowId = (tr) => rows.find((r) => r.id === +tr.dataset.id);
// Cells wrap so a long address shows in full; browsers without field-sizing grow them by script instead
const autoSize = !CSS.supports("field-sizing", "content");
const grow = (cell) => { if (autoSize) { cell.style.height = "auto"; cell.style.height = cell.scrollHeight + 2 + "px"; } };
function growAll() {
  if (!autoSize) return;
  const cells = [...tbody.querySelectorAll(".cell")];
  cells.forEach((c) => (c.style.height = "auto"));
  const heights = cells.map((c) => c.scrollHeight);   // every height read in one go, then written
  cells.forEach((c, i) => (c.style.height = heights[i] + 2 + "px"));
}
function rowEl(r) {
  const tr = document.createElement("tr");
  tr.dataset.id = r.id;
  tr.innerHTML = `<td class="n"></td><td class="st"><span class="dot"></span></td>
    <td class="o" data-label="Old address"><textarea class="cell" data-cell="old" rows="1" spellcheck="false" autocomplete="off" aria-describedby="ro${r.id}"></textarea><div class="notes" id="ro${r.id}"></div></td>
    <td class="nw" data-label="New address"><textarea class="cell" data-cell="new" rows="1" spellcheck="false" autocomplete="off" aria-describedby="rn${r.id}"></textarea><div class="notes" id="rn${r.id}"></div></td>
    <td class="x"><button type="button" class="del" data-del><span aria-hidden="true">×</span></button></td>`;
  tr.querySelector('[data-cell="old"]').value = r.old;
  tr.querySelector('[data-cell="new"]').value = r.new;
  r.el = tr;
  return tr;
}
function setCell(r, field, value) {
  r[field] = value;
  const cell = r.el.querySelector(`[data-cell="${field}"]`);
  cell.value = value;
  grow(cell);
}

let timer = 0;
tbody.addEventListener("input", (e) => {
  const cell = e.target.closest(".cell");
  if (!cell) return;
  const r = byRowId(cell.closest("tr"));
  r[cell.dataset.cell] = cell.value;
  stay.add(r.id);
  grow(cell);
  clearTimeout(timer);
  timer = setTimeout(update, 150);
});
// Enter moves down a column, adding a row at the end, as in a spreadsheet
tbody.addEventListener("keydown", (e) => {
  const cell = e.target.closest(".cell");
  if (!cell || e.key !== "Enter") return;
  e.preventDefault();
  let next = cell.closest("tr").nextElementSibling;
  while (next && next.hidden) next = next.nextElementSibling;
  if (!next) { addRow(); next = tbody.lastElementChild; }
  next.querySelector(`[data-cell="${cell.dataset.cell}"]`).focus();
});
tbody.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  const tr = b.closest("tr"), r = byRowId(tr), it = result.items.get(r.id);
  stay.add(r.id);
  if (b.hasAttribute("data-del")) {
    r.deleted = true;
    const next = tr.nextElementSibling || tr.previousElementSibling;
    tr.remove();
    update();
    (next?.querySelector(".del") || $("addRow")).focus();
    return;
  }
  // Leaving a row out keeps it in the sheet, grey, with a way to put it back
  if (b.hasAttribute("data-skip") || b.hasAttribute("data-unskip")) {
    r.skip = b.hasAttribute("data-skip");
    update();
    (tr.querySelector("[data-unskip]") || tr.querySelector(".cell")).focus({ focusVisible: !e.detail });   // a ring for the keyboard only
    return;
  }
  if (b.dataset.fix) {
    const [cell, ni, fi] = b.dataset.fix.split(":");
    const note = it.notes.filter((x) => x.cell === cell)[+ni];
    const field = cell === "o" ? "old" : "new";
    setCell(r, field, note.fixes[+fi][1](r[field]));
  } else if (b.dataset.undo) setCell(r, b.dataset.undo, r[b.dataset.undo + "0"]);
  else return;
  update();
  tr.querySelector(".cell").focus();
});

function addRow() {
  const r = row("", "", true);
  rows.push(r);
  tbody.append(rowEl(r));
  update();
  return r;
}
$("addRow").addEventListener("click", () => { const r = addRow(); rowOf(r).querySelector(".cell").focus(); });
$("undoAll").addEventListener("click", () => {
  rows = rows.filter((r) => !r.added);
  for (const r of rows) { r.old = r.old0; r.new = r.new0; r.deleted = r.skip = false; }
  show();
});
// Copy sheet: the two columns as they are now, tab-separated, to paste back over the source spreadsheet, so its
// fixes aren't lost the next time the sheet is exported
$("copySheet").addEventListener("click", async (e) => {
  const q = (s) => (/[\t\n"]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const { pick } = table, names = pick.header && [pick.names[pick.o] || "", pick.names[pick.n] || ""];
  const lines = rows.filter((r) => !r.deleted && !r.skip && (tidy(r.old) || tidy(r.new))).map((r) => [r.old, r.new]);
  const text = (names ? [names, ...lines] : lines).map((l) => l.map(q).join("\t")).join("\n") + "\n";
  const err = $("sheetError"), btn = e.currentTarget;   // read before the await, after which it's gone
  err.hidden = true;
  try { await navigator.clipboard.writeText(text); window.jsalDone?.(btn, "Copied"); }
  catch (x) { err.textContent = "This browser didn’t allow copying. Try again, or allow clipboard access for this site."; err.hidden = false; }
});

// The sheet is kept in this browser as it's worked on, and comes back after a reload; Clear forgets it
const KEEP = "jsal-redirects-sheet";
let keepTimer = 0;
function save() {
  clearTimeout(keepTimer); keepTimer = 0;
  if (!table) return;
  let ok = false;
  try {
    localStorage.setItem(KEEP, JSON.stringify({ name: table.name, pick: table.pick, platform: fmt.id, opts,
      // A row's address as loaded is kept only where it was edited, which halves a big sheet
      rows: rows.map((r) => [r.old, r.new, r.old0 === r.old ? null : r.old0, r.new0 === r.new ? null : r.new0, r.added ? 1 : 0, r.deleted ? 1 : 0, r.skip ? 1 : 0, r.n]) }));
    ok = true;
  } catch (e) {}   // storage off or full: the sheet still works, it just isn't kept
  $("kept").hidden = !ok;
}
function keep() { clearTimeout(keepTimer); keepTimer = setTimeout(save, 300); }
addEventListener("pagehide", () => { if (keepTimer) save(); });
function forget() { clearTimeout(keepTimer); keepTimer = 0; try { localStorage.removeItem(KEEP); } catch (e) {} $("kept").hidden = true; }
function restore() {
  let d = null;
  try { d = JSON.parse(localStorage.getItem(KEEP)); } catch (e) {}
  if (!d?.rows?.length || !d.pick) return;
  table = { raw: [], name: d.name || "", pick: d.pick };
  rows = d.rows.map(([o, n, o0, n0, a, del, skip, num], i) => ({ id: nextId++, n: num ?? i + 1, old: o, new: n, old0: o0 ?? o, new0: n0 ?? n, added: !!a, deleted: !!del, skip: !!skip }));
  lastN = Math.max(0, ...rows.map((r) => r.n));
  if (d.platform === fmt.id && d.opts) opts = { ...opts, ...d.opts };
  $("cols").hidden = true;   // the other columns weren't kept, so there's nothing to switch to
  used = true;               // coming back to a sheet isn't a new use of the tool
  show();
  $("kept").hidden = false;
}

$("clearBtn").addEventListener("click", () => {
  cleared = { table, rows };
  forget();
  table = null; rows = []; tbody.innerHTML = "";
  app.classList.remove("has-content");
  $("undoClear").hidden = $("undoSep").hidden = false;
  $("drop").focus();
});
function undoClear() {
  ({ table, rows } = cleared);
  cleared = null;
  lastN = Math.max(0, ...rows.map((r) => r.n));
  $("undoClear").hidden = $("undoSep").hidden = true;
  show();
}

$("filterEmpty").addEventListener("click", (e) => { if (e.target.closest("[data-show-all]")) $("filter").querySelector('[data-filter="all"]').click(); });
for (const b of $("filter").children) b.addEventListener("click", () => {
  filter = b.dataset.filter;
  stay.clear();
  for (const x of $("filter").children) x.setAttribute("aria-pressed", x === b);
  update();
});

// The notes under one cell: what's wrong and its fixes, what the file does with it, and Undo
function notesHtml(r, it, cell) {
  const field = cell === "o" ? "old" : "new";
  let h = it.notes.filter((x) => x.cell === cell).map((x, i) => {
    const btns = (x.fixes || []).map(([label, f, preview], j) => `<button type="button" class="jsal-btn small" data-fix="${cell}:${i}:${j}">${esc(label)}${preview && f(r[field]).length <= 48 ? ": " + esc(f(r[field])) : ""}</button>`)
      .concat(x.leave ? `<button type="button" class="jsal-btn small" data-skip>${esc(x.leave)}</button>` : []);
    const back = x.group === "skip" ? ` · <button type="button" class="jsal-btn link" data-unskip>Put it back</button>` : "";
    return `<p class="note ${x.kind}">${x.text}${back}</p>` + (btns.length ? `<div class="fixes">${btns.join("")}</div>` : "");
  }).join("");
  if (!r.added && r[field] !== r[field + "0"]) h += `<p class="note edited">Edited · <button type="button" class="jsal-btn link" data-undo="${field}">Undo</button></p>`;
  return h;
}

// One dot per outcome: it will redirect (green), it goes in but check it after importing (terracotta), it won't until
// fixed (red), or it's left out on purpose (grey). Whether something changed on the way in is the row's note, not its dot.
const SAY = { ok: ["✓", "Ready"], fixed: ["✓", "Ready"], warn: ["?", "Goes in the file, check it after importing"], bad: ["!", "Needs you"], out: ["–", "Left out"], blank: ["", "Empty"] };
const GROUP = { ok: "ready", fixed: "ready", warn: "check", bad: "bad", out: "out", blank: "" };

// ── Everything that follows a change ───────────────────────────────────────

function update() {
  if (!table) return;
  const live = rows.filter((r) => !r.deleted);
  result = analyse(live, fmt, opts);
  const count = { all: 0, ready: 0, check: 0, bad: 0, out: 0 };
  live.forEach((r) => {
    const it = result.items.get(r.id), tr = rowOf(r);
    if (!tr) return;
    const st = it.state;
    if (st !== "blank") { count.all++; count[GROUP[st]]++; }
    // A long sheet redraws only the rows whose state, number, notes or visibility changed
    const html = { o: notesHtml(r, it, "o"), n: notesHtml(r, it, "n") };
    const shown = filter === "all" || GROUP[st] === filter || stay.has(r.id);
    const sig = `${st}|${r.n}|${shown}|${html.o}|${html.n}`;
    if (tr.dataset.sig === sig) return;
    tr.dataset.sig = sig;
    tr.className = st;
    tr.hidden = !shown;
    tr.querySelector(".n").textContent = r.n;
    const dot = tr.querySelector(".dot");
    dot.className = "dot " + (GROUP[st] === "ready" ? "ok" : st);   // ok, warn, bad or out
    dot.innerHTML = `<span aria-hidden="true">${SAY[st][0]}</span><span class="sr-only">${SAY[st][1]}</span>`;
    tr.querySelector(".del").setAttribute("aria-label", `Delete row ${r.n}`);
    for (const [cell, field, label] of [["o", "old", "Old address"], ["n", "new", "New address"]]) {
      const input = tr.querySelector(`[data-cell="${field}"]`);
      input.setAttribute("aria-label", `${label}, row ${r.n}`);
      input.setAttribute("aria-invalid", it.notes.some((x) => x.cell === cell && x.kind === "bad"));
      const box = tr.querySelector(`#r${cell}${r.id}`);
      if (box.dataset.h !== html[cell]) { box.innerHTML = html[cell]; box.dataset.h = html[cell]; }
    }
  });
  for (const b of $("filter").children) b.querySelector("span").textContent = count[b.dataset.filter];
  missing = count.bad;
  $("filterEmpty").hidden = live.some((r) => !r.el.hidden);
  // An empty Needs you is the job done, so it says so, with the way back to the whole sheet
  const empty = filter === "bad" ? `Nothing needs you now. <button type="button" class="jsal-btn link" data-show-all>Show all rows</button>` : "No rows here.";
  if ($("filterEmpty").dataset.h !== empty) { $("filterEmpty").innerHTML = empty; $("filterEmpty").dataset.h = empty; }
  overview(live);
  $("summary").innerHTML = `<b>${count.ready} ready</b>` + (count.check ? ` · ${count.check} to check` : "") + (count.bad ? ` · ${count.bad} need you` : "") + (count.out ? ` · ${count.out} left out` : "");
  // The row count is on the All filter, so this says only where the rows came from; a long file name is cut short, never
  // the note after it
  const meta = `<span class="meta-name" title="${esc(table.name)}">${esc(table.name)}</span>` + (table.pick.header ? `<span>${table.name ? " · " : ""}headings skipped</span>` : "");   // a plain space would be dropped at the start of the span
  if ($("sheetMeta").dataset.h !== meta) { $("sheetMeta").innerHTML = meta; $("sheetMeta").dataset.h = meta; }
  $("undoAll").hidden = !rows.some((r) => r.added || r.deleted || r.old !== r.old0 || r.new !== r.new0);
  renderFile();
  keep();
}

// Above the sheet: the routine changes said once rather than on every row, and any problem on two or more rows
// with a button that fixes it on all of them
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
function overview(live) {
  const d = result.done, said = [];
  if (d["o:domain"]) said.push(`the domain from ${plural(d["o:domain"], "old address", "old addresses")}${fmt.doc ? ` (${esc(fmt.name)} takes paths)` : ""}`);
  if (d["n:domain"]) said.push(`your own domain from ${plural(d["n:domain"], "new address", "new addresses")}`);
  if (d["n:preview"]) said.push(`the preview domain from ${plural(d["n:preview"], "new address", "new addresses")}`);
  if (d["o:tracking"]) said.push(`tracking tags from ${d["o:tracking"]}`);
  if (d["o:hash"]) said.push(`the # part from ${d["o:hash"]}`);
  const list = (a) => a.length > 1 ? a.slice(0, -1).join(", ") + " and " + a[a.length - 1] : a[0];
  const done = [said.length && `removed ${list(said)}`].filter(Boolean);

  // Repeats are counted by colour, so a line's number always matches the rows of its colour: problems on rows that
  // need you (red), and warnings on rows to check (terracotta)
  const groups = new Map();
  for (const r of live) {
    const it = result.items.get(r.id);
    const kind = it.state === "bad" ? "bad" : it.state === "warn" ? "warn" : "";
    if (!kind) continue;
    for (const x of it.notes) if (x.kind === kind && x.group) {
      const g = groups.get(x.group) || groups.set(x.group, { title: x.title, kind, fixes: x.fixes || [], leaveAll: x.leaveAll, ids: [] }).get(x.group);
      if (!g.ids.includes(r.id)) g.ids.push(r.id);
    }
  }
  // Duplicates always come in twos or more, and each pair is its own, so they aren't listed as repeats
  const repeats = [...groups].filter(([k, g]) => g.ids.length > 1 && !k.endsWith(":clash")).sort((a, b) => b[1].ids.length - a[1].ids.length);
  const domainOnly = live.filter((r) => result.items.get(r.id).notes.some((x) => x.group === "domain-only")).length;
  const html = (done.length ? `<p class="done"><b>Done for you:</b> ${done.join("; ")}.</p>` : "") +
    (domainOnly ? `<p class="done">${plural(domainOnly, "row only changes", "rows only change")} the domain, so ${domainOnly === 1 ? "it’s" : "they’re"} left out: connecting the old domain to the new site redirects ${domainOnly === 1 ? "it" : "them"}. <button type="button" class="jsal-btn link" data-full>Put ${domainOnly === 1 ? "it" : "them"} in with full URLs</button></p>` : "") +
    repeats.map(([key, g]) =>
    `<p class="repeat ${g.kind}"><span class="count">${g.ids.length} rows</span> <span>${g.title}</span>${g.fixes.map(([label], i) =>
      ` <button type="button" class="jsal-btn small" data-fixall="${esc(key)}|${i}">${esc(label)} in ${g.ids.length === 2 ? "both" : "all " + g.ids.length}</button>`).join("")}${g.leaveAll
      ? ` <button type="button" class="jsal-btn small" data-leaveall="${esc(key)}">Leave ${g.ids.length === 2 ? "both" : "all " + g.ids.length} out</button>` : ""}</p>`).join("");
  const box = $("overview");
  if (box.dataset.h !== html) { box.innerHTML = html; box.dataset.h = html; }
  box.hidden = !html;
  overviewGroups = groups;
}
let overviewGroups = new Map();
$("overview").addEventListener("click", (e) => {
  if (e.target.closest("[data-full]")) { opts.newAddr = "url"; update(); return; }
  const out = e.target.closest("[data-leaveall]");
  if (out) {
    for (const id of overviewGroups.get(out.dataset.leaveall).ids) { rows.find((x) => x.id === id).skip = true; stay.add(id); }
    update();
    return;
  }
  const b = e.target.closest("[data-fixall]");
  if (!b) return;
  const [key, i] = b.dataset.fixall.split("|");
  const g = overviewGroups.get(key), field = key[0] === "o" ? "old" : "new", f = g.fixes[+i][1];
  for (const id of g.ids) { const r = rows.find((x) => x.id === id); setCell(r, field, f(r[field])); stay.add(id); }
  update();
});

function parts() {
  const all = result.ready;
  if (!fmt.limit || all.length <= fmt.limit) return [all];
  return Array.from({ length: Math.ceil(all.length / fmt.limit) }, (_, i) => all.slice(i * fmt.limit, (i + 1) * fmt.limit));
}
// The visitor can rename the file but not its extension; a platform that reads its file by name keeps that name
const fileExt = () => fmt.file.match(/\.[^.]*$/)?.[0] || "";
const fileBase = () => (!fmt.fixedName && opts.name) || fmt.file.slice(0, fmt.file.length - fileExt().length);
const fileEnd = (i, total) => (total > 1 ? `-part-${i + 1}` : "") + fileExt();
function fileName(i, total) {
  return fileBase() + fileEnd(i, total);
}
// Characters no file name can hold are dropped, and so is the extension if it's typed too
function cleanName(v) {
  const s = v.replace(/[\\/:*?"<>|\x00-\x1F]/g, "").trim();
  const ext = fileExt();
  return (ext && s.toLowerCase().endsWith(ext) ? s.slice(0, -ext.length) : s).trim() || null;
}
// The site's domain without https://, for a platform that wants it on every row
const domain = () => (opts.newSite || result.site || "").trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
function fileText() {
  const p = parts(), w = writeFile(p[Math.min(part, p.length - 1)], fmt, { ...opts, domain: domain() });
  const head = fmt.kind === "csv" && opts.headerOn ? (opts.header ?? w.header) : null;
  return { w, p, head, text: (head !== null ? head + "\n" : "") + w.body + (w.body ? "\n" : "") };
}

function showWhere() {
  $("whereDoc").parentElement.hidden = !fmt.doc;
  if (fmt.doc) { $("whereDoc").href = fmt.doc; $("whereDoc").setAttribute("aria-label", `${fmt.name}’s help page on importing redirects`); }
}

function renderFile() {
  const { w, p, head } = fileText();
  part = Math.min(part, p.length - 1);
  $("fileName").title = fileName(part, p.length);   // the title shows it in full when it's cut short
  const nameIn = $("nameIn");
  nameIn.hidden = !!fmt.fixedName;
  if (document.activeElement !== nameIn) nameIn.value = fileBase();
  nameIn.style.width = `calc(${Math.max(4, nameIn.value.length)}ch + 2px)`;   // the 2px is room for the caret   // mono type, so it fits the name exactly
  $("nameEnd").textContent = fmt.fixedName ? fileName(part, p.length) : fileEnd(part, p.length);
  keep();
  $("parts").hidden = p.length < 2;
  if (p.length > 1) {
    $("parts").innerHTML = p.map((_, i) => `<button type="button" data-part="${i}" aria-pressed="${i === part}" aria-label="Part ${i + 1} of ${p.length}">${i + 1}</button>`).join("");
  }
  const headIn = $("headIn");
  $("headRow").hidden = head === null;
  if (head !== null && document.activeElement !== headIn) headIn.value = head;
  const names = head === null ? 0 : head.split(opts.sep).length, off = offDocs(fmt, head, w.header ?? "");
  // Without one, a line says so where it would be, as a warning where the platform's help shows one
  $("headAdd").hidden = fmt.kind !== "csv" || opts.headerOn;
  $("headAdd").classList.toggle("warn", !!off.noHead);
  $("headAddText").textContent = off.noHead || "No header row.";
  const count = head !== null && opts.header !== null && names !== w.cols && `The header has ${names} name${names === 1 ? "" : "s"}; each row has ${w.cols} columns.`;
  $("headWarn").textContent = [count, off.head].filter(Boolean).join(" ");
  $("headWarn").hidden = !$("headWarn").textContent;
  headIn.classList.toggle("warn", !$("headWarn").hidden);
  // Each line of a CSV or lines file carries its sheet row's number, drawn beside it but never copied; a whole-file
  // format (YAML, JSON) has no line per row, so it shows none
  const rowN = new Map(rows.map((r) => [r.id, r.n]));
  const nums = fmt.kind !== "file" && w.body ? p[part].map((x) => rowN.get(x.id) ?? "") : null;
  const shown = nums ? w.body.split("\n").map((l, i) => `<span class="ln" data-n="${nums[i]}">${esc(l)}</span>`).join("") : esc(w.body);
  if ($("fileText").dataset.h !== shown) { $("fileText").innerHTML = shown; $("fileText").dataset.h = shown; }
  // The gutter is as wide as the longest number, in px so the header row above (in another font) lines up too
  const digits = nums ? String(Math.max(...nums.map(Number).filter(Boolean), 1)).length : 0;
  $("fileText").closest(".file-body").style.setProperty("--gut", `${digits * 0.6 * parseFloat(getComputedStyle($("fileText")).fontSize)}px`);
  $("fileText").closest(".file-body").classList.toggle("numbered", !!nums);
  $("fileText").hidden = !w.body;
  $("fileEmpty").hidden = !!w.body;

  // Anything to know before importing it
  showWhere();
  const warn = [fmt.caution,
    ...off.file,
    fmt.needsDomain && !domain() && `${fmt.name} needs the store’s domain on every row: add it under Settings.`,
    fmt.max && result.ready.length > fmt.max && `${fmt.name} takes up to ${fmt.max.toLocaleString("en-GB")} redirects; this has ${result.ready.length.toLocaleString("en-GB")}. Vercel bulk redirects take more.`,
    opts.newAddr === "url" && !result.site && "Add the new site’s address under Settings to write full URLs."].filter(Boolean);
  const info = [picked ? fmt.note : "A plain CSV for now. Pick a platform above for its exact file and its own checks.", p.length > 1 && `${fmt.name} takes ${fmt.limit} redirects per import, so the file is in ${p.length} parts: import each in turn.`].filter(Boolean);
  $("fileWarn").hidden = !warn.length;
  $("fileWarn").textContent = warn.join(" ");
  $("fileInfo").hidden = !info.length;
  $("fileInfo").textContent = info.join(" ");

  // Settings: only the ones this platform has
  const csv = fmt.kind === "csv";
  $("optCode").hidden = !fmt.codes;
  $("codeSeg").querySelector('[data-code=""]').hidden = fmt.codes !== "optional";
  const code = fmt.codes === "optional" && !opts.statusCol ? "" : opts.code;
  for (const b of $("codeSeg").children) b.setAttribute("aria-pressed", b.dataset.code === code);
  for (const b of $("optNew").querySelectorAll("button")) b.setAttribute("aria-pressed", b.dataset.new === opts.newAddr);
  // The site field asks for the new site's address for full URLs, or the store's domain where a platform needs it
  $("optSite").hidden = opts.newAddr !== "url" && !fmt.needsDomain;
  $("optSite").firstElementChild.textContent = opts.newAddr === "url" ? "New site" : fmt.needsDomain || "New site";
  if (document.activeElement !== $("newSite")) { $("newSite").value = opts.newSite; $("newSite").placeholder = result.site || "https://www.example.com"; }
  $("optSep").hidden = !csv;
  if (document.activeElement !== $("sep")) $("sep").value = sepShown(opts.sep);
  const d = defaults(fmt);
  $("resetFmt").hidden = Object.keys(d).every((k) => k === "name" || d[k] === opts[k]);

  // Squarespace's lines are pasted, so Copy is the main action there; with no platform picked, neither is gold
  $("copyBtn").classList.toggle("primary", picked && !!fmt.paste);
  $("downloadBtn").classList.toggle("primary", picked && !fmt.paste);
  // Both buttons name what they take: the file on the right, the part of it on show, or how many of the rows it holds
  // while some still need fixing, so a partial file is never mistaken for the whole sheet. With no platform picked
  // they say it's a plain CSV, so it's never taken for a platform's file
  const inFile = result.ready.length, of = missing && inFile ? `${inFile} of ${inFile + missing}` : "";
  const label = (verb) => p.length > 1 ? `${verb} part ${part + 1}` : !picked ? `${verb} plain CSV${of ? ` (${of})` : ""}` : of ? `${verb} ${of}` : `${verb} file`;
  $("downloadBtn").textContent = label("Download");
  $("copyBtn").textContent = label("Copy");
  $("copyBtn").disabled = $("downloadBtn").disabled = !inFile;
  const one = missing === 1;
  const gone = missing ? `<span class="count">${plural(missing, "row", "rows")}</span> ${one ? "needs" : "need"} fixing before ${one ? "it goes" : "they go"} in the file. <button type="button" class="jsal-btn link" data-needs-you>Fix ${one ? "it" : "them"}</button>` : "";
  if ($("fileMissing").dataset.h !== gone) { $("fileMissing").innerHTML = gone; $("fileMissing").dataset.h = gone; }
  $("fileMissing").hidden = !missing;
  $("fileDoneText").textContent = `All ${plural(inFile, "redirect is", "redirects are")} in the file.`;
  $("fileDone").hidden = !!missing || !inFile;
  $("foldCount").textContent = of ? `${inFile} of ${inFile + missing}` : inFile;
  $("foldRows").textContent = `${(of ? inFile + missing : inFile) === 1 ? "row" : "rows"} in it`;
  $("foldBad").textContent = `${missing} to fix`;
  $("foldBad").hidden = !missing;
}

// ── The file pane's controls ───────────────────────────────────────────────

// "Fix them": the sheet filtered to the rows that need you, with the first of them ready to edit
$("fileMissing").addEventListener("click", (e) => {
  if (!e.target.closest("[data-needs-you]")) return;
  $("filter").querySelector('[data-filter="bad"]').click();
  if (work.dataset.view === "file") $("viewSheet").click();
  const tr = [...tbody.rows].find((x) => !x.hidden);
  (tr?.querySelector('.cell[aria-invalid="true"]') || tr?.querySelector(".cell"))?.focus();
});
$("parts").addEventListener("click", (e) => { const b = e.target.closest("[data-part]"); if (b) { part = +b.dataset.part; renderFile(); } });
$("fmtBtn").addEventListener("click", () => {
  const open = $("fmt").hidden;
  $("fmt").hidden = !open;
  $("fmtBtn").setAttribute("aria-expanded", open);
});
$("resetFmt").addEventListener("click", () => { opts = { ...defaults(fmt), name: opts.name }; update(); });
$("nameIn").addEventListener("input", (e) => { opts.name = cleanName(e.target.value); renderFile(); });
// Leaving the box shows the name the file will have (the default again if it was emptied); Enter leaves it
$("nameIn").addEventListener("blur", (e) => { e.target.value = fileBase(); renderFile(); });
$("nameIn").addEventListener("keydown", (e) => { if (e.key === "Enter") e.target.blur(); });
// A click on the extension still lands in the name, as the box is drawn round both
$("fileName").addEventListener("click", (e) => {
  const n = $("nameIn");
  if (e.target !== n && !n.hidden) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); }
});
$("codeSeg").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  opts.statusCol = b.dataset.code !== "" || fmt.codes === "required";
  if (b.dataset.code) opts.code = b.dataset.code;
  update();
});
$("optNew").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { opts.newAddr = b.dataset.new; update(); } });
// Removing the header row hands focus to the line that adds it back, and the other way round
$("headDel").addEventListener("click", () => { opts.headerOn = false; renderFile(); $("headAddBtn").focus(); });
$("headAddBtn").addEventListener("click", () => { opts.headerOn = true; renderFile(); $("headDel").focus(); });
$("newSite").addEventListener("input", (e) => { opts.newSite = e.target.value; clearTimeout(timer); timer = setTimeout(update, 200); });
$("sep").addEventListener("input", (e) => {
  const v = e.target.value.replace(/\\t/g, "\t");
  if (!v) return;
  if (opts.header !== null) opts.header = opts.header.split(opts.sep).join(v);
  opts.sep = v;
  renderFile();
});
// Typing the header row sets the separator too: whichever of tab, semicolon, comma or pipe it uses
$("headIn").addEventListener("input", (e) => {
  const v = e.target.value;
  opts.header = v;
  const sep = ["\t", ";", ",", "|"].find((s) => v.includes(s));
  if (sep) opts.sep = sep;
  renderFile();
});

function output(action) {
  const { text, p } = fileText();
  window.jsalTrack?.("redirect_file", { platform: picked ? fmt.id : "none", redirects: result.ready.length, action });
  return { text, name: fileName(part, p.length) };
}
$("copyBtn").addEventListener("click", async (e) => {
  const btn = e.currentTarget;   // read before the await, after which it's gone
  try { await navigator.clipboard.writeText(output("copy").text); window.jsalDone?.(btn, "Copied"); }
  catch (err) { $("fileText").focus(); }
});
$("downloadBtn").addEventListener("click", (e) => {
  const { text, name } = output("download");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: fmt.file.endsWith(".json") ? "application/json" : "text/plain;charset=utf-8" }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  window.jsalDone?.(e.currentTarget, "Downloaded");
});

// Hiding the file gives the sheet the width on a laptop screen; the choice is remembered for next time
function fold(on) {
  work.classList.toggle("folded", on);
  store.set("jsal-redirects-folded", on ? "1" : "");
}
// Focus follows to the other button, which takes the place of the one pressed; its ring shows only for the keyboard
// (a click's detail counts the presses, and is 0 from Enter or Space)
$("foldBtn").addEventListener("click", (e) => { fold(true); $("unfoldBtn").focus({ focusVisible: !e.detail }); });
$("unfoldBtn").addEventListener("click", (e) => { fold(false); $("foldBtn").focus({ focusVisible: !e.detail }); });
if (store.get("jsal-redirects-folded") === "1") fold(true);

// Phones show one pane at a time
for (const b of [$("viewSheet"), $("viewFile")]) b.addEventListener("click", () => {
  work.dataset.view = b === $("viewFile") ? "file" : "sheet";
  for (const x of [$("viewSheet"), $("viewFile")]) { x.setAttribute("aria-selected", x === b); x.tabIndex = x === b ? 0 : -1; }
});

// Each pane fills the rest of the first screen, so the page itself doesn't need to scroll while working
function place() { work.style.setProperty("--work-top", `${Math.round(work.getBoundingClientRect().top + scrollY)}px`); }
addEventListener("resize", () => { if (table) place(); });

showWhere();
restore();

const EXAMPLE = `Old URL\tNew URL
https://www.oldsite.com/about-us/\thttps://www.newsite.com/pages/about
http://oldsite.com/blog/spring-sale?utm_source=mail\thttps://www.newsite.com/blogs/news/spring-sale
/our team\t/pages/team
/products/blue–mug\t/products/blue-mug-12oz
/sale\t/collections/sale<2024>
/café-menu\t/pages/menu
/store/mugs\t/collections/mugs
/collections/mugs\t/collections/all-mugs
/about-us\t/pages/our-story
/blog\t
see notes tab\t/pages/faq
/contact\t/contact`;
