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

export default router
