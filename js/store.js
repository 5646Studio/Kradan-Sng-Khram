/* ============ Store v13 — จัดการข้อมูล + บัญชีผู้เล่น ============ */

var Store = (function(){
  var mem = {}, ok = true;
  try {
    localStorage.setItem('__t', '1');
    localStorage.removeItem('__t');
  } catch(e){ ok = false; }

  function get(k){
    try { return ok ? localStorage.getItem(k) : (mem[k] !== undefined ? mem[k] : null); }
    catch(e){ return mem[k] !== undefined ? mem[k] : null; }
  }
  function set(k, v){
    try { if (ok) localStorage.setItem(k, v); else mem[k] = v; }
    catch(e){ mem[k] = v; }
  }
  function del(k){
    try { if (ok) localStorage.removeItem(k); } catch(e){}
    delete mem[k];
  }
  function json(k, fb){
    var s = get(k);
    if (!s) return fb;
    try { return JSON.parse(s); } catch(e){ return fb; }
  }
  function setJson(k, o){
    try { set(k, JSON.stringify(o)); return true; }
    catch(e){ return false; }
  }
  function keys(){
    var out = [];
    try {
      if (ok){ for (var i = 0; i < localStorage.length; i++) out.push(localStorage.key(i)); }
      else for (var m in mem) out.push(m);
    } catch(e){}
    return out;
  }
  function usage(){
    var n = 0;
    keys().forEach(function(k){
      if (k.indexOf('sw_') !== 0) return;
      var v = get(k);
      if (v) n += v.length;
    });
    return n;
  }
  return { get:get, set:set, del:del, json:json, setJson:setJson,
    keys:keys, usage:usage, available:ok };
})();


/* ============ Account — ระบบบัญชีผู้เล่น ============ */

var Account = (function(){
  var IDX = 'sw_accounts', CUR = 'sw_current';

  function all(){
    var a = Store.json(IDX, null);
    return (a && a.length) ? a : [];
  }
  function saveIdx(a){ Store.setJson(IDX, a); }
  function find(id){
    var a = all();
    for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i];
    return null;
  }
  function byName(n){
    var a = all(), L = String(n).trim().toLowerCase();
    for (var i = 0; i < a.length; i++)
      if (String(a[i].name).toLowerCase() === L) return a[i];
    return null;
  }
  function hash(s){
    var h = 5381;
    s = String(s || '');
    for (var i = 0; i < s.length; i++) h = ((h*33) ^ s.charCodeAt(i)) >>> 0;
    return h.toString(36);
  }
  function mkId(){
    return 'u' + Date.now().toString(36) + Math.floor(Math.random()*46656).toString(36);
  }
  function saveKeyOf(id){ return 'sw_save_' + id; }

  function register(name, pin){
    name = String(name || '').trim();
    if (name.length < 2) return { err:'ชื่อต้องยาวอย่างน้อย 2 ตัวอักษร' };
    if (name.length > 16) return { err:'ชื่อยาวเกิน 16 ตัวอักษร' };
    if (byName(name)) return { err:'ชื่อนี้ถูกใช้แล้วในเครื่องนี้' };
    if (all().length >= 8) return { err:'สร้างบัญชีได้สูงสุด 8 บัญชีต่อเครื่อง' };
    pin = String(pin || '');
    if (pin && (pin.length < 4 || pin.length > 8))
      return { err:'รหัสผ่านต้องยาว 4-8 ตัว (เว้นว่างได้ถ้าไม่ต้องการ)' };

    var acc = { id:mkId(), name:name, pin: pin ? hash(pin) : '',
      createdAt: Date.now(), lastAt: Date.now(), server: CFG.SERVER_NAME };
    var a = all();
    a.push(acc);
    saveIdx(a);
    Store.set(CUR, acc.id);
    return { acc:acc };
  }

  function login(id, pin){
    var acc = find(id);
    if (!acc) return { err:'ไม่พบบัญชีนี้' };
    if (acc.pin){
      if (!pin) return { err:'need_pin' };
      if (hash(pin) !== acc.pin) return { err:'รหัสผ่านไม่ถูกต้อง' };
    }
    acc.lastAt = Date.now();
    var a = all();
    for (var i = 0; i < a.length; i++) if (a[i].id === id) a[i] = acc;
    saveIdx(a);
    Store.set(CUR, id);
    return { acc:acc };
  }

  function logout(){ Store.del(CUR); }

  function current(){
    var id = Store.get(CUR);
    return id ? find(id) : null;
  }
  function currentId(){
    var a = current();
    return a ? a.id : null;
  }
  function saveKey(){
    var id = currentId();
    return id ? saveKeyOf(id) : CFG.SAVE_KEY;
  }

  function hasSave(id){
    var s = Store.get(saveKeyOf(id));
    return !!(s && s.length > 40);
  }
  function peek(id){
    var d = Store.json(saveKeyOf(id), null);
    if (!d || !d.villages || !d.villages.length) return null;
    var pop = 0;
    d.villages.forEach(function(v){
      var p = 2;
      (v.fields||[]).forEach(function(f){ p += (f.level||0)*2; });
      (v.city||[]).forEach(function(c){ if (c.b) p += (c.level||0)*2; });
      pop += p;
    });
    return {
      vills: d.villages.length,
      pop: pop,
      gold: Math.floor((d.player && d.player.gold) || 0),
      day: Math.max(1, Math.floor((Date.now() - d.startedAt)/86400000*CFG.SPEED) + 1),
      guild: d.guild ? d.guild.tag : null,
      tribe: (d.player && d.player.tribe) || 0
    };
  }

  function resetSave(id){ Store.del(saveKeyOf(id)); }

  function remove(id){
    Store.del(saveKeyOf(id));
    Store.del('sw_herobtn_pos_' + id);
    saveIdx(all().filter(function(x){ return x.id !== id; }));
    if (Store.get(CUR) === id) Store.del(CUR);
  }

  function rename(id, nm){
    nm = String(nm || '').trim();
    if (nm.length < 2) return 'ชื่อสั้นเกินไป';
    var ex = byName(nm);
    if (ex && ex.id !== id) return 'ชื่อนี้ถูกใช้แล้ว';
    var a = all();
    for (var i = 0; i < a.length; i++) if (a[i].id === id) a[i].name = nm;
    saveIdx(a);
    return null;
  }

  function setPin(id, pin){
    var a = all();
    for (var i = 0; i < a.length; i++)
      if (a[i].id === id) a[i].pin = pin ? hash(pin) : '';
    saveIdx(a);
  }

  function wipeAll(){
    all().forEach(function(x){
      Store.del(saveKeyOf(x.id));
      Store.del('sw_herobtn_pos_' + x.id);
    });
    Store.keys().forEach(function(k){
      if (k.indexOf('sw_') === 0) Store.del(k);
    });
  }

  function exportSave(id){
    var s = Store.get(saveKeyOf(id));
    if (!s) return null;
    var acc = find(id);
    return JSON.stringify({ v:13, name: acc ? acc.name : '', save: s });
  }
  function importSave(id, text){
    try {
      var o = JSON.parse(text);
      if (!o || !o.save) return 'ไฟล์ไม่ถูกต้อง';
      JSON.parse(o.save);
      Store.set(saveKeyOf(id), o.save);
      return null;
    } catch(e){ return 'อ่านไฟล์ไม่สำเร็จ'; }
  }

  return { all:all, find:find, byName:byName, register:register, login:login,
    logout:logout, current:current, currentId:currentId, saveKey:saveKey,
    saveKeyOf:saveKeyOf, hasSave:hasSave, peek:peek, resetSave:resetSave,
    remove:remove, rename:rename, setPin:setPin, wipeAll:wipeAll,
    exportSave:exportSave, importSave:importSave };
})();