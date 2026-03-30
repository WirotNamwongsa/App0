import { Router } from 'express'

import prisma from '../lib/prisma.js'

import { authenticate, requireRole } from '../middleware/auth.js'

import { createError } from '../middleware/errorHandler.js'

import { logAudit } from '../lib/audit.js'



const router = Router()

router.use(authenticate)



// GET /api/camps

router.get('/', requireRole('ADMIN'), async (req, res) => {

  const camps = await prisma.camp.findMany({

    include: {

      troops: {

        include: {

          squads: {

            include: {

              _count: { select: { scouts: true } }

            }

          }

        }

      }

    }

  })

  res.json(camps)

})



// GET /api/camps/my

router.get('/my', requireRole('ADMIN', 'CAMP_MANAGER', 'LEADER', 'TROOP_LEADER'), async (req, res) => {

  const campId = req.user.role === 'ADMIN' ? req.query.campId : req.user.campId

  if (!campId) throw createError(400, 'ไม่พบ campId')



  const camp = await prisma.camp.findUnique({

    where: { id: campId },

    include: {

      troops: {

        include: {

          squads: {
            select: {  
              id: true,
              name: true,
              number: true,
              troopId: true,
              gender: true,
              leaders: { select: { id: true, name: true } },
              scouts: { select: { school: true }, take: 1 },
              _count: { select: { scouts: true } }
            }
          }

        }

      }

    }

  })



  if (!camp) throw createError(404, 'ไม่พบค่าย')

  res.json(camp)

})



// POST /api/camps

router.post('/', requireRole('ADMIN'), async (req, res) => {

  const { name } = req.body



  const camp = await prisma.camp.create({ data: { name } })



  const troop = await prisma.troop.create({

    data: { name: `กองที่ 1`, number: 1, campId: camp.id }

  })



  const squads = []

  for (let i = 1; i <= 4; i++) {

    const squad = await prisma.squad.create({

      data: { name: `หมู่ที่ ${i}`, number: i, troopId: troop.id }

    })

    squads.push(squad)

  }



  await logAudit({

    userId: req.user.id,

    action: 'CREATE_CAMP_WITH_STRUCTURE',

    target: camp.id,

    after: { camp, troop, squads }

  })



  res.status(201).json({ camp, troop, squads })

})



// POST /api/camps/:campId/troops

router.post('/:campId/troops', requireRole('ADMIN', 'CAMP_MANAGER'), async (req, res) => {

  const { name, number } = req.body





  const troop = await prisma.troop.create({

    data: { name, number: parseInt(number), campId: req.params.campId }

  })



  const squads = []

  for (let i = 1; i <= 4; i++) {

    const squad = await prisma.squad.create({

      data: { name: `หมู่ที่ ${i}`, number: i, troopId: troop.id }

    })

    squads.push(squad)

  }



  await logAudit({

    userId: req.user.id,

    action: 'CREATE_TROOP_WITH_SQUADS',

    target: troop.id,

    after: { troop, squads }

  })



  res.status(201).json({ troop, squads })

})



// POST /api/camps/:campId/troops/:troopId/squads

router.post('/:campId/troops/:troopId/squads', requireRole('ADMIN', 'CAMP_MANAGER'), async (req, res) => {

  const { name, number, leaderId } = req.body



  const squad = await prisma.squad.create({

    data: { name, number: parseInt(number), troopId: req.params.troopId }

  })



  if (leaderId) {

    await prisma.squad.update({

      where: { id: squad.id },

      data: { leaderId }

    })

  }



  await logAudit({ userId: req.user.id, action: 'CREATE_SQUAD', target: squad.id, after: squad })

  res.status(201).json(squad)

})



// PATCH /api/camps/:campId

router.patch('/:campId', requireRole('ADMIN', 'CAMP_MANAGER'), async (req, res) => {

  const { name } = req.body



  const camp = await prisma.camp.update({

    where: { id: req.params.campId },

    data: { name }

  })



  await logAudit({ userId: req.user.id, action: 'UPDATE_CAMP', target: camp.id, after: camp })

  res.json(camp)

})



// PATCH /api/camps/:campId/squads/:squadId

router.patch('/:campId/squads/:squadId', requireRole('ADMIN', 'CAMP_MANAGER'), async (req, res) => {

  const { name, leaderId } = req.body



  const squad = await prisma.squad.update({

    where: { id: req.params.squadId },

    data: {

      name,

      ...(leaderId ? { leaderId } : {})

    }

  })



  await logAudit({ userId: req.user.id, action: 'UPDATE_SQUAD', target: squad.id, after: squad })

  res.json(squad)

})



// PATCH /api/camps/:campId/troops/:troopId

router.patch('/:campId/troops/:troopId', requireRole('ADMIN', 'CAMP_MANAGER'), async (req, res) => {

  const { name } = req.body


  const troop = await prisma.troop.update({

    where: { id: req.params.troopId },

    data: { name }

  })


  await logAudit({ userId: req.user.id, action: 'UPDATE_TROOP', target: troop.id, after: troop })

  res.json(troop)

})



// PATCH /api/camps/:campId/troops/:troopId/max-squads

router.patch('/:campId/troops/:troopId/max-squads', requireRole('ADMIN', 'CAMP_MANAGER'), async (req, res) => {

  const { maxSquads } = req.body


  const troop = await prisma.troop.update({

    where: { id: req.params.troopId },

    data: { maxSquads: parseInt(maxSquads) }

  })


  await logAudit({ userId: req.user.id, action: 'UPDATE_TROOP_MAX_SQUADS', target: troop.id, after: troop })

  res.json(troop)

})



// DELETE /api/camps/:campId/troops/:troopId

router.delete('/:campId/troops/:troopId', requireRole('ADMIN', 'CAMP_MANAGER'), async (req, res) => {

  const troop = await prisma.troop.findUnique({

    where: { id: req.params.troopId },

    include: { squads: true }

  })



  if (!troop) throw createError(404, 'ไม่พบกอง')



  await prisma.squad.deleteMany({ where: { troopId: req.params.troopId } })

  await prisma.troop.delete({ where: { id: req.params.troopId } })



  await logAudit({

    userId: req.user.id,

    action: 'DELETE_TROOP_WITH_SQUADS',

    target: req.params.troopId,

    before: troop

  })



  res.json({ message: 'ลบกองและหมู่ทั้งหมดสำเร็จ' })

})



// DELETE /api/camps/:campId

router.delete('/:campId', requireRole('ADMIN'), async (req, res) => {

  const camp = await prisma.camp.findUnique({

    where: { id: req.params.campId },

    include: { troops: { include: { squads: true } } }

  })



  if (!camp) throw createError(404, 'ไม่พบค่าย')


   await prisma.activityGroup.deleteMany({ where: { campId: req.params.campId } })
   
  await prisma.schedule.deleteMany({ where: { campId: req.params.campId } })

  await prisma.squad.deleteMany({ where: { troop: { campId: req.params.campId } } })

  await prisma.troop.deleteMany({ where: { campId: req.params.campId } })

  await prisma.camp.delete({ where: { id: req.params.campId } })



  await logAudit({

    userId: req.user.id,

    action: 'DELETE_CAMP_WITH_STRUCTURE',

    target: req.params.campId,

    before: camp

  })



  res.json({ message: 'ลบค่ายและกอง/หมู่ทั้งหมดสำเร็จ' })

})



// DELETE /api/camps/:campId/squads/:squadId

router.delete('/:campId/squads/:squadId', requireRole('ADMIN', 'CAMP_MANAGER'), async (req, res) => {

  await prisma.squad.delete({ where: { id: req.params.squadId } })

  res.json({ message: 'ลบหมู่สำเร็จ' })

})



// PATCH /api/camps/scouts/:scoutId/move

router.patch('/scouts/:scoutId/move', requireRole('ADMIN', 'CAMP_MANAGER'), async (req, res) => {

  const { squadId } = req.body

  const scout = await prisma.scout.update({

    where: { id: req.params.scoutId },

    data: { squadId: squadId || null }

  })

  await logAudit({ userId: req.user.id, action: 'MOVE_SCOUT', target: scout.id, after: scout })

  res.json(scout)

})



// GET /api/camps/:campId/scouts

router.get('/:campId/scouts', requireRole('ADMIN', 'CAMP_MANAGER'), async (req, res) => {

  const scouts = await prisma.scout.findMany({

    where: { squad: { troop: { campId: req.params.campId } } },

    include: { squad: { include: { troop: true } } }

  })

  res.json(scouts)

})



// GET /api/camps/:campId/squads

router.get('/:campId/squads', requireRole('ADMIN', 'CAMP_MANAGER'), async (req, res) => {

  const squads = await prisma.squad.findMany({

    where: { troop: { campId: req.params.campId } },

    include: {

      troop: { select: { id: true, name: true, number: true } },

      leaders: { select: { id: true, name: true } },

      scouts: {

        select: { school: true },

        take: 1

      },

      _count: { select: { scouts: true } }

    },

    orderBy: [

      { troop: { number: 'asc' } },

      { number: 'asc' }

    ]

  })

  res.json(squads)

})





// PATCH /api/camps/scouts/:scoutId/move

router.patch('/scouts/:scoutId/move', requireRole('ADMIN', 'CAMP_MANAGER'), async (req, res) => {

  const { squadId } = req.body



  // ดึงข้อมูล scout ที่จะย้าย

  const scout = await prisma.scout.findUnique({

    where: { id: req.params.scoutId }

  })

  if (!scout) throw createError(404, 'ไม่พบลูกเสือ')



  // ถ้ามี squadId และ scout มี gender → เช็คว่าหมู่ปลายทางมีเพศผสมไหม

  if (squadId && scout.gender) {

    const scoutsInSquad = await prisma.scout.findMany({

      where: { squadId, gender: { not: null } },

      select: { gender: true },

      take: 1

    })



    if (scoutsInSquad.length > 0 && scoutsInSquad[0].gender !== scout.gender) {

      const genderLabel = scout.gender === 'ชาย' ? 'หญิง' : 'ชาย'

      throw createError(400, `หมู่นี้มีลูกเสือ${genderLabel}อยู่แล้ว ไม่สามารถจัดลูกเสือ${scout.gender}เข้าได้`)

    }

  }



  const updated = await prisma.scout.update({

    where: { id: req.params.scoutId },

    data: { squadId: squadId || null }

  })



  await logAudit({ userId: req.user.id, action: 'MOVE_SCOUT', target: updated.id, after: updated })

  res.json(updated)

})





// POST /api/camps/:campId/organize-troops

router.post('/:campId/organize-troops', requireRole('ADMIN', 'CAMP_MANAGER'), async (req, res) => {
  const { troops } = req.body
  const { campId } = req.params

  try {
    // ดึงข้อมูล squads ปัจจุบันพร้อม scoutIds ทั้งหมด
    const existingSquads = await prisma.squad.findMany({
      where: { troop: { campId } },
      include: {
        scouts: { select: { id: true } }
      }
    })

    // เก็บ mapping squadId → scoutIds ไว้ก่อนลบ
    const squadScoutMapping = {}
    existingSquads.forEach(squad => {
      squadScoutMapping[squad.id] = squad.scouts.map(s => s.id)
    })

    // ลบ squads เก่าและ troops เก่า
    await prisma.squad.deleteMany({
      where: { troop: { campId } }
    })
    await prisma.troop.deleteMany({
      where: { campId }
    })

    // สร้าง troops และ squads ใหม่
    const createdTroops = []
    for (const troopData of troops) {
      const troop = await prisma.troop.create({
        data: {
          campId,
          name: `กอง ${troopData.number}`,
          number: troopData.number
        }
      })

      const createdSquads = []
      for (const squadData of troopData.squads) {
        const squad = await prisma.squad.create({
          data: {
            name: squadData.name,
            number: parseInt(squadData.name.match(/\d+/)?.[0] || 1),
            troopId: troop.id
          }
        })

        // ย้าย scouts เข้า squad ใหม่โดยใช้ scoutIds ที่เก็บไว้
        const scoutIds = squadScoutMapping[squadData.id] || []
        if (scoutIds.length > 0) {
          await prisma.scout.updateMany({
            where: { id: { in: scoutIds } },
            data: { squadId: squad.id }
          })
        }

        createdSquads.push({ ...squad, scoutIds })
      }

      createdTroops.push({ ...troop, squads: createdSquads })
    }

    await logAudit({
      userId: req.user.id,
      action: 'ORGANIZE_TROOPS',
      target: campId,
      after: JSON.stringify(troops)
    })

    res.json({ troops: createdTroops })
  } catch (error) {
    console.error('Organize troops error:', error)
    res.status(500).json({
      message: 'จัดกองไม่สำเร็จ กรุณาลองใหม่',
      error: error.message
    })
  }
})

router.post('/:campId/organize-squads', requireRole('ADMIN', 'CAMP_MANAGER'), async (req, res) => {
  const { newSquads } = req.body
  const { campId } = req.params

  try {
    const createdSquads = []

    const troops = await prisma.troop.findMany({
      where: { campId },
      include: {
        squads: {
          include: {
            _count: { select: { scouts: true } }
          }
        }
      },
      orderBy: { number: 'asc' }
    })

    // ✅ รวม squads ว่างทั้งหมด (ไม่มีลูกเสือ) เรียงตามลำดับ
    const emptySquads = troops
      .flatMap(t => t.squads.map(sq => ({ ...sq, troop: t })))
      .filter(sq => sq._count.scouts === 0)

    for (const squadData of newSquads) {
      // ✅ ลองใช้หมู่ว่างที่มีอยู่ก่อน
      if (emptySquads.length > 0) {
        const emptySquad = emptySquads.shift() // เอาหมู่ว่างออกมาใช้

        if (squadData.scoutIds?.length > 0) {
          await prisma.scout.updateMany({
            where: { id: { in: squadData.scoutIds } },
            data: { squadId: emptySquad.id }
          })
        }

        createdSquads.push(emptySquad)
        continue // ไม่ต้องสร้างหมู่ใหม่
      }

      // ✅ ถ้าไม่มีหมู่ว่าง → หา troop ที่ยังมีที่ว่าง
      let availableTroop = troops.find(t => {
        const max = t.maxSquads || 4
        return t.squads.length < max
      })

      // ถ้าทุกกองเต็ม → สร้างกองใหม่
      if (!availableTroop) {
        const nextTroopNumber = Math.max(...troops.map(t => t.number || 0), 0) + 1
        availableTroop = await prisma.troop.create({
          data: {
            campId,
            name: `กอง ${nextTroopNumber}`,
            number: nextTroopNumber,
            maxSquads: newSquads.length
          }
        })
        availableTroop.squads = []
        troops.push(availableTroop)
      }

      const nextNumber = Math.max(...availableTroop.squads.map(s => s.number || 0), 0) + 1

      const squad = await prisma.squad.create({
        data: {
          name: `หมู่ ${nextNumber}`,
          number: nextNumber,
          troopId: availableTroop.id
        }
      })

      if (squadData.scoutIds?.length > 0) {
        await prisma.scout.updateMany({
          where: { id: { in: squadData.scoutIds } },
          data: { squadId: squad.id }
        })
      }

      availableTroop.squads.push(squad)
      createdSquads.push(squad)
    }

    await logAudit({
      userId: req.user.id,
      action: 'ORGANIZE_SQUADS',
      target: campId,
      after: { createdSquads }
    })

    res.status(201).json({ squads: createdSquads })
  } catch (error) {
    console.error('Organize squads error:', error)
    res.status(500).json({ message: 'จัดหมู่ไม่สำเร็จ', error: error.message })
  }
})

export default router