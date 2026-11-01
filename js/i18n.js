/* ============ I18N v14S — แปลภาษาอัตโนมัติจากพจนานุกรม js/lang_en.js ============
   ต้องโหลดก่อนสคริปต์อื่นทั้งหมด */
var I18N = (function(){
  var KEY = 'sw_lang', MK = 'sw_i18n_miss', TH = /[\u0E00-\u0E7F]/;
  var SKIP = '.cb,.cn,.cvm i,.gt,[data-noi18n],textarea,script,style';
  var AT = ['placeholder', 'title', 'alt', 'aria-label'];
  var lang = 'th';
  try { lang = localStorage.getItem(KEY) === 'en' ? 'en' : 'th'; } catch(e){}
  var on = lang === 'en', D = null, K = null, cache = {}, cn = 0, miss = {}, saveT = 0;
  var ORIG = new WeakMap(), OUT = new WeakMap();
  try { miss = JSON.parse(localStorage.getItem(MK) || '{}'); } catch(e){}

  function load(){
    if (K) return;
    D = window.LANG_EN || {};
    K = Object.keys(D).filter(function(k){ return k && D[k]; }).sort(function(a, b){ return b.length - a.length; });
  }
  function note(s){
    (s.match(/[\u0E00-\u0E7F][\u0E00-\u0E7F\s]*/g) || []).forEach(function(x){
      x = x.trim();
      if (x.length > 1 && !miss[x] && Object.keys(miss).length < 600) miss[x] = 1;
    });
    clearTimeout(saveT);
    saveT = setTimeout(function(){ try { localStorage.setItem(MK, JSON.stringify(miss)); } catch(e){} }, 2000);
  }
  function tr(s){
    if (!on || s == null) return s;
    s = String(s);
    if (!TH.test(s)) return s;
    if (cache[s] != null) return cache[s];
    load();
    var core = s.trim(), i0 = s.indexOf(core), lead = s.slice(0, i0), tail = s.slice(i0 + core.length), o;
    if (D[core]) o = D[core];
    else {
      o = core;
      for (var i = 0; i < K.length; i++) if (o.indexOf(K[i]) >= 0) o = o.split(K[i]).join(' ' + D[K[i]] + ' ');
      o = o.replace(/[ \u00A0]{2,}/g, ' ').replace(/ ([·,.:;!?)\]%…])/g, '$1').replace(/([(\[#]) /g, '$1').trim();
    }
    if (TH.test(o)) note(o);
    var r = lead + o + tail;
    if (++cn > 4000){ cache = {}; cn = 0; }
    cache[s] = r;
    return r;
  }
  function text(n){
    var v = n.nodeValue;
    if (v === OUT.get(n)) return;
    ORIG.delete(n); OUT.delete(n);
    if (!v || !TH.test(v)) return;
    var p = n.parentNode;
    if (!p || (p.closest && p.closest(SKIP))) return;
    var t = tr(v);
    ORIG.set(n, v); OUT.set(n, t);
    if (t !== v) n.nodeValue = t;
  }
  function attrs(e){
    if (!e.getAttribute || (e.closest && e.closest('.cb,[data-noi18n]'))) return;
    AT.forEach(function(a){ var v = e.getAttribute(a); if (v && TH.test(v)) e.setAttribute(a, tr(v)); });
    if (e.tagName === 'INPUT' && /^(button|submit)$/.test(e.type) && TH.test(e.value)) e.value = tr(e.value);
  }
  function walk(n){
    if (!on || !n) return;
    if (n.nodeType === 3) return text(n);
    if (n.nodeType !== 1) return;
    attrs(n);
    var w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT, null), L = [], x;
    while ((x = w.nextNode())) L.push(x);
    L.forEach(text);
    n.querySelectorAll('[placeholder],[title],[alt],[aria-label],input[type=button],input[type=submit]').forEach(attrs);
  }
  /* ข้อความต้นฉบับภาษาไทยของ element (ใช้จับคู่ชื่ออาคารในโหมดภาษาอังกฤษ) */
  function src(el){
    if (!el) return '';
    if (!on) return el.textContent || '';
    if (el.nodeType === 3) return (ORIG.has(el) && el.nodeValue === OUT.get(el)) ? ORIG.get(el) : el.nodeValue;
    var s = '', w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), x;
    while ((x = w.nextNode())) s += src(x);
    return s;
  }
  function start(){
    document.documentElement.lang = 'en';
    document.title = tr(document.title);
    walk(document.body);
    new MutationObserver(function(ms){
      ms.forEach(function(m){
        if (m.type === 'childList') m.addedNodes.forEach(walk);
        else if (m.type === 'characterData') text(m.target);
        else attrs(m.target);
      });
    }).observe(document.body, { childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:AT });
  }
  if (on){
    ['alert', 'confirm'].forEach(function(f){
      var o = window[f];
      window[f] = function(m){ return o.call(window, tr(m == null ? '' : m)); };
    });
    var op = window.prompt;
    window.prompt = function(m, d){ return op.call(window, tr(m == null ? '' : m), d); };
    ['toLocaleString', 'toLocaleDateString', 'toLocaleTimeString'].forEach(function(f){
      var o = Date.prototype[f];
      Date.prototype[f] = function(l, x){ return o.call(this, l === 'th-TH' ? 'en-GB' : l, x); };
    });
    try {
      var C = CanvasRenderingContext2D.prototype;
      ['fillText', 'strokeText', 'measureText'].forEach(function(f){
        var o = C[f];
        C[f] = function(s){ var a = Array.prototype.slice.call(arguments); a[0] = tr(s); return o.apply(this, a); };
      });
    } catch(e){}
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  }

  function set(l){ try { localStorage.setItem(KEY, l === 'en' ? 'en' : 'th'); } catch(e){} location.reload(); }
  function missList(){ return Object.keys(miss); }
  function copyMiss(){
    var t = missList().join('\n');
    if (!t) return alert('No untranslated text recorded yet');
    function done(){ alert('Copied ' + missList().length + ' lines. Paste them in the chat with the developer.'); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, function(){ window.prompt('Copy:', t); });
    else window.prompt('Copy:', t);
  }
  function clearMiss(){ miss = {}; try { localStorage.removeItem(MK); } catch(e){} }
  window.T = tr;
  return { tr:tr, src:src, set:set, lang:function(){ return lang; }, missList:missList, copyMiss:copyMiss, clearMiss:clearMiss };
})();