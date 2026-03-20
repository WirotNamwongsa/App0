import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Creating test data for Squad Leader...')

  // สร้างค่าย
  const camp = await prisma.camp.create({
    data: {
      name: 'ค่ายทดสอบ'
    }
  })

  // สร้างกอง
  const troop = await prisma.troop.create({
    data: {
      name: 'กองทดสอบ',
      number: 1,
      campId: camp.id
    }
  })

  // สร้างหมู่
  const squad = await prisma.squad.create({
    data: {
      name: 'หมู่ทดสอบ',
      number: 1,
      troopId: troop.id
    }
  })

  // สร้างผู้กำกับหมู่
  const hashedPassword = await bcrypt.hash('123456', 10)
  const leader = await prisma.user.create({
    data: {
      username: 'testleader',
      password: hashedPassword,
      role: 'TROOP_LEADER',
      name: 'ผู้กำกับทดสอบ',
      campId: camp.id
    }
  })

  // กำหนดหมู่ให้ผู้กำกับ
  await prisma.squad.update({
    where: { id: squad.id },
    data: { leaderId: leader.id }
  })

  // สร้างลูกเสือทดสอบ
  const scoutUser = await prisma.user.create({
    data: {
      username: 'testscout',
      password: hashedPassword,
      role: 'SCOUT',
      name: 'ลูกเสือทดสอบ',
      campId: camp.id
    }
  })

  const scout = await prisma.scout.create({
    data: {
      scoutCode: 'SC001',
      firstName: 'สมชาย',
      lastName: 'ใจดี',
      nickname: 'ชาย',
      school: 'โรงเรียนทดสอบ',
      province: 'กรุงเทพมหานคร',
      squadId: squad.id,
      userId: scoutUser.id
    }
  })

  console.log('✅ Test data created successfully!')
  console.log('📝 Login credentials:')
  console.log('   Leader: testleader / 123456')
  console.log('   Scout: testscout / 123456')
  console.log(`   Squad ID: ${squad.id}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
