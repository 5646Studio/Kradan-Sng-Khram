/* ============================================================
   UI v13b — หน้าเมือง (ผังสี่เหลี่ยม) · กำแพง · หน้าต่างต่าง ๆ
   ============================================================ */
var UI = (function(){

  function fmt(n){
    n = Math.floor(n || 0);
    if (n >= 1000000) return (n/1000000).toFixed(2) + 'M';
    if (n >= 10000) return (n/1000).toFixed(1) + 'k';
    return n.toLocaleString('en-US');
  }
  function dur(s){
    s = Math.max(0, Math.round(s));
    if (s < 60) return s + ' วิ';
    var h = Math.floor(s/3600), m = Math.floor((s%3600)/60), d = Math.floor(h/24);
    if (d > 0) return d + ' วัน ' + (h%24) + ' ชม.';
    if (h > 0) return h + ':' + ('0'+m).slice(-2) + ' ชม.';
    return m + ':' + ('0'+(s%60)).slice(-2) + ' น.';
  }
  function modal(h){
    document.getElementById('modalbox').innerHTML = h;
    var m = document.getElementById('modal');
    m.classList.remove('hidden');
    m.style.pointerEvents = 'none';
    setTimeout(function(){ m.style.pointerEvents = 'auto'; }, 260);
  }
  function closeModal(){ document.getElementById('modal').classList.add('hidden'); }

    /* ---------- ผังเมืองทรงสี่เหลี่ยม : 1 + 8 + 12 = 21 ---------- */
  var CITY_POS = (function(){
    var out = [{ x:50, y:46 }];
    /* วงใน — กรอบ 3×3 */
    [[-1,-1],[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0]]
      .forEach(function(p){ out.push({ x: 50 + p[0]*15, y: 46 + p[1]*12.5 }); });
    /* วงนอก — กรอบ 5×3 (ชิดเข้ามาไม่ให้ชนกำแพง) */
    [[-2,-1],[-1,-1],[0,-1],[1,-1],[2,-1],
     [2,0],[2,1],[1,1],[0,1],[-1,1],[-2,1],[-2,0]]
      .forEach(function(p){ out.push({ x: 50 + p[0]*15.5, y: 46 + p[1]*25.5 }); });
    return out;
  })();

  function queueOf(v, kind, slot){
    for (var i = 0; i < v.queue.length; i++)
      if (v.queue[i].kind === kind && v.queue[i].slot === slot) return v.queue[i];
    return null;
  }
  function qIndex(v, kind, slot){
    for (var i = 0; i < v.queue.length; i++)
      if (v.queue[i].kind === kind && v.queue[i].slot === slot) return i;
    return -1;
  }


      /* ---------- หน้าเมือง ---------- */
  function renderVillage(){
    if (!Game.villages.length) return;
    var el = document.getElementById('scene-village');
    if (!el) return;
    var v = V(), t = World.tile(v.x, v.y);

    var bg = Assets.get('sc_city_' + t.info.key);
    el.style.backgroundImage = bg ? 'url(' + bg.src + ')' : '';
    if (!bg){
      el.style.background =
        'radial-gradient(ellipse at 50% 44%, rgba(214,192,140,.26), rgba(0,0,0,.42)), ' +
        'linear-gradient(170deg,' + BIOMES[t.biome].color + ',#2b2619)';
    }

    var wl = v.wallLv || 0, wq = queueOf(v, 'wall', 0);
    var rect = el.getBoundingClientRect();
    var bw = Math.max(120, rect.width * 0.94);
    var bh = Math.max(120, rect.height * 0.93);

    var h = '';
    /* ---- กำแพงเมือง (ภาพไม่รับคลิก กดได้เฉพาะป้าย) ---- */
    h += '<div id="wallbox" class="' + (wq ? 'building ' : '') +
      ((wl > 0 || wq) ? '' : 'none') + '">' +
      ((wl > 0 || wq)
        ? '<img src="' + Art.wallURL(wq ? wq.level : wl, bw, bh) + '" alt="">'
        : '') + '</div>';
        h += '<button id="walltag" class="wlv' + (wq ? ' building' : '') +
      (wl > 0 ? '' : ' none') + '">' + (wq ? wq.level : wl) + '</button>';

    /* ---- อาคาร 21 ช่อง ---- */
    v.city.forEach(function(c, i){
      if (i >= 21) return;
      var p = CITY_POS[i] || { x:50, y:46 };
      var q = queueOf(v, 'city', i);
      if (!c.b){
        h += '<div class="slot empty" style="left:' + p.x + '%;top:' + p.y +
          '%" data-c="' + i + '" title="ช่องว่าง ' + (i+1) +
          '"><span class="dot">➕</span></div>';
      } else {
        var b = BUILDINGS[c.b];
        h += '<div class="slot' + (q ? ' building' : '') + '" style="left:' + p.x +
          '%;top:' + p.y + '%" data-c="' + i + '" title="' + b.name +
          ' Lv.' + c.level + '">' +
          '<img src="' + Art.buildingURL(b.key, c.level, b.max) + '" alt="">' +
          '<span class="lv">' + (q ? q.level : c.level) + '</span></div>';
      }
    });

    el.innerHTML = h;
    el.querySelectorAll('[data-c]').forEach(function(n){
      n.onclick = function(e){ e.stopPropagation(); openCity(+n.dataset.c); };
    });
    var wt = document.getElementById('walltag');
    if (wt) wt.onclick = function(e){ e.stopPropagation(); openWall(); };
  }

  /* ---------- ส่วนประกอบหน้าต่าง ---------- */
  function costHtml(v, cost){
    var h = '<div class="cost">';
    RES.forEach(function(r){
      h += '<div' + (v.res[r] < cost[r] ? ' class="lack"' : '') + '>' +
        RES_IC[r] + ' ' + fmt(cost[r]) + '</div>';
    });
    return h + '</div>';
  }
  function queueBox(v, kind, slot){
    var idx = qIndex(v, kind, slot);
    if (idx < 0) return '';
    var q = v.queue[idx];
    var left = Math.max(0, (q.finish - now())/1000);
    var h = '<div class="eta" style="border-color:#ffcf40;color:#ffcf40">' +
      '🔨 กำลังก่อสร้าง → Lv.' + q.level + ' · ' +
      (q.active ? dur(left) : 'รอช่างว่าง') + '</div>';
    if (q.active)
      h += '<div class="rushrow">' +
        '<button class="btn-rush" data-rush="' + idx + '">⚡ เสร็จทันที <b>💰' +
        goldRush(left) + '</b></button>' +
        '<button class="btn-del2" data-cq2="' + idx + '">✕ ยกเลิก</button></div>';
    return h;
  }
  function bindQueueBox(v, after){
    document.querySelectorAll('[data-rush]').forEach(function(b){
      b.onclick = function(){
        var r = rushQueue(v, +b.dataset.rush);
        if (typeof r === 'string') return alert(r);
        save(); refreshAll();
        if (after) after(); else closeModal();
      };
    });
    document.querySelectorAll('[data-cq2]').forEach(function(b){
      b.onclick = function(){
        if (!confirm('ยกเลิกงานนี้?')) return;
        var r = cancelQueue(v, +b.dataset.cq2);
        if (typeof r === 'string') return alert(r);
        save(); refreshAll();
        alert('คืนทรัพยากร ' + r.pct + '%');
        if (after) after(); else closeModal();
      };
    });
  }
  function rushPair(okId, rushId, okLabel, sec){
    return '<div class="rushrow">' +
      '<button class="btn-ok" id="' + okId + '">' + okLabel + '</button>' +
      '<button class="btn-rush" id="' + rushId + '">⚡ ทันที <b>💰' +
      goldRush(sec) + '</b></button></div>';
  }

    function doEnqueue(v, kind, slot, lv, cost, sec, rush, pendingB){
    var g = goldRush(sec);
    if (rush && Game.player.gold < g){ alert('ทองไม่พอ (ต้องใช้ ' + g + ')'); return false; }
    var err = enqueue(v, kind, slot, lv, cost, pendingB);
    if (err){ alert(err); return false; }
    if (pendingB !== undefined) v.city[slot].b = pendingB;
    if (rush){
      var ix = qIndex(v, kind, slot);
      if (ix >= 0){
        var r = rushQueue(v, ix);
        if (typeof r === 'string') alert(r);
      }
    }
    closeModal(); refreshAll(); save();
    return true;
  }

  /* ---------- หลุมทรัพยากร ---------- */
  function openField(i){
    var v = V(); refresh(v);
    var f = v.fields[i], next = f.level + 1, can = next <= 20;
    var cost = can ? fieldCost(f.res, next) : null;
    var sec = can ? buildTime(next, cityLevel(v,'main')) : 0;
    var bb = biomeBonus(v, f.res);
    var ob = (typeof Conquest !== 'undefined') ? Conquest.oasisBonus(v, f.res) : 0;
    var mb = 0;
    BUILDINGS.forEach(function(b){ if (b.boost === f.res) mb += sumLevel(v, b.key)*0.05; });
    var cur = Math.floor(fieldProd(f.level) * (1+bb+ob) * (1+mb));
    var nxt = Math.floor(fieldProd(next) * (1+bb+ob) * (1+mb));
    var inQ = queueOf(v, 'field', i);

    var h = '<h3>' + RES_IC[f.res] + ' ' + RES_TH[f.res] + ' · หลุมที่ ' + (i+1) + '</h3>';
    h += '<div class="row"><span>ระดับ</span><b>' + f.level + ' / 20</b></div>';
    h += '<div class="row"><span>ผลผลิตตอนนี้</span><b>' + cur + ' /ชม.</b></div>';
    if (can) h += '<div class="row"><span>หลังอัปเกรด</span>' +
      '<b style="color:#8fbf5f">' + nxt + ' /ชม. (+' + (nxt-cur) + ')</b></div>';
    if (bb) h += '<div class="row"><span>ภูมิประเทศ</span><b>' +
      (bb>=0?'+':'') + Math.round(bb*100) + '%</b></div>';
    if (ob) h += '<div class="row"><span>โอเอซิส</span>' +
      '<b style="color:#4fd6a0">+' + Math.round(ob*100) + '%</b></div>';
    if (mb) h += '<div class="row"><span>อาคารเสริม</span>' +
      '<b style="color:#4db8ff">+' + Math.round(mb*100) + '%</b></div>';

    if (inQ) h += queueBox(v, 'field', i);
    else if (can){
      h += '<div class="row"><span>เพิ่มประชากร</span><b>+' + POP_TABLE[next] + '</b></div>';
      h += '<div class="row"><span>เวลาก่อสร้าง</span><b>' + dur(sec) + '</b></div>';
      h += costHtml(v, cost);
      h += rushPair('do', 'dorush', '⬆ อัปเกรด Lv.' + next, sec);
    } else h += '<p style="color:#ffcf40;margin:9px 0">ระดับสูงสุดแล้ว</p>';
    h += '<button class="btn-cancel" onclick="UI.close()">ปิด</button>';
    modal(h);
    bindQueueBox(v, function(){ openField(i); });

    if (can && !inQ){
      document.getElementById('do').onclick = function(){
        doEnqueue(v, 'field', i, next, cost, sec, false); };
      document.getElementById('dorush').onclick = function(){
        doEnqueue(v, 'field', i, next, cost, sec, true); };
    }
  }

  /* ---------- อาคาร ---------- */
  function openCity(i){
    var v = V(); refresh(v);
    var c = v.city[i];
    if (!c.b) return openPicker(i);

    var b = BUILDINGS[c.b], next = c.level + 1, can = next <= b.max;
    var cost = can ? buildCost(c.b, next) : null;
    var sec = can ? buildTime(next, cityLevel(v,'main')) : 0;
    var inQ = queueOf(v, 'city', i);
    var k = b.key;

    var h = '<h3>' + b.ic + ' ' + b.name + '</h3>';
    h += '<div class="infobox">' + b.desc + '</div>';
    if ((k === 'hero' || k === 'infirmary') && typeof Hero !== 'undefined'){
      var hp = Hero.healPanel(v);
      if (hp) h += hp;
    }
    h += '<div class="row"><span>ระดับ</span><b>' + c.level + ' / ' + b.max + '</b></div>';
    h += '<div class="row"><span>ผลตอนนี้</span><b style="color:#8fbf5f">' +
      (b.eff ? b.eff(c.level) : '—') + '</b></div>';
    if (can) h += '<div class="row"><span>หลังอัปเกรด</span>' +
      '<b style="color:#ffcf40">' + (b.eff ? b.eff(next) : '—') + '</b></div>';
    h += '<div class="row"><span>Culture Points</span><b>' +
      Math.floor((b.cp||0) * Math.pow(1.18, Math.max(0, c.level-1))) + ' /วัน</b></div>';
    if ((b.dup||1) > 1)
      h += '<div class="row"><span>สร้างแล้ว</span><b>' + countBuilding(v, b.key) +
        ' / ' + (b.dup >= 99 ? '∞' : b.dup) + '</b></div>';

    var use = '';
    if (k==='barracks'||k==='stable'||k==='workshop'||
        k==='greatbarracks'||k==='greatstable'||k==='residence'||k==='palace')
      use = '<button class="btn-use" id="use">⚔ เปิดหน้าฝึก</button>';
    else if (k==='rally')
      use = '<button class="btn-use" id="use">⚔ ส่งกองทัพ</button>' +
            '<button class="btn-use2" id="use2">🛡 รายการทหาร</button>';

    else if (k==='market')
      use = '<button class="btn-use" id="use">🏪 เปิดตลาด</button>';
    else if (k==='hero')
      use = '<button class="btn-use" id="use">🗿 วีรบุรุษ</button>' +
            '<button class="btn-use2" id="use2">🕳️ ดันเจี้ยน</button>';
    else if (k==='infirmary')
      use = '<button class="btn-use" id="use">🗿 ดูวีรบุรุษ</button>';
    else if (k==='embassy')
      use = '<button class="btn-use" id="use">🏯 ระบบกิลด์</button>';
    else if (k==='temple')
      use = '<button class="btn-use" id="use">👑 ศึกชิงเมืองหลวง</button>';

    if (inQ){ h += queueBox(v, 'city', i); h += use; }
    else if (can){
      h += '<div class="row"><span>เพิ่มประชากร</span><b>+' +
        (popOf(next) - popOf(c.level)) + '</b></div>';
      h += '<div class="row"><span>เวลาก่อสร้าง</span><b>' + dur(sec) + '</b></div>';
      h += costHtml(v, cost);
      h += use;
      h += rushPair('up', 'uprush', '⬆ อัปเกรด Lv.' + next, sec);
    } else h += '<p style="color:#ffcf40;margin:9px 0">ระดับสูงสุดแล้ว</p>' + use;

    h += '<button class="btn-cancel" onclick="UI.close()">ปิด</button>';
    modal(h);
    bindQueueBox(v, function(){ openCity(i); });
    if (typeof Hero !== 'undefined') Hero.bindHeal(v, function(){ openCity(i); });

    var ub = document.getElementById('use');
    if (ub) ub.onclick = function(){
      if (k==='barracks'||k==='stable'||k==='workshop'||
          k==='greatbarracks'||k==='greatstable'||k==='residence'||k==='palace')
        MilUI.openTrain(k);
      else if (k==='rally')   MilUI.openRally();
      else if (k==='market')  Market.open();
      else if (k==='hero' || k==='infirmary') Hero.open();
      else if (k==='embassy') Guild.open();
      else Conquest.openEndgame();
    };
    var ub2 = document.getElementById('use2');
    if (ub2) ub2.onclick = function(){
      if (k==='rally'){
        if (typeof Station !== 'undefined') Station.open();
        else Schedule.open();
      } else if (k==='hero') Dungeon.open();
    };

    var upb = document.getElementById('up');
    if (upb) upb.onclick = function(){
      doEnqueue(v, 'city', i, next, cost, sec, false); };
    var upr = document.getElementById('uprush');
    if (upr) upr.onclick = function(){
      doEnqueue(v, 'city', i, next, cost, sec, true); };
  }

  /* ---------- เลือกอาคาร ---------- */
  var pickCat = 'build';
  function openPicker(slot){
    var v = V(); refresh(v);
    var h = '<h3>เลือกอาคาร (ช่อง ' + (slot+1) + ')</h3><div class="btabs">';
    CATS.forEach(function(c){
      h += '<button class="btab' + (c.k === pickCat ? ' on' : '') +
        '" data-cat="' + c.k + '">' + c.n + '</button>';
    });
    h += '</div><div id="blist"></div>' +
      '<button class="btn-cancel" onclick="UI.close()">ปิด</button>';
    modal(h);
    document.querySelectorAll('[data-cat]').forEach(function(b){
      b.onclick = function(){ pickCat = b.dataset.cat; openPicker(slot); };
    });
    renderPickList(v, slot);
  }
  function renderPickList(v, slot){
    var open = '', locked = '';
    BUILDINGS.forEach(function(b, bi){
      if (bi === 0 || b.cat !== pickCat) return;
      if (b.key === 'main' || b.key === 'rally' || b.cat === 'wall') return;
      if (reqHidden(v, bi)) return;
      var cost = buildCost(bi, 1);
      var why = reqCheck(v, bi);
      var dupTag = (b.dup||1) > 1
        ? '<span class="duptag">' + countBuilding(v, b.key) + '/' +
          (b.dup >= 99 ? '∞' : b.dup) + '</span>' : '';
      var card = '<div class="bcard' + (why ? ' lockcard' : '') + '"' +
        (why ? '' : ' data-pick="' + bi + '"') + '>' +
        '<div class="bc-h"><b>' + b.ic + ' ' + b.name + dupTag + '</b>' +
        '<span style="font-size:10px;color:#8a7a55">สูงสุด ' + b.max + '</span></div>' +
        '<div class="bc-d">' + b.desc + '</div>' +
        '<div class="bc-e">▸ Lv.1: ' + (b.eff ? b.eff(1) : '—') +
        (b.cp ? ' · CP ' + b.cp + '/วัน' : '') + '</div>' +
        (why ? '<div class="bc-lock">🔒 ' + why + '</div>'
             : '<div class="bc-req">เงื่อนไข: ' + reqText(bi) + '</div>') +
        '<div class="bc-c">' + RES.map(function(r){
          return '<span' + (v.res[r] < cost[r] ? ' class="lack"' : '') + '>' +
            RES_IC[r] + fmt(cost[r]) + '</span>'; }).join('') +
        '<span>⏱' + dur(buildTime(1, cityLevel(v,'main'))) + '</span></div></div>';
      if (why) locked += card; else open += card;
    });
    var out = open + locked;
    if (!out) out = '<p style="color:#8a7a55;padding:16px;text-align:center;' +
      'font-size:12px">สร้างครบทุกอาคารในหมวดนี้แล้ว 🎉</p>';
    document.getElementById('blist').innerHTML = out;
    document.querySelectorAll('[data-pick]').forEach(function(n){
      n.onclick = function(){
        var bi = +n.dataset.pick;
        confirmBuild(V(), slot, bi, buildCost(bi, 1),
          buildTime(1, cityLevel(V(),'main')));
      };
    });
  }
  function confirmBuild(v, slot, bi, cost, sec){
    var b = BUILDINGS[bi];
    var why = reqCheck(v, bi);
    var h = '<h3>ยืนยันการก่อสร้าง</h3>';
    h += '<div class="infobox"><b>' + b.ic + ' ' + b.name + '</b> → ระดับ 1<br>' +
      b.desc + '<br>▸ ผลที่ได้: <b>' + (b.eff ? b.eff(1) : '—') + '</b></div>';
    if (why) h += '<div class="bc-lock" style="margin:8px 0">🔒 ' + why + '</div>';
    h += '<div class="row"><span>เวลาก่อสร้าง</span><b>' + dur(sec) + '</b></div>';
    h += '<div class="row"><span>คิว</span><b>' + v.queue.length + ' / ' +
      queueMax() + '</b></div>';
    h += costHtml(v, cost);
    var afford = canAfford(v, cost) && !why;
    if (afford) h += rushPair('cyes', 'cyes2', '✔ ยืนยันสร้าง', sec);
    else h += '<button class="btn-ok" disabled>' +
      (why ? 'ยังไม่ผ่านเงื่อนไข' : 'ทรัพยากรไม่พอ') + '</button>';
    h += '<button class="btn-cancel" onclick="UI.close()">ยกเลิก</button>';
    modal(h);
    if (!afford) return;
    document.getElementById('cyes').onclick = function(){
      doEnqueue(v, 'city', slot, 1, cost, sec, false, bi); };
    document.getElementById('cyes2').onclick = function(){
      doEnqueue(v, 'city', slot, 1, cost, sec, true, bi); };
  }

  /* ---------- กำแพง ---------- */
  function openWall(){
    var v = V(); refresh(v);
    var wl = v.wallLv || 0, next = wl + 1;
    var bi = bIndex('wall'), b = BUILDINGS[bi];
    var can = next <= b.max;
    var cost = can ? buildCost(bi, next) : null;
    var sec = can ? buildTime(next, cityLevel(v,'main')) : 0;
    var inQ = queueOf(v, 'wall', 0);

    var h = '<h3>🧱 กำแพงเมือง</h3>';
    h += '<div class="infobox">' + b.desc + '</div>';
    h += '<div class="row"><span>ระดับ</span><b>' + wl + ' / ' + b.max + '</b></div>';
    h += '<div class="row"><span>ผลตอนนี้</span><b style="color:#8fbf5f">' +
      b.eff(wl) + '</b></div>';
    if (can) h += '<div class="row"><span>หลังอัปเกรด</span>' +
      '<b style="color:#ffcf40">' + b.eff(next) + '</b></div>';
    if (inQ) h += queueBox(v, 'wall', 0);
    else if (can){
      h += '<div class="row"><span>เพิ่มประชากร</span><b>+' +
        (popOf(next)-popOf(wl)) + '</b></div>';
      h += '<div class="row"><span>เวลาก่อสร้าง</span><b>' + dur(sec) + '</b></div>';
      h += costHtml(v, cost);
      h += rushPair('wup', 'wrush',
        wl ? '⬆ อัปเกรด Lv.' + next : '🧱 สร้างกำแพง', sec);
    } else h += '<p style="color:#ffcf40;margin:9px 0">ระดับสูงสุดแล้ว</p>';
    h += '<button class="btn-cancel" onclick="UI.close()">ปิด</button>';
    modal(h);
    bindQueueBox(v, openWall);
    if (can && !inQ){
      document.getElementById('wup').onclick = function(){
        doEnqueue(v, 'wall', 0, next, cost, sec, false); };
      document.getElementById('wrush').onclick = function(){
        doEnqueue(v, 'wall', 0, next, cost, sec, true); };
    }
  }

  /* ---------- รายการเมือง ---------- */
  function openVillages(){
    var h = '<h3>🏘 เมืองของข้าพเจ้า</h3>';
    if (isProtected())
      h += '<div class="protbar">🕊️ <b>คุ้มครองผู้เล่นใหม่</b><br>เหลือ ' +
        dur((Game.protectUntil - now())/1000) + '</div>';
    else if (Game.protectBroken)
      h += '<div class="protbar" style="background:#2a1a16;border-color:#7a4a2e;' +
        'color:#ffb08a">⚔️ <b>ออกจากการคุ้มครองแล้ว</b></div>';

    var tp = 0, tt = 0;
    Game.villages.forEach(function(g){
      tp += population(g); tt += Combat.count(g.troops);
    });
    h += '<div class="row"><span>รวม</span><b>' + Game.villages.length +
      ' เมือง · ปชก. ' + fmt(tp) + ' · ทหาร ' + fmt(tt) + '</b></div>';
    var need = cpForVillage(Game.villages.length + 1);
    h += '<div class="row"><span>CP เมืองถัดไป</span><b style="color:' +
      (Game.player.cp >= need ? '#8fbf5f' : '#a89468') + '">' +
      fmt(Math.floor(Game.player.cp)) + ' / ' + fmt(need) + '</b></div>';

    Game.villages.forEach(function(g, i){
      refresh(g);
      var nw = netWheat(g);
      var wl = cityLevel(g,'watchtower');
      var inc = (Game.incoming||[]).filter(function(m){
        return m.target === g.id && wl > 0 &&
          (m.arriveAt - now()) <= (5 + wl*5)*60000; }).length;
      var loy = Math.round(g.loyalty || 100);
      var hh = Hero.get(g);
      h += '<div class="vcard' + (i === Game.active ? ' cur' : '') +
        (isCapital(g) ? ' cap' : '') + '" data-v="' + i + '">' +
        '<div class="vh"><b>' + (isCapital(g) ? '👑 ' : '') +
        (i === Game.active ? '▸ ' : '') + g.name + '</b>' +
        '<span>(' + g.x + '|' + g.y + ')</span></div>' +
        '<div class="vm"><i>👥 ' + population(g) + '</i>' +
        '<i>🛡 ' + fmt(Combat.count(g.troops)) + '</i>' +
        '<i class="' + (nw < 0 ? 'vwarn' : '') + '">🌾 ' + (nw>=0?'+':'') + nw + '</i>' +
        '<i>🧱 ' + (g.wallLv||0) + '</i>' +
        '<i>' + (hh.dead ? '💀' : '🗿') + ' ' + hh.level + '</i>' +
        (g.queue.length ? '<i>🔨 ' + g.queue.length + '</i>' : '') +
        (inc ? '<i class="vwarn">⚠️ ' + inc + '</i>' : '') + '</div>' +
        (loy < 100 ? '<div class="vloy' + (loy < 40 ? ' low' : '') +
          '"><i style="width:' + loy + '%"></i></div>' : '') + '</div>';
    });
    h += '<button class="btn-cancel" onclick="UI.close()">ปิด</button>';
    modal(h);
    document.querySelectorAll('[data-v]').forEach(function(n){
      n.onclick = function(){
        Game.active = +n.dataset.v;
        closeModal(); refreshAll();
        Renderer.center(V().x, V().y);
        showPage('village'); save();
      };
    });
  }

  /* ---------- แถบบน ---------- */
  function renderTop(){
    if (!Game.villages.length) return;
    var v = V(), c = caps(v);
    document.querySelectorAll('[data-res]').forEach(function(box){
      var r = box.dataset.res;
      var rate = (r === 'wheat') ? netWheat(v) : production(v, r);
      var cap = (r === 'wheat') ? c.gran : c.store;
      box.querySelector('span').textContent = fmt(v.res[r]);
      var i = box.querySelector('i');
      if (i){
        i.textContent = (rate >= 0 ? '+' : '') + rate;
        i.style.color = rate < 0 ? '#ff6b6b' : '#6fa85a';
      }
      box.querySelector('span').style.color =
        v.res[r] >= cap*0.95 ? '#ff6b6b' : '#f0e6cc';
    });
    document.getElementById('r-gold').textContent = Math.floor(Game.player.gold);
    document.getElementById('r-pop').textContent = population(v);
    var vb = document.getElementById('vilbtn');
    if (vb) vb.textContent = Game.villages.length > 1
      ? '🏘' + Game.villages.length : '🏘';

    var lb = document.getElementById('loybar');
    if (lb){
      loyaltyTick(v);
      var loy = Math.round(v.loyalty === undefined ? 100 : v.loyalty);
      if (loy >= 100){
        lb.classList.add('hidden');
        document.body.classList.remove('hasloy');
      } else {
        lb.classList.remove('hidden');
        document.body.classList.add('hasloy');
        lb.className = 'loybar' + (loy < 35 ? ' crit' : loy < 70 ? ' warn' : '');
        lb.innerHTML = '<span>🏳️ ภักดี</span><div class="lfill">' +
          '<i style="width:' + loy + '%"></i></div><b>' + loy + '%</b>' +
          '<i class="lrate">+' + loyaltyRate(v).toFixed(1) + '/ชม.</i>';
      }
    }
  }

  /* ---------- รายละเอียดทรัพยากร ---------- */
  function openResDetail(r){
    var v = V(); refresh(v);
    var bb = biomeBonus(v, r);
    var ob = (typeof Conquest !== 'undefined') ? Conquest.oasisBonus(v, r) : 0;
    var mb = 0;
    BUILDINGS.forEach(function(b){ if (b.boost === r) mb += sumLevel(v, b.key)*0.05; });
    var c = caps(v), cap = (r === 'wheat') ? c.gran : c.store;
    var pits = v.fields.filter(function(f){ return f.res === r; });
    var base = 0;
    pits.forEach(function(f){ base += fieldProd(f.level); });

    var h = '<h3>' + RES_IC[r] + ' ' + RES_TH[r] + '</h3>';
    h += '<div class="row"><span>มีอยู่</span><b>' + fmt(v.res[r]) + ' / ' +
      fmt(cap) + '</b></div>';
    h += '<div class="row"><span>จำนวนหลุม</span><b>' + pits.length + '</b></div>';
    h += '<div class="row"><span>ผลผลิตพื้นฐาน</span><b>' + base + ' /ชม.</b></div>';
    if (bb) h += '<div class="row"><span>ภูมิประเทศ</span><b>' +
      (bb>=0?'+':'') + Math.round(bb*100) + '%</b></div>';
    h += '<div class="row"><span>โอเอซิส</span><b style="color:#4fd6a0">+' +
      Math.round(ob*100) + '%</b></div>';
    h += '<div class="row"><span>อาคารเสริม</span><b style="color:#4db8ff">+' +
      Math.round(mb*100) + '%</b></div>';
    var hb = Hero.prodBonus(v);
    if (hb) h += '<div class="row"><span>วีรบุรุษ</span>' +
      '<b style="color:#ffcf40">+' + hb + '/ชม.</b></div>';
    h += '<div class="row"><span>รวม</span><b style="color:#8fbf5f">' +
      production(v, r) + ' /ชม.</b></div>';
    if (r === 'wheat'){
      h += '<div class="row"><span>ประชากรกิน</span>' +
        '<b style="color:#ff9a5a">−' + population(v) + '</b></div>';
      h += '<div class="row"><span>กองทัพกิน</span>' +
        '<b style="color:#ff9a5a">−' + Military.upkeep(v) + '</b></div>';
      h += '<div class="row"><span>คงเหลือ</span><b style="color:' +
        (netWheat(v) < 0 ? '#ff6b6b' : '#8fbf5f') + '">' + netWheat(v) + '</b></div>';
    }
    h += '<button class="btn-cancel" onclick="UI.close()">ปิด</button>';
    modal(h);
  }

  /* ---------- ทอง ---------- */
  function openGold(){
    var v = V();
    var act = v.queue.filter(function(q){ return q.active; });
    var h = '<h3>💰 ทองคำ — ' + Math.floor(Game.player.gold) + '</h3>';
    h += '<div class="infobox">ทองใช้เร่งก่อสร้างและซื้อสิทธิพิเศษ</div>';
    h += '<div class="row" style="cursor:pointer" id="g1"><span>⚡ เร่งงานทั้งหมด' +
      '<br><i style="font-size:10px;color:#8a7a55">' + act.length +
      ' งาน</i></span><b style="color:#ffcf40">10 ทอง</b></div>';
    h += '<div class="row" style="cursor:pointer" id="g2"><span>📦 เติมทรัพยากร' +
      '<br><i style="font-size:10px;color:#8a7a55">+1,000 ทุกชนิด</i></span>' +
      '<b style="color:#ffcf40">15 ทอง</b></div>';
    if (builderCount() >= 3)
      h += '<div class="row" style="opacity:.6"><span>🔨 ช่างคนที่ 3</span>' +
        '<b style="color:#8fbf5f">✔ ' + dur((Game.builderUntil-now())/1000) + '</b></div>';
    else
      h += '<div class="row" style="cursor:pointer" id="g3"><span>🔨 จ้างช่างคนที่ 3' +
        '<br><i style="font-size:10px;color:#8a7a55">24 ชม.</i></span>' +
        '<b style="color:#ffcf40">25 ทอง</b></div>';
    if (typeof Schedule !== 'undefined'){
      if (Schedule.active())
        h += '<div class="row" style="opacity:.6"><span>⏰ แผนการรบ</span>' +
          '<b style="color:#8fbf5f">✔</b></div>';
      else
        h += '<div class="row" style="cursor:pointer" id="g4"><span>⏰ แผนการรบ' +
          '<br><i style="font-size:10px;color:#8a7a55">' + CFG.SCHED_DAYS +
          ' วัน</i></span><b style="color:#ffcf40">' + CFG.SCHED_GOLD +
          ' ทอง</b></div>';
    }
    h += '<button class="btn-cancel" onclick="UI.close()">ปิด</button>';
    modal(h);
    document.getElementById('g1').onclick = function(){
      if (Game.player.gold < 10) return alert('ทองไม่พอ');
      if (!act.length) return alert('ไม่มีงานที่กำลังก่อสร้าง');
      Game.player.gold -= 10;
      act.forEach(function(q){ q.finish = now(); });
      closeModal(); refreshAll(); save();
    };
    document.getElementById('g2').onclick = function(){
      if (Game.player.gold < 15) return alert('ทองไม่พอ');
      Game.player.gold -= 15; refresh(v);
      var c = caps(v);
      RES.forEach(function(r){
        var cap = (r === 'wheat') ? c.gran : c.store;
        v.res[r] = Math.min(cap, v.res[r] + 1000);
      });
      closeModal(); refreshAll(); save();
    };
    var g3 = document.getElementById('g3');
    if (g3) g3.onclick = function(){
      if (Game.player.gold < 25) return alert('ทองไม่พอ');
      Game.player.gold -= 25; Game.builders = 3;
      Game.builderUntil = now() + 86400000;
      closeModal(); refreshAll(); save();
    };
    var g4 = document.getElementById('g4');
    if (g4) g4.onclick = function(){
      var e = Schedule.buy();
      if (e) return alert(e);
      closeModal(); refreshAll(); save();
    };
  }

  /* ---------- คิวก่อสร้าง ---------- */
  function renderQueue(){}
  function nameOfQ(v, q){
    return q.kind === 'field' ? RES_TH[v.fields[q.slot].res] + ' ' + (q.slot+1)
      : q.kind === 'wall' ? 'กำแพงเมือง'
      : BUILDINGS[q.pendingB !== undefined ? q.pendingB : v.city[q.slot].b].name;
  }
  function openQueue(){
    var v = V();
    var h = '<h3>🔨 คิวก่อสร้าง</h3>';
    h += '<div class="infobox">ช่าง <b>' + builderCount() + ' คน</b> · รอได้อีก 2</div>';
    if (!v.queue.length) h += '<p style="color:#8a7a55;padding:12px;' +
      'text-align:center;font-size:12px">ไม่มีงานก่อสร้าง</p>';
    v.queue.forEach(function(q, i){
      var left = Math.max(0, (q.finish-now())/1000);
      var pct = 100;
      if (q.active){
        var prog = Math.max(0, Math.min(1, (now()-q.start)/1000/q.sec));
        pct = Math.max(20, Math.round((1-prog)*100));
      }
      h += '<div class="qrow"><div class="qinfo">' +
        '<b>' + (q.active ? '🔨' : '⏳') + ' ' + nameOfQ(v, q) + ' → Lv.' +
        q.level + '</b><i>' + (q.active ? dur(left) : 'รอช่างว่าง') + '</i>' +
        (q.active ? '<button class="btn-rush mini3" data-rush="' + i +
          '">⚡ 💰' + goldRush(left) + '</button>' : '') +
        '</div><button class="qcancel" data-cq="' + i + '">✕<span>คืน ' +
        pct + '%</span></button></div>';
    });
    h += '<button class="btn-cancel" onclick="UI.close()">ปิด</button>';
    modal(h);
    document.querySelectorAll('[data-rush]').forEach(function(b){
      b.onclick = function(){
        var r = rushQueue(v, +b.dataset.rush);
        if (typeof r === 'string') return alert(r);
        save(); refreshAll(); openQueue();
      };
    });
    document.querySelectorAll('[data-cq]').forEach(function(b){
      b.onclick = function(){
        var i = +b.dataset.cq, q = v.queue[i];
        if (!q || !confirm('ยกเลิก "' + nameOfQ(v, q) + '" ?')) return;
        var r = cancelQueue(v, i);
        if (typeof r === 'string') return alert(r);
        save(); refreshAll(); openQueue();
      };
    });
  }

  /* ---------- รีเฟรช ---------- */
  function refreshAll(){
    try {
      renderTop();
      renderVillage();
      if (typeof FieldView !== 'undefined' && FieldView.render) FieldView.render();
      if (typeof Quest !== 'undefined') Quest.updateBadge();
      if (typeof HUD !== 'undefined') HUD.update();
      if (typeof Renderer !== 'undefined') Renderer.invalidate();
    } catch(e){ logErr('refreshAll', e); }
  }
  function showPage(name){
    document.querySelectorAll('.page').forEach(function(p){
      p.classList.toggle('active', p.id === 'page-' + name);
    });
    document.querySelectorAll('#navbar button').forEach(function(b){
      b.classList.toggle('active', b.dataset.page === name);
    });
    var split = (name === 'village' || name === 'fields');
    document.body.classList.toggle('split', split);
    document.body.classList.toggle('onworld', name === 'world');
    if (name === 'world'){ Renderer.resize(); Renderer.invalidate(); }
    if (name === 'village') setTimeout(renderVillage, 40);
    if (name === 'fields')  setTimeout(function(){ FieldView.render(); }, 40);
    if (name === 'reports') MilUI.renderReports();
    if (typeof HUD !== 'undefined') HUD.update();
  }

  return { refreshAll:refreshAll, renderTop:renderTop, renderQueue:renderQueue,
    renderVillage:renderVillage, showPage:showPage, close:closeModal,
    fmt:fmt, dur:dur, modal:modal, costHtml:costHtml, nameOfQ:nameOfQ,
    openField:openField, openCity:openCity, openVillages:openVillages,
    openWall:openWall, openResDetail:openResDetail, openGold:openGold,
    openQueue:openQueue };
})();