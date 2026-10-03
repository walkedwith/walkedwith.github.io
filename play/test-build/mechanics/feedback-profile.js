(function(){
  const PROFILES=Object.freeze({
    step:Object.freeze({ level:0, shake:0, hitstop:0, haptic:null }),
    push:Object.freeze({ level:1, shake:0.04, hitstop:0, haptic:10 }),
    collision:Object.freeze({ level:2, shake:0.20, hitstop:0.05, haptic:Object.freeze([14,24,20]) }),
    goal:Object.freeze({ level:3, shake:0.36, hitstop:0.05, haptic:Object.freeze([12,22,18]) }),
    victory:Object.freeze({ level:4, shake:0.50, hitstop:0.08, haptic:Object.freeze([18,36,24]) })
  });

  function profileFor(kind){ return PROFILES[kind]||null; }

  const api=Object.freeze({ PROFILES, profileFor });
  if(typeof module!=="undefined" && module.exports) module.exports=api;
  if(typeof window!=="undefined") window.PuzzleFeedbackProfile=api;
})();
