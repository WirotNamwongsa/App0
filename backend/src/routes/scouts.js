import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { createError } from '../middleware/errorHandler.js'
import { logAudit } from '../lib/audit.js'
import QRCode from 'qrcode'

const router = Router()
router.use(authenticate)

// GET /api/scouts/my - ลูกเสือดูข้อมูลตัวเอง
router.get('/my', requireRole('SCOUT'), async (req, res) => {
  const scout = await prisma.scout.findUnique({
    where: { userId: req.user.id },
    include: {
      squad: { include: { troop: { include: { camp: true } } } },
      attendances: { include: { activity: true } }
    }
  })
  if (!scout) throw createError(404, 'ไม่พบข้อมูลลูกเสือ')
  res.json(scout)
})

// GET /api/scouts/my/qr - QR Code ลูกเสือ
router.get('/my/qr', requireRole('SCOUT'), async (req, res) => {
  const scout = await prisma.scout.findUnique({ where: { userId: req.user.id } })
  if (!scout) throw createError(404, 'ไม่พบข้อมูลลูกเสือ')
  const qr = await QRCode.toDataURL(scout.scoutCode)
  res.json({ qr, scoutCode: scout.scoutCode })
})

// GET /api/scouts - Admin / Camp Manager
router.get('/', requireRole('ADMIN', 'CAMP_MANAGER'), async (req, res) => {
  const { campId, squadId, unassigned } = req.query
  const where = {}
  if (req.user.role === 'CAMP_MANAGER') {
    // Camp manager: only scouts in their camp
    const squads = await prisma.squad.findMany({
      where: { troop: { campId: req.user.campId } },
      select: { id: true }
    })
    where.squadId = { in: squads.map(s => s.id) }
  }
  if (squadId) where.squadId = squadId
  if (unassigned === 'true') where.squadId = null

  const scouts = await prisma.scout.findMany({
    where,
    include: { squad: { include: { troop: { include: { camp: true } } } } },
    orderBy: { createdAt: 'asc' }
  })
  res.json(scouts)
})

// GET /api/scouts/:id
router.get('/:id', requireRole('ADMIN', 'CAMP_MANAGER', 'TROOP_LEADER'), async (req, res) => {
  const scout = await prisma.scout.findUnique({
    where: { id: req.params.id },
    include: {
      squad: { include: { troop: { include: { camp: true } } } },
      attendances: { include: { activity: true } }
    }
  })
  if (!scout) throw createError(404, 'ไม่พบลูกเสือ')
  res.json(scout)
})

// PATCH /api/scouts/:id - แก้ไขข้อมูลส่วนตัว (Leader, Camp, Admin)
router.patch('/:id', requireRole('ADMIN', 'CAMP_MANAGER', 'TROOP_LEADER'), async (req, res) => {
  const { firstName, lastName, nickname, birthDate, school, province, phone, email } = req.body
  const before = await prisma.scout.findUnique({ where: { id: req.params.id } })
  if (!before) throw createError(404, 'ไม่พบลูกเสือ')

  const updated = await prisma.scout.update({
    where: { id: req.params.id },
    data: { firstName, lastName, nickname, birthDate: birthDate ? new Date(birthDate) : undefined, school, province, phone, email }
  })
  await logAudit({ userId: req.user.id, action: 'UPDATE_SCOUT_PROFILE', target: req.params.id, before, after: updated })
  res.json(updated)
})

// POST /api/scouts - สร้างลูกเสือใหม่ (Camp, Admin)
router.post('/', requireRole('ADMIN', 'CAMP_MANAGER'), async (req, res) => {
  const { firstName, lastName, nickname, school, province, phone, email, squadId } = req.body
  const scoutCode = `SC${Date.now()}`
  const scout = await prisma.scout.create({
    data: { scoutCode, firstName, lastName, nickname, school, province, phone, email, squadId: squadId || null }
  })
  await logAudit({ userId: req.user.id, action: 'CREATE_SCOUT', target: scout.id, after: scout })
  res.status(201).json(scout)
})

// PATCH /api/scouts/:id/move - ย้ายหมู่
router.patch('/:id/move', requireRole('ADMIN', 'CAMP_MANAGER'), async (req, res) => {
  const { squadId } = req.body
  const before = await prisma.scout.findUnique({ where: { id: req.params.id } })
  const updated = await prisma.scout.update({ where: { id: req.params.id }, data: { squadId } })
  await logAudit({ userId: req.user.id, action: 'MOVE_SCOUT', target: req.params.id, before: { squadId: before.squadId }, after: { squadId } })
  res.json(updated)
})

// DELETE /api/scouts/:id
router.delete('/:id', requireRole('ADMIN', 'CAMP_MANAGER'), async (req, res) => {
  await prisma.scout.delete({ where: { id: req.params.id } })
  res.json({ message: 'ลบสำเร็จ' })
})

export default router
