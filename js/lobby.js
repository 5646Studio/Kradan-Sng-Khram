var ACC_KEY = 'sw_account';
function saveKeyOf(id){ return 'sw_s' + id + '_save'; }
function hofKeyOf(id){ return 'sw_s' + id + '_hof'; }

var SERVERS = [
  { id:1, name:'ทวารวดี', speed:1, days:45,
    desc:'เซิร์ฟทดสอบ · ป้อมเปิดวันที่ 20 · เมืองหลวงวันที่ 35 · ยึดครองครบ 5 วันชนะ' }
];

//var SERVERS = [
  //{ id:1, name:'ทวารวดี',   speed:1, days:90, desc:'ความเร็วปกติ · เหมาะกับมือใหม่' },
  //{ id:2, name:'ศรีวิชัย',  speed:2, days:60, desc:'เร็ว 2 เท่า · ศึกดุเดือด' },
  //{ id:3, name:'หริภุญชัย', speed:3, days:30, desc:'เร็ว 3 เท่า · จบใน 1 เดือน' }
//];

var PROV = {
  facebook:{n:'Facebook',c:'#1877f2'}, google:{n:'Google',c:'#ea4335'},
  line:{n:'LINE',c:'#06c755'}, email:{n:'อีเมล',c:'#ffcf40'},
  guest:{n:'ผู้เยี่ยมชม',c:'#8a7a55'}
};

function getAcc(){ return Store.json(ACC_KEY, null); }
function setAcc(a){ Store.set(ACC_KEY, JSON.stringify(a)); }
function getSave(id){ return Store.json(saveKeyOf(id), null); }
function getHOF(id){ return Store.json(hofKeyOf(id), []); }

function fmtN(n){
  n = Math.floor(n || 0);
  if (n >= 1000000) return (n/1000000).toFixed(2) + 'M';
  if (n >= 10000) return (n/1000).toFixed(1) + 'k';
  return n.toLocaleString('en-US');
}
function lbBox(h){
  document.getElementById('lb-box').innerHTML = h;
  document.getElementById('lb-modal').classList.remove('hidden');
}
function lbClose(){ document.getElementById('lb-modal').classList.add('hidden'); }

function srvStat(s){
  var d = getSave(s.id);
  if (!d || !d.villages || !d.villages.length)
    return { playing:false, days:0, pop:0, vil:0, forts:0, won:false, st:{} };
  var elapsed = (Date.now() - d.startedAt) / 86400000 * s.speed;
  var pop = 0;
  d.villages.forEach(function(v){
    pop += 2;
    (v.fields||[]).forEach(function(f){ pop += f.level * 2; });
    (v.city||[]).forEach(function(c){ if (c.b) pop += c.level * 2; });
  });
  return {
    playing:true, days:elapsed, pop:pop, vil:d.villages.length,
    forts: d.forts ? Object.keys(d.forts).length : 0,
    won: !!d.won, name: d.player ? d.player.name : '-',
    guild: d.guild ? d.guild.name : null,
    st: d.stats || {}
  };
}

function renderAll(){
  var acc = getAcc();
  document.getElementById('s-login').classList.toggle('hidden', !!acc);
  document.getElementById('s-acc').classList.toggle('hidden', !acc);
  document.getElementById('s-srv').classList.toggle('hidden', !acc);
  document.getElementById('s-hof').classList.toggle('hidden', !acc);
  document.getElementById('s-rank').classList.toggle('hidden', !acc);
  if (!acc) return;

  document.getElementById('pf-av').textContent = acc.name.charAt(0).toUpperCase();
  document.getElementById('pf-name').textContent = acc.name;
  var p = PROV[acc.prov] || PROV.guest;
  document.getElementById('pf-prov').textContent =
    'เข้าสู่ระบบด้วย ' + p.n + ' · ' + new Date(acc.created).toLocaleDateString('th-TH');

  renderServers();
  fillSel('hof-srv'); fillSel('rk-srv');
  renderHOF(); renderRank('atk');
}

function fillSel(id){
  var el = document.getElementById(id);
  if (el.options.length) return;
  var h = '';
  SERVERS.forEach(function(s){
    h += '<option value="' + s.id + '">เซิร์ฟเวอร์ ' + s.id + ' — ' + s.name + '</option>';
  });
  el.innerHTML = h;
}

function renderServers(){
  var h = '';
  SERVERS.forEach(function(s){
    var st = srvStat(s);
    var pct = st.playing ? Math.min(100, st.days / s.days * 100) : 0;
    var tag = st.won ? '<span class="srv-tag end">จบแล้ว</span>'
            : st.playing ? '<span class="srv-tag live">กำลังเล่น</span>'
            : '<span class="srv-tag new">เปิดรับ</span>';
    h += '<div class="srv' + (st.playing?' playing':'') + (st.won?' ended':'') + '">' +
      '<div class="srv-top"><span class="srv-nm">เซิร์ฟเวอร์ ' + s.id + ' — ' +
      s.name + '</span>' + tag + '</div>' +
      '<div class="srv-meta">ความเร็ว ×' + s.speed + ' · ระยะเวลา ' + s.days +
      ' วัน<br>' + s.desc + '</div>';
    if (st.playing){
      h += '<div class="srv-bar"><i style="width:' + pct + '%"></i></div>' +
        '<div class="srv-meta">👤 ' + st.name + ' · วันที่ ' + Math.floor(st.days) +
        '/' + s.days + ' · เมือง ' + st.vil + ' · ปชก. ' + fmtN(st.pop) +
        ' · ป้อม ' + st.forts + '/8</div>' +
        '<div class="srv-act"><button class="b-cont" data-go="' + s.id +
        '">▶ เล่นต่อ</button><button class="b-quit" data-quit="' + s.id +
        '">🗑</button></div>';
    } else {
      h += '<div class="srv-act"><button class="b-play" data-new="' + s.id +
        '">⚔ เข้าร่วมเซิร์ฟเวอร์</button></div>';
    }
    h += '</div>';
  });
  document.getElementById('srv-list').innerHTML = h;

  document.querySelectorAll('[data-go]').forEach(function(b){
    b.onclick = function(){ location.href = 'game.html?s=' + b.dataset.go; };
  });
  document.querySelectorAll('[data-new]').forEach(function(b){
    b.onclick = function(){ askName(+b.dataset.new); };
  });
  document.querySelectorAll('[data-quit]').forEach(function(b){
    b.onclick = function(){ confirmQuit(+b.dataset.quit); };
  });
}

/* ---- เลือกเซิร์ฟแล้วค่อยตั้งชื่อ ---- */
function askName(id){
  var s = SERVERS.filter(function(x){ return x.id === id; })[0];
  var acc = getAcc();
  lbBox('<h3>เข้าร่วมเซิร์ฟเวอร์ ' + id + ' — ' + s.name + '</h3>' +
    '<p style="color:#8a7a55">ความเร็ว ×' + s.speed + ' · ระยะเวลา ' + s.days +
    ' วัน<br>' + s.desc + '</p>' +
    '<label>ชื่อเจ้านครในเซิร์ฟเวอร์นี้</label>' +
    '<input type="text" id="nm" maxlength="18" value="' + acc.name + '">' +
    '<p style="font-size:11px;color:#8a7a55">ตั้งชื่อต่างจากเซิร์ฟอื่นได้</p>' +
    '<button class="lb-btn primary" id="go">เข้าสู่เกม</button>' +
    '<button class="lb-btn" onclick="lbClose()">ยกเลิก</button>');

  document.getElementById('go').onclick = function(){
    var n = document.getElementById('nm').value.trim();
    if (n.length < 2) return alert('ชื่อต้องยาวอย่างน้อย 2 ตัวอักษร');
    Store.set('sw_s' + id + '_name', n);
    location.href = 'game.html?s=' + id + '&new=1';
  };
}

function confirmQuit(id){
  var s = SERVERS.filter(function(x){ return x.id === id; })[0];
  var st = srvStat(s);
  lbBox('<h3 style="color:#ff6b6b">🗑 ออกจากเซิร์ฟเวอร์</h3>' +
    '<p><b>เซิร์ฟเวอร์ ' + id + ' — ' + s.name + '</b><br>' +
    'เมือง ' + st.vil + ' · ประชากร ' + fmtN(st.pop) + '</p>' +
    '<p style="color:#ff9a9a">• เมืองทั้งหมดกลายเป็นเมืองร้าง NPC<br>' +
    '• ข้อมูลในเซิร์ฟนี้ถูกลบถาวร<br>• กลับมาเล่นใหม่ต้องเริ่มจากศูนย์</p>' +
    '<button class="lb-btn danger" id="qgo">ยืนยันออกจากเซิร์ฟเวอร์</button>' +
    '<button class="lb-btn" onclick="lbClose()">ยกเลิก</button>');
  document.getElementById('qgo').onclick = function(){
    Store.del(saveKeyOf(id));
    lbClose(); renderAll();
  };
}

/* ---- หอเกียรติยศ : แยกเซิร์ฟ ---- */
function renderHOF(){
  var id = +document.getElementById('hof-srv').value || 1;
  var s = SERVERS.filter(function(x){ return x.id === id; })[0];
  var hof = getHOF(id);
  var el = document.getElementById('hof-body');

  if (!hof.length){
    el.innerHTML = '<div class="hof-empty">เซิร์ฟเวอร์ ' + id + ' — ' + s.name +
      '<br>ยังไม่มีกิลด์ใดชนะ<br><br>' +
      'ยึดเมืองหลวงโลกให้ครบ ' + Math.round(12/s.speed) +
      ' วัน<br>เพื่อจารึกชื่อกิลด์ของคุณที่นี่</div>';
    return;
  }
  var h = '';
  hof.forEach(function(r, i){
    h += '<div class="hof-win">' +
      '<div class="ti">👑 ' + (r.guild || 'ไร้สังกัด') + '</div>' +
      '<div class="sb">ฤดูกาลที่ ' + (i+1) + ' · เซิร์ฟเวอร์ ' + id + ' — ' +
      s.name + ' · ' + new Date(r.at).toLocaleDateString('th-TH') + '</div>' +
      '<div class="lst"><b>สมาชิกกิลด์:</b> ' +
      (r.members && r.members.length ? r.members.join(', ') : r.player) + '</div>' +
      '<div class="lst"><b>พันธมิตร:</b> ' +
      (r.allies && r.allies.length ? r.allies.join(', ') : '— ไม่มี —') + '</div>' +
      '</div>';
  });
  el.innerHTML = h;
}

/* ---- ผู้แข็งแกร่ง : แยกเซิร์ฟ + 3 หมวด ---- */
function renderRank(mode){
  var id = +document.getElementById('rk-srv').value || 1;
  var s = SERVERS.filter(function(x){ return x.id === id; })[0];
  var st = srvStat(s);
  var el = document.getElementById('rk-body');

  if (!st.playing){
    el.innerHTML = '<div class="hof-empty">ยังไม่ได้เล่นเซิร์ฟเวอร์ ' + id +
      '<br>เข้าร่วมเพื่อเริ่มสะสมคะแนน</div>';
    return;
  }
  var key = { atk:'atkPts', def:'defPts', raid:'raidPts' }[mode];
  var lbl = { atk:'แต้มโจมตี', def:'แต้มป้องกัน', raid:'ทรัพยากรที่ปล้นได้' }[mode];
  var mine = Math.floor(st.st[key] || 0);

  var rows = [{ name: st.name, guild: st.guild, val: mine, me: true }];
  for (var i = 0; i < 9; i++){
    var h = Math.abs(Math.sin((id * 97 + i * 31 + mode.length * 7)) * 10000) % 1;
    rows.push({
      name: ['เจ้าพระยาสุรศักดิ์','ขุนรามคำแหง','พญางำเมือง','เจ้าฟ้าอินทร์',
             'ท้าวมหาพรหม','พระยาพิชัย','ขุนหลวงพะงั่ว','เจ้าราชวงศ์',
             'พญาแสนเมือง'][i],
      guild: ['อโยธยา','ล้านนา','หงสา','ศรีอยุธยา',null][i % 5],
      val: Math.floor(mine * (0.35 + h * 1.5) + h * 900), me:false
    });
  }
  rows.sort(function(a, b){ return b.val - a.val; });

  var out = '<div class="hof-row" style="border:none;padding-bottom:2px">' +
    '<div class="hof-rank"></div><div class="hof-main" ' +
    'style="font-size:10px;color:#8a7a55">เซิร์ฟเวอร์ ' + id + ' — ' + s.name +
    '</div><div class="hof-val" style="font-size:10px;color:#8a7a55">' +
    lbl + '</div></div>';
  rows.forEach(function(r, i){
    out += '<div class="hof-row"' + (r.me ? ' style="background:#241d14"' : '') + '>' +
      '<div class="hof-rank r' + (i+1) + '">' + (i+1) + '</div>' +
      '<div class="hof-main"><b>' + r.name + (r.me ? ' (คุณ)' : '') + '</b>' +
      '<i>' + (r.guild ? '[' + r.guild + ']' : 'ไร้สังกัด') + '</i></div>' +
      '<div class="hof-val">' + fmtN(r.val) + '</div></div>';
  });
  el.innerHTML = out;
}

/* ---- Events ---- */
document.querySelectorAll('[data-soc]').forEach(function(b){
  b.onclick = function(){
    var p = b.dataset.soc;
    var def = { facebook:'ผู้เล่นเฟซบุ๊ก', google:'ผู้เล่นกูเกิล',
                line:'ผู้เล่นไลน์', email:'ผู้เล่นอีเมล',
                guest:'ผู้เยี่ยมชม' }[p];
    lbBox('<h3>เข้าสู่ระบบด้วย ' + PROV[p].n + '</h3>' +
      '<p style="color:#8a7a55">โหมดทดสอบ — ยังไม่เชื่อมต่อจริง<br>' +
      'ตั้งชื่อบัญชีของคุณ</p>' +
      '<input type="text" id="an" maxlength="20" value="' + def + '">' +
      '<button class="lb-btn primary" id="ago">ยืนยัน</button>' +
      '<button class="lb-btn" onclick="lbClose()">ยกเลิก</button>');
    document.getElementById('ago').onclick = function(){
      var n = document.getElementById('an').value.trim();
      if (n.length < 2) return alert('ชื่อสั้นเกินไป');
      setAcc({ name:n.slice(0,20), prov:p, created:Date.now() });
      lbClose(); renderAll();
    };
  };
});

document.getElementById('btn-logout').onclick = function(){
  if (!confirm('ออกจากระบบ? (ข้อมูลเซิร์ฟเวอร์ยังอยู่)')) return;
  Store.del(ACC_KEY); renderAll();
};
document.getElementById('btn-wipe').onclick = function(){
  lbBox('<h3 style="color:#ff6b6b">💀 ล้างข้อมูลทั้งหมด</h3>' +
    '<p>ลบบัญชี ทุกเซิร์ฟเวอร์ และหอเกียรติยศ<br>' +
    '<b style="color:#ff6b6b">กู้คืนไม่ได้</b></p>' +
    '<p>พิมพ์ <b>ลบทั้งหมด</b> เพื่อยืนยัน:</p>' +
    '<input type="text" id="wc">' +
    '<button class="lb-btn danger" id="wgo">ยืนยัน</button>' +
    '<button class="lb-btn" onclick="lbClose()">ยกเลิก</button>');
  document.getElementById('wgo').onclick = function(){
    var v = document.getElementById('wc').value.trim();
    if (v !== 'ลบทั้งหมด') return alert('ข้อความไม่ตรง');
    Store.keys().forEach(function(k){ if (k.indexOf('sw_') === 0) Store.del(k); });
    location.reload();
  };
};
document.getElementById('hof-srv').onchange = renderHOF;
document.getElementById('rk-srv').onchange = function(){
  var on = document.querySelector('.hof-tab.on');
  renderRank(on ? on.dataset.rk : 'atk');
};
document.querySelectorAll('[data-rk]').forEach(function(b){
  b.onclick = function(){
    document.querySelectorAll('.hof-tab').forEach(function(x){ x.classList.remove('on'); });
    b.classList.add('on'); renderRank(b.dataset.rk);
  };
});
document.getElementById('lb-modal').onclick = function(e){
  if (e.target.id === 'lb-modal') lbClose();
};
renderAll();