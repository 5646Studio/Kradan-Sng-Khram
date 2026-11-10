/* ============ dialog v15C — หน้าต่างยืนยัน/แจ้งเตือนแบบธีมเกม (แทน confirm/alert ของระบบ) ============ */
(function(){
  var css = document.createElement('style');
  css.textContent =
    '#gDlg{position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;animation:gDf .15s}' +
    '@keyframes gDf{from{opacity:0}to{opacity:1}}' +
    '#gDlg .in{width:min(86vw,380px);background:linear-gradient(#2a2016,#1a130b);border:2px solid #c9a24a;border-radius:16px;' +
    'box-shadow:0 0 0 1px #5a4320 inset,0 10px 40px rgba(0,0,0,.7),0 0 24px rgba(255,190,60,.25);padding:18px 16px 14px;animation:gDp .18s}' +
    '@keyframes gDp{from{transform:scale(.9)}to{transform:scale(1)}}' +
    '#gDlg .tx{color:#f3e6c8;font-size:15px;line-height:1.6;white-space:pre-line;text-align:center;margin-bottom:16px}' +
    '#gDlg .bt{display:flex;gap:10px}#gDlg button{flex:1;padding:11px 0;border-radius:10px;font-size:15px;font-weight:700;border:0;cursor:pointer}' +
    '#gDlg .ok{background:linear-gradient(#e2b64a,#a87a1e);color:#2a1a05;box-shadow:0 2px 0 #6a4a10}' +
    '#gDlg .no{background:#3a2e1e;color:#e0cfa8;border:1px solid #6a5530}';
  document.head.appendChild(css);

  var nC = window.confirm.bind(window), nA = window.alert.bind(window);
  var last = null, lastAt = 0, pass = null, open = false;
  var ACT = 'button,a,[data-act],[data-cx],[data-c],[data-k],[data-i],[data-t],[onclick],.btn,.slot';

  document.addEventListener('click', function(e){
    if (pass || open) return;
    last = (e.target.closest && e.target.closest(ACT)) || e.target; lastAt = Date.now();
  }, true);

  /* ถ้าปุ่มเดิมถูกวาดใหม่ระหว่างรอ → หาปุ่มที่ตรงกันด้วย id หรือ data-* */
  function find(el){
    if (document.contains(el)) return el;
    if (el.id){ var f = document.getElementById(el.id); if (f) return f; }
    var ds = el.dataset || {}, ks = Object.keys(ds);
    if (ks.length){
      var q = el.tagName.toLowerCase() + ks.map(function(k){
        return '[data-' + k.replace(/[A-Z]/g, function(c){ return '-' + c.toLowerCase(); }) + '="' + String(ds[k]).replace(/"/g, '\\"') + '"]';
      }).join('');
      try { var g = document.querySelector(q); if (g) return g; } catch(x){}
    }
    return el;
  }

  function box(msg, ask, cb){
    open = true;
    var w = document.createElement('div'); w.id = 'gDlg';
    w.innerHTML = '<div class="in"><div class="tx"></div><div class="bt">' +
      (ask ? '<button class="no">ยกเลิก</button>' : '') + '<button class="ok">' + (ask ? 'ยืนยัน' : 'ตกลง') + '</button></div></div>';
    w.querySelector('.tx').textContent = msg;
    document.body.appendChild(w);
    function kd(e){
      if (e.key === 'Escape'){ e.preventDefault(); end(false); }
      else if (e.key === 'Enter'){ e.preventDefault(); end(true); }
    }
    function end(v){ if (!w.parentNode) return; w.remove(); open = false; document.removeEventListener('keydown', kd, true); if (cb) cb(v); }
    document.addEventListener('keydown', kd, true);
    w.onclick = function(e){
      e.stopPropagation();
      if (e.target.classList.contains('ok')) end(true);
      else if (e.target.classList.contains('no') || e.target === w) end(!ask);
    };
  }

  window.confirm = function(msg){
    msg = String(msg == null ? '' : msg);
    if (pass && pass.m === msg) return true;                 /* รอบกดซ้ำหลังผู้เล่นยืนยัน */
    if (open) return false;
    var el = last;
    if (!el || Date.now() - lastAt > 1000) return nC(msg);   /* ไม่ได้มาจากการแตะ → ใช้ของระบบ */
    last = null;
    box(msg, true, function(ok){
      if (!ok) return;
      var t = find(el);
      pass = { m:msg };
      try { t.dispatchEvent(new MouseEvent('click', { bubbles:true, cancelable:true, view:window })); }
      finally { pass = null; }
    });
    return false;
  };
  window.alert = function(msg){
    if (open) return nA(msg);
    box(String(msg == null ? '' : msg), false, null);
  };
  window.GameDialog = { ask:function(m, cb){ box(String(m), true, cb); }, tell:function(m){ box(String(m), false, null); } };
})();
