import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { createError } from '../middleware/errorHandler.js'
import { logAudit } from '../lib/audit.js'

const router = Router()
router.use(authenticate)

// GET /api/camps
router.get('/', requireRole('ADMIN'), async (req, res) => {
  const camps = await prisma.camp.findMany({
    include: {
      troops: {
        include: {
          squads: {
            include: {
              _count: { select: { scouts: true } }
            }
          }
        }
      }
    }
  })
  res.json(camps)
})

// GET /api/camps/my - Camp Manager ดูค่ายตัวเอง
router.get('/my', requireRole('ADMIN', 'CAMP_MANAGER'), async (req, res) => {
  const campId = req.user.role === 'ADMIN' ? req.query.campId : req.user.campId
  if (!campId) throw createError(400, 'ไม่พบ campId')
  const camp = await prisma.camp.findUnique({
    where: { id: campId },
    include: {
      troops: {
        include: {
          squads: {
            include: {
              leader: { select: { id: true, name: true } },
              _count: { select: { scouts: true } }
            }
          }
        }
      }
    }
  })
  if (!camp) throw createError(404, 'ไม่พบค่าย')
  res.json(camp)
})

// POST /api/camps - Admin สร้างค่าย
router.post('/', requireRole('ADMIN'), async (req, res) => {
  const camp = await prisma.camp.create({ data: { name: req.body.name } })
  res.status(201).json(camp)
})

// POST /api/camps/:campId/troops - สร้างกอง
router.post('/:campId/troops', requireRole('ADMIN', 'CAMP_MANAGER'), async (req, res) => {
  const { name, number } = req.body
  const troop = await prisma.troop.create({ data: { name, number: parseInt(number), campId: req.params.campId } })
  await logAudit({ userId: req.user.id, action: 'CREATE_TROOP', target: troop.id, after: troop })
  res.status(201).json(troop)
})

// POST /api/camps/:campId/troops/:troopId/squads - สร้างหมู่
router.post('/:campId/troops/:troopId/squads', requireRole('ADMIN', 'CAMP_MANAGER'), async (req, res) => {
  const { name, number, leaderId } = req.body
  const squad = await prisma.squad.create({
    data: { name, number: parseInt(number), troopId: req.params.troopId, leaderId: leaderId || null }
  })
  await logAudit({ userId: req.user.id, action: 'CREATE_SQUAD', target: squad.id, after: squad })
  res.status(201).json(squad)
})

// PATCH /api/camps/:campId/squads/:squadId - แก้ไขหมู่
router.patch('/:campId/squads/:squadId', requireRole('ADMIN', 'CAMP_MANAGER'), async (req, res) => {
  const { name, leaderId } = req.body
  const squad = await prisma.squad.update({
    where: { id: req.params.squadId },
    data: { name, leaderId: leaderId || null }
  })
  await logAudit({ userId: req.user.id, action: 'UPDATE_SQUAD', target: squad.id, after: squad })
  res.json(squad)
})

// DELETE /api/camps/:campId/troops/:troopId - ลบกอง
router.delete('/:campId/troops/:troopId', requireRole('ADMIN', 'CAMP_MANAGER'), async (req, res) => {
  await prisma.troop.delete({ where: { id: req.params.troopId } })
  res.json({ message: 'ลบกองสำเร็จ' })
})


// DELETE /api/camps/:campId - ลบค่าย
router.delete('/:campId', requireRole('ADMIN'), async (req, res) => {
  await prisma.camp.delete({ where: { id: req.params.campId } })
  res.json({ message: 'ลบค่ายสำเร็จ' })
})

// DELETE /api/camps/:campId/squads/:squadId - ลบหมู่
router.delete('/:campId/squads/:squadId', requireRole('ADMIN', 'CAMP_MANAGER'), async (req, res) => {
  await prisma.squad.delete({ where: { id: req.params.squadId } })
  res.json({ message: 'ลบหมู่สำเร็จ' })
})

// PATCH /api/camps/scouts/:scoutId/move - ย้ายลูกเสือไปหมู่อื่น
router.patch('/scouts/:scoutId/move', requireRole('ADMIN', 'CAMP_MANAGER'), async (req, res) => {
  const { squadId } = req.body
  const scout = await prisma.scout.update({
    where: { id: req.params.scoutId },
    data: { squadId: squadId || null }
  })
  await logAudit({ userId: req.user.id, action: 'MOVE_SCOUT', target: scout.id, after: scout })
  res.json(scout)
})

// GET /api/camps/:campId/scouts - ดูลูกเสือในค่าย
router.get('/:campId/scouts', requireRole('ADMIN', 'CAMP_MANAGER'), async (req, res) => {
  const scouts = await prisma.scout.findMany({
    where: { squad: { troop: { campId: req.params.campId } } },
    include: { squad: { include: { troop: true } } }
  })
  res.json(scouts)
})

export default router

// เพิ่ม endpoints ที่ขาดอยู่ก่อน export default