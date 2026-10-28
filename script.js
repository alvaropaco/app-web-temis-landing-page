(() => {
  const year = document.querySelector("#year");
  if (year) year.textContent = new Date().getFullYear();

  // Keep a tag-manager-ready event stream without loading trackers or cookies.
  window.dataLayer = window.dataLayer || [];
  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target.closest("[data-track]") : null;
    if (!target) return;
    const detail = {
      event: target.getAttribute("data-track"),
      location: target.getAttribute("data-track-location") || "not_set",
      page_path: window.location.pathname,
      asset: target.getAttribute("data-asset") || undefined,
      link_url: target.href?.startsWith("https://") ? target.href : undefined
    };
    window.dataLayer.push(detail);
    document.dispatchEvent(new CustomEvent("temis:track", { detail }));
  });

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
    const setMenuOpen = (open, returnFocus = false) => {
      menuButton.setAttribute("aria-expanded", String(open));
      menuButton.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
      nav.classList.toggle("open", open);
      if (returnFocus) menuButton.focus();
    };

    menuButton.addEventListener("click", () => {
      setMenuOpen(menuButton.getAttribute("aria-expanded") !== "true");
    });
    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setMenuOpen(false));
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
        setMenuOpen(false, true);
      }
    });
    document.addEventListener("click", (event) => {
      if (menuButton.getAttribute("aria-expanded") !== "true") return;
      const clickedElement = event.target instanceof Element ? event.target : null;
      if (!clickedElement?.closest(".site-header")) setMenuOpen(false);
    });
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const motionButton = document.querySelector(".motion-toggle");
  if (motionButton) {
    motionButton.hidden = reduceMotion;
    motionButton.addEventListener("click", () => {
      const paused = !document.body.classList.contains("motion-paused");
      document.body.classList.toggle("motion-paused", paused);
      motionButton.setAttribute("aria-pressed", String(paused));
      motionButton.textContent = paused ? "Retomar animações" : "Pausar animações";
      document.dispatchEvent(new CustomEvent("temis:motionchange", { detail: { paused } }));
    });
  }

  // Scroll reveal must not depend on the decorative WebGL background.
  const revealElements = [...document.querySelectorAll(".reveal")];
  if ("IntersectionObserver" in window && !reduceMotion) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });
    const revealRects = revealElements.map((element) => element.getBoundingClientRect());
    revealElements.forEach((element, index) => {
      const rect = revealRects[index];
      if (rect.top < window.innerHeight * 0.96 && rect.bottom > 0) {
        element.classList.add("is-visible");
      } else {
        observer.observe(element);
      }
    });
  } else {
    revealElements.forEach((element) => element.classList.add("is-visible"));
  }

  try {
  if (document.querySelector(".hero")) {
  // Animated prism-film shader background.
  const prismCanvas = document.createElement("canvas");
  prismCanvas.className = "prism-film-background";
  prismCanvas.setAttribute("aria-hidden", "true");
  document.body.prepend(prismCanvas);

  const prismStyle = document.createElement("style");
  prismStyle.textContent = `
    .prism-film-background {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      z-index: 0;
      pointer-events: none;
      display: block;
      opacity: .72;
      mix-blend-mode: multiply;
    }
    .prism-film-fallback {
      background:
        radial-gradient(70% 50% at 70% 20%, rgba(248,188,84,.15), transparent 62%),
        radial-gradient(50% 70% at 20% 65%, rgba(229,205,164,.13), transparent 64%),
        linear-gradient(115deg, transparent 20%, rgba(248,188,84,.10) 42%, transparent 58%);
      background-size: 140% 140%, 130% 130%, 180% 180%;
      animation: prismFallback 16s ease-in-out infinite alternate;
    }
    body > .site-header,
    body > main,
    body > footer { position: relative; z-index: 1; }
    @keyframes prismFallback {
      from { background-position: 0% 20%, 100% 80%, 0% 50%; }
      to { background-position: 100% 80%, 0% 20%, 100% 50%; }
    }
    @media (prefers-reduced-motion: reduce) {
      .prism-film-background { opacity: .38; }
      .prism-film-fallback { animation: none; }
    }
  `;
  document.head.appendChild(prismStyle);

  const gl = prismCanvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: true,
    powerPreference: "low-power"
  });

  if (!gl) {
    prismCanvas.classList.add("prism-film-fallback");
  } else {
    const vertexSource = `
      attribute vec2 a_position;
      void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
    `;
    const fragmentSource = `
      precision mediump float;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform vec2 u_pointer;

      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 345.45));
        p += dot(p, p + 34.345);
        return fract(p.x * p.y);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
          mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x),
          f.y
        );
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 4; i++) {
          v += a * noise(p);
          p = p * 2.03 + vec2(17.1, 9.2);
          a *= 0.5;
        }
        return v;
      }

      vec3 filmPalette(float x) {
        vec3 a = vec3(0.965, 0.925, 0.835);
        vec3 b = vec3(0.95, 0.70, 0.34);
        vec3 c = vec3(0.78, 0.70, 0.82);
        vec3 d = vec3(0.72, 0.86, 0.80);
        float t = clamp(x, 0.0, 1.0);
        vec3 warm = mix(a, b, smoothstep(0.18, 0.52, t));
        vec3 cool = mix(c, d, smoothstep(0.52, 0.86, t));
        return mix(warm, cool, smoothstep(0.42, 0.72, t));
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        float aspect = u_resolution.x / max(u_resolution.y, 1.0);
        vec2 p = uv - 0.5;
        p.x *= aspect;

        float t = u_time * 0.055;
        vec2 pointer = (u_pointer - 0.5) * vec2(0.10, 0.07);
        p += pointer;

        float n = fbm(p * 2.1 + vec2(t * 0.8, -t * 0.45));
        vec2 warped = p + vec2(
          sin(p.y * 5.0 + t * 1.7 + n * 2.0),
          cos(p.x * 4.0 - t * 1.35 + n * 1.6)
        ) * 0.035;

        float ribbonA = sin(warped.x * 5.5 + sin(warped.y * 4.0 + t) * 1.8 + t * 1.4);
        float ribbonB = sin(warped.y * 6.5 - sin(warped.x * 3.5 - t) * 1.5 - t * 1.1);
        float prism = 0.5 + 0.5 * sin(ribbonA * 2.0 + ribbonB * 1.4 + n * 3.0);
        float sheen = pow(max(0.0, 1.0 - abs(ribbonA)), 5.0);

        float diagonal = sin((p.x * 1.7 + p.y * 2.4) * 4.0 + t * 2.2 + n * 2.5);
        float spectral = 0.5 + 0.5 * diagonal;
        vec3 color = filmPalette(mix(prism, spectral, 0.38));

        float glow = exp(-3.5 * length(p - vec2(0.34, 0.18)));
        float edge = smoothstep(0.88, 0.10, length(p) * 0.74);
        float intensity = (0.035 + sheen * 0.045 + glow * 0.035 + prism * 0.018) * edge;

        // Keep it editorial and restrained: the page remains predominantly white.
        vec3 finalColor = mix(vec3(1.0), color, intensity);
        float alpha = intensity * 0.92;
        gl_FragColor = vec4(finalColor, alpha);
      }
    `;

    const compile = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertex = compile(gl.VERTEX_SHADER, vertexSource);
    const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
    const program = vertex && fragment ? gl.createProgram() : null;

    if (!program) {
      prismCanvas.classList.add("prism-film-fallback");
    } else {
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        prismCanvas.classList.add("prism-film-fallback");
      } else {
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
          -1, -1, 1, -1, -1, 1,
          -1, 1, 1, -1, 1, 1
        ]), gl.STATIC_DRAW);

        const position = gl.getAttribLocation(program, "a_position");
        const resolution = gl.getUniformLocation(program, "u_resolution");
        const time = gl.getUniformLocation(program, "u_time");
        const pointer = gl.getUniformLocation(program, "u_pointer");
        const pointerState = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
        let width = 0;
        let height = 0;
        let dpr = 1;
        let start = performance.now();

        window.addEventListener("pointermove", (event) => {
          pointerState.tx = event.clientX / Math.max(window.innerWidth, 1);
          pointerState.ty = 1 - event.clientY / Math.max(window.innerHeight, 1);
        }, { passive: true });

        const resize = () => {
          dpr = Math.min(window.devicePixelRatio || 1, 1.75);
          width = Math.max(1, Math.floor(window.innerWidth * dpr));
          height = Math.max(1, Math.floor(window.innerHeight * dpr));
          if (prismCanvas.width !== width || prismCanvas.height !== height) {
            prismCanvas.width = width;
            prismCanvas.height = height;
            gl.viewport(0, 0, width, height);
          }
        };

        const render = (now) => {
          if (!prismCanvas.isConnected) return;
          resize();
          pointerState.x += (pointerState.tx - pointerState.x) * 0.025;
          pointerState.y += (pointerState.ty - pointerState.y) * 0.025;

          gl.clearColor(1, 1, 1, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);
          gl.useProgram(program);
          gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
          gl.enableVertexAttribArray(position);
          gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
          gl.uniform2f(resolution, width, height);
          gl.uniform1f(time, reduceMotion ? 0 : (now - start) * 0.001);
          gl.uniform2f(pointer, pointerState.x, pointerState.y);
          gl.drawArrays(gl.TRIANGLES, 0, 6);

          if (!document.hidden) requestAnimationFrame(render);
        };

        window.addEventListener("resize", resize, { passive: true });
        resize();
        requestAnimationFrame(render);
      }
    }
  }
  }
  } catch (error) {
    console.warn("TemisChat decorative background could not start.", error);
    document.querySelector(".prism-film-background")?.classList.add("prism-film-fallback");
  }

  // Product preview layout guard.
  const layoutStyle = document.createElement("style");
  layoutStyle.textContent = `
    .window-content {
      display: block !important;
      width: 100% !important;
      min-width: 0 !important;
      height: clamp(390px, 34vw, 485px) !important;
      min-height: 390px !important;
      overflow: hidden !important;
    }
    .preview-panel {
      display: none !important;
      width: 100% !important;
      height: 100% !important;
      min-width: 0 !important;
      min-height: 390px !important;
      margin: 0 !important;
    }
    .preview-panel.is-active {
      display: grid !important;
    }
    .preview-panel[hidden] {
      display: none !important;
    }
    .preview-panel > * {
      min-width: 0;
    }
    @media (max-width: 920px) {
      .window-content {
        height: 430px !important;
      }
    }
    @media (max-width: 640px) {
      .window-content {
        height: 420px !important;
        min-height: 420px !important;
      }
      .preview-panel.is-active {
        min-height: 420px !important;
      }
    }
  `;
  document.head.appendChild(layoutStyle);

  // Product preview switcher: Workspace -> CNJ -> Overlay.
  const tabs = [...document.querySelectorAll("[data-preview-tab]")];
  const panels = [...document.querySelectorAll("[data-preview-panel]")];
  const names = tabs.map((tab) => tab.getAttribute("data-preview-tab")).filter(Boolean);
  let current = names.includes("workspace") ? "workspace" : names[0];

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
    });

    tab.addEventListener("keydown", (event) => {
      if (!["ArrowRight", "ArrowLeft"].includes(event.key)) return;
      event.preventDefault();
      const offset = event.key === "ArrowRight" ? 1 : -1;
      const next = tabs[(index + offset + tabs.length) % tabs.length];
      activate(next?.getAttribute("data-preview-tab"), true);
    });
  });

  document.querySelectorAll("[data-open-preview]").forEach((link) => {
    link.addEventListener("click", () => {
      activate(link.getAttribute("data-open-preview"));
    });
  });

  // Desktop downloads: the buttons are static links to the versionless files
  // under temischat/latest/ on the release CDN (republished by CI on every
  // release); labels use the live manifest when CORS permits and a packaged
  // metadata copy otherwise, so a blocked cross-origin read hides no release.
  // Because those filenames never change, the release build id is appended as
  // ?v= — otherwise a cached copy from a previous release can answer a click.
  const releaseBuild = (manifest) => {
    if (typeof manifest.build === "string" && /^[0-9a-f]{7,40}$/i.test(manifest.build)) {
      return manifest.build;
    }
    const match = typeof manifest.notes === "string" ? manifest.notes.match(/\bBuild\s+([0-9a-f]{7,40})\b/i) : null;
    return match ? match[1] : "";
  };
  const bustDownloadCaches = (stamp) => {
    if (!stamp) return;
    document.querySelectorAll("a[data-asset]").forEach((link) => {
      if (!(link instanceof HTMLAnchorElement)) return;
      let url;
      try {
        url = new URL(link.href);
      } catch {
        return;
      }
      if (url.hostname !== "temis-chat-releases.temischat.com") return;
      url.searchParams.set("v", stamp);
      link.href = url.toString();
    });
  };
  const userAgent = navigator.userAgent;
  const visitorPlatform = /Windows/i.test(userAgent)
    ? "windows"
    : /Macintosh|Mac OS X/i.test(userAgent) && !/iPhone|iPad|iPod/i.test(userAgent)
      ? "macos"
      : null;
  if (visitorPlatform) {
    const pill = document.querySelector(`.download-card[data-platform="${visitorPlatform}"] .recommended-pill`);
    if (pill) pill.hidden = false;
  }

  if (document.querySelector("#dl-version, [data-release-latest]")) {
    (async () => {
      const status = document.querySelector("[data-release-status]");
      let manifest;
      let liveManifest = true;
      try {
        try {
          const response = await fetch("https://temis-chat-releases.temischat.com/temischat/latest/latest.json");
          if (!response.ok) throw new Error(`CDN ${response.status}`);
          manifest = await response.json();
        } catch (cdnError) {
          liveManifest = false;
          const response = await fetch("./assets/release-latest.json");
          if (!response.ok) throw new Error(`Local release fallback ${response.status}`);
          manifest = await response.json();
        }
        if (!manifest.version || !manifest.pub_date) throw new Error("Release metadata is incomplete");

        const build = releaseBuild(manifest);
        const stamp = build || String(Date.parse(manifest.pub_date) || "");

        document.querySelectorAll("#dl-version, [data-release-version]").forEach((label) => {
          const versionLabel = label.hasAttribute("data-release-version")
            ? manifest.version
            : `versão ${manifest.version}`;
          label.textContent = build ? `${versionLabel} · build ${build}` : versionLabel;
        });
        const publishedAt = new Date(manifest.pub_date);
        const formattedDate = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(publishedAt);
        document.querySelectorAll("#dl-date, [data-release-date]").forEach((label) => {
          label.textContent = label.hasAttribute("data-release-date") ? formattedDate : `atualizada em ${formattedDate}`;
          if (label instanceof HTMLTimeElement) label.dateTime = manifest.pub_date;
        });
        const notes = document.querySelector("[data-release-notes]");
        if (notes && typeof manifest.notes === "string" && manifest.notes.trim()) {
          notes.textContent = manifest.notes.trim();
        }
        bustDownloadCaches(stamp);
        if (status) {
          status.textContent = liveManifest
            ? `Versão, build e data carregadas do manifesto oficial da release${build ? ` (build ${build})` : ""}.`
            : `Exibindo a cópia local da versão ${manifest.version}${build ? ` (build ${build})` : ""}; o manifesto ao vivo não pôde ser lido pelo navegador.`;
        }
      } catch (error) {
        if (status) status.textContent = "Não foi possível carregar os metadados agora. Os downloads oficiais continuam disponíveis nesta página.";
      }
    })();
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
