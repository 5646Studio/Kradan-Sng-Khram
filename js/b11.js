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
  function empties(v){ var r = []; (v.city || []).forEach(function(c, i){ if (!ck(c)) r.push(i); }); return r; }
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
    if (!ck(c)){ UI.close(); return; }
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

    /* v14X — เลือกช่องปลายทางในหน้าเมือง */
  var MV = null, mvT = null;
  (function(){
    var st = document.createElement('style');
    st.textContent =
      'body.mvmode .slot.empty{outline:3px dashed #ffcf40;outline-offset:2px;border-radius:50%;animation:mvp .9s infinite alternate}' +
      '@keyframes mvp{from{box-shadow:0 0 0 0 rgba(255,207,64,.7)}to{box-shadow:0 0 16px 6px rgba(255,207,64,.45)}}' +
      'body.mvmode .slot:not(.empty){opacity:.45}' +
      'body.mvmode .slot.mvsrc{opacity:1;outline:3px solid #7fd17f;outline-offset:2px}' +
      '#mvBar{position:fixed;left:50%;transform:translateX(-50%);bottom:96px;z-index:9999;max-width:92vw;background:#2a2216;' +
      'border:1px solid #ffcf40;border-radius:12px;padding:8px 12px;display:flex;gap:10px;align-items:center;font-size:13px;' +
      'color:#f3e6c8;box-shadow:0 4px 18px rgba(0,0,0,.6)}' +
      '#mvBar button{background:#6a2020;color:#fff;border:0;border-radius:8px;padding:6px 12px;font-size:13px}';
    document.head.appendChild(st);
  })();
  function mvEnd(){
    MV = null; clearInterval(mvT);
    document.body.classList.remove('mvmode');
    var b = $('mvBar'); if (b) b.remove();
  }
  function mvMark(){
    if (!MV) return;
    if (V().id !== MV.vid) return mvEnd();            /* สลับเมือง → ยกเลิก */
    var n = document.querySelector('.slot[data-c="' + MV.s + '"]');
    if (n && !n.classList.contains('mvsrc')) n.classList.add('mvsrc');
  }
  function pickMove(s){
    var v = V(), c = v.city[s];
    if (!empties(v).length) return Sync.toast('ไม่มีช่องว่างในเมืองนี้');
    UI.close();
    MV = { s:s, vid:v.id, nm:bname(ck(c)) + ' Lv.' + c.level };
    document.body.classList.add('mvmode');
    var bar = document.createElement('div'); bar.id = 'mvBar';
    bar.innerHTML = '<span>↔ แตะช่องว่าง (กรอบสีทอง) เพื่อย้าย <b>' + esc(MV.nm) + '</b></span><button id="mvX">ยกเลิก</button>';
    document.body.appendChild(bar);
    $('mvX').onclick = function(e){ e.stopPropagation(); mvEnd(); };
    mvMark();
    mvT = setInterval(mvMark, 400);                   /* หน้าเมืองวาดใหม่เรื่อย ๆ → ทำเครื่องหมายซ้ำ */
  }
  /* ดักการแตะช่องก่อนที่หน้าเมืองจะเปิดหน้าต่างอาคาร */
  document.addEventListener('click', function(e){
    if (!MV) return;
    var n = e.target.closest && e.target.closest('.slot[data-c]');
    if (!n) return;
    e.stopPropagation(); e.preventDefault();
    var to = +n.dataset.c, s = MV.s;
    if (to === s) return mvEnd();
    if (empties(V()).indexOf(to) < 0) return Sync.toast('เลือกได้เฉพาะช่องว่าง (กรอบสีทอง)');
    if (!confirm('ย้าย ' + MV.nm + '\nจากช่อง ' + (s + 1) + ' → ช่อง ' + (to + 1) + ' ?')) return;
    mvEnd();
    cmd('move', { slot:s, to:to }, function(){ Sync.toast('↔ ย้ายไปช่อง ' + (to + 1) + ' แล้ว'); });
  }, true);

  /* ใส่ปุ่ม 🛠 ในหน้าอาคาร */
  function inj(){
    var mb = $('modalbox');
    if (!mb || !online() || mb.querySelector('#dmBtn') || mb.querySelector('#hroot')) return;
    var h3 = mb.querySelector('h3');
    if (!h3) return;
    var tx = I18N.src(h3) || '';
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