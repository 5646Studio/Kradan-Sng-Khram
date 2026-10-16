/* ============ B3 v14d — ภารกิจออนไลน์ · อันดับกิลด์ ============ */
var B3 = (function(){
  var Q = null, rk = 'pop';
  function esc(s){ return String(s == null ? '' : s).replace(/[<>&"]/g, function(c){
    return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]; }); }

  function onState(r){ Q = r.quest || null; badge(); }
  function badge(){
    var ready = !!(Q && Q.ready && Q.i < Q.total);
    var b = document.getElementById('qbadge');
    if (b) b.classList.toggle('hidden', !ready);
    var q = document.getElementById('questbtn');
    if (q) q.classList.toggle('ready', ready);
  }
  function rw(r){
    if (!r) return '—';
    var a = [];
    if (r.res) a.push('🌾🪵⛏️🧱 อย่างละ ' + UI.fmt(r.res));
    if (r.gold) a.push('💰 ' + r.gold + ' ทอง');
    return a.join(' · ');
  }

  function openQuest(){
    var h = '<h3>📜 ภารกิจ</h3>';
    if (!Q) h += '<p class="stnone">กำลังโหลด…</p>';
    else if (Q.i >= Q.total)
      h += '<div class="qcard ok"><div class="qt">🎉 ทำภารกิจครบทุกข้อแล้ว</div>' +
        '<div class="qd">ภารกิจชุดใหม่จะมาในอัปเดตถัดไป</div></div>';
    else {
      h += '<div class="qbar"><i style="width:' + Math.round(Q.i / Q.total * 100) + '%"></i></div>' +
        '<div class="qcard' + (Q.ready ? ' ok' : '') + '"><div class="qnum">ภารกิจที่ ' + (Q.i + 1) + ' / ' + Q.total +
        '</div><div class="qt">' + esc(Q.t) + '</div><div class="qd">' + esc(Q.d) + '</div>' +
        '<div class="qrw">🎁 ' + rw(Q.r) + '</div></div>' +
        (Q.ready ? '<button class="btn-ok" id="qClaim">🎁 รับรางวัล</button>'
                 : '<div class="eta">ยังไม่สำเร็จ ทำให้ครบแล้วกลับมากดรับรางวัล</div>');
    }
    h += '<button class="btn-cancel" onclick="UI.close()">ปิด</button>';
    UI.modal(h);
    var c = document.getElementById('qClaim');
    if (c) c.onclick = function(){
      c.disabled = true;
      Sync.cmd('/quest/claim', { vid:V().id }, function(r){
        if (r && r.ok){ Sync.toast('🎁 ได้รับรางวัลแล้ว'); openQuest(); }
        else c.disabled = false;
      });
    };
  }

  function openRank(){
    UI.modal('<h3>🏆 อันดับ</h3><p class="stnone">กำลังโหลด…</p>');
    Api.get('/rank', { f:rk }, false).then(function(r){
      var h = '<h3>🏆 อันดับ</h3><div class="hoftabs">' +
        '<button class="hoft' + (rk === 'pop' ? ' on' : '') + '" data-rk="pop">👥 ประชากร</button>' +
        '<button class="hoft' + (rk === 'vc' ? ' on' : '') + '" data-rk="vc">🏘 เมือง</button>' +
        '<button class="hoft' + (rk === 'g' ? ' on' : '') + '" data-rk="g">🏯 กิลด์</button></div>';
      if (!r.ok) h += '<p class="stnone">' + esc(r.err || 'โหลดไม่สำเร็จ') + '</p>';
      else if (!(r.list || []).length) h += '<p class="stnone">ยังไม่มีข้อมูล</p>';
      else r.list.forEach(function(p, i){
        if (rk === 'g'){
          h += '<div class="hof-row"><div class="hof-rank r' + (i + 1) + '">' + (i + 1) + '</div><div class="hof-main"><b>[' +
            esc(p.tag) + '] ' + esc(p.name) + '</b><i>👥 ' + p.mc + ' สมาชิก · 🏘 ' + p.vc + ' เมือง</i></div>' +
            '<div class="hof-val">' + UI.fmt(p.pop) + '</div></div>';
          return;
        }
        var me = p.name === Game.player.name;
        h += '<div class="hof-row' + (me ? ' me' : '') + '"><div class="hof-rank r' + (i + 1) + '">' + (i + 1) +
          '</div><div class="hof-main"><b>' + esc(p.name) + (p.tag ? ' <span class="gt">[' + esc(p.tag) + ']</span>' : '') +
          (me ? ' ★' : '') + '</b><i>🏘 ' + p.vc + ' เมือง</i></div><div class="hof-val">' +
          UI.fmt(rk === 'vc' ? p.vc : p.pop) + '</div></div>';
      });
      h += '<button class="btn-cancel" onclick="UI.close()">ปิด</button>';
      UI.modal(h);
      document.querySelectorAll('[data-rk]').forEach(function(b){
        b.onclick = function(){ rk = b.dataset.rk; openRank(); };
      });
    });
  }

  function install(){
    if (typeof Quest !== 'undefined'){ Quest.open = openQuest; Quest.updateBadge = badge; }
    if (typeof HOF !== 'undefined') HOF.open = openRank;
  }
  return { onState:onState, install:install, openQuest:openQuest, openRank:openRank };
})();