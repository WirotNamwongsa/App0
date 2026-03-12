# ระบบงานชุมนุมลูกเสืออาชีวศึกษา (PWA)

ระบบจัดการการเข้าร่วมกิจกรรมสำหรับงานชุมนุมลูกเสืออาชีวศึกษา รองรับ 5 บทบาท พร้อมสแกน QR Code ออฟไลน์

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| State | Zustand + React Query |
| Backend | Node.js + Express |
| Database | SQLite (Prisma ORM) |
| Auth | JWT |
| PWA | vite-plugin-pwa |

## โครงสร้างโปรเจกต์

```
jamboree-app/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── seed.js           # ข้อมูลตัวอย่าง
│   ├── src/
│   │   ├── index.js          # Express server
│   │   ├── lib/
│   │   │   ├── prisma.js     # Prisma client
│   │   │   └── audit.js      # Audit log helper
│   │   ├── middleware/
│   │   │   ├── auth.js       # JWT middleware
│   │   │   └── errorHandler.js
│   │   └── routes/
│   │       ├── auth.js       # Login / Me
│   │       ├── scouts.js     # CRUD ลูกเสือ
│   │       ├── camps.js      # ค่าย/กอง/หมู่
│   │       ├── activities.js # กิจกรรม
│   │       ├── schedules.js  # ตารางกิจกรรม
│   │       ├── attendance.js # สแกน QR
│   │       ├── admin.js      # Admin เท่านั้น
│   │       └── reports.js    # รายงาน
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── App.jsx           # Router + Auth guard
    │   ├── lib/api.js        # Axios + interceptors
    │   ├── store/authStore.js # Zustand auth state
    │   ├── components/       # Shared components
    │   └── pages/
    │       ├── LoginPage.jsx
    │       ├── scout/        # หน้าลูกเสือ
    │       ├── leader/       # หน้าผู้กำกับหมู่
    │       ├── staff/        # หน้าผู้จัดกิจกรรม (QR Scanner)
    │       ├── camp/         # หน้าผู้ดูแลค่ายย่อย
    │       └── admin/        # หน้า Admin
    ├── vite.config.js
    └── tailwind.config.js
```

## วิธีติดตั้งและรัน

### Prerequisites
- Node.js 18+
- npm หรือ yarn

### 1. Clone และติดตั้ง Backend

```bash
cd backend
npm install

# สร้างไฟล์ .env
cp .env.example .env

# สร้าง Database + Migrate
npx prisma generate
npx prisma db push

# ใส่ข้อมูลตัวอย่าง
npm run db:seed

# รัน Development
npm run dev
```

### 2. ติดตั้ง Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend จะรันที่ `http://localhost:5173`  
Backend API จะรันที่ `http://localhost:4000`

## บัญชีทดสอบ

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin1234` | Admin |
| `camp_a` | `camp1234` | ผู้ดูแลค่ายย่อย A |
| `leader_1_1` | `leader1234` | ผู้กำกับหมู่ 1 กอง 1 |
| `staff_skill` | `staff1234` | ผู้จัดกิจกรรม (ทักษะลูกเสือ) |
| `scout1` | `scout1234` | ลูกเสือ |

## API Endpoints

```
POST /api/auth/login          เข้าสู่ระบบ
GET  /api/auth/me             ดูข้อมูลตัวเอง

GET  /api/scouts              รายชื่อลูกเสือ (Admin/Camp)
GET  /api/scouts/my           ข้อมูลลูกเสือตัวเอง
GET  /api/scouts/my/qr        QR Code
PATCH /api/scouts/:id         แก้ไขข้อมูลส่วนตัว
PATCH /api/scouts/:id/move    ย้ายหมู่

GET  /api/activities          รายการกิจกรรม
POST /api/activities          สร้างกิจกรรม (Admin)

GET  /api/schedules           ดูตาราง
POST /api/schedules           เพิ่มตาราง (Camp Manager)

POST /api/attendance/scan     สแกน QR
GET  /api/attendance          รายการสแกน

GET  /api/reports/overview    ภาพรวม (Admin)
GET  /api/reports/camp/:id    รายงานค่าย
GET  /api/reports/squad/:id   รายงานหมู่

GET  /api/admin/accounts      จัดการบัญชี (Admin)
POST /api/admin/accounts      สร้างบัญชี
GET  /api/admin/audit         Audit Log
POST /api/admin/import-scouts Import ลูกเสือ
```

## ฟีเจอร์หลัก

- ✅ **PWA** — ติดตั้งบน Home Screen ได้
- ✅ **Offline QR Scan** — สแกนได้แม้ไม่มีเน็ต บันทึก Queue แล้ว Sync
- ✅ **5 Roles** — Admin / Camp Manager / Leader / Staff / Scout
- ✅ **QR Code** — Generate และแสดง QR สำหรับลูกเสือแต่ละคน
- ✅ **Audit Log** — บันทึกทุกการเปลี่ยนแปลงข้อมูล
- ✅ **Mobile First** — ปุ่มทุกปุ่ม min 48px สำหรับ thumb
