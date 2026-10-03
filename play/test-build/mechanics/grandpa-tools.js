// Local playtest data for Grandpa's toolbox. This module has no production side effects.
(function(root){
  const tools=Object.freeze({
    glove:Object.freeze({
      name:'할아버지의 작업 장갑', short:'장난감 옮기기',
      story:'구석에 들어간 장난감을 조심스럽게 꺼내 주는 두꺼운 장갑이에요.',
      effect:'장난감 하나를 빈 잔디 칸으로 옮겨요. 받침에는 바로 놓을 수 없어요.',
      action:'장갑이 장난감을 폭신하게 들어 옮겼어요.',
      color:'#D39A55', mark:'G', icon:'art/ui/grandpa-tools/work-glove.svg'
    }),
    scissors:Object.freeze({
      name:'할아버지의 정원 가위', short:'수풀 길내기',
      story:'맥스가 지나갈 길을 정리할 때 쓰던 작은 정원 가위예요.',
      effect:'낮은 수풀 한 칸을 잔디 길로 바꿔요. 울타리와 바깥 테두리는 자를 수 없어요.',
      action:'싹둑! 낮은 수풀이 잔디 길이 되었어요.',
      color:'#78A85B', mark:'S', icon:'art/ui/grandpa-tools/garden-shears.svg'
    }),
    tunnel:Object.freeze({
      name:'할아버지의 땅굴 삽', short:'반대편으로 뿅',
      story:'밭일 때 쓰던 작은 삽. 막히면 맥스가 살짝 파고 반대편으로 나와요.',
      effect:'낮은 수풀 한 칸 아래를 지나 반대편 빈 잔디 칸으로 이동해요. 장난감은 못 지나가요.',
      action:'흙이 통통 튀고, 맥스가 반대편에서 뿅 나왔어요.',
      color:'#B97845', mark:'T', icon:'art/ui/grandpa-tools/tunnel-spade.svg'
    })
  });
  // x is the one removable bush, g is a target bed, b is a toy, d is Max.
  const demos=Object.freeze([
    {tool:'glove',title:'구석의 장난감',hint:'장난감을 길 한가운데 빈칸으로 옮겨, 다시 밀 수 있는 자리를 만들어보세요.',
      rows:['########','#......#','#.###..#','#d.b.g.#','#......#','########','########','########'],from:[3,3],to:[4,3]},
    {tool:'scissors',title:'수풀 사이 길',hint:'낮은 수풀 한 칸을 자르면, 맥스가 장난감 뒤에 설 수 있어요.',
      rows:['########','#dxb.g.#','#.####.#','#......#','########','########','########','########'],cut:[1,2]},
    {tool:'tunnel',title:'비밀 땅굴',hint:'수풀 아래로 지나가 반대편의 미는 자리로 나와보세요.',
      rows:['########','#dxt...#','#.####.#','#..b.g.#','#......#','########','########','########'],from:[1,1],through:[1,2],to:[1,3]}
  ].map(d=>Object.freeze({...d,rows:Object.freeze(d.rows.map(r=>r.replace(/\s/g,'')))})));
  function tileRows(demo){return demo.rows.map(row=>[...row].map(ch=>ch==='x'||ch==='#'?'#':'.'));}
  function baked(demo){
    let T='',d=null,b=[],h=[];
    demo.rows.forEach((row,r)=>[...row].forEach((ch,c)=>{
      T+=(ch==='#'||ch==='x')?'0':'1';
      if(ch==='d')d=[r,c];if(ch==='b')b.push([r,c,0,0]);if(ch==='g')h.push([r*8+c,0]);
    }));
    return {T,d,b,h,p:[],par:99};
  }
  // Each interaction is a small, readable sequence rather than an immediate effect.
  // The UI consumes these targets in order after the player arms a tool.
  function targetsFor(demo){
    if(demo.tool==='glove')return [demo.from.slice(),demo.to.slice()];
    if(demo.tool==='tunnel')return [demo.through.slice(),demo.to.slice()];
    return [demo.cut.slice()];
  }
  function targetFor(demo,r,c,phase=0){
    const target=targetsFor(demo)[phase];
    if(r===undefined||c===undefined)return target.slice();
    return target[0]===r&&target[1]===c;
  }
  function use(demo, state){
    const type=demo.tool, next={dog:{...state.dog},boxes:state.boxes.map(b=>({...b})),tiles:state.tiles.map(r=>r.slice()),used:[...(state.used||[])]};
    if(next.used.includes(type))return {ok:false,state:next,reason:'이미 쓴 도구예요.'};
    if(type==='glove'){
      const box=next.boxes.find(b=>b.r===demo.from[0]&&b.c===demo.from[1]);
      if(!box)return {ok:false,state:next,reason:'옮길 장난감이 없어요.'};
      if(demo.to[0]===demo.goal?.[0]&&demo.to[1]===demo.goal?.[1])return {ok:false,state:next,reason:'받침에는 직접 놓을 수 없어요.'};
      box.r=demo.to[0];box.c=demo.to[1];
    } else if(type==='scissors'){
      const [r,c]=demo.cut;if(next.tiles[r][c]!=='#')return {ok:false,state:next,reason:'자를 수 있는 수풀이 아니에요.'};
      next.tiles[r][c]='.';
    } else if(type==='tunnel'){
      if(next.dog.r!==demo.from[0]||next.dog.c!==demo.from[1])return {ok:false,state:next,reason:'맥스가 땅굴 입구에 서 있어야 해요.'};
      if(next.tiles[demo.through[0]][demo.through[1]]!== '#')return {ok:false,state:next,reason:'낮은 수풀이 있는 곳에만 팔 수 있어요.'};
      if(next.tiles[demo.to[0]][demo.to[1]]!=='.'||next.boxes.some(b=>b.r===demo.to[0]&&b.c===demo.to[1]))return {ok:false,state:next,reason:'반대편이 비어 있어야 해요.'};
      next.dog={r:demo.to[0],c:demo.to[1]};
    } else return {ok:false,state:next,reason:'알 수 없는 도구예요.'};
    next.used.push(type);return {ok:true,state:next};
  }
  const api={tools,demos,tileRows,baked,targetsFor,targetFor,use};
  if(typeof module!=='undefined')module.exports=api;else root.GrandpaTools=api;
})(globalThis);
