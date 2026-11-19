/* ════════════════ shared shell — runs in both themes ════════════════
   Theme switch + transition, Projects page, project detail, media gallery, lightbox.
   Routes: #!projects  #!project/<id>  #!gallery  #!media/<id> */
(() => {
  const S = window.SITE;
  const html = document.documentElement;
  const THEME = html.dataset.theme;
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const NAMES = { f1: "F1 mode", dark: "Dark cinematic mode" };

  /* ───────── theme wipe + switch ───────── */
  const wipe = document.createElement("div");
  wipe.className = "theme-wipe";
  wipe.setAttribute("aria-hidden", "true");
  const paintWipe = (to) => {
    wipe.dataset.to = to;
    wipe.innerHTML = `<div class="tw-label"><span class="tw-sub">Shaik Ayaan · loading</span><span class="tw-name">${NAMES[to]}</span><span class="tw-bar"></span></div>`;
  };
  paintWipe(THEME);
  document.body.appendChild(wipe);
  const animateClip = (from, to, ms) => new Promise((resolve) => {
    if (REDUCED) { wipe.style.clipPath = to; return resolve(); }
    const a = wipe.animate([{ clipPath: from }, { clipPath: to }], { duration: ms, easing: "cubic-bezier(0.76, 0, 0.24, 1)", fill: "forwards" });
    a.onfinish = resolve;
  });

  let switching = false;
  async function switchTheme() {
    if (switching) return;
    switching = true;
    const to = THEME === "f1" ? "dark" : "f1";
    let section = "hero";
    try { section = window.__theme?.current?.() || "hero"; } catch {}
    try { localStorage.setItem("ayaan-theme", to); } catch {}
    try { sessionStorage.setItem("ayaan-switch", JSON.stringify({ to, section })); } catch {}
    paintWipe(to);
    wipe.classList.add("tw-show");
    await animateClip("inset(100% 0 0 0)", "inset(0 0 0 0)", 650);
    wipe.classList.add("tw-in");
    await new Promise((r) => setTimeout(r, REDUCED ? 0 : 150));
    const url = new URL(location.href);
    url.searchParams.delete("theme");
    url.hash = "";
    location.replace(url.toString()); // a fresh boot of the other experience: no stale WebGL, listeners or loops
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-theme-toggle]");
    if (!b) return;
    e.preventDefault();
    switchTheme();
  });

  // arriving from a switch: hold the wipe until the theme says it is ready, restore the section, wipe out
  if (html.classList.contains("is-switching")) {
    const sw = window.__switch || {};
    let done = false;
    const reveal = async () => {
      if (done) return; done = true;
      try { window.__theme?.go?.(sw.section); } catch {}
      await new Promise((r) => setTimeout(r, REDUCED ? 0 : 250));
      wipe.style.visibility = "visible";
      await animateClip("inset(0 0 0 0)", "inset(0 0 100% 0)", 650);
      html.classList.remove("is-switching");
      wipe.style.visibility = ""; wipe.getAnimations().forEach((a) => a.cancel()); wipe.style.clipPath = "";
    };
    addEventListener("theme:ready", reveal, { once: true });
    setTimeout(reveal, 5000); // backstop
  }

  /* ───────── shared helpers ───────── */
  const lenisStop = () => window.__lenis?.stop?.();
  const lenisStart = () => window.__lenis?.start?.();
  const KIND = { built: "built", concept: "concept", ongoing: "ongoing", team: "team" };
  const block = (title, body) => (body ? `<section class="ui-block"><h2>${title}</h2>${body}</section>` : "");
  const para = (v) => (v ? `<p>${esc(v)}</p>` : "");
  const mediaThumb = (m) => m.thumb || m.preview || m.src;
  const card = (p) => {
    const c = S.coverOf(p);
    return `<a class="ui-card" href="#!project/${p.id}" data-filters="${p.filters.join(" ")}">
      <div class="ui-media">${c ? `<img src="${esc(mediaThumb(c))}" alt="" loading="lazy" decoding="async">` : `<div class="ui-ph"><b>${esc(p.title)}</b><span>${esc(p.category)}</span></div>`}<span class="ui-n">${p.n}</span></div>
      <div class="ui-card-body">
        <div class="ui-card-head"><h3>${esc(p.title)}</h3><span class="ui-year">${esc(p.year || "—")}</span></div>
        <p>${esc(p.summary)}</p>
        <div class="ui-meta-row"><span class="ui-chip" data-k="${KIND[p.statusKind] || "built"}">${esc(p.status)}</span><span class="ui-view">View project</span></div>
        <div class="ui-meta-row"><span>${esc(p.category)}</span></div>
      </div></a>`;
  };

  /* ───────── page layer ───────── */
  let page = null, pageKey = "", lastFocus = null;
  function openPage(key, htmlStr, label) {
    if (!page) {
      lastFocus = document.activeElement;
      page = document.createElement("div");
      page.className = "ui-page";
      page.setAttribute("role", "dialog");
      page.setAttribute("aria-modal", "true");
      page.setAttribute("data-lenis-prevent", "");
      document.body.appendChild(page);
      lenisStop();
      requestAnimationFrame(() => page.classList.add("ui-open"));
    }
    page.setAttribute("aria-label", label);
    if (pageKey !== key) { page.innerHTML = htmlStr; page.scrollTop = 0; pageKey = key; }
    page.querySelector("[data-close]")?.focus({ preventScroll: true });
  }
  function closePage() {
    if (!page) return;
    const p = page; page = null; pageKey = "";
    p.classList.remove("ui-open");
    setTimeout(() => p.remove(), REDUCED ? 0 : 320);
    lenisStart();
    lastFocus?.focus?.({ preventScroll: true });
  }
  const topBar = (crumb) => `<div class="ui-top"><span class="ui-crumb">Shaik Ayaan / <b>${crumb}</b></span>
    <div class="ui-actions"><a class="ui-btn" href="#!projects">Projects</a><a class="ui-btn" href="#!gallery">Gallery</a>
    <button class="ui-btn ui-solid" type="button" data-close>Close ✕</button></div></div>`;

  /* projects page */
  function projectsPage() {
    const counts = Object.fromEntries(S.FILTERS.map(([k]) => [k, k === "all" ? S.projects.length : S.projects.filter((p) => p.filters.includes(k)).length]));
    openPage("projects", `<div class="ui-wrap">${topBar("All projects")}
      <h1 class="ui-title">All <em>projects</em></h1>
      <p class="ui-sub">${S.counts.projects} projects — games, 3D, robotics, software and creative work.</p>
      <div class="ui-filters" role="group" aria-label="Filter projects">
        ${S.FILTERS.map(([k, l], i) => `<button class="ui-filter" type="button" data-filter="${k}" aria-pressed="${i === 0}">${l}<sup>${counts[k]}</sup></button>`).join("")}
      </div>
      <div class="ui-grid" data-grid>${S.projects.map(card).join("")}</div>
      <p class="ui-empty" data-empty hidden>No projects in this category yet.</p></div>`, "All projects");
    wireFilters(page, ".ui-card");
  }
  function wireFilters(root, itemSel) {
    root.querySelectorAll("[data-filter]").forEach((b) => b.addEventListener("click", () => {
      const k = b.dataset.filter;
      root.querySelectorAll("[data-filter]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      let shown = 0;
      root.querySelectorAll(itemSel).forEach((el) => { const on = k === "all" || el.dataset.filters.split(" ").includes(k); el.hidden = !on; if (on) shown += 1; });
      const empty = root.querySelector("[data-empty]"); if (empty) empty.hidden = shown > 0;
    }));
  }

  /* project detail */
  function projectPage(id) {
    const p = S.projectById[id];
    if (!p) return projectsPage();
    const media = S.mediaFor(id);
    const images = media.filter((m) => m.type === "image"), videos = media.filter((m) => m.type === "video"), docs = media.filter((m) => m.type === "pdf");
    const c = S.coverOf(p);
    const related = p.related.map((r) => S.projectById[r]).filter(Boolean);
    const ach = S.achievements.filter((a) => a.project === id);
    const thumbs = (list) => list.length
      ? `<div class="ui-thumbs">${list.map((m) => `<button class="ui-thumb" type="button" data-lb="${m.id}" data-set="${id}" aria-label="Open ${esc(m.caption)}"><img src="${esc(mediaThumb(m))}" alt="" loading="lazy">${m.type !== "image" ? `<span class="ui-type">${m.type}</span>` : ""}</button>`).join("")}</div>`
      : "";
    openPage("project:" + id, `<div class="ui-wrap">${topBar(esc(p.title))}
      ${c ? `<button class="ui-hero-img" type="button" data-lb="${c.id}" data-set="${id}" aria-label="Open image"><img src="${esc(c.src)}" alt="${esc(c.caption)}"></button>`
          : `<div class="ui-hero-img" style="cursor:default"><div class="ui-ph"><b>${esc(p.title)}</b><span>${esc(p.category)}</span></div></div>`}
      <h1 class="ui-d-title">${esc(p.title)}</h1>
      <dl class="ui-facts">
        <div><dt>Category</dt><dd>${esc(p.category)}</dd></div>${p.year ? `<div><dt>Year</dt><dd>${esc(p.year)}</dd></div>` : ""}
        <div><dt>Status</dt><dd>${esc(p.status)}</dd></div><div><dt>Project</dt><dd>${p.n} / ${String(S.projects.length).padStart(2, "0")}</dd></div>
      </dl>
      <div class="ui-cols">
        <div>
          ${block("Overview", para(p.overview))}
          ${block("My contribution", para(p.contribution))}
          ${block("Development process", p.process.length ? `<ol class="ui-steps">${p.process.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>` : "")}
          ${block("Image gallery", images.length ? thumbs(images) + `<span class="ui-credit">${[...new Set(images.map((m) => S.creditLabel(m.credit)))].join(" · ")}</span>` : "")}
          ${block("Video gallery", thumbs(videos))}
          ${block("Documents", thumbs(docs))}
        </div>
        <div>
          ${block("Technologies", p.technologies.length ? `<div class="ui-tags">${p.technologies.map((t) => `<span class="ui-chip">${esc(t)}</span>`).join("")}</div>` : "")}
          ${block("Results", para(p.results) + ach.map((a) => `<p style="margin-top:.5rem"><span class="ui-chip">${esc(a.title)} — ${esc(a.result)}</span></p>`).join(""))}
          ${block("Lessons learned", para(p.lessons))}
          ${block("Related projects", related.length ? `<div class="ui-related">${related.map((r) => `<a href="#!project/${r.id}">${esc(r.title)} <span>${esc(r.category)}</span></a>`).join("")}</div>` : "")}
        </div>
      </div></div>`, p.title);
  }

  /* gallery */
  function galleryPage() {
    const counts = Object.fromEntries(S.MEDIA_FILTERS.map(([k]) => [k, k === "all" ? S.media.length : S.media.filter((m) => m.category === k || (k === "videos" && m.type === "video")).length]));
    openPage("gallery", `<div class="ui-wrap">${topBar("Media gallery")}
      <h1 class="ui-title">Media <em>gallery</em></h1>
      <p class="ui-sub">${S.media.length} files — LAST SIGNAL renders and 3D assets, documents and certificates.</p>
      <div class="ui-filters" role="group" aria-label="Filter media">
        ${S.MEDIA_FILTERS.filter(([k]) => counts[k] > 0).map(([k, l], i) => `<button class="ui-filter" type="button" data-filter="${k}" aria-pressed="${i === 0}">${l}<sup>${counts[k]}</sup></button>`).join("")}
      </div>
      <div class="ui-masonry">${S.media.map((m) => {
        const proj = m.project ? S.projectById[m.project] : null;
        return `<button class="ui-tile" type="button" data-lb="${m.id}" data-set="all" data-filters="${m.category}${m.type === "video" ? " videos" : ""}">
          <span class="ui-tile-img"><img src="${esc(mediaThumb(m))}" alt="" loading="lazy" decoding="async"></span>
          <span class="ui-cap">${esc(m.caption)}<small>${m.type.toUpperCase()} · ${S.creditLabel(m.credit)}${proj ? ` · ${esc(proj.title)}` : ""}</small></span></button>`;
      }).join("")}</div>
      </div>`, "Media gallery");
    wireFilters(page, ".ui-tile");
  }

  /* ───────── lightbox ───────── */
  let lb = null, lbList = [], lbIndex = 0, lbFocus = null;
  function openLightbox(id, set) {
    lbList = set === "all" || !set ? S.media : S.mediaFor(set);
    if (!lbList.some((m) => m.id === id)) lbList = [S.mediaById[id]].filter(Boolean);
    lbIndex = Math.max(0, lbList.findIndex((m) => m.id === id));
    if (!lb) {
      lbFocus = document.activeElement;
      lb = document.createElement("div");
      lb.className = "ui-lb";
      lb.setAttribute("role", "dialog"); lb.setAttribute("aria-modal", "true"); lb.setAttribute("aria-label", "Media viewer");
      lb.setAttribute("data-lenis-prevent", "");
      lb.innerHTML = `<div class="ui-lb-top"><span data-lb-count></span><div class="ui-actions"><a class="ui-btn" data-lb-open target="_blank" rel="noopener">Open file</a><button class="ui-btn" type="button" data-lb-close>Close ✕</button></div></div>
        <div class="ui-lb-stage" data-lb-stage></div>
        <div class="ui-lb-foot"><p class="ui-lb-cap" data-lb-cap aria-live="polite"></p></div>
        <button class="ui-lb-nav ui-lb-prev" type="button" data-lb-prev aria-label="Previous">←</button><button class="ui-lb-nav ui-lb-next" type="button" data-lb-next aria-label="Next">→</button>`;
      document.body.appendChild(lb);
      lenisStop();
      lb.querySelector("[data-lb-close]").addEventListener("click", closeLightbox);
      lb.querySelector("[data-lb-prev]").addEventListener("click", () => stepLb(-1));
      lb.querySelector("[data-lb-next]").addEventListener("click", () => stepLb(1));
      let x0 = null;
      const stage = lb.querySelector("[data-lb-stage]");
      stage.addEventListener("pointerdown", (e) => { x0 = e.clientX; });
      stage.addEventListener("pointerup", (e) => { if (x0 === null) return; const dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 50) stepLb(dx < 0 ? 1 : -1); });
      requestAnimationFrame(() => lb.classList.add("ui-open"));
    }
    renderLb();
    lb.querySelector("[data-lb-close]").focus({ preventScroll: true });
  }
  function renderLb() {
    const m = lbList[lbIndex];
    const stage = lb.querySelector("[data-lb-stage]");
    const proj = m.project ? S.projectById[m.project] : null;
    if (m.type === "video") stage.innerHTML = `<video src="${esc(m.src)}" controls playsinline preload="metadata"></video>`;
    else if (m.type === "pdf") stage.innerHTML = m.preview ? `<img src="${esc(m.preview)}" alt="${esc(m.caption)}">` : `<iframe src="${esc(m.src)}" title="${esc(m.caption)}"></iframe>`;
    else stage.innerHTML = `<img src="${esc(m.src)}" alt="${esc(m.caption)}">`;
    lb.querySelector("[data-lb-count]").textContent = `${lbIndex + 1} / ${lbList.length}`;
    lb.querySelector("[data-lb-cap]").innerHTML = `${esc(m.caption)}<small>${m.type.toUpperCase()} · ${S.creditLabel(m.credit)}${proj ? ` · <a href="#!project/${proj.id}">${esc(proj.title)} ↗</a>` : ""}</small>`;
    const open = lb.querySelector("[data-lb-open]"); open.href = m.src;
    open.textContent = m.type === "pdf" ? "Open PDF" : "Open file";
    const multi = lbList.length > 1;
    lb.querySelectorAll(".ui-lb-nav").forEach((b) => { b.hidden = !multi; });
  }
  const stepLb = (d) => { if (!lb || lbList.length < 2) return; lbIndex = (lbIndex + d + lbList.length) % lbList.length; renderLb(); };
  function closeLightbox() {
    if (!lb) return;
    const l = lb; lb = null;
    l.querySelector("video")?.pause();
    l.classList.remove("ui-open");
    setTimeout(() => l.remove(), REDUCED ? 0 : 320);
    if (!page) lenisStart();
    lbFocus?.focus?.({ preventScroll: true });
    if (location.hash.startsWith("#!media/")) clearHash();
  }
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-lb]");
    if (t) { e.preventDefault(); openLightbox(t.dataset.lb, t.dataset.set); return; }
    if (e.target.closest("[data-close]")) { e.preventDefault(); clearHash(); closePage(); }
  });
  addEventListener("keydown", (e) => {
    if (lb) {
      if (e.key === "Escape") { e.preventDefault(); closeLightbox(); }
      else if (e.key === "ArrowRight") stepLb(1);
      else if (e.key === "ArrowLeft") stepLb(-1);
      return;
    }
    if (page && e.key === "Escape") { clearHash(); closePage(); }
  });

  /* ───────── router ───────── */
  function clearHash() { history.replaceState(null, "", location.pathname + location.search); }
  function route() {
    const h = location.hash;
    if (!h.startsWith("#!")) { closePage(); return; }
    const [name, arg] = h.slice(2).split("/");
    if (name === "projects") projectsPage();
    else if (name === "project") projectPage(arg);
    else if (name === "gallery") galleryPage();
    else if (name === "media") { if (S.mediaById[arg]) openLightbox(arg, "all"); }
  }
  addEventListener("hashchange", route);
  if (location.hash.startsWith("#!")) setTimeout(route, 0);

  window.SiteUI = { switchTheme, openLightbox, route };
})();
