/* ============ Settings v14 — เมนูผู้เล่น (ไม่มีเครื่องมือผู้พัฒนา) ============ */
var Settings = (function(){
  var VER = '14-B1';

  function online(){ return typeof Net !== 'undefined' && Net.enabled && Net.enabled(); }
  function esc(s){ return String(s == null ? '' : s).replace(/[<>&"]/g, function(c){
    return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]; }); }

  function open(){
    var nm = (typeof Game !== 'undefined' && Game.player && Game.player.name) || 'เจ้านคร';
    var pv = online() && Net.providerLabel ? Net.providerLabel() : '📴 ออฟไลน์ (เก็บในเครื่องนี้)';
    var guest = online() && Net.me && Net.me() && Net.me().isAnonymous;

    var h = '<h3>⚙ ตั้งค่า</h3>' +
      '<div class="infobox"><b style="color:#ffcf40;font-size:13px">' + esc(nm) + '</b><br>' +
      pv + '<br>เซิร์ฟเวอร์ ' + CFG.SERVER_NAME + ' · v' + VER + '</div>';
    if (guest)
      h += '<div class="bc-lock">คุณเล่นแบบผู้เยี่ยมชม ถ้าออกจากระบบจะเข้าบัญชีนี้ไม่ได้อีก ' +
        'ผูกบัญชี Google ได้ที่หน้าหลัก</div>';
    h += '<button class="btn-use" id="s_shop">💳 เติมทอง</button>' +
      '<button class="btn-use2" id="s_bug">🐞 แจ้งปัญหา / บั๊ก</button>' +
      '<button class="btn-use2" id="s_help">📖 วิธีเล่น</button>' +
      '<button class="btn-use2" id="s_home">🏠 กลับหน้าหลัก</button>' +
      '<button class="btn-del" id="s_out">🚪 ออกจากระบบ</button>' +
      '<button class="btn-cancel" onclick="UI.close()">ปิด</button>';
    UI.modal(h);

    document.getElementById('s_shop').onclick = shop;
    document.getElementById('s_bug').onclick = function(){
      if (typeof Bug !== 'undefined') Bug.open(); };
    document.getElementById('s_help').onclick = help;
    document.getElementById('s_home').onclick = goHome;
    document.getElementById('s_out').onclick = logout;
  }

  function goHome(){
    try { save(); } catch(e){}
    if (online() && Net.flush) Net.flush(function(){ location.href = 'index.html'; });
    else location.href = 'index.html';
  }

  function logout(){
    var guest = online() && Net.me && Net.me() && Net.me().isAnonymous;
    if (!confirm(guest ? 'คุณเป็นผู้เยี่ยมชม ออกแล้วจะเข้าบัญชีนี้ไม่ได้อีก ยืนยัน?'
                       : 'ออกจากระบบ?')) return;
    try { save(); } catch(e){}
    if (online() && Net.logout) Net.logout(function(){ location.href = 'index.html'; });
    else {
      try { if (typeof Account !== 'undefined') Account.logout(); } catch(e){}
      location.href = 'index.html';
    }
  }

  function shop(){
    if (typeof Shop !== 'undefined' && Shop.open) return Shop.open();
    UI.modal('<h3>💳 เติมทอง</h3>' +
      '<div class="infobox">ระบบเติมเงินกำลังพัฒนา จะเปิดให้บริการเร็ว ๆ นี้</div>' +
      '<button class="btn-cancel" onclick="UI.close()">ปิด</button>');
  }

  function help(){
    UI.modal('<h3>📖 วิธีเล่น</h3>' +
      '<div class="infobox" style="line-height:1.8">' +
      '🌾 <b>ทรัพยากร</b> — อัปหลุมที่หน้าทรัพยากร ข้าวต้องเป็นบวกเสมอ<br>' +
      '🏛 <b>เมือง</b> — แตะช่องว่างเพื่อสร้าง แตะอาคารเพื่ออัปเกรด<br>' +
      '🔨 <b>ช่าง</b> — ทำงานพร้อมกัน 2 งาน รอคิวได้อีก 2 · ⚡ เร่งด้วยทอง<br>' +
      '📦 <b>คลัง/ยุ้งฉาง</b> — เต็มแล้วทรัพยากรจะหยุดเพิ่ม<br>' +
      '🗿 <b>วีรบุรุษ</b> — ลากปุ่มกลมไปวางที่ไหนก็ได้<br>' +
      '☰ <b>เมนูลอย</b> — กองทัพ, อันดับ, ภารกิจ, พิกัดที่บันทึกไว้<br>' +
      '👑 <b>เป้าหมาย</b> — ยึดเมืองหลวงโลก (0|0) และรักษาไว้ 5 วัน</div>' +
      '<button class="btn-cancel" onclick="UI.close()">ปิด</button>');
  }

  return { open:open, goHome:goHome, logout:logout, init:function(){} };
})();