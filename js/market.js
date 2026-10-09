var Market = (function(){

  function merchantCount(v){ return cityLevel(v, 'market'); }
  function merchantCap(v){
    return Math.round(CFG.MERCHANT_CAP * (1 + 0.08 * cityLevel(v, 'market')));
  }
  function busy(v){
    var n = 0;
    (Game.trades||[]).forEach(function(t){ if (t.from === v.id) n += t.merchants; });
    (Game.offers||[]).forEach(function(o){ if (o.from === v.id) n += o.merchants; });
    return n;
  }
  function freeMerchants(v){ return Math.max(0, merchantCount(v) - busy(v)); }
  function capacityNow(v){ return freeMerchants(v) * merchantCap(v); }

  /* ---------- ส่งทรัพยากร ---------- */
  function targets(v){
    var out = [];
    Game.villages.forEach(function(g){
      if (g.id !== v.id) out.push({ x:g.x, y:g.y, n:g.name, t:'เมืองของคุณ' });
    });
    if (typeof Guild !== 'undefined' && Guild.myG()){
      Guild.memberList().forEach(function(m){
        if (!m.me) out.push({ x:m.x, y:m.y, n:m.name, t:'สมาชิกกิลด์' });
      });
    }
    return out;
  }
  function sendRes(v, tx, ty, a){
    var total = 0;
    RES.forEach(function(r){ total += a[r] || 0; });
    if (total <= 0) return 'ยังไม่ได้ใส่จำนวน';
    refresh(v);
    for (var i = 0; i < RES.length; i++)
      if (v.res[RES[i]] < (a[RES[i]]||0)) return 'ทรัพยากร ' + RES_TH[RES[i]] + ' ไม่พอ';
    var need = Math.ceil(total / merchantCap(v));
    if (need > freeMerchants(v))
      return 'ต้องใช้พ่อค้า ' + need + ' คน · ว่าง ' + freeMerchants(v);
    var dest = Game.villages.filter(function(g){ return g.x===tx && g.y===ty; })[0];
    RES.forEach(function(r){ v.res[r] -= (a[r]||0); });
    var sec = Math.max(60, Math.round(
      Military.dist(v.x, v.y, tx, ty) / CFG.MERCHANT_SPEED * 3600));
    Game.trades.push({ id:now(), from:v.id, to: dest ? dest.id : null,
      tx:tx, ty:ty, res:a, merchants:need, arriveAt: now() + sec*1000 });
    return null;
  }
  function tick(){
    var ch = false;
    if (Game.trades && Game.trades.length){
      var t = now();
      var due = Game.trades.filter(function(x){ return x.arriveAt <= t; });
      if (due.length){
        due.forEach(function(x){
          if (!x.to) return;
          var d = Game.villages.filter(function(g){ return g.id === x.to; })[0];
          if (!d) return;
          refresh(d);
          var c = caps(d);
          RES.forEach(function(r){
            var cap = (r === 'wheat') ? c.gran : c.store;
            d.res[r] = Math.min(cap, d.res[r] + (x.res[r]||0));
          });
        });
        Game.trades = Game.trades.filter(function(x){ return x.arriveAt > t; });
        ch = true;
      }
    }
    if (refreshBotOffers()) ch = true;
    if (expireOffers()) ch = true;
    return ch;
  }

  /* ---------- ตลาดกลาง ---------- */
  function rateOf(give, want){
    var base = { wheat:1.0, wood:1.05, clay:1.0, iron:1.25 };
    return base[want] / base[give];
  }
  function refreshBotOffers(){
    if (!Game.offers) Game.offers = [];
    var bots = Game.offers.filter(function(o){ return o.bot; });
    if (bots.length >= 12) return false;
    if (!Game.offerAt) Game.offerAt = 0;
    if (now() - Game.offerAt < 600000) return false;
    Game.offerAt = now();
    var n = 12 - bots.length;
    for (var i = 0; i < n; i++){
      var g = RES[Math.floor(Math.random()*4)];
      var w = RES[Math.floor(Math.random()*4)];
      if (g === w) continue;
      var amt = [500,1000,1500,2000,3000][Math.floor(Math.random()*5)];
      var rate = rateOf(g, w) * (0.82 + Math.random()*0.42);
      var bot = (Game.bots||[])[Math.floor(Math.random()*(Game.bots||[1]).length)];
      Game.offers.push({ id: now()+i, bot:true,
        who: bot ? bot.name : 'พ่อค้าเร่',
        give:g, giveN:amt, want:w, wantN: Math.round(amt*rate),
        x: bot ? bot.vills[0].x : 0, y: bot ? bot.vills[0].y : 0,
        until: now() + (4 + Math.random()*20)*3600000 });
    }
    return true;
  }
  function expireOffers(){
    if (!Game.offers || !Game.offers.length) return false;
    var before = Game.offers.length;
    var t = now();
    Game.offers = Game.offers.filter(function(o){
      if (o.until > t) return true;
      if (!o.bot){
        var v = Game.villages.filter(function(g){ return g.id === o.from; })[0];
        if (v){
          var c = caps(v);
          var cap = (o.give === 'wheat') ? c.gran : c.store;
          v.res[o.give] = Math.min(cap, v.res[o.give] + o.giveN);
        }
      }
      return false;
    });
    return Game.offers.length !== before;
  }
  function accept(v, oid){
    var o = (Game.offers||[]).filter(function(x){ return x.id === oid; })[0];
    if (!o) return 'ข้อเสนอหมดอายุแล้ว';
    if (!o.bot && o.from === v.id) return 'นี่คือข้อเสนอของคุณเอง';
    refresh(v);
    if (v.res[o.want] < o.wantN) return 'ทรัพยากรไม่พอ';
    var need = Math.ceil(o.wantN / merchantCap(v));
    if (need > freeMerchants(v)) return 'ต้องใช้พ่อค้า ' + need + ' คน';
    v.res[o.want] -= o.wantN;
    var sec = Math.max(120, Math.round(
      Military.dist(v.x, v.y, o.x, o.y) / CFG.MERCHANT_SPEED * 3600));
    var got = {}; RES.forEach(function(r){ got[r] = 0; });
    got[o.give] = o.giveN;
    Game.trades.push({ id:now(), from:v.id, to:v.id, tx:v.x, ty:v.y,
      res:got, merchants:need, arriveAt: now() + sec*1000 });
    if (!o.bot){
      var s = Game.villages.filter(function(g){ return g.id === o.from; })[0];
      if (s){
        var c2 = caps(s);
        var cap2 = (o.want === 'wheat') ? c2.gran : c2.store;
        s.res[o.want] = Math.min(cap2, s.res[o.want] + o.wantN);
      }
    }
    Game.offers = Game.offers.filter(function(x){ return x.id !== oid; });
    return null;
  }
  function postOffer(v, give, giveN, want, wantN){
    if (give === want) return 'เลือกทรัพยากรต่างชนิดกัน';
    if (giveN <= 0 || wantN <= 0) return 'ใส่จำนวนให้ถูกต้อง';
    refresh(v);
    if (v.res[give] < giveN) return 'ทรัพยากรที่จะให้ไม่พอ';
    var need = Math.ceil(giveN / merchantCap(v));
    if (need > freeMerchants(v)) return 'ต้องใช้พ่อค้า ' + need + ' คน';
    v.res[give] -= giveN;
    Game.offers.push({ id:now(), bot:false, from:v.id, who:Game.player.name,
      give:give, giveN:giveN, want:want, wantN:wantN,
      x:v.x, y:v.y, merchants:need, until: now() + 86400000 });
    return null;
  }

  /* ---------- UI ---------- */
  var tab = 'send';
  function open(t){
    if (t) tab = t;
    var v = V(); refresh(v);
    var h = '<h3>🏪 ตลาด</h3>';
    h += '<div class="mbar"><span>🐫 พ่อค้า <b>' + freeMerchants(v) + '/' +
      merchantCount(v) + '</b></span><span>บรรทุกได้ <b>' +
      UI.fmt(capacityNow(v)) + '</b></span></div>';
    h += '<div class="btabs">' +
      '<button class="btab' + (tab==='send'?' on':'') + '" data-mt="send">ส่งของ</button>' +
      '<button class="btab' + (tab==='buy'?' on':'') + '" data-mt="buy">ตลาดกลาง</button>' +
      '<button class="btab' + (tab==='sell'?' on':'') + '" data-mt="sell">ตั้งขาย</button>' +
      '</div><div id="mbody"></div>' +
      '<button class="btn-cancel" onclick="UI.close()">ปิด</button>';
    UI.modal(h);
    document.querySelectorAll('[data-mt]').forEach(function(b){
      b.onclick = function(){ tab = b.dataset.mt; open(); };
    });
    if (tab === 'send') body_send(v);
    else if (tab === 'buy') body_buy(v);
    else body_sell(v);
  }

  function body_send(v){
    var tg = targets(v), h = '';
    if (!tg.length){
      h += '<p style="color:#ff6b6b;font-size:12px;margin:10px 0">' +
        'ยังไม่มีปลายทาง — ต้องมีเมืองที่ 2 หรือเข้าร่วมกิลด์ก่อน</p>';
    } else {
      h += '<label style="font-size:11px;color:#a89468">ปลายทาง</label>' +
        '<select id="dest" class="selbox">';
      tg.forEach(function(t){
        h += '<option value="' + t.x + ',' + t.y + '">' + t.n +
          ' (' + t.x + '|' + t.y + ') — ' + t.t + '</option>';
      });
      h += '</select>';
      RES.forEach(function(r){
        h += '<div class="urow2"><span>' + RES_IC[r] + ' ' + RES_TH[r] +
          ' <i style="color:#8fbf5f">(' + UI.fmt(v.res[r]) + ')</i></span>' +
          '<input type="number" min="0" value="0" id="m_' + r + '">' +
          '<button class="mini" data-mall="' + r + '">สูงสุด</button></div>';
      });
      h += '<div class="grow2"><button class="mini" id="mspread">⚖ แบ่งเท่ากัน</button>' +
        '<button class="mini" id="mclear">ล้างค่า</button></div>';
      h += '<div class="mprog"><i id="mfill"></i></div>';
      h += '<div id="meta" class="eta">—</div>' +
        '<button class="btn-ok" id="msend">🐫 ส่งทรัพยากร</button>';
    }
    var mine = (Game.trades||[]).filter(function(t){ return t.from === v.id; });
    if (mine.length){
      h += '<h4>ขบวนพ่อค้า</h4>';
      mine.forEach(function(t){
        h += '<div class="row"><span>→ (' + t.tx + '|' + t.ty + ')<br>' +
          '<i style="font-size:10px;color:#a89468">' + RES.map(function(r){
            return (t.res[r] ? RES_IC[r] + UI.fmt(t.res[r]) : ''); })
            .filter(Boolean).join(' ') + '</i></span><b>' +
          UI.dur((t.arriveAt - now())/1000) + '</b></div>';
      });
    }
    document.getElementById('mbody').innerHTML = h;
    if (!tg.length) return;

    function collect(){
      var a = {};
      RES.forEach(function(r){
        a[r] = Math.max(0, parseInt(document.getElementById('m_'+r).value, 10) || 0);
      });
      return a;
    }
    function upd(){
      var a = collect(), total = 0;
      RES.forEach(function(r){ total += a[r]; });
      var capN = capacityNow(v);
      var need = Math.ceil(total / merchantCap(v));
      var p = document.getElementById('dest').value.split(',');
      var d = Military.dist(v.x, v.y, +p[0], +p[1]);
      var over = total > capN;
      document.getElementById('mfill').style.width =
        Math.min(100, total/Math.max(1,capN)*100) + '%';
      document.getElementById('mfill').style.background =
        over ? '#c0392b' : 'linear-gradient(90deg,#5a7a2e,#ffcf40)';
      document.getElementById('meta').innerHTML =
        'บรรทุก <b' + (over ? ' style="color:#ff6b6b"' : '') + '>' + UI.fmt(total) +
        '</b> / ' + UI.fmt(capN) + ' · พ่อค้า <b>' + need + '/' +
        freeMerchants(v) + '</b><br>ระยะ <b>' + d.toFixed(1) +
        '</b> ช่อง · ถึงใน <b>' +
        UI.dur(d / CFG.MERCHANT_SPEED * 3600) + '</b>';
    }
    /* ★ สูงสุด = ตามพ่อค้า ไม่ใช่ตามคลัง ★ */
    document.querySelectorAll('[data-mall]').forEach(function(b){
      b.onclick = function(){
        var r = b.dataset.mall;
        var used = 0;
        RES.forEach(function(x){
          if (x !== r) used += parseInt(document.getElementById('m_'+x).value,10)||0;
        });
        var room = Math.max(0, capacityNow(v) - used);
        document.getElementById('m_'+r).value =
          Math.floor(Math.min(v.res[r], room));
        upd();
      };
    });
    document.getElementById('mspread').onclick = function(){
      var each = Math.floor(capacityNow(v) / 4);
      RES.forEach(function(r){
        document.getElementById('m_'+r).value = Math.floor(Math.min(v.res[r], each));
      });
      upd();
    };
    document.getElementById('mclear').onclick = function(){
      RES.forEach(function(r){ document.getElementById('m_'+r).value = 0; });
      upd();
    };
    RES.forEach(function(r){ document.getElementById('m_'+r).oninput = upd; });
    document.getElementById('dest').onchange = upd;
    upd();
    document.getElementById('msend').onclick = function(){
      var p = document.getElementById('dest').value.split(',');
      var err = sendRes(v, +p[0], +p[1], collect());
      if (err) return alert(err);
      save(); UI.refreshAll(); open('send');
    };
  }

  function body_buy(v){
    refreshBotOffers();
    var h = '<div class="infobox">ข้อเสนอจากผู้เล่นอื่น · กดรับแล้วพ่อค้าจะนำของมาส่ง<br>' +
      'อัตราแลกเปลี่ยนต่างกันไปตามผู้เสนอ เลือกที่คุ้มที่สุด</div>';
    var list = (Game.offers||[]).slice().sort(function(a,b){
      return (b.giveN/b.wantN) - (a.giveN/a.wantN); });
    if (!list.length)
      h += '<p style="color:#8a7a55;text-align:center;font-size:12px;padding:16px">' +
        'ยังไม่มีข้อเสนอ</p>';
    list.forEach(function(o){
      var rate = (o.giveN / o.wantN).toFixed(2);
      var good = (o.giveN / o.wantN) >= rateOf(o.want, o.give);
      var ok = v.res[o.want] >= o.wantN &&
        Math.ceil(o.wantN/merchantCap(v)) <= freeMerchants(v);
      h += '<div class="ocard' + (o.bot ? '' : ' mine') + '">' +
        '<div class="orow"><span class="oget">' + RES_IC[o.give] + ' ' +
        UI.fmt(o.giveN) + '</span><span class="oarr">⇄</span>' +
        '<span class="opay">' + RES_IC[o.want] + ' ' + UI.fmt(o.wantN) + '</span></div>' +
        '<div class="vm"><i>' + o.who + '</i>' +
        '<i class="' + (good ? 'ogood' : '') + '">อัตรา 1 : ' + rate + '</i>' +
        '<i>(' + o.x + '|' + o.y + ')</i>' +
        '<i>หมดใน ' + UI.dur((o.until-now())/1000) + '</i></div>' +
        (o.bot
          ? '<button class="btn-ok mini2" data-oac="' + o.id + '"' +
            (ok ? '' : ' disabled') + '>' +
            (ok ? '🐫 รับข้อเสนอ' : 'ทรัพยากร/พ่อค้าไม่พอ') + '</button>'
          : '<button class="btn-del mini2" data-ocx="' + o.id + '">ยกเลิกข้อเสนอ</button>') +
        '</div>';
    });
    document.getElementById('mbody').innerHTML = h;
    document.querySelectorAll('[data-oac]').forEach(function(b){
      b.onclick = function(){
        var err = accept(v, +b.dataset.oac);
        if (err) return alert(err);
        save(); UI.refreshAll(); open('buy');
      };
    });
    document.querySelectorAll('[data-ocx]').forEach(function(b){
      b.onclick = function(){
        var o = Game.offers.filter(function(x){ return x.id === +b.dataset.ocx; })[0];
        if (o){
          var c = caps(v);
          var cap = (o.give === 'wheat') ? c.gran : c.store;
          v.res[o.give] = Math.min(cap, v.res[o.give] + o.giveN);
        }
        Game.offers = Game.offers.filter(function(x){ return x.id !== +b.dataset.ocx; });
        save(); UI.refreshAll(); open('buy');
      };
    });
  }

  function body_sell(v){
    var h = '<div class="infobox">ตั้งข้อเสนอแลกเปลี่ยน · ทรัพยากรที่ให้จะถูกกันไว้ทันที<br>' +
      'ข้อเสนออยู่ได้ 24 ชั่วโมง ถ้าไม่มีใครรับจะคืนให้อัตโนมัติ</div>';
    h += '<label style="font-size:11px;color:#a89468">ข้าพเจ้าให้</label>' +
      '<div class="grow2"><select id="og" class="selbox" style="margin:0">';
    RES.forEach(function(r){ h += '<option value="'+r+'">'+RES_IC[r]+' '+RES_TH[r]+'</option>'; });
    h += '</select><input type="number" id="ogn" class="selbox" style="margin:0" value="1000"></div>';
    h += '<label style="font-size:11px;color:#a89468">ต้องการรับ</label>' +
      '<div class="grow2"><select id="ow" class="selbox" style="margin:0">';
    RES.forEach(function(r){ h += '<option value="'+r+'"'+(r==='iron'?' selected':'')+'>'+
      RES_IC[r]+' '+RES_TH[r]+'</option>'; });
    h += '</select><input type="number" id="own" class="selbox" style="margin:0" value="1000"></div>';
    h += '<div class="grow2"><button class="mini" id="ofair">⚖ อัตราตลาด</button>' +
      '<button class="mini" id="ogood2">💰 ได้เปรียบ 15%</button></div>';
    h += '<div id="oeta" class="eta">—</div>';
    h += '<button class="btn-ok" id="opost">📜 ตั้งข้อเสนอ</button>';
    document.getElementById('mbody').innerHTML = h;

    function upd(){
      var g = document.getElementById('og').value;
      var w = document.getElementById('ow').value;
      var gn = parseInt(document.getElementById('ogn').value,10)||0;
      var wn = parseInt(document.getElementById('own').value,10)||0;
      var fair = rateOf(w, g);
      document.getElementById('oeta').innerHTML =
        'อัตราของคุณ <b>1 : ' + (wn ? (gn/wn).toFixed(2) : '—') + '</b><br>' +
        'อัตราตลาด 1 : <b>' + fair.toFixed(2) + '</b> · ใช้พ่อค้า <b>' +
        Math.ceil(gn/merchantCap(v)) + '/' + freeMerchants(v) + '</b>';
    }
    ['og','ow','ogn','own'].forEach(function(i){
      var e = document.getElementById(i);
      e.oninput = upd; e.onchange = upd;
    });
    document.getElementById('ofair').onclick = function(){
      var g = document.getElementById('og').value;
      var w = document.getElementById('ow').value;
      var gn = parseInt(document.getElementById('ogn').value,10)||0;
      document.getElementById('own').value = Math.round(gn / rateOf(w, g));
      upd();
    };
    document.getElementById('ogood2').onclick = function(){
      var g = document.getElementById('og').value;
      var w = document.getElementById('ow').value;
      var gn = parseInt(document.getElementById('ogn').value,10)||0;
      document.getElementById('own').value = Math.round(gn / rateOf(w, g) * 1.15);
      upd();
    };
    upd();
    document.getElementById('opost').onclick = function(){
      var err = postOffer(v,
        document.getElementById('og').value,
        parseInt(document.getElementById('ogn').value,10)||0,
        document.getElementById('ow').value,
        parseInt(document.getElementById('own').value,10)||0);
      if (err) return alert(err);
      save(); UI.refreshAll(); open('buy');
    };
  }

  return { open:open, tick:tick, freeMerchants:freeMerchants,
    merchantCap:merchantCap, capacityNow:capacityNow };
})();