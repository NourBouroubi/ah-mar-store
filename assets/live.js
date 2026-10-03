// Live broadcasts on the web: the same backend paths the app uses.
//  * list      -> live_streams (status live / archived)
//  * audio     -> Stream Video, joined anonymously with the key the broadcast carries
//  * feed      -> live_feed snapshot (<id> once, <id>h polled on a rotating
//                 ?t= bucket so the CDN serves everyone the same response)
//  * comment   -> direct createDocument, author-only update/delete
//  * reaction  -> atomic increment on live_reaction_counts
//  * presence  -> heartbeat upsert in live_presence (doc id = user id)

import { CFG, api, getUser, getCatalog, getOwnedIds, signInWithGoogle, esc, toast, t, lang } from "/assets/app.js?v=20261003c";

// Self-hosted: jsDelivr's own +esm build of this SDK imports
// "/npm/sdp-transform@2.15.0/+esm", which jsDelivr cannot build (404 -- the
// package's main is a directory), so the import failed in every browser and no
// one on the web could listen. The copy points that import at the file path
// jsDelivr does build; everything else still loads from jsDelivr.
const STREAM_SDK = "/assets/vendor/stream-video-client-1.61.1.js";
const COL = {
  streams: "live_streams",
  comments: "live_stream_commentslive_stream_comm",
  feed: "live_feed",
  reactions: "live_reaction_counts",
  presence: "live_presence",
};
const RECORDING_BUCKET = "68b7621800212a5fa3a8";
const REACTION = "🍉";
const q = (method, attribute, values) => JSON.stringify(attribute === undefined ? { method, values } : { method, attribute, values });
const docs = (col) => `/databases/${CFG.db}/collections/${col}/documents`;

const root = document.getElementById("live");
const params = new URLSearchParams(location.search);
const streamId = params.get("id");

const dtf = new Intl.DateTimeFormat(lang === "ar" ? "ar-DZ" : lang === "fr" ? "fr-FR" : "en-GB", { dateStyle: "medium", timeStyle: "short" });
const nf = new Intl.NumberFormat(lang === "ar" ? "ar-DZ" : lang === "fr" ? "fr-FR" : "en-US");

/** Whether this user's comments carry the reader badge: owns any book priced above 0 DA. */
async function viewerHasBooks(user) {
  try {
    const [owned, catalog] = await Promise.all([getOwnedIds(user), getCatalog()]);
    return catalog.books.some((b) => owned.has(b.id) && b.price > 0);
  } catch { return false; }
}

const isStreamChannel = (name) => (name || "").startsWith("gs_");

/* ------------------------------------------------------------------ */
/* List                                                                  */
/* ------------------------------------------------------------------ */

async function fetchStreams() {
  const res = await api(docs(COL.streams), {
    query: { queries: [q("orderDesc", "$createdAt", []), q("limit", undefined, [50]), q("equal", "status", ["live", "archived"])] },
  });
  return (res.documents || []).filter((s) => s.status === "live" || s.recordingFileId || s.recording_file_id);
}

function streamCard(s) {
  const live = s.status === "live";
  const img = s.image || s.host_image_url || "/assets/logo-192.png";
  const when = s.started_at || s.$createdAt;
  return `<a class="live-card" href="/live.html?id=${encodeURIComponent(s.$id)}">
    <div class="live-thumb"><img src="${esc(img)}" alt="" loading="lazy">
      <span class="live-tag ${live ? "on" : ""}">${live ? `<i></i>${t("liveNow")}` : t("recording")}</span>
    </div>
    <div class="live-info"><h3>${esc(s.title || t("live"))}</h3>
      <div class="muted">${esc(s.host_name || "")} · ${esc(dtf.format(new Date(when)))}</div>
    </div></a>`;
}

async function renderList() {
  root.innerHTML = `<div class="lib-head"><h1>${t("liveTitle")}</h1></div><div class="live-grid" id="lg"><div class="empty"><span class="spinner"></span></div></div>`;
  const grid = document.getElementById("lg");
  const draw = async () => {
    try {
      const list = await fetchStreams();
      grid.innerHTML = list.length ? list.map(streamCard).join("") : `<div class="empty">${t("noLive")}</div>`;
    } catch {
      if (!grid.querySelector(".live-card")) grid.innerHTML = `<div class="empty">${t("liveError")}</div>`;
    }
  };
  await draw();
  setInterval(() => { if (!document.hidden) draw(); }, 15000);
}

/* ------------------------------------------------------------------ */
/* Comments                                                              */
/* ------------------------------------------------------------------ */

const comments = new Map(); // id -> comment
let blocked = new Set();
let pinnedId = null;

function fromFeed(raw) {
  return {
    id: raw.i || "", userId: raw.u || "", name: raw.n || "", avatar: raw.a || "",
    message: raw.m || "", parent: raw.p || null, badge: raw.b === true,
    type: raw.t || "comment", at: raw.c || new Date().toISOString(),
  };
}

function fromDoc(d) {
  return {
    id: d.$id, userId: d.user_id, name: d.user_name || "", avatar: d.user_image_url || "",
    message: d.message || "", parent: d.parent_comment_id || null, badge: d.has_books === true,
    type: d.type || "comment", at: d.$createdAt,
  };
}

function addComments(list) {
  for (const c of list) {
    if (!c.id || c.type === "reaction") continue;
    // A server copy replaces the instant local copy of the same message.
    for (const [id, old] of comments) {
      if (old.local && old.userId === c.userId && old.message === c.message) comments.delete(id);
    }
    comments.set(c.id, c);
  }
}

function commentHtml(c) {
  const initial = esc((c.name.trim()[0] || "?"));
  const av = c.avatar ? `<img src="${esc(c.avatar)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : initial;
  return `<div class="cmt${c.local ? " pending" : ""}"><span class="avatar">${av}</span><div>
    <b>${esc(c.name || "—")}</b>${c.badge ? `<span class="reader-badge" title="${esc(t("readerBadge"))}">📚 ${t("readerBadge")}</span>` : ""}
    <p dir="auto">${esc(c.message)}</p></div></div>`;
}

function drawComments() {
  const box = document.getElementById("cmts");
  if (!box) return;
  const list = [...comments.values()]
    .filter((c) => !blocked.has(c.userId))
    .sort((a, b) => new Date(a.at) - new Date(b.at))
    .slice(-150);
  const atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 60;
  box.innerHTML = list.length ? list.map(commentHtml).join("") : `<div class="muted cmt-empty">${t("noComments")}</div>`;
  if (atBottom) box.scrollTop = box.scrollHeight;
  const pin = document.getElementById("pinned");
  const pinned = pinnedId && comments.get(pinnedId);
  pin.hidden = !pinned;
  if (pinned) pin.innerHTML = `<small>📌 ${t("pinned")}</small>${commentHtml(pinned)}`;
}

/* ------------------------------------------------------------------ */
/* Stream page                                                           */
/* ------------------------------------------------------------------ */

async function renderStream(id) {
  let s;
  try { s = await api(`${docs(COL.streams)}/${encodeURIComponent(id)}`); }
  catch { root.innerHTML = `<div class="panel"><h1>${t("streamGone")}</h1><a class="btn btn-primary" href="/live.html">${t("liveTitle")}</a></div>`; return; }

  const live = s.status === "live";
  const recording = s.recordingFileId || s.recording_file_id;
  document.title = `${s.title || t("live")} — ${lang === "ar" ? "أحمر" : "Ahmar"}`;

  if (!live && !(s.status === "archived" && recording)) {
    root.innerHTML = `<div class="panel"><h1>${t("streamEnded")}</h1><a class="btn btn-primary" href="/live.html">${t("liveTitle")}</a></div>`;
    return;
  }

  const user = await getUser();
  const img = s.image || s.host_image_url || "/assets/logo-192.png";
  root.innerHTML = `
    <nav class="crumbs"><a href="/live.html">${t("liveTitle")}</a> / <span>${esc(s.title || "")}</span></nav>
    <div class="live-page">
      <section class="stage-col">
        <div class="stage" id="stage">
          <img class="stage-art" id="art" src="${esc(img)}" alt="">
          <video id="vid" playsinline ${live ? "muted autoplay" : "controls preload=\"metadata\""} hidden></video>
          <div class="stage-overlay" id="overlay"></div>
          ${live ? `<span class="live-tag on stage-tag"><i></i>${t("liveNow")}</span>` : ""}
        </div>
        <div class="stage-bar">
          <div><h1>${esc(s.title || "")}</h1><div class="muted">${esc(s.host_name || "")}</div></div>
          <div class="counters">${live ? `<span>👥 <b id="n-listen">${nf.format(s.listeners_count || 0)}</b></span>` : ""}<span>${REACTION} <b id="n-react">${nf.format(s.reaction_count || 0)}</b></span></div>
        </div>
        ${s.description ? `<p class="muted" dir="auto">${esc(s.description)}</p>` : ""}
      </section>
      <aside class="chat">
        <div class="pinned" id="pinned" hidden></div>
        <div class="cmts" id="cmts"><div class="empty"><span class="spinner"></span></div></div>
        <form class="say" id="say">${user
          ? `<input id="msg" maxlength="500" autocomplete="off" placeholder="${esc(t("writeComment"))}" dir="auto"><button class="btn btn-primary btn-sm" type="submit">${t("send")}</button>${live ? `<button class="react" type="button" id="react" aria-label="react">${REACTION}</button>` : ""}`
          : `<button class="btn btn-ghost btn-block" type="button" id="login">${t("signInToComment")}</button>`}</form>
      </aside>
    </div>`;

  document.getElementById("login")?.addEventListener("click", () => signInWithGoogle(location.href));
  const hasBooksP = user ? viewerHasBooks(user) : Promise.resolve(false);

  if (live) startLive(s, user);
  else startArchive(s, recording, user);

  // ---- comment ----
  let lastSent = 0;
  document.getElementById("say").addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("msg");
    const message = (input?.value || "").trim();
    if (!message || !user) return;
    if (Date.now() - lastSent < 2000) { toast(t("slowDown")); return; }
    if (blocked.has(user.$id)) { toast(t("blockedHere")); return; }
    lastSent = Date.now();
    input.value = "";
    const badge = await hasBooksP;
    const localId = "local_" + Date.now();
    comments.set(localId, { id: localId, local: true, userId: user.$id, name: user.name || "Anonymous", message, badge, at: new Date().toISOString() });
    drawComments();
    const vid = document.getElementById("vid");
    try {
      const doc = await api(docs(COL.comments), {
        method: "POST",
        body: {
          documentId: "unique()",
          data: {
            live_stream_id: s.$id, user_id: user.$id, user_name: user.name || "Anonymous",
            message, reactions: "{}", reacted_user_ids: [], has_books: badge,
            stream_time_seconds: live ? 0 : Math.floor(vid?.currentTime || 0),
          },
          permissions: ['read("any")', `update("user:${user.$id}")`, `delete("user:${user.$id}")`],
        },
      });
      // Archived streams have no feed to bring it back, so keep the saved copy.
      if (!live) { comments.delete(localId); addComments([fromDoc(doc)]); drawComments(); }
    } catch {
      comments.delete(localId);
      drawComments();
      input.value = message;
      toast(t("commentFailed"));
    }
  });
}

/* ---------------- live ---------------- */

function startLive(s, user) {
  // ---- feed ----
  let pollSeconds = 2, lastVersion = -1, offsetMs = 0;
  const feedUrl = (docId, query) => `${CFG.endpoint}${docs(COL.feed)}/${docId}${query ? "?" + query : ""}`;
  async function fetchFeed(docId, query) {
    // No cookie and no auth: byte-identical requests are what the edge can cache.
    const res = await fetch(feedUrl(docId, query), {
      credentials: "omit",
      headers: { "X-Appwrite-Project": CFG.project, "X-Appwrite-Response-Format": "1.8.0" },
    });
    if (!res.ok) return null;
    const body = await res.json();
    try { return body.payload ? JSON.parse(body.payload) : null; } catch { return null; }
  }
  function apply(snap) {
    pollSeconds = Math.min(15, Math.max(1, snap.pi || 2));
    blocked = new Set(snap.blocked || []);
    pinnedId = snap.pinned || null;
    const nl = document.getElementById("n-listen"), nr = document.getElementById("n-react");
    if (nl) nl.textContent = nf.format(snap.listeners || 0);
    if (nr) nr.textContent = nf.format((snap.reactions || 0) + pendingShown);
    addComments((snap.comments || []).map(fromFeed));
    drawComments();
    setPaused(snap.paused === true);
    if (snap.status === "ended" || snap.status === "archived") ended();
  }
  let stopped = false;
  function ended() {
    if (stopped) return;
    stopped = true;
    leaveCall();
    overlay(`<div><h2>${t("streamEnded")}</h2><a class="btn btn-primary" href="/live.html">${t("liveTitle")}</a></div>`);
  }
  (async () => {
    const full = await fetchFeed(s.$id).catch(() => null);
    if (full) apply(full);
    else drawComments();
    const tick = async () => {
      if (stopped) return;
      if (!document.hidden) {
        const now = Date.now() + offsetMs;
        const snap = await fetchFeed(`${s.$id}h`, `t=${Math.floor(now / (pollSeconds * 1000))}`).catch(() => null);
        if (snap) {
          if (snap.ts) offsetMs = new Date(snap.ts).getTime() - Date.now();
          if (snap.v !== lastVersion) { lastVersion = snap.v; apply(snap); }
        }
      }
      setTimeout(tick, pollSeconds * 1000);
    };
    setTimeout(tick, pollSeconds * 1000);
  })();

  // ---- presence ----
  const presence = (seenAt) => user && api(`${docs(COL.presence)}/${user.$id}`, {
    method: "PUT",
    body: { data: { stream_id: s.$id, weight: 1, seen_at: seenAt } },
  }).catch(() => {});
  if (user) {
    presence(new Date().toISOString());
    setInterval(() => { if (!stopped) presence(new Date().toISOString()); }, 20000);
    // Backdate on leave so the count drops at once instead of ageing out.
    addEventListener("pagehide", () => presence(new Date(Date.UTC(2000, 0, 1)).toISOString()));
  }

  // ---- reactions: coalesced, one atomic increment per burst ----
  let pending = 0, pendingShown = 0, flushTimer = null;
  const flush = async () => {
    flushTimer = null;
    const n = pending; pending = 0;
    if (!n || !user) return;
    try {
      await api(`${docs(COL.reactions)}/${s.$id}/total/increment`, { method: "PATCH", body: { value: n } });
    } catch { /* counter appears once the host publishes */ }
    setTimeout(() => { pendingShown = Math.max(0, pendingShown - n); }, 6000);
  };
  document.getElementById("react")?.addEventListener("click", (e) => {
    pending++; pendingShown++;
    const nr = document.getElementById("n-react");
    if (nr) nr.textContent = nf.format((Number(nr.textContent.replace(/\D/g, "")) || 0) + 1);
    floatReaction(e.currentTarget);
    if (!flushTimer) flushTimer = setTimeout(flush, 3000);
  });
  addEventListener("pagehide", () => { if (pending) flush(); });

  // ---- audio / video ----
  if (!isStreamChannel(s.channel_name) || !s.token) {
    overlay(`<div><p>${t("liveAppOnly")}</p></div>`);
    return;
  }
  if (!user) {
    overlay(`<div><p>${t("signInToListen")}</p><button class="btn btn-primary" id="login2">${t("signIn")}</button></div>`);
    document.getElementById("login2").onclick = () => signInWithGoogle(location.href);
    return;
  }
  overlay(`<button class="btn btn-primary listen" id="listen">▶ ${t("listen")}</button>`);
  document.getElementById("listen").onclick = () => joinCall(s);
}

let call = null, client = null;
const audioEls = new Map();
let pausedNow = false;

function overlay(html) {
  const o = document.getElementById("overlay");
  if (!o) return;
  o.innerHTML = html || "";
  o.hidden = !html;
}

function setPaused(p) {
  if (p === pausedNow) return;
  pausedNow = p;
  if (call) overlay(p ? `<div><h2>⏸ ${t("paused")}</h2></div>` : "");
}

async function joinCall(s) {
  overlay(`<span class="spinner"></span>`);
  try {
    const { StreamVideoClient } = await import(STREAM_SDK);
    client = new StreamVideoClient({ apiKey: s.token, user: { type: "anonymous" } });
    call = client.call("livestream", s.channel_name);
    try { await call.camera.disable(); await call.microphone.disable(); } catch {}
    await call.join();
  } catch (e) {
    console.warn("join failed", e);
    call = null;
    overlay(`<div><p>${t("joinFailed")}</p><button class="btn btn-primary" id="listen">${t("tryAgain")}</button></div>`);
    document.getElementById("listen").onclick = () => joinCall(s);
    return;
  }
  overlay(pausedNow ? `<div><h2>⏸ ${t("paused")}</h2></div>` : "");

  const stage = document.getElementById("stage");
  const vid = document.getElementById("vid");
  let unbindVideo = null, videoFor = null;
  call.state.participants$.subscribe((ps) => {
    const remote = ps.filter((p) => !p.isLocalParticipant);
    const host = remote.find((p) => p.userId === "admin_host") || remote[0];
    // Every remote participant's audio, each in its own element.
    for (const p of remote) {
      if (!audioEls.has(p.sessionId)) {
        const a = new Audio(); a.autoplay = true;
        audioEls.set(p.sessionId, { el: a, unbind: call.bindAudioElement(a, p.sessionId) });
      }
    }
    for (const [sid, a] of audioEls) {
      if (!remote.some((p) => p.sessionId === sid)) { a.unbind?.(); a.el.srcObject = null; audioEls.delete(sid); }
    }
    const videoOn = host && (host.publishedTracks || []).includes(2); // TrackType.VIDEO
    if (videoOn && videoFor !== host.sessionId) {
      unbindVideo?.(); unbindVideo = call.bindVideoElement(vid, host.sessionId, "videoTrack"); videoFor = host.sessionId;
    } else if (!videoOn && videoFor) { unbindVideo?.(); unbindVideo = null; videoFor = null; }
    vid.hidden = !videoOn;
    document.getElementById("art").hidden = !!videoOn;
    const level = host ? Math.min(1, host.audioLevel || 0) : 0;
    stage.style.setProperty("--level", level.toFixed(2));
    stage.classList.toggle("speaking", level > 0.05);
    if (!host && !pausedNow) overlay(`<div><p>${t("waitingHost")}</p></div>`);
    else if (host && !pausedNow && document.getElementById("overlay").textContent === t("waitingHost")) overlay("");
  });
}

function leaveCall() {
  for (const a of audioEls.values()) { a.unbind?.(); a.el.srcObject = null; }
  audioEls.clear();
  call?.leave().catch(() => {});
  client?.disconnectUser?.().catch?.(() => {});
  call = null;
}
addEventListener("pagehide", leaveCall);

function floatReaction(from) {
  const el = document.createElement("span");
  el.className = "float-react";
  el.textContent = REACTION;
  const r = from.getBoundingClientRect();
  el.style.left = `${r.left + r.width / 2 - 12 + (Math.random() * 30 - 15)}px`;
  el.style.top = `${r.top - 10}px`;
  document.body.append(el);
  setTimeout(() => el.remove(), 1600);
}

/* ---------------- archived ---------------- */

async function startArchive(s, fileId, user) {
  blocked = new Set(Array.isArray(s.blocked_user_ids) ? s.blocked_user_ids : []);
  pinnedId = s.pinned_comment_id || null;
  if (!user) {
    // The recording is stored with read("users").
    overlay(`<div><p>${t("signInToWatch")}</p><button class="btn btn-primary" id="login2">${t("signIn")}</button></div>`);
    document.getElementById("login2").onclick = () => signInWithGoogle(location.href);
  } else {
    const vid = document.getElementById("vid");
    vid.src = `${CFG.endpoint}/storage/buckets/${RECORDING_BUCKET}/files/${encodeURIComponent(fileId)}/view?project=${CFG.project}`;
    vid.hidden = false;
    if (s.hasVideo === false) vid.classList.add("audio-only");
    document.getElementById("art").hidden = s.hasVideo !== false;
    overlay("");
    vid.onerror = () => overlay(`<div><p>${t("recordingFailed")}</p></div>`);
  }
  try {
    const res = await api(docs(COL.comments), {
      query: { queries: [q("equal", "live_stream_id", [s.$id]), q("orderDesc", "$createdAt", []), q("limit", undefined, [200])] },
    });
    addComments((res.documents || []).map(fromDoc));
  } catch {}
  drawComments();
}

/* ------------------------------------------------------------------ */

if (streamId) renderStream(streamId);
else renderList();
