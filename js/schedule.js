/* ============ แผนการรบ — ตั้งเวลาส่งทัพล่วงหน้า ============ */

var Schedule = (function(){

  function active(){ return now() < (Game.schedUntil || 0); }
  function maxSlots(v){ return rallySlots(cityLevel(v, 'rally')); }
  function mine(v){
    return (Game.sched || []).filter(function(s){ return s.from === v.id; });
  }

  function buy(){
    if (Game.player.gold < CFG.SCHED_GOLD) return 'ทองไม่พอ';
    Game.player.gold -= CFG.SCHED_GOLD;
    Game.schedUntil = Math.max(now(), Game.schedUntil||0) +
      CFG.SCHED_DAYS * 86400000;
    return null;
  }

  function add(v, tx, ty, mission, troops, fireAt, cataTarget){
    if (!active()) return 'ยังไม่ได้ปลดล็อกแผนการรบ';
    if (mine(v).length >= maxSlots(v))
      return 'ตั้งแผนได้ ' + maxSlots(v) + ' รายการ (เท่าจำนวนขบวนของลานรวมพล)';
    if (fireAt <= now() + 20000) return 'เวลาต้องอยู่หลังจากนี้อย่างน้อย 30 วินาที';
    if (fireAt > now() + 7*86400000) return 'ตั้งล่วงหน้าได้ไม่เกิน 7 วัน';
    if (Combat.count(troops) <= 0) return 'ยังไม่ได้เลือกทหาร';
    for (var id in troops)
      if ((v.troops[id]||0) < troops[id]) return 'ทหารไม่พอ';

    Game.sched.push({
      id: now() + Math.floor(Math.random()*999),
      from:v.id, tx:tx, ty:ty, mission:mission,
      troops: JSON.parse(JSON.stringify(troops)),
      cataTarget: cataTarget || null, fireAt: fireAt
    });
    Game.sched.sort(function(a,b){ return a.fireAt - b.fireAt; });
    return null;
  }
  function remove(id){
    Game.sched = (Game.sched||[]).filter(function(s){ return s.id !== id; });
  }

  function tick(){
    if (!Game.sched || !Game.sched.length) return false;
    var t = now(), fired = false;
    var due = Game.sched.filter(function(s){ return s.fireAt <= t; });
    if (!due.length) return false;
    due.forEach(function(s){
      var v = Game.villages.filter(function(g){ return g.id === s.from; })[0];
      if (!v) return;
      var err = Military.send(v, s.tx, s.ty, s.mission, s.troops, s.cataTarget);
      Military.pushReport ? null : null;
      Game.reports.unshift({ at:t, x:s.tx, y:s.ty, mission:s.mission,
        read:false, open:false,
        title: err ? '⏰ แผนการรบล้มเหลว' : '⏰ แผนการรบทำงานแล้ว',
        body: err ? 'ไม่สามารถส่งทัพไป (' + s.tx + '|' + s.ty + ') ได้<br>' +
                    'สาเหตุ: <b style="color:#ff6b6b">' + err + '</b>'
                  : 'ส่ง ' + Military.troopLine(s.troops) + '<br>ไปยัง (' +
                    s.tx + '|' + s.ty + ') · ภารกิจ ' +
                    Military.MISSIONS[s.mission].name });
      fired = true;
    });
    Game.sched = Game.sched.filter(function(s){ return s.fireAt > t; });
    return fired;
  }

  function fmtWhen(ms){
    var d = new Date(ms);
    return d.toLocaleString('th-TH', { day:'2-digit', month:'2-digit',
      hour:'2-digit', minute:'2-digit' });
  }

  function open(px, py){
    var v = V(); refresh(v);
    var h = '<h3>⏰ แผนการรบ</h3>';
    if (!active()){
      h += '<div class="infobox">ตั้งเวลาส่งกองทัพล่วงหน้าได้ — ระบุพิกัด ทหาร ' +
        'และวันเวลาที่ต้องการให้ทัพออกเดินทาง<br>' +
        'ตั้งได้พร้อมกัน <b>' + maxSlots(v) + ' รายการ</b> (เท่าจำนวนขบวนของลานรวมพล)' +
        '<br>เหมาะกับการนัดตีพร้อมกันทั้งกิลด์</div>';
      h += '<div class="row"><span>ปลดล็อก ' + CFG.SCHED_DAYS + ' วัน</span>' +
        '<b style="color:#ffcf40">' + CFG.SCHED_GOLD + ' ทอง</b></div>';
      h += '<div class="row"><span>ทองที่มี</span><b>' +
        Math.floor(Game.player.gold) + '</b></div>';
      h += '<button class="btn-ok" id="sbuy">💰 ปลดล็อกแผนการรบ</button>';
      h += '<button class="btn-cancel" onclick="UI.close()">ปิด</button>';
      UI.modal(h);
      document.getElementById('sbuy').onclick = function(){
        var err = buy();
        if (err) return alert(err);
        save(); UI.refreshAll(); open(px, py);
      };
      return;
    }

    h += '<div class="row"><span>ใช้ได้อีก</span><b style="color:#8fbf5f">' +
      UI.dur((Game.schedUntil - now())/1000) + '</b></div>';
    h += '<div class="row"><span>แผนที่ตั้งไว้</span><b>' + mine(v).length +
      ' / ' + maxSlots(v) + '</b></div>';

    var units = myUnits().filter(function(u){ return (v.troops[u.id]||0) > 0; });
    h += '<div class="coordin">' +
      '<label>X <input type="number" id="stx" value="' +
      (px !== undefined ? px : v.x) + '"></label>' +
      '<label>Y <input type="number" id="sty" value="' +
      (py !== undefined ? py : v.y+3) + '"></label></div>';
    h += '<div class="misrow">';
    ['attack','raid','scout','support'].forEach(function(mk){
      h += '<button class="misbtn' + (mk==='raid'?' on':'') + '" data-smis="' +
        mk + '">' + Military.MISSIONS[mk].ic + '<br>' +
        Military.MISSIONS[mk].name + '</button>';
    });
    h += '</div>';

    var dt = new Date(now() + 3600000);
    var pad = function(n){ return (n<10?'0':'') + n; };
    var dv = dt.getFullYear() + '-' + pad(dt.getMonth()+1) + '-' + pad(dt.getDate());
    var tv = pad(dt.getHours()) + ':' + pad(dt.getMinutes());
    h += '<div class="coordin">' +
      '<label>วันที่ <input type="date" id="sdate" value="' + dv + '"></label>' +
      '<label>เวลา <input type="time" id="stime" value="' + tv + '"></label></div>';
    h += '<div class="qkrow">' +
      '<button class="mini" data-qk="15">+15 น.</button>' +
      '<button class="mini" data-qk="60">+1 ชม.</button>' +
      '<button class="mini" data-qk="360">+6 ชม.</button>' +
      '<button class="mini" data-qk="1440">+1 วัน</button></div>';

    if (!units.length){
      h += '<p style="color:#ff6b6b;margin:9px 0;font-size:12px">ยังไม่มีทหาร</p>';
    } else {
      units.forEach(function(u){
        h += '<div class="urow2"><span>' + u.name +
          ' <i style="color:#8fbf5f">(' + v.troops[u.id] + ')</i></span>' +
          '<input type="number" min="0" value="0" id="sc_' + u.id + '">' +
          '<button class="mini" data-sall="' + u.id + '" data-n="' +
          v.troops[u.id] + '">ทั้งหมด</button></div>';
      });
      h += '<div id="seta" class="eta">—</div>';
      h += '<button class="btn-ok" id="sadd">⏰ ตั้งแผนการรบ</button>';
    }

    var ms = mine(v);
    if (ms.length){
      h += '<h4>แผนที่ตั้งไว้</h4>';
      ms.forEach(function(s){
        h += '<div class="qrow"><div class="qinfo">' +
          '<b>' + Military.MISSIONS[s.mission].ic + ' (' + s.tx + '|' + s.ty + ')</b>' +
          '<i>' + fmtWhen(s.fireAt - (Game.timeShift||0)) + ' · อีก ' +
          UI.dur((s.fireAt - now())/1000) + '<br>' +
          Military.troopLine(s.troops) + '</i></div>' +
          '<button class="qcancel" data-sdel="' + s.id + '">✕</button></div>';
      });
    }
    h += '<button class="btn-cancel" onclick="UI.close()">ปิด</button>';
    UI.modal(h);

    var mission = 'raid';
    document.querySelectorAll('[data-smis]').forEach(function(b){
      b.onclick = function(){
        mission = b.dataset.smis;
        document.querySelectorAll('.misbtn').forEach(function(x){
          x.classList.remove('on'); });
        b.classList.add('on');
      };
    });
    document.querySelectorAll('[data-qk]').forEach(function(b){
      b.onclick = function(){
        var d2 = new Date(now() + (+b.dataset.qk)*60000);
        document.getElementById('sdate').value =
          d2.getFullYear() + '-' + pad(d2.getMonth()+1) + '-' + pad(d2.getDate());
        document.getElementById('stime').value =
          pad(d2.getHours()) + ':' + pad(d2.getMinutes());
        upd();
      };
    });
    document.querySelectorAll('[data-sall]').forEach(function(b){
      b.onclick = function(){
        document.getElementById('sc_' + b.dataset.sall).value = b.dataset.n;
        upd();
      };
    });
    document.querySelectorAll('[data-sdel]').forEach(function(b){
      b.onclick = function(){
        remove(+b.dataset.sdel); save(); open(px, py);
      };
    });

    function collect(){
      var t = {};
      units.forEach(function(u){
        var n = parseInt(document.getElementById('sc_'+u.id).value, 10) || 0;
        if (n > 0) t[u.id] = Math.min(n, v.troops[u.id]);
      });
      return t;
    }
    function whenMs(){
      var dd = document.getElementById('sdate').value;
      var tt = document.getElementById('stime').value;
      if (!dd || !tt) return 0;
      return new Date(dd + 'T' + tt + ':00').getTime() + (Game.timeShift||0);
    }
    function upd(){
      var el = document.getElementById('seta');
      if (!el) return;
      var w = whenMs(), t = collect();
      var tx = parseInt(document.getElementById('stx').value, 10);
      var ty = parseInt(document.getElementById('sty').value, 10);
      if (!w || isNaN(tx) || isNaN(ty)){ el.textContent = '—'; return; }
      var sec = Combat.count(t) ? Military.travelSec(v, tx, ty, t) : 0;
      el.innerHTML = 'ออกเดินทาง <b>' + fmtWhen(w - (Game.timeShift||0)) +
        '</b> (อีก ' + UI.dur((w - now())/1000) + ')<br>' +
        'ถึงเป้าหมายใน <b>' + (sec ? UI.dur(sec) : '—') + '</b> · กำลังพล <b>' +
        Combat.count(t) + '</b> นาย';
    }
    ['stx','sty','sdate','stime'].forEach(function(i){
      var e = document.getElementById(i);
      if (e) e.oninput = upd;
    });
    units.forEach(function(u){
      document.getElementById('sc_'+u.id).oninput = upd;
    });
    upd();

    var ab = document.getElementById('sadd');
    if (ab) ab.onclick = function(){
      var tx = parseInt(document.getElementById('stx').value, 10);
      var ty = parseInt(document.getElementById('sty').value, 10);
      var err = add(v, tx, ty, mission, collect(), whenMs());
      if (err) return alert(err);
      save(); UI.refreshAll(); open(px, py);
    };
  }

  return { active:active, add:add, remove:remove, tick:tick, open:open,
    mine:mine, maxSlots:maxSlots, buy:buy };
})();