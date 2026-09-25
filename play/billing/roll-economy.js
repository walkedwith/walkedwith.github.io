(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.RollEconomy = api;
    if (!root.RollBilling) root.RollBilling = api.createUnavailableBilling();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const STATE_KEY = 'roll_economy_v1';
  const LEGACY_KEY = 'roll_paw';
  const MAX_GENERAL_TRANSACTIONS = 500;
  const catalog = Object.freeze({
    treats_small: Object.freeze({
      logicalProductId: 'treats_small', amount: 120, legacyKey: 'paw1',
      storeIds: Object.freeze({ google_play: 'treats_small', app_store: 'treats_small' })
    }),
    treats_medium: Object.freeze({
      logicalProductId: 'treats_medium', amount: 500, legacyKey: 'paw2',
      storeIds: Object.freeze({ google_play: 'treats_medium', app_store: 'treats_medium' })
    }),
    treats_large: Object.freeze({
      logicalProductId: 'treats_large', amount: 1200, legacyKey: 'paw3',
      storeIds: Object.freeze({ google_play: 'treats_large', app_store: 'treats_large' })
    })
  });

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function read(storage, key) { return storage.getItem(key); }
  function write(storage, key, value) { storage.setItem(key, String(value)); }
  function safeLegacyBalance(raw) {
    if (raw === null || raw === '' || !Number.isFinite(Number(raw))) return 0;
    return Math.max(0, Math.floor(Number(raw)));
  }
  function blankState(now, legacyBalance) {
    const transactions = legacyBalance > 0 ? [{
      id: 'legacy_import:' + now,
      type: 'legacy_import', amount: legacyBalance, balanceAfter: legacyBalance,
      createdAt: now, source: 'legacy', metadata: {}
    }] : [];
    return {
      schemaVersion: 1, revision: 0, balance: legacyBalance,
      processedPurchases: {}, transactions,
      migration: { legacyRollPawImported: true, legacyBalance, importedAt: now }
    };
  }
  function validState(value) {
    return value && value.schemaVersion === 1 && Number.isFinite(value.balance) &&
      value.balance >= 0 && value.processedPurchases &&
      Array.isArray(value.transactions) && value.migration;
  }
  function loadState(storage, now) {
    const raw = read(storage, STATE_KEY);
    if (raw !== null && raw !== undefined) {
      let parsed;
      try { parsed = JSON.parse(raw); } catch (_) { throw new Error('ledger_corrupt'); }
      if (!validState(parsed)) throw new Error('ledger_corrupt');
      return parsed;
    }
    const initial = blankState(now, safeLegacyBalance(read(storage, LEGACY_KEY)));
    write(storage, STATE_KEY, JSON.stringify(initial));
    write(storage, LEGACY_KEY, initial.balance);
    return initial;
  }
  function trimTransactions(items) {
    const purchases = items.filter(item => item.type === 'purchase' || item.type === 'legacy_import');
    const general = items.filter(item => item.type !== 'purchase' && item.type !== 'legacy_import');
    return purchases.concat(general.slice(-MAX_GENERAL_TRANSACTIONS)).sort((a, b) => a.createdAt - b.createdAt);
  }

  function createLedger(storage, options) {
    if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') {
      throw new TypeError('storage must implement getItem/setItem');
    }
    options = options || {};
    const now = typeof options.now === 'function' ? options.now : Date.now;
    let state = loadState(storage, now());

    function commit(next) {
      const previous = state;
      next.revision = previous.revision + 1;
      next.transactions = trimTransactions(next.transactions);
      try {
        write(storage, STATE_KEY, JSON.stringify(next));
      } catch (_) {
        state = previous;
        return { ok: false, reason: 'storage_failed', balance: state.balance };
      }
      // This single record owns both balance and deduplication. A legacy mirror
      // failure must not undo its successful commit in memory.
      state = next;
      try { write(storage, LEGACY_KEY, next.balance); } catch (_) {}
      return { ok: true, balance: state.balance };
    }
    function change(entry, sign) {
      const amount = Number(entry && entry.amount);
      if (!Number.isFinite(amount) || amount <= 0 || Math.floor(amount) !== amount) {
        return { ok: false, reason: 'invalid_amount', balance: state.balance };
      }
      if (sign < 0 && state.balance < amount) {
        return { ok: false, reason: 'insufficient_balance', balance: state.balance };
      }
      const next = clone(state);
      next.balance += sign * amount;
      const createdAt = now();
      next.transactions.push({
        id: (entry.type || (sign > 0 ? 'credit' : 'debit')) + ':' + createdAt + ':' + next.revision,
        type: entry.type || (sign > 0 ? 'credit' : 'debit'), amount: sign * amount,
        balanceAfter: next.balance, createdAt,
        source: entry.source || 'game', metadata: entry.metadata || {}
      });
      return commit(next);
    }
    function fulfillPurchase(result, item) {
      if (!result || result.status !== 'purchased') return { ok: false, reason: 'not_purchased' };
      if (!item || !catalog[result.logicalProductId] || item.logicalProductId !== result.logicalProductId) {
        return { ok: false, reason: 'unknown_product' };
      }
      const store = result.store;
      const payload = typeof result.verificationPayload === 'string' ? result.verificationPayload.trim() : '';
      if (!store || !payload) return { ok: false, reason: 'unverified' };
      const expectedStoreId = item.storeIds[store];
      if (store !== 'test' && (!expectedStoreId || expectedStoreId !== result.storeProductId)) {
        return { ok: false, reason: 'product_mismatch' };
      }
      const key = store + ':' + payload;
      if (state.processedPurchases[key]) return { ok: true, duplicate: true, balance: state.balance };
      const next = clone(state);
      const createdAt = now();
      next.balance += item.amount;
      next.processedPurchases[key] = {
        store, logicalProductId: item.logicalProductId,
        storeProductId: result.storeProductId, amount: item.amount,
        purchaseTime: result.purchaseTime || null, processedAt: createdAt,
        transactionId: result.transactionId || null
      };
      next.transactions.push({
        id: 'purchase:' + key, type: 'purchase', amount: item.amount,
        balanceAfter: next.balance, store,
        logicalProductId: item.logicalProductId, storeProductId: result.storeProductId,
        verificationPayload: payload, transactionId: result.transactionId || null,
        createdAt, source: 'iap', metadata: {}
      });
      const committed = commit(next);
      return committed.ok ? { ...committed, duplicate: false, amount: item.amount } : committed;
    }
    return Object.freeze({
      getBalance: () => state.balance,
      getState: () => clone(state),
      credit: entry => change(entry, 1),
      debit: entry => change(entry, -1),
      fulfillPurchase
    });
  }

  function unavailableResult(logicalProductId) {
    return {
      status: 'unavailable', store: 'unavailable', logicalProductId,
      storeProductId: '', verificationPayload: null, transactionId: null,
      purchaseTime: null, errorCode: 'billing_unavailable'
    };
  }
  function createUnavailableBilling() {
    return Object.freeze({
      isAvailable: async () => false,
      getProducts: async () => [],
      purchase: async logicalProductId => unavailableResult(logicalProductId),
      restorePending: async () => []
    });
  }

  function createTestBilling(options) {
    options = options || {};
    const now = typeof options.now === 'function' ? options.now : Date.now;
    let sequence = 0;
    return Object.freeze({
      isAvailable: async () => true,
      getProducts: async logicalProductIds => (logicalProductIds || []).filter(id => catalog[id]).map(id => ({
        logicalProductId: id, storeProductId: id, displayPrice: '테스트 결제', currencyCode: null
      })),
      purchase: async logicalProductId => {
        const payload = 'test:' + now() + ':' + (++sequence) + ':' + Math.random().toString(36).slice(2);
        return catalog[logicalProductId] ? {
          status: 'purchased', store: 'test', logicalProductId,
          storeProductId: logicalProductId, verificationPayload: payload,
          transactionId: payload, purchaseTime: now(), errorCode: null
        } : {
          status: 'failed', store: 'test', logicalProductId,
          storeProductId: logicalProductId || '', verificationPayload: null,
          transactionId: null, purchaseTime: null, errorCode: 'unknown_product'
        };
      },
      restorePending: async () => []
    });
  }

  return Object.freeze({ catalog, createLedger, createUnavailableBilling, createTestBilling, STATE_KEY, LEGACY_KEY });
});
