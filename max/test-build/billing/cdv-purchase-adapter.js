(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MaxCdvBilling = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function createCdvBilling(cdv, options) {
    options = options || {};
    if (!cdv || !cdv.store) throw new TypeError('CdvPurchase store is required');
    const catalog = options.catalog || {};
    const storeName = options.platform === 'app_store' ? 'app_store' : 'google_play';
    const nativePlatform = storeName === 'app_store'
      ? cdv.Platform.APPLE_APPSTORE : cdv.Platform.GOOGLE_PLAY;
    const store = cdv.store;
    const transactions = new Map();
    const waiters = new Map();
    const recovered = [];
    let initialized = false;
    let readyPromise = null;

    function logicalForStoreId(storeProductId) {
      return Object.keys(catalog).find(id => {
        const item = catalog[id];
        return item && item.storeIds && item.storeIds[storeName] === storeProductId;
      });
    }
    function productIdOf(transaction) {
      return transaction && transaction.products && transaction.products[0]
        ? transaction.products[0].id : '';
    }
    function purchaseResult(transaction, status) {
      const storeProductId = productIdOf(transaction);
      const logicalProductId = logicalForStoreId(storeProductId) || storeProductId;
      const payload = String(transaction.purchaseId || transaction.transactionId || '').trim();
      if (payload) transactions.set(payload, transaction);
      return {
        status,
        store: storeName,
        logicalProductId,
        storeProductId,
        verificationPayload: payload || null,
        transactionId: transaction.transactionId || null,
        purchaseTime: transaction.purchaseDate instanceof Date
          ? transaction.purchaseDate.getTime() : null,
        errorCode: null
      };
    }
    function settle(storeProductId, result) {
      const logical = logicalForStoreId(storeProductId) || storeProductId;
      const pending = waiters.get(logical);
      if (pending) {
        clearTimeout(pending.timer);
        waiters.delete(logical);
        pending.resolve(result);
      } else if (result.status === 'purchased') {
        recovered.push(result);
        // Pending payments can complete after purchase() returned or after boot.
        // Notify the game to persist delivery before finishing the transaction.
        if (typeof options.onRecoveryAvailable === 'function') {
          try { options.onRecoveryAvailable(); } catch (_) {}
        }
      }
    }
    function handleTransaction(transaction, status) {
      const storeProductId = productIdOf(transaction);
      if (!storeProductId) return;
      settle(storeProductId, purchaseResult(transaction, status));
    }
    function init() {
      if (readyPromise) return readyPromise;
      readyPromise = Promise.resolve().then(() => {
        if (!initialized) {
          initialized = true;
          const products = Object.values(catalog).map(item => ({
            id: item.storeIds[storeName],
            type: cdv.ProductType.CONSUMABLE,
            platform: nativePlatform
          }));
          store.register(products);
          store.when()
            .productUpdated(function () {})
            .approved(transaction => handleTransaction(transaction, 'purchased'))
            .pending(transaction => handleTransaction(transaction, 'pending'));
          store.error(error => {
            const storeProductId = error && error.productId;
            if (!storeProductId) return;
            const logical = logicalForStoreId(storeProductId) || storeProductId;
            const pending = waiters.get(logical);
            if (!pending) return;
            clearTimeout(pending.timer);
            waiters.delete(logical);
            const cancelled = error.code === cdv.ErrorCode.PAYMENT_CANCELLED;
            pending.resolve({
              status: cancelled ? 'cancelled' : 'failed', store: storeName,
              logicalProductId: logical, storeProductId,
              verificationPayload: null, transactionId: null, purchaseTime: null,
              errorCode: String(error.code || 'billing_error')
            });
          });
        }
        return store.initialize([nativePlatform]);
      }).then(() => true, () => false);
      return readyPromise;
    }
    async function getProducts(logicalIds) {
      if (!await init()) return [];
      return (logicalIds || []).map(logical => {
        const item = catalog[logical];
        if (!item) return null;
        const storeProductId = item.storeIds[storeName];
        const product = store.get(storeProductId, nativePlatform);
        if (!product) return null;
        const price = product.pricing ||
          (product.getOffer && product.getOffer() && product.getOffer().pricingPhases[0]);
        return {
          logicalProductId: logical,
          storeProductId,
          displayPrice: price && price.price || '',
          currencyCode: price && price.currency || null
        };
      }).filter(Boolean);
    }
    async function purchase(logicalProductId) {
      if (!await init()) return unavailable(logicalProductId, 'billing_init_failed');
      const item = catalog[logicalProductId];
      if (!item) return failed(logicalProductId, 'unknown_product');
      if (waiters.has(logicalProductId)) return failed(logicalProductId, 'purchase_in_progress');
      const storeProductId = item.storeIds[storeName];
      const product = store.get(storeProductId, nativePlatform);
      const offer = product && product.getOffer && product.getOffer();
      if (!offer || typeof offer.order !== 'function') return unavailable(logicalProductId, 'product_unavailable');

      return new Promise(resolve => {
        const timer = setTimeout(() => {
          waiters.delete(logicalProductId);
          resolve(failed(logicalProductId, 'purchase_timeout'));
        }, 120000);
        waiters.set(logicalProductId, { resolve, timer });
        Promise.resolve().then(() => offer.order()).then(error => {
          if (!error) return;
          const pending = waiters.get(logicalProductId);
          if (!pending) return;
          clearTimeout(pending.timer);
          waiters.delete(logicalProductId);
          const cancelled = error.code === cdv.ErrorCode.PAYMENT_CANCELLED;
          resolve({
            status: cancelled ? 'cancelled' : 'failed', store: storeName,
            logicalProductId, storeProductId, verificationPayload: null,
            transactionId: null, purchaseTime: null,
            errorCode: String(error.code || 'order_failed')
          });
        }).catch(() => {
          const pending = waiters.get(logicalProductId);
          if (!pending) return;
          clearTimeout(pending.timer);
          waiters.delete(logicalProductId);
          resolve(failed(logicalProductId, 'order_exception'));
        });
      });
    }
    async function finish(result) {
      const payload = result && result.verificationPayload;
      const transaction = payload && transactions.get(payload);
      if (!transaction || typeof transaction.finish !== 'function') return false;
      await transaction.finish();
      transactions.delete(payload);
      return true;
    }
    async function restorePending() {
      if (!await init()) return [];
      return recovered.splice(0, recovered.length);
    }
    return Object.freeze({
      isAvailable: async () => init(), getProducts, purchase, finish, restorePending
    });
  }

  function unavailable(logicalProductId, errorCode) {
    return { status: 'unavailable', store: 'unavailable', logicalProductId,
      storeProductId: '', verificationPayload: null, transactionId: null,
      purchaseTime: null, errorCode };
  }
  function failed(logicalProductId, errorCode) {
    return { status: 'failed', store: 'unavailable', logicalProductId,
      storeProductId: '', verificationPayload: null, transactionId: null,
      purchaseTime: null, errorCode };
  }

  return Object.freeze({ createCdvBilling });
});

(function activateNativeBilling(root) {
  if (!root || !root.document) return;
  let active = false;
  function activate() {
    if (active || !root.CdvPurchase || !root.RollEconomy || !root.MaxCdvBilling) return false;
    const capacitor = root.Capacitor;
    if (!capacitor || !capacitor.isNativePlatform || !capacitor.isNativePlatform()) return false;
    const platform = capacitor.getPlatform && capacitor.getPlatform() === 'ios'
      ? 'app_store' : 'google_play';
    root.RollBilling = root.MaxCdvBilling.createCdvBilling(root.CdvPurchase, {
      catalog: root.RollEconomy.catalog, platform,
      onRecoveryAvailable() {
        if (typeof root.dispatchEvent === 'function' && typeof root.Event === 'function') {
          root.dispatchEvent(new root.Event('maxbillingrecovery'));
        }
      }
    });
    active = true;
    if (typeof root.dispatchEvent === 'function' && typeof root.Event === 'function') {
      root.dispatchEvent(new root.Event('maxbillingready'));
    }
    return true;
  }
  root.document.addEventListener('deviceready', activate, { once: true });
  setTimeout(activate, 0);
})(typeof globalThis !== 'undefined' ? globalThis : this);
