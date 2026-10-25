/* ============ Update v14L — แจ้งอัปเดตเวอร์ชันใหม่ (บังคับโหลดใหม่) ============
   เวอร์ชันที่เล่นอยู่ = ค่า ?v= ของสคริปต์นี้ · เวอร์ชันล่าสุด = ไฟล์ version.json */
var Update = (function(){
  var cs = document.currentScript, m = cs && cs.src.match(/[?&]v=([^&#]+)/);
  var ME = m ? decodeURIComponent(m[1]) : '', shown = false, last = 0;
  function esc(s){ return String(s == null ? '' : s).replace(/[<>&"]/g, function(c){
    return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]; }); }

  function check(force){
    if (shown || !ME) return;
    if (!force && Date.now() - last < 60000) return;
    last = Date.now();
    fetch('version.json?t=' + Date.now(), { cache:'no-store' })
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(j){ if (j && j.v && String(j.v) !== ME) show(j); })
      .catch(function(){});
  }
  function show(j){
    shown = true;
    var st = document.createElement('style');
    st.textContent = '#updbox{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.82);display:flex;' +
      'align-items:center;justify-content:center;padding:20px;font-family:"Noto Sans Thai",system-ui,sans-serif}' +
      '#updbox .ub{width:100%;max-width:360px;background:#1a1510;border:2px solid #c9a24a;border-radius:14px;' +
      'padding:18px;color:#f0e6cc;text-align:center;box-shadow:0 8px 30px rgba(0,0,0,.7)}' +
      '#updbox h3{color:#ffcf40;font-size:18px;margin:0 0 6px}#updbox p{font-size:12px;color:#b9ac92;margin:4px 0}' +
      '#updbox ul{text-align:left;font-size:12px;line-height:1.8;margin:10px 0;padding-left:20px;color:#e8dfc8}' +
      '#updbox .us{font-size:10.5px;color:#8a7a55}#updbox button{width:100%;margin-top:12px;padding:13px;border:none;' +
      'border-radius:10px;background:linear-gradient(#6a8f36,#4d6b26);color:#fff;font-size:15px;font-weight:700;font-family:inherit}';
    document.head.appendChild(st);
    var d = document.createElement('div');
    d.id = 'updbox';
    d.innerHTML = '<div class="ub"><h3>🆕 มีอัปเดตใหม่</h3><p>เวอร์ชัน <b>' + esc(j.v) + '</b> (ตอนนี้ ' + esc(ME) + ')</p>' +
      ((j.notes && j.notes.length) ? '<ul>' + j.notes.map(function(n){ return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>' : '') +
      '<p class="us">ต้องโหลดใหม่ก่อนเล่นต่อ ข้อมูลของคุณเก็บไว้บนเซิร์ฟเวอร์แล้ว</p>' +
      '<button id="updGo">🔄 โหลดใหม่</button></div>';
    document.body.appendChild(d);
    document.getElementById('updGo').onclick = reload;
  }
  function reload(){
    try { if (typeof save === 'function') save(); } catch(e){}
    var p = location.pathname.split('/').pop() || 'index.html';
    location.replace(p + '?r=' + Date.now());
  }
  setTimeout(function(){ check(true); }, 3000);
  setInterval(check, 300000);
  document.addEventListener('visibilitychange', function(){ if (!document.hidden) check(); });
  return { check:check, version:function(){ return ME; } };
})();