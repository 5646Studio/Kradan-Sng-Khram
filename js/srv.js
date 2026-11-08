/* ============ srv v15A — สปีด + ชื่อเซิร์ฟเวอร์ตามสปีด (แทน speed.js) ============ */
(function(){
  var K = 'sw_srv_' + (window.CFG ? CFG.SERVER_ID : 1);
  function label(){
    var s = (window.CFG && CFG.SPEED) || 1, n = (window.CFG && CFG.SERVER_NAME) || '';
    return s > 1 ? n + ' · SPEED x' + s : n + ' · ปกติ (x1)';
  }
  window.srvLabel = label;
  function paint(){
    document.querySelectorAll('#srvname,[data-srvname]').forEach(function(e){
      var t = label(); if (e.textContent !== t) e.textContent = t;
    });
  }
  function apply(o){
    if (!window.CFG || !o) return;
    CFG.SPEED = o.speed || 1; CFG.TROOP_SPEED = o.tspeed || CFG.SPEED;
    if (o.len) CFG.TOTAL_DAYS = o.len;
    if (o.fortDay) CFG.FORT_OPEN_DAY = o.fortDay;
    if (o.capDay) CFG.CAPITAL_OPEN_DAY = o.capDay;
    if (o.hold) CFG.CAPITAL_HOLD_DAYS = o.hold;
    window.SERVER_SPEED = CFG.SPEED;
    paint();
  }
  /* ใช้ค่าที่จำไว้ก่อน ชื่อจะได้ขึ้นสปีดทันทีไม่ต้องรอเน็ต */
  try { apply(JSON.parse(localStorage.getItem(K) || 'null')); } catch(e){}
  function go(){
    if (!window.Api) return setTimeout(go, 800);
    Api.get('/season').then(function(r){
      if (!r || !r.ok) return;
      var o = { speed:r.speed, tspeed:r.tspeed, len:r.len, fortDay:r.fortDay, capDay:r.capDay, hold:r.hold };
      try { localStorage.setItem(K, JSON.stringify(o)); } catch(e){}
      apply(o);
    }, function(){});
  }
  document.addEventListener('DOMContentLoaded', paint);
  go(); setInterval(go, 300000); setInterval(paint, 2000);
})();
