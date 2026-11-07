// 1-1~1-5 「집으로」 시안 — 화분. home-engine.js(집 규칙·그림, home-1-1 에서 그대로 가져옴) 뒤에 게임 전역에서 eval 한다.
// 규칙은 새로 안 만든다: 화분 = 게임에 이미 있는 택배 상자(KINDS[1] 'log' — 한 칸 밀림, 공·맥스를 막음, 방석/집 목표가 아님, 소리 boxPush).
// 판 데이터에서 b:[r,c,0,1] 로 놓으면 된다. 여기서는 ① 그 상자를 화분으로 그리고 ② 집 판에는 도토리(줍는 칸)를 안 묻는다 — 둘뿐이다.
(function(){
  if(typeof window!=='undefined' && window.__potPatched) return; if(typeof window!=='undefined') window.__potPatched=1;
  const G1={drawLog, acornCells};
  const homeLv=lv=>!!(BAKED[lv-1] && BAKED[lv-1].home);
  // 도토리 자리는 판 번호로 정해져 있어 새 판의 화단·집과 겹친다. 집 판은 안 묻는다(걸음 목표도 par 그대로).
  acornCells=function(lv){ return homeLv(lv)? [] : G1.acornCells.apply(this,arguments); };
  // 화분 — 둥근 토분에 잎과 작은 꽃. 화단(나무 상자, 못 민다)과 한눈에 갈리게: 둥글고, 작고, 흙빛. 테두리는 집 그림과 같은 굵기의 가는 선.
  drawLog=function(x,y,s,sx,sy,rot){
    if(!L || !L.home || houseMode) return G1.drawLog.apply(this,arguments);
    const g=ctx, lw=Math.max(1,s*.014), by=s*.33;                       // 발치 = 칸 가운데에서 .33 아래(상자 밑변과 같은 자리)
    g.save(); g.translate(x,y+by);
    g.fillStyle='rgba(52,84,40,.26)'; g.beginPath(); g.ellipse(0,-s*.005,s*.25,s*.065,0,0,7); g.fill();      // 바닥 그림자(집과 같은 색)
    g.rotate(rot||0); g.scale((sx||1)*1.2,(sy||1)*1.2); g.lineJoin='round'; g.lineCap='round';
    const tw=s*.2, bw=s*.135, h=s*.3, rimH=s*.075, rw=s*.225;
    // 잎 — 화분 뒤에서 부채꼴로
    const leaf=(a,len,wd,col)=>{ g.save(); g.translate(0,-h-rimH*.6); g.rotate(a); g.fillStyle=col; g.strokeStyle='rgba(58,112,62,.55)'; g.lineWidth=lw*.8;
      g.beginPath(); g.moveTo(0,0); g.quadraticCurveTo(wd,-len*.5,0,-len); g.quadraticCurveTo(-wd,-len*.5,0,0); g.fill(); g.stroke(); g.restore(); };
    leaf(-1.05,s*.2,s*.085,'#5FA85C'); leaf(1.05,s*.2,s*.085,'#5FA85C');
    leaf(-.55,s*.27,s*.095,'#74BB6A'); leaf(.55,s*.27,s*.095,'#6DB565'); leaf(0,s*.3,s*.1,'#86C977');
    // 몸통(아래로 좁아지는 토분)
    const bg=g.createLinearGradient(-tw,0,tw,0); bg.addColorStop(0,'#E09668'); bg.addColorStop(.55,'#D2804F'); bg.addColorStop(1,'#BE6B3F');
    g.fillStyle=bg; g.strokeStyle='#A45E3A'; g.lineWidth=lw;
    g.beginPath(); g.moveTo(-tw,-h); g.lineTo(-bw,-s*.03); g.quadraticCurveTo(-bw,0,-bw+s*.03,0); g.lineTo(bw-s*.03,0); g.quadraticCurveTo(bw,0,bw,-s*.03); g.lineTo(tw,-h); g.closePath(); g.fill(); g.stroke();
    g.fillStyle='rgba(255,255,255,.2)'; g.beginPath(); g.ellipse(-tw*.5,-h*.5,s*.022,h*.3,.12,0,7); g.fill();   // 윤기
    // 테(두툼한 입술)
    g.fillStyle='#E7A377'; g.strokeStyle='#A45E3A'; g.lineWidth=lw; g.beginPath(); g.roundRect(-rw,-h-rimH,rw*2,rimH,rimH*.45); g.fill(); g.stroke();
    g.fillStyle='rgba(120,60,30,.16)'; g.fillRect(-tw,-h,tw*2,s*.022);                                         // 테 그늘
    // 꽃 셋 — 화단 꽃과 같은 색(노랑·분홍·흰)
    const flower=(fx,fy,r,col)=>{ g.fillStyle=col; for(let i=0;i<5;i++){ const a=i/5*6.283-1.57; g.beginPath(); g.arc(fx+Math.cos(a)*r,fy+Math.sin(a)*r,r*.78,0,7); g.fill(); }
      g.fillStyle='#F2B63C'; g.beginPath(); g.arc(fx,fy,r*.62,0,7); g.fill(); };
    flower(-s*.115,-h-rimH-s*.11,s*.04,'#F7A8BE'); flower(s*.12,-h-rimH-s*.13,s*.04,'#FFFFFF'); flower(0,-h-rimH-s*.235,s*.045,'#FFD95E');
    g.restore();
  };
})();
