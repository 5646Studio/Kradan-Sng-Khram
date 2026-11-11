/* ============ Profile v14Q — โปรไฟล์ · ตั้งค่า (ตั้งค่าเกมเท่านั้น) · ธีม ============ */
var Profile = (function(){
  var KEY = 'sw_theme', oldSet = null;
  /* ปุ่มในหน้าตั้งค่าเดิมที่มีคำเหล่านี้จะถูกซ่อน (เพิ่มคำได้) */
  var SET_HIDE = ['กล่องข้อความ','เปลี่ยนชื่อ','กลับหน้าหลัก','วิธีเล่น','แจ้งปัญหา','อันดับ','ภารกิจ','เติมทอง','ร้านค้า','ธีม'];
  function esc(s){ return String(s == null ? '' : s).replace(/[<>&"]/g, function(c){
    return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]; }); }
  function $(i){ return document.getElementById(i); }
  function online(){ return typeof Sync !== 'undefined' && Sync.online && Sync.online(); }
  function theme(){ return Store.get(KEY) || 'night'; }
  function applyTheme(){
    var m = theme(), h = new Date().getHours();
    document.body.classList.toggle('day', m === 'day' || (m === 'auto' && h >= 6 && h < 18));
  }
  function setTheme(m){ Store.set(KEY, m); applyTheme(); settings(); }
  applyTheme();
  setInterval(applyTheme, 300000);
  function stat(ic, v, lb){ return '<div class="pf-st"><span>' + ic + '</span><b>' + v + '</b><i>' + lb + '</i></div>'; }
  /* v15D — ทหารทั้งหมด = ในเมือง + ประจำการที่อื่น + กำลังเดินทาง */
  function sumT(o){ var n = 0; for (var k in (o || {})) n += (o[k] | 0); return n; }
  function pfTroops(home){
    var me = ''; try { me = String(Net.uid()); } catch(e){}
    var mv = 0;
    (Game.movements || []).forEach(function(m){
      if (!m || !m.troops) return;
      if (m.uid != null ? String(m.uid) !== me : (m.incoming || m.enemy || m.hostile)) return;   /* ไม่นับทัพศัตรูที่กำลังมา */
      mv += sumT(m.troops);
    });
    function put(st, ok){
      var b = document.querySelector('#pfTr b'), d = document.getElementById('pfTrD');
      if (!b) return;
      b.textContent = UI.fmt(home + st + mv);
      if (d) d.textContent = '🏠 ในเมือง ' + UI.fmt(home) + ' · 🛡 ประจำการที่อื่น ' + (ok ? UI.fmt(st) : '…') + ' · 🚶 เดินทาง ' + UI.fmt(mv);
    }
    put(0, false);
    if (!window.Api) return;
    Api.post('/station/list', {}).then(function(r){
      var L = (r && (r.mine || r.list || r.stations || r.out)) || (Array.isArray(r) ? r : []), st = 0;
      L.forEach(function(s){ if (s) st += sumT(s.troops); });   /* mine = ทหารของเราที่ประจำการอยู่ตามเมืองต่าง ๆ (เก็บแยกจากทหารในเมือง) */
      put(st, true);
    }, function(){ put(0, true); });
  }
  function li(id, ic, tx, ex){ return '<button class="pf-li" id="' + id + '"><span>' + ic + '</span>' + tx + (ex || '') + '<em>›</em></button>'; }
  function on(id, fn){ var e = $(id); if (e) e.onclick = fn; }

  /* ---------- โปรไฟล์ ---------- */
  function open(){
    var o = online(), G = Game.player, vs = Game.villages.filter(function(g){ return !g.isFort; }), pop = 0, tr = 0;
    Game.villages.forEach(function(g){
      try { pop += population(g); } catch(e){}
      var t = g.troops || {};
      for (var k in t) tr += t[k] | 0;
    });
    var cp = Math.floor(G.cp || 0), next = Game.cpNext || cpForVillage(vs.length + 1);
    var rate = o && typeof B53 !== 'undefined' ? B53.rate() : (typeof cpPerDay === 'function' ? cpPerDay() : 0);
    var pct = Math.min(100, Math.round(cp / Math.max(1, next) * 100));
    var eta = cp >= next ? '✔ พร้อมขยายเมือง' : rate > 0 ? 'อีกประมาณ ' + ((next - cp) / rate).toFixed(1) + ' วัน' : '—';
    var hh = o && V() ? V().srvHero : null;
    var av = (hh && typeof HeroArt !== 'undefined') ? HeroArt.svg(hh.look, hh.eq, '56 20 88 88') : '🏯';
    var tag = (o && typeof B53 !== 'undefined') ? B53.myTag() : '';
    var tribe = (typeof TRIBES !== 'undefined' && TRIBES[G.tribe | 0]) ? TRIBES[G.tribe | 0].name : '';
    var ck = o && typeof Checkin !== 'undefined' && Checkin.pending();
    var Q = [
      ['pq1', '✉', 'ข้อความ', function(){ Social.openInbox(); }, o],
      ['pq2', '🏯', 'กิลด์', function(){ Guild.open(); }, true],
      ['pq3', '🛡', 'กองทัพ', function(){ if (o) War.openTroops(); else if (typeof Station !== 'undefined') Station.open(); }, true],
      ['pq4', '🏆', 'อันดับ', function(){ HOF.open(); }, typeof HOF !== 'undefined'],
      ['pq5', '📜', 'ภารกิจ', function(){ Quest.open(); }, typeof Quest !== 'undefined'],
      ['pq6', '🏪', 'ตลาด', function(){ Market.open(); }, typeof Market !== 'undefined'],
      ['pq7', '📅', 'เช็คอิน', function(){ Checkin.open(); }, o, ck],
      ['pq8', '💳', 'เติมทอง', function(){ if (typeof Shop !== 'undefined') Shop.open(); }, true]
    ].filter(function(q){ return q[4]; });

    var h = '<div class="pf"><div class="pf-head"><button class="pf-home" id="pfHome" title="กลับหน้าหลัก">🏠</button>' +
      '<div class="pf-av">' + av + '</div><div class="pf-id"><b>' + esc(G.name) +
      (tag ? ' <span class="gt">[' + esc(tag) + ']</span>' : '') + '</b><i>เผ่า' + tribe + ' · เซิร์ฟเวอร์ ' +
      esc(window.srvLabel ? srvLabel() : CFG.SERVER_NAME) + '</i>' +
      (typeof Season !== 'undefined' ? Season.line() : '') + '</div></div>' +
      '<div class="pf-stats">' + stat('🏘', vs.length, 'เมือง') + stat('👥', UI.fmt(pop), 'ประชากร') +
      stat('💰', UI.fmt(G.gold), 'ทอง') +
      '<div class="pf-st" id="pfTr"><span>⚔</span><b>' + UI.fmt(tr) + '</b><i>ทหารทั้งหมด</i></div></div>' +
      '<div class="pf-trd" id="pfTrD">กำลังนับทหารที่อยู่นอกเมือง…</div>' +
      '<div class="pf-cp"><div class="pf-cph"><span>🎭 Culture Points</span><b>' + UI.fmt(cp) + ' / ' + UI.fmt(next) + '</b></div>' +
      '<div class="hbar"><i style="width:' + pct + '%;background:#c9a24a"></i><span>เมืองที่ ' + (vs.length + 1) + ' · ' + eta +
      '</span></div><div class="pf-sub">+' + UI.fmt(rate) + ' CP/วัน</div></div>' +
      (o ? '<div id="pfInv" class="pf-inv"></div>' : '') +
      '<div class="pf-grid">' + Q.map(function(q){
        return '<button class="pf-q" id="' + q[0] + '"><span>' + q[1] + '</span>' + q[2] + (q[5] ? '<i class="pf-dot"></i>' : '') + '</button>';
      }).join('') + '</div><div class="pf-list">' +
      li('pfSea', '👑', 'ศึกชิงเมืองหลวงโลก') + (o ? li('pfHof', '🏛', 'ทำเนียบฤดูกาล') : '') +
      li('pfGuide', '📖', 'วิธีเล่น / บทแนะนำ') + li('pfRn', '✎', 'เปลี่ยนชื่อผู้เล่น') +
      li('pfBug', '🐞', 'แจ้งปัญหา') + li('pfSet', '⚙', 'ตั้งค่า') + '</div></div>' +
      '<button class="btn-cancel" onclick="UI.close()">ปิด</button>';
    UI.modal(h);
    var hb = document.getElementById('pfHome');
    if (hb) hb.onclick = function(){
      if (confirm('กลับไปหน้าหลัก?')) location.href = 'index.html';
    };
    pfTroops(tr);
    Q.forEach(function(q){ on(q[0], q[3]); });
    on('pfSea', function(){ if (typeof Season !== 'undefined' && online()) Season.open(); else if (typeof Conquest !== 'undefined') Conquest.openEndgame(); });
    on('pfHof', function(){ if (typeof B7 !== 'undefined') B7.hof(); });
    on('pfGuide', function(){ if (typeof Guide !== 'undefined') Guide.open(); });
    on('pfRn', function(){ if (typeof Social !== 'undefined') Social.renamePlayer(); });
    on('pfBug', function(){ if (typeof Bug !== 'undefined') Bug.open(); });
    on('pfSet', settings);
    if (o && typeof Invite !== 'undefined') Invite.card($('pfInv'));
  }
  /* v14V — สิ่งที่ผู้พัฒนาเห็นคนเดียว (ใส่ Player ID แบบเต็ม คั่นด้วย , ได้หลายบัญชี) */
  var DEV_UIDS = ['eBOQQnuj4UdFjMgt9MieYgSjK0s1'];
  function isDev(){ try { return DEV_UIDS.indexOf(Net.uid()) >= 0; } catch(e){ return false; } }
  window.isDev = isDev;

  /* ---------- ตั้งค่า (ตั้งค่าเกมเท่านั้น) ---------- */
  function settings(){
    if (oldSet) oldSet.apply(Settings, arguments);
    else UI.modal('<h3>⚙ ตั้งค่า</h3><button class="btn-cancel" onclick="UI.close()">ปิด</button>');
    var mb = $('modalbox');
    if (!mb) return;
    mb.querySelectorAll('button').forEach(function(b){
      if (b.classList.contains('btn-cancel')) return;
      var t = (typeof I18N !== 'undefined' ? I18N.src(b) : b.textContent) || '';
      if (SET_HIDE.some(function(x){ return t.indexOf(x) >= 0; })) b.remove();
    });
    var h3 = mb.querySelector('h3');
    if (!h3){ h3 = document.createElement('h3'); mb.insertBefore(h3, mb.firstChild); }
    h3.textContent = '⚙ ตั้งค่า';
    var o = online(), th = theme(), u = (typeof Net !== 'undefined' && Net.uid) ? (Net.uid() || '') : '';
    var pv = o && Net.providerLabel ? Net.providerLabel() : '📴 โหมดออฟไลน์';
    var opt = (o && typeof Push !== 'undefined' ? li('stPush', '🔔', 'การแจ้งเตือน', Push.isOn() ? ' <b style="color:#6fd35a">●</b>' : '') : '') +
      (typeof AppInstall !== 'undefined' && !AppInstall.installed() ? li('stApp', '📲', 'ติดตั้งเป็นแอป') : '');
    var box = document.createElement('div');
        var LG = typeof I18N !== 'undefined' ? I18N.lang() : 'th';
    box.innerHTML = '<h4 data-noi18n>🌐 ภาษา / Language</h4><div class="pf-theme" style="grid-template-columns:1fr 1fr" data-noi18n>' +
      [['th', '🇹🇭 ไทย'], ['en', '🇬🇧 English']].map(function(x){
        return '<button class="pf-th' + (LG === x[0] ? ' on' : '') + '" data-lg="' + x[0] + '">' + x[1] + '</button>';
      }).join('') + '</div>' + (LG === 'en' && isDev() ? '<div class="grow2" data-noi18n><button class="btn-use2 mini2" id="stMiss">📋 Copy untranslated (' +
        I18N.missList().length + ')</button><button class="btn-del mini2" id="stMissX">🗑 Clear</button></div>' : '') +
      '<h4>🎨 ธีม</h4><div class="pf-theme">' +
      [['day', '☀️ กลางวัน'], ['night', '🌙 กลางคืน'], ['auto', '🔄 อัตโนมัติ']].map(function(t){
        return '<button class="pf-th' + (th === t[0] ? ' on' : '') + '" data-th="' + t[0] + '">' + t[1] + '</button>';
      }).join('') + '</div>' +
      '<label class="misr"><input type="checkbox" id="stNav"' + (Store.get('sw_navlb') === '0' ? '' : ' checked') +
      '><span>🧭 แสดงชื่อใต้ไอคอนแถบเมนูล่าง</span></label>' +
      (opt ? '<div class="pf-list">' + opt + '</div>' : '') +
      '<h4>👤 บัญชี</h4><div class="stacc">' + pv + (u ? '<br>รหัสผู้เล่น <b>' + esc(u.slice(0, 10)) + '…</b><a id="stCp">📋 คัดลอก</a>' +
        '<br><i>ใช้แจ้งทีมงานเมื่อมีปัญหาเรื่องบัญชีหรือการเติมทอง</i>' : '') + '</div>';
    h3.parentNode.insertBefore(box, h3.nextSibling);
    var cb = mb.querySelector('.btn-cancel');
    if (cb){
      var bk = document.createElement('button');
      bk.className = 'btn-use2'; bk.textContent = '◀ กลับโปรไฟล์'; bk.onclick = open;
      cb.parentNode.insertBefore(bk, cb);
      var ft = document.createElement('div');
      ft.className = 'suphint'; ft.style.textAlign = 'center';
      ft.textContent = 'สุวรรณภูมิ · เวอร์ชัน ' + ((typeof Update !== 'undefined' && Update.version()) || '-');
      cb.parentNode.insertBefore(ft, cb.nextSibling);
    }
      box.querySelectorAll('[data-lg]').forEach(function(b){
      b.onclick = function(){ if (I18N.lang() !== b.dataset.lg) I18N.set(b.dataset.lg); };
    });
    if (isDev()){
      on('stMiss', function(){ I18N.copyMiss(); });
      on('stMissX', function(){ I18N.clearMiss(); settings(); });
    }


    box.querySelectorAll('[data-th]').forEach(function(b){ b.onclick = function(){ setTheme(b.dataset.th); }; });
    $('stNav').onchange = function(){
      Store.set('sw_navlb', this.checked ? '1' : '0');
      window.NAV_LABEL = this.checked;
      if (typeof NavArt !== 'undefined') NavArt.apply();
    };
    on('stPush', function(){ Push.open(); });
    on('stApp', function(){ AppInstall.go(); });
    on('stCp', function(){
      if (navigator.clipboard) navigator.clipboard.writeText(u).then(function(){ Sync.toast('📋 คัดลอกรหัสผู้เล่นแล้ว'); });
    });
  }

  if (typeof Settings !== 'undefined'){ oldSet = Settings.open; Settings.openSettings = settings; Settings.open = open; }
  var sb = $('setbtn');
  if (sb){ sb.textContent = '👤'; sb.title = 'โปรไฟล์'; }
  return { open:open, settings:settings, setTheme:setTheme, applyTheme:applyTheme };
})();