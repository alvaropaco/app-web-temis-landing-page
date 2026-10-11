(() => {
  const hero = document.querySelector(".hero");
  if (!hero) return;

  // Replace the earlier full-page prism canvas with this hero-only plasma field.
  const oldCanvas = document.querySelector(".prism-film-background");
  if (oldCanvas) {
    try {
      const oldGl = oldCanvas.getContext("webgl");
      oldGl?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch (_) {}
    oldCanvas.remove();
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canvas = document.createElement("canvas");
  canvas.className = "plasma-hero-background";
  canvas.setAttribute("aria-hidden", "true");
  hero.prepend(canvas);

  const style = document.createElement("style");
  style.textContent = `
    .hero {
      position: relative !important;
      isolation: isolate;
      overflow: clip;
    }
    .plasma-hero-background {
      position: absolute !important;
      inset: -9% -5% !important;
      width: 110% !important;
      height: 118% !important;
      z-index: 0 !important;
      display: block;
      pointer-events: none;
      opacity: .92;
      mix-blend-mode: multiply;
      filter: saturate(1.15) contrast(1.04);
    }
    .hero > *:not(.plasma-hero-background) {
      position: relative;
      z-index: 1;
    }
    @media (max-width: 900px) {
      .plasma-hero-background {
        inset: -5% -14% !important;
        width: 128% !important;
        height: 110% !important;
        opacity: .72;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .plasma-hero-background { opacity: .48; }
    }
  `;
  document.head.appendChild(style);

  const gl = canvas.getContext("webgl2", {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    powerPreference: "high-performance"
  });

  if (!gl) {
    canvas.classList.add("plasma-fallback");
    canvas.style.background = `
      radial-gradient(ellipse 42% 35% at 22% 38%, rgba(255,188,70,.22), transparent 68%),
      radial-gradient(ellipse 36% 32% at 72% 30%, rgba(165,126,255,.18), transparent 70%),
      radial-gradient(ellipse 42% 34% at 62% 78%, rgba(72,205,183,.14), transparent 70%)
    `;
    return;
  }

  const vertexSource = `#version 300 es
    in vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  const fragmentSource = `#version 300 es
    precision highp float;

    uniform vec2 u_resolution;
    uniform float u_time;
    uniform vec2 u_pointer;
    out vec4 outColor;

    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
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
      for (int i = 0; i < 5; i++) {
        v += a * noise(p);
        p = p * 2.02 + vec2(11.7, 7.3);
        a *= 0.5;
      }
      return v;
    }

    vec2 rotate(vec2 p, float a) {
      float s = sin(a), c = cos(a);
      return mat2(c, -s, s, c) * p;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution.xy;
      float aspect = u_resolution.x / max(u_resolution.y, 1.0);
      vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
      vec2 pointer = (u_pointer - 0.5) * vec2(0.22, 0.16);
      p += pointer;

      float t = u_time * 0.22;

      // Domain-warped plasma: slow vortices pull the filaments around like fluid energy.
      float field = fbm(p * 2.35 + vec2(t * 0.38, -t * 0.22));
      vec2 warp = vec2(
        fbm(p * 3.1 + vec2(4.0, -t * 0.55)),
        fbm(p * 3.1 + vec2(-7.0, t * 0.42))
      ) - 0.5;
      vec2 q = p + warp * 0.26;

      // Three broad magnetic streams.
      vec2 q1 = rotate(q - vec2(-0.48, 0.10), -0.18 + sin(t * 0.45) * 0.08);
      vec2 q2 = rotate(q - vec2(0.34, 0.22), 0.22 - cos(t * 0.35) * 0.09);
      vec2 q3 = rotate(q - vec2(0.05, -0.43), -0.48 + sin(t * 0.30) * 0.10);

      float s1 = sin(q1.x * 8.5 + sin(q1.y * 5.0 + t) * 2.3 + field * 4.0);
      float s2 = sin(q2.x * 10.0 - sin(q2.y * 4.0 - t * 1.2) * 2.8 - field * 3.0);
      float s3 = sin(q3.x * 12.0 + sin(q3.y * 6.0 + t * 0.7) * 2.0 + field * 2.5);

      float filament1 = exp(-abs(s1) * 5.8) * smoothstep(1.12, 0.05, length(q1));
      float filament2 = exp(-abs(s2) * 6.6) * smoothstep(1.05, 0.08, length(q2));
      float filament3 = exp(-abs(s3) * 7.2) * smoothstep(1.10, 0.12, length(q3));

      // Soft plasma clouds underneath the sharp energy filaments.
      float cloudA = smoothstep(0.18, 0.82, fbm(q * 2.4 + vec2(t * 0.12, -t * 0.08)));
      float cloudB = smoothstep(0.28, 0.76, fbm(rotate(q, 0.35) * 3.4 - vec2(t * 0.16, t * 0.11)));

      float gold = filament1 * 1.18 + cloudA * 0.16;
      float violet = filament2 * 0.98 + cloudB * 0.13;
      float teal = filament3 * 0.84 + (1.0 - cloudA) * cloudB * 0.10;

      // Pointer creates a local chromatic split around the cursor.
      float pointerDist = length(p - pointer * 0.9);
      float split = exp(-pointerDist * 4.5) * 0.75;
      vec2 splitDir = normalize(p - pointer * 0.9 + vec2(0.0001));
      gold += exp(-abs(sin((q.x + splitDir.x * split) * 9.0 + t)) * 9.0) * split * 0.18;
      violet += exp(-abs(sin((q.y + splitDir.y * split) * 11.0 - t)) * 8.0) * split * 0.15;

      vec3 plasma = vec3(
        1.0 * gold + 0.36 * violet,
        0.58 * gold + 0.72 * teal,
        0.16 * gold + 0.95 * violet + 0.66 * teal
      );

      // Keep center readable; energy concentrates around the hero rather than behind text.
      float centerQuiet = smoothstep(0.02, 0.62, length(p - vec2(-0.30, 0.02)));
      float envelope = smoothstep(1.16, 0.24, length(p * vec2(0.92, 1.18)));
      float intensity = clamp((filament1 * 0.36 + filament2 * 0.31 + filament3 * 0.26 + cloudA * 0.05 + cloudB * 0.04) * envelope * (0.46 + centerQuiet * 0.72), 0.0, 0.34);

      // Chromatic body plus luminous cores.
      vec3 base = mix(vec3(1.0), vec3(0.98, 0.965, 0.93), intensity * 0.45);
      vec3 color = mix(base, clamp(vec3(1.0) - plasma * 0.55, 0.0, 1.0), intensity);
      float core = clamp((filament1 * 0.035 + filament2 * 0.03 + filament3 * 0.024) * envelope, 0.0, 0.075);
      color = mix(color, vec3(1.0, 0.94, 0.78), core);

      outColor = vec4(color, intensity * 0.92);
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
  if (!vertex || !fragment) {
    canvas.classList.add("plasma-fallback");
    return;
  }

  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    canvas.classList.add("plasma-fallback");
    return;
  }

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
  let width = 1;
  let height = 1;
  let dpr = 1;
  let frame = 0;
  let start = performance.now();

  window.addEventListener("pointermove", (event) => {
    const rect = hero.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) return;
    pointerState.tx = (event.clientX - rect.left) / Math.max(rect.width, 1);
    pointerState.ty = 1 - (event.clientY - rect.top) / Math.max(rect.height, 1);
  }, { passive: true });

  const resize = () => {
    const rect = hero.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    width = Math.max(1, Math.floor(rect.width * dpr));
    height = Math.max(1, Math.floor(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
  };

  const render = (now) => {
    resize();
    pointerState.x += (pointerState.tx - pointerState.x) * 0.035;
    pointerState.y += (pointerState.ty - pointerState.y) * 0.035;

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

    if (!document.hidden) frame = requestAnimationFrame(render);
  };

  const restart = () => {
    if (!document.hidden && !frame) {
      start = performance.now();
      frame = requestAnimationFrame(render);
    }
  };

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else {
      restart();
    }
  });

  window.addEventListener("resize", resize, { passive: true });
  resize();
  frame = requestAnimationFrame(render);
})();
