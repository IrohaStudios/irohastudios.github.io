'use strict';
(() => {
  const ui = JSON.parse(document.getElementById('blog-ui').textContent);
  const tabs = [...document.querySelectorAll('[data-emotion]')];
  const players = [...document.querySelectorAll('.release-player audio')];
  const tags = {joy:'happy',anger:'angry',sadness:'sad',surprise:'surprised'};
  const error = document.querySelector('.audio-error');
  const clock = seconds => {
    const value = Math.max(0, Math.floor(seconds || 0));
    return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
  };
  const playIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5v14l11-7z"/></svg>';
  const pauseIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zm6 0h4v14h-4z"/></svg>';
  const controls = new Map();
  players.forEach(audio => {
    const card = audio.closest('.release-player');
    const name = card.querySelector('h3').textContent;
    const panel = document.createElement('div');
    panel.className = 'wave-player';
    panel.innerHTML = '<button class="wave-toggle" type="button"></button><div class="wave-timeline"><div class="wave-seek"><div class="wave-bars" aria-hidden="true"></div><input type="range" min="0" value="0" step="0.01"/></div><div class="wave-time" aria-hidden="true"><span>0:00</span><span></span></div></div>';
    const toggle = panel.querySelector('button');
    const seek = panel.querySelector('input');
    const bars = panel.querySelector('.wave-bars');
    const elapsed = panel.querySelector('.wave-time span');
    const total = panel.querySelector('.wave-time span:last-child');
    let sample, emotion = ui.emotions[0], frame = 0, pendingSeek = null;
    const duration = () => Number.isFinite(audio.duration) ? audio.duration : sample.duration;
    function render() {
      const time = pendingSeek ?? audio.currentTime;
      const length = duration();
      seek.max = String(length);
      seek.value = String(time);
      seek.setAttribute('aria-valuetext', `${clock(time)} / ${clock(length)}`);
      elapsed.textContent = clock(time);
      total.textContent = clock(length);
      const fraction = length ? time / length : 0;
      [...bars.children].forEach((bar, index) => bar.classList.toggle('played', fraction > index / bars.children.length));
      const state = audio.paused ? 'paused' : 'playing';
      if (toggle.dataset.state !== state) {
        toggle.innerHTML = audio.paused ? playIcon : pauseIcon;
        toggle.dataset.state = state;
      }
      toggle.setAttribute('aria-label', `${audio.paused ? ui.player.play : ui.player.pause} · ${name} · ${emotion}`);
      card.classList.toggle('is-playing', !audio.paused);
    }
    function tick() {
      render();
      if (!audio.paused) frame = requestAnimationFrame(tick);
    }
    function reset(next, label) {
      cancelAnimationFrame(frame);
      pendingSeek = null;
      sample = next;
      emotion = label;
      card.classList.remove('is-loading');
      toggle.removeAttribute('aria-busy');
      bars.replaceChildren(...sample.peaks.map(peak => {
        const bar = document.createElement('span');
        bar.style.height = `${Math.max(7, Math.sqrt(peak) * 100)}%`;
        return bar;
      }));
      seek.setAttribute('aria-label', `${ui.player.seek} · ${name} · ${emotion}`);
      render();
    }
    toggle.addEventListener('click', async () => {
      if (!audio.paused) { audio.pause(); return; }
      try {
        if (audio.ended) audio.currentTime = 0;
        await audio.play();
      } catch (failure) {
        if (failure.name !== 'AbortError') error.hidden = false;
      }
    });
    seek.addEventListener('input', () => {
      pendingSeek = Number(seek.value);
      if (audio.readyState >= 1) {
        audio.currentTime = pendingSeek;
        pendingSeek = null;
      } else if (audio.networkState !== 2) audio.load();
      render();
    });
    audio.addEventListener('loadedmetadata', () => {
      if (pendingSeek !== null) {
        audio.currentTime = Math.min(pendingSeek, audio.duration);
        pendingSeek = null;
      }
      render();
    });
    audio.addEventListener('play', () => { cancelAnimationFrame(frame); tick(); });
    ['pause', 'ended', 'error', 'timeupdate', 'durationchange'].forEach(event => audio.addEventListener(event, render));
    audio.addEventListener('pause', () => cancelAnimationFrame(frame));
    audio.addEventListener('waiting', () => {
      card.classList.add('is-loading');
      toggle.setAttribute('aria-busy', 'true');
    });
    ['playing', 'pause', 'error', 'canplay'].forEach(event => audio.addEventListener(event, () => {
      card.classList.remove('is-loading');
      toggle.removeAttribute('aria-busy');
    }));
    reset(ui.audio[audio.dataset.model].joy, emotion);
    audio.after(panel);
    audio.controls = false;
    card.classList.add('is-enhanced');
    controls.set(audio, reset);
  });
  function select(button, focus = false) {
    error.hidden = true;
    tabs.forEach(tab => {
      const active = tab === button;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    const emotion = button.dataset.emotion;
    document.getElementById('sample-tag').textContent = `[${tags[emotion]}]`;
    document.getElementById('sample-panel').setAttribute('aria-labelledby', button.id);
    players.forEach(player => {
      player.pause();
      const sample = ui.audio[player.dataset.model][emotion];
      const label = ui.emotions[tabs.indexOf(button)];
      player.src = sample.url;
      player.setAttribute('aria-label', `${player.closest('.release-player').querySelector('h3').textContent} · ${label}`);
      player.closest('.release-player').querySelector('.audio-file').href = sample.url;
      player.load();
      controls.get(player)(sample, label);
    });
    if (focus) button.focus();
  }
  tabs.forEach((button,index) => {
    button.addEventListener('click', () => select(button));
    button.addEventListener('keydown', event => {
      const next = {ArrowRight:(index+1)%tabs.length,ArrowLeft:(index+tabs.length-1)%tabs.length,Home:0,End:tabs.length-1}[event.key];
      if (next !== undefined) { event.preventDefault(); select(tabs[next],true); }
    });
  });
  const media = [...players, ...document.querySelectorAll('.release-film video')];
  media.forEach(player => {
    player.addEventListener('play', () => media.forEach(other => { if (other !== player) other.pause(); }));
  });
  players.forEach(player => {
    player.addEventListener('error', () => { error.hidden = false; });
    player.addEventListener('playing', () => { error.hidden = true; });
  });
  // Language links stay real static URLs and retain the reader's section.
  document.querySelectorAll('.blog-languages a').forEach(link => {
    link.addEventListener('click', () => { link.hash = location.hash; });
  });
  document.querySelectorAll('.mobile-toc a').forEach(link => {
    link.addEventListener('click', () => { link.closest('details').open = false; });
  });
})();
