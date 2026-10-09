/* ============ Net v13d — ออนไลน์ด้วย Firebase ============ */
var Net = (function(){
  var auth = null, db = null, user = null, inited = false;
  var others = [], idx = {}, othersAt = 0;
  var saveTimer = null, everFlushed = false, watching = false, dirty = false;

  function log(w, e){
    try { logErr('Net.' + w, e); } catch(x){}
    try { console.warn('[Net]', w, e); } catch(x){}
  }
  function sdk(){ return typeof firebase !== 'undefined' && !!firebase.initializeApp; }
  function enabled(){
    try {
      return sdk() && typeof FIREBASE_CONFIG !== 'undefined' &&
        !!FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey.indexOf('ใส่') < 0;
    } catch(e){ return false; }
  }
  function feature(k){ return (typeof NET_FEATURES === 'undefined') ? true : !!NET_FEATURES[k]; }
  function init(){
    if (inited) return true;
    if (!enabled()) return false;
    try {
      if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
      auth = firebase.auth();
      db = firebase.firestore();
      inited = true;
    } catch(e){ log('init', e); }
    return inited;
  }

  var ERR = {
    'auth/popup-closed-by-user':'ปิดหน้าต่างล็อกอินก่อนเสร็จ',
    'auth/cancelled-popup-request':'ยกเลิกการล็อกอิน',
    'auth/popup-blocked':'เบราว์เซอร์บล็อกหน้าต่าง — อนุญาตป๊อปอัปแล้วลองใหม่',
    'auth/invalid-email':'อีเมลไม่ถูกต้อง',
    'auth/user-not-found':'ไม่พบบัญชีนี้',
    'auth/wrong-password':'รหัสผ่านไม่ถูกต้อง',
    'auth/invalid-credential':'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
    'auth/email-already-in-use':'อีเมลนี้สมัครไว้แล้ว — กด "เข้าสู่ระบบ" แทน',
    'auth/weak-password':'รหัสผ่านต้องยาวอย่างน้อย 6 ตัว',
    'auth/operation-not-allowed':'ยังไม่ได้เปิดวิธีล็อกอินนี้ใน Firebase',
    'auth/unauthorized-domain':'โดเมนนี้ยังไม่ได้รับอนุญาต — เพิ่มใน Firebase → Authentication → Settings',
    'auth/network-request-failed':'เชื่อมต่ออินเทอร์เน็ตไม่ได้',
    'auth/credential-already-in-use':'บัญชี Google นี้ถูกใช้กับผู้เล่นอื่นแล้ว',
    'auth/account-exists-with-different-credential':'อีเมลนี้ผูกกับวิธีล็อกอินอื่นอยู่แล้ว',
    'auth/too-many-requests':'ลองบ่อยเกินไป รอสักครู่',
    'permission-denied':'ไม่มีสิทธิ์เข้าถึงข้อมูล — ตรวจ Firestore Rules'
  };
  function errText(e){ var c = e && e.code; return ERR[c] || (e && e.message) || 'เกิดข้อผิดพลาด'; }

  /* ---------- บัญชี ---------- */
  function onAuth(cb){
    if (!init()) return cb(null);
    auth.onAuthStateChanged(function(u){ user = u || null; cb(user); });
  }
  function me(){ return user; }
  function uid(){ return user ? user.uid : null; }
  function providerLabel(){
    if (!user) return '';
    if (user.isAnonymous) return '👤 ผู้เยี่ยมชม';
    var p = (user.providerData && user.providerData[0]) ? user.providerData[0].providerId : '';
    if (p === 'google.com') return 'G บัญชี Google';
    if (p === 'facebook.com') return 'f บัญชี Facebook';
    if (p === 'password') return '✉ ' + (user.email || 'อีเมล');
    return 'บัญชีออนไลน์';
  }
  function prov(name){
    var p = (name === 'facebook') ? new firebase.auth.FacebookAuthProvider()
                                  : new firebase.auth.GoogleAuthProvider();
    if (name === 'google') p.setCustomParameters({ prompt:'select_account' });
    return p;
  }
  function wrap(p, cb){
    p.then(function(r){ cb(null, r && r.user); })
     .catch(function(e){ log('auth', e); cb(errText(e)); });
  }
  function loginWith(name, cb){
    if (!init()) return cb('ยังไม่ได้ตั้งค่าออนไลน์');
    wrap(auth.signInWithPopup(prov(name)), cb);
  }
  function loginGuest(cb){
    if (!init()) return cb('ยังไม่ได้ตั้งค่าออนไลน์');
    wrap(auth.signInAnonymously(), cb);
  }
  function loginEmail(e, p, cb){
    if (!init()) return cb('ยังไม่ได้ตั้งค่าออนไลน์');
    wrap(auth.signInWithEmailAndPassword(String(e||'').trim(), p||''), cb);
  }
  function registerEmail(e, p, cb){
    if (!init()) return cb('ยังไม่ได้ตั้งค่าออนไลน์');
    wrap(auth.createUserWithEmailAndPassword(String(e||'').trim(), p||''), cb);
  }
  function linkGoogle(cb){
    if (!user) return cb('ยังไม่ได้เข้าสู่ระบบ');
    wrap(user.linkWithPopup(prov('google')), cb);
  }
  function logout(cb){
    flush(function(){
      auth.signOut().then(function(){ if (cb) cb(); }, function(){ if (cb) cb(); });
    });
  }

  /* ---------- โปรไฟล์ / ชื่อ ---------- */
  function getProfile(cb){
    if (!user) return cb(null);
    db.collection('players').doc(user.uid).get()
      .then(function(d){ cb(d.exists ? d.data() : null); })
      .catch(function(e){ log('profile', e); cb(null, errText(e)); });
  }
  function claimName(name, cb){
    name = String(name || '').trim();
    if (name.length < 2) return cb('ชื่อต้องยาวอย่างน้อย 2 ตัวอักษร');
    if (name.length > 16) return cb('ชื่อยาวเกิน 16 ตัวอักษร');
    if (/[\/\\<>]/.test(name)) return cb('ห้ามใช้อักขระ / \\ < >');
    var key = name.toLowerCase();
    var nref = db.collection('names').doc(key);
    var pref = db.collection('players').doc(user.uid);
    db.runTransaction(function(tx){
      return tx.get(nref).then(function(d){
        if (d.exists && d.data().uid !== user.uid) throw { code:'taken' };
        tx.set(nref, { uid:user.uid, name:name, at:Date.now() });
        tx.set(pref, { uid:user.uid, name:name, pop:0, atk:0, def:0,
          vills:[], tag:null, at:Date.now() }, { merge:true });
      });
    }).then(function(){ cb(null); })
      .catch(function(e){
        if (e && e.code === 'taken') return cb('ชื่อนี้มีผู้เล่นใช้แล้ว');
        log('name', e); cb(errText(e));
      });
  }

  /* ---------- เซฟ ---------- */
  function localKey(){ return 'sw_save_' + (user ? user.uid : 'x'); }
  function localAt(){ return +(Store.get(localKey() + '_at') || 0); }

  function summary(raw){
    try {
      var d = JSON.parse(raw);
      if (!d || !d.villages || !d.villages.length) return null;
      var pop = 0;
      d.villages.forEach(function(v){
        var p = 2;
        (v.fields||[]).forEach(function(f){ p += (f.level||0)*2; });
        (v.city||[]).forEach(function(c){ if (c.b) p += (c.level||0)*2; });
        pop += p;
      });
      return { vills:d.villages.length, pop:pop,
        gold: Math.floor((d.player && d.player.gold) || 0),
        day: Math.max(1, Math.floor((Date.now() - d.startedAt)/86400000*CFG.SPEED) + 1) };
    } catch(e){ return null; }
  }
  function peekSave(cb){
    if (!user) return cb(null);
    var local = Store.get(localKey()), la = localAt();
    db.collection('saves').doc(user.uid).get().then(function(d){
      var c = d.exists ? d.data() : null;
      var raw = (c && c.data && (c.at||0) >= la) ? c.data : local;
      cb(raw ? summary(raw) : null);
    }).catch(function(e){ log('peek', e); cb(local ? summary(local) : null); });
  }
  function resetSave(cb){
    Store.del(localKey()); Store.del(localKey() + '_at');
    Promise.all([
      db.collection('saves').doc(user.uid).delete(),
      db.collection('players').doc(user.uid).set({ vills:[], pop:0, atk:0, def:0,
        tag:null, at:Date.now() }, { merge:true })
    ]).then(function(){ cb(null); })
      .catch(function(e){ log('reset', e); cb(errText(e)); });
  }

  /* เรียกจาก game.html ก่อนเริ่มเกม */
  function prepareGame(cb){
    if (!init()) return cb(false);
    var first = true, un = null;
    un = auth.onAuthStateChanged(function(u){
      if (!first) return;
      first = false;
      try { if (un) un(); } catch(e){}
      if (!u) return cb(false);
      user = u;
      CFG.SAVE_KEY = localKey();
      var called = false;
      function go(){ if (called) return; called = true; cb(true); }
      function fin(){ watch(); setTimeout(go, 6000); refreshOthers(go); }
      if (qs('new') === '1') return fin();
      db.collection('saves').doc(u.uid).get().then(function(d){
        if (d.exists){
          var c = d.data();
          if (c && c.data && (c.at||0) > localAt()){
            Store.set(localKey(), c.data);
            Store.set(localKey() + '_at', String(c.at));
          }
        }
        fin();
      }).catch(function(e){ log('load', e); fin(); });
    });
  }

  function queueSave(){
    if (!user || !db) return;
    dirty = true;
    Store.set(localKey() + '_at', String(Date.now()));
    if (saveTimer) return;
    saveTimer = setTimeout(flush, everFlushed ? 40000 : 3000);
  }
  function publish(){
    if (typeof Game === 'undefined' || !Game.villages || !Game.villages.length)
      return Promise.resolve();
    var pop = 0;
    var vills = Game.villages.map(function(v){
      var p = 0;
      try { p = population(v); } catch(e){}
      pop += p;
      return { x:v.x, y:v.y, n:v.name, p:p };
    });
    var st = Game.stats || {};
    return db.collection('players').doc(user.uid).set({
      uid:user.uid, name:Game.player.name, tribe:Game.player.tribe || 0,
      tag: Game.guild ? Game.guild.tag : null, vills:vills, pop:pop,
      atk: st.atkPts || 0, def: st.defPts || 0, at:Date.now()
    }, { merge:true });
  }
  function flush(cb){
    if (saveTimer){ clearTimeout(saveTimer); saveTimer = null; }
    if (!user || !db || !dirty){ if (cb) cb(); return; }
    var raw = Store.get(localKey());
    if (!raw){ if (cb) cb(); return; }
    dirty = false; everFlushed = true;
    var data = raw;
    try {
      var o = JSON.parse(raw);
      if (o.reports && o.reports.length > 50){
        o.reports = o.reports.slice(0, 50);
        data = JSON.stringify(o);
      }
    } catch(e){}
    var at = Date.now();
    Store.set(localKey() + '_at', String(at));
    Promise.all([
      db.collection('saves').doc(user.uid).set({ data:data, at:at, v:13 }),
      publish()
    ]).then(function(){ if (cb) cb(); })
      .catch(function(e){ log('flush', e); dirty = true; if (cb) cb(); });
  }

  /* ---------- ผู้เล่นคนอื่น ---------- */
  function refreshOthers(cb){
    if (!db || !user){ if (cb) cb(others); return; }
    db.collection('players').orderBy('pop', 'desc').limit(200).get().then(function(s){
      var L = [], I = {};
      s.forEach(function(d){
        var o = d.data();
        if (!o || d.id === user.uid || !o.vills || !o.vills.length) return;
        o.uid = d.id; L.push(o);
        o.vills.forEach(function(v, i){ I[v.x + ',' + v.y] = { p:o, vi:i }; });
      });
      others = L; idx = I; othersAt = Date.now();
      try { if (typeof Renderer !== 'undefined') Renderer.invalidate(); } catch(e){}
      if (cb) cb(others);
    }).catch(function(e){ log('others', e); if (cb) cb(others); });
  }
  function watch(){
    if (watching) return;
    watching = true;
    setInterval(function(){
      var w = document.getElementById('page-world');
      if (w && w.classList.contains('active') && Date.now() - othersAt > 300000)
        refreshOthers();
    }, 30000);
    document.addEventListener('visibilitychange', function(){
      if (document.visibilityState === 'hidden') flush();
    });
    window.addEventListener('pagehide', function(){ flush(); });
  }
  function at(x, y){ return idx[x + ',' + y] || null; }
  function occupied(x, y){ return !!idx[x + ',' + y]; }
  function list(){ return others; }
  function rank(field, n, cb){
    if (!db || !user) return cb([], 'ยังไม่ได้เข้าสู่ระบบ');
    db.collection('players').orderBy(field, 'desc').limit(n || 30).get().then(function(s){
      var L = [];
      s.forEach(function(d){ var o = d.data(); o.uid = d.id; if (o.name) L.push(o); });
      cb(L);
    }).catch(function(e){ log('rank', e); cb([], errText(e)); });
  }

  return { enabled:enabled, feature:feature, init:init, onAuth:onAuth, me:me, uid:uid,
    providerLabel:providerLabel, loginWith:loginWith, loginGuest:loginGuest,
    loginEmail:loginEmail, registerEmail:registerEmail, linkGoogle:linkGoogle,
    logout:logout, getProfile:getProfile, claimName:claimName, peekSave:peekSave,
    resetSave:resetSave, prepareGame:prepareGame, queueSave:queueSave, flush:flush,
    refreshOthers:refreshOthers, at:at, occupied:occupied, list:list, rank:rank };
})();