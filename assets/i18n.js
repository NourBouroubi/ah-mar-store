// Three languages: Arabic (default, RTL), French and English (LTR).
// The choice comes from ?lang=, then the last one picked, then the browser.

export const LANGS = { ar: "العربية", fr: "Français", en: "English" };
const KEY = "ahmar_lang";

function pick() {
  const fromUrl = new URLSearchParams(location.search).get("lang");
  if (fromUrl && LANGS[fromUrl]) return fromUrl;
  try {
    const saved = localStorage.getItem(KEY);
    if (saved && LANGS[saved]) return saved;
  } catch {}
  for (const l of navigator.languages || [navigator.language || ""]) {
    const code = l.slice(0, 2).toLowerCase();
    if (LANGS[code]) return code;
  }
  return "ar";
}

export const lang = pick();
document.documentElement.lang = lang;
document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";

export function setLang(code) {
  try { localStorage.setItem(KEY, code); } catch {}
  const url = new URL(location.href);
  url.searchParams.delete("lang");
  location.replace(url.toString());
}

const D = {
  // ---- layout ----
  store: { ar: "المتجر", fr: "Boutique", en: "Store" },
  signIn: { ar: "تسجيل الدخول", fr: "Se connecter", en: "Sign in" },
  myAccount: { ar: "حسابي", fr: "Mon compte", en: "My account" },
  footerLine: { ar: "الكتب تُشترى هنا وتُقرأ في التطبيق.", fr: "Les livres s'achètent ici et se lisent dans l'application.", en: "Books are bought here and read in the app." },
  terms: { ar: "الشروط", fr: "Conditions", en: "Terms" },
  privacy: { ar: "الخصوصية", fr: "Confidentialité", en: "Privacy" },
  refund: { ar: "الاسترجاع", fr: "Remboursement", en: "Refunds" },
  contact: { ar: "تواصل معنا", fr: "Contact", en: "Contact" },
  payMethods: { ar: "وسائل الدفع", fr: "Moyens de paiement", en: "Payment methods" },
  edahabia: { ar: "الذهبية", fr: "Edahabia", en: "Edahabia" },

  // ---- home ----
  metaTitle: { ar: "متجر أحمر — كتب إلكترونية تقرؤها في تطبيق أحمر", fr: "Boutique Ahmar — des ebooks à lire dans l'application Ahmar", en: "Ahmar Store — ebooks you read in the Ahmar app" },
  heroA: { ar: "كتب تشتريها هنا،", fr: "Achetez vos livres ici,", en: "Buy your books here," },
  heroB: { ar: "وتقرؤها في تطبيق أحمر.", fr: "lisez-les dans l'application Ahmar.", en: "read them in the Ahmar app." },
  heroP: { ar: "ادفع بالبطاقة الذهبية أو CIB، ويصل الكتاب إلى مكتبتك في التطبيق خلال ثوانٍ.", fr: "Payez par carte Edahabia ou CIB : le livre arrive dans votre bibliothèque en quelques secondes.", en: "Pay with an Edahabia or CIB card and the book lands in your in-app library within seconds." },
  step1: { ar: "سجّل دخولك بحساب التطبيق نفسه", fr: "Connectez-vous avec votre compte de l'application", en: "Sign in with your app account" },
  step2: { ar: "اختر كتابك وادفع", fr: "Choisissez et payez", en: "Pick a book and pay" },
  step3: { ar: "افتح التطبيق واقرأ", fr: "Ouvrez l'application et lisez", en: "Open the app and read" },
  iosTitle: { ar: "تستعمل iPhone أو iPad؟", fr: "Vous êtes sur iPhone ou iPad ?", en: "On iPhone or iPad?" },
  iosBody: {
    ar: "لا يمكن شراء الكتب من داخل تطبيق أحمر على iOS. اشترِ كتبك من هذا المتجر بالحساب نفسه، وستجدها فوراً في مكتبتك داخل التطبيق.",
    fr: "Les livres ne peuvent pas être achetés dans l'application Ahmar sur iOS. Achetez-les sur cette boutique avec le même compte : ils apparaissent aussitôt dans votre bibliothèque.",
    en: "Books can't be bought inside the Ahmar app on iOS. Buy them here with the same account and they appear in your in-app library right away.",
  },
  search: { ar: "ابحث عن كتاب أو كاتب", fr: "Rechercher un livre ou un auteur", en: "Search books or authors" },
  categories: { ar: "التصنيفات", fr: "Catégories", en: "Categories" },
  all: { ar: "الكل", fr: "Tous", en: "All" },
  inLibrary: { ar: "في مكتبتك", fr: "Dans votre bibliothèque", en: "In your library" },
  noMatch: { ar: "لا توجد كتب مطابقة.", fr: "Aucun livre ne correspond.", en: "No matching books." },
  loadFail: { ar: "تعذّر تحميل الكتب. تحقّق من اتصالك ثم أعد تحميل الصفحة.", fr: "Impossible de charger les livres. Vérifiez votre connexion puis rechargez.", en: "Couldn't load the books. Check your connection and reload." },

  // ---- book ----
  notFound: { ar: "الكتاب غير موجود", fr: "Livre introuvable", en: "Book not found" },
  notFoundP: { ar: "ربما أُزيل من المتجر أو أن الرابط غير صحيح.", fr: "Il a peut-être été retiré ou le lien est incorrect.", en: "It may have been removed, or the link is wrong." },
  browse: { ar: "تصفّح الكتب", fr: "Parcourir les livres", en: "Browse books" },
  pages: { ar: "صفحة", fr: "pages", en: "pages" },
  ebook: { ar: "كتاب إلكتروني", fr: "Livre numérique", en: "Ebook" },
  about: { ar: "عن الكتاب", fr: "À propos du livre", en: "About this book" },
  owned: { ar: "هذا الكتاب في مكتبتك", fr: "Ce livre est dans votre bibliothèque", en: "This book is in your library" },
  readInApp: { ar: "اقرأه في تطبيق أحمر", fr: "Lire dans l'application Ahmar", en: "Read in the Ahmar app" },
  readOnlyApp: { ar: "القراءة متاحة في التطبيق فقط، بالحساب نفسه.", fr: "La lecture se fait uniquement dans l'application, avec le même compte.", en: "Reading happens only in the app, with the same account." },
  free: { ar: "مجاني", fr: "Gratuit", en: "Free" },
  noteFree: { ar: "يُضاف إلى مكتبتك مجاناً ويبقى فيها. يُقرأ في تطبيق أحمر.", fr: "Ajouté gratuitement à votre bibliothèque, pour toujours. Se lit dans l'application Ahmar.", en: "Added to your library for free, for good. Read it in the Ahmar app." },
  notePaid: { ar: "دفعة واحدة، والكتاب لك إلى الأبد. يُقرأ في تطبيق أحمر.", fr: "Un seul paiement, le livre est à vous pour toujours. Se lit dans l'application Ahmar.", en: "One payment, yours forever. Read it in the Ahmar app." },
  signInToBuy: { ar: "سجّل الدخول للشراء", fr: "Connectez-vous pour acheter", en: "Sign in to buy" },
  signInToAdd: { ar: "سجّل الدخول لإضافته إلى مكتبتك", fr: "Connectez-vous pour l'ajouter", en: "Sign in to add it" },
  sameAccount: { ar: "استعمل الحساب نفسه الذي في التطبيق، ليصل الكتاب إلى مكتبتك.", fr: "Utilisez le même compte que dans l'application pour que le livre arrive dans votre bibliothèque.", en: "Use the same account as in the app so the book reaches your library." },
  addToLibrary: { ar: "أضفه إلى مكتبتي", fr: "Ajouter à ma bibliothèque", en: "Add to my library" },
  payMethod: { ar: "طريقة الدفع", fr: "Moyen de paiement", en: "Payment method" },
  edahabiaSub: { ar: "بريد الجزائر", fr: "Algérie Poste", en: "Algérie Poste" },
  cibSub: { ar: "البطاقة البنكية", fr: "Carte bancaire", en: "Bank card" },
  cardIntl: { ar: "بطاقة دولية", fr: "Carte internationale", en: "International card" },
  cardIntlSub: { ar: "Visa · Mastercard بالدولار", fr: "Visa · Mastercard en dollars", en: "Visa · Mastercard in USD" },
  paddleNote: {
    ar: "الدفع بالبطاقة الدولية تتولّاه Paddle.com، وهي البائع الرسمي لهذه الطلبات. قد تُضاف ضريبة بلدك عند الدفع.",
    fr: "Les paiements par carte internationale sont traités par Paddle.com, revendeur officiel de ces commandes. La TVA de votre pays peut s'ajouter.",
    en: "International card payments are handled by Paddle.com, the merchant of record for these orders. Your country's sales tax may be added at checkout.",
  },
  securePaddle: { ar: "دفع آمن عبر Paddle", fr: "Paiement sécurisé via Paddle", en: "Secure payment by Paddle" },
  pay: { ar: "ادفع", fr: "Payer", en: "Pay" },
  securePay: { ar: "دفع آمن عبر Chargily", fr: "Paiement sécurisé via Chargily", en: "Secure payment by Chargily" },
  instant: { ar: "يصل الكتاب فوراً", fr: "Livraison immédiate", en: "Instant delivery" },
  iosShort: { ar: "على iPhone وiPad تتم المشتريات من هنا فقط، ويظهر الكتاب في التطبيق تلقائياً.", fr: "Sur iPhone et iPad, les achats se font uniquement ici ; le livre apparaît ensuite dans l'application.", en: "On iPhone and iPad, purchases are made here only; the book then shows up in the app." },
  payFail: { ar: "تعذّر بدء الدفع. حاول مرة أخرى بعد قليل.", fr: "Impossible de lancer le paiement. Réessayez dans un instant.", en: "Couldn't start the payment. Please try again shortly." },

  // ---- account ----
  signInTitle: { ar: "تسجيل الدخول", fr: "Connexion", en: "Sign in" },
  signInP: { ar: "استعمل الحساب نفسه الذي في تطبيق أحمر، ليصل كل كتاب تشتريه إلى مكتبتك هناك.", fr: "Utilisez le même compte que dans l'application Ahmar pour retrouver chaque achat dans votre bibliothèque.", en: "Use the same account as in the Ahmar app so every purchase lands in your library there." },
  oauthError: { ar: "لم يكتمل تسجيل الدخول. حاول مرة أخرى.", fr: "La connexion n'a pas abouti. Réessayez.", en: "Sign-in didn't complete. Please try again." },
  google: { ar: "المتابعة بحساب Google", fr: "Continuer avec Google", en: "Continue with Google" },
  orEmail: { ar: "أو برمز يصل إلى بريدك", fr: "ou avec un code par e-mail", en: "or with a code by email" },
  email: { ar: "البريد الإلكتروني", fr: "Adresse e-mail", en: "Email address" },
  sendCode: { ar: "أرسل الرمز", fr: "Envoyer le code", en: "Send code" },
  codeLabel: { ar: "الرمز المكوّن من 6 أرقام", fr: "Code à 6 chiffres", en: "6-digit code" },
  confirm: { ar: "تأكيد", fr: "Confirmer", en: "Confirm" },
  changeEmail: { ar: "تغيير البريد", fr: "Changer d'adresse", en: "Change email" },
  sentTo: { ar: "أرسلنا رمزاً إلى", fr: "Code envoyé à", en: "We sent a code to" },
  tooMany: { ar: "محاولات كثيرة. انتظر دقيقة ثم أعد المحاولة.", fr: "Trop de tentatives. Patientez une minute.", en: "Too many attempts. Wait a minute and retry." },
  sendFail: { ar: "تعذّر إرسال الرمز. تحقّق من البريد وأعد المحاولة.", fr: "Envoi impossible. Vérifiez l'adresse et réessayez.", en: "Couldn't send the code. Check the address and retry." },
  badCode: { ar: "الرمز غير صحيح أو انتهت صلاحيته.", fr: "Code incorrect ou expiré.", en: "Wrong or expired code." },
  appleHint: { ar: "سجّلت في التطبيق بحساب Apple؟ استعمل البريد نفسه المرتبط بحسابك.", fr: "Inscrit avec Apple dans l'application ? Utilisez l'adresse e-mail liée à ce compte.", en: "Signed up with Apple in the app? Use the email address linked to that account." },
  myLibrary: { ar: "مكتبتي", fr: "Ma bibliothèque", en: "My library" },
  openApp: { ar: "افتح التطبيق", fr: "Ouvrir l'application", en: "Open the app" },
  signOut: { ar: "تسجيل الخروج", fr: "Se déconnecter", en: "Sign out" },
  emptyLib: { ar: "مكتبتك فارغة حالياً.", fr: "Votre bibliothèque est vide.", en: "Your library is empty." },
  readApp: { ar: "اقرأ في التطبيق", fr: "Lire dans l'app", en: "Read in the app" },

  // ---- success / failed / 404 ----
  doneTitle: { ar: "تمّ! الكتاب في مكتبتك", fr: "C'est fait ! Le livre est dans votre bibliothèque", en: "Done! The book is in your library" },
  doneP: { ar: "ينتظرك الآن في تطبيق أحمر. افتح التطبيق بالحساب نفسه وابدأ القراءة.", fr: "Il vous attend dans l'application Ahmar. Ouvrez-la avec le même compte et bonne lecture.", en: "It's waiting in the Ahmar app. Open the app with the same account and start reading." },
  slowTitle: { ar: "تمّ الدفع، والكتاب في الطريق", fr: "Paiement reçu, le livre arrive", en: "Paid — your book is on its way" },
  slowP: { ar: "قد يستغرق التأكيد دقيقة. سيظهر الكتاب في مكتبتك داخل التطبيق تلقائياً، ولا حاجة للدفع مرة أخرى.", fr: "La confirmation peut prendre une minute. Le livre apparaîtra automatiquement ; inutile de payer à nouveau.", en: "Confirmation can take a minute. The book will appear in the app by itself — no need to pay again." },
  waitTitle: { ar: "نؤكّد الدفع…", fr: "Confirmation du paiement…", en: "Confirming your payment…" },
  waitP: { ar: "لحظات فقط، لا تغلق الصفحة.", fr: "Quelques secondes, ne fermez pas la page.", en: "Just a moment, keep this page open." },
  backToApp: { ar: "العودة إلى التطبيق", fr: "Retour à l'application", en: "Back to the app" },
  failTitle: { ar: "لم تكتمل عملية الدفع", fr: "Le paiement n'a pas abouti", en: "Payment not completed" },
  failP: { ar: "لم يُقتطع أي مبلغ. يمكنك المحاولة مرة أخرى أو اختيار بطاقة أخرى.", fr: "Aucun montant n'a été débité. Réessayez ou utilisez une autre carte.", en: "You weren't charged. Try again or use another card." },
  tryAgain: { ar: "حاول مرة أخرى", fr: "Réessayer", en: "Try again" },
  backToStore: { ar: "العودة إلى المتجر", fr: "Retour à la boutique", en: "Back to the store" },
  pageMissing: { ar: "الصفحة غير موجودة", fr: "Page introuvable", en: "Page not found" },
  pageMissingP: { ar: "ربما تغيّر الرابط أو أُزيلت الصفحة.", fr: "Le lien a peut-être changé.", en: "The link may have changed." },
  bought: { ar: "تمّ الشراء", fr: "Achat confirmé", en: "Purchase complete" },
  // ---- live ----
  live: { ar: "مباشر", fr: "Direct", en: "Live" },
  liveTitle: { ar: "البث المباشر", fr: "Diffusions en direct", en: "Live broadcasts" },
  liveNow: { ar: "مباشر الآن", fr: "En direct", en: "Live now" },
  recording: { ar: "تسجيل", fr: "Enregistrement", en: "Recording" },
  noLive: { ar: "لا يوجد بث حالياً. عُد لاحقاً!", fr: "Aucune diffusion pour le moment.", en: "Nothing on air right now. Check back soon!" },
  liveError: { ar: "تعذّر تحميل البث. حاول مجدداً.", fr: "Impossible de charger les diffusions.", en: "Couldn't load broadcasts. Try again." },
  streamGone: { ar: "هذا البث غير متاح", fr: "Diffusion indisponible", en: "This broadcast isn't available" },
  streamEnded: { ar: "انتهى البث", fr: "La diffusion est terminée", en: "The broadcast has ended" },
  listen: { ar: "استمع الآن", fr: "Écouter", en: "Listen now" },
  paused: { ar: "البث متوقف مؤقتاً", fr: "Diffusion en pause", en: "Broadcast paused" },
  waitingHost: { ar: "في انتظار المذيع…", fr: "En attente de l'animateur…", en: "Waiting for the host…" },
  joinFailed: { ar: "تعذّر الاتصال بالبث.", fr: "Connexion à la diffusion impossible.", en: "Couldn't connect to the broadcast." },
  liveAppOnly: { ar: "هذا البث متاح في تطبيق أحمر فقط.", fr: "Cette diffusion n'est disponible que dans l'application.", en: "This broadcast is only available in the app." },
  writeComment: { ar: "اكتب تعليقاً…", fr: "Écrire un commentaire…", en: "Write a comment…" },
  send: { ar: "إرسال", fr: "Envoyer", en: "Send" },
  signInToComment: { ar: "سجّل الدخول للتعليق", fr: "Connectez-vous pour commenter", en: "Sign in to comment" },
  signInToWatch: { ar: "سجّل الدخول لمشاهدة التسجيل", fr: "Connectez-vous pour regarder l'enregistrement", en: "Sign in to watch the recording" },
  recordingFailed: { ar: "تعذّر تشغيل التسجيل.", fr: "Lecture impossible.", en: "Couldn't play the recording." },
  noComments: { ar: "لا تعليقات بعد", fr: "Pas encore de commentaires", en: "No comments yet" },
  pinned: { ar: "مثبّت", fr: "Épinglé", en: "Pinned" },
  readerBadge: { ar: "قارئ", fr: "Lecteur", en: "Reader" },
  slowDown: { ar: "مهلاً، انتظر لحظة", fr: "Doucement, un instant", en: "Slow down a moment" },
  blockedHere: { ar: "لا يمكنك التعليق في هذا البث", fr: "Vous ne pouvez pas commenter ici", en: "You can't comment on this broadcast" },
  commentFailed: { ar: "لم يُرسل التعليق، حاول مجدداً", fr: "Commentaire non envoyé, réessayez", en: "Comment not sent, try again" },
};

export function t(key) {
  const entry = D[key];
  if (!entry) return key;
  return entry[lang] ?? entry.ar;
}

/** Fills every [data-i18n] element, and [data-i18n-ph] placeholders. */
export function applyStatic(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll("[data-i18n-ph]").forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
  root.querySelectorAll("[data-lang]").forEach((el) => { el.hidden = el.dataset.lang !== lang; });
}
