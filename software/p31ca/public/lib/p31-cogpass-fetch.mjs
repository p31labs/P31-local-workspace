(function() {
  'use strict';

  const BRIDGE_VERSION = 'p31.cogPassBridge/1.0.0';
  const CACHE_TTL = 300_000; // 5 minutes
  const BRIDGE_URL = 'https://p31ca.org/cogpass-bridge/index.html';

  let bridgeIframe = null;
  let bridgeReady = false;
  let pendingRequests = new Map();
  let nonceCounter = 0;
  let cache = { data: null, timestamp: 0 };

  function createBridge() {
    if (bridgeIframe) return;
    bridgeIframe = document.createElement('iframe');
    bridgeIframe.src = BRIDGE_URL;
    bridgeIframe.style.display = 'none';
    bridgeIframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bridgeIframe);
  }

  function isFresh() {
    return cache.data && (Date.now() - cache.timestamp) < CACHE_TTL;
  }

  function generateNonce() {
    nonceCounter++;
    return 'cp-' + Date.now() + '-' + nonceCounter + '-' + Math.random().toString(36).slice(2, 8);
  }

  window.addEventListener('message', function(event) {
    if (event.origin !== 'https://p31ca.org') return;
    if (!event.data || typeof event.data !== 'object') return;
    if (event.data.bridge !== BRIDGE_VERSION) return;

    if (event.data.type === 'cogpass:ready') {
      bridgeReady = true;
      return;
    }

    if (event.data.type === 'cogpass:reply' || event.data.type === 'cogpass:pong') {
      const pending = pendingRequests.get(event.data.nonce);
      if (pending) {
        pending.resolve(event.data);
        pendingRequests.delete(event.data.nonce);
      }
    }
  });

  function sendRequest(type, payload) {
    return new Promise(function(resolve, reject) {
      if (!bridgeIframe || !bridgeIframe.contentWindow) {
        reject(new Error('Bridge not loaded'));
        return;
      }

      const nonce = generateNonce();
      pendingRequests.set(nonce, { resolve, reject });

      const timeout = setTimeout(function() {
        pendingRequests.delete(nonce);
        reject(new Error('Bridge request timed out'));
      }, 10000);

      bridgeIframe.contentWindow.postMessage({
        bridge: BRIDGE_VERSION,
        type: type,
        nonce: nonce,
        ...payload,
      }, 'https://p31ca.org');

      // Override resolve to clear timeout
      const originalResolve = resolve;
      pendingRequests.set(nonce, {
        resolve: function(data) {
          clearTimeout(timeout);
          originalResolve(data);
        },
        reject: function(err) {
          clearTimeout(timeout);
          reject(err);
        },
      });
    });
  }

  window.p31CogPass = {
    get: async function(profile) {
      if (isFresh() && !profile) return cache.data;

      if (!bridgeIframe) createBridge();
      if (!bridgeReady) {
        await new Promise(function(resolve) {
          var check = function() {
            if (bridgeReady) resolve();
            else setTimeout(check, 100);
          };
          check();
        });
      }

      var result = await sendRequest('cogpass:get', { profile: profile || 'public' });
      if (result.status === 'ok' && result.data) {
        cache.data = result.data;
        cache.timestamp = Date.now();
      }
      return result.data;
    },

    ping: async function() {
      if (!bridgeIframe) createBridge();
      return sendRequest('cogpass:ping', {});
    },

    clearCache: function() {
      cache = { data: null, timestamp: 0 };
    },

    getStatus: function() {
      return {
        bridgeReady: bridgeReady,
        iframeExists: !!bridgeIframe,
        cacheFresh: isFresh(),
        cachedAt: cache.timestamp ? new Date(cache.timestamp).toISOString() : null,
      };
    },
  };

  createBridge();
})();
