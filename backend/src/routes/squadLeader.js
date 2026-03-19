import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { createError } from '../middleware/errorHandler.js'
import { logAudit } from '../lib/audit.js'

const router = Router()
router.use(authenticate, requireRole('TROOP_LEADER'))

// GET /api/squad-leader/debug - ตรวจสอบข้อมูลสำหรับ debug
router.get('/debug', async (req, res) => {
  // ทดสอบโดยไม่ต้องมี token ก่อน
  res.json({
    message: 'Debug endpoint ทำงานได้',
    time: new Date(),
    hint: 'ตอนนี้ endpoint ทำงานโดยไม่ต้อง login'
  });
})

// GET /api/squad-leader/my-squad - ดูข้อมูลหมู่ของตัวเอง
router.get('/my-squad', async (req, res) => {
  const squad = await prisma.squad.findUnique({
    where: { leaderId: req.user.id },
    include: {
      troop: { include: { camp: true } },
      scouts: {
        include: {
          attendances: { include: { activity: true } }
        }
      }
    }
  })

  if (!squad) throw createError(404, 'ไม่พบข้อมูลหมู่ของคุณ')

  res.json(squad)
})

// GET /api/squad-leader/available-scouts - ดูรายชื่อลูกเสือที่ยังไม่มีหมู่และมาจากสถานศึกษาเดียวกัน
router.get('/available-scouts', async (req, res) => {
  const squad = await prisma.squad.findUnique({
    where: { leaderId: req.user.id },
    include: { 
      scouts: { take: 1 }, // เอาแค่ 1 คนเพื่อดูสถานศึกษา
      troop: { include: { camp: true } }
    }
  })

  if (!squad) throw createError(404, 'ไม่พบข้อมูลหมู่ของคุณ')

  // หาสถานศึกษาของหมู่
  const squadSchool = squad.scouts.length > 0 ? squad.scouts[0].school : null

  // ดูจำนวนสมาชิกปัจจุบัน
  const currentCount = await prisma.scout.count({ where: { squadId: squad.id } })

  // หาลูกเสือที่ยังไม่มีหมู่และมาจากสถานศึกษาเดียวกัน
  const availableScouts = await prisma.scout.findMany({
    where: {
      squadId: null,
      ...(squadSchool ? { school: squadSchool } : {})
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      scoutCode: true,
      school: true,
      province: true
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

// POST /api/squad-leader/add-scout - เพิ่มลูกเสือเข้าหมู่
router.post('/add-scout', async (req, res) => {
  const { scoutId } = req.body

  const squad = await prisma.squad.findUnique({
    where: { leaderId: req.user.id }
  })

  if (!squad) throw createError(404, 'ไม่พบข้อมูลหมู่ของคุณ')

  // ตรวจสอบว่าหมู่เต็มหรือยัง
  const currentCount = await prisma.scout.count({ where: { squadId: squad.id } })
  if (currentCount >= 8) {
    throw createError(400, 'หมู่เต็ม (8 คนแล้ว)')
  }

  // ตรวจสอบว่าลูกเสือมีอยู่จริงและยังไม่มีหมู่
  const scout = await prisma.scout.findUnique({
    where: { id: scoutId }
  })

  if (!scout) {
    throw createError(404, 'ไม่พบลูกเสือ')
  }

  if (scout.squadId) {
    throw createError(400, 'ลูกเสือคนนี้มีหมู่แล้ว')
  }

  // ตรวจสอบว่ามาจากสถานศึกษาเดียวกัน
  const squadWithScouts = await prisma.squad.findUnique({
    where: { id: squad.id },
    include: { scouts: { take: 1 } }
  })

  const squadSchool = squadWithScouts.scouts.length > 0 ? squadWithScouts.scouts[0].school : null
  
  if (squadSchool && scout.school !== squadSchool) {
    throw createError(400, 'ลูกเสือต้องมาจากสถานศึกษาเดียวกัน')
  }

  // เพิ่มลูกเสือเข้าหมู่
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

// PATCH /api/squad-leader/scouts/:id - แก้ไขข้อมูลส่วนตัวลูกเสือในหมู่
router.patch('/scouts/:id', async (req, res) => {
  const { id } = req.body
  const { firstName, lastName, nickname, birthDate, school, province, phone, email } = req.body

  // ตรวจสอบว่าลูกเสืออยู่ในหมู่ของผู้นำหรือไม่
  const squad = await prisma.squad.findUnique({
    where: { leaderId: req.user.id }
  })

  if (!squad) throw createError(404, 'ไม่พบข้อมูลหมู่ของคุณ')

  const existing = await prisma.scout.findFirst({ where: { id, squadId: squad.id } })
  if (!existing) throw createError(404, 'ไม่พบลูกเสือหรือไม่มีสิทธิ์')

  const updated = await prisma.scout.update({
    where: { id },
    data: { firstName, lastName, nickname, birthDate: birthDate ? new Date(birthDate) : undefined, school, province, phone, email }
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

// DELETE /api/squad-leader/scouts/:id - นำลูกเสือออกจากหมู่
router.delete('/scouts/:id', async (req, res) => {
  const { id } = req.params

  // ตรวจสอบว่าลูกเสืออยู่ในหมู่ของผู้นำหรือไม่
  const squad = await prisma.squad.findUnique({
    where: { leaderId: req.user.id }
  })

  if (!squad) throw createError(404, 'ไม่พบข้อมูลหมู่ของคุณ')

  const scout = await prisma.scout.findFirst({ where: { id, squadId: squad.id } })
  if (!scout) throw createError(404, 'ไม่พบลูกเสือหรือไม่มีสิทธิ์')

  // นำลูกเสือออกจากหมู่ (ไม่ลบข้อมูล, เพียงตัดการเชื่อมโยง)
  const updated = await prisma.scout.update({
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
