/* ============ oaslist v14Y — ปุ่ม 🌴 ดูโอเอซิสที่ครอง (ใต้ปุ่มซูม) ============ */
(function(){
  function $(i){ return document.getElementById(i); }
  function esc(s){ return String(s == null ? '' : s).replace(/[<>&"]/g, function(c){
    return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]; }); }
  var RI = { crop:'🌾', wheat:'🌾', food:'🌾', rice:'🌾', wood:'🪵', lumber:'🪵', clay:'🧱', brick:'🧱', iron:'⛏', ore:'⛏' };

  var css = document.createElement('style');
  css.textContent =
    '#zoa{position:relative}#zoa i{position:absolute;top:-4px;right:-4px;background:#ffcf40;color:#2a1d0a;font-style:normal;' +
    'font-size:10px;font-weight:700;border-radius:9px;min-width:16px;height:16px;line-height:16px;text-align:center;padding:0 3px}' +
    '#oaBox{position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center}' +
    '#oaBox .in{width:min(92vw,420px);max-height:70vh;overflow:auto;background:#1e1810;border:1px solid #6a5530;border-radius:14px;padding:12px}' +
    '#oaBox h3{margin:0 0 8px;color:#ffcf40;font-size:16px}' +
    '#oaBox .r{display:flex;align-items:center;gap:10px;padding:9px 8px;border-radius:10px;background:#2a2216;margin:6px 0;cursor:pointer}' +
    '#oaBox .r .ic{font-size:20px;min-width:44px}#oaBox .r span{flex:1;font-size:12.5px;color:#f3e6c8}' +
    '#oaBox .r small{display:block;color:#9a8a6a;font-size:11px}#oaBox .r b{color:#7fd17f;font-size:13px}' +
    '#oaBox .x{width:100%;margin-top:8px;padding:9px;border:0;border-radius:10px;background:#3a2e1e;color:#e0cfa8;font-size:14px}';
  document.head.appendChild(css);

  function list(){
    var O = (window.Game && Game.oasis) || {}, hv = Game.villages && Game.villages[Game.active];
    return Object.keys(O).map(function(k){
      var p = k.split(','), x = +p[0], y = +p[1], val = O[k], o = null;
      try { var t = (window.World && World.tile) ? World.tile(x, y) : null; o = t && t.oasis; } catch(e){}
      var d = (val && typeof val === 'object') ? val : {};
      var type = String(d.type || (o && o.type) || ''), pct = d.pct || (o && o.pct) || 0;
      var vid = d.vid != null ? d.vid : ((typeof val === 'string' || typeof val === 'number') ? val : null), vn = '';
      (Game.villages || []).forEach(function(v){ if (vid != null && String(v.id) === String(vid)) vn = v.name; });
      var ic = type.split(/[_+\-, ]+/).map(function(s){ return RI[s] || ''; }).join('') || '🌴';
      return { x:x, y:y, ic:ic, pct:pct, vn:vn, dist: hv ? Math.round(Math.hypot(x - hv.x, y - hv.y)) : 0 };
    }).sort(function(a, b){ return a.dist - b.dist; });
  }

  function open(){
    var L = list(), box = document.createElement('div');
    box.id = 'oaBox';
    box.innerHTML = '<div class="in"><h3>🌴 โอเอซิสของฉัน (' + L.length + ')</h3>' +
      (L.length ? L.map(function(o, i){
        return '<div class="r" data-i="' + i + '"><div class="ic">' + o.ic + '</div><span>(' + o.x + '|' + o.y + ')' +
          '<small>' + (o.vn ? '🏘 ' + esc(o.vn) + ' · ' : '') + '📏 ' + o.dist + ' ช่อง</small></span>' +
          (o.pct ? '<b>+' + o.pct + '%</b>' : '') + '</div>';
      }).join('') : '<p style="color:#9a8a6a;font-size:12.5px">ยังไม่มีโอเอซิส · ยึดได้ด้วยวีรบุรุษ + โจมตี</p>') +
      '<button class="x">ปิด</button></div>';
    document.body.appendChild(box);
    box.onclick = function(e){
      if (e.target === box || e.target.classList.contains('x')) return box.remove();
      var r = e.target.closest('.r');
      if (!r) return;
      var o = L[+r.dataset.i];
      box.remove();
      Renderer.center(o.x, o.y);
      Renderer.showTile(o.x, o.y);
    };
  }

  function count(){
    var b = $('zoa'); if (!b) return;
    var n = Object.keys((window.Game && Game.oasis) || {}).length, i = b.querySelector('i');
    if (i) i.textContent = n; i.style.display = n ? '' : 'none';
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