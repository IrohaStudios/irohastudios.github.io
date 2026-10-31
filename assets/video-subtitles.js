'use strict';
(() => {
  document.querySelectorAll('[data-subtitle-controls]').forEach(controls => {
    const video = document.getElementById(controls.dataset.subtitleControls);
    const element = video?.querySelector('track[kind="subtitles"][srclang="en"]');
    if (!element) return;
    const track = element.track;
    const buttons = controls.querySelectorAll('[data-subtitles]');
    // Start off on every visit, including English pages.
    track.mode = 'disabled';
    const sync = () => {
      const showing = track.mode === 'showing';
      buttons.forEach(button => {
        button.setAttribute('aria-pressed', String((button.dataset.subtitles === 'on') === showing));
      });
    };
    buttons.forEach(button => {
      button.addEventListener('click', () => {
        track.mode = button.dataset.subtitles === 'on' ? 'showing' : 'disabled';
        sync();
      });
    });
    video.textTracks.addEventListener('change', sync);
    sync();
    controls.hidden = false;
  });
})();
