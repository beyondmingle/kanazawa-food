/* ============================================================
   金沢市 食のバリアフリーマップ 共通部品

   設定（ここだけ書き換える）
   SHOPS_CSV_URL: スプレッドシートの public シートを「ウェブに公開」した CSV の URL
   NEWS_CSV_URL : スプレッドシートの news シートを「ウェブに公開」した CSV の URL
   ============================================================ */
window.KF_CONFIG = {
  SHOPS_CSV_URL: "https://docs.google.com/spreadsheets/d/e/2PACX-1vThJRjCp8JlplPg2mhxV8q5BX23rqKfzHQjTR9ifDtTND8GU3pAn6VUJFCG-sh5dtlwdP9QI_CBckJz/pub?gid=747522636&single=true&output=csv",
  NEWS_CSV_URL: "https://docs.google.com/spreadsheets/d/e/2PACX-1vThJRjCp8JlplPg2mhxV8q5BX23rqKfzHQjTR9ifDtTND8GU3pAn6VUJFCG-sh5dtlwdP9QI_CBckJz/pub?gid=1664822782&single=true&output=csv",
  PAGE_SIZE: 20,       // お店を探す: 1 ページに表示するお店の数
  NEWS_PAGE_SIZE: 10,  // お知らせ一覧: 1 ページに表示する件数
};

window.KF = (() => {
  const CONFIG = window.KF_CONFIG;
  const params = new URLSearchParams(location.search);
  const LANG = params.get("lang") === "en" ? "en" : "ja";
  document.documentElement.lang = LANG;

  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // 英語表示のときは ?lang=en を付けたリンクにする
  function href(page, extra = {}) {
    const q = new URLSearchParams();
    if (LANG === "en") q.set("lang", "en");
    Object.entries(extra).forEach(([k, v]) => v !== undefined && v !== "" && q.set(k, v));
    const s = q.toString();
    return page + (s ? "?" + s : "");
  }

  // 同じページを別の言語で開くリンク
  function langSwitchHref() {
    const q = new URLSearchParams(location.search);
    if (LANG === "en") q.delete("lang"); else q.set("lang", "en");
    const s = q.toString();
    return location.pathname + (s ? "?" + s : "") + location.hash;
  }

  function parseCSV(text) {
    const rows = []; let row = [], cell = "", inQ = false;
    text = text.replace(/^\uFEFF/, "");
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQ) {
        if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else inQ = false; }
        else cell += c;
      } else if (c === '"') inQ = true;
      else if (c === ",") { row.push(cell); cell = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(cell); rows.push(row); row = []; cell = "";
      } else cell += c;
    }
    if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
    const head = (rows.shift() || []).map(h => h.trim());
    return rows
      .map(r => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? "").trim()])))
      .filter(r => Object.values(r).some(v => v !== ""));
  }

  async function loadCSV(url) {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(String(r.status));
    return parseCSV(await r.text());
  }

  // 本文の文字を HTML にする: [文字](URL) と URL とメールアドレスをリンクに
  function linkify(text) {
    const parts = [];
    const re = /\[([^\]]+)\]\(([^)\s]+)\)|(https?:\/\/[^\s<>"'）」]+)|([\w.+-]+@[\w-]+\.[\w.-]+)|((?:news|search|about|index)\.html\?[^\s<>"'）」]+)/g;
    let last = 0, m;
    while ((m = re.exec(text))) {
      parts.push(esc(text.slice(last, m.index)));
      if (m[1]) parts.push(a(m[2], m[1]));
      else if (m[3]) parts.push(a(m[3], m[3]));
      else if (m[4]) parts.push(`<a href="mailto:${esc(m[4])}">${esc(m[4])}</a>`);
      else if (m[5]) parts.push(`<a href="${esc(m[5])}">${esc(m[5])}</a>`);
      last = re.lastIndex;
    }
    parts.push(esc(text.slice(last)));
    return parts.join("");
    function a(url, label) {
      const external = /^https?:/.test(url);
      return `<a href="${esc(url)}"${external ? ' target="_blank" rel="noopener"' : ""}>${esc(label)}</a>`;
    }
  }

  function formatDate(iso) {
    const m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(iso || "");
    if (!m) return iso || "";
    const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
    if (LANG === "en") return new Date(y, mo - 1, d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    return `${y}年${mo}月${d}日`;
  }

  // お知らせ: 公開するものだけを新しい順に
  function sortNews(rows) {
    return rows
      .filter(r => r.news_id && String(r.published || "TRUE").toUpperCase() !== "FALSE")
      .sort((a, b) => (b.date || "").localeCompare(a.date || "") || Number(b.news_id) - Number(a.news_id));
  }

  const T = {
    ja: { siteName: "金沢市 食のバリアフリーマップ", about: "運営者情報", shops: "掲載店一覧", news: "お知らせ", other: "English" },
    en: { siteName: "Kanazawa Food Barrier-Free Map", about: "About us", shops: "Restaurants", news: "News", other: "日本語" },
  }[LANG];

  // ヘッダーとフッター（<div id="site-header"></div> と <div id="site-footer"></div> に入る）
  function renderChrome() {
    const hd = document.getElementById("site-header");
    if (hd) {
      hd.outerHTML = `<header class="g-hd">
        <a class="g-brand" href="${href("index.html")}"><img src="site/hd-brand-${LANG}.png" alt="${esc(T.siteName)}"></a>
        <a class="g-lang" href="${esc(langSwitchHref())}" lang="${LANG === "en" ? "ja" : "en"}">${esc(T.other)}</a>
      </header>`;
    }
    const ft = document.getElementById("site-footer");
    if (ft) {
      ft.outerHTML = `<footer class="g-ft">
        <div class="ft-brand">${esc(T.siteName)}</div>
        <ul class="ft-nav">
          <li><a href="${href("about.html")}">${esc(T.about)}</a></li>
          <li><a href="${href("search.html")}">${esc(T.shops)}</a></li>
          <li><a href="${href("news.html")}">${esc(T.news)}</a></li>
        </ul>
      </footer>`;
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", renderChrome);
  else renderChrome();

  return { CONFIG, LANG, params, esc, href, langSwitchHref, parseCSV, loadCSV, linkify, formatDate, sortNews };
})();
