import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { createError } from '../middleware/errorHandler.js'
import { logAudit } from '../lib/audit.js'

const router = Router()
router.use(authenticate)

// GET /api/camps
router.get('/', requireRole('ADMIN'), async (req, res) => {
<<<<<<< HEAD
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
=======
  const camps = await prisma.camp.findMany({ include: { _count: { select: { troops: true } } } })
>>>>>>> 257707a (first commit)
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

// POST /api/camps - Admin สร้างค่าย (พร้อมกอง 1 กอง และหมู่ 4 หมู่)
router.post('/', requireRole('ADMIN'), async (req, res) => {
  const { name } = req.body
  
  const camp = await prisma.camp.create({ data: { name } })
  
  // สร้างกองแรกของค่าย
  const troop = await prisma.troop.create({
    data: { 
      name: `กองที่ 1`, 
      number: 1, 
      campId: camp.id 
    }
  })
  
  // สร้างหมู่ 4 หมู่สำหรับกองแรก
  const squads = []
  for (let i = 1; i <= 4; i++) {
    const squad = await prisma.squad.create({
      data: {
        name: `หมู่ที่ ${i}`,
        number: i,
        troopId: troop.id
      }
    })
    squads.push(squad)
  }
  
  await logAudit({ 
    userId: req.user.id, 
    action: 'CREATE_CAMP_WITH_STRUCTURE', 
    target: camp.id, 
    after: { camp, troop, squads } 
  })
  
  res.status(201).json({ camp, troop, squads })
})

// POST /api/camps/:campId/troops - สร้างกอง (พร้อมหมู่ 4 หมู่)
router.post('/:campId/troops', requireRole('ADMIN', 'CAMP_MANAGER'), async (req, res) => {
  const { name, number } = req.body
  
  const troop = await prisma.troop.create({ 
    data: { 
      name, 
      number: parseInt(number), 
      campId: req.params.campId 
    }
  })
  
  // สร้างหมู่ 4 หมู่สำหรับกองใหม่
  const squads = []
  for (let i = 1; i <= 4; i++) {
    const squad = await prisma.squad.create({
      data: {
        name: `หมู่ที่ ${i}`,
        number: i,
        troopId: troop.id
      }
    })
    squads.push(squad)
  }
  
  await logAudit({ 
    userId: req.user.id, 
    action: 'CREATE_TROOP_WITH_SQUADS', 
    target: troop.id, 
    after: { troop, squads }
  })
  
  res.status(201).json({ troop, squads })
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

// DELETE /api/camps/:campId/troops/:troopId - ลบกอง (พร้อมหมู่ทั้งหมด)
router.delete('/:campId/troops/:troopId', requireRole('ADMIN', 'CAMP_MANAGER'), async (req, res) => {
  const troop = await prisma.troop.findUnique({
    where: { id: req.params.troopId },
    include: { squads: true }
  })
  
  if (!troop) throw createError(404, 'ไม่พบกอง')
  
  // ลบหมู่ทั้งหมดในกอง (cascade delete จะลบ scouts ในหมู่เหล่านั้นด้วย)
  await prisma.squad.deleteMany({
    where: { troopId: req.params.troopId }
  })
  
  // ลบกอง
  await prisma.troop.delete({ where: { id: req.params.troopId } })
  
  await logAudit({ 
    userId: req.user.id, 
    action: 'DELETE_TROOP_WITH_SQUADS', 
    target: req.params.troopId, 
    before: troop 
  })
  
  res.json({ message: 'ลบกองและหมู่ทั้งหมดสำเร็จ' })
})

<<<<<<< HEAD

// DELETE /api/camps/:campId - ลบค่าย (พร้อมกองและหมู่ทั้งหมด)
router.delete('/:campId', requireRole('ADMIN'), async (req, res) => {
  const camp = await prisma.camp.findUnique({
    where: { id: req.params.campId },
    include: { 
      troops: { 
        include: { squads: true } 
      } 
    }
  })
  
  if (!camp) throw createError(404, 'ไม่พบค่าย')
  
  // ลบ Schedule ทั้งหมดในค่าย
  await prisma.schedule.deleteMany({
    where: { campId: req.params.campId }
  })
  
  // ลบหมู่ทั้งหมดในทุกกองของค่าย
  await prisma.squad.deleteMany({
    where: { 
      troop: { campId: req.params.campId } 
    }
  })
  
  // ลบกองทั้งหมดในค่าย
  await prisma.troop.deleteMany({
    where: { campId: req.params.campId }
  })
  
  // ลบค่าย
  await prisma.camp.delete({ where: { id: req.params.campId } })
  
  await logAudit({ 
    userId: req.user.id, 
    action: 'DELETE_CAMP_WITH_STRUCTURE', 
    target: req.params.campId, 
    before: camp 
  })
  
  res.json({ message: 'ลบค่ายและกอง/หมู่ทั้งหมดสำเร็จ' })
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
=======
export default router
>>>>>>> 257707a (first commit)
