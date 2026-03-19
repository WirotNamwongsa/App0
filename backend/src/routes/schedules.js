import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

// GET /api/schedules?campId=&date=
router.get('/', async (req, res) => {
  const { campId, date, activityId } = req.query
  const where = {}
  if (campId) where.campId = campId
  if (activityId) where.activityId = activityId
  if (date) {
    const d = new Date(date)
    const next = new Date(d); next.setDate(next.getDate() + 1)
    where.date = { gte: d, lt: next }
  }

  const schedules = await prisma.schedule.findMany({
    where,
    include: {
      activity: true,
      squad: { include: { troop: true } },
      camp: true
    },
    orderBy: [{ date: 'asc' }, { slot: 'asc' }]
  })
  res.json(schedules)
})

// POST /api/schedules - Camp Manager
router.post('/', requireRole('ADMIN', 'CAMP_MANAGER'), async (req, res) => {
  const { activityId, campId, squadIds, date, slot } = req.body
  const targetCampId = req.user.role === 'CAMP_MANAGER' ? req.user.campId : campId
  
  // ตรวจสอบว่ามีข้อมูลลูกเสือครบในค่ายย่อยหรือไม่
  const campScoutsCount = await prisma.scout.count({
    where: {
      squad: {
        troop: { campId: targetCampId }
      }
    }
  })
  
  if (campScoutsCount === 0) {
    return res.status(400).json({ 
      message: 'ไม่สามารถสร้างตารางกิจกรรมได้ เนื่องจากยังไม่มีข้อมูลลูกเสือในค่ายย่อยนี้' 
    })
  }
  
  if (squadIds && squadIds.length > 0) {
    const schedules = await prisma.schedule.createMany({
      data: squadIds.map(squadId => ({ activityId, campId: targetCampId, squadId, date: new Date(date), slot })),
      skipDuplicates: true
    })
    res.status(201).json({ count: schedules.count })
  } else {
    const schedule = await prisma.schedule.create({
      data: { activityId, campId: targetCampId, date: new Date(date), slot }
    })
    res.status(201).json(schedule)
  }
})

// DELETE /api/schedules/:id
router.delete('/:id', requireRole('ADMIN', 'CAMP_MANAGER'), async (req, res) => {
  await prisma.schedule.delete({ where: { id: req.params.id } })
  res.json({ message: 'ลบตารางสำเร็จ' })
})

export default router
