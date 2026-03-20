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
  const staff2 = await prisma.user.upsert({
    where: { username: 'staff2' },
    update: {},
    create: { username: 'staff2', password: staffPw, role: 'STAFF', name: 'เจ้าหน้าที่ 2' }
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

  // สร้าง Director (ผู้กำกับ)
  const directorPw = await bcrypt.hash('password1234', 10)
  const director1 = await prisma.user.upsert({
    where: { username: 'director1' },
    update: {},
    create: { username: 'director1', password: directorPw, role: 'TROOP_LEADER', name: 'ผู้กำกับ 1', campId: campA.id }
  })
  const director2 = await prisma.user.upsert({
    where: { username: 'director2' },
    update: {},
    create: { username: 'director2', password: directorPw, role: 'TROOP_LEADER', name: 'ผู้กำกับ 2', campId: campA.id }
  })
  const director3 = await prisma.user.upsert({
    where: { username: 'director3' },
    update: {},
    create: { username: 'director3', password: directorPw, role: 'TROOP_LEADER', name: 'ผู้กำกับ 3', campId: campB.id }
  })
  await prisma.squad.update({ where: { id: 'squad-1' }, data: { leaderId: director1.id } })

  // สร้างลูกเสือตัวอย่าง + user account
  const scoutPw = await bcrypt.hash('scout1234', 10)
  const scoutData = [
    { code: 'SC001', username: 'scout001', firstName: 'สมชาย1', nickname: 'น้อง1' },
    { code: 'SC002', username: 'scout002', firstName: 'สมชาย2', nickname: 'น้อง2' },
    { code: 'SC003', username: 'scout003', firstName: 'สมชาย3', nickname: 'น้อง3' }
  ]
  
  for (const scout of scoutData) {
    const sc = await prisma.scout.upsert({
      where: { scoutCode: scout.code },
      update: {},
      create: {
        scoutCode: scout.code,
        firstName: scout.firstName,
        lastName: 'ใจดี',
        nickname: scout.nickname,
        school: 'วิทยาลัยเทคนิคเชียงใหม่',
        province: 'เชียงใหม่',
        squadId: squad1.id
      }
    })
    const scUser = await prisma.user.upsert({
      where: { username: scout.username },
      update: {},
      create: { username: scout.username, password: scoutPw, role: 'SCOUT', name: `${scout.firstName} ใจดี`, campId: campA.id }
    })
    await prisma.scout.update({ where: { id: sc.id }, data: { userId: scUser.id } })
  }

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

  // สร้างตารางกิจกรรม
  console.log('📅 Creating schedules...')

  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const schedules = [
    { activityId: 'act-1', campId: campA.id, squadId: squad1.id, date: today,    slot: 'MORNING'   },
    { activityId: 'act-2', campId: campA.id, squadId: squad1.id, date: today,    slot: 'AFTERNOON' },
    { activityId: 'act-7', campId: campA.id, squadId: null,      date: today,    slot: 'EVENING'   },
    { activityId: 'act-3', campId: campA.id, squadId: squad1.id, date: tomorrow, slot: 'MORNING'   },
    { activityId: 'act-4', campId: campA.id, squadId: squad1.id, date: tomorrow, slot: 'AFTERNOON' },
    { activityId: 'act-9', campId: campA.id, squadId: null,      date: tomorrow, slot: 'EVENING'   },
  ]

  for (const schedule of schedules) {
    if (schedule.squadId) {
      await prisma.schedule.upsert({
        where: {
          activityId_campId_squadId_date_slot: {
            activityId: schedule.activityId,
            campId: schedule.campId,
            squadId: schedule.squadId,
            date: schedule.date,
            slot: schedule.slot
          }
        },
        update: {},
        create: schedule
      })
    } else {
      await prisma.schedule.createMany({
        data: [schedule],
        skipDuplicates: true
      })
    }
  }

  console.log('📅 Schedules created!')
}

main().catch(console.error).finally(() => prisma.$disconnect())