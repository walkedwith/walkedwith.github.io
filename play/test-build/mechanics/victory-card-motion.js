(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root.document) root.MaxVictoryCard = api.createRenderer(() => new root.Image());
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  const clips = {
    1: { file: 'one-treat', motion: '01-wiggle-dance', delays: [220,110,110,90,90,120,140,140,100,140,120,180,300,200,90,180] },
    2: { file: 'two-treats', motion: '03-rebound-jumps', delays: [200,110,130,100,180,100,90,90,130,80,100,90,250,200,90,180] },
    3: { file: 'three-treats', motion: '04-happy-shiver', delays: [200,180,80,70,70,70,70,80,100,110,150,110,250,200,90,180] }
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
      if (!clips[tier] || cache.has(tier)) return;
      const image = makeImage(), entry = { image, ready: false, failed: false };
      cache.set(tier, entry);
      image.decoding = 'async';
      image.onload = () => { entry.ready = image.naturalWidth === 768 && image.naturalHeight === 768; entry.failed = !entry.ready; };
      image.onerror = () => { entry.failed = true; };
      image.src = 'art/max-master/motions/victory-card-v1/' + clips[tier].file + '.webp';
    }
    function draw(ctx, canvas, tier, seconds, reduced) {
      prepare(tier);
      const entry = cache.get(tier);
      if (!entry || !entry.ready) return false;
      const frame = frameFor(tier, seconds, reduced);
      const size = Math.round(Math.min(canvas.width, canvas.height) * 0.94);
      ctx.save(); ctx.imageSmoothingEnabled = true;
      ctx.drawImage(entry.image, frame % 4 * 192, Math.floor(frame / 4) * 192, 192, 192,
        (canvas.width - size) / 2, (canvas.height - size) / 2, size, size);
      ctx.restore(); return true;
    }
    return { prepare, draw };
  }
  return { clips, tierFor, frameFor, createRenderer };
});
