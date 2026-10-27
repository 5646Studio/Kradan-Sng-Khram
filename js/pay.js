/* ============ Pay v14N — เติมทองด้วย QR พร้อมเพย์ + แนบสลิป ============ */
var Pay = (function(){
  var LIB = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js', timer = null;
  var ST = { pending:'⏳ รอตรวจสอบ', paid:'✅ ได้รับทองแล้ว', expired:'⌛ หมดเวลา', cancel:'✕ ยกเลิก', reject:'❌ ถูกปฏิเสธ' };
  var CB = '<button class="btn-cancel" onclick="UI.close()">ปิด</button>';
  function esc(s){ return String(s == null ? '' : s).replace(/[<>&"]/g, function(c){
    return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]; }); }
  function $(i){ return document.getElementById(i); }
  function tnow(){ return typeof now === 'function' ? now() : Date.now(); }
  function lib(cb){
    if (window.qrcode) return cb();
    var s = document.createElement('script');
    s.src = LIB; s.onload = cb; s.onerror = cb;
    document.head.appendChild(s);
  }
  function compress(file, cb){
    var fr = new FileReader();
    fr.onload = function(){
      var im = new Image();
      im.onload = function(){
        var s = Math.min(1, 1100 / Math.max(im.width, im.height)), c = document.createElement('canvas');
        c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
        var x = c.getContext('2d');
        x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
        x.drawImage(im, 0, 0, c.width, c.height);
        var d = c.toDataURL('image/jpeg', 0.72);
        if (d.length > 850000) d = c.toDataURL('image/jpeg', 0.5);
        cb(d.length > 850000 ? null : d);
      };
      im.onerror = function(){ cb(null); };
      im.src = fr.result;
    };
    fr.onerror = function(){ cb(null); };
    fr.readAsDataURL(file);
  }
  function slipBox(){
    return '<label class="slipbtn"><input type="file" accept="image/*" id="slF" style="display:none">📎 แนบรูปสลิป</label>' +
      '<img id="slP" class="slipprev" style="display:none" alt="">' +
      '<input id="payN" class="selbox" maxlength="120" placeholder="หมายเหตุ (ไม่บังคับ)">' +
      '<button class="btn-ok" id="payC" disabled>📤 ส่งสลิป</button>';
  }
  function bindSlip(O){
    var data = null;
    $('slF').onchange = function(){
      var f = this.files && this.files[0];
      if (!f) return;
      $('payC').disabled = true;
      compress(f, function(d){
        if (!d) return alert('อ่านรูปไม่ได้ หรือรูปใหญ่เกินไป ลองแคปหน้าจอสลิปใหม่');
        data = d;
        var p = $('slP'); p.src = d; p.style.display = 'block';
        $('payC').disabled = false;
      });
    };
    $('payC').onclick = function(){
      if (!data) return alert('แนบรูปสลิปก่อน');
      var b = this;
      b.disabled = true; b.textContent = '⏳ กำลังส่ง…';
      Api.post('/shop/claim', { id:O.id, slip:data, note:($('payN').value || '').trim() }).then(function(r){
        if (!r.ok){ b.disabled = false; b.textContent = '📤 ส่งสลิป'; return alert(r.err || 'ส่งไม่สำเร็จ'); }
        clearInterval(timer);
        UI.modal('<h3>📤 ส่งสลิปแล้ว</h3><div class="infobox">เลขอ้างอิง <b>' + esc(O.ref) + '</b><br>ทีมงานจะตรวจสลิปแล้วเติม 💰 ' +
          UI.fmt(O.gold) + ' ทอง<br>ผลการตรวจจะแจ้งใน ✉ ข้อความส่วนตัว</div>' + CB);
      });
    };
  }

  function open(){
    UI.modal('<h3>💳 เติมทอง</h3><p class="stnone">กำลังโหลด…</p>');
    Api.get('/shop', null, false).then(function(r){
      var en = !!(r && r.enabled);
      var h = '<h3>💳 เติมทอง</h3><div class="infobox">' + (en
        ? 'จ่ายด้วย <b>QR พร้อมเพย์</b> แล้วแนบสลิป<br>ทองเข้าหลังทีมงานตรวจสลิป ปกติภายใน 24 ชม.'
        : '🚧 ระบบเติมเงินยังไม่เปิดให้บริการ') + '</div>';
      ((r && r.packages) || []).forEach(function(p){
        h += '<div class="shopc"><b>💰 ' + esc(p.name) + '<i>' + UI.fmt(p.gold) + (p.bonus ? ' + โบนัส ' + UI.fmt(p.bonus) : '') +
          ' ทอง</i></b><span>' + p.price + ' ฿</span>' + (en ? '<button class="mini" data-pk="' + p.id + '">ซื้อ</button>' : '') + '</div>';
      });
      UI.modal(h + '<button class="btn-use2" id="payH">📜 ประวัติการซื้อ</button>' + CB);
      $('payH').onclick = history;
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
      UI.modal('<h3>🧾 ชำระเงิน ' + esc(O.ref) + '</h3><div class="payamt">' + O.price + ' ฿</div>' +
        '<div class="paynote">ได้ 💰 ' + UI.fmt(O.gold) + ' ทอง</div>' +
        (src ? '<img class="payqr" src="' + src + '" alt="QR พร้อมเพย์">' : '<p class="stnone">สร้าง QR ไม่ได้ ลองใหม่อีกครั้ง</p>') +
        (o.name ? '<div class="paynm">ชื่อบัญชีผู้รับ: <b>' + esc(o.name) + '</b></div>' : '') +
        '<div class="payt" id="payT"></div><ol class="paystep"><li>กดค้างที่ QR แล้วบันทึกรูป</li>' +
        '<li>เปิดแอปธนาคาร → สแกน → เลือกรูปจากอัลบั้ม แล้วโอน</li><li>บันทึกสลิป แล้วกลับมาแนบด้านล่าง</li></ol>' +
        slipBox() + '<div class="suphint">ถ้าปิดหน้านี้ไปก่อน แนบสลิปได้ภายหลังที่ 📜 ประวัติการซื้อ (ภายใน 24 ชม.)</div>' + CB);
      clearInterval(timer);
      function tick(){
        var el = $('payT');
        if (!el){ clearInterval(timer); return; }
        var s = (O.expires - tnow()) / 1000;
        el.innerHTML = s > 0 ? '⏱ ชำระภายใน ' + UI.dur(s)
          : '<span class="lack">หมดเวลาสั่งซื้อ · ถ้าโอนแล้ว ยังแนบสลิปได้</span>';
        if (s <= 0) clearInterval(timer);
      }
      tick();
      timer = setInterval(tick, 1000);
      bindSlip(O);
    });
  }

  function slipOnly(o){
    UI.modal('<h3>📎 แนบสลิป ' + esc(o.ref) + '</h3><div class="infobox">💰 ' + UI.fmt(o.gold) + ' ทอง · ยอด ' + o.price + ' ฿</div>' +
      slipBox() + '<button class="btn-use2" id="payBk2">◀ ย้อนกลับ</button>' + CB);
    $('payBk2').onclick = history;
    bindSlip(o);
  }

  function history(){
    UI.modal('<h3>📜 ประวัติการซื้อ</h3><p class="stnone">กำลังโหลด…</p>');
    Api.post('/shop/orders', {}).then(function(r){
      var L = (r && r.orders) || [];
      var h = '<h3>📜 ประวัติการซื้อ</h3>' + (L.length ? L.map(function(o){
        var canSlip = (o.status === 'pending' || o.status === 'expired') && !o.claim_at && tnow() - o.created < 86400000;
        return '<div class="row"><span>' + esc(o.ref) + ' · 💰 ' + UI.fmt(o.gold) + ' · ' + o.price + ' ฿<br><i style="font-size:10px;color:#8a7a55">' +
          new Date(o.created).toLocaleString('th-TH') + '</i></span><b>' + (canSlip
            ? '<button class="mini" data-sl="' + o.id + '">📎 แนบสลิป</button>'
            : (o.status === 'pending' && o.claim_at ? '⏳ กำลังตรวจสลิป' : (ST[o.status] || esc(o.status)))) + '</b></div>';
      }).join('') : '<p class="stnone">ยังไม่มีรายการ</p>');
      UI.modal(h + '<button class="btn-use2" id="payBk">◀ กลับไปหน้าเติมทอง</button>' + CB);
      $('payBk').onclick = open;
      document.querySelectorAll('[data-sl]').forEach(function(b){
        b.onclick = function(){ slipOnly(L.filter(function(o){ return o.id === +b.dataset.sl; })[0]); };
      });
    });
  }
  return { open:open, history:history };
})();