(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MaxProgressRecovery = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function valid(snapshot) {
    return !!snapshot && typeof snapshot === 'object'
      && Number.isInteger(snapshot.level) && snapshot.level >= 1
      && Number.isInteger(snapshot.maxLevel) && snapshot.maxLevel >= snapshot.level
      && snapshot.stars && typeof snapshot.stars === 'object' && !Array.isArray(snapshot.stars)
      && snapshot.best && typeof snapshot.best === 'object' && !Array.isArray(snapshot.best);
  }

  function parse(raw) {
    if (!raw) return null;
    try {
      const value = JSON.parse(raw);
      return valid(value) ? value : null;
    } catch (_) { return null; }
  }

  function createProgressRecovery(storage, key) {
    const currentKey = `${key}:current`;
    const previousKey = `${key}:previous`;

    function save(snapshot) {
      if (!valid(snapshot)) return false;
      try {
        const old = parse(storage.getItem(currentKey));
        if (old) storage.setItem(previousKey, JSON.stringify(old));
        storage.setItem(currentKey, JSON.stringify(snapshot));
        return parse(storage.getItem(currentKey)) !== null;
      } catch (_) { return false; }
    }

    function load() {
      try {
        return parse(storage.getItem(currentKey)) || parse(storage.getItem(previousKey));
      } catch (_) { return null; }
    }

    return { save, load, valid };
  }

  return { createProgressRecovery };
});
