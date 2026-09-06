(function(){
  const GATEWAY_ORIGIN = (document.currentScript && document.currentScript.dataset.gatewayOrigin) || window.location.origin;
  const SESSION_KEY = 'p31_session';

  function getSessionId(){
    const m = document.cookie.match(new RegExp('(^| )' + SESSION_KEY + '=([^;]+)'));
    return m ? m[2] : null;
  }

  function setCookie(id){
    const exp = new Date(Date.now()+864e5).toUTCString();
    document.cookie = SESSION_KEY + '=' + id + ';expires=' + exp + ';path=/;SameSite=Lax;Secure';
  }

  async function syncState(patch){
    const sid = getSessionId();
    if(!sid || Object.keys(patch).length === 0) return;
    try{
      const res = await fetch(GATEWAY_ORIGIN + '/api/state', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Session-ID': sid },
        body: JSON.stringify(patch),
        credentials: 'include',
      });
      if(res.status === 403){
        const init = await fetch(GATEWAY_ORIGIN + '/api/state', {
          method: 'GET',
          headers: { 'X-Session-ID': sid },
          credentials: 'include',
        });
        if(init.ok){
          const data = await init.json();
          if(data && data.state && data.state.sessionId && data.state.sessionId !== sid){
            setCookie(data.state.sessionId);
          }
        }
      }
    }catch(e){}
  }

  const watched = new Set(['data-spoons','data-love-balance','data-trust-tier','data-active-tab']);
  const observer = new MutationObserver(function(mutations){
    let dirty = false;
    const patch: any = {};
    mutations.forEach(function(m){
      if(m.type === 'attributes' && m.target && watched.has(m.attributeName)){
        const el = m.target as HTMLElement;
        const attr = m.attributeName as string;
        patch[attr] = el.getAttribute(attr);
        dirty = true;
      }
      if(m.type === 'childList'){
        m.addedNodes.forEach(function(n){
          if(n instanceof HTMLElement && n.dataset && watched.has(n.dataset.attr)){
            dirty = true;
          }
        });
      }
    });
    if(dirty){
      const mapped: any = {};
      if(patch['data-spoons'] !== undefined) mapped.spoonLevel = Number(patch['data-spoons']);
      if(patch['data-love-balance'] !== undefined) mapped.loveBalance = Number(patch['data-love-balance']);
      if(patch['data-trust-tier'] !== undefined) mapped.trustTier = patch['data-trust-tier'];
      if(patch['data-active-tab'] !== undefined) mapped.tab = patch['data-active-tab'];
      if(Object.keys(mapped).length){
        syncState(mapped);
      }
    }
  });

  document.addEventListener('DOMContentLoaded', function(){
    const root = document.documentElement;
    observer.observe(root, { attributes: true, attributeFilter: Array.from(watched), subtree: true });
  });

  window.__p31StateSync = { syncState: syncState, observer: observer };
})();
