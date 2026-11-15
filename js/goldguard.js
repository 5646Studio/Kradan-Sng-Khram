/* ============ goldguard v15G — ถามยืนยันก่อนใช้ทองทุกครั้ง ============
   ต้องโหลดต่อจาก dialog.js (ใช้ GameDialog.ask)
   ครอบปุ่ม: ⚡ เสร็จทันที/ทันที (.btn-rush) และรายการในหน้าต่างทอง (#g1-#g4)
   ถ้าทองไม่พอ จะไม่ถาม ปล่อยให้เกมแจ้งเตือน "ทองไม่พอ" ตามเดิม */
(function(){
  var passing = false, asking = false;

  function numIn(s){
    var m = String(s || '').replace(/,/g, '').match(/(\d+)\s*$/);
    return m ? +m[1] : NaN;
  }
  function costOf(el){
    if (el.classList.contains('btn-rush')) return numIn(el.textContent);
    var b = el.querySelector('b');
    return b ? numIn(b.textContent.replace(/[^\d,]/g, '')) : NaN;
  }
  function goldNow(){
    try { return Math.floor(Game.player.gold); } catch(e){ return NaN; }
  }
  function target(e){
    var t = e.target;
    if (!t || !t.closest) return null;
    return t.closest('.btn-rush') || t.closest('#modalbox #g1, #modalbox #g2, #modalbox #g3, #modalbox #g4');
  }
  function again(el){
    if (document.contains(el)) return el;
    if (el.id){ var a = document.getElementById(el.id); if (a) return a; }
    if (el.dataset && el.dataset.rush !== undefined){
      var b = document.querySelector('[data-rush="' + el.dataset.rush + '"]');
      if (b) return b;
    }
    return el;
  }

  document.addEventListener('click', function(e){
    if (passing || asking) {
      if (asking && !passing && target(e)){ e.preventDefault(); e.stopImmediatePropagation(); }
      return;
    }
    if (typeof GameDialog === 'undefined') return;
    var el = target(e);
    if (!el) return;
    var cost = costOf(el), have = goldNow();
    if (!(cost > 0) || !(have >= cost)) return;      /* ไม่รู้ราคา หรือทองไม่พอ → ให้เกมจัดการเอง */
    e.preventDefault();
    e.stopImmediatePropagation();
    asking = true;
    GameDialog.ask('💰 ยืนยันการใช้ทอง ' + cost + ' ?\nทองคงเหลือ ' + (have - cost), function(ok){
      asking = false;
      if (!ok) return;
      var t = again(el);
      passing = true;
      try { t.dispatchEvent(new MouseEvent('click', { bubbles:true, cancelable:true, view:window })); }
      finally { passing = false; }
    });
  }, true);
})();
