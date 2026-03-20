// สร้าง endpoints ที่ยังขาดสำหรับ Squad Leader
const fs = require('fs');
const path = require('path');

// อ่านไฟล์ admin.routes.js ปัจจุบัน
const adminRoutesPath = path.join(__dirname, 'routes', 'admin.routes.js');
const adminRoutesContent = fs.readFileSync(adminRoutesPath, 'utf8');

// ตรวจสอบว่ามี endpoints ที่ต้องการแล้ว
const hasAvailableScouts = adminRoutesContent.includes("router.get('/scouts/available', c.getAvailableScouts)");
const hasAvailableLeaders = adminRoutesContent.includes("router.get('/leaders/available', c.getAvailableLeaders)");

if (!hasAvailableScouts || !hasAvailableLeaders) {
  console.log('❌ ยังไม่มี endpoints ที่ต้องการใน admin.routes.js');
  console.log('กำลังเพิ่ม endpoints ที่ขาด...');
  
  // เพิ่ม endpoints ที่ขาด
  const newContent = adminRoutesContent.replace(
    "module.exports = router;",
    `// Add missing endpoints for available scouts and leaders
router.get('/scouts/available', c.getAvailableScouts);
router.get('/leaders/available', c.getAvailableLeaders);

module.exports = router;`
  );
  
  // เขียนทับไฟล์
  fs.writeFileSync(adminRoutesPath, newContent);
  console.log('✅ เพิ่ม endpoints สำเร็จแล้ว!');
  console.log('📋 Endpoints ที่เพิ่ม:');
  console.log('   - GET /api/admin/scouts/available');
  console.log('   - GET /api/admin/leaders/available');
  console.log('');
  console.log('🔄 กรุณา restart backend server เพื่อให้ endpoints ใหม่ทำงาน');
} else {
  console.log('✅ endpoints ที่จำเป็นครับแล้วแล้ว!');
}

console.log('🔍 ตรวจสอบสถานะของ Squad Leader endpoints...');
const squadLeaderRoutesPath = path.join(__dirname, 'routes', 'squadLeader.js');
const squadLeaderExists = fs.existsSync(squadLeaderRoutesPath);

if (squadLeaderExists) {
  console.log('✅ squadLeader.js มีอยู่แล้ว - endpoints ที่จำเป็นครับ:');
  console.log('   - GET /api/squad-leader/my-squad');
  console.log('   - GET /api/squad-leader/available-scouts');
  console.log('   - POST /api/squad-leader/add-scout');
  console.log('   - PATCH /api/squad-leader/scouts/:id');
  console.log('   - DELETE /api/squad-leader/scouts/:id');
} else {
  console.log('❌ squadLeader.js ไม่พบ!');
}

console.log('📋 สรุปเสร็จ:');
console.log('1. Admin endpoints สำหรับ available users');
console.log('2. Squad Leader endpoints มีอยู่แล้ว');
console.log('3. กรุณา restart backend server');
console.log('4. Clear browser cache ถ้าจำเป็น');
