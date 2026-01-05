(() => {
  const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // -------------------------
  // Mobile nav
  // -------------------------
  const navToggle = document.getElementById("navToggle");
  const mobileNav = document.getElementById("mobileNav");

  const closeMobileNav = () => {
    if (!mobileNav) return;
    mobileNav.setAttribute("aria-hidden", "true");
    navToggle?.setAttribute("aria-expanded", "false");
    navToggle?.setAttribute("aria-label", "Open menu");
  };

  const openMobileNav = () => {
    if (!mobileNav) return;
    mobileNav.setAttribute("aria-hidden", "false");
    navToggle?.setAttribute("aria-expanded", "true");
    navToggle?.setAttribute("aria-label", "Close menu");
  };

  navToggle?.addEventListener("click", () => {
    const isOpen = navToggle.getAttribute("aria-expanded") === "true";
    if (isOpen) closeMobileNav();
    else openMobileNav();
  });

  mobileNav?.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", () => closeMobileNav());
  });

  let lastScrollY = window.scrollY;
  window.addEventListener("scroll", () => {
    const isOpen = navToggle?.getAttribute("aria-expanded") === "true";
    const dy = Math.abs(window.scrollY - lastScrollY);
    lastScrollY = window.scrollY;
    if (isOpen && dy > 8) closeMobileNav();
  }, { passive: true });

  // -------------------------
  // Header CTA visibility
  // -------------------------
  const headerCta = document.getElementById("headerCta");
  const heroCtaBlock = document.getElementById("heroCtaBlock");
  const ctaBlock = document.getElementById("ctaBlock");

  if (headerCta && heroCtaBlock && "IntersectionObserver" in window) {
    let heroVisible = true;
    let bottomCtaVisible = false;

    const syncHeaderCta = () => {
      const shouldShow = !heroVisible && !bottomCtaVisible;
      headerCta.classList.toggle("is-visible", shouldShow);
    };

    const heroObs = new IntersectionObserver((entries) => {
      heroVisible = entries.some(e => e.isIntersecting);
      syncHeaderCta();
    }, { threshold: 0.20 });

    heroObs.observe(heroCtaBlock);

    if (ctaBlock) {
      const bottomObs = new IntersectionObserver((entries) => {
        bottomCtaVisible = entries.some(e => e.isIntersecting);
        syncHeaderCta();
      }, { threshold: 0.25 });

        bottomObs.observe(ctaBlock);
    }
  }

  // -------------------------
  // “Magic wand” sheen
  // -------------------------
  const sheenEls = Array.from(document.querySelectorAll(".sheen"));
  const onMove = (el, ev) => {
    const r = el.getBoundingClientRect();
    const x = ((ev.clientX - r.left) / r.width) * 100;
    const y = ((ev.clientY - r.top) / r.height) * 100;
    el.style.setProperty("--mx", `${x}%`);
    el.style.setProperty("--my", `${y}%`);
  };

  if (!prefersReduced && matchMedia("(pointer: fine)").matches) {
    sheenEls.forEach(el => {
      el.addEventListener("mousemove", (ev) => onMove(el, ev));
    });
  }

  // -------------------------
  // How we work (optimized)
  // - No JS height animation (removes jank)
  // - Rail fill uses transform scaleY (smoother than height)
  // -------------------------
  const stepsWrap = document.getElementById("workSteps");
  const railDots = document.getElementById("railDots");
  const railTrack = document.getElementById("railTrack");
  const railFill = document.getElementById("railFill");

  if (stepsWrap && railDots && railTrack && railFill) {
    const stepCards = Array.from(stepsWrap.querySelectorAll(".step-card"));
    const isFinePointer = matchMedia("(pointer: fine)").matches;

    let lockedIndex = null;
    let hoverIndex = null;

    const dots = [];

    const buildDots = () => {
      railDots.innerHTML = "";
      dots.length = 0;

      stepCards.forEach((card, i) => {
        const dot = document.createElement("div");
        dot.className = "rail-dot";
        dot.dataset.index = String(i);
        railDots.appendChild(dot);
        dots.push(dot);
      });
    };

    const getActiveIndex = () => (hoverIndex != null ? hoverIndex : lockedIndex);

    const setDotActive = (active) => {
      dots.forEach((d, i) => d.classList.toggle("is-active", active === i));
    };

    const placeRail = () => {
      const railBox = railDots.getBoundingClientRect();

      const dotTops = stepCards.map((card, i) => {
        const trigger = card.querySelector(".step-trigger");
        const tBox = trigger.getBoundingClientRect();
        const centerY = (tBox.top + tBox.height / 2) - railBox.top;
        dots[i].style.top = `${centerY}px`;
        return centerY;
      });

      const first = dotTops[0] ?? 0;
      const last = dotTops[dotTops.length - 1] ?? first;
      const trackH = Math.max(0, last - first);

      railTrack.style.top = `${first}px`;
      railTrack.style.height = `${trackH}px`;

      railFill.style.top = `${first}px`;
      railFill.style.height = `${trackH}px`;

      const active = getActiveIndex();

      if (active == null || trackH === 0) {
        railFill.style.transform = "scaleY(0)";
        return;
      }

      const frac = Math.max(0, Math.min(1, (dotTops[active] - first) / trackH));
      railFill.style.transform = `scaleY(${frac})`;
    };

    const setPanel = (card, open) => {
      const btn = card.querySelector(".step-trigger");
      const icon = card.querySelector(".step-icon");
      const panel = card.querySelector(".step-panel");

      card.dataset.open = open ? "true" : "false";
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      icon.textContent = open ? "−" : "+";

      panel.classList.toggle("is-open", open);
      panel.setAttribute("aria-hidden", open ? "false" : "true");
    };

    const syncOpenState = () => {
      const active = getActiveIndex();

      stepCards.forEach((card, i) => {
        setPanel(card, active === i);
      });

      setDotActive(active);
      placeRail();
    };

    stepCards.forEach((card, i) => {
      const btn = card.querySelector(".step-trigger");

      btn.addEventListener("click", () => {
        const isOpen = lockedIndex === i;
        lockedIndex = isOpen ? null : i;
        hoverIndex = null;
        syncOpenState();
      });

      if (isFinePointer) {
        card.addEventListener("mouseenter", () => {
          hoverIndex = i;
          syncOpenState();
        });
        card.addEventListener("mouseleave", () => {
          hoverIndex = null;
          syncOpenState();
        });
      }
    });

    if ("IntersectionObserver" in window) {
      const howSection = document.getElementById("how");
      if (howSection) {
        const closeObs = new IntersectionObserver((entries) => {
          const inView = entries.some(e => e.isIntersecting);
          if (!inView) {
            lockedIndex = null;
            hoverIndex = null;
            syncOpenState();
          }
        }, { threshold: 0.0 });
        closeObs.observe(howSection);
      }
    }

    buildDots();
    requestAnimationFrame(() => {
      syncOpenState();
    });

    let resizeRaf = null;
    window.addEventListener("resize", () => {
      if (resizeRaf) return;
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = null;
        placeRail();
      });
    });
  }
})();
