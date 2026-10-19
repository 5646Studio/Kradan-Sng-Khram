/* ============ Sheets v14g — แผ่นภาพรวมทุกหมวด · ตัดอัตโนมัติ · ลบพื้นขาว ============
   ลำดับการใช้ภาพ: ไฟล์แยก > แผ่นรวม > ภาพที่โค้ดวาดเอง */
var Sheets = (function(){
  var got = {}, LIST = [], EXT = ['png', 'webp', 'jpg'];
  var TRIBE = ['sukhothai', 'lanna', 'khmer', 'srivijaya'];
  var U20 = ['inf_d','inf_a','archer','crossbow','inf_x','cav_l','cav_h','elephant','elephant_l','scout',
    'catapult','ram','tower','cannon','supply','settler','merchant','chief','banner','monk'];
  var BLD = ['main','rally','warehouse','granary','market','embassy','barracks','stable','workshop','smithy',
    'armoury','watchtower','cranny','townhall','residence','palace','hero','temple','trainground','infirmary',
    'greatbarracks','greatstable','greatwarehouse','greatgranary','mill','royalmill','sawmill','brickyard','foundry'];
  var BIO = ['water','wetland','lowland','grass','forest','dense','hill','mountain','dry'];
  var SLOT = ['helm','armor','weapon','shield','gloves','boots','amulet'];
  var UIS = [
    ['wheat','wood','iron','clay','gold','pop','villages','gear','msg','rank','quest','pin','home','shop','bug',
     'nav_village','nav_fields','nav_world','nav_reports','help'],
    ['rush','add','upgrade','ok','lock','time','wait','alarm','search','refresh','trash','back','send','rename','block',
     'logout','warning','soon','key','receipt'],
    ['attack','defense','army','cavalry','scout','u_elite','u_elephant','u_ram','train','target','distance','speed',
     'loot','dead','away','protect','loyalty','ally','fort','crown'],
    ['hero','heal','exp','amulet','boots','gloves','star','star2','d_bat','d_naga','oasis','stats','merchant','hammer',
     null,null,null,null,null,null],
    ['b_main','b_warehouse','b_granary','b_market','b_embassy','b_armoury','b_tower','b_cranny','b_townhall','b_temple',
     'b_trainground','b_greatstable','b_greatwarehouse','b_mill','b_royalmill','b_sawmill','b_brickyard','b_foundry',null,null]
  ];
  function grid(c, r, fn){ var a = []; for (var y = 0; y < r; y++) for (var x = 0; x < c; x++) a.push(fn(x, y)); return a; }
  function add(dir, file, cols, rows, names, o){
    o = o || {};
    LIST.push({ dir:dir, file:file, cols:cols, rows:rows, names:names, size:o.size || 256, keep:!!o.keep, kind:o.kind || 'asset' });
  }

  add('units/', 'units_sheet', 5, 4, U20.map(function(n){ return 'u_' + n; }), { size:128, kind:'unit' });
  TRIBE.forEach(function(t, i){
    add('units/', 'units_' + t + '_sheet', 5, 4, U20.map(function(n){ return 'u' + i + '_' + n; }), { size:128, kind:'unit' });
  });
  for (var s = 0; s < 6; s++) (function(s){
    add('buildings/', 'buildings_sheet_' + (s + 1), 5, 4,
      grid(5, 4, function(c, r){ var b = BLD[s * 5 + c]; return b ? 'bd_' + b + '_' + (r + 1) : null; }));
  })(s);
  add('fields/', 'fields_sheet', 5, 4, grid(5, 4, function(c, r){ return 'fd_' + ['wheat','wood','iron','clay'][r] + '_' + c; }));
  add('items/', 'items_sheet', 5, 7, grid(5, 7, function(c, r){ return 'it_' + SLOT[r] + '_' + (c + 1); }), { size:128, kind:'item' });
  add('map/', 'terrain_sheet', 3, 9, grid(3, 9, function(c, r){ return 'tr_' + BIO[r] + '_' + c; }), { keep:true });
  add('map/', 'markers_sheet', 6, 3, ['oa_wheat','oa_wood','oa_iron','oa_clay','oa_double','vl_own',
    'vl_capital','vl_ally','vl_enemy','vl_neutral','vl_npc','ov_tree_small',
    'ov_tree_cluster','ov_rock_small','ov_peak','ov_clay_pit','ov_wheat_patch','ov_reed']);
  add('scenes/', 'hub_sheet', 5, 1, ['hub_0','hub_1','hub_2','hub_3','hub_4'], { kind:'hub' });
  UIS.forEach(function(a, i){
    add('ui/', 'ui_sheet_' + (i + 1), 5, 4, a.map(function(n){ return n ? 'ui_' + n : null; }), { size:128, kind:'ui' });
  });

  function isBg(d, i){
    if (d[i + 3] < 20) return true;
    var mn = Math.min(d[i], d[i + 1], d[i + 2]), mx = Math.max(d[i], d[i + 1], d[i + 2]);
    return mn >= 222 && mx - mn <= 28;
  }
  function cut(img, cx, cy, cw, ch, S, keep){
    var c = document.createElement('canvas'); c.width = cw; c.height = ch;
    var x = c.getContext('2d');
    x.drawImage(img, cx, cy, cw, ch, 0, 0, cw, ch);
    if (keep){
      var k = document.createElement('canvas'); k.width = k.height = S;
      k.getContext('2d').drawImage(c, 0, 0, cw, ch, 0, 0, S, S);
      try { return k.toDataURL('image/png'); } catch(e){ return null; }
    }
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
    var w = x1 - x0 + 1, h = y1 - y0 + 1, sc = Math.min((S - 6) / w, (S - 6) / h);
    var o = document.createElement('canvas'); o.width = o.height = S;
    var ox = o.getContext('2d');
    ox.imageSmoothingQuality = 'high';
    ox.drawImage(c, x0, y0, w, h, (S - w * sc) / 2, S - 3 - h * sc, w * sc, h * sc);
    try { return o.toDataURL('image/png'); } catch(e){ return null; }
  }
  function build(sh, img){
    var cw = Math.floor(img.naturalWidth / sh.cols), ch = Math.floor(img.naturalHeight / sh.rows);
    sh.names.forEach(function(key, i){
      if (!key) return;
      var src = cut(img, (i % sh.cols) * cw, Math.floor(i / sh.cols) * ch, cw, ch, sh.size, sh.keep);
      if (!src) return;
      got[key] = src;
      if (sh.kind === 'asset' && typeof Assets !== 'undefined' && Assets.provide) Assets.provide(key, src);
      else if (sh.kind === 'ui' && typeof Icons !== 'undefined' && Icons.provide) Icons.provide(key.slice(3), src);
    });
    if (sh.kind === 'unit' && typeof Icons !== 'undefined' && Icons.provide){
      var p = sh.names[0].split('_')[0] + '_';
      Icons.provide('merchant', got[p + 'merchant']);
      Icons.provide('u_elephant', got[p + 'elephant']);
      Icons.provide('u_ram', got[p + 'ram']);
      Icons.provide('cavalry', got[p + 'cav_l']);
    }
    if (sh.kind === 'hub') try { FieldView.render(); } catch(e){}
    if (sh.kind === 'item') try { Hero2.repaint(); } catch(e){}
  }
  function load(sh){
    var i = 0;
    (function nx(){
      if (i >= EXT.length) return;
      var im = new Image();
      im.onload = function(){ if (im.naturalWidth) setTimeout(function(){ build(sh, im); }, 30); else nx(); };
      im.onerror = nx;
      im.src = CFG.ASSET_PATH + sh.dir + sh.file + '.' + EXT[i++];
    })();
  }
  function start(){ LIST.forEach(function(sh, i){ setTimeout(function(){ load(sh); }, i * 120); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  return { get:function(k){ return got[k] || null; }, list:LIST };
})();

var UnitSheet = {
  get:function(tribe, k){
    return Sheets.get('u' + tribe + '_' + k) ||
      Sheets.get('u_' + ((k === 'cav_h' && (tribe === 1 || tribe === 2)) ? 'elephant' : k));
  }
};