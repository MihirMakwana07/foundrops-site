(function () {
  const body = document.body;

  // Mobile menu
  const menuBtn = document.getElementById("menuBtn");
  const mobileMenu = document.getElementById("mobileMenu");

  function closeMenu() {
    if (!mobileMenu) return;
    mobileMenu.hidden = true;
    menuBtn?.setAttribute("aria-expanded", "false");
    body.classList.remove("menu-open");
  }

  function openMenu() {
    if (!mobileMenu) return;
    mobileMenu.hidden = false;
    menuBtn?.setAttribute("aria-expanded", "true");
    body.classList.add("menu-open");
  }

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener("click", () => {
      const expanded = menuBtn.getAttribute("aria-expanded") === "true";
      expanded ? closeMenu() : openMenu();
    });

    mobileMenu.addEventListener("click", (e) => {
      const t = e.target;
      if (t && t.classList && t.classList.contains("mobile-link")) closeMenu();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });
  }

  // Header CTA MECE logic
  const heroBook = document.getElementById("heroBook");
  const ctaSection = document.getElementById("cta");

  let heroVisible = true;
  let ctaVisible = false;

  function updateHeaderCta() {
    if (!heroVisible && !ctaVisible) body.classList.add("show-header-cta");
    else body.classList.remove("show-header-cta");
  }

  function observeVisibility(target, onChange, opts) {
    if (!target || !("IntersectionObserver" in window)) return null;
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      onChange(entry.isIntersecting);
    }, opts);
    io.observe(target);
    return io;
  }

  observeVisibility(
    heroBook,
    (isVisible) => {
      heroVisible = isVisible;
      updateHeaderCta();
    },
    { threshold: 0.6 }
  );

  observeVisibility(
    ctaSection,
    (isVisible) => {
      ctaVisible = isVisible;
      updateHeaderCta();
    },
    { threshold: 0.25 }
  );

  // ---------- How we work: rail + dots + auto expand ----------
  const stepsRail = document.getElementById("stepsRail");
  const railProgress = document.getElementById("railProgress");
  const stepsWrap = document.getElementById("steps");
  const steps = Array.from(document.querySelectorAll(".step"));
  const topSentinel = document.getElementById("howTopSentinel");
  const bottomSentinel = document.getElementById("howBottomSentinel");

  let activeIndex = -1;

  function expandPanel(panel) {
    if (!panel || !panel.hidden) return;

    panel.hidden = false;
    panel.style.overflow = "hidden";
    panel.style.height = "0px";
    panel.style.opacity = "0";

    requestAnimationFrame(() => {
      const h = panel.scrollHeight;
      panel.style.transition = "height 240ms ease, opacity 240ms ease";
      panel.style.height = h + "px";
      panel.style.opacity = "1";
      panel.addEventListener("transitionend", () => {
        panel.style.transition = "";
        panel.style.height = "auto";
        panel.style.overflow = "";
      }, { once: true });
    });
  }

  function collapsePanel(panel) {
    if (!panel || panel.hidden) return;

    panel.style.overflow = "hidden";
    panel.style.height = panel.scrollHeight + "px";
    panel.style.opacity = "1";

    requestAnimationFrame(() => {
      panel.style.transition = "height 220ms ease, opacity 220ms ease";
      panel.style.height = "0px";
      panel.style.opacity = "0";
      panel.addEventListener("transitionend", () => {
        panel.hidden = true;
        panel.style.transition = "";
        panel.style.height = "";
        panel.style.opacity = "";
        panel.style.overflow = "";
      }, { once: true });
    });
  }

  function setOpen(i, open) {
    const step = steps[i];
    if (!step) return;
    const btn = step.querySelector(".step-summary");
    const panelId = btn?.getAttribute("aria-controls");
    const panel = panelId ? document.getElementById(panelId) : null;

    if (open) {
      step.classList.add("is-open");
      btn?.setAttribute("aria-expanded", "true");
      expandPanel(panel);
    } else {
      step.classList.remove("is-open");
      btn?.setAttribute("aria-expanded", "false");
      collapsePanel(panel);
    }
  }

  function setActive(idx, mode) {
    // mode: "top" | "mid" | "bottom"
    activeIndex = idx;

    steps.forEach((s, i) => {
      s.classList.remove("is-active", "is-done");
      if (idx >= 0 && i < idx) s.classList.add("is-done");
    });

    if (idx >= 0) {
      steps[idx].classList.add("is-active");
      steps.forEach((_, i) => setOpen(i, i === idx));
    } else {
      // close all if none active
      steps.forEach((_, i) => setOpen(i, false));
      // if user scrolled past the end, keep the rail filled but no open panels
      if (mode === "bottom") {
        steps.forEach((s) => s.classList.add("is-done"));
      }
    }

    // rail update after layout settles
    requestAnimationFrame(() => {
      layoutRail();
      updateRailProgress();
    });
  }

  function layoutRail() {
    if (!stepsRail || !stepsWrap || steps.length === 0) return;

    const first = steps[0];
    const last = steps[steps.length - 1];

    // Align rail to start near Step 1 and end at middle of Step 4 (as requested)
    const startY = first.offsetTop + 24; // matches dot/top
    const endY = last.offsetTop + (last.offsetHeight / 2);

    stepsRail.style.top = startY + "px";
    stepsRail.style.height = Math.max(0, endY - startY) + "px";
  }

  function updateRailProgress() {
    if (!railProgress || !stepsRail || steps.length === 0) return;

    const railTop = parseFloat(stepsRail.style.top || "0");
    const railH = parseFloat(stepsRail.style.height || "0");
    if (railH <= 0) return;

    if (activeIndex < 0) {
      // top = empty, bottom = full (handled by mode)
      // If bottom sentinel is active, we leave is-done on all and show full.
      const allDone = steps.every((s) => s.classList.contains("is-done"));
      railProgress.style.height = allDone ? "100%" : "0%";
      return;
    }

    const active = steps[activeIndex];
    const centerY = active.offsetTop + (active.offsetHeight / 2);
    const p = (centerY - railTop) / railH;
    const clamped = Math.max(0, Math.min(1, p));
    railProgress.style.height = (clamped * 100) + "%";
  }

  // click behavior: open the clicked step, close others
  steps.forEach((step, i) => {
    const btn = step.querySelector(".step-summary");
    btn?.addEventListener("click", () => {
      setActive(i, "mid");
    });
  });

  // scroll behavior: auto activate step near viewport center
  function initStepObserver() {
    if (!("IntersectionObserver" in window) || steps.length === 0) {
      layoutRail();
      setActive(0, "mid");
      return;
    }

    const stepObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;

      const idx = steps.indexOf(visible.target);
      if (idx >= 0 && idx !== activeIndex) setActive(idx, "mid");
    }, {
      threshold: [0.25, 0.4, 0.6],
      rootMargin: "-40% 0px -45% 0px"
    });

    steps.forEach((s) => stepObserver.observe(s));
  }

  // close all when above first / below last (the "shut back" behavior)
  function initSentinels() {
    if (!("IntersectionObserver" in window)) return;

    const topIO = new IntersectionObserver((entries) => {
      const e = entries[0];
      if (e.isIntersecting) setActive(-1, "top");
    }, { threshold: 0.01, rootMargin: "-45% 0px -45% 0px" });

    const bottomIO = new IntersectionObserver((entries) => {
      const e = entries[0];
      if (e.isIntersecting) setActive(-1, "bottom");
    }, { threshold: 0.01, rootMargin: "-45% 0px -45% 0px" });

    if (topSentinel) topIO.observe(topSentinel);
    if (bottomSentinel) bottomIO.observe(bottomSentinel);
  }

  window.addEventListener("load", () => {
    layoutRail();
    initStepObserver();
    initSentinels();
    updateHeaderCta();

    // fonts can shift layout
    setTimeout(() => {
      layoutRail();
      updateRailProgress();
      updateHeaderCta();
    }, 250);
  });

  window.addEventListener("resize", () => {
    layoutRail();
    updateRailProgress();
    updateHeaderCta();
  });
})();
