var Combat = (function(){
  function attackPower(troops, smithyLv){
    var mul = 1 + 0.02 * (smithyLv || 0), total = 0, cavPts = 0;
    for (var id in troops){
      var u = anyUnit(id); if (!u || !troops[id]) continue;
      var p = troops[id] * u.atk * mul;
      total += p;
      if (u.cls === 'cav') cavPts += p;
    }
    return { total:total, cavRatio: total > 0 ? cavPts / total : 0 };
  }
  function defensePower(troops, cavRatio, armLv, wallLv, pop){
    var mul = 1 + 0.02 * (armLv || 0), sum = 0;
    for (var id in troops){
      var u = anyUnit(id); if (!u || !troops[id]) continue;
      sum += troops[id] * ((1 - cavRatio) * u.di + cavRatio * u.dc) * mul;
    }
    return (sum + 10 + 2 * Math.sqrt(pop || 0)) * Math.pow(1.03, wallLv || 0);
  }
  function morale(pa, pd){
    if (!pa || !pd) return 1;
    return Math.max(0.667, Math.min(1, Math.pow(pd / pa, 0.2)));
  }
  function battleK(na, nd){
    return 1.5 * Math.pow(Math.max(1, (na + nd) / 1000), 0.2);
  }
  function count(t){ var n = 0; for (var i in t) n += t[i] || 0; return n; }
  function applyLoss(t, pct){
    var dead = {}, left = {};
    for (var id in t){
      var n = t[id] || 0, d = Math.min(n, Math.round(n * pct));
      if (d > 0) dead[id] = d;
      if (n - d > 0) left[id] = n - d;
    }
    return { dead:dead, left:left };
  }
  function resolve(atk, def, opt){
    opt = opt || {};
    var ap = attackPower(atk.troops, atk.smithy);
    var gb = (typeof Conquest !== 'undefined' && !atk.isNpc)
             ? Conquest.attackBonus() : 1;
    
    var hb = (atk.heroLead || 1);
    var hp = (atk.heroAtk || 0);
    var A = (ap.total + hp) * gb * hb;

    var D = (defensePower(def.troops, ap.cavRatio, def.armoury, def.wall, def.pop)
    + (def.heroDef || 0))
    * (def.isMine && typeof Conquest !== 'undefined' ? Conquest.B_DEF() : 1);

    var M = morale(atk.pop, def.pop);
    var Ae = A * M;
    var nA = count(atk.troops), nD = count(def.troops);
    var k = battleK(nA, nD);
    var x = D > 0 ? Ae / D : 99;
    var lossA, lossD, win;
    if (opt.raid){
      lossA = D / (Ae + D); lossD = Ae / (Ae + D); win = x >= 1;
    } else {
      if (x > 1){ lossA = Math.pow(1/x, k); lossD = 1; win = true; }
      else      { lossA = 1; lossD = Math.pow(x, k); win = false; }
    }
    var ra = applyLoss(atk.troops, lossA), rd = applyLoss(def.troops, lossD);
    return { win:win, A:Math.round(A), Ae:Math.round(Ae), D:Math.round(D),
      x:x, k:k, morale:M, lossPctA:lossA, lossPctD:lossD,
      deadA:ra.dead, leftA:ra.left, deadD:rd.dead, leftD:rd.left };
  }
  function scout(at, dt, towerLv){
    var A = 0, D = 0;
    for (var i in at){ var u = anyUnit(i); if (u && u.cls === 'scout') A += at[i] * 35; }
    for (var j in dt){ var v = anyUnit(j); if (v && v.cls === 'scout') D += dt[j] * 20; }
    D = (D + 10) * Math.pow(1.05, towerLv || 0);
    var x = A / D;
    return { success: x > 1, x:x, lossPct: x > 1 ? Math.pow(1/x, 1.5) : 1 };
  }
  function catapult(n, smithy, tlv){
    if (!n || tlv <= 0) return 0;
    return Math.min(tlv, Math.floor(n * (1 + 0.02 * (smithy||0)) / (8 + tlv)));
  }
  function loot(surv, avail, hidden, pierce){
    var cap = 0;
    for (var id in surv){ var u = anyUnit(id); if (u && u.cap) cap += surv[id] * u.cap; }
    if (typeof Conquest !== 'undefined') cap *= Conquest.B_CARRY();
    var hid = hidden * (1 - (pierce || 0)), pool = {}, total = 0;
    RES.forEach(function(r){
      pool[r] = Math.max(0, Math.floor((avail[r] || 0) - hid)); total += pool[r];
    });
    var out = { wheat:0, wood:0, iron:0, clay:0 };
    if (total <= 0) return { loot:out, carried:0 };
    var take = Math.min(cap, total), carried = 0;
    RES.forEach(function(r){
      var v = Math.floor(take * (pool[r] / total));
      out[r] = v; carried += v;
    });
    return { loot:out, carried:carried };
  }
  function loyaltyHit(n){
    var h = 0;
    for (var i = 0; i < n; i++) h += 20 + Math.random() * 10;
    return Math.round(h);
  }
  return { resolve:resolve, scout:scout, catapult:catapult, loot:loot,
    loyaltyHit:loyaltyHit, count:count, attackPower:attackPower,
    defensePower:defensePower, morale:morale };
})();