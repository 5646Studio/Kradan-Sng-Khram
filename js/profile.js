/* ============ Profile v14j — หน้าโปรไฟล์ · ธีมกลางวัน/กลางคืน ============ */
var Profile = (function(){
  var KEY = 'sw_theme';
  function esc(s){ return String(s == null ? '' : s).replace(/[<>&"]/g, function(c){
    return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]; }); }
  function online(){ return typeof Sync !== 'undefined' && Sync.online && Sync.online(); }
  function theme(){ return Store.get(KEY) || 'night'; }
  function applyTheme(){
    var m = theme(), h = new Date().getHours();
    document.body.classList.toggle('day', m === 'day' || (m === 'auto' && h >= 6 && h < 18));
  }
  function setTheme(m){ Store.set(KEY, m); applyTheme(); open(); }
  applyTheme();
  setInterval(applyTheme, 300000);

  function stat(ic, v, lb){ return '<div class="pf-st"><span>' + ic + '</span><b>' + v + '</b><i>' + lb + '</i></div>'; }

  function open(){
    var on = online(), G = Game.player, vs = Game.villages, pop = 0, tr = 0;
    vs.forEach(function(g){
      try { pop += population(g); } catch(e){}
      var t = g.troops || {};
      for (var k in t) tr += t[k] | 0;
    });
    var cp = Math.floor(G.cp || 0), next = Game.cpNext || cpForVillage(vs.length + 1);
    var rate = on && typeof B53 !== 'undefined' ? B53.rate() : (typeof cpPerDay === 'function' ? cpPerDay() : 0);
    var pct = Math.min(100, Math.round(cp / Math.max(1, next) * 100));
    var eta = cp >= next ? '✔ พร้อมขยายเมือง' : rate > 0 ? 'อีกประมาณ ' + ((next - cp) / rate).toFixed(1) + ' วัน' : '—';
    var hh = on && V() ? V().srvHero : null;
    var av = (hh && typeof HeroArt !== 'undefined') ? HeroArt.svg(hh.look, hh.eq, '56 20 88 88') : '🏯';
    var tag = (on && typeof B53 !== 'undefined') ? B53.myTag() : '';
    var pv = on && Net.providerLabel ? Net.providerLabel() : '📴 ออฟไลน์';
    var parties = vs.filter(function(g){ return g.srvParty; }).length;
    var tribe = (typeof TRIBES !== 'undefined' && TRIBES[G.tribe | 0]) ? TRIBES[G.tribe | 0].name : '';
    var th = theme();
    var Q = [
      ['pq1', '✉', 'ข้อความ', function(){ Social.openInbox(); }, on],
      ['pq2', '🏯', 'กิลด์', function(){ Guild.open(); }, true],
      ['pq3', '🛡', 'กองทัพ', function(){ if (on) War.openTroops(); else if (typeof Station !== 'undefined') Station.open(); }, true],
      ['pq4', '🏆', 'อันดับ', function(){ HOF.open(); }, typeof HOF !== 'undefined'],
      ['pq5', '📜', 'ภารกิจ', function(){ Quest.open(); }, typeof Quest !== 'undefined'],
      ['pq6', '🏪', 'ตลาด', function(){ Market.open(); }, typeof Market !== 'undefined'],
      ['pq7', '🎉', 'เฉลิมฉลอง', function(){ B53.openParty(); }, on],
      ['pq8', '💳', 'เติมทอง', function(){ if (typeof Shop !== 'undefined') Shop.open(); }, true]
    ].filter(function(q){ return q[4]; });

    var h = '<div class="pf"><div class="pf-head"><div class="pf-av">' + av + '</div><div class="pf-id"><b>' + esc(G.name) +
      (tag ? ' <span class="gt">[' + esc(tag) + ']</span>' : '') + '</b><i>' + pv + '</i><i>เผ่า' + tribe +
      ' · เซิร์ฟเวอร์ ' + CFG.SERVER_NAME + '</i>' + (typeof Season !== 'undefined' ? Season.line() : '') + '</div></div>' +
      '<div class="pf-stats">' + stat('🏘', vs.length, 'เมือง') + stat('👥', UI.fmt(pop), 'ประชากร') +
      stat('💰', UI.fmt(G.gold), 'ทอง') + stat('⚔', UI.fmt(tr), 'ทหาร') + '</div>' +
      '<div class="pf-cp"><div class="pf-cph"><span>🎭 Culture Points</span><b>' + UI.fmt(cp) + ' / ' + UI.fmt(next) + '</b></div>' +
      '<div class="hbar"><i style="width:' + pct + '%;background:#c9a24a"></i><span>เมืองที่ ' + (vs.length + 1) + ' · ' + eta +
      '</span></div><div class="pf-sub">+' + UI.fmt(rate) + ' CP/วัน' + (parties ? ' · 🎉 กำลังจัดงาน ' + parties + ' เมือง' : '') +
      '</div></div><div class="pf-grid">' + Q.map(function(q){
        return '<button class="pf-q" id="' + q[0] + '"><span>' + q[1] + '</span>' + q[2] + '</button>';
      }).join('') + '</div><h4>🎨 ธีม</h4><div class="pf-theme">' +
      [['day', '☀️ กลางวัน'], ['night', '🌙 กลางคืน'], ['auto', '🔄 อัตโนมัติ']].map(function(t){
        return '<button class="pf-th' + (th === t[0] ? ' on' : '') + '" data-th="' + t[0] + '">' + t[1] + '</button>';
      }).join('') + '</div><div class="pf-list">' +
      '<button class="pf-li" id="pfSea"><span>👑</span>ศึกชิงเมืองหลวงโลก<em>›</em></button>' +
      '<button class="pf-li" id="pfRn"><span>✎</span>เปลี่ยนชื่อผู้เล่น<em>›</em></button>' +
      '<button class="pf-li" id="pfSet"><span>⚙</span>ตั้งค่าและบัญชี<em>›</em></button>' +
      '<button class="pf-li" id="pfBug"><span>🐞</span>แจ้งปัญหา<em>›</em></button></div></div>' +
      '<button class="btn-cancel" onclick="UI.close()">ปิด</button>';
    UI.modal(h);
    Q.forEach(function(q){ document.getElementById(q[0]).onclick = q[3]; });
    document.querySelectorAll('[data-th]').forEach(function(b){ b.onclick = function(){ setTheme(b.dataset.th); }; });
    document.getElementById('pfRn').onclick = function(){ if (typeof Social !== 'undefined') Social.renamePlayer(); };
    document.getElementById('pfSea').onclick = function(){
    if (typeof Season !== 'undefined' && online()) Season.open(); else if (typeof Conquest !== 'undefined') Conquest.openEndgame();};
    document.getElementById('pfSet').onclick = function(){ Settings.openSettings(); };
    document.getElementById('pfBug').onclick = function(){ if (typeof Bug !== 'undefined') Bug.open(); };
  }

  if (typeof Settings !== 'undefined'){ Settings.openSettings = Settings.open; Settings.open = open; }
  var sb = document.getElementById('setbtn');
  if (sb){ sb.textContent = '👤'; sb.title = 'โปรไฟล์'; }
  return { open:open, setTheme:setTheme, applyTheme:applyTheme };
})();