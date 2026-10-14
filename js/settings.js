/* ============ Settings v14b — เมนูผู้เล่น ============ */
var Settings = (function(){
  var VER = '14-B2';
  function online(){ return typeof Sync !== 'undefined' && Sync.online && Sync.online(); }
  function esc(s){ return String(s == null ? '' : s).replace(/[<>&"]/g, function(c){
    return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]; }); }
  function isGuest(){ return online() && Net.me && Net.me() && Net.me().isAnonymous; }

  function open(){
    var nm = (Game.player && Game.player.name) || 'เจ้านคร';
    var pv = online() && Net.providerLabel ? Net.providerLabel() : '📴 ออฟไลน์ (เก็บในเครื่องนี้)';
    var h = '<h3>⚙ ตั้งค่า</h3><div class="infobox"><b style="color:#ffcf40;font-size:13px">' + esc(nm) +
      '</b><br>' + pv + '<br>เซิร์ฟเวอร์ ' + CFG.SERVER_NAME + ' · v' + VER + '</div>';
    if (isGuest())
      h += '<div class="bc-lock">คุณเล่นแบบผู้เยี่ยมชม ถ้าออกจากระบบจะเข้าบัญชีนี้ไม่ได้อีก ผูกบัญชี Google ได้ที่หน้าหลัก</div>';
    h += '<button class="btn-use" id="s_shop">💳 เติมทอง</button>' +
      '<button class="btn-use2" id="s_bug">🐞 แจ้งปัญหา / บั๊ก</button>' +
      '<button class="btn-use2" id="s_help">📖 วิธีเล่น</button>' +
      '<button class="btn-use2" id="s_home">🏠 กลับหน้าหลัก</button>' +
      '<button class="btn-del" id="s_out">🚪 ออกจากระบบ</button>' +
      '<button class="btn-del" id="s_del">🗑 ลบบัญชีและเมือง</button>' +
      '<button class="btn-cancel" onclick="UI.close()">ปิด</button>';
    UI.modal(h);
    document.getElementById('s_shop').onclick = shop;
    document.getElementById('s_bug').onclick = function(){ if (typeof Bug !== 'undefined') Bug.open(); };
    document.getElementById('s_help').onclick = help;
    document.getElementById('s_home').onclick = goHome;
    document.getElementById('s_out').onclick = logout;
    document.getElementById('s_del').onclick = delAccount;
  }
  function goHome(){
    try { save(); } catch(e){}
    if (online() && Net.flush) Net.flush(function(){ location.href = 'index.html'; });
    else location.href = 'index.html';
  }
  function logout(){
    if (!confirm(isGuest() ? 'คุณเป็นผู้เยี่ยมชม ออกแล้วจะเข้าบัญชีนี้ไม่ได้อีก ยืนยัน?' : 'ออกจากระบบ?')) return;
    try { save(); } catch(e){}
    if (online()) Net.logout(function(){ location.href = 'index.html'; });
    else { try { Account.logout(); } catch(e){} location.href = 'index.html'; }
  }
  function delAccount(){
    var nm = Game.player.name;
    UI.modal('<h3>🗑 ลบบัญชีและเมือง</h3>' +
      '<div class="hdeadbox" style="text-align:left">⚠ <b>ลบถาวร กู้คืนไม่ได้</b><br>' +
      '• เมืองทั้งหมดของคุณจะกลายเป็น <b>เมืองร้าง</b> บนแผนที่ ผู้เล่นอื่นปล้นได้<br>' +
      '• ทหารที่อยู่นอกเมือง ทอง และรายงานทั้งหมดจะหายไป<br>' +
      '• ถ้าอยากเล่นต่อ ต้องสมัครและเริ่มใหม่ทั้งหมด</div>' +
      '<p style="font-size:12px;margin:6px 0">พิมพ์ชื่อ <b style="color:#ffcf40">' + esc(nm) + '</b> เพื่อยืนยัน</p>' +
      '<input id="delnm" class="selbox" autocomplete="off">' +
      '<button class="btn-del" id="delgo">🗑 ลบถาวร</button>' +
      '<button class="btn-cancel" onclick="UI.close()">ยกเลิก</button>');
    document.getElementById('delgo').onclick = function(){
      if ((document.getElementById('delnm').value || '').trim() !== nm) return alert('พิมพ์ชื่อไม่ตรง');
      if (!confirm('ยืนยันครั้งสุดท้าย — ลบบัญชี ' + nm + ' ถาวร?')) return;
      this.disabled = true;
      if (online()){
        Sync.deleteAccount(nm, function(err){
          if (err){ alert(err); document.getElementById('delgo').disabled = false; return; }
          var u = (typeof firebase !== 'undefined') ? firebase.auth().currentUser : null;
          (u ? u.delete() : Promise.resolve()).catch(function(){}).then(function(){
            Net.logout(function(){ alert('ลบบัญชีเรียบร้อยแล้ว'); location.href = 'index.html'; });
          });
        });
      } else {
        try { Account.remove(Account.currentId()); } catch(e){}
        alert('ลบบัญชีเรียบร้อยแล้ว');
        location.href = 'index.html';
      }
    };
  }
  function shop(){
    if (typeof Shop !== 'undefined' && Shop.open) return Shop.open();
    UI.modal('<h3>💳 เติมทอง</h3><div class="infobox">ระบบเติมเงินจะเปิดให้บริการเร็ว ๆ นี้</div>' +
      '<button class="btn-cancel" onclick="UI.close()">ปิด</button>');
  }
  function help(){
    UI.modal('<h3>📖 วิธีเล่น</h3><div class="infobox" style="line-height:1.8">' +
      '🌾 <b>ทรัพยากร</b> — อัปหลุมที่หน้าทรัพยากร ข้าวต้องเป็นบวกเสมอ ไม่อย่างนั้นทหารจะอดตาย<br>' +
      '🏛 <b>เมือง</b> — แตะช่องว่างเพื่อสร้าง แตะอาคารเพื่ออัปเกรด<br>' +
      '⚔️ <b>ทหาร</b> — ฝึกที่ค่ายทหาร / คอกม้า / โรงงาน · ส่งทัพจากลานรวมพลหรือแตะเมืองบนแผนที่<br>' +
      '💰 <b>ปล้น</b> เสียทหารน้อย · ⚔️ <b>โจมตี</b> สู้เต็มกำลัง · 👁️ <b>สอดแนม</b> ดูทรัพยากรและทหาร<br>' +
      '🕳 <b>ที่ซ่อนทรัพย์</b> — ซ่อนของไม่ให้ถูกปล้น · 🗼 <b>หอคอย</b> — เห็นศัตรูก่อนถึงเมือง<br>' +
      '🕊️ <b>คุ้มครอง 5 วัน</b> — ถ้าคุณบุกผู้เล่นจริงก่อน การคุ้มครองจะหมดทันที<br>' +
      '👑 <b>เป้าหมาย</b> — ยึดเมืองหลวงโลก (0|0) และรักษาไว้ 5 วัน</div>' +
      '<button class="btn-cancel" onclick="UI.close()">ปิด</button>');
  }
  return { open:open, goHome:goHome, logout:logout, init:function(){} };
})();