/* F1 layout of the shared SITE record. Content itself lives in SITE (site-data.js);
   this only says which records sit in which timeline plate. Refs: "a:<achievement id>" | "p:<project id>". */
const PORTFOLIO = (() => {
  const { achievements, projects, counts } = window.SITE;
  const A = Object.fromEntries(achievements.map((a) => [a.id, a]));
  const P = Object.fromEntries(projects.map((p) => [p.id, p]));
  const KIND = { award: "won", final: "final", participation: "part", certificate: "cert", course: "cert" };
  const PKIND = { built: "built", concept: "concept", ongoing: "ongoing", team: "part" };
  const entry = (ref, overrides = {}) => {
    if (ref.slot) return ref;
    const [t, id] = ref.split(":");
    if (t === "a") {
      const a = A[id];
      return { name: a.title, detail: [a.category, a.level, a.detail].filter(Boolean).join(" · "), status: a.dateLabel && a.kind !== "award" && a.kind !== "final" && a.kind !== "participation" ? a.dateLabel : a.result,
        kind: KIND[a.kind], href: a.certificate ? `#!media/${a.certificate}` : a.project ? `#!project/${a.project}` : null, ...overrides };
    }
    const p = P[id];
    return { name: p.title, detail: p.summary, status: p.status.split(" · ")[0], kind: PKIND[p.statusKind] || "part", href: `#!project/${p.id}`, ...overrides };
  };
  const cats = [
    { label: "awards & recognition", title: "Awards & Recognition", frame: "centre",
      copy: ["Recognition.", "Second place in Expressions App Design, and the final round of the SHAREO product-launch competition."],
      refs: ["a:expressions", "a:shareo"] },
    { label: "robotics & electronics", title: "Robotics & Electronics", frame: "side", align: "right",
      refs: ["p:arduino-robotics", "a:robotex"] },
    { label: "competitions & hackathons", title: "Competitions & Hackathons", frame: "centre", image: "media/thumbs/mars_survival_mission_poster.webp",
      copy: ["On the grid.", "Team and individual entries across space, robotics and computing — each one a chance to test ideas against the clock."],
      refs: ["a:nasa-space-apps", "a:robotex", "a:school-computer"] },
    { label: "game development", title: "Game Development", frame: "side", align: "left", image: "media/thumbs/01_exterior_front_threequarter.webp",
      refs: ["p:last-signal", "p:aurora-7", "p:last-signal-assets"] },
    { label: "certificates", title: "Certificates", frame: "centre", image: "media/blue-ocean-certificate.webp",
      copy: ["On paper.", "A Blue Ocean entrepreneurship course and a Codingal creative-coding certificate."],
      refs: ["a:blue-ocean", "a:codingal"] },
    { label: "coding & software", title: "Coding & Software", frame: "side", align: "right",
      refs: ["p:raspberry-pi-server", "p:adr-editing-ai"] },
    { label: "academic & creative", title: "Academic & Creative Projects", frame: "centre",
      copy: ["Beyond the screen.", "School work, photo and video experiments, and an early Scratch project from Codingal."],
      refs: ["p:school-creative", "p:creative-images", "p:creative-videos"] },
    { label: "currently exploring", title: "Currently Exploring", frame: "side", align: "left",
      refs: [{ name: "AI creative tools", status: "Ongoing", kind: "ongoing" }, { name: "Robotics & sensors", status: "Ongoing", kind: "ongoing" }, { name: "3D & game dev", status: "Ongoing", kind: "ongoing" }] },
  ];
  return {
    categories: cats.map((c) => ({ ...c, entries: c.refs.map((r) => (typeof r === "string" ? entry(r) : r)) })),
    strip: [
      { round: "app design", name: "expressions", date: "2nd place", x: 347, w: 100, mark: "P2", href: "#!projects" },
      { round: "innovation", name: "shareo", date: "final round", x: 511, w: 100, mark: "FIN" },
      { round: "nasa · 2026", name: "space apps", date: "team", x: 675, w: 100, live: true, href: "#!project/last-signal" },
      { round: "school", name: "computing", date: "participant", x: 839, w: 114, ring: true },
      { round: "aum", name: "robotex", date: "participant", x: 1017, w: 76, ring: true },
    ],
    workshopStats: [
      { icon: "flag", label: "best result", value: "2nd" },
      { icon: "bars", label: "competitions", value: String(counts.competitions) },
      { icon: "trophy", label: "projects", value: String(counts.projects) },
      { icon: "gauge", label: "certificates", value: String(counts.certificates) },
    ],
    footerNav: [["home", "#top"], ["record", "#record"], ["projects", "#!projects"], ["gallery", "#!gallery"], ["achievements", "#achievements"]],
  };
})();
