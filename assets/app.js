// أحمر — store.ah-mar.app
// No framework, no SDK: a few REST calls to the same Appwrite project the app
// uses, so the account, the library and the payments are all shared.

export const CFG = {
  endpoint: "https://backend.ah-mar.app/v1",
  project: "6966d5030009343737c1",
  db: "68b4bcf9001027235773",
  libraryTable: "user_library_table",
  checkoutFunction: "store-checkout",
  coverBucket: "68b7621800212a5fa3a8",
  cacheUrl: "https://backend.ah-mar.app/v1/storage/buckets/store_cache/files/store_cache_v1/view?project=6966d5030009343737c1",
  appLink: "https://link.ah-mar.app",
};

/* ------------------------------------------------------------------ */
/* Appwrite REST                                                        */
/* ------------------------------------------------------------------ */

const FALLBACK_KEY = "ahmar_fallback_cookies";

function store(key, value) {
  try {
    if (value === undefined) return localStorage.getItem(key);
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch { /* private mode: cookies still work */ }
  return null;
}

export class ApiError extends Error {
  constructor(message, code, type) { super(message); this.code = code; this.type = type; }
}

export async function api(path, { method = "GET", body, query } = {}) {
  const url = new URL(CFG.endpoint + path);
  if (query) for (const [k, v] of Object.entries(query)) {
    if (Array.isArray(v)) v.forEach((item) => url.searchParams.append(k + "[]", item));
    else url.searchParams.set(k, v);
  }
  const headers = { "X-Appwrite-Project": CFG.project, "Content-Type": "application/json" };
  // Browsers that block the session cookie get it back as a header instead.
  const fallback = store(FALLBACK_KEY);
  if (fallback) headers["X-Fallback-Cookies"] = fallback;

  const res = await fetch(url, {
    method, headers, credentials: "include",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const fb = res.headers.get("X-Fallback-Cookies");
  if (fb) store(FALLBACK_KEY, fb);

  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new ApiError(data.message || res.statusText, res.status, data.type);
  return data;
}

const q = (method, attribute, values) => JSON.stringify({ method, attribute, values });

/* ------------------------------------------------------------------ */
/* Account                                                              */
/* ------------------------------------------------------------------ */

let userPromise;
export function getUser(force = false) {
  if (!userPromise || force) userPromise = api("/account").catch(() => null);
  return userPromise;
}

export function signInWithGoogle(returnTo = location.href) {
  const failure = new URL("/account.html", location.origin);
  failure.searchParams.set("error", "oauth");
  failure.searchParams.set("next", returnTo);
  const url = new URL(CFG.endpoint + "/account/sessions/oauth2/google");
  url.searchParams.set("project", CFG.project);
  url.searchParams.set("success", returnTo);
  url.searchParams.set("failure", failure.toString());
  location.href = url.toString();
}

/** Sends a 6-digit code. Returns the userId the code belongs to. */
export async function sendEmailCode(email) {
  const token = await api("/account/tokens/email", {
    method: "POST", body: { userId: "unique()", email },
  });
  return token.userId;
}

export async function verifyEmailCode(userId, secret) {
  await api("/account/sessions/token", { method: "POST", body: { userId, secret } });
  return getUser(true);
}

export async function signOut() {
  try { await api("/account/sessions/current", { method: "DELETE" }); } catch {}
  store(FALLBACK_KEY, null);
  userPromise = Promise.resolve(null);
}

/* ------------------------------------------------------------------ */
/* Catalogue & library                                                  */
/* ------------------------------------------------------------------ */

let catalogPromise;
export function getCatalog() {
  if (!catalogPromise) {
    // The cache is regenerated every few minutes; one fetch per 5-minute
    // window keeps it fresh and lets the edge cache serve everyone else.
    const bucket = Math.floor(Date.now() / 300000);
    catalogPromise = fetch(`${CFG.cacheUrl}&t=${bucket}`)
      .then((r) => { if (!r.ok) throw new Error("catalog"); return r.json(); })
      .then((d) => ({
        books: (d.books || []).map(normalizeBook),
        categories: d.categories || [],
      }));
  }
  return catalogPromise;
}

function normalizeBook(b) {
  return {
    id: b.$id,
    title: (b.title || "").trim(),
    description: (b.description || "").trim(),
    cover: b.cover,
    price: Math.round(Number(b.price) || 0),
    pages: Number(b.page_count) || 0,
    isbn: b.isbn_number || "",
    author: b.author && typeof b.author === "object" ? b.author.name : "",
    category: b.category && typeof b.category === "object" ? b.category : null,
    createdAt: b.$createdAt,
  };
}

export async function getOwnedIds(user) {
  if (!user) return new Set();
  try {
    const res = await api(`/databases/${CFG.db}/collections/${CFG.libraryTable}/documents`, {
      query: { queries: [q("equal", "user_id", [user.$id]), JSON.stringify({ method: "select", values: ["$id", "books.$id"] }), JSON.stringify({ method: "limit", values: [1] })] },
    });
    const doc = res.documents && res.documents[0];
    const ids = (doc?.books || []).map((b) => (typeof b === "string" ? b : b.$id));
    return new Set(ids);
  } catch {
    return new Set();
  }
}

/** Asks the server to start a purchase. Prices are never sent from here. */
export async function startCheckout(bookIds, method) {
  const exec = await api(`/functions/${CFG.checkoutFunction}/executions`, {
    method: "POST",
    body: { body: JSON.stringify({ books: bookIds, method }), async: false, method: "POST", path: "/" },
  });
  let data = {};
  try { data = JSON.parse(exec.responseBody || "{}"); } catch {}
  if (exec.responseStatusCode >= 400 || !data.success) {
    throw new ApiError(data.error || "server", exec.responseStatusCode || 500, data.error);
  }
  return data;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

export function coverUrl(fileId, width = 400) {
  if (!fileId) return "";
  return `${CFG.endpoint}/storage/buckets/${CFG.coverBucket}/files/${fileId}/preview?project=${CFG.project}&width=${width}&quality=82&output=webp`;
}

export const bookUrl = (id) => `/book.html?id=${encodeURIComponent(id)}`;
export const openInAppUrl = (bookId) => (bookId ? `${CFG.appLink}/b/${encodeURIComponent(bookId)}` : CFG.appLink);

const nf = new Intl.NumberFormat("ar-DZ");
export function formatPrice(dzd) {
  return dzd > 0 ? `${nf.format(dzd)} دج` : "مجاني";
}

export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function toast(message) {
  let el = document.querySelector(".toast");
  if (!el) { el = document.createElement("div"); el.className = "toast"; el.setAttribute("role", "status"); document.body.append(el); }
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 3200);
}

export const ICON = {
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
  google: '<svg viewBox="0 0 24 24"><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z"/><path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8z"/><path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.8 3.6-4.9 6.7-4.9z"/></svg>',
};

/* ------------------------------------------------------------------ */
/* Shared header & footer                                               */
/* ------------------------------------------------------------------ */

export async function mountLayout() {
  const top = document.getElementById("top");
  if (top) {
    top.className = "top";
    top.innerHTML = `<div class="wrap">
      <a class="brand" href="/"><img src="/assets/logo-192.png" alt="" width="36" height="36"><div>أحمر<small>المتجر</small></div></a>
      <div class="spacer"></div>
      <a id="nav-user" class="btn btn-ghost btn-sm" href="/account.html">تسجيل الدخول</a>
    </div>`;
    getUser().then((user) => {
      if (!user) return;
      const nav = document.getElementById("nav-user");
      const name = user.name || user.email || "حسابي";
      nav.outerHTML = `<a class="user-chip" href="/account.html" title="مكتبتي"><span class="avatar">${esc(name.trim()[0] || "؟")}</span><span>${esc(name)}</span></a>`;
    });
  }
  const foot = document.getElementById("foot");
  if (foot) {
    foot.className = "foot";
    foot.innerHTML = `<div class="wrap">
      <div>© ${new Date().getFullYear()} أحمر — الكتب تُشترى هنا وتُقرأ في التطبيق.</div>
      <nav><a href="/terms.html">الشروط</a><a href="/privacy.html">الخصوصية</a><a href="/refund.html">الاسترجاع</a><a href="/contact.html">تواصل معنا</a></nav>
      <div class="pay-logos" aria-label="وسائل الدفع"><span>الذهبية</span><span>CIB</span></div>
    </div>`;
  }
}
