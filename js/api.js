/* ============ Api v14 — คุยกับเซิร์ฟเวอร์เกม ============ */
var API_BASE = 'https://suwannaphum-api.anupong-uun-272.workers.dev';

var Api = (function(){
  var TIMEOUT = 15000;

  function base(){ return String(API_BASE || '').replace(/\/+$/, ''); }

  function token(){
    try {
      if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length)
        return Promise.resolve('');
      var u = firebase.auth().currentUser;
      return u ? u.getIdToken() : Promise.resolve('');
    } catch(e){ return Promise.resolve(''); }
  }

  function query(q){
    if (!q) return '';
    var a = [];
    for (var k in q) if (q[k] !== undefined && q[k] !== null)
      a.push(encodeURIComponent(k) + '=' + encodeURIComponent(q[k]));
    return a.length ? '?' + a.join('&') : '';
  }

  function req(method, path, body, q, useAuth){
    if (!base()) return Promise.resolve({ ok:false, net:true, err:'ยังไม่ได้ตั้งค่า API_BASE' });
    var url = base() + path + query(q);
    return (useAuth === false ? Promise.resolve('') : token()).then(function(t){
      var h = {};
      if (t) h['Authorization'] = 'Bearer ' + t;
      if (body) h['Content-Type'] = 'application/json';
      var ctl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
      var tm = ctl ? setTimeout(function(){ ctl.abort(); }, TIMEOUT) : null;
      return fetch(url, { method:method, headers:h,
          body: body ? JSON.stringify(body) : undefined,
          signal: ctl ? ctl.signal : undefined })
        .then(function(r){
          if (tm) clearTimeout(tm);
          return r.json()
            .catch(function(){ return { ok:false, err:'เซิร์ฟเวอร์ตอบกลับผิดรูปแบบ (HTTP ' + r.status + ')' }; })
            .then(function(j){
              j = j || {};
              j._status = r.status;
              if (r.status === 401) j.err = 'auth';
              return j;
            });
        });
    }).catch(function(){
      return { ok:false, net:true, err:'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้' };
    });
  }

  return {
    base: base,
    get:  function(p, q, auth){ return req('GET', p, null, q, auth); },
    post: function(p, b){ return req('POST', p, b || {}, null, true); }
  };
})();