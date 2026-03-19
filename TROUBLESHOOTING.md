# แก้ไขปัญหา Squad Leader

## 1. ปัญหา Token 401
- สาเหตุ: ไม่มี JWT_SECRET ใน .env
- วิธีแก้: สร้างไฟล์ .env ในโฟลเดอร์ backend

## 2. ปัญหาหน้า Add Scout ไม่แสดง
- สาเหตุ: ไม่ได้โหลด availableScouts ตั้งแต่แรก
- วิธีแก้: เพิ่ม loadAvailableScouts() ใน useEffect

## 3. ปัญหาปุ่มไม่แสดง
- สาเหตุ: มีเงื่อนไข availableScouts?.canAdd
- วิธีแก้: ลบเงื่อนไขออกให้ปุ่มแสดงตลอด

## 4. ปัญหา Routing
- สาเหตุ: ยังใช้ route เก่า /leader/home
- วิธีแก้: เปลี่ยนไป /squad-leader/home

## 5. ตรวจสอบการทำงาน
- ใช้ debug endpoint และ test endpoint
- ตรวจสอบ token ใน localStorage
- ตรวจสอบ JWT_SECRET ใน backend
