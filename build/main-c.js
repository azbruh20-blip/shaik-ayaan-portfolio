
/* ════════════════════════ 1 · hero wrapper, veil, entrance ════════════════════════ */
{ // hero record counts come from the shared SITE record
  const k = window.SITE.counts;
  $$(".stats dd", $("[data-hero]")).forEach((dd, i) => { dd.textContent = String([k.competitions, k.projects, k.certificates][i] ?? dd.textContent); });
}
const hero = $("[data-hero]");
const veil = $(".veil", hero);
const veilMask = "data:image/svg+xml," + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 434 512"><path fill="#000" d="M228 18C108 18 22 112 22 262c0 92 30 166 86 206 22 16 50 26 82 28l170 8c34 2 56-22 56-56v-92c0-12-10-22-22-22H236c-20 0-30-24-16-38l18-18c8-8 18-12 30-12h134C398 112 330 18 228 18Z"/></svg>`);
$(".veil-mark", veil).style.setProperty("--veil-mask", `url("${veilMask}")`);
const veilFill = $(".veil-fill", veil), meterFill = $(".veil-meter-fill", veil), veilContent = $(".veil-content", veil), meter = $(".veil-meter", veil);
const progress = new Spring(0, CFG.WAIT, (v) => { veilFill.style.transform = `scaleY(${v})`; meterFill.style.transform = `scaleX(${v})`; });
progress.to(0.7);
riser($(".veil-name", veil), "0.6rem", CFG.LABEL).to(1, 260);
const clear = new Spring(1, CFG.CLEAR, (v) => { veilContent.style.opacity = v; veilContent.style.transform = `translateY(${-0.75 * (1 - v)}rem)`; meter.style.opacity = v; });
const lift = new Spring(1, CFG.VEIL, (v) => { veil.style.opacity = v; });

let scene = null;
let handedOver = false;
function onReadyVeil() {
  if (handedOver) return;
  handedOver = true;
  window.dispatchEvent(new Event("theme:ready"));
  progress.to(1, 0, CFG.READY);
  veil.style.pointerEvents = "none";
  veil.setAttribute("aria-label", "Loaded");
  clear.to(0);
  setTimeout(() => {
    lift.to(0);
    scene?.beginRise();
    heroEntrance();
    const born = performance.now();
    const off = subscribe(() => {
      if (Number(getComputedStyle(veil).opacity) <= 0.004 || performance.now() - born > 3000) { off(); veil.remove(); }
    });
  }, 430 + 240);
}
function heroEntrance() {
  riser($(".masthead", hero), "1.25rem").to(1, 0);
  const id = $(".ident-id", hero); const fade = new Spring(0, CFG.REVEAL, (v) => { id.style.opacity = v; }); fade.to(1, 180);
  playSplit($(".name", hero), 180);
  $$("[data-meta]", hero).forEach((li, i) => riser(li).to(1, 180 + 260 + i * 130));
  riser($("[data-hero-panels]", hero), "1.25rem").to(1, 900);
  $$(".stats dd", hero).forEach((dd) => playSplit(dd, 900));
  riser($(".actions", hero), "1.25rem").to(1, 1500);
}
// prime hidden state
split($(".name", hero)); $$(".stats dd", hero).forEach(split);
$(".ident-id", hero).style.opacity = 0;
for (const el of [$(".masthead", hero), $("[data-hero-panels]", hero), $(".actions", hero)]) riser(el, "1.25rem");
$$("[data-meta]", hero).forEach((li) => riser(li));

function webglAvailable() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; }
}
function fallbackHero() {
  $(".hero-fallback", hero).style.display = "block";
  $(".hero-canvas", hero).style.display = "none";
  onReadyVeil();
}
if (!webglAvailable()) fallbackHero();
else {
  const canvas = $(".hero-canvas", hero);
  const box = $("[data-fitbox]", hero);
  try { scene = new HeroScene(canvas); } catch (err) { console.error(err); scene = null; fallbackHero(); }
  if (scene) {
    scene.onReady = onReadyVeil;
    scene.onError = (err) => { showError(`hero photograph (${err.message || err})`); fallbackHero(); };
    const applyFit = () => {
      const s = hero.getBoundingClientRect();
      const fit = box.offsetParent !== null ? (() => { const b = box.getBoundingClientRect(); return fitSubjectToBox(DEFAULT_PARAMS, { top: b.top - s.top, height: b.height }, hero.clientHeight); })() : null;
      scene.setParams({
        ...DEFAULT_PARAMS, ...fit,
        ...(matchMedia("(max-width: 1023px)").matches ? { bgRevealOpacity: 0 } : null),
        ...(matchMedia("(hover: none)").matches ? { autoSweepAmount: 0.76 } : null),
        ...(matchMedia("(max-width: 639px)").matches ? { sweepRadius: 0.95, sweepWarp: 0.18, autoSweepAmount: 0.55 } : null),
        ...(scene.tier.reveal ? null : { autoSweepAmount: 0 }),
      });
    };
    let pointerBound = false;
    const onPointer = (e) => scene.setPointer((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1);
    const bindPointer = () => {
      if (scene.tier.pointerEnabled && !pointerBound) { addEventListener("pointermove", onPointer, { passive: true }); pointerBound = true; }
      if (!scene.tier.pointerEnabled && pointerBound) { removeEventListener("pointermove", onPointer); pointerBound = false; }
    };
    bindPointer();
    let lastW = 0, queued = false;
    const resize = () => {
      queued = false;
      const w = hero.clientWidth, h = hero.clientHeight;
      const widthChanged = w !== lastW;
      if (!widthChanged && lastW && scene.tier.coarsePointer) return;
      lastW = w;
      scene.resize(w, h);
      if (widthChanged) { scene.retune(); bindPointer(); }
      applyFit();
    };
    new ResizeObserver(() => { if (!queued) { queued = true; requestAnimationFrame(resize); } }).observe(hero);
    matchMedia("(hover: none) and (pointer: coarse)").addEventListener("change", () => { scene.retune(); bindPointer(); applyFit(); });
    resize();
    let heroVisible = true, after = 0;
    new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; if (heroVisible) after = 0; }).observe(hero);
    subscribe((time) => {
      if (document.hidden) return;
      if (!heroVisible) { if (after > 10) return; after += 1; }
      if (scrollY > innerHeight * 1.15) return;
      scene.update(time);
    }, () => scene.tier.frameInterval);
  }
}

/* ════════════════════════ menu sheet ════════════════════════ */
let closeSheet = null;
{
  const burger = $("[data-burger]");
  let sheet = null, sheetSpring = null, items = [], lastFocus = null;
  const onKey = (e) => { if (e.key === "Escape") closeSheet(); };
  const open = () => {
    lastFocus = document.activeElement;
    sheet = document.createElement("div");
    sheet.className = "sheet"; sheet.setAttribute("role", "dialog"); sheet.setAttribute("aria-modal", "true"); sheet.setAttribute("aria-label", "Menu");
    const links = [...$$("[data-nav-list] a"), $(".garage")];
    sheet.innerHTML = `<div class="sheet-top"><a href="#top" class="logo" aria-label="Shaik Ayaan — home"><span class="logo-mark">SA</span><span class="logo-slash">/</span><span class="logo-word">ayaan</span></a>
      <button type="button" class="sheet-close" aria-label="Close menu"><span></span><span></span></button></div>
      <nav aria-label="Menu"><ul>${links.map((a) => `<li><a class="hov" href="${a.getAttribute("href")}">${a.textContent.replace(/[[\]→]/g, "").trim()}</a></li>`).join("")}
      <li><button type="button" class="hov sheet-theme" data-theme-toggle>Dark cinematic mode</button></li></ul></nav>`;
    document.body.appendChild(sheet);
    sheetSpring = new Spring(0, CFG.SHEET, (v) => { sheet.style.opacity = v; });
    sheetSpring.to(1);
    items = $$("li", sheet).map((li, i) => { const s = riser(li, "0.75rem", CFG.ROW); s.to(1, 120 + i * 55); return s; });
    $(".sheet-close", sheet).addEventListener("click", closeSheet);
    document.documentElement.classList.add("locked");
    lenis?.stop();
    burger.setAttribute("aria-expanded", "true");
    addEventListener("keydown", onKey);
    $(".sheet-close", sheet).focus();
  };
  closeSheet = () => {
    if (!sheet) return;
    const s = sheet; sheet = null;
    document.documentElement.classList.remove("locked");
    lenis?.start();
    burger.setAttribute("aria-expanded", "false");
    removeEventListener("keydown", onKey);
    s.remove();
    lastFocus?.focus?.();
  };
  burger.addEventListener("click", open);
  matchMedia("(min-width: 1280px)").addEventListener("change", (e) => { if (e.matches) closeSheet(); });
}

/* ════════════════════════ generic reveals on scroll ════════════════════════ */
for (const el of $$("[data-split][data-mode='forward']")) {
  if (el.closest("[data-hero]")) continue;
  forwardSplit(el);
}
for (const stop of $$("[data-stop]")) {
  const s = new Spring(0, CFG.REVEAL, (v) => { stop.style.opacity = v; });
  inView(stop, () => s.to(1, Number(stop.dataset.stop)), { onLeaveBelow: () => s.to(0) });
}
for (const rule of $$("[data-rule]")) {
  const s = new Spring(0, CFG.REVEAL, (v) => { rule.style.opacity = v; rule.style.transform = `scaleX(${v})`; });
  inView(rule, () => s.to(1, Number(rule.dataset.rule)), { onLeaveBelow: () => s.to(0) });
}

/* ════════════════════════ chequered seams ════════════════════════ */
function noiseHash(x, y) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
for (const band of $$("[data-seam]")) {
  const canvas = $("canvas", band);
  const ctx = canvas.getContext("2d");
  const carry = band.dataset.seam;
  const CELL = 24, SOLID_UNTIL = 0.16, LIFT = 2, ACCENT_SHARE = 0.06;
  let prog = 0, accent, surface;
  const render = () => {
    const ratio = Math.min(devicePixelRatio, 2);
    const width = band.clientWidth, height = band.clientHeight;
    if (!width || !height) return;
    const w = Math.round(width * ratio), h = Math.round(height * ratio);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    accent ??= readToken("--accent");
    surface ??= readToken(carry === "light" ? "--background" : "--surface-black");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const cell = Number.parseFloat(getComputedStyle(band).getPropertyValue("--flag-cell")) || CELL;
    const columns = Math.ceil(width / cell), rows = Math.ceil(height / cell), lift = prog * LIFT;
    for (let y = 0; y < rows; y += 1) {
      const depth = y / Math.max(1, rows - 1) + lift;
      if (depth > 1) break;
      const solid = depth <= SOLID_UNTIL;
      const fade = clamp01(1 - (depth - SOLID_UNTIL) / (1 - SOLID_UNTIL));
      if (!solid && fade <= 0) break;
      for (let x = 0; x < columns; x += 1) {
        if (!solid) {
          if ((x + y) % 2 !== 0) continue;
          if (noiseHash(x, y) > fade) continue;
        }
        ctx.fillStyle = !solid && noiseHash(x + 101, y + 57) < ACCENT_SHARE ? accent : surface;
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }
  };
  scrollTrigger(band, "top_bottom", "top_top", (v) => { prog = v; render(); }, { smooth: CFG.TRIGGER });
  new ResizeObserver(render).observe(band);
}

/* ════════════════════════ 3 · the record — circuit stage ════════════════════════ */
const season = $("[data-season]");
{
  const frame = $("[data-stage-frame]", season), stage = $("[data-stage]", season);
  let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
  for (const [x, y] of CIRCUIT_PATH) { bx0 = Math.min(bx0, x); by0 = Math.min(by0, y); bx1 = Math.max(bx1, x); by1 = Math.max(by1, y); }
  const TRACK_BOX = { x: bx0 - 46, y: by0 - 46, width: bx1 - bx0 + 92, height: by1 - by0 + 92 };
  const fit = () => {
    const w = frame.clientWidth, h = frame.clientHeight;
    if (innerWidth >= 1024) {
      const s = Math.max(w / 1440, h / 800);
      stage.style.transform = `translate(${(w - 1440 * s) / 2}px, ${(h - 800 * s) / 2}px) scale(${s})`;
    } else {
      const s = w / TRACK_BOX.width;
      const cx = TRACK_BOX.x + TRACK_BOX.width / 2, cy = TRACK_BOX.y + TRACK_BOX.height / 2;
      stage.style.transform = `translate(${w / 2 - cx * s}px, ${h / 2 - cy * s + (innerWidth < 640 ? h * 0.08 : 0)}px) scale(${s})`;
    }
  };
  new ResizeObserver(fit).observe(frame); fit();

  /* the map SVG */
  const svg = $("[data-map]", season);
  const big = 4000;
  svg.innerHTML = `
    <defs>
      <mask id="flagcut" maskUnits="userSpaceOnUse" x="-4000" y="-4000" width="10560" height="9440">
        <rect x="-4000" y="-4000" width="10560" height="9440" fill="#fff"/>
        <rect x="${-FLAG_CUT.along / 2}" y="${-FLAG_CUT.across / 2}" width="${FLAG_CUT.along}" height="${FLAG_CUT.across}" fill="#000" transform="translate(${FLAG_CUT.x} ${FLAG_CUT.y}) rotate(${FLAG_CUT.angle})"/>
      </mask>
      <mask id="lapmask" maskUnits="userSpaceOnUse" x="0" y="0" width="2560" height="1440">
        <path data-lap d="${LAP_CENTRELINE}" fill="none" stroke="#fff" stroke-width="${LAP_MASK_WIDTH}" stroke-linecap="round" stroke-linejoin="round"
          stroke-dasharray="${LAP_LENGTH + 60} ${LAP_LENGTH + 60}" stroke-dashoffset="${60 + LAP_LENGTH}"/>
      </mask>
    </defs>
    <g id="grid">
      <g data-axes stroke="var(--map-grid)" stroke-width="${GRID_STROKE}" stroke-dasharray="${GRID_DASH}" fill="none">
        ${GRID_AXES_X.map((x) => `<line x1="${x}" y1="${-big}" x2="${x}" y2="${1440 + big}"/>`).join("")}
        <line x1="${-big}" y1="${GRID_AXIS_Y}" x2="${2560 + big}" y2="${GRID_AXIS_Y}"/>
      </g>
      ${RINGS.map((r) => `<circle cx="${HUB.x}" cy="${HUB.y}" r="${r.r}" fill="none" stroke="var(${r.ghost ? "--map-grid-ghost" : "--map-grid"})" stroke-width="${r.width}"/>`).join("")}
      <circle data-ping cx="${HUB.x}" cy="${HUB.y}" r="${HUB.r}" fill="none" stroke="var(--accent)" stroke-width="${GRID_STROKE}" opacity="0"/>
      ${CORNER_MARKS.map(([x, y]) => `<rect x="${x - CORNER_MARK_SIZE / 2}" y="${y - CORNER_MARK_SIZE / 2}" width="${CORNER_MARK_SIZE}" height="${CORNER_MARK_SIZE}" fill="var(--map-mark)"/>`).join("")}
      <circle cx="${HUB.x}" cy="${HUB.y}" r="${HUB.r}" fill="var(--map-mark)"/>
    </g>
    <g mask="url(#flagcut)">
      <path d="${TRACK_RIBBON}" fill="var(--foreground-on-dark)"/>
      <path d="${TRACK_RIBBON}" fill="var(--accent)" mask="url(#lapmask)"/>
    </g>
    <g id="markers">
      ${TURNS.map((t) => `<polygon points="${TURN_POINTS}" fill="var(--accent)" transform="translate(${t.x} ${t.y}) rotate(${t.angle})"/>`).join("")}
      <path d="${FLAG_DIAMONDS}" fill="var(--map-mark)"/>
    </g>`;
  const axes = $("[data-axes]", svg), ping = $("[data-ping]", svg), lapPath = $("[data-lap]", svg);
  const meridian = $("[data-meridian]", season);

  /* the lap */
  const trace = $("[data-trace]", season);
  const tctx = trace.getContext("2d");
  const traceRatio = Math.min(devicePixelRatio, COARSE ? 1 : 2);
  trace.width = 1440 * traceRatio; trace.height = 800 * traceRatio;
  const LINE_WIDTH = 5.9, GLOW_WIDTH = 15, HEAD_UNITS = 210, MARKER_POP_UNITS = 90, CORNER_BRAKE = 9;
  const CUT_CENTRE = mapToArtboard(FLAG_CUT.x, FLAG_CUT.y);
  const CUT_SCALE = 1438.43 / 2560;
  const CUT_ALONG = FLAG_CUT.along * CUT_SCALE, CUT_ACROSS = FLAG_CUT.across * CUT_SCALE;
  const CUMULATIVE = CIRCUIT_PATH.reduce((acc, point, index) => {
    if (index === 0) return [0];
    const prev = CIRCUIT_PATH[index - 1];
    acc.push(acc[index - 1] + Math.hypot(point[0] - prev[0], point[1] - prev[1]));
    return acc;
  }, []);
  const TOTAL = CUMULATIVE[CUMULATIVE.length - 1];
  const TIME_AT = (() => {
    const count = CIRCUIT_PATH.length;
    const turn = new Array(count).fill(0);
    for (let i = 1; i < count - 1; i += 1) {
      const [ax, ay] = CIRCUIT_PATH[i - 1], [bx, by] = CIRCUIT_PATH[i], [cx, cy] = CIRCUIT_PATH[i + 1];
      const ux = bx - ax, uy = by - ay, vx = cx - bx, vy = cy - by;
      const lengths = (Math.hypot(ux, uy) || 1) * (Math.hypot(vx, vy) || 1);
      turn[i] = Math.acos(Math.min(1, Math.max(-1, (ux * vx + uy * vy) / lengths)));
    }
    const win = 6;
    const smoothed = turn.map((_, i) => { let sum = 0, n = 0; for (let j = Math.max(0, i - win); j <= Math.min(count - 1, i + win); j += 1) { sum += turn[j]; n += 1; } return sum / n; });
    const accumulated = [0];
    for (let i = 1; i < count; i += 1) {
      const span = CUMULATIVE[i] - CUMULATIVE[i - 1];
      const speed = 1 / (1 + CORNER_BRAKE * smoothed[i]);
      accumulated.push(accumulated[i - 1] + span / speed);
    }
    const total = accumulated[count - 1] || 1;
    return accumulated.map((v) => v / total);
  })();
  const distanceAtTime = (time) => {
    if (time <= 0) return 0;
    if (time >= 1) return TOTAL;
    let low = 0, high = TIME_AT.length - 1;
    while (low < high - 1) { const mid = (low + high) >> 1; if (TIME_AT[mid] <= time) low = mid; else high = mid; }
    const span = TIME_AT[high] - TIME_AT[low] || 1;
    return CUMULATIVE[low] + (CUMULATIVE[high] - CUMULATIVE[low]) * ((time - TIME_AT[low]) / span);
  };
  const palette = { accent: [2, 210, 227], white: [255, 255, 255], bright: [141, 243, 250], dot: [122, 122, 122] };
  const rgba = ([r, g, b], a) => `rgb(${r} ${g} ${b} / ${a})`;
  const mixc = (a, b, t) => [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)];
  const trailUpTo = (distance) => {
    const out = [];
    for (let i = 0; i < CIRCUIT_PATH.length; i += 1) {
      if (CUMULATIVE[i] <= distance) { out.push(CIRCUIT_PATH[i]); continue; }
      const a = CIRCUIT_PATH[i - 1], b = CIRCUIT_PATH[i];
      const ratio = (distance - CUMULATIVE[i - 1]) / (CUMULATIVE[i] - CUMULATIVE[i - 1]);
      out.push([a[0] + (b[0] - a[0]) * ratio, a[1] + (b[1] - a[1]) * ratio]);
      break;
    }
    return out;
  };
  const strokePts = (ctx, pts, scale, from = 0) => {
    ctx.beginPath(); ctx.moveTo(pts[from][0] * scale, pts[from][1] * scale);
    for (let i = from + 1; i < pts.length; i += 1) ctx.lineTo(pts[i][0] * scale, pts[i][1] * scale);
    ctx.stroke();
  };
  const drawTrail = (ctx, pts, scale, minWidth, glow, heat) => {
    if (pts.length < 2) return;
    const width = Math.max(minWidth, LINE_WIDTH * scale);
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    if (glow) {
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = rgba(palette.accent, 0.05); ctx.lineWidth = GLOW_WIDTH * scale; strokePts(ctx, pts, scale);
      ctx.strokeStyle = rgba(palette.accent, 0.1); ctx.lineWidth = GLOW_WIDTH * 0.45 * scale; strokePts(ctx, pts, scale);
      ctx.restore();
    }
    const head = Math.max(2, Math.round(HEAD_UNITS / CIRCUIT_STEP));
    const from = Math.max(0, pts.length - head);
    const tip = pts[pts.length - 1];
    const hot = ctx.createLinearGradient(pts[from][0] * scale, pts[from][1] * scale, tip[0] * scale, tip[1] * scale);
    hot.addColorStop(0, rgba(palette.accent, 0)); hot.addColorStop(0.45, rgba(palette.accent, 0.9));
    hot.addColorStop(1, rgba(mixc(palette.accent, palette.bright, heat), 1));
    ctx.strokeStyle = hot; ctx.lineWidth = width; strokePts(ctx, pts, scale, from);
    const coreFrom = Math.max(0, pts.length - Math.round(head * 0.42));
    if (pts.length - coreFrom > 1) {
      const core = ctx.createLinearGradient(pts[coreFrom][0] * scale, pts[coreFrom][1] * scale, tip[0] * scale, tip[1] * scale);
      core.addColorStop(0, rgba(palette.bright, 0)); core.addColorStop(1, rgba(palette.white, 0.95 * heat));
      ctx.strokeStyle = core; ctx.lineWidth = Math.max(minWidth * 0.6, width * 0.38); strokePts(ctx, pts, scale, coreFrom);
    }
  };
  let lap = 0, heat = 1;
  const render = () => {
    const distance = distanceAtTime(lap);
    const pts = trailUpTo(distance);
    const ctx = tctx;
    ctx.setTransform(traceRatio, 0, 0, traceRatio, 0, 0);
    ctx.clearRect(0, 0, 1440, 800);
    if (pts.length > 1) {
      drawTrail(ctx, pts, 1, 0.6, true, heat);
      const [tx, ty] = pts[pts.length - 1];
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      const spark = ctx.createRadialGradient(tx, ty, 0, tx, ty, LINE_WIDTH * 2.6);
      spark.addColorStop(0, rgba(palette.white, 0.85 * heat)); spark.addColorStop(0.35, rgba(palette.bright, 0.4 * heat)); spark.addColorStop(1, rgba(palette.accent, 0));
      ctx.fillStyle = spark; ctx.beginPath(); ctx.arc(tx, ty, LINE_WIDTH * 2.6, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    ctx.save(); ctx.translate(CUT_CENTRE[0], CUT_CENTRE[1]); ctx.rotate((FLAG_CUT.angle * Math.PI) / 180);
    ctx.clearRect(-CUT_ALONG / 2, -CUT_ACROSS / 2, CUT_ALONG, CUT_ACROSS); ctx.restore();
    for (const marker of CIRCUIT_MARKERS) {
      if (distance < marker.d) continue;
      const age = Math.min(1, (distance - marker.d) / MARKER_POP_UNITS);
      const radius = 12 + (1 - age) * 14;
      const glow = ctx.createRadialGradient(marker.x, marker.y, 0, marker.x, marker.y, radius);
      glow.addColorStop(0, rgba(palette.bright, 0.5 + 0.45 * (1 - age))); glow.addColorStop(0.45, rgba(palette.accent, 0.32)); glow.addColorStop(1, rgba(palette.accent, 0));
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(marker.x, marker.y, radius, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      if (age < 1) {
        ctx.strokeStyle = rgba(palette.bright, (1 - age) * 0.6); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(marker.x, marker.y, 9 + age * 20, 0, Math.PI * 2); ctx.stroke();
      }
    }
    const reveal = 1 - distance / TOTAL;
    lapPath.setAttribute("stroke-dashoffset", `${60 + reveal * LAP_LENGTH}`);
  };
  render();
  let armed = false, lapStarted = false;
  const lapIO = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting || lapStarted) return;
    lapStarted = true; lapIO.disconnect();
    if (REDUCED) { lap = 1; heat = 0; render(); armed = true; return; }
    tween(6000, easeInOutSine, (v) => { lap = v; render(); }, () => {
      tween(800, easeOutCubic, (v) => { heat = 1 - v; render(); }, () => { armed = true; });
    });
  }, { threshold: 0.35 });
  lapIO.observe(frame);

  /* the halftone */
  const hcanvas = $("[data-halftone]", season);
  const MAX_RATIO = COARSE ? 1 : 2;
  const MIN_LEVEL = 0.02, POINTER_HEAT = 0.95, RETICLE_OPEN = 420, RETICLE_SETTLE = 900, SPREAD_OPEN = 0.38, SPREAD_SHUT = 0.09;
  const RETICLE_ARM = 0.82, RETICLE_CORE = 54, POINTER_TRAIL = 0.07, POINTER_RISE = 0.14, POINTER_FALL = 0.3;
  const CHEQUER_FILL = 1, CHEQUER_SEED = 0.7;
  const P = { threshold: 0.34, radius: 170, waveSpeed: 0.16, fade: 0.9, source: "none" };
  const approach = (from, to, dt, tau) => to + (from - to) * Math.exp(-dt / Math.max(tau, 1e-4));
  const falloff = (t) => { if (t >= 1) return 0; const u = 1 - t; return u * u; };
  const css = ([r, g, b]) => `rgb(${r} ${g} ${b})`;
  const level = new Float32Array(DOTS.count), activeIdx = new Int32Array(DOTS.count), inList = new Uint8Array(DOTS.count);
  let activeCount = 0, spread = 0, dirty = true, baked = null, last = 0;
  const pointer = { x: 0, y: 0, heat: 0 }, target = { x: 0, y: 0, on: false };
  const index = (() => {
    const { columns, rows, count } = DOTS;
    let minI = Infinity, maxI = -Infinity, minJ = Infinity, maxJ = -Infinity;
    for (let i = 0; i < count; i += 1) { minI = Math.min(minI, columns[i]); maxI = Math.max(maxI, columns[i]); minJ = Math.min(minJ, rows[i]); maxJ = Math.max(maxJ, rows[i]); }
    const w = maxI - minI + 1, h = maxJ - minJ + 1;
    const cell = new Int32Array(w * h).fill(-1);
    for (let i = 0; i < count; i += 1) cell[(rows[i] - minJ) * w + (columns[i] - minI)] = i;
    return { cell, w, h, minI, minJ };
  })();
  const draw = () => {
    if (!baked || !hcanvas.width) return;
    const ctx = hcanvas.getContext("2d");
    const scale = hcanvas.width / MAP_VIEW.width;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.clearRect(0, 0, MAP_VIEW.width, MAP_VIEW.height);
    ctx.drawImage(baked, 0, 0, MAP_VIEW.width, MAP_VIEW.height);
    const { points, columns, rows } = DOTS;
    const box = DOT_RADIUS * 2 + 1, span = 1 - P.threshold || 1;
    let drew = 0;
    for (let k = 0; k < activeCount; k += 1) {
      const idx = activeIdx[k];
      if (level[idx] < P.threshold) continue;
      ctx.clearRect(points[idx * 2] - DOT_RADIUS - 0.5, points[idx * 2 + 1] - DOT_RADIUS - 0.5, box, box);
      drew += 1;
    }
    if (!drew) return;
    for (let k = 0; k < activeCount; k += 1) {
      const idx = activeIdx[k], value = level[idx];
      if (value < P.threshold) continue;
      if ((columns[idx] + rows[idx]) & 1) continue;
      const t = Math.min(1, (value - P.threshold) / span);
      const side = DOT_LATTICE.pitchX * (CHEQUER_SEED + (CHEQUER_FILL - CHEQUER_SEED) * t);
      ctx.fillStyle = css(value > 0.8 ? palette.white : value > 0.5 ? palette.bright : mixc(palette.accent, palette.bright, value));
      ctx.fillRect(points[idx * 2] - side / 2, points[idx * 2 + 1] - side / 2, side, side);
    }
  };
  const bake = () => {
    const width = hcanvas.clientWidth, height = hcanvas.clientHeight;
    if (!width || !height) return;
    const ratio = Math.min(devicePixelRatio || 1, MAX_RATIO);
    // the stage is scaled by CSS — size the backing store to what is actually on screen
    const onScreen = hcanvas.getBoundingClientRect().width / width || 1;
    const w = Math.round(width * ratio * onScreen), h = Math.round(height * ratio * onScreen);
    if (hcanvas.width !== w || hcanvas.height !== h) { hcanvas.width = w; hcanvas.height = h; }
    baked ??= document.createElement("canvas");
    baked.width = w; baked.height = h;
    const ctx = baked.getContext("2d");
    const scale = w / MAP_VIEW.width;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.clearRect(0, 0, MAP_VIEW.width, MAP_VIEW.height);
    ctx.fillStyle = css(palette.dot);
    ctx.beginPath();
    const { points, count } = DOTS;
    for (let i = 0; i < count; i += 1) { const x = points[i * 2], y = points[i * 2 + 1]; ctx.moveTo(x + DOT_RADIUS, y); ctx.arc(x, y, DOT_RADIUS, 0, Math.PI * 2); }
    ctx.fill();
    dirty = true; draw();
  };
  new ResizeObserver(bake).observe(frame);
  const add = (i, value) => {
    if (value <= MIN_LEVEL) return;
    if (value > level[i]) level[i] = value;
    if (!inList[i]) { inList[i] = 1; activeIdx[activeCount] = i; activeCount += 1; }
  };
  const addPoint = (src, reach) => {
    if (src.heat <= 0.01) return;
    const { cell, w, h, minI, minJ } = index; const { points } = DOTS;
    const i0 = Math.floor((src.x - reach - DOT_LATTICE.originX) / DOT_LATTICE.pitchX), i1 = Math.ceil((src.x + reach - DOT_LATTICE.originX) / DOT_LATTICE.pitchX);
    const j0 = Math.floor((src.y - reach - DOT_LATTICE.originY) / DOT_LATTICE.pitchY), j1 = Math.ceil((src.y + reach - DOT_LATTICE.originY) / DOT_LATTICE.pitchY);
    for (let j = Math.max(minJ, j0); j <= Math.min(minJ + h - 1, j1); j += 1) {
      const row = (j - minJ) * w;
      for (let i = Math.max(minI, i0); i <= Math.min(minI + w - 1, i1); i += 1) {
        const idx = cell[row + (i - minI)];
        if (idx < 0) continue;
        add(idx, falloff(Math.hypot(points[idx * 2] - src.x, points[idx * 2 + 1] - src.y) / reach) * src.heat);
      }
    }
  };
  const addReticle = (src) => {
    if (src.heat <= 0.01) return;
    const { cell, w, h, minI, minJ } = index; const { points } = DOTS;
    const ci = Math.round((src.x - DOT_LATTICE.originX) / DOT_LATTICE.pitchX), cj = Math.round((src.y - DOT_LATTICE.originY) / DOT_LATTICE.pitchY);
    const arm = RETICLE_ARM * src.heat, reach = RETICLE_OPEN * spread;
    if (reach > 1 && cj >= minJ && cj < minJ + h) {
      const row = (cj - minJ) * w, span = Math.ceil(reach / DOT_LATTICE.pitchX);
      for (let i = Math.max(minI, ci - span); i <= Math.min(minI + w - 1, ci + span); i += 1) {
        const idx = cell[row + (i - minI)];
        if (idx < 0) continue;
        add(idx, (1 - Math.abs(points[idx * 2] - src.x) / reach) * arm);
      }
    }
    if (reach > 1 && ci >= minI && ci < minI + w) {
      const span = Math.ceil(reach / DOT_LATTICE.pitchY);
      for (let j = Math.max(minJ, cj - span); j <= Math.min(minJ + h - 1, cj + span); j += 1) {
        const idx = cell[(j - minJ) * w + (ci - minI)];
        if (idx < 0) continue;
        add(idx, (1 - Math.abs(points[idx * 2 + 1] - src.y) / reach) * arm);
      }
    }
    addPoint(src, RETICLE_CORE);
  };
  const frameDots = () => {
    const now = performance.now();
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    const wanted = target.on && armed ? POINTER_HEAT : 0;
    if (pointer.heat <= 0.001 && wanted > 0) { pointer.x = target.x; pointer.y = target.y; }
    else if (dt > 0) {
      const px = pointer.x, py = pointer.y;
      pointer.x = approach(px, target.x, dt, POINTER_TRAIL); pointer.y = approach(py, target.y, dt, POINTER_TRAIL);
      const speed = Math.hypot(pointer.x - px, pointer.y - py) / dt;
      const wantedSpread = Math.max(0, 1 - speed / RETICLE_SETTLE);
      spread = approach(spread, wantedSpread, dt, wantedSpread > spread ? SPREAD_OPEN : SPREAD_SHUT);
    }
    pointer.heat = approach(pointer.heat, wanted, dt, wanted > pointer.heat ? POINTER_RISE : POINTER_FALL);
    if (pointer.heat < 0.005) { pointer.heat = 0; spread = 0; }
    const decay = Math.exp(-dt / Math.max(0.05, P.fade / 3));
    let write = 0;
    for (let k = 0; k < activeCount; k += 1) {
      const idx = activeIdx[k], value = level[idx] * decay;
      if (value > MIN_LEVEL) { level[idx] = value; activeIdx[write] = idx; write += 1; } else { level[idx] = 0; inList[idx] = 0; }
    }
    const before = activeCount;
    activeCount = write;
    addReticle(pointer);
    if (activeCount === 0 && before === 0 && !dirty) return;
    dirty = false;
    draw();
  };
  if (!REDUCED && !matchMedia("(hover: none)").matches) {
    addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const s = season.getBoundingClientRect();
      const inside = e.clientX >= s.left && e.clientX <= s.right && e.clientY >= s.top && e.clientY <= s.bottom && season.closest(".layer-inner").style.visibility !== "hidden";
      target.on = inside;
      if (!inside) return;
      const r = hcanvas.getBoundingClientRect();
      target.x = ((e.clientX - r.left) / r.width) * MAP_VIEW.width;
      target.y = ((e.clientY - r.top) / r.height) * MAP_VIEW.height;
    }, { passive: true });
    document.documentElement.addEventListener("pointerleave", () => { target.on = false; });
    addEventListener("blur", () => { target.on = false; });
  }

  /* one loop for everything on the map, paused off screen */
  let seasonVisible = false, after = 99;
  new IntersectionObserver(([e]) => { seasonVisible = e.isIntersecting; if (seasonVisible) after = 0; }).observe(season);
  const t0 = performance.now();
  subscribe((time) => {
    if (!seasonVisible) { if (after > 10) return; after += 1; }
    if (season.closest(".layer-inner").style.visibility === "hidden") return;
    const t = time - t0;
    if (!REDUCED) {
      axes.setAttribute("stroke-dashoffset", (-((t % 7000) / 7000) * 20.5).toFixed(2));
      const v = easeOutQuad((t % 4200) / 4200);
      ping.setAttribute("r", (HUB.r + v * 86).toFixed(2));
      ping.setAttribute("opacity", (0.4 * (1 - v) * (1 - v)).toFixed(3));
      const turn = ((t % 10000) / 10000) * Math.PI * 2;
      meridian.setAttribute("rx", Math.max(0.5, Math.abs(Math.cos(turn)) * 18).toFixed(2));
    }
    frameDots();
  });

  /* the standings plate */
  const plate = $("[data-splate]", season);
  const pr = riser(plate);
  inView(plate, () => pr.to(1, 260), { onLeaveBelow: () => pr.to(0) });
}

/* ════════════════════════ 4 · from ideas to builds (timeline) ════════════════════════ */
const PLATE_OUTLINE = "M13.6168 0.497469H697.378C700.858 0.497469 704.195 1.38786 706.655 2.97277C709.115 4.55769 710.498 6.70729 710.498 8.94869V411.208C710.498 413.449 709.115 415.599 706.655 417.183C704.195 418.768 700.858 419.659 697.378 419.659H460.249C454.073 419.659 447.976 420.555 442.411 422.281C436.847 424.008 431.958 426.519 428.107 429.63L399.246 452.95C395.559 455.928 390.878 458.333 385.55 459.986C380.223 461.639 374.385 462.497 368.472 462.497H13.6168C10.1373 462.497 6.80038 461.607 4.34003 460.022C1.87968 458.437 0.497469 456.288 0.497469 454.046V8.94869C0.497469 6.70729 1.87968 4.55769 4.34003 2.97277C6.80038 1.38786 10.1373 0.497469 13.6168 0.497469Z";
{
  const tl = $("[data-timeline]");
  const wrap = $("[data-tl-wrap]", tl);
  const ROW_HEIGHT = { side: 217, centre: 462 };
  const PARALLAX = { plate: { side: 60, centre: 20 }, copy: 110 };
  const TOP_PAD = 169, MARK_RISE = 50;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const cats = PORTFOLIO.categories;
  const wide = matchMedia("(min-width: 1024px)");
  cats.forEach((cat, i) => {
    const n = String(i + 1).padStart(2, "0");
    const row = document.createElement("div");
    row.className = `tl-row ${cat.frame}${cat.frame === "side" ? ` ${cat.align || (i % 4 === 1 ? "right" : "left")}` : ""}`;
    const entries = cat.entries.map((e) => e.slot
      ? `<li class="tentry slot"><div class="tentry-top"><span class="tentry-name">+ ${esc(e.name)}</span></div></li>`
      : `<li class="tentry"><div class="tentry-top">${e.href ? `<a class="tentry-name tlink" href="${e.href}">${esc(e.name)} <span aria-hidden="true">↗</span></a>` : `<span class="tentry-name">${esc(e.name)}</span>`}${e.status ? `<span class="chip" data-kind="${esc(e.kind || "part")}">${esc(e.status)}</span>` : ""}</div>
          ${e.detail ? `<span class="tentry-detail">${esc(e.detail)}</span>` : ""}
          ${e.image ? `<img class="tentry-cert" src="${esc(e.image)}" alt="${esc(e.name)} certificate" loading="lazy">` : ""}</li>`).join("");
    row.innerHTML = `
      <div class="px" data-layer="plate">
        <div class="tplate">
          <div class="tfill"><div class="tslot">${cat.image ? `<img class="tslot-img" src="${esc(cat.image)}" alt="" loading="lazy">` : ""}<div class="tslot-grid"></div><div class="tslot-num">${n}</div></div></div>
          <svg class="toutline" viewBox="0 0 710.995 462.995" preserveAspectRatio="none" aria-hidden="true"><path d="${PLATE_OUTLINE}"/></svg>
          <div class="tcard"><p class="tcat">${esc(cat.label)}</p><h3 class="ttitle">${esc(cat.title)}</h3><ul class="tentries">${entries}</ul></div>
        </div>
        <div class="tyear" aria-hidden="true" data-split="letters" data-stagger="26" data-cfg="190,24">${n}</div>
      </div>
      ${cat.copy ? `<div class="px" data-layer="copy"><p class="tcopy" style="width:min(max(${pxd(cat.copyWidth || 280)}, var(--copy-min-w, 0px)), var(--copy-max-w, 100vw))"><b>${esc(cat.copy[0])}</b> ${esc(cat.copy[1])}</p></div>` : ""}`;
    wrap.appendChild(row);
    $$("img", row).forEach((img) => img.addEventListener("error", () => showError(img.src)));

    // parallax layers, on `top`
    const plateLayer = $("[data-layer='plate']", row), copyLayer = $("[data-layer='copy']", row);
    const travel = PARALLAX.plate[cat.frame];
    scrollTrigger(row, "top_bottom", "bottom_top", (p) => {
      if (!wide.matches || REDUCED) { plateLayer.style.top = ""; if (copyLayer) copyLayer.style.top = ""; return; }
      plateLayer.style.top = `${(((travel - 2 * travel * p) / 1440) * 100).toFixed(4)}cqw`;
      if (copyLayer) copyLayer.style.top = `${(((PARALLAX.copy - 2 * PARALLAX.copy * p) / 1440) * 100).toFixed(4)}cqw`;
    });
    const slot = $(".tslot", row);
    scrollTrigger(row, "top_bottom", "top_center", (p) => { slot.style.top = `${(-10 + 10 * p).toFixed(3)}%`; });

    // the index assembles, then settles back on a centre row
    const year = $(".tyear", row);
    split(year);
    const settle = new Spring(1, CFG.SETTLE, (v) => { year.style.opacity = v; });
    const copy = copyLayer && $(".tcopy", copyLayer);
    const copyRise = copy && riser(copy, "0.75rem", CFG.COPY, "translate");
    inView(row, () => {
      playSplit(year);
      if (cat.frame === "centre") settle.to(0.4, 2200);
      copyRise?.to(1, 220);
    }, { rootMargin: "0% 0% -25% 0%", once: true });

    // hover dims the rest
    const plateEl = $(".tplate", row);
    plateEl.addEventListener("mouseenter", () => { if (REDUCED) return; tl.classList.add("dim"); row.classList.add("hot"); });
    plateEl.addEventListener("mouseleave", () => { tl.classList.remove("dim"); row.classList.remove("hot"); });
  });

  /* the rail */
  const heights = cats.map((c) => ROW_HEIGHT[c.frame]);
  const railH = TOP_PAD + heights.reduce((a, b) => a + b, 0);
  const lastTop = TOP_PAD + heights.slice(0, -1).reduce((a, b) => a + b, 0);
  const rest = lastTop + heights[heights.length - 1] / 2 - MARK_RISE;
  const rail = $("[data-rail]", tl);
  rail.innerHTML = `<svg viewBox="0 0 16 ${railH}" overflow="visible" preserveAspectRatio="none">
    <line x1="8" y1="0" x2="8" y2="98" stroke="var(--timeline-rail)" vector-effect="non-scaling-stroke"/>
    <line x1="8" y1="102" x2="8" y2="${rest}" stroke="var(--timeline-rail)" stroke-dasharray="6 6"/>
    <rect data-run x="7.5" y="0" width="1" height="0" fill="var(--foreground-on-dark)"/>
    <rect data-mark x="-4.5" y="-4.5" width="9" height="9" fill="var(--foreground-on-dark)" transform="translate(8 0)"/></svg>`;
  const run = $("[data-run]", rail), mark = $("[data-mark]", rail);
  scrollTrigger(rail, "top_center", "bottom_bottom", (p) => {
    const r = p * rest;
    run.setAttribute("height", r.toFixed(2));
    mark.setAttribute("transform", `translate(8 ${r.toFixed(2)}) rotate(${((r / rest) * 1800).toFixed(1)})`);
  }, { smooth: CFG.TRIGGER });
}

/* ════════════════════════ contour backdrops (marching squares) ════════════════════════ */
for (const canvas of $$("[data-contour]")) {
  const ctx = canvas.getContext("2d");
  const LINE_SCALE = 3.8, LINE_COUNT = 2.5, WAVE_AMOUNT = 0.37, WAVE_SPEED = 1.66, LINE_OPACITY = 0.85, CELLS = 96;
  const field = (x, y, t) => {
    let f = Math.sin(x * 1.0 + t * 0.6) * 0.5;
    f += Math.sin(y * 0.85 - t * 0.45) * 0.45;
    f += Math.sin((x + y) * 0.65 + t * 0.35) * 0.35;
    f += Math.sin((x - y) * 0.95 - t * 0.55) * 0.25;
    return f * 0.5 + 0.5;
  };
  const colour = readToken(canvas.dataset.contour);
  const start = performance.now();
  let visible = false, after = 99;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) after = 0; }).observe(canvas);
  const draw = (now) => {
    const width = canvas.clientWidth, height = canvas.clientHeight;
    if (!width || !height) return;
    const ratio = Math.min(devicePixelRatio, 2);
    const W = Math.round(width * ratio), H = Math.round(height * ratio);
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const t = ((now - start) / 1000) * WAVE_SPEED;
    const cols = width >= height ? CELLS : Math.max(8, Math.round((CELLS * width) / height));
    const rows = Math.max(8, Math.round((cols * height) / width));
    const stepX = width / cols, stepY = height / rows, aspect = width / height;
    const values = new Float32Array((cols + 1) * (rows + 1));
    for (let j = 0; j <= rows; j += 1) for (let i = 0; i <= cols; i += 1) {
      const nx = ((i / cols) * 2 - 1) * aspect * LINE_SCALE;
      const ny = ((j / rows) * 2 - 1) * LINE_SCALE;
      const qx = nx + Math.sin(ny * 0.8 + t * 0.7) * WAVE_AMOUNT;
      const qy = ny + Math.cos(nx * 0.7 - t * 0.6) * WAVE_AMOUNT;
      values[j * (cols + 1) + i] = field(qx, qy, t) * LINE_COUNT;
    }
    ctx.strokeStyle = colour; ctx.lineWidth = 1; ctx.globalAlpha = LINE_OPACITY; ctx.beginPath();
    for (let lvl = 0.5; lvl < LINE_COUNT; lvl += 1)
      for (let j = 0; j < rows; j += 1) for (let i = 0; i < cols; i += 1) {
        const a = values[j * (cols + 1) + i], b = values[j * (cols + 1) + i + 1];
        const c = values[(j + 1) * (cols + 1) + i + 1], d = values[(j + 1) * (cols + 1) + i];
        const idx = (a > lvl ? 8 : 0) | (b > lvl ? 4 : 0) | (c > lvl ? 2 : 0) | (d > lvl ? 1 : 0);
        if (idx === 0 || idx === 15) continue;
        const x0 = i * stepX, y0 = j * stepY;
        const top = [x0 + stepX * ((lvl - a) / (b - a)), y0];
        const right = [x0 + stepX, y0 + stepY * ((lvl - b) / (c - b))];
        const bottom = [x0 + stepX * ((lvl - d) / (c - d)), y0 + stepY];
        const left = [x0, y0 + stepY * ((lvl - a) / (d - a))];
        const seg = (p, q) => { ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); };
        switch (idx) {
          case 1: case 14: seg(left, bottom); break;
          case 2: case 13: seg(bottom, right); break;
          case 3: case 12: seg(left, right); break;
          case 4: case 11: seg(top, right); break;
          case 6: case 9: seg(top, bottom); break;
          case 7: case 8: seg(left, top); break;
          case 5: seg(left, top); seg(bottom, right); break;
          case 10: seg(left, bottom); seg(top, right); break;
        }
      }
    ctx.stroke(); ctx.globalAlpha = 1;
  };
  draw(start);
  if (!REDUCED) subscribe((now) => { if (!visible) { if (after > 10) return; after += 1; } draw(now); }, () => 24);
}

/* ════════════════════════ 5 · from the workshop (paddock) ════════════════════════ */
{
  const pad = $("[data-paddock]");
  const figLayer = $("[data-pad-fig-layer]", pad);
  scrollTrigger(pad, "top_bottom", "bottom_top", (p) => { figLayer.style.top = REDUCED ? "" : `${(-3.3333 * p).toFixed(4)}cqw`; });
  const cta = riser($("[data-pad-cta]", pad));
  inView($("[data-pad-cta]", pad), () => cta.to(1, 2 * 130 + 260), { onLeaveBelow: () => cta.to(0) });

  /* brackets: one path, four ways */
  const U = (v) => `calc(${v} * var(--U))`;
  const bracketSet = (host, { left, right, top, bottom }) => {
    const rot = { tl: 270, tr: 0, br: 90, bl: 180 };
    const pos = {
      tl: [left, top], tr: [`calc(${right} - ${U(10)})`, top],
      br: [`calc(${right} - ${U(10)})`, `calc(${bottom} - ${U(10)})`], bl: [left, `calc(${bottom} - ${U(10)})`],
    };
    host.style.inset = "0";
    host.innerHTML = Object.keys(rot).map((k) => `<svg class="pbr" viewBox="0 0 10.5 10.5" style="left:${pos[k][0]};top:${pos[k][1]};transform:rotate(${rot[k]}deg)"><path d="M0 0.5H10V10.5"/></svg>`).join("");
  };
  const FRAME_RIGHT = "calc(100% - 2.2222cqw)";
  const FRAME_LEFT = `calc(100% - 2.2222cqw - ${U(193)} - ${U(25)})`;
  const brkMeet = $("[data-brk-meet]", pad), brkStats = $("[data-brk-stats]", pad);
  bracketSet(brkMeet, { left: FRAME_LEFT, right: FRAME_RIGHT, top: U(32), bottom: U(105) });
  bracketSet(brkStats, { left: FRAME_LEFT, right: FRAME_RIGHT, top: U(137), bottom: U(535) });
  const fadeIn = (el, delay) => { const s = new Spring(0, CFG.REVEAL, (v) => { el.style.opacity = v; }); inView(pad, () => s.to(1, delay), { once: true }); };
  brkMeet.style.opacity = 0; brkStats.style.opacity = 0;
  fadeIn(brkMeet, 320); fadeIn(brkStats, 460);
  const meet = riser($("[data-meet]", pad));
  inView(pad, () => meet.to(1, 410), { once: true });

  const ICONS = {
    flag: `<path d="M6 28V3M6 4h17l-3 5 3 5H6"/>`,
    bars: `<path d="M4 27h23M8 23v-7M14 23V10M20 23v-11M26 23V5" />`,
    trophy: `<path d="M10 4h11v7a5.5 5.5 0 0 1-11 0V4ZM10 7H5v2a5 5 0 0 0 5 5M21 7h5v2a5 5 0 0 1-5 5M15.5 16.5V22M10 27h11l-1.5-5h-8Z"/>`,
    gauge: `<path d="M4 22a11.5 11.5 0 1 1 23 0M15.5 22l6-8"/><circle cx="15.5" cy="22" r="1.6"/>`,
  };
  const col = $("[data-pstats]", pad);
  col.innerHTML = PORTFOLIO.workshopStats.map((s, i) => `${i ? `<div class="prule" aria-hidden="true"></div>` : ""}
    <div class="pstat-row"><svg viewBox="0 0 31 31" aria-hidden="true">${ICONS[s.icon] || ""}</svg>
    <div><dt class="lab">${s.label}</dt><dd class="fig" data-split="letters" data-stagger="24" data-cfg="200,24">${s.value}</dd></div></div>`).join("");
  const rules = $$(".prule", col), rows = $$(".pstat-row", col);
  rows.forEach((row, i) => {
    const base = 460 + i * 90;
    const rule = rules[i - 1];
    if (rule) { const s = new Spring(0, CFG.REVEAL, (v) => { rule.style.transform = `scaleX(${v})`; }); inView(pad, () => s.to(1, base), { once: true }); }
    const r = riser(row); inView(pad, () => r.to(1, base + 40), { once: true });
    const fig = $(".fig", row); split(fig);
    inView(pad, () => playSplit(fig, base + 120), { once: true });
  });

  /* the calendar strip */
  const cal = $("[data-cal]", pad);
  const spreadX = (x) => `calc(50% + ${pxd(x - 720)} * var(--cal-spread, 1))`;
  const strip = PORTFOLIO.strip;
  const liveIndex = strip.findIndex((c) => c.live);
  const LINKS = [{ x: 416, width: 126 }, { x: 580, width: 128 }, { x: 743, width: 136 }, { x: 914, width: 124 }];
  let html = LINKS.map((l) => `<div class="cal-link" style="left:${spreadX(l.x)};width:calc(${pxd(l.width)} * var(--cal-spread, 1));top:calc(${pxd(131.5)} + var(--cal-mark-drop, 0px))"></div>`).join("");
  html += strip.map((c) => `<div class="cal-card${c.live ? " live" : ""}" style="left:calc(${spreadX(c.x + c.w / 2)} - ${pxd(c.w / 2)});top:calc(${pxd(43)} + var(--cal-card-drop, 0px));width:var(--cal-card-w, ${pxd(c.w)})">
      <span class="cal-round">${c.round}</span><span class="cal-name">${c.name}</span><span class="cal-date">${c.date}</span></div>`).join("");
  html += strip.map((c) => `<div class="cal-mark" aria-hidden="true" style="left:${spreadX(c.x + c.w / 2)};top:calc(${pxd(126)} + var(--cal-mark-drop, 0px))">${
    c.live ? `<svg viewBox="0 0 11 11" overflow="visible"><circle data-pulse cx="5.5" cy="5.5" r="5.5" fill="none" stroke="var(--accent)" vector-effect="non-scaling-stroke" opacity="0"/><circle cx="5.5" cy="5.5" r="5.5" fill="var(--accent)"/></svg>`
    : c.ring ? `<svg viewBox="0 0 11 11" overflow="visible"><circle cx="5.5" cy="5.5" r="5" fill="none" stroke="var(--foreground-on-dark)" vector-effect="non-scaling-stroke"/></svg>`
    : `<b>${c.mark}</b>`}</div>`).join("");
  html += `<div class="cal-live" aria-hidden="true"></div>`;
  cal.innerHTML = html;
  const liveBox = $(".cal-live", cal);
  const sp = "var(--bracket-spread, 0px)";
  const L = `calc(${spreadX(669)} - ${sp})`, Rr = `calc(${spreadX(781)} + ${sp})`;
  const T = `calc(${pxd(32)} + var(--bracket-drop, 0px) - ${sp})`, B = `calc(${pxd(113)} + var(--bracket-drop, 0px) + var(--bracket-stretch, 0px) + ${sp})`;
  liveBox.style.inset = "0";
  const bw = "0.6944cqw";
  liveBox.innerHTML = [["tl", 270, L, T], ["tr", 0, `calc(${Rr} - ${bw})`, T], ["br", 90, `calc(${Rr} - ${bw})`, `calc(${B} - ${bw})`], ["bl", 180, L, `calc(${B} - ${bw})`]]
    .map(([, r, l, t]) => `<svg class="pbr" viewBox="0 0 10.5 10.5" style="left:${l};top:${t};transform:rotate(${r}deg)"><path d="M0 0.5H10V10.5"/></svg>`).join("");
  const liveCard = $$(".cal-card", cal)[liveIndex];
  liveCard?.addEventListener("mouseenter", () => cal.style.setProperty("--bracket-spread", pxd(5)));
  liveCard?.addEventListener("mouseleave", () => cal.style.removeProperty("--bracket-spread"));

  const links = $$(".cal-link", cal), cards = $$(".cal-card", cal), marks = $$(".cal-mark", cal);
  const play = () => {
    links.forEach((l, i) => { const s = new Spring(0, CFG.REVEAL, (v) => { l.style.transform = `scaleX(${v})`; }); s.to(1, 560 + i * 90); });
    cards.forEach((c, i) => {
      riser(c, "0.5rem", CFG.REVEAL).to(1, 560 + i * 90);
      riser($(".cal-name", c), "0.3em", CFG.NAME).to(1, 560 + i * 90 + 110);
    });
    marks.forEach((m, i) => { const s = new Spring(0, CFG.REVEAL, (v) => { m.style.opacity = v; }); s.to(1, 560 + i * 90 + 60); });
    const s = new Spring(0, CFG.REVEAL, (v) => { liveBox.style.opacity = v; }); s.to(1, 560 + 5 * 90);
  };
  inView(cal, play, { rootMargin: "0% 0% -20% 0%", once: true });
  const pulse = $("[data-pulse]", cal);
  let calVisible = false, after = 99;
  new IntersectionObserver(([e]) => { calVisible = e.isIntersecting; if (calVisible) after = 0; }).observe(cal);
  const c0 = performance.now();
  if (!REDUCED) subscribe((now) => {
    if (!calVisible) { if (after > 10) return; after += 1; }
    const t = now - c0;
    const period = (0.7951 / 100) * pad.clientWidth;
    const shift = ((t % 5200) / 5200) * period;
    links.forEach((l, i) => { l.style.backgroundPositionX = `${(i < liveIndex ? shift : -shift).toFixed(2)}px`; });
    if (pulse) {
      const v = easeOutQuad((t % 3200) / 3200);
      pulse.setAttribute("r", (5.5 + v * 5.5 * 3.4).toFixed(2));
      pulse.setAttribute("opacity", (0.5 * (1 - v) * (1 - v)).toFixed(3));
    }
  });
}

/* ════════════════════════ 6 · keep building forward (footer) ════════════════════════ */
{
  const foot = $("[data-footer]");
  const figLayer = $("[data-foot-fig]", foot);
  scrollTrigger(foot, "top_bottom", "bottom_bottom", (p) => { figLayer.style.top = REDUCED ? "0" : `${(4.1667 * (1 - p)).toFixed(4)}cqw`; });
  const logo = $("[data-foot-logo]", foot);
  const lf = new Spring(0, CFG.REVEAL, (v) => { logo.style.opacity = v; });
  logo.style.translate = "0 0";
  inView(foot, () => lf.to(1, 120), { once: true });
  const ul = $("[data-foot-nav]", foot);
  ul.innerHTML = PORTFOLIO.footerNav.map(([label, href]) => `<li><a class="hov" href="${href}"><span data-split="letters" data-stagger="22" data-cfg="170,24">${label}</span><svg class="na" viewBox="0 0 13.7071 10.7071" aria-hidden="true"><path d="M0 5.35H13M8 10.35L13 5.35L8 0.35"/></svg></a></li>`).join("");
  $$("[data-split]", ul).forEach((el, i) => { split(el); el.style.columnGap = "0"; inView(foot, () => playSplit(el, 260 + i * 80), { once: true }); });
  $$("[data-foot]", foot).forEach((el) => { const r = riser(el, "0.75rem", CFG.REVEAL, el.classList.contains("foot-cta") ? "transform" : "translate"); inView(foot, () => r.to(1, Number(el.dataset.foot)), { once: true }); });
}

/* section map used by the theme switch to land you in the same place */
{
  const SECTIONS = { hero: "top", about: "top", numbers: "record", projects: "projects", spotlight: "workshop", achievements: "achievements", contact: "contact" };
  const order = ["hero", "numbers", "projects", "spotlight", "achievements", "contact"];
  window.__theme = {
    current() {
      const probe = scrollY + innerHeight * 0.4;
      let key = "hero";
      for (const k of order) { const id = SECTIONS[k]; if ((id === "top" ? 0 : targetY(id)) <= probe) key = k; }
      return key;
    },
    go(key) {
      const id = SECTIONS[key]; if (!id || id === "top") return;
      const y = targetY(id);
      if (lenis) lenis.scrollTo(y, { immediate: true }); else scrollTo(0, y);
    },
  };
}

/* arriving from a theme switch: the page is usable now — the WebGL hero keeps loading under the wipe */
if (document.documentElement.classList.contains("is-switching")) requestAnimationFrame(() => window.dispatchEvent(new Event("theme:ready")));
