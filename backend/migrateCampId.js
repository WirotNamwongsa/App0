import prisma from './src/lib/prisma.js'

async function migrate() {
  const scouts = await prisma.scout.findMany({
    where: { campId: null, squadId: { not: null } },
    include: {
      squad: {
        include: {
          troop: { select: { campId: true } }
        }
      }
    }
  })

  console.log(`พบลูกเสือที่ต้อง migrate: ${scouts.length} คน`)

  for (const scout of scouts) {
    const campId = scout.squad?.troop?.campId
    if (!campId) continue

    await prisma.scout.update({
      where: { id: scout.id },
      data: { campId }
    })
  }

  console.log('migrate สำเร็จ!')
  await prisma.$disconnect()
}

migrate()