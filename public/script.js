(() => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Mobile menu ----------
  const hamburger = document.getElementById("hamburger");
  const mobileMenu = document.getElementById("mobileMenu");

  function closeMenu() {
    if (!mobileMenu) return;
    mobileMenu.hidden = true;
    hamburger?.setAttribute("aria-expanded", "false");
  }

  function toggleMenu() {
    if (!mobileMenu || !hamburger) return;
    const isOpen = !mobileMenu.hidden;
    mobileMenu.hidden = isOpen;
    hamburger.setAttribute("aria-expanded", String(!isOpen));
  }

  hamburger?.addEventListener("click", () => toggleMenu());

  // Close menu when clicking any link
  mobileMenu?.addEventListener("click", (e) => {
    const t = e.target;
    if (t && t.closest && t.closest("a")) closeMenu();
  });

  // Close menu on scroll (important for clean UX)
  window.addEventListener("scroll", () => closeMenu(), { passive: true });

  // ---------- Header CTA visibility (no double CTA in same frame) ----------
  const headerCta = document.getElementById("headerCta");
  const heroCta = document.getElementById("heroCta");
  const ctaButton = document.getElementById("ctaButton");
  const ctaSection = document.getElementById("cta");

  let heroCtaVisible = true;
  let ctaVisible = false;

  function updateHeaderCta() {
    if (!headerCta) return;
    const shouldShow = !heroCtaVisible && !ctaVisible;
    headerCta.classList.toggle("is-visible", shouldShow);
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.target === heroCta) heroCtaVisible = entry.isIntersecting;
        if (entry.target === ctaSection) ctaVisible = entry.isIntersecting;
      }
      updateHeaderCta();
    },
    {
      threshold: [0.05, 0.2],
      // Keep header CTA visible until CTA section is truly in view (not too early)
      rootMargin: "0px 0px -25% 0px",
    }
  );

  if (heroCta) io.observe(heroCta);
  if (ctaSection) io.observe(ctaSection);

  // ---------- Magic wand glow for all cards ----------
  const glowEls = Array.from(document.querySelectorAll("[data-glow]"));
  if (glowEls.length) {
    let raf = null;

    function setGlow(el, clientX, clientY) {
      const rect = el.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;
      el.style.setProperty("--gx", `${x}%`);
      el.style.setProperty("--gy", `${y}%`);
    }

    for (const el of glowEls) {
      el.addEventListener(
        "pointermove",
        (e) => {
          if (prefersReducedMotion) return;
          if (raf) cancelAnimationFrame(raf);
          raf = requestAnimationFrame(() => setGlow(el, e.clientX, e.clientY));
        },
        { passive: true }
      );
    }
  }

  // ---------- How we work (no scroll automation, only hover/tap) ----------
  const stepsRoot = document.getElementById("workSteps");
  const railTrack = document.getElementById("railTrack");
  const railProgress = document.getElementById("railProgress");
  const steps = stepsRoot ? Array.from(stepsRoot.querySelectorAll(".step")) : [];

  if (steps.length && railTrack && railProgress) {
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    let pinnedIndex = -1; // click locks
    let activeIndex = -1; // hover or pinned

    function setRailGeometry() {
      // Track should start at dot center of step 1 and end at dot center of step 4 (mid)
      const firstDot = steps[0].querySelector(".step-dot");
      const lastDot = steps[steps.length - 1].querySelector(".step-dot");
      if (!firstDot || !lastDot) return;

      const rootRect = stepsRoot.getBoundingClientRect();
      const firstRect = firstDot.getBoundingClientRect();
      const lastRect = lastDot.getBoundingClientRect();

      const top = (firstRect.top - rootRect.top) + (firstRect.height / 2);
      const end = (lastRect.top - rootRect.top) + (lastRect.height / 2);
      const height = Math.max(0, end - top);

      railTrack.style.top = `${top}px`;
      railTrack.style.height = `${height}px`;

      // If no active step, keep progress at 0
      updateRailProgress();
    }

    function closeAll() {
      steps.forEach((s) => {
        s.classList.remove("is-open", "is-active");
        const btn = s.querySelector(".step-summary");
        const panel = s.querySelector(".step-panel");
        if (btn) btn.setAttribute("aria-expanded", "false");
        if (panel) panel.hidden = true;
      });
      activeIndex = -1;
      updateRailProgress();
    }

    function openStep(index) {
      steps.forEach((s, i) => {
        const isTarget = i === index;
        s.classList.toggle("is-open", isTarget);
        s.classList.toggle("is-active", isTarget);

        const btn = s.querySelector(".step-summary");
        const panel = s.querySelector(".step-panel");
        if (btn) btn.setAttribute("aria-expanded", String(isTarget));
        if (panel) panel.hidden = !isTarget;
      });

      activeIndex = index;
      updateRailProgress();
    }

    function updateRailProgress() {
      const firstDot = steps[0].querySelector(".step-dot");
      const rootRect = stepsRoot.getBoundingClientRect();
      const trackTop = parseFloat(railTrack.style.top || "0");

      if (!firstDot) return;

      if (activeIndex < 0) {
        railProgress.style.top = `${trackTop}px`;
        railProgress.style.height = `0px`;
        return;
      }

      const activeDot = steps[activeIndex].querySelector(".step-dot");
      if (!activeDot) return;

      const aRect = activeDot.getBoundingClientRect();
      const aCenter = (aRect.top - rootRect.top) + (aRect.height / 2);

      const height = Math.max(0, aCenter - trackTop);
      railProgress.style.top = `${trackTop}px`;
      railProgress.style.height = `${height}px`;
    }

    // Click toggles pinned
    steps.forEach((step, idx) => {
      const btn = step.querySelector(".step-summary");
      if (!btn) return;

      btn.addEventListener("click", () => {
        if (pinnedIndex === idx) {
          pinnedIndex = -1;
          closeAll();
          return;
        }
        pinnedIndex = idx;
        openStep(idx);
      });

      // Desktop hover previews, but does not pin unless clicked
      if (canHover) {
        step.addEventListener("mouseenter", () => {
          openStep(idx);
        });

        step.addEventListener("mouseleave", () => {
          if (pinnedIndex >= 0) {
            openStep(pinnedIndex);
          } else {
            closeAll();
          }
        });
      }
    });

    // Start: everything closed, but titles and subtitles visible (default)
    closeAll();

    // Layout rail correctly (and on resize)
    window.addEventListener("resize", () => setRailGeometry());
    setRailGeometry();
  }
})();
