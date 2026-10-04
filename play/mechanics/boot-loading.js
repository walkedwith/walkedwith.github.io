(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root.document) root.MaxBootLoading = api.mount(root);
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  const ATLAS = 'art/max-master/motions/loading/max-loading-v1.webp';
  const POSTER = 'art/toy-world/title-toys-v1.webp';
  const timeline = [];
  function add(frame, x, y, duration) { timeline.push({ frame, x, y, duration }); }
  function orbit(i, step, duration) {
    const phase = (i + step / 2) * Math.PI / 6;
    add(i % 24, 256 - (140 + 6 * Math.sin(phase / 2)) * Math.sin(phase),
      238 + 80 * Math.cos(phase) - 9 * Math.abs(Math.sin(phase * 3)), duration);
  }
  // Four laps before the occasional tumble. Position and pose stay separate.
  for (let lap = 0; lap < 2; lap++) for (let i = 0; i < 24; i++) {
    for (let step = 0; step < 2; step++) orbit(i, step, i < 12 ? 50 : 40);
  }
  const xs = [256,244,230,216,200,184,170,160,148,134,120,110,110,110,110,110];
  const delays = [70,100,80,70,90,70,70,70,70,90,70,100,180,120,260,100];
  xs.forEach((x, i) => add(24 + i, x, 294, delays[i]));
  add(1, 110, 305, 90); add(2, 110, 273, 90);
  for (let i = 3; i < 12; i++) for (let step = 0; step < 2; step++) orbit(i, step, 50);
  const duration = timeline.reduce((sum, pose) => sum + pose.duration, 0);
  function sample(ms) {
    let time = Math.max(0, ms) % duration;
    for (const pose of timeline) { if (time < pose.duration) return pose; time -= pose.duration; }
    return timeline[0];
  }

  function mount(win) {
    const doc = win.document, overlay = doc.getElementById('bootLoading');
    if (!overlay) return { ready() {} };
    const canvas = doc.getElementById('bootMax'), ctx = canvas.getContext('2d');
    const fallback = doc.getElementById('bootMaxFallback');
    const status = doc.getElementById('bootStatus'), retry = doc.getElementById('bootRetry');
    const reduced = win.matchMedia('(prefers-reduced-motion: reduce)');
    let saved; try { saved = win.localStorage.getItem('roll_language'); } catch (_) {}
    const locale = ['ko', 'en'].includes(saved) ? saved
      : (win.navigator.languages || []).some(lang => lang.toLowerCase().startsWith('ko')) ? 'ko' : 'en';
    const words = locale === 'ko' ? ['산책 준비 중…', '준비를 마치지 못했어요.', '다시 시도']
      : ['Getting ready for a walk…', 'Could not finish getting ready.', 'Try again'];
    status.textContent = words[0]; retry.textContent = words[2];
    overlay.hidden = false; doc.body.classList.add('startup-loading');
    let stopped = false, initialized = false, domReady = false, posterReady = false;
    let atlasReady = false, raf = 0, elapsed = 0, last = null, image;
    function draw(ms) {
      if (!ctx || !atlasReady) return;
      const pose = sample(ms);
      ctx.clearRect(0, 0, 512, 448);
      ctx.drawImage(image, pose.frame % 8 * 192, Math.floor(pose.frame / 8) * 192,
        192, 192, pose.x - 128, pose.y - 128, 256, 256);
    }
    function tick(now) {
      raf = 0;
      if (stopped || doc.hidden || reduced.matches || !atlasReady) return;
      if (last !== null) elapsed += Math.min(100, now - last);
      last = now; draw(elapsed); raf = win.requestAnimationFrame(tick);
    }
    function animationState() {
      win.cancelAnimationFrame(raf); raf = 0; last = null;
      const animate = atlasReady && !reduced.matches;
      fallback.hidden = animate; canvas.hidden = !animate;
      if (!stopped && !doc.hidden && animate) raf = win.requestAnimationFrame(tick);
      if (!reduced.matches && !image && ctx && !stopped) {
        image = new win.Image(); image.decoding = 'async'; image.fetchPriority = 'high';
        image.onload = () => {
          if (stopped || image.naturalWidth !== 1536 || image.naturalHeight !== 960) return;
          atlasReady = true; draw(elapsed); animationState();
        };
        image.onerror = () => { atlasReady = false; animationState(); };
        image.src = ATLAS;
      }
    }
    function finish() {
      if (stopped) return;
      stopped = true; win.clearTimeout(watchdog); win.clearTimeout(posterTimeout);
      win.cancelAnimationFrame(raf); raf = 0;
      observer.disconnect(); doc.removeEventListener('visibilitychange', animationState);
      reduced.removeEventListener('change', animationState);
      if (image) { image.onload = null; image.onerror = null; image = null; }
      poster.onload = null; poster.onerror = null;
      const wrap = doc.getElementById('wrap'); if (wrap) wrap.inert = false;
      doc.body.classList.remove('startup-loading'); overlay.remove();
      canvas.width = 1; canvas.height = 1;
      if (win.MaxBootLoading) win.MaxBootLoading.ready = function() {};
    }
    function check() {
      if (initialized && domReady && posterReady && !doc.documentElement.classList.contains('font-pending')) finish();
    }
    const observer = new win.MutationObserver(check);
    observer.observe(doc.documentElement, { attributes: true, attributeFilter: ['class'] });
    const poster = new win.Image(); poster.decoding = 'async'; poster.fetchPriority = 'high';
    const settlePoster = () => { posterReady = true; check(); };
    const posterTimeout = win.setTimeout(settlePoster, 4000);
    poster.onload = () => {
      if (poster.decode) poster.decode().then(settlePoster, settlePoster); else settlePoster();
    };
    poster.onerror = settlePoster;
    poster.src = POSTER;
    const watchdog = win.setTimeout(() => {
      if (initialized && domReady) { finish(); return; }
      win.cancelAnimationFrame(raf); atlasReady = false; animationState();
      status.textContent = words[1]; status.setAttribute('data-i18n', 'loading.failed');
      overlay.setAttribute('aria-busy', 'false');
      retry.hidden = false;
    }, 12000);
    retry.addEventListener('click', () => win.location.reload());
    doc.addEventListener('DOMContentLoaded', () => {
      domReady = true;
      const wrap = doc.getElementById('wrap'); if (wrap) wrap.inert = true;
      check();
    }, { once: true });
    doc.addEventListener('visibilitychange', animationState);
    reduced.addEventListener('change', animationState);
    animationState();
    return { ready() { initialized = true; check(); } };
  }
  return { sample, duration, timeline, mount };
});
