(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.RollTap=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';

  function bindTap(node, fn, options){
    const opt=options||{};
    const threshold=opt.threshold==null?10:opt.threshold;
    const pointerEvents=opt.pointerEvents==null
      ? typeof window!=='undefined'&&!!window.PointerEvent
      : !!opt.pointerEvents;
    let active=false, startX=0, startY=0, pointerId=null, lastTouch=0;
    let gestureStarted=false, suppressClickUntil=0;

    const start=e=>{
      const p=e.touches?e.touches[0]:e;
      active=true; gestureStarted=true; startX=p.clientX; startY=p.clientY;
      pointerId=e.pointerId==null?null:e.pointerId;
    };
    const move=e=>{
      if(!active || (pointerId!=null&&e.pointerId!=null&&e.pointerId!==pointerId)) return;
      const p=e.touches?e.touches[0]:e;
      if(Math.hypot(p.clientX-startX,p.clientY-startY)>threshold) active=false;
    };
    const activate=e=>{
      if(e.preventDefault) e.preventDefault();
      if(opt.beforeTap) opt.beforeTap(e);
      fn(e);
    };
    const end=e=>{
      if(pointerId!=null&&e.pointerId!=null&&e.pointerId!==pointerId){ active=false; return; }
      if(gestureStarted){ gestureStarted=false; suppressClickUntil=Date.now()+500; }
      if(!active) return;
      const p=e.changedTouches?e.changedTouches[0]:e;
      active=false;
      if(Math.hypot(p.clientX-startX,p.clientY-startY)>threshold) return;
      activate(e);
    };
    const cancel=()=>{
      if(gestureStarted) suppressClickUntil=Date.now()+500;
      active=false; gestureStarted=false; pointerId=null;
    };
    node.addEventListener('click',e=>{
      // Keyboard and HTMLElement.click() use detail=0. Only suppress the
      // compatibility click of a handled/canceled physical gesture.
      if(e.detail>0 && (gestureStarted || Date.now()<=suppressClickUntil)){
        active=false; gestureStarted=false;
        if(e.preventDefault) e.preventDefault();
        return;
      }
      activate(e);
    });

    if(pointerEvents){
      node.addEventListener('pointerdown',start);
      node.addEventListener('pointermove',move);
      node.addEventListener('pointerup',end);
      node.addEventListener('pointercancel',cancel);
    }else{
      node.addEventListener('touchstart',e=>{ lastTouch=Date.now(); start(e); },{passive:true});
      node.addEventListener('touchmove',move,{passive:true});
      node.addEventListener('touchend',end,{passive:false});
      node.addEventListener('touchcancel',cancel);
      node.addEventListener('mousedown',e=>{ if(Date.now()-lastTouch>500) start(e); });
      node.addEventListener('mousemove',move);
      node.addEventListener('mouseup',e=>{ if(Date.now()-lastTouch>500) end(e); });
      node.addEventListener('mouseleave',cancel);
    }
    return cancel;
  }

  return {bindTap};
});
