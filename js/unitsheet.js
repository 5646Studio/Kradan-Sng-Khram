/* ============ UnitSheet v14f — ตัดแผ่นภาพทหาร 5×4 · ลบพื้นขาว · ใช้แทนไอคอนหน่วย ============ */
var UnitSheet = (function(){
  var SHEET = { file:'units_sheet', cols:5, rows:4 };
  var NAMES = ['inf_d','inf_a','archer','crossbow','inf_x',
               'cav_l','cav_h','elephant','elephant_l','scout',
               'catapult','ram','tower','cannon','supply',
               'settler','merchant','chief','banner','monk'];
  var out = {}, ready = false;

  function key(tribe, k){ return (k === 'cav_h' && (tribe === 1 || tribe === 2)) ? 'elephant' : k; }
  function get(tribe, k){ return out[key(tribe, k)] || null; }
  function isBg(d, i){
    if (d[i + 3] < 20) return true;
    var r = d[i], g = d[i + 1], b = d[i + 2], mn = Math.min(r, g, b), mx = Math.max(r, g, b);
    return mn >= 222 && mx - mn <= 28;
  }
  function cut(img, cx, cy, cw, ch){
    var c = document.createElement('canvas'); c.width = cw; c.height = ch;
    var x = c.getContext('2d');
    x.drawImage(img, cx, cy, cw, ch, 0, 0, cw, ch);
    var id = x.getImageData(0, 0, cw, ch), d = id.data, gone = new Uint8Array(cw * ch), st = [];
    function push(p){ if (!gone[p] && isBg(d, p * 4)){ gone[p] = 1; st.push(p); } }
    for (var i = 0; i < cw; i++){ push(i); push((ch - 1) * cw + i); }
    for (var j = 0; j < ch; j++){ push(j * cw); push(j * cw + cw - 1); }
    while (st.length){
      var p = st.pop(), px = p % cw, py = (p - px) / cw;
      d[p * 4 + 3] = 0;
      if (px > 0) push(p - 1); if (px < cw - 1) push(p + 1);
      if (py > 0) push(p - cw); if (py < ch - 1) push(p + cw);
    }
    /* ทำขอบให้นุ่ม ไม่ให้มีเส้นขาว */
    for (var q = 0; q < cw * ch; q++){
      if (gone[q]) continue;
      var qx = q % cw, near = (qx > 0 && gone[q - 1]) || (qx < cw - 1 && gone[q + 1]) ||
        (q >= cw && gone[q - cw]) || (q < cw * (ch - 1) && gone[q + cw]);
      if (near && Math.min(d[q * 4], d[q * 4 + 1], d[q * 4 + 2]) > 200) d[q * 4 + 3] = 110;
    }
    var x0 = cw, y0 = ch, x1 = -1, y1 = -1;
    for (var yy = 0; yy < ch; yy++) for (var xx = 0; xx < cw; xx++)
      if (d[(yy * cw + xx) * 4 + 3] > 30){
        if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy;
      }
    if (x1 < 0) return null;
    x.putImageData(id, 0, 0);
    var w = x1 - x0 + 1, h = y1 - y0 + 1, S = 128, sc = Math.min((S - 6) / w, (S - 6) / h);
    var o = document.createElement('canvas'); o.width = o.height = S;
    var ox = o.getContext('2d');
    ox.imageSmoothingQuality = 'high';
    ox.drawImage(c, x0, y0, w, h, (S - w * sc) / 2, S - 3 - h * sc, w * sc, h * sc);
    try { return o.toDataURL('image/png'); } catch(e){ return null; }
  }
  function build(img){
    var cw = Math.floor(img.naturalWidth / SHEET.cols), ch = Math.floor(img.naturalHeight / SHEET.rows);
    NAMES.forEach(function(n, i){
      var src = cut(img, (i % SHEET.cols) * cw, Math.floor(i / SHEET.cols) * ch, cw, ch);
      if (src) out[n] = src;
    });
    ready = true;
    if (typeof Icons !== 'undefined' && Icons.provide){
      Icons.provide('merchant', out.merchant);
      Icons.provide('u_elephant', out.elephant);
      Icons.provide('u_ram', out.ram);
      Icons.provide('cavalry', out.cav_l);
    }
  }
  function load(){
    var ex = ['png', 'webp', 'jpg'], i = 0;
    (function nx(){
      if (i >= ex.length) return;
      var im = new Image();
      im.onload = function(){ if (im.naturalWidth) setTimeout(function(){ build(im); }, 50); else nx(); };
      im.onerror = nx;
      im.src = CFG.ASSET_PATH + 'units/' + SHEET.file + '.' + ex[i++];
    })();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load); else load();
  return { get:get, ready:function(){ return ready; }, all:function(){ return out; } };
})();