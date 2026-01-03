(() => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- Mobile menu ----
  const navToggle = document.getElementById("navToggle");
  const mobileMenu = document.getElementById("mobileMenu");

  function closeMobileMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove("is-open");
    mobileMenu.setAttribute("aria-hidden", "true");
    navToggle?.setAttribute("aria-expanded", "false");
    navToggle?.setAttribute("aria-label", "Open menu");
  }

  function openMobileMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.add("is-open");
    mobileMenu.setAttribute("aria-hidden", "false");
    navToggle?.setAttribute("aria-expanded", "true");
    navToggle?.setAttribute("aria-label", "Close menu");
  }

  navToggle?.addEventListener("click", () => {
    const isOpen = mobileMenu.classList.contains("is-open");
    if (isOpen) closeMobileMenu();
    else openMobileMenu();
  });

  // Close menu when clicking any link
  mobileMenu?.addEventListener("click", (e) => {
    const target = e.target;
    if (target && target.classList && target.classList.contains("mobile-link")) {
      closeMobileMenu();
    }
  });

  // Close menu on scroll (mobile UX)
  let scrollCloseTick = 0;
  window.addEventListener("scroll", () => {
    if (!mobileMenu?.classList.contains("is-open")) return;
    if (scrollCloseTick) return;
    scrollCloseTick = requestAnimationFrame(() => {
      closeMobileMenu();
      scrollCloseTick = 0;
    });
  }, { passive: true });

  // ---- Header CTA visibility (MECE: never show 2 CTAs in same frame) ----
  const headerCta = document.getElementById("headerCta");
  const heroCta = document.querySelector('[data-observe="hero-cta"]');
  const bottomCta = document.querySelector('[data-observe="bottom-cta"]');

  let heroVisible = true;
  let bottomVisible = false;

  function syncHeaderCta() {
    if (!headerCta) return;
    // Show header CTA only if hero CTA is not visible AND bottom CTA is not visible
    const shouldShow = !heroVisible && !bottomVisible;
    headerCta.classList.toggle("is-visible", shouldShow);
  }

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target === heroCta) heroVisible = entry.isIntersecting;
          if (entry.target === bottomCta) bottomVisible = entry.isIntersecting;
        }
        syncHeaderCta();
      },
      {
        root: null,
        threshold: 0.12,
      }
    );

    if (heroCta) io.observe(heroCta);
    if (bottomCta) io.observe(bottomCta);
  } else {
    // Fallback: show header CTA after a small scroll
    window.addEventListener("scroll", () => {
      heroVisible = window.scrollY < 250;
      bottomVisible = false;
      syncHeaderCta();
    }, { passive: true });
  }

  // ---- Magic wand shimmer (all .magic elements) ----
  // Uses rAF to avoid spamming style recalcs.
  const magicEls = Array.from(document.querySelectorAll(".magic"));
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  if (finePointer && magicEls.length) {
    magicEls.forEach((el) => {
      let raf = 0;
      el.addEventListener("pointermove", (e) => {
        if (prefersReducedMotion) return;
        if (raf) return;
        raf = requestAnimationFrame(() => {
          const rect = el.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          el.style.setProperty("--mx", `${x}%`);
          el.style.setProperty("--my", `${y}%`);
          raf = 0;
        });
      });
    });
  }

  // ---- How we work: static rail + smooth fill + detail drawer ----
  const workStepsWrap = document.getElementById("workSteps");
  const workSteps = workStepsWrap ? Array.from(workStepsWrap.querySelectorAll(".work-step")) : [];
  const railDotsWrap = document.getElementById("railDots");
  const railDots = railDotsWrap ? Array.from(railDotsWrap.querySelectorAll(".rail-dot")) : [];
  const railFill = document.getElementById("railFill");
  const workDetail = document.getElementById("workDetail");
  const workDetailList = document.getElementById("workDetailList");

  const details = [
    [
      "Clarify priorities and what “done” looks like",
      "Map the workflow, tools, and handoffs",
      "Agree weekly cadence and reporting format",
    ],
    [
      "Set up tooling and clean structure",
      "Create templates, checklists, trackers",
      "Install QA so execution stays consistent",
    ],
    [
      "Run execution with a weekly operating rhythm",
      "Track pipeline, deliverables, and follow-ups",
      "Tight iteration based on what’s working",
    ],
    [
      "Document SOPs and ownership transfer",
      "Make handoff clean so it runs without us",
      "Leave a system, not a dependency",
    ],
  ];

  let active = -1;
  let locked = -1;

  function setIcons() {
    workSteps.forEach((btn, idx) => {
      const icon = btn.querySelector(".work-icon");
      if (!icon) return;
      icon.textContent = idx === active ? "−" : "+";
    });
  }

  function renderDetail(idx) {
    if (!workDetail || !workDetailList) return;

    if (idx < 0) {
      workDetail.hidden = true;
      workDetail.classList.remove("is-open");
      workDetailList.innerHTML = "";
      return;
    }

    workDetailList.innerHTML = details[idx].map((t) => `<li>${t}</li>`).join("");
    workDetail.hidden = false;

    if (!prefersReducedMotion) {
      workDetail.classList.remove("is-open");
      // restart animation cleanly
      void workDetail.offsetWidth;
      workDetail.classList.add("is-open");
    }
  }

  // Static rail geometry: compute once (no jumping when steps open/close)
  function positionRail() {
    if (!railDots.length || !workSteps.length) return;

    const rail = railDotsWrap.closest(".work-rail");
    if (!rail) return;

    const railRect = rail.getBoundingClientRect();
    const firstRect = workSteps[0].getBoundingClientRect();
    const lastRect = workSteps[workSteps.length - 1].getBoundingClientRect();

    const top = (firstRect.top + firstRect.height / 2) - railRect.top;
    const bottom = (lastRect.top + lastRect.height / 2) - railRect.top;
    const height = Math.max(60, bottom - top);

    rail.style.setProperty("--rail-top", `${top}px`);
    rail.style.setProperty("--rail-height", `${height}px`);

    // Dot positions: align to step centers (static)
    railDots.forEach((dot, idx) => {
      const stepRect = workSteps[idx].getBoundingClientRect();
      const center = (stepRect.top + stepRect.height / 2) - railRect.top;
      dot.style.top = `${center - top}px`; // relative to rail-dots container
    });

    // Ensure fill updates with correct geometry
    updateRailFill(active);
  }

  function updateRailFill(idx) {
    if (!railFill || !railDotsWrap || !railDots.length) return;

    if (idx < 0) {
      railFill.style.transform = "translateX(-50%) scaleY(0)";
      return;
    }

    // Fill length = from first dot to active dot (in dot-container coords)
    const activeDot = railDots[idx];
    const y = parseFloat(activeDot.style.top || "0"); // relative to dot box
    const railHeight = parseFloat(getComputedStyle(railDotsWrap.closest(".work-rail")).getPropertyValue("--rail-height")) || 1;

    // y is relative to dots container; dots container height == railHeight
    const ratio = Math.max(0, Math.min(1, y / railHeight));
    railFill.style.transform = `translateX(-50%) scaleY(${ratio})`;
  }

  function setDotsState(idx) {
    railDots.forEach((dot, i) => {
      dot.classList.toggle("is-active", i === idx);
      dot.classList.toggle("is-done", idx >= 0 && i < idx);
    });
  }

  function setActive(idx, { lock = false } = {}) {
    active = idx;
    if (lock) locked = idx;

    workSteps.forEach((btn, i) => btn.classList.toggle("is-active", i === idx));
    setIcons();
    renderDetail(idx);
    setDotsState(idx);
    updateRailFill(idx);
  }

  function clearActive() {
    active = -1;
    locked = -1;
    setActive(-1);
  }

  function bindWorkSteps() {
    if (!workSteps.length) return;

    // Click/tap locks the step
    workSteps.forEach((btn, idx) => {
      btn.addEventListener("click", () => {
        if (active === idx && locked === idx) {
          clearActive();
          return;
        }
        setActive(idx, { lock: true });
      });

      // Hover previews (desktop)
      btn.addEventListener("mouseenter", () => {
        if (!finePointer) return;
        setActive(idx, { lock: false });
      });
      btn.addEventListener("mouseleave", () => {
        if (!finePointer) return;
        if (locked >= 0) setActive(locked, { lock: false });
        else setActive(-1, { lock: false });
      });
    });

    // Click outside closes if not locked
    document.addEventListener("click", (e) => {
      const within = workStepsWrap?.contains(e.target);
      if (within) return;
      if (locked >= 0) return;
      setActive(-1, { lock: false });
    });
  }

  bindWorkSteps();

  // After fonts/layout settle, compute rail once.
  const onReady = () => {
    requestAnimationFrame(() => {
      positionRail();
      // Default closed (clean)
      setActive(-1, { lock: false });
    });
  };

  window.addEventListener("load", () => {
    onReady();
    // Re-run once after load to account for font swap/layout changes
    setTimeout(positionRail, 350);
  });

  window.addEventListener("resize", () => {
    // Rail is intended to be static per layout, but it must re-align on resize/orientation change.
    positionRail();
  });
})();
