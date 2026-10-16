/* =====================================================================
   สุวรรณภูมิ : สงครามเจ้านคร — Game Server (Cloudflare Worker + D1)
   เฟส B2 : บัญชี · โลก · เศรษฐกิจ · ก่อสร้าง · ทอง · บอทกลาง · ร้านค้า(โครง)
            ฝึกทหาร · เดินทัพ · การรบ · ปล้น · สอดแนม · รายงาน · ลบบัญชี
   ===================================================================== */
const VERSION = 'B2';
const SPEED = 1;
const SEED = 20260913 + 7777;
const MAP_R = 100, NOBUILD = 5, SPAWN_R = 70;
const START_GOLD = 50, PROTECT_DAYS = 5, BASE_CAP = 3000;
const BOT_TARGET = 60, BOT_SPAWN_PER_TICK = 10, BOT_BATCH = 60;
const ONLINE_MS = 3 * 60000;
const RES = ['wheat', 'wood', 'iron', 'clay'];
const RTH = { wheat:'ข้าว', wood:'ไม้', iron:'เหล็ก', clay:'โคลน' };
const RUIN_UID = '__ruins__', RUIN_NAME = 'เมืองร้าง';

const FEATURES = { build:true, gold:true, military:true, hero:false, dungeon:false, market:false,
  guild:false, oasis:false, settle:false, station:false, quest:false, schedule:true, endgame:false,
  chat:true, rename:true };

const PACKAGES = [
  { id:'g100',  name:'ถุงทองเล็ก',  gold:100,  bonus:0,   price:35,  cur:'THB' },
  { id:'g320',  name:'หีบทอง',      gold:300,  bonus:20,  price:99,  cur:'THB' },
  { id:'g750',  name:'ไหทอง',       gold:650,  bonus:100, price:199, cur:'THB' },
  { id:'g1700', name:'คลังทองหลวง', gold:1350, bonus:350, price:399, cur:'THB' }
];

/* ---------- หน่วยรบ : [k, ประเภท, อาคาร, Lv อาคาร, เงื่อนไขเพิ่ม, โจมตี, ป้องกันราบ, ป้องกันม้า,
                         ความเร็ว, บรรทุก, เสบียง, ราคา[ข้าว,ไม้,เหล็ก,โคลน], วินาที] ---------- */
const UT = [
  ['inf_a','inf','barracks',1,null,          40,35,50,  6, 50,1,[30,120,150,100],1600],
  ['inf_d','inf','barracks',1,null,          20,55,40,  7, 30,1,[40,100,70,130], 1500],
  ['inf_x','inf','barracks',5,['smithy',1],  70,40,25,  6, 45,1,[70,150,160,210],1900],
  ['scout','scout','stable',1,null,           0,20,10, 16,  0,2,[40,140,160,20], 1100],
  ['cav_l','cav','stable',3,null,           120,65,50, 14,100,2,[90,350,450,300],2200],
  ['cav_h','cav','stable',10,null,          160,90,110,10, 70,3,[150,550,700,450],3000],
  ['ram','siege','workshop',1,null,          60,30,75,  4,  0,3,[70,900,370,360],4600]
];
const TRIBES = [
  { name:'สุโขทัย', desc:'สมดุลทุกด้าน ทหารราบแข็งแรง เหมาะกับมือใหม่', a:1, d:1, s:1, c:1,
    n:['ทหารดาบ','ทหารหอก','องครักษ์','กองสอดแนม','ทหารม้าเบา','ทหารม้าเกราะ','ซุงกระทุ้ง'] },
  { name:'ล้านนา', desc:'เน้นตั้งรับ ป้องกัน +15% แต่โจมตีและเดินทัพช้ากว่า', a:0.9, d:1.15, s:0.95, c:1,
    n:['นักรบดาบ','พลหอกยาว','ทหารเสือ','พรานป่า','ม้าศึกดอย','ช้างศึก','ซุงกระทุ้ง'] },
  { name:'ขอม', desc:'เน้นบุก โจมตี +15% แต่ป้องกันอ่อนกว่า', a:1.15, d:0.9, s:1, c:1,
    n:['นักรบขวาน','พลโล่','นักรบนาค','นักสืบ','ม้าศึกขอม','ช้างทรง','รถกระทุ้ง'] },
  { name:'ศรีวิชัย', desc:'เคลื่อนที่เร็ว +15% บรรทุกของปล้นได้มากขึ้น 20%', a:1, d:0.95, s:1.15, c:1.2,
    n:['นักรบกริช','พลทวน','ทหารเรือ','สายลับทะเล','ม้าเร็ว','ทหารม้าศรีวิชัย','ซุงกระทุ้ง'] }
];
const UNITS = {}, UNIT_LIST = [];
TRIBES.forEach((T, ti) => UT.forEach((u, i) => {
  const o = { id:'u' + ti + '_' + u[0], k:u[0], tribe:ti, name:T.n[i], type:u[1], bld:u[2], lv:u[3], req:u[4],
    atk:Math.round(u[5] * T.a), di:Math.round(u[6] * T.d), dc:Math.round(u[7] * T.d),
    spd:+(u[8] * T.s).toFixed(1), carry:Math.round(u[9] * T.c), up:u[10],
    cost:{ wheat:u[11][0], wood:u[11][1], iron:u[11][2], clay:u[11][3] }, time:u[12] };
  UNITS[o.id] = o; UNIT_LIST.push(o);
}));

/* =====================================================================
   แผนที่โลก — ต้องตรงกับ js/noise.js และ js/world.js
   ===================================================================== */
function hash(x, y, s){
  let h = (s | 0) ^ Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263);
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function smooth(x, y, s){
  const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
  const u = fx*fx*(3 - 2*fx), w = fy*fy*(3 - 2*fy);
  const a = hash(x0, y0, s), b = hash(x0+1, y0, s), c = hash(x0, y0+1, s), d = hash(x0+1, y0+1, s);
  return (a*(1-u) + b*u)*(1-w) + (c*(1-u) + d*u)*w;
}
function fbm(x, y, s){
  let v = 0, amp = 1, fr = 0.034, tot = 0;
  for (let i = 0; i < 4; i++){ v += smooth(x*fr, y*fr, s + i*131) * amp; tot += amp; amp *= 0.5; fr *= 2.07; }
  return v / tot;
}
const BIO = [ {k:'water'},{k:'wetland'},{k:'lowland',bo:{wheat:0.10,clay:0.05}},{k:'grass'},
  {k:'forest',bo:{wood:0.10}},{k:'dense'},{k:'hill'},{k:'mountain'},{k:'dry'} ];
const ZT = { 1:[0.09,0.34,0.42], 2:[0.11,0.27,0.37], 3:[0.08,0.25,0.33], 4:[0.13,0.26,0.44] };
const ZRES = { 1:'iron', 2:'wood', 3:'wheat', 4:'clay' };
const ZSIGN = { 1:[1,1], 2:[-1,1], 3:[-1,-1], 4:[1,-1] };
const FORTS = [[0,5],[5,5],[5,0],[5,-5],[0,-5],[-5,-5],[-5,0],[-5,5]];
const LAYOUTS = [
  {wheat:8,wood:4,iron:4,clay:4,w:260},{wheat:7,wood:5,iron:4,clay:4,w:100},{wheat:7,wood:4,iron:5,clay:4,w:100},
  {wheat:7,wood:4,iron:4,clay:5,w:100},{wheat:5,wood:5,iron:5,clay:5,w:80},{wheat:6,wood:6,iron:4,clay:4,w:60},
  {wheat:6,wood:4,iron:6,clay:4,w:60},{wheat:6,wood:4,iron:4,clay:6,w:60},{wheat:4,wood:5,iron:6,clay:5,w:50},
  {wheat:10,wood:4,iron:3,clay:3,w:60},{wheat:12,wood:3,iron:2,clay:3,w:40},{wheat:13,wood:3,iron:2,clay:2,w:22},
  {wheat:15,wood:3,iron:1,clay:1,w:16},{wheat:17,wood:1,iron:1,clay:1,w:6}
];
const LAYOUT_W = LAYOUTS.reduce((s, l) => s + l.w, 0);
const START_LAYOUT = { wheat:8, wood:4, iron:4, clay:4 };

function zoneOf(x, y){ return x >= 0 && y >= 0 ? 1 : x < 0 && y >= 0 ? 2 : x < 0 && y < 0 ? 3 : 4; }
function isFort(x, y){ return FORTS.some(f => f[0] === x && f[1] === y); }
const TC = new Map();
function tile(x, y){
  const k = x + ',' + y;
  let t = TC.get(k);
  if (t) return t;
  if (TC.size > 60000) TC.clear();
  t = buildTile(x, y); TC.set(k, t);
  return t;
}
function buildTile(x, y){
  const z = zoneOf(x, y), T = ZT[z], h = fbm(x, y, SEED), h2 = hash(x, y, SEED + 911);
  let bio, g;
  if (h < T[0]){ g = 'water'; bio = h2 < 0.5 ? 0 : 1; }
  else if (h < T[1]){ g = 'rock'; bio = h2 < 0.58 ? 6 : 7; }
  else if (h < T[2]){ g = 'clay'; bio = h2 < 0.6 ? 8 : 5; }
  else {
    g = 'land';
    if (z === 2) bio = h2 < 0.48 ? 4 : h2 < 0.78 ? 3 : 2;
    else if (z === 3) bio = h2 < 0.46 ? 2 : h2 < 0.82 ? 3 : 4;
    else bio = h2 < 0.42 ? 3 : h2 < 0.74 ? 2 : 4;
  }
  const t = { bio, g, z, build:g === 'land', oasis:null, npc:false, layout:null };
  const prot = (x === 0 && y === 0) || isFort(x, y) || (Math.abs(x) <= NOBUILD && Math.abs(y) <= NOBUILD);
  if (!prot && hash(x, y, SEED + 3131) < 0.062){
    const ht = hash(x, y, SEED + 4242), hz = hash(x, y, SEED + 5353);
    let typ;
    if (g === 'rock') typ = 'iron';
    else if (g === 'water') typ = ht < 0.58 ? 'wheat' : 'wood';
    else if (g === 'clay') typ = ht < 0.70 ? 'clay' : 'wood';
    else typ = hz < 0.30 ? ZRES[z] : ht < 0.52 ? 'wheat' : ht < 0.80 ? 'wood' : ht < 0.92 ? 'clay' : 'iron';
    let pct = ht < 0.58 ? 25 : ht < 0.90 ? 50 : 75;
    if (hz > 0.965){ typ = 'double'; pct = 25; }
    t.oasis = { type:typ, pct };
  }
  if (t.build && !t.oasis && !prot){
    const r = hash(x, y, SEED + 5150) * LAYOUT_W;
    let acc = 0;
    for (const L of LAYOUTS){ acc += L.w; if (r <= acc){ t.layout = L; break; } }
    if (!t.layout) t.layout = LAYOUTS[0];
    if (hash(x, y, SEED + 6060) < 0.055) t.npc = true;
  }
  return t;
}
function canSettle(x, y){
  if (Math.abs(x) > MAP_R || Math.abs(y) > MAP_R) return 'อยู่นอกแผนที่';
  if (x === 0 && y === 0) return 'เมืองหลวงโลก';
  if (isFort(x, y)) return 'ป้อมปราการ';
  if (Math.abs(x) <= NOBUILD && Math.abs(y) <= NOBUILD) return 'เขตหวงห้าม';
  const t = tile(x, y);
  if (t.oasis) return 'โอเอซิส';
  if (!t.build) return 'ตั้งเมืองไม่ได้';
  if (t.npc) return 'เมืองร้าง';
  return null;
}
function findSpawn(zone, occ){
  const [sx, sy] = ZSIGN[zone] || ZSIGN[1];
  for (let band = 0; band < 50; band++){
    const rad = SPAWN_R - band;
    if (rad < 12) break;
    for (let k = 0; k < 110; k++){
      const a = Math.random() * Math.PI / 2;
      const x = Math.round(Math.cos(a) * rad) * sx, y = Math.round(Math.sin(a) * rad) * sy;
      if (canSettle(x, y) || occ.has(x + ',' + y)) continue;
      return { x, y };
    }
  }
  return null;
}

/* =====================================================================
   เศรษฐกิจ — ราคาเรียง [ข้าว, ไม้, เหล็ก, โคลน]
   ===================================================================== */
function B(n, c, o){ return Object.assign({ n, c, max:20, cp:1, dup:1, cat:'build', req:[] }, o || {}); }
const BD = {
  main:B('อาคารหลัก',[20,70,60,40],{cp:2}), rally:B('ลานรวมพล',[70,110,90,160],{cat:'mil'}),
  warehouse:B('คลังสินค้า',[40,130,90,160],{cat:'res',dup:3}), granary:B('ยุ้งฉาง',[20,80,70,100],{cat:'res',dup:3}),
  market:B('ตลาด',[70,80,120,70],{cp:4,req:[['main',3],['warehouse',1],['granary',1]]}),
  embassy:B('สถานทูต',[80,180,150,130],{cp:6,req:[['main',1]]}),
  barracks:B('ค่ายทหาร',[120,210,260,140],{cat:'mil',req:[['main',3],['rally',1]]}),
  stable:B('คอกม้า',[100,260,220,140],{cat:'mil',cp:2,req:[['barracks',3],['smithy',1]]}),
  workshop:B('โรงงาน',[320,460,600,510],{cat:'mil',cp:3,req:[['barracks',3],['main',5]]}),
  smithy:B('โรงตีเหล็ก',[160,180,500,250],{cat:'mil',cp:2,req:[['barracks',1],['main',3]]}),
  armoury:B('โรงฟอกหนัง',[130,130,410,210],{cat:'mil',cp:2,req:[['barracks',1],['main',3]]}),
  wall:B('กำแพงเมือง',[0,110,70,160],{cat:'wall'}),
  watchtower:B('หอคอยเฝ้าระวัง',[135,210,230,180],{cat:'mil',cp:2,req:[['rally',1]]}),
  cranny:B('ที่ซ่อนทรัพย์',[10,40,30,50],{cat:'res',max:10,cp:0,dup:99}),
  townhall:B('ศาลาประชาคม',[600,1250,1260,1110],{cp:12,req:[['main',10],['embassy',1]]}),
  residence:B('คฤหาสน์',[250,550,750,800],{cp:2,req:[['main',5]]}),
  palace:B('พระราชวัง',[250,550,750,800],{cp:5,once:true,req:[['main',5],['embassy',1]]}),
  hero:B('จวนวีรบุรุษ',[240,700,700,670],{req:[['rally',1]]}),
  temple:B('วิหารหลวง',[450,900,700,1100],{cp:8,req:[['main',8],['embassy',3]]}),
  trainground:B('ค่ายฝึกพิเศษ',[150,320,280,400],{cat:'mil',cp:3,req:[['rally',5],['barracks',5]]}),
  infirmary:B('โรงพยาบาล',[260,380,420,290],{cat:'mil',cp:2,req:[['main',5],['rally',3]]}),
  greatbarracks:B('ค่ายทหารหลวง',[360,630,780,420],{cat:'mil',cp:2,cap:true,req:[['palace',3],['barracks',10]]}),
  greatstable:B('คอกม้าหลวง',[300,780,660,420],{cat:'mil',cp:3,cap:true,req:[['palace',3],['stable',10]]}),
  greatwarehouse:B('โกดังหลวง',[200,650,450,800],{cat:'res',cp:2,dup:2,cap:true,req:[['palace',1],['warehouse',10]]}),
  greatgranary:B('ยุ้งฉางหลวง',[100,400,350,500],{cat:'res',cp:2,dup:2,cap:true,req:[['palace',1],['granary',10]]}),
  mill:B('โรงสี',[1240,500,380,440],{cat:'res',max:5,boost:'wheat',field:['wheat',5]}),
  royalmill:B('โรงสีหลวง',[1600,1200,870,1480],{cat:'res',max:5,boost:'wheat',req:[['mill',5]]}),
  sawmill:B('โรงเลื่อย',[90,520,290,380],{cat:'res',max:5,boost:'wood',field:['wood',3]}),
  brickyard:B('เตาเผาอิฐ',[50,440,320,480],{cat:'res',max:5,boost:'clay',field:['clay',3]}),
  foundry:B('โรงหลอม',[120,200,510,450],{cat:'res',max:5,boost:'iron',field:['iron',3]})
};
const PROD = [3,7,13,21,31,46,70,98,140,203,280,375,495,635,800,1000,1300,1600,2000,2450,2450];
const POPT = [0,2,1,1,1,2,2,2,3,4,4,5,5,6,7,7,8,9,10,11,12];
const FB = { wood:[60,40,50,100], clay:[50,80,80,40], iron:[60,100,30,80], wheat:[20,70,70,90] };

function arrCost(a, f){ const o = {}; RES.forEach((r, i) => o[r] = Math.round(a[i] * f)); return o; }
function fieldCost(res, lv){ return arrCost(FB[res], Math.pow(1.52, lv - 1)); }
function buildCost(k, lv){ return arrCost(BD[k].c, Math.pow(1.28, lv - 1)); }
function buildTime(lv, mb){
  const s = Math.round(240 * Math.pow(1.55, lv - 1) * Math.pow(0.964, mb || 0) / SPEED);
  return (!isFinite(s) || s < 5) ? 5 : s;
}
function fieldPop(lv){ let p = 0; for (let i = 1; i <= Math.min(20, lv); i++) p += POPT[i]; return p; }
function popOf(lv){ let p = 0; for (let i = 1; i <= lv; i++) p += i <= 5 ? 1 : i <= 10 ? 2 : i <= 15 ? 3 : 4; return p; }
function capacity(lv){ return lv <= 0 ? BASE_CAP : BASE_CAP + Math.floor(1200 * Math.pow(1.25, lv - 1)); }
function greatCap(lv){ return lv <= 0 ? 0 : Math.floor(2000 * Math.pow(1.28, lv - 1)); }
function rushCost(sec){ return Math.max(1, Math.min(50, Math.ceil((sec || 0) / 600))); }
function rallySlots(l){ return l>=20?8:l>=17?7:l>=14?6:l>=11?5:l>=8?4:l>=5?3:l>=3?2:1; }

function lvl(d, k){
  if (k === 'wall') return d.wallLv || 0;
  let m = 0;
  for (const c of d.city) if (c.k === k && c.level > m) m = c.level;
  return m;
}
function cnt(d, k){ let n = 0; for (const c of d.city) if (c.k === k) n++; return n; }
function sumLv(d, k){ let s = 0; for (const c of d.city) if (c.k === k) s += c.level; return s; }
function sumCap(d, k){
  let s = 0, f = false;
  for (const c of d.city) if (c.k === k && c.level > 0){ s += capacity(c.level) - BASE_CAP; f = true; }
  return f ? s + BASE_CAP : BASE_CAP;
}
function sumGreat(d, k){ let s = 0; for (const c of d.city) if (c.k === k) s += greatCap(c.level); return s; }
function caps(d){
  return { store:sumCap(d, 'warehouse') + sumGreat(d, 'greatwarehouse'),
           gran:sumCap(d, 'granary') + sumGreat(d, 'greatgranary') };
}
function prod(d, r){
  const bb = d.first ? 0 : (((BIO[d.bio] || {}).bo || {})[r] || 0);
  let mb = 0;
  for (const k in BD) if (BD[k].boost === r) mb += sumLv(d, k) * 0.05;
  let s = 0;
  for (const f of d.fields) if (f.res === r) s += PROD[f.level] * (1 + bb) * (1 + mb);
  return Math.floor(s);
}
function population(d){
  let p = 2;
  for (const f of d.fields) p += fieldPop(f.level);
  for (const c of d.city) if (c.k) p += popOf(c.level);
  return p + popOf(d.wallLv || 0);
}
function tcount(t){ let n = 0; for (const k in (t || {})) n += (t[k] | 0); return n; }
function tUp(t){ let s = 0; for (const k in (t || {})){ const u = UNITS[k]; if (u) s += t[k] * u.up; } return s; }
function rate(d, r){
  return r === 'wheat' ? prod(d, 'wheat') - population(d) - tUp(d.troops) - (d._away || 0) : prod(d, r);
}
/* ทหารอดอาหาร: เมื่อข้าวหมดและติดลบ ทหารในเมืองจะตาย จนเสบียงพอดีกับผลผลิต */
function starve(d, need){
  const T = d.troops || {};
  const ks = Object.keys(T).filter(k => T[k] > 0 && UNITS[k]).sort((a, b) => UNITS[b].up - UNITS[a].up);
  let cut = 0;
  for (const k of ks){
    if (cut >= need) break;
    const n = Math.min(T[k], Math.ceil((need - cut) / UNITS[k].up));
    T[k] -= n; cut += n * UNITS[k].up;
    if (T[k] <= 0) delete T[k];
  }
}
function accrue(d, t){
  const dt = (t - d.resAt) / 3600000;
  if (dt <= 0) return;
  const c = caps(d);
  for (const r of RES){
    const cap = r === 'wheat' ? c.gran : c.store, rt = rate(d, r);
    const v = d.res[r] + rt * dt;
    if (r === 'wheat' && v < 0 && rt < 0) starve(d, -rt);
    d.res[r] = Math.max(0, Math.min(cap, v));
  }
  d.resAt = t;
}
function bCount(P, t){ return (P.builder_until && t < P.builder_until) ? Math.max(3, P.builders || 3) : 2; }
function fill(d, t, P){
  const n = bCount(P, t);
  let act = d.queue.filter(q => q.active).length;
  for (const q of d.queue){
    if (act >= n) break;
    if (!q.active){ q.active = true; q.start = t; q.finish = t + q.sec * 1000; act++; }
  }
}
function applyQ(d, q){
  if (q.kind === 'field') d.fields[q.slot].level = q.level;
  else if (q.kind === 'wall') d.wallLv = q.level;
  else d.city[q.slot] = { k:q.k, level:q.level };
}
function advTrain(d, t){
  if (!d.train) return false;
  let ch = false;
  for (const b in d.train){
    const q = d.train[b];
    while (q.length){
      const j = q[0];
      if (j.next > t) break;
      const k = Math.min(j.left, Math.floor((t - j.next) / j.each) + 1);
      d.troops[j.u] = (d.troops[j.u] || 0) + k;
      j.left -= k; j.next += k * j.each; ch = true;
      if (j.left <= 0) q.shift(); else break;
    }
    if (!q.length) delete d.train[b];
  }
  return ch;
}
function advance(d, t, P){
  if (!d.troops) d.troops = {};
  let changed = false;
  for (let guard = 0; guard < 60; guard++){
    let nx = null;
    for (const q of d.queue) if (q.active && q.finish <= t && (!nx || q.finish < nx.finish)) nx = q;
    if (!nx) break;
    accrue(d, nx.finish); applyQ(d, nx);
    d.queue.splice(d.queue.indexOf(nx), 1);
    fill(d, nx.finish, P);
    changed = true;
  }
  accrue(d, t);
  if (advTrain(d, t)) changed = true;
  return changed;
}
function reqCheck(d, k, VS){
  const b = BD[k];
  if (!b || k === 'wall') return 'อาคารนี้สร้างในช่องไม่ได้';
  if (b.once && VS.some(V => cnt(V.d, k) > 0)) return 'สร้างได้เพียงแห่งเดียวทั้งเกม';
  if (b.cap && lvl(d, 'palace') < 1) return 'ต้องมีพระราชวังในเมืองนี้ก่อน';
  if (cnt(d, k) >= b.dup) return b.dup === 1 ? 'สร้างแล้ว' : 'สร้างครบ ' + b.dup + ' หลังแล้ว';
  if (b.field){
    const n = d.fields.filter(f => f.res === b.field[0]).length;
    if (n < b.field[1]) return 'ต้องมีหลุม' + RTH[b.field[0]] + ' ' + b.field[1] + ' หลุมขึ้นไป';
  }
  for (const [rk, rl] of b.req) if (lvl(d, rk) < rl) return 'ต้องมี ' + BD[rk].n + ' ระดับ ' + rl + ' ก่อน';
  return null;
}
function ue(m){ const e = new Error(m); e.user = true; return e; }

function enqueue(d, P, VS, t, kind, slot, key){
  slot = slot | 0;
  if (d.queue.some(q => q.kind === kind && q.slot === slot)) throw ue('ช่องนี้กำลังก่อสร้างอยู่แล้ว');
  const nb = bCount(P, t);
  if (d.queue.length >= nb + 2) throw ue('คิวเต็ม (ช่าง ' + nb + ' คน · รอได้อีก 2)');
  let lv, cost, k = null;
  if (kind === 'field'){
    const f = d.fields[slot];
    if (!f) throw ue('ไม่พบหลุม');
    lv = f.level + 1;
    if (lv > 20) throw ue('ระดับสูงสุดแล้ว');
    cost = fieldCost(f.res, lv);
  } else if (kind === 'wall'){
    slot = 0; lv = (d.wallLv || 0) + 1;
    if (lv > BD.wall.max) throw ue('ระดับสูงสุดแล้ว');
    cost = buildCost('wall', lv);
  } else if (kind === 'city'){
    if (slot < 0 || slot >= 21) throw ue('ช่องไม่ถูกต้อง');
    const c = d.city[slot];
    if (!c.k){
      if (!key || !BD[key]) throw ue('ยังไม่ได้เลือกอาคาร');
      const why = reqCheck(d, key, VS);
      if (why) throw ue(why);
      k = key; lv = 1;
    } else {
      k = c.k; lv = c.level + 1;
      if (lv > BD[k].max) throw ue('ระดับสูงสุดแล้ว');
    }
    cost = buildCost(k, lv);
  } else throw ue('ประเภทไม่ถูกต้อง');
  for (const r of RES) if (d.res[r] + 1e-6 < cost[r]) throw ue('ทรัพยากรไม่พอ');
  for (const r of RES) d.res[r] -= cost[r];
  if (kind === 'city' && !d.city[slot].k) d.city[slot] = { k, level:0 };
  d.queue.push({ kind, slot, k, level:lv, sec:buildTime(lv, lvl(d, 'main')), cost, active:false, start:0, finish:0 });
  fill(d, t, P);
}
function cancelQ(d, P, t, idx){
  const q = d.queue[idx];
  if (!q) throw ue('ไม่พบรายการ');
  let ratio = 1;
  if (q.active) ratio = Math.max(0.2, 1 - Math.max(0, Math.min(1, (t - q.start) / 1000 / q.sec)));
  const c = caps(d);
  for (const r of RES)
    d.res[r] = Math.min(r === 'wheat' ? c.gran : c.store, d.res[r] + Math.floor((q.cost[r] || 0) * ratio));
  if (q.kind === 'city' && q.level === 1) d.city[q.slot] = { k:null, level:0 };
  d.queue.splice(idx, 1);
  fill(d, t, P);
  return Math.round(ratio * 100);
}
function finishNow(d, P, t, q){ accrue(d, t); applyQ(d, q); d.queue.splice(d.queue.indexOf(q), 1); fill(d, t, P); }
function cpPerDay(VS){
  let s = 0;
  for (const V of VS) for (const c of V.d.city)
    if (c.k && c.level > 0) s += Math.floor((BD[c.k].cp || 0) * Math.pow(1.18, c.level - 1));
  return s;
}
function cpNow(P, VS, t){ return (P.cp || 0) + cpPerDay(VS) * Math.max(0, t - (P.cp_at || t)) / 86400000 * SPEED; }
function newVillage(x, y, first, t){
  const L = first ? START_LAYOUT : (tile(x, y).layout || LAYOUTS[0]);
  const fields = [];
  for (const r of RES) for (let i = 0; i < L[r]; i++) fields.push({ res:r, level:0 });
  while (fields.length < 20) fields.push({ res:'wheat', level:0 });
  fields.length = 20;
  const city = [];
  for (let i = 0; i < 21; i++) city.push({ k:null, level:0 });
  city[0] = { k:'main', level:1 }; city[1] = { k:'rally', level:1 };
  return { first:!!first, bio:tile(x, y).bio, fields, city, wallLv:0,
    res:{ wheat:1000, wood:1000, iron:1000, clay:1000 }, resAt:t, queue:[], troops:{}, train:{} };
}
function SJ(d){ return JSON.stringify(d, (k, v) => (k && k[0] === '_') ? undefined : v); }

/* ---------- ฝึกทหาร ---------- */
function eachSec(u, bl){ return Math.max(5, Math.round(u.time * Math.pow(0.9, bl - 1) / SPEED)); }
function trainUnits(d, tribe, t, id, n){
  const u = UNITS[id];
  if (!u || u.tribe !== tribe) throw ue('ไม่พบหน่วยนี้ในเผ่าของคุณ');
  n = Math.floor(n);
  if (!(n > 0) || n > 5000) throw ue('จำนวนต้องอยู่ระหว่าง 1 - 5,000');
  const bl = lvl(d, u.bld);
  if (bl < 1) throw ue('ต้องสร้าง' + BD[u.bld].n + 'ก่อน');
  if (bl < u.lv) throw ue('ต้องมี' + BD[u.bld].n + 'ระดับ ' + u.lv);
  if (u.req && lvl(d, u.req[0]) < u.req[1]) throw ue('ต้องมี' + BD[u.req[0]].n + 'ระดับ ' + u.req[1]);
  for (const r of RES) if (d.res[r] + 1e-6 < u.cost[r] * n) throw ue('ทรัพยากรไม่พอ');
  for (const r of RES) d.res[r] -= u.cost[r] * n;
  const each = eachSec(u, bl);
  if (!d.train) d.train = {};
  const q = d.train[u.bld] || (d.train[u.bld] = []);
  const last = q[q.length - 1];
  const start = last ? last.next + last.each * (last.left - 1) : t;
  q.push({ u:id, n, left:n, each, next:Math.max(start, t) + each });
}

/* ---------- การรบ ---------- */
function smithyB(d){ return 1 + 0.02 * lvl(d, 'smithy'); }
function armouryB(d){ return 1 + 0.02 * lvl(d, 'armoury'); }
function hideCap(d){
  let s = 0;
  for (const c of d.city) if (c.k === 'cranny' && c.level > 0) s += Math.floor(capacity(c.level) * 0.3);
  return s;
}
function kill(t, loss){
  const dead = {}, left = {};
  loss = isFinite(loss) ? Math.max(0, Math.min(1, loss)) : 1;
  for (const k in (t || {})){
    const n = t[k] | 0;
    if (!n) continue;
    const x = loss >= 1 ? n : Math.round(n * loss);
    if (x) dead[k] = x;
    if (n - x > 0) left[k] = n - x;
  }
  return { dead, left };
}
function fight(at, aB, dt, dB, wall, mission, base){
  let ai = 0, ac = 0;
  for (const k in at){ const u = UNITS[k]; if (!u) continue; const p = at[k] * u.atk; if (u.type === 'cav') ac += p; else ai += p; }
  const A = (ai + ac) * aB, cs = (ai + ac) > 0 ? ac / (ai + ac) : 0;
  let D = base;
  for (const k in (dt || {})){ const u = UNITS[k]; if (u) D += dt[k] * (u.di * (1 - cs) + u.dc * cs); }
  D *= dB * Math.pow(1.03, wall);
  let la, ld;
  const win = A > D;
  if (mission === 'raid'){
    const big = Math.max(A, D), small = Math.min(A, D);
    const x = big > 0 ? Math.pow(small / big, 1.5) : 1;
    la = win ? x / (1 + x) : 1 / (1 + x);
    ld = win ? 1 / (1 + x) : x / (1 + x);
  } else if (win){ la = Math.pow(D / A, 1.5); ld = 1; }
  else { la = 1; ld = A > 0 ? Math.pow(A / D, 1.5) : 0; }
  return { A:Math.round(A), D:Math.round(D), win, la, ld };
}
function scoutFight(tr, smA, dd){
  let sa = 0, ds = 0;
  for (const k in tr){ const u = UNITS[k]; if (u && u.type === 'scout') sa += tr[k] * 35; }
  sa *= smA;
  for (const k in (dd.troops || {})){ const u = UNITS[k]; if (u && u.type === 'scout') ds += dd.troops[k] * 20; }
  ds *= Math.pow(1.03, dd.wallLv || 0) * (1 + 0.05 * lvl(dd, 'watchtower'));
  if (ds <= 0) return { ok:true, seen:false, left:tr, dead:{} };
  const ok = sa > ds, k2 = kill(tr, ok ? Math.pow(ds / sa, 1.5) : 1);
  return { ok, seen:true, left:k2.left, dead:k2.dead };
}
function carryOf(t){ let s = 0; for (const k in t){ const u = UNITS[k]; if (u) s += t[k] * u.carry; } return s; }
function ramCount(t){ let s = 0; for (const k in t){ const u = UNITS[k]; if (u && u.type === 'siege') s += t[k]; } return s; }
function takeLoot(res, hide, carry){
  const out = { wheat:0, wood:0, iron:0, clay:0 }, av = {};
  for (const r of RES) av[r] = Math.max(0, Math.floor((res[r] || 0) - hide));
  let left = Math.floor(carry);
  for (let pass = 0; pass < 5 && left > 0; pass++){
    const open = RES.filter(r => av[r] - out[r] > 0);
    if (!open.length) break;
    const share = Math.max(1, Math.floor(left / open.length));
    for (const r of open){ const k = Math.min(share, av[r] - out[r], left); out[r] += k; left -= k; }
  }
  return out;
}
function roundRes(r){ const o = {}; for (const x of RES) o[x] = Math.floor(r[x] || 0); return o; }

/* =====================================================================
   ตรวจสอบตัวตน — Firebase ID Token
   ===================================================================== */
let JWKS = null, JWKS_AT = 0;
const TD = new TextDecoder(), TE = new TextEncoder();
function b64u(s){
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s), u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return u;
}
async function jwks(force){
  if (!force && JWKS && Date.now() - JWKS_AT < 3600000) return JWKS;
  const r = await fetch('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com');
  JWKS = (await r.json()).keys || []; JWKS_AT = Date.now();
  return JWKS;
}
async function verifyToken(tok, env){
  const pid = env.FIREBASE_PROJECT_ID;
  if (!pid) throw new Error('ยังไม่ได้ตั้งค่า FIREBASE_PROJECT_ID');
  const p = String(tok || '').split('.');
  if (p.length !== 3) throw new Error('ไม่มีโทเคน');
  const head = JSON.parse(TD.decode(b64u(p[0]))), pay = JSON.parse(TD.decode(b64u(p[1])));
  const now = Math.floor(Date.now() / 1000);
  if (head.alg !== 'RS256') throw new Error('alg');
  if (pay.aud !== pid || pay.iss !== 'https://securetoken.google.com/' + pid) throw new Error('aud');
  if (!(pay.exp > now) || pay.iat > now + 300 || !pay.sub) throw new Error('หมดอายุ');
  let ks = await jwks(false), jwk = ks.find(k => k.kid === head.kid);
  if (!jwk){ ks = await jwks(true); jwk = ks.find(k => k.kid === head.kid); }
  if (!jwk) throw new Error('kid');
  const key = await crypto.subtle.importKey('jwk', jwk, { name:'RSASSA-PKCS1-v1_5', hash:'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64u(p[2]), TE.encode(p[0] + '.' + p[1]));
  if (!ok) throw new Error('ลายเซ็นไม่ถูกต้อง');
  return pay;
}
function provOf(c){
  const p = c.firebase && c.firebase.sign_in_provider;
  return p === 'anonymous' ? 'guest' : p === 'google.com' ? 'google' : p === 'facebook.com' ? 'facebook'
       : p === 'password' ? 'email' : (p || 'other');
}
function isAdmin(uid, env){ return String(env.ADMIN_UIDS || '').split(',').map(s => s.trim()).filter(Boolean).includes(uid); }

/* =====================================================================
   HTTP
   ===================================================================== */
function cors(env){
  return { 'Access-Control-Allow-Origin':env.ALLOW_ORIGIN || '*', 'Access-Control-Allow-Headers':'Authorization, Content-Type',
    'Access-Control-Allow-Methods':'GET, POST, OPTIONS', 'Access-Control-Max-Age':'86400', 'Vary':'Origin' };
}
function json(o, status, env){
  return new Response(JSON.stringify(o), { status:status || 200,
    headers:Object.assign({ 'Content-Type':'application/json; charset=utf-8' }, cors(env)) });
}

export default {
  async fetch(req, env){
    try { return await route(req, env); }
    catch (e){
      if (e && e.user) return json({ ok:false, err:e.message }, 200, env);
      return json({ ok:false, err:'เซิร์ฟเวอร์ผิดพลาด: ' + (e && e.message || e) }, 500, env);
    }
  },
  async scheduled(ev, env, ctx){
    ctx.waitUntil((async () => {
      try { await resolveDue(env, Date.now(), 60); } catch (e){ console.log('resolve', e && e.message); }
      try { await firePlans(env, Date.now()); } catch (e){ console.log('plan', e && e.message); }
      if (new Date(ev.scheduledTime).getUTCMinutes() === 30){
      try { await socialCleanup(env, Date.now()); } catch (e){ console.log('clean', e && e.message); }
      }
      if (new Date(ev.scheduledTime).getUTCMinutes() % 5 === 0){
      try { await botTick(env); } catch (e){ console.log('bot', e && e.message); }
      }
    })());
  }
};

async function route(req, env){
  const url = new URL(req.url);
  const p = url.pathname.replace(/\/+$/, '') || '/';
  const q = Object.fromEntries(url.searchParams);
  if (req.method === 'OPTIONS') return new Response(null, { headers:cors(env) });

  if (p === '/') return json({ ok:true, name:'Suwannaphum API', version:VERSION }, 200, env);
  if (p === '/health') return health(env);
  if (p === '/world') return world(env);
  if (p === '/rank') return rank(env, q);
  if (p === '/rules') return json({ ok:true, version:VERSION, speed:SPEED, features:FEATURES,
    tribes:TRIBES.map(t => ({ name:t.name, desc:t.desc })), units:UNIT_LIST }, 200, env);
  if (p === '/shop' && req.method === 'GET')
    return json({ ok:true, enabled:env.PAYMENT_ENABLED === '1', packages:PACKAGES }, 200, env);
  if (p === '/shop/webhook') return json({ ok:false, err:'ยังไม่ได้เชื่อมระบบชำระเงิน' }, 501, env);

  let claims;
  try { claims = await verifyToken((req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, ''), env); }
  catch (e){ return json({ ok:false, err:'auth', msg:String(e && e.message || e) }, 401, env); }
  const uid = claims.sub;
  const b = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
  const DB = env.DB;

  if (p.startsWith('/admin/')){
    if (!isAdmin(uid, env)) return json({ ok:false, err:'ไม่มีสิทธิ์' }, 403, env);
    return admin(p, b, q, env, uid);
  }
  if (p === '/register') return register(env, uid, claims, b);
  if (p === '/account/delete') return deleteAccount(env, uid, b);
  if (p === '/shop/order') return shopOrder(env, uid, b);
  if (p === '/shop/orders'){
    const r = await DB.prepare('SELECT id,pkg,gold,price,currency,status,ref,created,paid FROM orders WHERE uid=? ORDER BY id DESC LIMIT 50').bind(uid).all();
    return json({ ok:true, orders:r.results || [] }, 200, env);
  }
  if (p === '/reports'){
    await DB.prepare('DELETE FROM reports WHERE uid=? AND id < (SELECT id FROM reports WHERE uid=? ORDER BY id DESC LIMIT 1 OFFSET 199)').bind(uid, uid).run();
    const r = await DB.prepare('SELECT id,at,kind,title,data,read FROM reports WHERE uid=? ORDER BY id DESC LIMIT 60').bind(uid).all();
    return json({ ok:true, list:(r.results || []).map(x => Object.assign(x, { data:JSON.parse(x.data || '{}') })) }, 200, env);
  }
  if (p === '/reports/read'){
    if (b.all) await DB.prepare('UPDATE reports SET read=1 WHERE uid=?').bind(uid).run();
    else await DB.prepare('UPDATE reports SET read=1 WHERE uid=? AND id=?').bind(uid, b.id | 0).run();
    return json({ ok:true }, 200, env);
  }
  if (p === '/reports/del'){
    if (b.all) await DB.prepare('DELETE FROM reports WHERE uid=?').bind(uid).run();
    else await DB.prepare('DELETE FROM reports WHERE uid=? AND id=?').bind(uid, b.id | 0).run();
    return json({ ok:true }, 200, env);
  }

  const SOC = await social(p, b, env, uid);
  if (SOC) return SOC;

  const ACT = {
    '/me': null,
    '/build': ctx => { const V = findV(ctx, b.vid); enqueue(V.d, ctx.P, ctx.VS, ctx.t, b.kind, b.slot, b.key); V.dirty = true; },
    '/cancel': ctx => { const V = findV(ctx, b.vid); const pct = cancelQ(V.d, ctx.P, ctx.t, b.idx | 0); V.dirty = true; return { refund:pct }; },
    '/rush': ctx => {
      const V = findV(ctx, b.vid), qq = V.d.queue[b.idx | 0];
      if (!qq) throw ue('ไม่พบรายการ');
      const g = rushCost(qq.active ? (qq.finish - ctx.t) / 1000 : qq.sec);
      spend(ctx, g, 'rush'); finishNow(V.d, ctx.P, ctx.t, qq); V.dirty = true;
      return { gold:g };
    },
    '/gold': ctx => goldItem(ctx, b),
    '/rename': ctx => {
      const V = findV(ctx, b.vid), nm = String(b.name || '').trim();
      if (nm.length < 2 || nm.length > 20) throw ue('ชื่อเมืองต้องยาว 2-20 ตัวอักษร');
      if (/[<>]/.test(nm)) throw ue('ห้ามใช้อักขระ < >');
      V.row.name = nm; V.dirty = true;
    },
    '/train': ctx => { const V = findV(ctx, b.vid); trainUnits(V.d, ctx.P.tribe, ctx.t, String(b.u || ''), b.n); V.dirty = true; },
    '/send': ctx => sendArmy(ctx, env, b),
    '/quest/claim': ctx => questClaim(ctx, env, b)
  };
  
  if (!(p in ACT)) return json({ ok:false, err:'ไม่พบคำสั่ง ' + p }, 404, env);
  const out = await session(env, uid, ACT[p]);
  if (!out) return json({ ok:true, player:null, villages:[], features:FEATURES, now:Date.now() }, 200, env);
  return json(out, 200, env);
}

function findV(ctx, vid){
  const V = ctx.VS.find(x => x.row.id === (vid | 0));
  if (!V) throw ue('ไม่พบเมืองนี้');
  return V;
}
function spend(ctx, g, reason, extraSet, extraBind){
  if ((ctx.P.gold || 0) - ctx.spend < g) throw ue('ทองไม่พอ (ต้องใช้ ' + g + ')');
  ctx.spend += g; ctx.reason = reason;
  if (extraSet){ ctx.goldSet += extraSet; ctx.goldBind.push(...(extraBind || [])); }
}
function goldItem(ctx, b){
  const t = ctx.t;

    if (b.item === 'sched'){
    const until = Math.max(t, ctx.P.sched_until || 0) + SCHED_DAYS * 86400000;
    spend(ctx, SCHED_GOLD, 'sched', ', sched_until=?', [until]);
    ctx.P.sched_until = until;
    for (const V of ctx.VS) V.dirty = true;
    return;
  }

  if (b.item === 'builder'){
    if (bCount(ctx.P, t) >= 3) throw ue('มีช่างคนที่ 3 อยู่แล้ว');
    const until = t + 86400000;
    spend(ctx, 25, 'builder', ', builders=3, builder_until=?', [until]);
    ctx.P.builders = 3; ctx.P.builder_until = until;
    for (const V of ctx.VS){ fill(V.d, t, ctx.P); V.dirty = true; }
    return;
  }
  const V = findV(ctx, b.vid);
  if (b.item === 'rushall'){
    const act = V.d.queue.filter(q => q.active);
    if (!act.length) throw ue('ไม่มีงานที่กำลังก่อสร้าง');
    spend(ctx, 10, 'rushall');
    for (const q of act) finishNow(V.d, ctx.P, t, q);
  } else if (b.item === 'refill'){
    spend(ctx, 15, 'refill');
    const c = caps(V.d);
    for (const r of RES) V.d.res[r] = Math.min(r === 'wheat' ? c.gran : c.store, V.d.res[r] + 1000);
  } else throw ue('ไม่รู้จักรายการนี้');
  V.dirty = true;
}

/* ---------- ส่งกองทัพ ---------- */
async function sendArmy(ctx, env, b){
  const V = findV(ctx, b.vid), d = V.d, mis = String(b.mission || '');
  if (!['attack', 'raid', 'scout'].includes(mis)) throw ue('ภารกิจนี้จะเปิดในเฟสถัดไป');
  const rl = lvl(d, 'rally');
  if (rl < 1) throw ue('ต้องมีลานรวมพล');
  const out = ctx.moves.filter(m => m.from_vid === V.row.id && m.state === 'go').length;
  if (out >= rallySlots(rl)) throw ue('ส่งทัพพร้อมกันได้สูงสุด ' + rallySlots(rl) + ' ขบวน (อัปลานรวมพลเพื่อเพิ่ม)');
  const tr = {};
  let n = 0, minS = 99, onlyScout = true;
  for (const k in (b.troops || {})){
    const c = Math.floor(b.troops[k]);
    if (!(c > 0)) continue;
    const u = UNITS[k];
    if (!u || u.tribe !== ctx.P.tribe) throw ue('หน่วยทหารไม่ถูกต้อง');
    if ((d.troops[k] || 0) < c) throw ue('ทหารในเมืองไม่พอ');
    tr[k] = c; n += c;
    if (u.spd < minS) minS = u.spd;
    if (u.type !== 'scout') onlyScout = false;
  }
  if (!n) throw ue('ยังไม่ได้เลือกทหาร');
  if (mis === 'scout' && !onlyScout) throw ue('ภารกิจสอดแนมส่งได้เฉพาะหน่วยสอดแนม');
  const tx = b.tx | 0, ty = b.ty | 0;
  if (Math.abs(tx) > MAP_R || Math.abs(ty) > MAP_R) throw ue('พิกัดอยู่นอกแผนที่');
  if (tx === V.row.x && ty === V.row.y) throw ue('เป้าหมายคือเมืองตัวเอง');

  const tv = await env.DB.prepare('SELECT v.id, v.uid, p.is_bot, p.protect_until FROM villages v JOIN players p ON p.uid=v.uid WHERE v.x=? AND v.y=?').bind(tx, ty).first();
  let toVid = null, toUid = null;
  if (tv){
    if (tv.uid === ctx.P.uid) throw ue('การเสริมทัพเมืองตัวเองจะเปิดในเฟส B5');
    if (!tv.is_bot && tv.protect_until > ctx.t) throw ue('เป้าหมายอยู่ในช่วงคุ้มครองผู้เล่นใหม่');
    toVid = tv.id; toUid = tv.uid;
    if (!tv.is_bot && ctx.P.protect_until > ctx.t && mis !== 'scout'){
      ctx.pset += ', protect_until=0'; ctx.P.protect_until = 0;
    }
  } else {
    const T = tile(tx, ty);
    if (T.oasis) throw ue('การโจมตีโอเอซิสจะเปิดในเฟส B4');
    if (isFort(tx, ty) || (tx === 0 && ty === 0)) throw ue('ป้อมและเมืองหลวงโลกจะเปิดในเฟส B5');
    if (!T.npc) throw ue('ไม่มีเมืองที่พิกัดนี้');
  }
  const spd = minS * (1 + 0.03 * lvl(d, 'trainground'));
  const sec = Math.max(60, Math.round(Math.hypot(tx - V.row.x, ty - V.row.y) / spd * 3600 / SPEED));
  for (const k in tr){ d.troops[k] -= tr[k]; if (d.troops[k] <= 0) delete d.troops[k]; }
  V.dirty = true;
  ctx.ins.push({ t:'moves', guard:V,
    cols:'uid,from_vid,fx,fy,tx,ty,to_vid,to_uid,mission,troops,loot,depart,arrive,state,lock,tries',
    vals:[ctx.P.uid, V.row.id, V.row.x, V.row.y, tx, ty, toVid, toUid, mis, JSON.stringify(tr), '{}',
      ctx.t, ctx.t + sec * 1000, 'go', 0, 0] });
  return { sec };
}

/* ---------- โหลด → ทำรายการ → บันทึก ---------- */
async function session(env, uid, act){
  try { await resolveDue(env, Date.now(), 10); } catch (e){ console.log('resolve', e && e.message); }
  for (let attempt = 0; attempt < 3; attempt++){
    const P = await env.DB.prepare('SELECT * FROM players WHERE uid=?').bind(uid).first();
    if (!P) return null;
    if (P.banned) throw ue('บัญชีนี้ถูกระงับ ติดต่อทีมงาน');
    const rows = (await env.DB.prepare('SELECT * FROM villages WHERE uid=? ORDER BY id').bind(uid).all()).results || [];
    const mv = (await env.DB.prepare('SELECT * FROM moves WHERE uid=? OR to_uid=?').bind(uid, uid).all()).results || [];
    const t = Date.now(), away = {};
    for (const m of mv) if (m.uid === uid) away[m.from_vid] = (away[m.from_vid] || 0) + tUp(JSON.parse(m.troops || '{}'));
    const ctx = { P, t, spend:0, goldSet:'', goldBind:[], reason:'', msg:null, ins:[], pset:'', pbind:[], moves:mv,
      VS:rows.map(r => { const d = JSON.parse(r.data); d._away = away[r.id] || 0; if (!d.troops) d.troops = {}; return { row:r, d, dirty:false }; }) };
    for (const V of ctx.VS){ if (advance(V.d, t, P)) V.dirty = true; fill(V.d, t, P); }

    let err = null;
    try { if (act) ctx.msg = (await act(ctx)) || null; }
    catch (e){ if (!e.user) throw e; err = e.message; }

    if (!err && (ctx.VS.some(V => V.dirty) || ctx.spend > 0)){
      if (!(await commit(env, ctx))) continue;
      if (ctx.ins.length) ctx.moves = (await env.DB.prepare('SELECT * FROM moves WHERE uid=? OR to_uid=?').bind(uid, uid).all()).results || [];
    } else if (t - (P.seen || 0) > 120000){
      await env.DB.prepare('UPDATE players SET seen=? WHERE uid=?').bind(t, uid).run();
    }
    ctx.unread = ((await env.DB.prepare('SELECT COUNT(*) n FROM reports WHERE uid=? AND read=0').bind(uid).first()) || {}).n || 0;
    ctx.msgUnread = ((await env.DB.prepare('SELECT COUNT(*) n FROM msgs WHERE to_uid=? AND read=0').bind(uid).first()) || {}).n || 0;
    ctx.qReady = await questReady(env, ctx);

    return stateOf(ctx, err);
  }
  throw ue('มีการทำรายการซ้อนกัน ลองใหม่อีกครั้ง');
}
async function commit(env, ctx){
  const { P, t } = ctx, dirty = ctx.VS.filter(V => V.dirty), st = [], vIdx = [];
  for (const V of dirty){
    let sql = 'UPDATE villages SET data=?, pop=?, name=?, ver=ver+1, updated=? WHERE id=? AND ver=?';
    const bind = [SJ(V.d), population(V.d), V.row.name, t, V.row.id, V.row.ver];
    if (ctx.spend > 0){ sql += ' AND (SELECT gold FROM players WHERE uid=?)>=?'; bind.push(P.uid, ctx.spend); }
    vIdx.push(st.length);
    st.push(env.DB.prepare(sql).bind(...bind));
  }
  for (const x of ctx.ins){
    const ph = x.vals.map(() => '?').join(',');
    st.push(env.DB.prepare('INSERT INTO ' + x.t + '(' + x.cols + ') SELECT ' + ph + ' WHERE (SELECT ver FROM villages WHERE id=?)=?')
      .bind(...x.vals, x.guard.row.id, x.guard.row.ver + 1));
  }
  const g0 = dirty[0];
  const guard = g0 ? ' AND (SELECT ver FROM villages WHERE id=?)=?' : '';
  const gb = g0 ? [g0.row.id, g0.row.ver + 1] : [];
  let gIdx = -1;
  if (ctx.spend > 0){
    gIdx = st.length;
    st.push(env.DB.prepare('UPDATE players SET gold=gold-?' + ctx.goldSet + ' WHERE uid=? AND gold>=?' + guard)
      .bind(ctx.spend, ...ctx.goldBind, P.uid, ctx.spend, ...gb));
    st.push(env.DB.prepare('INSERT INTO ledger(uid,delta,reason,note,at) SELECT ?,?,?,?,? WHERE changes()>0')
      .bind(P.uid, -ctx.spend, ctx.reason || 'spend', '', t));
  }
  const cp = cpNow(P, ctx.VS, t);
  st.push(env.DB.prepare('UPDATE players SET cp=?, cp_at=?, seen=?' + ctx.pset + ' WHERE uid=?' + guard)
    .bind(cp, t, t, ...ctx.pbind, P.uid, ...gb));
  const r = await env.DB.batch(st);
  for (const i of vIdx) if (!r[i].meta.changes) return false;
  if (gIdx >= 0 && !r[gIdx].meta.changes){ if (!dirty.length) throw ue('ทองไม่พอ'); return false; }
  P.cp = cp; P.cp_at = t; P.gold -= ctx.spend;
  for (const V of dirty) V.row.ver++;
  return true;
}
function mvOut(m){
  return { id:m.id, from:m.from_vid, fx:m.fx, fy:m.fy, tx:m.tx, ty:m.ty, mission:m.mission, state:m.state,
    depart:m.depart, arrive:m.arrive, troops:JSON.parse(m.troops || '{}'), loot:JSON.parse(m.loot || '{}') };
}
function stateOf(ctx, err){
  const { P, VS, t } = ctx;
  return {
    ok:!err, err:err || undefined, msg:ctx.msg || undefined, now:t, features:FEATURES, unread:ctx.unread || 0,
    player:{ uid:P.uid, name:P.name, gold:P.gold, cp:cpNow(P, VS, t), cpRate:cpPerDay(VS), tribe:P.tribe, zone:P.zone,
    builders:bCount(P, t), builderUntil:P.builder_until, protectUntil:P.protect_until, created:P.created,
    renameN:P.rename_n | 0, renameAt:P.rename_at || 0, oldName:P.old_name || null,
    schedUntil:P.sched_until || 0 },
    msgUnread:ctx.msgUnread || 0,
    quest:questOut(P, ctx),

    villages:VS.map(V => {
      const d = V.d;
      return { id:V.row.id, x:V.row.x, y:V.row.y, name:V.row.name, first:!!d.first, bio:d.bio, fields:d.fields,
        city:d.city, wallLv:d.wallLv || 0, res:d.res, resAt:d.resAt, queue:d.queue, pop:population(d), caps:caps(d),
        troops:d.troops || {}, train:d.train || {}, upkeep:tUp(d.troops) + (d._away || 0),
        rate:{ wheat:rate(d,'wheat'), wood:rate(d,'wood'), iron:rate(d,'iron'), clay:rate(d,'clay') } };
    }),
    moves:ctx.moves.filter(m => m.uid === P.uid).map(mvOut),
    incoming:ctx.moves.filter(m => m.to_uid === P.uid && m.uid !== P.uid && m.state === 'go').filter(m => {
      const V = VS.find(x => x.row.id === m.to_vid);
      if (!V) return false;
      const wl = lvl(V.d, 'watchtower');
      return wl > 0 && m.arrive - t <= (5 + 5 * wl) * 60000;
    }).map(m => ({ id:m.id, to:m.to_vid, fx:m.fx, fy:m.fy, tx:m.tx, ty:m.ty,
      mission:m.mission === 'scout' ? 'scout' : 'attack', depart:m.depart, arrive:m.arrive }))
  };
}

/* =====================================================================
   ประมวลผลกองทัพที่ถึงเป้าหมาย
   ===================================================================== */
const GUARD = ' AND (SELECT ver FROM villages WHERE id=?)=?';
async function getV(env, id){ return id ? await env.DB.prepare('SELECT * FROM villages WHERE id=?').bind(id).first() : null; }
async function getP(env, uid){ return uid ? await env.DB.prepare('SELECT * FROM players WHERE uid=?').bind(uid).first() : null; }
async function awaySum(env, vid){
  const r = (await env.DB.prepare('SELECT troops FROM moves WHERE from_vid=?').bind(vid).all()).results || [];
  let s = 0;
  for (const m of r) s += tUp(JSON.parse(m.troops || '{}'));
  return s;
}
function vUpd(env, r, d, t){
  return env.DB.prepare('UPDATE villages SET data=?, pop=?, ver=ver+1, updated=? WHERE id=? AND ver=?').bind(SJ(d), population(d), t, r.id, r.ver);
}
async function resolveDue(env, t, limit){
  const rows = (await env.DB.prepare('SELECT * FROM moves WHERE arrive<=? AND lock<? ORDER BY arrive LIMIT ?').bind(t, t - 60000, limit).all()).results || [];
  for (const m of rows){
    if (m.tries >= 5){ await env.DB.prepare('DELETE FROM moves WHERE id=?').bind(m.id).run(); continue; }
    const c = await env.DB.prepare('UPDATE moves SET lock=?, tries=tries+1 WHERE id=? AND lock=?').bind(t, m.id, m.lock).run();
    if (!c.meta.changes) continue;
    let ok = false;
    try { ok = m.state === 'back' ? await doReturn(env, m) : await doArrive(env, m); }
    catch (e){ console.log('move ' + m.id, e && e.message); }
    if (!ok) await env.DB.prepare('UPDATE moves SET lock=0 WHERE id=?').bind(m.id).run();
  }
}
async function doReturn(env, m){
  const r = await getV(env, m.from_vid);
  if (!r || r.uid !== m.uid){ await env.DB.prepare('DELETE FROM moves WHERE id=?').bind(m.id).run(); return true; }
  const P = await getP(env, r.uid) || { builders:2, builder_until:0 };
  const d = JSON.parse(r.data);
  if (!d.troops) d.troops = {};
  d._away = await awaySum(env, r.id);
  advance(d, m.arrive, P);
  const tr = JSON.parse(m.troops || '{}'), lo = JSON.parse(m.loot || '{}'), c = caps(d);
  for (const k in tr) d.troops[k] = (d.troops[k] || 0) + tr[k];
  for (const x of RES) if (lo[x]) d.res[x] = Math.min(x === 'wheat' ? c.gran : c.store, d.res[x] + lo[x]);
  const res = await env.DB.batch([ vUpd(env, r, d, Date.now()),
    env.DB.prepare('DELETE FROM moves WHERE id=?' + GUARD).bind(m.id, r.id, r.ver + 1) ]);
  return res[0].meta.changes > 0;
}
function titleA(r){
  const nm = r.d.v ? r.d.v + ' (' + r.d.name + ')' : r.d.name;
  if (r.miss) return '↩️ ไม่พบเป้าหมายที่ (' + r.d.x + '|' + r.d.y + ')';
  if (r.mission === 'scout') return (r.win ? '👁️ สอดแนมสำเร็จ — ' : '👁️ สอดแนมล้มเหลว — ') + nm;
  return (r.win ? '⚔️ ชนะ — ' : '💀 พ่ายแพ้ — ') + (r.mission === 'raid' ? 'ปล้น ' : 'โจมตี ') + nm;
}
function titleD(r){
  if (r.mission === 'scout') return '👁️ ตรวจพบการสอดแนมจาก ' + r.a.name;
  return (r.win ? '🔥 เมืองถูกตีแตก — ' : '🛡️ ป้องกันสำเร็จ — ') + r.a.name + ' บุก ' + r.d.v;
}
function repIns(env, uid, at, title, data, g, gb){
  return env.DB.prepare('INSERT INTO reports(uid,at,kind,title,data,read) SELECT ?,?,?,?,?,0 WHERE 1=1' + g)
    .bind(uid, at, 'war', title, JSON.stringify(data), ...gb);
}
async function doArrive(env, m){
  const t = Date.now(), at = m.arrive, tr = JSON.parse(m.troops || '{}');
  const aV = await getV(env, m.from_vid), aP = await getP(env, m.uid);
  const smA = aV ? smithyB(JSON.parse(aV.data)) : 1;
  const rep = { mission:m.mission, at,
    a:{ name:aP ? aP.name : '?', v:aV ? aV.name : '?', x:m.fx, y:m.fy, sent:tr, lost:{} },
    d:{ name:RUIN_NAME, v:'', x:m.tx, y:m.ty, troops:null, lost:{} }, loot:null, win:false };
  const st = [];
  let left = tr, loot = { wheat:0, wood:0, iron:0, clay:0 }, guardV = null, defUid = null, botTaunt = null;

  if (m.to_vid){
    const dr = await getV(env, m.to_vid);
    if (!dr || dr.x !== m.tx || dr.y !== m.ty) rep.miss = true;
    else {
      const dP = await getP(env, dr.uid) || { builders:2, builder_until:0, is_bot:2, name:RUIN_NAME };
      const dd = JSON.parse(dr.data);
      if (!dd.troops) dd.troops = {};
      dd._away = await awaySum(env, dr.id);
      advance(dd, at, dP);
      rep.d.name = dP.name; rep.d.v = dr.name;
      const wall = dd.wallLv || 0;
      let seen = true;
      if (m.mission === 'scout'){
        const o = scoutFight(tr, smA, dd);
        left = o.left; rep.a.lost = o.dead; rep.win = o.ok; seen = o.seen;
        if (o.ok) rep.intel = { res:roundRes(dd.res), troops:Object.assign({}, dd.troops), wall, hide:hideCap(dd) };
      } else {
        rep.d.troops = Object.assign({}, dd.troops);
        const f = fight(tr, smA, dd.troops, armouryB(dd), wall, m.mission, 10);
        const ka = kill(tr, f.la), kd = kill(dd.troops, f.ld);
        left = ka.left; dd.troops = kd.left;
        rep.a.lost = ka.dead; rep.d.lost = kd.dead; rep.win = f.win; rep.pw = { a:f.A, d:f.D };
        if (f.win){
          loot = takeLoot(dd.res, hideCap(dd), carryOf(left));
          for (const x of RES) dd.res[x] -= loot[x];
          const rams = ramCount(left);
          if (m.mission === 'attack' && rams > 0 && wall > 0){
            const drop = Math.min(wall, Math.floor(rams / (2 + wall * 0.6)));
            if (drop > 0){ dd.wallLv = wall - drop; rep.wall = [wall, dd.wallLv]; }
          }
        }
        rep.loot = loot;
      }
        if (dP.is_bot === 1 && aP && m.mission !== 'scout'){
        if (!dd.grudge) dd.grudge = {};
        const g0 = dd.grudge[m.uid] || { n:0, at:0 };
        dd.grudge[m.uid] = { n:Math.min(9, g0.n + 1), at };
        if (aP.is_bot === 0 && Math.random() < 0.6) botTaunt = { bot:dr.uid, to:m.uid, kind:rep.win ? 'hit' : 'held' };
      }
      st.push(vUpd(env, dr, dd, t)); guardV = dr;

      if (seen && dP.is_bot === 0) defUid = dr.uid;
    }
  } else {
    const T = tile(m.tx, m.ty);
    if (!T.npc) rep.miss = true;
    else {
      const k = m.tx + ',' + m.ty;
      const row = await env.DB.prepare('SELECT * FROM npc WHERE k=?').bind(k).first();
      const prev = row ? JSON.parse(row.res) : {};
      const hrs = row ? Math.max(0, (at - row.at) / 3600000) : 48;
      const res = {};
      for (const x of RES) res[x] = Math.min(5000, Math.floor((prev[x] || 0) + hrs * 120));
      const nd = Math.round(200 + (MAP_R - Math.min(MAP_R, Math.hypot(m.tx, m.ty))) * 12);
      rep.d.v = 'เมืองร้าง';
      if (m.mission === 'scout'){ rep.win = true; rep.intel = { res, troops:null, wall:0, npcDef:nd }; }
      else {
        const f = fight(tr, smA, {}, 1, 0, m.mission, nd);
        const ka = kill(tr, f.la);
        left = ka.left; rep.a.lost = ka.dead; rep.win = f.win; rep.pw = { a:f.A, d:f.D };
        if (f.win){ loot = takeLoot(res, 0, carryOf(left)); for (const x of RES) res[x] -= loot[x]; }
        rep.loot = loot;
        st.push(env.DB.prepare('INSERT INTO npc(k,at,res) VALUES(?,?,?) ON CONFLICT(k) DO UPDATE SET at=excluded.at, res=excluded.res')
          .bind(k, at, JSON.stringify(res)));
      }
    }
  }

  const g = guardV ? GUARD : '', gb = guardV ? [guardV.id, guardV.ver + 1] : [];
  const alive = tcount(left) > 0;
  if (alive){
    st.push(env.DB.prepare('UPDATE moves SET state=?, troops=?, loot=?, fx=?, fy=?, tx=?, ty=?, depart=?, arrive=?, lock=0, tries=0 WHERE id=?' + g)
      .bind('back', JSON.stringify(left), JSON.stringify(loot), m.tx, m.ty, m.fx, m.fy, at, at + (at - m.depart), m.id, ...gb));
  } else st.push(env.DB.prepare('DELETE FROM moves WHERE id=?' + g).bind(m.id, ...gb));

  if (aP && aP.is_bot === 0){
    const ar = JSON.parse(JSON.stringify(rep));
    if (!alive && m.mission !== 'scout'){ ar.d.troops = null; ar.d.lost = null; }
    st.push(repIns(env, m.uid, at, titleA(rep), ar, g, gb));
  }
  if (defUid){
    const dr2 = JSON.parse(JSON.stringify(rep));
    dr2.def = true;
    st.push(repIns(env, defUid, at, titleD(rep), dr2, g, gb));
  }
  const res = await env.DB.batch(st);
  if (botTaunt && (!guardV || res[0].meta.changes > 0)) await botMsg(env, botTaunt.bot, botTaunt.to, botTaunt.kind, Date.now());
  return guardV ? res[0].meta.changes > 0 : true;
}

/* ---------- ลงทะเบียน ---------- */
async function occSet(env){
  const r = await env.DB.prepare('SELECT x, y FROM villages').all();
  return new Set((r.results || []).map(v => v.x + ',' + v.y));
}
async function register(env, uid, claims, b){
  if (await env.DB.prepare('SELECT uid FROM players WHERE uid=?').bind(uid).first())
    return json({ ok:false, err:'บัญชีนี้ลงทะเบียนแล้ว' }, 200, env);
  const name = String(b.name || '').trim();
  if (name.length < 2 || name.length > 16) throw ue('ชื่อต้องยาว 2-16 ตัวอักษร');
  if (/[\/\\<>]/.test(name) || /^bot/i.test(name) || name.indexOf(RUIN_NAME) >= 0) throw ue('ชื่อนี้ใช้ไม่ได้');
  if (await env.DB.prepare('SELECT uid FROM players WHERE name=?').bind(name).first()) throw ue('ชื่อนี้มีผู้เล่นใช้แล้ว');
  const zone = Math.max(1, Math.min(4, (b.zone | 0) || 1)), tribe = Math.max(0, Math.min(3, b.tribe | 0)), t = Date.now();
  for (let i = 0; i < 3; i++){
    const s = findSpawn(zone, await occSet(env));
    if (!s) throw ue('ดินแดนนี้เต็มแล้ว ลองเลือกดินแดนอื่น');
    const d = newVillage(s.x, s.y, true, t);
    try {
      await env.DB.batch([
        env.DB.prepare('INSERT INTO players(uid,name,is_bot,tribe,zone,gold,cp,cp_at,builders,builder_until,protect_until,prov,created,seen) VALUES(?,?,0,?,?,?,0,?,2,0,?,?,?,?)')
          .bind(uid, name, tribe, zone, START_GOLD, t, t + PROTECT_DAYS * 86400000, provOf(claims), t, t),
        env.DB.prepare('INSERT INTO villages(uid,x,y,name,pop,data,ver,updated) VALUES(?,?,?,?,?,?,0,?)')
          .bind(uid, s.x, s.y, 'เมืองแรก', population(d), SJ(d), t)
      ]);
      return json({ ok:true, x:s.x, y:s.y }, 200, env);
    } catch (e){
      if (!/UNIQUE/i.test(String(e && e.message))) throw e;
      if (await env.DB.prepare('SELECT uid FROM players WHERE uid=?').bind(uid).first())
        return json({ ok:false, err:'บัญชีนี้ลงทะเบียนแล้ว' }, 200, env);
    }
  }
  throw ue('หาที่ตั้งเมืองไม่ได้ ลองใหม่อีกครั้ง');
}

/* ---------- ลบบัญชี → เมืองกลายเป็นเมืองร้าง ---------- */
async function ensureRuins(env){
  const t = Date.now();
  await env.DB.prepare("INSERT OR IGNORE INTO players(uid,name,is_bot,tribe,zone,gold,cp,cp_at,prov,created,seen) VALUES(?,?,2,0,1,0,0,0,'ruin',?,?)")
    .bind(RUIN_UID, RUIN_NAME, t, t).run();
}
async function deleteAccount(env, uid, b){
  const P = await getP(env, uid);
  if (!P) throw ue('ไม่พบบัญชี');
  if (String(b.name || '').trim() !== P.name) throw ue('พิมพ์ชื่อไม่ตรง');
  await ensureRuins(env);
  const vs = (await env.DB.prepare('SELECT * FROM villages WHERE uid=?').bind(uid).all()).results || [];
  const t = Date.now(), DB = env.DB, st = [];
  for (const r of vs){
    const d = JSON.parse(r.data);
    d.queue = []; d.train = {};
    st.push(DB.prepare('UPDATE villages SET uid=?, name=?, data=?, ver=ver+1, updated=? WHERE id=?').bind(RUIN_UID, RUIN_NAME, SJ(d), t, r.id));
  }
  st.push(DB.prepare('DELETE FROM moves WHERE uid=?').bind(uid));
  st.push(DB.prepare('UPDATE moves SET to_uid=? WHERE to_uid=?').bind(RUIN_UID, uid));
  st.push(DB.prepare('DELETE FROM reports WHERE uid=?').bind(uid));
  st.push(DB.prepare('DELETE FROM plans WHERE uid=?').bind(uid));
  st.push(DB.prepare('DELETE FROM msgs WHERE from_uid=? OR to_uid=?').bind(uid, uid));
  st.push(DB.prepare('DELETE FROM blocks WHERE uid=? OR target=?').bind(uid, uid));
  st.push(DB.prepare('INSERT INTO ledger(uid,delta,reason,note,at) VALUES(?,?,?,?,?)').bind(uid, -(P.gold | 0), 'delete', P.name, t));
  st.push(DB.prepare('DELETE FROM players WHERE uid=?').bind(uid));
  await DB.batch(st);
  return json({ ok:true, ruins:vs.length }, 200, env);
}

/* ---------- ข้อมูลสาธารณะ ---------- */
async function health(env){
  const one = async s => ((await env.DB.prepare(s).first()) || {}).n || 0;
  return json({ ok:true, version:VERSION, time:Date.now(),
    players:await one('SELECT COUNT(*) n FROM players WHERE is_bot=0'),
    bots:await one('SELECT COUNT(*) n FROM players WHERE is_bot=1'),
    villages:await one('SELECT COUNT(*) n FROM villages'),
    moves:await one('SELECT COUNT(*) n FROM moves'),
    payment:env.PAYMENT_ENABLED === '1' }, 200, env);
}


/* ---------- ร้านค้า (โครง) ---------- */
async function shopOrder(env, uid, b){
  if (env.PAYMENT_ENABLED !== '1') throw ue('ระบบเติมเงินยังไม่เปิดให้บริการ');
  const pk = PACKAGES.find(x => x.id === b.pkg);
  if (!pk) throw ue('ไม่พบแพ็กเกจ');
  if (!(await getP(env, uid))) throw ue('ยังไม่ได้ลงทะเบียน');
  const t = Date.now();
  const r = await env.DB.prepare('INSERT INTO orders(uid,pkg,gold,price,currency,status,ref,created) VALUES(?,?,?,?,?,?,?,?)')
    .bind(uid, pk.id, pk.gold + pk.bonus, pk.price, pk.cur, 'pending', '', t).run();
  const id = r.meta.last_row_id, ref = 'SW' + String(id).padStart(6, '0');
  await env.DB.prepare('UPDATE orders SET ref=? WHERE id=?').bind(ref, id).run();
  /* TODO B6: เชื่อมผู้ให้บริการรับชำระเงิน */
  return json({ ok:true, order:{ id, ref, gold:pk.gold + pk.bonus, price:pk.price, cur:pk.cur },
    pay:{ method:'manual', text:'ชำระเงินแล้วแจ้งเลขอ้างอิง ' + ref + ' กับทีมงาน' } }, 200, env);
}

/* =====================================================================
   แอดมิน
   ===================================================================== */
async function admin(p, b, q, env, by){
  const t = Date.now(), DB = env.DB;
  const one = async (s, ...a) => ((await DB.prepare(s).bind(...a).first()) || {}).n || 0;
  if (p === '/admin/stats'){
    const day0 = Math.floor((t + 7*3600000) / 86400000) * 86400000 - 7*3600000;
    const prov = (await DB.prepare('SELECT prov, COUNT(*) n FROM players WHERE is_bot=0 GROUP BY prov').all()).results || [];
    return json({ ok:true, now:t,
      players:await one('SELECT COUNT(*) n FROM players WHERE is_bot=0'),
      online:await one('SELECT COUNT(*) n FROM players WHERE is_bot=0 AND seen>?', t - ONLINE_MS),
      active24:await one('SELECT COUNT(*) n FROM players WHERE is_bot=0 AND seen>?', t - 86400000),
      newToday:await one('SELECT COUNT(*) n FROM players WHERE is_bot=0 AND created>=?', day0),
      bots:await one('SELECT COUNT(*) n FROM players WHERE is_bot=1'),
      villages:await one('SELECT COUNT(*) n FROM villages'),
      banned:await one('SELECT COUNT(*) n FROM players WHERE banned=1'),
      grant7:await one("SELECT COALESCE(SUM(delta),0) n FROM ledger WHERE reason='grant' AND at>?", t - 7*86400000),
      sold7:await one("SELECT COALESCE(SUM(delta),0) n FROM ledger WHERE reason='purchase' AND at>?", t - 7*86400000),
      pendingOrders:await one("SELECT COUNT(*) n FROM orders WHERE status='pending'"),
      prov, payment:env.PAYMENT_ENABLED === '1' }, 200, env);
  }
  if (p === '/admin/players'){
    const like = '%' + String(q.q || '').trim() + '%';
    const r = await DB.prepare('SELECT p.uid, p.name, p.gold, p.prov, p.created, p.seen, p.banned, p.zone, COUNT(v.id) vc, COALESCE(SUM(v.pop),0) pop FROM players p LEFT JOIN villages v ON v.uid=p.uid WHERE p.is_bot=0 AND p.name LIKE ? GROUP BY p.uid ORDER BY p.seen DESC LIMIT 500').bind(like).all();
    return json({ ok:true, now:t, list:r.results || [] }, 200, env);
  }
  if (p === '/admin/grant'){
    const amt = b.gold | 0;
    if (amt === 0 || Math.abs(amt) > 100000) throw ue('จำนวนทองต้องอยู่ระหว่าง 1 - 100,000');
    const pl = await DB.prepare('SELECT uid, name FROM players WHERE name=?').bind(String(b.name || '').trim()).first();
    if (!pl) throw ue('ไม่พบผู้เล่นชื่อนี้');
    await DB.batch([
      DB.prepare('UPDATE players SET gold=MAX(0, gold+?) WHERE uid=?').bind(amt, pl.uid),
      DB.prepare('INSERT INTO ledger(uid,delta,reason,note,at) VALUES(?,?,?,?,?)')
        .bind(pl.uid, amt, 'grant', String(b.note || '').slice(0, 120) + ' (by ' + by.slice(0, 6) + ')', t)
    ]);
    return json({ ok:true, name:pl.name, gold:amt }, 200, env);
  }
  if (p === '/admin/ban'){
    await DB.prepare('UPDATE players SET banned=? WHERE uid=? AND is_bot=0').bind(b.ban ? 1 : 0, String(b.uid)).run();
    return json({ ok:true }, 200, env);
  }
  if (p === '/admin/ledger'){
    const r = await DB.prepare('SELECT l.*, p.name FROM ledger l LEFT JOIN players p ON p.uid=l.uid ORDER BY l.id DESC LIMIT 200').all();
    return json({ ok:true, list:r.results || [] }, 200, env);
  }
  if (p === '/admin/orders'){
    const r = await DB.prepare('SELECT o.*, p.name FROM orders o LEFT JOIN players p ON p.uid=o.uid ORDER BY o.id DESC LIMIT 200').all();
    return json({ ok:true, list:r.results || [] }, 200, env);
  }
  if (p === '/admin/paid'){
    const o = await DB.prepare("SELECT * FROM orders WHERE id=? AND status='pending'").bind(b.id | 0).first();
    if (!o) throw ue('ไม่พบคำสั่งซื้อที่รอชำระ');
    const r = await DB.prepare("UPDATE orders SET status='paid', paid=? WHERE id=? AND status='pending'").bind(t, o.id).run();
    if (!r.meta.changes) throw ue('คำสั่งซื้อนี้ถูกจัดการไปแล้ว');
    await DB.batch([
      DB.prepare('UPDATE players SET gold=gold+? WHERE uid=?').bind(o.gold, o.uid),
      DB.prepare('INSERT INTO ledger(uid,delta,reason,note,at) VALUES(?,?,?,?,?)').bind(o.uid, o.gold, 'purchase', o.ref, t)
    ]);
    return json({ ok:true }, 200, env);
  }
  if (p === '/admin/bots'){
    if (b.action === 'spawn') return json({ ok:true, spawned:await spawnBots(env, Math.max(1, Math.min(50, (b.n | 0) || 10))) }, 200, env);
    if (b.action === 'tick'){ await botTick(env); return json({ ok:true }, 200, env); }
    if (b.action === 'clear'){
      await DB.batch([
        DB.prepare('UPDATE moves SET to_vid=NULL, to_uid=NULL WHERE to_uid IN (SELECT uid FROM players WHERE is_bot=1)'),
        DB.prepare('DELETE FROM villages WHERE uid IN (SELECT uid FROM players WHERE is_bot=1)'),
        DB.prepare('DELETE FROM players WHERE is_bot=1'),
        DB.prepare('DELETE FROM guilds WHERE is_bot=1')

      ]);
      return json({ ok:true }, 200, env);
    }
    throw ue('action ต้องเป็น spawn / tick / clear');
  }
  return json({ ok:false, err:'ไม่พบคำสั่งแอดมิน' }, 404, env);
}

/* =====================================================================
   บอทกลาง — ใช้กติกาเดียวกับผู้เล่นจริง
   ===================================================================== */
const BOT_PRE = ['ขุน','หมื่น','พระยา','เจ้า','ท้าว','นาย','จมื่น','พ่อขุน','หลวง','แสน'];
const BOT_NM = ['ศรีราชา','ไกรสร','เพชรา','อินทรา','สุริยา','ทองคำ','กาฬสิงห์','วิเศษ','รามราช','ภักดี','ชัยยศ','บุญมา',
  'อุดม','แก้วกล้า','สิงหนาท','มังกร','ช้างเผือก','เมฆา','ธารา','พิชัย','อโนชา','เทพา','วายุ','พสุธา','นาคราช',
  'สายฟ้า','ภูผา','จันทรา','ดาวเรือง','มหาวงศ์'];
const PERS = ['eco', 'war', 'turt', 'exp'];
const PLAN = {
  eco:['warehouse','granary','market','mill','sawmill','brickyard','foundry','embassy','barracks'],
  war:['barracks','smithy','armoury','stable','warehouse','granary','watchtower','wall'],
  turt:['wall','warehouse','granary','cranny','watchtower','barracks','armoury'],
  exp:['warehouse','granary','residence','embassy','townhall','market','barracks']
};
function pick(a){ return a[Math.floor(Math.random() * a.length)]; }
function persona(uid){
  let s = 0;
  for (let i = 0; i < uid.length; i++) s = (Math.imul(s, 31) + uid.charCodeAt(i)) | 0;
  return PERS[(s >>> 0) % PERS.length];
}
async function spawnBots(env, n){
  const t = Date.now(), occ = await occSet(env);
  const used = new Set(((await env.DB.prepare('SELECT name FROM players').all()).results || []).map(r => String(r.name).toLowerCase()));
  const st = [];
  let made = 0;
  for (let i = 0; i < n; i++){
    const zone = 1 + Math.floor(Math.random() * 4), s = findSpawn(zone, occ);
    if (!s) break;
    occ.add(s.x + ',' + s.y);
    let name = pick(BOT_PRE) + pick(BOT_NM), k = 2;
    while (used.has(name.toLowerCase())) name = pick(BOT_PRE) + pick(BOT_NM) + ' ' + (k++);
    used.add(name.toLowerCase());
    const uid = 'bot_' + t.toString(36) + '_' + i + Math.floor(Math.random() * 999);
    const d = newVillage(s.x, s.y, true, t);
    st.push(env.DB.prepare('INSERT INTO players(uid,name,is_bot,tribe,zone,gold,cp,cp_at,prov,created,seen) VALUES(?,?,1,?,?,0,0,?,?,?,?)')
      .bind(uid, name, Math.floor(Math.random() * 4), zone, t, 'bot', t, t));
    st.push(env.DB.prepare('INSERT INTO villages(uid,x,y,name,pop,data,ver,updated) VALUES(?,?,?,?,?,?,0,?)')
      .bind(uid, s.x, s.y, 'เมือง' + name, population(d), SJ(d), t));
    made++;
  }
  if (st.length) await env.DB.batch(st);
  return made;
}
function lowestField(d, res){
  let bi = -1, bl = 99;
  d.fields.forEach((f, i) => {
    if ((!res || f.res === res) && f.level < bl && !d.queue.some(q => q.kind === 'field' && q.slot === i)){ bl = f.level; bi = i; }
  });
  return bi;
}
function slotFor(d, k){
  if (k === 'wall') return ['wall', 0, null];
  let bi = -1, bl = 99;
  d.city.forEach((c, i) => {
    if (c.k === k && c.level < bl && !d.queue.some(q => q.kind === 'city' && q.slot === i)){ bl = c.level; bi = i; }
  });
  if (bi >= 0) return ['city', bi, null];
  const e = d.city.findIndex((c, i) => i > 1 && !c.k);
  return e >= 0 ? ['city', e, k] : null;
}
function botOptions(d, pk){
  const out = [], c = caps(d);
  if (rate(d, 'wheat') < 4){ const i = lowestField(d, 'wheat'); if (i >= 0) out.push(['field', i]); }
  if (['wood','iron','clay'].some(r => d.res[r] > c.store * 0.8)){ const s = slotFor(d, 'warehouse'); if (s) out.push(s); }
  if (d.res.wheat > c.gran * 0.8){ const s = slotFor(d, 'granary'); if (s) out.push(s); }
  const avg = d.fields.reduce((a, f) => a + f.level, 0) / d.fields.length;
  if (lvl(d, 'main') < Math.min(20, Math.floor(avg) + 3)){ const s = slotFor(d, 'main'); if (s) out.push(s); }
  const fld = lowestField(d, null), fieldFirst = Math.random() < (pk === 'eco' ? 0.75 : 0.55);
  if (fieldFirst && fld >= 0) out.push(['field', fld]);
  for (const k of PLAN[pk]){ const s = slotFor(d, k); if (s) out.push(s); }
  if (!fieldFirst && fld >= 0) out.push(['field', fld]);
  return out;
}
function botBuild(d, P, VS, t, uid){
  const pk = persona(uid);
  for (let guard = 0; guard < 6 && d.queue.length < 2; guard++){
    let done = false;
    for (const o of botOptions(d, pk)){
      try { enqueue(d, P, VS, t, o[0], o[1], o[2]); done = true; break; }
      catch (e){ if (!e.user) throw e; }
    }
    if (!done) break;
  }
}


/* =====================================================================
   B2.5 : แชต · บล็อก · เปลี่ยนชื่อ · แผนการรบ
   ===================================================================== */
const CHAT_MAX = 500, CHAT_GAP = 2000, CHAT_HOUR = 120, CHAT_KEEP = 30 * 86400000;
const RENAME_COST = 100, RENAME_GAP = 7 * 86400000;
const SCHED_GOLD = 40, SCHED_DAYS = 7, PLAN_MAX = 20;

function convKey(a, b){ return a < b ? a + '|' + b : b + '|' + a; }
function cleanName(n){
  n = String(n || '').trim();
  if (n.length < 2 || n.length > 16) throw ue('ชื่อต้องยาว 2-16 ตัวอักษร');
  if (/[\/\\<>]/.test(n) || /^bot/i.test(n) || n.indexOf(RUIN_NAME) >= 0) throw ue('ชื่อนี้ใช้ไม่ได้');
  return n;
}
async function whoOf(env, b, me){
  let o = null;
  if (b.uid) o = await env.DB.prepare('SELECT uid, name, is_bot FROM players WHERE uid=?').bind(String(b.uid)).first();
  else if (b.name) o = await env.DB.prepare('SELECT uid, name, is_bot FROM players WHERE name=?').bind(String(b.name).trim()).first();
  if (!o) throw ue('ไม่พบผู้เล่นชื่อนี้');
  if (o.uid === me.uid) throw ue('ส่งข้อความหาตัวเองไม่ได้');
  if (o.is_bot === 2) throw ue('เมืองร้างไม่มีเจ้าของ');
  return o;
}

async function social(p, b, env, uid){
  if (p !== '/account/rename' && p.indexOf('/chat/') !== 0 && p.indexOf('/plan/') !== 0) return null;
  const DB = env.DB, t = Date.now();
  const ok = o => json(Object.assign({ ok:true }, o || {}), 200, env);
  const me = await getP(env, uid);
  if (!me) throw ue('ยังไม่ได้ลงทะเบียน');
  if (me.banned) throw ue('บัญชีนี้ถูกระงับ');

  /* ---------- เปลี่ยนชื่อผู้เล่น ---------- */
  if (p === '/account/rename'){
    const nm = cleanName(b.name);
    if (nm === me.name) throw ue('เป็นชื่อเดิมอยู่แล้ว');
    const n = me.rename_n | 0, cost = n > 0 ? RENAME_COST : 0;
    if (n > 0 && t - (me.rename_at || 0) < RENAME_GAP)
      throw ue('เปลี่ยนชื่อได้อีกครั้งใน ' + Math.ceil((RENAME_GAP - (t - me.rename_at)) / 86400000) + ' วัน');
    if ((me.gold | 0) < cost) throw ue('ทองไม่พอ (ต้องใช้ ' + cost + ')');
    if (await DB.prepare('SELECT uid FROM players WHERE name=? AND uid<>?').bind(nm, uid).first())
      throw ue('ชื่อนี้มีผู้เล่นใช้แล้ว');
    let r;
    try {
      r = await DB.prepare('UPDATE players SET name=?, old_name=?, rename_n=rename_n+1, rename_at=?, gold=gold-? WHERE uid=? AND gold>=? AND rename_n=?')
        .bind(nm, me.name, t, cost, uid, cost, n).run();
    } catch (e){
      if (/UNIQUE/i.test(String(e && e.message))) throw ue('ชื่อนี้มีผู้เล่นใช้แล้ว');
      throw e;
    }
    if (!r.meta.changes) throw ue('ลองใหม่อีกครั้ง');
    if (cost) await DB.prepare('INSERT INTO ledger(uid,delta,reason,note,at) VALUES(?,?,?,?,?)')
      .bind(uid, -cost, 'rename', me.name + ' → ' + nm, t).run();
    return ok({ name:nm, cost });
  }

  /* ---------- แชต ---------- */
  if (p === '/chat/inbox'){
    const rows = (await DB.prepare('SELECT m.conv, m.from_uid, m.to_uid, m.text, m.at, (SELECT COUNT(*) FROM msgs u WHERE u.conv=m.conv AND u.to_uid=? AND u.read=0) AS unread FROM msgs m WHERE m.id IN (SELECT MAX(id) FROM msgs WHERE from_uid=? OR to_uid=? GROUP BY conv) ORDER BY m.id DESC LIMIT 50')
      .bind(uid, uid, uid).all()).results || [];
    const others = rows.map(x => x.from_uid === uid ? x.to_uid : x.from_uid), names = {};
    if (others.length){
      const q = await DB.prepare('SELECT uid, name FROM players WHERE uid IN (' + others.map(() => '?').join(',') + ')').bind(...others).all();
      for (const r of (q.results || [])) names[r.uid] = r.name;
    }
    const bl = new Set(((await DB.prepare('SELECT target FROM blocks WHERE uid=?').bind(uid).all()).results || []).map(r => r.target));
    return ok({ list:rows.map((x, i) => ({ uid:others[i], name:names[others[i]] || '(ลบบัญชีแล้ว)', text:x.text,
      at:x.at, mine:x.from_uid === uid, unread:x.unread | 0, blocked:bl.has(others[i]) })) });
  }
  if (p === '/chat/thread'){
    const o = await whoOf(env, b, me), conv = convKey(uid, o.uid);
    const rows = ((await DB.prepare('SELECT id, from_uid, text, at FROM msgs WHERE conv=? AND id>? ORDER BY id DESC LIMIT 100')
      .bind(conv, b.after | 0).all()).results || []).reverse();
    const rd = await DB.prepare('UPDATE msgs SET read=1 WHERE conv=? AND to_uid=? AND read=0').bind(conv, uid).run();
    const blocked = !!(await DB.prepare('SELECT 1 x FROM blocks WHERE uid=? AND target=?').bind(uid, o.uid).first());
    return ok({ with:{ uid:o.uid, name:o.name }, blocked, readN:rd.meta.changes || 0,
      list:rows.map(m => ({ id:m.id, mine:m.from_uid === uid, text:m.text, at:m.at })) });
  }
  if (p === '/chat/send'){
    const o = await whoOf(env, b, me);
    const text = String(b.text || '').replace(/\r/g, '').trim();
    if (!text) throw ue('พิมพ์ข้อความก่อน');
    if (text.length > CHAT_MAX) throw ue('ข้อความยาวเกิน ' + CHAT_MAX + ' ตัวอักษร');
    const last = await DB.prepare('SELECT at FROM msgs WHERE from_uid=? ORDER BY id DESC LIMIT 1').bind(uid).first();
    if (last && t - last.at < CHAT_GAP) throw ue('ส่งเร็วเกินไป รอสักครู่');
    const hr = ((await DB.prepare('SELECT COUNT(*) n FROM msgs WHERE from_uid=? AND at>?').bind(uid, t - 3600000).first()) || {}).n || 0;
    if (hr >= CHAT_HOUR) throw ue('ส่งครบ ' + CHAT_HOUR + ' ข้อความในชั่วโมงนี้แล้ว');
    if (await DB.prepare('SELECT 1 x FROM blocks WHERE uid=? AND target=?').bind(uid, o.uid).first())
      throw ue('คุณบล็อกผู้เล่นนี้อยู่ ปลดบล็อกก่อนจึงจะส่งได้');
    if (await DB.prepare('SELECT 1 x FROM blocks WHERE uid=? AND target=?').bind(o.uid, uid).first())
      throw ue('ผู้เล่นนี้ไม่รับข้อความจากคุณ');
    const r = await DB.prepare('INSERT INTO msgs(conv,from_uid,to_uid,text,at,read,reported) VALUES(?,?,?,?,?,0,0)')
      .bind(convKey(uid, o.uid), uid, o.uid, text, t).run();
    return ok({ id:r.meta.last_row_id, to:o.uid });
  }
  if (p === '/chat/block'){
    const o = await whoOf(env, b, me);
    if (b.on){
      await DB.prepare('INSERT OR IGNORE INTO blocks(uid,target,at) VALUES(?,?,?)').bind(uid, o.uid, t).run();
      await DB.prepare('UPDATE msgs SET read=1 WHERE conv=? AND to_uid=?').bind(convKey(uid, o.uid), uid).run();
    } else await DB.prepare('DELETE FROM blocks WHERE uid=? AND target=?').bind(uid, o.uid).run();
    return ok({ blocked:!!b.on });
  }
  if (p === '/chat/blocks'){
    const r = await DB.prepare('SELECT b.target AS uid, p.name FROM blocks b LEFT JOIN players p ON p.uid=b.target WHERE b.uid=? ORDER BY b.at DESC').bind(uid).all();
    return ok({ list:r.results || [] });
  }
  if (p === '/chat/report'){
    const m = await DB.prepare('SELECT m.id, m.from_uid, m.text, m.at, p.name FROM msgs m LEFT JOIN players p ON p.uid=m.from_uid WHERE m.id=? AND m.to_uid=?')
      .bind(b.id | 0, uid).first();
    if (!m) throw ue('ไม่พบข้อความ');
    await DB.prepare('UPDATE msgs SET reported=1 WHERE id=?').bind(m.id).run();
    return ok({ msg:m });
  }

  /* ---------- แผนการรบ ---------- */
  if (p === '/plan/list'){
    const r = await DB.prepare('SELECT id, vid, tx, ty, mission, troops, fire_at FROM plans WHERE uid=? ORDER BY fire_at').bind(uid).all();
    return ok({ until:me.sched_until || 0,
      list:(r.results || []).map(x => Object.assign(x, { troops:JSON.parse(x.troops || '{}') })) });
  }
  if (p === '/plan/add'){
    if ((me.sched_until || 0) <= t) throw ue('ต้องซื้อสิทธิ์แผนการรบก่อน');
    const fire = Math.floor(+b.fireAt || 0);
    if (fire < t + 60000) throw ue('ต้องตั้งเวลาล่วงหน้าอย่างน้อย 1 นาที');
    if (fire > me.sched_until) throw ue('เวลาที่ตั้งเกินวันหมดสิทธิ์แผนการรบ');
    if (!['attack', 'raid', 'scout'].includes(b.mission)) throw ue('ภารกิจไม่ถูกต้อง');
    const n = ((await DB.prepare('SELECT COUNT(*) n FROM plans WHERE uid=?').bind(uid).first()) || {}).n || 0;
    if (n >= PLAN_MAX) throw ue('ตั้งแผนได้สูงสุด ' + PLAN_MAX + ' แผน');
    if (!(await DB.prepare('SELECT id FROM villages WHERE id=? AND uid=?').bind(b.vid | 0, uid).first()))
      throw ue('ไม่พบเมืองนี้');
    const tr = {};
    let c = 0;
    for (const k in (b.troops || {})){
      const v = Math.floor(b.troops[k]), u = UNITS[k];
      if (v > 0 && u && u.tribe === me.tribe){ tr[k] = v; c += v; }
    }
    if (!c) throw ue('ยังไม่ได้เลือกทหาร');
    const tx = b.tx | 0, ty = b.ty | 0;
    if (Math.abs(tx) > MAP_R || Math.abs(ty) > MAP_R) throw ue('พิกัดอยู่นอกแผนที่');
    await DB.prepare('INSERT INTO plans(uid,vid,tx,ty,mission,troops,fire_at,created) VALUES(?,?,?,?,?,?,?,?)')
      .bind(uid, b.vid | 0, tx, ty, b.mission, JSON.stringify(tr), fire, t).run();
    return ok({});
  }
  if (p === '/plan/del'){
    await DB.prepare('DELETE FROM plans WHERE id=? AND uid=?').bind(b.id | 0, uid).run();
    return ok({});
  }
  return json({ ok:false, err:'ไม่พบคำสั่ง ' + p }, 404, env);
}

/* ส่งทัพตามแผน — เรียกจาก Cron ทุก 1 นาที */
async function firePlans(env, t){
  const rows = (await env.DB.prepare('SELECT * FROM plans WHERE fire_at<=? ORDER BY fire_at LIMIT 25').bind(t).all()).results || [];
  for (const r of rows){
    const d = await env.DB.prepare('DELETE FROM plans WHERE id=?').bind(r.id).run();
    if (!d.meta.changes) continue;
    let err = null;
    try {
      const out = await session(env, r.uid, ctx => sendArmy(ctx, env,
        { vid:r.vid, tx:r.tx, ty:r.ty, mission:r.mission, troops:JSON.parse(r.troops || '{}') }));
      if (!out) err = 'ไม่พบบัญชี';
      else if (!out.ok) err = out.err || 'ไม่ทราบสาเหตุ';
    } catch (e){ err = (e && e.user) ? e.message : 'ระบบผิดพลาด'; }
    const title = err ? '⏰ แผนการรบล้มเหลว — ' + err
                      : '⏰ แผนการรบออกเดินทางแล้ว → (' + r.tx + '|' + r.ty + ')';
    await env.DB.prepare('INSERT INTO reports(uid,at,kind,title,data,read) VALUES(?,?,?,?,?,0)')
      .bind(r.uid, t, 'war', title, JSON.stringify({ plan:{ tx:r.tx, ty:r.ty, mission:r.mission } })).run();
  }
}
async function socialCleanup(env, t){
  await env.DB.prepare('DELETE FROM msgs WHERE at<?').bind(t - CHAT_KEEP).run();
}

/* =====================================================================
   B3 : บอทคิดเอง (ออกรบ · ความแค้น · กิลด์ · ขยายเมือง · ตอบแชต) · ภารกิจ
   ===================================================================== */
const BOT_HIT_PLAYERS = true;   // false = บอทไม่บุกผู้เล่นจริง
const BOT_ATT_MAX = 8;          // บอทออกรบได้สูงสุดกี่ขบวนต่อรอบ (ทุก 5 นาที)
const BOT_RANGE = 22;           // ระยะที่บอทมองหาเป้าหมาย
const BOT_GUILDS = 8;           // จำนวนกิลด์บอทสูงสุด
const GUILD_MAX = 12;
const CPN = [0, 0, 500, 1400, 3000, 5500, 9000, 14000];

/* ---------- ข้อมูลสาธารณะ (มีแท็กกิลด์) ---------- */
async function world(env){
  const r = await env.DB.prepare('SELECT v.id, v.x, v.y, v.name AS vn, v.pop, v.uid, p.name AS pn, p.is_bot AS bot, g.tag AS gt FROM villages v JOIN players p ON p.uid=v.uid LEFT JOIN guilds g ON g.id=p.guild_id WHERE p.banned=0 LIMIT 5000').all();
  return json({ ok:true, now:Date.now(), v:r.results || [] }, 200, env);
}
async function rank(env, q){
  if (q.f === 'g'){
    const r = await env.DB.prepare('SELECT g.name, g.tag, COUNT(DISTINCT p.uid) AS mc, COUNT(v.id) AS vc, COALESCE(SUM(v.pop),0) AS pop FROM guilds g JOIN players p ON p.guild_id=g.id LEFT JOIN villages v ON v.uid=p.uid GROUP BY g.id ORDER BY pop DESC LIMIT 30').all();
    return json({ ok:true, list:r.results || [] }, 200, env);
  }
  const f = q.f === 'vc' ? 'vc' : 'pop';
  const r = await env.DB.prepare('SELECT p.name, g.tag, COUNT(v.id) AS vc, COALESCE(SUM(v.pop),0) AS pop FROM players p LEFT JOIN villages v ON v.uid=p.uid LEFT JOIN guilds g ON g.id=p.guild_id WHERE p.banned=0 AND p.is_bot<2 GROUP BY p.uid ORDER BY ' + f + ' DESC LIMIT 50').all();
  return json({ ok:true, list:r.results || [] }, 200, env);
}

/* ---------- บอทฝึกทหาร (บุก + ป้องกัน ตามบุคลิก) ---------- */
function botTrain(d, tribe, t, uid){
  const pk = persona(uid);
  const cap = pk === 'turt' ? 0.9 : pk === 'war' ? 0.8 : 0.5;
  if (tcount(d.troops) > population(d) * cap || rate(d, 'wheat') < 10) return;
  const plan = [];
  if (lvl(d, 'barracks') >= 1)
    plan.push(['barracks', (pk === 'turt' || pk === 'eco') ? (Math.random() < 0.75 ? 'inf_d' : 'inf_a')
                                                         : (Math.random() < 0.65 ? 'inf_a' : 'inf_d')]);
  if (lvl(d, 'stable') >= 3 && (pk === 'war' || pk === 'exp')) plan.push(['stable', 'cav_l']);
  for (const [bk, k] of plan){
    if (d.train && d.train[bk] && d.train[bk].length) continue;
    const id = 'u' + tribe + '_' + k, u = UNITS[id];
    if (!u) continue;
    let n = Math.floor(Math.min(...RES.map(r => (d.res[r] - 300) / Math.max(1, u.cost[r]))) * 0.5);
    n = Math.min(n, 30);
    if (n >= 1){ try { trainUnits(d, tribe, t, id, n); } catch (e){} }
  }
}

/* ---------- ภาพรวมโลกสำหรับบอทใช้ตัดสินใจ ---------- */
async function worldIndex(env){
  const v = (await env.DB.prepare('SELECT v.id, v.x, v.y, v.uid, v.pop, p.is_bot, p.protect_until, p.guild_id AS pg FROM villages v JOIN players p ON p.uid=v.uid WHERE p.banned=0').all()).results || [];
  const mv = (await env.DB.prepare('SELECT from_vid, troops FROM moves').all()).results || [];
  const busy = new Set(), away = {}, occ = new Set();
  for (const m of mv){ busy.add(m.from_vid); away[m.from_vid] = (away[m.from_vid] || 0) + tUp(JSON.parse(m.troops || '{}')); }
  for (const x of v) occ.add(x.x + ',' + x.y);
  return { vills:v, busy, away, occ, sent:0 };
}

/* ---------- บอทเลือกเป้าหมายและออกรบ ---------- */
function botAttack(d, r, W, t){
  const pk = persona(r.uid);
  const chance = pk === 'war' ? 0.55 : pk === 'exp' ? 0.35 : pk === 'eco' ? 0.2 : 0.1;
  const grudge = d.grudge || {};
  const hasGrudge = Object.keys(grudge).some(k => t - grudge[k].at < 3 * 86400000);
  if (W.busy.has(r.id) || W.sent >= BOT_ATT_MAX || lvl(d, 'rally') < 1) return null;
  if (Math.random() > (hasGrudge ? Math.max(chance, 0.6) : chance)) return null;

  const tr = {};
  let n = 0, minS = 99;
  for (const k in (d.troops || {})){
    const u = UNITS[k];
    if (!u || u.type === 'scout' || u.type === 'siege') continue;
    const keep = u.di > u.atk ? Math.ceil(d.troops[k] * 0.6) : 0;
    const s = d.troops[k] - keep;
    if (s <= 0) continue;
    tr[k] = s; n += s;
    if (u.spd < minS) minS = u.spd;
  }
  if (n < 10) return null;

  let best = null, bs = -1;
  for (const o of W.vills){
    if (o.uid === r.uid) continue;
    const dist = Math.hypot(o.x - r.x, o.y - r.y);
    if (dist > BOT_RANGE) continue;
    if (o.pg && o.pg === r.pg) continue;
    if (o.is_bot === 0 && (!BOT_HIT_PLAYERS || o.protect_until > t)) continue;
    const g = grudge[o.uid], gr = (g && t - g.at < 3 * 86400000) ? g.n : 0;
    if (o.is_bot === 0 && !gr && o.pop > r.pop * 1.2) continue;
    const s = (o.is_bot === 2 ? 3 : 1) * (1 + gr * 2) / (1 + dist * 0.15) *
              (o.pop < r.pop ? 1.5 : 0.7) * (0.7 + Math.random() * 0.6);
    if (s > bs){ bs = s; best = { x:o.x, y:o.y, vid:o.id, uid:o.uid, gr }; }
  }
  for (let i = 0; i < 12; i++){
    const x = r.x + Math.round((Math.random() * 2 - 1) * 10), y = r.y + Math.round((Math.random() * 2 - 1) * 10);
    if (Math.abs(x) > MAP_R || Math.abs(y) > MAP_R || W.occ.has(x + ',' + y)) continue;
    if (!tile(x, y).npc) continue;
    const s = 2 / (1 + Math.hypot(x - r.x, y - r.y) * 0.15) * (0.7 + Math.random() * 0.6);
    if (s > bs){ bs = s; best = { x, y, vid:null, uid:null, gr:0 }; }
  }
  if (!best) return null;

  for (const k in tr){ d.troops[k] -= tr[k]; if (d.troops[k] <= 0) delete d.troops[k]; }
  W.busy.add(r.id); W.sent++;
  const mis = (best.gr && pk === 'war' && Math.random() < 0.5) ? 'attack' : 'raid';
  const spd = minS * (1 + 0.03 * lvl(d, 'trainground'));
  const sec = Math.max(60, Math.round(Math.hypot(best.x - r.x, best.y - r.y) / spd * 3600 / SPEED));
  return [r.uid, r.id, r.x, r.y, best.x, best.y, best.vid, best.uid, mis, JSON.stringify(tr), '{}',
    t, t + sec * 1000, 'go', 0, 0];
}

/* ---------- รอบบอท (ทุก 5 นาที) ---------- */
async function botTick(env){
  const t = Date.now(), DB = env.DB;
  const nb = ((await DB.prepare('SELECT COUNT(*) n FROM players WHERE is_bot=1').first()) || {}).n || 0;
  if (nb < BOT_TARGET) await spawnBots(env, Math.min(BOT_SPAWN_PER_TICK, BOT_TARGET - nb));
  try { await botGuilds(env, t); } catch (e){ console.log('guild', e && e.message); }
  try { await botExpand(env, t); } catch (e){ console.log('expand', e && e.message); }
  try { await botReplies(env, t); } catch (e){ console.log('reply', e && e.message); }

  const rows = (await DB.prepare('SELECT v.*, p.tribe AS ptribe, p.guild_id AS pg FROM villages v JOIN players p ON p.uid=v.uid WHERE p.is_bot=1 ORDER BY v.updated ASC LIMIT ?').bind(BOT_BATCH).all()).results || [];
  const W = await worldIndex(env), st = [];
  for (const r of rows){
    const d = JSON.parse(r.data), P = { uid:r.uid, builders:2, builder_until:0, gold:0 };
    if (!d.troops) d.troops = {};
    d._away = W.away[r.id] || 0;
    advance(d, t, P); fill(d, t, P);
    botBuild(d, P, [{ row:r, d }], t, r.uid);
    botTrain(d, r.ptribe | 0, t, r.uid);
    const mv = botAttack(d, r, W, t);
    st.push(vUpd(env, r, d, t));
    if (mv) st.push(DB.prepare('INSERT INTO moves(uid,from_vid,fx,fy,tx,ty,to_vid,to_uid,mission,troops,loot,depart,arrive,state,lock,tries) SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,? WHERE (SELECT ver FROM villages WHERE id=?)=?')
      .bind(...mv, r.id, r.ver + 1));
  }
  if (st.length) await DB.batch(st);
}

/* ---------- กิลด์บอท ---------- */
const GN1 = ['สมาพันธ์','กองทัพ','พันธมิตร','แนวร่วม','สหาย','ภาคี'];
const GN2 = [['นาคา','NAG'],['ไกรสร','KRS'],['อินทรี','EGL'],['พยัคฆ์','TGR'],['ช้างเผือก','WHT'],['สุวรรณ','SUV'],
  ['อโยธยา','AYU'],['ล้านช้าง','LXC'],['ทวารวดี','DVR'],['หริภุญชัย','HPJ'],['ศรีวิชัย','SVJ'],['เชียงแสน','CSN']];
async function botGuilds(env, t){
  const DB = env.DB;
  const ng = ((await DB.prepare('SELECT COUNT(*) n FROM guilds WHERE is_bot=1').first()) || {}).n || 0;
  if (ng < BOT_GUILDS){
    const f = await DB.prepare('SELECT uid, zone FROM players WHERE is_bot=1 AND guild_id IS NULL ORDER BY RANDOM() LIMIT 1').first();
    if (f){
      const w = pick(GN2), base = pick(GN1) + w[0];
      for (let i = 0; i < 4; i++){
        const name = base + (i ? ' ' + (i + 1) : ''), tag = w[1] + (i ? i + 1 : '');
        try {
          const r = await DB.prepare('INSERT INTO guilds(name,tag,owner,is_bot,created) VALUES(?,?,?,1,?)').bind(name, tag, f.uid, t).run();
          const gid = r.meta.last_row_id;
          await DB.prepare('UPDATE players SET guild_id=? WHERE uid=? OR uid IN (SELECT uid FROM players WHERE is_bot=1 AND guild_id IS NULL AND zone=? ORDER BY RANDOM() LIMIT 6)')
            .bind(gid, f.uid, f.zone).run();
          break;
        } catch (e){ if (!/UNIQUE/i.test(String(e && e.message))) throw e; }
      }
    }
  }
  const lone = (await DB.prepare('SELECT uid, zone FROM players WHERE is_bot=1 AND guild_id IS NULL ORDER BY RANDOM() LIMIT 3').all()).results || [];
  for (const b of lone){
    if (Math.random() > 0.4) continue;
    const g = await DB.prepare('SELECT g.id FROM guilds g JOIN players o ON o.uid=g.owner WHERE g.is_bot=1 AND o.zone=? AND (SELECT COUNT(*) FROM players m WHERE m.guild_id=g.id) < ? ORDER BY RANDOM() LIMIT 1')
      .bind(b.zone, GUILD_MAX).first();
    if (g) await DB.prepare('UPDATE players SET guild_id=? WHERE uid=?').bind(g.id, b.uid).run();
  }
}

/* ---------- บอทขยายเมือง ---------- */
async function botExpand(env, t){
  const DB = env.DB;
  const ps = (await DB.prepare('SELECT * FROM players WHERE is_bot=1 ORDER BY RANDOM() LIMIT 4').all()).results || [];
  if (!ps.length) return;
  const occ = await occSet(env), st = [];
  for (const P of ps){
    const rows = (await DB.prepare('SELECT * FROM villages WHERE uid=?').bind(P.uid).all()).results || [];
    if (!rows.length) continue;
    const VS = rows.map(r => ({ row:r, d:JSON.parse(r.data) }));
    const cp = cpNow(P, VS, t), vc = rows.length;
    const cap = { exp:6, war:4, eco:4, turt:3 }[persona(P.uid)];
    if (vc < cap && cp >= (CPN[vc + 1] || 1e12) &&
        VS.some(V => lvl(V.d, 'main') >= 8 && population(V.d) >= 150)){
      const base = pick(rows);
      for (let k = 0; k < 40; k++){
        const a = Math.random() * Math.PI * 2, rad = 4 + Math.random() * 9;
        const x = Math.round(base.x + Math.cos(a) * rad), y = Math.round(base.y + Math.sin(a) * rad);
        if (canSettle(x, y) || occ.has(x + ',' + y)) continue;
        occ.add(x + ',' + y);
        const d = newVillage(x, y, false, t);
        st.push(DB.prepare('INSERT OR IGNORE INTO villages(uid,x,y,name,pop,data,ver,updated) VALUES(?,?,?,?,?,?,0,?)')
          .bind(P.uid, x, y, 'นคร' + pick(BOT_NM), population(d), SJ(d), t));
        break;
      }
    }
    st.push(DB.prepare('UPDATE players SET cp=?, cp_at=? WHERE uid=?').bind(cp, t, P.uid));
  }
  if (st.length) await DB.batch(st);
}

/* ---------- บอทคุยแชต ---------- */
const BOT_LINES = {
  hi:['สวัสดีท่าน ยินดีที่ได้รู้จัก','ทักมามีธุระอะไรหรือท่าน','สวัสดี เมืองท่านเป็นอย่างไรบ้าง','ยินดีต้อนรับสู่แผ่นดินนี้นะท่าน'],
  ally:['ถ้าท่านไม่ตีข้า ข้าก็ไม่ตีท่าน','เรื่องพันธมิตรไว้คุยกับหัวหน้ากิลด์ข้าดีกว่า','ข้ายังไม่ไว้ใจท่านนัก พิสูจน์ตัวก่อน','เป็นพันธมิตรกันก็ดี ศัตรูรอบข้างมีเยอะ'],
  threat:['มาสิ! กำแพงข้าแข็งพอ','ข้าไม่กลัวท่านหรอก','พูดเก่งนัก ลองมาดูสักตั้ง','ทหารข้ารอท่านอยู่แล้ว'],
  trade:['ตลาดยังไม่เปิดเลย ไว้ค่อยแลกกัน','ข้าขาดเหล็กอยู่พอดี ไว้คุยกันใหม่','ค้าขายดีกว่ารบกันนะท่าน'],
  sorry:['ครั้งนี้ข้ายกโทษให้ แต่อย่าให้มีอีก','อืม… ข้าจะจำไว้ว่าท่านยังมีน้ำใจ','ขอโทษแล้วก็แล้วกัน'],
  angry:['ท่านยังกล้าทักข้าอีกหรือ หลังจากที่ตีเมืองข้า','ข้ายังไม่ลืมเรื่องที่ท่านทำ','ระวังตัวไว้ให้ดี ข้ากำลังเตรียมทัพ'],
  hit:['ทำไมมาตีเมืองข้า! จำไว้เลย','ท่านจะต้องชดใช้','ปล้นข้าไปเท่าไร ข้าจะเอาคืนเป็นสองเท่า','นี่คือการประกาศสงครามใช่ไหม'],
  held:['กำแพงข้ายังอยู่ ลองใหม่สิ','อ่อนหัดนัก กลับไปฝึกทหารมาใหม่','ทหารท่านมาตายเปล่า ๆ เสียดายจริง'],
  ask:['ข้าก็ไม่แน่ใจนัก','ถามดีนะท่าน แต่ข้าตอบไม่ได้','ไว้ข้าคิดก่อนแล้วจะบอก'],
  bye:['แล้วพบกันใหม่ท่าน','ลาก่อน ขอให้เมืองท่านรุ่งเรือง'],
  def:['อืม','ข้ากำลังยุ่งกับการสร้างเมือง','ไว้คุยกันใหม่นะท่าน','ข้ารับทราบแล้ว','ฮ่า ๆ ท่านนี่ช่างพูดดี']
};
function intent(t){
  t = String(t || '');
  if (/ขอโทษ|โทษที|sorry/i.test(t)) return 'sorry';
  if (/สวัสดี|หวัดดี|ดีครับ|ดีค่ะ|hello|hi\b/i.test(t)) return 'hi';
  if (/พันธมิตร|ร่วมมือ|กิลด์|เข้าพวก|ally/i.test(t)) return 'ally';
  if (/ตี|บุก|ฆ่า|ทำลาย|ยึด|ปล้น|รบ/.test(t)) return 'threat';
  if (/แลก|ขาย|ซื้อ|ตลาด|ค้า/.test(t)) return 'trade';
  if (/ลาก่อน|บาย|bye/i.test(t)) return 'bye';
  if (/\?|ไหม|มั้ย|อะไร|ยังไง|ทำไม/.test(t)) return 'ask';
  return 'def';
}
async function botMsg(env, bot, to, kind, t){
  if (await env.DB.prepare('SELECT 1 x FROM blocks WHERE uid=? AND target=?').bind(to, bot).first()) return;
  await env.DB.prepare('INSERT INTO msgs(conv,from_uid,to_uid,text,at,read,reported) VALUES(?,?,?,?,?,0,0)')
    .bind(convKey(bot, to), bot, to, pick(BOT_LINES[kind] || BOT_LINES.def), t).run();
}
async function botReplies(env, t){
  const DB = env.DB;
  const rows = (await DB.prepare('SELECT m.from_uid, m.to_uid, m.text FROM msgs m JOIN players p ON p.uid=m.to_uid WHERE p.is_bot=1 AND m.read=0 AND m.at<? ORDER BY m.id DESC LIMIT 30')
    .bind(t - 45000).all()).results || [];
  const seen = new Set();
  for (const m of rows){
    const k = m.from_uid + '|' + m.to_uid;
    if (seen.has(k)) continue;
    if (seen.size >= 10) break;
    seen.add(k);
    await DB.prepare('UPDATE msgs SET read=1 WHERE from_uid=? AND to_uid=? AND read=0').bind(m.from_uid, m.to_uid).run();
    let gr = 0;
    try {
      const v = await DB.prepare('SELECT data FROM villages WHERE uid=? LIMIT 1').bind(m.to_uid).first();
      const g = (JSON.parse(v.data).grudge || {})[m.from_uid];
      gr = (g && t - g.at < 3 * 86400000) ? g.n : 0;
    } catch (e){}
    let kind = intent(m.text);
    if (gr >= 1 && kind !== 'sorry' && kind !== 'threat') kind = 'angry';
    if (persona(m.to_uid) === 'war' && kind === 'def' && Math.random() < 0.4) kind = 'threat';
    await botMsg(env, m.to_uid, m.from_uid, kind, t);
  }
}

/* ---------- ภารกิจ ---------- */
const QUESTS = [
  { t:'หว่านกล้า', d:'อัปเกรดหลุมข้าวหลุมใดก็ได้ให้ถึง Lv.1', r:{ res:150 }, c:x => x.F('wheat', 1) >= 1 },
  { t:'ครบทุกทรัพยากร', d:'อัปเกรดหลุมไม้ เหล็ก และโคลน อย่างน้อยชนิดละ 1 หลุมให้ถึง Lv.1', r:{ res:200 },
    c:x => x.F('wood', 1) && x.F('iron', 1) && x.F('clay', 1) },
  { t:'ศาลาว่าการ', d:'อัปเกรดอาคารหลักเป็น Lv.2', r:{ res:250 }, c:x => x.L('main') >= 2 },
  { t:'คลังสินค้า', d:'สร้างคลังสินค้า', r:{ res:300 }, c:x => x.L('warehouse') >= 1 },
  { t:'ยุ้งฉาง', d:'สร้างยุ้งฉาง', r:{ res:300 }, c:x => x.L('granary') >= 1 },
  { t:'ทุ่งทั้งเมือง', d:'อัปเกรดหลุมทรัพยากรทั้ง 20 หลุมให้ถึง Lv.1', r:{ res:400, gold:5 }, c:x => x.F(null, 1) >= 20 },
  { t:'ตั้งชื่อเมือง', d:'เปลี่ยนชื่อเมืองแรก (⚙ → ✎ เปลี่ยนชื่อเมืองนี้)', r:{ res:200 }, c:x => x.V && x.V.row.name !== 'เมืองแรก' },
  { t:'ขยายศาลา', d:'อัปเกรดอาคารหลักเป็น Lv.3', r:{ res:400 }, c:x => x.L('main') >= 3 },
  { t:'ค่ายทหาร', d:'สร้างค่ายทหาร', r:{ res:500 }, c:x => x.L('barracks') >= 1 },
  { t:'ฝึกทหาร', d:'มีทหารรวมอย่างน้อย 5 นาย', r:{ res:500 }, c:x => x.troops >= 5 },
  { t:'ปล้นครั้งแรก', d:'ส่งทัพไปปล้นหรือโจมตีแล้วชนะ 1 ครั้ง (ลองเมืองร้างบนแผนที่ดูก่อน)', r:{ res:600, gold:10 },
    c:async x => (await x.n("SELECT COUNT(*) n FROM reports WHERE uid=? AND title LIKE '⚔️ ชนะ%'", x.uid)) > 0 },
  { t:'ทักทายเพื่อนบ้าน', d:'ส่งข้อความหาผู้เล่นคนใดก็ได้ (แตะเมืองบนแผนที่แล้วกด ✉)', r:{ res:300 },
    c:async x => (await x.n('SELECT COUNT(*) n FROM msgs WHERE from_uid=?', x.uid)) > 0 },
  { t:'กำแพงเมือง', d:'สร้างกำแพงเมือง', r:{ res:500 }, c:x => x.L('wall') >= 1 },
  { t:'เมืองเติบโต', d:'มีประชากรรวม 120 คน', r:{ res:800, gold:10 }, c:x => x.pop >= 120 },
  { t:'ศาลาใหญ่', d:'อัปเกรดอาคารหลักเป็น Lv.5', r:{ res:1000 }, c:x => x.L('main') >= 5 },
  { t:'นครใหญ่', d:'มีประชากรรวม 300 คน', r:{ res:1500, gold:20 }, c:x => x.pop >= 300 }
];
function qx(ctx, env){
  const VS = ctx.VS, uid = ctx.P.uid;
  let pop = 0, tr = 0;
  for (const V of VS){ pop += population(V.d); tr += tcount(V.d.troops); }
  for (const m of (ctx.moves || [])) if (m.uid === uid) tr += tcount(JSON.parse(m.troops || '{}'));
  return { V:VS[0], uid, pop, troops:tr,
    F:(res, lv) => { let n = 0; for (const V of VS) for (const f of V.d.fields) if ((!res || f.res === res) && f.level >= lv) n++; return n; },
    L:k => VS.reduce((m, V) => Math.max(m, lvl(V.d, k)), 0),
    n:async (sql, ...a) => (((await env.DB.prepare(sql).bind(...a).first()) || {}).n || 0) };
}
async function questReady(env, ctx){
  const q = QUESTS[ctx.P.quest | 0];
  if (!q || !ctx.VS.length) return false;
  try { return !!(await q.c(qx(ctx, env))); } catch (e){ return false; }
}
function questOut(P, ctx){
  const i = P.quest | 0, q = QUESTS[i];
  return { i, total:QUESTS.length, ready:!!ctx.qReady, t:q ? q.t : null, d:q ? q.d : null, r:q ? q.r : null };
}
async function questClaim(ctx, env, b){
  const i = ctx.P.quest | 0, q = QUESTS[i];
  if (!q) throw ue('ทำภารกิจครบทุกข้อแล้ว');
  if (!(await q.c(qx(ctx, env)))) throw ue('ยังทำภารกิจนี้ไม่สำเร็จ');
  const V = ctx.VS.find(x => x.row.id === (b.vid | 0)) || ctx.VS[0];
  const c = caps(V.d);
  for (const r of RES) V.d.res[r] = Math.min(r === 'wheat' ? c.gran : c.store, V.d.res[r] + (q.r.res || 0));
  V.dirty = true;
  const g = q.r.gold | 0;
  ctx.pset += ', quest=quest+1' + (g ? ', gold=gold+?' : '');
  if (g){
    ctx.pbind.push(g);
    ctx.ins.push({ t:'ledger', guard:V, cols:'uid,delta,reason,note,at', vals:[ctx.P.uid, g, 'quest', q.t, ctx.t] });
  }
  ctx.P.quest = i + 1; ctx.P.gold += g;
  return { quest:i, reward:q.r };
}
