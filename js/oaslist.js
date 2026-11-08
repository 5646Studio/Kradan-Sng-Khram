/* ============ oaslist v15A — ปุ่ม 🌴 โอเอซิสของฉัน + ข้อมูลผู้ครอง (ใช้ร่วมกับ render.js) ============ */
(function(){
  function $(i){ return document.getElementById(i); }
  function esc(s){ return String(s == null ? '' : s).replace(/[<>&"]/g, function(c){
    return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]; }); }
  var RI = { crop:'🌾', wheat:'🌾', food:'🌾', rice:'🌾', wood:'🪵', lumber:'🪵', clay:'🧱', brick:'🧱', iron:'⛏', ore:'⛏', double:'🌾🪵' };

  /* ข้อมูลผู้ครองโอเอซิสทั้งโลก (แคช 60 วิ) — render.js เรียกใช้ด้วย */
  var W = { at:0, ok:false, oa:{}, vn:{} };
  function world(cb){
    if (W.ok && Date.now() - W.at < 60000) return cb();
    Api.get('/world').then(function(r){
      if (r && r.ok){
        W.at = Date.now(); W.ok = true; W.oa = {}; W.vn = {};
        (r.oa || []).forEach(function(o){ W.oa[o.x + ',' + o.y] = o; });
        (r.v || []).forEach(function(v){ W.vn[v.id] = v; });
      }
      cb();
    }, function(){ cb(); });
  }
  window.OasisWho = { world:world, W:W };

  var css = document.createElement('style');
  css.textContent =
    '#zoa{position:relative}#zoa i{position:absolute;top:-4px;right:-4px;background:#ffcf40;color:#2a1d0a;font-style:normal;' +
    'font-size:10px;font-weight:700;border-radius:9px;min-width:16px;height:16px;line-height:16px;text-align:center;padding:0 3px}' +
    '#oaBox{position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center}' +
    '#oaBox .in{width:min(92vw,420px);max-height:70vh;overflow:auto;background:#1e1810;border:1px solid #6a5530;border-radius:14px;padding:12px}' +
    '#oaBox h3{margin:0 0 8px;color:#ffcf40;font-size:16px}' +
    '#oaBox .r{display:flex;align-items:center;gap:10px;padding:9px 8px;border-radius:10px;background:#2a2216;margin:6px 0;cursor:pointer}' +
    '#oaBox .r .ic{font-size:20px;min-width:44px}#oaBox .r span{flex:1;font-size:12.5px;color:#f3e6c8}' +
    '#oaBox .r small{display:block;color:#9a8a6a;font-size:11px}#oaBox .r small.bad{color:#ff8a6a}#oaBox .r b{color:#7fd17f;font-size:13px}' +
    '#oaBox .x{width:100%;margin-top:8px;padding:9px;border:0;border-radius:10px;background:#3a2e1e;color:#e0cfa8;font-size:14px}' +
    '#oaBox .oaX{margin-left:6px;padding:6px 10px;border-radius:8px;background:rgba(160,40,30,.35);color:#ff9a8a;font-size:12px;font-weight:700}';
  document.head.appendChild(css);

  function keys(){
    var K = {};
    Object.keys((window.Game && Game.oasis) || {}).forEach(function(k){ K[k] = 1; });
    (Game.villages || []).forEach(function(v){ (v.oa || []).forEach(function(o){ if (o && o.k) K[o.k] = 1; }); });
    return Object.keys(K);
  }
  function list(){
    var hv = Game.villages && Game.villages[Game.active];
    return keys().map(function(k){
      var p = k.split(','), x = +p[0], y = +p[1], type = '', pct = 0, vn = '', bonus = false;
      /* 1) เมืองที่ได้โบนัสจริง */
      (Game.villages || []).forEach(function(v){
        (v.oa || []).forEach(function(o){ if (o && o.k === k){ vn = v.name; bonus = true; type = o.type; pct = o.pct; } });
      });
      /* 2) ตาราง oasis บนเซิร์ฟเวอร์ · 3) Game.oasis */
      var wo = W.oa[k], gv = Game.oasis && Game.oasis[k];
      var vid = wo ? wo.vid : (gv && typeof gv === 'object' ? gv.vid : gv);
      if (!vn && vid != null) (Game.villages || []).forEach(function(v){ if (String(v.id) === String(vid)) vn = v.name; });
      if (!vn && vid != null && W.vn[vid]) vn = W.vn[vid].vn;
      if (!type || !pct){
        try { var t = World.tile(x, y); if (t && t.oasis){ type = type || t.oasis.type; pct = pct || t.oasis.pct; } } catch(e){}
      }
      var ic = String(type).split(/[_+\-, ]+/).map(function(s){ return RI[s] || ''; }).join('') || '🌴';
      return { x:x, y:y, ic:ic, pct:pct, vn:vn, bonus:bonus || !(Game.villages[0] && 'oa' in Game.villages[0]),
        dist: hv ? Math.round(Math.hypot(x - hv.x, y - hv.y)) : 0 };
    }).sort(function(a, b){ return a.dist - b.dist; });
  }

  function paint(box){
    var L = list();
    box.innerHTML = '<div class="in"><h3>🌴 โอเอซิสของฉัน (' + L.length + ')</h3>' +
      (L.length ? L.map(function(o, i){
        return '<div class="r" data-i="' + i + '"><div class="ic">' + o.ic + '</div><span>(' + o.x + '|' + o.y + ')' +
          '<small>' + (o.vn ? '🏘 ' + esc(o.vn) + ' · ' : '') + '📏 ' + o.dist + ' ช่อง</small>' +
          (o.bonus ? '' : '<small class="bad">⚠ ไม่มีเมืองรับโบนัส</small>') + '</span>' +
          (o.pct ? '<b>+' + o.pct + '%</b>' : '') +
          '<span class="oaX" data-k="' + o.x + ',' + o.y + '">✕ ปล่อย</span></div>';
      }).join('') : '<p style="color:#9a8a6a;font-size:12.5px">ยังไม่มีโอเอซิส · ยึดได้ด้วยวีรบุรุษ + โจมตี</p>') +
      '<button class="x">ปิด</button></div>';
    box._L = L;
  }
  function open(){
    var box = document.createElement('div');
    box.id = 'oaBox';
    box.innerHTML = '<div class="in"><h3>🌴 โอเอซิสของฉัน</h3><p style="color:#9a8a6a">กำลังโหลด…</p></div>';
    document.body.appendChild(box);
    world(function(){ if (box.parentNode) paint(box); });
    box.onclick = function(e){
      if (e.target === box || e.target.classList.contains('x')) return box.remove();
      var xb = e.target.closest('.oaX');
      if (xb){
        var k = xb.dataset.k;
        if (!confirm('ปล่อยโอเอซิส (' + k.replace(',', '|') + ') ?\nโบนัสทรัพยากรจะหายทันที และผู้อื่นยึดต่อได้')) return;
        Api.post('/oasis/release', { k:k }).then(function(r){
          if (!r || !r.ok) return Sync.toast('⚠ ' + ((r && r.err) || 'ปล่อยไม่สำเร็จ'));
          if (Game.oasis) delete Game.oasis[k];
          (Game.villages || []).forEach(function(v){ if (v.oa) v.oa = v.oa.filter(function(o){ return o.k !== k; }); });
          W.at = 0;
          Sync.toast('🌴 ปล่อยโอเอซิสแล้ว');
          try { Sync.cmd('/me', {}, function(){}); } catch(x){}
          world(function(){ if (box.parentNode) paint(box); });
        });
        return;
      }
      var r = e.target.closest('.r');
      if (!r || !box._L) return;
      var o = box._L[+r.dataset.i];
      box.remove();
      Renderer.center(o.x, o.y);
      Renderer.showTile(o.x, o.y);
    };
  }

  function count(){
    var b = $('zoa'); if (!b) return;
    var n = keys().length, i = b.querySelector('i');
    if (i){ i.textContent = n; i.style.display = n ? '' : 'none'; }
  }
  function start(){
    var zo = $('zout');
    if (!zo || !window.Game) return setTimeout(start, 800);
    if ($('zoa')) return;
    var b = document.createElement('button');
    b.id = 'zoa'; b.className = zo.className; b.title = 'โอเอซิสของฉัน';
    b.innerHTML = '🌴<i></i>';
    zo.parentNode.insertBefore(b, zo.nextSibling);
    b.onclick = function(e){ e.stopPropagation(); open(); };
    count(); setInterval(count, 3000);
  }
  start();
})();
