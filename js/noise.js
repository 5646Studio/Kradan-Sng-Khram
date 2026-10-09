var Noise = (function(){
  function hash(x, y, seed){
    var h = Math.imul(x|0, 374761393) ^ Math.imul(y|0, 668265263)
          ^ Math.imul(seed|0, 1274126177);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h = h ^ (h >>> 16);
    return (h >>> 0) / 4294967295;
  }
  function smooth(t){ return t*t*(3 - 2*t); }
  function value2(x, y, seed){
    var xi = Math.floor(x), yi = Math.floor(y);
    var xf = x - xi, yf = y - yi;
    var a = hash(xi, yi, seed),     b = hash(xi+1, yi, seed);
    var c = hash(xi, yi+1, seed),   d = hash(xi+1, yi+1, seed);
    var u = smooth(xf), v = smooth(yf);
    return (a*(1-u) + b*u)*(1-v) + (c*(1-u) + d*u)*v;
  }
  function fbm(x, y, seed, oct){
    oct = oct || 4;
    var amp = 1, freq = 1, sum = 0, norm = 0;
    for (var i = 0; i < oct; i++){
      sum += amp * value2(x*freq, y*freq, seed + i*7919);
      norm += amp; amp *= 0.5; freq *= 2;
    }
    return sum / norm;
  }
  return { hash: hash, fbm: fbm };
})();