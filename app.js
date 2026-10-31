"use strict";
(() => {
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const root = document.documentElement;
  const messages = JSON.parse($("#ui-messages").textContent);
  const t = (key, values = {}) =>
    messages[key].replace(/\{(\w+)\}/g, (_, name) => values[name] ?? "");
  const languageSelect = $("#language-select");
  const languagePaths = { zh: "/", ja: "/ja/", en: "/en/" };
  const pageLanguage = root.dataset.locale;
  window.addEventListener("pageshow", () => {
    languageSelect.value = pageLanguage;
  });
  const requestedLanguage = new URL(location.href).searchParams.get("lang");
  const validLanguage = (value) => Object.hasOwn(languagePaths, value);
  let savedLanguage;
  try {
    savedLanguage = localStorage.getItem("iroha-language");
  } catch (_) {
    /* Language links work even when storage is unavailable. */
  }
  const preferredLanguage = validLanguage(requestedLanguage)
    ? requestedLanguage
    : pageLanguage === "zh" && validLanguage(savedLanguage)
      ? savedLanguage
      : pageLanguage;
  function languageUrl(language) {
    const url = new URL(location.href);
    url.pathname = languagePaths[language];
    url.searchParams.set("lang", language);
    return url.href;
  }
  if (preferredLanguage !== pageLanguage) {
    location.replace(languageUrl(preferredLanguage));
    return;
  }
  try {
    localStorage.setItem("iroha-language", pageLanguage);
  } catch (_) {
    /* Storage is optional. */
  }
  languageSelect.addEventListener("change", () => {
    const language = languageSelect.value;
    if (!validLanguage(language)) return;
    try {
      localStorage.setItem("iroha-language", language);
    } catch (_) {
      /* The explicit URL still preserves the selected language. */
    }
    location.assign(languageUrl(language));
  });
  const menu = $(".menu-toggle");
  const nav = $("#navigation");
  const header = $("#header");
  function closeMenu(restoreFocus = false) {
    menu.setAttribute("aria-expanded", "false");
    menu.setAttribute("aria-label", t("menu.open"));
    nav.classList.remove("is-open");
    if (restoreFocus) menu.focus();
  }
  menu.addEventListener("click", () => {
    const open = menu.getAttribute("aria-expanded") !== "true";
    menu.setAttribute("aria-expanded", String(open));
    menu.setAttribute("aria-label", t(open ? "menu.close" : "menu.open"));
    nav.classList.toggle("is-open", open);
  });
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("is-open"))
      closeMenu(true);
  });
  document.addEventListener("click", (event) => {
    if (!header.contains(event.target)) closeMenu();
  });
  const sections = ["home", "work", "research", "studio"].map((id) =>
    document.getElementById(id),
  );
  let scrollPending = false;
  function updateNavigation() {
    scrollPending = false;
    header.classList.toggle("is-scrolled", window.scrollY > 100);
    const active =
      [...sections]
        .reverse()
        .find((section) => section.getBoundingClientRect().top <= 160) ||
      sections[0];
    $$(".nav a").forEach((link) => {
      const current = link.hash === "#" + active.id;
      link.classList.toggle("is-current", current);
      if (current) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }
  window.addEventListener(
    "scroll",
    () => {
      if (!scrollPending) {
        scrollPending = true;
        requestAnimationFrame(updateNavigation);
      }
    },
    { passive: true },
  );
  updateNavigation();

  // Motion is progressive enhancement; the document is visible without it.
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  let motionPreference = true;
  try {
    motionPreference = localStorage.getItem("iroha-motion") !== "off";
  } catch (_) {
    /* Storage is optional. */
  }
  let motionEnabled = false;
  let animationContext;
  let motionMedia;
  const motionButton = $("#motion-toggle");
  const canvas = $("#sky-particles");
  const context = canvas.getContext("2d");
  let particles = [];
  let frame = 0;
  let lastFrame = 0;
  let width = 0;
  let height = 0;
  let heroVisible = true;
  // Pre-render the glows once; avoid per-frame shadow blur on mobile.
  const particleSprites = ["#69c6ff", "#b9eeff", "#ffffff"].map((color) => {
    const sprite = document.createElement("canvas");
    sprite.width = sprite.height = 48;
    const brush = sprite.getContext("2d");
    if (!brush) return sprite;
    const glow = brush.createRadialGradient(24, 24, 1, 24, 24, 23);
    glow.addColorStop(0, color);
    glow.addColorStop(0.18, color + "b3");
    glow.addColorStop(0.48, color + "38");
    glow.addColorStop(1, color + "00");
    brush.fillStyle = glow;
    brush.fillRect(0, 0, 48, 48);
    brush.fillStyle = color;
    brush.beginPath();
    brush.arc(24, 24, 3, 0, Math.PI * 2);
    brush.fill();
    brush.fillStyle = "#ffffff";
    brush.beginPath();
    brush.arc(24, 24, 1.4, 0, Math.PI * 2);
    brush.fill();
    return sprite;
  });
  function sizeCanvas() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    if (context) context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const compact = window.innerWidth <= 600;
    const count = compact
      ? 24
      : Math.min(82, Math.max(36, Math.round((width * height) / 15000)));
    particles = Array.from({ length: count }, (_, index) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 5 + Math.random() * (compact ? 6 : 10),
      speed: 7 + Math.random() * 12,
      drift: 2 + Math.random() * 5,
      opacity: 0.5 + Math.random() * 0.4,
      phase: Math.random() * Math.PI * 2,
      sprite: index % particleSprites.length,
      star: index % 9 === 0,
    }));
    reconcileParticles();
  }
  function drawParticles(time) {
    frame = 0;
    if (!motionEnabled || !heroVisible || document.hidden || !context) return;
    if (time - lastFrame >= 32) {
      const delta = Math.min((time - lastFrame) / 1000, 0.08);
      lastFrame = time;
      context.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.y -= p.speed * delta;
        p.x += Math.sin(time / 3500 + p.phase) * p.drift * delta;
        if (p.y < -20) p.y = height + 20;
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        const edge = Math.max(0, Math.min(1, p.y / 48, (height - p.y) / 48));
        const quietText =
          window.innerWidth > 600 && p.x < width * 0.44 ? 0.22 : 1;
        const shimmer = 0.72 + Math.sin(time / 1100 + p.phase) * 0.28;
        context.globalAlpha = p.opacity * edge * quietText * shimmer;
        context.drawImage(
          particleSprites[p.sprite],
          p.x - p.size,
          p.y - p.size,
          p.size * 2,
          p.size * 2,
        );
        if (p.star) {
          const ray = p.size * 0.6;
          context.strokeStyle = "#dbf5ff";
          context.lineWidth = 1;
          context.beginPath();
          context.moveTo(p.x - ray, p.y);
          context.lineTo(p.x + ray, p.y);
          context.moveTo(p.x, p.y - ray);
          context.lineTo(p.x, p.y + ray);
          context.stroke();
        }
      }
      context.globalAlpha = 1;
    }
    frame = requestAnimationFrame(drawParticles);
  }
  function reconcileParticles() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    lastFrame = performance.now();
    if (motionEnabled && heroVisible && !document.hidden && context)
      frame = requestAnimationFrame(drawParticles);
    else if (context) context.clearRect(0, 0, width, height);
  }
  function applyMotion() {
    motionEnabled = motionPreference && !reduce.matches;
    animationContext?.revert();
    motionMedia?.revert();
    root.classList.toggle("motion-off", !motionEnabled);
    motionButton.setAttribute("aria-pressed", String(motionEnabled));
    motionButton.setAttribute(
      "aria-label",
      t(motionEnabled ? "motion.disable" : "motion.enable"),
    );
    motionButton.disabled = reduce.matches;
    $("#motion-label").textContent = reduce.matches
      ? t("motion.reduced")
      : motionEnabled
        ? t("motion.on")
        : t("motion.off");
    if (motionEnabled && window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      animationContext = gsap.context(() => {
        if (window.scrollY < 150)
          gsap.from(".hero-enter", {
            y: 18,
            opacity: 0,
            duration: 0.85,
            stagger: 0.09,
            ease: "power2.out",
            clearProps: "transform,opacity",
          });
        $$(".reveal").forEach((element) => {
          if (element.getBoundingClientRect().top > window.innerHeight) {
            gsap.from(element, {
              y: 24,
              opacity: 0,
              duration: 0.7,
              ease: "power2.out",
              clearProps: "transform,opacity",
              scrollTrigger: { trigger: element, start: "top 94%", once: true },
            });
          }
        });
      });
      motionMedia = gsap.matchMedia();
      motionMedia.add("(min-width: 801px)", () => {
        gsap.to(".hero-art", {
          yPercent: 5,
          ease: "none",
          scrollTrigger: {
            trigger: "#home",
            start: "top top",
            end: "bottom top",
            scrub: 0.7,
          },
        });
      });
    }
    reconcileParticles();
  }
  motionButton.addEventListener("click", () => {
    motionPreference = !motionPreference;
    try {
      localStorage.setItem("iroha-motion", motionPreference ? "on" : "off");
    } catch (_) {
      /* Storage is optional. */
    }
    applyMotion();
  });
  reduce.addEventListener("change", applyMotion);
  new IntersectionObserver((entries) => {
    heroVisible = entries[0].isIntersecting;
    reconcileParticles();
  }).observe($("#home"));
  window.addEventListener(
    "resize",
    () => {
      sizeCanvas();
      if (window.innerWidth > 1100) closeMenu();
    },
    { passive: true },
  );
  document.addEventListener("visibilitychange", reconcileParticles);
  sizeCanvas();
  applyMotion();

  // Samples and waveform peaks are preserved from the existing public research blog.
  const audio = $("#voice-audio");
  const playButton = $("#play-sample");
  const seek = $("#audio-seek");
  const status = $("#audio-status");
  const emotionLabels = Object.fromEntries(
    ["joy", "anger", "sadness", "surprise"].map((emotion) => [
      emotion,
      t("emotion." + emotion),
    ]),
  );
  const emotionTags = {
    joy: "happy",
    anger: "angry",
    sadness: "sad",
    surprise: "surprised",
  };
  let samples = {};
  let selected = "joy";
  let playRequest = 0;
  const playPath = "m9 5 12 7-12 7z";
  const pausePath = "M6 5h4v14H6zm8 0h4v14h-4z";
  const fmt = (seconds) =>
    `${Math.floor((seconds || 0) / 60)}:${String(Math.floor((seconds || 0) % 60)).padStart(2, "0")}`;
  function syncAudio() {
    const playing = !audio.paused && !audio.ended;
    const duration = Number.isFinite(audio.duration)
      ? audio.duration
      : samples[selected]?.duration || 0;
    const position = duration ? (audio.currentTime / duration) * 100 : 0;
    playButton.setAttribute("aria-pressed", String(playing));
    playButton.setAttribute(
      "aria-label",
      t(playing ? "audio.pauseLabel" : "audio.playLabel", {
        emotion: emotionLabels[selected],
      }),
    );
    playButton
      .querySelector("path")
      .setAttribute("d", playing ? pausePath : playPath);
    playButton.querySelector("span").textContent = playing
      ? t("audio.playing")
      : t("audio.listen");
    $("#playback-time").textContent =
      `${fmt(audio.currentTime)} / ${fmt(duration)}`;
    seek.value = position;
    seek.setAttribute(
      "aria-valuetext",
      t("audio.time", {
        elapsed: fmt(audio.currentTime),
        duration: fmt(duration),
      }),
    );
    $$("#waveform i").forEach((bar, index, bars) =>
      bar.classList.toggle("played", (index / bars.length) * 100 < position),
    );
  }
  function chooseEmotion(emotion) {
    selected = emotion;
    playRequest++;
    audio.pause();
    status.textContent = "";
    audio.src = new URL("/" + samples[emotion].url, location.origin).href;
    audio.load();
    $$(".emotion-options button").forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.emotion === emotion),
      ),
    );
    $("#voice-tag").textContent = "[" + emotionTags[emotion] + "]";
    const fragment = document.createDocumentFragment();
    samples[emotion].peaks.forEach((peak) => {
      const bar = document.createElement("i");
      bar.style.height = Math.max(5, Math.min(100, peak * 100)) + "%";
      fragment.append(bar);
    });
    $("#waveform").replaceChildren(fragment);
    syncAudio();
  }
  const audioButtons = [playButton, ...$$(".emotion-options button")];
  audioButtons.forEach((button) => {
    button.disabled = true;
  });
  fetch("/assets/samples.json")
    .then((response) => {
      if (!response.ok) throw new Error("Sample manifest unavailable");
      return response.json();
    })
    .then((data) => {
      for (const emotion of Object.keys(emotionLabels)) {
        const sample = data[emotion];
        if (
          !sample ||
          !Array.isArray(sample.peaks) ||
          !sample.url.startsWith("assets/")
        )
          throw new Error("Invalid sample manifest");
      }
      samples = data;
      chooseEmotion("joy");
      audioButtons.forEach((button) => {
        button.disabled = false;
      });
    })
    .catch(() => {
      status.textContent = t("audio.unavailable");
    });
  $$(".emotion-options button").forEach((button) =>
    button.addEventListener("click", () =>
      chooseEmotion(button.dataset.emotion),
    ),
  );
  playButton.addEventListener("click", async () => {
    if (!audio.paused) {
      audio.pause();
      return;
    }
    const request = ++playRequest;
    status.textContent = t("audio.loading");
    if (audio.error) audio.load();
    if (audio.ended) audio.currentTime = 0;
    try {
      await audio.play();
      if (request === playRequest) status.textContent = "";
    } catch (error) {
      if (request === playRequest && error.name !== "AbortError")
        status.textContent = t("audio.playError");
    }
    syncAudio();
  });
  ["play", "pause", "ended", "timeupdate", "loadedmetadata"].forEach((name) =>
    audio.addEventListener(name, syncAudio),
  );
  audio.addEventListener("error", () => {
    status.textContent = t("audio.loadError");
  });
  seek.addEventListener("input", () => {
    if (Number.isFinite(audio.duration))
      audio.currentTime = (Number(seek.value) / 100) * audio.duration;
    syncAudio();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) audio.pause();
  });
})();
