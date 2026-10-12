/* ============ Bug v13e — ผู้เล่นแจ้งปัญหา ============ */
var Bug = (function(){
  var VER = '13e';
  var CATS = [
    { k:'bug',     n:'🐞 บั๊ก / เกมค้าง / ใช้งานไม่ได้' },
    { k:'display', n:'🖼 แสดงผลผิด / ปุ่มทับกัน' },
    { k:'balance', n:'⚖ ความสมดุลของเกม' },
    { k:'idea',    n:'💡 ข้อเสนอแนะ' },
    { k:'other',   n:'📝 อื่น ๆ' }
  ];

  function init(){
    if (document.getElementById('bugbar')) return;
    var b = document.createElement('div');
    b.id = 'bugbar';
    b.innerHTML = '<button id="bugbtn">🐞 แจ้งปัญหา / บั๊ก</button><span id="bugver">v' + VER + '</span>';
    document.body.appendChild(b);
    document.getElementById('bugbtn').onclick = open;
  }
  function page(){
    var p = document.querySelector('.page.active');
    return p ? p.id.replace('page-', '') : 'unknown';
  }

  function open(){
    var nErr = (typeof ErrLog !== 'undefined') ? ErrLog.length : 0;
    var h = '<h3>🐞 แจ้งปัญหา / บั๊ก</h3>' +
      '<div class="infobox">เล่าว่าเกิดอะไรขึ้น และตอนนั้นกำลังทำอะไรอยู่ ' +
      'ทีมงานจะได้แก้ได้ตรงจุด</div>' +
      '<select id="bgcat" class="selbox">' + CATS.map(function(c){
        return '<option value="' + c.k + '">' + c.n + '</option>'; }).join('') + '</select>' +
      '<textarea id="bgtx" class="bugta" maxlength="1000" ' +
      'placeholder="เช่น กดสร้างค่ายทหารแล้วหน้าจอค้าง ต้องรีเฟรชถึงจะเล่นต่อได้"></textarea>' +
      '<label class="misr"><input type="checkbox" id="bglog" checked>' +
      '<span>แนบบันทึกข้อผิดพลาดล่าสุด (' + nErr + ' รายการ)</span></label>' +
      '<div id="bgmsg"></div>' +
      '<button class="btn-ok" id="bgsend">📨 ส่งรายงาน</button>' +
      '<button class="btn-cancel" onclick="UI.close()">ปิด</button>';
    UI.modal(h);
    document.getElementById('bgsend').onclick = send;
  }

  function note(t, ok){
    var el = document.getElementById('bgmsg');
    if (el) el.innerHTML = '<div class="eta" style="color:' + (ok ? '#8fbf5f' : '#ff9a9a') +
      '">' + t + '</div>';
  }

  function send(){
    var tx = (document.getElementById('bgtx').value || '').trim();
    if (tx.length < 5) return note('กรุณาเล่ารายละเอียดอย่างน้อย 5 ตัวอักษร');
    var last = +(Store.get('sw_bug_last') || 0);
    if (Date.now() - last < 60000) return note('ส่งได้นาทีละ 1 ครั้ง รอสักครู่นะครับ');

    var errs = '';
    if (document.getElementById('bglog').checked && typeof ErrLog !== 'undefined')
      errs = ErrLog.slice(0, 6).map(function(e){
        return new Date(e.at).toLocaleTimeString('th-TH') + ' ' + e.where + ': ' + e.msg;
      }).join('\n').slice(0, 1500);

    var pos = '';
    try { if (Game.villages.length) pos = V().name + ' (' + V().x + '|' + V().y + ')'; } catch(e){}

    var d = { cat: document.getElementById('bgcat').value, text: tx.slice(0, 1000),
      page: page(), ver: VER, pos: pos, errs: errs,
      ua: navigator.userAgent.slice(0, 200),
      scr: window.innerWidth + 'x' + window.innerHeight };

    var btn = document.getElementById('bgsend');
    btn.disabled = true;
    note('กำลังส่ง…', true);

    function done(err){
      btn.disabled = false;
      if (err) return note(err);
      Store.set('sw_bug_last', String(Date.now()));
      note('✔ ส่งเรียบร้อย ขอบคุณที่ช่วยแจ้งครับ', true);
      setTimeout(function(){ UI.close(); }, 1200);
    }
    if (typeof Net !== 'undefined' && Net.enabled() && Net.uid()) Net.report(d, done);
    else {
      var L = Store.json('sw_bugs_local', []) || [];
      d.at = Date.now(); L.unshift(d);
      Store.setJson('sw_bugs_local', L.slice(0, 30));
      done(null);
    }
  }

  init();
  return { open:open };
})();