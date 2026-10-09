/* ============ ดันเจี้ยน — วีรบุรุษออกสำรวจ ============ */

var DUNGEONS = [
  { id:1, name:'ถ้ำค้างคาว',       ic:'🦇', lv:1,  min:20,
    risk:0.06, exp:120,  loot:0.45, lt:1,
    cost:{wheat:200,wood:150,iron:150,clay:150},
    desc:'ถ้ำตื้นใกล้เมือง มีค้างคาวและโจรป่าอาศัยอยู่' },
  { id:2, name:'ซากปรักปรำพุกาม',  ic:'🏚️', lv:5,  min:60,
    risk:0.11, exp:420,  loot:0.55, lt:2,
    cost:{wheat:600,wood:500,iron:550,clay:500},
    desc:'เมืองร้างที่ถูกทิ้งเมื่อร้อยปีก่อน ยังมีสมบัติหลงเหลือ' },
  { id:3, name:'ป่าลึกพญานาค',     ic:'🐉', lv:12, min:150,
    risk:0.17, exp:1300, loot:0.62, lt:2,
    cost:{wheat:1600,wood:1400,iron:1500,clay:1400},
    desc:'ป่าดิบชื้นที่ชาวบ้านไม่กล้าเข้า เล่ากันว่ามีพญานาคเฝ้าอยู่' },
  { id:4, name:'เหมืองร้างใต้ภูผา', ic:'⛏️', lv:22, min:300,
    risk:0.24, exp:3600, loot:0.70, lt:3,
    cost:{wheat:3800,wood:3200,iron:4200,clay:3200},
    desc:'เหมืองเหล็กโบราณที่ถล่มลงมา ลึกลงไปมีอะไรบางอย่าง' },
  { id:5, name:'นครบาดาล',         ic:'👑', lv:35, min:600,
    risk:0.32, exp:11000, loot:0.82, lt:4,
    cost:{wheat:9000,wood:8000,iron:10000,clay:8000},
    desc:'นครใต้บาดาลในตำนาน ผู้ที่กลับมาได้จะกลายเป็นตำนาน' }
];

var Dungeon = (function(){

  function maxTier(v){ return dungeonTier(cityLevel(v, 'hero')); }
  function running(v){ return v.dung || null; }
  function left(v){
    var d = running(v);
    return d ? Math.max(0, (d.endAt - now())/1000) : 0;
  }

  function canStart(v, id){
    var D = DUNGEONS.filter(function(x){ return x.id === id; })[0];
    if (!D) return 'ไม่พบดันเจี้ยน';
    if (cityLevel(v, 'hero') < 1) return 'ต้องสร้างจวนวีรบุรุษก่อน';
    if (D.id > maxTier(v))
      return 'ต้องอัปจวนวีรบุรุษเพื่อปลดล็อกชั้นนี้';
    var h = Hero.get(v);
    if (h.dead) return 'วีรบุรุษบาดเจ็บอยู่';
    if (h.away) return 'วีรบุรุษไม่อยู่ในเมือง';
    if (h.level < D.lv) return 'ต้องใช้วีรบุรุษระดับ ' + D.lv + ' ขึ้นไป';
    if (running(v)) return 'กำลังสำรวจอยู่แล้ว';
    refresh(v);
    if (!canAfford(v, D.cost)) return 'เสบียงไม่พอ';
    return null;
  }

  function start(v, id){
    var err = canStart(v, id);
    if (err) return err;
    var D = DUNGEONS.filter(function(x){ return x.id === id; })[0];
    pay(v, D.cost);
    Hero.get(v).away = true;
    var sp = 1 - Math.min(0.35, cityLevel(v,'hero') * 0.0175);
    v.dung = { id:id, startAt:now(),
      endAt: now() + Math.round(D.min * 60000 * sp / CFG.SPEED) };
    return null;
  }

  function finish(v){
    var d = running(v);
    if (!d) return false;
    var D = DUNGEONS.filter(function(x){ return x.id === d.id; })[0];
    v.dung = null;
    var h = Hero.get(v);
    h.away = false;

    var hurt = Math.random() < D.risk;
    var body = '<b>' + D.ic + ' ' + D.name + '</b><br>' + D.desc + '<br><br>';

    if (hurt){
      Hero.kill(v);
      body += '<span style="color:#ff6b6b">💀 วีรบุรุษบาดเจ็บสาหัสระหว่างสำรวจ ' +
        'และถูกหามกลับเมือง<br>ต้องรักษาที่จวนวีรบุรุษก่อนจึงจะออกรบได้อีก</span>';
      Military.pushReport({ at:now(), x:v.x, y:v.y, cat:'city', mission:'dungeon',
        read:false, open:false, title:'💀 สำรวจล้มเหลว — ' + D.name, body:body });
      return true;
    }

    var exp = Math.round(D.exp * (0.85 + Math.random()*0.3));
    Hero.addExp(v, exp);
    body += '<div class="rpt-g">🗿 ได้รับประสบการณ์ <b>' + UI.fmt(exp) + '</b></div>';

    var c = caps(v), gained = [];
    RES.forEach(function(r){
      var amt = Math.round(D.exp * 1.6 * (0.7 + Math.random()*0.6));
      var cap = (r === 'wheat') ? c.gran : c.store;
      v.res[r] = Math.min(cap, v.res[r] + amt);
      gained.push(RES_IC[r] + UI.fmt(amt));
    });
    body += '<div class="rpt-g">📦 ของมีค่า: ' + gained.join(' ') + '</div>';

    if (Math.random() < D.loot){
      var tier = D.lt;
      if (Math.random() < 0.22) tier = Math.min(4, tier + 1);
      var it = Hero.dropItem(v, tier);
      body += '<div class="rpt-g" style="color:#c77dff">🎁 พบอุปกรณ์: <b>' +
        it.n + '</b><br>' + Hero.statLine(it) + '</div>';
    } else {
      body += '<div class="rpt-g" style="color:#8a7a55">ไม่พบอุปกรณ์ในครั้งนี้</div>';
    }

    Military.pushReport({ at:now(), x:v.x, y:v.y, cat:'city', mission:'dungeon',
      read:false, open:false, title:'🗿 สำรวจสำเร็จ — ' + D.name, body:body });
    return true;
  }

  function tick(){
    var ch = false;
    Game.villages.forEach(function(v){
      var d = running(v);
      if (d && now() >= d.endAt){ if (finish(v)) ch = true; }
    });
    return ch;
  }

  function open(){
    var v = V(); refresh(v);
    var h = Hero.get(v);
    var hl = cityLevel(v, 'hero');
    var mt = maxTier(v);
    var run = running(v);

    var o = '<h3>🕳️ ดันเจี้ยน</h3>';
    o += '<div class="infobox">ส่งวีรบุรุษออกสำรวจเพื่อเก็บประสบการณ์ ทรัพยากร และอุปกรณ์<br>' +
      'ยิ่งชั้นลึกยิ่งได้มาก แต่เสี่ยงบาดเจ็บสูงขึ้น<br>' +
      'จวนวีรบุรุษ Lv.' + hl + ' → ปลดล็อกถึง <b>ชั้น ' + mt + '</b></div>';

    if (run){
      var D = DUNGEONS.filter(function(x){ return x.id === run.id; })[0];
      var total = Math.max(1, (run.endAt - run.startAt)/1000);
      var pct = Math.round((1 - left(v)/total) * 100);
      o += '<div class="dgrun"><b>' + D.ic + ' กำลังสำรวจ ' + D.name + '</b>' +
        '<div class="dgbar"><i style="width:' + pct + '%"></i></div>' +
        'เหลืออีก <b>' + UI.dur(left(v)) + '</b></div>';
    }

    DUNGEONS.forEach(function(D){
      var lock = D.id > mt;
      var lowlv = h.level < D.lv;
      var sp = 1 - Math.min(0.35, hl * 0.0175);
      var mins = Math.round(D.min * sp);
      o += '<div class="dgcard' + (lock ? ' lock' : '') + '">' +
        '<div class="dgh"><b>' + D.ic + ' ' + D.name + '</b>' +
        '<span>ชั้น ' + D.id + '</span></div>' +
        '<div class="dgd">' + D.desc + '</div>' +
        '<div class="dgs">' +
          '<i>🗿 ต้อง Lv.' + D.lv + '</i>' +
          '<i>⏱ ' + UI.dur(mins*60) + '</i>' +
          '<i>✨ ' + UI.fmt(D.exp) + ' EXP</i>' +
          '<i class="dgrisk">💀 ' + Math.round(D.risk*100) + '%</i>' +
          '<i>🎁 ' + Math.round(D.loot*100) + '%</i>' +
        '</div>' +
        '<div class="bc-c">' + RES.map(function(r){
          return '<span' + (v.res[r] < D.cost[r] ? ' class="lack"' : '') + '>' +
            RES_IC[r] + UI.fmt(D.cost[r]) + '</span>'; }).join('') + '</div>';
      if (lock)
        o += '<div class="bc-lock">🔒 อัปจวนวีรบุรุษเป็น Lv.' +
          ({1:1,2:4,3:8,4:13,5:18})[D.id] + ' เพื่อปลดล็อก</div>';
      else if (lowlv)
        o += '<div class="bc-lock">🔒 วีรบุรุษต้องถึงระดับ ' + D.lv +
          ' (ตอนนี้ ' + h.level + ')</div>';
      else if (!run)
        o += '<button class="btn-ok mini2" data-dg="' + D.id + '">🕳️ ออกสำรวจ</button>';
      o += '</div>';
    });
    o += '<button class="btn-cancel" onclick="UI.close()">ปิด</button>';
    UI.modal(o);

    document.querySelectorAll('[data-dg]').forEach(function(b){
      b.onclick = function(){
        var e = start(v, +b.dataset.dg);
        if (e) return alert(e);
        save(); UI.refreshAll(); open();
      };
    });
  }

  return { open:open, start:start, tick:tick, running:running, left:left,
    maxTier:maxTier, finish:finish };
})();