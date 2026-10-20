(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MaxAppLifecycle = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function noop() {}

  function createAppLifecycle(options) {
    const o = options || {};
    const pauseAudio = o.pauseAudio || noop;
    const resumeAudio = o.resumeAudio || noop;
    const pauseFrames = o.pauseFrames || noop;
    const resumeFrames = o.resumeFrames || noop;
    const releaseResources = o.releaseResources || noop;
    const restoreResources = o.restoreResources || noop;
    const resetFrameClock = o.resetFrameClock || noop;
    const closeTopOverlay = o.closeTopOverlay || (() => false);
    const isInStage = o.isInStage || (() => false);
    const requestStageExit = o.requestStageExit || noop;
    const exitApp = o.exitApp || noop;
    let hidden = false;
    let detachCurrent = noop;

    async function background(fullRelease) {
      if (hidden) { if(fullRelease) await releaseResources(); return; }
      hidden = true;
      pauseFrames();
      await pauseAudio();
      if (fullRelease) await releaseResources();
    }

    async function foreground() {
      if (!hidden) return;
      hidden = false;
      await restoreResources();
      resetFrameClock();
      resumeFrames();
      // Restore lifecycle state even with music off. The audio owner applies
      // music/effect preferences independently when deciding what to play.
      await resumeAudio();
    }

    function back() {
      if (closeTopOverlay()) return 'overlay';
      if (isInStage()) {
        requestStageExit();
        return 'stage';
      }
      exitApp();
      return 'app';
    }

    function attach(doc, capacitorApp) {
      detachCurrent();
      const cleanups = [];
      let detached = false;
      if (doc && doc.addEventListener) {
        const visibility = () => {
          if (doc.hidden) background();
          else foreground();
        };
        const pagehide = () => background(true);
        const pageshow = () => foreground();
        doc.addEventListener('visibilitychange', visibility);
        doc.addEventListener('pagehide', pagehide);
        doc.addEventListener('pageshow', pageshow);
        cleanups.push(()=>doc.removeEventListener('visibilitychange', visibility));
        cleanups.push(()=>doc.removeEventListener('pagehide', pagehide));
        cleanups.push(()=>doc.removeEventListener('pageshow', pageshow));
      }
      if (capacitorApp && capacitorApp.addListener) {
        const remember = handle => {
          if(handle && typeof handle.then==='function') handle.then(remember).catch(noop);
          else if(handle && typeof handle.remove==='function'){
            if(detached) handle.remove(); else cleanups.push(()=>handle.remove());
          }
        };
        remember(capacitorApp.addListener('appStateChange', state => {
          if (state && state.isActive) foreground();
          else background();
        }));
        remember(capacitorApp.addListener('backButton', back));
      }
      detachCurrent=()=>{ detached=true; while(cleanups.length){ try{ cleanups.pop()(); }catch(_){ } } detachCurrent=noop; };
      return api;
    }

    function detach(){ detachCurrent(); }
    const api = { background, foreground, back, attach, detach, isBackgrounded: () => hidden };
    return api;
  }

  return { createAppLifecycle };
});
