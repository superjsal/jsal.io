// jsal.io's only server code: /api/redirect-check, behind Redirect Import's "Check live redirects". Every other
// address is a plain file from the build: wrangler.jsonc sends only /api/* here (run_worker_first), the rest goes
// straight to the static assets.
//
// It visits the old addresses a visitor sends, follows each redirect itself and returns only the status codes and
// where each hop points, never a page's content, so it can't be used to read other sites. Guards: jsal.io pages only
// (Origin), http(s) on public hostnames only, one site per request, a few addresses at a time, a per-visitor rate
// limit (the CHECK_LIMIT binding, when present), and nothing is stored or logged.

const MAX_URLS = 8;        // per request: 8 × (5 redirects + the final page) stays within Workers Free's 50 requests
const MAX_HOPS = 5;
const AT_ONCE = 4;         // requests to the checked site at the same time
const TIMEOUT = 8000;      // ms per request
const UA = "jsal.io redirect checker (+https://jsal.io/redirects/)";
// jsal.io, its workers.dev address and branch previews, and a local build
const ORIGINS = /^https:\/\/(jsal\.io|(?:[a-z0-9-]+-)?jsal-io\.still-cell-826b\.workers\.dev)$|^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/redirect-check") return check(request, env);
    return env.ASSETS.fetch(request);
  },
};

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" },
});

async function check(request, env) {
  if (request.method !== "POST") return json({ error: "POST only" }, 405);
  if (!ORIGINS.test(request.headers.get("origin") || "")) return json({ error: "only from jsal.io" }, 403);
  if (env.CHECK_LIMIT) {
    const { success } = await env.CHECK_LIMIT.limit({ key: request.headers.get("cf-connecting-ip") || "unknown" });
    if (!success) return json({ error: "busy" }, 429);
  }
  let body;
  try { body = await request.json(); } catch (e) { return json({ error: "not JSON" }, 400); }
  const urls = Array.isArray(body && body.urls) ? body.urls : [];
  if (!urls.length || urls.length > MAX_URLS || !urls.every((u) => typeof u === "string" && u.length <= 2048)) {
    return json({ error: `send 1 to ${MAX_URLS} addresses` }, 400);
  }
  // One site per request: the addresses of one sheet
  const hosts = new Set(urls.map((u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch (e) { return ""; } }));
  if (hosts.size !== 1 || hosts.has("")) return json({ error: "one site per request" }, 400);

  const results = new Array(urls.length);
  let next = 0;
  const worker = async () => { while (next < urls.length) { const i = next++; results[i] = { url: urls[i], ...(await follow(urls[i])) }; } };
  await Promise.all(Array.from({ length: Math.min(AT_ONCE, urls.length) }, worker));
  return json({ results });
}

// A public web address: http(s), a real domain name (not an IP, not localhost or a local name), the standard port
function allowed(u) {
  let x;
  try { x = new URL(u); } catch (e) { return false; }
  if (!/^https?:$/.test(x.protocol) || x.username || x.password || (x.port && x.port !== "80" && x.port !== "443")) return false;
  const h = x.hostname.toLowerCase();
  return h.includes(".") && !h.startsWith("[") && !/^[\d.]+$/.test(h) && !/(^|\.)(localhost|local|internal|lan|home|test|invalid|example|onion)$/.test(h);
}

// Every hop from an address: { hops: [{ url, status, location? }] }, plus loop: true or error when it stops early
async function follow(start) {
  const hops = [];
  let url = start;
  for (let i = 0; i <= MAX_HOPS; i++) {
    if (!allowed(url)) return { hops, error: hops.length ? "redirects to an address that can’t be checked" : "not a public web address" };
    let res;
    try {
      res = await fetch(url, { method: "GET", redirect: "manual", headers: { "user-agent": UA, accept: "text/html,*/*;q=0.8" }, signal: AbortSignal.timeout(TIMEOUT) });
    } catch (e) {
      return { hops, error: e && e.name === "TimeoutError" ? "the site didn’t answer in time" : "the site couldn’t be reached" };
    }
    const location = res.headers.get("location");
    if (res.body) await res.body.cancel();   // only the status and headers are needed
    if (res.status >= 300 && res.status < 400 && location) {
      let to;
      try { to = new URL(location, url).href; } catch (e) { hops.push({ url, status: res.status, location }); return { hops, error: "a redirect to an address that isn’t one" }; }
      hops.push({ url, status: res.status, location: to });
      if (to === url || hops.some((h) => h.url === to)) return { hops, loop: true };
      url = to;
      continue;
    }
    hops.push({ url, status: res.status });
    return { hops };
  }
  return { hops, error: "too many hops" };
}
