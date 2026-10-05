window.MaxComicIntro = (function () {
  let running=false, inspection=null, recover=null;
  function start(){
    if(running)return;
    running=true;
    run().catch(()=>{if(recover)recover();else{running=false;playTut(0);}});
  }
  async function run(){
  const root=document.createElement('section');root.id='comicIntro';root.classList.add('album-intro');root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label',I18N.t('comic.label'));
  root.innerHTML='<canvas id="comicCanvas" aria-hidden="true"></canvas><div id="comicControls"><button id="comicSkip" type="button"></button><button id="comicStart" type="button" disabled></button></div>';
  document.body.appendChild(root);
  const overlay = document.getElementById('comicIntro'), canvas = document.getElementById('comicCanvas'), g = canvas.getContext('2d');
  const wrap = document.getElementById('wrap'), startButton = document.getElementById('comicStart');
  const skip = document.getElementById('comicSkip');
  const soundOn=!!optSnd;
  skip.textContent=I18N.t('comic.skip');startButton.textContent=I18N.t('comic.loading');
  const listeners=new AbortController(),previousInert=wrap.inert;let frameId=null;
  storyHide();stopGameEffects();skip.focus();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const HOME = 7.8, DOOR = 10.8, FADE = 13.3, BLACK = 14, ROOM = 14.3, LIGHT = ROOM+2.9, END = ROOM+7.7;
  const doorStages = [DOOR, 11.65, 12.4, 12.95];
  const KNOCK = ROOM+1.85, KNOCK2 = ROOM+2.22;
  const cues = [{t:11.05, key:'knock', event:'nudge', volume:.18}, {t:KNOCK, key:'knock'}, {t:KNOCK2, key:'knock'}, {t:LIGHT, key:'light'}];
  const clamp = n => Math.max(0, Math.min(1, n));
  let ready = false, active = true, playing = false, time = 0, last = performance.now(), manual = false;
  let images = null, audioContext = null, token = 0, hooksInstalled = false;
  const buffers = {}, sources = new Set(), fired = new Set(), events = [];
  const originalMax = drawChapterMaxPrototype, originalHand = drawObHand;
  wrap.inert = true;

  function ease(p) {
    p = clamp(p); let lo = 0, hi = 1, u = p;
    for (let i=0; i<14; i++) {u=(lo+hi)/2; const x=3*(1-u)*(1-u)*u*.77+3*(1-u)*u*u*.175+u*u*u; if(x<p)lo=u;else hi=u;}
    return 3*(1-u)*u*u+u*u*u;
  }
  function load(src, fallback) {
    return new Promise((resolve, reject) => {
      let triedFallback = false;
      const image = new Image();
      let timer;
      const fail = error => {
        clearTimeout(timer);
        if (fallback && !triedFallback) {
          triedFallback = true;
          timer = setTimeout(() => reject(error), 8000);
          image.onload = () => { clearTimeout(timer); resolve(image); };
          image.onerror = () => reject(error);
          image.src = new URL(fallback, document.baseURI).href;
          return;
        }
        reject(error);
      };
      timer = setTimeout(() => fail(Error('Image timeout')), 8000);
      image.onload = () => {clearTimeout(timer); resolve(image);};
      image.onerror = () => fail(Error('Image unavailable'));
      image.src = new URL(src, document.baseURI).href;
    });
  }
  const audioBytes = Promise.all(['knock','light'].map(async key => {
    const response = await fetch(`art/onboarding-comic-v1/${key}.wav`,{signal:listeners.signal});
    if (!response.ok) throw Error('Audio unavailable'); return [key, await response.arrayBuffer()];
  })).catch(() => []);
  function silence() {for(const source of sources) {try {source.stop();} catch (_) {}} sources.clear();}
  async function unlockAudio() {
    if (!soundOn) return;
    try {
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        await audioContext.resume();
        for (const [key, bytes] of await audioBytes) buffers[key] = await audioContext.decodeAudioData(bytes.slice(0));
      } else await audioContext.resume();
    } catch (_) { /* The visual knocks also communicate the event without audio. */ }
  }
  function fireCue(cue, index) {
    if (fired.has(index)) return;
    fired.add(index); events.push({key:cue.event||cue.key, time:cue.t});
    if (!soundOn || !audioContext || !buffers[cue.key]) return;
    const source = audioContext.createBufferSource(), gain = audioContext.createGain();
    source.buffer = buffers[cue.key]; gain.gain.value = cue.volume ?? (cue.key === 'knock' ? .65 : .35);
    source.connect(gain); gain.connect(audioContext.destination); sources.add(source);
    source.onended = () => sources.delete(source); source.start();
  }
  // Resume on the title-button gesture, before asynchronous artwork loading.
  unlockAudio();

  // Temporarily change Max's pose, never tutorial rules or saved progress.
  function introMax(x, y, s) {
    if (!active || !images) return originalMax(x,y,s);
    let image = images[4], frame = 7, jump = 0;
    if (time >= LIGHT) {
      image = images[3];
      frame = time < LIGHT+.55 ? 5 : Math.max(0, 5-Math.floor((time-LIGHT-.55)*12));
      if (!reduced && time < LIGHT+.5) jump = Math.sin(clamp((time-LIGHT)/.5)*Math.PI)*s*.2;
    }
    const size = s*chapterMaxMasterDrawScale(), ground = y+s*chapterMaxMasterGroundOffset();
    const blend = clamp((time-(END-.6))/.35);
    if (blend > 0) {ctx.save(); ctx.globalAlpha *= blend; originalMax(x,y,s); ctx.restore();}
    ctx.save(); ctx.globalAlpha *= 1-blend;
    ctx.drawImage(image, frame*256, 0, 256, 256, x-size/2, ground-size*232/256-jump, size, size);
    ctx.restore(); return true;
  }
  function introHand() {if (!active) originalHand();}
  function installHooks() {if(hooksInstalled)return; drawChapterMaxPrototype=introMax; drawObHand=introHand; hooksInstalled=true;}
  function restoreHooks() {
    if (!hooksInstalled) return;
    if(drawChapterMaxPrototype===introMax)drawChapterMaxPrototype=originalMax;
    if(drawObHand===introHand)drawObHand=originalHand;
    hooksInstalled=false;
  }
  function resetRoom() {
    playTut(0); tutClearTO();
    document.getElementById('toast').classList.remove('show');
    render();
  }
  function enter() {
    if (!active) return;
    playing=false; active=false; silence(); restoreHooks();listeners.abort();
    if(frameId!==null)cancelAnimationFrame(frameId);
    if(audioContext)audioContext.close().catch(()=>{});
    const id=++token;
    playTut(0); render(); wrap.inert=previousInert;
    skip.hidden=true; startButton.hidden=true;
    window.comicIntroPhase='tutorial';
    recover=null;
    const remove=()=>{if(token===id){
      overlay.remove();images=null;canvas.width=1;canvas.height=1;
      for(const key of Object.keys(buffers))delete buffers[key];
      running=false;el('undo')?.focus({preventScroll:true});
    }};
    if (!manual && !reduced && images) {
      overlay.animate([{opacity:1},{opacity:0}], {duration:250,easing:'cubic-bezier(0.23, 1, 0.32, 1)'})
        .finished.then(remove).catch(remove);
    } else remove();
  }
  recover=enter;
  function reset() {
    token++; for(const a of overlay.getAnimations())a.cancel(); silence();
    active=true; playing=false; manual=false; time=0; fired.clear(); events.length=0;
    overlay.hidden=false; wrap.inert=true; skip.hidden=false;
    startButton.hidden=false; installHooks(); resetRoom(); draw();
  }
  async function start() {
    if(!ready || !images)return;
    if(!active)reset();
    const id=token;
    await unlockAudio();
    if(id!==token || !active)return;
    manual=false; playing=true; last=performance.now(); startButton.hidden=true;
  }
  skip.onclick=enter;
  startButton.onclick=start;
  overlay.addEventListener('pointerdown',e=>e.stopPropagation(),{signal:listeners.signal});
  overlay.addEventListener('pointerup',e=>e.stopPropagation(),{signal:listeners.signal});
  window.addEventListener('keydown', e=>{
    if(!active)return;
    if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();enter();return;}
    if(e.target instanceof Element && e.target.closest('#comicControls') && [' ','Enter','Tab'].includes(e.key))return;
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d',' '].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();}
  },{capture:true,signal:listeners.signal});

  function lines(text, maxWidth) {
    const result=[];let line='';
    for(const word of text.split(' ')) {const next=line?line+' '+word:word;if(g.measureText(next).width>maxWidth&&line){result.push(line);line=word;}else line=next;}
    if(line)result.push(line);return result;
  }
  function caption(text, x, y, width, fontSize=20, color='#34402d', background='rgba(255,253,242,.96)') {
    g.font=`${fontSize}px Jua, sans-serif`;g.textAlign='center';g.textBaseline='middle';
    const textLines=lines(text,width-28), height=textLines.length*(fontSize+6)+22;
    g.fillStyle=background;g.beginPath();g.roundRect(x-width/2,y-height/2,width,height,5);g.fill();
    g.fillStyle=color;textLines.forEach((line,i)=>g.fillText(line,x,y+(i-(textLines.length-1)/2)*(fontSize+6)));
    return {x:x-width/2,y:y-height/2,width,height};
  }
  function page(index, x, w, h) {
    const frameW=Math.min(w,h*2/3), left=(w-frameW)/2+x;
    // Keep the authored scene untouched; the album treatment lives in the paper gutter.
    g.fillStyle='#e8dfc9';g.fillRect(0,0,w,h);
    g.save();g.shadowColor='rgba(72,54,32,.22)';g.shadowBlur=18;g.shadowOffsetY=5;g.fillStyle='#fffaf0';g.fillRect(left-13,8,frameW+26,h-16);g.restore();
    g.strokeStyle='rgba(185,151,95,.62)';g.lineWidth=1.4;g.setLineDash([7,5]);g.strokeRect(left-5,16,frameW+10,h-32);g.setLineDash([]);
    g.fillStyle='#f9fcf3';g.fillRect(left,0,frameW,h);
    g.fillStyle='rgba(255,255,255,.72)';g.beginPath();g.moveTo(left-13,8);g.lineTo(left+24,8);g.lineTo(left-13,45);g.closePath();g.fill();
    g.fillStyle='rgba(214,198,163,.52)';g.beginPath();g.moveTo(left+frameW+13,h-8);g.lineTo(left+frameW-24,h-8);g.lineTo(left+frameW+13,h-45);g.closePath();g.fill();
    const stage = index===4 ? Math.max(0,doorStages.findLastIndex(t=>time>=t)) : 0;
    const margin=8, iw=frameW-margin*2, ih=h-148, image=images[index===4?6+stage:index===3?5:index];
    // Keep the full authored panel visible, with the caption in its own paper gutter.
    const scale=Math.min(iw/image.width,ih/image.height);
    const imageX=left+frameW/2-image.width*scale/2, imageY=margin+(ih-image.height*scale)/2;
    const blend = index===4 && stage>0 && !reduced ? clamp((time-doorStages[stage])/.14) : 1;
    if(blend<1)g.drawImage(images[5+stage],imageX,imageY,image.width*scale,image.height*scale);
    g.save();g.globalAlpha*=blend;g.drawImage(image,imageX,imageY,image.width*scale,image.height*scale);g.restore();
    if(index===4)window.comicDoorStage=['nudge','enter','tail','empty'][stage];
    window.comicPanelBounds={x:imageX,y:imageY,width:image.width*scale,height:image.height*scale};
    const captions=[1,2,3,4,5].map(n=>I18N.t('comic.page'+n));
    caption(captions[index],left+frameW/2,h-108,Math.min(frameW-36,352));
  }
  function room(w,h) {
    render();
    const rect=cv.getBoundingClientRect();
    g.fillStyle='#bde3f6';g.fillRect(0,0,w,h);
    const bg=g.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#8eceeb');bg.addColorStop(1,'#dcefd0');
    const game=document.getElementById('wrap').getBoundingClientRect();g.fillStyle=bg;g.fillRect(game.left,0,game.width,h);
    g.drawImage(cv,rect.left,rect.top,rect.width,rect.height);
    let darkness=time<LIGHT ? .82 : .82*(1-clamp((time-LIGHT)/.28));
    if(reduced && time>=LIGHT)darkness=0;
    g.fillStyle=`rgba(12,20,31,${darkness})`;g.fillRect(0,0,w,h);
    const baseX=rect.left+rect.width/2, doorY=rect.top+rect.height*.8;
    if(time<ROOM+1.5)caption(I18N.t('comic.rest'),w/2,h-108,Math.min(w-36,320),20,'#fffdf5','rgba(20,33,41,.9)');
    if(time>=KNOCK && time<LIGHT-.15) {
      const n=time<KNOCK2?0:1, age=time-(n?KNOCK2:KNOCK);
      g.save();g.globalAlpha=1-clamp((age-.28)/.3);
      const by=Math.min(h-110,doorY+15);
      caption(I18N.t(n?'comic.knock2':'comic.knock1'),baseX,by,120,24,'#fff8de','rgba(42,42,39,.9)');g.restore();
    }
    if(time>=LIGHT && time<LIGHT+.6) {
      const px=rect.left+(cx(dog.cc)/cv.width)*rect.width;
      const py=rect.top+((cy(dog.rr)+houseTop)/cv.height)*rect.height;
      g.font='30px Jua, sans-serif';g.textAlign='center';g.fillStyle='#785425';g.fillText('!',px+28,py-45);
    }
    if(time>=LIGHT+.7 && time<LIGHT+2.55)caption(I18N.t('comic.walk'),w/2,Math.max(105,rect.top-35),Math.min(w-36,330),24);
    if(time>=LIGHT+2.55 && time<END-.35)caption(I18N.t('comic.toy'),w/2,Math.max(105,rect.top-35),Math.min(w-36,330),22);
    window.comicRoomDarkness=darkness;
  }
  function draw() {
    if(!images || !active)return;
    const r=canvas.getBoundingClientRect(), d=Math.min(devicePixelRatio||1,2);
    if(canvas.width!==Math.round(r.width*d)||canvas.height!==Math.round(r.height*d)){canvas.width=Math.round(r.width*d);canvas.height=Math.round(r.height*d);}
    const w=r.width,h=r.height;g.setTransform(d,0,0,d,0,0);g.fillStyle='#20382b';g.fillRect(0,0,w,h);
    if(time<ROOM) {
      const index=time>=DOOR?4:time>=HOME?3:Math.min(2,Math.floor(time/2.6)), local=time-(index===4?DOOR:index*2.6);
      const progress=index&&local<.35?ease(local/.35):1;
      if(progress<1 && !reduced){page(index-1,0,w,h);g.save();g.globalAlpha=progress;page(index,0,w,h);g.restore();}
      else page(index,0,w,h);
      const fade=clamp((time-FADE)/(BLACK-FADE));
      if(fade>0){g.fillStyle=`rgba(0,0,0,${fade})`;g.fillRect(0,0,w,h);}
      window.comicFade=fade;
      window.comicIntroPhase=time>=BLACK?'blackout':['farm','guard','sleepy','homeward','door'][index];
    } else {
      room(w,h);
      const fade=1-clamp((time-ROOM)/.4);
      if(fade>0){g.fillStyle=`rgba(0,0,0,${fade})`;g.fillRect(0,0,w,h);}
      window.comicFade=fade;
      window.comicIntroPhase=time<KNOCK?'dark':time<LIGHT?'knock':time<LIGHT+.7?'surprise':'invitation';
    }
  }
  inspection={
    start,
    seek(t){if(!ready||!images||!active)return;playing=false;manual=true;time=t;startButton.hidden=true;if(t>=END)enter();else draw();},
    status:()=>({ready,active,playing,time,reduced,events:[...events],hooksInstalled,audioReady:!!buffers.knock&&!!buffers.light,audioState:audioContext?.state||'unavailable'}),
    skip:enter
  };
  const safeLoad=(src,fallback)=>load(src).catch(()=>load(fallback));
  images=await Promise.all([
    safeLoad('art/onboarding-comic-v3/page-01.webp','art/onboarding-comic-v3/page-01.webp'),safeLoad('art/onboarding-comic-v3/page-02.webp','art/onboarding-comic-v3/page-01.webp'),safeLoad('art/onboarding-comic-v3/page-03.webp','art/onboarding-comic-v3/page-01.webp'),
    load('art/max-master/motions/canonical/max-sit-master-v1-front-8f-blink.avif','art/max-master/motions/canonical/max-sit-master-v1-front-8f-blink.png'),load('art/max-master/motions/canonical/max-sit-to-sleep-master-v3-down-8f.png'),
    safeLoad('art/onboarding-comic-v3/page-04.webp','art/onboarding-comic-v3/page-01.webp'),
    safeLoad('art/onboarding-comic-v4/door-01.webp','art/onboarding-comic-v4/door-01.webp'),safeLoad('art/onboarding-comic-v4/door-02.webp','art/onboarding-comic-v4/door-01.webp'),
    safeLoad('art/onboarding-comic-v4/door-03.webp','art/onboarding-comic-v4/door-01.webp'),safeLoad('art/onboarding-comic-v4/door-04.webp','art/onboarding-comic-v4/door-01.webp')
  ]).catch(()=>null);
  if(!active){images=null;return;}
  // A failed boot poster can leave the loading node in the DOM with a retry button.
  // Do not let that unrelated failure hold the intro forever.
  const bootWaitStart=performance.now();
  while(document.getElementById('bootLoading') && !document.getElementById('bootLoading').hidden && performance.now()-bootWaitStart<5000)
    await new Promise(resolve=>setTimeout(resolve,50));
  await document.fonts.ready;
  if(!active)return;
  ready=true;startButton.disabled=false;startButton.textContent=I18N.t('comic.start');
  if(!images){enter();return;}
  installHooks();resetRoom();draw();
  document.addEventListener('visibilitychange',()=>{last=performance.now();if(document.hidden)silence();},{signal:listeners.signal});
  function tick(now) {
    const dt=Math.max(0,Math.min(.1,(now-last)/1000));last=now;   // rAF time can trail performance.now() on the first frame — a negative step put time below 0 and asked for page -1
    if(active && playing && !document.hidden){time+=dt;cues.forEach((cue,i)=>{if(time>=cue.t)fireCue(cue,i);});if(time>=END)enter();}
    if(active){draw();frameId=requestAnimationFrame(tick);}
  }
  frameId=requestAnimationFrame(tick);
  // Slow or unavailable audio must never hold up the visual story.
  manual=false;playing=true;last=performance.now();startButton.hidden=true;
  }
  return {start,status:()=>inspection?.status()||{active:false,ready:false},seek:t=>inspection?.seek(t),skip:()=>inspection?.skip()};
})();
