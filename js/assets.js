/* ============ Assets v13 — โหลดรูปถ้ามี ไม่มีก็ข้าม ============ */

var Assets = (function(){
  var img = {}, missing = {}, terr = {}, ready = false;

  /* รายการไฟล์ที่ "ถ้ามี" จะถูกใช้ — ไม่มีก็ไม่เป็นไร */
  function manifest(){
    var L = [];
    /* พื้นหลังฉาก */
    BIOMES.forEach(function(b){
      L.push('sc_city_' + b.key);
      L.push('sc_field_' + b.key);
      L.push('tr_' + b.key + '_0');
      L.push('tr_' + b.key + '_1');
      L.push('tr_' + b.key + '_2');
    });
    /* อาคาร 4 ระดับ */
    BUILDINGS.forEach(function(b, i){
      if (i === 0) return;
      for (var t = 1; t <= 4; t++) L.push('bd_' + b.key + '_' + t);
    });
    /* หลุมทรัพยากร 5 ระดับ */
    RES.forEach(function(r){
      for (var t = 0; t <= 4; t++) L.push('fd_' + r + '_' + t);
    });
    /* หมุดเมือง */
    ['vl_own','vl_capital','vl_ally','vl_enemy','vl_neutral','vl_npc']
      .forEach(function(k){ L.push(k); });
    /* โอเอซิส */
    ['oa_wheat','oa_wood','oa_iron','oa_clay','oa_double']
      .forEach(function(k){ L.push(k); });
    /* โอเวอร์เลย์ภูมิประเทศ */
    ['ov_tree_small','ov_tree_cluster','ov_rock_small','ov_peak',
     'ov_clay_pit','ov_wheat_patch','ov_reed']
      .forEach(function(k){ L.push(k); });
    return L;
  }

  var EXT = ['png', 'webp', 'jpg'];

  function tryLoad(key, done){
    var i = 0;
    function next(){
      if (i >= EXT.length){ missing[key] = true; done(); return; }
      var e = new Image();
      var url = CFG.ASSET_PATH + key + '.' + EXT[i++];
      e.onload = function(){
        if (e.naturalWidth > 0){ img[key] = e; done(); }
        else next();
      };
      e.onerror = next;
      e.src = url;
    }
    next();
  }

  function load(cb){
    var L = manifest(), n = L.length, done = 0, called = false;
    function finish(){
      if (called) return;
      called = true; ready = true;
      try { cb && cb(); } catch(e){ logErr('Assets.cb', e); }
    }
    if (!n) return finish();
    /* กันค้าง — อย่างช้า 4 วินาทีต้องไปต่อ */
    var guard = setTimeout(finish, 4000);
    L.forEach(function(k){
      tryLoad(k, function(){
        done++;
        if (done >= n){ clearTimeout(guard); finish(); }
      });
    });
  }

  function get(key){
    if (!key) return null;
    return img[key] || null;
  }
  function has(key){ return !!img[key]; }

  /* ระดับรูป 1-4 ตามเลเวล */
  function tier(level, max){
    max = max || 20;
    if (level <= 0) return 1;
    var r = level / max;
    if (r <= 0.25) return 1;
    if (r <= 0.55) return 2;
    if (r <= 0.8)  return 3;
    return 4;
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
    r = Math.max(0, Math.min(255, r + amt));
    g = Math.max(0, Math.min(255, g + amt));
    b = Math.max(0, Math.min(255, b + amt));
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  function makeTile(key, v, s){
    var cv = document.createElement('canvas');
    cv.width = s; cv.height = s;
    var c = cv.getContext('2d');
    var B = null;
    for (var i = 0; i < BIOMES.length; i++)
      if (BIOMES[i].key === key){ B = BIOMES[i]; break; }
    var base = B ? B.color : '#6b7a4a';

    c.fillStyle = shade(base, (v-1)*7);
    c.fillRect(0, 0, s, s);

    /* ลายจุดเล็ก ๆ ให้ไม่เรียบเกินไป */
    var n = Math.max(4, Math.round(s/7));
    for (var j = 0; j < n; j++){
      var hx = (Math.sin((j+1)*12.9898 + v*4.1) * 43758.5453) % 1;
      var hy = (Math.sin((j+1)*78.233 + v*7.7) * 43758.5453) % 1;
      hx = Math.abs(hx); hy = Math.abs(hy);
      c.fillStyle = 'rgba(0,0,0,' + (0.04 + (j%3)*0.018) + ')';
      c.fillRect(hx*s, hy*s, Math.max(1, s*0.055), Math.max(1, s*0.055));
    }

    if (key === 'water' || key === 'wetland'){
      c.strokeStyle = 'rgba(210,235,250,.22)';
      c.lineWidth = Math.max(1, s*0.022);
      for (var w = 0; w < 3; w++){
        c.beginPath();
        c.moveTo(0, s*(0.25 + w*0.25));
        c.quadraticCurveTo(s*0.5, s*(0.25 + w*0.25) - s*0.07,
                           s, s*(0.25 + w*0.25));
        c.stroke();
      }
    } else if (key === 'mountain' || key === 'hill'){
      c.fillStyle = 'rgba(255,255,255,.07)';
      c.beginPath();
      c.moveTo(s*0.5, s*0.2);
      c.lineTo(s*0.82, s*0.72);
      c.lineTo(s*0.18, s*0.72);
      c.closePath(); c.fill();
    } else if (key === 'forest' || key === 'dense'){
      c.fillStyle = 'rgba(20,45,18,.2)';
      var cnt = key === 'dense' ? 4 : 2;
      for (var t = 0; t < cnt; t++){
        var tx = s*(0.22 + (t%2)*0.4), ty = s*(0.3 + Math.floor(t/2)*0.32);
        c.beginPath();
        c.arc(tx, ty, s*0.11, 0, 6.284); c.fill();
      }
    }
    c.strokeStyle = 'rgba(0,0,0,.10)';
    c.lineWidth = 1;
    c.strokeRect(0.5, 0.5, s-1, s-1);
    return cv;
  }

  function stats(){
    return { loaded: Object.keys(img).length,
             missing: Object.keys(missing).length, ready: ready };
  }

  return { load:load, get:get, has:has, tier:tier, terrain:terrain, stats:stats };
})();