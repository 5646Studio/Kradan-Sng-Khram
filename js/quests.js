/* ============ เควส — ตรวจให้ตรงกับระบบ v11 แล้ว ============ */

var FORCED = 0;

var QUESTS = [
  { t:'ก้าวแรกของเจ้านคร', d:'อัปเกรดนาข้าวหลุมใดก็ได้ให้ถึงระดับ 2',
    hint:'แตะแท็บ "ทรัพยากร" ด้านล่าง แล้วแตะตัวเลขในโซนข้าว',
    page:'fields',
    chk:function(v){ return v.fields.some(function(f){
      return f.res==='wheat' && f.level>=2; }); },
    rw:{ wheat:300, wood:300, iron:300, clay:300 } },

  { t:'สมดุลคือหัวใจ', d:'อัปเกรดหลุมไม้ เหล็ก และโคลน ให้ถึงระดับ 1 ทุกหลุม',
    hint:'ทุกอาคารใช้ทรัพยากรครบ 4 ชนิด อย่าอัปแค่อย่างเดียว',
    page:'fields',
    chk:function(v){ return v.fields.filter(function(f){
      return f.res!=='wheat'; }).every(function(f){ return f.level>=1; }); },
    rw:{ wheat:500, wood:500, iron:500, clay:500 } },

  { t:'คลังเก็บทรัพย์', d:'สร้างคลังสินค้าในหน้าเมือง',
    hint:'แท็บ "เมือง" → แตะช่องว่าง → หมวด 🌾 ทรัพยากร',
    page:'village', target:'empty',
    chk:function(v){ return cityLevel(v,'warehouse')>=1; },
    rw:{ wheat:700, wood:700, iron:700, clay:700, gold:5 } },

  { t:'กำแพงกันภัย', d:'สร้างกำแพงเมืองให้ถึงระดับ 2',
    hint:'แตะปุ่ม 🧱 กำแพงเมือง ใต้เมือง — กำแพงคูณพลังป้องกันทั้งเมือง',
    page:'village', target:'wall',
    chk:function(v){ return (v.wallLv||0) >= 2; },
    rw:{ wheat:700, wood:800, iron:600, clay:1000, gold:5 } },

  { t:'ศูนย์กลางการปกครอง', d:'อัปเกรดอาคารหลักให้ถึงระดับ 3',
    hint:'อาคารหลักยิ่งสูง ยิ่งสร้างเร็วและปลดล็อกอาคารใหม่',
    page:'village', target:'main',
    chk:function(v){ return cityLevel(v,'main')>=3; },
    rw:{ wheat:900, wood:900, iron:900, clay:900, gold:10 } },

  /* ---- ต่อจากนี้สมัครใจ ---- */
  { t:'ยุ้งฉางกันข้าวล้น', d:'สร้างยุ้งฉาง',
    hint:'ข้าวเก็บแยกจากทรัพยากรอื่น ถ้าเต็มจะสูญเปล่า', page:'village',
    chk:function(v){ return cityLevel(v,'granary')>=1; },
    rw:{ wheat:800, wood:600, iron:600, clay:600 } },

  { t:'ตั้งค่ายทหาร', d:'สร้างค่ายทหาร แล้วฝึกทหารราบ 5 นาย',
    hint:'สร้างเสร็จแล้วแตะที่ค่ายทหาร → ปุ่ม "เปิดหน้าฝึกทหาร"', page:'village',
    chk:function(v){ var n=0; myUnits().forEach(function(u){
      if(u.cls==='inf') n += (v.troops[u.id]||0); }); return n>=5; },
    rw:{ wheat:1000, wood:1000, iron:1200, clay:900, gold:10 } },

  { t:'ซ่อนไว้ก่อนโดนปล้น', d:'สร้างที่ซ่อนทรัพย์',
    hint:'สร้างซ้ำได้ไม่จำกัด ยิ่งเยอะยิ่งปลอดภัย', page:'village',
    chk:function(v){ return cityLevel(v,'cranny')>=1; },
    rw:{ wheat:500, wood:500, iron:500, clay:500 } },

  { t:'หูตาของเจ้านคร', d:'สร้างหอคอยเฝ้าระวัง',
    hint:'ถ้าไม่มี คุณจะไม่เห็นศัตรูที่กำลังบุกมาเลย', page:'village',
    chk:function(v){ return cityLevel(v,'watchtower')>=1; },
    rw:{ wheat:800, wood:900, iron:900, clay:800, gold:10 } },

  { t:'ออกศึกครั้งแรก', d:'ส่งกองทัพไปปล้นเมืองร้างหรือโอเอซิสให้สำเร็จ',
    hint:'หาช่องสีน้ำตาลบนแผนที่ แตะแล้วกด "ส่งทัพ"', page:'world',
    chk:function(){ return Game.reports.some(function(r){
      return r.title && r.title.indexOf('⚔️ ชนะ')===0; }); },
    rw:{ wheat:1200, wood:1200, iron:1200, clay:1200, gold:15 } },

  { t:'จวนวีรบุรุษ', d:'สร้างจวนวีรบุรุษ',
    hint:'วีรบุรุษมีตั้งแต่เริ่มเกม แต่ต้องมีจวนถึงจะอัปสเตตัสและสวมอุปกรณ์ได้',
    page:'village',
    chk:function(v){ return cityLevel(v,'hero')>=1; },
    rw:{ wheat:1200, wood:1400, iron:1400, clay:1200, gold:10 } },

  { t:'อาวุธคมกริบ', d:'สร้างโรงตีเหล็ก',
    hint:'เพิ่มโจมตี 2% ต่อระดับ และเป็นเงื่อนไขของคอกม้า', page:'village',
    chk:function(v){ return cityLevel(v,'smithy')>=1; },
    rw:{ wheat:900, wood:900, iron:1400, clay:900 } },

  { t:'เปิดสัมพันธ์ไมตรี', d:'สร้างสถานทูต',
    hint:'เข้ากิลด์ได้ · เงื่อนไขของศาลาประชาคมและพระราชวัง', page:'village',
    chk:function(v){ return cityLevel(v,'embassy')>=1; },
    rw:{ wheat:900, wood:1100, iron:1000, clay:900 } },

  { t:'พ่อค้าเร่', d:'สร้างตลาด',
    hint:'ส่งทรัพยากรและแลกเปลี่ยนกับผู้เล่นอื่นได้', page:'village',
    chk:function(v){ return cityLevel(v,'market')>=1; },
    rw:{ wheat:1000, wood:1000, iron:1300, clay:1000 } },

  { t:'บ้านเมืองเจริญ', d:'อัปเกรดอาคารหลักให้ถึงระดับ 10',
    hint:'ปลดล็อกศาลาประชาคม อาคาร CP สูงสุดในเกม', page:'village',
    chk:function(v){ return cityLevel(v,'main')>=10; },
    rw:{ wheat:1800, wood:1800, iron:1800, clay:1800, gold:20 } },

  { t:'วัฒนธรรมแผ่ขยาย', d:'สร้างศาลาประชาคม',
    hint:'ให้ CP 12/วัน จำเป็นถ้าอยากตั้งเมืองที่ 2 เร็ว', page:'village',
    chk:function(v){ return cityLevel(v,'townhall')>=1; },
    rw:{ wheat:2200, wood:2200, iron:2200, clay:2200, gold:20 } },

  { t:'เตรียมขยายอาณาจักร', d:'สร้างคฤหาสน์',
    hint:'ใช้ฝึกผู้ตั้งถิ่นฐาน 3 นาย แล้วส่งไปตั้งเมืองใหม่', page:'village',
    chk:function(v){ return cityLevel(v,'residence')>=1; },
    rw:{ wheat:2800, wood:2800, iron:2800, clay:2800, gold:30 } },

  { t:'อาณาจักรที่สอง', d:'ตั้งเมืองใหม่ให้สำเร็จ',
    hint:'ฝึกผู้ตั้งถิ่นฐาน 3 นาย → ลานรวมพล → ภารกิจ "ตั้งเมือง"', page:'world',
    chk:function(){ return Game.villages.length >= 2; },
    rw:{ wheat:4000, wood:4000, iron:4000, clay:4000, gold:50 } }
];

var Quest = (function(){
  var tipEl = null;

  function cur(){ return Game.quest < QUESTS.length ? QUESTS[Game.quest] : null; }
  function allDone(){ return Game.quest >= QUESTS.length; }
  function isDone(){
    var q = cur();
    if (!q || !Game.villages.length) return false;
    try { return !!q.chk(V()); } catch(e){ return false; }
  }
  

  function isForced(){ return false; }
  
  

  function claim(){
    var q = cur();
    if (!q || !isDone()) return false;
    var v = V();
    refresh(v);
    var c = caps(v);
    RES.forEach(function(r){
      if (!q.rw[r]) return;
      var cap = (r === 'wheat') ? c.gran : c.store;
      v.res[r] = Math.min(cap, v.res[r] + q.rw[r]);
    });
    if (q.rw.gold) Game.player.gold += q.rw.gold;
    Game.questDone.push({ t:q.t, at:now() });
    Game.quest++;
    save();
    return true;
  }
  function skip(){
    if (!confirm('ข้ามบทสอนเล่น?\nจะไม่ได้รางวัลของเควสที่เหลือในบทสอน')) return;
    Game.tutorialSkip = true;
    Game.quest = Math.max(Game.quest, FORCED);
    save(); hideTip(); UI.close(); UI.refreshAll();
  }

  function ensureTip(){
    if (tipEl) return tipEl;
    tipEl = document.createElement('div');
    tipEl.id = 'tutorbar';
    document.body.appendChild(tipEl);
    return tipEl;
  }
  function hideTip(){
    if (tipEl) tipEl.classList.add('hidden');
    document.querySelectorAll('.spot').forEach(function(n){ n.classList.remove('spot'); });
  }
  function curPage(){
    var p = document.querySelector('.page.active');
    return p ? p.id.replace('page-','') : '';
  }


  function showTip(){ hideTip(); }
  function highlight(){ }

  function updateBadge(){
    var btn = document.getElementById('questbtn');
    var b = document.getElementById('qbadge');
    if (allDone()){
      if (btn) btn.classList.add('hidden');
      hideTip(); return;
    }
    if (btn) btn.classList.remove('hidden');
    var on = isDone();
    if (b) b.classList.toggle('hidden', !on);
    if (btn) btn.classList.toggle('ready', on);
    }

  function open(){
    var q = cur();
    var h = '<h3>📜 ภารกิจเจ้านคร</h3>';
    h += '<div class="row"><span>ความคืบหน้า</span><b style="color:#ffcf40">' +
      Game.quest + ' / ' + QUESTS.length + '</b></div>';
    h += '<div class="qbar"><i style="width:' +
      (Game.quest/QUESTS.length*100) + '%"></i></div>';
    if (!q){
      h += '<div class="infobox" style="text-align:center;color:#ffcf40">' +
        '🎉 ทำภารกิจครบทุกด่านแล้ว!<br>ปุ่มภารกิจจะถูกซ่อนไป</div>';
    } else {
      var done = isDone();
      h += '<div class="qcard' + (done ? ' ok' : '') + '">' +
        '<div class="qnum">' + (isForced() ? '📘 บทสอนเล่น ' + (Game.quest+1) +
          '/' + FORCED : 'ภารกิจที่ ' + (Game.quest+1)) + '</div>' +
        '<div class="qt">' + q.t + '</div><div class="qd">' + q.d + '</div>' +
        '<div class="qh">💡 ' + q.hint + '</div>' +
        '<div class="qrw">รางวัล: ' + RES.map(function(r){
          return q.rw[r] ? RES_IC[r] + UI.fmt(q.rw[r]) : ''; })
          .filter(Boolean).join(' ') +
        (q.rw.gold ? ' 💰' + q.rw.gold : '') + '</div></div>';
      h += '<button class="btn-ok" id="qclaim"' + (done ? '' : ' disabled') + '>' +
        (done ? '✔ รับรางวัล' : '⏳ ยังทำไม่สำเร็จ') + '</button>';
      if (isForced())
        h += '<button class="btn-del" id="qskip">ข้ามบทสอนเล่นทั้งหมด</button>';
    }
    if (Game.questDone.length){
      h += '<h4>ภารกิจที่ทำแล้ว</h4>';
      Game.questDone.slice().reverse().slice(0,8).forEach(function(d){
        h += '<div class="row"><span style="color:#8fbf5f">✔ ' + d.t + '</span></div>';
      });
    }
    h += '<button class="btn-cancel" onclick="UI.close()">ปิด</button>';
    UI.modal(h);
    var btn = document.getElementById('qclaim');
    if (btn && isDone()) btn.onclick = function(){
      if (claim()){
        UI.refreshAll(); updateBadge();
        alert('รับรางวัลเรียบร้อย!');
        if (cur()) open(); else UI.close();
      }
    };
    var sk = document.getElementById('qskip');
    if (sk) sk.onclick = skip;
  }

  return { open:open, isDone:isDone, isForced:isForced, cur:cur, allDone:allDone,
    updateBadge:updateBadge, showTip:showTip, skip:skip };
})();