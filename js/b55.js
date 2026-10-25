/* ============ B55 v14L — เช็คอินรายวัน · รูปอาคารในหน้าเลือกอาคาร ============ */
var Checkin = (function(){
  var R = [], ck = null, popDay = -1, tries = 0, timer = null;
  var TN = ['', 'ธรรมดา', 'ดี', 'หายาก', 'ตำนาน', 'เทพ'];
  var CB = '<button class="btn-cancel" onclick="UI.close()">ปิด</button>';
  function esc(s){ return String(s == null ? '' : s).replace(/[<>&"]/g, function(c){
    return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]; }); }
  function on(){ return typeof Sync !== 'undefined' && Sync.online && Sync.online(); }
  function setRules(r){ if (r && r.checkin) R = r.checkin; }
  function info(){
    if (!ck) return null;
    var done = ck.last === ck.today, cont = ck.last === ck.today - 1 && ck.n < 30;
    var got = (done || cont) ? ck.n : 0;
    return { done:done, got:got, day:done ? ck.n : got + 1 };
  }
  function pending(){ var i = info(); return !!(i && !i.done); }
  function big(x){ return x.item ? '🎁' : x.gold ? '💰' : x.builder ? '🔨' : x.sched ? '⏰' : x.pot ? '🧪' : x.exp ? '✨' : '📦'; }
  function short(x){
    return x.item ? TN[x.item] + (x.gold ? '+' + x.gold + 'ทอง' : '') : x.gold ? x.gold + ' ทอง' : x.builder ? 'ช่าง 24ชม.'
      : x.sched ? 'แผนรบ ' + x.sched + 'วัน' : x.pot ? 'ยา ' + x.pot : x.exp ? x.exp + ' EXP' : UI.fmt(x.res || 0);
  }
  function desc(x){
    var a = [];
    if (x.res) a.push('📦 ทรัพยากรชนิดละ ' + UI.fmt(x.res));
    if (x.exp) a.push('✨ EXP วีรบุรุษ ' + x.exp);
    if (x.pot) a.push('🧪 ยาฟื้นพลัง ' + x.pot + ' ขวด');
    if (x.gold) a.push('💰 ' + x.gold + ' ทอง');
    if (x.builder) a.push('🔨 ช่างคนที่ 3 ฟรี 24 ชม.');
    if (x.item) a.push('🎁 อุปกรณ์ระดับ ' + TN[x.item] + ' สุ่ม 1 ชิ้น');
    if (x.sched) a.push('⏰ แผนการรบฟรี ' + x.sched + ' วัน');
    return a.join('<br>');
  }
  function badge(){ var b = document.getElementById('setbtn'); if (b) b.classList.toggle('ckdot', pending()); }
  function onState(r){
    if (r && r.player && r.player.ck) ck = r.player.ck;
    badge();
    if (pending() && popDay !== ck.today && R.length){ popDay = ck.today; tries = 0; later(); }
  }
  function later(){
    clearTimeout(timer);
    timer = setTimeout(function(){
      if (!pending()) return;
      var m = document.getElementById('modal');
      if (m && m.classList.contains('hidden') && Game.villages && Game.villages.length) open();
      else if (++tries < 30) later();
    }, tries ? 4000 : 2500);
  }
  function open(){
    if (!on()) return UI.modal('<h3>📅 เช็คอินรายวัน</h3><div class="infobox">ใช้ได้ในโหมดออนไลน์เท่านั้น</div>' + CB);
    var i = info();
    if (!i || !R.length){
      UI.modal('<h3>📅 เช็คอินรายวัน</h3><p class="stnone">กำลังโหลด…</p>' + CB);
      Sync.poll(true);
      return;
    }
    var t = now(), mid = (Math.floor((t + 25200000) / 86400000) + 1) * 86400000 - 25200000;
    var h = '<h3>📅 เช็คอินรายวัน</h3><div class="rbar"><span>🔥 ต่อเนื่อง ' + i.got + ' วัน</span><b>' +
      (i.done ? '✔ วันนี้รับแล้ว' : 'วันนี้: วันที่ ' + i.day) + '</b></div><div class="ckgrid">';
    for (var d = 1; d <= 30; d++){
      var x = R[d] || {};
      h += '<div class="ck' + (d <= i.got ? ' got' : '') + (d === i.day && !i.done ? ' now' : '') + ((x.gold || x.item) ? ' gold' : '') +
        '"><em>' + d + '</em><span>' + (d <= i.got ? '✔' : big(x)) + '</span><i>' + short(x) + '</i></div>';
    }
    h += '</div>';
    var y = R[i.day] || {};
    if (!i.done) h += '<div class="infobox"><b>วันที่ ' + i.day + '</b><br>' + desc(y) +
      (y.res ? '<br><span style="font-size:10px">ทรัพยากรเข้าเมือง <b>' + esc(V().name) + '</b> · ส่วนที่เกินความจุคลังจะหายไป</span>' : '') +
      '</div><button class="btn-ok" id="ckGo">✔ เช็คอิน</button>';
    else h += '<div class="eta">เช็คอินครั้งถัดไปได้ในอีก ' + UI.dur((mid - t) / 1000) + '</div>';
    h += '<div class="suphint">รีเซ็ตเที่ยงคืนเวลาไทย · ขาดเต็มวันใดวันหนึ่งจะเริ่มวันที่ 1 ใหม่ · ครบ 30 วันเริ่มรอบใหม่</div>' + CB;
    UI.modal(h);
    var b = document.getElementById('ckGo');
    if (b) b.onclick = function(){
      b.disabled = true;
      Sync.cmd('/checkin', { vid:V().id }, function(r){
        if (r && r.ok){
          Sync.toast('📅 เช็คอินวันที่ ' + i.day + ' สำเร็จ' + (r.msg && r.msg.item ? ' · ได้อุปกรณ์ใหม่' : ''));
          open();
        } else b.disabled = false;
      });
    };
  }
  if (typeof Social !== 'undefined'){
    var so = Social.onState;
    Social.onState = function(r){ so.apply(Social, arguments); onState(r); };
  }
  return { setRules:setRules, open:open, pending:pending };
})();

/* ---------- รูปอาคารในหน้าเลือกอาคาร / หน้าอาคาร ---------- */
var BImg = (function(){
  var L = null, q = false;
  function list(){
    if (L) return L;
    L = [];
    (typeof BUILDINGS !== 'undefined' ? BUILDINGS : []).forEach(function(b){
      if (b && b.key && b.name && b.key !== 'wall') L.push(b);
    });
    L.sort(function(a, b){ return b.name.length - a.name.length; });
    return L;
  }
  function match(t){ var a = list(); for (var i = 0; i < a.length; i++) if (t.indexOf(a[i].name) >= 0) return a[i]; return null; }
  function src(k, lv){
    lv = Math.max(1, lv);
    try { if (typeof Art !== 'undefined' && Art.buildingURL){ var u = Art.buildingURL(k, lv, 20); if (u) return u; } } catch(e){}
    try { var im = Assets.get('bd_' + k + '_' + Assets.tier(lv, 20)); if (im) return im.src; } catch(e){}
    return '';
  }
  function strip(b){
    var f = b.firstChild;
    if (!f) return;
    if (f.nodeType === 1 && f.classList && f.classList.contains('uic')) f.parentNode.removeChild(f);
    else if (f.nodeType === 3) f.nodeValue = f.nodeValue.replace(/^[^\u0E00-\u0E7FA-Za-z0-9]+/, '');
  }
  function run(){
    var mb = document.getElementById('modalbox');
    if (!mb) return;
    var cards = mb.querySelectorAll('.bcard');
    Array.prototype.forEach.call(cards, function(c){
      if (c.getAttribute('data-bi')) return;
      c.setAttribute('data-bi', '1');
      var hb = c.querySelector('.bc-h b') || c.querySelector('.bc-h');
      var B = hb && match(hb.textContent);
      if (!B) return;
      var s = src(B.key, 1);
      if (!s) return;
      var im = document.createElement('img');
      im.className = 'bimg'; im.src = s; im.alt = '';
      c.classList.add('hasbimg');
      c.insertBefore(im, c.firstChild);
      strip(hb);
    });
    if (cards.length) return;
    var h3 = mb.querySelector('h3');
    if (!h3 || h3.getAttribute('data-bi')) return;
    h3.setAttribute('data-bi', '1');
    var B2 = match(h3.textContent), lv = 0;
    try { if (B2 && typeof V === 'function' && V()) lv = cityLevel(V(), B2.key); } catch(e){}
    if (!B2 || lv < 1) return;
    var s2 = src(B2.key, lv);
    if (!s2) return;
    var im2 = document.createElement('img');
    im2.className = 'bhero'; im2.src = s2; im2.alt = '';
    h3.parentNode.insertBefore(im2, h3.nextSibling);
  }
  function init(){
    var mb = document.getElementById('modalbox');
    if (!mb || typeof MutationObserver === 'undefined') return;
    new MutationObserver(function(){
      if (q) return;
      q = true;
      requestAnimationFrame(function(){ q = false; try { run(); } catch(e){} });
    }).observe(mb, { childList:true, subtree:true });
  }
  init();
  return { run:run };
})();