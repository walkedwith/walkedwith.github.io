// plain: 색칠(paintOn)을 무시하고 원래 색으로. 본편 보드의 개집이 그 경우다 —
// 마당에서 칠한 분홍 지붕이 250판 배경에 끼어들면 판 아트가 통제를 벗어난다.
// ── 1동네 · 맥스 하우스 ─────────────────────────────────────
// 여섯 단계가 한 함수에 있다. 앞 셋은 짓는 과정이고 뒤 셋은 같은 실루엣에 살갗만
// 갈아입는다 — 옛 4~6(방석·흰 마감·짙은 원목)은 은퇴, 지금은 drawHouseGrow 가 옆 차양·앞 마루·장작과 등잔을 붙인다.
const HOUSE_SKIN=[null,null,
  {wall:'#E8DFC8', wallLo:'#D4CBB2', roof:'#6B8FC0', eave:'#567AA8', trim:null,      plank:null,      brass:null,           grain:null,      mat:null},
  {wall:'#E6EDF6', wallLo:'#D2DDEB', roof:'#6B8FC0', eave:'#567AA8', trim:null,      plank:null,      brass:null,           grain:'#D6E1EF', mat:'#4E8FE2'},
  {wall:'#FFFBF2', wallLo:'#EFE7D8', roof:'#6B8FC0', eave:'#567AA8', trim:'#FFFFFF', plank:null,      brass:null,           grain:null,      mat:'#4E8FE2'},
  {wall:'#8A6741', wallLo:'#6F5233', roof:'#2F5F8F', eave:'#24496E', trim:null,      plank:'#7A5A36', brass:GROWTH_BRASS,   grain:null,      mat:'#4E8FE2'}];
// ── 완성 집은 도형으로만 그린다 ────────────────────────────
// 한때 전용 알파 원화(max-house-premium-v1.png, 650KB)를 덮어 썼다 지웠다(2026-09-17).
// 그 원화만 3/4 로 돌아 있었다 — 마당의 나머지 아홉(첫 밥통 · 참나무 · 트램플린 · 땅 파기 ·
// 택배 상자 · 물감 · 고양이 침대 · 오리 연못 · 바람개비)은 전부 좌우 대칭 정면이라 집 혼자
// 비스듬해 보였다. PNG 알파 실측: 문 중심이 집 중심에서 왼쪽으로 7%(643 대 710) · 앞면
// 밑변이 오른쪽으로 4.6°(x340·y903 → x960·y953) · 오른쪽 지붕이 왼쪽보다 49px 아래.
// 3/4 로서는 옳은 그림이었지만 발밑 그림자와 차양·마루가 전부 정면 기준이라 어긋났다.
// 새 원화를 들일 땐 **정면 대칭**으로 그리고, 아래 도형 집의 치수에 맞춘다:
//   지붕 꼭대기 .10 · 처마 .44 · 벽 .16~.84 · 바닥 .88 (전부 한 칸 c 배수)
// 우리 방석 — 판의 drawCushion 과 같은 얼개(겹친 타원 + 점선 테). q 는 세로 눌림.
function drawCushionMini(g,x,y,p,col,brass,q){
  q=q||.60;
  const mix=(hex,k)=>{ const n=parseInt(hex.slice(1),16), R=(n>>16)&255,G=(n>>8)&255,B=n&255;
    return 'rgb('+Math.round(R+(255-R)*k)+','+Math.round(G+(255-G)*k)+','+Math.round(B+(255-B)*k)+')'; };
  const dark=(hex)=>{ const n=parseInt(hex.slice(1),16);
    return 'rgb('+(((n>>16&255)*.62)|0)+','+(((n>>8&255)*.62)|0)+','+((n&255)*.62|0)+')'; };
  g.fillStyle=dark(col);    g.beginPath(); g.ellipse(x,y+p*.20*q,p,p*.76*q,0,0,7); g.fill();
  g.fillStyle=col;          g.beginPath(); g.ellipse(x,y+p*.08*q,p,p*.82*q,0,0,7); g.fill();
  g.fillStyle=mix(col,.32); g.beginPath(); g.ellipse(x,y-p*.05*q,p*.8,p*.60*q,0,0,7); g.fill();
  g.fillStyle=mix(col,.62); g.beginPath(); g.ellipse(x,y+p*.02*q,p*.55,p*.40*q,0,0,7); g.fill();
  g.strokeStyle=brass||col; g.globalAlpha=brass?1:.8; g.lineWidth=p*.10;
  g.setLineDash([p*.15,p*.13]); g.beginPath(); g.ellipse(x,y+p*.02*q,p*.34,p*.34*q,0,0,7); g.stroke();
  g.setLineDash([]); g.globalAlpha=1;
}
// 그릇 한 쌍 — 단계마다 그릇 자체가 자란다(양철 → 도기 → 흰 도기와 받침 → 놋쇠와 급식대).
function drawGrowBowl(g,bx,by,r,body,lip,inner,brass){
  g.fillStyle='rgba(40,50,30,.16)'; g.beginPath(); g.ellipse(bx,by+r*.42,r*.92,r*.30,0,0,7); g.fill();
  g.fillStyle=body; g.beginPath();
  g.moveTo(bx-r,by-r*.18); g.quadraticCurveTo(bx-r*.90,by+r*.46,bx-r*.52,by+r*.46);
  g.lineTo(bx+r*.52,by+r*.46); g.quadraticCurveTo(bx+r*.90,by+r*.46,bx+r,by-r*.18);
  g.closePath(); g.fill();
  g.fillStyle=lip; g.beginPath(); g.ellipse(bx,by-r*.18,r,r*.34,0,0,7); g.fill();
  g.fillStyle=inner; g.beginPath(); g.ellipse(bx,by-r*.15,r*.78,r*.25,0,0,7); g.fill();
  if(brass){ g.strokeStyle=brass; g.lineWidth=r*.20; g.beginPath(); g.ellipse(bx,by-r*.18,r*.98,r*.33,0,0,7); g.stroke(); }
}
function drawGrowBowls(g,x,fy,c,rank,brass,food){
  const R=[.145,.160,.160,.160][rank]*c;
  const wx=x+c*(rank>=2? .595 : .580), bx=x+c*(rank>=2? .800 : .790);
  let by=fy+c*(rank===3? .684 : .755), wy=fy+c*(rank===3? .684 : .778);
  if(rank===2){                                            // ★75 — 나무 받침판 위에 나란히
    g.fillStyle='rgba(40,50,30,.14)'; g.beginPath(); g.ellipse(x+c*.695,fy+c*.878,c*.245,c*.055,0,0,7); g.fill();
    g.fillStyle='#D8B98A'; rr2(g,x+c*.448,fy+c*.688,c*.492,c*.176,c*.034); g.fill();
    g.fillStyle='#B08B57'; rr2(g,x+c*.448,fy+c*.829,c*.492,c*.035,c*.017); g.fill();
    g.strokeStyle='#A5814F'; g.lineWidth=c*.012; rr2(g,x+c*.448,fy+c*.688,c*.492,c*.176,c*.034); g.stroke();
    by=fy+c*.762; wy=fy+c*.762;
  }
  if(rank===3){                                            // ★90 — 원목 급식대. 허리를 안 굽혀도 된다
    g.fillStyle='rgba(40,50,30,.16)'; g.beginPath(); g.ellipse(x+c*.695,fy+c*.882,c*.235,c*.052,0,0,7); g.fill();
    g.fillStyle='#8A6741'; rr2(g,x+c*.515,fy+c*.760,c*.055,c*.118,c*.016); g.fill();
    g.fillStyle='#8A6741'; rr2(g,x+c*.810,fy+c*.760,c*.055,c*.118,c*.016); g.fill();
    g.fillStyle='#A5814F'; rr2(g,x+c*.462,fy+c*.706,c*.462,c*.068,c*.022); g.fill();
    g.strokeStyle=brass; g.lineWidth=c*.014; rr2(g,x+c*.462,fy+c*.706,c*.462,c*.068,c*.022); g.stroke();
  }
  if(rank<=0){                                             // 양철 — 아직 수수하다
    drawGrowBowl(g,wx,wy,R,'#8B939E','#9AA0AB','#C3CAD2',null);
    if(food) drawGrowBowl(g,bx,by,R,'#A8734A','#C89557','#E0B27E',null);
  }else if(rank===1){                                      // 도기 — 색이 또렷해진다
    drawGrowBowl(g,wx,wy,R,'#4E86A8','#70A9C8','#BFE3ED',null);
    if(food) drawGrowBowl(g,bx,by,R,'#A34A34','#E07A5F','#B4763A',null);
  }else if(rank===2){                                      // 흰 도기 — 흰 마감과 한 벌
    drawGrowBowl(g,wx,wy,R,'#DCE7EE','#FFFFFF','#BFE3ED',null);
    g.strokeStyle='#70A9C8'; g.lineWidth=R*.11;
    g.beginPath(); g.ellipse(wx,wy+R*.10,R*.72,R*.24,0,0,7); g.stroke();
    if(food){ drawGrowBowl(g,bx,by,R,'#EFE2D4','#FFFFFF','#E07A5F',null);
      g.strokeStyle='#E07A5F'; g.beginPath(); g.ellipse(bx,by+R*.10,R*.72,R*.24,0,0,7); g.stroke(); }
  }else{                                                   // 놋쇠 테
    drawGrowBowl(g,wx,wy,R,'#DCE7EE','#FFFFFF','#BFE3ED',brass);
    if(food) drawGrowBowl(g,bx,by,R,'#EFE2D4','#FFFFFF','#B4763A',brass);
  }
}
// ── 1·2단계 그림 ───────────────────────────────────────────
// 좌표는 완성 도형 집에 맞췄다: 지붕 꼭대기 .10 · 처마 .44 · 벽 .16~.84 · 바닥 .88.
// 셋의 실루엣이 천막 .16 → 골조 .105 → 집 .10 으로 한 방향으로만 자란다.
const HT_CLOTH='#5A7EAE', HT_CLOTH_LO='#4C6E9C', HT_CLOTH_HEM='#3F5C85', HT_PATCH='#EDE3CB';
function houseShadow(g,x,y,c,cx,cy,rx,a){
  g.fillStyle='rgba(40,50,30,'+(a||.15)+')'; g.beginPath(); g.ellipse(x+c*cx,y+c*cy,c*rx,c*rx*.165,0,0,7); g.fill(); }
function housePoly(g,x,y,c,pts,col){
  g.fillStyle=col; g.beginPath(); g.moveTo(x+c*pts[0][0],y+c*pts[0][1]);
  for(let i=1;i<pts.length;i++) g.lineTo(x+c*pts[i][0],y+c*pts[i][1]);
  g.closePath(); g.fill(); }
function houseBlanket(g,x,y,c,cx,cy,r){                 // 맥스 담요 — 첫 칸부터 여기서 잔다
  g.fillStyle='#C9547A'; g.beginPath(); g.ellipse(x+c*cx,y+c*(cy+r*.10),c*r,c*r*.42,0,0,7); g.fill();
  g.fillStyle='#E8698A'; g.beginPath(); g.ellipse(x+c*cx,y+c*cy,c*r,c*r*.40,0,0,7); g.fill();
  g.fillStyle='#F28FA9'; g.beginPath(); g.ellipse(x+c*cx,y+c*(cy-r*.09),c*r*.74,c*r*.26,0,0,7); g.fill(); }
// ── 아이소메트릭 맥스 하우스 ─────────────────────────────────
// 2:1 다이메트릭(방위 45° · 고도 30°). 정면 대칭이던 집을 돌린 판이다(2026-09-18).
// 정면판은 처마·벽·바닥을 리터럴로 일일이 찍어야 했다 — 깊이가 없으니 마루는 사다리꼴로
// 흉내 내고 뼈대는 바닥이 없었다. 아이소는 세계 좌표를 한 번 말하면 투영이 알아서 한다.
//
// **마당의 나머지 아홉은 아직 정면이다** — 한 화면에 카메라가 둘이라는 뜻이고,
// 2026-09-17 에 전용 원화를 지웠던 것과 같은 상태다. 나머지를 옮길 때 이 리그를 그대로 쓴다.
//
// 기하: 앞변 W 1.02 · 깊이 D .46 · 벽 H .55 · 지붕 R .47 (한 칸 c 배수).
// 실루엣은 한 칸 안에 든다 — 실측 L .08 · R .955 · T .075 · B .91.
// 스텁 안전: clip·rect 를 안 쓴다(tests/growth-art.test.js 의 캔버스엔 둘이 없다).
const HS_W=1.02, HS_D=.46, HS_H=.55, HS_R=.47, HS_OX=.08, HS_OL=.02, HS_OY=.045, HS_TH=.048;
function houseRig(g,x,y,c){
  const ux=c*.50, uy=c*.25, uz=c*.50, Ox=x+c*.50, Oy=y+c*.695;
  const P=(a,b,z)=>[Ox+((a-HS_W/2)-(b-HS_D/2))*ux, Oy+((a-HS_W/2)+(b-HS_D/2))*uy-z*uz];
  const poly=(pts,col)=>{ g.fillStyle=col; g.beginPath();
    for(let i=0;i<pts.length;i++){ const q=P(pts[i][0],pts[i][1],pts[i][2]);
      i?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1]); } g.closePath(); g.fill(); };
  const seg=(p1,p2,col,lw)=>{ const a=P(p1[0],p1[1],p1[2]), b=P(p2[0],p2[1],p2[2]);
    g.strokeStyle=col; g.lineWidth=lw; g.lineCap='round';
    g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); };
  // 박공 면에 붙는 것(이름표·창·글자)은 면의 기울기를 탄다. 가로 한 칸이 화면에서
  // (ux, uy) 로 가므로 전단 한 번이면 **정확하다**: x'=x, y'=y+(uy/ux)·x. 세로는 화면
  // 세로 그대로라 글자가 눕지 않는다. 안 태우면 간판만 정면이라 스티커처럼 뜬다.
  const onGable=(pt,fn)=>{ g.save(); g.translate(pt[0],pt[1]);
    g.transform(1,uy/ux,0,1,0,0); fn(); g.restore(); };
  const shadow=(cx,cy,rx,ry,al)=>{ g.fillStyle='rgba(30,44,62,'+(al||.17)+')';
    g.beginPath(); g.ellipse(cx,cy,rx,ry,0,0,7); g.fill(); };
  return {ux,uy,uz,Ox,Oy,P,poly,seg,onGable,shadow};
}
// 색 한 벌에서 밝기만 옮긴다 — 살갗 넷과 색칠 다섯이 어떤 색을 줘도 면이 세 톤으로 갈린다.
function houseTone(h,k){
  const m=/^#([0-9a-fA-F]{6})$/.exec(String(h)); if(!m) return h;
  const n=parseInt(m[1],16), f=v=>Math.max(0,Math.min(255,Math.round(v*k)));
  return 'rgb('+f(n>>16&255)+','+f(n>>8&255)+','+f(n&255)+')';
}
// 집 앞 디딤돌 — 바닥면에 눕는다. 정면판에선 집 아래 한 칸에 찍던 것이다.
function drawHouseFront(g,x,y,c,skin,neat,rank,food){
  const {P}=houseRig(g,x,y,c);
  g.globalAlpha=neat?.85:.55; g.fillStyle='#C9BFA6';
  for(const [a,b] of [[HS_W*.34,HS_D+.34],[HS_W*.62,HS_D+.60],[HS_W*.16,HS_D+.66]]){
    const q=P(a,b,.004);
    g.beginPath(); g.ellipse(q[0],q[1],c*(neat?.105:.092),c*(neat?.050:.044),0,0,7); g.fill();
    if(neat){ g.strokeStyle='#FFF9F0'; g.lineWidth=c*.008; g.stroke(); } }
  g.globalAlpha=1;
}
// ── 1단계 천막 — 나뭇가지 둘에 천 한 장. 마룻대가 완성 집과 **같은 축**이라
// 삼각 실루엣이 그대로 지붕으로 이어진다. 천 색이 완성 집 지붕색이다.
function houseTent(g,x,y,c){
  const K=houseRig(g,x,y,c), {poly,seg,Ox,Oy}=K, TZ=.40, W=HS_W, D=HS_D;
  K.shadow(Ox,Oy+c*.07,c*.40,c*.13);
  poly([[W/2,-.02,TZ],[W/2,D+.02,TZ],[-.02,D+.02,0],[-.02,-.02,0]],'#4E739E');
  poly([[W/2,-.02,TZ],[W/2,D+.02,TZ],[W+.02,D+.02,0],[W+.02,-.02,0]],'#6B8FC0');
  for(let k=.22;k<1;k+=.26){ const ax=W/2+(W+.02-W/2)*k;
    seg([ax,-.02,TZ*(1-k)],[ax,D+.02,TZ*(1-k)],'rgba(255,255,255,.14)',c*.014); }
  poly([[.06,D+.02,0],[W/2,D+.02,TZ],[W-.06,D+.02,0]],'#30425A');
  poly([[.06,D+.02,0],[W/2,D+.02,TZ],[W/2-.14,D+.02,0]],'#5A82B0');
  poly([[W-.06,D+.02,0],[W/2,D+.02,TZ],[W/2+.14,D+.02,0]],'#3F5E85');
  // 맥스의 담요 — 이게 3단계 문 안으로 그대로 들어간다
  poly([[W/2-.15,D+.02,0],[W/2+.15,D+.02,0],[W/2+.15,D+.02,.055],[W/2-.15,D+.02,.055]],'#C9547A');
  poly([[W/2-.10,D+.02,.028],[W/2+.10,D+.02,.028],[W/2+.10,D+.02,.055],[W/2-.10,D+.02,.055]],'#E8698A');
  seg([W/2,-.02,TZ+.05],[W/2-.10,-.02,0],'#8A6B44',c*.022);
  seg([W/2,D+.02,TZ+.05],[W/2+.10,D+.02,0],'#8A6B44',c*.022);
  seg([W/2,-.02,TZ],[W/2,D+.02,TZ],'#9B7B50',c*.020);
}
// ── 2단계 뼈대 — 완성 집과 **같은 윤곽**, 속만 빔. 아이소라 토대가 진짜 사각형으로
// 보인다(정면판에선 바닥이 아예 없었다). 천은 마룻대에 걸쳐 임시 지붕이 된다.
function houseFrame(g,x,y,c){
  const K=houseRig(g,x,y,c), {P,poly,seg,Ox,Oy}=K;
  const W=HS_W, D=HS_D, H=HS_H, R=HS_R, PW='#B08A56', PD='#8A6B44', PL='#C9A87A';
  K.shadow(Ox,Oy+c*.07,c*.42,c*.135);
  poly([[-.04,-.06,0],[W+.04,-.06,0],[W+.04,D+.06,0],[-.04,D+.06,0]],'#C3A277');
  poly([[0,0,0],[W,0,0],[W,D,0],[0,D,0]],'#A8875C');
  poly([[0,0,.06],[W,0,.06],[W,D,.06],[0,D,.06]],'#C9A87A');
  seg([0,0,0],[0,0,H],PD,c*.030); seg([W,0,0],[W,0,H],PD,c*.030);
  seg([W/2,-HS_OY,H+R],[W/2,D+HS_OY,H+R],PL,c*.026);
  for(const b of [0,D/2,D]){
    seg([W/2,b,H+R],[-HS_OL,b,H-.02],PW,c*.020);
    seg([W/2,b,H+R],[W+HS_OX,b,H-.02],PD,c*.020);
    seg([0,b,H],[W,b,H],PW,c*.018); }
  seg([0,0,H],[0,D,H],PW,c*.020); seg([W,0,H],[W,D,H],PD,c*.020);
  seg([0,D,0],[0,D,H],PL,c*.030); seg([W,D,0],[W,D,H],PW,c*.030);
  poly([[W/2,-.02,H+R],[W/2,D*.62,H+R],[W+.02,D*.62,H-.02],[W+.02,-.02,H-.02]],'#6B8FC0');
  poly([[W/2,D*.62,H+R],[W/2+.16,D*.62,H+R-.16],[W+.02,D*.62,H-.02]],'#4E739E');
  // 바닥에 굴러 있던 뼈다귀도 같이 걷었다 — 지붕 것과 한 벌이었다.
}
// ── 3~6단계 완성된 집 — 형태는 같고 살갗만 바뀐다 ────────────
function drawHouseStage(g,x,y,c,stage,opt){
  const o=opt||{}, st=Math.max(0,Math.min(5,stage|0)), skin=HOUSE_SKIN[st]||HOUSE_SKIN[2];
  if(st===0){ houseTent(g,x,y,c); return; }
  if(st===1){ houseFrame(g,x,y,c); return; }
  const K=houseRig(g,x,y,c), {P,poly,seg,onGable,Ox,Oy}=K;
  const W=HS_W, D=HS_D, H=HS_H, R=HS_R, OX=HS_OX, OL=HS_OL, OY=HS_OY, TH=HS_TH, HE=H-.02;
  const paint=(i,fb)=>(!o.plain && typeof pcol==='function' && pcol('house',i)) || fb;
  const wall=skin.wall, wallLo=skin.wallLo, roof=paint(0,skin.roof), eave=paint(1,skin.eave);
  if(o.front!==false) drawHouseFront(g,x,y,c,skin,st>=4,st-2,o.food);
  K.shadow(Ox+c*.02,Oy+c*.075,c*.44,c*.145);
  // 벽 둘 — 그늘진 오른면, 빛 받는 박공면
  poly([[W,0,0],[W,D,0],[W,D,H],[W,0,H]], houseTone(wall,.74));
  if(skin.plank){ for(const t of [.26,.52,.78])                    // ★90 짙은 원목 결 — 가로
    seg([W,0,H*t],[W,D,H*t], houseTone(skin.plank,.80), Math.max(1,c*.010)); }
  else { for(let t=.18;t<1;t+=.26)
    poly([[W,D*t,0],[W,D*(t+.012),0],[W,D*(t+.012),H],[W,D*t,H]], houseTone(wall,.68)); }
  poly([[0,D,0],[W,D,0],[W,D,H],[0,D,H]], wall);
  if(skin.grain){ for(const px of [.22,.40,.60,.78])               // ★60 칠한 널 — 세로 결
    seg([W*px,D,0],[W*px,D,H], skin.grain, Math.max(1,c*.010)); }
  poly([[0,D,H],[W/2,D,H+R],[W,D,H]], houseTone(wallLo,.90));
  for(const px of [.24,.38,.62,.76]){ const tt=Math.abs(px-.5)/.5;
    poly([[W*px,D,H],[W*(px+.016),D,H],[W*(px+.016),D,H+R*(1-tt)],[W*px,D,H+R*(1-tt)]], houseTone(wallLo,.88)); }
  // 문 — 벽을 판 두 톤 + 바닥선 + 천막에서 온 담요
  const dw=.38, dh=.48, dl=W/2-dw/2, dr=W/2+dw/2;
  poly([[dl,D,0],[dr,D,0],[dr,D,dh],[dl,D,dh]],'#3B2E1E');
  poly([[dl,D,0],[dl+dw*.42,D,0],[dl+dw*.42,D,dh-.03],[dl,D,dh-.03]],'#58462F');
  poly([[dl,D,0],[dr,D,0],[dr,D,.045],[dl,D,.045]],'#6E5C43');
  poly([[dl+.04,D,0],[dr-.04,D,0],[dr-.04,D,.10],[dl+.04,D,.10]],'#A8446A');
  poly([[dl+.04,D,.045],[dr-.04,D,.045],[dr-.04,D,.10],[dl+.04,D,.10]],'#C9547A');
  poly([[dl+.07,D,.07],[dr-.09,D,.07],[dr-.09,D,.10],[dl+.07,D,.10]],'#E8698A');
  const fr=skin.trim||houseTone(wallLo,.80);
  seg([dl,D,0],[dl,D,dh],fr,c*.030); seg([dr,D,0],[dr,D,dh],fr,c*.030);
  seg([dl-.012,D,dh],[dr+.012,D,dh],fr,c*.032);
  if(st===4){ for(const wx of [.245,.755]){                        // ★75 문 양옆 창
    poly([[W*wx-.075,D,.17],[W*wx+.075,D,.17],[W*wx+.075,D,.36],[W*wx-.075,D,.36]],'#FFFFFF');
    poly([[W*wx-.055,D,.19],[W*wx+.055,D,.19],[W*wx+.055,D,.34],[W*wx-.055,D,.34]],'#BBD3E8');
    seg([W*wx,D,.19],[W*wx,D,.34],'#FFFFFF',c*.012);
    seg([W*wx-.055,D,.265],[W*wx+.055,D,.265],'#FFFFFF',c*.012); } }
  if(skin.brass){ seg([0,D,0],[0,D,H],'#F1E7D2',c*.028);           // ★90 크림 귀틀과 굽도리
    seg([W,D,0],[W,D,H],'#F1E7D2',c*.028);
    seg([0,D,.022],[W,D,.022],'#F1E7D2',c*.026); }
  // 지붕 — 마루가 세로축, 면 둘이 뒤로·옆으로 눕는다
  poly([[W/2,-OY,H+R],[W/2,D+OY,H+R],[-OL,D+OY,HE],[-OL,-OY,HE]], houseTone(roof,.80));
  poly([[W/2,-OY,H+R],[W/2,D+OY,H+R],[W+OX,D+OY,HE],[W+OX,-OY,HE]], roof);
  for(let k=.18;k<1;k+=.20){ const ax=W/2+(W+OX-W/2)*k, az=H+R+(HE-(H+R))*k;
    seg([ax,-OY,az],[ax,D+OY,az], houseTone(roof,.86), Math.max(1,c*.016)); }
  poly([[W+OX,-OY,HE],[W+OX,D+OY,HE],[W+OX,D+OY,HE-TH],[W+OX,-OY,HE-TH]], houseTone(eave,1.0));
  poly([[W/2,D+OY,H+R],[W+OX,D+OY,HE],[W+OX,D+OY,HE-TH],[W/2,D+OY,H+R-TH]], houseTone(eave,1.14));
  poly([[-OL,D+OY,HE],[W/2,D+OY,H+R],[W/2,D+OY,H+R-TH],[-OL,D+OY,HE-TH]], houseTone(eave,.82));
  seg([W/2,-OY,H+R],[W/2,D+OY,H+R], houseTone(roof,1.22), Math.max(1,c*.026));
  if(skin.trim){ for(let i=0;i<7;i++){ const b=-OY+(D+OY*2)*(i/7);  // ★75 처마 물결
    const q=P(W+OX,b+(D+OY*2)/14,HE-TH);
    g.fillStyle=skin.trim; g.beginPath(); g.ellipse(q[0],q[1],c*.030,c*.022,0,0,7); g.fill(); } }
  if(st===5){                                                       // ★90 현관등 — 켜져 있다
    const q=P(W+OX,D+OY,HE-TH-.14);
    seg([W+OX,D+OY,HE-TH],[W+OX,D+OY,HE-TH-.10],'#6E5335',Math.max(1,c*.013));
    g.fillStyle='rgba(246,207,104,.30)'; g.beginPath(); g.arc(q[0],q[1],c*.095,0,7); g.fill();
    g.fillStyle='#F6CF68'; g.beginPath(); g.ellipse(q[0],q[1],c*.032,c*.042,0,0,7); g.fill();
    g.fillStyle='#FFF3C8'; g.beginPath(); g.ellipse(q[0],q[1]-c*.006,c*.016,c*.022,0,0,7); g.fill();
    g.fillStyle=skin.brass||'#C89243'; g.beginPath(); g.ellipse(q[0],q[1]-c*.046,c*.034,c*.013,0,0,7); g.fill(); }
  // 이름표 — 박공 **안**에 든다. 면을 같이 타야 붙어 보인다.
  onGable(P(W/2,D,H+R*.44),()=>{
    g.fillStyle=skin.brass||skin.trim||'#E7D9BC';
    g.beginPath(); g.ellipse(0,0,c*.092,c*.042,0,0,7); g.fill();
    g.strokeStyle='rgba(60,44,26,.30)'; g.lineWidth=Math.max(1,c*.010); g.stroke();
    g.fillStyle=skin.brass?'#4A3A16':'#6B5230'; g.textAlign='center'; g.textBaseline='middle';
    g.font='800 '+(c*.048)+'px '+CFONT; g.fillText('MAX',0,c*.004); });
  // 지붕 위 뼈다귀 간판은 걷었다(2026-09-22). 박공 꼭대기에서 실루엣의 맨 위를 잡느라
  // 멀리서 보면 집이 **뼈 모자를 쓴 것**으로 읽혔고, 이름은 그 아래 MAX 놋쇠 패가 이미 말한다.
}
// ── 애드온 셋 — 4·5·6단계. 아이소라 셋 다 **진짜 면**이 된다.
// 정면판에선 차양이 사다리꼴, 마루가 눈속임 사다리꼴, 장작이 벽에 붙은 원이었다.
function drawHouseGrow(g,x,y,c,stage,opt){
  const st=Math.max(0,Math.min(5,stage|0));
  if(st<3) return drawHouseStage(g,x,y,c,st,opt);
  if(st>=4) houseDeck(g,x,y,c);           // 마루가 집을 받친다 — 집보다 먼저
  drawHouseStage(g,x,y,c,st,opt);
  if(st>=3) houseAwning(g,x,y,c);
  if(st>=5) houseRustic(g,x,y,c);
}
// 4단계 그늘 천막 — 오른쪽 긴 면에서 기울어 나오는 평면. 밥그릇이 그 그늘에 놓인다.
function houseAwning(g,x,y,c){
  const K=houseRig(g,x,y,c), {P,poly,seg}=K;
  const W=HS_W, D=HS_D, H=HS_H, AX=W+.34, AZ0=H-.10, AZ1=H-.20;
  { const q=P(AX-.10,D/2,0); K.shadow(q[0],q[1]+c*.01,c*.17,c*.065,.13); }
  poly([[W,-.02,AZ0],[W,D+.02,AZ0],[AX,D+.02,AZ1],[AX,-.02,AZ1]],'#6BAE9C');
  for(const [a,b] of [[.04,.14],[.22,.32],[.40,.50]])
    poly([[W,a,AZ0],[W,b,AZ0],[AX,b,AZ1],[AX,a,AZ1]],'#EFE3C6');
  seg([W,-.02,AZ0],[W,D+.02,AZ0],'#4F8B7C',Math.max(1,c*.016));
  for(let k=0;k<5;k++){ const b=-.02+k*.10;                    // 물결 자락 — 두께가 있어야 천이 된다
    poly([[AX,b,AZ1],[AX,b+.10,AZ1],[AX,b+.10,AZ1-.055],[AX,b+.05,AZ1-.085],[AX,b,AZ1-.055]],
         (k%2)?'#EFE3C6':'#5E9D8B'); }
  seg([AX,-.02,AZ1],[AX,-.02,0],'#9B7040',Math.max(1,c*.024));
  seg([AX,D+.02,AZ1],[AX,D+.02,0],'#8A6237',Math.max(1,c*.024));
  { const q=P(AX-.16,D*.56,0);
    g.fillStyle='rgba(30,44,62,.16)'; g.beginPath(); g.ellipse(q[0],q[1]+c*.012,c*.070,c*.024,0,0,7); g.fill();
    g.fillStyle='#C8663E'; g.beginPath(); g.ellipse(q[0],q[1],c*.066,c*.028,0,0,7); g.fill();
    g.fillStyle='#E07E52'; g.beginPath(); g.ellipse(q[0],q[1]-c*.012,c*.056,c*.022,0,0,7); g.fill();
    g.fillStyle='#8A5A2E'; g.beginPath(); g.ellipse(q[0],q[1]-c*.014,c*.038,c*.014,0,0,7); g.fill(); }
}
// 5단계 나무 마루 — 아이소가 제 값을 하는 단계. 두께 두 면과 계단이 생긴다.
function houseDeck(g,x,y,c){
  const K=houseRig(g,x,y,c), {P,poly,seg}=K;
  const W=HS_W, D=HS_D, L=-.16, Rr=W+.16, B=D+.46, F=-.10, DZ=.10;
  poly([[L,F,DZ],[Rr,F,DZ],[Rr,B,DZ],[L,B,DZ]],'#D9A96A');
  for(let t=.06;t<1;t+=.115) seg([L,F+(B-F)*t,DZ],[Rr,F+(B-F)*t,DZ],'#C4904E',Math.max(1,c*.008));
  poly([[L,B,DZ],[Rr,B,DZ],[Rr,B,DZ-.075],[L,B,DZ-.075]],'#B8863F');
  poly([[Rr,F,DZ],[Rr,B,DZ],[Rr,B,DZ-.075],[Rr,F,DZ-.075]],'#9C6C31');
  poly([[W/2-.24,B,DZ-.05],[W/2+.24,B,DZ-.05],[W/2+.24,B+.16,DZ-.05],[W/2-.24,B+.16,DZ-.05]],'#C99A5C');
  poly([[W/2-.24,B+.16,DZ-.05],[W/2+.24,B+.16,DZ-.05],[W/2+.24,B+.16,0],[W/2-.24,B+.16,0]],'#A8743F');
  const rail=[[Rr,F],[Rr,B*.42],[Rr,B*.84],[W*.62,B],[W*.10,B],[L,B*.84]];
  for(const [a,b] of rail) seg([a,b,DZ],[a,b,DZ+.26],'#A8743F',Math.max(1,c*.022));
  for(let i=0;i<rail.length-1;i++)
    seg([rail[i][0],rail[i][1],DZ+.24],[rail[i+1][0],rail[i+1][1],DZ+.24],'#C08B4E',Math.max(1,c*.020));
  { const q=P(W*.22,B-.18,DZ);                                  // 맥스의 공
    g.fillStyle='rgba(30,44,62,.16)'; g.beginPath(); g.ellipse(q[0],q[1]+c*.010,c*.052,c*.018,0,0,7); g.fill();
    g.fillStyle='#D9453F'; g.beginPath(); g.arc(q[0],q[1]-c*.028,c*.048,0,7); g.fill();
    g.fillStyle='#F07A6E'; g.beginPath(); g.arc(q[0]-c*.014,q[1]-c*.042,c*.018,0,7); g.fill(); }
}
// 6단계 장작더미와 등불 — 통나무 **마구리가 이쪽을 본다**(아이소에서만 되는 그림).
// 오른쪽 벽에 기대면 차양 기둥과 겹쳐 둘 다 안 읽혔다(실측) — 마루 앞 왼쪽 구석으로.
function houseRustic(g,x,y,c){
  const K=houseRig(g,x,y,c), {P,poly,seg,onGable}=K;
  const D=HS_D, H=HS_H, DZ=.10, BX=-.10, BY=D+.16;
  for(let row=0;row<3;row++){ const n=3-row, bz=DZ+row*.085;
    for(let i=0;i<n;i++){ const bx=BX+row*.048+i*.115;
      poly([[bx,BY,bz],[bx+.105,BY,bz],[bx+.105,BY+.30,bz],[bx,BY+.30,bz]],'#6E5335');
      onGable(P(bx+.0525,BY+.30,bz+.042),()=>{
        g.fillStyle='#5E4529'; g.beginPath(); g.ellipse(0,0,c*.030,c*.028,0,0,7); g.fill();
        g.fillStyle='#C9A87A'; g.beginPath(); g.ellipse(0,-c*.002,c*.023,c*.021,0,0,7); g.fill();
        g.strokeStyle='#A5814F'; g.lineWidth=Math.max(1,c*.005);
        g.beginPath(); g.ellipse(0,0,c*.012,c*.011,0,0,7); g.stroke(); }); } }
  const lz=H-.10, q=P(-HS_OL,D+HS_OY,lz);
  seg([-HS_OL,D+HS_OY,H-.02],[-HS_OL,D+HS_OY,lz+.04],'#6E5335',Math.max(1,c*.013));
  g.fillStyle='rgba(255,214,140,.20)'; g.beginPath(); g.arc(q[0],q[1],c*.115,0,7); g.fill();
  g.fillStyle='#5E4529'; g.beginPath(); g.ellipse(q[0],q[1]-c*.052,c*.036,c*.013,0,0,7); g.fill();
  g.fillStyle='#FFD98A'; g.beginPath(); g.ellipse(q[0],q[1],c*.032,c*.042,0,0,7); g.fill();
  g.fillStyle='#FFF3C8'; g.beginPath(); g.ellipse(q[0],q[1]-c*.006,c*.016,c*.022,0,0,7); g.fill();
  g.fillStyle='#5E4529'; g.beginPath(); g.ellipse(q[0],q[1]+c*.044,c*.034,c*.012,0,0,7); g.fill();
}
// 캔버스를 안 가리는 rr — 전역 rr 은 ctx 에 묶여 있어 아이콘 캔버스에 못 쓴다.
function rr2(g,x,y,w,h,r){ g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r);
  g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); }
GROWTH_ART.house=(g,x,y,c,stage,opt)=>drawHouseGrow(g,x,y,c,stage,opt);
// plain: 색칠(paintOn)을 무시하고 원래 색으로. 본편 보드의 개집이 그 경우다 —
// 마당에서 칠한 분홍 지붕이 250판 배경에 끼어들면 판 아트가 통제를 벗어난다.
// h>1 이면 마당 전용 2칸 배치(집채 + 앞마당). S 를 주면 그 픽셀 크기로 그린다.
// ── 2~5동네 성장 그림 ───────────────────────────────────────
// 원본: art/yard-items/growth-02-05.html. 좌표는 전부 한 칸(c) 배수다.
// 게임에 이미 있는 그림은 다시 안 그린다 — 첨벙통 몸통·작물이 그 경우다.
// ══════════════════════════════════════════════════════════════════
// ── 마당 물건 아홉 — 아이소메트릭(2026-09-19) ─────────────────────
// 집(drawHouseStage)에 이어 나머지 아홉을 같은 카메라로 옮겼다. 2:1 다이메트릭,
// 방위 45° · 고도 30°. 색은 타이틀 원화(art/title-main.jpg)를 찍어 온 값이다 —
// 지붕 세이지 #618351 · 벽 #D9C090 · 울타리 #CEA671 · 잔디 #B1CA7D. 옛 회청 함석과
// 주황 나무는 계열이 달라 한 화면에서 따로 놀았다.
//
// **규칙 셋을 아홉 채가 똑같이 지킨다.**
//  ① 접지 그림자 0. 부피는 면 세 톤(윗 1.09 · 앞 .94 · 오른 .78) + 앞·오른 세로 모서리
//     어두운 선이 낸다. 그림자를 안 쓰니 물건마다 **기초**(돌·벽돌·타일·둔덕)를 깔아 앉힌다.
//  ② 깊이 정렬. 조각마다 at(a+b) 로 깊이를 달고 flush() 로 한 번에 쏟는다 — 줄 순서로
//     그리면 뒤에 선 표지판이 지붕 위에 얹힌다(실측).
//  ③ 모서리는 살짝만(.028c). 34° 미만 예각은 안 둥글린다 — arcTo 접점이 r/tan(θ/2) 라
//     지붕면 같은 6° 예각에 15px 을 주면 도형이 통째로 터진다(bbox 실측으로 잡음).
// 스텁 안전: clip·rect 를 안 쓴다. translate/transform 은 tests/growth-art 스텁에 넣어 뒀다.
(function(){
const T=(h,k)=>{const m=/^#([0-9a-fA-F]{6})$/.exec(String(h));if(!m)return h;
  const n=parseInt(m[1],16),f=v=>Math.max(0,Math.min(255,Math.round(v*k)));
  return 'rgb('+f(n>>16&255)+','+f(n>>8&255)+','+f(n&255)+')';};
const WD='#E2C79A', TN='#7E9C66', STONE='#C6C8AE', SAGE='#7E9C66', LEAF='#6E9149', WATER='#6FA8B8', CREAM='#F7F2E6', BR='#C08A3E', CB='#D9AE7A', WD2='#C7A876', WD3='#9E8053', WD4='#806645', BRICK='#CDA57E', SAGE2='#5F7D4D', SAGE3='#9EBB86', TILE='#D4DCC7', LEAF2='#9EBD64', LEAF3='#B4CF7B', WATER2='#9BC6D6', WATER3='#B4D6E1', CREAM2='#F2EADB', CREAM3='#E9E0CB', BR2='#DDA95C', RED='#CC6B5E', ORG='#DDA25A', CB2='#C79A66';
const PAL=[RED,ORG,SAGE,WATER,'#B08BC0'];
// 흙·풀·나무껍질 — 언덕과 나무가 쓴다. 지붕 팔레트(SAGE 계열)와 따로 둔다.
const SOIL='#A98C64', GRASS='#B4CF7B', BARK='#9A7B4F';
const roofOf=GROWTH_ROOF;   // 지붕은 동네 색이다 — 표는 GROWTH_ART 옆에 있다
const growRig=function(g,x,y,c,W,D,by,cxc){
  const ux=c*.50, uy=c*.25, uz=c*.50;
  const cx=x+c*(cxc==null?0.5:cxc), Oy=y+c*(by==null?.70:by);
  const P=(a,b,z)=>[cx+((a-W/2)-(b-D/2))*ux, Oy+((a-W/2)+(b-D/2))*uy-z*uz];
  const poly=(pts,col)=>{ g.fillStyle=col; g.beginPath();
    for(let i=0;i<pts.length;i++){ const q=P(pts[i][0],pts[i][1],pts[i][2]);
      i?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1]); } g.closePath(); g.fill(); };
  // 투영한 다각형의 모서리를 둥글린다. r 은 화면 픽셀.
  // **모서리 각을 봐야 한다.** arcTo 의 접점 거리는 r/tan(θ/2) 라, 지붕면처럼 6° 짜리
  // 예각에서 r=15px 를 주면 접점이 286px 밖으로 나가 도형이 통째로 터진다(실측:
  // bbox 가 [231,40,445,130] 에서 [312,0,524,107] 로 튀었다). 꼭짓점마다 들어갈
  // 만큼만 준다: r_i = min(r, (짧은 변/2)·tan(θ/2)).
  const roundPoly=(pts,r,col)=>{
    const q=pts.map(p=>P(p[0],p[1],p[2])), n=q.length;
    const sub=(a,b)=>[a[0]-b[0],a[1]-b[1]], len=v=>Math.hypot(v[0],v[1]);
    const mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
    const rad=[];
    for(let i=0;i<n;i++){
      const pv=sub(q[(i-1+n)%n],q[i]), nv=sub(q[(i+1)%n],q[i]);
      const lp=len(pv), ln=len(nv);
      if(lp<1e-6||ln<1e-6){ rad.push(0); continue; }
      let cosA=(pv[0]*nv[0]+pv[1]*nv[1])/(lp*ln);
      cosA=Math.max(-1,Math.min(1,cosA));
      const half=Math.acos(cosA)/2;
      // 예각(34° 미만)은 **안 둥글린다**. 뾰족한 끝은 반지름이 아무리 작아도 길이를
      // 크게 잘라 먹는다 — 2.2px 만 줘도 지붕 끝이 42px 잘렸다(실측).
      if(half<0.30){ rad.push(0); continue; }
      rad.push(Math.max(0, Math.min(r, Math.min(lp,ln)*0.5*Math.tan(half))));
    }
    g.fillStyle=col; g.beginPath();
    const s0=mid(q[0],q[1]); g.moveTo(s0[0],s0[1]);
    for(let i=1;i<=n;i++){ const j=i%n, cur=q[j], nx=q[(j+1)%n], m=mid(cur,nx);
      if(rad[j]>0.5) g.arcTo(cur[0],cur[1], m[0],m[1], rad[j]);
      else { g.lineTo(cur[0],cur[1]); g.lineTo(m[0],m[1]); } }
    g.closePath(); g.fill();
  };
  const seg=(p1,p2,col,lw)=>{ const a=P(p1[0],p1[1],p1[2]), b=P(p2[0],p2[1],p2[2]);
    g.strokeStyle=col; g.lineWidth=lw; g.lineCap='round';
    g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); };
  // 상자 하나 — 윗면·왼앞면·오른면 세 톤 + 윗 모서리 빛. 그림자 없이 부피를 내는 최소 단위.
  const boxAt=(a0,b0,a1,b1,z0,z1,col,rr)=>{
    const r=(rr==null? .028:rr)*c;
    // 세 면의 밝기를 **크게** 벌린다 — 둥글리는 것보다 이게 입체를 읽히게 한다.
    roundPoly([[a1,b0,z0],[a1,b1,z0],[a1,b1,z1],[a1,b0,z1]], r, T(col,.78));  // 오른면 — 그늘
    roundPoly([[a0,b1,z0],[a1,b1,z0],[a1,b1,z1],[a0,b1,z1]], r, T(col,.94));  // 앞면
    roundPoly([[a0,b0,z1],[a1,b0,z1],[a1,b1,z1],[a0,b1,z1]], r, T(col,1.09)); // 윗면 — 빛
    seg([a0+.02,b1,z1],[a1-.02,b1,z1], T(col,1.34), Math.max(1,c*.014));      // 앞 윗 모서리
    seg([a1,b0+.02,z1],[a1,b1-.02,z1], T(col,1.24), Math.max(1,c*.012));      // 오른 윗 모서리
    seg([a1,b1,z0],[a1,b1,z1], T(col,.64), Math.max(1,c*.010));               // 앞 오른 세로 모서리
  };
  // 원기둥 — 위 타원 + 몸통 + 아래 반타원. 세로 결 대신 좌우 두 톤으로 둥글게.
  const tube=(a,b,z0,z1,r,col)=>{
    const q0=P(a,b,z0), q1=P(a,b,z1), rx=r*1.414*ux, ry=r*1.414*uy;
    g.fillStyle=T(col,.74); g.beginPath();
    g.moveTo(q1[0]-rx,q1[1]); g.lineTo(q0[0]-rx,q0[1]);
    g.ellipse(q0[0],q0[1],rx,ry,0,Math.PI,0,false);
    g.lineTo(q1[0]+rx,q1[1]); g.closePath(); g.fill();
    g.fillStyle=T(col,.98); g.beginPath();
    g.moveTo(q1[0]-rx,q1[1]); g.lineTo(q0[0]-rx,q0[1]);
    g.lineTo(q0[0]-rx*.10,q0[1]+ry*.34); g.lineTo(q1[0]-rx*.10,q1[1]+ry*.34); g.closePath(); g.fill();
    g.fillStyle=T(col,1.14); g.beginPath(); g.ellipse(q1[0],q1[1],rx,ry,0,0,7); g.fill();
    g.fillStyle=T(col,1.34); g.beginPath();
    g.ellipse(q1[0]-rx*.16,q1[1]-ry*.14,rx*.62,ry*.56,0,0,7); g.fill();
  };
  const disc=(a,b,z,r,col)=>{ const q=P(a,b,z); g.fillStyle=col;
    g.beginPath(); g.ellipse(q[0],q[1],r*1.414*ux,r*1.414*uy,0,0,7); g.fill(); };
  const onGable=(pt,fn)=>{ g.save(); g.translate(pt[0],pt[1]);
    g.transform(1,uy/ux,0,1,0,0); fn(); g.restore(); };
  const onSide=(pt,fn)=>{ g.save(); g.translate(pt[0],pt[1]);
    g.transform(1,-uy/ux,0,1,0,0); fn(); g.restore(); };
  // 박공집 — door={w,h} 면 앞벽을 셋으로 갈라 구멍을 남긴다(clip 안 씀).
  const hut=(a0,b0,a1,b1,z0,hh,rise,wall,roof,ov,door)=>{
    ov=ov==null?.05:ov; const mid=(a0+a1)/2, Z1=z0+hh, AP=Z1+rise, HE=Z1-.02;
    roundPoly([[a1,b0,z0],[a1,b1,z0],[a1,b1,Z1],[a1,b0,Z1]], c*.025, T(wall,.80));
    if(door){ const dl=mid-door.w/2, dr=mid+door.w/2, dz=z0+door.h;
      poly([[a0,b1,z0],[dl,b1,z0],[dl,b1,Z1],[a0,b1,Z1]], wall);
      poly([[dr,b1,z0],[a1,b1,z0],[a1,b1,Z1],[dr,b1,Z1]], wall);
      poly([[dl,b1,dz],[dr,b1,dz],[dr,b1,Z1],[dl,b1,Z1]], T(wall,.94));
    } else roundPoly([[a0,b1,z0],[a1,b1,z0],[a1,b1,Z1],[a0,b1,Z1]], c*.025, wall);
    roundPoly([[a0,b1,Z1],[mid,b1,AP],[a1,b1,Z1]], c*.025, T(wall,.90));
    roundPoly([[mid,b0-ov,AP],[mid,b1+ov,AP],[a0-ov*.4,b1+ov,HE],[a0-ov*.4,b0-ov,HE]], c*.02, T(roof,.78));
    roundPoly([[mid,b0-ov,AP],[mid,b1+ov,AP],[a1+ov,b1+ov,HE],[a1+ov,b0-ov,HE]], c*.02, roof);
    poly([[a1+ov,b0-ov,HE],[a1+ov,b1+ov,HE],[a1+ov,b1+ov,HE-.05],[a1+ov,b0-ov,HE-.05]], T(roof,.70));
    poly([[mid,b1+ov,AP],[a1+ov,b1+ov,HE],[a1+ov,b1+ov,HE-.05],[mid,b1+ov,AP-.05]], T(roof,.84));
    poly([[a0-ov*.4,b1+ov,HE],[mid,b1+ov,AP],[mid,b1+ov,AP-.05],[a0-ov*.4,b1+ov,HE-.05]], T(roof,.56));
    seg([mid,b0-ov,AP],[mid,b1+ov,AP], T(roof,1.26), Math.max(1,c*.024));
    return {mid,Z1,AP,HE};
  };
  // 깊이 정렬 — 아이소에서 앞뒤를 정하는 건 **a+b** 다(화면 세로와 같은 축).
  // 줄 순서대로 그리면 뒤에 선 표지판이 지붕 위에 얹힌다. 조각마다 깊이를 달아 두고
  // 마지막에 한 번 정렬해 쏟는다 — 마당의 스프라이트 정렬과 같은 규칙이다.
  const _L=[];
  const at=(d,fn)=>{ _L.push({d,fn}); };
  const flush=()=>{ _L.sort((p,q)=>p.d-q.d); for(const o of _L) o.fn(); _L.length=0; };
  return {ux,uy,uz,cx,Oy,P,poly,roundPoly,seg,boxAt,tube,disc,onGable,onSide,hut,at,flush,T};
};
// 둑·기단 — 두께 있는 원판. 연못·참나무·바람개비가 같이 쓴다.
const bank=(K,g,c,r,col)=>{ const q0=K.P(0,0,0), q1=K.P(0,0,.055);
  const rx=r*1.414*K.ux, ry=r*1.414*K.uy;
  g.fillStyle=T(col,.72); g.beginPath();
  g.moveTo(q1[0]-rx,q1[1]); g.lineTo(q0[0]-rx,q0[1]);
  g.ellipse(q0[0],q0[1],rx,ry,0,Math.PI,0,false);
  g.lineTo(q1[0]+rx,q1[1]); g.closePath(); g.fill();
  g.fillStyle=col; g.beginPath(); g.ellipse(q1[0],q1[1],rx,ry,0,0,7); g.fill(); };
const isoCart=function(g,K,c,ca,cb,s){
  const {P,seg,boxAt,onGable,roundPoly}=K;
  const HW=s*.64, HD=s*.26, BZ=s*.26, WR=s*.098;
  const wheel=(a,b,r)=>{ onGable(P(a,b,r),()=>{
    g.fillStyle='#3E3A34'; g.beginPath(); g.arc(0,0,c*r*1.12,0,7); g.fill();
    g.fillStyle='#4E4A42'; g.beginPath(); g.arc(-c*r*.16,-c*r*.20,c*r*.72,0,7); g.fill();
    g.fillStyle='#C9B789'; g.beginPath(); g.arc(0,0,c*r*.40,0,7); g.fill(); }); };
  wheel(ca-HW*.62, cb-HD*.86, WR*.86); wheel(ca+HW*.62, cb-HD*.86, WR*.86);
  // 손잡이 — 평판보다 먼저. 판 뒤에서 솟아난다(판 그림과 같은 순서).
  for(const d of [-HD*.60, HD*.60])
    seg([ca-HW*.88,cb+d,BZ],[ca-HW*1.18,cb+d,BZ+s*.62],'#28583C',Math.max(2,c*s*.080));
  seg([ca-HW*1.18,cb-HD*.60,BZ+s*.62],[ca-HW*1.18,cb+HD*.60,BZ+s*.62],'#28583C',Math.max(2,c*s*.086));
  seg([ca-HW*1.16,cb-HD*.50,BZ+s*.58],[ca-HW*1.16,cb+HD*.50,BZ+s*.58],'#3F7650',Math.max(1,c*s*.036));
  boxAt(ca-HW,cb-HD, ca+HW,cb+HD, BZ-s*.10, BZ, '#355F42', .04);   // 초록 테
  roundPoly([[ca-HW*.82,cb-HD*.70,BZ+.002],[ca+HW*.82,cb-HD*.70,BZ+.002],
             [ca+HW*.82,cb+HD*.70,BZ+.002],[ca-HW*.82,cb+HD*.70,BZ+.002]], c*.025,'#C29E66');
  for(let k=0;k<3;k++) seg([ca-HW*.82,cb-HD*.70+HD*.47*(k+.5),BZ+.004],
                           [ca+HW*.82,cb-HD*.70+HD*.47*(k+.5),BZ+.004],'#9E8053',Math.max(1,c*s*.020));
  wheel(ca-HW*.62, cb+HD*.92, WR); wheel(ca+HW*.62, cb+HD*.92, WR);
};
GROWTH_ART.colDig=function(g,x,y,c,i,opt){
  const W=.92, D=.68;
  const K=growRig(g,x,y,c,W,D,.70,1.0), {P,poly,seg,boxAt,tube,disc,onGable,onSide,hut,at,flush}=K;
  const dark=i>=5, white=i===4;
  const Z0=.10;
  // 벽돌 기초 — 그림자 대신 이게 땅에 앉힌다
  boxAt(-W/2-.05,-D/2-.05, W/2+.05,D/2+.05, 0,Z0, BRICK);
  for(let r=0;r<2;r++) for(let k=0;k<5;k++){ const a=-W/2+.02+k*.21+(r?.10:0);
    seg([a,D/2+.05,Z0-.020-r*.042],[a+.16,D/2+.05,Z0-.020-r*.042], T(BRICK,.80), Math.max(1,c*.008)); }
  // 상자밭 — **길게 하나**. 짧은 두 개는 온실 옆에서 부스러기처럼 보였다.
  // ★75 에서 흰색이 되는 건 **테두리**지 흙이 아니다 — 흰 흙은 흙으로 안 읽힌다.
  const BX=-1.02, BY=.34, BL=.62;                       // BL = 반길이(짧은 변의 두 배 이상)
  const bed=(side)=>at(BX+BY, ()=>{
    boxAt(BX-.24,BY-BL, BX+.24,BY+BL, 0,.11, side, .07);
    poly([[BX-.18,BY-BL+.05,.090],[BX+.18,BY-BL+.05,.090],
          [BX+.18,BY+BL-.05,.090],[BX-.18,BY+BL-.05,.090]],'#917449');
    const MODE = (window.PLANT_MODE||'one');
    for(let k=0;k<7;k++) for(let j=0;j<2;j++){
      const q=P(BX-.09+j*.18, BY-BL+.14+k*.158, .090), r=c*.026;
      const kind = MODE==='one'? 0 : MODE==='band'? (k<3?0:k<5?1:2) : ((k*2+j)%3);
      g.fillStyle='#6E9149'; g.beginPath(); g.ellipse(q[0],q[1]-r*.62,r*.82,r,0,0,7); g.fill();
      g.fillStyle='#9EBD64'; g.beginPath(); g.ellipse(q[0]-r*.34,q[1]-r*1.04,r*.60,r*.62,0,0,7); g.fill();
      if(kind===0){                                  // 잎채소 — 잎 한 겹 더
        g.fillStyle='#B4CF7B'; g.beginPath(); g.ellipse(q[0]+r*.30,q[1]-r*1.12,r*.44,r*.46,0,0,7); g.fill(); }
      else if(kind===1){                              // 열매 — 붉은 알 둘
        g.fillStyle='#CC6B5E'; g.beginPath(); g.arc(q[0]-r*.26,q[1]-r*1.18,r*.30,0,7); g.fill();
        g.fillStyle='#E08A78'; g.beginPath(); g.arc(q[0]+r*.30,q[1]-r*.92,r*.24,0,7); g.fill(); }
      else {                                          // 뿌리 — 흙 위로 주황 머리
        g.fillStyle='#DDA25A'; g.beginPath(); g.ellipse(q[0],q[1]-r*.30,r*.34,r*.26,0,0,7); g.fill();
        g.fillStyle='#B4CF7B'; g.beginPath(); g.ellipse(q[0]+r*.22,q[1]-r*1.02,r*.34,r*.40,0,0,7); g.fill(); } } });
  if(i===0){                                  // 1 · 돌 기초와 비닐
    at(0, ()=>{                                // **본체도 at 을 거쳐야** 밭보다 앞에 선다 —
      boxAt(-.30,-.10, .30,.16, Z0,Z0+.030, WD);   // 즉시 그리면 밭(-0.68)이 나중에 덮는다
      poly([[-.22,.16,Z0+.03],[.22,.16,Z0+.03],[.30,-.16,Z0+.56],[-.14,-.16,Z0+.56]],'rgba(206,232,226,.62)');
      seg([-.22,.16,Z0+.03],[-.14,-.16,Z0+.56],'#F2F7F4',Math.max(1,c*.014));
      seg([.22,.16,Z0+.03],[.30,-.16,Z0+.56],'#E4EEEB',Math.max(1,c*.014)); });
    bed(WD2); flush(); return;
  }
  if(i===1){                                  // 2 · 비닐하우스 골조
    at(0, ()=>{                                // 골조도 밭보다 **앞**이다
    for(const [a,b] of [[-W/2+.05,-D/2+.05],[W/2-.05,-D/2+.05],[-W/2+.05,D/2-.05],[W/2-.05,D/2-.05]])
      seg([a,b,Z0],[a,b,Z0+.46],'#E9E0CB',Math.max(2,c*.030));
    seg([0,-D/2-.05,Z0+.80],[0,D/2+.05,Z0+.80],'#F7F2E6',Math.max(2,c*.028));
    for(const b of [-D/2+.05,0,D/2-.05]){
      seg([0,b,Z0+.80],[-W/2-.02,b,Z0+.44],'#E9E0CB',Math.max(2,c*.022));
      seg([0,b,Z0+.80],[ W/2+.02,b,Z0+.44],'#D3C7AC',Math.max(2,c*.022)); } });
    bed(WD2); flush(); return;
  }
  // 3~6 · **비닐하우스**. 박공 지붕은 창고·집과 실루엣이 같아 구별이 안 됐다 —
  // 반원통 하나면 멀리서도 "저건 비닐하우스" 가 된다. 안에 든 화분을 필름보다 먼저 그린다.
  const R=.46, HB0=-D/2, HB1=D/2;                      // 아치 반지름 · 앞뒤 끝
  const AR=(th)=>[Math.cos(th)*R, Z0+Math.sin(th)*R*1.12];
  poly([[-W/2,-D/2,Z0],[W/2,-D/2,Z0],[W/2,D/2,Z0],[-W/2,D/2,Z0]],'#B39262');
  for(const [a,b,s2] of [[-.24,-.14,1],[.02,-.18,.86],[.24,-.04,.94],[-.06,.06,.78]]){
    const q=P(a,b,Z0);
    g.fillStyle=T(BRICK,.92); g.beginPath(); g.ellipse(q[0],q[1]-c*.018,c*.044*s2,c*.022*s2,0,0,7); g.fill();
    g.fillStyle='#6E9149'; g.beginPath(); g.ellipse(q[0],q[1]-c*.066*s2,c*.040*s2,c*.052*s2,0,0,7); g.fill();
    g.fillStyle='#9EBD64'; g.beginPath(); g.ellipse(q[0]-c*.017*s2,q[1]-c*.086*s2,c*.026*s2,c*.032*s2,0,0,7); g.fill(); }
  at(0, ()=>{                                  // 본체 — 비닐하우스
  const FILM = dark? '#BFD5B9' : '#DEEDDA';
  const N=16, far=[], near=[];
  for(let k=0;k<=N;k++){ const th=Math.PI*(1-k/N), p2=AR(th);
    far.push([p2[0],HB0,p2[1]]); near.push([p2[0],HB1,p2[1]]); }
  // 굽은 면 한 장 — 왼쪽 위가 밝고 오른쪽으로 갈수록 어둡다(세로 띠 넷).
  for(let k=0;k<N;k++){
    const t=k/N, col=T(FILM, 1.10 - t*0.34);
    poly([far[k],far[k+1],near[k+1],near[k]], col); }
  // 테 — 앞 끝 아치와 뒤 끝 아치
  for(let k=0;k<N;k++) seg(far[k],far[k+1],T(FILM,.72),Math.max(1,c*.010));
  // 골조 — 굽은 살 셋
  for(const bb of [HB0+D*.30, HB0+D*.62]){
    for(let k=0;k<N;k++){ const p2=AR(Math.PI*(1-k/N)), p3=AR(Math.PI*(1-(k+1)/N));
      seg([p2[0],bb,p2[1]],[p3[0],bb,p3[1]],'rgba(255,255,255,.34)',Math.max(1,c*.012)); } }
  // 앞 끝 — 반투명 필름 한 겹 + 문
  { g.fillStyle='rgba(236,250,246,.50)'; g.beginPath();
    const q0=P(near[0][0],near[0][1],near[0][2]); g.moveTo(q0[0],q0[1]);
    for(let k=1;k<=N;k++){ const q=P(near[k][0],near[k][1],near[k][2]); g.lineTo(q[0],q[1]); }
    g.closePath(); g.fill(); }
  for(let k=0;k<N;k++) seg(near[k],near[k+1],'#FFFFFF',Math.max(1,c*.020));
  seg([-R,HB1,Z0],[R,HB1,Z0],'#FFFFFF',Math.max(1,c*.020));
  { const dw=.17, dh=.40;                                 // 문 — 앞 끝 가운데
    poly([[-dw,HB1,Z0],[dw,HB1,Z0],[dw,HB1,Z0+dh],[-dw,HB1,Z0+dh]],'#8A7A5E');
    poly([[-dw,HB1,Z0],[0,HB1,Z0],[0,HB1,Z0+dh],[-dw,HB1,Z0+dh]],'#9C8A6E');
    seg([-dw,HB1,Z0+dh],[dw,HB1,Z0+dh],'#F2EADB',Math.max(1,c*.022));
    seg([-dw,HB1,Z0],[-dw,HB1,Z0+dh],'#F2EADB',Math.max(1,c*.022));
    seg([ dw,HB1,Z0],[ dw,HB1,Z0+dh],'#F2EADB',Math.max(1,c*.022)); }
  });                                          // ← 본체 끝
  bed(white?'#F7F2E6': dark?'#B39262':WD2);
  if(i>=3) at(W/2+.28+D/2+.06, ()=>{          // 4 · 수확 바구니 — 오른쪽 앞
    const a=W/2+.28,b=D/2+.06;
    boxAt(a-.15,b-.13, a+.15,b+.13, 0,.16, WD2);
    for(const [dx,dy,col] of [[-.05,-.03,'#D9453F'],[.04,.02,'#E8A94C'],[-.01,.05,'#B4CF7B']]){
      const q=P(a+dx,b+dy,.16); g.fillStyle=col;
      g.beginPath(); g.ellipse(q[0],q[1]-c*.024,c*.036,c*.032,0,0,7); g.fill();
      g.fillStyle=T(col,1.22); g.beginPath(); g.ellipse(q[0]-c*.012,q[1]-c*.034,c*.018,c*.015,0,0,7); g.fill(); } });
  if(i>=4) at(BX+BY+BL+.22, ()=>{             // 5 · 팻말 — 밭 앞 끝
    const a=BX,b=BY+BL+.22;
    seg([a,b,0],[a,b,.36],WD3,Math.max(1,c*.024));
    onGable(P(a,b,.42),()=>{ g.fillStyle='#F7F2E6';
      g.fillRect(-c*.12,-c*.060,c*.24,c*.11);
      g.fillStyle='rgba(90,74,52,.50)';
      g.fillRect(-c*.085,-c*.030,c*.15,c*.018); g.fillRect(-c*.085,c*.004,c*.10,c*.018); }); });
  if(i>=5) at(-.20+D/2+.42, ()=>{             // 6 · 놋쇠 물뿌리개
    const a=-.20,b=D/2+.42, q=P(a,b,0);
    g.fillStyle=T(BR,.78); g.beginPath(); g.ellipse(q[0],q[1]-c*.030,c*.052,c*.040,0,0,7); g.fill();
    g.fillStyle=BR; g.beginPath(); g.ellipse(q[0]-c*.010,q[1]-c*.044,c*.042,c*.030,0,0,7); g.fill();
    g.fillStyle='#DDA95C'; g.beginPath(); g.ellipse(q[0]-c*.016,q[1]-c*.052,c*.024,c*.016,0,0,7); g.fill();
    g.strokeStyle=BR; g.lineWidth=Math.max(2,c*.014); g.lineCap='round';
    g.beginPath(); g.moveTo(q[0]+c*.040,q[1]-c*.048); g.lineTo(q[0]+c*.098,q[1]-c*.016); g.stroke();
    g.beginPath(); g.moveTo(q[0]-c*.030,q[1]-c*.062); g.lineTo(q[0]-c*.004,q[1]-c*.092); g.stroke(); });
  flush();
};
GROWTH_ART.colBox=function(g,x,y,c,i,opt){
  const W=1.10, D=.72;
  const K=growRig(g,x,y,c,W,D,.72,1.0), {P,poly,seg,boxAt,tube,disc,onGable,onSide,hut,at,flush}=K;
  const dark=i>=5, white=i===4;
  const WALL = dark?'#B39262': white?'#F4EBD8':'#E2C79A';
  const ROOF = roofOf('colBox',dark);
  const Z0=.085;
  // 돌 기초 — 여섯 단계 내내 깔려 있다. 그림자를 안 쓰므로 이게 땅에 앉히는 일을 한다.
  boxAt(-W/2-.05,-D/2-.05, W/2+.05,D/2+.05, 0,Z0, STONE);
  for(let k=0;k<5;k++){ const a=-W/2+.05+k*.22;
    seg([a,D/2+.05,Z0-.012],[a,D/2+.05,.012], T(STONE,.80), Math.max(1,c*.010)); }
  if(i===0){                                  // 1 · 돌 기초와 널빤지
    for(let k=0;k<4;k++) boxAt(-.34,-.10+k*.004, .34,.14+k*.004, Z0+k*.032, Z0+.030+k*.032, WD);
    boxAt(.16,-.30, .48,-.16, Z0, Z0+.026, WD2);
    seg([.20,-.23,Z0+.028],[.52,-.23,Z0+.12],'#9EBB86',Math.max(1,c*.030));
    seg([.50,-.23,Z0+.11],[.60,-.23,Z0+.16],WD3,Math.max(1,c*.026));
    return;
  }
  if(i===1){                                  // 2 · 창고 골조
    boxAt(-W/2,-D/2, W/2,D/2, Z0,Z0+.05, WD2);
    for(const [a,b] of [[-W/2+.06,-D/2+.06],[W/2-.06,-D/2+.06],[-W/2+.06,D/2-.06],[W/2-.06,D/2-.06]])
      seg([a,b,Z0],[a,b,Z0+.52],WD2,Math.max(1,c*.030));
    seg([0,-D/2-.05,Z0+.86],[0,D/2+.05,Z0+.86],WD,Math.max(1,c*.026));
    for(const b of [-D/2+.06,0,D/2-.06]){
      seg([0,b,Z0+.86],[-W/2-.02,b,Z0+.50],WD2,Math.max(1,c*.020));
      seg([0,b,Z0+.86],[ W/2+.02,b,Z0+.50],WD3,Math.max(1,c*.020));
      seg([-W/2+.06,b,Z0+.52],[W/2-.06,b,Z0+.52],WD2,Math.max(1,c*.018)); }
    return;
  }
  // 3~6 · 창고. 안에 든 것이 문으로 보이도록 **먼저** 그린다.
  const DH=.42, dw=.40;
  at(0, ()=>{                                  // 본체 — 깊이 0(발자국 가운데)
  poly([[-W/2,-D/2,Z0],[W/2,-D/2,Z0],[W/2,D/2,Z0],[-W/2,D/2,Z0]],'#917449');
  poly([[-W/2,-D/2,Z0],[W/2,-D/2,Z0],[W/2,-D/2,Z0+.50],[-W/2,-D/2,Z0+.50]],'#8E7249');
  // 문으로 보이는 건 a-b 가 문 중심과 같은 것들뿐이다 — 상자를 그 선 위에 둔다.
  for(const [a,b,s2,col] of [[-.10,-.06,1,'#C08A5E'],[-.22,-.18,.86,'#B07B50'],[.02,.06,.72,'#CE9A6E']]){
    const w2=.20*s2, d2=.15*s2, h2=.20*s2;
    boxAt(a-w2/2,b-d2/2, a+w2/2,b+d2/2, Z0, Z0+h2, col);
    seg([a-w2/2,b+d2/2,Z0+h2*.6],[a+w2/2,b+d2/2,Z0+h2*.6],'#F2EADB',Math.max(1,c*.010)); }
  const h=hut(-W/2,-D/2, W/2,D/2, Z0,.50,.40, WALL, ROOF,.07,{w:dw,h:DH});
  for(const t of [.22,.46,.70]) seg([W/2,-D/2+D*t,Z0],[W/2,-D/2+D*t,Z0+.50],T(WALL,.62),Math.max(1,c*.010));
  // 문틀과 열린 문짝
  seg([-dw/2,D/2,Z0],[-dw/2,D/2,Z0+DH],T(WALL,.66),Math.max(1,c*.028));
  seg([ dw/2,D/2,Z0],[ dw/2,D/2,Z0+DH],T(WALL,.66),Math.max(1,c*.028));
  seg([-dw/2-.02,D/2,Z0+DH],[dw/2+.02,D/2,Z0+DH],T(WALL,.66),Math.max(1,c*.030));
  poly([[dw/2,D/2,Z0],[dw/2+.26,D/2+.17,Z0],[dw/2+.26,D/2+.17,Z0+DH],[dw/2,D/2,Z0+DH]],T(WALL,.86));
  seg([dw/2+.02,D/2+.01,Z0+.05],[dw/2+.24,D/2+.16,Z0+DH-.05],T(WALL,.62),Math.max(1,c*.014));
  for(let k=.18;k<1;k+=.20){ const ax=(W/2+.07)*k, az=h.AP+(h.HE-h.AP)*k;
    seg([ax,-D/2-.07,az],[ax,D/2+.07,az],T(ROOF,.84),Math.max(1,c*.016)); }
  });                                          // ← 본체 끝
  at(D/2+.17, ()=>{                            // 짐 내리는 경사판 — 문 앞
    poly([[-dw/2,D/2,Z0],[dw/2,D/2,Z0],[dw/2+.04,D/2+.34,0],[-dw/2-.04,D/2+.34,0]],T(WD,.94));
    for(let k=1;k<4;k++){ const t=k/4;
      seg([-dw/2-t*.04,D/2+t*.34,Z0*(1-t)],[dw/2+t*.04,D/2+t*.34,Z0*(1-t)],WD3,Math.max(1,c*.009)); } });
  // 손수레 — 판에서 쓰는 그림 그대로(drawCartOn). 새로 그리면 같은 물건이 둘이 된다.
  at(.58+D/2+.30, ()=>isoCart(g,K,c,.58,D/2+.30,.52));
  if(i>=3) at(-W/2-.22+D/2-.02, ()=>{         // 4 · 배송 표지판 — 창고 왼쪽 **뒤**
    const a=-W/2-.22,b=D/2-.02;
    seg([a,b,0],[a,b,.56],WD3,Math.max(1,c*.030));
    onGable(P(a,b,.62),()=>{
      g.fillStyle=WD; g.beginPath();
      g.moveTo(-c*.13,-c*.07); g.lineTo(c*.10,-c*.07); g.lineTo(c*.17,0); g.lineTo(c*.10,c*.07);
      g.lineTo(-c*.13,c*.07); g.closePath(); g.fill();
      g.fillStyle='rgba(90,74,52,.55)';
      g.fillRect(-c*.09,-c*.035,c*.16,c*.020); g.fillRect(-c*.09,c*.008,c*.11,c*.020); }); });
  if(i>=4) at(W/2+.42-D/2+.20, ()=>{          // 5 · 흰 우편함
    const a=W/2+.42,b=-D/2+.20;
    seg([a,b,0],[a,b,.34],WD3,Math.max(1,c*.026));
    boxAt(a-.10,b-.08, a+.10,b+.08, .34,.50,'#F7F2E6');
    poly([[a-.10,b+.08,.50],[a+.10,b+.08,.50],[a+.10,b+.08,.56],[a-.10,b+.08,.56]],'#E9E0CB');
    seg([a-.10,b+.08,.53],[a+.10,b+.08,.53],'#C8663E',Math.max(1,c*.016)); });
  if(i>=5){                                   // 6 · 건초와 도구
    for(const [a,b] of [[-W/2-.20,D/2+.26],[-W/2+.04,D/2+.54]]) at(a+b, ()=>{
      boxAt(a-.15,b-.12, a+.15,b+.12, 0,.22,'#EAD79A');
      seg([a-.15,b+.12,.14],[a+.15,b+.12,.14],T('#EAD79A',.74),Math.max(1,c*.012)); });
    for(const [d,col,hd] of [[0,'#B39262','#9EBB86'],[.10,'#C7A876','#8CA47A']])
      at(W/2+.46+d+D/2-.20, ()=>{
        seg([W/2+.46+d,D/2-.20,0],[W/2+.38+d,D/2-.26,.52],col,Math.max(2,c*.040));
        const q=P(W/2+.38+d,D/2-.26,.56); g.fillStyle=hd;
        g.beginPath(); g.ellipse(q[0],q[1],c*.055,c*.040,0.4,0,7); g.fill();
        g.fillStyle=T(hd,1.18); g.beginPath(); g.ellipse(q[0]-c*.014,q[1]-c*.012,c*.030,c*.020,0.4,0,7); g.fill(); }); }
  flush();
};
GROWTH_ART.colBrook=function(g,x,y,c,i,opt){
  // 3동네 — **오리 연못**(2026-09-22 되돌려 다시 그림).
  // 하루는 칸을 가로지르는 개울로 그렸다 물렸다. 마당은 한 자리에 한 물건이라 물줄기
  // 양 끝이 허공에서 잘리고, 단계 여섯 이름과도 어긋났다(3단계가 「오리집」인데 판자
  // 다리를 놨다). 코드에도 그 결론이 이미 적혀 있다 — BROOK_TERRAIN_ON 은 옛 지형
  // 개울이고, **한 자리 물건으로 옮기면서 연못이 됐다.** colBrook 은 그때의 옛 키다.
  // 단계 이름이 곧 이 그림의 차례다: 마른 웅덩이 · 물과 발판 · 오리집 · 첫 오리 ·
  // 흰 돌과 수련 · 오리 둘과 등불.
  //
  // **오리집은 물가 둔덕에 낮게 앉는다.** 예전엔 기둥으로 띄웠는데, 도토리 동산도
  // 나무 위에 같은 오두막을 얹어서 썸네일에서 실루엣이 안 갈렸다. 낮게 앉히고 지붕을
  // 동네 색 청록으로 바꾼다 — 동산은 높고 가을엔 주황이라 키로 한 번, 색으로 한 번
  // 갈린다. 둔덕 **밖**에 두면 연못 뒤 허공에 뜨고(실측), 처마를 .10 까지 빼면 집이
  // 아니라 버섯이 된다(실측).
  const K=growRig(g,x,y,c,1.6,1.6,.70,1.0), {P,poly,seg,boxAt,disc,tube,onGable,hut,at,flush}=K;
  const dark=i>=5, white=i===4;
  // 바닥은 **늘 맨 뒤**다. 예전엔 제 자리 깊이(-.30)를 줬는데, 뒤쪽에 선 오리집이
  // -1.24 라 먼저 그려지고 그 위를 바닥 원판이 덮었다 — 2~5단계가 내내 빈 웅덩이였다.
  // 평면은 깊이를 안 겨룬다.
  at(-3.0, ()=>{                                        // 물가 — 늘 바닥
    disc(0,0,.055,.86,STONE); bank(K,g,c,.86,STONE);
    disc(0,0,.058,.74,'#B39A72');
    if(i===0){ disc(0,0,.060,.60,'#A98C64'); disc(-.06,-.06,.062,.44,WD4);
      for(const [a,b,r] of [[-.30,.18,.10],[.26,-.14,.08]]){
        disc(a,b,.064,r,T(STONE,.92)); disc(a,b,.066,r*.70,STONE); } return; }
    disc(0,0,.060,.62, i===1? '#8FA88E' : WATER);
    if(i>=2){ disc(0,0,.062,.54,WATER2); disc(-.10,-.10,.064,.30,WATER3);
      for(const [a,b,r] of [[-.06,.26,.22],[.28,-.04,.15]]){
        const q=P(a,b,.066); g.strokeStyle='rgba(255,255,255,.42)'; g.lineWidth=Math.max(1,c*.009);
        g.beginPath(); g.ellipse(q[0],q[1],r*1.414*K.ux,r*1.414*K.uy,0,0,7); g.stroke(); } }
    else disc(0,0,.062,.34,'#7E9C8E');
  });
  if(i===0){ flush(); return; }
  const HX=-.44, HY=-.38, HW2=.48, HD2=.36, Z0=.115;
  if(i===1) at(HX+HY, ()=>{                             // 1 — 물과 발판(오리집 올 자리)
    boxAt(HX-.28,HY-.24, HX+.28,HY+.24, 0,Z0, T(STONE,.92), .03);
    boxAt(HX-.24,HY-.20, HX+.24,HY+.20, Z0,Z0+.05, WD2, .03); });
  if(i>=2) at(HX+HY, ()=>{                              // 2~ — 오리집
    boxAt(HX-.28,HY-.24, HX+.28,HY+.24, 0,Z0, T(STONE,.92), .03);
    boxAt(HX-.26,HY-.22, HX+.26,HY+.22, Z0,Z0+.05, WD2, .03);
    hut(HX-HW2/2,HY-HD2/2, HX+HW2/2,HY+HD2/2, Z0+.05,.26,.17,
      white?CREAM:WD, roofOf('colBrook',dark), .055);
    onGable(P(HX,HY+HD2/2,Z0+.05+.09),()=>{             // 둥근 문
      g.fillStyle='#6B5A43'; g.beginPath(); g.ellipse(0,0,c*.050,c*.058,0,0,7); g.fill();
      g.fillStyle='#8A7458'; g.beginPath(); g.ellipse(-c*.013,0,c*.027,c*.046,0,0,7); g.fill();
      g.fillStyle=CREAM3; g.beginPath(); g.ellipse(0,c*.046,c*.050,c*.013,0,0,7); g.fill(); }); });
  // 물로 내려가는 판자 — 오리가 드나드는 길이다. 이게 있어야 무슨 집인지 읽힌다.
  if(i>=2) at(HX+HY+.5, ()=>{
    poly([[HX-.10,HY+HD2/2,Z0+.05],[HX+.10,HY+HD2/2,Z0+.05],[-.16,-.10,.066],[-.34,-.24,.066]],WD);
    for(let k=1;k<5;k++){ const t=k/5;
      seg([HX-.10+(-.34-(HX-.10))*t, HY+HD2/2+(-.24-(HY+HD2/2))*t, Z0+.05+(.066-Z0-.05)*t],
          [HX+.10+(-.16-(HX+.10))*t, HY+HD2/2+(-.10-(HY+HD2/2))*t, Z0+.05+(.066-Z0-.05)*t],
          WD3,Math.max(1,c*.010)); } });
  for(const [a,b,h2] of [[.58,-.52,.34],[-.30,.62,.30]]) at(a+b, ()=>{   // 물가 부들
    seg([a,b,.05],[a,b,h2],LEAF,Math.max(2,c*.016));
    const q=P(a,b,h2); g.fillStyle=WD3;
    g.beginPath(); g.ellipse(q[0],q[1]-c*.030,c*.020,c*.046,0,0,7); g.fill(); });
  const duck=(a,b,s2,fc)=>at(a+b, ()=>{ const q=P(a,b,.070);
    g.fillStyle=fc; g.beginPath(); g.ellipse(q[0],q[1]-c*.022*s2,c*.070*s2,c*.044*s2,0,0,7); g.fill();
    g.fillStyle=T(fc,1.08); g.beginPath(); g.ellipse(q[0]-c*.016*s2,q[1]-c*.032*s2,c*.044*s2,c*.028*s2,0,0,7); g.fill();
    g.fillStyle=fc; g.beginPath(); g.ellipse(q[0]-c*.044*s2,q[1]-c*.074*s2,c*.029*s2,c*.033*s2,0,0,7); g.fill();
    g.fillStyle=ORG; g.beginPath(); g.ellipse(q[0]-c*.072*s2,q[1]-c*.068*s2,c*.021*s2,c*.011*s2,0,0,7); g.fill();
    g.fillStyle='#4A4438'; g.beginPath(); g.arc(q[0]-c*.048*s2,q[1]-c*.082*s2,c*.0075*s2,0,7); g.fill(); });
  if(i>=3) duck(.16,.24,1.0,CREAM);                     // 3 — 첫 오리
  if(i>=4){ for(const [a,b,r] of [[-.46,.34,.13],[.38,.46,.11],[.54,-.20,.10]]) at(a+b,()=>{
      disc(a,b,.062,r,T(CREAM3,.88)); disc(a-.01,b-.01,.066,r*.72,CREAM); });   // 4 — 흰 돌
    for(const [a,b,r] of [[-.14,.42,.16],[.32,.12,.13]]) at(a+b,()=>{           //     · 수련
      disc(a,b,.070,r,LEAF2); disc(a,b,.072,r*.62,LEAF3);
      const q=P(a+r*.3,b,.074); g.fillStyle=RED;
      g.beginPath(); g.ellipse(q[0],q[1]-c*.012,c*.024,c*.020,0,0,7); g.fill(); }); }
  if(i>=5){ duck(-.20,.10,.80,CREAM2);                  // 5 — 오리 둘과 등불
    const a=.74,b=.54; at(a+b,()=>{ seg([a,b,0],[a,b,.52],WD3,Math.max(2,c*.028));
      seg([a,b,.52],[a-.14,b,.52],WD3,Math.max(2,c*.020));
      const q=P(a-.14,b,.40); growthLantern(g,q[0],q[1],c*.15); }); }
  flush();
};
const hash=(n)=>{ const s=Math.sin(n*127.1)*43758.5453; return s-Math.floor(s); };

// 나무 한 그루 — 기둥·가지·잎.
// 옛 기둥은 tube() 라 **위아래 같은 굵기의 매끈한 관**이었고, 흰 단계엔 크림색이라
// 크림 파이프가 꽂힌 꼴이었다(실측). 아래로 벌어지는 사다리꼴에 밑동 뿌리를 붙이고,
// 색은 단계와 상관없이 나무껍질로 고정한다.
function oakTrunk(K,g,c,ax,ay,z0,z1,rBot,rTop){
  const {P,poly,seg,disc}=K;
  disc(ax,ay,z0+.004,rBot*1.22,T(SOIL,1.04));                      // 밑동 흙 — 크면 꼭대기에 구멍처럼 판다(실측)
  for(const s of [-1,1]) for(const t of [0,1]){                    // 뿌리 네 갈래
    const a=ax+s*rBot*1.5*(t?1:0.2), b=ay+(t?s*rBot*1.5*0.2:s*rBot*1.5);
    poly([[ax-rBot*.5,ay-rBot*.5,z0],[a,b,z0],[ax+rBot*.5,ay+rBot*.5,z0+.03]], T(BARK,.84)); }
  const q0=P(ax,ay,z0), q1=P(ax,ay,z1);
  const wb=rBot*1.414*K.ux, wt=rTop*1.414*K.ux;
  g.fillStyle=T(BARK,.78);                                          // 오른쪽 그늘
  g.beginPath(); g.moveTo(q0[0],q0[1]); g.lineTo(q0[0]+wb,q0[1]); g.lineTo(q1[0]+wt,q1[1]); g.lineTo(q1[0],q1[1]); g.closePath(); g.fill();
  g.fillStyle=BARK;                                                 // 왼쪽 살
  g.beginPath(); g.moveTo(q0[0],q0[1]); g.lineTo(q0[0]-wb,q0[1]); g.lineTo(q1[0]-wt,q1[1]); g.lineTo(q1[0],q1[1]); g.closePath(); g.fill();
  g.fillStyle=T(BARK,1.16);                                         // 왼 모서리 빛
  g.beginPath(); g.moveTo(q0[0]-wb,q0[1]); g.lineTo(q0[0]-wb*.62,q0[1]); g.lineTo(q1[0]-wt*.62,q1[1]); g.lineTo(q1[0]-wt,q1[1]); g.closePath(); g.fill();
  for(let k=1;k<=3;k++){ const t=k/4, qq=P(ax,ay,z0+(z1-z0)*t), w=(wb+(wt-wb)*t);
    g.strokeStyle='rgba(70,54,32,.26)'; g.lineWidth=Math.max(1,c*.008);
    g.beginPath(); g.moveTo(qq[0]-w*.55,qq[1]); g.lineTo(qq[0]-w*.10,qq[1]-c*.012); g.stroke(); }
}
function oakCanopy(K,g,c,ax,ay,top,R,FALL){
  const {P}=K;
  const L1=FALL?'#B87A42':LEAF, L2=FALL?'#DDA25A':LEAF2, L3=FALL?'#F0CE8A':LEAF3;
  const lump=(a,b,z,r,dk)=>{ const q=P(ax+a,ay+b,z), rx=r*c*R, ry=r*c*R*.88;
    g.fillStyle=T(L1, dk?.86:1.0); g.beginPath(); g.ellipse(q[0],q[1],rx,ry,0,0,7); g.fill();
    g.fillStyle=L2; g.beginPath(); g.ellipse(q[0]-rx*.16,q[1]-ry*.20,rx*.80,ry*.78,0,0,7); g.fill();
    g.fillStyle=L3; g.beginPath(); g.ellipse(q[0]-rx*.30,q[1]-ry*.36,rx*.42,ry*.40,0,0,7); g.fill(); };
  lump(-.02,-.30, top+.20,.27,true); lump(.30,-.10, top+.06,.25,true); lump(-.34,-.06, top+.08,.26,true);
  lump( .00, .00, top+.30,.28,false); lump(.22,.22, top-.02,.24,false); lump(-.22,.24, top+.00,.25,false);
  const qs=P(ax,ay,top-.22);
  g.fillStyle='rgba(60,70,40,.20)'; g.beginPath(); g.ellipse(qs[0],qs[1],.36*c*R,.13*c*R,0,0,7); g.fill();
}
// 묘목 — 막대에 타원 둘을 붙였더니 **이쑤시개에 꽂은 콩**이었다(실측).
// 줄기를 살짝 휘고 잎 석 장을 각기 다른 높이·각도로 단다. 끝엔 새순 하나.
function oakSapling(K,g,c,ax,ay,z0,h){
  const {P,seg}=K;
  const q0=P(ax,ay,z0), q1=P(ax+.03,ay+.03,z0+h);
  g.strokeStyle=BARK; g.lineWidth=Math.max(2,c*.020); g.lineCap='round';
  g.beginPath(); g.moveTo(q0[0],q0[1]);
  g.quadraticCurveTo(q0[0]-c*.03,(q0[1]+q1[1])/2, q1[0],q1[1]); g.stroke();
  const leaf=(t,s2,sc)=>{ const q=P(ax+.03*t,ay+.03*t,z0+h*t);
    g.save(); g.translate(q[0],q[1]); g.rotate(s2*0.55);
    g.fillStyle=LEAF; g.beginPath(); g.ellipse(s2*c*.050*sc,-c*.010*sc,c*.052*sc,c*.026*sc,0,0,7); g.fill();
    g.fillStyle=LEAF2; g.beginPath(); g.ellipse(s2*c*.046*sc,-c*.016*sc,c*.034*sc,c*.016*sc,0,0,7); g.fill();
    g.restore(); };
  leaf(.52,-1,.92); leaf(.74,1,1.0); leaf(.90,-1,.78);
  const qt=P(ax+.03,ay+.03,z0+h);
  g.fillStyle=LEAF2; g.beginPath(); g.ellipse(qt[0],qt[1]-c*.020,c*.028,c*.034,0,0,7); g.fill();
  g.fillStyle=LEAF3; g.beginPath(); g.ellipse(qt[0]-c*.006,qt[1]-c*.026,c*.016,c*.020,0,0,7); g.fill();
}
const acornAt=(K,g,c,a,b,s2)=>{ const {P}=K; const q=P(a,b,.02);
  g.fillStyle=BR2; g.beginPath(); g.ellipse(q[0],q[1]-c*.030*s2,c*.040*s2,c*.048*s2,0,0,7); g.fill();
  g.fillStyle=T(BR2,1.18); g.beginPath(); g.ellipse(q[0]-c*.012*s2,q[1]-c*.040*s2,c*.020*s2,c*.024*s2,0,0,7); g.fill();
  g.fillStyle=WD4; g.beginPath(); g.ellipse(q[0],q[1]-c*.064*s2,c*.045*s2,c*.022*s2,0,0,7); g.fill(); };

// 세 안이 공유하는 마감 — 나무·도토리·바구니·등불
function oakTop(K,g,c,i,TOP,ctx2){
  const {P,seg,disc,at,flush}=K;
  const FALL=i>=5;
  if(i===0){ at(2.6,()=>acornAt(K,g,c,.34,-.98,1.0)); return; }
  if(i===1){ at(.2,()=>oakSapling(K,g,c,0,0,TOP,.40)); at(2.6,()=>acornAt(K,g,c,.34,-.98,1.0)); return; }
  const H = TOP + (i===2? .64 : 1.00);
  at(-.20, ()=>oakTrunk(K,g,c,0,0,TOP,H,.115,.072));
  at(.80, ()=>oakCanopy(K,g,c,0,0,H+.26, i===2? .70 : 1.0, FALL));
  if(i>=3){ for(const [a,b,s] of [[.56,-1.02,1],[-.88,-.62,.86],[-.24,1.04,.92]])
    at(a+b+2.4,()=>acornAt(K,g,c,a,b,s)); }
  if(i>=4) at(2.6, ()=>{ const a=.78,b=.88, q=P(a,b,.02);
    g.fillStyle=WD2; g.beginPath(); g.ellipse(q[0],q[1]-c*.030,c*.085,c*.052,0,0,7); g.fill();
    g.fillStyle=T(WD2,.80); g.beginPath(); g.ellipse(q[0],q[1]-c*.014,c*.085,c*.040,0,0,7); g.fill();
    g.fillStyle=BR2; for(const dx of [-.030,.004,.034]){
      g.beginPath(); g.ellipse(q[0]+dx*c,q[1]-c*.054,c*.026,c*.030,0,0,7); g.fill(); } });
  if(i>=5){ const a=-1.02,b=-.28; at(a+b+2.4,()=>{
    seg([a,b,.02],[a,b,.52],WD4,Math.max(2,c*.026));
    seg([a,b,.52],[a+.13,b,.52],WD4,Math.max(2,c*.018));
    const q=P(a+.13,b,.40); growthLantern(g,q[0],q[1],c*.14); }); }
}

// ── 4동네 · 도토리 동산 — 감아 올라가는 **비탈 나선** ─────────────
// 각져 보인 진짜 원인: 바깥 벽이 **수직 절벽**이었다. 흙을 깎아 세운 옹벽이지
// 언덕이 아니다. 벽 아래끝을 바깥으로 밀어 비탈로 눕히고, 길 바깥 턱에 풀을 물려
// 모서리를 덮는다. 나선 끝도 뾰족하게 끊지 않고 비탈로 흘려 땅에 묻는다.
GROWTH_ART.colOak=function(g,x,y,c,i,opt){
  const K=growRig(g,x,y,c,.9,.9,1.02,.5), {P,poly,seg,disc,at,flush}=K;
  const R0=.84, R1=.26, W=.22, ZT=1.30, TURNS=2.4, SLOPE=.30;   // SLOPE: 비탈이 바깥으로 눕는 양
  const FRAC=[.30,.55,.80,1,1,1][i];
  const TH0=Math.PI*0.25, THM=Math.PI*2*TURNS;
  const rAt=t=>R0+(R1-R0)*t, zAt=t=>ZT*t;
  const DROP=ZT/TURNS*1.10, M=150;
  const TOP=zAt(FRAC), rEnd=rAt(FRAC);
  at(-1.6, ()=>{ for(let k=0;k<=34;k++){ const t=FRAC*k/34, z=zAt(t), r=Math.max(.02,rAt(t)-W/2);
      disc(0,0,z,r, T(GRASS, .84+t*.14)); }
    disc(0,0,TOP,Math.max(.02,rEnd-W/2), GRASS); });
  const parts=[];
  for(let k=0;k<M;k++){
    const t0=k/M, t1=(k+1)/M; if(t0>=FRAC) break;
    const tb=Math.min(t1,FRAC);
    const th0=TH0+THM*t0, th1=TH0+THM*tb;
    const r0=rAt(t0)+W/2, r1=rAt(tb)+W/2, z0=zAt(t0), z1=zAt(tb);
    const i0=rAt(t0)-W/2, i1=rAt(tb)-W/2;
    const fade=Math.min(1,(FRAC-t0)/0.10);                      // 끝 10%에서 비탈을 땅으로 흘린다
    const d0=Math.min(z0, DROP*(1-0) ), d1=Math.min(z1, DROP);
    const bot0=Math.max(0,z0-DROP), bot1=Math.max(0,z1-DROP);
    const s0=r0+SLOPE*(z0-bot0), s1=r1+SLOPE*(z1-bot1);          // 비탈 밑단은 바깥으로
    const o0=[Math.cos(th0)*r0, Math.sin(th0)*r0], o1=[Math.cos(th1)*r1, Math.sin(th1)*r1];
    const b0=[Math.cos(th0)*s0, Math.sin(th0)*s0], b1=[Math.cos(th1)*s1, Math.sin(th1)*s1];
    const p0=[Math.cos(th0)*i0, Math.sin(th0)*i0], p1=[Math.cos(th1)*i1, Math.sin(th1)*i1];
    const na=(Math.cos(th0)+Math.cos(th1))/2, nb=(Math.sin(th0)+Math.sin(th1))/2;
    const lit=Math.max(0,(-na*.55)+(nb*.83));
    parts.push({ d:(o0[0]+o0[1]+o1[0]+o1[1])/2, z:z0, draw:()=>{
      poly([[o0[0],o0[1],z0],[o1[0],o1[1],z1],[b1[0],b1[1],bot1],[b0[0],b0[1],bot0]], T(SOIL,.66+lit*.40));
      poly([[o0[0],o0[1],z0],[o1[0],o1[1],z1],[b1[0],b1[1],(z1+bot1)/2],[b0[0],b0[1],(z0+bot0)/2]],
           T(GRASS,(.72+lit*.24)*(0.55+0.45*fade)));             // 비탈 윗자락에 풀이 물린다
      poly([[o0[0],o0[1],z0],[o1[0],o1[1],z1],[p1[0],p1[1],z1],[p0[0],p0[1],z0]], T(GRASS,.94+lit*.14));
    }});
  }
  parts.sort((u,v)=>(u.d-v.d)||(u.z-v.z));
  for(const p of parts) at(p.d,p.draw);
  for(let k=1;k<=Math.floor(11*FRAC);k++){ const t=k/11, th=TH0+THM*t, r=rAt(t), z=zAt(t);
    const a=Math.cos(th)*r, b=Math.sin(th)*r;
    at(a+b+.05, ()=>{ disc(a,b,z+.006,.058,T(CREAM3,.86)); disc(a-.01,b-.01,z+.016,.042,CREAM); }); }
  oakTop(K,g,c,i,TOP);
  flush();
};
// ── 5동네 · 폴짝 공터 — 트램펄린 + **넓은 울타리** ────────────────
// 안전망은 트램펄린 테를 바짝 감싸 '물건 하나'였다. 울타리를 마당 가장자리까지 물려
// 공터를 두른다 — 트램펄린·계단·공이 한 울타리 안에 들어 **공터**가 된다.
GROWTH_ART.colTramp=function(g,x,y,c,i,opt){
  const K=growRig(g,x,y,c,1.3,1.3,.92,.5), {P,poly,seg,boxAt,disc,tube,at,flush}=K;
  const white=i===4, dark=i>=5;
  const COL=GROWTH_ROOF('colTramp', dark);
  const R=.42, Z=.28, FR=.96, FZ=.42;                       // 트램펄린 · 울타리 반지름/높이
  at(-3.0, ()=>{ disc(0,0,.02,1.02,T(LEAF3,.92)); disc(.02,.02,.03,.62,T(SOIL,1.08));
    if(i===0) for(const [a,b] of [[-.22,-.10],[.02,.14],[.26,-.06]]){ const q=P(a,b,.05);
      g.fillStyle='rgba(120,96,64,.32)'; g.beginPath(); g.ellipse(q[0],q[1],c*.030,c*.020,0,0,7); g.fill(); } });
  // 울타리 — 팔각으로 두른다. 앞쪽 한 변은 문이라 비운다.
  const fence=(list,gate)=>{ const N=list.length;
    for(let k=0;k<N;k++){ const p=list[k], q=list[(k+1)%N];
      if(gate && k===gate) continue;
      for(const zz of [FZ*.48, FZ*.86])
        seg([p[0],p[1],zz],[q[0],q[1],zz], white?CREAM2:WD2, Math.max(2,c*.020));
      for(let t=.25;t<1;t+=.25){ const a=p[0]+(q[0]-p[0])*t, b=p[1]+(q[1]-p[1])*t;
        seg([a,b,.03],[a,b,FZ*.94], white?CREAM2:WD2, Math.max(1,c*.014)); } }
    for(const p of list) seg([p[0],p[1],.02],[p[0],p[1],FZ], white?CREAM:WD3, Math.max(2,c*.028)); };
  const ring=[]; for(let k=0;k<8;k++){ const th=k/8*Math.PI*2+Math.PI/8; ring.push([Math.cos(th)*FR, Math.sin(th)*FR]); }
  // 깊이로 나눠 쏟는다 — 뒤 변은 트램펄린보다 먼저, 앞 변은 나중에.
  const edges=[]; for(let k=0;k<8;k++){ const p=ring[k], q=ring[(k+1)%8]; edges.push({k, d:(p[0]+p[1]+q[0]+q[1])/2, p, q}); }
  const GATE=edges.reduce((m,e)=>e.d>m.d?e:m, edges[0]).k;      // 가장 앞 변이 문
  // 마지막 단계는 판 테두리의 「놀이 울타리」 그대로 — 크림 기둥·크림 가로대에
  // 알록달록한 둥근 캡(#E86B5A·#E6A92E·#64A9C8·#75A957). 마당과 판이 같은 울타리를 쓴다.
  const PLAY=i>=5, CAPS=['#E86B5A','#E6A92E','#64A9C8','#75A957'];
  const postCol = PLAY? '#FFF4D9' : (white?CREAM:WD3), railCol = PLAY? '#E8D9B9' : (white?CREAM2:WD2);
  const capAt=(a,b,z,k)=>{ if(!PLAY) return; const q=P(a,b,z);
    g.fillStyle=CAPS[k%4]; g.beginPath(); g.arc(q[0],q[1],Math.max(2,c*.024),0,7); g.fill(); };
  let pc=0;
  if(i>=1) for(const e of edges) at(e.d, ()=>{
    if(e.k===GATE){ for(const p of [e.p,e.q]){ seg([p[0],p[1],.02],[p[0],p[1],FZ*1.15], postCol, Math.max(2,c*.032)); capAt(p[0],p[1],FZ*1.15,pc++); } return; }
    for(const zz of [FZ*.48, FZ*.86]) seg([e.p[0],e.p[1],zz],[e.q[0],e.q[1],zz], railCol, Math.max(2,c*.020));
    for(let t=0;t<=1;t+=.25){ const a=e.p[0]+(e.q[0]-e.p[0])*t, b=e.p[1]+(e.q[1]-e.p[1])*t, end=(t===0||t===1);
      seg([a,b,.03],[a,b,FZ*(end? 1.0 : .94)], end? postCol : (PLAY? '#FFF4D9' : railCol), Math.max(1,c*(end? .028:.014)));
      if(end) capAt(a,b,FZ,pc++); }
  });
  if(i>=2) at(.1, ()=>{                                       // 트램펄린
    for(let k=0;k<6;k++){ const th=k/6*Math.PI*2+0.3, a=Math.cos(th)*R*.80, b=Math.sin(th)*R*.80;
      seg([a,b,.02],[a*.88,b*.88,Z],WD3,Math.max(2,c*.024)); }
    disc(0,0,Z,R, COL); disc(0,0,Z+.004,R*.99, T(COL,.86));
    if(i>=3){ disc(0,0,Z+.010,R*.76, white?'#5C6874':'#414C57'); disc(0,0,Z+.012,R*.70, white?'#6B7783':'#4C5863');
      for(let k=0;k<16;k++){ const th=k/16*Math.PI*2, a=Math.cos(th), b=Math.sin(th);
        seg([a*R*.78,b*R*.78,Z+.011],[a*R*.95,b*R*.95,Z+.008], T(COL,1.22), Math.max(1,c*.010)); } }
    else disc(0,0,Z+.010,R*.76, T(SOIL,1.16));
  });
  if(i>=4) at(1.2, ()=>{ const CA=.50, CB=.50;               // 계단
    for(let k=0;k<3;k++) boxAt(CA-.20+k*.03,CB-.20+k*.03, CA+.20-k*.03,CB+.20-k*.03, .02+k*.085, .02+(k+1)*.085, white?CREAM2:WD2, .03); });
  if(i>=4) for(const [a,b,r] of [[-.60,.36,.070],[.30,-.62,.060],[-.30,-.58,.055]])
    at(a+b+.3, ()=>{ disc(a,b,.05,r,T(CREAM3,.86)); disc(a-.01,b-.01,.06,r*.74,CREAM); });
  if(i>=5){ const a=-.64,b=-.64; at(a+b+2.0,()=>{             // 문기둥 옆 등불
      seg([a,b,.02],[a,b,.60],WD4,Math.max(2,c*.026));
      seg([a,b,.60],[a+.13,b,.60],WD4,Math.max(2,c*.018));
      const q=P(a+.13,b,.48); growthLantern(g,q[0],q[1],c*.14); });
    at(2.4, ()=>{ const a2=.66,b2=.20, q=P(a2,b2,.02);
      g.fillStyle=WD2; g.beginPath(); g.ellipse(q[0],q[1]-c*.030,c*.080,c*.050,0,0,7); g.fill();
      g.fillStyle=T(WD2,.80); g.beginPath(); g.ellipse(q[0],q[1]-c*.014,c*.080,c*.038,0,0,7); g.fill();
      for(const [dx,col] of [[-.028,'#CC6B5E'],[.006,'#DDA25A'],[.032,'#8FB4D9']]){
        g.fillStyle=col; g.beginPath(); g.arc(q[0]+dx*c,q[1]-c*.052,c*.026,0,7); g.fill(); } }); }
  flush();
};
GROWTH_ART.colPaint=function(g,x,y,c,i,opt){
  const K=growRig(g,x,y,c,1.04,.62,.72,1.0), {P,poly,seg,boxAt,disc,tube,onGable,hut,at,flush}=K;
  const dark=i>=5, white=i===4;
  const WOOD = dark? WD4 : white? CREAM2 : WD2;
  const TZ=.36, TW=.44;
  if(i>=3) at(-.80, ()=>{                       // 4 · 알록 울타리 — 헛간 뒤
    for(let k=0;k<6;k++){ const a=-.66+k*.24;
      poly([[a,-.56,0],[a+.15,-.56,0],[a+.15,-.56,.50],[a+.075,-.56,.58],[a,-.56,.50]], T(PAL[k%5],.96));
      poly([[a,-.56,.38],[a+.15,-.56,.38],[a+.15,-.56,.42],[a,-.56,.42]], T(PAL[k%5],.76)); } });
  if(i>=2){                                     // 3~ · 헛간 — 안쪽부터
    at(-.10, ()=>{
      poly([[-.52,-.31,.04],[.52,-.31,.04],[.52,.31,.04],[-.52,.31,.04]],'#A89070');   // 바닥
      poly([[-.52,-.31,.04],[-.52,.31,.04],[-.52,.31,.50],[-.52,-.31,.50]],T(WOOD,1.02)); // 왼 안벽
      for(let k=0;k<5;k++)                                                              // 색 기록 널
        poly([[-.515,-.24+k*.11,.20],[-.515,-.16+k*.11,.20],[-.515,-.16+k*.11,.44],[-.515,-.24+k*.11,.44]],T(PAL[k],.82));
      poly([[-.52,-.31,.04],[.52,-.31,.04],[.52,-.31,.50],[-.52,-.31,.50]],T(WOOD,.72)); // 뒷 안벽
      // 작업대 — 왼쪽 벽에 붙여 세로로
      for(const b of [-.18,.18]) seg([-.30,b,.04],[-.30,b,TZ],T(WOOD,.70),Math.max(2,c*.024));
      boxAt(-.40,-.26, -.20,.26, TZ,TZ+.06, WOOD, .03);
      for(let k=0;k<3;k++){ const b=-.18+k*.18, q=P(-.30,b,TZ+.06);
        g.fillStyle=T(PAL[k],.74); g.beginPath();
        g.moveTo(q[0]-c*.036,q[1]-c*.008); g.lineTo(q[0]-c*.036,q[1]-c*.058);
        g.lineTo(q[0]+c*.036,q[1]-c*.058); g.lineTo(q[0]+c*.036,q[1]-c*.008); g.closePath(); g.fill();
        g.fillStyle=PAL[k]; g.beginPath(); g.ellipse(q[0],q[1]-c*.058,c*.036,c*.016,0,0,7); g.fill(); } });
    at(0, ()=>{
      const RF=roofOf('colPaint',dark);
      const h=hut(-.52,-.31, .52,.31, .04,.50,.38, white?CREAM:WD, RF, .07, {w:.64,h:.42});
      for(const a of [-.32,.32]) seg([a,.31,.04],[a,.31,.46],T(WOOD,.68),Math.max(2,c*.028));
      seg([-.34,.31,.46],[.34,.31,.46],T(WOOD,.68),Math.max(2,c*.030));
      for(let k=.18;k<1;k+=.20){ const ax=(.52+.07)*k, az=h.AP+(h.HE-h.AP)*k;
        seg([ax,-.38,az],[ax,.38,az],T(RF,.86),Math.max(1,c*.014)); } }); }
  else at(0, ()=>{                               // 1~2 · 작업대만
    for(const [a,b] of [[-.36,-.16],[.36,-.16]]) seg([a,b,0],[a,b,TZ],T(WOOD,.72),Math.max(2,c*.028));
    for(const [a,b] of [[-.36,.16],[.36,.16]]) seg([a,b,0],[a,b,TZ],T(WOOD,.90),Math.max(2,c*.030));
    boxAt(-.48,-TW/2, .48,TW/2, TZ,TZ+.07, WOOD, .03);
    if(i>=1) for(let k=0;k<3;k++){ const a=-.26+k*.24, q=P(a,-.06,TZ+.07);
      g.fillStyle=T(PAL[k],.74); g.beginPath();
      g.moveTo(q[0]-c*.038,q[1]-c*.010); g.lineTo(q[0]-c*.038,q[1]-c*.062);
      g.lineTo(q[0]+c*.038,q[1]-c*.062); g.lineTo(q[0]+c*.038,q[1]-c*.010); g.closePath(); g.fill();
      g.fillStyle=PAL[k]; g.beginPath(); g.ellipse(q[0],q[1]-c*.062,c*.038,c*.017,0,0,7); g.fill(); } });
  if(i>=2) at(.66, ()=>{                         // 바닥에 깐 천과 튄 물감
    poly([[-.60,.42,.004],[.52,.42,.004],[.58,.86,.004],[-.54,.86,.004]],CREAM2);
    for(const [a,b,k,r] of [[-.32,.56,0,.055],[.00,.72,3,.045],[.26,.52,2,.038]]) disc(a,b,.006,r,PAL[k]); });
  if(i>=4){                                      // 5 · 색상표와 화분
    at(-.70, ()=>{ const a=-.72,b=-.36;
      seg([a,b,0],[a,b,.60],WD3,Math.max(2,c*.026));
      onGable(P(a,b,.74),()=>{ g.fillStyle=CREAM; g.fillRect(-c*.10,-c*.11,c*.20,c*.22);
        for(let k=0;k<5;k++){ g.fillStyle=PAL[k]; g.fillRect(-c*.078,-c*.088+k*c*.040,c*.156,c*.028); } }); });
    at(.92, ()=>{ const a=.70,b=.40; tube(a,b,0,.18,.15,BRICK);
      const q=P(a,b,.18);
      g.fillStyle=LEAF; g.beginPath(); g.ellipse(q[0],q[1]-c*.046,c*.070,c*.052,0,0,7); g.fill();
      g.fillStyle=LEAF2; g.beginPath(); g.ellipse(q[0]-c*.026,q[1]-c*.070,c*.046,c*.036,0,0,7); g.fill();
      g.fillStyle=RED; g.beginPath(); g.arc(q[0]+c*.026,q[1]-c*.080,c*.020,0,7); g.fill(); }); }
  if(i>=5){                                      // 6 · 무지개 차양과 등
    at(.42, ()=>{ for(const a of [-.52,.52]) seg([a,.36,0],[a,.36,.62],WD3,Math.max(2,c*.024));
      for(let k=0;k<5;k++){ const a0=-.52+k*.208;
        poly([[a0,.31,.70],[a0+.208,.31,.70],[a0+.208,.40,.58],[a0,.40,.58]], T(PAL[k],1.02));
        poly([[a0,.40,.58],[a0+.208,.40,.58],[a0+.104,.46,.52]], T(PAL[k],.82)); } });
    at(1.0, ()=>{ const a=-.86,b=.40;
      seg([a,b,0],[a,b,.58],WD3,Math.max(2,c*.026));
      seg([a,b,.58],[a+.13,b,.58],WD3,Math.max(2,c*.020));
      const q=P(a+.13,b,.46); growthLantern(g,q[0],q[1],c*.15); }); }
  flush();
};
// ── 9동네 · 냥냥 골목 — **골목 한 토막** ────────────────────────
// 물건 하나가 아니라 장면이다. 처음엔 담 두 줄을 화면과 나란히 놨더니 골목이 아니라
// **울타리 둘**이었다(실측) — 길이 뒤로 뻗지 않으니 사이 공간이 안 읽힌다.
// 길을 a축(화면 오른쪽 위로 들어가는 사선)에 놓는다. 뒷담(b 작은 쪽)은 높고 안쪽 면이
// 보이며, 앞담(b 큰 쪽)은 낮아 길을 안 가린다. 그 사이로 골목이 들어간다.
// 냥냥 골목 — **골목 어귀 이층 가게**(고양이 다방). 상자집이던 것을 건물로 바꿨다(2026-09-22):
// 소품은 열 채 사이에서 동네의 얼굴 노릇을 못 한다. 지붕·벽·문이 있어야 멀리서도 읽힌다.
// 단계: 0 발자국 · 1 뒷담과 눈길 · 2 가게가 선다 · 3 차양과 그릇 · 4 이층과 지붕 · 5 간판과 등불.
GROWTH_ART.colCatBed=function(g,x,y,c,i,opt){
  const K=growRig(g,x,y,c,1.6,1.0,.80,.5), {P,poly,roundPoly,seg,boxAt,tube,disc,onGable,hut,at,flush}=K;
  const white=i===4, dark=i>=5;
  const CAP=GROWTH_ROOF('colCatBed', dark);
  const WALL = dark? '#D8B98A' : white? CREAM2 : '#E7D6B4';
  const WOOD = dark? '#7E6145' : WD3;
  const L=1.10;                                               // 골목 반길이(a축)
  at(-3.0, ()=>{                                              // 골목 바닥 — 돌판 길
    poly([[-L,-.62,.02],[L,-.62,.02],[L,.62,.02],[-L,.62,.02]], '#C9B592');
    for(let k=0;k<34;k++){ const aa=-L+.08+hash(k*5.1)*(2*L-.16), bb=-.54+hash(k*9.7)*1.08;
      const q=P(aa,bb,.026), r=(.03+hash(k*3.3)*.03)*c;
      g.fillStyle=T('#C9B592', .86+hash(k*2.2)*.22); g.beginPath(); g.ellipse(q[0],q[1],r,r*.55,0,0,7); g.fill(); }
    for(const [aa,bb] of [[-.62,.42],[.34,-.44],[.78,.36]]){ const q=P(aa,bb,.028);
      g.strokeStyle=T(LEAF,1.0); g.lineWidth=Math.max(1,c*.010); g.lineCap='round';
      for(const dx of [-.02,0,.02]){ g.beginPath(); g.moveTo(q[0]+dx*c,q[1]); g.lineTo(q[0]+dx*c*1.6,q[1]-c*.036); g.stroke(); } }
    if(i<1) for(const [aa,bb] of [[-.40,.30],[-.10,.14],[.18,-.02],[.46,-.18]]){   // 1 — 고양이 발자국
      const q=P(aa,bb,.03); g.fillStyle='rgba(90,76,58,.42)';
      g.beginPath(); g.ellipse(q[0],q[1],c*.026,c*.017,0,0,7); g.fill();
      for(const t of [-1,0,1]){ g.beginPath();
        g.ellipse(q[0]+t*c*.022, q[1]-c*.019, c*.010, c*.007,0,0,7); g.fill(); } }
  });
  // 고양이 한 마리 — 옆으로 앉은 실루엣(깊이는 부르는 쪽이 준다)
  const cat=(a,b,z,s2,fc,flip)=>at(a+b+1.2, ()=>{ const q=P(a,b,z), f=flip?-1:1;
    g.fillStyle=fc; g.beginPath(); g.ellipse(q[0],q[1]-c*.050*s2,c*.078*s2,c*.050*s2,0,0,7); g.fill();
    g.fillStyle=T(fc,.86); g.beginPath(); g.ellipse(q[0]-f*c*.082*s2,q[1]-c*.034*s2,c*.046*s2,c*.016*s2,f*0.5,0,7); g.fill();
    g.fillStyle=T(fc,1.06); g.beginPath(); g.arc(q[0]+f*c*.048*s2,q[1]-c*.090*s2,c*.042*s2,0,7); g.fill();
    g.fillStyle=fc; for(const dx of [.024,.072]){ g.beginPath();
      g.moveTo(q[0]+f*dx*c*s2, q[1]-c*.116*s2); g.lineTo(q[0]+f*(dx+.011)*c*s2, q[1]-c*.162*s2);
      g.lineTo(q[0]+f*(dx+.028)*c*s2, q[1]-c*.118*s2); g.closePath(); g.fill(); }
    g.fillStyle='#4A4438'; for(const dx of [.032,.064]){ g.beginPath(); g.arc(q[0]+f*dx*c*s2,q[1]-c*.092*s2,c*.007*s2,0,7); g.fill(); } });
  // 뒷담 — 시골 돌담 한 자락. 가게 뒤로 골목이 이어진다는 말.
  const BZ=.72, WB0=-.86, WB1=-.70;
  if(i>=1) at(-1.6, ()=>{
    const MUD='#8E7B62', ST=['#BDB39E','#CFC7B2','#A99E88','#C4B9A2','#B6AC95'];
    poly([[L,WB0,.02],[L,WB1,.02],[L,WB1,BZ],[L,WB0,BZ]], T(MUD,.80));
    poly([[-L,WB1,.02],[L,WB1,.02],[L,WB1,BZ],[-L,WB1,BZ]], MUD);
    poly([[-L,WB0,BZ],[L,WB0,BZ],[L,WB1,BZ],[-L,WB1,BZ]], T(MUD,1.10));
    const rows=4;
    for(let r=0;r<rows;r++){ const zc=.02+(r+.5)*(BZ-.04)/rows, off=(r%2)*.07;
      for(let k=0;;k++){ const w=.09+hash(3+r*31+k*7)*.07, aa=-L+.05+off+k*.17;
        if(aa+w>L-.02) break;
        const q=P(aa+w/2,WB1,zc), rx=w*1.414*K.ux*.62, ry=(BZ-.04)/rows*K.uz*.42;
        g.fillStyle=ST[(r*3+k)%ST.length]; g.beginPath(); g.ellipse(q[0],q[1],rx,ry,0,0,7); g.fill();
        g.fillStyle='rgba(255,250,240,.30)'; g.beginPath(); g.ellipse(q[0]-rx*.22,q[1]-ry*.30,rx*.46,ry*.40,0,0,7); g.fill(); } }
    const OV=.06, STRAW='#BCA97F';
    poly([[-L-OV,WB1+OV,BZ],[L+OV,WB1+OV,BZ],[L+OV,WB1+OV,BZ+.05],[-L-OV,WB1+OV,BZ+.05]], T(STRAW,.80));
    poly([[-L-OV,WB0-OV,BZ+.05],[L+OV,WB0-OV,BZ+.05],[L+OV,WB1+OV,BZ+.05],[-L-OV,WB1+OV,BZ+.05]], T(STRAW,1.02));
    seg([-L-OV,(WB0+WB1)/2,BZ+.056],[L+OV,(WB0+WB1)/2,BZ+.056], CAP, Math.max(2,c*.026));
  });
  if(i===1) cat(.30,WB1,BZ+.052, .80, '#B6A99A', true);       // 2 — 담 너머 눈길
  // ── 가게 ────────────────────────────────────────────────────
  const A0=-.86, A1=.78, B0=-.46, B1=.30, FZ=.66;             // 1층
  if(i>=2) at(.2, ()=>{
    boxAt(A0,B0, A1,B1, .02, FZ, WALL, .03);
    // 문 — 오른쪽 끝. 반쯤 열려 속이 검다.
    poly([[.30,B1,.02],[.68,B1,.02],[.68,B1,.56],[.30,B1,.56]], T(WOOD,.72));
    poly([[.35,B1,.05],[.63,B1,.05],[.63,B1,.52],[.35,B1,.52]], WOOD);
    { const q=P(.59,B1,.28); g.fillStyle='#E8C87A'; g.beginPath(); g.arc(q[0],q[1],Math.max(1,c*.012),0,7); g.fill(); }
    // 유리창 둘 — 나무 틀에 살 하나
    if(i>=3) for(const [a,w] of [[-.74,.42],[-.24,.36]]){
      poly([[a,B1,.18],[a+w,B1,.18],[a+w,B1,.54],[a,B1,.54]], T(WOOD,.78));
      poly([[a+.03,B1,.21],[a+w-.03,B1,.21],[a+w-.03,B1,.51],[a+.03,B1,.51]], white? '#CFE3EC' : '#8FC4DE');
      seg([a+.03,B1,.37],[a+w-.03,B1,.37], 'rgba(255,255,255,.45)', Math.max(1,c*.012));
      seg([a+w/2,B1,.21],[a+w/2,B1,.51], T(WOOD,.86), Math.max(1,c*.010));
    } else if(i===2) poly([[-.74,B1,.18],[.12,B1,.18],[.12,B1,.54],[-.74,B1,.54]], T(WALL,.90));
    // 차양 — 줄무늬 천이 앞으로 기운다
    if(i>=3){ const AW=.26, S1= white? '#E6A79A' : '#C97B6B', S2='#FFF3DE';
      for(let k=0, a=A0-.06; a<A1+.06; a+=.20, k++){ const a2=Math.min(a+.20, A1+.06);
        poly([[a,B1,FZ+.02],[a2,B1,FZ+.02],[a2,B1+AW,FZ-.06],[a,B1+AW,FZ-.06]], k%2? S2 : S1); }
      poly([[A0-.06,B1+AW,FZ-.06],[A1+.06,B1+AW,FZ-.06],[A1+.06,B1+AW,FZ-.12],[A0-.06,B1+AW,FZ-.12]], T(S1,.82)); }
    // 2층 + 박공 지붕
    if(i>=4) hut(A0+.08,B0+.06, A1-.08,B1-.06, FZ, .44, .28, white? CREAM : WALL, CAP, .07);
    else if(i>=2) poly([[A0,B0,FZ],[A1,B0,FZ],[A1,B1,FZ],[A0,B1,FZ]], T(WALL,1.09));
    // 2층 창 둘
    if(i>=4) for(const a of [A0+.20, A0+.86]){
      poly([[a,B1-.06,FZ+.10],[a+.30,B1-.06,FZ+.10],[a+.30,B1-.06,FZ+.34],[a,B1-.06,FZ+.34]], T(WOOD,.78));
      poly([[a+.03,B1-.06,FZ+.13],[a+.27,B1-.06,FZ+.13],[a+.27,B1-.06,FZ+.31],[a+.03,B1-.06,FZ+.31]], dark? '#3B3750' : '#6E6494'); }
    // 간판 — 차양 위 벽에 생선 한 마리
    if(i>=5){ poly([[A0+.14,B1,FZ+.08],[A0+.92,B1,FZ+.08],[A0+.92,B1,FZ+.30],[A0+.14,B1,FZ+.30]], '#4E6E8E');
      onGable(P(A0+.53,B1,FZ+.19), ()=>{ const s=c*.13;
        g.fillStyle='#FFF3DE'; g.beginPath(); g.ellipse(-s*.14,0,s*.46,s*.22,0,0,7); g.fill();
        g.beginPath(); g.moveTo(s*.28,0); g.lineTo(s*.66,-s*.24); g.lineTo(s*.66,s*.24); g.closePath(); g.fill();
        g.fillStyle='#4E6E8E'; g.beginPath(); g.arc(-s*.40,-s*.04,s*.05,0,7); g.fill(); }); }
  });
  // 차양 위 고양이 · 용마루 고양이
  if(i>=3) cat(.34,B1+.20,FZ-.08, .76, white? CREAM : '#B6A99A', true);
  if(i>=4) cat(A0+.62,(B0+B1)/2,FZ+.44+.28+.03, .84, '#E8B86A', false);
  // 그릇 둘 — 문 앞. 물그릇과 밥그릇이 여기서 산다.
  if(i>=3) at(1.2, ()=>{
    for(const [aa,bb,col] of [[.30,B1+.30,T(WD2,.86)],[.58,B1+.22,'#9BC6D6']]){
      const q=P(aa,bb,.03);
      g.fillStyle=T(col,.80); g.beginPath(); g.ellipse(q[0],q[1]-c*.010,c*.060,c*.034,0,0,7); g.fill();
      g.fillStyle=T(col,1.12); g.beginPath(); g.ellipse(q[0],q[1]-c*.020,c*.044,c*.022,0,0,7); g.fill(); } });
  // 우유 상자 — 가게 앞 소품
  if(i>=3) at(1.0, ()=>boxAt(-.92,B1+.10, -.62,B1+.38, .02,.24, white?'#E4E9EE':'#C6CED6', .03));
  // 등불 — 가게 모서리에 매단다
  if(i>=5) at(1.6, ()=>{ const a=A1+.06, b=B1+.18;
    seg([a,b,FZ+.02],[a,b,FZ-.02], WD4, Math.max(2,c*.018));
    const q=P(a,b,FZ-.14); growthLantern(g,q[0],q[1],c*.15); });
  // 길에 앉은 고양이
  if(i>=2) cat(-.52,B1+.62,.03, .90, white? CREAM : CREAM2, false);
  flush();
};
GROWTH_ART.colPin=function(g,x,y,c,i,opt){
  const K=growRig(g,x,y,c,.9,.9,.82,.5), {P,poly,seg,boxAt,disc,tube,onGable,at,flush}=K;
  const dark=i>=5, white=i===4;
  const POST = white? CREAM2 : WD3;
  at(-.90, ()=>{ disc(0,0,.05,.44,T(STONE,.90));
    { const q0=P(0,0,0), q1=P(0,0,.05), rx=.44*1.414*K.ux, ry=.44*1.414*K.uy;
      g.fillStyle=T(STONE,.74); g.beginPath();
      g.moveTo(q1[0]-rx,q1[1]); g.lineTo(q0[0]-rx,q0[1]);
      g.ellipse(q0[0],q0[1],rx,ry,0,Math.PI,0,false);
      g.lineTo(q1[0]+rx,q1[1]); g.closePath(); g.fill();
      g.fillStyle=STONE; g.beginPath(); g.ellipse(q1[0],q1[1],rx,ry,0,0,7); g.fill(); } });
  if(i<2){ at(0, ()=>tube(0,0,.05, i===0? .58 : .74, .055, POST));
    if(i===1) at(.05, ()=>onGable(P(0,0,.74),()=>{
      for(let k=0;k<4;k++){ const th=k*Math.PI/2+0.38, R2=c*.12;
        const ex=Math.cos(th)*R2, ey=Math.sin(th)*R2, px2=-Math.sin(th), py2=Math.cos(th);
        g.fillStyle=[RED,CREAM,WATER,CREAM][k]; g.beginPath();
        g.moveTo(0,0); g.lineTo(ex,ey); g.lineTo(ex+px2*R2*.46, ey+py2*R2*.46); g.closePath(); g.fill(); }
      g.fillStyle=WD3; g.beginPath(); g.arc(0,0,R2v(),0,7); g.fill();
      function R2v(){ return c*.019; } }));
    flush(); return; }
  // 2~ · 풍차 — 위로 좁아지는 탑 + 고깔 + 큰 날개
  const B0=.30, B1=.19, Z0=.05, Z1=.86, WALL = white? CREAM : dark? WD4 : WD;
  at(0, ()=>{
    poly([[B0,-B0,Z0],[B0,B0,Z0],[B1,B1,Z1],[B1,-B1,Z1]], T(WALL,.76));
    poly([[-B0,B0,Z0],[B0,B0,Z0],[B1,B1,Z1],[-B1,B1,Z1]], WALL);
    for(const t of [.30,.62]){ const bz=Z0+(Z1-Z0)*t, bw=B0+(B1-B0)*t;
      seg([-bw,bw,bz],[bw,bw,bz],T(WALL,.84),Math.max(1,c*.010));
      seg([bw,-bw,bz],[bw,bw,bz],T(WALL,.70),Math.max(1,c*.010)); }
    onGable(P(0,B0,Z0),()=>{                       // 문
      g.fillStyle='#6B5A43'; g.beginPath();
      g.moveTo(-c*.054,0); g.lineTo(-c*.054,-c*.084); g.quadraticCurveTo(0,-c*.142,c*.054,-c*.084);
      g.lineTo(c*.054,0); g.closePath(); g.fill();
      g.fillStyle='#8A7458'; g.beginPath();
      g.moveTo(-c*.054,0); g.lineTo(-c*.054,-c*.084); g.quadraticCurveTo(-c*.022,-c*.124,-c*.010,-c*.106);
      g.lineTo(-c*.010,0); g.closePath(); g.fill(); });
    { const bw=B0+(B1-B0)*.70; onGable(P(0,bw,Z0+(Z1-Z0)*.70),()=>{   // 창
      g.fillStyle=CREAM; g.beginPath(); g.ellipse(0,0,c*.046,c*.042,0,0,7); g.fill();
      g.fillStyle=WATER2; g.beginPath(); g.ellipse(0,0,c*.032,c*.029,0,0,7); g.fill(); }); }
    { const q=P(0,0,Z1), qt=P(0,0,Z1+.32), rx=B1*1.7*1.414*K.ux, ry=B1*1.7*1.414*K.uy;   // 고깔
      const RF = roofOf('colPin',dark);
      g.fillStyle=T(RF,.78); g.beginPath(); g.ellipse(q[0],q[1],rx,ry,0,0,7); g.fill();
      g.fillStyle=RF; g.beginPath(); g.moveTo(q[0]-rx,q[1]); g.lineTo(qt[0],qt[1]); g.lineTo(q[0]+rx,q[1]);
      g.closePath(); g.fill();
      g.fillStyle=T(RF,1.18); g.beginPath(); g.moveTo(q[0]-rx,q[1]); g.lineTo(qt[0],qt[1]);
      g.lineTo(q[0],q[1]+ry*.42); g.closePath(); g.fill(); } });
  at(.26, ()=>onGable(P(0,B1+.10,Z1+.06),()=>{     // 큰 날개 넷
    const R2=c*.30, cols = i>=5? [BR,BR2,BR,BR2] : [CREAM,RED,CREAM,WATER];
    for(let k=0;k<4;k++){ const th=k*Math.PI/2+0.42;
      const ex=Math.cos(th)*R2, ey=Math.sin(th)*R2, px2=-Math.sin(th), py2=Math.cos(th);
      g.strokeStyle=WD3; g.lineWidth=Math.max(2,c*.018);
      g.beginPath(); g.moveTo(0,0); g.lineTo(ex,ey); g.stroke();
      g.fillStyle=cols[k]; g.beginPath();
      g.moveTo(ex*.20,ey*.20); g.lineTo(ex*.96,ey*.96);
      g.lineTo(ex*.96+px2*R2*.30, ey*.96+py2*R2*.30);
      g.lineTo(ex*.20+px2*R2*.26, ey*.20+py2*R2*.26); g.closePath(); g.fill();
      g.strokeStyle='rgba(120,100,68,.26)'; g.lineWidth=Math.max(1,c*.007);
      for(let j=1;j<4;j++){ const u=.20+(j/4)*.76;
        g.beginPath(); g.moveTo(ex*u,ey*u); g.lineTo(ex*u+px2*R2*.28, ey*u+py2*R2*.28); g.stroke(); } }
    g.fillStyle=i>=5?BR:WD3; g.beginPath(); g.arc(0,0,R2*.13,0,7); g.fill();
    g.fillStyle=i>=5?BR2:WD2; g.beginPath(); g.arc(-R2*.04,-R2*.04,R2*.07,0,7); g.fill(); }));
  if(i>=3) at(.32, ()=>{                           // 4 · 바람 리본
    for(const [d,col] of [[0,RED],[.10,ORG],[.20,WATER]]){
      const a=P(0,B1+.12,Z1-.04-d*.24), b2=P(.46+d,.34+d,.52-d*.4);
      g.strokeStyle=col; g.lineWidth=Math.max(2,c*.017); g.lineCap='round';
      g.beginPath(); g.moveTo(a[0],a[1]); g.quadraticCurveTo(a[0]+c*.16,a[1]+c*.02,b2[0],b2[1]); g.stroke(); } });
  if(i>=4) for(const [a,b,h2] of [[-.50,.26,.42],[.34,.46,.36],[-.24,.54,.32]]){
    at(a+b, ()=>{ seg([a,b,0],[a,b,h2],POST,Math.max(2,c*.018));
      onGable(P(a,b,h2+.03),()=>{ const R2=c*.075;
        for(let k=0;k<4;k++){ const th=k*Math.PI/2+0.38;
          const ex=Math.cos(th)*R2, ey=Math.sin(th)*R2, px2=-Math.sin(th), py2=Math.cos(th);
          g.fillStyle=[SAGE,CREAM,RED,CREAM][k]; g.beginPath();
          g.moveTo(0,0); g.lineTo(ex,ey); g.lineTo(ex+px2*R2*.46, ey+py2*R2*.46); g.closePath(); g.fill(); }
        g.fillStyle=WD3; g.beginPath(); g.arc(0,0,R2*.20,0,7); g.fill(); }); }); }
  if(i>=5) at(.86, ()=>{ const a=.44,b=.42;
    seg([a,b,0],[a,b,.56],WD3,Math.max(2,c*.026));
    seg([a,b,.56],[a-.13,b,.56],WD3,Math.max(2,c*.020));
    const q=P(a-.13,b,.44); growthLantern(g,q[0],q[1],c*.15); });
  flush();
};
})();



// 작물 — 게임에 들어간 그림 그대로(dig.html drawCrop): 0 당근 · 1 가지 · 2 옥수수.
function growthShadow(g,x,y,rx,ry,a){ g.fillStyle='rgba(40,50,30,'+(a||.16)+')'; g.beginPath(); g.ellipse(x,y,rx,ry,0,0,7); g.fill(); }
function drawCropOn(g,x,y,s,col){
  const c=col|0;
  g.fillStyle='rgba(0,0,0,.16)'; g.beginPath(); g.ellipse(x,y+s*0.30,s*0.26,s*0.075,0,0,7); g.fill();
  if(c===0){
    g.fillStyle='#E8873A'; g.beginPath();
    g.moveTo(x-s*0.17,y-s*0.06); g.lineTo(x+s*0.17,y-s*0.06); g.lineTo(x,y+s*0.30); g.closePath(); g.fill();
    g.fillStyle='#C96B24'; g.beginPath();
    g.moveTo(x+s*0.04,y-s*0.06); g.lineTo(x+s*0.17,y-s*0.06); g.lineTo(x,y+s*0.30); g.closePath(); g.fill();
    g.strokeStyle='rgba(255,240,210,.55)'; g.lineWidth=s*0.028; g.lineCap='round';
    for(const f of [0.03,0.13]){ g.beginPath(); g.moveTo(x-s*(0.13-f),y+s*f*1.6); g.lineTo(x+s*(0.13-f),y+s*f*1.6); g.stroke(); }
    g.fillStyle='#5C8F3C';
    for(const a of [-0.55,0,0.55]){ g.save(); g.translate(x,y-s*0.08); g.rotate(a);
      g.beginPath(); g.ellipse(0,-s*0.14,s*0.055,s*0.15,0,0,7); g.fill(); g.restore(); }
  } else if(c===1){
    g.fillStyle='#7B4EA8'; g.beginPath(); g.ellipse(x,y+s*0.09,s*0.19,s*0.23,0,0,7); g.fill();
    g.fillStyle='#9A6BC8'; g.beginPath(); g.ellipse(x-s*0.06,y+s*0.03,s*0.075,s*0.10,-0.4,0,7); g.fill();
    g.fillStyle='#4F7A3E'; g.beginPath(); g.ellipse(x,y-s*0.16,s*0.13,s*0.06,0,0,7); g.fill();
    g.strokeStyle='#4F7A3E'; g.lineWidth=s*0.045; g.lineCap='round';
    g.beginPath(); g.moveTo(x,y-s*0.16); g.lineTo(x+s*0.02,y-s*0.29); g.stroke();
  } else {
    g.fillStyle='#F0C64C'; g.beginPath(); g.ellipse(x,y+s*0.08,s*0.155,s*0.25,0,0,7); g.fill();
    g.fillStyle='#D8A92C';
    for(const f of [-0.06,0.06]){ g.beginPath(); g.ellipse(x+s*f,y+s*0.08,s*0.035,s*0.22,0,0,7); g.fill(); }
    g.fillStyle='rgba(255,248,214,.6)';
    for(let k=0;k<4;k++){ g.beginPath(); g.ellipse(x-s*0.09,y+s*(-0.08+k*0.09),s*0.028,s*0.03,0,0,7); g.fill(); }
    g.fillStyle='#5C8F3C';
    for(const sd of [-1,1]){ g.save(); g.translate(x+sd*s*0.13,y+s*0.10); g.rotate(sd*0.35);
      g.beginPath(); g.ellipse(0,0,s*0.06,s*0.21,0,0,7); g.fill(); g.restore(); }
  }
}



// ── 6~10동네 성장 그림 ──────────────────────────────────────
// 원본: art/yard-items/growth-06-10.html. 택배 상자와 손수레는 게임 그림
// (drawLog·drawCart)을 그대로 부른다 — 판에서 밀던 그 물건이 마당에 놓인 것이다.
function drawLogOn(g,x,y,s){ const o=ctx; ctx=g; try{ drawLog(x,y,s,1,1,0); } finally { ctx=o; } }
function drawCartOn(g,x,y,s){ const o=ctx; ctx=g; try{ drawCart(x,y,s,false,1,1,0); } finally { ctx=o; } }
function growthLantern(g,x,y,s){                       // 놋쇠 등불 — ★90 공통 소품
  g.fillStyle='rgba(246,207,104,.30)'; g.beginPath(); g.arc(x,y+s*.55,s*.95,0,7); g.fill();
  g.fillStyle=GROWTH_BRASS; rr2(g,x-s*.42,y+s*.12,s*.84,s*.95,s*.16); g.fill();
  g.fillStyle='#F6CF68'; rr2(g,x-s*.26,y+s*.28,s*.52,s*.62,s*.10); g.fill();
  g.fillStyle=GROWTH_BRASS; rr2(g,x-s*.50,y-s*.02,s*1.00,s*.20,s*.08); g.fill();
}

// 택배 상자의 상태 — 열린 뚜껑 · 담기는 것 · 보냄 도장 · 도착 리본.
// 예전 마당 그림이 지고 있던 몫을 성장 그림 위에 얹는다.
function drawBoxLid(g,x,y,s,b){
  const q=s*0.34, d=q*0.3;
  g.save(); g.translate(x,y);
  if(b.open){
    g.fillStyle='#6E5133';
    g.beginPath(); g.moveTo(-q,-q+d); g.lineTo(-q+d,-q); g.lineTo(q,-q); g.lineTo(q,-q+d); g.closePath(); g.fill();
    g.fillStyle='rgba(0,0,0,.22)';
    g.beginPath(); g.moveTo(-q*0.82,-q+d*0.86); g.lineTo(-q*0.66,-q+d*0.2);
    g.lineTo(q*0.86,-q+d*0.2); g.lineTo(q*0.86,-q+d*0.86); g.closePath(); g.fill();
    const F=(ax)=>{ g.beginPath();
      g.moveTo(ax*q*0.06,-q+d*0.55); g.lineTo(ax*q*0.10,-q+d*0.05);
      g.lineTo(ax*q*1.30,-q-d*1.05); g.lineTo(ax*q*1.26,-q-d*0.30); g.closePath(); };
    g.fillStyle='#E0B27C'; F(-1); g.fill();
    g.strokeStyle='rgba(90,55,20,.42)'; g.lineWidth=s*0.013; F(-1); g.stroke();
    g.fillStyle='#D3A067'; F(1); g.fill();
    g.strokeStyle='rgba(90,55,20,.42)'; F(1); g.stroke();
  }
  if(b.filling){                                   // 담긴 것이 열린 뚜껑 사이로 솟는다
    g.fillStyle='#E8823A'; g.beginPath(); g.ellipse(-s*0.10,-s*0.26,s*0.06,s*0.10,-0.3,0,7); g.fill();
    g.fillStyle='#7CA362';
    for(const a of [-0.5,0,0.5]){ g.beginPath(); g.ellipse(-s*0.10+Math.sin(a)*s*0.07,-s*0.36,s*0.035,s*0.07,a,0,7); g.fill(); }
    g.fillStyle='#C9A05A'; g.beginPath(); g.ellipse(s*0.10,-s*0.24,s*0.08,s*0.06,0.2,0,7); g.fill();
  }
  if(b.sent){                                      // 보냄 — 발바닥 도장
    g.save(); g.rotate(-0.22); g.globalAlpha=.85;
    g.strokeStyle='#C0553F'; g.lineWidth=s*0.022;
    rr2(g,-s*0.20,-s*0.08,s*0.40,s*0.17,s*0.04); g.stroke();
    g.fillStyle='#C0553F';
    g.beginPath(); g.ellipse(0,s*0.03,s*0.05,s*0.04,0,0,7); g.fill();
    for(const t of [[-0.055,-0.035],[0,-0.05],[0.055,-0.035]]){
      g.beginPath(); g.ellipse(s*t[0],s*0.03+s*t[1],s*0.021,s*0.026,0,0,7); g.fill(); }
    g.restore();
  }
  if(b.arrived){                                   // 도착 — 리본
    g.strokeStyle='#E58A94'; g.lineWidth=s*0.05;
    g.beginPath(); g.moveTo(0,-s*0.30); g.lineTo(0,s*0.22); g.stroke();
    g.beginPath(); g.moveTo(-s*0.34,-s*0.06); g.lineTo(s*0.34,-s*0.06); g.stroke();
    g.fillStyle='#F2AEB6';
    g.beginPath(); g.ellipse(-s*0.09,-s*0.30,s*0.09,s*0.07,-0.5,0,7); g.fill();
    g.beginPath(); g.ellipse(s*0.09,-s*0.30,s*0.09,s*0.07,0.5,0,7); g.fill();
  }
  g.restore();
}



function brookPath(g,x,y,c,W){
  g.beginPath();
  g.moveTo(x+c*.26, y+c*.740);
  g.bezierCurveTo(x+c*.62,y+c*.690, x+c*.68,y+c*.520, x+W*.5,y+c*.545);
  g.bezierCurveTo(x+W-c*.64,y+c*.572, x+W-c*.54,y+c*.760, x+W-c*.26,y+c*.700);
}

// 날개에 걸린 것 — w 는 대략 폭. 연 · 밀짚모자 · 양말 · 도토리 자루.
function drawPinStuck(g,x,y,w,k){
  g.save(); g.translate(x,y); const u=w/30;
  if(k==='kite'){ g.fillStyle='#E85D5D'; g.beginPath(); g.moveTo(0,-14*u); g.lineTo(11*u,0); g.lineTo(0,16*u); g.lineTo(-11*u,0); g.closePath(); g.fill();
    g.strokeStyle='#FFF3D6'; g.lineWidth=1.6*u; g.beginPath(); g.moveTo(0,-14*u); g.lineTo(0,16*u); g.moveTo(-11*u,0); g.lineTo(11*u,0); g.stroke();
    g.strokeStyle='#6B5A48'; g.lineWidth=1.2*u; g.beginPath(); g.moveTo(0,16*u); g.quadraticCurveTo(-6*u,24*u,2*u,30*u); g.quadraticCurveTo(8*u,36*u,0*u,42*u); g.stroke();
    g.strokeStyle='#F0B23C'; g.lineWidth=3*u; g.lineCap='round'; g.beginPath(); g.moveTo(-3*u,25*u); g.lineTo(3*u,27*u); g.moveTo(-1*u,35*u); g.lineTo(5*u,36*u); g.stroke(); }
  else if(k==='hat'){ g.fillStyle='#E8C66A'; g.beginPath(); g.ellipse(0,4*u,17*u,5*u,0,0,7); g.fill();
    g.fillStyle='#F0D27E'; g.beginPath(); g.moveTo(-9*u,4*u); g.bezierCurveTo(-9*u,-8*u,9*u,-8*u,9*u,4*u); g.closePath(); g.fill();
    g.fillStyle='#D95757'; g.fillRect(-9*u,-1*u,18*u,3*u); }
  else if(k==='sock'){ g.fillStyle='#7FA9E5'; g.beginPath(); g.moveTo(-5*u,-12*u); g.lineTo(5*u,-12*u); g.lineTo(5*u,2*u); g.lineTo(11*u,8*u); g.lineTo(7*u,14*u); g.lineTo(-5*u,4*u); g.closePath(); g.fill();
    g.fillStyle='#FFF3D6'; g.fillRect(-5*u,-12*u,10*u,4*u); }
  else { g.fillStyle='#C9A36B'; g.beginPath(); g.ellipse(0,4*u,10*u,11*u,0,0,7); g.fill();          // 도토리 자루
    g.fillStyle='#A9844E'; g.fillRect(-5*u,-9*u,10*u,4*u);
    g.fillStyle='#8A5A2C'; g.beginPath(); g.ellipse(0,6*u,4*u,4.6*u,0,0,7); g.fill(); g.fillStyle='#5F3E1E'; g.beginPath(); g.ellipse(0,2.6*u,4.4*u,2.2*u,0,0,7); g.fill(); }
  g.restore();
}


if(typeof requestAnimationFrame==='function') requestAnimationFrame(()=>{ if(typeof fit==='function') fit(); });
