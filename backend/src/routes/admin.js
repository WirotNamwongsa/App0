import { Router } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../lib/prisma.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { createError } from '../middleware/errorHandler.js'

const router = Router()
router.use(authenticate, requireRole('ADMIN'))

// GET /api/admin/accounts
router.get('/accounts', async (req, res) => {
  const users = await prisma.user.findMany({
<<<<<<< HEAD
    select: { id: true, username: true, role: true, name: true, campId: true, camp: true, leadingSquad: true, staffActivity: true, scoutAccount: { select: { id: true, squadId: true, firstName: true, lastName: true } } },
=======
    select: { id: true, username: true, role: true, name: true, campId: true, camp: true, leadingSquad: true, staffActivity: true },
>>>>>>> 257707a (first commit)
    orderBy: { role: 'asc' }
  })
  res.json(users)
})

// POST /api/admin/accounts
router.post('/accounts', async (req, res) => {
<<<<<<< HEAD
  const { username, password, role, name, campId, activityId, firstName, lastName, nickname, school, province, squadId, phone, email } = req.body
=======
  const { username, password, role, name, campId, activityId, firstName, lastName, nickname, school, province } = req.body
>>>>>>> 257707a (first commit)
  const hashed = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { username, password: hashed, role, name, campId: campId || null }
  })

  // ถ้า role เป็น SCOUT สร้าง Scout record อัตโนมัติ
  if (role === 'SCOUT') {
    const scoutCode = `SC${Date.now().toString().slice(-6)}`
    // แยกชื่อ-นามสกุลจาก name ถ้าไม่ได้ส่งมา
    const parts = name.trim().split(' ')
    const fName = firstName || parts[0] || name
    const lName = lastName || parts.slice(1).join(' ') || '-'
    await prisma.scout.create({
      data: {
        scoutCode,
        firstName: fName,
        lastName: lName,
        nickname: nickname || fName,
        school: school || '-',
        province: province || '-',
<<<<<<< HEAD
        phone: phone || null,
        email: email || null,
        squadId: squadId || null,
=======
        squadId: null,
>>>>>>> 257707a (first commit)
        userId: user.id
      }
    })
  }

  // ถ้า role เป็น STAFF ให้ผูก activityId
  if (role === 'STAFF' && activityId) {
    await prisma.activity.update({
      where: { id: activityId },
      data: { staffId: user.id }
    })
  }

  const { password: _, ...safe } = user
  res.status(201).json(safe)
})

// PATCH /api/admin/accounts/:id
router.patch('/accounts/:id', async (req, res) => {
<<<<<<< HEAD
  const { name, role, campId, activityId, password, squadId } = req.body
=======
  const { name, role, campId, activityId, password } = req.body
>>>>>>> 257707a (first commit)
  const data = { name, role, campId: campId || null }
  if (password) data.password = await bcrypt.hash(password, 10)
  const user = await prisma.user.update({ where: { id: req.params.id }, data })

<<<<<<< HEAD
  // ถ้า role เป็น SCOUT ให้อัปเดต squadId ใน Scout ด้วย
  if (role === 'SCOUT') {
    await prisma.scout.updateMany({
      where: { userId: req.params.id },
      data: { squadId: squadId || null }
    })
  }

  // ถ้า role เป็น STAFF ให้ผูก activityId ผ่าน Activity.staffId
  if (role === 'STAFF') {
=======
  // ถ้า role เป็น STAFF ให้ผูก activityId ผ่าน Activity.staffId
  if (role === 'STAFF') {
    // เคลียร์ activity เดิมที่ผูกกับ user นี้ก่อน
>>>>>>> 257707a (first commit)
    await prisma.activity.updateMany({
      where: { staffId: req.params.id },
      data: { staffId: null }
    })
<<<<<<< HEAD
=======
    // ผูก activity ใหม่
>>>>>>> 257707a (first commit)
    if (activityId) {
      await prisma.activity.update({
        where: { id: activityId },
        data: { staffId: req.params.id }
      })
    }
  }

  const { password: _, ...safe } = user
  res.json(safe)
})

// DELETE /api/admin/accounts/:id
router.delete('/accounts/:id', async (req, res) => {
  // ลบ Scout record ที่ผูกกับ user นี้ก่อน
  await prisma.scout.deleteMany({ where: { userId: req.params.id } })
  // ลบ activity staffId ที่ผูกอยู่
  await prisma.activity.updateMany({ where: { staffId: req.params.id }, data: { staffId: null } })
  await prisma.user.delete({ where: { id: req.params.id } })
  res.json({ message: 'ลบบัญชีสำเร็จ' })
})

// GET /api/admin/audit
router.get('/audit', async (req, res) => {
  const { role, from, to, limit = 50, skip = 0 } = req.query
  const where = {}
  if (role) where.user = { role }
  if (from || to) {
    where.createdAt = {}
    if (from) where.createdAt.gte = new Date(from)
    if (to) where.createdAt.lte = new Date(to)
  }
  const logs = await prisma.auditLog.findMany({
    where,
    include: { user: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: 'desc' },
    take: parseInt(limit),
    skip: parseInt(skip)
  })
  res.json(logs)
})

// POST /api/admin/import-scouts - import CSV/JSON
router.post('/import-scouts', async (req, res) => {
  const { scouts } = req.body // [{ firstName, lastName, scoutCode?, school, province, ... }]
  if (!Array.isArray(scouts)) throw createError(400, 'ข้อมูลต้องเป็น array')
  
  const results = []
  for (const s of scouts) {
    const scoutCode = s.scoutCode || `SC${Date.now()}${Math.random().toString(36).substr(2,4).toUpperCase()}`
    const scout = await prisma.scout.upsert({
      where: { scoutCode },
      create: { ...s, scoutCode },
      update: s
    })
    results.push(scout)
  }
  res.status(201).json({ count: results.length, scouts: results })
})

export default router