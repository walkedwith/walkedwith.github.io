(()=>{
  'use strict';
  let local=false;
  try{
    local=location.hostname==='localhost' || location.hostname==='127.0.0.1' || location.protocol==='file:';
  }catch(_){ }
  if(typeof document==='undefined') return;

  const query=new URLSearchParams(location.search);
  const load=src=>new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.src=src;
    script.onload=resolve;
    script.onerror=reject;
    document.body.appendChild(script);
  });
  const quietly=promise=>promise.catch(error=>console.warn('[dev-runtime]',error));

  // 측정 모드는 폰에서 맥 주소(같은 와이파이)로 열어 잰다 — localhost 가 아니어도 켠다. 번들엔 파일이 없어 조용히 넘어간다.
  if(query.has('perf')) quietly(load('mechanics/perf-hud.js'));
  if(!local) return;

  if(query.get('goalfeel')==='1' && query.get('corejoy')==='1'){
    quietly(load('mechanics/core-joy-levels.js')
      .then(()=>load('mechanics/grandpa-tools.js'))
      .then(()=>load('mechanics/core-joy-qa.js')));
  }
  if(['sniff','dest','order'].includes(query.get('trainingpractice'))){
    quietly(load('mechanics/training-practice.js'));
  }
  if(query.has('lab')) quietly(load('mechanics/lab-playtest.js'));
})();
