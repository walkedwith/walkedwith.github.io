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
    const resetFrameClock = o.resetFrameClock || noop;
    const closeTopOverlay = o.closeTopOverlay || (() => false);
    const isInStage = o.isInStage || (() => false);
    const requestStageExit = o.requestStageExit || noop;
    const exitApp = o.exitApp || noop;
    let hidden = false;

    async function background() {
      if (hidden) return;
      hidden = true;
      await pauseAudio();
    }

    async function foreground() {
      if (!hidden) return;
      hidden = false;
      resetFrameClock();
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
      if (doc && doc.addEventListener) {
        doc.addEventListener('visibilitychange', () => {
          if (doc.hidden) background();
          else foreground();
        });
      }
      if (capacitorApp && capacitorApp.addListener) {
        capacitorApp.addListener('appStateChange', state => {
          if (state && state.isActive) foreground();
          else background();
        });
        capacitorApp.addListener('backButton', back);
      }
      return api;
    }

    const api = { background, foreground, back, attach, isBackgrounded: () => hidden };
    return api;
  }

  return { createAppLifecycle };
});
