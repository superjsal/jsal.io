// Reads the first sheet of an Excel (.xlsx) file in the browser. An .xlsx file is a zip of XML files: the zip is
// opened with the browser's own decompression, then the sheet's cells are read as text.

const u16 = (b, i) => b[i] | (b[i + 1] << 8);
const u32 = (b, i) => (b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24)) >>> 0;

async function inflate(data) {
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

// The zip's table of contents sits at its end; each entry points back to its compressed data
function entries(b) {
  let end = b.length - 22;
  while (end >= 0 && u32(b, end) !== 0x06054b50) end--;
  if (end < 0) throw new Error("not a zip");
  const list = new Map();
  let p = u32(b, end + 16);
  for (let n = u16(b, end + 10); n > 0; n--) {
    if (u32(b, p) !== 0x02014b50) break;
    const nameLen = u16(b, p + 28), extra = u16(b, p + 30), comment = u16(b, p + 32);
    const name = new TextDecoder().decode(b.subarray(p + 46, p + 46 + nameLen));
    list.set(name, { method: u16(b, p + 10), size: u32(b, p + 20), at: u32(b, p + 42) });
    p += 46 + nameLen + extra + comment;
  }
  return list;
}

async function readEntry(b, list, name) {
  const e = list.get(name);
  if (!e) return null;
  const start = e.at + 30 + u16(b, e.at + 26) + u16(b, e.at + 28);
  const data = b.subarray(start, start + e.size);
  return new TextDecoder().decode(e.method === 8 ? await inflate(data) : data);
}

const xml = (text) => new DOMParser().parseFromString(text, "application/xml");
const all = (node, tag) => [...node.getElementsByTagNameNS("*", tag)];
// Shared strings can be split into formatted runs; phonetic hints (rPh) aren't part of the text
const textOf = (node) => all(node, "t").filter((t) => t.parentNode.localName !== "rPh").map((t) => t.textContent).join("");
const colIndex = (ref) => [...ref.replace(/\d+$/, "")].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1;

/** Returns { name, rows } for the workbook's first sheet. */
export async function readXlsx(buffer) {
  const b = new Uint8Array(buffer);
  const list = entries(b);
  const book = xml(await readEntry(b, list, "xl/workbook.xml"));
  const sheet = all(book, "sheet")[0];
  const rid = sheet.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id") || sheet.getAttribute("r:id");
  const rels = xml(await readEntry(b, list, "xl/_rels/workbook.xml.rels"));
  let target = all(rels, "Relationship").find((r) => r.getAttribute("Id") === rid).getAttribute("Target");
  target = target.startsWith("/") ? target.slice(1) : "xl/" + target;

  const sharedText = await readEntry(b, list, "xl/sharedStrings.xml");
  const shared = sharedText ? all(xml(sharedText), "si").map(textOf) : [];
  const rows = [];
  for (const row of all(xml(await readEntry(b, list, target)), "row")) {
    const cells = [];
    all(row, "c").forEach((c, i) => {
      const at = c.getAttribute("r") ? colIndex(c.getAttribute("r")) : i;
      const v = all(c, "v")[0]?.textContent ?? "";
      const type = c.getAttribute("t");
      cells[at] = type === "s" ? shared[+v] ?? "" : type === "inlineStr" ? textOf(c) : v;
    });
    const r = Number(row.getAttribute("r")) - 1;
    rows[Number.isInteger(r) && r >= 0 ? r : rows.length] = Array.from(cells, (x) => x ?? "");
  }
  return { name: sheet.getAttribute("name") || "", rows: Array.from(rows, (r) => r || []) };
}
