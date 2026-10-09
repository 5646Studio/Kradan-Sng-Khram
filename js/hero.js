/* ============ วีรบุรุษ v12 — 1 คนต่อเมือง ============ */

var HERO_NAMES = ['พระร่วง','ขุนแผน','พระลอ','ท้าวแสนปม','พระอภัย','ศรีปราชญ์',
  'พันท้ายนรสิงห์','ไกรทอง','นายขนมต้ม','ขุนรองปลัดชู','ทองด้วง','บุญคลี',
  'พระไวย','สุนทรภู่','เจ้าราม','ท้าวทองกีบม้า'];

var EQ_SLOTS = [
  { k:'weapon', n:'อาวุธ',      ic:'⚔️' },
  { k:'armor',  n:'เกราะ',      ic:'🛡️' },
  { k:'amulet', n:'เครื่องราง', ic:'💍' },
  { k:'boots',  n:'รองเท้า',    ic:'👢' },
  { k:'gloves', n:'ถุงมือ',     ic:'🧤' }
];

var EQ_POOL = {
  weapon: [
    { n:'ดาบไม้ฝึกหัด',   t:1, atk:15 },
    { n:'ดาบเหล็กกล้า',   t:2, atk:45 },
    { n:'ง้าวศึกโบราณ',   t:3, atk:95,  lead:3 },
    { n:'ดาบฟ้าฟื้น',     t:4, atk:180, lead:6 }
  ],
  armor: [
    { n:'เสื้อหนังเก่า',  t:1, def:12 },
    { n:'เกราะโลหะ',      t:2, def:38 },
    { n:'เกราะพญานาค',    t:3, def:80,  prod:8 },
    { n:'เกราะทองสุวรรณ', t:4, def:155, prod:16 }
  ],
  amulet: [
    { n:'ตะกรุดนำโชค',    t:1, prod:4 },
    { n:'พระเครื่อง',     t:2, prod:12, def:8 },
    { n:'สร้อยมรกต',      t:3, prod:26, lead:4 },
    { n:'จตุคามรามเทพ',   t:4, prod:52, lead:8 }
  ],
  boots: [
    { n:'รองเท้าหนัง',    t:1, spd:2 },
    { n:'รองเท้านักเดิน', t:2, spd:5 },
    { n:'รองเท้าลมกรด',   t:3, spd:9,  def:10 },
    { n:'รองเท้าครุฑ',    t:4, spd:15, def:25 }
  ],
  gloves: [
    { n:'ถุงมือผ้า',       t:1, def:8 },
    { n:'ถุงมือเหล็ก',     t:2, atk:18, def:14 },
    { n:'ถุงมือช่างศึก',   t:3, atk:40, def:30 },
    { n:'ถุงมือเทพศาสตรา',t:4, atk:85, def:60 }
  ]
};

var Hero = (function(){

  function mk(){
    return { name: HERO_NAMES[Math.floor(Math.random()*HERO_NAMES.length)],
      level:1, exp:0, free:4, atk:0, def:0, lead:0, prod:0,
      dead:false, healing:false, reviveAt:0, away:false, notified:false,
      eq:{ weapon:null, armor:null, amulet:null, boots:null, gloves:null },
      bag:[] };
  }
  function get(v){
    if (!v) return mk();
    if (!v.hero || typeof v.hero !== 'object' || !v.hero.eq) v.hero = mk();
    if (!v.hero.bag) v.hero.bag = [];
    if (v.hero.healing === undefined) v.hero.healing = false;
    return v.hero;
  }
  function expNeed(lv){ return Math.floor(80 * Math.pow(1.42, lv - 1)); }

  function bonus(v, key){
    var h = get(v), s = 0;
    for (var k in h.eq){ var it = h.eq[k]; if (it && it[key]) s += it[key]; }
    return s;
  }
  function alive(v){ return !get(v).dead; }
  function here(v){ var h = get(v); return !h.dead && !h.away; }

  function atkPower(v){
    var h = get(v);
    if (h.dead || h.away) return 0;
    return h.atk*70 + bonus(v,'atk')*6 + h.level*20;
  }
  function defPower(v){
    var h = get(v);
    if (h.dead || h.away) return 0;
    return h.def*45 + bonus(v,'def')*5 + h.level*14;
  }
  function leadBonus(v){
    var h = get(v);
    if (h.dead) return 1;
    return 1 + Math.min(0.25, h.lead*0.002 + bonus(v,'lead')*0.004);
  }
  function prodBonus(v){
    var h = get(v);
    if (h.dead) return 0;
    return h.prod*6 + bonus(v,'prod');
  }
  function speedBonus(v){
    var h = get(v);
    if (h.dead || !h.away) return 1;
    return 1 + bonus(v,'spd')*0.01;
  }

  function addExp(v, n){
    var h = get(v);
    if (h.dead || n <= 0) return false;
    h.exp += n;
    var up = false;
    while (h.exp >= expNeed(h.level) && h.level < 99){
      h.exp -= expNeed(h.level); h.level++; h.free += 4; up = true;
    }
    return up;
  }
  function spend(v, stat){
    var h = get(v);
    if (cityLevel(v, 'hero') < 1) return 'ต้องสร้างจวนวีรบุรุษก่อนจึงจะอัปคุณลักษณะได้';
    if (h.free <= 0) return 'ไม่มีแต้มเหลือ';
    h[stat]++; h.free--;
    return null;
  }

  /* ---------- อุปกรณ์ ---------- */
  function dropItem(v, tier){
    var keys = EQ_SLOTS.map(function(s){ return s.k; });
    var k = keys[Math.floor(Math.random()*keys.length)];
    var pool = EQ_POOL[k];
    var t = Math.max(0, Math.min(pool.length-1, (tier||1) - 1));
    var base = pool[t];
    var it = { id: now() + Math.floor(Math.random()*99999), slot:k, t:base.t };
    for (var p in base) if (p !== 't') it[p] = base[p];
    var h = get(v);
    h.bag.push(it);
    if (h.bag.length > 40) h.bag.shift();
    return it;
  }
  function equip(v, itemId){
    var h = get(v);
    if (cityLevel(v, 'hero') < 1) return 'ต้องสร้างจวนวีรบุรุษก่อน';
    var it = h.bag.filter(function(x){ return x.id === itemId; })[0];
    if (!it) return 'ไม่พบอุปกรณ์';
    var order = EQ_SLOTS.map(function(s){ return s.k; });
    var idx = order.indexOf(it.slot);
    if (idx >= equipSlots(cityLevel(v,'hero')))
      return 'ช่อง' + EQ_SLOTS[idx].n + ' ต้องอัปจวนวีรบุรุษเป็น Lv.' + (idx*4 + 1);
    var old = h.eq[it.slot];
    h.eq[it.slot] = it;
    h.bag = h.bag.filter(function(x){ return x.id !== itemId; });
    if (old) h.bag.push(old);
    return null;
  }
  function unequip(v, slotKey){
    var h = get(v);
    if (!h.eq[slotKey]) return 'ช่องนี้ว่างอยู่';
    h.bag.push(h.eq[slotKey]);
    h.eq[slotKey] = null;
    return null;
  }
  function sell(v, itemId){
    var h = get(v);
    var it = h.bag.filter(function(x){ return x.id === itemId; })[0];
    if (!it) return 'ไม่พบอุปกรณ์';
    var gain = it.t * 400;
    refresh(v);
    var c = caps(v);
    RES.forEach(function(r){
      var cap = (r === 'wheat') ? c.gran : c.store;
      v.res[r] = Math.min(cap, v.res[r] + gain);
    });
    h.bag = h.bag.filter(function(x){ return x.id !== itemId; });
    return gain;
  }

  /* ---------- บาดเจ็บ / รักษา ---------- */
  function kill(v){
    var h = get(v);
    if (h.dead) return false;
    h.dead = true; h.away = false; h.healing = false;
    h.reviveAt = 0; h.notified = false;
    return true;
  }
  function reviveCost(v){
    var h = get(v), f = Math.max(1, h.level);
    var disc = 1 - Math.min(0.40, cityLevel(v,'infirmary') * 0.02);
    return { wood: Math.round(260*f*disc), clay: Math.round(260*f*disc),
             iron: Math.round(340*f*disc), wheat: Math.round(200*f*disc) };
  }
  function reviveSec(v){
    var sp = 1 - Math.min(0.5, cityLevel(v,'hero') * 0.025);
    return Math.round(CFG.HERO_REVIVE_H * 3600 * sp / CFG.SPEED);
  }
  /* เริ่มรักษา — จ่ายทรัพยากรแล้วรอเวลา */
  function startHeal(v){
    var h = get(v);
    if (!h.dead) return 'วีรบุรุษยังปลอดภัยดี';
    if (h.healing) return 'กำลังรักษาอยู่แล้ว';
    var c = reviveCost(v);
    refresh(v);
    if (!canAfford(v, c)) return 'ทรัพยากรไม่พอ';
    pay(v, c);
    h.healing = true;
    h.reviveAt = now() + reviveSec(v)*1000;
    return null;
  }
  function healLeft(v){
    var h = get(v);
    return (h.dead && h.healing) ? Math.max(0, (h.reviveAt - now())/1000) : 0;
  }
  function tick(){
    var ch = false;
    Game.villages.forEach(function(v){
      var h = get(v);
      if (h.dead && h.healing && now() >= h.reviveAt){
        h.dead = false; h.healing = false; h.reviveAt = 0;
        if (typeof Military !== 'undefined' && Military.pushReport)
          Military.pushReport({ at:now(), x:v.x, y:v.y, cat:'city', mission:'hero',
            read:false, open:false, title:'⛑ วีรบุรุษฟื้นแล้ว',
            body:'<b>' + h.name + '</b> หายจากอาการบาดเจ็บ พร้อมออกรบอีกครั้ง' });
        ch = true;
      }
    });
    return ch;
  }

  /* ---------- แผงรักษา (ใช้ในจวน/โรงพยาบาล) ---------- */
  function healPanel(v){
    var h = get(v);
    if (!h.dead) return '';
    var o = '<div class="hdeadbox">💀 <b>' + h.name + ' บาดเจ็บสาหัส</b><br>';
    if (h.healing){
      var lf = healLeft(v);
      var tot = Math.max(1, reviveSec(v));
      var pct = Math.round((1 - lf/tot)*100);
      o += 'กำลังรักษาตัว · เหลืออีก <b style="color:#ffcf40">' + UI.dur(lf) + '</b>' +
        '<div class="dgbar" style="margin-top:6px"><i style="width:' + pct + '%"></i></div>' +
        '</div>';
      return o;
    }
    var c = reviveCost(v);
    o += 'ต้องจ่ายค่ารักษาแล้วรอ <b>' + UI.dur(reviveSec(v)) + '</b></div>';
    o += '<div class="bc-c">' + RES.map(function(r){
      return '<span' + (v.res[r] < c[r] ? ' class="lack"' : '') + '>' +
        RES_IC[r] + UI.fmt(c[r]) + '</span>'; }).join('') + '</div>';
    if (cityLevel(v,'infirmary') > 0)
      o += '<div class="row"><span>ส่วนลดโรงพยาบาล</span><b style="color:#8fbf5f">−' +
        Math.min(40, cityLevel(v,'infirmary')*2) + '%</b></div>';
    o += '<button class="btn-ok" id="hheal">⛑ เริ่มรักษาวีรบุรุษ</button>';
    return o;
  }
  function bindHeal(v, after){
    var b = document.getElementById('hheal');
    if (!b) return;
    b.onclick = function(){
      var e = startHeal(v);
      if (e) return alert(e);
      save(); UI.refreshAll();
      if (after) after();
    };
  }

  /* ---------- UI ---------- */
  var tab = 'stat';
  function open(t){
    if (t) tab = t;
    var v = V(); refresh(v);
    var h = get(v);
    var hl = cityLevel(v, 'hero');
    var pct = Math.round(h.exp / expNeed(h.level) * 100);

    var out = '<h3>🗿 ' + h.name + ' — ระดับ ' + h.level + '</h3>';
    out += healPanel(v);
    if (!h.dead && h.away){
      var dg = (typeof Dungeon !== 'undefined') ? Dungeon.running(v) : null;
      out += '<div class="infobox" style="border-color:#4db8ff;color:#9fd4ff">🏃 ' +
        (dg ? 'กำลังสำรวจดันเจี้ยน · เหลือ ' + UI.dur(Dungeon.left(v))
            : 'วีรบุรุษออกรบอยู่') + '</div>';
    }
    out += '<div class="hxp"><i style="width:' + pct + '%"></i>' +
      '<span>EXP ' + UI.fmt(h.exp) + ' / ' + UI.fmt(expNeed(h.level)) + '</span></div>';

    out += '<div class="btabs">' +
      '<button class="btab' + (tab==='stat'?' on':'') + '" data-ht="stat">คุณลักษณะ</button>' +
      '<button class="btab' + (tab==='eq'?' on':'') + '" data-ht="eq">อุปกรณ์</button>' +
      '<button class="btab' + (tab==='bag'?' on':'') + '" data-ht="bag">กระเป๋า' +
      (h.bag.length ? ' (' + h.bag.length + ')' : '') + '</button></div>';
    out += '<div id="hbody"></div>';
    if (hl >= 1 && typeof Dungeon !== 'undefined')
      out += '<button class="btn-use" id="hdung">🕳️ ดันเจี้ยน</button>';
    out += '<button class="btn-cancel" onclick="UI.close()">ปิด</button>';
    UI.modal(out);

    bindHeal(v, function(){ open(tab); });
    document.querySelectorAll('[data-ht]').forEach(function(b){
      b.onclick = function(){ tab = b.dataset.ht; open(); };
    });
    var dg = document.getElementById('hdung');
    if (dg) dg.onclick = function(){ Dungeon.open(); };

    if (tab === 'stat') bodyStat(v, h, hl);
    else if (tab === 'eq') bodyEq(v, h, hl, equipSlots(hl));
    else bodyBag(v, h);
  }

  function bodyStat(v, h, hl){
    var o = '';
    if (hl < 1)
      o += '<div class="bc-lock">🔒 สร้าง <b>จวนวีรบุรุษ</b> เพื่ออัปคุณลักษณะ ' +
        'สวมอุปกรณ์ และเข้าดันเจี้ยน</div>';
    o += '<div class="row"><span>แต้มที่ใช้ได้</span><b style="color:#ffcf40">' +
      h.free + '</b></div>';
    var rows = [
      { k:'atk',  ic:'⚔️', n:'โจมตี',   d:'+70 พลังโจมตีต่อแต้ม' },
      { k:'def',  ic:'🛡️', n:'ป้องกัน', d:'+45 พลังป้องกันต่อแต้ม' },
      { k:'lead', ic:'🔥', n:'นำทัพ',   d:'+0.2% โจมตีทั้งกองทัพ (สูงสุด 25%)' },
      { k:'prod', ic:'🌾', n:'ผลผลิต',  d:'+6 ทรัพยากรทุกชนิดต่อชั่วโมง' }
    ];
    rows.forEach(function(r){
      o += '<div class="hrow"><div class="hrl"><b>' + r.ic + ' ' + r.n + '</b>' +
        '<i>' + r.d + '</i></div><div class="hrv">' + h[r.k] + '</div>' +
        (h.free > 0 && hl >= 1
          ? '<button class="hplus" data-sp="' + r.k + '">+</button>'
          : '<button class="hplus" disabled>+</button>') + '</div>';
    });
    o += '<h4>พลังรวม</h4>';
    o += '<div class="row"><span>โจมตี</span><b style="color:#ff9a5a">' +
      UI.fmt(h.atk*70 + bonus(v,'atk')*6 + h.level*20) + '</b></div>';
    o += '<div class="row"><span>ป้องกัน</span><b style="color:#8fbf5f">' +
      UI.fmt(h.def*45 + bonus(v,'def')*5 + h.level*14) + '</b></div>';
    o += '<div class="row"><span>โบนัสนำทัพ</span><b style="color:#ffcf40">+' +
      Math.round((leadBonus(v)-1)*100) + '%</b></div>';
    o += '<div class="row"><span>โบนัสผลผลิต</span><b style="color:#4fd6a0">+' +
      prodBonus(v) + '/ชม. ทุกชนิด</b></div>';
    o += '<div class="row"><span>สถานะ</span><b>' +
      (h.dead ? (h.healing ? '⛑ กำลังรักษา' : '💀 รอรักษา')
              : h.away ? '🏃 ไม่อยู่ในเมือง' : '✅ อยู่ในเมือง') + '</b></div>';
    document.getElementById('hbody').innerHTML = o;
    document.querySelectorAll('[data-sp]').forEach(function(b){
      b.onclick = function(){
        var e = spend(v, b.dataset.sp);
        if (e) return alert(e);
        save(); UI.refreshAll(); open('stat');
      };
    });
  }

  function bodyEq(v, h, hl, slots){
    var o = '<div class="infobox">อุปกรณ์เพิ่มพลังโดยตรง · ได้จากดันเจี้ยน ปล้นเมืองร้าง ' +
      'โอเอซิส และป้อม<br>จวนวีรบุรุษ Lv.' + hl + ' → <b>' + slots + ' / 5 ช่อง</b></div>';
    EQ_SLOTS.forEach(function(s, i){
      var it = h.eq[s.k], lock = i >= slots;
      o += '<div class="eqrow' + (lock ? ' lock' : '') + '">' +
        '<div class="eqic">' + s.ic + '</div><div class="eqmid">' +
        (lock ? '<b style="color:#6a5f45">' + s.n + '</b><i>🔒 จวน Lv.' + (i*4+1) + '</i>'
          : it ? '<b class="t' + it.t + '">' + it.n + '</b><i>' + statLine(it) + '</i>'
               : '<b style="color:#6a5f45">' + s.n + '</b><i>ว่าง</i>') + '</div>' +
        (it && !lock ? '<button class="mini" data-uneq="' + s.k + '">ถอด</button>' : '') +
        '</div>';
    });
    document.getElementById('hbody').innerHTML = o;
    document.querySelectorAll('[data-uneq]').forEach(function(b){
      b.onclick = function(){
        var e = unequip(v, b.dataset.uneq);
        if (e) return alert(e);
        save(); UI.refreshAll(); open('eq');
      };
    });
  }

  function statLine(it){
    var p = [];
    if (it.atk)  p.push('⚔️+' + it.atk);
    if (it.def)  p.push('🛡️+' + it.def);
    if (it.lead) p.push('🔥+' + it.lead);
    if (it.prod) p.push('🌾+' + it.prod);
    if (it.spd)  p.push('🐾+' + it.spd + '%');
    return p.join(' ');
  }

  function bodyBag(v, h){
    var o = '';
    if (!h.bag.length)
      o += '<p style="color:#8a7a55;text-align:center;font-size:12px;padding:18px">' +
        'กระเป๋าว่าง<br><i style="font-size:10px">ส่งวีรบุรุษเข้าดันเจี้ยนเพื่อหาอุปกรณ์</i></p>';
    h.bag.slice().reverse().forEach(function(it){
      var sl = EQ_SLOTS.filter(function(s){ return s.k === it.slot; })[0];
      o += '<div class="eqrow"><div class="eqic">' + sl.ic + '</div>' +
        '<div class="eqmid"><b class="t' + it.t + '">' + it.n + '</b>' +
        '<i>' + statLine(it) + '</i></div>' +
        '<button class="mini" data-eq="' + it.id + '">สวม</button>' +
        '<button class="mini" data-sell="' + it.id + '" style="background:#5a3a1e">ขาย</button>' +
        '</div>';
    });
    document.getElementById('hbody').innerHTML = o;
    document.querySelectorAll('[data-eq]').forEach(function(b){
      b.onclick = function(){
        var e = equip(v, +b.dataset.eq);
        if (e) return alert(e);
        save(); UI.refreshAll(); open('bag');
      };
    });
    document.querySelectorAll('[data-sell]').forEach(function(b){
      b.onclick = function(){
        var r = sell(v, +b.dataset.sell);
        if (typeof r === 'string') return alert(r);
        save(); UI.refreshAll();
        alert('ขายได้ทรัพยากรอย่างละ ' + UI.fmt(r));
        open('bag');
      };
    });
  }

  function hook(){ /* ไม่ต้องทำอะไรแล้วใน v12 */ }

  return { mk:mk, get:get, alive:alive, here:here, addExp:addExp, spend:spend,
    atkPower:atkPower, defPower:defPower, leadBonus:leadBonus, prodBonus:prodBonus,
    speedBonus:speedBonus, bonus:bonus, dropItem:dropItem, equip:equip,
    unequip:unequip, sell:sell, kill:kill, startHeal:startHeal, healLeft:healLeft,
    reviveCost:reviveCost, reviveSec:reviveSec, healPanel:healPanel,
    bindHeal:bindHeal, tick:tick, open:open, hook:hook,
    expNeed:expNeed, statLine:statLine };
})();