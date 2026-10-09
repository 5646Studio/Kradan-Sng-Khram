/* ============ BotAI v12c — บอทตัดสินใจเองเหมือนผู้เล่นจริง ============ */

var BOT_PERSONA = [
  { k:'war',  n:'นักรบ',     atk:1.45, def:0.85, eco:0.85, exp:0.9 },
  { k:'turt', n:'ผู้ปักหลัก', atk:0.6,  def:1.6,  eco:1.1,  exp:0.8 },
  { k:'eco',  n:'พ่อค้า',    atk:0.7,  def:1.0,  eco:1.5,  exp:1.1 },
  { k:'exp',  n:'นักบุกเบิก', atk:1.0,  def:0.95, eco:1.15, exp:1.6 }
];

var BotAI = (function(){
  var lastRun = 0;

  function bots(){ return Game.bots || []; }
  function alive(b){ return b && !b.dead && b.vills && b.vills.length; }

  function persona(b){
    if (b.pk === undefined)
      b.pk = Math.floor(Noise.hash(b.id||1, 77, CFG.SEED+404) * BOT_PERSONA.length);
    return BOT_PERSONA[Math.min(BOT_PERSONA.length-1, b.pk)];
  }
  function power(b){
    return (b.troops||0) * (1 + (b.wall||0)*0.03) + (b.pop||0)*0.4;
  }
  function dist(a, b){
    return Math.sqrt(Math.pow(a.vills[0].x - b.vills[0].x, 2) +
                     Math.pow(a.vills[0].y - b.vills[0].y, 2));
  }
  function sameGuild(a, b){
    return a.guild !== undefined && a.guild !== null && a.guild === b.guild;
  }
  function myGuildId(){
    return Game.guild ? (Game.guild.bot ? Game.guild.id : 'me') : null;
  }
  function inMyGuild(b){
    if (!Game.guild || !Game.guild.bot) return false;
    return b.guild === Game.guild.id;
  }

  /* ---------- เศรษฐกิจ / เติบโต ---------- */
  function grow(b, mins){
    var p = persona(b);
    var rate = mins/60;
    b.pop = Math.max(2, Math.round((b.pop||50) + 1.6*p.eco*rate));
    b.troops = Math.max(0, Math.round((b.troops||0) + 2.2*p.atk*rate));
    if (!b.res) b.res = { wheat:0, wood:0, iron:0, clay:0 };
    RES.forEach(function(r){
      b.res[r] = Math.min(400000, (b.res[r]||0) + Math.round(90*p.eco*rate));
    });
    /* อัปกำแพงตามบุคลิก */
    if ((b.wall||0) < 20 && Math.random() < 0.035*p.def)
      b.wall = (b.wall||0) + 1;
    /* ขยายเมือง */
    var cap = p.k === 'exp' ? 6 : p.k === 'eco' ? 4 : 3;
    if (b.vills.length < cap && b.pop > 320*b.vills.length &&
        Math.random() < 0.012*p.exp){
      var src = b.vills[0];
      for (var k = 0; k < 24; k++){
        var ang = Math.random()*Math.PI*2;
        var rr = 4 + Math.random()*11;
        var nx = Math.round(src.x + Math.cos(ang)*rr);
        var ny = Math.round(src.y + Math.sin(ang)*rr);
        if (World.canSettle(nx, ny)) continue;
        if (Game.villages.some(function(g){ return g.x===nx && g.y===ny; })) continue;
        if (Bots.at && Bots.at(nx, ny)) continue;
        b.vills.push({ x:nx, y:ny });
        b.pop = Math.round(b.pop * 0.88);
        if (Bots.reindex) Bots.reindex();
        break;
      }
    }
  }

  /* ---------- บอทตีกันเอง ---------- */
  function botWar(b){
    var p = persona(b);
    if (Math.random() > 0.05*p.atk) return;
    var pool = bots().filter(function(o){
      return alive(o) && o !== b && !sameGuild(b, o) && dist(b, o) < 34;
    });
    if (!pool.length) return;
    var tgt = pool[Math.floor(Math.random()*pool.length)];
    var A = power(b) * (0.8 + Math.random()*0.5) * p.atk;
    var D = power(tgt) * (0.85 + Math.random()*0.45) * persona(tgt).def;
    var win = A > D;
    var lossA = Math.round((b.troops||0) * (win ? 0.07 : 0.24));
    var lossD = Math.round((tgt.troops||0) * (win ? 0.26 : 0.09));
    b.troops = Math.max(0, (b.troops||0) - lossA);
    tgt.troops = Math.max(0, (tgt.troops||0) - lossD);
    b.atkPts = (b.atkPts||0) + lossD*2;
    tgt.defPts = (tgt.defPts||0) + lossA*2;
    if (win){
      var loot = Math.round(Math.min(3000, (tgt.pop||0)*6));
      RES.forEach(function(r){ b.res[r] = (b.res[r]||0) + loot/4; });
      tgt.pop = Math.max(10, Math.round((tgt.pop||0) * 0.97));
      tgt.grudge = Math.min(5, (tgt.grudge||0) + 1);
    } else {
      b.grudge = Math.min(5, (b.grudge||0) + 1);
    }
    /* เล่าให้กิลด์ฟัง ถ้าผู้เล่นอยู่กิลด์เดียวกัน */
    if (inMyGuild(b) && typeof Guild !== 'undefined' && Math.random() < 0.35)
      Guild.chat(b.name, win
        ? 'ข้าเพิ่งตี ' + tgt.name + ' แตก! ได้ของมาเพียบ'
        : 'ข้าบุก ' + tgt.name + ' ไม่สำเร็จ เสียทหารไปเยอะ');
  }

  /* ---------- กำลังหนุนให้เพื่อนกิลด์ (รวมผู้เล่น) ---------- */
  function allyHelp(b){
    if (!inMyGuild(b)) return;
    if (!Game.villages.length) return;
    var p = persona(b);
    var wl, need = null;
    Game.villages.forEach(function(v){
      wl = cityLevel(v, 'watchtower');
      (Game.incoming||[]).forEach(function(m){
        if (m.target !== v.id) return;
        if ((m.arriveAt - now()) > 7200000) return;
        need = v;
      });
    });
    if (!need) return;
    if (Math.random() > 0.35*p.def) return;
    if (!Game.allySup) Game.allySup = [];
    if (Game.allySup.some(function(s){ return s.from === b.id &&
      s.vid === need.id; })) return;
    var send = Math.round((b.troops||0) * (0.12 + Math.random()*0.18));
    if (send < 15) return;
    b.troops -= send;
    var d = Math.sqrt(Math.pow(b.vills[0].x-need.x,2) +
                      Math.pow(b.vills[0].y-need.y,2));
    Game.allySup.push({ from:b.id, who:b.name, vid:need.id,
      power: send * 55, n: send,
      arriveAt: now() + Math.max(120000, d/6*3600000),
      until: 0 });
    if (typeof Guild !== 'undefined')
      Guild.chat(b.name, 'เห็นว่า ' + need.name + ' โดนบุก ข้าส่งทหาร ' +
        send + ' นายไปช่วยแล้ว!');
  }

  function supTick(){
    if (!Game.allySup || !Game.allySup.length) return false;
    var t = now(), ch = false;
    Game.allySup.forEach(function(s){
      if (!s.until && t >= s.arriveAt){
        s.until = t + 43200000;
        ch = true;
        var v = Game.villages.filter(function(g){ return g.id === s.vid; })[0];
        if (v && typeof Military !== 'undefined' && Military.pushReport)
          Military.pushReport({ at:t, x:v.x, y:v.y, cat:'war', mission:'support',
            read:false, open:false,
            title:'🛡 กำลังหนุนจากพันธมิตรมาถึง',
            body:'<b>' + s.who + '</b> ส่งทหาร <b>' + s.n +
              '</b> นายมาช่วยป้องกัน <b>' + v.name + '</b><br>' +
              'เสริมพลังป้องกัน <b>+' + UI.fmt(s.power) + '</b> เป็นเวลา 12 ชั่วโมง' });
      }
    });
    var before = Game.allySup.length;
    Game.allySup = Game.allySup.filter(function(s){
      return !s.until || s.until > t;
    });
    return ch || Game.allySup.length !== before;
  }

  /* พลังป้องกันเสริมของเมือง — ใช้ใน military.js */
  function allyDef(v){
    if (!v || !Game.allySup) return 0;
    var t = now(), s = 0;
    Game.allySup.forEach(function(x){
      if (x.vid === v.id && x.until && x.until > t) s += x.power;
    });
    return Math.round(s);
  }
  function allyList(v){
    if (!v || !Game.allySup) return [];
    var t = now();
    return Game.allySup.filter(function(x){ return x.vid === v.id; });
  }

  /* ผู้เล่นส่งกำลังหนุนให้บอทพันธมิตร */
  function absorbSupport(x, y, troops){
    try {
      var e = (typeof Bots !== 'undefined' && Bots.at) ? Bots.at(x, y) : null;
      if (!e) return false;
      var n = Combat.count(troops);
      e.bot.troops = (e.bot.troops||0) + Math.round(n*0.9);
      e.bot.grudge = 0;
      if (typeof Guild !== 'undefined' && inMyGuild(e.bot))
        Guild.chat(e.bot.name, 'ขอบคุณสำหรับกำลังหนุน ' + n + ' นาย!');
      return true;
    } catch(err){ return false; }
  }

  /* ---------- การทูตของบอท ---------- */
  function diplomacy(){
    if (Math.random() > 0.06) return;
    var gs = Game.guilds || [];
    if (gs.length < 2) return;
    var a = gs[Math.floor(Math.random()*gs.length)];
    var b = gs[Math.floor(Math.random()*gs.length)];
    if (!a || !b || a === b) return;
    a.allies = a.allies || []; a.enemies = a.enemies || [];
    b.allies = b.allies || []; b.enemies = b.enemies || [];
    if (Math.random() < 0.5){
      if (a.allies.indexOf(b.id) < 0 && a.enemies.indexOf(b.id) < 0){
        a.allies.push(b.id); b.allies.push(a.id);
      }
    } else {
      if (a.enemies.indexOf(b.id) < 0){
        a.allies = a.allies.filter(function(x){ return x !== b.id; });
        b.allies = b.allies.filter(function(x){ return x !== a.id; });
        a.enemies.push(b.id); b.enemies.push(a.id);
        (a.members||[]).forEach(function(bid){
          var bb = bots()[bid];
          if (bb) bb.grudge = Math.min(5, (bb.grudge||0)+2);
        });
      }
    }
  }

  /* ---------- tick ---------- */
  function tick(){
    try {
      if (!Game.villages || !Game.villages.length) return false;
      var t = now();
      if (!lastRun) lastRun = t - 60000;
      var mins = Math.min(600, (t - lastRun)/60000);
      if (mins < 0.9) return supTick();
      lastRun = t;

      var L = bots();
      for (var i = 0; i < L.length; i++){
        var b = L[i];
        if (!alive(b)) continue;
        grow(b, mins);
        if (Math.random() < 0.25) botWar(b);
        allyHelp(b);
      }
      diplomacy();
      supTick();
      return true;
    } catch(e){ logErr('BotAI', e); return false; }
  }

  function info(b){
    var p = persona(b);
    return p.n;
  }

  return { tick:tick, allyDef:allyDef, allyList:allyList,
    absorbSupport:absorbSupport, persona:persona, info:info };
})();

/* เดินเอง ไม่ต้องแก้ main.js */
setInterval(function(){
  try { if (window.Game && Game.villages && Game.villages.length) BotAI.tick(); }
  catch(e){}
}, 12000);