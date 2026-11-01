/* ============ พจนานุกรม ไทย → อังกฤษ (ต่อท้ายคำใหม่ได้เรื่อย ๆ) ============ */
var LANG_EN = {
  /* ชื่อเกม / ทั่วไป */
  'สุวรรณภูมิ':'Suvarnabhumi', 'สงครามเจ้านคร':'War of the City Lords', 'ทวารวดี':'Dvaravati',
  'เซิร์ฟเวอร์':'Server', 'เข้าสู่ระบบ':'Log in', 'ออกจากระบบ':'Log out', 'ลบบัญชี':'Delete account',
  'กำลังโหลด…':'Loading…', 'กำลังโหลด':'Loading', 'กำลังส่ง…':'Sending…', 'กำลังตรวจสอบ…':'Checking…',
  'ปิด':'Close', 'เปิด':'Open', 'ยกเลิก':'Cancel', 'ยืนยัน':'Confirm', 'บันทึก':'Save', 'ล้าง':'Clear',
  'ย้อนกลับ':'Back', 'ถัดไป':'Next', 'จบ':'Finish', 'ส่ง':'Send', 'คัดลอก':'Copy', 'แชร์':'Share',
  'ลองใหม่อีกครั้ง':'Please try again', 'ลองใหม่':'Retry', 'ไม่สำเร็จ':'failed', 'สำเร็จ':'success',
  'เรียบร้อย':'Done', 'ใช่':'Yes', 'ไม่':'No', 'ทั้งหมด':'All', 'ไม่มี':'None', 'ว่าง':'empty',
  'วันนี้':'Today', 'รายวัน':'daily', 'วันที่ ':'Day ', 'วัน':'days', 'ชม.':'h', 'วินาที':'sec', 'นาที':'min',
  'ครั้ง':'times', 'ทุกคน':'everyone', 'คน':'people', ' นาย':' units', 'ช่อง ':'Slot ', 'ช่อง':'slot',
  'เวลา':'Time', 'ระดับ':'Level', 'สูงสุด':'Max', 'ต้องมี':'Requires', 'ต้องการ':'Requires', 'ต่อ':'per',

  /* เมนูหลัก */
  'ทรัพยากร':'Resources', 'แผนที่':'Map', 'รายงาน':'Reports', 'เมือง':'Village',
  'โปรไฟล์':'Profile', 'ตั้งค่า':'Settings', 'ภารกิจ':'Quests', 'อันดับ':'Ranking', 'กองทัพ':'Army',
  'เติมทอง':'Buy gold', 'เช็คอินรายวัน':'Daily check-in', 'เช็คอิน':'Check-in', 'แจ้งปัญหา':'Report a problem',
  'บั๊ก':'Bug', 'เปลี่ยนชื่อผู้เล่น':'Rename player', 'วิธีเล่น':'How to play', 'บทแนะนำ':'Tutorial',
  'ทำเนียบฤดูกาล':'Season Hall of Fame', 'ศึกชิงเมืองหลวงโลก':'Battle for the World Capital',
  'เชิญเพื่อน':'Invite friends', 'การแจ้งเตือน':'Notifications', 'ติดตั้งเป็นแอป':'Install as app',
  'ธีม':'Theme', 'กลางวัน':'Day', 'กลางคืน':'Night', 'อัตโนมัติ':'Auto', 'บัญชี':'Account',
  'รหัสผู้เล่น':'Player ID', 'เวอร์ชัน':'Version', 'กลับโปรไฟล์':'Back to profile',
  'แสดงชื่อใต้ไอคอนแถบเมนูล่าง':'Show labels under bottom menu icons',

  /* ทรัพยากร */
  'ข้าว':'Wheat', 'ไม้':'Wood', 'เหล็ก':'Iron', 'โคลน':'Clay', 'ทองแดง':'copper', 'ทอง':'Gold', 'ประชากร':'Population',
  'นาข้าว':'Cropland', 'ป่าไม้':'Woodcutter', 'เหมืองเหล็ก':'Iron mine', 'บ่อโคลน':'Clay pit', 'หลุม':'Field',
  'ผลผลิต':'Production', 'ความจุ':'Capacity',

  /* อาคาร */
  'อาคารหลัก':'Main Building', 'ลานรวมพล':'Rally Point', 'คลังสินค้า':'Warehouse', 'ยุ้งฉางหลวง':'Great Granary',
  'ยุ้งฉาง':'Granary', 'ตลาด':'Marketplace', 'สถานทูต':'Embassy', 'ค่ายทหารหลวง':'Great Barracks',
  'ค่ายทหาร':'Barracks', 'คอกม้าหลวง':'Great Stable', 'คอกม้า':'Stable', 'โรงงาน':'Workshop',
  'โรงตีเหล็ก':'Smithy', 'โรงฟอกหนัง':'Armoury', 'หอคอยเฝ้าระวัง':'Watchtower', 'ที่ซ่อนทรัพย์':'Cranny',
  'ศาลาประชาคม':'Town Hall', 'คฤหาสน์':'Residence', 'พระราชวัง':'Palace', 'จวนวีรบุรุษ':'Hero Mansion',
  'วิหารหลวง':'Royal Temple', 'ค่ายฝึกพิเศษ':'Training Ground', 'โรงพยาบาล':'Infirmary', 'โกดังหลวง':'Great Warehouse',
  'โรงสีหลวง':'Royal Mill', 'โรงสี':'Grain Mill', 'โรงเลื่อย':'Sawmill', 'เตาเผาอิฐ':'Brickyard',
  'โรงหลอม':'Iron Foundry', 'กำแพง':'Wall', 'อาคาร':'Building', 'เลือกอาคาร':'Choose building',
  'อัปเกรด':'Upgrade', 'สร้าง':'Build', 'ก่อสร้างเสร็จ':'Construction complete', 'สร้างเสร็จ':'Completed',
  'คิวก่อสร้าง':'Build queue', 'กำลังสร้าง':'Building', 'เสร็จใน':'Done in', 'รอคิว':'Queued',
  'เร่ง':'Speed up', 'ทันที':'instantly', 'ช่างก่อสร้าง':'Builders', 'รื้อถอน':'Demolish', 'ย้ายอาคาร':'Move building',

  /* เผ่า / ทหาร */
  'สุโขทัย':'Sukhothai', 'ล้านนา':'Lanna', 'ศรีวิชัย':'Srivijaya', 'ขุนพลขอม':'Khmer Chief',
  'ขุนพลศรีวิชัย':'Srivijaya Chief', 'ขอม':'Khmer', 'เผ่า':'Tribe ',
  'ทหาร':'Troops', 'ฝึกทหาร':'Train troops', 'ฝึก':'Train', 'ผู้ตั้งถิ่นฐาน':'Settler', 'แสนท้าว':'Saen Thao',
  'ขุนพล':'Chief', 'ช้างศึก':'War Elephant', 'ช้างทรง':'Royal Elephant', 'พ่อค้า':'Merchant',
  'พลังโจมตี':'Attack power', 'โจมตี':'Attack', 'ป้องกัน':'Defense', 'ความเร็ว':'Speed', 'บรรทุก':'Carry',
  'เสบียง':'Upkeep', 'ความภักดี':'Loyalty',

  /* ภารกิจทัพ */
  'ส่งกองทัพ':'Send army', 'ส่งทัพ':'Send army', 'ส่งจาก':'Send from', 'เป้าหมาย':'Target', 'ปล้น':'Raid',
  'สอดแนม':'Scout', 'เสริมทัพ':'Reinforce', 'ตั้งเมืองใหม่':'Found new village', 'กองประจำการ':'Garrison',
  'โควตา':'Quota', 'เรียกกลับ':'Recall', 'ออกรบจากที่นี่':'Attack from here', 'เข้าเมือง':'Enter village',
  'ส่งสินค้า':'Send goods', 'ส่งของ':'Send goods', 'ข้อเสนอ':'Offers', 'ตั้งข้อเสนอ':'Create offer',
  'พ่อค้าหลวง':'Royal Merchant', 'แบ่งเท่ากัน':'Split evenly',

  /* แผนที่ */
  'ของเรา':'Ours', 'ศัตรู':'Enemy', 'พันธมิตร':'Ally', 'ผู้เล่นทั่วไป':'Neutral', 'เมืองร้าง':'Abandoned village',
  'โอเอซิส':'Oasis', 'ที่ว่าง':'Empty land', 'พิกัด':'Coordinates', 'สัตว์ป่าเฝ้าอยู่':'Guarded by wild animals',
  'ไม่มีเมืองที่พิกัดนี้':'No village at these coordinates', 'เมืองหลวงโลก':'World Capital', 'เมืองหลวง':'Capital',
  'ป้อมปราการ':'Fortress', 'ป้อม':'Fort', 'ฤดูกาล':'Season', 'ต่อเวลา':'Overtime', 'ผู้ชนะ':'Winner',
  'เปิดมาแล้ว':'Open for',

  /* วีรบุรุษ */
  'วีรบุรุษ':'Hero', 'ตัวละคร':'Character', 'กระเป๋า':'Bag', 'ปั้นหน้า':'Appearance', 'ดันเจี้ยน':'Dungeon',
  'พลังชีวิต':'Health', 'นำทัพ':'Leadership', 'ผลิตทรัพยากร':'Resource production', 'แต้มเหลือ':'Points left',
  'แต้ม':'Points', 'ค่าพลัง':'Attributes', 'สวมใส่':'Equip', 'ถอดเก็บเข้ากระเป๋า':'Unequip', 'ขาย':'Sell',
  'รักษา':'Heal', 'ยาฟื้นพลัง':'Healing potion', 'บาดเจ็บสาหัส':'Badly wounded', 'อยู่ในเมือง':'At home',
  'ส่งไปสำรวจ':'Send to explore', 'สุ่มใหม่':'Randomize', 'ชาย':'Male', 'หญิง':'Female',
  'หมวก':'Helmet', 'เกราะ':'Armor', 'อาวุธ':'Weapon', 'โล่':'Shield', 'ถุงมือ':'Gloves', 'รองเท้า':'Boots', 'เครื่องราง':'Amulet',
  'ธรรมดา':'Common', 'หายาก':'Rare', 'ตำนาน':'Legendary',
  'หมวกผ้า':'Cloth Cap', 'หมวกหนัง':'Leather Cap', 'หมวกสำริด':'Bronze Helm', 'มงกุฎนักรบ':'Warrior Crown', 'ชฎาเทพ':'Divine Chada',
  'เสื้อผ้าฝ้าย':'Cotton Shirt', 'เสื้อเกราะหนัง':'Leather Armor', 'เกราะเกล็ด':'Scale Armor', 'เกราะนาค':'Naga Armor', 'เกราะทิพย์':'Celestial Armor',
  'มีดพร้า':'Machete', 'ดาบเหล็ก':'Iron Sword', 'ดาบสองมือ':'Twin Swords', 'ง้าวเพชร':'Diamond Glaive', 'ดาบอาญาสิทธิ์':'Royal Sword',
  'โล่หวาย':'Rattan Shield', 'โล่ไม้':'Wooden Shield', 'โล่สำริด':'Bronze Shield', 'โล่พญานาค':'Naga Shield', 'โล่สุริยัน':'Sun Shield',
  'ผ้าพันมือ':'Hand Wraps', 'ถุงมือหนัง':'Leather Gloves', 'ปลอกแขนสำริด':'Bronze Bracers', 'ถุงมือเกราะ':'Gauntlets', 'กำไลเทพ':'Divine Bangle',
  'รองเท้าฟาง':'Straw Sandals', 'รองเท้าหนัง':'Leather Boots', 'รองเท้าเดินทาง':'Travel Boots', 'รองเท้าลมกรด':'Whirlwind Boots', 'รองเท้าเหาะ':'Flying Boots',
  'ตะกรุดไม้':'Wooden Takrut', 'ตะกรุดทองแดง':'Copper Takrut', 'พระเครื่อง':'Buddha Amulet', 'เครื่องรางนาค':'Naga Charm', 'ประคำทิพย์':'Celestial Beads',
  'ถ้ำค้างคาว':'Bat Cave', 'ซากปรักหักพังพุกาม':'Ruins of Bagan', 'ป่าลึกพญานาค':'Naga Deep Forest',
  'เหมืองร้างใต้ภูผา':'Abandoned Mountain Mine', 'นครบาดาล':'Underworld City',
  'ป้อมอุดร':'North Fort', 'ป้อมอีสาน':'Northeast Fort', 'ป้อมบูรพา':'East Fort', 'ป้อมอาคเนย์':'Southeast Fort',
  'ป้อมทักษิณ':'South Fort', 'ป้อมหรดี':'Southwest Fort', 'ป้อมประจิม':'West Fort', 'ป้อมพายัพ':'Northwest Fort',
  'นครหลวงสุวรรณภูมิ':'Suvarnabhumi Capital', 'ผู้พิทักษ์แผ่นดิน':'Land Guardians',

  /* สังคม */
  'กล่องข้อความ':'Inbox', 'ส่วนตัว':'Private', 'กิลด์':'Guild', 'โลก':'World', 'ข้อความใหม่':'New message',
  'ที่บล็อกไว้':'Blocked', 'บล็อก':'Block', 'ทีมงานสุวรรณภูมิ':'Suvarnabhumi Team', 'สมาชิก':'Members',
  'คำขอ':'Requests', 'การทูต':'Diplomacy', 'จัดการ':'Manage', 'ออกจากกิลด์':'Leave guild', 'ตั้งกิลด์':'Create guild',
  'หัวหน้ากิลด์':'Guild leader', 'รองหัวหน้า':'Deputy', 'แชตกิลด์':'Guild chat', 'ลบ':'Delete',

  /* ข้อความระบบที่พบบ่อย */
  'ทรัพยากรไม่พอ':'Not enough resources', 'ทองไม่พอ':'Not enough gold', 'ไม่พอ':'not enough',
  'ส่งคำสั่งถี่เกินไป รอสักครู่แล้วลองใหม่':'Too many requests. Please wait a moment.',
  'เซิร์ฟเวอร์ขัดข้อง ลองใหม่อีกครั้ง':'Server error. Please try again.',
  'ปิดปรับปรุงชั่วคราว':'Temporarily under maintenance', 'มีอัปเดตใหม่':'New update available', 'โหลดใหม่':'Reload',
  'ต้องโหลดใหม่ก่อนเล่นต่อ ข้อมูลของคุณเก็บไว้บนเซิร์ฟเวอร์แล้ว':'Please reload to continue. Your progress is saved on the server.',
  'ยังไม่ได้เลือกทหาร':'No troops selected', 'กองทัพออกเดินทางแล้ว':'Army has set out',
  'ข้ามบทแนะนำ':'Skip tutorial', 'ข้ามขั้นนี้':'Skip step', 'เริ่มเล่น':'Start playing'
};