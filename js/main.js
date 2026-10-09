(function(){
  function box(h){
    document.getElementById('modalbox').innerHTML = h;
    document.getElementById('modal').classList.remove('hidden');
  }

  function pickTribe(){
    var h = '<h3>เลือกเผ่าของคุณ</h3>' +
      '<p style="font-size:11px;color:#8a7a55;margin-bottom:8px">' +
      CFG.GAME_NAME + ' · ' + CFG.SERVER_NAME + ' · ผู้เล่น ' + CFG.BOT_COUNT + ' คน</p>';
    TRIBES.forEach(function(t, i){
      h += '<div class="bcard" data-tribe="' + i + '">' +
        '<div class="bc-h"><b style="color:#ffcf40">' + t.name + '</b></div>' +
        '<div class="bc-d">' + t.desc + '</div></div>';
    });
    box(h);
    document.querySelectorAll('[data-tribe]').forEach(function(n){
      n.onclick = function(){ Game.player.tribe = +n.dataset.tribe; pickZone(); };
    });
  }

    function pickZone(){
    var ord = [2, 1, 3, 4];   /* ซ้ายบน · ขวาบน · ซ้ายล่าง · ขวาล่าง */
    var h = '<h3>เลือกดินแดนเริ่มต้น</h3>' +
      '<p style="font-size:11px;color:#8a7a55;line-height:1.6">' +
      'แต่ละดินแดนเด่นคนละทรัพยากร<br>' +
      'เมืองแรกได้หลุม <b>8/4/4/4 เท่ากัน</b> · ' +
      '<b style="color:#8fbf5f">คุ้มครอง ' + CFG.PROTECT_DAYS + ' วัน</b></p>';
    h += '<div class="zgrid">';
    ord.forEach(function(id){
      var z = ZONES.filter(function(q){ return q.id === id; })[0];
      h += '<button class="zbtn" data-zone="' + z.id + '">' +
        '<span class="zic">' + z.ic + '</span>' +
        '<span class="znm">' + z.name.split('—')[0].trim() + '</span>' +
        '<span class="zres">เด่น ' + RES_TH[z.res] + '</span>' +
        '<span class="zds">' + z.name.split('—')[1].trim() + '</span>' +
        '</button>';
    });
    h += '</div><div class="zhint">เมืองหลวงจะเกิดเมื่อคุณสร้างพระราชวัง</div>';
    box(h);
    document.querySelectorAll('[data-zone]').forEach(function(n){
      n.onclick = function(){
        Game.player.quadrant = +n.dataset.zone;
        document.getElementById('modal').classList.add('hidden');
        startGame();
      };
    });
  }
  
  function startGame(){
    var s = World.findSpawnZone(Game.player.quadrant);
    Game.villages = [ newVillage(s.x, s.y, 'เมืองแรก', true) ];
    Game.active = 0;
    Game.startedAt = Date.now();
    Game.timeShift = 0;
    Game.protectUntil = Date.now() + CFG.PROTECT_DAYS*86400000;
    Game.protectBroken = false;
    Game.movements = []; Game.incoming = []; Game.reports = [];
    Game.npc = {}; Game.oasis = {}; Game.forts = {}; Game.trades = [];
    Game.offers = []; Game.offerAt = 0; Game.sched = []; Game.schedUntil = 0;
    Game.capital = { owner:null, since:0, loyalty:100 };
    Game.guild = null; Game.pendingApp = null;
    Game.allies = []; Game.enemies = [];
    Game.stats = { atkPts:0, defPts:0, raidPts:0 };
    Game.quest = 0; Game.questDone = []; Game.tutorialSkip = true;
    Game.builders = 2; Game.builderUntil = 0;
    Game.player.cp = 0;
    Game.won = false;
    Game.stationed = []; Game.bookmarks = []; Game.allySup = [];

    if (typeof Bots !== 'undefined') Bots.init();
    save(); run();
  }

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
      var chg = false;
      if (processQueue(v)) chg = true;

      if (safeTick(typeof Military !== 'undefined' ? Military : null, 'Military')) chg = true;
      if (safeTick(typeof Market   !== 'undefined' ? Market   : null, 'Market'))   chg = true;
      if (safeTick(typeof Schedule !== 'undefined' ? Schedule : null, 'Schedule')) chg = true;
      if (safeTick(typeof Hero     !== 'undefined' ? Hero     : null, 'Hero'))     chg = true;
      if (safeTick(typeof Dungeon  !== 'undefined' ? Dungeon  : null, 'Dungeon'))  chg = true;
      if (safeTick(typeof Guild    !== 'undefined' ? Guild    : null, 'Guild'))    chg = true;
      if (safeTick(typeof Station  !== 'undefined' ? Station  : null, 'Station'))  chg = true;

      try {
        if (typeof Bots !== 'undefined'){
          if (!window.__botSync || now() - window.__botSync > 60000){
            Bots.sync(); window.__botSync = now();
          }
        }
      } catch(e){ logErr('Bots.sync', e); }

      Game.player.cp += cpPerDay() / 86400 * CFG.SPEED;

      try {
        if (typeof Conquest !== 'undefined' && Conquest.checkVictory &&
            Conquest.checkVictory()){
          alert('🏆 คุณชนะเซิร์ฟเวอร์ ' + CFG.SERVER_NAME + ' แล้ว!');
          save();
        }
      } catch(e){ logErr('victory', e); }

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

  function run(){
    try {
      if (typeof Bots !== 'undefined') Bots.reindex();
      if (typeof Hero !== 'undefined') Hero.hook();
      Renderer.init();
      FieldView.init();
      if (typeof HUD !== 'undefined') HUD.init();
      Renderer.center(V().x, V().y);
      UI.refreshAll();
      if (typeof MilUI !== 'undefined') MilUI.updateBadge();
      if (typeof Quest !== 'undefined') Quest.updateBadge();

      document.querySelectorAll('#navbar button').forEach(function(b){
        b.onclick = function(){ UI.showPage(b.dataset.page); };
      });
      var bind = function(id, fn){
        var e = document.getElementById(id);
        if (e) e.onclick = fn;
      };
      bind('troopbtn', function(){ MilUI.openTroops(); });
      bind('questbtn', function(){ Quest.open(); });
      bind('setbtn',   function(){ Settings.open(); });
      bind('vilbtn',   function(){ UI.openVillages(); });
      bind('hofbtn',   function(){ HOF.open(); });
      bind('goldbox',  function(){ UI.openGold(); });
      bind('popbox',   function(){ UI.openResDetail('wheat'); });
      document.querySelectorAll('[data-res]').forEach(function(el){
        el.onclick = function(){ UI.openResDetail(el.dataset.res); };
      });
      document.getElementById('modal').onclick = function(e){
        if (e.target.id === 'modal') UI.close();
      };

      window.__timers = [];
      window.__timers.push(setInterval(tickAll, 1000));
      window.__timers.push(setInterval(function(){ save(); }, 20000));
      window.addEventListener('beforeunload', function(){ save(); });

      console.log('%c[' + CFG.GAME_NAME + ' v12] (' + V().x + '|' + V().y + ')',
        'background:#ffcf40;color:#000;padding:2px 6px');
    } catch(e){
      logErr('run', e);
      alert('เกิดข้อผิดพลาดตอนเริ่มเกม: ' + e.message);
    }
  }

  function boot(){
    try {
      var isNew = qs('new') === '1';
      var nm = Store.get('sw_s1_name');
      if (isNew) Store.del(CFG.SAVE_KEY);
      if (!isNew && load()){
        if (!Game.bots || !Game.bots.length) Bots.init();
        run();
      } else {
        Game.player.name = nm || 'เจ้านคร';
        pickTribe();
      }
    } catch(e){
      logErr('boot', e);
      alert('เกิดข้อผิดพลาดตอนโหลด: ' + e.message);
    }
  }
  var booted = false;
  function safeBoot(){
    if (booted) return;
    if (window.NET_WAIT){ window.__bootRetry = safeBoot; return; }
    booted = true; boot();
  }
  setTimeout(safeBoot, 2500);
  try { Assets.load(safeBoot); } catch(e){ safeBoot(); }
})();