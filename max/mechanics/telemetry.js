(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MaxTelemetry = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const EVENTS = new Set([
    'app_open', 'level_start', 'level_complete', 'level_fail', 'level_quit',
    'hint_use', 'level_restart'
  ]);
  const PROPS = new Set(['level', 'chapter', 'moves', 'stars', 'hint', 'source', 'reason']);

  function cleanProps(input) {
    const out = {};
    for (const [key, value] of Object.entries(input || {})) {
      if (!PROPS.has(key)) continue;
      if (typeof value === 'number' && Number.isFinite(value)) out[key] = value;
      else if (typeof value === 'string') out[key] = value.slice(0, 40);
      else if (typeof value === 'boolean') out[key] = value;
    }
    return out;
  }

  function createTelemetry(options) {
    const o = options || {};
    const now = o.now || Date.now;
    let sink = typeof o.sink === 'function' ? o.sink : null;
    const maxQueue = Math.max(1, o.maxQueue || 50);
    const queue = [];

    function track(name, props) {
      if (!EVENTS.has(name)) return false;
      const event = { name, at: now(), props: cleanProps(props) };
      if (sink) {
        try { sink(event); } catch (_) { queue.push(event); }
      } else queue.push(event);
      while (queue.length > maxQueue) queue.shift();
      return true;
    }

    function drain() { return queue.splice(0, queue.length); }
    function setSink(next) {
      if (typeof next !== 'function') return false;
      sink = next;
      const pending = drain();
      for (let i = 0; i < pending.length; i++) {
        try { sink(pending[i]); }
        catch (_) {
          queue.push(...pending.slice(i));
          break;
        }
      }
      while (queue.length > maxQueue) queue.shift();
      return true;
    }
    return { track, drain, setSink, allowedEvents: () => [...EVENTS] };
  }

  return { createTelemetry };
});
