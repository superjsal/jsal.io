// Turns content pasted from Word, Google Docs, a web page or raw HTML code into clean,
// minimal HTML (and a plain-text version).
//
// Pipeline: parse → convert (keep only an allowlist of tags, read bold/italic from
// inline styles, turn Word's fake list paragraphs into list items) → tidy (build
// nested lists, wrap loose text in <p>, merge and trim inline tags, drop empty
// blocks) → run checks → serialize as readable HTML.
//
// It only removes formatting junk. Judgement calls (heading levels, which bold to keep)
// are left to the person editing, and the checks point them out.

const DROP = new Set(["style", "script", "meta", "link", "title", "head", "xml", "template", "noscript",
  "iframe", "object", "embed", "svg", "button", "input", "select", "textarea", "form", "del"]);
const CONTAINERS = new Set(["ul", "ol", "table", "thead", "tbody", "tfoot", "tr", "blockquote"]);
const BLOCKS = new Set(["p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "td", "th", "caption", "pre", ...CONTAINERS]);
const HEADINGS = ["h1", "h2", "h3", "h4", "h5", "h6"];
const INLINE_FORMAT = ["strong", "em", "sup", "sub"];

const SPACE = /[ \t\n\r\f ]+/g;

// Links that only work for the writer: drafts, file shares, local files
const PRIVATE_LINK = /^(file:|https?:\/\/(localhost|127\.0\.0\.1)|https?:\/\/[^/]*(docs\.google\.com|drive\.google\.com|sharepoint\.com|onedrive\.live\.com|1drv\.ms|dropbox\.com\/scl))/i;

// Plain text that is actually HTML code (copied from a code view or a file)
export const looksLikeHtml = (text) => /<\/?(p|h[1-6]|ul|ol|li|a|strong|b|em|i|br|div|span|table|tr|td|blockquote)\b[^>]*>/i.test(text || "");

export function detectSource(html, text) {
  if (!html) return text ? (looksLikeHtml(text) ? "HTML code" : "Plain text") : "";
  if (/docs-internal-guid/.test(html)) return "Google Docs";
  if (/urn:schemas-microsoft-com:office|class="?Mso|mso-/i.test(html)) return "Word";
  return "Web page";
}

/**
 * @param {{html?: string, text?: string}} input  what came off the clipboard (or the editor)
 * @returns {{html: string, text: string, stats: object, checks: {level: string, text: string, fix: boolean, id?: string, find?: (root: Element) => Element[]}[]}}
 */
export function clean(input) {
  const out = document.implementation.createHTMLDocument("");
  const root = out.createElement("div");
  const stats = { googleLinks: 0, fixedLinks: 0, images: 0, comments: 0 };

  // HTML code pasted as text: treat the code as the content
  const html = input.html && input.html.trim() ? input.html : looksLikeHtml(input.text) ? input.text : "";
  if (html) {
    let src = html;
    // Clipboard HTML marks the copied part; anything outside it is wrapper
    const s = src.indexOf("<!--StartFragment-->"), e = src.indexOf("<!--EndFragment-->");
    if (s >= 0 && e > s) src = src.slice(s + 20, e);
    const doc = new DOMParser().parseFromString(src, "text/html");
    const ctx = { out, stats, level: 0, ordered: false };
    for (const n of convertChildren(doc.body, ctx)) root.append(n);
  } else if (input.text && input.text.trim()) {
    // Plain text: every non-empty line is a paragraph
    for (const line of input.text.split(/\r?\n/)) {
      if (!line.trim()) continue;
      const p = out.createElement("p");
      p.textContent = line;
      root.append(p);
    }
  }

  tidy(root, out);
  const checks = runChecks(root, stats);
  return { html: serialize(root).trim(), text: toText(root).trim(), stats, checks, root };
}

// ── Convert ───────────────────────────────────────────────────────────────

function convertChildren(node, ctx) {
  const res = [];
  for (const c of node.childNodes) res.push(...convert(c, ctx));
  return res;
}

function convert(node, ctx) {
  const { out } = ctx;
  if (node.nodeType === 3) return [out.createTextNode(node.data.replace(SPACE, " "))];
  if (node.nodeType !== 1) return [];

  const tag = node.localName;
  if (tag.includes(":") || DROP.has(tag)) return [];   // o:p, v:shape, w:… and friends
  const style = (node.getAttribute("style") || "").toLowerCase();
  const cls = node.getAttribute("class") || "";

  if (/display:\s*none|mso-hide:\s*all/.test(style)) return [];
  if (/mso-list:\s*ignore/.test(style)) return [];   // Word's typed bullet "·" or "1." (we build real lists)
  if (/mso-element:\s*comment/.test(style) || /MsoComment/i.test(cls)) { ctx.stats.comments++; return []; }

  const kids = () => convertChildren(node, ctx);
  const el = (name, children) => { const e = out.createElement(name); e.append(...children); return e; };

  // Word list paragraph: <p style="mso-list:l0 level2 lfo1"><span style="mso-list:Ignore">·</span>Text</p>
  const wordList = style.match(/mso-list:\s*l(\d+)\s+level(\d+)/);
  if (tag === "p" && (wordList || /MsoListParagraph/.test(cls))) {
    const marker = node.querySelector('[style*="mso-list:Ignore" i], [style*="mso-list: Ignore" i]');
    const bullet = marker ? marker.textContent.replace(SPACE, "").trim() : "";
    if (wordList || bullet) {
      return [listItem(out, kids(), wordList ? +wordList[2] : 1, /^\(?([0-9]+|[a-z]|[ivxlcdm]+)[.)]$/i.test(bullet))];
    }
  }

  switch (tag) {
    case "br": return [out.createElement("br")];
    case "img": return image(node, ctx);
    case "a": return link(node, ctx, kids);
    case "b": case "strong":
      return /font-weight:\s*(normal|[1-4]00)/.test(style) ? kids() : [el("strong", styled(kids(), style, out, { bold: false }))];
    case "i": case "em":
      return /font-style:\s*normal/.test(style) ? kids() : [el("em", kids())];
    case "sup": case "sub": return [el(tag, kids())];
    case "h1": case "h2": case "h3": case "h4": case "h5": case "h6":
    case "blockquote": case "pre": case "caption":
      return [el(tag, kids())];
    case "p":
      if (/MsoTitle\b/.test(cls)) return [el("h1", kids())];
      return [el("p", styled(kids(), style, out))];
    case "ul": case "ol": return listChildren(node, ctx, tag === "ol");
    case "li": return liItem(node, ctx, ctx.level || 1, ctx.ordered);
    case "table": case "thead": case "tbody": case "tfoot": case "tr":
      return [el(tag, kids())];
    case "td": case "th": {
      const cell = el(tag, kids());
      for (const a of ["colspan", "rowspan"]) {
        const v = node.getAttribute(a);
        if (v && v !== "1") cell.setAttribute(a, v);
      }
      return [cell];
    }
    case "div":
      if (![...node.querySelectorAll("*")].some((d) => BLOCKS.has(d.localName) || d.localName === "div")) return [el("p", styled(kids(), style, out))];
      return styled(kids(), style, out);
    default:
      // span, font, u, section… keep the content, plus any bold/italic set by style
      return styled(kids(), style, out);
  }
}

// Wrap children in strong/em/sup/sub when an inline style asks for it (Google Docs does everything this way)
function styled(children, style, out, { bold = true } = {}) {
  let res = children;
  const wrap = (name) => { const e = out.createElement(name); e.append(...res); res = [e]; };
  if (/vertical-align:\s*super/.test(style)) wrap("sup");
  else if (/vertical-align:\s*sub/.test(style)) wrap("sub");
  if (/font-style:\s*italic/.test(style)) wrap("em");
  if (bold && /font-weight:\s*(bold|[6-9]00)/.test(style)) wrap("strong");
  return res;
}

function listItem(out, children, level, ordered) {
  const li = out.createElement("li");
  li.dataset.lvl = level;
  li.dataset.ord = ordered ? "1" : "";
  li.append(...children);
  return li;
}

function listChildren(node, ctx, ordered) {
  const inner = { ...ctx, level: (ctx.level || 0) + 1, ordered };
  const res = [];
  for (const c of node.childNodes) {
    if (c.nodeType === 1 && c.localName === "li") res.push(...liItem(c, inner, inner.level, ordered));
    else if (c.nodeType === 1 && (c.localName === "ul" || c.localName === "ol")) res.push(...listChildren(c, inner, c.localName === "ol"));
    else res.push(...convert(c, inner));
  }
  return res;
}

// A real <li>: its own content, followed by any nested list items (built into nested lists later)
function liItem(node, ctx, level, ordered) {
  const aria = parseInt(node.getAttribute("aria-level"), 10);   // Google Docs: flat lists + aria-level
  const lvl = aria > 0 ? aria : level;
  const style = (node.getAttribute("style") || "").toLowerCase();
  const ord = /list-style-type:\s*(decimal|lower|upper)/.test(style) ? true : /list-style-type:\s*(disc|circle|square)/.test(style) ? false : ordered;
  const content = [], nested = [];
  for (const c of node.childNodes) {
    if (c.nodeType === 1 && (c.localName === "ul" || c.localName === "ol")) {
      nested.push(...listChildren(c, { ...ctx, level: lvl }, c.localName === "ol"));
    } else content.push(...convert(c, { ...ctx, level: lvl }));
  }
  return [listItem(ctx.out, styled(content, style, ctx.out), lvl, ord), ...nested];
}

function image(node, ctx) {
  ctx.stats.images++;
  const alt = (node.getAttribute("alt") || "").trim();
  const useful = alt && !/^(picture|image|graphic|figure)\s*\d*$/i.test(alt) && !/^[\w-]+\.(png|jpe?g|gif|webp)$/i.test(alt);
  const p = ctx.out.createElement("p");
  p.dataset.image = "1";
  p.textContent = useful ? `[Image: ${alt}]` : "[Image]";
  return [p];
}

function link(node, ctx, kids) {
  let href = (node.getAttribute("href") || "").trim();
  if (!href) return kids();
  // Google Docs wraps links: https://www.google.com/url?q=REAL&sa=…
  const g = href.match(/^https?:\/\/www\.google\.[a-z.]+\/url\?(.*)$/i);
  if (g) {
    const real = new URLSearchParams(g[1]).get("q");
    if (real) { href = real; ctx.stats.googleLinks++; }
  }
  if (/^www\./i.test(href)) { href = "https://" + href; ctx.stats.fixedLinks++; }
  if (/^(javascript|data|vbscript):/i.test(href)) return kids();
  const a = ctx.out.createElement("a");
  a.setAttribute("href", href);
  a.append(...kids());
  return [a];
}

// ── Tidy ──────────────────────────────────────────────────────────────────

function tidy(root, out) {
  flattenBlocksInInline(root, out);
  liftNestedParagraphs(root, out);
  buildLists(root, out);
  wrapLoose(root, out);
  for (const el of root.querySelectorAll("li, td, th")) flattenParagraphs(el, out);
  for (const b of blocks(root)) tidyInline(b, out);
  removeEmpty(root);
}

// Blocks that ended up inside inline tags (e.g. a heading inside <strong> from a style wrapper):
// lift them out, keeping the formatting on their content
function flattenBlocksInInline(root, out) {
  let changed = true;
  while (changed) {
    changed = false;
    for (const inl of root.querySelectorAll("strong, em, sup, sub, a")) {
      const blockKid = [...inl.children].some((c) => BLOCKS.has(c.localName) || c.querySelector?.(":scope p, :scope li, :scope h1, :scope h2, :scope h3, :scope table"));
      if (!blockKid) continue;
      const frag = out.createDocumentFragment();
      let run = null;
      for (const c of [...inl.childNodes]) {
        if (c.nodeType === 1 && BLOCKS.has(c.localName)) {
          run = null;
          if (!CONTAINERS.has(c.localName)) {
            const w = inl.cloneNode(false);
            w.append(...c.childNodes);
            c.append(w);
          }
          frag.append(c);
        } else {
          if (!run) { run = inl.cloneNode(false); frag.append(run); }
          run.append(c);
        }
      }
      inl.replaceWith(frag);
      changed = true;
      break;
    }
  }
}

// <p>before<p>[Image]</p>after</p> (an image placeholder inside a paragraph) →
// <p>before</p><p>[Image]</p><p>after</p>
function liftNestedParagraphs(root, out) {
  for (const inner of [...root.querySelectorAll(":is(p, h1, h2, h3, h4, h5, h6) p")]) {
    const outer = inner.parentNode.closest("p, h1, h2, h3, h4, h5, h6");
    if (!outer) continue;
    // Split the outer block at the inner one, keeping any formatting tags in between
    const after = outer.cloneNode(false);
    let node = inner;
    while (node !== outer) {
      const parent = node.parentNode;
      const tail = [];
      for (let s = node.nextSibling; s; s = s.nextSibling) tail.push(s);
      if (parent === outer) after.append(...tail);
      else if (tail.length) { const c = parent.cloneNode(false); c.append(...tail); after.prepend(c); }
      node = parent;
    }
    outer.after(inner, after);
  }
}

// Consecutive list items (each tagged with a level) → nested <ul>/<ol>
function buildLists(container, out) {
  const kids = [...container.childNodes];
  for (let i = 0; i < kids.length; i++) {
    const k = kids[i];
    if (!isMarker(k)) {
      if (k.nodeType === 1 && !["ul", "ol"].includes(k.localName)) buildLists(k, out);
      continue;
    }
    const run = [];
    let j = i;
    while (j < kids.length && (isMarker(kids[j]) || isBlankText(kids[j]))) {
      if (isMarker(kids[j])) run.push(kids[j]); else kids[j].remove();
      j++;
    }
    const lists = assemble(run, out);
    run[0].before(...lists);
    for (const m of run) m.remove();
    i = j - 1;
  }
}

const isMarker = (n) => n.nodeType === 1 && n.localName === "li" && "lvl" in n.dataset;
const isBlankText = (n) => n.nodeType === 3 && !n.data.trim();

function assemble(run, out) {
  const roots = [];
  const make = (ord) => out.createElement(ord ? "ol" : "ul");
  let stack = [];
  for (const m of run) {
    const lvl = +m.dataset.lvl || 1, ord = !!m.dataset.ord;
    while (stack.length > 1 && lvl < stack[stack.length - 1].lvl) stack.pop();
    let top = stack[stack.length - 1];
    if (!top || (stack.length === 1 && lvl <= top.lvl && top.list.localName !== (ord ? "ol" : "ul"))) {
      const list = make(ord);
      roots.push(list);
      stack = [{ list, lvl }];
      top = stack[0];
    } else if (lvl > top.lvl) {
      let parent = top.list.lastElementChild;
      if (!parent) { parent = out.createElement("li"); top.list.append(parent); }
      const list = make(ord);
      parent.append(list);
      stack.push({ list, lvl });
      top = stack[stack.length - 1];
    }
    const li = out.createElement("li");
    li.append(...m.childNodes);
    buildLists(li, out);
    top.list.append(li);
  }
  return roots;
}

// Loose text/inline nodes next to blocks → wrapped in <p>
function wrapLoose(container, out) {
  const isRoot = container.localName === "div" || container.localName === "blockquote";
  if (isRoot) {
    let run = null;
    for (const c of [...container.childNodes]) {
      const block = c.nodeType === 1 && BLOCKS.has(c.localName);
      if (block) { run = null; continue; }
      if (!run) {
        if (isBlankText(c)) { c.remove(); continue; }
        run = out.createElement("p");
        c.before(run);
      }
      run.append(c);
    }
  }
  for (const c of container.children) if (["blockquote"].includes(c.localName)) wrapLoose(c, out);
  for (const t of container.querySelectorAll("tr")) for (const c of [...t.childNodes]) if (c.nodeType === 3) c.remove();
  for (const t of container.querySelectorAll("table, thead, tbody, tfoot, ul, ol")) for (const c of [...t.childNodes]) if (isBlankText(c)) c.remove();
}

// <li><p>a</p><p>b</p></li> → <li>a<br>b</li>; same for table cells
function flattenParagraphs(el, out) {
  const ps = [...el.children].filter((c) => c.localName === "p" || HEADINGS.includes(c.localName) && el.localName !== "li");
  ps.forEach((p, i) => {
    const frag = out.createDocumentFragment();
    if (i > 0 && p.previousSibling && !(p.previousSibling.nodeType === 1 && p.previousSibling.localName === "br")) frag.append(out.createElement("br"));
    frag.append(...p.childNodes);
    p.replaceWith(frag);
  });
}

function* blocks(root) {
  for (const el of root.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li, td, th, caption, pre")) yield el;
}

function tidyInline(block, out) {
  if (block.localName === "pre") return;
  if (block.dataset.image) { block.textContent = block.textContent.trim(); return; }   // [Image] notes stay plain
  // Headings are already bold: drop strong inside them
  if (HEADINGS.includes(block.localName)) for (const s of block.querySelectorAll("strong")) s.replaceWith(...s.childNodes);
  // strong inside strong, em inside em…
  for (const name of INLINE_FORMAT) for (const inner of block.querySelectorAll(`${name} ${name}`)) inner.replaceWith(...inner.childNodes);
  // Move spaces at the edges of inline tags outside them: "<strong>Hi </strong>" → "<strong>Hi</strong> "
  for (const inl of [...block.querySelectorAll("strong, em, a, sup, sub")].reverse()) {
    const f = inl.firstChild, l = inl.lastChild;
    if (f && f.nodeType === 3 && /^ /.test(f.data)) { f.data = f.data.replace(/^ +/, ""); inl.before(out.createTextNode(" ")); }
    if (l && l.nodeType === 3 && / $/.test(l.data)) { l.data = l.data.replace(/ +$/, ""); inl.after(out.createTextNode(" ")); }
  }
  // Empty formatting tags
  for (const inl of [...block.querySelectorAll("strong, em, sup, sub")]) if (!inl.textContent.trim() && !inl.querySelector("br")) inl.replaceWith(...inl.childNodes);
  for (const a of [...block.querySelectorAll("a")]) if (!a.textContent.trim()) a.replaceWith(...a.childNodes);
  // Merge neighbours: <strong>a</strong><strong>b</strong> → <strong>ab</strong>
  mergeSiblings(block);
  block.normalize();
  collapseSpaces(block);
  // No <br> at the start or end of a block
  while (block.firstChild && (isBr(block.firstChild) || isBlankText(block.firstChild))) block.firstChild.remove();
  while (block.lastChild && (isBr(block.lastChild) || isBlankText(block.lastChild))) block.lastChild.remove();
}

const isBr = (n) => n.nodeType === 1 && n.localName === "br";

function mergeSiblings(node) {
  for (const c of [...node.childNodes]) if (c.nodeType === 1) mergeSiblings(c);
  let c = node.firstChild;
  while (c) {
    const next = c.nextSibling;
    if (next && c.nodeType === 1 && next.nodeType === 1 && c.localName === next.localName && INLINE_FORMAT.includes(c.localName)) {
      c.append(...next.childNodes);
      next.remove();
      continue;
    }
    // <strong>a</strong> <strong>b</strong> (only a space between) → one tag
    const after = next?.nextSibling;
    if (next && after && c.nodeType === 1 && next.nodeType === 3 && next.data === " " && after.nodeType === 1 &&
        c.localName === after.localName && INLINE_FORMAT.includes(c.localName)) {
      c.append(next, ...after.childNodes);
      after.remove();
      continue;
    }
    c = next;
  }
}

// One space between words across tag boundaries; none at the start/end of the block
function collapseSpaces(block) {
  const walker = block.ownerDocument.createTreeWalker(block, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let prevEndsSpace = true;
  const texts = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (n.nodeType === 1) { if (n.localName === "br") prevEndsSpace = true; continue; }
    let d = n.data.replace(/ {2,}/g, " ");
    if (prevEndsSpace) d = d.replace(/^ /, "");
    n.data = d;
    if (d) { prevEndsSpace = / $/.test(d); texts.push(n); }
    else n.remove();
  }
  // Trailing space before a <br> or at the very end
  for (const t of texts) {
    let next = t.nextSibling, el = t;
    while (!next && el.parentNode && el.parentNode !== block) { el = el.parentNode; next = el.nextSibling; }
    if (!next || isBr(next)) t.data = t.data.replace(/ +$/, "");
  }
  for (const t of texts) if (t.parentNode && !t.data) t.remove();
}

function removeEmpty(root) {
  for (const b of [...root.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li, blockquote, caption")].reverse()) {
    if (!b.textContent.replace(SPACE, "") && !b.querySelector("table, ul, ol")) b.remove();
  }
  for (const l of [...root.querySelectorAll("ul, ol")].reverse()) if (!l.children.length) l.remove();
  for (const t of [...root.querySelectorAll("table")]) if (!t.textContent.replace(SPACE, "")) t.remove();
}

// ── Bold-only lines ───────────────────────────────────────────────────────

// A short paragraph that is entirely bold usually means "the writer wanted a heading"
export function boldOnlyLines(root) {
  return [...root.querySelectorAll(":scope > p")].filter((p) => {
    if (p.dataset.image) return false;
    const text = p.textContent.trim();
    if (!text || text.length > 90 || /[.!?]$/.test(text)) return false;
    const kids = [...p.childNodes].filter((c) => !(c.nodeType === 3 && !c.data.trim()));
    return kids.length === 1 && kids[0].nodeType === 1 && kids[0].localName === "strong";
  });
}

// ── Checks ────────────────────────────────────────────────────────────────

function runChecks(root, stats) {
  const checks = [];
  // fix: something cleaning already fixed (only known on the first clean of a paste).
  // find: the elements a check is about, so the page can point to them. It works on any
  // root, so the same function finds them in the editor too.
  const add = (level, text, { fix = false, id, find } = {}) => checks.push({ level, text, fix, id, find });
  const n = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;
  const links = (r, test) => [...r.querySelectorAll("a")].filter((a) => test.test(a.getAttribute("href") || ""));

  const findH1 = (r) => [...r.querySelectorAll("h1")];
  const h1 = findH1(root).length;
  if (h1) add("warn", `${n(h1, "H1 heading")} in the body. Most CMSs already use the post title as the H1, so change ${h1 === 1 ? "it" : "them"} to H2.`, { id: "h1", find: findH1 });

  // Skipped levels: H2 followed by H4
  const findSkips = (r) => {
    let prev = 0;
    return [...r.querySelectorAll("h1, h2, h3, h4, h5, h6")].filter((h) => {
      const lvl = +h.localName[1], skip = prev && lvl > prev + 1;
      prev = lvl;
      return skip;
    });
  };
  const skipped = findSkips(root).length;
  if (skipped) add("warn", `Heading levels skip ${n(skipped, "time")} (for example H2 straight to H4).`, { id: "skip", find: findSkips });

  const bold = boldOnlyLines(root).length;
  if (bold) {
    const one = bold === 1;
    add("warn", `${n(bold, "line")} ${one ? "is" : "are"} only bold text, and may be meant as ${one ? "a heading" : "headings"}. Change ${one ? "it" : "each"} to H2 or H3.`, { id: "bold", find: boldOnlyLines });
  }

  const findPrivate = (r) => links(r, PRIVATE_LINK);
  const priv = findPrivate(root);
  if (priv.length) add("warn", `${n(priv.length, "link")} ${priv.length === 1 ? "points" : "point"} to a draft, file share or local file: ${priv.slice(0, 3).map((a) => short(a.getAttribute("href"))).join(", ")}${priv.length > 3 ? "…" : ""}`, { id: "private", find: findPrivate });
  const findBookmarks = (r) => links(r, /^#_/);
  const bookmark = findBookmarks(root).length;
  if (bookmark) add("warn", `${n(bookmark, "link")} ${bookmark === 1 ? "jumps" : "jump"} to a Word bookmark (like a table of contents) and won't work on the site.`, { id: "bookmark", find: findBookmarks });
  const findInsecure = (r) => links(r, /^http:\/\//i);
  const insecure = findInsecure(root).length;
  if (insecure) add("info", `${n(insecure, "link")} ${insecure === 1 ? "uses" : "use"} http:// instead of https://.`, { id: "http", find: findInsecure });
  if (stats.googleLinks) add("ok", `Unwrapped ${n(stats.googleLinks, "Google redirect link")} to the real address.`, { fix: true });
  if (stats.fixedLinks) add("ok", `Added https:// to ${n(stats.fixedLinks, "link")} that started with www.`, { fix: true });

  const findImages = (r) => [...r.querySelectorAll("p")].filter((p) => /^\[Image(:|\])/.test(p.textContent.trim()));
  const images = findImages(root).length;
  if (images) add("info", `${n(images, "image")} marked as [Image]. Upload ${images === 1 ? "it" : "them"} in the CMS and add alt text.`, { id: "image", find: findImages });
  if (stats.comments) add("ok", `Removed ${n(stats.comments, "Word comment")}.`, { fix: true });

  const findLong = (r) => [...r.querySelectorAll(":scope > p")].filter((p) => words(p.textContent) > 150);
  const longP = findLong(root).length;
  if (longP) add("info", `${n(longP, "paragraph")} over 150 words. Consider splitting for easier reading.`, { id: "long", find: findLong });

  return checks;
}

const short = (u) => u.replace(/^https?:\/\/(www\.)?/, "").slice(0, 40);
export const words = (t) => (t.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || []).length;

// ── Plain text ────────────────────────────────────────────────────────────

// Blank line between blocks, bullets and numbers for lists, tabs between table cells
function inlineText(node) {
  let s = "";
  for (const c of node.childNodes) {
    if (c.nodeType === 3) s += c.data.replace(/ /g, " ");
    else if (c.localName === "br") s += "\n";
    else if (c.localName !== "ul" && c.localName !== "ol") s += inlineText(c);
  }
  return s;
}

function toText(node, depth = 0) {
  let s = "";
  for (const c of node.children) {
    const tag = c.localName;
    if (tag === "ul" || tag === "ol") s += listText(c, depth) + (depth ? "" : "\n");
    else if (tag === "table") {
      for (const tr of c.querySelectorAll("tr")) s += [...tr.children].map((td) => inlineText(td).replace(/\n/g, " ")).join("\t") + "\n";
      s += "\n";
    } else if (tag === "blockquote") s += toText(c, depth);
    else s += inlineText(c) + "\n\n";
  }
  return s;
}

function listText(list, depth) {
  let s = "", i = 1;
  for (const li of list.children) {
    const mark = list.localName === "ol" ? `${i++}.` : "•";
    s += `${"    ".repeat(depth)}${mark} ${inlineText(li).replace(/\n/g, " ")}\n`;
    for (const sub of li.children) if (sub.localName === "ul" || sub.localName === "ol") s += listText(sub, depth + 1);
  }
  return s;
}

// ── Serialize ─────────────────────────────────────────────────────────────

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/ /g, "&nbsp;");
const escAttr = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

function inline(node) {
  let s = "";
  for (const c of node.childNodes) {
    if (c.nodeType === 3) s += esc(c.data);
    else if (c.nodeType === 1) {
      if (c.localName === "br") s += "<br>";
      else if (c.localName === "ul" || c.localName === "ol") continue;   // nested lists are handled by the caller
      else s += `<${c.localName}${attrs(c)}>${inline(c)}</${c.localName}>`;
    }
  }
  return s;
}

function attrs(el) {
  let s = "";
  for (const name of ["href", "colspan", "rowspan"]) if (el.hasAttribute(name)) s += ` ${name}="${escAttr(el.getAttribute(name))}"`;
  return s;
}

function serialize(node, indent = "") {
  let s = "";
  for (const c of node.children) {
    const tag = c.localName;
    if (CONTAINERS.has(tag)) {
      s += `${indent}<${tag}>\n${serialize(c, indent + "  ")}${indent}</${tag}>\n`;
    } else if (tag === "li") {
      const nested = [...c.children].filter((k) => k.localName === "ul" || k.localName === "ol");
      if (!nested.length) s += `${indent}<li>${inline(c)}</li>\n`;
      else {
        s += `${indent}<li>${inline(c)}\n`;
        for (const l of nested) s += `${indent}  <${l.localName}>\n${serialize(l, indent + "    ")}${indent}  </${l.localName}>\n`;
        s += `${indent}</li>\n`;
      }
    } else {
      s += `${indent}<${tag}${attrs(c)}>${inline(c)}</${tag}>\n`;
    }
  }
  return s;
}
