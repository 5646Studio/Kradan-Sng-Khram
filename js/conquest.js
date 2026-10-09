var Conquest = (function(){
  
  function daysElapsed(){
    return (now() - Game.startedAt) / 86400000 * CFG.SPEED;
  }

  function oasisSlots(v){
    var lv = cityLevel(v, 'hero');
    return lv >= 20 ? 3 : lv >= 15 ? 2 : lv >= 10 ? 1 : 0;
  }
  function ownedOasisOf(v){
    var out = [];
    for (var k in Game.oasis) if (Game.oasis[k] === v.id) out.push(k);
    return out;
  }
    /* ★ v12c — ระยะยึด 30 ช่อง ★ */
  function oasisMax(v){
    var hl = cityLevel(v, 'hero');
    if (hl >= 20) return 4;
    if (hl >= 15) return 3;
    if (hl >= 10) return 2;
    if (hl >= 1)  return 1;
    return 0;
  }
  function oasisCount(v){
    var n = 0;
    for (var k in (Game.oasis||{})) if (Game.oasis[k] === v.id) n++;
    return n;
  }
  function oasisList(v){
    var out = [];
    for (var k in (Game.oasis||{})){
      if (Game.oasis[k] !== v.id) continue;
      var p = k.split(',');
      var t = World.tile(+p[0], +p[1]);
      if (t.oasis) out.push({ x:+p[0], y:+p[1], o:t.oasis });
    }
    return out;
  }
  function oasisBonus(v, res){
    var b = 0;
    oasisList(v).forEach(function(e){
      if (e.o.type === res) b += e.o.pct/100;
      else if (e.o.type === 'double' && (res === 'wheat' || res === 'wood'))
        b += e.o.pct/100;
    });
    return b;
  }
  function canCaptureOasis(v, x, y){
    var t = World.tile(x, y);
    if (!t.oasis) return 'ช่องนี้ไม่ใช่โอเอซิส';
    var k = x + ',' + y;
    if (Game.oasis[k] === v.id) return 'เมืองนี้ยึดไว้แล้ว';
    if (Game.oasis[k]) return 'เมืองอื่นของคุณยึดไว้แล้ว';
    var d = Math.sqrt(Math.pow(v.x-x,2) + Math.pow(v.y-y,2));
    if (d > CFG.OASIS_RANGE)
      return 'ไกลเกินไป (' + d.toFixed(1) + ' ช่อง · ยึดได้ไม่เกิน ' +
        CFG.OASIS_RANGE + ')';
    var mx = oasisMax(v);
    if (mx <= 0) return 'ต้องสร้างจวนวีรบุรุษก่อน';
    if (oasisCount(v) >= mx)
      return 'เมืองนี้ยึดครบ ' + mx + ' แห่งแล้ว (อัปจวนวีรบุรุษเพื่อเพิ่ม)';
    return null;
  }
  function captureOasis(v, x, y){
    Game.oasis[x + ',' + y] = v.id;
    return true;
  }
  function fortPower(){
    return Math.round(18000 * (1 + 0.6 * Math.max(0, (daysElapsed() - 30) / 30)));
  }
  function fortGarrison(){
    var p = fortPower() / 100;
    return { g0:Math.round(p*0.45), g1:Math.round(p*0.35),
             g2:Math.round(p*0.15), g3:Math.round(p*0.05) };
  }
  function fortsHeld(){
    var n = 0;
    for (var i = 0; i < FORTS.length; i++) if (Game.forts[FORTS[i].id] === 'me') n++;
    return n;
  }
  function attackBonus(){ return 1 + 0.03 * fortsHeld(); }
  function hasFB(key){
    for (var i = 0; i < FORTS.length; i++)
      if (FORTS[i].bonus.indexOf(key) >= 0 && Game.forts[FORTS[i].id] === 'me') return true;
    return false;
  }
  function capitalPower(){
    return Math.round(120000 * (1 + 0.5 * Math.max(0, (daysElapsed() - 60) / 30)));
  }
  function capitalGarrison(){
    var p = capitalPower() / 100;
    return { g0:Math.round(p*0.30), g1:Math.round(p*0.35),
             g2:Math.round(p*0.22), g3:Math.round(p*0.13) };
  }
  function capitalStatus(){
    var d = daysElapsed();
    if (d < CFG.CAPITAL_OPEN_DAY)
      return { open:false, msg:'เปิดให้โจมตีวันที่ ' + CFG.CAPITAL_OPEN_DAY +
        ' (อีก ' + Math.ceil(CFG.CAPITAL_OPEN_DAY - d) + ' วัน)' };
    if (fortsHeld() < 8)
      return { open:false, msg:'ต้องยึดป้อมครบ 8 แห่งก่อน (' + fortsHeld() + '/8)' };
    if (Game.capital.owner === 'me'){
      var h = (now() - Game.capital.since) / 86400000 * CFG.SPEED;
      return { open:false, owner:'me', msg:'ครองเมืองหลวงมาแล้ว ' +
        h.toFixed(1) + ' / ' + CFG.CAPITAL_HOLD_DAYS + ' วัน' };
    }
    return { open:true, msg:'พร้อมโจมตี!' };
  }
  function fortOpen(){ return daysElapsed() >= CFG.FORT_OPEN_DAY; }
  function checkVictory(){
    if (Game.capital.owner !== 'me' || Game.won) return false;
    var h = (now() - Game.capital.since) / 86400000 * CFG.SPEED;
    if (h >= CFG.CAPITAL_HOLD_DAYS){
      Game.won = true;
      var hof = Store.json(CFG.HOF_KEY, []);
      hof.unshift({ at:now(), player:Game.player.name,
        guild: Game.guild ? Game.guild.name : null,
        members: Game.guild ? [Game.player.name].concat(
          (Game.guild.members||[]).map(function(m){ return m.name; })) : [Game.player.name],
        allies: (Game.allies||[]).map(function(a){ return a.name; }) });
      Store.set(CFG.HOF_KEY, JSON.stringify(hof.slice(0, 10)));
      return true;
    }
    return false;
  }
  function openEndgame(){
    var st = capitalStatus();
    var h = '<h3>👑 ศึกชิงเมืองหลวงโลก</h3>' +
      '<div class="row"><span>วันที่เซิร์ฟเวอร์</span><b>' +
      Math.floor(daysElapsed()) + ' / ' + CFG.TOTAL_DAYS + '</b></div>' +
      '<div class="row"><span>ป้อมที่ยึดได้</span><b style="color:#ffcf40">' +
      fortsHeld() + ' / 8</b></div>' +
      '<div class="row"><span>โบนัสโจมตี</span><b style="color:#8fbf5f">+' +
      Math.round((attackBonus() - 1) * 100) + '%</b></div>' +
      '<div class="eta">' + st.msg + '</div><h4>ป้อมปราการ</h4>';
    FORTS.forEach(function(f){
      var own = Game.forts[f.id] === 'me';
      h += '<div class="row" style="cursor:pointer" data-fort="' + f.id + '">' +
        '<span>' + (own ? '✅' : '⬜') + ' <b>' + f.name + '</b> (' + f.x + '|' + f.y +
        ')<br><i style="font-size:10px;color:#a89468">' + f.bonus + '</i></span>' +
        '<b>' + (own ? 'ยึดแล้ว' : '⚔') + '</b></div>';
    });
    h += '<button class="btn-ok" id="atkcap">⚔ ส่งทัพตีเมืองหลวง (0|0)</button>' +
      '<button class="btn-cancel" onclick="MilUI.close()">ปิด</button>';
    document.getElementById('modalbox').innerHTML = h;
    document.getElementById('modal').classList.remove('hidden');
    document.querySelectorAll('[data-fort]').forEach(function(n){
      n.onclick = function(){
        var f = FORTS[+n.dataset.fort];
        MilUI.close(); MilUI.openRally(f.x, f.y);
      };
    });
    document.getElementById('atkcap').onclick = function(){
      MilUI.close(); MilUI.openRally(0, 0);
    };
  }
  return { daysElapsed:daysElapsed, fortOpen:fortOpen, oasisSlots:oasisSlots,
    ownedOasisOf:ownedOasisOf,
    oasisBonus:oasisBonus, canCaptureOasis:canCaptureOasis,
    captureOasis:captureOasis, oasisMax:oasisMax,
    oasisCount:oasisCount, oasisList:oasisList,
    fortPower:fortPower, fortGarrison:fortGarrison, fortsHeld:fortsHeld,
    attackBonus:attackBonus, capitalPower:capitalPower,
    capitalGarrison:capitalGarrison, capitalStatus:capitalStatus,
    checkVictory:checkVictory, openEndgame:openEndgame,
    B_INF:function(){ return hasFB('ทหารราบ') ? 1.10 : 1; },
    B_CAV:function(){ return hasFB('ทหารม้า') ? 1.10 : 1; },
    B_SPEED:function(){ return hasFB('เดินทัพ') ? 1.15 : 1; },
    B_CATA:function(){ return hasFB('เครื่องยิง') ? 1.10 : 1; },
    B_DEF:function(){ return hasFB('ป้องกัน') ? 1.10 : 1; },
    B_CARRY:function(){ return hasFB('บรรทุก') ? 1.20 : 1; },
    B_TRAIN:function(){ return hasFB('ฝึกทหาร') ? 0.87 : 1; },
    B_LOYAL:function(){ return hasFB('ความภักดี') ? 1.25 : 1; } };
})();