// Local, disposable playtest; uses the production board renderer and movement rules.
if (GOAL_FEEL_QA && new URLSearchParams(location.search).get('corejoy')==='1') {
  const pack=CoreJoyLevels;
  const toolbox=GrandpaTools;
  let chosen=0, completed=new Set(), hintKey='', hintDepth=0, toolMode=false, toolChoice=0, toolUsed=false, toolArmed=false, toolRunning=false, toolStep=0;
  const panel=document.createElement('section');
  panel.id='coreJoyPanel';
  panel.innerHTML='<small id="joyGroup"></small><nav aria-label="테스트 판 선택">'+pack.levels.map((l,i)=>'<button aria-label="'+(i+1)+'판 '+l.title+'" data-case="'+i+'">'+(i+1)+'</button>').join('')+'</nav><button id="joyTools" class="joyTools">할아버지의 도구 상자 시안</button><div id="joyToolCards">'+toolbox.demos.map((d,i)=>{const t=toolbox.tools[d.tool];return '<button class="joyToolCard" data-tool="'+i+'"><i style="--tool:'+t.color+'"><img src="'+t.icon+'" alt=""></i><span><b>'+t.name+'</b><small>'+t.short+'</small></span></button>';}).join('')+'</div><b id="joyTitle"></b><p id="joyHint" aria-live="polite"></p><div><button id="joyUseTool" hidden></button><button id="joyUndo">한 수 무르기</button><button id="joyReset">다시 하기</button><button id="joyHintBtn">생각 힌트</button><button id="joyNext">다음 판</button></div><div class="joyArrows"><button aria-label="위로 이동" data-dir="-1,0">↑</button><button aria-label="왼쪽으로 이동" data-dir="0,-1">←</button><button aria-label="아래로 이동" data-dir="1,0">↓</button><button aria-label="오른쪽으로 이동" data-dir="0,1">→</button></div><small id="joyStatus" aria-live="polite"></small>';
  const style=document.createElement('style');
  style.textContent='#coreJoyPanel{position:fixed;bottom:8px;left:50%;transform:translateX(-50%);width:min(94vw,430px);z-index:9999;background:#fff9f0f5;border:1px solid #d6bc8f;border-radius:18px;padding:10px;text-align:center;color:#513b28;font-family:var(--f-hand),sans-serif;box-shadow:0 3px 16px #46361b22}#coreJoyPanel p{margin:5px 0;font-size:13px}#coreJoyPanel button{font:inherit;margin:2px;border:0;border-radius:9px;padding:7px 12px;background:#e8eecf;color:#513b28;cursor:pointer}#coreJoyPanel button[aria-current=true]{background:#edb74e}#coreJoyPanel small{display:block;font-size:11px;margin-top:4px}#coreJoyPanel nav{display:inline-block;margin-right:8px}body.corejoy #dock,body.corejoy #hint,body.corejoy #hudCur,body.corejoy #goalFeelQaPanel{display:none!important}';
  style.textContent+='body.corejoy #goalFeelQA,body.corejoy #mvhead,body.corejoy .mvhead{display:none!important}';
  style.textContent+='body.corejoy #mvbar,body.corejoy #helpbtn,body.corejoy #exitbtn{display:none!important}body.corejoy #boardWrap{position:fixed!important;top:64px;bottom:240px;left:50%;transform:translateX(-50%)!important;width:min(94vw,440px);height:auto!important;padding:0!important}#coreJoyPanel{box-sizing:border-box;padding:8px}#coreJoyPanel nav{display:grid;grid-template-columns:repeat(10,1fr);gap:3px;margin:4px 0 6px}#coreJoyPanel nav button{padding:6px 0;margin:0;font-size:13px}#coreJoyPanel button{padding:7px 9px;font-size:13px}#coreJoyPanel button:disabled{opacity:.45;cursor:default}#coreJoyPanel [data-done=true]{box-shadow:inset 0 -3px #7ba369}#joyGroup{color:#737d55}#joyHint{min-height:30px;line-height:1.3}.joyTools{display:block;margin:2px auto 5px!important;background:#fff0cf!important;border:1px solid #d9aa67!important}.joyToolCard{width:31%;vertical-align:top;text-align:left!important;padding:6px!important;background:#fffdf6!important;border:1px solid #d8c7a5!important}.joyToolCard i{display:inline-flex;width:22px;height:22px;margin-right:4px;align-items:center;justify-content:center;border-radius:50%;background:var(--tool);color:#fff;font-style:normal;font-size:12px;font-weight:900}.joyToolCard span{display:inline-block;vertical-align:middle}.joyToolCard b,.joyToolCard small{display:block;font-size:10px;line-height:1.1}.joyToolCard small{color:#7f715f;margin-top:2px}.joyToolCard[aria-current=true]{border-color:#bd8750;box-shadow:0 0 0 2px #f2d19a}.joyToolCard[hidden],#joyToolCards[hidden]{display:none!important}#joyUseTool{background:#e6b45c!important;color:#513b28!important}#joyTargetLayer{position:absolute;inset:0;z-index:20;pointer-events:none}#joyTargetTile{position:absolute;box-sizing:border-box;margin:0!important;padding:0!important;border:3px solid #f7cf65!important;border-radius:14px!important;background:#fff3a866!important;box-shadow:0 0 0 4px #ffffff80,0 0 18px #f7cb55!important;pointer-events:auto!important;animation:joyTargetPulse 1s ease-in-out infinite}#joyTargetTile:after{content:"";display:block;width:11px;height:11px;margin:auto;border-radius:50%;background:#fff9db;box-shadow:0 0 8px #fff}@keyframes joyTargetPulse{50%{transform:scale(.9);box-shadow:0 0 0 8px #ffffff55,0 0 25px #f7cb55}}.joyToolFx{position:absolute;z-index:21;pointer-events:none;transform:translate(-50%,-50%);font-size:38px;line-height:1;text-shadow:0 2px 2px #fff9;animation:joyToolFx .42s cubic-bezier(.2,.8,.2,1) both}.joyTravelFx{position:absolute;z-index:21;pointer-events:none;transform:translate(-50%,-50%);font-size:36px;line-height:1;animation:joyTravelFx .62s cubic-bezier(.2,.8,.2,1) both}.joyBurrowFx{position:absolute;z-index:21;pointer-events:none;width:56%;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 50% 36%,#7a5134 0 27%,#4d3327 30% 54%,#c28a55 57% 65%,transparent 68%);transform:translate(-50%,-50%);animation:joyBurrowFx .7s ease-in-out both}.joyDustFx{position:absolute;z-index:22;pointer-events:none;font-size:24px;transform:translate(-50%,-50%);animation:joyDustFx .43s ease-out both}@keyframes joyToolFx{0%{opacity:0;transform:translate(-50%,-30%) scale(.4) rotate(-18deg)}45%{opacity:1;transform:translate(-50%,-70%) scale(1.25) rotate(8deg)}100%{opacity:0;transform:translate(-50%,-105%) scale(.75) rotate(18deg)}}@keyframes joyTravelFx{0%{opacity:0;transform:translate(-50%,-50%) scale(.55)}18%{opacity:1;transform:translate(-50%,-68%) scale(1.05)}86%{opacity:1;transform:translate(calc(-50% + var(--travel-x)),calc(-50% + var(--travel-y) - 12px)) scale(1.08)}100%{opacity:0;transform:translate(calc(-50% + var(--travel-x)),calc(-50% + var(--travel-y))) scale(.72)}}@keyframes joyBurrowFx{0%{opacity:0;transform:translate(-50%,-50%) scale(.35)}45%{opacity:1;transform:translate(-50%,-50%) scale(1.1)}100%{opacity:.75;transform:translate(-50%,-50%) scale(.82)}}@keyframes joyDustFx{0%{opacity:0;transform:translate(-50%,-25%) scale(.45)}45%{opacity:1;transform:translate(-50%,-95%) scale(1.22)}100%{opacity:0;transform:translate(-50%,-145%) scale(.8)}}';
  style.textContent+='#joyToolCards img{width:26px;height:26px;display:block;filter:drop-shadow(0 1px 1px #563b2522)}#joyTargetTile{border-radius:50%!important;background:radial-gradient(circle,#fff8d5 0 22%,#f4c65d88 24% 58%,#f4c65d15 60%)!important;box-shadow:0 0 0 3px #fff8d7,0 0 0 7px #f4c65d60,0 0 20px #f4c65d!important}#joyTargetTile:before{content:"";position:absolute;inset:14%;border:2px dashed #c88932;border-radius:50%;animation:joyTargetSpin 2.2s linear infinite}@keyframes joyTargetSpin{to{transform:rotate(360deg)}}.joyGloveFx{width:30px;height:29px;border-radius:13px 13px 10px 10px;background:linear-gradient(145deg,#fffdf4 8%,#e8ddcd 65%,#bda98d);box-shadow:0 3px 5px #5d412b45}.joyGloveFx:before{content:"";position:absolute;width:10px;height:22px;left:2px;top:-10px;border-radius:8px;background:#f8f1e5;box-shadow:8px -5px #fffdf4,16px -2px #f3ebde}.joyGloveFx:after{content:"";position:absolute;width:24px;height:8px;left:3px;bottom:-5px;border-radius:4px;background:#d9a969}.joyGloveFx.joyToolFx{animation:joyGloveLift .42s cubic-bezier(.2,.8,.2,1) both}.joyGloveFx.joyTravelFx{animation:joyGloveTravel .65s cubic-bezier(.2,.8,.2,1) both}@keyframes joyGloveLift{0%{opacity:0;transform:translate(-50%,-20%) rotate(-30deg) scale(.7)}45%{opacity:1;transform:translate(-50%,-90%) rotate(8deg) scale(1.05)}100%{opacity:0;transform:translate(-50%,-130%) rotate(18deg) scale(.85)}}@keyframes joyGloveTravel{0%{opacity:0;transform:translate(-50%,-30%) rotate(-22deg) scale(.7)}14%{opacity:1;transform:translate(-50%,-75%) rotate(3deg) scale(1.05)}84%{opacity:1;transform:translate(calc(-50% + var(--travel-x)),calc(-50% + var(--travel-y) - 14px)) rotate(8deg) scale(1.03)}100%{opacity:0;transform:translate(calc(-50% + var(--travel-x)),calc(-50% + var(--travel-y))) rotate(20deg) scale(.78)}}.joySpadeFx{width:10px;height:38px;border-radius:7px;background:linear-gradient(90deg,#a8703e,#dfb871 48%,#875431);box-shadow:0 2px 3px #56351e55}.joySpadeFx:before{content:"";position:absolute;left:-8px;bottom:-7px;width:26px;height:20px;border-radius:50% 50% 72% 72%;background:linear-gradient(145deg,#e8d7be,#a78364);clip-path:polygon(50% 100%,0 0,100% 0)}.joySpadeFx:after{content:"";position:absolute;left:-5px;top:-8px;width:20px;height:13px;border-radius:10px;border:5px solid #a36b3c;box-sizing:border-box}.joySpadeFx.joyToolFx{animation:joySpadeDig .42s ease-in both}@keyframes joySpadeDig{0%{opacity:0;transform:translate(-50%,-100%) rotate(35deg)}55%{opacity:1;transform:translate(-50%,-45%) rotate(-15deg)}100%{opacity:0;transform:translate(-50%,0) rotate(18deg)}}.joyScissorFx{width:28px;height:22px;border-radius:50%;background:radial-gradient(circle,#d78a69 0 13%,transparent 15%);filter:drop-shadow(0 2px 2px #65422c55);animation:joyScissorSnip .48s ease-in both}.joyScissorFx:before,.joyScissorFx:after{content:"";position:absolute;width:26px;height:7px;left:1px;top:8px;border-radius:7px;background:linear-gradient(90deg,#f7f1df,#a9a6a0);transform-origin:2px 50%}.joyScissorFx:before{transform:rotate(28deg)}.joyScissorFx:after{transform:rotate(-28deg)}@keyframes joyScissorSnip{0%{opacity:0;transform:translate(-50%,-100%) scale(.55)}45%{opacity:1;transform:translate(-50%,-64%) scale(1.08)}72%{opacity:1;transform:translate(-50%,-54%) scale(.88)}100%{opacity:0;transform:translate(-50%,-38%) scale(.7)}}.joyLandingFx{width:40px;height:22px;border:3px solid #f8da80;border-top:0;border-radius:0 0 50% 50%;opacity:0;animation:joyLand .48s ease-out both}.joyDirtBurst{width:42px;height:34px;border-radius:50%;background:radial-gradient(ellipse at 50% 100%,#9b663d 0 22%,#c88e58 24% 42%,transparent 44%);animation:joyDirtBurst .48s ease-out both}.joyDirtBurst:before,.joyDirtBurst:after{content:"";position:absolute;width:8px;height:8px;border-radius:50%;background:#bd8050;top:6px;left:4px;box-shadow:28px 3px #9e6239,15px -9px #d6a169}.joyDirtBurst:after{left:12px;top:14px;width:5px;height:5px;background:#815035;box-shadow:18px -13px #a66c40,28px 8px #d9a977}@keyframes joyLand{0%{opacity:0;transform:translate(-50%,-50%) scale(.4)}55%{opacity:1;transform:translate(-50%,-50%) scale(1.2)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.55)}}@keyframes joyDirtBurst{0%{opacity:0;transform:translate(-50%,0) scale(.45)}48%{opacity:1;transform:translate(-50%,-62%) scale(1.12)}100%{opacity:0;transform:translate(-50%,-125%) scale(.72)}}.joyTunnelTrail{position:absolute;z-index:20;height:10px;border-radius:8px;background:repeating-linear-gradient(90deg,#c58a51 0 8px,#efd4a0 8px 14px);box-shadow:0 1px 0 #75492c55;transform-origin:0 50%;animation:joyTrail .62s ease-in-out both}@keyframes joyTrail{0%{opacity:0;clip-path:inset(0 100% 0 0)}35%{opacity:.9;clip-path:inset(0 0 0 0)}75%{opacity:.85}100%{opacity:0;clip-path:inset(0 0 0 100%)}}';
  document.head.appendChild(style);document.body.appendChild(panel);document.body.classList.add('corejoy');
  const targetLayer=document.createElement('div');targetLayer.id='joyTargetLayer';el('boardWrap').appendChild(targetLayer);
  function clearToolTarget(){targetLayer.innerHTML='';}
  function toolPrompt(demo,phase){
    if(demo.tool==='glove')return phase===0?'옮길 공을 골라주세요.':'공을 내려놓을 반짝이는 빈칸을 골라주세요.';
    if(demo.tool==='tunnel')return phase===0?'파고 들어갈 수풀을 골라주세요.':'맥스가 나올 반대편 빈칸을 골라주세요.';
    return '자를 수풀을 골라주세요.';
  }
  function tilePoint(r,c){
    const wrap=el('boardWrap').getBoundingClientRect(),canvas=cv.getBoundingClientRect();
    return {x:canvas.left-wrap.left+(c+.5)*cell,y:canvas.top-wrap.top+(r+.5)*cell};
  }
  function addToolFx(className,r,c,text){
    const p=tilePoint(r,c),fx=document.createElement('i');fx.className=className;fx.textContent=text||'';
    fx.style.left=p.x+'px';fx.style.top=p.y+'px';
    if(className.includes('joyBurrowFx')){fx.style.width=(cell*.62)+'px';fx.style.height=(cell*.62)+'px';}
    targetLayer.appendChild(fx);return fx;
  }
  function addTunnelTrail(r0,c0,r1,c1){
    const a=tilePoint(r0,c0),b=tilePoint(r1,c1),dx=b.x-a.x,dy=b.y-a.y;
    const trail=document.createElement('i');trail.className='joyTunnelTrail';trail.style.left=a.x+'px';trail.style.top=a.y+'px';
    trail.style.width=Math.hypot(dx,dy)+'px';trail.style.transform='translateY(-50%) rotate('+Math.atan2(dy,dx)+'rad)';targetLayer.appendChild(trail);return trail;
  }
  function drawToolTarget(){
    clearToolTarget();
    if(!toolMode||!toolArmed||toolUsed||toolRunning||state!=='play')return;
    const demo=toolbox.demos[toolChoice],[r,c]=toolbox.targetFor(demo,undefined,undefined,toolStep);
    const wrap=el('boardWrap').getBoundingClientRect(),canvas=cv.getBoundingClientRect();
    const target=document.createElement('button');target.id='joyTargetTile';target.type='button';
    target.setAttribute('aria-label',toolPrompt(demo,toolStep));
    target.style.left=(canvas.left-wrap.left+c*cell)+'px';target.style.top=(canvas.top-wrap.top+r*cell)+'px';
    target.style.width=cell+'px';target.style.height=cell+'px';
    target.onclick=()=>useToolAt(r,c);targetLayer.appendChild(target);
  }
  function layout(){
    const height=panel.getBoundingClientRect().height;
    if(height>0)el('boardWrap').style.bottom=(height+20)+'px';
    fit();
    drawToolTarget();
  }
  if(typeof ResizeObserver!=='undefined')new ResizeObserver(layout).observe(panel);
  function refreshProgress(){
    panel.querySelectorAll('[data-case]').forEach(b=>{
      b.setAttribute('aria-current',Number(b.dataset.case)===chosen);
      b.setAttribute('data-done',completed.has(Number(b.dataset.case)));
    });
  }
  function resetToolCards(){
    el('joyToolCards').hidden=!toolMode;
    el('joyTools').textContent=toolMode?'퍼즐 10판으로 돌아가기':'할아버지의 도구 상자 시안';
    panel.querySelectorAll('[data-tool]').forEach(b=>b.setAttribute('aria-current',toolMode&&Number(b.dataset.tool)===toolChoice));
  }
  function enter(i){
    toolMode=false;toolArmed=false;toolRunning=false;toolStep=0;clearToolTarget();chosen=Math.max(0,Math.min(pack.levels.length-1,i|0)); const spec=pack.levels[chosen];hintKey='';hintDepth=0;
    loadLevel(1); goalFeelToy=spec.toy; tutMode=false;
    applyScene(fromBaked(pack.baked(spec))); stepBonus=999; acornSt=[];
    gintroOn=false;coachSteps=null;noteOn=false;el('gintro').classList.remove('show');giSeen.base=1;
    el('coach').classList.remove('show'); el('win').classList.remove('show');
    el('joyTitle').textContent=spec.title;el('joyHint').textContent=spec.hint;
    el('joyGroup').textContent=(chosen+1)+' / '+pack.levels.length+' · '+spec.group;
    el('joyHintBtn').textContent='생각 힌트';el('joyNext').disabled=true;
    el('joyStatus').textContent='제한·비용 없는 체험 · 방향키 / 스와이프 / 화살표';
    moveBuffer=null;menuMode=false;el('lvl').textContent='체험';
    resetToolCards();refreshProgress();layout();syncMoves();
  }
  function enterTool(i){
    toolMode=true;toolChoice=Math.max(0,Math.min(toolbox.demos.length-1,i|0));toolUsed=false;toolArmed=false;toolRunning=false;toolStep=0;clearToolTarget();hintKey='';hintDepth=0;
    const demo=toolbox.demos[toolChoice], tool=toolbox.tools[demo.tool];
    loadLevel(1);goalFeelToy='bunny';tutMode=false;
    applyScene(fromBaked(toolbox.baked(demo)));stepBonus=999;acornSt=[];
    gintroOn=false;coachSteps=null;noteOn=false;el('gintro').classList.remove('show');giSeen.base=1;
    el('coach').classList.remove('show');el('win').classList.remove('show');moveBuffer=null;menuMode=false;el('lvl').textContent='도구';
    el('joyGroup').textContent='도구 시안 '+(toolChoice+1)+' / '+toolbox.demos.length;
    el('joyTitle').textContent=demo.title;el('joyHint').textContent=demo.hint;
    el('joyStatus').textContent=tool.story+' '+tool.effect;
    el('joyUseTool').hidden=false;el('joyUseTool').disabled=false;el('joyUseTool').textContent=tool.name+' 사용하기';
    el('joyHintBtn').hidden=true;el('joyNext').hidden=true;el('joyUndo').hidden=true;
    resetToolCards();refreshProgress();layout();syncMoves();
  }
  function armTool(){
    if(!toolMode||toolUsed||toolRunning||state!=='play'||isAnimating())return;
    toolArmed=true;toolStep=0;el('joyUseTool').disabled=true;el('joyUseTool').textContent='반짝이는 타일을 눌러주세요';
    const demo=toolbox.demos[toolChoice];el('joyHint').textContent=toolPrompt(demo,toolStep);drawToolTarget();
  }
  function useToolAt(r,c){
    if(!toolMode||!toolArmed||toolUsed||toolRunning||state!=='play'||isAnimating())return;
    const demo=toolbox.demos[toolChoice],tool=toolbox.tools[demo.tool];
    if(!toolbox.targetFor(demo,r,c,toolStep))return;
    const steps=toolbox.targetsFor(demo);
    if(toolStep<steps.length-1){
      toolRunning=true;clearToolTarget();
      const fx=addToolFx((demo.tool==='tunnel'?'joySpadeFx ':'joyGloveFx ')+'joyToolFx',r,c);
      el('joyHint').textContent=demo.tool==='tunnel'?'수풀 아래에 작은 땅굴을 팠어요.':'장갑이 공을 폭신하게 들어 올렸어요.';
      setTimeout(()=>{fx.remove();toolStep++;toolRunning=false;el('joyHint').textContent=toolPrompt(demo,toolStep);drawToolTarget();},420);
      return;
    }
    toolArmed=false;toolRunning=true;clearToolTarget();el('joyHint').textContent=tool.name+'을(를) 쓰는 중…';
    if(demo.tool==='glove'){
      const [fr,fc]=toolbox.targetFor(demo),p0=tilePoint(fr,fc),p1=tilePoint(r,c);
      const fx=addToolFx('joyGloveFx joyTravelFx',fr,fc);fx.style.setProperty('--travel-x',(p1.x-p0.x)+'px');fx.style.setProperty('--travel-y',(p1.y-p0.y)+'px');
      const landing=addToolFx('joyLandingFx',r,c);setTimeout(()=>landing.remove(),490);
      setTimeout(()=>{fx.remove();commitTool(demo,tool);},650);
    } else if(demo.tool==='tunnel'){
      const [br,bc]=toolbox.targetFor(demo),hole=addToolFx('joyBurrowFx',br,bc),shovel=addToolFx('joySpadeFx joyToolFx',br,bc),trail=addTunnelTrail(br,bc,r,c);
      setTimeout(()=>{shovel.remove();addToolFx('joyDirtBurst',r,c);},260);
      setTimeout(()=>{hole.remove();trail.remove();commitTool(demo,tool);},700);
    } else {
      const fx=addToolFx('joyScissorFx',r,c);const leaves=addToolFx('joyDirtBurst',r,c);leaves.style.filter='hue-rotate(75deg)';
      setTimeout(()=>{fx.remove();leaves.remove();commitTool(demo,tool);},480);
    }
  }
  function commitTool(demo,tool){
    if(!toolMode||toolUsed)return;
    if(demo.tool==='glove'){
      const b=boxes.find(x=>x.r===demo.from[0]&&x.c===demo.from[1]);if(!b)return;
      b.r=demo.to[0];b.c=demo.to[1];b.rr=b.r;b.cc=b.c;b.landT=.16;
    } else if(demo.tool==='scissors'){
      L.T[demo.cut[0]][demo.cut[1]]=GRASS;
    } else if(demo.tool==='tunnel'){
      dog.r=demo.to[0];dog.c=demo.to[1];dog.rr=dog.r;dog.cc=dog.c;dog.hop=.7;
    }
    toolUsed=true;toolRunning=false;el('joyUseTool').disabled=true;el('joyUseTool').textContent='사용 완료';
    el('joyHint').textContent=tool.action;el('joyStatus').textContent='도구는 한 번만 사용했어요. 이제 열린 공간을 직접 활용해보세요.';
    render();
  }
  // Keep the finished scene visible; do not grant rewards or open the production win card.
  win=function(){
    state='win';winT=0;moveBuffer=null;completed.add(chosen);
    rippleAllGoals();sfxWin();
    el('joyHint').textContent=pack.levels[chosen].done;
    el('joyStatus').textContent='완성 '+completed.size+'/'+pack.levels.length+' · '+moves+'걸음 · 완성한 장면을 감상해 보세요';
    el('joyNext').textContent=chosen===pack.levels.length-1?'처음부터':'다음 판';
    // Let the docking reaction finish before the next-board button becomes available.
    const won=chosen;
    setTimeout(()=>{if(state==='win'&&chosen===won)el('joyNext').disabled=false;},900);
    refreshProgress();
  };
  panel.querySelectorAll('[data-case]').forEach(b=>b.onclick=()=>enter(Number(b.dataset.case)));
  panel.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>enterTool(Number(b.dataset.tool)));
  el('joyTools').onclick=()=>toolMode?enter(chosen):enterTool(0);
  el('joyUseTool').onclick=armTool;
  panel.querySelectorAll('[data-dir]').forEach(b=>b.onclick=()=>{const d=b.dataset.dir.split(',').map(Number);tryMove(...d);});
  el('joyReset').onclick=()=>toolMode?enterTool(toolChoice):enter(chosen);
  el('joyUndo').onclick=()=>{
    if(state!=='play'||isAnimating()||!undoStack.length)return;
    restoreSnap(undoStack.pop());
    dog.rr=dog.r;dog.cc=dog.c;dog.moving=false;dog.protoMoveT=0;dog.protoMoveDur=0;
    fx=[];fxQueue=[];holePulse={};moveBuffer=null;hintFx=null;hintCancel();
    hintKey='';hintDepth=0;sfxUndo();
    el('joyHint').textContent='괜찮아요. 다른 방법으로 해봐요.';
    el('joyHintBtn').textContent='생각 힌트';
  };
  el('joyNext').onclick=()=>enter((chosen+1)%pack.levels.length);
  el('joyHintBtn').onclick=()=>{
    if(state!=='play'||isAnimating())return;
    const key=stKey(curState());
    if(key!==hintKey){hintDepth=0;hintKey=key;}
    if(hintDepth++===0){
      el('joyHint').textContent=moves===0?pack.levels[chosen].clue:'받침 쪽으로 밀려면 어느 칸에 서야 할까요?';
      el('joyHintBtn').textContent='한 걸음 보기';return;
    }
    const sol=solve(L,curState(),40);
    el('joyHint').textContent=sol&&sol.moveList.length?'다음 한 걸음: '+({'-1,0':'위 ↑','1,0':'아래 ↓','0,-1':'왼쪽 ←','0,1':'오른쪽 →'}[sol.moveList[0].join(',')]):'지금은 길이 막혔어요. 한 수씩 무르며 다른 자리를 찾아보세요.';
  };
  window.coreJoyQA={enter,enterTool,armTool,useToolAt,status:()=>({chosen,toolMode,toolChoice,toolUsed,toolArmed,toolRunning,toolStep,state,moves,completed:[...completed],toy:goalFeelToy}),step:(r,c)=>tryMove(r,c)};
  setTimeout(()=>enter(0),800);
}
