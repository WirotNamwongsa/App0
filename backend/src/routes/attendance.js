import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { createError } from '../middleware/errorHandler.js'

const router = Router()
router.use(authenticate)

// POST /api/attendance/scan - ผู้จัดกิจกรรมสแกน QR
router.post('/scan', requireRole('ADMIN', 'STAFF'), async (req, res) => {
  const { scoutCode, result = 'PASS', forceRecord = false } = req.body
  if (!scoutCode) throw createError(400, 'กรุณาระบุ scoutCode')

  // หา staff activity
  const staffUser = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { staffActivity: true }
  })
  const activityId = req.user.role === 'ADMIN' ? req.body.activityId : staffUser?.staffActivity?.id
  if (!activityId) throw createError(400, 'ไม่พบกิจกรรมที่รับผิดชอบ')

  // หาลูกเสือ
  const scout = await prisma.scout.findUnique({
    where: { scoutCode },
    include: { squad: { include: { troop: true } } }
  })
  if (!scout) throw createError(404, 'ไม่พบลูกเสือ')

  // เช็คสแกนซ้ำ
  const existing = await prisma.attendance.findUnique({
    where: { scoutId_activityId: { scoutId: scout.id, activityId } }
  })
  if (existing) {
    return res.status(200).json({ status: 'duplicate', message: 'สแกนซ้ำ', attendance: existing, scout })
  }

  // เช็คตาราง
  const inSchedule = await checkInSchedule(scout, activityId)
  
  if (!inSchedule && !forceRecord) {
    return res.status(200).json({ status: 'out_of_schedule', message: 'ลูกเสือนอกตาราง', scout })
  }

  const attendance = await prisma.attendance.create({
    data: {
      scoutId: scout.id,
      activityId,
      result,
      outOfSchedule: !inSchedule,
      scannedBy: req.user.id
    }
  })
  res.status(201).json({ status: 'success', attendance, scout })
})

async function checkInSchedule(scout, activityId) {
  if (!scout.squadId) return false
  const schedule = await prisma.schedule.findFirst({
    where: {
      activityId,
      OR: [
        { squadId: scout.squadId },
        { squadId: null, campId: scout.squad?.troop?.campId }
      ]
    }
  })
  return !!schedule
}

// GET /api/attendance?activityId=&scoutId=
router.get('/', authenticate, async (req, res) => {
  const { activityId, scoutId } = req.query
  const where = {}
  if (activityId) where.activityId = activityId
  if (scoutId) where.scoutId = scoutId

  const records = await prisma.attendance.findMany({
    where,
    include: {
      scout: { include: { squad: { include: { troop: true } } } },
      activity: true
    },
    orderBy: { scannedAt: 'desc' }
  })
  res.json(records)
})

// GET /api/attendance/stats/:activityId - สถิติกิจกรรม
router.get('/stats/:activityId', authenticate, async (req, res) => {
  const { activityId } = req.params
  const [total, scanned, scheduled] = await Promise.all([
    prisma.scout.count(),
    prisma.attendance.count({ where: { activityId } }),
    prisma.schedule.findMany({ where: { activityId }, include: { squad: { include: { _count: { select: { scouts: true } } } } } })
  ])
  const scheduledCount = scheduled.reduce((sum, s) => sum + (s.squad?._count?.scouts || 0), 0)
  res.json({ total, scanned, scheduled: scheduledCount })
})

// GET /api/attendance/schedule/:scheduleId/participants
router.get('/schedule/:scheduleId/participants', authenticate, async (req, res, next) => {
  try {
    const { scheduleId } = req.params

    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        activity: true,
        camp: true,
        squad: { include: { troop: true } },
        activityGroup: {
          include: {
            squads: { include: { troop: true } }  // ✅ ดึงทุกหมู่ในกลุ่มกิจกรรม
          }
        }
      }
    })

    if (!schedule) throw createError(404, 'ไม่พบตารางกิจกรรม')

    let participants = []

    if (schedule.activityGroupId && schedule.activityGroup) {
      // ✅ กิจกรรมระดับกลุ่ม — ดึงลูกเสือทุกหมู่ในกลุ่ม
      const squadIds = schedule.activityGroup.squads.map(s => s.id)

      const scouts = await prisma.scout.findMany({
        where: { squadId: { in: squadIds } },
        include: {
          squad: { include: { troop: true } },
          attendances: {
            where: { activityId: schedule.activityId }
          }
        },
        orderBy: { firstName: 'asc' }
      })

      participants = scouts.map(scout => ({
        ...scout,
        status: scout.attendances.length > 0 ? 'scanned' : 'not_scanned',
        scannedAt: scout.attendances[0]?.scannedAt || null
      }))

    } else if (schedule.squadId) {
      // กิจกรรมระดับหมู่เดียว
      const scouts = await prisma.scout.findMany({
        where: { squadId: schedule.squadId },
        include: {
          squad: { include: { troop: true } },
          attendances: {
            where: { activityId: schedule.activityId }
          }
        }
      })

      participants = scouts.map(scout => ({
        ...scout,
        status: scout.attendances.length > 0 ? 'scanned' : 'not_scanned',
        scannedAt: scout.attendances[0]?.scannedAt || null
      }))

    } else if (schedule.campId) {
      // กิจกรรมระดับค่าย
      const scouts = await prisma.scout.findMany({
        where: { squad: { troop: { campId: schedule.campId } } },
        include: {
          squad: { include: { troop: true } },
          attendances: {
            where: { activityId: schedule.activityId }
          }
        }
      })

      participants = scouts.map(scout => ({
        ...scout,
        status: scout.attendances.length > 0 ? 'scanned' : 'not_scanned',
        scannedAt: scout.attendances[0]?.scannedAt || null
      }))
    }

    // เรียงลำดับ scanned ก่อน
    participants.sort((a, b) => {
      if (a.status === 'scanned' && b.status !== 'scanned') return -1
      if (a.status !== 'scanned' && b.status === 'scanned') return 1
      return 0
    })

    const stats = {
      total: participants.length,
      scanned: participants.filter(p => p.status === 'scanned').length,
      notScanned: participants.filter(p => p.status === 'not_scanned').length
    }

    res.json({ schedule, participants, stats })

  } catch (error) {
    console.error('Error in schedule participants:', error)
    next(error)
  }
})

export default router
