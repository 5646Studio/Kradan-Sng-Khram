/* ========== วางค่าจาก Firebase Console ==========
   Project settings → Your apps → SDK setup and configuration → Config
   ถ้ายังไม่ใส่ เกมจะเล่นแบบออฟไลน์ในเครื่องโดยอัตโนมัติ */
var FIREBASE_CONFIG = {
  apiKey: "AIzaSyCtg67T7QrMqaI6aFzlqSUuduG03s2hZzs",
  authDomain: "suwannaphum-war.firebaseapp.com",
  projectId: "suwannaphum-war",
  storageBucket: "suwannaphum-war.firebasestorage.app",
  messagingSenderId: "628147513319",
  appId: "1:628147513319:web:8085d0b400ce248fafff42",
  measurementId: "G-3TFN4QQS0T"
};

/* เปิด/ปิดปุ่มล็อกอิน — Facebook ต้องตั้งค่าเพิ่ม (ดูคู่มือ) */
var NET_FEATURES = { google:true, facebook:false, email:true, guest:true };