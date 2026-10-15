/* ============ Social v14c — แชต · บล็อก · เปลี่ยนชื่อ · แผนการรบ ============ */
var Social = (function(){
  var S = { inst:false, unread:0, last:-1, cur:null, msgs:[], lastId:0, timer:null, rnN:0, rnAt:0 };
  var MIS = { raid:'💰 ปล้น', attack:'⚔️ โจมตี', scout:'👁️ สอดแนม' };

  function on(){ return typeof Sync !== 'undefined' && Sync.online && Sync.online(); }
  function esc(s){ return String(s == null ? '' : s).replace(/[<>&"]/g, function(c){
    return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]; }); }
  function toast(t){ if (typeof Sync !== 'undefined' && Sync.toast) Sync.toast(t); }
  function when(t){
    var d = new Date(t - (Game.timeShift || 0)), n = new Date();
    var tm = d.toLocaleTimeString('th-TH', { hour:'2-digit', minute:'2-digit' });
    return d.toDateString() === n.toDateString() ? tm
      : d.toLocaleDateString('th-TH', { day:'2-digit', month:'2-digit' }) + ' ' + tm;
  }
  function closeBtn(){ return '<button class="btn-cancel" onclick="UI.close()">ปิด</button>'; }

  /* ---------- รับสถานะจากเซิร์ฟเวอร์ (เรียกจาก Sync.apply) ---------- */
  function onState(r){
    var P = r.player || {};
    Game.schedUntil = P.schedUntil || 0;
    S.rnN = P.renameN | 0; S.rnAt = P.renameAt || 0;
    S.unread = r.msgUnread | 0;
    if (S.last >= 0 && S.unread > S.last){
      toast('✉ มีข้อความใหม่ ' + S.unread + ' ข้อความ');
      if (document.getElementById('cBox')) load();
    }
    S.last = S.unread;
    badge();
  }
  function badge(){
    var b = document.getElementById('msgbadge');
    if (!b) return;
    b.textContent = S.unread > 99 ? '99+' : S.unread;
    b.classList.toggle('hidden', !S.unread);
  }

  /* ---------- กล่องข้อความ ---------- */
  function openInbox(){
    if (!on()) return UI.modal('<h3>✉ กล่องข้อความ</h3><div class="infobox">แชตใช้ได้ในโหมดออนไลน์เท่านั้น</div>' + closeBtn());
    stopTimer();
    UI.modal('<h3>✉ กล่องข้อความ</h3><p class="stnone">กำลังโหลด…</p>');
    Api.post('/chat/inbox', {}).then(function(r){
      var h = '<h3>✉ กล่องข้อความ</h3><div class="grow2">' +
        '<button class="btn-ok mini2" id="cNew">✎ ข้อความใหม่</button>' +
        '<button class="btn-use2 mini2" id="cBl">🚫 ที่บล็อกไว้</button></div>';
      if (!r.ok) h += '<p class="stnone">' + esc(r.err || 'โหลดไม่สำเร็จ') + '</p>';
      else if (!r.list.length) h += '<p class="stnone">ยังไม่มีข้อความ<br>แตะเมืองผู้เล่นบนแผนที่แล้วกด ✉ เพื่อทักทาย</p>';
      else r.list.forEach(function(c){
        h += '<div class="cvrow' + (c.unread ? ' new' : '') + '" data-cu="' + esc(c.uid) + '" data-cn="' + esc(c.name) + '">' +
          '<div class="cvav">👤</div><div class="cvm"><b>' + esc(c.name) + (c.blocked ? ' 🚫' : '') + '</b><i>' +
          (c.mine ? 'คุณ: ' : '') + esc(String(c.text).slice(0, 60)) + '</i></div><div class="cvr"><i>' + when(c.at) +
          '</i>' + (c.unread ? '<em>' + c.unread + '</em>' : '') + '</div></div>';
      });
      UI.modal(h + closeBtn());
      document.getElementById('cNew').onclick = newMsg;
      document.getElementById('cBl').onclick = openBlocks;
      document.querySelectorAll('[data-cu]').forEach(function(n){
        n.onclick = function(){ openThread({ uid:n.dataset.cu, name:n.dataset.cn }); };
      });
    });
  }
  function newMsg(){
    UI.modal('<h3>✎ ข้อความใหม่</h3><input id="cTo" class="selbox" placeholder="ชื่อผู้เล่น" autocomplete="off">' +
      '<button class="btn-ok" id="cGo">เปิดห้องแชต</button><button class="btn-cancel" id="cBk">ย้อนกลับ</button>');
    document.getElementById('cBk').onclick = openInbox;
    document.getElementById('cGo').onclick = function(){
      var n = (document.getElementById('cTo').value || '').trim();
      if (n.length < 2) return alert('ใส่ชื่อผู้เล่น');
      openThread({ name:n });
    };
  }
  function openBlocks(){
    UI.modal('<h3>🚫 ผู้เล่นที่บล็อกไว้</h3><p class="stnone">กำลังโหลด…</p>');
    Api.post('/chat/blocks', {}).then(function(r){
      var h = '<h3>🚫 ผู้เล่นที่บล็อกไว้</h3>';
      if (!r.ok || !r.list.length) h += '<p class="stnone">ยังไม่ได้บล็อกใคร</p>';
      else r.list.forEach(function(b){
        h += '<div class="cvrow"><div class="cvav">🚫</div><div class="cvm"><b>' + esc(b.name || '(ลบบัญชีแล้ว)') +
          '</b></div><button class="mini" data-ub="' + esc(b.uid) + '">ปลดบล็อก</button></div>';
      });
      UI.modal(h + '<button class="btn-cancel" id="cBk">ย้อนกลับ</button>');
      document.getElementById('cBk').onclick = openInbox;
      document.querySelectorAll('[data-ub]').forEach(function(b){
        b.onclick = function(){
          Api.post('/chat/block', { uid:b.dataset.ub, on:false }).then(function(x){
            if (!x.ok) return alert(x.err);
            openBlocks();
          });
        };
      });
    });
  }

  /* ---------- ห้องแชต ---------- */
  function stopTimer(){ if (S.timer){ clearInterval(S.timer); S.timer = null; } }
  function openThread(target){
    if (!on()) return openInbox();
    S.cur = target; S.msgs = []; S.lastId = 0;
    UI.modal('<h3 id="cTitle">✉ ' + esc(target.name || '') + '</h3>' +
      '<div id="cBox" class="chatbox"><p class="stnone">กำลังโหลด…</p></div>' +
      '<div class="chatin"><textarea id="cIn" maxlength="500" placeholder="พิมพ์ข้อความ…"></textarea>' +
      '<button id="cSend">ส่ง</button></div>' +
      '<div class="grow2"><button class="btn-use2 mini2" id="cBack">◀ กล่องข้อความ</button>' +
      '<button class="btn-del mini2" id="cBlock">🚫 บล็อก</button></div>');
    document.getElementById('cBack').onclick = openInbox;
    document.getElementById('cSend').onclick = send;
    document.getElementById('cBlock').onclick = toggleBlock;
    load(true);
    stopTimer();
    S.timer = setInterval(function(){
      if (!document.getElementById('cBox')){ stopTimer(); return; }
      if (!document.hidden) load();
    }, 5000);
  }
  function load(first){
    if (!S.cur) return;
    var q = { after:S.lastId };
    if (S.cur.uid) q.uid = S.cur.uid; else q.name = S.cur.name;
    Api.post('/chat/thread', q).then(function(r){
      var box = document.getElementById('cBox');
      if (!box) return;
      if (!r.ok){ box.innerHTML = '<p class="stnone">' + esc(r.err || 'โหลดไม่สำเร็จ') + '</p>'; return; }
      S.cur.uid = r.with.uid; S.cur.name = r.with.name; S.cur.blocked = !!r.blocked;
      var tt = document.getElementById('cTitle');
      if (tt) tt.textContent = '✉ ' + r.with.name;
      var bb = document.getElementById('cBlock');
      if (bb) bb.textContent = S.cur.blocked ? '✔ ปลดบล็อก' : '🚫 บล็อก';
      if (r.readN){ S.unread = Math.max(0, S.unread - r.readN); S.last = S.unread; badge(); }
      if (!r.list.length && !first) return;
      r.list.forEach(function(m){ S.msgs.push(m); S.lastId = Math.max(S.lastId, m.id); });
      paint(first);
    });
  }
  function paint(first){
    var box = document.getElementById('cBox');
    if (!box) return;
    if (!S.msgs.length){ box.innerHTML = '<p class="stnone">ยังไม่มีข้อความ เริ่มทักทายได้เลย</p>'; return; }
    var bottom = first || box.scrollHeight - box.scrollTop - box.clientHeight < 80;
    box.innerHTML = S.msgs.map(function(m){
      return '<div class="cmsg' + (m.mine ? ' me' : '') + '"><div class="cb">' +
        esc(m.text).replace(/\n/g, '<br>') + '</div><i>' + when(m.at) +
        (m.mine ? '' : ' · <a data-rep="' + m.id + '">⚠ รายงาน</a>') + '</i></div>';
    }).join('');
    box.querySelectorAll('[data-rep]').forEach(function(a){
      a.onclick = function(){ report(+a.dataset.rep); };
    });
    if (bottom) box.scrollTop = box.scrollHeight;
  }
  function send(){
    var inp = document.getElementById('cIn'), btn = document.getElementById('cSend');
    var tx = (inp.value || '').trim();
    if (!tx) return;
    btn.disabled = true;
    var body = { text:tx };
    if (S.cur.uid) body.uid = S.cur.uid; else body.name = S.cur.name;
    Api.post('/chat/send', body).then(function(r){
      btn.disabled = false;
      if (!r.ok) return alert(r.err || 'ส่งไม่สำเร็จ');
      inp.value = '';
      if (r.to) S.cur.uid = r.to;
      load();
    });
  }
  function toggleBlock(){
    if (!S.cur || !S.cur.uid) return;
    var to = !S.cur.blocked;
    if (to && !confirm('บล็อก ' + S.cur.name + '?\nผู้เล่นนี้จะส่งข้อความหาคุณไม่ได้อีก')) return;
    Api.post('/chat/block', { uid:S.cur.uid, on:to }).then(function(r){
      if (!r.ok) return alert(r.err);
      S.cur.blocked = to;
      var bb = document.getElementById('cBlock');
      if (bb) bb.textContent = to ? '✔ ปลดบล็อก' : '🚫 บล็อก';
      toast(to ? '🚫 บล็อกแล้ว' : '✔ ปลดบล็อกแล้ว');
    });
  }
  function report(id){
    var why = prompt('เหตุผลที่รายงานข้อความนี้ (เช่น หยาบคาย สแปม หลอกลวง)');
    if (why === null) return;
    Api.post('/chat/report', { id:id }).then(function(r){
      if (!r.ok) return alert(r.err);
      var m = r.msg;
      if (typeof Net !== 'undefined' && Net.report)
        Net.report({ cat:'chat', page:'chat', ver:'14c', errs:'', ua:navigator.userAgent.slice(0, 200),
          text:('[รายงานข้อความ #' + m.id + ' จาก ' + (m.name || '?') + ' / ' + m.from_uid + ']\n' +
            m.text + '\n— เหตุผล: ' + (why || '-')).slice(0, 1000) },
          function(err){ alert(err || 'ส่งรายงานแล้ว ขอบคุณครับ'); });
    });
  }

  /* ---------- ปุ่ม ✉ บนการ์ดแผนที่ ---------- */
  function watchTile(){
    var ti = document.getElementById('tileinfo');
    if (!ti || typeof MutationObserver === 'undefined') return;
    new MutationObserver(function(){
      if (!on() || ti.classList.contains('hidden') || document.getElementById('tiMsg')) return;
      var act = ti.querySelector('.ti-act'), h4 = ti.querySelector('h4');
      if (!act || !h4 || typeof Net === 'undefined' || !Net.at) return;
      var m = h4.textContent.match(/\((-?\d+)\s*\|\s*(-?\d+)\)/);
      if (!m) return;
      var o = Net.at(+m[1], +m[2]);
      if (!o || o.p.ruin) return;
      var b = document.createElement('button');
      b.id = 'tiMsg'; b.className = 'btn-use'; b.style.flex = '0 0 46px'; b.textContent = '✉';
      b.onclick = function(){ Renderer.hideInfo(); openThread({ uid:o.p.uid, name:o.p.name }); };
      act.insertBefore(b, act.lastChild);
    }).observe(ti, { childList:true, subtree:true, attributes:true, attributeFilter:['class'] });
  }

  /* ---------- เปลี่ยนชื่อ ---------- */
  function renamePlayer(){
    var cur = Game.player.name, online = on();
    var cost = online && S.rnN > 0 ? 100 : 0;
    var wait = online && S.rnN > 0 ? Math.max(0, S.rnAt + 7 * 86400000 - now()) : 0;
    var h = '<h3>✎ เปลี่ยนชื่อผู้เล่น</h3><div class="infobox">ชื่อปัจจุบัน <b>' + esc(cur) + '</b><br>' +
      (online ? 'ครั้งแรกฟรี · ครั้งต่อไป 100 ทอง · เปลี่ยนได้ทุก 7 วัน<br>ใช้ชื่อซ้ำกับผู้เล่นอื่นไม่ได้'
              : 'โหมดออฟไลน์ เปลี่ยนได้ฟรี') + '</div>';
    if (wait > 0) h += '<div class="bc-lock">🔒 เปลี่ยนได้อีกครั้งใน ' + UI.dur(wait / 1000) + '</div>';
    h += '<input id="rnIn" class="selbox" maxlength="16" value="' + esc(cur) + '">' +
      '<button class="btn-ok" id="rnGo"' + (wait > 0 ? ' disabled' : '') + '>✔ ยืนยัน · ' +
      (cost ? '💰 ' + cost + ' ทอง' : 'ฟรี') + '</button>' + closeBtn();
    UI.modal(h);
    document.getElementById('rnGo').onclick = function(){
      var nm = (document.getElementById('rnIn').value || '').trim();
      if (nm.length < 2 || nm.length > 16) return alert('ชื่อต้องยาว 2-16 ตัวอักษร');
      if (/[\/\\<>]/.test(nm)) return alert('ห้ามใช้อักขระ / \\ < >');
      if (nm === cur) return alert('เป็นชื่อเดิมอยู่แล้ว');
      if (cost && Game.player.gold < cost) return alert('ทองไม่พอ');
      if (!confirm('เปลี่ยนชื่อเป็น "' + nm + '"' + (cost ? ' (ใช้ ' + cost + ' ทอง)' : '') + ' ?')) return;
      var btn = this;
      btn.disabled = true;
      if (online){
        Api.post('/account/rename', { name:nm }).then(function(r){
          btn.disabled = false;
          if (!r.ok) return alert(r.err || 'เปลี่ยนชื่อไม่สำเร็จ');
          Game.player.name = r.name;
          Store.set('sw_s1_name', r.name);
          UI.close(); toast('✔ เปลี่ยนชื่อเป็น ' + r.name + ' แล้ว');
          Sync.poll(true); Sync.fetchWorld();
        });
      } else {
        Game.player.name = nm;
        try { Account.rename(Account.currentId(), nm); } catch(e){}
        save(); UI.close(); UI.refreshAll();
      }
    };
  }
  function renameVillage(i){
    var v = Game.villages[i];
    if (!v) return;
    UI.modal('<h3>✎ เปลี่ยนชื่อเมือง</h3><div class="infobox">เปลี่ยนได้ฟรี ไม่จำกัดครั้ง · 2-20 ตัวอักษร</div>' +
      '<input id="rvIn" class="selbox" maxlength="20" value="' + esc(v.name) + '">' +
      '<button class="btn-ok" id="rvGo">✔ บันทึก</button>' + closeBtn());
    document.getElementById('rvGo').onclick = function(){
      var nm = (document.getElementById('rvIn').value || '').trim();
      if (nm.length < 2 || nm.length > 20) return alert('ชื่อเมืองต้องยาว 2-20 ตัวอักษร');
      if (/[<>]/.test(nm)) return alert('ห้ามใช้อักขระ < >');
      v.name = nm;
      if (on()) Sync.cmd('/rename', { vid:v.id, name:nm });
      else save();
      UI.close(); UI.refreshAll(); toast('✔ เปลี่ยนชื่อเมืองแล้ว');
    };
  }

  /* ---------- แผนการรบ ---------- */
  function schedOn(){ return (Game.schedUntil || 0) > now(); }
  function buyPlan(){
    var act = schedOn();
    UI.modal('<h3>⏰ แผนการรบ</h3><div class="infobox" style="line-height:1.7">' +
      'ตั้งเวลาให้กองทัพออกเดินทางเองแม้ปิดเกมอยู่<br>• ตั้งได้สูงสุด 20 แผน<br>' +
      '• เซิร์ฟเวอร์ส่งทัพภายใน 1 นาทีหลังเวลาที่ตั้ง<br>' +
      '• ถ้าทหารในเมืองไม่พอตอนถึงเวลา แผนจะล้มเหลวและมีรายงานแจ้ง</div>' +
      (act ? '<div class="row"><span>สิทธิ์เหลือ</span><b style="color:#8fbf5f">' +
        UI.dur((Game.schedUntil - now()) / 1000) + '</b></div>' : '') +
      '<button class="btn-ok" id="pBuy">' + (act ? '➕ ต่ออายุ ' : '💰 ซื้อสิทธิ์ ') + CFG.SCHED_DAYS +
      ' วัน · ' + CFG.SCHED_GOLD + ' ทอง</button>' +
      (act ? '<button class="btn-use" id="pOpen">⏰ เปิดแผนการรบ</button>' : '') + closeBtn());
    document.getElementById('pBuy').onclick = function(){
      if (Game.player.gold < CFG.SCHED_GOLD) return alert('ทองไม่พอ');
      this.disabled = true;
      Sync.cmd('/gold', { item:'sched' }, function(r){
        if (r && r.ok){ toast('⏰ ได้รับสิทธิ์แผนการรบแล้ว'); openPlan(); }
      });
    };
    var po = document.getElementById('pOpen');
    if (po) po.onclick = function(){ openPlan(); };
  }
  function dtLocal(t){
    var d = new Date(t - (Game.timeShift || 0));
    function p(n){ return ('0' + n).slice(-2); }
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
  function vName(id){
    var v = Game.villages.filter(function(x){ return x.id === id; })[0];
    return v ? v.name : 'เมือง #' + id;
  }
  function openPlan(x, y){
    if (!schedOn()) return buyPlan();
    UI.modal('<h3>⏰ แผนการรบ</h3><p class="stnone">กำลังโหลด…</p>');
    Api.post('/plan/list', {}).then(function(r){
      var v = V(), home = v.troops || {}, L = (r && r.list) || [];
      var ks = Object.keys(home).filter(function(k){ return home[k] > 0 && War.unit(k); });
      var h = '<h3>⏰ แผนการรบ</h3><div class="rbar"><span>สิทธิ์เหลือ ' +
        UI.dur((Game.schedUntil - now()) / 1000) + '</span><b>' + L.length + '/20 แผน</b></div>';
      L.forEach(function(p){
        h += '<div class="stcard"><div class="vh"><b>' + (MIS[p.mission] || p.mission) + ' → (' + p.tx + '|' + p.ty +
          ')</b><span>' + when(p.fire_at) + '</span></div><div class="stline">จาก ' + esc(vName(p.vid)) + ' · ' +
          War.troopLine(p.troops) + '</div><button class="mini" data-pd="' + p.id + '">✕ ยกเลิกแผน</button></div>';
      });
      h += '<h4>➕ ตั้งแผนใหม่ — จาก ' + esc(v.name) + '</h4>';
      if (!ks.length) h += '<p class="stnone">ไม่มีทหารในเมืองนี้</p>';
      else {
        h += '<div class="tgrid2">';
        ks.forEach(function(k){
          h += '<div class="tcell"><span class="tic">' + War.icon(War.unit(k)) + '</span><input type="number" min="0" value="0" id="pl_' +
            k + '"><b class="thave" data-pa="' + k + '" data-n="' + home[k] + '">/' + home[k] + '</b></div>';
        });
        h += '</div><div class="destbox"><div class="drow2"><label>X</label><input type="number" id="plx" value="' +
          (x != null ? x : v.x) + '"><label>Y</label><input type="number" id="ply" value="' + (y != null ? y : v.y) +
          '"></div><label style="font-size:11px;color:#a89468">เวลาออกเดินทาง</label>' +
          '<input type="datetime-local" id="plt" class="selbox" value="' + dtLocal(now() + 15 * 60000) + '"></div>' +
          '<div class="misrow2">' +
          '<label class="misr"><input type="radio" name="plm" value="raid" checked><span>💰 ปล้น</span></label>' +
          '<label class="misr"><input type="radio" name="plm" value="attack"><span>⚔️ โจมตี</span></label>' +
          '<label class="misr"><input type="radio" name="plm" value="scout"><span>👁️ สอดแนม</span></label></div>' +
          '<button class="btn-ok" id="plAdd">⏰ บันทึกแผน</button>';
      }
      h += '<button class="btn-use2" id="plExt">➕ ต่ออายุสิทธิ์</button>' + closeBtn();
      UI.modal(h);
      document.getElementById('plExt').onclick = buyPlan;
      document.querySelectorAll('[data-pa]').forEach(function(b){
        b.onclick = function(){ document.getElementById('pl_' + b.dataset.pa).value = b.dataset.n; };
      });
      document.querySelectorAll('[data-pd]').forEach(function(b){
        b.onclick = function(){
          if (!confirm('ยกเลิกแผนนี้?')) return;
          Api.post('/plan/del', { id:+b.dataset.pd }).then(function(){ openPlan(x, y); });
        };
      });
      var add = document.getElementById('plAdd');
      if (add) add.onclick = function(){
        var tr = {}, n = 0;
        ks.forEach(function(k){
          var c = parseInt(document.getElementById('pl_' + k).value, 10) || 0;
          if (c > 0){ tr[k] = c; n += c; }
        });
        if (!n) return alert('ยังไม่ได้เลือกทหาร');
        var tv = document.getElementById('plt').value;
        if (!tv) return alert('เลือกเวลาก่อน');
        add.disabled = true;
        Api.post('/plan/add', { vid:v.id, tx:parseInt(document.getElementById('plx').value, 10),
          ty:parseInt(document.getElementById('ply').value, 10),
          mission:document.querySelector('input[name=plm]:checked').value, troops:tr,
          fireAt:new Date(tv).getTime() + (Game.timeShift || 0) }).then(function(r2){
          add.disabled = false;
          if (!r2.ok) return alert(r2.err || 'บันทึกไม่สำเร็จ');
          toast('⏰ บันทึกแผนแล้ว');
          openPlan(x, y);
        });
      };
    });
  }

  /* ---------- ติดตั้ง (ใช้ได้ทั้งออนไลน์และออฟไลน์) ---------- */
  (function wrapCommon(){
    if (typeof Settings !== 'undefined'){
      var so = Settings.open;
      Settings.open = function(){
        so.apply(Settings, arguments);
        var home = document.getElementById('s_home');
        if (!home || document.getElementById('s_rn')) return;
        function mk(id, tx, fn){
          var b = document.createElement('button');
          b.id = id; b.className = 'btn-use2'; b.textContent = tx; b.onclick = fn;
          home.parentNode.insertBefore(b, home);
        }
        if (on()) mk('s_msg', '✉ กล่องข้อความ', openInbox);
        mk('s_rn', '✎ เปลี่ยนชื่อผู้เล่น', renamePlayer);
        mk('s_rv', '✎ เปลี่ยนชื่อเมืองนี้', function(){ renameVillage(Game.active); });
      };
    }
    if (typeof UI !== 'undefined'){
      var ov = UI.openVillages;
      UI.openVillages = function(){
        ov.apply(UI, arguments);
        document.querySelectorAll('.vcard[data-v]').forEach(function(c){
          var vh = c.querySelector('.vh b');
          if (!vh || c.querySelector('.vrn')) return;
          var b = document.createElement('button');
          b.className = 'vrn'; b.textContent = '✎';
          b.onclick = function(e){ e.stopPropagation(); renameVillage(+c.dataset.v); };
          vh.appendChild(b);
        });
      };
    }
  })();

  /* ---------- ติดตั้งเฉพาะออนไลน์ (เรียกจาก Sync.install) ---------- */
  function install(){
    if (S.inst) return;
    S.inst = true;
    var top = document.getElementById('topbar'), set = document.getElementById('setbtn');
    if (top && set && !document.getElementById('msgbtn')){
      var b = document.createElement('button');
      b.id = 'msgbtn';
      b.innerHTML = '✉<span id="msgbadge" class="mbadge hidden">0</span>';
      b.onclick = openInbox;
      top.insertBefore(b, set);
    }
    var og = UI.openGold;
    UI.openGold = function(){
      og.apply(UI, arguments);
      var sh = document.getElementById('gshop');
      if (!sh) return;
      var row = document.createElement('div');
      row.className = 'row'; row.style.cursor = 'pointer';
      row.innerHTML = schedOn()
        ? '<span>⏰ แผนการรบ<br><i style="font-size:10px;color:#8fbf5f">เหลือ ' +
          UI.dur((Game.schedUntil - now()) / 1000) + ' · แตะเพื่อเปิด</i></span><b style="color:#8fbf5f">✔</b>'
        : '<span>⏰ แผนการรบ<br><i style="font-size:10px;color:#8a7a55">ตั้งเวลาส่งทัพอัตโนมัติ ' +
          CFG.SCHED_DAYS + ' วัน</i></span><b style="color:#ffcf40">' + CFG.SCHED_GOLD + ' ทอง</b>';
      row.onclick = function(){ if (schedOn()) openPlan(); else buyPlan(); };
      sh.parentNode.insertBefore(row, sh);
    };
    if (typeof Schedule !== 'undefined'){
      Schedule.active = schedOn;
      Schedule.open = openPlan;
      Schedule.buy = function(){ buyPlan(); return null; };
    }
    watchTile();
  }

  return { install:install, onState:onState, openInbox:openInbox, openThread:openThread,
    renamePlayer:renamePlayer, renameVillage:renameVillage, openPlan:openPlan };
})();