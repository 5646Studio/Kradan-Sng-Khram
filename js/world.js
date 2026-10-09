/* ============ โลก v12 — 60% ที่ราบ · 20% ภูเขา · 10% น้ำ · 10% โคลน ============ */

var World = (function(){
  var cache = {}, cacheN = 0;

  /* ---------- noise ในตัว (ใช้แค่ Noise.hash) ---------- */
  function hs(x, y, s){
    var v = Noise.hash(x, y, s);
    return (typeof v === 'number' && isFinite(v)) ? (v - Math.floor(v)) : 0.5;
  }
  function smooth(x, y, s){
    var x0 = Math.floor(x), y0 = Math.floor(y);
    var fx = x - x0, fy = y - y0;
    var u = fx*fx*(3 - 2*fx), w = fy*fy*(3 - 2*fy);
    var a = hs(x0, y0, s),   b = hs(x0+1, y0, s);
    var c = hs(x0, y0+1, s), d = hs(x0+1, y0+1, s);
    return (a*(1-u) + b*u)*(1-w) + (c*(1-u) + d*u)*w;
  }
  function fbm(x, y, s){
    var v = 0, amp = 1, fr = 0.034, tot = 0;
    for (var i = 0; i < 4; i++){
      v += smooth(x*fr, y*fr, s + i*131) * amp;
      tot += amp; amp *= 0.5; fr *= 2.07;
    }
    return v / tot;
  }

  function inBounds(x, y){
    return Math.abs(x) <= CFG.MAP_RADIUS && Math.abs(y) <= CFG.MAP_RADIUS;
  }
  function isCapital(x, y){ return x === 0 && y === 0; }
  function fortAt(x, y){
    for (var i = 0; i < FORTS.length; i++)
      if (FORTS[i].x === x && FORTS[i].y === y) return FORTS[i];
    return null;
  }
  function zoneOf(x, y){
    if (x >= 0 && y >= 0) return 1;
    if (x <  0 && y >= 0) return 2;
    if (x <  0 && y <  0) return 3;
    return 4;
  }

  /* เกณฑ์แบ่งภูมิประเทศต่อโซน — land = ส่วนที่เหลือ */
  var ZT = {
    1: { w:0.09, r:0.34, c:0.42 },   /* เหล็ก : ภูเขาเยอะ  land 58% */
    2: { w:0.11, r:0.27, c:0.37 },   /* ไม้   : ป่าเยอะ    land 63% */
    3: { w:0.08, r:0.25, c:0.33 },   /* ข้าว  : ที่ราบมาก  land 67% */
    4: { w:0.13, r:0.26, c:0.44 }    /* โคลน  : ลุ่ม+แห้ง  land 56% */
  };

  function build(x, y){
    var z = zoneOf(x, y), T = ZT[z];
    var h  = fbm(x, y, CFG.SEED);
    var h2 = hs(x, y, CFG.SEED + 911);
    var h3 = hs(x, y, CFG.SEED + 1733);
    var biome, group;

    if (h < T.w){
      group = 'water';
      biome = (h2 < 0.5) ? B.WATER : B.WETLAND;
    } else if (h < T.r){
      group = 'rock';
      biome = (h2 < 0.58) ? B.HILL : B.MOUNTAIN;
    } else if (h < T.c){
      group = 'clay';
      biome = (h2 < 0.6) ? B.DRY : B.DENSE;
    } else {
      group = 'land';
      if (z === 2)      biome = h2 < 0.48 ? B.FOREST  : h2 < 0.78 ? B.GRASS   : B.LOWLAND;
      else if (z === 3) biome = h2 < 0.46 ? B.LOWLAND : h2 < 0.82 ? B.GRASS   : B.FOREST;
      else              biome = h2 < 0.42 ? B.GRASS   : h2 < 0.74 ? B.LOWLAND : B.FOREST;
    }

    var t = {
      x:x, y:y, biome:biome, group:group, zone:z,
      info: BIOMES[biome],
      variant: Math.floor(h3 * 3),
      buildable: (group === 'land'),
      oasis: null, npc: false, layout: null
    };

    var protectedTile = isCapital(x, y) || !!fortAt(x, y) ||
      (Math.abs(x) <= CFG.NOBUILD_RADIUS && Math.abs(y) <= CFG.NOBUILD_RADIUS);

    /* ---------- โอเอซิส — มีได้ทุกภูมิประเทศ ---------- */
    if (!protectedTile){
      var ho = hs(x, y, CFG.SEED + 3131);
      if (ho < CFG.OASIS_RATE){
        var ht = hs(x, y, CFG.SEED + 4242);
        var hz = hs(x, y, CFG.SEED + 5353);
        var typ;

        if (group === 'rock')       typ = 'iron';
        else if (group === 'water') typ = (ht < 0.58) ? 'wheat' : 'wood';
        else if (group === 'clay')  typ = (ht < 0.70) ? 'clay'  : 'wood';
        else {
          /* ที่ราบ — ข้าวเป็นหลัก แล้วเอียงตามโซน */
          if (hz < 0.30) typ = ZONES[z-1].res;
          else typ = ht < 0.52 ? 'wheat' : ht < 0.80 ? 'wood'
                   : ht < 0.92 ? 'clay'  : 'iron';
        }
        var pct = ht < 0.58 ? 25 : ht < 0.90 ? 50 : 75;
        if (hz > 0.965){ typ = 'double'; pct = 25; }
        t.oasis = { type:typ, pct:pct };
      }
    }

    /* ---------- หลุมทรัพยากร + เมืองร้าง (เฉพาะที่ราบที่ไม่ใช่โอเอซิส) ---------- */
    if (t.buildable && !t.oasis && !protectedTile){
      var r = hs(x, y, CFG.SEED + 5150) * LAYOUT_W, acc = 0;
      for (var i = 0; i < LAYOUTS.length; i++){
        acc += LAYOUTS[i].w;
        if (r <= acc){ t.layout = LAYOUTS[i]; break; }
      }
      if (!t.layout) t.layout = LAYOUTS[0];
      if (hs(x, y, CFG.SEED + 6060) < 0.055) t.npc = true;
    }
    return t;
  }

  function tile(x, y){
    var k = x + ',' + y;
    if (cache[k]) return cache[k];
    if (cacheN > 26000){ cache = {}; cacheN = 0; }
    var t;
    try { t = build(x, y); }
    catch(e){
      logErr('World.build', e);
      t = { x:x, y:y, biome:B.GRASS, group:'land', zone:1, info:BIOMES[B.GRASS],
            variant:0, buildable:true, oasis:null, npc:false, layout:LAYOUTS[0] };
    }
    cache[k] = t; cacheN++;
    return t;
  }

  /* คืน null = ตั้งเมืองได้ */
  function canSettle(x, y){
    if (!inBounds(x, y)) return 'อยู่นอกแผนที่';
    if (isCapital(x, y)) return 'เมืองหลวงโลก';
    if (fortAt(x, y)) return 'ป้อมปราการ';
    if (Math.abs(x) <= CFG.NOBUILD_RADIUS && Math.abs(y) <= CFG.NOBUILD_RADIUS)
      return 'เขตหวงห้ามรอบเมืองหลวงโลก';
    var t = tile(x, y);
    if (t.oasis) return 'เป็นโอเอซิส ตั้งเมืองไม่ได้';
    if (!t.buildable)
      return 'ตั้งเมืองไม่ได้ — ' + t.info.name +
        (t.group === 'rock'  ? ' (พื้นที่ภูเขา)'
       : t.group === 'water' ? ' (แหล่งน้ำ)' : ' (พื้นที่แห้งแล้ง)');
    if (t.npc) return 'มีเมืองร้างอยู่';
    if (typeof Net !== 'undefined' && Net.occupied && Net.occupied(x, y))
      return 'มีผู้เล่นอื่นตั้งเมืองอยู่';

    return null;
  }

  function findSpawnZone(zoneId){
    var z = ZONES.filter(function(q){ return q.id === zoneId; })[0] || ZONES[0];
    for (var band = 0; band < 45; band++){
      var rad = CFG.SPAWN_R - band;
      if (rad < 14) break;
      for (var k = 0; k < 110; k++){
        var a = Math.random() * Math.PI/2;
        var x = Math.round(Math.cos(a)*rad) * z.sx;
        var y = Math.round(Math.sin(a)*rad) * z.sy;
        if (canSettle(x, y)) continue;
        if (typeof Bots !== 'undefined' && Bots.at && Bots.at(x, y)) continue;
        return { x:x, y:y };
      }
    }
    for (var d = 14; d < CFG.MAP_RADIUS; d++){
      for (var ang = 0; ang < 48; ang++){
        var aa = ang/48 * Math.PI*2;
        var xx = Math.round(Math.cos(aa)*d) * z.sx;
        var yy = Math.round(Math.sin(aa)*d) * z.sy;
        if (!canSettle(xx, yy)) return { x:xx, y:yy };
      }
    }
    return { x: 30*z.sx, y: 30*z.sy };
  }

  function clearCache(){ cache = {}; cacheN = 0; }

  return { tile:tile, inBounds:inBounds, canSettle:canSettle, zoneOf:zoneOf,
    fortAt:fortAt, isCapital:isCapital, findSpawnZone:findSpawnZone,
    clearCache:clearCache };
})();