var Military = (function(){

  function dist(x1, y1, x2, y2){
    var dx = x2 - x1, dy = y2 - y1;
    return Math.sqrt(dx*dx + dy*dy);
  }

  function trainCost(unitId, n, mul){
    var u = U(unitId), o = {};
    RES.forEach(function(r){ o[r] = u.cost[r]*n*(mul||1); });
    return o;
  }

  function specialCap(v, u){
    if (u.cls === 'settler')
      return Math.max(0, settlerSlots(cityLevel(v,'residence')) - (v.settlersUsed||0));
    if (u.cls === 'chief') return chiefSlots(cityLevel(v,'palace'));
    return 99999;
  }
  function specialHave(v, u){
    var n = v.troops[u.id] || 0;
    Game.movements.forEach(function(m){
      if (m.from === v.id) n += (m.troops[u.id] || 0);
    });
    ((v.train && v.train[u.b]) || []).forEach(function(j){
      if (j.unit === u.id) n += j.left;
    });
    return n;
  }
  
  function trainTime(unitId, v, bkey){
    var u = U(unitId);
    bkey = bkey || u.b;
    var isGreat = (bkey === 'greatbarracks' || bkey === 'greatstable');
    var lv = cityLevel(v, bkey);
    if (lv <= 0) return null;
    return Math.max(5, Math.round(u.t * Math.pow(0.89, lv - 1) *
      (isGreat ? 0.7 : 1) * Conquest.B_TRAIN() / CFG.SPEED));
  }
    function enqueueTrain(v, unitId, n, bkey){
    var u = U(unitId);
    bkey = bkey || u.b;
    var isGreat = (bkey === 'greatbarracks' || bkey === 'greatstable');
    if (cityLevel(v, bkey) <= 0)
      return 'ต้องสร้าง ' + BUILDINGS[bIndex(bkey)].name + ' ก่อน';
    var cap = specialCap(v, u);
    if (cap < 99999){
      var have = specialHave(v, u);
      if (have + n > cap)
        return u.name + ' มีได้สูงสุด ' + cap + ' นาย (ตอนนี้ ' + have + ')';
    }
    var mul = isGreat ? 3 : 1;
    var cost = trainCost(unitId, n, mul);
    refresh(v);
    if (!canAfford(v, cost)) return 'ทรัพยากรไม่พอ';
    var sec = trainTime(unitId, v, bkey);
    pay(v, cost);
    if (!v.train) v.train = {};
    if (!v.train[bkey]) v.train[bkey] = [];
    var q = v.train[bkey];
    var start = q.length ? q[q.length-1].endAt : now();
    q.push({ unit:unitId, left:n, total:n, each:sec*1000, mul:mul,
      nextAt: Math.max(now(), start) + sec*1000,
      endAt:  Math.max(now(), start) + sec*1000*n });
    return null;
  }

  /* ★ ยกเลิกคิวฝึก + คืนทรัพยากรที่ยังไม่ได้ฝึก ★ */
  function cancelTrain(v, bkey, idx){
    var q = v.train && v.train[bkey];
    if (!q || !q[idx]) return 'ไม่พบรายการ';
    var job = q[idx];
    var u = U(job.unit);
    var back = {}, c = caps(v);
    refresh(v);
    RES.forEach(function(r){
      var amt = u.cost[r] * job.left * (job.mul || 1);
      var cap = (r === 'wheat') ? c.gran : c.store;
      v.res[r] = Math.min(cap, v.res[r] + amt);
      back[r] = amt;
    });
    var cut = job.endAt - (idx === 0 ? Math.max(now(), job.nextAt - job.each)
                                     : q[idx-1].endAt);
    q.splice(idx, 1);
    for (var i = idx; i < q.length; i++){
      q[i].nextAt -= cut; q[i].endAt -= cut;
    }
    if (q.length && idx === 0) q[0].nextAt = Math.max(now(), q[0].nextAt);
    return { back:back, n:job.left, name:u.name };
  }

  function processTrain(v){
    if (!v.train) return false;
    var t = now(), changed = false;
    for (var b in v.train){
      var q = v.train[b];
      while (q.length){
        var job = q[0];
        if (job.nextAt > t) break;
        v.troops[job.unit] = (v.troops[job.unit] || 0) + 1;
        job.left--; changed = true;
        if (job.left <= 0){
          q.shift();
          if (q.length) q[0].nextAt = Math.max(t, q[0].nextAt);
        } else job.nextAt += job.each;
      }
    }
    return changed;
  }

  /* ★ ความเร็ว: ลานรวมพล + ค่ายฝึกพิเศษ ซ้อนกัน ★ */
  function travelSec(v, tx, ty, troops, back){
    var spd = 999;
    for (var id in troops){
      var u = U(id);
      if (u && troops[id] > 0) spd = Math.min(spd, u.spd);
    }
    if (spd === 999) spd = 5;
    var d = dist(v.x, v.y, tx, ty);
    var rl = cityLevel(v, 'rally');
    var tg = cityLevel(v, 'trainground');
    var mul = (1 + 0.015 * rl) * (1 + 0.03 * tg) * Conquest.B_SPEED();
    if (back) mul *= (1 + 0.015 * rl);
    return Math.max(30, Math.round(d / spd * 3600 / (mul * CFG.SPEED)));
  }

  var MISSIONS = {
    attack:  { name:'โจมตี',      ic:'⚔️' },
    raid:    { name:'ปล้น',       ic:'💰' },
    scout:   { name:'สอดแนม',     ic:'👁️' },
    support: { name:'เสริมกำลัง', ic:'🛡️' },
    settle:  { name:'ตั้งเมือง',  ic:'🏕️' }
  };

  function outgoingCount(v){
    var n = 0;
    Game.movements.forEach(function(m){ if (m.from === v.id && !m.returning) n++; });
    return n;
  }

  function send(v, tx, ty, mission, troops, cataTarget, withHero){
    
    if (!World.inBounds(tx, ty)) return 'พิกัดอยู่นอกแผนที่';
    if (tx === v.x && ty === v.y) return 'ส่งไปเมืองตัวเองไม่ได้';
    if (Combat.count(troops) <= 0) return 'ยังไม่ได้เลือกทหาร';
    var slots = rallySlots(cityLevel(v, 'rally'));
    if (outgoingCount(v) >= slots)
      return 'ส่งทัพพร้อมกันได้ ' + slots + ' ขบวน (อัปเกรดลานรวมพลเพื่อเพิ่ม)';
    for (var id in troops)
      if ((v.troops[id] || 0) < troops[id]) return 'ทหารไม่พอ';

        if (mission === 'settle'){
      var ns = 0;
      for (var s in troops) if (U(s).cls === 'settler') ns += troops[s];
      if (ns < 3) return 'ต้องส่งผู้ตั้งถิ่นฐาน 3 นาย';
      var why = World.canSettle(tx, ty);
      if (why) return why;
      if (Game.villages.some(function(g){ return g.x===tx && g.y===ty; }))
        return 'มีเมืองอยู่แล้ว';
      if (typeof Bots !== 'undefined' && Bots.at(tx, ty))
        return 'มีผู้เล่นอื่นอยู่แล้ว';
        }

    /* ...เช็กเดิมทั้งหมด... */
    if (withHero){
      var hh = Hero.get(v);
      if (hh.dead) return 'วีรบุรุษบาดเจ็บ ส่งไปไม่ได้';
      if (hh.away) return 'วีรบุรุษออกรบอยู่แล้ว';
      hh.away = true;
    }
    for (var k in troops) v.troops[k] -= troops[k];
    var sec = travelSec(v, tx, ty, troops);
    Game.movements.push({
      id: now() + Math.floor(Math.random()*999),
      from:v.id, fx:v.x, fy:v.y, tx:tx, ty:ty,
      mission:mission, troops:troops, cataTarget: cataTarget || null,
      hero: !!withHero,
      departAt: now(), arriveAt: now() + sec*1000,
      returning:false, loot:null
    });
    return null;
  }

  function defenderAt(x, y){
    /* ★ เมืองบอท — ต้องเช็กก่อนทุกอย่าง ★ */
    if (typeof Bots !== 'undefined'){
      var be = Bots.at(x, y);
      if (be){
        var bb = be.bot, bkey = 'bot:' + bb.id + ':' + be.vi;
        var share = be.vi === 0 ? 0.55 : 0.15;
        if (!Game.npc[bkey] || Game.npc[bkey].kind !== 'bot'){
          var bn = Math.max(3, Math.floor(bb.troops * share));
          Game.npc[bkey] = { kind:'bot', botId:bb.id, vi:be.vi,
            name: bb.name + (be.vi === 0 ? ' (เมืองหลัก)' : ' (เมืองที่ ' + (be.vi+1) + ')'),
            wall: bb.wall, armoury: Math.floor(bb.wall*0.6),
            pop: Math.floor(bb.pop*share), cranny: 600 + bb.pop*4,
            troops: { g0:Math.round(bn*0.45), g1:Math.round(bn*0.33),
                      g2:Math.round(bn*0.16), g3:Math.max(1,Math.round(bn*0.06)) },
            res: { wheat:Math.floor(bb.res.wheat*share),
                   wood:Math.floor(bb.res.wood*share),
                   iron:Math.floor(bb.res.iron*share),
                   clay:Math.floor(bb.res.clay*share) },
            lastRes: now(), rate: Math.floor(60 + bb.pop*share*3) };
        }
        return { type:'bot', d:Game.npc[bkey], bot:bb, vi:be.vi };
      }
    }
    var own = Game.villages.filter(function(g){ return g.x===x && g.y===y; })[0];
    /* ...โค้ดเดิมต่อจากนี้... */
    var own = Game.villages.filter(function(g){ return g.x===x && g.y===y; })[0];
    if (own) return { type:'own', v: own };

    if (World.isCapital(x, y)){
      if (!Game.npc['0,0'] || Game.npc['0,0'].kind !== 'capital'){
        Game.npc['0,0'] = { kind:'capital', name:'👑 เมืองหลวงโลก',
          wall:20, armoury:12, pop:5000, cranny:0,
          troops: Conquest.capitalGarrison(),
          res:{wheat:0,wood:0,iron:0,clay:0}, lastRes:now(), rate:0 };
      }
      return { type:'capital', d: Game.npc['0,0'] };
    }
    var f = World.fortAt(x, y);
    if (f){
      var kf = x + ',' + y;
      if (!Game.npc[kf] || Game.npc[kf].kind !== 'fort'){
        Game.npc[kf] = { kind:'fort', fortId:f.id, name:'🏰 ' + f.name,
          wall:15, armoury:8, pop:1200, cranny:0,
          troops: Conquest.fortGarrison(),
          res:{wheat:4000,wood:4000,iron:4000,clay:4000},
          lastRes:now(), rate:0 };
      }
      return { type:'fort', d: Game.npc[kf], fort:f };
    }
    var key = x + ',' + y;
    if (Game.npc[key]){
      var e = Game.npc[key];
      return { type: e.oasis ? 'oasis' : 'npc', d:e };
    }
    var t = World.tile(x, y);
    if (t.npc){
      var h = Noise.hash(x, y, CFG.SEED + 4242);
      var r = 1 - Math.sqrt(x*x + y*y) / CFG.MAP_RADIUS;
      var pw = Math.floor(30 + r * 400 * (0.4 + h));
      Game.npc[key] = { name:'เมืองร้าง', wall: Math.floor(r * 8), armoury: 0,
        pop: 40 + Math.floor(pw/3), cranny: 400,
        troops:{ a0:Math.round(pw*0.5), a1:Math.round(pw*0.3), a2:Math.round(pw*0.12) },
        res:{ wheat:800+pw*12, wood:800+pw*12, iron:600+pw*10, clay:700+pw*11 },
        lastRes: now(), rate: 60 + pw };
      return { type:'npc', d:Game.npc[key] };
    }
    if (t.oasis){
      var h2 = Noise.hash(x, y, CFG.SEED + 5151);
      var n = Math.floor(6 + h2 * 26);
      Game.npc[key] = { name:'โอเอซิส', wall:0, armoury:0, pop:0, cranny:0,
        troops:{ a1:Math.round(n*0.4), a2:Math.round(n*0.35),
                 a4:Math.round(n*0.15), a3:Math.max(1,Math.round(n*0.1)) },
        res:{wheat:0,wood:0,iron:0,clay:0}, oasis:true,
        lastRes:now(), rate:0 };
      return { type:'oasis', d:Game.npc[key] };
    }
    return { type:'empty' };
  }

  function npcRegen(d){
    var t = now();
    var dt = (t - (d.lastRes || t)) / 3600000;
    if (dt > 0 && d.rate){
      RES.forEach(function(r){
        d.res[r] = Math.min(80000, (d.res[r] || 0) + d.rate * dt);
      });
      d.lastRes = t;
    }
  }
  function ownAsDefender(v){
    refresh(v);
    var snap = {};
    for (var i in v.troops) if (v.troops[i]) snap[i] = v.troops[i];
    return { name:v.name, troops:snap,
      troopsBefore: JSON.parse(JSON.stringify(snap)),      
      wall: v.wallLv || 0, armoury: cityLevel(v,'armoury'),
      heroDef: Hero.defPower(v) +
      (typeof Station !== 'undefined' ? Station.defPower(v) : 0),

      tower: cityLevel(v,'watchtower'), pop: population(v), isMine:true,
      cranny: sumCapacity(v,'cranny') * 0.3 * TRIBES[Game.player.tribe].crannyMul,
      res: v.res, apply: function(left){ v.troops = left; } };
  }
  function asDefender(d){
    var snap = {};
    for (var i in d.troops) if (d.troops[i]) snap[i] = d.troops[i];
    return { name:d.name, troops:snap,
      troopsBefore: JSON.parse(JSON.stringify(snap)),
      wall:d.wall||0, armoury:d.armoury||0, tower:0,
      pop:d.pop||0, cranny:d.cranny||0, res:d.res,
      apply: function(left){ d.troops = left; } };
  }
  function troopLine(t){
    var out = [];
    for (var id in t){
      if (!t[id]) continue;
      var u = anyUnit(id);
      out.push((u ? u.name : id) + ' ×' + t[id]);
    }
    return out.length ? out.join(', ') : '—';
  }

  function pushReport(r){
    if (!r.cat) r.cat = (r.mission === 'dungeon' || r.mission === 'hero' ||
      r.mission === 'guild' || r.mission === 'research') ? 'city' : 'war';
    Game.reports.unshift(r);
    if (Game.reports.length > 120) Game.reports.pop();
  }
  
  function powerOf(t){
    var p = 0;
    for (var id in t){
      var u = anyUnit(id);
      if (u) p += (t[id] || 0) * (u.atk + u.di) / 2;
    }
    return p;
  }

  function arrive(mv){
    /* ★ ทหารกลับถึงฐานประจำการ ★ */
    if (mv.returning && mv.station && typeof Station !== 'undefined'){
      if (Station.absorbReturn(mv)) return;
    }
    var home = Game.villages.filter(function(g){ return g.id === mv.from; })[0];
    if (!home) return;
    if (mv.returning){
      if (mv.hero) Hero.get(home).away = false;
      for (var id in mv.troops)
        home.troops[id] = (home.troops[id] || 0) + mv.troops[id];
      if (mv.loot){
        refresh(home);
        var c = caps(home);
        RES.forEach(function(r){
          var cap = (r === 'wheat') ? c.gran : c.store;
                var lootV = home;
      if (mv.lootTo){
        var lv2 = Game.villages.filter(function(g){ return g.id === mv.lootTo; })[0];
        if (lv2) lootV = lv2;
      }

          lootV.res[r] = Math.min(cap, lootV.res[r] + mv.loot[r]);
        });
      }
      return;
    }

    var tgt = defenderAt(mv.tx, mv.ty);
    var rpt = { at:now(), x:mv.tx, y:mv.ty, mission:mv.mission,
                read:false, open:false };

    if (mv.mission === 'settle'){
      if (tgt.type === 'empty'){
        var nv = newVillage(mv.tx, mv.ty, 'เมืองที่ ' + (Game.villages.length+1), false);
        Game.villages.push(nv);
        Game.player.slotsUsed++;
        rpt.title = '🏕️ ตั้งเมืองใหม่สำเร็จ';
        rpt.body = 'ก่อตั้ง <b>' + nv.name + '</b> ที่ (' + mv.tx + '|' + mv.ty +
          ')<br>รูปแบบหลุม: <b>' + nv.layoutName + '</b>';
      } else {
        rpt.title = '✕ ตั้งเมืองล้มเหลว';
        rpt.body = 'พื้นที่ถูกยึดครองแล้ว กองทัพกำลังเดินทางกลับ';
        goHome(mv, mv.troops, null);
      }
      pushReport(rpt); return;
    }
    if (tgt.type === 'empty'){
      rpt.title = '· ไม่พบเป้าหมาย';
      rpt.body = '(' + mv.tx + '|' + mv.ty + ') ไม่มีสิ่งใด กองทัพเดินทางกลับ';
      pushReport(rpt); goHome(mv, mv.troops, null); return;
    }

    var D = (tgt.type === 'own') ? ownAsDefender(tgt.v) : asDefender(tgt.d);
    if (tgt.type !== 'own') npcRegen(tgt.d);

    if (mv.mission === 'scout'){
      var sc = Combat.scout(mv.troops, D.troops, D.tower);
      var sur = {};
      for (var sid in mv.troops){
        var alive = Math.round(mv.troops[sid] * (1 - sc.lossPct));
        if (alive > 0) sur[sid] = alive;
      }
      if (sc.success){
        rpt.title = '👁️ สอดแนมสำเร็จ';
        rpt.body = '<b>' + D.name + '</b> (' + mv.tx + '|' + mv.ty + ')<br>' +
          'ทรัพยากร: ' + RES.map(function(r){
            return RES_IC[r] + Math.floor(D.res[r]||0); }).join(' ') + '<br>' +
          'กำลังพล: ' + troopLine(D.troops) + '<br>กำแพง Lv.' + D.wall;
      } 
      if (tgt.type === 'bot'){
          var lk = 'loy:' + tgt.bot.id + ':' + tgt.vi;
          var lv2 = Game.npc[lk] === undefined ? 100 : Math.round(Game.npc[lk]);
          rpt.body += '<br>ความภักดี: <b>' + lv2 + '%</b>';
        }

      else {
        rpt.title = '✕ สอดแนมล้มเหลว';
        rpt.body = 'หน่วยสอดแนมถูกกำจัดทั้งหมด ศัตรูรู้ตัวแล้ว';
      }
      pushReport(rpt);
      if (Combat.count(sur) > 0) goHome(mv, sur, null);
      return;
    }
    if (mv.mission === 'support'){
      if (typeof Station !== 'undefined' && Station.onSupportArrive(mv)) return;
      if (typeof BotAI !== 'undefined' && tgt.type === 'bot'){
          BotAI.absorbSupport(mv.tx, mv.ty, mv.troops);
          extra += '<br><span style="color:#8fbf5f">🛡 ส่งกำลังหนุนให้พันธมิตรแล้ว</span>';
        }

      if (tgt.type === 'own'){
        for (var rid in mv.troops)
          tgt.v.troops[rid] = (tgt.v.troops[rid] || 0) + mv.troops[rid];
        rpt.title = '🛡️ เสริมกำลังถึงที่หมาย';
        rpt.body = troopLine(mv.troops) + ' ประจำการที่ ' + tgt.v.name;
      } else {
        rpt.title = '✕ เสริมกำลังไม่ได้';
        rpt.body = 'ส่งได้เฉพาะเมืองของตัวเอง';
        goHome(mv, mv.troops, null);
      }
      pushReport(rpt); return;
    }

    var atk = { troops:mv.troops, smithy: cityLevel(home,'smithy'),
    pop: population(home),
    heroLead: Hero.leadBonus(home),
    heroAtk: mv.hero ? Hero.atkPower(home) : 0 };

    var res = Combat.resolve(atk, D, { raid: mv.mission === 'raid' });
    var lootRes = {wheat:0,wood:0,iron:0,clay:0}, carried = 0, extra = '';

    if (res.win && Combat.count(res.leftA) > 0){
      var nCata = 0;
      for (var cid in res.leftA)
        if (U(cid) && U(cid).cls === 'cata') nCata += res.leftA[cid];
      if (nCata > 0 && tgt.type === 'own'){
        var slot = -1;
        if (mv.cataTarget !== null && mv.cataTarget !== undefined &&
            cityLevel(home, 'rally') >= 10){
          for (var z = 0; z < tgt.v.city.length; z++)
            if (tgt.v.city[z].b === mv.cataTarget && tgt.v.city[z].level > 0){
              slot = z; break;
            }
        }
        if (slot < 0){
          var pool = [];
          tgt.v.city.forEach(function(c, i){ if (c.b && c.level > 0) pool.push(i); });
          if (pool.length) slot = pool[Math.floor(Math.random()*pool.length)];
        }
        if (slot >= 0){
          var cb = tgt.v.city[slot];
          var nm = BUILDINGS[cb.b].name;
          var dmg = Combat.catapult(nCata, atk.smithy, cb.level);
          cb.level = Math.max(0, cb.level - dmg);
          if (cb.level === 0) cb.b = 0;
          extra += '<br>🎯 ทำลาย ' + nm + ' ลง ' + dmg + ' ระดับ';
        }
      }
      var lt = Combat.loot(res.leftA, D.res, D.cranny,
        TRIBES[Game.player.tribe].crannyPierce);
      lootRes = lt.loot; carried = lt.carried;
      RES.forEach(function(r){ D.res[r] = Math.max(0, (D.res[r]||0) - lootRes[r]); });
      if (tgt.type === 'own') RES.forEach(function(r){ tgt.v.res[r] = D.res[r]; });
      Game.stats.raidPts += carried;

      if (tgt.type === 'oasis'){
        if (!mv.hero)
          extra += '<br><i style="color:#ff9a5a">ต้องส่งวีรบุรุษไปด้วยจึงยึดโอเอซิสได้</i>';
        else {
          var why = Conquest.canCaptureOasis(home, mv.tx, mv.ty);
          if (!why){
            Conquest.captureOasis(home, mv.tx, mv.ty);
            extra += '<br><span style="color:#4fd6a0">🌿 ยึดโอเอซิสสำเร็จ!</span>';
          } else extra += '<br><i style="color:#a89468">' + why + '</i>';
        }
      }

      if (tgt.type === 'fort'){
        if (!Conquest.fortOpen())
          extra += '<br><i style="color:#ff9a5a">ป้อมเปิดให้ยึดวันที่ ' +
            CFG.FORT_OPEN_DAY + '</i>';
        else if (Combat.count(tgt.d.troops) === 0){
          Game.forts[tgt.fort.id] = 'me';
          extra += '<br><span style="color:#ffcf40">🏰 ยึด ' + tgt.fort.name +
            ' สำเร็จ!<br>' + tgt.fort.bonus + '<br>โจมตีรวม +' +
            Math.round((Conquest.attackBonus()-1)*100) + '% (' +
            Conquest.fortsHeld() + '/8)</span>';
        }
      }
      if (tgt.type === 'capital'){
        var st = Conquest.capitalStatus();
        if (!st.open && Game.capital.owner !== 'me')
          extra += '<br><i style="color:#ff9a5a">' + st.msg + '</i>';
        else if (Combat.count(tgt.d.troops) === 0){
          Game.capital.owner = 'me'; Game.capital.since = now();
          extra += '<br><span style="color:#ffcf40;font-size:13px">👑 ' +
            'ยึดเมืองหลวงโลกได้แล้ว!<br>ถือครบ ' +
            CFG.CAPITAL_HOLD_DAYS + ' วันเพื่อชนะ</span>';
        }
      }

            /* ★ ขุนพลยึดเมือง — เสียแค่ 1 นาย ★ */
      var nChief = 0, chiefId = null;
      for (var ch in res.leftA)
        if (U(ch) && U(ch).cls === 'chief'){ nChief += res.leftA[ch]; chiefId = ch; }
      if (nChief > 0 && tgt.type === 'bot'){
        var CM = [0, 1.0, 1.15, 1.30, 1.50];
        var drop = 0;
        for (var ci = 0; ci < nChief; ci++) drop += 20 + Math.random()*10;
        drop = Math.round(drop * (CM[Math.min(4, nChief)] || 1.5));
        var bk = 'loy:' + tgt.bot.id + ':' + tgt.vi;
        if (Game.npc[bk] === undefined) Game.npc[bk] = 100;
        var before = Math.round(Game.npc[bk]);
        Game.npc[bk] = Math.max(0, Game.npc[bk] - drop);
        var after = Math.round(Game.npc[bk]);
        extra += '<br><div class="loyrpt">👑 ขุนพล <b>' + nChief + '</b> นาย · ' +
          'ความภักดี <b>' + before + '% → ' + after + '%</b>' +
          '<div class="loybar2"><i style="width:' + after + '%"></i></div>' +
          (after > 0 ? 'ต้องลดอีก ' + after + '% จึงจะยึดได้' : '') + '</div>';
        if (after <= 0){
          var nv2 = newVillage(mv.tx, mv.ty, 'นคร' + tgt.bot.name.slice(-6), false);
          nv2.captured = true; nv2.loyalty = 25;
          Game.villages.push(nv2);
          tgt.bot.vills.splice(tgt.vi, 1);
          if (!tgt.bot.vills.length) tgt.bot.dead = true;
          Bots.reindex();
          delete Game.npc[bk];
          delete Game.npc['bot:' + tgt.bot.id + ':' + tgt.vi];
          /* เสียขุนพลแค่ 1 นาย ที่เหลือกลับบ้าน */
          if (chiefId){
            res.leftA[chiefId] -= 1;
            if (res.leftA[chiefId] <= 0) delete res.leftA[chiefId];
          }
          extra += '<br><span style="color:#ffcf40;font-size:13px">' +
            '🏴 <b>ยึดเมืองสำเร็จ!</b><br>' + nv2.name + ' เป็นของคุณแล้ว' +
            (nChief > 1 ? '<br>ขุนพลอีก ' + (nChief-1) + ' นายเดินทางกลับ' : '') +
            '</span>';
        }
      }
      /* ★ ดรอปอุปกรณ์วีรบุรุษ ★ */
      if (mv.hero && res.win){
        var dc = tgt.type === 'fort' ? 1.0 : tgt.type === 'oasis' ? 0.35 : 0.22;
        if (Math.random() < dc){
          var tier = tgt.type === 'fort' ? 4 : tgt.type === 'oasis' ? 2 : 1;
          if (Math.random() < 0.2) tier++;
          var it = Hero.dropItem(home, tier);
          extra += '<br><span style="color:#c77dff">🎁 พบอุปกรณ์: <b>' +
            it.n + '</b> (' + Hero.statLine(it) + ')</span>';
        }
      }
      
      if (tgt.type === 'npc' && Math.random() < 0.25)
        counterAttack(mv.tx, mv.ty, home, Combat.count(tgt.d.troops) + 20);
    }

    D.apply(res.leftD);
    Game.stats.atkPts += Math.round(powerOf(res.deadD));
        if (mv.hero){
      Hero.addExp(home, Math.round(Combat.count(res.deadD)*1.5) +
        (tgt.type==='oasis'&&res.win?200:0) + (tgt.type==='fort'&&res.win?2000:0));
      if (!res.win && Math.random() < 0.35) Hero.kill(home);
    }

    
    Hero.addExp(home, Math.round(Combat.count(res.deadD) * 1.2) +
    (tgt.type === 'oasis' && res.win ? 200 : 0) +
    (tgt.type === 'fort' && res.win ? 2000 : 0));


    rpt.title = (res.win ? '⚔️ ชนะ' : '💀 แพ้') + ' — ' +
      MISSIONS[mv.mission].name + ' ' + D.name;
    rpt.body =
      '<div class="rpt-g"><b>ฝ่ายบุก</b> พลัง ' + UI.fmt(res.Ae) +
      ' (ขวัญ ' + Math.round(res.morale*100) + '%)<br>ส่งไป: ' +
      troopLine(mv.troops) + '<br>สูญเสีย: <span class="loss">' +
      troopLine(res.deadA) + '</span> (' + Math.round(res.lossPctA*100) + '%)</div>' +
      '<div class="rpt-g"><b>ฝ่ายรับ</b> พลัง ' + UI.fmt(res.D) +
      ' (กำแพง Lv.' + D.wall + ')<br>กำลังพล: ' + troopLine(D.troopsBefore) +
      '<br>สูญเสีย: <span class="loss">' + troopLine(res.deadD) + '</span> (' +
      Math.round(res.lossPctD*100) + '%)</div>' +
      (carried > 0 ? '<div class="rpt-g"><b>ปล้นได้</b> ' + RES.map(function(r){
        return RES_IC[r] + UI.fmt(lootRes[r]); }).join(' ') + '</div>' : '') + extra;
    pushReport(rpt);

    if (Combat.count(res.leftA) > 0)
      goHome(mv, res.leftA, carried > 0 ? lootRes : null);
  }

  function goHome(mv, troops, loot){
    var home = Game.villages.filter(function(g){ return g.id === mv.from; })[0];
    if (mv.station && typeof Station !== 'undefined') Station.onReturnStart(mv);

    if (!home) return;
    var sec = travelSec(home, mv.tx, mv.ty, troops, true);
    Game.movements.push({
      hero: mv.hero,
      id: now() + Math.floor(Math.random()*999),
      from:mv.from, fx:mv.tx, fy:mv.ty, tx:home.x, ty:home.y,
      mission:mv.mission, troops:troops,
      departAt: now(), arriveAt: now() + sec*1000,
      returning:true, loot:loot
    });
  }

  function counterAttack(fx, fy, home, power){
    var n = Math.max(8, Math.floor(power * 0.35));
    Game.incoming.push({
      id: now() + Math.floor(Math.random()*999),
      fx:fx, fy:fy, tx:home.x, ty:home.y, target:home.id,
      mission:'raid', hostile:true,
      troops:{ a0:Math.round(n*0.6), a1:Math.round(n*0.3), a2:Math.round(n*0.1) },
      departAt: now(),
      arriveAt: now() + Math.max(180, Math.round(
        dist(fx, fy, home.x, home.y) / 6 * 3600 / CFG.SPEED)) * 1000
    });
  }
  function processIncoming(){
    if (!Game.incoming || !Game.incoming.length) return false;
    var t = now();
    var due = Game.incoming.filter(function(m){ return m.arriveAt <= t; });
    if (!due.length) return false;
    due.forEach(function(m){
      var v = Game.villages.filter(function(g){ return g.id === m.target; })[0];
      if (!v) return;
      var D = ownAsDefender(v);
      var res = Combat.resolve(
        { troops:m.troops, smithy:0, pop: D.pop * 1.2, isNpc:true }, D, { raid:true });

      var heal = Math.min(0.30, cityLevel(v,'infirmary') * 0.02);
      var healed = 0, backT = res.leftD;
      if (heal > 0){
        for (var hk in res.deadD){
          var hn = Math.floor(res.deadD[hk] * heal);
          if (hn > 0){ backT[hk] = (backT[hk]||0) + hn; healed += hn; }
        }
      }
      D.apply(backT);

      
  

      Hero.addExp(v, Math.round(Combat.count(res.deadA) * 0.8));
      if (res.win) Hero.kill(v, 0.22);

      
      var lootRes = {wheat:0,wood:0,iron:0,clay:0}, carried = 0;
      if (Combat.count(res.leftA) > 0 && res.win){
        var lt = Combat.loot(res.leftA, v.res, D.cranny, 0);
        lootRes = lt.loot; carried = lt.carried;
        RES.forEach(function(r){ v.res[r] = Math.max(0, v.res[r] - lootRes[r]); });
      }
      pushReport({ at:now(), x:v.x, y:v.y, mission:'defend', read:false, open:false,
        title: (res.win ? '🛡️ ป้องกันไม่สำเร็จ' : '✅ ป้องกันสำเร็จ') + ' — ' + v.name,
        body: '<div class="rpt-g"><b>ศัตรูบุกจาก</b> (' + m.fx + '|' + m.fy + ')<br>' +
          troopLine(m.troops) + '<br>ศัตรูสูญเสีย: <span class="loss">' +
          troopLine(res.deadA) + '</span></div>' +
          '<div class="rpt-g"><b>ฝ่ายเรา</b> พลังป้องกัน ' + UI.fmt(res.D) +
          '<br>สูญเสีย: <span class="loss">' + troopLine(res.deadD) + '</span></div>' 
                    + (healed > 0 ? '<div class="rpt-g" style="color:#8fbf5f">⛑ ' +
            'โรงพยาบาลรักษาทหารกลับมาได้ <b>' + healed + '</b> นาย</div>' : '')

          
          +(carried > 0 ? '<div class="rpt-g" style="color:#ff6b6b"><b>ถูกปล้นไป</b> ' +
            RES.map(function(r){ return RES_IC[r] + UI.fmt(lootRes[r]); }).join(' ') +
            '</div>' : '') });
    });
    Game.incoming = Game.incoming.filter(function(m){ return m.arriveAt > t; });
    return true;
  }

  function tick(){
    var changed = false, t = now();
    try {
      Game.villages.forEach(function(v){ if (processTrain(v)) changed = true; });
      var due = Game.movements.filter(function(m){ return m.arriveAt <= t; });
      if (due.length){
        due.forEach(function(m){ try { arrive(m); } catch(e){ logErr('arrive', e); } });
        Game.movements = Game.movements.filter(function(m){ return m.arriveAt > t; });
        changed = true;
      }
      if (processIncoming()) changed = true;
    } catch(e){ logErr('Military.tick', e); }
    return changed;
  }

    function upkeep(v){
    var s = 0;
    for (var k in (v.troops || {})){
      var u = U(k);
      if (u) s += v.troops[k] * u.up;
    }
    if (typeof Station !== 'undefined' && Station.upkeep)
      s += Station.upkeep(v);
    return Math.round(s);
    }
  
    return { trainCost:trainCost, trainTime:trainTime, enqueueTrain:enqueueTrain,
    cancelTrain:cancelTrain, travelSec:travelSec, send:send, tick:tick,
    upkeep:upkeep, troopLine:troopLine, MISSIONS:MISSIONS,
    defenderAt:defenderAt, dist:dist, counterAttack:counterAttack,
    outgoingCount:outgoingCount, pushReport:pushReport,
    specialCap:specialCap, specialHave:specialHave, };
})();