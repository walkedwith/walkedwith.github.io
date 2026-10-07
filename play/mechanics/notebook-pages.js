// 수첩 — 종이 한 장에 쪽 넷. 진열장 · 설계도(3판) · 앨범(동네 완료) · 일과표(50판) ·
// 달력(첫 도장). 쪽은 열린 것만 그리고, 첫 하나가 열린 뒤엔 다음 하나만 자물쇠로 예고한다
// (힌트 줄과 같은 규칙). 예전엔 설계도 종이와 일과표 화면이 따로였고 떠 있는 버튼도 둘이었다.
// 산책달력을 뺐다. 도장 보상은 **상점의 오늘 선물**이 지므로(stampShopClaim) 지급은
// 그대로 돌고, 같은 자료를 한 번 더 보여 주던 페이지만 사라진다. 신규 유저가 수첩을
// 처음 열면 이 달력 한 장만 열려 있었다 — 나머지 셋은 아직 잠긴 채였다(실측).
// 짓기 쪽을 뺐다 — **모으는 건 수첩, 짓는 건 마당**이 되면서 이 쪽이 할 일이
// 없어졌다. 사다리를 짓는 자리는 그 동네 마당의 대표 물건이다(yardBuildOpen).
// 진행 그림(DISTRICT_GROWTH·GROWTH_ART)은 그대로 돈다 — 마당이 그걸 쓴다.
NOTE_PAGES=['case','bp','album','chores'];   // 진열장 · 설계도 · 앨범 · 일과표
notePage='case'; noteLast='case';
function noteBuildSeen(){ for(const n in DISTRICT_GROWTH) if(hardClearedIn(+n)>0) return true; return false; }
function notePageOn(pg){
  if(!NOTEBOOK_ON) return false;                               // 수첩 휴면 — 쪽이 하나도 안 열리면 버튼·안내·딥링크가 같이 꺼진다
  if(pg==='case')   return CASE_ON && setItems('fetch').some(k=>caseState(k)!=='q');   // 진열장 = 장난감 앨범 — 하나라도 물어 오면
  // 설계도 쪽 — 조각·설계도가 하나라도 있거나, 도면을 올릴 마당이 하나라도 열렸으면.
  // 도면 쪽 — 작은 가구 조각·도면·지은 것이 하나라도 있거나, 큰 가구 도면을 올릴 마당이 열렸으면. 장난감은 안 센다.
  if(pg==='bp' && HOUSE_ON) return false;                      // 하우스에선 꾸러미가 방 가구를 준다 — 설계도 쪽은 접는다
  if(pg==='bp')     return Object.keys(chipBag).some(n=>(chipBag[n]|0)>0) || bpMade.length>0
                        || Object.keys(COLLECT).some(k=>!COLLECT[k].set && yardOwned.includes(k))
                        || DISTRICTS.some((d,i)=>!!DISTRICT_GROWTH[i+1] && plansIn(i+1)>0);   // 첫 도면(3판 꾸러미)을 받는 순간부터
  // 앨범은 동네의 마지막 발도장이 찍힌 뒤에만 열린다. 스토리 이미지를 새로 만들거나
  // 저장하지 않고, 완주 카드와 산책 배경이 이미 쓰는 최적화 원화를 그대로 재사용한다.
  if(pg==='album')  return CHAPTER_STORIES.some((_,i)=>districtCleared(i+1));
  if(pg==='chores') return questsUnlocked();
  return false;
}
function noteTabs(){
  const open=NOTE_PAGES.filter(notePageOn);
  const next=open.length? (NOTE_PAGES.find(p=>!notePageOn(p) && (p!=='case' || CASE_ON))||null) : null;   // 빼 둔 진열장은 예고도 안 한다
  return {open, next};
}
// 짓는 동네 — 펼친 동네가 곧 짓는 동네다(목록의 떠 있는 버튼과 같은 규칙).
function noteBuildDistrict(){
  const from = lsOpenCh!=null? lsOpenCh : districtOf(nextLv()).from;
  return districtOfLv(from>=0? from : nextLv());
}
function buildCanNow(n){
  const xs=DISTRICT_GROWTH[n]; if(!xs) return false;
  if(!districtGrowthStages(n).some(x=>x.status==='ready')) return false;
  const rec=growthParts(n, builtIn(n))[partsIn(n)];
  return (matBag[recKey(rec)]|0)>0;
}
function giftClaimableNow(){ const [a,t]=giftCount(); return t>0 && a>=t && !giftGot(); }
// 동네 앨범 — 완주한 동네의 원화만 종이에 붙인다. 원화는 산책 목록·완주 카드와 같은
// CHAPTER_STORIES 한 벌이므로, 같은 마을이 화면마다 다른 모습으로 보이지 않는다.
function albumRender(){
  const grid=el('albumGrid'), empty=el('albumEmpty'), count=el('albumCount');
  if(!grid) return;
  const cards=[];
  for(let i=0;i<CHAPTER_STORIES.length;i++){
    if(!districtCleared(i+1)) continue;
    const story=CHAPTER_STORIES[i], d=DISTRICTS[i];
    cards.push({i,story,d});
    chapterStoryLoadArt(story.art,'low');
  }
  if(count) count.textContent=cards.length+' / '+CHAPTER_STORIES.length;
  if(empty) empty.hidden=cards.length>0;
  grid.innerHTML=cards.map(({i,story,d})=>'<button class="albumCard" data-album="'+i+'">'
    +'<span class="albumArt" style="background-image:url(\''+CHAPTER_ART_ROOT+story.art+'\')"></span>'
    +'<b>'+districtName(d)+'</b><i>'+I18N.t('note.albumDone')+'</i></button>').join('');
  grid.querySelectorAll('[data-album]').forEach(b=>onTap(b,()=>{
    const story=CHAPTER_STORIES[+b.dataset.album];
    // 이미 끝낸 마을의 페이지를 다시 펼치는 일이라, 새 이야기 표시나 보상은 만들지 않는다.
    // 닫으면 수첩에 그대로 남는다 — after 를 비우면 기본 동작(그 동네 첫 판 입장 확인)으로 떨어져
    // 앨범을 보다가 느닷없이 산책 확인 창이 떴다.
    chapterStoryOpen(story.from, ()=>{}, true);
  }));
}
// 열릴 때 펴지는 쪽 — 지을 수 있으면 설계도, 받을 게 있으면 일과표, 새 설계도면 진열장,
// 다 아니면 마지막에 보던 쪽. 더 큰 사건이 앞이다.
function noteAutoPage(){
  if(notePageOn('chores') && (questClaimable()>0 || giftClaimableNow())) return 'chores';
  if(notePageOn('bp') && (colBpFresh('plan') || Object.keys(chipBag).some(n=>(chipBag[n]|0)>(chipSeen[n]|0)))) return 'bp';
  if(notePageOn('case') && colBpFresh('toy')) return 'case';
  if(notePageOn(noteLast)) return noteLast;
  return noteTabs().open[0]||'case';
}
function noteLockText(pg){
  if(pg==='chores') return I18N.t('note.lockYard');
  if(pg==='case') return I18N.t('note.lockCase');
  if(pg==='album') return I18N.t('note.lockAlbum');
  if(pg==='bp') return I18N.t('note.lockBp');
  return I18N.t('note.lockBuild');
}
function noteRender(keep){
  const card=el('glCard'); if(!card) return;
  const {open,next}=noteTabs();
  if(!keep && !open.includes(notePage)) notePage=open[0]||'case';
  for(const p of NOTE_PAGES) card.classList.toggle('pg-'+p, p===notePage);
  card.querySelectorAll('.glpg').forEach(d=>d.classList.toggle('on', d.dataset.pg===notePage));
  const tabs=el('glTabs');
  if(tabs){
    tabs.innerHTML = open.map(p=>'<button class="gltab t-'+p+(p===notePage?' on':'')+'" data-pg="'+p+'">'+I18N.t('note.'+p)+'</button>').join('')
      + (next? '<button class="gltab lk t-'+next+'" data-pg="'+next+'" aria-label="'+I18N.t('note.'+next)+'">'+LOCK_SVG+'</button>' : '');
    tabs.querySelectorAll('[data-pg]').forEach(b=>onTap(b, ()=>{
      const pg=b.dataset.pg;
      if(b.classList.contains('lk')){ sfxBlocked(); diaryToast(noteLockText(pg)); return; }
      if(pg===notePage) return;
      tone(660,0.05,'triangle',0.03,880);
      notePage=pg; noteLast=pg; noteRender();
    }));
  }
  if(notePage==='case') caseRender();
  else if(notePage==='bp') bpRender();
  else if(notePage==='album') albumRender();
  else if(notePage==='chores') choresRender();
  noteRingRender();
}
// 진행 링 — 쪽마다 분자/분모 하나. 늘 같은 자리(오른쪽 위, 닫기 옆)라 눈이 갈 데가 안 바뀐다.
function noteRingRender(){
  const r=el('glRing'); if(!r) return;
  let a=0, t=0;
  if(notePage==='case'){ const ks=setItems('fetch'); t=ks.length; a=ks.filter(k=>yardOwned.includes(k)).length; }   // 진열장 링 = 장난감 수
  else if(notePage==='album'){ t=CHAPTER_STORIES.length; a=CHAPTER_STORIES.filter((_,i)=>districtCleared(i+1)).length; }
  else if(notePage==='chores'){ [a,t]=giftCount(); }
  r.hidden=!t;
  r.setAttribute('style', '--p:'+(t? Math.round(a/t*100):0)+'%');
  const rb=r.querySelector('b'); if(rb) rb.textContent=a+'/'+t;
}
function openNotebook(pg){
  if(!el('glCard')) return;
  el("win").classList.remove("show","tswin","lunchwin");
  const {open}=noteTabs(); if(!open.length) return;
  notePage = (pg && open.includes(pg))? pg : noteAutoPage();
  glLook=null;
  noteRender();
  el('glCard').classList.add('show');
  pawFlyCancel();
  // 도면 쪽을 폈는데 지을 수 있는 칸이 있으면 망치를 한 번 짚는다(사람당 한 번).
  if(notePage==='bp') setTimeout(()=>{ if(el('glCard').classList.contains('show') && notePage==='bp') noteBuildGuide(); }, 420);
  clearInterval(diaryResetIv);
  diaryResetIv=setInterval(()=>{
    if(!el("glCard").classList.contains("show")){ clearInterval(diaryResetIv); return; }
    setResetChips();
  }, 60000);
}
function openNote(page){ openNotebook(page==='quest'? 'chores' : page); }
function openDiary(){ openNotebook('chores'); }
function choresRender(){
  setResetChips();
  questRender();
  el("dGoodDog").innerHTML=MAX_SVG;       // 목록 카드와 같은 맥스 — 이모지를 쓰면 딴 개가 된다
  giftRender();
}
