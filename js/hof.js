/* ============ หอเกียรติยศ — แบบแท็บ ============ */

var HOF = (function(){
  var tab = 'pop';

  var TABS = [
    { k:'pop',   n:'👥 ประชากร',  f:function(r){ return r.pop; } },
    { k:'atk',   n:'⚔️ โจมตี',    f:function(r){ return r.atk; } },
    { k:'def',   n:'🛡️ ป้องกัน',  f:function(r){ return r.def; } },
    { k:'raid',  n:'💰 ปล้น',      f:function(r){ return r.raid; } },
    { k:'vill',  n:'🏘 เมือง',     f:function(r){ return r.vills; } },
    { k:'guild', n:'🏯 กิลด์',     f:null }
  ];

  function rows(){
    var out = (Game.bots || []).filter(function(b){ return !b.dead; })
      .map(function(b){
        var g = Bots.guildOf(b.guild);
        return { name:b.name, tag: g ? g.tag : null, pop:b.pop,
          atk:b.atkPts, def:b.defPts, raid: Math.floor(b.atkPts*0.6),
          vills:b.vills.length, me:false };
      });
    var me = { name:Game.player.name,
      tag: Game.guild ? Game.guild.tag : null,
      pop:0, atk:Game.stats.atkPts, def:Game.stats.defPts,
      raid:Game.stats.raidPts, vills:Game.villages.length, me:true };
    Game.villages.forEach(function(v){ me.pop += population(v); });
    out.push(me);
    return out;
  }
  function guildRows(){
    var out = (Game.guilds || []).map(function(g){
      var p = 0, a = 0;
      (g.members||[]).forEach(function(bid){
        var b = (Game.bots||[])[bid];
        if (b && !b.dead){ p += b.pop; a += b.atkPts; }
      });
      var me = Game.guild && Game.guild.bot && Game.guild.id === g.id;
      if (me) Game.villages.forEach(function(v){ p += population(v); });
      return { name:g.name, tag:g.tag, n:(g.members||[]).length,
        pop:p, atk:a, me:me };
    });
    if (Game.guild && !Game.guild.bot){
      var p2 = 0;
      Game.villages.forEach(function(v){ p2 += population(v); });
      out.push({ name:Game.guild.name, tag:Game.guild.tag, n:1,
        pop:p2, atk:Game.stats.atkPts, me:true });
    }
    return out;
  }

  function open(t){
    if (t) tab = t;
    var h = '<h3>🏆 หอเกียรติยศ</h3>';
    h += '<div class="hoftabs">';
    TABS.forEach(function(x){
      h += '<button class="hoft' + (tab===x.k?' on':'') + '" data-hf="' + x.k +
        '">' + x.n + '</button>';
    });
    h += '</div><div id="hofbody"></div>';
    h += '<button class="btn-cancel" onclick="UI.close()">ปิด</button>';
    UI.modal(h);
    document.querySelectorAll('[data-hf]').forEach(function(b){
      b.onclick = function(){ tab = b.dataset.hf; open(); };
    });
    body();
  }

  function body(){
    var el = document.getElementById('hofbody');
    if (!el) return;
    var h = '';
    if (tab === 'guild'){
      var gr = guildRows();
      gr.sort(function(a,b){ return b.pop - a.pop; });
      h += '<div class="infobox">อันดับกิลด์เรียงตามประชากรรวม</div>';
      gr.forEach(function(r, i){
        h += '<div class="hof-row' + (r.me?' me':'') + '">' +
          '<div class="hof-rank r' + (i+1) + '">' + (i+1) + '</div>' +
          '<div class="hof-main"><b>[' + r.tag + '] ' + r.name +
          (r.me ? ' ★' : '') + '</b><i>' + r.n + ' สมาชิก · ⚔ ' +
          UI.fmt(r.atk) + '</i></div>' +
          '<div class="hof-val">' + UI.fmt(r.pop) + '</div></div>';
      });
      el.innerHTML = h;
      return;
    }
    var T = TABS.filter(function(x){ return x.k === tab; })[0];
    var rs = rows();
    rs.sort(function(a,b){ return T.f(b) - T.f(a); });
    var myRank = 0;
    rs.forEach(function(r, i){ if (r.me) myRank = i+1; });
    h += '<div class="infobox">อันดับของคุณ: <b style="color:#ffcf40">#' +
      myRank + '</b> จาก ' + rs.length + ' คน</div>';
    rs.slice(0, 50).forEach(function(r, i){
      h += '<div class="hof-row' + (r.me?' me':'') + '">' +
        '<div class="hof-rank r' + (i+1) + '">' + (i+1) + '</div>' +
        '<div class="hof-main"><b>' + r.name +
        (r.tag ? ' <i class="gt">[' + r.tag + ']</i>' : '') +
        (r.me ? ' ★' : '') + '</b>' +
        '<i>👥' + UI.fmt(r.pop) + ' · 🏘' + r.vills + '</i></div>' +
        '<div class="hof-val">' + UI.fmt(T.f(r)) + '</div></div>';
    });
    if (myRank > 50){
      var me = rs.filter(function(r){ return r.me; })[0];
      h += '<div class="hof-row me" style="margin-top:8px">' +
        '<div class="hof-rank">' + myRank + '</div>' +
        '<div class="hof-main"><b>' + me.name + ' ★</b>' +
        '<i>👥' + UI.fmt(me.pop) + ' · 🏘' + me.vills + '</i></div>' +
        '<div class="hof-val">' + UI.fmt(T.f(me)) + '</div></div>';
    }
    el.innerHTML = h;
  }

  return { open:open };
})();