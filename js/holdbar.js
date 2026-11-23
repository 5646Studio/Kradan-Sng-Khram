/* ============ holdbar.js v15I — แถบนับถอยหลังผู้ครองเมืองหลวง ============
   - ดึง /season ทุก 5 นาที (หยุดตอนซ่อนหน้าจอ) แล้วนับถอยหลังเองในเครื่อง ไม่มีการเขียนฐานข้อมูล
   - กด ✕ ปิดได้ จนกว่าจะเปิดเกมใหม่ (ไม่จำค่าไว้) หรือมีผู้ครองคนใหม่ จึงจะเด้งขึ้นอีก
   ======================================================================== */
(function(){
  var POLL_MS = 5 * 60000, st = null, off = 0, closedKey = null, bar = null, tm = null, pv = null;

  function two(n){ return n < 10 ? '0' + n : '' + n; }
  function esc(s){ return String(s == null ? '' : s).replace(/[<>&"]/g, function(c){ return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]; }); }

  var css = document.createElement('style');
  css.textContent =
    '#hbar{position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 4px);transform:translateX(-50%);z-index:900;max-width:94vw;' +
    'display:none;align-items:center;gap:8px;padding:5px 6px 5px 12px;border-radius:16px;background:rgba(24,16,6,.88);' +
    'border:1px solid #c9a24a;box-shadow:0 2px 10px rgba(0,0,0,.5);color:#f3e6c8;font-size:11.5px;line-height:1.35;white-space:nowrap}' +
    '#hbar b{color:#ffcf40}#hbar .t{font-variant-numeric:tabular-nums;color:#ffdf70;font-weight:700}' +
    '#hbar .n{overflow:hidden;text-overflow:ellipsis;max-width:34vw}' +
    '#hbar .x{width:24px;height:24px;border-radius:12px;border:0;background:#3a2a12;color:#e0cfa8;font-size:12px;cursor:pointer;flex:0 0 24px;padding:0}';
  document.head.appendChild(css);

  function ensure(){
    if (bar) return bar;
    bar = document.createElement('div'); bar.id = 'hbar';
    bar.innerHTML = '<span>👑 <span class="n"></span> ครองนครหลวง · เหลือ <span class="t"></span></span><button class="x" aria-label="ปิด">✕</button>';
    bar.querySelector('.x').onclick = function(e){ e.stopPropagation(); closedKey = st && st.key; bar.style.display = 'none'; };
    document.body.appendChild(bar);
    return bar;
  }

  function tick(){
    if (!st) return;
    var b = ensure();
    if (closedKey === st.key){ b.style.display = 'none'; return; }
    var left = st.end - (Date.now() + off);
    var t = b.querySelector('.t');
    if (left <= 0) t.textContent = 'ใกล้ประกาศผู้ชนะ…';
    else {
      var s = Math.floor(left / 1000), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
      t.textContent = (d ? d + ' วัน ' : '') + two(h) + ':' + two(m) + ':' + two(x);
    }
    b.style.display = 'flex';
  }

  function apply(r){
    if (!r || !r.ok || r.winner || r.over || !r.holder || !r.holdSince || !r.hold){ st = null; if (bar) bar.style.display = 'none'; return; }
    off = (r.now || Date.now()) - Date.now();
    st = { key:r.holder + '|' + r.holdSince, end:r.holdSince + r.hold * 86400000 };
    ensure().querySelector('.n').textContent = r.holderName || '?';
    tick();
  }

  function poll(){
    if (document.hidden || typeof Api === 'undefined' || !Api.get) return;
    try { Api.get('/season').then(apply, function(){}); } catch (e){}
  }

  function start(){
    poll();
    setInterval(poll, POLL_MS);
    setInterval(tick, 1000);
    document.addEventListener('visibilitychange', function(){ if (!document.hidden) poll(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(start, 1500); });
  else setTimeout(start, 1500);
})();
