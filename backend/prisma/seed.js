import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
 
const prisma = new PrismaClient()
 
async function main() {
  console.log('🌱 Seeding database...')
 
  // สร้าง Admin
  const adminPw = await bcrypt.hash('admin1234', 10)
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', password: adminPw, role: 'ADMIN', name: 'ผู้ดูแลระบบ' }
  })
 
  // สร้างค่ายย่อย
  const campA = await prisma.camp.upsert({
    where: { id: 'camp-a' },
    update: {},
    create: { id: 'camp-a', name: 'ค่ายย่อย A' }
  })
  const campB = await prisma.camp.upsert({
    where: { id: 'camp-b' },
    update: {},
    create: { id: 'camp-b', name: 'ค่ายย่อย B' }
  })
 
  // สร้าง Camp Manager
  const campMgrPw = await bcrypt.hash('camp1234', 10)
  await prisma.user.upsert({
    where: { username: 'campmanager1' },
    update: {},
    create: { username: 'campmanager1', password: campMgrPw, role: 'CAMP_MANAGER', name: 'ผู้ดูแลค่าย 1', campId: campA.id }
  })
  await prisma.user.upsert({
    where: { username: 'campmanager2' },
    update: {},
    create: { username: 'campmanager2', password: campMgrPw, role: 'CAMP_MANAGER', name: 'ผู้ดูแลค่าย 2', campId: campB.id }
  })
 
  // สร้างกิจกรรม
  const activities = [
    { id: 'act-1', name: 'ทักษะลูกเสือ', type: 'MAIN' },
    { id: 'act-2', name: 'ผจญภัย', type: 'MAIN' },
    { id: 'act-3', name: 'เดินทางไกล', type: 'MAIN' },
    { id: 'act-4', name: 'CPR & AED', type: 'MAIN' },
    { id: 'act-5', name: 'นิทรรศการ 100 ปี', type: 'MAIN' },
    { id: 'act-6', name: 'หมู่บ้านโลกาภิวัฒน์', type: 'MAIN' },
    { id: 'act-7', name: 'พิธีเปิด', type: 'SPECIAL' },
    { id: 'act-8', name: 'เฉลิมพระเกียรติ', type: 'SPECIAL' },
    { id: 'act-9', name: 'Camp Fire', type: 'SPECIAL' },
    { id: 'act-10', name: 'พิธีปิด', type: 'SPECIAL' },
    { id: 'act-11', name: 'Zip Line', type: 'FREE' },
    { id: 'act-12', name: 'Shooting', type: 'FREE' },
    { id: 'act-13', name: 'AI Art', type: 'FREE' },
  ]
  for (const act of activities) {
    await prisma.activity.upsert({ where: { id: act.id }, update: {}, create: act })
  }
 
  // สร้าง Staff
  const staffPw = await bcrypt.hash('staff1234', 10)
  const staff1 = await prisma.user.upsert({
    where: { username: 'staff1' },
    update: {},
    create: { username: 'staff1', password: staffPw, role: 'STAFF', name: 'เจ้าหน้าที่ 1' }
  })
  await prisma.user.upsert({
    where: { username: 'staff2' },
    update: {},
    create: { username: 'staff2', password: staffPw, role: 'STAFF', name: 'เจ้าหน้าที่ 2' }
  })

  // ✅ เคลียร์ staffId เก่าก่อน แล้วค่อย assign ใหม่
  await prisma.activity.updateMany({
    where: { staffId: staff1.id },
    data: { staffId: null }
  })
  await prisma.activity.update({
    where: { id: 'act-1' },
    data: { staffId: staff1.id }
  })
 
  // สร้างกอง/หมู่
  const troop1 = await prisma.troop.upsert({
    where: { id: 'troop-1' },
    update: {},
    create: { id: 'troop-1', name: 'กอง 1', number: 1, campId: campA.id }
  })
  const squad1 = await prisma.squad.upsert({
    where: { id: 'squad-1' },
    update: {},
    create: { id: 'squad-1', name: 'หมู่ 1', number: 1, troopId: troop1.id }
  })
 
  // สร้าง Director (ผู้กำกับ)
  const directorPw = await bcrypt.hash('password1234', 10)
  const director1 = await prisma.user.upsert({
    where: { username: 'director1' },
    update: {},
    create: {
      username: 'director1', password: directorPw,
      role: 'TROOP_LEADER', name: 'ผู้กำกับ 1',
      campId: campA.id, school: 'วิทยาลัยเทคนิคเชียงใหม่'
    }
  })
  await prisma.user.upsert({
    where: { username: 'director2' },
    update: {},
    create: {
      username: 'director2', password: directorPw,
      role: 'TROOP_LEADER', name: 'ผู้กำกับ 2',
      campId: campA.id, school: 'วิทยาลัยเทคนิคเชียงใหม่'
    }
  })
  await prisma.user.upsert({
    where: { username: 'director3' },
    update: {},
    create: {
      username: 'director3', password: directorPw,
      role: 'TROOP_LEADER', name: 'ผู้กำกับ 3',
      campId: campB.id, school: 'วิทยาลัยเทคนิคเชียงราย'
    }
  })

  // ✅ เชื่อม director1 กับ squad1 แบบ many-to-many
  await prisma.squad.update({
    where: { id: 'squad-1' },
    data: {
      leaders: { connect: { id: director1.id } }
    }
  })
 
  // สร้างลูกเสือตัวอย่าง + user account
  const scoutPw = await bcrypt.hash('scout1234', 10)
  const scoutData = [
    {
      code: 'SC001', username: 'scout001',
      firstName: 'สมชาย', lastName: 'ใจดี',
      nickname: 'น้อง1', gender: 'ชาย'
    },
    {
      code: 'SC002', username: 'scout002',
      firstName: 'สมหญิง', lastName: 'ใจดี',
      nickname: 'น้อง2', gender: 'หญิง'
    },
    {
      code: 'SC003', username: 'scout003',
      firstName: 'สมนึก', lastName: 'ใจดี',
      nickname: 'น้อง3', gender: 'ไม่ระบุ'
    },
  ]
 
  for (const scout of scoutData) {
    const sc = await prisma.scout.upsert({
      where: { scoutCode: scout.code },
      update: {},
      create: {
        scoutCode: scout.code,
        firstName: scout.firstName,
        lastName: scout.lastName,
        nickname: scout.nickname,
        gender: scout.gender,
        school: 'วิทยาลัยเทคนิคเชียงใหม่',
        province: 'เชียงใหม่',
        squadId: squad1.id
      }
    })
    const scUser = await prisma.user.upsert({
      where: { username: scout.username },
      update: {},
      create: {
        username: scout.username,
        password: scoutPw,
        role: 'SCOUT',
        name: `${scout.firstName} ${scout.lastName}`,
        campId: campA.id
      }
    })
    await prisma.scout.update({ where: { id: sc.id }, data: { userId: scUser.id } })
  }
 
  // สร้าง Activity Groups
  console.log('🏕️ Creating activity groups...')
  
  const activityGroup1 = await prisma.activityGroup.upsert({
    where: { id: 'group-1' },
    update: {},
    create: { 
      id: 'group-1',
      name: 'กลุ่มกิจกรรมทักษะลูกเสือ', 
      description: 'กลุ่มที่เรียนรู้ทักษะพื้นฐานลูกเสือ',
      campId: campA.id,
      maxScouts: 20,
      isActive: true
    }
  })
  
  await prisma.activityGroup.upsert({
    where: { id: 'group-2' },
    update: {},
    create: { 
      id: 'group-2',
      name: 'กลุ่มกิจกรรมผจญภัย', 
      description: 'กลุ่มที่เรียนรู้ทักษะการเอาตัวรอด',
      campId: campA.id,
      maxScouts: 15,
      isActive: true
    }
  })
   
  // จัดหมู่เข้ากลุ่มกิจกรรม
  await prisma.squad.update({
    where: { id: 'squad-1' },
    data: { activityGroupId: activityGroup1.id }
  })
   
  console.log('✅ Activity groups created!')
 
  // สร้างตารางกิจกรรม
  console.log('📅 Creating schedules...')
 
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
 
  await prisma.schedule.createMany({
    data: [
      { activityId: 'act-1', campId: campA.id, activityGroupId: activityGroup1.id, squadId: null, date: today,    slot: 'MORNING'   },
      { activityId: 'act-2', campId: campA.id, activityGroupId: activityGroup1.id, squadId: null, date: today,    slot: 'AFTERNOON' },
      { activityId: 'act-3', campId: campA.id, activityGroupId: activityGroup1.id, squadId: null, date: tomorrow, slot: 'MORNING'   },
      { activityId: 'act-4', campId: campA.id, activityGroupId: activityGroup1.id, squadId: null, date: tomorrow, slot: 'AFTERNOON' },
    ],
    skipDuplicates: true
  })
 
  await prisma.schedule.createMany({
    data: [
      { activityId: 'act-7', campId: campA.id, squadId: null, activityGroupId: null, date: today,    slot: 'EVENING' },
      { activityId: 'act-9', campId: campA.id, squadId: null, activityGroupId: null, date: tomorrow, slot: 'EVENING' },
    ],
    skipDuplicates: true
  })
 
  console.log('📅 Schedules created!')
  console.log('✅ Seed complete!')
  console.log('📋 Test accounts:')
  console.log('  admin / admin1234')
  console.log('  campmanager1 / camp1234')
  console.log('  campmanager2 / camp1234')
  console.log('  director1 / password1234')
  console.log('  director2 / password1234')
  console.log('  director3 / password1234')
  console.log('  staff1 / staff1234')
  console.log('  staff2 / staff1234')
  console.log('  scout001 / scout1234')
  console.log('  scout002 / scout1234')
  console.log('  scout003 / scout1234')
}
 
main().catch(console.error).finally(() => prisma.$disconnect())