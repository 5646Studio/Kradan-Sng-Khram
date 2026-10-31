/* ============ Admin2 v14R — จัดแท็บแผงผู้พัฒนา · สถิติสมดุล · ปรับค่าเกม ============ */
(function(){
  var TABS = [
    ['home', '📊 ภาพรวม', ['สถานะระบบ', 'ฤดูกาล', 'ภาพรวม']],
    ['pay', '💳 การเงิน', ['คำสั่งซื้อ', 'บัญชีทอง', 'เชิญเพื่อน', 'ledger', 'รายรับ', 'สลิป']],
    ['player', '👥 ผู้เล่น', ['ผู้เล่น', 'คนเดียวกัน', 'Culture', 'แบน', 'ทอง']],
    ['bot', '🤖 บอท', ['บอท']],
    ['msg', '📢 สื่อสาร', ['ประกาศ', 'แจ้งปัญหา', 'บั๊ก', 'รายงาน', '🐞', 'แชต']],
    ['sys', '🛠 ระบบ', ['สำรอง', 'บันทึกการกระทำ']]
  ];
  var RN = { purchase:'💳 เติมเงิน', checkin:'📅 เช็คอิน', quest:'📜 ภารกิจ', invite:'🤝 เชิญเพื่อน', invited:'🤝 ถูกเชิญ',
    tutorial:'🎓 บทแนะนำ', heal:'⛑ รักษา', potion:'🧪 ยา', npc:'⚖ พ่อค้าหลวง', guild:'🏯 ตั้งกิลด์', herolook:'🎨 ปั้นหน้า',
    demolish:'🔨 รื้อถอน', admin:'🛠 แอดมิน' };
  var TL = { botAtt:'⚔ บอทออกรบสูงสุดต่อรอบ (ขบวน)', botHit:'🎯 บอทบุกผู้เล่นจริง (1 = ใช่ · 0 = ไม่)',
    botRange:'📏 ระยะที่บอทมองหาเป้า (ช่อง)', botPrey:'🐟 บอทบุกผู้เล่นที่ใหญ่กว่าได้ถึง (เท่า)',
    botPreyWar:'🐺 บอทสายทหารบุกได้ถึง (เท่า)', botPlayerW:'🧲 น้ำหนักเป้าผู้เล่น (ยิ่งมาก บอทยิ่งชอบตีผู้เล่น)',
    cpBase:'🎭 CP พื้นฐานต่อเมืองต่อวัน', invGold:'🤝 ทองให้ผู้เชิญ', invFriend:'🤝 ทองให้เพื่อนที่ถูกเชิญ' };
  function esc(s){ return String(s == null ? '' : s).replace(/[<>&"]/g, function(c){
    return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]; }); }
  function fmt(n){ return Number(n || 0).toLocaleString('th-TH'); }
  function mk(tag, cls, html){ var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function $(i){ return document.getElementById(i); }
  var P = {}, loaded = {};

  var css = mk('style');
  css.textContent = '.a2bar{display:flex;gap:4px;overflow-x:auto;position:sticky;top:0;z-index:5;background:#0d0b08;padding:6px 0;margin-bottom:6px}' +
    '.a2t{flex:0 0 auto;padding:8px 12px;border:1px solid #3a2e1c;border-radius:9px;background:#1c1710;color:#a89468;font-size:12.5px;font-family:inherit}' +
    '.a2t.on{background:#5a4a1e;color:#ffcf40;border-color:#c9a24a}.a2pane{display:none}.a2pane.on{display:block}' +
    '.a2tb{width:100%;border-collapse:collapse;font-size:11px;margin:6px 0}.a2tb td,.a2tb th{border-bottom:1px solid #2f2618;padding:4px;text-align:right}' +
    '.a2tb td:first-child,.a2tb th:first-child{text-align:left}.a2tb th{color:#8a7a55;font-weight:400}' +
    '.a2h{background:#2a2216;border-left:3px solid #ffcf40;padding:6px 8px;margin:4px 0;font-size:11.5px;line-height:1.6;border-radius:4px}' +
    '.a2row{display:flex;align-items:center;gap:6px;margin:4px 0;font-size:11.5px}.a2row span{flex:1}.a2row input{width:80px!important;margin:0!important}' +
    '.a2row i{font-style:normal;color:#6a5f45;font-size:10px;width:60px}';
  document.head.appendChild(css);

  function statsCard(){
    var c = mk('div', 'card', '<b>📈 สถิติสมดุล</b><div id="a2st" style="margin-top:6px;font-size:11.5px;color:#b9ac92">กำลังโหลด…</div>' +
      '<button class="btn b3" id="a2stRe">🔄 โหลดใหม่</button>');
    setTimeout(function(){ $('a2stRe').onclick = loadStats; }, 0);
    return c;
  }
  function tuneCard(){
    var c = mk('div', 'card', '<b>🎛 ปรับค่าเกม</b><p style="font-size:10.5px;color:#7a6c4e;margin:4px 0">มีผลภายใน 1 นาที ไม่ต้องแก้โค้ด · ' +
      'ช่องว่าง = ใช้ค่าเริ่มต้น</p><div id="a2tu">กำลังโหลด…</div><button class="btn b1" id="a2tuSave">💾 บันทึก</button>' +
      '<button class="btn red" id="a2tuReset">↺ กลับค่าเริ่มต้นทั้งหมด</button><div id="a2tuMsg" style="font-size:11px;margin-top:4px"></div>');
    setTimeout(function(){
      $('a2tuSave').onclick = function(){
        var v = {};
        document.querySelectorAll('[data-tu]').forEach(function(i){ if (i.value !== '') v[i.dataset.tu] = i.value; });
        Api.post('/admin/tune', { action:'set', v:v }).then(function(r){ $('a2tuMsg').textContent = r.ok ? '✔ บันทึกแล้ว' : r.err; if (r.ok) paintTune(r); });
      };
      $('a2tuReset').onclick = function(){
        if (!confirm('กลับเป็นค่าเริ่มต้นทั้งหมด?')) return;
        Api.post('/admin/tune', { action:'reset' }).then(function(r){ $('a2tuMsg').textContent = r.ok ? '✔ กลับค่าเริ่มต้นแล้ว' : r.err; if (r.ok) paintTune(r); });
      };
    }, 0);
    return c;
  }
  function paintTune(r){
    $('a2tu').innerHTML = Object.keys(TL).map(function(k){
      var cur = r.cur[k], def = r.def[k];
      return '<div class="a2row"><span>' + TL[k] + '</span><i>เริ่มต้น ' + def + '</i><input type="number" step="any" data-tu="' + k + '" value="' +
        (cur !== def ? cur : '') + '" placeholder="' + def + '" min="' + r.lim[k][0] + '" max="' + r.lim[k][1] + '"></div>';
    }).join('');
  }
  function loadTune(){ Api.post('/admin/tune', { action:'list' }).then(function(r){ if (r && r.ok) paintTune(r); }); }

  function loadStats(){
    Api.post('/admin/balance', { action:'list' }).then(function(r){
      if (!r || !r.ok){ $('a2st').textContent = (r && r.err) || 'โหลดไม่สำเร็จ'; return; }
      var tp = 0, tn = 0;
      r.buckets.forEach(function(b){ tp += b.pop; tn += b.n; });
      var avg = tn ? tp / tn : 0, H = [];
      var b3 = r.buckets[1], b4 = r.buckets[3];
      if (r.active < 10) H.push('ℹ️ ผู้เล่นที่เข้าเล่นใน 24 ชม. มีน้อยกว่า 10 คน ตัวเลขอาจยังไม่สะท้อนสมดุลจริง');
      if (r.bots.n && avg && r.bots.pop > avg * 1.3) H.push('🤖 บอทใหญ่กว่าผู้เล่นเฉลี่ยมาก ผู้เล่นใหม่อาจโดนตีหนัก ลองลด "บอทบุกผู้เล่นที่ใหญ่กว่าได้ถึง" หรือ "น้ำหนักเป้าผู้เล่น"');
      if (r.bots.n && avg && r.bots.pop < avg * 0.4) H.push('🤖 บอทเล็กกว่าผู้เล่นมาก ผู้เล่นปล้นบอทได้ง่ายเกินไป แจ้งผมเพื่อเร่งการโตของบอท');
      if (r.ret0 >= 10 && r.ret < 0.4) H.push('🚪 ผู้เล่นเกินครึ่งไม่กลับมาหลังวันแรก ช่วงแรกของเกมอาจช้าหรือยากเกินไป');
      if (b4.n >= 3 && b4.vc / b4.n < 1.5) H.push('🏘 ผู้เล่นที่เล่นมา 8–14 วันส่วนใหญ่ยังมีเมืองเดียว ลองเพิ่ม "CP พื้นฐาน"');
      if (b3.n >= 3 && b3.vc / b3.n >= 2) H.push('🏘 ผู้เล่นขยายเมืองเร็วกว่าเป้า (มีเมืองที่ 2 ภายใน 3–4 วัน) ลองลด "CP พื้นฐาน"');
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
        }).join('') + '</table>' +
        '<h4 style="margin:8px 0 2px">💰 ทอง 7 วันล่าสุด</h4><table class="a2tb"><tr><th>ที่มา</th><th>ได้</th><th>ใช้</th><th>ครั้ง</th></tr>' +
        (r.ledger.map(function(l){
          return '<tr><td>' + (RN[l.reason] || esc(l.reason)) + '</td><td>' + fmt(l.inn) + '</td><td>' + fmt(l.outt) + '</td><td>' + l.n + '</td></tr>';
        }).join('') || '<tr><td colspan="4">ไม่มีข้อมูล</td></tr>') + '</table>' +
        '<h4 style="margin:8px 0 2px">⚔️ รายงานการรบ 7 วันล่าสุด</h4><table class="a2tb">' +
        (r.war.map(function(w){ return '<tr><td>' + esc(w[0]) + '</td><td>' + fmt(w[1]) + '</td></tr>'; }).join('') || '<tr><td>ไม่มีข้อมูล</td></tr>') +
        '</table><h4 style="margin:8px 0 2px">📜 ผู้เล่นตามข้อภารกิจ</h4><div style="font-size:10.5px;line-height:1.8">' +
        Object.keys(r.quest).map(function(k){ return 'ข้อ ' + (+k + 1 > 32 ? 'ครบ' : +k + 1) + ': <b>' + r.quest[k] + '</b>'; }).join(' · ') + '</div>';
    });
  }

  function show(k){
    if (!P[k]) k = 'home';
    Object.keys(P).forEach(function(x){ P[x].classList.toggle('on', x === k); });
    document.querySelectorAll('.a2t').forEach(function(b){ b.classList.toggle('on', b.dataset.k === k); });
    try { localStorage.setItem('adm_tab', k); } catch(e){}
    if (!loaded[k]){ loaded[k] = 1; if (k === 'home') loadStats(); if (k === 'bot') loadTune(); }
  }
  function build(){
    var cards = Array.prototype.slice.call(document.querySelectorAll('.card'));
    if (cards.length < 3 || $('adm2')) return !!$('adm2');
    var host = mk('div'); host.id = 'adm2';
    cards[0].parentNode.insertBefore(host, cards[0]);
    var bar = mk('div', 'a2bar');
    host.appendChild(bar);
    var ALL = TABS.concat([['etc', '📁 อื่น ๆ', []]]);
    ALL.forEach(function(T){ var p = mk('div', 'a2pane'); host.appendChild(p); P[T[0]] = p; });
    var seen = {};
    cards.forEach(function(c){
      var b = c.querySelector('b'), tt = b ? b.textContent.trim() : '';
      if (tt && seen[tt]){ c.style.display = 'none'; return; }
      seen[tt] = 1;
      var k = 'etc';
      for (var i = 0; i < TABS.length; i++) if (TABS[i][2].some(function(w){ return tt.indexOf(w) >= 0; })){ k = TABS[i][0]; break; }
      P[k].appendChild(c);
    });
    P.home.appendChild(statsCard());
    P.bot.appendChild(tuneCard());
    ALL.forEach(function(T){
      if (T[0] === 'etc' && !P.etc.children.length){ P.etc.remove(); delete P.etc; return; }
      var b = mk('button', 'a2t', T[1]);
      b.dataset.k = T[0];
      b.onclick = function(){ show(T[0]); };
      bar.appendChild(b);
    });
    var last = 'home';
    try { last = localStorage.getItem('adm_tab') || 'home'; } catch(e){}
    show(last);
    return true;
  }
  var n = 0, iv = setInterval(function(){ if (build() || ++n > 40) clearInterval(iv); }, 700);
})();