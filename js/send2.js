/* ============ Send2 v14i — หน้าส่งทัพแบบใหม่ · เลือกต้นทาง (เมือง/กองประจำการ) · จำพิกัดล่าสุด ============ */
var Send2 = (function(){
  var C = { list:null, at:0 }, S = null;
  var MH = [['raid','💰 ปล้น'],['attack','⚔️ โจมตี'],['scout','👁️ สอดแนม'],['support','🛡️ เสริมทัพ'],['settle','🏘️ ตั้งเมืองใหม่']];
  function esc(s){ return String(s == null ? '' : s).replace(/[<>&"]/g, function(c){
    return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]; }); }
  function fmt(n){ return UI.fmt(n); }
  function cnt(t){ var n = 0; for (var k in (t || {})) n += t[k] | 0; return n; }
  function key(){ return 'sw_lt_' + ((typeof Net !== 'undefined' && Net.uid && Net.uid()) || 'x'); }
  function ownAt(x, y){ return Game.villages.filter(function(g){ return g.x === x && g.y === y; })[0] || null; }
  function other(x, y){ return (typeof Net !== 'undefined' && Net.at) ? Net.at(x, y) : null; }
  function $(i){ return document.getElementById(i); }

  function stations(cb){
    if (C.list && Date.now() - C.at < 20000) return cb(C.list);
    Api.post('/station/list', {}).then(function(r){
      var L = [];
      if (r && r.ok){
        (r.mine || []).forEach(function(s){ s.my = true; L.push(s); });
        (r.hosted || []).forEach(function(s){ if (s.cmd) L.push(s); });
      }
      C.list = L; C.at = Date.now(); cb(L);
    });
  }
  function info(x, y){
    if (isNaN(x) || isNaN(y)) return '';
    var mine = ownAt(x, y);
    if (mine) return mine === V() ? '🏠 เมืองนี้' : '🏘 เมืองของเรา: ' + esc(mine.name);
    var o = other(x, y);
    if (o){ var vv = o.p.vills[o.vi] || {};
      return '🏘 ' + esc(vv.n || '-') + ' · ' + esc(o.p.name) + (o.p.tag ? ' [' + esc(o.p.tag) + ']' : '') + ' · 👥 ' + fmt(vv.p || 0); }
    try {
      if (!World.inBounds(x, y)) return '⛔ นอกแผนที่';
      var t = World.tile(x, y);
      if (t.oasis) return '🌿 โอเอซิส +' + t.oasis.pct + '% · ยึดได้ด้วย 🗿 + ⚔️ โจมตี';
      if (t.npc) return '🏚 เมืองร้าง — ปล้นได้';
      return World.canSettle(x, y) ? '⛔ ไม่มีเมืองที่พิกัดนี้' : '🏕 ที่ว่าง — ตั้งเมืองใหม่ได้';
    } catch(e){ return ''; }
  }
  function defMis(x, y){
    if (ownAt(x, y)) return 'support';
    if (typeof B53 !== 'undefined' && B53.isMate(x, y)) return 'support';
    try { var t = World.tile(x, y);
      if (!other(x, y) && !t.npc && !t.oasis && !World.canSettle(x, y)) return 'settle'; } catch(e){}
    return 'raid';
  }

  function open(o){
    o = o || {};
    var v = V(), lt = Store.json(key(), null);
    var tx = o.tx != null ? o.tx : (lt ? lt.x : v.x), ty = o.ty != null ? o.ty : (lt ? lt.y : v.y);
    S = { tx:tx, ty:ty, src:o.src || 'h', mis:o.mis || defMis(tx, ty), L:[] };
    UI.modal('<h3>⚔ ส่งกองทัพ</h3><p class="stnone">กำลังโหลด…</p>');
    stations(function(L){
      var v2 = V();
      function here(s){ return (s.x === v2.x && s.y === v2.y) ? 1 : 0; }
      S.L = L.filter(function(s){ return cnt(s.troops) > 0 && s.raids < s.quota; })
        .sort(function(a, b){ return here(b) - here(a); });
      render();
    });
  }
  function srcSt(){ for (var i = 0; i < S.L.length; i++) if ('s' + S.L[i].id === S.src) return S.L[i]; return null; }

  function render(){
    var v = V(), st = srcSt();
    if (!st) S.src = 'h';
    var home = !st, T = home ? (v.troops || {}) : st.troops;
    var ks = Object.keys(T).filter(function(k){ return T[k] > 0 && War.unit(k); });
    var MS = home ? MH : MH.slice(0, 3);
    if (!MS.some(function(m){ return m[0] === S.mis; })) S.mis = 'raid';
    var hh = v.srvHero, hOk = home && !!(hh && !hh.dead && !hh.dung && !hh.army && hh.hp >= 30);
    var lt = Store.json(key(), null);

    var h = '<h3>⚔ ส่งกองทัพ</h3><label class="s2l">ส่งจาก</label><select id="s2src" class="selbox">' +
      '<option value="h">🏠 ทหารในเมือง ' + esc(v.name) + ' · ' + fmt(cnt(v.troops)) + ' นาย</option>' +
      S.L.map(function(s){
        return '<option value="s' + s.id + '"' + (S.src === 's' + s.id ? ' selected' : '') + '>🛡 ' +
          (s.my ? 'กองเราที่ ' + esc(s.hostName) : 'กองของ ' + esc(s.ownerName)) + ' (' + s.x + '|' + s.y + ') · โควตา ' +
          (s.quota - s.raids) + '/' + s.quota + '</option>';
      }).join('') + '</select>';
    if (!home) h += '<div class="suphint">ออกรบจากฐาน (' + st.x + '|' + st.y + ') ใช้โควตา 1 ครั้ง' +
      (st.quota - st.raids === 1 ? ' · <b style="color:#ffcf40">ครั้งสุดท้าย ทหารจะกลับเมืองเจ้าของหลังรบ</b>' : '') + '</div>';
    if (!ks.length) h += '<p class="stnone">ไม่มีทหารในต้นทางนี้</p>';
    else h += '<div class="tgrid2">' + ks.map(function(k){
      return '<div class="tcell"><span class="tic">' + War.icon(War.unit(k)) + '</span><input type="number" min="0" value="0" id="s2_' + k +
        '"><b class="thave" data-s2a="' + k + '" data-n="' + T[k] + '">/' + T[k] + '</b></div>';
    }).join('') + '</div>';
    if (home) h += '<label class="misr"><input type="checkbox" id="s2hero"' + (hOk ? '' : ' disabled') + '><span>🗿 ส่งวีรบุรุษไปด้วย' +
      (hh ? ' · Lv.' + hh.lv + ' · ❤ ' + hh.hp + '%' : '') + (hOk ? '' : ' — ยังไม่พร้อม') + '</span></label>';

    var chips = '';
    if (lt) chips += '<button class="s2c" data-cx="' + lt.x + '" data-cy="' + lt.y + '">🎯 ล่าสุด (' + lt.x + '|' + lt.y + ')</button>';
    Game.villages.forEach(function(g){
    if (home && g === v) return;
      chips += '<button class="s2c" data-cx="' + g.x + '" data-cy="' + g.y + '">🏘 ' + esc(g.name) + '</button>';
    });
    if (home && typeof B53 !== 'undefined') B53.gVills().slice(0, 8).forEach(function(g){
      chips += '<button class="s2c" data-cx="' + g.x + '" data-cy="' + g.y + '">🤝 ' + esc(g.n) + '</button>';
    });

    h += '<label class="s2l">เป้าหมาย</label><div class="destbox"><div class="drow2"><label>X</label><input type="number" id="s2x" value="' +
      S.tx + '"><label>Y</label><input type="number" id="s2y" value="' + S.ty + '"></div>' +
      (chips ? '<div class="s2chips">' + chips + '</div>' : '') + '<div class="ti-line" id="s2info"></div></div>';
    h += '<div class="misrow2">' + MS.map(function(m){
      return '<label class="misr"><input type="radio" name="s2m" value="' + m[0] + '"' + (S.mis === m[0] ? ' checked' : '') +
        '><span>' + m[1] + '</span></label>';
    }).join('') + '</div>';
    if (home) h += '<label class="misr" style="display:none"><input type="checkbox" id="s2cmd"><span>🤝 ให้เจ้าของเมืองปลายทางสั่งกองนี้ได้</span></label>';
    h += '<div class="infobox" id="s2prev"></div><button class="btn-ok" id="s2go">⚔ ส่งกองทัพ</button>' +
      '<button class="btn-use2" id="s2troops">🛡 รายการทหาร / กองประจำการ</button>' +
      '<button class="btn-cancel" onclick="UI.close()">ปิด</button>';
    UI.modal(h);
    bind(T, ks, home, st);
  }

  function bind(T, ks, home, st){
    function keep(){
      var x = parseInt($('s2x').value, 10), y = parseInt($('s2y').value, 10);
      if (!isNaN(x)) S.tx = x; if (!isNaN(y)) S.ty = y;
    }
    function pick(){
      var t = {};
      ks.forEach(function(k){ var n = parseInt($('s2_' + k).value, 10) || 0; if (n > 0) t[k] = Math.min(n, T[k]); });
      return t;
    }
    function upd(){
      keep();
      var m = document.querySelector('input[name=s2m]:checked');
      if (m) S.mis = m.value;
      $('s2info').innerHTML = '🎯 ' + info(S.tx, S.ty);
      var cr = $('s2cmd');
      if (cr) cr.parentNode.style.display = S.mis === 'support' ? '' : 'none';
      var t = pick(), n = 0, spd = 99, car = 0;
      for (var k in t){ var u = War.unit(k); n += t[k]; spd = Math.min(spd, u.spd); car += t[k] * u.carry; }
      var hx = $('s2hero'), hon = !!(hx && hx.checked);
      if (hon){ var cl = War.unit('u' + (Game.player.tribe | 0) + '_cav_l'); spd = Math.min(spd, cl ? cl.spd : 14); }
      if (!n && !hon){ $('s2prev').innerHTML = 'เลือกทหารที่จะส่ง'; return; }
      var ox = home ? V().x : st.x, oy = home ? V().y : st.y, d = Math.hypot(S.tx - ox, S.ty - oy);
      if (home) spd *= 1 + 0.03 * cityLevel(V(), 'trainground');
      var sec = Math.max(60, Math.round(d / spd * 3600 / CFG.SPEED));
      $('s2prev').innerHTML = '👥 ' + fmt(n) + (hon ? ' + 🗿' : '') + ' · 📏 ' + d.toFixed(1) + ' ช่อง · ⏱ ' + UI.dur(sec) +
        ' (ไป-กลับ ' + UI.dur(sec * 2) + ') · 📦 ' + fmt(car);
    }
    $('s2src').onchange = function(){ keep(); S.src = this.value; render(); };
    document.querySelectorAll('[data-s2a]').forEach(function(b){
      b.onclick = function(){ $('s2_' + b.dataset.s2a).value = b.dataset.n; upd(); };
    });
    document.querySelectorAll('[data-cx]').forEach(function(b){
      b.onclick = function(){
        $('s2x').value = b.dataset.cx; $('s2y').value = b.dataset.cy; keep();
        var r = document.querySelector('input[name=s2m][value=' + defMis(S.tx, S.ty) + ']');
        if (r) r.checked = true;
        upd();
      };
    });
    document.querySelectorAll('#modalbox input').forEach(function(i){
      i.addEventListener('input', upd); i.addEventListener('change', upd);
    });
    $('s2troops').onclick = function(){ War.openTroops(); };
    $('s2go').onclick = function(){
      upd();
      var t = pick(), hx = $('s2hero'), hon = !!(hx && hx.checked), btn = this;
      if (!cnt(t) && !hon) return alert('ยังไม่ได้เลือกทหาร');
      if (S.mis === 'raid' || S.mis === 'attack' || S.mis === 'scout') Store.setJson(key(), { x:S.tx, y:S.ty });
      btn.disabled = true;
      function done(){ C.list = null; UI.close(); Sync.toast('⚔️ กองทัพออกเดินทางแล้ว'); }
      if (home) Sync.cmd('/send', { vid:V().id, tx:S.tx, ty:S.ty, mission:S.mis, troops:t, hero:hon,
          canCmd:!!($('s2cmd') || {}).checked }, function(r){ if (r && r.ok) done(); else btn.disabled = false; });
      else Api.post('/station/raid', { id:st.id, tx:S.tx, ty:S.ty, mission:S.mis, troops:t }).then(function(r){
        btn.disabled = false;
        if (!r.ok) return alert(r.err || 'ส่งไม่สำเร็จ');
        Sync.poll(true); done();
      });
    };
    upd();
  }

  function install(){
    if (typeof War === 'undefined') return;
    War.openSend = function(x, y){ open(x != null ? { tx:x, ty:y } : {}); };
    if (typeof MilUI !== 'undefined') MilUI.openRally = War.openSend;
    Renderer.sendHere = function(x, y){
      Renderer.hideInfo();
      var ow = ownAt(x, y);
      if (ow){
        var i = Game.villages.indexOf(ow);
        if (i !== Game.active){ Game.active = i; UI.refreshAll(); Sync.toast('🏘 สลับไปเมือง ' + ow.name); }
        open({});
      } else open({ tx:x, ty:y });
    };
    if (typeof B5 !== 'undefined') B5.openRaid = function(s){ if (s) open({ src:'s' + s.id }); };
  }
  return { open:open, install:install };
})();