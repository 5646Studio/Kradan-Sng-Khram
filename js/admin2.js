/* ============ Admin2 v15A — แก้การ์ดภาพรวมหาย · รอล็อกอิน · แจกทอง/ชดเชยทั้งเซิร์ฟเวอร์ ============ */
(function(){
  /* [แท็บ, คำในหัวการ์ด, วางบนสุดของแท็บ] */
  var PLACE = [
    ['ov', 'สถานะระบบ', 1], ['ov', '👑 ฤดูกาล', 0],
    ['pl', 'Culture Points', 0], ['pl', 'คนเดียวกัน', 0],
    ['gd', 'เชิญเพื่อน', 0],
    ['bt', 'บุกทั้งเซิร์ฟเวอร์', 0],
    ['bg', 'ประกาศถึงผู้เล่นทุกคน', 1],
    ['sys', 'สำรองข้อมูล', 0], ['sys', 'บันทึกการกระทำ', 0]
  ];
  var LABEL = { ov:'📊 ภาพรวม', pl:'👥 ผู้เล่น', bg:'📢 สื่อสาร', gd:'💳 การเงิน', bt:'🤖 บอท', sys:'🛠 ระบบ' };
  var RN = { purchase:'💳 เติมเงิน', checkin:'📅 เช็คอิน', quest:'📜 ภารกิจ', invite:'🤝 เชิญเพื่อน', invited:'🤝 ถูกเชิญ',
    tutorial:'🎓 บทแนะนำ', heal:'⛑ รักษา', potion:'🧪 ยา', npc:'⚖ พ่อค้าหลวง', guild:'🏯 ตั้งกิลด์', herolook:'🎨 ปั้นหน้า',
    demolish:'🔨 รื้อถอน', grant:'🛠 แอดมินให้', rush:'⚡ เร่ง', rushall:'⚡ เร่งทั้งหมด', builder:'🔨 ช่างคนที่ 3', spend:'💸 ใช้จ่าย' };
  var TL = { botAtt:'⚔ บอทออกรบสูงสุดต่อรอบ (ขบวน)', botHit:'🎯 บอทบุกผู้เล่นจริง (1 = ใช่ · 0 = ไม่)',
    botRange:'📏 ระยะที่บอทมองหาเป้า (ช่อง)', botPrey:'🐟 บอทบุกผู้เล่นที่ใหญ่กว่าได้ถึง (เท่า)',
    botPreyWar:'🐺 บอทสายทหารบุกได้ถึง (เท่า)', botPlayerW:'🧲 น้ำหนักเป้าผู้เล่น',
    cpBase:'🎭 CP พื้นฐานต่อเมืองต่อวัน', invGold:'🤝 ทองให้ผู้เชิญ', invFriend:'🤝 ทองให้เพื่อนที่ถูกเชิญ' };
  var loaded = {};
  function esc(s){ return String(s == null ? '' : s).replace(/[<>&"]/g, function(c){
    return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]; }); }
  function fmt(n){ return Number(n || 0).toLocaleString('th-TH'); }
  function $(i){ return document.getElementById(i); }
  function mk(tag, cls, html){ var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function say(id, t, ok){ var e = $(id); if (!e) return; e.style.color = ok ? '#7fd17f' : '#ff8a6a'; e.innerHTML = t; }

  var css = mk('style');
  css.textContent = '.a2tb{width:100%;border-collapse:collapse;font-size:11px;margin:6px 0}.a2tb td,.a2tb th{border-bottom:1px solid #2f2618;padding:4px;text-align:right}' +
    '.a2tb td:first-child,.a2tb th:first-child{text-align:left}.a2tb th{color:#8a7a55;font-weight:400}' +
    '.a2h{background:#2a2216;border-left:3px solid #ffcf40;padding:6px 8px;margin:4px 0;font-size:11.5px;line-height:1.6;border-radius:4px}' +
    '.a2row{display:flex;align-items:center;gap:6px;margin:4px 0;font-size:11.5px}.a2row span{flex:1}.a2row input{width:80px!important;margin:0!important}' +
    '.a2row i{font-style:normal;color:#6a5f45;font-size:10px;width:60px}.tabs{overflow-x:auto;flex-wrap:nowrap}.tabs .tab{flex:0 0 auto}' +
    '.gfck{display:flex;align-items:center;gap:6px;font-size:12px;margin-top:8px}.gfck input{width:auto!important;margin:0!important}' +
    '.gfbar{height:8px;background:#251e14;border-radius:4px;margin-top:6px;overflow:hidden}.gfbar i{display:block;height:100%;background:#ffcf40;width:0}' +
    '.gfnm{font-size:10.5px;color:#8a7a55;max-height:90px;overflow:auto;margin-top:4px;line-height:1.6}';
  document.head.appendChild(css);

  function block(w){
    var bs = document.querySelectorAll('b');
    for (var i = 0; i < bs.length; i++){
      if (bs[i].textContent.indexOf(w) < 0) continue;
      var c = bs[i].closest('.card') || bs[i].parentElement;
      if (c && !c.classList.contains('pane') && c.id !== 'main' && !c.closest('#gate')) return c;
    }
    return null;
  }

  /* ---------- สถิติสมดุล ---------- */
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
        '<h4 style="margin:8px 0 2px">💡 คำแนะนำ</h4>' + H.map(function(x){ return '<div class="a2h">' + x + '</div>'; }).join('') +
        '<h4 style="margin:8px 0 2px">📈 ความเร็วโตตามจำนวนวันที่เล่น</h4><table class="a2tb"><tr><th>วัน</th><th>คน</th><th>ประชากรเฉลี่ย</th><th>เมืองเฉลี่ย</th></tr>' +
        r.buckets.map(function(b){
          return '<tr><td>' + b.a + (b.b > 999 ? '+' : '–' + b.b) + '</td><td>' + b.n + '</td><td>' + (b.n ? fmt(Math.round(b.pop / b.n)) : '—') +
            '</td><td>' + (b.n ? (b.vc / b.n).toFixed(1) : '—') + '</td></tr>';
        }).join('') + '</table><h4 style="margin:8px 0 2px">💰 ทอง 7 วันล่าสุด</h4><table class="a2tb"><tr><th>ที่มา</th><th>ได้</th><th>ใช้</th><th>ครั้ง</th></tr>' +
        (r.ledger.map(function(l){
          return '<tr><td>' + (RN[l.reason] || esc(l.reason)) + '</td><td>' + fmt(l.inn) + '</td><td>' + fmt(l.outt) + '</td><td>' + l.n + '</td></tr>';
        }).join('') || '<tr><td colspan="4">ไม่มีข้อมูล</td></tr>') + '</table><h4 style="margin:8px 0 2px">⚔️ รายงานการรบ 7 วันล่าสุด</h4><table class="a2tb">' +
        (r.war.map(function(w){ return '<tr><td>' + esc(w[0]) + '</td><td>' + fmt(w[1]) + '</td></tr>'; }).join('') || '<tr><td>ไม่มีข้อมูล</td></tr>') +
        '</table><h4 style="margin:8px 0 2px">📜 ผู้เล่นตามข้อภารกิจ</h4><div style="font-size:10.5px;line-height:1.8">' +
        Object.keys(r.quest).map(function(k){ return 'ข้อ ' + (+k + 1 > 32 ? 'ครบ' : +k + 1) + ': <b>' + r.quest[k] + '</b>'; }).join(' · ') + '</div>';
    }, function(){ if ($('a2st')) $('a2st').textContent = 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'; });
  }

  /* ---------- ปรับค่าเกม ---------- */
  function paintTune(r){
    $('a2tu').innerHTML = Object.keys(TL).map(function(k){
      var cur = r.cur[k], def = r.def[k];
      return '<div class="a2row"><span>' + TL[k] + '</span><i>เริ่มต้น ' + def + '</i><input type="number" step="any" data-tu="' + k + '" value="' +
        (cur !== def ? cur : '') + '" placeholder="' + def + '"></div>';
    }).join('');
  }
  function loadTune(){ Api.post('/admin/tune', { action:'list' }).then(function(r){ if (r && r.ok) paintTune(r); }); }

  /* ---------- 🎁 แจกทอง / ชดเชย (v14U · /admin/gift) ---------- */
  var GF = { busy:false, ok:false };
  function gfCard(){
    return '<b>🎁 แจกทอง / ชดเชยจากทีมงาน</b>' +
      '<select id="gfTo"><option value="all">🌐 ผู้เล่นทั้งเซิร์ฟเวอร์ (ยกเว้นบอทและคนที่ถูกระงับ)</option>' +
      '<option value="pick">👤 เลือกผู้เล่นเอง (ครั้งละไม่เกิน 90 คน)</option></select>' +
      '<textarea id="gfNames" class="hide" placeholder="ชื่อผู้เล่น บรรทัดละ 1 คน หรือคั่นด้วยเครื่องหมาย ,"></textarea>' +
      '<input id="gfAmt" type="number" min="1" max="10000" placeholder="จำนวนทองต่อคน (1 – 10,000)">' +
      '<input id="gfTitle" maxlength="60" placeholder="หัวข้อ เช่น ชดเชยการปิดปรับปรุงเซิร์ฟเวอร์">' +
      '<textarea id="gfTx" maxlength="800" placeholder="ข้อความถึงผู้เล่น (ไม่ใส่ก็ได้) เช่น ขออภัยที่ต้องปิดปรับปรุงเซิร์ฟเวอร์เมื่อคืน ทีมงานขอมอบทองเป็นการชดเชย"></textarea>' +
      '<p style="font-size:10.5px;color:#7a6c4e;margin:6px 0 0">ผู้ได้รับทุกคนจะได้ข้อความจาก 📢 ทีมงาน ในกล่องข้อความ พร้อมยอดทอง</p>' +
      '<button class="btn b3" id="gfPrev">🔍 ตรวจก่อนส่ง</button>' +
      '<div id="gfInfo" style="font-size:11.5px;margin-top:6px"></div>' +
      '<button class="btn b1" id="gfGo" disabled>🎁 ส่งทอง</button>' +
      '<div id="gfMsg" style="font-size:11.5px;margin-top:4px"></div>';
  }
  function gfBody(dry){
    var pick = $('gfTo').value === 'pick';
    return {
      all: !pick,
      names: pick ? $('gfNames').value.split(/[\n,]+/).map(function(s){ return s.trim(); }).filter(Boolean) : [],
      gold: parseInt($('gfAmt').value, 10) || 0,
      title: $('gfTitle').value.trim(),
      text: $('gfTx').value.trim(),
      dry: dry ? 1 : 0
    };
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
        '<div style="margin-top:6px;color:#8a7a55">ตัวอย่างข้อความที่ผู้เล่นจะได้รับ:</div>' +
        '<div class="a2h" style="white-space:pre-wrap">' + esc(r.msg) + '</div>';
      $('gfGo').disabled = false;
      say('gfMsg', '');
    }, function(){ say('gfMsg', 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'); });
  }
  function gfSend(){
    if (GF.busy || !GF.ok) return;
    if (!confirm('ส่ง ' + fmt(GF.gold) + ' ทอง ให้ ' + fmt(GF.n) + ' คน\nรวม ' + fmt(GF.gold * GF.n) + ' ทอง พร้อมข้อความ\n\nยืนยัน?')) return;
    GF.busy = true; $('gfGo').disabled = true; $('gfPrev').disabled = true;
    say('gfMsg', 'กำลังส่ง…', true);
    Api.post('/admin/gift', gfBody(false)).then(function(r){
      GF.busy = false; $('gfPrev').disabled = false;
      if (!r || !r.ok){ $('gfGo').disabled = false; return say('gfMsg', '⚠ ' + esc((r && r.err) || 'ส่งไม่สำเร็จ')); }
      say('gfMsg', '✔ ส่ง ' + fmt(r.gold) + ' ทอง ให้ ' + fmt(r.n) + ' คนแล้ว (รวม ' + fmt(r.total) + ' ทอง) พร้อมข้อความ', true);
      gfReset();
      $('gfAmt').value = ''; $('gfTitle').value = ''; $('gfTx').value = ''; $('gfNames').value = '';
    }, function(){
      GF.busy = false; $('gfPrev').disabled = false;
      say('gfMsg', '⚠ ไม่ได้รับคำตอบจากเซิร์ฟเวอร์ อย่าเพิ่งกดส่งซ้ำ ให้ตรวจบัญชีทองของผู้เล่นสักคนก่อนว่าได้รับแล้วหรือยัง');
    });
  }
  function gfBind(){
    $('gfTo').onchange = function(){ $('gfNames').classList.toggle('hide', $('gfTo').value !== 'pick'); gfReset(); };
    ['gfAmt', 'gfTitle', 'gfTx', 'gfNames'].forEach(function(id){ $(id).oninput = function(){ if (!GF.busy) gfReset(); }; });
    $('gfPrev').onclick = gfPreview;
    $('gfGo').onclick = gfSend;
  }
  /* ---------- ⚡ ความเร็วเซิร์ฟเวอร์ (v14Z) ---------- */
  var SPB = { season:135, fort:60, cap:90, hold:15 };
  function spCalc(s){ return { len:Math.round(SPB.season / s), fort:Math.round(SPB.fort / s), cap:Math.round(SPB.cap / s), hold:Math.max(2, Math.round(SPB.hold / s)) }; }
  function spCard(){
    var o = '';
    for (var i = 1; i <= 5; i++) o += '<option value="' + i + '">⚡ x' + i + ' · ฤดูกาล ' + spCalc(i).len + ' วัน</option>';
    return '<b>⚡ ความเร็วเซิร์ฟเวอร์</b><div id="spInfo" style="font-size:11.5px;color:#b9ac92;margin:6px 0">กำลังโหลด…</div>' +
      '<select id="spS">' + o + '</select><select id="spT"></select><div id="spPrev" class="a2h"></div>' +
      '<p style="font-size:10.5px;color:#7a6c4e;margin:4px 0">มีผลกับทุกคนภายใน 1 นาที · ควรตั้งก่อนกด 🏁 เริ่มฤดูกาลใหม่</p>' +
      '<button class="btn b1" id="spSave">💾 ตั้งความเร็ว</button>' +
      '<button class="btn red" id="spClear">↺ กลับเป็นแบบเดิม (x1 · 45 วัน)</button><div id="spMsg" style="font-size:11.5px;margin-top:4px"></div>';
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
      if (r && r.ok) spPaint(r); else $('spInfo').textContent = (r && r.err) || 'โหลดไม่สำเร็จ (deploy worker แล้วหรือยัง)';
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
  /* ---------- 🌐 เลือกเซิร์ฟเวอร์ (v15A) ---------- */
  function srvBar(){
    if ($('a2srvBar') || typeof SERVERS === 'undefined' || !SERVERS.length) return;
    var cur = SERVERS[0].id;
    try { cur = (JSON.parse(localStorage.getItem('adm_srv') || 'null') || {}).id || cur; } catch(e){}
    var bar = mk('div', 'card', '<b>🌐 เซิร์ฟเวอร์ที่กำลังดู</b><select id="a2srv">' +
      SERVERS.map(function(s){ return '<option value="' + s.id + '"' + (s.id === cur ? ' selected' : '') + '>' + esc(s.name) + '</option>'; }).join('') +
      '</select><div id="a2srvI" style="font-size:11.5px;color:#b9ac92;margin-top:4px">…</div>');
    bar.id = 'a2srvBar';
    bar.style.borderColor = '#ffcf40';
    var h1 = document.querySelector('h1');
    if (h1) h1.parentNode.insertBefore(bar, h1.nextSibling);
    else document.body.insertBefore(bar, document.body.firstChild);
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
  /* ---------- 🏰 ป้อมและเมืองหลวง (v15C) ---------- */
  var FPL = [[2,'+2 (150%)'],[1,'+1 (125%)'],[0,'ปกติ (100%)'],[-1,'−1 (75%)'],[-2,'−2 (50%)']];
  function fpOpt(){ return FPL.map(function(o){ return '<option value="' + o[0] + '">' + o[1] + '</option>'; }).join(''); }
  function fpCard(){
    return '<b>🏰 ป้อมและเมืองหลวง</b>' +
      '<div class="a2row"><span>🏰 พลังป้อมทั้ง 8</span><select id="fpF" style="width:130px;margin:0">' + fpOpt() + '</select></div>' +
      '<div class="a2row"><span>👑 พลังเมืองหลวง</span><select id="fpC" style="width:130px;margin:0">' + fpOpt() + '</select></div>' +
      '<button class="btn b1" id="fpSave">💾 ตั้งระดับพลัง</button><button class="btn b3" id="fpRe">🔄 โหลดสถานะ</button>' +
      '<div id="fpMsg" style="font-size:11.5px;margin-top:4px"></div><div id="fpList" style="margin-top:6px">กำลังโหลด…</div>';
  }
  function fpBar(c, m){
    var p = m ? Math.round(c / m * 100) : 0, col = p >= 70 ? '#7fd17f' : p >= 35 ? '#ffcf40' : '#ff7a5a';
    return '<div class="gfbar" style="margin:2px 0 4px"><i style="width:' + Math.min(100, p) + '%;background:' + col + '"></i></div>';
  }
  function fpPaint(r){
    if (!r || !r.ok){ $('fpList').textContent = (r && r.err) || 'โหลดไม่สำเร็จ'; return; }
    $('fpF').value = r.pow.fort || 0; $('fpC').value = r.pow.cap || 0;
    if (!r.list.length){ $('fpList').innerHTML = '<div class="a2h">ยังไม่มีป้อมหรือเมืองหลวง (เปิดตามวันในฤดูกาล)</div>'; return; }
    $('fpList').innerHTML = r.list.sort(function(a, b){ return b.cap - a.cap; }).map(function(f){
      var tc = 0, tm = 0;
      var tr = Object.keys(f.base).map(function(k){
        var c = f.troops[k] || 0, m = f.base[k]; tc += c; tm += m;
        return '<tr><td>' + esc(r.un[k] || k) + '</td><td>' + fmt(c) + ' / ' + fmt(m) + '</td><td>' + (m ? Math.round(c / m * 100) : 0) + '%</td></tr>';
      }).join('');
      return '<div class="a2h" style="border-left-color:' + (f.npc ? '#ffcf40' : '#ff7a5a') + '">' +
        '<b>' + (f.cap ? '👑 ' : '🏰 ') + esc(f.name) + '</b> (' + f.x + '|' + f.y + ') · ' +
        (f.npc ? 'NPC' : '🚩 ' + esc(f.pn || '?')) + ' · ❤ ภักดี ' + f.loy + '%' +
        '<div style="margin-top:4px">⚔ ทหารรวม ' + fmt(tc) + ' / ' + fmt(tm) + '</div>' + fpBar(tc, tm) +
        '<table class="a2tb">' + tr + '</table>' +
        '🧱 กำแพง Lv.' + f.wall + ' / ' + f.L2 + fpBar(f.wall, f.L2) +
        '<div style="font-size:10.5px;color:#b9ac92">🏛 ' + (f.city.map(function(c){ return esc(c.n) + ' Lv.' + c.lv; }).join(' · ') || 'อาคารถูกทำลายหมด') + '</div>' +
        (f.npc ? '<button class="btn b3" data-fa="refill" data-id="' + f.id + '">⚔ เติมทหารเต็ม</button>' +
          '<button class="btn red" data-fa="repair" data-id="' + f.id + '">🔧 ซ่อมทั้งหมด</button>' : '') + '</div>';
    }).join('');
  }
  function loadForts(){ $('fpList').textContent = 'กำลังโหลด…'; Api.post('/admin/forts', { action:'list' }).then(fpPaint); }
  function fpBind(){
    $('fpRe').onclick = loadForts;
    $('fpSave').onclick = function(){
      var f = +$('fpF').value, c = +$('fpC').value;
      if (!confirm('ตั้งพลังป้อม ' + (f > 0 ? '+' : '') + f + ' · เมืองหลวง ' + (c > 0 ? '+' : '') + c + ' ?\nถ้าลดระดับ ทหารส่วนเกินจะถูกตัดทันที')) return;
      Api.post('/admin/forts', { action:'pow', fort:f, cap:c }).then(function(r){
        say('fpMsg', r && r.ok ? '✔ ตั้งแล้ว' : esc(r && r.err), r && r.ok); fpPaint(r);
      });
    };
    $('fpList').onclick = function(e){
      var b = e.target.closest('[data-fa]'); if (!b) return;
      var a = b.dataset.fa;
      if (!confirm(a === 'repair' ? 'ซ่อมทั้งหมด: กำแพง อาคาร หลุมทรัพยากร ความภักดี และเติมทหารเต็ม?' : 'เติมทหารให้เต็ม?')) return;
      Api.post('/admin/forts', { action:a, id:+b.dataset.id }).then(function(r){
        say('fpMsg', r && r.ok ? '✔ เรียบร้อย' : esc(r && r.err), r && r.ok); if (r && r.ok) fpPaint(r);
      });
    };
  }
  /* ---------- แท็บ ---------- */
  function lazy(t){
    if (loaded[t]) return;
    loaded[t] = 1;
    if (t === 'ov'){ loadStats(); loadSpeed(); }
    if (t === 'bt'){ loadTune(); loadForts(); }
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
    /* กล่องการ์ดของภาพรวม — อยู่นอก #p-ov เพื่อไม่ให้ paintOv() ลบทิ้ง */
    var ovx = mk('div', ''); ovx.id = 'a2ovx';
    ov.parentNode.insertBefore(ovx, ov.nextSibling);
    /* แท็บใหม่ 🛠 ระบบ */
    var sys = mk('div', 'pane hide'); sys.id = 'p-sys';
    bt.parentNode.insertBefore(sys, bt.nextSibling);
    var b = mk('button', 'tab', LABEL.sys); b.dataset.t = 'sys';
    tabs.appendChild(b);
    tabs.querySelectorAll('[data-t]').forEach(function(x){ if (LABEL[x.dataset.t]) x.textContent = LABEL[x.dataset.t]; });
    /* ย้ายการ์ด */
    PLACE.forEach(function(p){
      var c = block(p[1]), pane = p[0] === 'ov' ? ovx : $('p-' + p[0]);
      if (!c || !pane) return;
      if (p[2]) pane.insertBefore(c, pane.firstChild); else pane.appendChild(c);
    });
    /* การ์ดสถิติสมดุล */
    ovx.appendChild(mk('div', 'card', '<b>📈 สถิติสมดุล</b><div id="a2st" style="margin-top:6px;font-size:11.5px;color:#b9ac92">กำลังโหลด…</div>' +
      '<button class="btn b3" id="a2stRe">🔄 โหลดใหม่</button>'));
    ovx.appendChild(mk('div', 'card', spCard()));
    spBind();

    /* การ์ดปรับค่าเกม */
    $('p-bt').appendChild(mk('div', 'card', '<b>🎛 ปรับค่าเกม</b><p style="font-size:10.5px;color:#7a6c4e;margin:4px 0">มีผลภายใน 1 นาที · ช่องว่าง = ค่าเริ่มต้น</p>' +
      '<div id="a2tu">กำลังโหลด…</div><button class="btn b1" id="a2tuSave">💾 บันทึก</button>' +
      '<button class="btn red" id="a2tuReset">↺ กลับค่าเริ่มต้นทั้งหมด</button><div id="a2tuMsg" style="font-size:11px;margin-top:4px"></div>'));
    $('p-bt').appendChild(mk('div', 'card', fpCard()));
    fpBind();
    /* การ์ดแจกทอง — บนสุดของแท็บการเงิน */
    var gd = $('p-gd');
    if (gd){ var gc = mk('div', 'card', gfCard()); gd.insertBefore(gc, gd.firstChild); gfBind(); }

    $('a2stRe').onclick = loadStats;
    $('a2tuSave').onclick = function(){
      var v = {};
      document.querySelectorAll('[data-tu]').forEach(function(i){ if (i.value !== '') v[i.dataset.tu] = i.value; });
      Api.post('/admin/tune', { action:'set', v:v }).then(function(r){ $('a2tuMsg').textContent = r.ok ? '✔ บันทึกแล้ว' : r.err; if (r.ok) paintTune(r); });
    };
    $('a2tuReset').onclick = function(){
      if (!confirm('กลับเป็นค่าเริ่มต้นทั้งหมด?')) return;
      Api.post('/admin/tune', { action:'reset' }).then(function(r){ $('a2tuMsg').textContent = r.ok ? '✔ กลับค่าเริ่มต้นแล้ว' : r.err; if (r.ok) paintTune(r); });
    };
    /* การ์ดที่ยังลอยอยู่นอกแท็บ → แท็บระบบ */
    document.querySelectorAll('.card').forEach(function(c){
      if (!c.closest('.pane') && !c.closest('#gate') && !c.closest('#a2ovx') && c.id !== 'a2srvBar') sys.appendChild(c);
    });
    /* ผูกปุ่มแท็บใหม่ทั้งหมด */
    tabs.querySelectorAll('[data-t]').forEach(function(x){ x.onclick = function(){ show(x.dataset.t); }; });
    var last = 'ov';
    try { last = localStorage.getItem('adm_tab2') || 'ov'; } catch(e){}
    show(last);
    return true;
  }
  srvBar();
  var iv = setInterval(function(){ if (build()) clearInterval(iv); }, 500);
})();