/* ============ Hero2 v14e — วีรบุรุษออนไลน์: ปั้นหน้า · ตุ๊กตาสวมอุปกรณ์ · กระเป๋า · ดันเจี้ยน ============ */

/* ---------- วาดตัววีรบุรุษด้วย SVG (มีรูปใน assets/hero/ ก็ใช้รูปแทนบางชั้น) ---------- */
var HeroArt = (function(){
  var SKIN = ['#f1d3b3','#e3b98f','#cf9f73','#b07f55','#8d5f3c','#6b4429'];
  var HC = ['#1b1410','#3b2416','#6b4423','#8a8a8a','#e8e2d6','#7a2e1a'];
  var FACE = [[30,38,1],[32,40,.9],[34,38,1.1],[29,41,.85],[35,40,1.15],[31,37,1.2],[33,42,.95],[30,39,1.05],[36,38,1.25],[32,39,.8]];
  var BROW = [[2.5,0],[3.5,-3],[2.5,3],[4,-1],[2,2],[3,0]];
  var GC = ['#9a9a9a','#9a9a9a','#7aa65a','#4a8ac8','#9a5ad0','#e0b030'];
  var CX = 100, CY = 72, img = {}, tried = {};
  var MOUS = ['',
    '<path d="M90 87 Q100 84 110 87" stroke="{H}" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
    '<path d="M88 88 Q100 81 112 88 Q100 86 88 88Z" fill="{H}"/>',
    '<path d="M100 86 Q92 83 86 87 Q84 83 88 81 M100 86 Q108 83 114 87 Q116 83 112 81" stroke="{H}" stroke-width="3" fill="none" stroke-linecap="round"/>',
    '<path d="M92 86 Q100 83 108 86 M92 86 L90 103 M108 86 L110 103" stroke="{H}" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
    '<path d="M96 86 Q100 84 104 86" stroke="{H}" stroke-width="3.5" fill="none" stroke-linecap="round"/>',
    '<path d="M84 89 Q100 79 116 89 Q108 91 100 88 Q92 91 84 89Z" fill="{H}"/>'];

  function ld(k){
    if (tried[k]) return;
    tried[k] = 1;
    var im = new Image();
    im.onload = function(){ if (im.naturalWidth){ img[k] = im.src; if (typeof Hero2 !== 'undefined') Hero2.repaint(); } };
    im.src = CFG.ASSET_PATH + 'hero/' + k.split('_')[0] + '/' + k + '.png';
  }
  function lay(k){ ld(k); return img[k] ? '<image href="' + img[k] + '" x="0" y="0" width="200" height="300" preserveAspectRatio="none"/>' : null; }

  function body(s, fem){
    var cl = fem ? '#8a3a5a' : '#7a3b2a', top = fem ? '#b5652f' : s;
    return '<rect x="82" y="196" width="15" height="78" rx="6" fill="' + s + '"/><rect x="103" y="196" width="15" height="78" rx="6" fill="' + s + '"/>' +
      '<path d="M72 186 L128 186 L134 238 L66 238Z" fill="' + cl + '"/>' +
      '<path d="M70 120 Q100 108 130 120 L127 196 L73 196Z" fill="' + top + '"/>' +
      (fem ? '' : '<path d="M76 124 L124 182" stroke="#b5452f" stroke-width="7"/>') +
      '<path d="M72 122 L56 186 L66 190 L82 132Z" fill="' + s + '"/><path d="M128 122 L144 186 L134 190 L118 132Z" fill="' + s + '"/>' +
      '<circle cx="61" cy="191" r="7" fill="' + s + '"/><circle cx="139" cy="191" r="7" fill="' + s + '"/>' +
      '<rect x="92" y="98" width="16" height="22" fill="' + s + '"/>' +
      '<ellipse cx="89" cy="277" rx="11" ry="5" fill="' + s + '"/><ellipse cx="111" cy="277" rx="11" ry="5" fill="' + s + '"/>';
  }
  function head(s, rx, ry, ch){
    var d = 'M' + (CX-rx) + ' ' + CY + ' C' + (CX-rx) + ' ' + (CY-ry*1.3) + ' ' + (CX+rx) + ' ' + (CY-ry*1.3) + ' ' + (CX+rx) + ' ' + CY +
      ' C' + (CX+rx) + ' ' + (CY+ry*ch*.9) + ' ' + (CX+9) + ' ' + (CY+ry) + ' ' + CX + ' ' + (CY+ry) +
      ' C' + (CX-9) + ' ' + (CY+ry) + ' ' + (CX-rx) + ' ' + (CY+ry*ch*.9) + ' ' + (CX-rx) + ' ' + CY + 'Z';
    return '<ellipse cx="' + (CX-rx) + '" cy="75" rx="5" ry="8" fill="' + s + '"/><ellipse cx="' + (CX+rx) + '" cy="75" rx="5" ry="8" fill="' + s + '"/>' +
      '<path d="' + d + '" fill="' + s + '" stroke="rgba(0,0,0,.22)" stroke-width="1.5"/>';
  }
  function brows(i, H){
    var b = BROW[i] || BROW[0];
    return '<path d="M82 ' + (61 + b[1]) + ' L94 60 M106 60 L118 ' + (61 + b[1]) + '" stroke="' + H + '" stroke-width="' + b[0] + '" stroke-linecap="round"/>';
  }
  function eye(i, x, fem){
    var y = 70, w = '#fff', p = '#2a1a10', o;
    if (i === 1) o = '<ellipse cx="'+x+'" cy="'+y+'" rx="5.5" ry="2.2" fill="'+w+'"/><circle cx="'+x+'" cy="'+y+'" r="1.8" fill="'+p+'"/>';
    else if (i === 2) o = '<path d="M'+(x-6)+' '+(y+1)+' Q'+x+' '+(y-5)+' '+(x+6)+' '+(y-1)+' Q'+x+' '+(y+3)+' '+(x-6)+' '+(y+1)+'Z" fill="'+w+'"/><circle cx="'+x+'" cy="'+(y-.5)+'" r="2" fill="'+p+'"/>';
    else if (i === 3) o = '<ellipse cx="'+x+'" cy="'+y+'" rx="5" ry="3" fill="'+w+'"/><circle cx="'+x+'" cy="'+(y+.5)+'" r="2" fill="'+p+'"/><path d="M'+(x-5.5)+' '+(y-1)+' L'+(x+5.5)+' '+(y-1)+'" stroke="#5a3a2a" stroke-width="2"/>';
    else if (i === 4) o = '<ellipse cx="'+x+'" cy="'+y+'" rx="5.5" ry="5.5" fill="'+w+'"/><circle cx="'+x+'" cy="'+y+'" r="3" fill="'+p+'"/><circle cx="'+(x+1)+'" cy="'+(y-1)+'" r="1" fill="#fff"/>';
    else if (i === 5) o = '<circle cx="'+x+'" cy="'+y+'" r="2.3" fill="'+p+'"/>';
    else o = '<ellipse cx="'+x+'" cy="'+y+'" rx="4.5" ry="4" fill="'+w+'"/><circle cx="'+x+'" cy="'+y+'" r="2.4" fill="'+p+'"/>';
    if (fem) o += '<path d="M'+(x-5)+' '+(y-4)+' Q'+x+' '+(y-7)+' '+(x+6)+' '+(y-4)+'" stroke="#2a1a10" stroke-width="1.5" fill="none"/>';
    return o;
  }
  function mark(i, by){
    return ['',
      '<path d="M84 78 L90 90" stroke="#8a3a2a" stroke-width="2"/>',
      '<path d="M110 56 L118 84" stroke="#8a3a2a" stroke-width="2"/>',
      '<g fill="#2a3a5a"><circle cx="100" cy="50" r="2"/><circle cx="94" cy="53" r="1.5"/><circle cx="106" cy="53" r="1.5"/></g>',
      '<path d="M114 76 l8 2 M114 80 l8 2 M114 84 l8 2" stroke="#2a3a5a" stroke-width="1.5"/>',
      '<path d="M96 ' + (by - 3) + ' l8 -2" stroke="#8a3a2a" stroke-width="2"/>'][i] || '';
  }
  function beard(i, H, rx, by){
    var L = CX - rx, R = CX + rx;
    var full = 'M'+(L+3)+' '+(CY+6)+' Q'+(L+2)+' '+(by+4)+' 100 '+(by+6)+' Q'+(R-2)+' '+(by+4)+' '+(R-3)+' '+(CY+6)+' Q100 '+(by-8)+' '+(L+3)+' '+(CY+6)+'Z';
    return ['',
      '<path d="'+full+'" fill="'+H+'" opacity=".22"/>',
      '<ellipse cx="100" cy="'+(by+2)+'" rx="7" ry="8" fill="'+H+'"/>',
      '<path d="'+full+'" fill="'+H+'"/>',
      '<path d="M90 '+(by-6)+' Q100 '+(by+30)+' 110 '+(by-6)+'Z" fill="'+H+'"/>',
      '<path d="M'+(L+2)+' '+(CY+2)+' Q'+(L+4)+' '+(by+2)+' 100 '+(by+3)+' Q'+(R-4)+' '+(by+2)+' '+(R-2)+' '+(CY+2)+'" stroke="'+H+'" stroke-width="4" fill="none"/>',
      '<path d="M'+(L+2)+' '+(CY+4)+' Q'+L+' '+(by+24)+' 100 '+(by+34)+' Q'+R+' '+(by+24)+' '+(R-2)+' '+(CY+4)+' Q100 '+(by-6)+' '+(L+2)+' '+(CY+4)+'Z" fill="'+H+'"/>'][i] || '';
  }
  function cap(rx, ry, lift){
    var tp = CY - ry - lift - 14;
    return 'M'+(CX-rx-3)+' 76 C'+(CX-rx-6)+' '+tp+' '+(CX+rx+6)+' '+tp+' '+(CX+rx+3)+' 76 C'+(CX+rx-3)+' 36 '+(CX-rx+3)+' 36 '+(CX-rx-3)+' 76Z';
  }
  function hairBack(i, H, rx){
    if (i === 3) return '<path d="M'+(CX+rx-8)+' 66 Q'+(CX+rx+18)+' 108 '+(CX+rx+6)+' 150 L'+(CX+rx-4)+' 147 Q'+(CX+rx+6)+' 108 '+(CX+rx-16)+' 72Z" fill="'+H+'"/>';
    if (i === 4) return '<path d="M'+(CX-rx-6)+' 62 Q'+(CX-rx-16)+' 118 '+(CX-rx-4)+' 160 L'+(CX+rx+4)+' 160 Q'+(CX+rx+16)+' 118 '+(CX+rx+6)+' 62Z" fill="'+H+'"/>';
    return '';
  }
  function hairFront(i, H, rx, ry){
    var c = '<path d="'+cap(rx, ry, 6)+'" fill="'+H+'"/>', top = CY - ry - 2, o;
    switch (i){
      case 1: return c + '<circle cx="100" cy="'+(top-10)+'" r="10" fill="'+H+'"/><rect x="93" y="'+(top-2)+'" width="14" height="3" rx="1" fill="#c9a24a"/>';
      case 2: return '<path d="'+cap(rx, ry, 1)+'" fill="'+H+'" opacity=".45"/><circle cx="100" cy="'+(top-6)+'" r="7" fill="'+H+'"/><circle cx="100" cy="'+(top+1)+'" r="3" fill="none" stroke="#c9a24a" stroke-width="2"/>';
      case 3: return c + '<rect x="'+(CX+rx-6)+'" y="70" width="6" height="5" fill="#c9a24a"/>';
      case 5: return '<path d="'+cap(rx, ry, 10)+'" fill="#b5452f"/><path d="M'+(CX-rx-3)+' 62 Q100 52 '+(CX+rx+3)+' 62" stroke="#8a2e1e" stroke-width="3" fill="none"/><circle cx="'+(CX+rx+1)+'" cy="56" r="6" fill="#b5452f"/>';
      case 6: return c + '<path d="M'+(CX-rx)+' '+(top+12)+' L'+(CX-rx+6)+' '+(top-8)+' L'+(CX-10)+' '+(top+4)+' L100 '+(top-14)+' L'+(CX+10)+' '+(top+4)+' L'+(CX+rx-6)+' '+(top-8)+' L'+(CX+rx)+' '+(top+12)+'Z" fill="'+H+'"/>';
      case 7: return c + '<path d="M'+(CX-rx-3)+' 74 Q'+(CX-14)+' 44 '+(CX+rx+4)+' 60 Q'+(CX+4)+' 58 '+(CX-rx+4)+' 80Z" fill="'+H+'"/>';
      case 8: return '<path d="'+cap(rx, ry, 1)+'" fill="'+H+'" opacity=".35"/>';
      case 9: o = c; for (var k = -2; k <= 2; k++) o += '<circle cx="'+(100+k*rx*.45)+'" cy="'+(top+4+Math.abs(k)*5)+'" r="9" fill="'+H+'"/>'; return o;
      default: return c;
    }
  }
  function tier(eq, s){ var x = eq[s]; return (x && x.k) ? (+String(x.k).split('_')[1] || 1) : 0; }
  function g(eq, s, str){ var t = tier(eq, s); if (!t) return ''; return lay('gear_' + s + '_' + t) || str.replace(/\{C\}/g, GC[t]); }
  function gearLow(eq){
    return g(eq, 'armor', '<path d="M71 120 Q100 110 129 120 L126 195 L74 195Z" fill="{C}" opacity=".95"/><path d="M100 115 L100 195 M76 152 L124 152" stroke="rgba(0,0,0,.3)" stroke-width="2"/>') +
      g(eq, 'boots', '<rect x="80" y="250" width="18" height="26" rx="4" fill="{C}"/><rect x="102" y="250" width="18" height="26" rx="4" fill="{C}"/><ellipse cx="88" cy="278" rx="13" ry="6" fill="{C}"/><ellipse cx="112" cy="278" rx="13" ry="6" fill="{C}"/>') +
      g(eq, 'gloves', '<circle cx="61" cy="191" r="9" fill="{C}"/><circle cx="139" cy="191" r="9" fill="{C}"/>') +
      g(eq, 'amulet', '<path d="M91 102 Q100 124 109 102" stroke="#c9a24a" stroke-width="1.5" fill="none"/><circle cx="100" cy="123" r="5" fill="{C}" stroke="#5a4428"/>') +
      g(eq, 'shield', '<circle cx="54" cy="168" r="22" fill="{C}" stroke="#3a2e1c" stroke-width="3"/><circle cx="54" cy="168" r="6" fill="#e8d8a8"/>');
  }
  function gearHigh(eq, rx){
    return g(eq, 'helm', '<path d="M'+(CX-rx-7)+' 58 C'+(CX-rx-8)+' 10 '+(CX+rx+8)+' 10 '+(CX+rx+7)+' 58Z" fill="{C}" stroke="rgba(0,0,0,.35)" stroke-width="2"/><rect x="'+(CX-rx-8)+'" y="53" width="'+(rx*2+16)+'" height="6" rx="3" fill="rgba(0,0,0,.25)"/>' +
        (tier(eq, 'helm') >= 4 ? '<path d="M100 6 L93 24 L107 24Z" fill="{C}" stroke="rgba(0,0,0,.3)"/>' : '')) +
      g(eq, 'weapon', '<path d="M139 192 L160 102" stroke="#dcdcdc" stroke-width="5" stroke-linecap="round"/><path d="M131 186 L148 192" stroke="{C}" stroke-width="5" stroke-linecap="round"/><circle cx="138" cy="196" r="4" fill="{C}"/>');
  }

  function svg(L, eq, vb){
    L = L || {}; eq = eq || {};
    var s = SKIN[L.skin | 0] || SKIN[0], H = HC[L.hc | 0] || HC[0], fem = L.g === 1;
    var f = FACE[L.face | 0] || FACE[0], rx = f[0], ry = f[1], by = CY + ry;
    var o = '<svg class="hsvg" viewBox="' + (vb || '0 0 200 300') + '" xmlns="http://www.w3.org/2000/svg">';
    if (!vb) o += '<ellipse cx="100" cy="284" rx="46" ry="8" fill="rgba(0,0,0,.35)"/>';
    o += hairBack(L.hair | 0, H, rx);
    o += lay('body_' + (fem ? 1 : 0)) || body(s, fem);
    o += gearLow(eq);
    o += head(s, rx, ry, f[2]);
    o += brows(L.brow | 0, H) + eye(L.eye | 0, 88, fem) + eye(L.eye | 0, 112, fem);
    o += '<path d="M100 73 L97 83 L102 84" stroke="rgba(0,0,0,.3)" stroke-width="1.5" fill="none"/>';
    o += mark(L.mark | 0, by);
    if (!fem && L.beard) o += beard(L.beard, H, rx, by);
    o += fem ? '<path d="M93 91 Q100 96 107 91 Q100 93 93 91Z" fill="#b5454f"/>'
             : '<path d="M93 92 Q100 95 107 92" stroke="#6a3a2a" stroke-width="2" fill="none"/>';
    if (!fem && L.mous) o += (MOUS[L.mous] || '').replace(/\{H\}/g, H);
    o += hairFront(L.hair | 0, H, rx, ry);
    o += gearHigh(eq, rx);
    return o + '</svg>';
  }
  return { svg:svg };
})();

/* ---------- หน้าต่างวีรบุรุษ ---------- */
var Hero2 = (function(){
  var R = { items:{}, dung:[] }, tab = 'doll', pend = {}, draft = null, dname = null, miss = {}, inst = false;
  var SL = ['helm','armor','weapon','shield','gloves','boots','amulet'];
  var SN = { helm:'หมวก', armor:'เกราะ', weapon:'อาวุธ', shield:'โล่', gloves:'ถุงมือ', boots:'รองเท้า', amulet:'เครื่องราง' };
  var SI = { helm:'🪖', armor:'🥋', weapon:'🗡️', shield:'🛡️', gloves:'🧤', boots:'👢', amulet:'📿' };
  var TN = ['', 'ธรรมดา', 'ดี', 'หายาก', 'ตำนาน', 'เทพ'];
  var TC = ['#777', '#b9ac92', '#6fd35a', '#4db8ff', '#c77dff', '#ffcf40'];
  var STN = { atk:'⚔ โจมตี +#', def:'🛡 ป้องกัน +#', exp:'✨ EXP +#%', regen:'❤ ฟื้นพลังชีวิต +#%/ชม.',
    risk:'🎯 ความเสี่ยงดันเจี้ยน −#%', spd:'🐾 เวลาสำรวจดันเจี้ยน −#%', prod:'🌾 ผลิตทุกชนิด +#/ชม.' };
  var ATT = [['atk','⚔ พลังโจมตี','+80 โจมตีต่อแต้ม · ลดความเสี่ยงในดันเจี้ยน'],
    ['def','🛡 พลังป้องกัน','+80 ป้องกันต่อแต้ม · ลดความเสี่ยงในดันเจี้ยน'],
    ['off','🎖 นำทัพ','+0.2% พลังโจมตีของกองทัพต่อแต้ม'],
    ['prod','🌾 ผลิตทรัพยากร','+3 ทุกชนิดต่อชั่วโมงต่อแต้ม']];
  var LMAX = { g:2, face:10, skin:6, hair:10, hc:6, brow:6, eye:6, mous:7, beard:7, mark:6 };
  var PARTS = [['face','ทรงหน้า'],['skin','สีผิว'],['hair','ทรงผม'],['hc','สีผม'],['brow','คิ้ว'],['eye','ดวงตา'],
    ['mous','หนวด'],['beard','เครา'],['mark','แผลเป็น/รอยสัก']];
  var HAIRN = ['ตัดสั้น','มวยผม','ไว้จุก','ผมยาวรวบ','ผมยาวสยาย','โพกผ้า','ผมตั้ง','แสกข้าง','เกรียน','ผมหยิก'];

  function esc(s){ return String(s == null ? '' : s).replace(/[<>&"]/g, function(c){
    return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]; }); }
  function H(){ var v = V(); return v ? v.srvHero : null; }
  function cmd(p, b, cb){ b.vid = V().id; Sync.cmd('/hero/' + p, b, function(r){ if (r && r.ok && cb) cb(r); }); }
  function sumP(){ var s = 0; for (var k in pend) s += pend[k]; return s; }
  function eqStat(h, st){
    var s = 0;
    SL.forEach(function(k){ var x = h.eq[k], it = x && R.items[x.k]; if (it && it.st === st) s += it.v; });
    return s;
  }
  function risk(h, D){
    var pow = h.lv * 4 + (h.st.atk | 0) * 3 + (h.st.def | 0) * 2 + (eqStat(h, 'atk') + eqStat(h, 'def')) / 25;
    return Math.max(1, D.risk * Math.max(0.25, 1 - pow / (D.i * 120 + 80)) * (1 - eqStat(h, 'risk') / 100));
  }
  function stat(it){ return STN[it.st].replace('#', UI.fmt(it.v)); }
  function dName(i){ var D = R.dung.filter(function(x){ return x.i === i; })[0]; return D ? D.ic + ' ' + D.n : 'ดันเจี้ยน'; }
  function itIcon(k){
    var it = R.items[k];
    if (!it) return '❔';
    var sh = (typeof Sheets !== 'undefined') ? Sheets.get('it_' + k) : null;
    if (sh) return '<img src="' + sh + '" alt="">';
    if (miss[k]) return SI[it.slot];
    return '<img src="' + CFG.ASSET_PATH + 'items/it_' + k + '.png" alt="" onerror="Hero2.miss(this,\'' + k + '\')">';
  }
  function missImg(el, k){ miss[k] = 1; var it = R.items[k]; el.replaceWith(document.createTextNode(it ? SI[it.slot] : '❔')); }
  function bar(lb, v, mx, col){
    return '<div class="hbar"><i style="width:' + Math.min(100, Math.round(v / Math.max(1, mx) * 100)) +
      '%;background:' + col + '"></i><span>' + lb + ' ' + UI.fmt(v) + ' / ' + UI.fmt(mx) + '</span></div>';
  }

  function setRules(r){
    (r.items || []).forEach(function(i){ R.items[i.k] = i; });
    if (r.dungeons){
      R.dung = r.dungeons;
      try { if (typeof DUNGEONS !== 'undefined'){
        DUNGEONS.length = 0;
        r.dungeons.forEach(function(d){ DUNGEONS.push({ id:d.i, name:d.n }); });
      } } catch(e){}
    }
  }

  /* ---------- หน้าหลัก ---------- */
  function openExt(t){ pend = {}; draft = null; open(t || 'doll'); }
  function open(t){
    if (t) tab = t;
    var v = V(), h = H();
    if (!h){
      UI.modal('<h3>🗿 วีรบุรุษ</h3><p class="stnone">กำลังโหลด…</p>');
      Sync.poll(true);
      setTimeout(function(){ if (H()) open(); }, 2500);
      return;
    }
    if (h.lookN === 0 && !Store.get('sw_hlk_' + v.id)){ Store.set('sw_hlk_' + v.id, '1'); tab = 'look'; draft = null; }
    var body = tab === 'bag' ? bagTab(h) : tab === 'look' ? lookTab(h) : tab === 'dung' ? dungTab(h) : dollTab(h);
    UI.modal('<div id="hroot"><h3>🗿 ' + esc(h.name) + ' · Lv.' + h.lv + '</h3><div class="btabs">' +
      [['doll','🗿 ตัวละคร'],['bag','🎒 กระเป๋า'],['look','🎨 ปั้นหน้า'],['dung','🕳️ ดันเจี้ยน']].map(function(x){
        return '<button class="btab' + (x[0] === tab ? ' on' : '') + '" data-ht="' + x[0] + '">' + x[1] + '</button>';
      }).join('') + '</div>' + body + '<button class="btn-cancel" onclick="UI.close()">ปิด</button></div>');
    document.querySelectorAll('[data-ht]').forEach(function(b){
      b.onclick = function(){ if (b.dataset.ht !== 'look') draft = null; open(b.dataset.ht); };
    });
    bindAll(h);
  }
  function repaint(){ if (document.getElementById('hroot')) open(); }

  /* ---------- แท็บตัวละคร ---------- */
  function dollTab(h){
    var t0 = now(), st;
    if (h.dead) st = h.healAt ? '⛑ กำลังรักษา · หายใน ' + UI.dur((h.healAt - t0) / 1000) : '💀 บาดเจ็บสาหัส ต้องรักษา';
    else if (h.dung) st = '🕳️ สำรวจ ' + dName(h.dung.i) + ' · กลับใน ' + UI.dur((h.dung.back - t0) / 1000);
    else if (h.army) st = '⚔️ ออกรบกับกองทัพ';
    else st = '✅ อยู่ในเมือง';
    var o = '<div class="hdoll">' + SL.map(function(s){
      var x = h.eq[s], it = x && R.items[x.k];
      return '<div class="hslot" style="grid-area:' + s + (it ? ';border-color:' + TC[it.tier] : '') + '" data-eq="' + s + '">' +
        (it ? itIcon(x.k) : '<span class="hsl-e">' + SI[s] + '</span>') + '<i>' + SN[s] + '</i></div>';
    }).join('') + '<div class="hd-c">' + HeroArt.svg(h.look, h.eq) + '</div></div>';
    o += bar('✨ EXP', h.exp, h.need, '#8fbf5f') + bar('❤ พลังชีวิต', h.hp, 100, h.hp < 30 ? '#c0392b' : '#d0574a');
    o += '<div class="row"><span>สถานะ</span><b>' + st + '</b></div>';
    if (!h.dead && !h.dung && !h.army && h.hp < 100)
      o += '<button class="' + (h.hp < 30 ? 'btn-rush' : 'btn-use2') + '" data-pot="1">🧪 ยาฟื้นพลัง — เติมเต็ม 💰' +
        Math.max(2, Math.ceil((100 - h.hp) / 10)) + '</button>';
 
    if (h.dead){
      if (!h.healAt) o += '<div class="hdeadbox">ค่ารักษา ' + RES.map(function(r){ return RES_IC[r] + UI.fmt(h.healCost); }).join(' ') +
        '<br>ใช้เวลา ' + UI.dur(h.healSec) + ' (จวนวีรบุรุษ Lv.' + h.mansion + ')</div><button class="btn-ok" id="hHeal">⛑ เริ่มรักษา</button>';
      else o += '<button class="btn-rush" id="hHealNow">⚡ หายทันที 💰' + goldRush((h.healAt - t0) / 1000) + '</button>';
    }
    var left = h.pts - sumP();
    o += '<h4>ค่าพลัง · แต้มเหลือ <b style="color:#ffcf40">' + left + '</b></h4>';
    ATT.forEach(function(a){
      o += '<div class="hrow"><div class="hrl"><b>' + a[1] + '</b><i>' + a[2] + '</i></div><div class="hrv">' +
        ((h.st[a[0]] | 0) + (pend[a[0]] || 0)) + '</div><button class="hplus" data-pt="' + a[0] + '"' +
        (left > 0 ? '' : ' disabled') + '>+</button></div>';
    });
    if (sumP()) o += '<div class="grow2"><button class="btn-ok mini2" id="hPtSave">✔ บันทึกแต้ม</button>' +
      '<button class="btn-cancel mini2" id="hPtRe">ล้าง</button></div>';
    var bon = {};
    SL.forEach(function(s){ var x = h.eq[s], it = x && R.items[x.k]; if (it) bon[it.st] = (bon[it.st] || 0) + it.v; });
    var ks = Object.keys(bon);
    o += '<h4>โบนัสจากอุปกรณ์</h4>' + (ks.length
      ? '<div class="infobox">' + ks.map(function(k){ return STN[k].replace('#', UI.fmt(bon[k])); }).join('<br>') + '</div>'
      : '<p class="stnone">ยังไม่ได้สวมอุปกรณ์ แตะช่องรอบตัวเพื่อเลือกจากกระเป๋า</p>');
    if (h.prod) o += '<div class="row"><span>ผลิตเพิ่มให้เมืองนี้</span><b style="color:#8fbf5f">+' + h.prod + ' ทุกชนิด/ชม.</b></div>';
    return o;
  }

  /* ---------- แท็บกระเป๋า ---------- */
  function bagTab(h){
    var o = '<div class="rbar"><span>🎒 กระเป๋า</span><b>' + h.bag.length + ' / ' + h.bagMax + '</b></div><div class="hbag">';
    for (var i = 0; i < h.bagMax; i++){
      var x = h.bag[i];
      if (!x){ o += '<div></div>'; continue; }
      var it = R.items[x.k] || {};
      o += '<div data-it="' + x.id + '" style="border-color:' + TC[it.tier || 0] + '" class="' +
        (h.lv < (it.req || 0) ? 'lk' : '') + '">' + itIcon(x.k) + '</div>';
    }
    return o + '</div><p class="stnone" style="padding:4px">ได้อุปกรณ์จากการสำรวจ 🕳️ ดันเจี้ยน · ' +
      'อัปเกรดจวนวีรบุรุษเพื่อขยายกระเป๋า</p>';
  }
  function itemModal(iid, eqSlot){
    var h = H(), x = eqSlot ? h.eq[eqSlot] : h.bag.filter(function(y){ return y.id === iid; })[0];
    if (!x) return;
    var it = R.items[x.k], ok = h.lv >= it.req;
    var o = '<h3>' + itIcon(x.k) + ' ' + esc(it.name) + '</h3><div class="infobox"><b style="color:' + TC[it.tier] + '">' +
      TN[it.tier] + '</b> · ' + SN[it.slot] + '<br>' + stat(it) + '<br><span class="' + (ok ? '' : 'lack') +
      '">ต้องเป็นวีรบุรุษ Lv.' + it.req + ' ขึ้นไป</span></div>';
    if (eqSlot) o += '<button class="btn-use" id="iUn">⬇ ถอดเก็บเข้ากระเป๋า</button>';
    else o += '<button class="btn-ok" id="iEq"' + (ok ? '' : ' disabled') + '>' + (ok ? '⬆ สวมใส่' : '🔒 เลเวลยังไม่ถึง') +
      '</button><button class="btn-del" id="iSell">💰 ขาย · ได้ทุกชนิด +' + UI.fmt(it.sell) + '</button>';
    o += '<button class="btn-cancel" id="iBk">ย้อนกลับ</button>';
    UI.modal(o);
    document.getElementById('iBk').onclick = function(){ open(); };
    var u = document.getElementById('iUn');
    if (u) u.onclick = function(){ cmd('unequip', { slot:eqSlot }, function(){ open('doll'); }); };
    var e = document.getElementById('iEq');
    if (e) e.onclick = function(){ cmd('equip', { iid:iid }, function(){ open('doll'); }); };
    var s = document.getElementById('iSell');
    if (s) s.onclick = function(){ if (confirm('ขาย ' + it.name + '?')) cmd('sell', { iid:iid }, function(){ open('bag'); }); };
  }

  /* ---------- แท็บปั้นหน้า ---------- */
  function lookTab(h){
    if (!draft){ draft = JSON.parse(JSON.stringify(h.look)); dname = h.name; }
    var o = '<div class="hlook"><div class="pv">' + HeroArt.svg(draft, {}) + '</div><div class="ct">' +
      '<input id="lkName" class="selbox" maxlength="16" value="' + esc(dname) + '" placeholder="ชื่อวีรบุรุษ">' +
      '<div class="btabs"><button class="btab' + (draft.g === 0 ? ' on' : '') + '" data-g="0">♂ ชาย</button>' +
      '<button class="btab' + (draft.g === 1 ? ' on' : '') + '" data-g="1">♀ หญิง</button></div>' +
      PARTS.map(function(p){
        if (draft.g === 1 && (p[0] === 'mous' || p[0] === 'beard')) return '';
        var val = draft[p[0]] | 0;
        var lab = p[0] === 'hair' ? HAIRN[val]
          : ((p[0] === 'mous' || p[0] === 'beard' || p[0] === 'mark') && !val) ? 'ไม่มี' : 'แบบ ' + (val + 1);
        return '<div class="lkrow"><span>' + p[1] + '</span><button data-lk="' + p[0] + '" data-d="-1">◀</button><b>' +
          lab + '</b><button data-lk="' + p[0] + '" data-d="1">▶</button></div>';
      }).join('') + '</div></div>';
    return o + '<button class="btn-use2" id="lkRnd">🎲 สุ่มใหม่</button><button class="btn-ok" id="lkSave">✔ บันทึก · ' +
      (h.lookN > 0 ? 'เปลี่ยนหน้าตา 💰30 ทอง (เปลี่ยนแค่ชื่อฟรี)' : 'ฟรีครั้งแรก') + '</button>';
  }

  /* ---------- แท็บดันเจี้ยน ---------- */
  function dungTab(h){
    var t0 = now(), o = '';
    if (h.dung) o += '<div class="dgrun">🕳️ กำลังสำรวจ <b>' + dName(h.dung.i) + '</b><br>กลับในอีก ' +
      UI.dur((h.dung.back - t0) / 1000) + '</div>';
    o += '<div class="infobox">ส่งวีรบุรุษไปสำรวจคนเดียว ได้ EXP ทรัพยากร และอุปกรณ์<br>ต้องมีพลังชีวิต 30% ขึ้นไป · ' +
      'ชั้นที่ลึกขึ้นต้องอัปจวนวีรบุรุษ (ตอนนี้ Lv.' + h.mansion + ')</div>';
    var busy = h.dead || h.dung || h.army || h.hp < 30;
    R.dung.forEach(function(D){
      var lock = h.mansion < D.req;
      var sec = Math.max(60, Math.round(D.min * 60 * (1 - eqStat(h, 'spd') / 100) / CFG.SPEED));
      o += '<div class="dgcard' + (lock ? ' lock' : '') + '"><div class="dgh"><b>' + D.ic + ' ' + D.n + '</b><span>จวน Lv.' +
        D.req + '</span></div><div class="dgs"><i>⏱ ' + UI.dur(sec) + '</i><i>✨ ~' + D.exp + ' EXP</i><i>🎁 ' +
        Math.round(D.drop * 100) + '%</i><i>📦 ~' + UI.fmt(D.res) + '</i><i class="dgrisk">💀 ' + risk(h, D).toFixed(1) +
        '%</i></div>' + (lock ? '<div class="bc-lock">🔒 ต้องอัปจวนวีรบุรุษเป็น Lv.' + D.req + '</div>'
          : '<button class="btn-ok mini2" data-dg="' + D.i + '"' + (busy ? ' disabled' : '') + '>🕳️ ส่งไปสำรวจ</button>') + '</div>';
    });
    if (!h.dead && !h.dung && !h.army && h.hp < 30) o += '<p class="stnone">พลังชีวิตต่ำกว่า 30% รอพักฟื้น หรือใช้ยา</p>' +
      '<button class="btn-rush" data-pot="1">🧪 ยาฟื้นพลัง 💰' + Math.max(2, Math.ceil((100 - h.hp) / 10)) + '</button>';
    return o;
  }

  /* ---------- ผูกปุ่ม ---------- */
  function bindAll(h){
    function on(id, fn){ var e = document.getElementById(id); if (e) e.onclick = fn; }
    document.querySelectorAll('[data-eq]').forEach(function(n){
      n.onclick = function(){ if (h.eq[n.dataset.eq]) itemModal(0, n.dataset.eq); else open('bag'); };
    });
    document.querySelectorAll('[data-pt]').forEach(function(b){
      b.onclick = function(){ if (h.pts - sumP() <= 0) return; pend[b.dataset.pt] = (pend[b.dataset.pt] || 0) + 1; open(); };
    });
    on('hPtRe', function(){ pend = {}; open(); });
    on('hPtSave', function(){ var a = pend; cmd('points', { add:a }, function(){ pend = {}; open('doll'); }); });
    on('hHeal', function(){ cmd('heal', {}, function(){ open('doll'); }); });
    on('hHealNow', function(){ cmd('healnow', {}, function(){ open('doll'); }); });
    document.querySelectorAll('[data-pot]').forEach(function(b){
    b.onclick = function(){ b.disabled = true; cmd('potion', {}, function(){ Sync.toast('🧪 พลังชีวิตเต็มแล้ว'); open(); }); };
    });
    document.querySelectorAll('[data-it]').forEach(function(n){ n.onclick = function(){ itemModal(+n.dataset.it); }; });
    document.querySelectorAll('[data-dg]').forEach(function(b){
      b.onclick = function(){
        b.disabled = true;
        cmd('dungeon', { i:+b.dataset.dg }, function(){ Sync.toast('🕳️ วีรบุรุษออกเดินทางแล้ว'); open('dung'); });
      };
    });
    function keepName(){ var n = document.getElementById('lkName'); if (n) dname = n.value; }
    document.querySelectorAll('[data-lk]').forEach(function(b){
      b.onclick = function(){
        keepName();
        var k = b.dataset.lk, m = LMAX[k];
        draft[k] = ((draft[k] | 0) + (+b.dataset.d) + m) % m;
        open('look');
      };
    });
    document.querySelectorAll('[data-g]').forEach(function(b){
      b.onclick = function(){
        keepName();
        draft.g = +b.dataset.g;
        if (draft.g === 1){ draft.mous = 0; draft.beard = 0; }
        open('look');
      };
    });
    on('lkRnd', function(){
      keepName();
      var g0 = draft.g;
      for (var k in LMAX) draft[k] = Math.floor(Math.random() * LMAX[k]);
      draft.g = g0;
      if (g0 === 1){ draft.mous = 0; draft.beard = 0; }
      if (Math.random() < 0.7) draft.mark = 0;
      open('look');
    });
    on('lkSave', function(){
      keepName();
      cmd('look', { look:draft, name:(dname || '').trim() }, function(){
        draft = null; Sync.toast('✔ บันทึกวีรบุรุษแล้ว'); open('doll');
      });
    });
  }

  /* ---------- รายงานดันเจี้ยน ---------- */
  function repBody(d){
    var o = '<div class="rpt-g">🗿 <b>' + esc(d.hero) + '</b> · ' + esc(d.dung) + '</div>';
    if (d.die) o += '<div class="rpt-g" style="color:#ff9a9a">💀 บาดเจ็บสาหัส เปิดหน้าวีรบุรุษเพื่อรักษา</div>';
    o += '<div class="rpt-g">✨ EXP +' + UI.fmt(d.exp) + (d.lv1 > d.lv0 ? ' · 🎉 เลเวลอัปเป็น Lv.' + d.lv1 : '') + '</div>';
    if (d.res) o += '<div class="rpt-g">📦 ' + RES.map(function(r){ return RES_IC[r] + UI.fmt(d.res[r] || 0); }).join(' ') + '</div>';
    var it = d.item && R.items[d.item];
    if (it) o += '<div class="rpt-g">🎁 ได้ <b style="color:' + TC[it.tier] + '">' + esc(it.name) + '</b> (' +
      TN[it.tier] + ' · ' + stat(it) + ')</div>';
    var it2 = d.lost && R.items[d.lost];
    if (it2) o += '<div class="rpt-g">🎒 กระเป๋าเต็ม จึงขาย ' + esc(it2.name) + ' เป็นทรัพยากรให้แล้ว</div>';
    return o;
  }

  /* ---------- ติดตั้ง (เรียกจาก Sync.install) ---------- */
  function adapt(v){
    var h = v && v.srvHero;
    if (!h) return { level:1, exp:0, dead:false, away:false, healing:false, free:0, name:'วีรบุรุษ' };
    return { level:h.lv, exp:h.exp, dead:h.dead, away:!!(h.dung || h.army), healing:!!(h.dead && h.healAt), free:h.pts, name:h.name };
  }
  function install(){
    if (inst) return;
    inst = true;
    if (typeof Hero !== 'undefined'){
      Hero.open = function(){ openExt('doll'); };
      Hero.get = adapt;
      Hero.expNeed = function(lv){ var h = H(); return (h && h.lv === lv) ? h.need : 100; };
      Hero.healLeft = function(v){ var h = v && v.srvHero; return (h && h.healAt) ? Math.max(0, (h.healAt - now()) / 1000) : 0; };
      Hero.prodBonus = function(v){ var h = v && v.srvHero; return h ? h.prod : 0; };
      Hero.healPanel = function(){ return ''; };
      Hero.bindHeal = function(){};
    }
    if (typeof Dungeon !== 'undefined'){
      Dungeon.open = function(){ openExt('dung'); };
      Dungeon.running = function(v){ var h = v && v.srvHero; return (h && h.dung) ? { id:h.dung.i } : null; };
      Dungeon.left = function(v){ var h = v && v.srvHero; return (h && h.dung) ? Math.max(0, (h.dung.back - now()) / 1000) : 0; };
    }
    if (typeof HUD !== 'undefined'){
      var hu = HUD.update;
      HUD.update = function(){
        hu.apply(HUD, arguments);
        try {
          var h = H(), ic = document.querySelector('#herobtn .hb-ic');
          if (h && ic && !h.dead && !h.dung && !h.army) ic.innerHTML = HeroArt.svg(h.look, h.eq, '56 20 88 88');
        } catch(e){}
      };
    }
  }

  return { setRules:setRules, install:install, open:openExt, repaint:repaint, miss:missImg, repBody:repBody };
})();