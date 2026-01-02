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

  // Header CTA appears after scrolling past hero
  const hero = document.querySelector(".hero");
  if (hero && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry.isIntersecting || entry.intersectionRatio < 0.45) {
          body.classList.add("is-scrolled");
        } else {
          body.classList.remove("is-scrolled");
        }
      },
      { threshold: [0, 0.45, 0.7] }
    );
    io.observe(hero);
  } else {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 140) body.classList.add("is-scrolled");
      else body.classList.remove("is-scrolled");
    });
  }

  // Step dialog (native <dialog>)
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

  // How we work rail: gray track + blue progress END at middle of Step 4
  const rail = document.getElementById("processRail");
  const railProgress = document.getElementById("railProgress");
  const stepsWrap = document.getElementById("steps");
  const stepCards = Array.from(document.querySelectorAll(".step-card"));

  let railStartY = 0;
  let railHeight = 0;

  function layoutRail() {
    if (!rail || !stepsWrap || stepCards.length === 0) return;

    const first = stepCards[0];
    const last = stepCards[stepCards.length - 1];

    // Start slightly inside Step 1 so it looks visually aligned
    const startOffset = 16;

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

  // Run rail layout on load + resize (fonts can shift layout too)
  window.addEventListener("load", () => {
    layoutRail();
    initRailObserver();
    setTimeout(() => {
      layoutRail();
      setProgressToIndex(0);
    }, 250);
  });

  window.addEventListener("resize", () => {
    layoutRail();
    // keep progress aligned to whichever step is most visible by forcing a refresh:
    // if no observer, default to step 0
    setProgressToIndex(0);
  });
})();
