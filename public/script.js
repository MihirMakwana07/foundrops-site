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

  // Collapse menu on scroll (prevents it staying open)
  let lastScrollY = window.scrollY;
  window.addEventListener("scroll", () => {
    const isOpen = navToggle?.getAttribute("aria-expanded") === "true";
    const dy = Math.abs(window.scrollY - lastScrollY);
    lastScrollY = window.scrollY;
    if (isOpen && dy > 8) closeMobileNav();
  }, { passive: true });

  // -------------------------
  // Header CTA visibility (no duplicate CTA on same frame)
  // Uses IntersectionObserver 
  // -------------------------
  const headerCta = document.getElementById("headerCta");
  const heroCtaBlock = document.getElementById("heroCtaBlock");
  const ctaBlock = document.getElementById("ctaBlock");

  // Only for desktop/tablet where header CTA exists
  if (headerCta && heroCtaBlock && "IntersectionObserver" in window) {
    let heroVisible = true;
    let bottomCtaVisible = false;

    const syncHeaderCta = () => {
      // show header CTA only when hero CTA is NOT visible and bottom CTA is NOT visible
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
  // “Magic wand” sheen on all cards
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
  // How we work: click/hover accordion only
  // Rail dots are created ON the rail (not on cards)
  // -------------------------
  const stepsWrap = document.getElementById("workSteps");
  const railDots = document.getElementById("railDots");
  const railTrack = document.getElementById("railTrack");
  const railFill = document.getElementById("railFill");

  if (stepsWrap && railDots && railTrack && railFill) {
    const stepCards = Array.from(stepsWrap.querySelectorAll(".step-card"));
    const isFinePointer = matchMedia("(pointer: fine)").matches;

    let lockedIndex = null;   // click sets this
    let hoverIndex = null;    // hover temporarily previews

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

    const placeRail = () => {
      const railBox = railDots.getBoundingClientRect();

      // Position dots centered on each step trigger
      const dotTops = stepCards.map((card, i) => {
        const trigger = card.querySelector(".step-trigger");
        const tBox = trigger.getBoundingClientRect();
        const centerY = (tBox.top + tBox.height / 2) - railBox.top;
        dots[i].style.top = `${centerY}px`;
        return centerY;
      });

      // Track should start at first dot and end at last dot
      const first = dotTops[0] ?? 0;
      const last = dotTops[dotTops.length - 1] ?? first;

      railTrack.style.top = `${first}px`;
      railTrack.style.height = `${Math.max(0, last - first)}px`;

      // Fill depends on active
      const active = getActiveIndex();
      if (active == null) {
        railFill.style.top = `${first}px`;
        railFill.style.height = `0px`;
      } else {
        railFill.style.top = `${first}px`;
        railFill.style.height = `${Math.max(0, dotTops[active] - first)}px`;
      }
    };

    const getActiveIndex = () => (hoverIndex != null ? hoverIndex : lockedIndex);

    const setDotActive = (active) => {
      dots.forEach((d, i) => d.classList.toggle("is-active", active === i));
    };

    const setPanel = (card, open) => {
      const btn = card.querySelector(".step-trigger");
      const icon = card.querySelector(".step-icon");
      const panel = card.querySelector(".step-panel");

      card.dataset.open = open ? "true" : "false";
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      icon.textContent = open ? "−" : "+";

      // Smooth height animation
      if (open) {
        panel.hidden = false;
        panel.classList.add("is-open");
        panel.style.height = "0px";
        const h = panel.scrollHeight;
        requestAnimationFrame(() => {
          panel.style.height = `${h}px`;
        });

        const onEnd = (e) => {
          if (e.propertyName !== "height") return;
          panel.style.height = "auto";
          panel.removeEventListener("transitionend", onEnd);
        };
        panel.addEventListener("transitionend", onEnd);
      } else {
        if (panel.hidden) return;
        panel.style.height = `${panel.scrollHeight}px`;
        requestAnimationFrame(() => {
          panel.style.height = "0px";
        });

        const onEnd = (e) => {
          if (e.propertyName !== "height") return;
          panel.hidden = true;
          panel.classList.remove("is-open");
          panel.removeEventListener("transitionend", onEnd);
        };
        panel.addEventListener("transitionend", onEnd);
      }
    };

    const syncOpenState = () => {
      const active = getActiveIndex();

      stepCards.forEach((card, i) => {
        setPanel(card, active === i);
      });

      setDotActive(active);
      placeRail();
    };

    // Click to lock/unlock
    stepCards.forEach((card, i) => {
      const btn = card.querySelector(".step-trigger");
      btn.addEventListener("click", () => {
        const isOpen = lockedIndex === i;
        lockedIndex = isOpen ? null : i;
        hoverIndex = null;
        syncOpenState();
      });

      // Hover preview (desktop only)
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

    // Close everything when section leaves viewport (keeps page feeling clean)
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

    // Init
    buildDots();
    // Default: nothing open, but titles/subtitles visible
    syncOpenState();

    window.addEventListener("resize", () => {
      // Re-place rail and keep everything aligned
      placeRail();
    });
  }
})();
