/* ════════════════════════════════════════════════════════════════════════
   SITE — the ONE record both themes read. Edit content here only.
   · Projects:      SITE.projects     (shown in both themes + Projects page)
   · Achievements:  SITE.achievements (competitions, awards, certificates)
   · Media:         SITE.media        (gallery, project galleries, lightbox)
     type: "image" | "video" | "pdf"; files live in ./media/
     credit: "ayaan" | "team" | "ayaan-team" — shown on every caption.
   · Leave a field null (or out) and it is simply not shown.
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  const TBA = null; // unknown facts are simply left out of the page

  const profile = {
    name: "Shaik Ayaan",
    display: "AYAAN",
    grade: "Grade 9",
    school: "FAIPS / DPS Kuwait",
    location: "Kuwait",
    title: "Student Developer & Creative Technologist",
    tagline: "Young mind. Big ideas. Building the future.",
    intro: [
      "Hey! I'm Shaik Ayaan, a Grade 9 student developer from Kuwait who loves experimenting with technology.",
      "I'm passionate about coding, robotics, artificial intelligence, game development, electronics, and building creative digital experiences.",
      "I enjoy learning new technologies, solving problems, participating in competitions, and turning ideas into real projects.",
      "From robotics experiments to Mars survival games and creative AI concepts, I'm always exploring something new.",
    ],
    about: "I'm a student developer who loves exploring the possibilities of technology. Whether I'm working with robotics, experimenting with code, exploring game development, or learning about AI, I believe every project is an opportunity to build something new.",
    interests: ["Artificial Intelligence", "Robotics", "Game Development", "Programming", "Electronics", "Space Exploration", "UI/UX Design", "Creative Media", "Entrepreneurship", "3D Development"],
    // Contact: add links as { label, href } and they appear in the footer.
    contact: { email: "azbruh.20@icloud.com", links: [] },
  };

  /* kind: "award" (placed) · "final" (reached a final) · "participation" · "certificate" · "course"
     competition: true counts it as a competition attended */
  const achievements = [
    { id: "expressions", title: "Expressions App Design", result: "Second Place", kind: "award", competition: true,
      category: "App Design", level: "CBSE-level (as previously reported)", detail: "App design competition." },
    { id: "shareo", title: "SHAREO Product Launch", result: "Reached Final Round", kind: "final", competition: true,
      category: "Product Innovation & Entrepreneurship", detail: "Product-launch competition — advanced to the final round." },
    { id: "nasa-space-apps", title: "NASA Space Apps Challenge 2026", result: "Team Participation", kind: "participation", competition: true,
      category: "Hackathon · Space", year: "2026", location: "Kuwait", project: "last-signal", detail: "Team LAST SIGNAL, Kuwait." },
    { id: "robotex", title: "AUM ROBOTEX", result: "Participation", kind: "participation", competition: true,
      category: "Robotics", detail: "Robotics competition." },
    { id: "school-computer", title: "School Computer Competition", result: "Participation", kind: "participation", competition: true,
      category: "Computing & Technology", detail: "School-level computing & problem-solving." },
    { id: "blue-ocean", title: "Blue Ocean Student Entrepreneurs", result: "Certificate of Completion", kind: "course", certificate: "cert-blue-ocean",
      category: "Entrepreneurship · Mini-course", date: "2026-11-07", dateLabel: "7 Nov 2026",
      detail: "Completed the Blue Ocean Student Entrepreneurs Mini-Course on Blue Ocean Strategy and pitching." },
    { id: "codingal", title: "Codingal", result: "Certificate of Achievement", kind: "certificate", project: "scratch-coding",
      category: "Creative Coding / Scratch", dateLabel: "Jul 2025", detail: "Certificate of Achievement for creative coding with Scratch." },
  ];

  /* the LAST SIGNAL renders (game visual assets — made by Ayaan, per his records) */
  const LS = "media/last-signal/";
  const lsImg = (file, caption, project) => ({ id: "ls-" + file.slice(0, 2), type: "image", src: LS + file + ".webp", thumb: "media/thumbs/" + file + ".webp",
    caption, project, category: "3d", credit: "ayaan" });
  const aurora = [
    ["01_exterior_front_threequarter", "AURORA-7 exterior — front three-quarter"], ["02_exterior_rear_threequarter", "AURORA-7 exterior — rear three-quarter"],
    ["03_exterior_side_profile", "AURORA-7 exterior — side profile"], ["04_exterior_top", "AURORA-7 exterior — top view"],
    ["05_eva_hatch_detail", "EVA hatch detail"], ["06_cargo_ramp_deployed", "Cargo ramp deployed"],
    ["07_cockpit_six_seats", "Cockpit — six crew seats"], ["08_cockpit_pilot_eye", "Cockpit — pilot's eye view"],
    ["09_corridor_forward", "Corridor — looking forward"], ["10_corridor_aft", "Corridor — looking aft"],
    ["11_engineering", "Engineering bay"], ["12_life_support", "Life support"], ["13_eva_suit_bay", "EVA suit bay"],
    ["14_airlock_interior", "Airlock interior"], ["15_cargo_rover_bay", "Cargo & rover bay"], ["16_science_lab", "Science lab"],
    ["17_comms_aura", "Comms — AURA"], ["18_crew_quarters", "Crew quarters"], ["19_galley", "Galley"], ["20_plant_bay", "Plant bay (food production)"],
    ["21_doorway_corridor_connection", "Doorway & corridor connection"], ["22_emergency_lighting", "Emergency lighting study"],
  ].map(([f, c]) => lsImg(f, c, "aurora-7"));
  const assets = [
    ["23_repair_interactables_sheet", "Repair interactables — asset sheet"], ["24_astronaut_neutral", "Astronaut — neutral pose"],
    ["25_astronaut_walk", "Astronaut — walk"], ["26_astronaut_run", "Astronaut — run"], ["27_astronaut_repair_use", "Astronaut — repair / use"],
    ["28_service_hatch_handrails", "Service hatch & handrails"], ["29_cargo_ramp_door_animation_states", "Cargo ramp door — animation states"],
    ["30_nav_collision_diagnostic", "Navigation collision diagnostic"],
  ].map(([f, c]) => lsImg(f, c, "last-signal-assets"));

  const media = [
    { id: "portrait", type: "image", src: "media/ayaan.webp", thumb: "media/ayaan.webp", caption: "Shaik Ayaan — NASA Space Apps Challenge T-shirt", project: null, category: "images", credit: "ayaan" },
    { id: "ls-poster", type: "image", src: LS + "mars_survival_mission_poster.webp", thumb: "media/thumbs/mars_survival_mission_poster.webp",
      caption: "LAST SIGNAL — Mars Survival Mission poster (NASA Space Apps 2026, team)", project: "last-signal", category: "game", credit: "team" },
    { id: "ls-overview", type: "image", src: LS + "aurora7_ship_overview.webp", thumb: "media/thumbs/aurora7_ship_overview.webp",
      caption: "AURORA-7 ship overview — deck plan", project: "aurora-7", category: "3d", credit: "ayaan" },
    { id: "ls-interior", type: "image", src: LS + "aurora7_interior_gallery.webp", thumb: "media/thumbs/aurora7_interior_gallery.webp",
      caption: "AURORA-7 interior gallery", project: "aurora-7", category: "3d", credit: "ayaan" },
    ...aurora, ...assets,
    { id: "ls-book", type: "pdf", src: LS + "project-book.pdf", thumb: "media/thumbs/mars_survival_mission_poster.webp",
      caption: "LAST SIGNAL — complete project book (PDF, team document)", project: "last-signal", category: "game", credit: "team" },
    { id: "cert-blue-ocean", type: "pdf", src: "media/blue-ocean-certificate.pdf", thumb: "media/blue-ocean-certificate.webp", preview: "media/blue-ocean-certificate.webp",
      caption: "Blue Ocean Student Entrepreneurs — Certificate of Completion, 7 Nov 2026", project: null, category: "certificates", credit: "ayaan" },
  ];

  const projects = [
    { id: "last-signal", n: "01", title: "LAST SIGNAL", year: "2026", status: "Team project · NASA Space Apps 2026", statusKind: "team",
      filters: ["game", "3d"], category: "Game Development · Team of six", cover: "ls-poster",
      summary: "A collaborative six-member 3D Mars survival and educational game built for NASA Space Apps Challenge 2026.",
      overview: "LAST SIGNAL is a team project exploring a 3D Mars survival and educational game: Mars exploration, astronaut teamwork, oxygen management, power systems, food production, rover navigation, Mars terrain, the AURORA-7 spacecraft, a Martian research outpost, interactive learning and mission evaluation.",
      contribution: "Game visual assets — 3D models, renders and environments (including AURORA-7 and the astronaut set) — plus the Raspberry Pi 4 server the team developed on. Music, audio and project data were produced by teammates.",
      technologies: ["3D modelling & rendering", "Raspberry Pi 4", "SSH", "Git"],
      process: ["Mars exploration", "Astronaut teamwork", "Oxygen management", "Power systems", "Food production", "Rover navigation", "Mars terrain", "AURORA-7 spacecraft", "Martian research outpost", "Interactive learning", "Mission evaluation"],
      results: "Team participation — NASA Space Apps Challenge 2026, Kuwait.", lessons: TBA,
      related: ["aurora-7", "last-signal-assets", "last-signal-audio", "raspberry-pi-server"] },
    { id: "aurora-7", n: "02", title: "AURORA-7 Spacecraft", year: "2026", status: "Visual development · LAST SIGNAL", statusKind: "built",
      filters: ["3d", "game", "images"], category: "3D & Design", cover: "ls-01",
      summary: "The spacecraft at the heart of LAST SIGNAL — exterior, cockpit, corridors and every interior bay, modelled and rendered.",
      overview: "Visual development for the AURORA-7 spacecraft used in LAST SIGNAL: exterior views, the six-seat cockpit, corridors, engineering, life support, EVA and suit bays, airlock, cargo & rover bay, science lab, comms, crew quarters, galley, plant bay and lighting studies.",
      contribution: "Spacecraft renders, cockpit designs, 3D environments, materials and lighting studies — credited to Ayaan.",
      technologies: ["3D modelling", "Materials", "Lighting", "Rendering"], process: ["Exterior design", "Cockpit layout", "Interior bays", "Materials", "Lighting studies", "Prototype screenshots"],
      results: "Used as the main spacecraft environment for LAST SIGNAL.", lessons: TBA, related: ["last-signal", "last-signal-assets"] },
    { id: "last-signal-assets", n: "03", title: "LAST SIGNAL 3D Assets", year: "2026", status: "Game assets · LAST SIGNAL", statusKind: "built",
      filters: ["3d", "game"], category: "3D & Design", cover: "ls-24",
      summary: "Astronaut models and animation poses, repair interactables, hatches, ramp animation states and navigation diagnostics.",
      overview: "The 3D asset set for LAST SIGNAL: astronaut model with neutral, walk, run and repair/use poses, repair interactables, service hatch & handrails, cargo ramp door animation states and a navigation collision diagnostic.",
      contribution: "Game assets credited to Ayaan. Audio, music and project data in LAST SIGNAL were made by teammates.",
      technologies: ["3D modelling", "Animation poses", "GLB export"], process: ["Astronaut model", "Animation previews", "Interactables", "Equipment models", "Contact sheets", "Navigation diagnostics"],
      results: "Delivered for the LAST SIGNAL team build.", lessons: TBA, related: ["last-signal", "aurora-7"] },
    { id: "last-signal-audio", n: "04", title: "LAST SIGNAL Audio & Cutscenes", year: "2026", status: "Team project · LAST SIGNAL", statusKind: "team",
      filters: ["game", "videos"], category: "Game Development · Audio", cover: null,
      summary: "Audio integration, mission voice concepts, cinematic scenes and story sequences for LAST SIGNAL.",
      overview: "The sound and story layer of LAST SIGNAL — audio integration, mission voice concepts, cinematic scenes, story sequences and cutscene planning.",
      contribution: "Music, audio and voice were produced by teammates.",
      technologies: [TBA], process: ["Audio integration", "Mission voice concepts", "Cinematic scenes", "Story sequences", "Cutscene planning"],
      results: TBA, lessons: TBA, related: ["last-signal"] },
    { id: "arduino-robotics", n: "05", title: "Arduino Robotics", year: null, status: "Ongoing experiments", statusKind: "ongoing",
      filters: ["robotics"], category: "Robotics & Electronics", cover: null,
      summary: "Electronics and robotics experiments — sensors, motor control, line-following robots and a lot of troubleshooting.",
      overview: "Hands-on Arduino work: Arduino Uno, sensors, motor control, line-following robots, circuit wiring, troubleshooting and programming experiments.",
      contribution: "Personal experiments — programming, wiring and troubleshooting.",
      technologies: ["Arduino Uno", "Sensors", "Motor drivers", "C/C++ (Arduino)"], process: ["Circuit wiring", "Sensor reading", "Motor control", "Line-following", "Troubleshooting"],
      results: "Related competition: AUM ROBOTEX (participation).", lessons: TBA, related: ["raspberry-pi-server"] },
    { id: "raspberry-pi-server", n: "06", title: "Raspberry Pi Server", year: "2026", status: "Built & configured", statusKind: "built",
      filters: ["software"], category: "Software & Infrastructure", cover: null,
      summary: "A Raspberry Pi 4 set up as the LAST SIGNAL team's collaboration server — SSH, Git and a shared repository.",
      overview: "Collaboration infrastructure for LAST SIGNAL: a Raspberry Pi 4 on the local network with SSH access, Git and a shared development repository the team builds from.",
      contribution: "Configured the Raspberry Pi 4, SSH access, Git and the shared repository.",
      technologies: ["Raspberry Pi 4", "Linux", "SSH", "Git", "Local network"], process: ["Pi setup", "SSH access", "Git server", "Shared repository", "Team onboarding"],
      results: "Used by the LAST SIGNAL development team.", lessons: TBA, related: ["last-signal"] },
    { id: "adr-editing-ai", n: "07", title: "ADR Editing AI", year: null, status: "Concept", statusKind: "concept",
      filters: ["software", "videos"], category: "Software & AI", cover: null,
      summary: "A concept for an AI-powered video editor — automatic edits, cinematic effects and music sync.",
      overview: "An AI-powered video-editing application concept. Planned (not yet implemented): automatic video editing, cinematic effects, music synchronization, creative transformations and high-resolution exports.",
      contribution: "Original concept and feature planning.", technologies: ["Concept stage"],
      process: ["Automatic editing (planned)", "Cinematic effects (planned)", "Music sync (planned)", "Creative transformations (planned)", "High-res export (planned)"],
      results: "Concept — not yet built.", lessons: TBA, related: ["creative-videos"] },
    { id: "scratch-coding", n: "08", title: "Scratch Coding", year: "2025", status: "Codingal · Certificate", statusKind: "built",
      filters: ["software", "creative"], category: "Creative Coding", cover: null,
      summary: "An early programming project made during Codingal learning activities.",
      overview: "My early programming project created in Scratch during Codingal learning activities.", contribution: "Built individually.",
      technologies: ["Scratch"], process: [TBA], results: "Codingal Certificate of Achievement.", lessons: TBA, related: [] },
    { id: "creative-images", n: "09", title: "Creative Image Experiments", year: null, status: "Ongoing", statusKind: "ongoing",
      filters: ["images", "creative"], category: "Creative Media", cover: null,
      summary: "Cinematic edits, DSLR-style looks, night flash, motion blur, camera shake, logo compositions and AI transformations.",
      overview: "Photo-editing experiments: cinematic photography edits, DSLR-style edits, nighttime flash effects, motion blur, camera-shake effects, logo compositions, AI image transformations and creative photo editing.",
      contribution: "Personal edits.", technologies: [TBA], process: ["Cinematic edits", "DSLR-style edits", "Night flash", "Motion blur", "Camera shake", "Logo compositions", "AI transformations"],
      results: TBA, lessons: TBA, related: ["creative-videos"] },
    { id: "creative-videos", n: "10", title: "Creative Video Projects", year: null, status: "Ongoing", statusKind: "ongoing",
      filters: ["videos", "creative"], category: "Creative Media", cover: null,
      summary: "Video edits, cinematic effects, motion experiments and AI-assisted editing tests.",
      overview: "Video work: edits, cinematic effects, short demonstrations, motion experiments, AI-assisted editing experiments and game development recordings.",
      contribution: "Personal edits.", technologies: [TBA], process: ["Video edits", "Cinematic effects", "Motion experiments", "AI-assisted editing"],
      results: TBA, lessons: TBA, related: ["adr-editing-ai", "creative-images"] },
    { id: "school-creative", n: "11", title: "School & Creative Projects", year: null, status: "Contributor", statusKind: "built",
      filters: ["creative"], category: "Academic & Creative", cover: null,
      summary: "School presentations and creative academic work, including an Andhra Pradesh heritage presentation.",
      overview: "Confirmed school work: a presentation on Andhra Pradesh heritage — history, geography and cultural traditions.",
      contribution: "Contributed to the Andhra Pradesh heritage presentation.", technologies: ["Presentation design"], process: ["Research", "History", "Geography", "Cultural traditions"],
      results: TBA, lessons: TBA, related: [] },
  ];

  // drop unknowns so the page never shows a placeholder
  for (const p of projects) for (const k of ["technologies", "process"]) p[k] = p[k].filter(Boolean);

  const FILTERS = [["all", "All"], ["software", "Software & AI"], ["robotics", "Robotics"], ["game", "Game Development"], ["3d", "3D & Design"],
    ["images", "Images"], ["videos", "Videos"], ["creative", "Creative Projects"]];
  const MEDIA_FILTERS = [["all", "All"], ["3d", "3D & Design"], ["game", "Game"], ["images", "Images"], ["videos", "Videos"], ["certificates", "Certificates"]];

  const byId = (list) => Object.fromEntries(list.map((x) => [x.id, x]));
  const mediaById = byId(media);
  const projectById = byId(projects);
  const mediaFor = (projectId) => media.filter((m) => m.project === projectId);
  const coverOf = (p) => (p.cover && mediaById[p.cover]) || null;
  const counts = {
    projects: projects.length,
    competitions: achievements.filter((a) => a.competition).length,
    awards: achievements.filter((a) => a.kind === "award").length,
    certificates: achievements.filter((a) => a.kind === "certificate" || a.kind === "course").length,
    media: media.length,
  };
  const creditLabel = (c) => (c === "team" ? "Team asset" : c === "ayaan-team" ? "Ayaan + team" : "By Ayaan");

  window.SITE = { profile, achievements, projects, media, FILTERS, MEDIA_FILTERS, mediaById, projectById, mediaFor, coverOf, counts, creditLabel, TBA };
})();
