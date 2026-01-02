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

  // Step dialog
  const dialog = document.getElementById("stepDialog");
  const dialogTitle = document.getElementById("dialogTitle");
  const dialogBody = document.getElementById("dialogBody");
  const dialogOuts = document.getElementById("dialogOuts");
  const dialogClose = document.getElementById("dialogClose");

  function openStep(stepEl) {
    if (!dialog) return;

    const title = stepEl.getAttribute("data-step") || "Step";
    const detail = stepEl.getAttribute("data-detail") || "";
    const outs = stepEl.getAttribute("data-outputs") || "";

    if (dialogTitle) dialogTitle.textContent = title;
    if (dialogBody) dialogBody.textContent = detail;
    if (dialogOuts) dialogOuts.textContent = outs;

    dialog.showModal();
  }

  function closeDialog() {
    if (!dialog) return;
    dialog.close();
  }

  document.querySelectorAll(".step-card").forEach((btn) => {
    btn.addEventListener("click", () => openStep(btn));
  });

  dialogClose?.addEventListener("click", closeDialog);

  if (dialog) {
    dialog.addEventListener("click", (e) => {
      const rect = dialog.getBoundingClientRect();
      const inDialog =
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width;

      if (!inDialog) closeDialog();
    });
  }

  // Header CTA MECE logic:
  // Show header "Book a call" only when:
  // - hero book button is NOT visible, AND
  // - bottom CTA section is NOT visible
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

  // hero button visibility
  observeVisibility(
    heroBook,
    (isVisible) => {
      heroVisible = isVisible;
      updateHeaderCta();
    },
    { threshold: 0.6 }
  );

  // bottom CTA visibility (hide header CTA when CTA is in view)
  observeVisibility(
    ctaSection,
    (isVisible) => {
      ctaVisible = isVisible;
      updateHeaderCta();
    },
    { threshold: 0.25 }
  );

  // Fallback (older browsers)
  if (!("IntersectionObserver" in window)) {
    window.addEventListener("scroll", () => {
      const heroRect = heroBook?.getBoundingClientRect();
      const ctaRect = ctaSection?.getBoundingClientRect();

      heroVisible = !!heroRect && heroRect.top >= 0 && heroRect.bottom <= window.innerHeight;
      ctaVisible = !!ctaRect && ctaRect.top < window.innerHeight && ctaRect.bottom > 0;

      updateHeaderCta();
    }, { passive: true });
  }

  // How we work rail: end at middle of Step 4
  const rail = document.getElementById("processRail");
  const railProgress = document.getElementById("railProgress");
  const stepCards = Array.from(document.querySelectorAll(".step-card"));

  let railStartY = 0;
  let railHeight = 0;

  function layoutRail() {
    if (!rail || stepCards.length === 0) return;

    const first = stepCards[0];
    const last = stepCards[stepCards.length - 1];

    const startOffset = 16; // looks aligned with Step 1 content
    railStartY = first.offsetTop + startOffset;

    const endY = last.offsetTop + (last.offsetHeight / 2);
    railHeight = Math.max(0, endY - railStartY);

    rail.style.top = `${railStartY}px`;
    rail.style.height = `${railHeight}px`;
  }

  function setProgressToIndex(idx) {
    if (!railProgress || stepCards.length === 0 || railHeight <= 0) return;

    const el = stepCards[idx];
    const centerY = el.offsetTop + (el.offsetHeight / 2);

    const p = (centerY - railStartY) / railHeight;
    const clamped = Math.max(0, Math.min(1, p));
    railProgress.style.height = `${clamped * 100}%`;
  }

  function initRailObserver() {
    if (!("IntersectionObserver" in window) || stepCards.length === 0) {
      layoutRail();
      setProgressToIndex(0);
      return;
    }

    const stepObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;

        const idx = stepCards.indexOf(visible.target);
        if (idx >= 0) setProgressToIndex(idx);
      },
      {
        threshold: [0.35, 0.5, 0.7],
        rootMargin: "-40% 0px -40% 0px",
      }
    );

    stepCards.forEach((c) => stepObserver.observe(c));

    layoutRail();
    setProgressToIndex(0);
  }

  window.addEventListener("load", () => {
    layoutRail();
    initRailObserver();
    updateHeaderCta();

    // fonts can shift layout after load
    setTimeout(() => {
      layoutRail();
      setProgressToIndex(0);
      updateHeaderCta();
    }, 250);
  });

  window.addEventListener("resize", () => {
    layoutRail();
    setProgressToIndex(0);
    updateHeaderCta();
  });
})();
