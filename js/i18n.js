/* ============ I18N v14T — แปลภาษาอัตโนมัติ (แก้ค้าง · กันค้าง · ?lang=th) ============
   ต้องโหลดก่อนสคริปต์อื่นทั้งหมด */
var I18N = (function(){
  var KEY = 'sw_lang', MK = 'sw_i18n_miss', BK = 'sw_lang_try', TH = /[\u0E00-\u0E7F]/;
  var SKIP = '.cb,.cn,.cvm i,.gt,[data-noi18n],textarea,script,style';
  var AT = ['placeholder', 'title', 'alt', 'aria-label'];
  var lang = 'th', isGame = /game\.html/.test(location.pathname), fellBack = false;
  try {
    var q = new URLSearchParams(location.search).get('lang');
    if (q === 'th' || q === 'en'){ localStorage.setItem(KEY, q); localStorage.removeItem(BK); }
    lang = localStorage.getItem(KEY) === 'en' ? 'en' : 'th';
    if (lang === 'en' && isGame){
      var n = +(localStorage.getItem(BK) || 0);
      if (n >= 2){ localStorage.setItem(KEY, 'th'); localStorage.removeItem(BK); lang = 'th'; fellBack = true; }
      else localStorage.setItem(BK, String(n + 1));
    }
  } catch(e){}
  var on = lang === 'en', D = null, K = null, cache = {}, cn = 0, miss = {}, saveT = 0;
  var ORIG = new WeakMap(), OUT = new WeakMap(), ATTR = new WeakMap();
  try { miss = JSON.parse(localStorage.getItem(MK) || '{}'); } catch(e){}

  if (fellBack) setTimeout(function(){
    alert('โหมดภาษาอังกฤษโหลดไม่สำเร็จ 2 ครั้ง จึงกลับเป็นภาษาไทยให้ก่อน\nกรุณาแจ้งผู้พัฒนาพร้อมภาพหน้าจอกล่องสีแดง (ถ้ามี)');
  }, 4000);

  /* โหลดเกมสำเร็จ → ล้างตัวนับกันค้าง */
  if (on && isGame){
    var ok = setInterval(function(){
      try {
        if (typeof Game !== 'undefined' && Game.villages && Game.villages.length){
          localStorage.removeItem(BK); clearInterval(ok);
        }
      } catch(e){}
    }, 2000);
  }

  /* กล่องแสดงข้อผิดพลาด (โหมดอังกฤษ หรือ ?debug=1) */
  if (on || /[?&]debug=1/.test(location.search)){
    var errs = [];
    window.addEventListener('error', function(e){
      errs.push((e.message || 'error') + ' @' + String(e.filename || '').split('/').pop() + ':' + (e.lineno || ''));
      var b = document.getElementById('i18nErr');
      if (!b && document.body){
        b = document.createElement('div'); b.id = 'i18nErr'; b.setAttribute('data-noi18n', '');
        b.style.cssText = 'position:fixed;left:6px;right:6px;bottom:6px;z-index:999999;background:#7a1010;color:#fff;' +
          'font:11px monospace;padding:6px 8px;border-radius:8px;max-height:30vh;overflow:auto';
        b.onclick = function(){ b.remove(); };
        document.body.appendChild(b);
      }
      if (b) b.textContent = '⚠ ' + errs.slice(-4).join('\n⚠ ') + '\n(แตะเพื่อปิด)';
    });
  }

  function load(){
    if (K) return;
    D = window.LANG_EN || {};
    K = Object.keys(D).filter(function(k){ return k && D[k]; }).sort(function(a, b){ return b.length - a.length; });
  }
  function note(s){
    s = String(s).replace(/\s+/g, ' ').trim().slice(0, 200);
    if (s.length > 1 && !miss[s] && Object.keys(miss).length < 600) miss[s] = 1;
    clearTimeout(saveT);
    saveT = setTimeout(function(){ try { localStorage.setItem(MK, JSON.stringify(miss)); } catch(e){} }, 2000);
  }

    /* v14U — ยศ/คำนำหน้า + ชื่อ → อักษรโรมัน (บอท · NPC · เมือง · กิลด์) */
  var RANK = { 'พ่อขุน':'Pho Khun', 'พระยา':'Phraya', 'จมื่น':'Chamuen', 'หมื่น':'Muen', 'ขุน':'Khun', 'ท้าว':'Thao',
    'แสน':'Saen', 'หลวง':'Luang', 'เจ้า':'Chao', 'นาย':'Nai', 'นคร':'Nakhon' };
  var ROOT = { 'ศรีราชา':'Si Racha', 'ไกรสร':'Kraison', 'เพชรา':'Phetchara', 'อินทรา':'Inthra', 'สุริยา':'Suriya',
    'ทองคำ':'Thongkham', 'กาฬสิงห์':'Kan Sing', 'วิเศษ':'Wiset', 'รามราช':'Ramrat', 'ภักดี':'Phakdi', 'ชัยยศ':'Chaiyot',
    'บุญมา':'Bunma', 'อุดม':'Udom', 'แก้วกล้า':'Kaeo Kla', 'สิงหนาท':'Singhanat', 'มังกร':'Mangkon',
    'ช้างเผือก':'Chang Phueak', 'เมฆา':'Mekha', 'ธารา':'Thara', 'พิชัย':'Phichai', 'อโนชา':'Anocha', 'เทพา':'Thepha',
    'วายุ':'Wayu', 'พสุธา':'Phasutha', 'นาคราช':'Nakharat', 'สายฟ้า':'Saifa', 'ภูผา':'Phupha', 'จันทรา':'Chanthra',
    'ดาวเรือง':'Dao Ruang', 'มหาวงศ์':'Mahawong',
    /* ชื่อผู้เล่นทดสอบ — เพิ่มได้ */
    'อังคาร':'Angkhan', 'พุธโท':'Phuttho', 'พุธ':'Phut', 'จัน':'Chan', 'คำ':'Kham' };
  var GA = { 'สมาพันธ์':'Confederation', 'กองทัพ':'Army', 'พันธมิตร':'Alliance', 'แนวร่วม':'Coalition', 'สหาย':'Comrades', 'ภาคี':'League' };
  var GB = { 'นาคา':'Naga', 'ไกรสร':'Lion', 'อินทรี':'Eagle', 'พยัคฆ์':'Tiger', 'ช้างเผือก':'White Elephant', 'สุวรรณ':'Golden',
    'อโยธยา':'Ayutthaya', 'ล้านช้าง':'Lan Xang', 'ทวารวดี':'Dvaravati', 'หริภุญชัย':'Haripunchai', 'ศรีวิชัย':'Srivijaya', 'เชียงแสน':'Chiang Saen' };
  function alt(o){ return Object.keys(o).sort(function(a, b){ return b.length - a.length; }).join('|'); }
  var NAME_RE = new RegExp('(' + alt(RANK) + ')(' + alt(ROOT) + ')', 'g');
  var GUILD_RE = new RegExp('(' + alt(GA) + ')(' + alt(GB) + ')', 'g');
    /* v14V — รูปแบบประโยคที่มีตัวเลข/ชื่อแทรก (ทำก่อนแปลงชื่อและแทนคำ) */
  var RX = [
    [/สำรวจ (.+?) สำเร็จ — ได้ /g, 'Adventure in $1 succeeded — found '],
    [/ป้องกันสำเร็จ — (.+?) บุก /g, 'Defended — $1 attacked '],
    [/รื้อถอน(\S+) ที่ (.+?) เสร็จแล้ว/g, 'Demolished $1 at $2'],
    [/วีรบุรุษบาดเจ็บสาหัสใน /g, 'Hero badly injured in '],
    [/สินค้าถึง (.+?) แล้ว/g, 'Goods arrived at $1'],
    [/ได้รับสินค้าจาก /g, 'Received goods from '],
    [/กำลังหนุนถึง (.+?) แล้ว/g, 'Reinforcements reached $1'],
    [/ออกรบจากฐานได้ (\d+) ครั้ง/g, 'can sortie from base $1 times'],
    [/ฤดูกาลที่ (\d+)/g, 'Season $1'],
    [/เมืองที่ (\d+)/g, 'Village $1'],
    [/รับ 💰 ?(\d+) ทอง\/คน/g, 'Get 💰 $1 gold per friend'],
    [/สำเร็จแล้ว (\d+)\/(\d+) คน/g, 'Completed $1/$2 friends'],
    [/\(ตอนนี้ ([\w.\-]+)\)/g, '(current: $1)']
  ];
  function names(s){
    RX.forEach(function(r){ s = s.replace(r[0], r[1]); });
    return s.replace(GUILD_RE, function(m, a, b){ return ' ' + GB[b] + ' ' + GA[a] + ' '; })
            .replace(NAME_RE, function(m, r, n){ return ' ' + RANK[r] + ' ' + ROOT[n] + ' '; })
            .replace(/ {2,}/g, ' ').trim();
  }
  function tr(s){
    if (!on || s == null) return s;
    s = String(s);
    if (!TH.test(s)) return s;
    if (cache[s] != null) return cache[s];
    load();
    var core = s.trim(), i0 = s.indexOf(core), lead = s.slice(0, i0), tail = s.slice(i0 + core.length), o;
    if (D[core]) o = D[core];
    else if (ROOT[core]) o = ROOT[core];
    else {
      o = names(core);

      for (var i = 0; i < K.length; i++) if (o.indexOf(K[i]) >= 0) o = o.split(K[i]).join(' ' + D[K[i]] + ' ');
      o = o.replace(/[ \u00A0]{2,}/g, ' ').replace(/ ([·,.:;!?)\]%…])/g, '$1').replace(/([(\[#]) /g, '$1').trim();
    }
    if (TH.test(o)) note(core);
    var r = lead + o + tail;
    if (++cn > 4000){ cache = {}; cn = 0; }
    cache[s] = r; cache[r] = r;
    return r;
  }
  function text(n){
    var v = n.nodeValue;
    if (v === OUT.get(n)) return;
    ORIG.delete(n); OUT.delete(n);
    if (!v || !TH.test(v)) return;
    var p = n.parentNode;
    if (!p || (p.closest && p.closest(SKIP))) return;
    var t = tr(v);
    ORIG.set(n, v); OUT.set(n, t);
    if (t !== v) n.nodeValue = t;
  }
  function attrs(e){
    if (!e.getAttribute || (e.closest && e.closest('.cb,[data-noi18n]'))) return;
    var last = ATTR.get(e);
    if (!last){ last = {}; ATTR.set(e, last); }
    AT.forEach(function(a){
      var v = e.getAttribute(a);
      if (!v || !TH.test(v) || v === last[a]) return;
      var t = tr(v);
      last[a] = t;
      if (t !== v) e.setAttribute(a, t);
    });
    if (e.tagName === 'INPUT' && /^(button|submit)$/.test(e.type) && TH.test(e.value)) e.value = tr(e.value);
  }
  function walk(n){
    if (!on || !n) return;
    if (n.nodeType === 3) return text(n);
    if (n.nodeType !== 1) return;
    attrs(n);
    var w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT, null), L = [], x;
    while ((x = w.nextNode())) L.push(x);
    L.forEach(text);
    n.querySelectorAll('[placeholder],[title],[alt],[aria-label],input[type=button],input[type=submit]').forEach(attrs);
  }
  function src(el){
    if (!el) return '';
    if (!on) return el.textContent || '';
    if (el.nodeType === 3) return (ORIG.has(el) && el.nodeValue === OUT.get(el)) ? ORIG.get(el) : el.nodeValue;
    var s = '', w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), x;
    while ((x = w.nextNode())) s += src(x);
    return s;
  }
  function start(){
    document.documentElement.lang = 'en';
    try { document.title = tr(document.title); walk(document.body); } catch(e){}
    new MutationObserver(function(ms){
      try {
        ms.forEach(function(m){
          if (m.type === 'childList') m.addedNodes.forEach(walk);
          else if (m.type === 'characterData') text(m.target);
          else attrs(m.target);
        });
      } catch(e){}
    }).observe(document.body, { childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:AT });
  }
  if (on){
    ['alert', 'confirm'].forEach(function(f){
      var o = window[f];
      window[f] = function(m){ return o.call(window, tr(m == null ? '' : m)); };
    });
    var op = window.prompt;
    window.prompt = function(m, d){ return op.call(window, tr(m == null ? '' : m), d); };
    ['toLocaleString', 'toLocaleDateString', 'toLocaleTimeString'].forEach(function(f){
      var o = Date.prototype[f];
      Date.prototype[f] = function(l, x){ return o.call(this, l === 'th-TH' ? 'en-GB' : l, x); };
    });
    try {
      var C = CanvasRenderingContext2D.prototype;
      ['fillText', 'strokeText', 'measureText'].forEach(function(f){
        var o = C[f];
        C[f] = function(s){ var a = Array.prototype.slice.call(arguments); a[0] = tr(s); return o.apply(this, a); };
      });
    } catch(e){}
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  }

  function set(l){
    try { localStorage.setItem(KEY, l === 'en' ? 'en' : 'th'); localStorage.removeItem(BK); } catch(e){}
    location.replace(location.pathname);
  }
  function missList(){ return Object.keys(miss); }
  function copyMiss(){
    var t = missList().join('\n');
    if (!t) return alert('No untranslated text recorded yet');
    function done(){ alert('Copied ' + missList().length + ' lines. Paste them in the chat with the developer.'); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, function(){ window.prompt('Copy:', t); });
    else window.prompt('Copy:', t);
  }
  function clearMiss(){ miss = {}; try { localStorage.removeItem(MK); } catch(e){} }
  window.T = tr;
  return { tr:tr, src:src, set:set, lang:function(){ return lang; }, missList:missList, copyMiss:copyMiss, clearMiss:clearMiss };
})();