/* ============ HUD v13b ============ */
var HUD = (function(){
  var built = false, fabOpen = false;
  function posKey(){
    var id = (typeof Account !== 'undefined' && Account.currentId)
      ? Account.currentId() : 'x';
    return 'sw_herobtn_pos_' + id;
  }

  function init(){
    if (built) return;
    built = true;

    var hero = document.createElement('div');
    hero.id = 'herobtn';
    document.body.appendChild(hero);
    restorePos(hero);
    makeDraggable(hero);

    var fab = document.createElement('div');
    fab.id = 'fabwrap';
    fab.innerHTML =
      '<div id="fablist" class="closed">' +
        '<button class="fabitem" id="homebtn"><span>🏠</span><i>หน้าหลัก</i></button>' +
        '<button class="fabitem" id="bmkbtn"><span>📍</span><i>พิกัด</i></button>' +
        '<button class="fabitem" id="questbtn"><span>📜</span><i>ภารกิจ</i>' +
          '<em id="qbadge" class="qdot hidden">!</em></button>' +
        '<button class="fabitem" id="hofbtn"><span>🏆</span><i>อันดับ</i></button>' +
        '<button class="fabitem" id="troopbtn"><span>🛡</span><i>กองทัพ</i></button>' +
      '</div><button id="fabmain">☰</button>';
    document.body.appendChild(fab);

    document.getElementById('fabmain').onclick = toggleFab;
    document.getElementById('homebtn').onclick = function(){
      closeFab(); save();
      if (typeof Net !== 'undefined' && Net.enabled())
        Net.flush(function(){ location.href = 'index.html'; });
      else location.href = 'index.html';
    };

    document.getElementById('troopbtn').onclick = function(){
      closeFab(); if (typeof Station !== 'undefined') Station.open();
      else MilUI.openTroops(); };
    document.getElementById('hofbtn').onclick = function(){ closeFab(); HOF.open(); };
    document.getElementById('questbtn').onclick = function(){ closeFab(); Quest.open(); };
    document.getElementById('bmkbtn').onclick = function(){
      closeFab(); if (typeof Bookmark !== 'undefined') Bookmark.open(); };
  }

  function toggleFab(){
    fabOpen = !fabOpen;
    var l = document.getElementById('fablist');
    var m = document.getElementById('fabmain');
    if (l) l.className = fabOpen ? 'open' : 'closed';
    if (m){ m.textContent = fabOpen ? '✕' : '☰'; m.classList.toggle('on', fabOpen); }
  }
  function closeFab(){ if (fabOpen) toggleFab(); }

  function restorePos(el){
    try {
      var p = Store.json(posKey(), null);
      if (p && isFinite(p.x) && isFinite(p.y)){
        el.style.left = Math.max(2, Math.min(window.innerWidth-46, p.x)) + 'px';
        el.style.top  = Math.max(60, Math.min(window.innerHeight-90, p.y)) + 'px';
        return;
      }
    } catch(e){}
    el.style.left = '12px'; el.style.top = '150px';
  }
  function makeDraggable(el){
    var dragging = false, moved = false, sx = 0, sy = 0, ox = 0, oy = 0;
    el.addEventListener('pointerdown', function(e){
      dragging = true; moved = false;
      sx = e.clientX; sy = e.clientY;
      var r = el.getBoundingClientRect();
      ox = r.left; oy = r.top;
      el.classList.add('drag');
      try { el.setPointerCapture(e.pointerId); } catch(err){}
    });
    el.addEventListener('pointermove', function(e){
      if (!dragging) return;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;
      el.style.left = Math.max(2, Math.min(window.innerWidth-46, ox+dx)) + 'px';
      el.style.top  = Math.max(60, Math.min(window.innerHeight-90, oy+dy)) + 'px';
    });
    function end(){
      if (!dragging) return;
      dragging = false;
      el.classList.remove('drag');
      if (moved){
        var r = el.getBoundingClientRect();
        try { Store.setJson(posKey(), { x:r.left, y:r.top }); } catch(e){}
      } else if (typeof Hero !== 'undefined') Hero.open();
    }
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }

  function renderHero(){
    var el = document.getElementById('herobtn');
    if (!el || !Game.villages.length) return;
    var v = V(), h = Hero.get(v);
    var pct = Math.round(h.exp / Hero.expNeed(h.level) * 100);
    var cls = h.dead ? 'dead' : h.away ? 'away' : '';
    if (h.free > 0 && !h.dead) cls += ' ready';
    if (el.classList.contains('drag')) cls += ' drag';
    el.className = cls.trim();
    var face = h.dead ? (h.healing ? '⛑' : '💀') : h.away ? '🏃' : '🗿';
    el.innerHTML =
      '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" class="hb-bg"/>' +
      '<circle cx="20" cy="20" r="17" class="hb-fg" stroke-dasharray="' +
      (pct*1.068) + ' 999"/></svg><span class="hb-ic">' + face + '</span>' +
      '<b class="hb-lv">' + h.level + '</b>' +
      (h.free > 0 && !h.dead ? '<i class="hb-dot">+' + h.free + '</i>' : '');
  }

  function sec(title, note, rows){
    if (!rows.length) return '';
    var h = '<div class="tp-sec"><div class="tp-head"><span>' + title + '</span>' +
      (note ? '<i>' + note + '</i>' : '') + '</div>';
    rows.forEach(function(r){
      h += '<div class="tp-row ' + r.c + '" data-act="' + (r.act||'') +
        '" data-bk="' + (r.bk||'') + '"><span class="tp-ic">' + r.ic + '</span>' +
        '<span class="tp-tx">' + r.t + (r.sub ? '<em>' + r.sub + '</em>' : '') +
        '</span>' + (r.rush ? '<span class="tp-rush" data-rq="' + r.rush.i +
        '">⚡💰' + r.rush.g + '</span>' : '') +
        '<b class="tp-tm">' + r.tm + '</b>' + (r.cx ? '<span class="tp-x" data-cx="' + r.cx + '">✕</span>' : '') + '</div>';
    });
    return h + '</div>';
  }

    function demoName(k){
    var B = window.BUILDINGS;
    if (B){
      if (Array.isArray(B)){ for (var i = 0; i < B.length; i++) if (B[i].key === k) return B[i].name; }
      else if (B[k] && B[k].name) return B[k].name;
    }
    return k;
  }

  function render(){
    var el = document.getElementById('taskpanel');
    if (!el || !Game.villages.length) return;
    var pg = document.querySelector('.page.active');
    var nm = pg ? pg.id.replace('page-','') : '';
    if (nm !== 'village' && nm !== 'fields'){ el.classList.add('hidden'); return; }
    el.classList.remove('hidden');

    var v = V(), t = now(), h = '';

    var build = [];
    (v.queue || []).forEach(function(q, i){
      var left = Math.max(0, (q.finish - t)/1000);
      build.push({ c: q.active ? 'build' : 'wait', ic: q.active ? '🔨' : '⏳',
        t: UI.nameOfQ(v, q) + ' → Lv.' + q.level,
        sub: q.kind === 'field' ? 'หน้าทรัพยากร'
           : q.kind === 'wall' ? 'กำแพงเมือง' : 'หน้าเมือง',
        tm: q.active ? UI.dur(left) : 'รอคิว', act:'queue',
        rush: q.active ? { i:i, g:goldRush(left) } : null,
  cx: 'q:' + i });
    });
    h += sec('🔨 รายการก่อสร้าง', 'ช่าง ' +
      v.queue.filter(function(q){ return q.active; }).length + '/' +
      builderCount(), build);

        /* v14W — งานรื้อถอน (b11) ทุกเมือง */
    var demo = [];
    Game.villages.forEach(function(dv, di){
      var d = dv.srvDemo;
      if (!d || !d.end || d.end <= t) return;
      var c = dv.city && dv.city[d.slot], lv = c ? (c.level | 0) : 0;
      demo.push({ c:'build', ic:'🔨',
        t: 'รื้อถอน ' + demoName(d.k) + (lv ? ' Lv.' + lv + ' → ' + (lv - 1) : ''),
        sub: (dv === v ? 'หน้าเมือง' : '🏘 ' + dv.name) + ' · เสร็จทั้งหมดใน ' + UI.dur(Math.max(0, (d.end - t) / 1000)),
        tm: UI.dur(Math.max(0, (d.next - t) / 1000)),
        act: 'demo', bk: di + ':' + d.slot });
    });
    h += sec('🔨 รื้อถอนอาคาร', '', demo);

    var train = [];
    for (var bk in (v.train || {})){
      var qq = v.train[bk];
      if (!qq || !qq.length) continue;
      qq.forEach(function(j, i){
        train.push({ c:'train', ic:'⚔️', t: U(j.unit).name + ' ×' + j.left,
          sub: BUILDINGS[bIndex(bk)].name +
            (j.total > j.left ? ' · เสร็จแล้ว ' + (j.total-j.left) : ''),
          tm: i === 0 ? UI.dur((j.nextAt - t)/1000) : 'รอคิว', act:'train', bk:bk });
      });
    }
    h += sec('⚔️ รายการฝึกทหาร', '', train);

    var army = [];
    (Game.movements || []).forEach(function(m){
      if (m.from !== v.id) return;
      var mi = Military.MISSIONS[m.mission];
      army.push({ c: m.returning ? 'back' : 'move',
        ic: m.returning ? '↩️' : (mi ? mi.ic : '⚔️'),
        t: (m.returning ? 'กองทัพกำลังกลับ' :
            (mi ? mi.name : 'ส่งทัพ') + ' (' + m.tx + '|' + m.ty + ')') +
           (m.hero ? ' 🗿' : ''),
        sub: Military.troopLine ? Military.troopLine(m.troops) : '',
        tm: UI.dur((m.arriveAt - t)/1000), 
        cx: (!m.returning && m.id != null && t - (m.departAt || m.depart || 0) < 60000) ? 'm:' + m.id : null,act:'rally' });
    });
    var wl = cityLevel(v, 'watchtower');
    (Game.incoming || []).forEach(function(m){
      if (m.target !== v.id || wl <= 0) return;
      if ((m.arriveAt - t) > (5 + wl*5)*60000) return;
      army.unshift({ c:'danger', ic:'⚠️',
        t:'ศัตรูกำลังบุก! (' + m.fx + '|' + m.fy + ')', sub:'เตรียมป้องกันด่วน',
        tm: UI.dur((m.arriveAt - t)/1000), 
        act:'rally' });
    });
    if (typeof Station !== 'undefined'){
      Station.mine(v).forEach(function(st){
        army.push({ c:'back', ic:'🛡', t:'ประจำการที่ ' + st.hostName,
          sub:'โควตาเหลือ ' + (st.max - st.raids) + '/' + st.max,
          tm:'(' + st.x + '|' + st.y + ')', act:'station' });
      });
    }
    h += sec('🏹 กองทัพ', '', army);

    var trade = [];
    (Game.trades || []).forEach(function(x){
      if (x.from !== v.id) return;
      trade.push({ c:'trade', ic:'🐫', t:'ส่งของ → (' + x.tx + '|' + x.ty + ')',
        sub: RES.map(function(r){
          return x.res[r] ? RES_IC[r] + UI.fmt(x.res[r]) : ''; })
          .filter(Boolean).join(' '),
        tm: UI.dur((x.arriveAt - t)/1000), act:'market' });
    });
    (Game.sched || []).forEach(function(s){
      if (s.from !== v.id) return;
      trade.push({ c:'trade', ic:'⏰', t:'แผนการรบ (' + s.tx + '|' + s.ty + ')',
        sub:'ตั้งเวลาไว้', tm: UI.dur((s.fireAt - t)/1000), act:'sched' });
    });
    h += sec('🐫 ขบวนและแผนการ', '', trade);

    var hr = [], hh = Hero.get(v);
    if (typeof Dungeon !== 'undefined'){
      var dg = Dungeon.running(v);
      if (dg){
        var D = DUNGEONS.filter(function(x){ return x.id === dg.id; })[0];
        hr.push({ c:'hero', ic:'🕳️', t:'สำรวจ ' + (D ? D.name : 'ดันเจี้ยน'),
          sub:'วีรบุรุษออกไปแล้ว', tm: UI.dur(Dungeon.left(v)), act:'dung' });
      }
    }
    if (hh.dead)
      hr.push({ c: hh.healing ? 'hero' : 'danger', ic: hh.healing ? '⛑' : '💀',
        t: hh.healing ? 'กำลังรักษาวีรบุรุษ' : 'วีรบุรุษบาดเจ็บ — รอรักษา',
        sub: hh.healing ? '' : 'แตะเพื่อจ่ายค่ารักษา',
        tm: hh.healing ? UI.dur(Hero.healLeft(v)) : '—', act:'hero' });
    h += sec('🗿 วีรบุรุษ', '', hr);

    if (!h) h = '<div class="tp-empty">ยังไม่มีงานที่ดำเนินอยู่<br>' +
      '<i style="font-size:9px">แตะอาคารหรือหลุมทรัพยากรด้านบนเพื่อเริ่มสร้าง</i></div>';
    el.innerHTML = h;

    el.querySelectorAll('[data-rq]').forEach(function(n){
      n.onclick = function(ev){
        ev.stopPropagation();
        var r = rushQueue(v, +n.dataset.rq);
        if (typeof r === 'string') return alert(r);
        save(); UI.refreshAll();
      };
    });
    el.querySelectorAll('[data-act]').forEach(function(n){
      n.onclick = function(){
        var a = n.dataset.act;
        if (a === 'queue') UI.openQueue();
        else if (a === 'train')   MilUI.openTrain(n.dataset.bk || 'barracks');
        else if (a === 'rally')   MilUI.openRally();
        else if (a === 'station') Station.open();
        else if (a === 'market')  Market.open();
        else if (a === 'sched')   Schedule.open();
        else if (a === 'dung')    Dungeon.open();
        else if (a === 'hero')    Hero.open();
        else if (a === 'demo'){
          var p = (n.dataset.bk || '').split(':'), vi = +p[0], sl = +p[1];
          if (vi !== Game.active && Game.villages[vi]){
            Game.active = vi; UI.refreshAll(); Sync.toast('🏘 สลับไปเมือง ' + Game.villages[vi].name);
          }
          if (window.BldTool && BldTool.manage) BldTool.manage(sl);
        }

      };
    });
        /* v14Z — ✕ ยกเลิกงานก่อสร้าง / เรียกทัพกลับ */
    el.querySelectorAll('[data-cx]').forEach(function(n){
      n.onclick = function(e){
        e.stopPropagation();
        var p = n.dataset.cx.split(':'), cv = Game.villages[Game.active];
        if (p[0] === 'q'){
          var q = cv.queue[+p[1]]; if (!q) return;
          if (!confirm('ยกเลิก "' + UI.nameOfQ(cv, q) + '" ?' + (q.active ? '\nคืนทรัพยากรตามเวลาที่เหลือ (อย่างน้อย 20%)' : ''))) return;
          Sync.cmd('/cancel', { vid:cv.id, idx:+p[1] }, function(r){
            Sync.toast('✕ ยกเลิกแล้ว' + (r && r.refund != null ? ' · คืน ' + r.refund + '%' : ''));
          });
        } else if (p[0] === 'm'){
          if (!confirm('เรียกกองทัพกลับเมือง?')) return;
          Sync.cmd('/recall', { id:+p[1] }, function(){ Sync.toast('↩️ เรียกกองทัพกลับแล้ว'); });
        }
      };
    });
  }

  function update(){
    try { if (!built) init(); renderHero(); render(); }
    catch(e){ logErr('HUD', e); }
  }
  return { init:init, update:update, closeFab:closeFab };
})();