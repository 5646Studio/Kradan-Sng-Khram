var Settings = (function(){
  var devTap = 0;

  function box(h){ UI.modal(h); }
  function close(){ document.getElementById('modal').classList.add('hidden'); }

  function open(){
    var v = V();
    var d = Conquest.daysElapsed();
    var z = ZONES.filter(function(q){ return q.id === Game.player.quadrant; })[0] || {};

    var h = '<h3>⚙ ตั้งค่า</h3>';
    h += '<div class="sblock"><div class="stitle">👤 โปรไฟล์</div>' +
      '<div class="row"><span>ชื่อเจ้านคร</span><b>' + Game.player.name + '</b></div>' +
      '<div class="row"><span>เผ่า</span><b>' + TRIBES[Game.player.tribe].name + '</b></div>' +
      '<div class="row"><span>โซน</span><b>' + (z.name || '-') + '</b></div>' +
      '<div class="row" id="daytap" style="cursor:pointer"><span>วันที่เซิร์ฟเวอร์</span>' +
      '<b>' + Math.floor(d) + ' / ' + CFG.TOTAL_DAYS + '</b></div>' +
      '<div class="row"><span>จำนวนเมือง</span><b>' + Game.villages.length + '</b></div>' +
      '<div class="row"><span>Culture Points</span><b>' + UI.fmt(Game.player.cp) +
      ' (+' + cpPerDay() + '/วัน)</b></div>' +
      '<div class="row"><span>สิทธิ์ตั้งเมือง</span><b>' + Game.player.slotsUsed +
      ' / ' + Game.player.slotsEarned + '</b></div>' +
      '<div class="row"><span>แต้มโจมตี</span><b>' + UI.fmt(Game.stats.atkPts) + '</b></div>' +
      '<div class="row"><span>แต้มป้องกัน</span><b>' + UI.fmt(Game.stats.defPts) + '</b></div>' +
      '<div class="row"><span>ปล้นได้รวม</span><b>' + UI.fmt(Game.stats.raidPts) + '</b></div>' +
      
      '<button class="btn-ok" id="en">✏️ แก้ไขชื่อเจ้านคร</button>' +
      '<button class="btn-ok" id="ev">🏛 เปลี่ยนชื่อเมืองปัจจุบัน</button></div>';

    h += '<div class="sblock"><div class="stitle">📜 บทสอนเล่น</div>' +
      '<div class="row"><span>ความคืบหน้า</span><b>' + Game.quest + ' / ' +
      QUESTS.length + '</b></div>' +
      '<div class="row"><span>สถานะ</span><b>' +
      (Game.tutorialSkip ? 'ข้ามแล้ว' : Quest.isForced() ? 'กำลังบังคับ' : 'อิสระ') +
      '</b></div>' +
      (Game.tutorialSkip || !Quest.isForced() ? ''
        : '<button class="btn-cancel" id="qskip2">ข้ามบทสอนเล่น</button>') +
      '</div>';

    h += '<div class="sblock"><div class="stitle">🏘 จัดการเมือง</div>';
    Game.villages.forEach(function(g, i){
      h += '<div class="row"><span>' + (i === Game.active ? '▸ ' : '') + g.name +
        ' (' + g.x + '|' + g.y + ')<br><i style="font-size:10px;color:#8a7a55">' +
        'ปชก. ' + population(g) + ' · ทหาร ' + Combat.count(g.troops) +
        ' · ' + g.layoutName + '</i></span>' +
        '<button class="mini" data-del="' + i + '" ' +
        'style="background:#7a2020;color:#fff">ลบ</button></div>';
    });
    h += '</div>';

    if (DEV_MODE)
      h += '<div class="sblock dev"><div class="stitle">🧪 โหมดนักพัฒนา</div>' +
        '<button class="btn-dev" id="devopen">เปิดเมนูนักพัฒนา</button></div>';

    h += '<div class="sblock danger"><div class="stitle">⚠️ เขตอันตราย</div>' +
      '<button class="btn-ok" id="lobby" style="background:#3a2e1c;color:#ffcf40">' +
      '🏠 กลับหน้าหลัก</button>' +
      '<button data-s="logout">👤 เปลี่ยนบัญชี</button>' +
      '<button data-s="lobby">🏠 กลับหน้าหลัก</button>' +

      '<button class="btn-del" id="wipe">💀 ออกจากเซิร์ฟเวอร์ (ลบข้อมูล)</button>' +
      '<p class="warn">ลบทุกเมืองในเซิร์ฟนี้ · กู้คืนไม่ได้</p></div>';
    h += '<button class="btn-cancel" onclick="Settings.close()">ปิด</button>';
    box(h);

    document.getElementById('en').onclick = function(){
      var n = prompt('ชื่อเจ้านคร:', Game.player.name);
      if (n && n.trim()){ Game.player.name = n.trim().slice(0,20); save(); open(); }
    };
    document.getElementById('ev').onclick = function(){
      var n = prompt('ชื่อเมือง:', v.name);
      if (n && n.trim()){ v.name = n.trim().slice(0,24); save(); UI.refreshAll(); open(); }
    };
    var qs2 = document.getElementById('qskip2');
    if (qs2) qs2.onclick = function(){ Quest.skip(); };
    document.querySelectorAll('[data-del]').forEach(function(b){
      b.onclick = function(){ confirmDelete(+b.dataset.del); };
    });
    document.getElementById('lobby').onclick = function(){
      save(); location.href = 'index.html';
    };
    document.getElementById('wipe').onclick = confirmWipe;

    /* แตะวันที่ 5 ครั้ง = เปิดเมนูลับ */
    document.getElementById('daytap').onclick = function(){
      devTap++;
      if (devTap >= 5){ devTap = 0; devMenu(); }
    };
    var dv = document.getElementById('devopen');
    if (dv) dv.onclick = devMenu;
  }

  /* ============ เมนูนักพัฒนา ============ */
  function devMenu(){
    var v = V();
    var h = '<h3 style="color:#4db8ff">🧪 เมนูนักพัฒนา (Beta)</h3>';
    h += '<div class="infobox" style="border-color:#2a4a6a">' +
      'เครื่องมือทดสอบเกม · ปิดได้โดยตั้ง <b>DEV_MODE = false</b> ใน config.js<br>' +
      'เวลาที่เลื่อนไปแล้ว: <b>' + UI.dur((Game.timeShift||0)/1000) + '</b></div>';

    h += '<div class="dgrp"><div class="dttl">💰 ทรัพยากร</div><div class="dgrid">' +
      '<button data-d="res1k">+1,000 ทุกชนิด</button>' +
      '<button data-d="res10k">+10,000 ทุกชนิด</button>' +
      '<button data-d="resfull">เติมเต็มคลัง</button>' +
      '<button data-d="gold100">+100 ทอง</button>' +
      '<button data-d="gold1k">+1,000 ทอง</button>' +
      '<button data-d="cp">+5,000 CP</button>' +
      '</div></div>';

    h += '<div class="dgrp"><div class="dttl">⏱ ข้ามเวลา</div><div class="dgrid">' +
      '<button data-d="t1h">+1 ชั่วโมง</button>' +
      '<button data-d="t6h">+6 ชั่วโมง</button>' +
      '<button data-d="t1d">+1 วัน</button>' +
      '<button data-d="t7d">+7 วัน</button>' +
      '<button data-d="t20d">ไปวันที่ 20</button>' +
      '<button data-d="t35d">ไปวันที่ 35</button>' +
      '</div></div>';

    h += '<div class="dgrp"><div class="dttl">🔨 ก่อสร้าง</div><div class="dgrid">' +
      '<button data-d="qdone">เสร็จทันทีทุกคิว</button>' +
      '<button data-d="build3">ช่าง 3 คน (ถาวร)</button>' +
      '<button data-d="all10">อาคารเป็น Lv.10</button>' +
      '<button data-d="all20">อาคารเป็น Lv.20</button>' +
      '<button data-d="field10">หลุมเป็น Lv.10</button>' +
      '<button data-d="field20">หลุมเป็น Lv.20</button>' +
      '</div></div>';

    h += '<div class="dgrp"><div class="dttl">⚔ ทหาร</div><div class="dgrid">' +
      '<button data-d="troop100">+100 ทุกหน่วย</button>' +
      '<button data-d="troop1k">+1,000 ทุกหน่วย</button>' +
      '<button data-d="tdone">ฝึกเสร็จทันที</button>' +
      '<button data-d="enemy">จำลองศัตรูบุก</button>' +
      '</div></div>';

    h += '<div class="dgrp"><div class="dttl">👑 ปลายเกม</div><div class="dgrid">' +
      '<button data-d="forts">ยึดป้อมครบ 8</button>' +
      '<button data-d="slot">+1 สิทธิ์ตั้งเมือง</button>' +
      '<button data-d="vil2">สร้างเมืองที่ 2</button>' +
      '<button data-d="demo">ข้อมูลกิลด์ทดสอบ</button>' +
      '</div></div>';

    h += '<div class="dgrp"><div class="dttl">🤖 บอท / วีรบุรุษ</div><div class="dgrid">' +
      '<button data-d="botinit">สร้างบอทใหม่</button>' +
      '<button data-d="botsync">อัปเดตบอททันที</button>' +
      '<button data-d="botatk">บอทบุกทันที</button>' +
      '<button data-d="protoff">ยกเลิกการคุ้มครอง</button>' +
      '<button data-d="hero3">วีรบุรุษ 3 คน Lv.20</button>' +
      '<button data-d="sched">ปลดล็อกแผนการรบ</button>' +
      '</div></div>';
    
    h += '<div class="dgrp"><div class="dttl">🐞 ดีบัก</div><div class="dgrid">' +
      '<button data-d="fixq">🔧 ซ่อมคิวก่อสร้าง</button>' +
      '<button data-d="rstime">⏱ รีเซ็ตเวลา</button>' +

      '<button data-d="err">📋 บันทึกข้อผิดพลาด (' + ErrLog.length + ')</button>' +
      '<button data-d="info">ข้อมูลระบบ</button>' +
      '<button data-d="qskip">ข้ามบทสอนเล่น</button>' +
      '<button data-d="qreset">รีเซ็ตเควส</button>' +
      '</div></div>';

    h += '<button class="btn-cancel" onclick="Settings.open()">ย้อนกลับ</button>';
    box(h);

    document.querySelectorAll('[data-d]').forEach(function(b){
      b.onclick = function(){ devAct(b.dataset.d); };
    });
  }

  function addRes(n){
    var v = V(); refresh(v);
    var c = caps(v);
    RES.forEach(function(r){
      var cap = (r === 'wheat') ? c.gran : c.store;
      v.res[r] = Math.min(cap, v.res[r] + n);
    });
  }
  function shiftTime(ms){
    Game.timeShift = (Game.timeShift || 0) + ms;
    Game.villages.forEach(function(v){
      processQueue(v); refresh(v);
    });
    Military.tick(); Market.tick();
    Game.player.cp += cpPerDay() * (ms / 86400000);
    while (Game.player.cp >= cpNeeded(Game.player.slotsEarned + 1))
      Game.player.slotsEarned++;
    save(); UI.refreshAll();
  }

  function devAct(k){
    var v = V();
    switch(k){
              case 'fixq':
        Game.villages.forEach(function(g){
          g.queue = (g.queue||[]).filter(function(q){ return q && q.cost; });
          g.queue.forEach(function(q){
            if (!isFinite(q.sec) || q.sec < 5) q.sec = 60;
            if (q.active){ q.start = now(); q.finish = now() + q.sec*1000; }
          });
        });
        alert('ซ่อมคิวแล้ว');
        break;
      case 'rstime':
        Game.timeShift = 0;
        Game.villages.forEach(function(g){ g.resAt = now(); });
        alert('รีเซ็ตเวลาเป็นปัจจุบันแล้ว');
        break;
        
      case 'res1k':  addRes(1000); break;
      case 'res10k': addRes(10000); break;
      case 'resfull':
        refresh(v);
        var c = caps(v);
        RES.forEach(function(r){ v.res[r] = (r==='wheat') ? c.gran : c.store; });
        break;
      case 'gold100': Game.player.gold += 100; break;
      case 'gold1k':  Game.player.gold += 1000; break;
      case 'cp':
        Game.player.cp += 5000;
        while (Game.player.cp >= cpNeeded(Game.player.slotsEarned + 1))
          Game.player.slotsEarned++;
        break;

      case 't1h':  shiftTime(3600000); break;
      case 't6h':  shiftTime(6*3600000); break;
      case 't1d':  shiftTime(86400000); break;
      case 't7d':  shiftTime(7*86400000); break;
      case 't20d':
        var need20 = 20 - Conquest.daysElapsed();
        if (need20 > 0) shiftTime(need20 * 86400000);
        break;
      case 't35d':
        var need35 = 35 - Conquest.daysElapsed();
        if (need35 > 0) shiftTime(need35 * 86400000);
        break;

      case 'qdone':
        v.queue.forEach(function(q){ if (q.active) q.finish = now(); });
        processQueue(v);
        break;
      case 'build3':
        Game.builders = 3; Game.builderUntil = now() + 999*86400000;
        break;
      case 'all10': case 'all20':
        var lv = k === 'all10' ? 10 : 20;
        v.city.forEach(function(cc){
          if (cc.b) cc.level = Math.min(BUILDINGS[cc.b].max, lv);
        });
        break;
      case 'field10': case 'field20':
        var fl = k === 'field10' ? 10 : 20;
        v.fields.forEach(function(f){ f.level = fl; });
        break;

      case 'troop100': case 'troop1k':
        var n = k === 'troop100' ? 100 : 1000;
        myUnits().forEach(function(u){
          v.troops[u.id] = (v.troops[u.id] || 0) + n;
        });
        break;
      case 'tdone':
        for (var b in (v.train||{})){
          var q = v.train[b];
          while (q.length){
            var j = q[0];
            v.troops[j.unit] = (v.troops[j.unit] || 0) + j.left;
            q.shift();
          }
        }
        break;
      case 'enemy':
        Military.counterAttack(v.x - 5, v.y + 4, v, 200);
        alert('ศัตรูกำลังมา! ไปดูที่หน้าแผนที่');
        break;

      case 'forts':
        FORTS.forEach(function(f){ Game.forts[f.id] = 'me'; });
        break;
      case 'slot': Game.player.slotsEarned++; break;
      case 'vil2':
        var sp = null;
        for (var dd = 6; dd < 25 && !sp; dd++){
          for (var a = 0; a < 16 && !sp; a++){
            var ang = a / 16 * Math.PI * 2;
            var nx = v.x + Math.round(Math.cos(ang) * dd);
            var ny = v.y + Math.round(Math.sin(ang) * dd);
            if (!World.canSettle(nx, ny) &&
                !Game.villages.some(function(g){ return g.x===nx && g.y===ny; }))
              sp = { x:nx, y:ny };
          }
        }
        if (sp){
          var nv = newVillage(sp.x, sp.y, 'เมืองที่ ' + (Game.villages.length+1), false);
          Game.villages.push(nv);
          Game.player.slotsUsed++;
          if (Game.player.slotsEarned < Game.player.slotsUsed)
            Game.player.slotsEarned = Game.player.slotsUsed;
          alert('สร้างเมืองที่ (' + sp.x + '|' + sp.y + ') · ' + nv.layoutName);
        } else alert('หาที่ว่างไม่เจอ');
        break;
      case 'demo':
        Game.guild = { name:'กิลด์ทดสอบ', tag:'TST', members:[
          { name:'สหายเหนือ', x:v.x+4, y:v.y+3 },
          { name:'สหายใต้',   x:v.x-3, y:v.y-4 }]};
        Game.allies  = [{ name:'พันธมิตรบูรพา', x:v.x+7, y:v.y-2 }];
        Game.enemies = [{ name:'ศัตรูประจิม',   x:v.x-6, y:v.y+5 }];
        break;

      case 'botinit': Bots.init(); Bots.hook(); break;
      case 'botsync': Bots.sync(true); break;
      case 'botatk':
        Game.protectBroken = true;
        (Game.bots||[]).forEach(function(b){ b.lastAtk = 0; });
        Bots.aiTick();
        alert('สั่งบอทโจมตีแล้ว');
        break;
      case 'protoff': Game.protectBroken = true; break;
      case 'hero3':
        v.city.forEach(function(cc){
          if (cc.b === bIndex('hero')) cc.level = 20; });
        if (cityLevel(v,'hero') < 1){
          for (var z = 0; z < v.city.length; z++)
            if (!v.city[z].b){ v.city[z] = { b:bIndex('hero'), level:20 }; break; }
        }
        v.heroes = [];
        for (var q = 0; q < 3; q++){
          v.heroes.push({ id: now()+q, name: HERO_NAMES[q], level:20, exp:0,
            free:0, atk:20, def:20, lead:20, prod:20, dead:false, reviveAt:0 });
        }
        break;
      case 'sched':
        Game.schedUntil = now() + 999*86400000;
        break;
            case 'logout':
        save(); Account.logout();
        location.href = 'index.html';
        break;
      case 'lobby':
        save();
        location.href = 'index.html';
        break;
  
      case 'err': return showErrors();
      case 'info': return showInfo();
      case 'qskip':
        Game.tutorialSkip = true;
        Game.quest = Math.max(Game.quest, FORCED);
        break;
      case 'qreset':
        Game.quest = 0; Game.questDone = []; Game.tutorialSkip = false;
        break;
    }
    save(); UI.refreshAll();
    if (typeof Renderer !== 'undefined') Renderer.invalidate();
    devMenu();
  }

  function showErrors(){
    var h = '<h3>📋 บันทึกข้อผิดพลาด</h3>';
    if (!ErrLog.length){
      h += '<div class="infobox" style="color:#8fbf5f;text-align:center">' +
        '✅ ไม่พบข้อผิดพลาด</div>';
    } else {
      ErrLog.forEach(function(e){
        h += '<div class="errrow"><b>' + e.where + '</b>' +
          '<i>' + new Date(e.at).toLocaleTimeString('th-TH') + '</i>' +
          '<div>' + e.msg + '</div></div>';
      });
      h += '<button class="btn-del" id="eclr">ล้างบันทึก</button>';
    }
    h += '<button class="btn-cancel" onclick="Settings.dev()">ย้อนกลับ</button>';
    box(h);
    var b = document.getElementById('eclr');
    if (b) b.onclick = function(){ ErrLog.length = 0; showErrors(); };
  }
  function showInfo(){
    var v = V();
    var h = '<h3>ℹ️ ข้อมูลระบบ</h3>';
    h += '<div class="row"><span>Storage</span><b>' +
      (Store.ok ? 'localStorage ✔' : 'memory only ⚠') + '</b></div>';
    h += '<div class="row"><span>Assets</span><b>' +
      (Assets.isOn && Assets.isOn() ? 'เปิดใช้รูป' : 'ใช้สีแทน') + '</b></div>';
    h += '<div class="row"><span>ขนาดเซฟ</span><b>' +
      Math.round(JSON.stringify(Game).length / 1024) + ' KB</b></div>';
    h += '<div class="row"><span>เมือง/ขบวน/รายงาน</span><b>' +
      Game.villages.length + ' / ' + (Game.movements.length + Game.incoming.length) +
      ' / ' + Game.reports.length + '</b></div>';
    h += '<div class="row"><span>ช่างก่อสร้าง</span><b>' + builderCount() + '</b></div>';
    h += '<div class="row"><span>เวลาเลื่อน</span><b>' +
      UI.dur((Game.timeShift||0)/1000) + '</b></div>';
    h += '<div class="row"><span>ลานรวมพล</span><b>Lv.' + cityLevel(v,'rally') +
      ' · ' + rallySlots(cityLevel(v,'rally')) + ' ขบวน</b></div>';
    h += '<button class="btn-cancel" onclick="Settings.dev()">ย้อนกลับ</button>';
    box(h);
  }

  function confirmDelete(idx){
    var v = Game.villages[idx];
    if (!v) return alert('ไม่พบเมือง');
    var last = Game.villages.length <= 1;
    var h = '<h3 style="color:#ff6b6b">🗑 ยืนยันการลบเมือง</h3>' +
      '<div class="eta" style="border-color:#7a2020"><b>' + v.name + '</b> (' +
      v.x + '|' + v.y + ')<br>ประชากร ' + population(v) + ' · ทหาร ' +
      Combat.count(v.troops) + ' นาย</div>' +
      '<p style="font-size:11px;line-height:1.7;margin:9px 0">' +
      '• อาคารและทรัพยากรทั้งหมดหายไป<br>• ทหารในเมืองถูกยุบ<br>' +
      '• พิกัดนี้กลายเป็น <b>เมืองร้าง NPC</b><br>' +
      (last ? '<b style="color:#ff6b6b">• เมืองสุดท้าย — จะออกจากเซิร์ฟเวอร์</b>'
            : '• คืนสิทธิ์ตั้งเมือง 1 สิทธิ์') + '</p>' +
      '<p style="font-size:11px;color:#a89468">พิมพ์ชื่อเมืองเพื่อยืนยัน:</p>' +
      '<input type="text" id="dc" class="selbox" placeholder="' + v.name + '">' +
      '<button class="btn-del" id="dgo">ยืนยันลบถาวร</button>' +
      '<button class="btn-cancel" onclick="Settings.open()">ย้อนกลับ</button>';
    box(h);
    document.getElementById('dgo').onclick = function(){
      if (document.getElementById('dc').value.trim() !== v.name)
        return alert('ชื่อเมืองไม่ตรง');
      doDelete(idx);
    };
  }
  function doDelete(idx){
    var v = Game.villages[idx];
    var key = v.x + ',' + v.y;
    var pw = Math.max(60, Math.floor(population(v) * 1.5));
    Game.npc[key] = {
      name:'เมืองร้าง (' + v.name + ')',
      wall: cityLevel(v,'wall'), armoury:0, pop: population(v), cranny:500,
      troops:{ a0:Math.round(pw*0.5), a1:Math.round(pw*0.3),
               a2:Math.round(pw*0.15), a3:Math.max(1, Math.round(pw*0.05)) },
      res:{ wheat:Math.floor(v.res.wheat), wood:Math.floor(v.res.wood),
            iron:Math.floor(v.res.iron), clay:Math.floor(v.res.clay) },
      lastRes:now(), rate:80+pw, abandoned:true
    };
    for (var k in Game.oasis) if (Game.oasis[k] === v.id) delete Game.oasis[k];
    Game.movements = Game.movements.filter(function(m){ return m.from !== v.id; });
    Game.incoming  = Game.incoming.filter(function(m){ return m.target !== v.id; });
    Game.trades = (Game.trades || []).filter(function(t){
      return t.from !== v.id && t.to !== v.id; });
    Game.villages.splice(idx, 1);
    Game.player.slotsUsed = Math.max(1, Game.player.slotsUsed - 1);
    Game.active = 0;
    if (!Game.villages.length){
      save();
      alert('ไม่เหลือเมืองในเซิร์ฟเวอร์นี้แล้ว\nกำลังกลับหน้าหลัก...');
      hardWipe('index.html');
      return;
    }
    save(); close(); UI.refreshAll();
    if (typeof Renderer !== 'undefined') Renderer.invalidate();
    alert('ลบเมืองเรียบร้อย');
  }
  function confirmWipe(){
    box('<h3 style="color:#ff6b6b">💀 ออกจากเซิร์ฟเวอร์</h3>' +
      '<p style="font-size:11px;line-height:1.7">ข้อมูลทั้งหมดในเซิร์ฟเวอร์ ' +
      CFG.SERVER_NAME + ' จะถูกลบ<br><b style="color:#ff6b6b">กู้คืนไม่ได้</b></p>' +
      '<p style="font-size:11px;color:#a89468">พิมพ์ <b>ลบทั้งหมด</b> เพื่อยืนยัน:</p>' +
      '<input type="text" id="wc" class="selbox">' +
      '<button class="btn-del" id="wgo">ยืนยัน</button>' +
      '<button class="btn-cancel" onclick="Settings.open()">ย้อนกลับ</button>');
    document.getElementById('wgo').onclick = function(){
      if (document.getElementById('wc').value.trim() !== 'ลบทั้งหมด')
        return alert('ข้อความไม่ตรง');
      hardWipe('index.html');
    };
  }

  return { open:open, close:close, dev:devMenu };
})();