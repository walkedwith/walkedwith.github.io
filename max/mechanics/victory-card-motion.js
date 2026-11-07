(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root.document) root.MaxVictoryCard = api.createRenderer(() => new root.Image());
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  // The exported package never included the 4x4 reward sheets. Use its existing
  // canonical 8-frame art, with the same timing and ground line as winFaceDraw.
  const base = 'art/max-master/motions/canonical/';
  const clips = {
    1: { file: base + 'max-idle-master-v1-front-8f.webp', motion: 'idle', delays: Array(8).fill(120) },
    2: { file: base + 'max-victory-master-v1-front-hop-loop-8f.webp', motion: 'victory', delays: Array(8).fill(105) },
    3: { file: base + 'max-victory-master-v1-front-hop-loop-8f.webp', motion: 'victory', delays: Array(8).fill(105) }
  };
  function tierFor(count) { return Math.min(3, Math.max(0, Math.floor(Number(count) || 0))); }
  function frameFor(tier, seconds, reduced) {
    const clip = clips[tier]; if (!clip || reduced) return 0;
    const total = clip.delays.reduce((sum, ms) => sum + ms, 0);
    let ms = Math.round(Math.max(0, Number(seconds) || 0) * 1000) % total;
    for (let i = 0; i < clip.delays.length; i++) { if (ms < clip.delays[i]) return i; ms -= clip.delays[i]; }
    return 0;
  }
  function createRenderer(makeImage) {
    const cache = new Map();
    function prepare(tier) {
      const clip = clips[tier];
      if (!clip || cache.has(clip.file)) return;
      const image = makeImage(), entry = { image, ready: false, failed: false };
      cache.set(clip.file, entry);
      image.decoding = 'async';
      image.onload = () => {
        if (image.naturalWidth !== 2048 || image.naturalHeight !== 256) { entry.failed = true; return; }
        Promise.resolve(image.decode ? image.decode() : undefined).then(() => { entry.ready = true; }, () => { entry.failed = true; });
      };
      image.onerror = () => { entry.failed = true; };
      image.src = clip.file;
    }
    function draw(ctx, canvas, tier, seconds, reduced) {
      prepare(tier);
      const clip = clips[tier], entry = clip && cache.get(clip.file);
      if (!entry || !entry.ready) return false;
      const frame = frameFor(tier, seconds, reduced);
      const size = Math.round(Math.min(canvas.width, canvas.height) * 0.86);
      const ground = canvas.height * 0.6 + size * 0.36;
      const hop = !reduced && clip.motion === 'victory' && seconds >= 0.84
        ? [0,.008,.026,.070,.105,.070,.026,.008][frame] * size : 0;
      ctx.save(); ctx.imageSmoothingEnabled = true;
      ctx.drawImage(entry.image, frame * 256, 0, 256, 256,
        (canvas.width - size) / 2, ground - size * (232 / 256) + hop, size, size);
      ctx.restore(); return true;
    }
    return { prepare, draw };
  }
  return { clips, tierFor, frameFor, createRenderer };
});
