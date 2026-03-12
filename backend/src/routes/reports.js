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
router.get('/squad/:squadId', requireRole('ADMIN', 'CAMP_MANAGER', 'TROOP_LEADER'), async (req, res) => {
  const squad = await prisma.squad.findUnique({
    where: { id: req.params.squadId },
    include: {
      scouts: {
        include: { attendances: { include: { activity: true } } }
      },
      troop: { include: { camp: true } }
    }
  })
  const activities = await prisma.activity.findMany()
  res.json({ squad, activities })
})

export default router
