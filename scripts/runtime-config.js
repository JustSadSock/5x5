(function() {
  if (typeof window === 'undefined') return;
  const global = window;

  const NGROK_SUFFIXES = ['.ngrok-free.app', '.ngrok.app'];

  function hasNgrokSuffix(hostname) {
    return hostname && NGROK_SUFFIXES.some(suffix => hostname.endsWith(suffix));
  }

  function isLocalHost(hostname) {
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hasNgrokSuffix(hostname)
    );
  }

  function normaliseOrigin(input) {
    if (!input) return null;
    try {
      const url = new URL(input, global.location ? global.location.href : undefined);
      if (url.protocol !== 'https:' && !isLocalHost(url.hostname)) {
        console.warn('[runtime-config] Ignoring non-HTTPS origin:', input);
        return null;
      }
      return url.origin;
    } catch (err) {
      console.warn('[runtime-config] Invalid origin provided:', input);
      return null;
    }
  }

  function normaliseSocket(input) {
    if (!input) return null;
    try {
      const url = new URL(input, global.location ? global.location.href : undefined);
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      }
      if (url.protocol !== 'ws:' && url.protocol !== 'wss:') {
        console.warn('[runtime-config] Unsupported WebSocket scheme:', input);
        return null;
      }
      return url.toString();
    } catch (err) {
      console.warn('[runtime-config] Invalid WebSocket URL:', input);
      return null;
    }
  }

  const params = new URLSearchParams(global.location ? global.location.search : '');
  const queryServer = params.get('server');
  const queryWs = params.get('ws');

  let apiOrigin = normaliseOrigin(queryServer);
  if (!apiOrigin) {
    apiOrigin = normaliseOrigin(global.CROSSLINE_API_URL) || normaliseOrigin(global.CROSSLINE_API);
  }
  if (!apiOrigin && global.location) {
    apiOrigin = global.location.origin;
  }

  let wsUrl = normaliseSocket(queryWs);
  if (!wsUrl) {
    wsUrl = normaliseSocket(global.CROSSLINE_WS_URL || global.CROSSLINE_WS);
  }
  if (!wsUrl && apiOrigin) {
    try {
      const wsFromApi = new URL(apiOrigin);
      wsFromApi.protocol = wsFromApi.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = wsFromApi.toString();
    } catch (err) {
      wsUrl = null;
    }
  }

  const runtime = {
    apiOrigin,
    wsUrl,
    wsOrigin: wsUrl ? new URL(wsUrl).origin : null
  };

  global.__CROSSLINE_RUNTIME__ = runtime;
  if (apiOrigin) {
    global.CROSSLINE_API_URL = apiOrigin;
  }
  if (wsUrl) {
    global.CROSSLINE_WS_URL = wsUrl;
    global.WS_SERVER_URL = wsUrl;
  }

  if (typeof global.fetch === 'function' && typeof global.Request === 'function' && typeof global.Headers === 'function') {
    const originalFetch = global.fetch.bind(global);
    global.fetch = (input, init) => {
      const request = new global.Request(input, init);
      let hostname = null;
      try {
        hostname = new URL(request.url, global.location ? global.location.href : undefined).hostname;
      } catch (err) {}

      if (hasNgrokSuffix(hostname)) {
        const headers = new global.Headers(request.headers);
        if (!headers.has('ngrok-skip-browser-warning')) {
          headers.set('ngrok-skip-browser-warning', '1');
        }
        return originalFetch(new global.Request(request, { headers }));
      }

      return originalFetch(request);
    };
  }
})();
