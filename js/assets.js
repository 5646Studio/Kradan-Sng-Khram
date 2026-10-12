/* ============ Assets v13e — แยกโฟลเดอร์ · มีรูปใช้รูป ไม่มีก็วาดเอง ============ */
var Assets = (function(){
  var img = {}, missing = {}, terr = {}, ready = false, pend = null;
  var DIR = { bd:'buildings/', fd:'fields/', sc:'scenes/', tr:'map/', ov:'map/',
              oa:'map/', vl:'map/', ui:'ui/' };
  var EXT = ['png', 'webp'];

  function manifest(){
    var L = [];
    BIOMES.forEach(function(b){
      L.push('sc_city_' + b.key, 'sc_field_' + b.key,
             'tr_' + b.key + '_0', 'tr_' + b.key + '_1', 'tr_' + b.key + '_2');
    });
    BUILDINGS.forEach(function(b, i){
      if (i === 0) return;
      for (var t = 1; t <= 4; t++) L.push('bd_' + b.key + '_' + t);
    });
    RES.forEach(function(r){ for (var t = 0; t <= 4; t++) L.push('fd_' + r + '_' + t); });
    ['vl_own','vl_capital','vl_ally','vl_enemy','vl_neutral','vl_npc',
     'oa_wheat','oa_wood','oa_iron','oa_clay','oa_double',
     'ov_tree_small','ov_tree_cluster','ov_rock_small','ov_peak',
     'ov_clay_pit','ov_wheat_patch','ov_reed'].forEach(function(k){ L.push(k); });
    return L;
  }
  function url(key, ext){
    return CFG.ASSET_PATH + (DIR[key.split('_')[0]] || '') + key + '.' + ext;
  }
  /* รูปที่โหลดเสร็จทีหลัง → วาดหน้าจอใหม่ */
  function changed(){
    if (!ready || pend) return;
    pend = setTimeout(function(){
      pend = null;
      try {
        if (typeof Game !== 'undefined' && Game.villages && Game.villages.length &&
            typeof UI !== 'undefined') UI.refreshAll();
      } catch(e){}
    }, 700);
  }
  function tryLoad(key, done){
    var i = 0;
    (function next(){
      if (i >= EXT.length){ missing[key] = true; done(); return; }
      var e = new Image();
      e.onload = function(){
        if (e.naturalWidth > 0){ img[key] = e; changed(); done(); } else next();
      };
      e.onerror = next;
      e.src = url(key, EXT[i++]);
    })();
  }
  function load(cb){
    var L = manifest(), left = L.length, called = false;
    function finish(){
      if (called) return;
      called = true; ready = true;
      try { if (cb) cb(); } catch(e){ logErr('Assets.cb', e); }
    }
    if (!left) return finish();
    setTimeout(finish, 1500);           /* ไม่รอนาน — เริ่มเกมก่อน รูปตามมาทีหลัง */
    L.forEach(function(k){ tryLoad(k, function(){ if (--left <= 0) finish(); }); });
  }

  function get(key){ return key ? (img[key] || null) : null; }
  function has(key){ return !!img[key]; }
  function tier(level, max){
    max = max || 20;
    if (level <= 0) return 1;
    var r = level / max;
    return r <= 0.25 ? 1 : r <= 0.55 ? 2 : r <= 0.8 ? 3 : 4;
  }

  /* ---------- พื้นผิวแผนที่ ---------- */
  function terrain(biomeKey, variant, size){
    var k = 'tr_' + biomeKey + '_' + (variant % 3);
    if (img[k]) return img[k];
    var ck = biomeKey + '_' + (variant % 3) + '_' + Math.round(size);
    if (terr[ck]) return terr[ck];
    if (Object.keys(terr).length > 240) terr = {};
    terr[ck] = makeTile(biomeKey, variant % 3, Math.max(8, Math.round(size)));
    return terr[ck];
  }
  function shade(hex, amt){
    var r = parseInt(hex.substr(1,2),16), g = parseInt(hex.substr(3,2),16),
        b = parseInt(hex.substr(5,2),16);
    function c(x){ return Math.max(0, Math.min(255, x + amt)); }
    return 'rgb(' + c(r) + ',' + c(g) + ',' + c(b) + ')';
  }
  function makeTile(key, v, s){
    var cv = document.createElement('canvas');
    cv.width = s; cv.height = s;
    var c = cv.getContext('2d'), base = '#6b7a4a';
    for (var i = 0; i < BIOMES.length; i++) if (BIOMES[i].key === key){ base = BIOMES[i].color; break; }
    c.fillStyle = shade(base, (v-1)*7);
    c.fillRect(0, 0, s, s);
    var n = Math.max(4, Math.round(s/7));
    for (var j = 0; j < n; j++){
      var hx = Math.abs((Math.sin((j+1)*12.9898 + v*4.1) * 43758.5453) % 1);
      var hy = Math.abs((Math.sin((j+1)*78.233 + v*7.7) * 43758.5453) % 1);
      c.fillStyle = 'rgba(0,0,0,' + (0.04 + (j%3)*0.018) + ')';
      c.fillRect(hx*s, hy*s, Math.max(1, s*0.055), Math.max(1, s*0.055));
    }
    if (key === 'water' || key === 'wetland'){
      c.strokeStyle = 'rgba(210,235,250,.22)';
      c.lineWidth = Math.max(1, s*0.022);
      for (var w = 0; w < 3; w++){
        c.beginPath();
        c.moveTo(0, s*(0.25 + w*0.25));
        c.quadraticCurveTo(s*0.5, s*(0.25 + w*0.25) - s*0.07, s, s*(0.25 + w*0.25));
        c.stroke();
      }
    } else if (key === 'mountain' || key === 'hill'){
      c.fillStyle = 'rgba(255,255,255,.07)';
      c.beginPath(); c.moveTo(s*0.5, s*0.2); c.lineTo(s*0.82, s*0.72);
      c.lineTo(s*0.18, s*0.72); c.closePath(); c.fill();
    } else if (key === 'forest' || key === 'dense'){
      c.fillStyle = 'rgba(20,45,18,.2)';
      var cnt = key === 'dense' ? 4 : 2;
      for (var t = 0; t < cnt; t++){
        c.beginPath();
        c.arc(s*(0.22 + (t%2)*0.4), s*(0.3 + Math.floor(t/2)*0.32), s*0.11, 0, 6.284);
        c.fill();
      }
    }
    c.strokeStyle = 'rgba(0,0,0,.10)'; c.lineWidth = 1;
    c.strokeRect(0.5, 0.5, s-1, s-1);
    return cv;
  }
  function stats(){
    return { loaded:Object.keys(img).length, missing:Object.keys(missing).length, ready:ready };
  }
  return { load:load, get:get, has:has, tier:tier, terrain:terrain, stats:stats };
})();