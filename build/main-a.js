import * as THREE from "three";
import Lenis from "lenis";

/* ───────── utilities ───────── */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const pxd = (v) => `${((v / 1440) * 100).toFixed(4)}cqw`;
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const COARSE = matchMedia("(hover: none) and (pointer: coarse)").matches;
const readToken = (token) => {
  const probe = document.createElement("span");
  probe.style.cssText = `position:absolute;visibility:hidden;color:var(${token})`;
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  return resolved;
};
const tokenRgb = (token) => {
  const m = readToken(token).match(/[\d.]+/g).map(Number);
  return [m[0], m[1], m[2], m[3] ?? 1];
};
const errors = new Set();
function showError(url) {
  if (errors.has(url)) return;
  errors.add(url);
  let banner = $(".err-banner");
  if (!banner) { banner = document.createElement("div"); banner.className = "err-banner"; banner.setAttribute("role", "alert"); document.body.appendChild(banner); }
  banner.textContent = `Failed to load: ${[...errors].join(" · ")}`;
}
for (const img of $$("img")) img.addEventListener("error", () => showError(img.currentSrc || img.src.slice(0, 60)));

/* ───────── the shared ticker ───────── */
const subscribers = new Set();
let rafId = 0;
const loop = (time) => {
  rafId = requestAnimationFrame(loop);
  for (const sub of [...subscribers]) {
    if (time - sub.last > sub.rate()) { sub.last = time; sub.cb(time); }
  }
};
function subscribe(cb, rate = () => 0) {
  const sub = { cb, rate, last: -Infinity };
  subscribers.add(sub);
  if (!rafId) rafId = requestAnimationFrame(loop);
  return () => { subscribers.delete(sub); if (!subscribers.size && rafId) { cancelAnimationFrame(rafId); rafId = 0; } };
}

/* Lenis rides the ticker, registered first */
let lenis = null;
if (!REDUCED) {
  lenis = new Lenis({ smoothWheel: true });
  window.__lenis = lenis;
  subscribe((time) => lenis.raf(time), () => 0);
}

/* ───────── the spring (react-spring's solver) ───────── */
const active = new Set();
let springUnsub = null, springLast = 0;
class Spring {
  constructor(value, cfg, onChange) {
    this.value = value; this.target = value; this.velocity = 0;
    this.tension = cfg.tension; this.friction = cfg.friction; this.onChange = onChange; this.timer = 0;
  }
  to(target, delay = 0, cfg) {
    clearTimeout(this.timer);
    const go = () => {
      if (cfg) { this.tension = cfg.tension; this.friction = cfg.friction; }
      this.target = target;
      active.add(this);
      if (!springUnsub) { springLast = 0; springUnsub = subscribe(stepSprings); }
    };
    if (delay > 0) this.timer = setTimeout(go, delay); else go();
    return this;
  }
  jump(v) { clearTimeout(this.timer); this.value = this.target = v; this.velocity = 0; active.delete(this); this.onChange?.(v); }
  step(dt) {
    const k = this.tension * 1e-6, c = this.friction * 1e-3;
    for (let i = 0; i < dt; i += 1) {
      const a = -k * (this.value - this.target) - c * this.velocity;
      this.velocity += a; this.value += this.velocity;
    }
    const done = Math.abs(this.velocity) < 1e-4 && Math.abs(this.target - this.value) < 1e-3;
    if (done) { this.value = this.target; this.velocity = 0; }
    this.onChange?.(this.value);
    return done;
  }
}
function stepSprings(time) {
  const dt = springLast ? Math.min(64, Math.max(1, Math.round(time - springLast))) : 16;
  springLast = time;
  for (const s of [...active]) if (s.step(dt)) active.delete(s);
  if (!active.size) { springUnsub(); springUnsub = null; }
}
const CFG = {
  REVEAL: { tension: 90, friction: 26 }, ROW: { tension: 170, friction: 24 }, SHEET: { tension: 190, friction: 26 },
  FIGURE: { tension: 200, friction: 24 }, TYPE: { tension: 210, friction: 24 }, YEAR: { tension: 190, friction: 24 },
  COPY: { tension: 110, friction: 26 }, COPY2: { tension: 150, friction: 24 }, NAME: { tension: 190, friction: 24 },
  VEIL: { tension: 70, friction: 24 }, CLEAR: { tension: 140, friction: 26 }, LABEL: { tension: 110, friction: 26 },
  WAIT: { tension: 10, friction: 30 }, READY: { tension: 170, friction: 26 }, SETTLE: { tension: 32, friction: 26 },
  TRIGGER: { tension: 140, friction: 30 },
};
/* a plain tween ({ duration, easing }) */
function tween(duration, ease, onUpdate, onDone) {
  const start = performance.now();
  const off = subscribe((t) => {
    const u = Math.min(1, (t - start) / duration);
    onUpdate(ease(u));
    if (u >= 1) { off(); onDone?.(); }
  });
  return off;
}
const easeInOutSine = (u) => -(Math.cos(Math.PI * u) - 1) / 2;
const easeOutCubic = (u) => 1 - Math.pow(1 - u, 3);
const easeOutQuad = (u) => 1 - (1 - u) * (1 - u);

/* ───────── the text engine ───────── */
function insideHidden(el) { return !!el.closest("[aria-hidden='true']"); }
function split(el) {
  if (el._units) return el._units;
  const by = el.dataset.split || "words";
  const text = el.textContent.trim();
  el.textContent = "";
  el.classList.add("tx");
  if (by === "letters" && !el.style.columnGap) el.style.columnGap = "0";
  if (!insideHidden(el)) { const sr = document.createElement("span"); sr.className = "sr"; sr.textContent = text; el.appendChild(sr); }
  const parts = by === "words" ? text.split(/\s+/) : Array.from(text);
  const off = by === "words" ? 0.35 : 0.3;
  const cfg = el.dataset.cfg ? (([t, f]) => ({ tension: t, friction: f }))(el.dataset.cfg.split(",").map(Number)) : by === "words" ? CFG.REVEAL : CFG.YEAR;
  el._units = parts.map((part) => {
    const span = document.createElement("span");
    span.className = "u"; span.setAttribute("aria-hidden", "true"); span.textContent = part;
    el.appendChild(span);
    const apply = (p) => { span.style.opacity = p; span.style.transform = `translateY(${((1 - p) * off).toFixed(4)}em)`; };
    apply(0);
    return new Spring(0, cfg, apply);
  });
  return el._units;
}
function playSplit(el, base = 0, reverse = false) {
  const units = split(el);
  const stagger = Number(el.dataset.stagger || 110);
  const delay = Number(el.dataset.delay || 0) + base;
  units.forEach((s, i) => s.to(reverse ? 0 : 1, reverse ? 0 : delay + i * stagger));
}
/* a block that rises: { opacity 0, translateY(y) } → { 1, 0 } */
function riser(el, y = "0.75rem", cfg = CFG.REVEAL, prop = "translate") {
  if (el._rise) return el._rise;
  const apply = (p) => {
    el.style.opacity = p;
    const v = `calc(${y} * ${(1 - p).toFixed(4)})`;
    if (prop === "translate") el.style.translate = `0 ${v}`; else el.style.transform = `translateY(${v})`;
  };
  apply(0);
  el._rise = new Spring(0, cfg, apply);
  return el._rise;
}
/* in-view gate; `forward` holds once the element has gone up past the top */
function inView(el, onEnter, { rootMargin = "0px", once = false, onLeaveBelow } = {}) {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { onEnter(); if (once) io.disconnect(); }
      else if (e.boundingClientRect.top > 0) onLeaveBelow?.();
    }
  }, { rootMargin });
  io.observe(el);
  return io;
}
function forwardSplit(el) {
  split(el);
  inView(el, () => playSplit(el), { onLeaveBelow: () => playSplit(el, 0, true) });
}

/* ───────── scroll triggers ───────── */
const POSES = (bb, vh) => ({
  top_top: bb.top, center_top: bb.top + bb.height / 2, bottom_top: bb.bottom,
  top_bottom: bb.top - vh, center_bottom: bb.top + bb.height / 2 - vh, bottom_bottom: bb.bottom - vh,
  top_center: bb.top - vh / 2, center_center: bb.top + bb.height / 2 - vh / 2, bottom_center: bb.bottom - vh / 2,
});
function scrollTrigger(el, start, end, onProgress, { smooth = null } = {}) {
  let visible = false, after = 99;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) after = 0; });
  io.observe(el);
  const spring = smooth ? new Spring(0, smooth, (v) => onProgress(v)) : null;
  let lastP = -1;
  const compute = () => {
    const bb = el.getBoundingClientRect();
    const vh = innerHeight;
    const poses = POSES(bb, vh);
    const scrollStart = poses[start], scrollEnd = poses[end];
    const length = Math.abs(scrollStart - scrollEnd) || 1;
    const progress = Math.min(Math.max(0, 1 - (scrollStart + length) / length), 1);
    if (progress === lastP) return;
    lastP = progress;
    if (spring) spring.to(progress); else onProgress(progress);
  };
  subscribe(() => {
    if (!visible) { if (after > 10) return; after += 1; }
    compute();
  }, () => 10);
  requestAnimationFrame(compute);
  return { refresh: () => { lastP = -1; compute(); } };
}

/* root keeps scaling past 1920 */
const rootScale = () => { document.documentElement.style.fontSize = innerWidth > 1920 ? `${(16 * innerWidth) / 1920}px` : ""; };
rootScale(); addEventListener("resize", rootScale);

/* ───────── the sticky stack ───────── */
{
  const RECEDE_SCALE = 0.9, RECEDE_SHADE = 0.55;
  const layers = $$(".stack > .layer");
  const pinned = layers.slice(0, -1).map((layer, i) => ({ inner: $(".layer-inner", layer), shade: $(".layer-shade", layer), next: layers[i + 1] }));
  const phone = matchMedia("(max-width: 639px)");
  const apply = () => {
    const view = innerHeight || 1;
    const shrink = phone.matches ? 0 : 1 - RECEDE_SCALE;
    for (const { inner, shade, next } of pinned) {
      const p = Math.min(1, Math.max(0, 1 - next.getBoundingClientRect().top / view));
      inner.style.transform = p > 0 && shrink > 0 ? `scale(${1 - shrink * p})` : "";
      inner.style.willChange = p > 0 && shrink > 0 ? "transform" : "";
      shade.style.opacity = `${RECEDE_SHADE * p}`;
      inner.style.visibility = p >= 1 ? "hidden" : "visible";
    }
  };
  let queued = false;
  const onScroll = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; apply(); }); };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  apply();
}

/* anchor links: the stack's sticky layers report their stuck rect, so measure flow */
function targetY(id) {
  const el = document.getElementById(id);
  if (!el) return 0;
  const layer = el.closest(".stack > .layer");
  if (layer) {
    const stack = $("#stack");
    let y = stack.getBoundingClientRect().top + scrollY;
    for (const l of $$(".stack > .layer")) { if (l === layer) break; y += l.offsetHeight; }
    return y + (el === layer.querySelector("section") ? 0 : 0);
  }
  return el.getBoundingClientRect().top + scrollY;
}
document.addEventListener("click", (e) => {
  const a = e.target.closest("a[href^='#']");
  if (!a) return;
  const id = a.getAttribute("href").slice(1);
  closeSheet?.();
  if (id.startsWith("!")) return; // a shared route (projects page, gallery) — handled by the site shell
  e.preventDefault();
  const y = id === "top" ? 0 : targetY(id);
  if (lenis) lenis.scrollTo(y, { duration: 1.4 }); else scrollTo({ top: y, behavior: REDUCED ? "auto" : "smooth" });
});

/* corner brackets for the hero panels */
const CORNER = (cls) => `<svg class="corner c-${cls}" viewBox="0 0 10.5 10.5" aria-hidden="true"><path d="M0 0.5H10V10.5"/></svg>`;
for (const panel of $$("[data-corners]")) panel.insertAdjacentHTML("beforeend", ["tr", "tl", "bl", "br"].map(CORNER).join(""));

/* the featured-build panel's mini circuit */
{
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of CIRCUIT_PATH) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const pts = CIRCUIT_PATH.filter((_, i) => i % 3 === 0).map(([x, y]) => `${(x - x0).toFixed(1)},${(y - y0).toFixed(1)}`).join(" ");
  $("[data-hero-map]").innerHTML = `<svg viewBox="-8 -8 ${(x1 - x0 + 16).toFixed(0)} ${(y1 - y0 + 16).toFixed(0)}" preserveAspectRatio="xMaxYMid meet">
    <polyline points="${pts}" fill="none" stroke="var(--foreground)" stroke-width="7" stroke-linejoin="round"/>
    <circle cx="${(CIRCUIT_PATH[0][0] - x0).toFixed(1)}" cy="${(CIRCUIT_PATH[0][1] - y0).toFixed(1)}" r="14" fill="var(--accent)"/></svg>`;
}
