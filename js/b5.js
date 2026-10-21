/* ============ B5 v14g — กองประจำการ / เสริมทัพ (ออนไลน์) ============ */
var B5 = (function(){
  var L = { mine:[], hosted:[] };
  function esc(s){ return String(s == null ? '' : s).replace(/[<>&"]/g, function(c){
    return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]; }); }
  function cnt(t){ var c = 0; for (var k in (t || {})) c += t[k] | 0; return c; }
  function dots(u, m){ var s = ''; for (var i = 0; i < m; i++) s += '<em class="' + (i < u ? 'used' : '') + '"></em>'; return s; }
  function find(id){ return L.mine.concat(L.hosted).filter(function(s){ return s.id === id; })[0]; }
  function closeBtn(){ return '<button class="btn-cancel" onclick="UI.close()">ปิด</button>'; }

  function card(s, mine){
    var left = s.quota - s.raids, c = cnt(s.troops), canRaid = (mine || s.cmd) && left > 0 && c > 0;
    return '<div class="stcard' + (mine ? '' : ' ally') + '"><div class="vh"><b>' +
      (mine ? (s.own ? '🏘 ' : '🏯 ') + esc(s.hostName) + (s.own ? '' : ' · ' + esc(s.hostPlayer))
            : 'จาก ' + esc(s.ownerName) + ' · ' + esc(s.ownerVill)) +
      '</b><span>(' + s.x + '|' + s.y + ')</span></div>' +
      '<div class="stline">' + (c ? War.troopLine(s.troops) : 'ทหารออกรบอยู่ทั้งหมด') + '</div>' +
      '<div class="stbar"><i>⚔ โควตา</i><span class="stdots">' + dots(s.raids, s.quota) + '</span><b style="color:' +
      (left ? '#8fbf5f' : '#ff6b6b') + '">เหลือ ' + left + '/' + s.quota + '</b></div><div class="grow2">' +
      (canRaid ? '<button class="btn-use mini2" data-sr="' + s.id + '">⚔ ออกรบจากที่นี่</button>' : '') +
      (mine && c ? '<button class="btn-del mini2" data-sb="' + s.id + '">↩ เรียกกลับ</button>' : '') + '</div>' +
      (mine && !s.own ? '<label class="misr" style="margin-top:6px"><input type="checkbox" data-sc="' + s.id + '"' +
        (s.cmd ? ' checked' : '') + '><span>🤝 ให้เจ้าของเมืองสั่งกองนี้ได้</span></label>' : '') +
      (!mine && s.cmd ? '<div class="suphint">เจ้าของทหารอนุญาตให้คุณสั่งการได้</div>' : '') + '</div>';
  }

  function open(){
    UI.modal('<h3>🛡 กองประจำการ</h3><p class="stnone">กำลังโหลด…</p>');
    Api.post('/station/list', {}).then(function(r){
      if (!r.ok) return UI.modal('<h3>🛡 กองประจำการ</h3><p class="stnone">' + esc(r.err || 'โหลดไม่สำเร็จ') + '</p>' + closeBtn());
      L = r;
      var h = '<h3>🛡 กองประจำการ</h3><div class="infobox">ทหารที่ส่งไปเสริมยังกินเสบียงจากเมืองต้นทาง<br>' +
        'แต่ละกองออกรบจากฐานได้ <b>3 ครั้ง</b> ครบแล้วเดินกลับเมืองเอง</div>' +
        '<h4>🛡 ทหารของเราที่อยู่ที่อื่น (' + r.mine.length + ')</h4>' +
        (r.mine.length ? r.mine.map(function(s){ return card(s, true); }).join('')
          : '<p class="stnone">ยังไม่มี — ส่งทัพด้วยภารกิจ 🛡️ เสริมทัพ</p>') +
        '<h4>🤝 กำลังหนุนในเมืองของเรา (' + r.hosted.length + ')</h4>' +
        (r.hosted.length ? r.hosted.map(function(s){ return card(s, false); }).join('')
          : '<p class="stnone">ยังไม่มีใครส่งกำลังหนุนมา</p>') +
        '<button class="btn-ok" id="stNew">🛡 ส่งเสริมทัพ</button>' + closeBtn();
      UI.modal(h);
      document.getElementById('stNew').onclick = function(){ War.openSend(); };
      document.querySelectorAll('[data-sr]').forEach(function(b){ b.onclick = function(){ B5.openRaid(find(+b.dataset.sr)); };
 });
      document.querySelectorAll('[data-sb]').forEach(function(b){
        b.onclick = function(){
          if (!confirm('เรียกทหารกองนี้กลับเมือง?')) return;
          b.disabled = true;
          Api.post('/station/recall', { id:+b.dataset.sb }).then(function(x){
            if (!x.ok){ b.disabled = false; return alert(x.err); }
            Sync.toast('↩ ทหารกำลังเดินทางกลับ'); Sync.poll(true); open();
          });
        };
      });
      document.querySelectorAll('[data-sc]').forEach(function(c){
        c.onchange = function(){
          Api.post('/station/cmd', { id:+c.dataset.sc, on:c.checked }).then(function(x){
            if (!x.ok){ c.checked = !c.checked; alert(x.err); }
          });
        };
      });
    });
  }

  function openRaid(s){
    if (!s) return;
    var ks = Object.keys(s.troops).filter(function(k){ return s.troops[k] > 0; }), left = s.quota - s.raids;
    var h = '<h3>⚔ ออกรบจาก ' + esc(s.hostName) + '</h3><div class="infobox">ฐาน (' + s.x + '|' + s.y + ') · โควตาเหลือ <b>' +
      left + '/' + s.quota + '</b><br>' + (left === 1
        ? '⚠ <b>ครั้งสุดท้าย</b> — หลังรบทหารเดินกลับ ' + esc(s.ownerVill) + ' ทันที และทหารที่เหลือในฐานจะกลับด้วย'
        : 'ชนะแล้วทหารที่รอดกลับมาประจำที่ฐานเดิม') +
      '<br>ของที่ปล้นได้เข้าเมือง <b>' + esc(s.own ? s.hostName : s.ownerVill) + '</b></div><div class="tgrid2">';
    ks.forEach(function(k){
      var u = War.unit(k);
      h += '<div class="tcell"><span class="tic">' + War.icon(u) + '</span><input type="number" min="0" value="0" id="sr_' + k +
        '"><b class="thave" data-sa="' + k + '" data-n="' + s.troops[k] + '">/' + s.troops[k] + '</b></div>';
    });
    h += '</div><div class="destbox"><div class="drow2"><label>X</label><input type="number" id="srx" value="' + s.x +
      '"><label>Y</label><input type="number" id="sry" value="' + s.y + '"></div></div><div class="misrow2">' +
      '<label class="misr"><input type="radio" name="srm" value="raid" checked><span>💰 ปล้น</span></label>' +
      '<label class="misr"><input type="radio" name="srm" value="attack"><span>⚔️ โจมตี</span></label>' +
      '<label class="misr"><input type="radio" name="srm" value="scout"><span>👁️ สอดแนม</span></label></div>' +
      '<button class="btn-ok" id="srGo">⚔ ส่งออกรบ (ใช้ 1 ครั้ง)</button><button class="btn-cancel" id="srBk">ย้อนกลับ</button>';
    UI.modal(h);
    document.getElementById('srBk').onclick = open;
    document.querySelectorAll('[data-sa]').forEach(function(b){
      b.onclick = function(){ document.getElementById('sr_' + b.dataset.sa).value = b.dataset.n; };
    });
    document.getElementById('srGo').onclick = function(){
      var t = {}, n = 0, btn = this;
      ks.forEach(function(k){ var c = parseInt(document.getElementById('sr_' + k).value, 10) || 0; if (c > 0){ t[k] = c; n += c; } });
      if (!n) return alert('ยังไม่ได้เลือกทหาร');
      btn.disabled = true;
      Api.post('/station/raid', { id:s.id, tx:parseInt(document.getElementById('srx').value, 10),
        ty:parseInt(document.getElementById('sry').value, 10),
        mission:document.querySelector('input[name=srm]:checked').value, troops:t }).then(function(r){
        btn.disabled = false;
        if (!r.ok) return alert(r.err || 'ส่งไม่สำเร็จ');
        Sync.toast(r.last ? '⚔ ครั้งสุดท้าย — กองนี้จะกลับเมืองหลังรบ' : '⚔ ส่งกองทัพออกจากฐานแล้ว');
        Sync.poll(true); open();
      });
    };
  }

  return { open:open, openRaid:openRaid };
})();