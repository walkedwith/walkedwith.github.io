// 측정 모드(?perf=1) — 폰에서 어디가 느린지 숫자로 본다. 게임 규칙·저장은 안 건드린다.
// dev-runtime-loader.js 가 주소에 perf 가 있을 때만 불러온다(번들에도 싣는다 — 테스트 빌드에서 폰으로 잰다).
// 재는 것: 움직이는 동안의 프레임 간격 · 한 프레임 계산+그리기 시간 · 바닥 다시 그리기 · 판 불러오기.
(()=>{
  'use strict';
  if(typeof frameInner!=='function' || typeof render!=='function') return;
  const now=()=>performance.now();
  const S=()=>({n:0,sum:0,max:0,slow:0,v:[]});            // 한 구간의 표본
  const add=(s,x,slowAt)=>{ s.n++; s.sum+=x; if(x>s.max) s.max=x; if(slowAt && x>slowAt) s.slow++; if(s.v.length<4000) s.v.push(x); };
  const p95=s=>{ if(!s.v.length) return 0; const a=s.v.slice().sort((x,y)=>x-y); return a[Math.min(a.length-1,Math.floor(a.length*.95))]; };
  const avg=s=>s.n? s.sum/s.n : 0;
  const scenes=new Map();                                  // 장면(판 번호·마당·지도)별 누적
  const sceneKey=()=>{ try{ if(typeof yardMode!=='undefined' && yardMode) return '마당'; if(typeof houseMode!=='undefined' && houseMode) return '집'; if(typeof menuMode!=='undefined' && menuMode) return '메뉴'; return level+'판'; }catch(_){ return '?'; } };
  const scene=()=>{ const k=sceneKey(); let s=scenes.get(k); if(!s){ s={gap:S(),work:S(),draw:S(),tile:S(),load:S()}; scenes.set(k,s); } return s; };
  let prev=0, inRender=0;

  const _frameInner=frameInner, _render=render, _tile=tileLayerPaint, _load=loadLevel;
  frameInner=function(ts){
    const t0=now(), idle=(()=>{ try{ return frameIdle(t0); }catch(_){ return false; } })();
    if(!idle && prev && t0-prev<400) add(scene().gap, t0-prev, 25);     // 쉬는 동안은 일부러 느리게 도니 뺀다
    prev=idle? 0 : t0;
    const r=_frameInner.apply(this,arguments);
    if(!idle) add(scene().work, now()-t0, 12);
    return r;
  };
  render=function(){ const t0=now(); inRender++; try{ return _render.apply(this,arguments); } finally{ inRender--; add(scene().draw, now()-t0, 8); } };
  tileLayerPaint=function(){ const t0=now(); try{ return _tile.apply(this,arguments); } finally{ add(scene().tile, now()-t0, 8); } };
  loadLevel=function(){ const t0=now(); try{ return _load.apply(this,arguments); } finally{ const d=now()-t0; setTimeout(()=>add(scene().load, d, 50),0); } };

  // 화면 위 작은 계기판 — 왼쪽 위, 글자만. 「복사」를 누르면 장면별 표가 클립보드로 간다.
  const box=document.createElement('div');
  box.style.cssText='position:fixed;left:6px;bottom:calc(40px + env(safe-area-inset-bottom,0px));z-index:99999;font:10px/1.35 ui-monospace,Menlo,monospace;color:#fff;background:rgba(20,20,20,.72);padding:5px 7px;border-radius:8px;white-space:pre;pointer-events:none;max-width:70vw';
  const btn=document.createElement('button'); btn.textContent='복사';
  btn.style.cssText='position:fixed;left:6px;bottom:calc(6px + env(safe-area-inset-bottom,0px));z-index:99999;font:600 12px sans-serif;padding:6px 10px;border-radius:9px;border:0;background:#FFE9C0;color:#3B2F25';
  document.body.appendChild(box); document.body.appendChild(btn);
  const f1=x=>x.toFixed(1), pct=(a,b)=>b? Math.round(a/b*100)+'%' : '-';
  const dev=()=>{ let c=null; try{ c=document.querySelector('canvas'); }catch(_){ } const d=window.devicePixelRatio||1;
    return 'dpr '+d+' · 판 배율 '+(typeof boardDpr==='function'? boardDpr() : '?')+' · 칸 '+(typeof cell!=='undefined'? Math.round(cell) : '?')+'px · 화면 '+innerWidth+'×'+innerHeight+(performance.memory? ' · 메모리 '+Math.round(performance.memory.usedJSHeapSize/1048576)+'MB' : ''); };
  const line=(k,s)=>k.padEnd(5)+' fps '+(s.gap.n? f1(1000/avg(s.gap)) : '-').padStart(5)+' · 늦은 프레임 '+pct(s.gap.slow,s.gap.n).padStart(4)+' · 간격 p95 '+f1(p95(s.gap)).padStart(5)+'ms'
    +'\n      계산+그리기 '+f1(avg(s.work))+'/'+f1(p95(s.work))+'/'+f1(s.work.max)+'ms(평균/p95/최대) · 그리기 '+f1(avg(s.draw))+'ms'
    +'\n      바닥 다시 그리기 '+s.tile.n+'번 '+f1(avg(s.tile))+'/'+f1(s.tile.max)+'ms · 판 불러오기 '+(s.load.n? f1(avg(s.load))+'/'+f1(s.load.max)+'ms' : '-');
  const report=()=>['맥스 측정 '+new Date().toISOString().slice(0,16)+' · '+navigator.userAgent.replace(/^.*?\((.*?)\).*$/,'$1'), dev(), ...[...scenes].filter(([,s])=>s.gap.n>30).map(([k,s])=>line(k,s))].join('\n');
  setInterval(()=>{ const k=sceneKey(), s=scenes.get(k); box.textContent=dev()+'\n'+(s? line(k,s) : k+' 재는 중…'); },500);
  btn.addEventListener('click',()=>{ const t=report(); const done=ok=>{ btn.textContent=ok? '복사됨' : '복사 실패 — 콘솔'; setTimeout(()=>btn.textContent='복사',1500); };
    console.log(t); try{ navigator.clipboard.writeText(t).then(()=>done(true),()=>done(false)); }catch(_){ done(false); } });
  window.__perfReport=report;
})();
