import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import prisma from '../lib/prisma.js'

const router = Router()
router.use(authenticate)

// GET /api/squads/available - ดูหมู่ที่ยังไม่มีผู้กำกับ
router.get('/available', async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึง' })
    }

    const squads = await prisma.squad.findMany({
      where: { leaderId: null },
      include: {
        troop: { include: { camp: true } }
      },
      orderBy: { number: 'asc' }
    })

    res.json(squads)
  } catch (error) {
    console.error('Error getting available squads:', error)
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' })
  }
})

// POST /api/squads/assign-leader - กำหนดผู้กำกับให้หมู่
router.post('/assign-leader', async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึง' })
    }

    const { squadId, leaderId } = req.body
    if (!squadId || !leaderId) {
      return res.status(400).json({ error: 'กรุณาระบุ squadId และ leaderId' })
    }

    // ตรวจสอบว่ามีหมู่และผู้กำกับ
    const squad = await prisma.squad.findUnique({
      where: { id: squadId },
      include: { troop: true }
    })

    const leader = await prisma.user.findUnique({
      where: { id: leaderId }
    })

    if (!squad || !leader) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลหมู่หรือผู้กำกับ' })
    }

    if (leader.role !== 'TROOP_LEADER') {
      return res.status(400).json({ error: 'ผู้ใช้นี้ไม่ใช่ผู้กำกับหมู่' })
    }

    // กำหนดผู้กำกับให้หมู่
    const updatedSquad = await prisma.squad.update({
      where: { id: squadId },
      data: { leaderId: leaderId }
    })

    res.json({ 
      message: 'กำหนดผู้กำกับหมู่สำเร็จ',
      squad: updatedSquad
    })
  } catch (error) {
    console.error('Error assigning leader:', error)
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' })
  }
})

export default router
