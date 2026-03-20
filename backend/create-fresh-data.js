import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🗑️ Clearing existing test data...')
  
  // ลบข้อมูลเก่าทั้งหมด
  await prisma.attendance.deleteMany({})
  await prisma.schedule.deleteMany({})
  await prisma.scout.deleteMany({})
  await prisma.squad.deleteMany({})
  await prisma.troop.deleteMany({})
  await prisma.user.deleteMany({
    where: {
      OR: [
        { username: { contains: 'test' } },
        { username: { contains: 'scout' } },
        { username: { contains: 'leader' } },
        { username: { contains: '2026' } }
      ]
    }
  })

  console.log('🌱 Creating complete test data...')

  // สร้างค่าย
  const camp = await prisma.camp.create({
    data: {
      name: 'ค่ายลูกเสือโรงเรียน'
    }
  })

  // สร้างกอง
  const troop = await prisma.troop.create({
    data: {
      name: 'กองวัดใหญ่',
      number: 1,
      campId: camp.id
    }
  })

  // สร้างหมู่
  const squad = await prisma.squad.create({
    data: {
      name: 'หมู่สุภาพ',
      number: 1,
      troopId: troop.id
    }
  })

  // สร้างผู้กำกับหมู่
  const hashedPassword = await bcrypt.hash('123456', 10)
  const leader = await prisma.user.create({
    data: {
      username: 'squadleader2026',
      password: hashedPassword,
      role: 'TROOP_LEADER',
      name: 'สมศรี ใจดี',
      campId: camp.id
    }
  })

  // กำหนดหมู่ให้ผู้กำกับ
  await prisma.squad.update({
    where: { id: squad.id },
    data: { leaderId: leader.id }
  })

  // สร้างลูกเสือ 5 คน
  const scouts = []
  for (let i = 1; i <= 5; i++) {
    const scoutUser = await prisma.user.create({
      data: {
        username: `scout2026${i}`,
        password: hashedPassword,
        role: 'SCOUT',
        name: `ลูกเสือคนที่ ${i}`,
        campId: camp.id
      }
    })

    const scout = await prisma.scout.create({
      data: {
        scoutCode: `SC2026${i}`,
        firstName: `นาย${i}`,
        lastName: 'สุข',
        nickname: `ลูกเสือ${i}`,
        school: 'โรงเรียนวัดใหญ่',
        province: 'กรุงเทพมหานคร',
        squadId: squad.id,
        userId: scoutUser.id
      }
    })
    scouts.push(scout)
  }

  // สร้างกิจกรรม
  const activities = await prisma.activity.findMany()
  if (activities.length === 0) {
    await prisma.activity.createMany({
      data: [
        { name: 'กิจกรรมหลัก', type: 'MAIN' },
        { name: 'กิจกรรมพิเศษ', type: 'SPECIAL' },
        { name: 'กิจกรรมว่าง', type: 'FREE' }
      ]
    })
  }

  console.log('✅ Complete test data created successfully!')
  console.log('📝 Login credentials:')
  console.log('   Leader: squadleader2026 / 123456')
  console.log('   Scouts: scout20261-scout20265 / 123456')
  console.log(`   Camp: ${camp.name}`)
  console.log(`   Troop: ${troop.name}`)
  console.log(`   Squad: ${squad.name}`)
  console.log(`   Scouts in squad: ${scouts.length}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
