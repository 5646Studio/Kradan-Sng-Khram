/* ============ B9 v14P — บทแนะนำ · คู่มือวิธีเล่น · เมนูล่างแบบรูป · ติดตั้งแอป ============ */

/* ---------- เมนูล่างแบบรูป ---------- */
var NAV_LABEL = (function(){ try { return localStorage.getItem('sw_navlb') !== '0' && (typeof Store === 'undefined' || Store.get('sw_navlb') !== '0'); } catch(e){ return true; } })();
   // false = แสดงแค่รูป ไม่มีตัวหนังสือ
var NavArt = (function(){
  var M = [['ทรัพยากร','nav_fields'],['แผนที่','nav_world'],['รายงาน','nav_reports'],['เมือง','nav_village']];
  var src = {}, tried = {}, n = 0;
  function look(k){
    if (src[k]) return;
    var s = (typeof Sheets !== 'undefined') ? Sheets.get('ui_' + k) : null;
    if (s){ src[k] = s; return; }
    if (tried[k]) return;
    tried[k] = 1;
    var ex = ['png', 'webp'], i = 0;
    (function nx(){
      if (i >= ex.length){ tried[k] = 0; return; }
      var im = new Image();
      im.onload = function(){ if (im.naturalWidth){ src[k] = im.src; apply(); } else nx(); };
      im.onerror = nx;
      im.src = CFG.ASSET_PATH + 'ui/ui_' + k + '.' + ex[i++];
    })();
  }
  function keyOf(b){
    var t = b.getAttribute('data-navlb') || b.textContent;
    for (var i = 0; i < M.length; i++) if (t.indexOf(M[i][0]) >= 0) return M[i];
    return null;
  }
  function apply(){
    document.body.classList.toggle('navnolabel', !NAV_LABEL);
    document.querySelectorAll('#navbar button').forEach(function(b){
      var m = keyOf(b);
      if (!m) return;
      look(m[1]);
      var s = src[m[1]];
      if (!s) return;
      var im = b.querySelector('img.navic');
      if (!im){
        b.setAttribute('data-navlb', m[0]);
        for (var c = b.firstChild; c; c = c.nextSibling){
          if (c.nodeType === 3 && c.nodeValue.indexOf(m[0]) >= 0){
            var sp = document.createElement('span');
            sp.className = 'navtx'; sp.textContent = c.nodeValue.trim();
            b.replaceChild(sp, c);
            break;
          }
        }
        im = document.createElement('img');
        im.className = 'navic'; im.alt = '';
        b.insertBefore(im, b.firstChild);
        b.classList.add('hasnav');
      }
      if (im.src !== s) im.src = s;
    });
  }
  function start(){
    apply();
    var t = setInterval(function(){ apply(); if (++n > 20) clearInterval(t); }, 1500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  return { apply:apply };
})();

/* ---------- ติดตั้งเป็นแอป ---------- */
var AppInstall = (function(){
  var ev = null;
  window.addEventListener('beforeinstallprompt', function(e){ e.preventDefault(); ev = e; });
  function installed(){
    return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  }
  function go(){
    if (ev){ ev.prompt(); ev.userChoice.then(function(){ ev = null; }); return; }
    UI.modal('<h3>📲 ติดตั้งเป็นแอป</h3><div class="infobox" style="line-height:1.8"><b>Android (Chrome)</b><br>' +
      'กด ⋮ มุมขวาบน → <b>ติดตั้งแอป</b> หรือ <b>เพิ่มลงในหน้าจอหลัก</b><br><br><b>iPhone (Safari)</b><br>' +
      'กดปุ่มแชร์ → <b>เพิ่มไปยังหน้าจอโฮม</b></div><div class="suphint">หลังติดตั้ง ให้เปิดเกมจากไอคอนช้างบนหน้าจอ ' +
      'การแจ้งเตือนจะแสดงไอคอนเกมแทนไอคอน Chrome</div><button class="btn-cancel" onclick="UI.close()">ปิด</button>');
  }
  return { go:go, installed:installed };
})();

/* ---------- คู่มือวิธีเล่น ---------- */
var Guide = (function(){
  var CH = [
    { id:'start', ic:'🏯', t:'เริ่มต้น', p:[['bd','main',3],['hub','2']], b:[
      'แถบล่างมี 4 หน้า: <b>เมือง</b> (อาคาร) · <b>ทรัพยากร</b> (หลุมผลิต) · <b>แผนที่</b> · <b>รายงาน</b>',
      'เริ่มเกมมีช่างก่อสร้าง 2 คน สร้างพร้อมกันได้ 2 งาน',
      'ผู้เล่นใหม่ได้รับการคุ้มครอง 5 วัน แต่ถ้าไปตีบอทก่อน บอทจะตีคืนได้',
      'ทำ 📜 ภารกิจตามลำดับ เป็นทางที่โตเร็วที่สุด'] },
    { id:'res', ic:'🌾', t:'ทรัพยากร', p:[['fd','wheat_2'],['fd','wood_2'],['fd','iron_2'],['fd','clay_2']], b:[
      'ข้าว ไม้ เหล็ก และโคลน ผลิตเองตลอดเวลา แม้ปิดเกมอยู่',
      'อัปเกรดหลุมในหน้าทรัพยากรเพื่อผลิตได้มากขึ้น',
      'ข้าวใช้เลี้ยงประชากรและทหาร ระวังอย่าให้ผลผลิตข้าวติดลบ',
      'คลังสินค้าและยุ้งฉางจำกัดความจุ ส่วนที่ล้นจะหายไป',
      'ที่ซ่อนทรัพย์ช่วยเก็บทรัพยากรบางส่วนไม่ให้ถูกปล้น'] },
    { id:'build', ic:'🏗', t:'อาคาร', p:[['bd','warehouse',2],['bd','granary',2],['bd','barracks',2]], b:[
      'แตะช่องว่างในหน้าเมืองเพื่อสร้างอาคารใหม่ แตะอาคารเดิมเพื่ออัปเกรด',
      'อาคารหลักยิ่งเลเวลสูง ยิ่งปลดล็อกอาคารอื่นได้มาก',
      'ใช้ทองกด ⚡ เพื่อสร้างเสร็จทันที',
      'โรงสี โรงเลื่อย เตาเผาอิฐ และโรงหลอม เพิ่มผลผลิตเป็นเปอร์เซ็นต์'] },
    { id:'war', ic:'⚔️', t:'ทหารและการรบ', p:[['u','inf_d'],['u','cav_l'],['u','ram']], b:[
      'ฝึกทหารที่ค่ายทหาร คอกม้า และโรงงาน',
      'ภารกิจ: 💰 ปล้น (เสียทหารน้อย) · ⚔️ โจมตี (สู้จนจบ) · 👁️ สอดแนม · 🛡️ เสริมทัพ',
      'กำแพงเพิ่มพลังป้องกัน ส่วนซุงกระทุ้งใช้ทำลายกำแพงศัตรู',
      'หอคอยเฝ้าระวังช่วยให้เห็นทัพศัตรูก่อนถึงเมือง',
      'เมืองร้าง 🏚 ไม่มีเจ้าของ เหมาะกับการปล้นในช่วงแรก'] },
    { id:'hero', ic:'🗿', t:'วีรบุรุษ', p:[['it','weapon_3'],['it','helm_4'],['bd','hero',2]], b:[
      'ปั้นหน้าวีรบุรุษได้ ครั้งแรกฟรี',
      'ได้ 4 แต้มต่อเลเวล ใช้เพิ่มโจมตี ป้องกัน นำทัพ หรือผลิตทรัพยากร',
      'อุปกรณ์มี 7 ช่อง ระดับใช้ได้เมื่อวีรบุรุษถึง Lv.1 / 5 / 10 / 15 / 20',
      'ดันเจี้ยนต้องมีพลังชีวิต 30% ขึ้นไป · 🧪 ยาฟื้นพลังช่วยเติมพลังชีวิตได้ทันที',
      'พาวีรบุรุษไปโจมตีโอเอซิสในระยะ 30 ช่องเพื่อยึดโอเอซิส'] },
    { id:'expand', ic:'🏘', t:'ขยายเมือง', p:[['u','settler'],['u','chief'],['bd','residence',2]], b:[
      'เมืองที่ 2 ต้องมี 300 Culture Points (CP) · CP สะสมทุกวันจากอาคารในเมือง',
      'จัด 🎉 งานเฉลิมฉลองที่ศาลาประชาคมเพื่อได้ CP เพิ่ม',
      'คฤหาสน์ Lv.5 ฝึกผู้ตั้งถิ่นฐานได้ 3 นาย ส่งไปที่ว่างเพื่อตั้งเมืองใหม่',
      'ขุนพลจากพระราชวังลดความภักดีเมืองศัตรู ถึง 0% แล้วยึดเมืองได้',
      'เมืองหลวงที่มีพระราชวังยึดไม่ได้'] },
    { id:'guild', ic:'🤝', t:'กิลด์และตลาด', p:[['bd','embassy',2],['bd','market',2],['u','merchant']], b:[
      'สถานทูต Lv.1 ขอเข้ากิลด์ได้ · Lv.3 ตั้งกิลด์ได้ (50 ทอง)',
      'เพื่อนร่วมกิลด์คุยกันในแชตกิลด์ ส่งกำลังหนุนให้กัน และตีกันเองไม่ได้',
      'ตลาดส่งของให้เมืองอื่น ตั้งข้อเสนอแลกเปลี่ยน หรือแลกกับพ่อค้าหลวง (3 ทอง)'] },
    { id:'season', ic:'👑', t:'ฤดูกาลและเมืองหลวงโลก', p:[['bd','palace',4],['ui','crown']], b:[
      'วันที่ 20 ป้อมปราการ 8 แห่งปรากฏ ยึดด้วยขุนพล (ต้องอยู่ในกิลด์)',
      'วันที่ 30 เมืองหลวงโลก (0|0) ปรากฏ กิลด์ต้องมีป้อม 2 แห่งขึ้นไปจึงจะยึดได้',
      'ครองเมืองหลวงครบ 5 วันติดต่อกันชนะเซิร์ฟเวอร์ · หลังวันที่ 45 วันที่ต้องครองจะลดลง',
      'จบฤดูกาลได้รับเหรียญตราถาวร และบัญชีเดิมเล่นต่อในฤดูกาลใหม่ได้'] },
    { id:'gold', ic:'💰', t:'ทอง เช็คอิน และแจ้งเตือน', p:[['ui','gold'],['ui','calendar']], b:[
      'ทองใช้เร่งงาน ซื้อช่างคนที่ 3 แผนการรบ และยาฟื้นพลัง',
      'เติมทองด้วย QR พร้อมเพย์แล้วแนบสลิป ผลแจ้งใน ✉ ข้อความส่วนตัว',
      '📅 เช็คอินทุกวัน 30 วันได้ทรัพยากร EXP อุปกรณ์ และทอง',
      '🔔 เปิดการแจ้งเตือนที่โปรไฟล์ เพื่อรู้ทันทีเมื่อถูกโจมตี',
      '📲 ติดตั้งเป็นแอปเพื่อเล่นเต็มจอและเห็นไอคอนเกมในการแจ้งเตือน'] }
  ];
  var DIR = { fd:'fields/', it:'items/', ui:'ui/', hub:'scenes/' };
  function pic(p){
    var s = null;
    try {
      if (p[0] === 'bd' && typeof Art !== 'undefined' && Art.buildingURL) s = Art.buildingURL(p[1], p[2], 20);
      else if (p[0] === 'u') s = UnitSheet.get(Game.player ? Game.player.tribe | 0 : 0, p[1]);
      else s = Sheets.get(p[0] + '_' + p[1]);
      if (!s && typeof Assets !== 'undefined' && Assets.get){ var im = Assets.get(p[0] + '_' + p[1]); if (im && im.src) s = im.src; }
      if (!s && DIR[p[0]]) s = CFG.ASSET_PATH + DIR[p[0]] + p[0] + '_' + p[1] + '.png';
    } catch(e){}
    return s ? '<img src="' + s + '" alt="" onerror="this.remove()">' : '';
  }
  var CB = '<button class="btn-cancel" onclick="UI.close()">ปิด</button>';
  function open(){
    UI.modal('<h3 data-bi="1">📖 วิธีเล่น</h3><div class="gd-grid">' + CH.map(function(c, i){
      return '<button class="gd-c" data-gd="' + i + '"><span class="gd-i">' + (pic(c.p[0]) || c.ic) + '</span>' + c.t + '</button>';
    }).join('') + '</div><button class="btn-use2" id="gdTut">🎓 เริ่มบทแนะนำ</button>' + CB);
    var gt = document.getElementById('gdTut');
    if (gt) gt.onclick = function(){ UI.close(); Tut.start(true); };
    document.querySelectorAll('[data-gd]').forEach(function(b){ b.onclick = function(){ chap(+b.dataset.gd); }; });
  }
  function chap(i){
    var c = CH[i], ps = c.p.map(pic).join('');
    UI.modal('<h3 data-bi="1">' + c.ic + ' ' + c.t + '</h3>' +
      '<img class="gd-hero" src="' + CFG.ASSET_PATH + 'help/help_' + c.id + '.png" alt="" onerror="this.remove()">' +
      (ps ? '<div class="gd-pics">' + ps + '</div>' : '<div class="gd-big">' + c.ic + '</div>') +
      '<ul class="gd-ul">' + c.b.map(function(x){ return '<li>' + x + '</li>'; }).join('') + '</ul><div class="grow2">' +
      (i > 0 ? '<button class="btn-use2 mini2" id="gdP">◀ ' + CH[i - 1].t + '</button>' : '') +
      (i < CH.length - 1 ? '<button class="btn-ok mini2" id="gdN">' + CH[i + 1].t + ' ▶</button>' : '') +
      '</div><button class="btn-use2" id="gdL">📖 สารบัญ</button>' + CB);
    var p = document.getElementById('gdP'), n = document.getElementById('gdN');
    if (p) p.onclick = function(){ chap(i - 1); };
    if (n) n.onclick = function(){ chap(i + 1); };
    document.getElementById('gdL').onclick = open;
  }
  if (typeof Help !== 'undefined') Help.open = open;
  return { open:open, chap:chap };
})();

/* ---------- บทแนะนำ ---------- */
var Tut = (function(){
  var on = false, i = 0, ov = null, hole = null, card = null, timer = null, srv = -1, decided = false, mark = 0;
  function $(s){ try { return document.querySelector(s); } catch(e){ return null; } }
  function shown(e){ if (!e) return false; var r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }
  function vis(s){ return shown($(s)); }
  function nav(w){
    var r = null;
    document.querySelectorAll('#navbar button').forEach(function(b){
      if (!r && (b.getAttribute('data-navlb') || b.textContent).indexOf(w) >= 0) r = b;
    });
    return r;
  }
  function online(){ return typeof Sync !== 'undefined' && Sync.online && Sync.online(); }
  function modalOpen(){ var m = document.getElementById('modal'); return !!(m && !m.classList.contains('hidden')); }
  function key(){ return 'sw_tut_' + ((typeof Net !== 'undefined' && Net.uid && Net.uid()) || 'off'); }
  function qlen(){ try { return (V().queue || []).length; } catch(e){ return 0; } }

  var STEPS = [
    { h:'🏯 ยินดีต้อนรับสู่สุวรรณภูมิ', x:'ท่านคือเจ้านครคนใหม่ บทแนะนำนี้ใช้เวลาไม่กี่นาที เล่นจนจบรับ 📦 ทรัพยากรชนิดละ 500 และ 💰 10 ทอง' },
    { t:'#topbar', h:'📦 ทรัพยากร', x:'ข้าว ไม้ เหล็ก โคลน ผลิตเองตลอดเวลาแม้ปิดเกม · ตัวเลขเล็กสีเขียวคือผลผลิตต่อชั่วโมง · ถัดไปคือทองและประชากร' },
    { t:function(){ return nav('ทรัพยากร'); }, h:'🌾 ไปหน้าทรัพยากร', x:'แตะปุ่ม "ทรัพยากร" ที่แถบล่าง', w:function(){ return vis('#scene-fields'); } },
    { t:'#scene-fields', h:'⛏️ อัปเกรดหลุม', x:'แตะหลุมใดก็ได้ แล้วกดอัปเกรด · แนะนำให้เริ่มที่หลุมข้าว',
      s:function(){ mark = qlen(); }, w:function(){ return qlen() > mark; } },
    { t:'#taskpanel', h:'⏳ คิวก่อสร้าง', x:'งานที่กำลังสร้างแสดงอยู่ตรงนี้ · มีช่าง 2 คน สร้างพร้อมกันได้ 2 งาน · ใช้ทองกด ⚡ เพื่อเร่งได้' },
    { t:'#cityhub', h:'🏛 เข้าเมือง', x:'แตะรูปเมืองตรงกลางเพื่อเข้าไปในเมือง', w:function(){ return vis('#scene-village'); } },
    { t:'#scene-village', h:'🏗 สร้างอาคาร', x:'แตะช่องว่างเพื่อสร้างอาคารใหม่ · แนะนำให้สร้างคลังสินค้าและยุ้งฉางก่อน เพื่อเก็บทรัพยากรได้มากขึ้น' },
    { t:'#herobtn', h:'🗿 วีรบุรุษ', x:'ปั้นหน้าวีรบุรุษ ส่งไปดันเจี้ยนเพื่อเก็บ EXP และอุปกรณ์ หรือพาออกรบกับกองทัพ' },
    { t:function(){ return nav('แผนที่'); }, h:'🗺 แผนที่โลก', x:'แตะปุ่ม "แผนที่" ที่แถบล่าง', w:function(){ return vis('#map'); } },
    { t:'#map', h:'⚔️ ปล้นเมืองร้าง', x:'เมืองร้าง 🏚 ไม่มีเจ้าของ เหมาะกับการปล้นครั้งแรก · แตะเมืองแล้วกด ⚔ ส่งทัพ (ต้องมีลานรวมพลและทหารก่อน)' },
    { t:function(){ return nav('รายงาน'); }, h:'📜 รายงาน', x:'ผลการรบ การค้าขาย และเหตุการณ์ต่าง ๆ ดูได้ที่นี่' },
    { t:'#questbtn', h:'📜 ภารกิจ', x:'ทำภารกิจตามลำดับเพื่อรับทรัพยากรและทอง เป็นทางที่โตเร็วที่สุด' },
    { t:'#setbtn', h:'👤 โปรไฟล์', x:'เช็คอินรายวัน · เปิดการแจ้งเตือน · 📖 วิธีเล่น · ติดตั้งเป็นแอป · ตั้งค่า อยู่ในนี้ทั้งหมด' }
  ];

  function build(){
    ov = document.createElement('div');
    ov.id = 'tut';
    ov.innerHTML = '<div class="tut-hole"></div><div class="tut-card"></div>';
    document.body.appendChild(ov);
    hole = ov.firstChild; card = ov.lastChild;
  }
  function target(S){
    if (!S.t) return null;
    var e = typeof S.t === 'function' ? S.t() : $(S.t);
    return shown(e) ? e : null;
  }
  function place(){
    var e = target(STEPS[i]), W = innerWidth, H = innerHeight;
    if (!e){
      hole.classList.remove('on');
      hole.style.cssText = 'left:50%;top:50%;width:0;height:0';
      card.style.cssText = 'left:12px;right:12px;top:50%;transform:translateY(-50%)';
      return;
    }
    var r = e.getBoundingClientRect(), p = 6;
    var x = Math.max(2, r.left - p), y = Math.max(2, r.top - p);
    var w = Math.min(W - x - 2, r.width + p * 2), h = Math.min(H - y - 2, r.height + p * 2);
    hole.classList.add('on');
    hole.style.cssText = 'left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px';
    if (r.height > H * 0.45) card.style.cssText = 'left:12px;right:12px;bottom:96px';
    else if (r.top + r.height / 2 > H / 2) card.style.cssText = 'left:12px;right:12px;bottom:' + (H - y + 10) + 'px';
    else card.style.cssText = 'left:12px;right:12px;top:' + (y + h + 10) + 'px';
  }
  function paint(){
    var S = STEPS[i], last = i === STEPS.length - 1;
    card.innerHTML = '<div class="tut-n">บทแนะนำ ' + (i + 1) + ' / ' + STEPS.length + '</div><b>' + S.h + '</b><p>' + S.x + '</p>' +
      '<div class="tut-b"><a id="tutSkip">ข้ามบทแนะนำ</a><button id="tutNext">' +
      (S.w ? 'ข้ามขั้นนี้ ▶' : last ? '✔ จบ' : 'ถัดไป ▶') + '</button></div>';
    card.querySelector('#tutNext').onclick = function(){ go(i + 1); };
    card.querySelector('#tutSkip').onclick = skip;
    place();
  }
  function go(n){
    i = n;
    var S = STEPS[i];
    if (!S) return finish();
    if (S.s) S.s();
    if (S.w && S.w()) return go(i + 1);
    paint();
  }
  function tick(){
    if (!on || !ov) return;
    var mo = modalOpen();
    ov.style.display = mo ? 'none' : '';
    if (mo) return;
    var S = STEPS[i];
    if (S && S.w && S.w()) return go(i + 1);
    place();
  }
  function stop(){ on = false; clearInterval(timer); if (ov){ ov.remove(); ov = null; } }
  function skip(){
    if (!confirm('ข้ามบทแนะนำ?\nเปิดใหม่ได้ที่ 👤 โปรไฟล์ → 🎓 บทแนะนำ (รับรางวัลได้เมื่อเล่นจนจบ)')) return;
    Store.set(key(), '1');
    stop();
  }
  function finish(){
    stop();
    Store.set(key(), '1');
    function done(tx){
      UI.modal('<h3>🎉 จบบทแนะนำแล้ว</h3><div class="infobox">' + tx + '<br>ขั้นต่อไป: ทำ 📜 ภารกิจ และเช็คอินทุกวัน</div>' +
        '<button class="btn-use2" id="tutG">📖 เปิดคู่มือวิธีเล่น</button><button class="btn-cancel" onclick="UI.close()">เริ่มเล่น</button>');
      document.getElementById('tutG').onclick = function(){ Guide.open(); };
    }
    if (online() && srv === 0)
      Sync.cmd('/tutorial/done', { vid:V().id }, function(r){
        if (r && r.ok){ srv = 1; done('🎁 ได้รับ 📦 ทรัพยากรชนิดละ 500 และ 💰 10 ทอง'); }
        else done('ขอให้สนุกกับการสร้างนคร');
      });
    else done(srv === 1 ? 'รางวัลบทแนะนำรับไปแล้วก่อนหน้านี้' : 'ขอให้สนุกกับการสร้างนคร');
  }
  function start(force){
    if (on) return;
    if (!force && Store.get(key())) return;
    on = true;
    build();
    go(0);
    timer = setInterval(tick, 400);
  }
  function onState(r){
    srv = ((r && r.player) || {}).tut | 0;
    if (decided) return;
    decided = true;
    var qi = (r && r.quest) ? r.quest.i | 0 : 0;
    if (!srv && qi <= 1 && !Store.get(key())) setTimeout(function(){ start(false); }, 1500);
  }
  setTimeout(function(){
    if (decided || online()) return;
    try { if (Game.villages.length === 1 && cityLevel(V(), 'main') <= 1){ decided = true; start(false); } } catch(e){}
  }, 4000);
  if (typeof Social !== 'undefined'){
    var so = Social.onState;
    Social.onState = function(r){ so.apply(Social, arguments); onState(r); };
  }
  return { start:start, active:function(){ return on; } };
})();
