/* ============ Chat3 v14h — กล่องข้อความ 3 ช่อง: ส่วนตัว · กิลด์ · โลก ============ */
var Chat3 = (function(){
  var tab = 'dm', tok = 0, R = { w:0, g:0 }, C = { rm:null, t:null, msgs:[], last:0, timer:null };
  function esc(s){ return String(s == null ? '' : s).replace(/[<>&"]/g, function(c){
    return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]; }); }
  function on(){ return typeof Sync !== 'undefined' && Sync.online && Sync.online(); }
  function key(r){ return 'sw_room_' + ((typeof Net !== 'undefined' && Net.uid && Net.uid()) || 'x') + '_' + r; }
  function seen(r){ return +(Store.get(key(r)) || 0); }
  function mark(r, id){
    if (id > seen(r)) Store.set(key(r), String(id));
    dots();
    var d = document.querySelector('[data-ct="' + r + '"] .tdot');
    if (d && r !== 'dm') d.remove();
  }
  function when(t){ return (typeof Social !== 'undefined' && Social.when) ? Social.when(t) : ''; }
  function dmCount(){
    var b = document.getElementById('msgbadge');
    return (b && !b.classList.contains('hidden')) ? b.textContent : '';
  }
  function dots(){ var b = document.getElementById('msgbtn'); if (b) b.classList.toggle('roomnew', R.g > seen('g')); }
  function onState(r){ if (r && r.rooms) R = r.rooms; dots(); }
  function stop(){ if (C.timer){ clearInterval(C.timer); C.timer = null; } }
  function closeBtn(){ return '<button class="btn-cancel" onclick="UI.close()">ปิด</button>'; }

  function head(){
    function t(id, lb, dot){
      return '<button class="btab' + (tab === id ? ' on' : '') + '" data-ct="' + id + '">' + lb +
        (dot ? '<i class="tdot">' + (dot === true ? '' : dot) + '</i>' : '') + '</button>';
    }
    return '<h3>✉ กล่องข้อความ</h3><div class="btabs">' + t('dm', '👤 ส่วนตัว', dmCount() || false) +
      t('g', '🏯 กิลด์', R.g > seen('g')) + t('w', '🌏 โลก', R.w > seen('w')) + '</div>';
  }
  function bindHead(){
    document.querySelectorAll('[data-ct]').forEach(function(b){ b.onclick = function(){ open(b.dataset.ct); }; });
  }

  function open(t){
    if (!on()) return UI.modal('<h3>✉ กล่องข้อความ</h3><div class="infobox">แชตใช้ได้ในโหมดออนไลน์เท่านั้น</div>' + closeBtn());
    if (t) tab = t;
    stop();
    if (tab === 'dm') dm(); else room(tab);
  }

  /* ---------- ส่วนตัว ---------- */
  function dm(){
    var my = ++tok;
    UI.modal(head() + '<p class="stnone">กำลังโหลด…</p>');
    bindHead();
    Api.post('/chat/inbox', {}).then(function(r){
      if (my !== tok) return;
      var h = head() + '<div class="grow2"><button class="btn-ok mini2" id="cNew">✎ ข้อความใหม่</button>' +
        '<button class="btn-use2 mini2" id="cBl">🚫 ที่บล็อกไว้</button></div>';
      if (!r.ok) h += '<p class="stnone">' + esc(r.err || 'โหลดไม่สำเร็จ') + '</p>';
      else if (!r.list.length) h += '<p class="stnone">ยังไม่มีข้อความส่วนตัว<br>แตะเมืองบนแผนที่ หรือแตะชื่อในห้องโลก เพื่อทักทาย</p>';
      else r.list.forEach(function(c){
        h += '<div class="cvrow' + (c.unread ? ' new' : '') + '" data-cu="' + esc(c.uid) + '" data-cn="' + esc(c.name) + '">' +
          '<div class="cvav">👤</div><div class="cvm"><b>' + esc(c.name) + (c.blocked ? ' 🚫' : '') + '</b><i>' +
          (c.mine ? 'คุณ: ' : '') + esc(String(c.text).slice(0, 60)) + '</i></div><div class="cvr"><i>' + when(c.at) +
          '</i>' + (c.unread ? '<em>' + c.unread + '</em>' : '') + '</div></div>';
      });
      UI.modal(h + closeBtn());
      bindHead();
      document.getElementById('cNew').onclick = function(){ Social.newMsg(); };
      document.getElementById('cBl').onclick = function(){ Social.openBlocks(); };
      document.querySelectorAll('[data-cu]').forEach(function(n){
        n.onclick = function(){ Social.openThread({ uid:n.dataset.cu, name:n.dataset.cn }); };
      });
    });
  }

  /* ---------- กิลด์ / โลก ---------- */
  function room(t){
    var my = ++tok;
    C.rm = t === 'g' ? 'guild' : 'world'; C.t = t; C.msgs = []; C.last = 0;
    UI.modal(head() + '<div id="rBox" class="chatbox"><p class="stnone">กำลังโหลด…</p></div>' +
      '<div class="chatin"><textarea id="rIn" maxlength="300" placeholder="' +
      (C.rm === 'world' ? 'คุยกับทุกคนในเซิร์ฟเวอร์…' : 'คุยกับเพื่อนในกิลด์…') + '"></textarea><button id="rSend">ส่ง</button></div>' +
      '<div class="suphint">แตะชื่อเพื่อส่งข้อความส่วนตัว · ⚠ รายงานข้อความไม่เหมาะสม</div>' + closeBtn());
    bindHead();
    document.getElementById('rSend').onclick = function(){ send(my); };
    load(true, my);
    C.timer = setInterval(function(){
      if (!document.getElementById('rBox')){ stop(); return; }
      if (!document.hidden) load(false, my);
    }, 5000);
  }
  function load(first, my){
    Api.post('/room/list', { room:C.rm, after:C.last }).then(function(r){
      if (my !== tok) return;
      var box = document.getElementById('rBox');
      if (!box) return;
      if (!r.ok){
        box.innerHTML = '<p class="stnone">' + esc(r.err || 'โหลดไม่สำเร็จ') + '</p>';
        var s = document.getElementById('rSend'); if (s) s.disabled = true;
        stop();
        return;
      }
      if (!r.list.length && !first) return;
      r.list.forEach(function(m){ C.msgs.push(m); C.last = Math.max(C.last, m.id); });
      if (C.msgs.length > 200) C.msgs = C.msgs.slice(-200);
      if (C.last) mark(C.t, C.last);
      paint(first);
    });
  }
  function paint(first){
    var box = document.getElementById('rBox');
    if (!box) return;
    if (!C.msgs.length){ box.innerHTML = '<p class="stnone">ยังไม่มีข้อความ เริ่มคุยได้เลย</p>'; return; }
    var bottom = first || box.scrollHeight - box.scrollTop - box.clientHeight < 80;
    box.innerHTML = C.msgs.map(function(m){
      return '<div class="cmsg' + (m.mine ? ' me' : '') + '">' + (m.mine ? '' :
        '<div class="cn" data-du="' + esc(m.uid) + '" data-dn="' + esc(m.name) + '">' + esc(m.name) +
        (m.tag ? ' <span class="gt">[' + esc(m.tag) + ']</span>' : '') + '</div>') +
        '<div class="cb">' + esc(m.text).replace(/\n/g, '<br>') + '</div><i>' + when(m.at) +
        (m.mine ? '' : ' · <a data-rr="' + m.id + '">⚠ รายงาน</a>') + '</i></div>';
    }).join('');
    box.querySelectorAll('[data-du]').forEach(function(n){
      n.onclick = function(){ stop(); Social.openThread({ uid:n.dataset.du, name:n.dataset.dn }); };
    });
    box.querySelectorAll('[data-rr]').forEach(function(a){ a.onclick = function(){ report(+a.dataset.rr); }; });
    if (bottom) box.scrollTop = box.scrollHeight;
  }
  function send(my){
    var inp = document.getElementById('rIn'), btn = document.getElementById('rSend');
    var tx = (inp.value || '').trim();
    if (!tx) return;
    btn.disabled = true;
    Api.post('/room/send', { room:C.rm, text:tx }).then(function(r){
      btn.disabled = false;
      if (!r.ok) return alert(r.err || 'ส่งไม่สำเร็จ');
      inp.value = '';
      load(false, my);
    });
  }
  function report(id){
    var why = prompt('เหตุผลที่รายงานข้อความนี้ (เช่น หยาบคาย สแปม หลอกลวง)');
    if (why === null) return;
    Api.post('/room/report', { room:C.rm, id:id }).then(function(r){
      if (!r.ok) return alert(r.err);
      var m = r.msg;
      if (typeof Net !== 'undefined' && Net.report)
        Net.report({ cat:'chat', page:'room-' + C.rm, ver:'14h', errs:'', ua:navigator.userAgent.slice(0, 200),
          text:('[รายงานข้อความห้อง' + (C.rm === 'world' ? 'โลก' : 'กิลด์') + ' #' + m.id + ' จาก ' + (m.name || '?') +
            ' / ' + m.from_uid + ']\n' + m.text + '\n— เหตุผล: ' + (why || '-')).slice(0, 1000) },
          function(err){ alert(err || 'ส่งรายงานแล้ว ขอบคุณครับ'); });
    });
  }

  if (typeof Social !== 'undefined'){
    var so = Social.onState;
    Social.onState = function(r){ so.apply(Social, arguments); onState(r); };
  }
  return { open:open, onState:onState };
})();