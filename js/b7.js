/* ============ B7 v14N — ทำเนียบฤดูกาล · เหรียญตราในโปรไฟล์ ============ */
var B7 = (function(){
  var KN = { champ:'🏆', r1:'🥇', r2:'🥈', r3:'🥉', top10:'🎖', join:'🏯' }, mine = null, at = 0;
  function esc(s){ return String(s == null ? '' : s).replace(/[<>&"]/g, function(c){
    return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]; }); }
  function on(){ return typeof Sync !== 'undefined' && Sync.online && Sync.online(); }
  function d(t){ return new Date(t).toLocaleDateString('th-TH', { day:'numeric', month:'short', year:'2-digit' }); }

  function myBadges(cb){
    if (mine && Date.now() - at < 600000) return cb(mine);
    var u = (typeof Net !== 'undefined' && Net.uid) ? Net.uid() : '';
    if (!u) return cb([]);
    Api.get('/badges', { uid:u }, false).then(function(r){ mine = (r && r.list) || []; at = Date.now(); cb(mine); });
  }
  function chip(b){ return '<span class="bdg bdg-' + b.kind + '">' + (KN[b.kind] || '🎖') + '<i>' + esc(b.label) + '</i></span>'; }
  function card(s){
    var x = s.data || {};
    return '<div class="hofs"><div class="hofs-h"><b>ฤดูกาลที่ ' + s.n + '</b><span>' + d(s.start) + ' – ' + d(s.ended) + '<br>' +
      (x.days || '-') + ' วัน · 👥 ' + (x.players || 0) + ' คน</span></div>' +
      '<div class="hofs-w">🏆 ' + (s.winner ? esc(s.winner) : 'ไม่มีผู้ชนะ') + '</div>' +
      (x.top || []).slice(0, 5).map(function(p, i){
        return '<div class="hofs-r"><em>' + (['🥇','🥈','🥉'][i] || (i + 1)) + '</em><b>' + esc(p.name) +
          (p.tag ? ' <span class="gt">[' + esc(p.tag) + ']</span>' : '') + '</b><i>👥 ' + UI.fmt(p.pop) + '</i></div>';
      }).join('') +
      ((x.guilds || []).length ? '<div class="hofs-g">🏯 ' + x.guilds.slice(0, 3).map(function(g){
        return '[' + esc(g.tag) + '] ' + esc(g.name); }).join(' · ') + '</div>' : '') + '</div>';
  }
  function hof(){
    UI.modal('<h3>🏛 ทำเนียบฤดูกาล</h3><p class="stnone">กำลังโหลด…</p>');
    Api.get('/hof', null, false).then(function(r){
      var L = (r && r.list) || [];
      UI.modal('<h3>🏛 ทำเนียบฤดูกาล</h3>' + (L.length ? L.map(card).join('')
        : '<p class="stnone">ยังไม่มีฤดูกาลที่จบแล้ว<br>ฤดูกาลแรกกำลังดำเนินอยู่</p>') +
        '<button class="btn-cancel" onclick="UI.close()">ปิด</button>');
    });
  }
  function inject(){
    if (!on()) return;
    var mb = document.getElementById('modalbox'), st = mb && mb.querySelector('.pf-stats');
    if (!st || mb.querySelector('#pfBadges')) return;
    var box = document.createElement('div');
    box.id = 'pfBadges'; box.className = 'pf-badges';
    box.innerHTML = '<i class="pf-nob">กำลังโหลดเหรียญตรา…</i>';
    st.parentNode.insertBefore(box, st.nextSibling);
    var L = mb.querySelector('.pf-list');
    if (L && !mb.querySelector('#pfHof')){
      var b = document.createElement('button');
      b.id = 'pfHof'; b.className = 'pf-li';
      b.innerHTML = '<span>🏛</span>ทำเนียบฤดูกาล<em>›</em>';
      b.onclick = hof;
      L.insertBefore(b, L.firstChild);
    }
    myBadges(function(arr){
      if (!box.isConnected) return;
      box.innerHTML = arr.length ? arr.map(chip).join('') : '<i class="pf-nob">ยังไม่มีเหรียญตรา · จบฤดูกาลแล้วจะได้รับเหรียญ</i>';
    });
  }
  var q = false, mb = document.getElementById('modalbox');
  if (mb && typeof MutationObserver !== 'undefined')
    new MutationObserver(function(){
      if (q) return;
      q = true;
      requestAnimationFrame(function(){ q = false; try { inject(); } catch(e){} });
    }).observe(mb, { childList:true, subtree:true });
  return { hof:hof };
})();