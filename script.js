(() => {
  const year = document.querySelector("#year");
  if (year) year.textContent = new Date().getFullYear();

  // Use the official TemisChat symbol as a single-colour vector mask.
  document.querySelectorAll(".brand-mark").forEach((brandMark) => {
    brandMark.innerHTML = "";
    Object.assign(brandMark.style, {
      backgroundColor: "#AC7008",
      WebkitMaskImage: 'url("./assets/temischat-mark.svg")',
      maskImage: 'url("./assets/temischat-mark.svg")',
      WebkitMaskRepeat: "no-repeat",
      maskRepeat: "no-repeat",
      WebkitMaskPosition: "center",
      maskPosition: "center",
      WebkitMaskSize: "contain",
      maskSize: "contain"
    });
  });

  // Mobile navigation.
  const menuButton = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".desktop-nav");
  if (menuButton && nav) {
    menuButton.addEventListener("click", () => {
      const expanded = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!expanded));
      nav.classList.toggle("open", !expanded);
    });
    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("open");
        menuButton.setAttribute("aria-expanded", "false");
      });
    });
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Scroll reveal.
  const revealElements = [...document.querySelectorAll(".reveal")];
  if ("IntersectionObserver" in window && !reduceMotion) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });
    revealElements.forEach((element) => observer.observe(element));
  } else {
    revealElements.forEach((element) => element.classList.add("is-visible"));
  }

  // Product preview switcher: Workspace -> CNJ -> Overlay.
  const tabs = [...document.querySelectorAll("[data-preview-tab]")];
  const panels = [...document.querySelectorAll("[data-preview-panel]")];
  const names = tabs.map((tab) => tab.getAttribute("data-preview-tab")).filter(Boolean);
  let current = names.includes("workspace") ? "workspace" : names[0];
  let paused = false;
  let resumeTimer = 0;

  const activate = (name, focus = false) => {
    if (!name || !names.includes(name)) return;
    current = name;

    tabs.forEach((tab) => {
      const active = tab.getAttribute("data-preview-tab") === name;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.setAttribute("tabindex", active ? "0" : "-1");
      if (active && focus) tab.focus();
    });

    panels.forEach((panel) => {
      const active = panel.getAttribute("data-preview-panel") === name;
      panel.classList.toggle("is-active", active);
      panel.hidden = !active;
      if (active) {
        panel.classList.remove("panel-enter");
        void panel.offsetWidth;
        panel.classList.add("panel-enter");
      }
    });
  };

  if (current) activate(current);

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
      activate(tab.getAttribute("data-preview-tab"));
      paused = true;
      window.clearTimeout(resumeTimer);
      resumeTimer = window.setTimeout(() => { paused = false; }, 9000);
    });

    tab.addEventListener("keydown", (event) => {
      if (!["ArrowRight", "ArrowLeft"].includes(event.key)) return;
      event.preventDefault();
      const offset = event.key === "ArrowRight" ? 1 : -1;
      const next = tabs[(index + offset + tabs.length) % tabs.length];
      activate(next?.getAttribute("data-preview-tab"), true);
    });
  });

  const preview = document.querySelector(".preview-switcher");
  if (preview && !reduceMotion && names.length > 1) {
    preview.addEventListener("pointerenter", () => { paused = true; });
    preview.addEventListener("pointerleave", () => { paused = false; });
    preview.addEventListener("focusin", () => { paused = true; });
    preview.addEventListener("focusout", (event) => {
      if (!preview.contains(event.relatedTarget)) paused = false;
    });

    window.setInterval(() => {
      if (paused || document.hidden) return;
      const index = names.indexOf(current);
      activate(names[(index + 1) % names.length]);
    }, 6200);
  }

  // Restrained pointer parallax on desktop.
  const hero = document.querySelector(".hero-visual");
  const windowCard = document.querySelector(".product-window");
  if (hero && windowCard && window.matchMedia("(pointer: fine)").matches && !reduceMotion) {
    let frame = 0;

    hero.addEventListener("pointermove", (event) => {
      const bounds = hero.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;

      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      const rotateY = (-1.3 + x * 2).toFixed(2);
      const rotateX = (0.7 - y * 1.5).toFixed(2);

      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        windowCard.style.transform =
          "rotateY(" + rotateY + "deg) rotateX(" + rotateX + "deg) translateY(-1px)";
      });
    });

    hero.addEventListener("pointerleave", () => {
      cancelAnimationFrame(frame);
      windowCard.style.transform = "";
    });
  }
})();
