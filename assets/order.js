// يّاش على الورق — paper-edition orders.
// Orders are written straight into the `paper_orders` collection: anyone may
// create one, nobody but the admin key can read them back (the document is
// created with no permissions). Payment is cash on delivery, so the owner
// confirms every order by phone before it ships; the admin app recomputes the
// total from the quantities rather than trusting the figures stored here.

import { mountLayout, getUser, api, CFG, openInAppUrl, esc, lang } from "/assets/app.js?v=20261109c";

const V = "20261109c";
const BOOKS = [
  { key: "qty_part2", img: "/assets/yash-2.jpg", price: 1000, title: { ar: "يّاش — الجزء الثاني", fr: "Yash — Tome 2", en: "Yash — Part Two" } },
  { key: "qty_part3", img: "/assets/yash-3.jpg", price: 1700, title: { ar: "يّاش — الجزء الثالث", fr: "Yash — Tome 3", en: "Yash — Part Three" } },
];
const SHIPPING = { home: 750, office: 500 };
const PART_ONE_ID = "697b52368bb7762720a3";
const MAX_QTY = 10;
const DRAFT_KEY = "ahmar_paper_draft";

const L = {
  title: { ar: "يّاش على الورق — متجر أحمر", fr: "Yash en papier — Boutique Ahmar", en: "Yash in print — Ahmar Store" },
  heroTitle: { ar: "يّاش على الورق", fr: "Yash, en papier", en: "Yash, in print" },
  heroBody: { ar: "الجزء الثاني والثالث بنسختهما الورقية، مع إهداء بالاسم الذي تختاره، يصلانك عبر EMS إلى بيتك أو إلى أقرب مكتب.", fr: "Les tomes 2 et 3 en édition papier, avec une dédicace au nom de votre choix, livrés par EMS chez vous ou au bureau le plus proche.", en: "Parts two and three in print, dedicated to the name you choose, delivered by EMS to your door or the nearest office." },
  heroCta: { ar: "اطلب نسختك", fr: "Commander", en: "Order your copy" },
  firstTitle: { ar: "الجزء الأول إلكتروني فقط", fr: "Le tome 1 existe uniquement en numérique", en: "Part one is digital only" },
  firstBody: { ar: "لا تتوفّر له نسخة ورقية. تقرؤه كاملاً في تطبيق أحمر.", fr: "Il n'a pas d'édition papier : lisez-le en entier dans l'application Ahmar.", en: "There's no print edition. Read it in full in the Ahmar app." },
  firstCta: { ar: "اقرأ الجزء الأول في التطبيق", fr: "Lire le tome 1 dans l'app", en: "Read part one in the app" },
  s1: { ar: "اختر الأجزاء", fr: "Choisissez les tomes", en: "Choose the books" },
  s2: { ar: "الإهداء", fr: "La dédicace", en: "The dedication" },
  s3: { ar: "التوصيل", fr: "Livraison", en: "Delivery" },
  s4: { ar: "بيانات المستلم", fr: "Destinataire", en: "Recipient" },
  copies: { ar: "النسخ", fr: "Exemplaires", en: "Copies" },
  dedLabel: { ar: "الاسم الذي يُكتب في الإهداء", fr: "Le nom à écrire dans la dédicace", en: "Name to write in the dedication" },
  dedHint: { ar: "اتركه فارغاً إن لم ترد إهداءً.", fr: "Laissez vide si vous ne voulez pas de dédicace.", en: "Leave it empty for no dedication." },
  dedTo: { ar: "إلى", fr: "Pour", en: "To" },
  dedSample: { ar: "اسمك هنا", fr: "votre nom", en: "your name" },
  home: { ar: "إلى المنزل", fr: "À domicile", en: "To your door" },
  homeSub: { ar: "يوصله عون EMS إلى عنوانك", fr: "Un agent EMS vous l'apporte", en: "An EMS courier brings it to you" },
  office: { ar: "إلى مكتب EMS", fr: "Au bureau EMS", en: "EMS office" },
  officeSub: { ar: "تستلمه من مكتب EMS في بلديتك", fr: "À retirer au bureau EMS de votre commune", en: "Collect it from the EMS office in your commune" },
  firstName: { ar: "الاسم", fr: "Prénom", en: "First name" },
  lastName: { ar: "اللقب", fr: "Nom", en: "Last name" },
  phone: { ar: "رقم الهاتف", fr: "Téléphone", en: "Phone" },
  wilaya: { ar: "الولاية", fr: "Wilaya", en: "Province (wilaya)" },
  commune: { ar: "البلدية", fr: "Commune", en: "Commune" },
  address: { ar: "العنوان الكامل", fr: "Adresse complète", en: "Full address" },
  pickWilaya: { ar: "اختر الولاية", fr: "Choisir la wilaya", en: "Choose a wilaya" },
  pickCommune: { ar: "اختر البلدية", fr: "Choisir la commune", en: "Choose a commune" },
  summary: { ar: "طلبك", fr: "Votre commande", en: "Your order" },
  delivery: { ar: "التوصيل", fr: "Livraison", en: "Delivery" },
  noBooks: { ar: "لم تختر أي جزء بعد", fr: "Aucun tome choisi", en: "No book chosen yet" },
  total: { ar: "المجموع", fr: "Total", en: "Total" },
  cod: { ar: "الدفع نقداً عند الاستلام.", fr: "Paiement en espèces à la livraison.", en: "Pay cash on delivery." },
  submit: { ar: "أرسل الطلب", fr: "Envoyer la commande", en: "Send the order" },
  sending: { ar: "جارٍ الإرسال…", fr: "Envoi…", en: "Sending…" },
  emsNote: { ar: "نتصل بك لتأكيد الطلب قبل إرساله عبر EMS.", fr: "Nous vous appelons pour confirmer avant l'expédition par EMS.", en: "We call you to confirm before shipping with EMS." },
  needBook: { ar: "اختر جزءاً واحداً على الأقل.", fr: "Choisissez au moins un tome.", en: "Choose at least one book." },
  required: { ar: "هذه الخانة مطلوبة.", fr: "Ce champ est requis.", en: "This field is required." },
  badPhone: { ar: "اكتب رقماً جزائرياً من 10 أرقام، مثل 0555123456.", fr: "Numéro algérien à 10 chiffres, ex. 0555123456.", en: "Enter a 10-digit Algerian number, e.g. 0555123456." },
  fixFields: { ar: "أكمل الخانات المعلّمة بالأحمر.", fr: "Complétez les champs en rouge.", en: "Complete the fields marked in red." },
  failed: { ar: "لم يُرسَل الطلب. تحقّق من اتصالك وأعد المحاولة.", fr: "La commande n'est pas partie. Vérifiez la connexion et réessayez.", en: "The order wasn't sent. Check your connection and try again." },
  loadFail: { ar: "تعذّر تحميل قائمة الولايات. أعد تحميل الصفحة.", fr: "Liste des wilayas indisponible. Rechargez la page.", en: "Couldn't load the wilaya list. Reload the page." },
  done: { ar: "وصلنا طلبك", fr: "Commande reçue", en: "Order received" },
  doneCode: { ar: "رقم الطلب", fr: "N° de commande", en: "Order number" },
  doneCall: { ar: "سنتصل بك على {p} لتأكيد الطلب، ثم نرسله عبر EMS. احتفظ برقم الطلب.", fr: "Nous vous appellerons au {p} pour confirmer, puis nous expédions par EMS. Gardez ce numéro.", en: "We'll call you on {p} to confirm, then ship it with EMS. Keep this number." },
  back: { ar: "العودة إلى المتجر", fr: "Retour à la boutique", en: "Back to the store" },
};
const tr = (k, vars = {}) => (L[k][lang] ?? L[k].ar).replace(/\{(\w)\}/g, (_, v) => vars[v] ?? "");
const nf = new Intl.NumberFormat(lang === "ar" ? "ar-DZ" : lang === "fr" ? "fr-DZ" : "en-US");
const money = (n) => `${nf.format(n)} ${lang === "ar" ? "دج" : "DA"}`;

const $ = (id) => document.getElementById(id);
const form = $("form");
const qty = Object.fromEntries(BOOKS.map((b) => [b.key, 0]));
let wilayas = [];

mountLayout();
document.title = tr("title");
document.querySelectorAll("[data-l]").forEach((el) => { el.textContent = tr(el.dataset.l); });
$("first-link").href = openInAppUrl(PART_ONE_ID);
$("price-home").textContent = money(SHIPPING.home);
$("price-office").textContent = money(SHIPPING.office);

/* ---------- Books ---------- */
$("picks").innerHTML = BOOKS.map((b) => `
  <div class="pick" data-key="${b.key}">
    <img src="${b.img}" alt="" width="92" height="132" loading="lazy">
    <div>
      <h3>${esc(b.title[lang] ?? b.title.ar)}</h3>
      <div class="pp">${money(b.price)}</div>
      <div class="stepper" role="group" aria-label="${esc(tr("copies"))}">
        <button type="button" data-d="1" aria-label="+">+</button>
        <output aria-live="polite">0</output>
        <button type="button" data-d="-1" aria-label="−">−</button>
      </div>
    </div>
  </div>`).join("");

$("picks").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-d]");
  if (!btn) return;
  const key = btn.closest(".pick").dataset.key;
  setQty(key, qty[key] + Number(btn.dataset.d));
  $("err-books").textContent = "";
});
// Tapping the cover of an unpicked book picks one copy.
$("picks").addEventListener("click", (e) => {
  if (!e.target.matches("img")) return;
  const key = e.target.closest(".pick").dataset.key;
  if (qty[key] === 0) setQty(key, 1);
});

function setQty(key, n) {
  qty[key] = Math.max(0, Math.min(MAX_QTY, n));
  const card = document.querySelector(`.pick[data-key="${key}"]`);
  card.classList.toggle("on", qty[key] > 0);
  card.querySelector("output").textContent = qty[key];
  card.querySelector('[data-d="-1"]').disabled = qty[key] === 0;
  card.querySelector('[data-d="1"]').disabled = qty[key] === MAX_QTY;
  renderReceipt();
  saveDraft();
}

/* ---------- Dedication ---------- */
const ink = $("ink");
const inkName = $("ink-name");
let inkTimer;
function renderInk(animate) {
  const name = $("dedication").value.trim();
  inkName.textContent = name || tr("dedSample");
  ink.classList.toggle("empty", !name);
  if (!animate) return;
  clearTimeout(inkTimer);
  // Write the line again once the reader pauses, like a pen going back over it.
  inkTimer = setTimeout(() => {
    ink.classList.remove("write");
    void ink.offsetWidth;
    ink.classList.add("write");
  }, 350);
}
$("dedication").addEventListener("input", () => { renderInk(true); saveDraft(); });

/* ---------- Delivery & receipt ---------- */
const delivery = () => form.querySelector('input[name="delivery"]:checked').value;
form.addEventListener("change", (e) => { if (e.target.name === "delivery") { renderReceipt(); saveDraft(); } });

function totals() {
  const books = BOOKS.reduce((s, b) => s + qty[b.key] * b.price, 0);
  const count = BOOKS.reduce((s, b) => s + qty[b.key], 0);
  const shipping = count ? SHIPPING[delivery()] : 0;
  return { books, shipping, total: books + shipping, count };
}

function renderReceipt() {
  const t = totals();
  const lines = BOOKS.filter((b) => qty[b.key] > 0)
    .map((b) => `<li><span>${esc(b.title[lang] ?? b.title.ar)} × ${qty[b.key]}</span><span>${money(qty[b.key] * b.price)}</span></li>`);
  if (!lines.length) lines.push(`<li class="dim"><span>${tr("noBooks")}</span></li>`);
  else lines.push(`<li><span>${tr("delivery")} — ${tr(delivery())}</span><span>${money(t.shipping)}</span></li>`);
  $("lines").innerHTML = lines.join("");
  $("total").textContent = money(t.total);
}

/* ---------- Wilayas & communes (github.com/othmanus/algeria-cities) ---------- */
const wSel = $("wilaya");
const cSel = $("commune");
const nameOf = (ar, latin) => (lang === "ar" ? ar : latin);

function fillCommunes(code, selected) {
  const w = wilayas.find((x) => x[0] === code);
  cSel.disabled = !w;
  cSel.innerHTML = `<option value="">${tr("pickCommune")}</option>` + (w ? w[3]
    .map(([ar, latin], i) => `<option value="${i}">${esc(nameOf(ar, latin))}</option>`).join("") : "");
  if (w && selected != null) cSel.value = String(selected);
}

const ready = fetch(`/assets/dz-communes.json?v=${V}`).then((r) => r.json()).then((data) => {
  wilayas = data;
  wSel.innerHTML = `<option value="">${tr("pickWilaya")}</option>` + data
    .map(([code, ar, latin]) => `<option value="${code}">${String(code).padStart(2, "0")} — ${esc(nameOf(ar, latin))}</option>`).join("");
  cSel.innerHTML = `<option value="">${tr("pickCommune")}</option>`;
}).catch(() => { $("err-submit").textContent = tr("loadFail"); });

wSel.addEventListener("change", () => { fillCommunes(Number(wSel.value)); saveDraft(); });

/* ---------- Draft (this browser only) ---------- */
const FIELDS = ["first_name", "last_name", "phone", "address", "dedication"];
function saveDraft() {
  const d = { qty, delivery: delivery(), wilaya: wSel.value, commune: cSel.value };
  for (const f of FIELDS) d[f] = form.elements[f].value;
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch {}
}
async function restoreDraft() {
  let d;
  try { d = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); } catch {}
  await ready;
  if (d) {
    for (const f of FIELDS) if (typeof d[f] === "string") form.elements[f].value = d[f];
    for (const b of BOOKS) if (Number.isInteger(d.qty?.[b.key])) qty[b.key] = d.qty[b.key];
    if (d.delivery in SHIPPING) form.querySelector(`input[name="delivery"][value="${d.delivery}"]`).checked = true;
    if (d.wilaya) { wSel.value = d.wilaya; fillCommunes(Number(d.wilaya), d.commune); }
  }
  // Coming from a book page (?book=2 / ?book=3) picks that part.
  const want = new URLSearchParams(location.search).get("book");
  const k = want === "2" ? "qty_part2" : want === "3" ? "qty_part3" : null;
  if (k && !qty[k]) qty[k] = 1;
  BOOKS.forEach((b) => setQty(b.key, qty[b.key]));
  renderInk(false);
}
form.addEventListener("input", (e) => {
  if (FIELDS.includes(e.target.name)) saveDraft();
  e.target.closest(".field")?.classList.remove("bad");
  const p = e.target.closest(".field")?.querySelector(".error");
  if (p) p.textContent = "";
});
cSel.addEventListener("change", saveDraft);

/* ---------- Validation ---------- */
function normPhone(v) {
  let p = v.replace(/[\s\-.()]/g, "").replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
  if (p.startsWith("+213")) p = "0" + p.slice(4);
  else if (p.startsWith("00213")) p = "0" + p.slice(5);
  else if (/^213\d{9}$/.test(p)) p = "0" + p.slice(3);
  return p;
}
function mark(name, msg) {
  const field = form.elements[name].closest(".field");
  field.classList.add("bad");
  field.querySelector(".error").textContent = msg;
}
function validate() {
  let ok = true;
  form.querySelectorAll(".field.bad").forEach((f) => f.classList.remove("bad"));
  if (!totals().count) { $("err-books").textContent = tr("needBook"); ok = false; }
  for (const f of ["first_name", "last_name", "address"]) {
    if (form.elements[f].value.trim().length < 2) { mark(f, tr("required")); ok = false; }
  }
  if (!/^0[2-7]\d{8}$/.test(normPhone(form.elements.phone.value))) { mark("phone", tr("badPhone")); ok = false; }
  if (!wSel.value) { mark("wilaya", tr("required")); ok = false; }
  if (cSel.value === "") { mark("commune", tr("required")); ok = false; }
  return ok;
}

/* ---------- Submit ---------- */
const CODE_ABC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const newCode = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), (n) => CODE_ABC[n % CODE_ABC.length]).join("");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const err = $("err-submit");
  err.textContent = "";
  if (!validate()) {
    err.textContent = tr("fixFields");
    (form.querySelector(".field.bad input, .field.bad select, .field.bad textarea") || $("picks")).focus?.();
    form.querySelector(".field.bad, #err-books:not(:empty)")?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  const btn = $("submit");
  btn.disabled = true;
  btn.textContent = tr("sending");

  const w = wilayas.find((x) => x[0] === Number(wSel.value));
  const c = w[3][Number(cSel.value)];
  const t = totals();
  const user = await getUser();
  const data = {
    first_name: form.elements.first_name.value.trim(),
    last_name: form.elements.last_name.value.trim(),
    phone: normPhone(form.elements.phone.value),
    wilaya_code: w[0],
    wilaya: `${w[1]} (${w[2]})`,
    commune: `${c[0]} (${c[1]})`,
    address: form.elements.address.value.trim(),
    delivery: delivery(),
    qty_part2: qty.qty_part2,
    qty_part3: qty.qty_part3,
    dedication: form.elements.dedication.value.trim() || null,
    books_total: t.books,
    shipping: t.shipping,
    total: t.total,
    user_id: user?.$id ?? null,
    lang,
  };

  let code;
  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      code = newCode();
      try {
        await api(`/databases/${CFG.db}/collections/paper_orders/documents`, {
          method: "POST", body: { documentId: `po_${code}`, data, permissions: [] },
        });
        break;
      } catch (ex) {
        if (ex.code !== 409 || attempt === 2) throw ex;
      }
    }
  } catch {
    err.textContent = tr("failed");
    btn.disabled = false;
    btn.textContent = tr("submit");
    return;
  }
  try { localStorage.removeItem(DRAFT_KEY); } catch {}
  showSealed(code, data, t);
});

function showSealed(code, data, t) {
  const lines = BOOKS.filter((b) => data[b.key] > 0)
    .map((b) => `<li><span>${esc(b.title[lang] ?? b.title.ar)} × ${data[b.key]}</span><span>${money(data[b.key] * b.price)}</span></li>`).join("");
  $("order").outerHTML = `<section class="wrap" id="order"><div class="sealed">
    <div class="letter">
      <svg class="seal" viewBox="0 0 100 100" aria-hidden="true">
        <path fill="#a8291a" d="M50 3c7 0 9 5 15 6s11-2 15 3 1 10 4 15 9 7 9 13-6 8-6 14 5 10 2 15-9 4-13 8-4 11-10 13-10-3-16-3-10 6-16 3-4-9-10-13-11-3-13-8 2-10 2-15-6-8-6-14 7-8 9-13-2-11 3-15 10 1 15-3S43 3 50 3z"/>
        <circle cx="50" cy="50" r="31" fill="none" stroke="#7d1d10" stroke-width="2.5"/>
        <circle cx="50" cy="50" r="27" fill="#b8321f"/>
        <text x="50" y="60" text-anchor="middle" font-family="Aref Ruqaa, Amiri, serif" font-size="26" fill="#f3d9c9">ي.ب</text>
      </svg>
      <h1>${tr("done")}</h1>
      <div class="muted">${tr("doneCode")}</div>
      <div class="code">${code}</div>
      ${data.dedication ? `<p class="ink-line">${esc(tr("dedTo"))} ${esc(data.dedication)}</p>` : ""}
      <ul>${lines}<li><span>${tr("delivery")} — ${tr(data.delivery)}</span><span>${money(t.shipping)}</span></li>
        <li><b>${tr("total")}</b><b>${money(t.total)}</b></li></ul>
      <p>${esc(tr("doneCall", { p: data.phone }))}</p>
      <div class="actions">
        <a class="btn o-ghost" href="${openInAppUrl(PART_ONE_ID)}">${tr("firstCta")}</a>
        <a class="btn btn-ghost" href="/">${tr("back")}</a>
      </div>
    </div>
  </div></section>`;
  document.getElementById("order").scrollIntoView({ behavior: "smooth", block: "start" });
}

restoreDraft();
renderReceipt();
startRain();

/* ---------- Rain, like the window on the cover of part two ---------- */
function startRain() {
  const canvas = $("rain");
  if (!canvas || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const ctx = canvas.getContext("2d");
  let w, h, drops, running = true, raf;
  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drops = Array.from({ length: Math.round(w / 9) }, () => drop(true));
  };
  const drop = (anywhere) => ({
    x: Math.random() * (w + 200) - 100, y: anywhere ? Math.random() * h : -40,
    len: 14 + Math.random() * 26, v: 7 + Math.random() * 7, a: .05 + Math.random() * .16,
  });
  const tick = () => {
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 1;
    for (const d of drops) {
      ctx.strokeStyle = `rgba(239, 231, 216, ${d.a})`;
      ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - d.len * .22, d.y + d.len); ctx.stroke();
      d.y += d.v; d.x -= d.v * .22;
      if (d.y > h) Object.assign(d, drop(false));
    }
    if (running) raf = requestAnimationFrame(tick);
  };
  resize();
  addEventListener("resize", resize);
  new IntersectionObserver(([en]) => {
    running = en.isIntersecting && !document.hidden;
    cancelAnimationFrame(raf);
    if (running) tick();
  }).observe(canvas);
  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    cancelAnimationFrame(raf);
    if (running) tick();
  });
}
