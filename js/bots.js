/* ============ ระบบบอท 120 ตัว + กิลด์บอท ============ */

var BOT_FIRST = ['ขุน','พระยา','หลวง','เจ้าพระยา','ท้าว','พญา','เจ้าฟ้า','หมื่น',
  'พ่อขุน','เจ้า','นาย','ออกญา'];
var BOT_NAME = ['รามคำแหง','งำเมือง','อินทราทิตย์','บรมราชา','สุรศักดิ์','พิชัย',
  'ศรีธรรมา','มหาพรหม','แสนเมือง','ธรรมราชา','จักรี','นเรศ','เอกาทศ','ศรีสุริยวงศ์',
  'เดโช','พิษณุ','อยุธยา','ละโว้','หริภุญ','สุพรรณ','กำแพง','ตาก','ระยอง','จันทบูร',
  'นครชัย','เชียงราย','พะเยา','แพร่','น่าน','อุทัย','ชัยนาท','สิงห์','อ่างทอง',
  'สระบุรี','ลพบุรี','เพชรบูรณ์','พิจิตร','กาญจน์','ราชบุรี','เพชรบุรี'];
var GUILD_NAME = ['อโยธยา','ล้านนา','หงสาวดี','ศรีอยุธยา','สุโขทัย','ทวารวดี',
  'ละโว้','ศรีวิชัย'];
var GUILD_TAG = ['AYO','LAN','HON','SRI','SUK','DVA','LVO','SVJ'];

var Bots = (function(){
  var index = {};

  function rnd(seed){
    var x = Math.sin(seed * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  }

  /* ---------- สร้างบอททั้งหมด ---------- */
  function init(){
    var bots = [], guilds = [], i, g;

    for (g = 0; g < CFG.BOT_GUILDS; g++){
      guilds.push({ id:g, name:GUILD_NAME[g], tag:GUILD_TAG[g],
        members:[], allies:[], enemies:[], bot:true });
    }
    for (i = 0; i < CFG.BOT_GUILDS; i++){
      var a = (i + 1) % CFG.BOT_GUILDS;
      var e = (i + 4) % CFG.BOT_GUILDS;
      if (guilds[i].allies.indexOf(a) < 0){
        guilds[i].allies.push(a); guilds[a].allies.push(i);
      }
      if (guilds[i].enemies.indexOf(e) < 0){
        guilds[i].enemies.push(e); guilds[e].enemies.push(i);
      }
    }

    for (i = 0; i < CFG.BOT_COUNT; i++){
      var h1 = rnd(i*7+1), h2 = rnd(i*13+5), h3 = rnd(i*29+11), h4 = rnd(i*41+3);
      var skill = h1 < 0.4 ? 0.45 + h2*0.25
                : h1 < 0.8 ? 0.75 + h2*0.35
                : 1.15 + h2*0.35;
      var zone = ZONES[i % 4];
      var pos = findSpot(zone, i);
      var gid = Math.floor(h3 * CFG.BOT_GUILDS);
      var inGuild = h4 < 0.72;

      var bot = {
        id: i,
        name: BOT_FIRST[Math.floor(h2*BOT_FIRST.length)] +
              BOT_NAME[Math.floor(h3*BOT_NAME.length)],
        tribe: Math.floor(h4*3),
        skill: skill,
        aggr: 0.25 + h3*0.75,
        zone: zone.id,
        guild: inGuild ? gid : null,
        vills: [{ x:pos.x, y:pos.y, cap:true }],
        pop: 2, troops: 0, res: { wheat:0, wood:0, iron:0, clay:0 },
        wall: 0, atkPts: 0, defPts: 0,
        lastAtk: 0, grudge: 0, syncAt: Game.startedAt
      };
      if (inGuild) guilds[gid].members.push(i);
      bots.push(bot);
    }
    Game.bots = bots;
    Game.guilds = guilds;
    reindex();
    sync(true);
  }

  function findSpot(zone, seed){
    for (var k = 0; k < 400; k++){
      var a = rnd(seed*97 + k*3) * Math.PI/2;
      var rad = 14 + rnd(seed*31 + k*7) * 78;
      var x = Math.round(Math.cos(a)*rad) * zone.sx;
      var y = Math.round(Math.sin(a)*rad) * zone.sy;
      if (World.canSettle(x, y)) continue;
      if (occupied(x, y)) continue;
      return { x:x, y:y };
    }
    return { x: 40*zone.sx, y: 40*zone.sy };
  }
  function occupied(x, y){
    if (index[x + ',' + y]) return true;
    if (Game.villages.some(function(v){ return v.x===x && v.y===y; })) return true;
    if (World.tile(x, y).npc) return true;
    return false;
  }
  function reindex(){
    index = {};
    (Game.bots || []).forEach(function(b){
      b.vills.forEach(function(vv, vi){
        index[vv.x + ',' + vv.y] = { bot:b.id, vi:vi };
      });
    });
  }

  /* ---------- เติบโตแบบคำนวณย้อนหลัง ---------- */
  function sync(force){
    if (!Game.bots) return;
    var t = now();
    var d = Math.max(0, (t - Game.startedAt) / 86400000 * CFG.SPEED);
    Game.bots.forEach(function(b){
      var last = (b.syncAt - Game.startedAt) / 86400000 * CFG.SPEED;
      if (!force && d - last < 0.02) return;
      b.syncAt = t;

      var growth = Math.pow(Math.max(0.2, d), 1.35);
      b.pop = Math.floor(2 + 9 * b.skill * growth);
      b.wall = Math.min(20, Math.floor(d * b.skill * 0.45));
      b.troops = Math.floor(b.pop * (1.2 + b.aggr*1.6) * b.skill);

      var want = Math.min(4, 1 + Math.floor(d / 13 * b.skill));
      while (b.vills.length < want){
        var z = ZONES.filter(function(q){ return q.id === b.zone; })[0];
        var p = findSpot(z, b.id*17 + b.vills.length*53);
        b.vills.push({ x:p.x, y:p.y, cap:false });
        index[p.x + ',' + p.y] = { bot:b.id, vi:b.vills.length-1 };
      }
      var stock = Math.floor(b.pop * 22 * (0.6 + b.skill*0.5));
      RES.forEach(function(r){ b.res[r] = stock; });
      b.atkPts = Math.floor(b.pop * 12 * b.aggr * b.skill);
      b.defPts = Math.floor(b.pop * 9 * (1.4 - b.aggr) * b.skill);
    });
    aiTick();
  }

  /* ---------- AI: บอทโจมตีผู้เล่น ---------- */
  function aiTick(){
    if (isProtected()) return;
    if (!Game.villages.length) return;
    var t = now();
    Game.bots.forEach(function(b){
      if (t - b.lastAtk < 3600000 * (2 + (1-b.aggr)*8)) return;
      var tgt = null, best = 1e9;
      Game.villages.forEach(function(v){
        var d = Military.dist(b.vills[0].x, b.vills[0].y, v.x, v.y);
        if (d < best){ best = d; tgt = v; }
      });
      if (!tgt || best > 45) return;
      var chance = b.aggr * 0.09 + (b.grudge > 0 ? 0.35 : 0);
      var myDef = Combat.count(tgt.troops) * 45 + population(tgt)*2;
      if (myDef > b.troops * 38) chance *= 0.25;
      if (Math.random() > chance) return;

      b.lastAtk = t;
      if (b.grudge > 0) b.grudge--;
      var n = Math.max(10, Math.floor(b.troops * (0.25 + Math.random()*0.35)));
      Game.incoming.push({
        id: t + Math.floor(Math.random()*999),
        fx:b.vills[0].x, fy:b.vills[0].y, tx:tgt.x, ty:tgt.y,
        target:tgt.id, botId:b.id, mission:'raid', hostile:true,
        troops:{ a0:Math.round(n*0.55), a1:Math.round(n*0.3),
                 a2:Math.round(n*0.15) },
        departAt: t,
        arriveAt: t + Math.max(600, Math.round(best/7*3600/CFG.SPEED))*1000
      });
    });
  }

  /* ---------- เข้าถึงข้อมูล ---------- */
  function at(x, y){
    var e = index[x + ',' + y];
    if (!e || !Game.bots) return null;
    var b = Game.bots[e.bot];
    if (!b) return null;
    return { bot:b, vi:e.vi, v:b.vills[e.vi] };
  }
  function relAt(x, y){
    var e = at(x, y);
    if (!e) return null;
    var b = e.bot;
    if (Game.guild && Game.guild.id !== undefined && b.guild === Game.guild.id)
      return 'guild';
    if (Game.guild && b.guild !== null && Game.guild.allies &&
        Game.guild.allies.indexOf(b.guild) >= 0) return 'ally';
    if (Game.guild && b.guild !== null && Game.guild.enemies &&
        Game.guild.enemies.indexOf(b.guild) >= 0) return 'enemy';
    if (b.grudge > 0) return 'enemy';
    return 'neutral';
  }
  function list(){ return Game.bots || []; }
  function guildOf(id){
    return (Game.guilds && id !== null && id !== undefined) ? Game.guilds[id] : null;
  }
  function ranking(mode){
    var rows = (Game.bots || []).map(function(b){
      return { name:b.name, guild: guildOf(b.guild) ? guildOf(b.guild).tag : null,
        pop:b.pop, atk:b.atkPts, def:b.defPts, vills:b.vills.length, me:false };
    });
    var me = { name:Game.player.name, guild: Game.guild ? Game.guild.tag : null,
      pop:0, atk:Game.stats.atkPts, def:Game.stats.defPts,
      vills:Game.villages.length, me:true };
    Game.villages.forEach(function(v){ me.pop += population(v); });
    rows.push(me);
    var key = mode === 'atk' ? 'atk' : mode === 'def' ? 'def' : 'pop';
    rows.sort(function(a, c){ return c[key] - a[key]; });
    return rows;
  }
  function addGrudge(x, y, n){
    var e = at(x, y);
    if (e) e.bot.grudge = Math.min(6, (e.bot.grudge||0) + (n||2));
  }

  /* ---------- เชื่อมเข้ากับระบบรบ (monkey patch) ---------- */
  function hook(){
    if (typeof Military === 'undefined' || Military.__botHooked) return;
    Military.__botHooked = true;

    var origDef = Military.defenderAt;
    Military.defenderAt = function(x, y){
      var e = at(x, y);
      if (e){
        var b = e.bot;
        var key = 'bot:' + b.id + ':' + e.vi;
        var share = e.vi === 0 ? 0.55 : 0.15;
        if (!Game.npc[key]){
          Game.npc[key] = { kind:'bot', botId:b.id, vi:e.vi,
            name: b.name + (e.vi === 0 ? ' (เมืองหลัก)' : ' (เมืองที่ ' + (e.vi+1) + ')'),
            wall:b.wall, armoury: Math.floor(b.wall*0.6),
            pop: Math.floor(b.pop * share), cranny: 600 + b.pop*4,
            troops: botTroops(b, share),
            res: { wheat:Math.floor(b.res.wheat*share),
                   wood:Math.floor(b.res.wood*share),
                   iron:Math.floor(b.res.iron*share),
                   clay:Math.floor(b.res.clay*share) },
            lastRes: now(), rate: Math.floor(60 + b.pop*share*3) };
        }
        return { type:'bot', d:Game.npc[key], bot:b, vi:e.vi };
      }
      return origDef(x, y);
    };

    var origSend = Military.send;
    Military.send = function(v, tx, ty, mission, troops, cataTarget){
      var r = origSend.apply(null, arguments);
      if (!r && (mission === 'attack' || mission === 'raid')){
        if (at(tx, ty)){ breakProtection(); addGrudge(tx, ty, 2); }
      }
      return r;
    };
  }
  function botTroops(b, share){
    var n = Math.max(3, Math.floor(b.troops * share));
    return { g0:Math.round(n*0.45), g1:Math.round(n*0.33),
             g2:Math.round(n*0.16), g3:Math.max(1, Math.round(n*0.06)) };
  }

  return { init:init, sync:sync, at:at, relAt:relAt, list:list,
    guildOf:guildOf, ranking:ranking, addGrudge:addGrudge,
    reindex:reindex, hook:hook, aiTick:aiTick };
})();