/* ============ ระบบกิลด์เต็มรูปแบบ ============ */

var Guild = (function(){

  function myG(){
    if (!Game.guild) return null;
    if (Game.guild.bot) return Bots.guildOf(Game.guild.id);
    return Game.guild;
  }
  function maxMembers(){
    var m = 0;
    Game.villages.forEach(function(v){ m = Math.max(m, cityLevel(v,'embassy')); });
    return m * 3;
  }
  function hasEmbassy(){ return maxMembers() > 0; }

  function memberList(){
    var g = myG();
    if (!g) return [];
    var out = [{ name:Game.player.name, me:true, role:g.owner ? 'หัวหน้า' : 'สมาชิก',
      pop:0, atk:Game.stats.atkPts, def:Game.stats.defPts,
      vills:Game.villages.length, x:V().x, y:V().y }];
    Game.villages.forEach(function(v){ out[0].pop += population(v); });
    (g.members || []).forEach(function(bid){
      var b = (Game.bots || [])[bid];
      if (!b) return;
      out.push({ name:b.name, me:false,
        role: bid === (g.leader !== undefined ? g.leader : g.members[0])
              ? 'หัวหน้า' : 'สมาชิก',
        pop:b.pop, atk:b.atkPts, def:b.defPts, vills:b.vills.length,
        x:b.vills[0].x, y:b.vills[0].y, botId:bid });
    });
    out.sort(function(a,b){ return b.pop - a.pop; });
    return out;
  }
  function totalPop(g){
    var p = 0;
    (g.members || []).forEach(function(bid){
      var b = (Game.bots||[])[bid];
      if (b) p += b.pop;
    });
    if (myG() === g) Game.villages.forEach(function(v){ p += population(v); });
    return p;
  }

  /* ---------- สร้าง / เข้า / ออก ---------- */
  function create(name, tag){
    if (!hasEmbassy()) return 'ต้องสร้างสถานทูตก่อน';
    if (Game.guild) return 'คุณอยู่ในกิลด์แล้ว';
    if (Game.player.gold < CFG.GUILD_COST)
      return 'ต้องใช้ ' + CFG.GUILD_COST + ' ทองในการก่อตั้งกิลด์ (มี ' +
        Math.floor(Game.player.gold) + ')';
    name = (name||'').trim(); tag = (tag||'').trim().toUpperCase();
    if (name.length < 2) return 'ชื่อกิลด์สั้นเกินไป';
    if (tag.length < 2 || tag.length > 5) return 'แท็กต้องยาว 2-5 ตัวอักษร';
    Game.player.gold -= CFG.GUILD_COST;
    Game.guild = { id:'me', name:name, tag:tag, owner:true, bot:false,
      members:[], allies:[], enemies:[], notice:'',
      chat:[{ n:'ระบบ', t:'ก่อตั้งกิลด์ ' + name + ' สำเร็จ', at:now() }],
      apps:[], createdAt:now() };
    return null;
  }
  function apply(gid){
    if (!hasEmbassy()) return 'ต้องสร้างสถานทูตก่อน';
    if (Game.guild) return 'คุณอยู่ในกิลด์แล้ว';
    var g = Bots.guildOf(gid);
    if (!g) return 'ไม่พบกิลด์';
    if (!Game.pendingApp) Game.pendingApp = {};
    var pop = 0;
    Game.villages.forEach(function(v){ pop += population(v); });
    var wait = pop > 400 ? 1 : pop > 150 ? 3 : 6;
    Game.pendingApp = { gid:gid, at:now(), readyAt: now() + wait*3600000,
      ok: pop > 60 || Math.random() < 0.65 };
    return null;
  }
  function checkApp(){
    if (!Game.pendingApp || Game.guild) return false;
    if (now() < Game.pendingApp.readyAt) return false;
    var p = Game.pendingApp;
    Game.pendingApp = null;
    var g = Bots.guildOf(p.gid);
    if (!g) return false;
    if (p.ok){
      Game.guild = { id:p.gid, name:g.name, tag:g.tag, owner:false, bot:true };
      g.members.push(-1);
      Game.reports.unshift({ at:now(), x:V().x, y:V().y, mission:'guild',
        read:false, open:false, title:'🏯 ได้รับเข้ากิลด์ ' + g.name,
        body:'หัวหน้ากิลด์ <b>' + g.name + '</b> [' + g.tag +
          '] ตอบรับใบสมัครของคุณแล้ว<br>ตอนนี้คุณเป็นสมาชิกของกิลด์นี้' });
    } else {
      Game.reports.unshift({ at:now(), x:V().x, y:V().y, mission:'guild',
        read:false, open:false, title:'✕ ใบสมัครถูกปฏิเสธ',
        body:'กิลด์ <b>' + g.name + '</b> ปฏิเสธใบสมัคร<br>' +
          '<i>"อาณาจักรของท่านยังเล็กเกินไป ขอให้กลับมาใหม่เมื่อแข็งแกร่งขึ้น"</i>' });
    }
    return true;
  }
  function leave(){
    var g = myG();
    if (!g) return;
    if (Game.guild.bot && g.members){
      var i = g.members.indexOf(-1);
      if (i >= 0) g.members.splice(i, 1);
    }
    Game.guild = null;
  }

  /* ---------- การทูต ---------- */
  function diplo(gid, mode){
    var g = myG();
    if (!g) return 'ยังไม่มีกิลด์';
    if (!Game.guild.owner) return 'เฉพาะหัวหน้ากิลด์เท่านั้น';
    var t = Bots.guildOf(gid);
    if (!t) return 'ไม่พบกิลด์';
    g.allies = (g.allies||[]).filter(function(x){ return x !== gid; });
    g.enemies = (g.enemies||[]).filter(function(x){ return x !== gid; });
    t.allies = (t.allies||[]).filter(function(x){ return x !== 'me'; });
    t.enemies = (t.enemies||[]).filter(function(x){ return x !== 'me'; });
    if (mode === 'ally'){
      if (Math.random() < 0.55){
        g.allies.push(gid); t.allies.push('me');
        chat('ระบบ', 'ทำสัญญาพันธมิตรกับ ' + t.name + ' สำเร็จ');
      } else return t.name + ' ปฏิเสธข้อเสนอพันธมิตร';
    } else if (mode === 'war'){
      g.enemies.push(gid); t.enemies.push('me');
      chat('ระบบ', 'ประกาศสงครามกับ ' + t.name + '!');
      (t.members||[]).forEach(function(bid){
        var b = (Game.bots||[])[bid];
        if (b) b.grudge = 4;
      });
    }
    return null;
  }

  /* ---------- แชต ---------- */
  var BOT_MSG = [
    'ใครมีไม้เหลือ ส่งมาที่เมืองข้าหน่อย',
    'เพิ่งโดนปล้นไป กำลังสร้างกำแพงอยู่',
    'ป้อมทิศเหนือใกล้เปิดแล้ว เตรียมทัพกันไว้',
    'ข้าจะไปปล้นเมืองร้างแถว ๆ นี้ ใครไปด้วยไหม',
    'อย่าลืมอัปยุ้งฉาง ไม่งั้นข้าวล้นเสียเปล่า',
    'มีใครเห็นกองทัพศัตรูแถวนี้บ้าง',
    'ข้าตั้งเมืองที่ 2 ได้แล้ว!',
    'ใครมีเหล็กเหลือ ข้าแลกข้าวให้',
    'ระวังกิลด์ทางตะวันตก พวกมันดุมาก',
    'วีรบุรุษข้าเพิ่ง Lv.10 แล้ว'
  ];
  function chat(n, t){
    var g = myG();
    if (!g) return;
    if (!g.chat) g.chat = [];
    g.chat.push({ n:n, t:t, at:now() });
    if (g.chat.length > 60) g.chat.shift();
  }
  function botChat(){
    var g = myG();
    if (!g || !g.members || !g.members.length) return false;
    if (!g.chatAt) g.chatAt = 0;
    if (now() - g.chatAt < 1800000) return false;
    g.chatAt = now();
    var bid = g.members[Math.floor(Math.random()*g.members.length)];
    var b = (Game.bots||[])[bid];
    if (!b) return false;
    chat(b.name, BOT_MSG[Math.floor(Math.random()*BOT_MSG.length)]);
    return true;
  }
  function tick(){ return checkApp() || botChat(); }

  /* ---------- UI ---------- */
  var tab = 'main';
  function open(t){
    if (t) tab = t;
    if (!hasEmbassy()){
      UI.modal('<h3>🏯 ระบบกิลด์</h3><div class="infobox">' +
        'ต้องสร้าง <b>สถานทูต</b> ก่อนจึงจะสร้างหรือเข้าร่วมกิลด์ได้<br>' +
        'สถานทูตแต่ละระดับรับสมาชิกได้ 3 คน</div>' +
        '<button class="btn-cancel" onclick="UI.close()">ปิด</button>');
      return;
    }
    var g = myG();
    var h = '<h3>🏯 ' + (g ? '[' + g.tag + '] ' + g.name : 'ระบบกิลด์') + '</h3>';
    h += '<div class="btabs">' +
      '<button class="btab' + (tab==='main'?' on':'') + '" data-gt="main">ภาพรวม</button>' +
      (g ? '<button class="btab' + (tab==='mem'?' on':'') + '" data-gt="mem">สมาชิก</button>' +
           '<button class="btab' + (tab==='chat'?' on':'') + '" data-gt="chat">แชต</button>' : '') +
      '<button class="btab' + (tab==='rank'?' on':'') + '" data-gt="rank">อันดับ</button>' +
      '</div><div id="gbody"></div>' +
      '<button class="btn-cancel" onclick="UI.close()">ปิด</button>';
    UI.modal(h);
    document.querySelectorAll('[data-gt]').forEach(function(b){
      b.onclick = function(){ tab = b.dataset.gt; open(); };
    });
    if (tab === 'main') body_main();
    else if (tab === 'mem') body_mem();
    else if (tab === 'chat') body_chat();
    else body_rank();
  }

  function body_main(){
    var g = myG(), h = '';
    if (!g){
      if (Game.pendingApp){
        h += '<div class="infobox" style="border-color:#5a7a2e;color:#9fe07a">' +
          '⏳ ส่งใบสมัครไปยัง <b>' +
          Bots.guildOf(Game.pendingApp.gid).name + '</b> แล้ว<br>' +
          'รอคำตอบอีก ' + UI.dur((Game.pendingApp.readyAt - now())/1000) + '</div>';
      } else {
        h += '<div class="infobox">กิลด์ช่วยให้คุณมีพันธมิตร ส่งกำลังหนุนกัน ' +
          'และ <b>ป้อมที่สมาชิกยึดได้จะให้โบนัสทั้งกิลด์</b><br>' +
          'รับสมาชิกได้ <b>' + maxMembers() + ' คน</b> (สถานทูต Lv.' +
          Math.floor(maxMembers()/3) + ')</div>';
        h += '<h4>สร้างกิลด์ของคุณเอง</h4>';
        h += '<input type="text" id="gn" class="selbox" placeholder="ชื่อกิลด์" maxlength="20">';
        h += '<input type="text" id="gg" class="selbox" placeholder="แท็ก 2-5 ตัว" maxlength="5">';
        h += '<button class="btn-ok" id="gcreate">🏯 ก่อตั้งกิลด์ · 💰' +
          CFG.GUILD_COST + ' ทอง</button>';
        h += '<div style="font-size:10px;color:#8a7a55;text-align:center;' +
          'margin-top:3px">คุณมี ' + Math.floor(Game.player.gold) + ' ทอง</div>';
        h += '<h4>หรือสมัครเข้ากิลด์ที่มีอยู่</h4>';
        (Game.guilds||[]).forEach(function(bg){
          var full = (bg.members||[]).length >= 15;
          h += '<div class="gcard"><div class="vh"><b>[' + bg.tag + '] ' + bg.name +
            '</b><span>' + (bg.members||[]).length + ' คน</span></div>' +
            '<div class="vm"><i>👥 ' + UI.fmt(totalPop(bg)) + '</i>' +
            '<i>🤝 ' + (bg.allies||[]).length + '</i>' +
            '<i>⚔ ' + (bg.enemies||[]).length + '</i></div>' +
            (full ? '<div class="bc-lock">🔒 สมาชิกเต็ม</div>'
                  : '<button class="btn-use" data-gap="' + bg.id + '">ส่งใบสมัคร</button>') +
            '</div>';
        });
      }
    } else {
      var members = memberList();
      var forts = Conquest.fortsHeld();
      h += '<div class="row"><span>สมาชิก</span><b>' + members.length +
        ' / ' + maxMembers() + '</b></div>';
      h += '<div class="row"><span>ประชากรรวม</span><b>' +
        UI.fmt(totalPop(g)) + '</b></div>';
      h += '<div class="row"><span>ป้อมที่กิลด์ยึดได้</span>' +
        '<b style="color:#ffcf40">' + forts + ' / 8</b></div>';
      h += '<div class="row"><span>โบนัสกิลด์</span>' +
        '<b style="color:#8fbf5f">โจมตี +' + (forts*3) + '%</b></div>';
      h += '<div class="row"><span>ตำแหน่งของคุณ</span><b>' +
        (Game.guild.owner ? '👑 หัวหน้ากิลด์' : 'สมาชิก') + '</b></div>';
      if (g.notice)
        h += '<div class="infobox" style="border-color:#6b552f">📢 <b>ประกาศ</b><br>' +
          g.notice + '</div>';
      if (Game.guild.owner){
        h += '<button class="btn-use" id="gnotice">📢 แก้ไขประกาศ</button>';
        h += '<h4>การทูต</h4>';
        (Game.guilds||[]).forEach(function(bg){
          var st = (g.allies||[]).indexOf(bg.id) >= 0 ? 'ally'
                 : (g.enemies||[]).indexOf(bg.id) >= 0 ? 'war' : 'none';
          h += '<div class="row"><span>[' + bg.tag + '] ' + bg.name +
            '<br><i style="font-size:10px;color:' +
            (st==='ally' ? '#ffd24d' : st==='war' ? '#ff6b6b' : '#8a7a55') + '">' +
            (st==='ally' ? '🤝 พันธมิตร' : st==='war' ? '⚔ สงคราม' : 'เป็นกลาง') +
            '</i></span><span style="display:flex;gap:4px">' +
            '<button class="mini" data-dip="ally" data-g="' + bg.id + '">🤝</button>' +
            '<button class="mini" data-dip="war" data-g="' + bg.id + '">⚔</button>' +
            '</span></div>';
        });
      }
      h += '<button class="btn-del" id="gleave">ออกจากกิลด์</button>';
    }
    document.getElementById('gbody').innerHTML = h;

    var cb = document.getElementById('gcreate');
    if (cb) cb.onclick = function(){
      var err = create(document.getElementById('gn').value,
        document.getElementById('gg').value);
      if (err) return alert(err);
      save(); open('main');
    };
    document.querySelectorAll('[data-gap]').forEach(function(b){
      b.onclick = function(){
        var err = apply(+b.dataset.gap);
        if (err) return alert(err);
        save(); open('main');
        alert('ส่งใบสมัครแล้ว รอหัวหน้ากิลด์ตอบรับ');
      };
    });
    var nb = document.getElementById('gnotice');
    if (nb) nb.onclick = function(){
      var t = prompt('ประกาศถึงสมาชิก:', myG().notice || '');
      if (t !== null){ myG().notice = t.slice(0,160); save(); open('main'); }
    };
    document.querySelectorAll('[data-dip]').forEach(function(b){
      b.onclick = function(){
        var err = diplo(+b.dataset.g, b.dataset.dip);
        if (err) return alert(err);
        save(); open('main');
      };
    });
    var lb = document.getElementById('gleave');
    if (lb) lb.onclick = function(){
      if (!confirm('ออกจากกิลด์?')) return;
      leave(); save(); open('main'); UI.refreshAll();
    };
  }

  function body_mem(){
    var h = '';
    memberList().forEach(function(m, i){
      h += '<div class="gcard' + (m.me ? ' me' : '') + '">' +
        '<div class="vh"><b>' + (m.role==='หัวหน้า' ? '👑 ' : '') + m.name +
        (m.me ? ' (คุณ)' : '') + '</b><span>(' + m.x + '|' + m.y + ')</span></div>' +
        '<div class="vm"><i>👥 ' + UI.fmt(m.pop) + '</i>' +
        '<i>🏘 ' + m.vills + '</i>' +
        '<i>⚔ ' + UI.fmt(m.atk) + '</i>' +
        '<i>🛡 ' + UI.fmt(m.def) + '</i></div>' +
        (m.me ? '' : '<div class="grow2">' +
          '<button class="mini" data-gsup="' + m.x + ',' + m.y + '">🛡 ส่งกำลังหนุน</button>' +
          '<button class="mini" data-gmap="' + m.x + ',' + m.y + '">🗺 ดูบนแผนที่</button>' +
          '</div>') + '</div>';
    });
    document.getElementById('gbody').innerHTML = h;
    document.querySelectorAll('[data-gsup]').forEach(function(b){
      b.onclick = function(){
        var p = b.dataset.gsup.split(',');
        UI.close(); MilUI.openRally(+p[0], +p[1]);
      };
    });
    document.querySelectorAll('[data-gmap]').forEach(function(b){
      b.onclick = function(){
        var p = b.dataset.gmap.split(',');
        UI.close(); UI.showPage('world'); Renderer.center(+p[0], +p[1]);
      };
    });
  }

  function body_chat(){
    var g = myG();
    var h = '<div class="gchat" id="gchat">';
    (g.chat || []).slice(-40).forEach(function(m){
      h += '<div class="gmsg' + (m.n === Game.player.name ? ' me' : '') +
        (m.n === 'ระบบ' ? ' sys' : '') + '">' +
        '<b>' + m.n + '</b> <i>' +
        new Date(m.at).toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'}) +
        '</i><div>' + m.t + '</div></div>';
    });
    if (!(g.chat||[]).length)
      h += '<p style="color:#8a7a55;text-align:center;font-size:12px;padding:20px">' +
        'ยังไม่มีข้อความ</p>';
    h += '</div><div class="grow2">' +
      '<input type="text" id="gmsg" class="selbox" style="margin:0" ' +
      'placeholder="พิมพ์ข้อความ..." maxlength="120">' +
      '<button class="btn-ok mini2" id="gsend">ส่ง</button></div>';
    document.getElementById('gbody').innerHTML = h;
    var box = document.getElementById('gchat');
    if (box) box.scrollTop = box.scrollHeight;
    document.getElementById('gsend').onclick = function(){
      var el = document.getElementById('gmsg');
      var t = el.value.trim();
      if (!t) return;
      chat(Game.player.name, t);
      el.value = '';
      save(); open('chat');
    };
  }

  function body_rank(){
    var rows = (Game.guilds || []).map(function(bg){
      return { name:bg.name, tag:bg.tag, n:(bg.members||[]).length,
        pop:totalPop(bg), me:false };
    });
    var mg = myG();
    if (mg && !mg.bot){
      var p = 0;
      Game.villages.forEach(function(v){ p += population(v); });
      rows.push({ name:mg.name, tag:mg.tag, n:1, pop:p, me:true });
    } else if (mg){
      rows.forEach(function(r){ if (r.tag === mg.tag) r.me = true; });
    }
    rows.sort(function(a,b){ return b.pop - a.pop; });
    var h = '<div class="infobox">อันดับกิลด์เรียงตามประชากรรวม</div>';
    rows.forEach(function(r, i){
      h += '<div class="hof-row"' + (r.me ? ' style="background:#241d14"' : '') + '>' +
        '<div class="hof-rank r' + (i+1) + '">' + (i+1) + '</div>' +
        '<div class="hof-main"><b>[' + r.tag + '] ' + r.name +
        (r.me ? ' ★' : '') + '</b><i>' + r.n + ' สมาชิก</i></div>' +
        '<div class="hof-val">' + UI.fmt(r.pop) + '</div></div>';
    });
    document.getElementById('gbody').innerHTML = h;
  }

  return { open:open, create:create, apply:apply, leave:leave, tick:tick,
    myG:myG, maxMembers:maxMembers, memberList:memberList, chat:chat };
})();