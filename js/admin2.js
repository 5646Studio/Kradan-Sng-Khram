/* ============ Admin2 v14U — แก้การ์ดภาพรวมหาย · รอล็อกอิน · แจกทอง/ชดเชยทั้งเซิร์ฟเวอร์ ============ */
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

  /* ---------- แท็บ ---------- */
  function lazy(t){
    if (loaded[t]) return;
    loaded[t] = 1;
    if (t === 'ov') loadStats();
    if (t === 'bt') loadTune();
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
    /* การ์ดปรับค่าเกม */
    $('p-bt').appendChild(mk('div', 'card', '<b>🎛 ปรับค่าเกม</b><p style="font-size:10.5px;color:#7a6c4e;margin:4px 0">มีผลภายใน 1 นาที · ช่องว่าง = ค่าเริ่มต้น</p>' +
      '<div id="a2tu">กำลังโหลด…</div><button class="btn b1" id="a2tuSave">💾 บันทึก</button>' +
      '<button class="btn red" id="a2tuReset">↺ กลับค่าเริ่มต้นทั้งหมด</button><div id="a2tuMsg" style="font-size:11px;margin-top:4px"></div>'));
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
      if (!c.closest('.pane') && !c.closest('#gate') && !c.closest('#a2ovx')) sys.appendChild(c);
    });
    /* ผูกปุ่มแท็บใหม่ทั้งหมด */
    tabs.querySelectorAll('[data-t]').forEach(function(x){ x.onclick = function(){ show(x.dataset.t); }; });
    var last = 'ov';
    try { last = localStorage.getItem('adm_tab2') || 'ov'; } catch(e){}
    show(last);
    return true;
  }
  var iv = setInterval(function(){ if (build()) clearInterval(iv); }, 500);
})();