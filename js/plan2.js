/* ============ plan2 v15I — แผนการรบจากกองเสริมทัพ + ค้นหาโอเอซิส 30 ช่อง ============ */
(function(){
  function $(i){ return document.getElementById(i); }
  function esc(s){ return String(s == null ? '' : s).replace(/[<>&"]/g, function(c){
    return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]; }); }
  function toast(s){ if (window.Sync && Sync.toast) Sync.toast(s); }
  var RI = { crop:'🌾', wheat:'🌾', food:'🌾', rice:'🌾', wood:'🪵', lumber:'🪵', clay:'🧱', brick:'🧱', iron:'⛏', ore:'⛏', double:'🌾🪵' };
  var TF = { crop:/crop|wheat|food|rice|double/, wood:/wood|lumber|double/, clay:/clay|brick/, iron:/iron|ore/ };
  var MIS = { attack:'⚔ โจมตี', raid:'💰 ปล้น', scout:'👁 สอดแนม' };
  function ic(t){ return String(t || '').split(/[_+\-, ]+/).map(function(s){ return RI[s] || ''; }).join('') || '🌴'; }
  function V(){ return Game.villages && Game.villages[Game.active]; }
  function dl(t){ return new Date(t - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16); }
  function when(t){ return new Date(t).toLocaleString('th-TH', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }); }
  function tline(o){ return window.War && War.troopLine ? War.troopLine(o) : Object.keys(o).map(function(k){ return k + ' ' + o[k]; }).join(' · '); }

  var css = document.createElement('style');
  css.textContent =
    '.p2w{position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,.6);display:flex;align-items:flex-end;justify-content:center}' +
    '.p2w.of{z-index:9999}' +
    '.p2w .in{width:min(100vw,460px);max-height:90vh;overflow:auto;background:linear-gradient(#241b10,#15100a);border:2px solid #c9a24a;' +
    'border-bottom:0;border-radius:18px 18px 0 0;padding:14px 14px 18px;color:#f3e6c8}' +
    '@media(min-width:700px){.p2w{align-items:center}.p2w .in{border-bottom:2px solid #c9a24a;border-radius:18px}}' +
    '.p2w h3{margin:0 0 6px;color:#ffcf40;font-size:17px}.p2w label{display:block;margin:10px 0 4px;font-size:12px;color:#c9a24a;font-weight:700}' +
    '.p2w input,.p2w select{width:100%;box-sizing:border-box;padding:10px 12px;background:#17120b;border:1px solid #4a3a22;border-radius:10px;color:#f3e6c8;font-size:14px}' +
    '.p2xy{display:grid;grid-template-columns:1fr 1fr auto;gap:6px}.p2xy button{padding:0 12px;border-radius:10px;border:1px solid #c9a24a;background:#3a2c14;color:#ffcf40;font-weight:700}' +
    '.p2r{display:flex;align-items:center;gap:8px;margin:5px 0}.p2r span{flex:1;font-size:13px}.p2r input{width:84px}' +
    '.p2r b{font-size:11px;color:#c9a24a;cursor:pointer;padding:6px}.p2q{display:flex;gap:6px;margin-top:6px;flex-wrap:wrap}' +
    '.p2q span,.p2c span{padding:6px 11px;border-radius:14px;background:#2a2016;border:1px solid #4a3a22;font-size:12px;color:#c9b48a;cursor:pointer}' +
    '.p2c{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0}.p2c span.on{background:#5a4a1e;border-color:#c9a24a;color:#ffdf70}' +
    '.p2ok{width:100%;margin-top:14px;padding:12px;border:0;border-radius:12px;background:linear-gradient(#6a8f34,#4a6a22);color:#fff;font-size:15px;font-weight:700}' +
    '.p2x{width:100%;margin-top:8px;padding:10px;border:1px solid #6a5530;border-radius:12px;background:#2a2016;color:#e0cfa8;font-size:14px}' +
    '.p2n{font-size:11.5px;color:#9a8a6a;margin:2px 0}.p2pl{display:flex;align-items:center;gap:8px;padding:8px;margin:5px 0;border-radius:10px;background:#2a2216;font-size:12.5px}' +
    '.p2pl span{flex:1}.p2pl b{color:#ff8a6a;cursor:pointer;padding:4px 8px}' +
    '.p2o{display:flex;align-items:center;gap:10px;padding:9px 8px;border-radius:10px;background:#2a2216;margin:6px 0}' +
    '.p2o .ic{font-size:19px;min-width:40px}.p2o span{flex:1;font-size:12.5px}.p2o small{display:block;font-size:11px;color:#9a8a6a}' +
    '.p2o small.mine{color:#7fd17f}.p2o small.tk{color:#ff9a7a}.p2o em{font-style:normal;padding:7px 10px;border-radius:9px;background:#3a2c14;color:#ffcf40;cursor:pointer;font-size:13px}' +
    '#zof{position:relative}';
  document.head.appendChild(css);

  /* ---------- สิทธิ์แผนการรบ ---------- */
  var SCH = { until:0, at:0, list:[] };
  function active(){ return SCH.until > Date.now(); }
  function loadSch(cb, force){
    if (!force && Date.now() - SCH.at < 60000) return cb && cb();
    Api.post('/plan/list', {}).then(function(r){
      if (r && r.ok){ SCH.until = r.until || 0; SCH.list = r.list || []; SCH.at = Date.now(); }
      if (cb) cb();
    }, function(){ if (cb) cb(); });
  }
  function wrap(cls){
    var w = document.createElement('div'); w.className = 'p2w' + (cls ? ' ' + cls : '');
    w.innerHTML = '<div class="in"><p class="p2n">กำลังโหลด…</p></div>';
    document.body.appendChild(w);
    w.addEventListener('click', function(e){ if (e.target === w || e.target.classList.contains('p2x')) w.remove(); });
    return w;
  }

  /* ---------- ⏰ ตั้งแผน ---------- */
  function open(o){
    o = o || {};
    var v = V(); if (!v) return;
    var w = wrap(), ST = [], wait = 2;
    loadSch(done, true);
    Api.post('/station/list', {}).then(function(r){
      if (r && r.ok){
        ST = (r.mine || []).filter(function(s){ return s.raids < s.quota; })
          .concat((r.hosted || []).filter(function(s){ return s.cmd && s.raids < s.quota; }).map(function(s){ s.ally = 1; return s; }));
      }
      done();
    }, done);
    function done(){ if (--wait) return; paint(); }
    function src(){ var id = +$('p2S').value; return id ? ST.filter(function(s){ return s.id === id; })[0] : null; }
    function paint(){
      var box = w.querySelector('.in');
      if (!active()){
        box.innerHTML = '<h3>⏰ แผนการรบ</h3><p class="p2n">ต้องซื้อสิทธิ์แผนการรบก่อน (7 วัน) จากร้านค้า</p><button class="p2x">ปิด</button>';
        return;
      }
      var opt = '<option value="0">🏠 ทหารในเมือง ' + esc(v.name) + '</option>' + ST.map(function(s){
        return '<option value="' + s.id + '"' + (s.id === o.st ? ' selected' : '') + '>' + (s.ally
          ? '🤝 กอง ' + esc(s.ownerName) + ' ที่ ' + esc(s.hostName)
          : '🛡 กอง ' + (s.no || 1) + ' · ' + esc(s.hostName) + ' (' + s.x + '|' + s.y + ')') +
          ' · โควตา ' + (s.quota - s.raids) + '/' + s.quota + '</option>';
      }).join('');
      box.innerHTML = '<h3>⏰ ตั้งแผนการรบ</h3><p class="p2n">สิทธิ์ใช้ได้ถึง ' + when(SCH.until) + '</p>' +
        '<label>ส่งจาก</label><select id="p2S">' + opt + '</select>' +
        '<label>ภารกิจ</label><select id="p2M">' + Object.keys(MIS).map(function(k){ return '<option value="' + k + '">' + MIS[k] + '</option>'; }).join('') + '</select>' +
        '<label>เป้าหมาย</label><div class="p2xy"><input id="p2X" type="number" placeholder="X"><input id="p2Y" type="number" placeholder="Y">' +
        '<button id="p2O">🔍 โอเอซิส</button></div>' +
        '<label>ทหาร</label><div id="p2T"></div>' +
        '<label>เวลาออกเดินทาง</label><input id="p2W" type="datetime-local">' +
        '<div class="p2q"><span data-q="5">+5 นาที</span><span data-q="30">+30 นาที</span><span data-q="60">+1 ชม.</span><span data-q="360">+6 ชม.</span></div>' +
        '<button class="p2ok" id="p2Go">⏰ บันทึกแผน</button><label>แผนที่ตั้งไว้</label><div id="p2L"></div><button class="p2x">ปิด</button>';
      if (o.tx != null){ $('p2X').value = o.tx; $('p2Y').value = o.ty; }
      $('p2W').value = dl(Date.now() + 10 * 60000);
      troops(); list();
      $('p2S').onchange = troops;
      $('p2O').onclick = function(){ find(function(x, y){ $('p2X').value = x; $('p2Y').value = y; }); };
      w.querySelector('.p2q').onclick = function(e){
        var q = e.target.dataset && e.target.dataset.q; if (!q) return;
        var b = new Date($('p2W').value).getTime() || Date.now();
        $('p2W').value = dl(Math.max(b, Date.now()) + q * 60000);
      };
      $('p2T').onclick = function(e){
        var k = e.target.dataset && e.target.dataset.all; if (!k) return;
        var i = w.querySelector('[data-u="' + k + '"]'); if (i) i.value = i.max;
      };
      $('p2Go').onclick = save;
    }
    function troops(){
      var s = src(), T = s ? s.troops : (v.troops || {}), h = '';
      Object.keys(T).forEach(function(k){
        var n = T[k] | 0; if (n <= 0) return;
        var one = {}; one[k] = n;
        h += '<div class="p2r"><span>' + tline(one) + '</span><input type="number" min="0" max="' + n + '" data-u="' + k + '" placeholder="0"><b data-all="' + k + '">ทั้งหมด</b></div>';
      });
      $('p2T').innerHTML = h || '<p class="p2n">ไม่มีทหารในต้นทางนี้</p>';
    }
    function save(){
      var tr = {}, c = 0;
      w.querySelectorAll('[data-u]').forEach(function(i){ var n = parseInt(i.value, 10) || 0; if (n > 0){ tr[i.dataset.u] = Math.min(n, +i.max); c += n; } });
      if (!c) return toast('⚠ ยังไม่ได้เลือกทหาร');
      if ($('p2X').value === '' || $('p2Y').value === '') return toast('⚠ ใส่พิกัดเป้าหมาย');
      var fire = new Date($('p2W').value).getTime();
      if (!(fire > Date.now() + 55000)) return toast('⚠ ต้องตั้งเวลาล่วงหน้าอย่างน้อย 1 นาที');
      var s = src();
      if (!confirm('ตั้งแผน ' + MIS[$('p2M').value] + ' → (' + $('p2X').value + '|' + $('p2Y').value + ')\nออกเดินทาง ' + when(fire) +
        '\nจาก ' + (s ? 'กองเสริมทัพที่ ' + s.hostName : 'เมือง ' + v.name) + ' ?')) return;
      $('p2Go').disabled = true;
      Api.post('/plan/add', { vid:v.id, st:s ? s.id : 0, tx:+$('p2X').value, ty:+$('p2Y').value, mission:$('p2M').value, troops:tr, fireAt:fire })
        .then(function(r){
          $('p2Go').disabled = false;
          if (!r || !r.ok) return toast('⚠ ' + ((r && r.err) || 'ตั้งแผนไม่สำเร็จ'));
          toast('⏰ ตั้งแผนแล้ว');
          w.querySelectorAll('[data-u]').forEach(function(i){ i.value = ''; });
          loadSch(list, true);
        }, function(){ $('p2Go').disabled = false; toast('⚠ เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'); });
    }
    function list(){
      var L = $('p2L'); if (!L) return;
      L.innerHTML = SCH.list.length ? SCH.list.map(function(p){
        return '<div class="p2pl"><span>' + (MIS[p.mission] || p.mission) + ' → (' + p.tx + '|' + p.ty + ')' + (p.st ? ' · 🛡 กองเสริมทัพ' : '') +
          '<br><small style="color:#9a8a6a">' + when(p.fire_at) + ' · ' + tline(p.troops || {}) + '</small></span><b data-del="' + p.id + '">✕</b></div>';
      }).join('') : '<p class="p2n">ยังไม่มีแผน</p>';
      L.onclick = function(e){
        var id = e.target.dataset && e.target.dataset.del; if (!id) return;
        if (!confirm('ลบแผนนี้?')) return;
        Api.post('/plan/del', { id:+id }).then(function(){ toast('✕ ลบแผนแล้ว'); loadSch(list, true); });
      };
    }
  }

  /* ---------- 🔍 ค้นหาโอเอซิส 30 ช่อง ---------- */
  function find(onPick){
    var v = V(); if (!v) return;
    var w = wrap('of'), L = [], fo = 'all', ft = '';
    Api.post('/oasis/near', { vid:v.id }).then(function(r){
      var box = w.querySelector('.in');
      if (!r || !r.ok){ box.innerHTML = '<h3>🔍 โอเอซิสรอบเมือง</h3><p class="p2n">' + esc((r && r.err) || 'โหลดไม่สำเร็จ') + '</p><button class="p2x">ปิด</button>'; return; }
      L = r.list || [];
      box.innerHTML = '<h3>🔍 โอเอซิสรอบ ' + esc(v.name) + ' · 30 ช่อง</h3>' +
        '<div class="p2c" id="ofO"><span class="on" data-o="all">ทั้งหมด</span><span data-o="free">🟢 ว่าง</span><span data-o="tk">🚩 มีเจ้าของ</span><span data-o="mine">✓ ของฉัน</span></div>' +
        '<div class="p2c" id="ofT"><span class="on" data-t="">ทุกชนิด</span><span data-t="crop">🌾</span><span data-t="wood">🪵</span><span data-t="clay">🧱</span><span data-t="iron">⛏</span></div>' +
        '<p class="p2n" id="ofN"></p><div id="ofL"></div><button class="p2x">ปิด</button>';
      $('ofO').onclick = function(e){ var d = e.target.dataset; if (!d || d.o == null) return; fo = d.o; chip('ofO', e.target); draw(); };
      $('ofT').onclick = function(e){ var d = e.target.dataset; if (!d || d.t == null) return; ft = d.t; chip('ofT', e.target); draw(); };
      $('ofL').onclick = pick;
      draw();
    }, function(){ w.querySelector('.in').innerHTML = '<p class="p2n">เชื่อมต่อเซิร์ฟเวอร์ไม่ได้</p><button class="p2x">ปิด</button>'; });
    function chip(id, el){ $(id).querySelectorAll('span').forEach(function(s){ s.classList.toggle('on', s === el); }); }
    function shown(){
      return L.filter(function(o){
        if (fo === 'free' && o.pn) return false;
        if (fo === 'tk' && (!o.pn || o.mine)) return false;
        if (fo === 'mine' && !o.mine) return false;
        return !ft || TF[ft].test(String(o.type));
      });
    }
    function draw(){
      var S = shown();
      $('ofN').textContent = 'พบ ' + S.length + ' แห่ง (จากทั้งหมด ' + L.length + ') · เรียงจากใกล้ไปไกล';
      $('ofL').innerHTML = S.map(function(o){
        var i = L.indexOf(o);
        var st = o.mine ? '<small class="mine">✓ ของคุณ' + (o.vn ? ' · 🏘 ' + esc(o.vn) : '') + '</small>'
          : o.pn ? '<small class="tk">🚩 ' + esc(o.pn) + (o.vn ? ' · 🏘 ' + esc(o.vn) : '') + '</small>' : '<small>🟢 ว่าง</small>';
        return '<div class="p2o"><div class="ic">' + ic(o.type) + '</div><span>(' + o.x + '|' + o.y + ') <b style="color:#7fd17f">+' + o.pct + '%</b>' +
          '<small>📏 ' + o.d + ' ช่อง</small>' + st + '</span>' +
          (onPick ? '<em data-pk="' + i + '">เลือก</em>' : '<em data-pl="' + i + '">⏰</em><em data-mp="' + i + '">🗺</em>') + '</div>';
      }).join('') || '<p class="p2n">ไม่พบโอเอซิสตามตัวกรองนี้</p>';
    }
    function pick(e){
      var d = e.target.dataset || {}, o;
      if (d.pk != null){ o = L[+d.pk]; w.remove(); onPick(o.x, o.y); }
      else if (d.pl != null){ o = L[+d.pl]; w.remove(); open({ tx:o.x, ty:o.y }); }
      else if (d.mp != null){
        o = L[+d.mp]; w.remove();
        if (window.UI && UI.showPage) UI.showPage('world');
        if (window.Renderer){ Renderer.center(o.x, o.y); if (Renderer.showTile) Renderer.showTile(o.x, o.y); }
      }
    }
  }

  /* ---------- ปุ่ม 🔍 บนแผนที่ (เฉพาะผู้มีสิทธิ์) ---------- */
  function mapBtn(){
    var ref = $('zoa') || $('zout');
    if (!ref) return;
    var b = $('zof');
    if (!b){
      b = document.createElement('button');
      b.id = 'zof'; b.className = ref.className; b.title = 'ค้นหาโอเอซิส 30 ช่อง'; b.innerHTML = '🔍';
      b.onclick = function(e){ e.stopPropagation(); find(null); };
      ref.parentNode.insertBefore(b, ref.nextSibling);
    }
    b.style.display = active() ? '' : 'none';
  }

  /* ---------- "ส่งจาก": เติมเลขกองเมื่อมีกองไปเมืองเดียวกันหลายกอง ---------- */
  function fixLabels(){
    document.querySelectorAll('select').forEach(function(sel){
      var g = {};
      Array.prototype.forEach.call(sel.options, function(o){
        var base = o.dataset.p2b || o.textContent;
        if (base.indexOf('กองเราที่') < 0) return;
        o.dataset.p2b = base;
        (g[base] = g[base] || []).push(o);
      });
      Object.keys(g).forEach(function(k){
        var A = g[k];
        A.forEach(function(o, i){
          var t = A.length > 1 ? k.replace('กองเราที่', 'กอง ' + (i + 1) + ' ที่') : k;
          if (o.textContent !== t) o.textContent = t;
        });
      });
    });
  }
  window.addEventListener('mousedown', fixLabels, true);
  window.addEventListener('focusin', fixLabels, true);
  if (window.MutationObserver){
    var q = false;
    new MutationObserver(function(){
      if (q) return; q = true;
      requestAnimationFrame(function(){ q = false; try { fixLabels(); } catch(e){} });
    }).observe(document.body || document.documentElement, { childList:true, subtree:true });
  }

  /* ---------- ปุ่ม ⏰ ในการ์ดกองประจำการ ---------- */
  document.addEventListener('click', function(e){
    var b = e.target.closest && e.target.closest('[data-sp]');
    if (!b) return;
    e.stopPropagation();
    if (window.UI && UI.close) UI.close();
    open({ st:+b.dataset.sp });
  }, true);

  window.Plan2 = { open:open, find:find, active:active };
  function go(){
    if (!window.Api || !window.Game || !Game.villages){ return setTimeout(go, 1000); }
    loadSch(mapBtn, true);
    setInterval(function(){ loadSch(mapBtn); }, 60000);
    setInterval(mapBtn, 3000);
  }
  go();
})();
