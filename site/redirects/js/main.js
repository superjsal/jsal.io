// Redirect Import: the sheet, the file beside it and the Format settings. The checks themselves are in core.js.
import { analyse, writeFile, parseDelimited, pickColumns, colLetter, tidy } from "./core.js?v=b22dd6f4";
import { FORMATS, byId } from "./formats.js?v=4f0b460b";

const $ = (id) => document.getElementById(id);
const app = $("app"), work = $("work"), tbody = $("rows");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const store = { get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };

let table = null;        // what was loaded: { raw, name, pick }
let rows = [];           // { id, old, new, old0, new0, added, deleted }
let nextId = 1, keep = {}, filter = "all", part = 0, result = null, cleared = null, used = false;
// Rows worked on since a filter was picked stay on screen, as in a spreadsheet, so a row being fixed under
// "Needs you" doesn't vanish mid-word; picking a filter again applies it afresh
const stay = new Set();
let fmt = byId(store.get("jsal-redirects-platform") || "shopify"), opts = defaults(fmt);

function defaults(f) {
  return { code: "301", newAddr: "path", newSite: "", headerOn: f.kind === "csv" && !f.headerOff, sep: ",", header: null, statusCol: f.codes === "required" };
}
const sepName = (s) => ({ ",": "Comma", ";": "Semicolon", "\t": "Tab", "|": "Pipe" })[s] || `“${s}”`;
const sepShown = (s) => s.replace(/\t/g, "\\t");

// ── Platforms ──────────────────────────────────────────────────────────────

const groups = [...new Set(FORMATS.map((f) => f.group))];
$("platform").innerHTML = groups.map((g) => `<optgroup label="${esc(g)}">${FORMATS.filter((f) => f.group === g)
  .map((f) => `<option value="${f.id}">${esc(f.name)}</option>`).join("")}</optgroup>`).join("");
$("platform").value = fmt.id;
$("platform").addEventListener("change", (e) => {
  fmt = byId(e.target.value); opts = defaults(fmt); part = 0;
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
  rows = raw.slice(pick.header ? 1 : 0).map((r) => row(r[pick.o], r[pick.n]));
  keep = {}; part = 0;
  const label = (i) => `${colLetter(i)}${pick.names[i] ? ": " + pick.names[i] : ""}`;
  $("cols").hidden = pick.width < 3;
  for (const [sel, at] of [[$("colOld"), pick.o], [$("colNew"), pick.n]]) {
    sel.innerHTML = Array.from({ length: pick.width }, (_, i) => `<option value="${i}">${esc(label(i))}</option>`).join("");
    sel.value = at;
  }
  show();
}
function row(o = "", n = "", added = false) {
  o = tidy(o); n = tidy(n);
  const r = { id: nextId++, old: o, new: n, old0: o, new0: n, added };
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
  rows.forEach((r) => all.append(rowEl(r)));
  tbody.append(all);
  if (!used) { used = true; window.jsalUsed?.(); }
  place();
  update();
}
function showError(text) { const e = $("dropError"); e.textContent = text; e.hidden = false; }

async function readFile(file) {
  const name = file.name || "";
  if (/\.(xls|numbers|ods)$/i.test(name)) return showError(`${name} can’t be read here. Save it as .xlsx or CSV and try again.`);
  try {
    if (/\.xlsx$/i.test(name)) {
      const { readXlsx } = await import("./xlsx.js?v=8b577352");
      const book = await readXlsx(await file.arrayBuffer());
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

$("pickFile").addEventListener("click", () => $("fileInput").click());
$("otherFile").addEventListener("click", () => $("fileInput").click());
$("fileInput").addEventListener("change", (e) => { const f = e.target.files[0]; e.target.value = ""; if (f) readFile(f); });
$("blankSheet").addEventListener("click", () => {
  table = { raw: [], name: "", pick: { o: 0, n: 1, header: false, width: 2, names: [] } };
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
    if (!/[\t\n]/.test(text.trim())) return;
    e.preventDefault();
    return spread(cell, parseDelimited(text));
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
    if (startCol === "old") { r.old = tidy(vals[0]); if (vals.length > 1) r.new = tidy(vals[1]); }
    else r.new = tidy(vals[0]);
    stay.add(r.id);
    const tr = rowOf(r);
    tr.querySelector('[data-cell="old"]').value = r.old;
    tr.querySelector('[data-cell="new"]').value = r.new;
    at++;
  }
  update();
}

// ── The sheet ──────────────────────────────────────────────────────────────

const rowOf = (r) => r.el;
const byRowId = (tr) => rows.find((r) => r.id === +tr.dataset.id);
function rowEl(r) {
  const tr = document.createElement("tr");
  tr.dataset.id = r.id;
  tr.innerHTML = `<td class="n"></td><td class="st"><span class="dot"></span></td>
    <td class="o" data-label="Old address"><input class="cell" data-cell="old" spellcheck="false" autocomplete="off" aria-describedby="ro${r.id}"><div class="notes" id="ro${r.id}"></div></td>
    <td class="nw" data-label="New address"><input class="cell" data-cell="new" spellcheck="false" autocomplete="off" aria-describedby="rn${r.id}"><div class="notes" id="rn${r.id}"></div></td>
    <td class="x"><button type="button" class="del" data-del><span aria-hidden="true">×</span></button></td>`;
  tr.querySelector('[data-cell="old"]').value = r.old;
  tr.querySelector('[data-cell="new"]').value = r.new;
  r.el = tr;
  return tr;
}

let timer = 0;
tbody.addEventListener("input", (e) => {
  const cell = e.target.closest(".cell");
  if (!cell) return;
  const r = byRowId(cell.closest("tr"));
  r[cell.dataset.cell] = cell.value;
  stay.add(r.id);
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
  if (b.dataset.fix) {
    const [cell, ni, fi] = b.dataset.fix.split(":");
    const note = it.notes.filter((x) => x.cell === cell[0])[+ni];
    const field = cell === "o" ? "old" : "new";
    r[field] = note.fixes[+fi][1](r[field]);
    tr.querySelector(`[data-cell="${field}"]`).value = r[field];
  } else if (b.dataset.undo) {
    const field = b.dataset.undo;
    r[field] = r[field + "0"];
    tr.querySelector(`[data-cell="${field}"]`).value = r[field];
  } else if (b.hasAttribute("data-keep")) keep[it.clash.key] = r.id;
  else if (b.hasAttribute("data-unkeep")) delete keep[it.clash.key];
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
  for (const r of rows) { r.old = r.old0; r.new = r.new0; r.deleted = false; }
  keep = {};
  show();
});
$("clearBtn").addEventListener("click", () => {
  cleared = { table, rows, keep };
  table = null; rows = []; tbody.innerHTML = "";
  app.classList.remove("has-content");
  $("undoClear").hidden = $("undoSep").hidden = false;
  $("drop").focus();
});
function undoClear() {
  ({ table, rows, keep } = cleared);
  cleared = null;
  $("undoClear").hidden = $("undoSep").hidden = true;
  show();
}

for (const b of $("filter").children) b.addEventListener("click", () => {
  filter = b.dataset.filter;
  stay.clear();
  for (const x of $("filter").children) x.setAttribute("aria-pressed", x === b);
  update();
});

// The notes under one cell: what's wrong and its fixes, what the file does with it, a clash's choice, and Undo
function notesHtml(r, it, cell) {
  const field = cell === "o" ? "old" : "new";
  let h = it.notes.filter((x) => x.cell === cell).map((x, i) => `<p class="note ${x.kind}">${x.text}</p>` + (x.fixes?.length
    ? `<div class="fixes">${x.fixes.map(([label, f], j) => `<button type="button" class="jsal-btn small" data-fix="${cell}:${i}:${j}">${esc(label)}: ${esc(f(r[field]))}</button>`).join("")}</div>` : "")).join("");
  if (cell === "o" && it.clash) {
    if (!it.clash.kept) h += `<div class="fixes"><button type="button" class="jsal-btn small" data-keep>Keep this row (to ${esc(it.clash.to)})</button></div>`;
    else if (it.clash.kept === r.id) h += `<p class="note edited"><button type="button" class="jsal-btn link" data-unkeep>Choose again</button></p>`;
    else h += `<div class="fixes"><button type="button" class="jsal-btn small" data-keep>Keep this one instead</button></div>`;
  }
  if (!r.added && r[field] !== r[field + "0"]) h += `<p class="note edited">Edited · <button type="button" class="jsal-btn link" data-undo="${field}">Undo</button></p>`;
  return h;
}

const SAY = { ok: ["✓", "Ready"], fixed: ["↻", "Fixed for the file"], bad: ["!", "Needs you"], out: ["–", "Left out"], blank: ["", "Empty"] };

// ── Everything that follows a change ───────────────────────────────────────

function update() {
  if (!table) return;
  const live = rows.filter((r) => !r.deleted);
  result = analyse(live, fmt, { ...opts, keep });
  const count = { all: 0, bad: 0, fixed: 0, out: 0 };
  live.forEach((r, i) => {
    const it = result.items.get(r.id), tr = rowOf(r);
    if (!tr) return;
    const st = it.state;
    if (st !== "blank") { count.all++; if (count[st] !== undefined) count[st]++; }
    // A long sheet redraws only the rows whose state, number, notes or visibility changed
    const html = { o: notesHtml(r, it, "o"), n: notesHtml(r, it, "n") };
    const shown = filter === "all" || st === filter || stay.has(r.id);
    const sig = `${st}|${i}|${shown}|${html.o}|${html.n}`;
    if (tr.dataset.sig === sig) return;
    tr.dataset.sig = sig;
    tr.className = st;
    tr.hidden = !shown;
    tr.querySelector(".n").textContent = i + 1;
    const dot = tr.querySelector(".dot");
    dot.className = "dot " + st;
    dot.innerHTML = `<span aria-hidden="true">${SAY[st][0]}</span><span class="sr-only">${SAY[st][1]}</span>`;
    tr.querySelector(".del").setAttribute("aria-label", `Delete row ${i + 1}`);
    for (const [cell, field, label] of [["o", "old", "Old address"], ["n", "new", "New address"]]) {
      const input = tr.querySelector(`[data-cell="${field}"]`);
      input.setAttribute("aria-label", `${label}, row ${i + 1}`);
      input.setAttribute("aria-invalid", it.notes.some((x) => x.cell === cell && x.kind === "bad"));
      const box = tr.querySelector(`#r${cell}${r.id}`);
      if (box.dataset.h !== html[cell]) { box.innerHTML = html[cell]; box.dataset.h = html[cell]; }
    }
  });
  const ready = result.ready.length;
  for (const b of $("filter").children) b.querySelector("span").textContent = count[b.dataset.filter];
  $("filterEmpty").hidden = live.some((r) => !r.el.hidden);
  $("summary").innerHTML = `<b>${ready} ready</b>` + (count.bad ? ` · ${count.bad} need you` : "") + (count.out ? ` · ${count.out} left out` : "");
  $("sheetMeta").textContent = [table.name, `${count.all} row${count.all === 1 ? "" : "s"}`, table.pick.header && "headings skipped"].filter(Boolean).join(" · ");
  $("undoAll").hidden = !rows.some((r) => r.added || r.deleted || r.old !== r.old0 || r.new !== r.new0);
  renderFile();
}

function parts() {
  const all = result.ready;
  if (!fmt.limit || all.length <= fmt.limit) return [all];
  return Array.from({ length: Math.ceil(all.length / fmt.limit) }, (_, i) => all.slice(i * fmt.limit, (i + 1) * fmt.limit));
}
function fileName(i, total) {
  return total > 1 ? fmt.file.replace(/(\.[^.]*)?$/, (ext) => `-part-${i + 1}${ext}`) : fmt.file;
}
function fileText() {
  const p = parts(), w = writeFile(p[Math.min(part, p.length - 1)], fmt, opts);
  const head = fmt.kind === "csv" && opts.headerOn ? (opts.header ?? w.header) : null;
  return { w, p, head, text: (head !== null ? head + "\n" : "") + w.body + (w.body ? "\n" : "") };
}

function showWhere() {
  $("where").textContent = fmt.where + ".";
  $("whereDoc").hidden = !fmt.doc;
  if (fmt.doc) $("whereDoc").href = fmt.doc;
}

function renderFile() {
  const { w, p, head } = fileText();
  part = Math.min(part, p.length - 1);
  $("fileName").textContent = fileName(part, p.length);
  $("parts").hidden = p.length < 2;
  if (p.length > 1) {
    $("parts").innerHTML = p.map((_, i) => `<button type="button" data-part="${i}" aria-pressed="${i === part}" aria-label="Part ${i + 1} of ${p.length}">${i + 1}</button>`).join("");
  }
  const headIn = $("headIn");
  headIn.hidden = head === null;
  if (head !== null && document.activeElement !== headIn) headIn.value = head;
  const names = head === null ? 0 : head.split(opts.sep).length;
  $("headWarn").hidden = head === null || opts.header === null || names === w.cols;
  $("headWarn").textContent = `The header has ${names} name${names === 1 ? "" : "s"}; each row has ${w.cols} columns.`;
  $("fileText").textContent = w.body;
  $("fileText").hidden = !w.body;
  $("fileEmpty").hidden = !!w.body;

  // Anything to know before importing it
  showWhere();
  const notes = [];
  if (fmt.unverified && opts.header === null && opts.headerOn) notes.push(`This header row comes from guides, not ${fmt.name}’s own template. Check it against theirs before a large import.`);
  if (opts.newAddr === "url" && !result.site) notes.push("Add the new site’s address in Format to write full URLs.");
  if (p.length > 1) notes.push(`${fmt.name} takes ${fmt.limit} redirects per import, so the file is in ${p.length} parts.`);
  $("fileNote").hidden = !notes.length;
  $("fileNote").textContent = notes.join(" ");

  // Format: only the settings this platform has
  const csv = fmt.kind === "csv";
  $("optCode").hidden = !fmt.codes;
  $("codeSeg").querySelector('[data-code=""]').hidden = fmt.codes !== "optional";
  const code = fmt.codes === "optional" && !opts.statusCol ? "" : opts.code;
  for (const b of $("codeSeg").children) b.setAttribute("aria-pressed", b.dataset.code === code);
  for (const b of $("optNew").querySelectorAll("button")) b.setAttribute("aria-pressed", b.dataset.new === opts.newAddr);
  $("optSite").hidden = opts.newAddr !== "url";
  if (document.activeElement !== $("newSite")) { $("newSite").value = opts.newSite; $("newSite").placeholder = result.site || "https://www.example.com"; }
  $("optHead").hidden = $("optSep").hidden = !csv;
  for (const b of $("optHead").querySelectorAll("button")) b.setAttribute("aria-pressed", (b.dataset.head === "on") === opts.headerOn);
  if (document.activeElement !== $("sep")) $("sep").value = sepShown(opts.sep);
  $("fmtSummary").textContent = [csv && sepName(opts.sep), opts.newAddr === "url" ? "full URLs" : "paths", (fmt.codes === "required" || (fmt.codes && opts.statusCol)) && opts.code, csv && !opts.headerOn && "no header"].filter(Boolean).join(" · ");
  const d = defaults(fmt);
  $("resetFmt").hidden = Object.keys(d).every((k) => d[k] === opts[k]);

  // Squarespace's lines are pasted, so Copy is the main action there
  $("copyBtn").classList.toggle("primary", !!fmt.paste);
  $("downloadBtn").classList.toggle("primary", !fmt.paste);
  $("downloadBtn").textContent = p.length > 1 ? `Download part ${part + 1}` : "Download";
  $("copyBtn").disabled = $("downloadBtn").disabled = !result.ready.length;
}

// ── The file pane's controls ───────────────────────────────────────────────

$("parts").addEventListener("click", (e) => { const b = e.target.closest("[data-part]"); if (b) { part = +b.dataset.part; renderFile(); } });
$("fmtBtn").addEventListener("click", () => {
  const open = $("fmt").hidden;
  $("fmt").hidden = !open;
  $("fmtBtn").setAttribute("aria-expanded", open);
});
$("resetFmt").addEventListener("click", () => { opts = defaults(fmt); update(); });
$("codeSeg").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  opts.statusCol = b.dataset.code !== "" || fmt.codes === "required";
  if (b.dataset.code) opts.code = b.dataset.code;
  update();
});
$("optNew").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { opts.newAddr = b.dataset.new; update(); } });
$("optHead").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { opts.headerOn = b.dataset.head === "on"; renderFile(); } });
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
  window.jsalTrack?.("redirect_file", { platform: fmt.id, redirects: result.ready.length, action });
  return { text, name: fileName(part, p.length) };
}
$("copyBtn").addEventListener("click", async (e) => {
  try { await navigator.clipboard.writeText(output("copy").text); window.jsalDone?.(e.currentTarget, "Copied"); }
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

// Phones show one pane at a time
for (const b of [$("viewSheet"), $("viewFile")]) b.addEventListener("click", () => {
  work.dataset.view = b === $("viewFile") ? "file" : "sheet";
  for (const x of [$("viewSheet"), $("viewFile")]) { x.setAttribute("aria-selected", x === b); x.tabIndex = x === b ? 0 : -1; }
});

// Each pane fills the rest of the first screen, so the page itself doesn't need to scroll while working
function place() { work.style.setProperty("--work-top", `${Math.round(work.getBoundingClientRect().top + scrollY)}px`); }
addEventListener("resize", () => { if (table) place(); });

showWhere();

const EXAMPLE = `Old URL\tNew URL
https://www.oldsite.com/about-us/\thttps://www.newsite.com/pages/about
http://oldsite.com/blog/spring-sale?utm_source=mail\thttps://www.newsite.com/blogs/news/spring-sale
/our team\t/pages/team
/products/blue–mug\t/products/blue-mug-12oz
/sale\t/collections/sale<2024>
/café-menu\t/pages/menu
/shop/mugs\t/collections/mugs
/collections/mugs\t/collections/all-mugs
/about-us\t/pages/our-story
/blog\t
see notes tab\t/pages/faq
/contact\t/contact`;
