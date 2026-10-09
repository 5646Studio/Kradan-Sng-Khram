var SAVE_LOCK = false;

var Game = {
  player: { name:'ผู้เล่น', gold:CFG.START_GOLD, cp:0, quadrant:1,
            tribe:0, slotsEarned:1, slotsUsed:1 },
  villages: [], active: 0, startedAt: Date.now(), timeShift: 0,
  protectUntil: 0, protectBroken: false,
  movements: [], incoming: [], reports: [], npc: {},
  oasis: {}, forts: {}, trades: [],
  capital: { owner:null, since:0, loyalty:100 },
  guild: null, pendingApp: null, allies: [], enemies: [],
  bots: null, guilds: null, offers: [], offerAt: 0,
  sched: [], schedUntil: 0,
  stats: { atkPts:0, defPts:0, raidPts:0 },
  quest: 0, questDone: [], tutorialSkip: true,
  builders: 2, builderUntil: 0,
  won: false
};

var PROD_TABLE = [3, 7, 13, 21, 31, 46, 70, 98, 140, 203, 280,
                  375, 495, 635, 800, 1000, 1300, 1600, 2000, 2450, 2450];
var POP_TABLE  = [0, 2, 1, 1, 1, 2, 2, 2, 3, 4, 4, 5, 5, 6, 7, 7, 8, 9, 10, 11, 12];

function fieldProd(lv){ return PROD_TABLE[Math.max(0, Math.min(20, lv))]; }
function fieldPopAt(lv){
  var p = 0;
  for (var i = 1; i <= Math.min(20, lv); i++) p += POP_TABLE[i];
  return p;
}
var FIELD_BASE = {
  wood:  { wood:40,  clay:100, iron:50, wheat:60 },
  clay:  { wood:80,  clay:40,  iron:80, wheat:50 },
  iron:  { wood:100, clay:80,  iron:30, wheat:60 },
  wheat: { wood:70,  clay:90,  iron:70, wheat:20 }
};
function fieldCost(res, lv){
  var base = FIELD_BASE[res], f = Math.pow(1.52, lv-1), o = {};
  RES.forEach(function(r){ o[r] = Math.round(base[r]*f); });
  return o;
}
function buildCost(bi, lv){
  var base = BUILDINGS[bi].cost, f = Math.pow(1.28, lv-1), o = {};
  RES.forEach(function(r){ o[r] = Math.round(base[r]*f); });
  return o;
}
function buildTime(lv, mb){
  var s = Math.round(240 * Math.pow(1.55, lv-1) * Math.pow(0.964, mb||0) / CFG.SPEED);
  return (!isFinite(s) || s < 5) ? 5 : s;
}
function popOf(lv){
  var p = 0;
  for (var i = 1; i <= lv; i++){
    if (i <= 5) p += 1; else if (i <= 10) p += 2;
    else if (i <= 15) p += 3; else p += 4;
  }
  return p;
}
function capacity(lv){
  return lv <= 0 ? CFG.BASE_CAP : CFG.BASE_CAP + Math.floor(1200*Math.pow(1.25, lv-1));
}
function greatCap(lv){ return lv <= 0 ? 0 : Math.floor(2000*Math.pow(1.28, lv-1)); }
function now(){ return Date.now() + (Game.timeShift || 0); }
function daysNow(){ return (now() - Game.startedAt) / 86400000 * CFG.SPEED; }
function isProtected(){ return !Game.protectBroken && now() < Game.protectUntil; }
function breakProtection(){ Game.protectBroken = true; }

function newVillage(x, y, name, isFirst){
  var lay = isFirst ? START_LAYOUT : (World.tile(x, y).layout || LAYOUTS[0]);
  var fields = [], i;
  for (i = 0; i < lay.wheat; i++) fields.push({ res:'wheat', level:0 });
  for (i = 0; i < lay.wood;  i++) fields.push({ res:'wood',  level:0 });
  for (i = 0; i < lay.iron;  i++) fields.push({ res:'iron',  level:0 });
  for (i = 0; i < lay.clay;  i++) fields.push({ res:'clay',  level:0 });
  while (fields.length < 20) fields.push({ res:'wheat', level:0 });
  fields.length = 20;

  var city = [];
  for (var j = 0; j < 21; j++) city.push({ b:0, level:0 });
  city[0] = { b:bIndex('main'),  level:1 };
  city[1] = { b:bIndex('rally'), level:1 };

  return {
    id: now() + Math.floor(Math.random()*1000),
    x:x, y:y, name:name, firstCity: !!isFirst,
    fields:fields, city:city, layoutName:lay.nm, rare:lay.rare||0,
    wallLv: 0,
    res: { wheat:CFG.START_RES.wheat, wood:CFG.START_RES.wood,
           iron:CFG.START_RES.iron, clay:CFG.START_RES.clay },
    resAt: now(), queue: [], troops: {}, train: {},
    hero: (typeof Hero !== 'undefined' ? Hero.mk() : null),
    dung: null, loyalty: 100, loyaltyAt: now(),
    captured: false, settlersUsed: 0
  };
}
function V(){ return Game.villages[Game.active]; }

function cityLevel(v, key){
  if (!v) return 0;
  if (key === 'wall') return v.wallLv || 0;
  var idx = bIndex(key), lv = 0;
  for (var i = 0; i < v.city.length; i++)
    if (v.city[i].b === idx && v.city[i].level > lv) lv = v.city[i].level;
  return lv;
}
function sumLevel(v, key){
  var idx = bIndex(key), s = 0;
  for (var i = 0; i < v.city.length; i++)
    if (v.city[i].b === idx) s += v.city[i].level;
  return s;
}
function sumCapacity(v, key){
  var idx = bIndex(key), s = 0, found = false;
  for (var i = 0; i < v.city.length; i++)
    if (v.city[i].b === idx && v.city[i].level > 0){
      s += capacity(v.city[i].level) - CFG.BASE_CAP; found = true;
    }
  return found ? s + CFG.BASE_CAP : CFG.BASE_CAP;
}
function sumGreatCap(v, key){
  var idx = bIndex(key), s = 0;
  for (var i = 0; i < v.city.length; i++)
    if (v.city[i].b === idx) s += greatCap(v.city[i].level);
  return s;
}
/* ★ เมืองหลวง = เมืองที่มีพระราชวัง ★ */
function isCapital(v){ return cityLevel(v, 'palace') >= 1; }
function capitalOf(){
  for (var i = 0; i < Game.villages.length; i++)
    if (isCapital(Game.villages[i])) return Game.villages[i];
  return null;
}
function biomeBonus(v, res){
  if (v.firstCity) return 0;
  var t = World.tile(v.x, v.y);
  return (t.info.bonus && t.info.bonus[res]) || 0;
}
function production(v, res){
  var bb = biomeBonus(v, res);
  var ob = (typeof Conquest !== 'undefined' && Conquest.oasisBonus)
    ? Conquest.oasisBonus(v, res) : 0;
  var hb = (typeof Hero !== 'undefined') ? Hero.prodBonus(v) : 0;
  var mb = 0;
  BUILDINGS.forEach(function(b){
    if (b.boost === res) mb += sumLevel(v, b.key) * 0.05;
  });
  var sum = 0;
  v.fields.forEach(function(f){
    if (f.res !== res) return;
    sum += fieldProd(f.level) * (1 + bb + ob) * (1 + mb);
  });
  return Math.floor(sum + hb);
}
function population(v){
  var p = 2;
  v.fields.forEach(function(f){ p += fieldPopAt(f.level); });
  v.city.forEach(function(c){ if (c.b) p += popOf(c.level); });
  p += popOf(v.wallLv || 0);
  return p;
}
function netWheat(v){
  return production(v, 'wheat') - population(v)
    - (typeof Military !== 'undefined' ? Military.upkeep(v) : 0);
}
function caps(v){
  return {
    store: sumCapacity(v, 'warehouse') + sumGreatCap(v, 'greatwarehouse'),
    gran:  sumCapacity(v, 'granary')   + sumGreatCap(v, 'greatgranary')
  };
}
function refresh(v){
  if (!v) return;
  var t = now();
  var dt = (t - v.resAt) / 3600000;
  if (dt <= 0){ v.resAt = t; return; }
  var c = caps(v);
  RES.forEach(function(r){
    var rate = (r === 'wheat') ? netWheat(v) : production(v, r);
    var cap  = (r === 'wheat') ? c.gran : c.store;
    v.res[r] = Math.max(0, Math.min(cap, v.res[r] + rate*dt));
  });
  v.resAt = t;
  loyaltyTick(v);
}
function loyaltyRate(v){
  var r = 1.0;
  r += cityLevel(v, 'residence') * 0.1;
  r += cityLevel(v, 'palace') * 0.2;
  r += cityLevel(v, 'temple') * 0.3;
  if (typeof Conquest !== 'undefined' && Conquest.B_LOYAL) r *= Conquest.B_LOYAL();
  return r;
}
function loyaltyTick(v){
  if (v.loyalty === undefined){ v.loyalty = 100; v.loyaltyAt = now(); }
  var dt = (now() - (v.loyaltyAt || now())) / 3600000;
  if (dt <= 0) return;
  v.loyalty = Math.min(100, v.loyalty + loyaltyRate(v) * dt);
  v.loyaltyAt = now();
}
function canAfford(v, cost){
  return RES.every(function(r){ return v.res[r] >= (cost[r]||0); });
}
function pay(v, cost){ RES.forEach(function(r){ v.res[r] -= (cost[r]||0); }); }

function builderCount(){
  if (Game.builderUntil && now() > Game.builderUntil){
    Game.builders = 2; Game.builderUntil = 0;
  }
  return Game.builders || 2;
}
function queueMax(){ return builderCount() + 2; }
function activeCount(v){
  var n = 0;
  v.queue.forEach(function(q){ if (q.active) n++; });
  return n;
}
function enqueue(v, kind, slot, targetLevel, cost, pendingB){
  for (var i = 0; i < v.queue.length; i++)
    if (v.queue[i].kind === kind && v.queue[i].slot === slot)
      return 'ช่องนี้กำลังก่อสร้างอยู่แล้ว ต้องรอให้เสร็จก่อน';
  if (v.queue.length >= queueMax())
    return 'คิวเต็ม (ช่าง ' + builderCount() + ' คน · รอได้อีก 2)';
  refresh(v);
  if (!canAfford(v, cost)) return 'ทรัพยากรไม่พอ';
  var sec = buildTime(targetLevel, cityLevel(v, 'main'));
  pay(v, cost);
  var t0 = now();
  var item = { kind:kind, slot:slot, level:targetLevel, sec:sec,
    cost: JSON.parse(JSON.stringify(cost)), active:false, finish:0, start:0 };
  if (pendingB !== undefined) item.pendingB = pendingB;
  if (activeCount(v) < builderCount()){
    item.active = true; item.start = t0; item.finish = t0 + sec*1000;
  }
  v.queue.push(item);
  return null;
}
function cancelQueue(v, idx){
  var q = v.queue[idx];
  if (!q) return 'ไม่พบรายการ';
  refresh(v);
  var ratio = 1;
  if (q.active){
    var prog = Math.max(0, Math.min(1, (now() - q.start)/1000/q.sec));
    ratio = Math.max(0.2, 1 - prog);
  }
  var c = caps(v), back = {};
  RES.forEach(function(r){
    var amt = Math.floor((q.cost[r]||0) * ratio);
    var cap = (r === 'wheat') ? c.gran : c.store;
    v.res[r] = Math.min(cap, v.res[r] + amt);
    back[r] = amt;
  });
  if (q.kind === 'city' && q.pendingB !== undefined && q.level === 1)
    v.city[q.slot] = { b:0, level:0 };
  v.queue.splice(idx, 1);
  fillBuilders(v);
  return { back:back, pct: Math.round(ratio*100) };
}
function fillBuilders(v){
  while (activeCount(v) < builderCount()){
    var nx = null;
    for (var j = 0; j < v.queue.length; j++)
      if (!v.queue[j].active){ nx = v.queue[j]; break; }
    if (!nx) break;
    nx.active = true; nx.start = now(); nx.finish = now() + nx.sec*1000;
  }
}
function processQueue(v){
  var t = now(), changed = false;
  for (var i = v.queue.length - 1; i >= 0; i--){
    var q = v.queue[i];
    if (!q.active) continue;
    if (!isFinite(q.finish) || q.finish < q.start){
      q.start = t; q.finish = t + (q.sec || 60)*1000; continue;
    }
    if (q.finish > t) continue;
    refresh(v);
    if (q.kind === 'field') v.fields[q.slot].level = q.level;
    else if (q.kind === 'wall') v.wallLv = q.level;
    else {
      v.city[q.slot].level = q.level;
      if (q.pendingB !== undefined) v.city[q.slot].b = q.pendingB;
    }
    v.queue.splice(i, 1);
    changed = true;
  }
  var before = activeCount(v);
  fillBuilders(v);
  if (activeCount(v) !== before) changed = true;
  return changed;
}

/* ★ เร่งงานด้วยทอง — เสร็จทันทีจริง ★ */
function finishItem(v, idx){
  var q = v.queue[idx];
  if (!q) return false;
  refresh(v);
  if (q.kind === 'field') v.fields[q.slot].level = q.level;
  else if (q.kind === 'wall') v.wallLv = q.level;
  else {
    if (q.pendingB !== undefined) v.city[q.slot].b = q.pendingB;
    v.city[q.slot].level = q.level;
  }
  v.queue.splice(idx, 1);
  fillBuilders(v);
  return true;
}
function rushQueue(v, idx){
  var q = v.queue[idx];
  if (!q) return 'ไม่พบรายการ';
  var left = q.active ? Math.max(0, (q.finish - now())/1000) : (q.sec || 60);
  var g = goldRush(left);
  if (Game.player.gold < g) return 'ทองไม่พอ (ต้องใช้ ' + g + ')';
  Game.player.gold -= g;
  finishItem(v, idx);
  return { gold:g };
}

function cpPerDay(){
  var total = 0;
  Game.villages.forEach(function(v){
    v.city.forEach(function(c){
      if (!c.b || !c.level) return;
      total += Math.floor((BUILDINGS[c.b].cp||0) * Math.pow(1.18, c.level-1));
    });
  });
  return total;
}
function canFoundVillage(){
  var n = Game.villages.length + 1;
  var need = cpForVillage(n);
  if (Game.player.cp < need)
    return 'ต้องมี Culture Points ' + UI.fmt(need) + ' (ตอนนี้ ' +
      UI.fmt(Math.floor(Game.player.cp)) + ')';
  return null;
}

function save(){
  if (SAVE_LOCK) return;
  try { Store.set(CFG.SAVE_KEY, JSON.stringify(Game)); }
  catch(e){ logErr('save', e); }
  try { if (typeof Net !== 'undefined' && Net.enabled()) Net.queueSave(); }
  catch(e){ logErr('netSave', e); }
}

function migrate(){
  var wi = bIndex('wall'), ti = bIndex('watchtower');
  Game.villages.forEach(function(v){
    if (v.wallLv === undefined){
      v.wallLv = 0;
      v.city.forEach(function(c, ci){
        if (c.b === wi){ v.wallLv = Math.max(v.wallLv, c.level);
          v.city[ci] = { b:0, level:0 }; }
      });
    }
    var best = 0, slots = [];
    v.city.forEach(function(c, i){
      if (!c.b) return;
      if (c.b >= BUILDINGS.length){ v.city[i] = { b:0, level:0 }; return; }
      var k = BUILDINGS[c.b].key;
      if (k === 'watchtower' || k === 'beacon'){
        best = Math.max(best, c.level); slots.push(i);
      }
      if (k === 'school' || k === 'wall') v.city[i] = { b:0, level:0 };
    });
    if (slots.length > 1){
      v.city[slots[0]] = { b:ti, level:best };
      for (var s = 1; s < slots.length; s++) v.city[slots[s]] = { b:0, level:0 };
    }
    while (v.city.length > 21) v.city.pop();
    while (v.city.length < 21) v.city.push({ b:0, level:0 });

    if (!v.hero && typeof Hero !== 'undefined') v.hero = Hero.mk();
    if (v.dung === undefined) v.dung = null;
    if (v.settlersUsed === undefined) v.settlersUsed = 0;
    if (v.loyalty === undefined){ v.loyalty = 100; v.loyaltyAt = now(); }
    if (v.firstCity === undefined) v.firstCity = !!v.capital;
    delete v.capital; delete v.heroes; delete v.research; delete v.resQueue;
  });
}
function load(){
  var d = Store.json(CFG.SAVE_KEY, null);
  if (!d || !d.villages || !d.villages.length) return false;
  try {
    for (var k in d) Game[k] = d[k];
    Game.movements = Game.movements || [];
    Game.incoming  = Game.incoming  || [];
    Game.reports   = Game.reports   || [];
    Game.npc = Game.npc || {}; Game.oasis = Game.oasis || {};
    Game.forts = Game.forts || {}; Game.trades = Game.trades || [];
    Game.allies = Game.allies || []; Game.enemies = Game.enemies || [];
    Game.offers = Game.offers || []; Game.sched = Game.sched || [];
    Game.stats = Game.stats || { atkPts:0, defPts:0, raidPts:0 };
    Game.capital = Game.capital || { owner:null, since:0, loyalty:100 };
    Game.quest = Game.quest || 0;
    Game.questDone = Game.questDone || [];
    Game.timeShift = Game.timeShift || 0;
    Game.builders = Game.builders || 2;
    Game.builderUntil = Game.builderUntil || 0;
    Game.schedUntil = Game.schedUntil || 0;
    Game.offerAt = Game.offerAt || 0;
    Game.tutorialSkip = true;
    Game.stationed = Game.stationed || [];
    Game.bookmarks = Game.bookmarks || [];
    Game.allySup = Game.allySup || [];

    if (!Game.protectUntil)
      Game.protectUntil = Game.startedAt + CFG.PROTECT_DAYS*86400000;
    Game.villages.forEach(function(v){
      if (!v.troops) v.troops = {};
      if (!v.train)  v.train  = {};
      if (!v.queue)  v.queue  = [];
      v.queue = v.queue.filter(function(q){ return q && q.cost; });
      v.queue.forEach(function(q){
        if (!isFinite(q.sec) || q.sec < 5) q.sec = 60;
        if (!q.start) q.start = now();
        if (!isFinite(q.finish)) q.finish = now() + q.sec*1000;
      });
    });
    migrate();
    return true;
  } catch(e){ logErr('load', e); return false; }
}
function hardWipe(redirect){
  SAVE_LOCK = true;
  try { window.onbeforeunload = null; } catch(e){}
  if (window.__timers) window.__timers.forEach(clearInterval);
  Store.del(CFG.SAVE_KEY);
  setTimeout(function(){ location.href = redirect || 'index.html'; }, 120);
}