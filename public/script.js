(() => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Header CTA visibility: show only when hero CTA is not visible.
  // Header itself: hide only when final CTA is visible.
  const header = document.getElementById("siteHeader");
  const headerCta = document.getElementById("headerCta");
  const heroCta = document.getElementById("heroCta");
  const finalCta = document.getElementById("finalCta");

  const hamburger = document.getElementById("hamburger");
  const drawer = document.getElementById("mobileDrawer");

  function closeDrawer() {
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    hamburger.setAttribute("aria-expanded", "false");
  }

  function openDrawer() {
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    hamburger.setAttribute("aria-expanded", "true");
  }

  if (hamburger) {
    hamburger.addEventListener("click", () => {
      const isOpen = drawer.classList.contains("is-open");
      if (isOpen) closeDrawer();
      else openDrawer();
    });

    // Close drawer on any navigation click
    drawer.addEventListener("click", (e) => {
      const link = e.target.closest("a");
      if (link) closeDrawer();
    });

    // Close drawer on scroll (mobile)
    window.addEventListener("scroll", () => {
      if (drawer.classList.contains("is-open")) closeDrawer();
    }, { passive: true });
  }

  // Observers
  if ("IntersectionObserver" in window && heroCta && headerCta) {
    const heroObs = new IntersectionObserver((entries) => {
      const entry = entries[0];
      // If hero CTA is visible => hide header CTA
      headerCta.style.display = entry.isIntersecting ? "none" : "inline-flex";
    }, { threshold: 0.2 });

    heroObs.observe(heroCta);
  } else if (headerCta) {
    headerCta.style.display = "inline-flex";
  }

  if ("IntersectionObserver" in window && finalCta && header) {
    const finalObs = new IntersectionObserver((entries) => {
      const entry = entries[0];
      // Hide header when final CTA is visible
      header.style.opacity = entry.isIntersecting ? "0" : "1";
      header.style.pointerEvents = entry.isIntersecting ? "none" : "auto";
      header.style.transition = prefersReducedMotion ? "none" : "opacity 220ms ease";
    }, { threshold: 0.35 });

    finalObs.observe(finalCta);
  }

  // Magic wand hover (cards): update CSS vars on pointer move
  const magicEls = Array.from(document.querySelectorAll(".magic"));
  if (magicEls.length) {
    const rafMap = new WeakMap();

    magicEls.forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        if (prefersReducedMotion) return;

        if (rafMap.get(el)) return;

        const raf = requestAnimationFrame(() => {
          const rect = el.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          el.style.setProperty("--mx", `${x}%`);
          el.style.setProperty("--my", `${y}%`);
          rafMap.delete(el);
        });

        rafMap.set(el, raf);
      }, { passive: true });
    });
  }

  // HOW WE WORK accordion + rail metrics
  const howSteps = document.getElementById("howSteps");
  if (!howSteps) return;

  const steps = Array.from(howSteps.querySelectorAll(".step"));
  const railFill = document.getElementById("railFill");

  let openIndex = -1;
  let animating = false;

  function getCenterY(el) {
    const cRect = howSteps.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return (r.top - cRect.top) + (r.height / 2);
  }

  function setRailVars(activeIdx, animateFill = true) {
    if (steps.length < 2) return;

    const first = steps[0];
    const last = steps[steps.length - 1];

    const y1 = getCenterY(first);
    const yN = getCenterY(last);

    const top = Math.min(y1, yN);
    const height = Math.max(0, (yN - y1));

    howSteps.style.setProperty("--rail-top", `${top}px`);
    howSteps.style.setProperty("--rail-height", `${height}px`);

    const fill = (activeIdx >= 0)
      ? Math.max(0, (getCenterY(steps[activeIdx]) - y1))
      : 0;

    if (!animateFill || prefersReducedMotion) {
      howSteps.style.setProperty("--rail-fill", `${fill}px`);
      return;
    }

    // Keep transition smooth; let CSS handle it
    howSteps.style.setProperty("--rail-fill", `${fill}px`);
  }

  function animateBodyOpen(body) {
    body.hidden = false;
    const inner = body.querySelector(".step-body-inner");
    if (!inner) return Promise.resolve();

    const startH = 0;
    const endH = inner.scrollHeight + 18; // small buffer for padding

    if (prefersReducedMotion) {
      body.style.height = "auto";
      body.style.opacity = "1";
      return Promise.resolve();
    }

    body.style.overflow = "hidden";
    body.style.height = `${startH}px`;
    body.style.opacity = "0.01";

    const anim = body.animate(
      [
        { height: `${startH}px`, opacity: 0.01 },
        { height: `${endH}px`, opacity: 1 }
      ],
      { duration: 340, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
    );

    return new Promise((resolve) => {
      anim.onfinish = () => {
        body.style.height = "auto";
        body.style.opacity = "1";
        body.style.overflow = "visible";
        resolve();
      };
    });
  }

  function animateBodyClose(body) {
    const inner = body.querySelector(".step-body-inner");
    if (!inner) {
      body.hidden = true;
      return Promise.resolve();
    }

    if (prefersReducedMotion) {
      body.hidden = true;
      body.style.height = "";
      body.style.opacity = "";
      return Promise.resolve();
    }

    const startH = body.getBoundingClientRect().height;
    const endH = 0;

    body.style.overflow = "hidden";
    body.style.height = `${startH}px`;
    body.style.opacity = "1";

    const anim = body.animate(
      [
        { height: `${startH}px`, opacity: 1 },
        { height: `${endH}px`, opacity: 0.01 }
      ],
      { duration: 280, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
    );

    return new Promise((resolve) => {
      anim.onfinish = () => {
        body.hidden = true;
        body.style.height = "";
        body.style.opacity = "";
        body.style.overflow = "";
        resolve();
      };
    });
  }

  async function closeStep(idx) {
    if (idx < 0 || idx >= steps.length) return;
    const step = steps[idx];
    const head = step.querySelector(".step-head");
    const body = step.querySelector(".step-body");
    step.classList.remove("is-open");
    head.setAttribute("aria-expanded", "false");
    await animateBodyClose(body);
  }

  async function openStep(idx) {
    if (idx < 0 || idx >= steps.length) return;
    const step = steps[idx];
    const head = step.querySelector(".step-head");
    const body = step.querySelector(".step-body");

    step.classList.add("is-open");
    head.setAttribute("aria-expanded", "true");
    await animateBodyOpen(body);
  }

  async function setOpen(idx, source = "click") {
    if (animating) return;
    animating = true;

    // Toggle behavior on click
    if (source === "click" && openIndex === idx) {
      await closeStep(openIndex);
      openIndex = -1;
      requestAnimationFrame(() => setRailVars(openIndex, true));
      animating = false;
      return;
    }

    // Close previous
    if (openIndex !== -1 && openIndex !== idx) {
      await closeStep(openIndex);
    }

    // Open next
    await openStep(idx);
    openIndex = idx;

    // Update rail after layout settles
    requestAnimationFrame(() => setRailVars(openIndex, true));

    animating = false;
  }

  // Click handlers
  steps.forEach((step, idx) => {
    const head = step.querySelector(".step-head");
    head.addEventListener("click", () => setOpen(idx, "click"));

    // Hover behavior on desktop: open on hover
    head.addEventListener("mouseenter", () => {
      if (window.matchMedia("(hover: hover)").matches) {
        setOpen(idx, "hover");
      }
    });
  });

  // Keep rail aligned on resize
  window.addEventListener("resize", () => {
    setRailVars(openIndex, false);
  });

  // Initial metrics (no step open)
  setRailVars(-1, false);

  // Optional: close open step when section leaves viewport (keeps page feeling clean)
  if ("IntersectionObserver" in window) {
    const howSection = document.getElementById("how");
    if (howSection) {
      const howObs = new IntersectionObserver((entries) => {
        const entry = entries[0];
        if (!entry.isIntersecting && openIndex !== -1) {
          // close when user scrolls away
          closeStep(openIndex).then(() => {
            openIndex = -1;
            setRailVars(-1, false);
          });
        }
      }, { threshold: 0.05 });

      howObs.observe(howSection);
    }
  }
})();
