/* ============ สุวรรณภูมิ : สงครามเจ้านคร — v12 ============ */
var DEV_MODE = true;

function qs(k){
  var m = location.search.match(new RegExp('[?&]' + k + '=([^&]*)'));
  return m ? decodeURIComponent(m[1]) : null;
}

var CFG = {
  GAME_NAME:'สุวรรณภูมิ : สงครามเจ้านคร',
  SERVER_ID: 1, SERVER_NAME:'ทวารวดี',
  SPEED: 1, TOTAL_DAYS: 45,
  SAVE_KEY: 'sw_s1_save', HOF_KEY: 'sw_s1_hof',
  SEED: 20260913 + 7777,
  MAP_RADIUS: 100,
  ZOOM_TILES: [252, 144, 90, 40, 24],
  ZOOM_DEFAULT: 2,
  ASSET_PATH: 'assets/',
  START_RES: { wheat:1000, wood:1000, iron:1000, clay:1000 },
  START_GOLD: 50, BASE_CAP: 3000,
  NOBUILD_RADIUS: 5, SPAWN_R: 70, SPAWN_BAND: 4,
  BUILDERS: 2, QUEUE_MAX: 4,
  FORT_OPEN_DAY: 20, CAPITAL_OPEN_DAY: 35, CAPITAL_HOLD_DAYS: 5,
  MERCHANT_CAP: 500, MERCHANT_SPEED: 12,
  PROTECT_DAYS: 5,
  BOT_COUNT: 120, BOT_GUILDS: 8,
  HERO_REVIVE_H: 3,
  OASIS_RATE: 0.062,
  OASIS_RANGE: 30,
  GUILD_COST: 50,
  BOOKMARK_MAX: 20,
  SCHED_GOLD: 40, SCHED_DAYS: 7
};

var RES = ['wheat','wood','iron','clay'];
var RES_TH = { wheat:'ข้าว', wood:'ไม้', iron:'เหล็ก', clay:'โคลน' };
var RES_IC = { wheat:'🌾', wood:'🪵', iron:'⛏️', clay:'🧱' };
var RES_COL = { wheat:'#d4b642', wood:'#5e9a48', iron:'#8f96a4', clay:'#b07a48' };

var B = { WATER:0, WETLAND:1, LOWLAND:2, GRASS:3, FOREST:4,
          DENSE:5, HILL:6, MOUNTAIN:7, DRY:8 };

var BIOMES = [
  { key:'water',    name:'แหล่งน้ำ',    color:'#2f6b8f', build:false, grp:'water', bonus:{} },
  { key:'wetland',  name:'ที่ลุ่มน้ำ',  color:'#3f7a6a', build:false, grp:'water', bonus:{} },
  { key:'lowland',  name:'ที่ราบลุ่ม',  color:'#7fa356', build:true,  grp:'land',
    bonus:{ wheat:0.10, clay:0.05 } },
  { key:'grass',    name:'ทุ่งหญ้า',    color:'#8cb45e', build:true,  grp:'land', bonus:{} },
  { key:'forest',   name:'ป่าโปร่ง',    color:'#5e8a48', build:true,  grp:'land',
    bonus:{ wood:0.10 } },
  { key:'dense',    name:'ป่าทึบ',      color:'#3a5c32', build:false, grp:'clay', bonus:{} },
  { key:'hill',     name:'เนินเขา',     color:'#9a8b62', build:false, grp:'rock', bonus:{} },
  { key:'mountain', name:'ภูเขา',       color:'#6f6558', build:false, grp:'rock', bonus:{} },
  { key:'dry',      name:'ที่แห้งแล้ง', color:'#ab9463', build:false, grp:'clay', bonus:{} }
];

var START_LAYOUT = { wheat:8, wood:4, iron:4, clay:4, nm:'มาตรฐานเริ่มต้น', rare:0 };

var LAYOUTS = [
  { wheat:8,  wood:4, iron:4, clay:4, nm:'มาตรฐาน',      w:260, rare:0 },
  { wheat:7,  wood:5, iron:4, clay:4, nm:'ป่าเขียว',      w:100, rare:0 },
  { wheat:7,  wood:4, iron:5, clay:4, nm:'นาเหล็ก',       w:100, rare:0 },
  { wheat:7,  wood:4, iron:4, clay:5, nm:'นาโคลน',        w:100, rare:0 },
  { wheat:5,  wood:5, iron:5, clay:5, nm:'เสมอภาค',       w:80,  rare:0 },
  { wheat:6,  wood:6, iron:4, clay:4, nm:'ดงไม้',         w:60,  rare:0 },
  { wheat:6,  wood:4, iron:6, clay:4, nm:'ขุมเหล็ก',      w:60,  rare:0 },
  { wheat:6,  wood:4, iron:4, clay:6, nm:'บ่อดินเหนียว',  w:60,  rare:0 },
  { wheat:4,  wood:5, iron:6, clay:5, nm:'ช่างฝีมือ',     w:50,  rare:0 },
  { wheat:10, wood:4, iron:3, clay:3, nm:'อู่ข้าว',       w:60,  rare:1 },
  { wheat:12, wood:3, iron:2, clay:3, nm:'ทุ่งมหานาค',    w:40,  rare:1 },
  { wheat:13, wood:3, iron:2, clay:2, nm:'นาสวรรค์',      w:22,  rare:2 },
  { wheat:15, wood:3, iron:1, clay:1, nm:'นาหลวง',        w:16,  rare:2 },
  { wheat:17, wood:1, iron:1, clay:1, nm:'ทุ่งทองคำ',     w:6,   rare:3 }
];
var LAYOUT_W = (function(){ var s=0; LAYOUTS.forEach(function(l){ s+=l.w; }); return s; })();

/* ============ อาคาร ============ */
var BUILDINGS = [
  { key:'empty', name:'ว่าง', ic:'➕', max:0, cost:null, cp:0, cat:'-', desc:'' },

  { key:'main', name:'อาคารหลัก', ic:'🏛️', max:20, cp:2, cat:'build', dup:1,
    cost:{wood:70,clay:40,iron:60,wheat:20}, req:[],
    desc:'ศูนย์กลางการปกครอง ยิ่งสูงยิ่งสร้างอาคารอื่นได้เร็ว เป็นเงื่อนไขของอาคารเกือบทุกหลัง',
    eff:function(l){ return 'ลดเวลาก่อสร้าง ' +
      Math.round((1 - Math.pow(0.964, l)) * 100) + '%'; } },

  { key:'rally', name:'ลานรวมพล', ic:'⚔️', max:20, cp:1, cat:'mil', dup:1,
    cost:{wood:110,clay:160,iron:90,wheat:70}, req:[],
    desc:'จุดรวมพลของกองทัพ ยิ่งสูงยิ่งส่งทัพพร้อมกันได้หลายขบวน และตั้งแผนการรบล่วงหน้าได้มากขึ้น',
    eff:function(l){ return 'ส่งทัพพร้อมกัน ' + rallySlots(l) + ' ขบวน · เดินทัพเร็ว +' +
      (l*1.5).toFixed(1) + '%' + (l >= 10 ? ' · เลือกเป้าปืนใหญ่ได้' : ''); } },

  { key:'warehouse', name:'คลังสินค้า', ic:'📦', max:20, cp:1, cat:'res', dup:3,
    cost:{wood:130,clay:160,iron:90,wheat:40}, req:[],
    desc:'เก็บไม้ เหล็ก โคลน · สร้างได้สูงสุด 3 หลังต่อเมือง ความจุรวมกันทั้งหมด',
    eff:function(l){ return 'ความจุ ' + UI.fmt(capacity(l)) + ' ต่อชนิด'; } },

  { key:'granary', name:'ยุ้งฉาง', ic:'🏚️', max:20, cp:1, cat:'res', dup:3,
    cost:{wood:80,clay:100,iron:70,wheat:20}, req:[],
    desc:'เก็บข้าวโดยเฉพาะ · สร้างได้สูงสุด 3 หลัง ข้าวสำคัญที่สุดเพราะเลี้ยงทั้งเมืองและกองทัพ',
    eff:function(l){ return 'ความจุข้าว ' + UI.fmt(capacity(l)); } },

  { key:'market', name:'ตลาด', ic:'🏪', max:20, cp:4, cat:'build', dup:1,
    cost:{wood:80,clay:70,iron:120,wheat:70},
    req:[{k:'main',lv:3},{k:'warehouse',lv:1},{k:'granary',lv:1}],
    desc:'ส่งทรัพยากรและซื้อขายแลกเปลี่ยนกับผู้เล่นอื่น ยิ่งระดับสูงยิ่งมีพ่อค้ามากและบรรทุกได้มาก',
    eff:function(l){ return 'พ่อค้า ' + l + ' คน · บรรทุกคนละ ' +
      UI.fmt(Math.round(500 * (1 + 0.08*l))); } },

  { key:'embassy', name:'สถานทูต', ic:'🏯', max:20, cp:6, cat:'build', dup:1,
    cost:{wood:180,clay:130,iron:150,wheat:80}, req:[{k:'main',lv:1}],
    desc:'สร้างหรือเข้าร่วมกิลด์ รับสมาชิกได้ 3 คนต่อระดับ · เป็นเงื่อนไขของศาลาประชาคมกับพระราชวัง',
    eff:function(l){ return 'รับสมาชิกกิลด์ได้ ' + (l*3) + ' คน'; } },

  { key:'barracks', name:'ค่ายทหาร', ic:'🛡️', max:20, cp:1, cat:'mil', dup:1,
    cost:{wood:210,clay:140,iron:260,wheat:120},
    req:[{k:'main',lv:3},{k:'rally',lv:1}],
    desc:'ฝึกทหารราบ กระดูกสันหลังของกองทัพทั้งรุกและรับ',
    eff:function(l){ return 'ฝึกเร็วขึ้น ' +
      Math.round((1 - Math.pow(0.89, l-1)) * 100) + '%'; } },

  /* ★ v12: โรงตีเหล็กแค่ Lv.1 ★ */
  { key:'stable', name:'คอกม้า', ic:'🐎', max:20, cp:2, cat:'mil', dup:1,
    cost:{wood:260,clay:140,iron:220,wheat:100},
    req:[{k:'barracks',lv:3},{k:'smithy',lv:1}],
    desc:'ฝึกทหารม้าและหน่วยสอดแนม เร็วกว่าแต่กินเสบียงมากกว่า',
    eff:function(l){ return 'ฝึกเร็วขึ้น ' +
      Math.round((1 - Math.pow(0.89, l-1)) * 100) + '%'; } },

  { key:'workshop', name:'โรงงาน', ic:'⚙️', max:20, cp:3, cat:'mil', dup:1,
    cost:{wood:460,clay:510,iron:600,wheat:320},
    req:[{k:'barracks',lv:3},{k:'main',lv:5}],
    desc:'สร้างปืนใหญ่สำหรับทำลายอาคารศัตรู ต้องชนะศึกก่อนถึงจะยิงได้',
    eff:function(l){ return 'ฝึกเร็วขึ้น ' +
      Math.round((1 - Math.pow(0.89, l-1)) * 100) + '%'; } },

  { key:'smithy', name:'โรงตีเหล็ก', ic:'🔨', max:20, cp:2, cat:'mil', dup:1,
    cost:{wood:180,clay:250,iron:500,wheat:160},
    req:[{k:'barracks',lv:1},{k:'main',lv:3}],
    desc:'เพิ่มพลังโจมตีทหารทุกหน่วยในเมืองนี้ และเป็นเงื่อนไขของคอกม้า',
    eff:function(l){ return 'โจมตี +' + (l*2) + '%'; } },

  { key:'armoury', name:'โรงฟอกหนัง', ic:'🦺', max:20, cp:2, cat:'mil', dup:1,
    cost:{wood:130,clay:210,iron:410,wheat:130},
    req:[{k:'barracks',lv:1},{k:'main',lv:3}],
    desc:'เพิ่มพลังป้องกันทหารทุกหน่วยในเมืองนี้',
    eff:function(l){ return 'ป้องกัน +' + (l*2) + '%'; } },

  { key:'wall', name:'กำแพงเมือง', ic:'🧱', max:20, cp:1, cat:'wall', dup:1,
    cost:{wood:110,clay:160,iron:70,wheat:0}, req:[],
    desc:'กำแพงล้อมรอบเมือง คูณพลังป้องกันทั้งเมืองแบบทบต้น มีช่องเฉพาะไม่แย่งช่องอาคาร',
    eff:function(l){ return 'ป้องกันทั้งเมือง +' +
      Math.round((Math.pow(1.03, l) - 1) * 100) + '%'; } },

  { key:'watchtower', name:'หอคอยเฝ้าระวัง', ic:'🗼', max:20, cp:2, cat:'mil', dup:1,
    cost:{wood:210,clay:180,iron:230,wheat:135}, req:[{k:'rally',lv:1}],
    desc:'ป้องกันการสอดแนมและมองเห็นขบวนศัตรูล่วงหน้า ถ้าไม่มีอาคารนี้คุณจะถูกโจมตีโดยไม่รู้ตัว',
    eff:function(l){ return 'ต้านสอดแนม +' +
      Math.round((Math.pow(1.05, l) - 1) * 100) + '% · เตือนล่วงหน้า ' +
      (5 + l*5) + ' นาที'; } },

  { key:'cranny', name:'ที่ซ่อนทรัพย์', ic:'🕳️', max:10, cp:0, cat:'res', dup:99,
    cost:{wood:40,clay:50,iron:30,wheat:10}, req:[],
    desc:'ซ่อนทรัพยากรไม่ให้ถูกปล้น · สร้างซ้ำได้ไม่จำกัด ยิ่งเยอะยิ่งปลอดภัย',
    eff:function(l){ return 'ซ่อนได้ ' + UI.fmt(capacity(l)*0.3) + ' ต่อชนิด'; } },

  { key:'townhall', name:'ศาลาประชาคม', ic:'🎭', max:20, cp:12, cat:'build', dup:1,
    cost:{wood:1250,clay:1110,iron:1260,wheat:600},
    req:[{k:'main',lv:10},{k:'embassy',lv:1}],
    desc:'ให้ Culture Points สูงที่สุดในเกม จำเป็นมากถ้าอยากขยายเมืองเร็ว',
    eff:function(l){ return 'CP ' + Math.floor(12*Math.pow(1.18, l-1)) + '/วัน'; } },

  { key:'residence', name:'คฤหาสน์', ic:'🏘️', max:20, cp:2, cat:'build', dup:1,
    cost:{wood:550,clay:800,iron:750,wheat:250}, req:[{k:'main',lv:5}],
    desc:'ฝึกผู้ตั้งถิ่นฐานเพื่อไปสร้างเมืองใหม่ · ใช้ 3 นายต่อ 1 เมือง · ใช้แล้วหมดถาวร ต้องอัปขึ้นช่วงถัดไปจึงฝึกใหม่ได้',
    eff:function(l){ return 'โควตาผู้ตั้งถิ่นฐาน ' + settlerSlots(l) +
      ' นาย · ภักดีฟื้น +' + (l*0.1).toFixed(1) + '%/ชม.'; } },

  { key:'palace', name:'พระราชวัง', ic:'👑', max:20, cp:5, cat:'build', dup:1,
    cost:{wood:550,clay:800,iron:750,wheat:250},
    req:[{k:'main',lv:5},{k:'embassy',lv:1}], oncePerGame:true,
    desc:'ฝึกขุนพลสำหรับยึดเมืองศัตรู · สร้างได้แห่งเดียวทั้งเกม เมืองนี้คือเมืองหลวงของคุณและถูกยึดไม่ได้',
    eff:function(l){ return (l < 5 ? 'ฝึกขุนพลได้ที่ Lv.5' :
      'ขุนพลสูงสุด ' + chiefSlots(l) + ' นาย') + ' · ภักดีฟื้น +' +
      (l*0.2).toFixed(1) + '%/ชม.'; } },

  { key:'hero', name:'จวนวีรบุรุษ', ic:'🗿', max:20, cp:1, cat:'build', dup:1,
    cost:{wood:700,clay:670,iron:700,wheat:240}, req:[{k:'rally',lv:1}],
    desc:'ที่พำนักของวีรบุรุษ ใช้อัปคุณลักษณะ สวมใส่อุปกรณ์ ส่งออกสำรวจดันเจี้ยน และรักษาเมื่อบาดเจ็บ',
    eff:function(l){ return 'ช่องอุปกรณ์ ' + equipSlots(l) + '/5 · ดันเจี้ยนถึงชั้น ' +
      dungeonTier(l) + ' · รักษาเร็วขึ้น ' + Math.min(50, l*2.5) + '%'; } },

  { key:'temple', name:'วิหารหลวง', ic:'🛕', max:20, cp:8, cat:'build', dup:1,
    cost:{wood:900,clay:1100,iron:700,wheat:450},
    req:[{k:'main',lv:8},{k:'embassy',lv:3}],
    desc:'ศูนย์รวมศรัทธา เพิ่มความภักดีของประชาชนอย่างมาก ทำให้ขุนพลศัตรูยึดเมืองได้ยากขึ้น',
    eff:function(l){ return 'ภักดีฟื้น +' + (l*0.3).toFixed(1) + '%/ชม.'; } },

  { key:'trainground', name:'ค่ายฝึกพิเศษ', ic:'🏇', max:20, cp:3, cat:'mil', dup:1,
    cost:{wood:320,clay:400,iron:280,wheat:150},
    req:[{k:'rally',lv:5},{k:'barracks',lv:5}],
    desc:'ฝึกวินัยการเดินทัพ กองทัพที่ออกจากเมืองนี้เดินทางเร็วขึ้น',
    eff:function(l){ return 'เดินทัพเร็วขึ้น ' + (l*3) + '%'; } },

  { key:'infirmary', name:'โรงพยาบาล', ic:'⛑️', max:20, cp:2, cat:'mil', dup:1,
    cost:{wood:380,clay:290,iron:420,wheat:260},
    req:[{k:'main',lv:5},{k:'rally',lv:3}],
    desc:'รักษาทหารฝ่ายป้องกันที่ล้มลงให้กลับมาสู้ได้ และเป็นที่รักษาวีรบุรุษที่บาดเจ็บ',
    eff:function(l){ return 'ฟื้นทหารป้องกัน ' + Math.min(30, l*2) +
      '% · ลดค่ารักษาวีรบุรุษ ' + Math.min(40, l*2) + '%'; } },

  { key:'greatbarracks', name:'ค่ายทหารหลวง', ic:'🏰', max:20, cp:2, cat:'mil',
    dup:1, capOnly:true, cost:{wood:630,clay:420,iron:780,wheat:360},
    req:[{k:'palace',lv:3},{k:'barracks',lv:10}],
    desc:'ค่ายทหารของราชสำนัก ฝึกทหารราบอีกคิวพร้อมกับค่ายปกติ ต้นทุนต่อนาย 3 เท่า',
    eff:function(l){ return 'คิวฝึกทหารราบเพิ่ม 1 · เร็วขึ้น ' +
      Math.round((1 - Math.pow(0.89, l-1)*0.7) * 100) + '%'; } },

  { key:'greatstable', name:'คอกม้าหลวง', ic:'🐴', max:20, cp:3, cat:'mil',
    dup:1, capOnly:true, cost:{wood:780,clay:420,iron:660,wheat:300},
    req:[{k:'palace',lv:3},{k:'stable',lv:10}],
    desc:'คอกม้าของราชสำนัก ฝึกทหารม้าอีกคิวพร้อมกับคอกม้าปกติ ต้นทุนต่อนาย 3 เท่า',
    eff:function(l){ return 'คิวฝึกทหารม้าเพิ่ม 1 · เร็วขึ้น ' +
      Math.round((1 - Math.pow(0.89, l-1)*0.7) * 100) + '%'; } },

  { key:'greatwarehouse', name:'โกดังหลวง', ic:'🏬', max:20, cp:2, cat:'res',
    dup:2, capOnly:true, cost:{wood:650,clay:800,iron:450,wheat:200},
    req:[{k:'palace',lv:1},{k:'warehouse',lv:10}],
    desc:'โกดังมหึมาของราชสำนัก เพิ่มความจุไม้ เหล็ก โคลน · สร้างได้ 2 หลังในเมืองหลวง',
    eff:function(l){ return 'เพิ่มความจุ ' + UI.fmt(greatCap(l)) + ' ต่อชนิด'; } },

  { key:'greatgranary', name:'ยุ้งฉางหลวง', ic:'🌾', max:20, cp:2, cat:'res',
    dup:2, capOnly:true, cost:{wood:400,clay:500,iron:350,wheat:100},
    req:[{k:'palace',lv:1},{k:'granary',lv:10}],
    desc:'ยุ้งฉางมหึมาของราชสำนัก เพิ่มความจุข้าว · สร้างได้ 2 หลังในเมืองหลวง',
    eff:function(l){ return 'เพิ่มความจุข้าว ' + UI.fmt(greatCap(l)); } },

  { key:'mill', name:'โรงสี', ic:'🌀', max:5, cp:1, boost:'wheat', cat:'res', dup:1,
    cost:{wood:500,clay:440,iron:380,wheat:1240},
    req:[], reqField:{res:'wheat', n:5},
    desc:'เพิ่มผลผลิตข้าวจากนาข้าวทุกหลุม ต้องมีนาข้าวอย่างน้อย 5 หลุม',
    eff:function(l){ return 'ข้าว +' + (l*5) + '%'; } },

  { key:'royalmill', name:'โรงสีหลวง', ic:'🍚', max:5, cp:1, boost:'wheat',
    cat:'res', dup:1, cost:{wood:1200,clay:1480,iron:870,wheat:1600},
    req:[{k:'mill',lv:5}],
    desc:'โรงสีของราชสำนัก เพิ่มผลผลิตข้าวซ้อนกับโรงสีปกติ รวมได้ถึง +50%',
    eff:function(l){ return 'ข้าว +' + (l*5) + '%'; } },

  { key:'sawmill', name:'โรงเลื่อย', ic:'🪚', max:5, cp:1, boost:'wood',
    cat:'res', dup:1, cost:{wood:520,clay:380,iron:290,wheat:90},
    req:[], reqField:{res:'wood', n:3},
    desc:'เพิ่มผลผลิตไม้จากป่าไม้ทุกหลุมในเมือง',
    eff:function(l){ return 'ไม้ +' + (l*5) + '%'; } },

  { key:'brickyard', name:'เตาเผาอิฐ', ic:'🔥', max:5, cp:1, boost:'clay',
    cat:'res', dup:1, cost:{wood:440,clay:480,iron:320,wheat:50},
    req:[], reqField:{res:'clay', n:3},
    desc:'เพิ่มผลผลิตโคลนจากบ่อโคลนทุกหลุมในเมือง',
    eff:function(l){ return 'โคลน +' + (l*5) + '%'; } },

  { key:'foundry', name:'โรงหลอม', ic:'🏭', max:5, cp:1, boost:'iron',
    cat:'res', dup:1, cost:{wood:200,clay:450,iron:510,wheat:120},
    req:[], reqField:{res:'iron', n:3},
    desc:'เพิ่มผลผลิตเหล็กจากเหมืองทุกหลุมในเมือง',
    eff:function(l){ return 'เหล็ก +' + (l*5) + '%'; } }
];

var CATS = [
  { k:'build', n:'🏛 อาคาร' },
  { k:'mil',   n:'⚔ ทหาร' },
  { k:'res',   n:'🌾 ทรัพยากร' }
];

/* ============ ฟังก์ชันช่วย ============ */
function bIndex(key){
  for (var i = 0; i < BUILDINGS.length; i++) if (BUILDINGS[i].key === key) return i;
  return 0;
}
function countBuilding(v, key){
  var idx = bIndex(key), n = 0;
  for (var i = 0; i < v.city.length; i++) if (v.city[i].b === idx) n++;
  return n;
}
function countAllVillages(key){
  var n = 0;
  Game.villages.forEach(function(v){ n += countBuilding(v, key); });
  return n;
}
function rallySlots(lv){
  if (lv >= 20) return 8;
  if (lv >= 17) return 7;
  if (lv >= 14) return 6;
  if (lv >= 11) return 5;
  if (lv >= 8)  return 4;
  if (lv >= 5)  return 3;
  if (lv >= 3)  return 2;
  return 1;
}
function settlerSlots(lv){
  if (lv <= 0) return 0;
  return Math.min(12, Math.ceil(lv / 5) * 3);
}
function chiefSlots(lv){
  if (lv >= 20) return 4;
  if (lv >= 15) return 3;
  if (lv >= 10) return 2;
  if (lv >= 5)  return 1;
  return 0;
}
function equipSlots(lv){
  if (lv <= 0) return 0;
  return Math.min(5, Math.floor((lv + 3) / 4));
}
function dungeonTier(lv){
  if (lv >= 18) return 5;
  if (lv >= 13) return 4;
  if (lv >= 8)  return 3;
  if (lv >= 4)  return 2;
  if (lv >= 1)  return 1;
  return 0;
}
/* ★ CP ที่ต้องมีเพื่อตั้งเมืองลำดับที่ n ★ */
var CP_NEED = [0, 0, 500, 1400, 3000, 5500, 9000, 13500, 19000, 25500, 33000];
function cpForVillage(n){
  return n < CP_NEED.length ? CP_NEED[n] : Math.floor(33000 + (n - 10) * 9000);
}
/* ★ ค่าทองเร่งงาน ★ */
function goldRush(sec){
  if (!isFinite(sec) || sec <= 0) return 1;
  return Math.max(1, Math.min(50, Math.ceil(sec / 600)));
}

function reqCheck(v, bi){
  var b = BUILDINGS[bi];
  if (b.cat === 'wall') return 'กำแพงมีช่องเฉพาะของตัวเอง';
  if (b.oncePerGame && countAllVillages(b.key) >= 1)
    return 'สร้างได้เพียงแห่งเดียวทั้งเกม';
  if (b.capOnly && cityLevel(v, 'palace') < 1)
    return 'ต้องมีพระราชวังในเมืองนี้ก่อน';
  var have = countBuilding(v, b.key);
  var lim = b.dup || 1;
  if (have >= lim)
    return lim === 1 ? 'สร้างแล้ว' : 'สร้างครบ ' + lim + ' หลังแล้ว';
  if (b.reqField){
    var n = 0;
    v.fields.forEach(function(f){ if (f.res === b.reqField.res) n++; });
    if (n < b.reqField.n)
      return 'ต้องมีหลุม' + RES_TH[b.reqField.res] + ' ' + b.reqField.n + ' หลุมขึ้นไป';
  }
  if (!b.req || !b.req.length) return null;
  for (var i = 0; i < b.req.length; i++){
    var r = b.req[i];
    if (cityLevel(v, r.k) < r.lv)
      return 'ต้องมี ' + BUILDINGS[bIndex(r.k)].name + ' ระดับ ' + r.lv + ' ก่อน';
  }
  return null;
}
function reqHidden(v, bi){
  var b = BUILDINGS[bi];
  if (b.cat === 'wall') return true;
  if (b.oncePerGame && countAllVillages(b.key) >= 1) return true;
  return countBuilding(v, b.key) >= (b.dup || 1);
}
function reqText(bi){
  var b = BUILDINGS[bi], out = [];
  if (b.oncePerGame) out.push('ทั้งเกมได้ 1 แห่ง');
  if (b.capOnly) out.push('เมืองที่มีพระราชวัง');
  if ((b.dup||1) > 1) out.push('สร้างได้ ' + (b.dup >= 99 ? 'ไม่จำกัด' : b.dup + ' หลัง'));
  if (b.reqField) out.push('หลุม' + RES_TH[b.reqField.res] + ' ' + b.reqField.n + '+');
  (b.req || []).forEach(function(r){
    out.push(BUILDINGS[bIndex(r.k)].name + ' Lv.' + r.lv);
  });
  return out.length ? out.join(' · ') : 'ไม่มีเงื่อนไข';
}

var FORTS = [
  { id:0, x:0,  y:5,  name:'ป้อมทิศเหนือ',   bonus:'ทหารราบโจมตี +10%' },
  { id:1, x:5,  y:5,  name:'ป้อมอีสาน',      bonus:'ป้องกันทุกเมือง +10%' },
  { id:2, x:5,  y:0,  name:'ป้อมทิศตะวันออก',bonus:'เดินทัพเร็วขึ้น 15%' },
  { id:3, x:5,  y:-5, name:'ป้อมอาคเนย์',    bonus:'บรรทุกของปล้น +20%' },
  { id:4, x:0,  y:-5, name:'ป้อมทิศใต้',     bonus:'ทหารม้าโจมตี +10%' },
  { id:5, x:-5, y:-5, name:'ป้อมหรดี',       bonus:'ฝึกทหารเร็วขึ้น 15%' },
  { id:6, x:-5, y:0,  name:'ป้อมทิศตะวันตก', bonus:'ปืนใหญ่แรงขึ้น 10%' },
  { id:7, x:-5, y:5,  name:'ป้อมพายัพ',      bonus:'ความภักดีฟื้นเร็วขึ้น 25%' }
];

/* ★ 4 โซน แต่ละโซนเด่นคนละทรัพยากร ★ */
var ZONES = [
  { id:1, name:'อีสาน — ดินแดนขุนเขา',  sx: 1, sy: 1, res:'iron',
    ic:'⛏️', desc:'ภูเขาหนาแน่น · โอเอซิสเหล็กชุกที่สุด · เหมาะกับสายทหารหนัก' },
  { id:2, name:'พายัพ — ป่าใหญ่',       sx:-1, sy: 1, res:'wood',
    ic:'🪵', desc:'ป่าทึบกว้างใหญ่ · โอเอซิสไม้เยอะ · เหมาะกับสายก่อสร้างเร็ว' },
  { id:3, name:'หรดี — ทุ่งข้าวหลวง',   sx:-1, sy:-1, res:'wheat',
    ic:'🌾', desc:'ที่ราบกว้างที่สุด ตั้งเมืองง่าย · โอเอซิสข้าวมาก · เหมาะกับกองทัพใหญ่' },
  { id:4, name:'อาคเนย์ — ลุ่มน้ำโคลน',  sx: 1, sy:-1, res:'clay',
    ic:'🧱', desc:'ที่ลุ่มและที่แห้งแล้งสลับกัน · โอเอซิสโคลนมาก · เหมาะกับสายกำแพงหนา' }
];

var REL = {
  own:     { line:'#6fd35a', glow:'rgba(111,211,90,.35)',  name:'ของเรา' },
  guild:   { line:'#4db8ff', glow:'rgba(77,184,255,.35)',  name:'กิลด์' },
  ally:    { line:'#ffd24d', glow:'rgba(255,210,77,.35)',  name:'พันธมิตร' },
  enemy:   { line:'#ff4d4d', glow:'rgba(255,77,77,.4)',    name:'ศัตรู' },
  neutral: { line:'#9a9384', glow:'rgba(154,147,132,.2)',  name:'ผู้เล่นทั่วไป' },
  npc:     { line:'#9c8464', glow:'rgba(156,132,100,.2)',  name:'เมืองร้าง' }
};

function relAt(x, y){
  for (var i = 0; i < Game.villages.length; i++)
    if (Game.villages[i].x === x && Game.villages[i].y === y) return 'own';
  if (typeof Bots !== 'undefined' && Bots.relAt){
    var r = Bots.relAt(x, y);
    if (r) return r;
  }
  return null;
}
function relOfMove(mv){
  if (mv.hostile) return 'enemy';
  if (mv.rel) return mv.rel;
  return 'own';
}

var ErrLog = [];
function logErr(where, e){
  ErrLog.unshift({ at:Date.now(), where:where,
    msg:(e && e.message) ? e.message : String(e) });
  if (ErrLog.length > 30) ErrLog.pop();
}
window.onerror = function(msg, src, line){
  logErr('global', { message: msg + ' @' + line });
};