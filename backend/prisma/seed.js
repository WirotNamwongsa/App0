import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // สร้าง Admin
  const adminPw = await bcrypt.hash('admin1234', 10)
  const admin = await prisma.user.upsert({
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
    where: { username: 'camp_a' },
    update: {},
    create: { username: 'camp_a', password: campMgrPw, role: 'CAMP_MANAGER', name: 'ผู้ดูแลค่าย A', campId: campA.id }
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

  // สร้าง Staff สำหรับ act-1
  const staffPw = await bcrypt.hash('staff1234', 10)
  const staff1 = await prisma.user.upsert({
    where: { username: 'staff_skill' },
    update: {},
    create: { username: 'staff_skill', password: staffPw, role: 'STAFF', name: 'ผู้จัดกิจกรรมทักษะลูกเสือ' }
  })
  await prisma.activity.update({ where: { id: 'act-1' }, data: { staffId: staff1.id } })

  // สร้างกอง/หมู่/ลูกเสือ ตัวอย่าง
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

  // สร้าง Leader
  const leaderPw = await bcrypt.hash('leader1234', 10)
  const leader1 = await prisma.user.upsert({
    where: { username: 'leader_1_1' },
    update: {},
    create: { username: 'leader_1_1', password: leaderPw, role: 'TROOP_LEADER', name: 'ผู้กำกับหมู่ 1 กอง 1', campId: campA.id }
  })
  await prisma.squad.update({ where: { id: 'squad-1' }, data: { leaderId: leader1.id } })

  // สร้างลูกเสือตัวอย่าง + user account
  const scoutPw = await bcrypt.hash('scout1234', 10)
  for (let i = 1; i <= 5; i++) {
    const sc = await prisma.scout.upsert({
      where: { scoutCode: `SC100${i}` },
      update: {},
      create: {
        scoutCode: `SC100${i}`,
        firstName: `สมชาย${i}`,
        lastName: `ใจดี`,
        nickname: `น้อง${i}`,
        school: 'วิทยาลัยเทคนิคเชียงใหม่',
        province: 'เชียงใหม่',
        squadId: squad1.id
      }
    })
    const scUser = await prisma.user.upsert({
      where: { username: `scout${i}` },
      update: {},
      create: { username: `scout${i}`, password: scoutPw, role: 'SCOUT', name: `สมชาย${i} ใจดี`, campId: campA.id }
    })
    await prisma.scout.update({ where: { id: sc.id }, data: { userId: scUser.id } })
  }

  console.log('✅ Seed complete!')
  console.log('📋 Test accounts:')
  console.log('  admin / admin1234')
  console.log('  camp_a / camp1234')
  console.log('  leader_1_1 / leader1234')
  console.log('  staff_skill / staff1234')
  console.log('  scout1 / scout1234')

  // สร้างตารางกิจกรรม
  console.log('📅 Creating schedules...')
  
  // กำหนดวันที่สำหรับตารางกิจกรรม
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const schedules = [
    // วันนี้
    {
      activityId: 'act-1', // ทักษะลูกเสือ
      campId: campA.id,
      squadId: squad1.id,
      date: today,
      slot: 'MORNING'
    },
    {
      activityId: 'act-2', // ผจญภัย
      campId: campA.id,
      squadId: squad1.id,
      date: today,
      slot: 'AFTERNOON'
    },
    {
      activityId: 'act-7', // พิธีเปิด
      campId: campA.id,
      squadId: null, // ทุกหมู่ในค่าย
      date: today,
      slot: 'EVENING'
    },
    // พรุ่งนี้
    {
      activityId: 'act-3', // เดินทางไกล
      campId: campA.id,
      squadId: squad1.id,
      date: tomorrow,
      slot: 'MORNING'
    },
    {
      activityId: 'act-4', // CPR & AED
      campId: campA.id,
      squadId: squad1.id,
      date: tomorrow,
      slot: 'AFTERNOON'
    },
    {
      activityId: 'act-9', // Camp Fire
      campId: campA.id,
      squadId: null, // ทุกหมู่ในค่าย
      date: tomorrow,
      slot: 'EVENING'
    }
  ]

  for (const schedule of schedules) {
    await prisma.schedule.upsert({
      where: {
        activityId_campId_date_slot: {
          activityId: schedule.activityId,
          campId: schedule.campId,
          date: schedule.date,
          slot: schedule.slot
        }
      },
      update: {},
      create: schedule
    })
  }
  
  console.log('📅 Schedules created!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
