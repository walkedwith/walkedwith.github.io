// 1-1 「집으로」 시안 — 런타임 패치. dig.html 전역 스코프에서 eval 한다(노드: loadGame().run, 브라우저: iframe.contentWindow.eval).
// 규칙은 hill-redesign/home120/home-engine.js 에서 가져왔다(언덕 전용 기록 손질은 뺐다). 그림·들어가는 연출은 1동네 앞마당용으로 새로 그렸다.
//
// 판 데이터 home:[r,c,문 방향] (0위 1오른 2아래 3왼). home 이 있는 판만 켜진다.
//  - 집 칸은 벽(WALL). 맥스는 못 들어가고, 옆·뒤에서 민 공은 벽에 막힌 것과 같다.
//  - 문 앞 칸의 공이 집 쪽으로 움직이면 집 안으로 쏙 들어간다. 들어간 공은 못 꺼낸다. 몇 개든 한 집에 들어간다.
//  - 클리어 = 판의 공이 모두 집에 들어감.
(function(){
  if(typeof window!=='undefined' && window.__homePatched) return; if(typeof window!=='undefined') window.__homePatched=1;
  const G0={fromBaked, applyMove, isGoal, deadlockNow, firePend, drawTile, liquidFx, tryMove, drawBall, drawGoalFeelToy, drawToyColorMark};

  homeAt=function(L,r,c){ return !!(L && L.home && L.home[0]===r && L.home[1]===c); };

  fromBaked=function(o, lv){
    const g=G0.fromBaked(o, lv);
    if(o.home){ g.L.home=o.home.slice(); g.L.T[o.home[0]][o.home[1]]=WALL; }
    return g;
  };
  // 한 수 = 두 번 계산. ① 집 칸을 잠깐 잔디로 열고 원래 applyMove. ② 집 칸에 닿은 것이 "문 앞 칸에서 들어온 공 하나"가 아니면 벽으로 둔 원래 계산을 쓴다.
  applyMove=function(L, st, dr, dc){
    if(!L.home) return G0.applyMove(L, st, dr, dc);
    const h=L.home, v=DOOR_CV[h[2]&3], fr=h[0]+v[0], fc=h[1]+v[1], row=L.T[h[0]], t0=row[h[1]];
    // 들어간 공은 그 수 동안만 집 칸에 남는다(화면이 들어가는 연출을 그린다). 다음 수 계산 앞에서 뺀다 — 그래서 못 꺼낸다.
    if(st.boxes.some(b=>b.r===h[0] && b.c===h[1])) st={...st, boxes:st.boxes.filter(b=>!(b.r===h[0] && b.c===h[1]))};
    let res=null;
    row[h[1]]=GRASS; try{ res=G0.applyMove(L, st, dr, dc); } finally{ row[h[1]]=t0; }
    const wall=()=>G0.applyMove(L, st, dr, dc);
    if(!res) return wall();
    const at=p=>p && p.r===h[0] && p.c===h[1];
    if(at(res.dog)) return wall();                                            // 맥스는 못 들어간다
    const runs=[];
    if(res.pushed && res.path && res.path.length) runs.push({main:1, from:{r:st.dog.r+dr, c:st.dog.c+dc}, path:res.path, rest:{r:res.restR, c:res.restC}});
    for(const e of (res.extra||[])) runs.push({e, from:{r:e.fromR, c:e.fromC}, path:e.path||[], rest:{r:e.restR, c:e.restC}});
    for(const ru of runs) if(ru.path.some(at) && !at(ru.rest)) return wall();  // 집 칸을 지나쳐 갔다
    const inHome=res.boxes.filter(b=>!b.gone && at(b));
    if(!inHome.length) return res;
    if(inHome.length>1 || inHome[0].kind!=='ball') return wall();
    let ok=null;
    for(const ru of runs){ if(!at(ru.rest)) continue;
      const p=ru.path, prev=p.length>=2? p[p.length-2] : ru.from;
      if(prev.r===fr && prev.c===fc){ ok=ru; } else return wall(); }           // 직전 칸이 문 앞 칸이어야
    if(!ok) return wall();
    if(ok.main){ res.sunk=true; } else if(ok.e){ ok.e.sunk=true; }
    res.home=1;
    return res;
  };
  isGoal=function(L, st){
    if(L.home && st.boxes.some(b=>b.kind==='ball' && !homeAt(L,b.r,b.c))) return false;
    return G0.isGoal(L, st);
  };
  // 막힘 — 방석이 없어 원래 검사가 구석 공을 못 본다. 벽 구석에 낀 공(문 앞 칸 제외)이 있으면 막힘.
  // ponytail: 구석 검사뿐이다(벽을 따라 못 떼는 공은 못 본다). 정식 반영 때는 솔버 기반 검사로.
  deadlockNow=function(){
    if(!L || !L.home) return G0.deadlockNow();
    if(G0.deadlockNow()) return true;
    const h=L.home, v=DOOR_CV[h[2]&3], dr0=h[0]+v[0], dc0=h[1]+v[1];
    const solid=(r,c)=>tileAt(L,filled,r,c)===WALL;
    for(const b of boxes){ if(b.sink!==0 || b.kind!=='ball' || homeAt(L,b.r,b.c)) continue;
      if(b.r===dr0 && b.c===dc0) continue;
      if((solid(b.r-1,b.c)||solid(b.r+1,b.c)) && (solid(b.r,b.c-1)||solid(b.r,b.c+1))) return true; }
    return false;
  };

  // ───────── 화면 ─────────
  homeFx=null;      // {t0} 공이 들어간 순간 — 집이 폴짝, 뼈다귀 간판이 달랑
  homeHit=null;     // {t0} 옆·뒤에서 민 공/맥스가 벽에 닿는 순간 — 집이 부르르
  firePend=function(b){
    const p=b.pend;
    if(p && p.sunk && L && L.home && homeAt(L,b.r,b.c) && b.kind==='ball'){
      b.pend=null; b.sink=1; b.homeIn=1;
      homeFx={t0:animT};
      tone(660,0.09,'triangle',0.05,990); tone(990,0.14,'sine',0.04,1320); buzz([10,24,10]);
      dog.wagBoost=1;
      const last=!boxes.some(x=>x!==b && (x.path || x.pend)); if(last) chainDone();
      return;
    }
    return G0.firePend(b);
  };
  // 옆·뒤에서 밀었다 — 게임의 원래 막힘 연출(공이 튕겨 돌아와 맥스가 쿵)에 더해 집이 부르르 떤다.
  tryMove=function(dr,dc){
    let hit=false;
    try{ if(L && L.home && state==='play' && !isAnimating()){
      const b=boxes.find(x=>x.sink===0 && x.r===dog.r+dr && x.c===dog.c+dc);
      hit=homeAt(L, dog.r+dr*(b?2:1), dog.c+dc*(b?2:1)) && !applyMove(L, curState(), dr, dc); } }catch(e){}
    const r=G0.tryMove(dr,dc);
    if(hit) homeHit={t0:animT+0.16};
    return r;
  };
  // 바닥 — 집 칸은 화단 벽이 아니라 잔디로 깐다(집은 물건 층에서 그린다).
  drawTile=function(r,c){
    if(!homeAt(L,r,c)) return G0.drawTile(r,c);
    const row=L.T[r], t0=row[c], m0=matHitFx; row[c]=GRASS; if(m0 && m0.r===r && m0.c===c) matHitFx=null;
    try{ return G0.drawTile(r,c); } finally{ row[c]=t0; matHitFx=m0; }
  };
  // 집 그림 치수(칸 = s). 발치 가운데가 (0,0).
  const HB={w:.43, wallH:.48, peak:.9, doorW:.19, doorH:.4};
  const doorPath=(g,s)=>{ const w=HB.doorW*s, h=HB.doorH*s; g.beginPath(); g.moveTo(-w,0); g.lineTo(-w,-h+w); g.arc(0,-h+w,w,Math.PI,0); g.lineTo(w,0); g.closePath(); };
  const homeXY=()=>({x:cx(L.home[1]), y:(L.home[0]+.97)*cell});
  function drawHome(g){
    const s=cell, {x,y}=homeXY(), w=HB.w*s, wh=HB.wallH*s, pk=HB.peak*s;
    const age=homeFx? animT-homeFx.t0 : 9, pop=age>=0 && age<.55? Math.sin(age/.55*Math.PI)*(1-age/.55*.5) : 0;
    const hAge=homeHit? animT-homeHit.t0 : 9, shk=hAge>=0 && hAge<.3? Math.sin(hAge*54)*s*.035*(1-hAge/.3) : 0;
    const wig=age>=0 && age<.9? Math.sin(age*26)*.5*(1-age/.9) : 0;
    g.save(); g.translate(x+shk,y);
    g.fillStyle='rgba(52,84,40,.26)'; g.beginPath(); g.ellipse(0,-s*.01,w*1.22,s*.11,0,0,7); g.fill();      // 바닥 그림자
    g.scale(1+pop*.09,1-pop*.11); g.translate(0,-pop*s*.05);
    g.lineJoin='round'; g.lineCap='round';
    // 2.5D 파란 지붕 집(10-12) — 판과 같은 3/4 내려다보는 눈: 앞 박공 벽 + 뒤로(위로) 물러나는 지붕 두 면 + 앞 처마 널.
    const OL='#A98F78', lw=Math.max(1,s*.014), dz=s*.2, ov=w*1.3, ey=-wh+s*.1, th=s*.085;
    // 받침(나무 단) — 화단 상자와 같은 갈색
    g.fillStyle='#B98558'; g.strokeStyle='#8A5F3C'; g.lineWidth=lw; g.beginPath(); g.roundRect(-w-s*.03,-s*.075,(w+s*.03)*2,s*.095,s*.02); g.fill(); g.stroke();
    // 몸통 + 박공(크림색 가로 판자)
    const body=()=>{ g.beginPath(); g.moveTo(-w,-s*.06); g.lineTo(-w,-wh); g.lineTo(0,-pk+s*.04); g.lineTo(w,-wh); g.lineTo(w,-s*.06); g.closePath(); };
    g.fillStyle='#FFFFFF'; body(); g.fill();
    g.save(); body(); g.clip();
    g.fillStyle='#F1ECE3'; g.fillRect(w*.5,-pk,w*.6,pk);                                                     // 오른쪽 그늘
    g.fillStyle='rgba(120,110,100,.16)'; g.beginPath(); g.moveTo(-ov,ey+th); g.lineTo(0,-pk+th); g.lineTo(ov,ey+th); g.lineTo(ov,ey+th+s*.07); g.lineTo(0,-pk+th+s*.07); g.lineTo(-ov,ey+th+s*.07); g.fill();   // 처마 그늘
    g.strokeStyle='rgba(150,135,120,.22)'; g.lineWidth=Math.max(.8,s*.008);
    for(const k of [.2,.36,.52,.68]){ g.beginPath(); g.moveTo(-w,-s*k); g.lineTo(w,-s*k); g.stroke(); }      // 판자 결(가로)
    g.restore();
    g.strokeStyle=OL; g.lineWidth=lw; body(); g.stroke();
    // 문 — 나무 문틀 + 어두운 아치 + 문턱
    g.save(); g.scale(1.14,1.07); g.fillStyle='#E3C9A6'; doorPath(g,s); g.fill(); g.restore();
    const dg=g.createLinearGradient(0,-HB.doorH*s,0,0); dg.addColorStop(0,'#35200F'); dg.addColorStop(.75,'#5A3620'); dg.addColorStop(1,'#7A4C2C');
    g.fillStyle=dg; doorPath(g,s); g.fill();
    g.strokeStyle=OL; g.lineWidth=lw*.8; g.save(); g.scale(1.14,1.07); doorPath(g,s); g.stroke(); g.restore();
    g.fillStyle='#E3C9A6'; g.strokeStyle=OL; g.lineWidth=lw*.8; g.beginPath(); g.roundRect(-HB.doorW*s*1.25,-s*.03,HB.doorW*s*2.5,s*.06,s*.02); g.fill(); g.stroke();   // 문턱
    // 지붕 두 면 — 왼쪽은 빛 받는 면, 오른쪽은 그늘진 면. 뒤 마루는 dz 만큼 위로.
    const plane=(sx)=>{ g.beginPath(); g.moveTo(sx*ov,ey); g.lineTo(0,-pk); g.lineTo(0,-pk-dz); g.lineTo(sx*(ov-s*.03),ey-dz); g.closePath(); };
    const rg=g.createLinearGradient(-ov,0,0,0); rg.addColorStop(0,'#6FAAE8'); rg.addColorStop(1,'#5B9BE0');
    g.fillStyle=rg; plane(-1); g.fill(); g.fillStyle='#4683CB'; plane(1); g.fill();
    for(const sx of [-1,1]){ g.save(); plane(sx); g.clip();                                                 // 기와 줄 — 앞 처마와 나란히 두 줄 + 물결
      g.strokeStyle=sx<0? 'rgba(255,255,255,.38)' : 'rgba(30,70,130,.35)'; g.lineWidth=Math.max(.8,s*.01);
      for(const q of [.36,.7]){ g.beginPath(); for(let k=0;k<=8;k++){ const u=k/8, px=sx*ov*(1-u), py=ey+(-pk-ey)*u-dz*q; if(k===0) g.moveTo(px,py); else g.quadraticCurveTo(sx*ov*(1-u+1/16),py+(-pk-ey)*(-1/16)+s*.022,px,py); } g.stroke(); }
      g.restore(); }
    g.strokeStyle='#3F72B4'; g.lineWidth=lw; g.lineJoin='round'; plane(-1); g.stroke(); plane(1); g.stroke();
    g.strokeStyle='#B7D8F8'; g.lineWidth=Math.max(1,s*.014); g.beginPath(); g.moveTo(-s*.012,-pk-s*.02); g.lineTo(-s*.012,-pk-dz+s*.02); g.stroke();   // 마루 빛
    // 앞 처마 널(크림색 테) — 지붕 두께가 앞에서 보인다
    const fascia=()=>{ g.beginPath(); g.moveTo(-ov,ey); g.lineTo(0,-pk); g.lineTo(ov,ey); g.lineTo(ov,ey+th); g.lineTo(0,-pk+th*1.25); g.lineTo(-ov,ey+th); g.closePath(); };
    g.fillStyle='#FFFFFF'; fascia(); g.fill();
    g.save(); fascia(); g.clip(); g.fillStyle='#ECE7DE'; g.beginPath(); g.moveTo(0,-pk); g.lineTo(ov,ey); g.lineTo(ov,ey+th); g.lineTo(0,-pk+th*1.25); g.fill(); g.restore();
    g.strokeStyle=OL; g.lineWidth=lw; fascia(); g.stroke();
    // 뼈다귀 간판 — 박공에 건 둥근 나무 패
    g.save(); g.translate(0,-wh-s*.1); g.rotate(wig);
    g.fillStyle='#A9784F'; g.strokeStyle='#8A5F3C'; g.lineWidth=lw*.8; g.beginPath(); g.ellipse(0,0,s*.135,s*.075,0,0,7); g.fill(); g.stroke();
    g.fillStyle='#FFF3D6'; const bw=s*.062, br=s*.026; g.fillRect(-bw,-br*.62,bw*2,br*1.24);
    for(const sx of [-1,1]) for(const sy of [-1,1]){ g.beginPath(); g.arc(sx*bw,sy*br*.72,br,0,7); g.fill(); }
    g.restore();
    g.restore();
    if(age>=0 && age<.7){                                                                                   // 반짝 — 문에서 퍼지는 네 꼭지 별
      const u=age/.7; g.save(); g.translate(x,y-wh*.6); g.globalAlpha=1-u*u;
      for(let i=0;i<7;i++){ const a=-Math.PI*(.08+.84*i/6), d=s*(.3+.55*(1-(1-u)*(1-u)))*(i%2? 1:.78), q=s*(i%2? .1:.07)*(1-u*.5);
        const px=Math.cos(a)*d, py=Math.sin(a)*d*.9; g.fillStyle=i%2? '#FFF6CF':'#FFD873';
        g.beginPath(); g.moveTo(px,py-q); g.quadraticCurveTo(px,py,px+q,py); g.quadraticCurveTo(px,py,px,py+q); g.quadraticCurveTo(px,py,px-q,py); g.quadraticCurveTo(px,py,px,py-q); g.fill(); }
      g.restore(); }
  }
  // 공·맥스보다 먼저(바닥 바로 위) 집을 그린다 — 문 앞에 선 공·맥스가 집 앞에 선다.
  liquidFx=function(){ const r=G0.liquidFx.apply(this,arguments); if(L && L.home && !houseMode) try{ drawHome(ctx); }catch(e){} return r; };
  // 들어가는 공 — 문 아치 안쪽만 보이게 잘라 그리고, 들어갈수록 작아지며 어두워진다(문 안으로 쏙).
  const entering=(x,y)=>{ if(!L || !L.home || houseMode || (L.home[2]&3)!==2) return null;
    const h=homeXY(), top=cy(L.home[0]), bot=cy(L.home[0]+1);
    if(Math.abs(x-h.x)>cell*.3 || y>bot-cell*.02 || y<top-cell*.3) return null;
    return Math.max(0,Math.min(1,(bot-y)/cell)); };
  drawBall=function(){ return drawIn('drawBall',this,arguments); };
  drawGoalFeelToy=function(){ return drawIn('drawGoalFeelToy',this,arguments); };
  drawToyColorMark=function(){ return drawIn('drawToyColorMark',this,arguments); };
  function drawIn(nm,self,a){
    const f0=G0[nm], p=entering(a[0],a[1]); if(p==null) return f0.apply(self,a);
    const h=homeXY(), s=cell, e=p*p*(3-2*p);
    ctx.save();
    ctx.beginPath(); ctx.rect(h.x-s, h.y, s*2, s*2);                                   // 집 발치 아래는 그대로 보인다
    { const w=HB.doorW*s*.94, dh=HB.doorH*s*.97; ctx.moveTo(h.x-w,h.y+1); ctx.lineTo(h.x-w,h.y-dh+w); ctx.arc(h.x,h.y-dh+w,w,Math.PI,0); ctx.lineTo(h.x+w,h.y+1); ctx.closePath(); }
    ctx.clip();
    ctx.globalAlpha*=1-Math.max(0,(e-.35)/.65);
    const k=1-.4*e, ax=h.x, ay=h.y-HB.doorH*s*.45;                                      // 문 가운데로 빨려 든다
    ctx.translate(ax,ay); ctx.scale(k,k); ctx.translate(-ax,-ay);
    try{ return f0.apply(self,a); } finally{ ctx.restore(); }
  };
})();
