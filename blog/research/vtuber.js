'use strict';

(() => {
  const dock = document.getElementById('vtuber-mini');
  const canvas = document.getElementById('sound-sculpture');
  const restore = document.getElementById('avatar-restore');
  const playButton = document.getElementById('avatar-play');
  const audioButton = document.getElementById('avatar-audio');
  const expressionButtons = [...document.querySelectorAll('[data-avatar-emotion]')];
  const wide = matchMedia('(min-width: 1200px)');
  let rig, tracks = {}, dismissed = false, failed = false;
  let lastFrame = performance.now(), elapsed = 0, nextBlink = 3, blinkStart = -10;
  let mouth = 0, form = 0, gazeX = 0, gazeY = 0, pointerX = 0, pointerY = 0, pointerAt = 0;
  let hair = 0, hairVelocity = 0, snapMouth = true;
  const shape = {A:[0,0],B:[.16,.8],C:[.55,.4],D:[1,.2],E:[.5,-.4],F:[.25,-1],G:[.16,.3],H:[.58,.1],X:[0,0]};

  function playing() { return Boolean(activePlayer && !audio.paused && !audio.ended && audio.readyState >= 2); }
  function expression() {
    const sample = playing() ? activePlayer.dataset.sample : '';
    const tag = sample.match(/--emo-(joy|anger|sadness|surprise)$/);
    if(tag)return tag[1];
    if(sample.includes('--int-'))return 'joy';
    if(sample.includes('--laugh-'))return 'joy';
    if(sample.includes('--cry-')||sample.includes('--sigh-'))return 'sadness';
    return selectedEmotion;
  }
  function cueAt(sample, time) {
    const cues=tracks[sample]?.cues;
    if(!cues)return null;
    // Media time, rather than a separate animation clock, also handles seeks.
    let lo=0,hi=cues.length-1;
    while(lo<=hi){const mid=(lo+hi)>>1,c=cues[mid];if(time<c[0])hi=mid-1;else if(time>=c[1])lo=mid+1;else return c[2];}
    return 'X';
  }
  function visible() {
    dock.hidden = !rig || dismissed || document.hidden || (!wide.matches && !playing());
    restore.hidden = !rig || !dismissed;
    document.body.classList.toggle('has-avatar-rail',Boolean(rig && !dismissed && wide.matches));
  }
  function refresh() {
    const active=playing();
    expressionButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.avatarEmotion===selectedEmotion)));
    if(!playButton.disabled){playButton.innerHTML=`${active?pauseIcon:playIcon}<span>${t(active?'pause':'play')}</span>`;playButton.setAttribute('aria-pressed',String(active));}
    audioButton.innerHTML=active?pauseIcon:playIcon;
    audioButton.setAttribute('aria-label',t(active?'avatarPause':'avatarPlay'));audioButton.title=t(active?'pause':'play');
    audioButton.setAttribute('aria-pressed',String(active));
    if(!active||motionPaused){
      mouth=0;form=0;soundLevel=0;
      if(rig)rig.update({...rig.values,ParamMouthOpenY:0,ParamMouthForm:0});
      canvas.dataset.mouth='0.000';canvas.dataset.avatarState='idle';
    }
    visible();frame(performance.now(),true);
  }
  function frame(now, force=false) {
    if(!rig)return;
    if(!force&&motionPaused){lastFrame=now;return;}
    const dt=Math.min(.05,Math.max(0,(now-lastFrame)/1000));
    if(!force&&now-lastFrame<1000/40)return;
    lastFrame=now;
    if(document.hidden||dock.hidden)return;
    const active=playing(), emotion=expression(), moving=!motionPaused;
    if(moving)elapsed+=dt;
    let level=0;
    if(active&&analyser&&waveformData){
      analyser.getByteTimeDomainData(waveformData);
      let sum=0;for(const byte of waveformData){const value=(byte-128)/128;sum+=value*value;}
      level=Math.min(1,Math.max(0,(Math.sqrt(sum/waveformData.length)-.006)*9));
    }
    soundLevel+=(level-soundLevel)*(1-Math.exp(-dt*28));
    const mediaTime=audio.currentTime;
    const cue=active?cueAt(activePlayer.dataset.sample,mediaTime):'X';
    const target=active&&moving?(cue===null?[soundLevel,0]:shape[cue]):shape.X;
    const mix=snapMouth||!active||!moving?1:1-Math.exp(-dt*55);
    mouth+=(target[0]-mouth)*mix;form+=(target[1]-form)*mix;snapMouth=false;
    if(moving&&elapsed>=nextBlink){blinkStart=elapsed;nextBlink=elapsed+2.8+Math.random()*2.5;}
    const phase=elapsed-blinkStart;
    const blink=moving&&phase<.17?Math.max(0,1-Math.sin(Math.PI*phase/.17)):1;
    const trackPointer=moving&&now-pointerAt<2500;
    gazeX+=((trackPointer?pointerX:Math.sin(elapsed*.31)*.15)-gazeX)*(1-Math.exp(-dt*6));
    gazeY+=((trackPointer?pointerY:0)-gazeY)*(1-Math.exp(-dt*6));
    const angleX=moving?(gazeX*8+Math.sin(elapsed*.6)*3):0;
    const angleY=moving?(gazeY*5+Math.sin(elapsed*.9)*2):0;
    // A damped spring lets the hair lag behind the head.
    const hairTarget=angleX/20+Math.sin(elapsed*1.4)*.13;
    hairVelocity+=(hairTarget-hair)*dt*38-hairVelocity*dt*9;
    hair=Math.max(-1,Math.min(1,hair+hairVelocity*dt));
    const brow={joy:.15,anger:-.85,sadness:.65,surprise:.9}[emotion];
    rig.setEmotion(emotion);
    rig.update({ParamAngleX:angleX,ParamAngleY:angleY,ParamAngleZ:moving?Math.sin(elapsed*.45)*6:0,
      ParamEyeLOpen:blink,ParamEyeROpen:blink,ParamEyeBallX:moving?gazeX*.7:0,ParamEyeBallY:moving?gazeY*.6:0,
      ParamMouthOpenY:mouth,ParamMouthForm:form,ParamBreath:moving?(Math.sin(elapsed*1.7)+1)/2:0,
      ParamHairFront:moving?hair*.45:0,ParamHairSide:moving?hair:0,ParamBrowLY:brow,ParamBrowRY:brow});
    rig.draw(canvas,moving?dt:0);
    canvas.dataset.avatarState=mouth>.05?'speaking':blink<.2?'blink':'idle';
    canvas.dataset.avatarExpression=emotion;canvas.dataset.viseme=cue??'amplitude';
    canvas.dataset.lipsync=cue===null?'amplitude-fallback':'timed-visemes';
    canvas.dataset.mouth=mouth.toFixed(3);canvas.dataset.mediaTime=String(mediaTime);
  }
  function animate(now){frame(now);requestAnimationFrame(animate);}
  function toggleAudio(){if(playing()){audio.pause();refresh();}else{const p=activePlayer||document.querySelector('#iroha-player .audio-player');if(p)play(p);}}
  playButton.addEventListener('click',toggleAudio);audioButton.addEventListener('click',toggleAudio);
  expressionButtons.forEach(button=>button.addEventListener('click',()=>{
    const active=playing();stopCurrent();document.getElementById(`emotion-${button.dataset.avatarEmotion}`).click();
    if(active)play(document.querySelector('#iroha-player .audio-player'));refresh();
  }));
  document.getElementById('vtuber-mini-close').addEventListener('click',()=>{dismissed=true;refresh();restore.focus({preventScroll:true});});
  restore.addEventListener('click',()=>{dismissed=false;refresh();audioButton.focus({preventScroll:true});});
  window.addEventListener('pointermove',event=>{pointerX=Math.max(-1,Math.min(1,event.clientX/innerWidth*2-1));pointerY=1-event.clientY/innerHeight*2;pointerAt=performance.now();},{passive:true});
  wide.addEventListener('change',refresh);
  const resizer=new ResizeObserver(()=>{if(rig)rig.draw(canvas);});resizer.observe(canvas);
  for(const event of ['play','playing','pause','ended','emptied','error','waiting'])audio.addEventListener(event,refresh);
  for(const event of ['seeking','seeked','ratechange'])audio.addEventListener(event,()=>{snapMouth=true;refresh();});
  document.addEventListener('visibilitychange',()=>{lastFrame=performance.now();refresh();});
  window.irohaAvatar={refresh,cueAt,get model(){return rig;},get tracks(){return tracks;},get failed(){return failed;}};
  fetch('/blog/research/assets/lipsync.json', {cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error('Missing viseme tracks');return r.json();}).then(data=>{tracks=data.samples;}).catch(error=>console.warn('Viseme tracks unavailable; amplitude fallback:',error.message));
  DafeiyuLive2D.load('/blog/research/assets/dafeiyu/c_0120.model3.json').then(async model=>{await model.attach(canvas);rig=model;refresh();requestAnimationFrame(animate);}).catch(error=>{failed=true;rig=undefined;dock.hidden=true;document.body.classList.remove('has-avatar-rail');console.error('Live2D failed:',error.message);});
  refresh();
})();
