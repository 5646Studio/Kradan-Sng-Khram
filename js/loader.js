/* ============ loader v15A — หน้าโหลดภาพปก + แถบทองวิ่ง % ============ */
(function(){
  var P = 'assets/ui/';
  var css = document.createElement('style');
  css.textContent =
    '#ldr{position:fixed;inset:0;z-index:99999;background:#120c06 url(' + P + 'load_land.webp) center 22%/cover no-repeat;' +
    'display:flex;flex-direction:column;align-items:center;justify-content:flex-end;transition:opacity .6s}' +
    '@media (orientation:portrait){#ldr{background-image:url(' + P + 'load_port.webp);background-position:center top}}' +
    '#ldr.out{opacity:0;pointer-events:none}' +
    '#ldr .bw{position:relative;width:min(86vw,560px);aspect-ratio:800/267;margin-bottom:8vh}' +
    '#ldr .tr{position:absolute;left:10.8%;right:10.8%;top:43.4%;height:11.2%;border-radius:99px;overflow:hidden;background:rgba(20,10,0,.75)}' +
    '#ldr .fl{position:absolute;left:0;top:0;bottom:0;width:0;border-radius:99px;' +
    'background:linear-gradient(90deg,#8a4a00,#ffcf40 60%,#fff6c8);box-shadow:0 0 12px #ffcf40;transition:width .25s}' +
    '#ldr .fl::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.75),transparent);' +
    'width:40%;animation:ldrS 1.3s linear infinite}' +
    '@keyframes ldrS{from{transform:translateX(-100%)}to{transform:translateX(260%)}}' +
    '#ldr .fr{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}' +
    '#ldr .pc{position:absolute;left:0;right:0;top:43.4%;height:11.2%;display:flex;align-items:center;justify-content:center;' +
    'color:#fff;font-weight:700;font-size:clamp(11px,2.6vw,16px);text-shadow:0 0 4px #000,0 0 8px #000}' +
    '#ldr .tx{color:#ffe6a0;font-size:clamp(12px,3vw,15px);text-shadow:0 0 6px #000;margin:-6vh 0 3vh}';
  document.head.appendChild(css);

  var el = document.createElement('div');
  el.id = 'ldr';
  el.innerHTML = '<div class="tx" id="ldrT">กำลังเชื่อมต่อเซิร์ฟเวอร์…</div>' +
    '<div class="bw"><div class="tr"><div class="fl" id="ldrF"></div></div>' +
    '<img class="fr" src="' + P + 'load_bar.png" alt=""><div class="pc" id="ldrP">0%</div></div>';
  (document.body || document.documentElement).appendChild(el);

  var p = 0, fin = false, t0 = Date.now();
  function set(v){ p = Math.max(p, Math.min(100, v)); document.getElementById('ldrF').style.width = p + '%'; document.getElementById('ldrP').textContent = Math.floor(p) + '%'; }
  function done(){
    if (fin) return; fin = true; set(100);
    setTimeout(function(){ el.classList.add('out'); setTimeout(function(){ el.remove(); }, 700); }, 350);
  }
  /* พร้อมเมื่อ: หน้า index ออกจากจอ "กำลังเชื่อมต่อ" · หน้าเกมมีข้อมูลเมืองแล้ว */
  function ready(){
    var sl = document.getElementById('scrLoad');
    if (sl) return sl.classList.contains('hide');
    return !!(window.Game && Game.villages && Game.villages.length && document.readyState === 'complete');
  }
  var iv = setInterval(function(){
    if (fin) return clearInterval(iv);
    set(p + (92 - p) * 0.035);
    if (ready() && Date.now() - t0 > 600) done();
    if (Date.now() - t0 > 25000) done();          /* กันค้าง */
  }, 80);
  window.Loader = { set:set, text:function(s){ document.getElementById('ldrT').textContent = s; }, done:done };
})();
