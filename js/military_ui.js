var MilUI = (function(){
  function box(h){ UI.modal(h); }
  function close(){ document.getElementById('modal').classList.add('hidden'); }

  /* ============ ฝึกทหาร ============ */
  function openTrain(bkey){
    var v = V(); refresh(v);
    var isGreat = (bkey === 'greatbarracks' || bkey === 'greatstable');
    var cls = bkey === 'greatbarracks' ? 'inf' : bkey === 'greatstable' ? 'cav' : null;
    var list = isGreat
      ? myUnits().filter(function(u){ return u.cls === cls; })
      : myUnits().filter(function(u){ return u.b === bkey; });
    var lv = cityLevel(v, bkey);
    var B = BUILDINGS[bIndex(bkey)];

    var h = '<h3>' + B.ic + ' ' + B.name + ' (Lv.' + lv + ')</h3>';
    h += '<div class="infobox">' + B.desc + '<br>▸ ' + B.eff(lv) + '</div>';
    if (isGreat) h += '<div class="bc-lock" style="margin:6px 0">' +
      '⚠ ต้นทุนต่อนาย 3 เท่า แต่ฝึกพร้อมกับค่ายปกติได้</div>';

    if (bkey === 'residence'){
      var cap = settlerSlots(lv), used = v.settlersUsed || 0;
      h += '<div class="infobox" style="border-color:#5a7a2e">' +
        '📖 <b>วิธีตั้งเมืองใหม่</b><br>' +
        '1. ฝึกผู้ตั้งถิ่นฐาน <b>3 นาย</b><br>' +
        '2. แผนที่ → หาช่องว่าง (ขึ้นว่า "ตั้งเมืองได้")<br>' +
        '3. ลานรวมพล → ภารกิจ <b>ตั้งเมือง</b> → ส่ง 3 นาย<br>' +
        '<b style="color:#ffcf40">ผู้ตั้งถิ่นฐานใช้แล้วหมดถาวร</b> — ' +
        'ต้องอัปคฤหาสน์ขึ้นช่วงถัดไปจึงฝึกใหม่ได้<br>' +
        'คฤหาสน์ Lv.' + lv + ' → โควตา <b>' + cap + '</b> · ใช้ไปแล้ว <b>' +
        used + '</b> · เหลือ <b style="color:#8fbf5f">' +
        Math.max(0, cap - used) + '</b></div>';
      h += '<div class="stepbar">';
      [ [1,5], [6,10], [11,15], [16,20] ].forEach(function(r, i){
        var on = lv >= r[0];
        var spent = used > i*3;
        h += '<div class="step' + (on ? ' on' : '') + (spent ? ' used' : '') + '">' +
          'Lv.' + r[0] + '-' + r[1] + '<b>' + (spent ? 'ใช้แล้ว' : on ? '3 นาย' : '🔒') +
          '</b></div>';
      });
      h += '</div>';
    }
    if (bkey === 'palace'){
      var cs = chiefSlots(lv);
      h += '<div class="infobox" style="border-color:#6b552f">' +
        '👑 <b>วิธียึดเมืองศัตรู</b><br>' +
        'ส่งขุนพลไปกับกองทัพโจมตี ชนะแล้วความภักดีศัตรูจะลด<br>' +
        '1 นาย −25% · 2 นาย −58% · 3 นาย −98% · 4 นาย −150%<br>' +
        'ภักดีถึง 0% = <b>ยึดได้</b> · เสียขุนพลเพียง <b>1 นาย</b> ที่เหลือกลับบ้าน<br>' +
        'พระราชวัง Lv.' + lv + ' → ขุนพลได้ <b>' + cs + ' นาย</b>' +
        (cs === 0 ? ' <span style="color:#ff9a5a">(ต้องถึง Lv.5)</span>' : '') +
        '<br><i style="color:#a89468">ขุนพลฝึกแล้วใช้ยึดได้เรื่อย ๆ ไม่จำกัดเมือง</i>' +
        '</div>';
    }

    if (!list.length)
      h += '<p style="color:#a89468;font-size:12px;text-align:center;padding:12px">' +
        'ไม่มีหน่วยที่ฝึกได้ในอาคารนี้</p>';

    list.forEach(function(u){
      var mul = isGreat ? 3 : 1;
      var sec = Military.trainTime(u.id, v, bkey) || u.t;
      var cp = Military.specialCap(v, u);
      var have = cp < 99999 ? Military.specialHave(v, u) : 0;
      var room = cp < 99999 ? Math.max(0, cp - have) : 9999;
      var maxN = room;
      RES.forEach(function(r){
        var c = u.cost[r]*mul;
        if (c > 0) maxN = Math.min(maxN, Math.floor(v.res[r]/c));
      });
      maxN = Math.max(0, maxN);

      h += '<div class="ucard"><div class="uhead"><b>' + u.name +
        (cp < 99999 ? ' <span class="duptag">เหลือ ' + room + '</span>' : '') +
        '</b><span class="ustat">⚔' + u.atk + ' 🛡' + u.di + '/' + u.dc +
        ' 🐾' + u.spd + ' 📦' + u.cap + ' 🌾' + u.up + '</span></div>' +
        '<div class="ucost">' + RES.map(function(r){
          var c = u.cost[r]*mul;
          return '<span' + (v.res[r] < c ? ' class="lack"' : '') + '>' +
            RES_IC[r] + UI.fmt(c) + '</span>'; }).join('') +
        '<span>⏱' + UI.dur(sec) + '/นาย</span></div>';
      if (room <= 0){
        h += '<div class="bc-lock">🔒 ' +
          (u.cls === 'settler' ? 'ใช้โควตาหมดแล้ว · อัปคฤหาสน์เป็น Lv.' +
            (Math.floor((v.settlersUsed||0)/3)*5 + 1) + ' เพื่อฝึกเพิ่ม'
           : 'ครบจำนวนสูงสุด · อัป' + B.name + 'เพื่อเพิ่ม') + '</div>';
      } else {
        h += '<div class="urow"><input type="number" min="1" value="' +
          (u.cls === 'settler' ? Math.min(3, room) : 1) + '" id="q_' + u.id + '">' +
          '<button class="mini" data-max="' + u.id + '" data-n="' + maxN +
          '">สูงสุด ' + maxN + '</button>' +
          '<button class="btn-ok mini2" data-tr="' + u.id + '">ฝึก</button></div>';
      }
      h += '</div>';
    });

    var q = (v.train && v.train[bkey]) || [];
    if (q.length){
      h += '<h4>คิวฝึก</h4>';
      q.forEach(function(j, i){
        var un = U(j.unit);
        h += '<div class="trow"><div class="tinfo">' +
          '<b>' + un.name + ' ×' + j.left +
          (j.total > j.left ? ' <i style="color:#8fbf5f">(เสร็จ ' +
            (j.total-j.left) + ')</i>' : '') + '</b>' +
          '<i>' + (i === 0 ? 'นายถัดไปใน ' + UI.dur((j.nextAt-now())/1000) : 'รอคิว') +
          ' · ครบใน ' + UI.dur((j.endAt-now())/1000) + '</i></div>' +
          '<button class="tcancel" data-ct="' + i + '">✕</button></div>';
      });
    }
    h += '<button class="btn-cancel" onclick="MilUI.close()">ปิด</button>';
    box(h);

    document.querySelectorAll('[data-max]').forEach(function(b){
      b.onclick = function(){
        document.getElementById('q_' + b.dataset.max).value = b.dataset.n;
      };
    });
    document.querySelectorAll('[data-tr]').forEach(function(b){
      b.onclick = function(){
        var n = parseInt(document.getElementById('q_' + b.dataset.tr).value, 10);
        if (!n || n < 1) return;
        var e = Military.enqueueTrain(v, b.dataset.tr, n, bkey);
        if (e) return alert(e);
        save(); UI.refreshAll(); openTrain(bkey);
      };
    });
    document.querySelectorAll('[data-ct]').forEach(function(b){
      b.onclick = function(){
        var i = +b.dataset.ct, job = v.train[bkey][i];
        if (!job) return;
        if (!confirm('ยกเลิกการฝึก ' + U(job.unit).name + ' ×' + job.left + ' ?')) return;
        var r = Military.cancelTrain(v, bkey, i);
        if (typeof r === 'string') return alert(r);
        save(); UI.refreshAll();
        alert('คืนทรัพยากร\n' + RES.map(function(x){
          return RES_IC[x] + UI.fmt(r.back[x]); }).join(' '));
        openTrain(bkey);
      };
    });
  }

  /* ============ ลานรวมพล — แบบ Travian ============ */
  var rallyTab = 'send';

  function openRally(px, py, tab){
    if (tab) rallyTab = tab;
    var v = V(); refresh(v);
    var rl = cityLevel(v, 'rally');
    var h = '<h3>⚔️ ลานรวมพล ระดับ ' + rl + '</h3>';
    h += '<div class="btabs">' +
      '<button class="btab' + (rallyTab==='send'?' on':'') + '" data-rt="send">ส่งกำลังทหาร</button>' +
      '<button class="btab' + (rallyTab==='over'?' on':'') + '" data-rt="over">ภาพรวม</button>' +
      '<button class="btab' + (rallyTab==='troop'?' on':'') + '" data-rt="troop">กองกำลัง</button>' +
      '</div><div id="rbody"></div>' +
      '<button class="btn-cancel" onclick="MilUI.close()">ปิด</button>';
    box(h);
    document.querySelectorAll('[data-rt]').forEach(function(b){
      b.onclick = function(){ rallyTab = b.dataset.rt; openRally(px, py); };
    });
    if (rallyTab === 'send') rallySend(v, px, py);
    else if (rallyTab === 'over') rallyOver(v);
    else rallyTroop(v);
  }

  function rallySend(v, px, py){
    var units = myUnits();
    var rl = cityLevel(v, 'rally');
    var slots = rallySlots(rl);
    var used = Military.outgoingCount(v);
    var hero = Hero.get(v);

    var o = '<div class="rbar"><span>ขบวน <b style="color:' +
      (used>=slots?'#ff6b6b':'#8fbf5f') + '">' + used + '/' + slots + '</b></span>' +
      '<span>ทหารรวม <b>' + UI.fmt(Combat.count(v.troops)) + '</b></span></div>';

    /* ★ ตารางหน่วยแบบ Travian ★ */
    o += '<div class="tgrid2">';
    units.forEach(function(u){
      var have = v.troops[u.id] || 0;
      o += '<div class="tcell' + (have ? '' : ' zero') + '">' +
        '<span class="tic" title="' + u.name + '">' + unitIcon(u) + '</span>' +
        '<input type="number" min="0" max="' + have + '" value="0" ' +
        'id="s_' + u.id + '"' + (have ? '' : ' disabled') + '>' +
        '<b class="thave" data-all="' + u.id + '" data-n="' + have + '">/' +
        have + '</b></div>';
    });
    /* ช่องวีรบุรุษ */
    o += '<div class="tcell hero' + (hero.dead || hero.away ? ' zero' : '') + '">' +
      '<span class="tic">🗿</span>' +
      '<label class="hchk"><input type="checkbox" id="s_hero"' +
      (hero.dead || hero.away ? ' disabled' : '') + '><span></span></label>' +
      '<b class="thave">/' + (hero.dead ? '💀' : hero.away ? '🏃' : '1') + '</b></div>';
    o += '</div>';

    o += '<div class="tlegend">';
    units.forEach(function(u){
      o += '<i>' + unitIcon(u) + ' ' + u.name + '</i>';
    });
    o += '<i>🗿 ' + hero.name + '</i></div>';

    /* เป้าหมาย */
    o += '<div class="destbox"><div class="drow">' +
      '<label>หมู่บ้าน</label><input type="text" id="tname" placeholder="ชื่อเมือง (ถ้ามี)"></div>' +
      '<div class="drow2"><label>หรือ X</label>' +
      '<input type="number" id="tx" value="' + (px !== undefined ? px : v.x) + '">' +
      '<label>Y</label>' +
      '<input type="number" id="ty" value="' + (py !== undefined ? py : v.y+3) + '">' +
      '</div></div>';

    o += '<div class="misrow2">';
        o += '<div id="supopt" class="supopt hidden">' +
      '<label class="misr"><input type="checkbox" id="cancmd">' +
      '<span>🤝 ให้เจ้าของเมืองปลายทางสั่งทหารกองนี้ได้</span></label>' +
      '<div class="suphint">เมืองของคุณเองสั่งได้เสมอ · ' +
      'กองทหารออกรบจากฐานได้ 3 ครั้งแล้วกลับเอง</div></div>';

    var ms = [['support','🛡️','การเสริมกำลังทหาร'],['attack','⚔️','โจมตี: ปกติ'],
              ['raid','💰','โจมตี: ปล้น'],['scout','👁️','สอดแนม'],
              ['settle','🏕️','ตั้งเมือง']];
    ms.forEach(function(m, i){
      o += '<label class="misr"><input type="radio" name="mis" value="' + m[0] +
        '"' + (i===2?' checked':'') + '><span>' + m[1] + ' ' + m[2] + '</span></label>';
    });
    o += '</div>';

    var hasCata = units.some(function(u){ return u.cls==='cata' && v.troops[u.id]; });
    if (hasCata && rl >= 10){
      o += '<label style="font-size:11px;color:#a89468">เป้าหมายปืนใหญ่</label>' +
        '<select id="ctgt" class="selbox"><option value="">สุ่มอาคาร</option>';
      BUILDINGS.forEach(function(b, bi){
        if (bi === 0 || b.cat === 'wall') return;
        o += '<option value="' + bi + '">' + b.ic + ' ' + b.name + '</option>';
      });
      o += '</select>';
    } else if (hasCata){
      o += '<div class="bc-lock">🔒 ลานรวมพล Lv.10 เพื่อเลือกเป้าปืนใหญ่</div>';
    }

    o += '<div id="eta" class="eta">—</div>' +
      '<button class="btn-ok" id="sendbtn">ส่ง</button>';
    document.getElementById('rbody').innerHTML = o;

    function collect(){
      var t = {};
      units.forEach(function(u){
        var n = parseInt(document.getElementById('s_'+u.id).value, 10) || 0;
        if (n > 0) t[u.id] = Math.min(n, v.troops[u.id]||0);
      });
      return t;
    }
    function getXY(){
      var nm = (document.getElementById('tname').value||'').trim();
      if (nm){
        var f = Game.villages.filter(function(g){ return g.name === nm; })[0];
        if (f) return { x:f.x, y:f.y };
        if (typeof Guild !== 'undefined' && Guild.myG()){
          var m = Guild.memberList().filter(function(z){ return z.name === nm; })[0];
          if (m) return { x:m.x, y:m.y };
        }
      }
      return { x: parseInt(document.getElementById('tx').value,10),
               y: parseInt(document.getElementById('ty').value,10) };
    }
    function upd(){
      var p = getXY(), t = collect(), el = document.getElementById('eta');
      var wh = document.getElementById('s_hero').checked;
      if (isNaN(p.x) || isNaN(p.y)){ el.textContent = '—'; return; }
      var tg = Military.defenderAt(p.x, p.y);
      var lbl = tg.type === 'own' ? 'เมืองของคุณ'
        : tg.type === 'bot' ? tg.d.name
        : tg.type === 'npc' ? 'เมืองร้าง'
        : tg.type === 'oasis' ? 'โอเอซิส (มีสัตว์ป่า)'
        : tg.type === 'fort' ? '🏰 ป้อมปราการ'
        : tg.type === 'capital' ? '👑 เมืองหลวงโลก' : 'ช่องว่าง';
      var d = Military.dist(v.x, v.y, p.x, p.y);
      var sec = Combat.count(t) ? Military.travelSec(v, p.x, p.y, t) : 0;
      var loyTxt = '';
      var ms2 = document.querySelector('input[name=mis]:checked');
      var so = document.getElementById('supopt');
      if (so) so.classList.toggle('hidden', !ms2 || ms2.value !== 'support');

      if (tg.type === 'bot'){
        var lk = 'loy:' + tg.bot.id + ':' + tg.vi;
        if (Game.npc[lk] !== undefined)
          loyTxt = '<br>🏳️ ความภักดี <b style="color:#ffcf40">' +
            Math.round(Game.npc[lk]) + '%</b>';
      }
      el.innerHTML = 'ระยะ <b>' + d.toFixed(1) + '</b> ช่อง · ถึงใน <b>' +
        (sec ? UI.dur(sec) : '—') + '</b><br>เป้าหมาย: <b>' + lbl +
        '</b> · กำลังพล <b>' + Combat.count(t) + '</b>' +
        (wh ? ' + 🗿' : '') + loyTxt;
    }
    document.querySelectorAll('[data-all]').forEach(function(b){
      b.onclick = function(){
        document.getElementById('s_'+b.dataset.all).value = b.dataset.n;
        upd();
      };
    });
    units.forEach(function(u){
      var e = document.getElementById('s_'+u.id);
      if (e) e.oninput = upd;
    });
    ['tx','ty','tname'].forEach(function(i){
      var e = document.getElementById(i);
      if (e) e.oninput = upd;
    });
    document.getElementById('s_hero').onchange = upd;
    upd();
    document.querySelectorAll('input[name=mis]').forEach(function(r){
      r.onchange = upd;
    });


    document.getElementById('sendbtn').onclick = function(){
      var p = getXY();
      var mis = document.querySelector('input[name=mis]:checked').value;
      var ct = document.getElementById('ctgt');
      var wh = document.getElementById('s_hero').checked;
      var cc = document.getElementById('cancmd');
      var e = Military.send(v, p.x, p.y, mis, collect(),
        ct && ct.value ? +ct.value : null, wh);
      if (!e){
        var last = Game.movements[Game.movements.length-1];
        if (last && mis === 'support') last.canCommand = !!(cc && cc.checked);
      }

      if (e) return alert(e);
      close(); save(); UI.refreshAll();
      alert('ส่งกองทัพแล้ว');
    };
  }

  function unitIcon(u){
    return u.cls === 'inf' ? (u.atk >= 60 ? '🗡️' : '🔪')
      : u.cls === 'scout' ? '🐴'
      : u.cls === 'cav' ? (u.up >= 3 ? '🏇' : '🐎')
      : u.cls === 'cata' ? '💣'
      : u.cls === 'chief' ? '👑'
      : u.cls === 'settler' ? '🏕️' : '⚔️';
  }

  function rallyOver(v){
    var o = '';
    var mine = Game.movements.filter(function(m){ return m.from === v.id; });
    if (mine.length){
      o += '<h4>ขบวนของเรา</h4>';
      mine.forEach(function(m){
        var mi = Military.MISSIONS[m.mission];
        o += '<div class="row"><span>' +
          (m.returning ? '↩️ กลับบ้าน' : mi.ic + ' ' + mi.name +
            ' (' + m.tx + '|' + m.ty + ')') +
          (m.hero ? ' 🗿' : '') +
          '<br><i style="font-size:10px;color:#a89468">' +
          Military.troopLine(m.troops) + '</i></span><b>' +
          UI.dur((m.arriveAt-now())/1000) + '</b></div>';
      });
    } else o += '<p style="color:#8a7a55;font-size:12px;text-align:center;' +
      'padding:14px">ไม่มีขบวนเดินทาง</p>';

    var wl = cityLevel(v, 'watchtower');
    var lead = (5 + wl*5)*60000;
    var inc = (Game.incoming||[]).filter(function(m){
      return m.target === v.id && wl > 0 && (m.arriveAt - now()) <= lead; });
    if (wl <= 0){
      o += '<h4 style="color:#ff9a5a">⚠️ ไม่มีหอคอยเฝ้าระวัง</h4>' +
        '<p style="font-size:11px;color:#a89468">คุณจะไม่เห็นศัตรูที่กำลังบุกมาเลย</p>';
    } else if (inc.length){
      o += '<h4 style="color:#ff6b6b">⚠️ ศัตรูกำลังมา</h4>';
      inc.forEach(function(m){
        o += '<div class="row"><span style="color:#ff9a9a">จาก (' + m.fx + '|' +
          m.fy + ')</span><b style="color:#ff6b6b">' +
          UI.dur((m.arriveAt-now())/1000) + '</b></div>';
      });
    } else {
      o += '<div class="row"><span>🗼 หอคอย Lv.' + wl + '</span>' +
        '<b style="color:#8fbf5f">ไม่พบศัตรูใน ' + (5+wl*5) + ' นาที</b></div>';
    }
    var sc = Schedule.mine(v);
    if (sc.length){
      o += '<h4>⏰ แผนการรบ</h4>';
      sc.forEach(function(s){
        o += '<div class="row"><span>' + Military.MISSIONS[s.mission].ic +
          ' (' + s.tx + '|' + s.ty + ')</span><b>' +
          UI.dur((s.fireAt-now())/1000) + '</b></div>';
      });
    }
    if (Schedule.active())
      o += '<button class="btn-use" onclick="UI.close();Schedule.open()">' +
        '⏰ ตั้งแผนการรบ</button>';
    document.getElementById('rbody').innerHTML = o;
  }

  function rallyTroop(v){
    var o = '<div class="infobox">ทหารที่อยู่ในเมืองนี้ (' + v.name + ')</div>';
    o += '<table class="ttab"><tr><th>หน่วย</th><th>จำนวน</th><th>🌾/ชม.</th></tr>';
    var any = false;
    myUnits().forEach(function(u){
      var n = v.troops[u.id] || 0;
      if (!n) return;
      any = true;
      o += '<tr><td>' + unitIcon(u) + ' ' + u.name + '</td>' +
        '<td><b>' + UI.fmt(n) + '</b></td><td>' + (n*u.up) + '</td></tr>';
    });
    var hero = Hero.get(v);
    if (!hero.dead && !hero.away){
      any = true;
      o += '<tr><td>🗿 ' + hero.name + '</td><td><b>1</b></td><td>6</td></tr>';
    }
    if (!any) o += '<tr><td colspan="3" style="text-align:center;color:#8a7a55">' +
      'ยังไม่มีทหาร</td></tr>';
    o += '</table>';
    o += '<div class="row"><span>ค่าบำรุงรักษารวม</span>' +
      '<b style="color:#ff9a5a">' + Military.upkeep(v) + ' 🌾/ชม.</b></div>';
    document.getElementById('rbody').innerHTML = o;
  }

  function openTroops(){ Station.open(); }


  /* ============ รายงาน ============ */
  /* ============ รายงาน — 2 แท็บ ============ */
  var rptTab = 'war';

  function catOf(r){
    if (r.cat) return r.cat;
    var m = r.mission || '';
    if (m === 'dungeon' || m === 'hero' || m === 'guild' ||
        m === 'trade' || m === 'build') return 'city';
    return 'war';
  }
  function renderReports(){
    var el = document.getElementById('reportlist');
    if (!el) return;
    if (!Game.reports) Game.reports = [];
    var all = Game.reports;
    var war = all.filter(function(r){ return catOf(r) === 'war'; });
    var city = all.filter(function(r){ return catOf(r) === 'city'; });
    var nw = war.filter(function(r){ return !r.read; }).length;
    var nc = city.filter(function(r){ return !r.read; }).length;
    var list = rptTab === 'war' ? war : city;

    var h = '<div class="rtabs">' +
      '<button class="rtab' + (rptTab==='war'?' on':'') + '" data-rtb="war">' +
        '⚔️ การทหาร' + (nw ? ' <i>' + nw + '</i>' : '') + '</button>' +
      '<button class="rtab' + (rptTab==='city'?' on':'') + '" data-rtb="city">' +
        '🔨 บ้านเมือง' + (nc ? ' <i>' + nc + '</i>' : '') + '</button></div>';
    h += '<div class="rpt-bar"><button id="rptall">อ่านทั้งหมด</button>' +
      '<button id="rptclr">ล้างแท็บนี้</button></div>';

    if (!list.length){
      h += '<p style="color:#a89468;padding:24px;text-align:center;font-size:12px">' +
        'ยังไม่มีรายงานในหมวดนี้</p>';
    } else {
      list.forEach(function(r){
        var gi = all.indexOf(r);
        h += '<div class="rpt' + (r.read ? '' : ' new') + (r.open ? ' open' : '') +
          '" data-ri="' + gi + '"><div class="rpt-h"><div>' +
          '<div class="rpt-t">' + (r.title||'รายงาน') + '</div>' +
          '<div class="rpt-s">(' + r.x + '|' + r.y + ') · ' +
          new Date(r.at).toLocaleString('th-TH',{hour:'2-digit',minute:'2-digit',
            day:'2-digit',month:'2-digit'}) + '</div></div>' +
          '<div class="rpt-ar">' + (r.open?'▲':'▼') + '</div></div>' +
          '<div class="rpt-b">' + (r.body||'—') + '</div></div>';
      });
    }
    el.innerHTML = h;

    el.querySelectorAll('[data-rtb]').forEach(function(b){
      b.onclick = function(){ rptTab = b.dataset.rtb; renderReports(); };
    });
    document.getElementById('rptall').onclick = function(){
      list.forEach(function(r){ r.read = true; });
      save(); renderReports(); updateBadge();
    };
    document.getElementById('rptclr').onclick = function(){
      if (!confirm('ล้างรายงานในแท็บนี้?')) return;
      Game.reports = all.filter(function(r){ return catOf(r) !== rptTab; });
      save(); renderReports(); updateBadge(); UI.refreshAll();
    };
    el.querySelectorAll('[data-ri]').forEach(function(card){
      card.querySelector('.rpt-h').onclick = function(){
        var i = +card.getAttribute('data-ri');
        if (!Game.reports[i]) return;
        Game.reports[i].open = !Game.reports[i].open;
        Game.reports[i].read = true;
        save(); renderReports(); updateBadge();
      };
    });
  }
  function updateBadge(){
    var n = (Game.reports||[]).filter(function(r){ return !r.read; }).length;
    var b = document.getElementById('rptbadge');
    if (!b) return;
    b.textContent = n;
    b.classList.toggle('hidden', n === 0);
  }

  return { openTrain:openTrain, openRally:openRally, openTroops:openTroops,
    renderReports:renderReports, updateBadge:updateBadge, close:close,
    unitIcon:unitIcon };
})();