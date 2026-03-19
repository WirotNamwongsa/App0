import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { createError } from '../middleware/errorHandler.js'
import { logAudit } from '../lib/audit.js'
import { z } from 'zod'

const router = Router()
router.use(authenticate)

// สร้าง schema สำหรับ validation
const createActivityGroupSchema = z.object({
  name: z.string().min(1, 'ชื่อกลุ่มกิจกรรมต้องไม่ว่าง'),
  description: z.string().optional(),
  maxScouts: z.number().int().min(1).optional(),
})

const updateActivityGroupSchema = z.object({
  name: z.string().min(1, 'ชื่อกลุ่มกิจกรรมต้องไม่ว่าง').optional(),
  description: z.string().optional(),
  maxScouts: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
  managerId: z.string().uuid().optional(),
})

// GET /api/activity-groups - ดูรายการกลุ่มกิจกรรม (Camp Manager, Admin)
router.get('/', requireRole('ADMIN', 'CAMP_MANAGER'), async (req, res) => {
  const campId = req.user.role === 'ADMIN' ? req.query.campId : req.user.campId
  if (!campId) throw createError(400, 'ไม่พบ campId')

  const activityGroups = await prisma.activityGroup.findMany({
    where: { campId },
    include: {
      manager: { select: { id: true, name: true } },
      squads: {
        include: {
          troop: { select: { name: true, number: true } },
          _count: { select: { scouts: true } }
        }
      },
      _count: { select: { squads: true } }
    },
    orderBy: { createdAt: 'desc' }
  })

  res.json(activityGroups)
})

// GET /api/activity-groups/:id - ดูข้อมูลกลุ่มกิจกรรม
router.get('/:id', requireRole('ADMIN', 'CAMP_MANAGER', 'STAFF'), async (req, res) => {
  const { id } = req.params
  
  const activityGroup = await prisma.activityGroup.findUnique({
    where: { id },
    include: {
      camp: { select: { id: true, name: true } },
      manager: { select: { id: true, name: true } },
      squads: {
        include: {
          troop: { select: { name: true, number: true } },
          leader: { select: { id: true, name: true } },
          scouts: {
            select: { id: true, scoutCode: true, firstName: true, lastName: true, nickname: true }
          }
        }
      }
    }
  })

  if (!activityGroup) throw createError(404, 'ไม่พบกลุ่มกิจกรรม')
  
  // ตรวจสอบสิทธิ์
  if (req.user.role === 'CAMP_MANAGER' && activityGroup.campId !== req.user.campId) {
    throw createError(403, 'ไม่มีสิทธิ์ดูข้อมูลกลุ่มกิจกรรมนี้')
  }

  res.json(activityGroup)
})

// POST /api/activity-groups - สร้างกลุ่มกิจกรรม (Camp Manager)
router.post('/', requireRole('ADMIN', 'CAMP_MANAGER'), async (req, res) => {
  const campId = req.user.role === 'ADMIN' ? req.body.campId : req.user.campId
  if (!campId) throw createError(400, 'ไม่พบ campId')

  const validatedData = createActivityGroupSchema.parse(req.body)

  const activityGroup = await prisma.activityGroup.create({
    data: {
      ...validatedData,
      campId,
    },
    include: {
      camp: { select: { name: true } },
      manager: { select: { name: true } }
    }
  })

  await logAudit({
    userId: req.user.id,
    action: 'CREATE_ACTIVITY_GROUP',
    target: `ActivityGroup:${activityGroup.id}`,
    before: null,
    after: JSON.stringify(activityGroup)
  })

  res.status(201).json(activityGroup)
})

// PUT /api/activity-groups/:id - แก้ไขกลุ่มกิจกรรม (Camp Manager)
router.put('/:id', requireRole('ADMIN', 'CAMP_MANAGER'), async (req, res) => {
  const { id } = req.params
  const validatedData = updateActivityGroupSchema.parse(req.body)

  const existing = await prisma.activityGroup.findUnique({ where: { id } })
  if (!existing) throw createError(404, 'ไม่พบกลุ่มกิจกรรม')

  if (req.user.role === 'CAMP_MANAGER' && existing.campId !== req.user.campId) {
    throw createError(403, 'ไม่มีสิทธิ์แก้ไขกลุ่มกิจกรรมนี้')
  }

  const activityGroup = await prisma.activityGroup.update({
    where: { id },
    data: validatedData,
    include: {
      camp: { select: { name: true } },
      manager: { select: { name: true } }
    }
  })

  await logAudit({
    userId: req.user.id,
    action: 'UPDATE_ACTIVITY_GROUP',
    target: `ActivityGroup:${id}`,
    before: JSON.stringify(existing),
    after: JSON.stringify(activityGroup)
  })

  res.json(activityGroup)
})

// DELETE /api/activity-groups/:id - ลบกลุ่มกิจกรรม (Camp Manager)
router.delete('/:id', requireRole('ADMIN', 'CAMP_MANAGER'), async (req, res) => {
  const { id } = req.params

  const existing = await prisma.activityGroup.findUnique({ 
    where: { id },
    include: { _count: { select: { squads: true } } }
  })
  
  if (!existing) throw createError(404, 'ไม่พบกลุ่มกิจกรรม')

  if (req.user.role === 'CAMP_MANAGER' && existing.campId !== req.user.campId) {
    throw createError(403, 'ไม่มีสิทธิ์ลบกลุ่มกิจกรรมนี้')
  }

  if (existing._count.squads > 0) {
    throw createError(400, 'ไม่สามารถลบกลุ่มกิจกรรมที่มีหมู่อยู่ได้')
  }

  await prisma.activityGroup.delete({ where: { id } })

  await logAudit({
    userId: req.user.id,
    action: 'DELETE_ACTIVITY_GROUP',
    target: `ActivityGroup:${id}`,
    before: JSON.stringify(existing),
    after: null
  })

  res.json({ message: 'ลบกลุ่มกิจกรรมสำเร็จ' })
})

// POST /api/activity-groups/:id/assign-squad - จัดหมู่เข้ากลุ่มกิจกรรม (Staff)
router.post('/:id/assign-squad', requireRole('ADMIN', 'CAMP_MANAGER', 'STAFF'), async (req, res) => {
  const { id } = req.params
  const { squadId } = req.body

  if (!squadId) throw createError(400, 'ต้องระบุ squadId')

  const activityGroup = await prisma.activityGroup.findUnique({ where: { id } })
  if (!activityGroup) throw createError(404, 'ไม่พบกลุ่มกิจกรรม')

  const squad = await prisma.squad.findUnique({
    where: { id: squadId },
    include: { troop: true }
  })
  
  if (!squad) throw createError(404, 'ไม่พบหมู่')

  // ตรวจสอบว่าอยู่ในค่ายเดียวกัน
  if (squad.troop.campId !== activityGroup.campId) {
    throw createError(400, 'หมู่ไม่ได้อยู่ในค่ายเดียวกับกลุ่มกิจกรรม')
  }

  // ตรวจสอบว่ามีหมู่นี้ในกลุ่มอื่นหรือไม่
  const existingAssignment = await prisma.squad.findFirst({
    where: { 
      id: squadId,
      activityGroupId: { not: null }
    }
  })

  if (existingAssignment) {
    throw createError(400, 'หมู่นี้อยู่ในกลุ่มกิจกรรมอื่นแล้ว')
  }

  // ตรวจสอบจำนวนลูกเสือถ้ามีการกำหนด maxScouts
  if (activityGroup.maxScouts) {
    const currentScouts = await prisma.squad.count({
      where: { activityGroupId: id }
    })
    
    const squadScoutCount = await prisma.scout.count({
      where: { squadId }
    })

    if (currentScouts + squadScoutCount > activityGroup.maxScouts) {
      throw createError(400, `จำนวนลูกเสือเกินจำนวนที่กำหนด (${activityGroup.maxScouts})`)
    }
  }

  const updatedSquad = await prisma.squad.update({
    where: { id: squadId },
    data: { activityGroupId: id },
    include: {
      troop: { select: { name: true, number: true } },
      activityGroup: { select: { name: true } }
    }
  })

  await logAudit({
    userId: req.user.id,
    action: 'ASSIGN_SQUAD_TO_ACTIVITY_GROUP',
    target: `Squad:${squadId}`,
    before: JSON.stringify({ activityGroupId: squad.activityGroupId }),
    after: JSON.stringify({ activityGroupId: id })
  })

  res.json(updatedSquad)
})

// DELETE /api/activity-groups/:id/remove-squad/:squadId - ถอนหมู่จากกลุ่มกิจกรรม (Staff)
router.delete('/:id/remove-squad/:squadId', requireRole('ADMIN', 'CAMP_MANAGER', 'STAFF'), async (req, res) => {
  const { id, squadId } = req.params

  const activityGroup = await prisma.activityGroup.findUnique({ where: { id } })
  if (!activityGroup) throw createError(404, 'ไม่พบกลุ่มกิจกรรม')

  const squad = await prisma.squad.findUnique({ where: { id: squadId } })
  if (!squad) throw createError(404, 'ไม่พบหมู่')

  if (squad.activityGroupId !== id) {
    throw createError(400, 'หมู่นี้ไม่ได้อยู่ในกลุ่มกิจกรรมนี้')
  }

  const updatedSquad = await prisma.squad.update({
    where: { id: squadId },
    data: { activityGroupId: null },
    include: {
      troop: { select: { name: true, number: true } }
    }
  })

  await logAudit({
    userId: req.user.id,
    action: 'REMOVE_SQUAD_FROM_ACTIVITY_GROUP',
    target: `Squad:${squadId}`,
    before: JSON.stringify({ activityGroupId: id }),
    after: JSON.stringify({ activityGroupId: null })
  })

  res.json(updatedSquad)
})

export default router
