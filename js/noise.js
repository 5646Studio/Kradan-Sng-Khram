/* ============ Noise v14 — แฮชจำนวนเต็ม ผลเหมือนกันทุกเครื่องและบนเซิร์ฟเวอร์ ============
   ห้ามแก้ไฟล์นี้ — ถ้าแก้ แผนที่ในเกมจะไม่ตรงกับเซิร์ฟเวอร์ */
var Noise = (function(){
  function hash(x, y, seed){
    var h = (seed | 0) ^ Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263);
    h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b);
    h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  function perlin(x, y, seed){ return hash(Math.floor(x), Math.floor(y), seed); }
  return { hash:hash, perlin:perlin };
})();