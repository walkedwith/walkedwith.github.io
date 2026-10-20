(function(root, factory) {
  const exported = factory();
  if (typeof window === 'undefined' && typeof module === 'object' && module.exports) {
    module.exports = exported;
  } else {
    root.I18N = exported.createI18n({
      locales: root.WWM_LOCALES || {},
      storage: root.localStorage,
      languages: (root.navigator && root.navigator.languages)
        || [(root.navigator && root.navigator.language) || 'en'],
      document: root.document,
    });
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  const SUPPORTED = new Set(['ko', 'en']);

  function selectLocale(saved, languages) {
    if (SUPPORTED.has(saved)) return saved;
    return (languages || []).some(language => String(language).toLowerCase().startsWith('ko'))
      ? 'ko'
      : 'en';
  }

  function interpolate(text, vars) {
    return String(text).replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => (
      Object.prototype.hasOwnProperty.call(vars || {}, key) ? String(vars[key]) : `{${key}}`
    ));
  }

  function createI18n(options) {
    const opts = options || {};
    const locales = opts.locales || {};
    const storage = opts.storage;
    let saved = null;
    try { saved = storage && storage.getItem('roll_language'); } catch (_) {}
    let locale = selectLocale(saved, opts.languages);
    const listeners = new Set();

    function lookup(key, vars) {
      const value = (locales[locale] && locales[locale][key])
        ?? (locales.ko && locales.ko[key])
        ?? key;
      return interpolate(value, vars);
    }

    function apply(host) {
      if (!host || !host.querySelectorAll) return;
      host.querySelectorAll('[data-i18n]').forEach(node => {
        node.textContent = lookup(node.dataset.i18n);
      });
      host.querySelectorAll('[data-i18n-html]').forEach(node => {
        node.innerHTML = lookup(node.dataset.i18nHtml);
      });
      host.querySelectorAll('[data-i18n-aria]').forEach(node => {
        node.setAttribute('aria-label', lookup(node.dataset.i18nAria));
      });
    }

    function syncDocument() {
      if (!opts.document) return;
      opts.document.documentElement.lang = locale;
      opts.document.title = lookup('app.title');
      apply(opts.document);
    }

    const api = {
      get locale() { return locale; },
      t: lookup,
      html: lookup,
      apply,
      setLocale(next) {
        if (!SUPPORTED.has(next) || next === locale) return false;
        locale = next;
        try { if (storage) storage.setItem('roll_language', next); } catch (_) {}
        syncDocument();
        listeners.forEach(listener => listener(next));
        return true;
      },
      onChange(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    };

    syncDocument();
    return api;
  }

  return { selectLocale, interpolate, createI18n };
});
