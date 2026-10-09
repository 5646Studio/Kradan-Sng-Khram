/* ============ Station v13d — รายการทหาร / ประจำการ / เสริมทัพ ============ */
var Station = (function(){

  function list(){ if (!Game.stationed) Game.stationed = []; return Game.stationed; }
  function byId(id){
    var L = list();
    for (var i = 0; i < L.length; i++) if (L[i].id === id) return L[i];
    return null;
  }
  function mkId(){ return 'st' + now() + Math.floor(Math.random()*9999); }
  function count(t){ var n = 0; for (var k in (t||{})) n += (t[k]||0); return n; }
  function dist(ax, ay, bx, by){ return Math.sqrt((ax-bx)*(ax-bx) + (ay-by)*(ay-by)); }
  function uIcon(u){
    try { if (typeof MilUI !== 'undefined' && MilUI.unitIcon) return MilUI.unitIcon(u); }
    catch(e){}
    return '⚔️';
  }
  function tline(t){
    var a = [];
    for (var k in (t||{})){
      if (!t[k]) continue;
      var u = U(k);
      a.push((u ? uIcon(u) + ' ' + u.name : k) + ' ×' + UI.fmt(t[k]));
    }
    return a.length ? a.join(' · ') : '—';
  }
  function ownerOf(st){
    return Game.villages.filter(function(g){ return g.id === st.ownerVid; })[0];
  }

  /* ---------- ทหารมาถึงปลายทาง ---------- */
  function onSupportArrive(mv){
    try {
      if (!mv || mv.mission !== 'support' || mv.returning) return false;
      var owner = Game.villages.filter(function(g){ return g.id === mv.from; })[0];
      if (!owner || !count(mv.troops)) return false;
      var hv = Game.villages.filter(function(g){
        return g.x === mv.tx && g.y === mv.ty; })[0];
      var be = (!hv && typeof Bots !== 'undefined' && Bots.at) ? Bots.at(mv.tx, mv.ty) : null;
      if (!hv && !be) return false;
      var own = !!hv, hostName = own ? hv.name : be.bot.name;

      var st = null;
      list().forEach(function(s){
        if (s.ownerVid === owner.id && s.x === mv.tx && s.y === mv.ty) st = s;
      });
      if (st){
        for (var k in mv.troops) st.troops[k] = (st.troops[k]||0) + mv.troops[k];
        st.raids = 0;
      } else {
        st = { id:mkId(), ownerVid:owner.id, ownerName:owner.name,
          x:mv.tx, y:mv.ty, hostVid: own ? hv.id : null,
          hostBot: own ? null : be.bot.id, hostName:hostName, own:own,
          troops: JSON.parse(JSON.stringify(mv.troops)),
          raids:0, max:3, canCommand: own ? true : !!mv.canCommand, since:now() };
        list().push(st);
      }
      if (Military.pushReport) Military.pushReport({ at:now(), x:mv.tx, y:mv.ty,
        cat:'war', mission:'support', read:false, open:false,
        title:'🛡 กำลังหนุนถึงปลายทาง',
        body:'ทหารจาก <b>' + owner.name + '</b> ' + count(mv.troops) +
          ' นาย ประจำการที่ <b>' + hostName + '</b><br>ออกรบจากฐานได้ <b>' +
          (st.max - st.raids) + ' ครั้ง</b> · เสบียงหักจากเมือง ' + owner.name });
      return true;
    } catch(e){ logErr('Station.arrive', e); return false; }
  }

  /* ---------- พลังป้องกัน / เสบียง ---------- */
  function defPower(v){
    if (!v) return 0;
    var s = 0;
    list().forEach(function(st){
      if (st.hostVid !== v.id) return;
      for (var k in st.troops){ var u = U(k); if (u) s += st.troops[k]*((u.di+u.dc)/2); }
    });
    if (typeof BotAI !== 'undefined' && BotAI.allyDef) s += BotAI.allyDef(v);
    return Math.round(s);
  }
  function defList(v){ return list().filter(function(st){ return st.hostVid === v.id; }); }
  function upkeep(v){
    if (!v) return 0;
    var s = 0;
    list().forEach(function(st){
      if (st.ownerVid !== v.id) return;
      for (var k in st.troops){ var u = U(k); if (u) s += st.troops[k]*u.up; }
    });
    return Math.round(s);
  }
  function mine(v){ return list().filter(function(st){ return st.ownerVid === v.id; }); }

  /* ---------- ออกรบจากฐาน ---------- */
  function raid(stId, tx, ty, mission, troops){
    var st = byId(stId);
    if (!st) return 'ไม่พบกองทหาร';
    if (st.raids >= st.max) return 'ใช้โควตาครบ ' + st.max + ' ครั้งแล้ว';
    var owner = ownerOf(st);
    if (!owner) return 'ไม่พบเมืองเจ้าของทหาร';
    if (isNaN(tx) || isNaN(ty)) return 'พิกัดไม่ถูกต้อง';
    if (!count(troops)) return 'ยังไม่ได้เลือกทหาร';
    for (var k in troops) if ((st.troops[k]||0) < troops[k]) return 'ทหารในฐานไม่พอ';
    if (tx === st.x && ty === st.y) return 'เป้าหมายคือฐานตัวเอง';

    var minSpd = 99;
    for (var k2 in troops){
      var u = U(k2); if (u && u.spd < minSpd) minSpd = u.spd;
      st.troops[k2] -= troops[k2];
      if (st.troops[k2] <= 0) delete st.troops[k2];
    }
    st.raids++;
    var last = st.raids >= st.max;
    var sec = Math.max(60, Math.round(dist(st.x, st.y, tx, ty) / minSpd * 3600 / CFG.SPEED));
    Game.movements.push({ id: now() + Math.floor(Math.random()*999),
      from: owner.id, fx: st.x, fy: st.y, tx:tx, ty:ty, mission:mission,
      troops:troops, cataTarget:null, hero:false, station:st.id, stLast:last,
      lootTo: st.own ? (st.hostVid || owner.id) : owner.id,
      departAt: now(), arriveAt: now() + sec*1000, returning:false, loot:null });
    removeIfEmpty(st);
    return null;
  }
  function onReturnStart(mv){
    try {
      if (!mv.station) return;
      var st = byId(mv.station);
      var owner = Game.villages.filter(function(g){ return g.id === mv.from; })[0];
      if (!owner) return;
      if (!st || mv.stLast){ mv.station = null; mv.tx = owner.x; mv.ty = owner.y; }
      else { mv.tx = st.x; mv.ty = st.y; }
    } catch(e){ logErr('Station.return', e); }
  }
  function absorbReturn(mv){
    try {
      if (!mv.station) return false;
      var st = byId(mv.station);
      if (!st) return false;
      for (var k in mv.troops) st.troops[k] = (st.troops[k]||0) + mv.troops[k];
      return true;
    } catch(e){ logErr('Station.absorb', e); return false; }
  }
  function removeIfEmpty(st){
    if (count(st.troops) > 0) return;
    if (st.raids < st.max) return;
    Game.stationed = list().filter(function(s){ return s.id !== st.id; });
  }
  function recall(stId){
    var st = byId(stId);
    if (!st) return 'ไม่พบกองทหาร';
    var owner = ownerOf(st);
    if (!owner) return 'ไม่พบเมืองเจ้าของ';
    if (!count(st.troops)) return 'ไม่มีทหารในฐาน';
    var minSpd = 99;
    for (var k in st.troops){ var u = U(k); if (u && u.spd < minSpd) minSpd = u.spd; }
    var sec = Math.max(60, Math.round(dist(st.x, st.y, owner.x, owner.y) / minSpd * 3600 / CFG.SPEED));
    Game.movements.push({ id: now() + Math.floor(Math.random()*999),
      from: owner.id, fx: st.x, fy: st.y, tx: owner.x, ty: owner.y,
      mission:'support', troops: JSON.parse(JSON.stringify(st.troops)),
      hero:false, station:null, returning:true,
      departAt: now(), arriveAt: now() + sec*1000, loot:null });
    Game.stationed = list().filter(function(s){ return s.id !== st.id; });
    return null;
  }
  function tick(){
    var before = list().length;
    Game.stationed = list().filter(function(s){
      return count(s.troops) > 0 || (Game.movements||[]).some(function(m){
        return m.station === s.id; });
    });
    return list().length !== before;
  }

  /* ---------- หน้ารายการทหาร ---------- */
  function open(){
    var v = V(); refresh(v);
    var t0 = now(), home = v.troops || {};
    var hk = Object.keys(home).filter(function(k){ return home[k] > 0 && U(k); });
    var h = '<h3>🛡 กองทัพ — ' + v.name + '</h3>';

    h += '<h4>🏠 ทหารในเมือง · ' + UI.fmt(count(home)) + ' นาย</h4>';
    if (!hk.length){
      h += '<p class="stnone">ยังไม่มีทหารในเมือง<br>ฝึกได้ที่ค่ายทหาร / คอกม้า / โรงงาน</p>';
    } else {
      h += '<table class="ttab"><tr><th>หน่วย</th><th>จำนวน</th><th>⚔</th>' +
        '<th>🛡</th><th>🌾/ชม.</th></tr>';
      hk.forEach(function(k){
        var u = U(k), n = home[k];
        h += '<tr><td>' + uIcon(u) + ' ' + u.name + '</td><td><b>' + UI.fmt(n) +
          '</b></td><td>' + UI.fmt(u.atk*n) + '</td><td>' +
          UI.fmt(Math.round((u.di+u.dc)/2*n)) + '</td><td>' + UI.fmt(u.up*n) + '</td></tr>';
      });
      h += '</table>';
    }
    var hh = Hero.get(v);
    h += '<div class="row"><span>🗿 ' + hh.name + ' Lv.' + hh.level + '</span><b>' +
      (hh.dead ? (hh.healing ? '⛑ กำลังรักษา' : '💀 บาดเจ็บ')
               : hh.away ? '🏃 อยู่นอกเมือง' : '✅ อยู่ในเมือง') + '</b></div>';
    h += '<div class="grow2"><button class="btn-ok mini2" id="stSend">⚔ ส่งกองทัพ</button>' +
      (cityLevel(v,'barracks') > 0
        ? '<button class="btn-use mini2" id="stTrain">🏋 ฝึกทหาร</button>' : '') + '</div>';

    var mv = (Game.movements||[]).filter(function(m){ return m.from === v.id; });
    h += '<h4>🏹 กำลังเดินทาง (' + mv.length + ')</h4>';
    if (!mv.length) h += '<p class="stnone">ไม่มีกองทัพเดินทาง</p>';
    mv.forEach(function(m){
      var mi = (Military.MISSIONS || {})[m.mission];
      h += '<div class="stcard"><div class="vh"><b>' +
        (m.returning ? '↩ กลับเมือง' : (mi ? mi.ic + ' ' + mi.name : 'ส่งทัพ') +
        ' → (' + m.tx + '|' + m.ty + ')') + '</b><span>' +
        UI.dur((m.arriveAt - t0)/1000) + '</span></div><div class="stline">' +
        tline(m.troops) + (m.hero ? ' · 🗿' : '') + '</div></div>';
    });

    var out = mine(v);
    h += '<h4>🛡 ประจำการที่อื่น (' + out.length + ')</h4>';
    if (!out.length) h += '<p class="stnone">ไม่มีทหารประจำการนอกเมือง</p>';
    out.forEach(function(st){
      var left = st.max - st.raids, dots = '';
      for (var i = 0; i < st.max; i++) dots += '<em class="' + (i < st.raids ? 'used' : '') + '"></em>';
      h += '<div class="stcard"><div class="vh"><b>' + (st.own ? '🏘 ' : '🏯 ') + st.hostName +
        '</b><span>(' + st.x + '|' + st.y + ')</span></div>' +
        '<div class="stline">' + tline(st.troops) + '</div>' +
        '<div class="stbar"><i>⚔ โควตา</i><span class="stdots">' + dots + '</span>' +
        '<b style="color:' + (left ? '#8fbf5f' : '#ff6b6b') + '">เหลือ ' + left + '/' +
        st.max + '</b></div><div class="grow2">' +
        (left && count(st.troops) ? '<button class="btn-use mini2" data-raid="' + st.id +
          '">⚔ ออกรบจากที่นี่</button>' : '') +
        (count(st.troops) ? '<button class="btn-del mini2" data-rec="' + st.id +
          '">↩ เรียกกลับ</button>' : '') + '</div></div>';
    });

    var inn = defList(v);
    var ally = (typeof BotAI !== 'undefined' && BotAI.allyList) ? BotAI.allyList(v) : [];
    h += '<h4>🤝 กำลังหนุนในเมือง (' + (inn.length + ally.length) + ')</h4>';
    if (!inn.length && !ally.length) h += '<p class="stnone">ยังไม่มีใครส่งกำลังหนุนมา</p>';
    inn.forEach(function(st){
      h += '<div class="stcard ally"><div class="vh"><b>จาก ' + st.ownerName +
        '</b><span>' + count(st.troops) + ' นาย</span></div><div class="stline">' +
        tline(st.troops) + '</div></div>';
    });
    ally.forEach(function(s){
      h += '<div class="stcard ally"><div class="vh"><b>จาก ' + s.who + '</b><span>' +
        s.n + ' นาย</span></div><div class="stline">' + (s.until ? 'ประจำการ · +' +
        UI.fmt(s.power) + ' ป้องกัน' : 'กำลังเดินทางมา') + '</div></div>';
    });

    h += '<div class="row"><span>เสบียงกองทัพรวม</span><b style="color:#ff9a5a">−' +
      UI.fmt(Military.upkeep ? Military.upkeep(v) : 0) + ' 🌾/ชม.</b></div>';
    h += '<div class="row"><span>พลังป้องกันเสริม</span><b style="color:#8fbf5f">+' +
      UI.fmt(defPower(v)) + '</b></div>';
    h += '<button class="btn-cancel" onclick="UI.close()">ปิด</button>';
    UI.modal(h);

    var sb = document.getElementById('stSend');
    if (sb) sb.onclick = function(){ MilUI.openRally(); };
    var tb = document.getElementById('stTrain');
    if (tb) tb.onclick = function(){ MilUI.openTrain('barracks'); };
    document.querySelectorAll('[data-rec]').forEach(function(b){
      b.onclick = function(){
        if (!confirm('เรียกทหารกลับเมือง?')) return;
        var e = recall(b.dataset.rec);
        if (e) return alert(e);
        save(); UI.refreshAll(); open();
      };
    });
    document.querySelectorAll('[data-raid]').forEach(function(b){
      b.onclick = function(){ openRaid(b.dataset.raid); };
    });
  }

  function openRaid(stId){
    var st = byId(stId);
    if (!st) return;
    var owner = ownerOf(st);
    var ks = Object.keys(st.troops).filter(function(k){ return st.troops[k] > 0 && U(k); });
    var h = '<h3>⚔ ออกรบจาก ' + st.hostName + '</h3>';
    h += '<div class="infobox">ฐาน (' + st.x + '|' + st.y + ') · เจ้าของทหาร <b>' +
      (owner ? owner.name : '-') + '</b><br>โควตาเหลือ <b>' + (st.max - st.raids) +
      '/' + st.max + '</b><br>ของที่ปล้นได้เข้าเมือง <b>' +
      (st.own ? st.hostName : (owner ? owner.name : '-')) + '</b></div>';
    h += '<div class="tgrid2">';
    ks.forEach(function(k){
      var u = U(k), have = st.troops[k];
      h += '<div class="tcell"><span class="tic">' + uIcon(u) + '</span>' +
        '<input type="number" min="0" max="' + have + '" value="0" id="r_' + k + '">' +
        '<b class="thave" data-sall="' + k + '" data-n="' + have + '">/' + have + '</b></div>';
    });
    h += '</div><div class="destbox"><div class="drow2"><label>X</label>' +
      '<input type="number" id="rx" value="' + st.x + '"><label>Y</label>' +
      '<input type="number" id="ry" value="' + st.y + '"></div></div>';
    h += '<div class="misrow2">' +
      '<label class="misr"><input type="radio" name="rmis" value="raid" checked><span>💰 ปล้น</span></label>' +
      '<label class="misr"><input type="radio" name="rmis" value="attack"><span>⚔️ โจมตีปกติ</span></label>' +
      '<label class="misr"><input type="radio" name="rmis" value="scout"><span>👁️ สอดแนม</span></label></div>';
    h += '<button class="btn-ok" id="rgo">⚔ ส่งออกรบ (ใช้ 1 ครั้ง)</button>' +
      '<button class="btn-cancel" id="rback">ย้อนกลับ</button>';
    UI.modal(h);
    document.querySelectorAll('[data-sall]').forEach(function(b){
      b.onclick = function(){ document.getElementById('r_' + b.dataset.sall).value = b.dataset.n; };
    });
    document.getElementById('rback').onclick = open;
    document.getElementById('rgo').onclick = function(){
      var t = {};
      ks.forEach(function(k){
        var n = parseInt(document.getElementById('r_' + k).value, 10) || 0;
        if (n > 0) t[k] = Math.min(n, st.troops[k] || 0);
      });
      var e = raid(stId, parseInt(document.getElementById('rx').value, 10),
        parseInt(document.getElementById('ry').value, 10),
        document.querySelector('input[name=rmis]:checked').value, t);
      if (e) return alert(e);
      save(); UI.refreshAll(); UI.close();
    };
  }

  return { open:open, openRaid:openRaid, raid:raid, recall:recall,
    onSupportArrive:onSupportArrive, onReturnStart:onReturnStart,
    absorbReturn:absorbReturn, defPower:defPower, defList:defList,
    upkeep:upkeep, mine:mine, list:list, tick:tick, byId:byId };
})();