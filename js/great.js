/* ============ great v15F — เปิดค่ายทหารหลวง / คอกม้าหลวง (ออนไลน์) ============ */
/* ต้องโหลด "ต่อจาก military_ui.js ทันที" เพื่อเก็บหน้าฝึกตัวจริงไว้ก่อนถูกไฟล์อื่นทับ */
(function(){
  var G = { greatbarracks:1, greatstable:1 };
  var cur = '';                                   /* ค่ายหลวงที่หน้าฝึกเปิดอยู่ตอนนี้ */

  function M(){ try { return typeof MilUI !== 'undefined' ? MilUI : window.MilUI; } catch(e){ return window.MilUI; } }
  function say(t){ try { Sync.toast(t, 4000); } catch(e){ try { alert(t); } catch(e2){} } }

  var mu = M();
  if (!mu || typeof mu.openTrain !== 'function') return;
  var base = mu.openTrain;                        /* หน้าฝึกตัวจริงจาก military_ui.js */

  function hook(){
    var m = M();
    /* ค่ายหลวง → หน้าฝึกตัวจริง (ผ่านการล็อกของ sync.js) · ค่ายอื่น → ของเดิม */
    if (m && m.openTrain && !m.openTrain._g){
      var prev = m.openTrain;
      var f = function(k){
        if (!G[k]) { cur = ''; return prev.apply(this, arguments); }
        cur = k;
        try { return base.apply(m, arguments); }
        catch(e){ say('⚠ เปิดหน้าฝึกไม่ได้: ' + (e && e.message || e)); throw e; }
      };
      f._g = 1; m.openTrain = f;
    }
    /* ปิดหน้าต่าง → เลิกจำค่ายหลวง */
    if (typeof UI !== 'undefined' && UI.close && !UI.close._g){
      var uc = UI.close;
      var c = function(){ cur = ''; return uc.apply(this, arguments); };
      c._g = 1; UI.close = c;
    }
    if (m && m.close && !m.close._g){
      var mc = m.close;
      var d = function(){ cur = ''; return mc.apply(this, arguments); };
      d._g = 1; m.close = d;
    }
    /* ส่ง /train ไปเซิร์ฟเวอร์ → ใส่ชื่อค่ายหลวงให้ ถ้าหน้าฝึกค่ายหลวงเปิดอยู่ */
    if (typeof Api !== 'undefined' && Api.post && !Api.post._g){
      var op = Api.post;
      var p = function(path, body){
        if (path === '/train' && cur && body && !body.bld) body.bld = cur;
        return op.apply(this, arguments);
      };
      p._g = 1; Api.post = p;
    }
  }
  hook();
  window.addEventListener('load', hook);
  setInterval(hook, 1500);   /* ถ้ามีไฟล์ไหนเขียนทับซ้ำทีหลัง จะครอบใหม่ให้เอง */
})();
    
