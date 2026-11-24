/* ============ Season v14k — วันเซิร์ฟเวอร์ · ป้อม · เมืองหลวงโลก · ผู้ชนะ ============ */
var Season = (function(){
  var S = null, inst = false, D = 86400000;
  function esc(s){ return String(s == null ? '' : s).replace(/[<>&"]/g, function(c){
    return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]; }); }
  /* ---------- v15O แถบนับถอยหลังผู้ครองเมืองหลวง (ปิดได้ · เปิดเกมใหม่หรือผู้ครองเปลี่ยนจะขึ้นอีก) ---------- */
  var HB = { bar:null, st:null, closed:null, shown:false, off:0, tm:0 }, HBH = 24;
  function hbTick(){
    var b = HB.bar, st = HB.st;
    if (!st || HB.closed === st.key){ hbShow(false); return; }
    var left = st.end - (Date.now() + HB.off), t = b.querySelector('.t');
    if (left <= 0) t.textContent = 'ใกล้ประกาศผู้ชนะ…';
    else {
      var s = Math.floor(left / 1000), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
      function p(n){ return n < 10 ? '0' + n : '' + n; }
      t.textContent = (d ? d + ' วัน ' : '') + p(h) + ':' + p(m) + ':' + p(x);
    }
    hbShow(true);
  }
  function hbShow(on){
    if (on === HB.shown) return;
    HB.shown = on;
    HB.bar.style.display = on ? 'flex' : 'none';
    document.body.classList.toggle('hashold', on);
    try { window.dispatchEvent(new Event('resize')); } catch (e){}
  }
  function hbBuild(){
    if (HB.bar) return;
    var css = document.createElement('style');
    css.textContent = '#hbar{position:fixed;left:0;right:0;top:calc(var(--topH,52px) + var(--loyH,0px));height:' + HBH + 'px;z-index:48;display:none;align-items:center;' +
      'gap:6px;padding:0 6px 0 10px;background:linear-gradient(#2a1d0a,#1c1408);border-bottom:1px solid #c9a24a;color:#f3e6c8;font-size:11px;line-height:1}' +
      '#hbar .m{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center}' +
      '#hbar .t{font-variant-numeric:tabular-nums;color:#ffdf70;font-weight:700}' +
      '#hbar .x{width:20px;height:20px;border-radius:10px;border:0;background:#3a2a12;color:#e0cfa8;font-size:11px;cursor:pointer;flex:0 0 20px;padding:0}' +
      'body.hashold #pages{top:calc(var(--topH,52px) + var(--loyH,0px) + ' + HBH + 'px)!important}';
    document.head.appendChild(css);
    var b = document.createElement('div'); b.id = 'hbar';
    b.innerHTML = '<span class="m">👑 <span class="n"></span> ครองนครหลวง · เหลือ <span class="t"></span></span><button class="x" aria-label="ปิด">✕</button>';
    b.querySelector('.x').onclick = function(e){ e.stopPropagation(); HB.closed = HB.st && HB.st.key; hbTick(); };
    document.body.appendChild(b); HB.bar = b;
    HB.tm = setInterval(hbTick, 1000);
  }
  function hbApply(r){
    if (!document.body) return;
    hbBuild();
    if (!r || r.winner || r.over || !r.holder || !r.holdSince || !r.hold){ HB.st = null; hbTick(); return; }
    HB.off = (r.now || Date.now()) - Date.now();
    HB.st = { key:r.holder + '|' + r.holdSince, end:r.holdSince + r.hold * D };
    HB.bar.querySelector('.n').textContent = r.holderName || '?';
    hbTick();
  }
  function load(cb){
    Api.get('/season', null, false).then(function(r){
      if (r && r.ok){ try { hbApply(r); } catch (e){} S = r; S._at = Date.now(); CFG.SPEED = r.speed || 1; CFG.TSPEED = r.tspeed || CFG.SPEED; CFG.TOTAL_DAYS = r.len; CFG.FORT_OPEN_DAY = r.fortDay; CFG.CAPITAL_OPEN_DAY = r.capDay; CFG.CAPITAL_HOLD_DAYS = r.hold; }
      if (cb) cb(S);
    });
  }
  function sNow(){ return S ? S.now + (Date.now() - S._at) : Date.now(); }
  function at(day){ return S.start + (day - 1) * D; }
  function line(){
    if (!S) return '';
    var e = Math.max(0, sNow() - S.start), d = Math.floor(e / D), h = Math.floor(e % D / 3600000);
    return '<i class="pf-day">📅 เปิดมาแล้ว ' + d + ' วัน ' + h + ' ชม. · วันที่ ' + S.day + (S.over ? ' · ⏳ ต่อเวลา' : '/' + S.len) + '</i>';
  }
  function card(f){
    return '<div class="stcard"><div class="vh"><b>' + (f.cap ? '👑 ' : '🏰 ') + esc(f.name) + '</b><span>(' + f.x + '|' + f.y + ')</span></div>' +
      '<div class="stline">' + (f.owner ? '🏯 <b>' + esc(f.gname || (f.tag ? '[' + f.tag + ']' : 'ไม่มีกิลด์')) + '</b> · 👤 ยึดโดย <b>' + esc(f.owner) + '</b>'
        : '🛡 ผู้พิทักษ์ · ทหารเฝ้า ' + UI.fmt(f.garrison)) + ' · 🧱 Lv.' + f.wall + ' · 🏳️ ' + f.loy + '%</div>' +
      (f.bk ? '<div class="stline">🎁 โบนัสกิลด์ที่ครอง: <b style="color:#8fbf5f">' + esc(f.bn) + ' +' + f.bp + '%</b></div>' : '') +
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
      UI.dur((S.holdSince + S.hold * D - n) / 1000) + '</div>';
    else h += '<div class="dgrun">👑 เมืองหลวงโลกยังไม่มีเจ้าของ</div>';
    var cap = S.forts.filter(function(f){ return f.cap; }), fs = S.forts.filter(function(f){ return !f.cap; });
    if (cap.length) h += '<h4>👑 เมืองหลวงโลก</h4>' + cap.map(card).join('');
    if (Game.fb && Game.fb.length) h += '<div class="infobox" style="line-height:1.7">🎁 <b>กิลด์คุณได้โบนัสจากป้อม</b><br>' +
      Game.fb.map(function(b){ return '• ' + esc(b.f) + ': ' + esc(b.n) + ' +' + b.p + '%'; }).join('<br>') + '</div>';
    if (fs.length) h += '<h4>🏰 ป้อมปราการ (' + fs.filter(function(f){ return f.owner; }).length + '/' + fs.length + ' มีเจ้าของ)</h4>' + fs.map(card).join('');
    h += '<div class="infobox" style="line-height:1.7">• วันที่ ' + S.fortDay + ' ป้อม 8 แห่งปรากฏ ยึดด้วยขุนพล (ต้องอยู่ในกิลด์ ไม่ใช้ CP)<br>' +
      '• ป้อมให้ +' + S.fortCp + ' CP/วัน · สร้างหรือฝึกทหารในป้อมไม่ได้ ให้ส่งกำลังหนุนไปประจำการ<br>' +
      '• ป้อมแต่ละแห่งให้โบนัสต่างกัน และ <b>ได้ทั้งกิลด์ที่ครองอยู่</b> (หายไปทันทีเมื่อเสียป้อม)<br>' +
      '• วันที่ ' + S.capDay + ' เมืองหลวงโลก (0|0) ปรากฏ กิลด์ต้องมีป้อม ' + S.needForts + ' แห่งขึ้นไปจึงจะยึดได้<br>' +
      '• ครองเมืองหลวงครบ ' + S.hold + ' วันติดต่อกันชนะเซิร์ฟเวอร์<br>• หลังวันที่ ' + S.len + ' เกมยังไม่จบจนกว่าจะมีผู้ครองครบ แต่วันที่ต้องครองจะลดลง 1 วันทุก 5 วัน (ต่ำสุด 2 วัน) · ตอนนี้ต้องครอง <b>' + S.hold + '</b> วัน</div>' +
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