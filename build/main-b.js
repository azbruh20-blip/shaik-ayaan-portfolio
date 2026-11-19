
/* ════════════════════════ 2 · the hero scene (WebGL) ════════════════════════ */
const PHOTO = "__PHOTO__";
/** The part of the photograph the figure lives in — the wall either side fades out. */
const CROP = { x0: 0.3, x1: 0.7 };
const PHOTO_ASPECT = ((CROP.x1 - CROP.x0) * 1600) / 900;

const CAP_60 = 1000 / 60 - 2;
const isEnergySaver = () => Boolean(navigator.connection?.saveData) || (navigator.deviceMemory ?? 8) <= 2;
const getSceneTier = () => {
  const coarse = matchMedia("(hover: none) and (pointer: coarse)").matches;
  const width = innerWidth;
  const name = width < 768 || (coarse && width < 1024) ? "mobile" : coarse || width < 1280 ? "tablet" : "desktop";
  const mobile = name === "mobile";
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const saver = isEnergySaver();
  return {
    name, mobile, coarsePointer: coarse, reducedMotion,
    maxDpr: mobile ? 1 : name === "tablet" ? 1.25 : 1.5,
    frameInterval: name === "desktop" ? 0 : CAP_60,
    pointerEnabled: !coarse && !reducedMotion,
    antialias: name === "desktop",
    trailSamples: mobile ? 28 : name === "tablet" ? 44 : 72,
    outline: !mobile, reveal: !mobile,
    freeze: reducedMotion || (mobile && saver),
  };
};

const DEG = Math.PI / 180;
const CAMERA_FOV = 35;
const CAMERA_Y = 0.1;
const visibleWorldHeight = (cameraZ) => 2 * cameraZ * Math.tan((CAMERA_FOV * Math.PI) / 360);
const fitSubjectToBox = (params, box, canvasHeight) => {
  if (canvasHeight <= 0 || box.height <= 0) return { subjectScale: params.subjectScale, subjectY: params.subjectY };
  const ratio = box.height / canvasHeight;
  const world = visibleWorldHeight(params.cameraZ);
  const centreShift = canvasHeight / 2 - (box.top + box.height / 2);
  return { subjectScale: params.subjectScale * ratio, subjectY: CAMERA_Y + (params.subjectY - CAMERA_Y) * ratio + (centreShift * world) / canvasHeight };
};
/** World height of the photo plane. */
const HEAD_HEIGHT = 4.55;
const STATIC_POSE = { x: 0.3, y: 0.1 };
const BACKDROP_Z = -3;
const REFERENCE_ASPECT = 1.778, PORT_WIDTH = 1440, MIN_FIT = 0.9, NARROW_STEP = 0.25, STEP_UNDER = 1280;
const AUTO_SWEEP_PATH = [{ x: -0.85, y: -0.62 }, { x: 0.78, y: -0.2 }, { x: -0.7, y: 0.2 }, { x: 0.82, y: 0.6 }];

const revealTrailFunction = (name, trail, boundsMin, boundsMax, pace, warp, length, radius, samples) => /* glsl */ `
  float ${name}(vec2 ndc) {
    float gate = smoothstep(uGateStart, uGateStart + uGateWidth, ${pace});
    if (gate <= 0.0) return 0.0;
    vec2 bounded = vec2(ndc.x * uAspect, ndc.y);
    if (any(lessThan(bounded, ${boundsMin})) || any(greaterThan(bounded, ${boundsMax}))) return 0.0;
    vec2 point = bounded;
    if (${warp} > 0.001) {
      vec2 noiseUv = ndc * 0.5 + 0.5;
      float nx = texture2D(uNoiseTex, noiseUv * uWarpScale + vec2(uTime * 0.07, uTime * 0.05)).r;
      float ny = texture2D(uNoiseTex, noiseUv * uWarpScale * 1.4 - vec2(uTime * 0.06, uTime * 0.09)).r;
      point += (vec2(nx, ny) - 0.5) * ${warp} * 0.22;
    }
    float radius = ${radius} * mix(uIdleScale, 1.0, ${pace});
    float taper = uTaper * mix(uTaperIdle, uTaperFast, ${pace});
    float span = max(${length} * float(${samples} - 1), 1.0);
    float ceiling = uThreshold + uEdge;
    float trail = 0.0;
    for (int i = 0; i < ${samples} - 1; i++) {
      if (float(i) >= span) break;
      float weight = pow(1.0 - float(i) / span, taper);
      if (weight <= trail) break;
      vec2 a = vec2(${trail}[i].x * uAspect, ${trail}[i].y);
      vec2 b = vec2(${trail}[i + 1].x * uAspect, ${trail}[i + 1].y);
      float r = radius * weight;
      trail = max(trail, weight * smoothstep(r, r * 0.35, revealSegment(point, a, b)));
      if (trail >= ceiling) break;
    }
    return smoothstep(uThreshold - uEdge, uThreshold + uEdge, trail) * gate;
  }
`;
const buildRevealDeclarations = (samples) => /* glsl */ `
  uniform vec2 uTrail[${samples}];
  uniform vec2 uTrailMin; uniform vec2 uTrailMax; uniform float uPace;
  uniform vec2 uSweep[${samples}];
  uniform vec2 uSweepMin; uniform vec2 uSweepMax; uniform float uSweepPace; uniform float uSweepWarp;
  uniform float uSweepLength; uniform float uSweepRadius;
  uniform float uAspect; uniform float uRadius; uniform float uIdleScale; uniform float uTaper;
  uniform float uTaperIdle; uniform float uTaperFast; uniform float uLength; uniform float uGateStart;
  uniform float uGateWidth; uniform float uWarpScale; uniform float uTime; uniform float uEdge;
  uniform float uThreshold; uniform float uWarp; uniform float uRevealMix; uniform sampler2D uNoiseTex;
  float revealSegment(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a; vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
    return length(pa - ba * h);
  }
  ${revealTrailFunction("revealCursorTrail", "uTrail", "uTrailMin", "uTrailMax", "uPace", "uWarp", "uLength", "uRadius", samples)}
  ${revealTrailFunction("revealSweepTrail", "uSweep", "uSweepMin", "uSweepMax", "uSweepPace", "uSweepWarp", "uSweepLength", "uSweepRadius", samples)}
  float revealTrail(vec2 ndc) {
    float cursor = revealCursorTrail(ndc);
    if (cursor >= 1.0) return 1.0;
    return max(cursor, revealSweepTrail(ndc));
  }
`;

const DEFAULT_PARAMS = {
  cameraZ: 6.5, subjectScale: 1, subjectX: 0, subjectY: -0.28, subjectParallax: 0.02,
  riseDistance: 200, riseDuration: 2, headScale: 1, headParallax: 0.005, headRelight: 0.32,
  trailRadius: 0.46, trailIdleScale: 0.28, trailTaper: 1.9, trailTaperIdle: 1.6, trailTaperFast: 1.25, trailLength: 0.64,
  revealThreshold: 0.08, revealEdge: 0.005, revealWarp: 1.29, revealWarpScale: 2.9, revealSpeed: 1.25,
  pointerLerp: 0.17, pacePeak: 0.029, paceAttack: 0.09, paceRelease: 0.205, paceThreshold: 0.06, paceRamp: 0.15,
  outlinePeriod: 3.1, sweepWarp: 0.86, sweepLength: 0.67, sweepRadius: 0.33, outlineStagger: 1.2,
  outlineOpacity: 0.09, outlineWidth: 0.15,
  bgLineScale: 3.8, bgLineCount: 2.5, bgLineThickness: 1.4, bgLineOpacity: 0.85, bgWaveAmount: 0.37, bgWaveSpeed: 1.66,
  bgRevealLightness: 0.62, bgRevealLightnessAlt: 0.44, bgRevealOpacity: 1,
  introDuration: 4, burnStart: 0.14, burnSoftness: 0.02, burnGlow: 4,
  autoSweepAmount: 0, autoSweepPeriod: 5, autoSweepStroke: 0.45, autoSweepHold: 0,
};

const backdropVertex = /* glsl */ `
  varying vec4 vBackdropClip;
  void main() { vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0); vBackdropClip = clip; gl_Position = clip; }
`;
const buildBackdropFragment = (samples) => /* glsl */ `
  varying vec4 vBackdropClip;
  uniform vec3 uBackground; uniform vec3 uLineColor; uniform vec3 uRevealColor; uniform vec3 uRevealColorAlt;
  uniform float uLineScale; uniform float uLineCount; uniform float uLineThickness; uniform float uLineOpacity;
  uniform float uWaveAmount; uniform float uWaveSpeed; uniform float uRevealOpacity;
  ${buildRevealDeclarations(samples)}
  float backdropField(vec2 p, float t) {
    float f = sin(p.x * 1.00 + t * 0.60) * 0.50;
    f += sin(p.y * 0.85 - t * 0.45) * 0.45;
    f += sin((p.x + p.y) * 0.65 + t * 0.35) * 0.35;
    f += sin((p.x - p.y) * 0.95 - t * 0.55) * 0.25;
    return f * 0.5 + 0.5;
  }
  void main() {
    vec2 ndc = vBackdropClip.xy / vBackdropClip.w;
    vec2 p = vec2(ndc.x * uAspect, ndc.y) * uLineScale;
    float t = uTime * uWaveSpeed;
    vec2 q = p;
    q.x += sin(p.y * 0.8 + t * 0.7) * uWaveAmount;
    q.y += cos(p.x * 0.7 - t * 0.6) * uWaveAmount;
    float scaled = backdropField(q, t) * uLineCount;
    float w = max(fwidth(scaled) * uLineThickness, 1e-5);
    float line = 1.0 - smoothstep(0.0, w, abs(fract(scaled) - 0.5));
    vec3 color = mix(uBackground, uLineColor, line * uLineOpacity * uRevealMix);
    float parity = mod(floor(scaled + 0.5), 2.0);
    vec3 revealShade = mix(uRevealColor, uRevealColorAlt, parity);
    if (uRevealOpacity > 0.001) color = mix(color, revealShade, revealTrail(ndc) * uRevealMix * uRevealOpacity);
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

/* The photograph plane: depth parallax, normal relight — and in place of a helmet, a
   cyan "telemetry" scan of the same photograph that burns away crown-to-chin and then
   lives only where the cursor has just been. The scan wave crosses it every 3.1s. */
const headVertex = /* glsl */ `
  uniform vec4 uCrop;
  varying vec2 vUv; varying vec2 vTex; varying vec4 vClip;
  void main() {
    vUv = uv;
    vTex = uCrop.xy + uv * uCrop.zw;
    vec4 c = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vClip = c; gl_Position = c;
  }
`;
const buildHeadFragment = (samples) => /* glsl */ `
  uniform sampler2D uDiffuse; uniform sampler2D uDepth; uniform sampler2D uNormal;
  uniform vec2 uParallax; uniform float uReveal; uniform float uDepthScale; uniform float uRelight;
  uniform float uIntro; uniform float uBurnStart; uniform float uBurnSoft; uniform float uBurnGlow; uniform vec3 uBurnColor;
  uniform vec3 uInk; uniform float uScanTime; uniform float uScanPeriod; uniform float uScanStagger;
  uniform float uScanOpacity; uniform float uScanWidth; uniform float uScanMix; uniform vec2 uGridScale; uniform float uDotPx;
  varying vec2 vUv; varying vec2 vTex; varying vec4 vClip;
  ${buildRevealDeclarations(samples)}
  void main() {
    float depth = texture2D(uDepth, vTex).r;
    vec2 offset = uParallax * (depth - 0.5) * uDepthScale;
    vec2 tc = vTex + offset;
    vec4 color = texture2D(uDiffuse, tc);
    vec3 normal = normalize(texture2D(uNormal, tc).rgb * 2.0 - 1.0);
    vec3 lightDir = normalize(vec3(uParallax * 1.6, 1.0));
    float lambert = max(dot(normal, lightDir), 0.0) - 0.72;
    vec3 lit = color.rgb * (1.0 + lambert * uRelight);

    float alpha = smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x) * smoothstep(1.0, 0.86, vUv.y) * smoothstep(0.0, 0.06, vUv.y);
    vec2 ndc = vClip.xy / vClip.w;

    // the telemetry scan: halftone of the photograph's own light, on a lattice
    float lum = pow(clamp(dot(color.rgb, vec3(0.2126, 0.7152, 0.0722)), 0.0, 1.0), 0.4545);
    vec2 g = fract(gl_FragCoord.xy / uDotPx) - 0.5;
    float r = sqrt(clamp(lum * 1.7, 0.0, 1.0)) * 0.56;
    float dotMask = 1.0 - smoothstep(r - 0.1, r + 0.04, length(g));
    vec2 q = vUv * uGridScale;
    vec2 gd = abs(fract(q - 0.5) - 0.5) / max(fwidth(q), vec2(1e-5));
    float grid = 1.0 - min(min(gd.x, gd.y), 1.0);
    vec3 scan = mix(uInk, uBurnColor, dotMask * 0.9) + uBurnColor * grid * 0.22;

    float burnFront = smoothstep(uBurnStart, 1.0, uIntro);
    float burnNoise = texture2D(uNoiseTex, ndc * 0.5 + 0.5).r;
    float burnHeight = 1.0 - (ndc.y * 0.5 + 0.5);
    float burnAt = mix(burnHeight, burnNoise, 0.45);
    float intact = smoothstep(burnFront - uBurnSoft, burnFront + uBurnSoft, burnAt);
    float mask = max(revealTrail(ndc), intact) * uRevealMix;
    vec3 col = mix(lit, scan, mask);
    float burnEdge = 4.0 * intact * (1.0 - intact);
    col += uBurnColor * burnEdge * uBurnGlow * 0.35 * uRevealMix;

    float width = max(uScanWidth, 0.0001);
    float start = 1.0 + width * 3.0;
    float travel = 1.0 + width * 6.0;
    float wave = 0.0;
    for (int i = 0; i < 8; i++) {
      float age = mod(uScanTime, uScanStagger) + float(i) * uScanStagger;
      if (age > uScanPeriod) break;
      float centre = start - (age / uScanPeriod) * travel;
      float d = (vUv.y - centre) / width;
      wave = max(wave, exp(-d * d));
    }
    vec3 stroke = mix(uBurnColor, vec3(1.0), 0.64);
    col = mix(col, stroke, clamp(grid * wave * uScanOpacity * 1.6 * uScanMix * (1.0 - mask), 0.0, 1.0));

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), alpha * uReveal);
    #include <colorspace_fragment>
  }
`;

const swing = (v, ampDeg, curve) => { const amp = ampDeg * DEG; return curve < 1e-3 ? amp * v : (amp * Math.tanh(curve * v)) / Math.tanh(curve); };

/** Value noise that tiles, for the burn and the reveal's warp (stands in for noise.webp). */
function makeNoiseCanvas(size = 256) {
  const c = document.createElement("canvas"); c.width = c.height = size;
  const ctx = c.getContext("2d"); const img = ctx.createImageData(size, size);
  const acc = new Float32Array(size * size);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  let amp = 1, total = 0;
  for (let period = 4; period <= 64; period *= 2) {
    const lat = Array.from({ length: period * period }, rnd);
    for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
      const fx = (x / size) * period, fy = (y / size) * period;
      const ix = Math.floor(fx), iy = Math.floor(fy);
      let tx = fx - ix, ty = fy - iy; tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty);
      const at = (i, j) => lat[((j % period) * period) + (i % period)];
      const a = at(ix, iy), b = at(ix + 1, iy), cc = at(ix, iy + 1), d = at(ix + 1, iy + 1);
      acc[y * size + x] += amp * (a + (b - a) * tx + (cc - a) * ty + (a - b - cc + d) * tx * ty);
    }
    total += amp; amp *= 0.5;
  }
  for (let i = 0; i < size * size; i += 1) {
    const v = Math.round(clamp01((acc[i] / total - 0.5) * 1.6 + 0.5) * 255);
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}
/** Depth and normals for a single photograph: the figure's own silhouette, eased, plus its light. */
function makeDepthNormal(image) {
  const W = 512, H = 288;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d"); ctx.filter = "blur(3px)"; ctx.drawImage(image, 0, 0, W, H);
  const src = ctx.getImageData(0, 0, W, H).data;
  const depth = new Float32Array(W * H);
  for (let y = 0; y < H; y += 1) for (let x = 0; x < W; x += 1) {
    const u = x / W, v = y / H, i = y * W + x;
    const lum = (0.2126 * src[i * 4] + 0.7152 * src[i * 4 + 1] + 0.0722 * src[i * 4 + 2]) / 255;
    const body = Math.exp(-(((u - 0.505) / 0.13) ** 2) - (((v - 0.62) / 0.5) ** 2));
    const head = Math.exp(-(((u - 0.535) / 0.045) ** 2) - (((v - 0.2) / 0.09) ** 2));
    depth[i] = clamp01(0.25 + 0.55 * body + 0.35 * head + 0.15 * lum);
  }
  const dc = document.createElement("canvas"); dc.width = W; dc.height = H;
  const nc = document.createElement("canvas"); nc.width = W; nc.height = H;
  const di = dc.getContext("2d").createImageData(W, H), ni = nc.getContext("2d").createImageData(W, H);
  const at = (x, y) => depth[Math.min(H - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))];
  for (let y = 0; y < H; y += 1) for (let x = 0; x < W; x += 1) {
    const i = y * W + x;
    const dx = (at(x + 1, y) - at(x - 1, y)) * 6, dy = (at(x, y + 1) - at(x, y - 1)) * 6;
    const len = Math.hypot(-dx, dy, 1);
    const d = Math.round(depth[i] * 255);
    di.data[i * 4] = di.data[i * 4 + 1] = di.data[i * 4 + 2] = d; di.data[i * 4 + 3] = 255;
    ni.data[i * 4] = Math.round(((-dx / len) * 0.5 + 0.5) * 255);
    ni.data[i * 4 + 1] = Math.round(((dy / len) * 0.5 + 0.5) * 255);
    ni.data[i * 4 + 2] = Math.round(((1 / len) * 0.5 + 0.5) * 255);
    ni.data[i * 4 + 3] = 255;
  }
  dc.getContext("2d").putImageData(di, 0, 0); nc.getContext("2d").putImageData(ni, 0, 0);
  return { depth: dc, normal: nc };
}
const loadImage = (src) => new Promise((resolve, reject) => {
  const img = new Image(); img.crossOrigin = "anonymous"; img.decoding = "async";
  img.onload = () => resolve(img); img.onerror = () => reject(new Error(src.slice(0, 64))); img.src = src;
});

class HeroScene {
  constructor(canvas) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.1, 50);
    this.subjectGroup = new THREE.Group();
    this.params = { ...DEFAULT_PARAMS };
    this.pointer = { x: 0, y: 0 }; this.smoothed = { x: 0, y: 0 }; this.lastSmoothed = { x: 0, y: 0 };
    this.pointerSeen = false; this.pace = 0; this.readyAt = null; this.intro = 0;
    this.viewportHeight = 1; this.viewportWidth = 1; this.riseStarted = false; this.riseAt = null;
    this.sweepPointer = { ...AUTO_SWEEP_PATH[0] }; this.sweepSmoothed = { ...this.sweepPointer }; this.sweepLast = { ...this.sweepPointer };
    this.sweepPace = 0; this.sweepCycle = 0; this.aspect = 1; this.reveal = 0; this.settled = false; this.disposed = false; this.startTime = null;
    this.ready = false; this.onReady = null; this.onError = null;
    this._tier = getSceneTier();
    this.samples = this._tier.trailSamples;
    this.trail = Array.from({ length: this.samples }, () => new THREE.Vector2(STATIC_POSE.x, -STATIC_POSE.y));
    this.sweepTrail = Array.from({ length: this.samples }, () => new THREE.Vector2(AUTO_SWEEP_PATH[0].x, -AUTO_SWEEP_PATH[0].y));
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: this._tier.antialias, stencil: false,
      powerPreference: this._tier.mobile ? "default" : "high-performance" });
    this.renderer.setClearColor(new THREE.Color(getComputedStyle(document.body).backgroundColor));
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, this._tier.maxDpr));
    this.renderer.toneMapping = THREE.NoToneMapping;
    if (!this._tier.pointerEnabled) this.parkPointer();
    this.camera.position.set(0, CAMERA_Y, 6.5);
    this.scene.add(this.subjectGroup);
    this.load().catch((err) => this.onError?.(err));
  }
  get tier() { return this._tier; }
  retune() {
    const fresh = getSceneTier(); const previous = this._tier;
    const tier = { ...fresh, antialias: previous.antialias, trailSamples: previous.trailSamples };
    this._tier = tier;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, tier.maxDpr));
    if (this.headMaterial) this.headMaterial.uniforms.uDotPx.value = 5 * this.renderer.getPixelRatio();
    if (!tier.pointerEnabled) this.parkPointer(); else if (!previous.pointerEnabled) this.pointerSeen = false;
    if (!tier.freeze) this.settled = false;
    return tier;
  }
  parkPointer() {
    this.pointer = { ...STATIC_POSE }; this.smoothed = { ...STATIC_POSE }; this.lastSmoothed = { ...STATIC_POSE }; this.pointerSeen = false;
  }
  beginRise() { this.riseStarted = true; }
  setPointer(x, y) {
    this.pointer.x = x; this.pointer.y = y;
    if (!this.pointerSeen) { this.pointerSeen = true; this.smoothed.x = this.lastSmoothed.x = x; this.smoothed.y = this.lastSmoothed.y = y; }
  }
  setParams(partial) { Object.assign(this.params, partial); this.settled = false; }
  resize(width, height) {
    this.renderer.setSize(width, height, false);
    this.viewportHeight = Math.max(height, 1); this.viewportWidth = Math.max(width, 1);
    this.aspect = width / height; this.camera.aspect = this.aspect; this.camera.updateProjectionMatrix();
    if (this.revealUniforms) this.revealUniforms.uAspect.value = this.aspect;
  }
  update(time) {
    if (this.disposed || this.settled) return;
    if (this.startTime === null) this.startTime = time;
    const t = (time - this.startTime) / 1000;
    const p = this.params;
    if (this._tier.freeze && this.reveal > 0.995 && this.intro >= 1) this.settled = true;

    const autoEnabled = p.autoSweepAmount > 0 && !this._tier.freeze && this.intro >= 1;
    if (autoEnabled) {
      const cycle = t % Math.max(p.autoSweepPeriod, 0.001);
      if (cycle < this.sweepCycle) this.resetSweep();
      this.sweepCycle = cycle;
      const legs = AUTO_SWEEP_PATH.length - 1;
      const stroke = Math.max(p.autoSweepStroke, 0.05);
      const slot = stroke + Math.max(p.autoSweepHold, 0);
      const leg = Math.floor(cycle / slot);
      if (leg < legs) {
        const local = Math.min(1, (cycle - leg * slot) / stroke);
        const eased = 1 - (1 - local) * (1 - local);
        const from = AUTO_SWEEP_PATH[leg], to = AUTO_SWEEP_PATH[leg + 1];
        this.sweepPointer.x = (from.x + (to.x - from.x) * eased) * p.autoSweepAmount;
        this.sweepPointer.y = (from.y + (to.y - from.y) * eased) * p.autoSweepAmount;
      }
    }
    this.sweepSmoothed.x += (this.sweepPointer.x - this.sweepSmoothed.x) * p.pointerLerp;
    this.sweepSmoothed.y += (this.sweepPointer.y - this.sweepSmoothed.y) * p.pointerLerp;
    const sweepStep = Math.hypot(this.sweepSmoothed.x - this.sweepLast.x, this.sweepSmoothed.y - this.sweepLast.y);
    const sweepTarget = autoEnabled ? Math.min(1, sweepStep / Math.max(p.pacePeak, 1e-5)) : 0;
    this.sweepPace += (sweepTarget - this.sweepPace) * (sweepTarget > this.sweepPace ? p.paceAttack : p.paceRelease);
    this.sweepLast.x = this.sweepSmoothed.x; this.sweepLast.y = this.sweepSmoothed.y;
    const oldestSweep = this.sweepTrail.pop();
    if (oldestSweep) { oldestSweep.set(this.sweepSmoothed.x, -this.sweepSmoothed.y); this.sweepTrail.unshift(oldestSweep); }

    this.smoothed.x += (this.pointer.x - this.smoothed.x) * p.pointerLerp;
    this.smoothed.y += (this.pointer.y - this.smoothed.y) * p.pointerLerp;

    if (this.ready) {
      if (this.readyAt === null) this.readyAt = t;
      this.intro = Math.min(1, (t - this.readyAt) / Math.max(p.introDuration, 0.001));
      if (this._tier.freeze) this.intro = 1;
    }
    this.camera.position.z = p.cameraZ;
    this.subjectGroup.scale.setScalar(p.subjectScale * this.narrowFit());
    this.subjectGroup.position.x = p.subjectX + (this.viewportWidth < STEP_UNDER && this.aspect >= 1.2 ? NARROW_STEP : 0) + this.smoothed.x * p.subjectParallax;
    this.subjectGroup.position.y = p.subjectY - this.smoothed.y * p.subjectParallax - this.riseOffset(t, p);

    // the shared step: pace off the smoothed pointer
    const step = Math.hypot(this.smoothed.x - this.lastSmoothed.x, this.smoothed.y - this.lastSmoothed.y);
    if (this._tier.pointerEnabled) {
      const target = Math.min(1, step / Math.max(p.pacePeak, 1e-5));
      this.pace += (target - this.pace) * (target > this.pace ? p.paceAttack : p.paceRelease);
    } else if (!autoEnabled && this.intro >= 1 && this._tier.reveal) this.pace = 1;
    this.lastSmoothed.x = this.smoothed.x; this.lastSmoothed.y = this.smoothed.y;
    const oldest = this.trail.pop();
    if (oldest) { oldest.set(this.smoothed.x, -this.smoothed.y); this.trail.unshift(oldest); }

    if (this.headMaterial) {
      const u = this.headMaterial.uniforms;
      u.uParallax.value.set(this.smoothed.x, -this.smoothed.y);
      u.uReveal.value = this.reveal; u.uDepthScale.value = p.headParallax; u.uRelight.value = p.headRelight;
      u.uScanTime.value = t; u.uScanPeriod.value = p.outlinePeriod; u.uScanStagger.value = p.outlineStagger;
      u.uScanOpacity.value = p.outlineOpacity; u.uScanWidth.value = p.outlineWidth;
      u.uScanMix.value = this._tier.outline ? this.burnProgress(p) : 0;
      this.headMesh.scale.setScalar(p.headScale);
    }
    const R = this.revealUniforms;
    if (R) {
      R.uAspect.value = this.aspect; R.uRadius.value = p.trailRadius; R.uIdleScale.value = p.trailIdleScale;
      R.uTaper.value = p.trailTaper; R.uTaperIdle.value = p.trailTaperIdle; R.uTaperFast.value = p.trailTaperFast;
      R.uLength.value = p.trailLength; R.uPace.value = this.pace; R.uGateStart.value = p.paceThreshold; R.uGateWidth.value = p.paceRamp;
      R.uWarpScale.value = p.revealWarpScale; R.uTime.value = t * p.revealSpeed; R.uRevealMix.value = this.reveal;
      R.uThreshold.value = p.revealThreshold; R.uEdge.value = p.revealEdge; R.uWarp.value = p.revealWarp;
      R.uIntro.value = this.intro; R.uBurnStart.value = p.burnStart; R.uBurnSoft.value = p.burnSoftness; R.uBurnGlow.value = p.burnGlow;
      R.uSweepPace.value = this.sweepPace; R.uSweepWarp.value = p.sweepWarp; R.uSweepLength.value = p.sweepLength; R.uSweepRadius.value = p.sweepRadius;
      this.writeTrailBounds(this.trail, p.trailLength, p.revealWarp, p.trailRadius, R.uTrailMin.value, R.uTrailMax.value);
      this.writeTrailBounds(this.sweepTrail, p.sweepLength, p.sweepWarp, p.sweepRadius, R.uSweepMin.value, R.uSweepMax.value);
    }
    if (this.backdropMesh) {
      const distance = this.camera.position.z - BACKDROP_Z;
      const height = 2 * distance * Math.tan((this.camera.fov * Math.PI) / 360) * 1.06;
      this.backdropMesh.scale.set(height * this.aspect, height, 1);
      const bg = this.backdropMaterial.uniforms;
      bg.uLineScale.value = p.bgLineScale; bg.uLineCount.value = p.bgLineCount; bg.uLineThickness.value = p.bgLineThickness;
      bg.uLineOpacity.value = p.bgLineOpacity; bg.uWaveAmount.value = p.bgWaveAmount; bg.uWaveSpeed.value = p.bgWaveSpeed;
      bg.uRevealOpacity.value = p.bgRevealOpacity;
      bg.uRevealColor.value.setScalar(p.bgRevealLightness); bg.uRevealColorAlt.value.setScalar(p.bgRevealLightnessAlt);
    }
    this.renderer.render(this.scene, this.camera);
  }
  riseOffset(t, p) {
    if (this._tier.freeze || p.riseDistance === 0) return 0;
    let remaining = 1;
    if (this.riseStarted) {
      if (this.riseAt === null) this.riseAt = t;
      const u = Math.min(1, (t - this.riseAt) / Math.max(p.riseDuration, 0.001));
      remaining = 1 - (1 - (1 - u) * (1 - u));
    }
    if (remaining <= 0) return 0;
    const visible = 2 * p.cameraZ * Math.tan((this.camera.fov * Math.PI) / 360);
    return remaining * p.riseDistance * (visible / this.viewportHeight);
  }
  burnProgress(p) {
    const span = Math.max(1 - p.burnStart, 1e-4);
    const x = Math.min(1, Math.max(0, (this.intro - p.burnStart) / span));
    return x * x * (3 - 2 * x);
  }
  resetSweep() {
    const start = AUTO_SWEEP_PATH[0], amount = this.params.autoSweepAmount;
    const x = start.x * amount, y = start.y * amount;
    Object.assign(this.sweepPointer, { x, y }); Object.assign(this.sweepSmoothed, { x, y }); Object.assign(this.sweepLast, { x, y });
    this.sweepPace = 0;
    for (const s of this.sweepTrail) s.set(x, -y);
  }
  narrowFit() {
    if (this.viewportWidth >= PORT_WIDTH) return 1;
    if (this.aspect < 1.2) return 1;
    return Math.max(MIN_FIT, Math.min(1, this.aspect / REFERENCE_ASPECT));
  }
  writeTrailBounds(trail, length, warp, radius, min, max) {
    const activeN = Math.min(trail.length, Math.ceil(length * (this.samples - 1)) + 1);
    const margin = radius + warp * 0.22 + 0.05;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let i = 0; i < activeN; i += 1) {
      const s = trail[i]; const x = s.x * this.aspect;
      if (x < minX) minX = x; if (x > maxX) maxX = x; if (s.y < minY) minY = s.y; if (s.y > maxY) maxY = s.y;
    }
    min.set(minX - margin, minY - margin); max.set(maxX + margin, maxY + margin);
  }
  async load() {
    const image = await loadImage(PHOTO);
    if (this.disposed) return;
    const mip = (tex) => { tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true; tex.needsUpdate = true; return tex; };
    const diffuse = mip(new THREE.Texture(image)); diffuse.colorSpace = THREE.SRGBColorSpace;
    const maps = makeDepthNormal(image);
    const depth = mip(new THREE.CanvasTexture(maps.depth));
    const normal = mip(new THREE.CanvasTexture(maps.normal));
    const noise = mip(new THREE.CanvasTexture(makeNoiseCanvas()));
    noise.wrapS = noise.wrapT = THREE.RepeatWrapping;
    const accent = new THREE.Color(readToken("--accent"));
    this.revealUniforms = {
      uTrail: { value: this.trail }, uTrailMin: { value: new THREE.Vector2(-1e3, -1e3) }, uTrailMax: { value: new THREE.Vector2(1e3, 1e3) },
      uSweep: { value: this.sweepTrail }, uSweepMin: { value: new THREE.Vector2(-1e3, -1e3) }, uSweepMax: { value: new THREE.Vector2(1e3, 1e3) },
      uSweepPace: { value: 0 }, uSweepWarp: { value: DEFAULT_PARAMS.sweepWarp }, uSweepLength: { value: DEFAULT_PARAMS.sweepLength },
      uSweepRadius: { value: DEFAULT_PARAMS.sweepRadius }, uAspect: { value: this.aspect }, uRadius: { value: DEFAULT_PARAMS.trailRadius },
      uIdleScale: { value: DEFAULT_PARAMS.trailIdleScale }, uTaper: { value: DEFAULT_PARAMS.trailTaper }, uTaperIdle: { value: DEFAULT_PARAMS.trailTaperIdle },
      uTaperFast: { value: DEFAULT_PARAMS.trailTaperFast }, uLength: { value: DEFAULT_PARAMS.trailLength }, uPace: { value: 0 },
      uGateStart: { value: DEFAULT_PARAMS.paceThreshold }, uGateWidth: { value: DEFAULT_PARAMS.paceRamp }, uWarpScale: { value: DEFAULT_PARAMS.revealWarpScale },
      uTime: { value: 0 }, uThreshold: { value: DEFAULT_PARAMS.revealThreshold }, uEdge: { value: DEFAULT_PARAMS.revealEdge },
      uWarp: { value: DEFAULT_PARAMS.revealWarp }, uRevealMix: { value: 0 }, uNoiseTex: { value: noise },
      uIntro: { value: 0 }, uBurnStart: { value: DEFAULT_PARAMS.burnStart }, uBurnSoft: { value: DEFAULT_PARAMS.burnSoftness },
      uBurnGlow: { value: DEFAULT_PARAMS.burnGlow }, uBurnColor: { value: accent },
    };
    // the photograph
    const H = HEAD_HEIGHT, W = H * PHOTO_ASPECT;
    this.headMaterial = new THREE.ShaderMaterial({
      vertexShader: headVertex, fragmentShader: buildHeadFragment(this.samples), transparent: true, depthWrite: false,
      uniforms: {
        ...this.revealUniforms,
        uDiffuse: { value: diffuse }, uDepth: { value: depth }, uNormal: { value: normal },
        uCrop: { value: new THREE.Vector4(CROP.x0, 0, CROP.x1 - CROP.x0, 1) },
        uParallax: { value: new THREE.Vector2() }, uReveal: { value: 0 },
        uDepthScale: { value: DEFAULT_PARAMS.headParallax }, uRelight: { value: DEFAULT_PARAMS.headRelight },
        uInk: { value: new THREE.Color(readToken("--surface-black")) },
        uScanTime: { value: 0 }, uScanPeriod: { value: 3.1 }, uScanStagger: { value: 1.2 }, uScanOpacity: { value: 0.09 },
        uScanWidth: { value: 0.15 }, uScanMix: { value: 0 }, uGridScale: { value: new THREE.Vector2(20 * PHOTO_ASPECT, 20) },
        uDotPx: { value: 5 * this.renderer.getPixelRatio() },
      },
    });
    this.headMesh = new THREE.Mesh(new THREE.PlaneGeometry(W, H), this.headMaterial);
    this.headMesh.renderOrder = 1;
    this.subjectGroup.add(this.headMesh);
    // the backdrop
    this.backdropMaterial = new THREE.ShaderMaterial({
      vertexShader: backdropVertex, fragmentShader: buildBackdropFragment(this.samples), depthWrite: false,
      uniforms: {
        ...this.revealUniforms,
        uBackground: { value: new THREE.Color(readToken("--background")) }, uLineColor: { value: new THREE.Color(readToken("--surface-soft")) },
        uRevealColor: { value: new THREE.Color().setScalar(DEFAULT_PARAMS.bgRevealLightness) },
        uRevealColorAlt: { value: new THREE.Color().setScalar(DEFAULT_PARAMS.bgRevealLightnessAlt) },
        uLineScale: { value: 3.8 }, uLineCount: { value: 2.5 }, uLineThickness: { value: 1.4 }, uLineOpacity: { value: 0.85 },
        uWaveAmount: { value: 0.37 }, uWaveSpeed: { value: 1.66 }, uRevealOpacity: { value: 1 },
      },
    });
    this.backdropMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.backdropMaterial);
    this.backdropMesh.position.z = BACKDROP_Z; this.backdropMesh.renderOrder = -1;
    this.scene.add(this.backdropMesh);

    this.reveal = 1;
    for (const tex of [diffuse, depth, normal, noise]) this.renderer.initTexture(tex);
    await this.renderer.compileAsync(this.scene, this.camera);
    if (this.disposed) return;
    this.renderer.render(this.scene, this.camera);
    this.ready = true;
    this.onReady?.();
  }
}
