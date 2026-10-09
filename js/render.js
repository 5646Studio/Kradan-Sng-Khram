/* ============================================================
   Art — วาดภาพแทนเมื่อยังไม่มีไฟล์รูป
   มีรูปใน assets/ → ใช้รูป · ไม่มี → วาดด้วย canvas
   ============================================================ */
var Art = (function(){
  var cache = {};

  function cv(w, h){
    var c = document.createElement('canvas');
    c.width = Math.max(2, Math.round(w));
    c.height = Math.max(2, Math.round(h));
    return c;
  }
  function url(c){
    try { return c.toDataURL('image/png'); } catch(e){ return ''; }
  }
  function rr(ctx, x, y, w, h, r){
    r = Math.min(r, w/2, h/2);
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w, y, x+w, y+r);
    ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h); ctx.quadraticCurveTo(x, y+h, x, y+h-r);
    ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x, y, x+r, y);
    ctx.closePath();
  }
  function shadow(ctx, cx, cy, rx, ry){
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.28)';
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, 6.284); ctx.fill();
    ctx.restore();
  }

  /* ---------- หลังคาทรงไทย ---------- */
  function roof(ctx, cx, topY, botY, hw, col, edge){
    ctx.beginPath();
    ctx.moveTo(cx, topY);
    ctx.quadraticCurveTo(cx + hw*0.62, botY - (botY-topY)*0.26, cx + hw, botY);
    ctx.lineTo(cx + hw*1.12, botY - hw*0.06);
    ctx.lineTo(cx - hw*1.12, botY - hw*0.06);
    ctx.lineTo(cx - hw, botY);
    ctx.quadraticCurveTo(cx - hw*0.62, botY - (botY-topY)*0.26, cx, topY);
    ctx.closePath();
    ctx.fillStyle = col; ctx.fill();
    ctx.strokeStyle = edge; ctx.lineWidth = Math.max(1, hw*0.055);
    ctx.lineJoin = 'round'; ctx.stroke();
  }
  function chofa(ctx, cx, y, hw, col){
    ctx.strokeStyle = col;
    ctx.lineWidth = Math.max(1.2, hw*0.07);
    ctx.lineCap = 'round';
    [-1, 1].forEach(function(s){
      ctx.beginPath();
      ctx.moveTo(cx + s*hw*1.08, y);
      ctx.quadraticCurveTo(cx + s*hw*1.3, y - hw*0.24, cx + s*hw*1.12, y - hw*0.4);
      ctx.stroke();
    });
  }

  /* ---------- จานสีอาคาร ---------- */
  var PAL = {
    _build: { roof:'#b5452f', roofD:'#7a2a1b', wall:'#d6c08c', wallD:'#9c8355',
              trim:'#e8c663' },
    _mil:   { roof:'#5a6470', roofD:'#333b44', wall:'#9aa1a9', wallD:'#676e76',
              trim:'#c9d2da' },
    _res:   { roof:'#8a6a34', roofD:'#5a4420', wall:'#c6a86e', wallD:'#8e7643',
              trim:'#e0c484' },
    main:   { roof:'#c9562f', roofD:'#8a3318', wall:'#e3d2a4', wallD:'#ac9a68',
              trim:'#ffd766' },
    palace: { roof:'#d8a21e', roofD:'#9a6c08', wall:'#f0e2b4', wallD:'#bfae78',
              trim:'#ffe9a0' },
    temple: { roof:'#d2b43c', roofD:'#937a16', wall:'#eee1bd', wallD:'#b8a977',
              trim:'#fff0b8' },
    rally:  { roof:'#7a4a2a', roofD:'#4d2c15', wall:'#b89a68', wallD:'#806party',
              trim:'#d8b472' },
    market: { roof:'#3f7a6a', roofD:'#245247', wall:'#cdbf92', wallD:'#95885f',
              trim:'#8fd8bd' },
    hero:   { roof:'#6b4a8a', roofD:'#432c5a', wall:'#cfbde0', wallD:'#9a86ab',
              trim:'#d8b4ff' },
    smithy: { roof:'#5a4036', roofD:'#33231c', wall:'#a8907c', wallD:'#75604f',
              trim:'#ff9a5a' },
    granary:{ roof:'#9a7a30', roofD:'#644d16', wall:'#d9c484', wallD:'#9e8c52',
              trim:'#f5dc92' },
    warehouse:{ roof:'#7c6a46', roofD:'#4e4027', wall:'#c3b188', wallD:'#8b7d58',
              trim:'#ddcb9c' }
  };
  PAL.rally.wallD = '#806a40';

  function palOf(key){
    if (PAL[key]) return PAL[key];
    var b = BUILDINGS[bIndex(key)];
    var c = b ? b.cat : 'build';
    return c === 'mil' ? PAL._mil : c === 'res' ? PAL._res : PAL._build;
  }

  /* ---------- วาดอาคาร ---------- */
  function drawBuilding(key, tier, S){
    var c = cv(S, S), ctx = c.getContext('2d');
    var P = palOf(key);
    var b = BUILDINGS[bIndex(key)];
    var cat = b ? b.cat : 'build';
    var cx = S*0.5;

    shadow(ctx, cx, S*0.86, S*0.33, S*0.09);

    /* ฐาน */
    ctx.fillStyle = P.wallD;
    rr(ctx, S*0.2, S*0.76, S*0.6, S*0.1, S*0.02); ctx.fill();

    /* ตัวอาคาร */
    var bw = S*0.5, bh = S*(0.2 + tier*0.035);
    var by = S*0.78 - bh;
    ctx.fillStyle = P.wall;
    rr(ctx, cx-bw/2, by, bw, bh, S*0.025); ctx.fill();
    ctx.strokeStyle = P.wallD; ctx.lineWidth = Math.max(1, S*0.015);
    ctx.stroke();

    /* ประตู / หน้าต่าง */
    ctx.fillStyle = 'rgba(40,26,14,.72)';
    rr(ctx, cx - S*0.055, by + bh*0.42, S*0.11, bh*0.58, S*0.02); ctx.fill();
    if (tier >= 2){
      ctx.fillStyle = 'rgba(40,26,14,.5)';
      [-1, 1].forEach(function(s){
        rr(ctx, cx + s*S*0.15 - S*0.035, by + bh*0.3, S*0.07, bh*0.3, S*0.012);
        ctx.fill();
      });
    }

    /* หลังคา */
    var hw = S*0.38;
    roof(ctx, cx, by - S*(0.13 + tier*0.018), by + S*0.012, hw, P.roof, P.roofD);
    if (tier >= 2){
      roof(ctx, cx, by - S*(0.26 + tier*0.02), by - S*(0.1 + tier*0.012),
        hw*0.72, P.roof, P.roofD);
    }
    if (tier >= 3) chofa(ctx, cx, by + S*0.012, hw, P.trim);
    if (tier >= 4){
      ctx.fillStyle = P.trim;
      ctx.beginPath();
      ctx.arc(cx, by - S*(0.3 + tier*0.02), S*0.035, 0, 6.284);
      ctx.fill();
    }

    /* ลักษณะเฉพาะหมวด */
    if (cat === 'mil'){
      ctx.strokeStyle = '#6b5636'; ctx.lineWidth = Math.max(1, S*0.02);
      ctx.beginPath();
      ctx.moveTo(cx + S*0.3, by + S*0.02);
      ctx.lineTo(cx + S*0.3, by - S*0.2);
      ctx.stroke();
      ctx.fillStyle = '#b5452f';
      ctx.beginPath();
      ctx.moveTo(cx + S*0.3, by - S*0.2);
      ctx.lineTo(cx + S*0.44, by - S*0.15);
      ctx.lineTo(cx + S*0.3, by - S*0.1);
      ctx.closePath(); ctx.fill();
    } else if (cat === 'res'){
      ctx.fillStyle = 'rgba(0,0,0,.14)';
      for (var i = 0; i < 3; i++){
        ctx.fillRect(cx - bw/2 + S*0.03, by + bh*0.2 + i*bh*0.2,
          bw - S*0.06, Math.max(1, S*0.012));
      }
    }
    return c;
  }

  /* ---------- วาดหลุมทรัพยากร ---------- */
  function drawField(res, tier, S){
    var c = cv(S, S), ctx = c.getContext('2d');
    var cx = S*0.5, cy = S*0.56;
    shadow(ctx, cx, S*0.84, S*0.34, S*0.08);

    function plot(fill, edge){
      ctx.beginPath();
      ctx.moveTo(cx, cy - S*0.22);
      ctx.lineTo(cx + S*0.38, cy);
      ctx.lineTo(cx, cy + S*0.22);
      ctx.lineTo(cx - S*0.38, cy);
      ctx.closePath();
      ctx.fillStyle = fill; ctx.fill();
      ctx.strokeStyle = edge; ctx.lineWidth = Math.max(1, S*0.022);
      ctx.lineJoin = 'round'; ctx.stroke();
    }

    if (res === 'wheat'){
      var f = tier <= 0 ? '#6b5a3a' : tier === 1 ? '#6f9a4a'
            : tier === 2 ? '#78ad45' : tier === 3 ? '#c9b03c' : '#e0c348';
      plot(f, '#4c3f26');
      if (tier >= 1){
        ctx.strokeStyle = tier >= 3 ? 'rgba(120,92,20,.6)' : 'rgba(40,70,25,.45)';
        ctx.lineWidth = Math.max(1, S*0.016);
        for (var i = -2; i <= 2; i++){
          ctx.beginPath();
          ctx.moveTo(cx + i*S*0.1 - S*0.09, cy - S*0.1 + Math.abs(i)*S*0.03);
          ctx.lineTo(cx + i*S*0.1 + S*0.09, cy + S*0.1 - Math.abs(i)*S*0.03);
          ctx.stroke();
        }
      } else {
        ctx.fillStyle = 'rgba(90,130,160,.4)';
        ctx.beginPath();
        ctx.ellipse(cx, cy, S*0.2, S*0.1, 0, 0, 6.284); ctx.fill();
      }
      if (tier >= 3){
        ctx.fillStyle = '#8a6a3a';
        rr(ctx, cx + S*0.18, cy - S*0.2, S*0.14, S*0.12, S*0.02); ctx.fill();
        ctx.fillStyle = '#b5452f';
        ctx.beginPath();
        ctx.moveTo(cx + S*0.25, cy - S*0.3);
        ctx.lineTo(cx + S*0.35, cy - S*0.19);
        ctx.lineTo(cx + S*0.15, cy - S*0.19);
        ctx.closePath(); ctx.fill();
      }
    }

    else if (res === 'wood'){
      plot(tier <= 0 ? '#5c5134' : '#3f6b32', '#2c3f1e');
      var n = tier <= 0 ? 0 : tier === 1 ? 2 : tier === 2 ? 3 : tier === 3 ? 4 : 5;
      for (var t = 0; t < n; t++){
        var a = (t/Math.max(1,n))*6.284 + 0.6;
        var tx = cx + Math.cos(a)*S*0.17;
        var ty = cy + Math.sin(a)*S*0.09 - S*0.02;
        var sc = 1 + (tier >= 4 ? 0.22 : 0);
        ctx.fillStyle = '#6b4a28';
        ctx.fillRect(tx - S*0.014, ty, S*0.028, S*0.1*sc);
        ctx.fillStyle = t % 2 ? '#3f7a34' : '#4e8c3d';
        ctx.beginPath();
        ctx.moveTo(tx, ty - S*0.18*sc);
        ctx.lineTo(tx + S*0.1*sc, ty + S*0.02);
        ctx.lineTo(tx - S*0.1*sc, ty + S*0.02);
        ctx.closePath(); ctx.fill();
      }
      if (tier <= 0){
        ctx.fillStyle = '#6b5a3a';
        [-1, 1].forEach(function(s){
          ctx.beginPath();
          ctx.ellipse(cx + s*S*0.12, cy, S*0.05, S*0.025, 0, 0, 6.284);
          ctx.fill();
        });
      }
      if (tier >= 4){
        ctx.fillStyle = '#8a6a3a';
        for (var L = 0; L < 3; L++){
          ctx.fillRect(cx - S*0.33, cy + S*0.06 + L*S*0.035, S*0.14, S*0.028);
        }
      }
    }

    else if (res === 'iron'){
      plot(tier <= 0 ? '#6e6a60' : '#5c5850', '#39352e');
      ctx.fillStyle = '#8a8478';
      ctx.beginPath();
      ctx.moveTo(cx, cy - S*0.21);
      ctx.lineTo(cx + S*0.22, cy + S*0.04);
      ctx.lineTo(cx - S*0.22, cy + S*0.04);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#b3aca0';
      ctx.beginPath();
      ctx.moveTo(cx, cy - S*0.21);
      ctx.lineTo(cx + S*0.09, cy - S*0.08);
      ctx.lineTo(cx - S*0.09, cy - S*0.08);
      ctx.closePath(); ctx.fill();
      if (tier >= 1){
        ctx.fillStyle = 'rgba(20,16,12,.85)';
        ctx.beginPath();
        ctx.ellipse(cx, cy + S*0.02, S*0.085, S*0.05, 0, 0, 6.284); ctx.fill();
      }
      if (tier >= 2){
        ctx.strokeStyle = '#6b4a28'; ctx.lineWidth = Math.max(1.4, S*0.026);
        ctx.beginPath();
        ctx.moveTo(cx - S*0.1, cy - S*0.05);
        ctx.lineTo(cx - S*0.1, cy + S*0.03);
        ctx.moveTo(cx + S*0.1, cy - S*0.05);
        ctx.lineTo(cx + S*0.1, cy + S*0.03);
        ctx.moveTo(cx - S*0.13, cy - S*0.05);
        ctx.lineTo(cx + S*0.13, cy - S*0.05);
        ctx.stroke();
      }
      if (tier >= 3){
        ctx.fillStyle = '#7a4a2a';
        rr(ctx, cx + S*0.16, cy + S*0.04, S*0.14, S*0.08, S*0.015); ctx.fill();
        ctx.fillStyle = '#c2762e';
        ctx.beginPath(); ctx.arc(cx + S*0.2, cy + S*0.07, S*0.022, 0, 6.284);
        ctx.fill();
      }
      if (tier >= 4){
        ctx.fillStyle = 'rgba(200,200,205,.4)';
        for (var p = 0; p < 3; p++){
          ctx.beginPath();
          ctx.arc(cx - S*0.2, cy - S*0.14 - p*S*0.05, S*0.035 + p*S*0.01, 0, 6.284);
          ctx.fill();
        }
      }
    }

    else { /* clay */
      plot(tier <= 0 ? '#9a7450' : '#a8603a', '#5e3a22');
      ctx.strokeStyle = 'rgba(70,38,20,.5)';
      ctx.lineWidth = Math.max(1, S*0.018);
      for (var k = 1; k <= 3; k++){
        ctx.beginPath();
        ctx.ellipse(cx, cy, S*0.07*k, S*0.035*k, 0, 0, 6.284);
        ctx.stroke();
      }
      if (tier >= 1){
        ctx.fillStyle = 'rgba(120,70,40,.65)';
        ctx.beginPath();
        ctx.ellipse(cx, cy, S*0.075, S*0.04, 0, 0, 6.284); ctx.fill();
      }
      if (tier >= 3){
        ctx.fillStyle = '#b5452f';
        for (var r2 = 0; r2 < 3; r2++)
          for (var cc = 0; cc < 2; cc++)
            ctx.fillRect(cx + S*0.14 + cc*S*0.07,
              cy - S*0.1 + r2*S*0.045, S*0.06, S*0.034);
      }
      if (tier >= 4){
        ctx.fillStyle = '#6b4a30';
        rr(ctx, cx - S*0.32, cy - S*0.1, S*0.14, S*0.16, S*0.03); ctx.fill();
        ctx.fillStyle = 'rgba(255,160,60,.6)';
        ctx.beginPath();
        ctx.arc(cx - S*0.25, cy + S*0.01, S*0.035, 0, 6.284); ctx.fill();
      }
    }
    return c;
  }

  /* ---------- วาดกำแพงเมือง ---------- */
  function drawWall(level, W, H){
    var c = cv(W, H), ctx = c.getContext('2d');
    var lv = Math.max(1, level);
    var tier = lv <= 4 ? 1 : lv <= 9 ? 2 : lv <= 14 ? 3 : 4;
    var th = 9 + tier*4.5;
    var merH = 6 + tier*2;
    var merW = 9 + tier*2.5;
    var body = ['#8f7a4f','#9a8257','#a68d5e','#b89a64'][tier-1];
    var dark = ['#5f4f2e','#675533','#6f5a36','#7a633b'][tier-1];
    var top  = ['#a89066','#b39a70','#c0a87c','#d0b98c'][tier-1];

    function strip(x, y, w, h){
      var g = ctx.createLinearGradient(x, y, x, y+h);
      g.addColorStop(0, top); g.addColorStop(0.45, body); g.addColorStop(1, dark);
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = 'rgba(40,30,16,.55)';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(x+0.5, y+0.5, w-1, h-1);
      ctx.fillStyle = 'rgba(0,0,0,.12)';
      for (var bx = x; bx < x+w; bx += 16){
        ctx.fillRect(bx, y + h*0.45, Math.min(14, x+w-bx), 1.4);
        ctx.fillRect(bx + 8, y + h*0.78, Math.min(7, x+w-bx-8), 1.2);
      }
    }
    function merlons(x, y, w, dir){
      ctx.fillStyle = top;
      for (var m = x; m < x + w - merW*0.6; m += merW + merW*0.55){
        var ww = Math.min(merW, x + w - m);
        if (dir === 'h') ctx.fillRect(m, y, ww, merH);
        else ctx.fillRect(y, m, merH, ww);
      }
    }

    /* แนวกำแพง 4 ด้าน */
    strip(th, merH, W - th*2, th);                      /* บน */
    strip(th, H - th - merH, W - th*2, th);             /* ล่าง */
    ctx.save();
    var gl = ctx.createLinearGradient(merH, 0, merH + th, 0);
    gl.addColorStop(0, top); gl.addColorStop(0.45, body); gl.addColorStop(1, dark);
    ctx.fillStyle = gl;
    ctx.fillRect(merH, th, th, H - th*2);               /* ซ้าย */
    ctx.fillRect(W - merH - th, th, th, H - th*2);      /* ขวา */
    ctx.strokeStyle = 'rgba(40,30,16,.55)'; ctx.lineWidth = 1.2;
    ctx.strokeRect(merH+0.5, th+0.5, th-1, H-th*2-1);
    ctx.strokeRect(W-merH-th+0.5, th+0.5, th-1, H-th*2-1);
    ctx.restore();

    /* ใบเสมา */
    merlons(th + merW, 0, W - th*2 - merW*2, 'h');
    merlons(th + merW, H - merH, W - th*2 - merW*2, 'h');
    ctx.save();
    ctx.fillStyle = top;
    for (var m2 = th + merW; m2 < H - th - merW*0.6; m2 += merW + merW*0.55){
      var hh = Math.min(merW, H - th - merW - m2 + merW);
      if (hh <= 0) break;
      ctx.fillRect(0, m2, merH, hh);
      ctx.fillRect(W - merH, m2, merH, hh);
    }
    ctx.restore();

    /* หอมุม 4 มุม */
    var ts = 18 + tier*6;
    [[0,0],[W-ts,0],[0,H-ts],[W-ts,H-ts]].forEach(function(p){
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 5;
      var g2 = ctx.createLinearGradient(p[0], p[1], p[0], p[1]+ts);
      g2.addColorStop(0, top); g2.addColorStop(1, dark);
      ctx.fillStyle = g2;
      rr(ctx, p[0], p[1], ts, ts, 3); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = '#4a3a22'; ctx.lineWidth = 1.5;
      rr(ctx, p[0]+0.5, p[1]+0.5, ts-1, ts-1, 3); ctx.stroke();
      ctx.fillStyle = top;
      for (var q = p[0]+2; q < p[0]+ts-4; q += 8) ctx.fillRect(q, p[1]-4, 5, 5);
      if (tier >= 3){
        ctx.fillStyle = '#b5452f';
        ctx.beginPath();
        ctx.moveTo(p[0]+ts/2, p[1]-10);
        ctx.lineTo(p[0]+ts/2+9, p[1]-6);
        ctx.lineTo(p[0]+ts/2, p[1]-2);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#6b5636'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p[0]+ts/2, p[1]-10); ctx.lineTo(p[0]+ts/2, p[1]+2);
        ctx.stroke();
      }
    });

    /* ประตูเมือง */
    var gw = 46 + tier*9, gh = th + merH + 5;
    var gx = W/2 - gw/2, gy = H - gh;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 6;
    ctx.fillStyle = '#4a3220';
    rr(ctx, gx, gy, gw, gh, 4); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#6b4a2a';
    rr(ctx, gx + 4, gy + 4, gw - 8, gh - 4, 3); ctx.fill();
    ctx.strokeStyle = 'rgba(20,12,6,.55)'; ctx.lineWidth = 1.4;
    for (var dgx = gx + 10; dgx < gx + gw - 6; dgx += 8){
      ctx.beginPath(); ctx.moveTo(dgx, gy + 5); ctx.lineTo(dgx, gy + gh - 2);
      ctx.stroke();
    }
    ctx.strokeStyle = tier >= 3 ? '#d8b472' : '#8a6f3a';
    ctx.lineWidth = 2.5;
    rr(ctx, gx + 1.5, gy + 1.5, gw - 3, gh - 3, 4); ctx.stroke();
    if (tier >= 4){
      ctx.fillStyle = '#e8c663';
      ctx.beginPath();
      ctx.arc(W/2, gy + gh*0.42, 5, 0, 6.284); ctx.fill();
    }
    return c;
  }

  /* ---------- API ---------- */
  function buildingURL(key, level, max){
    var t = Assets.tier(level, max || 20);
    var a = Assets.get('bd_' + key + '_' + t);
    if (a) return a.src;
    var ck = 'b|' + key + '|' + t;
    if (!cache[ck]) cache[ck] = url(drawBuilding(key, t, 104));
    return cache[ck];
  }
  function fieldURL(res, level){
    var t = level <= 0 ? 0 : level <= 4 ? 1 : level <= 9 ? 2
          : level <= 14 ? 3 : 4;
    var a = Assets.get('fd_' + res + '_' + t);
    if (a) return a.src;
    var ck = 'f|' + res + '|' + t;
    if (!cache[ck]) cache[ck] = url(drawField(res, t, 100));
    return cache[ck];
  }
  function wallURL(level, w, h){
    var t = Assets.tier(Math.max(1, level), 20);
    var a = Assets.get('bd_wall_' + t);
    if (a) return a.src;
    var W = Math.max(80, Math.round(w/20)*20);
    var H = Math.max(80, Math.round(h/20)*20);
    var ck = 'w|' + t + '|' + W + '|' + H;
    if (!cache[ck]) cache[ck] = url(drawWall(level, W, H));
    return cache[ck];
  }
  function clear(){ cache = {}; }

  return { buildingURL:buildingURL, fieldURL:fieldURL, wallURL:wallURL,
    clear:clear };
})();


/* ============================================================
   Renderer — แผนที่โลก
   ============================================================ */
var Renderer = (function(){
  var cv, ctx, mini, mctx, miniBuf = null;
  var W = 0, H = 0, dpr = 1;
  var cam = { x:0, y:0 }, zi = CFG.ZOOM_DEFAULT;
  var selected = null, drag = null, needDraw = true, lastAnim = 0, editing = false;

  var OA_IC = { wheat:['🌾'], wood:['🪵'], iron:['⛏️'], clay:['🧱'],
                double:['🌾','🪵'] };
  var OA_NM = { wheat:'ข้าว', wood:'ไม้', iron:'เหล็ก', clay:'โคลน',
                double:'คู่ (ข้าว+ไม้)' };

  function init(){
    cv = document.getElementById('map');
    ctx = cv.getContext('2d');
    mini = document.getElementById('minimap');
    mctx = mini.getContext('2d');
    resize();
    window.addEventListener('resize', function(){ resize(); needDraw = true; });
    bindEvents(); buildLegend(); buildMinimap(); loop();
  }
  function resize(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    var r = cv.getBoundingClientRect();
    W = r.width || window.innerWidth;
    H = r.height || window.innerHeight;
    cv.width = Math.round(W*dpr); cv.height = Math.round(H*dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function tileSize(){ return Math.max(6, Math.sqrt((W*H) / CFG.ZOOM_TILES[zi])); }
  function screenOf(tx, ty, ts){
    return { x: W/2 + (tx - cam.x)*ts, y: H/2 - (ty - cam.y)*ts };
  }
  function tileAt(mx, my){
    var ts = tileSize();
    return { x: Math.round((mx - W/2)/ts + cam.x),
             y: Math.round((H/2 - my)/ts + cam.y) };
  }
  function buildLegend(){
    var h = '';
    ['own','guild','ally','enemy','neutral'].forEach(function(k){
      h += '<div><i style="background:' + REL[k].line + '"></i>' + REL[k].name + '</div>';
    });
    document.getElementById('legend').innerHTML = h;
  }
  function buildMinimap(){
    try {
      var N = CFG.MAP_RADIUS*2 + 1;
      var off = document.createElement('canvas');
      off.width = N; off.height = N;
      var o = off.getContext('2d');
      var img = o.createImageData(N, N);
      for (var iy = 0; iy < N; iy++){
        for (var ix = 0; ix < N; ix++){
          var t = World.tile(ix - CFG.MAP_RADIUS, CFG.MAP_RADIUS - iy);
          var c = t.oasis ? '#4fd6a0' : t.info.color;
          var p = (iy*N + ix)*4;
          img.data[p]   = parseInt(c.substr(1,2), 16);
          img.data[p+1] = parseInt(c.substr(3,2), 16);
          img.data[p+2] = parseInt(c.substr(5,2), 16);
          img.data[p+3] = 255;
        }
      }
      o.putImageData(img, 0, 0);
      miniBuf = off;
    } catch(e){ logErr('buildMinimap', e); }
  }
  function drawMinimap(){
    if (!miniBuf) return;
    mctx.imageSmoothingEnabled = false;
    mctx.clearRect(0, 0, 320, 320);
    mctx.drawImage(miniBuf, 0, 0, 320, 320);
    var N = CFG.MAP_RADIUS*2 + 1, s = 320/N;
    function dot(x, y, c, sz){
      mctx.fillStyle = c;
      mctx.fillRect((x + CFG.MAP_RADIUS)*s - sz/2,
                    (CFG.MAP_RADIUS - y)*s - sz/2, sz, sz);
    }
    (Game.bots || []).forEach(function(b){
      if (b.dead) return;
      var col = REL[Bots.relAt(b.vills[0].x, b.vills[0].y) || 'neutral'].line;
      b.vills.forEach(function(vv){ dot(vv.x, vv.y, col, 3); });
    });
    FORTS.forEach(function(f){
      dot(f.x, f.y, Game.forts[f.id] === 'me' ? '#ffcf40' : '#ff6b6b', 5);
    });
    dot(0, 0, Game.capital.owner === 'me' ? '#ffe98a' : '#ff4d4d', 8);
    Game.villages.forEach(function(v){ dot(v.x, v.y, REL.own.line, 6); });
    var ts = tileSize();
    mctx.strokeStyle = '#fff'; mctx.lineWidth = 1.5;
    mctx.strokeRect((cam.x + CFG.MAP_RADIUS)*s - (W/ts)*s/2,
                    (CFG.MAP_RADIUS - cam.y)*s - (H/ts)*s/2, (W/ts)*s, (H/ts)*s);
  }

  function draw(){
    var ts = tileSize();
    ctx.fillStyle = '#0d0b08';
    ctx.fillRect(0, 0, W, H);
    var sx = Math.ceil(W/ts/2) + 2, sy = Math.ceil(H/ts/2) + 2;
    var x0 = Math.floor(cam.x) - sx, x1 = Math.floor(cam.x) + sx;
    var y0 = Math.floor(cam.y) - sy, y1 = Math.floor(cam.y) + sy;
    var detail = ts >= 40, label = ts >= 92;

    for (var ty = y1; ty >= y0; ty--){
      for (var tx = x0; tx <= x1; tx++){
        if (!World.inBounds(tx, ty)) continue;
        var t = World.tile(tx, ty);
        var p = screenOf(tx, ty, ts);
        var px = p.x - ts/2, py = p.y - ts/2;
        var im = Assets.terrain(t.info.key, t.variant, ts);
        if (im) ctx.drawImage(im, px, py, ts, ts);
        else { ctx.fillStyle = t.info.color; ctx.fillRect(px, py, ts, ts); }
        if (detail){
          ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.lineWidth = 1;
          ctx.strokeRect(px, py, ts, ts);
        }
        if (t.buildable && !t.oasis && t.layout && t.layout.rare >= 2){
          ctx.strokeStyle = t.layout.rare >= 3 ? '#ffd24d' : '#c9a24a';
          ctx.lineWidth = Math.max(2, ts*0.04);
          ctx.strokeRect(px+2, py+2, ts-4, ts-4);
          if (detail){
            ctx.fillStyle = t.layout.rare >= 3 ? '#ffe98a' : '#d8b85a';
            ctx.font = 'bold ' + Math.round(ts*0.14) + 'px sans-serif';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#000'; ctx.shadowBlur = 4;
            ctx.fillText('🌾' + t.layout.wheat, p.x, p.y - ts*0.3);
            ctx.shadowBlur = 0;
          }
        }
        if (t.oasis){
          var owned = !!Game.oasis[tx + ',' + ty];
          var oi = Assets.get('oa_' + t.oasis.type);
          if (oi) ctx.drawImage(oi, px, py, ts, ts);
          else { ctx.fillStyle = 'rgba(42,112,88,.42)'; ctx.fillRect(px, py, ts, ts); }
          ctx.strokeStyle = owned ? 'rgba(111,211,90,.9)' : 'rgba(79,214,160,.75)';
          ctx.lineWidth = Math.max(1.2, ts*0.03);
          ctx.strokeRect(px+1.2, py+1.2, ts-2.4, ts-2.4);
          if (ts >= 20){
            var ics = OA_IC[t.oasis.type] || ['🌿'];
            var dbl = ics.length > 1;
            var br = Math.max(8, ts*0.19);
            var bx = px + ts - br - ts*0.05, by = py + br + ts*0.05;
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,.75)'; ctx.shadowBlur = 3;
            ctx.fillStyle = owned ? 'rgba(22,62,38,.95)' : 'rgba(10,38,32,.93)';
            ctx.beginPath(); ctx.arc(bx, by, br, 0, 6.284); ctx.fill();
            ctx.restore();
            ctx.strokeStyle = owned ? '#6fd35a' : '#4fd6a0';
            ctx.lineWidth = Math.max(1, ts*0.018);
            ctx.beginPath(); ctx.arc(bx, by, br, 0, 6.284); ctx.stroke();
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            if (dbl){
              ctx.font = Math.round(br*0.72) + 'px sans-serif';
              ctx.fillText(ics[0], bx - br*0.34, by - br*0.1);
              ctx.fillText(ics[1], bx + br*0.34, by - br*0.1);
            } else {
              ctx.font = Math.round(br*1.05) + 'px sans-serif';
              ctx.fillText(ics[0], bx, by - br*0.06);
            }
            ctx.fillStyle = owned ? '#9fe07a' : '#6ff0c0';
            ctx.font = 'bold ' + Math.round(Math.max(7, br*0.56)) + 'px sans-serif';
            ctx.fillText('+' + t.oasis.pct + '%', bx, by + br*0.56);
            ctx.textBaseline = 'alphabetic';
          }
        }
        if (t.npc && !(typeof Bots !== 'undefined' && Bots.at && Bots.at(tx, ty)))
          drawVillage(p, ts, 'npc', label ? 'เมืองร้าง' : '', false);
      }
    }

    if (Game.bots){
      Game.bots.forEach(function(b){
        if (b.dead) return;
        b.vills.forEach(function(vv){
          if (vv.x < x0 || vv.x > x1 || vv.y < y0 || vv.y > y1) return;
          var rel = Bots.relAt(vv.x, vv.y) || 'neutral';
          var g = Bots.guildOf(b.guild);
          var nm = label ? (b.name + (g ? ' [' + g.tag + ']' : '')) : '';
          drawVillage(screenOf(vv.x, vv.y, ts), ts, rel, nm, false);
        });
      });
    }
    /* ★ ผู้เล่นจริง (ออนไลน์) ★ */
    if (typeof Net !== 'undefined' && Net.list){
      Net.list().forEach(function(o){
        (o.vills || []).forEach(function(vv){
          if (vv.x < x0 || vv.x > x1 || vv.y < y0 || vv.y > y1) return;
          drawVillage(screenOf(vv.x, vv.y, ts), ts, 'neutral',
            label ? '👤 ' + o.name + (o.tag ? ' [' + o.tag + ']' : '') : '', false);
        });
      });
    }
    FORTS.forEach(function(f){
      if (f.x < x0 || f.x > x1 || f.y < y0 || f.y > y1) return;
      var p2 = screenOf(f.x, f.y, ts);
      var mine = Game.forts[f.id] === 'me';
      ctx.fillStyle = mine ? 'rgba(255,207,64,.92)' : 'rgba(150,60,60,.92)';
      ctx.beginPath();
      ctx.moveTo(p2.x - ts*0.26, p2.y + ts*0.22);
      ctx.lineTo(p2.x - ts*0.26, p2.y - ts*0.12);
      ctx.lineTo(p2.x - ts*0.13, p2.y - ts*0.24);
      ctx.lineTo(p2.x, p2.y - ts*0.12);
      ctx.lineTo(p2.x + ts*0.13, p2.y - ts*0.24);
      ctx.lineTo(p2.x + ts*0.26, p2.y - ts*0.12);
      ctx.lineTo(p2.x + ts*0.26, p2.y + ts*0.22);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.stroke();
      if (detail){
        ctx.fillStyle = mine ? '#ffcf40' : '#ff9a9a';
        ctx.font = 'bold ' + Math.round(ts*0.14) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000'; ctx.shadowBlur = 4;
        ctx.fillText((mine ? '✓' : '') + f.name.replace('ป้อม',''), p2.x, p2.y + ts*0.44);
        ctx.shadowBlur = 0;
      }
    });

    if (ts >= 14){
      var R = CFG.NOBUILD_RADIUS;
      var tl = screenOf(-R, R, ts), br2 = screenOf(R, -R, ts);
      ctx.strokeStyle = 'rgba(255,92,92,.5)';
      ctx.lineWidth = 2; ctx.setLineDash([6,5]);
      ctx.strokeRect(tl.x - ts/2, tl.y - ts/2, (br2.x-tl.x)+ts, (br2.y-tl.y)+ts);
      ctx.setLineDash([]);
    }

    if (0 >= x0 && 0 <= x1 && 0 >= y0 && 0 <= y1){
      var pc = screenOf(0, 0, ts);
      var own2 = Game.capital.owner === 'me';
      var g3 = ctx.createRadialGradient(pc.x, pc.y, ts*0.1, pc.x, pc.y, ts*0.55);
      g3.addColorStop(0, own2 ? 'rgba(255,215,90,.95)' : 'rgba(210,60,60,.95)');
      g3.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g3;
      ctx.beginPath(); ctx.arc(pc.x, pc.y, ts*0.55, 0, 6.284); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold ' + Math.round(ts*0.4) + 'px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('👑', pc.x, pc.y);
      ctx.textBaseline = 'alphabetic';
    }

    Game.villages.forEach(function(v){
      if (v.x < x0 || v.x > x1 || v.y < y0 || v.y > y1) return;
      drawVillage(screenOf(v.x, v.y, ts), ts, 'own', label ? v.name : '', isCapital(v));
    });

    if (selected){
      var ps = screenOf(selected.x, selected.y, ts);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5;
      ctx.strokeRect(ps.x - ts/2, ps.y - ts/2, ts, ts);
    }
    drawMovements(ts);
    drawMinimap();
    syncCoord();
  }

  function syncCoord(){
    if (editing) return;
    var sx = document.getElementById('sx'), sy = document.getElementById('sy');
    if (!sx || !sy) return;
    sx.value = Math.round(cam.x);
    sy.value = Math.round(cam.y);
  }

  function drawVillage(p, ts, relKey, label, isCap){
    var col = REL[relKey] || REL.neutral;
    ctx.save();
    var g = ctx.createRadialGradient(p.x, p.y, ts*0.12, p.x, p.y, ts*0.46);
    g.addColorStop(0, col.glow); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(p.x, p.y, ts*0.46, 0, 6.284); ctx.fill();
    ctx.restore();
    var ik = relKey === 'own' ? 'vl_own'
      : (relKey === 'guild' || relKey === 'ally') ? 'vl_ally'
      : relKey === 'enemy' ? 'vl_enemy'
      : relKey === 'npc' ? 'vl_npc' : 'vl_neutral';
    var im = Assets.get(isCap && relKey === 'own' ? 'vl_capital' : ik);
    if (im) ctx.drawImage(im, p.x - ts/2, p.y - ts/2, ts, ts);
    else {
      ctx.fillStyle = col.line;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - ts*0.24);
      ctx.lineTo(p.x + ts*0.2, p.y);
      ctx.lineTo(p.x, p.y + ts*0.2);
      ctx.lineTo(p.x - ts*0.2, p.y);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 1.5; ctx.stroke();
    }
    ctx.strokeStyle = col.line;
    ctx.lineWidth = Math.max(1.8, ts*0.028);
    ctx.globalAlpha = 0.92;
    var m = ts*0.06;
    ctx.strokeRect(p.x - ts/2 + m, p.y - ts/2 + m, ts - m*2, ts - m*2);
    ctx.globalAlpha = 1;
    if (isCap && ts >= 50){
      ctx.font = Math.round(ts*0.18) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('👑', p.x, p.y - ts*0.3);
    }
    if (label){
      ctx.fillStyle = col.line;
      ctx.font = 'bold ' + Math.round(Math.max(8, ts*0.115)) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000'; ctx.shadowBlur = 5;
      ctx.fillText(label, p.x, p.y + ts*0.46);
      ctx.shadowBlur = 0;
    }
  }

  function drawMovements(ts){
    var t = now();
    var list = (Game.movements || []).concat(Game.incoming || []);
    if (!list.length) return;
    list.forEach(function(m){
      if (m.hostile){
        var tv = Game.villages.filter(function(g){ return g.id === m.target; })[0];
        if (!tv) return;
        var wl = cityLevel(tv, 'watchtower');
        if (wl <= 0) return;
        if ((m.arriveAt - t) > (5 + wl*5)*60000) return;
      }
      var a = screenOf(m.fx, m.fy, ts), b = screenOf(m.tx, m.ty, ts);
      var pad = ts*2;
      if ((a.x < -pad && b.x < -pad) || (a.x > W+pad && b.x > W+pad) ||
          (a.y < -pad && b.y < -pad) || (a.y > H+pad && b.y > H+pad)) return;
      var col = REL[relOfMove(m)];
      var dep = m.departAt || (m.arriveAt - 3600000);
      var pr = Math.max(0, Math.min(1, (t - dep)/Math.max(1, m.arriveAt - dep)));
      ctx.save();
      ctx.setLineDash([9,7]);
      ctx.lineDashOffset = -((t/45) % 16);
      ctx.strokeStyle = col.line;
      ctx.lineWidth = Math.max(1.5, ts*0.022);
      ctx.globalAlpha = 0.8;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.restore();
      var mx = a.x + (b.x-a.x)*pr, my = a.y + (b.y-a.y)*pr;
      var rr2 = Math.max(4, ts*0.1);
      ctx.save();
      ctx.shadowColor = col.line; ctx.shadowBlur = 8;
      ctx.fillStyle = col.line;
      ctx.beginPath(); ctx.arc(mx, my, rr2, 0, 6.284); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(0,0,0,.65)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
      if (ts >= 55){
        var left = Math.max(0, Math.round((m.arriveAt - t)/1000));
        var txt = (m.returning ? '↩ ' : (Military.MISSIONS[m.mission]
          ? Military.MISSIONS[m.mission].ic + ' ' : '')) + UI.dur(left);
        ctx.font = 'bold ' + Math.round(Math.max(9, ts*0.12)) + 'px sans-serif';
        var tw = ctx.measureText(txt).width + 10;
        ctx.fillStyle = 'rgba(12,10,7,.88)';
        ctx.fillRect(mx - tw/2, my - rr2 - 20, tw, 16);
        ctx.fillStyle = col.line; ctx.textAlign = 'center';
        ctx.fillText(txt, mx, my - rr2 - 8);
      }
    });
  }

  function bindEvents(){
    var moved = false, startPt = null;
    cv.addEventListener('pointerdown', function(e){
      drag = { x:e.clientX, y:e.clientY, cx:cam.x, cy:cam.y };
      startPt = { x:e.clientX, y:e.clientY }; moved = false;
      try { cv.setPointerCapture(e.pointerId); } catch(err){}
    });
    cv.addEventListener('pointermove', function(e){
      if (!drag) return;
      var ts = tileSize();
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) moved = true;
      cam.x = drag.cx - dx/ts; cam.y = drag.cy + dy/ts;
      clampCam(); needDraw = true;
    });
    cv.addEventListener('pointerup', function(){
      if (!moved && startPt){
        var r = cv.getBoundingClientRect();
        var t = tileAt(startPt.x - r.left, startPt.y - r.top);
        if (World.inBounds(t.x, t.y)){ selected = t; showTileInfo(t); }
      }
      drag = null; needDraw = true;
    });
    cv.addEventListener('wheel', function(e){
      e.preventDefault(); setZoom(zi + (e.deltaY < 0 ? 1 : -1));
    }, { passive:false });

    document.getElementById('zin').onclick  = function(){ setZoom(zi+1); };
    document.getElementById('zout').onclick = function(){ setZoom(zi-1); };
    document.getElementById('shome').onclick = function(){
      editing = false; center(V().x, V().y);
    };
    ['sx','sy'].forEach(function(id){
      var el = document.getElementById(id);
      el.addEventListener('focus', function(){ editing = true; el.select(); });
      el.addEventListener('blur', function(){
        setTimeout(function(){ editing = false; needDraw = true; }, 120);
      });
      el.addEventListener('keydown', function(e){
        if (e.key === 'Enter'){ el.blur(); doSearch(); }
      });
    });
    document.getElementById('sgo').onclick = doSearch;
    mini.addEventListener('pointerdown', function(e){
      var r = mini.getBoundingClientRect(), N = CFG.MAP_RADIUS*2 + 1;
      cam.x = ((e.clientX - r.left)/r.width)*N - CFG.MAP_RADIUS;
      cam.y = CFG.MAP_RADIUS - ((e.clientY - r.top)/r.height)*N;
      clampCam(); needDraw = true;
    });
  }
  function doSearch(){
    var x = parseInt(document.getElementById('sx').value, 10);
    var y = parseInt(document.getElementById('sy').value, 10);
    if (isNaN(x) || isNaN(y)) return alert('กรุณาใส่พิกัด X และ Y');
    if (!World.inBounds(x, y)) return alert('พิกัดอยู่นอกแผนที่ (±100)');
    editing = false;
    center(x, y); selected = { x:x, y:y }; showTileInfo({ x:x, y:y });
  }
  function setZoom(v){
    zi = Math.max(0, Math.min(CFG.ZOOM_TILES.length-1, v));
    document.getElementById('zin').disabled  = (zi === CFG.ZOOM_TILES.length-1);
    document.getElementById('zout').disabled = (zi === 0);
    needDraw = true;
  }
  function clampCam(){
    var R = CFG.MAP_RADIUS + 5;
    cam.x = Math.max(-R, Math.min(R, cam.x));
    cam.y = Math.max(-R, Math.min(R, cam.y));
  }

  function showTileInfo(t){
    try {
      var box = document.getElementById('tileinfo');
      var tile = World.tile(t.x, t.y);
      var own = Game.villages.filter(function(v){
        return v.x === t.x && v.y === t.y; })[0];
      var bot = (typeof Bots !== 'undefined' && Bots.at) ? Bots.at(t.x, t.y) : null;
      var real = (typeof Net !== 'undefined' && Net.at) ? Net.at(t.x, t.y) : null;
      var rel = relAt(t.x, t.y);
      var Z = ZONES[tile.zone-1];

      var h = '<button class="ti-x" onclick="Renderer.hideInfo()">✕</button>';
      h += '<h4>พิกัด (' + t.x + ' | ' + t.y + ')</h4>';
      h += '<div class="ti-line">ภูมิประเทศ <b>' + tile.info.name + '</b> · ระยะ <b>' +
        Math.round(Math.sqrt(t.x*t.x + t.y*t.y)) + '</b> · ' + Z.ic + ' ' +
        Z.name.split('—')[0].trim() + '</div>';

      if (own){
        h += '<div class="ti-line" style="color:#6fd35a">◆ เมืองของคุณ: <b>' +
          own.name + '</b> · ปชก. ' + population(own) + ' · ภักดี ' +
          Math.round(own.loyalty) + '%</div>';
      } else if (real){
        var rv = real.p.vills[real.vi] || {};
        h += '<div class="ti-line" style="color:#4db8ff">👤 <b>' + real.p.name + '</b>' +
          (real.p.tag ? ' [' + real.p.tag + ']' : '') + ' · ผู้เล่นจริง<br>เมือง ' +
          (rv.n || '-') + ' · ปชก. ' + UI.fmt(rv.p || 0) + '</div>';
      } else if (bot){
        var g = Bots.guildOf(bot.bot.guild);
        var rc = REL[rel || 'neutral'];
        var lk = 'loy:' + bot.bot.id + ':' + bot.vi;
        h += '<div class="ti-line" style="color:' + rc.line + '">◆ <b>' +
          bot.bot.name + '</b>' + (g ? ' [' + g.tag + ']' : '') +
          '<br>ปชก. ~' + UI.fmt(bot.bot.pop) + ' · กำแพง Lv.' + bot.bot.wall +
          ' · ' + rc.name +
          (Game.npc[lk] !== undefined ? '<br>🏳️ ความภักดี <b style="color:#ffcf40">' +
            Math.round(Game.npc[lk]) + '%</b>' : '') + '</div>';
      } else if (tile.oasis){
        var ow = Game.oasis[t.x + ',' + t.y];
        h += '<div class="ti-line" style="color:#4fd6a0">' +
          (OA_IC[tile.oasis.type]||['🌿']).join('') + ' <b>โอเอซิส' +
          (OA_NM[tile.oasis.type]||'') + ' +' + tile.oasis.pct + '%</b><br>' +
          (ow ? '✓ ยึดแล้ว' : 'ยังว่าง · ส่งวีรบุรุษไปยึดได้ในระยะ ' +
            CFG.OASIS_RANGE + ' ช่อง') + '</div>';
      } else if (World.isCapital(t.x, t.y)){
        h += '<div class="ti-line" style="color:#ffcf40">👑 <b>เมืองหลวงโลก</b></div>';
      } else if (World.fortAt(t.x, t.y)){
        var fx = World.fortAt(t.x, t.y);
        var mineF = Game.forts[fx.id] === 'me';
        h += '<div class="ti-line" style="color:' + (mineF ? '#ffcf40' : '#ff9a9a') +
          '">🏰 <b>' + fx.name + '</b>' + (mineF ? ' ✓' : '') + '<br>' +
          fx.bonus + '</div>';
      } else if (tile.npc){
        h += '<div class="ti-line" style="color:#c89a6a">◆ <b>เมืองร้าง</b> — ปล้นได้</div>';
      } else if (!tile.buildable){
        h += '<div class="ti-line" style="color:#ff9a7a">⛔ ตั้งเมืองไม่ได้ — ' +
          (tile.group === 'rock' ? 'พื้นที่ภูเขา'
           : tile.group === 'water' ? 'แหล่งน้ำ' : 'พื้นที่แห้งแล้ง') + '</div>';
      } else {
        var why = World.canSettle(t.x, t.y);
        h += '<div class="ti-line" style="color:' + (why ? '#ff6b6b' : '#8fbf5f') +
          '">' + (why ? '⛔ ' + why : '✓ ตั้งเมืองได้') + '</div>';
      }

      if (tile.buildable && !tile.oasis && !tile.npc && !own && !bot && !real && tile.layout){
        var L = tile.layout;
        var rn = L.rare >= 3 ? ' 👑' : L.rare === 2 ? ' 🌟' : L.rare === 1 ? ' ⭐' : '';
        h += '<div class="ti-line"><b style="color:' +
          (L.rare >= 2 ? '#ffd24d' : '#ffcf40') + '">หลุม 20 — ' + L.nm + rn +
          '</b></div>';
        h += '<div class="tgrid"><div><b>' + L.wheat + '</b>🌾</div>' +
          '<div><b>' + L.wood + '</b>🪵</div><div><b>' + L.iron + '</b>⛏️</div>' +
          '<div><b>' + L.clay + '</b>🧱</div></div>';
      }

      h += '<div class="ti-act">';
      if (own){
        h += '<button class="btn-ok" onclick="Renderer.gotoVillage(' +
          t.x + ',' + t.y + ')">🏛 เข้าเมือง</button>';
      } else {
        var d = Math.round(Military.dist(V().x, V().y, t.x, t.y)*10)/10;
        h += '<button class="btn-ok" onclick="Renderer.sendHere(' +
          t.x + ',' + t.y + ')">⚔ ส่งทัพ (' + d + ')</button>';
      }
      var bmk = (typeof Bookmark !== 'undefined') && Bookmark.has(t.x, t.y);
      h += '<button class="btn-use" style="flex:0 0 48px" ' +
        (bmk ? 'disabled' : 'onclick="Bookmark.quickAdd(' + t.x + ',' + t.y + ')"') +
        '>' + (bmk ? '✓📍' : '📍') + '</button>';
      if (typeof Schedule !== 'undefined' && Schedule.active() && !own)
        h += '<button class="btn-use" style="flex:0 0 44px" ' +
          'onclick="Renderer.schedHere(' + t.x + ',' + t.y + ')">⏰</button>';
      h += '<button class="btn-cancel" onclick="Renderer.hideInfo()">ปิด</button></div>';
      box.innerHTML = h;
      box.classList.remove('hidden');
      document.body.classList.add('tiopen');
    } catch(e){ logErr('showTileInfo', e); }
  }
  function hideInfo(){
    document.getElementById('tileinfo').classList.add('hidden');
    document.body.classList.remove('tiopen');
    selected = null; needDraw = true;
  }

  function sendHere(x, y){
    if (typeof Net !== 'undefined' && Net.at && Net.at(x, y))
      return alert('การโจมตี/เสริมทัพผู้เล่นจริงจะเปิดในเฟส 2');
    hideInfo(); MilUI.openRally(x, y);
  }

  function schedHere(x, y){ hideInfo(); Schedule.open(x, y); }
  function gotoVillage(x, y){
    for (var i = 0; i < Game.villages.length; i++)
      if (Game.villages[i].x === x && Game.villages[i].y === y){ Game.active = i; break; }
    hideInfo(); UI.refreshAll(); UI.showPage('village');
  }

  function loop(){
    try {
      var on = document.getElementById('page-world').classList.contains('active');
      var mv = (Game.movements && Game.movements.length) ||
               (Game.incoming && Game.incoming.length);
      var t = performance.now();
      if (on && mv && t - lastAnim > 90){ needDraw = true; lastAnim = t; }
      if (on && needDraw){ draw(); needDraw = false; }
    } catch(e){ logErr('Renderer.loop', e); needDraw = false; }
    requestAnimationFrame(loop);
  }
  function center(x, y){ cam.x = x; cam.y = y; clampCam(); needDraw = true; }
  function invalidate(){ needDraw = true; }

  return { init:init, center:center, invalidate:invalidate, resize:resize,
    hideInfo:hideInfo, sendHere:sendHere, schedHere:schedHere,
    gotoVillage:gotoVillage,
    showTile: function(x, y){ selected = {x:x,y:y}; showTileInfo({x:x,y:y}); } };
})();


/* ============================================================
   FieldView — หน้าทรัพยากร 4 โซน
   เหล็ก ↖ · ไม้ ↗ · ข้าว ↙ · โคลน ↘
   ============================================================ */
var FieldView = (function(){

  /* เหล็ก ↖ · ไม้ ↗ · ข้าว ↙ · โคลน ↘ */
  var ZN = [
    { res:'iron',  qx:-1, qy:-1, nm:'เหมืองเหล็ก' },
    { res:'wood',  qx: 1, qy:-1, nm:'ป่าไม้' },
    { res:'wheat', qx:-1, qy: 1, nm:'นาข้าว' },
    { res:'clay',  qx: 1, qy: 1, nm:'บ่อโคลน' }
  ];
  /* ลำดับช่องในโซน — ใกล้กลางก่อน ออกนอกทีหลัง */
  var ORD = [[0,0],[-1,0],[1,0],[0,1],[-1,1],[1,1],[0,2],[-1,2],[1,2]];

  function init(){ render(); }
  function resize(){ render(); }

  /* ตำแหน่งช่องที่ k ของโซน */
  function slotPos(Z, k){
    var o = ORD[k];
    if (!o) return null;
    var gx = 12, gy = 13.5;
    var baseX = Z.qx < 0 ? 28 : 72;
    var baseY = Z.qy < 0 ? 40 : 60;
    return { x: baseX + o[0]*gx, y: baseY + Z.qy*o[1]*gy };
  }

  /* จัดหลุมลงโซน — ล้นได้ */
  function assign(v){
    var cap = ORD.length;
    var zone = {}, placed = [], over = [];
    ZN.forEach(function(Z){ zone[Z.res] = { Z:Z, used:0 }; });

    /* รอบแรก — ลงโซนของตัวเอง */
    ZN.forEach(function(Z){
      var pits = [];
      v.fields.forEach(function(f, i){ if (f.res === Z.res) pits.push(i); });
      pits.forEach(function(fi){
        if (zone[Z.res].used < cap){
          var p = slotPos(Z, zone[Z.res].used++);
          placed.push({ i:fi, res:Z.res, x:p.x, y:p.y });
        } else over.push(fi);
      });
    });

    /* รอบสอง — ส่วนล้นไปโซนที่ยังว่าง (เริ่มจากที่ว่างมากสุด) */
    over.forEach(function(fi){
      var best = null;
      ZN.forEach(function(Z){
        var z = zone[Z.res];
        if (z.used >= cap) return;
        if (!best || z.used < zone[best.res].used) best = Z;
      });
      if (!best) return;
      var p = slotPos(best, zone[best.res].used++);
      placed.push({ i:fi, res: v.fields[fi].res, x:p.x, y:p.y });
    });
    return placed;
  }

  function render(){
    try {
      var el = document.getElementById('scene-fields');
      if (!el || !Game.villages.length) return;
      var v = V(), t = World.tile(v.x, v.y);

      var bg = Assets.get('sc_field_' + t.info.key);
      el.style.backgroundImage = bg ? 'url(' + bg.src + ')' : '';
      if (!bg){
        el.style.background =
          'radial-gradient(circle at 50% 50%, rgba(255,240,200,.1), rgba(0,0,0,.34)), ' +
          'linear-gradient(160deg,' + BIOMES[t.biome].color + ',#2e2a1c)';
      }

      var h = '';

      /* ป้ายโซน */
      ZN.forEach(function(Z){
        var n = v.fields.filter(function(f){ return f.res === Z.res; }).length;
        if (!n) return;
        var lx = Z.qx < 0 ? 28 : 72;
        var ly = Z.qy < 0 ? 7 : 94;
        h += '<div class="zlab" style="left:' + lx + '%;top:' + ly + '%">' +
          RES_IC[Z.res] + ' ' + Z.nm + ' ×' + n +
          ' <b>+' + UI.fmt(production(v, Z.res)) + '</b></div>';
      });

      /* หลุม */
      assign(v).forEach(function(p){
        var f = v.fields[p.i];
        var q = null;
        for (var w = 0; w < v.queue.length; w++)
          if (v.queue[w].kind === 'field' && v.queue[w].slot === p.i){
            q = v.queue[w]; break;
          }
        h += '<div class="fslot' + (q ? ' building' : '') +
          (f.level === 0 ? ' lv0' : '') + '" style="left:' + p.x +
          '%;top:' + p.y + '%" data-f="' + p.i + '" title="' +
          RES_TH[p.res] + ' Lv.' + f.level + '">' +
          '<img src="' + Art.fieldURL(p.res, f.level) + '" alt="">' +
          '<span class="lv">' + (q ? q.level : f.level) + '</span></div>';
      });

      /* ★ ปุ่มกลาง — เข้าหน้าเมือง ★ */
      var cl = cityLevel(v, 'main');
      h += '<button id="cityhub" title="เข้าหน้าเมือง">' +
        '<img src="' + Art.buildingURL('main', cl, 20) + '" alt="">' +
        '<span class="hubn">' + v.name + '</span></button>';

      el.innerHTML = h;
      el.querySelectorAll('[data-f]').forEach(function(n){
        n.onclick = function(e){ e.stopPropagation(); UI.openField(+n.dataset.f); };
      });
      var hub = document.getElementById('cityhub');
      if (hub) hub.onclick = function(e){
        e.stopPropagation(); UI.showPage('village');
      };
    } catch(e){ logErr('FieldView', e); }
  }

  return { init:init, resize:resize, render:render };
})();