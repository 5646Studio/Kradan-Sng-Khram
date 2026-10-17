/* ============ Sync v14b — เชื่อมเกมกับเซิร์ฟเวอร์กลาง ============ */
var Sync = (function(){
  var S = { on:false, started:false, ran:false, installed:false, timers:false, uid:null, features:{},
    srv:null, pending:0, chain:Promise.resolve(), others:[], idx:{}, worldAt:0, unread:0 };
  var ORIG = {}, POLL_MS = 30000;

  function wanted(){
    try { return typeof Api !== 'undefined' && !!Api.base() && typeof Net !== 'undefined' && Net.enabled(); }
    catch(e){ return false; }
  }
  function online(){ return S.on; }
  function feature(k){ return !!S.features[k]; }
  function esc(s){ return String(s == null ? '' : s).replace(/[<>&"]/g, function(c){
    return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]; }); }

  function css(){
    if (document.getElementById('syncCss')) return;
    var st = document.createElement('style');
    st.id = 'syncCss';
    st.textContent =
      '#synctoast{position:fixed;left:50%;top:60px;transform:translateX(-50%);z-index:95;background:rgba(20,16,10,.96);' +
      'border:1px solid #6b552f;border-radius:16px;padding:6px 14px;font-size:11px;color:#ffcf40;' +
      'box-shadow:0 3px 10px rgba(0,0,0,.7);pointer-events:none;transition:opacity .3s;max-width:90%;text-align:center}' +
      '#synctoast.off{opacity:0}.shopc{display:flex;align-items:center;gap:8px;background:#100d09;border:1px solid #2f2618;' +
      'border-radius:8px;padding:9px;margin-bottom:6px}.shopc b{flex:1;color:#ffcf40;font-size:13px}' +
      '.shopc i{font-style:normal;font-size:10px;color:#8fbf5f;display:block;margin-top:2px}' +
      '.shopc span{font-size:12.5px;color:#f0e6cc;font-weight:700}';
    document.head.appendChild(st);
  }
  var toastT = null;
  function toast(t, ms){
    css();
    var el = document.getElementById('synctoast');
    if (!el){ el = document.createElement('div'); el.id = 'synctoast'; document.body.appendChild(el); }
    el.textContent = t; el.className = '';
    clearTimeout(toastT);
    toastT = setTimeout(function(){ el.className = 'off'; }, ms || 2500);
  }

  /* ---------- เริ่มต้น ---------- */
  function start(cb){
    css();
    Net.onAuth(function(u){
      if (S.started){ if (!u) location.replace('index.html'); return; }
      S.started = true;
      if (!u) return cb('nologin');
      S.uid = u.uid;
      Api.get('/rules', null, false).then(function(rr){
        if (rr && rr.ok){ S.features = rr.features || {}; if (typeof War !== 'undefined') War.setRules(rr); }
        if (rr && rr.ok && typeof Hero2 !== 'undefined') Hero2.setRules(rr);
        return Api.post('/me', {});
      }).then(function(r){
        if (r.err === 'auth') return cb('nologin');
        if (r.net || r._status >= 500 || !('player' in r)) return cb('error', r.err || 'ไม่ทราบสาเหตุ');
        S.features = r.features || S.features;
        install();
        if (!r.player) return cb('new');
        apply(r, true); goLive(); cb('ok');
      });
    });
  }
  function register(name, tribe, zone, cb){
    Api.post('/register', { name:name, tribe:tribe, zone:zone }).then(function(r){
      if (!r.ok) return cb(r.err || 'ลงทะเบียนไม่สำเร็จ');
      Api.post('/me', {}).then(function(m){
        if (!m.player) return cb(m.err || 'โหลดข้อมูลไม่สำเร็จ');
        S.features = m.features || S.features;
        apply(m, true); goLive(); cb(null);
      });
    });
  }
  function goLive(){ S.on = true; fetchWorld(); startTimers(); }
  function ready(){ S.ran = true; }

  /* ---------- ข้อมูลเซิร์ฟเวอร์ → ข้อมูลเกม ---------- */
  function toLocal(sv, o){
    if (!o) o = { troops:{}, train:{}, hero:(typeof Hero !== 'undefined' ? Hero.mk() : null),
      dung:null, captured:false, settlersUsed:0, layoutName:'', rare:0 };
    o.id = sv.id; o.x = sv.x; o.y = sv.y; o.name = sv.name || 'เมือง'; o.firstCity = !!sv.first;
    o.fields = (sv.fields || []).map(function(f){ return { res:f.res, level:f.level | 0 }; });
    o.city = (sv.city || []).map(function(c){ return { b:c.k ? bIndex(c.k) : 0, level:c.level | 0 }; });
    while (o.city.length < 21) o.city.push({ b:0, level:0 });
    o.wallLv = sv.wallLv || 0;
    o.res = { wheat:+sv.res.wheat || 0, wood:+sv.res.wood || 0, iron:+sv.res.iron || 0, clay:+sv.res.clay || 0 };
    o.resAt = sv.resAt;
    o.queue = (sv.queue || []).map(function(q){
      return { kind:q.kind, slot:q.slot, level:q.level, sec:q.sec, cost:q.cost || {},
        active:!!q.active, start:q.start || 0, finish:q.finish || 0 };
    });
    o.troops = Object.assign({}, sv.troops || {});
    o.train = {};
    for (var b in (sv.train || {}))
      o.train[b] = sv.train[b].map(function(j){
        return { unit:j.u, left:j.left, total:j.n, nextAt:j.next, each:j.each };
      });
    o.srvUp = sv.upkeep || 0;
    o.srvHero = sv.hero || null;
    o.loyalty = 100; o.loyaltyAt = now();
    return o;
  }
  function resetGame(){
    Game.bots = []; Game.guilds = []; Game.movements = []; Game.incoming = []; Game.trades = []; Game.sched = [];
    Game.schedUntil = 0; Game.stationed = []; Game.allySup = []; Game.offers = []; Game.npc = {}; Game.oasis = {};
    Game.forts = {}; Game.capital = { owner:null, since:0, loyalty:100 }; Game.guild = null; Game.pendingApp = null;
    Game.allies = []; Game.enemies = []; Game.stats = { atkPts:0, defPts:0, raidPts:0 };
    Game.quest = 0; Game.questDone = []; Game.tutorialSkip = true; Game.won = false; Game.villages = [];
    Game.bookmarks = Store.json('sw_bm_' + S.uid, []) || [];
    Game.reports = [];
  }
  function apply(r, first){
    if (!r || !r.player || !r.villages) return;
    S.srv = r;
    if (r.features) S.features = r.features;
    if (r.now) Game.timeShift = r.now - Date.now();
    if (first) resetGame();
    var P = r.player, G = Game.player;
    G.name = P.name; G.gold = P.gold | 0; G.cp = +P.cp || 0; G.tribe = P.tribe | 0; G.quadrant = P.zone | 0;
    Game.builders = P.builders || 2; Game.builderUntil = P.builderUntil || 0;
    Game.protectUntil = P.protectUntil || 0; Game.protectBroken = false;
    if (P.created) Game.startedAt = P.created;

    var act = Game.villages[Game.active] ? Game.villages[Game.active].id : null, old = {};
    Game.villages.forEach(function(v){ old[v.id] = v; });
    Game.villages = r.villages.map(function(sv){ return toLocal(sv, old[sv.id]); });
    Game.active = 0;
    for (var i = 0; i < Game.villages.length; i++) if (Game.villages[i].id === act) Game.active = i;

    Game.movements = (r.moves || []).map(function(m){
      return { id:m.id, from:m.from, fx:m.fx, fy:m.fy, tx:m.tx, ty:m.ty, mission:m.mission,
        troops:m.troops || {}, loot:m.loot || {}, returning:m.state === 'back',
        departAt:m.depart, arriveAt:m.arrive, hero:false };
    });
    Game.incoming = (r.incoming || []).map(function(m){
      return { id:m.id, target:m.to, fx:m.fx, fy:m.fy, tx:m.tx, ty:m.ty, mission:m.mission,
        departAt:m.depart, arriveAt:m.arrive, hostile:true };
    });
    S.unread = r.unread || 0;
    if (typeof Social !== 'undefined') Social.onState(r);
    if (typeof B3 !== 'undefined') B3.onState(r);
    if (S.ran){
      try { UI.refreshAll(); if (typeof MilUI !== 'undefined') MilUI.updateBadge(); }
      catch(e){ logErr('Sync.apply', e); }
    }
  }
  function srvIdx(vid, kind, slot){
    if (!S.srv) return -1;
    var v = (S.srv.villages || []).filter(function(x){ return x.id === vid; })[0];
    if (!v) return -1;
    for (var i = 0; i < v.queue.length; i++)
      if (v.queue[i].kind === kind && (v.queue[i].slot | 0) === (slot | 0)) return i;
    return -1;
  }

  /* ---------- ส่งคำสั่ง (เรียงทีละคำสั่ง) ---------- */
  function handle(r, isCmd){
    if (!r) return;
    if (r.err === 'auth'){ location.replace('index.html'); return; }
    if (r.net){
      toast('⚠ เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ — จะซิงก์ใหม่อัตโนมัติ', 3500);
      setTimeout(function(){ poll(true); }, 5000);
      return;
    }
    if (r.player && r.villages) apply(r, false);
    if (isCmd && !r.ok && r.err) alert(r.err);
  }
  function cmd(path, body, cb){
    S.pending++;
    S.chain = S.chain.then(function(){
      var b = (typeof body === 'function') ? body() : body;
      if (!b){ if (cb) cb(null); return; }
      return Api.post(path, b).then(function(r){ handle(r, true); if (cb) cb(r); });
    }).catch(function(e){ logErr('Sync.cmd', e); })
      .then(function(){ S.pending--; });
  }
  function poll(force){
    if (!S.on || document.hidden) return;
    if (S.pending > 0 && !force) return;
    S.pending++;
    S.chain = S.chain.then(function(){
      return Api.post('/me', {}).then(function(r){ handle(r, false); });
    }).catch(function(e){ logErr('Sync.poll', e); })
      .then(function(){ S.pending--; });
  }

  /* ---------- แผนที่โลก ---------- */
  function fetchWorld(){
    return Api.get('/world', null, false).then(function(r){
      if (!r || !r.ok) return;
      var by = {}, idx = {}, L = [];
      (r.v || []).forEach(function(v){
        if (v.uid === S.uid) return;
        var o = by[v.uid];
        if (!o){ o = by[v.uid] = { uid:v.uid, name:v.pn, tag:v.gt || null, ruin:v.bot === 2, vills:[] }; L.push(o); }
        idx[v.x + ',' + v.y] = { p:o, vi:o.vills.length };
        o.vills.push({ x:v.x, y:v.y, n:v.vn, p:v.pop });
      });
      S.others = L; S.idx = idx; S.worldAt = Date.now();
      try { if (typeof Renderer !== 'undefined') Renderer.invalidate(); } catch(e){}
    });
  }
  function startTimers(){
    if (S.timers) return;
    S.timers = true;
    setInterval(poll, POLL_MS);
    setInterval(function(){
      if (document.hidden) return;
      var w = document.getElementById('page-world'), age = Date.now() - S.worldAt;
      if ((w && w.classList.contains('active') && age > 60000) || age > 300000) fetchWorld();
    }, 15000);
    document.addEventListener('visibilitychange', function(){ if (document.hidden) saveLocal(); else poll(); });
  }
  function saveLocal(){
    if (!S.uid) return;
    try { Store.setJson('sw_bm_' + S.uid, Game.bookmarks || []); } catch(e){}
  }

  /* ---------- ระบบที่ยังไม่เปิด ---------- */
  function soon(label){
    UI.modal('<h3>🚧 ' + label + '</h3><div class="infobox">ระบบนี้กำลังย้ายขึ้นเซิร์ฟเวอร์กลาง ' +
      'เพื่อให้ทุกคนเล่นบนกระดานเดียวกันอย่างยุติธรรม<br><b style="color:#ffcf40">จะเปิดในเฟสถัดไป</b></div>' +
      '<button class="btn-cancel" onclick="UI.close()">ปิด</button>');
  }
  function lock(objName, fn, feat, label){
    var o = window[objName];
    if (!o || typeof o[fn] !== 'function') return;
    var orig = o[fn];
    o[fn] = function(){ if (feature(feat)) return orig.apply(o, arguments); soon(label); };
  }

  /* ---------- ติดตั้งโหมดออนไลน์ ---------- */
  function install(){
    if (S.installed) return;
    S.installed = true;
    if (typeof War !== 'undefined') War.install();
    ORIG.enqueue = window.enqueue; ORIG.rushQueue = window.rushQueue; ORIG.cancelQueue = window.cancelQueue;

    window.enqueue = function(v, kind, slot, lv, cost, pendingB){
      var err = ORIG.enqueue(v, kind, slot, lv, cost, pendingB);
      if (err) return err;
      var key = (kind === 'city' && pendingB !== undefined && BUILDINGS[pendingB]) ? BUILDINGS[pendingB].key : null;
      cmd('/build', { vid:v.id, kind:kind, slot:slot, key:key });
      return null;
    };
    window.rushQueue = function(v, idx){
      var q = v.queue[idx];
      if (!q) return 'ไม่พบรายการ';
      var vid = v.id, kind = q.kind, slot = q.slot, r = ORIG.rushQueue(v, idx);
      if (typeof r === 'string') return r;
      cmd('/rush', function(){ var i = srvIdx(vid, kind, slot); return i < 0 ? null : { vid:vid, idx:i }; });
      return r;
    };
    window.cancelQueue = function(v, idx){
      var q = v.queue[idx];
      if (!q) return 'ไม่พบรายการ';
      var vid = v.id, kind = q.kind, slot = q.slot, r = ORIG.cancelQueue(v, idx);
      if (typeof r === 'string') return r;
      cmd('/cancel', function(){ var i = srvIdx(vid, kind, slot); return i < 0 ? null : { vid:vid, idx:i }; });
      return r;
    };
    window.save = saveLocal;
    if (typeof Net !== 'undefined'){
      Net.queueSave = function(){};
      Net.flush = function(cb){ saveLocal(); if (cb) cb(); };
      Net.list = function(){ return S.others; };
      Net.at = function(x, y){ return S.idx[x + ',' + y] || null; };
      Net.occupied = function(x, y){ return !!S.idx[x + ',' + y]; };
    }
    if (typeof UI !== 'undefined') UI.openGold = openGold;
    if (typeof HOF !== 'undefined') HOF.open = openRank;
    window.Shop = { open:openShop };
    if (typeof Social !== 'undefined') Social.install();

    lock('MilUI', 'openTrain', 'military', 'ฝึกทหาร');
    lock('MilUI', 'openRally', 'military', 'ส่งกองทัพ');
    lock('Station', 'openRaid', 'station', 'ออกรบจากฐาน');
    lock('Schedule', 'open', 'schedule', 'แผนการรบ');
    lock('Market', 'open', 'market', 'ตลาด');
    lock('Guild', 'open', 'guild', 'กิลด์');
    lock('Hero', 'open', 'hero', 'วีรบุรุษ');
    lock('Dungeon', 'open', 'dungeon', 'ดันเจี้ยน');
    lock('Conquest', 'openEndgame', 'endgame', 'ศึกชิงเมืองหลวง');
    lock('Quest', 'open', 'quest', 'ภารกิจ');
    if (typeof B3 !== 'undefined') B3.install();
    if (typeof Hero2 !== 'undefined') Hero2.install();

  }

  /* ---------- ทอง ---------- */
  function finishLocal(v, q){
    var i = v.queue.indexOf(q);
    if (i < 0) return;
    if (typeof finishItem === 'function') finishItem(v, i); else q.finish = now();
  }
  function openGold(){
    var v = V(); refresh(v);
    var act = v.queue.filter(function(q){ return q.active; });
    var h = '<h3>💰 ทองคำ — ' + Math.floor(Game.player.gold) + '</h3>' +
      '<div class="infobox">ทองใช้เร่งก่อสร้างและซื้อสิทธิพิเศษ</div>' +
      '<div class="row" style="cursor:pointer" id="g1"><span>⚡ เร่งงานทั้งหมด<br><i style="font-size:10px;color:#8a7a55">' +
      act.length + ' งานที่ช่างกำลังทำ</i></span><b style="color:#ffcf40">10 ทอง</b></div>' +
      '<div class="row" style="cursor:pointer" id="g2"><span>📦 เติมทรัพยากร<br><i style="font-size:10px;color:#8a7a55">' +
      '+1,000 ทุกชนิด</i></span><b style="color:#ffcf40">15 ทอง</b></div>';
    if (builderCount() >= 3)
      h += '<div class="row" style="opacity:.6"><span>🔨 ช่างคนที่ 3</span><b style="color:#8fbf5f">✔ ' +
        UI.dur((Game.builderUntil - now()) / 1000) + '</b></div>';
    else
      h += '<div class="row" style="cursor:pointer" id="g3"><span>🔨 จ้างช่างคนที่ 3<br><i style="font-size:10px;' +
        'color:#8a7a55">24 ชม. ทุกเมือง</i></span><b style="color:#ffcf40">25 ทอง</b></div>';
    h += '<button class="btn-use" id="gshop">💳 เติมทอง</button><button class="btn-cancel" onclick="UI.close()">ปิด</button>';
    UI.modal(h);
    document.getElementById('g1').onclick = function(){
      if (Game.player.gold < 10) return alert('ทองไม่พอ');
      if (!act.length) return alert('ไม่มีงานที่กำลังก่อสร้าง');
      Game.player.gold -= 10;
      act.forEach(function(q){ finishLocal(v, q); });
      cmd('/gold', { item:'rushall', vid:v.id });
      UI.close(); UI.refreshAll();
    };
    document.getElementById('g2').onclick = function(){
      if (Game.player.gold < 15) return alert('ทองไม่พอ');
      Game.player.gold -= 15;
      var c = caps(v);
      RES.forEach(function(r){ v.res[r] = Math.min(r === 'wheat' ? c.gran : c.store, v.res[r] + 1000); });
      cmd('/gold', { item:'refill', vid:v.id });
      UI.close(); UI.refreshAll();
    };
    var g3 = document.getElementById('g3');
    if (g3) g3.onclick = function(){
      if (Game.player.gold < 25) return alert('ทองไม่พอ');
      Game.player.gold -= 25; Game.builders = 3; Game.builderUntil = now() + 86400000;
      cmd('/gold', { item:'builder' });
      UI.close(); UI.refreshAll();
    };
    document.getElementById('gshop').onclick = openShop;
  }

  /* ---------- อันดับ ---------- */
  var rkTab = 'pop';
  function openRank(){
    UI.modal('<h3>🏆 อันดับผู้เล่น</h3><p class="stnone">กำลังโหลด…</p>');
    Api.get('/rank', { f:rkTab }, false).then(function(r){
      var h = '<h3>🏆 อันดับผู้เล่น</h3><div class="hoftabs" style="grid-template-columns:1fr 1fr">' +
        '<button class="hoft' + (rkTab === 'pop' ? ' on' : '') + '" data-rk="pop">👥 ประชากร</button>' +
        '<button class="hoft' + (rkTab === 'vc' ? ' on' : '') + '" data-rk="vc">🏘 จำนวนเมือง</button></div>';
      if (!r.ok) h += '<p class="stnone">' + esc(r.err || 'โหลดไม่สำเร็จ') + '</p>';
      else (r.list || []).forEach(function(p, i){
        var me = p.name === Game.player.name;
        h += '<div class="hof-row' + (me ? ' me' : '') + '"><div class="hof-rank r' + (i + 1) + '">' + (i + 1) +
          '</div><div class="hof-main"><b>' + esc(p.name) + (me ? ' ★' : '') + '</b><i>🏘 ' + p.vc +
          ' เมือง</i></div><div class="hof-val">' + UI.fmt(rkTab === 'vc' ? p.vc : p.pop) + '</div></div>';
      });
      h += '<button class="btn-cancel" onclick="UI.close()">ปิด</button>';
      UI.modal(h);
      document.querySelectorAll('[data-rk]').forEach(function(b){
        b.onclick = function(){ rkTab = b.dataset.rk; openRank(); };
      });
    });
  }

  /* ---------- ร้านค้า (ยังไม่เชื่อมระบบจ่ายเงินจริง) ---------- */
  function openShop(){
    UI.modal('<h3>💳 เติมทอง</h3><p class="stnone">กำลังโหลด…</p>');
    Api.get('/shop', null, false).then(function(r){
      var en = !!(r && r.enabled);
      var h = '<h3>💳 เติมทอง</h3><div class="infobox">' +
        (en ? 'เลือกแพ็กเกจที่ต้องการ' : '🚧 ระบบเติมเงินกำลังพัฒนา<br>ยังไม่เปิดให้ชำระเงินจริง') + '</div>';
      ((r && r.packages) || []).forEach(function(p){
        h += '<div class="shopc"><b>💰 ' + esc(p.name) + '<i>' + UI.fmt(p.gold) +
          (p.bonus ? ' + โบนัส ' + UI.fmt(p.bonus) : '') + ' ทอง</i></b><span>' + p.price + ' ฿</span>' +
          (en ? '<button class="mini" data-pk="' + p.id + '">ซื้อ</button>' : '') + '</div>';
      });
      h += '<button class="btn-cancel" onclick="UI.close()">ปิด</button>';
      UI.modal(h);
      document.querySelectorAll('[data-pk]').forEach(function(b){
        b.onclick = function(){
          b.disabled = true;
          Api.post('/shop/order', { pkg:b.dataset.pk }).then(function(o){
            if (!o.ok){ b.disabled = false; return alert(o.err || 'สั่งซื้อไม่สำเร็จ'); }
            UI.modal('<h3>🧾 คำสั่งซื้อ ' + esc(o.order.ref) + '</h3><div class="infobox">ทอง <b>' +
              UI.fmt(o.order.gold) + '</b> · ราคา <b>' + o.order.price + ' ฿</b><br>' + esc(o.pay && o.pay.text) +
              '</div><button class="btn-cancel" onclick="UI.close()">ปิด</button>');
          });
        };
      });
    });
  }

  /* ---------- ลบบัญชี ---------- */
  function deleteAccount(name, cb){
    Api.post('/account/delete', { name:name }).then(function(r){ cb(r.ok ? null : (r.err || 'ลบไม่สำเร็จ')); });
  }

  return { wanted:wanted, online:online, feature:feature, start:start, register:register, ready:ready,
    poll:poll, cmd:cmd, fetchWorld:fetchWorld, toast:toast, soon:soon, openGold:openGold, openRank:openRank,
    openShop:openShop, deleteAccount:deleteAccount,
    unread:function(){ return S.unread; },
    setUnread:function(n){ S.unread = n; if (typeof MilUI !== 'undefined') MilUI.updateBadge(); } };
})();