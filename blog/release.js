'use strict';
(() => {
  const ui = JSON.parse(document.getElementById('blog-ui').textContent);
  const tabs = [...document.querySelectorAll('[data-emotion]')];
  const players = [...document.querySelectorAll('.release-player audio')];
  const tags = {joy:'happy',anger:'angry',sadness:'sad',surprise:'surprised'};
  const error = document.querySelector('.audio-error');
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
      const url = `/blog/research/assets/audio/${player.dataset.model}--emo-${emotion}.mp3`;
      player.src = url;
      player.setAttribute('aria-label', `${player.previousElementSibling.textContent} · ${ui.emotions[tabs.indexOf(button)]}`);
      player.nextElementSibling.href = url;
      player.load();
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
  players.forEach(player => {
    player.addEventListener('play', () => players.forEach(other => { if (other !== player) other.pause(); }));
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
