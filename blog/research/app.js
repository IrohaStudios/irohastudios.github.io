'use strict';
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const t = (key, values) => window.IrohaI18n.t('ui.' + key, values);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let motionPaused = reduceMotion.matches;
let samples = {}, activePlayer = null, audioContext, analyser, waveformData, soundLevel = 0;
let selectedEmotion = 'joy';
let audioUnavailable = false;
const audio = new Audio();
audio.preload = 'metadata';
const playIcon = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 3.5v13l11-6.5z"/></svg>';
const pauseIcon = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 3h4v14H4zm8 0h4v14h-4z"/></svg>';
const fmt = seconds => `${Math.floor((seconds || 0) / 60)}:${String(Math.floor((seconds || 0) % 60)).padStart(2, '0')}`;
let toastTimer;
function notify(key) {
  $('#audio-toast').dataset.message = key;
  $('#audio-toast').textContent = t(key);
  $('#audio-toast').classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#audio-toast').classList.remove('visible'), 4500);
}
function setupAudioAnalysis() {
  try {
    if (!audioContext) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      audioContext = new AudioContext();
      analyser = audioContext.createAnalyser(); analyser.fftSize = 512;
      audioContext.createMediaElementSource(audio).connect(analyser);
      analyser.connect(audioContext.destination);
      waveformData = new Uint8Array(analyser.fftSize);
    }
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
  } catch (_) { /* Audio playback remains usable without visualization support. */ }
}
function syncPlayer() {
  if (!activePlayer) return;
  const p = activePlayer, duration = Number.isFinite(audio.duration) ? audio.duration : samples[p.dataset.sample].duration;
  const playing = !audio.paused && !audio.ended;
  p.classList.toggle('is-playing', playing);
  const button = $('.play-button', p);
  button.innerHTML = playing ? pauseIcon : playIcon;
  button.setAttribute('aria-label', t(playing ? 'pauseLabel' : 'playLabel', {label:p.dataset.label}));
  button.setAttribute('aria-pressed', String(playing));
  const progress = duration ? audio.currentTime / duration * 100 : 0;
  $('.wave-seek', p).value = progress;
  $('.wave-seek', p).setAttribute('aria-valuetext', `${fmt(audio.currentTime)} / ${fmt(duration)}`);
  $('.time-display', p).textContent = p.classList.contains('compact') ? fmt(playing || audio.currentTime ? audio.currentTime : duration) : `${fmt(audio.currentTime)} / ${fmt(duration)}`;
  $$('.wave-bars i', p).forEach((bar, i, bars) => bar.classList.toggle('played', i / bars.length * 100 < progress));
  window.irohaAvatar?.refresh();
}
function stopCurrent() {
  if (!activePlayer) return;
  audio.pause();
  audio.currentTime = 0;
  activePlayer.classList.remove('is-loading');
  syncPlayer();
  activePlayer = null;
  window.irohaAvatar?.refresh();
}
function setAudio(p) {
  if (p === activePlayer) return;
  stopCurrent();
  activePlayer = p;
  audio.src = samples[p.dataset.sample].url;
  audio.load();
}
async function play(p) {
  setAudio(p);
  if (!audio.paused) { audio.pause(); return; }
  setupAudioAnalysis();
  if (audio.ended) audio.currentTime = 0;
  p.classList.add('is-loading');
  try { await audio.play(); }
  catch (error) {
    if (error.name !== 'AbortError') notify('audioRetry');
  } finally { p.classList.remove('is-loading'); syncPlayer(); }
}
for (const event of ['play', 'pause', 'timeupdate', 'ended', 'loadedmetadata']) audio.addEventListener(event, syncPlayer);
audio.addEventListener('waiting', () => activePlayer?.classList.add('is-loading'));
audio.addEventListener('playing', () => activePlayer?.classList.remove('is-loading'));
audio.addEventListener('error', () => {
  if (activePlayer) { activePlayer.classList.remove('is-loading'); notify('audioRetry'); syncPlayer(); }
});
function sampleLabel(id) {
  const emotion = id.match(/^(stock|iroha-v1)--emo-(\w+)$/);
  if (emotion) return `${emotion[1] === 'stock' ? 'Fish S2-Pro' : 'Iroha'} · ${t(emotion[2])}`;
  const intensity = id.match(/--int-(\w+)$/);
  if (intensity) return `${t('joy')} · ${t(intensity[1])}`;
  for (const key of ['sigh','laugh','cry']) if (id.includes(`--${key}-`)) return t(key);
  return t({'iroha-v1--trn-T1':'transition','artifact-whisper':'whisper','reference-m1':'reference',
    'iroha-v1--clone-m1':'clone','artifact-reading':'reading'}[id] || 'play');
}
function player(mount, sampleId, label, compact = false) {
  label = sampleLabel(sampleId);
  const host = $(mount), sample = samples[sampleId];
  if (activePlayer && host.contains(activePlayer)) stopCurrent();
  const p = document.createElement('div');
  p.className = `audio-player${compact ? ' compact' : ''}`;
  p.dataset.sample = sampleId; p.dataset.label = label;
  const bars = sample.peaks.map(v => `<i style="height:${Math.max(5, Math.round(v * 100))}%"></i>`).join('');
  p.innerHTML = `<button type="button" class="play-button" aria-pressed="false">${playIcon}</button><div class="wave-wrap"><div class="wave-bars" aria-hidden="true">${bars}</div><input type="range" class="wave-seek" min="0" max="100" step="0.1" value="0" aria-valuetext="0:00 / ${fmt(sample.duration)}"></div><span class="time-display" aria-hidden="true">${compact ? fmt(sample.duration) : `0:00 / ${fmt(sample.duration)}`}</span>`;
  $('.play-button', p).setAttribute('aria-label', t('playLabel', {label}));
  $('.wave-seek', p).setAttribute('aria-label', t('seekLabel', {label}));
  $('.play-button', p).addEventListener('click', () => play(p));
  $('.wave-seek', p).addEventListener('input', event => {
    const ratio = Number(event.target.value) / 100;
    setAudio(p);
    const seek = () => { if (activePlayer !== p) return; audio.currentTime = ratio * (Number.isFinite(audio.duration) ? audio.duration : sample.duration); syncPlayer(); };
    if (audio.readyState >= 1) seek(); else audio.addEventListener('loadedmetadata', seek, {once:true});
  });
  host.replaceChildren(p);
}
function bindTabs(selector, attr, callback) {
  const buttons = $$(selector);
  function select(button, focus = false) {
    buttons.forEach(b => { const selected = b === button; b.setAttribute('aria-selected', String(selected)); b.tabIndex = selected ? 0 : -1; });
    const panel = document.getElementById(button.getAttribute('aria-controls'));
    panel.setAttribute('aria-labelledby', button.id);
    if (focus) button.focus();
    callback(button.dataset[attr]);
  }
  buttons.forEach((button, i) => {
    button.addEventListener('click', () => select(button));
    button.addEventListener('keydown', e => {
      let index;
      if (e.key === 'ArrowRight') index = (i + 1) % buttons.length;
      if (e.key === 'ArrowLeft') index = (i - 1 + buttons.length) % buttons.length;
      if (e.key === 'Home') index = 0;
      if (e.key === 'End') index = buttons.length - 1;
      if (index !== undefined) { e.preventDefault(); select(buttons[index], true); }
    });
  });
  select(buttons[0]);
}
const emotions = {
  joy:{name:'开心',tag:'happy',color:'#136ca4'},
  anger:{name:'生气',tag:'angry',color:'#2c6587'},
  sadness:{name:'难过',tag:'sad',color:'#3b81a8'},
  surprise:{name:'惊讶',tag:'surprised',color:'#278bad'}
};
const events = {
  sigh:{name:'叹气',id:'iroha-v1--sigh-m3-first',text:'[sigh] なかなか厄介な盤面ですね。',zh:'真是个棘手的局面啊。',note:'发布评测 · 56 / 60 条命中（93.33%）'},
  laugh:{name:'笑声',id:'iroha-v1--laugh-m2',text:'主も早柚のように、[laugh] きちんと眠るのだぞ。',zh:'你也要像早柚一样，好好睡觉哦。',note:'发布评测 · 本地 26 / 60；外部 44 / 59，判定口径有差异'},
  cry:{name:'哭声',id:'iroha-v1--cry-f1-first',text:'[cry] うう、また宇宙を漂う「美少女氷」に戻るなんてヤだよ……',zh:'呜呜，我才不要又变回漂在宇宙里的「美少女冰块」……',note:'发布评测 · 16 / 60 条命中（26.67%），仍是弱项'}
};
async function initPlayers() {
  const response = await fetch('/blog/research/assets/samples.json', {cache:'no-cache'});
  if (!response.ok) throw new Error('Missing audio manifest');
  samples = await response.json();
  bindTabs('button[data-emotion]', 'emotion', key => {
    selectedEmotion = key;
    const e = emotions[key];
    $('#emotion-tag').textContent = `[${e.tag}]`;
    $('.listening-desk').style.setProperty('--sample-color', e.color);
    player('#stock-player', `stock--emo-${key}`, `Fish S2-Pro · ${e.name}`);
    player('#iroha-player', `iroha-v1--emo-${key}`, `Iroha · ${e.name}`);
    $$('.compare-players .audio-player').forEach(p => p.style.setProperty('--player-accent', e.color));
    window.irohaAvatar?.refresh();
  });
  bindTabs('[data-event]', 'event', key => {
    const e = events[key];
    $('#event-script').textContent = e.text;
    $('#event-translation').textContent = t(key + 'Translation');
    player('#event-player', e.id, e.name);
  });
  player('#transition-player', 'iroha-v1--trn-T1', '从开心到难过');
  player('#whisper-player', 'artifact-whisper', '耳语');
  player('#reference-player', 'reference-m1', '参考音色', true);
  player('#clone-player', 'iroha-v1--clone-m1', '参考音色生成', true);
  player('#reading-player', 'artifact-reading', '显式读音');
  const levels = ['weakest','weak','default','strong'];
  $('#intensity-bars').innerHTML = Array.from({length:60}, (_,i) => `<i data-seed="${i}"></i>`).join('');
  function setIntensity() {
    const value = Number($('#intensity-range').value);
    const name = t(levels[value]);
    $('#intensity-name').textContent = name;
    $('#intensity-range').setAttribute('aria-valuetext', name);
    $$('#intensity-bars i').forEach((bar, i) => {
      const base = .18 + Math.abs(Math.sin(i * 1.27) * Math.sin(i * .09));
      bar.style.height = `${Math.max(5, base * (22 + value * 19))}px`;
      bar.style.opacity = .25 + value * .19 + base * .18;
    });
    player('#intensity-player', `iroha-v1--int-${levels[value]}`, `${t('joy')} · ${name}`);
  }
  $('#intensity-range').addEventListener('input', setIntensity);
  setIntensity();
  $('#avatar-play').disabled = false;
  window.irohaAvatar?.refresh();
}

// The avatar shares this motion preference with the article's visual effects.
function setMotionState() {
  document.body.classList.toggle('motion-paused', motionPaused);
  $('#motion-toggle').setAttribute('aria-pressed', String(motionPaused));
  $('#motion-toggle').textContent = '✦';
  $('#motion-toggle').title = t(motionPaused ? 'motionOn' : 'motionOff');
  $('#motion-toggle').setAttribute('aria-label', t(motionPaused ? 'motionOn' : 'motionOff'));
  window.irohaAvatar?.refresh();
}
$('#motion-toggle').addEventListener('click', () => { motionPaused = !motionPaused; setMotionState(); });
reduceMotion.addEventListener('change', e => { motionPaused = e.matches; setMotionState(); });
setMotionState();

function refreshLocalizedControls() {
  $$('.audio-player').forEach(p => {
    const label = sampleLabel(p.dataset.sample);
    p.dataset.label = label;
    $('.play-button', p).setAttribute('aria-label', t(p === activePlayer && !audio.paused ? 'pauseLabel' : 'playLabel', {label}));
    $('.wave-seek', p).setAttribute('aria-label', t('seekLabel', {label}));
  });
  const event = $('[data-event][aria-selected="true"]')?.dataset.event;
  if (event) $('#event-translation').textContent = t(event + 'Translation');
  const level = t(['weakest','weak','default','strong'][Number($('#intensity-range').value)]);
  $('#intensity-name').textContent = level;
  $('#intensity-range').setAttribute('aria-valuetext', level);
  if ($('#avatar-play').disabled) $('#avatar-play').textContent = t(audioUnavailable ? 'unavailable' : 'loading');
  const message = $('#audio-toast').dataset.message;
  if (message) $('#audio-toast').textContent = t(message);
  setMotionState();
}
window.addEventListener('iroha:languagechange', refreshLocalizedControls);
refreshLocalizedControls();

const revealObserver = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); revealObserver.unobserve(e.target); } }), {threshold:.06});
$$('.reveal').forEach(el=>revealObserver.observe(el));
document.body.classList.add('js-ready');
const sections = $$('.masthead nav a[href^="#"]').map(a=>({a,section:document.getElementById(a.hash.slice(1))})).filter(item=>item.section);
let scrollQueued=false;
function scrollUpdate() {
  scrollQueued=false;
  const scrollMax=document.documentElement.scrollHeight-window.innerHeight;
  $('.reading-progress').style.transform=`scaleX(${scrollMax>0?window.scrollY/scrollMax:0})`;
  let current;
  sections.forEach(item=>{if(item.section.getBoundingClientRect().top<window.innerHeight*.4)current=item;});
  sections.forEach(item=>{item.a.classList.toggle('current',item===current);if(item===current)item.a.setAttribute('aria-current','location');else item.a.removeAttribute('aria-current');});
}
window.addEventListener('scroll',()=>{if(!scrollQueued){scrollQueued=true;requestAnimationFrame(scrollUpdate);}}, {passive:true});
scrollUpdate();
initPlayers().catch(()=>{
  audioUnavailable = true;
  notify('resourceRetry');
  $$('[role="tab"], #intensity-range, [data-avatar-emotion], #avatar-play').forEach(el=>el.disabled=true);
  $('#avatar-play').textContent = t('unavailable');
});
