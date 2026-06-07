// ── timing (ms) ───────────────────────────────────────────────────────────
const STROKE_DUR = 2200;
const DOT_DELAY = 2000;
const RISE_DELAY = 320;
const RISE_DUR = 530;
const RISE_PEAK_T = 0.717;
const RISE_HEIGHT = 75;
const RISE_SCALE = 1.18;

// ── view data ─────────────────────────────────────────────────────────────
const VIEW_ORDER = ["home", "about", "contact"];
let currentView = "home";

const VIEWS = {
  home: {
    subheader: "Software design studio",
    caps: [
      { label: "Web" },
      { label: "Mobile" },
      { label: "Games" },
      { label: "AI" },
      { label: "Let's Talk", contact: true },
    ],
  },
  about: {
    subheader: "What we can do",
    caps: [
      // { label: "nopri is a software design studio in Richmond, VA. We build web apps, mobile experiences, games, and AI-powered tools.", wide: true, plain: true },
      { label: "Web Development" },
      { label: "Mobile Apps" },
      { label: "Game Development" },
      { label: "AI Consulting" },
      { label: "UI / UX Design" },
      { label: "Design Services" },
    ],
  },
  contact: {
    subheader: "Say Hello",
    caps: [
      { label: "Got a project? We'd love to hear about it." },
      { label: "Reach out", contact: true },
    ],
  },
};

const BOOKMARK_HEIGHTS = [104, 76, 56]; // tallest = active, decreasing by distance
const VIEW_COLORS = { home: "#dc5757", about: "#f3ce6a", contact: "#7096ca" };

function updateBookmarks(view) {
  const activeIdx = VIEW_ORDER.indexOf(view);
  document.querySelectorAll(".bookmark[data-view]").forEach((b) => {
    const dist = Math.abs(VIEW_ORDER.indexOf(b.dataset.view) - activeIdx);
    b.style.setProperty(
      "--bh",
      BOOKMARK_HEIGHTS[Math.min(dist, BOOKMARK_HEIGHTS.length - 1)] + "px",
    );
  });
}

function switchView(name) {
  currentView = name;

  const subEl = document.getElementById("subheader");
  const labelEl = document.getElementById("view-label");
  const capsEl = document.getElementById("capsules");
  const { subheader, caps } = VIEWS[name];

  subEl.textContent = subheader;

  const plainCap = caps.find((c) => c.plain);
  labelEl.textContent = plainCap ? plainCap.label : "";
  labelEl.style.textAlign = plainCap?.leftAlign ? "left" : "center";
  labelEl.style.display = plainCap ? "block" : "none";
  capsEl.style.marginTop = plainCap ? "0" : "";

  capsEl.innerHTML = "";
  caps
    .filter((c) => !c.plain)
    .forEach((cap, i) => {
      const btn = document.createElement("button");
      btn.className =
        "cap" +
        (cap.contact ? " cap--contact" : "") +
        (cap.wide ? " cap--wide" : "");
      if (cap.contact) {
        btn.innerHTML = `${cap.label}<span class="cap-arrow"></span>`;
      } else {
        btn.textContent = cap.label;
      }
      btn.style.animation = `cap-pop-in 0.42s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 100}ms both`;
      capsEl.appendChild(btn);
    });

  updateBookmarks(name);
  const color = VIEW_COLORS[name];
  document.documentElement.style.setProperty("--page-color", color);
  document.documentElement.style.backgroundColor = color;
  document.getElementById("footer").style.backgroundColor = color;
  document.querySelector('meta[name="theme-color"]').setAttribute("content", color);
}

document.addEventListener("click", (e) => {
  if (e.target.closest(".cap--contact")) {
    window.location.href = "mailto:nopritech@gmail.com";
  }
});

document.querySelectorAll(".bookmark[data-view]").forEach((b) => {
  b.addEventListener("click", () => switchView(b.dataset.view));
});

document.querySelectorAll(".footer-link[data-view]").forEach((b) => {
  b.addEventListener("click", () => switchView(b.dataset.view));
});

updateBookmarks("home");
document.getElementById("footer").style.backgroundColor = VIEW_COLORS["home"];
setTimeout(() => {
  document.documentElement.style.backgroundColor = VIEW_COLORS[currentView];
}, 3050);

// ── directional navigation (shared by scroll, swipe, keyboard) ───────────
let navLocked = false;

function navigateDir(dir) {
  if (navLocked) return;
  const next = VIEW_ORDER[VIEW_ORDER.indexOf(currentView) + dir];
  if (!next) return;
  navLocked = true;
  switchView(next);
  setTimeout(() => {
    navLocked = false;
  }, 700);
}

// scroll
document.addEventListener(
  "wheel",
  (e) => {
    navigateDir(e.deltaY > 0 ? 1 : -1);
  },
  { passive: true },
);

// keyboard
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown" || e.key === "ArrowRight") navigateDir(1);
  if (e.key === "ArrowUp" || e.key === "ArrowLeft") navigateDir(-1);
});

// swipe
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener(
  "touchstart",
  (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  },
  { passive: true },
);

document.addEventListener(
  "touchend",
  (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx)) return;
    navigateDir(dx < 0 ? 1 : -1);
  },
  { passive: true },
);

// ── ring animation trigger ────────────────────────────────────────────────
setTimeout(() => {
  document.querySelectorAll(".ring").forEach((r) => r.classList.add("go"));
}, 3050);

// ── SVG stroke reveal + rise/slam ─────────────────────────────────────────
document.fonts.ready.then(() => {
  const paths = ["mask-no", "mask-p", "mask-ri"].map((id) =>
    document.getElementById(id),
  );
  const lengths = paths.map((p) => p.getTotalLength());
  const total = lengths.reduce((a, b) => a + b, 0);

  let delay = 0;
  let lastStrokeAnim;
  paths.forEach((path, i) => {
    const len = lengths[i];
    const dur = (len / total) * STROKE_DUR;

    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;

    lastStrokeAnim = path.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], {
      duration: dur,
      delay,
      fill: "forwards",
      easing: "linear",
    });

    delay += dur;
  });

  // i-dot fades in at DOT_DELAY
  document
    .getElementById("mask-dot")
    .animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 150,
      delay: DOT_DELAY,
      fill: "forwards",
    });

  // rise/slam after strokes finish — tied to animation timeline, not setTimeout
  lastStrokeAnim.finished.then(() => {
    const svg = document.getElementById("nopri-reveal");
    const shadow = document.getElementById("nopri-shadow");

    shadow.animate([{ opacity: 0 }, { opacity: 0.25 }], {
      duration: RISE_DELAY,
      fill: "forwards",
    });

    const riseAnim = svg.animate(
      [
        {
          transform: "translateY(0px) scale(1)",
          offset: 0,
          easing: "cubic-bezier(0.215, 0.61, 0.355, 1)",
        },
        {
          transform: `translateY(-${RISE_HEIGHT}px) scale(${RISE_SCALE})`,
          offset: RISE_PEAK_T,
          easing: "cubic-bezier(0.55, 0.055, 0.675, 0.19)",
        },
        { transform: "translateY(0px) scale(1)", offset: 1 },
      ],
      { duration: RISE_DUR, delay: RISE_DELAY, fill: "forwards" },
    );

    riseAnim.finished.then(() => {
      shadow.animate([{ opacity: 0.25 }, { opacity: 0 }], {
        duration: 200,
        fill: "forwards",
      });
    });
  });
});
