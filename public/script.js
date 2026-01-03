(() => {
  const BOOK_URL = "https://calendly.com/mihirmakwana5720/20min";

  // If a service worker was previously added, it can cause caching + stale files.
  // This safely unregisters any existing SW so your updates always show.
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    }).catch(() => {});
    if ("caches" in window) {
      caches.keys().then(keys => keys.forEach(k => caches.delete(k))).catch(() => {});
    }
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Mobile menu
  const navToggle = document.getElementById("navToggle");
  const navMenu = document.getElementById("navMenu");
  const header = document.getElementById("siteHeader");

  const closeMenu = () => {
    if (!navMenu) return;
    navMenu.classList.remove("is-open");
    navToggle?.setAttribute("aria-expanded", "false");
  };

  navToggle?.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  // Close on link click
  navMenu?.addEventListener("click", (e) => {
    const t = e.target;
    if (t && t.classList && t.classList.contains("nav-link")) closeMenu();
  });

  // Close on outside click
  document.addEventListener("click", (e) => {
    const t = e.target;
    if (!navMenu || !navToggle) return;
    const clickedToggle = navToggle.contains(t);
    const clickedMenu = navMenu.contains(t);
    if (!clickedToggle && !clickedMenu) closeMenu();
  });

  // Close on scroll (requested)
  let lastScrollY = window.scrollY;
  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    if (Math.abs(y - lastScrollY) > 8) closeMenu();
    lastScrollY = y;
  }, { passive: true });

  // Header CTA logic:
  // Show header CTA only when hero CTA is NOT visible, and hide header when final CTA section is visible.
  const heroCta = document.getElementById("heroCtaWrap");
  const finalCta = document.getElementById("cta");
  const headerCta = document.getElementById("headerCta");

  if (headerCta) headerCta.href = BOOK_URL;

  let heroVisible = true;
  let finalVisible = false;

  const updateHeaderState = () => {
    if (!header) return;

    // hide the entire header only when final CTA is visible
    header.classList.toggle("is-hidden", finalVisible);

    // show CTA only when hero CTA out of view AND final CTA not visible
    const showCta = !heroVisible && !finalVisible;
    header.classList.toggle("show-cta", showCta);
  };

  if ("IntersectionObserver" in window) {
    const ioHero = new IntersectionObserver(
      (entries) => {
        heroVisible = !!entries[0]?.isIntersecting;
        updateHeaderState();
      },
      { threshold: 0.2 }
    );

    const ioFinal = new IntersectionObserver(
      (entries) => {
        finalVisible = !!entries[0]?.isIntersecting;
        updateHeaderState();
      },
      { threshold: 0.25 }
    );

    if (heroCta) ioHero.observe(heroCta);
    if (finalCta) ioFinal.observe(finalCta);
  }

  // Magic wand effect: update CSS vars for all elements with class "magic"
  const magicEls = Array.from(document.querySelectorAll(".magic"));
  magicEls.forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      el.style.setProperty("--mx", `${x}%`);
      el.style.setProperty("--my", `${y}%`);
    }, { passive: true });
  });

  // How we work: static rail + circles, smooth blue travel, details swap
  const stepsWrap = document.getElementById("steps");
  const railFill = document.getElementById("railFill");
  const detailCard = document.getElementById("detailCard");
  const detailKicker = document.getElementById("detailKicker");
  const detailTitle = document.getElementById("detailTitle");
  const detailBullets = document.getElementById("detailBullets");

  const dots = Array.from(document.querySelectorAll(".rail-dot"));
  const stepBtns = Array.from(document.querySelectorAll(".step-card"));

  const DETAILS = [
    {
      kicker: "Step 1",
      title: "Diagnose",
      bullets: [
        'Clarify priorities and what “done” looks like',
        "Map the workflow, tools, and handoffs",
        "Agree weekly cadence and reporting format",
      ],
    },
    {
      kicker: "Step 2",
      title: "Build",
      bullets: [
        "Set up tooling and clean structure",
        "Create templates, checklists, trackers",
        "Install QA so execution stays consistent",
      ],
    },
    {
      kicker: "Step 3",
      title: "Run",
      bullets: [
        "Operate weekly with clear owners",
        "Ship work with reporting that stays clean",
        "Iterate based on what’s working",
      ],
    },
    {
      kicker: "Step 4",
      title: "Handoff",
      bullets: [
        "Document what matters as you go",
        "Transfer ownership with SOPs and checklists",
        "Make it runnable without founder push",
      ],
    },
  ];

  let activeIdx = 0;
  let dotPositions = [];

  const computeDotPositions = () => {
    dotPositions = [];
    const rail = document.querySelector(".rail");
    if (!rail || stepBtns.length === 0 || dots.length === 0) return;

    const railRect = rail.getBoundingClientRect();
    const topPad = 10;
    const bottomPad = 10;

    // Place dots aligned to the CENTER of each step button (static because buttons do not expand)
    stepBtns.forEach((btn, i) => {
      const br = btn.getBoundingClientRect();
      const centerY = (br.top + br.height / 2) - railRect.top;

      dotPositions[i] = Math.max(topPad, Math.min(centerY, railRect.height - bottomPad));
      dots[i].style.top = `${dotPositions[i] - (dots[i].offsetHeight / 2)}px`;
    });

    // Ensure rail height ends at the last dot
    const last = dotPositions[dotPositions.length - 1] ?? (railRect.height - bottomPad);
    rail.style.minHeight = `${Math.max(360, last + 40)}px`;

    // Re-apply active state
    applyRail(activeIdx, true);
  };

  const applyRail = (idx, instant = false) => {
    dots.forEach((d, i) => d.classList.toggle("is-active", i === idx));
    if (!railFill || dotPositions.length === 0) return;

    const heightPx = dotPositions[idx] ? Math.max(0, dotPositions[idx]) : 0;
    if (instant || prefersReducedMotion) {
      railFill.style.transition = "none";
      railFill.style.height = `${heightPx}px`;
      // force reflow then restore transition
      requestAnimationFrame(() => {
        railFill.style.transition = prefersReducedMotion ? "none" : "height 260ms ease";
      });
    } else {
      railFill.style.height = `${heightPx}px`;
    }
  };

  const setActiveStep = (idx) => {
    if (idx === activeIdx) return;
    activeIdx = idx;

    stepBtns.forEach((b, i) => b.classList.toggle("is-active", i === idx));
    applyRail(idx);

    if (!detailCard || !detailKicker || !detailTitle || !detailBullets) return;

    // Smooth swap
    detailCard.classList.add("is-swapping");
    const doSwap = () => {
      const d = DETAILS[idx];
      detailKicker.textContent = d.kicker;
      detailTitle.textContent = d.title;

      detailBullets.innerHTML = "";
      d.bullets.forEach((t) => {
        const li = document.createElement("li");
        li.textContent = t;
        detailBullets.appendChild(li);
      });

      requestAnimationFrame(() => {
        detailCard.classList.remove("is-swapping");
      });
    };

    if (prefersReducedMotion) {
      doSwap();
    } else {
      setTimeout(doSwap, 120);
    }
  };

  // Hover + click (desktop + mobile)
  stepBtns.forEach((btn) => {
    const idx = Number(btn.getAttribute("data-step") || "0");

    btn.addEventListener("mouseenter", () => setActiveStep(idx));
    btn.addEventListener("focus", () => setActiveStep(idx));
    btn.addEventListener("click", () => setActiveStep(idx));
  });

  // On resize, recompute dot positions
  window.addEventListener("resize", () => {
    window.requestAnimationFrame(computeDotPositions);
  });

  // Initial setup
  window.addEventListener("load", () => {
    computeDotPositions();
    // ensure initial
    stepBtns.forEach((b, i) => b.classList.toggle("is-active", i === 0));
    applyRail(0, true);
  });
})();
