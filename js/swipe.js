/* ============ Swipe v14N — ปัดซ้ายเพื่อลบบทสนทนา / ข้อความ ============ */
var Swipe = (function(){
  function attach(el, ask, onDel){
    if (el.__sw) return;
    el.__sw = 1;
    var w = document.createElement('div'), del = document.createElement('div');
    w.className = 'swrap'; del.className = 'swdel'; del.setAttribute('role', 'button');
    del.innerHTML = '<span>🗑</span><i>ลบ</i>';
    el.parentNode.insertBefore(w, el); w.appendChild(del); w.appendChild(el);
    el.classList.add('swin');
    var x0 = 0, y0 = 0, dx = 0, drag = false, open = false, lock = null, at = 0;
    function set(x, anim){
      dx = x; el.style.transition = anim ? '' : 'none';
      el.style.transform = x ? 'translateX(' + x + 'px)' : '';
      w.classList.toggle('on', x < -8);
    }
    el.addEventListener('touchstart', function(e){
      var t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; drag = true; lock = null;
    }, { passive:true });
    el.addEventListener('touchmove', function(e){
      if (!drag) return;
      var t = e.touches[0], mx = t.clientX - x0, my = t.clientY - y0;
      if (lock === null){
        if (Math.abs(mx) < 8 && Math.abs(my) < 8) return;
        lock = Math.abs(mx) > Math.abs(my) ? 'x' : 'y';
      }
      if (lock === 'x') set(Math.max(-90, Math.min(0, mx + (open ? -64 : 0))), false);
    }, { passive:true });
    el.addEventListener('touchend', function(){
      if (!drag) return;
      drag = false;
      if (lock !== 'x') return;
      at = Date.now(); open = dx < -32; set(open ? -64 : 0, true);
    });
    el.addEventListener('click', function(e){
      if (Date.now() - at < 400 || open){
        e.stopImmediatePropagation(); e.preventDefault();
        if (open && Date.now() - at >= 400){ open = false; set(0, true); }
      }
    }, true);
    del.onclick = function(){
      if (ask && !confirm(ask)){ open = false; set(0, true); return; }
      if (del.dataset.busy) return; del.dataset.busy = '1';
      onDel(function(){
        w.style.transition = 'opacity .2s'; w.style.opacity = '0';
        setTimeout(function(){ w.remove(); }, 200);
      });
    };
  }
  function scan(){
    var mb = document.getElementById('modalbox');
    if (!mb || !(typeof Sync !== 'undefined' && Sync.online && Sync.online())) return;
    mb.querySelectorAll('.cvrow[data-cu]').forEach(function(r){
      attach(r, 'ลบบทสนทนากับ ' + r.dataset.cn + '?\n(ลบเฉพาะฝั่งของคุณ)', function(done){
        Api.post('/chat/delconv', { uid:r.dataset.cu }).then(function(x){
          if (!x.ok) return alert(x.err);
          done(); Sync.poll(true);
        });
      });
    });
    mb.querySelectorAll('.cmsg[data-mid]').forEach(function(m){
      attach(m, null, function(done){
        var id = +m.dataset.mid;
        Api.post('/chat/delmsg', { id:id }).then(function(x){
          if (!x.ok) return alert(x.err);
          if (Social.dropMsg) Social.dropMsg(id);
          done();
        });
      });
    });
  }
  var q = false, mb = document.getElementById('modalbox');
  if (mb && typeof MutationObserver !== 'undefined')
    new MutationObserver(function(){
      if (q) return;
      q = true;
      requestAnimationFrame(function(){ q = false; try { scan(); } catch(e){} });
    }).observe(mb, { childList:true, subtree:true });
  return { attach:attach };
})();