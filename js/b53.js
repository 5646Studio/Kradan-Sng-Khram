/* ============ B53 v14j — CP ใหม่ · งานเฉลิมฉลอง · ตลาด · กิลด์ผู้เล่นจริง ============ */
var CPN = [0, 0, 300, 750, 1350, 2100, 3000, 4100, 5300, 6600, 8000, 9500, 11000];
window.cpForVillage = function(n){ return CPN[n] || (11000 + (n - 12) * 1500); };
var PARTY = {
  small:{ n:'งานเฉลิมฉลองเล็ก', ic:'🎉', lv:1,  h:24, cp:200, cost:{ wheat:1500, wood:1600, iron:1400, clay:1600 } },
  big:  { n:'งานเฉลิมฉลองใหญ่', ic:'🎆', lv:10, h:48, cp:800, cost:{ wheat:7000, wood:7500, iron:6500, clay:7500 } }
};

var B53 = (function(){
  var ST = { rate:0, gid:0, role:0, tag:'', rels:{}, ginfo:null, inst:false }, MT = 'send', GT = 'mem';
  var RN = ['สมาชิก', 'รองหัวหน้า', 'หัวหน้ากิลด์'], RI = ['•', '⭐', '👑'];
  function esc(s){ return String(s == null ? '' : s).replace(/[<>&"]/g, function(c){
    return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]; }); }
  function fmt(n){ return UI.fmt(n); }
  function $(i){ return document.getElementById(i); }
  function CB(){ return '<button class="btn-cancel" onclick="UI.close()">ปิด</button>'; }
  function myUid(){ return (typeof Net !== 'undefined' && Net.uid) ? Net.uid() : ''; }
  function ownAt(x, y){ return Game.villages.filter(function(g){ return g.x === x && g.y === y; })[0] || null; }
  function on(id, fn){ var e = $(id); if (e) e.onclick = fn; }
  function tabs(list, cur, attr){
    return '<div class="btabs">' + list.map(function(t){
      return '<button class="btab' + (t[0] === cur ? ' on' : '') + '" ' + attr + '="' + t[0] + '">' + t[1] + '</button>';
    }).join('') + '</div>';
  }

  /* ---------- สถานะจากเซิร์ฟเวอร์ ---------- */
  function onState(r){
    var P = (r && r.player) || {};
    ST.rate = P.cpRate || 0; ST.gid = P.guild || 0; ST.role = P.grole | 0;
    if (!ST.gid){ ST.tag = ''; ST.rels = {}; }
    window.cpPerDay = function(){ return ST.rate; };
  }
  function relOf(o){
    if (!o) return 'neutral';
    if (o.ruin) return 'npc';
    if (ST.gid && o.gid === ST.gid) return 'guild';
    return ST.rels[o.gid] || 'neutral';
  }
  function isMate(x, y){
    var o = (typeof Net !== 'undefined' && Net.at) ? Net.at(x, y) : null;
    return !!(o && ST.gid && o.p.gid === ST.gid);
  }
  function gVills(){ return (ST.ginfo && ST.ginfo.vills) || []; }
  function gset(r){
    ST.ginfo = r; ST.gid = r.me.gid; ST.role = r.me.role; ST.tag = r.guild ? r.guild.tag : '';
    ST.rels = {};
    (r.rels || []).forEach(function(x){ ST.rels[x.gid] = x.kind; });
    try { Renderer.invalidate(); } catch(e){}
  }

  /* ---------- งานเฉลิมฉลอง ---------- */
  function partySec(k, lv){ return Math.max(600, Math.round(PARTY[k].h * 3600 * Math.pow(0.96, Math.max(0, lv - 1)) / CFG.SPEED)); }
  function openParty(){
    var v = V(); refresh(v);
    var lv = cityLevel(v, 'townhall'), p = v.srvParty;
    var h = '<h3>🎉 งานเฉลิมฉลอง — ' + esc(v.name) + '</h3><div class="infobox">จัดงานเพื่อรับ Culture Points เพิ่ม ' +
      'ได้ CP เมื่องานจบ · จัดได้ทีละ 1 งานต่อเมือง<br>ศาลาประชาคม <b>Lv.' + lv + '</b> · ยิ่งเลเวลสูงงานยิ่งเสร็จเร็ว</div>';
    if (p) h += '<div class="dgrun">' + PARTY[p.k].ic + ' ' + PARTY[p.k].n + ' กำลังจัดอยู่<br>จบใน ' +
      UI.dur((p.end - now()) / 1000) + ' · ได้ +' + p.cp + ' CP</div>';
    Object.keys(PARTY).forEach(function(k){
      var P0 = PARTY[k], lock = lv < P0.lv, lack = RES.some(function(r){ return v.res[r] < P0.cost[r]; });
      h += '<div class="dgcard' + (lock ? ' lock' : '') + '"><div class="dgh"><b>' + P0.ic + ' ' + P0.n + '</b><span>ศาลา Lv.' + P0.lv +
        '</span></div><div class="dgs"><i>⏱ ' + UI.dur(partySec(k, Math.max(1, lv))) + '</i><i>🎭 +' + P0.cp + ' CP</i></div>' +
        UI.costHtml(v, P0.cost) + (lock ? '<div class="bc-lock">🔒 ต้องมีศาลาประชาคม Lv.' + P0.lv + '</div>'
          : '<button class="btn-ok mini2" data-pk="' + k + '"' + (p || lack ? ' disabled' : '') + '>🎉 จัดงาน</button>') + '</div>';
    });
    UI.modal(h + CB());
    document.querySelectorAll('[data-pk]').forEach(function(b){
      b.onclick = function(){
        b.disabled = true;
        Sync.cmd('/party', { vid:v.id, kind:b.dataset.pk }, function(r){
          if (r && r.ok){ Sync.toast('🎉 เริ่มจัดงานแล้ว'); openParty(); } else b.disabled = false;
        });
      };
    });
  }
  function watchModal(){
    var mb = $('modalbox');
    if (!mb || typeof MutationObserver === 'undefined') return;
    var nm = (BUILDINGS[bIndex('townhall')] || {}).name || 'ศาลาประชาคม';
    new MutationObserver(function(){
      var h3 = mb.querySelector('h3');
      if (!h3 || $('pBtn') || h3.textContent.indexOf(nm) < 0) return;
      var cb = mb.querySelector('.btn-cancel');
      if (!cb) return;
      var b = document.createElement('button');
      b.id = 'pBtn'; b.className = 'btn-use'; b.textContent = '🎉 จัดงานเฉลิมฉลอง';
      b.onclick = openParty;
      cb.parentNode.insertBefore(b, cb);
    }).observe(mb, { childList:true, subtree:true });
  }

  /* ---------- ตลาด ---------- */
  function openMarket(t){
    if (t) MT = t;
    var v = V();
    UI.modal('<h3>🏪 ตลาด</h3><p class="stnone">กำลังโหลด…</p>');
    Api.post('/market/list', { vid:v.id }).then(function(r){
      if (!r.ok) return UI.modal('<h3>🏪 ตลาด</h3><p class="stnone">' + esc(r.err || 'โหลดไม่สำเร็จ') + '</p>' + CB());
      refresh(v);
      var h = '<h3>🏪 ตลาด — ' + esc(v.name) + '</h3><div class="rbar"><span>🐫 พ่อค้าว่าง ' + r.free + ' / ' + r.tot +
        '</span><b>ขนได้ ' + fmt(r.cap) + ' ต่อคน</b></div>';
      if (!r.tot) h += '<div class="bc-lock">🔒 ยังไม่มีตลาดในเมืองนี้ ดูข้อเสนอได้ แต่ยังส่งหรือรับไม่ได้</div>';
      h += tabs([['send','🐫 ส่งของ'],['board','📋 ข้อเสนอ'],['offer','➕ ตั้งข้อเสนอ'],['npc','⚖ พ่อค้าหลวง']], MT, 'data-mt');
      h += MT === 'board' ? board(r, v) : MT === 'offer' ? offerTab() : MT === 'npc' ? npcTab(v) : sendTab(r, v);
      UI.modal(h + CB());
      document.querySelectorAll('[data-mt]').forEach(function(b){ b.onclick = function(){ openMarket(b.dataset.mt); }; });
      if (MT === 'board') bindBoard(r, v);
      else if (MT === 'offer') bindOffer(r, v);
      else if (MT === 'npc') bindNpc(v);
      else bindSend(r, v);
    });
  }
  function sendTab(r, v){
    var lt = Store.json('sw_mk_' + myUid(), null), chips = '';
    Game.villages.forEach(function(g){
      if (g !== v) chips += '<button class="s2c" data-mkx="' + g.x + '" data-mky="' + g.y + '">🏘 ' + esc(g.name) + '</button>';
    });
    gVills().slice(0, 10).forEach(function(g){
      chips += '<button class="s2c" data-mkx="' + g.x + '" data-mky="' + g.y + '">🤝 ' + esc(g.n) + '</button>';
    });
    return '<div class="mkres">' + RES.map(function(x){
      var mx = Math.max(0, Math.min(Math.floor(v.res[x]), r.free * r.cap));
      return '<div><span>' + RES_IC[x] + '</span><input type="number" min="0" value="0" id="mk_' + x +
        '"><button class="mini" data-mx="' + x + '" data-n="' + mx + '">' + fmt(mx) + '</button></div>';
    }).join('') + '</div><div class="destbox"><div class="drow2"><label>X</label><input type="number" id="mkx" value="' +
      (lt ? lt.x : v.x) + '"><label>Y</label><input type="number" id="mky" value="' + (lt ? lt.y : v.y) + '"></div>' +
      (chips ? '<div class="s2chips">' + chips + '</div>' : '') + '<div class="ti-line" id="mkinfo"></div></div>' +
      '<div class="infobox" id="mkprev"></div><button class="btn-ok" id="mkgo"' + (r.tot ? '' : ' disabled') + '>🐫 ส่งสินค้า</button>';
  }
  function bindSend(r, v){
    function vals(){ var o = {}, s = 0; RES.forEach(function(x){ o[x] = Math.max(0, parseInt($('mk_' + x).value, 10) || 0); s += o[x]; }); o._s = s; return o; }
    function upd(){
      var x = parseInt($('mkx').value, 10), y = parseInt($('mky').value, 10), R = vals();
      var mine = ownAt(x, y), o = (typeof Net !== 'undefined' && Net.at) ? Net.at(x, y) : null;
      $('mkinfo').innerHTML = isNaN(x) || isNaN(y) ? '' : '🎯 ' + (mine ? '🏘 เมืองของเรา: ' + esc(mine.name)
        : o ? '🏘 ' + esc((o.p.vills[o.vi] || {}).n || '-') + ' · ' + esc(o.p.name) : '⛔ ไม่มีเมืองที่พิกัดนี้');
      if (!R._s || isNaN(x) || isNaN(y)){ $('mkprev').innerHTML = 'ใส่จำนวนที่จะส่ง'; return; }
      var need = Math.ceil(R._s / r.cap), d = Math.hypot(x - v.x, y - v.y);
      $('mkprev').innerHTML = '📦 ' + fmt(R._s) + ' · 🐫 ใช้ ' + need + ' คน' + (need > r.free ? ' <b class="lack">(ไม่พอ)</b>' : '') +
        ' · ⏱ ' + UI.dur(Math.max(60, Math.round(d / r.spd * 3600 / CFG.SPEED)));
    }
    document.querySelectorAll('[data-mx]').forEach(function(b){ b.onclick = function(){ $('mk_' + b.dataset.mx).value = b.dataset.n; upd(); }; });
    document.querySelectorAll('[data-mkx]').forEach(function(b){
      b.onclick = function(){ $('mkx').value = b.dataset.mkx; $('mky').value = b.dataset.mky; upd(); };
    });
    document.querySelectorAll('#modalbox input').forEach(function(i){ i.oninput = upd; });
    upd();
    on('mkgo', function(){
      var R = vals(), x = parseInt($('mkx').value, 10), y = parseInt($('mky').value, 10), btn = this;
      if (!R._s) return alert('ใส่จำนวนที่จะส่ง');
      btn.disabled = true;
      Sync.cmd('/market/send', { vid:v.id, tx:x, ty:y, res:R }, function(x2){
        if (x2 && x2.ok){ Store.setJson('sw_mk_' + myUid(), { x:x, y:y }); Sync.toast('🐫 พ่อค้าออกเดินทางแล้ว'); openMarket('send'); }
        else btn.disabled = false;
      });
    });
  }
  function board(r, v){
    var h = '';
    if (r.mine.length) h += '<h4>ข้อเสนอของคุณ (' + r.mine.length + ')</h4>' + r.mine.map(function(o){
      return '<div class="stcard"><div class="vh"><b>ให้ ' + RES_IC[o.give_r] + fmt(o.give_n) + ' ⇄ ต้องการ ' + RES_IC[o.want_r] +
        fmt(o.want_n) + '</b><span>(' + o.x + '|' + o.y + ')</span></div><button class="mini" data-oc="' + o.id + '">✕ ยกเลิก</button></div>';
    }).join('');
    var L = r.offers.map(function(o){ o._d = Math.hypot(o.x - v.x, o.y - v.y); return o; })
      .sort(function(a, b){ return a._d - b._d; });
    h += '<h4>ข้อเสนอจากผู้เล่นอื่น (' + L.length + ')</h4>';
    if (!L.length) h += '<p class="stnone">ยังไม่มีข้อเสนอ</p>';
    L.forEach(function(o){
      var need = Math.ceil(o.want_n / r.cap), can = r.tot && v.res[o.want_r] >= o.want_n && need <= r.free;
      h += '<div class="stcard"><div class="vh"><b>ได้ ' + RES_IC[o.give_r] + fmt(o.give_n) + ' ⇄ จ่าย ' + RES_IC[o.want_r] + fmt(o.want_n) +
        '</b><span>📏 ' + o._d.toFixed(1) + '</span></div><div class="stline">' + esc(o.name) + ' (' + o.x + '|' + o.y + ') · 1:' +
        (o.want_n / o.give_n).toFixed(2) + ' · ⏱ ' + UI.dur(Math.max(60, Math.round(o._d / r.spd * 3600 / CFG.SPEED))) +
        ' · 🐫 ' + need + '</div><button class="btn-ok mini2" data-oa="' + o.id + '"' + (can ? '' : ' disabled') + '>✔ รับข้อเสนอ</button></div>';
    });
    return h;
  }
  function bindBoard(r, v){
    document.querySelectorAll('[data-oc]').forEach(function(b){
      b.onclick = function(){
        if (!confirm('ยกเลิกข้อเสนอนี้? ทรัพยากรจะคืนเข้าเมือง')) return;
        b.disabled = true;
        Sync.cmd('/market/cancel', { vid:v.id, id:+b.dataset.oc }, function(x){ if (x && x.ok) openMarket('board'); else b.disabled = false; });
      };
    });
    document.querySelectorAll('[data-oa]').forEach(function(b){
      b.onclick = function(){
        b.disabled = true;
        Sync.cmd('/market/accept', { vid:v.id, id:+b.dataset.oa }, function(x){
          if (x && x.ok){ Sync.toast('✔ รับข้อเสนอแล้ว พ่อค้าทั้งสองฝ่ายออกเดินทาง'); openMarket('board'); } else b.disabled = false;
        });
      };
    });
  }
  function offerTab(){
    function sel(id, d){ return '<select id="' + id + '" class="selbox">' + RES.map(function(x){
      return '<option value="' + x + '"' + (x === d ? ' selected' : '') + '>' + RES_IC[x] + ' ' + RES_TH[x] + '</option>'; }).join('') + '</select>'; }
    return '<div class="mkoff"><label class="s2l">ให้</label>' + sel('ofG', 'wood') +
      '<input type="number" id="ofGn" class="selbox" placeholder="จำนวน (ขั้นต่ำ 100)"><label class="s2l">ต้องการ</label>' + sel('ofW', 'wheat') +
      '<input type="number" id="ofWn" class="selbox" placeholder="จำนวน (ขั้นต่ำ 100)"></div>' +
      '<div class="infobox" id="ofprev">อัตราแลกต้องไม่เกิน 1:2 · ทรัพยากรและพ่อค้าจะถูกจองไว้จนกว่ามีคนรับหรือกดยกเลิก</div>' +
      '<button class="btn-ok" id="ofGo">➕ ตั้งข้อเสนอ</button>';
  }
  function bindOffer(r, v){
    function upd(){
      var g = $('ofG').value, gn = parseInt($('ofGn').value, 10) || 0, wn = parseInt($('ofWn').value, 10) || 0;
      if (!gn || !wn) return;
      var bad = $('ofW').value === g ? 'เลือกชนิดต่างกัน' : (wn > gn * 2 || gn > wn * 2) ? 'อัตราแลกเกิน 1:2'
        : gn > v.res[g] ? 'ทรัพยากรไม่พอ' : Math.ceil(gn / r.cap) > r.free ? 'พ่อค้าไม่พอ' : '';
      $('ofprev').innerHTML = 'อัตรา 1:' + (wn / gn).toFixed(2) + ' · 🐫 จอง ' + Math.ceil(gn / r.cap) + ' คน' +
        (bad ? ' · <b class="lack">' + bad + '</b>' : '');
    }
    ['ofG', 'ofW', 'ofGn', 'ofWn'].forEach(function(i){ $(i).oninput = upd; $(i).onchange = upd; });
    on('ofGo', function(){
      var btn = this;
      btn.disabled = true;
      Sync.cmd('/market/offer', { vid:v.id, give:$('ofG').value, gn:parseInt($('ofGn').value, 10) || 0,
        want:$('ofW').value, wn:parseInt($('ofWn').value, 10) || 0 }, function(x){
        if (x && x.ok){ Sync.toast('➕ ตั้งข้อเสนอแล้ว'); openMarket('board'); } else btn.disabled = false;
      });
    });
  }
  function npcTab(v){
    var tot = 0, c = caps(v);
    RES.forEach(function(x){ tot += Math.floor(v.res[x]); });
    return '<div class="infobox">แลกทรัพยากรกับพ่อค้าหลวงแบบ 1:1 แบ่งยอดรวมใหม่ได้ตามต้องการ · ครั้งละ 💰' + 3 +
      ' ทอง · ต้องมีตลาด</div><div class="rbar"><span>ยอดรวม</span><b>' + fmt(tot) + '</b></div><div class="mkres">' +
      RES.map(function(x){
        return '<div><span>' + RES_IC[x] + '</span><input type="number" min="0" id="np_' + x + '" value="' + Math.floor(v.res[x]) +
          '"><i class="mkcap">/' + fmt(x === 'wheat' ? c.gran : c.store) + '</i></div>';
      }).join('') + '</div><div class="grow2"><button class="btn-use2 mini2" id="npEq">⚖ แบ่งเท่ากัน</button>' +
      '<button class="btn-use2 mini2" id="npRe">↺ ค่าเดิม</button></div><div class="infobox" id="npLeft"></div>' +
      '<button class="btn-ok" id="npGo">⚖ แลก · 💰3</button>';
  }
  function bindNpc(v){
    var tot = 0;
    RES.forEach(function(x){ tot += Math.floor(v.res[x]); });
    function sum(){ var s = 0; RES.forEach(function(x){ s += Math.max(0, parseInt($('np_' + x).value, 10) || 0); }); return s; }
    function upd(){
      var left = tot - sum();
      $('npLeft').innerHTML = left === 0 ? '✔ แบ่งครบแล้ว' : left > 0 ? 'เหลือที่ยังไม่แบ่ง <b>' + fmt(left) + '</b>'
        : '<b class="lack">เกินยอดรวม ' + fmt(-left) + '</b>';
      $('npGo').disabled = left !== 0;
    }
    RES.forEach(function(x){ $('np_' + x).oninput = upd; });
    on('npEq', function(){
      var q = Math.floor(tot / 4);
      RES.forEach(function(x, i){ $('np_' + x).value = q + (i === 0 ? tot - q * 4 : 0); });
      upd();
    });
    on('npRe', function(){ RES.forEach(function(x){ $('np_' + x).value = Math.floor(v.res[x]); }); upd(); });
    on('npGo', function(){
      if (Game.player.gold < 3) return alert('ทองไม่พอ');
      var R = {}, btn = this;
      RES.forEach(function(x){ R[x] = Math.max(0, parseInt($('np_' + x).value, 10) || 0); });
      btn.disabled = true;
      Sync.cmd('/market/npc', { vid:v.id, res:R }, function(x){
        if (x && x.ok){ Sync.toast('⚖ แลกทรัพยากรแล้ว'); openMarket('npc'); } else btn.disabled = false;
      });
    });
    upd();
  }

  /* ---------- กิลด์ ---------- */
  function gp(path, body, msg, tab){
    return Api.post(path, body || {}).then(function(r){
      if (!r.ok) return alert(r.err || 'ไม่สำเร็จ');
      if (msg) Sync.toast(msg);
      Sync.poll(true); Sync.fetchWorld();
      openGuild(tab);
    });
  }
  function openGuild(tab){
    if (tab) GT = tab;
    UI.modal('<h3>🏯 กิลด์</h3><p class="stnone">กำลังโหลด…</p>');
    Api.post('/guild/info', {}).then(function(r){
      if (!r.ok) return UI.modal('<h3>🏯 กิลด์</h3><p class="stnone">' + esc(r.err || 'โหลดไม่สำเร็จ') + '</p>' + CB());
      gset(r);
      if (r.guild) inGuild(r); else noGuild(r);
    });
  }
  function noGuild(r){
    var ap = {};
    (r.applied || []).forEach(function(a){ ap[a.gid] = a.rid; });
    var h = '<h3>🏯 กิลด์</h3><div class="infobox">สถานทูตของคุณ <b>Lv.' + r.emb + '</b><br>• เข้ากิลด์ต้องมีสถานทูต Lv.1' +
      '<br>• ตั้งกิลด์ต้องมีสถานทูต Lv.3 และใช้ 50 ทอง<br>• สมาชิกกิลด์ส่งกำลังหนุนให้กันได้ มีห้องแชตกิลด์ และตีกันเองไม่ได้</div>';
    if (r.invites.length) h += '<h4>📨 คำเชิญถึงคุณ</h4>' + r.invites.map(function(q){
      return '<div class="stcard"><div class="vh"><b>[' + esc(q.tag) + '] ' + esc(q.name) + '</b></div><div class="grow2">' +
        '<button class="btn-ok mini2" data-ga="' + q.id + '" data-y="1">✔ เข้าร่วม</button>' +
        '<button class="btn-del mini2" data-ga="' + q.id + '" data-y="0">✕ ปฏิเสธ</button></div></div>';
    }).join('');
    h += '<h4>🏯 กิลด์ทั้งหมด (' + r.list.length + ')</h4>';
    if (!r.list.length) h += '<p class="stnone">ยังไม่มีกิลด์ของผู้เล่น ตั้งกิลด์แรกของเซิร์ฟเวอร์ได้เลย</p>';
    r.list.forEach(function(g){
      h += '<div class="stcard"><div class="vh"><b>[' + esc(g.tag) + '] ' + esc(g.name) + '</b><span>👥 ' + g.mc + ' · ' + fmt(g.pop) +
        '</span></div>' + (g.descr ? '<div class="stline">' + esc(g.descr) + '</div>' : '') +
        (ap[g.id] ? '<button class="btn-use2 mini2" data-ga="' + ap[g.id] + '" data-y="0">⏳ รอตอบรับ · ยกเลิกคำขอ</button>'
          : '<button class="btn-ok mini2" data-gap="' + g.id + '"' + (r.emb >= 1 ? '' : ' disabled') + '>📨 ขอเข้าร่วม</button>') + '</div>';
    });
    h += '<h4>➕ ตั้งกิลด์ใหม่</h4><input id="gcN" class="selbox" maxlength="24" placeholder="ชื่อกิลด์ (3-24 ตัวอักษร)">' +
      '<input id="gcT" class="selbox" maxlength="5" placeholder="แท็ก 2-5 ตัว เช่น SUK">' +
      '<textarea id="gcD" class="bugta" maxlength="300" placeholder="คำอธิบายกิลด์ (ไม่บังคับ)"></textarea>' +
      '<button class="btn-ok" id="gcGo"' + (r.emb >= 3 ? '' : ' disabled') + '>🏯 ตั้งกิลด์ · 💰50' +
      (r.emb >= 3 ? '' : ' (ต้องมีสถานทูต Lv.3)') + '</button>';
    UI.modal(h + CB());
    document.querySelectorAll('[data-ga]').forEach(function(b){
      b.onclick = function(){ gp('/guild/answer', { rid:+b.dataset.ga, yes:b.dataset.y === '1' }, b.dataset.y === '1' ? '🏯 เข้าร่วมกิลด์แล้ว' : ''); };
    });
    document.querySelectorAll('[data-gap]').forEach(function(b){
      b.onclick = function(){ gp('/guild/apply', { gid:+b.dataset.gap }, '📨 ส่งคำขอแล้ว'); };
    });
    on('gcGo', function(){
      if (!confirm('ตั้งกิลด์ใช้ 50 ทอง ยืนยัน?')) return;
      gp('/guild/create', { name:$('gcN').value, tag:$('gcT').value, desc:$('gcD').value }, '🏯 ตั้งกิลด์สำเร็จ');
    });
  }
  function inGuild(r){
    var g = r.guild, me = r.me, off = me.role >= 1, lead = me.role >= 2, uid = myUid();
    var T = [['mem', '👥 สมาชิก'], ['dip', '🤝 การทูต']];
    if (off){ T.splice(1, 0, ['req', '📨 คำขอ' + (r.reqs.length ? ' (' + r.reqs.length + ')' : '')]); T.push(['set', '⚙ จัดการ']); }
    if (!T.some(function(t){ return t[0] === GT; })) GT = 'mem';
    var h = '<h3>🏯 [' + esc(g.tag) + '] ' + esc(g.name) + '</h3>' +
      (g.desc ? '<div class="infobox">' + esc(g.desc).replace(/\n/g, '<br>') + '</div>' : '') +
      '<div class="rbar"><span>👥 สมาชิก ' + r.members.length + ' / ' + g.cap + '</span><b>' + RI[me.role] + ' ' + RN[me.role] + '</b></div>' +
      '<div class="grow2"><button class="btn-ok mini2" id="gChat">💬 แชตกิลด์</button>' +
      (g.bot ? '' : '<button class="btn-del mini2" id="gLeave">🚪 ออกจากกิลด์</button>') + '</div>' + tabs(T, GT, 'data-gt');

    if (GT === 'mem') r.members.forEach(function(m){
      var online = m.seen && Date.now() - m.seen < 5 * 60000, self = m.uid === uid;
      var vs = r.vills.filter(function(x){ return x.uid === m.uid; });
      h += '<div class="gmem"><div class="gmh"><span class="gdot' + (online ? ' on' : '') + '"></span><b>' + RI[m.role] + ' ' + esc(m.name) +
        (self ? ' (คุณ)' : '') + '</b><i>👥 ' + fmt(m.pop) + ' · 🏘 ' + m.vc + '</i></div>' +
        (vs.length ? '<div class="gvl">' + vs.map(function(x){
          return '<span class="gv">🏘 ' + esc(x.n) + ' (' + x.x + '|' + x.y + ') <button class="mini" data-gs="' + x.x + ',' + x.y + '">🛡 หนุน</button></span>';
        }).join('') + '</div>' : '') +
        (self ? '' : '<div class="gact"><button class="mini" data-gm="' + esc(m.uid) + '" data-gn="' + esc(m.name) + '">✉</button>' +
          (off && m.role < me.role ? '<button class="mini" data-gk="' + esc(m.uid) + '" data-gn="' + esc(m.name) + '">✕ ปลด</button>' : '') +
          (lead ? '<button class="mini" data-gr="' + esc(m.uid) + '" data-r="' + (m.role ? 0 : 1) + '">' + (m.role ? '⬇ ลดเป็นสมาชิก' : '⭐ แต่งตั้งรอง') + '</button>' +
            '<button class="mini" data-gr="' + esc(m.uid) + '" data-r="2" data-gn="' + esc(m.name) + '">👑 โอนหัวหน้า</button>' : '') + '</div>') + '</div>';
    });
    if (GT === 'req'){
      h += '<h4>📨 คำขอเข้าร่วม (' + r.reqs.length + ')</h4>' + (r.reqs.length ? r.reqs.map(function(q){
        return '<div class="stcard"><div class="vh"><b>' + esc(q.name) + '</b><span>👥 ' + fmt(q.pop) + '</span></div><div class="grow2">' +
          '<button class="btn-ok mini2" data-ga="' + q.id + '" data-y="1">✔ รับเข้า</button>' +
          '<button class="btn-del mini2" data-ga="' + q.id + '" data-y="0">✕ ปฏิเสธ</button></div></div>';
      }).join('') : '<p class="stnone">ไม่มีคำขอ</p>');
      h += '<h4>✉ เชิญผู้เล่น</h4><input id="giN" class="selbox" placeholder="ชื่อผู้เล่น"><button class="btn-ok" id="giGo">📨 ส่งคำเชิญ</button>';
      if (r.sent.length) h += '<h4>คำเชิญที่ส่งไป</h4>' + r.sent.map(function(q){
        return '<div class="cvrow"><div class="cvm"><b>' + esc(q.name) + '</b></div><button class="mini" data-ga="' + q.id + '" data-y="0">✕ ยกเลิก</button></div>';
      }).join('');
    }
    if (GT === 'dip'){
      h += '<div class="infobox">กิลด์ที่ประกาศเป็นพันธมิตรจะเป็นสีเขียวบนแผนที่ ศัตรูจะเป็นสีแดง</div>';
      h += r.rels.length ? r.rels.map(function(x){
        return '<div class="cvrow"><div class="cvav">' + (x.kind === 'ally' ? '🤝' : '⚔️') + '</div><div class="cvm"><b>[' + esc(x.tag) + '] ' +
          esc(x.name) + '</b><i>' + (x.kind === 'ally' ? 'พันธมิตร' : 'ศัตรู') + '</i></div>' +
          (off ? '<button class="mini" data-gd="' + esc(x.tag) + '">✕</button>' : '') + '</div>';
      }).join('') : '<p class="stnone">ยังไม่มีความสัมพันธ์กับกิลด์อื่น</p>';
      if (off) h += '<h4>ประกาศความสัมพันธ์</h4><input id="gdT" class="selbox" maxlength="5" placeholder="แท็กกิลด์ เช่น NAG">' +
        '<div class="grow2"><button class="btn-ok mini2" data-gdk="ally">🤝 พันธมิตร</button><button class="btn-del mini2" data-gdk="enemy">⚔️ ศัตรู</button></div>';
    }
    if (GT === 'set') h += '<h4>📝 คำอธิบายกิลด์</h4><textarea id="gsD" class="bugta" maxlength="300">' + esc(g.desc) + '</textarea>' +
      '<button class="btn-ok" id="gsGo">✔ บันทึก</button><div class="infobox">ที่นั่งในกิลด์ = 10 + 2 × เลเวลสถานทูตของหัวหน้า (สูงสุด 50)<br>' +
      'ถ้าหัวหน้าออกจากกิลด์ ตำแหน่งจะส่งต่อให้รองหัวหน้าหรือสมาชิกที่ออนไลน์ล่าสุด</div>';
    UI.modal(h + CB());

    document.querySelectorAll('[data-gt]').forEach(function(b){ b.onclick = function(){ GT = b.dataset.gt; inGuild(r); }; });
    on('gChat', function(){ if (typeof Chat3 !== 'undefined') Chat3.open('g'); });
    on('gLeave', function(){ if (confirm('ออกจากกิลด์ [' + g.tag + ']?')) gp('/guild/leave', {}, '🚪 ออกจากกิลด์แล้ว'); });
    document.querySelectorAll('[data-gs]').forEach(function(b){
      b.onclick = function(){ var p = b.dataset.gs.split(','); Send2.open({ tx:+p[0], ty:+p[1], mis:'support' }); };
    });
    document.querySelectorAll('[data-gm]').forEach(function(b){
      b.onclick = function(){ Social.openThread({ uid:b.dataset.gm, name:b.dataset.gn }); };
    });
    document.querySelectorAll('[data-gk]').forEach(function(b){
      b.onclick = function(){ if (confirm('ปลด ' + b.dataset.gn + ' ออกจากกิลด์?')) gp('/guild/kick', { uid:b.dataset.gk }, '✕ ปลดสมาชิกแล้ว', 'mem'); };
    });
    document.querySelectorAll('[data-gr]').forEach(function(b){
      b.onclick = function(){
        if (b.dataset.r === '2' && !confirm('โอนตำแหน่งหัวหน้าให้ ' + b.dataset.gn + '? คุณจะเป็นรองหัวหน้า')) return;
        gp('/guild/role', { uid:b.dataset.gr, role:+b.dataset.r }, '✔ เปลี่ยนตำแหน่งแล้ว', 'mem');
      };
    });
    document.querySelectorAll('[data-ga]').forEach(function(b){
      b.onclick = function(){ gp('/guild/answer', { rid:+b.dataset.ga, yes:b.dataset.y === '1' }, '', 'req'); };
    });
    on('giGo', function(){ gp('/guild/invite', { name:$('giN').value }, '📨 ส่งคำเชิญแล้ว', 'req'); });
    document.querySelectorAll('[data-gd]').forEach(function(b){
      b.onclick = function(){ gp('/guild/rel', { tag:b.dataset.gd, kind:'none' }, '', 'dip'); };
    });
    document.querySelectorAll('[data-gdk]').forEach(function(b){
      b.onclick = function(){ gp('/guild/rel', { tag:$('gdT').value, kind:b.dataset.gdk }, '✔ บันทึกแล้ว', 'dip'); };
    });
    on('gsGo', function(){ gp('/guild/desc', { desc:$('gsD').value }, '✔ บันทึกแล้ว', 'set'); });
  }

  /* ---------- ติดตั้ง (เรียกจาก Sync.install) ---------- */
  function install(){
    if (ST.inst) return;
    ST.inst = true;
    if (typeof Market !== 'undefined') Market.open = function(){ openMarket(); };
    if (typeof Guild !== 'undefined') Guild.open = function(){ openGuild(); };
    window.Celebrate = { open:openParty };
    watchModal();
    Api.post('/guild/info', {}).then(function(r){ if (r && r.ok) gset(r); });
  }
  if (typeof Social !== 'undefined'){
    var so = Social.onState;
    Social.onState = function(r){ so.apply(Social, arguments); onState(r); };
  }
  return { install:install, onState:onState, relOf:relOf, isMate:isMate, gVills:gVills, openParty:openParty,
    openMarket:openMarket, openGuild:openGuild,
    rate:function(){ return ST.rate; }, myTag:function(){ return ST.tag; } };
})();