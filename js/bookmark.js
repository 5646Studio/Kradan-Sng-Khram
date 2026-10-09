/* ============ บันทึกพิกัด ============ */

var Bookmark = (function(){

  function list(){
    if (!Game.bookmarks) Game.bookmarks = [];
    return Game.bookmarks;
  }
  function indexOf(x, y){
    var L = list();
    for (var i = 0; i < L.length; i++)
      if (L[i].x === x && L[i].y === y) return i;
    return -1;
  }
  function has(x, y){ return indexOf(x, y) >= 0; }

  function autoName(x, y){
    try {
      var own = Game.villages.filter(function(v){
        return v.x === x && v.y === y; })[0];
      if (own) return own.name;
      var bot = (typeof Bots !== 'undefined' && Bots.at) ? Bots.at(x, y) : null;
      if (bot) return bot.bot.name;
      var t = World.tile(x, y);
      if (t.oasis){
        var nm = { wheat:'ข้าว', wood:'ไม้', iron:'เหล็ก',
                   clay:'โคลน', double:'คู่' }[t.oasis.type] || '';
        return 'โอเอซิส' + nm + ' +' + t.oasis.pct + '%';
      }
      var f = World.fortAt(x, y);
      if (f) return f.name;
      if (World.isCapital(x, y)) return 'เมืองหลวงโลก';
      if (t.npc) return 'เมืองร้าง';
      if (t.layout && t.layout.rare >= 2) return 'ทำเลดี ' + t.layout.nm;
      return t.info.name;
    } catch(e){ return 'พิกัด'; }
  }

  function add(x, y, name){
    var L = list();
    if (has(x, y)) return 'บันทึกพิกัดนี้ไว้แล้ว';
    if (L.length >= CFG.BOOKMARK_MAX)
      return 'บันทึกได้สูงสุด ' + CFG.BOOKMARK_MAX + ' พิกัด · ลบของเก่าก่อน';
    L.push({ x:x, y:y, n: name || autoName(x, y), at: now() });
    save();
    return null;
  }
  function quickAdd(x, y){
    var e = add(x, y);
    if (e) return alert(e);
    if (typeof Renderer !== 'undefined') Renderer.hideInfo();
    alert('📍 บันทึกพิกัด (' + x + '|' + y + ') แล้ว\n' +
      list().length + ' / ' + CFG.BOOKMARK_MAX);
    if (typeof HUD !== 'undefined') HUD.update();
  }
  function remove(i){ list().splice(i, 1); save(); }
  function rename(i, nm){
    var b = list()[i];
    if (!b) return;
    b.n = (nm || '').trim().slice(0, 24) || autoName(b.x, b.y);
    save();
  }

  function open(){
    var L = list();
    var h = '<h3>📍 พิกัดที่บันทึกไว้</h3>';
    h += '<div class="infobox">บันทึกจุดสำคัญไว้โจมตีหรือไปดูภายหลัง · ' +
      'สูงสุด <b>' + CFG.BOOKMARK_MAX + '</b> พิกัด (ใช้แล้ว ' + L.length + ')<br>' +
      '<i style="color:#8a7a55">บันทึกเพิ่มได้จากหน้าแผนที่ → แตะช่อง → 📍</i></div>';
    if (!L.length){
      h += '<p style="color:#8a7a55;text-align:center;font-size:12px;padding:20px">' +
        'ยังไม่มีพิกัดที่บันทึก</p>';
    } else {
      var me = Game.villages.length ? V() : null;
      L.forEach(function(b, i){
        var d = me ? Math.round(Math.sqrt(Math.pow(me.x-b.x,2) +
          Math.pow(me.y-b.y,2))*10)/10 : 0;
        var rel = relAt(b.x, b.y);
        var col = rel ? REL[rel].line : '#a89468';
        h += '<div class="bmrow">' +
          '<div class="bminfo" data-go="' + i + '">' +
          '<b style="color:' + col + '">' + b.n + '</b>' +
          '<i>(' + b.x + '|' + b.y + ') · ระยะ ' + d + ' ช่อง</i></div>' +
          '<div class="bmacts">' +
          '<button class="mini" data-atk="' + i + '">⚔</button>' +
          '<button class="mini" data-rn="' + i + '">✎</button>' +
          '<button class="mini bmdel" data-rm="' + i + '">✕</button>' +
          '</div></div>';
      });
    }
    h += '<button class="btn-cancel" onclick="UI.close()">ปิด</button>';
    UI.modal(h);

    document.querySelectorAll('[data-go]').forEach(function(n){
      n.onclick = function(){
        var b = list()[+n.dataset.go];
        if (!b) return;
        UI.close(); UI.showPage('world');
        setTimeout(function(){
          Renderer.center(b.x, b.y);
          Renderer.showTile(b.x, b.y);
        }, 60);
      };
    });
    document.querySelectorAll('[data-atk]').forEach(function(n){
      n.onclick = function(){
        var b = list()[+n.dataset.atk];
        if (!b) return;
        UI.close(); MilUI.openRally(b.x, b.y);
      };
    });
    document.querySelectorAll('[data-rn]').forEach(function(n){
      n.onclick = function(){
        var i = +n.dataset.rn, b = list()[i];
        if (!b) return;
        var nm = prompt('ตั้งชื่อพิกัด (' + b.x + '|' + b.y + ')', b.n);
        if (nm === null) return;
        rename(i, nm); open();
      };
    });
    document.querySelectorAll('[data-rm]').forEach(function(n){
      n.onclick = function(){
        var i = +n.dataset.rm, b = list()[i];
        if (!b || !confirm('ลบพิกัด "' + b.n + '" ?')) return;
        remove(i); open();
        if (typeof HUD !== 'undefined') HUD.update();
      };
    });
  }

  return { open:open, add:add, quickAdd:quickAdd, remove:remove,
    rename:rename, has:has, list:list, autoName:autoName };
})();