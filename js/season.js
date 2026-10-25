/* ============ Season v14k — วันเซิร์ฟเวอร์ · ป้อม · เมืองหลวงโลก · ผู้ชนะ ============ */
var Season = (function(){
  var S = null, inst = false, D = 86400000;
  function esc(s){ return String(s == null ? '' : s).replace(/[<>&"]/g, function(c){
    return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]; }); }
  function load(cb){
    Api.get('/season', null, false).then(function(r){
      if (r && r.ok){ S = r; S._at = Date.now(); }
      if (cb) cb(S);
    });
  }
  function sNow(){ return S ? S.now + (Date.now() - S._at) : Date.now(); }
  function at(day){ return S.start + (day - 1) * D / CFG.SPEED; }
  function line(){
    if (!S) return '';
    var e = Math.max(0, sNow() - S.start), d = Math.floor(e / D), h = Math.floor(e % D / 3600000);
    return '<i class="pf-day">📅 เปิดมาแล้ว ' + d + ' วัน ' + h + ' ชม. · วันที่ ' + S.day + (S.over ? ' · ⏳ ต่อเวลา' : '/' + S.len) + '</i>';
  }
  function card(f){
    return '<div class="stcard"><div class="vh"><b>' + (f.cap ? '👑 ' : '🏰 ') + esc(f.name) + '</b><span>(' + f.x + '|' + f.y + ')</span></div>' +
      '<div class="stline">' + (f.owner ? 'เจ้าของ: <b>' + esc(f.owner) + '</b>' + (f.tag ? ' [' + esc(f.tag) + ']' : '')
        : '🛡 ผู้พิทักษ์ · ทหารเฝ้า ' + UI.fmt(f.garrison)) + ' · 🧱 Lv.' + f.wall + ' · 🏳️ ' + f.loy + '%</div>' +
      '<div class="grow2"><button class="btn-ok mini2" data-fs="' + f.x + ',' + f.y + '">⚔ ส่งทัพ</button>' +
      '<button class="btn-use2 mini2" data-fm="' + f.x + ',' + f.y + '">🗺 ดูแผนที่</button></div></div>';
  }
  function paint(){
    var n = sNow(), pct = Math.min(100, S.day / S.len * 100), h = '<h3>👑 ศึกชิงเมืองหลวงโลก</h3>';
    function mk(day, ic){ return '<span class="sea-m" style="left:' + (day / S.len * 100) + '%">' + ic + '</span>'; }
    h += '<div class="sea-bar"><i style="width:' + pct + '%"></i>' + mk(S.fortDay, '🏰') + mk(S.capDay, '👑') + mk(S.len, '🏁') + '</div>' +
      '<div class="sea-sub"><span>วันที่ ' + S.day + (S.over ? ' · ⏳ ต่อเวลา (ต้องครอง ' + S.hold + ' วัน)' : ' / ' + S.len) + '</span><span>🏰 วันที่ ' + S.fortDay + ' · 👑 วันที่ ' + S.capDay + '</span></div>';
    if (S.winner) h += '<div class="sea-win">🏆 ผู้ชนะเซิร์ฟเวอร์<br><b>' + esc(S.winner.name) + '</b><br><i>' +
      (S.winner.how === 'hold' ? 'ครองเมืองหลวงโลกครบ ' + S.hold + ' วัน' : S.winner.how === 'admin' ? 'ประกาศโดยทีมงาน'
        : 'ประชากรสูงสุดเมื่อจบฤดูกาล') + '</i></div>';
    else if (S.day < S.fortDay) h += '<div class="dgrun">🏰 ป้อมทั้ง 8 แห่งจะปรากฏในอีก ' + UI.dur((at(S.fortDay) - n) / 1000) + '</div>';
    else if (S.day < S.capDay) h += '<div class="dgrun">👑 เมืองหลวงโลกจะปรากฏในอีก ' + UI.dur((at(S.capDay) - n) / 1000) + '</div>';
    else if (S.holder) h += '<div class="dgrun">👑 <b>' + esc(S.holderName) + '</b> ครองเมืองหลวง<br>ชนะเซิร์ฟเวอร์ในอีก ' +
      UI.dur((S.holdSince + S.hold * D / CFG.SPEED - n) / 1000) + '</div>';
    else h += '<div class="dgrun">👑 เมืองหลวงโลกยังไม่มีเจ้าของ</div>';
    var cap = S.forts.filter(function(f){ return f.cap; }), fs = S.forts.filter(function(f){ return !f.cap; });
    if (cap.length) h += '<h4>👑 เมืองหลวงโลก</h4>' + cap.map(card).join('');
    if (fs.length) h += '<h4>🏰 ป้อมปราการ (' + fs.filter(function(f){ return f.owner; }).length + '/' + fs.length + ' มีเจ้าของ)</h4>' + fs.map(card).join('');
    h += '<div class="infobox" style="line-height:1.7">• วันที่ ' + S.fortDay + ' ป้อม 8 แห่งปรากฏ ยึดด้วยขุนพล (ต้องอยู่ในกิลด์ ไม่ใช้ CP)<br>' +
      '• ป้อมให้ +' + S.fortCp + ' CP/วัน · สร้างหรือฝึกทหารในป้อมไม่ได้ ให้ส่งกำลังหนุนไปประจำการ<br>' +
      '• วันที่ ' + S.capDay + ' เมืองหลวงโลก (0|0) ปรากฏ กิลด์ต้องมีป้อม ' + S.needForts + ' แห่งขึ้นไปจึงจะยึดได้<br>' +
      '• ครองเมืองหลวงครบ 5 วันติดต่อกันชนะเซิร์ฟเวอร์<br>• หลังวันที่ ' + S.len + ' เกมยังไม่จบจนกว่าจะมีผู้ครองครบ แต่วันที่ต้องครองจะลดลง 1 วันทุก 5 วัน (ต่ำสุด 2 วัน) · ตอนนี้ต้องครอง <b>' + S.hold + '</b> วัน</div>' +
      '<button class="btn-cancel" onclick="UI.close()">ปิด</button>';
    UI.modal(h);
    document.querySelectorAll('[data-fs]').forEach(function(b){
      b.onclick = function(){ var p = b.dataset.fs.split(','); Send2.open({ tx:+p[0], ty:+p[1], mis:'attack' }); };
    });
    document.querySelectorAll('[data-fm]').forEach(function(b){
      b.onclick = function(){ var p = b.dataset.fm.split(','); UI.close(); UI.showPage('world'); Renderer.center(+p[0], +p[1]); };
    });
  }
  function open(){
    UI.modal('<h3>👑 ศึกชิงเมืองหลวงโลก</h3><p class="stnone">กำลังโหลด…</p>');
    load(function(){
      if (!S) return UI.modal('<h3>👑 ศึกชิงเมืองหลวงโลก</h3><p class="stnone">โหลดไม่สำเร็จ</p><button class="btn-cancel" onclick="UI.close()">ปิด</button>');
      paint();
    });
  }
  function install(){
    if (inst) return;
    inst = true;
    if (typeof Conquest !== 'undefined') Conquest.openEndgame = open;
    var oe = window.enqueue;
    window.enqueue = function(v){
      if (v && v.isFort) return 'ป้อมและเมืองหลวงโลกก่อสร้างไม่ได้';
      return oe.apply(this, arguments);
    };
    load();
    setInterval(load, 300000);
  }
  if (typeof Social !== 'undefined'){
    var so = Social.onState;
    Social.onState = function(r){ so.apply(Social, arguments); Game.cpNext = ((r && r.player) || {}).cpNext || 0; };
  }
  return { open:open, install:install, line:line, load:load };
})();