// "Save to folder": writes exports straight into a folder the user picked once,
// using the File System Access API (Chrome and Edge; Brave behind a flag;
// not Firefox/Safari). The folder is remembered across visits in IndexedDB —
// browsers only allow storing the handle there, not in localStorage.

export const folderSupported = "showDirectoryPicker" in window;

const DB_NAME = "jscale";
const STORE = "handles";
const KEY = "outputFolder";

function withStore(mode, fn) {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(DB_NAME, 1);
    open.onupgradeneeded = () => open.result.createObjectStore(STORE);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const tx = open.result.transaction(STORE, mode);
      const req = fn(tx.objectStore(STORE));
      tx.oncomplete = () => { open.result.close(); resolve(req?.result); };
      tx.onerror = () => { open.result.close(); reject(tx.error); };
    };
  });
}

export async function savedFolder() {
  if (!folderSupported) return null;
  try { return (await withStore("readonly", s => s.get(KEY))) ?? null; } catch { return null; }
}

// Opens the folder picker. Must run from a click or key press.
export async function pickFolder() {
  const handle = await showDirectoryPicker({ id: "jscale-output", mode: "readwrite" });
  try { await withStore("readwrite", s => s.put(handle, KEY)); } catch {}
  return handle;
}

// Browsers re-ask for write access after a restart. Call this at the start of
// a click handler (it may show a prompt) and before any slow work.
export async function ensureWritable(handle) {
  const opts = { mode: "readwrite" };
  if (await handle.queryPermission(opts) === "granted") return true;
  return (await handle.requestPermission(opts)) === "granted";
}

// A name not yet in the folder: photo.jpg, else photo-2.jpg, photo-3.jpg… Never overwrite, since
// the folder may be the one the originals came from.
async function freeName(handle, name) {
  for (let n = 1; ; n++) {
    const candidate = n === 1 ? name : name.replace(/(\.[^.]+)?$/, `-${n}$1`);
    try {
      await handle.getFileHandle(candidate);
    } catch (err) {
      if (err.name === "NotFoundError") return candidate;
      throw err;
    }
  }
}

// Writes one file into the folder and returns the name it was saved under.
export async function writeToFolder(handle, name, blob) {
  name = await freeName(handle, name);
  const file = await handle.getFileHandle(name, { create: true });
  const out = await file.createWritable();
  try {
    await out.write(blob);
  } finally {
    await out.close();
  }
  return name;
}
