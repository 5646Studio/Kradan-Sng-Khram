/* ============ main v14 — ออฟไลน์ / ออนไลน์ (เซิร์ฟเวอร์กลาง) ============ */
(function(){
  var ONLINE = false;

  function box(h){
    document.getElementById('modalbox').innerHTML = h;
    document.getElementById('modal').classList.remove('hidden');
  }
  function hideBox(){ document.getElementById('modal').classList.add('hidden'); }

  /* ---------- เลือกเผ่า / ดินแดน ---------- */
  function pickTribe(next){
    var h = '<h3>เลือกเผ่าของคุณ</h3>' +
      '<p style="font-size:11px;color:#8a7a55;margin-bottom:8px">' +
      CFG.GAME_NAME + ' · เซิร์ฟเวอร์ ' + CFG.SERVER_NAME + '</p>';
    TRIBES.forEach(function(t, i){
      h += '<div class="bcard" data-tribe="' + i + '"><div class="bc-h"><b style="color:#ffcf40">' +
        t.name + '</b></div><div class="bc-d">' + t.desc + '</div></div>';
    });
    box(h);
    document.querySelectorAll('[data-tribe]').forEach(function(n){
      n.onclick = function(){ Game.player.tribe = +n.dataset.tribe; pickZone(next); };
    });
  }
  function pickZone(next){
    var ord = [2, 1, 3, 4];
    var h = '<h3>เลือกดินแดนเริ่มต้น</h3>' +
      '<p style="font-size:11px;color:#8a7a55;line-height:1.6">แต่ละดินแดนเด่นคนละทรัพยากร<br>' +
      'เมืองแรกได้หลุม <b>8/4/4/4 เท่ากัน</b> · <b style="color:#8fbf5f">คุ้มครอง ' +
      CFG.PROTECT_DAYS + ' วัน</b></p><div class="zgrid">';
    ord.forEach(function(id){
      var z = ZONES.filter(function(q){ return q.id === id; })[0];
      h += '<button class="zbtn" data-zone="' + z.id + '"><span class="zic">' + z.ic + '</span>' +
        '<span class="znm">' + z.name.split('—')[0].trim() + '</span>' +
        '<span class="zres">เด่น ' + RES_TH[z.res] + '</span>' +
        '<span class="zds">' + z.name.split('—')[1].trim() + '</span></button>';
    });
    h += '</div><div class="zhint">เมืองหลวงจะเกิดเมื่อคุณสร้างพระราชวัง</div>';
    box(h);
    document.querySelectorAll('[data-zone]').forEach(function(n){
      n.onclick = function(){
        var z = +n.dataset.zone;
        Game.player.quadrant = z;
        hideBox();
        next(z);
      };
    });
  }

  /* ---------- ออฟไลน์ ---------- */
  function startOffline(){
    var s = World.findSpawnZone(Game.player.quadrant);
    Game.villages = [ newVillage(s.x, s.y, 'เมืองแรก', true) ];
    Game.active = 0;
    Game.startedAt = Date.now(); Game.timeShift = 0;
    Game.protectUntil = Date.now() + CFG.PROTECT_DAYS * 86400000;
    Game.protectBroken = false;
    Game.movements = []; Game.incoming = []; Game.reports = [];
    Game.npc = {}; Game.oasis = {}; Game.forts = {}; Game.trades = [];
    Game.offers = []; Game.offerAt = 0; Game.sched = []; Game.schedUntil = 0;
    Game.stationed = []; Game.bookmarks = []; Game.allySup = [];
    Game.capital = { owner:null, since:0, loyalty:100 };
    Game.guild = null; Game.pendingApp = null; Game.allies = []; Game.enemies = [];
    Game.stats = { atkPts:0, defPts:0, raidPts:0 };
    Game.quest = 0; Game.questDone = []; Game.tutorialSkip = true;
    Game.builders = 2; Game.builderUntil = 0;
    Game.player.cp = 0; Game.won = false;
    if (typeof Bots !== 'undefined') Bots.init();
    save(); run();
  }
  function bootOffline(){
    if (typeof Account !== 'undefined'){
      if (!Account.current()){ location.replace('index.html'); return; }
      CFG.SAVE_KEY = Account.saveKey();
    }
    var isNew = qs('new') === '1';
    if (isNew) Store.del(CFG.SAVE_KEY);
    if (!isNew && load()){
      if (!Game.bots || !Game.bots.length) Bots.init();
      run();
    } else {
      Game.player.name = Store.get('sw_s1_name') || 'เจ้านคร';
      pickTribe(startOffline);
    }
  }

  /* ---------- ออนไลน์ ---------- */
  function registerOnline(zone){
    var name = (Store.get('sw_s1_name') || '').trim();
    if (name.length < 2){
      var u = Net.me();
      name = ((u && u.displayName) || '').slice(0, 16).trim();
    }
    if (name.length < 2) name = (prompt('ตั้งชื่อเจ้านคร (2-16 ตัวอักษร)', '') || '').trim();
    if (name.length < 2) return pickZone(registerOnline);
    box('<h3>⏳ กำลังสร้างเมืองแรก…</h3>');
    Sync.register(name, Game.player.tribe || 0, zone, function(err){
      if (!err){ hideBox(); run(); return; }
      if (/ชื่อ/.test(err)){
        var nn = prompt(err + '\nกรุณาตั้งชื่อใหม่', name);
        if (nn && nn.trim().length >= 2){
          Store.set('sw_s1_name', nn.trim());
          return registerOnline(zone);
        }
      } else alert(err);
      pickZone(registerOnline);
    });
  }
  function bootOnline(){
    ONLINE = true;
    box('<h3>⏳ กำลังเชื่อมต่อเซิร์ฟเวอร์…</h3>' +
      '<p style="font-size:11px;color:#8a7a55">เซิร์ฟเวอร์ ' + CFG.SERVER_NAME + '</p>');
    Sync.start(function(st, err){
      if (st === 'nologin') return location.replace('index.html');
      if (st === 'new'){ hideBox(); return pickTribe(registerOnline); }
      if (st === 'ok'){ hideBox(); return run(); }
      box('<h3>⚠ เชื่อมต่อเซิร์ฟเวอร์ไม่ได้</h3><div class="infobox">' + (err || '') +
        '</div><button class="btn-ok" onclick="location.reload()">🔄 ลองใหม่</button>' +
        '<button class="btn-cancel" onclick="location.href=\'index.html\'">กลับหน้าหลัก</button>');
    });
  }

  /* ---------- วนรอบทุก 1 วินาที ---------- */
  function safeTick(M, nm){
    try { if (M && typeof M.tick === 'function') return !!M.tick(); }
    catch(e){ logErr(nm, e); }
    return false;
  }
  function tickAll(){
    try {
      if (!Game.villages.length) return;
      var v = V();
      refresh(v);
      var chg = processQueue(v);

      if (!ONLINE){
        if (safeTick(typeof Military !== 'undefined' ? Military : null, 'Military')) chg = true;
        if (safeTick(typeof Market   !== 'undefined' ? Market   : null, 'Market'))   chg = true;
        if (safeTick(typeof Schedule !== 'undefined' ? Schedule : null, 'Schedule')) chg = true;
        if (safeTick(typeof Hero     !== 'undefined' ? Hero     : null, 'Hero'))     chg = true;
        if (safeTick(typeof Dungeon  !== 'undefined' ? Dungeon  : null, 'Dungeon'))  chg = true;
        if (safeTick(typeof Guild    !== 'undefined' ? Guild    : null, 'Guild'))    chg = true;
        if (safeTick(typeof Station  !== 'undefined' ? Station  : null, 'Station'))  chg = true;
        try {
          if (typeof Bots !== 'undefined' &&
              (!window.__botSync || now() - window.__botSync > 60000)){
            Bots.sync(); window.__botSync = now();
          }
        } catch(e){ logErr('Bots.sync', e); }
        try {
          if (typeof Conquest !== 'undefined' && Conquest.checkVictory && Conquest.checkVictory()){
            alert('🏆 คุณชนะเซิร์ฟเวอร์ ' + CFG.SERVER_NAME + ' แล้ว!');
            save();
          }
        } catch(e){ logErr('victory', e); }
      }

      Game.player.cp += cpPerDay() / 86400 * CFG.SPEED;
      try { if (typeof HUD !== 'undefined') HUD.update(); } catch(e){ logErr('HUD', e); }

      if (chg){
        UI.refreshAll();
        if (typeof MilUI !== 'undefined') MilUI.updateBadge();
        if (document.getElementById('page-reports').classList.contains('active'))
          MilUI.renderReports();
        save();
      } else {
        UI.renderTop();
        if (typeof Quest !== 'undefined') Quest.updateBadge();
      }
    } catch(err){ logErr('tickAll', err); }
  }

  /* ---------- เริ่มหน้าจอเกม ---------- */
  function run(){
    try {
      if (!ONLINE && typeof Bots !== 'undefined') Bots.reindex();
      if (typeof Hero !== 'undefined' && Hero.hook) Hero.hook();
      Renderer.init();
      FieldView.init();
      if (typeof HUD !== 'undefined') HUD.init();
      Renderer.center(V().x, V().y);
      if (ONLINE) Sync.ready();

      document.querySelectorAll('#navbar button').forEach(function(b){
        b.onclick = function(){ UI.showPage(b.dataset.page); };
      });
      function bind(id, fn){ var e = document.getElementById(id); if (e) e.onclick = fn; }
      bind('setbtn',  function(){ Settings.open(); });
      bind('vilbtn',  function(){ UI.openVillages(); });
      bind('goldbox', function(){ UI.openGold(); });
      bind('popbox',  function(){ UI.openResDetail('wheat'); });
      document.querySelectorAll('[data-res]').forEach(function(el){
        el.onclick = function(){ UI.openResDetail(el.dataset.res); };
      });
      document.getElementById('modal').onclick = function(e){
        if (e.target.id === 'modal') UI.close();
      };

      UI.showPage('village');
      UI.refreshAll();
      if (typeof MilUI !== 'undefined') MilUI.updateBadge();
      if (typeof Quest !== 'undefined') Quest.updateBadge();

      window.__timers = [];
      window.__timers.push(setInterval(tickAll, 1000));
      if (!ONLINE) window.__timers.push(setInterval(function(){ save(); }, 20000));
      window.addEventListener('beforeunload', function(){ save(); });

      console.log('%c[' + CFG.GAME_NAME + ' v14 ' + (ONLINE ? 'ONLINE' : 'OFFLINE') + '] (' +
        V().x + '|' + V().y + ')', 'background:#ffcf40;color:#000;padding:2px 6px');
    } catch(e){
      logErr('run', e);
      alert('เกิดข้อผิดพลาดตอนเริ่มเกม: ' + e.message);
    }
  }

  function boot(){
    try {
      if (typeof Sync !== 'undefined' && Sync.wanted()) bootOnline();
      else bootOffline();
    } catch(e){
      logErr('boot', e);
      alert('เกิดข้อผิดพลาดตอนโหลด: ' + e.message);
    }
  }

  var booted = false;
  function safeBoot(){ if (booted) return; booted = true; boot(); }
  setTimeout(safeBoot, 2000);
  try { Assets.load(safeBoot); } catch(e){ safeBoot(); }
})();