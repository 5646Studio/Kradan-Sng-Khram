/* ============ numfix v14X — แตะช่องตัวเลขแล้วพิมพ์ได้เลย ============ */
(function(){
  function isNum(el){
    if (!el || el.tagName !== 'INPUT' || el.readOnly || el.disabled) return false;
    var t = (el.type || '').toLowerCase(), im = el.inputMode || '';
    return t === 'number' || t === 'tel' || im === 'numeric' || im === 'decimal' ||
      (t === 'text' && /^-?\d[\d,]*$/.test(el.value));
  }
  function fire(el){
    el.dispatchEvent(new Event('input', { bubbles:true }));
    el.dispatchEvent(new Event('change', { bubbles:true }));
  }
  document.addEventListener('focusin', function(e){
    var el = e.target;
    if (!isNum(el)) return;
    if (el.value === '0'){ el.dataset.nz = '1'; el.value = ''; }
    else setTimeout(function(){ try { el.select(); } catch(x){} }, 0);
  });
  document.addEventListener('focusout', function(e){
    var el = e.target;
    if (!el || !el.dataset || !el.dataset.nz) return;
    delete el.dataset.nz;
    if (el.value === ''){ el.value = '0'; fire(el); }
  });
  document.addEventListener('input', function(e){
    var el = e.target;
    if (el && el.tagName === 'INPUT' && /^-?0\d/.test(el.value) && isNum(el))
      el.value = el.value.replace(/^(-?)0+(?=\d)/, '$1');
  }, true);
})();