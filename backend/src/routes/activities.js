import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { createError } from '../middleware/errorHandler.js'

const router = Router()
router.use(authenticate)

// GET /api/activities
router.get('/', async (req, res) => {
  const activities = await prisma.activity.findMany({
    include: {
      staff: { select: { id: true, name: true } },
      _count: { select: { attendances: true, schedules: true } }
    },
    orderBy: { type: 'asc' }
  })
  res.json(activities)
})

// ✅ GET /api/activities/by-camp/:campId
// ดึงเฉพาะกิจกรรมที่มี Schedule อยู่ใน camp นั้น (ไม่นับ activity ที่ยังไม่ถูก schedule)
router.get('/by-camp/:campId', async (req, res) => {
  const { campId } = req.params

  // หา activityId ที่มี Schedule ใน camp นี้ (distinct)
  const schedules = await prisma.schedule.findMany({
    where: { campId },
    select: { activityId: true },
    distinct: ['activityId']
  })

  const activityIds = schedules.map(s => s.activityId)

  const activities = await prisma.activity.findMany({
    where: { id: { in: activityIds } },
    select: { id: true, name: true, type: true }
  })

  res.json(activities)
})

// GET /api/activities/:id
router.get('/:id', async (req, res) => {
  const activity = await prisma.activity.findUnique({
    where: { id: req.params.id },
    include: {
      staff: { select: { id: true, name: true } },
      attendances: { include: { scout: true } }
    }
  })
  if (!activity) throw createError(404, 'ไม่พบกิจกรรม')
  res.json(activity)
})

// POST /api/activities - Admin เท่านั้น
router.post('/', requireRole('ADMIN'), async (req, res) => {
  const { name, type, description, staffId } = req.body
  const staffIdOrNull = staffId || null

  if (staffIdOrNull) {
    await prisma.activity.updateMany({
      where: { staffId: staffIdOrNull },
      data: { staffId: null }
    })
  }

  const activity = await prisma.activity.create({
    data: { name, type, description, staffId: staffIdOrNull }
  })
  res.status(201).json(activity)
})

// PATCH /api/activities/:id
router.patch('/:id', requireRole('ADMIN'), async (req, res) => {
  const { name, type, description, staffId } = req.body
  const staffIdOrNull = staffId || null

  if (staffIdOrNull) {
    await prisma.activity.updateMany({
      where: { staffId: staffIdOrNull, NOT: { id: req.params.id } },
      data: { staffId: null }
    })
  }
  const activity = await prisma.activity.update({
    where: { id: req.params.id },
    data: { name, type, description, staffId: staffIdOrNull }
  })
  res.json(activity)
})

// DELETE /api/activities/:id
router.delete('/:id', requireRole('ADMIN'), async (req, res) => {
  const activityId = req.params.id

  const schedules = await prisma.schedule.count({ where: { activityId } })
  const attendances = await prisma.attendance.count({ where: { activityId } })

  if (schedules > 0) await prisma.schedule.deleteMany({ where: { activityId } })
  if (attendances > 0) await prisma.attendance.deleteMany({ where: { activityId } })

  await prisma.activity.delete({ where: { id: activityId } })

  res.json({ message: 'ลบกิจกรรมสำเร็จ', deleted: { schedules, attendances } })
})

export default router