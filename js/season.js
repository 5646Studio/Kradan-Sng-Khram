/* ============ Season v14k — วันเซิร์ฟเวอร์ · ป้อม · เมืองหลวงโลก · ผู้ชนะ ============ */
var Season = (function(){
  var S = null, inst = false, D = 86400000;
  function esc(s){ return String(s == null ? '' : s).replace(/[<>&"]/g, function(c){
    return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]; }); }
  /* ---------- v15P แถบนับถอยหลัง + หน้าต่างประกาศ (ป้อม · เมืองหลวง · ผู้ชนะ · รีเซ็ตเซิร์ฟเวอร์) ---------- */
  var HB = { bar:null, st:null, closed:null, shown:false }, HBH = 24, OFF = 0, H3 = 3 * 3600000, H5 = 5 * 3600000, EVID = null;
  function lsGet(k){ try { return localStorage.getItem(k); } catch (e){ return null; } }
  function lsSet(k, v){ try { localStorage.setItem(k, v); } catch (e){} }
  function lsJ(k){ try { return JSON.parse(lsGet(k) || 'null'); } catch (e){ return null; } }
  function two(n){ return n < 10 ? '0' + n : '' + n; }
  function nowS(){ return Date.now() + OFF; }
  function cdBar(l){ var s = Math.floor(l / 1000), d = Math.floor(s / 86400); return (d ? d + ' วัน ' : '') + two(Math.floor(s % 86400 / 3600)) + ':' + two(Math.floor(s % 3600 / 60)) + ':' + two(s % 60); }
  function cdFull(l){ var s = Math.floor(l / 1000), d = Math.floor(s / 86400);
    return (d ? d + ' วัน ' : '') + two(Math.floor(s % 86400 / 3600)) + ' ชม. ' + two(Math.floor(s % 3600 / 60)) + ' นาที ' + two(s % 60) + ' วินาที'; }

  /* --- แถบเล็กใต้แถบทรัพยากร (ปิดได้ · เปิดเกมใหม่หรือผู้ครองเปลี่ยนจะขึ้นอีก) --- */
  function hbTick(){
    var b = HB.bar, st = HB.st;
    if (!st || HB.closed === st.key){ hbShow(false); return; }
    var left = st.end - nowS(), t = b.querySelector('.t');
    t.textContent = left <= 0 ? (st.win ? 'กำลังรีเซ็ต…' : 'ใกล้ประกาศผู้ชนะ…') : cdBar(left);
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
      'body.hashold #pages{top:calc(var(--topH,52px) + var(--loyH,0px) + ' + HBH + 'px)!important}' +
      '#swann{position:fixed;inset:0;z-index:9600;background:rgba(0,0,0,.62);display:flex;align-items:center;justify-content:center;padding:16px}' +
      '#swann .in{position:relative;width:min(92vw,400px);padding:24px 16px 16px;border:2px solid #c9a24a;border-radius:16px;background:linear-gradient(#2a1d0a,#17100a);' +
        'color:#f3e6c8;text-align:center;box-shadow:0 8px 40px rgba(0,0,0,.7)}' +
      '#swann .x{position:absolute;top:8px;right:8px;width:26px;height:26px;border-radius:13px;border:1px solid #6a5530;background:#3a2a12;color:#e0cfa8;font-size:13px;cursor:pointer;padding:0}' +
      '#swann .ic{font-size:44px;line-height:1.1}#swann h3{margin:6px 0 8px;color:#ffcf40;font-size:17px}' +
      '#swann .bd{font-size:13.5px;line-height:1.75}#swann .cd{margin:12px 0 4px;font-size:12px;color:#b9ac92}' +
      '#swann .cd b{display:block;margin-top:2px;font-size:19px;color:#ffdf70;font-variant-numeric:tabular-nums}' +
      '#swann .ok{width:100%;margin-top:12px;padding:11px;border:0;border-radius:10px;background:linear-gradient(#6a5520,#4a3a14);color:#ffdf70;font-weight:700;font-size:14px;cursor:pointer}';
    document.head.appendChild(css);
    var b = document.createElement('div'); b.id = 'hbar';
    b.innerHTML = '<span class="m"><span class="lb"></span> <span class="t"></span></span><button class="x" aria-label="ปิด">✕</button>';
    b.querySelector('.x').onclick = function(e){ e.stopPropagation(); HB.closed = HB.st && HB.st.key; hbTick(); };
    document.body.appendChild(b); HB.bar = b;
    setInterval(hbTick, 1000);
    setInterval(annCheck, 30000);
  }
  function hbApply(r){
    if (!document.body) return;
    hbBuild();
    OFF = r && r.now ? r.now - Date.now() : 0;
    if (r && r.winner) HB.st = { key:'w' + r.winner.at, end:r.winner.resetAt, win:1, lb:'🏆 ' + (r.winner.name || '?') + ' ชนะแล้ว · รีเซ็ตเซิร์ฟเวอร์ใน' };
    else if (r && r.holder && r.holdSince && r.hold) HB.st = { key:r.holder + '|' + r.holdSince, end:r.holdSince + r.hold * D, lb:'👑 ' + (r.holderName || '?') + ' ครองนครหลวง · เหลือ' };
    else HB.st = null;
    if (HB.st) HB.bar.querySelector('.lb').textContent = HB.st.lb;
    hbTick();
  }

  /* --- หน้าต่างประกาศ (มี ✕ มุมขวาบน · เข้าคิวทีละหน้าต่าง) --- */
  var AQ = [], AC = false, ATM = 0;
  function ann(o){ AQ.push(o); if (!AC) annNext(); }
  function annNext(){
    clearInterval(ATM);
    var o = AQ.shift();
    if (!o){ AC = false; return; }
    AC = true;
    var w = document.createElement('div'); w.id = 'swann';
    w.innerHTML = '<div class="in"><button class="x" aria-label="ปิด">✕</button><div class="ic">' + (o.ic || '📢') + '</div><h3>' + o.title + '</h3><div class="bd">' + (o.body || '') + '</div>' +
      (o.end ? '<div class="cd">' + esc(o.lb || '') + '<b></b></div>' : '') + '<button class="ok">' + esc(o.btn || 'ตกลง') + '</button></div>';
    document.body.appendChild(w);
    function close(){ clearInterval(ATM); w.remove(); if (o.reload){ location.reload(); return; } annNext(); }
    w.querySelector('.x').onclick = close; w.querySelector('.ok').onclick = close;
    if (o.end){
      var b = w.querySelector('.cd b');
      var tk = function(){ var l = o.end - nowS(); b.textContent = l > 0 ? cdFull(l) : '—'; };
      tk(); ATM = setInterval(tk, 1000);
    }
  }
  function whoHtml(e){ return (e.g ? '🏯 <b>' + esc(e.g) + '</b><br>' : '') + (e.who ? '👤 <b>' + esc(e.who) + '</b>' : ''); }
  function winHtml(w){
    var g = w.g || '', by = w.by || '';
    if (g) return '🏯 กิลด์ <b>' + esc(g) + '</b>' + (by ? '<br>👤 ผู้ยึดเมืองหลวง <b>' + esc(by) + '</b>' : '');
    return '👤 <b>' + esc(w.name || '?') + '</b>' + (w.how === 'admin' ? '<br><i>ประกาศโดยทีมงาน</i>' : '');
  }
  function holdPopup(rem){
    return { ic:'👑', title:'👑 ' + esc(S.holderName || '?') + ' ครองเมืองหลวง',
      body:'ต้องครองให้ครบ <b>' + S.hold + '</b> วันจึงชนะเซิร์ฟเวอร์' + (rem ? '<br>⏰ แจ้งเตือนทุก 3 ชั่วโมง' : '') + '<br>⚔ ยังแย่งชิงได้ · ถ้าผู้ครองเปลี่ยน เวลานับใหม่',
      end:S.holdSince + S.hold * D, lb:'เหลือเวลาก่อนชนะเซิร์ฟเวอร์' };
  }
  function evPopup(e){
    var n = nowS();
    if (e.k === 'fort') ann({ ic:'⚔️', title:'ป้อมเปลี่ยนมือ!', body:whoHtml(e) + '<br>ยึด <b>' + esc(e.place) + '</b> ได้แล้ว' + (e.from ? '<br><i>จาก ' + esc(e.from) + '</i>' : '') });
    else if (e.k === 'cap'){
      var live = S && S.holder && !S.winner;
      if (live) lsSet('sw_hb', JSON.stringify({ key:S.holder + '|' + S.holdSince, b:Math.max(0, Math.floor((n - S.holdSince) / H3)) }));
      ann({ ic:'👑', title:e.hold ? 'เมืองหลวงมีผู้ครองคนใหม่!' : 'เมืองหลวงถูกยึด!',
        body:(e.hold ? '🏯 <b>' + esc(e.g) + '</b> ครองเมืองหลวง' : whoHtml(e) + '<br>ยึด <b>' + esc(e.place) + '</b> ได้แล้ว') +
          (live ? '<br>ต้องครองให้ครบ <b>' + S.hold + '</b> วันจึงชนะเซิร์ฟเวอร์' : '') + '<br>⚔ ยังแย่งชิงได้',
        end:live ? S.holdSince + S.hold * D : 0, lb:'เหลือเวลาก่อนชนะเซิร์ฟเวอร์' });
    }
    else if (e.k === 'win'){
      lsSet('sw_wb', JSON.stringify({ at:S && S.winner ? S.winner.at : e.t, last:n }));
      ann({ ic:'🏆', title:'ประกาศผู้ชนะเซิร์ฟเวอร์!', body:winHtml(e) + '<br><br>เซิร์ฟเวอร์จะรีเซ็ตอัตโนมัติเมื่อครบเวลา', end:e.resetAt, lb:'รีเซ็ตเซิร์ฟเวอร์ใน' });
    }
    else if (e.k === 'reset') ann({ ic:'🔄', title:'เซิร์ฟเวอร์รีเซ็ตแล้ว', body:'ฤดูกาลใหม่เริ่มแล้ว!<br>กดปุ่มเพื่อโหลดเกมใหม่ แล้วเลือกเผ่าและดินแดน', btn:'🔄 โหลดเกมใหม่', reload:true });
  }
  function evProcess(r){
    var L = r.ev || [];
    if (!L.length) return;
    var seen = lsGet('sw_evseen'), top = L[L.length - 1].id;
    lsSet('sw_evseen', top);
    if (!seen) return;                                  /* เปิดเกมครั้งแรก ไม่เด้งของเก่า */
    var n = nowS();
    L.filter(function(e){ return e.id > seen && n - e.t < 6 * 3600000; }).slice(-3).forEach(evPopup);
  }
  /* เตือนเวลาที่เหลือ: ผู้ครองเมืองหลวงทุก 3 ชม. · ผู้ชนะทุก 5 ชม. */
  function annCheck(){
    if (!S) return;
    var n = nowS(), w = S.winner, st;
    if (w){
      st = lsJ('sw_wb');
      if (!st || st.at !== w.at || n - st.last >= H5){
        lsSet('sw_wb', JSON.stringify({ at:w.at, last:n }));
        ann({ ic:'🏆', title:'ผู้ชนะเซิร์ฟเวอร์', body:winHtml(w) + '<br><br>เซิร์ฟเวอร์จะรีเซ็ตอัตโนมัติเมื่อครบเวลา', end:w.resetAt, lb:'รีเซ็ตเซิร์ฟเวอร์ใน' });
      }
      return;
    }
    if (!S.holder || !S.holdSince) return;
    var key = S.holder + '|' + S.holdSince, b = Math.floor((n - S.holdSince) / H3);
    st = lsJ('sw_hb');
    if (!st || st.key !== key){ lsSet('sw_hb', JSON.stringify({ key:key, b:b })); ann(holdPopup(false)); }
    else if (b > st.b){ lsSet('sw_hb', JSON.stringify({ key:key, b:b })); ann(holdPopup(true)); }
  }
  function evNote(id){      /* ถูกเรียกทุกครั้งที่ซิงก์สถานะ: มีประกาศใหม่ → โหลด /season แล้วเด้งหน้าต่าง */
    if (id === undefined || id === null) return;
    var first = EVID === null;
    if (id === EVID) return;
    EVID = id;
    if (!first && inst) load();
  }
  function load(cb){
    Api.get('/season', null, false).then(function(r){
      if (r && r.ok){
        try { hbApply(r); } catch (e){}
        S = r; S._at = Date.now(); CFG.SPEED = r.speed || 1; CFG.TSPEED = r.tspeed || CFG.SPEED; CFG.TOTAL_DAYS = r.len; CFG.FORT_OPEN_DAY = r.fortDay; CFG.CAPITAL_OPEN_DAY = r.capDay; CFG.CAPITAL_HOLD_DAYS = r.hold;
        try { evProcess(r); annCheck(); } catch (e){}
      }
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
    Social.onState = function(r){ so.apply(Social, arguments); Game.cpNext = ((r && r.player) || {}).cpNext || 0; try { evNote(r && r.ev); } catch (e){} };
  }
  return { open:open, install:install, line:line, load:load };
})();