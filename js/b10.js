/* ============ B10 v14Q — รหัสอุปกรณ์ · ปิดปรับปรุง · ลิงก์เชิญเพื่อน ============
   ต้องโหลดต่อจาก js/api.js ทันที */
(function(){
  try {
    var rf = new URLSearchParams(location.search).get('ref');
    if (rf && /^[A-Z0-9]{4,12}$/i.test(rf)){
      localStorage.setItem('sw_ref', rf.toUpperCase());
      document.addEventListener('DOMContentLoaded', function(){
        var d = document.createElement('div');
        d.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;background:#4d6b26;color:#fff;font-size:12.5px;' +
          'text-align:center;padding:8px;font-family:inherit';
        d.textContent = '🤝 คุณได้รับคำเชิญจากเพื่อน — สมัครแล้วเล่นถึงเงื่อนไข รับทองฟรี';
        document.body.appendChild(d);
        setTimeout(function(){ d.remove(); }, 8000);
      });
    }
  } catch(e){}
})();

var DevId = (function(){
  var v = '';
  try {
    v = localStorage.getItem('sw_dev') || '';
    if (!v){ v = Math.random().toString(36).slice(2, 10) + Date.now().toString(36); localStorage.setItem('sw_dev', v); }
  } catch(e){}
  return v;
})();

(function(){
  if (typeof Api === 'undefined' || !Api.post || Api.__b10) return;
  var _p = Api.post, shown = false;
  Api.__b10 = 1;
  function maint(m){
    if (shown) return;
    shown = true;
    var d = document.createElement('div');
    d.style.cssText = 'position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,.85);display:flex;align-items:center;' +
      'justify-content:center;padding:20px';
    d.innerHTML = '<div style="max-width:340px;background:#1a1510;border:2px solid #c9a24a;border-radius:14px;padding:18px;' +
      'color:#f0e6cc;text-align:center;font-family:inherit"><div style="font-size:40px">🔧</div><b style="color:#ffcf40;font-size:17px">' +
      'ปิดปรับปรุงชั่วคราว</b><p style="font-size:12.5px;line-height:1.7">' + String(m || '').replace(/[<>&]/g, '') + '</p>' +
      '<button onclick="location.reload()" style="width:100%;padding:12px;border:none;border-radius:10px;background:#6a8f36;' +
      'color:#fff;font-size:14px;font-weight:700;font-family:inherit">🔄 ลองใหม่</button></div>';
    document.body.appendChild(d);
  }
  Api.post = function(path, body){
    var a = Array.prototype.slice.call(arguments);
    if (body && typeof body === 'object' && !Array.isArray(body)) body._dv = DevId;
    else if (body == null) a[1] = { _dv:DevId };
    return _p.apply(Api, a).then(function(r){ if (r && r.maint) maint(r.err); return r; });
  };
})();

var Invite = (function(){
  var C = null;
  var ST = ['⏳ กำลังเล่น', '✅ ได้ทองแล้ว', '🔎 รอทีมงานตรวจ', '✕ ไม่นับ'];
  function esc(s){ return String(s == null ? '' : s).replace(/[<>&"]/g, function(c){
    return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]; }); }
  function $(i){ return document.getElementById(i); }
  function link(code){ return location.origin + location.pathname.replace(/[^\/]*$/, '') + 'index.html?ref=' + code; }
  function load(cb){ Api.post('/invite/info', {}).then(function(r){ if (r && r.ok) C = r; cb(r && r.ok ? r : null); }); }
  function copy(t){
    function ok(){ Sync.toast('📋 คัดลอกลิงก์แล้ว'); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, fb); else fb();
    function fb(){ var i = $('ivL'); if (i){ i.select(); try { document.execCommand('copy'); ok(); } catch(e){} } }
  }
  function share(L){
    navigator.share({ title:'สุวรรณภูมิ : สงครามเจ้านคร', text:'มาเล่นเกมวางแผนสุวรรณภูมิด้วยกัน! สมัครผ่านลิงก์นี้', url:L }).catch(function(){});
  }
  function card(el){
    if (!el) return;
    el.innerHTML = '<p class="stnone" style="padding:4px">กำลังโหลดลิงก์เชิญ…</p>';
    load(function(r){
      if (!el.isConnected) return;
      if (!r){ el.remove(); return; }
      var L = link(r.code);
      el.innerHTML = '<div class="pfi-h"><b>🤝 เชิญเพื่อน</b><span>รับ 💰 ' + r.gold + ' ทอง/คน</span></div>' +
        '<div class="pfi-l"><input readonly id="ivL" value="' + esc(L) + '"><button id="ivC">📋</button>' +
        (navigator.share ? '<button id="ivS">📤</button>' : '') + '</div>' +
        '<a class="pfi-m" id="ivM">สำเร็จแล้ว ' + r.paid + '/' + r.max + ' คน · ดูเงื่อนไขและความคืบหน้า ›</a>';
      $('ivC').onclick = function(){ copy(L); };
      var s = $('ivS'); if (s) s.onclick = function(){ share(L); };
      $('ivM').onclick = detail;
    });
  }
  function detail(){
    UI.modal('<h3>🤝 เชิญเพื่อน</h3><p class="stnone">กำลังโหลด…</p>');
    load(function(r){
      if (!r) return UI.modal('<h3>🤝 เชิญเพื่อน</h3><p class="stnone">โหลดไม่สำเร็จ</p><button class="btn-cancel" onclick="UI.close()">ปิด</button>');
      var L = link(r.code);
      var h = '<h3>🤝 เชิญเพื่อน</h3><div class="pfi-l"><input readonly id="ivL" value="' + esc(L) + '"><button id="ivC">📋</button>' +
        (navigator.share ? '<button id="ivS">📤</button>' : '') + '</div><div class="infobox" style="line-height:1.8">' +
        'ส่งลิงก์ให้เพื่อนที่<b>ยังไม่เคยเล่น</b> เมื่อเพื่อนมี<br>• อาคารหลัก <b>Lv.' + r.main + '</b><br>• <b>เมืองที่ 2</b><br>' +
        'คุณได้ 💰 <b>' + r.gold + '</b> ทอง' + (r.friendGold ? ' · เพื่อนได้ 💰 ' + r.friendGold + ' ทอง' : '') +
        '<br><span style="font-size:10.5px">รับรางวัลได้สูงสุด ' + r.max + ' คน · เพื่อนต้องสมัครผ่านลิงก์และเปิดเกมภายใน 48 ชม. · ' +
        'ถ้าใช้อุปกรณ์เดียวกัน ทีมงานจะตรวจสอบก่อนให้รางวัล</span></div><h4>เพื่อนของคุณ (' + r.list.length + ')</h4>' +
        (r.list.length ? r.list.map(function(f){
          return '<div class="row"><span>' + esc(f.name) + '<br><i style="font-size:10px;color:#8a7a55;font-style:normal">อาคารหลัก Lv.' +
            Math.min(f.main, r.main) + '/' + r.main + ' · เมือง ' + Math.min(f.vc, 2) + '/2</i></span><b>' + ST[f.st] + '</b></div>';
        }).join('') : '<p class="stnone">ยังไม่มีเพื่อนสมัครผ่านลิงก์ของคุณ</p>') +
        '<button class="btn-use2" id="ivBk">◀ กลับโปรไฟล์</button><button class="btn-cancel" onclick="UI.close()">ปิด</button>';
      UI.modal(h);
      $('ivC').onclick = function(){ copy(L); };
      var s = $('ivS'); if (s) s.onclick = function(){ share(L); };
      $('ivBk').onclick = function(){ Profile.open(); };
    });
  }
  function install(){
    var c = '';
    try { c = localStorage.getItem('sw_ref') || ''; } catch(e){}
    if (!c) return;
    Api.post('/invite/bind', { code:c }).then(function(r){
      try { localStorage.removeItem('sw_ref'); } catch(e){}
      if (r && r.ok) Sync.toast('🤝 ผูกกับเพื่อนผู้เชิญแล้ว · อาคารหลัก Lv.' + r.main + ' + เมืองที่ 2 รับ 💰 ' + r.gold + ' ทอง');
    });
  }
  return { card:card, detail:detail, install:install };
})();