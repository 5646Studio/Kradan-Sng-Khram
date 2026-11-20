/* ============ Admin2 v15H — จัดหมวดใหม่ · ตั้งค่าเกม · ควบคุมบอท · ป้อม · บัญชีทองแบบหน้าต่าง · ตัวเลขแจ้งเตือน ============ */
(function(){
  var TABS = [['ov','📊','ภาพรวม'], ['pl','👥','ผู้เล่น'], ['bg','💬','แจ้งเรื่อง'], ['gd','💳','การเงิน'],
    ['set','⚙️','ตั้งค่าเกม'], ['bt','🤖','บอท'], ['sys','🛠','ระบบ']];
  var RN = { purchase:'💳 เติมเงิน', checkin:'📅 เช็คอิน', quest:'📜 ภารกิจ', invite:'🤝 เชิญเพื่อน', invited:'🤝 ถูกเชิญ',
    tutorial:'🎓 บทแนะนำ', heal:'⛑ รักษา', potion:'🧪 ยา', npc:'⚖ พ่อค้าหลวง', guild:'🏯 ตั้งกิลด์', herolook:'🎨 ปั้นหน้า',
    demolish:'🔨 รื้อถอน', grant:'🛠 แอดมินให้', rush:'⚡ เร่ง', rushall:'⚡ เร่งทั้งหมด', builder:'🔨 ช่างคนที่ 3', spend:'💸 ใช้จ่าย' };
  var TL = { cpBase:'🎭 CP พื้นฐานต่อเมืองต่อวัน', fortCp:'🏰 CP จากการครองป้อม', capNeed:'👑 ต้องครองป้อมกี่แห่งจึงตีเมืองหลวงได้',
    fbInf:'🏰 ป้อมอุดร · ทหารราบโจมตี +%', fbDef:'🏰 ป้อมอีสาน · ป้องกันทุกเมือง +%', fbSpd:'🏰 ป้อมบูรพา · เดินทัพเร็วขึ้น %',
    fbCarry:'🏰 ป้อมอาคเนย์ · บรรทุกของปล้น +%', fbCav:'🏰 ป้อมทักษิณ · ทหารม้าโจมตี +%', fbTrain:'🏰 ป้อมหรดี · ฝึกทหารเร็วขึ้น %',
    fbCata:'🏰 ป้อมประจิม · ปืนใหญ่แรงขึ้น +%', fbLoy:'🏰 ป้อมพายัพ · ความภักดีฟื้นเร็วขึ้น %',
    invGold:'🤝 ทองให้ผู้เชิญ', invFriend:'🤝 ทองให้เพื่อนที่ถูกเชิญ',
    botAtt:'⚔ บอทออกรบสูงสุดต่อรอบ (ขบวน)', botHit:'🎯 บอทบุกผู้เล่นจริง (1 = ใช่ · 0 = ไม่)',
    botRange:'📏 ระยะที่บอทมองหาเป้า (ช่อง)', botPrey:'🐟 บอทบุกผู้เล่นที่ใหญ่กว่าได้ถึง (เท่า)',
    botPreyWar:'🐺 บอทสายทหารบุกได้ถึง (เท่า)', botPlayerW:'🧲 น้ำหนักเป้าผู้เล่น' };
  var TG_GAME = ['cpBase', 'fortCp', 'capNeed', 'fbInf', 'fbDef', 'fbSpd', 'fbCarry', 'fbCav', 'fbTrain', 'fbCata', 'fbLoy', 'invGold', 'invFriend'];
  var TG_BOT = ['botAtt', 'botHit', 'botRange', 'botPrey', 'botPreyWar', 'botPlayerW'];
  var ZN = { 1:'เขต 1 · ⛏ เหล็ก', 2:'เขต 2 · 🪵 ไม้', 3:'เขต 3 · 🌾 ข้าว', 4:'เขต 4 · 🧱 ดิน' };
  var loaded = {};

  function esc(s){ return String(s == null ? '' : s).replace(/[<>&"]/g, function(c){ return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]; }); }
  function fmt(n){ return Number(n || 0).toLocaleString('th-TH'); }
  function $(i){ return document.getElementById(i); }
  function mk(tag, cls, html){ var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function say(id, t, ok){ var e = $(id); if (!e) return; e.style.color = ok ? '#7fd17f' : '#ff8a6a'; e.innerHTML = t; }
  function sec(t){ return mk('div', 'a2sec', t); }
  function cardOf(id){ var e = $(id); return e ? (e.closest('.card') || e) : null; }
  function block(w){
    var bs = document.querySelectorAll('b');
    for (var i = 0; i < bs.length; i++){
      if (bs[i].textContent.indexOf(w) < 0) continue;
      var c = bs[i].closest('.card') || bs[i].parentElement;
      if (c && !c.classList.contains('pane') && c.id !== 'main' && !c.closest('#gate')) return c;
    }
    return null;
  }

  /* ---------- ธีม ---------- */
  var css = mk('style');
  css.textContent = [
    'body{background:radial-gradient(ellipse at top,#1c150b 0%,#0d0b08 65%) fixed}',
    'input,select,textarea{width:100%;padding:11px 12px;margin-top:6px;background:#17120b;border:1px solid #4a3a22;border-radius:10px;color:#f3e6c8;' +
      'font-family:inherit;font-size:13.5px;outline:none;box-shadow:inset 0 2px 6px rgba(0,0,0,.45);transition:border-color .15s,box-shadow .15s;-webkit-appearance:none;appearance:none}',
    'textarea{display:block;min-height:96px;resize:vertical;line-height:1.6}',
    'input::placeholder,textarea::placeholder{color:#6f6148}',
    'input:focus,select:focus,textarea:focus{border-color:#c9a24a;box-shadow:inset 0 2px 6px rgba(0,0,0,.45),0 0 0 3px rgba(255,207,64,.16)}',
    "select{padding-right:34px;background:#17120b url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8'><path d='M1 1l5 5 5-5' stroke='%23c9a24a' stroke-width='2' fill='none'/></svg>\") no-repeat right 12px center}",
    'input[type=checkbox]{width:18px;height:18px;margin:0;padding:0;accent-color:#c9a24a;-webkit-appearance:auto;appearance:auto;box-shadow:none}',
    'input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}input[type=number]{-moz-appearance:textfield}',
    '.card{border-radius:14px!important;background:linear-gradient(#18130c,#120e09)!important;border-color:#3a2e1c!important;box-shadow:0 2px 10px rgba(0,0,0,.35)}',
    '.card>b:first-child{display:block;font-size:14.5px;margin-bottom:4px}',
    '.btn{border-radius:11px!important;box-shadow:0 2px 0 rgba(0,0,0,.45)}.b1{background:linear-gradient(#6a8f34,#4a6a22)!important}',
    '.b2{background:linear-gradient(#4a3a1e,#2e2412)!important;border:1px solid #6a5530!important}',
    '.tabs{position:sticky;top:0;z-index:60;display:grid!important;grid-template-columns:repeat(4,1fr)!important;gap:6px;padding:8px 0 10px;margin-bottom:4px;' +
      'background:linear-gradient(#0d0b08 85%,rgba(13,11,8,0))}',
    '.tab{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;min-height:54px;padding:8px 2px!important;' +
      'border-radius:12px!important;font-size:11px!important;color:#a8946a!important}',
    '.tab .ic{font-size:19px;line-height:1}',
    '.tab.on{background:linear-gradient(#6a5520,#4a3a14)!important;color:#ffdf70!important;border-color:#c9a24a!important;box-shadow:0 0 12px rgba(255,190,60,.25)}',
    '.tab .bd{position:absolute;top:-6px;right:-4px;min-width:20px;height:20px;padding:0 5px;border-radius:10px;background:#e0342a;color:#fff;font-size:11px;' +
      'font-weight:700;line-height:20px;text-align:center;box-shadow:0 0 0 2px #0d0b08;animation:a2pul 1.6s infinite}',
    '@keyframes a2pul{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}',
    '.a2sec{display:flex;align-items:center;gap:8px;margin:16px 2px 8px;font-size:12px;font-weight:700;color:#c9a24a}',
    '.a2sec::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,#4a3a22,transparent)}',
    '.a2sub{margin:14px 0 2px;padding-top:10px;border-top:1px dashed #3a2e1c;font-size:12px;font-weight:700;color:#e0c070}',
    '.a2note{font-size:10.5px;color:#7a6c4e;margin:4px 0}.a2m{font-size:11.5px;margin-top:6px}',
    '.a2two{display:grid;grid-template-columns:1fr 1fr;gap:8px}.a2two .btn,.a2two select,.a2two input{margin-top:8px}',
    '.a2tb{width:100%;border-collapse:collapse;font-size:11px;margin:6px 0}.a2tb td,.a2tb th{border-bottom:1px solid #2f2618;padding:4px;text-align:right}',
    '.a2tb td:first-child,.a2tb th:first-child{text-align:left}.a2tb th{color:#8a7a55;font-weight:400}',
    '.a2h{background:#2a2216;border-left:3px solid #ffcf40;padding:6px 8px;margin:4px 0;font-size:11.5px;line-height:1.6;border-radius:6px}',
    '.a2row{display:flex;align-items:center;gap:6px;margin:6px 0;font-size:11.5px}.a2row span{flex:1}',
    '.a2row input,.a2row select{width:96px!important;margin:0!important;text-align:right}.a2row i{font-style:normal;color:#6a5f45;font-size:10px;width:62px}',
    '.a2sw{display:flex;align-items:center;justify-content:space-between;margin:10px 0;padding:10px 12px;border-radius:12px;background:#100d09;border:1px solid #3a2e1c;cursor:pointer;font-weight:700}',
    '.a2sw i{position:relative;width:52px;height:28px;border-radius:14px;background:#5a2020;transition:background .2s;flex:0 0 52px}',
    '.a2sw i::after{content:"";position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#e0cfa8;transition:left .2s}',
    '.a2sw.on i{background:#4f7a2a}.a2sw.on i::after{left:27px}',
    '.a2zone{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:6px 0}',
    '.a2zone div{background:#100d09;border:1px solid #2f2618;border-radius:10px;padding:8px;font-size:11.5px;color:#b9ac92}.a2zone b{display:block;font-size:20px;color:#ffcf40}',
    '.gfbar{height:8px;background:#251e14;border-radius:4px;margin-top:6px;overflow:hidden}.gfbar i{display:block;height:100%;background:#ffcf40;width:0}',
    '#a2mod{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.65);display:flex;align-items:flex-end;justify-content:center}',
    '#a2mod .in{width:min(100vw,720px);max-height:88vh;display:flex;flex-direction:column;background:linear-gradient(#1e170e,#120d08);' +
      'border:2px solid #c9a24a;border-bottom:0;border-radius:18px 18px 0 0;box-shadow:0 -10px 40px rgba(0,0,0,.6)}',
    '@media(min-width:700px){#a2mod{align-items:center}#a2mod .in{border-bottom:2px solid #c9a24a;border-radius:18px}}',
    '#a2mod .hd{display:flex;align-items:center;gap:8px;padding:12px 14px;border-bottom:1px solid #3a2e1c}#a2mod .hd b{flex:1;color:#ffcf40;font-size:15px}',
    '#a2mod .x{width:36px;height:36px;border-radius:10px;border:1px solid #6a5530;background:#2a2016;color:#e0cfa8;font-size:16px;cursor:pointer}',
    '#a2mod .bd{padding:4px 14px 16px;overflow:auto}',
    '.a2chips{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}',
    '.a2chips span{padding:6px 12px;border-radius:16px;background:#2a2016;border:1px solid #4a3a22;font-size:12px;color:#c9b48a;cursor:pointer}',
    '.a2chips span.on{background:#5a4a1e;border-color:#c9a24a;color:#ffdf70}'
  ].join('');
  document.head.appendChild(css);

  /* ---------- หน้าต่าง ---------- */
  function modal(title, node, onClose){
    var w = mk('div', '', '<div class="in"><div class="hd"><b></b><button class="x">✕</button></div><div class="bd"></div></div>');
    w.id = 'a2mod';
    w.querySelector('.hd b').textContent = title;
    w.querySelector('.bd').appendChild(node);
    document.body.appendChild(w); document.body.style.overflow = 'hidden';
    function close(){ w.remove(); document.body.style.overflow = ''; if (onClose) onClose(); }
    w.onclick = function(e){ if (e.target === w || e.target.classList.contains('x')) close(); };
    return close;
  }

  /* ---------- 📈 สถิติสมดุล ---------- */
  function loadStats(){
    if (!$('a2st')) return;
    $('a2st').textContent = 'กำลังโหลด…';
    Api.post('/admin/balance', { action:'list' }).then(function(r){
      if (!$('a2st')) return;
      if (!r || !r.ok){ $('a2st').textContent = (r && r.err) || 'โหลดไม่สำเร็จ'; return; }
      var tp = 0, tn = 0;
      r.buckets.forEach(function(b){ tp += b.pop; tn += b.n; });
      var avg = tn ? tp / tn : 0, H = [], b3 = r.buckets[1], b4 = r.buckets[3];
      if (r.active < 10) H.push('ℹ️ ผู้เล่นที่เข้าเล่นใน 24 ชม. มีน้อยกว่า 10 คน ตัวเลขอาจยังไม่สะท้อนสมดุลจริง');
      if (r.bots.n && avg && r.bots.pop > avg * 1.3) H.push('🤖 บอทใหญ่กว่าผู้เล่นเฉลี่ยมาก ลองลด "บอทบุกผู้เล่นที่ใหญ่กว่าได้ถึง" หรือ "น้ำหนักเป้าผู้เล่น"');
      if (r.bots.n && avg && r.bots.pop < avg * 0.4) H.push('🤖 บอทเล็กกว่าผู้เล่นมาก ผู้เล่นปล้นบอทได้ง่ายเกินไป');
      if (r.ret0 >= 10 && r.ret < 0.4) H.push('🚪 ผู้เล่นเกินครึ่งไม่กลับมาหลังวันแรก ช่วงแรกของเกมอาจช้าหรือยากเกินไป');
      if (b4 && b4.n >= 3 && b4.vc / b4.n < 1.5) H.push('🏘 ผู้เล่นที่เล่นมา 8–14 วันส่วนใหญ่ยังมีเมืองเดียว ลองเพิ่ม "CP พื้นฐาน"');
      if (b3 && b3.n >= 3 && b3.vc / b3.n >= 2) H.push('🏘 ผู้เล่นขยายเมืองเร็วกว่าเป้า ลองลด "CP พื้นฐาน"');
      var gin = 0, gout = 0;
      r.ledger.forEach(function(l){ if (l.reason !== 'purchase') gin += l.inn || 0; gout += l.outt || 0; });
      if (gin > 100 && gout < gin * 0.3) H.push('💰 ทองฟรีที่แจกมากกว่าทองที่ใช้มาก ผู้เล่นอาจไม่จำเป็นต้องเติมเงิน');
      if (!H.length) H.push('✔ ยังไม่พบสัญญาณผิดปกติ');
      $('a2st').innerHTML = 'วันที่ <b>' + r.day + '</b> · ผู้เล่น ' + fmt(r.players) + ' · เข้าเล่นใน 24 ชม. ' + fmt(r.active) +
        ' · กลับมาหลังวันแรก ' + (r.ret == null ? '—' : Math.round(r.ret * 100) + '% (จาก ' + r.ret0 + ' คน)') +
        '<br>🤖 บอท ' + r.bots.n + ' ตัว · ประชากรเฉลี่ย ' + fmt(r.bots.pop) + ' · ผู้เล่นเฉลี่ย ' + fmt(Math.round(avg)) +
        ' · 🗿 วีรบุรุษ Lv.เฉลี่ย ' + r.hero + ' · 💰 ทองในมือผู้เล่นรวม ' + fmt(r.gold) +
        '<div class="a2sub">💡 คำแนะนำ</div>' + H.map(function(x){ return '<div class="a2h">' + x + '</div>'; }).join('') +
        '<div class="a2sub">📈 ความเร็วโตตามจำนวนวันที่เล่น</div><table class="a2tb"><tr><th>วัน</th><th>คน</th><th>ประชากรเฉลี่ย</th><th>เมืองเฉลี่ย</th></tr>' +
        r.buckets.map(function(b){
          return '<tr><td>' + b.a + (b.b > 999 ? '+' : '–' + b.b) + '</td><td>' + b.n + '</td><td>' + (b.n ? fmt(Math.round(b.pop / b.n)) : '—') +
            '</td><td>' + (b.n ? (b.vc / b.n).toFixed(1) : '—') + '</td></tr>';
        }).join('') + '</table><div class="a2sub">💰 ทอง 7 วันล่าสุด</div><table class="a2tb"><tr><th>ที่มา</th><th>ได้</th><th>ใช้</th><th>ครั้ง</th></tr>' +
        (r.ledger.map(function(l){
          return '<tr><td>' + (RN[l.reason] || esc(l.reason)) + '</td><td>' + fmt(l.inn) + '</td><td>' + fmt(l.outt) + '</td><td>' + l.n + '</td></tr>';
        }).join('') || '<tr><td colspan="4">ไม่มีข้อมูล</td></tr>') + '</table><div class="a2sub">⚔️ รายงานการรบ 7 วันล่าสุด</div><table class="a2tb">' +
        (r.war.map(function(w){ return '<tr><td>' + esc(w[0]) + '</td><td>' + fmt(w[1]) + '</td></tr>'; }).join('') || '<tr><td>ไม่มีข้อมูล</td></tr>') +
        '</table><div class="a2sub">📜 ผู้เล่นตามข้อภารกิจ</div><div style="font-size:10.5px;line-height:1.8">' +
        Object.keys(r.quest).map(function(k){ return 'ข้อ ' + (+k + 1 > 32 ? 'ครบ' : +k + 1) + ': <b>' + r.quest[k] + '</b>'; }).join(' · ') + '</div>';
    }, function(){ if ($('a2st')) $('a2st').textContent = 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'; });
  }

  /* ---------- 🎛 ค่าเกม (ใช้ร่วมทุกการ์ด) ---------- */
  function tuRow(k, r){
    var cur = r.cur[k], def = r.def[k];
    return '<div class="a2row"><span>' + TL[k] + '</span><i>เริ่มต้น ' + def + '</i><input type="number" step="any" data-tu="' + k + '" value="' +
      (cur !== def ? cur : '') + '" placeholder="' + def + '"></div>';
  }
  function paintTune(r){
    var g = TG_GAME.filter(function(k){ return k in r.cur; }), b = TG_BOT.filter(function(k){ return k in r.cur; });
    if ($('a2tu')) $('a2tu').innerHTML = g.map(function(k){ return tuRow(k, r); }).join('') || '—';
    if ($('a2tub')) $('a2tub').innerHTML = b.map(function(k){ return tuRow(k, r); }).join('') || '—';
    btPaintCfg(r); fpPaintRegen(r);
  }
  function loadTune(){ Api.post('/admin/tune', { action:'list' }).then(function(r){ if (r && r.ok) paintTune(r); }); }
  function tuneSave(msgId){
    var v = {};
    document.querySelectorAll('[data-tu]').forEach(function(i){ if (i.value !== '' && !i.disabled) v[i.dataset.tu] = i.value; });
    say(msgId, 'กำลังบันทึก…', true);
    Api.post('/admin/tune', { action:'set', v:v }).then(function(r){
      say(msgId, r && r.ok ? '✔ บันทึกแล้ว · มีผลภายใน 1 นาที' : esc((r && r.err) || 'บันทึกไม่สำเร็จ'), r && r.ok);
      if (r && r.ok) paintTune(r);
    });
  }

  /* ---------- 💳 สวิตช์เปิด/ปิดเติมเงิน ---------- */
  var SH = { ok:false, on:false };
  function shCard(){
    return '<b>💳 ระบบเติมเงิน</b>' +
      '<div class="a2sw" id="shSw"><span id="shSwT">กำลังโหลด…</span><i></i></div>' +
      '<div class="a2row"><span>💬 ข้อความถึงผู้เล่นตอนปิด</span><input id="shMsg" maxlength="200" placeholder="เช่น ปิดปรับปรุงระบบชำระเงินชั่วคราว" disabled></div>' +
      '<button class="btn b1" id="shSave" disabled>💾 บันทึกข้อความ</button><div id="shM" class="a2m"></div>' +
      '<p class="a2note">ปิดแล้วผู้เล่นสั่งซื้อใหม่ไม่ได้ · คนที่โอนเงินแล้วยังแนบสลิปได้ · ทีมงานยืนยันรับเงินได้ตามปกติ</p>';
  }
  function shPaint(){
    if (!$('shSw')) return;
    $('shSw').classList.toggle('on', SH.on);
    $('shSwT').textContent = SH.on ? '🟢 เปิดให้เติมเงิน' : '🔴 ปิดการเติมเงิน (ผู้เล่นสั่งซื้อไม่ได้)';
  }
  function shLoad(){
    Api.post('/admin/shop', { action:'info' }).then(function(r){
      if (!$('shSw')) return;
      if (!r || !r.ok){ SH.ok = false; $('shSwT').textContent = '⚠ โหลดไม่ได้ (deploy worker ล่าสุดแล้วหรือยัง)'; return; }
      SH.ok = true; SH.on = !!r.on;
      $('shMsg').disabled = false; $('shSave').disabled = false;
      if (document.activeElement !== $('shMsg')) $('shMsg').value = r.msg || '';
      shPaint();
      if (r.on && !r.ppSet) say('shM', '⚠ ยังไม่ได้ตั้งค่า PROMPTPAY_ID ผู้เล่นจะสั่งซื้อไม่ได้', false);
      else if (!r.manual) say('shM', 'ยังไม่เคยตั้งจากหน้านี้ · ตอนนี้ใช้ค่าตั้งต้นของเซิร์ฟเวอร์', true);
    });
  }
  function shSet(on){
    Api.post('/admin/shop', { action:'set', on:on, msg:($('shMsg').value || '').trim() }).then(function(r){
      if (!r || !r.ok) return say('shM', '⚠ ' + esc((r && r.err) || 'บันทึกไม่สำเร็จ'), false);
      SH.on = !!r.on; shPaint();
      say('shM', (r.on ? '✔ เปิดการเติมเงินแล้ว' : '✔ ปิดการเติมเงินแล้ว') + ' (ผู้เล่นบางเครื่องอาจเห็นช้าสุด 15 วินาที)', true);
    }, function(){ say('shM', '⚠ เชื่อมต่อเซิร์ฟเวอร์ไม่ได้', false); });
  }
  function shBind(){
    $('shSw').onclick = function(){
      if (!SH.ok) return;
      var on = !SH.on;
      if (!on && !confirm('ปิดการเติมเงิน?\nผู้เล่นจะสั่งซื้อใหม่ไม่ได้ (คนที่โอนแล้วยังแนบสลิปและรอรับทองได้)')) return;
      shSet(on);
    };
    $('shSave').onclick = function(){ if (SH.ok) shSet(SH.on); };
  }

  /* ---------- 🤖 ควบคุมบอท ---------- */
  function btCard(){
    return '<b>🤖 ควบคุมบอท</b>' +
      '<div class="a2sw" id="btSw"><span id="btSwT">กำลังโหลด…</span><i></i></div><input type="hidden" data-tu="botOn" id="btOn" disabled>' +
      '<div id="btZone" class="a2zone"></div>' +
      '<div class="a2row"><span>🎯 จำนวนบอทเป้าหมาย (เติมอัตโนมัติ)</span><input type="number" min="0" max="200" data-tu="botTarget" id="btTg" disabled></div>' +
      '<div class="a2row"><span>⏱ บอทคิดทุก</span><select data-tu="botEvery" id="btEv" disabled>' +
        [5, 10, 15, 20, 30, 60].map(function(m){ return '<option value="' + m + '">' + m + ' นาที</option>'; }).join('') + '</select></div>' +
      '<div class="a2row"><span>📦 บอทที่คิดต่อรอบ (ตัว)</span><input type="number" min="5" max="60" data-tu="botBatch" id="btBa" disabled></div>' +
      '<div class="a2h" id="btCost"></div>' +
      '<button class="btn b1" id="btSave" disabled>💾 บันทึกการตั้งค่าบอท</button><div id="btMsg" class="a2m"></div>' +
      '<div class="a2sub">➕➖ เพิ่ม / ลบบอท</div>' +
      '<div class="a2two"><input type="number" id="btN" min="1" max="50" placeholder="จำนวน (1–50)"><select id="btZ"><option value="0">🌐 กระจาย 4 เขต</option>' +
        [1, 2, 3, 4].map(function(z){ return '<option value="' + z + '">' + ZN[z] + '</option>'; }).join('') + '</select></div>' +
      '<div class="a2two"><button class="btn b1" id="btAdd">➕ เพิ่มบอท</button><button class="btn red" id="btDel">➖ ลบบอท</button></div>' +
      '<p class="a2note">ลบจะเลือกบอทที่เล็กที่สุดก่อน · เมือง ทัพ และโอเอซิสของบอทที่ถูกลบจะหายไปด้วย</p><div id="btMsg2" class="a2m"></div>';
  }
  function swPaint(){
    var on = $('btOn').value === '1';
    $('btSw').classList.toggle('on', on);
    $('btSwT').textContent = on ? '🟢 บอททำงานอยู่' : '🔴 บอทปิดอยู่ (ไม่สร้าง ไม่ฝึก ไม่บุก)';
  }
  function costPaint(){
    var tg = +$('btTg').value || 0, ev = +$('btEv').value || 15, ba = +$('btBa').value || 20;
    var w = Math.round(Math.min(tg, ba) * 1440 / ev), cyc = Math.ceil(tg / Math.max(1, ba)) * ev;
    $('btCost').innerHTML = '📊 บอทแต่ละตัวได้คิดทุก ≈ <b>' + cyc + '</b> นาที · ใช้โควตาเขียน D1 ≈ <b>' + fmt(w) + '</b> แถว/วัน' +
      '<br><span style="color:#8a7a55">ค่าเดิม (60 ตัว · ทุก 5 นาที) ≈ 17,280 แถว/วัน · โควตาฟรี 100,000 แถว/วัน</span>';
  }
  function btPaintCfg(r){
    if (!$('btSw')) return;
    var ok = r && r.cur && ('botOn' in r.cur);
    ['btOn', 'btTg', 'btEv', 'btBa', 'btSave'].forEach(function(id){ $(id).disabled = !ok; });
    if (!ok){ $('btSwT').textContent = '⚠ ต้อง deploy worker v15H ก่อน'; return; }
    $('btOn').value = r.cur.botOn ? 1 : 0; $('btTg').value = r.cur.botTarget; $('btEv').value = r.cur.botEvery; $('btBa').value = r.cur.botBatch;
    swPaint(); costPaint();
  }
  function btLoad(){
    Api.post('/admin/bots', { action:'info' }).then(function(r){
      if (!$('btZone')) return;
      if (!r || !r.ok || !r.zone){ $('btZone').innerHTML = '<div style="grid-column:1/3">⚠ โหลดจำนวนบอทไม่ได้ (deploy worker v15H แล้วหรือยัง)</div>'; return; }
      $('btZone').innerHTML = '<div style="grid-column:1/3;text-align:center">รวม <b>' + r.total + '</b> ตัว · เป้าหมาย ' + r.target + ' ตัว</div>' +
        [1, 2, 3, 4].map(function(z){ return '<div>' + ZN[z] + '<b>' + (r.zone[z] || 0) + '</b></div>'; }).join('');
    });
  }
  function btBind(){
    $('btSw').onclick = function(){
      if ($('btSave').disabled) return;
      var on = $('btOn').value !== '1';
      if (!confirm(on ? 'เปิดบอท?' : 'ปิดบอท?\nบอทจะหยุดสร้าง ฝึก และบุก (ทัพที่ออกไปแล้วยังเดินต่อ)')) return;
      $('btOn').value = on ? 1 : 0; swPaint(); tuneSave('btMsg');
    };
    ['btTg', 'btEv', 'btBa'].forEach(function(id){ $(id).oninput = $(id).onchange = costPaint; });
    $('btSave').onclick = function(){ tuneSave('btMsg'); setTimeout(btLoad, 1500); };
    function act(a){
      var n = parseInt($('btN').value, 10), z = +$('btZ').value;
      if (!(n >= 1 && n <= 50)) return say('btMsg2', 'ใส่จำนวน 1 – 50');
      if (a === 'remove' && !confirm('ลบบอท ' + n + ' ตัว' + (z ? ' ใน' + ZN[z] : '') + ' ?')) return;
      say('btMsg2', 'กำลังทำ…', true);
      Api.post('/admin/bots', { action:a, n:n, zone:z }).then(function(r){
        if (!r || !r.ok) return say('btMsg2', esc((r && r.err) || 'ไม่สำเร็จ'));
        say('btMsg2', a === 'spawn' ? '✔ เพิ่มบอท ' + r.spawned + ' ตัว' : '✔ ลบบอท ' + r.removed + ' ตัว', true);
        btLoad();
      });
    }
    $('btAdd').onclick = function(){ act('spawn'); };
    $('btDel').onclick = function(){ act('remove'); };
  }

  /* ---------- ⚡ ความเร็วเซิร์ฟเวอร์ ---------- */
  var SPB = { season:135, fort:60, cap:90, hold:15 };
  function spCalc(s){ return { len:Math.round(SPB.season / s), fort:Math.round(SPB.fort / s), cap:Math.round(SPB.cap / s), hold:Math.max(2, Math.round(SPB.hold / s)) }; }
  function spCard(){
    var o = '';
    for (var i = 1; i <= 5; i++) o += '<option value="' + i + '">⚡ x' + i + ' · ฤดูกาล ' + spCalc(i).len + ' วัน</option>';
    return '<b>⚡ ความเร็วเซิร์ฟเวอร์</b><div id="spInfo" class="a2note" style="color:#b9ac92">กำลังโหลด…</div>' +
      '<div class="a2two"><select id="spS">' + o + '</select><select id="spT"></select></div><div id="spPrev" class="a2h"></div>' +
      '<p class="a2note">มีผลกับทุกคนภายใน 1 นาที · ควรตั้งก่อนเริ่มฤดูกาลใหม่</p>' +
      '<button class="btn b1" id="spSave">💾 ตั้งความเร็ว</button>' +
      '<button class="btn red" id="spClear">↺ กลับเป็นแบบเดิม (x1 · 45 วัน)</button><div id="spMsg" class="a2m"></div>';
  }
  function spTroop(sel){
    var s = +$('spS').value, h = '';
    for (var i = 1; i <= s; i++) h += '<option value="' + i + '"' + (i === sel ? ' selected' : '') + '>🐎 เดินทัพ x' + i + '</option>';
    $('spT').innerHTML = h;
  }
  function spPrev(){
    var s = +$('spS').value, c = spCalc(s);
    $('spPrev').innerHTML = 'ฤดูกาล <b>' + c.len + '</b> วัน · ป้อมเปิดวันที่ <b>' + c.fort + '</b> · เมืองหลวงวันที่ <b>' + c.cap +
      '</b> · ครอง <b>' + c.hold + '</b> วันชนะ<br>ก่อสร้าง ฝึกทหาร ผลิต CP เร็วขึ้น x' + s + ' · เดินทัพ x' + $('spT').value;
  }
  function spPaint(r){
    $('spInfo').innerHTML = r.set
      ? 'ตอนนี้: <b>x' + r.s + '</b> · เดินทัพ x' + r.ts + ' · วันที่ ' + r.day + ' / ' + r.len + ' · ป้อมวันที่ ' + r.fort + ' · เมืองหลวงวันที่ ' + r.cap
      : 'ตอนนี้: <b>แบบเดิม</b> (x1 · ฤดูกาล 45 วัน) · วันที่ ' + r.day;
    $('spS').value = r.set ? r.s : 3;
    spTroop(r.set ? r.ts : 2);
    spPrev();
  }
  function loadSpeed(){
    Api.post('/admin/speed', { action:'list' }).then(function(r){
      if (r && r.ok) spPaint(r); else $('spInfo').textContent = (r && r.err) || 'โหลดไม่สำเร็จ';
    });
  }
  function spBind(){
    $('spS').onchange = function(){ spTroop(Math.min(+$('spT').value || 1, +$('spS').value)); spPrev(); };
    $('spT').onchange = spPrev;
    $('spSave').onclick = function(){
      var s = +$('spS').value, ts = +$('spT').value;
      if (!confirm('ตั้งความเร็ว x' + s + ' (เดินทัพ x' + ts + ')\nมีผลกับผู้เล่นทุกคนทันที\n\nยืนยัน?')) return;
      Api.post('/admin/speed', { action:'set', s:s, ts:ts }).then(function(r){
        say('spMsg', r && r.ok ? '✔ ตั้งแล้ว' : esc(r && r.err), r && r.ok); if (r && r.ok) spPaint(r);
      });
    };
    $('spClear').onclick = function(){
      if (!confirm('กลับเป็นกติกาเดิม (x1 · ฤดูกาล 45 วัน)?')) return;
      Api.post('/admin/speed', { action:'clear' }).then(function(r){
        say('spMsg', r && r.ok ? '✔ กลับเป็นแบบเดิมแล้ว' : esc(r && r.err), r && r.ok); if (r && r.ok) spPaint(r);
      });
    };
  }

  /* ---------- 🏰 ป้อมและเมืองหลวง ---------- */
  var FPL = [[2, '+2 (150%)'], [1, '+1 (125%)'], [0, 'ปกติ (100%)'], [-1, '−1 (75%)'], [-2, '−2 (50%)']];
  var PO = [0, 25, 50, 75, 100, 125, 150, 200];
  function fpOpt(){ return FPL.map(function(o){ return '<option value="' + o[0] + '">' + o[1] + '</option>'; }).join(''); }
  function poOpt(){ return PO.map(function(p){ return '<option value="' + p + '"' + (p === 100 ? ' selected' : '') + '>' + p + '%</option>'; }).join(''); }
  function fpCard(){
    return '<b>🏰 ป้อมและเมืองหลวง</b>' +
      '<div class="a2sub">⚔ ระดับพลัง (จำนวนทหารเมื่อเต็ม)</div>' +
      '<div class="a2row"><span>🏰 ป้อมทั้ง 8</span><select id="fpF" style="width:130px!important">' + fpOpt() + '</select></div>' +
      '<div class="a2row"><span>👑 เมืองหลวง</span><select id="fpC" style="width:130px!important">' + fpOpt() + '</select></div>' +
      '<button class="btn b1" id="fpSave">💾 ตั้งระดับพลัง</button>' +
      '<div class="a2sub">♻ อัตราฟื้นทหาร (% ของทหารเต็ม ต่อ 5 นาที · ติดลบ = ค่อย ๆ ลดลง)</div>' +
      '<div class="a2row"><span>🏰 ป้อม</span><input type="number" step="0.1" min="-10" max="10" data-tu="fortRegen" id="fpRF" disabled></div>' +
      '<div class="a2row"><span>👑 เมืองหลวง</span><input type="number" step="0.1" min="-10" max="10" data-tu="capRegen" id="fpRC" disabled></div>' +
      '<div class="a2h" id="fpRI"></div><button class="btn b1" id="fpRS" disabled>💾 บันทึกอัตราฟื้น</button><div id="fpRM" class="a2m"></div>' +
      '<div class="a2sub">🎚 ตั้งทหารทันที (เฉพาะที่ยังเป็นของ NPC)</div>' +
      '<div class="a2two"><select id="fpSc"><option value="all">🏰👑 ทั้งหมด</option><option value="fort">🏰 ป้อมทั้ง 8</option><option value="cap">👑 เมืองหลวง</option></select>' +
      '<select id="fpPc">' + poOpt() + '</select></div><button class="btn b3" id="fpSet">🎚 ตั้งทหารตาม %</button>' +
      '<div class="a2sub">📋 สถานะ</div><button class="btn b3" id="fpRe">🔄 โหลดสถานะ</button>' +
      '<div id="fpMsg" class="a2m"></div><div id="fpList" style="margin-top:6px">กำลังโหลด…</div>';
  }
  function fpRegInfo(){
    function h(v){
      v = +v; if (!v) return 'ไม่ฟื้น ไม่ลด';
      var hr = 100 / Math.abs(v) * 5 / 60;
      return (v > 0 ? 'ฟื้นจาก 0 → เต็ม' : 'ลดจากเต็ม → 0') + ' ≈ ' + (hr < 1 ? Math.round(hr * 60) + ' นาที' : hr.toFixed(1) + ' ชม.');
    }
    $('fpRI').innerHTML = '🏰 ' + h($('fpRF').value) + '<br>👑 ' + h($('fpRC').value) +
      '<br><span style="color:#8a7a55">เวลาคิดที่ x1 · เซิร์ฟ x3 จะเร็วขึ้น 3 เท่า</span>';
  }
  function fpPaintRegen(r){
    if (!$('fpRF')) return;
    var ok = r && r.cur && ('fortRegen' in r.cur);
    ['fpRF', 'fpRC', 'fpRS'].forEach(function(id){ $(id).disabled = !ok; });
    if (!ok){ $('fpRI').textContent = '⚠ ต้อง deploy worker v15H ก่อน'; return; }
    $('fpRF').value = r.cur.fortRegen; $('fpRC').value = r.cur.capRegen; fpRegInfo();
  }
  function fpBar(c, m){
    var p = m ? Math.round(c / m * 100) : 0, col = p >= 70 ? '#7fd17f' : p >= 35 ? '#ffcf40' : '#ff7a5a';
    return '<div class="gfbar" style="margin:2px 0 4px"><i style="width:' + Math.min(100, p) + '%;background:' + col + '"></i></div>';
  }
  function fpPaint(r){
    if (!r || !r.ok){ $('fpList').textContent = (r && r.err) || 'โหลดไม่สำเร็จ'; return; }
    $('fpF').value = r.pow.fort || 0; $('fpC').value = r.pow.cap || 0;
    var capNote = r.list.some(function(f){ return f.cap; }) ? '' :
      '<div class="a2h">👑 เมืองหลวงยังไม่เปิด · จะปรากฏวันที่ ' + (r.capDay || '?') + ' ของฤดูกาล (ตั้งค่าไว้ล่วงหน้าได้)</div>';
    if (!r.list.length){ $('fpList').innerHTML = capNote + '<div class="a2h">🏰 ป้อมยังไม่เปิด · จะปรากฏวันที่ ' + (r.fortDay || '?') + '</div>'; return; }
    $('fpList').innerHTML = capNote + r.list.sort(function(a, b){ return b.cap - a.cap; }).map(function(f){
      var tc = 0, tm = 0;
      var tr = Object.keys(f.base).map(function(k){
        var c = f.troops[k] || 0, m = f.base[k]; tc += c; tm += m;
        return '<tr><td>' + esc(r.un[k] || k) + '</td><td>' + fmt(c) + ' / ' + fmt(m) + '</td><td>' + (m ? Math.round(c / m * 100) : 0) + '%</td></tr>';
      }).join('');
      return '<div class="a2h" style="border-left-color:' + (f.npc ? '#ffcf40' : '#ff7a5a') + '">' +
        '<b>' + (f.cap ? '👑 ' : '🏰 ') + esc(f.name) + '</b> (' + f.x + '|' + f.y + ') · ' +
        (f.npc ? 'NPC' : '🚩 ' + esc(f.pn || '?')) + ' · ❤ ภักดี ' + f.loy + '%' +
        '<div style="margin-top:4px">⚔ ทหารรวม ' + fmt(tc) + ' / ' + fmt(tm) + ' (' + (tm ? Math.round(tc / tm * 100) : 0) + '%)</div>' + fpBar(tc, tm) +
        '<table class="a2tb">' + tr + '</table>' +
        '🧱 กำแพง Lv.' + f.wall + ' / ' + f.L2 + fpBar(f.wall, f.L2) +
        '<div style="font-size:10.5px;color:#b9ac92">🏛 ' + (f.city.map(function(c){ return esc(c.n) + ' Lv.' + c.lv; }).join(' · ') || 'อาคารถูกทำลายหมด') + '</div>' +
        (f.npc ? '<div class="a2two"><select data-fpp="' + f.id + '">' + poOpt() + '</select>' +
          '<button class="btn b3" data-fa="setpct" data-id="' + f.id + '">🎚 ตั้งทหาร</button></div>' +
          '<div class="a2two"><button class="btn b3" data-fa="refill" data-id="' + f.id + '">⚔ เติมเต็ม</button>' +
          '<button class="btn red" data-fa="repair" data-id="' + f.id + '">🔧 ซ่อมทั้งหมด</button></div>' : '') + '</div>';
    }).join('');
  }
  function loadForts(){ $('fpList').textContent = 'กำลังโหลด…'; Api.post('/admin/forts', { action:'list' }).then(fpPaint); }
  function fpBind(){
    $('fpRe').onclick = loadForts;
    $('fpRF').oninput = $('fpRC').oninput = fpRegInfo;
    $('fpRS').onclick = function(){ tuneSave('fpRM'); };
    $('fpSave').onclick = function(){
      var f = +$('fpF').value, c = +$('fpC').value;
      if (!confirm('ตั้งพลังป้อม ' + (f > 0 ? '+' : '') + f + ' · เมืองหลวง ' + (c > 0 ? '+' : '') + c + ' ?\nถ้าลดระดับ ทหารส่วนเกินจะถูกตัดทันที')) return;
      Api.post('/admin/forts', { action:'pow', fort:f, cap:c }).then(function(r){
        say('fpMsg', r && r.ok ? '✔ ตั้งแล้ว' : esc(r && r.err), r && r.ok); fpPaint(r);
      });
    };
    $('fpSet').onclick = function(){
      var sc = $('fpSc').value, pc = +$('fpPc').value;
      var nm = { all:'ป้อมและเมืองหลวงทั้งหมด', fort:'ป้อมทั้ง 8', cap:'เมืองหลวง' }[sc];
      if (!confirm('ตั้งทหารของ' + nm + ' เป็น ' + pc + '% ของทหารเต็ม?')) return;
      Api.post('/admin/forts', { action:'setpct', scope:sc, pct:pc }).then(function(r){
        say('fpMsg', r && r.ok ? '✔ ตั้งแล้ว' : esc(r && r.err), r && r.ok); if (r && r.ok) fpPaint(r);
      });
    };
    $('fpList').onclick = function(e){
      var b = e.target.closest('[data-fa]'); if (!b) return;
      var a = b.dataset.fa, body = { action:a, id:+b.dataset.id };
      if (a === 'setpct'){ var s = document.querySelector('[data-fpp="' + b.dataset.id + '"]'); body.pct = +(s ? s.value : 100); }
      var q = a === 'repair' ? 'ซ่อมทั้งหมด: กำแพง อาคาร หลุมทรัพยากร ความภักดี และเติมทหารเต็ม?'
        : a === 'refill' ? 'เติมทหารให้เต็ม?' : 'ตั้งทหารเป็น ' + body.pct + '% ของทหารเต็ม?';
      if (!confirm(q)) return;
      Api.post('/admin/forts', body).then(function(r){
        say('fpMsg', r && r.ok ? '✔ เรียบร้อย' : esc(r && r.err), r && r.ok); if (r && r.ok) fpPaint(r);
      });
    };
  }

  /* ---------- 🎁 แจกทอง / ชดเชย ---------- */
  var GF = { busy:false, ok:false };
  function gfCard(){
    return '<b>🎁 แจกทอง / ชดเชยจากทีมงาน</b>' +
      '<select id="gfTo"><option value="all">🌐 ผู้เล่นทั้งเซิร์ฟเวอร์ (ยกเว้นบอทและคนที่ถูกระงับ)</option>' +
      '<option value="pick">👤 เลือกผู้เล่นเอง (ครั้งละไม่เกิน 90 คน)</option></select>' +
      '<textarea id="gfNames" class="hide" placeholder="ชื่อผู้เล่น บรรทัดละ 1 คน หรือคั่นด้วยเครื่องหมาย ,"></textarea>' +
      '<input id="gfAmt" type="number" min="1" max="10000" placeholder="จำนวนทองต่อคน (1 – 10,000)">' +
      '<input id="gfTitle" maxlength="60" placeholder="หัวข้อ เช่น ชดเชยการปิดปรับปรุงเซิร์ฟเวอร์">' +
      '<textarea id="gfTx" maxlength="800" placeholder="ข้อความถึงผู้เล่น (ไม่ใส่ก็ได้) เช่น ขออภัยที่ต้องปิดปรับปรุงเซิร์ฟเวอร์เมื่อคืน ทีมงานขอมอบทองเป็นการชดเชย"></textarea>' +
      '<p class="a2note">ผู้ได้รับทุกคนจะได้ข้อความจาก 📢 ทีมงาน ในกล่องข้อความ พร้อมยอดทอง</p>' +
      '<button class="btn b3" id="gfPrev">🔍 ตรวจก่อนส่ง</button><div id="gfInfo" class="a2m"></div>' +
      '<button class="btn b1" id="gfGo" disabled>🎁 ส่งทอง</button><div id="gfMsg" class="a2m"></div>';
  }
  function gfBody(dry){
    var pick = $('gfTo').value === 'pick';
    return { all:!pick, names: pick ? $('gfNames').value.split(/[\n,]+/).map(function(s){ return s.trim(); }).filter(Boolean) : [],
      gold:parseInt($('gfAmt').value, 10) || 0, title:$('gfTitle').value.trim(), text:$('gfTx').value.trim(), dry: dry ? 1 : 0 };
  }
  function gfReset(){ GF.ok = false; $('gfGo').disabled = true; $('gfInfo').innerHTML = ''; }
  function gfPreview(){
    var q = gfBody(true);
    if (q.gold < 1 || q.gold > 10000) return say('gfMsg', 'จำนวนทองต้องอยู่ระหว่าง 1 – 10,000');
    if (q.title.length < 2) return say('gfMsg', 'ใส่หัวข้อก่อน');
    if (!q.all && !q.names.length) return say('gfMsg', 'ใส่ชื่อผู้เล่นอย่างน้อย 1 คน');
    say('gfMsg', 'กำลังตรวจ…', true);
    Api.post('/admin/gift', q).then(function(r){
      if (!r || !r.ok) return say('gfMsg', esc((r && r.err) || 'ตรวจไม่สำเร็จ'));
      var miss = r.miss && r.miss.length ? '<br><span style="color:#ff8a6a">ไม่พบชื่อหรือถูกระงับ: ' + esc(r.miss.join(', ')) + '</span>' : '';
      if (!r.n) return say('gfMsg', 'ไม่พบผู้เล่นที่จะส่ง' + miss);
      GF.ok = true; GF.n = r.n; GF.gold = q.gold;
      $('gfInfo').innerHTML = 'จะส่งให้ <b>' + fmt(r.n) + '</b> คน × ' + fmt(q.gold) + ' = <b>' + fmt(r.n * q.gold) + '</b> ทอง' + miss +
        '<div style="margin-top:6px;color:#8a7a55">ตัวอย่างข้อความที่ผู้เล่นจะได้รับ:</div><div class="a2h" style="white-space:pre-wrap">' + esc(r.msg) + '</div>';
      $('gfGo').disabled = false; say('gfMsg', '');
    }, function(){ say('gfMsg', 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'); });
  }
  function gfSend(){
    if (GF.busy || !GF.ok) return;
    if (!confirm('ส่ง ' + fmt(GF.gold) + ' ทอง ให้ ' + fmt(GF.n) + ' คน\nรวม ' + fmt(GF.gold * GF.n) + ' ทอง พร้อมข้อความ\n\nยืนยัน?')) return;
    GF.busy = true; $('gfGo').disabled = true; $('gfPrev').disabled = true; say('gfMsg', 'กำลังส่ง…', true);
    Api.post('/admin/gift', gfBody(false)).then(function(r){
      GF.busy = false; $('gfPrev').disabled = false;
      if (!r || !r.ok){ $('gfGo').disabled = false; return say('gfMsg', '⚠ ' + esc((r && r.err) || 'ส่งไม่สำเร็จ')); }
      say('gfMsg', '✔ ส่ง ' + fmt(r.gold) + ' ทอง ให้ ' + fmt(r.n) + ' คนแล้ว (รวม ' + fmt(r.total) + ' ทอง) พร้อมข้อความ', true);
      gfReset(); $('gfAmt').value = ''; $('gfTitle').value = ''; $('gfTx').value = ''; $('gfNames').value = '';
    }, function(){
      GF.busy = false; $('gfPrev').disabled = false;
      say('gfMsg', '⚠ ไม่ได้รับคำตอบจากเซิร์ฟเวอร์ อย่าเพิ่งกดส่งซ้ำ ให้ตรวจบัญชีทองของผู้เล่นสักคนก่อนว่าได้รับแล้วหรือยัง');
    });
  }
  function gfBind(){
    $('gfTo').onchange = function(){ $('gfNames').classList.toggle('hide', $('gfTo').value !== 'pick'); gfReset(); };
    ['gfAmt', 'gfTitle', 'gfTx', 'gfNames'].forEach(function(id){ $(id).oninput = function(){ if (!GF.busy) gfReset(); }; });
    $('gfPrev').onclick = gfPreview; $('gfGo').onclick = gfSend;
  }

  /* ---------- 📒 บัญชีทอง (หน้าต่าง) ---------- */
  var LG_SOLO = false;
  function openLedger(){
    var L = $('llist'); if (!L) return;
    var home = L.parentNode, nx = L.nextSibling, f = 'all';
    L.classList.remove('hide');
    var box = mk('div', '', '<input id="lgQ" placeholder="🔍 ค้นหาชื่อผู้เล่น / เหตุผล / หมายเหตุ">' +
      '<div class="a2chips"><span class="on" data-f="all">ทั้งหมด</span><span data-f="in">➕ ได้รับ</span><span data-f="out">➖ ใช้ไป</span><span data-f="re">🔄 โหลดใหม่</span></div>' +
      '<div id="lgSum" class="a2h"></div>');
    box.appendChild(L);
    function num(r){ var v = r.querySelector('.v'); return v ? parseInt(v.textContent.replace(/[^\d-]/g, ''), 10) || 0 : 0; }
    function filt(){
      var q = box.querySelector('#lgQ').value.trim().toLowerCase(), n = 0, pin = 0, pout = 0;
      L.querySelectorAll('.row').forEach(function(r){
        var neg = !!r.querySelector('.neg');
        var show = (f === 'all' || (f === 'in' && !neg) || (f === 'out' && neg)) && (!q || r.textContent.toLowerCase().indexOf(q) >= 0);
        r.style.display = show ? '' : 'none';
        if (show){ n++; var v = num(r); if (v > 0) pin += v; else pout += v; }
      });
      box.querySelector('#lgSum').innerHTML = 'แสดง <b>' + n + '</b> รายการ · ได้รับรวม <b style="color:#7fd17f">+' + fmt(pin) +
        '</b> · ใช้ไปรวม <b style="color:#ff8a6a">' + fmt(pout) + '</b>';
    }
    box.querySelector('#lgQ').oninput = filt;
    box.querySelector('.a2chips').onclick = function(e){
      var c = e.target.closest('[data-f]'); if (!c) return;
      if (c.dataset.f === 're'){
        Api.get('/admin/ledger').then(function(r){ if (typeof paintLedger === 'function') paintLedger(r); filt(); });
        return;
      }
      f = c.dataset.f;
      box.querySelectorAll('.a2chips [data-f]').forEach(function(x){ x.classList.toggle('on', x === c); });
      filt();
    };
    modal('📒 บัญชีทอง · 200 รายการล่าสุด', box, function(){
      if (nx && nx.parentNode === home) home.insertBefore(L, nx); else home.appendChild(L);
      if (LG_SOLO) L.classList.add('hide');
    });
    filt();
  }

  /* ---------- 🔴 ตัวเลขแจ้งเตือนบนแท็บ ---------- */
  var lastTot = -1, slipResp = null, T0 = document.title;
  function badge(t, n){
    var b = document.querySelector('.tabs [data-t="' + t + '"] .bd'); if (!b) return;
    b.textContent = n > 99 ? '99+' : n; b.style.display = n ? '' : 'none';
  }
  function ping(){
    try {
      var A = window.AudioContext || window.webkitAudioContext; if (!A) return;
      var a = new A(), o = a.createOscillator(), g = a.createGain();
      o.frequency.value = 880; g.gain.value = 0.08; o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + 0.2);
    } catch(e){}
  }
  function cnt(){
    var bugs = document.querySelectorAll('#bglist .bug:not(.done)').length;
    var slips = slipResp != null ? slipResp : document.querySelectorAll('#olist [data-sl]').length;
    badge('bg', bugs); badge('gd', slips);
    var lg = $('lgN'); if (lg) lg.textContent = document.querySelectorAll('#llist .row').length + ' รายการ';
    var tot = bugs + slips;
    document.title = (tot ? '(' + tot + ') ' : '') + T0;
    if (lastTot >= 0 && tot > lastTot) ping();
    lastTot = tot;
  }
  function poll(){
    if (document.hidden) return;
    Api.get('/admin/orders').then(function(r){
      if (!r || !r.list) return;
      if (typeof paintOrders === 'function'){ slipResp = null; try { paintOrders(r); } catch(e){} }
      else slipResp = r.list.filter(function(o){ return (o.status === 'pending' || o.status === 'expired') && o.claim_at; }).length;
      cnt();
    });
  }
  function pollBugs(){ if (!document.hidden && typeof loadBugs === 'function') try { loadBugs(); } catch(e){} }
  function startBadges(){
    cnt(); setInterval(cnt, 3000);
    setInterval(poll, 120000);        /* สลิป: ทุก 2 นาที */
    setInterval(pollBugs, 600000);    /* รายงานปัญหา: ทุก 10 นาที (ประหยัดโควตา Firestore) */
    document.addEventListener('visibilitychange', function(){ if (!document.hidden) poll(); });
  }

  /* ---------- 🌐 เลือกเซิร์ฟเวอร์ ---------- */
  function srvBar(){
    if ($('a2srvBar') || typeof SERVERS === 'undefined' || !SERVERS.length) return;
    var cur = SERVERS[0].id;
    try { cur = (JSON.parse(localStorage.getItem('adm_srv') || 'null') || {}).id || cur; } catch(e){}
    var bar = mk('div', 'card', '<b>🌐 เซิร์ฟเวอร์ที่กำลังดู</b><select id="a2srv">' +
      SERVERS.map(function(s){ return '<option value="' + s.id + '"' + (s.id === cur ? ' selected' : '') + '>' + esc(s.name) + '</option>'; }).join('') +
      '</select><div id="a2srvI" class="a2note" style="color:#b9ac92">…</div>');
    bar.id = 'a2srvBar'; bar.style.borderColor = '#ffcf40';
    var h1 = document.querySelector('h1');
    if (h1) h1.parentNode.insertBefore(bar, h1.nextSibling); else document.body.insertBefore(bar, document.body.firstChild);
    $('a2srv').onchange = function(){
      try { localStorage.setItem('adm_srv', JSON.stringify({ id:+this.value })); } catch(e){}
      location.reload();
    };
    function bad(){ var e = $('a2srvI'); if (e) e.textContent = '⚠ เชื่อมต่อเซิร์ฟเวอร์นี้ไม่ได้'; }
    Api.get('/season').then(function(r){
      if (!r || !r.ok) return bad();
      $('a2srvI').innerHTML = (r.speed > 1 ? '⚡ SPEED x' + r.speed : 'ปกติ (x1)') + ' · เดินทัพ x' + (r.tspeed || r.speed || 1) +
        ' · วันที่ ' + (r.day || '?') + ' / ' + r.len;
    }, bad);
  }

  /* ---------- แท็บ ---------- */
  function lazy(t){
    if (loaded[t]) return;
    loaded[t] = 1;
    if (t === 'ov') loadStats();
    if (t === 'set'){ loadSpeed(); loadTune(); loadForts(); }
    if (t === 'bt'){ loadTune(); btLoad(); }
    if (t === 'gd') shLoad();
  }
  function show(t){
    if (!$('p-' + t)) t = 'ov';
    document.querySelectorAll('.tabs [data-t]').forEach(function(x){ x.classList.toggle('on', x.dataset.t === t); });
    document.querySelectorAll('.pane').forEach(function(p){ p.classList.toggle('hide', p.id !== 'p-' + t); });
    var ox = $('a2ovx'); if (ox) ox.classList.toggle('hide', t !== 'ov');
    try { localStorage.setItem('adm_tab2', t); } catch(e){}
    lazy(t);
  }

  function build(){
    var main = $('main'), tabs = document.querySelector('.tabs'), bt = $('p-bt'), ov = $('p-ov');
    if (!main || main.classList.contains('hide') || !tabs || !bt || !ov) return false;   /* รอล็อกอินก่อน */
    if ($('p-sys')) return true;
    /* 1) หาการ์ดเดิมก่อนสร้างการ์ดใหม่ (ชื่อจะได้ไม่ชนกัน) */
    var C = { status:block('สถานะระบบ'), season:block('👑 ฤดูกาล'), cp:block('Culture Points'), multi:block('คนเดียวกัน'),
      invite:block('เชิญเพื่อน'), wave:block('บุกทั้งเซิร์ฟเวอร์'), ann:block('ประกาศถึงผู้เล่นทุกคน'),
      backup:block('สำรองข้อมูล'), audit:block('บันทึกการกระทำ'),
      orders:cardOf('olist'), grant:cardOf('gsend'), ledger:cardOf('llist'), botOld:cardOf('btSpawn') };
    /* 2) แผงใหม่ */
    var ovx = mk('div'); ovx.id = 'a2ovx'; ov.parentNode.insertBefore(ovx, ov.nextSibling);
    var setp = mk('div', 'pane hide'); setp.id = 'p-set'; bt.parentNode.insertBefore(setp, bt);
    var sys = mk('div', 'pane hide'); sys.id = 'p-sys'; bt.parentNode.insertBefore(sys, bt.nextSibling);
    tabs.innerHTML = TABS.map(function(t){
      return '<button class="tab" data-t="' + t[0] + '"><span class="ic">' + t[1] + '</span>' + t[2] + '<span class="bd" style="display:none"></span></button>';
    }).join('');
    /* 3) การ์ดใหม่ */
    var stC = mk('div', 'card', '<b>📈 สถิติสมดุล</b><div id="a2st" style="margin-top:6px;font-size:11.5px;color:#b9ac92">กำลังโหลด…</div>' +
      '<button class="btn b3" id="a2stRe">🔄 โหลดใหม่</button>');
    var spC = mk('div', 'card', spCard());
    var shC = mk('div', 'card', shCard());
    var tuC = mk('div', 'card', '<b>🎛 ค่าเกม</b><p class="a2note">มีผลภายใน 1 นาที · ช่องว่าง = ใช้ค่าเริ่มต้น</p><div id="a2tu">กำลังโหลด…</div>' +
      '<button class="btn b1" id="a2tuSave">💾 บันทึกค่าเกม</button><button class="btn red" id="a2tuReset">↺ กลับค่าเริ่มต้นทั้งหมด</button><div id="a2tuMsg" class="a2m"></div>');
    var fpC = mk('div', 'card', fpCard());
    var btC = mk('div', 'card', btCard());
    var bbC = mk('div', 'card', '<b>🎯 พฤติกรรมบอท</b><p class="a2note">ช่องว่าง = ใช้ค่าเริ่มต้น</p><div id="a2tub">กำลังโหลด…</div>' +
      '<button class="btn b1" id="a2tubSave">💾 บันทึก</button><div id="a2tubMsg" class="a2m"></div>');
    var gfC = mk('div', 'card', gfCard());
    var lgC = mk('div', 'card', '<b>📒 บัญชีทอง</b><p class="a2note">200 รายการล่าสุด · ทองเข้า–ออกของผู้เล่นทุกคน</p>' +
      '<button class="btn b2" id="lgOpen">📒 เปิดรายการ · <span id="lgN">…</span></button>');
    /* 4) จัดลงหมวด */
    function put(pane, arr, before){ arr.forEach(function(n){ if (!n) return; if (before) pane.insertBefore(n, before); else pane.appendChild(n); }); }
    put(ovx, [sec('🖥 สถานะเซิร์ฟเวอร์'), C.status, C.season, sec('📈 สถิติ'), stC]);
    var pl = $('p-pl'); put(pl, [sec('📋 รายชื่อผู้เล่น')], pl.firstChild); put(pl, [sec('🧰 เครื่องมือผู้เล่น'), C.cp, C.multi]);
    var bg = $('p-bg'); put(bg, [sec('🐞 รายงานปัญหาจากผู้เล่น')], bg.firstChild); put(bg, [sec('📢 ประกาศถึงผู้เล่น'), C.ann]);
    put($('p-gd'), [sec('💳 เปิด/ปิดระบบเติมเงิน'), shC, sec('🧾 สลิปรอตรวจ / คำสั่งซื้อ'), C.orders, sec('🎁 ส่งทอง'), gfC, C.grant, sec('📒 บัญชีและอื่น ๆ'), lgC, C.invite]);
    if (C.ledger && C.ledger.classList.contains('card') && C.ledger !== C.orders && C.ledger !== C.grant){ $('p-gd').appendChild(C.ledger); C.ledger.classList.add('hide'); }
    else if ($('llist')){ $('llist').classList.add('hide'); LG_SOLO = true; }
    put(setp, [sec('⚡ ความเร็วเซิร์ฟเวอร์'), spC, sec('🎛 ค่าเกม'), tuC, sec('🏰 ป้อมและเมืองหลวง'), fpC]);
    put(bt, [sec('🤖 ควบคุมบอท'), btC, sec('🎯 พฤติกรรมบอท'), bbC, sec('🧪 เครื่องมือทดสอบ'), C.botOld, C.wave]);
    put(sys, [sec('💾 ข้อมูลและระบบ'), C.backup, C.audit]);
    document.querySelectorAll('.card').forEach(function(c){
      if (!c.closest('.pane') && !c.closest('#gate') && !c.closest('#a2ovx') && !c.closest('#a2mod') && c.id !== 'a2srvBar') sys.appendChild(c);
    });
    /* 5) ผูกปุ่ม */
    spBind(); gfBind(); fpBind(); btBind(); shBind();
    $('a2stRe').onclick = loadStats;
    $('a2tuSave').onclick = function(){ tuneSave('a2tuMsg'); };
    $('a2tubSave').onclick = function(){ tuneSave('a2tubMsg'); };
    $('a2tuReset').onclick = function(){
      if (!confirm('กลับเป็นค่าเริ่มต้นทั้งหมด?\nรวมค่าบอท (เปิด · 40 ตัว · ทุก 15 นาที) และอัตราฟื้นป้อมด้วย')) return;
      Api.post('/admin/tune', { action:'reset' }).then(function(r){ say('a2tuMsg', r && r.ok ? '✔ กลับค่าเริ่มต้นแล้ว' : esc(r && r.err), r && r.ok); if (r && r.ok) paintTune(r); });
    };
    $('lgOpen').onclick = openLedger;
    tabs.querySelectorAll('[data-t]').forEach(function(x){ x.onclick = function(e){ e.stopPropagation(); show(x.dataset.t); }; });
    var last = 'ov';
    try { last = localStorage.getItem('adm_tab2') || 'ov'; } catch(e){}
    show(last);
    startBadges();
    return true;
  }
  srvBar();
  var iv = setInterval(function(){ if (build()) clearInterval(iv); }, 500);
})();
