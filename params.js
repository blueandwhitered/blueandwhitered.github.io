// Preserve the entry URL for reloads and share its parameters with the worker.
(() => {
  const root = typeof document === 'undefined'
    ? new URL('./', self.location.href)
    : new URL('./', document.currentScript.src);
  const storageKey = new URL('__saved_download_params__', root).href;
  const cacheName = 'personal-site-download-params-v1';

  async function snapshot() {
    const cache = await caches.open(cacheName);
    const response = await cache.match(storageKey);
    return response ? response.json() : null;
  }

  async function read() {
    const saved = await snapshot();
    if (saved?.url) return [...new URL(saved.url).searchParams];
    return Array.isArray(saved) ? saved : saved?.params || [];
  }

  async function save(url) {
    const cache = await caches.open(cacheName);
    await cache.put(storageKey, new Response(JSON.stringify({ url }), {
      headers: { 'Content-Type': 'application/json' },
    }));
  }

  globalThis.B1Params = { read, save };
  if (typeof document === 'undefined') return;

  const incoming = new URL(location.href);
  window.__landingRoot = root.href;
  // Keep relative images/styles/scripts tied to the real page after replaceState.
  const base = document.createElement('base');
  base.href = new URL('./', incoming).href;
  document.head.prepend(base);

  window.__landingParamsReady = (async () => {
    const isRoot = incoming.pathname === root.pathname
      || incoming.pathname === root.pathname + 'index.html';
    if (isRoot && !incoming.search) {
      const saved = await snapshot();
      if (saved?.url) {
        const target = new URL(saved.url);
        const targetIsRoot = target.pathname === root.pathname
          || target.pathname === root.pathname + 'index.html';
        if (target.origin === root.origin && target.pathname.startsWith(root.pathname)
            && (!targetIsRoot || target.search)) {
          location.replace(target.href);
          return new Promise(() => {});
        }
      }
    }
    await save(incoming.href);
    window.__savedDownloadParams = incoming.searchParams;
    history.replaceState(history.state, '', root.href);
  })();
})();
