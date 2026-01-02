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
        // If hero is not sufficiently visible, show header CTA
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
    // fallback
    window.addEventListener("scroll", () => {
      if (window.scrollY > 140) body.classList.add("is-scrolled");
      else body.classList.remove("is-scrolled");
    });
  }

  // How we work: dialog on step tap
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

    // showModal is the modern way to do modal dialogs with inert background
    // https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal 
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

  // Close dialog on clicking backdrop
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

  // Process rail progress: extend through Step 4 (to the middle)
  const railProgress = document.getElementById("railProgress");
  const stepCards = Array.from(document.querySelectorAll(".step-card"));

  function setProgressByIndex(idx) {
    if (!railProgress) return;
    // Middle of each step: (idx + 0.5)/4
    // Step 4 middle => 0.875 (87.5%) which matches your request
    const p = (idx + 0.5) / stepCards.length;
    railProgress.style.height = `${Math.max(0, Math.min(1, p)) * 100}%`;
  }

  if (railProgress && stepCards.length && "IntersectionObserver" in window) {
    const stepObserver = new IntersectionObserver(
      (entries) => {
        // Choose the entry closest to the center (most "active")
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;
        const idx = stepCards.indexOf(visible.target);
        if (idx >= 0) setProgressByIndex(idx);
      },
      {
        // Make the "active step" the one near the middle of the viewport
        root: null,
        threshold: [0.35, 0.5, 0.7],
        rootMargin: "-40% 0px -40% 0px",
      }
    );

    stepCards.forEach((c) => stepObserver.observe(c));
    setProgressByIndex(0);
  }

  // Optional cleanup: if you previously had a service worker cached from older tests,
  // this can prevent "why does my site not update" confusion.
  // You can remove this block later.
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister()); // https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/unregister 
    });
  }
  if ("caches" in window) {
    caches.keys().then((keys) => {
      keys.forEach((k) => caches.delete(k)); // https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage/delete 
    });
  }
})();
