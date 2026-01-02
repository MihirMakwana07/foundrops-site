(function () {
  const body = document.body;

  // ---------------- Mobile menu ----------------
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

  function isMenuOpen() {
    return mobileMenu && !mobileMenu.hidden;
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

    // Close menu on scroll (mobile + desktop)
    let lastScrollY = window.scrollY;
    window.addEventListener("scroll", () => {
      const y = window.scrollY;
      if (isMenuOpen() && Math.abs(y - lastScrollY) > 4) closeMenu();
      lastScrollY = y;
    }, { passive: true });
  }

  // ---------------- Header CTA MECE logic ----------------
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

  // ---------------- How we work: rail + dots + smooth open ----------------
  const stepsRail = document.getElementById("stepsRail");
  const railProgress = document.getElementById("railProgress");
  const steps = Array.from(document.querySelectorAll(".step"));
  const topSentinel = document.getElementById("howTopSentinel");
  const bottomSentinel = document.getElementById("howBottomSentinel");

  let activeIndex = -1;
  let lastScrollIndex = 0;
  let hoverOverride = false;

  function setOpen(stepEl, open) {
    const btn = stepEl.querySelector(".step-summary");
    const panelId = btn?.getAttribute("aria-controls");
    const panel = panelId ? document.getElementById(panelId) : null;

    stepEl.classList.toggle("is-open", open);
    btn?.setAttribute("aria-expanded", open ? "true" : "false");
    panel?.setAttribute("aria-hidden", open ? "false" : "true");
  }

  function setActive(idx, source) {
    // source: "scroll" | "hover" | "click" | "top" | "bottom"
    activeIndex = idx;

    steps.forEach((s, i) => {
      s.classList.remove("is-active", "is-done");
      if (idx >= 0 && i < idx) s.classList.add("is-done");
      if (idx < 0) s.classList.remove("is-done");
    });

    if (idx >= 0) {
      steps[idx].classList.add("is-active");
      steps.forEach((s, i) => setOpen(s, i === idx));
    } else {
      steps.forEach((s) => setOpen(s, false));
      if (source === "bottom") steps.forEach((s) => s.classList.add("is-done"));
    }

    requestAnimationFrame(() => {
      layoutRail();
      updateRailProgress(source);
    });
  }

  function layoutRail() {
    if (!stepsRail || steps.length === 0) return;
    const first = steps[0];
    const last = steps[steps.length - 1];

    // start near Step 1 dot, end at middle of Step 4
    const startY = first.offsetTop + 24;
    const endY = last.offsetTop + (last.offsetHeight / 2);

    stepsRail.style.top = startY + "px";
    stepsRail.style.height = Math.max(0, endY - startY) + "px";
  }

  function updateRailProgress(source) {
    if (!railProgress || !stepsRail || steps.length === 0) return;

    const railTop = parseFloat(stepsRail.style.top || "0");
    const railH = parseFloat(stepsRail.style.height || "0");
    if (railH <= 0) return;

    if (activeIndex < 0) {
      railProgress.style.height = (source === "bottom") ? "100%" : "0%";
      return;
    }

    const active = steps[activeIndex];
    const centerY = active.offsetTop + (active.offsetHeight / 2);
    const p = (centerY - railTop) / railH;
    const clamped = Math.max(0, Math.min(1, p));
    railProgress.style.height = (clamped * 100) + "%";
  }

  // Click toggles: click a step to activate; click again collapses all
  steps.forEach((step, i) => {
    const btn = step.querySelector(".step-summary");
    btn?.addEventListener("click", () => {
      hoverOverride = false;
      if (activeIndex === i) {
        setActive(-1, "click");
      } else {
        setActive(i, "click");
        lastScrollIndex = i;
      }
    });
  });

  // Scroll activation via IntersectionObserver
  function initStepObserver() {
    if (!("IntersectionObserver" in window) || steps.length === 0) {
      layoutRail();
      setActive(0, "scroll");
      return;
    }

    const stepObserver = new IntersectionObserver((entries) => {
      if (hoverOverride) return;

      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;

      const idx = steps.indexOf(visible.target);
      if (idx >= 0) {
        lastScrollIndex = idx;
        if (idx !== activeIndex) setActive(idx, "scroll");
      }
    }, {
      threshold: [0.25, 0.45, 0.65],
      rootMargin: "-40% 0px -45% 0px"
    });

    steps.forEach((s) => stepObserver.observe(s));
  }

  // Sentinels: close all above first / below last
  function initSentinels() {
    if (!("IntersectionObserver" in window)) return;

    const topIO = new IntersectionObserver((entries) => {
      const e = entries[0];
      if (e.isIntersecting && !hoverOverride) setActive(-1, "top");
    }, { threshold: 0.01, rootMargin: "-45% 0px -45% 0px" });

    const bottomIO = new IntersectionObserver((entries) => {
      const e = entries[0];
      if (e.isIntersecting && !hoverOverride) setActive(-1, "bottom");
    }, { threshold: 0.01, rootMargin: "-45% 0px -45% 0px" });

    if (topSentinel) topIO.observe(topSentinel);
    if (bottomSentinel) bottomIO.observe(bottomSentinel);
  }

  // Hover behavior (desktop only): hover activates that step
  const canHover = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (canHover) {
    steps.forEach((step, i) => {
      step.addEventListener("mouseenter", () => {
        hoverOverride = true;
        setActive(i, "hover");
      });
      step.addEventListener("mouseleave", () => {
        // Return to scroll-determined step smoothly
        hoverOverride = false;
        setTimeout(() => {
          if (!hoverOverride) setActive(lastScrollIndex, "scroll");
        }, 60);
      });
    });

    // Magic-wand glow follow cursor (CSS variables)
    let raf = 0;
    let lastEl = null;

    function setGlowVars(el, clientX, clientY) {
      const r = el.getBoundingClientRect();
      const x = ((clientX - r.left) / r.width) * 100;
      const y = ((clientY - r.top) / r.height) * 100;
      el.style.setProperty("--mx", x.toFixed(2) + "%");
      el.style.setProperty("--my", y.toFixed(2) + "%");
    }

    document.querySelectorAll(".step-summary").forEach((btn) => {
      btn.addEventListener("mousemove", (e) => {
        lastEl = btn;
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          if (lastEl) setGlowVars(lastEl, e.clientX, e.clientY);
        });
      });

      btn.addEventListener("mouseleave", () => {
        btn.style.setProperty("--mx", "50%");
        btn.style.setProperty("--my", "40%");
      });
    });
  }

  window.addEventListener("load", () => {
    layoutRail();
    initStepObserver();
    initSentinels();
    updateHeaderCta();

    setTimeout(() => {
      layoutRail();
      updateRailProgress("scroll");
      updateHeaderCta();
    }, 250);
  });

  window.addEventListener("resize", () => {
    layoutRail();
    updateRailProgress("scroll");
    updateHeaderCta();
  });
})();
