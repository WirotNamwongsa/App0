import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

// GET /api/reports/overview - Admin overview
router.get('/overview', requireRole('ADMIN'), async (req, res) => {
  const [totalScouts, totalCamps, todayScans, activities] = await Promise.all([
    prisma.scout.count(),
    prisma.camp.count(),
    prisma.attendance.count({
      where: { scannedAt: { gte: new Date(new Date().setHours(0,0,0,0)) } }
    }),
    prisma.activity.findMany({ include: { _count: { select: { attendances: true } } } })
  ])
  res.json({ totalScouts, totalCamps, todayScans, activities })
})

// GET /api/reports/camp/:campId
router.get('/camp/:campId', requireRole('ADMIN', 'CAMP_MANAGER'), async (req, res) => {
  const campId = req.user.role === 'CAMP_MANAGER' ? req.user.campId : req.params.campId
  
  const camp = await prisma.camp.findUnique({
    where: { id: campId },
    include: {
      troops: {
        include: {
          squads: {
            include: {
              scouts: {
                include: { attendances: { include: { activity: true } } }
              }
            }
          }
        }
      }
    }
  })
  
  const activities = await prisma.activity.findMany()
  
  // สรุปสถิติ
  const allScouts = camp.troops.flatMap(t => t.squads.flatMap(sq => sq.scouts))
  const totalScouts = allScouts.length
  
  const activityStats = activities.map(act => {
    const attended = allScouts.filter(s => s.attendances.some(a => a.activityId === act.id)).length
    return { ...act, attended, total: totalScouts, percentage: totalScouts ? Math.round(attended/totalScouts*100) : 0 }
  })
  
  res.json({ camp, totalScouts, activityStats })
})

// GET /api/reports/squad/:squadId
router.get('/squad/:squadId', authenticate, async (req, res) => {
  const squadId = req.params.squadId
  
  // Check permissions
  if (req.user.role === 'TROOP_LEADER') {
    // ผู้กำกับหมู่สามารถเข้าถึงได้เฉพาะหมู่ที่ตัวเองดูแล
    const mySquad = await prisma.squad.findFirst({
      where: { leaders: { some: { id: req.user.id } } }
    })
    if (!mySquad || mySquad.id !== squadId) {
      return res.status(403).json({ error: 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลหมู่นี้' })
    }
  } else if (req.user.role !== 'ADMIN' && req.user.role !== 'CAMP_MANAGER') {
    return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึง' })
  }
  
  const squad = await prisma.squad.findUnique({
    where: { id: squadId },
    include: {
      scouts: {
        include: { attendances: { include: { activity: true } } }
      },
      troop: { include: { camp: true } }
    }
  })
  
  if (!squad) {
    return res.status(404).json({ error: 'ไม่พบข้อมูลหมู่' })
  }
  
  const activities = await prisma.activity.findMany()
  res.json({ squad, activities })
})

export default router
