/* ============ Push v14O — เปิด/ปิดแจ้งเตือนบนมือถือ ============ */
var Push = (function(){
  var KEY = 'sw_fcm_tok', inst = false;
  var CATS = [['attack', '⚠️ ถูกโจมตี / ทัพศัตรูกำลังมา', 'เตือนล่วงหน้าได้เฉพาะเมืองที่มีหอคอยเฝ้าระวัง'],
    ['report', '⚔️ ผลการรบของเรา', ''], ['msg', '✉ ข้อความส่วนตัวใหม่', ''],
    ['build', '🔨 ก่อสร้าง / งานเฉลิมฉลองเสร็จ', ''], ['train', '🏋 ฝึกทหารเสร็จ', ''],
    ['hero', '🗿 วีรบุรุษกลับ / รักษาหาย', ''], ['gold', '💰 ผลการเติมทอง', ''], ['ann', '📢 ประกาศจากทีมงาน', '']];
  var CB = '<button class="btn-cancel" onclick="UI.close()">ปิด</button>';
  function $(i){ return document.getElementById(i); }
  function sup(){
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window &&
      typeof firebase !== 'undefined' && !!firebase.messaging && !!window.FCM_VAPID;
  }
  function isOn(){ return sup() && Notification.permission === 'granted' && !!Store.get(KEY); }
  function getTok(){
    return navigator.serviceWorker.register('firebase-messaging-sw.js').then(function(r){
      return firebase.messaging().getToken({ vapidKey:window.FCM_VAPID, serviceWorkerRegistration:r });
    });
  }
  function enable(cb){
    if (!sup()) return cb('อุปกรณ์หรือเบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน');
    Notification.requestPermission().then(function(p){
      if (p !== 'granted') return cb('ไม่ได้รับอนุญาต — เปิดสิทธิ์แจ้งเตือนของเว็บนี้ในการตั้งค่าเบราว์เซอร์');
      getTok().then(function(tk){
        if (!tk) return cb('ขอโทเคนไม่สำเร็จ');
        Store.set(KEY, tk);
        Api.post('/push/register', { token:tk }).then(function(r){ cb(r.ok ? null : (r.err || 'ลงทะเบียนไม่สำเร็จ')); });
      }).catch(function(e){ cb('เปิดไม่สำเร็จ: ' + (e && e.message || e)); });
    });
  }
  function disable(cb){
    var tk = Store.get(KEY);
    Store.set(KEY, '');
    Api.post('/push/unregister', { token:tk || '' }).then(function(){
      try { firebase.messaging().deleteToken(); } catch(e){}
      cb();
    });
  }
  function open(){
    UI.modal('<h3>🔔 การแจ้งเตือน</h3><p class="stnone">กำลังโหลด…</p>');
    Api.post('/push/prefs', {}).then(function(r){
      var pf = (r && r.prefs) || {}, on = isOn();
      var h = '<h3>🔔 การแจ้งเตือน</h3><div class="infobox">' +
        (!sup() ? '⛔ เบราว์เซอร์นี้ไม่รองรับ<br>iPhone: ต้องเพิ่มเกมลงหน้าจอโฮมก่อน แล้วเปิดจากไอคอน (iOS 16.4 ขึ้นไป)'
          : on ? '🔔 เปิดอยู่ในเครื่องนี้' : '🔕 ยังไม่เปิดในเครื่องนี้') +
        '<br><span style="font-size:10.5px">อุปกรณ์ที่ลงทะเบียน ' + ((r && r.devices) || 0) + ' เครื่อง' +
        (r && r.ready === false ? ' · ⚠ เซิร์ฟเวอร์ยังไม่ได้ตั้งค่า' : '') + '</span></div>';
      if (sup()) h += on ? '<div class="grow2"><button class="btn-use mini2" id="puTest">📨 ทดสอบ</button>' +
        '<button class="btn-del mini2" id="puOff">🔕 ปิดในเครื่องนี้</button></div>'
        : '<button class="btn-ok" id="puOn">🔔 เปิดการแจ้งเตือน</button>';
      h += '<h4>เลือกเรื่องที่ต้องการให้แจ้ง</h4>' + CATS.map(function(c){
        return '<label class="misr"><input type="checkbox" data-pc="' + c[0] + '"' + (pf[c[0]] === 0 ? '' : ' checked') + '><span>' + c[1] +
          (c[2] ? '<br><i style="font-size:9.5px;font-style:normal;color:#8a7a55">' + c[2] + '</i>' : '') + '</span></label>';
      }).join('') + '<div class="suphint">ระหว่างเปิดเกมอยู่จะไม่แจ้งซ้ำ ยกเว้นการถูกโจมตี</div>' + CB;
      UI.modal(h);
      var a = $('puOn'), b = $('puOff'), c = $('puTest');
      if (a) a.onclick = function(){
        a.disabled = true;
        enable(function(err){ if (err){ a.disabled = false; return alert(err); } Sync.toast('🔔 เปิดการแจ้งเตือนแล้ว'); open(); });
      };
      if (b) b.onclick = function(){ disable(open); };
      if (c) c.onclick = function(){
        Api.post('/push/test', {}).then(function(x){
          alert(!x.ok ? x.err : x.n ? 'ส่งแล้ว ' + x.n + ' เครื่อง — ปิดหน้าเกมไว้สักครู่เพื่อดูแจ้งเตือน' : 'ส่งไม่สำเร็จ ลองปิดแล้วเปิดการแจ้งเตือนใหม่');
        });
      };
      document.querySelectorAll('[data-pc]').forEach(function(x){
        x.onchange = function(){
          var o = {};
          document.querySelectorAll('[data-pc]').forEach(function(y){ o[y.dataset.pc] = y.checked ? 1 : 0; });
          Api.post('/push/prefs', { prefs:o });
        };
      });
    });
  }
  function install(){
    if (inst) return;
    inst = true;
    if (navigator.serviceWorker) navigator.serviceWorker.addEventListener('message', function(e){
      var d = e.data && e.data.fcm;
      if (d && typeof Sync !== 'undefined'){ Sync.toast('🔔 ' + (d.title || '')); Sync.poll(true); }
    });
    if (isOn()) getTok().then(function(tk){
      if (tk){ Store.set(KEY, tk); Api.post('/push/register', { token:tk }); }
    }).catch(function(){});
  }
  return { open:open, install:install, isOn:isOn };
})();