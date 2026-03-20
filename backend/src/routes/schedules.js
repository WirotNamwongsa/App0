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

  // Group schedules ที่มี activityId + date + slot + campId เดียวกัน → 1 object
  const groupMap = new Map()

  for (const s of schedules) {
    const dateTs = new Date(s.date).getTime()
    const key = `${s.activityId}__${isNaN(dateTs) ? s.date : dateTs}__${s.slot}__${s.campId}`

    if (groupMap.has(key)) {
      const existing = groupMap.get(key)
      if (s.squad) {
        existing.squadIds.push(s.squad.id)
        existing.squads.push(s.squad)
      }
      existing._allIds.push(s.id)
    } else {
      groupMap.set(key, {
        id: s.id,
        _allIds: [s.id],
        activityId: s.activityId,
        activity: s.activity,
        date: s.date,
        slot: s.slot,
        campId: s.campId,
        camp: s.camp,
        squadIds: s.squad ? [s.squad.id] : [],
        squads: s.squad ? [s.squad] : [],
        squad: s.squad,
      })
    }
  }

  const result = [...groupMap.values()]
  console.log('=== SCHEDULE DEBUG ===')
  console.log('Total raw records:', schedules.length)
  console.log('Total grouped:', result.length)
  result.forEach(r => {
    console.log('  activityId:', r.activityId, '| squadIds:', JSON.stringify(r.squadIds))
  })
  res.json(result)
})

// POST /api/schedules
router.post('/', requireRole('ADMIN', 'CAMP_MANAGER', 'LEADER', 'TROOP_LEADER'), async (req, res) => {
  const { activityId, campId, squadIds, date, slot } = req.body
  const targetCampId = req.user.role === 'CAMP_MANAGER' || req.user.role === 'LEADER' || req.user.role === 'TROOP_LEADER' ? req.user.campId : campId

  const campScoutsCount = await prisma.scout.count({
    where: { squad: { troop: { campId: targetCampId } } }
  })

  if (campScoutsCount === 0) {
    return res.status(400).json({
      message: 'ไม่สามารถสร้างตารางกิจกรรมได้ เนื่องจากยังไม่มีข้อมูลลูกเสือในค่ายย่อยนี้'
    })
  }

  if (squadIds && squadIds.length > 0) {
    const created = await prisma.schedule.createMany({
      data: squadIds.map(squadId => ({
        activityId,
        campId: targetCampId,
        squadId,
        date: new Date(date),
        slot,
      })),
      skipDuplicates: true
    })
    res.status(201).json({ count: created.count })
  } else {
    const schedule = await prisma.schedule.create({
      data: {
        activityId,
        campId: targetCampId,
        date: new Date(date),
        slot,
      }
    })
    res.status(201).json(schedule)
  }
})

// PUT /api/schedules/:id  (id = representative id ของ group)
router.put('/:id', requireRole('ADMIN', 'CAMP_MANAGER', 'LEADER', 'TROOP_LEADER'), async (req, res) => {
  try {
    const { id } = req.params
    const { activityId, date, slot, squadIds, campId } = req.body

    // หา schedule ตัวแทนก่อน เพื่อรู้ activityId+date+slot+campId เดิม
    const existing = await prisma.schedule.findUnique({ where: { id } })
    if (!existing) {
      return res.status(404).json({ error: 'Schedule not found' })
    }

    const targetCampId = campId || existing.campId
    const targetActivityId = activityId || existing.activityId
    const targetDate = date ? new Date(date) : existing.date
    const targetSlot = slot || existing.slot

    // ลบ schedule ทั้งหมดที่เป็น group เดียวกัน (activityId+date+slot+campId เดิม)
    await prisma.schedule.deleteMany({
      where: {
        activityId: existing.activityId,
        date: existing.date,
        slot: existing.slot,
        campId: existing.campId,
      }
    })

    // สร้างใหม่ด้วยข้อมูลใหม่
    let result
    if (squadIds && squadIds.length > 0) {
      const created = await prisma.schedule.createMany({
        data: squadIds.map(squadId => ({
          activityId: targetActivityId,
          campId: targetCampId,
          squadId,
          date: targetDate,
          slot: targetSlot,
        })),
        skipDuplicates: true
      })

      // ดึงข้อมูลใหม่กลับมาส่ง response
      const newSchedules = await prisma.schedule.findMany({
        where: {
          activityId: targetActivityId,
          date: targetDate,
          slot: targetSlot,
          campId: targetCampId,
        },
        include: {
          activity: true,
          squad: { include: { troop: true } },
        }
      })

      result = {
        id: newSchedules[0]?.id,
        activityId: targetActivityId,
        date: targetDate,
        slot: targetSlot,
        campId: targetCampId,
        squadIds: newSchedules.map(s => s.squad?.id).filter(Boolean),
        squads: newSchedules.map(s => s.squad).filter(Boolean),
        count: created.count,
      }
    } else {
      const newSchedule = await prisma.schedule.create({
        data: {
          activityId: targetActivityId,
          campId: targetCampId,
          date: targetDate,
          slot: targetSlot,
        },
        include: { activity: true, camp: true }
      })
      result = { ...newSchedule, squadIds: [] }
    }

    res.json(result)
  } catch (error) {
    console.error('Error updating schedule:', error)
    res.status(500).json({ error: error.message })
  }
})

// DELETE /api/schedules/:id — ลบทั้ง group
router.delete('/:id', requireRole('ADMIN', 'CAMP_MANAGER', 'LEADER', 'TROOP_LEADER'), async (req, res) => {
  try {
    const existing = await prisma.schedule.findUnique({ where: { id: req.params.id } })
    if (!existing) return res.status(404).json({ error: 'Schedule not found' })

    // ลบทั้ง group (activityId+date+slot+campId เดียวกัน)
    const deleted = await prisma.schedule.deleteMany({
      where: {
        activityId: existing.activityId,
        date: existing.date,
        slot: existing.slot,
        campId: existing.campId,
      }
    })

    res.json({ message: 'ลบตารางสำเร็จ', count: deleted.count })
  } catch (error) {
    console.error('Error deleting schedule:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
