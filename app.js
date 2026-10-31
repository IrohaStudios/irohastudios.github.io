"use strict";
(() => {
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const root = document.documentElement;
  const menu = $(".menu-toggle");
  const nav = $("#navigation");
  const header = $("#header");
  function closeMenu(restoreFocus = false) {
    menu.setAttribute("aria-expanded", "false");
    menu.setAttribute("aria-label", "打开菜单");
    nav.classList.remove("is-open");
    if (restoreFocus) menu.focus();
  }
  menu.addEventListener("click", () => {
    const open = menu.getAttribute("aria-expanded") !== "true";
    menu.setAttribute("aria-expanded", String(open));
    menu.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
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
  const desktop = window.matchMedia("(min-width: 801px)");
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
  function sizeCanvas() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    if (context) context.setTransform(ratio, 0, 0, ratio, 0, 0);
    particles = Array.from({ length: 25 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 1 + Math.random() * 2.3,
      speed: 0.1 + Math.random() * 0.22,
      phase: Math.random() * Math.PI * 2,
    }));
    reconcileParticles();
  }
  function drawParticles(time) {
    frame = 0;
    if (
      !motionEnabled ||
      !desktop.matches ||
      !heroVisible ||
      document.hidden ||
      !context
    )
      return;
    if (time - lastFrame >= 32) {
      const delta = Math.min((time - lastFrame) / 16.7, 3);
      lastFrame = time;
      context.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.y -= p.speed * delta;
        p.x += Math.sin(time / 3000 + p.phase) * 0.16 * delta;
        if (p.y < -10) p.y = height + 10;
        context.beginPath();
        context.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        context.fillStyle = "rgba(255,255,255,.58)";
        context.fill();
      }
    }
    frame = requestAnimationFrame(drawParticles);
  }
  function reconcileParticles() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    lastFrame = performance.now();
    if (
      motionEnabled &&
      desktop.matches &&
      heroVisible &&
      !document.hidden &&
      context
    )
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
      motionEnabled ? "关闭页面动效" : "开启页面动效",
    );
    motionButton.disabled = reduce.matches;
    $("#motion-label").textContent = reduce.matches
      ? "系统减弱动效"
      : motionEnabled
        ? "动效 ON"
        : "动效 OFF";
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
  desktop.addEventListener("change", reconcileParticles);
  new IntersectionObserver((entries) => {
    heroVisible = entries[0].isIntersecting;
    reconcileParticles();
  }).observe($("#home"));
  window.addEventListener(
    "resize",
    () => {
      sizeCanvas();
      if (window.innerWidth > 600) closeMenu();
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
  const emotionLabels = {
    joy: "开心",
    anger: "生气",
    sadness: "悲伤",
    surprise: "惊讶",
  };
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
      (playing ? "暂停" : "播放") + emotionLabels[selected] + "语音",
    );
    playButton
      .querySelector("path")
      .setAttribute("d", playing ? pausePath : playPath);
    playButton.querySelector("span").textContent = playing
      ? "正在播放"
      : "试听这句话";
    $("#playback-time").textContent =
      `${fmt(audio.currentTime)} / ${fmt(duration)}`;
    seek.value = position;
    seek.setAttribute(
      "aria-valuetext",
      `${fmt(audio.currentTime)} / ${fmt(duration)}`,
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
    audio.src = samples[emotion].url;
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
  fetch("assets/samples.json")
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
      status.textContent =
        "试听暂时不可用，可通过下方「完整试听」进入研究博客。";
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
    status.textContent = "正在加载音频…";
    if (audio.error) audio.load();
    if (audio.ended) audio.currentTime = 0;
    try {
      await audio.play();
      if (request === playRequest) status.textContent = "";
    } catch (error) {
      if (request === playRequest && error.name !== "AbortError")
        status.textContent = "未能播放，点击可重试，或打开下方完整试听。";
    }
    syncAudio();
  });
  ["play", "pause", "ended", "timeupdate", "loadedmetadata"].forEach((name) =>
    audio.addEventListener(name, syncAudio),
  );
  audio.addEventListener("error", () => {
    status.textContent = "音频加载失败，点击可重试，或打开下方完整试听。";
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
