import { Router } from 'express'

import prisma from '../lib/prisma.js'

import { authenticate, requireRole } from '../middleware/auth.js'

import { createError } from '../middleware/errorHandler.js'

import { logAudit } from '../lib/audit.js'



const router = Router()

router.use(authenticate, requireRole('TROOP_LEADER'))



// GET /api/squad-leader/profile

router.get('/profile', async (req, res) => {

  const user = await prisma.user.findUnique({

    where: { id: req.user.id },

    select: {

      id: true,

      username: true,

      name: true,

      firstName: true,

      lastName: true,

      prefix: true,

      phone: true,

      email: true,

      school: true,

      province: true,

      role: true,

      leadingSquads: {  // ✅ เปลี่ยนจาก leadingSquad

        include: { troop: { include: { camp: true } } }

      }

    }

  })

  if (!user) throw createError(404, 'ไม่พบข้อมูลผู้ใช้')

  res.json(user)

})



// PATCH /api/squad-leader/profile

router.patch('/profile', async (req, res) => {

  const { firstName, lastName, prefix, phone, email, school } = req.body

  const updated = await prisma.user.update({

    where: { id: req.user.id },

    data: {

      firstName: firstName || undefined,

      lastName: lastName || undefined,

      name: firstName && lastName ? `${firstName} ${lastName}` : undefined,

      prefix: prefix || undefined,

      phone: phone || undefined,

      email: email || undefined,

      school: school || undefined,

    },

    select: {

      id: true, username: true, name: true,

      firstName: true, lastName: true, prefix: true,

      phone: true, email: true, school: true, province: true, role: true,

      leadingSquads: {  // ✅ เปลี่ยนจาก leadingSquad

        include: { troop: { include: { camp: true } } }

      }

    }

  })

  res.json(updated)

})



// GET /api/squad-leader/debug

router.get('/debug', async (req, res) => {

  res.json({

    message: 'Debug endpoint ทำงานได้',

    time: new Date(),

    hint: 'ตอนนี้ endpoint ทำงานโดยไม่ต้อง login'

  })

})



// GET /api/squad-leader/my-squad

router.get('/my-squad', async (req, res) => {

  console.log('Looking for squad with leaders:', req.user.id)



  // ✅ เปลี่ยนจาก findUnique where leaderId เป็น findFirst where leaders.some

  const squad = await prisma.squad.findFirst({

    where: {

      leaders: { some: { id: req.user.id } }

    },

    include: {

      troop: { include: { camp: true } },

      leaders: true,

      scouts: {

        include: {

          attendances: { include: { activity: true } }

        }

      }

    }

  })

  console.log('Squad found:', squad?.id, '| scouts count:', squad?.scouts?.length)



  res.json(squad || null)

})



// GET /api/squad-leader/available-scouts

router.get('/available-scouts', async (req, res) => {

  // ✅ เปลี่ยนจาก findUnique where leaderId

  const squad = await prisma.squad.findFirst({

    where: {

      leaders: { some: { id: req.user.id } }

    },

    include: {

      scouts: { take: 1 },

      troop: { include: { camp: true } }

    }

  })



  if (!squad) {

    return res.json({

      scouts: [],

      currentCount: 0,

      maxCount: 8,

      canAdd: false,

      school: null

    })

  }



  const squadSchool = squad.scouts.length > 0 ? squad.scouts[0].school : null

  const currentCount = await prisma.scout.count({ where: { squadId: squad.id } })



  const availableScouts = await prisma.scout.findMany({

    where: {

      squadId: null,

      ...(squadSchool ? { school: squadSchool } : {})

    },

    select: {

      id: true, firstName: true, lastName: true,

      scoutCode: true, school: true, province: true

    },

    orderBy: { firstName: 'asc' }

  })



  res.json({

    scouts: availableScouts,

    currentCount,

    maxCount: 8,

    canAdd: currentCount < 8,

    school: squadSchool

  })

})



// POST /api/squad-leader/add-scout

router.post('/add-scout', async (req, res) => {

  const { scoutId } = req.body



  // ✅ เปลี่ยนจาก findUnique where leaderId

  const squad = await prisma.squad.findFirst({

    where: { leaders: { some: { id: req.user.id } } }

  })

  if (!squad) throw createError(404, 'ไม่พบข้อมูลหมู่ของคุณ')



  const currentCount = await prisma.scout.count({ where: { squadId: squad.id } })

  if (currentCount >= 8) throw createError(400, 'หมู่เต็ม (8 คนแล้ว)')



  const scout = await prisma.scout.findUnique({ where: { id: scoutId } })

  if (!scout) throw createError(404, 'ไม่พบลูกเสือ')

  if (scout.squadId) throw createError(400, 'ลูกเสือคนนี้มีหมู่แล้ว')



  const squadWithScouts = await prisma.squad.findUnique({

    where: { id: squad.id },

    include: { scouts: { take: 1 } }

  })

  const squadSchool = squadWithScouts.scouts.length > 0 ? squadWithScouts.scouts[0].school : null

  if (squadSchool && scout.school !== squadSchool) {

    throw createError(400, 'ลูกเสือต้องมาจากสถานศึกษาเดียวกัน')

  }



  const updated = await prisma.scout.update({

    where: { id: scoutId },

    data: { squadId: squad.id }

  })



  await logAudit({

    userId: req.user.id,

    action: 'ADD_SCOUT_TO_SQUAD',

    target: scoutId,

    after: { squadId: squad.id }

  })



  res.json(updated)

})



// PATCH /api/squad-leader/scouts/:id

router.patch('/scouts/:id', async (req, res) => {

  const { id } = req.params

  const { firstName, lastName, nickname, birthDate, school, province, phone, email } = req.body



  // ✅ เปลี่ยนจาก findUnique where leaderId

  const squad = await prisma.squad.findFirst({

    where: { leaders: { some: { id: req.user.id } } }

  })

  if (!squad) throw createError(404, 'ไม่พบข้อมูลหมู่ของคุณ')



  const existing = await prisma.scout.findFirst({ where: { id, squadId: squad.id } })

  if (!existing) throw createError(404, 'ไม่พบลูกเสือหรือไม่มีสิทธิ์')



  const updated = await prisma.scout.update({

    where: { id },

    data: {

      firstName, lastName, nickname,

      birthDate: birthDate ? new Date(birthDate) : undefined,

      school, province, phone, email

    }

  })



  await logAudit({

    userId: req.user.id,

    action: 'UPDATE_SCOUT_IN_SQUAD',

    target: id,

    before: { firstName: existing.firstName, lastName: existing.lastName },

    after: { firstName, lastName }

  })



  res.json(updated)

})



// DELETE /api/squad-leader/scouts/:id

router.delete('/scouts/:id', async (req, res) => {

  const { id } = req.params



  // ✅ เปลี่ยนจาก findUnique where leaderId

  const squad = await prisma.squad.findFirst({

    where: { leaders: { some: { id: req.user.id } } }

  })

  if (!squad) throw createError(404, 'ไม่พบข้อมูลหมู่ของคุณ')



  const scout = await prisma.scout.findFirst({ where: { id, squadId: squad.id } })

  if (!scout) throw createError(404, 'ไม่พบลูกเสือหรือไม่มีสิทธิ์')



  await prisma.scout.update({

    where: { id },

    data: { squadId: null }

  })



  await logAudit({

    userId: req.user.id,

    action: 'REMOVE_SCOUT_FROM_SQUAD',

    target: id,

    before: { squadId: squad.id },

    after: { squadId: null }

  })



  res.json({ message: 'นำลูกเสือออกจากหมู่สำเร็จ' })

})



export default router