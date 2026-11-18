/* PhilippoPempo service worker: push + call notifications */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.map(k => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener('fetch', () => {});

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data ? e.data.text() : '' }; }
  const call = d.type === 'call';
  const o = {
    body: d.body || '', lang: 'ar', dir: 'rtl', renotify: true, data: d,
    tag: call ? 'call-' + d.call_id : 'chat-' + (d.chat_id || 'x'),
  };
  if (call) {
    o.requireInteraction = true;
    o.vibrate = [600, 300, 600, 300, 600, 300, 600, 300, 600];
    o.actions = [{ action: 'answer', title: '📞 رد' }];
  } else { o.vibrate = [150]; }
  e.waitUntil(self.registration.showNotification(d.title || 'PhilippoPempo', o));
});

self.addEventListener('notificationclick', e => {
  const d = e.notification.data || {};
  e.notification.close();
  const ans = d.type === 'call' && e.action === 'answer' ? d.call_id : null;
  e.waitUntil((async () => {
    const cs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of cs) {
      if ('focus' in c) { await c.focus(); if (ans) c.postMessage({ answer: ans }); return; }
    }
    await self.clients.openWindow(self.registration.scope + (ans ? '?answer=' + ans : ''));
  })());
});
