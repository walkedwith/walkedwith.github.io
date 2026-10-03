// 실제 게임의 이동·훈련·렌더링을 쓰는 선택형 연습판. 본 진행 저장은 LS가 격리한다.
const TRAINING_LESSONS={
  sniff:{rows:['########','#......#','#......#','#..#b.g#','#..d#..#','#......#','#......#','########'], key:'sniff'},
  dest:{rows:['########','#......#','#......#','#gdb...#','#......#','#......#','#......#','########'], key:'dest'},
  order:{rows:['########','#..#...#','#..b...#','#..d..g#','#......#','#......#','#......#','########'], key:'order'}
};
function trainingPracticeBoard(k){
  const lesson=TRAINING_LESSONS[k];
  if(!lesson) return null;
  const o={T:'',d:null,b:[],h:[],p:[],par:30};
  lesson.rows.forEach((row,r)=>[...row].forEach((ch,c)=>{
    o.T+=ch==='#'?'0':ch==='g'?'3':'1';
    if(ch==='d') o.d=[r,c];
    if(ch==='b') o.b.push([r,c,0,0]);
    if(ch==='g') o.h.push([r*8+c,0]);
  }));
  return o;
}
function trainingPracticeStart(){
  if(!TRAINING_PRACTICE) return;
  const k=TRAINING_PRACTICE_KEY;
  stopGameEffects(); tutClearTO(); exitMenu();
  menuMode=false; yardMode=false; tutMode=false; tut=false; moonMode=false; tsMode=false; lunchMode=false; selMode=false;
  gintroOn=false; coachSteps=null; unlockCB=null; noteOn=false; matCoach=null;
  moveBuffer=null; walkQueueClear(); dragReset();
  for(const id of ['menu','lvlsel','lvcard','coach','buCard','win','story','chapterStory']) el(id)?.classList.remove('show');
  document.body.classList.remove('insel','moon');
  level=20; starMap={}; for(let i=1;i<20;i++) starMap[i]=1;
  tipSeen={}; for(const tool of ['sniff','dest','order']) tipSeen['tool_'+tool]=1;
  acornSt=[]; boost={sniff:0,dest:0,order:0}; boost[k]=1;
  applyScene(fromBaked(trainingPracticeBoard(k)));
  maxSaid['say.stuck']=1;                         // 훈련으로 구출하는 판에 일반 막힘 경고는 불필요하다
  acornSt=[]; hintPlan=null; par=30; fit(); syncHud(); syncHintAct();
  el('trainingPracticeStatus').textContent=I18N.t('training.practice.'+k);
}
if(typeof module!=='undefined') module.exports={TRAINING_LESSONS,trainingPracticeBoard};
if(typeof TRAINING_PRACTICE!=='undefined' && TRAINING_PRACTICE){
  const panel=document.createElement('section'); panel.id='trainingPracticePanel';
  panel.style.cssText='position:fixed;top:8px;left:8px;right:8px;z-index:99999;margin:auto;max-width:520px;background:#fff9ee;padding:12px;border-radius:16px;color:#503c2b;font:14px system-ui;box-shadow:0 4px 20px #0002';
  const title=document.createElement('strong'); title.textContent=I18N.t('training.practice.title'); panel.appendChild(title);
  const status=document.createElement('p'); status.id='trainingPracticeStatus'; status.style.margin='8px 0'; panel.appendChild(status);
  for(const k of ['sniff','dest','order']){
    const a=document.createElement('a'); a.href='?trainingpractice='+k; a.textContent=I18N.t('hint.'+k+'.name');
    a.style.cssText='display:inline-block;padding:8px;color:#503c2b';panel.appendChild(a);
  }
  const reset=document.createElement('button'); reset.textContent=I18N.t('training.practice.reset');reset.onclick=trainingPracticeStart;panel.appendChild(reset);
  const leave=document.createElement('a');leave.href='dig.html';leave.textContent=I18N.t('training.practice.exit');leave.style.padding='8px';panel.appendChild(leave);
  document.body.appendChild(panel);
  const style=document.createElement('style');
  style.textContent='#hud,#ruleChip,#hintAct [data-hk]:not([data-hk="'+TRAINING_PRACTICE_KEY+'"]){display:none!important}';
  document.head.appendChild(style);
  trainingPracticeStart();
}
