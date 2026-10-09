var TRIBES = [
  { key:'north',  name:'อาณาจักรเหนือ', desc:'สมดุล ทหารม้าแข็ง',
    crannyMul:1.0, crannyPierce:0 },
  { key:'barbar', name:'ชนเผ่าเถื่อน',  desc:'รุกเร็ว ปล้นเก่ง',
    crannyMul:1.0, crannyPierce:0.20 },
  { key:'south',  name:'นครรัฐใต้',     desc:'ตั้งรับแน่น เร็วที่สุด',
    crannyMul:2.0, crannyPierce:0 }
];

/* ★ เวลาฝึกลดลง ~55% ★ */
var UNITS = {
  north: [
    { id:'n0', name:'ทหารหอก', atk:40, di:35, dc:50, spd:6, cap:50, up:1,
      cost:{wood:120,clay:100,iron:150,wheat:45}, t:260, b:'barracks', cls:'inf' },
    { id:'n1', name:'ทหารดาบ', atk:60, di:65, dc:35, spd:5, cap:60, up:1,
      cost:{wood:100,clay:130,iron:260,wheat:55}, t:360, b:'barracks', cls:'inf' },
    { id:'n2', name:'นักสอดแนม', atk:0, di:20, dc:10, spd:16, cap:0, up:1,
      cost:{wood:145,clay:70,iron:85,wheat:35}, t:240, b:'stable', cls:'scout' },
    { id:'n3', name:'ม้าเบา', atk:90, di:25, dc:40, spd:14, cap:100, up:2,
      cost:{wood:300,clay:260,iron:520,wheat:140}, t:500, b:'stable', cls:'cav' },
    { id:'n4', name:'ม้าหนัก', atk:180, di:80, dc:105, spd:10, cap:70, up:3,
      cost:{wood:600,clay:550,iron:1000,wheat:225}, t:720, b:'stable', cls:'cav' },
    { id:'n5', name:'ปืนใหญ่', atk:75, di:60, dc:10, spd:3, cap:0, up:3,
      cost:{wood:950,clay:1350,iron:250,wheat:150}, t:1800, b:'workshop', cls:'cata' },
    { id:'n6', name:'ขุนพล', atk:50, di:40, dc:30, spd:4, cap:0, up:4,
      cost:{wood:8000,clay:9000,iron:12000,wheat:5600}, t:10800, b:'palace', cls:'chief' },
    { id:'n7', name:'ผู้ตั้งถิ่นฐาน', atk:0, di:80, dc:80, spd:5, cap:3000, up:1,
      cost:{wood:1500,clay:1750,iron:1250,wheat:650}, t:2400, b:'residence', cls:'settler' }
  ],
  barbar: [
    { id:'b0', name:'นักรบขวาน', atk:60, di:30, dc:20, spd:7, cap:60, up:1,
      cost:{wood:130,clay:90,iron:90,wheat:40}, t:200, b:'barracks', cls:'inf' },
    { id:'b1', name:'นักรบทวน', atk:30, di:45, dc:55, spd:7, cap:40, up:1,
      cost:{wood:100,clay:130,iron:85,wheat:40}, t:240, b:'barracks', cls:'inf' },
    { id:'b2', name:'หน่วยลาดตระเวน', atk:0, di:10, dc:5, spd:9, cap:0, up:1,
      cost:{wood:105,clay:55,iron:70,wheat:30}, t:200, b:'stable', cls:'scout' },
    { id:'b3', name:'ม้าปล้น', atk:110, di:30, dc:40, spd:16, cap:110, up:2,
      cost:{wood:350,clay:270,iron:610,wheat:110}, t:460, b:'stable', cls:'cav' },
    { id:'b4', name:'ม้าทัพ', atk:150, di:50, dc:75, spd:12, cap:80, up:3,
      cost:{wood:450,clay:515,iron:900,wheat:185}, t:620, b:'stable', cls:'cav' },
    { id:'b5', name:'ปืนใหญ่', atk:60, di:30, dc:10, spd:4, cap:0, up:3,
      cost:{wood:900,clay:1200,iron:250,wheat:150}, t:1650, b:'workshop', cls:'cata' },
    { id:'b6', name:'หัวหน้าเผ่า', atk:40, di:60, dc:40, spd:4, cap:0, up:4,
      cost:{wood:7000,clay:8000,iron:10000,wheat:5000}, t:9000, b:'palace', cls:'chief' },
    { id:'b7', name:'ผู้ตั้งถิ่นฐาน', atk:10, di:80, dc:80, spd:5, cap:3000, up:1,
      cost:{wood:1400,clay:1600,iron:1200,wheat:600}, t:2400, b:'residence', cls:'settler' }
  ],
  south: [
    { id:'s0', name:'ทหารเกณฑ์', atk:15, di:40, dc:50, spd:7, cap:35, up:1,
      cost:{wood:120,clay:100,iron:80,wheat:35}, t:180, b:'barracks', cls:'inf' },
    { id:'s1', name:'ทหารโล่', atk:65, di:35, dc:20, spd:6, cap:45, up:1,
      cost:{wood:100,clay:130,iron:180,wheat:50}, t:300, b:'barracks', cls:'inf' },
    { id:'s2', name:'นักสืบ', atk:0, di:20, dc:10, spd:17, cap:0, up:1,
      cost:{wood:140,clay:60,iron:80,wheat:35}, t:225, b:'stable', cls:'scout' },
    { id:'s3', name:'ม้าธนู', atk:90, di:45, dc:45, spd:17, cap:65, up:2,
      cost:{wood:350,clay:280,iron:540,wheat:120}, t:540, b:'stable', cls:'cav' },
    { id:'s4', name:'ทหารเทวรูป', atk:150, di:115, dc:80, spd:10, cap:80, up:3,
      cost:{wood:500,clay:520,iron:1100,wheat:220}, t:690, b:'stable', cls:'cav' },
    { id:'s5', name:'ปืนใหญ่', atk:50, di:60, dc:10, spd:3, cap:0, up:3,
      cost:{wood:1000,clay:1450,iron:300,wheat:150}, t:1900, b:'workshop', cls:'cata' },
    { id:'s6', name:'ผู้นำสาร', atk:40, di:50, dc:50, spd:5, cap:0, up:3,
      cost:{wood:7500,clay:8500,iron:11000,wheat:5000}, t:9900, b:'palace', cls:'chief' },
    { id:'s7', name:'ผู้ตั้งถิ่นฐาน', atk:0, di:80, dc:80, spd:5, cap:3000, up:1,
      cost:{wood:1450,clay:1700,iron:1250,wheat:600}, t:2400, b:'residence', cls:'settler' }
  ]
};

var UNIT_MAP = {};
(function(){ for (var k in UNITS) UNITS[k].forEach(function(u){
  u.tribe = k; UNIT_MAP[u.id] = u; }); })();

function U(id){ return UNIT_MAP[id]; }
function myUnits(){ return UNITS[TRIBES[Game.player.tribe].key]; }

var ANIMALS = [
  { id:'a0', name:'หนูยักษ์',  atk:0, di:25,  dc:20,  up:1 },
  { id:'a1', name:'งูเหลือม',  atk:0, di:35,  dc:40,  up:1 },
  { id:'a2', name:'เสือโคร่ง', atk:0, di:100, dc:80,  up:2 },
  { id:'a3', name:'ช้างป่า',   atk:0, di:250, dc:140, up:3 },
  { id:'a4', name:'จระเข้',    atk:0, di:90,  dc:105, up:2 }
];
var GARRISON = [
  { id:'g0', name:'ทหารรักษาป้อม',   atk:50,  di:70,  dc:60,  up:1 },
  { id:'g1', name:'องครักษ์หลวง',    atk:70,  di:120, dc:95,  up:2 },
  { id:'g2', name:'ม้าศึกหลวง',      atk:140, di:80,  dc:130, up:3 },
  { id:'g3', name:'ทหารเอกราชวัลลภ', atk:190, di:180, dc:160, up:4 }
];
var NPC_MAP = {};
ANIMALS.forEach(function(a){ NPC_MAP[a.id] = a; });
GARRISON.forEach(function(g){ NPC_MAP[g.id] = g; });

function anyUnit(id){ return UNIT_MAP[id] || NPC_MAP[id] || null; }