/* ============ admsrv v15A — รายชื่อเซิร์ฟเวอร์สำหรับหน้า admin (โหลดก่อน api.js) ============ */
/* api:'' = ใช้ URL เดิมใน api.js · เปิดเซิร์ฟใหม่ให้เพิ่มบรรทัดพร้อม URL ของ worker นั้น */
var SERVERS = [
  { id:1, name:'ทวารวดี', api:'' }
  /* , { id:2, name:'ศรีวิชัย', api:'https://xxxx.workers.dev' } */
];
(function(){
  try {
    var s = JSON.parse(localStorage.getItem('adm_srv') || 'null');
    var f = s && SERVERS.filter(function(x){ return x.id === s.id; })[0];
    if (f && f.api) window.API_BASE = f.api;
  } catch(e){}
})();
