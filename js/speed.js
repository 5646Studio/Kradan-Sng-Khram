/* ============ speed v14Z — รับค่าความเร็วเซิร์ฟเวอร์จาก /season ============ */
(function(){
  function go(){
    if (!window.Api) return setTimeout(go, 1000);
    Api.get('/season').then(function(r){
      if (!r || !r.ok || !r.speed) return;
      window.CFG = window.CFG || {};
      CFG.SPEED = r.speed; CFG.TROOP_SPEED = r.tspeed || r.speed;
      window.SERVER_SPEED = r.speed;
    }, function(){});
  }
  go(); setInterval(go, 300000);
})();