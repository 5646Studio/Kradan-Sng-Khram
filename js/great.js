/* ============ great v15E — เปิดค่ายทหารหลวง / คอกม้าหลวง (ออนไลน์) ============ */
/* ต้องโหลด "ต่อจาก military_ui.js ทันที" เพื่อเก็บหน้าฝึกตัวจริงไว้ก่อนถูกไฟล์อื่นทับ */
(function(){
  var G = { greatbarracks:1, greatstable:1 };
  var base = window.MilUI && MilUI.openTrain;          /* หน้าฝึกตัวจริงจาก military_ui.js */
  if (!base) return;

  function hook(){
    /* ค่ายหลวง → หน้าฝึกตัวจริง · ค่ายอื่น → ของเดิม */
    if (MilUI.openTrain && !MilUI.openTrain._g){
      var cur = MilUI.openTrain;
      var f = function(k){ return G[k] ? base(k) : cur.apply(this, arguments); };
      f._g = 1; MilUI.openTrain = f;
    }
    /* สั่งฝึกในค่ายหลวง → ส่ง /train พร้อมบอกชื่อค่าย */
    if (window.Military && Military.enqueueTrain && !Military.enqueueTrain._g){
      var en = Military.enqueueTrain;
      var g = function(v, u, n, bk){
        if (!G[bk] || !window.Sync || !Sync.cmd) return en.apply(this, arguments);
        Sync.cmd('/train', { vid:v.id, u:u, n:n, bld:bk }, function(){
          Sync.toast('⚔ เข้าคิวฝึก ' + n + ' นาย');
          if (document.querySelector('[data-tr]')) base(bk);   /* หน้าฝึกยังเปิดอยู่ → วาดคิวใหม่ */
        });
        return null;
      };
      g._g = 1; Military.enqueueTrain = g;
    }
  }
  window.addEventListener('load', hook);
  setInterval(hook, 2000);   /* ถ้ามีไฟล์ไหนเขียนทับซ้ำทีหลัง จะครอบใหม่ให้เอง */
})();
