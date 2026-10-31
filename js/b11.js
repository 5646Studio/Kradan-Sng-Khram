/* ============ B11 v14R — รื้อถอน · ย้ายอาคาร ============ */
var BldTool = (function(){
  var L = null, CB = '<button class="btn-cancel" onclick="UI.close()">ปิด</button>';
  function esc(s){ return String(s == null ? '' : s).replace(/[<>&"]/g, function(c){
    return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]; }); }
  function $(i){ return document.getElementById(i); }
  function online(){ return typeof Sync !== 'undefined' && Sync.online && Sync.online(); }
  function blist(){
    if (L) return L;
    L = (typeof BUILDINGS !== 'undefined' ? BUILDINGS : []).filter(function(b){ return b && b.key && b.name && b.key !== 'wall'; })
      .slice().sort(function(a, b){ return b.name.length - a.name.length; });
    return L;
  }
  function match(t){ var a = blist(); for (var i = 0; i < a.length; i++) if (t.indexOf(a[i].name) >= 0) return a[i]; return null; }
  function ck(c){ return c && c.b && typeof BUILDINGS !== 'undefined' && BUILDINGS[c.b] ? BUILDINGS[c.b].key : null; }
  function bname(k){ var a = blist(); for (var i = 0; i < a.length; i++) if (a[i].key === k) return a[i].name; return k; }
  function dsec(lv){ return Math.max(30, Math.round(120 * Math.pow(lv, 1.25) / CFG.SPEED)); }
  function total(lv){ var s = 0; for (var l = lv; l >= 1; l--) s += dsec(l); return s; }
  function slotsOf(v, k){ var r = []; (v.city || []).forEach(function(c, i){ if (c && ck(c) === k && c.level > 0) r.push(i); }); return r; }
  function empties(v){ var r = []; (v.city || []).forEach(function(c, i){ if (!c || !c.b) r.push(i); }); return r; }
  function cmd(p, body, cb){ body.vid = V().id; Sync.cmd('/bld/' + p, body, function(r){ if (r && r.ok && cb) cb(r); }); }

  function open(k, lv){
    var v = V(), S = slotsOf(v, k);
    if (lv){ var f = S.filter(function(i){ return v.city[i].level === lv; }); if (f.length) S = f; }
    if (!S.length) return;
    if (S.length === 1) return manage(S[0]);
    UI.modal('<h3>🛠 เลือก' + esc(bname(k)) + '</h3>' + S.map(function(i){
      return '<button class="btn-use2" data-pk="' + i + '">ช่อง ' + (i + 1) + ' · Lv.' + v.city[i].level + '</button>';
    }).join('') + CB);
    document.querySelectorAll('[data-pk]').forEach(function(b){ b.onclick = function(){ manage(+b.dataset.pk); }; });
  }

  function manage(s){
    var v = V(), c = v.city[s], dm = v.srvDemo, E = empties(v), t0 = now();
    if (!c || !c.b){ UI.close(); return; }
    var h = '<h3>🛠 ' + esc(bname(ck(c))) + ' Lv.' + c.level + '</h3><div class="rbar"><span>ช่อง ' + (s + 1) + '</span><b>' + esc(v.name) + '</b></div>';
    if (dm && dm.slot === s){
      h += '<div class="dgrun">🔨 กำลังรื้อถอน · Lv.' + c.level + ' → ' + (c.level - 1) + ' ในอีก ' + UI.dur((dm.next - t0) / 1000) +
        '<br>หายไปทั้งหมดในอีก <b>' + UI.dur((dm.end - t0) / 1000) + '</b></div>' +
        '<button class="btn-rush" id="dmRush">⚡ รื้อเสร็จทันที 💰' + goldRush(Math.max(1, (dm.end - t0) / 1000)) + '</button>' +
        '<button class="btn-del" id="dmStop">✕ หยุดรื้อถอน</button>';
    } else {
      var main = ck(c) === 'main', other = !!dm;
      h += '<h4>🔨 รื้อถอน</h4><div class="infobox">ลดระดับทีละ 1 จนถึง Lv.0 แล้วช่องกลับเป็นช่องว่าง<br>ใช้เวลารวม <b>' +
        UI.dur(total(c.level)) + '</b> · ไม่คืนทรัพยากร<br><span style="font-size:10.5px">ประชากร CP และความจุที่ได้จากอาคารนี้ลดลงตามระดับ</span></div>' +
        '<button class="btn-del" id="dmGo"' + (main || other ? ' disabled' : '') + '>🔨 เริ่มรื้อถอน' +
        (main ? ' (อาคารหลักรื้อไม่ได้)' : other ? ' (มีอาคาร' + esc(bname(dm.k)) + 'กำลังรื้ออยู่)' : '') + '</button>' +
        '<h4>↔ ย้ายอาคาร</h4><div class="infobox">ย้ายไปช่องว่างได้ทันที ฟรี ระดับเท่าเดิม</div>' +
        '<button class="btn-use" id="mvGo"' + (E.length ? '' : ' disabled') + '>↔ เลือกช่องปลายทาง' +
        (E.length ? ' (ว่าง ' + E.length + ' ช่อง)' : ' (ไม่มีช่องว่าง)') + '</button>';
    }
    UI.modal(h + CB);
    var a = $('dmGo'), b = $('mvGo'), r = $('dmRush'), x = $('dmStop');
    if (a) a.onclick = function(){
      if (!confirm('รื้อถอน' + bname(ck(c)) + ' Lv.' + c.level + ' จนหมด?\nใช้เวลา ' + UI.dur(total(c.level)) + ' และไม่คืนทรัพยากร')) return;
      a.disabled = true;
      cmd('demolish', { slot:s }, function(){ UI.close(); Sync.toast('🔨 เริ่มรื้อถอนแล้ว · ดูสถานะได้ที่ปุ่ม 🛠 ในหน้าอาคาร'); });
    };
    if (b) b.onclick = function(){ pickMove(s); };
    if (r) r.onclick = function(){ r.disabled = true; cmd('rush', { slot:s }, function(){ UI.close(); Sync.toast('🔨 รื้อถอนเสร็จแล้ว ช่องว่างพร้อมสร้างใหม่'); }); };
    if (x) x.onclick = function(){
      if (!confirm('หยุดรื้อถอน? ระดับที่ลดไปแล้วจะไม่คืน')) return;
      cmd('stop', { slot:s }, function(){ UI.close(); Sync.toast('✕ หยุดรื้อถอนแล้ว'); });
    };
  }

  function pickMove(s){
    var v = V(), E = empties(v), c = v.city[s];
    UI.modal('<h3>↔ ย้าย' + esc(bname(ck(c))) + ' Lv.' + c.level + '</h3><div class="infobox">ตอนนี้อยู่ช่อง ' + (s + 1) +
      ' · เลือกช่องว่างปลายทาง</div><div class="mvgrid">' + E.map(function(i){
        return '<button data-mv="' + i + '">ช่อง ' + (i + 1) + '</button>'; }).join('') +
      '</div><button class="btn-use2" id="mvBk">◀ ย้อนกลับ</button>' + CB);
    $('mvBk').onclick = function(){ manage(s); };
    document.querySelectorAll('[data-mv]').forEach(function(b){
      b.onclick = function(){
        var to = +b.dataset.mv;
        b.disabled = true;
        cmd('move', { slot:s, to:to }, function(){ UI.close(); Sync.toast('↔ ย้ายไปช่อง ' + (to + 1) + ' แล้ว'); });
      };
    });
  }

  /* ใส่ปุ่ม 🛠 ในหน้าอาคาร */
  function inj(){
    var mb = $('modalbox');
    if (!mb || !online() || mb.querySelector('#dmBtn') || mb.querySelector('#hroot')) return;
    var h3 = mb.querySelector('h3');
    if (!h3) return;
    var tx = h3.textContent || '';
    if (/เลือก|🛠|↔|—/.test(tx)) return;
    var B = match(tx), v = V();
    if (!B || !v || !slotsOf(v, B.key).length) return;
    var cb = mb.querySelectorAll('.btn-cancel');
    cb = cb[cb.length - 1];
    if (!cb) return;
    var m = /Lv\.?\s*(\d+)/.exec(tx), dm = v.srvDemo;
    var bt = document.createElement('button');
    bt.id = 'dmBtn'; bt.className = 'btn-use2';
    bt.textContent = '🛠 รื้อถอน / ย้ายอาคาร' + (dm && dm.k === B.key ? ' · 🔨 กำลังรื้อ' : '');
    bt.onclick = function(){ open(B.key, m ? +m[1] : 0); };
    cb.parentNode.insertBefore(bt, cb);
  }
  var q = false, mb0 = $('modalbox');
  if (mb0 && typeof MutationObserver !== 'undefined')
    new MutationObserver(function(){
      if (q) return;
      q = true;
      requestAnimationFrame(function(){ q = false; try { inj(); } catch(e){} });
    }).observe(mb0, { childList:true, subtree:true });
  return { open:open, manage:manage };
})();
