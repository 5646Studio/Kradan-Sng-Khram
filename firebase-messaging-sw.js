/* ============ Service Worker แจ้งเตือนเกม (ไม่ต้องแก้ไฟล์นี้) ============ */
self.addEventListener('install', function(){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ e.waitUntil(self.clients.claim()); });

self.addEventListener('push', function(e){
  var j = {};
  try { j = e.data ? e.data.json() : {}; } catch(x){}
  var d = j.data || j.notification || j || {};
  e.waitUntil(self.clients.matchAll({ type:'window', includeUncontrolled:true }).then(function(list){
    var vis = list.filter(function(c){ return c.visibilityState === 'visible' && c.url.indexOf('game.html') >= 0; });
    if (vis.length){ vis.forEach(function(c){ c.postMessage({ fcm:d }); }); return; }
    return self.registration.showNotification(d.title || 'สุวรรณภูมิ', {
      body:d.body || '', tag:d.tag || 'sw', renotify:true, vibrate:[120, 60, 120],
      icon:'assets/ui/app_192.png', badge:'assets/ui/app_96.png', data:{ url:d.url || 'game.html' } });
  }));
});

self.addEventListener('notificationclick', function(e){
  e.notification.close();
  var url = new URL((e.notification.data && e.notification.data.url) || 'game.html', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type:'window', includeUncontrolled:true }).then(function(list){
    for (var i = 0; i < list.length; i++) if (list[i].url.indexOf('game.html') >= 0 && 'focus' in list[i]) return list[i].focus();
    return self.clients.openWindow(url);
  }));
});