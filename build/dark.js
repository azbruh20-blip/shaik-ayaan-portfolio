import Lenis from "lenis";

/* ════════════════ THEME 02 — CINEMATIC DARK ════════════════
   Built only when html[data-theme="dark"]. All content comes from window.SITE. */
const S = window.SITE;
const P = S.profile;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const SWITCHING = document.documentElement.classList.contains("is-switching");
if (REDUCED) document.documentElement.classList.add("mv-reduced");
const SKIP_PRE = REDUCED || SWITCHING;
const REVEAL_DELAY = SKIP_PRE ? 250 : 2500;
const hoverCapable = () => matchMedia("(hover: hover) and (min-width: 769px)").matches;

document.getElementById("f1-root")?.remove(); // the F1 experience is not mounted in this theme at all

/* adaptive grid above 1920 */
const FONT_BASE = 16, BASE_W = 1920, COEF = 0.6666;
function applyAdaptiveGrid() {
  const w = innerWidth;
  const size = FONT_BASE - (FONT_BASE * (((BASE_W - w) / BASE_W) * 100 * COEF)) / 100;
  if (size > FONT_BASE) document.documentElement.style.fontSize = size + "px"; else document.documentElement.style.removeProperty("font-size");
}
applyAdaptiveGrid(); addEventListener("resize", applyAdaptiveGrid);

/* ─── markup ─── */
const featured = ["last-signal", "aurora-7", "last-signal-assets", "arduino-robotics", "raspberry-pi-server", "adr-editing-ai"].map((id) => S.projectById[id]);
const spotlight = [
  { id: "last-signal", role: "Team project · NASA Space Apps 2026", image: "media/last-signal/mars_survival_mission_poster.webp" },
  { id: "arduino-robotics", role: "Robotics & electronics", image: null },
  { id: "adr-editing-ai", role: "Concept · Software & AI", image: null },
];
const stats = [
  [S.counts.projects, "Projects documented"], [S.counts.competitions, "Competitions attended"],
  [S.counts.awards, "Awards earned"], [S.counts.certificates, "Certificates completed"],
];
const principles = [
  ["01", "Stay curious", "Robotics, AI, space, games — I follow whatever makes me ask how it actually works."],
  ["02", "Learn by building", "I learn fastest by making real things: robots, a team server, game assets, app ideas."],
  ["03", "Experiment fearlessly", "Not every experiment works. The broken ones usually teach me the most."],
  ["04", "Keep improving", "Every competition and project shows me what to get better at next."],
];
const TOGGLE_ICON = `<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor"/><path d="M8 1.5a6.5 6.5 0 0 0 0 13Z" fill="currentColor"/></svg>`;
const heading = (text) => `<span class="mv-sr">${esc(text)}</span><span aria-hidden="true" data-lines>${esc(text)}</span>`;

let filterId = 0;
function liquid({ src, alt = "", label = "", bare = false, peak = 28, fit = "cover", pos = "center", tag = "" }) {
  const id = `mv-liq-${++filterId}`;
  return `<figure class="mv-liquid${bare ? " mv-bare" : ""}" role="img" aria-label="${esc(alt || label)}" data-peak="${peak}">
    <svg class="mv-filter" aria-hidden="true"><filter id="${id}" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.009" numOctaves="2" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="1"/></filter></svg>
    ${src ? `<img src="${esc(src)}" alt="" loading="lazy" decoding="async" style="filter:url(#${id});object-fit:${fit};object-position:${pos}">`
      : `<div class="mv-ph"><b>${esc(label)}</b>${tag ? `<span>${esc(tag)}</span>` : ""}</div>`}
    ${bare ? "" : `<div class="mv-veil"></div><div class="mv-glow"></div><div class="mv-vignette"></div>`}
  </figure>`;
}
const cover = (p) => S.coverOf(p);
const outcome = (p) => p.status;

const root = document.getElementById("dark-root");
root.innerHTML = `
<div class="mv-pre" aria-hidden="true" data-pre>
  <p class="mv-pre-brand">${esc(P.name)}</p>
  <p class="mv-pre-count"><span data-count>0</span><i>%</i></p>
</div>
<header class="mv-header">
  <nav class="mv-nav" aria-label="Primary">
    <a class="mv-logo" href="#mv-top" data-anchor><span class="mv-mono">SA</span><span class="mv-logo-name">${esc(P.name)}</span></a>
    <div class="mv-nav-right">
      <ul class="mv-links">
        <li><a href="#mv-story" data-anchor>About</a></li><li><a href="#mv-projects" data-anchor>Projects</a></li>
        <li><a href="#mv-impact" data-anchor>Journey</a></li><li><a href="#mv-spotlight" data-anchor>Spotlight</a></li>
        <li><a href="#!gallery">Gallery</a></li><li><a href="#mv-contact" data-anchor>Contact</a></li>
      </ul>
      <button class="mv-toggle" type="button" data-theme-toggle aria-label="Switch to F1 Mode — a different version of this site">${TOGGLE_ICON}<span class="mv-tt-label">F1 mode</span></button>
      <button class="mv-burger" type="button" aria-label="Open menu" aria-expanded="false" data-burger><span></span><span></span><span></span></button>
    </div>
  </nav>
</header>
<div class="mv-menu" data-menu role="dialog" aria-modal="true" aria-label="Menu">
  <ul>
    ${[["mv-story", "About"], ["mv-projects", "Projects"], ["mv-impact", "Journey"], ["mv-achievements", "Achievements"], ["mv-spotlight", "Spotlight"], ["mv-contact", "Contact"]]
      .map(([h, l]) => `<li><a href="#${h}" data-anchor>${l}</a></li>`).join("")}
    <li><a href="#!projects">All projects</a></li><li><a href="#!gallery">Gallery</a></li>
    <li><button type="button" data-theme-toggle>F1 mode</button></li>
  </ul>
</div>
<main class="mv-main">
  <section class="mv-hero" id="mv-top" aria-labelledby="mv-name">
    <div class="mv-hero-top">
      <h2 class="mv-roles"><span class="mv-sr">Student developer, robotics enthusiast, game creator, creative technologist.</span>
        ${["Student Developer", "Robotics Enthusiast", "Game Creator", "Creative Technologist"].map((r) => `<span class="mv-line" aria-hidden="true" data-role><span>${r}</span></span>`).join("")}</h2>
      <p class="mv-hero-desc mv-fade" data-desc>${esc(P.intro[0])} <br><br>${esc(P.tagline)}</p>
    </div>
    <div class="mv-portrait">${liquid({ src: "media/ayaan-cutout.webp", alt: P.name, bare: true, peak: 30, fit: "contain", pos: "center bottom" })}</div>
    <div class="mv-hero-fade" aria-hidden="true"></div>
    <h1 class="mv-name" id="mv-name"><span class="mv-sr">${esc(P.name)}</span>
      ${["Shaik", "Ayaan"].map((w) => `<span class="mv-name-line" aria-hidden="true" data-name-line>${Array.from(w).map((ch) => `<span>${ch}</span>`).join("")}</span>`).join("")}</h1>
    <p class="mv-cue mv-fade" data-cue>Scroll to enter</p>
  </section>

  <section class="mv-marquee" aria-label="Interests">
    <div class="mv-track">${[...P.interests, ...P.interests].map((w) => `<span>${esc(w)}</span>`).join("")}</div>
  </section>

  <section class="mv-section" id="mv-story" aria-labelledby="mv-story-h">
    <div class="mv-story">
      <div>
        <p class="mv-eyebrow">About Ayaan</p>
        <h2 class="mv-heading mv-h" id="mv-story-h" style="max-width:16ch">${heading("Curiosity is where everything starts.")}</h2>
        <p class="mv-lead mv-fade" data-io>${esc(P.about)}</p>
        <p class="mv-lead mv-fade" data-io style="font-size:var(--fs-body);line-height:1.6">${esc(P.intro.slice(1).join(" "))}</p>
        <p class="mv-meta-label mv-fade" data-io style="margin-top:2rem">${esc(P.grade)} · ${esc(P.school)} · ${esc(P.location)}</p>
      </div>
      <ul class="mv-principles">
        ${principles.map(([n, t, d], i) => `<li class="mv-fade" data-io style="--mv-d:560ms;transition-delay:${i * 90}ms"><span class="mv-n">${n}</span><div><h3>${t}</h3><p>${d}</p></div></li>`).join("")}
      </ul>
    </div>
  </section>

  <section class="mv-section" id="mv-projects" aria-labelledby="mv-projects-h">
    <div class="mv-head-row">
      <div><p class="mv-eyebrow">Selected Projects</p><h2 class="mv-heading mv-h" id="mv-projects-h" style="max-width:14ch">${heading("Things I've built and explored.")}</h2></div>
      <p class="mv-meta-label">${String(featured.length).padStart(2, "0")} / Featured · <a href="#!projects">All ${S.counts.projects} projects</a></p>
    </div>
    <ul class="mv-grid">
      ${featured.map((p, i) => `<li class="mv-fade" data-io style="--mv-y:60px;--mv-d:620ms;transition-delay:${i % 2 ? 120 : 0}ms">
        <article class="mv-card">
          <a class="mv-cover" href="#!project/${p.id}" aria-label="${esc(p.title)}">${liquid({ src: cover(p)?.thumb, alt: p.title, label: p.title, peak: 28, tag: p.category })}</a>
          <div class="mv-card-row">
            <div><h3>${esc(p.title)}</h3><p class="mv-card-blurb">${esc(p.summary)}</p></div>
            <div class="mv-card-side">${p.year ? `<p class="mv-card-year">${esc(p.year)}</p>` : ""}<p class="mv-card-out">${esc(outcome(p))}</p></div>
          </div>
          <div class="mv-card-foot"><span>${esc(p.category)}</span><a href="#!project/${p.id}">View project</a></div>
        </article></li>`).join("")}
    </ul>
  </section>

  <section class="mv-section" id="mv-impact" aria-labelledby="mv-impact-h">
    <div class="mv-head-row"><div><p class="mv-eyebrow">My Journey In Numbers</p><h2 class="mv-heading mv-h" id="mv-impact-h" style="font-size:var(--fs-h2);line-height:1">${heading("Grade 9, measured.")}</h2></div>
      <p class="mv-meta-label">Counted from the record</p></div>
    <dl class="mv-stats">
      ${stats.map(([v, l], i) => `<div class="mv-fade" data-io style="--mv-d:560ms;transition-delay:${i * 110}ms"><dt>${l}</dt><dd data-countup="${v}">${v}</dd></div>`).join("")}
    </dl>
  </section>

  <section class="mv-section" id="mv-achievements" aria-labelledby="mv-ach-h">
    <div class="mv-head-row"><div><p class="mv-eyebrow">Competitions &amp; Achievements</p><h2 class="mv-heading mv-h" id="mv-ach-h" style="font-size:var(--fs-h2);line-height:1">${heading("Where I've competed.")}</h2></div>
      <p class="mv-meta-label">${S.counts.competitions} competitions · ${S.counts.certificates} certificates</p></div>
    <ul class="mv-ach">
      ${S.achievements.map((a, i) => {
        const href = a.certificate ? `#!media/${a.certificate}` : a.project ? `#!project/${a.project}` : null;
        const quiet = a.kind === "participation" || a.kind === "certificate" || a.kind === "course";
        return `<li class="mv-fade" data-io style="--mv-d:560ms;transition-delay:${(i % 4) * 90}ms">
          <span class="mv-n">${String(i + 1).padStart(2, "0")}</span>
          <h3>${esc(a.title)}</h3>
          <span class="mv-res${quiet ? " mv-quiet" : ""}">${esc(a.result)}${a.dateLabel ? ` · ${esc(a.dateLabel)}` : ""}${a.year ? ` · ${esc(a.year)}` : ""}</span>
          <span class="mv-cat">${esc([a.category, a.level, a.location].filter(Boolean).join(" · "))}</span>
          ${href ? `<a class="mv-act" href="${href}">${a.certificate ? "View certificate" : "View project"}</a>` : `<span></span>`}
        </li>`;
      }).join("")}
    </ul>
  </section>

  <section class="mv-section" id="mv-spotlight" aria-labelledby="mv-spot-h">
    <div class="mv-head-row"><div><p class="mv-eyebrow">Project Spotlight</p><h2 class="mv-heading mv-h" id="mv-spot-h" style="font-size:var(--fs-h2);line-height:1">${heading("Up close.")}</h2></div></div>
    <div class="mv-voices">
      <ul class="mv-sel" role="tablist" aria-label="Spotlight projects">
        ${spotlight.map((s, i) => `<li><button type="button" role="tab" data-spot="${i}" aria-selected="${i === 0}"${i === 0 ? ' class="mv-on"' : ""}>
          <span class="mv-i">${String(i + 1).padStart(2, "0")}</span><span class="mv-who"><b>${esc(S.projectById[s.id].title)}</b><span>${esc(s.role)}</span></span><span class="mv-rule"></span></button></li>`).join("")}
      </ul>
      <div class="mv-feature" role="tabpanel">
        <blockquote><p class="mv-quote" data-quote></p><footer data-quote-foot></footer></blockquote>
        <div class="mv-pic mv-fade" data-io data-pic></div>
      </div>
    </div>
  </section>

  <footer class="mv-contact" id="mv-contact" aria-labelledby="mv-contact-h">
    <p class="mv-eyebrow">Let's Build</p>
    <h2 class="mv-heading mv-h" id="mv-contact-h">${heading("Have an idea? Let's build something cool.")}</h2>
    <p class="mv-lead mv-fade" data-io>Robotics, games, AI or something nobody's tried yet — I'm always up for a new project or competition.</p>
    <a class="mv-email" href="mailto:${esc(P.contact.email)}">${esc(P.contact.email)} <i>↗</i></a>
    <div class="mv-footbar">
      <div><p class="mv-sign">${esc(P.name)}</p><p class="mv-sign-sub">${esc(P.tagline)}</p></div>
      <nav aria-label="Contact"><ul class="mv-social">
        <li><a href="mailto:${esc(P.contact.email)}">Email</a></li>
        ${P.contact.links.filter((l) => l.href).map((l) => `<li><a href="${esc(l.href)}" target="_blank" rel="noreferrer noopener">${esc(l.label)}</a></li>`).join("")}
        <li><span>${esc(P.grade)} · ${esc(P.location)}</span></li>
      </ul></nav>
      <p class="mv-copy">© ${new Date().getFullYear()} ${esc(P.name)}. All rights reserved.</p>
    </div>
  </footer>
</main>`;

/* ─── Lenis ─── */
const lenis = REDUCED ? null : new Lenis({ smoothWheel: true });
window.__lenis = lenis;
if (lenis) { const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
history.scrollRestoration = "manual";
scrollTo(0, 0);
const goTo = (el, immediate = false) => {
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { immediate, duration: 1.4 }); else el.scrollIntoView({ behavior: immediate || REDUCED ? "auto" : "smooth" });
};
document.addEventListener("click", (e) => {
  const a = e.target.closest("a[data-anchor]");
  if (!a) return;
  e.preventDefault();
  closeMenu();
  goTo(document.getElementById(a.getAttribute("href").slice(1)));
});

/* ─── mobile menu ─── */
const menu = $("[data-menu]"), burger = $("[data-burger]");
function openMenu() {
  menu.classList.add("mv-open"); burger.setAttribute("aria-expanded", "true"); burger.setAttribute("aria-label", "Close menu");
  $$("li", menu).forEach((li, i) => { li.style.transitionDelay = `${120 + i * 60}ms`; });
  lenis?.stop();
}
function closeMenu() {
  if (!menu.classList.contains("mv-open")) return;
  menu.classList.remove("mv-open"); burger.setAttribute("aria-expanded", "false"); burger.setAttribute("aria-label", "Open menu");
  $$("li", menu).forEach((li) => { li.style.transitionDelay = "0ms"; });
  lenis?.start();
}
burger.addEventListener("click", () => (menu.classList.contains("mv-open") ? closeMenu() : openMenu()));
menu.addEventListener("click", (e) => { if (e.target.closest("a")) closeMenu(); });
addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });
matchMedia("(min-width: 768px)").addEventListener("change", (e) => { if (e.matches) closeMenu(); });

/* ─── line splitting for heading reveals ─── */
function splitLines(el) {
  const text = el.dataset.text ?? el.textContent.trim();
  el.dataset.text = text;
  el.innerHTML = text.split(/\s+/).map((w) => `<span class="mv-wtmp">${esc(w)}</span>`).join(" ");
  const lines = [];
  let top = null;
  for (const w of el.querySelectorAll(".mv-wtmp")) {
    if (w.offsetTop !== top) { lines.push([]); top = w.offsetTop; }
    lines[lines.length - 1].push(w.textContent);
  }
  el.innerHTML = lines.map((l) => `<span class="mv-line"><span>${esc(l.join(" "))}</span></span>`).join("");
  return $$(".mv-line", el);
}
function revealLines(el, base = 0, stagger = 90) {
  const lines = $$(".mv-line", el);
  lines.forEach((l, i) => { l.firstElementChild.style.transitionDelay = `${base + i * stagger}ms`; l.classList.add("mv-in"); });
}

/* ─── liquid image hover: spring the filter attributes (tension 140, friction 13) ─── */
function wireLiquid(fig) {
  const disp = fig.querySelector("feDisplacementMap"), turb = fig.querySelector("feTurbulence");
  if (!disp) return;
  const peak = Number(fig.dataset.peak || 28);
  let v = 0, vel = 0, target = 0, raf = 0, last = 0;
  const step = (t) => {
    const dt = Math.min(64, last ? t - last : 16); last = t;
    for (let i = 0; i < dt; i += 1) { const a = -140e-6 * (v - target) - 13e-3 * vel; vel += a; v += vel; }
    disp.setAttribute("scale", (1 + (peak - 1) * Math.max(0, v)).toFixed(2));
    turb.setAttribute("baseFrequency", (0.009 + 0.013 * Math.max(0, v)).toFixed(4));
    if (Math.abs(vel) < 1e-5 && Math.abs(target - v) < 1e-3) { raf = 0; last = 0; return; }
    raf = requestAnimationFrame(step);
  };
  const go = (to) => { target = to; if (!raf) raf = requestAnimationFrame(step); };
  fig.addEventListener("pointerenter", () => { if (!hoverCapable() || REDUCED) return; fig.classList.add("mv-hot"); go(1); });
  fig.addEventListener("pointerleave", () => { fig.classList.remove("mv-hot"); go(0); });
}

/* ─── in-view, once ─── */
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    io.unobserve(e.target);
    const el = e.target;
    if (el.matches("[data-lines]")) revealLines(el, 0, 90);
    else el.classList.add("mv-in");
    const cu = el.querySelector?.("[data-countup]");
    if (cu) countUp(cu);
  }
}, { threshold: 0 });
function countUp(dd) {
  const to = Number(dd.dataset.countup);
  if (REDUCED || !Number.isFinite(to)) { dd.textContent = String(to); return; }
  const t0 = performance.now(), dur = 1400;
  const tick = (t) => { const u = Math.min(1, (t - t0) / dur); dd.textContent = String(Math.round(to * (1 - Math.pow(2, -10 * u)))); if (u < 1) requestAnimationFrame(tick); else dd.textContent = String(to); };
  dd.textContent = "0"; requestAnimationFrame(tick);
}

/* ─── spotlight ─── */
const quote = $("[data-quote]"), quoteFoot = $("[data-quote-foot]"), pic = $("[data-pic]");
let spotIndex = -1;
function setSpot(i) {
  if (i === spotIndex) return;
  spotIndex = i;
  const s = spotlight[i], p = S.projectById[s.id];
  $$("[data-spot]").forEach((b, j) => { b.classList.toggle("mv-on", j === i); b.setAttribute("aria-selected", String(j === i)); });
  const words = `“${p.summary}”`.split(" ");
  quote.classList.remove("mv-play");
  quote.innerHTML = words.map((w, k) => `<span class="mv-w" style="transition-delay:${k * 22}ms">${esc(w)}</span>`).join(" ");
  void quote.offsetWidth;
  requestAnimationFrame(() => quote.classList.add("mv-play"));
  quoteFoot.innerHTML = `My role — ${esc(p.contribution)}<br><a href="#!project/${p.id}">View project</a>`;
  pic.innerHTML = liquid({ src: s.image, alt: p.title, label: p.title, peak: 22, tag: p.status });
  wireLiquid(pic.querySelector(".mv-liquid"));
}
$$("[data-spot]").forEach((b) => {
  const i = Number(b.dataset.spot);
  b.addEventListener("click", () => setSpot(i));
  b.addEventListener("focus", () => setSpot(i));
  b.addEventListener("pointerenter", () => { if (hoverCapable()) setSpot(i); });
});
setSpot(0);

/* ─── boot: fonts first (line splitting measures them), then preloader → hero ─── */
const ready = () => window.dispatchEvent(new Event("theme:ready"));
(async () => {
  try { await document.fonts.ready; } catch {}
  for (const el of $$("[data-lines]")) { splitLines(el); io.observe(el); }
  $$("[data-io]").forEach((el) => io.observe(el));
  $$(".mv-liquid").forEach(wireLiquid);
  let lastW = innerWidth;
  addEventListener("resize", () => {
    if (innerWidth === lastW) return; lastW = innerWidth;
    for (const el of $$("[data-lines]")) { const shown = el.querySelector(".mv-line.mv-in"); splitLines(el); if (shown) $$(".mv-line", el).forEach((l) => { l.firstElementChild.style.transition = "none"; l.classList.add("mv-in"); }); }
  });

  const pre = $("[data-pre]");
  if (SKIP_PRE) { pre.remove(); ready(); }
  else {
    lenis?.stop();
    const count = $("[data-count]", pre), t0 = performance.now();
    await new Promise((resolve) => {
      const tick = (t) => { const u = Math.min(1, (t - t0) / 2000); count.textContent = String(Math.round(u * 100)); if (u < 1) requestAnimationFrame(tick); else resolve(); };
      requestAnimationFrame(tick);
    });
    $$(".mv-pre-brand, .mv-pre-count", pre).forEach((el) => { el.style.opacity = "0"; });
    await new Promise((r) => setTimeout(r, 300 + 200));
    pre.style.transition = "transform 650ms cubic-bezier(0.22,1,0.36,1)";
    pre.style.transform = "translateY(-100%)";
    await new Promise((r) => setTimeout(r, 650));
    pre.classList.add("mv-done"); pre.setAttribute("aria-hidden", "true"); pre.remove();
    lenis?.start();
    ready();
  }
})();

/* hero sequence, measured from page load */
const at = (ms, fn) => setTimeout(fn, REDUCED ? 0 : ms);
const nameLines = $$("[data-name-line]");
nameLines.forEach((line, li) => {
  $$("span", line).forEach((s, k) => { s.style.transitionDelay = `${k * 52}ms`; });
  at(REVEAL_DELAY + li * 240, () => line.classList.add("mv-in"));
});
$$("[data-role]").forEach((r, i) => { r.firstElementChild.style.transitionDelay = `${i * 80}ms`; at(REVEAL_DELAY + 200, () => r.classList.add("mv-in")); });
at(REVEAL_DELAY + 400, () => $("[data-desc]").classList.add("mv-in"));
at(REVEAL_DELAY + 900, () => $("[data-cue]").classList.add("mv-in"));

/* section map used by the theme switch to land you in the same place */
const SECTIONS = { hero: "mv-top", about: "mv-story", projects: "mv-projects", numbers: "mv-impact", achievements: "mv-achievements", spotlight: "mv-spotlight", contact: "mv-contact" };
window.__theme = {
  current() {
    let key = "hero";
    for (const [k, id] of Object.entries(SECTIONS)) { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top <= innerHeight * 0.4) key = k; }
    return key;
  },
  go(key) { const el = document.getElementById(SECTIONS[key]); if (el && key !== "hero") goTo(el, true); },
};
