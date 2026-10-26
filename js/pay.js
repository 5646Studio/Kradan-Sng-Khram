/* ============ Pay v14M — เติมทองด้วย QR พร้อมเพย์ (ทีมงานยืนยันยอด) ============ */
var Pay = (function(){
  var LIB = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js', timer = null;
  var ST = { pending:'⏳ รอตรวจสอบ', paid:'✅ ได้รับทองแล้ว', expired:'⌛ หมดเวลา', cancel:'✕ ยกเลิก' };
  var CB = '<button class="btn-cancel" onclick="UI.close()">ปิด</button>';
  function esc(s){ return String(s == null ? '' : s).replace(/[<>&"]/g, function(c){
    return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]; }); }
  function tnow(){ return typeof now === 'function' ? now() : Date.now(); }
  function lib(cb){
    if (window.qrcode) return cb();
    var s = document.createElement('script');
    s.src = LIB; s.onload = cb; s.onerror = cb;
    document.head.appendChild(s);
  }

  function open(){
    UI.modal('<h3>💳 เติมทอง</h3><p class="stnone">กำลังโหลด…</p>');
    Api.get('/shop', null, false).then(function(r){
      var en = !!(r && r.enabled);
      var h = '<h3>💳 เติมทอง</h3><div class="infobox">' + (en
        ? 'จ่ายด้วย <b>QR พร้อมเพย์</b> ผ่านแอปธนาคารใดก็ได้<br>ทองเข้าหลังทีมงานตรวจยอด ปกติภายใน 24 ชม.'
        : '🚧 ระบบเติมเงินยังไม่เปิดให้บริการ') + '</div>';
      ((r && r.packages) || []).forEach(function(p){
        h += '<div class="shopc"><b>💰 ' + esc(p.name) + '<i>' + UI.fmt(p.gold) + (p.bonus ? ' + โบนัส ' + UI.fmt(p.bonus) : '') +
          ' ทอง</i></b><span>' + p.price + ' ฿</span>' + (en ? '<button class="mini" data-pk="' + p.id + '">ซื้อ</button>' : '') + '</div>';
      });
      UI.modal(h + '<button class="btn-use2" id="payH">📜 ประวัติการซื้อ</button>' + CB);
      document.getElementById('payH').onclick = history;
      document.querySelectorAll('[data-pk]').forEach(function(b){
        b.onclick = function(){
          b.disabled = true;
          Api.post('/shop/order', { pkg:b.dataset.pk }).then(function(o){
            if (!o.ok){ b.disabled = false; return alert(o.err || 'สั่งซื้อไม่สำเร็จ'); }
            show(o);
          });
        };
      });
    });
  }

  function show(o){
    lib(function(){
      var src = '', O = o.order;
      try { if (window.qrcode){ var q = qrcode(0, 'M'); q.addData(o.qr); q.make(); src = q.createDataURL(6, 2); } } catch(e){}
      UI.modal('<h3>🧾 ชำระเงิน ' + esc(O.ref) + '</h3><div class="payamt">' + O.price.toFixed(2) + ' ฿</div>' +
        '<div class="paynote">โอนให้ตรง<b>ทุกสตางค์</b> ระบบใช้เศษสตางค์ยืนยันว่าเป็นของคุณ · ได้ 💰 ' + UI.fmt(O.gold) + ' ทอง</div>' +
        (src ? '<img class="payqr" src="' + src + '" alt="QR พร้อมเพย์">' : '<p class="stnone">สร้าง QR ไม่ได้ ลองใหม่อีกครั้ง</p>') +
        (o.name ? '<div class="paynm">ชื่อบัญชีผู้รับ: <b>' + esc(o.name) + '</b></div>' : '') +
        '<div class="payt" id="payT"></div><ol class="paystep"><li>กดค้างที่ QR แล้วบันทึกรูป</li>' +
        '<li>เปิดแอปธนาคาร → สแกน → เลือกรูปจากอัลบั้ม</li><li>ตรวจว่ายอดเงินตรงกัน แล้วโอน</li>' +
        '<li>กลับมากด 📤 แจ้งโอนแล้ว</li></ol>' +
        '<input id="payN" class="selbox" maxlength="120" placeholder="เวลาโอน หรือ 4 ตัวท้ายบัญชีผู้โอน (ไม่บังคับ)">' +
        '<button class="btn-ok" id="payC">📤 แจ้งโอนแล้ว</button>' +
        '<div class="suphint">ห้ามโอนหลังหมดเวลา · ถ้ามีปัญหาแจ้งเลขอ้างอิง ' + esc(O.ref) + ' ที่ 🐞 แจ้งปัญหา</div>' + CB);
      clearInterval(timer);
      function tick(){
        var el = document.getElementById('payT');
        if (!el){ clearInterval(timer); return; }
        var s = (O.expires - tnow()) / 1000;
        el.innerHTML = s > 0 ? '⏱ ชำระภายใน ' + UI.dur(s) : '<span class="lack">หมดเวลา กรุณาสั่งซื้อใหม่</span>';
        if (s <= 0){ clearInterval(timer); var b = document.getElementById('payC'); if (b) b.disabled = true; }
      }
      tick();
      timer = setInterval(tick, 1000);
      document.getElementById('payC').onclick = function(){
        var b = this;
        b.disabled = true;
        Api.post('/shop/claim', { id:O.id, note:(document.getElementById('payN').value || '').trim() }).then(function(r){
          if (!r.ok){ b.disabled = false; return alert(r.err || 'แจ้งไม่สำเร็จ'); }
          clearInterval(timer);
          UI.modal('<h3>📤 แจ้งโอนแล้ว</h3><div class="infobox">เลขอ้างอิง <b>' + esc(O.ref) + '</b><br>ทีมงานจะตรวจยอดแล้วเติม 💰 ' +
            UI.fmt(O.gold) + ' ทองให้ ปกติภายใน 24 ชม.<br>ดูสถานะได้ที่ 📜 ประวัติการซื้อ</div>' + CB);
        });
      };
    });
  }

  function history(){
    UI.modal('<h3>📜 ประวัติการซื้อ</h3><p class="stnone">กำลังโหลด…</p>');
    Api.post('/shop/orders', {}).then(function(r){
      var L = (r && r.orders) || [];
      var h = '<h3>📜 ประวัติการซื้อ</h3>' + (L.length ? L.map(function(o){
        return '<div class="row"><span>' + esc(o.ref) + ' · 💰 ' + UI.fmt(o.gold) + '<br><i style="font-size:10px;color:#8a7a55">' +
          new Date(o.created).toLocaleString('th-TH') + '</i></span><b>' + (ST[o.status] || esc(o.status)) + '</b></div>';
      }).join('') : '<p class="stnone">ยังไม่มีรายการ</p>');
      UI.modal(h + '<button class="btn-use2" id="payBk">◀ กลับไปหน้าเติมทอง</button>' + CB);
      document.getElementById('payBk').onclick = open;
    });
  }
  return { open:open, history:history };
})();