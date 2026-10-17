/* ============ War v14b — ฝึกทหาร / ส่งกองทัพ / รายงาน (ออนไลน์) ============ */
var War = (function(){
  var R = { units:[], byId:{} }, ORIG = {}, inst = false, lastArr = 0, REP = [];
  var IC = { inf_a:'⚔️', inf_d:'🛡️', inf_x:'🗡️', scout:'👁️', cav_l:'🐎', cav_h:'🐘', ram:'🐏' };
  var MIS = { attack:{ ic:'⚔️', name:'โจมตี' }, raid:{ ic:'💰', name:'ปล้น' },
              scout:{ ic:'👁️', name:'สอดแนม' }, support:{ ic:'🛡️', name:'เสริมทัพ' } };
  var BLD_OK = { barracks:1, stable:1, workshop:1 };

  function esc(s){ return String(s == null ? '' : s).replace(/[<>&"]/g, function(c){
    return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]; }); }
  function fmt(n){ return UI.fmt(n); }

  function setRules(r){
    if (!r || !r.units) return;
    R.units = r.units; R.byId = {};
    R.units.forEach(function(u){ R.byId[u.id] = u; });
    if (r.tribes && typeof TRIBES !== 'undefined'){
      try {
        TRIBES.splice(0, TRIBES.length);
        r.tribes.forEach(function(t){ TRIBES.push({ name:t.name, desc:t.desc }); });
      } catch(e){}
    }
  }
  function unit(id){ return R.byId[id] || null; }
  function myUnits(bld){
    var tr = Game.player.tribe | 0;
    return R.units.filter(function(u){ return u.tribe === tr && (!bld || u.bld === bld); });
  }
  function icon(u){
    if (!u) return '⚔️';
    if (typeof Icons !== 'undefined' && Icons.unit){ var im = Icons.unit(u.tribe, u.k); if (im) return im; }
    return IC[u.k] || '⚔️';
  }
  function troopLine(t){
    var a = [];
    for (var k in (t || {})){
      if (!t[k]) continue;
      var u = unit(k);
      a.push((u ? icon(u) + ' ' + u.name : k) + ' ×' + fmt(t[k]));
    }
    return a.length ? a.join(' · ') : '—';
  }
  function eachSec(u, bl){ return Math.max(5, Math.round(u.time * Math.pow(0.9, bl - 1) / CFG.SPEED)); }
  function count(t){ var n = 0; for (var k in (t || {})) n += t[k] | 0; return n; }

  /* ---------- ฝึกทหาร ---------- */
  function openTrain(bk){
    if (!BLD_OK[bk]){
      return Sync.soon(bk === 'residence' || bk === 'palace' ? 'ฝึกผู้ตั้งถิ่นฐาน / ขุนพล' : 'ค่ายหลวง');
    }
    var v = V(); refresh(v);
    var bl = cityLevel(v, bk), B = BUILDINGS[bIndex(bk)];
    var h = '<h3>' + B.ic + ' ' + B.name + ' Lv.' + bl + '</h3>';
    if (bl < 1) h += '<div class="bc-lock">🔒 ยังไม่ได้สร้าง' + B.name + '</div>';
    myUnits(bk).forEach(function(u){
      var why = bl < u.lv ? 'ต้องมี' + B.name + 'ระดับ ' + u.lv
        : (u.req && cityLevel(v, u.req[0]) < u.req[1])
          ? 'ต้องมี' + BUILDINGS[bIndex(u.req[0])].name + 'ระดับ ' + u.req[1] : null;
      var mx = 99999;
      RES.forEach(function(r){ if (u.cost[r] > 0) mx = Math.min(mx, Math.floor(v.res[r] / u.cost[r])); });
      mx = Math.max(0, Math.min(5000, mx));
      h += '<div class="ucard' + (why ? ' lockcard' : '') + '"><div class="uhead"><b>' + icon(u) + ' ' + esc(u.name) +
        '</b><span class="ustat">⚔ ' + u.atk + ' · 🛡 ' + u.di + '/' + u.dc + '<br>🐾 ' + u.spd +
        ' · 📦 ' + u.carry + ' · 🌾 ' + u.up + '/ชม.</span></div>' +
        '<div class="ucost">' + RES.map(function(r){
          return '<span' + (v.res[r] < u.cost[r] ? ' class="lack"' : '') + '>' + RES_IC[r] + fmt(u.cost[r]) + '</span>';
        }).join('') + '<span>⏱ ' + UI.dur(eachSec(u, Math.max(1, bl))) + '/นาย</span></div>' +
        (why ? '<div class="bc-lock">🔒 ' + why + '</div>'
             : '<div class="urow"><input type="number" min="0" max="' + mx + '" value="0" id="tn_' + u.id + '">' +
               '<button class="mini" data-max="' + u.id + '" data-n="' + mx + '">สูงสุด ' + mx + '</button>' +
               '<button class="btn-ok mini2" data-tr="' + u.id + '">ฝึก</button></div>') + '</div>';
    });
    var q = (v.train || {})[bk] || [];
    if (q.length){
      h += '<h4>คิวฝึก</h4>';
      q.forEach(function(j, i){
        var u = unit(j.unit);
        h += '<div class="trow"><div class="tinfo"><b>' + icon(u) + ' ' + esc(u ? u.name : j.unit) + ' ×' + j.left +
          '</b><i>' + (i === 0 ? 'นายถัดไปเสร็จใน ' + UI.dur((j.nextAt - now()) / 1000) : 'รอคิว') + '</i></div></div>';
      });
    }
    h += '<button class="btn-cancel" onclick="UI.close()">ปิด</button>';
    UI.modal(h);
    document.querySelectorAll('[data-max]').forEach(function(b){
      b.onclick = function(){ document.getElementById('tn_' + b.dataset.max).value = b.dataset.n; };
    });
    document.querySelectorAll('[data-tr]').forEach(function(b){
      b.onclick = function(){
        var id = b.dataset.tr, n = parseInt(document.getElementById('tn_' + id).value, 10) || 0;
        if (n < 1) return alert('ใส่จำนวนที่ต้องการฝึก');
        b.disabled = true;
        Sync.cmd('/train', { vid:v.id, u:id, n:n }, function(r){
          b.disabled = false;
          if (r && r.ok){ Sync.toast('⚔️ เริ่มฝึก ' + unit(id).name + ' ×' + n); openTrain(bk); }
        });
      };
    });
  }

  /* ---------- ส่งกองทัพ ---------- */
  function targetInfo(x, y){
    var v = V();
    if (x === v.x && y === v.y) return '🏠 เมืองของคุณเอง';
    var o = (typeof Net !== 'undefined' && Net.at) ? Net.at(x, y) : null;
    if (o){ var vv = o.p.vills[o.vi] || {}; return '🏘 ' + esc(vv.n || '-') + ' · ' + esc(o.p.name) + ' · 👥 ' + fmt(vv.p || 0); }
    try {
      var t = World.tile(x, y);
      if (t.oasis) return '🌿 โอเอซิส (เปิดในเฟส B4)';
      if (t.npc) return '🏚 เมืองร้าง — ปล้นได้';
      return '⛔ ไม่มีเมืองที่พิกัดนี้';
    } catch(e){ return ''; }
  }
  function openSend(x, y){
    var v = V(); refresh(v);
    var home = v.troops || {};
    var L = myUnits().filter(function(u){ return (home[u.id] || 0) > 0; });
    var rl = cityLevel(v, 'rally');
    var used = (Game.movements || []).filter(function(m){ return m.from === v.id && !m.returning; }).length;
    var mx = rallySlots(rl);
    var h = '<h3>⚔ ส่งกองทัพ — ' + esc(v.name) + '</h3>' +
      '<div class="rbar"><span>ลานรวมพล Lv.' + rl + '</span><b>ขบวนที่ออกไป ' + used + '/' + mx + '</b></div>';
    if (!L.length) h += '<p class="stnone">ไม่มีทหารในเมือง — ฝึกได้ที่ค่ายทหาร / คอกม้า / โรงงาน</p>';
    else {
      h += '<div class="tgrid2">';
      L.forEach(function(u){
        h += '<div class="tcell"><span class="tic">' + icon(u) + '</span><input type="number" min="0" max="' + home[u.id] +
          '" value="0" id="sd_' + u.id + '"><b class="thave" data-all="' + u.id + '" data-n="' + home[u.id] + '">/' +
          home[u.id] + '</b></div>';
      });
      h += '</div>';
    }
    h += '<div class="destbox"><div class="drow2"><label>X</label><input type="number" id="sdx" value="' +
      (x != null ? x : v.x) + '"><label>Y</label><input type="number" id="sdy" value="' + (y != null ? y : v.y) +
      '"></div><div class="ti-line" id="sdInfo"></div></div>' +
      '<div class="misrow2">' +
      '<label class="misr"><input type="radio" name="sdm" value="raid" checked><span>💰 ปล้น — เสียทหารน้อย เน้นขนของกลับ</span></label>' +
      '<label class="misr"><input type="radio" name="sdm" value="attack"><span>⚔️ โจมตี — สู้จนแพ้ชนะ ซุงกระทุ้งทำลายกำแพงได้</span></label>' +
      '<label class="misr"><input type="radio" name="sdm" value="scout"><span>👁️ สอดแนม — ส่งได้เฉพาะหน่วยสอดแนม</span></label></div>' +
      '<div class="infobox" id="sdPrev">เลือกทหารที่จะส่ง</div>' +
      '<button class="btn-ok" id="sdGo"' + (L.length ? '' : ' disabled') + '>⚔ ส่งกองทัพ</button>' +
      '<button class="btn-use2" id="sdTroops">🛡 ดูรายการทหาร</button>' +
      '<button class="btn-cancel" onclick="UI.close()">ปิด</button>';
    UI.modal(h);

    function pick(){
      var t = {};
      L.forEach(function(u){
        var n = parseInt(document.getElementById('sd_' + u.id).value, 10) || 0;
        if (n > 0) t[u.id] = Math.min(n, home[u.id]);
      });
      return t;
    }
    function upd(){
      var tx = parseInt(document.getElementById('sdx').value, 10), ty = parseInt(document.getElementById('sdy').value, 10);
      document.getElementById('sdInfo').innerHTML = isNaN(tx) || isNaN(ty) ? '' : '🎯 ' + targetInfo(tx, ty);
      var t = pick(), n = 0, spd = 99, carry = 0;
      for (var k in t){ var u = unit(k); n += t[k]; spd = Math.min(spd, u.spd); carry += t[k] * u.carry; }
      if (!n || isNaN(tx) || isNaN(ty)){ document.getElementById('sdPrev').innerHTML = 'เลือกทหารที่จะส่ง'; return; }
      var d = Math.hypot(tx - v.x, ty - v.y);
      spd *= 1 + 0.03 * cityLevel(v, 'trainground');
      var sec = Math.max(60, Math.round(d / spd * 3600 / CFG.SPEED));
      document.getElementById('sdPrev').innerHTML = '👥 ' + fmt(n) + ' นาย · 📏 ' + d.toFixed(1) + ' ช่อง · ⏱ ' +
        UI.dur(sec) + ' (ไป-กลับ ' + UI.dur(sec * 2) + ') · 📦 บรรทุก ' + fmt(carry);
    }
    document.querySelectorAll('[data-all]').forEach(function(b){
      b.onclick = function(){ document.getElementById('sd_' + b.dataset.all).value = b.dataset.n; upd(); };
    });
    document.querySelectorAll('#modalbox input').forEach(function(i){ i.oninput = upd; i.onchange = upd; });
    upd();
    document.getElementById('sdTroops').onclick = openTroops;
    document.getElementById('sdGo').onclick = function(){
      var t = pick();
      if (!count(t)) return alert('ยังไม่ได้เลือกทหาร');
      var b = this;
      b.disabled = true;
      Sync.cmd('/send', { vid:v.id, tx:parseInt(document.getElementById('sdx').value, 10),
        ty:parseInt(document.getElementById('sdy').value, 10),
        mission:document.querySelector('input[name=sdm]:checked').value, troops:t }, function(r){
        b.disabled = false;
        if (r && r.ok){ UI.close(); Sync.toast('⚔️ กองทัพออกเดินทางแล้ว'); }
      });
    };
  }

  /* ---------- รายการทหาร ---------- */
  function openTroops(){
    var v = V(); refresh(v);
    var home = v.troops || {}, t0 = now();
    var ks = Object.keys(home).filter(function(k){ return home[k] > 0 && unit(k); });
    var h = '<h3>🛡 กองทัพ — ' + esc(v.name) + '</h3><h4>🏠 ทหารในเมือง · ' + fmt(count(home)) + ' นาย</h4>';
    if (!ks.length) h += '<p class="stnone">ยังไม่มีทหารในเมือง</p>';
    else {
      h += '<table class="ttab"><tr><th>หน่วย</th><th>จำนวน</th><th>⚔</th><th>🛡</th><th>🌾/ชม.</th></tr>';
      ks.forEach(function(k){
        var u = unit(k), n = home[k];
        h += '<tr><td>' + icon(u) + ' ' + esc(u.name) + '</td><td><b>' + fmt(n) + '</b></td><td>' + fmt(u.atk * n) +
          '</td><td>' + fmt(Math.round((u.di + u.dc) / 2 * n)) + '</td><td>' + fmt(u.up * n) + '</td></tr>';
      });
      h += '</table>';
    }
    var mv = (Game.movements || []).filter(function(m){ return m.from === v.id; });
    h += '<h4>🏹 กำลังเดินทาง (' + mv.length + ')</h4>';
    if (!mv.length) h += '<p class="stnone">ไม่มีกองทัพเดินทาง</p>';
    mv.forEach(function(m){
      var mi = MIS[m.mission] || MIS.attack;
      h += '<div class="stcard"><div class="vh"><b>' + (m.returning ? '↩️ กลับเมือง' + (count(m.loot) ? ' พร้อมของ' : '')
        : mi.ic + ' ' + mi.name + ' → (' + m.tx + '|' + m.ty + ')') + '</b><span>' +
        UI.dur((m.arriveAt - t0) / 1000) + '</span></div><div class="stline">' + troopLine(m.troops) + '</div></div>';
    });
    var inc = (Game.incoming || []).filter(function(m){ return m.target === v.id; });
    if (inc.length){
      h += '<h4 style="color:#ff6b6b">⚠️ ศัตรูกำลังมา (' + inc.length + ')</h4>';
      inc.forEach(function(m){
        h += '<div class="stcard" style="border-left-color:#ff4d4d"><div class="vh"><b>' +
          (m.mission === 'scout' ? '👁️ สอดแนม' : '⚔️ โจมตี') + ' จาก (' + m.fx + '|' + m.fy + ')</b><span>' +
          UI.dur((m.arriveAt - t0) / 1000) + '</span></div></div>';
      });
    }
    h += '<div class="row"><span>เสบียงกองทัพรวม</span><b style="color:#ff9a5a">−' + fmt(v.srvUp || 0) + ' 🌾/ชม.</b></div>' +
      '<div class="grow2"><button class="btn-ok mini2" id="toSend">⚔ ส่งกองทัพ</button>' +
      '<button class="btn-use mini2" id="toTrain">🏋 ฝึกทหาร</button></div>' +
      '<button class="btn-cancel" onclick="UI.close()">ปิด</button>';
    UI.modal(h);
    document.getElementById('toSend').onclick = function(){ openSend(); };
    document.getElementById('toTrain').onclick = function(){
      openTrain(cityLevel(v, 'barracks') > 0 ? 'barracks' : cityLevel(v, 'stable') > 0 ? 'stable' : 'barracks');
    };
  }

  /* ---------- รายงาน ---------- */
  function side(title, name, vn, x, y, t, lost, isDef){
    if (!t) return '';
    var ks = Object.keys(t).filter(function(k){ return t[k] > 0; });
    var h = '<div class="rpt-g"><b>' + title + '</b> ' + esc(name) + (vn ? ' · ' + esc(vn) : '') + ' (' + x + '|' + y + ')';
    if (!ks.length) return h + '<br><i style="color:#8a7a55">' + (isDef ? 'ไม่มีทหารป้องกัน' : '—') + '</i></div>';
    h += '<table class="ttab" style="margin:5px 0 0"><tr><th>หน่วย</th><th>' + (isDef ? 'มี' : 'ส่ง') +
      '</th><th>เสีย</th></tr>';
    ks.forEach(function(k){
      var u = unit(k);
      h += '<tr><td>' + icon(u) + ' ' + esc(u ? u.name : k) + '</td><td>' + fmt(t[k]) + '</td><td style="color:#ff9a9a">' +
        fmt((lost || {})[k] || 0) + '</td></tr>';
    });
    return h + '</table></div>';
  }
  function resLine(r){ return RES.map(function(x){ return RES_IC[x] + fmt((r || {})[x] || 0); }).join(' '); }
  function repBody(d){
    if (d && d.hk && typeof Hero2 !== 'undefined') return Hero2.repBody(d);
    if (!d || !d.a) return '—';
    if (d.miss) return '<div class="rpt-g">ไม่พบเมืองที่พิกัดนี้แล้ว กองทัพเดินทางกลับ</div>';
    var h = side('⚔️ ฝ่ายโจมตี', d.a.name, d.a.v, d.a.x, d.a.y, d.a.sent, d.a.lost, false);
    if (d.mission !== 'scout'){
      if (d.d.troops) h += side('🛡️ ฝ่ายป้องกัน', d.d.name, d.d.v, d.d.x, d.d.y, d.d.troops, d.d.lost, true);
      else if (!d.def) h += '<div class="rpt-g">ทหารไม่รอดกลับมาเลย จึงไม่รู้กำลังของฝ่ายป้องกัน</div>';
    }
    if (d.pw) h += '<div class="rpt-g">พลังโจมตี <b>' + fmt(d.pw.a) + '</b> · พลังป้องกัน <b>' + fmt(d.pw.d) + '</b></div>';
    if (d.loot && count(d.loot)) h += '<div class="rpt-g">📦 ' + (d.def ? 'ถูกปล้นไป ' : 'ปล้นได้ ') + resLine(d.loot) + '</div>';
    if (d.wall) h += '<div class="rpt-g">🧱 กำแพง Lv.' + d.wall[0] + ' → Lv.' + d.wall[1] + '</div>';
    if (d.intel){
      h += '<div class="rpt-g"><b>👁️ ข้อมูลที่สอดแนมได้</b><br>' + resLine(d.intel.res) +
        (d.intel.hide ? '<br>🕳 ซ่อนได้ ' + fmt(d.intel.hide) + ' ต่อชนิด' : '') +
        '<br>🧱 กำแพง Lv.' + (d.intel.wall || 0) +
        (d.intel.npcDef ? '<br>🛡 พลังป้องกันประมาณ ' + fmt(d.intel.npcDef) : '') + '</div>';
      if (d.intel.troops) h += side('🛡️ ทหารในเมือง', d.d.name, d.d.v, d.d.x, d.d.y, d.intel.troops, {}, true);
    }
    return h;
  }
  function renderReports(){
    var el = document.getElementById('reportlist');
    if (!el) return;
    el.innerHTML = '<p class="stnone">กำลังโหลด…</p>';
    Api.post('/reports', {}).then(function(r){
      if (!r.ok){ el.innerHTML = '<p class="stnone">' + esc(r.err || 'โหลดไม่สำเร็จ') + '</p>'; return; }
      REP = r.list || [];
      paintReports();
    });
  }
  function paintReports(){
    var el = document.getElementById('reportlist');
    if (!el) return;
    var h = '<div class="rpt-bar"><button id="rpAll">อ่านทั้งหมด</button><button id="rpDel">ลบทั้งหมด</button>' +
      '<button id="rpRe">🔄</button></div>';
    if (!REP.length) h += '<p class="stnone">ยังไม่มีรายงาน</p>';
    REP.forEach(function(r){
      h += '<div class="rpt' + (r.read ? '' : ' new') + (r.open ? ' open' : '') + '" data-rid="' + r.id + '">' +
        '<div class="rpt-h"><div><div class="rpt-t">' + esc(r.title) + '</div><div class="rpt-s">' +
        new Date(r.at).toLocaleString('th-TH', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }) +
        '</div></div><div class="rpt-ar">' + (r.open ? '▲' : '▼') + '</div></div>' +
        '<div class="rpt-b">' + (r.open ? repBody(r.data) : '') + '</div></div>';
    });
    el.innerHTML = h;
    document.getElementById('rpRe').onclick = renderReports;
    document.getElementById('rpAll').onclick = function(){
      REP.forEach(function(r){ r.read = 1; });
      Sync.setUnread(0); paintReports();
      Api.post('/reports/read', { all:true });
    };
    document.getElementById('rpDel').onclick = function(){
      if (!confirm('ลบรายงานทั้งหมด?')) return;
      REP = []; Sync.setUnread(0); paintReports();
      Api.post('/reports/del', { all:true });
    };
    el.querySelectorAll('[data-rid]').forEach(function(c){
      c.querySelector('.rpt-h').onclick = function(){
        var id = +c.dataset.rid, r = REP.filter(function(x){ return x.id === id; })[0];
        if (!r) return;
        r.open = !r.open;
        if (!r.read){ r.read = 1; Sync.setUnread(Math.max(0, Sync.unread() - 1)); Api.post('/reports/read', { id:id }); }
        paintReports();
      };
    });
  }
  function updateBadge(){
    var b = document.getElementById('rptbadge');
    if (!b) return;
    var n = Sync.unread();
    b.textContent = n;
    b.classList.toggle('hidden', !n);
  }

  /* ---------- เดินเวลาในเครื่อง (ให้ตัวเลขขยับทันที) ---------- */
  function localTick(){
    if (!Sync.online()) return;
    var t = now();
    Game.villages.forEach(function(v){
      for (var b in (v.train || {})){
        var q = v.train[b];
        while (q.length){
          var j = q[0];
          if (j.nextAt > t) break;
          var k = Math.min(j.left, Math.floor((t - j.nextAt) / j.each) + 1);
          v.troops[j.unit] = (v.troops[j.unit] || 0) + k;
          j.left -= k; j.nextAt += k * j.each;
          if (j.left <= 0) q.shift(); else break;
        }
        if (!q.length) delete v.train[b];
      }
    });
    var all = (Game.movements || []).concat(Game.incoming || []);
    if (all.some(function(m){ return m.arriveAt <= t - 1500; }) && Date.now() - lastArr > 5000){
      lastArr = Date.now();
      Sync.poll(true);
    }
  }

  function install(){
    if (inst) return;
    inst = true;
    ORIG.U = window.U;
    window.U = function(id){ return R.byId[id] || (ORIG.U ? ORIG.U(id) : null); };
    if (typeof MilUI !== 'undefined'){
      MilUI.openTrain = openTrain; MilUI.openRally = openSend; MilUI.openTroops = openTroops;
      MilUI.unitIcon = icon; MilUI.renderReports = renderReports; MilUI.updateBadge = updateBadge;
    }
    if (typeof Station !== 'undefined') Station.open = openTroops;
    if (typeof Military !== 'undefined'){
      Military.upkeep = function(v){ return (v && v.srvUp) || 0; };
      Military.troopLine = troopLine;
      if (!Military.MISSIONS) Military.MISSIONS = {};
      for (var k in MIS) Military.MISSIONS[k] = MIS[k];
    }
    if (typeof Renderer !== 'undefined')
      Renderer.sendHere = function(x, y){ Renderer.hideInfo(); openSend(x, y); };
    setInterval(localTick, 1000);
  }

  return { setRules:setRules, install:install, unit:unit, icon:icon, troopLine:troopLine,
    openTrain:openTrain, openSend:openSend, openTroops:openTroops,
    renderReports:renderReports, updateBadge:updateBadge };
})();