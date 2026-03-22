import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import prisma from '../lib/prisma.js'

const router = Router()
router.use(authenticate)

// GET /api/squads/my-squad - หาหมู่ที่ผู้กำกับดูแล
router.get('/my-squad', async (req, res) => {
  try {
    if (req.user.role !== 'TROOP_LEADER') {
      return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึง' })
    }

    const squad = await prisma.squad.findFirst({
      where: { leaders: { some: { id: req.user.id } } },
      include: {
        troop: { include: { camp: true } },
        scouts: {
          include: { attendances: { include: { activity: true } } }
        }
      }
    })

    if (!squad) {
      return res.json(null)
    }

    res.json(squad)
  } catch (error) {
    console.error('Error in /my-squad:', error)
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลหมู่' })
  }
})

export default router
