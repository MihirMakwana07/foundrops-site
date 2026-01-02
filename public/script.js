/* FoundrOps site JS
   Goals:
   - Keep it light and reliable
   - Fix mobile nav
   - Scroll reveals (subtle)
   - Spotlight hover (desktop only)
   - Process: tap-to-open modal (no new page)
   - Work around stale service worker caches if present
*/

(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // 1) If an old service worker exists (your Network screenshot shows sw.js),
  // unregister it once and clear caches to avoid stale assets.
  // This helps with "my changes aren't showing" and weird layout behaviors.
  // MDN: unregister() :contentReference[oaicite:10]{index=10}
  (async function cleanupServiceWorkerOnce() {
    try {
      if (!("serviceWorker" in navigator)) return;
      const key = "fo_sw_cleanup_done_v1";
      if (localStorage.getItem(key) === "1") return;

      const regs = await navigator.serviceWorker.getRegistrations();
      if (regs && regs.length) {
        await Promise.all(regs.map(r => r.unregister()));
      }

      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }

      localStorage.setItem(key, "1");
    } catch (e) {
      // Silent fail. We do not want user-facing breakage.
    }
  })();

  // 2) Mobile nav
  const toggle = $(".nav-toggle");
  const menu = $("#navMenu");
  if (toggle && menu) {
    const closeMenu = () => {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
    };
    toggle.addEventListener("click", () => {
      const open = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });

    // Close on link click
    $$(".nav-link", menu).forEach(a => a.addEventListener("click", closeMenu));

    // Close on outside click
    document.addEventListener("click", (e) => {
      const target = e.target;
      if (!menu.classList.contains("is-open")) return;
      if (target === toggle || toggle.contains(target)) return;
      if (target === menu || menu.contains(target)) return;
      closeMenu();
    });

    // Close on escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });
  }

  // 3) Scroll reveal (subtle, stagger via CSS var --d)
  const reveals = $$(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.18 });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  // 4) Spotlight hover (desktop pointer only)
  const spotlight = document.querySelector("[data-spotlight]");
  if (spotlight && window.matchMedia("(hover:hover)").matches) {
    const setPos = (e) => {
      const r = spotlight.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      spotlight.style.setProperty("--mx", `${x}%`);
      spotlight.style.setProperty("--my", `${y}%`);
    };
    spotlight.addEventListener("pointermove", setPos);
  }

  // 5) Process modal using <dialog>
  // MDN dialog + showModal :contentReference[oaicite:11]{index=11}
  const dialog = $("#processDialog");
  const closeBtn = $("#processClose");
  const kickerEl = $("#processKicker");
  const titleEl = $("#processTitle");
  const bodyEl = $("#processBody");

  const PROCESS = {
    diagnose: {
      kicker: "Step 1",
      title: "Diagnose",
      body: `
        <p>We align on what “good” looks like, what we are optimizing for, and what cannot break.</p>
        <h4>What we clarify</h4>
        <ul>
          <li>Objective, constraints, timeline</li>
          <li>Success metrics and leading indicators</li>
          <li>Ownership, feedback loop, weekly cadence</li>
        </ul>
        <h4>Output</h4>
        <ul>
          <li>Scope + milestones</li>
          <li>System map (what we build first)</li>
        </ul>
      `
    },
    build: {
      kicker: "Step 2",
      title: "Build",
      body: `
        <p>We set up the workflow so it can be run consistently and measured cleanly.</p>
        <h4>What we set up</h4>
        <ul>
          <li>Tools, templates, trackers, QA checks</li>
          <li>Playbooks for repeatability</li>
          <li>Reporting that drives decisions</li>
        </ul>
        <h4>Output</h4>
        <ul>
          <li>Working system (not a doc)</li>
          <li>Dashboards + operating rhythm</li>
        </ul>
      `
    },
    run: {
      kicker: "Step 3",
      title: "Run",
      body: `
        <p>We operate the system, ship work weekly, and improve what the data tells us.</p>
        <h4>What happens weekly</h4>
        <ul>
          <li>Execution + QA</li>
          <li>Tracking + insights</li>
          <li>Iterate messaging, targeting, or ops flow</li>
        </ul>
        <h4>Output</h4>
        <ul>
          <li>Consistent throughput</li>
          <li>Measurable improvements over time</li>
        </ul>
      `
    },
    handoff: {
      kicker: "Step 4",
      title: "Handoff",
      body: `
        <p>We document and transfer ownership so the system keeps running without us.</p>
        <h4>What we hand over</h4>
        <ul>
          <li>SOPs + checklists</li>
          <li>Templates + trackers</li>
          <li>Clear ownership and next steps</li>
        </ul>
        <h4>Output</h4>
        <ul>
          <li>Clean handoff</li>
          <li>Less founder drag going forward</li>
        </ul>
      `
    }
  };

  const openProcess = (key) => {
    if (!dialog || !PROCESS[key]) return;
    const data = PROCESS[key];
    if (kickerEl) kickerEl.textContent = data.kicker;
    if (titleEl) titleEl.textContent = data.title;
    if (bodyEl) bodyEl.innerHTML = data.body;

    try {
      // Prefer showModal if supported
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "open");
    } catch (e) {
      dialog.setAttribute("open", "open");
    }
  };

  const closeProcess = () => {
    if (!dialog) return;
    try {
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
    } catch (e) {
      dialog.removeAttribute("open");
    }
  };

  $$(".step-card").forEach(btn => {
    btn.addEventListener("click", () => openProcess(btn.getAttribute("data-step")));
  });

  if (closeBtn) closeBtn.addEventListener("click", closeProcess);

  if (dialog) {
    // Close when clicking backdrop area
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) closeProcess();
    });
  }

  // 6) Process rail progress fill (visual feedback, subtle)
  const processSection = $("#process");
  const progressEl = $("#railProgress");
  const updateProgress = () => {
    if (!processSection || !progressEl) return;
    const r = processSection.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    const start = vh * 0.15;
    const end = vh * 0.85;

    // When section enters, progress increases as user scrolls through it.
    const total = (r.height + (end - start));
    const seen = (end - r.top);
    const p = Math.max(0, Math.min(1, seen / total));
    progressEl.style.height = `${p * 100}%`;
  };

  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
  updateProgress();

  // 7) FAQ accordion
  const accordion = document.querySelector("[data-accordion]");
  if (accordion) {
    $$(".faq-item", accordion).forEach(item => {
      const q = $(".faq-q", item);
      const a = $(".faq-a", item);
      if (!q || !a) return;

      q.addEventListener("click", () => {
        const open = q.getAttribute("aria-expanded") === "true";
        q.setAttribute("aria-expanded", String(!open));
        a.hidden = open;

        const icon = $(".faq-icon", q);
        if (icon) icon.textContent = open ? "+" : "–";
      });
    });
  }
})();
